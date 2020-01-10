(function (angular) {

    'use strict';

    angular
        .module('cloudlex.tasks')
        .controller('TasksController', TasksController);

    TasksController.$inject = ['$filter', '$stateParams', '$state', 'tasksHelper', 'tasksDatalayer', 'notification-service'];

    function TasksController($filter, $stateParams, $state, tasksHelper, tasksDatalayer, notificationService) {
        var vm = this;
        var allTaskList = [];
        vm.matterId = $stateParams.matterId;
        vm.getFilteredTasks = getFilteredTasks;
        vm.getNoDataMessage = getNoDataMessage;
        vm.selectTask = selectTask;
        vm.filterTask = filterTask;
        vm.getTasksByDate = getTasksByDate;
        vm.deleteTask = deleteTask;
        vm.editTask = editTask;


        //init
        (function () {
            // filter object
            vm.filters = tasksHelper.getDefaultFilter();
            vm.selectedTask = {};
            vm.display = {
                dataReceived: false
            };
            vm.tasksList = [];
            getAllTasks();
            //task filters
            //filter change action is fired which calls getFilteredTasks
            vm.taskFilters = tasksHelper.getTaskFilters();

        })();

        //this method is called when:  
        // 1. go to today button click
        // 2. filter is changed
        // 3. date is clicked
        function getAllTasks() {
            var filterObj = angular.copy(vm.filters);
            delete filterObj.tab;
            delete filterObj.taskDate;
            tasksDatalayer
                .getFilteredTasks(filterObj, vm.matterId)
                .then(function (response) {
                    var taskList = response.data;
                    tasksHelper.setProgressInfo(taskList);
                    allTaskList = taskList;
                    tasksHelper.setFilterTaskCount(allTaskList, vm.taskFilters);
                    getFilteredTasks();
                    vm.display.dataReceived = true;
                });
        }

        function getFilteredTasks() {
            if (allTaskList.length === 0) {
                return;
            }
            vm.tasksList = tasksHelper.getTaskByFilter(allTaskList, vm.filters.tab);
            vm.selectedTask = vm.tasksList[0];

        }

        function getNoDataMessage(filterText) {
            if (angular.isUndefined(filterText) || utils.isEmptyString(filterText)) {
                return "No data";
            }
            return "No matching data found";
        }

        function selectTask(task) {
            vm.selectedTask = task;
        }

        function filterTask(filterText) {
            if (angular.isUndefined(filterText) || utils.isEmptyString(filterText)) {
                getFilteredTasks();
            }
            var filterObj = { taskname: filterText };
            var currentTasks = tasksHelper.getTaskByFilter(allTaskList, vm.filters.tab);
            vm.tasksList = $filter('filter')(currentTasks, filterObj);
            vm.selectedTask = vm.tasksList[0];
        }

        function getTasksByDate(day) {
            vm.filters.taskDate = day.utcTimestamp;
            getFilteredTasks();
        }

        function deleteTask(taskId) {
            tasksDatalayer
                .deleteTask(taskId)
                .then(taskDeleted, function () {
                    notificationService.error("unable to delete");
                });
        }

        function taskDeleted() {
            notificationService.success('Task deleted successfully.');
            getAllTasks();
        }

        function editTask(matterId, taskId) {
            $state.go('tasks-edit', { matterId: matterId, taskId: taskId });
        }
    }

})(angular);

(function (angular) {

    angular
        .module('cloudlex.tasks')
        .factory('tasksHelper', tasksHelper);

    function tasksHelper() {
        return {
            getDefaultFilter: getDefaultFilter,
            getTaskFilters: getTaskFilters,
            setProgressInfo: setProgressInfo,
            setFilterTaskCount: setFilterTaskCount,
            getTaskByFilter: getTaskByFilter,
        };

        function getDefaultFilter() {
            var d = new Date();
            var utc_start_of_day = utils.getStartOfDayUTCDate(d);
            var startOfDayUTC = utils.getStartOfDayTimestamp(utc_start_of_day);
            return {
                pageNum: 1,
                pageSize: 100,
                status: '',
                priority: '',
                tab: 'cu',
                taskDate: startOfDayUTC
            };
        }

        function getTaskFilters() {
            return [
                { key: 'ov', value: 'Overdue', count: 0 },
                { key: 'cu', value: 'Current', count: 0 },
                { key: 'co', value: 'Completed', count: 0 }
            ];
        }

        function setProgressInfo(taskList) {
            _.forEach(taskList, function (task) {
                var completed = task.percentagecomplete;
                task.completed = [
                    { value: completed, type: 'success' }, { value: 100 - completed, type: 'danger' }
                ]
            });
        }

        function setFilterTaskCount(allTasks, filters) {
            _.forEach(filters, function (filter) {
                filter.count = getTaskByFilter(allTasks, filter.key).length;
            });
        }

        function getTaskByFilter(allTasks, param) {
            switch (param) {
                case 'cu':
                    return getCurrentTasks(allTasks);
                    break;
                case 'co':
                    return getCompletedTasks(allTasks);
                    break;
                case 'ov':
                    return getOverdueTasks(allTasks);
                    break;
            }
        }

        function getCurrentTasks(allTasks) {
            var currentTasks = _.filter(allTasks, function (task) {
                var dueDate = moment.unix(task.dueutcdate);
                var todayStartOfDay = moment().startOf('day');
                return ((parseInt(task.percentagecomplete) < 100) &&
                    (dueDate.isAfter(todayStartOfDay) || dueDate.isSame(todayStartOfDay)));
            });

            return currentTasks;
        }

        function getCompletedTasks(allTasks) {
            var completedTasks = _.filter(allTasks, function (task) {
                return parseInt(task.percentagecomplete) === 100;
            });

            return completedTasks;
        }

        function getOverdueTasks(allTasks) {
            var overdueTasks = _.filter(allTasks, function (task) {
                var dueDate = moment.unix(task.dueutcdate);
                var todayStartOfDay = moment().startOf('day');
                return ((parseInt(task.percentagecomplete) < 100) && dueDate.isBefore(todayStartOfDay));
            });

            return overdueTasks;
        }


    }

})(angular);