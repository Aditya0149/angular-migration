(function () {
    'use strict';

    angular.module('cloudlex.matter').controller('archiveMatterListCtrl',
        ['$scope', 'masterData', 'matterFactory', '$state', '$modal', 'modalService',
            'archivematterListHelper', 'notification-service', 'routeManager',
            function ($scope, masterData, matterFactory, $state, $modal, modalService,
                archivematterListHelper, notificationService, routeManager) {

                //as of now we are facing keyboard
                //when the grid has lot of data and we open the drawer
                //so we are subscribing to the events emitted when the drawer opens and reducing the array size
                //we repopulate the array by subscribing to close drawer event
                //this is a work around which has to be chnaged
                //problem is with the div based grid implemented

                //event fired when the drawer opens
                $scope.$on('drawer-opened', function () {
                    if (angular.isDefined(matterList) && matterList.length > 0) {
                        self.viewModel.matters = matterList.slice(0, 20);
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
                var allDisplayStatuses = {};
                var initMatterLimit = 10;
                self.matterLimit = initMatterLimit;
                self.filterRetain = filterRetain;
                var filtertext = sessionStorage.getItem("archive_filtertext");
                if (utils.isNotEmptyVal(filtertext)) {
                    self.showSearch = true;
                }


                self.scrollReachedBottom = function () {
                    if (self.matterLimit <= self.totalMatters) {
                        self.matterLimit = self.matterLimit + initMatterLimit;
                    }
                };

                self.scrollReachedTop = function () {
                    self.matterLimit = initMatterLimit;
                }

                var gracePeriodDetails = masterData.getUserRole();
                self.isGraceOver = gracePeriodDetails.plan_subscription_status;

                //initialization start
                self.init = function () {
                    routeManager.setBreadcrum([{ name: '...' }, { name: 'Archived Matter List' }]);
                    self.tags = [];
                    self.sorts = [
                        { key: 1, name: "Matter Name ASC" },
                        { key: 3, name: "Matter Name DESC" },
                        { key: 2, name: "File Number ASC" },
                        { key: 8, name: "File Number DESC" },
                        { key: 4, name: "Matter Archive Date ASC" },
                        { key: 5, name: "Matter Archive Date DESC" },
                        { key: 6, name: "Matter Closure Date ASC" },
                        { key: 7, name: "Matter Closure Date DESC" }
                        // { key: 9, name: "Date of Accident Asc" },
                        // { key: 10, name: "Date of Accident Desc" }
                    ];

                    var selectionModel = sessionStorage.getItem("archiveListSelectionModel");
                    var viewModel = sessionStorage.getItem("archiveListViewModel");
                    var displayStatuses = sessionStorage.getItem("archiveListAllDisplayStatuses");
                    var filtertext = sessionStorage.getItem("archive_filtertext");

                    if (utils.isNotEmptyVal(selectionModel) || utils.isNotEmptyVal(viewModel) || utils.isNotEmptyVal(filtertext)) {
                        retainFilters(selectionModel, viewModel, displayStatuses);
                        self.viewModel.filters.filterText = filtertext;

                    } else {
                        initModels();
                        initAllFilter();
                        applySetFilters();
                    }
                };

                function retainFilters(selectionModel, viewModel, displayStatuses) {
                    try {
                        self.selectionModel = JSON.parse(selectionModel);
                        self.viewModel = JSON.parse(viewModel);
                        self.viewModel.matters = [];
                        self.viewModel.masterList = masterData.getMasterData();
                        self.viewModel.filters.pageNum = 1;
                        displayStatuses = JSON.parse(displayStatuses);

                        matterFactory.getAllUsers()
                            .then(function (res) {
                                self.allUsers = res.data;
                                var masterList = masterData.getMasterData();
                                self.tags = archivematterListHelper
                                    .createFilterTags(self.viewModel.filters, masterList, displayStatuses, self.allUsers);
                                applySetFilters();
                            });
                    } catch (e) {
                        initModels();
                        applySetFilters();
                    }
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
                        headers: archivematterListHelper.getGridHeaders(),
                        selectedItems: []
                    };

                    matterFactory.getAllUsers()
                        .then(function (res) {
                            self.allUsers = res.data;
                        });
                }

                function filterRetain() {
                    var filtertext = self.viewModel.filters.filterText;
                    sessionStorage.setItem("archive_filtertext", filtertext);

                }

                function persistData() {
                    self.viewModel.filters.filterText = "";
                    //Bug#6748 
                    // if (angular.isDefined(self.selectionModel.multiFilters.subtypes[0])) {
                    //     if (utils.isEmptyVal(self.selectionModel.multiFilters.subtypes[0].name)) {
                    //         self.selectionModel.multiFilters.subtypes[0].name = "{Blank}";
                    //     }
                    // }
                    //Bug#6748 
                    _.forEach(self.selectionModel.multiFilters.subtypes, function (data) {
                        if (utils.isEmptyVal(data.name)) {
                            data.name = "{Blank}";
                        }
                    })
                    sessionStorage.setItem("archiveListSelectionModel", JSON.stringify(self.selectionModel));
                    sessionStorage.setItem("archiveListViewModel", JSON.stringify(self.viewModel));
                    sessionStorage.setItem("archiveListAllDisplayStatuses", JSON.stringify(allDisplayStatuses));
                    var filtertext = sessionStorage.getItem("archive_filtertext");
                    if (utils.isNotEmptyVal(filtertext)) {
                        self.viewModel.filters.filterText = filtertext;
                    }

                }

                function initAllFilter() {
                    var allFilter = { desc: 'All', id: 'all' };
                    self.selectionModel.statusWise = [allFilter];
                    self.selectionModel.multiFilters.statuses = [allFilter];
                    self.selectionModel.multiFilters.substatus = [];
                    self.viewModel.filters.statusFilter = [self.selectionModel.statusWise.id];
                };

                function initModels() {
                    initViewModel();
                    self.viewModel.masterList = masterData.getMasterData();

                    initSelectionModel();
                };

                function initViewModel() {
                    self.viewModel = {
                        masterList: [],
                        statusWiseCounts: [],
                        statusWiseCountsAll: []
                    };
                    self.viewModel.page = "GRIDVIEW";
                    self.viewModel.matters = [];
                    self.viewModel.filters = {
                        filterText: '',
                        sortby: 1,
                        pageNum: 1
                    };
                };

                function initSelectionModel() {
                    self.selectionModel = {
                        allMatter: 0,
                        multiFilters: {
                            categories: [],
                            types: [],
                            subtypes: [],
                            venues: [],
                            archivalStatus: [],
                            lawtypes: []

                        }
                    };
                }

                function getData() {
                    self.getArchiveMatterList();
                }
                //initialization end


                self.editMatter = function (matterId) {
                    $state.go('edit-matter', { matterId: matterId });
                }

                self.isMatterSelected = function (matter) {
                    self.display.matterSelected[matter.matter_id] =
                        archivematterListHelper.isMatterSelected(self.clxGridOptions.selectedItems, matter);
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
                }

                self.allMatterSelected = function () {
                    if (utils.isEmptyVal(self.clxGridOptions)) {
                        return false;
                    }

                    return self.clxGridOptions.selectedItems.length === matterList.length;
                }
                //checkbox select state manager end

                //select filters in the pop up
                self.toggleFilterPage = function () {
                    var filtercopy = angular.copy(self.selectionModel.multiFilters);
                    filtercopy.dateArchivedStart = (filtercopy.dateArchivedStart) ? moment.unix(filtercopy.dateArchivedStart).utc().format('MM/DD/YYYY') : '';
                    filtercopy.dateArchivedEnd = (filtercopy.dateArchivedEnd) ? moment.unix(filtercopy.dateArchivedEnd).utc().format('MM/DD/YYYY') : '';
                    filtercopy.dateClosedStart = (filtercopy.dateClosedStart) ? moment.unix(filtercopy.dateClosedStart).utc().format('MM/DD/YYYY') : '';
                    filtercopy.dateClosedEnd = (filtercopy.dateClosedEnd) ? moment.unix(filtercopy.dateClosedEnd).utc().format('MM/DD/YYYY') : '';

                    var scrollPos = $(window).scrollTop();
                    var modalInstance = $modal.open({
                        templateUrl: "app/matter/matter-list/matter-archive/partials/archive-filters.html",
                        controller: "archivFilterDialogCtrl",
                        backdrop: "static",
                        keyboard: false,
                        resolve: {
                            params: function () {
                                return {
                                    masterData: self.viewModel.masterList,
                                    filters: filtercopy,
                                    tags: self.tags
                                };
                            }
                        }
                    });
                    modalInstance.result.then(function (selectedItem) {
                        self.selectionModel.multiFilters = selectedItem;
                        self.selectionModel.multiFilters['law-types'] = utils.isNotEmptyVal(self.selectionModel.multiFilters.lawtypes) ? self.selectionModel.multiFilters.lawtypes : '';

                        $(window).scrollTop(scrollPos - 1);
                        self.applyMultiSelectFilter();
                    }, function () {
                    });
                };

                self.applyFilterLazyLoading = function () {
                    self.viewModel.filters.lastMatterId = _.last(self.viewModel.matters)['matter_id'];
                    getNextMatterList();
                };

                self.applyMultiSelectFilter = function () {
                    var postArray = ['categoryFilter', 'typeFilter', 'subTypeFilter', 'venueFilter', 'archivalStatusFilter', 'lawtypeFilter'];
                    var valKey = ['categories', 'types', 'subtypes', 'venues', 'archivalStatus', 'law-types'];
                    _.each(postArray, function (val, index) {
                        var data = _.pluck(self.selectionModel.multiFilters[valKey[index]], "id").join();
                        if (!_.isEmpty(data)) {
                            self.viewModel.filters[val] = data;
                        } else {
                            self.viewModel.filters[val] = [];
                        }
                    });

                    self.viewModel.filters.dateArchivedStart = self.selectionModel.multiFilters.dateArchivedStart;
                    self.viewModel.filters.dateArchivedEnd = self.selectionModel.multiFilters.dateArchivedEnd;
                    self.viewModel.filters.dateClosedEnd = self.selectionModel.multiFilters.dateClosedEnd;
                    self.viewModel.filters.dateClosedStart = self.selectionModel.multiFilters.dateClosedStart;
                    self.viewModel.filters.pageNum = 1;
                    self.tags = archivematterListHelper
                        .createFilterTags(self.viewModel.filters, self.viewModel.masterList, allDisplayStatuses, self.allUsers);
                    self.getArchiveMatterList();
                    self.viewModel.page = "GRIDVIEW";
                };

                self.tagCancelled = function (cancelled) {
                    var scrollPos = $(window).scrollTop();
                    switch (cancelled.type) {
                        case 'DOA':
                            self.selectionModel.multiFilters.dateArchivedStart = '';
                            self.selectionModel.multiFilters.dateArchivedEnd = '';
                            break;
                        case 'DOC':
                            self.selectionModel.multiFilters.dateClosedStart = '';
                            self.selectionModel.multiFilters.dateClosedEnd = '';
                            break;
                        default:
                            //get array of current filter of the cancelled type
                            var currentFilters = _.pluck(self.selectionModel.multiFilters[cancelled.type], 'id');
                            //remove the cancelled filter
                            var index = currentFilters.indexOf(cancelled.id);
                            self.selectionModel.multiFilters[cancelled.type].splice(index, 1);

                            if (utils.isEmptyVal(self.selectionModel.multiFilters[cancelled.type]) && cancelled.type == 'types') {
                                self.selectionModel.multiFilters['subtypes'] = [];
                            }
                    }
                    //reassign the new filters
                    $(window).scrollTop(scrollPos - 1);
                    self.applyMultiSelectFilter();

                }

                //sort by filters
                self.applySortByFilter = function (sortBy) {
                    self.viewModel.filters.sortby = sortBy;
                    self.getArchiveMatterList();
                }

                //get sort by label
                self.getSortByLabel = function (sortBy) {
                    if (utils.isEmptyVal(sortBy)) {
                        return " - ";
                    }

                    var selSort = _.find(self.sorts, function (sort) {
                        return sort.key == sortBy;
                    });
                    return selSort.name;
                }


                self.getArchiveMatterList = function (getAll) {
                    setMultiSelectFilter();
                    var filterObj = archivematterListHelper.getFiltersObj(self.viewModel.filters, getAll);
                    var promesa = matterFactory.getArchiveMatterList(filterObj, self.selectionModel.allMatter);
                    promesa.then(function (data) {
                        utils.replaceNullByEmptyStringArray(data.archivalList);
                        self.display.matterListReceived = true;
                        _.forEach(data.archivalList, function (item) {
                            item.outstanding_amount = item.settlement_amount - item.total_paid;
                            item.outstanding_amount = (item.outstanding_amount == 0) ? "" : item.outstanding_amount;
                        })
                        matterList = data.archivalList;//store all matters locally, this list will be used while client side filtering
                        archivematterListHelper.setModifiedDisplayDate(matterList);
                        self.viewModel.matters = data.archivalList;
                        //deselect all matters
                        self.clxGridOptions.selectAll = false;
                        self.clxGridOptions.selectedItems = [];
                        delete self.viewModel.filters.lastMatterId;

                        persistData();
                        self.totalMatters = data.count;
                    }, function (reason) {
                    });
                };

                // function getMatterCount(filterObj) {
                //     var promesa = matterFactory.getArchiveMatterCount(filterObj, self.selectionModel.allMatter);
                //     promesa.then(function (res) {
                //         var data = res.data;
                //         self.totalMatters = data.archived_case_count;
                //         console.log(self.totalMatters)
                //         self.totalmattersUsed = (utils.isNotEmptyVal(data.active_all_case_count)) ? parseInt(data.active_all_case_count) : 0;
                //         self.subscribematterLimit = (utils.isNotEmptyVal(data.max_cases_count)) ? parseInt(data.max_cases_count) : 0;
                //     });
                // }


                self.getAllMatterList = function () {
                    self.viewModel.filters.pageNum = 1;
                    self.getArchiveMatterList(10000);
                }


                //ensure to set other filter values while fetching next data
                function setMultiSelectFilter() {
                    var postArray = ['categoryFilter', 'typeFilter', 'subTypeFilter', 'venueFilter', 'archivalStatusFilter', 'lawtypeFilter'];
                    var valKey = ['categories', 'types', 'subtypes', 'venues', 'archivalStatus', 'law-types'];
                    _.each(postArray, function (val, index) {
                        var data = _.pluck(self.selectionModel.multiFilters[valKey[index]], "id").join();
                        if (utils.isNotEmptyVal(data)) {
                            self.viewModel.filters[val] = data;
                        } else {
                            self.viewModel.filters[val] = [];
                        }
                    });

                    self.viewModel.filters.dateArchivedStart = utils.isNotEmptyVal(self.selectionModel.multiFilters.dateArchivedStart) ?
                        self.selectionModel.multiFilters.dateArchivedStart : '';

                    self.viewModel.filters.dateArchivedEnd = utils.isNotEmptyVal(self.selectionModel.multiFilters.dateArchivedEnd) ?
                        self.selectionModel.multiFilters.dateArchivedEnd : '';

                    self.viewModel.filters.dateClosedStart = utils.isNotEmptyVal(self.selectionModel.multiFilters.dateClosedStart) ?
                        self.selectionModel.multiFilters.dateClosedStart : '';

                    self.viewModel.filters.dateArchivedEnd = utils.isNotEmptyVal(self.selectionModel.multiFilters.dateArchivedEnd) ?
                        self.selectionModel.multiFilters.dateArchivedEnd : '';

                    self.viewModel.filters.pageNum = utils.isNotEmptyVal(self.viewModel.filters.pageNum) ?
                        self.viewModel.filters.pageNum : 1;
                }

                function getNextMatterList() {
                    self.viewModel.filters.pageNum++;
                    setMultiSelectFilter();
                    var filterObj = archivematterListHelper.getFiltersObj(self.viewModel.filters);
                    var promesa = matterFactory
                        .getArchiveMatterList(filterObj,
                            self.selectionModel.allMatter);
                    promesa.then(function (data) {
                        archivematterListHelper.setModifiedDisplayDate(data.archivalList);               
                        _.forEach(data.archivalList, function (item) {
                            matterList.push(item);//list of received
                        });
                        self.viewModel.matters = matterList;//data to be displayed           
                        delete self.viewModel.filters.lastMatterId;
                    }, function (reason) {

                    });
                };


                self.downloadArchivedMatters = function () {
                    setMultiSelectFilter();
                    var filterObj = archivematterListHelper.getFiltersObj(self.viewModel.filters, 10000);
                    var allMatter = self.selectionModel.allMatter;
                    matterFactory.downloadArchivedMatters(filterObj, self.viewModel.filters, allMatter);
                };

                self.print = function () {
                    setMultiSelectFilter();
                    var filterObj = archivematterListHelper.getFiltersObj(self.viewModel.filters, 10000);
                    matterFactory.getArchiveMatterList(filterObj, self.selectionModel.allMatter)
                        .then(function (data) {
                            var filterDisplayObj = setFilterDisplayObj();
                            matterFactory.printArchiveMatters(data, filterDisplayObj);
                        });
                };
                // set filter obj to be displayed on print page
                function setFilterDisplayObj() {
                    var postArray = ['categoryFilter', 'typeFilter', 'subTypeFilter', 'venueFilter', 'archivalStatusFilter', 'lawtypeFilter'];
                    var valKey = ['category', 'type', 'subtypes', 'venues', 'archivalStatus', 'law-types'];
                    var filterObj = {};
                    _.each(postArray, function (val, index) {
                        //get array of current valkey item from masterlist    
                        if (val == 'subTypeFilter') {
                            var array = extractSubTypes();
                        }
                        else {
                            var array = angular.copy(self.viewModel.masterList[valKey[index]]);
                        }
                        // var array = angular.copy(self.viewModel.masterList[valKey[index]]);
                        var appliedFilters = [];
                        //iterate over current selected filters

                        var filterString = self.viewModel.filters[val].toString();
                        _.forEach(filterString.split(','), function (id) {
                            if (utils.isEmptyString(id)) { return; }
                            if (id === "all" || id === "stalled") {
                                // appliedFilters.push(id);
                            }
                            else {
                                // find object from array having the current id
                                var appliedFilter = _.find(array, function (item) {
                                    return item.id === id;
                                });

                                if (utils.isEmptyVal(appliedFilter.name)) {
                                    appliedFilter.name = "{Blank}";
                                }
                                appliedFilters.push(appliedFilter.name);
                            }
                        });
                        //set the filter obj

                        filterObj[val] = {};
                        filterObj[val].name = (valKey[index].toUpperCase() == 'ARCHIVALSTATUS') ? 'ARCHIVAL STATUS' : valKey[index].toUpperCase(); // Bug 5553 For print page issue
                        filterObj[val].data = appliedFilters;
                    });
                    filterObj.orderby = {
                        name: "ORDERED BY",
                        data: [self.getSortByLabel(self.viewModel.filters.sortby)]
                    };




                    if (utils.isNotEmptyVal(self.viewModel.filters.dateArchivedEnd) && utils.isNotEmptyVal(self.viewModel.filters.dateArchivedStart)) {

                        var start = moment.unix(self.viewModel.filters.dateArchivedStart).utc().format('MM/DD/YYYY');
                        var end = moment.unix(self.viewModel.filters.dateArchivedEnd).utc().format('MM/DD/YYYY');

                        filterObj.doa = {
                            name: 'DOA Range',
                            data: [start + ' - ' + end]
                        };
                    }


                    if (utils.isNotEmptyVal(self.viewModel.filters.dateClosedEnd) && utils.isNotEmptyVal(self.viewModel.filters.dateClosedStart)) {

                        var start = moment.unix(self.viewModel.filters.dateClosedStart).utc().format('MM/DD/YYYY');
                        var end = moment.unix(self.viewModel.filters.dateClosedEnd).utc().format('MM/DD/YYYY');

                        filterObj.doc = {
                            name: 'DOC Range',
                            data: [start + ' - ' + end]
                        };
                    }
                    return filterObj;
                }

                function extractSubTypes() {
                    var masterlist = angular.copy(self.viewModel.masterList);
                    var statuses = _.find(masterlist['type'], function (status) {
                        return status.id === self.viewModel.filters['typeFilter'];
                    })
                    return utils.isEmptyVal(statuses) ? "" : statuses['sub-type'];
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
                    var promesa = matterFactory.getMaster();
                    promesa.then(function (data) {
                        self.viewModel.masterList = data;
                    }, function (reason) {

                    });
                }

                //US:5011 Retrival archive matter list
                /* Retrive Archived matter */
                self.retriveArchivedMatter = function (selectedMatter, filterdMatter) {

                    //  if( utils.isNotEmptyVal(self.viewModel.filters.filterText)){               
                    //      selectedMatter =filterdMatter;
                    //     }
                    // validation for selected matters status should be archive    
                    self.display.matterListReceived = false;
                    if (selectedMatter.length == 0) {
                        notificationService.error("Please select Archived matter for retrieve.");
                        return;
                    }
                    var matterStatus = [];
                    var matterStatusFlag = false;
                    _.filter(selectedMatter, function (item) {
                        if (item.status == "Archiving" || item.status == "Retrieving") {
                            matterStatusFlag = true;
                        }
                    });

                    if (matterStatusFlag) {
                        var modalOptions = {
                            closeButtonText: 'Ok',
                            actionButtonText: '',
                            headerText: 'Retrieve matters ?',
                            bodyText: "Please do not include matters which are Archiving or Retrieving in your selection, as they cannot be retrieved."
                        };
                        modalService.showModal({}, modalOptions);
                        return;
                    }

                    // call api for retrieval matters
                    if (!matterStatusFlag) {
                        var modalOptions = {
                            closeButtonText: 'Cancel',
                            actionButtonText: 'Retrieve',
                            headerText: 'Retrieve matters?',
                            bodyText: "To confirm, click Retrieve."
                        };

                        //confirm before Retrieve matter
                        modalService.showModal({}, modalOptions).then(function () {
                            var matterIds = _.pluck(selectedMatter, 'matter_id');
                            var promesa = matterFactory.setRetrieveArchivedMatter(matterIds);
                            promesa.then(function (data) {
                                self.getArchiveMatterList();
                            }, function (error) {
                                notificationService.error('Unable to retrieve selected matters');
                            });
                        });
                    }
                }
                self.init();
                self.launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
                if (self.launchpad && self.launchpad.enabled != 1) {
                    self.isMM = true;
                } else {
                    self.isMM = false;
                }

            }]);
})();


(function () {
    angular.module('cloudlex.matter')
        .factory('archivematterListHelper', archivematterListHelper);
    function archivematterListHelper() {
        return {
            setModifiedDisplayDate: setModifiedDisplayDate,
            getGridHeaders: getGridHeaders,
            isMatterSelected: isMatterSelected,
            getFiltersObj: getFiltersObj,
            createFilterTags: createFilterTags
        }

        function setModifiedDisplayDate(matterList) {
            _.forEach(matterList, function (matter) {
                matter.matter_archive_date = moment.utc(matter.matter_archive_date, 'X').format('DD MMM YYYY');
                matter.settlement_date = utils.isEmptyVal(matter.settlement_date) || (matter.settlement_date == 0) ? '-' : moment.utc(matter.settlement_date, 'X').format('DD MMM YYYY');
                matter.dateofincidence = utils.isEmptyVal(matter.dateofincidence) || (matter.dateofincidence == 0) ? '-' : moment.utc(matter.dateofincidence, 'X').format('DD MMM YYYY');
                matter.settlement_amount = utils.isEmptyVal(matter.settlement_amount) ? '-' : matter.settlement_amount;
                matter.total_paid = utils.isEmptyVal(matter.total_paid) ? '-' : matter.total_paid;
                matter.outstanding_amount = utils.isEmptyVal(matter.outstanding_amount) ? '-' : matter.outstanding_amount;
            });
        }

        function getGridHeaders() {
            return [
                {
                    field: [
                        {
                            prop: 'matter_name',

                        },
                        {
                            prop: 'file_number',
                            label: 'File #'
                        },
                        {
                            prop: 'index_number',
                            label: 'Index/Docket#'
                        }],
                    displayName: 'Matter Name ,<br/> File# & Index/Docket#',
                    dataWidth: "15"
                },
                {
                    field: [{
                        prop: 'status'
                    }],
                    displayName: ' Archival Status',
                    dataWidth: "8"

                },
                {
                    field: [
                        {
                            prop: 'matter_type_name',
                            filter: 'replaceByDash'
                        }, {
                            prop: 'matter_sub_type_name',
                            filter: 'replaceByDash'
                        },
                        {
                            prop: 'law_type_name',
                            filter: 'replaceByDash'
                        },
                        {
                            prop: 'category_name',
                            filter: 'replaceByDash'
                        }],
                    displayName: 'Type, Subtype, <br/> Law-Type & Category',
                    dataWidth: "12"

                },
                {
                    field: [{
                        prop: 'mattercourt'
                    },
                    {
                        prop: 'venue_name'
                    }],
                    displayName: 'Court & Venue',
                    dataWidth: "12"

                },
                {
                    field: [{
                        prop: 'matter_archive_date',
                        // filter: 'utcDateFilter: \'DD MMM  YYYY\''
                    },
                    {
                        prop: 'dateofincidence'
                    }],
                    displayName: 'Date of Archival & Date of Incident',
                    dataWidth: "9"
                },
                {
                    field: [{
                        prop: 'settlement_date',

                    }],
                    displayName: 'Settlement Date',
                    dataWidth: "8"
                },
                {
                    field: [{
                        prop: 'settlement_amount',
                        html: '<span tooltip="{{data.settlement_amount ? \'$\' : \'\'}}{{data.settlement_amount ? (data.settlement_amount | number:2) : \'\'}}" tooltip-append-to-body="true" tooltip-placement="bottom">{{data.settlement_amount ? "$" : ""}}{{data.settlement_amount ? (data.settlement_amount | number:2) : ""}}</span>'

                    }],
                    displayName: 'Settlement Amount',
                    dataWidth: "8"
                },
                {
                    field: [
                        {
                            prop: 'total_paid',
                            html: '<span tooltip="{{data.total_paid ? \'$\' : \'\'}}{{data.total_paid ? (data.total_paid | number:2) : \'\'}}" tooltip-append-to-body="true" tooltip-placement="bottom">{{data.total_paid ? "$" : ""}}{{data.total_paid ? (data.total_paid | number:2) : ""}}</span>'
                        },
                        {
                            prop: 'outstanding_amount',
                            html: '<span tooltip="{{data.outstanding_amount ? \'$\' : \'\'}}{{data.outstanding_amount ? (data.outstanding_amount | number:2) : \'\'}}" tooltip-append-to-body="true" tooltip-placement="bottom">{{data.outstanding_amount ? "$" : ""}}{{data.outstanding_amount ? (data.outstanding_amount | number:2) : ""}}</span>'
                        }],
                    displayName: 'Total Paid & Outstanding Amount',
                    dataWidth: "10"

                },
                {
                    field: [{
                        prop: 'retainer_no',

                    }],
                    displayName: 'Retainer No',
                    dataWidth: "8"
                },
                {
                    field: [{
                        prop: 'closing_statement_no',

                    }],
                    displayName: 'Closing Statement No',
                    dataWidth: "7"
                }

                // {
                //    field: [{
                //        prop: 'matter_closure_date',

                //    }],
                //    displayName: 'Date of Closure',
                //     dataWidth: "10"
                // }
            ];
        }

        function isMatterSelected(matterList, matter) {
            var ids = _.pluck(matterList, 'matter_id');
            return ids.indexOf(matter.matter_id) > -1;
        }

        function getFiltersObj(filters, getAll) {

            var formattedFilters = {};

            if (filters.lastMatterId) { formattedFilters.matter_id = filters.lastMatterId; }
            formattedFilters.typeFilter = filters.typeFilter ?
                getArrayString(filters.typeFilter) : "[]";

            formattedFilters.lawtypeFilter = filters.lawtypeFilter ?
                getArrayString(filters.lawtypeFilter) : "[]";


            formattedFilters.categoryFilter = filters.categoryFilter ?
                getArrayString(filters.categoryFilter) : "[]";

            formattedFilters.venueFilter = filters.venueFilter ?
                getArrayString(filters.venueFilter) : "[]";

            formattedFilters.subtypeFilter = filters.subTypeFilter ?
                getArrayString(filters.subTypeFilter) : "[]";

            formattedFilters.archivalStatusFilter = filters.archivalStatusFilter ?
                getArrayString(filters.archivalStatusFilter) : "[]";


            formattedFilters.sortby = filters.sortby;

            formattedFilters.pageSize = 250;
            if (utils.isNotEmptyVal(getAll)) {
                formattedFilters.pageSize = getAll;
            }

            formattedFilters.dateArchivedStart = utils.isEmptyVal(filters.dateArchivedStart) ? '' : filters.dateArchivedStart;
            formattedFilters.dateArchivedEnd = utils.isEmptyVal(filters.dateArchivedEnd) ? '' : filters.dateArchivedEnd;

            formattedFilters.dateClosedStart = utils.isEmptyVal(filters.dateClosedStart) ? '' : filters.dateClosedStart;
            formattedFilters.dateClosedEnd = utils.isEmptyVal(filters.dateClosedEnd) ? '' : filters.dateClosedEnd;

            formattedFilters.pageNum = utils.isEmptyVal(filters.pageNum) ? 1 : filters.pageNum;
            return formattedFilters;
        };

        function getArrayString(array) {
            var str = (array != null ? array.toString() : "");
            return "[" + str + "]";
        };


        function createFilterTags(filters, masterList, toBeExcluded, users) {
            var tags = [];
            masterList.archivalStatus = [
                { id: '1', name: "Archived" },
                { id: '2', name: "Archiving" },
                { id: '3', name: "Retrieving" }
            ];
            var filterArray = [
                { type: 'categories', list: 'category', filter: 'categoryFilter', tagname: 'Category' },
                { type: 'archivalStatus', list: 'archivalStatus', filter: 'archivalStatusFilter', tagname: 'Archival Status' },
                { type: 'types', list: 'type', filter: 'typeFilter', tagname: 'Type' },
                { type: 'venues', list: 'venues', filter: 'venueFilter', tagname: 'Venue' },
                { type: 'law-types', list: 'law-types', filter: 'lawtypeFilter', tagname: 'Law-Type' }];

            _.forEach(filterArray, function (filterObj) {
                var filterData = getFilterValues(masterList, filterObj.list, filterObj.type);
                var appliedFilters = filters[filterObj.filter].toString().split(',');

                _.forEach(appliedFilters, function (filterId) {
                    var selectedFilter = _.find(filterData, function (filter) {
                        return parseInt(filter.id) === parseInt(filterId);
                    });

                    if (angular.isDefined(selectedFilter)) {
                        selectedFilter.value = utils.isEmptyString(selectedFilter.value) ? '{Blank}' : selectedFilter.value;
                        selectedFilter.value = filterObj.tagname + ' : ' + selectedFilter.value;
                        tags.push(selectedFilter);
                    }
                });
            });

            // set subtypes  
            if (utils.isNotEmptyVal(filters.subTypeFilter)) {

                var selectedTyp = _.find(masterList.type, function (typ) {
                    return typ.id === filters.typeFilter;
                });

                if (angular.isDefined(selectedTyp)) {
                    if (utils.isNotEmptyVal(filters.subTypeFilter)) {
                        var appliedSubTypes = filters.subTypeFilter.toString().split(',');
                        _.forEach(appliedSubTypes, function (appliedSubTyp) {
                            var selectedSubTyp = _.find(selectedTyp['sub-type'], function (subtyp) {
                                return subtyp.id === appliedSubTyp;
                            });
                            if (angular.isDefined(selectedSubTyp)) {
                                if (utils.isEmptyString(selectedSubTyp.name)) {
                                    selectedSubTyp.name = "{Blank}";
                                }
                                var filterTag = {
                                    value: 'Sub-Type: ' + selectedSubTyp.name,
                                    type: 'subtypes',
                                    id: selectedSubTyp.id
                                };
                                tags.push(filterTag);
                            }
                        });
                    }
                }
            }



            if (utils.isNotEmptyVal(filters.dateArchivedEnd) && utils.isNotEmptyVal(filters.dateArchivedStart)) {
                var start = moment.unix(filters.dateArchivedStart).utc().format('MM/DD/YYYY');
                var end = moment.unix(filters.dateArchivedEnd).utc().format('MM/DD/YYYY');

                var tag = {
                    value: 'Archival Date Range: ' + start + ' - ' + end,
                    type: 'DOA'
                };

                tags.push(tag);
            }
            if (utils.isNotEmptyVal(filters.dateClosedEnd) && utils.isNotEmptyVal(filters.dateClosedStart)) {
                var start = moment.unix(filters.dateClosedStart).utc().format('MM/DD/YYYY');
                var end = moment.unix(filters.dateClosedEnd).utc().format('MM/DD/YYYY');

                var tag = {
                    value: 'Closure Date Range: ' + start + ' - ' + end,
                    type: 'DOC'
                };

                tags.push(tag);
            }

            excludeTags(tags, toBeExcluded);
            return tags;
        }

        function getFilterValues(masterList, filter, type) {
            return masterList[filter].map(function (item) {
                return {
                    id: item.id,
                    value: item.name,
                    type: type || ''
                };
            });
        }

        function excludeTags(tags, toBeExcluded) {
            delete toBeExcluded[""];

            angular.forEach(toBeExcluded, function (val, key) {
                var key = val.id;
                var index = _.findIndex(tags, function (tag) {
                    return ((parseInt(tag.id) === parseInt(key)) && tag.type == "statuses");
                });

                if (index != -1) {
                    tags.splice(index, 1);
                }
            });
        }
    }

})();

