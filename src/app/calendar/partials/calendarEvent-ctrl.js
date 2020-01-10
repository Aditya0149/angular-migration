(function () {

    'use strict';

    angular
        .module('intake.calendar')
        .controller('CalendarEventCtrl', CalendarEventController);

    CalendarEventController.$inject = ['$scope', '$state', '$timeout', 'masterData',
        'calendarEventHelper', 'globalConstants', 'eventsDataService', 'notification-service', 'matterFactory',
        'eventCronologyHelper', 'modalService', 'practiceAndBillingDataLayer', 'allPartiesDataService', '$rootScope', 'eventsHelper', 'newSidebarDataLayer'];

    function CalendarEventController($scope, $state, $timeout, masterData, calendarEventHelper, globalConstants, eventsDataService, notificationService, matterFactory, eventCronologyHelper, modalService, practiceAndBillingDataLayer, allPartiesDataService, $rootScope, eventsHelper,newSidebarDataLayer) {

        var self = this;
        var pageMode;
        var eventId = $scope.calendar.eventId;
        var catId = $scope.calendar.filters.filterby;
        var allEventData, userRole = masterData.getUserRole();
        var matterId = $scope.calendar.matterId;
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
        self.disableReminder = calendarEventHelper.disableReminder;
        self.goToMatter = goToMatter;
        self.isDatesValid = isDatesValid;
        self.setEndTime = setEndTime;
        self.getcourtAddress = getcourtAddress;
        self.setLocation = setLocation;//pointer to setLocation function
        //US#4713 disable add edit delete 
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.isClientPortal = gracePeriodDetails.client_portal; //Check Client portal enable or not
        //US#5678-  page filters for event history grid data
        self.eventHistoryData = [];
        var pageNumber = 1;
        var pageSize = 50;
        self.exportEventHistory = exportEventHistory;//US#5678-download event history
        self.userSelectedType = [{ id: 1, name: 'Assigned to Matter' }, { id: 2, name: 'All Users' }, { id: 3, name: 'Select User' }];
        self.resetEdit = resetEdit;
        self.resetAdd = resetAdd;
        var startTimeSlot = $scope.calendar.startTimeSlot;
        var endTimeSlot = $scope.calendar.endTimeSlot;
        self.calDays = calDays;
        self.searchUsers = searchUsers;
        self.assignedToUserList = [];
        $rootScope.isShareWithPlaintiffCalender = false;
        self.cMessengerCheck = cMessengerCheck;

        function init() {
            self.cancelFlag = false;
            self.dateFlag = false;

            self.form = {};
            self.display = {};
            self.category = [];
            self.calendarEvent = {};
            self.dataAfterCancel = '';
            self.calendarEvent.criticalDatesClicked = false;
            self.calendarEvent.DeadlineDatesClicked = false;
            self.calendarEvent.assignedUsers = [];

            if (utils.isNotEmptyVal($scope.calendar.editCalendarEvent)) {
                self.editCalendarEvent = $scope.calendar.editCalendarEvent;
            } else {
                self.editCalendarEvent = false;
            }
            // Get Users List for Assigning Event to Users

            getUsersList();


        };

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

        //US#3119-set default values for Remind Me in Days:
        // self.reminderDaysList = globalConstants.reminderDaysList;

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
        //US#11117
        function calDays(event) {
            var fulldayEventsIds = globalConstants.fulldayEvents;
            var isFullDayEvent = fulldayEventsIds.indexOf(parseInt(event.label_id)) > -1;
            if (!isFullDayEvent) {
                if (utils.isNotEmptyVal(event.utcstart) && utils.isNotEmptyVal(event.utcend)) {
                    var start = moment(event.utcstart).unix();
                    start = moment.unix(start);
                    var end = moment(event.utcend).unix();
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

        function cMessengerCheck() {
            if (!($rootScope.isSmsActiveUI)) {
                notificationService.error("To set SMS event reminders, please subscribe to Client Messenger in the Marketplace.");
            }
        }

        self.groupContacts = groupContacts;
        function groupContacts(party) {
            if (party.role == "Plaintiffs") {
                return "Plaintiff(s)";
            }

            if (party.role == "Defendants") {
                return "Defendant(s)";
            }

            if (party.role == "Insurance Provider") {
                return "Insurance Provider(s)";
            }
            if (party.role == "Other Party") {
                return "Other Party(s)";
            }
            if (party.role == "Insured Party") {
                return "Insured Party(s)";
            }
            if (party.role == "Medical Service Provider") {
                return "Medical Service Provider(s)";
            }
            if (party.role == "Service Provider") {
                return "Service Provider(s)";
            }
            if (party.role == "Insurance Adjuster") {
                return "Insurance Adjuster(s)";
            }
            if (party.role == "Lien Insurance Provider") {
                return "Lien Insurance Provider(s)";
            }
            if (party.role == "Lien Adjuster") {
                return "Lien Adjuster(s)";
            }
            if (party.role == "Lien Holder") {
                return "Lien Holder(s)";
            }
            if (party.role == "Physician") {
                return "Physician(s)";
            }
        }


        /** US-5214 function to get court address to Location field*/
        function getcourtAddress(matterid, eventid) {
            if (utils.isEmptyVal(matterid) && (eventid == 19 || eventid == 100 || eventid == 32) && self.calendarEvent.reminder_users == "matter") {
                self.calendarEvent.reminder_users = "all";
                self.calendarEvent.reminder_users_id = 2;
            }
            /** if event type is  'Trial dates' or 
               'Court Apperarance' & page mode is add **/
            if ((eventid == '12' || eventid == '14' || eventid == '23' || eventid == '26') && (pageMode == 'add')) {
                if (!(isNaN(parseInt(matterid)))) {//check whether it is valid matter id
                    matterFactory.getMatterOverview(matterid)
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
            setReminderDaysList(eventid);
        }

        /** US-5214 function to auto populate court address to Location 
            field when event type is 'Trial ','Court Appearance' & 'Motion'*/
        function setLocation(eventid) {
            if ((eventid == '12' || eventid == '14' || eventid == '23' || eventid == '26') && (pageMode == 'add')) {
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
        function isDatesValid() {
            if ($('#glbevestartDateErr').css("display") == "block" ||
                $('#glbeveendDateErr').css("display") == "block" ||
                $('#glblevtReminderDateErr').css("display") == "block" || $('#glbevecustomDateDatedivErr').css("display") == "block" || $('#glbevecustomDateDatedivErrForSMS').css("display") == "block" || $('#glbevecustomDateDatedivErrForSMS').css("display") == "block") {
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
                if (eventType != '19' && eventType != '100') { // if type is personal
                    return (isNaN(parseInt(matter_id)) || utils.isEmptyVal(eventType)); //if matter is not mentioned disable
                } else if (parseInt(eventType) == 19 || parseInt(eventType) == 100) { // if personal event matter is not required
                    return false;
                }
            } else if (pageMode == 'edit') {
                if (eventType != '19' && eventType != '100') {
                    return (isNaN(parseInt(matter_id)) || utils.isEmptyVal(eventType)); //if matter is not mentioned disable
                } else { return false; }
            }
        }

        function searchMatters(matterName) {
            return matterFactory.searchMatters(matterName)
                .then(function (response) {
                    matters = response.data;
                    self.calendarEvent.sms_contact_ids = [];
                    return response.data;
                });
        }
        //Function to add Assigned users
        function addAssignedUser(userList) {
            self.calendarEvent.assigned_to = userList;
            self.createTaskDisabled = self.calendarEvent.assigned_to && self.calendarEvent.assigned_to.length > 0 ? false : true;
        }

        function setCreateTaskFlag() {
            if (angular.isDefined(appPermissions) && appPermissions != '' && appPermissions != ' ') {
                self.calendarEvent.is_task_created = (appPermissions.DefaultTaskCreation == 1) ? 1 : 0;
            } else {
                self.calendarEvent.is_task_created = 0;
            }
        }

        function enableDisableTaskFlag() {
            if (self.calendarEvent.assigned_to && self.calendarEvent.assigned_to.length > 0) {
                self.createTaskDisabled = false;
            } else {
                self.createTaskDisabled = true;
            }
        }

        //Function to remove Assigned Users
        function removeAssignedUser(userList) {
            self.calendarEvent.assigned_to = userList;
            self.createTaskDisabled = self.calendarEvent.assigned_to && self.calendarEvent.assigned_to.length > 0 ? false : true;
            pageMode === 'edit' ? searchUsers() : angular.noop();
        }
        // Commenting Function out as per requirements in US#9539
        // Function to check whether a task is previously assigned to event. If task is assigned and but all users are removed save should be disabled as per requirements.
        // function userAssignmentValidation(){
        //     if (self.assignedUsers == '' && self.calendarEvent.assigned_taskid != '' && self.pageMode === 'edit'){
        //         return true;
        //     }
        //     else{
        //         return false;
        //     }
        // }
        function getUsersList() {
            eventsDataService.getStaffsInFirm()
                .then(function (data) {
                    self.assignedToUserList = data
                    self.users = data;
                    if (!self.editCalendarEvent) {
                        addNewEvent();
                    } else {
                        var categoryCheck = catId == 'personalevent' ? '?is_personal=1' : '';
                        eventsDataService
                            .getSingleEvent_OFF_DRUPAL(eventId, categoryCheck)
                            .then(function (events) {

                                // Set Object 
                                events.reminder_days = (events.reminder_days).split(",");
                                events.sms_reminder_days = events.sms_reminder_days && events.sms_reminder_days != null && events.sms_reminder_days != 'null' ? (events.sms_reminder_days).split(",") : [];
                                events.utcstart = (events.start) ? (events.start) : '';
                                events.utcend = (events.end) ? (events.end) : (events.start);
                                events.sms_contact_ids = events.sms_contact.length > 0 ? _.pluck(events.sms_contact, 'contact_id') : [];
                                if (events.sms_contact.length > 0) {
                                    _.forEach(events.sms_contact, function (item) {
                                        item.firstname = item.first_name;
                                        item.lastname = item.last_name;
                                        item.name = item.first_name + " " + item.last_name;
                                        item.contactid = item.contact_id;
                                    })
                                }
                                self.contactList1 = [];
                                self.contactList1 = events.sms_contact;
                                var mId = (events.matter && events.matter.matter_id) ? events.matter.matter_id : '';

                                allEventData = events;
                                if (self.isClientPortal == 1 && mId && mId > 0) {
                                    allPartiesDataService.getPlaintiffs(mId).then(function (response) {
                                        self.plaintiffDataList = [];
                                        angular.forEach(response.data, function (plaintiff) {
                                            if (plaintiff.client_status == "1" && utils.isNotEmptyVal(plaintiff.contactid.emailid)) {
                                                self.plaintiffDataList.push(plaintiff);
                                            }
                                        });

                                        events.share_with = _.pluck(events.share_with_plaintiff, 'plaintiff_id');
                                        events.share_with = events.share_with.map(String);
                                        // delete event.shared_with;
                                    });
                                }


                                // convert(events); 
                                // Use this singleEvent(events) instead of convert(events)
                                singleEvent(events)

                                //US#8328 to show 180 days, 1 & 2 years
                                setReminderDaysList(events.label_id);
                                if (self.isClientPortal == 1 && mId && mId > 0) {
                                    allPartiesDataService.getAllParties(mId).then(function (res) {
                                        /** Check to show/hide for Share checkbox to event  **/
                                        var flag = (res.plaintiff.client_portal_status == '1') ? true : false;
                                        $rootScope.isShareWithPlaintiffCalender = false;
                                        if (flag) {
                                            forEach(res.plaintiff.data, function (item) {
                                                if (item.client_status == "1") {
                                                    $rootScope.isShareWithPlaintiffCalender = true;
                                                }
                                            })
                                        }
                                    });
                                }

                            });
                    }

                    var permissions = masterData.getPermissions();
                    self.eventsPermissions = _.filter(permissions[0].permissions, function (per) {
                        if (per.entity_id == '3') {
                            return per;
                        }
                    });
                    self.criticalDatesPermission = _.filter(permissions[0].permissions, function (user) {
                        if (user.entity_id == '2') {
                            return user;
                        }
                    });


                    self.category = angular.copy(masterData.getEventTypes());
                }, function (err) {
                    console.log(err);
                });
        }

        function getSharePlaintiffList(matterId) {
            allPartiesDataService.getPlaintiffs(matterId).then(function (response) {
                self.plaintiffDataList = [];
                angular.forEach(response.data, function (plaintiff) {
                    if (plaintiff.client_status == "1" && utils.isNotEmptyVal(plaintiff.contactid.emailid)) {
                        self.plaintiffDataList.push(plaintiff);
                    }
                });
                self.calendarEvent.share_with = _.intersection(_.pluck(self.plaintiffDataList, 'plaintiffid'), self.calendarEvent.share_with);

            });

        }

        self.setUserRadioButton = function () {
            if (utils.isEmptyVal(self.taskInfo.matterid) && (self.calendarEvent.label_id == 19 || self.calendarEvent.label_id == 100 || self.calendarEvent.label_id == 32) && self.calendarEvent.reminder_users == "matter") {
                self.calendarEvent.reminder_users = "all";
                self.calendarEvent.reminder_users_id = 2;
            }
        }
        self.getContactsAndEmails = getContactsAndEmails;

        function formatTypeaheadDisplay(matterid) {
            if (angular.isUndefined(matterid) || utils.isEmptyString(matterid)) {
                return undefined;
            }
            var matterInfo = _.find(matters, function (matter) {

                if (matter.matterid === matterid && self.isClientPortal == 1) {
                    allPartiesDataService.getAllParties(matter.matterid).then(function (res) {
                        /** Check to show/hide for Share checkbox to event  **/
                        var flag = (res.plaintiff.client_portal_status == '1') ? true : false;
                        $rootScope.isShareWithPlaintiffCalender = false;
                        if (flag) {
                            forEach(res.plaintiff.data, function (item) {
                                if (item.client_status == "1") {
                                    $rootScope.isShareWithPlaintiffCalender = true;
                                }
                            })
                        }
                    });

                    getSharePlaintiffList(matterid);
                }
                return matter.matterid === matterid;
            });

            if (utils.isEmptyVal(matterInfo) || matterInfo.matterid == "0") {
                return '';
            }
            getContactsAndEmails(matterInfo)
            return matterInfo.name + '-' + matterInfo.filenumber;
        }
        function getContactsAndEmails(matterId) {
            self.contactList1 = [];
            if (angular.isUndefined(matterId)) {
                return;
            }
            var emails = newSidebarDataLayer.getContactsAndEmails(matterId.matterid).then(function (data) {
                self.contactList1 = eventsHelper.setContactList(data);
                self.contactList1 = _.uniq(self.contactList1, function (item) {
                    return item.contactid;
                });
                if (self.contactList1.length > 0 && self.calendarEvent.sms_contact_ids) {
                    var arr = [];
                    _.forEach(self.calendarEvent.sms_contact_ids, function (info) {
                        _.forEach(self.contactList1, function (item) {
                            if (info == item.contactid) {
                                arr.push(item);
                            }
                        });
                    })
                    if (arr.length == 0) {
                        self.calendarEvent.sms_contact_ids = [];
                    } else {
                        self.calendarEvent.sms_contact_ids = _.pluck(arr, 'contactid');
                    }
                }
            }, function () {
                // console.log(data);
            });

        }

        // prepare dates to display on the UI, when opening add/edit window
        function setEventObject(event) {
            calendarEventHelper.setEventObject(pageMode, event, self.dateClicked, self.daySelected, self.selectTime, $scope.calendar.displayCalView);
            if (pageMode == 'add') {
                if (self.criticalDatesPermission[0].A == 0 && self.eventsPermissions[0].A == 1) {
                    self.category = _.filter(self.category, function (eventTypes) {
                        if (eventTypes.is_critical != '1') {
                            return eventTypes;
                        }

                    });
                }
                if (self.eventsPermissions[0].A == 0 && self.criticalDatesPermission[0].A == 1) {
                    self.category = _.filter(self.category, function (eventTypes) {
                        if (eventTypes.is_critical == '1') {
                            return eventTypes;
                        }

                    });
                }

                var user = { id: 1 };
                self.setUserMode(user);
            } else {
                getEventRemindUser(event);
            }

        }


        //function to delete events us#7393
        function deleteEvent(selectedEvent) {

            // restrict user for deleting Critical events when no delete permission 
            if (self.criticalDatesPermission[0].D == 0 && (selectedEvent.label_id == 1 || selectedEvent.label_id == 6 || selectedEvent.label_id == 15)) {
                notificationService.error(globalConstants.accessMgmtMessage + "delete critical events");
                return;
            }
            if (self.eventsPermissions[0].D == 0 && (selectedEvent.label_id != '1' && selectedEvent.label_id != 6 && selectedEvent.label_id != 15)) {
                notificationService.error(globalConstants.accessMgmtMessage + "delete events");
                return;
            }

            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {


                eventsDataService.deleteEvent_OFF_DRUPAL(selectedEvent.id)
                    .then(function () {
                        notificationService.success('Event deleted successfully!');
                        //self.eventsList = [];
                        //self.selectedEvent=eventsList[0];                        
                        //getEvents();
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
        function goToMatter(matterId) {
            $state.go('add-overview', { matterId: matterId }, { reload: true });
        }

        //event handlers
        function openCalender($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            self.calendarEvent[isOpened] = true; //isOpened is a string specifying the model name
        };

        function singleEvent(calEvent) {
            getEventHistoryData(calEvent.event_id);
            getEventRemindUser(calEvent);

            calEvent.label_id = calEvent.label_id.toString();

            if (eventId == calEvent.event_id) {
                if (calEvent.matter && calEvent.matter.matter_id == '0') {
                    calEvent.matter.matter_id = null;
                }
                if (self.cancelFlag) {
                    calEvent = self.dataAfterCancel;
                }

                if (calEvent.all_day == '1') {
                    if (calendarEventHelper.isValidDateRange(calEvent.utcstart, calEvent.utcend)) {
                        var start = calEvent.utcstart, end = calEvent.utcend;
                        calEvent.utcstart = calendarEventHelper.setFulldayTime(calEvent.utcstart, 'start');
                        calEvent.utcend = calendarEventHelper.setFulldayTime(calEvent.utcend, 'end');
                    }
                }

                self.dataAfterCancel = calEvent;
                //US-3119  To view selected remider dates on view 
                calEvent.id = calEvent.event_id;
                var start = calEvent.utcstart;
                start = utils.convertUTCtoDate(start);
                calEvent.start = start;
                var end = calEvent.utcend;
                end = utils.convertUTCtoDate(end);
                calEvent.end = end;
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

                self.assignedUsers = calEvent.assigned_to;

                //disable dragging for critical events for staff
                // calEvent.editable = !(globalConstants.fulldayEvents.indexOf(parseInt(calEvent.label_id)) !== -1
                //     && userRole.role === 'Staff');
                self.eventClickDetails = calEvent;
                self.assigned_to_name = utils.isEmptyVal(self.eventClickDetails.assigned_to) ? '' : _.pluck(self.eventClickDetails.assigned_to, 'full_name').join(', ');
                self.existingEvent = angular.copy(calEvent);
                self.dateFlag = true;
            }
        }

        //get event history of selected event
        function getEventHistoryData(eventId) {

            eventsDataService.getEventHistory_OFF_DRUPAL(eventId, pageNumber, pageSize)
                .then(function (response) {
                    self.eventHistoryData = response;
                    _.forEach(self.eventHistoryData, function (data) {
                        _.forEach(masterData.getMasterData().event_reschedule_reason, function (item) {
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
                    notificationService.error("Event history not loaded")
                })

        }

        //download event history data
        function exportEventHistory(eventHistory) {
            eventsDataService.downloadEventHistory(self.eventClickDetails.id, pageNumber, pageSize)
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

        function convert(events) {
            if (utils.isEmptyVal(events)) {
                return;
            }

            if (events.data) {
                _.forEach(events.data, function (event) {
                    singleEvent(event);
                })
            }
        };

        function saveCalendarEvent(event) {
            var checkMatter = false
            if (self.taskInfo == undefined) {
                checkMatter = true;
            } else {
                if (utils.isEmptyVal(self.taskInfo.matterid)) {
                    checkMatter = true;
                }
            }
            //US#5554 : if matter not tagged 
            if (event.ispersonalevent == '1' && event.is_cp_share == '1') {
                if (checkMatter) {
                    event.is_cp_share = '0';
                    notificationService.error("Event will be shared once a matter is associated with it. Until then it will now be shared with any client.");
                }
            }
            var oldDate = moment(event.utcstart).year();
            if (oldDate < 1970) {
                notificationService.error("Not Acceptable: Start or End date can not be negative");
                return;
            };

            if (event.private != 1) {
                if (event.reminder_users != "all" && event.reminder_users != "matter") {
                    if (event.reminder_users != null && event.reminder_users.length > 0) {
                    } else {
                        notificationService.error("Please select at least one remind user");
                        return;
                    }
                }
            } else {
                if (event.reminder_users != "all" && event.reminder_users != "matter") {
                    if (event.reminder_users != null && event.reminder_users.length > 0) {
                    } else {
                        notificationService.error("Please select at least one remind user");
                        return;
                    }

                }
                //event.assigned_to = [];
                //delete event.assigned_to;
            }

            if (self.pageMode === 'add') {

                if (self.criticalDatesPermission[0].A == 0 && (event.label_id == 1 || event.label_id == 6 || event.label_id == 15)) {
                    notificationService.error(globalConstants.accessMgmtMessage + "add critical events")
                    return;
                }
                if (self.eventsPermissions[0].A == 0 && (event.label_id != '1' && event.label_id != 6 && event.label_id != 15)) {
                    notificationService.error(globalConstants.accessMgmtMessage + "add events")
                    return;


                }
            }


            //validate the custom reminder date before saving event
            if (event.custom_reminder) {
                var endDate = moment(new Date(event.utcend)).utc();
                var customDateReminder = moment(new Date(event.custom_reminder)).utc();
                if (endDate.isBefore(customDateReminder)) {
                    notificationService.error('The custom reminder date should not be greater than event date');
                    return;
                }
            }
            // sms_custom_reminder
            if (event.sms_custom_reminder) {
                var endDate = moment(new Date(event.utcend)).utc();
                var customDateReminder = moment(new Date(event.sms_custom_reminder)).utc();
                if (endDate.isBefore(customDateReminder)) {
                    notificationService.error('The custom reminder date should not be greater than event date');
                    return;
                }
            }
            if (event.remindMe) {
                var start = moment(new Date(event.utcstart)).utc();
                var reminder = moment(new Date(event.reminder_datetime)).utc();
                if (reminder.isAfter(start)) {
                    notificationService.error('Reminder date can not be greater than start date');
                    return;
                }
            }
            event.is_task_created = (!utils.isEmptyObj(self.taskInfo) && utils.isNotEmptyVal(self.taskInfo.matterid) && event.assigned_to && event.assigned_to.length > 0) ? parseInt(event.is_task_created) : 0;
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
            // sms_reminder_days
            //....End

            matterId = utils.isNotEmptyVal(self.taskInfo) ? self.taskInfo.matterid : '';
            newEvent.matterid = utils.isNotEmptyVal(matterId) ? matterId : '0';

            calendarEventHelper.setEventTitle(newEvent, self.category);
            calendarEventHelper.setDates(newEvent); // set dates

            if (!calendarEventHelper.areDatesValid(newEvent)) {
                notificationService.error("End date time is before Start date time");
                return;
            }

            // US#5678- If event details are updated, then before saving event need to   // capture event update comments from user
            // For that pop up is provided with input field where user can enter comment
            // Then event will save
            if (pageMode === 'edit') {
                // set event obj to check event update
                // remove the reference from prototype to avoid conflict
                var oldDate = moment(event.utcstart).year();
                if (oldDate < 1970) {
                    notificationService.error("Not Acceptable: Start or End date can not be negative");
                    return;
                };
                var evtUpdatedObj = angular.copy(newEvent);
                var existingEvent = angular.copy(self.existingEvent);

                //US#5554 : if matter not tagged 
                if (newEvent.ispersonalevent == '1' && newEvent.is_cp_share == '1') {
                    if (checkMatter) {
                        newEvent.is_cp_share = '0';
                        notificationService.error("Event will be shared once a matter is associated with it. Until then it will now be shared with any client.");
                    }
                }
                eventCronologyHelper.setUpdatedCalEvent(existingEvent, evtUpdatedObj);

                if (eventCronologyHelper.isEventUpdated(existingEvent, evtUpdatedObj)) {
                    if (
                        (existingEvent.utcstart != evtUpdatedObj.utcstart) || (existingEvent.utcend != evtUpdatedObj.utcend)
                        || ((existingEvent.all_day != evtUpdatedObj.all_day)
                            || ((existingEvent.start != evtUpdatedObj.start) || (existingEvent.end != evtUpdatedObj.end)))
                    ) {
                        self.checkReason = true;
                    } else {
                        self.checkReason = false;
                    }
                    //US#7768 make remark non mandatory for location
                    // if((existingEvent.matterid != evtUpdatedObj.matterid) ||(existingEvent.reminder_days.toString() != evtUpdatedObj.reminder_days.toString()) || (existingEvent.name != evtUpdatedObj.name) || (existingEvent.is_comply != evtUpdatedObj.is_comply) || (existingEvent.label_id != evtUpdatedObj.label_id) || (existingEvent.title != evtUpdatedObj.title)){
                    //     self.disableSave = false;
                    // }

                    //US#8707 : Show popup only for date/time change
                    if (self.checkReason == true) {
                        var modalInstance = eventCronologyHelper.openEventRemarkPopup(self.checkReason);

                        modalInstance.result.then(function (response) {
                            //set event update remark from user input on  event obj that we are saving
                            newEvent.comments = response.updateRemark;
                            newEvent.reason = (utils.isEmptyVal(response.rescheduleId)) ? '' : response.rescheduleId;

                            // save event  
                            newEvent.id = eventId;
                            editEvents(newEvent);

                        }, function (error) {
                            notificationService.error('Could not save event..');
                        });
                    } else {
                        newEvent.comments = "";
                        // save event  
                        newEvent.id = eventId;
                        editEvents(newEvent);
                    }
                }
                else {
                    newEvent.comments = "";
                    // save event  
                    newEvent.id = eventId;
                    editEvents(newEvent);
                }
            }
            else {
                // set default value for update comments if no updates are there
                newEvent.comments = "";

                // save event
                newEvent.id = '';
                saveEvents(newEvent);
            }
        }

        function editEvents(event) {

            var newEvent = createEventObj(event);

            newEvent.matterdatetypeid = event.matterdatetypeid;
            newEvent.event_name = event.event_name;
            newEvent.task = { "task_id": (event.assigned_taskid) ? event.assigned_taskid : "" };
            newEvent.event_id = event.event_id;
            newEvent.is_deadline = event.is_deadline;
            newEvent.is_critical = event.is_critical;
            newEvent.reason = event.reason;
            newEvent.comments = event.comments;

            eventsDataService.updateEvent_OFF_DRUPAL(event.id, newEvent)
                .then(function (data) {

                    self.successData = data;
                    //US#5554:Error message if client portal is not enabled for a matter
                    // if(angular.isDefined(self.successData.error) && self.successData.error.code == 406){
                    //     notificationService.error("At present none of the plaintiffs have Client Portal enabled. Event will be shared only when you enable if for plaintiff(s)");
                    // }
                    if (data.status == 406) {
                        notificationService.error('At present none of the plaintiffs have Client Portal enabled. Event will be shared only when you enable if for plaintiff(s)');
                    }
                    else if (data.status == 403) {
                        notificationService.error('At present Client Portal is not enabled. Event will be shared only when Client Portal is Enabled');
                    }
                    $scope.calendar.goToCalendar();
                    notificationService.success('Event updated succesfully!');
                }, function () {
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function saveEvents(event) {

            var newEvent = createEventObj(event);

            eventsDataService.addEvent_OFF_DRUPAL(newEvent)
                .then(function (data) {

                    self.successData = data;
                    //US#5554:Error message if client portal is not enabled for a matter
                    // if(self.successData && self.successData.error && self.successData.error.code && self.successData.error.code == 406){
                    //     notificationService.error("At present none of the plaintiffs have Client Portal enabled. Event will be shared only when you enable if for plaintiff(s)");
                    // }

                    if (data.status == 406) {
                        notificationService.error('At present none of the plaintiffs have Client Portal enabled. Event will be shared only when you enable if for plaintiff(s)');
                    }
                    else if (data.status == 403) {
                        notificationService.error('At present Client Portal is not enabled. Event will be shared only when Client Portal is Enabled');
                    }
                    $scope.calendar.goToCalendar();
                    notificationService.success('Event added succesfully!');
                }, function () {
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function createEventObj(event) {
            var newEvent = {
                all_day: (event.all_day) ? event.all_day : 0,

                custom_reminder: event.custom_reminder,
                sms_custom_reminder: event.sms_custom_reminder,
                description: (event.description) ? event.description : "",
                is_comply: (event.is_comply) ? event.is_comply : 0,
                is_task_created: event.is_task_created,
                label_id: parseInt(event.label_id),
                location: event.location,
                matter: {
                    matter_id: parseInt(matterId)
                },
                private: event.private,
                remind_date: event.remind_date,
                reminder_days: (event.reminder_days) ? (event.reminder_days).toString() : "",
                sms_reminder_days: (event.sms_reminder_days) ? (event.sms_reminder_days).toString() : "",
                reminder_users_id: event.reminder_users_id,
                reminder_users: (event.reminder_users) ? (event.reminder_users).toString() : "",
                sms_contact_ids: event.sms_contact_ids ? (event.sms_contact_ids).toString() : "",
                title: event.title,
                user_defined: event.user_defined,
                end: event.end,
                start: event.start,
                is_personalevent: (event.label_id == 19) ? 1 : 0,
                share_with: (event.share_with) ? event.share_with.map(Number) : [],
                user_ids: utils.isEmptyVal(event.assigned_to) ? [] : _.pluck(event.assigned_to, 'user_id'),
                is_critical: event.is_critical,
                is_deadline: event.is_deadline
            };
            return newEvent;
        }

        function cancelCalendarEvent() {
            self.editCalendarEvent = false;
            self.cancelFlag = true;
            $scope.calendar.goToCalendar();
            convert(allEventData);
        }

        function resetPrivate() {
            self.calendarEvent.private = 0;

        }

        // show hide date selectore based on label type
        function showhideDates(event, mode, calledFromUI) {
            calendarEventHelper.showhideDates(event, mode);
            self.eventNameCheck = event.event_name; // for personal category disable
            //event.utcend = event.all_day == "1" ? event.utcstart : event.utcend;

            var keyvalues = _.find(self.category, function (item) {
                return item.LabelId === event.label_id
            })

            if (keyvalues) {
                if (keyvalues.is_deadline == 1) {
                    event.DeadlineDatesClicked = false;
                    event.is_deadline = 0;
                } else {
                    event.DeadlineDatesClicked = true;
                    event.is_deadline = 1;
                }
            }

            if (keyvalues) {
                if (keyvalues.is_deadline == 1) {
                    event.DeadlineDatesClicked = false;
                    event.is_critical = 0;
                } else {
                    event.DeadlineDatesClicked = true;
                    event.is_critical = 1;
                }
            }

            if (event.label_id == '1' && !event.utcstart) {
                event.utcstart = new Date(event.utcstart)
                getFormattedDateString(event);
            }

            if (calledFromUI) {
                self.calendarEvent.disableFullDay = false;
                if (moment.isDate(event.utcstart)) {
                    event.utcend = utils.getFormattedDateString(event.utcstart);
                } else {
                    event.utcend = utils.getFormattedDateString(new Date(event.utcstart));
                }
            }
        }

        // get formatter string
        function getFormattedDateString(event) {
            var datestring = $('#glbevestartDatediv').val();
            if (moment(datestring, "MM/DD/YYYY", true).isValid()) {

                event.utcend = utils.getFormattedDateString(event.utcstart);
                event.utcstart = utils.getFormattedDateString(event.utcstart);

            }
        }

        function getFormattedEndDateString(event, datediv) {
            var datestring = $('#glbeveendDatediv').val();
            if (moment(datestring, "MM/DD/YYYY", true).isValid()) {
                event.utcend = utils.getFormattedDateString(event.utcend);
            }

        }


        function addNewEvent() {
            $timeout(function () {
                self.pageMode = 'add';
                pageMode = 'add';
                self.editCalendarEvent = false;
                var event = {};
                self.addNewEventFlag = true;
                event.start = startTimeSlot;
                event.end = endTimeSlot;
                editEvent(pageMode, event);
            }, 100);
        }

        function editEvent(mode, data) {
            //set global reset callback

            if (mode === 'edit') {
                searchUsers();
                if (self.criticalDatesPermission[0].E == 0 && (data.label_id == 1 || data.label_id == 6 || data.label_id == 15)) {
                    notificationService.error(globalConstants.accessMgmtMessage + "edit critical events")
                    return;
                }
                if (self.eventsPermissions[0].E == 0 && (data.label_id != '1' && data.label_id != 6 && data.label_id != 15)) {
                    notificationService.error(globalConstants.accessMgmtMessage + "edit events")
                    return;
                }
                if (self.criticalDatesPermission[0].E == 0 && self.eventsPermissions[0].E == 1) {
                    self.category = _.filter(self.category, function (eventTypes) {
                        if (eventTypes.is_critical != '1') {
                            return eventTypes;
                        }

                    });
                }

                if (self.eventsPermissions[0].E == 0 && self.criticalDatesPermission[0].E == 1) {
                    self.category = _.filter(self.category, function (eventTypes) {
                        if (eventTypes.is_critical == '1') {
                            return eventTypes;
                        }

                    });
                }
                if (_.isObject(data.remind_users)) {
                    self.showUserPicker = true;
                } else {
                    self.showUserPicker = false;
                }
                data.is_task_created = data.is_task_created ? parseInt(data.is_task_created) : 0;
            }



            $timeout(function () {
                editEvnt(mode, data);
            }, 100);
        }

        function searchUsers() {
            eventsDataService.getStaffsInFirm()
                .then(function (data) {
                    self.assignedToUserList = data
                    var sample = [];
                    _.forEach(self.assignedToUserList, function (data) {
                        _.forEach(self.assignedUsers, function (item) {
                            if (item.user_id == data.user_id) {
                                sample.push(data);
                            }
                        })
                    })
                    self.assignedToUserList = _.difference(self.assignedToUserList, sample);
                }, function (err) {
                    console.log(err);
                });
        }

        //set datepicker options
        self.dateFormat = 'MM/dd/yyyy';
        self.datepickerOptions = {
            formatYear: 'yyyy',
            startingDay: 0,
            'show-weeks': false
        };

        function editEvnt(mode, data) {
            data.label_id = (data.label_id) ? data.label_id.toString() : "";
            matterId = (data.matter && data.matter.matter_id) ? (data.matter.matter_id) : "";

            self.editCalendarEvent = false;
            self.pageMode = mode;
            pageMode = self.pageMode;
            self.dataAfterCancel = angular.copy(data);

            self.calendarEvent = angular.copy(data);
            if (self.pageMode !== 'edit') {
                setCreateTaskFlag();
            }

            enableDisableTaskFlag();

            self.assignedUsers = data.assigned_to;
            if (self.pageMode !== 'edit') {
                self.calendarEvent.reminder_days = ['0'];
                self.calendarEvent.sms_reminder_days = ['0'];
            }

            if (utils.isNotEmptyVal(self.calendarEvent.matter) && utils.isNotEmptyVal(self.calendarEvent.matter.matter_id)) {
                self.taskInfo = {};
                self.taskInfo.matterid = self.calendarEvent.matter.matter_id;
                var matterObj = {
                    name: self.calendarEvent.matter.matter_name,
                    filenumber: self.calendarEvent.matter.file_number,
                    matterid: self.calendarEvent.matter.matter_id
                };
                //push the matter obj in matters array for typeahead formatter
                matters.push(matterObj);
            }

            showhideDates(self.calendarEvent, mode);
            setEventObject(self.calendarEvent);
            if (self.pageMode == 'edit' && utils.isNotEmptyVal(self.calendarEvent.utcstart) && utils.isNotEmptyVal(self.calendarEvent.utcend)) {
                var start = moment(self.calendarEvent.utcstart).startOf("day").unix();
                start = moment.unix(start);
                var end = moment(self.calendarEvent.utcend).startOf("day").unix();
                end = moment.unix(end);
                if (end.diff(start, 'days', true) > 0) {
                    self.calendarEvent.disableFullDay = true;
                } else {
                    self.calendarEvent.disableFullDay = false;
                }
            }
        }

        function resetAdd() {
            $("input[name='matterid']").val("");
            angular.isDefined(self.taskInfo) ? self.taskInfo.matterid = '' : angular.noop();
            self.calendarEvent = {};
            self.assignedUsers = [];
            //Bug#4905: Reset button issue while adding event 
            self.calendarEvent.reminder_days = ['0'];
            self.calendarEvent.sms_reminder_days = ['0'];
            setEventObject(self.calendarEvent);

        }

        function resetEdit() {
            editEvnt('edit', self.eventClickDetails);
        }

        function setEndDateForFullDay(isFullDay, event) {
            event.utcend = isFullDay == "1" ? event.utcend : event.utcend;
        }
        //US#8558 Event & Task reminder to matter users or all users
        function getEventRemindUser(event) {
            if (utils.isEmptyVal(event)) { return }
            if (event.reminder_users == "matter") {
                event.reminder_users_id = 1;
            } else if (event.reminder_users == "all") {
                event.reminder_users_id = 2;
            } else if (JSON.parse(event.reminder_users) instanceof Array) {

                event.reminder_users = JSON.parse(event.reminder_users).map(Number);
                // self.users = [];
                event.reminder_users_id = 3;
            }

            // eventsDataService.getStaffsInFirm()
            //         .then(function (data) {
            // self.users = data;
            event.reminder_users_temp = [];
            if (angular.isArray(event.reminder_users)) {
                if (event.reminder_users && event.reminder_users.length > 0) {

                    _.forEach(event.reminder_users, function (taskid, taskindex) {
                        _.forEach(self.users, function (item) {
                            if (taskid == item.user_id) {
                                event.reminder_users_temp.push(parseInt(taskid));
                            }
                        });
                    });
                    event.reminder_users = event.reminder_users_temp;
                }
            }
        }

        self.setUserMode = function (user) {
            self.showUserPicker = false;
            if (user.id == 1) {
                self.calendarEvent.reminder_users_id = user.id;
                self.calendarEvent.reminder_users = "matter";
            } else if (user.id == 2) {
                self.calendarEvent.reminder_users_id = user.id;
                self.calendarEvent.reminder_users = "all";
            } else if (user.id == 3) {
                // self.users = [];
                // self.calendarEvent.reminder_users = [];
                self.calendarEvent.reminder_users_id = user.id;
                self.showUserPicker = true;
                if (angular.isDefined(self.calendarEvent.reminder_users) && self.calendarEvent.reminder_users != "" && self.calendarEvent.reminder_users != "all" && self.calendarEvent.reminder_users != "matter") {
                    self.calendarEvent.reminder_users = self.calendarEvent.reminder_users;
                } else {
                    self.calendarEvent.reminder_users = [];
                }
                $(".userPicker input").focus();

            }

        };



    };


})();

(function (angular) {
    angular
        .module('intake.calendar')
        .factory('calendarEventHelper', calendarEventHelper);

    calendarEventHelper.$inject = ['globalConstants'];

    function calendarEventHelper(globalConstants) {

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
                var isEdit = utils.isNotEmptyVal(eventCopy.id);
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
                event.user_defined = 1;
            } else {
                event.user_defined = 0;
                event.title = '';
            }
        }

        function areDatesValid(event) {
            var start = moment.unix(event.start);
            var end = moment.unix(event.end);
            if (event.all_day == '1') {
                if (start.isSame(end)) {
                    return true
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
            //convert moment string date format to date object
            event.start = _getStartDate(event.utcstart, event.start, event.all_day);
            event.end = _getEndDate(event.utcend, event.end, event.all_day);
        }

        function _getStartDate(date, offset, allDay) {
            var start;

            start = moment(date, [moment.ISO_8601, 'YYYY-MM-DD', 'YYYY/MM/DD', 'MM-DD-YYYY', 'MM/DD/YYYY']);

            if (allDay == '1') {
                start = start.startOf('day');
                //start = start.utc();
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
                end = end.utc();
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

        function setEventObject(pageMode, event, selectedDate, date, timeArray, displayView) {
            switch (pageMode) {
                case 'add':
                    _setEventObjForAdd(event, selectedDate, date, timeArray, displayView);
                    break;
                case 'edit':
                    _setEventObjForEdit(event);
                    break;
            }
        }

        function _setEventObjForAdd(event, selectedDate, date, timeArray, displayView) {
            //event.start = roundOffTime('start');
            //event.end = roundOffTime('end');

            //            event.start = date.format('HH:mm');
            //            event.end = angular.copy(date).add(15, 'm').format('HH:mm');

            /*set default event start and end time*/

            //if agendaweek or agendaday clicked then set value same as clicked on timeslots
            if (displayView != "month") {
                _.forEach(timeArray, function (item) {
                    if (event.start == item.value) {
                        event.start = item.key;
                    }
                    if (event.end == item.value) {
                        event.end = item.key;
                    }
                })
            } else {
                event.start = '09:00';
                event.end = '10:00';
            }

            var selectedDate = moment(selectedDate, "YYYY-MM-DD").format();
            event.utcstart = selectedDate;
            event.utcend = selectedDate;

            event.reminder_datetime = moment().format();
            showhideDates(event);

            if (!date.hasTime()) {
                event.all_day = 1;
            }
        }

        function _setEventObjForEdit(event) {
            //utcstart, utcend vars store dates utc unix timestamp

            event.utcstart = moment.unix(event.utcstart).format();
            event.utcend = moment.unix(event.utcend).format();

            //start, end stores time string in hours:minutes format
            if (event.all_day == '1') {
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
                    return cat.label_id == event.label_id
                });

                if (utils.isNotEmptyVal(assignedEventType)) {
                    //   event.title = assignedEventType.Name; as the name was being assigned to title
                }
            }
        }
    }
})(angular);

