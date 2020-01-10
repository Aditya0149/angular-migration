(function () {
    'use strict';

    angular.module('cloudlex.report').controller('UpcomingNOCsCtrl', ['reportFactory', '$modal', 'upcomingNOCsReportHelper', 'upcomingSOLsReportHelper',
        function (reportFactory, $modal, upcomingNOCsReportHelper, upcomingSOLsReportHelper) {

            var self = this;
            var matterList = [];
            var allDisplayStatuses = {};
            //dateFlag                
            self.lastYearFlag = true;
            self.lastSixMonthFlag = false;
            self.lastOneMonthFlag = true;
            self.customDateFlag = true;
            self.dateFieldValue = 0;
            self.getMatterList = getMatterList;
            self.upcomingNOCs30Days = upcomingNOCs30Days;
            self.upcomingNOCs15Days = upcomingNOCs15Days;
            self.applyFilterLazyLoading = applyFilterLazyLoading;
            self.filterByUser = filterByUser;
            self.getAllMatterList = getAllMatterList;
            self.downloadMatters = downloadMatters;
            self.print = print;
            self.tagCancelled = tagCancelled;
            self.limitmoreall = 250;

            //initialization start
            self.init = function () {
                var viewModel = sessionStorage.getItem("upcomingNOCViewModel");
                var selectionModel = sessionStorage.getItem("upcomingNOCSelectionModel");
                //init clicked index
                self.clickedRow = -1;
                if (utils.isNotEmptyVal(viewModel) || utils.isNotEmptyVal(selectionModel)) {
                    try {
                        self.viewModel = JSON.parse(viewModel);
                        self.viewModel.matters = [];
                        self.selectionModel = JSON.parse(selectionModel);
                        self.tags = upcomingNOCsReportHelper.generateTags(self.viewModel.filters);
                    } catch (e) {
                        initModels();
                    }
                } else {
                    initModels();
                }
                (utils.isEmptyVal(self.viewModel.filters.complied)) ? self.viewModel.filters.complied = 2 : '';
                self.viewModel.filters.selectedReport = true;
                self.viewModel.filters.pageNum = 1;
                sessionStorage.setItem("reportTypeFlag", "NOC");
                getData();
                //display object for managing the display
                self.display = {
                    filtered: true,
                    matterListReceived: false,
                    matterSelected: {}
                };
                self.clxGridOptions = {
                    headers: upcomingNOCsReportHelper.getGridHeaders(),
                    selectedItems: []
                };
            }

            self.filterNOCReport = function () {
                var filter = angular.copy(self.viewModel.filters);
                filter.s = (filter.s) ? moment.unix(filter.s).utc().format('MM/DD/YYYY') : '';
                filter.e = (filter.e) ? moment.unix(filter.e).utc().format('MM/DD/YYYY') : '';
                filter.complied = filter.complied;
                filter.pageSize = 250;
                filter.pageNum = 1;



                var modalInstance = $modal.open({
                    templateUrl: 'app/report/allMatterList/filterPopUp/allMatter/upcomingSOLNOCPopup.html',
                    controller: 'SolFilterCtrl as filter',
                    windowClass: 'modalMidiumDialog',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        params: function () {
                            return {
                                filter: filter
                            };
                        }
                    }
                });

                modalInstance.result.then(function (filterObj) {
                    self.viewModel.filters.daysfilter = null;
                    self.viewModel.filters.matterId = utils.isNotEmptyVal(filterObj.filter.matterId) ? filterObj.filter.matterId : '';
                    self.viewModel.filters.s = utils.isEmptyObj(filterObj.filter) ? '' : filterObj.filter.s;
                    self.viewModel.filters.e = utils.isEmptyObj(filterObj.filter) ? '' : filterObj.filter.e;
                    self.viewModel.filters.includeArchived = filterObj.filter.includeArchived;
                    self.viewModel.filters.complied = filterObj.filter.complied;
                    // if (utils.isNotEmptyVal(self.viewModel.filters.s) && utils.isNotEmptyVal(self.viewModel.filters.e)) {
                    //     self.selectionModel.dateFieldValue = null;
                    // } else {
                    //     self.selectionModel.dateFieldValue = 0;
                    // }
                    self.viewModel.filters.pageNum = 1;
                    self.viewModel.filters.pageSize = filterObj.filter.pageSize;
                    self.tags = upcomingNOCsReportHelper.generateTags(filterObj.filter);
                    getMatterList(undefined, 'calDays');

                }, function () {

                });
            }

            function getFormatteddate(epoch) {
                var formdate = new Date(epoch * 1000);
                formdate = moment(formdate).utc().format('MM/DD/YYYY');
                return formdate;
            }

            function persistFilters() {
                var selectionModel = angular.copy(self.selectionModel);
                var viewModel = angular.copy(self.viewModel);
                viewModel.matters = [];
                sessionStorage.setItem("upcomingNOCViewModel", JSON.stringify(viewModel));
                sessionStorage.setItem("upcomingNOCSelectionModel", JSON.stringify(selectionModel));
            }

            function initModels() {
                initViewModel();
                initSelectionModel();
            };

            function initViewModel() {
                self.viewModel = {
                    masterList: []
                };
                self.viewModel.matters = [];
                self.viewModel.filters = {
                    filterText: '',
                    useExternalFilter: true,
                    daysfilter: 15,
                    s: '',
                    matterId: '',
                    complied: 2,
                    e: '',
                    pageSize: 250,
                    pageNum: 1,
                    eventype: 'noc',
                    for: 'mymatter',
                    includeArchived: 0,
                    reportName: 'mattereventtypereport'
                };
            }

            function upcomingNOCs15Days(param) {
                self.selectionModel.dateFieldValue = param;
                var start = utils.getUTCTimeStampStart(moment(new Date()));
                self.viewModel.filters.s = start;

                var end = utils.getUTCTimeStampEndDay(moment().add(15, 'days'));
                self.viewModel.filters.e = end;

                self.viewModel.filters.daysfilter = 15;
                self.viewModel.filters.pageNum = 1;
                self.tags = upcomingNOCsReportHelper.generateTags(self.viewModel.filters);
                getMatterList();
            };

            function upcomingNOCs30Days(param) {
                self.selectionModel.dateFieldValue = param;
                var start = utils.getUTCTimeStampStart(moment(new Date()));
                self.viewModel.filters.s = start;

                var end = utils.getUTCTimeStampEndDay(moment().add(30, 'days'));
                self.viewModel.filters.e = end;

                self.viewModel.filters.daysfilter = 30;
                self.viewModel.filters.pageNum = 1;
                self.tags = upcomingNOCsReportHelper.generateTags(self.viewModel.filters);
                getMatterList();
            };

            function initSelectionModel() {
                self.selectionModel = {
                    allMatter: 0,
                    dateFieldValue: 0,
                    multiFilters: {
                        categories: '',
                        types: '',
                        subtypes: '',
                        venues: ''
                    }
                };
            }

            function getData() {
                getMatterList(undefined, 'calDays');
            }
            //initialization end

            function applyFilterLazyLoading() {
                self.viewModel.filters.pageNum += 1;
                self.viewModel.filters.pageSize = 250;
                self.viewModel.filters.lastMatterId = _.last(self.viewModel.matters)['matter_id'];
                getNextMatterList();
            };

            //filter by users ('my matters','all matters')
            function filterByUser(param) {
                self.selectionModel.allMatter = param;
                if (param == 0) {
                    self.viewModel.filters.for = "mymatter";
                } else {
                    self.viewModel.filters.for = "allmatter";
                }
                getMatterList(undefined, 'calDays');
            };

            function getMatterList(getAll, info) {
                self.viewModel.filters.pageNum = 1;
                if (utils.isEmptyVal(self.viewModel.filters.s) && utils.isEmptyVal(self.viewModel.filters.e)) {
                    var start = utils.getUTCTimeStampStart(moment(new Date())); //Bug#5619
                    self.viewModel.filters.s = start;

                    var end = utils.getUTCTimeStampEndDay(moment().add(15, 'days'));//Bug#5619
                    self.viewModel.filters.e = end;
                    self.viewModel.filters.e = end;
                    self.tags = upcomingNOCsReportHelper.generateTags(self.viewModel.filters);//Bug#5619
                }
                if (info == 'calDays') {
                    var calDaysDiff = getDays(self.viewModel.filters);
                    if (calDaysDiff == 15) {
                        self.selectionModel.dateFieldValue = 0;
                    } else if (calDaysDiff == 30) {
                        self.selectionModel.dateFieldValue = 1;
                    } else {
                        self.selectionModel.dateFieldValue = null;
                    }
                }
                //init clicked index
                self.clickedRow = -1;
                var filterObj = upcomingNOCsReportHelper.getFiltersObj(self.viewModel.filters, getAll);
                persistFilters();
                var promesa = reportFactory.getMatterstats(filterObj, self.selectionModel.allMatter, '6');
                promesa.then(function (data) {
                    utils.replaceNullByEmptyStringArray(data);
                    self.display.matterListReceived = true;
                    matterList = data; //store all matters locally, this list will be used while client side filtering
                    upcomingSOLsReportHelper.setModifiedDisplayDate(matterList);
                    self.viewModel.matters = data.data ? data.data : [];
                    if (utils.isNotEmptyVal(self.viewModel.matters)) {
                        self.total = data.count;
                    }
                }, function (reason) { });
            };


            function getAllMatterList() {
                //getMatterList(10000);
                getMatterList('All');
            }

            function getNextMatterList() {
                var filterObj = upcomingNOCsReportHelper.getFiltersObj(self.viewModel.filters);
                var promesa = reportFactory
                    .getMatterstats(filterObj,
                        self.selectionModel.allMatter,'6');
                promesa.then(function (data) {
                    upcomingSOLsReportHelper.setModifiedDisplayDate(data);
                    _.forEach(data.data, function (item) {
                        self.viewModel.matters.push(item); //list of received
                        // self.viewModel.matters = matterList.matters; //data to be displayed
                    });
                    if (utils.isNotEmptyVal(self.viewModel.matters)) {
                        self.total = data.count;
                    }
                }, function (reason) {

                });
            };

            function downloadMatters() {
                var filterObj = upcomingNOCsReportHelper.getFiltersObj(self.viewModel.filters, 10000);
                filterObj.daysfilter = getDays(filterObj);
                if (filterObj) {
                    filterObj.matterid = utils.isEmptyVal(filterObj.matterid) ? filterObj.matterid : filterObj.matterid.matterid;
                }
                reportFactory.downLoadUpcomingNOCs(filterObj, self.viewModel.filters, '6', self.selectionModel.allMatter)
                    .then(function (response) {
                        utils.downloadFile(response.data, "Upcoming_NOCs_Report.xlsx", response.headers("Content-Type"));
                    })
            }

            function getDays(filter) {
                if (utils.isNotEmptyVal(filter)) {
                    if (utils.isNotEmptyVal(filter.s) && utils.isNotEmptyVal(filter.e)) {
                        var start = moment.unix(filter.s);
                        var end = moment.unix(filter.e);
                        if (end.diff(start, 'days', true) < 0) {
                            return 0;
                        } else {
                            return end.diff(start, 'days');
                        }
                    }
                }
                return 0;
            }

            function print() {

                var matterName = '';
                var startDate = '', endDate = '';

                if (utils.isNotEmptyVal(self.viewModel.filters)) {
                    startDate = utils.isNotEmptyVal(self.viewModel.filters.s) ? moment.unix(self.viewModel.filters.s).utc().format('MM/DD/YYYY') : '';
                    endDate = utils.isNotEmptyVal(self.viewModel.filters.e) ? moment.unix(self.viewModel.filters.e).utc().format('MM/DD/YYYY') : '';
                }

                if (utils.isNotEmptyVal(self.viewModel.filters.matterId)) {

                    if (utils.isNotEmptyVal(self.viewModel.filters.matterId)) {
                        matterName = utils.isNotEmptyVal(self.viewModel.filters.matterId.name) ? self.viewModel.filters.matterId.name : '';
                    }

                    var printObjFilter = {
                        'Matter': utils.removeunwantedHTML(matterName),
                        'Date Range From': 'from ' + startDate + ' to: ' + endDate
                    }

                } else {
                    var printObjFilter = {
                        'Matter': '',
                        'Date Range From': 'from ' + startDate + ' to: ' + endDate
                    }

                }
                reportFactory.printNOCsMatter(self.viewModel.matters, printObjFilter);
            };

            function tagCancelled(filter) {

                switch (filter.key) {
                    case 'dateRange':
                        self.viewModel.filters.s = "";
                        self.viewModel.filters.e = "";
                        break;
                    case 'matter':
                        self.viewModel.filters.matterId = '';
                        break;
                    case 'archivalMatters':
                        self.viewModel.filters.includeArchived = 0;
                        break;
                    case 'complied':
                        self.viewModel.filters.complied = 2;
                        break;
                }
                self.selectionModel.dateFieldValue = 0;
                //self.viewModel.filters.pageSize = 250;
                //self.viewModel.filters.pageNum=1;
                getMatterList(undefined, 'calDays');
            }
            self.init();
        }
    ]);
})();


(function () {
    angular.module('cloudlex.report')
        .factory('upcomingNOCsReportHelper', upcomingNOCsReportHelper);


    upcomingNOCsReportHelper.$inject = ["$filter", "reportConstant", "$http"];

    function upcomingNOCsReportHelper($filter, reportConstant, $http) {
        return {
            setModifiedDisplayDate: setModifiedDisplayDate,
            getGridHeaders: getGridHeaders,
            getFiltersObj: getFiltersObj,
            generateTags: generateTags,
            getPlaintiffs: getPlaintiffs
        }

        function setModifiedDisplayDate(matterList) {
            _.forEach(matterList.data, function (matter) {
                if (moment.unix(matter.nocdateutc).format('DD MMM YYYY') == "Invalid date") {
                    matter.nocdateutc = matter.nocdateutc;
                } else {
                    matter.nocdateutc = $filter('utcDateFilter')(matter.nocdateutc, 'DD MMM YYYY', 1, 'start');
                    // moment.unix(matter.nocdateutc).format('DD MMM');
                }
                if (matter.dateofincidenceutc == '' || matter.dateofincidenceutc == 0 || matter.dateofincidenceutc == null) {
                    matter.dateofincidenceutc = '';
                } else {
                    matter.dateofincidenceutc = moment.unix(matter.dateofincidenceutc).utc().format('DD MMM YYYY');
                }
                matter.nocdateutc1 = matter.nocdateutc.substr(0, 2);
                matter.nocdateutc2 = matter.nocdateutc.substr(3, 8);

            });
        }

        function getPlaintiffs(matterId) {
            if (matterId == undefined) {
                matterId = '';
            }
            var url = reportConstant.RESTAPI.getPlaintiffLimited + matterId;
            return $http.get(url);
        }

        function getGridHeaders() {
            return [{
                field: [{
                    prop: 'nocdateutc1',
                    showBig: 'bigNumVal',
                    showInline: true
                    //filter: 'utcDateFilter: \'DD MMM \''
                }, {
                    prop: 'nocdateutc2',
                    showInline: true
                    //filter: 'utcDateFilter: \'DD MMM \''
                },
                {
                    prop: 'dateofincidenceutc',
                    showSmall: 'smallNumVal'
                }
                ],
                displayName: 'NOC date & Date of Incident',
                dataWidth: "10"

            },
            {
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
                displayName: 'Matter Name, File number, Index/Docket#',
                dataWidth: "30"
            },
            {
                field: [{
                    prop: 'matter_type_name',
                    template: 'bold'
                }, {
                    prop: 'matter_sub_type_name'
                }],
                displayName: 'Type & Subtype',
                dataWidth: "10"

            },
            {
                field: [{
                    prop: 'category_name'
                }],
                displayName: 'Category',
                dataWidth: "10"

            },
            {
                field: [{
                    prop: 'status_name',
                    template: 'bold'
                },
                {
                    prop: 'sub_status_name'
                }
                ],
                displayName: 'Status & Substatus',
                dataWidth: "10"

            },


            {
                field: [{
                    prop: 'mattercourt'
                },
                {
                    prop: 'venue_name'
                }
                ],
                displayName: 'Court & Venue',
                dataWidth: "20"

            }, {
                field: [{
                    prop: 'complied'
                }],
                displayName: 'Complied',
                dataWidth: "10"

            }
            ];
        }

        function getFiltersObj(filters, getAll) {

            var formattedFilters = {};

            /*if (filters.lastMatterId) { formattedFilters.matter_id = filters.lastMatterId; }*/

            formattedFilters.eventype = filters.eventype;
            formattedFilters.matterid = utils.isNotEmptyVal(filters.matterId) ? filters.matterId : '';
            formattedFilters.reportName = filters.reportName;
            formattedFilters.daysfilter = filters.daysfilter;
            formattedFilters.s = filters.s;
            formattedFilters.e = filters.e;
            formattedFilters.for = filters.for;
            formattedFilters.pageNum = filters.pageNum;
            formattedFilters.complied = filters.complied;
            // formattedFilters.includeArchived = filters.includeArchived;
            if (filters.pageSize) {
                formattedFilters.pageSize = filters.pageSize;
            } else {
                formattedFilters.pageSize = 250;
            }

            // if (angular.isDefined(getAll)) {
            if (getAll == 'All') {
                formattedFilters.pageSize = 0;
                formattedFilters.pageNum = 0;
            }

            return formattedFilters;
        };

        function generateTags(appliedFilter) {
            var tags = [];
            if (utils.isEmptyVal(appliedFilter)) { return tags; }
            if (utils.isNotEmptyVal(appliedFilter.s) && (utils.isNotEmptyVal(appliedFilter.e))) {
                var filterObj = {
                    key: 'dateRange',
                    value: 'Date Range from :' + moment.unix(appliedFilter.s).utc().format('MM/DD/YYYY') +
                        ' to: ' + moment.unix(appliedFilter.e).utc().format('MM/DD/YYYY')
                };
                
                tags.push(filterObj);
            }
            if (appliedFilter.complied == 0 || appliedFilter.complied == 1) {
                var filterObj = {
                    key: 'complied',
                    value: (appliedFilter.complied == 1) ? "Complied" : (appliedFilter.complied == 0) ? "Not Complied" : ""
                };
                tags.push(filterObj);
            }

            if (utils.isNotEmptyVal(appliedFilter.matterId)) {
                var tagObj = {

                    key: 'matter',
                    id: appliedFilter.matterId.matterid,
                    value: 'Matter: ' + appliedFilter.matterId.name
                };
                tags.push(tagObj);
            }
            if (appliedFilter.includeArchived == 1) {
                var tagObj = {
                    key: 'archivalMatters',
                    value: 'Include Archival Matters: Yes'
                };
                tags.push(tagObj);
            }
            return tags;
        }
    }

})();