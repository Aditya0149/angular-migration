(function() {

    'use strict';

    angular
        .module('intake.tasks')
        .controller('IntakeGlobalTaskCtrl', GlobalTaskController);

    GlobalTaskController.$inject = ['$scope', '$state', '$timeout', '$q', '$filter', 'IntakeGlobalTaskHelper', 'intakeTasksDatalayer',
        'intakeFactory', 'modalService', 'notification-service', 'globalConstants', 'contactFactory', 'intakeTaskSummaryDataLayer', 'IntakeTasksHelper', 'masterData'
    ];

    function GlobalTaskController($scope, $state, $timeout, $q, $filter, IntakeGlobalTaskHelper, intakeTasksDatalayer, intakeFactory,
        modalService, notificationService, globalConstants, contactFactory, intakeTaskSummaryDataLayer, IntakeTasksHelper, masterData) {
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
        vm.taskClear = taskClear;
        vm.getTasksCount = getTasksCount;
        vm.mondayInfo = '';
        vm.goToMatter = goToMatter;
        vm.reminderDaysList = globalConstants.reminderDaysList;
        vm.getSortByLabel = getSortByLabel;
        vm.openCalender = openCalender;
        //US#4713 disable add edit delete 
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.pageReset = pageReset;
        vm.init_first = init_first;
        vm.init = init;
        vm.appliedFilter = false;
        vm.taskHistoryData = [];
        //US#5678-  page filters for event history grid data
        var pageNumber = 1;
        var pageSize = 50;
        vm.exportTaskHistory = exportTaskHistory;
        vm.isDataAvailable = false;

        var taskPermissions = masterData.getPermissions();
        if (taskPermissions) {
            vm.taskPermissions = _.filter(taskPermissions[0].permissions, function(per) {
                if (per.entity_name == "Task") {
                    return per;
                }
            });
        }



        //init
        (function() {
            var allUsers = intakeTaskSummaryDataLayer.getAssignedUserData();
            $q.all([allUsers]).then(function(response) {
                var users = response[0];
                vm.assignedUserList = {};
                vm.assignedUserList.assignedby = angular.copy(users);
                vm.assignedUserList.assignedto = angular.copy(users);

                vm.sorts = [
                    { key: 1, sortby: "due_date,priorityid", sortorder: "ASC,ASC", name: "Due Date ASC" },
                    { key: 2, sortby: "due_date,priorityid", sortorder: "DESC,ASC", name: "Due Date DESC" },
                    { key: 3, sortby: "modified_date", sortorder: "ASC", name: "Last Modified Date ASC" },
                    { key: 4, sortby: "modified_date", sortorder: "DESC", name: "Last Modified Date DESC" },
                    { key: 5, sortby: "priorityid,due_date", sortorder: "ASC,DESC", name: "Priority High to Low" }
                ];
                vm.sortby = utils.isNotEmptyVal(localStorage.getItem('intakeGlobalTaskSortBy')) ? localStorage.getItem('intakeGlobalTaskSortBy') : "1";
                init();
            });

        })();

        /**
         * 
         * @param {selected sort property} sortBy 
         */
        function getSortByLabel(sortBy) {
            if (utils.isEmptyVal(sortBy)) {
                return " - ";
            }

            var selSort = _.find(vm.sorts, function(sort) {
                return sort.key == sortBy;
            });
            return selSort.name;
        }

        function init_first() {
            init(true);
        }

        /**
         * 
         * @param {selected sort property} sortBy
         */
        vm.applySortByFilter = function(sortBy) {
            vm.sortby = sortBy;
            localStorage.setItem('intakeGlobalTaskSortBy', vm.sortby);
            getFilteredTasks();
        }

        /* Datepicker event bind */
        function openCalender($event) {
            $event.preventDefault();
            $event.stopPropagation();
        };

        function searchReset() {
            vm.taskFilterText = "";
            var filtertext = localStorage.setItem("intakeGlobalTaskText", vm.taskFilterText);
        }

        /* Check whether date range filter validated 
         * True: Disable Apply button
         * False: Enable Apply button
         */
        function isDatesValid() {
            if ($('#taskstartdateerr').css("display") == "block" || $('#taskenddateerr').css("display") == "block") {
                return true;
            } else {
                return false;
            }
        }


        function init(calledForRefesh) {
            if (calledForRefesh) {
                vm.sortby = "1";
                resetFilters();
                vm.filters.tab = '';
                $timeout(function() {
                    vm.filters.tab = 'cu';
                    searchReset();
                    if (vm.display) {
                        vm.display.refreshCount = true;
                    }
                }, 300);
            } else {
                vm.sortby = utils.isNotEmptyVal(localStorage.getItem('intakeGlobalTaskSortBy')) ? localStorage.getItem('intakeGlobalTaskSortBy') : "1";

            }
            vm.selectedTask = {};
            vm.taskFilterText = "";
            vm.taskDescription = "";
            vm.display = {
                dataReceived: false,
                refreshCount: false,
                page: 'taskList'
            };
            vm.tags = [];
            vm.taskFilters = IntakeTasksHelper.getTaskFilters();
            vm.filters = IntakeTasksHelper.getDefaultFilter();
            vm.percentageComplete = IntakeGlobalTaskHelper.getPercentageCompleteOptions();
            vm.taskStatus = IntakeGlobalTaskHelper.getTaskStatus();
            vm.timeButtons = IntakeGlobalTaskHelper.getTimeButtons();
            vm.filterByUserBtn = IntakeGlobalTaskHelper.getFilterByUserBtn();
            vm.assignedToBtn = IntakeGlobalTaskHelper.getAssignedToButtons();
            var filtertext = localStorage.getItem("intakeGlobalTaskText");
            if (utils.isNotEmptyVal(filtertext)) {
                vm.taskFilterText = filtertext;
            }

            vm.filters = JSON.parse(sessionStorage.getItem('intakeglobalTaskFilters'));
            if (vm.filters == null) {
                vm.tags = [];
                vm.filters = IntakeTasksHelper.getDefaultFilter();
            } else {
                vm.tags = IntakeGlobalTaskHelper.getTags(vm.filters, "", vm.assignedUserList);
            }


            vm.userSelectedType = [{ id: 1, name: 'Assigned to Task' }, { id: 2, name: 'All Users' }, { id: 3, name: 'Select User' }];
            getFilteredTasks();
        }


        function pageReset() {
            vm.display.page = "filter";
            vm.tags = [];
            resetFilters();
            searchReset();
        }

        //US#7862 function to view comma separated assingTo users
        function assignToUser(selectedTask) {
            if (utils.isNotEmptyVal(selectedTask)) {
                vm.user_fullname = [];
                vm.fullname = {};
                if (utils.isEmptyVal(selectedTask.assignedTo)) {
                    vm.fullname = '';
                }
                //US#7862
                if (selectedTask.assignedTo.length > 0) {
                    vm.usrname = [];
                    vm.usrname = _.filter(_.unique(selectedTask.assignedTo, 'userId'));
                    _.forEach(vm.usrname, function(item) {
                        // item.user_fname = utils.isEmptyVal(item.fname) ? '' : item.fname;
                        // item.user_lname = utils.isEmptyVal(item.lname) ? '' : item.lname;
                        vm.user_fullname.push(item.fullName);
                    })
                    vm.fullname = vm.user_fullname.toString();
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
                resetFilters();
            } else {
                vm.appliedFilter = true;
            }

            var selectedSortByObj = _.filter(vm.sorts, function(currentItem, index) {
                return currentItem.key == vm.sortby;
            });
            var data = vm.appliedFilter ? JSON.parse(sessionStorage.getItem("intakeglobalTaskFilters")) : IntakeTasksHelper.getDefaultFilter();
            var tempTaskDate = angular.copy(vm.filters.taskdate);
            if (vm.filters.tab == "cu") {
                data.dueEndDate = "";
                data.dueStartDate = "";
                vm.filters.dueEndDate = "";
                vm.filters.dueStartDate = "";
                vm.filters.taskdate = tempTaskDate;
                sessionStorage.setItem("intakeglobalTaskFilters", JSON.stringify(vm.filters));
                vm.display.refreshCount = true;
                getTasksCount(vm.mondayInfo);
            }
            vm.tags = IntakeGlobalTaskHelper.getTags(data, matters, vm.assignedUserList);

            vm.display.dataReceived = false;
            var filterObj = IntakeGlobalTaskHelper.getFilterObj(angular.copy(vm.filters));
            intakeTasksDatalayer
                .getGlobalTasks(filterObj, selectedSortByObj[0])
                .then(function(response) {
                    if (angular.isDefined(response[0])) {
                        var container = $('#main-event'),
                            scrollTo = $('#x' + response[0].intake_id);
                        container.animate({
                            scrollTop: scrollTo.offset() - $("#main-event").offset()
                        }, 100);
                    }
                    tasks = response;
                    _.forEach(tasks, function(t) {
                        if (utils.isNotEmptyVal(t.reminder_days)) {
                            t.reminder_days = t.reminder_days.split(',');
                        }
                    });
                    IntakeTasksHelper.setProgressInfo(tasks);
                    vm.taskList = tasks;
                    _.forEach(vm.taskList, function(item) {
                        item.assignmentutcdate = (utils.isEmptyVal(item.assignment_date)) ? "" : moment.unix(item.assignment_date).utc().format('MM/DD/YYYY');
                        item.dueutcdate = (utils.isEmptyVal(item.due_date)) ? "" : moment.unix(item.due_date).utc().format('MM/DD/YYYY');
                        // vm.taskList.push(item);
                    });
                    if (!utils.isEmptyObj(vm.display.savedTask)) {
                        var selectedTask = _.find(vm.taskList, function(task) { return task.intake_task_id === vm.display.savedTask.intake_task_id });
                        vm.selectedTask = utils.isEmptyVal(selectedTask) ? vm.taskList[0] : selectedTask;
                        assignToUser(vm.selectedTask); //US#7862
                        vm.display.savedTask = {};
                    } else {
                        vm.selectedTask = vm.taskList[0];
                        assignToUser(vm.selectedTask); //US#7862
                    }
                    if (utils.isNotEmptyVal(vm.selectedTask)) {
                        //get task history data for selected task 
                        getTaskHistoryData(vm.selectedTask.intake_task_id);
                    }
                    vm.taskDescription = (utils.isEmptyVal(vm.selectedTask) || utils.isEmptyVal(vm.selectedTask.doc_uri) ? ' ' : vm.selectedTask.doc_uri) + '&nbsp;&nbsp;' + (utils.isEmptyVal(vm.selectedTask.notes) ? ' ' : vm.selectedTask.notes);
                    vm.display.dataReceived = true;
                    filterTask(vm.taskFilterText);
                    vm.isDataAvailable = true;
                });
        }

        //get task history of selected task
        function getTaskHistoryData(taskId) {

            intakeTasksDatalayer.gettaskHistory_OFF_DRUPAL(taskId, pageNumber, pageSize)
                .then(function(data) {
                    vm.taskHistoryData = data;
                    var event_reason = angular.copy(masterData.getMasterData().event_reschedule_reason);
                    if (event_reason) {
                        event_reason.splice(0, 1);
                        event_reason.splice(1, 1);
                    }

                    var reschedule_reason = angular.copy(event_reason);
                    //set reason name
                    _.forEach(vm.taskHistoryData, function(data) {
                        _.forEach(reschedule_reason, function(item) {
                            if (data.reason == '0' || data.reason == null) {
                                data.reason = '-';
                            } else {
                                if (data.reason == item.reason_order) {
                                    data.reason = item.reason_name;
                                }
                            }
                        })
                    })
                }, function(error) {
                    notificationService.error("Task history not loaded")
                })

        }
        //download task history data
        function exportTaskHistory(taskHistory) {
            var pageSize = 1000;
            intakeTasksDatalayer.downloadTaskHistory(vm.selectedTask.intake_task_id, pageNumber, pageSize)
                .then(function(response) {
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

        function goToMatter(intake_id) {
            $state.go('intake-overview', { intakeId: intake_id }, { reload: true });
        }

        function getTasksByDate(day) {
            vm.filters.taskdate = day.utcTimestamp;
            getFilteredTasks();
        }

        function selectTask(task) {
            vm.taskDescription = (utils.isEmptyVal(task.doc_uri) ? ' ' : task.doc_uri) + '&nbsp;&nbsp;' + (utils.isEmptyVal(task.notes) ? ' ' : task.notes);
            vm.selectedTask = task;
            assignToUser(vm.selectedTask); //US37862
            getTaskRemindUser(vm.selectedTask);
            //get task history data for selected task 
            getTaskHistoryData(vm.selectedTask.intake_task_id);
            IntakeTasksHelper.setSavedTask(task);
        }

        //retaintion of search field 
        function filterRetain() {
            var filtertext = vm.taskFilterText;
            localStorage.setItem("intakeGlobalTaskText", filtertext);
        }


        function assignedFilterChanged() {
            vm.filters.assigned = null;
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
            getTaskRemindUser(vm.selectedTask);
            if (utils.isNotEmptyVal(vm.selectedTask)) {
                getTaskHistoryData(vm.selectedTask.intake_task_id);
            }
        }

        function openFilterPage() {
            if (vm.display.page == 'filter') {
                vm.display.page = 'taskList';
                vm.init();
            } else {
                vm.display.page = 'filter';
                vm.filtersData = angular.copy(vm.filters);
                vm.filtersData.dueStartDate = typeof vm.filters.dueStartDate == 'string' ? vm.filters.dueStartDate : moment(vm.filtersData.dueStartDate).format();
                vm.filtersData.dueEndDate = typeof vm.filters.dueEndDate == 'string' ? vm.filters.dueEndDate : moment(vm.filtersData.dueEndDate).format();

            }
        }

        function resetTaskFilters() {
            $scope.$apply(resetFilters);
        }

        function applyfilters() {
            vm.filters = angular.copy(vm.filtersData);
            vm.appliedFilter = true;
            //Bug#6514 To check valid matter names
            if (utils.isEmptyVal(vm.filters.intake)) {

            } else if (utils.isNotEmptyVal(vm.filters.intake) && typeof(vm.filters.intake) != "object") {
                notificationService.error("Invalid intake Selected");
                return;
            }

            // validation due date filter
            if (vm.filters.tab !== 'cu') {
                (vm.filters.dueStartDate == null) ? vm.filters.dueStartDate = "": ""; // set blank value if date val is null
                (vm.filters.dueEndDate == null) ? vm.filters.dueEndDate = "": ""; // set blank value if date val is null
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
                var assignedby = _.find(vm.assignedUserList.assignedby, function(item) {
                    return item.userId === vm.filters.assignedby.userId;
                });
                vm.filters.assignedbyId = assignedby.userId;
            }

            if (vm.filters.assignedto !== '' && vm.filters.assignedto !== null && angular.isDefined(vm.filters.assignedto)) {
                var assignedto = _.find(vm.assignedUserList.assignedto, function(item) {
                    return item.userId === vm.filters.assignedto.userId;
                });
                vm.filters.assignedtoId = assignedto.userId;
            }
            sessionStorage.setItem("intakeglobalTaskFilters", JSON.stringify(vm.filters));
            var filteredData = angular.copy(vm.filters);
            vm.tags = IntakeGlobalTaskHelper.getTags(filteredData, matters, vm.assignedUserList);
            if ((vm.filters.status == 'Completed') || (vm.filters.complete == 100)) {
                vm.filters.tab = 'co';
            } else if (vm.filters.status == 'Completed' && (vm.tags.length) == 2 && vm.filters.complete == 100) {
                vm.filters.tab = 'co';
            }
            getFilteredTasks();
            vm.display.page = 'taskList';
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
                        vm.filters.assignedby = undefined;
                        vm.filters.assignedbyId = undefined;
                    } else {
                        vm.filters.assignedto = undefined;
                        vm.filters.assignedtoId = undefined;
                    }
                } else {
                    var index = vm.filters[filterObj.prop].indexOf(filterObj.cancelled);
                    vm.filters[filterObj.prop].splice(index, 1);
                }

            } else if (filterObj.prop == "due_date") {
                vm.filters.dueStartDate = "";
                vm.filters.dueEndDate = "";
            } else {
                vm.filters[filterObj.prop] = undefined;
                if (filterObj.prop == 'mytask') {
                    vm.filters['assigned'] = undefined;
                    vm.tags = IntakeGlobalTaskHelper.getTags(vm.filters, matters, vm.assignedUserList);
                }
            }
            sessionStorage.setItem("intakeglobalTaskFilters", JSON.stringify(vm.filters));
            getFilteredTasks();
            if (vm.filters.tab == "cu") {
                vm.display.refreshCount = true;
                getTasksCount(vm.mondayInfo);
            }
        }

        function resetFilters() {
            vm.filters.status ? vm.filters.status.length = 0 : angular.noop;
            vm.filters.complete ? vm.filters.complete.length = 0 : angular.noop;
            vm.filters.intake = undefined;
            vm.filters.mytask = undefined;
            vm.filters.assigned = undefined;
            vm.filters.assignedto = undefined;
            vm.filters.assignedby = undefined;
            vm.filters.assignedbyId = undefined;
            vm.filters.assignedtoId = undefined;
            vm.filters.period = undefined;
            vm.filters.dueStartDate = "";
            vm.filters.dueEndDate = "";
            vm.filters.mid = '';
            vm.tags = [];
            vm.filtersData = angular.copy(vm.filters);
            sessionStorage.setItem("intakeglobalTaskFilters", JSON.stringify(vm.filters));
        }


        var matters = [];

        function searchMatters(matterName, migrate) {
            return intakeFactory.searchMatters(matterName, migrate);
        }

        function formatTypeaheadDisplay(intake) {
            if (angular.isUndefined(intake) || utils.isEmptyString(intake)) {
                return undefined;
            }

            return intake.intakeName;
        }

        function addTask(intake_id) {
            IntakeTasksHelper.setGlobalTaskInfo();
            vm.display.page = 'addTask';
        }

        function editTask(intake_task_id) {
            $scope.taskId = angular.copy(vm.selectedTask);
            IntakeTasksHelper.setGlobalTaskInfo(intake_task_id);
            vm.display.page = 'addTask';
        }

        function deleteTask(intake_task_id) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function() {
                intakeTasksDatalayer
                    .deleteTask(intake_task_id)
                    .then(function() {
                        notificationService.success("Task deleted successfully.");
                        vm.display.refreshCount = true;
                        getFilteredTasks();
                    }, function() {
                        notificationService.error("Unable to delete task.");
                    })

            })
            vm.isDataAvailable = true;
        }

        function getTasksCount(mondayInfo) {
            if (mondayInfo) {
                vm.mondayInfo = mondayInfo;
            }
            var mondayInfoCopy = angular.copy(mondayInfo);
            if (utils.isEmptyVal(mondayInfoCopy)) {
                mondayInfoCopy = {};
                mondayInfoCopy.utcTimestamp = '';
            }
            var filterObj = IntakeGlobalTaskHelper.getFilterObj(angular.copy(vm.filters));
            delete filterObj.taskdate;

            var deferred = $q.defer();
            intakeTasksDatalayer.getGlobalTaskCount(mondayInfoCopy.utcTimestamp, filterObj)
                .then(function(response) {
                    var counts = IntakeGlobalTaskHelper.setCounts(mondayInfo, response)
                    deferred.resolve(counts);
                    vm.isDataAvailable = true;
                });

            return deferred.promise;
        }

        function taskClear() {
            $scope.taskId = null;
        }

        function taskSaved(savedTask) {
            if (utils.isEmptyObj(savedTask)) {
                $scope.taskId = null;
            } else {
                vm.filters.tab = IntakeGlobalTaskHelper.getStatus(savedTask, vm.filters.tab);
                if (vm.filters.tab === "cu") {
                    vm.filters.taskdate = savedTask.due_date;
                    //set appropriate start of day and get the utc timestamp

                }
                $scope.taskId = null;
                vm.display.savedTask = savedTask;
            }

            vm.display.page = "taskList";
            getFilteredTasks();
        }

        function setAssignedTo(val) {
            if (val !== 0) {
                vm.filters.assigned = undefined;
            }
        }
        //US#8558 Event & Task reminder to matter users or all users
        function getTaskRemindUser(task) {
            if (utils.isEmptyVal(task)) { return }
            if (task.reminder_users == "assignedusers") {
                vm.userSelectedMode = 1;
            } else if (task.reminder_users == "all") {
                vm.userSelectedMode = 2;
            } else if (JSON.parse(task.reminder_users) instanceof Array) {
                vm.remindUserList = [];
                vm.userSelectedMode = 3;
                if (angular.isDefined(task.reminder_users) && task.reminder_users != "" && task.reminder_users != "all" && task.reminder_users != "assignedusers") {
                    //task.remind_users = task.remind_users;
                } else {
                    task.reminder_users = [];
                }

                contactFactory.getUsersInFirm()
                    .then(function(response) {
                        var userListing = response.data;
                        contactFactory.intakeStaffUserToMatterStaffUser(userListing);
                        vm.remindUserList = userListing;
                        task.remind_users_temp = [];
                        _.forEach(JSON.parse(task.reminder_users), function(taskid, taskindex) {
                            _.forEach(vm.remindUserList, function(item) {
                                if (taskid == item.userId) {
                                    task.remind_users_temp.push(parseInt(taskid));
                                }
                            });
                        });

                    });

            }
        }


    }


})();

(function() {
    'use strict';

    angular
        .module('intake.tasks')
        .factory('IntakeGlobalTaskHelper', IntakeGlobalTaskHelper);

    IntakeGlobalTaskHelper.$inject = [];

    function IntakeGlobalTaskHelper() {

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
        }

        function getFilterObj(currentFilters) {
            if (currentFilters.tab == 'ov') {
                var today = moment().startOf('day');
                var startOfDayUTC = utils.getUTCTimeStamp(today);
                currentFilters.taskdate = startOfDayUTC;
            } else if (currentFilters.tab == 'co') {
                currentFilters.taskdate = "";
            }
            currentFilters.intakeId = angular.isUndefined(currentFilters.intake) ? "" : currentFilters.intake.intakeId;
            currentFilters.mytask = angular.isUndefined(currentFilters.mytask) ? "" : currentFilters.mytask;
            currentFilters.mytask === 1 ?
                currentFilters.assigned = angular.isUndefined(currentFilters.assigned) ? "" : currentFilters.assigned :
                currentFilters.assigned = '';
            currentFilters.dueStartDate = utils.isEmptyVal(currentFilters.dueStartDate) ? "" : utils.getUTCTimeStamp(currentFilters.dueStartDate);
            currentFilters.dueEndDate = utils.isEmptyVal(currentFilters.dueEndDate) ? "" : utils.getUTCTimeStampEndDay(currentFilters.dueEndDate);
            currentFilters.status = currentFilters.status ? currentFilters.status.toString() : "";
            currentFilters.status = encodeURIComponent(currentFilters.status);
            currentFilters.complete = currentFilters.complete ? currentFilters.complete.toString() : "0";
            if (angular.isDefined(currentFilters.period)) {
                currentFilters.s = angular.isDefined(currentFilters.period.s) ? currentFilters.period.s : '';
                currentFilters.e = angular.isDefined(currentFilters.period.e) ? currentFilters.period.e : '';
                delete currentFilters.period;
            }
            delete currentFilters.intake;
            currentFilters.assignedby = currentFilters.assignedbyId;
            currentFilters.assignedto = currentFilters.assignedtoId;
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

        function getTags(filters, matters, assignedList) {
            var tags = [];
            var id = 0;

            if (!utils.isEmptyObj(filters.period)) {
                id++;
                var assignedTag = { value: filters.period.tag, prop: 'period', key: id };
                tags.push(assignedTag);
            }

            var matter = _.find(matters, function(matter) {
                return matter.intake_id === filters.intake;
            });

            if (utils.isNotEmptyVal(filters.intake)) {
                id++;
                var matterTag = { value: 'intake: ' + filters.intake.intakeName, prop: 'intake', key: filters.intake.intakeId };
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

            if (utils.isNotEmptyVal(filters.dueStartDate) && utils.isNotEmptyVal(filters.dueEndDate) && filters.tab != 'cu') {
                id++;
                var assignedToTag = { value: 'Due Date from: ' + moment.unix(moment(filters.dueStartDate).unix()).format('MM-DD-YYYY') + ' to: ' + moment.unix(moment(filters.dueEndDate).unix()).format('MM-DD-YYYY'), prop: 'due_date', key: id, due_date_condition: false };
                tags.push(assignedToTag);
            }

            _.forEach(filters.status, function(status) {
                id++;
                var statusTag = { value: 'Status: ' + status, prop: 'status', cancelled: status, key: id };
                tags.push(statusTag);
            });

            _.forEach(filters.complete, function(complete) {
                id++;
                var completeTag = { value: 'Completed: ' + complete + '%', prop: 'complete', cancelled: complete, key: id };
                tags.push(completeTag);
            });

            if (angular.isDefined(filters.assignedby) && filters.assignedby != '') {

                if (angular.isDefined(assignedList)) {
                    _.forEach(assignedList.assignedby, function(data) {
                        if (filters.assignedbyId == data.userId) {
                            id++;
                            var statusTag = { value: "Assigned By: " + data.fullName, prop: 'assingedby', cancelled: data.fullName, key: id };
                            tags.push(statusTag);
                        }
                    });
                }
            }

            if (angular.isDefined(filters.assignedto) && filters.assignedto != '') {

                if (angular.isDefined(assignedList)) {
                    _.forEach(assignedList.assignedto, function(data) {
                        if (filters.assignedtoId == data.userId) {
                            id++;
                            var statusTag = { value: "Assigned To: " + data.fullName, prop: 'assingedto', cancelled: data.fullName, key: id };
                            tags.push(statusTag);
                        }
                    });
                }
            }
            return tags;
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
                var countsForDateParam = _.filter(counts, function(cntObj) {

                    return cntObj.localDate === dateParam;
                });
                //sum the counts
                if (angular.isDefined(countsForDateParam) && countsForDateParam.length > 0) {
                    var cnt = 0;
                    _.forEach(countsForDateParam, function(count) {
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

        function convertDueDatesToStartOfDay(counts) {
            _.forEach(counts, function(count) {
                var due_date = count.due_date;
                var localDate = moment(moment.unix(due_date).utc().format('MM/DD/YYYY'));
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
                'Completed'
            ];
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
            var due_date = moment(moment.unix(task.due_date).utc().format('MM/DD/YYYY'));
            var todayStartOfDay = moment().startOf('day');
            return ((parseInt(task.percentage_complete) < 100) &&
                (due_date.isAfter(todayStartOfDay) || due_date.isSame(todayStartOfDay)));
        }

        function isTaskOverdue(task) {
            var due_date = moment(moment.unix(task.due_date).utc().format('MM/DD/YYYY'));
            var todayStartOfDay = moment().startOf('day');
            return ((parseInt(task.percentage_complete) < 100) && due_date.isBefore(todayStartOfDay));
        }

        function getSavedTaskAtTop(taskList, selectedTask) {
            var taskIds = _.pluck(taskList, 'intake_task_id');
            var index = taskIds.indexOf(selectedTask.intake_task_id);
            utils.moveArrayElement(taskList, index, 0);
        }
    }

})();