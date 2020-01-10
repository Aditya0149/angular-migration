(function (angular) {

    angular
        .module('cloudlex.tasks')
        .controller('AddTaskCtrl', AddTaskController);

    AddTaskController.$inject = ['$scope', '$modal', '$timeout',
        'tasksHelper', 'addTaskHelper', 'tasksDatalayer', 'contactFactory', 'modalService',
        'notification-service', 'matterFactory', 'resetCallbackHelper', 'globalConstants', 'masterData'];

    function AddTaskController($scope, $modal, $timeout,
        tasksHelper, addTaskHelper, tasksDatalayer, contactFactory, modalService,
        notificationService, matterFactory, resetCallbackHelper, globalConstants, masterData) {
        var vm = this,
            matterId,
            taskId,
            $modalInstance,
            subcategory = {};

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
        vm.createdUser = true;
        var firmData;
        vm.resetAddTaskPage = resetAddTaskPage;
        vm.showReset = $scope.LaunchGlobalTasks && $scope.LaunchGlobalTasks.display.page == 'addTask' ? true : false;


        //init
        (function () {
            setGlobalInfo();
            init();
        })();

        var globalInfo;
        function setGlobalInfo() {
            globalInfo = tasksHelper.getGlobalTaskInfo();

            if (window.isDrawerOpen) {
                vm.isGlobal = true;
                taskId = globalInfo.taskId;
            } else {
                vm.isGlobal = false;
                $modalInstance = $scope.modalInstance;
                matterId = $scope.matterId;
                taskId = $scope.taskId;
            }
        }

        function isDatesValid() {
            // finds index of error div and validates true or false
            var dateValidateError = false;
            $('#taskAddEditForm').find('.error').each(function () {
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
            vm.percentageComplete = addTaskHelper.getPercentageCompleteOpions();
            vm.priorities = addTaskHelper.getPriorityOptions();
            vm.status = addTaskHelper.getTaskStatus();
            vm.pageMode = (angular.isDefined(taskId) && utils.isNotEmptyString(taskId)) ? 'edit' : 'add';
            getUsersInFirm();
            getTaskForEdit(vm.pageMode);
            vm.pageTitle = vm.pageMode === 'edit' ? 'Edit Task' : 'Add Task';


            vm.userSelectedType = [{ id: 1, name: 'Assigned to Task' }, { id: 2, name: 'All Users' }, { id: 3, name: 'Select User' }];

            // Get permissions for the user and filter out permissions for "Task due date" entity
            var taskPermissions = masterData.getPermissions();
            var userAccessDetails = masterData.getUserRole();
            vm.is_admin = (userAccessDetails.is_admin == 1) ? true : false;
            vm.is_Subscriber = (userAccessDetails.is_subscriber == 1) ? true : false;
            vm.user_id = userAccessDetails.uid;
            vm.taskPermissions = _.filter(taskPermissions[0].permissions, function (per) {
                if (per.entity_name == "Task") {
                    return per;
                }
            });

        }

        function resetAddTaskPage() {
            vm.pageMode === 'add' ? $("input[name='matterid']").val("") : angular.noop();
            vm.form = {};
            vm.percentageComplete = addTaskHelper.getPercentageCompleteOpions();
            vm.priorities = addTaskHelper.getPriorityOptions();
            vm.status = addTaskHelper.getTaskStatus();
            vm.pageMode = (angular.isDefined(taskId) && utils.isNotEmptyString(taskId)) ? 'edit' : 'add';
            getTaskForEdit(vm.pageMode);
            vm.pageTitle = vm.pageMode === 'edit' ? 'Edit Task' : 'Add Task';
            if (vm.pageMode == 'add') {
                var user = { id: 1 };
                vm.setUserMode(user);
            }
        }

        function getTaskForEdit(pageMode) {
            if (pageMode === 'edit') {
                tasksDatalayer.getTaskById(taskId)
                    .then(function (response) {
                        vm.taskInfo = response.data;
                        if (vm.taskInfo.reminder_days == "null") {
                            vm.taskInfo.reminder_days = null;
                        }
                        if (utils.isNotEmptyVal(vm.taskInfo.reminder_days)) {
                            vm.taskInfo.reminder_days = vm.taskInfo.reminder_days.split(',');
                        }

                        if (vm.taskInfo.custom_reminder) {
                            vm.taskInfo.custom_reminder = utils.isEmptyVal(vm.taskInfo.custom_reminder) ? '' : moment.unix(vm.taskInfo.custom_reminder).utc().format('MM/DD/YYYY');
                        }
                        if (vm.taskInfo.created_by == vm.user_id || vm.is_admin == true) {
                            vm.createdUser = false;
                        }
                        getTaskRemindUser(vm.taskInfo);
                        vm.existingTask = angular.copy(vm.taskInfo);
                        addTaskHelper.setTaskObj(vm.taskInfo);
                        if (vm.isGlobal) {
                            matters = [{
                                name: vm.taskInfo.matter.matter_name,
                                matterid: vm.taskInfo.matter.matter_id,
                                filenumber: vm.taskInfo.matter.file_number
                            }];
                        }
                    });
            } else {
                vm.taskInfo = addTaskHelper.getTaskInfoObj();
                vm.existingTask = angular.copy(vm.taskInfo);
            }
        }

        function getUsersInFirm() {
            contactFactory.getUsersInFirm()
                .then(function (response) {
                    vm.users = response.data;
                }, function (error) {

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
                        $scope.LaunchGlobalTasks.goToLauncherTask("cancel");
                        tasksHelper.resetTaskInfo();
                    } else {
                        tasksHelper.resetTaskInfo();
                        $scope.globalTasks.display.page = "taskList";
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

            if (task.custom_reminder) {
                var endDate = moment(new Date(task.due_date)).utc();
                var customDateReminder = moment(new Date(task.custom_reminder)).utc();

                if (endDate.isBefore(customDateReminder)) {
                    notificationService.error('Reminder date can not be greater than due date');
                    return;
                }
            }

            if (utils.isNotEmptyVal(task.task_name) && utils.isNotEmptyVal(task.user_ids) && utils.isNotEmptyVal(task.priority)) {
                if (task.reminder_users != "all" && task.reminder_users != "assignedusers") {
                    if (task.remind_users_temp.length > 0) {
                        task.reminder_users = task.remind_users_temp.toString();
                    } else {
                        notificationService.error("Please select at least one remind user");
                        return;
                    }
                }
            }

            if (addTaskHelper.isTaskValid(angular.copy(task), vm.isGlobal)) {
                if (!vm.isGlobal) {
                    task.matter = {};
                    task.matter.matter_id = matterId;
                }
                var categoryId = task.task_subcategoryid;
                addTaskHelper.setTaskBeforeSave(task, subcategory);
                task.task_subcategoryid = subcategory.tasksubcategoryid == undefined ? categoryId : subcategory.tasksubcategoryid;
                task.reminder_users_id = task.reminder_users == "assignedusers" ? 1 : (task.reminder_users == "all") ? 2 : 3;
                // vm.pageMode === 'edit' ? editTask(task, matterId) : addTask(task);
                task.reminder_days = (utils.isNotEmptyVal(task.reminder_days)) ? task.reminder_days.toString() : '';
                if (typeof task.reminder_days !== 'undefined') {
                    if (task.reminder_days == "null" || task.reminder_days.length == 0) {
                        task.reminder_days = '';
                    }
                }
            } else {
                notificationService.error(addTaskHelper.invalidMessage(task, vm.isGlobal));
                return;
            }

            if (addTaskHelper.isTaskUpdated(vm.existingTask, taskData) && vm.pageMode === 'edit') {
                var reasonList = utils.getUTCTimeStamp(angular.copy(taskData.due_date));

                if (vm.existingTask.due_date != reasonList) {
                    vm.checkReason = true;
                }

                //US#8707 : Show popup only for date/time change
                if (vm.checkReason == true) {
                    var modalInstance = addTaskHelper.openTaskRemarkPopup(vm.checkReason);

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
            // If user doesn't have update permission for due date then send the original value back to user.
            if (vm.taskPermissions[0].E == 0) {
                task.due_date = task.dueutcdate;
            } else {
                if (due_date) {
                    task.due_date = angular.copy(due_date);
                } else {
                    task.due_date = (utils.isEmptyVal(task.due_date)) ? "" : utils.getUTCTimeStamp(task.due_date);
                }
            }

            task.custom_reminder = (utils.isEmptyVal(task.custom_reminder)) ? "" : utils.getUTCTimeStamp(task.custom_reminder);
            task.reminder_days = (utils.isNotEmptyVal(task.reminder_days)) ? task.reminder_days.toString() : '';
            if (typeof task.reminder_days !== 'undefined') {
                if (task.reminder_days == "null" || task.reminder_days.length == 0) {
                    task.reminder_days = '';
                }
            }
            var copyTask = angular.copy(task);
            //task.due_date = (utils.isEmptyVal(task.due_date)) ? "" : moment.unix(task.due_date).utc().format('MM/DD/YYYY');
            task.custom_reminder = (utils.isEmptyVal(task.custom_reminder)) ? "" : moment.unix(task.custom_reminder).utc().format('MM/DD/YYYY');
            tasksDatalayer.UpdateTask_JAVA(copyTask)
                .then(function (response) {
                    notificationService.success("Task edited successfully");
                    var getUTCdate = utils.convertUTCtoDate(task.due_date);
                    var getTimeStamp = utils.getUTCTimeStampStart(getUTCdate);
                    if ($scope.LaunchGlobalTasks) {
                        $scope.LaunchGlobalTasks.taskSaved(copyTask, getTimeStamp);
                        $scope.LaunchGlobalTasks.goToLauncherTask();
                    } else {
                        goToTaskList(copyTask, getTimeStamp);

                    }
                }, function (error) {
                    notificationService.error("Unable to edit task");
                });
        }

        function addTask(task) {
            if (isNaN(parseInt(task.matter.matter_id)) || task.matter.matter_id == '') {
                notificationService.error("Matter name does not exist.");
                return false;
            }
            //task.due_date = (utils.isEmptyVal(task.due_date)) ? "" : utils.getUTCTimeStamp(task.due_date);
            task.due_date = utils.getUTCTimeStamp(task.due_date);
            task.custom_reminder = (utils.isEmptyVal(task.custom_reminder)) ? "" : utils.getUTCTimeStamp(task.custom_reminder);
            var copyTask = angular.copy(task);
            //task.due_date = (utils.isEmptyVal(task.due_date)) ? "" : moment.unix(task.due_date).utc().format('MM/DD/YYYY');
            //task.custom_reminder = (utils.isEmptyVal(task.custom_reminder)) ? "" : moment.unix(task.custom_reminder).utc().format('MM/DD/YYYY');
            tasksDatalayer.addTask_JAVA(copyTask)
                .then(function (response) {
                    notificationService.success("Task added successfully");
                    var getUTCdate = utils.convertUTCtoDate(task.due_date);
                    var getTimeStamp = utils.getUTCTimeStampStart(getUTCdate);
                    if ($scope.LaunchGlobalTasks) {
                        $scope.LaunchGlobalTasks.taskSaved(copyTask, getTimeStamp);
                        $scope.LaunchGlobalTasks.goToLauncherTask();

                    } else {
                        goToTaskList(copyTask, getTimeStamp);

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
                tasksDatalayer.deleteTask(taskId)
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

        function goToTaskList(addedTask, duedate) {
            if (vm.isGlobal) {
                $scope.globalTasks.taskSaved(addedTask, duedate);
                // $modalInstance.close(addedTask);
            } else {
                tasksHelper.setSavedTask(addedTask);
                $modalInstance.close(matterId);
                //$state.go('tasks', { matterId: matterId });
            }
        }

        var matters = [];
        function searchMatters(matterName) {
            return matterFactory.searchMatters(matterName)
                .then(function (response) {
                    matters = response.data;
                    return response.data;
                });
        }

        function formatTypeaheadDisplay(matterid) {
            if (angular.isUndefined(matterid) || utils.isEmptyString(matterid) || matters.length === 0) {
                return undefined;
            }
            var matterInfo = _.find(matters, function (matter) {
                return matter.matterid === matterid;
            });
            return matterInfo.name + ' - ' + matterInfo.filenumber;
        }

        function addTaskDescription() {
            var modalInstance = $modal.open({
                templateUrl: 'app/tasks/add-task/task-tree/task-tree.html',
                controller: 'TaskTreeCtrl as taskTree',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    'MasterData': ['masterData', function (masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData();
                        }
                        return data;
                    }],
                    'Subcategory': function () {
                        subcategory = vm.pageMode === 'edit' ? {
                            tasksubcategoryid: vm.taskInfo.task_subcategoryid,
                            notes: vm.taskInfo.task_name
                        } : subcategory;
                        return subcategory;
                    }
                }
            });

            modalInstance.result.then(function (subCat) {
                subcategory = subCat;
                vm.taskInfo.task_name = subCat.notes;
                vm.taskInfo.task_subcategoryid = subCat.tasksubcategoryid;
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

                // contactFactory.getUsersInFirm()
                //     .then(function (response) {
                //         vm.remindUserList = response.data;
                //     }, function (error) {
                //     });

                contactFactory.getUsersInFirm()
                    .then(function (response) {
                        vm.remindUserList = response.data;
                        vm.taskInfo.remind_users_temp = [];
                        _.forEach(JSON.parse(task.reminder_users), function (taskid, taskindex) {
                            _.forEach(vm.remindUserList, function (item) {
                                if (taskid == item.user_id) {
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

                contactFactory.getUsersInFirm()
                    .then(function (response) {
                        var users = response.data;
                        vm.remindUserList = users;
                        $(".userPicker input").focus();
                    }, function (error) {
                    });

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
        .module('cloudlex.tasks')
        .factory('addTaskHelper', addTaskHelper);

    addTaskHelper.$inject = ['$modal'];

    function addTaskHelper($modal) {

        var errorMessages = {
            'taskname': 'Task name is required.',
            'userid': 'Assigned to is required.',
            //'notes': 'Description is required.',
            'duedate': 'Due date is required.',
            'priority': 'Priority is required.',
            //'remind_users_temp':'Please select at least one remind user.',
            'status': 'Status is required.',
            'percentagecomplete': 'Precentage completed is required.',
            'matterid': 'Matter name is required.'
        };

        var errorMessages_JAVA = {
            'matterid': 'Matter name is required.',
            'task_name': 'Task name is required.',
            'user_ids': 'Assigned to is required.',
            //'notes': 'Description is required.',
            'due_date': 'Due date is required.',
            'priority': 'Priority is required.',
            //'remind_users_temp':'Please select at least one remind user.',
            'status': 'Status is required.',
            'percentage_complete': 'Precentage completed is required.'

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
                user_ids: [],
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
            var keys = Object.keys(errorMessages_JAVA);
            //matter id is assigned later for matter tasks
            if (!isGlobal) {
                keys.splice(keys.indexOf('matterid'), 1);
            } else {
                if (task.matter && task.matter.matter_id) {
                    task.matterid = task.matter.matter_id;
                } else {
                    task.matterid = null;
                }
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
            var tasksKeys = Object.keys(errorMessages_JAVA);
            //matter id is assigned later for matter tasks
            if (!isGlobal) {
                tasksKeys.splice(tasksKeys.indexOf('matterid'), 1);
            } else {
                if (task.matter && task.matter.matter_id) {
                    task.matterid = task.matter.matter_id;
                } else {
                    task.matterid = null;
                }
            }
            _.forEach(tasksKeys, function (key) {
                if (isValid && utils.isEmptyVal(task[key])) {
                    isValid = false;
                    msg = errorMessages_JAVA[key];
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
            // var assignedTo = _.find(users, function (user) {
            //     return user.uid === task.userid;
            // });
            //US#7862
            task.user_ids = angular.isDefined(task.user_ids) ? task.user_ids : '';
            if (utils.isNotEmptyVal(task.reminder_days)) {
                task.reminder_days = angular.isDefined(task.reminder_days) ? task.reminder_days.toString() : '';
            }
            task.reminder_days = (utils.isNotEmptyVal(task.reminder_days)) ? task.reminder_days.toString() : '';
            if (typeof task.reminder_days !== 'undefined') {
                if (task.reminder_days == "null" || task.reminder_days.length == 0) {
                    task.reminder_days = '';
                }
            }

            //task.isother = assignedTo.fname !== 'Lexvia';//if user is lexvia set isother false
            task.is_other = '1'; //set bydefault isOther
            //task.username = ''; // set username empty
            task.deleted = 0;

            task.assignment_date = utils.getUTCTimeStamp(new Date().getTime());
        }

        function setTaskObj(task) {
            task.user_ids = _.unique(_.pluck(task.assigned_to, 'user_id'));
            //task.user_ids = task.user_ids.map(String);
            task.percentage_complete = parseInt(task.percentage_complete);
            task.due_date = task.due_date;
            task.due_date = getFormatteddate(task.due_date);
            task.filenumber = task.matter.file_number;
        }

        function getFormatteddate(epoch) {
            var formdate = new Date(epoch * 1000);
            formdate = moment(formdate).utc().format('MM/DD/YYYY');
            return formdate;
        }

        function _openTaskRemarkPopup(data) {
            return $modal.open({
                templateUrl: 'app/tasks/taskUpdateBox.html',
                controller: ['$scope', '$modalInstance', 'masterData', function ($scope, $modalInstance, masterData) {
                    $scope.taskData = masterData.getMasterData();
                    var task_reason = angular.copy($scope.taskData.event_reschedule_reason);

                    // $scope.taskReason
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

        // task update check
        function _isTaskUpdated(oldTsk, updatedTsk) {
            var dateToCompare = "";
            if (typeof (updatedTsk.due_date) == "string") {
                dateToCompare = angular.copy(updatedTsk.due_date);
            }
            if (typeof (updatedTsk.due_date) == "object") {
                dateToCompare = angular.copy(moment(updatedTsk.due_date).format("MM/DD/YYYY"));
            }
            // var oldTskCustRem = (moment(oldTsk.custom_reminder, 'MM-DD-YYYY').isValid()) ? utils.getUTCTimeStamp(oldTsk.custom_reminder) : oldTsk.custom_reminder;
            // var updatedCustRem = (moment(updatedTsk.custom_reminder, 'MM-DD-YYYY').isValid()) ? utils.getUTCTimeStamp(updatedTsk.custom_reminder) : updatedTsk.custom_reminder;
            if (moment.unix(oldTsk.due_date).utc().format("MM/DD/YYYY") != dateToCompare) {
                return true;
            } else {
                return false;
            }
        }

    }

})(angular);

//if (vm.isGlobal) {
//    $timeout(function () {
//        $scope.globalTasks.display.page = "taskList";
//    })
//} else {
//    tasksHelper.setSavedTask(vm.taskInfo);
//    $state.go('tasks', { matterId: matterId });
//}



//try {
//    addTaskInfo = $injector.get('addTaskInfo') ? $injector.get('addTaskInfo') : {};
//} catch (err) {
//    addTaskInfo = {};
//}



//addTaskInfo.isGlobal = addTaskInfo.isGlobal ? addTaskInfo.isGlobal : (globalInfo.isGlobal === true);

//addTaskInfo,

