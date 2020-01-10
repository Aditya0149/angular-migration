(function (angular) {

    'use strict';

    angular
        .module('cloudlex.tasks')
        .factory('tasksDatalayer', tasksDatalayer);
    tasksDatalayer.$inject = ['$http', 'globalConstants', '$q'];

    function tasksDatalayer($http, globalConstants, $q) {
        var baseUrl = globalConstants.webServiceBase;

        var getTasksUrl = baseUrl + 'tasks/lexviatasks/{matterId}';
        //Off-drupal get matter task
        // var getTasksUrl1 = globalConstants.javaWebServiceBaseV4 + 'task/{matterId}';
        var globalTasksUrl = baseUrl + 'tasks/lexviatasks';
        var getAllTasks = baseUrl + 'tasks/lexviatasks';
        var addTaskUrl = baseUrl + 'tasks/lexviatasks';
        var updateTaskUrl = baseUrl + 'tasks/lexviatasks/{matterId}';
        var deleteTaskUrl = baseUrl + 'tasks/lexviatasks/{taskId}';
        var getTaskByIdUrl = baseUrl + 'tasks/taskdetail/{taskId}';
        //var getTasksCountUrl = baseUrl + '/tasks/taskscount/count';
        var getTasksCountUrl = baseUrl + 'tasks/taskscount/count?taskdate={date}';

        var setTaskStatus = globalConstants.javaWebServiceBaseV1 + 'taskStatusUpdate';
        //Off-drupal get global task
        //Off-drupal get matter task
        // Off-drupal Status update
        // Off-drupal Delete Task
        // Off-drupal Add task
        // Off- drupal Get TaskbyId
        // Off-drupal Update task
        // Off-drupal task count

        //Off-drupal task history

        //download task history   
        if (!globalConstants.useApim) {
            var setTaskStatus1 = globalConstants.javaWebServiceBaseV4 + 'task/status';
            var getTasksUrl1 = globalConstants.javaWebServiceBaseV4 + 'task/{matterId}';
            var addTaskUrl1 = globalConstants.javaWebServiceBaseV4 + 'task';
            var globalTasksUrl1 = globalConstants.javaWebServiceBaseV4 + 'task';
            var getTaskByIdUrl1 = globalConstants.javaWebServiceBaseV4 + 'task/{taskId}/detail';
            var getTasksCountUrl1 = globalConstants.javaWebServiceBaseV4 + 'task/count?taskdate={date}';
            var deleteTaskUrl1 = globalConstants.javaWebServiceBaseV4 + 'task/{taskId}';
            var updateTaskUrl1 = globalConstants.javaWebServiceBaseV4 + 'task/{taskId}';
            var TASK_HISTORY1 = globalConstants.javaWebServiceBaseV4 + "task/history/";
            var TASK_HISTORY_EXPORT = globalConstants.javaWebServiceBaseV4 + "task/history-export/";
        } else {
            var setTaskStatus1 = globalConstants.matterBase + 'task/v1/status';
            var getTasksUrl1 = globalConstants.matterBase + 'task/v1/{matterId}';
            var addTaskUrl1 = globalConstants.matterBase + 'task/v1/';
            var globalTasksUrl1 = globalConstants.matterBase + 'task/v1/';
            var getTaskByIdUrl1 = globalConstants.matterBase + 'task/v1/{taskId}/detail/';
            var getTasksCountUrl1 = globalConstants.matterBase + 'task/v1/count?taskdate={date}';
            var deleteTaskUrl1 = globalConstants.matterBase + 'task/v1/{taskId}';
            var updateTaskUrl1 = globalConstants.matterBase + 'task/v1/{taskId}';
            var TASK_HISTORY1 = globalConstants.matterBase + "task/v1/history/";
            var TASK_HISTORY_EXPORT = globalConstants.matterBase + "task/v1/history-export/";
        }



        return {
            getTasks: getTasks,
            getGlobalTasks: getGlobalTasks,
            getGlobalTasks_JAVA: getGlobalTasks_JAVA,
            getTaskById: getTaskById,
            getFilteredTasks: getFilteredTasks,
            getFilteredTasks_JAVA: getFilteredTasks_JAVA,
            gettaskHistory_OFF_DRUPAL: gettaskHistory_OFF_DRUPAL,
            downloadTaskHistory: downloadTaskHistory,
            addTask: addTask,
            addTask_JAVA: addTask_JAVA,
            UpdateTask_JAVA: UpdateTask_JAVA,
            updateTask: updateTask,
            deleteTask: deleteTask,
            getGlobalTaskCount: getGlobalTaskCount,
            getGlobalTaskCount_JAVA: getGlobalTaskCount_JAVA,
            taskStatus: taskStatus
        };

        function taskStatus(task) {
            var deferred = $q.defer();
            var ids = (task.taskid).toString();
            delete task.taskid;
            $http({
                url: setTaskStatus1 + '?taskIds=' + ids,
                method: "PUT",
                data: task,
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem('accessToken')
                }
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function getTasks(matterId) {
            var url = getTasksUrl.replace('{matterId}', matterId);
            return $http.get(url);
        }

        function getGlobalTasks(filterObj, sortBy) {
            var sortByFilters = "";
            (sortBy != undefined) ? sortByFilters = "&sortby=" + sortBy.sortby + "&sortorder=" + sortBy.sortorder : sortByFilters = "&sortby=&sortorder=";
            var url = globalTasksUrl;
            url += '?' + utils.getParams(filterObj) + sortByFilters;
            return $http.get(url);
        }
        function getGlobalTasks_JAVA(filterObj, sortBy) {
            var sortByFilters = "";
            (sortBy != undefined) ? sortByFilters = "&sortby=" + sortBy.sortby + "&sortorder=" + sortBy.sortorder : sortByFilters = "&sortby=&sortorder=";
            var url = globalTasksUrl1;
            url += '?' + utils.getParams(filterObj) + sortByFilters;
            return $http.get(url);
        }

        function getTaskById(taskId) {
            var url = getTaskByIdUrl1.replace('{taskId}', taskId);
            return $http.get(url);
        }

        function getFilteredTasks(filterObj, matterId, sortBy) {
            var sortByFilters = "";
            (sortBy != undefined) ? sortByFilters = "&sortby=" + sortBy.sortby + "&sortorder=" + sortBy.sortorder : sortByFilters = "&sortby=&sortorder=";
            var url = getTasksUrl.replace('{matterId}', matterId);
            url += '?' + utils.getParams(filterObj) + sortByFilters;
            return $http.get(url);
        }

        function getFilteredTasks_JAVA(filterObj, matterId, sortBy) {
            filterObj.tz = moment.tz(moment.tz.guess()).format('Z');
            var sortByFilters = "";
            (sortBy != undefined) ? sortByFilters = "&sortby=" + sortBy.sortby + "&sortorder=" + sortBy.sortorder : sortByFilters = "&sortby=&sortorder=";
            var url = getTasksUrl1.replace('{matterId}', matterId);
            url += '?pageNum=' + filterObj.pageNum + "&pageSize=" + filterObj.pageSize + "&taskdate=" + filterObj.taskdate + "&tz=" + filterObj.tz + sortByFilters;
            return $http.get(url);
        }

        //US#5678-Get task history data
        function gettaskHistory_OFF_DRUPAL(taskId, pageNo, limit) {
            var deferred = $q.defer();
            var url = TASK_HISTORY1 + taskId + '?' + 'pageNum=' + pageNo + '&pageSize=' + limit;
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


        //download task history
        function downloadTaskHistory(taskId, pageNo, limit) {

            var exportObj = {};

            exportObj.pageNum = pageNo;
            exportObj.pageSize = limit;
            exportObj.reportname = "intake_task_history";
            exportObj.filename = "Intake_Task_List.xlsx";
            exportObj.type = "excel";
            exportObj.user = "all-users";
            var url = TASK_HISTORY_EXPORT + taskId + '?' + 'pageNum=' + pageNo + '&pageSize=' + limit;
            var tz = utils.getTimezone();
            var timeZone = moment.tz.guess();
            url += '&tz=' + timeZone;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }

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

        }



        function addTask(task) {
            var finaltask = angular.copy(task);
            //finaltask.duedate = moment(finaltask.duedate).unix();
            var url = addTaskUrl;
            return $http.post(url, finaltask);
        }

        function addTask_JAVA(task) {
            var finaltask = angular.copy(task);
            //finaltask.duedate = moment(finaltask.duedate).unix();
            //return $http.post(url, finaltask);
            var deferred = $q.defer();
            var url = addTaskUrl1;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            return $http({
                url: url,
                method: "POST",
                data: finaltask,
                headers: token
            }).success(function (response, status, headers, config) {
                deferred.resolve();
            }).error(function (ee, status, headers, config) {
                deferred.reject();
            });
        }
        function UpdateTask_JAVA(task) {
            var finaltask = angular.copy(task);
            //finaltask.duedate = moment(finaltask.duedate).unix();
            //return $http.post(url, finaltask);
            var deferred = $q.defer();
            var url = updateTaskUrl1.replace('{taskId}', task.task_id);
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            return $http({
                url: url,
                method: "PUT",
                data: finaltask,
                headers: token
            }).success(function (response, status, headers, config) {
                deferred.resolve();
            }).error(function (ee, status, headers, config) {
                deferred.reject();
            });
        }

        function updateTask(task, matterId) {
            var finaltask = angular.copy(task);
            //finaltask.duedate = moment(finaltask.duedate).unix();
            var url = updateTaskUrl.replace('{matterId}', matterId);
            return $http.put(url, finaltask);
        }

        function deleteTask(taskId) {
            var url = deleteTaskUrl1.replace('{taskId}', taskId);
            return $http.delete(url);
        }

        function getGlobalTaskCount(date, filterObj) {
            var url = getTasksCountUrl.replace('{date}', date);
            url += '&' + utils.getParams(filterObj);
            return $http.get(url);
        }
        function getGlobalTaskCount_JAVA(date, filterObj) {
            var url = getTasksCountUrl1.replace('{date}', date);
            url += '&' + utils.getParams(filterObj);
            return $http.get(url);
        }
    }

})(angular);