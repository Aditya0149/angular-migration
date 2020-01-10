(function (angular) {

    angular.module('cloudlex.notification')
        .controller("NotificationCtrl", Notifications);

    Notifications.$inject = ['$state', 'tasksHelper', 'headerDataHelper', 'notificationDatalayer', '$modalInstance', 'notification-service', '$rootScope', 'eventsDataService', 'eventsHelper', 'documentListHelper', 'masterData', 'matterListHelper', '$q', 'intakeEventsHelper', 'IntakeTasksHelper'];

    function Notifications($state, tasksHelper, headerDataHelper, notificationDatalayer, $modalInstance, notificationService, $rootScope, eventsDataService, eventsHelper, documentListHelper, masterData, matterListHelper, $q, intakeEventsHelper, IntakeTasksHelper) {
        var vm = this;

        var selectedReminders = [];
        var selectedDocuments = [];
        vm.selecReminder = selecReminder;
        vm.dismissReminder = dismissReminder;
        vm.selectAllNotifications = selectAllNotifications;
        vm.allNotificationSelected = allNotificationSelected;
        vm.isNotifySelected = isNotifySelected;
        vm.reminderList = [];
        vm.activateTab = activateTab;
        vm.gotoTask = gotoTask;
        vm.gotoEvent = gotoEvent;
        vm.goToMatterOverview = goToMatterOverview;
        vm.goToDocument = goToDocument;
        vm.goToEntityTypeName = goToEntityTypeName;
        vm.gotoReminderEvent = gotoReminderEvent;
        vm.goToReminderMatter = goToReminderMatter;
        vm.goToSidebarMatter = goToSidebarMatter;
        vm.goToEntityTypeName = goToEntityTypeName;
        vm.goToEventMatter = goToEventMatter;
        vm.closePopUp = closePopUp;
        vm.clearNotification = clearNotification;
        vm.clearNotificationLite = clearNotificationLite;
        vm.noDataReminder;
        vm.isRecordSelected = isRecordSelected;
        vm.allRecordselected = allRecordselected;
        vm.selectItems = selectItems;
        vm.selectAllRecord = selectAllRecord;
        sessionStorage.setItem('fromNotification', true);

        vm.allfirmData = JSON.parse(localStorage.getItem('allFirmSetting'));
        _.forEach(vm.allfirmData, function (item) {
            if (item.state == "entity_sharing") {
                vm.isCollaborationActive = (item.enabled == 1) ? true : false;
            }
        });
        vm.loadPage = $rootScope.loadPage;

        var gracePeriodDetails = masterData.getUserRole();
        vm.launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
        vm.launchpadAccess = (vm.launchpad.enabled == 1) ? true : false;

        /** Set  isPortalEnabled flag to show/hide client communicator icon **/
        if (!(angular.isDefined($rootScope.isPortalEnabled))) {
            $rootScope.isPortalEnabled = (gracePeriodDetails.client_portal == '1') ? true : false;
        }

        vm.editDocument = editDocument;
        vm.gotoMessage = gotoMessage;
        vm.pageNum = 1;
        (function () {
            vm.activeTab = {};
            var selectedTab = localStorage.getItem("notificationTab");
            selectedTab = utils.isNotEmptyVal(selectedTab) ? selectedTab : "sidebar";
            vm.activeTab[selectedTab] = true;
            getNotificationCounts();
            getReminders();
            getNotificationData();

        })();

        $rootScope.$on('updateMessageList', function (event, args) {
            notificationDatalayer.getDeleteMessageNotification(args.msg[0].matter_id)
                .then(function (res) {
                    var index = _.findIndex(vm.messageList, { matter_id: args.msg[0].matter_id });
                    vm.messageList.splice(index, 1);
                    notificationDatalayer.getMessageList()
                        .then(function (res) {
                            vm.counts.msg_count = res.data.total_count;
                        })
                })
        });

        function setReminderList(allReminders) {
            vm.reminderList = [];
            // add event reminders to reminder list 
            _.forEach(allReminders.event_reminder, function (evt) {
                var reminderObj = {
                    event_id: evt.eventid,
                    reminderid: evt.eventid,
                    matterName: evt.matterName,
                    reminderName: 'Event: ' + evt.eventname,
                    reminderTime: evt.starttime,
                    allday: evt.allday,
                    matterid: evt.matter_id,
                    type: 'event'
                };
                vm.reminderList.push(reminderObj);
            });

            // add task reminders to reminder list 
            _.forEach(allReminders.task_reminder, function (task) {
                var reminderObj = {
                    task_id: task.taskid,
                    reminderid: task.taskid,
                    matterName: task.matterName,
                    reminderName: 'Task: ' + task.taskname,
                    matterid: task.matter_id,
                    reminderTime: moment.unix(task.duedate).utc().format("MM/DD/YYYY"),
                    type: 'task'
                };
                vm.reminderList.push(reminderObj);
            });
        }

        function closePopUp() {
            $modalInstance.dismiss();
        }

        /* US#4288....Changes are made to clear the notification on click of 'x' action in notification*/
        function clearNotification(notifId, fromTab, $event) {
            //US#11646
            if (!notifId) {
                if (selectedReminders.length == 0) {
                    var msg = "";
                    switch (fromTab) {
                        case 'task':
                            msg = "Please select a task to dismiss.";
                            break;
                        case 'event':
                            msg = "Please select a event to dismiss.";
                            break;
                        case 'sidebar':
                            msg = "Please select a sidebar comment to dismiss.";
                            break;
                    }
                    notificationService.error(msg);
                    return;
                } else {
                    var ids = (fromTab != 'sidebar' && fromTab != 'cloudelexLite') ? _.pluck(selectedReminders, 'notification_id') : (fromTab == 'cloudelexLite') ? _.pluck(selectedReminders, 'id') : _.pluck(selectedReminders, 'cid');
                }
            } else {
                var ids = notifId.split(' ');
            }
            $event.stopPropagation();
            notificationDatalayer.readNotifications(ids, fromTab, $rootScope.onIntake)
                .then(function (res) {
                    selectedReminders = [];
                    if (utils.isNotEmptyVal(res.data)) {
                        notificationService.success("Dismissed successfully.");
                        var activeTab = getActiveTab();
                        if (activeTab == 'sidebar') {
                            vm.sidebarList = res.data.data;
                            vm.counts.sidebar_comment_count = res.data.total_count;

                            if ($rootScope.onIntake) {
                                $rootScope.$broadcast('updateSidebarCountForIntake', { count: res.data }); //Bug#7043 : update count on notification
                            } else {
                                $rootScope.$broadcast('updateSidebarCount', { count: res.data }); //Bug#7043 : update count on notification
                            }

                        } else if (activeTab == 'task') {
                            _.forEach(res.data.data, function (task, index) {
                                res.data.data[index].created_on = utils.isNotEmptyVal(task.created_on) ?
                                    moment.unix(task.created_on).format("MM/DD/YYYY HH:MM A") : "";
                            })
                            vm.taskList = res.data.data;
                            vm.counts.task_count = res.data.total_count;

                            if ($rootScope.onIntake) {
                                $rootScope.$broadcast('updateTaskCountForIntake', { count: res.data }); //Bug#7043 : update count on notification
                            } else {
                                $rootScope.$broadcast('updateTaskCount', { count: res.data }); //Bug#7043 : update count on notification
                            }

                        }
                        else if (activeTab == 'event') {
                            _.forEach(res.data.data, function (task, index) {
                                var dateFormat = task.allday == 0 ? "MM/DD/YYYY hh:mm a" : "MM/DD/YYYY";
                                res.data.data[index].created_on = utils.isNotEmptyVal(task.created_on) ?
                                    moment.unix(task.created_on).format("MM/DD/YYYY hh:mm a") : "";
                                res.data.data[index].display_start = utils.isNotEmptyVal(task.start) ?
                                    moment.unix(task.start).format(dateFormat) : "";
                                res.data.data[index].display_end = utils.isNotEmptyVal(task.end) ?
                                    moment.unix(task.end).format(dateFormat) : "";
                            })
                            vm.eventList = res.data.data;
                            vm.counts.event_count = res.data.total_count;

                            if ($rootScope.onIntake) {
                                $rootScope.$broadcast('updateEventCountForIntake', { count: res.data }); //Bug#7043 : update count on notification
                            } else {
                                $rootScope.$broadcast('updateEventCount', { count: res.data }); //Bug#7043 : update count on notification
                            }
                        }

                        // else if (activeTab == 'cloudelexLite') {
                        //     vm.docList = res.data.data;
                        //     vm.counts.lite_count = res.data.total_count;
                        //     $rootScope.$broadcast('updateDocCount', { count: res.data });
                        // }
                    }
                }, function (error) {
                    notificationService.error('An error occurred. Please try later.');
                });
            //     var activeTab = getActiveTab();
            //     if (activeTab == 'cloudelexLite') {
            //     notificationDatalayer.updateReadStatus(ids)
            //     .then(function (res) {
            //         if (utils.isNotEmptyVal(res.data)) {
            //             notificationService.success("Dismissed successfully.");
            //             var activeTab = getActiveTab();
            //             if (activeTab == 'cloudelexLite') {
            //                 vm.docList = res.data.notificationData;
            //                 vm.counts.lite_count = res.data.count;
            //                 $rootScope.$broadcast('updateDocCount', { count: res.data.notificationData });
            //             }
            //         }
            //     },  function (error) {
            //         notificationService.error('An error occurred. Please try later.');
            //     });
            // }
        }
        /* US#4288....End*/

        //Notifications on CLX for CLX lite: US-14210
        function clearNotificationLite(notifId, fromTab, $event) {
            //US#11646
            if (!notifId) {
                if (selectedReminders.length == 0) {
                    var msg = "";
                    switch (fromTab) {
                        case 'task':
                            msg = "Please select a task to dismiss.";
                            break;
                        case 'event':
                            msg = "Please select a event to dismiss.";
                            break;
                        case 'sidebar':
                            msg = "Please select a sidebar comment to dismiss.";
                            break;
                        case 'cloudelexLite':
                            msg = "Please select a Cloudlex Lite notification to dismiss.";
                            break;
                    }
                    notificationService.error(msg);
                    return;
                } else {
                    var ids = _.pluck(selectedReminders, 'id');
                }
            } else {
                var ids = notifId.split(' ');
            }
            $event.stopPropagation();

            notificationDatalayer.updateReadStatus(ids)
                .then(function (res) {
                    selectedReminders = [];
                    if (utils.isNotEmptyVal(res.data)) {
                        notificationService.success("Dismissed successfully.");
                        var activeTab = getActiveTab();
                        // vm.docList = res.data.notificationData;
                        // vm.counts.lite_count = res.data.count;
                        var getData = getcloudelexLiteNotification();
                        $q.all([getData]).then(function (values) {
                            $rootScope.$broadcast('updateDocCount', { count: vm.counts.lite_count });
                        });
                    }
                }, function (error) {
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function getFullTabName() {
            var activeTab = getActiveTab();
            var tabs = {
                "sidebar": "Sidebar",
                "sync": "Sync Notification",
                "task": "Task",
                "reminders": "Reminders",
                "cloudelexLite": "Document Upload",
            };
            return tabs[activeTab];
        }


        function getNotificationCounts() {
            if ($rootScope.onIntake) {
                notificationDatalayer.getNotificationCountForIntake()
                    .then(function (res) {
                        vm.counts = res.data;
                        headerDataHelper.setNotificationCountForIntake(vm.counts, false);
                    });
            } else {
                notificationDatalayer.getNotificationCount()
                    .then(function (res) {
                        vm.counts = res.data;
                        headerDataHelper.setNotificationCount(vm.counts, false);
                    });
            }

        }

        function getNotificationData() {
            var activeTab = getActiveTab();
            selectedReminders = [];
            selectedDocuments = [];
            switch (activeTab) {
                case 'sidebar':
                    getSidebarNotification();
                    break;
                case 'task':
                    getTaskList();
                    break;
                case 'event':
                    getEventList();
                    break;
                case 'sync':
                    getSyncList();
                    break;
                case 'reminders':
                    getReminders();
                    break;
                case 'cloudelexLite':
                    getcloudelexLiteNotification();
                    break;
            }
        };

        function getActiveTab() {
            var activeTab;
            angular.forEach(vm.activeTab, function (val, key) {
                if (val) { activeTab = key; }
            });
            return activeTab;
        }

        function getSidebarNotification() {
            if (utils.isNotEmptyVal(vm.sidebarList)) { return; }
            notificationDatalayer.getSidebarList($rootScope.onIntake)
                .then(function (res) {
                    if (utils.isNotEmptyVal(res.data)) {
                        vm.sidebarList = res.data.data;
                    } else { vm.sidebarList = []; }
                });
        }

        function getEventList() {
            if (utils.isNotEmptyVal(vm.eventList)) { return; }
            notificationDatalayer.getEventList($rootScope.onIntake)
                .then(function (res) {
                    if (utils.isNotEmptyVal(res.data)) {
                        /* US#4288....Changes are made to convert the timestamp into 'MM/DD/YYYY hh:mm a' format for notification template*/
                        _.forEach(res.data.data, function (task, index) {
                            var dateFormat = task.allday == 0 ? "MM/DD/YYYY hh:mm a" : "MM/DD/YYYY";
                            res.data.data[index].created_on = utils.isNotEmptyVal(task.created_on) ?
                                moment.unix(task.created_on).format("MM/DD/YYYY hh:mm a") : "";
                            res.data.data[index].display_start = utils.isNotEmptyVal(task.start) ?
                                moment.unix(task.start).format(dateFormat) : "";
                            res.data.data[index].display_end = utils.isNotEmptyVal(task.end) ?
                                moment.unix(task.end).format(dateFormat) : "";
                            res.data.data[index].matterid = _.isNull(task.matterid) ? '0' : task.matterid;
                        })
                        vm.eventList = res.data.data;
                    } else { vm.eventList = []; }
                });
        }

        function getTaskList() {
            if (utils.isNotEmptyVal(vm.taskList)) { return; }
            notificationDatalayer.getTaskList($rootScope.onIntake)
                .then(function (res) {
                    if (utils.isNotEmptyVal(res.data)) {
                        /* US#4288....Changes are made to convert the timestamp into 'MM/DD/YYYY hh:mm a' format for notification template*/
                        _.forEach(res.data.data, function (task, index) {
                            res.data.data[index].created_on = utils.isNotEmptyVal(task.created_on) ?
                                moment.unix(task.created_on).format("MM/DD/YYYY hh:mm a") : "";
                        })
                        vm.taskList = res.data.data;
                    } else { vm.taskList = []; }
                });
        }

        function getSyncList() {
            if (utils.isNotEmptyVal(vm.syncList)) { return; }
            notificationDatalayer.getSyncList($rootScope.onIntake)
                .then(function (res) {
                    if (utils.isNotEmptyVal(res.data)) {
                        vm.syncList = res.data.data;
                    } else { vm.syncList = []; }
                });
        }

        //US#11646 
        function selectRecords(isSelected, data) {
            if (isSelected) {
                selectedReminders = angular.copy(data);
                vm.isRecSelected = true;
            } else {
                selectedReminders = [];
            }
        }

        function selectAllRecord(param, isSelected, item) {

            if (param == 'task') {
                selectRecords(isSelected, vm.taskList);
            }
            if (param == 'event') {
                selectRecords(isSelected, vm.eventList);

            }
            if (param == 'cloudelexLite') {
                selectRecords(isSelected, vm.docList);

            }
            if (param == 'sidebar') {
                var sidebarComments = _.pluck(item, 'comments');
                var allComments = [];
                _.forEach(sidebarComments, function (item) {
                    _.forEach(item, function (current) {
                        allComments.push(current);
                    })
                });
                selectRecords(isSelected, allComments);
            }

        }


        // select manual matter notes
        function isRecordSelected(params, notification_id) {
            if (params == 'sidebar') {
                var uids = _.pluck(selectedReminders, 'cid')
                // check if current id exist in the selected events
                return (uids.indexOf(notification_id) > -1);
            }
            else if (params == 'cloudelexLite') {
                var uids = _.pluck(selectedReminders, 'id')
                // check if current id exist in the selected events
                return (uids.indexOf(notification_id) > -1);
            }
            else {
                var uids = _.pluck(selectedReminders, 'notification_id')
                // check if current id exist in the selected events
                return (uids.indexOf(notification_id) > -1);
            }


        }

        // Check whether all matter notes selected
        function allRecordselected(params, item) {
            if (params == 'task') {
                if (utils.isEmptyVal(vm.taskList)) {
                    return false;
                }
                else {
                    return selectedReminders.length == vm.taskList.length;
                }
            }
            if (params == 'event') {
                if (utils.isEmptyVal(vm.eventList)) {
                    return false;
                }
                else {
                    return selectedReminders.length == vm.eventList.length;
                }
            }
            if (params == 'cloudelexLite') {
                if (utils.isEmptyVal(vm.docList)) {
                    return false;
                }
                else {
                    return selectedReminders.length == vm.docList.length;
                }
            }
            if (params == 'sidebar') {
                var sidebarComments = _.pluck(item, 'comments');
                var allComments = [];
                _.forEach(sidebarComments, function (item) {
                    _.forEach(item, function (current) {
                        allComments.push(current);
                    })
                })
                if (utils.isEmptyVal(allComments)) {
                    return false;
                }
                else {
                    return selectedReminders.length == allComments.length;
                }
            }

        }

        function selectItems(param, rec, isSelected) {
            // get the id and check of selection
            // if (param == 'task') {
            if (isSelected) {
                rec.isSelected = true;
                selectedReminders.push(rec);
            } else { // if not remove it from the list
                rec.isSelected = false;
                var uids = (param == 'sidebar') ? _.pluck(selectedReminders, 'cid') : (param == 'cloudelexLite') ? _.pluck(selectedReminders, 'id') : _.pluck(selectedReminders, 'notification_id');
                var index = (param == 'sidebar') ? uids.indexOf(rec.cid) : (param == 'cloudelexLite') ? uids.indexOf(rec.id) : uids.indexOf(rec.notification_id);

                if (index != -1) {
                    selectedReminders.splice(index, 1);
                }
                // }
            }
            vm.selectedRecords = selectedReminders;
        };

        //calls eventsDataservice.getReminder and returns vm.reminder arrayto setReminderList
        function getReminders() {
            if (utils.isNotEmptyVal(vm.reminderList)) {
                return;
            }
            eventsDataService.getReminder($rootScope.onIntake)
                .then(function (res) {
                    if (utils.isNotEmptyVal(res.data)) {
                        if (utils.isEmptyVal(res.data.event_reminder) && utils.isEmptyVal(res.data.task_reminder)) {
                            vm.noDataReminder = true;
                        } else {
                            vm.noDataReminder = false;
                        }
                        vm.reminder = res.data;
                        setReminderList(vm.reminder);
                    } else {
                        vm.reminderList = [];
                    }
                });
        }

        // isOpted takes the selected reminders from the reminders tab 
        function selectAllNotifications(isOpted) {
            if (isOpted) {
                selectedReminders = angular.copy(vm.reminderList);
                vm.isSelected = true;
            }
            else {
                selectedReminders = [];
            }
        };

        function selectAllDocNotifications(allSelected) {
            if (allSelected) {
                selectedDocuments = angular.copy(vm.docList);
                vm.isAllDocSelected = true;
            }
            else {
                selectedDocuments = [];
                vm.isAllDocSelected = true;
            }
        }

        //when all reminders are selected
        function allNotificationSelected() {
            if (utils.isEmptyVal(vm.reminderList)) {
                return false;
            }
            else {
                return selectedReminders.length == vm.reminderList.length
            }
        };

        function selecReminder(reminder, isSelected) {
            // get the id and check of selection
            if (isSelected) {
                reminder.isSelected = true;
                selectedReminders.push(reminder);
            } else { // if not remove it from the list
                reminder.isSelected = false;
                var uids = _.pluck(selectedReminders, 'reminderid');
                var index = uids.indexOf(reminder.reminderid);

                if (index != -1) {
                    selectedReminders.splice(index, 1);
                }
            }
        };

        function isNotifySelected(reminderid) {
            var uids = _.pluck(selectedReminders, 'reminderid')
            // check if current id exist in the selected events
            return (uids.indexOf(reminderid) > -1);
        };

        //dismisses the selected reminders from reminders
        function spliceSelectedReminders() {
            _.forEach(selectedReminders, function (reminder) {
                var index = _.findIndex(vm.reminderList, { reminderid: reminder.reminderid });
                if (index != -1) {
                    vm.reminderList.splice(index, 1);
                }
            });
            if (vm.reminderList.length == 0) {
                vm.noDataReminder = true;
            } else {
                vm.noDataReminder = false;
            }
            selectedReminders = [];
        };

        function dismissReminder(remindertype) {
            if (selectedReminders.length == 0) {
                notificationService.error("Please select a reminder to dismiss.");
                return;
            }
            var reminderids = {};
            var selectedTasks = _.filter(selectedReminders, function (reminder) {
                return reminder.type == 'task';
            });
            var selectedEvents = _.filter(selectedReminders, function (reminder) {
                return reminder.type == 'event';
            });
            reminderids.taskids = _.pluck(selectedTasks, 'reminderid');
            reminderids.eventids = _.pluck(selectedEvents, 'reminderid');

            eventsDataService.dismissReminder(reminderids, null, $rootScope.onIntake)
                .then(function (res) {
                    spliceSelectedReminders();
                    var remEvents = _.filter(vm.reminderList, function (rem) { return rem.type == "event"; });
                    var remTasks = _.filter(vm.reminderList, function (rem) { return rem.type == "task"; });
                    if ($rootScope.onIntake) {
                        $rootScope.$broadcast('updateReminderCountForIntake', { event_count: remEvents.length, task_count: remTasks.length });
                    } else {
                        $rootScope.$broadcast('updateReminderCount', { event_count: remEvents.length, task_count: remTasks.length });
                    }

                    notificationService.success("Dismissed successfully.");
                }, function (res) { notificationService.error("Unable to dismiss.") });
        }

        function activateTab(tabName, tabs) {
            tabs[tabName] = true;
            localStorage.setItem("notificationTab", tabName);
            angular.forEach(tabs, function (val, key) {
                tabs[key] = key === tabName;
            });
            getNotificationData();
        }

        function gotoTask(selectedTask) {
            if ($rootScope.onIntake) {
                if (utils.isNotEmptyVal(selectedTask.taskname)) {
                    selectedTask.task_id = selectedTask.taskid;
                    selectedTask['percentage_complete'] = parseInt(selectedTask.percentagecomplete);
                    selectedTask['intake_task_id'] = parseInt(selectedTask.task_id);
                    selectedTask['due_date'] = utils.getUTCTimeStamp(selectedTask.duedate);
                    IntakeTasksHelper.setSavedTask(selectedTask);
                    $state.go('intaketasks', { intakeId: selectedTask.matterid }, {
                        reload: true
                    });
                }
            } else {
                if (utils.isNotEmptyVal(selectedTask.taskname)) {
                    selectedTask.task_id = selectedTask.taskid;
                    tasksHelper.setSavedTask_notification(selectedTask);
                    $state.go('tasks', { matterId: selectedTask.matterid }, {
                        reload: true
                    });
                }
            }

        }

        function goToMatterOverview(overview) {
            if (utils.isNotEmptyVal(overview.matterId)) {
                // documentListHelper.setSelectedDocument(document);
                $state.go('add-overview', { matterId: overview.matterId });
            }
        }

        function gotoEvent(selectedEvent) {
            if ($rootScope.onIntake) {
                if (utils.isNotEmptyVal(selectedEvent.event_title)) {
                    selectedEvent.event_id = selectedEvent.eventid;
                    intakeEventsHelper.setSelectedEvent(selectedEvent);
                    $state.go('intakeevents', { intakeId: selectedEvent.matterid }, {
                        reload: true
                    });
                }
            } else {
                if (utils.isNotEmptyVal(selectedEvent.event_title)) {
                    selectedEvent.event_id = selectedEvent.eventid;
                    eventsHelper.setSelectedEvent(selectedEvent);
                    $state.go('events', { matterId: selectedEvent.matterid }, {
                        reload: true
                    });
                }
            }

        }

        function goToDocument(document) {
            if (utils.isNotEmptyVal(document.documentname)) {
                documentListHelper.setSelectedDocument(document);
                $state.go('matter-documents', { matterId: document.matterid });
            }
        }

        function goToEntityTypeName(data) {
            if (data.entityTypeName == 'Document') {
                if (utils.isNotEmptyVal(data.entityTypeName)) {
                    documentListHelper.setSelectedDocument(data);
                    $state.go('matter-documents', { matterId: data.matterId, liteNotificationFilter: true });
                }
            }
            if (data.entityTypeName == 'Event') {
                if ($rootScope.onIntake) {
                    if (utils.isNotEmptyVal(data.entityTypeName)) {
                        data.id = data.entityId;
                        data.entitykey = data.entityId;
                        intakeEventsHelper.setSelectedEvent(data);
                        $state.go('intakeevents', { intakeId: data.matterId });
                    }
                } else {
                    if (utils.isNotEmptyVal(data.entityTypeName)) {
                        data.id = data.entityId;
                        data.entitykey = data.entityId;
                        eventsHelper.setSelectedEvent(data);
                        $state.go('events', { matterId: data.matterId });
                    }
                }
            }
            if (data.entityTypeName == 'Note') {
                if (utils.isNotEmptyVal(data.entityTypeName)) {
                    data.id = data.entityId;
                    $state.go('notes', { matterId: data.matterId, liteNotificationFilter: true });
                }
            }
        }

        function gotoReminderEvent(selectedEvent) {
            if (selectedEvent.type == "task") {
                if ($rootScope.onIntake) {
                    if (utils.isNotEmptyVal(selectedEvent.reminderName)) {
                        // selectedEvent['percentage_complete'] = parseInt(selectedEvent.percentagecomplete);
                        selectedEvent['intake_task_id'] = parseInt(selectedEvent.task_id);
                        // selectedEvent['due_date'] = utils.getUTCTimeStamp(selectedEvent.duedate);
                        IntakeTasksHelper.setSavedTask(selectedEvent);
                        $state.go('intaketasks', { intakeId: selectedEvent.matterid }, {
                            reload: true
                        });
                    }
                } else {
                    if (utils.isNotEmptyVal(selectedEvent.reminderName)) {
                        tasksHelper.setSavedTask_notification(selectedEvent);
                        $state.go('tasks', { matterId: selectedEvent.matterid }, {
                            reload: true
                        });
                    }
                }

            } else if (selectedEvent.type == "event") {
                if ($rootScope.onIntake) {
                    if (utils.isNotEmptyVal(selectedEvent.matterName)) {
                        selectedEvent.id = selectedEvent.eventid;
                        intakeEventsHelper.setSelectedEvent(selectedEvent);
                        $state.go('intakeevents', { intakeId: selectedEvent.matterid }, {
                            reload: true
                        });
                    }
                } else {
                    if (utils.isNotEmptyVal(selectedEvent.matterName)) {
                        selectedEvent.id = selectedEvent.eventid;
                        eventsHelper.setSelectedEvent(selectedEvent);
                        $state.go('events', { matterId: selectedEvent.matterid }, {
                            reload: true
                        });
                    }
                }
            }

        }
        function goToReminderMatter(reminderMatter) {
            if ($rootScope.onIntake) {
                if (utils.isNotEmptyVal(reminderMatter.matterName)) {
                    matterListHelper.setSelectedMatter(reminderMatter);
                    $state.go('intake-overview', { intakeId: reminderMatter.matterid });
                }
            } else {
                if (utils.isNotEmptyVal(reminderMatter.matterName)) {
                    matterListHelper.setSelectedMatter(reminderMatter);
                    $state.go('add-overview', { matterId: reminderMatter.matterid });
                }
            }

        }
        function goToSidebarMatter(reminderMatter) {
            sessionStorage.removeItem('fromNotificationtab');
            if ($rootScope.onIntake) {
                if (utils.isNotEmptyVal(reminderMatter.created_name)) {
                    matterListHelper.setSelectedMatter(reminderMatter);
                    $state.go('intake-overview', { intakeId: reminderMatter.matter_id }, { reload: true });
                }
            } else {
                if (utils.isNotEmptyVal(reminderMatter.created_name)) {
                    matterListHelper.setSelectedMatter(reminderMatter);
                    $state.go('add-overview', { matterId: reminderMatter.matter_id }, { reload: true });
                }
            }
        }

        function goToEventMatter(eventMatter) {
            if ($rootScope.onIntake) {
                if (utils.isNotEmptyVal(eventMatter.mattername)) {
                    matterListHelper.setSelectedMatter(eventMatter);
                    $state.go('intake-overview', { intakeId: eventMatter.matterid }, { reload: true });
                }
            } else {
                if (utils.isNotEmptyVal(eventMatter.mattername)) {
                    matterListHelper.setSelectedMatter(eventMatter);
                    $state.go('add-overview', { matterId: eventMatter.matterid }, { reload: true });
                }
            }

        }
        //Message Pop up
        function gotoMessage(matter, message_id) {
            var modalInstance = $modal.open({
                templateUrl: 'app//message/partials/messageNotify.html',
                controller: 'MessageNotifyCtrl as messageNotify',
                windowClass: 'modalXLargeDialog',
                backdrop: 'static',
                keyboard: false,

                resolve: {
                    messaged: function () {
                        return matter;
                    },
                    selectedMessageId: function () {
                        return message_id;
                    }
                }
            });
        }

        //Document upload Notification
        function getcloudelexLiteNotification() {
            var defer = $q.defer();
            notificationDatalayer.getcloudlexLiteNotify($rootScope.onIntake)
                .then(function (res) {
                    if (utils.isNotEmptyVal(res.data)) {
                        vm.docList = res.data.notificationData;
                        if (vm.docList == null) {
                            vm.docList = [];
                        }
                        if (utils.isNotEmptyVal(vm.counts)) {
                            vm.counts.lite_count = res.data.count;
                        }

                        vm.noDocumentData = false;
                    } else {
                        vm.docList = [];
                        vm.noDocumentData = true;
                    }
                    defer.resolve();
                });
            return defer.promise;
        }

        //Message notification
        function getMessageNotification() {
            notificationDatalayer.getMessageList()
                .then(function (res) {
                    if (utils.isNotEmptyVal(res.data)) {
                        vm.messageList = res.data.data;
                    } else { vm.messageList = []; }
                })

        }

        //Document Edit Pop up
        function editDocument(documentid) {
            var matterDoc = _.filter(vm.docList, function (docKey) {
                return docKey.documentid == documentid;
            });
            var modalInstance = $modal.open({
                templateUrl: 'app//documents/dashboardEditDoc.html',
                controller: 'dashboardEditDocCtrl as docCtrl',
                windowClass: 'modalXLargeDialog',
                size: 'md',
                resolve: {
                    docList: function () {
                        return matterDoc;
                    }
                }
            });
        }

    }


})(angular);
