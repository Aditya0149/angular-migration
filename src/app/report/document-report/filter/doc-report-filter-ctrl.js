(function (angular) {

    angular.module('cloudlex.report')
        .controller('DocumentReportFilterCtrl', DocumentReportFilterCtrl)

    DocumentReportFilterCtrl.$inject = ['$modalInstance', 'notification-service', 'contactFactory',
        'categories', 'filter', '$scope', 'tags'];
    function DocumentReportFilterCtrl($modalInstance, notificationService, contactFactory,
        categories, filter, $scope, tags) {
        var vm = this;

        vm.apply = applyFilter;
        vm.openCalender = openCalender;
        vm.setMinMaxDate = setMinMaxDate;
        vm.showDateFilter = showDateFilter;
        vm.showQuickFilters = showQuickFilters;
        vm.setQuickFilters = setQuickFilters;
        vm.dtFilterSelected = dtFilterSelected;
        vm.resetFilters = resetFilters;
        vm.close = close;
        vm.isDatesValid = isDatesValid;
        vm.tags = tags;
        (function () {
            vm.categories = categories;
            vm.filter = angular.copy(filter);
            vm.dtFilters = [
                //                { id: '   ', name: '  ' },
                { id: 'createddate', name: 'created date' },
                { id: 'lastupdated', name: 'last updated' }
            ];

            vm.quickFilters = getQuickFilters();

            contactFactory.getUsersList()
                .then(function (users) {
                    vm.users = contactFactory.getFlatUserList(users);
                });

        })();

        function isDatesValid() {
            if (utils.isNotEmptyVal(vm.filter.quickFilters)) {
                if (vm.filter.quickFilters.value == 'Custom dates') {
                    return ($('#custstartDateErr').css("display") == "block" ||
                        $('#custendDateErr').css("display") == "block");
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }

        }

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

            //start = start.utc().unix();
            //end = end.utc().unix();
            quickFilter.dateRange = {
                s: start,
                e: end
            };
        }

        $scope.$watch(function () {
            if ((vm.filter.category_filter && vm.filter.category_filter.length > 0) ||
                (vm.filter && utils.isNotEmptyVal(vm.filter.date_filter)) ||
                (vm.filter && utils.isNotEmptyVal(vm.filter.created_by_filter)) ||
                (vm.filter && utils.isNotEmptyVal(vm.filter.updated_by_filter)) ||
                (vm.filter.need_to_be_Reviewed && vm.filter.need_to_be_Reviewed != 0) || vm.tags.length > 0) {
                vm.enableApply = false;
            } else {
                vm.enableApply = true;
            }
        })

        function applyFilter(filters) {
            var filtercopy = angular.copy(filters);

            if(filtercopy.created_by_filter == undefined){
                filtercopy.created_by_filter = "";
            }

            if(filtercopy.updated_by_filter == undefined){
                filtercopy.updated_by_filter = "";
            }

            filtercopy.start_date = (filtercopy.start_date) ? moment(filtercopy.start_date).unix() : '';
            filtercopy.end_date = (filtercopy.end_date) ? moment(filtercopy.end_date).unix() : '';
            var isvalid = validateDateRange(filtercopy);

            if (typeof (filters.need_to_be_Reviewed) !== 'undefined' && filters.need_to_be_Reviewed != null && filters.need_to_be_Reviewed == 0) {
                filters.need_to_be_Reviewed = '';
            }
            if (isvalid) {
                var tags = generateTags(filtercopy);
                $modalInstance.close({ filter: filtercopy, tags: tags, users: vm.users });
            } else {
                utils.isNotEmptyVal(filtercopy.quickFilters) ?
                    notificationService.error('Invalid date range.') :
                    notificationService.error('Please set the date range.');
            }
        }

        function validateDateRange(filter) {
            if (utils.isNotEmptyVal(filter.date_filter)) {
                var isValid = true;

                if (utils.isEmptyVal(filter.start_date) && utils.isEmptyVal(filter.end_date)) {
                    return false;
                }

                if (utils.isNotEmptyVal(filter.start_date)) {
                    isValid = utils.isNotEmptyVal(filter.end_date);
                    if (!isValid) { return isValid; }
                }

                if (utils.isNotEmptyVal(filter.end_date)) {
                    isValid = utils.isNotEmptyVal(filter.start_date);
                    if (!isValid) { return isValid; }
                }

                //set dates
                setDates(filter);

                var start = moment.unix(filter.start_date);
                var end = moment.unix(filter.end_date);

                isValid = start.isBefore(end);
                if (!isValid) { return isValid; }
            }

            return true;
        }

        function setDates(filtercopy) {
            filtercopy.start_date = moment.unix(filtercopy.start_date).utc().startOf("day").valueOf();
            filtercopy.start_date = moment(filtercopy.start_date).unix();

            //filtercopy.end_date = utils.getTimestampEnd(filtercopy.end_date);
            filtercopy.end_date = moment.unix(filtercopy.end_date).utc().endOf("day").valueOf();
            filtercopy.end_date = moment(filtercopy.end_date).unix();
        }

        function generateTags(filtercopy) {
            var tags = [];
            if (utils.isNotEmptyVal(filtercopy.category_filter)) {
                _.forEach(filtercopy.category_filter, function (cat) {
                    var tagObj = {
                        type: 'cat_filter',
                        key: cat.doc_category_id,
                        id: cat.doc_category_id,
                        value: 'Category: ' + cat.doc_category_name
                    };
                    tags.push(tagObj);
                });
            }

            if (utils.isNotEmptyVal(filtercopy.date_filter)) {
                var start = moment.unix(filtercopy.start_date).utc().format('MM-DD-YYYY');
                var end = moment.unix(filtercopy.end_date).format('MM-DD-YYYY');
                var tag = {
                    type: 'date_filter',
                    key: 'date_filter',
                    value: (vm.filter.date_filter === 'createddate' ? 'created date  ' : 'last updated  ') +
                        ' from: ' + start + '  to: ' + end
                };
                tags.push(tag);
            }

            if (utils.isNotEmptyVal(vm.filter.updated_by_filter)) {
                var updatedByUser = {};
                var user = _.find(vm.users, function (usr) {
                    return usr.uid == vm.filter.updated_by_filter;
                });

                updatedByUser.value = 'Updated by: ' + user.Name;
                updatedByUser.key = 'updated_by_filter';
                updatedByUser.type = 'updated_by_filter';
                tags.push(updatedByUser);
            }

            if (utils.isNotEmptyVal(vm.filter.created_by_filter)) {
                var createdByUser = {};
                var user = _.find(vm.users, function (usr) {
                    return usr.uid == vm.filter.created_by_filter;
                });

                createdByUser.value = 'Created by: ' + user.Name;
                createdByUser.key = 'created_by_filter';
                createdByUser.type = 'created_by_filter';
                tags.push(createdByUser);
            }


            if (utils.isNotEmptyVal(vm.filter.need_to_be_Reviewed) && vm.filter.need_to_be_Reviewed) {
                var tagObj = {
                    key: 'need_to_be_Reviewed',
                    type: 'need_to_be_Reviewed',
                    value: 'Needs Review'
                };
                tags.push(tagObj);
            }



            return tags;
        }

        function openCalender($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }

        function setMinMaxDate(dt, modelname) {
            dt = moment(dt).unix();
            var date = moment.unix(dt).add(1, 'day').toDate();
            date = new Date(date);
            vm[modelname] = date;
        }

        function showDateFilter(quickFilter) {
            return utils.isNotEmptyVal(quickFilter) && quickFilter.value == 'Custom dates';
        }

        function showQuickFilters(date_filter) {
            return utils.isNotEmptyVal(date_filter);
        }

        function setQuickFilters(quickFilter) {
            vm.filter.start_date = quickFilter.s;
            vm.filter.end_date = quickFilter.e;
        }

        function dtFilterSelected(selFilter) {
            if (utils.isEmptyVal) {
                vm.filter.start_date = "";
                vm.filter.end_date = "";
                vm.filter.quickFilters = null;
            }
        }

        function resetFilters() {
            vm.filter.date_filter = ""
            vm.filter.category_filter = [];
            vm.filter.start_date = "";
            vm.filter.end_date = "";
            vm.filter.created_by_filter = "";
            vm.filter.updated_by_filter = "";
            vm.filter.quickFilters = "";
            vm.filter.need_to_be_Reviewed = 0;
        }

        function close() {
            $modalInstance.dismiss();
        }

    }

})(angular)