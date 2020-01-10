(function (angular) {

    angular
        .module('intake.tasks')
        .controller('IntakeAddTaskCtrl', IntakeAddTaskCtrl);

    IntakeAddTaskCtrl.$inject = ['$scope', '$modal', '$timeout', '$stateParams',
        'intakeAddTaskHelper', 'intakeTasksDatalayer', 'contactFactory', 'modalService',
        'notification-service', 'intakeNotesDataService', 'resetCallbackHelper', 'globalConstants', 'IntakeTasksHelper', 'masterData'];

    function IntakeAddTaskCtrl($scope, $modal, $timeout, $stateParams,
        intakeAddTaskHelper, intakeTasksDatalayer, contactFactory, modalService,
        notificationService, intakeNotesDataService, resetCallbackHelper, globalConstants, IntakeTasksHelper, masterData) {
        var vm = this,
            matterId,
            taskId,
            $modalInstance,
            subcategory = {};
        vm.taskData = {};
        vm.setPercentageComplete = setPercentageComplete;
        vm.setStatus = setStatus;
        vm.openCalender = openCalender;
        vm.cancel = cancel;
        vm.save = save;
        vm.deleteTask = deleteTask;
        vm.searchMatters = searchMatters;
        vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
        vm.addTaskDescription = addTaskDescription;
        vm.isDatesValid = isDatesValid;
        vm.reminderDaysList = globalConstants.reminderDaysList;
        vm.users = [];
        var firmData;
        vm.createdUser = true;
        vm.pageMode = (utils.isNotEmptyVal($scope.$parent.taskId) && utils.isNotEmptyVal($scope.$parent.taskId.intake_task_id)) ? 'edit' : 'add';
        vm.resetAddTaskPage = resetAddTaskPage;
        vm.showReset = $scope.LaunchGlobalTasks && $scope.LaunchGlobalTasks.display.page == 'addTask' ? true : false;
        //init
        (function () {
            setGlobalInfo();
            init();
        })();

        var globalInfo;
        function setGlobalInfo() {
            globalInfo = IntakeTasksHelper.getGlobalTaskInfo();

            if (window.isDrawerOpen) {
                vm.isGlobal = true;
                taskId = globalInfo.taskId;
            } else {
                vm.isGlobal = false;
                $modalInstance = $scope.modalInstance;
                matterId = $stateParams.intakeId;
                // taskId = $scope.taskId;
            }
        }

        function isDatesValid() {
            // finds index of error div and validates true or false
            var dateValidateError = false;

            $('body').find('.error').each(function () {
                if ($(this).css("display") == "block") {
                    dateValidateError = true;
                }
            })


            if (dateValidateError == true) {
                return true;
            }
            else {
                return false;
            };
        };

        function init() {
            vm.form = {};
            vm.percentage_complete = intakeAddTaskHelper.getPercentageCompleteOpions();
            vm.priorities = intakeAddTaskHelper.getPriorityOptions();
            vm.status = intakeAddTaskHelper.getTaskStatus();
            var userAccessDetails = masterData.getUserRole();
            vm.userSelectedType = [{ id: 1, name: 'Assigned to Task' }, { id: 2, name: 'All Users' }, { id: 3, name: 'Select User' }];
            vm.is_admin = (userAccessDetails.is_admin == 1) ? true : false;
            vm.is_Subscriber = (userAccessDetails.is_subscriber == 1) ? true : false;
            vm.user_id = userAccessDetails.uid;
            // vm.pageMode = (angular.isDefined(taskId) && utils.isNotEmptyString(taskId)) ? 'edit' : 'add';
            getTaskForEdit(vm.pageMode);
            vm.pageTitle = vm.pageMode === 'edit' ? 'Edit Task' : 'Add Task';
            getUsersInFirm();

        }

        function resetAddTaskPage() {
            vm.pageMode === 'add' ? $("input[name='intake']").val("") : angular.noop();
            vm.form = {};
            vm.percentageComplete = intakeAddTaskHelper.getPercentageCompleteOpions();
            vm.priorities = intakeAddTaskHelper.getPriorityOptions();
            vm.status = intakeAddTaskHelper.getTaskStatus();
            vm.pageMode = (angular.isDefined(taskId) && utils.isNotEmptyString(taskId)) ? 'edit' : 'add';
            getTaskForEdit(vm.pageMode, true);
            vm.pageTitle = vm.pageMode === 'edit' ? 'Edit Task' : 'Add Task';
            if (vm.pageMode == 'add') {
                var user = { id: 1 };
                vm.setUserMode(user);
            }
        }

        function getTaskForEdit(pageMode, calledFromReset) {
            if (pageMode === 'edit') {
                vm.taskInfo = angular.copy($scope.$parent.taskId);
                if (vm.taskInfo.reminder_days == "null") {
                    vm.taskInfo.reminder_days = null;
                }
                if (vm.taskInfo.custom_reminder) {
                    vm.taskInfo.custom_reminder = utils.isEmptyVal(vm.taskInfo.custom_reminder) ? '' : moment.unix(vm.taskInfo.custom_reminder).utc().format('MM/DD/YYYY');
                }
                getTaskRemindUser(vm.taskInfo);
                if (calledFromReset) {
                    // var copyVar = vm.taskInfo.due_date;
                    // vm.taskInfo.duedate = vm.taskInfo.dueutcdate;
                    // vm.taskInfo.due_date = vm.taskInfo.dueutcdate;
                    // vm.taskInfo.dueutcdate = copyVar;
                }
                vm.existingTask = angular.copy(vm.taskInfo);
                intakeAddTaskHelper.setTaskObj(vm.taskInfo);
                if (vm.isGlobal) {
                    vm.taskInfo.intake = {
                        intakeName: vm.taskInfo.intakeName,
                        intakeId: vm.taskInfo.intake_id,
                        dateIntake: vm.taskInfo.date_of_intake ? " - " + moment.unix(vm.taskInfo.date_of_intake).utc().format('MM/DD/YYYY') : ""
                    };
                }
                if (vm.taskInfo.created_by == vm.user_id || vm.is_admin == true) {
                    vm.createdUser = false;
                }
            } else {
                vm.taskInfo = intakeAddTaskHelper.getTaskInfoObj();
                vm.existingTask = angular.copy(vm.taskInfo);
            }
        }

        function getUsersInFirm() {
            contactFactory.getUsersInFirm()
                .then(function (response) {
                    var userListing = response.data;
                    contactFactory.intakeStaffUserToMatterStaffUser(userListing);
                    vm.users = userListing;
                });

        }

        function setPercentageComplete(status, taskInfo) {

            switch (status) {
                case 'Completed':
                    taskInfo.percentage_complete = 100;
                    break;
                case 'Not Started':
                    taskInfo.percentage_complete = 0;
                    break;
                case 'In Progress':
                    if ((taskInfo.percentage_complete === 0 || taskInfo.percentage_complete === 100)
                        || utils.isEmptyVal(taskInfo.percentage_complete)) {
                        taskInfo.percentage_complete = 25;
                    }
                    break;
                case 'Awaiting Clarification':
                    taskInfo.percentage_complete = 0;
                    break;
                case 'Received & Acknowledged':
                    taskInfo.percentage_complete = 0;
                    if (taskInfo.percentage_complete === 100 || utils.isEmptyVal(taskInfo.percentage_complete)) {
                        taskInfo.percentage_complete = 0;
                    }
                    break;
            }
        }

        function setStatus(percentageComplete, status) {
            if (percentageComplete === 100) {
                vm.taskInfo.status = 'Completed';
                return;
            }

            if (percentageComplete === 0) {
                vm.taskInfo.status = 'Not Started';
                return;
            }

            if ((status === 'Not Started' && percentageComplete > 0) || (status === 'Completed' && percentageComplete < 100)) {
                vm.taskInfo.status = 'In Progress';
                return;
            }


        }

        function openCalender($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }

        function cancel() {
            if (vm.isGlobal) {
                $timeout(function () {
                    if ($scope.LaunchGlobalTasks) {
                        IntakeTasksHelper.resetTaskInfo();
                        $scope.LaunchGlobalTasks.taskClear();
                        $scope.LaunchGlobalTasks.goToLauncherTask("cancel");
                    } else {
                        IntakeTasksHelper.resetTaskInfo();
                        $scope.globalTasks.display.page = "taskList";
                        $scope.globalTasks.taskClear();
                        resetCallbackHelper.setCallback($scope.globalTasks.pageReset);
                    }


                });
            } else {
                $modalInstance.dismiss();
            }
        }

        function save(taskData) {
            var task = angular.copy(taskData);
            task.notes = (utils.isEmptyVal(task.notes)) ? task.notes = "" : task.notes;
            //set current global status
            setGlobalInfo();
            task.reminder_users_id = vm.userSelectedMode;
            if (task.custom_reminder) {
                var endDate = moment(new Date(task.due_date)).utc();
                var customDateReminder = moment(new Date(task.custom_reminder)).utc();

                if (endDate.isBefore(customDateReminder)) {
                    notificationService.error('Reminder date can not be greater than due date');
                    return;
                }
            }
            if (utils.isNotEmptyVal(task.task_name) && utils.isNotEmptyVal(task.user_id) && utils.isNotEmptyVal(task.priority)) {
                if (task.reminder_users != "all" && task.reminder_users != "assignedusers") {
                    if (task.remind_users_temp.length > 0) {
                        task.reminder_users = task.remind_users_temp.toString();
                    } else {
                        notificationService.error("Please select at least one remind user");
                        return;
                    }
                }
            }
            if (intakeAddTaskHelper.isTaskValid(task, vm.isGlobal)) {
                task.reminder_users_id = task.reminder_users == "assignedusers" ? 1 : (task.reminder_users == "all") ? 2 : 3;
                // vm.pageMode === 'edit' ? editTask(task, matterId) : addTask(task);
                task.reminder_days = (utils.isNotEmptyVal(task.reminder_days)) ? task.reminder_days.toString() : '';
                if (typeof task.reminder_days !== 'undefined') {
                    if (task.reminder_days == "null" || task.reminder_days.length == 0) {
                        task.reminder_days = '';
                    }
                }
                intakeAddTaskHelper.setTaskBeforeSave(task);

            } else {
                notificationService.error(intakeAddTaskHelper.invalidMessage(task, vm.isGlobal));
                return;
            }

            if (intakeAddTaskHelper.isTaskUpdated(vm.existingTask, taskData) && vm.pageMode === 'edit') {
                //check if start and end date is update or not
                // vm.existingTask.due_date = moment(angular.copy(vm.existingTask.due_date));
                var dueDate = utils.getUTCTimeStamp(angular.copy(taskData.due_date));
                if (vm.existingTask.due_date != dueDate) {
                    vm.checkReason = true;
                }

                //US#8707 : Show popup only for date/time change

                if (vm.checkReason == true) {
                    var modalInstance = intakeAddTaskHelper.openTaskRemarkPopup(vm.checkReason);

                    modalInstance.result.then(function (response) {
                        //set task update remark from user input on  task obj that we are saving
                        task.comments = response.updateRemark;

                        //set task update reason from user input on task obj that we are saving
                        task.reason = (utils.isEmptyVal(response.rescheduleId)) ? '' : response.rescheduleId;


                        // save task  


                        vm.pageMode === 'edit' ? editTask(task) : addTask(task);


                    }, function (error) {
                        notificationService.error('Could not save task..');
                    });
                } else {
                    vm.pageMode === 'edit' ? editTask(task) : addTask(task);
                }

            } else {
                // set default value for update comments if no updates are there
                task.comments = "";

                // save task
                vm.pageMode === 'edit' ? editTask(task, vm.existingTask.due_date) : addTask(task);
            }
        }


        function editTask(task, due_date) {
            task.user_id = _.pluck(task.user_id, 'userId');
            if (due_date) {
                task.due_date = angular.copy(due_date);
            } else {
                task.due_date = (utils.isEmptyVal(task.due_date)) ? "" : utils.getUTCTimeStamp(task.due_date);
            }
            task.custom_reminder = (utils.isEmptyVal(task.custom_reminder)) ? "" : utils.getUTCTimeStamp(task.custom_reminder);
            task.reminder_days = (utils.isNotEmptyVal(task.reminder_days)) ? task.reminder_days.toString() : '';
            if (typeof task.reminder_days !== 'undefined') {
                if (task.reminder_days == "null" || task.reminder_days.length == 0) {
                    task.reminder_days = '';
                }
            }
            if (task.intake) {
                task.intake_id = task.intake.intakeId;
                task.intakeName = task.intake.intakeName;
            }
            vm.taskData = angular.copy(task);
            vm.taskData.custom_reminder = (utils.isEmptyVal(vm.taskData.custom_reminder)) ? "" : moment.unix(vm.taskData.custom_reminder).utc().format('MM/DD/YYYY');
            var copyTask = {};
            copyTask.assignedTo = task.assignedTo;
            copyTask.assigned_by = task.assigned_by;
            copyTask.assignment_date = task.assignment_date;
            copyTask.assignmentutcdate = task.assignmentutcdate;
            copyTask.comments = task.comments;
            copyTask.completed = task.completed;
            copyTask.created_by = task.created_by;
            copyTask.date_of_intake = task.date_of_intake;
            copyTask.created_date = task.created_date;
            copyTask.due_date = task.due_date;
            copyTask.duedate = task.duedate;
            copyTask.dueutcdate = task.dueutcdate;
            copyTask.intake = task.intake;
            copyTask.intakeName = task.intakeName;
            copyTask.intake_id = task.intake_id;
            copyTask.intake_task_id = task.intake_task_id;
            copyTask.intake_task_subcategory_id = task.intake_task_subcategory_id;
            copyTask.is_deleted = task.is_deleted;
            copyTask.is_migrated = task.is_migrated;
            copyTask.modified_by = task.modified_by;
            copyTask.modified_date = task.modified_date;
            copyTask.notes = task.notes;
            copyTask.percentage_complete = task.percentage_complete;
            copyTask.priority = task.priority;
            copyTask.reason = task.reason;
            copyTask.status = task.status;
            copyTask.taskCount = task.taskCount;
            copyTask.task_name = task.task_name;
            copyTask.user_id = task.user_id;
            copyTask.reminder_users_id = task.reminder_users_id;
            copyTask.reminder_users = task.reminder_users;
            copyTask.custom_reminder = task.custom_reminder;
            copyTask.reminder_days = task.reminder_days;
            task.due_date = (utils.isEmptyVal(task.due_date)) ? "" : moment.unix(task.due_date).utc().format('MM/DD/YYYY');
            intakeTasksDatalayer.updateTask(copyTask, task.intake_task_id)
                .then(function (response) {
                    notificationService.success("Task edited successfully");
                    var getUTCdate = utils.convertUTCtoDate(vm.taskData.due_date);
                    var getTimeStamp = utils.getUTCTimeStampStart(getUTCdate);
                    vm.taskData.due_date = getTimeStamp;
                    if ($scope.LaunchGlobalTasks) {
                        $scope.LaunchGlobalTasks.taskSaved(vm.taskData);
                        $scope.LaunchGlobalTasks.goToLauncherTask();
                    } else {
                        goToTaskList(response.data);
                    }
                }, function (error) {
                    notificationService.error("Unable to edit task");
                });
        }

        function addTask(task) {
            task.user_id = _.pluck(task.user_id, 'userId');
            task.due_date = utils.getUTCTimeStamp(task.due_date);
            task.intake_id = (vm.isGlobal) ? task.intake.intakeId.toString() : matterId;
            task.custom_reminder = (utils.isEmptyVal(task.custom_reminder)) ? "" : utils.getUTCTimeStamp(task.custom_reminder);
            if (utils.isEmptyVal(task.intake_id)) {
                return;
            }
            vm.taskData = angular.copy(task);
            var copyTask = {};
            copyTask.assignedTo = task.assignedTo;
            copyTask.assigned_by = task.assigned_by;
            copyTask.assignment_date = task.assignment_date;
            copyTask.assignmentutcdate = task.assignmentutcdate;
            copyTask.comments = task.comments;
            copyTask.completed = task.completed;
            copyTask.created_by = task.created_by;
            copyTask.date_of_intake = task.date_of_intake;
            copyTask.created_date = task.created_date;
            copyTask.due_date = task.due_date;
            copyTask.duedate = task.duedate;
            copyTask.dueutcdate = task.dueutcdate;
            copyTask.intake = task.intake;
            copyTask.intakeName = task.intakeName;
            copyTask.intake_id = task.intake_id;
            copyTask.intake_task_id = task.intake_task_id;
            copyTask.intake_task_subcategory_id = task.intake_task_subcategory_id;
            copyTask.is_deleted = task.is_deleted;
            copyTask.is_migrated = task.is_migrated;
            copyTask.modified_by = task.modified_by;
            copyTask.modified_date = task.modified_date;
            copyTask.notes = task.notes;
            copyTask.percentage_complete = task.percentage_complete;
            copyTask.priority = task.priority;
            copyTask.reason = task.reason;
            copyTask.status = task.status;
            copyTask.taskCount = task.taskCount;
            copyTask.task_name = task.task_name;
            copyTask.user_id = task.user_id;
            copyTask.reminder_users_id = task.reminder_users_id;
            copyTask.reminder_users = task.reminder_users;
            copyTask.custom_reminder = task.custom_reminder;
            copyTask.reminder_days = task.reminder_days;
            task.due_date = (utils.isEmptyVal(task.due_date)) ? "" : moment.unix(task.due_date).utc().format('MM/DD/YYYY');

            intakeTasksDatalayer.addTaskIntake(copyTask)
                .then(function (response) {
                    notificationService.success("Task added successfully");
                    var getUTCdate = utils.convertUTCtoDate(vm.taskData.due_date);
                    var getTimeStamp = utils.getUTCTimeStampStart(getUTCdate);
                    vm.taskData.due_date = getTimeStamp;
                    if ($scope.LaunchGlobalTasks) {
                        $scope.LaunchGlobalTasks.taskSaved(vm.taskData);
                        $scope.LaunchGlobalTasks.goToLauncherTask();
                    } else {
                        goToTaskList(response.data);
                    }
                }, function (error) {
                    notificationService.error("Unable to save task");
                });
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
                intakeTasksDatalayer.deleteTask(taskId)
                    .then(function (response) {
                        notificationService.success('Task deleted successfully');
                        if ($scope.LaunchGlobalTasks) {
                            $scope.LaunchGlobalTasks.goToLauncherTask();
                            $scope.LaunchGlobalTasks.taskSaved({});
                        } else {
                            goToTaskList({});
                        }
                    }, function (error) {
                        notificationService.error('Unable to delete task');
                    });
            })
        }

        function goToTaskList(addedTask) {
            if (vm.isGlobal) {
                $scope.globalTasks.taskSaved(vm.taskData);
            } else {
                IntakeTasksHelper.setSavedTask(vm.taskData);
                $modalInstance.close(matterId);
            }
        }

        var matters = [];
        function searchMatters(matterName, migrate) {
            return intakeNotesDataService.getMatterList(matterName, migrate);

        }

        function formatTypeaheadDisplay(intakeRec) {
            if (angular.isUndefined(intakeRec) || utils.isEmptyString(intakeRec)) {
                return undefined;
            }

            var intakeName = angular.isUndefined(intakeRec.intakeName) ? '' : intakeRec.intakeName;
            var name = intakeName + intakeRec.dateIntake;
            return (name);
        }

        function addTaskDescription() {
            var modalInstance = $modal.open({
                templateUrl: 'app/intake/tasks/add-task/task-tree/task-tree.html',
                controller: 'IntakeTaskTreeCtrl as taskTree',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    'MasterData': ['intakeMasterData', function (masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData();
                        }
                        return data;
                    }],
                    'Subcategory': function () {
                        subcategory = vm.pageMode === 'edit' ? {
                            intake_task_subcategory_id: vm.taskInfo.intake_task_subcategory_id,
                            notes: vm.taskInfo.task_name
                        } : subcategory;
                        return subcategory;
                    }
                }
            });

            modalInstance.result.then(function (subCat) {
                subcategory = subCat;
                vm.taskInfo.task_name = subCat.notes;
                vm.taskInfo.intake_task_subcategory_id = subCat.intake_task_subcategory_id;
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
                    // vm.taskInfo.remind_users_temp = JSON.parse(task.reminder_users);
                } else {
                    vm.taskInfo.remind_users_temp = [];
                }
                contactFactory.getUsersInFirm()
                    .then(function (response) {
                        var userListing = response.data;
                        contactFactory.intakeStaffUserToMatterStaffUser(userListing);
                        vm.remindUserList = userListing;
                        vm.taskInfo.remind_users_temp = [];
                        _.forEach(JSON.parse(task.reminder_users), function (taskid, taskindex) {
                            _.forEach(vm.remindUserList, function (item) {
                                if (taskid == item.userId) {
                                    vm.taskInfo.remind_users_temp.push(parseInt(taskid));
                                }
                            });
                        });
                    });

            }
        }


        vm.setUserMode = function (user) {
            if (user.id == 1) {
                vm.userSelectedMode = user.id;
                vm.taskInfo.reminder_users = "assignedusers";
                //vm.taskInfo.reminder_users_id = user.id;                
            } else if (user.id == 2) {
                vm.userSelectedMode = user.id;
                vm.taskInfo.reminder_users = "all";
                //vm.taskInfo.reminder_users_id = user.id;                
            } else if (user.id == 3) {
                vm.remindUserList = [];
                vm.userSelectedMode = user.id;
                //vm.taskInfo.reminder_users_id = user.id;                
                if (angular.isDefined(vm.reminder_users) && vm.reminder_users != "" && vm.reminder_users != "all" && vm.reminder_users != "matter") {
                    vm.taskInfo.remind_users_temp = vm.taskInfo.reminder_users;
                } else {
                    vm.taskInfo.remind_users_temp = [];
                    vm.taskInfo.reminder_users = [];
                }

                vm.remindUserList = vm.users;
                $(".userPicker input").focus();

            }

        };
        if (vm.pageMode == 'add') {
            var user = { id: 1 };
            vm.setUserMode(user);
        }
    }

})(angular);

(function (angular) {

    angular
        .module('intake.tasks')
        .factory('intakeAddTaskHelper', intakeAddTaskHelper);

    intakeAddTaskHelper.$inject = ['$modal'];
    function intakeAddTaskHelper($modal) {

        var errorMessages = {
            'task_name': 'Task name is required.',
            'user_id': 'Assigned to is required.',
            //'notes': 'Description is required.',
            'due_date': 'Due date is required.',
            'priority': 'Priority is required.',
            //'remind_users_temp':'Please select at least one remind user.',
            'status': 'Status is required.',
            'percentage_complete': 'Precentage completed is required.',
            'intake': 'Intake name is required.'
        };

        return {
            getTaskInfoObj: getTaskInfoObj,
            isTaskValid: isTaskValid,
            invalidMessage: invalidMessage,
            getPercentageCompleteOpions: getPercentageCompleteOpions,
            getPriorityOptions: getPriorityOptions,
            getTaskStatus: getTaskStatus,
            setTaskBeforeSave: setTaskBeforeSave,
            setTaskObj: setTaskObj,
            openTaskRemarkPopup: _openTaskRemarkPopup,
            isTaskUpdated: _isTaskUpdated,
        };

        function getTaskInfoObj() {
            var task = {
                task_name: undefined,
                user_id: [],
                notes: undefined,
                due_date: undefined,
                priority: 'Normal',
                status: 'Not Started',
                percentage_complete: 0
            };
            return task;
        }

        function isTaskValid(task, isGlobal) {
            var isValid = true;
            var keys = Object.keys(errorMessages);
            //matter id is assigned later for matter tasks
            if (!isGlobal) {
                keys.splice(keys.indexOf('intake'), 1);
            }
            angular.forEach(keys, function (key) {
                if (isValid && utils.isEmptyVal(task[key])) {
                    isValid = false;
                }
            });



            return isValid;
        }

        function invalidMessage(task, isGlobal) {
            var isValid = true;
            var msg = "";
            var tasksKeys = Object.keys(errorMessages);
            //matter id is assigned later for matter tasks
            if (!isGlobal) {
                tasksKeys.splice(tasksKeys.indexOf('intake'), 1);
            }
            _.forEach(tasksKeys, function (key) {
                if (isValid && utils.isEmptyVal(task[key])) {
                    isValid = false;
                    msg = errorMessages[key];
                    if (key == "intake") {
                        var currerntText = $("input[name='intake']").val();
                        if (currerntText.length > 0) {
                            msg = "Intake name is invalid"
                        }
                    }
                }
            });
            return msg;
        }

        function getPercentageCompleteOpions() {
            var options = [
                { label: '0%', value: 0 },
                { label: '25%', value: 25 },
                { label: '50%', value: 50 },
                { label: '75%', value: 75 },
                { label: '100%', value: 100 }
            ];
            return options;
        }

        function getPriorityOptions() {
            var options = ['High', 'Normal', 'Low'];
            return options.sort();
        }

        function getTaskStatus() {
            var options = [
                'Not Started',
                'In Progress',
                'Awaiting Clarification',
                'Received & Acknowledged',
                'Completed'];
            return options.sort();
        }

        function setTaskBeforeSave(task, subcategory) {
            if (utils.isNotEmptyVal(task.user_id)) {
                _.forEach(task.user_id, function (item) {
                    item = parseInt(item);
                })
            }
            if (utils.isNotEmptyVal(task.reminder_days)) {
                task.reminder_days = angular.isDefined(task.reminder_days) ? task.reminder_days.toString() : '';
            }
            task.reminder_days = (utils.isNotEmptyVal(task.reminder_days)) ? task.reminder_days.toString() : '';
            if (typeof task.reminder_days !== 'undefined') {
                if (task.reminder_days == "null" || task.reminder_days.length == 0) {
                    task.reminder_days = '';
                }
            }
            task.user_id = angular.isDefined(task.user_id) ? task.user_id : '';
        }

        function setTaskObj(task) {
            if (task.assignedTo.length > 0) {
                _.forEach(task.assignedTo, function (item) {
                    item.userId = item.userId;
                })
            }
            task.user_id = task.assignedTo;
            task.percentage_complete = parseInt(task.percentage_complete);
            task.duedate = task.due_date;
            task.due_date = getFormatteddate(task.due_date);
        }

        function getFormatteddate(epoch) {
            var formdate = new Date(epoch * 1000);
            formdate = moment(formdate).utc().format('MM/DD/YYYY');
            return formdate;
        }

        function _openTaskRemarkPopup(data) {
            return $modal.open({
                templateUrl: 'app/intake/tasks/taskUpdateBox.html',
                controller: ['$scope', '$modalInstance', 'masterData', '$q', function ($scope, $modalInstance, masterData, $q) {
                    if (utils.isEmptyObj(masterData.getMasterData())) {
                        var request = masterData.fetchMasterData();
                        $q.all([request]).then(function (values) {
                            $scope.taskData = angular.copy(masterData.getMasterData().event_reschedule_reason);
                        })
                    } else {
                        $scope.taskData = angular.copy(masterData.getMasterData().event_reschedule_reason);
                    }

                    var task_reason = angular.copy($scope.taskData);

                    task_reason.splice(0, 1);
                    task_reason.splice(1, 1);

                    $scope.taskReason = angular.copy(task_reason);


                    //set bydefault value of reason
                    $scope.defaultReason = 2;
                    if (data == true) {
                        $scope.reason = data;
                    }
                    $scope.updateRemark = "";

                    $scope.setTaskId = '2';
                    $scope.setTask = function (taskId) {
                        $scope.setTaskId = taskId.reason_order;
                    }

                    $scope.taskUpdate = {};

                    //save remark and reason
                    $scope.saveRemark = function () {
                        if ($scope.reason == true) {
                            $scope.rescheduleId = $scope.setTaskId;
                            $scope.taskUpdate.rescheduleId = $scope.rescheduleId;
                        }
                        $scope.taskUpdate.updateRemark = $scope.updateRemark;
                        $modalInstance.close($scope.taskUpdate);
                    }
                    $scope.cancel = function () {
                        $modalInstance.dismiss();
                    }

                }],
                backdrop: 'static',
                keyboard: false,
                windowClass: 'medicalIndoDialog'
            });
        }

        // Event update check
        function _isTaskUpdated(oldTsk, updatedTsk) {
            var dateToCompare = "";
            if (typeof (updatedTsk.due_date) == "string") {
                dateToCompare = angular.copy(updatedTsk.due_date);
            }
            if (typeof (updatedTsk.due_date) == "object") {
                dateToCompare = angular.copy(moment(updatedTsk.due_date).format("MM/DD/YYYY"));
            }
            if (moment.unix(oldTsk.due_date).utc().format("MM/DD/YYYY") != dateToCompare) {
                return true;
            } else {
                return false;
            }
        }

    }

})(angular);
