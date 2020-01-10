(function (angular) {

    angular.module('cloudlex.report').controller('AllMatterFilterCtrl', ['$modalInstance',
        'params', 'notification-service', 'contactFactory', '$scope', 'globalConstants', 'matterFactory',
        function ($modalInstance, params, notificationService, contactFactory, $scope, globalConstants, matterFactory) {

            var vm = this;
            var edited = false;
            var typEdited = false;

            vm.getSubstatus = getSubstatus;
            vm.getSubtypes = getSubtypes;
            vm.setVenues = setVenues;
            vm.isStatuArchived = isStatuArchived;
            vm.isStatuActiveMatter = isStatuActiveMatter;
            var subtypesPopulated = false;

            (function () {

                vm.dataModel = {};
                vm.viewModel = {};
                vm.viewModel.userFilter = {};

                vm.selectionModel = {};
                vm.selectionModel.multiFilters = {};
                vm.selectionModel.multiFilters.statuses = [];
                vm.selectionModel.multiFilters.substatus = [];
                vm.selectionModel.multiFilters.categories = [];
                vm.selectionModel.multiFilters.types = [];
                vm.selectionModel.multiFilters.subtypes = [];
                vm.selectionModel.multiFilters.venues = [];
                vm.selectionModel.multiFilters.lawtypes = [];
                //vm.groupjurisdictions = groupjurisdictions;
                vm.isDatesValid = isDatesValid;
                vm.enableArchivedCheck = true;
                vm.enableActiveMatterCheck = false;
                vm.checkVenues = checkVenues;
                vm.selectionModel.multiFilters.jurisdictions = null;//US#7123
                //get selected filter in {id,name} format
                vm.viewModel.masterList = params.masterData;
                vm.jurisdictions = [];
                vm.jurisdictionName = '';
                vm.viewModel.dateFilters = ['Date of incident', 'Intake Date',
                    'Date Created', 'Date Closed', 'Date Settled'];
                vm.tags = params.tags;
                vm.viewModel.includeArchived = params.archival;
                vm.viewModel.activeMatter = params.activeMatterStatus;
                vm.viewModel.timeButtons = [
                    { value: getYearObj(), label: 'last year' },
                    { value: getLast6MnthObj(), label: 'last 6 months' },
                    { value: getAMonthAgoObj(), label: 'last 1 month' },
                    { value: { s: "", e: "", tag: 'custom dates' }, label: 'custom dates' }
                ];
                var selectedFilter = sessionStorage.getItem('matterListReportSelectionModel');
                var checkJurisdiction = JSON.parse(selectedFilter);
                if (checkJurisdiction.multiFilters.jurisdictions != "") {
                    setVenues(checkJurisdiction.multiFilters.jurisdictions);
                }

                vm.checkVenue = false;
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

                function isDatesValid() {
                    if ($('#reportFiltstartDateErr').css("display") == "block" ||
                        $('#reportFiltendDateErr').css("display") == "block") {
                        return true;
                    }
                    else {
                        return false;
                    }
                }

                if (angular.isDefined(params.timeFilters)) {
                    //vm.viewModel.name = "Intake Date";
                    //vm.viewModel.filter = getFilterObj(params.timeFilters).value;

                    vm.viewModel.name = utils.isNotEmptyVal(params.dateFilter) ? params.dateFilter : " ";
                    vm.viewModel.filter = utils.isNotEmptyVal(getFilterObj(params.timeFilters)) ?
                        getFilterObj(params.timeFilters).value : undefined;
                } else {
                    vm.viewModel.name = " ";
                    vm.viewModel.filter = " ";
                }

                if (angular.isDefined(vm.viewModel.filter)) {
                    if (vm.viewModel.filter.tag === 'custom dates') {
                        vm.viewModel.filter.s = params.timeFilters.s;
                        vm.viewModel.filter.e = params.timeFilters.e;
                    }
                }

                //vm.viewModel.filter = angular.isDefined(params.timeFilters) ? getFilterObj(params.timeFilters).value : getYearObj();

                if (angular.isDefined(params.userList)) {
                    _.forEach(params.userList, function (data) {

                        if (angular.isDefined(data.staffonly)) {
                            vm.viewModel.staff = moveBlankToBottom(getFilterValueForUSer(data, 'staffonly'));
                        } else if (angular.isDefined(data.attorny)) {
                            vm.viewModel.leadAttorney = moveBlankToBottom(getFilterValueForUSer(data, 'attorny'));
                            vm.viewModel.attorney = moveBlankToBottom(getFilterValueForUSer(data, 'attorny'));
                        } else if (angular.isDefined(data.paralegal)) {
                            vm.viewModel.paralegal = moveBlankToBottom(getFilterValueForUSer(data, 'paralegal'));
                        }
                    })
                }


                //if (angular.isDefined(params.timeFilters)) {
                //vm.viewModel.name = "Date of incident";
                //  vm.viewModel.filter = utils.isNotEmptyVal(getFilterObj(params.timeFilters)) ?
                //     getFilterObj(params.timeFilters).value : undefined;
                // } else {
                //vm.viewModel.filter = getYearObj();
                //      vm.viewModel.filter = " ";
                //  }

                vm.selectionModel.multiFilters = setFilters();
                vm.selectionModel.multiFilters.venues = vm.selectionModel.multiFilters['venues'][0];

                vm.getSubstatus(vm.selectionModel.multiFilters.statuses);
                vm.viewModel.userFilter = setUserFilter();
                vm.viewModel.statuses = moveBlankToBottom(getFilterValues(params.masterData, 'statuses'));
                removeAllFromStatusFilter(vm.selectionModel.multiFilters.statuses);
                vm.viewModel.type = moveBlankToBottom(getFilterValues(params.masterData, 'type'));
                vm.viewModel.categories = moveBlankToBottom(getFilterValues(params.masterData, 'category'));
                vm.viewModel.name = (utils.isEmptyVal(vm.viewModel.name)) ? undefined : vm.viewModel.name;
                vm.viewModel.lawtypes = moveBlankToBottom(getFilterValues(params.masterData, 'law-types'));
                vm.viewModel.jurisdictions = getFilterValues(params.masterData, 'jurisdictions');


                vm.getSubtypes(vm.selectionModel.multiFilters.types[0]);


                // utils.isNotEmptyVal(vm.selectionModel.multiFilters.types) ?
                //  getSubtypes(vm.selectionModel.multiFilters.types[0]) : angular.noop();

            })();

            //To enable Apply button on selection of venue US#7123
            function checkVenues(data) {
                if (data.id == undefined || utils.isNotEmptyVal(data.id)) {
                    vm.checkVenue = false;
                }
            }

            //US#7123
            function setVenues(jurisdictionId) {

                vm.checkVenue = true;
                vm.selectionModel.multiFilters.venues = undefined;
                if (utils.isEmptyVal(jurisdictionId)) {
                    return;
                }
                //  vm.venue = [];
                var venue = _.filter(params.masterData.venues, function (venue) {
                    return venue.jurisdiction_id === jurisdictionId.id;
                });
                vm.venues = _.sortBy(venue, 'name');
            }
            function getSubstatus(status) {
                if (vm.selectionModel.multiFilters.statuses.length > 0) {
                    var flag = true;
                    _.forEach(vm.selectionModel.multiFilters.statuses, function (item) {
                        if (flag) {
                            if (item.name == 'Closed') {
                                vm.enableArchivedCheck = false;
                                vm.enableActiveMatterCheck = true;
                                vm.viewModel.activeMatter = 0;
                                flag = false;
                            } else {
                                vm.enableArchivedCheck = true;
                                vm.enableActiveMatterCheck = false;
                                vm.viewModel.includeArchived = 0;
                                // vm.viewModel.activeMatter = 0;
                            }
                        }
                    })
                } else {
                    vm.enableArchivedCheck = false;
                    if (vm.viewModel.includeArchived == 1) {
                        vm.enableActiveMatterCheck = true;
                    } else if (vm.viewModel.activeMatter == 1) {
                        vm.enableArchivedCheck = true;
                    }
                    else {
                        vm.enableActiveMatterCheck = false;
                    }

                }
                var selectedStatusIds = _.pluck(vm.selectionModel.multiFilters.statuses, "id");
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

                var statuses = params.masterData.statuses;
                //get selected statuses substatus
                var selectedStatus = [];
                _.forEach(status, function (item) {
                    _.forEach(statuses, function (currentItem) {
                        if (item.id == currentItem.id) {
                            _.forEach(currentItem["sub-status"], function (currentI) {
                                currentI.statusname = currentItem.name;
                                currentI.statusid = currentItem.id
                                selectedStatus.push(currentI);
                            })
                        }
                    })
                });
                vm.substatuses =moveBlankToBottom(selectedStatus);
                edited = true;
            }

            function isStatuArchived(event) {
                if (event.currentTarget.checked == true) {
                    vm.enableActiveMatterCheck = true;
                    vm.viewModel.activeMatter = 0;
                } else {
                    vm.enableActiveMatterCheck = false;

                }
                _.forEach(vm.selectionModel.multiFilters.statuses, function (item) {
                    if (item.name == 'Closed') {
                        vm.enableActiveMatterCheck = true;
                        vm.viewModel.activeMatter = 0;
                    }
                })

            }

            function isStatuActiveMatter(event) {
                if (event.currentTarget.checked == true) {
                    vm.enableArchivedCheck = true;
                    vm.viewModel.includeArchived = 0;
                } else {
                    vm.enableArchivedCheck = false;
                }
                _.forEach(vm.selectionModel.multiFilters.statuses, function (item) {
                    if (item.name != 'Closed') {
                        vm.enableArchivedCheck = true;
                        vm.viewModel.includeArchived = 0;
                    }
                })
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

                // if ((type.name != "Closed" && vm.viewModel.name == "Date Closed") || (type.name != "Settled" && vm.viewModel.name == "Date Settled")) {
                //     vm.viewModel.name = "";
                //     vm.viewModel.filter = "";
                // }

                var typees = params.masterData.type;
                var selectedtype = _.find(typees, function (st) {
                    return st.id === type.id
                });
                selectedtype['sub-type'] = _.sortBy(selectedtype['sub-type'], "name");
                vm.subtypes =moveBlankToBottom(selectedtype['sub-type']);
                typEdited = true;
            }

            function getFilterObj(filterObj) {
                return _.find(vm.viewModel.timeButtons, function (btn) {
                    return _.isEqual(filterObj.tag, btn.value.tag);
                })
            }

            function getYearObj() {
                var start = moment().subtract(1, 'year').startOf('day').utc().unix();
                var end =  utils.getUTCTimeStampEndDay(new Date());
                start = getFormatteddate(start);
                end = getFormatteddate(end);
                return { s: start, e: end, tag: 'A Year Ago' };
            }



            function getFormatteddate(epoch) {
                var formdate = new Date(epoch * 1000);
                moment(formdate).utc().format('MM/DD/YYYY');
                return formdate;
            }

            function getLast6MnthObj() {
                var start = moment().subtract(6, 'months').startOf('day').utc().unix();
                var end =  utils.getUTCTimeStampEnd(new Date());
                start = getFormatteddate(start);
                end = getFormatteddate(end);
                return { s: start, e: end, tag: 'last 6 months' };
            }

            function getAMonthAgoObj() {
                var start = moment().subtract(1, 'months').startOf('day').utc().unix();
                var end = utils.getUTCTimeStampEnd(new Date());
                start = getFormatteddate(start);
                end = getFormatteddate(end);
                return { s: start, e: end, tag: 'last 1 months' };
            }

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
                    vm.selectionModel.multiFilters.statuses = [{ id: "8", name: "Closed" }];
                    vm.getSubstatus(vm.selectionModel.multiFilters.statuses);
                    vm.selectionModel.multiFilters.substatus = [];
                }
                else if (filter == "Date Settled") {
                    vm.selectionModel.multiFilters.statuses = [{ id: "6", name: "Settled" }];
                    vm.getSubstatus(vm.selectionModel.multiFilters.statuses);
                    vm.selectionModel.multiFilters.substatus = [];
                }
                else {
                    if (vm.selectionModel.multiFilters.statuses[0] != undefined) {
                        if (vm.selectionModel.multiFilters.statuses[0].name == "Closed") {
                            vm.selectionModel.multiFilters.statuses = [];
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
                    var start = utils.getUTCTimeStamp(new Date(vm.viewModel.filter.s));
                    var end = utils.getUTCTimeStamp(new Date(vm.viewModel.filter.e));

                    if (vm.viewModel.filter.tag === 'custom dates') {
                        vm.viewModel.filter.s = utils.isNotEmptyVal(vm.viewModel.filter.s) ? getFormatteddate(start, "MM/DD/YYY") : "";
                        vm.viewModel.filter.e = utils.isNotEmptyVal(vm.viewModel.filter.e) ? getFormatteddate(end, "MM/DD/YYYY") : "";
                    }

                }
                initialized = true;
            };

            vm.openCalender = function ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            };

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
                        _.forEach(data, function (contact) {
                            contact.name = utils.removeunwantedHTML(contact.first_name) + ' ' + utils.removeunwantedHTML(contact.last_name);
                        });
                        return data;
                    });
            };

            vm.formatTypeaheadDisplay = contactFactory.formatTypeaheadDisplay;

            $scope.$watch(function () {
                if (vm.viewModel.filter && utils.isNotEmptyVal(vm.viewModel.filter) || utils.isNotEmptyVal(vm.viewModel.name) || (vm.viewModel.filter && utils.isNotEmptyVal(vm.viewModel.filter.s)) || (vm.viewModel.filter && utils.isNotEmptyVal(vm.viewModel.filter.e)) ||
                    vm.selectionModel.multiFilters.statuses.length > 0 || vm.selectionModel.multiFilters.types.length > 0 || (vm.viewModel.includeArchived == 1) || (vm.viewModel.activeMatter == 1) ||
                    vm.selectionModel.multiFilters.categories.length > 0 || (vm.selectionModel.multiFilters.lawtypes && vm.selectionModel.multiFilters.lawtypes.length > 0) ||
                    utils.isNotEmptyVal(vm.selectionModel.multiFilters.jurisdictions) || utils.isNotEmptyVal(vm.selectionModel.multiFilters.venues) ||
                    utils.isNotEmptyVal(vm.viewModel.userFilter.leadAttorney) || utils.isNotEmptyVal(vm.viewModel.userFilter.attorney) || utils.isNotEmptyVal(vm.viewModel.userFilter.staff) ||
                    utils.isNotEmptyVal(vm.viewModel.userFilter.paralegal) || utils.isNotEmptyVal(vm.viewModel.userFilter.referToFilterId) ||
                    utils.isNotEmptyVal(vm.viewModel.userFilter.referByFilterId) || vm.tags.length > 0) {
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
                var filtercopy = angular.copy(vm.viewModel.filter);
                if (utils.isNotEmptyVal(vm.viewModel.filter)) {
                    filtercopy.s = (filtercopy.s) ? utils.getUTCTimeStamp(filtercopy.s) : '';
                    filtercopy.e = (filtercopy.e) ? utils.getUTCTimeStampEndDay(filtercopy.e) : '';
                }
                var isDateRangeValid = getUTCDates(filtercopy);

                if (isDateRangeValid) {
                    getUserDetail(vm.viewModel.userFilter);
                    //if (utils.isNotEmptyVal(filtercopy)) { filtercopy.e = selecteddate(filtercopy.e) };
                    var filterObj = {
                        filters: filtercopy,
                        selectionModel: selectionModel,
                        userFilter: vm.viewModel.userFilter,
                        dateFilter: vm.viewModel.name,
                        archival: vm.viewModel.includeArchived,
                        activeMatterStatus: vm.viewModel.activeMatter
                    };
                    if ((filterObj.userFilter.referToFilterId) != null && typeof (filterObj.userFilter.referToFilterId) == "string" && filterObj.userFilter.referToFilterId != "") {
                        notificationService.error("Invalid Referred To Selected.")
                        filterObj.userFilter.referToFilterId = null;
                        return;
                    }
                    if ((filterObj.userFilter.referByFilterId) != null && typeof (filterObj.userFilter.referByFilterId) == "string" && filterObj.userFilter.referByFilterId != "") {
                        notificationService.error("Invalid Referred By Selected.")
                        filterObj.userFilter.referByFilterId = null;
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
                    formdate = moment(formdate).utc().format('MM/DD/YYYY');

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

                    var startDate = moment.unix(filters.s).startOf('day');
                    var fromDate = angular.copy(startDate).utc();
                    fromDate = fromDate.toDate();
                    fromDate = new Date(fromDate);

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

                if (!angular.isUndefined(vm.viewModel.filter) && vm.viewModel.filter.tag === 'custom dates') {
                    vm.viewModel.filter.s="";
                    vm.viewModel.filter.e="";
                }
                vm.venues = '';
                _.each(vm.selectionModel.multiFilters, function (val, index) {
                    vm.selectionModel.multiFilters[index] = vm.selectionModel.multiFilters[index] instanceof Array ? [] : null;
                });
                vm.substatuses = [];
                _.each(params.filters, function (val, index) {
                    params.filters[index] = [];
                });

                _.each(params.userFilter, function (val, index) {
                    vm.viewModel.userFilter.paralegal = '';
                    vm.viewModel.userFilter.leadAttorney = '';
                    vm.viewModel.userFilter.attorney = '';
                    vm.viewModel.userFilter.staff = '';
                    vm.viewModel.userFilter = {};
                });
                vm.viewModel.includeArchived = 0;
                vm.viewModel.activeMatter = 0;
                vm.viewModel.name = undefined;
                vm.viewModel.filter = undefined;
                vm.enableArchivedCheck = false;
                vm.enableActiveMatterCheck = false;
                vm.subtypes = [];


            }

        }]);

})(angular);
