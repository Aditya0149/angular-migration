(function (angular) {

    'use strict';

    angular
        .module('intake.tasks')
        .factory('intakeTasksDatalayer', intakeTasksDatalayer);
    intakeTasksDatalayer.$inject = ['$http', 'globalConstants', '$q'];

    function intakeTasksDatalayer($http, globalConstants, $q) {
        var baseUrl = globalConstants.webServiceBase;
        var javaURL = globalConstants.intakeServiceBaseV2;
        var getAllTasks = baseUrl + 'tasks/lexviatasks';
        var addTaskUrl = baseUrl + 'intake_task/intake_task';
        var getTaskByIdUrl = baseUrl + 'tasks/taskdetail/{taskId}';
        //var getTasksCountUrl = baseUrl + '/tasks/taskscount/count';
        //Off-drupal task history

        //download task history   
        if (!globalConstants.useApim) {
            var addTaskJAVAUrl = javaURL + 'intake-Task';
            var globalTasksUrl = javaURL + 'intake-Task';
            var deleteTaskUrl = javaURL + 'intake-Task/{taskId}';
            var TASK_HISTORY1 = javaURL + "intake-Task/history/";
            var TASK_HISTORY_EXPORT = javaURL + "intake-Task/history-export/";
            var getTasksCountUrl = javaURL + 'intake-Task/count?taskdate={date}';
            var setTaskStatus = globalConstants.intakeServiceBaseV2 + 'intake-Task/status?taskIds=';
            var updateTaskUrl = javaURL + 'intake-Task/{intake_id}';
            var getTasksUrl = javaURL + 'intake-Task/';
        } else {
            var addTaskJAVAUrl = globalConstants.intakeBase + 'task/v1/';
            var globalTasksUrl = globalConstants.intakeBase + 'task/v1/';
            var deleteTaskUrl = globalConstants.intakeBase + 'task/v1/{taskId}';
            var TASK_HISTORY1 = globalConstants.intakeBase + "task/v1/history/";
            var TASK_HISTORY_EXPORT = globalConstants.intakeBase + "task/v1/history-export/";
            var getTasksCountUrl = globalConstants.intakeBase + 'task/v1/count?taskdate={date}';
            var setTaskStatus = globalConstants.intakeBase + 'task/v1/status?taskIds=';
            var updateTaskUrl = globalConstants.intakeBase + 'task/v1/{intake_id}';
            var getTasksUrl = globalConstants.intakeBase + 'task/v1/';
        }
        // var getTaskByIdUrl = globalConstants.intakeBase + 'tasks/taskdetail/{taskId}';

        return {
            getTasks: getTasks,
            getGlobalTasks: getGlobalTasks,
            getTaskById: getTaskById,
            getFilteredTasks: getFilteredTasks,
            addTask: addTask,
            updateTask: updateTask,
            deleteTask: deleteTask,
            getGlobalTaskCount: getGlobalTaskCount,
            taskStatus: taskStatus,
            addTaskIntake: addTaskIntake,
            gettaskHistory_OFF_DRUPAL: gettaskHistory_OFF_DRUPAL,
            downloadTaskHistory: downloadTaskHistory,
        };

        function addTaskIntake(requestFilters) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: addTaskJAVAUrl,
                method: "POST",
                headers: token,
                data: requestFilters
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function taskStatus(task, taskid) {
            var url = setTaskStatus + taskid;
            var deferred = $q.defer();
            $http({
                url: url,
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

        function getTasks(intake_id) {
            var url = getTasksUrl.replace('{intake_id}', intake_id);
            return $http.get(url);
        }

        function getGlobalTasks(filterObj, sortBy) {
            filterObj.tz = moment.tz(moment.tz.guess()).format('Z');
            var sortByFilters = "";
            (sortBy != undefined) ? sortByFilters = "&sortby=" + sortBy.sortby + "&sortorder=" + sortBy.sortorder : sortByFilters = "&sortby=&sortorder=";
            delete filterObj.period;
            var url = globalTasksUrl + '?';
            url += utils.getParamsForIntake(filterObj) + sortByFilters;
            if (filterObj.tab == 'co') {
                url += '&taskdate='
            }
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "GET",
                headers: token,
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function getTaskById(taskId) {
            var url = getTaskByIdUrl.replace('{taskId}', taskId);
            return $http.get(url);
        }

        function getFilteredTasks(filterObj, intakeId, sortBy) {
            filterObj.tz = moment.tz(moment.tz.guess()).format('Z');
            var sortByFilters = "";
            (sortBy != undefined) ? sortByFilters = "&sortby=" + sortBy.sortby + "&sortorder=" + sortBy.sortorder : sortByFilters = "&sortby=&sortorder=";
            delete filterObj.period;
            delete filterObj.complete;
            delete filterObj.status;
            var url = getTasksUrl + intakeId + '?';
            url += utils.getParamsForIntake(filterObj) + sortByFilters;
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "GET",
                headers: token,
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }


        function addTask(task) {
            var finaltask = angular.copy(task);
            var url = addTaskUrl;
            return $http.post(url, finaltask);
        }

        function updateTask(task, intake_id) {
            var finaltask = angular.copy(task);
            finaltask.duedate = moment(finaltask.duedate).unix();
            var url = updateTaskUrl.replace('{intake_id}', intake_id);
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "PUT",
                headers: token,
                data: finaltask
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function deleteTask(taskId) {
            var url = deleteTaskUrl.replace('{taskId}', taskId);
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "DELETE",
                headers: token,
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function getGlobalTaskCount(date, filterObj) {
            filterObj.tz = moment.tz(moment.tz.guess()).format('Z');
            var url = getTasksCountUrl.replace('{date}', date);
            url += '&' + utils.getParamsForIntake(filterObj);
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "GET",
                headers: token,
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
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

        //US#5678-download task history
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

        }

    }

})(angular);