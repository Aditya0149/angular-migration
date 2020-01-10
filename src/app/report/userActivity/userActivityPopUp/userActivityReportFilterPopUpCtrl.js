(function (angular) {
    'use strict';

    angular.module('cloudlex.report')
        .controller('UserActivityPopUoCtrl', UserActivityPopUpCtrl);

    UserActivityPopUpCtrl.$inject = ['$modalInstance', 'params', 'notification-service', '$scope'];

    function UserActivityPopUpCtrl($modalInstance, params, notificationService, $scope) {
        var vm = this;

        vm.filters = angular.copy(params.filters);
        vm.taskSummaryEvent = {};
        vm.assignedUserList = {};
        vm.assignedUserList.user = angular.copy(params.assignedUserList);

        vm.apply = apply;
        vm.cancel = cancel;
        vm.openCalender = openCalender;
        vm.resetMultiSelectFilter = resetMultiSelectFilter;
        vm.isDatesValid = isDatesValid;
        vm.tags = params.tags;
        (function () {

            if (vm.filters.userID !== '' && vm.filters.userID !== null && angular.isDefined(vm.filters.userID)) {
                var user = _.find(vm.assignedUserList.user, function (item) {
                    return item.uid === vm.filters.userID.uid;
                });

                vm.filters.userID = user;
            }

            removeLexviaFromUserList(vm.assignedUserList.user);

        })();

        function isDatesValid() {
            if ($('#userstartDateErr').css("display") == "block" ||
                $('#userendDateErr').css("display") == "block") {
                return true;
            }
            else {
                return false;
            }
        }


        function removeLexviaFromUserList(userList) {
            var ids = _.pluck(userList, 'uid');
            var index = ids.indexOf('0');
            if (index > -1) {
                userList.splice(index, 1);
            }
        }

        function cancel() {
            $modalInstance.dismiss('cancel');
        };

        $scope.$watch(function () {
            if (utils.isNotEmptyVal(vm.filters.userID) || utils.isNotEmptyVal(vm.filters.startDate) || utils.isNotEmptyVal(vm.filters.endDate) || vm.tags.length > 0) {
                vm.enableApply = false;
            } else {
                vm.enableApply = true;
            }
        })

        function apply(selectedFilterValue) {
            var filtercopy = angular.copy(vm.filters);
            filtercopy.startDate = (filtercopy.startDate) ? utils.getUTCTimeStamp(filtercopy.startDate) : '';
            filtercopy.endDate = (filtercopy.endDate) ? utils.getUTCTimeStampEndDay(filtercopy.endDate)  : '';
            //getUTCDates(filtercopy);
            if (utils.isEmptyVal(filtercopy.startDate) && utils.isNotEmptyVal(filtercopy.endDate) || utils.isNotEmptyVal(filtercopy.startDate) && utils.isEmptyVal(filtercopy.endDate)) {
                notificationService.error('Date range is invalid');
                return;
            }
            else if (filtercopy.startDate > filtercopy.endDate) {
                notificationService.error('Date range is invalid');
                return;
            } else {
                convertUserAssinged(filtercopy);
                $modalInstance.close(filtercopy);
            }
        };

        function convertUserAssinged(filters) {

            if (filters.userID !== '' && filters.userID !== null && angular.isDefined(filters.userID)) {
                var user = _.find(vm.assignedUserList.user, function (item) {
                    return item.uid === vm.filters.userID.uid;
                });

                filters.userID = user.uid;
            }
        }

        function getUTCDates(filters) {
            if (angular.isDefined(filters)) {
                if (utils.isNotEmptyVal(filters.endDate)) {
                    var toDate = moment.unix(filters.endDate).endOf('day');
                    toDate = toDate.utc();
                    toDate = toDate.toDate();
                    toDate = new Date(toDate);
                    filters.endDate = moment(toDate.getTime()).unix();
                }

                if (utils.isNotEmptyVal(filters.startDate)) {
                    var fromDate = moment.unix(filters.startDate).startOf('day');
                    fromDate = fromDate.utc();
                    fromDate = fromDate.toDate();
                    fromDate = new Date(fromDate);
                    filters.startDate = moment(fromDate.getTime()).unix();
                }
            }
        }

        function openCalender($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }

        function resetMultiSelectFilter() {
            vm.filters.startDate = "";
            vm.filters.endDate = "";
            vm.filters.userID = "";
        }

    }

})(angular);