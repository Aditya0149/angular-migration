// jshint maxdepth:2
// jshint maxstatements:30
// jshint unused:true

(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name cloudlex.motion.controller:MotionCtrl
     * @requires $stateParams, $state, $modal, motionHelper, motionDataService, masterData
     * @description
     * The MotionCtrl manages the display of the motion in grid view
     * It manages the control and handles the button clicks etc.
     */

    angular.module('cloudlex.motion').controller('MotionCtrl', ['$stateParams', '$state', '$modal', 'motionHelper', 'motionDataService', 'masterData',
        function ($stateParams, $state, $modal, motionHelper, motionDataService, masterData) {

            var self = this;
            self.matterId = $stateParams.matterId;
            var mstData = angular.copy(masterData.getMasterData());

            self.redirectTo = redirectTo;
            self.getMoreData = getMoreData;
            self.toggleFilterPage = toggleFilterPage;
            self.applySortByFilter = applySortByFilter;
            self.getAllMotionList = getAllMotionList;
            self.motionByUS = motionByUS;
            self.motionOnUs = motionOnUs;
            self.tagCancelled = tagCancelled;

            //initialization start
            self.init = function () {
                self.motionFieldValue = 0;
                self.tags = [];
                self.getAllDataFlag = false;
                self.sortbyOptions = motionHelper.sortByValues();
                initModels();
                getData();
                self.display = {
                    filtered: true,
                    motionListReceived: false
                };
                self.clxGridOptions = {
                    headers: motionHelper.getGridHeaders()
                };
                self.viewModel.motionList = mstData;
            };

            /**
             * @ngdoc method
             * @name cloudlex.motion.MotionCtrl#initModels
             * @methodOf cloudlex.motion.MotionCtrl
             * @description
             * this method is used to call another method from it
             */
            function initModels() {
                initViewModel();
                initSelectionModel();
                var persistfilter = JSON.parse(sessionStorage.getItem("motionFiltertags"));
                var retainsFilter = JSON.parse(sessionStorage.getItem("retainFilters"));
                if (utils.isNotEmptyVal(retainsFilter)) {
                    if (self.matterId == retainsFilter.matterID) {
                        if (utils.isNotEmptyVal(persistfilter)) {
                            self.tags = persistfilter;
                        }
                    }

                }


                // getMotionList();
            }

            /**
             * @ngdoc method
             * @name cloudlex.motion.MotionCtrl#initViewModel
             * @methodOf cloudlex.motion.MotionCtrl
             * @description
             * this method is used to to initialize default filter values, motion list.
             */
            function initViewModel() {
                self.viewModel = {
                    motionList: []
                };
                self.viewModel.page = "GRIDVIEW";
                self.viewModel.motions = [];
                self.viewModel.filters = motionHelper.defaultFilter(self.matterId);
            }

            /**
             * @ngdoc method
             * @name cloudlex.motion.MotionCtrl#initSelectionModel
             * @methodOf cloudlex.motion.MotionCtrl
             * @description
             * this method is used to to initialize customized filter which user can modify accordingly.
             */
            function initSelectionModel() {
                self.selectionModel = {
                    multiFilters: {
                        motion_statuses: [],
                        motion_types: []
                    }
                };
            }

            /**
             * @ngdoc method
             * @name cloudlex.motion.MotionCtrl#getData
             * @methodOf cloudlex.motion.MotionCtrl
             * @description
             * this method is used to get masterData which help to selected the default selected value of customized filter
             */
            function getData() {
                var persistfilter = JSON.parse(sessionStorage.getItem("motionFiltertags"));
                var retainsFilter = JSON.parse(sessionStorage.getItem("retainFilters"));
                if (utils.isNotEmptyVal(retainsFilter)) {
                    if (self.matterId == retainsFilter.matterID) {
                        if (utils.isNotEmptyVal(persistfilter)) {
                            _.forEach(mstData.motion_statuses, function (itemmotion) {
                                _.forEach(persistfilter, function (item) {
                                    if (itemmotion.id == item.key && item.type == "motion_statuses") {
                                        self.selectionModel.multiFilters.motion_statuses.push(itemmotion);
                                    }
                                });
                            });
                        }
                    } else {
                        if (angular.isDefined(mstData) && angular.isDefined(mstData.motion_statuses)) {
                            _.forEach(mstData.motion_statuses, function (item) {
                                if (item.motion_status_type == "open") {
                                    self.selectionModel.multiFilters.motion_statuses.push(item);
                                }
                            });
                        }
                    }
                } else {
                    if (angular.isDefined(mstData) && angular.isDefined(mstData.motion_statuses)) {
                        _.forEach(mstData.motion_statuses, function (item) {
                            if (item.motion_status_type == "open") {
                                self.selectionModel.multiFilters.motion_statuses.push(item);
                            }
                        });
                    }
                }

                if (utils.isNotEmptyVal(retainsFilter)) {
                    if (self.matterId == retainsFilter.matterID) {
                        if (utils.isEmptyVal(persistfilter)) {
                            if (angular.isDefined(mstData) && angular.isDefined(mstData.motion_statuses)) {
                                _.forEach(mstData.motion_statuses, function (item) {
                                    if (item.motion_status_type == "open") {
                                        self.selectionModel.multiFilters.motion_statuses.push(item);
                                    }
                                });
                            }
                        }
                    }
                }

                if (utils.isNotEmptyVal(retainsFilter)) {
                    if (self.matterId == retainsFilter.matterID) {
                        if (utils.isNotEmptyVal(persistfilter)) {
                            _.forEach(mstData.motion_types, function (itemmotion) {
                                _.forEach(persistfilter, function (item) {
                                    if (itemmotion.id == item.key && item.type == "motion_types") {
                                        self.selectionModel.multiFilters.motion_types.push(itemmotion);
                                    }
                                });
                            });
                        }
                    }
                }

                //applyMultiSelectFilter();
                getMotionList();
            }


            /**
             * @ngdoc method
             * @name cloudlex.motion.MotionCtrl#motionByUS
             * @methodOf cloudlex.motion.MotionCtrl
             * @description
             * this method is used to get the details for 'motion by us'
             *
             * @param {int} getting param from UI to highlight the selected button
             */
            function motionByUS(val) {
                self.viewModel.filters.pageNum = 1;
                self.getAllDataFlag = false;
                self.viewModel.filters.motion_on_by = 'by';
                self.motionFieldValue = val;
                getMotionList();
            }

            /**
             * @ngdoc method
             * @name cloudlex.motion.MotionCtrl#motionOnUs
             * @methodOf cloudlex.motion.MotionCtrl
             * @description
             * this method is used to get the details for 'motion on us'
             *
             * @param {int} getting param from UI to highlight the selected button
             */
            function motionOnUs(val) {
                self.viewModel.filters.pageNum = 1;
                self.getAllDataFlag = false;
                self.viewModel.filters.motion_on_by = 'on';
                self.motionFieldValue = val;
                getMotionList();
            }

            /**
             * @ngdoc method
             * @name cloudlex.motion.MotionCtrl#redirectTo
             * @methodOf cloudlex.motion.MotionCtrl
             * @description
             * this method is used to redirect the user to document page
             *
             * @param {int} getting documentId from the user click
             */
            function redirectTo(documentId) {
                $state.go('document-view', { "matterId": self.matterId, "documentId": documentId });

            }

            /**
             * @ngdoc method
             * @name cloudlex.motion.MotionCtrl#toggleFilterPage
             * @methodOf cloudlex.motion.MotionCtrl
             * @description
             * this method is used to open the filter popup page in which user is having option to select status and type
             */
            function toggleFilterPage() {



                var modalInstance = $modal.open({
                    templateUrl: "app/motion/partials/motionFilters.html",
                    controller: "MotionFilterCtrl",
                    windowClass: 'medicalIndoDialog',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        params: function () {
                            return {
                                masterData: self.viewModel.motionList,
                                filters: angular.copy(self.selectionModel.multiFilters)
                            };
                        }
                    }
                });
                modalInstance.result.then(function (selectedItem) {
                    self.viewModel.filters.pageNum = 1;
                    self.getAllDataFlag = false;
                    self.selectionModel.multiFilters.defaultFilter = false;
                    self.selectionModel.multiFilters = selectedItem;
                    //localStorage.setItem("retainFiltersAll", JSON.stringify(self.selectionModel.multiFilters));
                    applyMultiSelectFilter();

                }, function () {

                });
            }

            /**
             * @ngdoc method
             * @name cloudlex.motion.MotionCtrl#applyMultiSelectFilter
             * @methodOf cloudlex.motion.MotionCtrl
             * @description
             * this method is used for set the value which user has selected from filter popup
             */
            function applyMultiSelectFilter() {
                var postArray = ['motionStatusesFilter', 'motionTypeFilter'];
                var valKey = ['motion_statuses', 'motion_types'];
                _.each(postArray, function (val, index) {
                    var data = _.pluck(self.selectionModel.multiFilters[valKey[index]], "id").join();
                    if (!_.isEmpty(data)) {
                        self.viewModel.filters[val] = data;
                    } else {
                        self.viewModel.filters[val] = [];
                    }
                });
                self.tags = motionHelper.createFilterTags(self.viewModel.filters, self.viewModel.motionList);
                getMotionList();
            }

            /**
             * @ngdoc method
             * @name cloudlex.motion.MotionCtrl#applySortByFilter
             * @methodOf cloudlex.motion.MotionCtrl
             * @description
             * this method is used for set the value which user has selected from filter popup
             *
             * @param {int, string} getting two param sortBy and sortOrder
             */
            function applySortByFilter(sortBy, sortOrder) {
                self.viewModel.filters.sortBy = sortBy;
                if (sortOrder == "returnableDateASC") {
                    self.viewModel.filters.sortOrder = "asc";
                    self.viewModel.filters.sortByValueForDropDown = 0;
                } else if (sortOrder == "returnableDateDESC") {
                    self.viewModel.filters.sortOrder = "desc";
                    self.viewModel.filters.sortByValueForDropDown = 1;
                } else if (sortOrder == "dateOfServiceASC") {
                    self.viewModel.filters.sortOrder = "asc";
                    self.viewModel.filters.sortByValueForDropDown = 2;
                } else if (sortOrder == "dateOfServiceDESC") {
                    self.viewModel.filters.sortOrder = "desc";
                    self.viewModel.filters.sortByValueForDropDown = 3;
                } else if (sortOrder == "judgeASC") {
                    self.viewModel.filters.sortOrder = "asc";
                    self.viewModel.filters.sortByValueForDropDown = 4;
                } else if (sortOrder == "judgeDESC") {
                    self.viewModel.filters.sortOrder = "desc";
                    self.viewModel.filters.sortByValueForDropDown = 5;
                } else if (sortOrder == "daysOverdueASC") {
                    self.viewModel.filters.sortOrder = "asc";
                    self.viewModel.filters.sortByValueForDropDown = 6;
                } else if (sortOrder == "daysOverdueDESC") {
                    self.viewModel.filters.sortOrder = "desc";
                    self.viewModel.filters.sortByValueForDropDown = 7;
                } else if (sortOrder == "docNameASC") {
                    self.viewModel.filters.sortOrder = "asc";
                    self.viewModel.filters.sortByValueForDropDown = 8;
                } else if (sortOrder == "docNameDESC") {
                    self.viewModel.filters.sortOrder = "desc";
                    self.viewModel.filters.sortByValueForDropDown = 9;
                }


                getMotionList();
            }

            /**
             * @ngdoc method
             * @name cloudlex.motion.MotionCtrl#getMotionList
             * @methodOf cloudlex.motion.MotionCtrl
             * @description
             * this method is used to get the data from API call and display it on the screen
             */
            function getMotionList() {
                setMultiSelectFilter();

                var filterObj = motionHelper.getFiltersObj(self.viewModel.filters);
                var promesa = motionDataService.getMotionDetail(filterObj);
                promesa.then(function (data) {
                    utils.replaceNullByEmptyStringArray(data);
                    self.display.motionListReceived = true;
                    motionHelper.setModifiedDisplayDate(data);
                    self.viewModel.motions = data;
                    self.tags = motionHelper.createFilterTags(self.viewModel.filters, self.viewModel.motionList);
                }, function (reason) { });
            }

            /**
             * @ngdoc method
             * @name cloudlex.motion.MotionCtrl#getAllMotionList
             * @methodOf cloudlex.motion.MotionCtrl
             * @description
             * this method is used if user want's to view all record
             */
            function getAllMotionList() {
                self.getAllDataFlag = true;
                self.viewModel.filters.pageNum = self.viewModel.filters.pageNum + 1;
                self.viewModel.filters.allmotion = true;
                //getStatusWiseCounts();
                getMotionList();

            }

            /**
             * @ngdoc method
             * @name cloudlex.motion.MotionCtrl#getMoreData
             * @methodOf cloudlex.motion.MotionCtrl
             * @description
             * this method is used for pagination if user want to see more data
             */
            function getMoreData() {
                self.viewModel.filters.pageNum = self.viewModel.filters.pageNum + 1;
                getMotionList();
            }

            /**
             * @ngdoc method
             * @name cloudlex.motion.MotionCtrl#setMultiSelectFilter
             * @methodOf cloudlex.motion.MotionCtrl
             * @description
             * this method is used to set filter for the first time when the page is displayed
             */
            function setMultiSelectFilter() {
                var postArray = ['motionStatusesFilter', 'motionTypeFilter'];
                var valKey = ['motion_statuses', 'motion_types'];
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

            /**
             * @ngdoc method
             * @name cloudlex.motion.MotionCtrl#tagCancelled
             * @methodOf cloudlex.motion.MotionCtrl
             * @description
             * this method is used to clear the filter from motion grid screen, where user click on the cross button to deselect that particular filter
             *
             * @param {Obj} filter
             */
            function tagCancelled(cancelled) {
                //get array of current filter of the cancelled type
                var currentFilters = _.pluck(self.selectionModel.multiFilters[cancelled.type], 'id');
                //remove the cancelled filter
                var index = currentFilters.indexOf(cancelled.key);
                self.selectionModel.multiFilters[cancelled.type].splice(index, 1);
                //reassign the new filters
                applyMultiSelectFilter();
            }

            self.init();

        }
    ]);
})();


(function () {
    angular.module('cloudlex.motion')
        .factory('motionHelper', motionHelper);

    motionHelper.$inject = ['$rootScope', '$stateParams'];




    function motionHelper($rootScope, $stateParams) {
        return {
            setModifiedDisplayDate: setModifiedDisplayDate,
            getGridHeaders: getGridHeaders,
            getFiltersObj: getFiltersObj,
            createFilterTags: createFilterTags,
            sortByValues: sortByValues,
            defaultFilter: defaultFilter
        }

        function defaultFilter(matterId) {

            var defaultFilter = {};
            defaultFilter = {
                matterId: matterId,
                filterText: '',
                sortByValueForDropDown: 7,
                useExternalFilter: true,
                sortBy: 4,
                motion_on_by: 'by',
                pageNum: 1,
                sortOrder: 'desc'
            }

            return defaultFilter;

        }

        function sortByValues() {
            var sortByValueArray = self.sortbyOptions = ['Returnable date ASC', 'Returnable date DESC', 'Date of Service ASC', 'Date of Service DESC', 'Judge ASC', 'Judge DESC', 'Days Overdue ASC', 'Days Overdue DESC', 'Document Name ASC', 'Document Name DESC'];
            return sortByValueArray;
        }

        function setModifiedDisplayDate(motionDetailList) {
            _.forEach(motionDetailList, function (motion) {
                if (motion.motion_date_of_service == '' || motion.motion_date_of_service == 0 || motion.motion_date_of_service == null) {
                    motion.motion_date_of_service = '-';
                } else {
                    motion.motion_date_of_service = moment.unix(motion.motion_date_of_service).utc().format('DD MMM YYYY');
                }
                if (motion.motion_date_returnable == '' || motion.motion_date_returnable == 0 || motion.motion_date_returnable == null) {
                    motion.motion_date_returnable = '-';
                } else {
                    motion.motion_date_returnable = moment.unix(motion.motion_date_returnable).utc().format('DD MMM YYYY');
                }
                if (motion.motion_datecreated == '' || motion.motion_datecreated == 0 || motion.motion_datecreated == null) {
                    motion.motion_datecreated = '-';
                } else {
                    motion.motion_datecreated = moment.unix(motion.motion_datecreated).format('DD MMM YYYY');
                }

                if (motion.motion_title == '' || motion.motion_title == 0 || motion.motion_title == null) {
                    motion.motion_title = '-';
                } else {
                    motion.motion_title = motion.motion_title;
                }
                if (motion.motion_type_name == '' || motion.motion_type_name == 0 || motion.motion_type_name == null) {
                    motion.motion_type_name = '-';
                } else {
                    motion.motion_type_name = motion.motion_type_name;
                }
                if (motion.motion_status_name == '' || motion.motion_status_name == 0 || motion.motion_status_name == null) {
                    motion.motion_status_name = '-';
                } else {
                    motion.motion_status_name = motion.motion_status_name;
                }
                if (motion.judge_name == '' || motion.judge_name == 0 || motion.judge_name == null) {
                    motion.judge_name = '-';
                } else {
                    motion.judge_name = motion.judge_name;
                }

            });
        }

        function getGridHeaders() {
            return [{
                field: [{
                    prop: 'motion_title',
                    template: 'bold',
                    href: '#matter-documents/view'
                }],
                displayName: 'Title',
                dataWidth: '11'
            },
            {
                field: [{
                    prop: 'motion_date_returnable',
                    href: '#matter-documents/view'
                }],
                displayName: 'Returnable Date',
                dataWidth: '11'
            },
            {
                field: [{
                    prop: 'motion_date_of_service',
                    href: '#matter-documents/view'
                }],
                displayName: 'Date of Service',
                dataWidth: '11'

            },
            {
                field: [{
                    prop: 'motion_type_name',
                    href: '#matter-documents/view'
                }],
                displayName: 'Type',
                dataWidth: '11'

            },
            {
                field: [{
                    prop: 'motion_status_name',
                    href: '#matter-documents/view'
                }],
                displayName: 'Status',
                dataWidth: '11'

            },


            {
                field: [{
                    prop: 'document_name',
                    href: '#matter-documents/view'
                }],
                displayName: 'Document Name',
                dataWidth: '11'

            },
            {
                field: [{
                    prop: 'judge_name',
                    href: '#matter-documents/view'
                }],
                displayName: 'Judge',
                dataWidth: '11'

            },
            {
                field: [{
                    prop: 'motion_daysoverdue',
                    href: '#matter-documents/view'
                }],
                displayName: 'Days overdue',
                dataWidth: '11'

            },
            {
                field: [{
                    prop: 'motion_datecreated',
                    href: '#matter-documents/view'
                }],
                displayName: 'Date Created',
                dataWidth: '11'

            }
            ];
        }

        function getFiltersObj(filters, getAll) {
            var formattedFilters = {};

            formattedFilters.matter_id = filters.matterId;
            formattedFilters.motion_on_by = filters.motion_on_by;
            formattedFilters.page_num = filters.pageNum;
            formattedFilters.page_size = 10000;
            if (filters.allmotion == true) {
                formattedFilters.allmotion = filters.allmotion;
            }

            formattedFilters.motion_status_name = filters.motionStatusesFilter ? filters.motionStatusesFilter : "";

            formattedFilters.motion_type_name = filters.motionTypeFilter ? filters.motionTypeFilter : "";

            formattedFilters.sort_by = filters.sortBy;

            formattedFilters.sort_order = filters.sortOrder;

            return formattedFilters;
        };

        function getArrayString(array) {
            var str = (array != null ? array.toString() : "");
            return "[" + str + "]";
        };

        function createFilterTags(filters, motionList) {
            var tags = [];
            var filterArray = [
                { type: 'motion_statuses', list: 'motion_statuses', filter: 'motionStatusesFilter', tagname: 'MotionStatus' },
                { type: 'motion_types', list: 'motion_types', filter: 'motionTypeFilter', tagname: 'MotionType' }
            ];

            _.forEach(filterArray, function (filterObj) {
                var filterData
                filterData = getFilterValues(motionList, filterObj.list, filterObj.type);
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

            self.matterId = $stateParams.matterId;
            var retainsFilter = JSON.parse(sessionStorage.getItem("retainFilters"));
            if (utils.isNotEmptyVal(retainsFilter)) {
                if (self.matterId != retainsFilter.matterID) {
                    sessionStorage.removeItem("documentFiltersMatter");
                    sessionStorage.removeItem("matterNotesFilters");
                    sessionStorage.removeItem("timeLineListFilters");
                }
            }
            $rootScope.retainFilters.matterID = self.matterId;
            sessionStorage.setItem("retainFilters", JSON.stringify($rootScope.retainFilters));
            sessionStorage.setItem("motionFiltertags", JSON.stringify(tags));
            return tags;
        }

        function getFilterValues(masterList, filter, type) {
            if (_.isObject(masterList)) {
                return masterList[filter].map(function (item) {
                    return {
                        key: item.id,
                        value: item.name,
                        type: type || ''
                    };
                });
            } else {
                return [];
            }

        }
    }

})();