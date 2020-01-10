(function (angular) {

    'use strict';
    angular.module('intake.workflow').
        controller('applyintkWorkflowTaskCtrl', applyWorkflowTaskCtrl);
    applyWorkflowTaskCtrl.$inject = ['$timeout', 'notification-service', 'applyintkTaskDatalayer', 'applyintakeWorkflowDatalayer', '$stateParams', 'globalConstants'];


    function applyWorkflowTaskCtrl($timeout, notificationService, applyintkTaskDatalayer, applyintakeWorkflowDatalayer, $stateParams, globalConstants) {

        var vm = this;
        vm.viewWorkflowOverview = false;
        vm.matterId = $stateParams.intakeId;

        vm.openCalender = openCalender;
        vm.openDatepicker = openDatepicker;

        vm.openReminderCalender = openReminderCalender;
        vm.openReminderDatepicker = openReminderDatepicker;


        vm.getFormattedDate = getFormattedDate;
        vm.groupAssignedToUsers = groupAssignedToUsers;


        vm.goToEvents = goToEvents;
        vm.cancel = cancel;
        vm.goToEvent = false;
        vm.workflowSlected = true;
        vm.showSolDatePick = false;
        vm.taskInfo = {};
        vm.opened = {};
        vm.openedReminder = {};
        vm.assignedTo = [];
        vm.viewapplyworkflow = true;
        vm.goToApplyWorkflow = goToApplyWorkflow;        // vm.selectedTasks=[];
        vm.isDatesValid = isDatesValid;
        vm.validUserIDs = true;
        vm.reminderDaysList = globalConstants.reminderDaysList;
        vm.cancelTaskView = false;

        function mapRole(roleName) {
            var roleMap = "";
            switch (roleName) {
                case "Managing Partner/Attorney":
                    roleMap = "partner";
                    break;
                case "Attorney":
                    roleMap = "attorney";
                    break;
                case "Paralegal":
                    roleMap = "paralegal";
                    break;
                case "Staff":
                    roleMap = "staffs";
                    break;
            }
            return roleMap;
        }

        // workFlowDataService.getRoleList()
        //     .then(function (response) {

        //         vm.rolesId = Object.keys(response.data).map(function (prop) {
        //             var roleObj = { 
        //                 rid: prop, 
        //                 role: response.data[prop],
        //                 roleType: mapRole(response.data[prop])
        //             };
        //             return roleObj;
        //         });

        // intakeworkFlowDataService.getAssignedUserData()
        //             .then(function (response) {


        //                     var roleObj = response;  //{ role: prop, roleUsers: response.data[prop] };
        //                 start();
        //                 return roleObj;
        //            });
        // });
        start();

        function start() {
            vm.seldWorkflowData = applyintakeWorkflowDatalayer.getApllyWorkflowData();
            var intakeselectedApplyTaskData = localStorage.getItem("intakeselectedApplyTaskData");
            vm.taskInfo = JSON.parse(intakeselectedApplyTaskData);
            if ((utils.isNotEmptyVal(intakeselectedApplyTaskData)) && vm.taskInfo.length > 0) {
                //vm.taskInfo = JSON.parse(intakeselectedApplyTaskData);
                _.forEach(vm.taskInfo, function (item) {
                    item.duedate = (utils.isEmptyVal(item.due_date)) ? "" : moment.unix(item.due_date).utc().format('MM/DD/YYYY');
                    item.custom_reminder = (utils.isEmptyVal(item.custom_reminder)) ? "" : moment.unix(item.custom_reminder).utc().format('MM/DD/YYYY');
                });
                getAssignedToList(vm.taskInfo[0].workflow_id, vm.matterId);

            } else {
                // vm.seldWorkflowData = applyintakeWorkflowDatalayer.getApllyWorkflowData();
                init();
                //setBreadcrum();
            }
        }

        function init() {
            getTasksEventsList();
        }

        function isDatesValid() {
            if ($('#custom_reminderwork2').css("display") == "block") {
                return true;
            } else {
                return false;
            }
        }

        function cancel() {
            vm.cancelTaskView = true;
            vm.goToEvent = false;
            vm.viewapplyworkflow = false;
        }

        function goToApplyWorkflow(setApllyTaskData) {
            vm.goToTask = false;
            vm.viewapplyworkflow = false;
            vm.goToEvent = false;
            vm.applyWorkflow = true;

        }

        function getAssignedToList(workflowID, matterID) {
            applyintakeWorkflowDatalayer.getTasksEventsList(workflowID, matterID)
                .then(function (response) {
                    var assignedTo = response.data;
                    _.forEach(assignedTo.all_firm_users, function (user) {
                        user.isFirmUser = 1;
                        vm.assignedTo.push(user);
                    });
                    _.forEach(assignedTo.intake_assigned_users, function (user) {
                        user.isFirmUser = 0;
                        vm.assignedTo.push(user);
                    });
                });
        }


        vm.setSelectedTask = function (task) {
            $timeout(function () {
                task.checked = task.checked ? false : true;

            });
        }



        function getTasksEventsList() {
            var workflowID = vm.seldWorkflowData.selWorkflow.workflow_id;
            applyintakeWorkflowDatalayer.getTasksEventsList(workflowID, vm.matterId)
                .then(function (response) {
                    var assignedTo = response.data;
                    _.forEach(assignedTo.all_firm_users, function (user) {
                        user.isFirmUser = 1;
                        vm.assignedTo.push(user);
                    });
                    _.forEach(assignedTo.intake_assigned_users, function (user) {
                        user.isFirmUser = 0;
                        vm.assignedTo.push(user);
                    });
                    calDueDate(response.data.workflow[0].workflow_task);
                    vm.taskInfo = response.data.workflow[0].workflow_task;
                    _.forEach(vm.taskInfo, function (item) {

                        if (item.assignedusersrole && item.assignedusersrole.length > 0) {
                            var usr = [];
                            _.forEach(item.assignedusersrole, function (roleId) {

                                var roleDetail = _.findWhere(vm.rolesId, { rid: roleId });
                                if (roleDetail) {
                                    var usrDetails = _.findWhere(vm.allUsersForMatter, { role: roleDetail.roleType });

                                    if (usrDetails && usrDetails.roleUsers.length > 0) {
                                        _.forEach(usrDetails.roleUsers, function (individualuser) {
                                            usr.push(individualuser.uid);
                                        });

                                    }
                                }
                            });
                            item.user_id = _.uniq(usr);
                        }
                    });

                    // vm.selectedTasks = angular.copy(response.data.task);
                });
        }

        function calDueDate(tasks) {
            _.forEach(tasks, function (task) {
                task.checked = angular.isUndefined(task.checked) ? true : false;
                var solDate = angular.isUndefined(vm.seldWorkflowData.sol.start) ? vm.seldWorkflowData.sol : vm.seldWorkflowData.sol.start;
                var doin = vm.seldWorkflowData.intake.date_of_intake;
                var doi = vm.seldWorkflowData.intake.dateOfIncident;
                var customDate1 = vm.seldWorkflowData.customDate1;
                var customDate2 = vm.seldWorkflowData.customDate2;
                var mcd = vm.seldWorkflowData.intake.intake_created_date;

                if (task.type == 'E' && task.ref_date_id == '1') {
                    if (task.day_type == 'C') {
                        task.duedate = parseInt(task.no_of_days) > 0 ? setDueDateAdd(solDate, task) : setDueDateSub(solDate, task);
                    } else {
                        task.duedate = parseInt(task.no_of_days) > 0 ? setWeekdaysDueDateAdd(solDate, task) : setWeekdaysDueDateSub(solDate, task);
                    }
                }
                if (task.type == 'M') {
                    if (task.ref_date_id == '3') {
                        if (task.day_type == 'C') {
                            task.duedate = parseInt(task.no_of_days) > 0 ? setDueDateAdd(doin, task) : setDueDateSub(doin, task);
                        } else {
                            task.duedate = parseInt(task.no_of_days) > 0 ? setWeekdaysDueDateAdd(doin, task) : setWeekdaysDueDateSub(doin, task);
                        }
                    } else if (task.ref_date_id == '2') {
                        if (task.day_type == 'C') {
                            task.duedate = parseInt(task.no_of_days) > 0 ? setDueDateAdd(doi, task) : setDueDateSub(doi, task);
                        } else {
                            task.duedate = parseInt(task.no_of_days) > 0 ? setWeekdaysDueDateAdd(doi, task) : setWeekdaysDueDateSub(doi, task);
                        }
                    } else if (task.ref_date_id == '1') {
                        if (task.day_type == 'C') {
                            task.duedate = parseInt(task.no_of_days) > 0 ? setDueDateAdd(mcd, task) : setDueDateSub(mcd, task);
                        } else {
                            task.duedate = parseInt(task.no_of_days) > 0 ? setWeekdaysDueDateAdd(mcd, task) : setWeekdaysDueDateSub(mcd, task);
                        }
                    }
                }

                if (task.type == 'C') {
                    if (task.ref_date_id == '1') {
                        if (task.day_type == 'C') {
                            task.duedate = parseInt(task.no_of_days) > 0 ? setDueDateAdd(customDate1, task) : setDueDateSub(customDate1, task);
                        } else {
                            task.duedate = parseInt(task.no_of_days) > 0 ? setWeekdaysDueDateAdd(customDate1, task) : setWeekdaysDueDateSub(customDate1, task);
                        }

                    } else if (task.ref_date_id == '2') {
                        if (task.day_type == 'C') {
                            task.duedate = parseInt(task.no_of_days) > 0 ? setDueDateAdd(customDate2, task) : setDueDateSub(customDate2, task);
                        } else {
                            task.duedate = parseInt(task.no_of_days) > 0 ? setWeekdaysDueDateAdd(customDate2, task) : setWeekdaysDueDateSub(customDate2, task);
                        }
                        task.optionSelected = 'customDate2';
                    }

                }

            });

        }

        //function to calculate Calendar days ...Start
        function setDueDateAdd(date, task) {
            var newStart = moment(date).add(task.no_of_days, 'days').unix();
            newStart = moment.unix(newStart).format('MM/DD/YYYY');
            return newStart;
        }

        function setDueDateSub(date, task) {
            task.no_of_days = parseInt(task.no_of_days) > 0 ? task.no_of_days : 0 - (parseInt(task.no_of_days));
            var newStart = moment(date).subtract(task.no_of_days, 'days').unix();
            newStart = moment.unix(newStart).format('MM/DD/YYYY');
            return newStart;
        }

        //...End

        //function to caluclate week days ... Start
        function setWeekdaysDueDateAdd(date, event) {
            function addWeekdays(date, dayss) {
                date = moment(date); // clone
                // while (dayss > 0) {
                //     var d, days;
                //     d = new Date(date);
                //     var currDay = d.getUTCDay();
                //     // decrease "days" only if it's a weekday.
                //     if (currDay != 0 && currDay < 5  ) {
                //         dayss -= 1;
                //     }
                //     //if(dayss != 0){
                //         date = date.add(1, 'days');
                //   //  }
                // }
                date = moment(date).businessAdd(dayss);
                var d = new Date(date);
                var currDay = d.getUTCDay();
                if (currDay == 6) {
                    date = date.subtract(1, 'days');
                }
                else if (currDay == 0) {
                    date = date.subtract(2, 'days');
                }
                return date;
            }

            event.no_of_days = parseInt(event.no_of_days) > 0 ? event.no_of_days : 0 - (parseInt(event.no_of_days));
            var ndat = addWeekdays(date, event.no_of_days);
            ndat = moment(ndat).format('MM/DD/YYYY');

            return ndat;
        }

        function setWeekdaysDueDateSub(date, event) {
            function subWeekdays(date, dayss) {
                date = moment(date); // clone
                // while (dayss > 0) {
                //     var d, days;
                //     d = new Date(date);
                //     var currDay = d.getUTCDay();

                //     // decrease "days" only if it's a weekday.
                //     if (currDay != 0 && currDay < 5) {
                //         dayss -= 1;
                //     }
                //     //if(dayss != 0){
                //         date = date.subtract(1, 'days');
                //    // }
                // }
                date = moment(date).businessSubtract(dayss);
                //    var d = new Date(date);
                //     var currDay = d.getUTCDay();
                //     if(currDay == 6)
                //     {
                //         date = date.add(2, 'days');
                //     }
                //     else if(currDay == 0)
                //     {
                //         date = date.add(1, 'days');
                //     }
                return date;
            }

            event.no_of_days = parseInt(event.no_of_days) > 0 ? event.no_of_days : 0 - (parseInt(event.no_of_days));
            var ndat = subWeekdays(date, event.no_of_days);
            ndat = moment(ndat).format('MM/DD/YYYY');

            return ndat;
        }

        function checkValidUsers(setApllyTaskData) {
            var selectedTasksData = angular.copy(setApllyTaskData);
            selectedTasksData = _.filter(selectedTasksData, function (item) { return item.checked == true; });
            _.forEach(selectedTasksData, function (item) {
                if (item.checked == true && utils.isEmptyVal(item.user_id)) {
                    vm.validUserIDs = false;
                }
                if (item.custom_reminder) {
                    var endDate = moment(new Date(item.duedate)).utc();
                    var customDateReminder = moment(new Date(item.custom_reminder)).utc();
                    if (endDate.isBefore(customDateReminder)) {
                        vm.invalidDates = true;
                        return;
                    }
                }
            });

        }

        //...End   


        function goToEvents(setApllyTaskData) {
            vm.invalidDates = false;
            // setApllyTaskData = _.filter(setApllyTaskData, function(item) {
            //    return item.checked==true ;
            // });
            checkValidUsers(setApllyTaskData);
            if (vm.invalidDates) {
                notificationService.error('Reminder date can not be greater than due date');
                return false;
            }
            if (vm.validUserIDs) {
                vm.goToEvent = true;
                setApllyTaskData.assignedTo = vm.assignedTo;
                _.forEach(setApllyTaskData, function (item) {
                    item.due_date = (utils.isEmptyVal(item.duedate)) ? "" : utils.getUTCTimeStamp(item.duedate);
                    item.custom_reminder = (utils.isEmptyVal(item.custom_reminder)) ? "" : utils.getUTCTimeStamp(item.custom_reminder);
                });
                localStorage.setItem("intakeselectedApplyTaskData", JSON.stringify(setApllyTaskData));
                _.forEach(setApllyTaskData, function (item) {
                    item.user_id = angular.isDefined(item.user_id) ? item.user_id : '';
                    if (item.reminder_days) {
                        item.reminder_days = angular.isDefined(item.reminder_days) ? item.reminder_days.toString() : '';
                    }
                    else {
                        item.reminder_days = '';
                    }
                });
                applyintkTaskDatalayer.setApllyTaskData(setApllyTaskData);
            } else {
                notificationService.error('Assign to is mandatory for selected task(s)');
                vm.validUserIDs = true;
                return;
            }

        }

        // Group assigned to users as firm user and matter assigned to user
        function groupAssignedToUsers(user) {
            return applyintakeWorkflowDatalayer.groupByUserType(user);
        }

        // convert date timestamp to MM/DD/YYYY format...
        function getFormattedDate(epoch) {
            var formdate = new Date(epoch * 1000);
            formdate = moment(formdate).format('MM/DD/YYYY');
            return formdate;
        }

        // $event bind with due date  datepicker...
        function openCalender($event, i1) {
            $event.preventDefault();
            $event.stopPropagation();
            angular.forEach(vm.opened, function (val, key) {
                vm.opened[key] = false;
            });
            i1 = i1.toString();
            vm.opened[i1] = true
        }

        function openDatepicker(i1) {
            i1 = i1.toString();
            return i1;
        }

        function openReminderCalender($event, i1) {
            $event.preventDefault();
            $event.stopPropagation();
            angular.forEach(vm.openedReminder, function (val, key) {
                vm.openedReminder[key] = false;
            });
            i1 = i1.toString();
            vm.openedReminder[i1] = true
        }

        function openReminderDatepicker(i1) {
            i1 = i1.toString();
            return i1;
        }


    }



})(angular);



(function (angular) {

    angular.module('intake.workflow')
        .factory('applyintkTaskDatalayer', applyintkTaskDatalayer);


    applyintkTaskDatalayer.$inject = ['$http', 'globalConstants'];
    function applyintkTaskDatalayer($http, globalConstants) {

        var selectedTaskData = {};
        var urls = {
            TaskEventsList: globalConstants.intakeServiceBaseV2 + 'workflow',
        };
        function getParams(params) {
            var querystring = "";
            angular.forEach(params, function (value, key) {
                querystring += key + "=" + value;
                querystring += "&";
            });
            return querystring.slice(0, querystring.length - 1);
        }

        return {
            setApllyTaskData: _setApllyTaskData,
            getApllyTaskData: _getApllyTaskData,
            getTasksEventsList: _getTasksEventsList
        };

        function _getApllyTaskData() {
            return selectedTaskData;
        }

        function _setApllyTaskData(taskData) {
            selectedTaskData = taskData;
            //return workflowdata;
        }



        function _getTasksEventsList(selWorkflowId, matterId) {
            var data = { 'intakeId': matterId, workflowId: selWorkflowId.toString() };
            var url = urls.TaskEventsList + '?' + getParams(data);;
            return $http.get(url);
        }



    }


})(angular);

