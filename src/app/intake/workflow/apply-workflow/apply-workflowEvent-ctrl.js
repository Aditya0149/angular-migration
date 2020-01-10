(function (angular) {

    'use strict';
    angular.module('intake.workflow').
        controller('applyintkWorkflowEventCtrl', applyWorkflowEventCtrl);
    applyWorkflowEventCtrl.$inject = ['$timeout', 'globalConstants', 'notification-service', 'applyintkTaskDatalayer', 'applyintkEventDatalayer', 'applyintakeWorkflowDatalayer', '$stateParams'];


    function applyWorkflowEventCtrl($timeout, globalConstants, notificationService, applyintkTaskDatalayer, applyintkEventDatalayer, applyintakeWorkflowDatalayer, $stateParams) {

        var vm = this;
        vm.viewWorkflowOverview = false;
        vm.matterId = $stateParams.intakeId;

        vm.openCalender = openCalender;
        vm.openDatepicker = openDatepicker;


        vm.openReminderCalender = openReminderCalender;
        vm.openReminderDatepicker = openReminderDatepicker;


        vm.getFormattedDate = getFormattedDate;
        vm.groupAssignedToUsers = groupAssignedToUsers;
        vm.cancel = cancel;


        vm.apply = apply;
        //  vm.goToEvent = false;
        vm.workflowSlected = true;
        vm.showSolDatePick = false;
        vm.eventInfo = {};
        vm.opened = {};
        vm.openedReminder = {};
        vm.assignedTo = [];
        vm.viewapplyworkflow = true;
        vm.selectTime = globalConstants.timeArray;
        vm.goToTasks = goToTasks;
        vm.setEndTime = setEndTime;
        // vm.selectedEvent =[];

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

        //         workFlowDataService.getMatterUsers(vm.matterId)
        //             .then(function (response) {

        //                 vm.allUsersForMatter = Object.keys(response.data).map(function (prop) {
        //                     var roleObj = { role: prop, roleUsers: response.data[prop] };
        //                     return roleObj;
        //                 });

        start();
        //             });
        //     });

        function start() {
            vm.seldWorkflowData = applyintakeWorkflowDatalayer.getApllyWorkflowData();
            vm.seldWorkTaskData = applyintkTaskDatalayer.getApllyTaskData();
            var intakeselectedApplyEventData = localStorage.getItem("intakeintakeselectedApplyEventData");
            vm.eventInfo = JSON.parse(intakeselectedApplyEventData);
            if ((utils.isNotEmptyVal(intakeselectedApplyEventData)) && vm.eventInfo.length > 0) {
                _.forEach(vm.eventInfo, function (item) {
                    item.duedate = (utils.isEmptyVal(item.duedate)) ? "" : moment.unix(item.duedate).utc().format('MM/DD/YYYY');
                    item.custom_reminder = (utils.isEmptyVal(item.custom_reminder)) ? "" : moment.unix(item.custom_reminder).utc().format('MM/DD/YYYY');
                });
                getAssignedToList(vm.eventInfo[0].workflow_id, vm.matterId);

            } else {
                init();
                //setBreadcrum();
            }
        }

        function init() {
            getTasksEventsList();
        }

        vm.setSelectedEvent = function (event) {
            $timeout(function () {
                event.checked = event.checked ? false : true;
            });
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
                    calDueDate(response.data.workflow[0].workflow_event);
                    vm.eventInfo = response.data.workflow[0].workflow_event;

                    _.forEach(vm.eventInfo, function (item) {

                        if (item.assignedusersrole && item.assignedusersrole.length > 0) {
                            var usr = [];
                            _.forEach(item.assignedusersrole, function (roleId) {

                                var roleDetail = _.findWhere(vm.rolesId, { rid: roleId });
                                if (roleDetail) {
                                    var usrDetails = _.findWhere(vm.allUsersForMatter, { role: roleDetail.roleType });

                                    if (usrDetails && usrDetails.roleUsers.length > 0) {
                                        _.forEach(usrDetails.roleUsers, function (individualuser) {
                                            individualuser.fname = [individualuser.name, individualuser.lname].join(" ");
                                            usr.push(individualuser);
                                        });

                                    }
                                }
                            });
                            item.assigned_to = _.chain(usr).indexBy("uid").values().value();
                        }
                    });
                });
        }

        function calDueDate(events) {
            _.forEach(events, function (event) {
                event.reminder_days = ['0'];
                event.checked = angular.isUndefined(event.checked) ? true : false;
                var solDate = angular.isUndefined(vm.seldWorkflowData.sol.start) ? vm.seldWorkflowData.sol : vm.seldWorkflowData.sol.start;
                var doin = vm.seldWorkflowData.intake.date_of_intake;
                var doi = vm.seldWorkflowData.intake.dateOfIncident;
                var customDate1 = vm.seldWorkflowData.customDate1;
                var customDate2 = vm.seldWorkflowData.customDate2;
                var mcd = vm.seldWorkflowData.intake.intake_created_date;


                // setReminderDaysList(event);

                if (event.labelid == 1) {
                    event.reminderDaysList = angular.copy(globalConstants.SOLReminderDaysList);
                } else {
                    event.reminderDaysList = angular.copy(globalConstants.reminderDaysList);
                }

                if (event.type == 'E' && event.ref_date_id == '1') {
                    if (event.day_type == 'C') {
                        event.duedate = parseInt(event.no_of_days) > 0 ? setDueDateAdd(solDate, event) : setDueDateSub(solDate, event);

                    } else {
                        event.duedate = parseInt(event.no_of_days) > 0 ? setWeekdaysDueDateAdd(solDate, event) : setWeekdaysDueDateSub(solDate, event);
                    }
                    setStartEndDateTime(event);


                }
                if (event.type == 'M') {
                    if (event.ref_date_id == '3') {
                        if (event.day_type == 'C') {
                            event.duedate = parseInt(event.no_of_days) > 0 ? setDueDateAdd(doin, event) : setDueDateSub(doin, event);
                        } else {
                            event.duedate = parseInt(event.no_of_days) > 0 ? setWeekdaysDueDateAdd(doin, event) : setWeekdaysDueDateSub(doin, event);
                        }
                        setStartEndDateTime(event);

                    } else if (event.ref_date_id == '2') {
                        if (event.day_type == 'C') {
                            event.duedate = parseInt(event.no_of_days) > 0 ? setDueDateAdd(doi, event) : setDueDateSub(doi, event);
                        } else {
                            event.duedate = parseInt(event.no_of_days) > 0 ? setWeekdaysDueDateAdd(doi, event) : setWeekdaysDueDateSub(doi, event);
                        }
                        setStartEndDateTime(event);
                    } else if (event.ref_date_id == '1') {
                        if (event.day_type == 'C') {
                            event.duedate = parseInt(event.no_of_days) > 0 ? setDueDateAdd(mcd, event) : setDueDateSub(mcd, event);
                        } else {
                            event.duedate = parseInt(event.no_of_days) > 0 ? setWeekdaysDueDateAdd(mcd, event) : setWeekdaysDueDateSub(mcd, event);
                        }
                        setStartEndDateTime(event);
                    }
                }

                if (event.type == 'C') {
                    if (event.ref_date_id == '1') {
                        if (event.day_type == 'C') {
                            event.duedate = parseInt(event.no_of_days) > 0 ? setDueDateAdd(customDate1, event) : setDueDateSub(customDate1, event);
                        } else {
                            event.duedate = parseInt(event.no_of_days) > 0 ? setWeekdaysDueDateAdd(customDate1, event) : setWeekdaysDueDateSub(customDate1, event);
                        }
                        setStartEndDateTime(event);

                    } else if (event.ref_date_id == '2') {
                        if (event.day_type == 'C') {
                            event.duedate = parseInt(event.no_of_days) > 0 ? setDueDateAdd(customDate2, event) : setDueDateSub(customDate2, event);
                        } else {
                            event.duedate = parseInt(event.no_of_days) > 0 ? setWeekdaysDueDateAdd(customDate2, event) : setWeekdaysDueDateSub(customDate2, event);
                        }
                        setStartEndDateTime(event);

                    }

                }

            });

        }

        function setStartEndDateTime(event) {
            if (event.all_day == 0) {
                setEventDates(event.duedate, event);
            } else {
                event.start_date = utils.getUTCTimeStamp(event.duedate);
                event.end_date = utils.getUTCTimeStampEndDay(event.duedate);
            }
        }

        function setEventDates(eventduedate, event) {
            //date converted to string to match the api
            event.reminder_datetime = event.remindMe ? moment(event.reminder_datetime).format('DD-MM-YYYY') : 0;
            //to manage the different names for the same property in api assign reminder_datetime to remind_date
            event.remind_date = event.reminder_datetime;
            //convert moment string date format to date object

            event.utcstart = new Date(event.duedate);
            event.utcend = new Date(event.duedate);

            //check if event is an all day event, if all day event form utc considering only date and no time
            //utcstart, utcnend  prop has date and start/end prop has time
            event.start_date = event.all_day == '1' ? formTimestamp(event.utcstart, event.start_time, true, 'start') :
                formTimestamp(event.utcstart, event.start_time, false);

            event.end_date = event.all_day == '1' ? formTimestamp(event.utcend, event.end_time, true, 'end') :
                formTimestamp(event.utcend, event.end_time, false);
        }

        //form utc fn accepts two date objs (which are used to form utc)
        //one for picking up date and the other for picking up time
        function formTimestamp(d, time, isFullDay, startOrEnd) {
            var timestamp;
            if (isFullDay) {
                //timestamp = d.getTime();
                timestamp = _setUTCDate(d, startOrEnd);
            } else {
                var dt = (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear(); //The getMonth() method returns the month (from 0 to 11) for the specified date, according to local time.
                var date = new Date(dt + ',' + time);
                timestamp = date.getTime();
                timestamp = moment(timestamp).unix();
            }

            return timestamp;
        }

        function setEndTime(starttime, index) {
            var time = starttime.split(':');
            var newhour = parseInt(time[0]) + 1;
            vm.eventInfo[index].end_time = ((newhour < 10) ? ('0' + newhour) : newhour) + ':' + time[1];
        }

        function _setUTCDate(dt, startOrEnd) {
            var date = (dt.getMonth() + 1) + '/' + utils.prependZero(dt.getDate()) + '/' + dt.getFullYear();

            if (startOrEnd == 'end') {
                var eDt = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59, 0));
                date = moment(eDt.getTime()).unix();
            } else {
                date = moment(date, 'MM/DD/YYYY');
                date = new Date(date.toDate());
                date = utils.subtractUTCOffset(date);
                date = moment(date.getTime()).unix();
            }

            return date;
        }

        //function to calculate Calendar days ...Start
        function setDueDateAdd(date, event) {
            var newStart = moment(date).add(event.no_of_days, 'days').unix();
            newStart = moment.unix(newStart).format('MM/DD/YYYY');
            return newStart;
        }

        function setDueDateSub(date, event) {
            event.no_of_days = parseInt(event.no_of_days) > 0 ? event.no_of_days : 0 - (parseInt(event.no_of_days));
            var newStart = moment(date).subtract(event.no_of_days, 'days').unix();
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

        //...End   

        function cancel() {
            vm.viewapplyworkflow = false;
        }

        function goToTasks(applyEventData) {
            applyEventData = _.filter(applyEventData, function (item) {
                return item.checked == true;
            });
            _.forEach(applyEventData, function (item) {
                item.duedate = (utils.isEmptyVal(item.duedate)) ? "" : utils.getUTCTimeStamp(item.duedate);
                item.custom_reminder = (utils.isEmptyVal(item.custom_reminder)) ? "" : utils.getUTCTimeStamp(item.custom_reminder);
            });
            localStorage.setItem("intakeselectedApplyEventData", JSON.stringify(applyEventData));
            vm.goToTask = true
            vm.viewapplyworkflow = true;
            vm.goToEvent = false;
        }

        function checkValidUsers(setApllyEventData) {
            var selectedCheckedEvents = angular.copy(setApllyEventData)
            selectedCheckedEvents = _.filter(selectedCheckedEvents, function (item) { return item.checked == true; });
            _.forEach(selectedCheckedEvents, function (item) {
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

        function areDatesValid(event) {
            var start = moment.unix(event.start_date);
            var end = moment.unix(event.end_date);

            if (event.all_day == '1') {
                if (isCriticalDate(event.labelid)) {
                    return true;
                } else {

                    if (start.isSame(end)) {
                        return true
                    }
                    return end.isAfter(start);
                }
            }
            return end.isAfter(start);
        }


        function apply(applyEventData) {
            vm.invalidDates = false;
            vm.invalidStartEnd = false;
            var applyEventInfo = angular.copy(applyEventData);
            var applyworkflowData = {};
            //applyEventInfo = _.filter(applyEventInfo, function(item) { return item.checked==true ; });
            checkValidUsers(applyEventInfo);
            _.forEach(applyEventInfo, function (item) {
                setStartEndDateTime(item);
                item.duedate = (utils.isEmptyVal(item.duedate)) ? "" : utils.getUTCTimeStamp(item.duedate);
                item.custom_reminder = (utils.isEmptyVal(item.custom_reminder)) ? "" : utils.getUTCTimeStamp(item.custom_reminder);
                item.assigned_to = angular.isDefined(item.assigned_to) ? item.assigned_to : '';
                item.reminder_days = angular.isDefined(item.reminder_days) ? item.reminder_days.toString() : '';
                item.sms_reminder_days = "";
                if (item.all_day == 0 && item.checked == true) {
                    // setEventDates(item.duedate,item);
                    if (!areDatesValid(item)) {
                        vm.invalidStartEnd = true;
                    }
                }


            });
            if (vm.invalidDates) {
                notificationService.error("Reminder date can not be greater than due date");
                return;
            }

            if (vm.invalidStartEnd) {
                notificationService.error("End date time is before start date time");
                return;
            }
            applyintkEventDatalayer.setApplyEventData(applyEventInfo);
            var seldWorkEventData = applyintkEventDatalayer.getApplyEventData();

            applyworkflowData.task = vm.seldWorkTaskData;
            applyworkflowData.event = angular.copy(seldWorkEventData);

            applyworkflowData.task = _.filter(applyworkflowData.task, function (item) { return item.checked == true; });
            applyworkflowData.event = _.filter(applyworkflowData.event, function (item) { return item.checked == true; });

            if (vm.seldWorkTaskData.length < 1 && seldWorkEventData.length < 1) {
                notificationService.error("Select at least one task(s) or event(s) to apply workflow ");
                return;
            }
            applyworkflowData.workflowDetails = vm.seldWorkflowData;

            var postWorkFlowData = postData(applyworkflowData);
            applyintkEventDatalayer.applyWorkflow(postWorkFlowData)
                .then(function (response) {
                    notificationService.success("Workflow applied successfully ");
                    vm.viewapplyworkflow = false;
                }, function (error) {
                    notificationService.error("Unable to apply workflow");
                });

        }

        function postData(applyworkflowData) {
            var postDataObj = {};
            postDataObj.intake = {};
            postDataObj.intake_Id = vm.matterId;
            postDataObj.workflow_id = applyworkflowData.workflowDetails.selWorkflow.workflow_id;
            postDataObj.workflow_name = applyworkflowData.workflowDetails.selWorkflow.workflow_name;
            postDataObj.description = applyworkflowData.workflowDetails.selWorkflow.description;
            postDataObj.workflow_dates = applyworkflowData.workflowDetails.selWorkflow.workflow_dates;
            postDataObj.workflow_task = applyworkflowData.task;
            postDataObj.workflow_event = applyworkflowData.event;

            /**
             *  for more than one sol here we have dropdown and for single sol we have date picker 
             */
            if (utils.isNotEmptyVal(applyworkflowData.workflowDetails.sol.start)) {
                postDataObj.sol_start = (utils.isEmptyVal(applyworkflowData.workflowDetails.sol)) ? "" : utils.getUTCTimeStamp(applyworkflowData.workflowDetails.sol.start);
                postDataObj.sol_end = (utils.isEmptyVal(applyworkflowData.workflowDetails.sol)) ? "" : utils.getUTCTimeStampEndDay(applyworkflowData.workflowDetails.sol.start);
            } else {
                postDataObj.sol_start = (utils.isEmptyVal(applyworkflowData.workflowDetails.sol)) ? "" : utils.getUTCTimeStamp(applyworkflowData.workflowDetails.sol);
                postDataObj.sol_end = (utils.isEmptyVal(applyworkflowData.workflowDetails.sol)) ? "" : utils.getUTCTimeStampEndDay(applyworkflowData.workflowDetails.sol);
            }
            postDataObj.intake = applyworkflowData.workflowDetails.intake;
            postDataObj.intake.dateOfIncident = (utils.isEmptyVal(applyworkflowData.workflowDetails.intake.dateOfIncident)) ? "" : utils.getUTCTimeStamp(applyworkflowData.workflowDetails.intake.dateOfIncident);
            postDataObj.intake.date_of_intake = (utils.isEmptyVal(applyworkflowData.workflowDetails.intake.date_of_intake)) ? "" : utils.getUTCTimeStamp(applyworkflowData.workflowDetails.intake.date_of_intake);
            postDataObj.custom_date1 = (utils.isEmptyVal(applyworkflowData.workflowDetails.customDate1)) ? "" : utils.getUTCTimeStamp(applyworkflowData.workflowDetails.customDate1);
            postDataObj.custom_date2 = (utils.isEmptyVal(applyworkflowData.workflowDetails.customDate2)) ? "" : utils.getUTCTimeStamp(applyworkflowData.workflowDetails.customDate2);
            // postDataObj.intake.date_of_intake = (utils.isEmptyVal(applyworkflowData.workflowDetails.intake.date_of_intake)) ? "" : utils.getUTCTimeStamp(applyworkflowData.workflowDetails.intake.date_of_intake);
            postDataObj.intake.intake_created_date = (utils.isEmptyVal(applyworkflowData.workflowDetails.intake.intake_created_date)) ? "" : utils.getUTCTimeStamp(applyworkflowData.workflowDetails.intake.intake_created_date);
            return postDataObj;
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


        // Group assigned to users as firm user and matter assigned to user
        function groupAssignedToUsers(user) {
            return applyintakeWorkflowDatalayer.groupByUserType(user);
        }


        function setStartEndDate(dateSel) {
            if (utils.isEmptyVal(dateSel)) {
                return dateSel;
            }
            else {
                var date = moment.unix(dateSel).endOf('day');
                date = date.utc();
                date = date.toDate();
                date = new Date(date);
                date = moment(date.getTime()).unix();
                return date;
            }
        }

    }



})(angular);



(function (angular) {

    angular.module('intake.workflow')
        .factory('applyintkEventDatalayer', applyintkEventDatalayer);


    applyintkEventDatalayer.$inject = ['$http', 'globalConstants'];
    function applyintkEventDatalayer($http, globalConstants) {

        var selectedEventData = {};
        var urls = {
            TaskEventsList: globalConstants.intakeServiceBaseV2 + 'workflow',
            applyWorkFlow: globalConstants.intakeServiceBaseV2 + 'workflow',

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
            setApplyEventData: _setApplyEventData,
            getApplyEventData: _getApplyEventData,
            getTasksEventsList: _getTasksEventsList,
            applyWorkflow: _applyWorkflow
        };

        function _getApplyEventData() {
            return selectedEventData;
        }

        function _setApplyEventData(eventData) {
            selectedEventData = eventData;
            //return workflowdata;
        }



        function _getTasksEventsList(selWorkflowId) {
            var data = { 'intakeId': matterId, workflowId: selWorkflowId.toString() };
            var url = urls.TaskEventsList + '?' + getParams(data);;
            return $http.get(url);
        }

        function _applyWorkflow(workFlowData) {
            var url = urls.applyWorkFlow;
            return $http.post(url, workFlowData);
        }




    }


})(angular);

