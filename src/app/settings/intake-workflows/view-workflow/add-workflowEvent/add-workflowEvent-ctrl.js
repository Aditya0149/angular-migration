(function (angular) {
    'use strict';

    angular.module('intake.workflow')
        .controller('addintakeEventController', addintakeEventController);

    addintakeEventController.$inject = ['$scope', 'dateUtils', 'intakeaddEventDatalayer', 'intakeworkflowHelper', 'globalConstants', 'notification-service', 'masterData', 'intakeworkFlowTemplateDataService', 'practiceAndBillingDataLayer', '$timeout'];
    function addintakeEventController($scope, dateUtils, intakeaddEventDatalayer, intakeworkflowHelper, globalConstants, notificationService, masterData, intakeworkFlowTemplateDataService, practiceAndBillingDataLayer, $timeout) {

        var vm = this, subcategory = {};

        vm.save = save;
        vm.cancel = cancel;

        vm.getPriorityOptions = getPriorityOptions;
        vm.addEvent = addEvent;
        vm.beforeDates = beforeDates;
        vm.afterDates = afterDates;
        vm.showhideDates = showhideDates;
        vm.changeAssignedUser = changeAssignedUser;
        // vm.eventTypes = masterData.getEventTypes();
        vm.selectTime = globalConstants.timeArray;
        vm.setStartEndTime = setStartEndTime;
        var eventData = intakeworkFlowTemplateDataService.getSelectedEventData();
        vm.resetAddEventPage = resetAddEventPage;
        vm.setEndTime = setEndTime;
        // intakeworkFlowTemplateDataService.getRoleList()
        //     .then(function (response) {

        //         vm.rolesId = Object.keys(response.data).map(function (prop) {
        //             var roleObj = { rid: prop, role: response.data[prop] };
        //             return roleObj;
        //         });
        //     });

        function initialSetup() {
            init();
            vm.selctedWorkflowData = intakeworkflowHelper.getworkflowData();
            vm.mode = utils.isEmptyObj(eventData) ? 'Add' : 'Edit';
            if (vm.mode == 'Edit') {
                //var editData = JSON.parse(eventData.workflow_date);
                eventData.label_id = eventData.label_id.toString();
                eventData.name = eventData.event_title;
                vm.eventInfo = formatData(eventData);
                enableDisableTaskFlag();
                showhideDates(vm.eventInfo, vm.mode)

            }
            vm.clickedWorkflow = JSON.parse(vm.selctedWorkflowData.workflow_dates);
            formatDates(vm.clickedWorkflow);
        }

        var appPermissions = null;
        function getTaskCreatePermission() {
            vm.createTaskDisabled = true;
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                appPermissions = data.matter_apps;
                initialSetup();
            }, function () {
                initialSetup();
            });
        };

        getTaskCreatePermission();

        function changeAssignedUser(userList) {
            $timeout(function () {
                vm.createTaskDisabled = userList && userList.length > 0 ? false : true;
                enableDisableTaskFlag();
            }, 100);

        }

        function setEndTime(starttime) {
            var time = starttime.split(':');
            var timeAMPM = time[1].split(' ')[1];
            var newhour = parseInt(time[0]) + 1;
            if (newhour == 12) {
                if (timeAMPM == "PM") {
                    time[1] = time[1].replace("PM", "AM");
                }
                if (timeAMPM == "AM") {
                    time[1] = time[1].replace("AM", "PM");
                }
            }
            if (newhour == 13) {
                newhour = 1;
            }
            vm.eventInfo.end_time = ((newhour < 10) ? ('0' + newhour) : newhour) + ':' + time[1];
        }

        function enableDisableTaskFlag() {
            if (vm.eventInfo && utils.isNotEmptyVal(vm.eventInfo.roleid)) {
                vm.createTaskDisabled = false;
            } else {
                vm.createTaskDisabled = true;
            }
        }

        function setCreateTaskFlag() {
            if (angular.isDefined(appPermissions) && appPermissions != '' && appPermissions != ' ') {
                vm.eventInfo.is_task_created = (appPermissions.DefaultTaskCreation == 1) ? 1 : 0;
            } else {
                vm.eventInfo.is_task_created = 0;
            }


        }

        function init() {
            vm.eventInfo = {};
            vm.eventInfo.isEventFullday = "0";
            vm.eventInfo.start_time = '09:00';
            vm.eventInfo.end_time = '10:00';
            vm.dateFieldValue = 0;
            vm.eventInfo.beforeAfter = "Before";
            vm.eventInfo.day_type = "Calendar days";
            vm.display = {};
            vm.display.page = 'openAddEvent';
            vm.eventTypes = masterData.getEventTypes();
            setEventTypes();
            setCreateTaskFlag();
        }

        $scope.$watch(function () {
            return vm.eventInfo && vm.eventInfo.start_time;
        }, function (newStart) {
            if (newStart) {
                var time = newStart.match(/(\d+)(:(\d\d))?\s*([pa]?)/i);
                if (time[4]) {
                    vm.c_start = moment(dateUtils.parseTimeStringToDate(newStart)).format("hh:mm A");
                } else {
                    vm.c_start = moment(dateUtils.parseTimeStringToDate(newStart)).format("HH:mm");
                }
            }
        });

        $scope.$watch(function () {
            return vm.eventInfo && vm.eventInfo.end_time;
        }, function (newEnd) {
            if (newEnd) {
                var time = newEnd.match(/(\d+)(:(\d\d))?\s*([pa]?)/i);
                if (time[4]) {
                    vm.c_end = moment(dateUtils.parseTimeStringToDate(newEnd)).format("hh:mm A");
                } else {
                    vm.c_end = moment(dateUtils.parseTimeStringToDate(newEnd)).format("HH:mm");
                }
            }
        });
        function setEventTypes() {
            var finalEvents = [];
            angular.forEach(vm.eventTypes, function (eType) {
                if (eType.LabelId != 19) {
                    finalEvents.push(eType);
                }
            });
            vm.eventTypes = finalEvents;
        }
        function resetAddEventPage() {
            if (vm.mode == 'Add') {
                init();
                vm.clickedWorkflow = JSON.parse(vm.selctedWorkflowData.workflow_dates);
                formatDates(vm.clickedWorkflow);
            } else if (vm.mode == 'Edit') {
                vm.clickedWorkflow = JSON.parse(vm.selctedWorkflowData.workflow_dates);
                //formatDates(vm.clickedWorkflow);
                eventData.label_id = eventData.label_id.toString();
                eventData.name = eventData.event_title;
                vm.eventInfo = formatData(eventData);
                enableDisableTaskFlag();
                showhideDates(vm.eventInfo, vm.mode)
                formatDates(vm.clickedWorkflow);

            }
        }


        function formatDates(editData) {
            _.forEach(editData.custom, function (event) {
                if (event.id == '1') {
                    vm.eventInfo.custom_date_label1 = utils.isNotEmptyVal(event.label) ? event.label : '';
                    vm.eventInfo.custom_date1 = event.id == '1' ? "1" : 0;
                } else if (event.id == '2') {
                    vm.eventInfo.custom_date_label2 = utils.isNotEmptyVal(event.label) ? event.label : '';
                    vm.eventInfo.custom_date2 = event.id == '2' ? "1" : 0;
                }

            });


            vm.eventInfo.SOL = angular.isDefined(editData.intake_event[0]) ? utils.isNotEmptyVal(editData.intake_event[0].code) ? "1" : 0 : 0;

            _.forEach(editData.intake_specific_dates, function (event) {
                if (event.code == 'DOI') {
                    vm.eventInfo.DOI = event.code == 'DOI' ? "1" : 0;
                } else if (event.code == 'DOIn') {
                    vm.eventInfo.DOIn = event.code == 'DOIn' ? "1" : 0;
                } else if (event.code == 'MCD') {
                    vm.eventInfo.MCD = '1';
                }


            });

        }

        vm.priorities = getPriorityOptions();

        function getPriorityOptions() {
            var options = ['High', 'Normal', 'Low'];
            return options.sort();
        }

        vm.day_type = ["Calendar Days", "Business Days"];

        //function added to reset and set start_time end_time time on full day events 
        function setStartEndTime(eventInfo) {
            if (eventInfo.isEventFullday == 0) {
                eventInfo.start_time = '09:00';
                eventInfo.end_time = '10:00';
            } else {
                eventInfo.start_time = '';
                eventInfo.end_time = '';
            }
        }


        function showhideDates(event, mode) {

            var fulldayEventsIds = globalConstants.fulldayEvents;
            var isCritical = fulldayEventsIds.indexOf(parseInt(event.label_id)) > -1;
            // var isFullDayEvent = (isCritical || all_day == "1");

            vm.eventInfo.criticalDatesClicked = isCritical;
            if (vm.eventInfo.criticalDatesClicked) {
                vm.eventInfo.isEventFullday = "1";
            } else {
                vm.eventInfo.isEventFullday = vm.eventInfo.isEventFullday == "1" ? vm.eventInfo.isEventFullday.toString() : "0";
            }

            if (event.label_id == "100" || event.label_id == "19" || event.label_id == "32") {
                event.userdefined = 1;
            } else {
                event.event_title = '';
            }

        }

        function beforeDates(param) {
            vm.dateFieldValue = param;
            vm.eventInfo.beforeAfter = "Before";
        }

        function afterDates(param) {
            vm.dateFieldValue = param;
            vm.eventInfo.beforeAfter = "After";
        }



        function formatData(eventData) {
            var copyEvent = angular.copy(eventData);
            //  var postObj ={}; 
            copyEvent.day_type = copyEvent.day_type;
            copyEvent.start_time = copyEvent.start_time;
            copyEvent.end_time = copyEvent.end_time;
            vm.dateFieldValue = copyEvent.beforeAfter == "Before" ? 0 : 1;

            copyEvent.no_of_days = parseInt(copyEvent.no_of_days) < 0 ? (0 - parseInt(copyEvent.no_of_days)) : copyEvent.no_of_days;

            copyEvent.workflow_id = vm.selctedWorkflowData.workflow_id;

            copyEvent.isEventFullday = copyEvent.all_day;

            copyEvent.day_type = copyEvent.daytype == 'Calendar days' ? "Calendar days" : "Business Days";
            if (copyEvent.type == 'E' && copyEvent.ref_date_id == '1') {
                copyEvent.optionSelected = 'SOL';
            }
            if (copyEvent.type == 'M') {
                if (copyEvent.ref_date_id == '3') {
                    copyEvent.optionSelected = 'DOIn';
                } else if (copyEvent.ref_date_id == '2') {
                    copyEvent.optionSelected = 'DOI';
                }
                else if (copyEvent.ref_date_id == '1') {
                    copyEvent.optionSelected = 'MCD';
                }

            }

            if (copyEvent.type == 'C') {
                if (copyEvent.ref_date_id == '1') {
                    copyEvent.optionSelected = 'custom_date1';
                } else if (copyEvent.ref_date_id == '2') {
                    copyEvent.optionSelected = 'custom_date2';
                }

            }


            if (copyEvent.optionSelected == 'custom_date1') {
                copyEvent.type = 'C';
                if (copyEvent.optionSelected == 'custom_date1') {
                    copyEvent.ref_date_id = 1;
                }
            }

            if (utils.isNotEmptyVal(copyEvent.assigned_users_role)) {
                copyEvent.roleid = copyEvent.assigned_users_role;
            }

            return copyEvent;

        }

        function save(eventData) {
            if (eventData.roleid && eventData.roleid.length > 0) {
                eventData.assigned_users_role = eventData.roleid.toString();
            } else {
                eventData.assigned_users_role = "";
            }

            vm.mode === 'Edit' ? editEvent(eventData) : addEvent(eventData);
        }

        function addEvent(event) {
            if (event.no_of_days > 5000) {
                notificationService.error("No of days should not be grater than 5000 days");
                return;
            }

            // if (!eventsHelper.areDatesValid(event)) {
            //            notificationService.error("end_time date time is before start_time date time");
            //    return;                
            // }    
            var postEventData = getPostEventData(event);
            intakeaddEventDatalayer.addEvent(postEventData)
                .then(function (response) {
                    notificationService.success("Event added successfully");
                    vm.display.page = 'closeAddEditEvent';
                    // $modalInstance.close();
                }, function (error) {
                    notificationService.error("Unable to save event");
                });

        }

        function editEvent(event) {
            if (event.no_of_days > 5000) {
                notificationService.error("No of days should not be grater than 5000 days");
                return;
            }
            // if (!eventsHelper.areDatesValid(event)) {
            //            notificationService.error("end_time date time is before start_time date time");
            //    return;                
            // } 
            var postEventData = getPostEventData(event);
            intakeaddEventDatalayer.editEvent(postEventData)
                .then(function (response) {
                    notificationService.success("Event Edited successfully");
                    vm.display.page = 'closeAddEditEvent';
                    // $modalInstance.close();
                }, function (error) {
                    notificationService.error("Unable to save event");
                });

        }

        function getPostEventData(event) {
            var copyEvent = angular.copy(event);
            var postObj = {};
            copyEvent.description = utils.isNotEmptyVal(copyEvent.description) ? copyEvent.description : '';
            copyEvent.location = utils.isNotEmptyVal(copyEvent.location) ? copyEvent.location : '';
            copyEvent.day_type = copyEvent.day_type[0] == 'B' ? 'W' : copyEvent.day_type[0];
            copyEvent.no_of_days = vm.dateFieldValue == 1 ? copyEvent.no_of_days : (0 - parseInt(copyEvent.no_of_days));
            copyEvent.workflow_id = vm.selctedWorkflowData.workflow_id;
            if (copyEvent.optionSelected == 'custom_date1' || copyEvent.optionSelected == 'custom_date2') {
                copyEvent.type = 'C';
                if (copyEvent.optionSelected == 'custom_date1') {
                    copyEvent.ref_date_id = 1;
                } else {
                    copyEvent.ref_date_id = 2;
                }
            }
            if (copyEvent.optionSelected == 'SOL') {
                copyEvent.type = 'E';
                // copyEvent.type = 'M';
                if (copyEvent.optionSelected == 'SOL') {
                    copyEvent.ref_date_id = 1;
                }
            }
            if (copyEvent.optionSelected == 'DOI' || copyEvent.optionSelected == 'MCD' || copyEvent.optionSelected == 'DOIn') {
                copyEvent.type = 'M';
                if (copyEvent.optionSelected == 'DOIn') {
                    copyEvent.ref_date_id = 3;
                } else if (copyEvent.optionSelected == 'DOI') {
                    copyEvent.ref_date_id = 2;
                } else if (copyEvent.optionSelected == 'MCD') {
                    copyEvent.ref_date_id = 1;
                }
            }

            copyEvent.all_day = copyEvent.isEventFullday;
            if (copyEvent.all_day == 0) {
                copyEvent.start_time = copyEvent.start_time;
                copyEvent.end_time = copyEvent.end_time;
            } else {
                copyEvent.start_time = '';
                copyEvent.end_time = '';
            }

            var selectEvent = _.find(vm.eventTypes, function (event) {
                return event.LabelId === copyEvent.label_id;
            });
            copyEvent.event_title = (copyEvent.event_title) ? copyEvent.event_title : "";
            copyEvent.event_title = (selectEvent.LabelId === "19") || (selectEvent.LabelId === "100") || (selectEvent.LabelId === "32") ? copyEvent.event_title : selectEvent.Name;
            return copyEvent;
        }

        function cancel() {
            vm.display.page = 'closeAddEditEvent';
        }

    }

})(angular);

(function (angular) {

    'use strict';

    angular.module('intake.workflow')
        .factory('intakeaddEventDatalayer', intakeaddEventDatalayer);

    intakeaddEventDatalayer.$inject = ['$http', 'globalConstants'];
    function intakeaddEventDatalayer($http, globalConstants) {

        var urls = {
            editEvent: globalConstants.intakeServiceBaseV2 + 'workflow_template/event/',
            addEvent: globalConstants.intakeServiceBaseV2 + 'workflow_template/event',

        };

        return {
            editEvent: _editEvent,
            addEvent: _addEvent,

        };


        function _editEvent(eventData) {
            var url = urls.editEvent + eventData.workflow_event_id;
            return $http.put(url, eventData);
        }

        function _addEvent(eventData) {
            var url = urls.addEvent;
            return $http.post(url, eventData);
        }

    }

})(angular);
