(function (angular) {
    'use strict';

    angular.module('cloudlex.workflow')
        .controller('addTaskController', addTaskController);

    addTaskController.$inject = ['$modal', 'addTaskDatalayer', 'workflowHelper', 'notification-service', 'workFlowTemplateDataService', 'workFlowDatalayer'];
    function addTaskController($modal, addTaskDatalayer, workflowHelper, notificationService, workFlowTemplateDataService, workFlowDatalayer) {

        var vm = this,
            subcategory = {};
        var taskData = workFlowTemplateDataService.getSelectedTaskData();
        vm.save = save;
        vm.cancel = cancel;
        vm.getPriorityOptions = getPriorityOptions;
        vm.addTaskDescription = addTaskDescription;
        vm.addTask = addTask;
        vm.beforeDates = beforeDates;
        vm.afterDates = afterDates;
        vm.resetAddTaskPage = resetAddTaskPage;


        //     vm.taskInfo ={};
        //   //  vm.taskInfo.optionSelected="MCD";
        //     vm.dateFieldValue =0;
        //     vm.taskInfo.before_after = "Before";
        //     vm.taskInfo.priority = "Normal";
        //     vm.taskInfo.day_type = "Calendar days";

        //     vm.display={};
        //     vm.display.page ='openAddTask';

        workFlowDatalayer.getRoleList()
            .then(function (response) {
                vm.rolesId = Object.keys(response.data).map(function (prop) {
                    var roleObj = { rid: prop, role: response.data[prop] };
                    return roleObj;
                });
            });


        (function () {
            init();
            vm.selctedWorkflowData = workflowHelper.getworkflowData();
            vm.mode = utils.isEmptyObj(taskData) ? 'Add' : 'Edit';
            if (vm.mode == 'Edit') {
                //var editData = JSON.parse(taskData.workflow_dates);
                vm.taskInfo = formatData(taskData);

            }
            vm.clickedWorkflow = JSON.parse(vm.selctedWorkflowData.workflow_dates);
            formatDates(vm.clickedWorkflow);
        })();

        function init() {
            vm.taskInfo = {};
            vm.dateFieldValue = 0;
            vm.taskInfo.before_after = "Before";
            vm.taskInfo.priority = "Normal";
            vm.taskInfo.day_type = "Calendar days";
            vm.display = {};
            vm.display.page = 'openAddTask';
        }

        function resetAddTaskPage() {
            if (vm.mode == 'Add') {
                init();
                vm.clickedWorkflow = JSON.parse(vm.selctedWorkflowData.workflow_dates);
                formatDates(vm.clickedWorkflow);
            } else if (vm.mode == 'Edit') {
                vm.clickedWorkflow = JSON.parse(vm.selctedWorkflowData.workflow_dates);
                vm.taskInfo = formatData(taskData);
                formatDates(vm.clickedWorkflow);
            }
        }

        function formatDates(editData) {
            _.forEach(editData.custom, function (task) {
                if (task.id == '1') {
                    vm.taskInfo.customDate1Label = utils.isNotEmptyVal(task.label) ? task.label : '';
                    vm.taskInfo.custom_date1 = task.id == '1' ? "1" : 0;
                } else if (task.id == '2') {
                    vm.taskInfo.custom_date_label2 = utils.isNotEmptyVal(task.label) ? task.label : '';
                    vm.taskInfo.custom_date2 = task.id == '2' ? "1" : 0;
                }

            });
            vm.taskInfo.SOL = angular.isDefined(editData.matter_event[0]) ? utils.isNotEmptyVal(editData.matter_event[0].code) ? "1" : 0 : 0;

            _.forEach(editData.matter_specific_dates, function (task) {
                if (task.code == 'MCD') {
                    vm.taskInfo.MCD = task.code == 'MCD' ? "1" : 0;
                } else if (task.code == 'DOI') {
                    vm.taskInfo.DOI = task.code == 'DOI' ? "1" : 0;
                } else if (task.code == 'DOIn') {
                    vm.taskInfo.DOIn = task.code == 'DOIn' ? "1" : 0;
                }

            });
        }



        vm.priorities = getPriorityOptions();

        function getPriorityOptions() {
            var options = ['High', 'Normal', 'Low'];
            return options.sort();
        }

        vm.day_type = ["Calendar Days", "Business Days"];

        function beforeDates(param) {
            vm.dateFieldValue = param;
            vm.taskInfo.before_after = "Before";
        }

        function afterDates(param) {
            vm.dateFieldValue = param;
            vm.taskInfo.before_after = "After";
        }



        function addTaskDescription() {
            var modalInstance = $modal.open({
                templateUrl: 'app/tasks/add-task/task-tree/task-tree.html',
                controller: 'TaskTreeCtrl as taskTree',
                backdrop: 'static',
                resolve: {
                    'MasterData': ['masterData', function (masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData();
                        }
                        return data;
                    }],
                    'Subcategory': function () {
                        subcategory = vm.mode === 'Edit' ? {
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

        function formatData(taskData) {
            var copyTask = angular.copy(taskData);
            //  var postObj ={}; 
            copyTask.day_type = copyTask.day_type;
            vm.dateFieldValue = copyTask.before_after == "Before" ? 0 : 1;

            copyTask.no_of_days = parseInt(copyTask.no_of_days) < 0 ? (0 - parseInt(copyTask.no_of_days)) : copyTask.no_of_days;
            copyTask.workflow_id = vm.selctedWorkflowData.workflow_id;

            copyTask.day_type = copyTask.daytype == 'Calendar days' ? "Calendar days" : "Business Days";
            if (copyTask.type == 'E' && copyTask.ref_date_id == '1') {
                copyTask.optionSelected = 'SOL';
            }
            if (copyTask.type == 'M') {
                if (copyTask.ref_date_id == '3') {
                    copyTask.optionSelected = 'DOIn';
                } else if (copyTask.ref_date_id == '2') {
                    copyTask.optionSelected = 'DOI';
                } else if (copyTask.ref_date_id == '1') {
                    copyTask.optionSelected = 'MCD';
                }
            }

            if (copyTask.type == 'C') {
                if (copyTask.ref_date_id == '1') {
                    copyTask.optionSelected = 'custom_date1';
                } else if (copyTask.ref_date_id == '2') {
                    copyTask.optionSelected = 'custom_date2';
                }

            }


            if (copyTask.optionSelected == 'custom_date1' || copyTask.optionSelected == 'custom_date2') {
                copyTask.type = 'C';
                if (copyTask.optionSelected == 'custom_date1') {
                    copyTask.ref_date_id = 1;
                } else {
                    copyTask.ref_date_id = 2;
                }
            }

            if (utils.isNotEmptyVal(copyTask.assigned_users_role)) {
                copyTask.remind_users_temp = [];
                if (copyTask.assigned_users_role && copyTask.assigned_users_role.length > 0) {
                    _.forEach(JSON.parse(copyTask.assigned_users_role), function (taskid, taskindex) {
                        copyTask.remind_users_temp.push((taskid));
                    });
                }
                copyTask.roleid = copyTask.remind_users_temp;
            }

            return copyTask;

        }

        function save(taskData) {
            if (taskData.roleid && taskData.roleid.length > 0) {
                taskData.assigned_users_role = taskData.roleid.toString();
            } else {
                taskData.assigned_users_role = "";
            }
            vm.mode === 'Edit' ? editTask(taskData) : addTask(taskData, subcategory);
        }



        function addTask(task, subcategory) {
            if (task.no_of_days > 5000) {
                notificationService.error("No of days should not be grater than 5000 days");
                return;
            }
            var postTaskData = getPostTaskData(task);
            addTaskDatalayer.addTask(postTaskData)
                .then(function (response) {
                    notificationService.success("Task added successfully");
                    vm.display.page = 'closeAddTask';
                    //  $modalInstance.close();
                    // goToTaskList(response.data);
                }, function (error) {
                    notificationService.error("Unable to save task");
                });

        }


        function editTask(task, subcategory) {
            if (task.no_of_days > 5000) {
                notificationService.error("No of days should not be grater than 5000 days");
                return;
            }
            var postTaskData = getPostTaskData(task);
            addTaskDatalayer.editTask(postTaskData)
                .then(function (response) {
                    notificationService.success("Task Edited successfully");
                    vm.display.page = 'closeAddTask';
                    // $modalInstance.close();
                }, function (error) {
                    notificationService.error("Unable to save task");
                });

        }

        function getPostTaskData(task) {
            var copyTask = angular.copy(task);
            var postObj = {};

            // copyTask.intakeTaskSubcategoryId = vm.mode === 'Edit' ? copyTask.task_subcategory_id : copyTask.intakeTaskSubcategoryId;
            copyTask.notes = utils.isNotEmptyVal(copyTask.notes) ? copyTask.notes : '';
            copyTask.day_type = copyTask.day_type[0] == 'B' ? 'W' : copyTask.day_type[0];
            copyTask.no_of_days = vm.dateFieldValue == 1 ? copyTask.no_of_days : (0 - parseInt(copyTask.no_of_days));
            copyTask.workflow_id = vm.selctedWorkflowData.workflow_id;
            if (copyTask.optionSelected == 'custom_date1' || copyTask.optionSelected == 'custom_date2') {
                copyTask.type = 'C';
                if (copyTask.optionSelected == 'custom_date1') {
                    copyTask.ref_date_id = 1;
                } else {
                    copyTask.ref_date_id = 2;
                }
            }
            if (copyTask.optionSelected == 'SOL') {
                copyTask.type = 'E';
                // copyTask.type = 'M';
                if (copyTask.optionSelected == 'SOL') {
                    copyTask.ref_date_id = 1;
                }
            }
            if (copyTask.optionSelected == 'DOI' || copyTask.optionSelected == 'MCD' || copyTask.optionSelected == 'DOIn') {
                copyTask.type = 'M';
                if (copyTask.optionSelected == 'DOIn') {
                    copyTask.ref_date_id = 3;
                } else if (copyTask.optionSelected == 'DOI') {
                    copyTask.ref_date_id = 2;
                } else if (copyTask.optionSelected == 'MCD') {
                    copyTask.ref_date_id = 1;
                }
            }
            return copyTask;
        }


        function cancel() {
            vm.display.page = 'closeAddTask';
            // $modalInstance.close();
        }

    }

})(angular);

(function (angular) {

    'use strict';

    angular.module('cloudlex.workflow')
        .factory('addTaskDatalayer', addTaskDatalayer);

    addTaskDatalayer.$inject = ['$http', 'globalConstants'];
    function addTaskDatalayer($http, globalConstants) {

        var urls = {
            editTask: globalConstants.javaWebServiceBaseV4 + 'workflow_template/task/',
            addTask: globalConstants.javaWebServiceBaseV4 + 'workflow_template/task',

        };

        return {
            editTask: _editTask,
            addTask: _addTask,
        };


        function _editTask(taskData) {
            var url = urls.editTask + taskData.workflow_task_id;
            return $http.put(url, taskData);
        }

        function _addTask(taskData) {
            var url = urls.addTask;
            return $http.post(url, taskData);
        }

        contatFactory.getAttorneyList = function () {
            var data = { "type": "attorney" };
            var deferred = $q.defer();
            $http({
                url: contactConstants.RESTAPI.attorneyList,
                method: "GET",
                params: data,
                withCredentials: true
            }).success(function (response) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.resolve(ee);
            });

            return deferred.promise;
        }


    }

})(angular);
