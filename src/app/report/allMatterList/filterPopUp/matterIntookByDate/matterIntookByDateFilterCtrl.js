    (function (angular) {

        angular.module('cloudlex.report').controller('FilterMatterIntookByDateCtrl', ['$modalInstance',
            'params', 'notification-service', '$scope', function ($modalInstance, params, notificationService, $scope) {

                var vm = this;

                vm.dataModel = {};
                vm.viewModel = {};
                //vm.viewModel.filter = {};
                vm.selectionModel = {};
                vm.selectionModel.multiFilters = {};
                vm.selectionModel.multiFilters.statuses = [];
                vm.selectionModel.multiFilters.substatus = [];
                vm.selectionModel.multiFilters.categories = [];
                vm.selectionModel.multiFilters.types = [];
                vm.selectionModel.multiFilters.subtypes = [];
                vm.selectionModel.multiFilters.venues = [];
                vm.groupjurisdictions = groupjurisdictions;
                vm.isDatesValid = isDatesValid;
                vm.tags = params.tags;
                //get selected filter in {id,name} format
                vm.viewModel.masterList = params.masterData;
                vm.jurisdictions = [];
                vm.jurisdictionName = '';
                vm.viewModel.name = undefined;
                vm.viewModel.dateFilters = ['Intake Date',];

                vm.viewModel.timeButtons = [
                    { value: getYearObj(), label: 'last year' },
                    { value: getLast6MnthObj(), label: 'last 6 months' },
                    { value: getAMonthAgoObj(), label: 'last 1 month' },
                    { value: { tag: 'custom dates' }, label: 'custom dates' }
                ];

                _.forEach(params.masterData.jurisdictions, function (jurisdiction) {
                    vm.jurisdictions.push(jurisdiction.name);
                })
                vm.jurisdictions = vm.jurisdictions.sort();

                function groupjurisdictions(venue) {
                    if (utils.isNotEmptyVal(venue.jurisdiction_id)) {
                        _.forEach(params.masterData.jurisdictions, function (jurisdiction) {
                            if (jurisdiction.id == venue.jurisdiction_id) {
                                vm.jurisdictionName = jurisdiction.name;
                            }
                        })
                        return vm.jurisdictionName;
                    }
                }

                if (angular.isDefined(params.timeFilters)) {
                    vm.viewModel.name = "Intake Date";
                    vm.viewModel.filter = getFilterObj(params.timeFilters).value;
                }
                else {
                    vm.viewModel.name = undefined;
                }

                if (angular.isDefined(vm.viewModel.filter)) {
                    if (vm.viewModel.filter.tag === 'custom dates') {
                        vm.viewModel.filter.end = params.timeFilters.end;
                        vm.viewModel.filter.start = params.timeFilters.start;
                    }
                }

                function isDatesValid() {
                    if ($('#IntookstartDateErr').css("display") == "block" ||
                        $('#IntookendDateErr').css("display") == "block") {
                        return true;
                    }
                    else {
                        return false;
                    }
                }

                function getFilterObj(filterObj) {
                    filterObj.tag = filterObj.tag.replace(vm.viewModel.name + ": ", "");

                    return _.find(vm.viewModel.timeButtons, function (btn) {
                        return _.isEqual(filterObj.tag, btn.value.tag);
                    })
                }

                function getYearObj() {
                    var start = utils.getUTCTimeStampStart(moment().subtract(1, 'year'));
                    var end = utils.getUTCTimeStampEnd(new Date());
                    start = getFormatteddate(start);
                    end = getFormatteddate(end);
                    return { start: start, end: end, tag: 'A Year Ago' };
                }

                function getFormatteddate(epoch) {
                    var formdate = new Date(epoch * 1000);
                    formdate = moment(formdate).utc().format('MM/DD/YYYY');
                    return formdate;
                }

                function getLast6MnthObj() {
                    var start = utils.getUTCTimeStampStart(moment().subtract(6, 'months'));
                    var end = utils.getUTCTimeStampEnd(new Date());
                    start = getFormatteddate(start);
                    end = getFormatteddate(end);
                    return { start: start, end: end, tag: 'last 6 months' };
                }

                function getAMonthAgoObj() {
                    var start = utils.getUTCTimeStampStart(moment().subtract(1, 'months'));
                    var end = utils.getUTCTimeStampEnd(new Date());
                    start = getFormatteddate(start);
                    end = getFormatteddate(end);
                    return { start: start, end: end, tag: 'last 1 months' };
                }

                vm.selectionModel.multiFilters = setFilters();

                vm.viewModel.statuses = moveBlankToBottom(getFilterValues(params.masterData, 'statuses'));
                removeAllFromStatusFilter(vm.selectionModel.multiFilters.statuses);
                vm.viewModel.type = moveBlankToBottom(getFilterValues(params.masterData, 'type'));
                vm.viewModel.categories = moveBlankToBottom(getFilterValues(params.masterData, 'category'));

                function removeAllFromStatusFilter(statuses) {
                    var allStatus = _.find(statuses, function (status) {
                        return status.id === 'all';
                    });

                    if (angular.isDefined(allStatus)) {
                        var ids = _.pluck(statuses, 'id');
                        var index = ids.indexOf(allStatus.id);
                        statuses.splice(index, 1);
                    }
                }


                function moveBlankToBottom(array) {
                    //make sure array has {id,name} objects
                    var values = _.pluck(array, 'name');
                    var index = values.indexOf('');
                    utils.moveArrayElement(array, index, array.length - 1);
                    return array;
                }

                function setFilters() {
                    var filters = angular.copy(params.filters);
                    angular.forEach(filters, function (filterVal, filter) {
                        filters[filter] = filterVal.map(function (item) {
                            return {
                                id: item.id,
                                name: angular.isUndefined(item.name) ? item.desc : item.name
                            }
                        });
                    });
                    return filters;
                }

                function getFilterValues(masterList, filter) {
                    return masterList[filter].map(function (item) {
                        return {
                            id: item.id,
                            name: item.name
                        };
                    });
                }

                vm.setDateRange = function (filter) {
                    if (utils.isEmptyString(filter)) {
                        vm.viewModel.filter = undefined;
                    } else {
                        vm.viewModel.filter = {}
                        vm.viewModel.filter = getYearObj();
                    }
                }

                vm.setFromDate = function (dt) {
                    dt = moment(dt).unix();
                    var date = moment.unix(dt).add(1, 'day').toDate();
                    date = new Date(date);
                    vm.viewModel.checkDate = date;
                }

                vm.isFromDateUndefined = function (dt) {
                    return (angular.isUndefined(dt) || _.isNull(dt) || utils.isEmptyString(dt));
                }

                vm.changeFilterType = function (filter) {
                    vm.viewModel.name = 'Intake Date';
                    if (utils.isEmptyVal(vm.viewModel.filter.start) && utils.isEmptyVal(vm.viewModel.filter.end) && vm.viewModel.filter.tag == "A Year Ago") {
                        vm.viewModel.filter.start = getFormatteddate(utils.getUTCTimeStampStart(moment().subtract(1, 'year')));
                        vm.viewModel.filter.end = getFormatteddate(utils.getUTCTimeStampEnd(new Date()));
                    } else {
                        var start = utils.getUTCTimeStamp(new Date(vm.viewModel.filter.start));
                        var end = utils.getUTCTimeStamp(new Date(vm.viewModel.filter.end));
                    }
                    if (vm.viewModel.filter.tag === 'custom dates') {
                        vm.viewModel.filter.start = utils.isNotEmptyVal(vm.viewModel.filter.start) ? getFormatteddate(start, "MM/DD/YYY") : "";
                        vm.viewModel.filter.end = utils.isNotEmptyVal(vm.viewModel.filter.end) ? getFormatteddate(end, "MM/DD/YYYY") : "";
                    }
                };

                vm.openCalender = function ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                }

                $scope.$watch(function () {
                    if (vm.viewModel.name && utils.isNotEmptyVal(vm.viewModel.name) || (vm.viewModel.filter && utils.isNotEmptyVal(vm.viewModel.filter)) ||
                        (vm.viewModel.filter && utils.isNotEmptyVal(vm.viewModel.filter.start)) ||
                        (vm.viewModel.filter && utils.isNotEmptyVal(vm.viewModel.filter.end)) ||
                        (vm.selectionModel.multiFilters.statuses && vm.selectionModel.multiFilters.statuses.length > 0) ||
                        (vm.selectionModel.multiFilters.types.length > 0) ||
                        (vm.selectionModel.multiFilters.categories.length > 0) ||
                        (utils.isNotEmptyVal(vm.selectionModel.multiFilters.venues)) || vm.tags.length > 0) {
                        vm.enableApply = false;
                    } else {
                        vm.enableApply = true;
                    }
                })

                vm.ok = function (selectionModel) {
                    var filtermodel = angular.copy(vm.viewModel.filter);
                    var filtermodelValid = angular.copy(vm.viewModel.filter);
                    var dateFilter = utils.isNotEmptyVal(vm.viewModel.name) ? vm.viewModel.name : '';

                    if (filtermodelValid) {
                        filtermodelValid.end = (filtermodelValid.end) ? moment(filtermodelValid.end).unix() : '';
                        filtermodelValid.start = (filtermodelValid.start) ? moment(filtermodelValid.start).unix() : '';
                    }

                    var isValid = validateDates(filtermodelValid, vm.viewModel.name);

                    if (isValid) {
                        if (!utils.isEmptyObj(filtermodel)) {
                            if (vm.viewModel.filter.tag == 'custom dates') {
                                filtermodel.tag;
                            }
                            else {
                                filtermodel.tag = vm.viewModel.name + ": " + vm.viewModel.filter.tag;
                            }
                        }
                        if (filtermodelValid) {
                            filtermodel.end = (filtermodel.end) ? utils.getUTCTimeStampEndDay(filtermodel.end) : '';
                            filtermodel.start = (filtermodel.start) ? utils.getUTCTimeStamp(filtermodel.start) : '';
                        }
                        //setDates(filtermodel);
                        var filterObj = {
                            filters: filtermodel,
                            selectionModel: selectionModel,
                            dateFilter: dateFilter
                        };
                        $modalInstance.close(filterObj);
                    } else {
                        notificationService.error('Invalid date range.');
                    }

                };

                function validateDates(filters, selectedName) {
                    if (angular.isUndefined(filters)) { return true; }

                    if (utils.isNotEmptyVal(selectedName) && (utils.isEmptyVal(filters.start)
                        || utils.isEmptyVal(filters.end))) {
                        return false;
                    }

                    filters.start = moment.unix(filters.start).startOf("day").valueOf();
                    filters.start = moment(filters.start).unix();

                    filters.end = moment.unix(filters.end).endOf("day").valueOf();
                    filters.end = moment(filters.end).unix();

                    var start = moment.unix(filters.start);
                    var end = moment.unix(filters.end);

                    return start.isBefore(end);
                }

                function setDates(filters) {
                    if (angular.isUndefined(filters)) { return; }
                    var toDate = moment.unix(filters.end).endOf('day');
                    toDate = toDate.utc();
                    toDate = toDate.toDate();
                    toDate = new Date(toDate);
                    filters.end = moment(toDate.getTime()).unix();

                    var fromDate = moment.unix(filters.start).startOf('day');
                    fromDate = fromDate.utc();
                    fromDate = fromDate.toDate();
                    fromDate = new Date(fromDate);
                    filters.start = moment(fromDate.getTime()).unix();
                }

                vm.showChildOptions = function (item, list) {
                    var ids = _.pluck(list, 'id');
                    return ids.indexOf(item.id) > -1;
                }

                vm.isOptionChecked = function (option, listname) {
                    var listIds = _.pluck(params.filters[listname], 'id');
                    return listIds.indexOf(option.id) > -1;
                }

                vm.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };

                vm.resetMultiSelectFilter = function () {
                    _.each(vm.selectionModel.multiFilters, function (val, index) {
                        vm.selectionModel.multiFilters[index] = [];
                    });
                    if (vm.viewModel.filter.tag === 'custom dates') {
                        vm.viewModel.filter.start="";
                        vm.viewModel.filter.end="";
                    }
                    
                    _.each(params.filters, function (val, index) {
                        params.filters[index] = [];
                    });
                    vm.viewModel.name = "";
                    if (vm.viewModel !== undefined) {
                        //vm.viewModel.filter.start = '';
                        // vm.viewModel.filter.end = '';
                        vm.viewModel.filter = undefined;
                        //delete vm.viewModel.dateFilters;
                    }
                    var filterObj = {
                        filters: vm.viewModel.filter,
                        selectionModel: vm.selectionModel.multiFilters,
                        dateFilter: ""
                    };
                    // $modalInstance.close(filterObj);
                }

            }]);

    })(angular);