(function () {
    'use strict';

    angular.module('cloudlex.report').controller('MatterInTookByDateCtrl', ['$scope', 'reportFactory', '$state', '$modal', 'masterData', 'matterInTookBtDateHelper',
        function ($scope, reportFactory, $state, $modal, masterData, matterInTookBtDateHelper) {

            //event fired when the drawer opens
            $scope.$on('drawer-opened', function () {
                if (angular.isDefined(matterList) && matterList.length > 0) {
                    self.viewModel.matters = matterList.slice(0, 10);
                }
            });

            //on clicking on body we close the drawer
            $scope.$on('drawer-closed', function () {
                if (angular.isDefined(matterList) && matterList.length > 0) {
                    self.viewModel.matters = matterList;
                }
            });

            var self = this;
            var matterList = [];
            var allDisplayStatuses = {},
                pageSize = 250,
                initMatterLimit = 15;

            //dateFlag
            self.matterInTookByDateFlag = true;
            self.dateFieldValue = 3;
            var masterDataObj = masterData.getMasterData();
            //initialization start

            self.sorts = [{ order: 'ASC', param: "matter_name_asc", name: 'Matter name ASC', value: '1' },
            { order: 'DESC', param: "matter_name_desc", name: 'Matter name DESC ', value: '3' },
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
                var viewModel = sessionStorage.getItem("matterIntookReportViewModel");
                var selectionModel = sessionStorage.getItem("matterIntookReportSelectionModel");


                if (utils.isNotEmptyVal(viewModel) || utils.isNotEmptyVal(selectionModel)) {
                    try {
                        self.viewModel = JSON.parse(viewModel);
                        self.viewModel.matters = [];
                        self.selectedSort = _.find(self.sorts, function (sort) {
                            return self.viewModel.filters.sortby == sort.param && self.viewModel.filters.sortorder == sort.order;
                        }).name;

                        self.selectionModel = JSON.parse(selectionModel);
                        self.tags = matterInTookBtDateHelper.createFilterTags(self.viewModel.filters, masterDataObj, {});
                    } catch (e) {
                        initModels();
                    }
                } else {
                    initModels();
                }

                getData();
                //display object for managing the display
                self.display = {
                    filtered: true,
                    matterListReceived: false,
                    matterSelected: {}
                };
                self.clxGridOptions = {
                    headers: matterInTookBtDateHelper.getGridHeaders(),
                    selectedItems: []
                };
            }

            self.scrollReachedTop = function () {
                if (self.matterLimit < self.total) {
                    self.matterLimit = initMatterLimit;
                }
            };

            self.scrollReachedBottom = function () {
                self.matterLimit += initMatterLimit;
            };

            function persistFilters() {
                var selectionModel = angular.copy(self.selectionModel);
                var viewModel = angular.copy(self.viewModel);
                viewModel.filters.pagesize = pageSize;
                viewModel.filters.pagenum = 1;
                viewModel.matters = [];
                sessionStorage.setItem("matterIntookReportViewModel", JSON.stringify(viewModel));
                sessionStorage.setItem("matterIntookReportSelectionModel", JSON.stringify(selectionModel));
            }

            function initModels() {
                initViewModel();
                initSelectionModel();
            };

            function initViewModel() {
                self.viewModel = {
                    masterList: [],
                    statusWiseCounts: [],
                    statusWiseCountsMotion: [],
                    statusWiseCountsAll: []
                };
                self.viewModel.page = "GRIDVIEW";
                self.viewModel.matters = [];
                self.viewModel.filters = {
                    filterText: '',
                    useExternalFilter: true,
                    dateFilter: '',
                    eventype: '',
                    reportName: 'matterintakereport',
                    start: '',
                    end: '',
                    pagesize: pageSize,
                    pagenum: 1,
                    sortby: 1,
                    sortorder: 'ASC'
                };
            };

            self.modifyCell = function (el, field, data) {
                data[field.prop].trim() === '-' ? el.addClass('big-num-val-grid display-inline-block') : angular.noop();
            };

            self.oneMonthData = function (param) {
                self.dateFieldValue = param;
                var start = moment().subtract(1, 'months').startOf('day');
                self.viewModel.filters.start = moment(start).unix();
                var end = moment().endOf('day');
                self.viewModel.filters.end = moment(end).unix();
                self.viewModel.filters.pagenum = 1;
                getStatusWiseCounts();

            };

            self.sixMonthData = function (param) {
                self.dateFieldValue = param;
                var start = moment().subtract(6, 'months').startOf('day');
                self.viewModel.filters.start = moment(start).unix();
                var end = moment().endOf('day');
                self.viewModel.filters.end = moment(end).unix();
                self.viewModel.filters.pagenum = 1;
                getStatusWiseCounts();

            };

            self.lastYearData = function (param) {
                self.dateFieldValue = param;
                var start = moment().subtract(1, 'years').startOf('day');
                self.viewModel.filters.start = moment(start).unix();
                var end = moment().endOf('day');
                self.viewModel.filters.end = moment(end).unix();
                self.viewModel.filters.pagenum = 1;
                getStatusWiseCounts();
            };

            //select filters in the pop up
            self.customDate = function (param) {
                self.viewModel.filters.matterInTookByDateFlag = true;
                self.dateFieldValue = param;
                var modalInstance = $modal.open({
                    templateUrl: "app/report/customDate.html",
                    controller: "CustomDateCtrl",
                    size: 'sm',
                    resolve: {
                        params: function () {
                            return {
                                //masterData: self.viewModel.masterList,
                                filters: angular.copy(self.viewModel.filters)
                            };
                        }
                    }
                });
                modalInstance.result.then(function (selectedItem) {
                    //self.selectionModel.multiFilters = selectedItem;
                    self.viewModel.filters = selectedItem;
                    self.viewModel.filters.pagenum = 1;
                    self.applyMultiSelectFilter();
                });
            };

            function initSelectionModel() {
                self.selectionModel = {
                    statusName: "Ongoing",
                    statusWise: {},
                    allMatter: 1,
                    multiFilters: {
                        categories: [],
                        types: [],
                        subtypes: [],
                        venues: []
                    }
                };
            }

            function getData() {
                getStatusWiseCounts();
                //self.getMatterList();
                self.getMasterList();
            }
            //initialization end

            //display manager start
            self.highlightSelectedStatus = function (id) {
                if (angular.isUndefined(id)) {
                    return false;
                }
                if (angular.isUndefined(self.viewModel.filters.statusFilter)) {
                    return (self.selectionModel.statusWise.id === id);
                }
                if (self.viewModel.filters.statusFilter instanceof Array) {
                    if (self.viewModel.filters.statusFilter.length === 0) {
                        return (self.selectionModel.statusWise.id === id);
                    }
                    return self.viewModel.filters.statusFilter.indexOf(id) > -1;
                }
                return self.viewModel.filters.statusFilter.split(',').indexOf(id) > -1;
            }

            self.filterMatterIntookByDate = function () {
                var timeFilterObj;
                var filtercopy = angular.copy(self.viewModel.filters);
                filtercopy.end = (filtercopy.end) ? moment.unix(filtercopy.end).utc().format('MM/DD/YYYY') : '';
                filtercopy.start = (filtercopy.start) ? moment.unix(filtercopy.start).utc().format('MM/DD/YYYY') : '';

                if (angular.isDefined(filtercopy.tag)) {
                    timeFilterObj = {
                        tag: filtercopy.tag,
                        end: filtercopy.end,
                        start: filtercopy.start
                    };
                }




                var modalInstance = $modal.open({
                    templateUrl: 'app/report/allMatterList/filterPopUp/matterIntookByDate/matterIntookByDateFilter.html',
                    controller: 'FilterMatterIntookByDateCtrl as filter',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        params: function () {
                            return {
                                masterData: masterDataObj,
                                filters: angular.copy(self.selectionModel.multiFilters),
                                timeFilters: timeFilterObj,
                                tags: self.tags
                            };
                        }
                    }
                });

                modalInstance.result.then(function (filterObj) {
                    self.selectionModel.multiFilters = filterObj.selectionModel;

                    if (angular.isUndefined(filterObj.filters)) {
                        self.viewModel.filters.start = "";
                        self.viewModel.filters.end = "";
                        self.viewModel.filters.dateFilter = "";
                        self.viewModel.dateFilter = "";
                        self.viewModel.filters.tag = undefined;
                    } else {
                        self.viewModel.filters.start = filterObj.filters.start;
                        self.viewModel.filters.end = filterObj.filters.end;
                        self.viewModel.filters.tag = filterObj.filters.tag;
                        self.viewModel.dateFilter = filterObj.dateFilter;
                    }
                    self.viewModel.filters.pagenum = 1;
                    self.applyMultiSelectFilter();

                }, function () {

                });
            }

            self.clearFilters = function () {
                _.forEach(self.selectionModel.multiFilters, function (val, index) {
                    self.selectionModel.multiFilters[index] = [];
                });

                self.viewModel.filters.start = "";
                self.viewModel.filters.end = "";
                self.viewModel.filters.tag = undefined;
                self.viewModel.filters.pagenum = 1;
                self.viewModel.dateFilter = "";
                self.applyMultiSelectFilter();
            }

            self.editMatter = function (matterId) {
                $state.go('edit-matter', { matterId: matterId });
            }

            self.isMatterSelected = function (matter) {
                self.display.matterSelected[matter.matter_id] =
                    matterInTookBtDateHelper.isMatterSelected(self.clxGridOptions.selectedItems, matter);
                return self.display.matterSelected[matter.matter_id];
            }
            //display manager end

            //checkbox select state manager start
            self.selectAllMatters = function (selected) {
                if (selected) {
                    self.clxGridOptions.selectedItems = angular.copy(matterList);
                } else {
                    self.clxGridOptions.selectedItems = [];
                }
            };

            self.allMatterSelected = function () {
                return self.clxGridOptions.selectedItems.length === matterList.length;
            };

            self.applyFilterLazyLoading = function () {
                self.viewModel.filters.pagenum++;
                self.viewModel.filters.pagesize = pageSize;
                getNextMatterList();
            };

            self.applyMultiSelectFilter = function () {
                var postArray = ['categoryFilter', 'statusFilter', 'typeFilter', 'venueFilter'];
                var valKey = ['categories', 'statuses', 'types', 'venues'];
                _.each(postArray, function (val, index) {
                    var data = _.pluck(self.selectionModel.multiFilters[valKey[index]], "id").join();
                    if (!_.isEmpty(data)) {
                        self.viewModel.filters[val] = data;
                    } else {
                        self.viewModel.filters[val] = [];
                    }
                });

                self.tags = matterInTookBtDateHelper.createFilterTags(self.viewModel.filters, masterDataObj, {});
                self.getMatterList();
                self.viewModel.page = "GRIDVIEW";
            };

            self.tagCancelled = function (cancelled) {

                if (utils.isEmptyVal(cancelled)) { return; }

                if (utils.isNotEmptyVal(cancelled.id)) {
                    cancelled.id = cancelled.id.replace("Intake Date: ", "");
                }

                if (timeFilters.indexOf(cancelled.id) > -1) {
                    self.viewModel.filters.tag = undefined;
                    self.viewModel.filters.end = '';
                    self.viewModel.filters.start = '';
                    self.viewModel.dateFilter='';
                } else {
                    //get array of current filter of the cancelled type
                    var currentFilters = _.pluck(self.selectionModel.multiFilters[cancelled.type], 'id');
                    //remove the cancelled filter
                    var index = currentFilters.indexOf(cancelled.key);
                    self.selectionModel.multiFilters[cancelled.type].splice(index, 1);
                    //reassign the new filters
                }
                self.viewModel.filters.pagenum = 1;
                self.applyMultiSelectFilter();
            };

            //sort by filters
            self.applySortByFilter = function (sortBy) {
                self.selectedSort = sortBy.name;
                switch(sortBy.param){
                    case 'matter_name_asc':
                        self.viewModel.filters.sortby = 1;
                        self.viewModel.filters.sortorder = 'ASC';       
                        break;
                    case 'matter_name_desc':
                        self.viewModel.filters.sortby = 3;
                        self.viewModel.filters.sortorder = 'DESC';
                        break;
                    case 'intake_date_asc':
                        self.viewModel.filters.sortby = 4;
                        self.viewModel.filters.sortorder = 'ASC';
                        break;
                    case 'intake_date_desc':
                        self.viewModel.filters.sortby = 5;
                        self.viewModel.filters.sortorder = 'DESC';
                        break;
                    case 'dateofincidence_asc':
                        self.viewModel.filters.sortby = 6;
                        self.viewModel.filters.sortorder = 'ASC';
                        break;
                    case 'dateofincidence_desc':
                        self.viewModel.filters.sortby = 7;
                        self.viewModel.filters.sortorder = 'DESC';
                        break;
                    case 'file_number_asc':
                        self.viewModel.filters.sortby = 2;
                        self.viewModel.filters.sortorder = 'ASC';
                        break;
                    case 'file_number_desc':
                        self.viewModel.filters.sortby = 8;
                        self.viewModel.filters.sortorder = 'DESC';
                        break;
                    default:
                        self.viewModel.filters.sortby = 1;
                        self.viewModel.filters.sortorder = 'ASC';
                        break; 
                };
                self.viewModel.filters.pagenum = 1;
                self.getMatterList();
            };

            //filter by users ('my matters','all matters')
            self.filterByUser = function (param) {
                self.viewModel.filters.pagenum = 1;
                self.selectionModel.allMatter = param;
                self.viewModel.filters.isMyMatter = param;
                if (angular.isUndefined(self.viewModel.filters.start) && angular.isUndefined(self.viewModel.filters.end)) {
                    var start = moment().subtract(1, 'years');
                    self.viewModel.filters.start = moment(start).unix();
                    var end = moment();
                    self.viewModel.filters.end = moment(end).unix();
                }
                //getStatusWiseCounts();
                self.getMatterList();
            };

            //filter by status specified at the top(with counts All,Arbitration etc...)
            self.applyStatusFilter = function (filter) {
                self.selectionModel.statusName = 'Ongoing';
                applyFilterStatusWiseCount(filter);
            }

            self.getMatterList = function (getAll) {
                //matterInTookBtDateHelper.setStatuswiseFilter(self.viewModel.filters, self.selectionModel.statusWise.id);
                setMultiSelectFilter();
                self.viewModel.filters.reportName = 'matterintakereport';
                var filterObj = matterInTookBtDateHelper.getFiltersObj(self.viewModel.filters,self.viewModel, getAll);
                persistFilters();
                var promesa = reportFactory.getMatterstatsForNewMatter(filterObj, self.selectionModel.allMatter);
                promesa.then(function (data) {
                    utils.replaceNullByEmptyStringArray(data);
                    self.display.matterListReceived = true;
                    matterList = data; //store all matters locally, this list will be used while client side filtering
                    processData(matterList);
                    matterInTookBtDateHelper.setModifiedDisplayDate(matterList);
                    self.viewModel.matters = data.matters;
                    //deselect all matters
                    self.clxGridOptions.selectAll = false;
                    self.clxGridOptions.selectedItems = [];
                    delete self.viewModel.filters.lastMatterId;
                    //delete self.viewModel.filters.statusFilter;
                }, function (reason) { });
                //get count
                var count = reportFactory.getMatterstatscount(filterObj, self.selectionModel.allMatter);
                count.then(setCount);
            };

            function processData(matterList) {
                _.forEach(matterList.matters, function (item) {
                    item.courtVenue = utils.isNotEmptyVal(item.court.courtVenue) ? item.court.courtVenue : '';
                    item.courtName = utils.isNotEmptyVal(item.court.courtName) ? item.court.courtName : '';
                });
                utils.replaceNullByEmptyStringArray(matterList.matters);
            }

            function setCount(res) {
                var count = res.data.max_cases_count;
                self.total = count;
            }

            self.getAllMatterList = function () {
                self.viewModel.filters.pagesize = 9999;
                self.getMatterList(10000);
            };

            self.showMoreAllBtn = function () {
                if (self.viewModel.filters.pagesize === 'all') {
                    return false;
                }

                if (self.viewModel.matters.length < (self.viewModel.filters.pagenum * self.viewModel.filters.pagesize)) {
                    return false
                }
                return true;
            };

            //ensure to set other filter values while fetching next data
            function setMultiSelectFilter() {
                var postArray = ['categoryFilter', 'statusFilter', 'typeFilter', 'venueFilter'];
                var valKey = ['categories', 'statuses', 'types', 'venues'];
                _.each(postArray, function (val, index) {
                    var data = _.pluck(self.selectionModel.multiFilters[valKey[index]], "id").join();
                    if (!_.isEmpty(data)) {
                        self.viewModel.filters[val] = data;
                    } else {
                        if (angular.isUndefined(self.viewModel.filters[val])) {
                            self.viewModel.filters[val] = [];
                        }
                    }
                });
            }

            function getNextMatterList() {
                setMultiSelectFilter();
                var filterObj = matterInTookBtDateHelper.getFiltersObj(self.viewModel.filters,self.viewModel, '');
                var promesa = reportFactory.getMatterstatsForNewMatter(filterObj,
                    self.selectionModel.allMatter);
                promesa.then(function (data) {
                    processData(data);
                    matterInTookBtDateHelper.setModifiedDisplayDate(data);
                    self.viewModel.matters = self.viewModel.matters.concat(data.matters); //data to be displayed
                }, function (reason) {

                });
            };


            self.downloadMatters = function () {
                setMultiSelectFilter();
                self.viewModel.filters.pagenum = 1;
                var filterObj = matterInTookBtDateHelper.getFiltersObj(self.viewModel.filters,self.viewModel, 10000);
                filterObj.pageSize = 1000;
                reportFactory.downLoadMatterByInTookDate(filterObj, self.viewModel.filters,self.viewModel)
                    .then(function (response) {
                        utils.downloadFile(response.data, "New_Matters_Opened_by_date.xlsx", response.headers("Content-Type"));
                    });
            };


            self.print = function () {
                //matterInTookBtDateHelper.setStatuswiseFilter(self.viewModel.filters, self.selectionModel.statusWise.id);
                setMultiSelectFilter();
                var filterObj = matterInTookBtDateHelper.getFiltersObj(self.viewModel.filters,self.viewModel, '');
                var promesa = reportFactory.getMatterstatsForNewMatter(filterObj, self.selectionModel.allMatter);
                promesa.then(function (data) {
                    utils.replaceNullByEmptyStringArray(data);
                    var filterDisplayObj = setFilterDisplayObj(self.viewModel.filters);
                    setIntakeDate(data);
                    reportFactory.printMatterByInTookDate(self.viewModel.matters, filterDisplayObj);
                }, function (reason) { });
            };

            function setIntakeDate(matterList) {
                _.forEach(matterList.matters, function (data) {
                    if ((angular.isDefined(data.intake_date)) && !_.isNull(data.intake_date) && (parseInt(data.intake_date) !== 0) && !utils.isEmptyString(data.intake_date)) {
                        data.intake_date = moment.unix(data.intake_date).utc().format('MM/DD/YYYY');
                    } else {
                        data.intake_date = " - ";
                    }

                    if ((angular.isDefined(data.date_of_incidence)) && !_.isNull(data.date_of_incidence) && (parseInt(data.date_of_incidence) !== 0) && !utils.isEmptyString(data.date_of_incidence)) {
                        data.dateofincidence = moment.unix(data.date_of_incidence).utc().format('MM/DD/YYYY');
                    } else {
                        data.dateofincidence = " - ";
                    }


                });
            }

            // set filter obj to be displayed on print page
            function setFilterDisplayObj() {
                var postArray = ['categoryFilter', 'statusFilter', 'typeFilter', 'venueFilter'];
                var valKey = ['category', 'statuses', 'type', 'venues'];
                var filterObj = {};
                _.each(postArray, function (val, index) {
                    //get array of current valkey item from masterlist
                    var array = self.viewModel.masterList[valKey[index]];
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
                            var name = utils.isEmptyVal(appliedFilter.name) ? "{BLANK}" : appliedFilter.name;
                            appliedFilters.push(name);
                        }
                    });
                    //set the filter obj
                    // filterObj ={name:<filter name>,value:<applied filters>}
                    filterObj[val] = {};
                    filterObj[val].name = valKey[index].toUpperCase();
                    filterObj[val].data = appliedFilters;
                });

                var fromDate = (angular.isUndefined(self.viewModel.filters.start) ||
                    _.isNull(self.viewModel.filters.start) || utils.isEmptyString(self.viewModel.filters.start)) ?
                    " " : ("from : " + moment.unix(self.viewModel.filters.start).utc().format('MM/DD/YYYY'));

                var toDate = (angular.isUndefined(self.viewModel.filters.end) ||
                    _.isNull(self.viewModel.filters.end) || utils.isEmptyString(self.viewModel.filters.end)) ?
                    "  " : (" to: " + moment.unix(self.viewModel.filters.end).utc().format('MM/DD/YYYY'));

                filterObj.dateRange = {
                    name: 'DATE RANGE',
                    data: fromDate + toDate
                };


                filterObj.sortby = {
                    name: 'Sort By ',
                    data: _.find(self.sorts, function (opt) {
                        return (self.viewModel.filters.sortby === parseInt(opt.value)) && (self.viewModel.filters.sortorder === opt.order)
                    }).name
                };
                //filterObj.orderby = { name: "ORDERED BY", data: [self.sortbyOptions[self.viewModel.filters.sortby]] };
                return filterObj;
            }

            function getStatusWiseCounts() {
                var currentSelection;

                if (angular.isUndefined(self.selectionModel.allMatter)) {
                    self.selectionModel.allMatter = 0;
                }

                currentSelection = (self.selectionModel.allMatter == 0) ? "my" : "all";


                var promesa = reportFactory.getStatusWiseCounts(currentSelection);
                promesa.then(function (data) {
                    var newdata = {};
                    var all_data = {};
                    var motion_data = {};

                    angular.forEach(data, function (value, key) {
                        switch (key) {
                            case 'All':
                                all_data[key] = value;
                                break;
                            case 'Motion':
                                motion_data[key] = value;
                                break;
                            default:
                                if (!(key == "Federal Court" || key == "" || key == "Stalled")) {
                                    newdata[key] = value;
                                }
                                break;
                        }
                    });
                    data = newdata;
                    self.viewModel.statusWiseCounts = data;
                    self.viewModel.statusWiseCountsAll = all_data;
                    self.viewModel.statusWiseCountsMotion = motion_data;
                    angular.extend(allDisplayStatuses, data, all_data, motion_data);
                    //to highlight ALL statuswise filter assign all status obj  to selection model
                    self.selectionModel.statusWise = self.viewModel.statusWiseCountsAll.All;
                    self.getMatterList();
                }, function (reason) {

                });
            };

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
        .factory('matterInTookBtDateHelper', matterInTookBtDateHelper);

    function matterInTookBtDateHelper() {
        return {
            setModifiedDisplayDate: setModifiedDisplayDate,
            getGridHeaders: getGridHeaders,
            isMatterSelected: isMatterSelected,
            getFiltersObj: getFiltersObj,
            //setStatuswiseFilter: setStatuswiseFilter,
            createFilterTags: createFilterTags
        }

        function setModifiedDisplayDate(matterList) {
            _.forEach(matterList.matters, function (matter) {
                if (angular.isUndefined(matter.intake_date) || _.isNull(matter.intake_date) ||
                    parseInt(matter.intake_date) === 0 || utils.isEmptyString(matter.intake_date)) {
                    matter.intake_date = " - ";
                } else {
                    matter.intake_date = moment.unix(matter.intake_date).utc().format('DD MMM YYYY');
                }

                if (angular.isUndefined(matter.date_of_incidence) || _.isNull(matter.date_of_incidence) ||
                    parseInt(matter.date_of_incidence) === 0 || utils.isEmptyString(matter.date_of_incidence)) {
                    matter.date_of_incidence = ' - ';
                } else {
                    matter.date_of_incidence = moment.unix(matter.date_of_incidence).utc().format('DD MMM YYYY');
                }

                matter.intake_date_utc1 = matter.intake_date.substr(0, 2);
                matter.intake_date_utc2 = matter.intake_date.substr(3, 8);
            });
        }

        function getGridHeaders() {
            return [{
                field: [{
                    prop: 'intake_date_utc1',
                    showBig: 'bigNumVal',
                    showInline: true,
                    //filter: 'utcDateFilter: \'DD MMM \''
                }, {
                    prop: 'intake_date_utc2',
                    showInline: true
                    //filter: 'utcDateFilter: \'DD MMM \''
                },
                {
                    prop: 'date_of_incidence',
                    showSmall: 'smallNumVal',
                    modifyCellElement: true
                }
                ],
                displayName: 'Intake date & Date of Incident',
                dataWidth: 10
            },
            {
                field: [{
                    prop: 'matter_name',
                    href: { link: '#/matter-overview', paramProp: ['matter_id'] }
                },
                {
                    prop: 'file_number',
                    label: 'File#',
                    showInline: false,
                },
                {
                    prop: 'index_number',
                    label: 'Index/Docket#',
                    showInline: false,
                }
                ],
                displayName: 'Matter Name, File number, Index/Docket#',
                dataWidth: 30
            },
            {
                field: [{
                    prop: 'type',
                    template: 'bold'
                }, {
                    prop: 'sub_type'
                }],
                displayName: 'Type & Subtype',
                dataWidth: 20

            },
            {
                field: [{
                    prop: 'category'
                }],
                displayName: 'Category',
                dataWidth: 10

            },
            {
                field: [{
                    prop: 'status',
                    template: 'bold'
                },
                {
                    prop: 'sub_status'
                }
                ],
                displayName: 'Status & Substatus',
                dataWidth: 10

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
                dataWidth: 20

            }
            ];
        }

        function isMatterSelected(matterList, matter) {
            var ids = _.pluck(matterList, 'matter_id');
            return ids.indexOf(matter.matter_id) > -1;
        }

        function getFiltersObj(filters,viewModel, getAll) {
            var formattedFilters = {};

            formattedFilters.statusFilter = angular.isDefined(filters.statusFilter) ? filters.statusFilter : "";
            if (filters.lastMatterId) { formattedFilters.matter_id = filters.lastMatterId; }

            formattedFilters.typeFilter = angular.isDefined(filters.typeFilter) ? filters.typeFilter : "";
            formattedFilters.categoryFilter = angular.isDefined(filters.categoryFilter) ? filters.categoryFilter : "";
            formattedFilters.venueFilter = angular.isDefined(filters.venueFilter) ? filters.venueFilter : "";

            formattedFilters.eventype = angular.isDefined(filters.eventype) ? filters.eventype : "";
            formattedFilters.reportName = filters.reportName;
            formattedFilters.dateFilter = viewModel.dateFilter;
            if(formattedFilters.dateFilter == "Intake Date"){
                formattedFilters.dateFilter = "dateIntake"
            }
            else{
                formattedFilters.dateFilter = "";
            }
            formattedFilters.start = filters.start;
            formattedFilters.end = filters.end;
            formattedFilters.isMyMatter = angular.isDefined(filters.isMyMatter) ? filters.isMyMatter : 1;
            formattedFilters.sortorder = filters.sortorder;
            formattedFilters.sortby = filters.sortby;
            formattedFilters.pageNum = filters.pagenum;
            formattedFilters.pageSize = filters.pagesize;
        
        return formattedFilters;
    };

    function getArrayString(array) {
        var str = (array != null ? array.toString() : "");
        return "[" + str + "]";
    };


    function createFilterTags(filters, masterList, toBeExcluded) {
        var tags = [];
        var filterArray = [
            { type: 'categories', list: 'category', filter: 'categoryFilter', tagname: 'Category' },
            { type: 'statuses', list: 'statuses', filter: 'statusFilter', tagname: 'Status' },
            { type: 'types', list: 'type', filter: 'typeFilter', tagname: 'Type' },
            { type: 'venues', list: 'venues', filter: 'venueFilter', tagname: 'Venue' }
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

        if (angular.isDefined(filters.tag)) {
            // Bug# 5444 for custom dates Date range  added  
            if (filters.tag == 'custom dates') {
                var filterDisplay = '';
                var start = moment.unix(filters.start).utc().format('MM-DD-YYYY');
                var end = moment.unix(filters.end).utc().format('MM-DD-YYYY');
                filterDisplay += start + ' to: ' + end;
                var filterObj = 'Intake date' + ' : ' + filterDisplay;
                filterObj = { value: filterObj, id: filters.tag };
                tags.push(filterObj);
            } else {
                var filterObj = { value: filters.tag, id: filters.tag };
                tags.push(filterObj);
            }
        }

        excludeTags(tags, toBeExcluded);
        return tags;
    }

    function getFilterValues(masterList, filter, type) {
        return masterList[filter].map(function (item) {
            return {
                key: item.id,
                value: item.name,
                type: type || ''
            };
        });
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

}) ();
