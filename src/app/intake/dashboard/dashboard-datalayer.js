(function () {

    angular
        .module('intake.dashboard')
        .factory('intakeDashboardDatalayer', intakeDashboardDatalayer);


    intakeDashboardDatalayer.$inject = ['$http', '$q', 'globalConstants', '$modal'];
    function intakeDashboardDatalayer($http, $q, globalConstants, $modal) {
        var matterTrendUrl = globalConstants.intakeServiceBase + 'get-intake-overview?duration=';
        var dashboardDataUrl = globalConstants.webServiceBase + 'dashboarddata/dashboard';
        var getMattersForVenueUrl = globalConstants.webServiceBase + 'dashboarddata/dashboard.json?which=m_venue&vid=';
        var getWeekTasksUrl = globalConstants.webServiceBase + 'intake_task/intake_task?pageNum=1&pageSize=100&status=&complete=&priority=&mytask=&mid=&frmdsh=1&';
        var getTasksComparisonUrl = globalConstants.intakeServiceBase + 'get-task-details?duration=12';
        var getCriticalDatesUrl = globalConstants.intakeServiceBase + 'get-critical-dates?';
        var getMattersAverageAgeUrl = globalConstants.webServiceBase + 'dashboarddata/dashboard.json?which=m_age&frmdsh=1';

        return {
            getDashboardData: _getDashboardData,
            getMatterTrend: _getMatterTrend,
            getMattersByVenue: _getMattersByVenue,
            getTasksForWeek: _getTasksForWeek,
            getTasksComparisonData: _getTasksComparisonData,
            getCriticalDates: _getCriticalDates,
            getMatterAverageAge: _getMatterAverageAge,
            openSubscriptionEndPopup: _openSubscriptionEndPopup

        }

        function getCall(url) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "GET",
                headers: token,
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        function _getDashboardData() {
            return $http.get(dashboardDataUrl);
        }

        function _getMatterTrend(duration) {
            var url = matterTrendUrl + duration;
            return getCall(url);
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
            return getCall(url);
        }

        function _getCriticalDates(eventId) {
            var url = getCriticalDatesUrl
            url += (angular.isDefined(eventId) ? 'e_type=' + eventId : '');

            var mondayTimestamp = utils.firstDayOfWeek(moment().get('year'), moment().isoWeek());
            url += '&ts=' + moment(mondayTimestamp.valueOf()).unix();
            url += '&tz=' + utils.getTimezone();
            return getCall(url);
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
                controller: ['$scope', '$modalInstance', 'resolveObj', 'intakeEventsDataService', 'routeManager',
                    function ($scope, $modalInstance, resolveObj, intakeEventsDataService, routeManager) {
                        var vm = $scope;
                        (function () {
                            vm.isWhatsNew = resolveObj.isWhatsNew;
                            vm.gracePeriodEndDate = resolveObj.gracePeriodEndDate;
                            vm.isAcknowleged = 0;
                        })();
                        vm.Acknowledge = function () {
                            localStorage.setItem("isAcknowledged", JSON.stringify(false));

                            /*show whats new pop up*/
                            if (vm.isWhatsNew == 0) {
                                showWhatsNew();
                            }
                            else { //reminder pop will be shown

                                intakeEventsDataService
                                    .getReminder()
                                    .then(function (res) {
                                        var reminders = res.data;
                                        if (reminders.event_reminder.length > 0 || reminders.task_reminder.length > 0) {
                                            OpenReminderPopup(reminders);
                                        }
                                    });


                            }
                            $modalInstance.close();
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

