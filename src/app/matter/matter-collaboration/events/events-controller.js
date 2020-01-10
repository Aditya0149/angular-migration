(function () {

    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('MatterCollaborationEventsCtrl', MatterCollaborationEventsController);

    MatterCollaborationEventsController.$inject = ['$scope', '$state', 'eventsDataService', 'eventsHelper', 'userSession', '$stateParams', '$modal',
        'createDialog', 'notification-service', 'globalConstants', 'modalService', 'matterFactory', '$rootScope', 'routeManager', 'masterData', 'practiceAndBillingDataLayer', 'contactFactory', 'mailboxDataService', 'allPartiesDataService'
    ];

    function MatterCollaborationEventsController($scope, $state, eventsDataService, eventsHelper, userSession, $stateParams, $modal,
        createDialog, notificationService, globalConstants, modalService, matterFactory, $rootScope, routeManager, masterData, practiceAndBillingDataLayer, contactFactory, mailboxDataService, allPartiesDataService) {

        var self = this;
        self.matterId = $stateParams.matterId;
        var matterId = $stateParams.matterId;

        self.eventsList = []; //Data model for holding list of matter notes        
        self.eventToBeAdded = {}; //Data model for holding new note details		
        self.searchEvent = "";
        self.selectedEvent = {};
        self.eventHistoryData = [];

        self.showEventDetails = showEventDetails;
        self.allEventselected = allEventselected;
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
        self.sortApplications = sortApplications;
        self.firmData = { API: "PHP", state: "mailbox" };
        self.firmData = JSON.parse(localStorage.getItem('firmSetting'));
        self.isClientPortal = gracePeriodDetails.client_portal; //US#5554

        //US#5678-  page filters for event history grid data
        var pageNumber = 1;
        var pageSize = 50;
        self.exportEventHistory = exportEventHistory; //US#5678-download event history
        self.userSelectedType = [{ id: 1, name: 'Assigned to Matter' }, { id: 2, name: 'All Users' }, { id: 3, name: 'Select User' }];
		
		self.matterInfo = matterFactory.getMatterData(self.matterId);

        /**
         * Start: Matter Collaboration Code 
         */

        self.selectAllEvent = selectAllEvent;
        self.isEventSelected = isEventSelected;
        self.display = {};
        self.display.eventSelected = {};
        var allMatterEventSelected = false;
        self.clxGridOptions = {
            selectedItems: []
        };

        // Check whether all matter notes selected
        function allEventselected() {
            if (utils.isEmptyVal(self.eventsList)) {
                return false;
            }
            return self.clxGridOptions.selectedItems.length === self.list.length;
        }

        // select all matter notes
        function selectAllEvent(isSelected) {
            if (isSelected === true) {
                self.clxGridOptions.selectedItems = angular.copy(self.eventsList);
            } else {
                self.clxGridOptions.selectedItems = [];
            }
        }

        var lengthHold;
        // select manual matter notes
        function isEventSelected(noteId) {
            var noteIds = _.pluck(self.clxGridOptions.selectedItems, 'event_id');
            if (self.clxGridOptions.selectedItems.length < lengthHold && allMatterEventSelected == true) {
                self.clxGridOptions.selectAll = false;
                allMatterEventSelected = false;
            }
            self.display.eventSelected[noteId] = noteIds.indexOf(noteId.event_id) > -1;
            return noteIds.indexOf(noteId.event_id) > -1;
        }

        // function selectAllEvent(flag) {
        //     if (flag) {
        //         var eventArray = [];
        //         var years = Object.keys(self.eventsList);
        //         for (var i = 0; i < years.length; i++) {
        //             for (var j = 0; j < self.eventsList[years[i]].length; j++) {
        //                 eventArray.push(angular.copy(self.eventsList[years[i]][j]));
        //             }
        //         }
        //         self.clxGridOptions.selectedItems = _.uniq(eventArray, function (item) {
        //             return item.event_id;
        //         });
        //     } else {
        //         self.clxGridOptions.selectedItems = [];
        //     }
        // };

        // /*check if event is selected*/
        // function isEventSelected(event) {
        //     if (self.clxGridOptions != undefined) {
        //         self.display.eventSelected[event.event_id] = isEventSelectedChecked(self.clxGridOptions.selectedItems, event);
        //         return self.display.eventSelected[event.event_id];
        //     }
        // }

        // self.isEventClicked = isEventClicked;
        // /*check if event is selected*/
        // function isEventClicked(event) {
        //     if (self.clxGridOptions != undefined) {
        //         self.display.eventSelected[event.event_id] = isEventSelectedChecked(self.clxGridOptions.selectedItems, event);
        //         if (!(self.display.eventSelected[event.event_id])) {
        //             self.clxGridOptions.selectAll = false;
        //         }

        //     }
        // }

        // function isEventSelectedChecked(eventList, event) {
        //     var ids = _.pluck(eventList, 'event_id');
        //     return ids.indexOf(event.event_id) > -1;
        // }

        self.modalInstance = '';
        self.openFilterPopUp = openFilterPopUp;
        //open filter pop up
        function openFilterPopUp() {
            var calFilterV1 = sessionStorage.getItem('calendarFilterv1') ? sessionStorage.getItem('calendarFilterv1') : '{"location":"","selectedUsers":[]}';
            var obj = JSON.parse(calFilterV1);
            var location;
            (utils.isNotEmptyVal(obj) && utils.isNotEmptyVal(obj.location)) ? location = obj.location : location = "";
            var assigned;
            (utils.isNotEmptyVal(obj) && utils.isNotEmptyVal(obj.selectedUsers)) ? assigned = obj.selectedUsers : assigned = "";
            if (utils.isNotEmptyVal(assigned)) {
                self.assignedUsers = assigned;
            }
            self.location = location;

            self.modalInstance = $modal.open({
                templateUrl: 'app//matter/matter-collaboration/events/calendar-filter.html',
                controller: ['$scope', '$modalInstance', 'eventsDataService', function ($scope, $modalInstance, eventsDataService) {
                    $scope.location = '';
                    $scope.user = {
                        assignedUsers: []
                    };
                    $scope.ok = function () {
                        $modalInstance.close('this is result for close');
                    };
                    $scope.getUsersList = getUsersList;
                    function getUsersList() {
                        eventsDataService.getStaffsInFirm()
                            .then(function (data) {
                                $scope.assignedToUserList = data;
                            }, function (err) {
                                console.log(err);
                            });
                    }
                    $scope.cancel = function () {
                        $modalInstance.dismiss('this is result for dismiss');
                    };

                    $scope.apply = function (assignedUsers, location) {
                        var filterObj = {};
                        filterObj.assignedUsers = assignedUsers;
                        filterObj.location = location;
                        $modalInstance.close(filterObj);
                    }

                    getUsersList();

                }],
                windowClass: 'modalMidiumDialog event-filter-popup',
                backdrop: 'static',
                keyboard: false
            });

            self.modalInstance.result.then(function (result) {
                self.filter = result;
                self.tags = generateTags(result);
                sessionStorage.setItem('calendarFilterv1', JSON.stringify(self.filter));
                var callFunc = sessionStorage.getItem("globalEventType");
                callFunc == "allevents" ? self.allEvent() : self.myEvent();
            });

        }

        function generateTags(result) {
            var tags = [];
            if (utils.isNotEmptyVal(result.assignedUsers) && (result.assignedUsers.length > 0)) {
                _.forEach(result.assignedUsers, function (currentItem) {
                    var tagObj = {
                        key: 'assignto',
                        id: currentItem.user_id,
                        value: 'Assign to: ' + currentItem.full_name
                    };
                    tags.push(tagObj);
                });
            }

            if (utils.isNotEmptyVal(result.location)) {
                var tagObj = {
                    key: 'location',
                    value: 'Location: ' + result.location
                };
                tags.push(tagObj);
            }

            return tags;
        }

        /**
         * End: Matter Collaboration Code
         */

        (function () { //Get events
            displayWorkflowIcon();
            getUserEmailSignature();
            //check for any selected event from any previous page
            var selectedEvent = eventsHelper.getSelectedEvent();
            self.clikedevent = selectedEvent;
            if (!utils.isEmptyObj(selectedEvent)) {
                self.selectedEvent = selectedEvent;
            }


            self.sorts = [
                { key: 'ASC', name: "Oldest First" },
                { key: 'DESC', name: "Most Recent" }

            ];
            self.sortby = utils.isNotEmptyVal(sessionStorage.getItem('matterEventSortBy')) ? sessionStorage.getItem('matterEventSortBy') : "ASC";

            getEvents();

            //matterFactory.setBreadcrum(self.matterId, 'Events');
            // matterFactory.setBreadcrumWithPromise(self.matterId, 'Events').then(function (resultData) {
            //     self.matterInfo = resultData;
            // });

            var retainSText = JSON.parse(sessionStorage.getItem("retainSearchTextForEventCollaboration"));
            if (utils.isNotEmptyVal(retainSText)) {
                if (self.matterId == retainSText.matterid) {
                    self.searchEvent = retainSText.events_filtertext;
                }
            }



        })();

        function sortApplications() {
            var main = document.getElementById('main-event');
            [].map.call(main.children, Object).sort(function (a, b) {
                return +b.id.match(/\d+/) - +a.id.match(/\d+/);
            }).forEach(function (elem) {
                main.appendChild(elem);
            });
            // console.log("he");
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
            sessionStorage.setItem('matterEventSortBy', self.sortby);
            // reset selected event when sort is applied.
            self.selectedEvent = {};

            getEvents();

        }
        self.list = [];
        /*** Service call Functions ***/
        //Get events for selected matter        
        function getEvents() {
            //self.eventsList = [];
            self.migrate = localStorage.getItem('Migrated');
            eventsDataService.getEvents_OFF_DRUPAL(matterId, self.sortby)
                .then(function (response) {
                    self.EventisInList = false;
                    self.isDataAvailable = true;
                    //Store events list
                    var eventsList = response.data;
                    self.list = response.data;
                    _.forEach(eventsList, function (item) {
                        item.event_display_name = (item.label_id == '100' || item.label_id == '19' || item.label_id == '32') ? item.title : item.event_name;
                        item.utcstart = angular.isDefined(item.start) ? item.start : item.start;
                        item.utcend = angular.isDefined(item.end) ? item.end : item.end;
                        if (item.custom_reminder) {
                            item.custom_reminder = utils.isEmptyVal(item.custom_reminder) ? '' : moment.unix(item.custom_reminder).utc().format('MM-DD-YYYY');
                        }
                    })
                    _.forEach(eventsList, function (e) {
                        if (utils.isNotEmptyVal(e.reminder_days)) {
                            e.reminder_days = e.reminder_days.split(',');
                        } else {
                            e.reminder_days = [];
                        }
                    });
                    self.eventsList = setEventList(eventsList);
                    var copyEvents = self.eventsList;
                    self.eventsList = [];
                    self.eventsList = _.sortBy(copyEvents, 'year').reverse();
                }, function (error) {
                    console.log('unable to fetch events');
                });
        }

        // $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
        //     goToselectedEvent();
        // });

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
                container.animate({
                    scrollTop: scrollTo.offset().top - $("#main-event").offset().top
                }, 100);
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
            // var uniqYears = _.uniq(_.pluck(eventList, 'year'));
            // var newEventList = {}
            // _.forEach(uniqYears, function (year) {
            //     newEventList[year] = _.filter(eventList, function (event) {
            //         return event.year === year;
            //     });
            // });

            // if (Object.keys(newEventList).length == 0) {
            //     newEventList = [];
            // }
            return eventList;
        }


        /*** Event Handlers ***/
        function selectEvent(event) {
            self.selectedEvent = event;
            //US#8100 view assign to user
            self.assigned_to_name = utils.isEmptyVal(self.selectedEvent.assigned_to) ? '' : _.pluck(self.selectedEvent.assigned_to, 'full_name').join(', ');

            //get event history data for selected event
            getEventHistoryData(self.selectedEvent.event_id);
            //US#8328 for call function
            setReminderDaysList(event);
            getEventRemindUser(event);
            eventsHelper.setSelectedEvent(event);
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
            eventsDataService.downloadEventHistory(self.selectedEvent.event_id, pageNumber, pageSize);
        }


        // active class to show as selected on the UI
        function isSelected(event) {
            return self.selectedEvent.event_id == event.event_id;
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
            var retainSText = JSON.parse(sessionStorage.getItem("retainSearchTextForEventCollaboration"));
            if (utils.isNotEmptyVal(retainSText)) {
                if (self.matterId != retainSText.matterid) {
                    $rootScope.retainSearchTextForEventCollaboration = {};
                }
            }
            $rootScope.retainSearchTextForEventCollaboration = {};
            $rootScope.retainSearchTextForEventCollaboration.events_filtertext = self.searchEvent;
            $rootScope.retainSearchTextForEventCollaboration.matterid = self.matterId;
            sessionStorage.setItem("retainSearchTextForEventCollaboration", JSON.stringify($rootScope.retainSearchTextForEventCollaboration));
        }


        function addEditEvent(mode, data) {
            data = self.selectedEvent;
            var resolveObj = {
                mode: mode,
                selectedEvent: mode === 'edit' ? data : undefined
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
            //if(angular.isDefined(data)){
            //self.selectedEvent = data;
            //}
            var modalInstance = openAddEditEventsModal(angular.copy(resolveObj));
            getEventsListAfterSuccess(modalInstance);


        }

        function openAddEditEventsModal(resolveObj) {
            return $modal.open({
                templateUrl: 'app/events/partials/add-event.html',
                controller: 'collaborateMatterAddEditEventCtrl as addEditEvent',
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
                }
                getEvents();
                goToselectedEvent();
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

        //US#8558 Event & Task reminder to matter users or all users
        function getEventRemindUser(event) {
            if (utils.isEmptyVal(event)) { return }
            if (event.reminder_users == "matter") {
                self.reminder_users_id = 1;
            } else if (event.reminder_users == "all") {
                self.reminder_users_id = 2;
            } else if (event.reminder_users && event.reminder_users.length > 0 && JSON.parse(event.reminder_users) instanceof Array) {
                self.users = [];
                self.reminder_users_id = 3;
                if (angular.isDefined(event.reminder_users) && event.reminder_users != "" && event.reminder_users != "all" && event.reminder_users != "matter") {
                    //event.remind_users_temp = event.reminder_users;
                    //self.selectedEvent.remind_users_temp = event.reminder_users;
                } else {
                    // event.remind_users_temp = [];
                    self.selectedEvent.remind_users_temp = event.reminder_users;
                }

                // contactFactory.getUsersInFirm()
                //     .then(function (response) {
                //         self.users = response.data;
                //         self.selectedEvent.remind_users_temp = [];
                //         _.forEach(JSON.parse(event.reminder_users), function (taskid, taskindex) {
                //             _.forEach(self.users, function (item) {
                //                 if (taskid == item.uid) {
                //                     self.selectedEvent.remind_users_temp.push(taskid);
                //                 }
                //             });
                //         });
                //     });

                eventsDataService.getStaffsInFirm()
                    .then(function (data) {
                        self.users = data;
                        self.selectedEvent.remind_users_temp = [];
                        if (event.reminder_users && event.reminder_users.length > 0) {

                            _.forEach(JSON.parse(event.reminder_users), function (taskid, taskindex) {
                                _.forEach(self.users, function (item) {
                                    if (taskid == item.user_id) {
                                        self.selectedEvent.remind_users_temp.push(parseInt(taskid));
                                    }
                                });
                            });
                        }

                    }, function (err) {
                        console.log(err);
                    });

            }
        }

        $scope.$watch(function () {
            localStorage.setItem('matterCollaborationEvents', JSON.stringify(self.clxGridOptions.selectedItems))
            $rootScope.matterCollaborationEventsCount = self.clxGridOptions.selectedItems.length;
        })

        // checkmatterCollaborationEventsCount();
        // function checkmatterCollaborationEventsCount(){
        //     $scope.$watch(function () {
        //         return self.clxGridOptions.selectedItems;
        //     }, function (newVal) {
        //         if (newVal) {
        //             localStorage.setItem('matterCollaborationEvents', JSON.stringify(self.clxGridOptions.selectedItems))
        //             $rootScope.matterCollaborationEventsCount = self.clxGridOptions.selectedItems.length;
        //         }
        //     });
        // }


        self.matterCollaborationEventPermissionToggle = matterCollaborationEventPermissionToggle;

        function matterCollaborationEventPermissionToggle(flag) {
            localStorage.setItem('matterCollaborationEventPermission', flag);
        }

    }


})();

(function () {
    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('collaborateMatterAddEditEventCtrl', collaborateMatterAddEditEventCtrl);

    collaborateMatterAddEditEventCtrl.$inject = ['$modalInstance', '$modal', '$stateParams', 'eventsDataService', 'masterData', 'addEditEventsParams', 'notification-service', 'globalConstants', 'eventsHelper', 'matterFactory', 'eventCronologyHelper', 'contactFactory', 'taskSummaryDataLayer', 'practiceAndBillingDataLayer', 'allPartiesDataService', '$rootScope'];

    function collaborateMatterAddEditEventCtrl($modalInstance, $modal, $stateParams, eventsDataService, masterData, addEditEventsParams, notificationService, globalConstants, eventsHelper, matterFactory, eventCronologyHelper, contactFactory, taskSummaryDataLayer, practiceAndBillingDataLayer, allPartiesDataService, $rootScope) {
        var pageMode;
        var matterId = $stateParams.matterId;
        var self = this;
        // var  masterData = masterDataService.getMasterData();
        // var userPermission = masterData.user_permission[0].permissions;

        //var selectTime;
        self.event = {};
        self.open = openCalender;
        //self.delete = deleteEvent;
        self.fullDayChanged = fullDayChanged;
        self.save = save;
        self.cancel = closeModal;
        self.selectTime = globalConstants.timeArray;
        self.disableReminder = eventsHelper.disableReminder;

        // variable to track if critical date clicked
        self.event.criticalDatesClicked = false;
        self.event.DeadlineDatesClicked = false;

        self.showhideDates = showhideDates;
        self.getFormattedDateString = getFormattedDateString;
        self.isDatesValid = isDatesValid;
        self.setEndTime = setEndTime;

        //US#3119-set default values for Remind Me in Days:
        //self.reminderDaysList = globalConstants.reminderDaysList;
        self.reminderDaysList = angular.copy(globalConstants.reminderDaysList);


        self.setLocation = setLocation; //pointer to setLocation function
        self.formatEndDate = formatEndDate;
        self.checkEventType = checkEventType; //Add for US#8328
        var gracePeriodDetails = masterData.getUserRole();
        self.isClientPortal = gracePeriodDetails.client_portal;  //US#5554 check client portal flag
        // self.data = addEditEventsParams.data;
        self.addAssignedUser = addAssignedUser;

        self.removeAssignedUser = removeAssignedUser;
        self.calDays = calDays;

        // self.userAssignmentValidation = userAssignmentValidation;

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
            self.event.all_day = angular.isDefined(self.event.all_day) ? self.event.all_day : '1';
            self.event.user_defined = angular.isDefined(self.event.user_defined) ? self.event.user_defined : '0';
            self.event.title = angular.isDefined(self.event.title) ? self.event.title : '';
            self.assignedUsers = self.event.assigned_to;
            self.assignedToUserList = [];
            self.event.label_id = angular.isDefined(self.event.label_id) ? (self.event.label_id).toString() : '';

            self.userSelectedType = [{ id: 1, name: 'Assigned to Matter' }, { id: 2, name: 'All Users' }, { id: 3, name: 'Select User' }];


            if (self.pageMode !== 'edit') {
                self.event.reminder_days = ['0'];
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

            if (self.pageMode == 'add') {
                var user = { id: 1 };
                self.setUserMode(user);
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
        }
        // Fetching Users List for Assigning Event
        function getUsersList() {
            eventsDataService.getStaffsInFirm()
                .then(function (data) {
                    self.assignedToUserList = data
                }, function (err) {
                    console.log(err);
                });
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
                    } else {
                        self.event.all_day = 0;
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

        //US#8558 Event & Task reminder to matter users or all users
        function getEventRemindUser(event) {
            if (utils.isEmptyVal(event)) { return }
            if (event.reminder_users == "matter") {
                self.reminder_users_id = 1;
            } else if (event.reminder_users == "all") {
                self.reminder_users_id = 2;
            } else if (event.reminder_users && event.reminder_users.length > 0 && JSON.parse(event.reminder_users) instanceof Array) {
                self.users = [];
                self.reminder_users_id = 3;
                if (angular.isDefined(event.reminder_users) && event.reminder_users != "" && event.reminder_users != "all" && event.reminder_users != "matter") {
                    // self.event.remind_users_temp = event.reminder_users;
                } else {
                    self.event.remind_users_temp = [];
                }

                // contactFactory.getUsersInFirm()
                //     .then(function (response) {
                //         self.users = response.data;
                //         self.event.remind_users_temp = [];
                //         _.forEach(JSON.parse(event.reminder_users), function (taskid, taskindex) {
                //             _.forEach(self.users, function (item) {
                //                 if (taskid == item.uid) {
                //                     self.event.remind_users_temp = event.reminder_users;
                //                 }
                //             });
                //         });
                //     });

                eventsDataService.getStaffsInFirm()
                    .then(function (data) {
                        self.users = data;
                        self.event.remind_users_temp = [];
                        if (event.reminder_users && event.reminder_users.length > 0) {

                            _.forEach(JSON.parse(event.reminder_users), function (taskid, taskindex) {
                                _.forEach(self.users, function (item) {
                                    if (taskid == item.user_id) {
                                        self.event.remind_users_temp = event.reminder_users;
                                    }
                                });
                            });
                        }

                    }, function (err) {
                        console.log(err);
                    });


            }
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
                self.users = [];
                self.reminder_users_id = user.id;
                if (angular.isDefined(self.event.reminder_users) && self.event.reminder_users != "" && self.event.reminder_users != "all" && self.event.reminder_users != "matter") {
                    self.event.remind_users_temp = self.event.reminder_users;
                } else {
                    self.event.remind_users_temp = [];
                    self.event.reminder_users = [];
                }

                // contactFactory.getUsersInFirm()
                //     .then(function (response) {
                //         self.users = response.data;
                //         self.event.remind_users_temp = [];
                //         _.forEach(self.event.reminder_users, function (taskid, taskindex) {
                //             _.forEach(self.users, function (item) {
                //                 if (taskid == item.uid) {
                //                     self.event.remind_users_temp.push(taskid);
                //                 }
                //             });
                //         });
                //         $(".userPicker input").focus();
                //     });

                eventsDataService.getStaffsInFirm()
                    .then(function (data) {
                        self.users = data;
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
                    }, function (err) {
                        console.log(err);
                    });


            }

        };

    }





})();

(function (angular) {
    angular
        .module('cloudlex.matter')
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
            setSelectedEventFromList: _setSelectedEventFromList
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
        .module('cloudlex.matter')
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
            if (oldEvt.private != updatedEvt.private || oldEvt.all_day != updatedEvt.all_day || oldEvt.label_id != updatedEvt.label_id ||
                oldEvt.start != updatedEvt.start || oldEvt.end != updatedEvt.end ||
                oldEvt.utcstart != moment(updatedEvt.utcstart).format('MM/DD/YYYY') || oldEvt.utcend != moment(updatedEvt.utcend).format('MM/DD/YYYY') ||
                // oldEvt.utcstart != updatedEvt.utcstart || oldEvt.utcend != updatedEvt.utcend || 
                oldEvt.is_comply != updatedEvt.is_comply || oldEvt.name != updatedEvt.name || oldEvt.title != updatedEvt.title || oldEvt.location != updatedEvt.location || oldEvt.reminder_days.toString() != updatedEvt.reminder_days.toString() || oldEvt.matterid != updatedEvt.matterid || oldEvtCustRem != updatedCustRem) {
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

