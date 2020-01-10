(function (angular) {

    'use strict';

    angular.module('cloudlex.report').
        controller('plaintiffMailingCtrl', plaintiffMailingCtrl);
    plaintiffMailingCtrl.$inject = ['$scope', '$modal', 'plaintiffMailingListHelper', 'contactFactory'];

    //controller definition 
    function plaintiffMailingCtrl($scope, $modal, plaintiffMailingListHelper, contactFactory) {
        var self = this;
        self.filter = {};
        self.getMore = getMore;
        self.getAll = getAll;
        self.filterPlaintiffMailingList = filterPlaintiffMailingList;
        self.getPlaintiffMailingListData = getPlaintiffMailingListData;
        self.applySortByFilter = applySortByFilter;
        self.tagCancelled = tagCancelled;
        self.selectedSort = 'Matter Name ASC';
        self.showPaginationButtons = showPaginationButtons;
        self.scrollReachedBottom = scrollReachedBottom;
        self.scrollReachedTop = scrollReachedTop;
        self.dataReceived = false;
        self.setFilters = setFilters;
        self.print = print;
        self.openContactCard = openContactCard;
        self.downloadMailingList = downloadMailingList;
        var initMailingLimit = 10;
        var page_size = 250;
        var getAllFlag = false;



        (function () {
            self.mailingLimit = initMailingLimit;
        })();



        //print
        function print() {
            plaintiffMailingListHelper.getPrintData(self.plaintiffMailingList, self.filter, self.selectedSort);

        }

        //export
        function downloadMailingList() {
            plaintiffMailingListHelper.exportMailinglist(self.filter, self.selectedSort, self.plaintiffMailingList);
        }


        //Contact Card
        function openContactCard(contact) {
            contactFactory.displayContactCard1(contact, false, contact.contact_type);
            //loop through the contacts to get current contact to be edited
            _.forEach(self.plaintiffMailingList, function (mailinglist) {
                plaintiffMailingListHelper.setEdited(mailinglist, contact);
            });
        }
        $scope.$on('contactCardEdited', function (e, editedContact) {
            var contactObj = editedContact; // get the cuttent obj
            var plaintiffList = angular.copy(self.plaintiffMailingList);

            _.forEach(plaintiffList, function (plaintiff) {
                plaintiffMailingListHelper.updateContact(plaintiff, contactObj);
                plaintiffMailingListHelper.setFullName(plaintiff);
                plaintiffMailingListHelper.formatContactAddress(plaintiff);
            });
            self.plaintiffMailingList = plaintiffList;
        });


        // get data
        function getPlaintiffMailingListData(filter) {
            self.dataLoaderFlag = false;
            //sessionStorage.setItem("plaintiffListFilters", JSON.stringify(filter)); //store applied filters
            var filtersApplied = angular.copy(filter);
            filtersApplied.matter_id = utils.isNotEmptyVal(filtersApplied.matter_id) ? filtersApplied.matter_id.matterid : '';
            filtersApplied.plaintiff_id = utils.isNotEmptyVal(filtersApplied.plaintiff_id) ? filtersApplied.plaintiff_id.plaintiffid : '';
            filtersApplied.state = utils.isNotEmptyVal(filtersApplied.state) ? filtersApplied.state.name : '';
            filtersApplied.state = filtersApplied.state.split(' ').join('+');
            filtersApplied.page_num = 1;
            filtersApplied.include_archived = filter.include_archived;
            filtersApplied.sort_by = filter.sort_by;
            filtersApplied.sort_order = filter.sort_order;

            // STORY:4768 check whether pagesize is set to be all or not ...
            if (getAllFlag == false) {
                filtersApplied.page_size = page_size;
                self.filter.page_size = page_size;
            }

            self.plaintiffMailingList = [];
            plaintiffMailingListHelper.getListData(filtersApplied).
                then(function (response) {
                    contactFactory.getPhonesInSeq(response[1].data);
                    _.forEach(response[1].data, function (dob) {
                        processData(dob);
                    });

                    _.forEach(response[1].data, function (plaintiff) {
                        plaintiffMailingListHelper.setFullName(plaintiff);
                        plaintiffMailingListHelper.formatContactAddress(plaintiff);
                    });
                    //getTotalDataCount(filtersApplied);
                    self.total = response[0].count;
                    self.plaintiffMailingList = response[1].data;
                    self.plaintiffDataList = response[1].data;
                    self.dataReceived = true;
                    self.dataLoaderFlag = true;
                }, function () {
                });


        }

        function processData(dob) {
            dob.gender = ((angular.isDefined(dob.gender) && !_.isNull(dob.gender) && !utils.isEmptyString(dob.gender) && dob.gender != '-')) ? dob.gender : '-';
            dob.date_of_birth = ((angular.isDefined(dob.date_of_birth) && !_.isNull(dob.date_of_birth) && !utils.isEmptyString(dob.date_of_birth) && dob.date_of_birth != 0 && dob.date_of_birth != '-')) ? moment.unix(dob.date_of_birth).utc().format('MM/DD/YYYY') : '-';
            dob.date_of_incidence = ((angular.isDefined(dob.date_of_incidence) && !_.isNull(dob.date_of_incidence) && !utils.isEmptyString(dob.date_of_incidence) && dob.date_of_incidence != 0 && dob.date_of_incidence != '-')) ? moment.unix(dob.date_of_incidence).utc().format('MM/DD/YYYY') : '-';
            dob.email_id = ((angular.isDefined(dob.email_id) && !_.isNull(dob.email_id) && !utils.isEmptyString(dob.email_id) && dob.email_id != '-')) ? dob.email_id : '-';
        }

        //Get sort
        function applySortByFilter(sortObj) {
            self.selectedSort = sortObj.name;
            self.filter.sort_by = sortObj.value;
            self.filter.sort_order = sortObj.sort_order;
            self.filter.page_num = 1;
            self.filter.page_size = 250;
            // self.filter.had_surgery = '';
            // self.filter.is_active = '';
            // self.filter.is_closed = '';
            //reset headers of grid 
            self.clxGridOptions = {
                headers: plaintiffMailingListHelper.getGridHeaders(self.filter)
            }
            getPlaintiffMailingListData(self.filter);
        }


        // Total count
        function getTotalDataCount(totalData) {
            var filtersApplied = angular.copy(totalData);
            filtersApplied.matter_id = utils.isNotEmptyVal(filtersApplied.matter_id) ? filtersApplied.matter_id.matterid : '';
            filtersApplied.plaintiff_id = utils.isNotEmptyVal(filtersApplied.plaintiff_id) ? filtersApplied.plaintiff_id.plaintiffid : '';
            filtersApplied.state = utils.isNotEmptyVal(filtersApplied.state) ? filtersApplied.state.name : '';
            filtersApplied.state = filtersApplied.state.split(' ').join('+');
            filtersApplied.page_num = 1;
            filtersApplied.page_size = page_size;
            plaintiffMailingListHelper.getDataCount(filtersApplied)
                .then(function (response) {
                    self.total = response[0].count;
                });
        }

        // sort object
        self.sorts = [{
            name: 'Plaintiff ASC',
            sort_by: 'plaintiff_ascending',
            sort_order: 'ASC',
            value: '1'
        }, {
            name: 'Plaintiff DESC',
            sort_by: 'plaintiff_descending',
            sort_order: 'DSC',
            value: 2
        }, {
            name: 'Matter Name ASC',
            sort_by: 'Matter Name ascending',
            sort_order: 'ASC',
            value: 3
        }, {
            name: 'Matter Name DESC ',
            sort_by: 'matter_name_descending ',
            sort_order: 'DSC',
            value: 4
        }];


        //sort initialization self.selectedSort = 'Matter name ASC';
        self.clickedRow = -1;
        var persistedFilter = sessionStorage.getItem('plaintiffListFilters');

        if (utils.isNotEmptyVal(persistedFilter)) { //if the filters are not empty, then try 
            try {
                self.filter = JSON.parse(persistedFilter);
                self.selectedSort = _.find(self.sorts, function (sort) { //check if which is the current selected sort
                    return sort.value === self.filter.sort_by
                }).name;
                // getTotalDataCount(self.filter);
                //reset headers of grid 
                self.clxGridOptions = {
                    headers: plaintiffMailingListHelper.getGridHeaders(self.filter)
                }
                getPlaintiffMailingListData(self.filter);
                self.tags = generateTags(self.filter);

            }

            catch (e) {
                setFilters();
            }
        }
        else {
            setFilters(); // set filters
            // getTotalDataCount(self.filter);
            //reset headers of grid 
            self.clxGridOptions = {
                headers: plaintiffMailingListHelper.getGridHeaders(self.filter)
            }
            getPlaintiffMailingListData(self.filter);
        }


        function setFilters() {
            var defaultSelected = _.find(self.sorts, function (sort) {
                return sort.value == 1 && sort.sort_order == 'ASC'
            });
            self.selectedSort = defaultSelected.name;
            self.filter = {
                page_num: 1,
                page_size: page_size,
                sort_by: defaultSelected.value,
                sort_order: defaultSelected.sort_order,
                had_surgery: '',
                is_active: '',
                is_closed: '',
                include_archived: 0
            };

        }

        /* Call back funtion for when filter tag is calncelled */
        function tagCancelled(tag) {
            switch (tag.key) {
                case 'matter': {
                    self.filter.matter_id = '';
                    break;
                }
                case 'state': {
                    self.filter.state = '';
                    break;
                }
                case 'plaintiff': {
                    self.filter.plaintiff_id = '';
                    break;
                }
                case 'had_surgery': {
                    self.filter.had_surgery = '';
                    break;
                }
                case 'is_active': {
                    self.filter.is_active = '';
                    break;
                }
                case 'is_closed': {
                    self.filter.is_closed = '';
                    if (self.filter.include_archived == '1') {
                        self.filter.include_archived = 0;
                    }
                    break;
                }
                case 'archiveMatters': {
                    self.filter.include_archived = 0;
                    break;
                }

            }
            //reset headers of grid 
            self.clxGridOptions = {
                headers: plaintiffMailingListHelper.getGridHeaders(self.filter)
            }
            self.tags = generateTags(self.filter);
            sessionStorage.setItem("plaintiffListFilters", JSON.stringify(self.filter)); //store applied filters
            getPlaintiffMailingListData(self.filter); // function to invoke helper function
            //getTotalDataCount(self.filter);
            self.filter.page_num = 1;
        }

        //Tags
        function generateTags(filtersTags) {
            var tags = [];


            if (utils.isNotEmptyVal(self.filter.matter_id)) {
                var tagObj = {

                    key: 'matter',
                    id: self.filter.matter_id.matterid,
                    value: 'Matter: ' + self.filter.matter_id.name
                };
                tags.push(tagObj);
            }

            if (utils.isNotEmptyVal(self.filter.plaintiff_id)) {
                var tagObj = {

                    key: 'plaintiff',
                    id: self.filter.plaintiff_id.plaintiffid,
                    value: 'Plaintiff: ' + self.filter.plaintiff_id.firstname
                };
                tags.push(tagObj);
            }

            if (utils.isNotEmptyVal(self.filter.state)) {
                var tagObj = {

                    key: 'state',
                    id: self.filter.state.id,
                    value: 'State: ' + self.filter.state.name
                };
                tags.push(tagObj);
            }
            if (utils.isNotEmptyVal(self.filter.had_surgery) && self.filter.had_surgery) {
                var tagObj = {

                    key: 'had_surgery',
                    value: 'Surgery Performed'
                };
                tags.push(tagObj);
            }
            if (utils.isNotEmptyVal(self.filter.is_active) && self.filter.is_active) {
                var tagObj = {

                    key: 'is_active',
                    value: 'Show Active Matters Only'
                };
                tags.push(tagObj);
            }
            if (utils.isNotEmptyVal(self.filter.is_closed) && self.filter.is_closed) {
                var tagObj = {

                    key: 'is_closed',
                    value: 'Show Closed Matters Only'
                };
                tags.push(tagObj);
            }

            if (self.filter.include_archived == 1) {
                var tagObj = {
                    key: 'archiveMatters',
                    value: 'Include Archived Matters'
                };
                tags.push(tagObj);
            }
            return tags;
        }

        //headers of grid 
        self.clxGridOptions = {
            headers: plaintiffMailingListHelper.getGridHeaders(self.filter)
        }

        /* check whether to show more and all buttons*/
        function showPaginationButtons() {

            if (!self.dataReceived) { // if data not received
                return false;
            }

            if (angular.isUndefined(self.plaintiffMailingList) || self.plaintiffMailingList.length <= 0) { //if data is empty
                return false;
            }

            if (self.filter.page_size === 'all') { // if pagesize is all
                return false;
            }

            if (self.plaintiffMailingList.length < (self.filter.page_size * self.filter.page_num)) {
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
            self.filter.page_num += 1;
            self.filter.page_size = page_size;
            self.dataReceived = false;
            plaintiffMailingListHelper.getListData(self.filter)
                .then(function (response) {

                    _.forEach(response[1].data, function (dob) {
                        processData(dob);
                    });
                    /*bug 5105: set a plantiff full name if click on more..*/
                    _.forEach(response[1].data, function (plaintiff) {
                        plaintiffMailingListHelper.setFullName(plaintiff);
                        plaintiffMailingListHelper.formatContactAddress(plaintiff);
                    });
                    // Bug 4768 : Conact data into existing grid data if click on more ...
                    self.plaintiffMailingList = self.plaintiffMailingList.concat(response[1].data);
                    self.plaintiffDataList = self.plaintiffDataList.concat(response[1].data);
                    self.dataReceived = true;
                });



        }


        /* Callback to get all report data */
        function getAll() {
            self.filter.page_size = 9999;
            getAllFlag = true;
            self.dataReceived = false;
            //reset headers of grid 
            self.clxGridOptions = {
                headers: plaintiffMailingListHelper.getGridHeaders(self.filter)
            }
            getPlaintiffMailingListData(self.filter);

        }




        //filter function
        function filterPlaintiffMailingList() {
            var modalInstance = $modal.open({
                templateUrl: 'app/report/allMatterList/filterPopUp/plaintiffMailingList/plaintiffMailingFillter.html',
                controller: 'plaintiffMailingFillter as plaintiffMailingFillter',
                backdrop: 'static',
                keyboard: false,
                size: 'sm',
                resolve: {
                    filter: function () {
                        return self.filter
                    },
                    tags: function () {
                        return self.tags;
                    }
                }
            });

            //on close of popup
            modalInstance.result.then(function (filterObj) {
                self.filter = filterObj.filter;
                self.filter.page_num = 1;
                self.filter.page_size = page_size;
                self.tags = generateTags(self.filter);
                // console.log('scope',$scope.parent);
                // getTotalDataCount(self.filter); 
                sessionStorage.setItem("plaintiffListFilters", JSON.stringify(self.filter)); //store applied filters
                //reset headers of grid 
                self.clxGridOptions = {
                    headers: plaintiffMailingListHelper.getGridHeaders(self.filter)
                }
                getPlaintiffMailingListData(self.filter); // function to invoke helper function

            }, function () {

            });

        }




    }


})(angular);


//Helper

(function (angular) {
    angular.module('cloudlex.report').
        factory('plaintiffMailingListHelper', plaintiffMailingListHelper);

    plaintiffMailingListHelper.$inject = ['$http', '$q', 'reportConstant', 'userSession', 'globalConstants', 'reportFactory'];

    function plaintiffMailingListHelper($http, $q, reportConstant, userSession, globalConstants, reportFactory) {

        return {
            getGridHeaders: getGridHeaders,
            getListData: getListData,
            getPlaintiffs: getPlaintiffs,
            getDataCount: getDataCount,
            getPrintData: getPrintData,
            getHeadersForPrint: getHeadersForPrint,
            setEdited: setEdited,
            updateContact: updateContact,
            setFullName: setFullName,
            formatContactAddress: formatContactAddress,
            exportMailinglist: exportMailinglist
        }


        function setFullName(plaintiff) {
            plaintiff.name = plaintiff.firstName + " " + plaintiff.lastName
        }


        function formatContactAddress(plaintiff) {
            if (utils.isNotEmptyVal(plaintiff) && (typeof plaintiff === 'object')) {
                plaintiff.streetCityStateZip = utils.isNotEmptyVal(plaintiff.street) ? plaintiff.street : '';
                plaintiff.streetCityStateZip += (utils.isNotEmptyVal(plaintiff.street) && (utils.isNotEmptyVal(plaintiff.city) || utils.isNotEmptyVal(plaintiff.state) || utils.isNotEmptyVal(plaintiff.zip_code))) ? ', ' : '';
                plaintiff.streetCityStateZip += utils.isNotEmptyVal(plaintiff.city) ? plaintiff.city : '';
                plaintiff.streetCityStateZip += (utils.isNotEmptyVal(plaintiff.city) && utils.isNotEmptyVal(plaintiff.state)) ? ', ' : '';
                plaintiff.streetCityStateZip += (utils.isNotEmptyVal(plaintiff.city) && utils.isEmptyVal(plaintiff.state) && utils.isNotEmptyVal(plaintiff.zip_code)) ? ', ' : '';
                plaintiff.streetCityStateZip += utils.isNotEmptyVal(plaintiff.state) ? plaintiff.state : '';
                plaintiff.streetCityStateZip += (utils.isNotEmptyVal(plaintiff.state) && utils.isNotEmptyVal(plaintiff.zip_code)) ? ', ' : '';
                plaintiff.streetCityStateZip += utils.isNotEmptyVal(plaintiff.zip_code) ? plaintiff.zip_code : '';
            }
        }

        //export

        function exportMailinglist(filter, sort, data) {
            var filterObj = getexportFiltersObj(filter, sort);
            reportFactory.downloadMailinglist(filterObj, data)
                .then(function (response) {
                    utils.downloadFile(response.data, "Plaintiff Contact Report.xlsx", response.headers("Content-Type"));
                })
        }

        function getexportFiltersObj(filter, sort) {
            var filterObj = {};

            if (filter.state) {
                filterObj['state'] = filter.state.name
            }
            else {
                filterObj['state'] = '';
            }

            if (filter.matter_id) {
                filterObj['matter_id'] = filter.matter_id.matterid;
            }
            else {
                filterObj['matter_id'] = '';
            }

            if (filter.plaintiff_id) {
                filterObj['plaintiff_id'] = filter.plaintiff_id.plaintiffid;
            }
            else {
                filterObj['plaintiff_id'] = '';
            }
            filterObj['sort_by'] = filter.sort_by;

            filterObj['sort_order'] = filter.sort_order;

            filterObj['had_surgery'] = filter.had_surgery;

            filterObj['is_active'] = filter.is_active;

            filterObj['is_closed'] = filter.is_closed;

            filterObj['include_archived'] = filter.include_archived;

            return filterObj
        }

        //update contact info on grid
        function updateContact(plaintiff, contact) {
            if (plaintiff.contactid === contact.contactid) {
                plaintiff.city = contact.city;
                plaintiff.state = contact.state;
                plaintiff.zip_code = contact.zipcode;
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
            var getExpensesDom = getExpensesDomPrint(data, filter, sort)
        }

        function getExpensesDomPrint(data, filter, sort) {
            var headers = getGridHeaders(filter);
            var headersForPrint = getHeadersForPrint(headers);
            var filtersForPrint = getFiltersObj(filter, sort);
            var printDom = getPrintExpenses(data, headersForPrint, filtersForPrint, sort);
            window.open().document.write(printDom);
        }

        // filter object for print

        // printdom
        function getPrintExpenses(data, headers, filters, sort) {
            var html = "<html><title>Plaintiff Contact Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}tbody {display:table-row-group;}</style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Plaintiff Contact Report</h1><div></div>";
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
                if (head.prop == 'phone_home') {
                    return;
                }
                if (head.prop == 'amount') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right;'>" + head.display + "</th>";
                }
                else {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + head.display + "</th>";
                }
            });
            html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right;'>" + "Phone(Cell)" + "</th>";
            html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right;'>" + "Phone(Home)" + "</th>";
            html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right;'>" + "Phone(Work)" + "</th>";
            html += '</tr>'
            angular.forEach(data, function (exp) {
                html += '<tr>';
                angular.forEach(headers, function (head) {
                    if (head.prop == 'phone_home') {
                        return;
                    }
                    exp[head.prop] = (_.isNull(exp[head.prop]) || angular.isUndefined(exp[head.prop]) || utils.isEmptyString(exp[head.prop])) ? " - " : utils.removeunwantedHTML(exp[head.prop]);
                    html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(exp[head.prop]) + "</td>";

                })
                exp.phone_cell = (_.isNull(exp.phone_cell) || angular.isUndefined(exp.phone_cell) || utils.isEmptyString(exp.phone_cell)) ? " - " : exp.phone_cell;
                exp.phone_home = (_.isNull(exp.phone_home) || angular.isUndefined(exp.phone_home) || utils.isEmptyString(exp.phone_home)) ? " - " : exp.phone_home;
                exp.phone_work = (_.isNull(exp.phone_work) || angular.isUndefined(exp.phone_work) || utils.isEmptyString(exp.phone_work)) ? " - " : exp.phone_work;
                html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + exp.phone_cell + "</td>";
                html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + exp.phone_home + "</td>";
                html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + exp.phone_work + "</td>";
                html += '</tr>'
            })
            return html;
        }
        function getFiltersObj(filter, sort) {
            var filterObj = {};

            if (filter.matter_id) {
                filterObj['Matter'] = filter.matter_id.name
            }
            else {
                filterObj['Matter'] = '';
            }

            if (filter.plaintiff_id) {
                filterObj['Plaintiff'] = filter.plaintiff_id.firstname + " " + filter.plaintiff_id.lastname;
            }
            else {
                filterObj['Plaintiff'] = '';
            }

            if (filter.state) {
                filterObj['State'] = filter.state.name
            }
            else {
                filterObj['State'] = '';
            }
            filterObj['Sort By'] = sort;
            if (filter.had_surgery == 1) {
                filterObj['Surgery Performed'] = 'Yes';
            }

            if (filter.is_active == 1) {
                filterObj['Show Active Matters Only'] = 'Yes';
            }

            if (filter.is_closed == 1) {
                filterObj['Show Closed Matters Only'] = 'Yes';
            }
            if (filter.include_archived == 1) {
                filterObj['Include Archived Matters'] = 'Yes';
            }
            return filterObj
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


        function getListData(urlParams) {
            var url = reportConstant.RESTAPI.plaintiffMailingList + "?" + utils.getReportParams(urlParams);
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                // withCredentials: true
            }).success(function (response) {
                deferred.resolve(response);
            });
            return deferred.promise;
            // return $http.get(url);

        }

        function getDataCount(param) {
            var url = reportConstant.RESTAPI.plaintiffMailingList + "?" + utils.getReportParams(param);
            return $http.get(url);

        }


        function getPlaintiffs(matter_id) {
            var url = reportConstant.RESTAPI.getPlaintiffLimited + matter_id;
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
                    dataWidth: filtr && filtr.had_surgery && filtr.had_surgery == 1 ? '8' : '12'
                }, {
                    field: [{						//DOI show on grid for US#5886 
                        prop: 'date_of_incidence',
                        printDisplay: 'Date of Incident'
                    }],
                    displayName: 'Date of Incident',
                    dataWidth: '8'
                }, {
                    field: [{
                        prop: 'first_name',
                        printDisplay: 'First Name',
                    },
                    {
                        prop: 'last_name',
                        printDisplay: 'Last Name',
                    }
                    ],
                    displayName: 'Plaintiff Name',
                    dataWidth: filtr && filtr.had_surgery && filtr.had_surgery == 1 ? '8' : '12'

                }, {
                    field: [{
                        prop: 'date_of_birth',
                        printDisplay: 'Date of Birth',
                    }],
                    displayName: 'Date of Birth',
                    dataWidth: '8'
                }, {
                    field: [{
                        prop: 'gender',   //US#6410 add Gender
                        // onClick: "plaintiffMailingCtrl.openContactCard(data.contactid)",
                        printDisplay: 'Gender',
                        // cursor:true
                    }],
                    displayName: 'Gender',
                    dataWidth: '7'
                }, {
                    field: [{
                        prop: 'streetCityStateZip',
                        printDisplay: 'Address'
                    }],
                    displayName: 'Address',
                    dataWidth: '16'
                },
                {
                    field: [{
                        prop: 'email_id',
                        printDisplay: 'Email'
                    }],
                    displayName: 'Email',
                    dataWidth: '14'
                },
                {
                    field: [
                       /* {
                            prop: 'phone_cell',
                            printDisplay: 'Phone(Cell)'
                        }, {
                            prop: 'phone_home',
                            printDisplay: 'Phone(Home)'
                        },
                        {
                            prop: 'phone_work',
                            printDisplay: 'Phone(Work)'
                        },
                         {
                            prop: 'phone_person',
                            printDisplay: 'Phone(person)'
                        }*/{
                            prop: 'phone_home',
                            html: '<div><div ng-show="data.phoneType1 == 1"><span tooltip-placement="bottom" tooltip="Cell"  class="sprite default-contactPhone-new"></span><span class="cell contactphonemerge"  ng-bind="data.phone1"></span></div>' +
                                '<div ng-show="data.phoneType1 == 2"><span tooltip-placement="bottom" tooltip="Home"  class="sprite default-contactPhone-home-new"></span><span class="cell contactphonemerge"  ng-bind="data.phone1"></span></div>' +
                                '<div ng-show="data.phoneType1 == 3"><span tooltip-placement="bottom" tooltip="Work"  class="sprite default-contactPhone-work-new"></span><span class="cell contactphonemerge"  ng-bind="data.phone1"></span></div>'
                                +
                                '<div ng-show="data.phoneType2 == 3"><span tooltip-placement="bottom" tooltip="Work"  class="sprite default-contactPhone-work-new"></span><span class="cell contactphonemerge"  ng-bind="data.phone2"></span></div>' +
                                '<div ng-show="data.phoneType2 == 1"><span tooltip-placement="bottom" tooltip="Cell"  class="sprite default-contactPhone-new"></span><span class="cell contactphonemerge"  ng-bind="data.phone2"></span></div>' +
                                '<div ng-show="data.phoneType2 == 2"><span tooltip-placement="bottom" tooltip="Home"  class="sprite default-contactPhone-home-new"></span><span class="cell contactphonemerge"  ng-bind="data.phone2"></span></div>' +

                                '</div>'
                        }

                    ],
                    displayName: 'Phone',
                    dataWidth: '23'
                }
            ];

            if (filtr && filtr.had_surgery && filtr.had_surgery == 1) {
                allHeaders.splice(1, 0, {
                    field: [{
                        prop: 'status',
                        filter: 'replaceByDash',
                        printDisplay: 'Matter Status'
                    },
                    {
                        prop: 'sub_status',
                        filter: 'replaceByDash',
                        printDisplay: 'Matter Substatus'
                    }
                    ],
                    displayName: 'Matter Status & Substatus',
                    dataWidth: '8'

                });

            }
            return allHeaders;
        } // helper      
    }  // function helper


})(angular);
