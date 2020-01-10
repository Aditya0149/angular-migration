
(function () {
    'use strict';

    angular
        .module('cloudlex.events')
        .factory('eventsDataService', eventsDataService);

    eventsDataService.$inject = ["$http", "$q", "globalConstants"];

    function eventsDataService($http, $q, globalConstants) {

        var serviceBase = {};
        //API URL Constants
        serviceBase.GET_EVENTS = globalConstants.webServiceBase + "lexviacalendar/lexviacalendar/[ID].json";
        serviceBase.GET_REMINDER = globalConstants.webServiceBase + "matter/eventreminder?";
        serviceBase.DISMISS_EVENT = globalConstants.webServiceBase + "matter/dismissevent/1?";
        // For Events
        if (!globalConstants.useApim) {
            serviceBase.EVENT_HISTORY_EXPORT = globalConstants.javaWebServiceBaseV4 +
                "event/history-export/";//US#5678-download event history    
            serviceBase.GET_EVENTS1 = globalConstants.javaWebServiceBaseV4 + "event/";
            serviceBase.ADD_EVENT1 = globalConstants.javaWebServiceBaseV4 + "event";
            serviceBase.UPDATE_EVENT1 = globalConstants.javaWebServiceBaseV4 + "event/";
            serviceBase.DELETE_EVENT1 = globalConstants.javaWebServiceBaseV4 + "event/";
            serviceBase.GET_SINGLE_EVENT1 = globalConstants.javaWebServiceBaseV4 + "event/get-single-event/";
            serviceBase.EVENT_HISTORY1 = globalConstants.javaWebServiceBaseV4 + "event/history/";
        } else {
            serviceBase.GET_EVENTS1 = globalConstants.matterBase + "events/v1/";
            serviceBase.ADD_EVENT1 = globalConstants.matterBase + "events/v1/";
            serviceBase.UPDATE_EVENT1 = globalConstants.matterBase + "events/v1/";
            serviceBase.DELETE_EVENT1 = globalConstants.matterBase + "events/v1/";
            serviceBase.GET_SINGLE_EVENT1 = globalConstants.matterBase + "events/v1/get-single-event/";
            serviceBase.EVENT_HISTORY1 = globalConstants.matterBase + "events/v1/history/";
            serviceBase.EVENT_HISTORY_EXPORT = globalConstants.matterBase + "events/v1/history-export/";
        }
        // For Tasks
        if (!globalConstants.useApim) {
            serviceBase.GET_TASK_IN_FIRM = globalConstants.javaWebServiceBaseV4 + "task/staffs-in-firm";
        } else {
            serviceBase.GET_TASK_IN_FIRM = globalConstants.matterBase + "task/v1/staffs-in-firm";
        }

        //Matter collaboration
        serviceBase.savePermission = globalConstants.webServiceBase + "Cloudlex-Lite/v1/lite/disable-entity-access";

        var eventsService = {
            getEvents_OFF_DRUPAL: getEvents_OFF_DRUPAL,
            getEvents: getEvents,
            addEvent_OFF_DRUPAL: addEvent_OFF_DRUPAL,
            updateEvent_OFF_DRUPAL: updateEvent_OFF_DRUPAL,
            deleteEvent_OFF_DRUPAL: deleteEvent_OFF_DRUPAL,
            getSingleEvent_OFF_DRUPAL: getSingleEventDetails_OFF_DRUPAL,
            getReminder: getReminder,
            dismissReminder: dismissReminder,
            getEventHistory_OFF_DRUPAL: getEventHistory_OFF_DRUPAL,
            downloadEventHistory: downloadEventHistory,
            getStaffsInFirm: getStaffsInFirm,
            saveEventPermission: saveEventPermission

        };

        return eventsService;

        function getURL(serviceUrl, id, categoryCheck) {
            var url = serviceUrl.replace("[ID]", id).replace("[CAT]", categoryCheck);
            return url;
        }

        function getEvents_OFF_DRUPAL(matterID, sortby) {
            var deferred = $q.defer();
            var url = serviceBase.GET_EVENTS1 + matterID + '?sortby=' + sortby;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                headers: token// Add params into headers
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (response) {
                deferred.reject(response.data);
            });
            return deferred.promise;
        }

        function getEvents(matterID, sortby) {
            var url = getURL(serviceBase.GET_EVENTS, matterID);
            url += '?sortby=' + sortby;
            return $http.get(url,
                {
                    withCredentials: true
                });
        }

        function addEvent_OFF_DRUPAL(event) {
            var deferred = $q.defer();
            var url = serviceBase.ADD_EVENT1;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "POST",
                headers: token,// Add params into headers
                data: event
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (response) {
                deferred.reject(response.data);
            });
            return deferred.promise;

        }

        function updateEvent_OFF_DRUPAL(eventID, event) {
            var deferred = $q.defer();
            var url = serviceBase.UPDATE_EVENT1 + eventID;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "PUT",
                headers: token,// Add params into headers
                data: event
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (response) {
                deferred.reject(response.data);
            });
            return deferred.promise;
        }

        function deleteEvent_OFF_DRUPAL(eventID) {
            var deferred = $q.defer();
            var url = serviceBase.DELETE_EVENT1 + eventID;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "DELETE",
                headers: token// Add params into headers
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (response) {
                deferred.reject(response.data);
            });
            return deferred.promise;
        }

        function getSingleEventDetails_OFF_DRUPAL(eventId, categoryCheck) {
            var deferred = $q.defer();
            var url = serviceBase.GET_SINGLE_EVENT1 + eventId;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                headers: token// Add params into headers
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (response) {
                deferred.reject(response.data);
            });
            return deferred.promise;
        }

        function getReminder(isIntake) {
            var params = {
                todays_date: moment().format('YYYY-MM-DD'),
                full_day_event: utils.getUTCStartFromMoment(moment()),
                timed_event: moment(moment().valueOf()).unix()
            };

            var url = serviceBase.GET_REMINDER + utils.getParams(params);
            if (isIntake) {
                url = url + "&is_intake=1";
            } else {
                url = url + "&is_intake=0";
            }
            return $http.get(url);
        }

        function dismissReminder(reminderids, remindertype, isIntake) {
            var url = serviceBase.DISMISS_EVENT;
            var is_intake = 0;
            if (isIntake) {
                is_intake = 1;
            } else {
                is_intake = 0;
            }
            //url parameter updated for US#5191 : Task Reminder 
            var data = {
                current_utc: moment(moment().valueOf()).unix(),
                event_id: reminderids.eventids,
                taskid: reminderids.taskids,
                is_intake: is_intake
            };
            return $http.put(url, data);
        }

        //US#5678-Get event history data
        function getEventHistory_OFF_DRUPAL(eventId, pageNo, limit) {
            var deferred = $q.defer();
            var url = serviceBase.EVENT_HISTORY1 + eventId + '?' + 'pageNumber=' + pageNo + '&pageSize=' + limit;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                headers: token// Add params into headers
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (response) {
                deferred.reject(response.data);
            });
            return deferred.promise;

        }

        function downloadEventHistory(eventId, pageNo, limit) {
            //by default pageNumber=1 and pageSize = 50
            var exportObj = {};

            exportObj.pageNum = pageNo;
            exportObj.pageSize = limit;
            exportObj.reportname = "Matter_event_history";
            exportObj.filename = "Matter_Event_List.xlsx";
            exportObj.type = "excel";
            exportObj.user = "all-users";
            var url = serviceBase.EVENT_HISTORY_EXPORT + eventId + '?' + 'pageNum=' + pageNo + '&pageSize=' + limit;
            var tz = utils.getTimezone();
            var timeZone = moment.tz.guess();
            url += '&tz=' + timeZone;

            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }

            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                responseType: 'arraybuffer',
                headers: token,
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;


            // var download = window.open(url, '_self');
        }


        function getStaffsInFirm() {
            var deferred = $q.defer();
            var url = serviceBase.GET_TASK_IN_FIRM;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                headers: token// Add params into headers
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (response) {
                deferred.reject(response.data);
            });
            return deferred.promise;
        }

        function saveEventPermission(data) {
            var deferred = $q.defer();
            var url = serviceBase.savePermission;
            var token = {
                'clxAuthToken': localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "PUT",
                data: data,
                headers: token// Add params into headers
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (response) {
                deferred.reject(response.data);
            });
            return deferred.promise;
        }

    };
})();


