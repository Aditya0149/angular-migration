(function (angular) {

    'user strict';

    /**
    * @name cloudlex.settings.controller:PaymentFilterCtrl
    * @requires $modal,modalService, notification-service
    */

    angular.module('cloudlex.settings')
        .controller('PaymentFilterCtrl', PaymentFilterCtrl);

    PaymentFilterCtrl.$inject = ['$scope', '$modalInstance', 'notification-service', 'filterParams'];
    function PaymentFilterCtrl($scope, $modalInstance, notificationService, filterParams) {

        var vm = $scope;
        vm.filter = {};
        vm.applyFilters = applyFilters;
        vm.cancel = cancel;
        vm.isDatesValid = isDatesValid;
        vm.resetFilter = resetFilter;
        var params = filterParams;
        (function () {
            vm.transactionTypes = [{ id: '3', name: 'Archive' },
            { id: '1', name: 'Add on - Matters' },
            { id: '2', name: 'Add on - Users' },
            { id: '4', name: 'Subscription' }];
            setAppliedFilters(params);
        })();

        /*
         * To set applied filters property
         */

        function setAppliedFilters(params) {
            vm.filter.transactiontype = utils.isEmptyVal(vm.filter.transactiontype) ? params.transactiontype : '';
            vm.filter.t_start_date = utils.isEmptyVal(vm.filter.t_start_date) ? params.t_start_date : '';
            vm.filter.t_end_date = utils.isEmptyVal(vm.filter.t_end_date) ?
                params.t_end_date : '';
        }

        /**
        * Function to pass selected filters object to payment controller
        */
        function applyFilters() {
            var filtercopy = angular.copy(vm.filter);
            filtercopy.t_start_date = utils.isEmptyVal(filtercopy.t_start_date) ? '' :
                moment(filtercopy.t_start_date).unix();
            filtercopy.t_end_date = utils.isEmptyVal(filtercopy.t_end_date) ? '' :
                moment(filtercopy.t_end_date).unix();
            filtercopy.t_end_date = selecteddate(filtercopy.t_end_date);
            if (aredatesValid(filtercopy)) {
                $modalInstance.close(filtercopy);
            }
            else {
                notificationService.error("Invalid Date Range..");
            }
        }

        //validate transaction date range
        function aredatesValid(filterdate) {
            if (utils.isEmptyVal(filterdate.t_start_date) && utils.isEmptyVal(filterdate.t_end_date)) {
                return true;
            }
            else if ((utils.isNotEmptyVal(filterdate.t_start_date) && utils.isEmptyVal(filterdate.t_end_date)) || utils.isNotEmptyVal(filterdate.t_end_date) && utils.isEmptyVal(filterdate.t_start_date)) {
                return false;
            }
            else {
                var isValid = true;
                var start = moment(filterdate.t_start_date).utc();
                var end = moment(filterdate.t_end_date).utc();
                if (start.isAfter(end)) {
                    isValid = false;
                }
                return isValid;
            }
        }

        function selecteddate(dateSel) {
            if (utils.isEmptyVal(dateSel)) {
                return dateSel;
            }
            else {
                var date = moment.unix(dateSel).endOf('day');
                date = date.utc();
                date = date.toDate();
                date = new Date(date);
                date = moment(date.getTime()).unix();
                return date;
            }
        }

        //reset filter values
        function resetFilter() {
            vm.filter.transactiontype = '';
            vm.filter.t_start_date = '';
            vm.filter.t_end_date = '';
        }

        vm.openCalendar = function (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        function cancel() {
            $modalInstance.dismiss();
        }


        /**
        * To validate the date entered. If date is invalid apply will be disabled
        */

        function isDatesValid() {
            if ($('#transstartDateError').css("display") == "block" ||
                $('#transendDateError').css("display") == "block") {
                return true;
            }
            else {
                return false;
            }
        }

    }

})(angular);

