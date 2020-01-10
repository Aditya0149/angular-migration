(function () {

    'use strict';

    angular
        .module('intake.calendar')
        .controller('IntakeCalendarEventCtrl', IntakeCalendarEventCtrl);

    IntakeCalendarEventCtrl.$inject = ['$scope', '$state', '$timeout', 'masterData', 'intakeNotesDataService',
        'IntakeCalendarEventHelper', 'globalConstants', 'contactFactory', 'intakeEventsDataService', 'notification-service', 'intakeFactory', 'intakeEventCronologyHelper', 'modalService', 'intakeTaskSummaryDataLayer', 'practiceAndBillingDataLayer', 'intakeEventsHelper', '$rootScope'];

    function IntakeCalendarEventCtrl($scope, $state, $timeout, masterData, intakeNotesDataService, IntakeCalendarEventHelper, globalConstants, contactFactory, intakeEventsDataService, notificationService, intakeFactory, intakeEventCronologyHelper, modalService, intakeTaskSummaryDataLayer, practiceAndBillingDataLayer, intakeEventsHelper, $rootScope) {

        var self = this;
        var pageMode;
        var intake_event_id = $scope.calendar.intake_event_id;
        var catId = $scope.calendar.filters.filterby;
        var allEventData;
        var intake_id = $scope.calendar.intake_id;
        var matters = [];

        self.editEvent = editEvent;
        self.open = openCalender;
        self.saveCalendarEvent = saveCalendarEvent;
        self.cancel = cancelCalendarEvent;
        self.selectTime = globalConstants.timeArray;
        self.showhideDates = showhideDates;
        self.resetPrivate = resetPrivate;
        self.getFormattedDateString = getFormattedDateString;
        self.getFormattedEndDateString = getFormattedEndDateString;
        self.delete = deleteEvent;
        self.addNewEvent = addNewEvent;
        self.dateClicked = $scope.calendar.dateClicked;
        self.daySelected = $scope.calendar.selectedDateToAdd;
        self.searchMatters = searchMatters;
        self.addAssignedUser = addAssignedUser;//Function to add Assigned users
        self.removeAssignedUser = removeAssignedUser;//Function to remove Assigned Users
        self.formatTypeaheadDisplay = formatTypeaheadDisplay;
        self.setEndDateForFullDay = setEndDateForFullDay;
        self.validateEvent = validateEvent;
        self.disableReminder = IntakeCalendarEventHelper.disableReminder;
        self.goToMatter = goToMatter;
        self.isDatesValid = isDatesValid;
        self.setEndTime = setEndTime;
        self.getcourtAddress = getcourtAddress;
        self.setLocation = setLocation;//pointer to setLocation function
        self.cMessengerCheck = cMessengerCheck;
        //US#4713 disable add edit delete 
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        //US#5678-  page filters for event history grid data
        self.eventHistoryData = [];
        var pageNumber = 1;
        var pageSize = 50;
        self.exportEventHistory = exportEventHistory;//US#5678-download event history
        self.resetEdit = resetEdit;
        self.resetAdd = resetAdd;
        self.calDays = calDays;
        self.searchUsers = searchUsers;
        self.assignedToUserList = [];
        self.userSelectedType = [{ id: 1, name: 'Assigned to Intake' }, { id: 2, name: 'All Users' }, { id: 3, name: 'Select User' }];
        (function () {
            init();

        })();

        function init() {
            self.cancelFlag = false;
            //   self.dateFlag = false;

            self.form = {};
            self.display = {};
            self.category = [];
            self.calendarEvent = {};
            self.dataAfterCancel = '';
            self.calendarEvent.assignedUsers = [];

            if (utils.isNotEmptyVal($scope.calendar.editCalendarEvent)) {
                self.editCalendarEvent = $scope.calendar.editCalendarEvent;
            } else {
                self.editCalendarEvent = false;
            }
            // Get Users List for Assigning Event to Users

            getUsersList();
        }

        function cMessengerCheck() {
            if (!($rootScope.isSmsActiveUI)) {
                notificationService.error("To set SMS event reminders, please subscribe to Client Messenger in the Marketplace.");
            }
        }

        self.setUserRadioButton = function () {
            if (utils.isEmptyVal(self.taskInfo.intake_id) && (self.calendarEvent.label_id == 19 || self.calendarEvent.label_id == 100 || self.calendarEvent.label_id == 32) && self.calendarEvent.reminder_users == "intake") {
                self.calendarEvent.reminder_users = "all";
                self.userSelectedMode = 2;
            }
        }

        function setEventTypes() {
            var finalEvents = [];
            angular.forEach(self.eventTypes, function (eType) {
                if (eType.LabelId != 19) {
                    finalEvents.push(eType);
                }
            });
            self.eventTypes = finalEvents;
        }

        var appPermissions = null;
        function getTaskCreatePermission() {
            self.createTaskDisabled = true;
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                appPermissions = data.matter_apps;
                init();
            }, function () {
                init();
            });
        };

        getTaskCreatePermission();

        function calDays(event) {
            var fulldayEventsIds = globalConstants.fulldayEvents;
            var isFullDayEvent = fulldayEventsIds.indexOf(parseInt(event.label_id)) > -1;
            if (!isFullDayEvent) {
                if (utils.isNotEmptyVal(event.start_date) && utils.isNotEmptyVal(event.end_date)) {
                    var start = moment(event.start_date).unix();
                    start = moment.unix(start);
                    var end = moment(event.end_date).unix();
                    end = moment.unix(end);
                    if (end.diff(start, 'days', true) > 0) {
                        self.calendarEvent.all_day = 1;
                        self.calendarEvent.disableFullDay = true;
                    } else {
                        self.calendarEvent.all_day = 0;
                        self.calendarEvent.disableFullDay = false;
                    }
                }
            }
        }


        //US#8328 For set default value of Remind Me in Days:
        self.reminderDaysList = angular.copy(globalConstants.reminderDaysList);
        self.setReminderDaysList = setReminderDaysList;
        function setReminderDaysList(event) {
            if (event == 1) {
                self.reminderDaysList = angular.copy(globalConstants.SOLReminderDaysList);
            } else if (event != 1) {
                self.reminderDaysList = angular.copy(globalConstants.reminderDaysList);
            }
        }


        /** US-5214 function to get court address to Location field*/
        function getcourtAddress(intakeId, intake_event_id) {
            if (utils.isEmptyVal(intakeId) && intake_event_id == 19 && self.calendarEvent.reminder_users == "intake") {
                self.calendarEvent.reminder_users = "all";
                self.userSelectedMode = 2;
            }
            /** if event type is  'Trial dates' or 
               'Court Apperarance' & page mode is add **/
            if ((intake_event_id == '12' || intake_event_id == '14' || intake_event_id == '23') && (pageMode == 'add')) {
                if (!(isNaN(parseInt(intakeId)))) {//check whether it is valid matter id
                    intakeFactory.getMatterOverview(intakeId)
                        .then(function (response) {
                            var data = response.data.matter_info[0];
                            // format court address    
                            self.courtAddress = utils.isNotEmptyVal(data.mattercourt) ?
                                data.mattercourt + ', ' : '';
                            self.courtAddress += utils.isNotEmptyVal(data.street) ?
                                data.street + ', ' : '';
                            self.courtAddress += utils.isNotEmptyVal(data.city) ?
                                data.city + ', ' : '';
                            self.courtAddress += utils.isNotEmptyVal(data.state) ?
                                data.state : '';
                            //set court Address to Location field when user selects a matter
                            setLocation(self.calendarEvent.label_id);
                        }, function (error) {

                        });
                }
            }
            /** if event type is other than 'Trial dates' or 
               'Court Apperarance' & page mode is add **/
            else if (pageMode == 'add') {
                setLocation(self.calendarEvent.label_id);
            }
            //setReminderDaysList(intake_event_id);
        }

        /** US-5214 function to auto populate court address to Location 
            field when event type is 'Trial ','Court Appearance' & 'Motion'*/
        function setLocation(intake_event_id) {
            if ((intake_event_id == '12' || intake_event_id == '14' || intake_event_id == '23') && (pageMode == 'add')) {
                self.calendarEvent.location = self.courtAddress;
            }
            else if (pageMode == 'add') {
                self.calendarEvent.location = '';
            }
        }


        /*function to autoupdate end time to one hour when start time is selected */
        function setEndTime(starttime) {
            var time = starttime.split(':');
            var newhour = parseInt(time[0]) + 1;
            self.calendarEvent.end = ((newhour < 10) ? ('0' + newhour) : newhour) + ':' + time[1];
        }
    
        /*function to validate dates entered*/
        // glbevecustomDateDatedivErr
        function isDatesValid() {
            if ($('#glbevestartDateErr').css("display") == "block" ||
                $('#glbeveendDateErr').css("display") == "block" || $('#glbevecustomDateDatedivErrForSMS').css("display") == "block" || $('#glbevecustomDateDatedivErr').css("display") == "block") {
                return true;
            }
            else {
                return false;
            }
        }


        function validateEvent(matter_id, eventType) {
            //if event is Other, then matter name is compulsary
            //for New event in other category
            if (pageMode == 'add') {
                if (eventType != '19') { // if type is personal
                    return (isNaN(parseInt(matter_id)) || utils.isEmptyVal(eventType)); //if matter is not mentioned disable
                } else if (parseInt(eventType) == 19) { // if personal event matter is not required
                    return false;
                }
            } else if (pageMode == 'edit') {
                if (eventType != '19') {
                    return (isNaN(parseInt(matter_id)) || utils.isEmptyVal(eventType)); //if matter is not mentioned disable
                } else { return false; }
            }
        }

        function searchMatters(intakeName, migrate) {
            return intakeNotesDataService.getMatterList(intakeName, migrate)
                .then(function (response) {
                    matters = response;
                    self.calendarEvent.sms_contact_ids = [];
                    return response;
                });
        }
        //Function to add Assigned users
        function addAssignedUser(userList) {
            self.calendarEvent.assign_to = userList;
            self.createTaskDisabled = self.calendarEvent.assign_to && self.calendarEvent.assign_to.length > 0 ? false : true;
        }

        function setCreateTaskFlag() {
            if (angular.isDefined(appPermissions) && appPermissions != '' && appPermissions != ' ' && appPermissions != null) {
                self.calendarEvent.is_task_created = (appPermissions.DefaultTaskCreation == 1) ? 1 : 0;
            } else {
                self.calendarEvent.is_task_created = 0;
            }
        }

        function enableDisableTaskFlag() {
            if (self.calendarEvent.assign_to && self.calendarEvent.assign_to.length > 0) {
                self.createTaskDisabled = false;
            } else {
                self.createTaskDisabled = true;
            }
        }
        //Function to remove Assigned Users
        function removeAssignedUser(userList) {
            self.calendarEvent.assign_to = userList;
            self.createTaskDisabled = self.calendarEvent.assign_to && self.calendarEvent.assign_to.length > 0 ? false : true;
            pageMode === 'edit' ? searchUsers() : angular.noop();
        }

        function getUsersList() {
            intakeTaskSummaryDataLayer.getAssignedUserData()
                .then(function (response) {
                    self.assignedToUserList = response;
                    self.users = response;
                    if (!self.editCalendarEvent) {
                        addNewEvent();
                    } else {
                        var categoryCheck = catId == 'personalevent' ? '?is_personal=1' : '';
                        intakeEventsDataService
                            .getSingleEvent(intake_event_id, categoryCheck)
                            .then(function (events) {
                                events.data.reminder_days = (events.data.reminder_days).split(",");
                                events.data.sms_reminder_days = events.data.sms_reminder_days ? (events.data.sms_reminder_days).split(",") : [];
                                events.data.sms_contact_ids = events.data.sms_contact.length > 0 ? _.pluck(events.data.sms_contact, 'contact_id') : [];
                                if (events.data.sms_contact.length > 0) {
                                    _.forEach(events.data.sms_contact, function (item) {
                                        item.firstname = item.first_name;
                                        item.lastname = item.last_name;
                                        item.name = item.first_name + " " + item.last_name;
                                        item.contactid = item.contact_id;
                                    })
                                }
                                self.contactList1 = [];
                                self.contactList1 = events.data.sms_contact;
                                allEventData = events.data;
                                convert(allEventData);
                                setReminderDaysList(allEventData.label_id);
                            });
                    }
                    self.category = angular.copy(masterData.getEventTypes());
                    self.eventTypes = angular.copy(masterData.getEventTypes());
                    setEventTypes();
                });
        }

        function formatTypeaheadDisplay(intake) {
            self.contactList1 = [];
            if (angular.isUndefined(intake) || utils.isEmptyString(intake)) {
                return undefined;
            }
            self.intake_details = {};
            self.intake_details = angular.copy(intake);

            intakeFactory.getPlaintiffByIntake(intake.intakeId)
                .then(function (response) {
                    var data = response[0].contact;
                    intakeFactory.getOtherDetails(intake.intakeId)
                        .then(function (res) {
                            var otherDetailsInfo = utils.isNotEmptyVal(res) ? JSON.parse(res[0].detailsJson) : null;
                            var list = intakeEventsHelper.setContactList(data, self.intake_details.intakeSubType, otherDetailsInfo,response)
                            self.contactList1 = _.unique(list, 'contactid');
                        });
                })

            return intake.intakeName + intake.dateIntake;
        }

        // prepare dates to display on the UI, when opening add/edit window
        function setEventObject(event) {
            IntakeCalendarEventHelper.setEventObject(pageMode, event, self.dateClicked, self.daySelected);
            if (pageMode == 'add') {
                var user = { id: 1 };
                self.setUserMode(user);
            } else {
                getEventRemindUser(event);
            }

        }


        //function to delete events us#7393
        function deleteEvent(selectedEvent) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {


                intakeEventsDataService.deleteEvent(selectedEvent.intake_event_id)
                    .then(function () {
                        notificationService.success('Event deleted successfully!');
                        cancelCalendarEvent();
                    }, function (rejectReason) {
                        //alert("unable to delete");
                        if (rejectReason.status == 400) {
                            notificationService.error('Event has not been deleted!');
                        } else {
                            notificationService.error('An error occurred. Please try later.');
                        }

                    });
            });
        }



        //function to go on sepecific matter 
        function goToMatter(intakeId) {
            $state.go('intake-overview', { intakeId: intakeId }, { reload: true });
        }

        //event handlers
        function openCalender($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            self.calendarEvent[isOpened] = true; //isOpened is a string specifying the model name
        };

        function singleEvent(calEvent, fetchHistory) {
            if (fetchHistory) {
                getEventHistoryData(calEvent.intake_event_id);
                getEventRemindUser(calEvent);
            }

            if (intake_event_id == calEvent.intake_event_id) {

                if (self.cancelFlag) {
                    calEvent = self.dataAfterCancel;
                }

                if (calEvent.all_day == '1') {
                    if (IntakeCalendarEventHelper.isValidDateRange(calEvent.start_date, calEvent.end_date)) {
                        var start = calEvent.start_date, end = calEvent.end_date;
                        calEvent.start_date = IntakeCalendarEventHelper.setFulldayTime(calEvent.start_date, 'start');
                        calEvent.end_date = (start === end) ?
                            calEvent.start_date :
                            IntakeCalendarEventHelper.setFulldayTime(calEvent.end_date, 'end');
                    }
                }

                self.dataAfterCancel = calEvent;
                if (calEvent.label_id == 100) {
                    calEvent.name = 'Other';
                } else if (calEvent.label_id == 19) {
                    calEvent.name = 'Personal Event';
                } else if (calEvent.label_id == 32) {
                    calEvent.name = 'Deadline';
                } else {
                    calEvent.name = calEvent.event_title;
                }
                calEvent.intake_event_id = calEvent.intake_event_id;
                var start = calEvent.start_date;
                start = utils.convertUTCtoDate(start);
                calEvent.start = start;
                var end = calEvent.end_date;
                end = utils.convertUTCtoDate(end);
                calEvent.end = end;
                calEvent.allDay = calEvent.all_day == '1';
                if (calEvent.custom_reminder) {
                    var customDate = calEvent.custom_reminder;
                    customDate = moment.unix(customDate).utc().format('MM-DD-YYYY');
                    calEvent.custom_reminder = customDate;
                }
                if (calEvent.sms_custom_reminder) {
                    var customDate = calEvent.sms_custom_reminder;
                    customDate = moment.unix(customDate).utc().format('MM-DD-YYYY');
                    calEvent.sms_custom_reminder = customDate;
                }

                self.assignedUsers = calEvent.assign_to;

                //disable dragging for critical events for staff

                // calEvent.editable = !(globalConstants.fulldayEvents.indexOf(parseInt(calEvent.label_id)) !== -1
                self.userSelectedMode = calEvent.reminder_users_id;
                self.eventClickDetails = calEvent;
                self.assigned_to_name = utils.isEmptyVal(self.eventClickDetails.assign_to) ? '' : _.pluck(self.eventClickDetails.assign_to, 'fullName').join(', ');
                self.existingEvent = angular.copy(calEvent);
                // self.dateFlag = true;
            }
        }

        //get event history of selected event
        function getEventHistoryData(intake_event_id) {

            intakeEventsDataService.getEventHistory(intake_event_id, pageNumber, pageSize)
                .then(function (response) {
                    self.eventHistoryData = response.data;
                    self.allDataFromMaster = masterData.getMasterData();
                    if (utils.isEmptyObj(self.allDataFromMaster)) {
                        var request = masterData.fetchMasterData();
                        $q.all([request]).then(function (values) {
                            self.allDataFromMaster = masterData.getMasterData();
                            setReason();
                        })
                    } else {
                        setReason();
                    }

                }, function (error) {
                    notificationService.error("Event history not loaded")
                })

        }

        function setReason() {
            _.forEach(self.eventHistoryData, function (data) {
                _.forEach(self.allDataFromMaster.event_reschedule_reason, function (item) {
                    if (data.reason == '0') {
                        data.reason = '-';
                    } else {
                        if (data.reason == item.reason_order) {
                            data.reason = item.reason_name;
                        }
                    }
                })
            });
        }

        //download event history data
        function exportEventHistory(eventHistory) {
            intakeEventsDataService.downloadEventHistory(self.eventClickDetails.intake_event_id)
                .then(function (response) {
                    var filename = "Event_history";
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

        function convert(event) {
            if (utils.isEmptyVal(event)) {
                return;
            }

            singleEvent(event, true);
        };

        function saveCalendarEvent(event) {
            var oldDate = moment(event.start_date).year();
            if (oldDate < 1970) {
                notificationService.error("Not Acceptable: Start or End date can not be negative");
                return;
            };

            intake_id = utils.isNotEmptyVal(self.taskInfo && self.taskInfo.intake) ? self.taskInfo.intake.intakeId : null;
            if (!intake_id) {
                notificationService.error("Invalid intake name selected");
                return;
            }

            if (event.reminder_users != "all" && event.reminder_users != "intake") {
                if (event.reminder_users != null && event.reminder_users.length > 0) {
                } else {
                    notificationService.error("Please select at least one remind user");
                    return;
                }

            }
            //validate the custom reminder date before saving event
            if (event.custom_reminder) {
                var endDate = moment(new Date(event.end_date)).utc();
                var customDateReminder = moment(new Date(event.custom_reminder)).utc();
                if (endDate.isBefore(customDateReminder)) {
                    notificationService.error('The custom reminder date should not be greater than event date');
                    return;
                }
            }

            if (event.sms_custom_reminder) {
                var endDate = moment(new Date(event.end_date)).utc();
                var customDateReminder = moment(new Date(event.sms_custom_reminder)).utc();
                if (endDate.isBefore(customDateReminder)) {
                    notificationService.error('The custom reminder date should not be greater than event date');
                    return;
                }
            }

            if (event.remindMe) {
                var start = moment(new Date(event.start_date)).utc();
                var reminder = moment(new Date(event.reminder_datetime)).utc();
                if (reminder.isAfter(start)) {
                    notificationService.error('Reminder date can not be greater than start date');
                    return;
                }
            }
            event.is_task_created = (!utils.isEmptyObj(self.taskInfo) && utils.isNotEmptyVal(self.taskInfo.intake.intakeId) && event.assign_to && event.assign_to.length > 0) ? parseInt(event.is_task_created) : 0;
            var newEvent = angular.copy(event);
            //US#3119- Check For existing events ... Start
            if (newEvent.reminder_days != null) {
                newEvent.reminder_days = angular.isDefined(newEvent.reminder_days) ? newEvent.reminder_days.toString() : '';
            }
            else {
                newEvent.reminder_days = '';
            }
            if (newEvent.sms_reminder_days != null) {
                newEvent.sms_reminder_days = angular.isDefined(newEvent.sms_reminder_days) ? newEvent.sms_reminder_days.toString() : '';
            }
            else {
                newEvent.sms_reminder_days = '';
            }
            newEvent.event_title = (newEvent.event_title) ? newEvent.event_title : "";
            newEvent.intake_id = utils.isNotEmptyVal(intake_id) ? intake_id : '0';

            IntakeCalendarEventHelper.setEventTitle(newEvent, self.category);
            IntakeCalendarEventHelper.setDates(newEvent); // set dates

            if (!IntakeCalendarEventHelper.areDatesValid(newEvent)) {
                notificationService.error("End date time is before Start date time");
                return;
            }

            // US#5678- If event details are updated, then before saving event need to   // capture event update comments from user
            // For that pop up is provided with input field where user can enter comment
            // Then event will save
            if (pageMode === 'edit') {
                // set event obj to check event update
                // remove the reference from prototype to avoid conflict
                var oldDate = moment(event.start_date).year();
                if (oldDate < 1970) {
                    notificationService.error("Not Acceptable: Start or End date can not be negative");
                    return;
                };
                var evtUpdatedObj = angular.copy(newEvent);
                var existingEvent = angular.copy(self.existingEvent);

                intakeEventCronologyHelper.setUpdatedCalEvent(existingEvent, evtUpdatedObj);

                if (intakeEventCronologyHelper.isEventUpdated(existingEvent, evtUpdatedObj)) {
                    if (
                        ((existingEvent.all_day != evtUpdatedObj.all_day)
                            || existingEvent.start_date != moment(evtUpdatedObj.start_date) || existingEvent.end_date != moment(evtUpdatedObj.end_date)
                            || existingEvent.start != evtUpdatedObj.start || existingEvent.end != evtUpdatedObj.end

                        )
                    ) {
                        self.checkReason = true;
                    } else {
                        self.checkReason = false;
                    }

                    //US#8707 : Show popup only for date/time change
                    if (self.checkReason == true) {
                        var modalInstance = intakeEventCronologyHelper.openEventRemarkPopup(self.checkReason);

                        modalInstance.result.then(function (response) {
                            //set event update remark from user input on  event obj that we are saving
                            newEvent.comments = response.updateRemark;
                            newEvent.reason = (utils.isEmptyVal(response.rescheduleId)) ? '' : response.rescheduleId;

                            // save event  
                            newEvent.intake_event_id = intake_event_id;
                            editEvents(newEvent);

                        }, function (error) {
                            notificationService.error('Could not save event..');
                        });
                    } else {
                        newEvent.comments = "";
                        // save event  
                        newEvent.intake_event_id = intake_event_id;
                        editEvents(newEvent);
                    }
                }
                else {
                    newEvent.comments = "";
                    // save event  
                    newEvent.intake_event_id = intake_event_id;
                    editEvents(newEvent);
                }
            }
            else {
                // set default value for update comments if no updates are there
                newEvent.comments = "";

                // save event
                newEvent.intake_event_id = '';
                saveEvents(newEvent);
            }
        }

        function editEvents(event) {

            event.start_date = angular.copy(event.start);
            event.end_date = angular.copy(event.end);
            event.label_id = parseInt(event.label_id);
            if (event.label_id == 100 || event.label_id == 19 || event.label_id == 32) {
                event.event_title = (event.event_title) ? event.event_title : "";
            } else {
                event.event_title = "";
            }
            var eventData = angular.copy(event);
            var RecordData = {
                label_id: eventData.label_id,
                custom_reminder: event.custom_reminder,
                sms_custom_reminder: event.sms_custom_reminder,
                event_title: eventData.event_title,
                intake_event_id: eventData.intake_event_id,
                all_day: eventData.all_day,
                start_date: eventData.start_date,
                end_date: eventData.end_date,
                is_private: eventData.is_private,
                location: eventData.location,
                description: eventData.description,
                intake_id: eventData.intake_id,
                comments: eventData.comments,
                is_comply: eventData.is_comply,
                userId: eventData.userId,
                assigned_to: _.pluck(self.assignedUsers, "userId"),
                assigned_taskid: eventData.assigned_taskid,
                reason: eventData.reason,
                reminder_days: (event.reminder_days) ? (event.reminder_days).toString() : "",
                sms_reminder_days: (event.sms_reminder_days) ? (event.sms_reminder_days).toString() : "",
                remind_date: event.remind_date,
                reminder_users_id: self.userSelectedMode,
                reminder_users: (event.reminder_users) ? (event.reminder_users).toString() : "",
                sms_contact_ids: (event.sms_contact_ids) ? (event.sms_contact_ids).toString() : "",
                is_task_created: event.is_task_created,
            }

            intakeEventsDataService.updateEvent(RecordData.intake_event_id, RecordData)
                .then(function (data) {
                    if (data.status == 400) {
                        notificationService.error('Event has not been updated!');
                    } else {
                        notificationService.success('Event updated successfully!');
                    }
                    self.successData = eventData;
                    $scope.calendar.goToCalendar();
                }, function () {
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function saveEvents(event) {
            event.label_id = parseInt(event.label_id);
            if (event.label_id == 100 || event.label_id == 19 || event.label_id == 32) {
                event.event_title = (event.event_title) ? event.event_title : "";
            } else {
                event.event_title = "";
            }
            var eventCopy = angular.copy(event);
            var recordData = {
                label_id: eventCopy.label_id,
                custom_reminder: event.custom_reminder,
                sms_custom_reminder: event.sms_custom_reminder,
                event_title: eventCopy.event_title,
                end_date: eventCopy.end,
                start_date: eventCopy.start,
                intake_id: eventCopy.intake_id.toString(),
                assigned_to: _.pluck(self.assignedUsers, "userId"),
                all_day: eventCopy.all_day,
                is_private: eventCopy.is_private,
                location: eventCopy.location,
                description: eventCopy.description ? eventCopy.description : '',
                is_comply: eventCopy.is_comply,
                reminder_days: (event.reminder_days) ? (event.reminder_days).toString() : "",
                sms_reminder_days: (event.sms_reminder_days) ? (event.sms_reminder_days).toString() : "",
                remind_date: event.remind_date,
                reminder_users_id: self.userSelectedMode,
                reminder_users: (event.reminder_users) ? (event.reminder_users).toString() : "",
                sms_contact_ids: (event.sms_contact_ids) ? (event.sms_contact_ids).toString() : "",
                is_task_created: event.is_task_created,
            }
            intakeEventsDataService.addEvent(recordData)
                .then(function (data) {
                    if (data.status == 400) {
                        notificationService.error('Event has not been updated!');
                    } else {
                        notificationService.success('Event added successfully!');
                    }
                    self.successData = eventCopy;
                    $scope.calendar.goToCalendar();
                }, function () {
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function cancelCalendarEvent() {
            self.editCalendarEvent = false;
            self.cancelFlag = true;
            $scope.calendar.goToCalendar();
            convert(allEventData);
        }


        function resetPrivate() {
            self.calendarEvent.is_private = 0;
        }

        // show hide date selectore based on label type
        function showhideDates(event, mode, calledFromUI) {
            // mode = mode ? mode : pageMode;
            IntakeCalendarEventHelper.showhideDates(event, mode);
            self.eventNameCheck = event.name; // for personal category disable
            setReminderDaysList(self.calendarEvent.label_id);
            if (event.label_id == '1' && !event.start_date) {
                event.start_date = new Date(event.start_date)
                getFormattedDateString(event);
            }

            if (calledFromUI) {
                self.calendarEvent.disableFullDay = false;
                if (moment.isDate(event.utcstart)) {
                    event.end_date = utils.getFormattedDateString(event.start_date);
                } else {
                    event.end_date = utils.getFormattedDateString(new Date(event.start_date));
                }
            }
        }

        // get formatter string
        function getFormattedDateString(event) {
            var datestring = $('#glbevestartDatediv').val();
            if (moment(datestring, "MM/DD/YYYY", true).isValid()) {
                event.end_date = utils.getFormattedDateString(event.start_date);
                event.start_date = utils.getFormattedDateString(event.start_date);
            }
        }

        function getFormattedEndDateString(event, datediv) {
            var datestring = $('#glbeveendDatediv').val();
            if (moment(datestring, "MM/DD/YYYY", true).isValid()) {
                event.end_date = utils.getFormattedDateString(event.end_date);
            }

        }


        function addNewEvent() {
            $timeout(function () {
                self.pageMode = 'add';
                pageMode = 'add';
                self.editCalendarEvent = false;
                var event = {};
                self.addNewEventFlag = true;
                editEvent(pageMode, event);
            }, 100);
        }

        function editEvent(mode, data) {
            //set global reset callback
            if (mode === 'edit') {
                searchUsers();
                data.is_task_created = data.is_task_created ? parseInt(data.is_task_created) : 0;
                self.createTaskDisabled = data.assign_to && data.assign_to.length > 0 ? false : true;
            }
            $timeout(function () {
                editEvnt(mode, data);
            }, 100);

        }

        function searchUsers() {
            intakeTaskSummaryDataLayer.getAssignedUserData()
                .then(function (data) {
                    self.assignedToUserList = data
                    var sample = [];
                    _.forEach(self.assignedToUserList, function (data) {
                        _.forEach(self.assignedUsers, function (item) {
                            if (item.userId == data.userId) {
                                sample.push(data);
                            }
                        })
                    })
                    self.assignedToUserList = _.difference(self.assignedToUserList, sample);
                }, function (err) {
                    console.log(err);
                });
        }

        function editEvnt(mode, data) {
            matters = angular.copy(matters);
            if (data.label_id) {
                data.label_id = data.label_id.toString();
            }
            self.editCalendarEvent = false;
            intake_id = data.intake_id;
            self.pageMode = mode;
            pageMode = self.pageMode;
            self.dataAfterCancel = angular.copy(data);

            //set datepicker options
            self.dateFormat = 'MM/dd/yyyy';
            self.datepickerOptions = {
                formatYear: 'yyyy',
                startingDay: 1,
                'show-weeks': false
            };

            self.calendarEvent = angular.copy(data);
            if (self.pageMode !== 'edit') {
                setCreateTaskFlag();
            }

            enableDisableTaskFlag();
            if (self.pageMode !== 'edit') {
                self.calendarEvent.reminder_days = ['0'];
                self.calendarEvent.sms_reminder_days = ['0'];
            }
            _.forEach(data.assign_to, function (usr, iserIndex) {
                usr.uid = usr.userId;
                usr.name = usr.uname;
                usr.fname = usr.fullName;
            });
            self.assignedUsers = data.assign_to;
            if (utils.isNotEmptyVal(self.calendarEvent.intake_id)) {
                self.taskInfo = {};
                self.calendarEvent.intake = {
                    intake_name: self.calendarEvent.intake_name,
                    intake_id: self.calendarEvent.intake_id,
                    intakeName: self.calendarEvent.intake_name,
                    intakeId: self.calendarEvent.intake_id,
                    dateIntake: self.calendarEvent.date_of_intake ? " - " + moment.unix(self.calendarEvent.date_of_intake).utc().format('MM/DD/YYYY') : "",
                    intakeSubType : {
                        intakeTypeId: self.calendarEvent.intake_type.id,
                        intakeSubTypeId: self.calendarEvent.intake_type.intakeSubType[0].id
                    }
                };
                self.taskInfo.intake = self.calendarEvent.intake;
                self.taskInfo.intake_id = self.calendarEvent.intake_id;
                var matterObj = {
                    intake_name: self.calendarEvent.intake_name,
                    intake_id: self.calendarEvent.intake_id,
                    intakeName: self.calendarEvent.intake_name,
                    intakeId: self.calendarEvent.intake_id,
                    dateIntake: self.calendarEvent.date_of_intake ? " - " + moment.unix(self.calendarEvent.date_of_intake).utc().format('MM/DD/YYYY') : ""
                };
                //push the matter obj in matters array for typeahead formatter
                matters.push(matterObj);
            }

            showhideDates(self.calendarEvent, mode);
            setEventObject(self.calendarEvent);
            if (self.pageMode == 'edit' && utils.isNotEmptyVal(self.calendarEvent.start_date) && utils.isNotEmptyVal(self.calendarEvent.end_date)) {
                var start = moment(self.calendarEvent.start_date).startOf("day").unix();
                start = moment.unix(start);
                var end = moment(self.calendarEvent.end_date).startOf("day").unix();
                end = moment.unix(end);
                if (end.diff(start, 'days', true) > 0) {
                    self.calendarEvent.disableFullDay = true;
                } else {
                    self.calendarEvent.disableFullDay = false;
                }
            }
        }

        function resetAdd() {
            $("input[name='intake_id']").val("");
            angular.isDefined(self.taskInfo) ? self.taskInfo.intake = '' : angular.noop();
            self.calendarEvent = {};
            self.assignedUsers = [];
            setEventObject(self.calendarEvent);
            self.calendarEvent.reminder_days = ['0'];
            self.calendarEvent.sms_reminder_days = ['0'];

        }

        function resetEdit() {
            editEvnt('edit', self.eventClickDetails);
        }

        function setEndDateForFullDay(isFullDay, event) {
            event.end_date = isFullDay == "1" ? event.start_date : event.end_date;
            if (isFullDay != "1") {
                event.start = '09:00';
                event.end = '10:00';
            }

        }
        //US#8558 Event & Task reminder to matter users or all users
        function getEventRemindUser(event) {
            if (utils.isEmptyVal(event)) { return }
            if (event.reminder_users == "intake") {
                event.reminder_users_id = 1;
            } else if (event.reminder_users == "all") {
                event.reminder_users_id = 2;
            } else if (JSON.parse(event.reminder_users) instanceof Array) {

                event.reminder_users = JSON.parse(event.reminder_users).map(Number);
                // self.users = [];
                event.reminder_users_id = 3;
            }
            event.reminder_users_temp = [];
            if (angular.isArray(event.reminder_users)) {
                if (event.reminder_users && event.reminder_users.length > 0) {

                    _.forEach(event.reminder_users, function (taskid, taskindex) {
                        _.forEach(self.users, function (item) {
                            if (taskid == item.userId) {
                                event.reminder_users_temp.push(parseInt(taskid));
                            }
                        });
                    });
                    event.reminder_users = event.reminder_users_temp;
                }
            }
        }

        self.setUserMode = function (user) {
            if (user.id == 1) {
                self.userSelectedMode = user.id;
                self.calendarEvent.reminder_users = "intake";
            } else if (user.id == 2) {
                self.userSelectedMode = user.id;
                self.calendarEvent.reminder_users = "all";
            } else if (user.id == 3) {
                self.users = [];
                self.userSelectedMode = user.id;
                if (angular.isDefined(self.calendarEvent.reminder_users) && self.calendarEvent.reminder_users != "" && self.calendarEvent.reminder_users != "all" && self.calendarEvent.reminder_users != "intake") {
                    self.calendarEvent.reminder_users = self.calendarEvent.reminder_users;
                } else {
                    self.calendarEvent.reminder_users = [];
                }
                contactFactory.getUsersInFirm()
                    .then(function (response) {
                        var userListing = response.data;
                        contactFactory.intakeStaffUserToMatterStaffUser(userListing);
                        self.users = userListing;
                    });

            }

        };



    };


})();

(function (angular) {
    angular
        .module('intake.calendar')
        .factory('IntakeCalendarEventHelper', IntakeCalendarEventHelper);

    IntakeCalendarEventHelper.$inject = ['globalConstants'];

    function IntakeCalendarEventHelper(globalConstants) {

        return {
            roundOffTime: roundOffTime,
            addZero: addZero,
            disableReminder: disableReminder,
            showhideDates: showhideDates,
            areDatesValid: areDatesValid,
            setDates: setDates,
            setEventObject: setEventObject,
            isValidDateRange: isValidDateRange,
            setFulldayTime: setFulldayTime,
            setEventTitle: setEventTitle
        };

        //to set current time in the dropdown we need to round the current time
        //dropdown displays time with an interval of 30 min
        //therfore we round off the current time accordingly

        // round of the current time to set +30 minutes
        function roundOffTime(action, date) {
            var coeff = 1000 * 60 * 30;
            var date = new Date();  //or use any other date
            if (action == 'start') {
                date.setMinutes(date.getMinutes() + 30);
            } else if (action == 'end') {
                date.setMinutes(date.getMinutes() + 60);
            }
            var rounded = new Date(Math.round(date.getTime() / coeff) * coeff);
            return addZero(rounded.getHours()) + ':' + addZero(rounded.getMinutes());
        }

        // add zero before 1 - 9 numbers
        function addZero(i) {
            if (i < 10) {
                i = "0" + i;
            }
            return i;
        }

        function disableReminder(event) {
            if (utils.isEmptyVal(event)) {
                return true;
            }

            var eventCopy = angular.copy(event);
            setDates(eventCopy);
            var startDate = eventCopy.all_day == '1' ?
                moment.unix(eventCopy.start).utc() :
                moment.unix(eventCopy.start);

            var disable = eventCopy.all_day == '1' ?
                startDate.isBefore(moment.unix(utils.getUTCStartFromMoment(moment()))) :
                startDate.isBefore(moment());

            if (disable) {
                var isEdit = utils.isNotEmptyVal(eventCopy.intake_event_id);
                if (!isEdit) {
                    event.remindMe = false;
                }
            }
            return disable;
        }

        // show hide date selectore based on label type
        function showhideDates(event, pageMode) {

            if (event.is_deadline == 1) {
                event.DeadlineDatesClicked = false;
            } else {
                event.DeadlineDatesClicked = true;
            }
            event.ispersonalevent = (event.label_id == "19") ? "1" : "0";

            var fulldayEventsIds = globalConstants.fulldayEvents;
            var isFullDayEvent = fulldayEventsIds.indexOf(parseInt(event.label_id)) > -1;
            if (isFullDayEvent) {
                event.all_day = 1;
                event.criticalDatesClicked = true;
            } else {
                event.criticalDatesClicked = false;
                if (pageMode != 'edit') {
                    event.all_day = 0;
                }
            }

            if (event.label_id == "100" || event.label_id == "19" || event.label_id == "32") {
                event.userdefined = 1;
            } else {
                event.userdefined = 0;
                event.event_title = '';
            }
        }

        function areDatesValid(event) {
            var start = moment.unix(event.start);
            var end = moment.unix(event.end);
            if (event.all_day == '1') {
                if (isCriticalDate(event.label_id)) {
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

        function isCriticalDate(labelId) {
            var criticalDateslabelIds = [globalConstants.solLabelId.toString(),
            globalConstants.nocLabelId.toString(),
            globalConstants.noiLabelId.toString()];
            return criticalDateslabelIds.indexOf(labelId) > -1;
        }

        function setDates(event) {
            //date converted to timestamp
            event.custom_reminder = (utils.isEmptyVal(event.custom_reminder)) ? '' : utils.getUTCTimeStamp(event.custom_reminder);

            event.sms_custom_reminder = (utils.isEmptyVal(event.sms_custom_reminder)) ? '' : utils.getUTCTimeStamp(event.sms_custom_reminder);
            //date converted to string to match the api
            event.reminder_datetime = event.remindMe ? moment(event.reminder_datetime).format('DD-MM-YYYY') : 0;
            //to manage the different names for the same property in api assign reminder_datetime to remind_date
            event.remind_date = event.reminder_datetime;
            event.start = _getStartDate(event.start_date, event.start, event.all_day);
            event.end = _getEndDate(event.end_date, event.end, event.all_day);
        }

        function _getStartDate(date, offset, allDay) {
            var start;

            start = moment(date, [moment.ISO_8601, 'YYYY-MM-DD', 'YYYY/MM/DD', 'MM-DD-YYYY', 'MM/DD/YYYY']);

            if (allDay == '1') {
                start = start.startOf('day');

                start = start.toDate();
                start = new Date(start);
                start = subtractUTCOffset(start);
                start = moment(start.getTime()).unix();

            } else {
                var startTimeOffset = {
                    h: parseInt(offset.substring(0, 2)),
                    m: parseInt(offset.substring(3))
                };

                start.startOf('day').add(startTimeOffset);
                start = start.utc();

                start = start.toDate();
                start = new Date(start);
                start = moment(start.getTime()).unix();
            }

            return start;
        }

        function _getEndDate(date, offset, allDay) {
            var end;

            end = moment(date, [moment.ISO_8601, 'YYYY-MM-DD', 'YYYY/MM/DD', 'MM-DD-YYYY', 'MM/DD/YYYY']);

            if (allDay == '1') {
                end = end.endOf('day');
                end = new Date(end.toDate());
                end = subtractUTCOffset(end);
                end = moment(end.getTime()).unix();
                //end.utc().endOf('day');
            } else {
                var endTimeOffset = {
                    h: parseInt(offset.substring(0, 2)),
                    m: parseInt(offset.substring(3))
                };
                end.startOf('day').add(endTimeOffset);
                end = end.utc();
                end = new Date(end.toDate());
                end = moment(end.getTime()).unix();
            }

            return end;
        }

        function subtractUTCOffset(_date) {
            var _userOffset = _date.getTimezoneOffset() * 60 * 1000; // user's offset time
            var _centralOffset = 6 * 60 * 60 * 1000; // 6 for central time - use whatever you need
            _date = new Date(_date.getTime() - _userOffset); // redefine variable
            return _date;
        }

        function setEventObject(pageMode, event, selectedDate, date) {
            switch (pageMode) {
                case 'add':
                    _setEventObjForAdd(event, selectedDate, date);
                    break;
                case 'edit':
                    _setEventObjForEdit(event);
                    break;
            }
        }

        function _setEventObjForAdd(event, selectedDate, date) {
            //event.start = roundOffTime('start');
            //event.end = roundOffTime('end');

            //            event.start = date.format('HH:mm');
            //            event.end = angular.copy(date).add(15, 'm').format('HH:mm');

            /*set default event start and end time*/

            event.start = '09:00';
            event.end = '10:00';

            var selectedDate = moment(selectedDate, "YYYY-MM-DD").format();
            event.start_date = selectedDate;
            event.end_date = selectedDate;

            event.reminder_datetime = moment().format();
            showhideDates(event);

            if (!date.hasTime()) {
                event.all_day = 1;
            }
        }

        function _setEventObjForEdit(event) {
            //start_date, end_date vars store dates utc unix timestamp

            event.start_date = moment.unix(event.start_date).format();
            event.end_date = moment.unix(event.end_date).format();

            //start, end stores time string in hours:minutes format
            if (event.allDay == '1') {
                event.start = '09:00';
                event.end = '10:00';
            } else {
                event.start = addZero(event.start.getHours()) + ':' + addZero(event.start.getMinutes());
                event.end = addZero(event.end.getHours()) + ':' + addZero(event.end.getMinutes());
            }
            if (utils.isNotEmptyVal(event.custom_reminder)) {
                event.custom_reminder = (event.custom_reminder.split('-').join('/'));
            }
            if (utils.isNotEmptyVal(event.sms_custom_reminder)) {
                event.sms_custom_reminder = (event.sms_custom_reminder.split('-').join('/'));
            }
            if (utils.isNotEmptyVal(event.reminder_datetime)) {
                event.reminder_datetime = moment.unix(event.reminder_datetime).format();
                event.remindMe = true;
            } else {
                event.reminder_datetime = moment().format();
                event.remindMe = false;
            }

        }

        function isValidDateRange(start, end) {
            if (start == end) {
                return _isValidFullDayDate(start, 'start');
                //return false;
            }

            var isStartValid = _isValidFullDayDate(start, 'start');
            var isEndValid = _isValidFullDayDate(end, 'end');
            return isStartValid && isEndValid;
        }

        function _isValidFullDayDate(timestamp, dateFor) {
            var date = _getUtcMoment(timestamp);
            var time = _getTimeString(date);
            return _isTimeValid(time, dateFor);
        }

        function setFulldayTime(timestamp, setTimeFor) {
            var date = _getUtcMoment(timestamp);
            var isCorrectFullDayTime;
            var time = _getTimeString(date);
            isCorrectFullDayTime = _isTimeValid(time, setTimeFor);
            date = isCorrectFullDayTime ? date : moment.unix(timestamp);
            return moment(date.valueOf()).unix();
        }

        function _getUtcMoment(timestamp) {
            var format = 'ddd MMM DD YYYY HH:mm:ss';
            var date = moment.unix(timestamp);
            date = date.utc().format(format);
            date = moment(date, format);
            return date;
        }

        function _getTimeString(date) {
            return utils.prependZero(date.hour()) + ':'
                + utils.prependZero(date.minute()) + ':'
                + utils.prependZero(date.second());
        }

        function _isTimeValid(time, timeFor) {
            switch (timeFor) {
                case 'start':
                    return time === '00:00:00';
                case 'end':
                    return time === '23:59:59';
            }
        }

        function setEventTitle(event, categories) {
            var userDefinedId = globalConstants.userDefinedEventId;
            if (event.label_id != userDefinedId || event.label_id != "19") {
                var assignedEventType = _.find(categories, function (cat) {
                    return cat.LabelId == event.label_id
                });

                if (utils.isNotEmptyVal(assignedEventType)) {
                    //   event.event_title = assignedEventType.Name; as the name was being assigned to title
                }
            }
        }
    }
})(angular);
