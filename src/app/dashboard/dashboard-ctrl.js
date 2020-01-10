(function (angular) {
    'use strict';

    angular
        .module('cloudlex.dashboard')
        .controller('DashboardCtrl', DashboardController)

    DashboardController.$inject = ["$state", "$rootScope", "$modal", "routeManager", "eventsDataService", "masterData", "dashboardDatalayer", "matterFactory"]
    function DashboardController($state, $rootScope, $modal, routeManager, eventsDataService, masterData, dashboardDatalayer, matterFactory) {
        var vm = this;
        vm.isActive = isActive;
        vm.openWhatsNewPopup = openWhatsNewPopup;
        vm.openNetPromoterScore = openNetPromoterScore;
        vm.Prevstate = {};


        (function () {
            window.parent.document.title = "Welcome to CloudLex";
            $rootScope.$emit('favicon', "favicon.ico");

            var userDetails = masterData.getUserRole();
            /*get gracePeriodEndDate*/
            vm.Prevstate.prevState = routeManager.getPreviousState();
            var gracePeriodEndDate = userDetails.grace_period_end_date;
            var planSubEndDate = userDetails.plan_subscription_end_date;
            vm.planSubEndDate = moment.unix(planSubEndDate).format('MM/DD/YYYY hh:mm A');
            vm.gracePeriodEndDate = matterFactory.getFormatteddate(gracePeriodEndDate);

            //set flag to show subscription end message..
            vm.isSubscriptionEnd = getsubscriptionEndFlag();

            function getsubscriptionEndFlag() {
                if (userDetails.plan_subscription_status == 0) {
                    return true;
                }
                else {
                    var currentdate = new Date();
                    var currentdate = moment(currentdate);
                    var planSubEndDate = moment(vm.planSubEndDate)
                    return (planSubEndDate.isBefore(currentdate));
                }
            }

            //set flag whether subscription end acknowledged or not
            var isAcknowledged = JSON.parse(localStorage.getItem("isAcknowledged"));
            vm.isAcknowledged = utils.isEmptyVal(isAcknowledged) ? true : isAcknowledged;

            /* pop up rendering sequence  
            
               SUBSCRIPTION EXPIRED ->  what's new pop -> reminder
               
               1. SUBSCRIPTION EXPIRED :  If user log in after subscription ends.
               2. what's new pop : To show new updates at the time of production site deployment.
               3. Reminder : To show task/event reminders if set any.
            */

            //get the userid and showWhatsnew flag 
            var showWhatsnew = localStorage.getItem("remindemeAgain"); // US#8345 whatnew Remind me Buttons added 
            if (utils.isNotEmptyVal(showWhatsnew) && showWhatsnew == 1) {
                vm.showWhatsnew = 1;
            } else {
                vm.showWhatsnew = userDetails.user_notification_status;
            }

            // what's new pop will render before reminder
            if (vm.isSubscriptionEnd == true && vm.isAcknowledged == true) {
                dashboardDatalayer.openSubscriptionEndPopup(vm.Prevstate, vm.showWhatsnew,
                    vm.gracePeriodEndDate);
            }
            else {
                // var shownFeedback = localStorage.getItem("feedbackShown");
                // shownFeedback = "true";
                // if (shownFeedback == "true") {
                    showPopups();
                // }
            }
        })();

        function showRemindersGrid() {
            // by default prevState is matter-list
            var prevState = routeManager.getPreviousState();
            var remindersShown = localStorage.getItem("remindersShown");
            if (remindersShown != 1) {
                localStorage.setItem("remindersShown", "1");
                eventsDataService
                    .getReminder()
                    .then(function (res) {
                        //
                        //
                        var reminders = res.data;
                        if ((reminders.event_reminder.length > 0 || reminders.task_reminder.length > 0) && utils.isNotEmptyVal(reminders)) {
                            if ($rootScope.onMatter) {
                                $modal.open({
                                    templateUrl: 'app/dashboard/reminder-popup.html',
                                    controller: 'ReminderPopupCtrl as rp',
                                    size: 'lg',
                                    windowClass: 'modalMediumLargeDialog',
                                    backdrop: 'static',
                                    keyboard: false,
                                    resolve: {
                                        'reminders': function () {
                                            return reminders;
                                        },
                                    }
                                });
                            } else {
                                return false;
                            }

                            //$('body').css("overflow-y", "auto");
                        }
                    });
            }
        }

        function showPopups() {
            var showWhatsNewPopUp = localStorage.getItem('showWhatsNew');
            if (showWhatsNewPopUp != '1') {
                if (vm.showWhatsnew == 0) {
                    var updateWhatsFlag = localStorage.getItem("updatedWhatsPopupStat");

                    if (utils.isEmptyVal(updateWhatsFlag)) {
                        vm.openWhatsNewPopup();
                    }
                } else {
                    showRemindersGrid()
                }
            }
            else {
                showRemindersGrid()
            }
        }


        function isActive(state) {
            var currentState = $state.current.name;
            return currentState === 'dashboard.' + state;
        }
        //This function will open the WhatsNewPopup
        function openWhatsNewPopup() {
            return $modal.open({
                templateUrl: 'app/dashboard/whatsnew.html',
                controller: 'WhatsNewPopupCtrl as wp',
                size: 'lg',
                windowClass: 'whats-new-popup',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    Prevstate: function () {
                        return vm.Prevstate;
                    },
                }
            });
        }

        function openNetPromoterScore() {


            var modalInstance = $modal.open({
                templateUrl: 'app/dashboard/feedback.html',
                controller: 'NetPromoterScorePopupCtrl as nps',
                size: 'lg',
                windowClass: 'whats-new-popup',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    Prevstate: function () {
                        return vm.Prevstate;
                    },
                }
            });

            modalInstance.result.then(function (response) {
                showPopups();

            }, function () {
                showPopups();

            });

        }

    }

    angular
        .module('cloudlex.dashboard')
        .controller('ReminderPopupCtrl', ReminderPopupCtrl)

    ReminderPopupCtrl.$inject = ["$modalInstance", "eventsDataService", "notification-service", "reminders", 'matterListHelper', 'tasksHelper', 'eventsHelper', '$state', '$rootScope'];
    function ReminderPopupCtrl($modalInstance, eventsDataService, notificationService, reminders, matterListHelper, tasksHelper, eventsHelper, $state, $rootScope) {
        var vm = this;
        var selectedReminders = [];
        vm.reminders = [];

        vm.selecReminder = selecReminder;
        vm.dismissReminder = dismissReminder;
        vm.snooze = snooze;
        vm.closePopUp = closePopup;
        vm.selectAllNotifications = selectAllNotifications;
        vm.gotoReminderEvent = gotoReminderEvent;
        vm.goToReminderMatter = goToReminderMatter;
        vm.allNotificationSelected = allNotificationSelected;
        vm.isNotifySelected = isNotifySelected;

        angular.element(document).ready(function () {
            customStyleReminder()//set reminder header alignment
        });

        $(document).ready(function () {
            customStyleReminder()//set reminder header alignment
        });
        (function () {
            // make a copy of reminder resolve to remove its reference
            var allReminders = angular.copy(reminders);
            //set reminder list to display on grid
            setReminderList(allReminders);
        })();

        function gotoReminderEvent(selectedEvent) {
            if (selectedEvent.type == "task") {
                if (utils.isNotEmptyVal(selectedEvent.reminderName)) {
                    tasksHelper.setSavedTask_notification(selectedEvent);
                    $state.go('tasks', { matterId: selectedEvent.matterid }, {
                        reload: true
                    });
                }
            } else if (selectedEvent.type == "event") {
                if (utils.isNotEmptyVal(selectedEvent.matterName)) {
                    selectedEvent.id = selectedEvent.eventid;
                    eventsHelper.setSelectedEvent(selectedEvent);
                    $state.go('events', { matterId: selectedEvent.matterid });
                }
            }

        }
        function goToReminderMatter(reminderMatter) {
            if (utils.isNotEmptyVal(reminderMatter.matterName)) {
                matterListHelper.setSelectedMatter(reminderMatter);
                $state.go('add-overview', { matterId: reminderMatter.matterid });
            }
        }
        // from resolve reminder array we are creating a reminder list
        // to display on grid
        function setReminderList(allReminders) {

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
                vm.reminders.push(reminderObj);
            });

            // add task reminders to reminder list 
            _.forEach(allReminders.task_reminder, function (task) {
                var reminderObj = {
                    task_id: task.taskid,
                    reminderid: task.taskid,
                    matterName: task.matterName,
                    reminderName: 'Task: ' + task.taskname,
                    reminderTime: moment.unix(task.duedate).utc().format("MM/DD/YYYY"),
                    matterid: task.matter_id,
                    type: 'task'
                };
                vm.reminders.push(reminderObj);
            });
        }
        //when user checks allselect check box then all reminders will be selected  
        function selectAllNotifications(isOpted) {

            if (isOpted) {
                selectedReminders = angular.copy(vm.reminders);
                vm.isSelected = true;
            }
            else {
                selectedReminders = [];
            }

        }

        // when user checks allselect check box then all checkboxes gets checked
        function allNotificationSelected() {
            if (utils.isEmptyVal(vm.reminders)) {
                return false;
            }
            else {
                return selectedReminders.length == vm.reminders.length
            }

        }

        // when a check box is clicked then current reminder id checked whether
        // it exist or not
        function isNotifySelected(reminderid) {
            var uids = _.pluck(selectedReminders, 'reminderid')
            // check if current id exist in the selected events
            return (uids.indexOf(reminderid) > -1);
        }

        // when user checks  then selected reminder is added to selected reminders
        // when user unchecks  then selected reminder is removed from selected reminders
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
        }

        /** Reminder popup custom style apply */
        function customStyleReminder() {
            vm.reminderHeaders = (vm.reminders.length >= 3) ? 'paddding-right-11' : '';
        }

        // when user clicks on snooze then selected reminders will be snoozed
        // selected reminders are removed from the reminder list
        function snooze(remindertype) {
            if (selectedReminders.length == 0) {
                notificationService.error("Please select a reminder to snooze.");
                return;
            }

            customStyleReminder(); // check reminder popup alignment

            spliceSelectedReminders();
            notificationService.success("Snoozed successfully.");
        }

        // selected reminders to snooze are removed from the reminder list
        function spliceSelectedReminders() {

            _.forEach(selectedReminders, function (reminder) {
                var index = _.findIndex(vm.reminders, { reminderid: reminder.reminderid });
                if (index != -1) {
                    vm.reminders.splice(index, 1);

                }
            });
            selectedReminders = [];

            // after snooze/dismiss if reminder list is empty then close pop up
            if (vm.reminders.length <= 0) {
                $modalInstance.close();
            }
        }

        // when user clicks on dismiss then selected reminders will be dissmissed
        // selected reminders are removed from the reminder list

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

            eventsDataService.dismissReminder(reminderids)
                .then(function (res) {
                    spliceSelectedReminders();
                    notificationService.success("Dismissed successfully.");
                    var remEvents = _.filter(vm.reminders, function (rem) { return rem.type == "event"; });
                    var remTasks = _.filter(vm.reminders, function (rem) { return rem.type == "task"; });
                    if ($rootScope.onIntake) {
                        $rootScope.$broadcast('updateReminderCountForIntake', { event_count: remEvents.length, task_count: remTasks.length });
                    } else {
                        $rootScope.$broadcast('updateReminderCount', { event_count: remEvents.length, task_count: remTasks.length });
                    }
                }, function (res) { notificationService.error("Unable to dismiss.") });
        }


        // close pop up
        function closePopup() {
            $modalInstance.dismiss();
        }
    }



    // what's new pop-up controller
    angular
        .module('cloudlex.dashboard')
        .controller('WhatsNewPopupCtrl', WhatsNewPopupCtrl)

    WhatsNewPopupCtrl.$inject = ["$modalInstance", "$modal", "eventsDataService", "$q", "$http", "masterData", "globalConstants", "$rootScope"];
    function WhatsNewPopupCtrl($modalInstance, $modal, eventsDataService, $q, $http, masterData, globalConstants, $rootScope) {

        var vm = this;
        vm.close = closePopup;
        vm.OpenReminderPopup = OpenReminderPopup;
        vm.setWhatsNewFlag = setWhatsNewFlag;
        vm.userId = {};
        vm.remindemeAgain = 0;
        (function () {

            //get the userid and showWhatsnew flag 
            var userDetails = masterData.getUserRole();
            vm.userId = userDetails.uid;

        })();

        function remindMeWhatsNew() {
            vm.remindemeAgain = 1;
            localStorage.setItem("remindemeAgain", "1");
            localStorage.setItem('showWhatsNew', '1');
        }


        function closePopup(remindMeflag) {
            var whatsNew = localStorage.getItem('showWhatsNew');
            if (whatsNew != '1') {
                remindMeflag ? angular.noop() : localStorage.setItem('showWhatsNew', '1');
                remindMeflag ? remindMeWhatsNew() : vm.setWhatsNewFlag(vm.userId);
                eventsDataService
                    .getReminder()
                    .then(function (res) {
                        var reminders = res.data;
                        if ((reminders.event_reminder.length > 0 || reminders.task_reminder.length > 0) && utils.isNotEmptyVal(reminders)) {
                            var remindersShown = localStorage.getItem("remindersShown");
                            if (remindersShown != 1) {
                                vm.OpenReminderPopup(reminders);
                            }
                        }
                    });
            }
            $modalInstance.dismiss();
        }

        //This function will open the ReminderPopup
        function OpenReminderPopup(reminders) {
            //
            //
            if ($rootScope.onMatter) {
                localStorage.setItem("remindersShown", "1");
                return $modal.open({
                    templateUrl: 'app/dashboard/reminder-popup.html',
                    controller: 'ReminderPopupCtrl as rp',
                    windowClass: 'modalMediumLargeDialog',
                    backdrop: 'static',
                    resolve: {
                        'reminders': function () {
                            return reminders;
                        },
                    }
                });
            } else {
                return false;
            }

            //
        }

        //set the WhatsNewFlag to false so that  WhatsNew pop up can not be 
        //rendered for further logins 
        function setWhatsNewFlag(uid) {
            localStorage.setItem("updatedWhatsPopupStat", "1");
            var deferred = $q.defer();
            var url = globalConstants.webServiceBase + 'practice/user_notification';
            var data = { user_id: uid };
            $http.post(url, data)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

    }

    // Net Promoter Score  pop-up controller
    angular
        .module('cloudlex.dashboard')
        .controller('NetPromoterScorePopupCtrl', NetPromoterScorePopupCtrl)

    NetPromoterScorePopupCtrl.$inject = ["$modalInstance", "notification-service", "dashboardDatalayer"];
    function NetPromoterScorePopupCtrl($modalInstance, notificationService, dashboardDatalayer) {

        var vm = this;
        (function () {
            vm.feedbackRating = -1;

        })();

        vm.close = function () {
            localStorage.setItem("feedbackShown", "true");
            $modalInstance.close();
        }

        vm.setValue = function (val) {
            vm.feedbackRating = val;
            $("span[id^='feed']").removeClass("select");
            $("#feed" + val).addClass("select");

        }

        vm.submitRating = function (isIgnored) {
            localStorage.setItem("feedbackShown", "true");
            if (isIgnored) {
                vm.feedbackRating = -1;
                vm.comment = "";
                setNetPromoterScoreFlag();
                $modalInstance.close();
            } else {
                if (vm.feedbackRating >= 0) {
                    notificationService.success("Thank you! We greatly appreciate your feedback.");
                    setNetPromoterScoreFlag();
                    $modalInstance.close();
                }
            }
        }

        function setNetPromoterScoreFlag(uid) {
            var data =
            {
                "feedback_point": vm.feedbackRating,
                "remarks": vm.comment
            };

            dashboardDatalayer.saveFeedback(data);
        }

    }

})(angular);

