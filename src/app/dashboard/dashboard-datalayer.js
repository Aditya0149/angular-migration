(function () {

    angular
        .module('cloudlex.dashboard')
        .factory('dashboardDatalayer', dashboardDatalayer);


    dashboardDatalayer.$inject = ['$http', 'globalConstants', '$modal', '$q'];
    function dashboardDatalayer($http, globalConstants, $modal, $q) {

        var javaBaseUrl = globalConstants.javaWebServiceBaseV4;

        var matterTrendUrl = globalConstants.webServiceBase + 'dashboarddata/dashboard?which=m_trend&trnd=';
        var dashboardDataUrl = globalConstants.webServiceBase + 'dashboarddata/dashboard';
        var getMattersForVenueUrl = globalConstants.webServiceBase + 'dashboarddata/dashboard.json?which=m_venue&vid=';
        if (!globalConstants.useApim) {
            var getWeekTasksUrl = javaBaseUrl + 'task?pageNum=1&pageSize=100&status=&complete=&priority=&mytask=&mid=&frmdsh=1&';
        } else {
            var getWeekTasksUrl = globalConstants.matterBase + 'task/v1/?pageNum=1&pageSize=100&status=&complete=&priority=&mytask=&mid=&frmdsh=1&';
        }
        var getTasksComparisonUrl = globalConstants.webServiceBase + 'dashboarddata/dashboard.json?which=tasks';
        var getCriticalDatesUrl = globalConstants.webServiceBase + 'dashboarddata/dashboard.json?which=critical_dates&';
        var getMattersAverageAgeUrl = globalConstants.webServiceBase + 'dashboarddata/dashboard.json?which=m_age&frmdsh=1';
        var feedbackUrl = javaBaseUrl + 'feedback';
        var saveFeedback = javaBaseUrl + 'feedback';

        return {
            getDashboardData: _getDashboardData,
            getMatterTrend: _getMatterTrend,
            getMattersByVenue: _getMattersByVenue,
            getTasksForWeek: _getTasksForWeek,
            getTasksComparisonData: _getTasksComparisonData,
            getCriticalDates: _getCriticalDates,
            getMatterAverageAge: _getMatterAverageAge,
            openSubscriptionEndPopup: _openSubscriptionEndPopup,
            getFeedback: _getFeedback,
            saveFeedback: _saveFeedback

        }

        function _saveFeedback(data) {
            var deferred = $q.defer();
            $http.post(saveFeedback, data)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function _getFeedback() {
            return $http.get(feedbackUrl);
        }

        function _getDashboardData() {
            return $http.get(dashboardDataUrl);
        }

        function _getMatterTrend(trendId) {
            var url = matterTrendUrl + trendId;
            return $http.get(url);
        }

        function _getMattersByVenue(venueId) {
            var url = getMattersForVenueUrl + venueId;
            return $http.get(url);
        }

        function _getTasksForWeek(filter) {
            var url = getWeekTasksUrl + utils.getParams(filter);
            return $http.get(url);
        }

        function _getTasksComparisonData(today) {
            var url = getTasksComparisonUrl;
            return $http.get(url);
        }

        function _getCriticalDates(eventId) {
            var url = getCriticalDatesUrl
            url += (angular.isDefined(eventId) ? 'e_type=' + eventId : '');

            var mondayTimestamp = utils.firstDayOfWeek(moment().get('year'), moment().isoWeek());
            url += '&s=' + moment(mondayTimestamp.valueOf()).unix();
            url += '&tz=' + utils.getTimezone();
            return $http.get(url);
        }

        function _getMatterAverageAge(s, e) {
            var url = getMattersAverageAgeUrl;
            url += '&s=' + (s || '') + '&e=' + (e || '');
            return $http.get(url);
        }

        // function to open the Subscroption End Popup
        function _openSubscriptionEndPopup(Prevstate, showWhatsnew, gracePeriodEndDate) {
            return $modal.open({
                templateUrl: 'app/dashboard/subscription-end-popup.html',
                controller: ['$scope', '$modalInstance', 'resolveObj', 'eventsDataService', 'dashboardDatalayer', '$rootScope',
                    function ($scope, $modalInstance, resolveObj, eventsDataService, dashboardDatalayer, $rootScope) {
                        var vm = $scope;
                        (function () {
                            vm.isWhatsNew = resolveObj.isWhatsNew;
                            vm.gracePeriodEndDate = resolveObj.gracePeriodEndDate;
                            vm.isAcknowleged = 0;
                        })();
                        vm.Acknowledge = function () {
                            localStorage.setItem("isAcknowledged", JSON.stringify(false));

                            var shownFeedback = localStorage.getItem("feedbackShown");
                            // shownFeedback = "true";
                            if (shownFeedback == "true") {
                                showPopups();
                            }
                            $modalInstance.close();
                        }

                        function showPopups() {
                            /*show whats new pop up*/
                            if (vm.isWhatsNew == 0) {
                                showWhatsNew();
                            }
                            else { //reminder pop will be shown

                                eventsDataService
                                    .getReminder()
                                    .then(function (res) {
                                        var reminders = res.data;
                                        if (reminders.event_reminder.length > 0 || reminders.task_reminder.length > 0) {
                                            var remindersShown = localStorage.getItem("remindersShown");
                                            if (remindersShown != 1) {
                                                localStorage.setItem("remindersShown", "1");
                                                OpenReminderPopup(reminders);
                                            }
                                        }
                                    });


                            }
                        }

                        //This function will open the Net Promoter Score pop up
                        function showNetPromoterScore() {
                            vm.Prevstate = {};
                            vm.Prevstate.prevState = resolveObj.Prevstate.prevState;


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

                        //This function will open the Whats new pop up
                        function showWhatsNew() {
                            vm.Prevstate = {};
                            vm.Prevstate.prevState = resolveObj.Prevstate.prevState;
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

                        //This function will open the ReminderPopup
                        function OpenReminderPopup(reminders) {
                            if ($rootScope.onMatter) {
                                return $modal.open({
                                    templateUrl: 'app/dashboard/reminder-popup.html',
                                    controller: 'ReminderPopupCtrl as rp',
                                    windowClass: 'modalLargeDialog',
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

                        }

                    }],
                size: 'lg',
                windowClass: 'modalMidiumDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    resolveObj: function () {
                        return {
                            Prevstate: Prevstate,
                            isWhatsNew: showWhatsnew,
                            gracePeriodEndDate: gracePeriodEndDate
                        };
                    },
                }
            });
        }
    }

})();

