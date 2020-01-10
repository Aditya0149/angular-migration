(function () {
    'use strict';

    angular.module('cloudlex.matter').controller('MatterListCtrl', ['$scope', 'masterData', 'matterFactory', '$state', '$modal', 'modalService',
        'matterListHelper', 'notification-service', 'routeManager', 'practiceAndBillingDataLayer', '$location',
        function ($scope, masterData, matterFactory, $state, $modal, modalService,
            matterListHelper, notificationService, routeManager, practiceAndBillingDataLayer, $location) {

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
            self.showPager = true;
            self.pageSize = 250;
            var matterList = [];
            var allDisplayStatuses = {};
            var initMatterLimit = 10;
            self.matterLimit = initMatterLimit;
            self.filterRetain = filterRetain;
            self.pageNum = 1;
            self.allMatterSelected = allMatterSelected;
            //US# 4713 disable add button
            var gracePeriodDetails = masterData.getUserRole();
            self.isGraceOver = gracePeriodDetails.plan_subscription_status;

            var matterPermissions = masterData.getPermissions();
            self.matterPermissions = _.filter(matterPermissions[0].permissions, function (per) {
                if (per.entity_id == '1') {
                    return per;
                }
            });
            var filtertext = sessionStorage.getItem("matter_filtertext");
            if (utils.isNotEmptyVal(filtertext)) {
                self.showSearch = true;
            }

            //Refer-out
            self.goToReferOut = function () {
                $state.go('refer-out-matter', { matterId: self.clxGridOptions.selectedItems[0].matter_id, fromMatterList: true });
            }

            //Matter Collaboration
            self.goToMatterCollaboration = function () {
                $state.go('matter-sharing', { matterId: self.clxGridOptions.selectedItems[0].matter_id, matterName: self.clxGridOptions.selectedItems[0].matter_name, fromMatterList: true });
            }

            self.scrollReachedBottom = function () {
                //if (self.matterLimit <= self.totalMatters) {
                self.matterLimit = self.matterLimit + initMatterLimit;
                //}
            };

            (function () {
                /* Set a Message to display if matter limit is over*/
                setuserMsg();
                getSubscriptionInfo();
                // self.viewModel.filters.filterText = "";

                self.launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
                if (self.launchpad && self.launchpad.enabled != 1) {
                    self.isMM = true;
                } else {
                    self.isMM = false;
                }

                self.allfirmData = JSON.parse(localStorage.getItem('allFirmSetting'));
                _.forEach(self.allfirmData, function (item) {
                    if (item.state == "entity_sharing") {
                        self.isCollaborationActive = (item.enabled == 1) ? true : false;
                    }
                });

            })();

            function getSubscriptionInfo() {
                var response = practiceAndBillingDataLayer.getConfigurableData();
                response.then(function (data) {
                    self.isReferralExchange = data.RE.is_active;
                    self.isDigiArchivalSub = data.DA.is_active;
                });
            }

            /*functions which returns the matter 
              limit over effect message as per the type of user*/
            function setuserMsg() {
                var role = masterData.getUserRole();
                self.isSubsriber = (role.is_subscriber == "1") ? true : false;
                self.isAdmin = (role.is_admin == "1") ? true : false;
                self.userMsg = (self.isSubsriber) ? 'You have reached the matter hosting limit for your current subscription.' : 'You have reached the matter hosting limit for your current subscription. Please contact the subscribing managing partner to increase the matter hosting capacity.';
            }

            self.scrollReachedTop = function () {
                self.matterLimit = initMatterLimit;
            }

            function setBreadcrum() {
                routeManager.setBreadcrum([{ name: '...' }, { name: 'Matter List' }]);
            }

            //initialization start
            self.init = function () {

                setBreadcrum();
                self.tags = [];
                self.sorts = [
                    { key: 1, name: "Alphabetical Asc" },
                    { key: 3, name: "Alphabetical Desc" },
                    { key: 9, name: "Plaintiff Last Name Asc" }, //Change made for Sort by plaintiff last name
                    { key: 10, name: "Plaintiff Last Name Desc" },
                    { key: 0, name: "Last Updated" },
                    { key: 2, name: 'File # Asc' },
                    { key: 8, name: 'File # Desc' },
                    { key: 6, name: "Date of Accident Asc" },//US#7852
                    { key: 7, name: "Date of Accident Desc" }
                ];

                var selectionModel = sessionStorage.getItem("matterListSelectionModel");
                var viewModel = sessionStorage.getItem("matterListViewModel");
                var displayStatuses = sessionStorage.getItem("matterListAllDisplayStatuses");
                var filtertext = sessionStorage.getItem("matter_filtertext");
                var filterName = sessionStorage.getItem("matterActivTab");
                //  localStorage.removeItem('matter_filtertext');
                if (utils.isNotEmptyVal(selectionModel) || utils.isNotEmptyVal(viewModel) || utils.isNotEmptyVal(filtertext)) {
                    retainFilters(selectionModel, viewModel, displayStatuses);
                    self.viewModel.filters.filterText = filtertext;
                    //self.viewModel.filters.filterText = "";
                    //US#5160  for tab retaintion
                    if (utils.isNotEmptyVal(filterName)) {
                        if (filterName == 'Archived') {
                            self.applyFooterFilters();
                        }
                    }
                    //..end 

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

                    displayStatuses = JSON.parse(displayStatuses);

                    matterFactory.getAllUsers()
                        .then(function (res) {
                            self.allUsers = res.data;
                            var masterList = masterData.getMasterData();
                            self.tags = matterListHelper
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
                    headers: matterListHelper.getGridHeaders(),
                    selectedItems: []
                };

                matterFactory.getAllUsers()
                    .then(function (res) {
                        self.allUsers = res.data;
                    });
            }

            function filterRetain() {
                var filtertext = self.viewModel.filters.filterText;
                sessionStorage.setItem("matter_filtertext", filtertext);

            }

            function persistData() {
                self.viewModel.filters.filterText = "";
                sessionStorage.setItem("matterListSelectionModel", JSON.stringify(self.selectionModel));
                sessionStorage.setItem("matterListViewModel", JSON.stringify(self.viewModel));
                sessionStorage.setItem("matterListAllDisplayStatuses", JSON.stringify(allDisplayStatuses));
                var filtertext = sessionStorage.getItem("matter_filtertext");
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
                    statusWiseCountsStalled: [],
                    statusWiseCountsAll: []
                };
                self.viewModel.page = "GRIDVIEW";
                self.viewModel.matters = [];
                self.viewModel.filters = {
                    filterText: '',
                    useExternalFilter: true,
                    sortby: 1
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
                        subtypes: [],
                        substatus: [],
                        venues: [],
                        lawtypes: []
                    }
                };
            }

            function getData() {
                getStatusWiseCounts();
                //self.getMatterList();
                //self.getMasterList();
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

                //US#5557 For retaintion of active class Stalled id
                if (self.viewModel.filters.statusCase == "Stalled") {
                    return (self.selectionModel.statusWise.id === id);
                }
                return self.viewModel.filters.statusFilter.split(',').indexOf(id) > -1;
            }

            self.editMatter = function (matterId) {
                $state.go('edit-matter', { matterId: matterId });
            }

            self.isMatterSelected = function (matter) {
                self.display.matterSelected[matter.matter_id] =
                    matterListHelper.isMatterSelected(self.clxGridOptions.selectedItems, matter);
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

            function allMatterSelected() {
                if (utils.isEmptyVal(self.clxGridOptions)) {
                    return false;
                }

                if(self.clxGridOptions.selectedItems.length == 0 && matterList.length == 0){
                    return false;
                }

                return self.clxGridOptions.selectedItems.length === matterList.length;
            }

            //checkbox select state manager end
            //select filters in the pop up
            self.toggleFilterPage = function () {
                var filtercopy = angular.copy(self.selectionModel.multiFilters);
                if (self.selectionModel.multiFilters.statuses.length > 0) {
                    _.forEach(self.selectionModel.multiFilters.statuses, function (item) {
                        if (item.id == 'all' || item.id == 'stalled') {
                            self.status = false;
                        } else {
                            self.status = true;
                        }
                    })
                } else {
                    self.status = false;
                }
                filtercopy.doiStart = (filtercopy.doiStart) ? moment.unix(filtercopy.doiStart).utc().format('MM/DD/YYYY') : '';
                filtercopy.doiEnd = (filtercopy.doiEnd) ? moment.unix(filtercopy.doiEnd).utc().format('MM/DD/YYYY') : '';
                var scrollPos = $(window).scrollTop();
                var tagList = self.tags;

                var modalInstance = $modal.open({
                    templateUrl: "app/matter/matter-list/partials/new_filters.html",
                    controller: "FilterDialogCtrl",
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        params: function () {
                            return {
                                masterData: self.viewModel.masterList,
                                filters: filtercopy,
                                tags: tagList,
                                status: self.status
                            };
                        }
                    }
                });
                modalInstance.result.then(function (selectedItem) {
                    self.selectionModel.multiFilters = selectedItem;
                    self.selectionModel.multiFilters['law-types'] = utils.isNotEmptyVal(self.selectionModel.multiFilters.lawtypes) ? self.selectionModel.multiFilters.lawtypes : '';

                    var closed = _.find(self.selectionModel.multiFilters.statuses, function (status) {
                        return status.name == "Closed";
                    });

                    if (utils.isNotEmptyVal(closed)) {
                        self.selectionModel.statusName = "Closed";
                    } else {
                        self.selectionModel.statusName = "Ongoing";
                    }
                    $(window).scrollTop(scrollPos - 1);
                    self.applyMultiSelectFilter();
                    self.showPager = true;
                }, function () {
                });
            };

            self.displayedMatters = 250;
            self.applyFilterLazyLoading = function () {
                self.viewModel.filters.lastMatterId = _.last(self.viewModel.matters)['matter_id'];
                getNextMatterList();
                // }
            };

            self.applyMultiSelectFilter = function (tagcancelled) {
                var postArray = ['categoryFilter', 'statusFilter', 'substatusFilter', 'typeFilter', 'subTypeFilter', 'venueFilter', 'lawtypeFilter'];
                var valKey = ['categories', 'statuses', 'substatus', 'types', 'subtypes', 'venues', 'law-types'];
                _.each(postArray, function (val, index) {
                    var data = _.pluck(self.selectionModel.multiFilters[valKey[index]], "id").join();
                    if (!_.isEmpty(data)) {
                        self.viewModel.filters[val] = data;
                    } else {
                        self.viewModel.filters[val] = [];
                    }
                });
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
                // if(!self.selectionModel.statusWise.id == 'stalled')
                if (self.viewModel.filters.statusFilter.length === 0) {
                    //set status as all
                    if (!self.selectionModel.statusWise.id == 'stalled') {
                        self.selectionModel.statusWise = self.viewModel.statusWiseCountsAll.All;
                        self.viewModel.filters.statusFilter = "all";
                    }
                    self.selectionModel.statusName = 'Ongoing';
                }

                //attorney filter
                self.viewModel.filters.leadAttorney = self.selectionModel.multiFilters.leadAttorney;
                self.viewModel.filters.attorney = self.selectionModel.multiFilters.attorney;
                self.viewModel.filters.staff = self.selectionModel.multiFilters.staff;
                self.viewModel.filters.paralegal = self.selectionModel.multiFilters.paralegal;
                //DOI date range filter
                self.viewModel.filters.doiEnd = self.selectionModel.multiFilters.doiEnd;
                self.viewModel.filters.doiStart = self.selectionModel.multiFilters.doiStart;
                //Stalled Filter
                self.viewModel.filters.statusCase = self.selectionModel.multiFilters.statusCase;
                self.viewModel.filters.includeReferredOut = self.selectionModel.multiFilters.includeReferredOut;
                self.tags = matterListHelper
                    .createFilterTags(self.viewModel.filters, self.viewModel.masterList, allDisplayStatuses, self.allUsers);
                self.pageNum = 1;
                self.showPager = true;
                self.getMatterList();
                self.viewModel.page = "GRIDVIEW";
            };

            self.tagCancelled = function (cancelled) {
                var scrollPos = $(window).scrollTop();
                switch (cancelled.type) {
                    case 'attorney':
                    case 'leadAttorney':
                    case 'paralegal':
                    case 'staff':
                        //remove attorney,leadAttorney,staff,paralegal filter
                        self.selectionModel.multiFilters[cancelled.type] = undefined;
                        break;
                    case 'doi':
                        self.selectionModel.multiFilters.doiEnd = '';
                        self.selectionModel.multiFilters.doiStart = '';
                        break;
                    case 'includeReferredOut':
                        self.selectionModel.multiFilters.includeReferredOut = '';
                        break;
                    default:
                        //get array of current filter of the cancelled type
                        var currentFilters = _.pluck(self.selectionModel.multiFilters[cancelled.type], 'id');
                        //remove the cancelled filter
                        var index = currentFilters.indexOf(cancelled.id);


                        //US#7123
                        if (cancelled.type == "venues") {
                            self.selectionModel.multiFilters.venues = [];
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
                            self.selectionModel.multiFilters.substatus = intersect;
                        }
                        var closed = _.find(self.selectionModel.multiFilters.statuses, function (status) {
                            return status.name == "Closed";
                        });

                        if (utils.isNotEmptyVal(closed)) {
                            self.selectionModel.statusName = "Closed";
                        } else {
                            self.selectionModel.statusName = "Ongoing";
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
                }
                //reassign the new filters
                $(window).scrollTop(scrollPos - 1);
                self.applyMultiSelectFilter("tagcancelled");
                self.showPager = true;
            }

            //sort by filters
            self.applySortByFilter = function (sortBy) {
                self.viewModel.filters.sortby = sortBy;
                self.showPager = true;
                self.pageNum = 1;
                self.getMatterList();
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

            //filter by users ('my matters','all matters')
            self.filterByUser = function (param) {
                self.showPager = true;
                self.selectionModel.allMatter = param;
                getStatusWiseCounts();
                self.pageNum = 1;
                self.showPager = true;
                self.getMatterList();
            };

            //filter by status specified on footer
            self.applyFooterFilters = function (filterName, clickedTab) {
                self.pageNum = 1;
                self.showPager = true;
                $("#matterlistbody").scrollTop(0);
                var statusObj;
                if (self.isDigiArchivalSub == undefined) {
                    getSubscriptionInfo();
                }

                if (clickedTab != 'clickedTab') {
                    filterName = sessionStorage.getItem("matterActivTab");

                } else {
                    self.selectionModel.statusName = filterName;
                }

                if (!self.isDigiArchivalSub && filterName == "Archived") {

                    if (clickedTab == 'clickedTab') {
                        filterName = sessionStorage.getItem("matterActivTab");
                        self.selectionModel.statusName = sessionStorage.getItem("matterActivTab");
                        notificationService.error("Please subscribe for digital archiver from the marketplace.");
                        return;
                    } else {
                        filterName = 'Ongoing';
                        self.selectionModel.statusName = filterName;
                    }
                }

                switch (filterName) {
                    case 'Ongoing':
                        self.archivedTab = false;
                        setBreadcrum();
                        sessionStorage.setItem("matterActivTab", filterName);
                        statusObj = self.viewModel.statusWiseCountsAll.All;
                        break;
                    case 'Archived':
                        sessionStorage.setItem("matterActivTab", filterName);
                        self.selectionModel.statusName = filterName;
                        self.archivedTab = true;
                        break;
                    case 'Closed':
                        self.archivedTab = false;
                        setBreadcrum();
                        sessionStorage.setItem("matterActivTab", filterName);
                        var statusObj = _.find(self.viewModel.masterList.statuses, function (status) {
                            return status.name === filterName;
                        });
                        break;
                }
                if (filterName != 'Archived') {
                    applyFilterStatusWiseCount(statusObj);
                }
            }

            //filter by status specified at the top(with counts All,Arbitration etc...)
            self.applyStatusFilter = function (filter) {
                self.selectionModel.statusName = 'Ongoing';
                self.showPager = true;
                self.pageNum = 1;
                applyFilterStatusWiseCount(filter);
            }

            //statuswise filters
            function applyFilterStatusWiseCount(item) {
                self.selectionModel.statusWise = item;
                //two different models are used for filters
                //one is viewModel.filters and other is selectionModel.multiFilters
                //to keep both of them is sync
                //refresh multiFilters arrays for statuses and sub statuses
                self.selectionModel.multiFilters.statuses = [item];
                if (utils.isNotEmptyVal(self.selectionModel.multiFilters.substatus)) {
                    var sub_status = [];
                    _.forEach(self.selectionModel.multiFilters.substatus, function (currentItem) {
                        if (item.id == currentItem.statusid) {
                            sub_status.push(currentItem);
                        }
                    })
                    self.selectionModel.multiFilters.substatus = sub_status;
                } else {
                    self.selectionModel.multiFilters.substatus = [];
                }

                if (item.desc != 'Stalled') {
                    self.viewModel.filters.statusCase = '';
                    self.viewModel.filters.includeReferredOut = '';
                    self.selectionModel.multiFilters.includeReferredOut = '';
                }

                self.viewModel.filters.statusFilter = [self.selectionModel.statusWise.id];
                self.tags = matterListHelper.createFilterTags(self.viewModel.filters, self.viewModel.masterList, allDisplayStatuses, self.allUsers);
                self.getMatterList();
            };

            self.getMatterList = function (getAll) {
                matterListHelper.setStatuswiseFilter(self.viewModel.filters, self.selectionModel.statusWise.id);
                setMultiSelectFilter();
                self.viewModel.filters.pageNum = getAll ? 1 : self.pageNum;
                var filterObj = matterListHelper.getFiltersObj(self.viewModel.filters, getAll, self.viewModel.masterList, self.selectionModel.allMatter);
                var promesa = matterFactory.getMatterList(filterObj, self.selectionModel.allMatter);
                promesa.then(function (data) {
                    processData(data);
                    self.totalMatters = (utils.isNotEmptyVal(data.current_case_count)) ? parseInt(data.current_case_count) : 0;
                    self.totalmattersUsed = (utils.isNotEmptyVal(data.active_all_case_count)) ? parseInt(data.active_all_case_count) : 0;
                    self.subscribematterLimit = (utils.isNotEmptyVal(data.max_cases_count)) ? parseInt(data.max_cases_count) : 0;
                    data = data && data.matters ? data.matters : [];

                    if (data.length < 250) {
                        self.showPager = false;
                    }
                    _.forEach(data, function (dataKey) {
                        var leadAttorneyNAttorney = "";
                        var fileNindex = "";
                        //change variable name
                        leadAttorneyNAttorney = [dataKey.lattorney, dataKey.attorney1].filter(Boolean).join(', ');
                        if (utils.isNotEmptyVal(dataKey.index_number)) {
                            if (utils.isNotEmptyVal(dataKey.file_number)) {
                                fileNindex = "File #" + dataKey.file_number + ", Index/Docket#" + dataKey.index_number;
                            } else {
                                fileNindex = "File # <br> Index/Docket#" + dataKey.index_number;
                            }
                        } else {
                            fileNindex = "File #" + dataKey.file_number + ", Index/Docket#";
                        }
                        dataKey.leadAttorneyNAttorney = leadAttorneyNAttorney;
                        dataKey.fileNindex = fileNindex;
                    });
                    utils.replaceNullByEmptyStringArray(data);
                    self.display.matterListReceived = true;

                    matterList = data; //store all matters locally, this list will be used while client side filtering
                    matterListHelper.setModifiedDisplayDate(matterList);
                    self.viewModel.matters = data;

                    //deselect all matters
                    self.clxGridOptions.selectAll = false;
                    self.clxGridOptions.selectedItems = [];
                    delete self.viewModel.filters.lastMatterId;

                    persistData();
                    //getMatterCount(filterObj);
                }, function (reason) { });
            };

            function processData(data) {
                _.forEach(data.matters, function (item) {
                    item.plaintiff_name = (angular.isUndefined(item.plaintiff) || utils.isNotEmptyVal(item.plaintiff)) ? item.plaintiff.plaintiff_name : '-';
                    item.courtVenue = utils.isNotEmptyVal(item.court.courtVenue) ? item.court.courtVenue : '';
                    item.courtName = utils.isNotEmptyVal(item.court.courtName) ? item.court.courtName : '';
                    item.category = utils.isNotEmptyVal(item.category) ? item.category : '-';

                });
                utils.replaceNullByEmptyStringArray(data.matters);
            }

            function getMatterCount(filterObj) {
                var promesa = matterFactory.getMatterCount(filterObj, self.selectionModel.allMatter);
                promesa.then(function (res) {
                    var data = res.data;
                    self.totalMatters = (utils.isNotEmptyVal(data.current_case_count)) ? parseInt(data.current_case_count) : 0;
                    self.totalmattersUsed = (utils.isNotEmptyVal(data.active_all_case_count)) ? parseInt(data.active_all_case_count) : 0;
                    self.subscribematterLimit = (utils.isNotEmptyVal(data.max_cases_count)) ? parseInt(data.max_cases_count) : 0;
                });
            }

            self.getAllMatterList = function () {
                self.getMatterList(10000);
                self.showPager = false;
            }

            //ensure to set other filter values while fetching next data
            function setMultiSelectFilter() {
                var postArray = ['categoryFilter', 'statusFilter', 'substatusFilter', 'typeFilter', 'subTypeFilter', 'venueFilter', 'lawtypeFilter'];
                var valKey = ['categories', 'statuses', 'substatus', 'types', 'subtypes', 'venues', 'law-types'];
                _.each(postArray, function (val, index) {
                    var data = _.pluck(self.selectionModel.multiFilters[valKey[index]], "id").join();
                    if (utils.isNotEmptyVal(data)) {
                        self.viewModel.filters[val] = data;
                    } else {
                        //if (utils.isEmptyVal(self.viewModel.filters[val])) {
                        self.viewModel.filters[val] = [];
                        //}
                    }
                });

                //cancel substatus is status is empty
                if (self.viewModel.filters.statusFilter instanceof Array) {
                    //if no filters applied set all filter
                    if (self.viewModel.filters.statusFilter.length === 0) {
                        self.viewModel.filters.statusFilter = ['all'];
                    }
                    if (self.viewModel.filters.statusCase == "Stalled") {
                        self.viewModel.filters.statusFilter = [];
                    }
                    self.viewModel.filters.substatusFilter = [];
                }

                self.viewModel.filters.leadAttorney = utils.isNotEmptyVal(self.selectionModel.multiFilters.leadAttorney) ?
                    self.selectionModel.multiFilters.leadAttorney : '';
                self.viewModel.filters.attorney = utils.isNotEmptyVal(self.selectionModel.multiFilters.attorney) ?
                    self.selectionModel.multiFilters.attorney : '';
                self.viewModel.filters.staff = utils.isNotEmptyVal(self.selectionModel.multiFilters.staff) ?
                    self.selectionModel.multiFilters.staff : '';
                self.viewModel.filters.paralegal = utils.isNotEmptyVal(self.selectionModel.multiFilters.paralegal) ?
                    self.selectionModel.multiFilters.paralegal : '';

                //DOI filter
                self.viewModel.filters.doiEnd = utils.isNotEmptyVal(self.selectionModel.multiFilters.doiEnd) ?
                    self.selectionModel.multiFilters.doiEnd : '';
                self.viewModel.filters.doiStart = utils.isNotEmptyVal(self.selectionModel.multiFilters.doiStart) ?
                    self.selectionModel.multiFilters.doiStart : ''
            }

            function getNextMatterList() {
                matterListHelper.setStatuswiseFilter(self.viewModel.filters, self.selectionModel.statusWise.id);
                setMultiSelectFilter();
                self.pageNum = self.pageNum + 1;
                self.viewModel.filters.pageNum = self.pageNum;
                var filterObj = matterListHelper.getFiltersObj(self.viewModel.filters, self.pageSize, self.viewModel.masterList, self.selectionModel.allMatter);
                var promesa = matterFactory
                    .getMatterList(filterObj,
                        self.selectionModel.allMatter);
                promesa.then(function (data) {
                    data = data && data.matters ? data.matters : [];
                    processData(data);

                    if (data && data.length > 0) {
                        if (data.length < 250) {
                            self.showPager = false;
                        }
                    } else {
                        self.showPager = false;
                    }
                    matterListHelper.setModifiedDisplayDate(data);
                    _.forEach(data, function (dataKey) {
                        var leadAttorneyNAttorney = "";
                        var fileNindex = "";
                        leadAttorneyNAttorney = [dataKey.lattorney, dataKey.attorney1].filter(Boolean).join(', ');
                        if (utils.isNotEmptyVal(dataKey.index_number)) {
                            if (utils.isNotEmptyVal(dataKey.file_number)) {
                                fileNindex = "File #" + dataKey.file_number + ", <br>Index/Docket#" + dataKey.index_number;
                            } else {
                                fileNindex = "File # <br> Index/Docket#" + dataKey.index_number;
                            }
                        } else {
                            fileNindex = "File #" + dataKey.file_number + ", <br>Index/Docket#";
                        }
                        dataKey.leadAttorneyNAttorney = leadAttorneyNAttorney;
                        dataKey.fileNindex = fileNindex;
                        matterList.push(dataKey); //list of received
                    });
                    //matterList = _.uniq(matterList, 'matter_id');
                    self.viewModel.matters = matterList; //data to be displayed
                    delete self.viewModel.filters.lastMatterId;
                    //delete self.viewModel.filters.statusFilter;
                }, function (reason) {

                });
            };

            self.deleteMatters = function (selectedData, filterdMatter) {
                if (utils.isNotEmptyVal(self.viewModel.filters.filterText) && allMatterSelected()) {
                    selectedData = filterdMatter;
                }

                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Delete',
                    headerText: 'Delete ?',
                    bodyText: 'Are you sure you want to delete ?'
                };

                //confirm before delete
                modalService.showModal({}, modalOptions).then(function () {
                    var matterIds = _.pluck(selectedData, 'matter_id');
                    var promesa = matterFactory.deleteMatters(matterIds);
                    promesa.then(function (data) {
                        notificationService.success('Matter deleted successfully');
                        self.pageNum = 1;
                        self.showPager = true;
                        getStatusWiseCounts();
                        //self.getMatterList();
                    }, function (error) {
                        alert("unable to delete")
                    });
                });
            };

            self.exportMatters = function () {
                self.viewModel.filters.pageNum = 1; // Required to set 1 by default
                matterListHelper.setStatuswiseFilter(self.viewModel.filters, self.selectionModel.statusWise.id);
                setMultiSelectFilter();
                var filterObj = matterListHelper.getFiltersObj(self.viewModel.filters, 10000, self.viewModel.masterList,self.selectionModel.allMatter);
                var allMatter = self.selectionModel.allMatter;
                matterFactory.exportMatterList(filterObj, self.viewModel.filters, allMatter)
                .then(function (response) {
                    utils.downloadFile(response.data, "Matter_List.xlsx", response.headers("Content-Type"));
                });
            };

            self.print = function () {
                matterListHelper.setStatuswiseFilter(self.viewModel.filters, self.selectionModel.statusWise.id, self.selectionModel.allMatter);
                setMultiSelectFilter();
                self.viewModel.filters.pageNum = 1;
                var filterObj = matterListHelper.getFiltersObj(self.viewModel.filters, 10000, self.viewModel.masterList, self.selectionModel.allMatter);

                matterFactory.getMatterList(filterObj, self.selectionModel.allMatter)
                    .then(function (data) {
                        processData(data);
                        data = data && data.matters ? data.matters : [];
                        var filterDisplayObj = setFilterDisplayObj();
                        matterFactory.printMatters(data, filterDisplayObj, self.selectionModel.statusName);

                    });
            };
            // set filter obj to be displayed on print page
            function setFilterDisplayObj() {
                var postArray = ['categoryFilter', 'statusFilter', 'substatusFilter', 'typeFilter', 'subTypeFilter', 'venueFilter', 'lawtypeFilter'];
                var valKey = ['category', 'statuses', 'substatus', 'type', 'subtypes', 'venues', 'law-types'];
                var filterObj = {};
                _.each(postArray, function (val, index) {
                    //get array of current valkey item from masterlist
                    if (val == 'substatusFilter') {
                        var array = extractSubStatus();
                    } else if (val == 'subTypeFilter') {
                        var array = extractSubTypes();
                    } else {
                        var array = angular.copy(self.viewModel.masterList[valKey[index]]);
                    }

                    var appliedFilters = [];
                    //iterate over current selected filters

                    var filterString = self.viewModel.filters[val].toString();
                    _.forEach(filterString.split(','), function (id) {
                        if (utils.isEmptyString(id)) { return; } //if filter id is all/stalled push as is
                        if (id === "all") {
                            appliedFilters.push(id);
                        } else if (id === "stalled") {
                            appliedFilters.push('');
                        } else {
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
                    // filterObj ={name:<filter name>,value:<applied filters>}
                    filterObj[val] = {};
                    filterObj[val].name = valKey[index].toUpperCase();
                    filterObj[val].data = appliedFilters;
                });
                filterObj.orderby = {
                    name: "ORDERED BY",
                    data: [self.getSortByLabel(self.viewModel.filters.sortby)]
                };

                //US#5557 Added Include referredOut status in print with Yes/ No  ....Start
                if (self.viewModel.filters.statusFilter == "stalled" || self.viewModel.filters.statusCase == "Stalled") {
                    var includeReferredOutValue = self.viewModel.filters.includeReferredOut == 1 ? 'Yes' : '';
                    filterObj.includeReferredOut = {
                        name: "Include Referred Out",
                        data: [includeReferredOutValue]
                    };

                    filterObj.statusCase = {
                        name: "Stalled",
                        data: [self.viewModel.filters.statusCase]
                    };
                }

                var attorneys = self.allUsers[1].attorny;
                var staffs = self.allUsers[4].staffonly;
                var paralegals = self.allUsers[3].paralegal;
                if (utils.isNotEmptyVal(self.viewModel.filters.leadAttorney)) {
                    var userObj = _.find(attorneys, function (user) {
                        return user.uid == self.viewModel.filters.leadAttorney;
                    });
                    var userName = userObj.name + ' ' + userObj.lname;
                    filterObj.leadAttorney = {
                        name: 'Lead Attorney',
                        data: [userName]
                    };
                } else {
                    filterObj.leadAttorney = {
                        name: 'Lead Attorney',
                        data: []
                    };
                }

                if (utils.isNotEmptyVal(self.viewModel.filters.attorney)) {
                    var userObj = _.find(attorneys, function (user) {
                        return user.uid == self.viewModel.filters.attorney;
                    });
                    var userName = userObj.name + ' ' + userObj.lname;
                    filterObj.attorney = {
                        name: 'Attorney',
                        data: [userName]
                    };
                } else {
                    filterObj.attorney = {
                        name: 'Attorney',
                        data: []
                    };
                }

                if (utils.isNotEmptyVal(self.viewModel.filters.staff)) {
                    var userObj = _.find(staffs, function (user) {
                        return user.uid == self.viewModel.filters.staff;
                    });
                    var userName = userObj.name + ' ' + userObj.lname;
                    filterObj.staff = {
                        name: 'Staff',
                        data: [userName]
                    };
                } else {
                    filterObj.staff = {
                        name: 'Staff',
                        data: []
                    };
                }

                if (utils.isNotEmptyVal(self.viewModel.filters.paralegal)) {
                    var userObj = _.find(paralegals, function (user) {
                        return user.uid == self.viewModel.filters.paralegal;
                    });
                    var userName = userObj.name + ' ' + userObj.lname;
                    filterObj.paralegal = {
                        name: 'Paralegal',
                        data: [userName]
                    };
                } else {
                    filterObj.paralegal = {
                        name: 'Paralegal',
                        data: []
                    };
                }

                if (utils.isNotEmptyVal(self.viewModel.filters.doiEnd) && utils.isNotEmptyVal(self.viewModel.filters.doiStart)) {
                    var start = moment.unix(self.viewModel.filters.doiStart).utc().format('MM/DD/YYYY');
                    var end = moment.unix(self.viewModel.filters.doiEnd).utc().format('MM/DD/YYYY');
                    filterObj.doi = {
                        name: 'DOI Range',
                        data: [start + ' - ' + end]
                    };
                }
                return filterObj;
            }

            function extractSubStatus() {
                var masterlist = angular.copy(self.viewModel.masterList);
                var statuses = self.viewModel.filters.statusFilter instanceof Array ? self.viewModel.filters.statusFilter : self.viewModel.filters.statusFilter.split(',');
                var getStatusAndSubStatus = [];
                _.forEach(statuses, function (item) {
                    _.forEach(masterlist.statuses, function (currentItem) {
                        if (item == currentItem.id) {
                            getStatusAndSubStatus.push(currentItem);
                        }
                    })
                })
                var selectedSubStatus = [];
                _.forEach(getStatusAndSubStatus, function (currentItem) {
                    _.forEach(currentItem["sub-status"], function (currentI) {
                        selectedSubStatus.push(currentI);
                    })
                })
                return utils.isEmptyVal(selectedSubStatus) ? "" : selectedSubStatus;
            }

            function extractSubTypes() {
                var masterlist = angular.copy(self.viewModel.masterList);
                var statuses = _.find(masterlist['type'], function (status) {
                    return status.id === self.viewModel.filters['typeFilter'];
                })
                return utils.isEmptyVal(statuses) ? "" : statuses['sub-type'];
            }

            function getStatusWiseCounts() {
                var currentSelection;
                if (angular.isUndefined(self.selectionModel.allMatter)) {
                    self.selectionModel.allMatter = 1;
                }
                currentSelection = (self.selectionModel.allMatter == 1) ? "my" : "all";
                var promesa = matterFactory.getStatusWiseCounts(currentSelection);
                promesa.then(function (data) {
                    var newdata = {};
                    var all_data = {};
                    var stalled_data = {};

                    angular.forEach(data, function (value, key) {
                        switch (key) {
                            case 'All':
                                all_data[key] = value;
                                break;
                            case 'Stalled':
                                stalled_data[key] = value;
                                break;
                            default:
                                newdata[key] = value;
                                break;
                        }
                    });
                    data = newdata;
                    self.viewModel.statusWiseCounts = data;
                    self.viewModel.statusWiseCountsAll = all_data;
                    self.viewModel.statusWiseCountsStalled = stalled_data;
                    angular.extend(allDisplayStatuses, data, all_data, stalled_data);
                    //to highlight ALL statuswise filter assign all status obj  to selection model
                    //US#5557 for in Case of Stalled matter prevent assign of ALL statuswise to retain Active class on Stalled 
                    if (!self.selectionModel.multiFilters.statusCase == "Stalled") {
                        self.selectionModel.statusWise = self.viewModel.statusWiseCountsAll.All;
                    }
                    self.viewModel.matters = [];
                    self.display.matterListReceived = false;
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
                var promesa = matterFactory.getMaster();
                promesa.then(function (data) {
                    self.viewModel.masterList = data;
                }, function (reason) {

                });
            }

            /*Modal popup for Archived matter*/
            self.showArchivePopup = function (selectedData, filterdMatter) {
                /*               if (utils.isNotEmptyVal(self.viewModel.filters.filterText)) {
                                   var filteredMatterData = angular.copy(filterdMatter);
                                   //filteredMatterData 
                                   var selectedMatterIds = _.pluck(selectedData, 'matter_id');
                                   // filteredMatterData.contains(selectedMatterIds);
                                   filteredMatterData = _.filter(filteredMatterData, function (item) { 
                                       return (selectedMatterIds.indexOf(item.matter_id) != -1); 
                                   });
                                   selectedData = filteredMatterData;
                               }*/
                // This above approach could be used if we need to archive matters based on currently shown selected matters
                /*if (utils.isNotEmptyVal(self.viewModel.filters.filterText)) {
                    selectedData = filterdMatter;
                }*/
                var selectedMatters = _.pluck(selectedData, 'matter_id');
                var modalInstance = $modal.open({
                    templateUrl: "app/matter/matter-list/partials/archived-popup.html",
                    controller: "ArchivePopupCtrl",
                    windowClass: 'medicalIndoDialog',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        matterstoArchive: function () {
                            return selectedMatters;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    getStatusWiseCounts(); //update matter counts
                    /*Initialise after archival*/
                    self.init();
                }, function () { });

            }

            /*pop up view for add/edit matter */
            self.openAddEditmatterview = function (matter_id) {
                var matterObj = { matterId: matter_id };

                var modalInstance = $modal.open({
                    templateUrl: 'app/matter/add-matter/add-matter.html',
                    controller: 'AddMatterCtrl as addCtrl',
                    windowClass: 'modalXLargeDialog',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        modalParams: function () {
                            return matterObj;
                        }
                    },
                });

                modalInstance.result.then(function (obj) {
                    //US#9999 - Take user to Overview page after new matter is added
                    if (obj && utils.isNotEmptyVal(obj.matterId) && obj.mode == 'add') {
                        $location.path("/allParties/" + obj.matterId);
                    } else if (obj && utils.isNotEmptyVal(obj.matterId) && obj.mode == 'edit') {
                        $location.path("/matter-overview/" + obj.matterId);
                    }
                    else {
                        /*Initialise after adding/editing matter*/
                        self.init();
                        self.pageNum = 1;
                        self.showPager = true;
                        self.getMasterList();
                    }
                }, function (error) {
                });
            }
            self.init();

        }
    ]);
})();

(function () {
    angular.module('cloudlex.matter')
        .factory('matterListHelper', matterListHelper);

    function matterListHelper() {
        var selectedMatter = {};
        return {
            setModifiedDisplayDate: setModifiedDisplayDate,
            getGridHeaders: getGridHeaders,
            isMatterSelected: isMatterSelected,
            getFiltersObj: getFiltersObj,
            setStatuswiseFilter: setStatuswiseFilter,
            createFilterTags: createFilterTags,
            setSelectedMatter: setSelectedMatter
        }

        function setModifiedDisplayDate(matterList) {
            _.forEach(matterList, function (matter) {
                matter.modified_date_display = moment.unix(matter.modified_date).format('DD MMM YYYY');
                matter.date_of_incidence = (utils.isEmptyVal(matter.date_of_incidence) || (matter.date_of_incidence == 0)) ? "-" : moment.unix(matter.date_of_incidence).utc().format('MM/DD/YYYY');
            });

        }

        function getGridHeaders() {
            return [

                {
                    dataWidth: "4",
                    field: [{
                        html: '<span  data-ng-if="data.is_retrieved == 1" class="sprite retrieve-alert-icon center-block" tooltip-append-to-body="true" tooltip="Retrieved"></span>'
                    }],

                },
                {
                    field: [{
                        prop: 'matter_name',
                        href: { link: '#/matter-overview', paramProp: ['matter_id'] }
                    },
                    {
                        prop: 'fileNindex',
                        //template: 'custom',
                        //customTemplate: '<div data-toggle="lattorney-tooltip" data-placement="bottom"  title="{cellData}">{cellData}</div>'
                    },
                    {
                        prop: 'date_of_incidence',
                        //template: 'custom',
                        //customTemplate: '<div data-toggle="lattorney-tooltip" data-placement="bottom"  title="{cellData}">{cellData}</div>'
                    }],
                    displayName: '<b>Matter Name,<br/> File# & Index/Docket#, <br/> Date of Incident</b>',
                    dataWidth: "19"
                },
                {
                    field: [{
                        prop: 'status',
                        filter: 'replaceByDash'
                    },
                    {
                        prop: 'sub_status',
                        filter: 'replaceByDash'
                    }
                    ],
                    displayName: '<b>Status & Substatus</b>',
                    dataWidth: "15"

                },
                {
                    field: [{
                        prop: 'type',
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
                    displayName: '<b>Type, Subtype, <br/> Category & Law Type</b>',
                    dataWidth: "20"

                },
                {
                    field: [{
                        prop: 'plaintiff_name'
                    }],
                    displayName: '<b>Plaintiff Name</b>',
                    dataWidth: "14"

                }, //plaintiff column added  
                {
                    field: [{
                        prop: 'courtName'
                    },
                    {
                        prop: 'courtVenue'
                    }
                    ],
                    displayName: '<b>Court & Venue</b>',
                    dataWidth: "10"

                },
                {
                    field: [{
                        prop: 'matter_lead_attorney',
                    },
                    {
                        prop: 'matter_attorney'
                    }],
                    displayName: '<b>Lead Attorney & <br/>Attorney</b>',
                    dataWidth: "15"
                }
            ];
        }

        function setSelectedMatter(selecMatter) {
            selectedMatter = selecMatter;
        }
        function isMatterSelected(matterList, matter) {
            var ids = _.pluck(matterList, 'matter_id');
            return ids.indexOf(matter.matter_id) > -1;
        }

        function getFiltersObj(filters, getAll, masterList, flagVal) {

            var formattedFilters = {};

            formattedFilters.statusFilter = "[]";
            if (filters.statusFilter) {

                if (filters.statusFilter == "all"
                    // || filters.statusFilter == "stalled"
                    ||
                    filters.statusFilter == "archived") {
                    formattedFilters.statusFilter = filters.statusFilter;
                } else if (filters.statusFilter == "stalled") {
                    formattedFilters.statusFilter = '';
                } else {
                    var statusData = JSON.stringify(getStatusFilter(filters, masterList));
                    formattedFilters.statusFilter = angular.isUndefined(statusData) ? '' : statusData;
                }
            }

            if (filters.lastMatterId) { formattedFilters.matter_id = filters.lastMatterId; }
            formattedFilters.typeFilter = filters.typeFilter ? filters.typeFilter : "";
            formattedFilters.lawtypeFilter = filters.lawtypeFilter ? filters.lawtypeFilter : "";
            formattedFilters.categoryFilter = filters.categoryFilter ? filters.categoryFilter : "";
            formattedFilters.venueFilter = filters.venueFilter ? filters.venueFilter : "";
            formattedFilters.subtypeFilter = filters.subTypeFilter ? filters.subTypeFilter : "";
            formattedFilters.sortby = filters.sortby;
            formattedFilters.pageSize = 250;
            if (utils.isNotEmptyVal(getAll)) {
                formattedFilters.pageSize = getAll;
            }
            formattedFilters.leadAttorney = utils.isEmptyVal(filters.leadAttorney) ? '' : filters.leadAttorney;
            formattedFilters.attorney = utils.isEmptyVal(filters.attorney) ? '' : filters.attorney;
            formattedFilters.staff = utils.isEmptyVal(filters.staff) ? '' : filters.staff;
            formattedFilters.paralegal = utils.isEmptyVal(filters.paralegal) ? '' : filters.paralegal;
            formattedFilters.doiStart = utils.isEmptyVal(filters.doiStart) ? '' : filters.doiStart;
            formattedFilters.doiEnd = utils.isEmptyVal(filters.doiEnd) ? '' : filters.doiEnd;
            formattedFilters.pageNum = filters.pageNum;
            formattedFilters.isMyMatter = flagVal;

            //US#5557 For stalled matters pass two extra parameteres 
            if (filters.statusFilter == "stalled" || filters.statusCase == "Stalled") {
                formattedFilters.statusCase = utils.isEmptyVal(filters.statusCase) ? 'Stalled' : filters.statusCase;
                formattedFilters.includeReferredOut = utils.isEmptyVal(filters.includeReferredOut) ? '' : filters.includeReferredOut;
            }
            return formattedFilters;
        };

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

        function getArrayString(array) {
            var str = (array != null ? array.toString() : "");
            return "[" + str + "]";
        };

        function setStatuswiseFilter(filters, statuswiseId) {
            //if statusFilter is not defined then assign statuswise id 
            if (angular.isUndefined(filters.statusFilter)) {
                //check if statuswise id is defined
                //this condition is to manager the page load call 
                //where self.selectionModel.statusWise.id is not defined
                //statuswise is assigned later in when we receive all the status
                if (angular.isDefined(statuswiseId)) {
                    filters.statusFilter = [statuswiseId];
                }
            } else {
                //if statuswise filter is not all or stalled or archived then assign statswise id
                if (!(filters.statusFilter == "all" ||
                    filters.statusCase == "Stalled" ||
                    filters.statusFilter == "archived")) {
                    filters.statusFilter = [statuswiseId];
                } else if (filters.statusCase == "Stalled") {
                    filters.statusFilter = [statuswiseId];
                }
            }
        }

        function createFilterTags(filters, masterList, toBeExcluded, users) {
            var tags = [];
            var attorneys = [];
            var staffs = [];
            var paralegals = [];
            (users != undefined) ? attorneys = users[1].attorny : attorneys = [];
            (users != undefined) ? staffs = users[4].staffonly : staffs = [];
            (users != undefined) ? paralegals = users[3].paralegal : paralegals = [];
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
                        return parseInt(filter.id) === parseInt(filterId);
                    });

                    if (angular.isDefined(selectedFilter)) {
                        selectedFilter.value = utils.isEmptyString(selectedFilter.value) ? '{Blank}' : selectedFilter.value;
                        selectedFilter.value = filterObj.tagname + ' : ' + selectedFilter.value;
                        tags.push(selectedFilter);
                    }
                });
            });

            if (utils.isNotEmptyVal(filters.leadAttorney)) {
                var userObj = _.find(attorneys, function (user) {
                    return user.uid == filters.leadAttorney;
                });
                var userName = userObj.name + ' ' + userObj.lname;
                var filterTag = {
                    value: 'Lead Attorney: ' + userName,
                    type: 'leadAttorney'
                };
                tags.push(filterTag);
            }

            if (utils.isNotEmptyVal(filters.attorney)) {
                var userObj = _.find(attorneys, function (user) {
                    return user.uid == filters.attorney;
                });
                var userName = userObj.name + ' ' + userObj.lname;
                var filterTag = {
                    value: 'Attorney: ' + userName,
                    type: 'attorney'
                };
                tags.push(filterTag);
            }

            if (utils.isNotEmptyVal(filters.staff)) {
                var userObj = _.find(staffs, function (user) {
                    return user.uid == filters.staff;
                });
                var userName = userObj.name + ' ' + userObj.lname;
                var filterTag = {
                    value: 'Staff: ' + userName,
                    type: 'staff'
                };
                tags.push(filterTag);
            }

            if (utils.isNotEmptyVal(filters.paralegal)) {
                var userObj = _.find(paralegals, function (user) {
                    return user.uid == filters.paralegal;
                });
                var userName = userObj.name + ' ' + userObj.lname;
                var filterTag = {
                    value: 'Paralegal: ' + userName,
                    type: 'paralegal'
                };
                tags.push(filterTag);
            }

            if (utils.isNotEmptyVal(filters.includeReferredOut)) {
                if (filters.includeReferredOut == 1) {
                    var referredOutValue = filters.includeReferredOut == 1 ? 'Yes' : '';
                    var filterTag = {
                        value: 'Include Referred Out: ' + referredOutValue,
                        type: 'includeReferredOut'
                    };
                    tags.push(filterTag);
                }
            }

            if (utils.isNotEmptyVal(filters.substatusFilter)) {
                var statusId = filters.statusFilter instanceof Array ? filters.statusFilter : filters.statusFilter.split(',');
                var statusObj = [];
                _.forEach(statusId, function (item) {
                    _.forEach(masterList.statuses, function (currentItem) {
                        if (item == currentItem.id) {
                            statusObj.push(currentItem);
                        }
                    })
                })
                if (angular.isDefined(statusObj)) {
                    if (utils.isNotEmptyVal(filters.substatusFilter)) {
                        var selectedSubstatuses;
                        selectedSubstatuses = _.pluck(statusObj, 'sub-status');
                        var appliedSubstatuses = utils.isNotEmptyVal(filters.substatusFilter) ? filters.substatusFilter.split(',') : filters.substatusFilter;
                        _.forEach(appliedSubstatuses, function (subStId) {
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
                                    id: subSt.id,
                                    type: 'substatus',
                                    value: 'Sub-Status: ' + subSt.name
                                };
                                tags.push(tagObj);
                            })
                        })
                    }
                }
            }

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

            //DOI date range tags
            if (utils.isNotEmptyVal(filters.doiEnd) && utils.isNotEmptyVal(filters.doiStart)) {
                var start = moment.unix(filters.doiStart).utc().format('MM/DD/YYYY');
                var end = moment.unix(filters.doiEnd).utc().format('MM/DD/YYYY');

                var tag = {
                    value: 'DOI range: ' + start + ' - ' + end,
                    type: 'doi'
                };

                tags.push(tag);
            }

            if (filters.statusCase != 'Stalled') {
                excludeTags(tags, toBeExcluded);
                return tags;
            } else {
                return tags;
            }
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
