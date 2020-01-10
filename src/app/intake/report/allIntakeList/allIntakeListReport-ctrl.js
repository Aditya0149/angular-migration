(function () {
    'use strict';

    angular.module('intake.report').controller('AllIntakeListReportCtrl', ['$q', 'intakeReportFactory', '$state', '$modal', 'masterData',
        'allIntakeListReportHelper',
        function ($q, intakeReportFactory, $state, $modal, masterData,
            allIntakeListReportHelper) {

            var self = this;
            var initMatterLimit = 15;
            var intakeList = [];
            var allDisplayStatuses = {};
            //pageNumber
            self.pageNumber = 1;
            //init clicked row index
            self.clickedRow = -1;
            self.matterInTookByDateFlag = true;
            self.dateFieldValue = 3;
            self.displayMoreButton = true;
            self.displayALlButton = true;
            self.resetAllFilter = resetAllFilter;
            self.scrollReachedBottom = scrollReachedBottom;
            self.scrollReachedTop = scrollReachedTop;
            //self.showPager = true;
            var masterDataObj = masterData.getMasterData();
            //initialization start

            self.sorts = [{ order: 'ASC', param: "lead_name_asc", name: 'Lead Name ASC', value: 'intake_name' },
            { order: 'DESC', param: "lead_name_desc", name: 'Lead Name DESC ', value: 'intake_name DESC' },
            { order: 'ASC', param: "doi_asc", name: 'DOI ASC', value: 'accident_date' },
            { order: 'DESC', param: "doi_desc", name: 'DOI DESC ', value: 'accident_date DESC' },
            { order: 'ASC', param: "date_created_asc", name: 'Date Created ASC', value: 'created_date' },
            { order: 'DESC', param: "date_created_desc", name: 'Date Created DESC', value: 'created_date DESC' },

            ];

            var timeFilters = ['A Year Ago', 'last 6 months', 'last 1 months', 'custom dates'];
            self.selectedSort = 'Lead name ASC';

            self.init = function () {
                self.tags = [];

                self.matterLimit = initMatterLimit;
                var selectionModel = sessionStorage.getItem("intakeListReportSelectionModel");
                var viewModel = sessionStorage.getItem("intakeListReportViewModel");
                //apply stored filters
                if (utils.isNotEmptyVal(selectionModel) || utils.isNotEmptyVal(viewModel)) {
                    try {
                        self.selectionModel = JSON.parse(selectionModel);
                        self.viewModel = {};
                        self.viewModel = JSON.parse(viewModel);
                        self.viewModel.allIntake = [];
                        self.selectedSort = _.find(self.sorts, function (sort) {
                            return sort.value == self.viewModel.filters.sortby;
                        }).name;

                        self.tags = allIntakeListReportHelper
                            .createFilterTags(self.viewModel.filters, self.viewModel.masterList, self.viewModel.userFilter, null, self.viewModel.dateFilter);
                        applySetFilters();
                    } catch (e) {
                        initModels();
                        applySetFilters();
                    }
                } else {
                    initModels();
                    applySetFilters();
                }
            }

            function scrollReachedBottom() {
                self.matterLimit = self.matterLimit + initMatterLimit;
            }

            function scrollReachedTop() {
                self.matterLimit = initMatterLimit;
            }

            function persistFilters(filters) {
                var selectionModel = angular.copy(self.selectionModel);
                var viewModel = angular.copy(filters);
                viewModel.allIntake = [];
                sessionStorage.setItem("intakeListReportSelectionModel", JSON.stringify(selectionModel));
                sessionStorage.setItem("intakeListReportViewModel", JSON.stringify(viewModel));
            }

            function applySetFilters() {
                getData();
                //display object for managing the display
                self.display = {
                    filtered: true,
                    matterListReceived: false,
                    matterSelected: {}
                };
                self.clxGridOptions = {
                    headers: allIntakeListReportHelper.getGridHeaders(),
                    selectedItems: []
                };
            }

            function initModels() {
                initViewModel();
                initSelectionModel();
            };

            function initViewModel() {
                self.viewModel = {
                    masterList: [],
                    userList: [],
                    statusWiseCounts: [],
                    statusWiseCountsMotion: [],
                    statusWiseCountsAll: []
                };

                self.viewModel.page = "GRIDVIEW";
                self.viewModel.allIntake = [];
                self.viewModel.dateFilter = '';
                self.viewModel.userFilter = {
                    leadAttorney: '',
                    attorney: '',
                    staff: '',
                    paralegal: ''
                };

                self.viewModel.filters = {
                    filterText: '',
                    useExternalFilter: true,
                    s: '',
                    e: '',
                    sortby: "intake_name",
                    from: 'report',
                    tz: utils.getTimezone()
                };
            };

            function initSelectionModel() {
                self.selectionModel = {
                    statusName: "Ongoing",
                    statusWise: {},
                    allMatter: 1,
                    multiFilters: {
                        types: [],
                        status: [],
                        substatus: [],
                        subtypes: [],
                    }
                };
            }

            function getData() {

                // self.getIntakeList();
                // self.getMasterList();
                var promise = self.getMasterList();
                $q.all([promise]).then(function (val) {
                    if (val) {
                        self.getIntakeList();
                    }
                })
            }
            //initialization end

            function resetAllFilter() {
                self.tags = [];
                self.viewModel.dateFilter = '';
                self.viewModel.userFilter.referebyFilter = '';
                self.viewModel.userFilter.referetoFilter = '';
                self.viewModel.userFilter.leadNameFilter = '';
                self.viewModel.filters.s = '';
                self.viewModel.filters.e = '';
                self.viewModel.filters.tag = '';
                self.selectionModel.multiFilters.status = [];
                self.selectionModel.multiFilters.types = [];
                self.selectionModel.multiFilters.substatus = [],
                    self.selectionModel.multiFilters.subtypes = [];
                self.displayMoreButton = true;
                self.displayALlButton = true;
                self.viewModel.filters.campaign = '';
                self.viewModel.userFilter.campaign = '';
                //reset the matter limit
                self.matterLimit = initMatterLimit;
                self.viewModel.includeMigrated = 0;
                self.selectionModel.multiFilters.is_migrated = 0;
                self.viewModel.filters.is_migrated = 0;
                self.getIntakeList();
                //self.showPager = true;
            }

            self.filterAllIntakeReport = function () {
                var timeFilterObj;
                var filtercopy = angular.copy(self.viewModel.filters);
                if (self.viewModel.dateFilter == "Date of incident") {
                    filtercopy.s = (filtercopy.s) ? moment.unix(filtercopy.s).utc().format('MM/DD/YYYY') : '';
                    filtercopy.e = (filtercopy.e) ? moment.unix(filtercopy.e).utc().format('MM/DD/YYYY') : '';
                }
                if (self.viewModel.dateFilter == "Date Created") {
                    filtercopy.s = (filtercopy.s) ? moment.unix(filtercopy.s).format('MM/DD/YYYY') : '';
                    filtercopy.e = (filtercopy.e) ? moment.unix(filtercopy.e).format('MM/DD/YYYY') : '';
                }
                if (angular.isDefined(filtercopy.tag)) {
                    timeFilterObj = {
                        tag: filtercopy.tag,
                        e: filtercopy.e,
                        s: filtercopy.s
                    };
                }

                var userFilterObj = {};
                setUserFilterForFilter(userFilterObj);
                var modalInstance = $modal.open({
                    templateUrl: 'app/intake/report/allIntakeList/filterPopUp/allIntake/allIntakePopup.html',
                    controller: 'AllIntakeFilterCtrl as intakeFilter',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        params: function () {
                            return {
                                masterData: self.viewModel.masterList,
                                filters: angular.copy(self.selectionModel.multiFilters),
                                timeFilters: timeFilterObj,
                                userFilter: userFilterObj,
                                dateFilter: self.viewModel.dateFilter,
                                tags: self.tags
                            };
                        }
                    }
                });

                modalInstance.result.then(function (filterObj) {
                    self.selectionModel.multiFilters = filterObj.selectionModel;
                    self.selectionModel.multiFilters['status'] = utils.isNotEmptyVal(self.selectionModel.multiFilters.status) ? self.selectionModel.multiFilters.status : [];
                    //self.selectionModel.multiFilters['substatus'] = _.pluck(selectedItemCopy.intake_sub_status_id, "id");
                    self.viewModel.filters = angular.extend(self.viewModel.filters, filterObj.filters);
                    self.viewModel.filters.s = utils.isEmptyObj(filterObj.filters) ? undefined : filterObj.filters.s;
                    self.viewModel.filters.e = utils.isEmptyObj(filterObj.filters) ? undefined : filterObj.filters.e;
                    self.viewModel.filters.tag = utils.isEmptyObj(filterObj.filters) ? undefined : filterObj.filters.tag;//substatus
                    // self.viewModel.filters.campaign = utils.isEmptyObj(filterObj.filters) ? '' : filterObj.userFilter.campaign;
                    self.viewModel.userFilter = filterObj.userFilter;
                    self.viewModel.filters.pagenum = 1;
                    //reset the matter limit count on filter apply
                    self.matterLimit = initMatterLimit;
                    self.viewModel.dateFilter = filterObj.dateFilter;
                    self.displayMoreButton = true;
                    self.displayALlButton = true;
                    self.applyMultiSelectFilter();
                    //self.showPager = true;
                });
            }

            function setUserFilterForFilter(userFilterObj) {

                userFilterObj.referetoFilter = utils.isNotEmptyVal(self.viewModel.userFilter.referetoFilter) ?
                    self.viewModel.userFilter.referetoFilter : null;

                userFilterObj.referebyFilter = utils.isNotEmptyVal(self.viewModel.userFilter.referebyFilter) ?
                    self.viewModel.userFilter.referebyFilter : null;

                userFilterObj.leadNameFilter = utils.isNotEmptyVal(self.viewModel.userFilter.leadNameFilter) ?
                    self.viewModel.userFilter.leadNameFilter : null;

                userFilterObj.campaign = utils.isNotEmptyVal(self.viewModel.userFilter.campaign) ?
                    self.viewModel.userFilter.campaign : null;


            }

            self.editMatter = function (matterId) {
                $state.go('edit-matter', { matterId: matterId });
            }

            //checkbox select state manager start
            self.selectAllMatters = function (selected) {
                if (selected) {
                    self.clxGridOptions.selectedItems = angular.copy(intakeList);
                } else {
                    self.clxGridOptions.selectedItems = [];
                }
            }

            self.allMatterSelected = function () {
                return self.clxGridOptions.selectedItems.length === intakeList.length;
            }

            self.applyFilterLazyLoading = function () {
                self.viewModel.filters.lastMatterId = _.last(self.viewModel.allIntake)['intakeId'];
                getNextMatterList();
            };

            self.applyMultiSelectFilter = function (tagcancelled) {
                var postArray = ['substatusFilter', 'categoryFilter', 'statusFilter', 'typeFilter', 'subTypeFilter'];
                var valKey = ['substatus', 'categories', 'status', 'types', 'subtypes'];
                self.viewModel.filters.is_migrated = self.selectionModel.multiFilters.is_migrated;
                _.each(postArray, function (val, index) {
                    var data = _.pluck(self.selectionModel.multiFilters[valKey[index]], "id").join();
                    if (utils.isNotEmptyVal(data)) {
                        self.viewModel.filters[val] = data;
                    } else {
                        self.viewModel.filters[val] = [];
                    }
                });

                //cancel substatus tag of relevant status 
                if (tagcancelled) {
                    if (utils.isNotEmptyVal(self.viewModel.filters.substatusFilter)) {
                        var statusArray = self.viewModel.filters.statusFilter.split(',');
                        var statusFromMasterList = [];
                        _.forEach(statusArray, function (item) {
                            _.forEach(self.viewModel.masterList.status, function (currentItem) {
                                if (currentItem.id == item) {
                                    statusFromMasterList.push(currentItem);
                                }
                            })
                        })

                        var selectedSubStatus = [];
                        _.forEach(statusFromMasterList, function (currentItem) {
                            _.forEach(currentItem["substatus"], function (currentI) {
                                selectedSubStatus.push(currentI.id);
                            })
                        })
                        var statusSplit = self.viewModel.filters.substatusFilter.split(",");
                        var sub_status_array = [];
                        _.forEach(statusSplit, function (item) {
                            sub_status_array.push(parseInt(item));
                        })
                        var getSubStatus = _.intersection(selectedSubStatus, sub_status_array);
                        self.viewModel.filters.substatusFilter = getSubStatus.toString();
                    } else {
                        self.viewModel.filters.substatusFilter = [];
                    }
                }

                setUserFilter();

                self.tags = allIntakeListReportHelper.createFilterTags(self.viewModel.filters, self.viewModel.masterList, self.viewModel.userFilter, null, self.viewModel.dateFilter);
                self.getIntakeList();
                self.viewModel.page = "GRIDVIEW";
            };

            self.tagCancelled = function (cancelled) {
                if (timeFilters.indexOf(cancelled.id) > -1) {
                    self.viewModel.filters.tag = undefined;
                    self.viewModel.filters.e = '';
                    self.viewModel.filters.s = '';
                    self.viewModel.dateFilter = '';
                } else {
                    if (cancelled.type === 'referebyFilter') {
                        self.viewModel.userFilter['referebyFilter'] = '';
                    } else if (cancelled.type === 'referetoFilter') {
                        self.viewModel.userFilter['referetoFilter'] = '';
                    } else if (cancelled.type === 'leadNameFilter') {
                        self.viewModel.userFilter['leadNameFilter'] = '';
                        //cancelled.typ
                    } else if (cancelled.type === 'campaign') {
                        self.viewModel.userFilter['campaign'] = '';
                    }
                    else if (cancelled.type === 'is_migrated') {
                        self.viewModel.filters['is_migrated'] = 0;
                        self.selectionModel.multiFilters['is_migrated'] = 0;
                    } else {
                        //get array of current filter of the cancelled type
                        var currentFilters = _.pluck(self.selectionModel.multiFilters[cancelled.type], 'id');
                        if (currentFilters == "8" || currentFilters == "6") {
                            if (self.viewModel.filters.dateFilter == "Date Closed" || self.viewModel.filters.dateFilter == "Date Settled") {
                                self.viewModel.filters.tag = undefined;
                                self.viewModel.filters.e = '';
                                self.viewModel.filters.s = '';
                                self.viewModel.dateFilter = '';
                            }
                        }
                        //remove the cancelled filter
                        var index = currentFilters.indexOf(cancelled.key);
                        if (cancelled.type == "venues") {
                            delete self.selectionModel.multiFilters[cancelled.type][index];
                        } else {
                            self.selectionModel.multiFilters[cancelled.type].splice(index, 1);
                        }
                        if (utils.isNotEmptyVal(self.selectionModel.multiFilters.status)) {
                            var statusId = _.pluck(self.selectionModel.multiFilters.status, 'id');
                            var statusArray = [];
                            _.forEach(statusId, function (item) {
                                _.forEach(self.viewModel.masterList.status, function (currentItem) {
                                    if (currentItem.id == item) {
                                        statusArray.push(currentItem);
                                    }
                                })
                            })
                            var res = [];
                            _.forEach(statusArray, function (currentItem) {
                                _.forEach(currentItem["substatus"], function (currentI) {
                                    res.push(currentI);
                                })
                            })
                            var intersect = [];
                            _.forEach(self.selectionModel.multiFilters.substatus, function (item) {
                                _.forEach(res, function (ct) {
                                    if (ct.id == item.id) {
                                        intersect.push(item);
                                    }

                                })
                            })

                            self.selectionModel.multiFilters.substatus = intersect;
                        }
                        if (utils.isEmptyVal(self.selectionModel.multiFilters[cancelled.type]) && cancelled.type == 'types') {
                            self.selectionModel.multiFilters['subtypes'] = [];
                        }
                        // Bug#6390: substatus reset issue fixed    
                        if (utils.isEmptyVal(self.selectionModel.multiFilters[cancelled.type]) && cancelled.type == 'status') {
                            self.selectionModel.multiFilters['substatus'] = [];
                        }
                        //reassign the new filters
                    }
                }

                self.applyMultiSelectFilter("tagcancelled");
                //self.showPager = true;
            };
            //sort by filters
            self.applySortByFilter = function (sortBy) {
                self.selectedSort = sortBy.name;
                if (sortBy.param == "lead_name_asc") {
                    self.viewModel.filters.sortby = "intake_name";
                } else if (sortBy.param == "lead_name_desc") {
                    self.viewModel.filters.sortby = "intake_name DESC";
                } else if (sortBy.param == "doi_asc") {
                    self.viewModel.filters.sortby = "accident_date";
                } else if (sortBy.param == "doi_desc") {
                    self.viewModel.filters.sortby = "accident_date DESC";
                } else if (sortBy.param == "date_created_asc") {
                    self.viewModel.filters.sortby = "created_date";
                } else if (sortBy.param == "date_created_desc") {
                    self.viewModel.filters.sortby = "created_date DESC";
                }
                self.viewModel.filters.pagenum = 1;
                self.getIntakeList();
            }

            self.filterByUser = function (param) {
                self.displayMoreButton = true;
                self.displayALlButton = true;
                self.selectionModel.allMatter = param;
                self.getIntakeList();
                //self.showPager = true;
            };

            //filter by status specified at the top(with counts All,Arbitration etc...)
            self.applyStatusFilter = function (filter) {
                self.selectionModel.statusName = 'Ongoing';
            };

            self.getIntakeList = function (getAll) {
                setMultiSelectFilter();
                self.viewModel.filters.pageNumber = getAll ? 1 : self.pageNumber;
                setUserFilter();
                //init clicked row index
                self.clickedRow = -1;
                persistFilters(self.viewModel);
                var filterObj = allIntakeListReportHelper.getFiltersObj(self.viewModel.filters, getAll, self.viewModel.masterList, self.selectionModel.allMatter);

                var promesa = intakeReportFactory.getIntakeReportList(filterObj);
                promesa.then(function (response) {
                    processData(response);
                    self.total = (utils.isNotEmptyVal(response.count)) ? parseInt(response.count) : 0;
                    utils.replaceNullByEmptyStringArray(response.intakeData);
                    self.display.matterListReceived = true;
                    intakeList = response.intakeData ? response.intakeData : []; //store all allIntake locally, this list will be used while client side filtering
                    allIntakeListReportHelper.setModifiedDisplayDate(intakeList);
                    self.viewModel.allIntake = response.intakeData ? response.intakeData : [];
                    self.showPager = self.viewModel.allIntake.length < self.total;

                    //   self.viewModel.allIntake = _.uniq(self.viewModel.allIntake, 'intake_id');
                    //deselect all matters
                    self.clxGridOptions.selectAll = false;
                    self.clxGridOptions.selectedItems = [];
                    delete self.viewModel.filters.lastMatterId;
                }, function (reason) { });

            };

            function processData(response) {
                _.forEach(response.intakeData, function (item) {
                    item.accidentDate_formatted = (item.accidentDate == 0) ? "-" : moment.unix(item.accidentDate).utc().format('DD MMM YYYY');
                    item.createdDate_formatted = (item.createdDate == 0) ? "-" : moment.unix(item.createdDate).format('DD MMM YYYY');
                    var category = _.findWhere(self.viewModel.masterList.category, { id: item.intakeCategory.intakeCategoryId });
                    item.intakeCategoryCopy = angular.copy(item.intakeCategory);
                    item.intakeCategoryName = category ? category.name : "";
                    var status = _.findWhere(self.viewModel.masterList.status, { id: item.intakeStatus.intakeStatusId });
                    item.intakeStatusName = status ? status.name : "";
                    var subStatus = status ? _.findWhere(status.substatus, { id: item.intakeSubStatus.intakeSubStatusId }) : null;
                    item.intakeSubStatusName = subStatus ? subStatus.name : "";
                    var type = _.findWhere(self.viewModel.masterList.type, { id: item.intakeType.intakeTypeId });
                    var subType = type ? _.findWhere(type.subtype, { id: item.intakeSubType.intakeSubTypeId }) : null;
                    item.intakeTypeCopy = angular.copy(item.intakeType);
                    item.intakeSubTypeCopy = angular.copy(item.intakeSubType);
                    item.intakeTypeName = type ? type.name : "";
                    item.intakeSubTypeName = subType ? subType.name : "";
                    item.referredByName = item.referredBy ? item.referredBy.firstName + ' ' + item.referredBy.lastName : "";
                    item.referredToName = item.referredTo ? item.referredTo.firstName + ' ' + item.referredTo.lastName : "";
                    item.assignedUserNames = _.pluck(item.assignedUser, 'userName').join(",");
                });
                utils.replaceNullByEmptyStringArray(response.intakeData);
            }
            self.getAllIntakeList = function () {
                self.displayALlButton = false;
                self.getIntakeList(99999);
                self.showPager = false;
            }

            //ensure to set other filter values while fetching next data
            function setMultiSelectFilter() {
                var postArray = ['substatusFilter', 'statusFilter', 'typeFilter', 'subTypeFilter'];
                var valKey = ['substatus', 'status', 'types', 'subtypes'];
                _.each(postArray, function (val, index) {
                    var data = _.pluck(self.selectionModel.multiFilters[valKey[index]], "id").join();
                    if (utils.isNotEmptyVal(data)) {
                        self.viewModel.filters[val] = data;
                    } else {
                        //if (angular.isUndefined(self.viewModel.filters[val])) {
                        self.viewModel.filters[val] = [];
                        //}
                    }
                });

                //cancel substatus if status is empty
                if (self.viewModel.filters.statusFilter instanceof Array) {
                    self.viewModel.filters.substatusFilter = [];
                }

            }

            function setUserFilter() {
                if (utils.isEmptyVal(self.viewModel.dateFilter)) {
                    self.viewModel.filters.dateFilter = '';
                } else {
                    self.viewModel.filters.dateFilter = self.viewModel.dateFilter;
                }

                self.viewModel.filters.referetoFilter = utils.isNotEmptyVal(self.viewModel.userFilter.referetoFilter) ?
                    self.viewModel.userFilter.referetoFilter.contactid : '';

                self.viewModel.filters.referebyFilter = utils.isNotEmptyVal(self.viewModel.userFilter.referebyFilter) ?
                    self.viewModel.userFilter.referebyFilter.contactid : '';

                self.viewModel.filters.leadNameFilter = utils.isNotEmptyVal(self.viewModel.userFilter.leadNameFilter) ?
                    self.viewModel.userFilter.leadNameFilter : '';

                self.viewModel.filters.campaign = utils.isNotEmptyVal(self.viewModel.userFilter.campaign) ?
                    self.viewModel.userFilter.campaign : '';
            }

            self.getAllIntakeList = function () {
                self.getIntakeList(1000);
            }



            function getNextMatterList() {
                setMultiSelectFilter();
                self.viewModel.filters.pageNumber = self.pageNumber + 1;
                setUserFilter();
                var filterObj = allIntakeListReportHelper.getFiltersObj(self.viewModel.filters, '', self.viewModel.masterList, self.selectionModel.allMatter);
                var promesa = intakeReportFactory.getIntakeReportList(filterObj);
                promesa.then(function (data) {
                    processData(data);
                    self.total = (utils.isNotEmptyVal(data.count)) ? parseInt(data.count) : 0;
                    utils.replaceNullByEmptyStringArray(data.intakeData);
                    self.display.matterListReceived = true;
                    _.forEach(data.intakeData, function (item) {
                        intakeList.push(item);
                    })
                    // intakeList = data.intakeData ? data.intakeData : []; //store all allIntake locally, this list will be used while client side filtering
                    allIntakeListReportHelper.setModifiedDisplayDate(intakeList);
                    self.viewModel.allIntake = intakeList ? intakeList : [];
                    self.showPager = self.viewModel.allIntake.length < self.total;
                    self.clxGridOptions.selectAll = false;
                    self.clxGridOptions.selectedItems = [];
                    delete self.viewModel.filters.lastMatterId;


                }, function (reason) {

                });
            };


            self.downloadMatters = function () {
                setMultiSelectFilter();
                setUserFilter();
                var tz = utils.getTimezone();
                var filterObj = allIntakeListReportHelper.getFiltersObj(self.viewModel.filters, '', self.viewModel.masterList, self.selectionModel.allMatter);
                filterObj.requestType = "report";
                filterObj.page_size = 'all';
                filterObj.timeZone = moment.tz.guess();
                // var sDate =  moment().utc(filterObj.startTime);
                // sDate = utils.getUTCTimeStampStart(sDate);
                // var eDate =  moment().utc(filterObj.endTime);
                // eDate = utils.getUTCTimeStampEnd(eDate);
                // filterObj.startTime =  sDate;
                // filterObj.endTime = eDate
                intakeReportFactory.downloadMatters(filterObj)
                    .then(function (response) {
                        utils.downloadFile(response.data, "All_Intake_List_Report", response.headers("Content-Type"));

                    })
            }

            self.print = function () {
                setMultiSelectFilter();
                self.viewModel.filters.pageNumber = 1;
                setUserFilter();
                var filterObj = allIntakeListReportHelper.getFiltersObj(self.viewModel.filters, '', self.viewModel.masterList, self.selectionModel.allMatter);
                // filterObj.pageSize = 10000;

                var promesa = intakeReportFactory.getIntakeReportList(filterObj);
                promesa.then(function (response) {
                    processData(response);
                    var data = response.intakeData;
                    data = data ? data : [];
                    utils.replaceNullByEmptyStringArray(data);
                    var filterDisplayObj = setFilterDisplayObj(self.viewModel.filters);
                    // setIntakeDate(data);
                    data = _.uniq(data, 'intakeId');
                    intakeReportFactory.printMatters(data, filterDisplayObj);
                }, function (reason) { });
            };

            function setSubtypeFilterForPrint(filterObj) {

                if (utils.isEmptyVal(self.viewModel.filters.subTypeFilter)) {
                    return;
                }

                var filters = self.viewModel.filters;
                var masterList = self.viewModel.masterList;


                var typeId = filters.typeFilter instanceof Array ?
                    filters.typeFilter : filters.typeFilter.split(',')[0];

                var typeObj = _.find(masterList.type, function (status) {
                    return status.id == typeId;
                });

                if (utils.isEmptyVal(typeObj)) {
                    return;
                }

                var subtypes = typeObj['subtype'];
                var selectedSubtypesIds = self.viewModel.filters.subTypeFilter.split(',');
                var subtypesNames = [];
                _.forEach(selectedSubtypesIds, function (selsubstatusId) {
                    var subtype = _.find(subtypes, function (subtype) {
                        return subtype.id == selsubstatusId
                    });
                    subtypesNames.push(subtype.name);
                });
                delete filterObj.subTypeFilter;
                //set filter object
                filterObj.subtype = {
                    name: 'SUBTYPES',
                    data: subtypesNames
                };
            }

            function setIntakeDate(intakeList) {
                _.forEach(intakeList, function (data) {
                    if ((angular.isDefined(data.dateofincidenceutc)) && !_.isNull(data.dateofincidenceutc) && (parseInt(data.dateofincidenceutc) !== 0) && !utils.isEmptyString(data.dateofincidenceutc)) {
                        data.dateofincidence = moment.unix(data.dateofincidenceutc).utc().format('MM/DD/YYYY');
                    } else {
                        data.dateofincidence = " - ";
                    }

                });
                //formate created date to MM/DD/YYYY for print
                _.forEach(intakeList, function (data) {
                    if ((angular.isDefined(data.created_date)) && !_.isNull(data.created_date) && (parseInt(data.created_date) !== 0) && !utils.isEmptyString(data.created_date)) {
                        data.created_date = moment.unix(data.created_date).format('MM/DD/YYYY');
                    } else {
                        data.created_date = " - ";
                    }
                });
            }

            // set filter obj to be displayed on print page
            function setFilterDisplayObj() {
                var filterObj = {};
                setStatusFiltersForPrint(filterObj);
                setSubstatusFilterForPrint(filterObj);
                setSubtypeFilterForPrint(filterObj);
                setUserAssignmentFilterPrint(filterObj);
                setDatedByFilterForPrint(filterObj);
                setDateRangeFilterForPrint(filterObj);
                setSortByFilterForPrint(filterObj);
                setIsMigratedFilterForPrint(filterObj);
                // setLeadNameFilterForPrint(filterObj)
                return filterObj;
            }

            function setDatedByFilterForPrint(filterObj) {
                var copyfilters = angular.copy(self.viewModel.filters);
                var dateByName = copyfilters.dateFilter;
                filterObj.dateFilter = {
                    name: 'DATE BY ',
                    data: dateByName
                };
            }

            function setStatusFiltersForPrint(filterObj) {
                var postArray = ['statusFilter', 'substatusFilter', 'typeFilter', 'subTypeFilter'];
                var valKey = ['status', 'substatus', 'type', 'subType'];

                _.each(postArray, function (val, index) {
                    //get array of current valkey item from masterlist
                    //  if(val == 'subTypeFilter'){
                    //     var array = extractSubTypes(filterObj);
                    // } else{
                    var array = angular.copy(self.viewModel.masterList[valKey[index]]);
                    // }
                    var appliedFilters = [];
                    //iterate over current selected filters

                    var filterString = self.viewModel.filters[val].toString();
                    _.forEach(filterString.split(','), function (id) {
                        if (utils.isEmptyString(id)) { return; }
                        if (id === "all") { appliedFilters.push("all"); } //if filter id is all push as is
                        else {
                            // find object from array having the current id
                            var appliedFilter = _.find(array, function (item) {
                                return item.id == id;
                            });
                            if (!utils.isEmptyString(appliedFilter.id) && utils.isEmptyString(appliedFilter.name)) {
                                appliedFilter.name = "{Blank}";
                            }
                            appliedFilters.push(appliedFilter.name);
                        }
                    });
                    //set the filter obj
                    // filterObj ={name:<filter name>,value:<applied filters>}
                    filterObj[val] = {};
                    filterObj[val].name = valKey[index].toUpperCase();
                    filterObj[val].data = appliedFilters;
                });
            }

            function setSubstatusFilterForPrint(filterObj) {

                if (utils.isEmptyVal(self.viewModel.filters.substatusFilter)) {
                    return;
                }

                var filters = self.viewModel.filters;
                var masterList = self.viewModel.masterList;

                var statusId = filters.statusFilter instanceof Array ?
                    filters.statusFilter : filters.statusFilter.split(',');


                var statusObj = [];
                _.forEach(statusId, function (item) {
                    _.forEach(masterList.status, function (currentItem) {
                        if (item == currentItem.id) {
                            statusObj.push(currentItem);
                        }
                    })
                })

                //get substatus names

                // var statusObj = _.find(masterList.status, function (status) {
                //     return status.id == statusId;
                // });

                if (utils.isEmptyVal(statusObj)) {
                    return;
                }

                var substatusNames = [];
                var selectedSubstatusIds = self.viewModel.filters.substatusFilter.split(',');
                _.forEach(statusObj, function (item) {
                    _.forEach(item['substatus'], function (ct) {
                        substatusNames.push(ct)
                    })
                })

                var substatusNames_1 = [];
                _.forEach(selectedSubstatusIds, function (selsubstatusId) {
                    var substatus = _.find(substatusNames, function (substatus) {
                        return substatus.id == selsubstatusId
                    });
                    if (substatus) {
                        substatusNames_1.push(substatus.name);
                    }

                });

                //set filter object
                filterObj.substatus = {
                    name: 'SUBSTATUS',
                    data: substatusNames
                };
            }


            function setUserAssignmentFilterPrint(filterObj) {

                if (self.viewModel.filters.leadNameFilter) {
                    filterObj.leadname = {
                        name: 'LEAD NAME',
                        data: self.viewModel.filters.leadNameFilter.intakeName
                    };

                } else {

                    filterObj.leadname = {
                        name: 'LEAD NAME', data: ' - '
                    };
                }

                if (self.viewModel.filters.campaign) {
                    filterObj.campaign = {
                        name: 'CAMPAIGN',
                        data: self.viewModel.filters.campaign
                    };
                } else {
                    filterObj.campaign = {
                        name: 'CAMPAIGN', data: ' - '
                    };
                }

                var userFilterObj = {};

                userFilterObj.referredto = utils.isNotEmptyVal(self.viewModel.userFilter.referetoFilter) ?
                    self.viewModel.userFilter.referetoFilter.name : ' - ';

                userFilterObj.referredby = utils.isNotEmptyVal(self.viewModel.userFilter.referebyFilter) ?
                    self.viewModel.userFilter.referebyFilter.name : ' - ';


                filterObj.referredTo = {
                    name: "REFERRED TO",
                    data: userFilterObj.referredto
                };

                filterObj.referredBy = {
                    name: "REFERRED BY",
                    data: userFilterObj.referredby
                };
            }

            function setDateRangeFilterForPrint(filterObj) {
                if (utils.isNotEmptyVal(self.viewModel.filters.s)) {
                    var dateRangeStr = "";
                    if (self.viewModel.dateFilter == "Date of incident") {
                        dateRangeStr = 'from ' + moment.unix(self.viewModel.filters.s).utc().format('MM/DD/YYYY') + ' to ' + moment.unix(self.viewModel.filters.e).utc().format('MM/DD/YYYY');
                    } else {
                        dateRangeStr = 'from ' + moment.unix(self.viewModel.filters.s).format('MM/DD/YYYY') + ' to ' + moment.unix(self.viewModel.filters.e).format('MM/DD/YYYY');
                    }
                    filterObj.dateRange = {
                        name: 'DATE RANGE',
                        data: dateRangeStr

                    };
                } else {
                    filterObj.dateRange = {
                        name: 'DATE RANGE', data: 'from ' + ' - ' + ' to ' + ' - '
                    };
                }
            }

            function setSortByFilterForPrint(filterObj) {
                var copyfilters = angular.copy(self.viewModel.filters);
                var sortval = copyfilters.sortby.toString();
                var vals = _.pluck(self.sorts, 'value');
                var index = vals.indexOf(sortval);
                var sortbyName = self.sorts[index].name;
                filterObj.sortby = {
                    name: 'SORT BY ',
                    data: sortbyName
                };

            }

            function setIsMigratedFilterForPrint(filterObj) {
                var value;
                if (angular.isDefined(self.viewModel.filters)) {
                    var includeMigrated = angular.isDefined(self.viewModel.filters.is_migrated) ? self.viewModel.filters.is_migrated : 0;
                }
                if (includeMigrated && includeMigrated == '2') {
                    value = "Yes";
                } else {
                    value = "No";
                }
                filterObj.isMigrated = {
                    name: 'INCLUDE MIGRATED INTAKES ',
                    data: value
                };
            }

            self.notSorted = function (obj) {
                if (!obj) {
                    return [];
                } else {
                    var keys = Object.keys(obj);
                    return _.filter(keys, function (key) { return utils.isNotEmptyString(key); })
                }
            }

            self.getMasterList = function () {
                var defer = $q.defer();
                var promesa = intakeReportFactory.getMasterDataList();
                promesa.then(function (data) {
                    var substatus = [];
                    var subType = [];
                    _.forEach(data.status, function (statusRecord) {
                        _.forEach(statusRecord.substatus, function (substatusRecord) {
                            substatus.push(substatusRecord);
                        });
                    });
                    _.forEach(data.type, function (statusRecord) {
                        _.forEach(statusRecord.subtype, function (subtypeRecord) {
                            subType.push(subtypeRecord);
                        });
                    });
                    data.substatus = substatus;
                    data.subType = subType;
                    if (!self.viewModel) {
                        self.viewModel = {};
                    }
                    self.viewModel.masterList = data;
                    self.masterDataCopy = angular.copy(data);
                    defer.resolve();
                }, function (reason) {
                    if (self.viewModel) {
                        self.viewModel.masterList = {};
                        self.masterDataCopy = {};
                    }
                    defer.resolve();
                });
                return defer.promise;
            }


            self.init();

        }]);
})();


(function () {
    angular.module('intake.report')
        .factory('allIntakeListReportHelper', allIntakeListReportHelper);
    allIntakeListReportHelper.$inject = [];

    function allIntakeListReportHelper() {
        return {
            setModifiedDisplayDate: setModifiedDisplayDate,
            getGridHeaders: getGridHeaders,
            isMatterSelected: isMatterSelected,
            getFiltersObj: getFiltersObj,
            createFilterTags: createFilterTags
        }

        function setModifiedDisplayDate(intakeList) {
            _.forEach(intakeList, function (matter) {
                if (angular.isDefined(matter.intake_date_utc)) {
                    if (matter.intake_date_utc != '' && matter.intake_date_utc != 0 && matter.intake_date_utc != null) {
                        matter.intake_date_utc = moment.unix(matter.intake_date_utc).utc().format('DD MMM YYYY');
                    } else {
                        matter.intake_date_utc = '-';
                    }
                } else {
                    matter.intake_date_utc = '-';
                }

                //using in temperory till the time didn't get intake_date from backend
                //matter.intake_date = '';

                if (angular.isDefined(matter.dateofincidence)) {
                    if (matter.dateofincidence != '' && matter.dateofincidence != 0 && matter.dateofincidence != null) {
                        matter.dateofincidence = moment.unix(matter.dateofincidence).utc().format('DD MMM YYYY');
                    } else {
                        matter.dateofincidence = '-';
                    }
                } else {
                    matter.dateofincidence = '-';
                }
                //check for created date : convert to DD MMM YYYY format to display on grid
                if (angular.isDefined(matter.created_date)) {
                    if (matter.created_date != '' && matter.created_date != 0 && matter.created_date != null) {
                        matter.created_date = moment.unix(matter.created_date).format('DD MMM YYYY');
                    } else {
                        matter.created_date = '-';
                    }
                } else {
                    matter.created_date = '-';
                }

                //check for created date : convert to DD MMM YYYY format to display on grid
                if (angular.isDefined(matter.date_closed)) {
                    if (matter.date_closed != '' && matter.date_closed != 0 && matter.date_closed != null) {
                        matter.date_closed = moment.unix(matter.date_closed).format('DD MMM YYYY');
                    } else {
                        matter.date_closed = '-';
                    }
                } else {
                    matter.date_closed = '-';
                }
                //check for  date settled : convert to DD MMM YYYY format to display on grid
                if (angular.isDefined(matter.date_settled)) {
                    if (matter.date_closed != '' && matter.date_settled != 0 && matter.date_settled != null) {
                        matter.date_settled = moment.unix(matter.date_settled).format('DD MMM YYYY');
                    } else {
                        matter.date_settled = '-';
                    }
                } else {
                    matter.date_settled = '-';
                }



            });
        }

        function getGridHeaders() {
            return [
                {
                    field: [
                        {
                            prop: 'intakeName',
                            css: 'word-wrap',
                            href: { link: '#/intake/intake-overview', paramProp: ['intakeId'] }
                        }

                    ],
                    displayName: 'Lead Name',
                    dataWidth: 10
                },
                {
                    field: [
                        {
                            prop: 'accidentDate_formatted',
                            filter: 'replaceByDash'
                            //href: '#/matter-overview'
                        },
                        {
                            prop: 'createdDate_formatted',
                            filter: 'replaceByDash'

                        }
                    ],
                    displayName: 'Date of incident/ Date Created',
                    dataWidth: 15
                },
                {
                    field: [{
                        prop: 'intakeTypeName',
                        template: 'bold',
                        filter: 'replaceByDash'
                    }, {
                        prop: 'intakeSubTypeName',
                        filter: 'replaceByDash'
                    }
                    ],
                    displayName: 'Type/ SubType',
                    dataWidth: 15

                },
                {
                    field: [{
                        prop: 'intakeCategoryName',
                    }],
                    displayName: 'Category',
                    dataWidth: 10

                },
                {
                    field: [{
                        prop: 'intakeStatusName',
                        template: 'bold',
                        filter: 'replaceByDash'
                    },
                    {
                        prop: 'intakeSubStatusName',
                        filter: 'replaceByDash'
                    }],
                    displayName: 'Status/ Substatus',
                    dataWidth: 10

                },
                {
                    field: [{
                        prop: 'campaign'
                    }
                    ],
                    displayName: 'Campaign',
                    dataWidth: 10

                },
                {
                    field: [{
                        prop: 'assignedUserNames'
                    }],
                    displayName: 'Assigned To',
                    dataWidth: 10

                },
                {
                    field: [{
                        prop: 'referredToName'
                    }],
                    displayName: 'Referred To',
                    dataWidth: 10

                },
                {
                    field: [{
                        prop: 'referredByName'
                    }],
                    displayName: 'Referred By',
                    dataWidth: 10

                }

            ];
        }

        function isMatterSelected(intakeList, matter) {
            var ids = _.pluck(intakeList, 'intake_id');
            return ids.indexOf(matter.intake_id) > -1;
        }

        function getStatusFilter(filters, masterList) {
            var statusFilter;
            var filter = angular.copy(filters);
            if (utils.isNotEmptyVal(filter.statusFilter)) {
                var status = filter.statusFilter.split(',');
                var substatus = utils.isNotEmptyVal(filter.substatusFilter) ? filter.substatusFilter.split(',') : [];
                var getStatusAndSubStatus = [];
                //get status along with sub status in an array
                _.forEach(status, function (item) {
                    _.forEach(masterList.status, function (currentItem) {
                        if (item == currentItem.id) {
                            getStatusAndSubStatus.push(currentItem);
                        }
                    })
                })


                //push selected status and all substatus in an array
                var selectedSubStatus = [];
                var flag = false;
                _.forEach(getStatusAndSubStatus, function (currentItem) {
                    _.forEach(currentItem["substatus"], function (currentI) {
                        if (currentI.statusid) {
                            selectedSubStatus.push(currentI);
                            flag = false;
                        } else {
                            flag = true;
                        }
                    })
                })
                if (flag) {
                    var a = [];
                    _.forEach(masterList.status, function (it) {
                        _.forEach(status, function (item) {
                            if (it.id == item) {
                                a.push(it)
                            }
                        })
                    })
                    _.forEach(a, function (currentItems) {
                        _.forEach(currentItems["substatus"], function (currentId) {
                            currentId.statusname = currentItems.name;
                            currentId.statusid = currentItems.id;
                            selectedSubStatus.push(currentId);
                        });
                    })
                }
                //push selected substatus in an array
                var selectedStatusAndSubStatus = [];
                _.forEach(substatus, function (item) {
                    _.forEach(selectedSubStatus, function (currentItem) {
                        if (item == currentItem.id) {
                            selectedStatusAndSubStatus.push(currentItem);
                        }
                    })

                });

                var getstatusIds = _.pluck(selectedStatusAndSubStatus, 'statusid');
                var diffStatus = _.difference(status, getstatusIds);
                if (diffStatus.length > 0) {
                    _.forEach(diffStatus, function (item) {
                        var evens = _.filter(masterList.status, function (rec) { return rec.id == item; });
                        selectedStatusAndSubStatus.push({
                            id: '',
                            name: '',
                            statusid: evens[0].id,
                            statusname: evens[0].name
                        })
                    })

                }

                //combine status with sub-status in an array
                var group_to_values = selectedStatusAndSubStatus.reduce(function (obj, item) {
                    obj[item.statusid] = obj[item.statusid] || [];
                    obj[item.statusid].push(item.id);
                    return obj;
                }, {});

                statusFilter = Object.keys(group_to_values).map(function (key) {
                    return { statusId: key, subStatusId: group_to_values[key] };
                });

                _.forEach(statusFilter, function (item) {
                    var idx = item.subStatusId.length - 1;
                    item.subStatusId.splice(idx, 1);
                })
                _.forEach(statusFilter, function (item) {
                    item.subStatusId = item.subStatusId.toString();
                })
            }
            return statusFilter;
        }
        function getFiltersObj(filters, getAll, masterList, intakeFlag) {
            var formattedFilters = {};

            formattedFilters.intake_status_ids = utils.isNotEmptyVal(filters.statusFilter) ? getStatusFilter(filters, masterList) : [];//JSON.stringify(getStatusFilter(filters, masterList)) : [];

            if (filters.lastMatterId) { formattedFilters.intake_id = filters.lastMatterId; }

            formattedFilters.intake_type_id = utils.isNotEmptyVal(filters.typeFilter) ? JSON.parse("[" + filters.typeFilter + "]") : [];
            formattedFilters.intake_sub_type_id = utils.isNotEmptyVal(filters.subTypeFilter) ? JSON.parse("[" + filters.subTypeFilter + "]") : [];

            formattedFilters.user_id = [];
            formattedFilters.intake_category_id = [];
            formattedFilters.referredTo = utils.isNotEmptyVal(filters.referetoFilter) ? parseInt(filters.referetoFilter) : 0;
            formattedFilters.referredBy = utils.isNotEmptyVal(filters.referebyFilter) ? parseInt(filters.referebyFilter) : 0;
            formattedFilters.startTime = utils.isNotEmptyVal(filters.s) ? filters.s : 0;
            formattedFilters.endTime = utils.isNotEmptyVal(filters.e) ? filters.e : 0;
            formattedFilters.sortBy = filters.sortby;
            formattedFilters.page_number = filters.pageNumber;
            formattedFilters.page_size = getAll ? 'all' : 250;
            formattedFilters.myIntake = intakeFlag;
            //leadNameFilter
            formattedFilters.intake_id = utils.isNotEmptyVal(filters.leadNameFilter) ? parseInt(filters.leadNameFilter.intakeId) : 0;
            // campaign
            formattedFilters.campaign = utils.isNotEmptyVal(filters.campaign) ? filters.campaign : '';

            if (angular.isDefined(filters.dateFilter) && filters.dateFilter != null && filters.dateFilter != '') {
                if (filters.dateFilter == "Date of incident") {
                    formattedFilters.dateFilter = "incidentDate";
                }
                else if (filters.dateFilter == "Date Created") {
                    formattedFilters.dateFilter = "dateCreated";
                } else {
                    formattedFilters.dateFilter = "";
                }

            } else {
                formattedFilters.dateFilter = "";
            }

            formattedFilters.is_migrated = angular.isDefined(filters.is_migrated) ? filters.is_migrated : 0;

            return formattedFilters;
        };

        function createFilterTags(filters, masterList, userFilters, userList, dateFilter) {
            var tags = [];
            var filterArray = [
                { type: 'status', list: 'status', filter: 'statusFilter', tagname: 'Status' },
                { type: 'types', list: 'type', filter: 'typeFilter', tagname: 'Type' }
            ];


            _.forEach(filterArray, function (filterObj) {
                var filterData = getFilterValues(masterList, filterObj.list, filterObj.type);
                var appliedFilters = filters[filterObj.filter].toString().split(',');

                _.forEach(appliedFilters, function (filterId) {
                    var selectedFilter = _.find(filterData, function (filter) {
                        return parseInt(filter.key) === parseInt(filterId);
                    });

                    if (angular.isDefined(selectedFilter)) {
                        selectedFilter.value = utils.isEmptyString(selectedFilter.value) ? '{Blank}' : selectedFilter.value;
                        selectedFilter.value = filterObj.tagname + ' : ' + selectedFilter.value;
                        tags.push(selectedFilter);
                    }
                });
            });

            setSubstatusFilter(tags, masterList, filters);
            setSubTypesFilter(tags, masterList, filters);



            if (utils.isNotEmptyVal(filters.tag)) {
                var filterDisplay = '';
                filterDisplay = utils.isNotEmptyVal(dateFilter) ? dateFilter + ' : ' : '';
                //Bug# 5444 for custom dates date range added  
                if (filters.tag == 'custom dates') {
                    if (dateFilter == "Date of incident" || dateFilter == "Intake Date" || dateFilter == "Date Closed" || dateFilter == "Date Settled") {
                        var start = moment.unix(filters.s).utc().format('MM-DD-YYYY');
                        var end = moment.unix(filters.e).utc().format('MM-DD-YYYY');
                    } else {
                        var start = moment.unix(filters.s).format('MM-DD-YYYY');
                        var end = moment.unix(filters.e).format('MM-DD-YYYY');
                    }


                    filterDisplay += start + ' to: ' + end;
                    var filterObj = { value: filterDisplay, id: filters.tag };
                    tags.push(filterObj);
                } else {
                    filterDisplay += filters.tag;
                    var filterObj = { value: filterDisplay, id: filters.tag };
                    tags.push(filterObj);
                }
            }

            if (utils.isNotEmptyVal(userFilters.referebyFilter)) {
                var referByFilter = {
                    value: "Referred by: " + userFilters.referebyFilter.name,
                    type: "referebyFilter"
                };

                tags.push(referByFilter);
            }

            if (utils.isNotEmptyVal(userFilters.referetoFilter)) {
                var referToFilter = {
                    value: "Referred to: " + userFilters.referetoFilter.name,
                    type: "referetoFilter"
                };

                tags.push(referToFilter);
            }
            if (utils.isNotEmptyVal(userFilters.leadNameFilter)) {
                var referToFilter = {
                    value: "Lead Name: " + userFilters.leadNameFilter.name,
                    type: "leadNameFilter"
                };

                tags.push(referToFilter);
            }

            if (utils.isNotEmptyVal(userFilters.campaign)) {
                var campaignFilter = {
                    value: "Campaign: " + userFilters.campaign,
                    type: "campaign"
                };

                tags.push(campaignFilter);
            }

            if (filters.is_migrated == '2') {
                var migratedIntakeFilter = {
                    value: "Include Migrated Intakes",
                    type: "is_migrated"
                };

                tags.push(migratedIntakeFilter);
            }

            return tags;
        }


        function setSubstatusFilter(tags, masterList, filters) {
            var statusId = filters.statusFilter instanceof Array ? filters.statusFilter : filters.statusFilter.split(',');
            var statusObj = [];
            _.forEach(statusId, function (item) {
                _.forEach(masterList.status, function (currentItem) {
                    if (item == currentItem.id) {
                        statusObj.push(currentItem);
                    }
                })
            })
            if (utils.isEmptyVal(statusObj)) {
                return;
            }
            var selectedSubstatuses;
            selectedSubstatuses = _.pluck(statusObj, 'substatus');
            var substatusesIds = utils.isNotEmptyVal(filters.substatusFilter) ? filters.substatusFilter.split(',') : filters.substatusFilter;

            _.forEach(substatusesIds, function (subStId) {
                var subStObj = [];
                _.forEach(selectedSubstatuses, function (currentItem) {
                    _.forEach(currentItem, function (item) {
                        if (subStId == item.id) {
                            if (utils.isEmptyString(item.name)) {
                                item.name = '{Blank}';
                            }
                            subStObj.push(item);
                        }
                    })
                })
                _.forEach(subStObj, function (subSt) {
                    var tagObj = {
                        key: subSt.id,
                        type: 'substatus',
                        value: 'substatus: ' + subSt.name
                    };
                    tags.push(tagObj);
                })

            });
        }

        function setSubTypesFilter(tags, masterList, filters) {
            var typeID = filters.typeFilter instanceof Array ? filters.typeFilter : filters.typeFilter.split(',')[0];
            var typeObj = _.find(masterList.type, function (type) {
                return type.id == typeID;
            });

            if (utils.isEmptyVal(typeObj)) {
                return;
            }

            var selectedSubtypes = typeObj['subtype'];
            var subtypesIds = filters.subTypeFilter instanceof Array ? filters.subTypeFilter : filters.subTypeFilter.split(',');

            _.forEach(subtypesIds, function (subTyId) {
                var subTypObj = _.find(selectedSubtypes, function (selSbTy) {
                    return selSbTy.id == subTyId
                });
                if (utils.isEmptyString(subTypObj.name)) {
                    subTypObj.name = '{Blank}';
                }
                var tagObj = {
                    key: subTypObj.id,
                    type: 'subtypes',
                    value: 'subtype: ' + subTypObj.name
                };
                tags.push(tagObj);
            });
        }

        function getFilterValues(masterList, filter, type) {
            // if (filter != 'lawtype') {
            return masterList[filter].map(function (item) {
                return {
                    key: item.id,
                    value: item.name,
                    type: type || ''
                };
            });
            // }
        }

        function excludeTags(tags, toBeExcluded) {
            delete toBeExcluded[""];
            angular.forEach(toBeExcluded, function (val, key) {
                var key = val.id;
                var excludeTag = _.find(tags, function (tag) {
                    return parseInt(tag.key) === parseInt(key);
                });

                if (angular.isDefined(excludeTag)) {
                    if (excludeTag.type !== 'status') { return; }
                    var keys = _.pluck(tags, 'key');
                    var index = keys.indexOf(excludeTag.key);
                    tags.splice(index, 1);
                }
            });
        }
    }

})();


