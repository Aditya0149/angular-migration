(function () {
    'use strict';

    angular.module('cloudlex.report').controller('MatterStatusCtrl',
        ['masterData', 'reportFactory', 'matterStatusReporthelpter',
            function (masterData, reportFactory, matterStatusReporthelpter) {

                var self = this;

                self.filterByMatterStatus = filterByMatterStatus;

                self.masterDataReprot = {};

                self.displayMatterStatus = [];
                self.displayMatterSubStatus = [];
                self.s1 = [];
                self.displayingMatterStatusData = {};
                self.viewModel = {
                    allsubstatusreport: {
                        status: '',
                        count: '',
                        id: '',
                        subStatus: []
                    }
                };
                self.getMatterSubStatus = getMatterSubStatus;
                //set persisted filter
                var persistedFilter = JSON.parse(sessionStorage.getItem("matterStatusSummaryReportParam"));
                if (utils.isNotEmptyVal(persistedFilter)) {
                    persistedFilter.my = persistedFilter.my == "1" ? 1 : 0;
                    self.shuffleMatter = persistedFilter.my;
                    self.filters = {
                        my: persistedFilter.my,
                        includeArchived: persistedFilter.includeArchived
                    };
                } else {
                    self.shuffleMatter = 1;
                    self.filters = {
                        my: 1,
                        includeArchived: 0
                    };
                }



                self.init = function () {
                    gerMasterData();
                    getMatterSubStatus();
                };

                function gerMasterData() {
                    self.masterDataReprot = angular.copy(masterData.getMasterData());
                };

                function getMatterSubStatus() {
                    self.displayingMatterStatusData = {};
                    sessionStorage.setItem("matterStatusSummaryReportParam", JSON.stringify(self.filters));
                    var filterObj = matterStatusReporthelpter.getFiltersObj(self.filters);
                    var response = reportFactory.getMatterSubStatus(filterObj);
                    response.then(function (data) {
                        var parseArray = parseData(data);
                        self.displayingMatterStatusData = parseArray;
                    });
                };

                function parseData(data) {
                    var parseData = [];
                    var statusData = [];
                    self.viewModel.allsubstatusreport = {};
                    self.viewModel.allsubstatusreport.subStatus = [];
                    self.s1 = [];

                    if (angular.isDefined(data.statusreport)) {
                        for (var i = 0; i < data.statusreport.length; i++) {
                            self.viewModel.allsubstatusreport = {};
                            self.viewModel.allsubstatusreport.subStatus = [];
                            if (data.statusreport[i].status_name == '' || data.statusreport[i].status_name == null) {
                                self.viewModel.allsubstatusreport.status = "Unassigned";
                            } else {
                                self.viewModel.allsubstatusreport.status = data.statusreport[i].status_name;
                            }
                            self.viewModel.allsubstatusreport.count = data.statusreport[i].count;
                            self.viewModel.allsubstatusreport.id = data.statusreport[i].status_id;
                            if (angular.isDefined(data.substatusreport)) {
                                for (var j = 0; j < data.substatusreport.length; j++) {
                                    if (data.statusreport[i].status_id == data.substatusreport[j].matter_status_id) {
                                        if (data.substatusreport[j].sub_status_name == '') {
                                            data.substatusreport[j].sub_status_name = "Unassigned";
                                        }
                                        self.viewModel.allsubstatusreport.subStatus.push(data.substatusreport[j]);
                                    }
                                }
                            }
                            self.s1.push(self.viewModel.allsubstatusreport);
                        }
                    }
                    parseData = self.s1;
                    return parseData;
                };

                function addRemainingSubStatus(masterData, parseData) {
                    var masterStatus = masterData.statuses;
                    var masterSubStatus = [];
                    var respStatus = parseData;
                    var respSubStatus = [];
                    var data = [];
                    var finalData = [];
                    var tempSubStatus = [];

                    self.viewModel.allsubstatusreport = {};
                    self.viewModel.allsubstatusreport.subStatus = [];
                    self.s1 = [];

                    _.forEach(masterStatus, function (status) {
                        var currentRepoStatus = _.find(respStatus, function (resSts) {
                            return resSts.status === status.name;
                        })
                        _.forEach(status['sub-status'], function (sub) {
                            var currentStatus = _.find(currentRepoStatus.subStatus, function (subSt) {
                                return subSt.sub_status_name === sub.name;
                            })
                            if (angular.isUndefined(currentStatus)) {
                                currentRepoStatus.subStatus.push(sub);
                            }
                        })
                        self.s1.push(currentRepoStatus);
                    });

                    finalData = self.s1;
                    return finalData;
                }

                function filterByMatterStatus(param) {
                    self.filters.my = param;
                    self.shuffleMatter = param;
                    var filterObj = {};
                    filterObj.my = param;
                    filterObj.includeArchived = self.filters.includeArchived;
                    //persist all my filter
                    sessionStorage.setItem("matterStatusSummaryReportParam", JSON.stringify(filterObj));

                    getMatterSubStatus();
                };

                self.print = function () {
                    reportFactory.printMatterStatusAndSubStatus(self.displayingMatterStatusData, self.filters);
                };

                self.downloadMatters = function () {
                    var filterObj = matterStatusReporthelpter.getFiltersObj(self.filters);
                    reportFactory.downLoadMatterStatusAndSubStatus(filterObj, self.filters);
                };

                self.init();
            }
        ])
})();

(function () {
    angular.module('cloudlex.report')
        .factory('matterStatusReporthelpter', matterStatusReporthelpter);

    function matterStatusReporthelpter() {
        return {
            getFiltersObj: getFiltersObj
        }

        function getFiltersObj(filters) {

            var formattedFilters = {};
            formattedFilters.includeArchived = filters.includeArchived;
            formattedFilters.my = filters.my;
            return formattedFilters;
        };


    }

})();



/* for(var i=0; i<masterStatus.length;i++) {
                       for (var j = 0; j<respStatus.length; j++) {
                               self.viewModel.allsubstatusreport = {};
                               self.viewModel.allsubstatusreport.subStatus = [];
                               if (masterStatus[i].id == respStatus[j].id) {
                                   self.viewModel.allsubstatusreport.status = respStatus[j].status;
                                   self.viewModel.allsubstatusreport.count = respStatus[j].count;
                                   masterSubStatus = masterStatus[i]['sub-status'];
                                   respSubStatus = respStatus[j].subStatus;
                                   for (var k = 0; k < masterSubStatus.length; k++) {
                                       tempSubStatus = [];
                                       for(var l=0;l<respSubStatus.length;l++){
                                           if (masterSubStatus[k].name == respSubStatus[l].sub_status_name) {
                                               self.viewModel.allsubstatusreport.subStatus.push(respSubStatus[l]);
                                           } else {
                                               if(angular.isDefined(self.viewModel.allsubstatusreport.subStatus)){

                                                   if(masterSubStatus[k].id!= tempSubStatus.id){
                                                       tempSubStatus = masterSubStatus[k];
                                                       self.viewModel.allsubstatusreport.subStatus.push(masterSubStatus[k]);
                                                   }

                                               }

                                           }
                                       }
                                   }
                                   self.s1.push(self.viewModel.allsubstatusreport);
                               }

                           }
                       }*/
