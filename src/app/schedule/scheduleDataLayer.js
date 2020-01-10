angular.module('cloudlex.schedule')
    .factory('scheduleDataLayer', scheduleDataLayer);

scheduleDataLayer.$inject = ['$q', '$http', 'globalConstants'];

function scheduleDataLayer($q, $http, globalConstants) {

    var baseUrl = globalConstants.webServiceBase;
    var getAllEventsUrl = baseUrl + 'lexviacalendar/lexviacalendar.json?filterby=allmatterevent';
    var getMyEventsUrl = baseUrl + 'lexviacalendar/lexviacalendar.json?filterby=mymatterevent';
    var scheduleEventUrl = baseUrl + 'tasks/scheduleevent';

    function getParams(params) {
        var querystring = "";
        angular.forEach(params, function (value, key) {
            querystring += key + "=" + value;
            querystring += "&";
        });
        return querystring.slice(0, querystring.length - 1);
    }

    return {
        /* myEvent: myEvent,
         allEvent: allEvent,*/
        getEventDetails: getEventDetails,
        createScheduleEvent: createScheduleEvent,
        updateScheduleEvent: updateScheduleEvent
    }

    function getEventDetails(requestFilters) {

        var url;
        /*if(requestFilters.complied==1)
        {
            if(requestFilters.allEvent ==1  && requestFilters.complied==0){
                url = getAllEventsUrl+'&complied=0';
            }
            else { 
                url = getMyEventsUrl+'&complied=1';
            }
        }
        else{ 
             if(requestFilters.allEvent ==1){
                url = getAllEventsUrl;
            }
                else{
                url = getMyEventsUrl;
            }
            
        }*/

        if (requestFilters.allEvent == 1) {
            url = getAllEventsUrl;
        } else {
            url = getMyEventsUrl;
        }
        var assignedUsers = utils.isEmptyVal(requestFilters.assigned) ? [] : requestFilters.assigned;;
        var filterCopy = angular.copy(requestFilters);
        delete filterCopy.assigned;
        var tz = utils.getTimezone();
        var encodedTz = encodeURIComponent(tz);
        filterCopy.tz = encodedTz

        url += '&' + getParams(filterCopy);
        url += '&assigned=[' + assignedUsers + ']';
        var deferred = $q.defer();
        $http({
            url: url,
            method: "GET",
            withCredentials: true
        }).success(function (response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    }

    function addTask(task) {
        var url = addTaskUrl;
        return $http.post(url, task);
    }


    function createScheduleEvent(scheduleEventData) {
        var url = scheduleEventUrl;
        return $http.post(url, scheduleEventData);
    }

    function updateScheduleEvent(requestFilters, scheduleEventData) {
        var url = scheduleEventUrl;
        url += '/' + requestFilters.taskid;
        return $http.put(url, scheduleEventData);
    }

}