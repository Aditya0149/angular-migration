(function () {

    'use strict';

    angular
        .module('intake.tasks')
        .controller('LauncherGlobalTaskCtrl', LauncherGlobalTaskCtrl);

    LauncherGlobalTaskCtrl.$inject = ['$scope', '$rootScope', '$state', '$timeout', '$q', '$filter', 'tasksHelper', 'LauncherTasksDatalayer',
        'matterFactory', 'modalService', 'notification-service', 'resetCallbackHelper', 'globalConstants', 'masterData', 'contactFactory', 'taskSummaryDataLayer', 'tasksDatalayer', 'LauncherTaskHelper', 'intakeTasksDatalayer', 'IntakeTasksHelper'];

    function LauncherGlobalTaskCtrl($scope, $rootScope, $state, $timeout, $q, $filter, tasksHelper, LauncherTasksDatalayer, matterFactory,
        modalService, notificationService, resetCallbackHelper, globalConstants, masterData, contactFactory, taskSummaryDataLayer, tasksDatalayer, LauncherTaskHelper, intakeTasksDatalayer, IntakeTasksHelper) {
        var vm = this,
            tasks;

        vm.getFilteredTasks = getFilteredTasks;
        vm.getTasksByDate = getTasksByDate;
        vm.selectTask = selectTask;
        vm.assignedFilterChanged = assignedFilterChanged;
        vm.filterTask = filterTask;
        vm.filterRetain = filterRetain;
        vm.openFilterPage = openFilterPage;
        vm.applyfilters = applyfilters;
        vm.tagCancelled = tagCancelled;
        vm.resetFilters = resetFilters;
        vm.searchMatters = searchMatters;
        vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
        vm.addTask = addTask;
        vm.editTask = editTask;
        vm.deleteTask = deleteTask;
        vm.taskSaved = taskSaved;
        vm.getTasksCount = getTasksCount;
        vm.pageReset = pageReset;
        vm.mondayInfo = '';
        vm.goToMatter = goToMatter;
        vm.reminderDaysList = globalConstants.reminderDaysList;
        vm.getSortByLabel = getSortByLabel;
        vm.openCalender = openCalender;
        vm.validMatter = ""; // BUG#6514 Obj to Check Valid matter
        //US#4713 disable add edit delete 
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.init_first = init_first;
        vm.init = init;
        vm.appliedFilter = false;
        vm.taskHistoryData = [];
        //page filters for task history grid data
        var pageNumber = 1;
        var pageSize = 50;
        vm.exportTaskHistory = exportTaskHistory;
        vm.isMatterActive = 1;
        vm.calArrayList = [];
        vm.goToIntake = goToIntake;
        vm.editMatterTask = false;
        vm.editIntakeTask = false;
        vm.taskClear = taskClear;
        var taskPermissions = masterData.getPermissions();
        if (taskPermissions) {
            vm.taskPermissions = _.filter(taskPermissions[0].permissions, function (per) {
                if (per.entity_name == "Task") {
                    return per;
                }
            });
        }
        vm.sorts = [
            { key: 1, sortby: "duedate,priorityid", sortorder: "ASC,ASC", name: "Due Date ASC" },
            { key: 2, sortby: "duedate,priorityid", sortorder: "DESC,ASC", name: "Due Date DESC" },
            { key: 3, sortby: "modified_date", sortorder: "ASC", name: "Last Modified Date ASC" },
            { key: 4, sortby: "modified_date", sortorder: "DESC", name: "Last Modified Date DESC" },
            { key: 5, sortby: "priorityid,duedate", sortorder: "ASC,DESC", name: "Priority High to Low" }
        ];
        vm.preInit = preInit;



        //init
        (function () {
            preInit();
        })();

        function preInit() {
            var allUsers = taskSummaryDataLayer.getAssignedUserData();
            $q.all([allUsers]).then(function (response) {
                var users = response[0];
                vm.assignedUserList = {};
                vm.assignedUserList.assignedby = angular.copy(users);
                vm.assignedUserList.assignedto = angular.copy(users);

                init();
                vm.userSelectedType = [{ id: 1, name: 'Assigned to Task' }, { id: 2, name: 'All Users' }, { id: 3, name: 'Select User' }];
            });
            $scope.eventFor = [
                {
                    id: 1,
                    name: "Intake"
                },
                {
                    id: 2,
                    name: "Matter"
                },
            ];
            vm.selectedMode = $rootScope.onMatter || $rootScope.onLauncher ? 2 : 1;
        }

        function taskClear() {
            $scope.taskId = null;
            vm.editMatterTask = false;
            vm.editIntakeTask = false;
            vm.display.page = 'taskList';
        }

        vm.goToLauncherTask = function (data) {
            if (data == "cancel") {
                resetCallbackHelper.setCallback(pageReset);
            }
            init();
            vm.editMatterTask = false;
            vm.editIntakeTask = false;
            $scope.taskId = null;

        }

        function init_first() {
            init(true);
        }
        /**
         * 
         * @param {selected sort property} sortBy 
         */
        function getSortByLabel(sortBy) {
            if (utils.isEmptyVal(sortBy)) {
                return " - ";
            }

            var selSort = _.find(vm.sorts, function (sort) {
                return sort.key == sortBy;
            });
            return selSort.name;
        }



        function goToIntake(intake_id) {
            $state.go('intake-overview', { intakeId: intake_id }, { reload: true });
        }

        $scope.$watch(function () {
            if ((vm.filtersData && utils.isNotEmptyVal(vm.filtersData.matterId)) || (vm.filtersData && vm.filtersData.status.length > 0) || (vm.filtersData && vm.filtersData.complete.length > 0) ||
                (vm.filtersData && vm.filtersData.showMatterTask == 1) || ($rootScope.isIntakeActive == 1 && (vm.filtersData && vm.filtersData.showIntakeTask == 1)) ||
                (vm.filtersData && utils.isNotEmptyVal(vm.filtersData.period)) || (vm.filtersData && utils.isNotEmptyVal(vm.filtersData.mytask)) || (vm.filtersData && utils.isNotEmptyVal(vm.filtersData.assignedby)) ||
                (vm.filtersData && utils.isNotEmptyVal(vm.filtersData.assignedto)) || (vm.tags && vm.tags.length > 0) ||
                (vm.filtersData && utils.isNotEmptyVal(vm.filtersData.dueStartDate)) || (vm.filtersData && utils.isNotEmptyVal(vm.filtersData.dueEndDate))) {
                vm.enableApply = false;
            } else {
                vm.enableApply = true;
            }
        })


        /**
         * 
         * @param {selected sort property} sortBy
         */
        vm.applySortByFilter = function (sortBy) {
            vm.sortby = sortBy.toString();
            sessionStorage.setItem('LauncherGlobalTaskSortBy', vm.sortby);
            getFilteredTasks();
        }

        /* Datepicker event bind */
        function openCalender($event) {
            $event.preventDefault();
            $event.stopPropagation();
        };

        function searchReset() {
            vm.taskFilterText = "";
            var filtertext = sessionStorage.setItem("LauncherGlobalTaskText", vm.taskFilterText);
        }

        /* Check whether date range filter validated 
            * True: Disable Apply button
            * False: Enable Apply button
        */
        function isDatesValid() {
            if ($('#taskstartdateerr').css("display") == "block" || $('#taskenddateerr').css("display") == "block") {
                return true;
            }
            else {
                return false;
            }
        }

        function init(calledForRefesh) {
            vm.selectedTask = {};
            vm.taskFilterText = "";
            vm.display = {
                dataReceived: true,
                refreshCount: false,
                page: 'taskList'
            };

            vm.taskFilters = tasksHelper.getTaskFilters();
            vm.selectedFilters = JSON.parse(sessionStorage.getItem("LauncherTaskFilters"));
            vm.filters = JSON.parse(sessionStorage.getItem('LauncherGlobalTaskFilters'));
            if (vm.filters == null) {
                vm.tags = [];
                vm.filters = tasksHelper.getDefaultFilter();
            } else {
                if (vm.filters.matterId != "") {
                    matters.push(vm.filters.matterdetails);
                }
                vm.filters.showMatterTask = angular.copy(vm.filters.showMatterTask);

                if (vm.filters.showIntakeTask == 1 && $rootScope.isIntakeActive == 1) {
                    vm.filters.showIntakeTask = 1;
                } else {
                    vm.filters.showIntakeTask = 0;
                }

                sessionStorage.setItem("LauncherGlobalTaskFilters", JSON.stringify(vm.filters));
            }
            if (vm.selectedFilters == null) {
                vm.selectedFilters = { showMatterTask: 1, showIntakeTask: $rootScope.isIntakeActive == 1 ? 1 : 0 };
            } else {
                vm.selectedFilters.showMatterTask = angular.copy(vm.selectedFilters.showMatterTask);

                if (vm.selectedFilters.showIntakeTask == 1 && $rootScope.isIntakeActive == 1) {
                    vm.selectedFilters.showIntakeTask = 1;
                }
                else {
                    vm.selectedFilters.showIntakeTask = 0;
                }
                sessionStorage.setItem("LauncherTaskFilters", JSON.stringify(vm.selectedFilters));
                vm.tags = LauncherTaskHelper.getTags(vm.filters, matters, vm.assignedUserList, vm.selectedFilters);
            }

            if (calledForRefesh) {
                vm.sortby = "1";
                resetFilters();
                //vm.filters.tab = '';
                $timeout(function () {
                    vm.filters.tab = 'cu';
                    vm.tags = [];
                    searchReset();
                    getFilteredTasks();
                    vm.display.refreshCount = true;
                }, 300);
            }
            else {
                vm.sortby = utils.isNotEmptyVal(sessionStorage.getItem('LauncherGlobalTaskSortBy')) ? sessionStorage.getItem('LauncherGlobalTaskSortBy') : "1";
                getFilteredTasks();
            }

            vm.percentageComplete = LauncherTaskHelper.getPercentageCompleteOptions();
            vm.taskStatus = LauncherTaskHelper.getTaskStatus();
            vm.timeButtons = LauncherTaskHelper.getTimeButtons();
            vm.filterByUserBtn = LauncherTaskHelper.getFilterByUserBtn();
            vm.assignedToBtn = LauncherTaskHelper.getAssignedToButtons();
            var filtertext = sessionStorage.getItem("LauncherGlobalTaskText");
            if (utils.isNotEmptyVal(filtertext)) {
                vm.taskFilterText = filtertext;
            }


        }

        function pageReset(data) {
            vm.display.page = "filter";
            resetFilters(data);
            searchReset();
        }

        //US#7862 function to view comma separated assingTo users
        function assignToUser(selectedTask) {
            if (utils.isNotEmptyVal(selectedTask)) {
                vm.usrfullname = [];
                vm.fullname = {};
                if (utils.isEmptyVal(selectedTask.assign_to)) {
                    vm.fullname = '';
                }
                //US#7862
                if (selectedTask.assigned_to.length > 0) {
                    vm.usrname = [];
                    vm.usrname = _.filter(_.unique(selectedTask.assigned_to, 'user_id'));
                    _.forEach(vm.usrname, function (item) {
                        item.usrfname = utils.isEmptyVal(item.first_name) ? '' : item.first_name;
                        item.usrlname = utils.isEmptyVal(item.last_name) ? '' : item.last_name;
                        vm.usrfullname.push(item.usrfname + ' ' + item.usrlname);
                    })
                    vm.fullname = vm.usrfullname.toString();
                    vm.fullname = vm.fullname.split(',').join(', ');
                }
            }
        }
        //this method is called when:  
        // 1. go to today button click
        // 2. filter is changed
        // 3. date is clicked
        function getFilteredTasks() {
            vm.display.page = 'taskList';
            //cancel all the filters if they are not applied by clicking the apply button

            if (vm.tags.length === 0) {
                resetFilters("fromFilterTask");
            } else {
                vm.appliedFilter = true;
            }

            var selectedSortByObj = _.filter(vm.sorts, function (currentItem, index) {
                return currentItem.key == vm.sortby;
            });
            var data = vm.appliedFilter ? JSON.parse(sessionStorage.getItem("LauncherGlobalTaskFilters")) : tasksHelper.getDefaultFilter();
            data.taskdate = vm.filters.taskdate;
            vm.display.dataReceived = false;
            var filterObj = LauncherTaskHelper.getFilterObj(angular.copy(vm.filters));
            if (filterObj.matterId != "") {
                matters.push(filterObj.matterdetails);
            }
            vm.tags = LauncherTaskHelper.getTags(data, matters, vm.assignedUserList, vm.selectedFilters);
            var finalfilterobject = angular.copy(filterObj);
            delete finalfilterobject.matterdetails;
            var dataRequest = [];
            if (vm.selectedFilters.showIntakeTask == 1 && $rootScope.isIntakeActive == 1) {
                dataRequest.push(getAllRequest($rootScope.isIntakeActive, 'intake', finalfilterobject, selectedSortByObj[0]));
            }
            if (vm.selectedFilters.showMatterTask == 1) {
                dataRequest.push(getAllRequest(vm.isMatterActive, 'matter', finalfilterobject, selectedSortByObj[0]));
            }
            sessionStorage.setItem("LauncherGlobalTaskFilters", JSON.stringify(vm.filters));
            vm.editIntakeTask = false;
            vm.editMatterTask = false;
            if (vm.selectedFilters.showIntakeTask == 1 || vm.selectedFilters.showMatterTask == 1) {
                $q.all(dataRequest).then(function (responses) {
                    if (responses[1] && utils.isNotEmptyVal(responses[1].data[0])) {
                        var container = $('#main-event'),
                            scrollTo = $('#x' + responses[1].data[0].task_id);
                        container.animate({
                            scrollTop: scrollTo.offset() - $("#main-event").offset()
                        }, 100);
                    } else if (responses[0]) {
                        var container = $('#main-event'),
                            scrollTo = $('#x' + responses[0].intake_id);
                        container.animate({
                            scrollTop: scrollTo.offset() - $("#main-event").offset()
                        }, 100);
                    }

                    var values = angular.copy(responses);
                    var intakeTask = [], matterTask = [];
                    if (vm.selectedFilters.showMatterTask == 1) {
                        if (vm.selectedFilters.showIntakeTask == 1 && $rootScope.isIntakeActive == '1') {
                            intakeTask = LauncherTaskHelper.intakeToMatterTaskMapping(values[0]);
                            matterTask = LauncherTaskHelper.matterToMatterTaskMapping(values[1].data);
                        } else {
                            matterTask = LauncherTaskHelper.matterToMatterTaskMapping(values[0].data);
                        }
                    } else {
                        if (vm.selectedFilters.showIntakeTask == 1 && $rootScope.isIntakeActive == 1) {
                            intakeTask = LauncherTaskHelper.intakeToMatterTaskMapping(values[0]);
                        }
                    }
                    tasks = matterTask.concat(intakeTask);
                    var list = angular.copy(tasks);
                    tasks = [];
                    switch (vm.sortby) {
                        case '1':
                            tasks = _.sortBy(list, 'due_date');
                            break;
                        case '2':
                            tasks = _.sortBy(list, 'due_date').reverse();
                            break;
                        case '3':
                            tasks = _.sortBy(list, 'modified_date');
                            break;
                        case '4':
                            tasks = _.sortBy(list, 'modified_date').reverse();
                            break;
                        case '5':
                            var high = _.filter(list, function (item) {
                                return item.priority == "High";
                            })
                            var normal = _.filter(list, function (item) {
                                return item.priority == "Normal";
                            })
                            var low = _.filter(list, function (item) {
                                return item.priority == "Low";
                            })
                            tasks = high.concat(normal).concat(low);
                            break;

                    }
                    _.forEach(tasks, function (t) {
                        if (utils.isNotEmptyVal(t.reminder_days)) {
                            t.reminder_days = t.reminder_days.split(',');
                        }
                    });
                    tasksHelper.setProgressInfo(tasks);
                    vm.taskList = tasks;
                    _.forEach(vm.taskList, function (item) {
                        item.assignmentutcdate = (utils.isEmptyVal(item.assignment_date)) ? "" : moment.unix(item.assignment_date).utc().format('MM/DD/YYYY');
                        item.duedate = (utils.isEmptyVal(item.duedate)) ? "" : moment.unix(item.duedate).utc().format('MM/DD/YYYY');
                        // vm.taskList.push(item);
                    });
                    if (!utils.isEmptyObj(vm.display.savedTask)) {
                        var selectedTask = _.find(vm.taskList, function (task) { return task.task_id === vm.display.savedTask.task_id });
                        vm.selectedTask = utils.isEmptyVal(selectedTask) ? vm.taskList[0] : selectedTask;
                        assignToUser(vm.selectedTask);//US#7862
                        vm.display.savedTask = {};
                    } else {
                        vm.selectedTask = vm.taskList[0];
                        assignToUser(vm.selectedTask);//US#7862
                    }
                    if (utils.isNotEmptyVal(vm.selectedTask)) {
                        //get task history data for selected task 
                        getTaskHistoryData(vm.selectedTask);
                    }
                    vm.display.dataReceived = true;
                    filterTask(vm.taskFilterText);

                    // sessionStorage.setItem("LauncherGlobalTaskFilters", JSON.stringify(vm.filters));
                });
            } else {
                vm.display.dataReceived = true;
                vm.taskList = [];
            }
            vm.appliedFilter = false;
        }

        function getAllRequest(req, data, filterObj, sortObj) {
            if (vm.selectedFilters.showIntakeTask == 1 && req == 1 && data == 'intake') {
                var sort = [{ key: 1, sortby: "due_date,priorityid", sortorder: "ASC,ASC", name: "Due Date ASC" },
                { key: 2, sortby: "due_date,priorityid", sortorder: "DESC,ASC", name: "Due Date DESC" },
                { key: 3, sortby: "modified_date", sortorder: "ASC", name: "Last Modified Date ASC" },
                { key: 4, sortby: "modified_date", sortorder: "DESC", name: "Last Modified Date DESC" },
                { key: 5, sortby: "priorityid,due_date", sortorder: "ASC,DESC", name: "Priority High to Low" }];
                var obj = _.filter(sort, function (item) {
                    return item.key == sortObj.key;
                })
                delete filterObj.showIntakeTask;
                delete filterObj.showMatterTask;
                return intakeTasksDatalayer
                    .getGlobalTasks(filterObj, obj[0])
            }
            if (vm.selectedFilters.showMatterTask == 1 && req == 1 && data == 'matter') {
                delete filterObj.showIntakeTask;
                delete filterObj.showMatterTask;
                return tasksDatalayer
                    .getGlobalTasks_JAVA(filterObj, sortObj)
            }
        }

        //download task history data
        function exportTaskHistory(taskHistory) {
            var pageSize = 1000;
            if (vm.selectedTask.ismatter) {
                LauncherTasksDatalayer.downloadTaskHistory(vm.selectedTask.task_id, pageNumber, pageSize)
                    .then(function (response) {
                        var filename = "Task_History";
                        var linkElement = document.createElement('a');
                        try {
                            var blob = new Blob([response], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                            var url = window.URL.createObjectURL(blob);

                            linkElement.setAttribute('href', url);
                            linkElement.setAttribute("download", filename + ".xlsx");

                            var clickEvent = new MouseEvent("click", {
                                "view": window,
                                "bubbles": true,
                                "cancelable": false
                            });
                            linkElement.dispatchEvent(clickEvent);
                        } catch (ex) {
                            console.log(ex);
                        }
                    })
            }
            if (vm.selectedTask.isIntake) {
                intakeTasksDatalayer.downloadTaskHistory(vm.selectedTask.intake_task_id, pageNumber, pageSize)
                    .then(function (response) {
                        var filename = "Task_History";
                        var linkElement = document.createElement('a');
                        try {
                            var blob = new Blob([response], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                            var url = window.URL.createObjectURL(blob);

                            linkElement.setAttribute('href', url);
                            linkElement.setAttribute("download", filename + ".xlsx");

                            var clickEvent = new MouseEvent("click", {
                                "view": window,
                                "bubbles": true,
                                "cancelable": false
                            });
                            linkElement.dispatchEvent(clickEvent);
                        } catch (ex) {
                            console.log(ex);
                        }
                    })
            }

        }

        function goToMatter(matterId) {
            $state.go('add-overview', { matterId: matterId }, { reload: true });
        }

        function getTasksByDate(day) {
            vm.filters.taskdate = day.utcTimestamp;
            getFilteredTasks();
        }

        function selectTask(task) {
            vm.selectedTask = task;
            assignToUser(vm.selectedTask);//US37862
            if (vm.selectedTask.ismatter) {
                getTaskRemindUser(vm.selectedTask);
            } else {
                getTaskRemindUser(vm.selectedTask, 'intake');
            }
            //get task history data for selected task 
            getTaskHistoryData(vm.selectedTask);
        }

        //get task history of selected task
        function getTaskHistoryData(selectedTask) {
            var event_reason = [];
            if (selectedTask.ismatter) {
                LauncherTasksDatalayer.gettaskHistory_OFF_DRUPAL(selectedTask.task_id, pageNumber, pageSize)
                    .then(function (data) {
                        vm.taskHistoryData = data;
                        event_reason = angular.copy(masterData.getMasterData().event_reschedule_reason);
                        event_reason.splice(0, 1);
                        event_reason.splice(1, 1);
                        var reschedule_reason = angular.copy(event_reason);
                        //set reason name
                        _.forEach(vm.taskHistoryData, function (data) {
                            _.forEach(reschedule_reason, function (item) {
                                if (data.reason == '0') {
                                    data.reason = '-';
                                } else {
                                    if (data.reason == item.reason_order) {
                                        data.reason = item.reason_name;
                                    }
                                }
                            })
                        })

                    }, function (error) {
                        notificationService.error("Task history not loaded")
                    })
            }
            if (selectedTask.isIntake) {
                intakeTasksDatalayer.gettaskHistory_OFF_DRUPAL(selectedTask.intake_task_id, pageNumber, pageSize)
                    .then(function (data) {
                        vm.taskHistoryData = data;
                        event_reason = angular.copy(masterData.getMasterData().event_reschedule_reason);
                        event_reason.splice(0, 1);
                        event_reason.splice(1, 1);
                        var reschedule_reason = angular.copy(event_reason);
                        //set reason name
                        _.forEach(vm.taskHistoryData, function (data) {
                            _.forEach(reschedule_reason, function (item) {
                                if (data.reason == '0') {
                                    data.reason = '-';
                                } else {
                                    if (data.reason == item.reason_order) {
                                        data.reason = item.reason_name;
                                    }
                                }
                            })
                        })
                    }, function (error) {
                        notificationService.error("Task history not loaded")
                    })
            }
            vm.taskDescription = (utils.isEmptyVal(selectedTask) || utils.isEmptyVal(selectedTask.doc_uri) ? ' ' : selectedTask.doc_uri) + '&nbsp;&nbsp;' + (utils.isEmptyVal(selectedTask.notes) ? ' ' : selectedTask.notes);

        }

        //retaintion of search field 
        function filterRetain() {
            var filtertext = vm.taskFilterText;
            sessionStorage.setItem("LauncherGlobalTaskText", filtertext);
        }


        function assignedFilterChanged() {
            vm.filters.assigned = "";
            vm.filtersData.assignedby = "";
            vm.filtersData.assignedto = "";
            vm.filtersData.assignedbyId = "";
            vm.filtersData.assignedtoId = "";
        }

        function filterTask(filterText) {
            vm.display.page = 'taskList';
            var filterTextObj = { task_name: filterText };
            vm.taskList = $filter('filter')(tasks, filterTextObj);
            vm.selectedTask = vm.taskList[0];
            if (vm.selectedTask && vm.selectedTask.ismatter) {
                getTaskRemindUser(vm.selectedTask);
            } else {
                getTaskRemindUser(vm.selectedTask, 'intake');
            }
            if (utils.isNotEmptyVal(vm.selectedTask)) {
                getTaskHistoryData(vm.selectedTask);
            }
            resetCallbackHelper.setCallback(pageReset);
        }

        function openFilterPage() {
            if (vm.display.page == 'filter') {
                vm.display.page = 'taskList';
                if (vm.appliedFilter) {
                    resetCallbackHelper.setCallback(pageReset);
                } else {
                    vm.filtersData = JSON.parse(sessionStorage.getItem('LauncherGlobalTaskFilters'));
                    vm.filters = vm.filtersData;
                }
            } else {
                vm.display.page = 'filter';
                vm.filtersData = JSON.parse(sessionStorage.getItem('LauncherGlobalTaskFilters'));
                vm.filtersData.dueStartDate = typeof vm.filters.dueStartDate == 'string' ? vm.filters.dueStartDate : moment(vm.filtersData.dueStartDate).format();
                vm.filtersData.dueEndDate = typeof vm.filters.dueEndDate == 'string' ? vm.filters.dueEndDate : moment(vm.filtersData.dueEndDate).format();
            }

        }

        function applyfilters() {
            vm.filters = angular.copy(vm.filtersData);
            vm.appliedFilter = true;
            //Bug#6514 To check valid matter names
            if (utils.isNotEmptyVal(vm.validMatter.matterid) || utils.isEmptyVal(vm.filters.matterId)) {
                vm.validMatter;
                vm.filters.matterdetails = vm.validMatter;
            } else {
                notificationService.error("Invalid Matter Selected");
                return;
            }
            if (typeof vm.filters.matterId === 'undefined') {
                vm.filters.matterId = '';
            }

            // validation due date filter
            if (vm.filters.tab !== 'cu') {
                (vm.filters.dueStartDate == null) ? vm.filters.dueStartDate = "" : ""; // set blank value if date val is null
                (vm.filters.dueEndDate == null) ? vm.filters.dueEndDate = "" : ""; // set blank value if date val is null
                if (vm.filters.dueStartDate != "" && vm.filters.dueEndDate == "") {
                    notificationService.error("Invalid date range.");
                    return;
                } else if (vm.filters.dueStartDate == "" && vm.filters.dueEndDate != "") {
                    notificationService.error("Invalid date range.");
                    return;
                } else if (vm.filters.dueStartDate != "" && vm.filters.dueEndDate != "") {
                    // validation for End date cannot be less than start date
                    if (getDays(vm.filters) == 0) {
                        notificationService.error('End date cannot be less than start date.');
                        return;
                    }
                }
            }

            if (vm.filters.assignedby !== '' && vm.filters.assignedby !== null && angular.isDefined(vm.filters.assignedby)) {
                var assignedby = _.find(vm.assignedUserList.assignedby, function (item) {
                    return item.uid === vm.filters.assignedby.uid;
                });
                vm.filters.assignedbyId = assignedby.uid;
            }

            if (vm.filters.assignedto !== '' && vm.filters.assignedto !== null && angular.isDefined(vm.filters.assignedto)) {
                var assignedto = _.find(vm.assignedUserList.assignedto, function (item) {
                    return item.uid === vm.filters.assignedto.uid;
                });
                vm.filters.assignedtoId = assignedto.uid;
            }
            vm.selectedFilters.showMatterTask = angular.copy(vm.filters.showMatterTask);
            vm.selectedFilters.showIntakeTask = angular.copy(vm.filters.showIntakeTask);
            sessionStorage.setItem("LauncherGlobalTaskFilters", JSON.stringify(vm.filters));
            sessionStorage.setItem("LauncherTaskFilters", JSON.stringify(vm.selectedFilters));
            var filteredData = angular.copy(vm.filters);
            vm.tags = LauncherTaskHelper.getTags(filteredData, matters, vm.assignedUserList, '', vm.selectedFilters);


            if ((vm.filters.status == 'Completed') || (vm.filters.complete == 100)) {
                vm.filters.tab = 'co';
            } else if (vm.filters.status == 'Completed' && (vm.tags.length) == 2 && vm.filters.complete == 100) {
                vm.filters.tab = 'co';
            }

            getFilteredTasks();
            vm.display.page = 'taskList';
            resetCallbackHelper.setCallback(pageReset);
        }

        // Get No. of days different between start and end date
        function getDays(filterdates) {
            if (utils.isNotEmptyVal(filterdates)) {
                if (utils.isNotEmptyVal(filterdates.dueStartDate) && utils.isNotEmptyVal(filterdates.dueEndDate)) {
                    var start = moment.unix(filterdates.dueStartDate);
                    var end = moment.unix(filterdates.dueEndDate);
                    if (end.diff(start, 'days', true) < 0) {
                        return 0;
                    } else {
                        return 1;
                    }
                }
            }
            return 0;
        }

        function tagCancelled(filterObj) {
            if (angular.isDefined(filterObj.cancelled)) {
                if (filterObj.prop == "assingedby" || filterObj.prop == "assingedto") {
                    if (filterObj.prop == "assingedby") {
                        vm.filters.assignedby = "";
                        vm.filters.assignedbyId = "";
                    } else {
                        vm.filters.assignedto = "";
                        vm.filters.assignedtoId = "";
                    }
                } else {
                    var index = vm.filters[filterObj.prop].indexOf(filterObj.cancelled);
                    vm.filters[filterObj.prop].splice(index, 1);
                }

            } else if (filterObj.prop == "duedate") {
                vm.filters.dueStartDate = "";
                vm.filters.dueEndDate = "";
            } else {
                vm.filters[filterObj.prop] = "";
                if (filterObj.prop == 'mytask') {
                    vm.filters['assigned'] = "";
                    vm.tags = LauncherTaskHelper.getTags(vm.filters, matters, vm.assignedUserList, '', vm.selectedFilters);
                }
            }

            if ((vm.filters.status == 'Completed' && (vm.tags.length) < 2) || (vm.filters.complete == 100 && (vm.tags.length) < 2)) {
                vm.filters.tab = 'co';
            } else if (vm.filters.status == 'Completed' && (vm.tags.length) == 2 && vm.filters.complete == 100) {
                vm.filters.tab = 'co';
            }

            if (filterObj.type == "showIntakeTask") {
                vm.selectedFilters.showIntakeTask = 0;
                vm.filters.showIntakeTask = 0;
            }
            if (filterObj.type == "showMatterTask") {
                vm.selectedFilters.showMatterTask = 0;
                vm.filters.showMatterTask = 0;
            }
            sessionStorage.setItem("LauncherGlobalTaskFilters", JSON.stringify(vm.filters));
            sessionStorage.setItem("LauncherTaskFilters", JSON.stringify(vm.selectedFilters));
            getFilteredTasks();
            if (vm.filters.tab == "cu") {
                vm.display.refreshCount = true;
                getTasksCount(vm.mondayInfo);
            }
        }

        function resetFilters(data) {
            if (data == 'tag') {
                vm.filtersData.status.length = 0;
                vm.filtersData.complete.length = 0;
                vm.filtersData.mytask = "";
                vm.filtersData.assigned = "";
                vm.filtersData.assignedto = "";
                vm.filtersData.assignedby = "";
                vm.filtersData.assignedbyId = "";
                vm.filtersData.assignedtoId = "";
                vm.filtersData.period = "";
                vm.filtersData.dueStartDate = "";
                vm.filtersData.dueEndDate = "";
                vm.filtersData.matterId = '';
                vm.filtersData.matterdetails = '';
                // vm.filtersData = angular.copy(vm.filters);
            } else {
                vm.tags = [];
                vm.filters.status.length = 0;
                vm.filters.complete.length = 0;
                vm.filters.mytask = "";
                vm.filters.assigned = "";
                vm.filters.assignedto = "";
                vm.filters.assignedby = "";
                vm.filters.assignedbyId = "";
                vm.filters.assignedtoId = "";
                vm.filters.period = "";
                vm.filters.dueStartDate = "";
                vm.filters.dueEndDate = "";
                vm.filters.matterId = '';
                vm.filters.matterdetails = '';

                if (data == "fromFilterTask") {
                    vm.filters.showMatterTask = vm.selectedFilters.showMatterTask;
                    vm.filters.showIntakeTask = $rootScope.isIntakeActive == 1 ? vm.selectedFilters.showIntakeTask : 0;
                    angular.noop();
                } else {
                    vm.filters.showMatterTask = 1;
                    vm.filters.showIntakeTask = $rootScope.isIntakeActive == 1 ? 1 : 0;
                    vm.selectedFilters = { showMatterTask: 1, showIntakeTask: $rootScope.isIntakeActive == 1 ? 1 : 0 };
                }
                sessionStorage.setItem("LauncherGlobalTaskFilters", JSON.stringify(vm.filters));
                sessionStorage.setItem("LauncherTaskFilters", JSON.stringify(vm.selectedFilters));
                vm.filtersData = angular.copy(vm.filters);
            }

        }


        var matters = [];
        function searchMatters(matterName) {
            vm.validMatter = "";
            return matterFactory.searchMatters(matterName)
                .then(function (response) {
                    matters = response.data;
                    return response.data;
                });
        }

        function formatTypeaheadDisplay(matterid) {
            if (angular.isUndefined(matterid) || utils.isEmptyString(matterid)) {
                return undefined;
            }
            //Bug#6514 Object to check valid matters
            vm.validMatter = _.find(matters, function (matter) {
                return matter.matterid === matterid;
            });
            var matterInfo = _.find(matters, function (matter) {
                return matter.matterid === matterid;
            });
            return matterInfo.name;
        }

        function addTask() {
            if (vm.taskPermissions[0].A == 0 || vm.isGraceOver == 0) {
                vm.selectedMode = 1;
            } else {
                vm.selectedMode = $rootScope.onMatter || $rootScope.onLauncher ? 2 : 1;
            }
            tasksHelper.setGlobalTaskInfo();
            vm.editMatterTask = false;
            vm.editIntakeTask = false;
            vm.display.page = 'addTask';
        }

        function editTask(tasks) {
            $timeout(function () {
                if (tasks.ismatter) {
                    tasksHelper.setGlobalTaskInfo(tasks.task_id);
                    vm.editMatterTask = true;
                    vm.display.page = 'addTask';
                }
                if (tasks.isIntake) {
                    $scope.taskId = angular.copy(vm.selectedTask);
                    IntakeTasksHelper.setGlobalTaskInfo(tasks.intake_task_id);
                    vm.editIntakeTask = true;
                    vm.display.page = 'addTask';

                }
            }, 300);

        }

        function deleteTask(taskId) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                if (taskId.ismatter) {
                    LauncherTasksDatalayer
                        .deleteTask(taskId.task_id)
                        .then(function () {
                            notificationService.success("Task deleted successfully.");
                            vm.display.refreshCount = true;
                            getFilteredTasks();
                        }, function () {
                            notificationService.error("Unable to delete task.");
                        })
                }
                if (taskId.isIntake) {
                    intakeTasksDatalayer
                        .deleteTask(taskId.intake_task_id)
                        .then(function () {
                            notificationService.success("Task deleted successfully.");
                            vm.display.refreshCount = true;
                            getFilteredTasks();
                        }, function () {
                            notificationService.error("Unable to delete task.");
                        })
                }

            })
        }

        function getCountRequest(req, data, timestamp, filterObj) {
            delete filterObj.showIntakeTask;
            delete filterObj.showMatterTask;
            if (req == 1 && data == 'intake') {
                filterObj.pageSize = 100;
                return intakeTasksDatalayer.getGlobalTaskCount(timestamp, filterObj)
            }
            if (req == 1 && data == 'matter') {
                return LauncherTasksDatalayer.getGlobalTaskCount_JAVA(timestamp, filterObj)
            }
        }


        function getTasksCount(mondayInfo) {
            if (mondayInfo) {
                vm.mondayInfo = mondayInfo;
            }
            var filterObj = LauncherTaskHelper.getFilterObj(angular.copy(vm.filters));
            delete filterObj.taskdate;
            delete filterObj.matterdetails;
            var dataRequest = [];
            if (vm.selectedFilters.showIntakeTask == 1 && $rootScope.isIntakeActive == 1) {
                dataRequest.push(getCountRequest($rootScope.isIntakeActive, 'intake', mondayInfo.utcTimestamp, filterObj));
            }
            if (vm.selectedFilters.showMatterTask == 1) {
                dataRequest.push(getCountRequest(vm.isMatterActive, 'matter', mondayInfo.utcTimestamp, filterObj));
            }
            var deferred = $q.defer();
            if (vm.selectedFilters.showIntakeTask == 1 || vm.selectedFilters.showMatterTask == 1) {
                $q.all(dataRequest).then(function (response) {
                    var allCounts = angular.copy(response);
                    var intakeTask = [], matterTask = [];
                    if (vm.selectedFilters.showMatterTask == 1) {
                        if (vm.selectedFilters.showIntakeTask == 1 && $rootScope.isIntakeActive == '1') {
                            intakeTask = LauncherTaskHelper.setIntakeCounts(mondayInfo, allCounts[0]);
                            matterTask = LauncherTaskHelper.setCounts(mondayInfo, allCounts[1].data);
                        } else {
                            matterTask = LauncherTaskHelper.setCounts(mondayInfo, allCounts[0].data);
                        }
                    } else {
                        if (vm.selectedFilters.showIntakeTask == 1 && $rootScope.isIntakeActive == 1) {
                            intakeTask = LauncherTaskHelper.setIntakeCounts(mondayInfo, allCounts[0]);
                        }
                    }

                    var count = [];
                    if (vm.selectedFilters.showMatterTask == 1) {
                        if (vm.selectedFilters.showIntakeTask == 1 && $rootScope.isIntakeActive == '1') {
                            _.forEach(intakeTask, function (a, index) {
                                _.forEach(matterTask, function (b, idx) {
                                    if (index == idx) {
                                        count.push(a + b);
                                    }
                                })
                            })
                        } else {
                            count = matterTask;
                        }
                    }
                    else {
                        if (vm.selectedFilters.showIntakeTask == 1 && $rootScope.isIntakeActive == 1) {
                            count = intakeTask;
                        }
                    }
                    deferred.resolve(count);
                })
            } else {

                var cnt = [0, 0, 0, 0, 0, 0, 0];
                deferred.resolve(cnt);
            }
            return deferred.promise;
        }

        function taskSaved(savedTask, duedate) {
            if (utils.isEmptyObj(savedTask)) {
            } else {
                if (vm.selectedFilters.showIntakeTask == 1 && $rootScope.isIntakeActive == '1' && savedTask.intake_id) {
                    var mappedTask = LauncherTaskHelper.mapIntaketoMatterObj(savedTask);
                } else if (!utils.isEmptyObj(savedTask.matter)) {
                    var mappedTask = savedTask;
                    mappedTask.duedate = savedTask.due_date;
                } else if (utils.isNotEmptyVal(savedTask.intake_id)) {
                    var mappedTask = LauncherTaskHelper.mapIntaketoMatterObj(savedTask);
                }
                vm.filters.tab = LauncherTaskHelper.getStatus(mappedTask, vm.filters.tab);
                if (vm.filters.tab === "cu") {
                    vm.filters.taskdate = duedate ? duedate : mappedTask.duedate; //savedTask.dueutcdate;
                    //set appropriate start of day and get the utc timestamp
                }
                $scope.taskId = null;
                vm.display.savedTask = mappedTask;
            }
            vm.display.page = "taskList";
            getFilteredTasks();
        }

        function setAssignedTo(val) {
            if (val !== 0) {
                vm.filters.assigned = "";
            }
        }

        //US#8558 Event & Task reminder to matter users or all users
        function getTaskRemindUser(task, data) {
            if (utils.isEmptyVal(task)) { return }
            if (task.reminder_users == "assignedusers") {
                vm.userSelectedMode = 1;

            } else if (task.reminder_users == "all") {
                vm.userSelectedMode = 2;

            } else if (JSON.parse(task.reminder_users) instanceof Array) {
                vm.remindUserList = [];
                vm.userSelectedMode = 3;
                if (angular.isDefined(task.reminder_users) && task.reminder_users != "" && task.reminder_users != "all" && task.reminder_users != "matter") {
                    //task.remind_users_temp = task.remind_users;
                } else {
                    task.reminder_users = [];
                }

                contactFactory.getUsersInFirm()
                    .then(function (response) {
                        vm.remindUserList = response.data;
                        task.remind_users_temp = [];
                        _.forEach(JSON.parse(task.reminder_users), function (taskid, taskindex) {
                            _.forEach(vm.remindUserList, function (item) {
                                if (taskid == item.user_id) {
                                    task.remind_users_temp.push(parseInt(taskid));
                                }
                            });
                        });
                    });

            }
        }

        // function getTaskRemindUser(task) {
        //     if (utils.isEmptyVal(task)) { return }
        //     if (task.remind_users == "assignedusers") {
        //         vm.userSelectedMode = 1;
        //     } else if (task.remind_users == "all") {
        //         vm.userSelectedMode = 2;
        //     } else if (task.remind_users instanceof Array) {
        //         vm.remindUserList = [];
        //         vm.userSelectedMode = 3;
        //         if (angular.isDefined(task.remind_users) && task.remind_users != "" && task.remind_users != "all" && task.remind_users != "matter") {
        //             //task.remind_users = task.remind_users;
        //         } else {
        //             task.remind_users = [];
        //         }

        //         contactFactory.getUsersInFirm()
        //             .then(function (response) {
        //                 vm.remindUserList = response.data;
        //                 vm.remind_users_temp = task.remind_users;
        //                 task.remind_users = [];
        //                 _.forEach(vm.remind_users_temp, function (taskid, taskindex) {
        //                     _.forEach(vm.remindUserList, function (item) {
        //                         if (taskid == item.uid) {
        //                             task.remind_users.push(taskid);
        //                         }
        //                     });
        //                 });

        //             });

        //     }
        // }


    }


})();

(function () {
    'use strict';

    angular
        .module('intake.tasks')
        .factory('LauncherTaskHelper', LauncherTaskHelper);

    LauncherTaskHelper.$inject = [];

    function LauncherTaskHelper() {

        return {
            getFilterObj: getFilterObj,
            setCounts: setCounts,
            getPercentageCompleteOptions: getPercentageCompleteOptions,
            getTaskStatus: getTaskStatus,
            getTimeButtons: getTimeButtons,
            getFilterByUserBtn: getFilterByUserBtn,
            getAssignedToButtons: getAssignedToButtons,
            getTags: getTags,
            getStatus: getStatus,
            getSavedTaskAtTop: getSavedTaskAtTop,
            intakeToMatterTaskMapping: intakeToMatterTaskMapping,
            matterToMatterTaskMapping: matterToMatterTaskMapping,
            setIntakeCounts: setIntakeCounts,
            mapIntaketoMatterObj: mapIntaketoMatterObj
        }

        function getFilterObj(currentFilters) {
            if (currentFilters.tab == 'ov') {
                var today = moment().startOf('day');
                var startOfDayUTC = utils.getUTCTimeStamp(today);
                currentFilters.taskdate = startOfDayUTC;
            } else if (currentFilters.tab == 'co') {
                currentFilters.taskdate = "";
            }
            // if (currentFilters.intake) {
            //     currentFilters.intakeId = angular.isUndefined(currentFilters.intake) ? "" : currentFilters.intake.intakeId;
            // }
            // if (currentFilters.matterId) {
            currentFilters.matterId = angular.isUndefined(currentFilters.matterId) ? "" : currentFilters.matterId;
            // }
            currentFilters.mytask = angular.isUndefined(currentFilters.mytask) ? "" : currentFilters.mytask;
            currentFilters.mytask === 1 ?
                currentFilters.assigned = angular.isUndefined(currentFilters.assigned) ? "" : currentFilters.assigned :
                currentFilters.assigned = '';
            currentFilters.dueStartDate = utils.isEmptyVal(currentFilters.dueStartDate) ? "" : utils.getUTCTimeStamp(currentFilters.dueStartDate);
            currentFilters.dueEndDate = utils.isEmptyVal(currentFilters.dueEndDate) ? "" : utils.getUTCTimeStampEndDay(currentFilters.dueEndDate);
            currentFilters.status = currentFilters.status.toString();
            currentFilters.status = encodeURIComponent(currentFilters.status);
            currentFilters.complete = currentFilters.complete.toString();
            if (angular.isDefined(currentFilters.period)) {
                currentFilters.s = angular.isDefined(currentFilters.period.s) ? currentFilters.period.s : '';
                currentFilters.e = angular.isDefined(currentFilters.period.e) ? currentFilters.period.e : '';
                delete currentFilters.period;
            }

            currentFilters.assignedby = currentFilters.assignedbyId ? currentFilters.assignedbyId : '';
            currentFilters.assignedto = currentFilters.assignedtoId ? currentFilters.assignedtoId : '';
            return currentFilters;
        }

        function setStartEndDate(dt, startOfDay) {
            if (utils.isEmptyVal(dt)) {
                return '';
            }
            dt = moment(dt).unix();
            var date = moment.unix(dt);
            date = startOfDay ? date.startOf('day') : date.endOf('day');
            date = date.valueOf();
            return moment(date).unix();
        }

        function getTags(filters, matters, assignedList, selectedFilter) {
            var tags = [];
            var id = 0;

            if (!utils.isEmptyObj(filters.period)) {
                id++;
                var assignedTag = { value: filters.period.tag, prop: 'period', key: id };
                tags.push(assignedTag);
            }

            var matter = _.find(matters, function (matter) {
                return matter.matterid === filters.matterId;
            });

            if (utils.isNotEmptyVal(matter)) {
                id++;
                var matterTag = { value: 'matter: ' + matter.name, prop: 'matterId', key: id };
                tags.push(matterTag);
            }

            if (utils.isNotEmptyVal(filters.mytask)) {
                id++;
                var myTaskTag = { value: filters.mytask === 1 ? 'My Tasks' : 'All Tasks', prop: 'mytask', key: id };
                tags.push(myTaskTag);
            }

            if (filters.mytask && utils.isNotEmptyVal(filters.assigned)) {
                id++;
                var assignedToTag = { value: filters.assigned === 1 ? 'Assigned By Me' : 'Assigned To Me', prop: 'assigned', key: id };
                tags.push(assignedToTag);
            }

            if (utils.isNotEmptyVal(filters.dueStartDate) && utils.isNotEmptyVal(filters.dueEndDate)) {
                id++;
                var assignedToTag = { value: 'Due Date from: ' + moment.unix(moment(filters.dueStartDate).unix()).format('MM-DD-YYYY') + ' to: ' + moment.unix(moment(filters.dueEndDate).unix()).format('MM-DD-YYYY'), prop: 'duedate', key: id, due_date_condition: false };
                tags.push(assignedToTag);
            }

            _.forEach(filters.status, function (status) {
                id++;
                var statusTag = { value: 'Status: ' + status, prop: 'status', cancelled: status, key: id };
                tags.push(statusTag);
            });

            _.forEach(filters.complete, function (complete) {
                id++;
                var completeTag = { value: 'Completed: ' + complete + '%', prop: 'complete', cancelled: complete, key: id };
                tags.push(completeTag);
            });

            if (angular.isDefined(filters.assignedby) && filters.assignedby != '') {

                if (angular.isDefined(assignedList)) {
                    _.forEach(assignedList.assignedby, function (data) {
                        if (filters.assignedbyId == data.uid) {
                            id++;
                            var statusTag = { value: "Assigned By: " + data.fname, prop: 'assingedby', cancelled: data.fname, key: id };
                            tags.push(statusTag);
                        }
                    });
                }
            }

            if (angular.isDefined(filters.assignedto) && filters.assignedto != '') {

                if (angular.isDefined(assignedList)) {
                    _.forEach(assignedList.assignedto, function (data) {
                        if (filters.assignedtoId == data.uid) {
                            id++;
                            var statusTag = { value: "Assigned To: " + data.fname, prop: 'assingedto', cancelled: data.fname, key: id };
                            tags.push(statusTag);
                        }
                    });
                }
            }
            if (selectedFilter.showIntakeTask == '1') {
                tags.push({ 'key': 1, 'value': 'Intake Tasks', 'type': 'showIntakeTask' });
            }

            // Is showMatterEvents
            if (selectedFilter.showMatterTask == '1') {
                tags.push({ 'key': 1, 'value': 'Matter Tasks', 'type': 'showMatterTask' });
            }
            return tags;
            sessionStorage.setItem('tagslength', JSON.stringify(tags));
        }

        function mapIntaketoMatterObj(intakeTask) {
            var matterEvent = {
                id: intakeTask.intake_task_id,
                notes: intakeTask.notes,
                percentage_complete: intakeTask.percentage_complete,
                priority: intakeTask.priority,
                status: intakeTask.status,
                user_ids: intakeTask.user_id,
                isIntake: true,
                task_name: intakeTask.task_name,
                intakeName: intakeTask.intakeName,
                duedate: intakeTask.due_date,
                matter_id: intakeTask.intake_id,
                task_subcategoryid: intakeTask.intake_task_subcategory_id,
                comments: intakeTask.comments,
                matter: {
                    matter_id: intakeTask.intake_id,
                    matter_name: intakeTask.intakeName,
                },
            };
            return matterEvent;
        }

        function intakeToMatterTaskMapping(intakeTask) {
            var matterTask = [];
            _.forEach(intakeTask, function (intakeTask) {
                var matterEvent = {
                    id: intakeTask.intake_task_id,
                    modified_by: intakeTask.modified_by,
                    modified_date: intakeTask.modified_date,
                    notes: intakeTask.notes,
                    percentage_complete: intakeTask.percentage_complete,
                    priority: intakeTask.priority,
                    status: intakeTask.status,
                    user_ids: intakeTask.user_id,
                    task_count: intakeTask.taskCount,
                    isIntake: true,
                    assigned_by: intakeTask.assigned_by,
                    assigned_to: intakeTask.assignedTo,
                    task_name: intakeTask.task_name,
                    intakeName: intakeTask.intakeName,
                    duedate: intakeTask.due_date,
                    matter_id: intakeTask.intake_id,
                    task_subcategoryid: intakeTask.intake_task_subcategory_id,
                    matter: {
                        matter_id: intakeTask.intake_id,
                        matter_name: intakeTask.intakeName,
                    },
                    is_other: null,
                    created_date: intakeTask.created_date,
                    created_by: intakeTask.created_by,
                    assignment_date: intakeTask.assignment_date,
                    is_deleted: 0,
                };
                intakeTask.assignedTo = intakeTask.assignedTo;
                angular.extend(intakeTask, matterEvent);
                matterTask.push(intakeTask);
            });
            _.forEach(matterTask, function (item) {
                if (item.isIntake) {
                    if (!utils.isEmptyObj(item.assigned_by)) {
                        item.assigned_by.firm_id = item.assigned_by.firmId;
                        item.assigned_by.first_name = item.assigned_by.fullName;
                        item.assigned_by.is_active = item.assigned_by.isActive;
                        item.assigned_by.is_admin = item.assigned_by.isAdmin;
                        item.assigned_by.last_name = item.assigned_by.lname;
                        item.assigned_by.user_id = item.assigned_by.userId;
                    }
                    _.forEach(item.assigned_to, function (currentItem) {
                        currentItem.firm_id = currentItem.firmId;
                        currentItem.first_name = currentItem.fullName;
                        currentItem.is_active = currentItem.isActive;
                        currentItem.is_admin = currentItem.isAdmin;
                        currentItem.last_name = currentItem.lname;
                        currentItem.user_id = currentItem.userId;
                        currentItem.user_name = currentItem.uname;
                    })
                }
            })
            return matterTask;
        }

        function matterToMatterTaskMapping(matterEvents) {
            _.forEach(matterEvents, function (matterEvent) {
                matterEvent.id = matterEvent.task_id;
                matterEvent.ismatter = true;
                matterEvent.duedate = matterEvent.due_date;
            });
            return matterEvents;
        }

        function setIntakeCounts(monday, counts) {
            convertDueDatesToStartOfDay(counts);
            var start = moment(moment.unix(monday.utcTimestamp).utc().format('MM/DD/YYYY'));
            var end = angular.copy(start).days(7);
            var range = moment().range(start, end);
            var countsByDate = [];
            var date = start;

            while (range.contains(date)) {
                var dateParam = date.format('YYYY-MM-DD');
                //get all the countObj for current date
                var countsForDateParam = _.filter(counts, function (cntObj) {

                    return cntObj.localDate === dateParam;
                });
                //sum the counts
                if (angular.isDefined(countsForDateParam) && countsForDateParam.length > 0) {
                    var cnt = 0;
                    _.forEach(countsForDateParam, function (count) {
                        cnt += parseInt(count.taskCount);
                    })
                    countsByDate.push(cnt);
                } else {
                    countsByDate.push(0);
                }
                date = date.add(1, 'days');
            }

            return countsByDate;
        }

        function setCounts(monday, counts) {
            convertDueDatesToStartOfDay(counts);
            var start = moment(moment.unix(monday.utcTimestamp).utc().format('MM/DD/YYYY'));
            var end = angular.copy(start).days(7);
            var range = moment().range(start, end);
            var countsByDate = [];
            var date = start;

            while (range.contains(date)) {
                var dateParam = date.format('YYYY-MM-DD');
                //get all the countObj for current date
                var countsForDateParam = _.filter(counts, function (cntObj) {
                    //var duedate = moment.unix(cntObj.duedate);
                    //var formattedDueDate = duedate.format('YYYY-MM-DD');
                    return cntObj.localDate === dateParam;
                });
                //sum the counts
                if (angular.isDefined(countsForDateParam) && countsForDateParam.length > 0) {
                    var cnt = 0;
                    _.forEach(countsForDateParam, function (count) {
                        cnt += parseInt(count.task_count);
                    })
                    countsByDate.push(cnt);
                } else {
                    countsByDate.push(0);
                }
                date = date.add(1, 'days');
            }

            return countsByDate;
        }

        function convertDueDatesToStartOfDay(counts) {
            _.forEach(counts, function (count) {
                var dueDate = count.due_date;
                var localDate = moment(moment.unix(dueDate).utc().format('MM/DD/YYYY'));
                count.localDate = localDate.format('YYYY-MM-DD');
            })
        }

        function getPercentageCompleteOptions() {
            var options = [
                { label: '0%', value: 0 },
                { label: '25%', value: 25 },
                { label: '50%', value: 50 },
                { label: '75%', value: 75 },
                { label: '100%', value: 100 }
            ];
            return options;
        }

        function getTaskStatus() {
            var options = [
                'Not Started',
                'In Progress',
                'Awaiting Clarification',
                'Received & Acknowledged',
                'Completed'];
            return options
        }

        function getTimeButtons() {
            var timeButtons = [
                { value: getTodayObj(), label: 'Today' },
                { value: getLastWeekObj(), label: 'Last Week' },
                { value: getAMonthAgoObj(), label: 'A Month Ago' }
            ];

            return timeButtons;
        }

        function getTodayObj() {
            // var start = moment().startOf('day');
            var start = utils.getUTCTimeStamp(new Date());
            // var end = moment().endOf('day');
            var end = utils.getUTCTimeStampEndDay(new Date());
            return { s: start, e: end, tag: 'Assigned: Today' };
        }

        //start date is a week's ago dat e and end date is today
        function getLastWeekObj() {
            var today = moment().endOf('day');
            var weekAgo = angular.copy(today).subtract(7, 'days');
            return { s: weekAgo.utc().unix(), e: today.utc().unix(), tag: 'Assigned: A Week Ago' };
        }

        //start date is a months's ago dat e and end date is today
        function getAMonthAgoObj() {
            var today = moment().endOf('day');
            var monthAgo = angular.copy(today).subtract(1, 'months');
            return { s: monthAgo.utc().unix(), e: today.utc().unix(), tag: 'Assigned: A Month Ago' };
        }

        function getFilterByUserBtn() {
            var filterByUserBtns = [
                { label: 'My Tasks', value: 1 },
                { label: 'All Tasks', value: 0 }
            ];
            return filterByUserBtns;
        }

        function getAssignedToButtons() {
            var filterByUserBtns = [
                { label: 'Assigned By Me', value: 1 },
                { label: 'Assigned To Me', value: 2 }
            ];
            return filterByUserBtns;
        }

        function getStatus(task, current) {
            if (isTaskComplete(task)) {
                return "co"
            }
            if (isTaskCurrent(task)) {
                return "cu";
            }
            if (isTaskOverdue(task)) {
                return "ov";
            }
            return current;
        }

        function isTaskComplete(task) {
            return parseInt(task.percentage_complete) === 100;
        }

        function isTaskCurrent(task) {
            var dueDate = moment(moment.unix(task.duedate).utc().format('MM/DD/YYYY'));
            var todayStartOfDay = moment().startOf('day');
            return ((parseInt(task.percentage_complete) < 100) &&
                (dueDate.isAfter(todayStartOfDay) || dueDate.isSame(todayStartOfDay)));
        }

        function isTaskOverdue(task) {
            var dueDate = moment(moment.unix(task.duedate).utc().format('MM/DD/YYYY'));
            var todayStartOfDay = moment().startOf('day');
            return ((parseInt(task.percentage_complete) < 100) && dueDate.isBefore(todayStartOfDay));
        }

        function getSavedTaskAtTop(taskList, selectedTask) {
            var taskIds = _.pluck(taskList, 'taskid');
            var index = taskIds.indexOf(selectedTask.taskid);
            utils.moveArrayElement(taskList, index, 0);
        }
    }

})();
