(function (angular) {

    angular.module('cloudlex.allnotifications')
        .controller('AllNotificationsCtrl', AllNotificationsCtrl)

    AllNotificationsCtrl.$inject = ['$rootScope', '$state' ,'notificationDatalayer', 'notification-service', 'masterData', 'notificationUtils', 'routeManager', 'modalService'];
    function AllNotificationsCtrl($rootScope, $state, notificationDatalayer, notificationService, masterData, notificationUtils, routeManager, modalService) {
        var vm = this;
        vm.filter = {
            time: 1
        };
        vm.filterRetain = filterRetain;
        vm.setFilterDate = setFilterDate;
        vm.openCalender = openCalender;
        vm.resetFilters = resetFilters;
        vm.isDatesValid = isDatesValid;
        vm.selectAllNotification = selectAllNotification;
        vm.allNotificationSelected = allNotificationSelected;
        vm.dismissAllNotification = dismissAllNotification;
        vm.settingsNotification = settingsNotification;
        vm.getMoreNotifications = getMoreNotifications;
        vm.apply = apply;

        function init() {
            var role = masterData.getUserRole();
            if (utils.isNotEmptyVal(role)) {
                vm.role = role;
            }
            vm.selectedItems = [];
            vm.serachInput = '';
            vm.pageNumber = 1;
            vm.pageSize = 250;
            apply(vm.filter);
            setBreadcrum();
            setTimeout(function(){
                $rootScope.$emit('clearAllNotificationsFromBellIcon');
            },6000);
        }

        init();
        function setBreadcrum() {
            var initCrum = [{ name: '...' }, { name: 'Notifications' }];
            routeManager.setBreadcrum(initCrum);
        }
        vm.goTo = notificationUtils.goTo;

        vm.closeAll = function () {
            _.forEach(vm.notificationList, function (it) {
                it.notiDots = false;
            });
        }

        $(".moreMenu").clickOff(function (parent, event) {
            $rootScope.$apply(function () {
                vm.closeAll();
            });
        });

        vm.isNotificationSelected = function (id) {
            if (vm.selectedItems) {
                return vm.selectedItems.indexOf(id) > -1;
            } else {
                return false;
            }
        }

        vm.toggleMenu = function (rec) {
            _.forEach(vm.notificationList, function (it) {
                if (it.notification_id != rec.notification_id) {
                    it.notiDots = false;
                }
            });
            rec.notiDots = !rec.notiDots;
        }

        vm.dismissNotification = function (rec) {
            rec.notiDots = false;
            notificationDatalayer.markDismiss(rec.notification_id).then(function () {
                notificationService.success("Dismissed successfully.");
                vm.notificationList = _.filter(vm.notificationList, function (v) {
                    return rec.notification_id != v.notification_id;
                });
                vm.selectedItems = [];
                $rootScope.$broadcast("dismissNotiFromHeader", [rec.notification_id]);
            }, function (res) { notificationService.error("Unable to dismiss.") });
        }

        vm.markReadNotification = function (rec) {
            rec.notiDots = false;
            notificationDatalayer.markRead(rec.notification_id).then(function () {
                notificationService.success("Marked as read successfully.");
                _.forEach(vm.notificationList, function (item) {
                    if (item.notification_id == rec.notification_id) {
                        item.is_seen = 1;
                    }
                });
                vm.selectedItems = [];
                rec.is_seen = 1;
                $rootScope.$broadcast("readNotiFromHeader", rec);
            }, function (res) { notificationService.error("Unable to mark as read.") });
        }

        function dismissAllNotification() {

            var actionButton = 'Dismiss';
            var msg = 'Are you sure you want to dismiss ?';

            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: actionButton,
                headerText: 'Confirmation!',
                bodyText: msg
            };
            if (vm.selectedItems && vm.selectedItems.length > 0) {


                modalService.showModal({}, modalOptions).then(function () {
                    notificationDatalayer.markDismiss(vm.selectedItems).then(function () {
                        notificationService.success("Dismissed successfully.");
                        vm.notificationList = _.filter(vm.notificationList, function (v) {
                            return !_.contains(vm.selectedItems, v.notification_id);
                        });
                        $rootScope.$broadcast("dismissNotiFromHeader", vm.selectedItems);
                        vm.selectedItems = [];
                    }, function (res) { notificationService.error("Unable to dismiss.") });
                });
            } else {
                notificationService.error("Please select a notification to dismiss.");
            }
        }

        function settingsNotification () {
           $state.go('settings.notifications');
        };

        function selectAllNotification(isSelected) {
            if (isSelected === true) {
                vm.selectedItems = _.pluck(vm.notificationList, "notification_id");
            } else {
                vm.selectedItems = [];
            }

        }

        function allNotificationSelected() {
            if (vm.notificationList && vm.notificationList.length != 0 && vm.selectedItems)
                return vm.selectedItems.length == vm.notificationList.length;
            else
                return false;
        };

        function isDatesValid() {
            if ($('#solnolstartDateErr').css("display") == "block" ||
                $('#solnolendDateErr').css("display") == "block") {
                return true;
            }
            else {
                return false;
            }
        }

        function openCalender($event) {
            $event.preventDefault();
            $event.stopPropagation();
        };

        function setFilterDate() {
            var start = moment.utc().unix();
            switch (vm.filter.time) {
                case 1: //all
                    vm.filter.s = 0;
                    vm.filter.e = 0;
                    break;
                case 2: //24hours
                    vm.filter.s = moment.unix(start).utc().format('MM/DD/YYYY');
                    var end = moment.utc().subtract(24, 'hours').unix();
                    vm.filter.e = moment.unix(end).utc().format('MM/DD/YYYY');
                    break;
                case 3: //7days
                    vm.filter.s = moment.unix(start).utc().format('MM/DD/YYYY');
                    var end = moment.utc().subtract(7, 'days').startOf('day').unix();
                    vm.filter.e = moment.unix(end).utc().format('MM/DD/YYYY');
                    break;
                case 4: //1month
                    vm.filter.s = moment.unix(start).utc().format('MM/DD/YYYY');
                    var end = moment.utc().subtract(1, 'month').startOf('day').unix();
                    vm.filter.e = moment.unix(end).utc().format('MM/DD/YYYY');
                    break;
                case 5:
                    delete vm.filter.s;
                    delete vm.filter.e;
                    delete vm.filter.start;
                    delete vm.filter.end;
                    break;

            }
            if (vm.filter.time != 5) {
                vm.filter.start = end
                vm.filter.end = start;
            }
        }

        function filterRetain() {
            sessionStorage.setItem("retainNotiSearchText", vm.serachInput);
        }

        function apply(filter) {
            var resFilter = getFilters(filter);
            if (!resFilter) return;
            vm.selectedItems = [];
            fetchData(resFilter.source, resFilter.filtercopy.s, resFilter.filtercopy.e, resFilter.place);

        }

        function getFilters(filter) {
            var filtercopy = angular.copy(filter);
            if (filtercopy) {
                if (filtercopy.time == 5) {
                    var start = vm.filter.s;
                    var end = vm.filter.e;
                    if (!start || !end) {
                        notificationService.error('Invalid date range.');
                        return;
                    } else {
                        start = moment(start).startOf('day').unix();
                        end = moment(end).endOf('day').unix();
                        if (start > end) {
                            notificationService.error('End date cannot be less than start date.');
                            return;
                        }
                    }
                    filtercopy.s = start;
                    filtercopy.e = end;
                } else {
                    filtercopy.s = (filtercopy.s) ? (filtercopy.start) : '0';
                    filtercopy.e = (filtercopy.e) ? (filtercopy.end) : '0';
                }
            }

            var source = 2;
            if (vm.filter.apps && (vm.filter.apps.length == 0 || vm.filter.apps.length == 2)) {
                source = 2
            } else if (vm.filter.apps && vm.filter.apps.length == 1) {
                if (vm.filter.apps[0] == 1) {
                    source = 0;
                } else {
                    source = 1;
                }
            }

            var place = '';
            var placeArr = utils.getLocation(vm.filter.sectors);

            if (placeArr.length > 0) {
                place = placeArr.join(',');
            } else {
                if (vm.role && vm.role.email_subscription == 0) {
                    placeArr = utils.getLocation([1, 2, 3, 5, 6]);
                    place = placeArr.join(',');
                }
            }
            return {
                source: source,
                filtercopy: filtercopy,
                place: place
            }
        }

        function resetFilters() {
            vm.filter = {
                time: 1
            };
            init();
        }


        $rootScope.$on('addNotification', function (ev, resultNotification) {
            addNewNotification(resultNotification)
        });

        function addNewNotification(resultNotification) {
            if (vm.filter && vm.filter.sectors && vm.filter.sectors.length > 0) {
                var placeId = null;
                switch (resultNotification.notification_type) {
                    case 'Event':
                        placeId = 1;
                        break;
                    case "Task":
                        placeId = 2;
                        break;
                    case "Event_Reminder":
                    case "Task_Reminder":
                        placeId = 3;
                        break;
                    case "Email":
                        placeId = 4;
                        break;
                    case Client_Messenger:
                        placeId = 5;
                        break;
                    case Sidebar_Comment:
                        placeId = 6;
                        break;
                    case Sidebar_Post:
                        placeId = 6;
                        break;
                    case Matter:
                        placeId = 7;
                        break;
                    case Intake:
                        placeId = 8;
                        break;
                }
                if (placeId) {
                    if (_.indexOf(vm.filter.sectors, placeId) > -1) {
                        var existingNoti = _.findWhere(vm.notificationList, { notification_id: resultNotification.notification_id });
                        if (!existingNoti) {
                            vm.notificationList.unshift(resultNotification);
                        }
                    }
                }
            } else {
                var existingNoti = _.findWhere(vm.notificationList, { notification_id: resultNotification.notification_id });
                if (!existingNoti) {
                    vm.notificationList.unshift(resultNotification);
                }
            }
        }

        $rootScope.$on('getLatestNotifications', function () {
            apply(vm.filter);
        });

        function fetchData(source, s, e, place) {
            notificationDatalayer.newNotifications(source, s, e, place, vm.pageNumber, vm.pageSize)
                .then(function (res) {
                    vm.totalCount = res.totalCount;

                    if (res.result && res.result.length == 0) {
                        vm.hideMore = true;
                    } else {
                        vm.hideMore = false;
                    }
                    if (vm.pageNumber == 1 && res.result && res.result.length < vm.pageSize) {
                        vm.hideMore = true;
                    }

                    vm.notificationList = _.uniq(res.result, function (rec) { return rec.notification_id });
                    setTimeout(function () {
                        var heightForGrid = ($("#allNotificationFooter").offset().top - $("#myDiv1").offset().top);
                        $('#myNotificationGrid').css("max-height", heightForGrid + "px");
                        $('#myNotificationGrid').css("height", heightForGrid + "px");
                        $("#myNotificationGrid").animate({
                            scrollTop: 0
                        }, 100);
                    }, 100);
                });
            $rootScope.$broadcast("notificationCountReset");
        }

        function getMoreNotifications() {
            var resFilter = getFilters(vm.filter);
            if (!resFilter) return;
            var newPageNum = vm.pageNumber + 1;
            notificationDatalayer.newNotifications(resFilter.source, resFilter.filtercopy.s, resFilter.filtercopy.e, resFilter.place, newPageNum, vm.pageSize)
                .then(function (res) {
                    vm.totalCount = res.totalCount;
                    if (res.result && res.result.length == 0) {
                        notificationService.error("No more records found.");
                    } else {
                        vm.pageNumber++;
                        res.result = _.uniq(res.result, function (rec) { return rec.notification_id });
                        angular.forEach(res.result, function (noteObj, index) {
                            vm.notificationList.push(noteObj);
                        });
                    }
                });
        };
    }

})(angular);
