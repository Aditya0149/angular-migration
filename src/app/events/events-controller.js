(function () {

    'use strict';

    angular
        .module('cloudlex.events')
        .controller('EventsCtrl', EventsController);

    EventsController.$inject = ['$scope', '$timeout', 'eventsDataService', 'eventsHelper', '$stateParams', '$modal',
        'notification-service', 'globalConstants', 'modalService', 'matterFactory', '$rootScope', 'masterData', 'practiceAndBillingDataLayer', 'contactFactory', 'mailboxDataService', 'allPartiesDataService', 'newSidebarDataLayer'
    ];

    function EventsController($scope, $timeout, eventsDataService, eventsHelper, $stateParams, $modal,
        notificationService, globalConstants, modalService, matterFactory, $rootScope, masterData, practiceAndBillingDataLayer, contactFactory, mailboxDataService, allPartiesDataService, newSidebarDataLayer) {

        var self = this;
        self.matterId = $stateParams.matterId;
        var matterId = $stateParams.matterId;

        self.loaderFlagStatus = false;
        self.eventsList = []; //Data model for holding list of matter notes        
        self.eventToBeAdded = {}; //Data model for holding new note details		
        self.searchEvent = "";
        self.selectedEvent = {};
        self.eventHistoryData = [];

        self.showEventDetails = showEventDetails;

        /*** Event Handlers ***/
        self.selectEvent = selectEvent;
        self.addEditEvent = addEditEvent;
        self.matterCollaborationEditEvent = matterCollaborationEditEvent;
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
        self.firmData = { API: "PHP", state: "mailbox" };
        self.firmData = JSON.parse(localStorage.getItem('firmSetting'));
        self.allfirmData = JSON.parse(localStorage.getItem('allFirmSetting'));
        _.forEach(self.allfirmData, function (item) {
            if (item.state == "entity_sharing") {
                self.isCollaborationActive = (item.enabled == 1) ? true : false;
            }
        });
        self.firmID = gracePeriodDetails.firm_id;
        self.isClientPortal = gracePeriodDetails.client_portal; //US#5554


        //US#5678-  page filters for event history grid data
        var pageNumber = 1;
        var pageSize = 1000;
        self.exportEventHistory = exportEventHistory; //US#5678-download event history
        self.userSelectedType = [{ id: 1, name: 'Assigned to Matter' }, { id: 2, name: 'All Users' }, { id: 3, name: 'Select User' }];

        self.matterInfo = matterFactory.getMatterData(self.matterId);
        self.collaboratedEntityFlag = false;
        self.getSingleEventData = getSingleEventData;


        (function () { //Get events

            self.eventSortRetain = 'eventSortRetain' + self.matterId;
            displayWorkflowIcon();
            getUserEmailSignature();
            eventsDataService.getStaffsInFirm()
                .then(function (data) {
                    self.users = data;
                    //check for any selected event from any previous page
                    var selectedEvent = eventsHelper.getSelectedEvent();
                    if (selectedEvent && selectedEvent.entityTypeName == 'Event') {
                        self.entityKey = selectedEvent.entitykey;
                    }
                    self.clikedevent = selectedEvent;
                    if (!utils.isEmptyObj(selectedEvent)) {
                        self.selectedEvent = selectedEvent;
                    }

                    self.sorts = [
                        { key: 'DESC', name: "Most Recent" },
                        { key: 'ASC', name: "Oldest First" }
                    ];
                    self.sortby = utils.isNotEmptyVal(sessionStorage.getItem(self.eventSortRetain)) ? sessionStorage.getItem(self.eventSortRetain) : "DESC";
                    self.sortDESC = self.sortby == 'DESC';
                    getEvents();
                }, function (err) {
                });

            matterFactory.setBreadcrumWithPromise(self.matterId, 'Events').then(function (resultData) {
                self.matterInfo = resultData;
                getContactsAndEmails(matterId);

            });

            var retainSText = JSON.parse(sessionStorage.getItem("retainSearchText"));
            if (utils.isNotEmptyVal(retainSText)) {
                if (self.matterId == retainSText.matterid) {
                    self.searchEvent = retainSText.events_filtertext;
                }
            }
        })();

        self.getContactsAndEmails = getContactsAndEmails;
        function getContactsAndEmails(matterId) {
            self.contactList1 = [];
            if (angular.isUndefined(matterId)) {
                return;
            }
            var emails = newSidebarDataLayer.getContactsAndEmails(matterId).then(function (data) {
                self.contactList1 = eventsHelper.setContactList(data);
                self.contactList1 = _.uniq(self.contactList1, function (item) {
                    return item.contactid;
                });
                if (self.contactList1.length > 0 && self.selectedEvent.sms_contact_ids) {
                    var arr = [];
                    _.forEach(self.selectedEvent.sms_contact_ids, function (info) {
                        _.forEach(self.contactList1, function (item) {
                            if (info == item.contactid) {
                                arr.push(item);
                            }
                        });
                    })
                    if (arr.length == 0) {
                        self.selectedEvent.sms_contact_ids = [];
                    } else {
                        self.selectedEvent.sms_contact_ids = _.pluck(arr, 'contactid');
                    }
                }
                if (self.contactList1.length == 0) {
                    self.selectedEvent.sms_contact_ids = [];
                }
            }, function () {
            });

        }

        function getMatterCollaboratedEntity() {
            if (self.isCollaborationActive) {
                matterFactory.getMatterCollaboratedEntity(self.matterId, self.firmID)
                    .then(function (data) {
                        localStorage.setItem('getMatterCollaboratedEntity', JSON.stringify(data));
                        self.matterCollaboratedEntity = JSON.parse(localStorage.getItem('getMatterCollaboratedEntity'));
                        eventMatterCollaboaratedEntity();
                    }, function (data) {
                        notificationService.error('Error ');
                    });
            }

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

        //US#8328 For set default value of Remind Me in Days & to show 180days , 1 & 2year options
        self.reminderDaysList = angular.copy(globalConstants.reminderDaysList);
        function setReminderDaysList(event) {
            if (event.label_id == 1) {
                self.reminderDaysList = angular.copy(globalConstants.SOLReminderDaysList);
            } else if (event.label_id != 1) {
                self.reminderDaysList = angular.copy(globalConstants.reminderDaysList);
            }
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
            self.sortDESC = sortBy == 'DESC';
            return selSort.name;
        }

        self.openContactCard = function (contact) {
            contactFactory.displayContactCard1(contact.contactid, contact.edited, contact.contact_type);
            contact.edited = false;
        };

        //get email signature
        function getUserEmailSignature() {
            mailboxDataService.emailSignature()
                .then(function (data) {
                    if (utils.isNotEmptyVal(data.data)) {
                        self.signature = data.data[0];
                        self.signature = '<br/><br/>' + self.signature;
                    }
                });
        }

        $scope.$on('composeEmailFromContact', function (event, data) {
            if (!(window.isDrawerOpen)) {
                self.compose = true;
                var html = "";
                html += (self.signature == undefined) ? '' : self.signature;
                self.composeEmail = html;
                $rootScope.updateComposeMailMsgBody(self.composeEmail, '', '', '', 'contactEmail', data);
            }
        });

        // Get event call from mailbox controller for close compose popup
        $rootScope.$on("callCloseComposeMail", function () {
            closeComposeMail(); // close compose mail popup
        });

        // close compose mail popup
        function closeComposeMail() {
            self.compose = false;
        }

        /**
         * 
         * sort options 
         */
        self.applySortByFilter = function (sortBy) {
            self.sortby = sortBy;
            sessionStorage.setItem(self.eventSortRetain, self.sortby);
            // reset selected event when sort is applied.
            eventsHelper.setSelectedEvent(null);
            self.selectedEvent = {};
            getEvents();
        }

        /*** Service call Functions ***/
        //Get events for selected matter        
        function getEvents() {
            //self.eventsList = [];
            self.migrate = localStorage.getItem('Migrated');
            self.sortby = (self.sortby == 'null' || self.sortby == 'undefined') ? 'DESC' : self.sortby;
            eventsDataService.getEvents_OFF_DRUPAL(matterId, self.sortby)
                .then(function (response) {
                    self.EventisInList = false;
                    // variable to check if data is available - used for "No events found"
                    //self.selectedEvent = {};//Bug#5966 - Event delete issue fixed
                    self.isDataAvailable = true;
                    //Store events list
                    var eventsList = response.data;

                    if (matterId && matterId > 0 && self.isClientPortal == 1) {
                        allPartiesDataService.getPlaintiffs(matterId).then(function (response) {
                            self.plaintiffDataList = [];
                            angular.forEach(response.data, function (plaintiff) {
                                if (plaintiff.client_status == "1" && utils.isNotEmptyVal(plaintiff.contactid.emailid)) {
                                    self.plaintiffDataList.push(plaintiff);
                                }
                            });

                            _.forEach(eventsList, function (event, index) {

                                if (event.share_with_plaintiff) {
                                    event.share_with = _.pluck(event.share_with_plaintiff, 'plaintiff_id');
                                }
                                event.share_with = event.share_with.map(String);
                            });

                        });

                        allPartiesDataService.getAllParties(matterId).then(function (res) {
                            /** Check to show/hide for Share checkbox to event  **/
                            var flag = (res.plaintiff.client_portal_status == '1') ? true : false;
                            $rootScope.isShareWithPlaintiff = false;
                            if (flag) {
                                forEach(res.plaintiff.data, function (item) {
                                    if (item.client_status == "1") {
                                        $rootScope.isShareWithPlaintiff = true;
                                    }
                                })
                            }
                        });

                    }

                    if (response.count == 0) {
                        self.selectedEvent = {};
                    }
                    _.forEach(eventsList, function (item) {
                        //US#11039
                        // (item.reminder_users == "all" || item.reminder_users == "matter") ? '' : item.reminder_users_id = 3 ;
                        item.event_display_name = (item.label_id == '100' || item.label_id == '19' || item.label_id == '32') ? item.title : item.event_name;

                        item.utcstart = angular.isDefined(item.start) ? item.start : item.start;
                        item.utcend = angular.isDefined(item.end) ? item.end : item.end;

                        if (item.custom_reminder) {
                            item.custom_reminder = utils.isEmptyVal(item.custom_reminder) ? '' : moment.unix(item.custom_reminder).utc().format('MM-DD-YYYY');
                        }
                        if (item.sms_custom_reminder) {
                            item.sms_custom_reminder = utils.isEmptyVal(item.sms_custom_reminder) ? '' : moment.unix(item.sms_custom_reminder).utc().format('MM-DD-YYYY');
                        }

                        if (utils.isNotEmptyVal(item.reminder_days)) {
                            item.reminder_days = item.reminder_days.split(',');
                        } else {
                            item.reminder_days = [];
                        }
                        if (utils.isNotEmptyVal(item.sms_reminder_days)) {
                            item.sms_reminder_days = item.sms_reminder_days.split(',');
                        } else {
                            item.sms_reminder_days = [];
                        }
                        item.sms_contact_ids = utils.isNotEmptyVal(item.sms_contact_ids) ? JSON.parse(item.sms_contact_ids) : [];
                        if (_.isArray(item.sms_contact_ids)) {
                            var arr = [];
                            _.forEach(item.sms_contact_ids, function (item) { arr.push(parseInt(item)) });
                            item.sms_contact_ids = arr;
                        }
                    });

                    if (self.selectedEvent && self.selectedEvent.entityId) {
                        var obj = _.find(response.data, function (obj) { return obj.event_id == self.selectedEvent.entityId });
                        self.selectedEvent = obj;
                    }

                    var eventIds = _.pluck(response.data, 'event_id');
                    var eventIndex = eventIds.indexOf(parseInt(self.selectedEvent.event_id));
                    if (self.addEditData && !utils.isEmptyObj(self.addEditData)) {
                        var ids = _.pluck(eventsList, 'event_id');
                        var index = ids.indexOf(parseInt(self.addEditData));
                        if (index > -1) {
                            self.selectedEvent = eventsList[index];
                        }
                    }
                    else if (eventIndex == -1 && response.data && response.data.length > 0) {
                        self.selectedEvent = response.data[0];
                    }
                    else if (self.selectedEvent && !_.isEmpty(self.selectedEvent)) {
                        var obj = _.find(response.data, function (obj) { return obj.event_id == self.selectedEvent.event_id });
                        if (obj) {
                            self.selectedEvent = obj;
                            self.EventisInList = true;
                            eventsHelper.setSelectedEvent(self.selectedEvent);//Bug#8373
                        }
                    } else if (response.count != 0) {
                        // set first event as selected by default.
                        self.selectedEvent = eventsList[0];
                        var eventsByYear = setEventList(eventsList);
                        self.selectedEvent = eventsHelper.setSelectedEventFromList(eventsByYear);

                    }
                    self.eventsList = setEventList(eventsList);
                    if (!self.EventisInList && utils.isEmptyObj(self.selectedEvent)) {
                        self.selectedEvent = eventsList[0];
                    }
                    eventsHelper.setSelectedEvent(self.selectedEvent);
                    if (utils.isNotEmptyVal(self.selectedEvent)) {
                        //get event history data for selected event 
                        getEventHistoryData(self.selectedEvent.event_id);
                        // US#8328 for set reminderdays count
                        setReminderDaysList(self.selectedEvent);
                        getEventRemindUser(self.selectedEvent);
                        //Bug#9805 for  assigned_to_name
                        self.assigned_to_name = utils.isEmptyVal(self.selectedEvent.assigned_to) ? '' : _.pluck(self.selectedEvent.assigned_to, 'full_name').join(', ');
                    }

                    if (self.isCollaborationActive) {
                        getMatterCollaboratedEntity();
                    }

                    var retainSText = JSON.parse(sessionStorage.getItem("retainSearchText"));
                    if (utils.isNotEmptyVal(retainSText)) {
                        selectSearchedEvent();
                    }

                    self.loaderFlagStatus = true;

                }, function (error) {
                    console.log('unable to fetch events');
                    self.loaderFlagStatus = true;
                });
        }

        function eventMatterCollaboaratedEntity() {

            self.collaboratedEntityFlagArr = [];
            _.forEach(self.matterCollaboratedEntity, function (entity, entityIndex) {
                if (self.matterCollaboratedEntity.length > 0) {
                    self['collaboratedEntityFlag'] = true;
                }
                if (utils.isNotEmptyVal(entity.eventEntity)) {
                    self.collaboratedEntityFlagArr = self.collaboratedEntityFlagArr.concat(_.pluck(entity.eventEntity.events, 'event_id'));
                }
            });
            self.collaboratedEntityFlagArr = _.uniq(self.collaboratedEntityFlagArr);

            _.forEach(self.eventsList, function (eventYear, eventYearIndex) {
                _.forEach(eventYear, function (event, eventIndex) {
                    event['eventCollaboratedEntityArr'] = [];
                    event['collaboratedEntity'] = [];
                    _.forEach(self.matterCollaboratedEntity, function (entity, entityIndex) {
                        var obj = {
                            contactName: entity.contactName,
                            id: entity.id,
                            eventPermission: 0,
                            emailId: entity.emailId,
                        }
                        if (event && utils.isNotEmptyVal(entity.eventEntity)) {
                            var flag = _.find(entity.eventEntity.events, function (evt) { return evt.event_id == event.event_id; });
                            obj['eventPermission'] = (flag) ? 1 : 0;
                        }
                        event['collaboratedEntity'].push(entity);
                        event['eventCollaboratedEntityArr'].push(obj);
                    });
                });
            });
        }

        $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
            goToselectedEvent();
        });

        function goToselectedEvent() {
            var eve = self.selectedEvent;
            if (!(utils.isEmptyObj(eve))) {
                var gotoYear = false;
                _.forEach(self.eventsList[eve.year], function (item, index) {
                    if (index == 0 && item.event_id == eve.event_id) {
                        gotoYear = true;
                    }
                });
                var container = $('#main-event'),
                    scrollTo = gotoYear ? $('#' + eve.year) : $('#x' + eve.event_id);
                if (scrollTo.offset() && scrollTo.offset().top) {
                    container.animate({
                        scrollTop: scrollTo.offset().top - $("#main-event").offset().top
                    }, 100);
                }
            }
        }

        // }
        // set event list to show left side of the page
        function setEventList(eventList) {
            _.forEach(eventList, function (item) {
                item.year = (utils.isEmptyVal(item.utcstart) || item.utcstart == 0) ? "no date" :
                    (item.all_day == "1" ? moment.unix(item.utcstart).utc().format('YYYY') :
                        moment.unix(item.utcstart).format('YYYY'));

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
            self.assigned_to_name = utils.isEmptyVal(self.selectedEvent.assigned_to) ? '' : _.pluck(self.selectedEvent.assigned_to, 'full_name').join(', ');

            //get event history data for selected event
            getEventHistoryData(self.selectedEvent.event_id);
            //US#8328 for call function
            setReminderDaysList(event);
            getEventRemindUser(event);
            eventsHelper.setSelectedEvent(event);
            if (self.contactList1.length > 0 && self.selectedEvent.sms_contact_ids) {
                var arr = [];
                _.forEach(self.selectedEvent.sms_contact_ids, function (info) {
                    _.forEach(self.contactList1, function (item) {
                        if (info == item.contactid) {
                            arr.push(item);
                        }
                    });
                })
                if (arr.length == 0) {
                    self.selectedEvent.sms_contact_ids = [];
                } else {
                    self.selectedEvent.sms_contact_ids = _.pluck(arr, 'contactid');
                }
            }
        }

        function getSingleEventData(event) {
            eventsDataService.getSingleEvent_OFF_DRUPAL(event.event_id)
                .then(function (events) {
                    if (utils.isNotEmptyVal(events.sms_contact)) {
                        _.forEach(events.sms_contact, function (item) {
                            item.name = item.first_name + " " + item.last_name;
                            item.contactid = item.contact_id;
                        })
                        self.selectedEvent.sms_contact_ids = _.pluck(events.sms_contact, 'contact_id');
                        self.contactList1 = [];
                        self.contactList1 = events.sms_contact;
                    }
                })
        }

        //get event history of selected event
        function getEventHistoryData(eventId) {

            eventsDataService.getEventHistory_OFF_DRUPAL(eventId, pageNumber, pageSize)
                .then(function (data) {
                    self.eventHistoryData = data;
                    //set reason name
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
            eventsDataService.downloadEventHistory(self.selectedEvent.event_id, pageNumber, pageSize)
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
            return self.selectedEvent.event_id == event.event_id;
        }

        // show event details
        function showEventDetails(selectedEvent) {
            if (angular.isUndefined(selectedEvent) || utils.isEmptyObj(selectedEvent) || angular.isUndefined(selectedEvent.reminder_days)) {
                return false;
            }
            return true;
        }

        //retaintion of search value 
        function filterRetain() {
            var retainSText = JSON.parse(sessionStorage.getItem("retainSearchText"));
            if (utils.isNotEmptyVal(retainSText)) {
                if (self.matterId != retainSText.matterid) {
                    $rootScope.retainSearchText = {};
                }
            }
            $rootScope.retainSearchText.events_filtertext = self.searchEvent;
            $rootScope.retainSearchText.matterid = self.matterId;
            sessionStorage.setItem("retainSearchText", JSON.stringify($rootScope.retainSearchText));
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
                            eventsHelper.setSelectedEvent(self.selectedEvent);
                            foundMatch = true;
                        }
                    });
                    if (!foundMatch) {
                        self.selectedEvent = {};
                    }
                    else {
                        selectEvent(self.selectedEvent);
                    }

                } else {
                    var saveEvent = eventsHelper.getSelectedEvent();
                    if (utils.isEmptyObj(saveEvent)) {
                        self.selectedEvent = self.eventsList[self.currentOrder[0]][0];
                    }
                    else {
                        self.selectedEvent = saveEvent;
                    }
                    eventsHelper.setSelectedEvent(self.selectedEvent);
                };

                if (utils.isEmptyVal(self.selectedEvent)) { return }
                if (self.selectedEvent.reminder_users == "matter") {
                    self.reminder_users_id = 1;
                } else if (self.selectedEvent.reminder_users == "all") {
                    self.reminder_users_id = 2;
                } else if (self.selectedEvent.reminder_users && self.selectedEvent.reminder_users.length > 0 && JSON.parse(self.selectedEvent.reminder_users) instanceof Array) {
                    self.reminder_users_id = 3;
                    self.selectedEvent.remind_users_temp = [];
                    _.forEach(JSON.parse(self.selectedEvent.reminder_users), function (taskid, taskindex) {
                        _.forEach(self.users, function (item) {
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
            if (mode == 'edit' && utils.isNotEmptyVal(data.utcstart) && utils.isNotEmptyVal(data.utcend)) {
                var start = moment.unix(data.utcstart).startOf("day");
                var end = moment.unix(data.utcend).startOf("day");
                if (end.diff(start, 'days', true) > 1) {
                    data.disableFullDay = true;
                } else {
                    data.disableFullDay = false;
                }
            }
            var resolveObj = {
                mode: mode,
                selectedEvent: mode === 'edit' ? data : undefined,
                users: self.users
            }
            if (mode === 'edit') {
                if (self.criticalDatesPermission[0].E == 0 && (data.label_id == 1 || data.label_id == 6 || data.label_id == 15)) {
                    notificationService.error(globalConstants.accessMgmtMessage + "edit critical events")
                    return;
                }
                if (self.eventsPermissions[0].E == 0 && (data.label_id != '1' && data.label_id != 6 && data.label_id != 15)) {
                    notificationService.error(globalConstants.accessMgmtMessage + "edit events")
                    return;
                }
            }
            self.isDataAvailable = true;
            var modalInstance = openAddEditEventsModal(angular.copy(resolveObj));
            getEventsListAfterSuccess(modalInstance);
        }

        function openAddEditEventsModal(resolveObj) {
            return $modal.open({
                templateUrl: 'app/events/partials/add-event.html',
                controller: 'addEditEventCtrl as addEditEvent',
                windowClass: 'eventDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    addEditEventsParams: function () {
                        return resolveObj;
                    }
                },
            });
        }

        function getEventsListAfterSuccess(modalInstance) {
            modalInstance.result.then(function (responseData) {
                self.addEditData = responseData;
                if (self.addEditData) {
                    self.selectedEvent = {};
                };
                getEvents();
            });
        }

        function matterCollaborationEditEvent(mode, data) {
            self.selectedEvent = mode === 'collaboration' ? data : undefined
            var modalInstanceMC = openMatterCollaborationEditEventModal(angular.copy(self.selectedEvent));
            modalInstanceMC.result.then(function (responseData) {
                getEvents();
            });
        }


        function openMatterCollaborationEditEventModal(selectedEvent) {
            return $modal.open({
                templateUrl: 'app/events/partials/matter-collaboration-event.html',
                controller: 'matterCollaborationEventCtrl as matterCollaborationEvent',
                size: 'lg',
                windowClass: 'modalMidiumDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    matterCollaborationEvent: function () {
                        return {
                            selectedEvent: selectedEvent
                        };
                    }
                },
            });
        }

        self.viewCollaborateInfo = function (selectedItem) {
            var modalInstance = $modal.open({
                templateUrl: 'app/documents/collaboration-document/view-collaboration.html',
                controller: 'CollaborationDocumentsCtrl as collaborationDocument',
                keyboard: false,
                backdrop: 'static',
                size: 'lg',
                windowClass: 'modalMidiumDialog',
                resolve: {
                    collaborationDocument: function () {
                        return {
                            selectedItems: selectedItem
                        };
                    }
                }
            });
        }

        function deleteEvent(eventId) {

            // restrict user for deleting Critical events when no delete permission 
            if (self.criticalDatesPermission[0].D == 0 && (self.selectedEvent.label_id == 1 || self.selectedEvent.label_id == 6 || self.selectedEvent.label_id == 15)) {
                notificationService.error(globalConstants.accessMgmtMessage + "delete critical events");
                return;
            }
            if (self.eventsPermissions[0].D == 0 && (self.selectedEvent.label_id != '1' && self.selectedEvent.label_id != 6 && self.selectedEvent.label_id != 15)) {
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

                eventsDataService.deleteEvent_OFF_DRUPAL(eventId)
                    .then(function () {
                        notificationService.success('Event deleted successfully!');
                        eventsHelper.setSelectedEvent(null);
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

        //US#8558 Event & Task reminder to matter users or all users
        function getEventRemindUser(event) {
            if (utils.isEmptyVal(event)) { return }
            if (event.reminder_users == "matter") {
                self.reminder_users_id = 1;
            } else if (event.reminder_users == "all") {
                self.reminder_users_id = 2;
            } else if (event.reminder_users && event.reminder_users.length > 0 && JSON.parse(event.reminder_users) instanceof Array) {
                self.reminder_users_id = 3;
                if (angular.isDefined(event.reminder_users) && event.reminder_users != "" && event.reminder_users != "all" && event.reminder_users != "matter") {
                } else {
                    self.selectedEvent.remind_users_temp = event.reminder_users;
                }
            }
            self.selectedEvent.remind_users_temp = [];
            if (event.reminder_users && event.reminder_users.length > 0) {
                if (self.reminder_users_id == 3) {
                    _.forEach(JSON.parse(event.reminder_users), function (taskid, taskindex) {
                        _.forEach(self.users, function (item) {
                            if (taskid == item.user_id) {
                                self.selectedEvent.remind_users_temp.push(parseInt(taskid));
                            }
                        });
                    });
                }
            }
        }



    }


})();

(function () {
    'use strict';

    angular
        .module('cloudlex.events')
        .controller('addEditEventCtrl', addEditEventCtrl);

    addEditEventCtrl.$inject = ['$modalInstance', '$stateParams', 'eventsDataService', 'masterData', 'addEditEventsParams', 'notification-service', 'globalConstants', 'eventsHelper', 'matterFactory', 'eventCronologyHelper', 'practiceAndBillingDataLayer', 'allPartiesDataService', '$rootScope', '$q', 'contactFactory', 'newSidebarDataLayer'];

    function addEditEventCtrl($modalInstance, $stateParams, eventsDataService, masterData, addEditEventsParams, notificationService, globalConstants, eventsHelper, matterFactory, eventCronologyHelper, practiceAndBillingDataLayer, allPartiesDataService, $rootScope, $q, contactFactory, newSidebarDataLayer) {
        var pageMode;
        var matterId = $stateParams.matterId;
        var self = this;

        self.event = {};
        self.open = openCalender;
        self.fullDayChanged = fullDayChanged;
        self.save = save;
        self.cancel = closeModal;
        self.selectTime = globalConstants.timeArray;
        self.disableReminder = eventsHelper.disableReminder;
        self.users = addEditEventsParams.users;

        // variable to track if critical date clicked
        self.event.criticalDatesClicked = false;
        self.event.DeadlineDatesClicked = false;

        self.showhideDates = showhideDates;
        self.getFormattedDateString = getFormattedDateString;
        self.isDatesValid = isDatesValid;
        self.setEndTime = setEndTime;
        self.cMessengerCheck = cMessengerCheck;

        //US#3119-set default values for Remind Me in Days:
        self.reminderDaysList = angular.copy(globalConstants.reminderDaysList);
        self.setLocation = setLocation; //pointer to setLocation function
        self.formatEndDate = formatEndDate;
        self.checkEventType = checkEventType; //Add for US#8328
        var gracePeriodDetails = masterData.getUserRole();
        self.isClientPortal = gracePeriodDetails.client_portal;  //US#5554 check client portal flag
        self.addAssignedUser = addAssignedUser;

        self.removeAssignedUser = removeAssignedUser;
        self.calDays = calDays;
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

        pageMode = addEditEventsParams.mode;
        self.fromOverview = addEditEventsParams.fromOverview;
        self.pageMode = pageMode; //assigned to use mode to hide/show elements


        function init() {
            //set event model
            if (pageMode === 'edit') {
                addEditEventsParams.selectedEvent.utcstart = angular.isDefined(addEditEventsParams.selectedEvent.start) ? (addEditEventsParams.selectedEvent.start) : '';
                addEditEventsParams.selectedEvent.utcend = angular.isDefined(addEditEventsParams.selectedEvent.end) ? (addEditEventsParams.selectedEvent.end) : (addEditEventsParams.selectedEvent.start);
            }

            var event = pageMode === 'edit' ? angular.copy(addEditEventsParams.selectedEvent) : {};
            setEventObject(event);
            addEditEventsParams.criticalDats == "ctdates" ? '' : getcourtAddress(); //call function to get court address
            self.event = angular.copy(event);
            if (pageMode != 'edit') {
                setCreateTaskFlag();
            } else {
                self.createTaskDisabled = self.event.assigned_to && self.event.assigned_to.length > 0 ? false : true;
            }

            //self.event.remindMe = true;
            self.event.private = angular.isDefined(self.event.private) ? self.event.private : '0';
            self.event.all_day = angular.isDefined(self.event.all_day) ? self.event.all_day : 1;
            self.event.user_defined = angular.isDefined(self.event.user_defined) ? self.event.user_defined : '0';
            self.event.title = angular.isDefined(self.event.title) ? self.event.title : '';
            self.assignedUsers = self.event.assigned_to;
            self.assignedToUserList = [];
            self.event.label_id = angular.isDefined(self.event.label_id) ? (self.event.label_id).toString() : '';

            self.userSelectedType = [{ id: 1, name: 'Assigned to Matter' }, { id: 2, name: 'All Users' }, { id: 3, name: 'Select User' }];


            if (self.pageMode !== 'edit') {
                self.event.reminder_days = ['0'];
                self.event.sms_reminder_days = ['0'];
            }

            // Fetching Users List for Assigning Event
            getUsersList();
            self.eventTypes = masterData.getEventTypes();
            addEditEventsParams.criticalDats == "ctdates" ? setEventTypesForCt(addEditEventsParams.label_id) : '';
            if (self.pageMode == 'add') {
                if (self.criticalDatesPermission[0].A == 0 && self.eventsPermissions[0].A == 1) {
                    self.eventTypes = _.filter(self.eventTypes, function (eventTypes) {
                        if (eventTypes.is_critical != '1') {
                            return eventTypes;
                        }

                    });
                }
                if (self.eventsPermissions[0].A == 0 && self.criticalDatesPermission[0].A == 1) {
                    self.eventTypes = _.filter(self.eventTypes, function (eventTypes) {
                        if (eventTypes.is_critical == '1') {
                            return eventTypes;
                        }

                    });
                }
            }
            if (self.pageMode == 'edit') {
                if (self.criticalDatesPermission[0].E == 0 && self.eventsPermissions[0].E == 1) {
                    self.eventTypes = _.filter(self.eventTypes, function (eventTypes) {
                        if (eventTypes.is_critical != '1') {
                            return eventTypes;
                        }

                    });
                }
                if (self.eventsPermissions[0].E == 0 && self.criticalDatesPermission[0].E == 1) {
                    self.eventTypes = _.filter(self.eventTypes, function (eventTypes) {
                        if (eventTypes.is_critical == '1') {
                            return eventTypes;
                        }

                    });
                }
            }
            matterId = matterId ? matterId : addEditEventsParams.selectedEvent.matter.matter_id;
            if (self.pageMode == 'add') {
                var user = { id: 1 };
                self.event.contactList = [];
                self.setUserMode(user);
                getContactsAndEmails(matterId)
            }
            if (self.pageMode == 'edit') {
                var obj = {};
                if (self.event.reminder_users == "matter") {
                    obj.id = 1;
                } else if (self.event.reminder_users == "all") {
                    obj.id = 2;
                } else if (angular.isDefined(self.event.reminder_users) && self.event.reminder_users != "all" && self.event.reminder_users != "matter") {
                    obj.id = 3;
                } else if (!angular.isDefined(self.event.reminder_users)) {
                    obj.id = 3;
                }
                self.setUserMode(obj);
                getContactsAndEmails(matterId);

            }

            if (matterId && matterId > 0 && self.isClientPortal == 1) {
                allPartiesDataService.getAllParties(matterId).then(function (res) {
                    /** Check to show/hide for Share checkbox to event  **/
                    var flag = (res.plaintiff.client_portal_status == '1') ? true : false;
                    $rootScope.isShareWithPlaintiff = false;
                    if (flag) {
                        forEach(res.plaintiff.data, function (item) {
                            if (item.client_status == "1") {
                                $rootScope.isShareWithPlaintiff = true;
                            }
                        })
                    }
                });
                getSharePlaintiffList(matterId);
            }

        };
        function addContactObj(item) {
            var fname = item.fname ? item.fname : "";
            var mname = item.mname ? item.mname : "";
            var lname = item.lname ? item.lname : "";
            var fullname = fname + " " + mname + " " + lname;

            var contact = {
                name: fullname,
                email: item.email,
                contactid: parseInt(item.contactid),
                type: item.type
            }

            return contact;

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
            // return "All";
        }

        function getContactsAndEmails(matterId) {
            self.contactList1 = [];
            if (angular.isUndefined(matterId)) {
                return;
            }
            var emails = newSidebarDataLayer.getContactsAndEmails(matterId).then(function (data) {
                self.contactList1 = eventsHelper.setContactList(data);
                self.contactList1 = _.uniq(self.contactList1, function (item) {
                    return item.contactid;
                });
                if (utils.isNotEmptyVal(self.event.sms_contact_ids)) {
                    var arr = [];
                    _.forEach(self.event.sms_contact_ids, function (item) { arr.push(parseInt(item)) })
                    self.event.sms_contact_ids = arr;
                }
                if (self.contactList1.length > 0 && self.event.sms_contact_ids) {
                    var arr = [];
                    _.forEach(self.event.sms_contact_ids, function (info) {
                        _.forEach(self.contactList1, function (item) {
                            if (info == item.contactid) {
                                arr.push(item);
                            }
                        });
                    })
                    if (arr.length == 0) {
                        self.event.sms_contact_ids = [];
                    } else {
                        self.event.sms_contact_ids = _.pluck(arr, 'contactid');
                    }
                }
                if (self.contactList1.length == 0) {
                    self.event.sms_contact_ids = [];
                }
            }, function () {
            });

        }

        // Fetching Users List for Assigning Event
        function getUsersList() {
            self.assignedToUserList = angular.copy(self.users);
            var sample = [];
            if (pageMode === 'edit') {
                _.forEach(self.assignedToUserList, function (data) {
                    _.forEach(self.assignedUsers, function (item) {
                        if (item.user_id == data.user_id) {
                            sample.push(data);
                        }
                    })
                })
                self.assignedToUserList = _.difference(self.assignedToUserList, sample);
            }
        }

        function getSharePlaintiffList(matterId) {
            allPartiesDataService.getPlaintiffs(matterId).then(function (response) {
                self.plaintiffDataList = [];
                angular.forEach(response.data, function (plaintiff) {
                    if (plaintiff.client_status == "1" && utils.isNotEmptyVal(plaintiff.contactid.emailid)) {
                        self.plaintiffDataList.push(plaintiff);
                    }
                });
            });
        }

        //set datepicker options
        self.dateFormat = 'MM/dd/yyyy';
        self.datepickerOptions = {
            formatYear: 'yyyy',
            startingDay: 0,
            'show-weeks': false,

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

        function setCreateTaskFlag() {
            if (angular.isDefined(appPermissions) && appPermissions != '' && appPermissions != ' ') {
                self.event.is_task_created = (appPermissions.DefaultTaskCreation == 1) ? 1 : 0;
            } else {
                self.event.is_task_created = 0;
            }
        }

        //Function to add Assigned users
        function addAssignedUser(userList) {
            self.event.assigned_to = userList;
            self.createTaskDisabled = self.event.assigned_to && self.event.assigned_to.length > 0 ? false : true;
        }

        //Function to remove Assigned Users
        function removeAssignedUser(userList) {
            self.event.assigned_to = userList;
            self.createTaskDisabled = self.event.assigned_to && self.event.assigned_to.length > 0 ? false : true;
            pageMode === 'edit' ? getUsersList() : angular.noop();
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
                        self.event.all_day = 1;
                        self.event.disableFullDay = true;
                    } else {
                        self.event.all_day = 0;
                        self.event.disableFullDay = false;
                    }
                }
            }
        }
        // Commenting Function out as per requirements in US#9539
        // Function to check whether a task is previously assigned to event. If task is assigned and but all users are removed save should be disabled as per requirements.
        // function userAssignmentValidation(){
        //     if (self.assignedUsers == '' && self.event.assigned_taskid != '' && self.pageMode === 'edit'){
        //         return true;
        //     }
        //     else{
        //         return false;
        //     }
        // }

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
        function formatEndDate(utcEnd) {
            var utcStart = angular.copy(self.event.utcstart);
            if (!moment(utcEnd, 'MM/DD/YYYY', true).isValid()) {
                self.event.utcend = moment(utcEnd).format('MM/DD/YYYY');
            }
        }

        /** US-5214 function to get court address to Location field*/
        function getcourtAddress() {
            matterFactory.getMatterOverview(matterId)
                .then(function (response) {
                    var data = response.data.matter_info[0];
                    self.courtAddress = utils.isNotEmptyVal(data.mattercourt) ?
                        data.mattercourt + ', ' : '';
                    self.courtAddress += utils.isNotEmptyVal(data.street) ?
                        data.street + ', ' : '';
                    self.courtAddress += utils.isNotEmptyVal(data.city) ?
                        data.city + ', ' : '';
                    self.courtAddress += utils.isNotEmptyVal(data.state) ?
                        data.state : '';
                }, function (error) {

                });
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
                $('#mtrevtReminderDateErr').css("display") == "block" ||
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
            eventsHelper.formOpenSetDates(pageMode, event, addEditEventsParams);

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

            var oldDate = moment(event.utcstart).year();
            if (oldDate < 1970) {
                notificationService.error("Not Acceptable: Start or End date can not be negative");
                return;
            };

            //validate the custom reminder date before saving event
            if (event.custom_reminder) {
                var startDate = moment(new Date(event.utcstart)).utc();
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

            //validate the reminder date before saving event
            if (event.remindMe) {
                var start = moment(new Date(event.utcstart)).utc();
                var reminder = moment(new Date(event.reminder_datetime)).utc();
                if (start.isBefore(reminder)) {
                    notificationService.error('Reminder date can not be greater than start date');
                    return;
                }
            }
            event.is_task_created = event.assigned_to && event.assigned_to.length > 0 ? parseInt(event.is_task_created) : 0;
            if (event.private != 1) {
                if (event.reminder_users != "all" && event.reminder_users != "matter") {
                    if (event.reminder_users != null && event.remind_users_temp.length > 0) {
                        event.reminder_users = event.remind_users_temp;
                    } else {
                        notificationService.error("Please select at least one remind user");
                        return;
                    }

                }
            } else {
                if (event.reminder_users != "all" && event.reminder_users != "matter") {
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

            //clone the event obj to break the refrence
            //we are manipulating event obj for saving, having refrence will make the value on the ui change as well
            //because of two way binding
            // event.is_cp_share = self.data.is_cp_share; // US#5554 add is_cp_share in existing object for save
            var newEvent = angular.copy(event);
            if (utils.isEmptyVal(newEvent.utcstart) || utils.isEmptyVal(newEvent.utcstart)) {
                notificationService.error("Invalid Date Range");
                return;
            }
            newEvent.matterid = matterId;
            setEventTitle(newEvent, self.eventTypes); //Set Event title
            eventsHelper.setDates(newEvent); // set dates 

            // validate event start end dates
            if (!eventsHelper.areDatesValid(newEvent)) {
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

            if (eventCronologyHelper.isEventUpdated(self.existingEvent, event) && pageMode === 'edit') {
                //check if start and end date is update or not
                if (
                    (self.existingEvent.utcstart != event.utcstart) || (self.existingEvent.utcend != event.utcend)
                    || ((self.existingEvent.all_day != event.all_day)
                        || ((self.existingEvent.start != event.start) || (self.existingEvent.end != event.end)))
                ) {
                    self.checkReason = true;
                } else {
                    self.checkReason = false;
                }
                //US#7768 make remark non mandatory for location
                // if((self.existingEvent.reminder_days.toString() != event.reminder_days.toString()) || (self.existingEvent.name != event.name) || (self.existingEvent.is_comply != event.is_comply) || (self.existingEvent.label_id != event.label_id) || (self.existingEvent.title != event.title)){
                //     self.disableSave = false;
                // }

                //US#8707 : Show popup only for date/time change
                if (self.checkReason == true) {
                    var modalInstance = eventCronologyHelper.openEventRemarkPopup(self.checkReason);

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

            var newEvent = createEventObj(event);

            newEvent.matterdatetypeid = event.matterdatetypeid;
            newEvent.event_name = event.event_name;
            newEvent.task = { "task_id": (event.assigned_taskid) ? event.assigned_taskid : "" };
            newEvent.event_id = event.event_id;
            newEvent.is_deadline = event.is_deadline;
            newEvent.reason = event.reason;
            newEvent.comments = event.comments;

            eventsDataService.updateEvent_OFF_DRUPAL(event.event_id, newEvent)
                .then(function (data) {
                    //US#5554:Error message if client portal is not enabled for a matter
                    if (data.status == 400) {
                        notificationService.error('Event has not been updated!');
                    } else if (data.status == 406) {
                        notificationService.error('At present none of the plaintiffs have Client Portal enabled. Event will be shared only when you enable if for plaintiff(s)');
                    }
                    else if (data.status == 403) {
                        notificationService.error('At present Client Portal is not enabled. Event will be shared only when Client Portal is Enabled');
                    }
                    else {
                        notificationService.success('Event updated succesfully!');
                    }
                    $modalInstance.close(event.event_id.toString());
                    // goToselectedEvent();
                }, function () {
                    notificationService.error('An error occurred. Please try later.');
                    $modalInstance.dismiss();
                });
        }

        function saveEvents(event) {

            var newEvent = createEventObj(event);

            eventsDataService.addEvent_OFF_DRUPAL(newEvent)
                .then(function (data) {
                    //US#5554:Error message if client portal is not enabled for a matter

                    if (data.status == 400) {
                        notificationService.error('Event has not been added!');
                    } else if (data.status == 406) {
                        notificationService.error('At present none of the plaintiffs have Client Portal enabled. Event will be shared only when you enable if for plaintiff(s)');
                    }
                    else if (data.status == 403) {
                        notificationService.error('At present Client Portal is not enabled. Event will be shared only when Client Portal is Enabled');
                    }
                    else {
                        notificationService.success('Event added succesfully!');
                    }

                    $modalInstance.close(data);
                }, function () {
                    notificationService.error('An error occurred. Please try later.');
                    $modalInstance.dismiss();
                });
        }

        function createEventObj(event) {

            if (self.reminder_users_id == 3) {
                event.reminder_users = event.reminder_users.join();
            }

            var newEvent = {
                all_day: (event.all_day) ? event.all_day : 0,
                custom_reminder: event.custom_reminder,
                sms_custom_reminder: event.sms_custom_reminder,
                sms_reminder_days: (event.sms_reminder_days) ? event.sms_reminder_days : "",
                sms_contact_ids: (event.sms_contact_ids) ? (event.sms_contact_ids).toString() : "",
                description: (event.description) ? event.description : "",
                is_comply: (event.is_comply) ? event.is_comply : 0,
                is_task_created: event.is_task_created,
                label_id: parseInt(event.label_id),
                location: (event.location) ? event.location : "",
                matter: {
                    matter_id: parseInt(matterId)
                },
                private: event.private,
                remind_date: event.remind_date,
                reminder_days: (event.reminder_days) ? event.reminder_days : "",
                reminder_users_id: self.reminder_users_id,
                reminder_users: event.reminder_users,
                title: event.title,
                user_defined: event.user_defined,
                end: event.end,
                start: event.start,
                is_personalevent: (event.label_id == 19) ? 1 : 0,
                user_ids: utils.isEmptyVal(event.assigned_to) ? [] : _.pluck(event.assigned_to, 'user_id'),
                share_with: (event.share_with) ? event.share_with.map(Number) : [],
                is_critical: event.is_critical,
                is_deadline: event.is_deadline
            };
            return newEvent;
        }

        function setEventTitle(event, categories) {
            var userDefinedId = globalConstants.userDefinedEventId;
            if (event.label_id != userDefinedId) {
                var assignedEventType = _.find(categories, function (cat) {
                    return cat.label_id == event.label_id
                });

                if (utils.isNotEmptyVal(assignedEventType)) {
                    //   event.title = assignedEventType.Name; as the name was beign assigned to title
                }
            }
        }

        // close modal
        function closeModal(newEvent) {
            if (self.pageMode == 'edit' && addEditEventsParams.criticalDats == "ctdates") {
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
            }
            $modalInstance.dismiss();
        }

        // show hide date selectore based on label type
        function showhideDates(event, pageMode, allDay, resetPrivate) {
            if (resetPrivate) {
                event.private = 0;
            }
            if (typeof (allDay) === "undefined" || allDay == null) {
                allDay = event.all_day;
            }
            eventsHelper.showhideDates(event, pageMode, allDay);
            var keyvalues = _.find(self.eventTypes, function (item) {
                return item.label_id === event.label_id
            })

            if (keyvalues && keyvalues.is_deadline == 1) {

                event.DeadlineDatesClicked = false;
                event.is_deadline = 0;
            } else {
                event.DeadlineDatesClicked = true;
                event.is_deadline = 1;
            }

            if (keyvalues && keyvalues.is_critical == 1) {
                event.is_critical = 0;
            } else {
                event.is_critical = 1;
            }

            if (self.fromOverview) {
                angular.noop();
            } else {
                if (event.label_id == '1') {
                    event.utcstart = new Date(event.utcstart)
                    getFormattedDateString(event);
                }
            }

            if (resetPrivate) {
                self.event.disableFullDay = false;
                //event.all_day = 1;
                if (moment.isDate(event.utcstart)) {
                    event.utcend = utils.getFormattedDateString(event.utcstart);
                } else {
                    event.utcend = utils.getFormattedDateString(new Date(event.utcstart));
                }
            }

        }

        // get formatter string
        function getFormattedDateString(event) {
            //if(eventsHelper.isCriticalDate(event.label_id)){
            var datestring = $('#mtrevestartDatediv').val();
            if (moment(datestring, "MM/DD/YYYY", true).isValid()) {
                event.utcend = utils.getFormattedDateString(event.utcstart);
                event.utcstart = utils.getFormattedDateString(event.utcstart);
            }

            //}
        }
        self.setUserMode = function (user, showFocus) {
            if (user.id == 1) {
                self.reminder_users_id = user.id;
                self.event.remind_users_temp = "matter";
                self.event.reminder_users = "matter";
            } else if (user.id == 2) {
                self.reminder_users_id = user.id;
                self.event.remind_users_temp = "all";
                self.event.reminder_users = "all";
            } else if (user.id == 3) {
                self.reminder_users_id = user.id;
                if (angular.isDefined(self.event.reminder_users) && self.event.reminder_users != "" && self.event.reminder_users != "all" && self.event.reminder_users != "matter") {
                    self.event.remind_users_temp = self.event.reminder_users;
                } else {
                    self.event.remind_users_temp = [];
                    self.event.reminder_users = [];
                }
                self.event.remind_users_temp = [];
                if (self.event.reminder_users && self.event.reminder_users.length > 0) {
                    _.forEach(JSON.parse(self.event.reminder_users), function (taskid, taskindex) {
                        _.forEach(self.users, function (item) {
                            if (taskid == item.user_id) {
                                self.event.remind_users_temp.push(parseInt(taskid));
                            }
                        });
                    });
                }

                if (showFocus) {
                    $(".userPicker input").focus();

                }
                // }, function (err) {
                //     console.log(err);
                // });
            }

        };

    }





})();



(function () {
    'use strict';

    angular
        .module('cloudlex.events')
        .controller('matterCollaborationEventCtrl', matterCollaborationEventCtrl);

    matterCollaborationEventCtrl.$inject = ['$modalInstance', 'matterCollaborationEvent', 'masterData', 'eventsDataService', '$stateParams', 'notification-service'];

    function matterCollaborationEventCtrl($modalInstance, matterCollaborationEvent, masterData, eventsDataService, $stateParams, notificationService) {
        var self = this;
        self.cancel = cancel;
        self.save = save;
        self.contacts = [];
        var gracePeriodDetails = masterData.getUserRole();
        self.firmID = gracePeriodDetails.firm_id;
        self.eventData = matterCollaborationEvent.selectedEvent;
        self.matterId = $stateParams.matterId;
        self.collab2 = angular.copy(matterCollaborationEvent.selectedEvent.eventCollaboratedEntityArr);

        self.data = angular.copy(self.collab2);

        function save() {
            for (var i = 0; i < self.collab2.length; i++) {
                if (self.collab2[i].eventPermission != self.data[i].eventPermission) {
                    var obj = {};
                    obj.id = self.collab2[i].id;
                    obj.isEnable = self.collab2[i].eventPermission ? 1 : 0;
                    self.contacts.push(obj);
                }
            }

            var saveObj = {};
            saveObj.contacts = self.contacts;
            saveObj.firmId = parseInt(self.firmID);
            saveObj.matterId = parseInt(self.matterId);
            saveObj.entityType = 2;
            var eventIds = [self.eventData.event_id];
            saveObj.eventEntity = {};
            saveObj.eventEntity['eventIds'] = eventIds;

            if (saveObj.contacts.length > 0) {
                eventsDataService.saveEventPermission(saveObj)
                    .then(function (response) {
                        /*Checking if received the proper responce or not*/
                        if (response) {
                            notificationService.success('Access modified successfully');
                            $modalInstance.close();
                        }
                    }, function (error) {
                        notificationService.error('Access not modified successfully');
                        $modalInstance.close();
                    });
            } else {
                $modalInstance.close();
            }

        }

        function cancel() {
            $modalInstance.dismiss();
        }
    }





})();

(function (angular) {
    angular
        .module('cloudlex.events')
        .factory('eventsHelper', eventsHelper);

    eventsHelper.$inject = ['globalConstants'];

    function eventsHelper(globalConstants) {

        var selectedEvent = {};

        return {
            setSelectedEvent: _setSelectedEvent,
            getSelectedEvent: _getSelectedEvent,
            disableReminder: disableReminder,
            roundOffTime: roundOffTime,
            addZero: addZero,
            formOpenSetDates: formOpenSetDates,
            showhideDates: showhideDates,
            areDatesValid: areDatesValid,
            setDates: setDates,
            setSelectedEventFromList: _setSelectedEventFromList,
            setContactList: _setContactList,
        }
        function addContactObj(item) {
            var fname = item.fname ? item.fname : "";
            var mname = item.mname ? item.mname : "";
            var lname = item.lname ? item.lname : "";
            var fullname = fname + " " + mname + " " + lname;

            var contact = {
                name: fullname,
                email: item.email,
                contactid: parseInt(item.contactid),
                type: item.type
            }

            return contact;

        }
        function _setContactList(data) {
            var contactObj = angular.copy(data);
            var listOfContacts = [];
            if (contactObj && contactObj.plaintiff != undefined) {
                _.forEach(contactObj.plaintiff, function (item) {
                    var contact = addContactObj(item);
                    contact.role = "Plaintiffs";
                    listOfContacts.push(contact);
                });
            }

            // defendant
            if (contactObj && contactObj.defendant != undefined) {
                _.forEach(contactObj.defendant, function (item) {
                    var contact = addContactObj(item);
                    contact.role = "Defendants";
                    listOfContacts.push(contact);
                });
            }

            // insurance_provider: []
            if (contactObj && contactObj.insurance_provider != undefined) {
                _.forEach(contactObj.insurance_provider, function (item) {
                    var contact = addContactObj(item);
                    contact.role = "Insurance Provider";
                    listOfContacts.push(contact);
                });
            }

            // insured_party: []
            if (contactObj && contactObj.insured_party != undefined) {
                _.forEach(contactObj.insured_party, function (item) {
                    var contact = addContactObj(item);
                    contact.role = "Insured Party";
                    listOfContacts.push(contact);
                });
            }

            // medicalbills_service_provider: []
            if (contactObj && contactObj.medicalbills_service_provider != undefined) {
                _.forEach(contactObj.medicalbills_service_provider, function (item) {
                    var contact = addContactObj(item);
                    contact.role = "Medical Service Provider";
                    listOfContacts.push(contact);
                });
            }

            // oparty: []
            if (contactObj && contactObj.oparty != undefined) {
                _.forEach(contactObj.oparty, function (item) {
                    var contact = addContactObj(item);
                    contact.role = "Other Party";
                    listOfContacts.push(contact);
                });
            }

            // insurance_adjuster: []
            if (contactObj && contactObj.insurance_adjuster != undefined) {
                _.forEach(contactObj.insurance_adjuster, function (item) {
                    var contact = addContactObj(item);
                    contact.role = "Insurance Adjuster";
                    listOfContacts.push(contact);
                });
            }

            // lien_insurance_provider: []
            if (contactObj && contactObj.lien_insurance_provider != undefined) {
                _.forEach(contactObj.lien_insurance_provider, function (item) {
                    var contact = addContactObj(item);
                    contact.role = "Lien Insurance Provider";
                    listOfContacts.push(contact);
                });
            }

            // lien_adjuster: []
            if (contactObj && contactObj.lien_adjuster != undefined) {
                _.forEach(contactObj.lien_adjuster, function (item) {
                    var contact = addContactObj(item);
                    contact.role = "Lien Adjuster";
                    listOfContacts.push(contact);
                });
            }

            // lien_holder: []
            if (contactObj && contactObj.lien_holder != undefined) {
                _.forEach(contactObj.lien_holder, function (item) {
                    var contact = addContactObj(item);
                    contact.role = "Lien Holder";
                    listOfContacts.push(contact);
                });
            }

            // physician: []
            if (contactObj && contactObj.physician != undefined) {
                _.forEach(contactObj.physician, function (item) {
                    var contact = addContactObj(item);
                    contact.role = "Physician";
                    listOfContacts.push(contact);
                });
            }

            // service_provider: []
            if (contactObj && contactObj.service_provider != undefined) {
                _.forEach(contactObj.service_provider, function (item) {
                    var contact = addContactObj(item);
                    contact.role = "Service Provider";
                    listOfContacts.push(contact);
                });
            }
            return listOfContacts;
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

                // if allday event set current
                if (event.all_day == 1) {
                    showhideDates(event, pageMode);
                    if (utils.isNotEmptyVal(event.matterid) && addEditEventsParams.criticalDats == "ctdates") {
                        event.start = roundOffTime('start');
                        event.end = roundOffTime('end');
                    }
                } else {
                    showhideDates(event, pageMode);
                    //convert to date object
                    //date recieved is utc string, we require date object to bind with input type date

                    var startdt = new Date(moment.unix(event.utcstart));
                    var enddt = new Date(moment.unix(event.utcend));
                    event.start = addZero(startdt.getHours()) + ':' + addZero(startdt.getMinutes());
                    event.end = addZero(enddt.getHours()) + ':' + addZero(enddt.getMinutes());
                }
                // event.remindMe = _.isNull(event.reminder_datetime) ? false : true;
                //convert to 'MM/dd/yyyy' date string
                // event.reminder_datetime = _.isNull(event.reminder_datetime) ? moment().format('MM/DD/YYYY') :
                //   moment.unix(event.reminder_datetime).format('MM/DD/YYYY');
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

                if (utils.isValidDateRange(event.utcstart, event.utcend)) {
                    var start = event.utcstart,
                        end = event.utcend;

                    event.utcstart = utils.setFulldayTime(event.utcstart, 'start');
                    event.utcend = utils.setFulldayTime(event.utcend, 'end');

                    event.utcstart = moment.unix(event.utcstart).format('MM/DD/YYYY');
                    event.utcend = moment.unix(event.utcend).format('MM/DD/YYYY');
                } else {
                    event.utcstart = moment.unix(event.utcstart).format('MM/DD/YYYY');
                    event.utcend = moment.unix(event.utcend).format('MM/DD/YYYY');
                }

            } else { // Add event

                //console.log('date format', globalConstants.dateformat);
                //                event.start = roundOffTime('start');
                //                event.end = roundOffTime('end');

                /*set default values of event start and end time */
                event.start = '09:00';
                event.end = '10:00';
                // set current date as start date
                event.utcstart = moment().format('MM/DD/YYYY');
                // set current date as end date
                event.utcend = moment().format('MM/DD/YYYY');
                // set current date as reminder date
                event.reminder_datetime = moment().format('MM/DD/YYYY');


            }
        }

        // show hide date selectore based on label type
        function showhideDates(event, pageMode, allDay) {
            // event.all_day == "0"
            event.DeadlineDatesClicked = event.is_deadline == 1 ? false : true;

            var fulldayEventsIds = globalConstants.fulldayEvents;
            var isCritical = fulldayEventsIds.indexOf(parseInt(event.label_id)) > -1;
            var isFullDayEvent = (isCritical || allDay == 1);

            event.criticalDatesClicked = isCritical;

            if (isFullDayEvent) {
                event.all_day = 1;
                if (pageMode == 'edit') {
                    event.utcend = event.utcend;
                } else {
                    event.utcend = moment(event.utcend).format('MM/DD/YYYY');
                }
            } else {
                event.start = '09:00';
                event.end = '10:00';
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

            if (event.all_day == 1) {

                if (start.isSame(end)) {
                    return true
                }

            }
            return end.isAfter(start);
        }

        function isCriticalDate(labelId) {
            var criticalDateslabelIds = [globalConstants.solLabelId.toString(),
            globalConstants.nocLabelId.toString(),
            globalConstants.noiLabelId.toString()
            ];
            return criticalDateslabelIds.indexOf(labelId) > -1;
        }

        // prepare dates before sending to API
        function setDates(event) {
            //date converted to string to match the api
            event.reminder_datetime = event.remindMe ? moment(event.reminder_datetime).format('DD-MM-YYYY') : 0;
            event.sms_custom_reminder = (utils.isEmptyVal(event.sms_custom_reminder)) ? '' : utils.getUTCTimeStamp(event.sms_custom_reminder);
            //to manage the different names for the same property in api assign reminder_datetime to remind_date
            event.remind_date = event.reminder_datetime;
            //convert moment string date format to date object

            //date converted to timestamp
            event.custom_reminder = (utils.isEmptyVal(event.custom_reminder)) ? '' : utils.getUTCTimeStamp(event.custom_reminder);
            event.utcstart = new Date(event.utcstart);
            event.utcend = new Date(event.utcend);

            //check if event is an all day event, if all day event form utc considering only date and no time
            //utcstart, utcnend  prop has date and start/end prop has time
            event.start = event.all_day == '1' ? formTimestamp(event.utcstart, event.start, true, 'start') :
                formTimestamp(event.utcstart, event.start, false);

            event.end = event.all_day == '1' ? formTimestamp(event.utcend, event.end, true, 'end') :
                formTimestamp(event.utcend, event.end, false);
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
        .module('cloudlex.events')
        .factory('eventCronologyHelper', eventCronologyHelper);

    eventCronologyHelper.$inject = ['$modal'];

    function eventCronologyHelper($modal) {
        return {
            openEventRemarkPopup: _openEventRemarkPopup,
            isEventUpdated: _isEventUpdated,
            setUpdatedCalEvent: _setUpdatedCalEvent
        }

        function _openEventRemarkPopup(data) {
            return $modal.open({
                templateUrl: 'app/events/partials/eventUpdateBox.html',
                controller: ['$scope', '$modalInstance', 'masterData', function ($scope, $modalInstance, masterData) {
                    $scope.eventData = masterData.getMasterData();
                    $scope.eventReason = $scope.eventData.event_reschedule_reason;

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
            if (oldEvt.private != updatedEvt.private || oldEvt.all_day != updatedEvt.all_day || oldEvt.label_id != updatedEvt.label_id ||
                oldEvt.start != updatedEvt.start || oldEvt.end != updatedEvt.end || oldEvt.sms_reminder_days.toString() != updatedEvt.sms_reminder_days.toString() ||
                oldEvt.utcstart != moment(updatedEvt.utcstart).format('MM/DD/YYYY') || oldEvt.utcend != moment(updatedEvt.utcend).format('MM/DD/YYYY') ||
                oldEvt.is_comply != updatedEvt.is_comply || oldEvt.name != updatedEvt.name || oldEvt.title != updatedEvt.title || oldEvt.location != updatedEvt.location || oldEvt.reminder_days.toString() != updatedEvt.reminder_days.toString() || oldEvt.matterid != updatedEvt.matterid || oldEvtCustRem != updatedCustRem || oldEvtCustRemForSMS != updatedCustRemForSMS) {
                return true;
            } else {
                return false;
            }
        }

        //set event obj to check event update
        function _setUpdatedCalEvent(existingEvent, evtUpdatedObj) {
            existingEvent.start = moment(existingEvent.start).unix();
            existingEvent.end = moment(existingEvent.end).unix();
            evtUpdatedObj.utcstart = moment(evtUpdatedObj.utcstart).unix();
            evtUpdatedObj.utcend = moment(evtUpdatedObj.utcend).unix();

            evtUpdatedObj.reminder_days = evtUpdatedObj.reminder_days.split(',');

            evtUpdatedObj.sms_reminder_days = evtUpdatedObj.sms_reminder_days.split(',');
            if (evtUpdatedObj.label_id !== '19' && evtUpdatedObj.label_id !== '32' && evtUpdatedObj.label_id !== '100') {
                existingEvent.title = "";
            }
            if (evtUpdatedObj.all_day == '1') {
                existingEvent.start = evtUpdatedObj.start;
                existingEvent.end = evtUpdatedObj.end;
            }
            existingEvent.location = utils.isEmptyVal(existingEvent.location) ? "" : existingEvent.location;
            evtUpdatedObj.location = utils.isEmptyVal(evtUpdatedObj.location) ? "" : evtUpdatedObj.location; //Bug#6159
        }

    }


})(angular);
