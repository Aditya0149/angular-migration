(function () {
    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('ExpensesCtrl', ExpensesCtrl);

    ExpensesCtrl.$inject = ['$scope', '$rootScope', '$stateParams', '$modal', 'expensesHelper', 'matterDetailsHelper', 'matterDetailsService',
        'notification-service', 'modalService', 'contactFactory', 'masterData', 'mailboxDataService', 'matterFactory', '$timeout'
    ];

    function ExpensesCtrl($scope, $rootScope, $stateParams, $modal, expensesHelper, matterDetailsHelper, matterDetailsService,
        notificationService, modalService, contactFactory, masterData, mailboxDataService, matterFactory, $timeout) {
        var vm = this;
        var matterId = $stateParams.matterId;

        vm.expensesList = [];
        vm.display = { refreshGrid: false };

        vm.openContactCard = openContactCard;
        vm.filterExpenses = filterExpenses;
        vm.addExpensesInfo = addExpensesInfo;
        vm.deleteExpense = deleteExpenses;

        vm.selectAllUsers = selectAllUsers;
        vm.allUsersSelected = allUsersSelected;
        vm.isUserSelected = isUserSelected;
        vm.expensesList = {};
        vm.expensesList.expenses = [];

        vm.downloadExpense = downloadExpense;
        vm.downloadAPExpense = downloadAPExpense;
        vm.printExpense = printExpense;
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.viewMedicalInfo = viewMedicalInfo;
        vm.linkUploadDoc = linkUploadDoc;
        vm.unlinkDocument = unlinkDocument;
        vm.expenseTotal = {};
        //  US16929: Expense Manager (Quickbooks integration)
        vm.exportToExpenseManager = exportToExpenseManager;
        // vm.isMovedToEM = (addEditExpense.selectedItems && addEditExpense.selectedItems[0].isEditExpense == 1) ? true : false;


        function openContactCard(contact) {
            contactFactory.displayContactCard1(contact.contact_id, contact.edited, contact.contact_type);
            contact.edited = false;
        }



        //listen to contact card edited event
        $scope.$on('contactCardEdited', function (e, editedContact) {
            var contactObj = editedContact;
            var expenses = angular.copy(vm.expensesList.expenses);
            vm.expensesList.expenses = matterDetailsHelper.updateEditedPlaintiffName(expenses, contactObj);
        });

        //  US16929: Expense Manager (Quickbooks integration) 
        function exportToExpenseManager(data) {

            var array = _.some(data, function (item) {
                return item.emKey == 1;
            })
            if (array) {
                notificationService.error("The selected expense has already been exported.");
                return;
            } else {
                var modalInstance = $modal.open({
                    templateUrl: 'app/matter/matter-details/expenses/exportToExpenseManager.html',
                    controller: 'expenseManagerCtrl as exportExpenses',
                    windowClass: 'cal-pop-up',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        expenseInfo: function () {
                            return {
                                data: data
                            };
                        }
                    }
                });

                modalInstance.result.then(function () {
                    vm.expensesGrid.selectedItems = [];
                    getExpensesInfo(matterId);

                }, function () {

                });
            }

        }

        //set email signature
        function getUserEmailSignature() {
            mailboxDataService.emailSignature()
                .then(function (data) {
                    if (utils.isNotEmptyVal(data.data)) {
                        vm.signature = data.data[0];
                        vm.signature = '<br/><br/>' + vm.signature;
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

        // US13403: Export Expense List(PHP to Java)
        function downloadExpense(plaintiffid) {
            var show = utils.isNotEmptyVal(plaintiffid) ? plaintiffid.id : 'all';
            var partyRole = utils.isNotEmptyVal(plaintiffid) ? plaintiffid.selectedPartyType : '';
            matterDetailsService.downloadExpense(matterId, show, partyRole)
                .then(function (response) {
                    var filename = "Expense_List";
                    var linkElement = document.createElement('a');
                    try {
                        var blob = new Blob([response], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                        var url = window.URL.createObjectURL(blob);

                        linkElement.setAttribute('href', url);
                        linkElement.setAttribute("download", filename + ".xlsx");

                        var clickEvent = new MouseEvent("click", {
                            "view": window,
                            "bubbles": true,
                            "cancelable": false
                        });
                        linkElement.dispatchEvent(clickEvent);
                    } catch (ex) {
                        console.log(ex);
                    }
                })
        }

        // US13403: Export Expense List(PHP to Java)
        function downloadAPExpense(plaintiffid) {
            var show = utils.isNotEmptyVal(plaintiffid) ? plaintiffid.id : 'all';
            var partyRole = utils.isNotEmptyVal(plaintiffid) ? plaintiffid.selectedPartyType : '';
            var showFor = [];
            matterDetailsService.downloadAPExpense(matterId, show, partyRole)
                .then(function (response) {
                    var filename = "Expense_List";
                    var linkElement = document.createElement('a');
                    try {
                        var blob = new Blob([response], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                        var url = window.URL.createObjectURL(blob);

                        linkElement.setAttribute('href', url);
                        linkElement.setAttribute("download", filename + ".xlsx");

                        var clickEvent = new MouseEvent("click", {
                            "view": window,
                            "bubbles": true,
                            "cancelable": false
                        });
                        linkElement.dispatchEvent(clickEvent);
                    } catch (ex) {
                        console.log(ex);
                    }
                })
        }

        function printExpense(plaintiffArray, plaintiffid) {
            var matterName = '';
            var fileNumber = '';
            var plaintiffName = '';
            _.forEach(plaintiffArray, function (plaintiff) {
                if (angular.isDefined(plaintiff.id) && plaintiffid != undefined) {
                    if (plaintiff.id == plaintiffid.id && plaintiffid.selectedPartyType == plaintiff.selectedPartyType) {
                        plaintiffName = plaintiff.name;
                    }
                }

            });
            matterDetailsService.getMatterInfo(matterId)
                .then(function (response) {
                    matterName = response.data[0].matter_name;
                    fileNumber = response.data[0].file_number;
                    if (utils.isNotEmptyVal(vm.expenseTotal)) {
                        _.forEach(vm.expenseTotal.expenseamount, function (data) {
                            data.expenseamount = (_.isNull(data.expenseamount) || angular.isUndefined(data.expenseamount)) ? data.expenseamount = "0" : data.expenseamount;
                        })
                        _.forEach(vm.expenseTotal.paidamount, function (data) {
                            data.paidamount = (_.isNull(data.paidamount) || angular.isUndefined(data.paidamount)) ? data.paidamount = "0" : data.paidamount;
                        })
                        _.forEach(vm.expenseTotal.outstandingamount, function (data) {
                            data.outstandingamount = (_.isNull(data.outstandingamount) || angular.isUndefined(data.outstandingamount)) ? data.outstandingamount = "0" : data.outstandingamount;
                        })
                    } else {
                        vm.expenseTotal = {};
                    }
                    //var show = plaintiffid || "all";
                    expensesHelper.printExpense(matterName, fileNumber, plaintiffName, vm.expensesGrid.selectedItems, vm.expensesList.expenses, vm.expenseTotal);
                }, function () {
                    //notificationService.error('An error occurred. Please try later.');
                })
        }

        (function () {
            window.parent.document.title = "Welcome to CloudLex";
            $rootScope.$emit('favicon', "favicon.ico");
            //initGrid();
            $timeout(function () {
                // vm.isExpenseActiveUI = $rootScope.isUserExpenseActive == 1 ? true : false;
                vm.expensesGrid = {
                    headers: expensesHelper.expensesGrid($rootScope.isExpenseActive),
                    selectedItems: []
                };
            }, 500)

            getExpensesInfo(matterId);
            vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));
            getUserEmailSignature();
            vm.matterInfo = matterFactory.getMatterData(matterId);
        })();

        function selectAllUsers(isSelected) {
            if (isSelected === true) {
                vm.expensesGrid.selectedItems = angular.copy(vm.expensesList.expenses);
            } else {
                vm.expensesGrid.selectedItems = [];
            }
        }

        function allUsersSelected() {
            if (utils.isEmptyVal(vm.expensesList) || vm.expensesList.expenses.length == 0) {
                return false;
            }

            return vm.expensesGrid.selectedItems.length === vm.expensesList.expenses.length;
        }

        function isUserSelected(medicaltreatmentid) {
            var uids = _.pluck(vm.expensesGrid.selectedItems, 'expense_id');
            return uids.indexOf(medicaltreatmentid) > -1;
        }


        function getExpensesInfo(matterId, plaintiffId, selectedPartyType) {
            var show = plaintiffId || 'all';
            matterDetailsService.getExpensesInfo(matterId, show, selectedPartyType)
                .then(function (response) {
                    var data = response;
                    vm.expensesList.expenses = [];
                    _.forEach(data.expenses, function (singleData) {

                        singleData.payment_mode = singleData.payment_mode == 0 ? 2 : singleData.payment_mode;
                        singleData.emAddedOn = (singleData.emAddedOn) ? moment.unix(singleData.emAddedOn).utc().format('MM/DD/YYYY') : '-';

                        singleData.incurred_date = (utils.isEmptyVal(singleData.incurred_date)) || singleData.incurred_date == 0 ? "" : moment.unix(singleData.incurred_date).utc().format('MM/DD/YYYY');

                        if (utils.isNotEmptyVal(singleData.paid_amount) && utils.isNotEmptyVal(singleData.expense_amount)) {
                            //singleData.outstandingamount = (parseFloat(singleData.expense_amount) - parseFloat(singleData.paidamount)).toFixed(2);
                            singleData.outstandingamount = (Math.round((parseFloat(singleData.expense_amount) - parseFloat(singleData.paid_amount)) * 100) / 100).toString();
                        } else if (utils.isNotEmptyVal(singleData.expense_amount)) {
                            singleData.outstandingamount = singleData.expense_amount;
                        } else {
                            singleData.outstandingamount = utils.isNotEmptyVal(singleData.paid_amount) ? -singleData.paid_amount : '';
                        }
                        if (utils.isNotEmptyVal(singleData.contact)) {
                            singleData.plaintiffName = (singleData.contact.first_name) ? singleData.contact.first_name : '' + " " + (singleData.contact.last_name) ? singleData.contact.last_name : '';
                        } else {
                            singleData.plaintiffName = '';
                        }
                        if (utils.isNotEmptyVal(singleData.expense_type)) {
                            singleData.expense_type_name = singleData.expense_type.expense_type_name;
                        } else {
                            singleData.expense_type_name = '';
                        }
                        vm.expensesList.expenses.push(singleData);


                    })
                    vm.expenseTotal = {};
                    //US#8769 pluck amount fields to be calculated
                    if (utils.isNotEmptyVal(vm.expensesList.expenses)) {
                        var expenseamountCal = _.pluck(vm.expensesList.expenses, 'expense_amount');
                        var paidamountCal = _.pluck(vm.expensesList.expenses, 'paid_amount');
                        var outstandingamountCal = _.pluck(vm.expensesList.expenses, 'outstandingamount');
                        //convert array into object for filters in html
                        vm.expenseTotal.expenseamount = expenseamountCal.map(function (e) { return { expenseamount: e } });
                        vm.expenseTotal.paidamount = paidamountCal.map(function (e) { return { paidamount: e } });
                        vm.expenseTotal.outstandingamount = outstandingamountCal.map(function (e) { return { outstandingamount: e } });
                    }
                    refreshGrid();
                });
        }

        function refreshGrid() {
            vm.expensesGrid.selectedItems.length = 0;
        }

        function filterExpenses(plaintiffId, allPartyData, selectedPartyType) {
            getExpensesInfo(matterId, plaintiffId, selectedPartyType);
        }

        function addExpensesInfo(mode, allParties, selectedItems) {
            vm.isMovedToEM = (selectedItems && selectedItems[0] && selectedItems[0].isEditExpense == 1) ? true : false;
            if (vm.isMovedToEM && $rootScope.isUserExpenseActive == false) {
                notificationService.error('This expense has been moved to QuickBooks. It cannot be edited.');
                return
            }
            var resolveObj = {
                matterId: matterId,
                mode: mode,
                allParties: allParties,
                selectedItems: selectedItems

            };
            var modalInstance = openAddExpenseModal(resolveObj);
            getexpensesListAfterSave(modalInstance);
        }

        /**
         * view comment information for selected Expences
         */
        function viewMedicalInfo(selectedItems) {
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

        /**
         * uncheck seleted items from grid
         */
        $rootScope.$on('unCheckSelectedItems', function () {
            vm.expensesGrid.selectedItems = [];
        });

        /**
         * Attach or Upload Documents for Linking 
         */
        function linkUploadDoc(selectedItems) {
            var modalInstance = $modal.open({
                templateUrl: 'app/matter/matter-details/link-upload-document/link-upload-document.html',
                controller: 'linkUploadDocCtrl as linkUpDocCtrl',
                keyboard: false,
                size: 'lg',
                backdrop: 'static',
                windowClass: 'modalMidiumDialog',
                resolve: {
                    linkDocInfo: function () {
                        return {
                            selectedItems: selectedItems,
                            type: 'expense'
                        };
                    }
                }
            });

            modalInstance.result.then(function () {
                utils.isNotEmptyVal(vm.plaintiffid) ? getExpensesInfo(matterId, vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getExpensesInfo(matterId);
            }, function () {
                // console.log("add expense pop up closed");
            });
        }

        function openAddExpenseModal(resolveObj) {
            return $modal.open({
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
        }

        function getexpensesListAfterSave(modalInstance) {
            modalInstance.result.then(function () {
                utils.isNotEmptyVal(vm.plaintiffid) ? getExpensesInfo(matterId, vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getExpensesInfo(matterId);
                //getExpensesInfo(matterId, vm.plaintiffid.id, ); //Bug#5927
            }, function () {
                // console.log("add expense pop up closed");
            });
        }

        function unlinkDocument(selectedItems) {
            vm.LinkedDocRecords = {};
            var actionButton = 'Yes';
            var closeButtonText = "Cancel";
            var msg = 'Are you sure you want to unlink this Document(s) ?'

            vm.LinkedDocRecords = _.filter(selectedItems, function (item) {
                return utils.isNotEmptyVal(item.expense_document_id) && item.expense_document_id > 0;

            });
            vm.noDocRecords = _.filter(selectedItems, function (item) {
                return utils.isEmptyVal(item.expense_document_id) || item.expense_document_id == 0;

            });

            if (vm.noDocRecords.length > 0) {
                var msg = "There is no Document(s) to unlink.";
                actionButton = '';
                closeButtonText = 'Ok'
            }

            if (vm.noDocRecords.length > 0 && vm.LinkedDocRecords.length > 0) {
                var total = vm.noDocRecords.length + vm.LinkedDocRecords.length;
                var msg = "Out of " + total + " Record(s), only " + vm.LinkedDocRecords.length + " Record(s) will be unlinked. " + vm.noDocRecords.length + " record(s) can not be unlinked."
                actionButton = 'Yes';
                closeButtonText = 'Cancel';
            }

            var modalOptions = {
                closeButtonText: closeButtonText,
                actionButtonText: actionButton,
                headerText: 'Confirmation!',
                bodyText: msg
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                var ids = _.pluck(vm.LinkedDocRecords, 'expense_id');
                var matterDEtailName = "expense";
                matterDetailsService.unlinkDocument(ids, matterDEtailName)
                    .then(function () {
                        utils.isNotEmptyVal(vm.plaintiffid) ? getExpensesInfo(matterId, vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getExpensesInfo(matterId);
                        notificationService.success('document unlinked successfully.');
                    }, function () {
                        //alert("unable to delete");
                        utils.isNotEmptyVal(vm.plaintiffid) ? getExpensesInfo(matterId, vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getExpensesInfo(matterId);
                        notificationService.error('An error occurred. Please try later.');
                    });

            });


        }

        function deleteExpenses(selectedItems) {
            vm.isMovedToEM = (selectedItems && selectedItems[0] && selectedItems[0].isEditExpense == 1) ? true : false;
            if (vm.isMovedToEM && $rootScope.isUserExpenseActive == false) {
                notificationService.error('This expense has been moved to QuickBooks. It cannot be deleted.');
                return
            }
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

                        utils.isNotEmptyVal(vm.plaintiffid) ? getExpensesInfo(matterId, vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getExpensesInfo(matterId);
                        // getExpensesInfo(matterId, vm.plaintiffid); //Bug#5927
                        //alert("deleted successfully");
                        notificationService.success('Expense deleted successfully.');
                    }, function (error) {
                        if (error.status == 500) {
                            notificationService.error(error.data.message);
                        } else {
                            notificationService.error('An error occurred. Please try later.');
                        }
                        //alert("unable to delete");

                    });
            });
        }
    }

})();

//add edit lien modal
(function () {
    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('AddExpenseCtrl', AddExpenseCtrl);

    AddExpenseCtrl.$inject = ['$modalInstance', 'matterDetailsService', 'addEditExpense', 'notification-service', '$rootScope'];

    function AddExpenseCtrl($modalInstance, matterDetailsService, addEditExpense, notificationService, $rootScope) {
        var vm = this;
        var contacts = [];
        var matterId = addEditExpense.matterId;
        var pageMode = addEditExpense.mode; //page mode : add, edit
        var isEdited = pageMode === 'add'; //set is edited to false when mode is edit : this is to handle change evenet fired by clxBTnGrp when its value changes
        if (pageMode == "edit") {
            var ExpenseEdit = addEditExpense.selectedItems[0];
            _.forEach(ExpenseEdit, function (val, item) {
                val == "-" ? ExpenseEdit[item] = "" : ExpenseEdit[item] = val;
            });
        }
        var selectedExpenseInfo = pageMode === 'edit' ?
            angular.copy(addEditExpense.selectedItems[0]) : undefined;

        vm.newExpenseInfo = {
            matter: {},
            expense_type: ''
        };
        //vm.newExpenseInfo.matter = {};
        vm.newExpenseInfo.associated_party = "";
        // to set default values
        vm.newExpenseInfo.payment_mode = 2 //default payment mode (unpaid) 
        vm.newExpenseInfo.paid_amount = "";
        vm.newExpenseInfo.expense_amount = "";
        vm.newExpenseInfo.outstandingamount = "";
        //commented to disable deafult date in Incurred Date
        //vm.newExpenseInfo.incurreddate = moment().format("MM/DD/YYYY");

        vm.calExpenseBill = calExpenseBill;
        vm.incurredDatePicker = incurredDatePicker;
        vm.changeValues = changeValues;
        vm.addExpensesInfo = addExpensesInfo;
        vm.getContacts = getContacts;
        vm.getExpenseType = getExpenseType;
        vm.close = closePopup;
        vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
        vm.isDatesValid = isDatesValid;
        vm.groupPlaintiffDefendants = groupPlaintiffDefendants;
        vm.setPartyRole = setPartyRole;
        // vm.isMovedToEM = (addEditExpense.selectedItems && addEditExpense.selectedItems[0].isEditExpense == 1) ? true : false;
        // vm.isExpenseActiveUI = $rootScope.isExpenseActive == 1 ? false : true; 

        function isDatesValid() {
            if ($('#incurredDateError').css("display") == "block") {
                return true;
            } else {
                return false;
            }
        }

        (function () {
            vm.pageMode = pageMode; //assigned to use mode to hide/show elements    
            //getPlaintiffs(matterId);
            vm.plaintiffs = addEditExpense.allParties.slice(3);
            getExpenseType();
            if (angular.isDefined(selectedExpenseInfo)) {
                setExpenseInfo(selectedExpenseInfo);
            }
            vm.disbursableBtns = [{ label: "Yes", value: 1 }, { label: "No", value: 0 }];
            vm.paymentBtns = [{ label: "Paid", value: 1 },
            { label: "Unpaid", value: 2 },
            { label: "Partial", value: 3 }
            ];
        })();


        function setPartyRole(selparty) {
            var partyInfo = _.find(vm.plaintiffs, function (party) {
                return party.id === selparty.id && party.selectedPartyType === selparty.selectedPartyType;
            });

            vm.newExpenseInfo.plaintiffid = partyInfo.id;
            vm.newExpenseInfo.party_role = partyInfo.selectedPartyType;
            //vm.newExpenseInfo.associated_party.push(newExpenseInfo.associated_party.contactid);
            vm.newExpenseInfo.associated_party.associated_party_id = parseInt(partyInfo.id);
            vm.newExpenseInfo.associated_party.associated_party_role = parseInt(partyInfo.selectedPartyType);
        }

        function groupPlaintiffDefendants(party) {
            if (party.selectedPartyType == 1) {
                return "Plaintiffs";
            } else if (party.selectedPartyType == 2) {
                return "Defendants";
            } else if (party.selectedPartyType == 3) {
                return "Other Parties";
            }

            return "All";
        }

        function getPlaintiffs(matterId) {
            matterDetailsService.getPlaintiffs(matterId)
                .then(function (response) {
                    var data = response.data.data;
                    matterDetailsService.setNamePropForPlaintiffs(data);
                    vm.plaintiffs = data;
                }, function (error) {
                    console.log(error);
                });
        }

        function setExpenseInfo(selectedExpenseInfo) {
            vm.newExpenseInfo = selectedExpenseInfo;
            vm.newExpenseInfo.associated_party = _.find(vm.plaintiffs, function (party) {
                return party.id == selectedExpenseInfo.associated_party.associated_party_id && party.selectedPartyType == selectedExpenseInfo.associated_party.associated_party_role;
            });

            vm.newExpenseInfo.plaintiffid = utils.isEmptyVal(vm.newExpenseInfo.associated_party) ? '' : vm.newExpenseInfo.associated_party.id;
            vm.newExpenseInfo.expense_type.expense_type_id = utils.isEmptyVal(vm.newExpenseInfo.expense_type) ? '' : vm.newExpenseInfo.expense_type.expense_type_id;
            vm.newExpenseInfo.expense_type.expense_type_name = utils.isEmptyVal(vm.newExpenseInfo.expense_type) ? '' : vm.newExpenseInfo.expense_type.expense_type_name;
            vm.newExpenseInfo.payment_mode = utils.isNotEmptyVal(vm.newExpenseInfo.payment_mode) ? vm.newExpenseInfo.payment_mode : 2; //unpaid

            if (typeof (selectedExpenseInfo.incurred_date) == "number") {
                vm.newExpenseInfo.incurred_date = (utils.isEmptyVal(selectedExpenseInfo.incurred_date)) ? "" : moment.unix(selectedExpenseInfo.incurred_date).utc().format('MM/DD/YYYY'); //moment(selectedExpenseInfo.incurreddate).format("MM/DD/YYYY")
            }
            else {
                vm.newExpenseInfo.incurred_date = (utils.isEmptyVal(selectedExpenseInfo.incurred_date)) ? "" : moment(selectedExpenseInfo.incurred_date).format('MM/DD/YYYY'); //moment(selectedExpenseInfo.incurreddate).format("MM/DD/YYYY")
            }

            if (vm.newExpenseInfo.expense_type.expense_type_id == 0) {
                delete vm.newExpenseInfo.expense_type;
            }
        }

        function getContacts(contactName) {
            return matterDetailsService.getContactsByName(contactName)
                .then(function (response) {
                    var data = response.data.contacts;
                    matterDetailsService.setNamePropForContacts(data);
                    contacts = data;
                    return data;
                });
        }

        function getExpenseType() {
            return matterDetailsService.getExpenseType()
                .then(function (response) {
                    vm.expenseTypes = response;
                    //_.forEach(vm.expenseTypes, function (item) {
                    //   item.expense_type_id = item.LabelId;
                    //   item.expense_type_name = item.Name;
                    //})
                }, function () {
                    //alert("cannot get expense type");
                });
        }

        function closePopup() {
            $modalInstance.dismiss();
        }

        function addExpensesInfo(newExpenseInfo) {
            //Bug#9224
            newExpenseInfo.expense_amount = utils.isNotEmptyVal(newExpenseInfo.expense_amount) ? parseFloat(newExpenseInfo.expense_amount) : null;
            newExpenseInfo.paid_amount = utils.isNotEmptyVal(newExpenseInfo.paid_amount) ? parseFloat(newExpenseInfo.paid_amount) : null;
            newExpenseInfo.outstandingamount = utils.isNotEmptyVal(newExpenseInfo.outstandingamount) ? parseFloat(newExpenseInfo.outstandingamount) : null;

            if (utils.isEmptyVal(newExpenseInfo.associated_party)) {
                newExpenseInfo.associated_party = { associated_party_id: null };
            }

            if ((utils.isNotEmptyVal(newExpenseInfo.expense_amount)) && (utils.isNotEmptyVal(newExpenseInfo.paid_amount))) {
                if (newExpenseInfo.paid_amount > newExpenseInfo.expense_amount) {
                    notificationService.error('Expense amount should be greater than Paid amount');
                    return;
                }
            }



            newExpenseInfo.matter.matter_id = parseInt(matterId);
            var newExpenseInfo = setIdsBeforeSaving(newExpenseInfo);
            var expenseObj = createExpenseObject(newExpenseInfo);
            switch (pageMode) {
                case "add":
                    addExpense(expenseObj);
                    break;
                case "edit":
                    editExpense(expenseObj);
                    break;
            }
        }

        //function to reconstruct obj for adding expense
        function createExpenseObject(newExpenseInfo) {
            var expenseObj = {
                matter: {
                    matter_id: ''
                },
                expense_type: {
                    expense_type_id: ''
                },
                associated_party: {
                    associated_party_id: '',
                    associated_party_role: ''
                }
            };
            expenseObj.expense_id = newExpenseInfo.expense_id;
            expenseObj.matter.matter_id = newExpenseInfo.matter.matter_id;
            expenseObj.expense_type.expense_type_id = newExpenseInfo.expense_type && newExpenseInfo.expense_type.expense_type_id ? newExpenseInfo.expense_type.expense_type_id : '';
            expenseObj.expense_name = newExpenseInfo.expense_name;
            expenseObj.disbursable = newExpenseInfo.disbursable;
            expenseObj.expense_amount = newExpenseInfo.expense_amount;
            expenseObj.paid_amount = newExpenseInfo.paid_amount;
            expenseObj.outstandingamount = newExpenseInfo.outstandingamount;
            expenseObj.expense_document_id = newExpenseInfo.expense_document_id;
            expenseObj.payment_mode = newExpenseInfo.payment_mode;
            expenseObj.incurred_date = newExpenseInfo.incurred_date;
            expenseObj.memo = newExpenseInfo.memo;
            expenseObj.cheque_no = newExpenseInfo.cheque_no;
            expenseObj.bank_account = newExpenseInfo.bank_account;
            expenseObj.associated_party.associated_party_role = newExpenseInfo.associated_party.associated_party_role || newExpenseInfo.associated_party.selectedPartyType;

            if (newExpenseInfo.associated_party.associated_party_id) {
                expenseObj.associated_party.associated_party_id = newExpenseInfo.associated_party.associated_party_id;
            } else if (newExpenseInfo.associated_party.isDefendant) {
                expenseObj.associated_party.associated_party_id = parseInt(newExpenseInfo.associated_party.defendantid);
            } else if (newExpenseInfo.associated_party.isOtherParty) {
                expenseObj.associated_party.associated_party_id = parseInt(newExpenseInfo.associated_party.id);
            } else if (newExpenseInfo.associated_party.isPlaintiff) {
                expenseObj.associated_party.associated_party_id = parseInt(newExpenseInfo.associated_party.plaintiffid);
            }

            return expenseObj;
        }

        function incurredDatePicker($event) {
            $event.preventDefault();
            $event.stopPropagation();

            vm.incurredServicePicker = true;
        }

        // Set intial values with 0 based on payment mode

        function calExpenseBill(payment_mode) {
            //check the previously set is edited value, in edit mode we ignore the first change in model value
            if (!isEdited) {
                isEdited = true;
                return;
            }

            switch (payment_mode) {
                case 1: // paid
                case 2: // Unpaid
                case 3: // Partial

                    vm.newExpenseInfo.paid_amount = utils.isEmptyVal(vm.newExpenseInfo.paid_amount) ?
                        '' : vm.newExpenseInfo.paid_amount;
                    vm.newExpenseInfo.outstandingamount = utils.isEmptyVal(vm.newExpenseInfo.outstandingamount) ?
                        '' : vm.newExpenseInfo.outstandingamount;
                    vm.newExpenseInfo.paid_amount = utils.isEmptyVal(vm.newExpenseInfo.paid_amount) ?
                        '' : vm.newExpenseInfo.paid_amount;
                    changeValues(vm.newExpenseInfo);

                    break;
            }
        }
        // Calculate/set values based on payment mode for Bill amount, tatal amount and outstanding amount.
        function changeValues(objectInfo) {
            switch (objectInfo.payment_mode) {
                case 1: // paid
                    objectInfo.paid_amount = objectInfo.expense_amount;
                    objectInfo.outstandingamount = 0;
                    break;
                case 2: // Unpaid
                    objectInfo.outstandingamount = objectInfo.expense_amount;
                    objectInfo.paid_amount = 0; // 
                    break;
                case 3: // Partial
                    if (utils.isNotEmptyVal(objectInfo.paid_amount) && utils.isNotEmptyVal(objectInfo.expense_amount)) {
                        // objectInfo.outstandingamount = (parseFloat(objectInfo.expense_amount) - parseFloat(objectInfo.paidamount)).toFixed(2);
                        objectInfo.outstandingamount = Math.round((parseFloat(objectInfo.expense_amount) - parseFloat(objectInfo.paid_amount)) * 100) / 100; // This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000

                    } else {
                        if (utils.isNotEmptyVal(objectInfo.expense_amount)) {
                            objectInfo.outstandingamount = objectInfo.expense_amount;
                        } else {
                            objectInfo.outstandingamount = (utils.isEmptyVal(objectInfo.paid_amount)) ? '' : -objectInfo.paid_amount;
                        }
                    }
                    break;
            }
        }

        function setIdsBeforeSaving(newExpenseInfo) {
            var newExpenseInfo = angular.copy(newExpenseInfo);
            return newExpenseInfo;
        }

        function addExpense(newExpenseInfo) {
            //US#7598 Make associated parties non-mandatory in matter details and doesn't allow empty form to save
            if (vm.newExpenseInfo.outstandingamount == 0 || vm.newExpenseInfo.expense_amount == 0) {
                vm.amount = true;
            }
            if ((utils.isEmptyVal(vm.newExpenseInfo.associated_party) && utils.isEmptyVal(vm.newExpenseInfo.expense_name) && utils.isEmptyVal(vm.newExpenseInfo.expense_type) && utils.isEmptyVal(vm.newExpenseInfo.incurred_date) && (vm.amount == true) && (vm.newExpenseInfo.payment_mode == '2') && utils.isEmptyVal(newExpenseInfo.disbursable) && utils.isEmptyVal(vm.newExpenseInfo.memo) &&
                utils.isEmptyVal(vm.newExpenseInfo.cheque_no) && utils.isEmptyVal(vm.newExpenseInfo.bank_account)) && !vm.amount) {
                vm.amount = false;
                notificationService.error("Please add some data to save");
                return;
            }
            newExpenseInfo.incurred_date = (utils.isEmptyVal(newExpenseInfo.incurred_date)) ? null : utils.getUTCTimeStamp(newExpenseInfo.incurred_date); //moment(newExpenseInfo.incurreddate).unix();
            // newExpenseInfo.paidamount = (utils.isNotEmptyVal(newExpenseInfo.paidamount)) ? newExpenseInfo.paidamount : null;
            // newExpenseInfo.expense_amount = (utils.isNotEmptyVal(newExpenseInfo.expense_amount)) ? newExpenseInfo.expense_amount : null;
            // newExpenseInfo.outstandingamount = (utils.isNotEmptyVal(newExpenseInfo.outstandingamount)) ? newExpenseInfo.outstandingamount : null;
            matterDetailsService.addExpenseRecord(newExpenseInfo)
                .then(function () {
                    $modalInstance.close();
                    notificationService.success('Expense added successfully.');
                }, function () {
                    //alert("unable to add");
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function editExpense(newExpenseInfo) {

            //US#7598 Make associated parties non-mandatory in matter details and doesn't allow empty form to save
            if (utils.isEmptyVal(vm.newExpenseInfo.associated_party) && utils.isEmptyVal(vm.newExpenseInfo.memo) && utils.isEmptyVal(vm.newExpenseInfo.expense_name) && utils.isEmptyVal(vm.newExpenseInfo.expense_type) && utils.isEmptyVal(vm.newExpenseInfo.incurred_date) && utils.isEmptyVal(vm.newExpenseInfo.outstandingamount) && utils.isEmptyVal(vm.newExpenseInfo.expense_amount)) {
                notificationService.error("Please add some data to save");
                return;
            }
            newExpenseInfo.incurred_date = (utils.isEmptyVal(newExpenseInfo.incurred_date)) ? null : utils.getUTCTimeStamp(newExpenseInfo.incurred_date); //moment(newExpenseInfo.incurreddate).unix();

            if (utils.isEmptyVal(newExpenseInfo.associated_party)) {
                newExpenseInfo.associated_party = { associated_party_id: null };
            }
            //newExpenseInfo.associated_party.associated_party_id = newExpenseInfo.associated_party == undefined ? null : newExpenseInfo.associated_party.associated_party_id ;
            // newExpenseInfo.paidamount = (utils.isNotEmptyVal(newExpenseInfo.paidamount)) ? newExpenseInfo.paidamount : null;
            // newExpenseInfo.expense_amount = (utils.isNotEmptyVal(newExpenseInfo.expense_amount)) ? newExpenseInfo.expense_amount : null;
            // newExpenseInfo.outstandingamount = (utils.isNotEmptyVal(newExpenseInfo.outstandingamount)) ? newExpenseInfo.outstandingamount : null;
            matterDetailsService.editExpenseRecord(newExpenseInfo)
                .then(function () {
                    $modalInstance.close();
                    notificationService.success('Expense updated successfully.');
                }, function () {
                    //alert("unable to edit");
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        //in our display value and model value are different for the input box
        //therefore we are formatting our display value based on the model value of the input box
        function formatTypeaheadDisplay(contact) {
            if (angular.isUndefined(contact) || utils.isEmptyString(contact)) {
                return undefined;
            }
            //if name prop is not present concat firstname and lastname
            //return (contact.name || (contact.firstname + " " + contact.lastname));
            var firstname = angular.isUndefined(contact.firstname) ? '' : contact.firstname;
            var lastname = angular.isUndefined(contact.lastname) ? '' : contact.lastname;
            return (contact.name || (firstname + " " + lastname));

        }

    }

})();

(function () {
    angular
        .module('cloudlex.matter')
        .controller('expenseManagerCtrl', expenseManagerCtrl);


    expenseManagerCtrl.$inject = ['$modalInstance', 'expenseInfo', 'notification-service', 'matterDetailsService'];

    function expenseManagerCtrl($modalInstance, expenseInfo, notificationService, matterDetailsService) {
        var vm = this;
        vm.proceedToExpense = proceedToExpense;
        vm.cancel = cancel;
        // vm.data = data;
        var selectedItems = angular.copy(expenseInfo.data);

        //  US16929: Expense Manager (Quickbooks integration)
        //Function call on proceed the popup
        function proceedToExpense() {
            var ids = _.pluck(selectedItems, 'expense_id');
            // var ids = _.pluck(selectedItems, 'expense_id').toString().split(',').join(', ');
            // ids.toString().replace(/,/g, ", ");
            matterDetailsService.moveToExpenseManager(ids)
                .then(function (response) {
                    if (angular.isDefined(response)) {
                        notificationService.success('Export successful!');
                        $modalInstance.close();
                    }
                }, function (error) {
                    $modalInstance.dismiss();
                    notificationService.error(error.message);
                });
        }

        //  US16929: Expense Manager (Quickbooks integration)
        //Function call on cancel the popup
        function cancel() {
            $modalInstance.dismiss();
        }

    }


})();






(function (angular) {

    angular.module('cloudlex.matter')
        .factory('expensesHelper', expensesHelper);

    expensesHelper.$inject = ['globalConstants', '$filter', '$rootScope'];


    function expensesHelper(globalConstants, $filter, $rootScope) {
        return {
            expensesGrid: _expensesGrid,
            printExpense: _printExpense,
        };

        function _printExpense(matterName, fileNumber, plaintiffName, selectedItem, expenseList, expenseTotal) {
            var priexpenseList = angular.copy(expenseList);
            var filtersForPrint = _getFiltersForPrint(matterName, fileNumber, plaintiffName);
            var headers = _expensesGrid($rootScope.isExpenseActive);
            headers = _getPropsFromHeaders(headers);
            var expenseTotal = angular.copy(expenseTotal);
            var printPage = _getPrintPage(filtersForPrint, headers, priexpenseList, expenseTotal);
            window.open().document.write(printPage);
        }

        function _getFiltersForPrint(matterName, fileNumber, plaintiffName) {
            var filtersForPrint = {
                'Matter Name': matterName,
                'File #': fileNumber,
                'Records Of': plaintiffName
            }
            return filtersForPrint;
        }

        function _getPropsFromHeaders(headers) {
            var displayHeaders = [];
            _.forEach(headers, function (head) {
                _.forEach(head.field, function (field) {
                    if (utils.isNotEmptyVal(field.printDisplay)) {
                        displayHeaders.push({ prop: field.prop, display: field.printDisplay });
                    }
                });
            });
            return displayHeaders;
        }

        // function currencyFormat(num) {
        //     return "$" + parseFloat(num).toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        // }
        function currencyFormat(num) {
            num = num.toString();
            return "$" + num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        }

        function _getPrintPage(filters, headers, expenseList, expenseTotal) {
            var html = "<html><title>Expense Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Expense Report</h1><div></div>";
            html += "<body>";
            /*html += "<div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";*/
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<tr>";
            angular.forEach(filters, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'>";
                html += "<label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px; '>  " + utils.removeunwantedHTML(val) + '</span>';
                html += "</div>";
            });
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "</tr>";
            html += '<tr>';

            if (!(_.isEmpty(expenseTotal))) {
                html += "<tr>";
                html += '<div style="float: right;margin-bottom: 20px;" data-ng-if="expenses.expensesList.expenses.length > 0">';
                html += '<div style="float: left;margin-left: 15px;"><b>Total</b></div>';
                html += '<div style="float: left;margin-left: 15px;">Expense: <b>' + $filter('currency')($filter('sumOfValue')(expenseTotal.expenseamount, 'expenseamount'), '$', 2) + '</b></div>';
                html += '<div style="float: left;margin-left: 15px;">Paid: <b>' + $filter('currency')($filter('sumOfValue')(expenseTotal.paidamount, 'paidamount'), '$', 2) + '</b></div>';
                html += '<div style="float: left;margin-left: 15px;">Outstanding: <b>' + $filter('currency')($filter('sumOfValue')(expenseTotal.outstandingamount, 'outstandingamount'), '$', 2) + '</b></div>';
                html += '</div>';
                html += "</tr>";
            }


            angular.forEach(headers, function (header) {
                //html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + header.display + "</th>";
                if ((header.prop == 'expense_amount') || (header.prop == 'paidamount') || (header.prop == 'outstandingamount')) {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px;text-align:right;'>" + header.display + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + header.display + "</th>";
                }
            });
            html += '</tr>';


            angular.forEach(expenseList, function (item) {
                html += '<tr>';
                angular.forEach(headers, function (header) {
                    item[header.prop] = (_.isNull(item[header.prop]) || angular.isUndefined(item[header.prop]) ||
                        utils.isEmptyString(item[header.prop])) ? "-" : item[header.prop];
                    if (header.prop == 'disbursable') {
                        item[header.prop] = item[header.prop].toString();
                        switch (item[header.prop]) {
                            case '1':
                                html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" +
                                    'Yes' + "</td>";
                                break;

                            case '0':
                                html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" +
                                    'No' + "</td>";
                                break;
                            default:
                                html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>-</td>";
                        }


                    } else {

                        if (header.prop == 'expense_amount' || header.prop == 'paid_amount' || header.prop == 'outstandingamount') {
                            item[header.prop] = (item[header.prop] == "-") ? "" : item[header.prop];

                            if (utils.isEmptyVal(item[header.prop])) {
                                html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'> - </td>";
                            } else {
                                html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" +
                                    $filter('currency')(item[header.prop], '$', 2) + "</td>";
                            }

                        } else {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;min-width: 90px;'>" +
                                '<pre style="font-family: calibri!important;white-space: pre-wrap !important;border-radius: 0px;border: 0px;padding: 0;word-break: break-word;">' + utils.removeunwantedHTML(item[header.prop]) + '</pre>' + "</td>";
                        }
                    }

                })
                html += '</tr>'
            })


            html += "</body>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</table>";
            html += "</html>";
            return html;
        }



        function _expensesGrid(isExpenseActive) {
            typeof (isExpenseActive) == 'undefined' ? isExpenseActive = localStorage.getItem("isExpenseActive") : angular.noop;

            var ExpenseListarray = [{

                field: [{
                    html: '<span data-ng-show="data.expense_document_id && !(data.expense_document_id==0)">' +
                        '  <open-doc doc-id={{[{doc_id:data.expense_document_id}]}} matter-id={{matterDetail.matterId}}></open-doc>' +
                        '</span>' + '<span data-ng-hide="(data.expense_document_id && !(data.expense_document_id==0)) || expenses.matterInfo.archivalMatterReadOnlyFlag" class ="sprite default-link" ng-click = "expenses.linkUploadDoc(data)" tooltip="Link Document" tooltip-append-to-body="true" tooltip-placement="right"></span>',

                    inline: true
                }],
                dataWidth: "4"
            },
            {
                field: [{
                    html: '<span data-ng-show="data.memo" class ="sprite default-view-comment" ng-click = "expenses.viewMedicalInfo(data)" tooltip="View Memo" tooltip-append-to-body="true" tooltip-placement="right"></span>',
                    inline: true,
                    cursor: true,

                }],
                dataWidth: "4"
            },
            {
                field: [{
                    prop: 'plaintiffName',
                    customTemplate: '<span data-ng-click="expenses.openContactCard(data.contact)" data-toggle="plaintiffName-tooltip" title="{cellData}">' +
                        '    {cellData}' +
                        '</span>',
                    printDisplay: 'Associated Party',
                    template: 'custom',
                    compile: true,
                    inline: true,
                    cursor: true,
                    underline: true
                }],
                displayName: 'Associated Party',
                dataWidth: "9"
            },
            {
                field: [{
                    prop: 'expense_name',
                    printDisplay: 'Expense Name'
                }],
                displayName: 'Expense Name',
                dataWidth: "9"
            },
            {
                field: [{
                    prop: 'expense_type_name',
                    printDisplay: 'Expense Type'
                }],
                displayName: 'Expense Type',
                dataWidth: "10"
            },
            {
                field: [{
                    prop: 'disbursable',
                    printDisplay: 'Disbursable',
                    html: '<span>{{data.disbursable | yesNo1}}</span>'
                }],
                displayName: 'Disbursable',
                dataWidth: "9"
            },
            {
                field: [{
                    prop: 'incurred_date',
                    printDisplay: 'Date Incurred',

                }],
                displayName: 'Date Incurred',
                dataWidth: isExpenseActive == 1 ? "8" : "10"
            },
            {
                field: [{
                    prop: 'expense_amount',
                    printDisplay: 'Expense Amount',
                    html: '<span tooltip="${{data.expense_amount | number:2}}" tooltip-append-to-body="true" tooltip-placement="bottom">{{data.expense_amount || data.expense_amount == 0 ? "$" : ""}}{{data.expense_amount | number:2}}</span>'
                }],
                displayName: 'Expense Amount',
                dataWidth: isExpenseActive == 1 ? "8" : "10"
            },
            {
                field: [{
                    prop: 'paid_amount',
                    printDisplay: 'Paid Amount',
                    html: '<span tooltip="${{data.paid_amount | number:2}}" tooltip-append-to-body="true" tooltip-placement="bottom">{{data.paid_amount || data.paid_amount == 0 ? "$" : ""}}{{data.paid_amount | number:2}}</span>',
                }],
                displayName: 'Paid Amount',
                dataWidth: isExpenseActive == 1 ? "8" : "10"
            },
            {
                field: [{
                    prop: 'outstandingamount',
                    printDisplay: 'Outstanding Amount',
                    html: '<span tooltip="{{data.outstandingamount ? (data.outstandingamount | currency) : \'\'}}" tooltip-append-to-body="true" tooltip-placement="bottom" >{{data.outstandingamount || data.outstandingamount == 0 ? "$" : ""}}{{data.outstandingamount | number:2}}</span>'
                }],
                displayName: 'Outstanding Amount',
                dataWidth: "10"
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
                dataWidth: "9"
            },
            {
                field: [{
                    prop: 'memo',
                    printDisplay: 'Memo',
                }],
                displayName: 'Memo',
                dataWidth: "1"
            }

            ];
            if (isExpenseActive == 1) {
                ExpenseListarray.push({
                    field: [{
                        prop: 'emAddedOn',
                        printDisplay: 'Requested On'
                    },],
                    displayName: 'Requested On',
                    dataWidth: "8"

                })
            }
            return ExpenseListarray;


        }
    }

})(angular);