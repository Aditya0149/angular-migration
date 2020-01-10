(function () {

    'use strict';

    angular
        .module('intake.events')
        .controller('IntakeEventsCtrl', EventsController);

    EventsController.$inject = ['$scope', 'intakeEventsDataService', 'intakeEventsHelper', '$stateParams', '$modal',
        'notification-service', 'modalService', 'intakeFactory', '$rootScope', 'masterData', 'intakeTaskSummaryDataLayer', '$timeout', 'eventsDataService', 'globalConstants', 'practiceAndBillingDataLayer', '$q'
    ];

    function EventsController($scope, intakeEventsDataService, intakeEventsHelper, $stateParams, $modal,
        notificationService, modalService, intakeFactory, $rootScope, masterData, intakeTaskSummaryDataLayer, $timeout, eventsDataService, globalConstants, practiceAndBillingDataLayer, $q) {

        var self = this;
        self.intakeId = $stateParams.intakeId;
        var matterId = $stateParams.intakeId;

        self.eventsList = []; //Data model for holding list of matter notes        
        self.eventToBeAdded = {}; //Data model for holding new note details		
        self.searchEvent = "";
        self.selectedEvent = {};
        self.eventHistoryData = [];

        self.showEventDetails = showEventDetails;

        /*** Event Handlers ***/
        self.selectEvent = selectEvent;
        self.addEditEvent = addEditEvent;
        self.filterRetain = filterRetain;
        self.delete = deleteEvent; //delete events
        self.isSelected = isSelected;
        self.isDataAvailable = false;
        self.addEditData = {};
        self.showEventClass = showEventClass;
        self.goToselectedEvent = goToselectedEvent;
        self.getSortByLabel = getSortByLabel;
        //US#4713 disable add edit delete 
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.userSelectedType = [{ id: 1, name: 'Assigned to Intake' }, { id: 2, name: 'All Users' }, { id: 3, name: 'Select User' }];


        //US#5678-  page filters for event history grid data
        var pageNumber = 1;
        var pageSize = 50;
        self.exportEventHistory = exportEventHistory; //US#5678-download event history

        (function () { //Get events
            displayWorkflowIcon();
            // Fetching Users List for Assigning Event
            intakeTaskSummaryDataLayer.getAssignedUserData()
                .then(function (response) {
                    _.forEach(response, function (currentItem) {
                        currentItem.full_name = currentItem.fullName;
                        currentItem.user_id = currentItem.userId;
                        currentItem.user_name = currentItem.uname;
                    });
                    self.assignedToUserList = response;
                    //check for any selected event from any previous page
                    var selectedEvent = intakeEventsHelper.getSelectedEvent();
                    self.clikedevent = selectedEvent;
                    if (!utils.isEmptyObj(selectedEvent)) {
                        self.selectedEvent = selectedEvent;
                    }
                    self.sorts = [
                        { key: 'desc', name: "Most Recent" },
                        { key: 'asc', name: "Oldest First" }
                    ];
                    self.sortby = utils.isNotEmptyVal(localStorage.getItem('intakeEventSortBy')) ? localStorage.getItem('intakeEventSortBy') : "desc";
                    self.sortDESC = self.sortby == 'desc';
                    getEvents();
                    // // intakeFactory.setBreadcrum(self.intakeId, 'Events');
                    // setBreadcrumWithPromise
                    intakeFactory.setBreadcrumWithPromise(self.intakeId, 'Events').then(function (resultData) {
                        self.matterInfo = resultData;
                        getPlaintiffForSMSIntake(matterId);

                    });
                    var retainSText = JSON.parse(localStorage.getItem("retainSearchTextForIntake"));
                    if (utils.isNotEmptyVal(retainSText)) {
                        if (self.intakeId == retainSText.intakeId) {
                            self.searchEvent = retainSText.events_filtertext;
                        }
                    }
                });

        })();
        function getPlaintiffForSMSIntake(intakeId) {
            self.contactList1 = [];
            if (angular.isUndefined(intakeId)) {
                return;
            }
            intakeFactory.getPlaintiffByIntake(intakeId)
                .then(function (response) {
                    if (utils.isNotEmptyString(response)) {
                        var data = response[0].contact;
                        intakeFactory.getOtherDetails(intakeId)
                            .then(function (res) {
                                var otherDetailsInfo = utils.isNotEmptyVal(res) ? JSON.parse(res[0].detailsJson) : null;
                                var list = intakeEventsHelper.setContactList(data, self.matterInfo.intakeSubType, otherDetailsInfo,response)
                                self.contactList1 = _.unique(list, 'contactid');
                                if (self.contactList1.length > 0 && self.selectedEvent.sms_contact_ids) {
                                    _.forEach(self.contactList1, function (item) {
                                        item.contactid = parseInt(item.contactid);
                                    })
                                    var arr;
                                    _.forEach(self.selectedEvent.sms_contact_ids, function (info) {
                                        arr = _.find(self.contactList1, function (item) {
                                            return info == item.contactid
                                        })
                                    })
                                    if (!arr) {
                                        self.selectedEvent.sms_contact_ids = [];
                                    }
                                }
                                if (self.contactList1.length == 0) {
                                    self.selectedEvent.sms_contact_ids = [];
                                }
                            });
                    }
                });
        }
        function displayWorkflowIcon() {
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                var resData = data.matter_apps;                                   //promise
                if (angular.isDefined(resData) && resData != '' && resData != ' ') {
                    self.is_workflow = (resData.workflow == 1) ? true : false;
                }
            });
        }

        $rootScope.$on('updateWorkflowIcons', function (updateworkflowIconevent) {
            displayWorkflowIcon();
        });

        /**
         * 
        sort options 
         */
        function getSortByLabel(sortBy) {
            if (utils.isEmptyVal(sortBy)) {
                return " - ";
            }

            var selSort = _.find(self.sorts, function (sort) {
                return sort.key == sortBy;
            });
            self.sortDESC = sortBy == 'desc';
            return selSort.name;
        }



        /**
         * 
         * sort options 
         */
        self.applySortByFilter = function (sortBy) {
            self.sortby = sortBy;
            localStorage.setItem('intakeEventSortBy', self.sortby);
            // reset selected event when sort is applied.
            self.selectedEvent = {};
            getEvents();
        }

        //US#8328 For set default value of Remind Me in Days & to show 180days , 1 & 2year options
        self.reminderDaysList = angular.copy(globalConstants.reminderDaysList);
        function setReminderDaysList(event) {
            if (event.label_id == 1) {
                self.reminderDaysList = angular.copy(globalConstants.SOLReminderDaysList);
            } else if (event.label_id != 1) {
                self.reminderDaysList = angular.copy(globalConstants.reminderDaysList);
            }
        }
        /*** Service call Functions ***/
        //Get events for selected matter        
        function getEvents() {
            self.migrate = localStorage.getItem('Migrated');
            //self.eventsList = [];
            intakeEventsDataService.getEvents(matterId, self.sortby)
                .then(function (response) {
                    self.EventisInList = false;
                    self.isDataAvailable = true;
                    //Store events list
                    var eventsList = _.unique(response.data.events, 'intake_event_id');
                    if (response.data.events == 0) {
                        self.selectedEvent = {};
                    }
                    _.forEach(eventsList, function (item) {
                        //US#11039
                        if (item.label_id == 100) {
                            item.name = 'Other';
                        } else if (item.label_id == 19) {
                            item.name = 'Personal Event';
                        } else if (item.label_id == 32) {
                            item.name = 'Deadline';
                        } else {
                            item.name = item.event_title;
                        }
                        item.event_display_name = (item.label_id == '100' || item.label_id == '19' || item.label_id == '32') ? item.event_title : item.name;

                        if (item.custom_reminder) {
                            item.custom_reminder = utils.isEmptyVal(item.custom_reminder) ? '' : moment.unix(item.custom_reminder).utc().format('MM-DD-YYYY');
                        }
                        if (item.sms_custom_reminder) {
                            item.sms_custom_reminder = utils.isEmptyVal(item.sms_custom_reminder) ? '' : moment.unix(item.sms_custom_reminder).utc().format('MM-DD-YYYY');
                        }

                    })
                    _.forEach(eventsList, function (e) {
                        if (utils.isNotEmptyVal(e.reminder_days)) {
                            e.reminder_days = e.reminder_days.split(',');
                        } else {
                            e.reminder_days = [];
                        }
                        if (utils.isNotEmptyVal(e.sms_reminder_days)) {
                            e.sms_reminder_days = e.sms_reminder_days.split(',');
                        } else {
                            e.sms_reminder_days = [];
                        }
                        e.sms_contact_ids = utils.isNotEmptyVal(e.sms_contact_ids) ? JSON.parse(e.sms_contact_ids) : [];
                        if (_.isArray(e.sms_contact_ids)) {
                            var arr = [];
                            _.forEach(e.sms_contact_ids, function (item) { arr.push(parseInt(item)) });
                            e.sms_contact_ids = arr;
                        }
                    });
                    if (self.selectedEvent && !_.isEmpty(self.selectedEvent)) {
                        var intakeEventId;
                        utils.isNotEmptyVal(self.selectedEvent.eventId) ? intakeEventId = self.selectedEvent.eventId : '';
                        utils.isNotEmptyVal(self.selectedEvent.intake_event_id) ? intakeEventId = self.selectedEvent.intake_event_id : '';
                        utils.isNotEmptyVal(self.selectedEvent.event_id) ? intakeEventId = parseInt(self.selectedEvent.event_id) : '';

                        _.forEach(response.data.events, function (d) {
                            if (d.intake_event_id == intakeEventId) {
                                self.selectedEvent = d;
                                self.EventisInList = true;
                                intakeEventsHelper.setSelectedEvent(self.selectedEvent);//Bug#8373
                                self.assigned_to_name = utils.isEmptyVal(self.selectedEvent.assign_to) ? '' : _.pluck(self.selectedEvent.assign_to, 'fullName').join(', ');
                            }
                        });
                    }
                    else {

                        var saveEvent = intakeEventsHelper.getSelectedEvent();
                        if (utils.isEmptyObj(saveEvent)) {
                            self.selectedEvent = eventsList[0];
                        }
                        else {
                            self.selectedEvent = saveEvent;
                        }
                        var eventsByYear = setEventList(eventsList);
                        self.selectedEvent = intakeEventsHelper.setSelectedEventFromList(eventsByYear);
                    }
                    self.eventsList = setEventList(eventsList);
                    if (!self.EventisInList) {
                        self.selectedEvent = angular.copy(eventsList[0]);
                        intakeEventsHelper.setSelectedEvent(self.selectedEvent);
                    }
                    if (utils.isNotEmptyVal(self.selectedEvent)) {
                        //get event history data for selected event 
                        getEventHistoryData(self.selectedEvent.intake_event_id);
                        setReminderDaysList(self.selectedEvent);
                        getEventRemindUser(self.selectedEvent);
                        self.assigned_to_name = utils.isEmptyVal(self.selectedEvent.assign_to) ? '' : _.pluck(self.selectedEvent.assign_to, 'fullName').join(', ');
                    }
                    var retainSText = JSON.parse(localStorage.getItem("retainSearchTextForIntake"));
                    if (utils.isNotEmptyVal(retainSText)) {
                        selectSearchedEvent();
                    }

                }, function (error) {
                    console.log('unable to fetch events');
                });
        }

        $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
            goToselectedEvent();
        });

        function goToselectedEvent() {
            // var eve = self.clikedevent;
            var eve = self.selectedEvent;
            if (!(utils.isEmptyObj(eve))) {
                var gotoYear = false;
                _.forEach(self.eventsList[eve.year], function (item, index) {
                    if (index == 0 && item.intake_event_id == eve.intake_event_id) {
                        gotoYear = true;
                    }
                });

                var container = $('#main-event'),
                    scrollTo = gotoYear ? $('#' + eve.year) : $('#x' + eve.intake_event_id);
                container.animate({
                    scrollTop: scrollTo.offset().top - $("#main-event").offset().top
                }, 100);
                //  console.log("inside");
            }
        }
        //US#8558 Event & Task reminder to matter users or all users
        function getEventRemindUser(event) {
            if (utils.isEmptyVal(event)) { return }
            if (event.reminder_users == "intake") {
                self.reminder_users_id = 1;
            } else if (event.reminder_users == "all") {
                self.reminder_users_id = 2;
            } else if (event.reminder_users && event.reminder_users.length > 0 && JSON.parse(event.reminder_users) instanceof Array) {
                self.reminder_users_id = 3;
                if (angular.isDefined(event.reminder_users) && event.reminder_users != "" && event.reminder_users != "all" && event.reminder_users != "intake") {
                } else {
                    self.selectedEvent.remind_users_temp = event.reminder_users;
                }
            }
            self.selectedEvent.remind_users_temp = [];
            if (event.reminder_users && event.reminder_users.length > 0) {
                if (self.reminder_users_id == 3) {
                    _.forEach(JSON.parse(event.reminder_users), function (taskid) {
                        _.forEach(self.assignedToUserList, function (item) {
                            if (taskid == item.user_id) {
                                self.selectedEvent.remind_users_temp.push(parseInt(taskid));
                            }
                        });
                    });
                }

            }
        }


        // }
        // set event list to show left side of the page
        function setEventList(eventList) {
            _.forEach(eventList, function (item) {
                item.start_date = angular.copy(item.start_date);
                item.end_date = angular.copy(item.end_date);
                item.year = (utils.isEmptyVal(item.start_date) || item.start_date == 0) ? "no date" :
                    (item.all_day == "1" ? moment.unix(item.start_date).utc().format('YYYY') :
                        moment.unix(item.start_date).format('YYYY'));

            });
            var uniqYears = _.uniq(_.pluck(eventList, 'year'));
            self.yearList = [];
            var newEventList = {}
            _.forEach(uniqYears, function (year) {
                self.yearList.push({ year: parseInt(year) });
                newEventList[year] = _.filter(eventList, function (event) {
                    return event.year === year;
                });
            });

            if (Object.keys(newEventList).length == 0) {
                newEventList = [];
            }
            return newEventList;
        }


        /*** Event Handlers ***/
        function selectEvent(event) {
            $('#eventDetails').scrollTop(0);
            self.selectedEvent = event;
            //US#8100 view assign to user
            self.assigned_to_name = utils.isEmptyVal(self.selectedEvent.assign_to) ? '' : _.pluck(self.selectedEvent.assign_to, 'fullName').join(', ');
            getEventRemindUser(event);
            setReminderDaysList(event);
            //get event history data for selected event
            getEventHistoryData(self.selectedEvent.intake_event_id);
            intakeEventsHelper.setSelectedEvent(event);
        }

        //get event history of selected event
        function getEventHistoryData(eventId) {

            intakeEventsDataService.getEventHistory(eventId, pageNumber, pageSize)
                .then(function (response) {
                    self.eventHistoryData = response.data;
                    if (utils.isEmptyObj(masterData.getMasterData())) {
                        var request = masterData.fetchMasterData();
                        $q.all([request]).then(function (values) {
                            $scope.eventReason = masterData.getMasterData().event_reschedule_reason;
                            setReason();
                        })
                    } else {
                        $scope.eventReason = masterData.getMasterData().event_reschedule_reason;
                        setReason();
                    }

                }, function (error) {
                    notificationService.error("Event history not loaded")
                })

        }

        function setReason() {
            _.forEach(self.eventHistoryData, function (data) {
                _.forEach(masterData.getMasterData().event_reschedule_reason, function (item) {
                    if (data.reason_name == null) {
                        data.reason_name = '-';
                    } else {
                        if (data.reason_name == item.reason_order) {
                            data.reason_name = item.reason_name;
                        }
                    }
                })
            });
        }

        //download event history data
        function exportEventHistory(eventHistory) {
            // intakeEventsDataService.downloadEventHistory(self.selectedEvent.intake_event_id);

            intakeEventsDataService.downloadEventHistory(self.selectedEvent.intake_event_id)
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


        // active class to show as selected on the UI
        function isSelected(event) {
            return self.selectedEvent.intake_event_id == event.intake_event_id;
        }

        // show event details
        function showEventDetails(selectedEvent) {
            if (angular.isUndefined(selectedEvent) || utils.isEmptyObj(selectedEvent)) {
                return false;
            }
            return true;
        }

        //retaintion of search value 
        function filterRetain() {
            var retainSText = JSON.parse(localStorage.getItem("retainSearchTextForIntake"));
            if (retainSText && self.intakeId != retainSText.intakeId) {
                $rootScope.retainSearchText = {};
            }
            $rootScope.retainSearchText.events_filtertext = self.searchEvent;
            $rootScope.retainSearchText.intakeId = self.intakeId;
            localStorage.setItem("retainSearchTextForIntake", JSON.stringify($rootScope.retainSearchText));
            selectSearchedEvent();
        }

        function selectSearchedEvent() {
            $timeout(function () {
                self.currentOrder = [];
                var main = document.getElementById('main-event');
                _.forEach(main.children, function (item) {
                    self.currentOrder.push(item.id);
                });

                if (utils.isNotEmptyVal(self.searchEvent)) {
                    var foundMatch = false;
                    _.forEach(self.currentOrder, function (itemYear) {
                        if (self[itemYear].filtered && self[itemYear].filtered.length > 0 && !foundMatch) {
                            self.selectedEvent = self[itemYear].filtered[0];
                            intakeEventsHelper.setSelectedEvent(self.selectedEvent);
                            foundMatch = true;
                        }
                    });
                    if (!foundMatch) {
                        self.selectedEvent = {};
                    }else{
                        selectEvent(self.selectedEvent);
                    }
                    
                } else {
                    var saveEvent = intakeEventsHelper.getSelectedEvent();
                    if (utils.isEmptyObj(saveEvent)) {
                        self.selectedEvent = self.eventsList[self.currentOrder[0]][0];
                    }
                    else {
                        self.selectedEvent = saveEvent;
                    }
                    intakeEventsHelper.setSelectedEvent(self.selectedEvent);
                };
                if (utils.isEmptyVal(self.selectedEvent)) { return }
                if (self.selectedEvent.reminder_users == "intake") {
                    self.reminder_users_id = 1;
                } else if (self.selectedEvent.reminder_users == "all") {
                    self.reminder_users_id = 2;
                } else if (self.selectedEvent.reminder_users && self.selectedEvent.reminder_users.length > 0 && JSON.parse(self.selectedEvent.reminder_users) instanceof Array) {
                    self.reminder_users_id = 3;
                    self.selectedEvent.remind_users_temp = [];
                    _.forEach(JSON.parse(self.selectedEvent.reminder_users), function (taskid, taskindex) {
                        _.forEach(self.assignedToUserList, function (item) {
                            if (taskid == item.user_id) {
                                self.selectedEvent.remind_users_temp.push(parseInt(taskid));
                            }
                        });
                    });
                }
            }, 100);
        }


        function addEditEvent(mode, data) {
            data = self.selectedEvent;
            if (mode == 'edit' && utils.isNotEmptyVal(data.start_date) && utils.isNotEmptyVal(data.end_date)) {
                var start = moment.unix(data.start_date).startOf("day");
                var end = moment.unix(data.end_date).startOf("day");
                if (end.diff(start, 'days', true) > 1) {
                    data.disableFullDay = true;
                } else {
                    data.disableFullDay = false;
                }
            }
            var resolveObj = {
                mode: mode,
                selectedEvent: mode === 'edit' ? data : undefined,
                assignedToUserList: self.assignedToUserList
            }
            // if (mode === 'edit') {
            //     if (self.eventsPermissions[0].E == 0) {
            //         notificationService.error(globalConstants.accessMgmtMessage + "edit events")
            //         return;
            //     }
            // }
            self.isDataAvailable = true;

            var modalInstance = openAddEditEventsModal(angular.copy(resolveObj));
            getEventsListAfterSuccess(modalInstance);
        }

        function openAddEditEventsModal(resolveObj) {
            return $modal.open({
                templateUrl: 'app/intake/events/partials/add-event.html',
                controller: 'intakeAddEditEventCtrl as addEditEvent',
                windowClass: 'eventDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    addEditEventsParams: function () {
                        return resolveObj;
                    },
                    sms_contactList: function () {
                        return self.contactList1;
                    }
                },
            });
        }

        function getEventsListAfterSuccess(modalInstance) {
            modalInstance.result.then(function (responseData) {
                self.addEditData = responseData;
                if (self.addEditData) {
                    self.selectedEvent = {};
                }
                getEvents();
            });
        }

        function deleteEvent(eventId) {

            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {

                intakeEventsDataService.deleteEvent(eventId)
                    .then(function () {
                        notificationService.success('Event deleted successfully!');
                        //self.eventsList = [];
                        //self.selectedEvent=eventsList[0];
                        self.selectedEvent = {};
                        self.addEditData = {};
                        getEvents();
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

        /*** Styling Functions ***/

        /*** Alert Functions ***/
        self.alert = {};

        function showAlert(item) {
            self.alert = item;
        };

        self.closeAlert = function () {
            self.alert = {};
        };

        function showEventClass(event) {
            if (event.is_deadline == 1) {
                if (event.is_comply == 1) {
                    return "circle-complied";
                } else {
                    return "circle-notcomplied";
                }
            } else {
                return "circle";
            }
        }

    }


})();

(function () {
    'use strict';

    angular
        .module('intake.events')
        .controller('intakeAddEditEventCtrl', intakeAddEditEventCtrl);

    intakeAddEditEventCtrl.$inject = ['$modalInstance', '$stateParams', 'intakeEventsDataService', 'masterData', 'addEditEventsParams', 'notification-service', 'globalConstants', 'intakeEventsHelper', 'intakeEventCronologyHelper', 'practiceAndBillingDataLayer', 'eventsDataService', '$q', 'sms_contactList', '$rootScope'];

    function intakeAddEditEventCtrl($modalInstance, $stateParams, intakeEventsDataService, masterData, addEditEventsParams, notificationService, globalConstants, intakeEventsHelper, intakeEventCronologyHelper, practiceAndBillingDataLayer, eventsDataService, $q, sms_contactList, $rootScope) {
        var pageMode;
        var matterId = $stateParams.intakeId;
        var self = this;
        self.event = {};
        self.open = openCalender;
        self.fullDayChanged = fullDayChanged;
        self.save = save;
        self.cancel = closeModal;
        self.selectTime = globalConstants.timeArray;
        self.showhideDates = showhideDates;
        self.getFormattedDateString = getFormattedDateString;
        self.isDatesValid = isDatesValid;
        self.setEndTime = setEndTime;
        self.reminderDaysList = angular.copy(globalConstants.reminderDaysList);
        self.setLocation = setLocation; //pointer to setLocation function
        self.formatEndDate = formatEndDate;
        self.addAssignedUser = addAssignedUser;
        self.removeAssignedUser = removeAssignedUser;
        self.calDays = calDays;
        self.setUserMode = setUserMode;
        self.cMessengerCheck = cMessengerCheck;

        //init
        (function () {
            init();

        })();

        function init() {
            //set event model
            pageMode = addEditEventsParams.mode;
            if (pageMode === 'edit') {
                addEditEventsParams.selectedEvent.utcstart = angular.isDefined(addEditEventsParams.selectedEvent.start_date) ? (addEditEventsParams.selectedEvent.start_date) : '';
                addEditEventsParams.selectedEvent.utcend = angular.isDefined(addEditEventsParams.selectedEvent.end_date) ? (addEditEventsParams.selectedEvent.end_date) : (addEditEventsParams.selectedEvent.start_date);
            }
            self.hideAssignTo = addEditEventsParams.hideAssignTo;
            self.assignedToUserList = addEditEventsParams.assignedToUserList ? addEditEventsParams.assignedToUserList : [];
            self.pageMode = pageMode; //assigned to use mode to hide/show elements
            var event = pageMode === 'edit' ? angular.copy(addEditEventsParams.selectedEvent) : {};
            setEventObject(event);
            // getcourtAddress();
            self.event = angular.copy(event);
            self.event.is_private = angular.isDefined(self.event.is_private) ? self.event.is_private : '0';
            self.event.all_day = angular.isDefined(self.event.all_day) ? self.event.all_day : 1;
            self.event.event_title = angular.isDefined(self.event.event_title) ? self.event.event_title : '';
            self.event.assignedUsers = self.event.assign_to;
            self.userSelectedType = [{ id: 1, name: 'Assigned to Intake' }, { id: 2, name: 'All Users' }, { id: 3, name: 'Select User' }];
            self.eventTypes = angular.copy(masterData.getEventTypes());
            addEditEventsParams.criticalDats == "ctdates" ? setEventTypesForCt(addEditEventsParams.LabelId) : '';
            setEventTypes();
            //set datepicker options
            self.dateFormat = 'MM/dd/yyyy';
            self.datepickerOptions = {
                formatYear: 'yyyy',
                startingDay: 1,
                'show-weeks': false,

            };
            self.contactList1 = sms_contactList;
            if (addEditEventsParams.fromOverview) {
                self.event.sms_contact_ids = utils.isNotEmptyVal(self.event.sms_contact_ids) ? _.isArray(self.event.sms_contact_ids) ? self.event.sms_contact_ids : JSON.parse(self.event.sms_contact_ids) : [];
                if (self.event.sms_contact_ids.length > 0) {
                    var array = [];
                    _.forEach(self.event.sms_contact_ids, function (item) {
                        array.push(parseInt(item));
                    })
                    self.event.sms_contact_ids = array;
                }
                if (self.contactList1.length > 0 && self.event.sms_contact_ids) {
                    _.forEach(self.contactList1, function (item) {
                        item.contactid = parseInt(item.contactid);
                    })
                    var arr;
                    _.forEach(self.event.sms_contact_ids, function (info) {
                        arr = _.find(self.contactList1, function (item) {
                            return info == item.contactid
                        })
                    })
                    if (!arr) {
                        self.event.sms_contact_ids = [];
                    }
                }
                if (self.contactList1.length == 0) {
                    self.event.sms_contact_ids = [];
                }
            }

            if (self.pageMode !== 'edit') {
                self.event.reminder_days = ['0'];
                self.event.sms_reminder_days = ['0'];
                self.event.contactList = [];
            }
            if (self.pageMode !== 'edit') {
                self.event.contactList = [];
                var user = { id: 1 };
                setUserMode(user);
            }
            if (self.pageMode == 'edit') {
                var obj = {};
                if (self.event.reminder_users == "intake") {
                    obj.id = 1;
                } else if (self.event.reminder_users == "all") {
                    obj.id = 2;
                } else if (angular.isDefined(self.event.reminder_users) && self.event.reminder_users != "all" && self.event.reminder_users != "intake") {
                    obj.id = 3;
                } else if (!angular.isDefined(self.event.reminder_users)) {
                    obj.id = 3;
                }
                setUserMode(obj);
            }
            if (pageMode != 'edit') {
                setCreateTaskFlag();
            } else {
                self.createTaskDisabled = self.event.assignedUsers && self.event.assignedUsers.length > 0 ? false : true;
            }

        }
        function cMessengerCheck() {
            if (!($rootScope.isSmsActiveUI)) {
                notificationService.error("To set SMS event reminders, please subscribe to Client Messenger in the Marketplace.");
            }
        }
        function setUserMode(user, showFocus) {
            if (user.id == 1) {
                self.reminder_users_id = user.id;
                self.event.remind_users_temp = "intake";
                self.event.reminder_users = "intake";
            } else if (user.id == 2) {
                self.reminder_users_id = user.id;
                self.event.remind_users_temp = "all";
                self.event.reminder_users = "all";
            } else if (user.id == 3) {
                self.reminder_users_id = user.id;
                if (angular.isDefined(self.event.reminder_users) && self.event.reminder_users != "" && self.event.reminder_users != "all" && self.event.reminder_users != "intake") {
                    self.event.remind_users_temp = self.event.reminder_users;
                } else {
                    self.event.remind_users_temp = [];
                    self.event.reminder_users = [];
                }
            }
            self.event.remind_users_temp = [];
            if (self.event.reminder_users && self.event.reminder_users.length > 0) {
                if (self.reminder_users_id == 3) {
                    _.forEach(JSON.parse(self.event.reminder_users), function (taskid, taskindex) {
                        _.forEach(self.assignedToUserList, function (item) {
                            if (taskid == item.user_id) {
                                self.event.remind_users_temp.push(parseInt(taskid));
                            }
                        });
                    });
                }
            }

            if (showFocus) {
                $(".userPicker input").focus();

            }

        };
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

        function setCreateTaskFlag() {
            if (angular.isDefined(appPermissions) && appPermissions != '' && appPermissions != ' ') {
                self.event.is_task_created = (appPermissions.DefaultTaskCreation == 1) ? 1 : 0;
            } else {
                self.event.is_task_created = 0;
            }
        }

        //Function to add Assigned users
        function addAssignedUser(userList) {
            self.event.assignedUsers = userList;
            self.createTaskDisabled = self.event.assignedUsers && self.event.assignedUsers.length > 0 ? false : true;
        }

        //Function to remove Assigned Users
        function removeAssignedUser(userList) {
            self.event.assignedUsers = userList;
            self.createTaskDisabled = self.event.assignedUsers && self.event.assignedUsers.length > 0 ? false : true;
        }

        //US#11117
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
                        self.event.all_day = 1;
                        self.event.disableFullDay = true;
                    } else {
                        self.event.all_day = 0;
                        self.event.disableFullDay = false;
                    }
                }
            }
        }

        function setEventTypesForCt(LabelId) {
            self.eventTypes = _.filter(self.eventTypes, function (eventTypes) {
                return eventTypes.LabelId == LabelId;
            });
            self.event.label_id = self.eventTypes[0].LabelId;
            showhideDates(self.event, self.pageMode);
            //On SOL Calender show 180 days, 1 Year and 2 years
            checkEventType(self.event.label_id);
        }

        //Bug#6211- For Invalid date format issue while edit event
        function formatEndDate(end_date) {
            var start_date = angular.copy(self.event.start_date);
            if (!moment(end_date, 'MM/DD/YYYY', true).isValid()) {
                self.event.end_date = moment(end_date).format('MM/DD/YYYY');
            }
        }

        /** US-5214 function to get court address to Location field*/
        function getcourtAddress() {
        }

        /** US-5214 function to auto populate court address to Location 
            field when event type is 'Trial ','Court Appearance' & 'Motion'*/
        function setLocation(eventid) {
            if ((eventid == '12' || eventid == '14' || eventid == '23' || eventid == '26') && (self.pageMode !== 'edit')) {
                self.event.location = self.courtAddress;
            } else if (self.pageMode !== 'edit') {
                self.event.location = '';
            }
            checkEventType(eventid);
        }

        /* US-4811 function to autoupdate end time to one hour as per the  start time is selected */
        function setEndTime(starttime) {
            var time = starttime.split(':');
            var newhour = parseInt(time[0]) + 1;
            self.event.end = ((newhour < 10) ? ('0' + newhour) : newhour) + ':' + time[1];
        }


        /*function to validate dates entered*/
        function isDatesValid() {
            if ($('#mtrevestartDateErr').css("display") == "block" ||
                $('#mtreveendDateErr').css("display") == "block" ||
                $('#customDateReminderdivErrForSMS').css("display") == "block" ||
                $('#customDateReminderdivErr').css("display") == "block") {
                return true;
            } else {
                return false;
            }
        }


        // prepare dates to display on the UI, when opening add/edit window
        function setEventObject(event) {
            // call factory to prepare object    
            intakeEventsHelper.formOpenSetDates(pageMode, event, addEditEventsParams);

            // preserve old event obj before user modifies and use this obj to check
            // whether user updated the event details or not
            self.existingEvent = angular.copy(event);
            //US#8328 for call 
            checkEventType(self.existingEvent.label_id);
        }

        //event handlers
        function openCalender($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            self.event[isOpened] = true; //isOpened is a string specifying the model name
        }

        function fullDayChanged(isFullDay) {
            if (isFullDay == '1') {

            }
        }

        //US#8328  to show 180days , 1 & 2year options
        function checkEventType(type) {
            //console.log(type);
            if (type == 1) {
                self.reminderDaysList = angular.copy(globalConstants.SOLReminderDaysList);
            } else if (type != 1) {
                self.reminderDaysList = angular.copy(globalConstants.reminderDaysList);
            }
        }

        function save(event) {

            var oldDate = moment(event.start_date).year();
            if (oldDate < 1970) {
                notificationService.error("Not Acceptable: Start or End date can not be negative");
                return;
            };
            //validate the custom reminder date before saving event
            if (event.custom_reminder) {
                var endDate = moment(new Date(event.end_date)).utc();
                var customDateReminder = moment(new Date(event.custom_reminder)).utc();
                if (endDate.isBefore(customDateReminder)) {
                    notificationService.error('The custom reminder date should not be greater than event date');
                    return;
                }
            }
            // sms_custom_reminder
            if (event.sms_custom_reminder) {
                var endDate = moment(new Date(event.end_date)).utc();
                var customDateReminder = moment(new Date(event.sms_custom_reminder)).utc();
                if (endDate.isBefore(customDateReminder)) {
                    notificationService.error('The custom reminder date should not be greater than event date');
                    return;
                }
            }
            event.is_task_created = event.assignedUsers && event.assignedUsers.length > 0 ? parseInt(event.is_task_created) : 0;
            if (event.private != 1) {
                if (event.reminder_users != "all" && event.reminder_users != "intake") {
                    if (event.reminder_users != null && event.remind_users_temp.length > 0) {
                        event.reminder_users = event.remind_users_temp;
                    } else {
                        notificationService.error("Please select at least one remind user");
                        return;
                    }

                }
            } else {
                if (event.reminder_users != "all" && event.reminder_users != "intake") {
                    if (event.reminder_users != null && event.remind_users_temp.length > 0) {
                        event.reminder_users = event.remind_users_temp;
                    } else {
                        notificationService.error("Please select at least one remind user");
                        return;
                    }

                }
                // event.reminder_users = event.remind_users_temp;
                //event.assigned_to = [];
                //delete event.assigned_to;
            }
            var newEvent = angular.copy(event);
            if (utils.isEmptyVal(newEvent.start_date) || utils.isEmptyVal(newEvent.start_date)) {
                notificationService.error("Invalid Date Range");
                return;
            }
            newEvent.intake_id = matterId;
            newEvent.assigned_to = newEvent.assignedUsers;
            setEventTitle(newEvent, self.eventTypes); //Set Event title
            intakeEventsHelper.setDates(newEvent); // set dates 

            // validate event start end dates
            if (!intakeEventsHelper.areDatesValid(newEvent)) {
                notificationService.error("End date time is before start date time");
                return;
            }
            //set reminder days
            if (newEvent.reminder_days != null) {
                newEvent.reminder_days = angular.isDefined(newEvent.reminder_days) ? newEvent.reminder_days.toString() : '';
            } else {
                newEvent.reminder_days = '';
            }
            if (newEvent.sms_reminder_days != null) {
                newEvent.sms_reminder_days = angular.isDefined(newEvent.sms_reminder_days) ? newEvent.sms_reminder_days.toString() : '';
            } else {
                newEvent.sms_reminder_days = '';
            }
            // US#5678- If event details are updated, then before saving event need to   // capture event update comments from user
            // For that pop up is provided with input field where user can enter comment
            // Then event will save

            if (intakeEventCronologyHelper.isEventUpdated(self.existingEvent, event) && pageMode === 'edit') {
                //check if start and end date is update or not
                if (event.start_date) {
                    event.start_date = moment(angular.copy(event.start_date)).format('MM/DD/YYYY');
                }
                if (
                    (self.existingEvent.start_date != event.start_date) || (self.existingEvent.end_date != event.end_date)
                    || ((self.existingEvent.all_day != event.all_day)
                        || ((self.existingEvent.start != event.start) || (self.existingEvent.end != event.end)))
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

                        //set event update reason from user input on event obj that we are saving
                        newEvent.reason = (utils.isEmptyVal(response.rescheduleId)) ? '' : response.rescheduleId;


                        // save event  
                        if (pageMode === 'edit') {
                            addEditEventsParams.criticalDats == "ctdates" ? $modalInstance.close(newEvent) : editEvents(newEvent);
                        } else {
                            addEditEventsParams.criticalDats == "ctdates" ? $modalInstance.close(newEvent) : saveEvents(newEvent);
                        }


                    }, function (error) {
                        notificationService.error('Could not save event..');
                    });
                } else {
                    if (pageMode === 'edit') {
                        newEvent.comments = "";
                        addEditEventsParams.criticalDats == "ctdates" ? $modalInstance.close(newEvent) : editEvents(newEvent);
                    } else {
                        addEditEventsParams.criticalDats == "ctdates" ? $modalInstance.close(newEvent) : saveEvents(newEvent);
                    }
                }

            } else {
                // set default value for update comments if no updates are there
                newEvent.comments = "";

                // save event
                if (pageMode === 'edit') {
                    addEditEventsParams.criticalDats == "ctdates" ? $modalInstance.close(newEvent) : editEvents(newEvent);
                } else {
                    //added for critical dates while adding matter
                    addEditEventsParams.criticalDats == "ctdates" ? $modalInstance.close(newEvent) : saveEvents(newEvent);
                }

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
            if (self.reminder_users_id == 3) {
                event.reminder_users = event.reminder_users.join();
            }
            var eventData = angular.copy(event);
            var RecordData = {
                label_id: eventData.label_id,
                event_title: eventData.event_title,
                intake_event_id: eventData.intake_event_id,
                custom_reminder: event.custom_reminder,
                sms_custom_reminder: event.sms_custom_reminder,
                all_day: eventData.all_day,
                start_date: eventData.start_date,
                end_date: eventData.end_date,
                is_private: eventData.is_private,
                location: eventData.location,
                description: eventData.description,
                intake_id: eventData.intake_id,
                comments: eventData.comments,
                is_comply: eventData.is_comply,
                user_id: eventData.user_id,
                assigned_to: _.pluck(eventData.assignedUsers, "userId"),
                assigned_taskid: eventData.assigned_taskid,
                remind_date: eventData.remind_date,
                reminder_days: (eventData.reminder_days) ? eventData.reminder_days : "",
                sms_reminder_days: (eventData.sms_reminder_days) ? eventData.sms_reminder_days : "",
                reminder_users_id: self.reminder_users_id,
                reminder_users: (eventData.reminder_users) ? (eventData.reminder_users).toString() : "",
                sms_contact_ids: (eventData.sms_contact_ids) ? (eventData.sms_contact_ids).toString() : "",
                is_task_created: event.is_task_created,
                reason: eventData.reason
            }

            intakeEventsDataService.updateEvent(RecordData.intake_event_id, RecordData)
                .then(function (data) {
                    if (data.status == 400) {
                        notificationService.error('Event has not been updated!');
                    } else {
                        notificationService.success('Event updated successfully!');
                    }
                    $modalInstance.close(false);
                }, function () {
                    notificationService.error('An error occurred. Please try later.');
                    $modalInstance.dismiss();
                });
        }

        function saveEvents(event) {
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
                event_title: eventData.event_title,
                all_day: eventData.all_day,
                custom_reminder: event.custom_reminder,
                sms_custom_reminder: event.sms_custom_reminder,
                start_date: eventData.start_date,
                end_date: eventData.end_date,
                assigned_to: _.pluck(eventData.assignedUsers, "userId"),
                //eventData.assignedUsers,
                is_private: eventData.is_private,
                location: eventData.location,
                description: eventData.description,
                intake_id: eventData.intake_id,
                is_comply: eventData.is_comply,
                remind_date: eventData.remind_date,
                reminder_days: (eventData.reminder_days) ? eventData.reminder_days : "",
                sms_reminder_days: (eventData.sms_reminder_days) ? eventData.sms_reminder_days : "",
                reminder_users_id: self.reminder_users_id,
                reminder_users: (eventData.reminder_users) ? (eventData.reminder_users).toString() : "",
                sms_contact_ids: (eventData.sms_contact_ids) ? (eventData.sms_contact_ids).toString() : "",
                is_task_created: event.is_task_created,
            }
            intakeEventsDataService.addEvent(RecordData)
                .then(function (data) {
                    if (data.status == 400) {
                        notificationService.error('Event has not been added!');
                    } else {
                        notificationService.success('Event added successfully!');
                    }

                    $modalInstance.close(data);
                }, function () {
                    notificationService.error('An error occurred. Please try later.');
                    $modalInstance.dismiss();
                });
        }


        function setEventTitle(event, categories) {
            var userDefinedId = globalConstants.userDefinedEventId;
            if (event.label_id != userDefinedId) {
                var assignedEventType = _.find(categories, function (cat) {
                    return cat.LabelId == event.label_id
                });

                if (utils.isNotEmptyVal(assignedEventType)) {
                    //   event.title = assignedEventType.Name; as the name was beign assigned to title
                }
            }
        }

        // close modal
        function closeModal(newEvent) {
            if (newEvent.reminder_days != null) {
                newEvent.reminder_days = angular.isDefined(newEvent.reminder_days) ? newEvent.reminder_days.toString() : '';
            } else {
                newEvent.reminder_days = '';
            }

            if (newEvent.sms_reminder_days != null) {
                newEvent.sms_reminder_days = angular.isDefined(newEvent.sms_reminder_days) ? newEvent.sms_reminder_days.toString() : '';
            } else {
                newEvent.sms_reminder_days = '';
            }
            $modalInstance.dismiss();
        }

        // show hide date selectore based on label type
        function showhideDates(event, pageMode, all_day, resetPrivate) {
            if (resetPrivate) {
                event.is_private = 0;
            }
            if (typeof (all_day) === "undefined" || all_day == null) {
                all_day = event.all_day;
            }
            intakeEventsHelper.showhideDates(event, pageMode, all_day);

            if (resetPrivate) {
                self.event.disableFullDay = false;
                if (moment.isDate(event.start_date)) {
                    event.end_date = utils.getFormattedDateString(event.start_date);
                } else {
                    event.end_date = utils.getFormattedDateString(new Date(event.start_date));
                }
            }

        }

        // get formatter string
        function getFormattedDateString(event) {
            var datestring = $('#mtrevestartDatediv').val();
            if (moment(datestring, "MM/DD/YYYY", true).isValid()) {
                event.end_date = utils.getFormattedDateString(event.start_date);
            }

            //}
        }

    }





})();

(function (angular) {
    angular
        .module('intake.events')
        .factory('intakeEventsHelper', intakeEventsHelper);

    intakeEventsHelper.$inject = ['globalConstants'];

    function intakeEventsHelper(globalConstants) {

        var selectedEvent = {};

        return {
            setSelectedEvent: _setSelectedEvent,
            getSelectedEvent: _getSelectedEvent,
            roundOffTime: roundOffTime,
            addZero: addZero,
            formOpenSetDates: formOpenSetDates,
            showhideDates: showhideDates,
            areDatesValid: areDatesValid,
            setDates: setDates,
            setSelectedEventFromList: _setSelectedEventFromList,
            setContactList: _setContactList
        }
        function _setContactList(data,intakeDetails,otherDetailsInfo,response) {
            var listDetails = [];
            if (otherDetailsInfo) {
                _.forEach(otherDetailsInfo, function (currentItem) {
                    if ((intakeDetails.intakeTypeId == 1 && intakeDetails.intakeSubTypeId == 1) || (intakeDetails.intakeTypeId == 1 && intakeDetails.intakeSubTypeId == 2)) {
                        if (utils.isNotEmptyVal(currentItem.mvaTreatment.hospPhysicianId) && currentItem.mvaTreatment.hospPhysicianId != undefined) {
                            var dataMvaTreatment = currentItem.mvaTreatment.hospPhysicianId;
                            var fname = dataMvaTreatment.first_name ? dataMvaTreatment.first_name : "";
                            var lname = dataMvaTreatment.last_name ? dataMvaTreatment.last_name : "";
                            var fullname = fname + " " + lname;
                            var obj = {
                                'contactid': dataMvaTreatment.contact_id,
                                'name': fullname
                            }
                            listDetails.push(obj)
                        }
                    }
                    if ((intakeDetails.intakeTypeId == 1 && intakeDetails.intakeSubTypeId == 1)) {
                        if (utils.isNotEmptyVal(currentItem.automobileOtherDetails) && utils.isNotEmptyVal(currentItem.automobileOtherDetails.insuredParty) && currentItem.automobileOtherDetails.insuredParty != undefined) {
                            var dataAutoOtherDetails = currentItem.automobileOtherDetails.insuredParty;
                            var fname = dataAutoOtherDetails.first_name ? dataAutoOtherDetails.first_name : "";
                            var lname = dataAutoOtherDetails.last_name ? dataAutoOtherDetails.last_name : "";
                            var fullname = fname + " " + lname;
                            var obj = {
                                'contactid': dataAutoOtherDetails.contact_id,
                                'name': fullname
                            }
                            listDetails.push(obj)
                        }
                    }
                    if ((intakeDetails.intakeTypeId == 2)) {
                        if (utils.isNotEmptyVal(currentItem.MedMal) && utils.isNotEmptyVal(currentItem.MedMal.insuranceProviderId) && currentItem.MedMal.insuranceProviderId != undefined) {
                            var dataMedMal = currentItem.MedMal.insuranceProviderId;
                            var fname = dataMedMal.first_name ? dataMedMal.first_name : "";
                            var lname = dataMedMal.last_name ? dataMedMal.last_name : "";
                            var fullname = fname + " " + lname;
                            var obj = {
                                'contactid': parseInt(dataMedMal.contact_id),
                                'name': fullname
                            }
                            listDetails.push(obj)
                        }
                    }


                    if ((intakeDetails.intakeTypeId == 1 && intakeDetails.intakeSubTypeId == 1) || (intakeDetails.intakeTypeId == 1 && intakeDetails.intakeSubTypeId == 2) || (intakeDetails.intakeTypeId == 2)) {


                    } else {
                        //Hospital
                        if (utils.isNotEmptyVal(currentItem.details) && utils.isNotEmptyVal(currentItem.details.hospital) && currentItem.details.hospital != undefined) {
                            var dataHospitalDetails = currentItem.details.hospital;
                            var fname = dataHospitalDetails.first_name ? dataHospitalDetails.first_name : "";
                            var lname = dataHospitalDetails.last_name ? dataHospitalDetails.last_name : "";
                            var fullname = fname + " " + lname;
                            var obj = {
                                'contactid': dataHospitalDetails.contact_id,
                                'name': fullname
                            }
                            listDetails.push(obj)
                        }
                        //physician
                        if (utils.isNotEmptyVal(currentItem.details) && utils.isNotEmptyVal(currentItem.details.physician) && currentItem.details.physician != undefined) {
                            var dataPhysicianDetails = currentItem.details.physician;
                            var fname = dataPhysicianDetails.first_name ? dataPhysicianDetails.first_name : "";
                            var lname = dataPhysicianDetails.last_name ? dataPhysicianDetails.last_name : "";
                            var fullname = fname + " " + lname;
                            var obj = {
                                'contactid': dataPhysicianDetails.contact_id,
                                'name': fullname
                            }
                            listDetails.push(obj)
                        }
                        if (utils.isNotEmptyVal(currentItem.details) && utils.isNotEmptyVal(currentItem.details.witnessNameListForDetails) && currentItem.details.witnessNameListForDetails != undefined) {
                            _.forEach(currentItem.details.witnessNameListForDetails, function (item, index) {
                                var datawitnessNameListDetails = item.name;
                                var fname = datawitnessNameListDetails.first_name ? datawitnessNameListDetails.first_name : "";
                                var lname = datawitnessNameListDetails.last_name ? datawitnessNameListDetails.last_name : "";
                                var fullname = fname + " " + lname;
                                var obj = {
                                    'contactid': datawitnessNameListDetails.contact_id,
                                    'name': fullname
                                }
                                listDetails.push(obj)
                            });

                        }
                    }
                });
            }
            //automobileOtherDetails
            var fname = data.firstName ? data.firstName : "";
            var lname = data.lastName ? data.lastName : "";
            var fullname = fname + " " + lname;
            var obj = {
                'contactid': data.contactId,
                'name': fullname
            }
            listDetails.push(obj)
            //Employer contacts
            // if ((intakeDetails.intakeTypeId == 1 && intakeDetails.intakeSubTypeId == 1) || (intakeDetails.intakeTypeId == 1 && intakeDetails.intakeSubTypeId == 4) || (intakeDetails.intakeTypeId == 2) ){
            if (utils.isNotEmptyVal(response[0].intakeEmployer) && response[0].intakeEmployer != undefined) {
                _.forEach(response[0].intakeEmployer, function (item, index) {
                    var dataEmployee = item.contact;
                    var fname = dataEmployee.firstName ? dataEmployee.firstName : "";
                    var lname = dataEmployee.lastName ? dataEmployee.lastName : "";
                    var fullname = fname + " " + lname;
                    var obj = {
                        'contactid': dataEmployee.contactId,
                        'name': fullname
                    }
                    listDetails.push(obj)
                })
            }
            //poaContact
            if (utils.isNotEmptyVal(response[0].poa) && response[0].poa != undefined) {
                var dataPoa = response[0].poa;
                var fname = dataPoa.firstName ? dataPoa.firstName : "";
                var lname = dataPoa.lastName ? dataPoa.lastName : "";
                var fullname = fname + " " + lname;
                var obj = {
                    'contactid': dataPoa.contactId,
                    'name': fullname
                }
                listDetails.push(obj)
            }
            // estateAdminIdContact
            if (utils.isNotEmptyVal(response[0].estateAdminId) && response[0].estateAdminId != undefined) {
                var dataEstateAdmin = response[0].estateAdminId;
                var fname = dataEstateAdmin.firstName ? dataEstateAdmin.firstName : "";
                var lname = dataEstateAdmin.lastName ? dataEstateAdmin.lastName : "";
                var fullname = fname + " " + lname;
                var obj = {
                    'contactid': dataEstateAdmin.contactId,
                    'name': fullname
                }
                listDetails.push(obj)
            }
            //EducationContact
            if (utils.isNotEmptyVal(response[0].studentInstitution) && response[0].studentInstitution != undefined) {
                var dataEducation = response[0].studentInstitution;
                var fname = dataEducation.firstName ? dataEducation.firstName : "";
                var lname = dataEducation.lastName ? dataEducation.lastName : "";
                var fullname = fname + " " + lname;
                var obj = {
                    'contactid': dataEducation.contactId,
                    'name': fullname
                }
                listDetails.push(obj)
            }
            // Hospital
            if (utils.isNotEmptyVal(response[0].studentInstitution) && response[0].studentInstitution != undefined) {
                var dataEducation = response[0].studentInstitution;
                var fname = dataEducation.firstName ? dataEducation.firstName : "";
                var lname = dataEducation.lastName ? dataEducation.lastName : "";
                var fullname = fname + " " + lname;
                var obj = {
                    'contactid': dataEducation.contactId,
                    'name': fullname
                }
                listDetails.push(obj)
            }




            // }
            if ((intakeDetails.intakeTypeId == 1 && intakeDetails.intakeSubTypeId == 1) || (intakeDetails.intakeTypeId == 1 && intakeDetails.intakeSubTypeId == 2)) {
                //WitnessesContact
                if (utils.isNotEmptyVal(response[0].intakeWitnesses) && response[0].intakeWitnesses != undefined) {
                    _.forEach(response[0].intakeWitnesses, function (item, index) {
                        var dataWitnessContact = item.contact;
                        var fname = dataWitnessContact.firstName ? dataWitnessContact.firstName : "";
                        var lname = dataWitnessContact.lastName ? dataWitnessContact.lastName : "";
                        var fullname = fname + " " + lname;
                        var obj = {
                            'contactid': dataWitnessContact.contactId,
                            'name': fullname
                        }
                        listDetails.push(obj)
                    })
                }
            }

            if ((intakeDetails.intakeTypeId == 1 && intakeDetails.intakeSubTypeId == 1) || (intakeDetails.intakeTypeId == 1 && intakeDetails.intakeSubTypeId == 2)) {
                // intakeMedicalRecordsContact
                if (utils.isNotEmptyVal(response[0].intakeMedicalRecords) && response[0].intakeMedicalRecords != undefined) {
                    _.forEach(response[0].intakeMedicalRecords[0].intakeMedicalProviders, function (medicalRecord, index) {
                        var dataMedicalProvider = medicalRecord.medicalProviders;
                        var fname = dataMedicalProvider.firstName ? dataMedicalProvider.firstName : "";
                        var lname = dataMedicalProvider.lastName ? dataMedicalProvider.lastName : "";
                        var fullname = fname + " " + lname;
                        var obj = {
                            'contactid': dataMedicalProvider.contactId,
                            'name': fullname
                        }
                        listDetails.push(obj)

                    })
                    _.forEach(response[0].intakeMedicalRecords[0].intakeMedicalProviders, function (physici, index) {
                        var dataPhysician = physici.physician;
                        var fname = dataPhysician.firstName ? dataPhysician.firstName : "";
                        var lname = dataPhysician.lastName ? dataPhysician.lastName : "";
                        var fullname = fname + " " + lname;
                        var obj = {
                            'contactid': dataPhysician.contactId,
                            'name': fullname
                        }
                        listDetails.push(obj)
                    })
                }
            }
            //insuranceInfos
            if (utils.isNotEmptyVal(response[0].insuranceInfos) && response[0].insuranceInfos != undefined) {
                _.forEach(response[0].insuranceInfos, function (InsuranceInfo, index) {
                    _.forEach(InsuranceInfo.insuredParty, function (InsuranceInfo1, index) {
                        var dataInsuranceInfo1 = InsuranceInfo1;
                        var fname = dataInsuranceInfo1.firstName ? dataInsuranceInfo1.firstName : "";
                        var lname = dataInsuranceInfo1.lastName ? dataInsuranceInfo1.lastName : "";
                        var fullname = fname + " " + lname;
                        var obj = {
                            'contactid': dataInsuranceInfo1.contactId,
                            'name': fullname
                        }
                        listDetails.push(obj)

                    });
                    if (utils.isNotEmptyVal(InsuranceInfo.insuranceProvider) && InsuranceInfo.insuranceProvider != undefined) {

                        var datainsuranceProvider = InsuranceInfo.insuranceProvider;
                        var fname = datainsuranceProvider.firstName ? datainsuranceProvider.firstName : "";
                        var lname = datainsuranceProvider.lastName ? datainsuranceProvider.lastName : "";
                        var fullname = fname + " " + lname;
                        var obj = {
                            'contactid': datainsuranceProvider.contactId,
                            'name': fullname
                        }
                        listDetails.push(obj)

                    }
                    if ((intakeDetails.intakeTypeId == 1 && intakeDetails.intakeSubTypeId == 1)) {
                        if (utils.isNotEmptyVal(InsuranceInfo.adjuster) && InsuranceInfo.adjuster != undefined) {
                            var dataAdjuster = InsuranceInfo.adjuster;
                            var fname = dataAdjuster.firstName ? dataAdjuster.firstName : "";
                            var lname = dataAdjuster.lastName ? dataAdjuster.lastName : "";
                            var fullname = fname + " " + lname;
                            var obj = {
                                'contactid': dataAdjuster.contactId,
                                'name': fullname
                            }
                            listDetails.push(obj)
                        }
                    }
                })
            }
            return listDetails;
        }
        function _setSelectedEvent(event) {
            selectedEvent = event;
        }

        function _getSelectedEvent() {
            return selectedEvent;
        }

        //to set current time in the dropdown we need to round the current time
        //dropdown displays time with an interval of 30 min
        //therfore we round off the current time accordingly

        // round of the current time to set +30 minutes
        function roundOffTime(action) {
            var coeff = 1000 * 60 * 15;
            var date = new Date(); //or use any other date
            if (action == 'start') {
                date.setMinutes(date.getMinutes() + 15);
            } else if (action == 'end') {
                date.setMinutes(date.getMinutes() + 30);

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

        // add Minuts 
        function addMinuts(i) {
            if (i < 10) {
                i = "0" + i;
            }
            return i;
        }

        // set dates before sending to API
        function formOpenSetDates(pageMode, event, addEditEventsParams) {
            if (pageMode === 'edit') {
                event.label_id = (event.label_id) ? event.label_id.toString() : "0";
                // if allday event set current
                if (event.all_day == 1) {
                    showhideDates(event, pageMode);
                    if (utils.isNotEmptyVal(event.matterid)) {
                        event.start = roundOffTime('start');
                        event.end = roundOffTime('end');
                    }
                } else {
                    showhideDates(event, pageMode);
                    //convert to date object
                    //date recieved is utc string, we require date object to bind with input type date

                    var startdt = new Date(moment.unix(event.start_date));
                    var enddt = new Date(moment.unix(event.end_date));
                    event.start = addZero(startdt.getHours()) + ':' + addZero(startdt.getMinutes());
                    event.end = addZero(enddt.getHours()) + ':' + addZero(enddt.getMinutes());
                }
                if (utils.isNotEmptyVal(event.custom_reminder)) {
                    event.custom_reminder = (utils.isEmptyVal(event.custom_reminder)) ? "" : event.custom_reminder;
                    if (moment(event.custom_reminder, 'MM-DD-YYYY').isValid() == false) {
                        event.custom_reminder = moment.unix(event.custom_reminder).utc().format('MM-DD-YYYY');
                    }
                    event.custom_reminder = (event.custom_reminder.split('-').join('/'));
                }
                if (utils.isNotEmptyVal(event.sms_custom_reminder)) {
                    event.sms_custom_reminder = (utils.isEmptyVal(event.sms_custom_reminder)) ? "" : event.sms_custom_reminder;
                    if (moment(event.sms_custom_reminder, 'MM-DD-YYYY').isValid() == false) {
                        event.sms_custom_reminder = moment.unix(event.sms_custom_reminder).utc().format('MM-DD-YYYY');
                    }
                    event.sms_custom_reminder = (event.sms_custom_reminder.split('-').join('/'));
                }
                if (utils.isValidDateRange(event.start_date, event.end_date)) {
                    var start = event.start_date,
                        end = event.end_date;

                    event.start_date = utils.setFulldayTime(event.start_date, 'start');
                    event.end_date = (start === end) ?
                        event.start_date :
                        utils.setFulldayTime(event.end_date, 'end');

                    event.start_date = moment.unix(event.start_date).format('MM/DD/YYYY');
                    event.end_date = moment.unix(event.end_date).format('MM/DD/YYYY');
                } else {
                    event.start_date = moment.unix(event.start_date).format('MM/DD/YYYY');
                    event.end_date = moment.unix(event.end_date).format('MM/DD/YYYY');
                }

            } else { // Add event

                /*set default values of event start and end time */
                event.start = '09:00';
                event.end = '10:00';
                // set current date as start date
                event.start_date = moment().format('MM/DD/YYYY');
                // set current date as end date
                event.end_date = moment().format('MM/DD/YYYY');
            }
        }

        // show hide date selectore based on label type
        function showhideDates(event, pageMode, all_day) {

            var fulldayEventsIds = globalConstants.fulldayEvents;
            var isCritical = fulldayEventsIds.indexOf(parseInt(event.label_id)) > -1;
            var isFullDayEvent = (isCritical || all_day == 1);
            event.criticalDatesClicked = isCritical;
            if (isFullDayEvent) {
                event.all_day = 1;
                //ck check this if-else
                if (pageMode == 'edit') {
                    event.end_date = event.end_date;
                } else {
                    event.end_date = moment(event.end_date).format('MM/DD/YYYY');
                }
            } else {
                event.start = '09:00';
                event.end = '10:00';
                if (pageMode != 'edit') {
                    event.all_day = 0;
                }
            }

            if (event.label_id == "100" || event.label_id == "19" || event.label_id == "32") {
                event.userdefined = 1;
            } else {
                event.userdefined = 0;
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
                return end.isAfter(start);
            }
            return end.isAfter(start);
        }

        // prepare dates before sending to API
        function setDates(event) {

            //date converted to timestamp
            event.start_date = new Date(event.start_date);
            event.end_date = new Date(event.end_date);
            event.custom_reminder = (utils.isEmptyVal(event.custom_reminder)) ? '' : utils.getUTCTimeStamp(event.custom_reminder);
            event.sms_custom_reminder = (utils.isEmptyVal(event.sms_custom_reminder)) ? '' : utils.getUTCTimeStamp(event.sms_custom_reminder);
            //check if event is an all day event, if all day event form utc considering only date and no time
            //start_date, utcnend  prop has date and start/end prop has time
            event.start = event.all_day == '1' ? formTimestamp(event.start_date, event.start, true, 'start') :
                formTimestamp(event.start_date, event.start, false);

            event.end = event.all_day == '1' ? formTimestamp(event.end_date, event.end, true, 'end') :
                formTimestamp(event.end_date, event.end, false);
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

        //Set the selected event from the event list passed as array
        function _setSelectedEventFromList(eventListArray) {
            var keys = Object.keys(eventListArray);
            if (keys.length > 0) {
                return eventListArray[keys[0]][0];
            } else {
                return "";
            }
        }
    }

})(angular);

(function (angular) {
    angular
        .module('intake.events')
        .factory('intakeEventCronologyHelper', intakeEventCronologyHelper);

    intakeEventCronologyHelper.$inject = ['$modal'];

    function intakeEventCronologyHelper($modal) {
        return {
            openEventRemarkPopup: _openEventRemarkPopup,
            isEventUpdated: _isEventUpdated,
            setUpdatedCalEvent: _setUpdatedCalEvent
        }

        function _openEventRemarkPopup(data) {
            return $modal.open({
                templateUrl: 'app/intake/events/partials/eventUpdateBox.html',
                controller: ['$scope', '$modalInstance', 'masterData', '$q', function ($scope, $modalInstance, masterData, $q) {
                    if (utils.isEmptyObj(masterData.getMasterData())) {
                        var request = masterData.fetchMasterData();
                        $q.all([request]).then(function (values) {
                            $scope.eventReason = values[0].event_reschedule_reason;
                        })
                    } else {
                        $scope.eventReason = masterData.getMasterData().event_reschedule_reason;
                    }

                    //set bydefault value of reason
                    $scope.defaultReason = 1;
                    if (data == true) {
                        $scope.reason = data;
                    }
                    $scope.updateRemark = "";

                    $scope.setEventId = '1';
                    $scope.setEvent = function (eventId) {
                        $scope.setEventId = eventId.reason_order;
                    }

                    $scope.eventUpdate = {};

                    //save remark and reason
                    $scope.saveRemark = function () {
                        if ($scope.reason == true) {
                            $scope.rescheduleId = $scope.setEventId;
                            $scope.eventUpdate.rescheduleId = $scope.rescheduleId;
                        }
                        $scope.eventUpdate.updateRemark = $scope.updateRemark;
                        $modalInstance.close($scope.eventUpdate);
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
        function _isEventUpdated(oldEvt, updatedEvt) {
            var oldEvtCustRem = (moment(oldEvt.custom_reminder, 'MM-DD-YYYY').isValid()) ? utils.getUTCTimeStamp(oldEvt.custom_reminder) : oldEvt.custom_reminder;
            var updatedCustRem = (moment(updatedEvt.custom_reminder, 'MM-DD-YYYY').isValid()) ? utils.getUTCTimeStamp(updatedEvt.custom_reminder) : updatedEvt.custom_reminder;

            var oldEvtCustRemForSMS = (moment(oldEvt.sms_custom_reminder, 'MM-DD-YYYY').isValid()) ? utils.getUTCTimeStamp(oldEvt.sms_custom_reminder) : oldEvt.sms_custom_reminder;
            var updatedCustRemForSMS = (moment(updatedEvt.sms_custom_reminder, 'MM-DD-YYYY').isValid()) ? utils.getUTCTimeStamp(updatedEvt.sms_custom_reminder) : updatedEvt.sms_custom_reminder;
            if (oldEvt.is_private != updatedEvt.is_private || oldEvt.all_day != updatedEvt.all_day ||
                oldEvt.start != updatedEvt.start || oldEvt.end != updatedEvt.end ||
                oldEvt.start_date != updatedEvt.start_date || oldEvt.end_date != updatedEvt.end ||
                //oldEvt.start_date != updatedEvt.start_date || oldEvt.end_date != updatedEvt.end_date || sms_reminder_days
                oldEvt.is_comply != updatedEvt.is_comply || oldEvt.name != updatedEvt.name || oldEvt.location != updatedEvt.location || oldEvt.reminder_days.toString() != updatedEvt.reminder_days.toString() || oldEvt.sms_reminder_days.toString() != updatedEvt.sms_reminder_days.toString() || oldEvt.intake_id != updatedEvt.intake_id || oldEvtCustRem != updatedCustRem || oldEvtCustRemForSMS != updatedCustRemForSMS) {
                return true;
            } else {
                return false;
            }
        }

        //set event obj to check event update
        function _setUpdatedCalEvent(existingEvent, evtUpdatedObj) {
            existingEvent.start = moment(existingEvent.start).unix();
            existingEvent.end = moment(existingEvent.end).unix();
            evtUpdatedObj.start_date = moment(evtUpdatedObj.start_date).unix();
            evtUpdatedObj.end_date = moment(evtUpdatedObj.end_date).unix();
            evtUpdatedObj.reminder_days = evtUpdatedObj.reminder_days.split(',');
            evtUpdatedObj.sms_reminder_days = evtUpdatedObj.sms_reminder_days.split(',');
            if (evtUpdatedObj.all_day == '1') {
                existingEvent.start = evtUpdatedObj.start;
                existingEvent.end = evtUpdatedObj.end;
            }
            existingEvent.location = utils.isEmptyVal(existingEvent.location) ? "" : existingEvent.location;
            evtUpdatedObj.location = utils.isEmptyVal(evtUpdatedObj.location) ? "" : evtUpdatedObj.location; //Bug#6159
        }

    }


})(angular);

angular.module('intake.events')
    .factory('intakeTaskSummaryDataLayer', intakeTaskSummaryDataLayer);

intakeTaskSummaryDataLayer.$inject = ['$q', '$http', 'globalConstants'];

function intakeTaskSummaryDataLayer($q, $http, globalConstants) {

    var baseUrl = globalConstants.webServiceBase;

    var taskSummaryUrl = baseUrl + 'reports/task_status_summary.json';
    var taskSummaryCountUrl = baseUrl + 'reports/task_status_summary_count.json';

    var assignedUserUrl = globalConstants.intakeServiceBaseV2 + 'staffsinfirm';
    var exportUrl = baseUrl + 'reports/report.json';


    function getParams(params) {
        var querystring = "";
        angular.forEach(params, function (value, key) {
            querystring += key + "=" + value;
            querystring += "&";
        });
        return querystring.slice(0, querystring.length - 1);
    }

    return {
        getTaskSummaryData: getTaskSummaryData,
        getTaskSummaryCount: getTaskSummaryCount,
        exportTaskSummary: exportTaskSummary,
        getAssignedUserData: getAssignedUserData

    }

    function exportTaskSummary(requestFilters) {
        var url = exportUrl;

        url += '?reportname=TaskSummary&filename=Report_task_summary.xlsx&type=excel';
        url += "&" + utils.getParams(requestFilters);
        var download = window.open(url, '_self');
    }

    function getTaskSummaryCount(requestFilters) {
        var url = taskSummaryCountUrl;
        url += '?' + getParams(requestFilters);
        return $http.get(url);
    }

    function getTaskSummaryData(requestFilters) {
        var url = taskSummaryUrl;
        url += '?' + getParams(requestFilters);
        var deferred = $q.defer();
        $http({
            url: url,
            method: "GET",
            withCredentials: true
        }).success(function (response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    }

    function getAssignedUserData(requestFilters) {

        var token = {
            'Authorization': "Bearer " + localStorage.getItem('accessToken'),
            'Content-type': 'application/json'
        }
        var url = assignedUserUrl;
        var deferred = $q.defer();
        $http({
            url: url,
            method: "GET",
            withCredentials: true,
            headers: token
        }).success(function (response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    }

}


(function (angular) {

    angular.module('intake.events')
        .factory('intakeTaskAgeDatalayer', intakeTaskAgeDatalayer);

    intakeTaskAgeDatalayer.$inject = ['$http', 'globalConstants'];

    function intakeTaskAgeDatalayer($http, globalConstants) {

        var urls = {
            taskAgeData: globalConstants.webServiceBase + 'reports/taskage?',
            taskAgeDataCount: globalConstants.webServiceBase + 'reports/taskage_count?',
            getUsers: globalConstants.intakeServiceBaseV2 + 'staffsinfirm',
            exportReport: globalConstants.webServiceBase + 'reports/report.json?reportname=TaskAge&filename=Task_Age_Report.xlsx&type=excel&'
        };

        return {
            getTaskAgeData: _getTaskAgeData,
            getTaskAgeCount: _getTaskAgeDataCount,
            getUsersInFirm: _getUsersInFirm,
            exportReport: _exportReport
        };

        function _getTaskAgeData(filters) {
            var url = urls.taskAgeData + utils.getParams(filters);
            return $http.get(url);
        }

        function _getTaskAgeDataCount(filters) {
            var url = urls.taskAgeDataCount + utils.getParams(filters);
            return $http.get(url);
        }

        function _getUsersInFirm() {
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }

            var url = urls.getUsers;
            //  return $http.get(url);
            return $http.get(url,
                {
                    withCredentials: true,
                    headers: token
                });
        }


        function _exportReport(filter) {
            var url = urls.exportReport + utils.getParams(filter);
            var download = window.open(url, '_self');
        }

    }

})(angular);
