(function (angular) {

    'use strict';

    angular.module('cloudlex.report').
        controller('expenseReportCtrl', expenseReportCtrl);
    expenseReportCtrl.$inject = ['$modal', 'expenseHelper', '$filter'];

    //controller definition 
    function expenseReportCtrl($modal, expenseHelper) {
        var self = this;
        var pageSize = 250;
        var matterType = 'mymatter';
        self.getExpenses = getExpenses;
        var initExpenseLimit = 10;
        self.tagCancelled = tagCancelled;
        self.getMore = getMore;
        self.getAll = getAll;
        self.showPaginationButtons = showPaginationButtons;
        self.scrollReachedBottom = scrollReachedBottom;
        self.scrollReachedTop = scrollReachedTop;
        self.filter = {};
        self.filterExpense = filterExpense;
        self.dataReceived = false;
        self.print = print;
        self.downloadexpenses = downloadexpenses;



        // sort object
        self.sorts = [{
            name: 'Matter name ASC',
            sortBy: 'matter_name',
            sortOrder: 'ASC',

            value: 'matter_name'
        }, {
            name: 'Matter name DESC',
            sortBy: 'matter_name',
            sortOrder: 'DSC',
            value: 'matter_name desc'
        }, {
            name: 'Amount ASC',
            sortBy: 'expense_amount',
            sortOrder: 'ASC',
            value: 'expense_amount'
        }, {
            name: 'Amount DESC',
            sortBy: 'expense_amount',
            sortOrder: 'DESC',
            value: 'expense_amount desc'
        }, {
            name: 'Expense name ASC',
            sortBy: 'expense',
            sortOrder: 'ASC',
            value: 'expensename'
        }, {
            name: 'Expense Name DESC',
            sortBy: 'expense',
            sortOrder: 'DESC',
            value: 'expensename desc'
        }, {
            name: 'Date Incurred ASC',
            sortBy: 'incurred_date',
            sortOrder: 'ASC',
            value: 'incurreddate'
        }, {
            name: 'Date Incurred DESC',
            sortBy: 'incurred_date',
            sortOrder: 'DESC',
            value: 'incurreddate desc'
        }];

        //sort initialization self.selectedSort = 'Matter name ASC';
        self.clickedRow = -1;
        var persistedFilter = sessionStorage.getItem('expenseReportFilters');
        self.expenseLimit = initExpenseLimit;

        if (utils.isNotEmptyVal(persistedFilter)) { //if the filters are not empty, then try 
            try {
                self.filter = JSON.parse(persistedFilter);
                self.selectedSort = _.find(self.sorts, function (sort) { //check if which is the current selected sort
                    return sort.value === self.filter.sortBy
                }).name;

                getExpenses(self.filter);
                self.tags = generateTags(self.filter);
                //getTotalDataCount(self.filter);
            } catch (e) {
                setFilters();
            }
        } else {
            setFilters(); // set filters
            //getTotalDataCount(self.filter);
            getExpenses(self.filter);
        }
        // set the default state of sort/filter if persisted item is not found
        function setFilters() {
            var defaultSelected = _.find(self.sorts, function (sort) {
                return sort.value == 'matter_name' && sort.sortOrder == 'ASC'
            });
            self.selectedSort = defaultSelected.name;
            self.filter = {
                pageNum: 1,
                pageSize: pageSize,
                sortBy: defaultSelected.value,
                sortOrder: defaultSelected.sortOrder,
                includeArchived: 0
            };

        }

        function currencyFormat(num) {
            num = num.toString();
            return "$" + num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        }

        function getTotalDataCount(totalData) {
            var totalDataCopy = angular.copy(totalData);
            totalDataCopy.expenseTypeId = utils.isNotEmptyVal(totalDataCopy.expenseTypeId) ? totalDataCopy.expenseTypeId.LabelId : '';
            totalDataCopy.contactId = utils.isNotEmptyVal(totalData.plaintiffId) ? totalData.plaintiffId.contactid : '';
            totalDataCopy.expenseCategory = utils.isNotEmptyVal(totalDataCopy.expenseCategory) ? totalDataCopy.expenseCategory : '';
            totalDataCopy.matterids = utils.isNotEmptyVal(totalDataCopy.matterid) ? _.pluck(totalDataCopy.matterid, 'matterid') : '';
            if (utils.isNotEmptyVal(totalDataCopy.plaintiffId)) {
                totalDataCopy.is_global = totalDataCopy.plaintiffId.is_global;
            }
            delete totalDataCopy.matterid;
            delete totalDataCopy.plaintiffId;
            expenseHelper.getDataCount(totalDataCopy)
                .then(function (response) {
                    self.total = response.data[0];
                });

        }


        /* check whether to show more and all buttons*/
        function showPaginationButtons() {

            if (!self.dataReceived) { // if data not received
                return false;
            }

            if (angular.isUndefined(self.expenseDataList) || self.expenseDataList.length <= 0) { //if data is empty
                return false;
            }

            if (self.filter.pageSize === 'all') { // if pagesize is all
                return false;
            }

            if (self.expenseDataList.length < (self.filter.pageSize * self.filter.pageNum)) {
                return false
            }
            return true;
        }

        /* Callback to get more data according to pagination */
        function getMore() {
            self.filter.pageNum += 1;
            self.filter.pageSize = pageSize;
            self.dataReceived = false;
            expenseHelper.getExpensesData(self.filter)
                .then(function (response) {
                    self.allExpenses = response.data.expenses;
                    self.total = response.data.expense_count;
                    /*bug-4997 if incurred date is not in record it will be set as empty string*/
                    _.forEach(response.data.expenses, function (expense, index) {
                        response.data.expenses[index].incurred_date = (expense.incurred_date == '0') ? '' : (utils.isEmptyVal(expense.incurred_date)) ?
                            '' : moment.unix(expense.incurred_date).utc().format("MM/DD/YYYY");
                        response.data.expenses[index].dateofincidence = (expense.dateofincidence == '0') ? '-' : (utils.isEmptyVal(expense.dateofincidence)) ?
                            '' : moment.unix(expense.dateofincidence).utc().format("MM/DD/YYYY");
                        response.data.expenses[index].matter_name = response.data.expenses[index].matter.matter_name;
                        response.data.expenses[index].matter_id = response.data.expenses[index].matter.matter_id;
                        response.data.expenses[index].associatedPlaintiff = utils.isEmptyVal(expense.associated_party.associated_party_name) ? '-' : expense.associated_party.associated_party_name;
                        response.data.expenses[index].expense_type_name = response.data.expenses[index].expense_type.expense_type_name;

                        if (response.data.expenses[index].expense_amount == null) {
                            response.data.expenses[index].expense_amount = utils.isNotEmptyVal(response.data.expenses[index].expense_amount) ? currencyFormat(parseFloat(response.data.expenses[index].expense_amount).toFixed(2)) : " ";
                        } else {
                            response.data.expenses[index].expense_amount = utils.isNotEmptyVal(response.data.expenses[index].expense_amount) ? currencyFormat(parseFloat(response.data.expenses[index].expense_amount).toFixed(2)) : $filter('currency')(0, '$', 2);
                        }
                        if (response.data.expenses[index].paid_amount == null) {
                            response.data.expenses[index].paid_amount = utils.isNotEmptyVal(response.data.expenses[index].paid_amount) ? currencyFormat(parseFloat(response.data.expenses[index].paid_amount).toFixed(2)) : " ";
                        } else {
                            response.data.expenses[index].paid_amount = utils.isNotEmptyVal(response.data.expenses[index].paid_amount) ? currencyFormat(parseFloat(response.data.expenses[index].paid_amount).toFixed(2)) : $filter('currency')(0, '$', 2);
                        }
                        if (response.data.expenses[index].outstandingamount == null) {
                            response.data.expenses[index].outstandingamount = utils.isNotEmptyVal(response.data.expenses[index].outstandingamount) ? currencyFormat(parseFloat(response.data.expenses[index].outstandingamount).toFixed(2)) : " ";
                        } else {
                            response.data.expenses[index].outstandingamount = utils.isNotEmptyVal(response.data.expenses[index].outstandingamount) ? currencyFormat(parseFloat(response.data.expenses[index].outstandingamount).toFixed(2)) : $filter('currency')(0, '$', 2);
                        }

                        self.expenseDataList.push(expense);
                    })
                    self.dataReceived = true;
                });



        }


        /* Callback to get all report data */
        function getAll() {
            self.filter.pageSize = 'all';
            self.dataReceived = false;
            getExpenses(self.filter);

        }

        /* Call back funtion for when filter tag is calncelled */
        function tagCancelled(tag) {
            switch (tag.type) {
                case 'matter':
                    {
                        var indexof;
                        //filter matters of which tags are not cancelled
                        self.filter.plaintiffId = '';
                        _.forEach(self.filter.matterid, function (item, index) {
                            if (item.matterid == tag.key) {
                                indexof = index;
                            }
                        })
                        self.filter.matterid.splice(indexof, 1);
                        self.filter.pageNum = 1;
                        break;
                    }
                case 'expenseType':
                    {
                        self.filter.expenseTypeId = '';
                        self.filter.pageNum = 1;
                        break;
                    }
                //added new field
                case 'expenseCategory':
                    {
                        self.filter.expenseCategory = '';
                        self.filter.pageNum = 1;
                        break;
                    }
                case 'Associated Party':
                    {
                        self.filter.plaintiffId = '';
                        self.filter.pageNum = 1;
                        break;
                    }
                // STORY:4735 date incurred.. from and to date... START
                case 'dateRange':
                    self.filter.start = "";
                    self.filter.end = "";
                    self.filter.pageNum = 1;
                    break;
                // ... END

                case 'includeClosed':
                    self.filter.includeClosed = '';
                    self.filter.includeArchived = 0;
                    self.filter.pageNum = 1;
                    break;
                case 'archivedMatters':
                    self.filter.includeArchived = 0;
                    break;
            }
            self.tags = generateTags(self.filter);
            sessionStorage.setItem("expenseReportFilters", JSON.stringify(self.filter)); //store applied filters
            getExpenses(self.filter); // function to invoke helper function
            //getTotalDataCount(self.filter);
        }


        //on changesort selection change the value
        self.applySortByFilter = function (sortBy) {
            self.for = matterType;
            self.selectedSort = sortBy.name;
            self.filter.sortBy = sortBy.value;
            self.filter.pageNum = 1;
            self.filter.pageSize = pageSize;
            self.filter.sortOrder = sortBy.sortOrder;
            // self.filter.includeClosed = '';


            // invoke function for getting expenses bassed on filter
            getExpenses(self.filter); // function to invoke helper function
        }



        // filter popup
        function filterExpense() {
            var modalInstance = $modal.open({
                templateUrl: 'app/report/allMatterList/filterPopUp/expense/expenseFilter.html',
                windowClass: 'modalLargeDialog',
                controller: 'expenseFilterCtrl as expenseFilterCtrl',
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
                sessionStorage.setItem("expenseReportFilters", JSON.stringify(self.filter)); //store applied filters
                getExpenses(self.filter); // function to invoke helper function
                //getTotalDataCount(self.filter);

            }, function () {

            });

        }

        function generateTags(filtersTags) {
            var tags = [];


            if (utils.isNotEmptyVal(self.filter.matterid)) {
                //multiple matters object created for tag
                _.forEach(self.filter.matterid, function (currentItem) {
                    var tagObj = {

                        type: 'matter',
                        key: currentItem.matterid,
                        value: 'Matter: ' + currentItem.name
                    };
                    tags.push(tagObj);
                })

            }
            if (utils.isNotEmptyVal(self.filter.expenseCategory)) {
                var name = (self.filter.expenseCategory == 'di') ? 'Disbursable' : 'Undisbursable';
                var tagObj = {
                    type: 'expenseCategory',
                    key: self.filter.expenseCategory,
                    value: 'Expense category: ' + name
                };
                tags.push(tagObj);

            }
            if (utils.isNotEmptyVal(self.filter.expenseTypeId)) {
                var tagObj = {

                    type: 'expenseType',
                    key: self.filter.expenseTypeId.LabelId,
                    value: 'Expense Type: ' + self.filter.expenseTypeId.Name
                };
                tags.push(tagObj);
            }

            if (utils.isNotEmptyVal(self.filter.plaintiffId)) {
                var tagObj = {

                    type: 'Associated Party',
                    key: self.filter.plaintiffId.contactid,
                    value: 'Associated Party: ' + self.filter.plaintiffId.contact_name
                };
                tags.push(tagObj);
            }

            // STORY:4735 add filter tag for date incurred from and to... START
            if (utils.isNotEmptyVal(self.filter.start) && (utils.isNotEmptyVal(self.filter.end))) {
                var filterObj = {
                    type: 'dateRange',
                    key: 'dateRange',
                    value: 'Date Range from :' + moment.unix(self.filter.start).utc().format('MM/DD/YYYY') +
                        ' to: ' + moment.unix(self.filter.end).utc().format('MM/DD/YYYY')
                };
                tags.push(filterObj);
            }

            if (utils.isNotEmptyVal(self.filter.includeClosed) && self.filter.includeClosed) {
                var tagObj = {
                    type: 'includeClosed',
                    key: 'includeClosed',
                    value: 'Include Closed Matters'
                };
                tags.push(tagObj);
            }
            if (self.filter.includeArchived == 1) {
                var tagObj = {
                    type: 'archivedMatters',
                    key: 'includeArchived',
                    value: 'Include Archived Matters'
                };
                tags.push(tagObj);
            }
            // ... END

            return tags;
        }

        //headers of grid 
        self.clxGridOptions = {
            headers: expenseHelper.getGridHeaders()
        }


        function scrollReachedBottom() {
            if (self.expenseLimit <= self.total) {
                self.expenseLimit = self.expenseLimit + initExpenseLimit;
            }
        }

        function scrollReachedTop() {
            self.expenseLimit = initExpenseLimit;
        }



        function getExpenses(filters) {
            var filtersApplied = angular.copy(filters); //copy filters		
            filtersApplied.expenseTypeId = utils.isNotEmptyVal(filtersApplied.expenseTypeId) ? filtersApplied.expenseTypeId.LabelId : '';
            filtersApplied.matterids = utils.isNotEmptyVal(filtersApplied.matterid) ? _.pluck(filtersApplied.matterid, 'matterid') : '';
            filtersApplied.contactId = utils.isNotEmptyVal(filters.plaintiffId) ? filters.plaintiffId.contactid : '';
            if (utils.isNotEmptyVal(filters.plaintiffId)) {
                filtersApplied.is_global = filters.plaintiffId.is_global;
            }
            filtersApplied.expenseCategory = utils.isNotEmptyVal(filters.expenseCategory) ? filters.expenseCategory : '';
            filtersApplied.pageSize = filters.pageSize == 'all' ? 0 : pageSize;
            filtersApplied.pageNum = filters.pageSize == 'all' ? 0 : filters.pageNum;

            filtersApplied.includeArchived = filtersApplied.includeArchived;
            delete filtersApplied.matterid;
            delete filtersApplied.plaintiffId;

            expenseHelper.getExpensesData(filtersApplied)
                .then(function (response) {
                    self.allExpenses = response.data.expenses;
                    self.total = response.data.expense_count;
                    /*bug-4997 if incurred date is not in record it will be set as empty string*/
                    _.forEach(response.data.expenses, function (expense, index) {
                        response.data.expenses[index].associatedPlaintiff = utils.isEmptyVal(expense.associated_party.associated_party_name) ? '-' : expense.associated_party.associated_party_name;
                        response.data.expenses[index].incurred_date = (expense.incurred_date == '0') ? '' : (utils.isEmptyVal(expense.incurred_date)) ?
                            '' : moment.unix(expense.incurred_date).utc().format("MM/DD/YYYY");
                        response.data.expenses[index].dateofincidence = (expense.dateofincidence == '0') ? '-' : (utils.isEmptyVal(expense.dateofincidence)) ?
                            '' : moment.unix(expense.dateofincidence).utc().format("MM/DD/YYYY");
                        response.data.expenses[index].matter_name = response.data.expenses[index].matter.matter_name;
                        response.data.expenses[index].matter_id = response.data.expenses[index].matter.matter_id;
                        response.data.expenses[index].expense_type_name = response.data.expenses[index].expense_type.expense_type_name;

                    })

                    self.expenseDataList = response.data.expenses;
                    _.forEach(self.expenseDataList, function (expensedata, index) {
                        if (self.expenseDataList[index].expense_amount == null) {
                            self.expenseDataList[index].expense_amount = utils.isNotEmptyVal(expensedata.expense_amount) ? currencyFormat(parseFloat(expensedata.expense_amount).toFixed(2)) : " ";
                        } else {
                            self.expenseDataList[index].expense_amount = utils.isNotEmptyVal(expensedata.expense_amount) ? currencyFormat(parseFloat(expensedata.expense_amount).toFixed(2)) : $filter('currency')(0, '$', 2);
                        }
                        if (self.expenseDataList[index].paid_amount == null) {
                            self.expenseDataList[index].paid_amount = utils.isNotEmptyVal(expensedata.paid_amount) ? currencyFormat(parseFloat(expensedata.paid_amount).toFixed(2)) : " ";
                        } else {
                            self.expenseDataList[index].paid_amount = utils.isNotEmptyVal(expensedata.paid_amount) ? currencyFormat(parseFloat(expensedata.paid_amount).toFixed(2)) : $filter('currency')(0, '$', 2);
                        }
                        if (self.expenseDataList[index].outstandingamount == null) {
                            self.expenseDataList[index].outstandingamount = utils.isNotEmptyVal(expensedata.outstandingamount) ? currencyFormat(parseFloat(expensedata.outstandingamount).toFixed(2)) : " ";
                        } else {
                            self.expenseDataList[index].outstandingamount = utils.isNotEmptyVal(expensedata.outstandingamount) ? currencyFormat(parseFloat(expensedata.outstandingamount).toFixed(2)) : $filter('currency')(0, '$', 2);
                        }
                    })
                    self.expenseDataList.total_paid_amount = utils.isNotEmptyVal(response.data.total_paid_amount) ? currencyFormat(parseFloat(response.data.total_paid_amount).toFixed(2)) : $filter('currency')(0, '$', 2);
                    self.expenseDataList.total_expense = utils.isNotEmptyVal(response.data.total_expense) ? currencyFormat(parseFloat(response.data.total_expense).toFixed(2)) : $filter('currency')(0, '$', 2);
                    self.expenseDataList.total_outstanding_amount = utils.isNotEmptyVal(response.data.total_outstanding_amount) ? currencyFormat(parseFloat(response.data.total_outstanding_amount).toFixed(2)) : $filter('currency')(0, '$', 2);
                    //self.expenseDataList.totalExpense = utils.isEmptyVal(response.data.totalexpense) ? 0 : response.data.totalexpense;
                    //self.expenseDataList.total_paid_amount = utils.isEmptyVal(response.data.total_paid_amount) ? 0 : response.data.total_paid_amount;
                    //self.expenseDataList.total_outstanding_amount = utils.isEmptyVal(response.data.total_outstanding_amount) ? 0 : response.data.total_outstanding_amount;
                    self.dataReceived = true;
                })
        }

        //print

        function print() {
            expenseHelper.printAllExpenses(self.expenseDataList, self.filter, self.selectedSort);
        }

        //export

        function downloadexpenses() {
            expenseHelper.exportAllExpenses(self.filter, self.selectedSort);
        }
    }




})(angular);


// helper functin

(function (angular) {
    angular.module('cloudlex.report').
        factory('expenseHelper', expenseHelper);

    expenseHelper.$inject = ['$http', '$q', 'reportConstant', 'userSession', 'globalConstants', 'reportFactory', '$filter'];

    function expenseHelper($http, $q, reportConstant, userSession, globalConstants, reportFactory, $filter) {

        //Empty tag array
        var tags = [];
        return {
            getGridHeaders: getGridHeaders,
            getExpensesData: getExpensesData,
            getDataCount: getDataCount,
            getPlaintiffs: getPlaintiffs,
            printAllExpenses: printAllExpenses,
            exportAllExpenses: exportAllExpenses,
            getAssociatedParty: getAssociatedParty
        }

        //print helper
        function printAllExpenses(data, filter, sort) {
            filter['totalExpense'] = data.total_expense;
            filter['totalpaid'] = data.total_paid_amount;
            filter['totaloutstanding'] = data.total_outstanding_amount
            var getExpensesDom = getExpensesDomPrint(data, filter, sort)
        }

        //export
        function exportAllExpenses(filter, sort) {
            var FilteObj = getExportObj(filter);
            reportFactory.downloadmatterExpenses(FilteObj).then(function (response) {
                utils.downloadFile(response.data, "Report_Expense.xlsx", response.headers("Content-Type"));
            });;
        }

        // Print fun
        function getExpensesDomPrint(data, filter, sort) {
            var headers = getGridHeaders();
            var headersForPrint = getHeadersForPrint(headers);
            var filtersForPrint = getFiltersObj(filter, sort);
            var printDom = getPrintExpenses(data, headersForPrint, filtersForPrint, sort);
            window.open().document.write(printDom);
        }

        // getExportObj

        function getExportObj(filter) {
            var filterObj = {};

            if (filter.expenseTypeId) {
                filterObj['expenseTypeId'] = filter.expenseTypeId.LabelId
            } else {
                filterObj['expenseTypeId'] = '';
            }

            if (filter.matterid) {
                filterObj['matterid'] = _.pluck(filter.matterid, 'matterid');
            } else {
                filterObj['matterid'] = '';
            }
            if (filter.plaintiffId) {
                filterObj['contactId'] = filter.plaintiffId.contactid;
                filterObj['is_global'] = filter.plaintiffId.is_global;
            } else {
                filterObj['contactId'] = '';
            }
            if (filter.expenseCategory) {
                filterObj['expenseCategory'] = filter.expenseCategory;
            } else {
                filterObj['expenseCategory'] = '';
            }


            filterObj['sortBy'] = filter.sortBy;
            filterObj['start'] = (filter.start) ? moment(filter.start) : '';
            filterObj['end'] = (filter.end) ? moment(filter.end) : '';
            filterObj['includeClosed'] = (filter.includeClosed) ? filter.includeClosed : 0;
            filterObj['includeArchived'] = (filter.includeArchived) ? filter.includeArchived : 0;

            return filterObj;
        }

        // filter object for print

        function getFiltersObj(filter, sort) {
            var filterObj = {};

            if (filter.expenseTypeId) {
                filterObj['Expense Type'] = filter.expenseTypeId.Name
            } else {
                filterObj['Expense Type'] = '';
            }

            if (filter.matterid) {
                var matterName = [];
                _.forEach(filter.matterid, function (currentItem) {
                    matterName.push(currentItem.name);
                })
                var matter = matterName.toString().split(',').join(', ');
                filterObj['Matter Name'] = matter;
            } else {
                filterObj['Matter Name'] = '';
            }

            if (filter.plaintiffId) {
                filterObj['Associated Party'] = filter.plaintiffId.contact_name;
            } else {
                filterObj['Associated Party'] = '';
            }
            //added new field
            if (filter.expenseCategory) {
                var expenseCategory = (filter.expenseCategory == 'di') ? 'Disbursable' : (filter.expenseCategory == 'udi') ? 'Undisbursable' : '';
                filterObj['Expense Category'] = expenseCategory;
            } else {
                filterObj['Expense Category'] = '';
            }
            filterObj['Sort By'] = sort;
            // set from and to date for print view...
            var from = (filter.start) ? moment.unix(filter.start).utc().format('MM/DD/YYYY') : '-';
            var to = (filter.end) ? moment.unix(filter.end).utc().format('MM/DD/YYYY') : '-'
            filterObj['Date Range'] = 'from ' + from + ' to ' + to;

            if (filter.totalExpense) {
                // filterObj['Total Firm Expense'] = '$' + $filter('currency')($filter('sumOfValue')(filter.totalExpense, 'expenseamount'), '$', 2);
                filterObj['Total Firm Expense'] = filter.totalExpense;
            } else {
                filterObj['Total Firm Expense'] = '';
            }

            if (filter.totalpaid) {
                filterObj['Total Paid expense_amount'] = filter.totalpaid;
            } else {
                filterObj['Total Paid expense_amount'] = '';
            }

            if (filter.totaloutstanding) {
                filterObj['Total Outstanding expense_amount'] = filter.totaloutstanding;
            } else {
                filterObj['Total Outstanding expense_amount'] = '';
            }
            if (filter.includeClosed) {
                if (filter.includeClosed == 1) {
                    filterObj['Include Closed Matters'] = 'Yes';
                }
            } else {
                filter.includeClosed = '';
            }
            if (filter.includeArchived == 1) {
                filterObj['Include Archived Matters'] = 'Yes';
            }
            return filterObj
        }

        // printdom
        function getPrintExpenses(data, headers, filters, sort) {
            var html = "<html><title>Expense Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}tbody {display:table-row-group;}</style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Expense Report</h1><div></div>";
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
                if (head.prop == 'expense_amount' || head.prop == 'paid_amount' || head.prop == 'outstandingamount') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right;'>" + head.display + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + head.display + "</th>";
                }
            });
            html += '</tr>';


            angular.forEach(data, function (exp) {
                html += '<tr>';
                angular.forEach(headers, function (head) {
                    exp[head.prop] = (_.isNull(exp[head.prop]) || angular.isUndefined(exp[head.prop]) || utils.isEmptyString(exp[head.prop])) ? " - " : utils.removeunwantedHTML(exp[head.prop]);
                    if (head.prop == 'expense_amount' || head.prop == 'paid_amount' || head.prop == 'outstandingamount') {
                        exp[head.prop] = (exp[head.prop] == " - ") ? " - " : exp[head.prop];
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px; text-align:right'>" + exp[head.prop] + "</td>";
                    } else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + exp[head.prop] + "</td>";
                    }
                })
                html += '</tr>'
            })

            return html;

        }


        function currencyFormat(num) {
            num = num.toString();
            return "$" + num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
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

        //factory function defination block
        function getDataCount(filters) {
            var matterIds = (filters.matterids == undefined) ? [] : filters.matterids;
            delete filters.matterids;
            var url = reportConstant.RESTAPI.expensesCount + "?" + utils.getParams(filters) + '&matterIds=' + matterIds;
            return $http.get(url);
        }

        function getPlaintiffs(matterid) {
            var url = reportConstant.RESTAPI.getPlaintiffLimited + matterid + '.json';
            return $http.get(url);
        }

        function getAssociatedParty(matterid) {
            var url = reportConstant.RESTAPI.getAssociatedParty;
            url += '?matterIds=' + '[' + matterid + ']';
            return $http.get(url);
        }

        function getExpensesData(filters) {
            var matterIds = (filters.matterids == undefined) ? [] : filters.matterids;
            delete filters.matterids;
            var url = reportConstant.RESTAPI.expenses + "?" + utils.getParams(filters) + '&matterIds=' + matterIds;
            return $http.get(url);
        }

        function getGridHeaders() {
            return [

                {
                    field: [{
                        prop: 'matter_name',
                        href: { link: '#/matter-overview', paramProp: ['matter_id'] },
                        printDisplay: 'Matter Name'
                    }],
                    displayName: 'Matter name',
                    dataWidth: '13.50'
                }, {
                    field: [{
                        prop: 'expense_name',
                        printDisplay: 'Expense Name'
                    }],
                    displayName: 'Expense Name',
                    dataWidth: '11.50'

                }, {
                    field: [{
                        prop: 'associatedPlaintiff',
                        printDisplay: 'Associated Party'
                    }],
                    displayName: 'Associated Party',
                    dataWidth: '14'
                }, {
                    field: [{
                        prop: 'expense_type_name',
                        printDisplay: 'Expense Type'
                    }],
                    displayName: 'Expense Type',
                    dataWidth: '10'
                }, {
                    field: [{
                        prop: 'expense_amount',
                        //	html: '<span tooltip="{{data.expense_amount ? \'$\' : \'\'}}{{data.expense_amount | number:2}}" tooltip-append-to-body="true" tooltip-placement="bottom">{{data.expense_amount || data.expense_amount == 0 ? "$" : ""}}{{data.expense_amount | number:2}}</span>',
                        printDisplay: 'Expense amount',
                    }],
                    displayName: 'Expense amount',
                    dataWidth: '11.50'
                }, {
                    field: [{
                        prop: 'paid_amount',
                        printDisplay: 'Paid amount',
                        //	html: '<span tooltip="{{data.paid_amount ? \'$\' : \'\'}}{{data.paid_amount | number:2}}" tooltip-placement="bottom" tooltip-append-to-body="true">{{data.paid_amount || data.paid_amount == 0 ? "$" : ""}}{{data.paid_amount | number:2}}</span>'
                    }],
                    displayName: 'Paid amount',
                    dataWidth: '9.50'
                }, {
                    field: [{
                        prop: 'outstandingamount',
                        printDisplay: 'Outstanding amount',
                        //	html: '<span tooltip="{{data.outstandingamount ? \'$\' : \'\'}}{{data.outstandingamount | number:2}}" tooltip-placement="bottom" tooltip-append-to-body="true">{{data.outstandingamount || data.outstandingamount == 0 ? "$" : ""}}{{data.outstandingamount | number:2}}</span>'
                    }],
                    displayName: 'Outstanding amount',
                    dataWidth: '9.50'
                }, {
                    field: [{
                        prop: 'incurred_date',
                        printDisplay: 'Date Incurred',
                    }],
                    displayName: 'Date Incurred',
                    dataWidth: '10.50'
                },
                {
                    field: [{
                        prop: 'cheque_no',
                        printDisplay: 'Check #',
                    },
                    {
                        prop: 'bank_account',
                        printDisplay: 'Bank Details',
                    }
                    ],
                    displayName: 'Check #,   Bank Details',
                    dataWidth: "10"
                }

            ]
        }


    }



})(angular);