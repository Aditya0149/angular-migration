angular.module('intake.calendar')
    .factory('intakeCalendarDatalayer', intakeCalendarDatalayer);

intakeCalendarDatalayer.$inject = ['$q', '$http', 'globalConstants'];
function intakeCalendarDatalayer($q, $http, globalConstants) {
    var base = '';
    if (!globalConstants.useApim) {
        base = globalConstants.intakeServiceBaseV2 + 'events?';
    } else {
        base = globalConstants.intakeBase + 'events/v1/';
    }

    var getEventsUrl = base + '?';

    function getParams(params) {
        var querystring = "";
        angular.forEach(params, function (value, key) {
            if (key == "assigned") {
                querystring += key + "=" + params.assigned.toString();
            } else {
                querystring += key + "=" + value;
            }

            querystring += "&";
        });
        return querystring.slice(0, querystring.length - 1);
    }

    return {
        myEvent: _getMyEvents,
        allEvent: _getAllEvents,
        personalEvents: _getPersonalEvents,
        getCompliedEventList: _getCompliedEventList,
        getEventDetails: getEventDetails
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
        var encodedTz = encodeURIComponent(utils.getTimezone());
        var assignedUsers = utils.isEmptyVal(filters.assigned) ? '' : filters.assigned;
        delete filters.assigned;
        var myEventUrl = getEventsUrl + utils.getParams(filters);
        myEventUrl = myEventUrl + '&assigned=' + assignedUsers;
        myEventUrl = myEventUrl.replace(utils.getTimezone(), encodedTz);

        return $http({
            url: myEventUrl,
            method: "GET"
        });
    }

    function getEventDetails(requestFilters) {

        var url = getEventsUrl;

        var tz = utils.getTimezone();
        var encodedTz = encodeURIComponent(tz);
        requestFilters.tz = encodedTz
        var deferred = $q.defer();
        url += getParams(requestFilters);

        var deferred = $q.defer();
        $http({
            url: url,
            method: "GET"
        }).success(function (response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    }


}