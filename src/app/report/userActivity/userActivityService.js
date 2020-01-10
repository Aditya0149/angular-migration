angular.module('cloudlex.report')
    .factory('userActivityService', userActivityService);

userActivityService.$inject = ['$q', '$http', 'globalConstants'];

function userActivityService($q, $http, globalConstants) {

    var baseUrl = globalConstants.webServiceBase;

    var userActivityUrl = baseUrl + 'Matter-Manager/v1/reports/user-activity-report';
    var userActivityCountUrl = baseUrl + 'reports/useractivityreport_count.json';
    var assignedUserUrl = baseUrl + 'tasks/staffsinfirm.json';
    var exportUrl = baseUrl + 'Matter-Manager/v1/reports/export-user-activity-report?';


    function getParams(params) {
        var querystring = "";
        angular.forEach(params, function (value, key) {
            querystring += key + "=" + value;
            querystring += "&";
        });
        return querystring.slice(0, querystring.length - 1);
    }

    return {
        getUserActivity: getUserActivity,
        getUserActivityCount: getUserActivityCount,
        exportUserActivity: exportUserActivity,
        getAssignedUserData: getAssignedUserData

    }

    function exportUserActivity(requestFilters) {
        var token = {
            'Authorization': "Bearer " + localStorage.getItem('accessToken'),
            'Content-type': 'application/json'
        }
        var deferred = $q.defer();
        // var url = intakeReportConstant.RESTAPI.allIntakeList;
        var url = exportUrl + getParams(requestFilters)
        var tz = utils.getTimezone();
        var timeZone = moment.tz.guess();
        url += '&tz=' + timeZone;
        $http({
            url:url ,
            method: "GET",
            headers: token,
            data: requestFilters,
            responseType: 'arraybuffer',
        })
            .then(function (response) {
                deferred.resolve(response);
            }, function (error) {
                deferred.reject(error);
            });

        return deferred.promise;
    }

    function getUserActivity(requestFilters) {
        var url = userActivityUrl;
        url += '?' + getParams(requestFilters);
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

    function getUserActivityCount(requestFilters) {
        var url = userActivityCountUrl;
        url += '?' + getParams(requestFilters);
        return $http.get(url);
    }

    function getAssignedUserData(requestFilters) {
        var url = assignedUserUrl;
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

}