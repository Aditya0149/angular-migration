angular.module('cloudlex.report')
    .factory('taskSummaryDataLayer', taskSummaryDataLayer);

taskSummaryDataLayer.$inject = ['$q', '$http', 'globalConstants'];

function taskSummaryDataLayer($q, $http, globalConstants) {

    var baseUrl = globalConstants.webServiceBase;

    // var taskSummaryUrl = baseUrl + 'reports/task_status_summary.json';
    //   var taskSummaryCountUrl = baseUrl + 'reports/task_status_summary_count.json';
    var assignedUserUrl = baseUrl + 'tasks/staffsinfirm.json';
    //   var exportUrl = baseUrl + 'reports/report.json';


    function getParams(params) {
        var querystring = "";
        angular.forEach(params, function (value, key) {
            querystring += key + "=" + value;
            querystring += "&";
        });
        return querystring.slice(0, querystring.length - 1);
    }

    return {
        //  getTaskSummaryData: getTaskSummaryData,
        // getTaskSummaryCount: getTaskSummaryCount,
        // exportTaskSummary: exportTaskSummary,
        getAssignedUserData: getAssignedUserData,
        getFilterObject: getFilterObject

    }
    function getFilterObject(filters) {
        var formattedFilters = {};

        formattedFilters.priority = utils.isNotEmptyVal(filters.priority) ? filters.priority : [];
        formattedFilters.taskSubCategory = utils.isNotEmptyVal(filters.task_subcategory) ? filters.task_subcategory : "";
        formattedFilters.taskCategory = utils.isNotEmptyVal(filters.task_category) ? filters.task_category : "";
        formattedFilters.excludeClosedMatters = utils.isNotEmptyVal(filters.exclude_closed_matters) ? filters.exclude_closed_matters : "";
        formattedFilters.assignedto = utils.isNotEmptyVal(filters.assignedto) && !isNaN(filters.assignedto) ? parseInt(filters.assignedto) : "";
        formattedFilters.assignedby = utils.isNotEmptyVal(filters.assignedby) && !isNaN(filters.assignedby) ? parseInt(filters.assignedby) : "";
        formattedFilters.dueStartDate = utils.isNotEmptyVal(filters.s) ? filters.s : "";
        formattedFilters.dueEndDate = utils.isNotEmptyVal(filters.e) ? filters.e : "";
        formattedFilters.sortby = filters.sortby;
        formattedFilters.sortorder = filters.sortorder
        formattedFilters.pageNum = filters.pageNum;
        formattedFilters.pageSize = filters.pageSize;
        formattedFilters.mytask = angular.isDefined(filters.mytask) ? filters.mytask : 1;
        formattedFilters.status = utils.isNotEmptyVal(filters.status) ? filters.status : [];
        formattedFilters.matterId = utils.isNotEmptyVal(filters.matterid) ? parseInt(filters.matterid) : "";

        return formattedFilters;
    };
    // function exportTaskSummary(requestFilters) {
    //     var url = exportUrl;

    //     url += '?reportname=TaskSummary&filename=Report_task_summary.xlsx&type=excel';
    //     url += "&" + utils.getParams(requestFilters);
    //     var download = window.open(url, '_self');
    // }

    // function getTaskSummaryCount(requestFilters) {
    //     var url = taskSummaryCountUrl;
    //     url += '?' + getParams(requestFilters);
    //     return $http.get(url);
    // }

    // function getTaskSummaryData(requestFilters) {
    //     var url = taskSummaryUrl;
    //     url += '?' + getParams(requestFilters);
    //     var deferred = $q.defer();
    //     $http({
    //         url: url,
    //         method: "GET",
    //         withCredentials: true
    //     }).success(function (response) {
    //         deferred.resolve(response);
    //     });
    //     return deferred.promise;
    // }

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