(function () {
    angular
        .module('cloudlex.expense')
        .controller('expenseManagerGridCtrl', expenseManagerGridCtrl);

    expenseManagerGridCtrl.$inject = ['$modal', '$stateParams', 'ExpenseListHelper', 'expenseMangerDatalayer', '$filter', 'profileDataLayer', 'contactFactory', '$scope', '$rootScope', 'masterData', 'matterDetailsHelper', '$state', 'matterDetailsService', 'allPartiesDataService', 'modalService', 'notification-service'];

    function expenseManagerGridCtrl($modal, $stateParams, ExpenseListHelper, expenseMangerDatalayer, $filter, profileDataLayer, contactFactory, $scope, $rootScope, masterData, matterDetailsHelper, $state, matterDetailsService, allPartiesDataService, modalService, notificationService) {
        var vm = this;
        vm.caseList = [];
        vm.matterId = $stateParams.matterId;
        vm.filterExpense = filterExpense;
        vm.filter = {};
        var pageSize = 250;
        vm.tagCancelled = tagCancelled;
        var persistedFilter = sessionStorage.getItem('expenseManagerFilters');
        // vm.allExpenseSelected = allExpenseSelected;
        vm.addRecordToExpeseManager = addRecordToExpeseManager;
        vm.viewMemoInfo = viewMemoInfo;
        vm.filterRetain = filterRetain;
        var filtertext = sessionStorage.getItem("expense_filtertext");
        if (filtertext && utils.isEmptyString(filtertext)) {
            vm.showSearch = true;
        } else {
            vm.showSearch = false;
        }
        vm.getDisplayDate = getDisplayDate;
        vm.allExpeseRecordSelected = allExpeseRecordSelected;
        vm.ExpenseList = [];
        vm.setSelectedView = setSelectedView;
        vm.openContactCard = openContactCard;
        vm.tags = [];
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.redirectToExpenseDeatils = redirectToExpenseDeatils;
        vm.getMore = getMore;
        vm.getAll = getAll;
        vm.showPaginationButtons = showPaginationButtons;
        vm.editRecord = editRecord;
        vm.deleteRecord = deleteRecord;
        vm.applySortByFilter = applySortByFilter;
        vm.applySortByRecordedFilter = applySortByRecordedFilter;

        // SortBy for Requested
        vm.sorts = [{ order: 'ASC', param: "requested_date_asc", name: 'Requested Date ASC', value: 'em_expense_create_date asc', tab: 'new' },
        { order: 'DESC', param: "requested_date_desc", name: 'Requested Date DESC', value: 'em_expense_create_date desc', tab: 'new' },
        //Chnage made for Sort  by plaintiff last name            
        { order: 'ASC', param: "expense_amount_asc", name: 'Expense Amount ASC ', value: 'expense_amount asc', tab: 'new' },
        { order: 'DESC', param: "expense_amount_desc", name: 'Expense Amount DESC', value: 'expense_amount desc', tab: 'new' },
        ];

        vm.sortRecorded = [{ order: 'ASC', param: "recorded_on_asc", name: 'Recorded On ASC', value: 'qb_expense_create_date asc', tab: 'recorded' },
        { order: 'DESC', param: "recorded_on_desc", name: 'Recorded On DESC', value: 'qb_expense_create_date desc', tab: 'recorded' },
        //Chnage made for Sort  by plaintiff last name            
        { order: 'ASC', param: "expense_amount_asc", name: 'Expense Amount ASC ', value: 'expense_amount asc', tab: 'recorded' },
        { order: 'DESC', param: "expense_amount_desc", name: 'Expense Amount DESC', value: 'expense_amount desc', tab: 'recorded' },
        ];

        vm.selectedSort = 'Requested Date DESC';
        vm.selectedSortRecorded = 'Recorded On DESC';


        vm.selectedView = 'new';
        if (utils.isNotEmptyVal(filtertext)) {
            // retainFilters(selectionModel, viewModel, displayStatuses);
            vm.filterText = filtertext;

            //..end 
            applySetFilters();
        } else {
            applySetFilters();
        }

        function editRecord(selectedItem) {
            vm.matterId = selectedItem[0].matter.matter_id;
            getPlaintiffs(vm.matterId);
        }

        function deleteRecord(selectedItems) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                var ids = _.pluck(selectedItems, 'expense_id');
                matterDetailsService.deleteExpenseRecord(ids)
                    .then(function () {
                        vm.clxGridOptions.selectedItems = [];
                        vm.filter.pageNum = 1;
                        vm.filter.pageSize = pageSize;
                        notificationService.success('Expense deleted successfully.');
                        getExpenseNewRecord(vm.filter);
                    }, function () {
                        //alert("unable to delete");
                        notificationService.error('An error occurred. Please try later.');
                    });
            });
        }

        function openAddExpenseModal(resolveObj) {
            var modalInstance = $modal.open({
                templateUrl: 'app/matter/matter-details/expenses/add-edit-expenses.html',
                controller: 'AddExpenseCtrl as addExpenses',
                windowClass: 'medicalIndoDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    addEditExpense: function () {
                        return resolveObj;
                    }
                }
            });
            modalInstance.result.then(function () {
                vm.clxGridOptions.selectedItems = [];
                vm.filter.pageNum = 1;
                vm.filter.pageSize = pageSize;
                vm.filter.type = vm.selectedView;
                getExpenseNewRecord(vm.filter);
            })
        }

        function getPlaintiffs(matterId) {
            matterDetailsService.getPlaintiffs(matterId)
                .then(function (response) {
                    var data = response.data.data;
                    matterDetailsService.setNamePropForPlaintiffs(data);

                    data.map(function (item) {
                        item.id = item.plaintiffid;
                        item.isPlaintiff = true;
                        item.isDefendant = false;
                        item.isOtherParty = false;
                        item.selectedPartyType = 1;
                        return item;
                    });

                    vm.plaintiffs = data;
                    plaintiffs = angular.copy(data);
                    getDefendants(vm.matterId);
                    vm.plaintiffs.unshift({ name: "All Plaintiffs", id: "all" });
                }, function (error) {
                });
        }

        function getDefendants(matterId) {
            allPartiesDataService.getDefendants(matterId)
                .then(function (response) {

                    var data = response.data;
                    matterDetailsService.setNamePropForPlaintiffs(data);

                    data.map(function (item) {
                        item.id = item.defendantid
                        item.isPlaintiff = false;
                        item.isDefendant = true;
                        item.isOtherParty = false;
                        item.selectedPartyType = 2;
                        return item;
                    });

                    vm.defendants = data;
                    defendants = angular.copy(data);
                    getOtherParties(vm.matterId);
                    vm.plaintiffDefendants = plaintiffs.concat(defendants);
                }, function () {
                });
        }

        function getOtherParties(matterId) {
            allPartiesDataService.getOtherPartiesBasic(matterId)
                .then(function (response) {
                    var data = response.data;
                    matterDetailsService.setNamePropForOtherParties(data);
                    data.map(function (item) {
                        item.id = item.mattercontactid
                        item.isPlaintiff = false;
                        item.isDefendant = false;
                        item.isOtherParty = true;
                        item.selectedPartyType = 3;
                        return item;
                    });

                    vm.otherParties = data;
                    otherParties = angular.copy(data);
                    vm.plaintiffDefendants = vm.plaintiffDefendants.concat(otherParties);
                    vm.plaintiffDefendants.unshift({ name: "All Plaintiffs", id: "allplaintiffs", });
                    vm.plaintiffDefendants.unshift({ name: "All Defendants", id: "alldefendant", });
                    vm.plaintiffDefendants.unshift({ name: "All Other Parties", id: "allotherparties", });
                    vm.plaintiffDefendants.unshift({ name: "All Parties", id: "all", });
                    var resolveObj = {
                        matterId: matterId,
                        mode: 'edit',
                        allParties: vm.plaintiffDefendants,
                        selectedItems: vm.clxGridOptions.selectedItems

                    };
                    openAddExpenseModal(resolveObj);
                }, function () {
                });
        }
        function applySetFilters() {

            //display object for managing the display
            vm.display = {
                filtered: true,
                matterListReceived: false,
                matterSelected: {}
            };

            vm.clxGridOptions = {
                selectedItems: []
            };


        }

        // set the default state of sort/filter if persisted item is not found
        function setFilters() {

            vm.filter = {
                pageNum: 1,
                pageSize: pageSize,
                sortby: 1,
                // includeArchived: 0
            };

        }


        //listen to contact card edited event
        $scope.$on('contactCardEdited', function (e, editedContact) {
            var contactObj = editedContact;
            var expenses = angular.copy(vm.ExpenseList);
            vm.ExpenseList = matterDetailsHelper.updateEditedPlaintiffName(expenses, contactObj);
            getExpenseNewRecord(vm.filter);
        });


        (function () {
            if (utils.isNotEmptyVal(persistedFilter)) { //if the filters are not empty, then try 
                try {
                    vm.filter = JSON.parse(persistedFilter);
                    vm.tags = generateTags(vm.filter);
                } catch (e) {
                    setFilters();
                }
            } else {
                setFilters(); // set filters
            }
            getFromUser();
            vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));
            var newList = sessionStorage.getItem("expense_sort_requested");
            var recordList = sessionStorage.getItem("expense_sort_recorded");
            if (newList) {
                newList = JSON.parse(sessionStorage.getItem("expense_sort_requested"));
                applySortByFilter(newList);
            } else {
                applySortByFilter(vm.sorts[1]);
            }
            if (recordList) {
                recordList = JSON.parse(sessionStorage.getItem("expense_sort_recorded"));
                sessionStorage.setItem("expense_sort_recorded", JSON.stringify(recordList));
            } else {
                sessionStorage.setItem("expense_sort_recorded", JSON.stringify(vm.sortRecorded[1]));
            }
        })();

        /* check whether to show more and all buttons*/
        function showPaginationButtons() {

            if (!vm.dataReceived) { // if data not received
                return false;
            }

            if (angular.isUndefined(vm.ExpenseList) || vm.ExpenseList.length <= 0) { //if data is empty
                return false;
            }

            if (vm.filter.pageSize === 'all') { // if pagesize is all
                return false;
            }

            if (vm.ExpenseList.length < (vm.filter.pageSize * vm.filter.pageNum)) {
                return false
            }
            return true;
        }


        /* Callback to get more data according to pagination */
        function getMore() {
            vm.filter.pageNum += 1;
            vm.filter.pageSize = pageSize;
            vm.dataReceived = false;
            expenseMangerDatalayer.getExpenseNewRecord(vm.filter)
                .then(function (data) {

                    vm.allExpenses = data.expenses;
                    vm.total = data.expense_count;
                    _.forEach(data.expenses, function (expense, index) {
                        if (expense.disbursable == 0) {
                            expense.disbursable = "No";
                        } else if (expense.disbursable == 1) {
                            expense.disbursable = "Yes";
                        }
                        expense.payment_mode = expense.payment_mode == 0 ? 2 : expense.payment_mode;
                        expense.qbAddedOn = (expense.qbAddedOn) ? moment.unix(expense.qbAddedOn).utc().format('MM/DD/YYYY') : '-';
                    })
                    _.forEach(data.expenses, function (expense, index) {
                        vm.ExpenseList.push(expense);
                    })


                    vm.expenseManagerGroup = ExpenseListHelper.groupExpenseByDate(vm.ExpenseList);
                    var dates = _.keys(vm.expenseManagerGroup);
                    dates = _.sortBy(dates, function (dt) {
                        var date = moment(dt, 'YYYY/MM/DD');
                        date = new Date(date.toDate());
                        return date;
                    })
                    vm.dates = dates;
                    vm.showNoDataForExpenseList = vm.dates.length === 0;

                    persistData();
                    vm.clxGridOptions.selectedItems = [];
                });
        }


        /* Callback to get all report data */
        function getAll() {
            vm.filter.pageSize = 'all';
            vm.dataReceived = false;
            getExpenseNewRecord(vm.filter);
        }

        //sort by filters
        function applySortByFilter(sortBy) {
            vm.selectedSort = sortBy.name;
            switch (sortBy.param) {
                case "requested_date_asc":
                    vm.filter.sortby = sortBy.value;
                    break;
                case "requested_date_desc":
                    vm.filter.sortby = sortBy.value;
                    break;
                case "expense_amount_asc":
                    vm.filter.sortby = sortBy.value;
                    break;
                case "expense_amount_desc":
                    vm.filter.sortby = sortBy.value;
                    break;
                default:
                    vm.filter.sortby = 'em_expense_create_date desc';
                    break;
            }

            vm.filter.pageNum = 1;
            sessionStorage.setItem("expense_sort_requested", JSON.stringify(sortBy));
            getExpenseNewRecord(vm.filter);
        }

        function applySortByRecordedFilter(sortBy) {
            vm.selectedSortRecorded = sortBy.name;
            switch (sortBy.param) {
                case "recorded_on_asc":
                    vm.filter.sortby = sortBy.value;
                    break;
                case "recorded_on_desc":
                    vm.filter.sortby = sortBy.value;
                    break;
                case "expense_amount_asc":
                    vm.filter.sortby = sortBy.value;
                    break;
                case "expense_amount_desc":
                    vm.filter.sortby = sortBy.value;
                    break;
                default:
                    vm.filter.sortby = 'qb_expense_create_date desc';
                    break;
            }

            vm.filter.pageNum = 1;
            sessionStorage.setItem("expense_sort_recorded", JSON.stringify(sortBy));
            getExpenseNewRecord(vm.filter);
        }

        function redirectToExpenseDeatils(data) {
            localStorage.setItem('redirectToExpenseDetails', true);
            if (utils.isNotEmptyVal(data.expense_name)) {
                $state.go("matter-detail", { 'matterId': data.matter.matter_id });
            }

        }


        function openContactCard(contact) {
            contactFactory.displayContactCard1(contact.contact_id, contact.edited, contact.contact_type);
            contact.edited = false;
        }


        function getFromUser() {
            var response = profileDataLayer.getViewProfileData();
            response.then(function (data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    //exchange_manager
                    vm.is_ExchangeManager = data[0].expense_manager;
                    if (vm.is_ExchangeManager == 1) {
                        getDropdownData();
                    }
                }
            });
        }

        //US#8330
        $scope.$on('composeEmailFromContact', function (event, data) {
            if (!(window.isDrawerOpen)) {
                vm.compose = true;
                var html = "";
                html += (vm.signature == undefined) ? '' : vm.signature;
                vm.composeEmail = html;
                $rootScope.updateComposeMailMsgBody(vm.composeEmail, '', '', '', 'contactEmail', data);
            }
        });

        //US#8330
        $rootScope.$on("callCloseComposeMail", function () {
            closeComposeMail();
        });

        //US#8330
        function closeComposeMail() {
            vm.compose = false;
        }

        //initialization start
        vm.init = function () {

        };

        function filterRetain() {
            var filtertext = vm.filterText;
            sessionStorage.setItem("expense_filtertext", filtertext);

        }



        function getDisplayDate(date) {
            var displayDate = moment(date, 'YYYY/MM/DD');
            return displayDate.format('DD MMM YYYY');
        }

        function persistData() {

            vm.filterText = "";
            var filtertext = sessionStorage.getItem("expense_filtertext");
            if (utils.isNotEmptyVal(filtertext)) {
                vm.filterText = filtertext;
            }


        }
        /**
         * view comment information for selected expense
         */
        function viewMemoInfo(selectedItems) {
            var modalInstance = $modal.open({
                templateUrl: 'app/matter/matter-details/view-memo.html',
                controller: 'viewMemoCtrl as viewMemoInfo',
                keyboard: false,
                size: 'lg',
                windowClass: 'modalMidiumDialog',
                resolve: {
                    viewMemoInfo: function () {
                        return {
                            selectedItems: selectedItems
                        };
                    }
                }
            });
        }

        vm.isExpenseRecordSelected = function (expense) {
            vm.display.matterSelected[expense.matter.matter_id] =
                ExpenseListHelper.isExpenseSelected(vm.clxGridOptions.selectedRecordItems, expense);
            return vm.display.matterSelected[expense.matter.matter_id];
        }

        vm.selectAllExpensesRecord = function (selected) {
            if (selected) {
                vm.clxGridOptions.selectedItems = angular.copy(vm.ExpenseList);
            } else {
                vm.clxGridOptions.selectedRecordItems = [];
            }
        }

        function allExpeseRecordSelected() {

            if (utils.isEmptyVal(vm.clxGridOptions)) {
                return false;
            }

            if (vm.clxGridOptions.selectedItems.length == 0 && vm.ExpenseList.length == 0) {
                return false;
            }

            return vm.clxGridOptions.selectedItems.length === vm.ExpenseList.length;
        }


        /* Call back funtion for when filter tag is calncelled */
        function tagCancelled(tag) {
            vm.filter.pageNum = 1;
            switch (tag.type) {
                case 'matter':
                    {
                        var indexof;
                        //filter matters of which tags are not cancelled
                        vm.filter.plaintiffId = '';
                        _.forEach(vm.filter.matterid, function (item, index) {
                            if (item.matterid == tag.key) {
                                indexof = index;
                            }
                        })
                        vm.filter.matterid.splice(indexof, 1);
                        vm.filter.pageNum = 1;
                        break;
                    }
                case 'expenseType':
                    {
                        vm.filter.expenseTypeId = '';
                        vm.filter.pageNum = 1;
                        break;
                    }
                //added new field
                case 'expenseCategory':
                    {
                        vm.filter.expenseCategory = '';
                        vm.filter.pageNum = 1;
                        break;
                    }
                case 'Associated Party':
                    {
                        vm.filter.plaintiffId = '';
                        vm.filter.pageNum = 1;
                        break;
                    }
                // STORY:4735 date incurred.. from and to date... START
                case 'dateRange':
                    vm.filter.start = "";
                    vm.filter.end = "";
                    vm.filter.pageNum = 1;
                    break;
                // ... END

                case 'includeClosed':
                    vm.filter.includeClosed = '';
                    vm.filter.includeArchived = 0;
                    vm.filter.pageNum = 1;
                    break;
                case 'archivedMatters':
                    vm.filter.includeArchived = 0;
                    break;
            }
            vm.tags = generateTags(vm.filter);
            sessionStorage.setItem("expenseManagerFilters", JSON.stringify(vm.filter)); //store applied filters
            getExpenseNewRecord(vm.filter);

        }

        /* Call back funtion for when filter tag is generate */
        function generateTags(filtersTags) {
            var tags = [];


            if (utils.isNotEmptyVal(vm.filter.matterid)) {
                //multiple matters object created for tag
                _.forEach(vm.filter.matterid, function (currentItem) {
                    var tagObj = {

                        type: 'matter',
                        key: currentItem.matterid,
                        value: 'Matter: ' + currentItem.name
                    };
                    tags.push(tagObj);
                })

            }
            if (utils.isNotEmptyVal(vm.filter.expenseCategory)) {
                var name = (vm.filter.expenseCategory == 'di') ? 'Disbursable' : 'Undisbursable';
                var tagObj = {
                    type: 'expenseCategory',
                    key: vm.filter.expenseCategory,
                    value: 'Expense category: ' + name
                };
                tags.push(tagObj);

            }
            if (utils.isNotEmptyVal(vm.filter.expenseTypeId)) {
                var tagObj = {

                    type: 'expenseType',
                    key: vm.filter.expenseTypeId.LabelId,
                    value: 'Expense Type: ' + vm.filter.expenseTypeId.Name
                };
                tags.push(tagObj);
            }

            if (utils.isNotEmptyVal(vm.filter.plaintiffId)) {
                var tagObj = {

                    type: 'Associated Party',
                    key: vm.filter.plaintiffId.contactid,
                    value: 'Associated Party: ' + vm.filter.plaintiffId.contact_name
                };
                tags.push(tagObj);
            }

            // STORY:4735 add filter tag for date incurred from and to... START
            if (utils.isNotEmptyVal(vm.filter.start) && (utils.isNotEmptyVal(vm.filter.end))) {
                var filterObj = {
                    type: 'dateRange',
                    key: 'dateRange',
                    value: 'Date Range from :' + moment.unix(vm.filter.start).utc().format('MM/DD/YYYY') +
                        ' to: ' + moment.unix(vm.filter.end).utc().format('MM/DD/YYYY')
                };
                tags.push(filterObj);
            }

            if (utils.isNotEmptyVal(vm.filter.includeClosed) && vm.filter.includeClosed) {
                var tagObj = {
                    type: 'includeClosed',
                    key: 'includeClosed',
                    value: 'Include Closed Matters'
                };
                tags.push(tagObj);
            }
            if (vm.filter.includeArchived == 1) {
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

        function setSelectedView(view) {
            vm.filter.pageNum = 1;
            vm.filter.pageSize = 250;
            vm.clxGridOptions.selectedItems = [];
            if (view == 'new') {
                vm.selectedView = 'new';
                vm.filter.type = vm.selectedView;
                var sortbyrequested = utils.isNotEmptyVal(sessionStorage.getItem('expense_sort_requested')) ? JSON.parse(sessionStorage.getItem('expense_sort_requested')) : vm.sorts[0];
                applySortByFilter(sortbyrequested);


            } else if (view == 'recorded') {
                vm.selectedView = 'recorded';
                vm.filter.type = vm.selectedView;
                var sortbyrecorded = utils.isNotEmptyVal(sessionStorage.getItem('expense_sort_recorded')) ? JSON.parse(sessionStorage.getItem('expense_sort_recorded')) : vm.sortRecorded[0];
                applySortByRecordedFilter(sortbyrecorded);
            }

        }

        function getExpenseNewRecord(filters) {
            vm.ExpenseList = [];
            var selectedViewData = angular.isUndefined(vm.selectedView) || utils.isEmptyString(vm.selectedView) ? 'new' : vm.selectedView;
            filters.type = selectedViewData;

            vm.selectedViewForGridShow = angular.copy(filters.type);
            var filtersApplied = angular.copy(filters); //copy filters		
            filtersApplied.expenseTypeId = utils.isNotEmptyVal(filtersApplied.expenseTypeId) ? filtersApplied.expenseTypeId.LabelId : '';
            filtersApplied.matterIds = utils.isNotEmptyVal(filtersApplied.matterid) ? _.pluck(filtersApplied.matterid, 'matterid') : '';
            filtersApplied.contactId = utils.isNotEmptyVal(filters.plaintiffId) ? filters.plaintiffId.contactid : '';
            if (utils.isNotEmptyVal(filters.plaintiffId)) {
                filtersApplied.is_global = filters.plaintiffId.is_global;
            }
            filtersApplied.expenseCategory = utils.isNotEmptyVal(filters.expenseCategory) ? filters.expenseCategory : '';
            filtersApplied.pageSize = filters.pageSize == 'all' ? 0 : pageSize;
            if (filters.pageSize == 'all') {
                filtersApplied.pageNum = 0;
            } else {
                filtersApplied.pageNum = filters.pageNum;
            }
            delete filtersApplied.matterid;
            delete filtersApplied.plaintiffId;
            delete filtersApplied.includeArchived;

            var response = expenseMangerDatalayer.getExpenseNewRecord(filtersApplied);
            response.then(function (data) {
                vm.ExpenseList = data.expenses;
                vm.isDataRecived = data.expenses.length == 0 ? false : true;
                vm.total = data.expense_count;
                // expense_count
                if (filtersApplied.type == 'new') {
                    vm.expense_count = data.expense_count;
                }
                vm.ExpenseList.total_paid_amount = utils.isNotEmptyVal(data.total_paid_amount) ? currencyFormat(parseFloat(data.total_paid_amount).toFixed(2)) : $filter('currency')(0, '$', 2);
                vm.ExpenseList.total_expense = utils.isNotEmptyVal(data.total_expense) ? currencyFormat(parseFloat(data.total_expense).toFixed(2)) : $filter('currency')(0, '$', 2);
                vm.ExpenseList.total_outstanding_amount = utils.isNotEmptyVal(data.total_outstanding_amount) ? currencyFormat(parseFloat(data.total_outstanding_amount).toFixed(2)) : $filter('currency')(0, '$', 2);
                _.forEach(data.expenses, function (expense, index) {
                    if (expense.disbursable == 0) {
                        expense.disbursableForExpense = "No";
                    } else if (expense.disbursable == 1) {
                        expense.disbursableForExpense = "Yes";
                    }
                    expense.payment_mode = expense.payment_mode == 0 ? 2 : expense.payment_mode;
                    expense.qbAddedOn = (expense.qbAddedOn) ? moment.unix(expense.qbAddedOn).utc().format('MM/DD/YYYY') : '-';
                })
                vm.expenseManagerGroup = ExpenseListHelper.groupExpenseByDate(vm.ExpenseList);
                var dates = _.keys(vm.expenseManagerGroup);
                dates = _.sortBy(dates, function (dt) {
                    var date = moment(dt, 'YYYY/MM/DD');
                    date = new Date(date.toDate());
                    return date;
                })
                vm.dates = dates;
                vm.showNoDataForExpenseList = vm.dates.length === 0;

                persistData();
                vm.clxGridOptions.selectedItems = [];

            });

        }

        function currencyFormat(num) {
            num = num.toString();
            return "$" + num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        }

        //Add record to Quickbooks
        function addRecordToExpeseManager(selectedItems) {


            /*
            Bug ID# 17314 Expense Manager- While clicking on reset button fetched Incurred Date and Memo gets blanked
            */
            sessionStorage.removeItem("memoData");
            sessionStorage.removeItem("incuredDateData");

            if (selectedItems[0].memo != null && selectedItems[0].memo != "") {
                sessionStorage.setItem("memoData", (selectedItems[0].memo));
            }

            if (selectedItems[0].incurred_date != null) {
                sessionStorage.setItem("incuredDateData", (moment.unix(selectedItems[0].incurred_date).utc().format('MM/DD/YYYY')));
            }


            if (vm.is_ExchangeManager == 0) {
                notificationService.error("The firm doesn't configure for QuickBooks account.");
                return;
            }
            var modalInstance = $modal.open({
                templateUrl: 'app/expenseManager/FilterPopup/ExpenseMnagerAddToRecord.html',
                controller: 'expenseAddToRecordCtrl as expenseAddToRecordCtrl',
                keyboard: false,
                backdrop: 'static',
                size: 'lg',
                windowClass: 'modalMidiumDialog',
                resolve: {
                    addRecordInfo: function () {
                        return {
                            selectedItems: selectedItems,
                            categoryDropdownData: vm.categoryTypeData,
                            payeeDropdownData: vm.payeeTypeData,
                            customersDropdownData: vm.customersTypeData,
                            paymentMethodDropdownData: vm.paymentMethodTypeData,
                            paymentAccountDropdownData: vm.paymentAccountTypeData

                        };
                    }

                }

            });
            //on close of popup
            modalInstance.result.then(function () {
                // vm.filter = filterObj.filter;
                vm.filter.pageNum = 1;
                vm.filter.pageSize = pageSize;
                vm.tags = generateTags(vm.filter);
                sessionStorage.setItem("expenseManagerFilters", JSON.stringify(vm.filter)); //store applied filters
                vm.clxGridOptions.selectedItems = [];
                getExpenseNewRecord(vm.filter); // function to invoke helper function

            }, function () {

            });

        }

        function getDropdownData() {
            var response = expenseMangerDatalayer.getDropdownData();
            response.then(function (data) {

                //category
                var resCategories = JSON.parse(data.category);
                resCategories = resCategories.QueryResponse.Account;
                vm.categoryDropdownList = angular.copy(resCategories);
                var resCategoriesCopy = angular.copy(resCategories);
                vm.categoryTypeData = angular.copy(resCategories);


                //customers
                var resCustomers = JSON.parse(data.customers);

                resCustomers = utils.isNotEmptyVal(resCustomers.QueryResponse.Customer) ? resCustomers.QueryResponse.Customer : [];
                vm.customersTypeData = angular.copy(resCustomers);

                //payee
                var resPayee = JSON.parse(data.payee);
                var resPayeeEmployee = JSON.parse(data.payeeEmployee);

                resPayee = utils.isNotEmptyVal(resPayee.QueryResponse.Vendor) ? resPayee.QueryResponse.Vendor : [];

                resPayeeEmployee = utils.isNotEmptyVal(resPayeeEmployee.QueryResponse.Employee) ? resPayeeEmployee.QueryResponse.Employee : [];
                _.forEach(resCustomers, function (item, index) {
                    item.DisplayName = angular.copy(item.FullyQualifiedName);
                });

                vm.payeeTypeData = angular.copy(resPayee.concat(resCustomers, resPayeeEmployee));


                // paymentMethod
                var resPaymentMethod = JSON.parse(data.paymentMethod);
                resPaymentMethod = resPaymentMethod.QueryResponse.PaymentMethod;
                vm.paymentMethodTypeData = angular.copy(resPaymentMethod);

                // paymentAccount
                var resPaymentAccount = JSON.parse(data.paymentAccount);
                resPaymentAccount = resPaymentAccount.QueryResponse.Account;
                // var mainPaymentAccount = _.filter(resPaymentAccount, function(rec) { return rec.SubAccount == false; });
                vm.paymentAccountTypeData = angular.copy(resPaymentAccount);

            });
        }


        // filter popup
        function filterExpense() {
            var modalInstance = $modal.open({
                templateUrl: 'app/expenseManager/FilterPopup/ExpenseManagerFilterPopup.html',
                windowClass: 'modalLargeDialog',
                controller: 'expenseManagerFilterCtrl as expenseManagerFilterCtrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    filter: function () {
                        return vm.filter;
                    },
                    tags: function () {
                        return vm.tags;
                    }

                }

            });


            //on close of popup
            modalInstance.result.then(function (filterObj) {
                vm.filter = filterObj.filter;
                vm.filter.pageNum = 1;
                vm.filter.pageSize = pageSize;
                vm.tags = generateTags(vm.filter);
                sessionStorage.setItem("expenseManagerFilters", JSON.stringify(vm.filter)); //store applied filters
                getExpenseNewRecord(vm.filter); // function to invoke helper function
                //getTotalDataCount(vm.filter);

            }, function () {

            });

        }
    }


})();


(function () {
    angular
        .module('cloudlex.expense')
        .controller('expenseAddToRecordCtrl', expenseAddToRecordCtrl);

    expenseAddToRecordCtrl.$inject = ['$scope', '$modalInstance', 'addRecordInfo', 'notification-service', 'expenseMangerDatalayer'];

    function expenseAddToRecordCtrl($scope, $modalInstance, addRecordInfo, notificationService, expenseMangerDatalayer) {
        var vm = this;
        // var categoryTypeData = [];
        vm.proceedToExpense = proceedToExpense;
        vm.cancel = cancel;
        vm.data = addRecordInfo;
        vm.getSubcategorys = getSubcategorys;
        vm.openCalender = openCalender; // $event date incurred function reference...
        vm.expenseId = addRecordInfo.selectedItems[0].expense_id;


        vm.categoryTypeData = addRecordInfo.categoryDropdownData;
        vm.payeeTypeData = addRecordInfo.payeeDropdownData;
        vm.customersTypeData = addRecordInfo.customersDropdownData;
        vm.paymentMethodTypeData = addRecordInfo.paymentMethodDropdownData;
        vm.paymentAccountTypeData = addRecordInfo.paymentAccountDropdownData;
        vm.filter = {};
        vm.resetFilters = resetFilters;
        vm.paymentType = [{ id: 1, name: 'CreditCard' }, { id: 2, name: 'Cash' }, { id: 3, name: 'Check' }];
        vm.isDatesValid = isDatesValid;


        (function () {
            vm.filter.dateIncurred = (utils.isEmptyVal(addRecordInfo.selectedItems[0].incurred_date)) || addRecordInfo.selectedItems[0].incurred_date == 0 ? "" : moment.unix(addRecordInfo.selectedItems[0].incurred_date).utc().format('MM/DD/YYYY');
            vm.filter.memo = utils.isNotEmptyVal(addRecordInfo.selectedItems[0]) ? addRecordInfo.selectedItems[0].memo : '';
        })();

        function isDatesValid() {
            if ($('#expenceStartDateErr').css("display") == "block") {
                return true;
            } else {
                return false;
            }
        }
        // $event bind with date incurred datepicker...
        function openCalender($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }

        // convert date timestamp to MM/DD/YYYY format...
        function getFormatteddate(epoch) {
            var formdate = new Date(epoch * 1000);
            formdate = moment(formdate).utc().format('MM/DD/YYYY');
            return formdate;
        }

        $scope.$watch(function () {
            if (utils.isNotEmptyVal(vm.filter.payee) || utils.isNotEmptyVal(vm.filter.paymentMethod) ||
                utils.isNotEmptyVal(vm.filter.expenseCategory) || utils.isNotEmptyVal(vm.filter.customers) || utils.isNotEmptyVal(vm.filter.paymentAccount) ||
                utils.isNotEmptyVal(vm.filter.dateIncurred) || utils.isNotEmptyVal(vm.filter.category) || utils.isNotEmptyVal(vm.filter.description) || utils.isNotEmptyVal(vm.filter.memo) || utils.isNotEmptyVal(vm.filter.paymentType)) {
                vm.enableApply = false;
            } else {
                vm.enableApply = true;
            }

        })

        function getSubcategorys(category) {
            vm.subcategory = null;
            var subcategory = [];
            //get selected statuses substatus                
            if (utils.isEmptyVal(category)) {
                subcategory = [];
                return;
            }
            var selectedStatusFromList = [];
            selectedStatusFromList.push(category);
            var categorys = vm.categoryDropdownList;
            var selectedStatus = [];
            _.forEach(selectedStatusFromList, function (item) {
                _.forEach(categorys, function (currentItem) {
                    if (item.Id == currentItem.Id) {
                        _.forEach(currentItem, function (currentI) {
                            selectedStatus.push(currentItem);
                        })
                    }
                })
            })
            vm.categorySubTypeData = selectedStatus;
            //return substatus;
        }

        //  US16929: Expense Manager (Quickbooks integration)
        //Function call on proceed the popup
        function proceedToExpense(data) {

            var Datacopy = angular.copy(data);
            //AS Payment type, category and payment account is necessary

            if (Datacopy && utils.isEmptyVal(Datacopy.paymentAccount)) {
                notificationService.error("Please select payment account");
                return;
            }
            if (Datacopy && utils.isEmptyVal(Datacopy.category)) {
                notificationService.error("Please select category");
                return;
            }
            if (Datacopy && utils.isEmptyVal(Datacopy.paymentType)) {
                notificationService.error("Please select payment type");
                return;
            }
            var obj = {};

            //paymentType
            obj.PaymentType = utils.isNotEmptyVal(Datacopy.paymentType) ? Datacopy.paymentType.name : '';
            //memo
            obj.PrivateNote = utils.isNotEmptyVal(Datacopy.memo) ? Datacopy.memo : '';
            Datacopy.dateIncurred = moment(Datacopy.dateIncurred).format();
            obj.TxnDate = utils.isNotEmptyVal(Datacopy.dateIncurred) ? Datacopy.dateIncurred : '';

            //payementaccount
            var PaymentAccountObj = {
                name: Datacopy.paymentAccount.FullyQualifiedName,
                value: Datacopy.paymentAccount.Id
            };

            obj.AccountRef = angular.copy(PaymentAccountObj);


            //payment Method
            if (Datacopy && utils.isNotEmptyVal(Datacopy.paymentMethod)) {
                var PaymentMethodObj = {
                    name: Datacopy.paymentMethod.Name,
                    value: Datacopy.paymentMethod.Id
                }

                obj.PaymentMethodRef = angular.copy(PaymentMethodObj);
            }


            //Payee
            if (Datacopy && utils.isNotEmptyVal(Datacopy.payee)) {
                var EntityObj = {
                    name: Datacopy.payee.DisplayName,
                    value: Datacopy.payee.Id
                }

                obj.EntityRef = angular.copy(EntityObj);
            }


            //category
            var DataList = [];
            var list = {};
            var CategoryObj = {
                name: Datacopy.category.Name,
                value: Datacopy.category.Id
            };
            list.AccountRef = angular.copy(CategoryObj);


            list.DetailType = "AccountBasedExpenseLineDetail";
            list.Amount = addRecordInfo.selectedItems[0] && utils.isNotEmptyVal(addRecordInfo.selectedItems[0].expense_amount) ? addRecordInfo.selectedItems[0].expense_amount : 0;


            list.Description = utils.isNotEmptyVal(Datacopy.description) ? Datacopy.description : '';
            list.AccountBasedExpenseLineDetail = {};
            if (Datacopy && utils.isNotEmptyVal(Datacopy.customers)) {
                var CustomerObj = {
                    name: Datacopy.customers.FullyQualifiedName,
                    value: Datacopy.customers.Id
                }
                list.CustomersRef = angular.copy(CustomerObj);
                list.AccountBasedExpenseLineDetail.CustomerRef = angular.copy(list.CustomersRef);
            }


            list.AccountBasedExpenseLineDetail.AccountRef = angular.copy(list.AccountRef);
            delete list.AccountRef;
            delete list.CustomersRef;

            DataList.push(list);
            list = {};
            list = angular.copy(obj);
            list.Line = angular.copy(DataList);


            var expenseId = angular.copy(vm.expenseId);
            var response = expenseMangerDatalayer.proceedToExpenseData(list, expenseId);
            response.then(function (data) {
                if (angular.isDefined(data)) {
                    notificationService.success('Export successful!');
                    $modalInstance.close();
                }

            }, function (error) {
                $modalInstance.dismiss();
                if (error.status == 606) {
                    error.message = JSON.parse(error.message);
                    if (error.message.Fault.Error[0].code == 6000) {
                        var rx = /Error:(.*)/g;
                        var arr = rx.exec(error.message.Fault.Error[0].Detail);
                        notificationService.error(arr[1]);
                    } else if (error.message.Fault.Error[0].code == 6430) {
                        var rx = /:(.*)/g;
                        var arr = rx.exec(error.message.Fault.Error[0].Detail);
                        notificationService.error(arr[1]);
                    } else {
                        notificationService.error(error.message.Fault.Error[0].Detail);
                    }
                }


            });

        }

        //  US16929: Expense Manager (Quickbooks integration)
        //Function call on cancel the popup
        function cancel() {
            $modalInstance.dismiss();
        }

        // Function For reset all applied filters
        function resetFilters() {

            /*Bug ID# 17314 Expense Manager- While clicking on reset button fetched Incurred Date and Memo gets blanked*/
            vm.filter.memo = sessionStorage.getItem("memoData");
            vm.filter.dateIncurred = sessionStorage.getItem("incuredDateData");
            vm.filter.payee = "";
            vm.filter.paymentMethod = "";
            vm.filter.customers = "";
            vm.filter.paymentAccount = '';
            vm.filter.category = "";
            vm.filter.description = "";
            vm.filter.paymentType = "";
        }

    }


})();
(function () {
    angular.module('cloudlex.expense')
        .factory('ExpenseListHelper', ExpenseListHelper);

    function ExpenseListHelper() {
        return {
            groupExpenseByDate: _groupExpenseByDate,
            isExpenseSelected: isExpenseSelected,

        }

        function _groupExpenseByDate(data) {
            data = data.map(function (item) {
                item.localDueDate = moment.unix(item.emAddedOn).utc().format('YYYY/MM/DD');

                return item;
            })

            var grouped = _.groupBy(data, function (item) { return item.localDueDate; });


            var dataLiat = [];
            var keys = _.keys(grouped);
            _.forEach(keys, function (item, index) {
                dataLiat.push({ date: item, events: grouped[item] });
            })
            return dataLiat;
        }


        function isExpenseSelected(expeseList, expense) {
            var ids = _.pluck(expeseList, 'matter_id');
            return ids.indexOf(expense.matter_id) > -1;
        }

    }

})();