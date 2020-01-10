(function (angular) {

    angular
        .module('cloudlex.dashboard')
        .controller('DashboardTasksCtrl', DashboardTasksController)

    DashboardTasksController.$inject = ["$state", "masterData", "dashboardTasksHelper", "dashboardDatalayer", "tasksDatalayer", 'notification-service',
        "tasksHelper"];
    function DashboardTasksController($state, masterData, dashboardTasksHelper, dashboardDatalayer, tasksDatalayer, notificationService,
        tasksHelper) {

        var vm = this, today,
            taskComparisonData, taskComparisonGraph;

        vm.getOverDueTasks = getOverDueTasks;
        vm.getDisplayDate = getDisplayDate;
        vm.goToTask = gotoTask;
        vm.filterTasksComparison = filterTasksComparison;
        vm.isDateToday = isDateToday;
        // US#8982
        vm.taskIds = [];
        vm.isTaskSelected = isTaskSelected;
        vm.status = [];
        vm.statusList = ['Not Started', 'In Progress', 'Awaiting Clarification', 'Received & Acknowledged', 'Completed'].sort();
        vm.updateStatus = updateStatus;
        vm.cancelStatus = cancelStatus;
        vm.init = init;
        (function () {
            init();
        })();

        function init() {
            var userRole = masterData.getUserRole();
            vm.isMD = userRole.role === 'Managing Partner/Attorney' || userRole.role === 'LexviasuperAdmin';

            vm.selectedTaskFilter = '3M';
            today = moment().startOf('day');
            // today = new Date(today.toDate());
            today = utils.getUTCTimeStamp(today);
            //today = moment(today.getTime()).unix();

            vm.dailyUsageFilters = [
                { key: '3M', value: '3M' },
                { key: '6M', value: '6M' },
                { key: '1Y', value: '1Y' }
            ];

            vm.tasksFilters = [
                { label: 'Assigned By Me', value: 1 },
                { label: 'Assigned To Me', value: 2 },
                { label: 'All', value: 'all' }
            ];

            setSelectedTaskFilter();
            setCmpFilter();

            if (vm.isMD) {
                getTaskComparisonData();
            }

            getOverDueTasks(vm.selectedTaskFilter);
            //getCurrentTasks(vm.selectedTaskFilter);

            //persist last visited tab on dashboard
            localStorage.setItem("dashboardTab", ".tasks");
        }
        //US#8982 empty array when clicked on cancel 
        function cancelStatus() {
            vm.taskIds = [];
            vm.status = [];
        }

        //US#8982 API call to update status of multiple task
        function updateStatus() {
            if (utils.isEmptyVal(vm.status)) {
                notificationService.error("Please select status");
                return;
            }
            var taskDetails = {};
            taskDetails.taskid = utils.isEmptyVal(vm.taskIds) ? '' : _.pluck(vm.taskIds, 'task_id');
            taskDetails.status = utils.isEmptyVal(vm.status) ? '' : vm.status;
            taskDetails.percentage_complete = utils.isEmptyVal(vm.status) ? '' : (vm.status == 'Completed') ? '100' : (vm.status == 'Not Started') ? '0' : (vm.status == 'In Progress') ? '25' : '';
            tasksDatalayer.taskStatus(taskDetails)
                .then(function (response) {
                    if (response == true) {
                        notificationService.success('Task status updated successfully.');
                        vm.taskIds = [];
                        vm.status = [];
                        init();
                    } else {
                        notificationService.error('Unable to update status.');
                    }
                }, function (error) {
                    notificationService.error('Unable to update status.');
                });
        }

        function isTaskSelected(contact) {
            vm.status = undefined;
            var ids = _.pluck(vm.taskIds, 'taskid');
            return ids.indexOf(contact.taskid) > -1;
        };

        function setSelectedTaskFilter() {
            // if (vm.isMD) {
            // vm.selectedTaskFilter = 'all';
            //  return;
            // }

            var persistedTaskFilter = localStorage.getItem("dashboardTaskFilters");
            if (utils.isNotEmptyVal(persistedTaskFilter)) {
                var filterIsValid = _.find(vm.tasksFilters, function (filter) {
                    return filter.value == persistedTaskFilter;
                });
                vm.selectedTaskFilter = utils.isNotEmptyVal(filterIsValid) ? filterIsValid.value : 'all';
            } else {
                vm.selectedTaskFilter = 'all';
            }
        }

        function setCmpFilter() {
            var persistedUsageFilter = localStorage.getItem("dashboardTaskComparisonFilter");
            persistedUsageFilter = utils.isNotEmptyVal(persistedUsageFilter) ? persistedUsageFilter : '1Y';
            var isValidUsageFilter = _.find(vm.dailyUsageFilters, function (filter) {
                return filter.key == persistedUsageFilter
            });
            vm.taskCmpFilter = utils.isNotEmptyVal(isValidUsageFilter) ? persistedUsageFilter : '1Y';
        }

        function getTaskComparisonData() {
            dashboardDatalayer
                .getTasksComparisonData()
                .then(function (response) {
                    taskComparisonData = response.data.tasks;
                    var taskComparisonObj = dashboardTasksHelper.setTasksComparisonGraph('task-cmp', taskComparisonData);
                    taskComparisonGraph = c3.generate(taskComparisonObj);
                    dashboardTasksHelper.modifyComparisonGraph(vm.taskCmpFilter, taskComparisonData, taskComparisonGraph);
                });
        }

        function getCurrentTasks(filter) {

            if (angular.isUndefined(filter)) { return; }

            var currTask = { tab: 'cu', taskdate: today };

            if (filter !== 'all') {
                currTask.assigned = filter;
            }

            vm.showNoDataForWeekMsg = false;
            //persist task filters
            localStorage.setItem("dashboardTaskFilters", filter);
            dashboardDatalayer
                .getTasksForWeek(currTask)
                .then(function (response) {
                    vm.weeksTasks = dashboardTasksHelper.groupTasksByDate(response.data);
                    var dates = _.keys(vm.weeksTasks);
                    dates = _.sortBy(dates, function (dt) {
                        var date = moment(dt, 'YYYY/MM/DD');
                        date = new Date(date.toDate());
                        return date;
                    })
                    vm.dates = dates;
                    vm.showNoDataForWeekMsg = vm.dates.length === 0;
                });
        }

        function getOverDueTasks(filter) {
            if (utils.isEmptyVal(filter)) { return; }

            var overdueTask = { tab: 'ov', taskdate: today, frmdsh: 1, pageNum: 1, pageSize: 1000 };

            if (filter !== 'all') {
                overdueTask.assigned = filter;
            }


            vm.noOverdueTask = false;
            tasksDatalayer
                .getGlobalTasks_JAVA(overdueTask)
                .then(function (response) {
                    vm.overdueTasks = dashboardTasksHelper.setCompleted(response.data);
                    vm.noOverdueTask = vm.overdueTasks.length === 0;
                });

            getCurrentTasks(filter);
        }

        function getDisplayDate(date) {
            var displayDate = moment(date, 'YYYY/MM/DD');
            return displayDate.format('DD MMM YYYY');
        }

        function isDateToday(date) {
            var today = moment().startOf('day');
            var checkDate = moment(date, 'YYYY/MM/DD').startOf('day');
            return checkDate.isSame(today);
        }

        function gotoTask(selectedTask) {
            //Bug#7847
            if (selectedTask.matter.matter_name == null && selectedTask.matter.matter_id == '0') {
                return;
            }
            selectedTask.task_id = selectedTask.task_id;
            selectedTask.percentage_complete = selectedTask.percentage_complete;
            selectedTask.due_date = selectedTask.due_date;
            tasksHelper.setSavedTask(selectedTask);
            $state.go('tasks', { matterId: selectedTask.matter.matter_id });
        }

        function filterTasksComparison(filterKey) {
            //persist task comparison filter
            localStorage.setItem("dashboardTaskComparisonFilter", filterKey);

            if (angular.isUndefined(filterKey) || angular.isUndefined(taskComparisonGraph)) {
                return;
            }
            dashboardTasksHelper.modifyComparisonGraph(filterKey, taskComparisonData, taskComparisonGraph);
        }
    }

    angular
        .module('cloudlex.dashboard')
        .factory('dashboardTasksHelper', dashboardTasksHelper)

    dashboardTasksHelper.$inject = ["globalConstants"];
    function dashboardTasksHelper(globalConstants) {

        return {
            groupTasksByDate: _groupTasksByDate,
            setCompleted: _setCompleted,
            setTasksComparisonGraph: _setTasksComparisonGraph,
            modifyComparisonGraph: _modifyComparisonGraph
        }

        function _groupTasksByDate(data) {
            data = data.map(function (item) {
                item.localDueDate = moment.unix(item.due_date).utc().format('YYYY/MM/DD');
                var completed = item.percentage_complete || 0;
                item.completed = [
                    { value: completed, type: 'success' }, { value: 100 - completed, type: 'danger' }
                ]
                return item;
            })

            var grouped = _.groupBy(data, function (item) { return item.localDueDate; });
            return grouped;
        }

        function _setCompleted(data) {
            data.map(function (item) {
                var completed = item.percentage_complete || 0;
                item.completed = [
                    { value: completed, type: 'success' }, { value: 100 - completed, type: 'danger' }
                ]
                return item;
            })
            return data;
        }

        function _setTasksComparisonGraph(bindTo, data) {
            var dates = _getDatesForTaskComparison();
            var tasksCreated = _getDataForTaskComparison(data, dates, 'completed');
            var tasksCompleted = _getDataForTaskComparison(data, dates, 'created');
            dates = _setDatesForGraph(dates);
            return {
                bindto: '#' + bindTo,
                color: {
                    pattern: ['blue', 'green']
                },
                data: {
                    type: 'area-spline',
                    x: 'x',
                    columns: [
                        dates,
                        tasksCreated,
                        tasksCompleted
                    ],
                },
                axis: {
                    x: {
                        type: 'timeseries',
                        padding: { left: 0 },
                        tick: {
                            fit: true,
                            format: function (x) {
                                var month = x.getMonth();
                                return globalConstants.months[month]
                            },
                            culling: false
                        },
                    },
                    y: {
                        tick: {
                            padding: {
                                bottom: 0
                            }
                        }
                    }
                },
                legend: {
                    position: 'inset',
                    inset: {
                        anchor: 'top-left',
                        x: 500,
                        y: 10,
                        step: 2
                    }
                }
            };
        }

        function _getDatesForTaskComparison() {
            var today = moment();
            var aYearBack = moment().subtract(11, 'months');
            var range = moment().range(aYearBack, today);

            var date = aYearBack;
            var dates = [];
            while (range.contains(date)) {
                dates.push(date.format('YYYY MMM'))
                date = date.add(1, 'month');
            }
            return dates
        }

        function _getDataForTaskComparison(data, dates, category) {
            if (utils.isEmptyVal(category) || utils.isEmptyVal(data)) {
                var noDataArray = [];
                _.forEach(dates, function () { noDataArray.push(0) });
                noDataArray.unshift(category);
                return noDataArray;
            }
            var tasks = data[category];
            var compData = [];
            _.forEach(dates, function (date) {
                var taskForDate = _.find(tasks, function (task) { return task.date === date; });
                if (angular.isDefined(taskForDate)) {
                    compData.push(parseInt(taskForDate.count));
                } else {
                    compData.push(0);
                }
            })
            compData.unshift(category);
            return compData;
        }

        function _setDatesForGraph(dates) {
            dates = dates.map(function (date) {
                var dt = moment(date, 'YYYY MMM');
                return dt.format('YYYY-MM-DD');
            })
            dates.unshift('x');
            return dates;
        }

        function _modifyComparisonGraph(filter, data, graph) {
            var dates = _getDatesForTaskComparison();

            var tasksCreated = _getDataForTaskComparison(data, dates, 'completed');
            tasksCreated = _getDataForDateRange(filter, tasksCreated);

            var tasksCompleted = _getDataForTaskComparison(data, dates, 'created');
            tasksCompleted = _getDataForDateRange(filter, tasksCompleted);

            dates = _setDatesForGraph(dates);
            dates = _getDataForDateRange(filter, dates);

            graph.load({
                columns: [dates, tasksCreated, tasksCompleted]
            });
        }

        function _getDataForDateRange(dateRange, data) {
            var dataForDateRange;
            switch (dateRange) {
                case '1Y':
                    dataForDateRange = data;
                    break;
                case '6M':
                    dataForDateRange = data.splice(7, 13)
                    dataForDateRange.unshift(data[0]);
                    break;
                case '3M':
                    dataForDateRange = data.splice(10, 13)
                    dataForDateRange.unshift(data[0]);
                    break;
            }
            return dataForDateRange;
        }
    }


})(angular)