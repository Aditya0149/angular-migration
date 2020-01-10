(function (angular) {

    'use strict';

    angular.module('cloudlex.report').
        controller('matterValuationCtrl', matterValuationCtrl);
    matterValuationCtrl.$inject = ['$modal', 'matterValuationHelper', 'reportFactory'];

    //controller definition 
    function matterValuationCtrl($modal, matterValuationHelper, reportFactory) {
        var self = this;
        self.filter = {};
        self.getMore = getMore;
        self.getAll = getAll;
        self.filterMatterValuationList = filterMatterValuationList;
        self.getMatterValuationListData = getMatterValuationListData;
        self.setReferredToBy = setReferredToBy;
        self.applySortByFilter = applySortByFilter;
        self.tagCancelled = tagCancelled;
        self.selectedSort = 'Matter Name ASC';
        self.showPaginationButtons = showPaginationButtons;
        self.scrollReachedBottom = scrollReachedBottom;
        self.scrollReachedTop = scrollReachedTop;
        self.dataReceived = false;
        self.setFilters = setFilters;
        self.print = print;
        self.downloadMatterValuationList = downloadMatterValuationList;
        var initMailingLimit = 10;
        var pageSize = 250;
        var getAllFlag = false;



        (function () {
            self.mailingLimit = initMailingLimit;
            getUserInfo();
        })();

        function getUserInfo() {
            var promesa = reportFactory.getUserInfo();
            promesa.then(function (dataLists) {
                self.userList = dataLists;
                // sort object
                self.sorts = [{
                    name: 'Matter name ASC',
                    sortby: 'matter_name',
                    value: '0'
                }, {
                    name: 'Matter name DESC',
                    sortby: 'matter_name',
                    value: '1'
                }, {
                    name: 'Valuation Amount ASC',
                    sortby: 'expected_value',
                    value: '2'
                }, {
                    name: 'Valuation Amount DESC',
                    sortby: 'expected_value',
                    value: '3'
                }];


                //sort initialization self.selectedSort = 'Matter name ASC';
                self.clickedRow = -1;
                var persistedFilter = sessionStorage.getItem('matterValuationFilters');

                if (utils.isNotEmptyVal(persistedFilter)) { //if the filters are not empty, then try 
                    try {
                        self.filter = JSON.parse(persistedFilter);
                        self.selectedSort = _.find(self.sorts, function (sort) { //check if which is the current selected sort
                            return sort.value === self.filter.sortby
                        }).name;
                        //reset headers of grid 
                        self.clxGridOptions = {

                            headers: matterValuationHelper.getGridHeaders(self.filter)
                        }
                        getMatterValuationListData(self.filter);
                        self.tags = generateTags(self.filter, self.userList);

                    }

                    catch (e) {
                        setFilters();
                    }
                }
                else {
                    setFilters(); // set filters
                    //reset headers of grid 
                    self.clxGridOptions = {
                        headers: matterValuationHelper.getGridHeaders(self.filter)
                    }
                    getMatterValuationListData(self.filter);
                }
            }, function (reason) { });
        }

        //print
        function print() {
            var data = angular.copy(self.plaintiffMailingList);
            _.forEach(data, function(item){
                item.referred_to = item.referred_to.replace(", " , "");
            });
            matterValuationHelper.getPrintData(angular.copy(data), angular.copy(self.filter), angular.copy(self.selectedSort));

        }

        //export
        function downloadMatterValuationList() {
            self.filter.pageNum = 1;
            matterValuationHelper.exportMatterValuationlist(self.filter, self.selectedSort, self.plaintiffMailingList);
        }


        // get data
        function getMatterValuationListData(filter) {
            sessionStorage.setItem("matterValuationFilters", JSON.stringify(filter)); //store applied filters
            var filtersApplied = angular.copy(filter);
            // delete filtersApplied.sortby;
            delete filtersApplied.leadAttorney;
            delete filtersApplied.policylimit;
            delete filtersApplied.policylimit_max;
            delete filtersApplied.lowlimitCopy;
            delete filtersApplied.maxlimitCopy;
            delete filtersApplied.attorneyCopy;
            delete filtersApplied.paralegalCopy;
            filtersApplied.includeArchived;

            filtersApplied.pageNum = 1;
            // STORY:4768 check whether pagesize is set to be all or not ...
            if (getAllFlag == false) {
                filtersApplied.pageSize = pageSize;
                self.filter.pageSize = pageSize;
            }
            matterValuationHelper.getListData(filtersApplied).
                then(function (response) {
                    self.total = response.data.matters_count;
                    setReferredToBy(response.data.matters);
                    self.plaintiffMailingList = response.data.matters;
                    self.plaintiffDataList = response.data.matters;
                    self.dataReceived = true;
                });
        }


        //Get sort
        function applySortByFilter(sortObj) {
            self.selectedSort = sortObj.name;
            self.filter.sortby = sortObj.value;
            self.filter.pageNum = 1;
            self.filter.pageSize = 250;
            //reset headers of grid 
            self.clxGridOptions = {
                headers: matterValuationHelper.getGridHeaders(self.filter)
            }
            getMatterValuationListData(self.filter);
        }


        function setFilters() {
            var defaultSelected = _.find(self.sorts, function (sort) {
                return sort.value == 0
            });
            self.selectedSort = defaultSelected.name;
            self.filter = {
                pageNum: 1,
                pageSize: pageSize,
                sortby: defaultSelected.value,
                includeArchived: 0
            };

        }


        /* Call back funtion for when filter tag is calncelled */
        function tagCancelled(tag) {
            switch (tag.type) {
                case 'Attorney': {
                    self.filter.attorney = '';
                    self.filter.attorneyCopy = '';
                    break;
                }
                case 'Paralegal': {
                    self.filter.paralegal = '';
                    self.filter.paralegalCopy = '';
                    break;
                }
                case 'MatterValuationRange': {
                    self.filter.minimumAmount = '';
                    self.filter.maximumAmount = '';
                    self.filter.lowlimitCopy = '';
                    self.filter.maxlimitCopy = '';

                    break;
                }
                case 'ArchivedMatters': {
                    self.filter.includeArchived = 0;
                    break;
                }

            }
            //reset headers of grid 
            self.clxGridOptions = {
                headers: matterValuationHelper.getGridHeaders(self.filter)
            }
            sessionStorage.setItem("matterValuationFilters", JSON.stringify(self.filter)); //store applied filters
            getMatterValuationListData(self.filter); // function to invoke helper function
            self.tags = generateTags(self.filter, self.userList);
            self.filter.pageNum = 1;
        }

        //Tags
        function generateTags(filtersTags, userList) {
            var tags = [];
            var attorney = {};
            var paralegal = {};

            if (utils.isNotEmptyVal(filtersTags.paralegal) && filtersTags.paralegal != '') {
                _.forEach(userList, function (data) {
                    if (angular.isDefined(data.paralegal)) {
                        _.forEach(data.paralegal, function (data) {
                            if (filtersTags.paralegal == data.uid) {
                                paralegal.key = data.uid;
                                paralegal.type = "Paralegal";
                                paralegal.value = "Paralegal: " + data.name;
                                tags.push(paralegal);
                            }
                        });
                    }
                });
            }

            if (utils.isNotEmptyVal(filtersTags.attorney) && filtersTags.attorney != '') {
                _.forEach(userList, function (data) {
                    if (angular.isDefined(data.attorny)) {
                        _.forEach(data.attorny, function (data) {
                            if (filtersTags.attorney == data.uid) {
                                attorney.key = data.uid;
                                attorney.type = "Attorney";
                                attorney.value = "Attorney: " + data.name;
                                tags.push(attorney);
                            }
                        });
                    }
                });
            }

            if (filtersTags.includeArchived == 1) {
                var tagObj = {
                    type: 'ArchivedMatters',
                    value: 'Include Archived Matters'
                }
                tags.push(tagObj);
            }
            var policyLimit_min = utils.isNotEmptyVal(filtersTags.minimumAmount) ? currencyFormat(filtersTags.minimumAmount) : '';
            var policyLimit_max = utils.isNotEmptyVal(filtersTags.maximumAmount) ? currencyFormat(filtersTags.maximumAmount) : '';
            var policy;
            if ((utils.isEmptyVal(policyLimit_max) && utils.isEmptyVal(policyLimit_min))) {
                policy = "";
            } else {
                policyLimit_max = utils.isNotEmptyVal(policyLimit_max) ? policyLimit_max : "-";
                policyLimit_min = utils.isNotEmptyVal(policyLimit_min) ? policyLimit_min : "-";
                policy = policyLimit_min + '/' + policyLimit_max;
            }
            var tagObj = {
                type: 'MatterValuationRange',
                value: 'Matter Valuation: ' + policy
            };
            if (!utils.isEmptyString(policy))
                tags.push(tagObj);
            return tags;
        }

        function currencyFormat(num) {
            num = num.toString();
            return "$" + num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        }

        //headers of grid 
        self.clxGridOptions = {
            headers: matterValuationHelper.getGridHeaders(self.filter)
        }



        /* check whether to show more and all buttons*/
        function showPaginationButtons() {

            if (!self.dataReceived) { // if data not received
                return false;
            }

            if (angular.isUndefined(self.plaintiffMailingList) || self.plaintiffMailingList.length <= 0) { //if data is empty
                return false;
            }

            if (self.filter.pageSize == 0) { // if pagesize is all
                return false;
            }

            if (self.plaintiffMailingList.length < (self.filter.pageSize * self.filter.pageNum)) {
                return false
            }
            return true;
        }

        function scrollReachedBottom() {
            if (self.mailingLimit <= self.total) {
                self.mailingLimit = self.mailingLimit + initMailingLimit;
            }
        }

        function scrollReachedTop() {
            self.mailingLimit = initMailingLimit;
        }


        /* Callback to get more data according to pagination */
        function getMore() {
            self.filter.pageNum += 1;
            self.filter.pageSize = pageSize;
            self.dataReceived = false;
            self.filter.includeArchived;
            matterValuationHelper.getListData(self.filter)
                .then(function (response) {
                    self.total = response.data.matters_count;
                    setReferredToBy(response.data.matters)
                    self.plaintiffMailingList = self.plaintiffMailingList.concat(response.data.matters);
                    self.plaintiffDataList = self.plaintiffDataList.concat(response.data.matters);
                    self.dataReceived = true;
                });
        }


        /* Callback to get all report data */
        function getAll() {
            self.filter.pageSize = 1000;
            getAllFlag = true;
            self.dataReceived = false;
            //reset headers of grid 
            self.clxGridOptions = {
                headers: matterValuationHelper.getGridHeaders(self.filter)
            }
            getMatterValuationListData(self.filter);

        }

        // Set Referred to and referred by
        function setReferredToBy(data){
            _.forEach(data, function(item){
                if(utils.isNotEmptyVal(item.referred_by)){
                    item.referred_to =  utils.isNotEmptyVal(item.referred_to)  ? item.referred_to + ', ' : '-';  
                } else {
                    item.referred_to =  utils.isNotEmptyVal(item.referred_to)  ? item.referred_to : '-';  
                }
                item.referred_by =  utils.isNotEmptyVal(item.referred_by)  ? item.referred_by  : '-';
            });
        }




        //filter function
        function filterMatterValuationList() {


            var modalInstance = $modal.open({
                templateUrl: 'app/report/allMatterList/filterPopUp/matterValuation/matterValuationFillter.html',
                controller: 'matterValuationFillter as matterValuationFillter',
                backdrop: 'static',
                windowClass: 'modalMidiumDialog',
                keyboard: false,
                size: 'lg',
                resolve: {
                    filter: function () {
                        return self.filter
                    },
                    tags: function () {
                        return self.tags;
                    },
                    userList: function () {
                        return self.userList;
                    }
                }
            });

            //on close of popup
            modalInstance.result.then(function (filterObj) {
                self.filter = filterObj.filter;
                self.filter.pageNum = 1;
                self.filter.pageSize = pageSize;
                self.tags = generateTags(self.filter, self.userList);
                // console.log('scope',$scope.parent);
                sessionStorage.setItem("matterValuationFilters", JSON.stringify(self.filter)); //store applied filters
                //reset headers of grid 
                self.clxGridOptions = {
                    headers: matterValuationHelper.getGridHeaders(self.filter)
                }
                getMatterValuationListData(self.filter); // function to invoke helper function

            }, function () {

            });

        }




    }


})(angular);


//Helper

(function (angular) {
    angular.module('cloudlex.report').
        factory('matterValuationHelper', matterValuationHelper);

    matterValuationHelper.$inject = ['$http', 'reportConstant', 'globalConstants', 'reportFactory', '$filter','$q'];

    function matterValuationHelper($http, reportConstant, globalConstants, reportFactory, $filter,$q) {

        return {
            getGridHeaders: getGridHeaders,
            getListData: getListData,
            getPlaintiffs: getPlaintiffs,
            getPrintData: getPrintData,
            getHeadersForPrint: getHeadersForPrint,
            setEdited: setEdited,
            updateContact: updateContact,
            setFullName: setFullName,
            formatContactAddress: formatContactAddress,
            exportMatterValuationlist: exportMatterValuationlist
        }


        function setFullName(plaintiff) {
            plaintiff.name = plaintiff.firstName + " " + plaintiff.lastName
        }


        function formatContactAddress(plaintiff) {
            if (utils.isNotEmptyVal(plaintiff) && (typeof plaintiff === 'object')) {
                plaintiff.streetCityStateZip = utils.isNotEmptyVal(plaintiff.street) ? plaintiff.street : '';
                plaintiff.streetCityStateZip += (utils.isNotEmptyVal(plaintiff.street) && (utils.isNotEmptyVal(plaintiff.city) || utils.isNotEmptyVal(plaintiff.state) || utils.isNotEmptyVal(plaintiff.zipCode))) ? ', ' : '';
                plaintiff.streetCityStateZip += utils.isNotEmptyVal(plaintiff.city) ? plaintiff.city : '';
                plaintiff.streetCityStateZip += (utils.isNotEmptyVal(plaintiff.city) && utils.isNotEmptyVal(plaintiff.state)) ? ', ' : '';
                plaintiff.streetCityStateZip += (utils.isNotEmptyVal(plaintiff.city) && utils.isEmptyVal(plaintiff.state) && utils.isNotEmptyVal(plaintiff.zipCode)) ? ', ' : '';
                plaintiff.streetCityStateZip += utils.isNotEmptyVal(plaintiff.state) ? plaintiff.state : '';
                plaintiff.streetCityStateZip += (utils.isNotEmptyVal(plaintiff.state) && utils.isNotEmptyVal(plaintiff.zipCode)) ? ', ' : '';
                plaintiff.streetCityStateZip += utils.isNotEmptyVal(plaintiff.zipCode) ? plaintiff.zipCode : '';
            }
        }

        //export

        function exportMatterValuationlist(filter, sort, data) {
            var filterObj = angular.copy(filter);
            filterObj.maximumAmount = angular.isUndefined(filterObj.maximumAmount) ? '' : filterObj.maximumAmount;
            filterObj.paralegal = angular.isUndefined(filterObj.paralegal) ? '' : filterObj.paralegal;
            filterObj.attorney = angular.isUndefined(filterObj.attorney) ? '' : filterObj.attorney;
            filterObj.minimumAmount = angular.isUndefined(filterObj.minimumAmount) ? '' : filterObj.minimumAmount;
            filterObj.includeArchived = filterObj.includeArchived;
            delete filterObj.leadAttorney;
            delete filterObj.policylimit;
            delete filterObj.policylimit_max;
            delete filterObj.lowlimitCopy;
            delete filterObj.maxlimitCopy;
            delete filterObj.attorneyCopy;
            delete filterObj.paralegalCopy;
            filterObj.pageSize = 1000;
            reportFactory.downloadMatterValuation(filterObj, data)
            .then(function (response) {
                utils.downloadFile(response.data, "Matter Valuation Report.xlsx", response.headers("Content-Type"));
            });
        }

        //update contact info on grid
        function updateContact(plaintiff, contact) {
            if (plaintiff.contactid === contact.contactid) {
                plaintiff.city = contact.city;
                plaintiff.state = contact.state;
                plaintiff.zipCode = contact.zipcode;
                plaintiff.street = contact.street;
                plaintiff.phone_work = contact.phone_work;
                plaintiff.phone_cell = contact.phone_cell;
                plaintiff.firstName = contact.firstname;
                plaintiff.lastName = contact.lastname;
                plaintiff.emailId = contact.email;
                plaintiff.edited = true;

            }

        }

        // check which contact to edit
        function setEdited(mailingList, currentContact) {
            mailingList.edited = mailingList.edited === currentContact ? false : mailingList.edited

        }

        //print start
        function getPrintData(data, filter, sort) {
            getMatterValuationDomPrint(data, filter, sort)
        }

        function getMatterValuationDomPrint(data, filter, sort) {

            var headers = getGridHeaders(filter);
            var headersForPrint = getHeadersForPrint(headers);
            var filtersForPrint = getFiltersParamsPrint(angular.copy(filter), sort);
            var printDom = getPrintMatterValuations(data, headersForPrint, filtersForPrint, sort);
            window.open().document.write(printDom);
        }

        function getFiltersParamsPrint(filter, sort) {
            var filterObj = {};
            var policy;
            if (filter.attorney) {
                filterObj['Attorney'] = utils.isNotEmptyVal(filter.attorneyCopy) ? filter.attorneyCopy.name : '';

            } else {
                filterObj['Attorney'] = '';
            }
            if (filter.paralegal) {
                filterObj['Paralegal'] = utils.isNotEmptyVal(filter.paralegalCopy) ? filter.paralegalCopy.name : '';

            } else {
                filterObj['Paralegal'] = '';
            }
            if (filter.minimumAmount || filter.maximumAmount) {
                var upperLimit = utils.isNotEmptyVal(filter.maximumAmount) ? currencyFormat(filter.maximumAmount) : '';
                var lowerLimit = utils.isNotEmptyVal(filter.minimumAmount) ? currencyFormat(filter.minimumAmount) : '';
                if ((utils.isEmptyVal(upperLimit) && utils.isEmptyVal(lowerLimit))) {
                    policy = "";
                } else {
                    upperLimit = utils.isNotEmptyVal(upperLimit) ? upperLimit : "-";
                    lowerLimit = utils.isNotEmptyVal(lowerLimit) ? lowerLimit : "-";
                    policy = lowerLimit + '/' + upperLimit;
                }

                filterObj['Matter Valuation'] = policy;
            } else {
                filterObj['Matter Valuation'] = '';
            }

            if (sort) {
                filterObj['Sort By'] = utils.isNotEmptyVal(sort) ? sort : '';

            } else {
                filterObj['Sort By'] = '';
            }
            if (filter.includeArchived == 1) {
                filterObj['Include Archival Matters'] = 'Yes';

            }

            return filterObj
        }

        function currencyFormat(num) {
            num = num.toString();
            return "$" + num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        }

        // filter object for print

        // printdom
        function getPrintMatterValuations(data, headers, filters, sort) {
            var html = "<html><title>Matter Valuation Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}tbody {display:table-row-group;}</style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Matter Valuation Report</h1><div></div>";
            html += "<body>";
            html += "<div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<tr>";
            angular.forEach(filters, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;' class='labelTxt'>";
                html += "<label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px; '>  " + utils.removeunwantedHTML(val) + '</span>';
                html += "</div>";
            });
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "</tr>";
            html += '<tr>';
            angular.forEach(headers, function (head) {
                if (head.prop == 'expected_value' || head.prop == 'offer' || head.prop == 'demand') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right;'>" + head.display + "</th>";
                }
                else {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + head.display + "</th>";
                }
            });
            html += '</tr>'
            angular.forEach(data, function (exp) {
                html += '<tr>';
                angular.forEach(headers, function (head) {
                    exp[head.prop] = (_.isNull(exp[head.prop]) || angular.isUndefined(exp[head.prop]) || utils.isEmptyString(exp[head.prop])) ? " - " : exp[head.prop];
                    if (head.prop == 'offer' || head.prop == 'demand') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px; text-align:right'>" + $filter('currency')(exp[head.prop], '$', 2) + "</td>";
                    } else if (head.prop == 'expected_value') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse;text-align:left; padding:5px; text-align:right'>" + (utils.isNotEmptyVal(exp[head.prop]) && !isNaN(exp[head.prop]) ? currencyFormat(parseFloat(exp[head.prop]).toFixed(2)) : '-') + "</td>";
                    }
                    else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(exp[head.prop]) + "</td>";
                    }


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


        //print end

        function getParams(urlParams) {
            var querystring = "";
            angular.forEach(urlParams, function (value, key) {
                if (value) {
                    querystring += key + "=" + value;
                    querystring += "&";
                }

            });
            return querystring.slice(0, querystring.length - 1);
        }


        function getListData(urlParams) {
            var url = reportConstant.RESTAPI.matterValuation + getParams(urlParams);
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
            })
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function getPlaintiffs(matterId) {
            var url = reportConstant.RESTAPI.getPlaintiffLimited + matterId;
            return $http.get(url);
        }

        function getGridHeaders(filtr) {
            var allHeaders = [
                {
                    field: [{
                        prop: 'matter_name',
                        href: { link: '#/matter-overview', paramProp: ['matter_id'] },
                        printDisplay: 'Matter Name'
                    }],
                    displayName: 'Matter Name',
                    dataWidth: '12'
                }, {
                    field: [{
                        prop: 'type',
                        filter: 'replaceByDash',
                        printDisplay: 'Matter Type'
                    },
                    {
                        prop: 'sub_type',
                        filter: 'replaceByDash',
                        printDisplay: 'Matter Subtype'
                    },
                    {
                        prop: 'category',
                        filter: 'replaceByDash',
                        printDisplay: 'Matter Category'
                    }
                    ],
                    displayName: 'Matter Type, Subtype & Category',
                    dataWidth: '13'

                }, {
                    field: [{
                        prop: 'status',
                        template: 'bold',
                        printDisplay: 'Status',
                    }, {
                        prop: 'sub_status',
                        printDisplay: 'Substatus',
                    }],
                    displayName: 'Status & Substatus',
                    dataWidth: '12'

                }, {
                    field: [{
                        prop: 'matter_attorney',
                        printDisplay: 'Attorney'
                    }],
                    displayName: 'Attorney',
                    dataWidth: '13'
                }, {
                    field: [{
                        prop: 'matter_paralegals',
                        printDisplay: 'Paralegal'
                    }],
                    displayName: 'Paralegal',
                    dataWidth: '15'
                }, {
                    field: [{
                        prop: 'matter_staffs',
                        printDisplay: 'Staff'
                    }],
                    displayName: 'Staff',
                    dataWidth: '10'
                }, {
                    field: [{
                        prop: 'expected_value',
                        html: '<span tooltip="${{data.expected_value | number:2}}" tooltip-append-to-body="true" tooltip-placement="bottom">{{data.expected_value || data.expected_value == 0 ? "$" : ""}}{{data.expected_value | number:2}}</span>',
                        printDisplay: 'Valuation Amount',
                    }],
                    displayName: 'Valuation Amount',
                    dataWidth: '10'
                }, {
                    field: [{
                        prop: 'referred_to',
                        printDisplay: 'Referred To',
                    }, {
                        prop: 'referred_by',
                        printDisplay: 'Referred By',
                    }],
                    displayName: 'Referred To & Referred By',
                    dataWidth: '15'

                }
                // }, {
                //     field: [{
                //         prop: 'demand',
                //         html: '<span tooltip="{{ (data.demand) ? (data.demand | currency) : (data.demand) }}" tooltip-append-to-body="true" tooltip-placement="bottom">{{ (data.demand) ? (data.demand | currency) : (data.demand) }}</span>',
                //         printDisplay: 'Recent Demand',
                //     }],
                //     displayName: 'Recent Demand',
                //     dataWidth: '10'
                // }
            ];

            return allHeaders;
        } // helper      
    }  // function helper


})(angular);
