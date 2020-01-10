(function (angular) {

    'use strict';

    angular
        .module('cloudlex.tasks')
        .controller('TasksController', TasksController);

    TasksController.$inject = ['$scope', '$rootScope', '$modal', '$filter', '$stateParams', 'matterTasksHelper', 'tasksHelper', 'tasksDatalayer',
        'modalService', 'notification-service', 'matterFactory', 'globalConstants', 'masterData', 'practiceAndBillingDataLayer', 'contactFactory', '$timeout', 'mailboxDataService'
    ];

    function TasksController($scope, $rootScope, $modal, $filter, $stateParams, matterTasksHelper, tasksHelper, tasksDatalayer,
        modalService, notificationService, matterFactory, globalConstants, masterData, practiceAndBillingDataLayer, contactFactory, $timeout, mailboxDataService) {
        var vm = this;
        var allTaskList = [];

        vm.matterId = $stateParams.matterId;
        vm.getFilteredTasks = getFilteredTasks;
        vm.getNoDataMessage = getNoDataMessage;
        vm.filterRetain = filterRetain;
        vm.selectTask = selectTask;
        vm.filterTask = filterTask;
        vm.deleteTask = deleteTask;
        vm.addTask = addTask;
        vm.editTask = editTask;
        vm.getFilterTasks = getFilteredTasks;
        vm.getSortByLabel = getSortByLabel;
        vm.taskFilterText = '';
        vm.reminderDaysList = globalConstants.reminderDaysList;
        //US#4713 disable add edit delete 
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.printTask = printTask; //US#8147 print func
        // US#8982
        vm.taskIds = [];
        vm.isTaskSelected = isTaskSelected;
        vm.status = [];
        vm.statusList = ['Not Started', 'In Progress', 'Awaiting Clarification', 'Received & Acknowledged', 'Completed'].sort();
        vm.updateStatus = updateStatus;
        vm.cancelStatus = cancelStatus;
        vm.init = init;
        vm.firmData = { API: "PHP", state: "mailbox" };
        vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));
        vm.taskHistoryData = [];
        //US#5678-  page filters for event history grid data
        var pageNumber = 1;
        var pageSize = 50;
        vm.exportTaskHistory = exportTaskHistory;
        vm.matterInfomation = matterFactory.getMatterData(vm.matterId);

        // var taskPermissions = masterData.getPermissions();
        // if (taskPermissions) {
        //     vm.taskPermissions = _.filter(taskPermissions[0].permissions, function (per) {
        //         if (per.entity_name == "Task") {
        //             return per;
        //         }
        //     });
        // }

        //init
        (function () {
            init();
            getUserEmailSignature();
        })();

        function init() {
            /**
             * task sorting 
             */
            displayWorkflowIcon();
            vm.sorts = [
                { key: 1, sortby: "duedate,priorityid", sortorder: "ASC,ASC", name: "Due Date ASC" },
                { key: 2, sortby: "duedate,priorityid", sortorder: "DESC,ASC", name: "Due Date DESC" },
                { key: 3, sortby: "modified_date", sortorder: "ASC", name: "Last Modified Date ASC" },
                { key: 4, sortby: "modified_date", sortorder: "DESC", name: "Last Modified Date DESC" },
                { key: 5, sortby: "priorityid,duedate", sortorder: "ASC,DESC", name: "Priority High to Low" }
            ];

            //matterFactory.setBreadcrum(vm.matterId, 'Tasks');
            matterFactory.setBreadcrumWithPromise(vm.matterId, 'Tasks').then(function (resultData) {
                vm.matterInfo = resultData;
                vm.matterInfomation = resultData;
            });
            var filters = tasksHelper.getDefaultFilter();
            vm.filters = setFilterTab(filters);
            vm.selectedTask = {};
            vm.taskDescription = "";
            vm.display = {
                dataReceived: false
            };
            vm.tasksList = [];
            tasksHelper.resetTaskInfo();
            //task filters
            //filter change action is fired which calls getFilteredTasks
            vm.taskFilters = tasksHelper.getTaskFilters();
            //code for retaintion of search field 
            var retainSText = JSON.parse(sessionStorage.getItem("retainSearchText"));
            vm.sortby = "1";
            if (utils.isNotEmptyVal(retainSText)) {
                if (vm.matterId == retainSText.matterid) {
                    vm.taskFilterText = retainSText.taskFiltertext;
                    vm.sortby = utils.isNotEmptyVal(retainSText.sortby) ? retainSText.sortby : "1";
                }
            }
            getAllTasks();
            vm.userSelectedType = [{ id: 1, name: 'Assigned to Task' }, { id: 2, name: 'All Users' }, { id: 3, name: 'Select User' }];

            $timeout(function () {
                var taskPermissions = masterData.getPermissions();
                if (taskPermissions) {
                    vm.taskPermissions = _.filter(taskPermissions[0].permissions, function (per) {
                        if (per.entity_name == "Task") {
                            return per;
                        }
                    });
                }
            }, 3000);

        }
        //US#8982 empty array when clicked on cancel 
        function cancelStatus() {
            vm.taskIds = [];
            vm.status = [];
        }

        vm.getContactCard = function (contact) {
            if (!utils.isEmptyVal(contact)) {
                contactFactory.displayContactCard1(contact.contactid, contact.edited, contact.contact_type);
            }
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
            taskDetails.percentage_complete = utils.isEmptyVal(vm.status) ? '' : (vm.status == 'Completed') ? '100' : (vm.status == 'Not Started') ? '0' : (vm.status == 'In Progress') ? '25' : (vm.filters.tab == 'ov' || vm.filters.tab == "cu") ? '' : '0';
            tasksDatalayer.taskStatus(taskDetails)
                .then(function (response) {
                    if (response == true) {
                        notificationService.success('Task status updated successfully.');
                        getAllTasks();
                        vm.taskIds = [];
                        vm.status = [];
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

        function displayWorkflowIcon() {
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                var resData = data.matter_apps;                                   //promise
                if (angular.isDefined(resData) && resData != '' && resData != ' ') {
                    vm.is_workflow = (resData.workflow == 1) ? true : false;
                }
            });
        }

        $rootScope.$on('updateWorkflowIcons', function (updateworkflowIconevent) {
            displayWorkflowIcon();
        });

        //get email signature
        function getUserEmailSignature() {
            mailboxDataService.emailSignature()
                .then(function (data) {
                    if (utils.isNotEmptyVal(data.data)) {
                        vm.signature = data.data[0];
                        vm.signature = '<br/><br/>' + vm.signature;
                    }
                });
        }

        $scope.$on('composeEmailFromContact', function (event, data) {
            if (!(window.isDrawerOpen)) {
                vm.compose = true;
                var html = "";
                html += (vm.signature == undefined) ? '' : vm.signature;
                vm.composeEmail = html;
                $rootScope.updateComposeMailMsgBody(vm.composeEmail, '', '', '', 'contactEmail', data);
            }
        });

        // Get event call from mailbox controller for close compose popup
        $rootScope.$on("callCloseComposeMail", function () {
            closeComposeMail(); // close compose mail popup
        });

        // close compose mail popup
        function closeComposeMail() {
            vm.compose = false;
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

        /**
         * 
         * @param {selected sort property} sortBy
         */
        vm.applySortByFilter = function (sortBy) {
            vm.sortby = sortBy;
            var retainSText = JSON.parse(sessionStorage.getItem("retainSearchText"));
            if (utils.isNotEmptyVal(retainSText)) {
                if (vm.matterId != retainSText.matterid) {
                    $rootScope.retainSearchText = {};
                }
            }
            $rootScope.retainSearchText.taskFiltertext = vm.taskFilterText;
            $rootScope.retainSearchText.matterid = vm.matterId;
            $rootScope.retainSearchText.sortby = vm.sortby;
            sessionStorage.setItem("retainSearchText", JSON.stringify($rootScope.retainSearchText));
            getAllTasks();
        }

        function setFilterTab(filters) {
            // filter object
            var savedTask = tasksHelper.getSavedTask();
            filters.tab = angular.isDefined(savedTask.tab) ? savedTask.tab : filters.tab;
            return filters;
        }

        //this method is called when:  
        // 1. go to today button click
        // 2. filter is changed
        // 3. date is clicked
        function getAllTasks() {
            var filterObj = angular.copy(vm.filters);
            delete filterObj.tab;
            delete filterObj.taskDate;
            var selectedSortByObj = _.filter(vm.sorts, function (currentItem, index) {
                return currentItem.key == vm.sortby;
            });

            tasksDatalayer
                .getFilteredTasks_JAVA(filterObj, vm.matterId, selectedSortByObj[0])
                .then(function (response) {
                    var taskList = response.data;
                    _.forEach(taskList, function (t) {
                        if (utils.isNotEmptyVal(t.reminder_days)) {
                            t.reminder_days = t.reminder_days.split(',');
                        }
                    });
                    tasksHelper.setProgressInfo(taskList);
                    allTaskList = taskList;
                    vm.display.dataReceived = true;
                    matterTasksHelper.setFilterTaskCount(allTaskList, vm.taskFilters);
                    vm.tasksList = matterTasksHelper.getTaskByFilter(allTaskList, vm.filters.tab);
                    vm.selectedTask = vm.tasksList[0];

                    filterTask(vm.taskFilterText);
                    highlightSelectedTask();


                });

        }


        $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
            goToselectedEvent();
        });

        //US#8147 print func
        function printTask(task) {
            var filenumber = vm.matterInfo.file_number;
            if (utils.isNotEmptyVal(task.reminder_users)) {
                switch (task.reminder_users) {
                    case "all":
                        task.remind_users_new = "All Users";
                        var taskToPrint = tasksHelper.printSelectedTask(task, filenumber);
                        window.open().document.write(taskToPrint);
                        break;

                    case "assignedusers":
                        task.remind_users_new = "Assigned to Task";
                        var taskToPrint = tasksHelper.printSelectedTask(task, filenumber);
                        window.open().document.write(taskToPrint);
                        break;
                    default:
                        if (JSON.parse(task.reminder_users) instanceof Array) {
                            contactFactory.getUsersInFirm()
                                .then(function (response) {
                                    vm.remindUserList = response.data;
                                    task.remind_users_new = [];
                                    _.forEach(JSON.parse(task.reminder_users), function (taskid, taskindex) {
                                        _.forEach(vm.remindUserList, function (item) {
                                            if (taskid == item.user_id) {
                                                task.remind_users_new.push(item);
                                            }
                                        });
                                    });
                                    var taskToPrint = tasksHelper.printSelectedTask(task, filenumber);
                                    window.open().document.write(taskToPrint);
                                });

                        }
                        break;
                }
            } else {
                var taskToPrint = tasksHelper.printSelectedTask(task, filenumber);
                window.open().document.write(taskToPrint);
            }

        }


        function goToselectedEvent() {
            var tsk = vm.selectedTask;
            if (!(utils.isEmptyObj(tsk))) {
                var container = $('.task-list'),
                    scrollTo = $('#x' + tsk.task_id);
                var scrollVal = scrollTo.offset().top - container.offset().top;
                container.animate({
                    scrollTop: scrollVal >= 15 ? scrollTo.offset().top - container.offset().top : 0
                }, 100);
            }
        }
        //US#7862 function to view comma separated assingTo users
        function assignToUser(selectedTask) {
            if (utils.isNotEmptyVal(selectedTask)) {
                vm.usrfullname = [];
                vm.fullname = {};
                if (utils.isEmptyVal(selectedTask.assigned_to)) {
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

        function highlightSelectedTask() {
            //check if a saved task exists or not
            var savedTask = tasksHelper.getSavedTask();

            if (utils.isEmptyObj(savedTask.data)) {
                vm.selectedTask = vm.tasksList[0];

            } else {
                var selectedTask = _.find(vm.tasksList, function (task) {
                    return task.task_id == savedTask.data.task_id
                });
                vm.selectedTask = utils.isNotEmptyVal(selectedTask) ? selectedTask : vm.tasksList[0];
            }
            if (vm.selectedTask) {
                vm.taskDescription = (utils.isEmptyVal(vm.selectedTask.doc_uri) ? ' ' : vm.selectedTask.doc_uri) + '&nbsp;&nbsp;' + (utils.isEmptyVal(vm.selectedTask.notes) ? ' ' : vm.selectedTask.notes);
                assignToUser(vm.selectedTask);//US#7862
                getTaskRemindUser(vm.selectedTask);
                getTaskHistoryData(vm.selectedTask.task_id);
            }
        }

        function getFilteredTasks() {
            //clear the checked task while changing tab
            vm.taskIds = [];
            vm.status = [];
            if (allTaskList.length === 0) {
                return;
            }
            vm.tasksList = matterTasksHelper.getTaskByFilter(allTaskList, vm.filters.tab);
            vm.selectedTask = vm.tasksList[0];
            filterTask(vm.taskFilterText);
            if (utils.isNotEmptyVal(vm.selectedTask)) {
                //get task history data for selected task
                getTaskHistoryData(vm.selectedTask.task_id);
            }
        }

        function getNoDataMessage(filterText) {
            if (angular.isUndefined(filterText) || utils.isEmptyString(filterText)) {
                return "There aren’t any tasks associated with this matter.";
            }
            return "No matching data found.";
        }

        function selectTask(task) {
            $('#taskDetails').scrollTop(0);
            vm.taskDescription = (utils.isEmptyVal(task.doc_uri) ? ' ' : task.doc_uri) + '&nbsp;&nbsp;' + (utils.isEmptyVal(task.notes) ? ' ' : task.notes);
            vm.selectedTask = task;
            assignToUser(vm.selectedTask);
            getTaskRemindUser(vm.selectedTask);

            //get task history data for selected task 
            getTaskHistoryData(vm.selectedTask.task_id);

            tasksHelper.setSavedTask(task);
        }

        //get task history of selected task
        function getTaskHistoryData(taskId) {

            tasksDatalayer.gettaskHistory_OFF_DRUPAL(taskId, pageNumber, pageSize)
                .then(function (data) {
                    vm.taskHistoryData = [];
                    vm.taskHistoryData = data;

                    var event_reason = angular.copy(masterData.getMasterData().event_reschedule_reason);
                    if (event_reason) {
                        event_reason.splice(0, 1);
                        event_reason.splice(1, 1);
                    }

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

        //download task history data
        function exportTaskHistory(taskHistory) {
            var pageSize = 1000;
            tasksDatalayer.downloadTaskHistory(vm.selectedTask.task_id, pageNumber, pageSize)
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

        //retaintion of search field 
        function filterRetain() {
            var retainSText = JSON.parse(sessionStorage.getItem("retainSearchText"));
            if (utils.isNotEmptyVal(retainSText)) {
                if (vm.matterId != retainSText.matterid) {
                    $rootScope.retainSearchText = {};
                }
            }
            $rootScope.retainSearchText.taskFiltertext = vm.taskFilterText;
            $rootScope.retainSearchText.matterid = vm.matterId;
            sessionStorage.setItem("retainSearchText", JSON.stringify($rootScope.retainSearchText));
        }

        function filterTask(filterText) {
            if (utils.isNotEmptyVal(filterText)) {
                if (angular.isUndefined(filterText) || utils.isEmptyString(filterText)) {
                    highlightSelectedTask();
                    getFilteredTasks();
                }
            }
            var filterObj = {
                task_name: filterText
            };
            var currentTasks = matterTasksHelper.getTaskByFilter(allTaskList, vm.filters.tab);
            vm.tasksList = $filter('filter')(currentTasks, filterObj);
            var savedTask = tasksHelper.getSavedTask();
            if (utils.isEmptyObj(savedTask.data)) {
                vm.selectedTask = vm.tasksList[0];

            } else {
                var selectedTask = _.find(vm.tasksList, function (task) {
                    return task.task_id == savedTask.data.task_id
                });
                vm.selectedTask = utils.isNotEmptyVal(selectedTask) ? selectedTask : vm.tasksList[0];
            }
            assignToUser(vm.selectedTask);
            getTaskRemindUser(vm.selectedTask);
            if (utils.isNotEmptyVal(vm.selectedTask)) {
                getTaskHistoryData(vm.selectedTask.task_id);
            }
        }

        function deleteTask(taskId) {

            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                tasksDatalayer
                    .deleteTask(taskId)
                    .then(taskDeleted, function () {
                        notificationService.error("unable to delete");
                    });
            })
        }

        function taskDeleted() {
            notificationService.success('Task deleted successfully.');
            cancelStatus();
            getAllTasks();
        }

        function editTask(matterId, taskId) {
            //$state.go('tasks-edit', { matterId: matterId, taskId: taskId });
            var modalScope = $rootScope.$new();
            modalScope.matterId = matterId;
            modalScope.taskId = taskId;

            modalScope.modalInstance = $modal.open({
                templateUrl: 'app/tasks/add-task/add-task.html',
                controller: 'AddTaskCtrl as addTask',
                backdrop: 'static',
                keyboard: false,
                scope: modalScope
            });

            modalScope.modalInstance.result.then(function (matterId) {
                setFilterTab(vm.filters);
                getAllTasks();
                cancelStatus();
            });
        }

        function addTask(matterId) {
            var modalScope = $rootScope.$new();
            modalScope.matterId = matterId
            modalScope.modalInstance = $modal.open({
                templateUrl: 'app/tasks/add-task/add-task.html',
                controller: 'AddTaskCtrl as addTask',
                scope: modalScope,
                backdrop: 'static',
                keyboard: false
            });

            modalScope.modalInstance.result.then(function (isDeleted) {
                if (isDeleted) {
                    setFilterTab(vm.filters);
                }
                getAllTasks();
            });
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
                if (angular.isDefined(task.reminder_users) && task.reminder_users != "" && task.reminder_users != "all" && task.reminder_users != "matter") {
                    //task.remind_users_temp = task.remind_users;
                } else {
                    task.remind_users_temp = [];
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

    }

})(angular);

(function (angular) {

    angular
        .module('cloudlex.tasks')
        .factory('matterTasksHelper', tasksHelper);

    function tasksHelper() {
        return {
            setFilterTaskCount: setFilterTaskCount,
            getTaskByFilter: getTaskByFilter,
        };

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
                var dueDate = moment(moment.unix(task.due_date).utc().format('MM/DD/YYYY'));
                var todayStartOfDay = moment().startOf('day');
                return ((parseInt(task.percentage_complete) < 100) &&
                    (dueDate.isAfter(todayStartOfDay) || dueDate.isSame(todayStartOfDay)));
            });

            return currentTasks;
        }

        function getCompletedTasks(allTasks) {
            var completedTasks = _.filter(allTasks, function (task) {
                return parseInt(task.percentage_complete) === 100;
            });

            return completedTasks;
        }

        function getOverdueTasks(allTasks) {
            var overdueTasks = _.filter(allTasks, function (task) {
                var dueDate = moment(moment.unix(task.due_date).utc().format('MM/DD/YYYY'));
                var todayStartOfDay = moment().startOf('day');
                return ((parseInt(task.percentage_complete) < 100) && dueDate.isBefore(todayStartOfDay));
            });
            return overdueTasks;
        }


    }

})(angular);
