/**
 * Moition Report Motion Filter Controller
 **/
(function (angular) {

    angular.module('cloudlex.report')
        .controller('MotionReportFilterCtrl', MotionReportFilterCtrl)

    MotionReportFilterCtrl.$inject = ['$modalInstance', 'notification-service', 'matterFactory', 'filter', 'users', 'masterData', '$scope', 'tags'];
    function MotionReportFilterCtrl($modalInstance, notificationService, matterFactory, filter, users, masterData, $scope, tags) {
        var vm = this;
        var master_data = masterData.getMasterData();
        vm.apply = applyFilter;
        vm.searchMatters = searchMatters;
        vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
        vm.openCalender = openCalender;
        vm.setMinMaxDate = setMinMaxDate;
        vm.showDateFilter = showDateFilter;
        vm.showQuickFilters = showQuickFilters;
        vm.setQuickFilters = setQuickFilters;
        vm.dtFilterSelected = dtFilterSelected;
        vm.resetFilters = resetFilters;
        vm.close = close;
        vm.isDatesValid = isDatesValid;
        vm.tags = (tags) ? tags : [];
        /* Initialization */
        (function () {
            vm.motionType = master_data.motion_types;
            vm.motionStatus = master_data.motion_statuses;
            vm.filter = angular.copy(filter);

            vm.dtFilters = [
                //                { id: '   ', name: '  ' },
                { id: 'createddate', name: 'Created date' },
                { id: 'lastupdated', name: 'Last updated' }
            ];

            vm.quickFilters = getQuickFilters();
            vm.users = users;
        })();

        function isDatesValid() {
            if (utils.isNotEmptyVal(vm.filter.quickFilters)) {
                vm.filter.quickFilters.value
                if (vm.filter.quickFilters.value == 'Custom dates') {
                    return ($('#motionstartDateErr').css("display") == "block" ||
                        $('#motionendDateErr').css("display") == "block");
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }

        }

        /* Declare and set date quick filters */
        function getQuickFilters() {
            var quickFilters = [{ value: 'Yesterday' },
            { value: 'Today' },
            { value: 'Going back a month' },
            { value: 'Last week' },
            { value: 'Custom dates' }];

            _.forEach(quickFilters, function (quickFilter) {
                setDateRangeFor(quickFilter);
            });
            return quickFilters;
        };

        /* Sets the date range for quickfilters */
        function setDateRangeFor(quickFilter) {

            if (quickFilter.value === 'Custom dates') {
                quickFilter.dateRange = {};
                return;
            }

            var start = moment().utc().startOf('day');
            var end = moment().utc().endOf("day"); //Now
            switch (quickFilter.value) {
                case "Yesterday":
                    start = angular.copy(start).subtract(1, 'days');        // Start of day 7 days ago
                    end = angular.copy(start).endOf("day");
                    break;
                case "Last week":
                    start = angular.copy(start).subtract(7, 'days');        // Start of day 7 days ago
                    break;
                case "Going back a month":
                    start = angular.copy(start).subtract(1, 'months');        // Start of day 1 month ago
                    break;
            }

            //            start = start.utc().unix();
            //            end = end.utc().unix();
            quickFilter.dateRange = {
                s: start,
                e: end
            };
        }

        $scope.$watch(function () {
            if (utils.isNotEmptyVal(vm.filter.date_filter) || utils.isNotEmptyVal(vm.filter.created_by_filter) ||
                utils.isNotEmptyVal(vm.filter.updated_by_filter) || utils.isNotEmptyVal(vm.filter.matter_id) ||
                vm.filter.need_to_be_Reviewed != 0 || vm.filter.motion_type.length > 0 ||
                vm.filter.motion_status.length > 0 || vm.tags.length > 0) {
                vm.enableApply = false;
            } else {
                vm.enableApply = true;
            }
        })

        /* Sets the filter object and returns it to report controller */
        function applyFilter(filters) {
            var filtercopy = angular.copy(filters);

            if (filtercopy.created_by_filter == undefined) {
                filtercopy.created_by_filter = "";
            }

            if (filtercopy.updated_by_filter == undefined) {
                filtercopy.updated_by_filter = "";
            }

            if(filtercopy.matter_id == undefined){
                filtercopy.matter_id = "";
            }

            filtercopy.start_date = (filtercopy.start_date) ? moment(filtercopy.start_date).unix() : "";
            filtercopy.end_date = (filtercopy.end_date) ? moment(filtercopy.end_date).unix() : "";

            if (typeof (filters.need_to_be_Reviewed) !== 'undefined' && filters.need_to_be_Reviewed != null && filters.need_to_be_Reviewed == 0) {
                filters.need_to_be_Reviewed = '';
            }
            var isvalid = validateDateRange(filtercopy);
            if (isvalid) {
                $modalInstance.close({ filter: filtercopy, users: vm.users });
            } else {
                utils.isNotEmptyVal(filtercopy.quickFilters) ?
                    notificationService.error('Invalid date range.') :
                    notificationService.error('Please set the date range.');
            }
        }

        /* Checks that custome date range is valid or not */
        function validateDateRange(filtercopy) {
            var isValid = true;
            if (utils.isNotEmptyVal(filtercopy.date_filter)) {

                if (utils.isEmptyVal(filtercopy.start_date) && utils.isEmptyVal(filtercopy.end_date)) {
                    return false;
                }

                if (utils.isNotEmptyVal(filtercopy.start_date)) {
                    isValid = utils.isNotEmptyVal(filtercopy.end_date);
                    if (!isValid) { return isValid; }
                }

                if (utils.isNotEmptyVal(filtercopy.end_date)) {
                    isValid = utils.isNotEmptyVal(filtercopy.start_date);
                    if (!isValid) { return isValid; }
                }

                //setDates
                setDates(filtercopy);
                var start = moment.unix(filtercopy.start_date);
                var end = moment.unix(filtercopy.end_date);
                isValid = start.isBefore(end);
                if (!isValid) { return isValid; }
            }

            return true;
        }

        /* Sets date range for quick filters */
        function setDates(filtercopy) {
            filtercopy.start_date = moment.unix(filtercopy.start_date).utc().startOf("day").valueOf();
            filtercopy.start_date = moment(filtercopy.start_date).unix();

            filtercopy.end_date = moment.unix(filtercopy.end_date).utc().endOf("day").valueOf();
            filtercopy.end_date = moment(filtercopy.end_date).unix();
        }

        /* Implements search matter for given string */
        var matters = [];
        function searchMatters(matterName) {
            if (matterName) {
                return matterFactory.searchMatters(matterName).then(
                    function (response) {
                        matters = response.data;
                        return response.data;
                    }, function (error) {
                        notificationService.error('Matters not loaded');
                    });
            }
        }

        /* Callback for searched matter name display */
        function formatTypeaheadDisplay(matter) {
            if (utils.isNotEmptyVal(matter)) {
                return matter.name;
            } else {
                return "";
            }
        }

        /* Callback to open calendar */
        function openCalender($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }

        /* Callback to set maximum and minimum date for date range */
        function setMinMaxDate(dt, modelname) {
            dt = moment(dt).unix();
            var date = moment.unix(dt).add(1, 'day').toDate();
            date = new Date(date);
            vm[modelname] = date;
        }

        /* Show quick date filter */
        function showDateFilter(quickFilter) {
            return utils.isNotEmptyVal(quickFilter) && quickFilter.value == 'Custom dates';
        }

        /* Show quick filters */
        function showQuickFilters(dateFilter) {
            return utils.isNotEmptyVal(dateFilter);
        }

        /* Set quick filters */
        function setQuickFilters(quickFilter) {
            vm.filter.start_date = quickFilter.s;
            vm.filter.end_date = quickFilter.e;
            //            vm.filter.start_date = (filters.start_date) ? moment(quickFilter.s).unix() : "";
            //            vm.filter.end_date = (filters.end_date) ? moment(quickFilter.e).unix() : ""; 
        }

        function dtFilterSelected(selFilter) {
            if (utils.isEmptyVal) {
                vm.filter.start_date = "";
                vm.filter.end_date = "";
                vm.filter.quickFilters = null;
            }
        }

        /* Reset all filters */
        function resetFilters() {
            vm.filter.date_filter = ""
            vm.filter.motion_type = [];
            vm.filter.motion_status = [];
            vm.filter.matter_id = "";
            vm.filter.start_date = "";
            vm.filter.end_date = "";
            vm.filter.created_by_filter = "";
            vm.filter.updated_by_filter = "";
            vm.filter.quickFilters = "";
            vm.filter.need_to_be_Reviewed = 0;
        }

        /* Close the filter popup */
        function close() {
            $modalInstance.dismiss();
        }

    }

})(angular)