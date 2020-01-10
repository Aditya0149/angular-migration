(function (angular) {

    'use strict';

    angular.module('cloudlex.report').
        controller('medicalRecordRequestCtrl', medicalRecordRequestCtrl);
    medicalRecordRequestCtrl.$inject = ['$modal', 'medicalRecordRequestHelper', 'reportFactory'];

    //controller definition 
    function medicalRecordRequestCtrl($modal, medicalRecordRequestHelper, reportFactory) {
        var self = this;
        self.filter = {};
        self.getMore = getMore;
        self.getAll = getAll;
        self.filtermedicalRecordRequestList = filtermedicalRecordRequestList;
        self.getMatterValuationListData = getMatterValuationListData;
        self.applySortByFilter = applySortByFilter;
        self.tagCancelled = tagCancelled;
        self.selectedSort = 'Matter Name ASC';
        self.showPaginationButtons = showPaginationButtons;
        self.scrollReachedBottom = scrollReachedBottom;
        self.scrollReachedTop = scrollReachedTop;
        self.dataReceived = false;
        self.setFilters = setFilters;
        self.print = print;
        self.downloadmedicalRecordRequestList = downloadmedicalRecordRequestList;
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
                    sortOrder: 'ASC',
                    value: '0'
                }, {
                    name: 'Matter name DESC',
                    sortby: 'matter_name',
                    sortOrder: 'DESC',
                    value: '1'
                }, {
                    name: 'Start Date of Service ASC',
                    sortby: 'start_date',
                    sortOrder: 'ASC',
                    value: '2'
                }, {
                    name: 'Start Date of Service DESC',
                    sortby: 'start_date',
                    sortOrder: 'DESC',
                    value: '3'
                }, {
                    name: 'Physician ASC',
                    sortby: 'physician',
                    sortOrder: 'ASC',
                    value: '4'
                }, {
                    name: 'Physician DESC',
                    sortby: 'physician',
                    sortOrder: 'DESC',
                    value: '5'
                }, {
                        name: 'Service Provider ASC',
                    sortby: 'service_provider',
                    sortOrder: 'ASC',
                    value: '6'
                }, {
                        name: 'Service Provider DESC',
                    sortby: 'service_provider',
                    sortOrder: 'DESC',
                    value: '7'
                }];


                //sort initialization self.selectedSort = 'Matter name ASC';
                self.clickedRow = -1;
                var persistedFilter = sessionStorage.getItem('medicalRecordRequestFilters');

                if (utils.isNotEmptyVal(persistedFilter)) { //if the filters are not empty, then try 
                    try {
                        self.filter = JSON.parse(persistedFilter);
                        self.selectedSort = _.find(self.sorts, function (sort) { //check if which is the current selected sort
                            return sort.value === self.filter.sortBy
                        }).name;
                        //reset headers of grid 
                        self.clxGridOptions = {
                            headers: medicalRecordRequestHelper.getGridHeaders(self.filter)
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
                        headers: medicalRecordRequestHelper.getGridHeaders(self.filter)
                    }
                    getMatterValuationListData(self.filter);
                }
            }, function (reason) { });
        }

        //print
        function print() {
            medicalRecordRequestHelper.getPrintData(angular.copy(self.plaintiffMailingList), angular.copy(self.filter), angular.copy(self.selectedSort));

        }

        //export
        function downloadmedicalRecordRequestList() {
            self.filter.pageNum = self.filter.pageNum == 1 ? self.filter.pageNum : 1;
            medicalRecordRequestHelper.exportMedicalRecordRequestList(self.filter, self.selectedSort, self.plaintiffMailingList);
        }


        // get data
        function getMatterValuationListData(filter) {
            sessionStorage.setItem("medicalRecordRequestFilters", JSON.stringify(filter)); //store applied filters
            var filtersApplied = angular.copy(filter);

            delete filtersApplied.attorneyCopy;
            delete filtersApplied.paralegalCopy;
            delete filtersApplied.serviceProviderCopy;
            delete filtersApplied.physicianCopy;
            delete filtersApplied.document_linked;
            delete filtersApplied.dorEnd;
            delete filtersApplied.provider;
            delete filtersApplied.physician;
            delete filtersApplied.att;
            delete filtersApplied.paralegal;
            
            // STORY:4768 check whether pagesize is set to be all or not ...
            if (getAllFlag == false) {
                filtersApplied.pageSize = pageSize;
                self.filter.pageSize = pageSize;
                filtersApplied.pageNum = 1;
            }

            medicalRecordRequestHelper.getListData(filtersApplied).
                then(function (response) {
                    self.total = response.data.count;
                    self.plaintiffMailingList = response.data.medicalInformations;
                    self.plaintiffDataList = response.data.medicalInformations;
                    self.dataReceived = true;
                    var abc = response.data.medicalInformations;
                    _.forEach(response.data.medicalInformations, function (expense, index) {
                        if (expense.associated_party) {
                            response.data.medicalInformations[index].associated_party = utils.isEmptyVal(expense.associated_party.associated_party_name) ? '-' : expense.associated_party.associated_party_name;
                        }
                        else {
                            response.data.medicalInformations[index].associated_party = '-';
                        }
                        response.data.medicalInformations[index].matter_name = response.data.medicalInformations[index].matter.matter_name;
                        response.data.medicalInformations[index].matterid = response.data.medicalInformations[index].matter.matter_id;
                        response.data.medicalInformations[index].file_number = response.data.medicalInformations[index].matter.file_number;
                        response.data.medicalInformations[index].status_name = response.data.medicalInformations[index].matter.status;
                        if (expense.physician) {
                            response.data.medicalInformations[index].physician = utils.isEmptyVal(expense.physician.contact_name) ? '-' : expense.physician.contact_name;
                        }
                        else {
                            response.data.medicalInformations[index].physician = '-';
                        }
                        if (expense.service_provider) {
                            response.data.medicalInformations[index].service_provider = utils.isEmptyVal(expense.service_provider.contact_name) ? '-' : expense.service_provider.contact_name;
                        }
                        else {
                            response.data.medicalInformations[index].service_provider = '-';
                        }
                    })
                    _.forEach(abc, function (singleData) {
                        singleData.service_start_date = (utils.isEmptyVal(singleData.service_start_date) || singleData.service_start_date == 0) ? "" : moment.unix(singleData.service_start_date).utc().format('MM/DD/YYYY');
                        singleData.service_end_date = (utils.isEmptyVal(singleData.service_end_date) || singleData.service_end_date == 0) ? "" : moment.unix(singleData.service_end_date).utc().format('MM/DD/YYYY');
                        singleData.date_requested = (utils.isEmptyVal(singleData.date_requested) || singleData.date_requested == 0) ? "" : moment.unix(singleData.date_requested).utc().format('MM/DD/YYYY');
                        //   self.plaintiffMailingList.push(singleData);
                    });
                });
        }


        //Get sort
        function applySortByFilter(sortObj) {
            self.selectedSort = sortObj.name;
            self.filter.sortBy = sortObj.value;
            self.filter.sortOrder = sortObj.sortOrder;
            self.filter.pageNum = 1;
            self.filter.pageSize = 250;
            //reset headers of grid 
            self.clxGridOptions = {
                headers: medicalRecordRequestHelper.getGridHeaders(self.filter)
            }
            getMatterValuationListData(self.filter);
        }


        function setFilters() {
            var defaultSelected = _.find(self.sorts, function (sort) {
                return sort.value == 0 && sort.sortOrder == 'ASC'
            });
            self.selectedSort = defaultSelected.name;
            self.filter = {
                pageNum: 1,
                pageSize: pageSize,
                sortBy: defaultSelected.value,
                sortOrder: defaultSelected.sortOrder
            };

        }


        /* Call back funtion for when filter tag is calncelled */
        function tagCancelled(tag) {
            switch (tag.type) {

                case 'dateRange': {
                    self.filter.start = "";
                    self.filter.end = "";
                    // sessionStorage.setItem("expenseReportFilters", JSON.stringify(self.filter)); //store applied filters
                    // getExpenses(self.filter); // function to invoke helper function
                    // getTotalDataCount(self.filter);
                    break;
                }

                case 'documentlinked': {
                    self.filter.linkedDocument = '';
                    break;
                }

                case 'providerId': {
                    self.filter.providerId = '';
                    self.filter.serviceProviderCopy = '';
                    break;
                }
                case 'physician': {
                    self.filter.physicianId = '';
                    self.filter.physicianCopy = '';
                    break;
                }
                case 'Attorney': {
                    self.filter.attorneyId = '';
                    self.filter.attorneyCopy = '';
                    break;
                }
                case 'Paralegal': {
                    self.filter.paralegalId = '';
                    self.filter.paralegalCopy = '';
                    break;
                }

            }
            //reset headers of grid 
            self.clxGridOptions = {
                headers: medicalRecordRequestHelper.getGridHeaders(self.filter)
            }
            sessionStorage.setItem("medicalRecordRequestFilters", JSON.stringify(self.filter)); //store applied filters
            //reset headers of grid 
            self.clxGridOptions = {
                headers: medicalRecordRequestHelper.getGridHeaders(self.filter)
            }
            getMatterValuationListData(self.filter); // function to invoke helper function
            self.filter.pageNum = 1;
        }

        //Tags
        function generateTags(filtersTags, userList) {
            var tags = [];
            var attorney = {};
            var paralegal = {};
            var providerId = {};
            var physician = {}

            //  filter tag for date requested from and to... START
            if (utils.isNotEmptyVal(self.filter.start) && (utils.isNotEmptyVal(self.filter.end))) {
                var filterObj = {
                    type: 'dateRange',
                    key: 'dateRange',
                    value: 'Date Requested from: ' + moment.unix(self.filter.start).utc().format('MM/DD/YYYY') +
                        ' to: ' + moment.unix(self.filter.end).utc().format('MM/DD/YYYY')
                };
                tags.push(filterObj);
            }
            // ... END

            if (utils.isNotEmptyVal(self.filter.linkedDocument)) {
                var array = [];
                _.forEach(self.filter.linkedDocument, function (data) {
                    if (data == 1) {
                        array.push({ label: "Yes", value: "1" });
                    } else if (data == 0) {
                        array.push({ label: "No", value: "0" });
                    }
                    var abc = [];
                });
                var linkedarray = _.pluck(array, 'label');
                var linkedarraylist = linkedarray.toString();

                var tagObj = {
                    type: 'documentlinked',
                    key: 'documentlinked',
                    value: 'Document Linked: ' + linkedarraylist,
                };
                tags.push(tagObj);
            }


            if (utils.isNotEmptyVal(self.filter.physician)) {
                var mFilter = {};
                mFilter.type = 'physician',
                    mFilter.value = 'Physician : ' + self.filter.physicianCopy.name;
                mFilter.key = 'physician';
                tags.push(mFilter);
            }

            if (utils.isNotEmptyVal(self.filter.providerId)) {
                var mFilter = {};
                mFilter.type = 'providerId',
                    mFilter.value = 'Service provider : ' + self.filter.serviceProviderCopy.name;
                mFilter.key = 'providerId';
                tags.push(mFilter);
            }



            // if (utils.isNotEmptyVal(filtersTags.physician) && filtersTags.physician != '') {
            //     _.forEach(userList, function (data) {
            //         if (angular.isDefined(data.physicianlist)) {
            //             _.forEach(data.physicianlist, function (data) {
            //                 if (filtersTags.physician == data.uid) {
            //                     physicianlist.key = data.uid;
            //                     physicianlist.type = "Physician";
            //                     physicianlist.value = "Physician: " + data.name;
            //                     tags.push(physicianlist);
            //                 }
            //             });
            //         }
            //     });
            // }

            if (utils.isNotEmptyVal(filtersTags.attorneyId) && filtersTags.attorneyId != '') {
                _.forEach(userList, function (data) {
                    if (angular.isDefined(data.attorny)) {
                        _.forEach(data.attorny, function (data) {
                            if (filtersTags.attorneyId == data.uid) {
                                attorney.key = data.uid;
                                attorney.type = "Attorney";
                                attorney.value = "Attorney: " + data.name;
                                tags.push(attorney);
                            }
                        });
                    }
                });
            }


            if (utils.isNotEmptyVal(filtersTags.paralegal) && filtersTags.paralegal != '') {
                _.forEach(userList, function (data) {
                    if (angular.isDefined(data.paralegal)) {
                        _.forEach(data.paralegal, function (data) {
                            if (filtersTags.paralegalId == data.uid) {
                                paralegal.key = data.uid;
                                paralegal.type = "Paralegal";
                                paralegal.value = "Paralegal: " + data.name;
                                tags.push(paralegal);
                            }
                        });
                    }
                });
            }

            return tags;
        }

        function currencyFormat(num) {
            num = num.toString();
            return "$" + num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        }

        //headers of grid 
        self.clxGridOptions = {
            headers: medicalRecordRequestHelper.getGridHeaders(self.filter)
        }



        /* check whether to show more and all buttons*/
        function showPaginationButtons() {

            if (!self.dataReceived) { // if data not received
                return false;
            }

            if (angular.isUndefined(self.plaintiffMailingList) || self.plaintiffMailingList.length <= 0) { //if data is empty
                return false;
            }

            if (self.filter.pageSize === '') { // if pagesize is all
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
            medicalRecordRequestHelper.getListData(self.filter)
                .then(function (response) {

                    self.total = response.data.count;
                    self.plaintiffMailingList = self.plaintiffMailingList.concat(response.data.medicalInformations);
                    self.plaintiffDataList = self.plaintiffDataList.concat(response.data.medicalInformations);
                    self.dataReceived = true;
                    var abc = response.data.medicalInformations;
                    _.forEach(response.data.medicalInformations, function (expense, index) {
                        if (expense.associated_party) {
                            response.data.medicalInformations[index].associated_party = utils.isEmptyVal(expense.associated_party.associated_party_name) ? '-' : expense.associated_party.associated_party_name;
                        }
                        else {
                            response.data.medicalInformations[index].associated_party = '-';
                        }
                        response.data.medicalInformations[index].matter_name = response.data.medicalInformations[index].matter.matter_name;
                        response.data.medicalInformations[index].matterid = response.data.medicalInformations[index].matter.matter_id;
                        response.data.medicalInformations[index].file_number = response.data.medicalInformations[index].matter.file_number;
                        response.data.medicalInformations[index].status_name = response.data.medicalInformations[index].matter.status;
                        if (expense.physician) {
                            response.data.medicalInformations[index].physician = utils.isEmptyVal(expense.physician.contact_name) ? '-' : expense.physician.contact_name;
                        }
                        else {
                            response.data.medicalInformations[index].physician = '-';
                        }
                        if (expense.service_provider) {
                            response.data.medicalInformations[index].service_provider = utils.isEmptyVal(expense.service_provider.contact_name) ? '-' : expense.service_provider.contact_name;
                        }
                        else {
                            response.data.medicalInformations[index].service_provider = '-';
                        }
                    })
                    _.forEach(abc, function (singleData) {
                        singleData.service_start_date = (utils.isEmptyVal(singleData.service_start_date) || singleData.service_start_date == 0) ? "" : moment.unix(singleData.service_start_date).utc().format('MM/DD/YYYY');
                        singleData.service_end_date = (utils.isEmptyVal(singleData.service_end_date) || singleData.service_end_date == 0) ? "" : moment.unix(singleData.service_end_date).utc().format('MM/DD/YYYY');
                        singleData.date_requested = (utils.isEmptyVal(singleData.date_requested) || singleData.date_requested == 0) ? "" : moment.unix(singleData.date_requested).utc().format('MM/DD/YYYY');
                        //   self.plaintiffMailingList.push(singleData);
                    });
                });



        }


        /* Callback to get all report data */
        function getAll() {
            self.filter.pageSize = '';
            getAllFlag = true;
            self.dataReceived = false;
            //reset headers of grid 
            self.clxGridOptions = {
                headers: medicalRecordRequestHelper.getGridHeaders(self.filter)
            }
            self.filter.pageNum = '';
            getMatterValuationListData(self.filter);

        }




        //filter function
        function filtermedicalRecordRequestList() {


            var modalInstance = $modal.open({
                templateUrl: 'app/report/allMatterList/filterPopUp/medicalRecordRequest/medicalRecordRequestFilter.html',
                controller: 'medicalRecordRequestFillter as medicalRecordRequestFillter',
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
                // self.filter.linkedDocument =  _.pluck(filterObj.filter.linkedDocument,'value');
                // console.log('scope',$scope.parent);
                sessionStorage.setItem("medicalRecordRequestFilters", JSON.stringify(self.filter)); //store applied filters
                //reset headers of grid 
                self.clxGridOptions = {
                    headers: medicalRecordRequestHelper.getGridHeaders(self.filter)
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
        factory('medicalRecordRequestHelper', medicalRecordRequestHelper);

    medicalRecordRequestHelper.$inject = ['$http', 'reportConstant', 'globalConstants', 'reportFactory', '$filter'];

    function medicalRecordRequestHelper($http, reportConstant, globalConstants, reportFactory, $filter) {

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
            exportMedicalRecordRequestList: exportMedicalRecordRequestList
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

        function exportMedicalRecordRequestList(filter, sort, data) {
            var filterObj = angular.copy(filter);

            filterObj.providerId = angular.isUndefined(filterObj.providerId) ? '' : filterObj.providerId;
            filterObj.paralegalId = angular.isUndefined(filterObj.paralegalId) ? '' : filterObj.paralegalId;
            filterObj.attorneyId = angular.isUndefined(filterObj.attorneyId) ? '' : filterObj.attorneyId;
            filterObj.physicianId = angular.isUndefined(filterObj.physicianId) ? '' : filterObj.physicianId;
            filterObj.linkedDocument = angular.isUndefined(filterObj.linkedDocument) ? '' : filterObj.linkedDocument;
            filterObj.start = angular.isUndefined(filterObj.start) ? '' : filterObj.start;
            filterObj.end = angular.isUndefined(filterObj.end) ? '' : filterObj.end;
            filterObj.pageSize = 1000;
            delete filterObj.attorneyCopy;
            delete filterObj.paralegalCopy;
            delete filterObj.serviceProviderCopy;
            delete filterObj.physicianCopy;
            delete filterObj.document_linked;
            delete filterObj.dorEnd;
            delete filterObj.provider;
            delete filterObj.physician;
            delete filterObj.att;
            delete filterObj.paralegal;


            reportFactory.downloadMedicalRecordRequest(filterObj, data).then(function (response) {
                utils.downloadFile(response.data, "Medical_Record_Request_Report.xlsx", response.headers("Content-Type"));
            });;;
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

            var from = (filter.start) ? moment.unix(filter.start).utc().format('MM/DD/YYYY') : '-';
            var to = (filter.end) ? moment.unix(filter.end).utc().format('MM/DD/YYYY') : '-'
            filterObj['Date Requested'] = 'from ' + from + ' to ' + to;

            var array = [];
            _.forEach(filter.linkedDocument, function (data) {
                if (data == 1) {
                    array.push({ label: "Yes", value: "1" });
                } else if (data == 0) {
                    array.push({ label: "No", value: "0" });
                }
                var abc = [];
            });
            var arraylist = _.pluck(array, 'label');
            var arrayliststring = arraylist.toString();

            if (filter.linkedDocument) {
                filterObj['Document Linked'] = utils.isNotEmptyVal(arrayliststring) ? arrayliststring : '';

            } else {
                filterObj['Document Linked'] = '';
            }

            if (filter.providerId) {
                filterObj['Service provider'] = utils.isNotEmptyVal(filter.serviceProviderCopy) ? filter.serviceProviderCopy.name : '';

            } else {
                filterObj['Service provider'] = '';
            }
            if (filter.physician) {
                filterObj['Physician'] = utils.isNotEmptyVal(filter.physicianCopy) ? filter.physicianCopy.name : '';

            } else {
                filterObj['Physician'] = '';
            }

            if (filter.attorneyId) {
                filterObj['Attorney'] = utils.isNotEmptyVal(filter.attorneyCopy) ? filter.attorneyCopy.name : '';

            } else {
                filterObj['Attorney'] = '';
            }
            if (filter.paralegal) {
                filterObj['Paralegal'] = utils.isNotEmptyVal(filter.paralegalCopy) ? filter.paralegalCopy.name : '';

            } else {
                filterObj['Paralegal'] = '';
            }



            // if (filter.lowlimit || filter.maxlimit) {
            //     var upperLimit = utils.isNotEmptyVal(filter.maxlimit) ? currencyFormat(filter.maxlimit) : '';
            //     var lowerLimit = utils.isNotEmptyVal(filter.lowlimit) ? currencyFormat(filter.lowlimit) : '';
            //     if ((utils.isEmptyVal(upperLimit) && utils.isEmptyVal(lowerLimit))) {
            //         policy = "";
            //     } else {
            //         upperLimit = utils.isNotEmptyVal(upperLimit) ? upperLimit : "-";
            //         lowerLimit = utils.isNotEmptyVal(lowerLimit) ? lowerLimit : "-";
            //         policy = lowerLimit + '/' + upperLimit;
            //     }

            //     filterObj['Matter Valuation'] = policy;
            // } else {
            //     filterObj['Matter Valuation'] = '';
            // }

            if (sort) {
                filterObj['Sort By'] = utils.isNotEmptyVal(sort) ? sort : '';

            } else {
                filterObj['Sort By'] = '';
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
            var html = "<html><title>Medical Record Request Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}tbody {display:table-row-group;}</style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Medical Record Request Report</h1><div></div>";
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
                    exp[head.prop] = (_.isNull(exp[head.prop]) || angular.isUndefined(exp[head.prop]) || utils.isEmptyString(exp[head.prop])) ? " - " : utils.removeunwantedHTML(exp[head.prop]);
                    if (head.prop == 'expected_value' || head.prop == 'offer' || head.prop == 'demand') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px; text-align:right'>" + $filter('currency')(exp[head.prop], '$', 2) + "</td>";
                    }
                    else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + exp[head.prop] + "</td>";
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
            urlParams.tz = utils.getTimezone();
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

            //  var abc = [];
            // urlParams.linkedDocument = urlParams.linkedDocument == "Yes" ? "1" : "0"; 
            var url = reportConstant.RESTAPI.getMedicalRecordRequest + "?" + getParams(urlParams);
            //var url = "https://demoapi.cloudlex.net/reports/matter_valuation_report.json?&pageNum=1&pageSize=250&attorneyId=&paralegalId=&sortby=&lowlimit=200&maxlimit=100000";
            return $http.get(url);

        }

        function getPlaintiffs(matterId) {
            var url = reportConstant.RESTAPI.getPlaintiffLimited + matterId;
            return $http.get(url);
        }

        function getGridHeaders(filtr) {
            var allHeaders = [
                {
                    field: [
                        {
                            prop: 'matter_name',
                            href: { link: '#/matter-overview', paramProp: ['matterid'] },
                            printDisplay: 'Matter Name'
                        }, {
                            prop: 'file_number',
                            label: 'File#',
                            printDisplay: 'File Number'
                        }],
                    displayName: 'Matter Name & File#',
                    dataWidth: '12'
                }, {
                    field: [{
                        prop: 'status_name',
                        printDisplay: 'Status'
                    }
                    ],
                    displayName: 'Status',
                    dataWidth: '8'

                }, {
                    field: [{
                        prop: 'date_requested',
                        printDisplay: 'Date Requested'
                    }],
                    displayName: 'Date Requested',
                    dataWidth: '10'
                }, {
                    field: [{
                        prop: 'associated_party',
                        printDisplay: 'Associated Party'
                    }],
                    displayName: 'Associated Party',
                    dataWidth: '12'
                }, {
                    field: [{
                        prop: 'physician',
                        printDisplay: 'Physician'
                    }],
                    displayName: 'Physician',
                    dataWidth: '12'
                }, {
                    field: [{
                        prop: 'service_provider',
                        // html: '<span tooltip="{{ (data.expected_value) ? (data.expected_value | currency) : (data.expected_value) }}" tooltip-append-to-body="true" tooltip-placement="bottom">{{ (data.expected_value) ? (data.expected_value | currency) : (data.expected_value) }}</span>',
                        printDisplay: 'Service provider',
                    }],
                    displayName: 'Service provider',
                    dataWidth: '10'
                }, {
                    field: [{
                        prop: 'treatment_type',
                        // html: '<span tooltip="{{ (data.offer) ? (data.offer | currency) : (data.offer) }}" tooltip-append-to-body="true" tooltip-placement="bottom">{{ (data.offer) ? (data.offer | currency) : (data.offer) }}</span>',
                        printDisplay: 'Treatment Type',
                    }],
                    displayName: 'Treatment Type',
                    dataWidth: '8'
                }, {
                    field: [{
                        prop: 'service_start_date',
                        // html: '<span tooltip="{{ (data.demand) ? (data.demand | currency) : (data.demand) }}" tooltip-append-to-body="true" tooltip-placement="bottom">{{ (data.demand) ? (data.demand | currency) : (data.demand) }}</span>',
                        printDisplay: 'Start Date of Service',
                    }],
                    displayName: 'Start Date of Service',
                    dataWidth: '8'
                }, {
                    field: [{
                        prop: 'service_end_date',
                        // html: '<span tooltip="{{ (data.demand) ? (data.demand | currency) : (data.demand) }}" tooltip-append-to-body="true" tooltip-placement="bottom">{{ (data.demand) ? (data.demand | currency) : (data.demand) }}</span>',
                        printDisplay: 'End Date of Service',
                    }],
                    displayName: 'End Date of Service',
                    dataWidth: '8'
                }, {
                    field: [{
                        prop: 'linked_documents',
                        // html: '<span tooltip="{{ (data.demand) ? (data.demand | currency) : (data.demand) }}" tooltip-append-to-body="true" tooltip-placement="bottom">{{ (data.demand) ? (data.demand | currency) : (data.demand) }}</span>',
                        printDisplay: 'Linked Documents',
                    }],
                    displayName: 'Linked Documents',
                    dataWidth: '10'
                }
            ];

            return allHeaders;
        } // helper      
    }  // function helper


})(angular);