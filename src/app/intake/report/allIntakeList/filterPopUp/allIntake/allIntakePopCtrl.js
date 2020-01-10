(function (angular) {

    angular.module('intake.report').controller('AllIntakeFilterCtrl', ['$modalInstance',
        'params', 'matterFactory', 'notification-service', 'contactFactory', '$scope', 'globalConstants', 'intakeNotesDataService',
        function ($modalInstance, params, matterFactory, notificationService, contactFactory, $scope, globalConstants, intakeNotesDataService) {

            var vm = this;
            var edited = false;
            var typEdited = false;

            vm.getSubstatus = getSubstatus;
            vm.getSubtypes = getSubtypes;
            vm.searchMatters = searchMatters;
            // vm.setVenues = setVenues;
            var subtypesPopulated = false;

            (function () {

                vm.dataModel = {};
                vm.viewModel = {};
                vm.viewModel.userFilter = {};

                vm.selectionModel = {};
                vm.selectionModel.multiFilters = {};
                vm.selectionModel.multiFilters.status = [];
                vm.selectionModel.multiFilters.substatus = [];
                vm.selectionModel.multiFilters.types = [];
                vm.selectionModel.multiFilters.subtypes = [];
                //     vm.selectionModel.multiFilters.venues = [];
                vm.selectionModel.multiFilters.lawtypes = [];


                //vm.checkVenues = checkVenues;
                vm.selectionModel.multiFilters.jurisdictions = null;//US#7123
                //get selected filter in {id,name} format
                vm.viewModel.masterList = params.masterData;
                vm.jurisdictions = [];
                vm.jurisdictionName = '';
                vm.viewModel.dateFilters = ['Date of incident', 'Date Created'];
                vm.tags = params.tags;
                vm.viewModel.timeButtons = [
                    { value: getYearObj(), label: 'last year' },
                    { value: getLast6MnthObj(), label: 'last 6 months' },
                    { value: getAMonthAgoObj(), label: 'last 1 month' },
                    { value: { s: "", e: "", tag: 'custom dates' }, label: 'custom dates' }
                ];
                var selectedFilter = sessionStorage.getItem('intakeListReportSelectionModel');
                var checkJurisdiction = JSON.parse(selectedFilter);
                // if (checkJurisdiction.multiFilters.jurisdictions != "") {
                //     setVenues(checkJurisdiction.multiFilters.jurisdictions);
                // }

                // vm.checkVenue = false;
                // _.forEach(params.masterData.jurisdictions, function (jurisdiction) {
                //     vm.jurisdictions.push(jurisdiction.name);
                // })
                // vm.jurisdictions = vm.jurisdictions.sort();

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
                    vm.viewModel.name = utils.isNotEmptyVal(params.dateFilter) ? params.dateFilter : " ";
                    vm.viewModel.filter = utils.isNotEmptyVal(getFilterObj(params.timeFilters)) ?
                        getFilterObj(params.timeFilters).value : undefined;
                } else {
                    vm.viewModel.name = " ";
                     vm.viewModel.filter = " ";
                }

                if (angular.isDefined(vm.viewModel.filter)) {
                    vm.viewModel.includeMigrated = utils.isNotEmptyVal(params.filters.is_migrated) ? params.filters.is_migrated : 0 ;
                    if (vm.viewModel.filter.tag === 'custom dates') {
                        vm.viewModel.filter.s = params.timeFilters.s;
                        vm.viewModel.filter.e = params.timeFilters.e;
                    }
                }

                //vm.viewModel.filter = angular.isDefined(params.timeFilters) ? getFilterObj(params.timeFilters).value : getYearObj();

                vm.selectionModel.multiFilters = setFilters();

                vm.viewModel.userFilter = setUserFilter();
                vm.getSubstatus(vm.selectionModel.multiFilters.status);
                vm.viewModel.status = getFilterValues(params.masterData, 'status');
                removeAllFromStatusFilter(vm.selectionModel.multiFilters.status);
                vm.viewModel.type = getFilterValues(params.masterData, 'type');
                vm.viewModel.name = (utils.isEmptyVal(vm.viewModel.name)) ? undefined : vm.viewModel.name;
                // vm.viewModel.filter = undefined;

                vm.getSubtypes(vm.selectionModel.multiFilters.types[0]);
                vm.checkboxChangedFlag = 0;

            })();

            //To enable Apply button on selection of venue US#7123
            // function checkVenues(data) {
            //     if (data.id == undefined || utils.isNotEmptyVal(data.id)) {
            //         vm.checkVenue = false;
            //     }
            // }

            //US#7123
            // function setVenues(jurisdictionId) {

            //     vm.checkVenue = true;
            //     vm.selectionModel.multiFilters.venues = undefined;
            //     if (utils.isEmptyVal(jurisdictionId)) {
            //         return;
            //     }
            //     //  vm.venue = [];
            //     var venue = _.filter(params.masterData.venues, function (venue) {
            //         return venue.jurisdiction_id === jurisdictionId.id;
            //     });
            //     vm.venues = _.sortBy(venue, 'name');
            // }
            function getSubstatus(status) {

                var selectedStatusIds = _.pluck(vm.selectionModel.multiFilters.status, "id");
                if (selectedStatusIds && selectedStatusIds.length > 0) {
                    vm.selectionModel.multiFilters.substatus = _.filter(vm.selectionModel.multiFilters.substatus, function (rec) { return _.indexOf(selectedStatusIds, rec.statusid) > -1 });
                } else {
                    vm.selectionModel.multiFilters.substatus = [];
                }

                if (utils.isEmptyVal(status)) {
                    vm.substatuses = [];
                    return;
                }

                if ((status[0].name != "Closed" && vm.viewModel.name == "Date Closed") || (status[0].name != "Settled" && vm.viewModel.name == "Date Settled")) {
                    vm.viewModel.name = "";
                    vm.viewModel.filter = "";
                }

                var statuses = params.masterData.status;
                //get selected statuses substatus
                var selectedStatus = [];
                _.forEach(status, function (item) {
                    _.forEach(statuses, function (currentItem) {
                        var aaray1 = [];
                        if (item.id == currentItem.id) {
                            var lastIndex = currentItem["substatus"].length - 1;
                            _.forEach(currentItem["substatus"], function (currentI, index) {
                                currentI.statusname = currentItem.name;
                                currentI.statusid = currentItem.id
                                //Bug#12986
                                aaray1.push(currentI);
                                if (lastIndex == index) {
                                    aaray1.unshift({
                                        id: 0,
                                        name: "",
                                        statusid: currentItem.id,
                                        statusname: currentItem.name
                                    });
                                }
                            });
                        }
                        selectedStatus = selectedStatus.concat(aaray1);
                    })
                })
                vm.substatuses = selectedStatus;
                edited = true;
            }

            function getSubtypes(type) {
                //clear selected filters

                //ignore first time
                if (typEdited) {
                    vm.selectionModel.multiFilters.subtypes = [];
                }

                if (utils.isEmptyVal(type)) {
                    return;
                }

                var typees = params.masterData.type;
                var selectedtype = _.find(typees, function (st) {
                    return st.id === type.id
                });
                selectedtype['subtype'] = _.sortBy(selectedtype['subtype'], "name");
                vm.subtypes = selectedtype['subtype'];
                typEdited = true;
            }

            $scope.openCalendar = function ($event) {
                $event.stopPropagation();
            }

            function getFilterObj(filterObj) {
                return _.find(vm.viewModel.timeButtons, function (btn) {
                    return _.isEqual(filterObj.tag, btn.value.tag);
                })
            }

            function searchMatters(contactName, searchItem) {
                return intakeNotesDataService.getMatterList(contactName, 0)
                    .then(function (response) {
                        var data = response;
                        _.forEach(data, function (contact) {
                            contact.name = contact.intakeName;
                        });
                        return data;
                    });
            }

            vm.getContacts = function (contactName) {
                var postObj = {};
                postObj.type = globalConstants.allTypeListWithoutCourt;

                postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
                //postObj = matterFactory.setContactType(postObj);
                postObj.page_Size = 250

                return matterFactory.getContactsByName(postObj, true)
                    .then(function (response) {
                        var data = response.data;
                        contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
                        contactFactory.setNamePropForContactsOffDrupal(data);
                        return data;
                    });
            };

            function getYearObj() {
                var start = moment().subtract(1, 'year').unix();
                var end = (vm.viewModel.name == "Date of incident" || vm.viewModel.name == "Intake Date" || vm.viewModel.name == "Date Closed" || vm.viewModel.name == "Date Settled") ? utils.getUTCTimeStampEnd(new Date()) : moment(new Date()).unix();
                start = getFormatteddate(start);
                end = getFormatteddate(end);
                return { s: start, e: end, tag: 'A Year Ago' };
            }



            function getFormatteddate(epoch) {
                var formdate = new Date(epoch * 1000);
                (vm.viewModel.name == "Date of incident" || vm.viewModel.name == "Intake Date" || vm.viewModel.name == "Date Closed" || vm.viewModel.name == "Date Settled") ? formdate = moment(formdate).utc().format('MM/DD/YYYY') : formdate = moment(formdate).format('MM/DD/YYYY');
                return formdate;
            }

            function getLast6MnthObj() {
                var start = moment().subtract(6, 'months').unix();
                var end = (vm.viewModel.name == "Date of incident" || vm.viewModel.name == "Intake Date" || vm.viewModel.name == "Date Closed" || vm.viewModel.name == "Date Settled") ? utils.getUTCTimeStampEnd(new Date()) : moment(new Date()).unix();
                start = getFormatteddate(start);
                end = getFormatteddate(end);
                return { s: start, e: end, tag: 'last 6 months' };
            }

            function getAMonthAgoObj() {
                var start = moment().subtract(1, 'months').unix();
                var end = (vm.viewModel.name == "Date of incident" || vm.viewModel.name == "Intake Date" || vm.viewModel.name == "Date Closed" || vm.viewModel.name == "Date Settled") ? utils.getUTCTimeStampEnd(new Date()) : moment(new Date()).unix()
                start = getFormatteddate(start);
                end = getFormatteddate(end);
                return { s: start, e: end, tag: 'last 1 months' };
            }

            function removeAllFromStatusFilter(status) {
                var allStatus = _.find(status, function (status) {
                    return status.id === 'all';
                });

                if (angular.isDefined(allStatus)) {
                    var ids = _.pluck(status, 'id');
                    var index = ids.indexOf(allStatus.id);
                    status.splice(index, 1);
                }
            }

            function moveBlankToBottom(array) {
                //     //make sure array has {id,name} objects
                var values = _.pluck(array, 'name');
                var index = values.indexOf('');
                utils.moveArrayElement(array, index, array.length - 1);
                return angular.copy(array);
            }

            function setFilters() {
                var filters = angular.copy(params.filters);
                angular.forEach(filters, function (filterVal, filter) {
                    if (filter instanceof Array) {
                        filters[filter] = filterVal.map(function (item) {
                            return {
                                id: item.id,
                                name: angular.isUndefined(item.name) ? item.desc : item.name
                            }
                        });
                    }
                });
                return filters;
            }

            function setUserFilter() {
                var filters = angular.copy(params.userFilter);
                return filters;
            }

            function getFilterValues(masterList, filter) {

                if (utils.isEmptyVal(masterList[filter])) {
                    return;
                }

                return masterList[filter].map(function (item) {
                    return {
                        id: item.id,
                        name: item.name
                    };
                });
            }

            function getFilterValueForUSer(dataList, filter) {
                return dataList[filter].map(function (item) {
                    return {
                        id: item.uid,
                        name: item.name
                    };
                });
            }

            vm.setDateRange = function (filter) {
                if (filter !== "Date Closed" && filter !== "Date Settled") {
                }
                else if (filter == "Date Closed") {
                    vm.selectionModel.multiFilters.status = [{ id: "8", name: "Closed" }];
                    vm.getSubstatus(vm.selectionModel.multiFilters.status);
                    vm.selectionModel.multiFilters.substatus = [];
                }
                else if (filter == "Date Settled") {
                    vm.selectionModel.multiFilters.status = [{ id: "6", name: "Settled" }];
                    vm.getSubstatus(vm.selectionModel.multiFilters.status);
                    vm.selectionModel.multiFilters.substatus = [];
                }
                else {
                    if (vm.selectionModel.multiFilters.status[0] != undefined) {
                        if (vm.selectionModel.multiFilters.status[0].name == "Closed") {
                            vm.selectionModel.multiFilters.status = [];
                            vm.substatuses = [];
                        }
                    }
                }

                if (utils.isEmptyVal(filter)) {
                    vm.viewModel.filter = undefined;
                } else {
                    vm.viewModel.filter = {}
                    vm.viewModel.filter = getYearObj();
                }
                vm.viewModel.name = filter; //Bug#11220
            }

            var initialized = true;
            vm.changeFilterType = function () {
                //ignore first on change event
                if (initialized) {
                    vm.viewModel.name = utils.isEmptyVal(vm.viewModel.name) ? 'Date of incident' : vm.viewModel.name;
                    if (vm.viewModel.name == "Date of incident" || vm.viewModel.name == "Intake Date" || vm.viewModel.name == "Date Closed" || vm.viewModel.name == "Date Settled") {
                        var start = vm.viewModel.filter.s;
                        var end = vm.viewModel.filter.e;
                    } else {
                        var start = vm.viewModel.filter.s;
                        var end = vm.viewModel.filter.e;
                    }

                    if (vm.viewModel.filter.tag === 'custom dates') {
                        vm.viewModel.filter.s = utils.isNotEmptyVal(vm.viewModel.filter.s) ? moment(start).format('MM/DD/YYYY') : "";
                        vm.viewModel.filter.e = utils.isNotEmptyVal(vm.viewModel.filter.e) ? moment(end).format('MM/DD/YYYY') : "";
                    }

                }
                initialized = true;
            };

            vm.openCalender = function ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            };



            vm.formatTypeaheadDisplay = contactFactory.formatTypeaheadDisplay;

            $scope.$watch(function () {
                if (vm.viewModel.filter && utils.isNotEmptyVal(vm.viewModel.filter) || (vm.viewModel.filter && utils.isNotEmptyVal(vm.viewModel.filter.s)) || (vm.viewModel.filter && utils.isNotEmptyVal(vm.viewModel.filter.e)) ||
                    vm.selectionModel.multiFilters.status.length > 0 || vm.selectionModel.multiFilters.types.length > 0 ||
                    utils.isNotEmptyVal(vm.viewModel.userFilter.referebyFilter) || utils.isNotEmptyVal(vm.viewModel.userFilter.referetoFilter) || utils.isNotEmptyVal(vm.viewModel.userFilter.campaign) || utils.isNotEmptyVal(vm.viewModel.userFilter.leadNameFilter) || vm.tags.length > 0 || (vm.checkboxChangedFlag)) {
                    vm.enableApply = false;
                } else {
                    vm.enableApply = true;
                }
            })

            vm.ok = function (selectionModel) {
                _.forEach(selectionModel.subtypes, function (data) {
                    if (utils.isEmptyVal(data.name)) {
                        data.name = "{Blank}";
                    }
                });
                _.forEach(selectionModel.substatus, function (data) {
                    if (utils.isEmptyVal(data.name)) {
                        data.name = "{Blank}";
                    }
                });
                selectionModel.is_migrated = vm.viewModel.includeMigrated;
                var filtercopy = angular.copy(vm.viewModel.filter);
                if (utils.isNotEmptyVal(vm.viewModel.filter)) {
                    if (vm.viewModel.name == "Date of incident") {
                        filtercopy.s = (filtercopy.s) ? utils.getUTCTimeStamp(filtercopy.s) : '';
                        filtercopy.e = (filtercopy.e) ? utils.getUTCTimeStampEnd(filtercopy.e) : '';
                    }
                    if (vm.viewModel.name == "Date Created") {
                        filtercopy.s = (filtercopy.s) ? moment(filtercopy.s).startOf("day").unix() : '';
                        filtercopy.e = (filtercopy.e) ? moment(filtercopy.e).endOf("day").unix() : '';
                    }
                }
                var isDateRangeValid = getUTCDates(filtercopy);

                if (isDateRangeValid) {
                    getUserDetail(vm.viewModel.userFilter);
                    //if (utils.isNotEmptyVal(filtercopy)) { filtercopy.e = selecteddate(filtercopy.e) };
                    var filterObj = {
                        filters: filtercopy,
                        selectionModel: selectionModel,
                        userFilter: vm.viewModel.userFilter,
                        dateFilter: vm.viewModel.name
                    };
                    if ((filterObj.userFilter.referetoFilter) != null && (filterObj.userFilter.referetoFilter) != "" && typeof (filterObj.userFilter.referetoFilter) == "string") {
                        notificationService.error("Invalid Referred To Selected.")
                        filterObj.userFilter.referetoFilter = null;
                        return;
                    }
                    if ((filterObj.userFilter.referebyFilter) != null && (filterObj.userFilter.referebyFilter) != "" && typeof (filterObj.userFilter.referebyFilter) == "string") {
                        notificationService.error("Invalid Referred By Selected.")
                        filterObj.userFilter.referebyFilter = null;
                        return;
                    }
                    if ((filterObj.userFilter.leadNameFilter) != null && (filterObj.userFilter.leadNameFilter) != "" && typeof (filterObj.userFilter.leadNameFilter) == "string") {
                        notificationService.error("Invalid Lead Name Selected.")
                        filterObj.userFilter.leadNameFilter = null;
                        return;
                    }
                    $modalInstance.close(filterObj);
                } else {
                    notificationService.error("Invalid date range.")
                }
            };

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

            function getFormatteddate(epoch) {
                var formdate = new Date(epoch * 1000);
                if (vm.viewModel.name == "Date of incident" || vm.viewModel.name == "Intake Date" || vm.viewModel.name == "Date Closed" || vm.viewModel.name == "Date Settled") {
                    formdate = moment(formdate).utc().format('MM/DD/YYYY');
                } else {
                    formdate = moment(formdate).format('MM/DD/YYYY');
                }

                return formdate;
            }

            function getUTCDates(filters) {
                if (utils.isNotEmptyVal(filters)) {
                    if ((utils.isEmptyVal(filters.e) && utils.isNotEmptyVal(filters.s)) ||
                        (utils.isEmptyVal(filters.s) && utils.isNotEmptyVal(filters.e))) {
                        return false;
                    }

                    if (utils.isEmptyVal(filters.e) && utils.isEmptyVal(filters.s) && utils.isNotEmptyVal(filters.tag)) {
                        return false;
                    }

                    var endDate = moment.unix(filters.e).endOf('day');
                    var toDate = angular.copy(endDate).utc();
                    toDate = toDate.toDate();
                    toDate = new Date(toDate);

                    (vm.viewModel.name == "Date of incident" || vm.viewModel.name == "Intake Date" || vm.viewModel.name == "Date Closed" || vm.viewModel.name == "Date Settled") ? "" : filters.e = moment(toDate.getTime()).unix();

                    var startDate = moment.unix(filters.s).startOf('day');
                    var fromDate = angular.copy(startDate).utc();
                    fromDate = fromDate.toDate();
                    fromDate = new Date(fromDate);

                    (vm.viewModel.name == "Date of incident" || vm.viewModel.name == "Intake Date" || vm.viewModel.name == "Date Closed" || vm.viewModel.name == "Date Settled") ? "" : filters.s = moment(fromDate.getTime()).unix();

                    if (endDate.isBefore(startDate)) {
                        return false;
                    }
                }

                return true;
            }

            function getUserDetail(filters) {
                if (angular.isDefined(filters.leadAttorney)) {
                    filters.leadAttorney = filters.leadAttorney.id;
                }
                if (angular.isDefined(filters.attorney)) {
                    filters.attorney = filters.attorney.id;
                }
                if (angular.isDefined(filters.paralegal)) {
                    filters.paralegal = filters.paralegal.id;
                }
                if (angular.isDefined(filters.staff)) {
                    filters.staff = filters.staff.id;
                }
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
                vm.checkVenue = false;
                //Bug#8316 added this
                vm.venues = '';
                _.each(vm.selectionModel.multiFilters, function (val, index) {
                    vm.selectionModel.multiFilters[index] = vm.selectionModel.multiFilters[index] instanceof Array ? [] : null;
                });
                if (!angular.isUndefined(vm.viewModel.filter) && vm.viewModel.filter.tag === 'custom dates') {
                    vm.viewModel.filter.s = "";
                    vm.viewModel.filter.e = "";
                }
                vm.viewModel.userFilter = {};
                vm.substatuses = [];
                _.each(params.filters, function (val, index) {
                    params.filters[index] = [];
                });
                vm.viewModel.name = undefined;
                vm.viewModel.filter = undefined;
                vm.subtypes = [];
                vm.viewModel.includeMigrated = 0;
            }
            vm.checkboxChanged = function(){
                vm.checkboxChangedFlag = 1;
            }

        }]);

})(angular);
