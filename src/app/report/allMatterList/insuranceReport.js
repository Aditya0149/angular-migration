(function (angular) {

    'use strict';

    angular.module('cloudlex.report').
        controller('insuranceReportCtrl', insuranceReportCtrl);
    insuranceReportCtrl.$inject = ['$modal', 'masterData', 'insuranceReportHelper', '$filter','contactFactory'];

    //controller definition 
    function insuranceReportCtrl($modal, masterData, insuranceReportHelper, $filter,contactFactory) {
        var self = this;
        var pageSize = 250;
        var matterType = 'mymatter';
        self.getInsuranceInfo = getInsuranceInfo;
        var initInsurancelimit = 10;
        self.tagCancelled = tagCancelled;
        self.getMore = getMore;
        self.getAll = getAll;
        self.showPaginationButtons = showPaginationButtons;
        self.scrollReachedBottom = scrollReachedBottom;
        self.scrollReachedTop = scrollReachedTop;
        self.filter = {};
        self.openPopupFilter = openPopupFilter;
        self.dataReceived = false;
        self.print = print;
        self.downloadInsuranceInfo = downloadInsuranceInfo;
        self.clickedRow = -1;
        var masterDataObj = masterData.getMasterData();
        var persistFilter = sessionStorage.getItem('insuranceReportFilters');

        if (utils.isNotEmptyVal(persistFilter)) { //if the filters are not empty, then try 
            try {
                self.filter = JSON.parse(persistFilter);
                getInsuranceInfo(self.filter);
                self.tags = generateTags(self.filter);
            } catch (e) {
                setFilters();
            }
        } else {
            setFilters(); // set filters
            getInsuranceInfo(self.filter);
        }

        function currencyFormat(num) {
            num = num.toString();
            return "$" + num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        }

        // set the default state of sort/filter if persisted item is not found
        function setFilters() {
            self.filter = {
                pageNum: 1,
                pageSize: pageSize,
                includeArchived: 0,
                includeClosed : 0,
                newInsauranceInfo : {}
            };
        }

        /* check whether to show more and all buttons*/
        function showPaginationButtons() {

            if (!self.dataReceived) { // if data not received
                return false;
            }
            if (angular.isUndefined(self.insuranceDataList) || self.insuranceDataList.length <= 0) { //if data is empty
                return false;
            }
            if (self.filter.pageSize === 'all') { // if pagesize is all
                return false;
            }
            if (self.insuranceDataList.length < (self.filter.pageSize * self.filter.pageNum)) {
                return false
            }
            return true;
        }
        self.openContactCard = function (contact) {
            contactFactory.displayContactCard1(contact.contact_id, contact.edited, contact.contact_type);
            contact.edited = false;
        };

        /* Callback to get more data according to pagination */
        function getMore() {
            self.dataReceived = false;
            var postInsuranceParams = setInsuranceInfoParams(self.filter);
            postInsuranceParams.pageNum += 1;
            self.filter.pageNum = postInsuranceParams.pageNum;
            postInsuranceParams.pageSize = pageSize;
            insuranceReportHelper.getInsuranceData(postInsuranceParams)
                .then(function (response) {
                    _.forEach(response.data.data, function (item) {
                        item.policy_limit = utils.isNotEmptyVal(item.policy_limit) ? $filter('currency')(item.policy_limit, '$', 2) : "";
                        item.policy_limit_max = utils.isNotEmptyVal(item.policy_limit_max) ? $filter('currency')(item.policy_limit_max, '$', 2) : "";
                        if ((utils.isEmptyVal(item.policy_limit) && utils.isEmptyVal(item.policy_limit_max))) {
                            item.policy_limits = "";
                        } else {
                            item.policy_limit_max = utils.isNotEmptyVal(item.policy_limit_max) ? item.policy_limit_max : "-";
                            item.policy_limit = utils.isNotEmptyVal(item.policy_limit) ? item.policy_limit : "-";
                            item.policy_limits = item.policy_limit + '/' + item.policy_limit_max;
                        }
                        if (utils.isNotEmptyVal(item.matter)) {
                            item.matter_name = utils.isNotEmptyVal(item.matter.matter_name) ? item.matter.matter_name : '';
                            item.file_number = utils.isNotEmptyVal(item.matter.file_number) ? item.matter.file_number : '';
                        }
                        item.insurance_adjusterName = utils.isNotEmptyVal(item.insurance_adjuster) ? item.insurance_adjuster.full_name : '';
                        item.matter_id = item.matter.matter_id ? item.matter.matter_id : 0;
                        if (angular.isDefined(item.matter.date_of_incidence) && !_.isNull(item.matter.date_of_incidence) && !utils.isEmptyString(item.matter.date_of_incidence) && item.matter.date_of_incidence != 0 && item.matter.date_of_incidence != '-') {
                            item.doi = moment.unix(item.matter.date_of_incidence).format('MM/DD/YYYY')
                        } else {
                            item.doi = "   -   "
                        }
                        item.associated_party = utils.isNotEmptyVal(item.associated_party) ? item.associated_party.associated_party_name : '';
                        item.insured_party = utils.isNotEmptyVal(item.insured_party) ? item.insured_party.full_name : '';
                        item.insurance_provider = utils.isNotEmptyVal(item.insurance_provider) ? item.insurance_provider.full_name : '';
                        self.insuranceDataList.push(item);
                    })
                    self.dataReceived = true;
                });
        }
        /* Callback to get all report data */
        function getAll() {
            self.filter.pageSize = 'all';
            self.dataReceived = false;
            getInsuranceInfo(self.filter);
        }

        /* Call back funtion for when filter tag is calncelled */
        function tagCancelled(tag) {
            switch (tag.key) {
                case 'policyLimit':
                    self.filter.policylimit = '';
                    self.filter.policylimit_max = '';
                    break;

                case 'insuranceType':
                    self.filter.insurancetype = '';
                    break;

                case 'excessconfirmed':
                    self.filter.excess_confirmed = '';
                    break;

                case 'policyexhausted':
                    self.filter.policy_exhausted = '';
                    break;
                case 'archiveMatters':
                    self.filter.includeArchived = 0;
                    break;
                case 'closeMatters':
                    self.filter.includeClosed = 0;
                    break;
                case 'insuranceProvider':
                    self.filter.newInsauranceInfo = {};
                    break;
                    
            }

            sessionStorage.setItem("insuranceReportFilters", JSON.stringify(self.filter)); //store applied filters
            getInsuranceInfo(self.filter);
            self.tags = generateTags(self.filter);
            self.filter.pageNum = 1;

        }

        // filter popup
        function openPopupFilter() {


            var modalInstance = $modal.open({
                templateUrl: 'app/report/allMatterList/filterPopUp/insurance/insuranceFilter.html',
                windowClass: 'medicalIndoDialog',
                controller: 'insuranceFilterCtrl as insuranceFilterCtrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    filter: function () {
                        return self.filter;
                    },
                    tags: function () {
                        return self.tags;
                    }

                }

            });
            //on close of popup
            modalInstance.result.then(function (filterObj) {
                self.filter = filterObj.filter;
                self.filter.pageNum = 1;
                self.filter.pageSize = pageSize;
                self.tags = generateTags(self.filter);
                sessionStorage.setItem("insuranceReportFilters", JSON.stringify(self.filter)); //store applied filters
                getInsuranceInfo(self.filter); // function to invoke helper function

            }, function () {

            });

        }

        function generateTags(filtersTags) {
            var tags = [];
            if (utils.isNotEmptyVal(self.filter.insurancetype)) {
                var tagObj = {

                    key: 'insuranceType',
                    value: 'Insurance Type: ' + self.filter.insurancetype
                };
                tags.push(tagObj);
            }
            if (!utils.isEmptyObj(self.filter.newInsauranceInfo)) {
                var tagObj = {

                    key: 'insuranceProvider',
                    value: 'Insurance Provider: ' + self.filter.newInsauranceInfo.insurance_provider.full_name
                };
                tags.push(tagObj);
            }

            if (utils.isNotEmptyVal(self.filter.policylimit) || utils.isNotEmptyVal(self.filter.policylimit_max)) {
                var policyLimit_min = utils.isNotEmptyVal(self.filter.policylimit) ? currencyFormat(self.filter.policylimit) : '';
                var policyLimit_max = utils.isNotEmptyVal(self.filter.policylimit_max) ? currencyFormat(self.filter.policylimit_max) : '';
                var policy;
                if ((utils.isEmptyVal(policyLimit_max) && utils.isEmptyVal(policyLimit_min))) {
                    policy = "";
                } else {
                    policyLimit_max = utils.isNotEmptyVal(policyLimit_max) ? policyLimit_max : "-";
                    policyLimit_min = utils.isNotEmptyVal(policyLimit_min) ? policyLimit_min : "-";
                    policy = policyLimit_min + '/' + policyLimit_max;
                }
                var tagObj = {
                    key: 'policyLimit',
                    value: 'Policy Limit: ' + policy
                };
                tags.push(tagObj);

            }

            if (utils.isNotEmptyVal(self.filter.excess_confirmed)) {
                var tagObj = {

                    key: 'excessconfirmed',
                    value: 'Excess Confirmed: ' + self.filter.excess_confirmed
                };
                tags.push(tagObj);
            }

            if (utils.isNotEmptyVal(self.filter.policy_exhausted)) {
                var tagObj = {

                    key: 'policyexhausted',
                    value: 'Policy Exhausted: ' + self.filter.policy_exhausted
                };
                tags.push(tagObj);
            }
            if (self.filter.includeArchived == 1) {
                var tagObj = {
                    key: 'archiveMatters',
                    value: 'Include Archived Matters: Yes'
                };
                tags.push(tagObj);
            }
            if (self.filter.includeClosed == 1) {
                var tagObj = {
                    key: 'closeMatters',
                    value: 'Include Closed Matters: Yes'
                };
                tags.push(tagObj);
            }
            return tags;
        }


        //headers of grid 
        self.clxGridOptions = {
            headers: insuranceReportHelper.getGridHeaders()
        }


        function scrollReachedBottom() {
            if (self.initInsuranceLimit <= self.total) {
                self.initInsuranceLimit = self.initInsuranceLimit + initInsurancelimit;
            }
        }

        function scrollReachedTop() {
            self.initInsuranceLimit = initInsurancelimit;
        }

		/**
		 * set filters object  to get insurance information 
		 */
        function setInsuranceInfoParams(filters) {
            var filtersApplied = {};
            filtersApplied.insuranceType = utils.isNotEmptyVal(filters.insurancetype) ? filters.insurancetype : '';
            filtersApplied.policyUpperLimit = utils.isNotEmptyVal(filters.policylimit_max) ? filters.policylimit_max : '';
            filtersApplied.policyLowerLimit = utils.isNotEmptyVal(filters.policylimit) ? filters.policylimit : '';
            filtersApplied.excessConfirmed = utils.isNotEmptyVal(filters.excess_confirmed) ? filters.excess_confirmed : '';
            filtersApplied.policyExhausted = utils.isNotEmptyVal(filters.policy_exhausted) ? filters.policy_exhausted : '';
            if (filters.pageSize == 'all') {
                //delete filtersApplied.pageSize;
            } else {
                filtersApplied.pageSize = pageSize;
            }
            // filtersApplied.pageSize = filters.pageSize == 'all' ? 'all' : pageSize;
            filtersApplied.pageNum = filters.pageNum;
            // filtersApplied.includeArchived = filters.includeArchived;
            self.initInsuranceLimit = initInsurancelimit;
            filtersApplied.includeClosed = utils.isNotEmptyVal(filters.includeClosed) ? filters.includeClosed : 0;
            filtersApplied.includeArchived = utils.isNotEmptyVal(filters.includeArchived) ? filters.includeArchived : 0;
            filtersApplied.insuranceProviderId = !utils.isEmptyObj(filters.newInsauranceInfo) ? filters.newInsauranceInfo.insurance_provider.contactid : '';
            return filtersApplied;
        }


        function getInsuranceInfo(filters) {
            var postSettParams = setInsuranceInfoParams(filters);
            // delete postSettParams.pageSize;
            insuranceReportHelper.getInsuranceData(postSettParams)
                .then(function (response) {
                    _.forEach(response.data.data, function (item) {
                        item.policy_limit = utils.isNotEmptyVal(item.policy_limit) ? $filter('currency')(item.policy_limit, '$', 2) : "";
                        item.policy_limit_max = utils.isNotEmptyVal(item.policy_limit_max) ? $filter('currency')(item.policy_limit_max, '$', 2) : "";
                        if ((utils.isEmptyVal(item.policy_limit) && utils.isEmptyVal(item.policy_limit_max))) {
                            item.policy_limits = "";
                        } else {
                            item.policy_limit_max = utils.isNotEmptyVal(item.policy_limit_max) ? item.policy_limit_max : "-";
                            item.policy_limit = utils.isNotEmptyVal(item.policy_limit) ? item.policy_limit : "-";
                            item.policy_limits = item.policy_limit + '/' + item.policy_limit_max;
                        }
                        if (utils.isNotEmptyVal(item.matter)) {
                            item.matter_name = utils.isNotEmptyVal(item.matter.matter_name) ? item.matter.matter_name : '';
                            item.file_number = utils.isNotEmptyVal(item.matter.file_number) ? item.matter.file_number : '';
                        }
                        item.insurance_adjusterName = utils.isNotEmptyVal(item.insurance_adjuster) ? item.insurance_adjuster.full_name : '';
                        item.matter_id = item.matter.matter_id ? item.matter.matter_id : 0;
                        if (angular.isDefined(item.matter.date_of_incidence) && !_.isNull(item.matter.date_of_incidence) && !utils.isEmptyString(item.matter.date_of_incidence) && item.matter.date_of_incidence != 0 && item.matter.date_of_incidence != '-') {
                            item.doi = moment.unix(item.matter.date_of_incidence).format('MM/DD/YYYY')
                        } else {
                            item.doi = "   -   "
                        }
                        item.associated_party = utils.isNotEmptyVal(item.associated_party) ? item.associated_party.associated_party_name : '';
                        item.insured_party = utils.isNotEmptyVal(item.insured_party) ? item.insured_party.full_name : '';
                        item.insurance_provider = utils.isNotEmptyVal(item.insurance_provider) ? item.insurance_provider.full_name : '';

                    })
                    self.insuranceDataList = response.data.data;
                    self.total = response.data.count;
                    self.dataReceived = true;

                })
        }

        //print
        function print() {
            insuranceReportHelper.printInsuranceInfo(self.insuranceDataList, self.filter);
        }
        //export
        function downloadInsuranceInfo() {
            insuranceReportHelper.exportInsuranceInfo(self.filter);
        }
    }




})(angular);


// helper functin

(function (angular) {
    angular.module('cloudlex.report').
        factory('insuranceReportHelper', insuranceReportHelper);

    insuranceReportHelper.$inject = ['$http', '$q', 'reportConstant', 'userSession', 'globalConstants', 'reportFactory', '$filter'];

    function insuranceReportHelper($http, $q, reportConstant, userSession, globalConstants, reportFactory, $filter) {

        //Empty tag array
        var tags = [];

        function getParams(params) {
            var querystring = "";
            angular.forEach(params, function (value, key) {
                querystring += key + "=" + value;
                querystring += "&";
            });
            return querystring.slice(0, querystring.length - 1);
        }
        return {
            getGridHeaders: getGridHeaders,
            getInsuranceData: getInsuranceData,
            printInsuranceInfo: _printInsuranceInfo,
            exportInsuranceInfo: _exportInsuranceInfo,

        }

        //print helper
        function _printInsuranceInfo(data, filter) {
            var getSettlementDom = getInsuranceDataForPrint(data, filter)
        }

        function downloadInsuranceInfoObj(popUpFilters) {
            var deferred = $q.defer();
            $http({
                url: reportConstant.RESTAPI.insuranceExport + getParams(popUpFilters),
                method: "GET",
                data: popUpFilters,
                responseType: 'arraybuffer',
            })
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        //export
        function _exportInsuranceInfo(filter, sort) {
            var FilteObj = getExportObj(filter);
            downloadInsuranceInfoObj(FilteObj)
                .then(function (response) {
                    utils.downloadFile(response.data, "Insurance_Report.xlsx", response.headers("Content-Type"));
                })
        }

        //Print
        function getInsuranceDataForPrint(data, filter) {
            var headers = getGridHeaders();
            var headersForPrint = getHeadersForPrint(headers);
            var filtersForPrint = getFiltersParamsPrint(filter);
            var printDom = printInsuranceInfo(data, headersForPrint, filtersForPrint);
            window.open().document.write(printDom);
        }

        //getExportObj
        function getExportObj(filter) {
            var filterObj = {};

            if (filter.pageSize == 'all') {
                filterObj.pageSize = 1000;
                filterObj.pageNum = 1;
            } else {
                filterObj.pageSize = 1000;
                filterObj.pageNum = 1;
            }

            if (filter.insurancetype) {
                filterObj['insuranceType'] = utils.isNotEmptyVal(filter.insurancetype) ? filter.insurancetype : '';
            } else {
                filterObj['insuranceType'] = '';
            }

            if (filter.policylimit) {
                filterObj['policyLowerLimit'] = utils.isNotEmptyVal(filter.policylimit) ? filter.policylimit : '';
            } else {
                filterObj['policyLowerLimit'] = '';
            }

            if (filter.policylimit_max) {
                filterObj['policyUpperLimit'] = utils.isNotEmptyVal(filter.policylimit_max) ? filter.policylimit_max : '';
            } else {
                filterObj['policyUpperLimit'] = '';
            }

            if (filter.excess_confirmed) {
                filterObj['excessConfirmed'] = utils.isNotEmptyVal(filter.excess_confirmed) ? filter.excess_confirmed : '';
            } else {
                filterObj['excessConfirmed'] = '';
            }

            if (filter.policy_exhausted) {
                filterObj['policyExhausted'] = utils.isNotEmptyVal(filter.policy_exhausted) ? filter.policy_exhausted : '';
            } else {
                filterObj['policyExhausted'] = '';
            }
            filterObj.includeClosed = utils.isNotEmptyVal(filter.includeClosed) ? filter.includeClosed : 0;
            filterObj.includeArchived = utils.isNotEmptyVal(filter.includeArchived) ? filter.includeArchived : 0;
            filterObj.insuranceProviderId = !utils.isEmptyObj(filter.newInsauranceInfo) ? filter.newInsauranceInfo.insurance_provider.contactid : '';
            // if (filter.includeArchived == 1) {
            //     filterObj['includeArchived'] = filter.includeArchived;
            // } else {
            //     filterObj['includeArchived'] = 0;
            // }

            return filterObj;
        }

        //filter object for print
        function getFiltersParamsPrint(filter) {
            var filterObj = {};
            var policy;
            if((filter.newInsauranceInfo)){
                filterObj['Insurance Provider'] = !utils.isEmptyObj(filter.newInsauranceInfo) ? filter.newInsauranceInfo.insurance_provider.full_name : '';
            } else {
                filterObj['Insurance Provider'] = '';
            }
            
            if (filter.insurancetype) {
                filterObj['Insurance Type'] = utils.isNotEmptyVal(filter.insurancetype) ? filter.insurancetype : '';
            } else {
                filterObj['Insurance Type'] = '';
            }
            if (filter.policylimit || filter.policylimit_max) {
                var upperLimit = utils.isNotEmptyVal(filter.policylimit_max) ? currencyFormat(filter.policylimit_max) : '';
                var lowerLimit = utils.isNotEmptyVal(filter.policylimit) ? currencyFormat(filter.policylimit) : '';
                if ((utils.isEmptyVal(upperLimit) && utils.isEmptyVal(lowerLimit))) {
                    policy = "";
                } else {
                    upperLimit = utils.isNotEmptyVal(upperLimit) ? upperLimit : "-";
                    lowerLimit = utils.isNotEmptyVal(lowerLimit) ? lowerLimit : "-";
                    policy = lowerLimit + '/' + upperLimit;
                }
                filterObj['Policy Limit'] = policy;
            } else {
                filterObj['Policy Limit'] = '';
            }
            if (filter.excess_confirmed) {
                filterObj['Excess Confirmed'] = utils.isNotEmptyVal(filter.excess_confirmed) ? filter.excess_confirmed : '';
            } else {
                filterObj['Excess Confirmed'] = '';
            }
            if (filter.policy_exhausted) {
                filterObj['Policy Exhausted'] = utils.isNotEmptyVal(filter.policy_exhausted) ? filter.policy_exhausted : '';
            } else {
                filterObj['Policy Exhausted'] = '';
            }
            if (filter.includeClosed == 1) {
                filterObj['Include Closed Matters'] = 'Yes';
            }
            else{
                filterObj['Include Closed Matters'] = 'No';
            }
            if (filter.includeArchived == 1) {
                filterObj['Include Archived Matters'] = 'Yes';
            }
            else
            {
                filterObj['Include Archived Matters'] = 'No';
            }
            
            return filterObj
        }

        function currencyFormat(num) {
            num = num.toString();
            return "$" + num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        }

        // printdom
        function printInsuranceInfo(data, headers, filters) {
            var html = "<html><title>Insurance Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}tbody {display:table-row-group;}</style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Insurance Report</h1><div></div>";
            html += "<body>";
            html += "<div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<tr>";
            angular.forEach(filters, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;' class='labelTxt'>";
                html += "<label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px; '>  " + val + '</span>';
                html += "</div>";
            });
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "</tr>";
            html += '<tr>';
            angular.forEach(headers, function (head) {
                html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + head.display + "</th>";
            });
            html += '</tr>';


            angular.forEach(data, function (insuranceObj) {
                html += '<tr>';
                angular.forEach(headers, function (head) {
                    insuranceObj[head.prop] = (_.isNull(insuranceObj[head.prop]) || angular.isUndefined(insuranceObj[head.prop]) || utils.isEmptyString(insuranceObj[head.prop])) ? "" : utils.removeunwantedHTML(insuranceObj[head.prop]);
                    html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + insuranceObj[head.prop] + "</td>";
                })
                html += '</tr>'
            })

            return html;

        }

        //extract headers
        function getHeadersForPrint(headers) {
            var displayHeaders = [];
            _.forEach(headers, function (head) {
                _.forEach(head.field, function (field) {
                    displayHeaders.push({
                        prop: field.prop,
                        display: field.printDisplay
                    });
                })
            })
            return displayHeaders
        }

        function getInsuranceData(filters) {
            //delete filters.pageSize;
            var url = reportConstant.RESTAPI.insurance + "?" + getParams(filters);
            return $http.get(url);
        }

        function getGridHeaders() {
            return [
                {
                    field: [{
                        prop: 'matter_name',
                        href: {
                            link: '#/matter-overview',
                            paramProp: ['matter_id']
                        },
                        printDisplay: 'Matter Name'
                    }, {
                        prop: 'file_number',
                        label: 'File# ',
                        printDisplay: 'File Number'
                    },
                    {
                        prop: 'doi',
                        printDisplay: 'Date of Incident'
                    }],
                    displayName: 'Matter name, File Number,Date of Incident',
                    dataWidth: '20'
                }, {
                    field: [{
                        prop: 'associated_party',
                        html: '<span style="word-break: break-word;">{{data.associated_party}}</span>',
                        printDisplay: 'Associated Party'
                    }],
                    displayName: 'Associated Party',
                    dataWidth: '10'
                }, {
                    field: [{
                        prop: 'insurance_type',
                        printDisplay: 'Insurance Type'
                    }],
                    displayName: 'Insurance Type',
                    dataWidth: '10'
                }, {
                    field: [{
                        prop: 'insured_party',
                        printDisplay: 'Insured Party',
                    }],
                    displayName: 'Insured Party',
                    dataWidth: '10'
                }, {
                    field: [{
                        prop: 'insurance_provider',
                        printDisplay: 'Insurance Provider',
                    }],
                    displayName: 'Insurance Provider',
                    dataWidth: '10'
                }, {
                    field: [{
                        prop: 'policy_number',
                        printDisplay: 'Policy Number',
                    }],
                    displayName: 'Policy Number',
                    dataWidth: '10'
                }, {
                    field: [{
                        prop: 'policy_limits',
                        printDisplay: 'Policy Limit',
                    }],
                    displayName: 'Policy Limit',
                    dataWidth: '10'
                }, {
                    field: [{
                        prop: 'insurance_adjusterName',
                        printDisplay: 'Adjuster Name',
                    }],
                    displayName: 'Adjuster Name',
                    dataWidth: '10'
                }, {
                    field: [{
                        prop: 'claim_number',
                        printDisplay: 'Claim Number'
                    }],
                    displayName: 'Claim Number',
                    dataWidth: '10'
                }
            ]
        }

    }
})(angular);
