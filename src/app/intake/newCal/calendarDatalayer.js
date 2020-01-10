angular.module('intake.calendar')
    .factory('launcherCalendarDatalayer', launcherCalendarDatalayer);

launcherCalendarDatalayer.$inject = ['$http', 'globalConstants'];
function launcherCalendarDatalayer($http, globalConstants) {
    var base = '';
    if (!globalConstants.useApim) {
        base = globalConstants.javaWebServiceBaseV4 + 'event?';
    } else {
        base = globalConstants.matterBase + 'events/v1/?';
    }
    var getEventsUrl1 = base;

    return {
        myEvent: _getMyEvents,
        allEvent: _getAllEvents,
        personalEvents: _getPersonalEvents,
        getCompliedEventList: _getCompliedEventList
    }

    function _getAllEvents(filters) {
        return _getEvents(filters);
    }

    function _getMyEvents(filters) {
        return _getEvents(filters);
    }

    function _getPersonalEvents(filters) {
        return _getEvents(filters);
    }

    function _getCompliedEventList(filters) {
        return _getEvents(filters);
    }

    function _getEvents(filters) {
        if (filters.s) {
            filters.start = angular.copy(filters.s);
        }
        if (filters.e) {
            filters.end = angular.copy(filters.e);
        }
        var encodedTz = encodeURIComponent(utils.getTimezone());
        var assignedUsers = utils.isEmptyVal(filters.assigned) ? [] : filters.assigned;
        var filterCopy = angular.copy(filters);
        delete filterCopy.assigned;
        var myEventUrl = getEventsUrl1 + utils.getParams(filterCopy);
        myEventUrl = myEventUrl + '&assigned=' + assignedUsers + '';
        myEventUrl = myEventUrl.replace(utils.getTimezone(), encodedTz);

        return $http.get(myEventUrl);
    }


}