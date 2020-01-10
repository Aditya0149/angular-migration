
(function () {
    'use strict';

    angular
        .module('intake.events')
        .factory('intakeEventsDataService', intakeEventsDataService);

    intakeEventsDataService.$inject = ["$http", "$q", "globalConstants"];

    function intakeEventsDataService($http, $q, globalConstants) {

        var serviceBase = {};
        if (!globalConstants.useApim) {
            serviceBase.GET_EVENTS = globalConstants.intakeServiceBaseV2 + "events/[ID]";
            serviceBase.ADD_EVENT = globalConstants.intakeServiceBaseV2 + "events";
            serviceBase.DELETE_EVENT = globalConstants.intakeServiceBaseV2 + "events/[ID]";
            serviceBase.UPDATE_EVENT = globalConstants.intakeServiceBaseV2 + "events/[ID]";
            serviceBase.GET_SINGLE_EVENT = globalConstants.intakeServiceBaseV2 + "events/intake-single-event/[ID][CAT]";
            serviceBase.GET_REMINDER = globalConstants.webServiceBase + "matter/eventreminder?";
            serviceBase.DISMISS_EVENT = globalConstants.webServiceBase + "matter/dismissevent/1?";
            serviceBase.EVENT_HISTORY = globalConstants.intakeServiceBaseV2 + "events/intake-event-history/";
            serviceBase.EVENT_HISTORY_EXPORT = globalConstants.intakeServiceBaseV2 + "events/history-export"; //US#5678-download event history    


        } else {
            serviceBase.GET_EVENTS = globalConstants.intakeBase + "events/v1/[ID]";
            serviceBase.ADD_EVENT = globalConstants.intakeBase + "events/v1/";
            serviceBase.DELETE_EVENT = globalConstants.intakeBase + "events/v1/[ID]";
            serviceBase.UPDATE_EVENT = globalConstants.intakeBase + "events/v1//[ID]";
            serviceBase.GET_SINGLE_EVENT = globalConstants.intakeBase + 'events/v1/intake-single-event/[ID]';
            serviceBase.GET_REMINDER = globalConstants.webServiceBase + "matter/eventreminder?";
            serviceBase.DISMISS_EVENT = globalConstants.webServiceBase + "matter/dismissevent/1?";
            serviceBase.EVENT_HISTORY = globalConstants.intakeBase + "events/v1/intake-event-history/";
            serviceBase.EVENT_HISTORY_EXPORT = globalConstants.intakeBase + "events/v1/history-export/"; //US#5678-download event history    

        }

        var eventsService = {
            getEvents: getEvents,
            addEvent: addEvent,
            updateEvent: updateEvent,
            deleteEvent: deleteEvent,
            getSingleEvent: getSingleEventDetails,
            getReminder: getReminder,
            dismissReminder: dismissReminder,
            getEventHistory: getEventHistory,
            downloadEventHistory: downloadEventHistory

        };

        return eventsService;

        function getURL(serviceUrl, id, categoryCheck) {
            var url = serviceUrl.replace("[ID]", id).replace("[CAT]", categoryCheck);
            return url;
        }

        function getEvents(matterID, sortby) {

            var url = getURL(serviceBase.GET_EVENTS, matterID);
            url += '?sortby=' + sortby;
            return $http.get(url);
        }

        function addEvent(event) {
            var deferred = $q.defer();
            var url = serviceBase.ADD_EVENT, event;
            $http({
                url: url,
                method: "POST",
                data: event
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function updateEvent(eventID, event) {
            var deferred = $q.defer();
            var url = getURL(serviceBase.UPDATE_EVENT, eventID);

            $http({
                url: url,
                method: "PUT",
                data: event
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }


        function deleteEvent(eventID) {
            return $http.delete(getURL(serviceBase.DELETE_EVENT, eventID));
        }

        function getSingleEventDetails(eventId, categoryCheck) {
            var url = getURL(serviceBase.GET_SINGLE_EVENT, eventId, categoryCheck);
            return $http.get(url);
        }

        function getReminder() {
            var params = {
                todays_date: moment().format('YYYY-MM-DD'),
                full_day_event: utils.getUTCStartFromMoment(moment()),
                timed_event: moment(moment().valueOf()).unix()
            };

            var url = serviceBase.GET_REMINDER + utils.getParams(params);
            return $http.get(url);
        }

        function dismissReminder(reminderids, remindertype) {
            var url = serviceBase.DISMISS_EVENT;
            //url parameter updated for US#5191 : Task Reminder 
            var data = {
                current_utc: moment(moment().valueOf()).unix(),
                event_id: reminderids.eventids,
                taskid: reminderids.taskids
            };
            return $http.put(url, data);
        }

        //US#5678-Get event history data
        function getEventHistory(eventId, pageNo, limit) {
            var url = serviceBase.EVENT_HISTORY + eventId + '?' + 'pageNumber=' + pageNo + '&pageSize=' + limit;
            return $http.get(url);

        }

        //US#5678-download event history
        function downloadEventHistory(eventId, pageNo, limit) {
            var exportObj = {};

            exportObj.pageNumber = pageNo;
            exportObj.pageSize = limit;
            exportObj.reportname = "intake_event_history";
            exportObj.filename = "Intake_Event_List.xlsx";
            exportObj.type = "excel";
            exportObj.user = "all-users";
            var url = serviceBase.EVENT_HISTORY_EXPORT + '/' + eventId;
            var timeZone = moment.tz.guess();
            url += '?tz=' + timeZone;

            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                responseType: 'arraybuffer'
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }


    };
})();


