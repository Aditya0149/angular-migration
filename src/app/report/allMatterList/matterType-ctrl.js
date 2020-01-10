(function () {
    'use strict';

    angular.module('cloudlex.report').controller('MatterTypeCtrl',
        ['reportFactory', 'matterTypeReportHelper',
            function (reportFactory, matterTypeReportHelper) {

                var self = this;
                self.displayMatterType = [];
                self.displayMatterSubType = [];
                self.s1 = [];
                self.displayingMatterType = {};

                self.viewModel = {
                    allsubstatusreport: {
                        type: '',
                        count: '',
                        id: '',
                        subType: []
                    }
                };

                //get persisted filters
                var persistedFilter = JSON.parse(sessionStorage.getItem("matterTypeSubtypeReportParam"));
                if (utils.isNotEmptyVal(persistedFilter)) {
                    persistedFilter.my = persistedFilter.my == "1" ? 1 : 0;

                    self.shuffleMatterForMatterType = persistedFilter.my;
                    self.filters = {
                        my: persistedFilter.my,
                        includeArchived: persistedFilter.includeArchived
                    };
                } else {
                    self.shuffleMatterForMatterType = 1;
                    self.filters = {
                        my: 1,
                        includeArchived: 0
                    };
                }

                self.init = function () {
                    getMatterType();
                };

                self.filterByMatterStatus = filterByMatterStatus;

                function getMatterType() {
                    self.displayingMatterType = {};
                    sessionStorage.setItem("matterTypeSubtypeReportParam", JSON.stringify(self.filters));
                    var filterObj = matterTypeReportHelper.getFiltersObj(self.filters);
                    var response = reportFactory.getMatterType(filterObj);
                    response.then(function (data) {
                        var parseArray = parseData(data);
                        self.displayingMatterType = parseArray;
                    })
                };

                function parseData(data) {
                    var parseData = [];
                    var statusData = [];
                    self.viewModel.allsubstatusreport = {};
                    self.viewModel.allsubstatusreport.subType = [];
                    self.s1 = [];

                    if (angular.isDefined(data.typereport)) {

                        for (var i = 0; i < data.typereport.length; i++) {
                            self.viewModel.allsubstatusreport = {};
                            self.viewModel.allsubstatusreport.subType = [];
                            if (data.typereport[i].matter_type_name == '' || data.typereport[i].matter_type_name == null) {
                                self.viewModel.allsubstatusreport.matter_type_name = "Unassigned";
                            } else {
                                self.viewModel.allsubstatusreport.matter_type_name = data.typereport[i].matter_type_name;
                            }
                            self.viewModel.allsubstatusreport.count = data.typereport[i].count;
                            self.viewModel.allsubstatusreport.id = data.typereport[i].status_id;
                            if (angular.isDefined(data.subtypereport)) {
                                for (var j = 0; j < data.subtypereport.length; j++) {
                                    if (data.typereport[i].matter_type_id == data.subtypereport[j].matter_type_id) {
                                        if (data.subtypereport[j].matter_sub_type_name == '') {
                                            data.subtypereport[j].matter_sub_type_name = "Unassigned";
                                        }
                                        self.viewModel.allsubstatusreport.subType.push(data.subtypereport[j]);
                                    }
                                }
                            }
                            self.s1.push(self.viewModel.allsubstatusreport);
                        }
                    }
                    parseData = self.s1;
                    return parseData;
                };

                function filterByMatterStatus(param) {
                    self.filters.my = param;
                    self.shuffleMatterForMatterType = param;
                    var filterObj = {};
                    filterObj.my = param;
                    filterObj.includeArchived = self.filters.includeArchived;
                    //persist all, my filter
                    sessionStorage.setItem("matterTypeSubtypeReportParam", JSON.stringify(filterObj));
                    getMatterType();
                };

                self.printMatterType = function () {
                    reportFactory.printMatterType(self.displayingMatterType, self.filters);
                };

                self.downloadMatterType = function () {
                    var filterObj = matterTypeReportHelper.getFiltersObj(self.filters);
                    reportFactory.downLoadMatterType(filterObj, self.filters);
                }

                self.init();
            }
        ])
})();

(function () {
    angular.module('cloudlex.report')
        .factory('matterTypeReportHelper', matterTypeReportHelper);

    function matterTypeReportHelper() {
        return {
            getFiltersObj: getFiltersObj
        };

        function getFiltersObj(filters) {
            var formattedFilters = {};
            formattedFilters.my = filters.my;
            formattedFilters.includeArchived = filters.includeArchived;
            return formattedFilters;
        };

    }

})();
