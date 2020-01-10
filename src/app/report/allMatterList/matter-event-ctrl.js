(function () {
    'use strict';

    angular.module('cloudlex.report').controller('matterEventsCtrl', ['reportFactory', 'matterEventsReportHelper', '$modal', 'masterData',
        function (reportFactory, matterEventsReportHelper, $modal, masterData) {

            var self = this;
            var matterList = [];
            var allDisplayStatuses = {};
            var exportFlag = false;
            var initMatterLimit = 10;
            var pageSize = 250;
            var pageNum = 1;



            //dateFlag             
            self.lastYearFlag = true;
            self.lastSixMonthFlag = false;
            self.lastOneMonthFlag = true;
            self.customDateFlag = true;
            self.getMatterList = getMatterList;
            self.upcomingEvents30Days = upcomingEvents30Days;
            self.upcomingEvents15Days = upcomingEvents15Days;
            self.applyFilterLazyLoading = applyFilterLazyLoading;
            self.filterByUser = filterByUser;
            self.getAllMatterList = getAllMatterList;
            self.downloadMatters = downloadMatters;
            self.print = print;
            self.tagCancelled = tagCancelled;


            //initialization start matterEventsReportViewModel
            self.init = function () {
                var viewModel = sessionStorage.getItem("matterEventsReportViewModel");
                var selectionModel = sessionStorage.getItem("matterEventsSelectionModel");
                if (utils.isNotEmptyVal(viewModel) || utils.isNotEmptyVal(selectionModel)) {
                    try {
                        self.viewModel = JSON.parse(viewModel);
                        self.viewModel.matters = [];
                        self.selectionModel = JSON.parse(selectionModel);


                    } catch (e) {
                        initModels();
                    }
                } else {
                    initModels();
                }
                (utils.isEmptyVal(self.viewModel.filters.complied)) ? self.viewModel.filters.complied = 2 : ''; // set default complied type filter

                self.viewModel.filters.selectedReport = true;
                sessionStorage.setItem("reportTypeFlag", "MatterEvent");
                getData();
                //display object for managing the display
                self.display = {
                    filtered: true,
                    matterListReceived: false,
                    matterSelected: {}
                };
                self.clxGridOptions = {
                    headers: matterEventsReportHelper.getGridHeaders(),
                    selectedItems: []
                };

            }



            self.filterMatterEventsReport = function () {
                self.eventTypes = masterData.getEventTypes();
                var filter = angular.copy(self.viewModel.filters);
                filter.s = (filter.s) ? getFormatteddate(filter.s) : '';
                filter.e = (filter.e) ? getFormatteddate(filter.e) : '';
                filter.complied = filter.complied;




                var modalInstance = $modal.open({
                    templateUrl: 'app/report/allMatterList/filterPopUp/matterEvents/matterEventsPopup.html',
                    controller: 'matterEventsReportCtrl as filter',
                    windowClass: 'modalMidiumDialog',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        params: function () {
                            return {
                                filter: filter,
                                eventTypes: angular.copy(self.eventTypes)
                            };
                        }
                    }
                });

                modalInstance.result.then(function (filterObj) {
                    self.viewModel.filters.events = utils.isNotEmptyVal(filterObj.filter.events) ? filterObj.filter.events : '';
                    self.viewModel.filters.daysfilter = null;
                    self.viewModel.filters.matterId = utils.isNotEmptyVal(filterObj.filter.matterId) ? filterObj.filter.matterId : '';
                    self.viewModel.filters.s = utils.isEmptyObj(filterObj.filter) ? '' : filterObj.filter.s;
                    self.viewModel.filters.e = utils.isEmptyObj(filterObj.filter) ? '' : filterObj.filter.e;
                    self.viewModel.filters.complied = filterObj.filter.complied;
                    // if (utils.isNotEmptyVal(self.viewModel.filters.s) && utils.isNotEmptyVal(self.viewModel.filters.e)) {
                    //     self.selectionModel.dateFieldValue = null;
                    // } else {
                    //     self.selectionModel.dateFieldValue = 0;
                    // }

                    self.viewModel.filters.pageNum = 1;
                    getMatterList(undefined, 'calDays');

                }, function () {

                });
            }

            function getFormatteddate(epoch) {
                return moment.unix(epoch).utc().format('MM/DD/YYYY');
            }

            function persistFilters() {
                var selectionModel = angular.copy(self.selectionModel);
                var viewModel = angular.copy(self.viewModel);
                viewModel.matters = [];
                // viewModel.filters.pagesize = pageSize;
                viewModel.filters.pageNum = 1;
                sessionStorage.setItem("matterEventsReportViewModel", JSON.stringify(viewModel));
                sessionStorage.setItem("matterEventsSelectionModel", JSON.stringify(selectionModel));
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
                    e: '',
                    complied: 2,
                    pageSize: 250,
                    pageNum: 1,
                    eventFilter: [],
                    eventype: '',
                    for: 'mymatter',
                    reportName: 'mattereventtypereport'
                };
            };

            function upcomingEvents15Days(param) {
                self.selectionModel.dateFieldValue = param;
                var start = moment.utc().startOf('day').unix();
                self.viewModel.filters.s = start;

                var end = moment.utc().add(15, 'days').endOf('day').unix();
                self.viewModel.filters.e = end;

                self.viewModel.filters.daysfilter = 15;
                self.viewModel.filters.pageNum = 1;
                getMatterList();
            };

            function upcomingEvents30Days(param) {
                self.selectionModel.dateFieldValue = param;
                var start = moment.utc().startOf('day').unix();
                self.viewModel.filters.s = start;

                var end = moment.utc().add(30, 'days').endOf('day').unix();
                self.viewModel.filters.e = end;

                self.viewModel.filters.daysfilter = 30;
                self.viewModel.filters.pageNum = 1;
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

            function applyFilterLazyLoading() {
                //self.viewModel.filters.lastMatterId = _.last(self.viewModel.matters)['matter_id'];
                self.viewModel.filters.pageNum++;
                self.viewModel.filters.pagesize = pageSize;
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
                self.viewModel.filters
                getMatterList(undefined, 'calDays');
            };

            function getMatterList(getAll, data) {

                if (utils.isEmptyVal(self.viewModel.filters.s) && utils.isEmptyVal(self.viewModel.filters.e)) {
                    var start = moment.utc().startOf('day').unix();
                    self.viewModel.filters.s = start;

                    var end = moment.utc().add(15, 'days').endOf('day').unix();
                    self.viewModel.filters.e = end;
                    self.viewModel.filters.e = end;
                    self.viewModel.filters.pageNum = 1;
                }
                if (data == 'calDays') {
                    var calDaysDiff = getDays(self.viewModel.filters);
                    if (calDaysDiff == 15) {
                        self.selectionModel.dateFieldValue = 0;
                    } else if (calDaysDiff == 30) {
                        self.selectionModel.dateFieldValue = 1;
                    } else {
                        self.selectionModel.dateFieldValue = null;
                    }
                }


                self.matterLimit = initMatterLimit;

                var filterObj = matterEventsReportHelper.getFiltersObj(self.viewModel.filters, getAll);
                persistFilters();
                var promesa = reportFactory.getMatterstats(filterObj, self.selectionModel.allMatter);
                promesa.then(function (data) {
                    utils.replaceNullByEmptyStringArray(data);
                    self.display.matterListReceived = true;
                    matterList = data; //store all matters locally, this list will be used while client side filtering
                    self.total = data.count;
                    matterEventsReportHelper.setModifiedDisplayDate(matterList);
                    self.viewModel.matters = data.data ? data.data : 0;
                    self.eventTypes = masterData.getEventTypes();
                    self.tags = matterEventsReportHelper.generateTags(self.viewModel.filters, self.eventTypes);
                }, function (reason) { });
            };

            self.scrollReachedTop = function () {
                if (self.matterLimit < self.total) {
                    self.matterLimit = initMatterLimit;
                }
            };

            self.scrollReachedBottom = function () {
                self.matterLimit += initMatterLimit;
            };


            function getAllMatterList() {
                self.viewModel.filters.pagesize = 'all';
                getMatterList(10000, 'calDays');
            }



            function getNextMatterList() {
                var filterObj = matterEventsReportHelper.getFiltersObj(self.viewModel.filters);
                var promesa = reportFactory
                    .getMatterstats(filterObj,
                        self.selectionModel.allMatter);
                promesa.then(function (data) {
                    matterEventsReportHelper.setModifiedDisplayDate(data);
                    self.total = data.count;
                    _.forEach(data.data, function (item) {
                        matterList.data.push(item); //list of received
                        self.viewModel.matters = matterList.data; //data to be displayed
                    });
                }, function (reason) {

                });

                // var count = reportFactory.getMatterstatscount(filterObj, self.selectionModel.allMatter);
                // count.then(function (res) { self.total = parseInt(res.data[0]); });
            };

            function downloadMatters() {
                var filterObj = matterEventsReportHelper.getFiltersObj(self.viewModel.filters, 10000);
                filterObj.daysfilter = getDays(filterObj);
                if (filterObj) {
                    filterObj.matterid = utils.isEmptyVal(filterObj.matterid) ? filterObj.matterid : filterObj.matterid.matterid;
                }
                reportFactory.downLoadMatterEvents(filterObj, self.viewModel.filters, self.selectionModel.allMatter)
                    .then(function (response) {
                        utils.downloadFile(response.data, "Events_Report.xlsx", response.headers("Content-Type"));
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
                var status = '';
                var matterName = '';
                var startDate = '';
                var endDate = '';

                //bug#13357 - date filter added
                if (utils.isNotEmptyVal(self.viewModel.filters)) {
                    startDate = utils.isNotEmptyVal(self.viewModel.filters.s) ? moment.unix(self.viewModel.filters.s).utc().format('MM/DD/YYYY') : '';
                    endDate = utils.isNotEmptyVal(self.viewModel.filters.e) ? moment.unix(self.viewModel.filters.e).utc().format('MM/DD/YYYY') : '';
                }

                if (utils.isNotEmptyVal(self.viewModel.filters.events || self.viewModel.filters.matterId)) {

                    _.forEach(self.viewModel.filters.events, function (eventype, index) {
                        status += eventype.Name + (index !== (self.viewModel.filters.events.length - 1) ? ', ' : '');
                    });

                    var printObjFilter = {
                        'EVENT TYPES': status,
                        'Matter': matterName,
                        'Date Range From': 'from ' + startDate + ' to: ' + endDate,
                    }

                    if (utils.isNotEmptyVal(self.viewModel.filters.matterId)) {
                        matterName = self.viewModel.filters.matterId.name;
                    }

                    var printObjFilter = {
                        'EVENT TYPES': status,
                        'Matter': utils.removeunwantedHTML(matterName),
                        'Date Range From': 'from ' + startDate + ' to: ' + endDate,
                    }

                } else {
                    var printObjFilter = {
                        'EVENT TYPES': '',
                        'Matter': '',
                        'Date Range From': 'from ' + startDate + ' to: ' + endDate,
                    }

                }

                reportFactory.printEventMatters(self.viewModel.matters, printObjFilter);
            };

            function tagCancelled(cancelled) {
                switch (cancelled.key) {
                    case 'dateRange':
                        self.viewModel.filters.s = "";
                        self.viewModel.filters.e = "";
                        break;
                    case 'matter':
                        self.viewModel.filters.matterId = '';
                        break;
                    case 'complied':
                        self.viewModel.filters.complied = 2;
                        break;
                }

                if (cancelled.type == 'events') {
                    var currentFilters = _.pluck(self.viewModel.filters[cancelled.type], 'LabelId');
                    var index = currentFilters.indexOf(cancelled.key);
                    self.viewModel.filters[cancelled.type].splice(index, 1);
                }

                self.selectionModel.dateFieldValue = 0;
                // self.viewModel.filters.pagesize = 5;
                getMatterList(undefined, 'calDays');
            }

            var data = masterData.getMasterData();
            if (utils.isEmptyObj(data)) {
                masterData.fetchMasterData().then(function () {
                    self.init();
                })
            } else {
                self.init();
            }

        }
    ]);
})();


(function () {
    angular.module('cloudlex.report')
        .factory('matterEventsReportHelper', matterEventsReportHelper);

    matterEventsReportHelper.$inject = ['$filter', 'reportConstant', '$http','masterData'];

    function matterEventsReportHelper($filter, reportConstant, $http,masterData) {
        return {
            setModifiedDisplayDate: setModifiedDisplayDate,
            getGridHeaders: getGridHeaders,
            getFiltersObj: getFiltersObj,
            generateTags: generateTags,
            getPlaintiffs: getPlaintiffs
        }

        function setModifiedDisplayDate(matterList) {
            _.forEach(matterList.data, function (matter) {
                if (moment.unix(matter.start).format('DD MMM YYYY') == "Invalid date") {
                    matter.start = matter.start;
                } else {
                    //matter.start = moment.unix(matter.start).format('DD MMM');
                    matter.noctime = $filter('utcDateFilter')(matter.start, 'DD MMM YYYY hh:mm A', 1, 'start');
                    // matter.start = $filter('utcDateFilter')(matter.start, 'DD MMM YYYY', 1, 'start')
                    matter.start = moment.unix(matter.start).utc().format('DD MMM YYYY');
                }
                matter.matter_name = matter.matter.matter_name;
                matter.file_number = matter.matter.file_number;
                matter.index_number = matter.matter.index_number
                matter.eventtype = matter.event_name;
                matter.eventtitle = matter.title;
                matter.checkEventTitle = angular.copy(matter.title);
                matter.mattercourt = matter.matter.court.courtName ? matter.matter.court.courtName : '';
                matter.venue_name = matter.matter.court.courtVenue ? matter.matter.court.courtVenue : '';
                matter.complied = matter.is_comply == 1 ? 'Yes' : 'No';
                matter.matter_id = matter.matter.matter_id;
                var assignTo = matter.assigned_to.length > 0 ? _.pluck(matter.assigned_to, 'full_name').toString() : '';
                matter.assigned_to = assignTo;
                if (utils.isEmptyVal(matter.matter.date_of_incidence) || matter.matter.date_of_incidence == 0) {
                    matter.dateofincidenceutc = '';
                } else {
                    matter.dateofincidenceutc = moment.unix(matter.matter.date_of_incidence).utc().format('DD MMM YYYY');
                }
                matter.nocdateutc1 = matter.start.substr(0, 2);
                matter.nocdateutc2 = matter.start.substr(3, 8);
                if (matter.allday != 1) {
                    matter.time = matter.noctime.substr(12, 8);
                }
                else {
                    matter.time = "Full Day";
                }
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
                    showBig: true,
                    showInline: true
                    //filter: 'utcDateFilter: \'DD MMM \''
                }, {
                    prop: 'nocdateutc2',
                    showInline: true
                    //filter: 'utcDateFilter: \'DD MMM \''
                },
                {
                    prop: 'dateofincidenceutc',
                    showInline: true
                }
                ],
                displayName: 'Event date & Date of Incident',
                dataWidth: 10
            },
            {
                field: [{
                    prop: 'time',

                }],
                displayName: 'Event Time',
                dataWidth: "8"

            },
            {
                field: [{
                    prop: 'matter_name',
                    href: { link: '#/matter-overview', paramProp: ['matter_id'] }
                    //href: '#/matter-overview'
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
                dataWidth: "20"
            },
            {
                field: [{
                    prop: 'eventtype'
                }, {
                    prop: 'eventtitle'
                }],
                displayName: 'Event Type/Title',
                dataWidth: "16"

            },

            {
                field: [{
                    prop: 'location'
                }],
                displayName: 'Event Location',
                dataWidth: "10"

            },
            {
                field: [{
                    prop: 'assigned_to',

                }],
                displayName: 'Assigned to',
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
                dataWidth: "18"

            },
            {
                field: [{
                    prop: 'complied'
                }],
                displayName: 'Complied',
                dataWidth: "8"

            }
            ];
        }

        function getFiltersObj(filters, getAll) {

            var formattedFilters = {};
            formattedFilters.eventFilter = [];
            var postArray = ['eventFilter'];
            var valKey = ['events'];
            _.each(postArray, function (val, index) {
                var data = _.pluck(filters[valKey[index]], "LabelId").join();
                if (utils.isNotEmptyVal(data)) {
                    formattedFilters.eventFilter[val] = data;
                } else {
                    formattedFilters.eventFilter[val] = [];
                }
            });

            if (filters.lastMatterId) { formattedFilters.matter_id = filters.lastMatterId; }

            //  formattedFilters.eventype = '';
            formattedFilters.matterid = utils.isNotEmptyVal(filters.matterId) ? filters.matterId : '';
            if (angular.isDefined(filters.events)) {
                formattedFilters.eventFilter = formattedFilters.eventFilter.eventFilter;
            } else {
                formattedFilters.eventFilter = '';
            }
            formattedFilters.reportName = filters.reportName;
            formattedFilters.daysfilter = filters.daysfilter;
            formattedFilters.s = filters.s;
            formattedFilters.e = filters.e;
            formattedFilters.complied = filters.complied;
            formattedFilters.for = filters.for;

            formattedFilters.pageNum = filters.pageNum;
            formattedFilters.pageSize = 250;
            if (angular.isDefined(getAll)) {
                formattedFilters.pageSize = 1000;
            }


            return formattedFilters;
        };

        function generateTags(appliedFilter, eventTypes) {
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

            _.forEach(eventTypes, function (eventType) {
                if (utils.isNotEmptyVal(appliedFilter.events)) {
                    if (appliedFilter.events.length != 0 && appliedFilter.events != null) {

                        _.forEach(appliedFilter.events, function (data) {
                            if (eventType.Name == data.Name) {
                                event = {};
                                event.key = eventType.LabelId;
                                event.type = "events";
                                event.value = "Event Type: " + eventType.Name;
                                tags.push(event);
                            }
                        });

                    }
                }
            });




            return tags;
        }
    }
})();