(function () {
    'use strict';

    angular.module('intake.report').controller('IntakeUpcomingSOLsCtrl',
        ['$q', 'intakeReportFactory', 'upcomingIntakeSOLsReportHelper', '$modal',
            function ($q, intakeReportFactory, upcomingIntakeSOLsReportHelper, $modal) {

                var self = this;
                var matterList = [];
                var allDisplayStatuses = {};
                var exportFlag = false;

                //dateFlag
                self.lastYearFlag = true;
                self.lastSixMonthFlag = false;
                self.lastOneMonthFlag = true;
                self.customDateFlag = true;
                self.getMatterList = getMatterList;
                self.upcomingSOLs30Days = upcomingSOLs30Days;
                self.upcomingSOLs15Days = upcomingSOLs15Days;
                self.applyFilterLazyLoading = applyFilterLazyLoading;
                self.filterByUser = filterByUser;
                self.getAllMatterList = getAllMatterList;
                self.downloadMatters = downloadMatters;
                self.print = print;
                self.tagCancelled = tagCancelled;
                self.limitmoreall = 250;
                //self.showPager = true;
                //initialization start
                self.init = function () {
                    var viewModel = sessionStorage.getItem("intakeupcomingSOLViewModel");
                    var selectionModel = sessionStorage.getItem("intakeupcomingSOLSelectionModel");
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
                    self.viewModel.filters.pageNum = 1;
                    sessionStorage.setItem("reportTypeFlag", "SOL");
                    getData();
                    //display object for managing the display
                    self.display = {
                        filtered: true,
                        matterListReceived: false,
                        matterSelected: {}
                    };
                    self.clxGridOptions = {
                        headers: upcomingIntakeSOLsReportHelper.getGridHeaders(),
                        selectedItems: []
                    };
                }

                function getFormatteddate(epoch) {
                    return moment.unix(epoch).format('MM/DD/YYYY');
                }

                self.filterSOLReport = function () {
                    var filter = angular.copy(self.viewModel.filters);
                    filter.s = (filter.s) ? moment.unix(filter.s).utc().format('MM/DD/YYYY') : '';
                    filter.e = (filter.e) ? moment.unix(filter.e).utc().format('MM/DD/YYYY') : '';
                    filter.pageSize = 250;
                    filter.pageNum = 1;
                    var modalInstance = $modal.open({
                        templateUrl: 'app/intake/report/allIntakeList/filterPopUp/allIntake/upcomingSOLNOCPopup.html',
                        controller: 'IntakeSolFilterCtrl as filter',
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
                        //   self.viewModel.filters.daysfilter = null;filter.matterId.matterid
                        self.viewModel.filters.intakeId = !utils.isEmptyObj(filterObj.filter.intakeId) ? filterObj.filter.intakeId : '';
                        self.viewModel.filters.s = utils.isEmptyObj(filterObj.filter) ? '' : filterObj.filter.s;
                        self.viewModel.filters.e = utils.isEmptyObj(filterObj.filter) ? '' : filterObj.filter.e;
                        self.viewModel.filters.complied = filterObj.filter.complied;
                        self.viewModel.filters.pageNum = 1;
                        self.viewModel.filters.pageSize = filterObj.filter.pageSize;
                        getMatterList(undefined, 'calDays');
                    });
                }

                function persistFilters() {
                    var selectionModel = angular.copy(self.selectionModel);
                    var viewModel = angular.copy(self.viewModel);
                    viewModel.matters = [];
                    sessionStorage.setItem("intakeupcomingSOLViewModel", JSON.stringify(viewModel));
                    sessionStorage.setItem("intakeupcomingSOLSelectionModel", JSON.stringify(selectionModel));
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
                        intakeId: '',
                        e: '',
                        complied: 2,
                        pageSize: 250,
                        pageNum: 1,
                        eventTypeId: 1
                        //  for: 'mymatter',
                        //  reportName: 'mattereventtypereport'
                    };
                };

                function upcomingSOLs15Days(param) {
                    self.selectionModel.dateFieldValue = param;
                    // var start = moment().startOf('day').unix();
                    // self.viewModel.filters.s = start;

                    // var end = moment().add(15, 'days').endOf('day').unix();
                    // self.viewModel.filters.e = end;
                    var start = utils.getUTCTimeStamp(moment().startOf('day'));
                    self.viewModel.filters.s = start;

                    var end = utils.getUTCTimeStampEndDay(moment().add(15, 'days').endOf('day'));
                    self.viewModel.filters.e = end;

                    self.viewModel.filters.daysfilter = 15;
                    self.viewModel.filters.pageNum = 1;
                    getMatterList();
                };

                function upcomingSOLs30Days(param) {
                    self.selectionModel.dateFieldValue = param;
                    // var start = moment().startOf('day').unix();
                    // self.viewModel.filters.s = start;

                    // var end = moment().add(30, 'days').endOf('day').unix();
                    // self.viewModel.filters.e = end;
                    var start = utils.getUTCTimeStamp(moment().startOf('day'));
                    self.viewModel.filters.s = start;

                    var end = utils.getUTCTimeStampEndDay(moment().add(30, 'days').endOf('day'));
                    self.viewModel.filters.e = end;

                    self.viewModel.filters.daysfilter = 30;
                    self.viewModel.filters.pageNum = 1;
                    getMatterList();
                };

                function initSelectionModel() {
                    self.selectionModel = {
                        allMatter: 1,
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
                    var promise = getMasterList();
                    $q.all([promise]).then(function (val) {
                        if (val) {
                            getMatterList(undefined, 'calDays');
                        }
                    })

                }

                function applyFilterLazyLoading() {
                    self.viewModel.filters.pageNum += 1;
                    self.viewModel.filters.pageSize = 250;
                    self.viewModel.filters.lastMatterId = _.last(self.viewModel.matters)['intake_id'];
                    getNextMatterList();
                };

                //filter by users ('my matters','all matters')
                function filterByUser(param) {
                    self.selectionModel.allMatter = param;
                    if (param == 1) {
                        self.viewModel.filters.for = "mymatter";
                    } else {
                        self.viewModel.filters.for = "allmatter";
                    }
                    self.viewModel.filters
                    getMatterList(undefined, 'calDays');
                };

                function getMasterList() {
                    var promesa = intakeReportFactory.getMasterDataList();
                    promesa.then(function (data) {
                        var subStatus = [];
                        var subType = [];
                        _.forEach(data.status, function (statusRecord) {
                            _.forEach(statusRecord.substatus, function (substatusRecord) {
                                subStatus.push(substatusRecord);
                            });
                        });
                        _.forEach(data.type, function (statusRecord) {
                            _.forEach(statusRecord.subtype, function (subtypeRecord) {
                                subType.push(subtypeRecord);
                            });
                        });
                        data.subStatus = subStatus;
                        data.subType = subType;
                        if (!self.viewModel) {
                            self.viewModel = {};
                        }

                        self.masterDataCopy = angular.copy(data);
                        self.viewModel.masterList = self.masterDataCopy;
                    }, function (reason) {
                        if (self.viewModel) {
                            self.viewModel.masterList = {};
                            self.masterDataCopy = {};
                        }
                    });
                    return promesa;
                }

                function getMatterList(getAll, info) {

                    if (utils.isEmptyVal(self.viewModel.filters.s) && utils.isEmptyVal(self.viewModel.filters.e)) {
                        var start = utils.getUTCTimeStampStart(moment(new Date()));//Bug#5619
                        self.viewModel.filters.s = start;

                        var end = utils.getUTCTimeStampEndDay(moment().add(15, 'days'));//Bug#5619
                        self.viewModel.filters.e = end;
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
                    var filterObj = upcomingIntakeSOLsReportHelper.getFiltersObj(self.viewModel.filters, getAll, self.selectionModel.allMatter);
                    persistFilters();
                    var promesa = intakeReportFactory.getMatterstats(filterObj, self.selectionModel.allMatter);
                    promesa.then(function (data) {
                        var solData = angular.copy(data);
                        processData(solData);
                        self.total = (utils.isNotEmptyVal(solData.count)) ? parseInt(solData.count) : 0;
                        utils.replaceNullByEmptyStringArray(solData);
                        self.display.matterListReceived = true;
                        matterList = solData;//store all matters locally, this list will be used while client side filtering
                        upcomingIntakeSOLsReportHelper.setModifiedDisplayDate(matterList);
                        self.viewModel.matters = solData.events;
                        self.showPager = self.viewModel.matters.length < self.total;
                        self.tags = upcomingIntakeSOLsReportHelper.generateTags(self.viewModel.filters);

                    }, function (reason) {
                    });

                };


                function processData(solData) {
                    if (utils.isEmptyObj(self.viewModel.masterList)) {
                        getMasterList();
                    }
                    //    var solData = angular.copy(data.events);
                    _.forEach(solData.events, function (item) {
                        item.compliedValue = (item.isComply == 0) ? "No" : "Yes";
                        item.createdDate = (utils.isEmptyVal(item.createdDate)) ? "-" : moment.unix(item.createdDate).utc().format('MM/DD/YYYY');
                        var category = _.findWhere(self.viewModel.masterList.category, { id: item.intake.intakeCategory.id });
                        //    item.intakeCategoryCopy = angular.copy(item.intakeCategory);
                        item.intakeCategoryName = category ? category.name : "";
                        var status = _.findWhere(self.viewModel.masterList.status, { id: item.intake.intakeStatus.id });
                        item.intakeStatusName = status ? status.name : "";
                        var subStatus = status ? _.findWhere(status.substatus, { id: item.intake.intakeStatus.subStatus.id }) : null;
                        item.intakeSubStatusName = subStatus ? subStatus.name : "";
                        var type = _.findWhere(self.viewModel.masterList.type, { id: item.intake.intakeType.id });

                        var subType = type ? _.findWhere(type.subtype, { id: item.intake.intakeType.intakeSubType[0].id }) : null;
                        //   item.intakeTypeCopy = angular.copy(item.intakeType);
                        //   item.intakeSubTypeCopy = angular.copy(item.intakeSubType);
                        item.intakeTypeName = type ? type.name : "";
                        item.intakeSubTypeName = subType ? subType.name : "";
                        item.intakeName = item.intake.intake_name ? item.intake.intake_name : "";
                        item.dateOfIncident = (item.intake.dateOfIncident == 0) ? "-" : moment.unix(item.intake.dateOfIncident).utc().format('DD MMM YYYY');
                        item.SOLDate = (item.startDate == 0) ? "-" : moment.unix(item.startDate).utc().format('DD MMM YYYY');
                        item.SOLDate1 = item.SOLDate.substr(0, 2);
                        item.SOLDate2 = item.SOLDate.substr(3, 8);
                        item.intakeId = item.intake.intake_id ? item.intake.intake_id : 0;
                    });
                    utils.replaceNullByEmptyStringArray(solData.events);
                }
                function getAllMatterList() {
                    getMatterList(undefined, 'calDays');
                    self.showPager = false;
                }

                function getNextMatterList() {
                    var filterObj = upcomingIntakeSOLsReportHelper.getFiltersObj(self.viewModel.filters, '', self.selectionModel.allMatter);
                    var promesa = intakeReportFactory
                        .getMatterstats(filterObj,
                            self.selectionModel.allMatter);
                    promesa.then(function (data) {
                        var solData = angular.copy(data);
                        processData(solData);
                        upcomingIntakeSOLsReportHelper.setModifiedDisplayDate(solData);
                        _.forEach(solData.events, function (item) {
                            matterList.events.push(item);//list of received
                            self.viewModel.matters = matterList.events;//data to be displayed
                        });
                        self.total = (utils.isNotEmptyVal(solData.count)) ? parseInt(solData.count) : 0;
                        self.showPager = self.viewModel.matters.length < self.total;
                    }, function (reason) {

                    });
                };

                function downloadMatters() {
                    self.viewModel.filters.pageSize = 'all';
                    var filterObj = upcomingIntakeSOLsReportHelper.getFiltersObj(self.viewModel.filters, 10000, self.selectionModel.allMatter);
                    intakeReportFactory.downLoadUpcomingSOLs(filterObj, self.viewModel.filters)
                        .then(function (response) {
                            utils.downloadFile(response.data, "Upcoming_Intake_SOLs_Report", response.headers("Content-Type"));

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

                // function print() {
                //     intakeReportFactory.printSOLsIntake(self.viewModel.matters);
                // };

                function print() {

                    var LeadName = '';
                    if (utils.isNotEmptyVal(self.viewModel.filters.s)) {
                        var tagLabel = "";
                        if (self.viewModel.dateFilter == "Date of incident" || self.viewModel.dateFilter == "Intake Date" || self.viewModel.dateFilter == "Date Closed" ||
                            self.viewModel.dateFilter == "Date Settled") {
                            tagLabel = moment.unix(self.viewModel.filters.s).utc().format('MM/DD/YYYY') + ' to ' + moment.unix(self.viewModel.filters.e).utc().format('MM/DD/YYYY');
                        } else {
                            tagLabel = moment.unix(self.viewModel.filters.s).utc().format('MM/DD/YYYY') + ' to ' + moment.unix(self.viewModel.filters.e).utc().format('MM/DD/YYYY');

                        }


                    }
                    if (utils.isNotEmptyVal(self.viewModel.filters.intakeId)) {

                        var printObjFilter = {
                            'Lead Name': LeadName,
                            'DATE RANGE': tagLabel,

                        }

                        if (utils.isNotEmptyVal(self.viewModel.filters.intakeId)) {
                            LeadName = self.viewModel.filters.intakeId.name;
                        }

                        var printObjFilter = {

                            'Lead Name': LeadName,
                            'DATE RANGE': tagLabel

                        }


                    } else {
                        var printObjFilter = {
                            'Lead Name': '',
                            'DATE RANGE': tagLabel
                        }

                    }


                    intakeReportFactory.printSOLsIntake(self.viewModel.matters, printObjFilter);
                };

                function tagCancelled(filter) {
                    switch (filter.key) {
                        case 'dateRange':
                            self.viewModel.filters.s = "";
                            self.viewModel.filters.e = "";
                            break;
                        case 'complied':
                            self.viewModel.filters.complied = 2;
                            break;
                        case 'matter':
                            self.viewModel.filters.intakeId = '';
                            break;
                    }
                    self.selectionModel.dateFieldValue = 0;
                    self.viewModel.filters.pageSize = 250;
                    self.viewModel.filters.pageNum = 1;
                    getMatterList(undefined, 'calDays');
                }

                self.init();
                //self.showPager = true;
            }]);
})();


(function () {
    angular.module('intake.report')
        .factory('upcomingIntakeSOLsReportHelper', upcomingIntakeSOLsReportHelper);

    upcomingIntakeSOLsReportHelper.$inject = ['$filter', 'reportConstant'];
    function upcomingIntakeSOLsReportHelper($filter, reportConstant) {
        return {
            setModifiedDisplayDate: setModifiedDisplayDate,
            getGridHeaders: getGridHeaders,
            getFiltersObj: getFiltersObj,
            generateTags: generateTags,
            getPlaintiffs: getPlaintiffs
        }

        function setModifiedDisplayDate(matterList) {
            _.forEach(matterList.matters, function (matter) {
                if (moment.unix(matter.nocdateutc).format('DD MMM') == "Invalid date") {
                    matter.nocdateutc = matter.nocdateutc;
                } else {
                    //matter.nocdateutc = moment.unix(matter.nocdateutc).format('DD MMM');
                    matter.nocdateutc = $filter('utcDateFilter')(matter.nocdateutc, 'DD MMM', 1, 'start');
                }

                if (utils.isEmptyVal(matter.dateofincidenceutc) || matter.dateofincidenceutc == 0) {
                    matter.dateofincidenceutc = '';
                } else {
                    matter.dateofincidenceutc = moment.unix(matter.dateofincidenceutc).utc().format('DD MMM YYYY');
                }
                matter.nocdateutc1 = matter.nocdateutc.substr(0, 2);
                matter.nocdateutc2 = matter.nocdateutc.substr(3, 6);

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
            return [
                {
                    field: [

                        {
                            prop: 'SOLDate1',
                            showBig: true,
                            showInline: true
                            //filter: 'utcDateFilter: \'DD MMM \''
                        }, {
                            prop: 'SOLDate2',
                            showInline: true
                            //filter: 'utcDateFilter: \'DD MMM \''
                        },
                        {
                            prop: 'dateOfIncident',
                            //   showInline: true
                        }
                    ],
                    displayName: 'SOL date & Date of Incident',
                    dataWidth: 20
                },
                {
                    field: [
                        {
                            prop: 'intakeName',
                            href: { link: '#/intake/intake-overview', paramProp: ['intakeId'] }

                        }],
                    displayName: 'Lead Name',
                    dataWidth: "17"
                },
                {
                    field: [
                        {
                            prop: 'intakeTypeName',
                            template: 'bold',

                        }, {
                            prop: 'intakeSubTypeName',
                            filter: 'replaceByDash'
                        }],
                    displayName: 'Type & Subtype',
                    dataWidth: "18"

                },
                {
                    field: [{
                        prop: 'intakeCategoryName'
                    }],
                    displayName: 'Category',
                    dataWidth: "15"

                },
                {
                    field: [
                        {
                            prop: 'intakeStatusName',
                            template: 'bold'
                        },
                        {
                            prop: 'intakeSubStatusName',
                            filter: 'replaceByDash'
                        }],
                    displayName: 'Status & Substatus',
                    dataWidth: "15"

                },
                {
                    field: [{
                        prop: 'compliedValue'
                    }],
                    displayName: 'Complied/Held',
                    dataWidth: "15"

                }];
        }

        function getFiltersObj(filters, getAll, intakeFlag) {

            var formattedFilters = {};

            //   if (filters.lastMatterId) { formattedFilters.matter_id = filters.lastMatterId; }


            formattedFilters.intakeId = utils.isNotEmptyVal(filters.intakeId) ? filters.intakeId.intakeId : '';
            formattedFilters.eventTypeId = utils.isNotEmptyVal(filters.eventTypeId) ? filters.eventTypeId : '';
            formattedFilters.s = filters.s;
            formattedFilters.e = filters.e;
            formattedFilters.complied = filters.complied;
            formattedFilters.myIntake = intakeFlag;

            formattedFilters.pageNum = filters.pageNum;
            if (filters.pageSize) {
                formattedFilters.pageSize = filters.pageSize;
            } else {
                formattedFilters.pageSize = 250;
            }
            if (getAll == 'All') {
                formattedFilters.pageSize = getAll;
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

            if (utils.isNotEmptyVal(appliedFilter.intakeId)) {
                var tagObj = {

                    key: 'matter',
                    id: appliedFilter.intakeId.intake_id,
                    value: 'Lead name: ' + appliedFilter.intakeId.name
                };
                tags.push(tagObj);
            }

            return tags;
        }
    }
})();
