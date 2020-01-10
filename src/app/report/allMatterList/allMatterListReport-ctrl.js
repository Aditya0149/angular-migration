(function () {
    'use strict';

    angular.module('cloudlex.report').controller('AllMatterListReportCtrl', ['$scope', 'reportFactory', '$filter', '$state', '$modal', 'masterData', 'modalService', '$timeout',
        'allMatterListReportHelper', 'notification-service', 'matterFactory',
        function ($scope, reportFactory, $filter, $state, $modal, masterData, modalService, $timeout,
            allMatterListReportHelper, notificationService, matterFactory) {

            var self = this;
            var initMatterLimit = 15;
            var matterList = [];
            var allDisplayStatuses = {};
            //init clicked row index
            self.clickedRow = -1;
            self.matterInTookByDateFlag = true;
            self.dateFieldValue = 3;
            self.displayMoreButton = true;
            self.displayALlButton = true;
            self.resetAllFilter = resetAllFilter;
            self.scrollReachedBottom = scrollReachedBottom;
            self.scrollReachedTop = scrollReachedTop;
            self.showPager = true;
            var masterDataObj = masterData.getMasterData();
            self.pageNum = 1;
            //initialization start

            self.sorts = [{ order: 'ASC', param: "matter_name_asc", name: 'Matter name ASC', value: '1' },
            { order: 'DESC', param: "matter_name_desc", name: 'Matter name DESC ', value: '3' },
            //Chnage made for Sort  by plaintiff last name            
            { order: 'ASC', param: "plaintiff_name_asc", name: 'Plaintiff last name ASC ', value: '9' },
            { order: 'DESC', param: "plaintiff_name_desc", name: 'Plaintiff last name DESC ', value: '10' },
            { order: 'ASC', param: "intake_date_asc", name: 'Intake date old-new', value: '4' },
            { order: 'DESC', param: "intake_date_desc", name: 'Intake date new-old', value: '5' },
            { order: 'ASC', param: "dateofincidence_asc", name: 'Incident date old-new', value: '6' },
            { order: 'DESC', param: "dateofincidence_desc", name: 'Incident date new-old', value: '7' },
            { order: 'ASC', param: "file_number_asc", name: 'File # ASC', value: '2' },
            { order: 'DESC', param: "file_number_desc", name: 'File # DESC', value: '8' }
            ];

            var timeFilters = ['A Year Ago', 'last 6 months', 'last 1 months', 'custom dates'];
            self.selectedSort = 'Matter name ASC';

            self.init = function () {
                self.tags = [];

                self.matterLimit = initMatterLimit;
                var selectionModel = sessionStorage.getItem("matterListReportSelectionModel");
                var viewModel = sessionStorage.getItem("matterListReportViewModel");
                //apply stored filters
                if (utils.isNotEmptyVal(selectionModel) || utils.isNotEmptyVal(viewModel)) {
                    try {
                        self.selectionModel = JSON.parse(selectionModel);
                        self.viewModel = JSON.parse(viewModel);
                        self.viewModel.matters = [];
                        self.selectedSort = _.find(self.sorts, function (sort) {
                            return sort.value == self.viewModel.filters.sortby;
                        }).name;

                        self.tags = allMatterListReportHelper
                            .createFilterTags(self.viewModel.filters, self.viewModel.masterList, self.viewModel.userFilter, self.viewModel.userList, self.viewModel.dateFilter, self.viewModel.includeArchived, self.viewModel.activeMatter);
                        applySetFilters();
                    } catch (e) {
                        initModels();
                        getUserInfo();
                        applySetFilters();
                    }
                } else {
                    initModels();
                    getUserInfo();
                    applySetFilters();
                }
            }


            function scrollReachedBottom() {
                //if (self.matterLimit <= self.total) {
                self.matterLimit = self.matterLimit + initMatterLimit;
                //}
            }

            function scrollReachedTop() {
                self.matterLimit = initMatterLimit;
            }

            function persistFilters() {
                var selectionModel = angular.copy(self.selectionModel);
                var viewModel = angular.copy(self.viewModel);
                viewModel.matters = [];
                sessionStorage.setItem("matterListReportSelectionModel", JSON.stringify(selectionModel));
                sessionStorage.setItem("matterListReportViewModel", JSON.stringify(viewModel));
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
                    headers: allMatterListReportHelper.getGridHeaders(),
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
                self.viewModel.includeArchived = 0;
                self.viewModel.activeMatter = 0;
                self.viewModel.page = "GRIDVIEW";
                self.viewModel.matters = [];
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
                    sortby: 1,
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
                        categories: [],
                        types: [],
                        statuses: [],
                        substatus: [],
                        subtypes: [],
                        venues: [],
                        lawtype: []
                    }
                };
            }

            function getData() {
                self.getMatterList();
                self.getMasterList();
            }
            //initialization end

            function getUserInfo() {
                var promesa = reportFactory.getUserInfo();
                promesa.then(function (dataLists) {
                    self.viewModel.userList = dataLists;
                }, function (reason) { });
            }

            function resetAllFilter() {
                self.tags = [];
                self.viewModel.dateFilter = '';
                self.viewModel.userFilter.leadAttorney = '';
                self.viewModel.userFilter.attorney = '';
                self.viewModel.userFilter.staff = '';
                self.viewModel.userFilter.paralegal = '';
                self.viewModel.userFilter.referByFilterId = '';
                self.viewModel.userFilter.referToFilterId = '';
                self.viewModel.filters.s = '';
                self.viewModel.filters.e = '';
                self.viewModel.filters.tag = '';
                self.selectionModel.multiFilters.categories = [];
                self.selectionModel.multiFilters.statuses = [];
                self.selectionModel.multiFilters.types = [];
                self.selectionModel.multiFilters.substatus = [],
                    self.selectionModel.multiFilters.subtypes = [];
                self.selectionModel.multiFilters.venues = [];
                self.selectionModel.multiFilters.lawtypes = [];
                self.selectionModel.multiFilters.jurisdictions = undefined;
                self.selectionModel.multiFilters['law-types'] = [];
                self.displayMoreButton = true;
                self.displayALlButton = true;
                self.viewModel.includeArchived = 0;
                self.viewModel.activeMatter = 0;
                //reset the matter limit
                self.matterLimit = initMatterLimit;
                self.pageNum = 1;
                self.showPager = true;
                self.getMatterList();
            }

            self.filterAllMatterReport = function () {
                var timeFilterObj;
                var filtercopy = angular.copy(self.viewModel.filters);
                filtercopy.s = (filtercopy.s) ? moment.unix(filtercopy.s).utc().format('MM/DD/YYYY') : '';
                filtercopy.e = (filtercopy.e) ? moment.unix(filtercopy.e).utc().format('MM/DD/YYYY') : '';
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
                    templateUrl: 'app/report/allMatterList/filterPopUp/allMatter/allMatterPopup.html',
                    controller: 'AllMatterFilterCtrl as filter',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        params: function () {
                            return {
                                masterData: self.viewModel.masterList,
                                filters: angular.copy(self.selectionModel.multiFilters),
                                timeFilters: timeFilterObj,
                                userList: self.viewModel.userList,
                                userFilter: userFilterObj,
                                dateFilter: self.viewModel.dateFilter,
                                tags: self.tags,
                                archival: self.viewModel.includeArchived,
                                activeMatterStatus: self.viewModel.activeMatter
                            };
                        }
                    }
                });

                modalInstance.result.then(function (filterObj) {
                    self.selectionModel.multiFilters['venues'] = [];
                    self.selectionModel.multiFilters['venues'].push(filterObj.selectionModel.venues);
                    delete filterObj.selectionModel['venues'];
                    filterObj.selectionModel.venues = self.selectionModel.multiFilters['venues'];
                    self.selectionModel.multiFilters = filterObj.selectionModel;
                    // self.selectionModel.multiFilters['venues'] =[];

                    self.selectionModel.multiFilters['law-types'] = utils.isNotEmptyVal(self.selectionModel.multiFilters.lawtypes) ? self.selectionModel.multiFilters.lawtypes : [];
                    self.viewModel.filters = angular.extend(self.viewModel.filters, filterObj.filters);
                    self.viewModel.includeArchived = filterObj.archival;
                    self.viewModel.activeMatter = filterObj.activeMatterStatus;
                    self.viewModel.filters.s = utils.isEmptyObj(filterObj.filters) ? undefined : filterObj.filters.s;
                    self.viewModel.filters.e = utils.isEmptyObj(filterObj.filters) ? undefined : filterObj.filters.e;
                    self.viewModel.filters.tag = utils.isEmptyObj(filterObj.filters) ? undefined : filterObj.filters.tag;

                    self.viewModel.userFilter = filterObj.userFilter;
                    self.viewModel.filters.pagenum = 1;
                    //reset the matter limit count on filter apply
                    self.matterLimit = initMatterLimit;
                    self.viewModel.dateFilter = filterObj.dateFilter;
                    self.displayMoreButton = true;
                    self.displayALlButton = true;
                    self.applyMultiSelectFilter();
                    self.showPager = true;

                }, function () {

                });
            }

            function setUserFilterForFilter(userFilterObj) {
                userFilterObj.leadAttorney = {};
                userFilterObj.attorney = {};
                userFilterObj.staff = {};
                userFilterObj.paralegal = {};

                if (angular.isDefined(self.viewModel.userFilter.leadAttorney) && self.viewModel.userFilter.leadAttorney != '') {
                    _.forEach(self.viewModel.userList, function (data) {
                        if (angular.isDefined(data.attorny)) {
                            _.forEach(data.attorny, function (data) {
                                if (self.viewModel.userFilter.leadAttorney == data.uid) {
                                    userFilterObj.leadAttorney.id = data.uid;
                                    userFilterObj.leadAttorney.name = data.name;
                                }
                            });
                        }
                    });
                } else {
                    userFilterObj.leadAttorney = '';
                }

                if (angular.isDefined(self.viewModel.userFilter.attorney) && self.viewModel.userFilter.attorney != '') {
                    _.forEach(self.viewModel.userList, function (data) {
                        if (angular.isDefined(data.attorny)) {
                            _.forEach(data.attorny, function (data) {
                                if (self.viewModel.userFilter.attorney == data.uid) {
                                    userFilterObj.attorney.id = data.uid;
                                    userFilterObj.attorney.name = data.name;
                                }
                            });
                        }
                    });
                } else {
                    userFilterObj.attorney = '';
                }

                if (angular.isDefined(self.viewModel.userFilter.staff) && self.viewModel.userFilter.staff != '') {
                    _.forEach(self.viewModel.userList, function (data) {
                        if (angular.isDefined(data.staffonly)) {
                            _.forEach(data.staffonly, function (data) {
                                if (self.viewModel.userFilter.staff == data.uid) {
                                    userFilterObj.staff.id = data.uid;
                                    userFilterObj.staff.name = data.name;

                                }
                            });
                        }
                    });
                } else {
                    userFilterObj.staff = ''
                }

                if (angular.isDefined(self.viewModel.userFilter.paralegal) && self.viewModel.userFilter.paralegal != '') {
                    _.forEach(self.viewModel.userList, function (data) {
                        if (angular.isDefined(data.paralegal)) {
                            _.forEach(data.paralegal, function (data) {
                                if (self.viewModel.userFilter.paralegal == data.uid) {
                                    userFilterObj.paralegal.id = data.uid;
                                    userFilterObj.paralegal.name = data.name;
                                }
                            });
                        }
                    });
                } else {
                    userFilterObj.paralegal = '';
                }

                userFilterObj.referToFilterId = utils.isNotEmptyVal(self.viewModel.userFilter.referToFilterId) ?
                    self.viewModel.userFilter.referToFilterId : null;

                userFilterObj.referByFilterId = utils.isNotEmptyVal(self.viewModel.userFilter.referByFilterId) ?
                    self.viewModel.userFilter.referByFilterId : null;
            }

            self.editMatter = function (matterId) {
                $state.go('edit-matter', { matterId: matterId });
            }
            //display manager end

            //checkbox select state manager start
            self.selectAllMatters = function (selected) {
                if (selected) {
                    self.clxGridOptions.selectedItems = angular.copy(matterList);
                } else {
                    self.clxGridOptions.selectedItems = [];
                }
            }

            self.allMatterSelected = function () {
                if(self.clxGridOptions.selectedItems.length == 0 && matterList.length == 0){
                    return false;
                }
                return self.clxGridOptions.selectedItems.length === matterList.length;
            }

            self.applyFilterLazyLoading = function () {
                self.viewModel.filters.lastMatterId = _.last(self.viewModel.matters)['matter_id'];
                getNextMatterList();
            };

            self.applyMultiSelectFilter = function (tagcancelled) {
                var postArray = ['substatusFilter', 'categoryFilter', 'statusFilter', 'typeFilter', 'subTypeFilter', 'venueFilter', 'lawtypeFilter'];
                var valKey = ['substatus', 'categories', 'statuses', 'types', 'subtypes', 'venues', 'law-types'];
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
                            _.forEach(self.viewModel.masterList.statuses, function (currentItem) {
                                if (currentItem.id == item) {
                                    statusFromMasterList.push(currentItem);
                                }
                            })
                        })

                        var selectedSubStatus = [];
                        _.forEach(statusFromMasterList, function (currentItem) {
                            _.forEach(currentItem["sub-status"], function (currentI) {
                                selectedSubStatus.push(currentI.id);
                            })
                        })

                        var getSubStatus = _.intersection(selectedSubStatus, self.viewModel.filters.substatusFilter.split(","));
                        self.viewModel.filters.substatusFilter = getSubStatus.toString();
                    } else {
                        self.viewModel.filters.substatusFilter = [];
                    }
                }



                setUserFilter();

                self.tags = allMatterListReportHelper.createFilterTags(self.viewModel.filters, self.viewModel.masterList, self.viewModel.userFilter, self.viewModel.userList, self.viewModel.dateFilter, self.viewModel.includeArchived, self.viewModel.activeMatter);
                self.getMatterList();
                self.viewModel.page = "GRIDVIEW";
            };

            self.tagCancelled = function (cancelled) {
                if (timeFilters.indexOf(cancelled.id) > -1) {
                    self.viewModel.filters.tag = undefined;
                    self.viewModel.filters.e = '';
                    self.viewModel.filters.s = '';
                    self.viewModel.dateFilter = '';
                } else {
                    if (cancelled.type == "Staff") {
                        self.viewModel.userFilter.staff = ''
                    } else if (cancelled.type == "Paralegal") {
                        self.viewModel.userFilter.paralegal = ''
                    } else if (cancelled.type == "Lead Attorney") {
                        self.viewModel.userFilter.leadAttorney = ''
                    } else if (cancelled.type == "Attorney") {
                        self.viewModel.userFilter.attorney = ''
                    } else if (cancelled.type === 'referByFilterId') {
                        self.viewModel.userFilter['referByFilterId'] = '';
                    } else if (cancelled.type === 'referToFilterId') {
                        self.viewModel.userFilter['referToFilterId'] = '';
                    } else if (cancelled.type == "archivalFilter") {
                        self.viewModel.includeArchived = 0;
                    } else if (cancelled.type == "activeMatters") {
                        self.viewModel.activeMatter = 0;
                    }
                    else {
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
                        if (utils.isNotEmptyVal(self.selectionModel.multiFilters.statuses)) {
                            var statusId = _.pluck(self.selectionModel.multiFilters.statuses, 'id');
                            var statusArray = [];
                            _.forEach(statusId, function (item) {
                                _.forEach(self.viewModel.masterList.statuses, function (currentItem) {
                                    if (currentItem.id == item) {
                                        statusArray.push(currentItem);
                                    }
                                })
                            })
                            var res = [];
                            _.forEach(statusArray, function (currentItem) {
                                _.forEach(currentItem["sub-status"], function (currentI) {
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
                            //var selectedStatusSubStatus = _.intersection(res, self.selectionModel.multiFilters.substatus);
                            self.selectionModel.multiFilters.substatus = intersect;
                        }


                        //US#7123
                        if (utils.isEmptyObj(self.selectionModel.multiFilters[cancelled.type]) && cancelled.type == 'venues') {
                            self.selectionModel.multiFilters['jurisdictions'] = null;


                        }
                        if (utils.isEmptyVal(self.selectionModel.multiFilters[cancelled.type]) && cancelled.type == 'types') {
                            self.selectionModel.multiFilters['subtypes'] = [];
                        }
                        // Bug#6390: substatus reset issue fixed    
                        if (utils.isEmptyVal(self.selectionModel.multiFilters[cancelled.type]) && cancelled.type == 'statuses') {
                            self.selectionModel.multiFilters['substatus'] = [];
                        }
                        //reassign the new filters

                        if (cancelled.key == '8' && self.viewModel.includeArchived == 1 && cancelled.type == 'statuses') {
                            self.viewModel.includeArchived = 0;
                        }
                        if (cancelled.key == '9' && self.viewModel.activeMatter == 1 && cancelled.type == 'statuses') {
                            self.viewModel.activeMatter = 0;
                        }

                    }
                }

                self.applyMultiSelectFilter("tagcancelled");
                self.showPager = true;
            };

            //sort by filters
            self.applySortByFilter = function (sortBy) {
                self.selectedSort = sortBy.name;
                if (sortBy.param == "matter_name_asc") {
                    self.viewModel.filters.sortby = 1;
                } else if (sortBy.param == "matter_name_desc") {
                    self.viewModel.filters.sortby = 3;
                } else if (sortBy.param == "intake_date_asc") {
                    self.viewModel.filters.sortby = 4;
                } else if (sortBy.param == "intake_date_desc") {
                    self.viewModel.filters.sortby = 5;
                } else if (sortBy.param == "dateofincidence_asc") {
                    self.viewModel.filters.sortby = 6;
                } else if (sortBy.param == "dateofincidence_desc") {
                    self.viewModel.filters.sortby = 7;
                } else if (sortBy.param == "file_number_asc") {
                    self.viewModel.filters.sortby = 2;
                } else if (sortBy.param == "file_number_desc") {
                    self.viewModel.filters.sortby = 8;
                } else if (sortBy.param == "plaintiff_name_asc") {
                    self.viewModel.filters.sortby = 9;
                } else if (sortBy.param == "plaintiff_name_desc") {
                    self.viewModel.filters.sortby = 10;
                }

                self.showPager = true;
                self.pageNum = 1;
                self.getMatterList();
            }


            self.filterByUser = function (param) {
                self.displayMoreButton = true;
                self.displayALlButton = true;
                self.selectionModel.allMatter = param;
                self.showPager = true;
                self.pageNum = 1;
                self.getMatterList();
            };

            //filter by status specified at the top(with counts All,Arbitration etc...)
            self.applyStatusFilter = function (filter) {
                self.selectionModel.statusName = 'Ongoing';
            };

            self.getMatterList = function (getAll) {
                setMultiSelectFilter();
                self.viewModel.filters.pageNum = getAll ? 1 : self.pageNum;
                setUserFilter();
                //init clicked row index
                self.clickedRow = -1;
                var filterObj = allMatterListReportHelper.getFiltersObj(self.viewModel.filters, getAll, self.viewModel.masterList, self.viewModel.includeArchived, self.viewModel.activeMatter);
                persistFilters();
                var promesa = reportFactory.getMatterList(filterObj, self.selectionModel.allMatter);
                promesa.then(function (data) {
                    processData(data);
                    data = data && data.matters ? data.matters : [];
                    if (data && data.length > 0) {
                        if (data.length < 250) {
                            self.showPager = false;
                        }
                    } else {
                        self.showPager = false;
                    }
                    self.total = (utils.isNotEmptyVal(data.current_case_count)) ? parseInt(data.current_case_count) : 0;
                    utils.replaceNullByEmptyStringArray(data);
                    self.display.matterListReceived = true;
                    matterList = data; //store all matters locally, this list will be used while client side filtering
                    allMatterListReportHelper.setModifiedDisplayDate(matterList);
                    self.viewModel.matters = data;
                    self.viewModel.matters = _.uniq(self.viewModel.matters, 'matter_id');
                    //deselect all matters
                    self.clxGridOptions.selectAll = false;
                    self.clxGridOptions.selectedItems = [];
                    delete self.viewModel.filters.lastMatterId;
                }, function (reason) { });

                //var count = reportFactory.getMatterListCount(filterObj, self.selectionModel.allMatter);
                //count.then(function (res) { self.total = res.data.current_case_count; });
            };

            function processData(data) {
                _.forEach(data.matters, function (item) {
                    item.plaintiff_name = (angular.isUndefined(item.plaintiff) || utils.isNotEmptyVal(item.plaintiff)) ? item.plaintiff.plaintiff_name : '-';
                    item.courtVenue = utils.isNotEmptyVal(item.court.courtVenue) ? item.court.courtVenue : '';
                    item.courtName = utils.isNotEmptyVal(item.court.courtName) ? item.court.courtName : '';
                    item.courtJurisdiction = utils.isNotEmptyVal(item.court.courtJurisdiction) ? item.court.courtJurisdiction : '';
                    item.category = utils.isNotEmptyVal(item.category) ? item.category : '-';
                    // US#17757: Referral Differentiation in All Matter Report
                    if(utils.isNotEmptyVal(item.referred_by)){
                        item.referred_to =  utils.isNotEmptyVal(item.referred_to)  ? item.referred_to + ' , ' : '-';  
                    } else {
                        item.referred_to =  utils.isNotEmptyVal(item.referred_to)  ? item.referred_to : '-';  
                    }
                    item.referred_by =  utils.isNotEmptyVal(item.referred_by)  ? item.referred_by  : '-';  
                });
                utils.replaceNullByEmptyStringArray(data.matters);
            }

            self.getAllMatterList = function () {
                self.displayALlButton = false;
                self.getMatterList(99999);
                self.showPager = false;
            }

            //ensure to set other filter values while fetching next data
            function setMultiSelectFilter() {
                var postArray = ['substatusFilter', 'categoryFilter', 'statusFilter', 'typeFilter', 'subTypeFilter', 'venueFilter', 'lawtypeFilter'];
                var valKey = ['substatus', 'categories', 'statuses', 'types', 'subtypes', 'venues', 'law-types'];
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
                if (utils.isEmptyVal(self.viewModel.userFilter.paralegal)) {
                    self.viewModel.filters.paralegal = '';
                } else {
                    self.viewModel.filters.paralegal = self.viewModel.userFilter.paralegal;
                }


                if (utils.isEmptyVal(self.viewModel.userFilter.staff)) {
                    self.viewModel.filters.staff = '';
                } else {
                    self.viewModel.filters.staff = self.viewModel.userFilter.staff;
                }

                if (utils.isEmptyVal(self.viewModel.userFilter.leadAttorney)) {
                    self.viewModel.filters.leadAttorney = '';
                } else {
                    self.viewModel.filters.leadAttorney = self.viewModel.userFilter.leadAttorney;
                }

                if (utils.isEmptyVal(self.viewModel.userFilter.attorney)) {
                    self.viewModel.filters.attorney = '';
                } else {
                    self.viewModel.filters.attorney = self.viewModel.userFilter.attorney;
                }

                if (utils.isEmptyVal(self.viewModel.dateFilter)) {
                    self.viewModel.filters.dateFilter = '';
                } else {
                    self.viewModel.filters.dateFilter = self.viewModel.dateFilter;
                }

                self.viewModel.filters.referToFilterId = utils.isNotEmptyVal(self.viewModel.userFilter.referToFilterId) ?
                    self.viewModel.userFilter.referToFilterId.contactid : '';

                self.viewModel.filters.referByFilterId = utils.isNotEmptyVal(self.viewModel.userFilter.referByFilterId) ?
                    self.viewModel.userFilter.referByFilterId.contactid : '';

                self.viewModel.filters.allMatter = self.selectionModel.allMatter;
            }


            function getNextMatterList() {
                setMultiSelectFilter();
                self.pageNum = self.pageNum + 1;
                self.viewModel.filters.pageNum = self.pageNum;
                setUserFilter();
                var filterObj = allMatterListReportHelper.getFiltersObj(self.viewModel.filters, '', self.viewModel.masterList, self.viewModel.includeArchived, self.viewModel.activeMatter);
                var promesa = reportFactory.getMatterList(filterObj, self.selectionModel.allMatter);
                promesa.then(function (data) {
                    data = data && data.matters ? data.matters : [];
                    // if (data.length < 80) {
                    //     self.displayMoreButton = false;
                    // }
                    if (data && data.length > 0) {
                        if (data.length < 250) {
                            self.showPager = false;
                        }
                    } else {
                        self.showPager = false;
                    }
                    allMatterListReportHelper.setModifiedDisplayDate(data);
                    _.forEach(data, function (item) {
                        // US#17757: Referral Differentiation in All Matter Report
                        if(utils.isNotEmptyVal(item.referred_by)){
                            item.referred_to =  utils.isNotEmptyVal(item.referred_to)  ? item.referred_to + ', ' : '-';  
                        } else {
                            item.referred_to =  utils.isNotEmptyVal(item.referred_to)  ? item.referred_to : '-';  
                        }
                        item.referred_by =  utils.isNotEmptyVal(item.referred_by)  ? item.referred_by  : '-';
                        matterList.push(item); //list of received
                        self.viewModel.matters = matterList; //data to be displayed
                        self.viewModel.matters = _.uniq(self.viewModel.matters, 'matter_id');
                    });
                    delete self.viewModel.filters.lastMatterId;
                }, function (reason) {

                });
            };


            self.exportMatterReport = function () {
                setMultiSelectFilter();
                setUserFilter();
                self.viewModel.filters.pageNum = self.viewModel.filters.pageNum == 1 ? self.viewModel.filters.pageNum : 1;

                var filterObj = allMatterListReportHelper.getFiltersObj(self.viewModel.filters, 10000, self.viewModel.masterList, self.viewModel.includeArchived, self.viewModel.activeMatter);

                var allMatter = self.selectionModel.allMatter;
                reportFactory.matterReportExport(filterObj, self.viewModel.filters, allMatter)
                    .then(function (response) {
                        utils.downloadFile(response.data, "Report_All_Matter_List.xlsx", response.headers("Content-Type"));
                    });
            };

            self.print = function () {
                setMultiSelectFilter();
                self.viewModel.filters.pageNum = 1;
                setUserFilter();
                var filterObj = allMatterListReportHelper.getFiltersObj(self.viewModel.filters, '', self.viewModel.masterList, self.viewModel.includeArchived, self.viewModel.activeMatter);
                filterObj.pageSize = 10000;
                var promesa = reportFactory.getMatterList(filterObj, self.selectionModel.allMatter);
                promesa.then(function (data) {
                    processDataForPrint(data);
                    data = data && data.matters ? data.matters : [];
                    utils.replaceNullByEmptyStringArray(data);
                    var filterDisplayObj = setFilterDisplayObj(self.viewModel.filters);
                    setIntakeDate(data);
                    data = _.uniq(data, 'matter_id');
                    reportFactory.printMatters(data, filterDisplayObj);
                }, function (reason) { });
            };

            function processDataForPrint(data) {
                _.forEach(data.matters, function (item) {
                    item.plaintiff_name = (angular.isUndefined(item.plaintiff) || utils.isNotEmptyVal(item.plaintiff)) ? item.plaintiff.plaintiff_name : '-';
                    item.courtVenue = utils.isNotEmptyVal(item.court.courtVenue) ? item.court.courtVenue : '';
                    item.courtName = utils.isNotEmptyVal(item.court.courtName) ? item.court.courtName : '';
                    item.courtJurisdiction = utils.isNotEmptyVal(item.court.courtJurisdiction) ? item.court.courtJurisdiction : '';
                    item.category = utils.isNotEmptyVal(item.category) ? item.category : '-';
                });
                utils.replaceNullByEmptyStringArray(data.matters);
            }

            function setIntakeDate(matterList) {
                _.forEach(matterList.matters, function (data) {
                    if ((angular.isDefined(data.intake_date)) && !_.isNull(data.intake_date) && (parseInt(data.intake_date) !== 0) && !utils.isEmptyString(data.intake_date)) {
                        data.intake_date = moment.unix(data.intake_date).utc().format('MM/DD/YYYY');
                    } else {
                        data.intake_date = " - ";
                    }

                    if ((angular.isDefined(data.date_of_incidence)) && !_.isNull(data.date_of_incidence) && (parseInt(data.date_of_incidence) !== 0) && !utils.isEmptyString(data.date_of_incidence)) {
                        data.date_of_incidence = moment.unix(data.date_of_incidence).utc().format('MM/DD/YYYY');
                    } else {
                        data.date_of_incidence = " - ";
                    }

                });
                //formate created date to MM/DD/YYYY for print
                _.forEach(matterList, function (data) {
                    if ((angular.isDefined(data.matter_created_date)) && !_.isNull(data.matter_created_date) && (parseInt(data.matter_created_date) !== 0) && !utils.isEmptyString(data.matter_created_date)) {
                        data.matter_created_date = matterFactory.getFormatteddate(data.matter_created_date);
                    } else {
                        data.matter_created_date = " - ";
                    }
                });

                //formate date closed to MM/DD/YYYY for print
                _.forEach(matterList, function (data) {
                    if ((angular.isDefined(data.closed_date)) && !_.isNull(data.closed_date) && (parseInt(data.closed_date) !== 0) && !utils.isEmptyString(data.closed_date)) {
                        data.closed_date = matterFactory.getFormatteddate(data.closed_date);
                    } else {
                        data.closed_date = " - ";
                    }
                });

                //formate settled date to MM/DD/YYYY for print
                _.forEach(matterList, function (data) {
                    if ((angular.isDefined(data.settled_date)) && !_.isNull(data.settled_date) && (parseInt(data.settled_date) !== 0) && !utils.isEmptyString(data.settled_date)) {
                        data.settled_date = matterFactory.getFormatteddate(data.settled_date);
                    } else {
                        data.settled_date = " - ";
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
                setDateRangeFilterForPrint(filterObj);
                setSortByFilterForPrint(filterObj);

                return filterObj;
            }

            function setStatusFiltersForPrint(filterObj) {

                var postArray = ['categoryFilter', 'statusFilter', 'typeFilter', 'venueFilter', 'lawtypeFilter'];
                var valKey = ['category', 'statuses', 'type', 'venues', 'law-types'];

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
                                return item.id === id;
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

                var subtypes = typeObj['sub-type'];
                var selectedSubtypesIds = self.viewModel.filters.subTypeFilter.split(',');
                var subtypesNames = [];
                _.forEach(selectedSubtypesIds, function (selsubstatusId) {
                    var subtype = _.find(subtypes, function (subtype) {
                        return subtype.id == selsubstatusId
                    });
                    subtypesNames.push(subtype.name);
                });

                //set filter object
                filterObj.subtype = {
                    name: 'SUBTYPES',
                    data: subtypesNames
                };
            }


            function setSubstatusFilterForPrint(filterObj) {
                if (utils.isEmptyVal(self.viewModel.filters.substatusFilter)) {
                    return;
                }
                var statusId = self.viewModel.filters.statusFilter instanceof Array ? self.viewModel.filters.statusFilter : self.viewModel.filters.statusFilter.split(',');
                var masterList = self.viewModel.masterList;

                var statusObj = [];
                _.forEach(statusId, function (item) {
                    _.forEach(masterList.statuses, function (currentItem) {
                        if (item == currentItem.id) {
                            statusObj.push(currentItem);
                        }
                    })
                })
                var selectedSubstatuses;
                selectedSubstatuses = _.pluck(statusObj, 'sub-status');
                var substatusesIds = utils.isNotEmptyVal(self.viewModel.filters.substatusFilter) ? self.viewModel.filters.substatusFilter.split(',') : filters.substatusFilter;



                //get substatus names
                var subStObj = [];
                _.forEach(substatusesIds, function (subStId) {
                    _.forEach(selectedSubstatuses, function (currentItem) {
                        _.forEach(currentItem, function (item) {
                            if (subStId == item.id) {
                                if (utils.isEmptyString(item.name)) {
                                    item.name = '{Blank}';
                                }
                                subStObj.push(item.name);
                            }
                        })
                    })

                });
                filterObj.substatus = {
                    name: 'SUBSTATUS',
                    data: subStObj
                };
            }

            function setUserAssignmentFilterPrint(filterObj) {

                var userFilterObj = {};
                userFilterObj.leadAttorney = {};
                userFilterObj.attorney = {};
                userFilterObj.staff = {};
                userFilterObj.paralegal = {};

                if (angular.isDefined(self.viewModel.userFilter.leadAttorney) && self.viewModel.userFilter.leadAttorney != '') {
                    _.forEach(self.viewModel.userList, function (data) {
                        if (angular.isDefined(data.attorny)) {
                            _.forEach(data.attorny, function (data) {
                                if (self.viewModel.userFilter.leadAttorney == data.uid) {
                                    userFilterObj.leadAttorney.id = data.uid;
                                    userFilterObj.leadAttorney.name = utils.isNotEmptyVal(data.name) ? (data.name + " ") : "";
                                    userFilterObj.leadAttorney.name += utils.isNotEmptyVal(data.lname) ? data.lname : "";
                                }
                            });
                        }
                    });
                } else {
                    userFilterObj.leadAttorney.name = '';
                }

                if (angular.isDefined(self.viewModel.userFilter.attorney) && self.viewModel.userFilter.attorney != '') {
                    _.forEach(self.viewModel.userList, function (data) {
                        if (angular.isDefined(data.attorny)) {
                            _.forEach(data.attorny, function (data) {
                                if (self.viewModel.userFilter.attorney == data.uid) {
                                    userFilterObj.attorney.id = data.uid;
                                    userFilterObj.attorney.name = utils.isNotEmptyVal(data.name) ? (data.name + " ") : "";
                                    userFilterObj.attorney.name += utils.isNotEmptyVal(data.lname) ? data.lname : "";
                                }
                            });
                        }
                    });
                } else {
                    userFilterObj.attorney.name = '';
                }

                if (angular.isDefined(self.viewModel.userFilter.staff) && self.viewModel.userFilter.staff != '') {
                    _.forEach(self.viewModel.userList, function (data) {
                        if (angular.isDefined(data.staffonly)) {
                            _.forEach(data.staffonly, function (data) {
                                if (self.viewModel.userFilter.staff == data.uid) {
                                    userFilterObj.staff.id = data.uid;
                                    userFilterObj.staff.name = utils.isNotEmptyVal(data.name) ? (data.name + " ") : "";
                                    userFilterObj.staff.name += utils.isNotEmptyVal(data.lname) ? data.lname : "";
                                }
                            });
                        }
                    });
                } else {
                    userFilterObj.staff.name = '';
                }

                if (angular.isDefined(self.viewModel.userFilter.paralegal) && self.viewModel.userFilter.paralegal != '') {
                    _.forEach(self.viewModel.userList, function (data) {
                        if (angular.isDefined(data.paralegal)) {
                            _.forEach(data.paralegal, function (data) {
                                if (self.viewModel.userFilter.paralegal == data.uid) {
                                    userFilterObj.paralegal.id = data.uid;
                                    userFilterObj.paralegal.name = utils.isNotEmptyVal(data.name) ? (data.name + " ") : "";
                                    userFilterObj.paralegal.name += utils.isNotEmptyVal(data.lname) ? data.lname : "";
                                }
                            });
                        }
                    });
                } else {
                    userFilterObj.paralegal.name = '';
                }

                userFilterObj.referredto = utils.isNotEmptyVal(self.viewModel.userFilter.referToFilterId) ?
                    self.viewModel.userFilter.referToFilterId.name : ' - ';

                userFilterObj.referredby = utils.isNotEmptyVal(self.viewModel.userFilter.referByFilterId) ?
                    self.viewModel.userFilter.referByFilterId.name : ' - ';


                filterObj.paralegal = {
                    name: "PARALEGAL",
                    data: userFilterObj.paralegal.name
                };

                filterObj.staff = {
                    name: "STAFF",
                    data: userFilterObj.staff.name
                };

                filterObj.leadAttorney = {
                    name: "LEAD ATTORNEY",
                    data: userFilterObj.leadAttorney.name
                };

                filterObj.Attorney = {
                    name: "ATTORNEY",
                    data: userFilterObj.attorney.name
                };

                filterObj.referredTo = {
                    name: "REFERRED TO",
                    data: userFilterObj.referredto
                };

                filterObj.referredBy = {
                    name: "REFERRED BY",
                    data: userFilterObj.referredby
                };
                filterObj.archivalMatters = {
                    name: "INCLUDE ARCHIVED MATTERS",
                    data: self.viewModel.includeArchived == 1 ? 'Yes' : '-'
                }
                filterObj.activeMatters = {
                    name: "SHOW ACTIVE MATTERS ONLY",
                    data: self.viewModel.activeMatter == 1 ? 'Yes' : '-'
                }
            }

            function setDateRangeFilterForPrint(filterObj) {
                if (utils.isNotEmptyVal(self.viewModel.filters.s)) {
                    var tagLabel = "";
                    tagLabel = moment.unix(self.viewModel.filters.s).utc().format('MM/DD/YYYY') + ' to ' + moment.unix(self.viewModel.filters.e).utc().format('MM/DD/YYYY');

                    filterObj.dateRange = {
                        name: 'DATE RANGE',
                        data: 'from ' + tagLabel
                    };
                } else {
                    filterObj.dateRange = {
                        name: 'DATE RANGE',
                        data: 'from ' + ' - ' + ' to ' + ' - '
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
                    name: 'Sort By ',
                    data: sortbyName
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
                var promesa = reportFactory.getMaster();
                promesa.then(function (data) {
                    self.viewModel.masterList = data;
                }, function (reason) {

                });
            }

            self.init();

        }
    ]);
})();


(function () {
    angular.module('cloudlex.report')
        .factory('allMatterListReportHelper', allMatterListReportHelper);
    allMatterListReportHelper.$inject = ['matterFactory'];

    function allMatterListReportHelper(matterFactory) {
        return {
            setModifiedDisplayDate: setModifiedDisplayDate,
            getGridHeaders: getGridHeaders,
            isMatterSelected: isMatterSelected,
            getFiltersObj: getFiltersObj,
            //setStatuswiseFilter: setStatuswiseFilter,
            createFilterTags: createFilterTags
        }

        function setModifiedDisplayDate(matterList) {
            _.forEach(matterList, function (matter) {
                if (angular.isDefined(matter.intake_date)) {
                    if (matter.intake_date != '' && matter.intake_date != 0 && matter.intake_date != null) {
                        matter.intake_date = moment.unix(matter.intake_date).utc().format('DD MMM YYYY');
                    } else {
                        matter.intake_date = '-';
                    }
                } else {
                    matter.intake_date = '-';
                }

                //using in temperory till the time didn't get intake_date from backend
                //matter.intake_date = '';

                if (angular.isDefined(matter.date_of_incidence)) {
                    if (matter.date_of_incidence != '' && matter.date_of_incidence != 0 && matter.date_of_incidence != null) {
                        matter.date_of_incidence = moment.unix(matter.date_of_incidence).utc().format('DD MMM YYYY');
                    } else {
                        matter.date_of_incidence = '-';
                    }
                } else {
                    matter.date_of_incidence = '-';
                }
                //check for created date : convert to DD MMM YYYY format to display on grid
                if (angular.isDefined(matter.matter_created_date)) {
                    if (matter.matter_created_date != '' && matter.matter_created_date != 0 && matter.matter_created_date != null) {
                        matter.matter_created_date = moment.unix(matter.matter_created_date).format('DD MMM YYYY');
                    } else {
                        matter.matter_created_date = '-';
                    }
                } else {
                    matter.matter_created_date = '-';
                }

                //check for created date : convert to DD MMM YYYY format to display on grid
                if (angular.isDefined(matter.closed_date)) {
                    if (matter.closed_date != '' && matter.closed_date != 0 && matter.closed_date != null) {
                        matter.closed_date = moment.unix(matter.closed_date).format('DD MMM YYYY');
                    } else {
                        matter.closed_date = '-';
                    }
                } else {
                    matter.closed_date = '-';
                }

                //check for  date settled : convert to DD MMM YYYY format to display on grid
                if (angular.isDefined(matter.settled_date)) {
                    if (matter.closed_date != '' && matter.settled_date != 0 && matter.settled_date != null) {
                        matter.settled_date = moment.unix(matter.settled_date).format('DD MMM YYYY');
                    } else {
                        matter.settled_date = '-';
                    }
                } else {
                    matter.settled_date = '-';
                }



            });
        }

        function getGridHeaders() {
            return [{
                field: [{
                    prop: 'matter_name',
                    href: { link: '#/matter-overview', paramProp: ['matter_id'] }
                },
                {
                    prop: 'file_number',
                    label: 'File#'
                },
                {
                    prop: 'index_number',
                    label: 'Index/Docket#'
                }
                ],
                displayName: 'Matter Name, File Number, Index/Docket#',
                dataWidth: 10
            },
            {
                field: [{
                    prop: 'date_of_incidence'
                    //href: '#/matter-overview'
                },
                {
                    prop: 'intake_date'
                },
                {
                    prop: 'matter_created_date'
                },
                {
                    prop: 'closed_date'
                },
                {
                    prop: 'settled_date'
                }
                ],
                //displayName: 'Date of Incident, Intake Date & Date Created',
                displayName: 'DOI, Intake, Created, Closed, Settled',
                dataWidth: 9
            },
            {
                field: [{
                    prop: 'type',
                    template: 'bold',
                    filter: 'replaceByDash'
                }, {
                    prop: 'sub_type',
                    filter: 'replaceByDash'
                },
                {
                    prop: 'category',
                    filter: 'replaceByDash'
                },
                {
                    prop: 'law_type_name',
                    filter: 'replaceByDash'
                }
                ],
                displayName: 'Type, Subtype, Category & Law-Type',
                dataWidth: 12

            },
            {
                field: [{
                    prop: 'status',
                    template: 'bold',
                    filter: 'replaceByDash'
                },
                {
                    prop: 'sub_status',
                    filter: 'replaceByDash'
                }
                ],
                displayName: 'Status & Substatus',
                dataWidth: 9

            },
            {
                field: [{
                    prop: 'plaintiff_name' //plaintiff column added on grid
                }],
                displayName: 'Plaintiff Name',
                dataWidth: 9

            },
            {
                field: [{
                    prop: 'courtName'
                },
                {
                    prop: 'courtVenue'
                }
                ],
                displayName: 'Court & Venue',
                dataWidth: 8

            },
            {
                field: [{
                    prop: 'matter_lead_attorney'
                }],
                displayName: 'Lead Attorney',
                dataWidth: 8

            },
            {
                field: [{
                    prop: 'matter_attorney'
                }],
                displayName: 'Attorney',
                dataWidth: 8

            },
            {
                field: [{
                    prop: 'matter_staffs'
                }],
                displayName: 'Assigned Staff',
                dataWidth: 9

            },
            {
                field: [{
                    prop: 'matter_paralegals'
                }],
                displayName: 'Assigned Paralegal',
                dataWidth: 8

            },
            {
                field: [{
                    prop: 'referred_to'
                },
                {
                    prop: 'referred_by'
                }],
                displayName: 'Referred To & Referred By',
                dataWidth: 9

            }
            ];
        }

        function isMatterSelected(matterList, matter) {
            var ids = _.pluck(matterList, 'matter_id');
            return ids.indexOf(matter.matter_id) > -1;
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
                    _.forEach(masterList.statuses, function (currentItem) {
                        if (item == currentItem.id) {
                            getStatusAndSubStatus.push(currentItem);
                        }
                    })
                })
                //push selected status and all substatus in an array
                var selectedSubStatus = [];
                _.forEach(getStatusAndSubStatus, function (currentItem) {
                    _.forEach(currentItem["sub-status"], function (currentI) {
                        var subStatusDetail = angular.copy(currentI);
                        subStatusDetail.statusid = currentItem.id;
                        subStatusDetail.statusname = currentItem.name;
                        selectedSubStatus.push(subStatusDetail);
                    })
                })
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
                        var evens = _.filter(masterList.statuses, function (rec) { return rec.id == item; });
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
                    return { statusid: key, subStatusid: group_to_values[key] };
                });


                _.forEach(statusFilter, function (item) {
                    item.subStatusid = item.subStatusid.toString();
                })
            }
            return statusFilter;
        }
        function getFiltersObj(filters, getAll, masterList, archivalFilter, activeMatters) {
            var formattedFilters = {};

            formattedFilters.isMyMatter = filters.allMatter;

            //var statusFilter = getStatusFilter(filters,masterList);
            formattedFilters.statusFilter = utils.isNotEmptyVal(filters.statusFilter) ? JSON.stringify(getStatusFilter(filters, masterList)) : "";
            if (filters.lastMatterId) { formattedFilters.matter_id = filters.lastMatterId; }
            formattedFilters.typeFilter = angular.isDefined(filters.typeFilter) ? filters.typeFilter : "";
            formattedFilters.subtypeFilter = angular.isDefined(filters.subTypeFilter) ? filters.subTypeFilter : "";
            formattedFilters.lawtypeFilter = angular.isDefined(filters.lawtypeFilter) ? filters.lawtypeFilter : "";
            formattedFilters.categoryFilter = angular.isDefined(filters.categoryFilter) ? filters.categoryFilter : "";
            formattedFilters.venueFilter = angular.isDefined(filters.venueFilter) ? filters.venueFilter : "";
            formattedFilters.includeArchived = archivalFilter;
            formattedFilters.isActive = activeMatters;
            formattedFilters.from = filters.from;
            formattedFilters.start = angular.isDefined(filters.s) ? filters.s : "";
            formattedFilters.end = angular.isDefined(filters.e) ? filters.e : "";
            formattedFilters.sortby = filters.sortby;

            if (angular.isDefined(filters.leadAttorney)) {
                formattedFilters.leadAttorney = filters.leadAttorney
            } else {
                formattedFilters.leadAttorney = '';
            }

            if (angular.isDefined(filters.attorney)) {
                formattedFilters.attorney = filters.attorney
            } else {
                formattedFilters.attorney = '';
            }

            if (angular.isDefined(filters.staff)) {
                formattedFilters.staff = filters.staff
            } else {
                formattedFilters.staff = '';
            }

            if (angular.isDefined(filters.paralegal)) {
                formattedFilters.paralegal = filters.paralegal
            } else {
                formattedFilters.paralegal = '';
            }
            //self.viewModel.filters.dateFilter =
            if (angular.isDefined(filters.dateFilter) && filters.dateFilter != null && filters.dateFilter != '' && filters.dateFilter != 0) {
                if (filters.dateFilter == "Intake Date") {
                    formattedFilters.dateFilter = "dateIntake";
                } else if (filters.dateFilter == "Date of incident") {
                    formattedFilters.dateFilter = "dateIncident";
                } else if (filters.dateFilter == "Date Created") {
                    formattedFilters.dateFilter = "dateCreated";
                } else if (filters.dateFilter == "Date Closed") {
                    formattedFilters.dateFilter = "dateClosed";
                }
                else if (filters.dateFilter == "Date Settled") {
                    formattedFilters.dateFilter = "dateSettled";
                } else {
                    formattedFilters.dateFilter = "";
                }

            } else {
                formattedFilters.dateFilter = "";
            }
            formattedFilters.pageSize = 250;

            if (utils.isNotEmptyVal(getAll)) {
                formattedFilters.pageSize = getAll;
            }

            formattedFilters.referToFilterId = filters.referToFilterId;
            formattedFilters.referByFilterId = filters.referByFilterId;

            formattedFilters.pageNum = filters.pageNum;

            return formattedFilters;
        };

        function getArrayString(array) {
            var str = (array != null ? array.toString() : "");
            return "[" + str + "]";
        };



        function createFilterTags(filters, masterList, userFilters, userList, dateFilter, archivalMatters, activeMatters) {
            var tags = [];
            var filterArray = [
                { type: 'categories', list: 'category', filter: 'categoryFilter', tagname: 'Category' },
                { type: 'statuses', list: 'statuses', filter: 'statusFilter', tagname: 'Status' },
                { type: 'types', list: 'type', filter: 'typeFilter', tagname: 'Type' },
                { type: 'venues', list: 'venues', filter: 'venueFilter', tagname: 'Venue' },
                { type: 'law-types', list: 'law-types', filter: 'lawtypeFilter', tagname: 'Law-Type' }
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

            //--------------
            var leadAttorney = {};
            var staff = {};
            var paralegal = {};
            var attorney = {};

            if (utils.isNotEmptyVal(filters.leadAttorney) && filters.leadAttorney != '') {
                _.forEach(userList, function (data) {
                    if (angular.isDefined(data.attorny)) {
                        _.forEach(data.attorny, function (data) {
                            if (filters.leadAttorney == data.uid) {
                                leadAttorney.key = data.uid;
                                leadAttorney.type = "Lead Attorney";
                                leadAttorney.value = "Lead Attorney: " + data.name;
                                tags.push(leadAttorney);
                            }
                        });
                    }
                });
            }

            if (utils.isNotEmptyVal(filters.attorney) && filters.attorney != '') {
                _.forEach(userList, function (data) {
                    if (angular.isDefined(data.attorny)) {
                        _.forEach(data.attorny, function (data) {
                            if (filters.attorney == data.uid) {
                                attorney.key = data.uid;
                                attorney.type = "Attorney";
                                attorney.value = "Attorney: " + data.name;
                                tags.push(attorney);
                            }
                        });
                    }
                });
            }

            if (utils.isNotEmptyVal(filters.staff) && filters.staff != '') {
                _.forEach(userList, function (data) {
                    if (angular.isDefined(data.staffonly)) {
                        _.forEach(data.staffonly, function (data) {
                            if (filters.staff == data.uid) {
                                staff.key = data.uid;
                                staff.type = "Staff";
                                staff.value = "Staff: " + data.name;
                                tags.push(staff);
                            }
                        });
                    }
                });
            }

            if (utils.isNotEmptyVal(filters.paralegal) && filters.paralegal != '') {
                _.forEach(userList, function (data) {
                    if (angular.isDefined(data.paralegal)) {
                        _.forEach(data.paralegal, function (data) {
                            if (filters.paralegal == data.uid) {
                                paralegal.key = data.uid;
                                paralegal.type = "Paralegal";
                                paralegal.value = "Paralegal: " + data.name;
                                tags.push(paralegal);
                            }
                        });
                    }
                });
            }

            //-------------------

            if (utils.isNotEmptyVal(filters.tag)) {
                var filterDisplay = '';
                filterDisplay = utils.isNotEmptyVal(dateFilter) ? dateFilter + ' : ' : '';
                //Bug# 5444 for custom dates date range added  
                if (filters.tag == 'custom dates') {
                    var s = moment.unix(filters.s).utc().format('MM-DD-YYYY');
                    var e = moment.unix(filters.e).utc().format('MM-DD-YYYY');

                    filterDisplay += s + ' to: ' + e;
                    var filterObj = { value: filterDisplay, id: filters.tag };
                    tags.push(filterObj);
                } else {
                    filterDisplay += filters.tag;
                    var filterObj = { value: filterDisplay, id: filters.tag };
                    tags.push(filterObj);
                }
            }

            if (utils.isNotEmptyVal(userFilters.referByFilterId)) {
                var referByFilter = {
                    value: "Referred by: " + userFilters.referByFilterId.name,
                    type: "referByFilterId"
                };

                tags.push(referByFilter);
            }

            if (utils.isNotEmptyVal(userFilters.referToFilterId)) {
                var referToFilter = {
                    value: "Referred to: " + userFilters.referToFilterId.name,
                    type: "referToFilterId"
                };

                tags.push(referToFilter);
            }
            if (archivalMatters == 1) {
                var archivalTag = {
                    value: "Include Archived Matters",
                    type: "archivalFilter"
                }
                tags.push(archivalTag);
            }
            if (activeMatters == 1) {
                var archivalTag = {
                    value: "Show Active Matters Only",
                    type: "activeMatters"
                }
                tags.push(archivalTag);
            }

            return tags;
        }


        function setSubstatusFilter(tags, masterList, filters) {
            var statusId = filters.statusFilter instanceof Array ? filters.statusFilter : filters.statusFilter.split(',');
            var statusObj = [];
            _.forEach(statusId, function (item) {
                _.forEach(masterList.statuses, function (currentItem) {
                    if (item == currentItem.id) {
                        statusObj.push(currentItem);
                    }
                })
            })
            if (utils.isEmptyVal(statusObj)) {
                return;
            }
            var selectedSubstatuses;
            selectedSubstatuses = _.pluck(statusObj, 'sub-status');
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
                        value: 'Sub-Status: ' + subSt.name
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

            var selectedSubtypes = typeObj['sub-type'];
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
                    value: 'Sub-Type: ' + subTypObj.name
                };
                tags.push(tagObj);
            });
        }

        function getFilterValues(masterList, filter, type) {
            if (filter != 'lawtype') {
                return masterList[filter].map(function (item) {
                    return {
                        key: item.id,
                        value: item.name,
                        type: type || ''
                    };
                });
            }
        }

        function excludeTags(tags, toBeExcluded) {
            delete toBeExcluded[""];
            angular.forEach(toBeExcluded, function (val, key) {
                var key = val.id;
                var excludeTag = _.find(tags, function (tag) {
                    return parseInt(tag.key) === parseInt(key);
                });

                if (angular.isDefined(excludeTag)) {
                    if (excludeTag.type !== 'statuses') { return; }
                    var keys = _.pluck(tags, 'key');
                    var index = keys.indexOf(excludeTag.key);
                    tags.splice(index, 1);
                }
            });
        }
    }

})();
