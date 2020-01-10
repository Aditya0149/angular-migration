(function () {
    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('settlementCtrl', settlementCtrl);

    settlementCtrl.$inject = ['$scope', '$rootScope', '$stateParams', '$modal', 'settlementInfoHelper', 'matterDetailsService',
        'notification-service', 'modalService', 'contactFactory', 'masterData', 'matterFactory', 'globalConstants', 'mailboxDataService', '$filter', 'allPartiesDataService', '$q'
    ];

    function settlementCtrl($scope, $rootScope, $stateParams, $modal, settlementInfoHelper, matterDetailsService,
        notificationService, modalService, contactFactory, masterData, matterFactory, globalConstants, mailboxDataService, $filter, allPartiesDataService, $q) {

        var vm = this;
        var matterId = $stateParams.matterId;
        vm.openContactCard = openContactCard;
        vm.openContactCardOnHistroy = openContactCardOnHistroy;
        vm.openContactCardOnRecovery = openContactCardOnRecovery;
        vm.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;
        vm.addPaymentInfo = addPaymentInfo;
        vm.editPaymentInfo = editPaymentInfo;
        vm.deletePaymentInfo = deletePaymentInfo;
        vm.updateSettlementInfo = updateSettlementInfo;

        vm.selectAllUsers = selectAllUsers;
        vm.allUsersSelected = allUsersSelected;
        vm.isUserSelected = isUserSelected;
        vm.viewPayemntMemo = viewPayemntMemo;

        vm.printPaymentInfo = printPaymentInfo;
        vm.downloadPaymentInfo = downloadPaymentInfo;
        var gracePeriodDetails = masterData.getUserRole();
        var matterPermissions = masterData.getPermissions();
        vm.mattersettlement = _.filter(matterPermissions[0].permissions, function (per) {
            if (per.entity_id == '9') {
                return per;
            }
        });
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.mode = 'view';
        vm.cancel = cancel;
        vm.printFlag = false;


        vm.openDatePicker = openDatePicker;
        vm.isDatesValid = isDatesValid;
        vm.getContacts = getContacts; //US#8309 
        vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
        vm.addNewContact = addNewContact;
        var contacts = [];
        vm.settlementInfo = {};
        vm.clRhistroy = false;
        vm.openContactCardOnPayment = false;
        vm.JavaFilterAPIForContactList = true;

        vm.getCalculations = getCalculations;
        vm.saveCalculation = saveCalculation;
        vm.typeOfCal = [{ id: 1, name: 'Gross' }, { id: 2, name: 'Deducted' }];
        vm.currentCalculation = {
            negotiation_id: null,
            fee_calculation: 1,
            settlement_amount: '',
            fee_percentage: '',
            expenses_amount: null,
            lien_amount: null,
            sub_total: '',
            client_recovery: '',
            attorney_recovery: '',
            is_final_settlement: '0'
        };
        vm.insuranceDetails = {};
        vm.viewCalculation = viewCalculation;
        vm.viewPrevCalculation = viewPrevCalculation;
        vm.viewNextCalculation = viewNextCalculation;
        vm.addCalculator = addCalculator;
        vm.deleteCalculator = deleteCalculator;
        vm.clearCal = clearCal;
        vm.disableCalculator = false;
        vm.selectedRow = {};
        vm.excessConfirmed = [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }];
        vm.setSelectedTab = setSelectedTab;
        vm.isNegotiation = false;
        vm.isFinalSettlement = false;
        vm.isPaymentInfo = false;
        vm.isPlaintiffInfo = false;
        vm.getNegotiation = getNegotiation;
        vm.saveNegotiation = saveNegotiation;
        vm.cancelNegotiation = cancelNegotiation;
        vm.addNegotiation = addNegotiation;
        vm.negotiationInfo = {};
        vm.setInsuranceProvider = setInsuranceProvider;
        vm.status = [{ id: 1, name: 'Accepted' }, { id: 2, name: 'Pending' }, { id: 3, name: 'Rejected' }];
        vm.negotiation_id;
        vm.deleteSettlement = deleteSettlement;
        vm.editSettlement = editSettlement;
        vm.saveNegotiationEdit = saveNegotiationEdit;
        vm.plaintiff_name = '';
        vm.finalSettNotes = [{ id: 1, name: 'Final Settlement' }, { id: 2, name: 'Notes' }];
        vm.showDetails = false;
        vm.viewMemo = viewMemo;
        vm.setTab = setTab;
        vm.getPlaintiffDetails = getPlaintiffDetails;
        vm.disableDelete = false;
        vm.editPlaintiffRecovery = editPlaintiffRecovery;
        vm.deletePlaintiffRecovery = deletePlaintiffRecovery;
        vm.selectAllPlaintiff = selectAllPlaintiff;
        vm.allPlaintiffSelected = allPlaintiffSelected;
        vm.isPlaintiffSelected = isPlaintiffSelected;
        vm.client_recovery = '';
        vm.attorney_recovery = '';
        vm.showNegotiation = false;
        vm.settlementAmount = '';
        vm.plaintiff_id = '';
        vm.defaultDetail = defaultDetail;
        vm.openAddInsModal = openAddInsModal;

        //SAF for initialization
        (function () {
            //init();
            getDefendants();
            vm.matterInfo = matterFactory.getMatterData(matterId);
        })();

        function getDefendants(info) {
            var promise = allPartiesDataService.getDefendants(matterId);
            promise.then(function (response) {
                if (response.data) {
                    vm.defendants = angular.copy(response.data);
                    matterDetailsService.getInsauranceInfo_BEFORE_OFF_DRUPAL(matterId, 'all', '')
                        .then(function (response) {
                            var data = response.data.insurance;
                            _.forEach(data, function (item) {
                                if ((utils.isEmptyVal(item.policylimit) && utils.isEmptyVal(item.policylimit_max))) {
                                    item.policy = "";
                                } else {
                                    var policylimit_max = utils.isNotEmptyVal(item.policylimit_max) ? $filter('currency')(angular.copy(item.policylimit_max), '$', 2) : "-";
                                    var policylimit = utils.isNotEmptyVal(item.policylimit) ? $filter('currency')(angular.copy(item.policylimit), '$', 2) : "-";
                                    item.policy = policylimit + '/' + policylimit_max;
                                }
                            });
                            vm.insuranceList = angular.copy(data);
                            init(info);
                        });
                }
            });
            return promise;
        };

        vm.showInsurance = function (info, id) {
            if (info == true) {
                $('#dropdownMenu' + id).stop(true, true).delay(2).fadeIn(500);
            } else {
                $('#dropdownMenu' + id).stop(true, true).delay(2).fadeOut(500);
            }
        };

        function init(info) {
            vm.settlementInfoGrid = {
                headers: settlementInfoHelper.settlementInfoGrid(),
                selectedItems: []
            };
            vm.plaintiffRecoveryGrid = {
                headers: settlementInfoHelper.plaintiffRecoveryGrid(),
                selectedPlaintiff: []
            };

            vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));
            vm.datePicker = {};
            getUserEmailSignature();
            var tab = localStorage.getItem('tab');
            if (tab == 'finalSettlement') {
                vm.isFinalSettlement = true;
                vm.isPaymentInfo = true;
                vm.isPlaintiffInfo = false;
                getPlaintiffDetails();
            } else {
                vm.isNegotiation = true;
                if (info == 'fromInsurance') {
                    getNegotiation('fromInsurance')
                } else {
                    getNegotiation();
                }
            }
            getsettlementData();
        }

        vm.settlementTotal = {
            totalAmount: "9999.50",
            paidAmount: "15000",
            outstandingAmount: "5000.50"
        }

        //to do calculation for gross and deducted
        $scope.$watch(function () {
            var settCalculation = {};
            if (utils.isNotEmptyVal(vm.currentCalculation.fee_calculation)) {
                settCalculation = angular.copy(vm.currentCalculation);
                settCalculation.expenses_amount = settCalculation.expenses_amount ? settCalculation.expenses_amount : 0;
                settCalculation.lien_amount = settCalculation.lien_amount ? settCalculation.lien_amount : 0;
                if (settCalculation.fee_calculation == 1) { //Gross
                    if (utils.isNotEmptyVal(settCalculation.settlement_amount)) {
                        var settAmount = parseFloat(angular.copy(settCalculation.settlement_amount));
                        var percentage = parseFloat(angular.copy(settCalculation.fee_percentage));
                        //US#13083
                        var reff_percentage = parseFloat(angular.copy(settCalculation.referring_fee_percentage));
                        settCalculation.attorney_recovery_amount = ((parseFloat(settAmount)) * percentage) / 100;
                        if (settCalculation.referring_fee_percentage) {
                            settCalculation.referring_attorney_fee = ((parseFloat(settCalculation.attorney_recovery_amount)) * reff_percentage) / 100;
                            settCalculation.attorney_recovery = settCalculation.attorney_recovery_amount - settCalculation.referring_attorney_fee;
                        } else {
                            settCalculation.attorney_recovery = settCalculation.attorney_recovery_amount;
                            settCalculation.referring_attorney_fee = 0;
                        }

                        var subTotal = (parseFloat(settAmount)) - parseFloat(angular.copy(settCalculation.attorney_recovery_amount));
                        var addExpenseLiens = parseFloat(settCalculation.expenses_amount) + parseFloat(settCalculation.lien_amount);
                        settCalculation.client_recovery = subTotal - addExpenseLiens;
                    }

                } else { //Deducted
                    if (utils.isNotEmptyVal(settCalculation.settlement_amount)) {
                        var settAmount = parseFloat(angular.copy(settCalculation.settlement_amount));
                        var percentage = parseFloat(angular.copy(settCalculation.fee_percentage));
                        var addExpenseLiens = parseFloat(settCalculation.expenses_amount) + parseFloat(settCalculation.lien_amount);
                        var subTotal = (parseFloat(settAmount)) - parseFloat(addExpenseLiens);
                        //US#13083
                        var reff_percentage = parseFloat(angular.copy(settCalculation.referring_fee_percentage));
                        settCalculation.attorney_recovery_amount = ((parseFloat(subTotal)) * percentage) / 100;
                        if (settCalculation.referring_fee_percentage) {
                            settCalculation.referring_attorney_fee = ((parseFloat(settCalculation.attorney_recovery_amount)) * reff_percentage) / 100;
                            settCalculation.attorney_recovery = settCalculation.attorney_recovery_amount - settCalculation.referring_attorney_fee;
                        } else {
                            settCalculation.attorney_recovery = settCalculation.attorney_recovery_amount;
                            settCalculation.referring_attorney_fee = 0;
                        }
                        settCalculation.client_recovery = subTotal - parseFloat(settCalculation.attorney_recovery_amount);
                    }

                }
                if (utils.isEmptyVal(settCalculation.referring_attorney_fee)) {
                    settCalculation.referring_attorney_fee = 0;
                }
                if (utils.isEmptyVal(settCalculation.client_recovery)) {
                    settCalculation.client_recovery = 0;
                }
                if (utils.isEmptyVal(settCalculation.attorney_recovery)) {
                    settCalculation.attorney_recovery = 0;
                }
                vm.currentCalculation = {};
                vm.currentCalculation = settCalculation;
                vm.currentCalculation.expenses_amount = settCalculation.expenses_amount ? settCalculation.expenses_amount : null;
                vm.currentCalculation.lien_amount = settCalculation.lien_amount ? settCalculation.lien_amount : null;
            }
        })

        function defaultDetail(plaintiffData) {
            setLiensAndExpenses(plaintiffData);
            vm.disbleAddDelete = true;
            vm.insuranceDetails = {};
            vm.insuranceDetails.policy = '-';
            vm.insuranceDetails.claim_number = '-';
            vm.insuranceDetails.policy_exhausted = '-';
        }

        function clearCal(list, plaintiffData) {
            vm.plaintiff_id = list.plaintiff_id ? list.plaintiff_id : plaintiffData ? plaintiffData.plaintiff_id : '';

            if (list) {
                if (list.settlement_negotiations == null || list.settlement_negotiations.length == 0) {
                    vm.hideCalculator = true;
                } else {
                    getCalculations(list.settlement_negotiations[0], '', list, 'clear');
                    vm.hideCalculator = false;
                }
            }
            list.showAdd ? list.showAdd = false : angular.noop();
            if (plaintiffData) {
                defaultDetail(plaintiffData);
            }

        }


        function deleteCalculator() {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                var id = vm.currentCalculation.settlement_calculator_id;
                vm.neg_id = vm.currentCalculation.negotiation_id;
                matterDetailsService.deleteCalculator(id)
                    .then(function (response) {
                        if (response.data) {
                            notificationService.success('Settlement Calculator Deleted Successfully');
                            getNegotiation();
                            vm.settlementAmount = "";
                        }
                    }), function (error) {
                        notificationService.error('Unable to delete')
                    }
            });
        }

        function deleteSettlement(list) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                var id = angular.copy(list.negotiation_id);
                vm.neg_id = id;
                matterDetailsService.deleteNeg(id)
                    .then(function (response) {
                        if (response.data) {
                            notificationService.success('Negotiation Deleted Successfully');
                            getNegotiation();
                            vm.settlementAmount = "";
                            vm.neg_id = "";
                        }
                    }), function (error) {
                        notificationService.error('Unable to delete')
                    }
            });
        }

        function editSettlement(data, list) {
            _.forEach(data, function (item) {
                if (item.negotiation_id == list.negotiation_id) {
                    item.isEdited = true;
                } else {
                    item.isEdited = false;
                }
            })
            getCalculations(list);
            vm.negotiationInfo = {};
            vm.negotiationInfo.negotiation_id = list.negotiation_id ? list.negotiation_id : null;
            vm.negotiationInfo.memo = list.memo ? list.memo : '';
            vm.negotiationInfo.note_id = list.note_id ? list.note_id : '';
            vm.negotiationInfo.insurance_id = list.insurance_id ? list.insurance_id : '';
            vm.negotiationInfo.status = list.payment_status ? list.payment_status == 1 ? { id: 1, name: 'Accepted' } : list.payment_status == 2 ? { id: 2, name: 'Pending' } : list.payment_status == 3 ? { id: 3, name: 'Rejected' } : {} : {};
        }

        function setLiensAndExpenses(plaintiffData) {
            var liens_total = '';
            var outstanding_amount = '';
            var expense_total;
            if (plaintiffData.bill_outstanding_amount && plaintiffData.bill_outstanding_amount.length > 0) {
                outstanding_amount = plaintiffData.bill_outstanding_amount.reduce(function (a, b) {
                    return a + b;
                })
            } else {
                outstanding_amount = null;
            }
            if (plaintiffData.liens_due_amount && plaintiffData.liens_due_amount.length > 0) {
                liens_total = plaintiffData.liens_due_amount.reduce(function (a, b) {
                    return a + b;
                })
            } else {
                liens_total = null;
            }
            if (plaintiffData.expense_amount && plaintiffData.expense_amount.length > 0) {
                expense_total = plaintiffData.expense_amount.reduce(function (a, b) {
                    return a + b;
                })
                expense_total = (angular.copy(expense_total)).toFixed(2);//Bug#13262
            } else {
                expense_total = null;
            }
            var total_amount = null;
            var out_amount = outstanding_amount == null ? outstanding_amount : parseFloat(outstanding_amount);
            var lien_amount = liens_total == null ? liens_total : parseFloat(liens_total);
            if (out_amount == null && lien_amount == null) {
                total_amount = null;
            } else {
                total_amount = (out_amount + lien_amount).toFixed(2);
            }
            vm.currentCalculation = {};
            vm.currentCalculation = {
                negotiation_id: vm.negotiation_id ? vm.negotiation_id : null,
                fee_calculation: 1,
                settlement_amount: vm.settlementAmount,
                fee_percentage: '',
                expenses_amount: expense_total,
                lien_amount: total_amount,
                sub_total: '',
                client_recovery: '',
                attorney_recovery: '',
                is_final_settlement: '0'
            };
        }

        function addCalculator(plaintiffData) {
            vm.disableDelete = true;
            vm.disableCalculator = false;
            setLiensAndExpenses(plaintiffData);
        }

        function settlementCal(data, index, negotiation_id) {
            vm.currentCalculation = {};
            vm.currentCalculation.negotiation_id = negotiation_id;
            vm.currentCalculation.is_final_settlement = data[index].is_final_settlement ? data[index].is_final_settlement.toString() : '0';
            vm.currentCalculation.fee_calculation = utils.isEmptyVal(data[index].fee_calculation) ? '' : data[index].fee_calculation;
            vm.currentCalculation.settlement_amount = utils.isEmptyVal(data[index].settlement_amount) ? '' : data[index].settlement_amount;
            vm.currentCalculation.fee_percentage = utils.isEmptyVal(data[index].fee_percentage) ? '' : data[index].fee_percentage;
            vm.currentCalculation.referring_fee_percentage = utils.isEmptyVal(data[index].referring_fee_percentage) ? '' : data[index].referring_fee_percentage;  //US#13083
            vm.currentCalculation.referring_attorney_fee = utils.isEmptyVal(data[index].referring_attorney_fee) ? '' : data[index].referring_attorney_fee;          //US#13083
            vm.currentCalculation.lien_amount = utils.isEmptyVal(data[index].lien_amount) ? null : data[index].lien_amount;
            vm.currentCalculation.sub_total = utils.isEmptyVal(data[index].sub_total) ? '' : data[index].sub_total;
            vm.currentCalculation.client_recovery = utils.isEmptyVal(data[index].client_recovery) ? '' : data[index].client_recovery;
            vm.currentCalculation.expenses_amount = utils.isEmptyVal(data[index].expenses_amount) ? null : data[index].expenses_amount;
            vm.currentCalculation.settlement_calculator_id = data[index].settlement_calculator_id ? data[index].settlement_calculator_id : '';
        }

        function viewCalculation(cal) {
            if (!vm.selectedSettlementCals) {
                return;
            }
            var data = angular.copy(vm.selectedSettlementCals);
            var index;
            (cal == 'last') ? index = data.length - 1 : index = 0;
            (cal == 'last') ? vm.currentCalculationIndex = data.length : vm.currentCalculationIndex = 1;
            var negotiation_id = data.negotiation_id;
            settlementCal(data, index, negotiation_id);
        }


        function viewPrevCalculation() {
            if (!vm.selectedSettlementCals) {
                return;
            }
            var data = angular.copy(vm.selectedSettlementCals);
            var lastIdx = vm.currentCalculationIndex;
            var index = vm.currentCalculationIndex--;
            if (index <= 1) {
                vm.currentCalculationIndex = lastIdx;
                return;
            }
            var negotiation_id = data.negotiation_id;
            settlementCal(data, index - 2, negotiation_id);
        }

        function viewNextCalculation() {
            if (!vm.selectedSettlementCals) {
                return;
            }
            var data = angular.copy(vm.selectedSettlementCals);
            var lastIdx = vm.currentCalculationIndex;
            var index = vm.currentCalculationIndex++;
            if (index >= vm.allLength) {
                vm.currentCalculationIndex = lastIdx;
                return;
            }
            var negotiation_id = data.negotiation_id;
            settlementCal(data, index, negotiation_id);
        }
        ////// Hardcoded data /////////////
        function checkIfEnterKeyWasPressed(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
            return true;

        };


        function addNegotiation(data) {
            data.showAdd = true;
            vm.hideCalculator = true;
            vm.disableCalculator = true;
            vm.negotiationInfo = {
            };
            data.defendants = [];
            _.forEach(vm.defendants, function (currentItem) {
                data.defendants.push({ 'defendant_id': currentItem.defendantid, 'defendant_name': [currentItem.contactid.firstname, currentItem.contactid.middelname, currentItem.contactid.lastname].join(' '), 'plaintiff_id': data.plaintiff_id });
            })
        }

        function cancelNegotiation(data, edit) {
            if (edit) {
                data.isEdited = false;
            } else {
                data.showAdd = false;
            }
            if (data.settlement_negotiations && data.settlement_negotiations.length == 0) {
                vm.hideCalculator = true;
            } else {
                vm.hideCalculator = false;
            }
            vm.negotiationInfo = {};
        }

        function saveNegotiationEdit(data, list) {
            vm.plaintiff_id = list.plaintiff_id;
            var finalObj = angular.copy(data);
            vm.neg_id = finalObj.negotiation_id;
            var negotiationData = {};
            negotiationData.matter_id = matterId;
            negotiationData.payment_status = utils.isEmptyObj(finalObj.status) ? '' : finalObj.status.id;
            negotiationData.memo = finalObj.memo ? finalObj.memo : '';
            negotiationData.negotiation_id = finalObj.negotiation_id ? finalObj.negotiation_id : null;
            data.isEdited = false;
            matterDetailsService.saveNegotiationEdit(negotiationData)
                .then(function (response) {
                    if (response) {
                        notificationService.success("Negotiation edited successfully");
                        getNegotiation();
                        vm.disableDelete = false;
                    }
                }), function (error) {
                    notificationService.error("Unable to edit");
                }
        }

        function saveNegotiation(data, plaintiffData) {
            var finalObj = angular.copy(data);
            var negotiationData = {};
            negotiationData.matter_id = matterId;
            negotiationData.plaintiff_id = plaintiffData.plaintiff_id ? plaintiffData.plaintiff_id : '';
            negotiationData.insurance_id = finalObj.insurance_id ? finalObj.insurance_id : '';
            negotiationData.defendant_id = finalObj.defendent_id && finalObj.defendent_id.defendant_id ? finalObj.defendent_id.defendant_id : '';
            negotiationData.demanded_amount = finalObj.demanded_amount ? finalObj.demanded_amount : '';
            negotiationData.offered_amount = finalObj.offered_amount ? finalObj.offered_amount : '';
            negotiationData.payment_status = finalObj.status ? finalObj.status.id : '';
            negotiationData.memo = finalObj.memo;
            matterDetailsService.saveNegotiation(negotiationData)
                .then(function (response) {
                    if (response) {
                        getNegotiation();
                        vm.disableDelete = false;
                    }
                });
        }

        function getInsuranceDetails(data) {
            vm.insuranceDetails = {};
            var policy = "";
            if ((utils.isEmptyVal(data.policy_limit) && utils.isEmptyVal(data.policylimit_max))) {
                policy = "-";
            } else {
                var policy_limit_max = utils.isNotEmptyVal(data.policylimit_max) ? $filter('currency')(angular.copy(data.policylimit_max), '$', 2) : "-";
                var policy_limit = utils.isNotEmptyVal(data.policy_limit) ? $filter('currency')(angular.copy(data.policy_limit), '$', 2) : "-";
                policy = policy_limit + '/' + policy_limit_max;
            }
            vm.insuranceDetails.policy = policy ? policy : '-';
            vm.insuranceDetails.claim_number = data.claim_number ? data.claim_number : '-';
            vm.insuranceDetails.policy_exhausted = data.policy_exhausted ? data.policy_exhausted : '-';
        }

        vm.getDetails = function (settlement) {
            defaultDetail(settlement);
        }

        function getCalculations(settlement, plaintiffname, plaintiffData, info) {
            vm.disableDelete = false;
            vm.selectedRow = settlement;
            getInsuranceDetails(settlement);
            if (!settlement.isEdited) {
                if (settlement.payment_status == 1) {
                    vm.settlementAmount = settlement.offered_amount == '-' ? '' : settlement.offered_amount;
                } else {
                    vm.settlementAmount = "";
                }
                vm.negotiation_id = settlement.negotiation_id;
                vm.plaintiff_name = plaintiffname;
                if (settlement.settlement_calculators.length == 0) {
                    vm.disbleAddDelete = true;
                    vm.disableCalculator = false;
                    info == 'clear' ? vm.getDetails(plaintiffData) : clearCal('', plaintiffData);
                    vm.disableCalculator = false;
                    getInsuranceDetails(settlement);
                    return;
                }
                vm.disbleAddDelete = false;
                vm.disableCalculator = true;
                var idx = settlement.settlement_calculators.length - 1;
                vm.currentCalculationIndex = settlement.settlement_calculators.length;
                vm.allLength = settlement.settlement_calculators.length;
                var data = angular.copy(settlement.settlement_calculators);
                vm.selectedSettlementCals = data;
                settlementCal(data, idx, vm.negotiation_id, plaintiffname, settlement);
            }

        }

        function saveHtml(data) {
            var matter_name = localStorage.getItem('matterName');
            var cal = data.fee_calculation == 1 ? 'Gross' : 'Deducted'
            var html = "";
            html += '<table style="border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:10pt; margin-top:10px; width:100%" cellspacing="0" cellpadding="0" border="0"><thead><tr>';
            html += '<tbody>';
            html += '<tr><td>';
            html += '<tr><td width="12%"><b>Matter name: </b></td><td style="width:88%"> ' + matter_name + '</td>';
            html += '<tr><td width="12%"><b>Plaintiff name: </b></td><td style="width:88%">' + vm.plaintiff_name + '</td>';
            html += '<tr><td width="12%"><b>Amount to be considered: </b></td><td style="width:88%">' + cal + '</td>';
            html += '<tr><td width="12%"><b>Client recovery: </b></td><td style="width:90%"> ' + '$' + data.client_recovery + '</td>';
            html += '<tr><td width="12%"><b>Attorney recovery: </b></td><td style="width:88%"> ' + '$' + data.attorney_recovery + '</td>';
            html += '<tr><td width="12%"><b>Settlement amount: </b></td><td style="width:88%"> ' + '$' + data.settlement_amount + '</td>';
            html += '<tr><td width="12%"><b>Attorney Fee Percentage: </b></td><td style="width:88%"> ' + data.fee_percentage + '</td>';
            html += '<tr><td width="12%"><b>Expense amount: </b></td><td style="width:88%"> ' + '$' + data.expenses_amount + '</td>';
            html += '<tr><td width="12%"><b>Lien amount: </b></td><td style="width:88%"> ' + '$' + data.lien_amount + '</td>';
            html += '</td></tr><tr><td style="height:15px"></td></tr>';
            html += '</tbody>';
            html += '<tbody></table>';
            // window.open().document.write(html);
            return html;
        }

        function saveCalculation(data) {
            if (utils.isEmptyVal(data.settlement_amount)) {
                notificationService.error("Please enter settlement amount");
                return;
            }
            if (utils.isEmptyVal(data.fee_percentage)) {
                notificationService.error("Please enter attorney fee percentage");
                return;
            }

            var finalObj = angular.copy(data);
            var obj = {};
            obj.matter_id = parseInt(matterId);
            obj.is_final_settlement = finalObj.is_final_settlement ? parseInt(finalObj.is_final_settlement) : 0;
            obj.client_recovery = finalObj.client_recovery ? parseFloat(finalObj.client_recovery) : 0;
            obj.attorney_recovery = finalObj.attorney_recovery ? parseFloat(finalObj.attorney_recovery) : 0;
            obj.negotiation_id = finalObj.negotiation_id;
            obj.fee_calculation = finalObj.fee_calculation ? finalObj.fee_calculation : 1;
            obj.lien_amount = finalObj.lien_amount ? parseFloat(finalObj.lien_amount) : null;
            obj.expenses_amount = finalObj.expenses_amount ? parseFloat(finalObj.expenses_amount) : null;
            obj.fee_percentage = parseFloat(finalObj.fee_percentage);
            obj.settlement_amount = parseFloat(finalObj.settlement_amount);
            obj.referring_fee_percentage = parseFloat(finalObj.referring_fee_percentage);  //US#13083
            obj.referring_attorney_fee = parseFloat(finalObj.referring_attorney_fee);
            matterDetailsService.saveSettlementCal(obj)
                .then(function (response) {
                    notificationService.success("Settlement Calculation saved successfully");
                    getNegotiation();
                    vm.disableDelete = false;
                })
        }


        function isDatesValid() {
            if ($('#medstartDatedivErr').css("display") == "block" || $('#dateRToClientErr').css("display") == "block" || $('#dateRToInsuranceErr').css("display") == "block") {
                return true;
            } else {
                return false;
            }
        }


        $('#idnum').on('input', function () {
            this.value = this.value.match(/^\d+\.?\d{0,2}/);
        });


        function getPlaintiffDetails() {
            matterDetailsService.getDetails(matterId)
                .then(function (response) {
                    vm.plaintiffdetails = response;
                    setPlaintiffData(response);
                });
        }

        function setPlaintiffData(data) {
            vm.client_recovery = '';
            vm.attorney_recovery = '';
            vm.total_settlement_amount = '';
            var client_data = [];
            var attorney_data = [];
            var total = [];
            if (data.length > 0) {
                _.forEach(data, function (item) {
                    item.contactid = item.contact_id;
                    item.closing_statement_date = (utils.isNotEmptyVal(item.closing_statement_date)) ? moment.unix(item.closing_statement_date).utc().format('MM/DD/YYYY') : "";
                    item.retainer_date = (utils.isNotEmptyVal(item.retainer_date)) ? moment.unix(item.retainer_date).utc().format('MM/DD/YYYY') : "";
                    client_data.push(item.client_recovery_amount);
                    attorney_data.push(item.attorney_recovery_amount);
                    total.push(item.settlement_amount);
                })
                vm.client_recovery = client_data.reduce(function (a, b) {
                    return a + b;
                });
                vm.attorney_recovery = attorney_data.reduce(function (a, b) {
                    return a + b;
                });
                vm.total_settlement_amount = total.reduce(function (a, b) {
                    return a + b;
                });
                vm.client_recovery = utils.isNotEmptyVal(vm.client_recovery) ? vm.client_recovery : '-';
                vm.attorney_recovery = utils.isNotEmptyVal(vm.attorney_recovery) ? vm.attorney_recovery : '-';
            }
        }

        function setSelectedTab(tabname) {
            switch (tabname) {
                case 'negotiation':
                    vm.isNegotiation = true;
                    vm.isFinalSettlement = false;
                    getNegotiation();
                    break;
                case 'finalSettlement':
                    vm.isFinalSettlement = true;
                    vm.isNegotiation = false;
                    vm.isPaymentInfo = true;
                    vm.isPlaintiffInfo = false;
                    break;
            }
            vm.neg_id = '';
            vm.plaintiff_id = '';
            getPlaintiffDetails();
            getsettlementData();
            localStorage.setItem("tab", tabname);
        }

        function setTab(tab) {
            switch (tab) {
                case 'payInfo':
                    vm.isPaymentInfo = true;
                    vm.isPlaintiffInfo = false;
                    vm.settlementInfoGrid.selectedItems = [];
                    break;
                case 'plaintiffInfo':
                    vm.isPaymentInfo = false;
                    vm.isPlaintiffInfo = true;
                    vm.plaintiffRecoveryGrid.selectedPlaintiff = [];
                    // getsettlementData();
                    break;
            }
            getPlaintiffDetails();
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

        function openDatePicker($event, model) {
            vm.datePicker[model] = true;
            $event.preventDefault();
            $event.stopPropagation();
            angular.forEach(vm.datePicker, function (val, key) {
                vm.datePicker[key] = (key === model);
            });
        }

        function calSettlementAmount(data) {
            var totalAmtRecieved = 0;
            var checkPaymentRows = 0;
            var tempSettlementAmount = 0;

            if (utils.isNotEmptyVal(data)) {
                angular.forEach(vm.settlementInfo.payment, function (val) {
                    checkPaymentRows++;
                    totalAmtRecieved = (parseFloat(totalAmtRecieved) + parseFloat(val.amount_recieved));
                });

                (checkPaymentRows > 0) ? vm.settlementInfo.totalPaid = totalAmtRecieved : vm.settlementInfo.totalPaid;
                vm.settlementInfo.totalPaid = vm.settlementInfo.totalPaid ? vm.settlementInfo.totalPaid : "-";
                if (checkPaymentRows > 0) {
                    //  Assuming Maximum Two decimal Places Hence Multiplying by 100 Rounding off and then dividing By 100. The Following way works for the case mentioned in comment above as well.
                    vm.settlementInfo.outstandingAmount = Math.round((parseFloat(utils.isNotEmptyVal(vm.settlementInfo.settlement_amount) ? vm.settlementInfo.settlement_amount : tempSettlementAmount) - parseFloat(totalAmtRecieved)) * 100) / 100;
                } else {
                    vm.settlementInfo.outstandingAmount = (parseFloat(utils.isNotEmptyVal(vm.settlementInfo.settlement_amount) ? vm.settlementInfo.settlement_amount : ''));
                }
            } else {
                angular.noop();
            }
        }

        //US#8309
        function getContacts(contactName, searchItem) {
            var postObj = {};
            postObj.type = globalConstants.settlementTyps;
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            //postObj = matterFactory.setContactType(postObj);
            postObj.page_Size = 250


            return matterFactory.getContactsByName(postObj, vm.JavaFilterAPIForContactList)
                .then(function (response) {
                    var data = response.data;
                    matterDetailsService.setDataPropForContactsFromOffDrupalToNormalContact(data);
                    matterDetailsService.setNamePropForContactsOffDrupal(data);
                    _.forEach(data, function (contact) {
                        contact.name = utils.removeunwantedHTML(contact.first_name) + ' ' + utils.removeunwantedHTML(contact.last_name);
                    });
                    contacts = data;
                    return data;
                });
        }

        //US#8309
        function formatTypeaheadDisplay(contact) {
            if (angular.isUndefined(contact) || utils.isEmptyString(contact)) {
                return undefined;
            }
            var firstname = angular.isUndefined(contact.firstname) ? '' : contact.firstname;
            var lastname = angular.isUndefined(contact.lastname) || (contact.lastname == null) ? '' : contact.lastname;
            return (contact.name || (firstname + " " + lastname));

        }

        //US#8309 add new contact
        function addNewContact(model) {
            var selectedType = {};
            selectedType.type = 'settPayeePayer';
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                response['firstname'] = response.first_name;
                response['lastname'] = response.last_name;
                response['contactid'] = (response.contact_id).toString();
                vm.settlementInfo[model] = response;
            }, function () { });
        }

        function openContactCardOnHistroy(contact, clRhistroy) {

            vm.clRhistroy = true;
            contactFactory.displayContactCard1(contact.contactid, contact.edited);
            _.forEach(vm.settlementHistoryData, function (historydata) {
                settlementInfoHelper.setEdited(historydata, contact);
            });
        }

        function openContactCard(contact) {
            vm.openContactCardOnPayment = true;
            contactFactory.displayContactCard1(contact.contact_id, contact.edited);

            _.forEach(vm.settlementInfoList.payment, function (payemntInfo) {
                settlementInfoHelper.setEdited(payemntInfo, contact);
            });
        }

        function openContactCardOnRecovery(contact) {
            contactFactory.displayContactCard1(contact.contactid, contact.edited);
        }

        $scope.$on('contactCardEdited', function (e, editedContact) {
            var contactObj = editedContact;
            if (vm.clRhistroy == true) {
                vm.clRhistroy = false;
                var historyInfo = angular.copy(vm.settlementHistoryData);

                _.forEach(historyInfo, function (historyInf) {
                    settlementInfoHelper.setEditedContactNames(historyInf, contactObj);
                });

                vm.settlementHistoryData = historyInfo;
                getsettlementData();

            } else if (vm.openContactCardOnPayment == true) {
                vm.openContactCardOnPayment = false;
                var paymentInfos = angular.copy(vm.settlementInfoList.payment);
                vm.settlementInfoList.payment = [];

                _.forEach(paymentInfos, function (payemntInfo) {
                    settlementInfoHelper.setEditedContactNames(payemntInfo, contactObj);
                    settlementInfoHelper.setNames(payemntInfo);
                });

                vm.settlementInfoList.payment = paymentInfos;
            } else {
                getPlaintiffDetails();
            }


        });

        function selectAllUsers(isSelected) {
            if (isSelected === true) {
                vm.settlementInfoGrid.selectedItems = angular.copy(vm.settlementInfoList.payment);
            } else {
                vm.settlementInfoGrid.selectedItems = [];
            }
        }

        function allUsersSelected() {
            if (utils.isEmptyVal(vm.settlementInfoList) || vm.settlementInfoList.payment.length == 0) {
                return false;
            }

            return vm.settlementInfoGrid.selectedItems.length === vm.settlementInfoList.payment.length;
        }

        function isUserSelected(id) {
            var uids = _.pluck(vm.settlementInfoGrid.selectedItems, 'id');
            return uids.indexOf(id) > -1;
        }

        function cancel() {
            getsettlementData();
        }

        function setValues(def, list, provider, adjuster, type, insur_type) {
            var users = [];
            if (type == 'defendant') {
            }
            if (type == 'insuranceProvider') {
                vm.negotiationInfo.insurance_adjuster_id = '';
                vm.adjuster = [];
                _.forEach(list, function (item) {
                    if (item.insurance_provider_id == provider.insurance_provider_id) {
                        vm.adjuster.push({ 'insurance_provider_id': item.insurance_provider_id, 'insurance_provider_name': item.insurance_provider_name, 'insurance_id': item.insurance_id, 'adjuster_id': item.adjuster_id, 'adjuster_name': item.adjuster_name, 'insurance_type': item.insurance_type, 'policy_limit': item.policy_limit, 'policylimit_max': item.policylimit_max, 'claim_number': item.claim_number, 'policy_exhausted': item.policy_exhausted, 'name': item.insurance_type });
                    }
                });
                users = vm.adjuster;
                vm.negotiationInfo.insurance_adjuster_id = vm.adjuster[0];
            }
            if (type == 'adjuster') {
                vm.negotiationInfo.insurance_type = '';
                vm.ins_type = [];
                _.forEach(list, function (item) {
                    if (item.insurance_provider_id == provider.insurance_provider_id && item.adjuster_id == adjuster.adjuster_id) {
                        vm.ins_type.push({ 'insurance_provider_id': item.insurance_provider_id, 'insurance_provider_name': item.insurance_provider_name, 'insurance_id': item.insurance_id, 'adjuster_id': item.adjuster_id, 'adjuster_name': item.adjuster_name, 'insurance_type': item.insurance_type, 'policy_limit': item.policy_limit, 'policylimit_max': item.policylimit_max, 'claim_number': item.claim_number, 'policy_exhausted': item.policy_exhausted, 'name': item.insurance_type });
                    }
                })
                users = vm.ins_type;
                vm.negotiationInfo.insurance_type = vm.ins_type[0];
            }
            if (type == 'ins_type') {
                users = [];
                _.forEach(list, function (item) {
                    if (item.insurance_provider_id == provider.insurance_provider_id && item.adjuster_id == adjuster.adjuster_id && item.insurance_type == insur_type.insurance_type) {
                        users.push({ 'insurance_provider_id': item.insurance_provider_id, 'insurance_provider_name': item.insurance_provider_name, 'insurance_id': item.insurance_id, 'adjuster_id': item.adjuster_id, 'adjuster_name': item.adjuster_name, 'insurance_type': item.insurance_type, 'policy_limit': item.policy_limit, 'policylimit_max': item.policylimit_max, 'claim_number': item.claim_number, 'policy_exhausted': item.policy_exhausted, 'name': item.insurance_type });
                    }
                })
            }
            vm.negotiationInfo.insurance_id = users && users.length > 0 ? users[0].insurance_id : '';

        }

        function setInsuranceProvider(defendant, insuranceList, providerId, adjusterId, insurance_type, type) {
            if (providerId) {
                insuranceList = _.filter(vm.insuranceList, function (insRec) {
                    return insRec.insurance_id == providerId.insurance_id;
                });
            } else {
                insuranceList = angular.copy(vm.insuranceList);
            }

            if (type == 'defendant') {
                // vm.negotiationInfo.insurance_provider_id = '';
                // vm.negotiationInfo.insurance_adjuster_id = '';
                // vm.negotiationInfo.insurance_type = '';
                // // vm.negotiationInfo.policy_limit = undefined;
                // // vm.negotiationInfo.policylimit_max = undefined;
                // // vm.negotiationInfo.policy_number = '';
                // // vm.negotiationInfo.policy_exhausted = '';
                // setValues(defendant, insuranceList, '', adjusterId, 'defendant');
                // setValues(defendant, insuranceList, vm.insuranceProvider[0], adjusterId, 'insuranceProvider');
                // setValues(defendant, insuranceList, vm.insuranceProvider[0], vm.adjuster[0], 'adjuster');

            }
            if (type == 'insuranceProvider') {
                setValues(defendant, insuranceList, providerId, adjusterId, 'insuranceProvider');
                setValues(defendant, insuranceList, vm.negotiationInfo.insurance_provider_id, vm.negotiationInfo.insurance_adjuster_id, 'adjuster');
                // vm.adjuster = [];
                // _.forEach(insuranceList, function (item) {
                //     if (item.defendant_id == defendant.defendant_id && item.insurance_provider_id == providerId.insurance_provider_id) {
                //         vm.adjuster.push({ 'insurance_provider_id': item.insurance_provider_id, 'insurance_provider_name': item.insurance_provider_name, 'insurance_id': item.insurance_id, 'adjuster_id': item.adjuster_id, 'adjuster_name': item.adjuster_name, 'insurance_type': item.insurance_type, 'policy_limit': item.policy_limit, 'policylimit_max': item.policylimit_max, 'policy_number': item.policy_number, 'policy_exhausted': item.policy_exhausted });
                //     }
                // });
                // vm.adjuster = _.uniq(angular.copy(vm.adjuster), 'adjuster_id');
                // vm.negotiationInfo.insurance_adjuster_id = vm.adjuster[0];
            }
            if (type == 'adjuster') {
                setValues(defendant, insuranceList, providerId, adjusterId, 'adjuster');
            }
            if (type == 'ins_type') {
                setValues(defendant, insuranceList, providerId, adjusterId, 'ins_type', insurance_type);
                // vm.negotiationInfo.insurance_type = insurance_type;
            }
        }

        function getNegotiation(data) {
            matterDetailsService.getNegotiation(matterId)
                .then(function (response) {
                    if (data == 'fromInsurance') {
                        if (utils.isEmptyObj(vm.negotiationInfo)) {
                            vm.negotiationInfo = {};
                        }
                    } else {
                        vm.negotiationInfo = {};
                    }

                    vm.plaintiffs = angular.copy(response);
                    _.forEach(vm.plaintiffs, function (it) {
                        it.settlement_negotiations = _.sortBy(it.settlement_negotiations, 'modified_date').reverse();
                        if (it.settlement_negotiations == null || it.settlement_negotiations.length == 0) {
                            vm.neg_id = '';
                        }
                        it.open = false;
                        _.forEach(it.settlement_negotiations, function (item) {
                            item.payment = item.payment_status ? item.payment_status == 1 ? 'Accepted' : item.payment_status == 2 ? 'Pending' : item.payment_status == 3 ? 'Rejected' : '-' : '-';
                        });

                    })
                    _.forEach(vm.plaintiffs, function (item) {
                        item.defendants = [];
                        item.negotiation_amount = 0;
                        // if (item.settlement_insurance_details == null || item.settlement_insurance_details.length == 0) {
                        //     item.isDefendant = true;
                        // } else {
                        _.forEach(item.settlement_negotiations, function (ct) {
                            if ((utils.isEmptyVal(ct.policy_limit) && utils.isEmptyVal(ct.policylimit_max))) {
                                ct.policy = "-";
                            } else {
                                var policy_limit_max = utils.isNotEmptyVal(ct.policylimit_max) ? $filter('currency')(angular.copy(ct.policylimit_max), '$', 2) : "-";
                                var policy_limit = utils.isNotEmptyVal(ct.policy_limit) ? $filter('currency')(angular.copy(ct.policy_limit), '$', 2) : "-";
                                ct.policy = policy_limit + '/' + policy_limit_max;
                            }
                            ct.defendant_name = utils.isNotEmptyVal(ct.defendant_name) ? angular.copy(ct.defendant_name) : '-';
                            ct.demanded_amount = ct.demanded_amount ? angular.copy(ct.demanded_amount) : '-';
                            ct.offered_amount = ct.offered_amount ? angular.copy(ct.offered_amount) : '-';
                            ct.adjuster_name = ct.adjuster_name ? ct.adjuster_name : '-';
                            ct.policy = ct.policy ? ct.policy : '-';
                            ct.claim_number = ct.claim_number ? ct.claim_number : '-';
                            ct.policy_exhausted = ct.policy_exhausted ? ct.policy_exhausted : '-';
                            ct.insurance_type = ct.insurance_type ? ct.insurance_type : '-';
                            _.forEach(ct.settlement_calculators, function (data) {
                                if (data.is_final_settlement == 1) {
                                    var total = data.client_recovery ? parseFloat(data.client_recovery) : 0;
                                    item.negotiation_amount += total;
                                }
                            })
                        })
                        // item.negotiation_amount = item.negotiation_amount ? item.negotiation_amount : 0;
                        item.isDefendant = false;
                        _.forEach(vm.defendants, function (currentItem) {
                            item.defendants.push({ 'defendant_id': currentItem.defendantid, 'defendant_name': [currentItem.contactid.firstname, currentItem.contactid.middelname, currentItem.contactid.lastname].join(' '), 'plaintiff_id': item.plaintiff_id });
                        })
                        // _.forEach(item.settlement_insurance_details, function (currentItem) {
                        //     item.defendants.push({ 'defendant_id': currentItem.defendant_id, 'defendant_name': currentItem.defendant_name, 'plaintiff_id': item.plaintiff_id });
                        // })
                        // }
                        if (item.defendants.length > 0) {
                            item.defendants = _.uniq(angular.copy(item.defendants), 'defendant_id');
                        }
                    });
                    vm.insuranceProvider = [];
                    _.forEach(vm.insuranceList, function (item) {
                        item.insurance_provider_id = item.insuranceproviderid ? item.insuranceproviderid.contactid : '';
                        item.insurance_provider_name = item.insuranceproviderid ? [item.insuranceproviderid.firstname, item.insuranceproviderid.middlename, item.insuranceproviderid.lastname].join(' ') : null;
                        item.insurance_id = item.insuranceid;
                        item.adjuster_id = item.adjusterid ? item.adjusterid.contactid : '';
                        item.adjuster_name = item.adjusterid ? [item.adjusterid.firstname, item.adjusterid.middlename, item.adjusterid.lastname].join(' ') : null;
                        item.insurance_type = item.insurancetype;
                        item.policy_limit = item.policylimit;
                        item.policylimit_max = item.policylimit_max;
                        item.claim_number = item.claim_number;
                        item.policy_exhausted = item.policy_exhausted;
                        item.name = item.insurancetype;
                    });
                    var insurance = _.sortBy(vm.insuranceList, 'createddate');
                    vm.insuranceProvider = insurance.reverse();

                    if (utils.isNotEmptyVal(vm.plaintiff_id)) {
                        _.forEach(vm.plaintiffs, function (item) {
                            if (vm.plaintiff_id == item.plaintiff_id) {
                                item.open = true;
                                if (utils.isNotEmptyVal(vm.neg_id)) {
                                    var negRecord = _.find(item.settlement_negotiations, { 'negotiation_id': vm.neg_id });
                                    if (negRecord) {
                                        getCalculations(negRecord, item.plaintiff_name, item);
                                    }
                                    vm.neg_id = '';
                                } else {
                                    vm.hideCalculator = false;
                                    if (data == 'fromInsurance') {
                                        var ins_provider = localStorage.getItem('ins_provider_for_settlement');
                                        _.forEach(vm.insuranceProvider, function (item) {
                                            if (item.insurance_provider_id == ins_provider) {
                                                vm.negotiationInfo.insurance_provider_id = item;
                                                setValues(vm.negotiationInfo.defendent_id, vm.insuranceProvider, item, '', 'insuranceProvider');
                                                setValues(vm.negotiationInfo.defendent_id, vm.insuranceProvider, vm.negotiationInfo.insurance_provider_id, vm.negotiationInfo.insurance_adjuster_id, 'adjuster');
                                            }
                                        })
                                        item.showAdd = true;
                                        vm.hideCalculator = true;
                                    } else {
                                        item.showAdd = false;
                                        if (item.settlement_negotiations.length > 0) {
                                            var negRecord = item.settlement_negotiations[0];
                                            getCalculations(negRecord, item.plaintiff_name, item);
                                        } else {
                                            vm.hideCalculator = true;
                                        }
                                    }
                                }
                            } else {
                                item.open = false;
                            }
                        });

                    }

                });
        }

        function selectAllPlaintiff(isSelected) {
            if (isSelected === true) {
                vm.plaintiffRecoveryGrid.selectedPlaintiff = angular.copy(vm.plaintiffdetails);
            } else {
                vm.plaintiffRecoveryGrid.selectedPlaintiff = [];
            }
        }

        function allPlaintiffSelected() {
            if (utils.isEmptyVal(vm.plaintiffdetails) || vm.plaintiffdetails.length == 0) {
                return false;
            }

            return vm.plaintiffRecoveryGrid.selectedPlaintiff.length === vm.plaintiffdetails.length;
        }

        function isPlaintiffSelected(id) {
            var uids = _.pluck(vm.plaintiffRecoveryGrid.selectedPlaintiff, 'plaintiff_id');
            return uids.indexOf(id) > -1;
        }

        function getsettlementData(printFlag) {
            matterDetailsService.getsettlementData(matterId)
                .then(function (response) {
                    vm.mode = "view"
                    setSettlementDates(response.data);
                    vm.settlementInfo = response.data;
                    vm.settlementInfo.sett_amount = vm.settlementInfo.settlement_amount ? vm.settlementInfo.settlement_amount : '-';
                    vm.settlementHistoryData = response.data.claim_history;
                    vm.settlementInfo.outstandingAmount = '-';
                    getSettlementInfoList(response.data.payment);
                    calSettlementAmount(vm.settlementInfo);
                    if (printFlag) {
                        printPaymentInfoDetails(vm.settlementInfo);
                        vm.printFlag = false;
                    }

                }, function () {
                    notificationService.success('Unable to load Payment Data');
                });
        }

        function viewMemo(data) {
            var modalInstance = $modal.open({
                templateUrl: 'app/matter/matter-details/settlement/view-memo.html',
                controller: 'viewMemoCtrl as viewMemoInfo',
                keyboard: false,
                backdrop: 'static',
                size: 'lg',
                windowClass: 'modalMidiumDialog',
                resolve: {
                    viewMemoInfo: function () {
                        return {
                            selectedItems: angular.copy(data)
                        };
                    }
                }
            });
        }

        function setSettlementDates(data) {
            data.settlement_date = (utils.isNotEmptyVal(data.settlement_date) && data.settlement_date != 0) ? moment.unix(data.settlement_date).utc().format('MM/DD/YYYY') : "";
            data.date_release_client = (utils.isNotEmptyVal(data.date_release_client) && data.date_release_client != 0) ? moment.unix(data.date_release_client).utc().format('MM/DD/YYYY') : "";
            data.date_release_insurance = (utils.isNotEmptyVal(data.date_release_insurance) && data.date_release_insurance != 0) ? moment.unix(data.date_release_insurance).utc().format('MM/DD/YYYY') : "";
            data.closing_statement_date = (utils.isNotEmptyVal(data.closing_statement_date) && data.closing_statement_date != 0) ? moment.unix(data.closing_statement_date).utc().format('MM/DD/YYYY') : ""; //US#8309 convert timestamp into formatted date
            if (utils.isNotEmptyVal(data.retainer_date)) {
                data.retainer_date = data.retainer_date == 0 ? '' : moment.unix(data.retainer_date).utc().format('MM/DD/YYYY');
            }
        }

        function openAddInsModal(mode, allParties) {
            var resolveObj = {
                matterId: matterId,
                mode: mode,
                allParties: allParties,
                selectedItems: undefined
            };
            var modalInstance = $modal.open({
                templateUrl: 'app/matter/matter-details/insaurance/add-edit-insaurance.html',
                controller: 'AddInsauranceCtrl as addInsaurance',
                windowClass: 'medicalIndoDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    addEditInsaurance: function () {
                        return resolveObj;
                    }
                }
            });
            modalInstance.result.then(function () {
                getDefendants('fromInsurance');
            }, function () {
            });
        }

        function getSettlementInfoList(data) {
            vm.settlementInfoGrid.selectedItems.length = 0;
            vm.settlementInfoList = {};

            _.forEach(data, function (singleData) {
                singleData.created_on1 = (utils.isNotEmptyVal(singleData.created_on)) ? moment.unix(singleData.created_on).utc().format('MM/DD/YYYY') : "";
                singleData.modified_on1 = (utils.isNotEmptyVal(singleData.modified_on)) ? moment.unix(singleData.modified_on).utc().format('MM/DD/YYYY') : "";
                singleData.payment_date = (utils.isNotEmptyVal(singleData.payment_date)) ? moment.unix(singleData.payment_date).utc().format('MM/DD/YYYY') : "";
            })
            vm.settlementInfoList.payment = data;
        }

        function addPaymentInfo($event, data) {
            // utils.isNotEmptyVal(data) ? utils.isNotEmptyVal(data.settlement_amount) ? openPopup(data) : notificationService.error('Please specify the settlement amount') : notificationService.error('Please specify the settlement amount')
            var modalInstance = $modal.open({
                templateUrl: 'app/matter/matter-details/settlement/add-payment-info.html',
                controller: 'AddPaymentInfoCtrl as addPaymentInfo',
                windowClass: 'medicalIndoDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    addeditPaymentInfo: function () {
                        return {
                            matterId: matterId,
                            mode: "add",
                            settlementData: data
                        };
                    }
                }
            });

            modalInstance.result.then(function () {
                getsettlementData();
                notificationService.success('Payment information added successfully.');
            }, function () {
                //alert("An error occurred. Please try later");
                //console.log("add-medical-info popup closed");
            });

        }

        function editPaymentInfo(allParties, selectedItems) {
            var modalInstance = $modal.open({
                templateUrl: 'app/ matter/matter-details/settlement/add-payment-info.html',
                controller: 'AddPaymentInfoCtrl as addPaymentInfo',
                windowClass: 'medicalIndoDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    addeditPaymentInfo: function () {
                        return {
                            matterId: matterId,
                            mode: "edit",
                            allParties: allParties,
                            selectedItems: selectedItems
                        };
                    }
                }
            });

            modalInstance.result.then(function () {
                getsettlementData();
                notificationService.success('Payment information updated successfully.');
            }, function () { });
        }

        function editPlaintiffRecovery(data) {
            var modalInstance = $modal.open({
                templateUrl: 'app/matter/matter-details/settlement/edit-plaintiff-recovery.html',
                controller: 'PlaintiffRecoveryCtrl as plaintiffRecovery',
                windowClass: 'medicalIndoDialog edit-recovery-popup-top',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    plaintiffRecoveryDetails: function () {
                        return {
                            matterId: matterId,
                            selectedItem: data
                        };
                    }
                }
            });

            modalInstance.result.then(function () {
                getsettlementData();
                getPlaintiffDetails();
                vm.plaintiffRecoveryGrid.selectedPlaintiff = [];
                notificationService.success("Plaintiff Recovery Details Edited successfully");
            }, function () { });
        }

        function deletePlaintiffRecovery(data) {
            var dataRequests = [];
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                var id = data[0].settlement_calculator_id.split(",");
                id.forEach(function (element) {
                    dataRequests.push(matterDetailsService.deleteCalculator(element))
                });
                $q.all(dataRequests)
                    .then(function (response) {
                        //if (response.data) {
                        getsettlementData();
                        getPlaintiffDetails();
                        vm.plaintiffRecoveryGrid.selectedPlaintiff = [];
                        notificationService.success("Plaintiff Recovery Details Deleted successfully");
                        // }
                    }), function (error) {
                        notificationService.error('Unable to delete')
                    }
            });
        }

        /**
         * view comment information for selected payemnt information
         */
        function viewPayemntMemo(selectedItems) {
            var modalInstance = $modal.open({
                templateUrl: 'app/matter/matter-details/settlement/view-comment.html',
                controller: 'viewCommentCtrl as viewCommentInfo',
                keyboard: false,
                size: 'lg',
                windowClass: 'modalMidiumDialog',
                resolve: {
                    viewCommentInfo: function () {
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
            vm.settlementInfoGrid.selectedItems = [];
        });

        function deletePaymentInfo(selectedItems) {

            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {

                var selectedIds = _.pluck(selectedItems, 'id');
                matterDetailsService.deletePaymentRecords(selectedIds)
                    .then(function () {
                        //alert("deleted successfully");
                        notificationService.success('Payment information deleted successfully.');
                        getsettlementData();
                    });

            });
        }

        function setDates(data) {
            data.settlement_date = (utils.isEmptyVal(data.settlement_date)) ? "" : utils.getUTCTimeStamp(data.settlement_date);
            data.date_release_client = (utils.isEmptyVal(data.date_release_client)) ? "" : utils.getUTCTimeStamp(data.date_release_client);
            data.date_release_insurance = (utils.isEmptyVal(data.date_release_insurance)) ? "" : utils.getUTCTimeStamp(data.date_release_insurance);
            data.closing_statement_date = (utils.isEmptyVal(data.closing_statement_date)) ? "" : utils.getUTCTimeStamp(data.closing_statement_date);
        }

        function caldecimalPlaces(num) {
            var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
            if (!match) {
                return 0;
            }
            return Math.max(0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0));
        }

        function updateSettlementInfo(settlementData) {
            //Bug#8347
            // if (utils.isNotEmptyVal(settlementData.claim_representative)) {
            //     if (settlementData.claim_representative.contactid == undefined) {
            //         notificationService.error("Invalid contact selected");
            //         return;
            //     }
            // }
            if (utils.isNotEmptyVal(settlementData.demand)) {
                var decimalPlaces = caldecimalPlaces(settlementData.demand);
                if (settlementData.demand.indexOf(".") >= 0) {
                    if (decimalPlaces == 0 || settlementData.demand.indexOf(".") == 0) {
                        notificationService.error("invalid demand amount");
                        return false;
                    }
                }
            }

            if (utils.isNotEmptyVal(settlementData.offer)) {
                var decimalPlaces = caldecimalPlaces(settlementData.offer);
                if (settlementData.offer.indexOf(".") >= 0) {
                    if (decimalPlaces == 0 || settlementData.offer.indexOf(".") == 0) {
                        notificationService.error("invalid offer amount");
                        return false;
                    }
                }
            }

            // vm.mode = 'view';
            var postData = angular.copy(settlementData);
            if (utils.isNotEmptyVal(settlementData.claim_representative)) {
                postData.claim_representative = settlementData.claim_representative.contact_id;
            }
            setDates(postData);
            matterDetailsService.updateSettlementInfo(matterId, postData)
                .then(function () {
                    getsettlementData();
                    vm.showDetails = false;
                    notificationService.success('Settlement data saved successfully.');
                }, function () {
                    notificationService.error('An error occurred. Please try later.');
                });
        }


        function downloadPaymentInfo() {
            matterDetailsService.downloadPaymentInfo(matterId)
                .then(function (response) {
                    var filename = "Settlement_Payment_list";
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

        function printPaymentInfo() {
            vm.printFlag = true;
            //vm.mode="view" 
            getsettlementData(vm.printFlag);

        }

        function printPaymentInfoDetails() {
            var matterName = '';
            var fileNumber = '';
            matterDetailsService.getMatterInfo(matterId)
                .then(function (response) {
                    matterName = response.data[0].matter_name;
                    fileNumber = response.data[0].file_number;
                    settlementInfoHelper.printPaymentInfo(matterName, fileNumber, vm.settlementInfoGrid.selectedItems, vm.settlementInfoList.payment, vm.settlementInfo);

                }, function () {
                    //notificationService.error('An error occurred. Please try later.');
                })

        }


    }

})();

//add Payment info modal controller
(function () {
    angular
        .module('cloudlex.matter')
        .controller('AddPaymentInfoCtrl', AddPaymentInfoCtrl);

    AddPaymentInfoCtrl.$inject = ['$modalInstance', 'matterFactory', 'matterDetailsService', 'addeditPaymentInfo', 'notification-service', 'contactFactory', 'globalConstants'];

    function AddPaymentInfoCtrl($modalInstance, matterFactory, matterDetailsService, addeditPaymentInfo, notificationService, contactFactory, globalConstants) {
        var vm = this;
        var contacts = [];

        var matterId = addeditPaymentInfo.matterId;
        var pageMode = addeditPaymentInfo.mode; //page mode : add, edit
        if (pageMode == "edit") {
            var paymentinfoedit = addeditPaymentInfo.selectedItems[0];
            _.forEach(paymentinfoedit, function (val, item) {
                val == " - " ? paymentinfoedit[item] = "" : paymentinfoedit[item] = val;
            });
        }
        var selectedPaymentInfo = pageMode === 'edit' ?
            angular.copy(addeditPaymentInfo.selectedItems[0]) : undefined;
        vm.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;

        vm.paymentInfo = {};
        vm.savePaymentInfo = savePaymentInfo;
        vm.close = closeModal;
        vm.getContacts = getContacts;
        vm.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;
        vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
        vm.openDatePicker = openDatePicker;
        vm.addNewContact = addNewContact;
        vm.isDatesValid = isDatesValid;
        vm.JavaFilterAPIForContactList = true;
        function checkIfEnterKeyWasPressed(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
            return true;

        };
        function isDatesValid() {

            var dateValidateError = false;

            $('body').find('.error').each(function () {
                if ($(this).css("display") == "block") {
                    dateValidateError = true;
                }
            })


            if (dateValidateError == true) {
                return true;
            } else {
                return false;
            }


        }



        //SAF for initialization
        (function () {
            vm.pageMode = pageMode; //assigned to use mode to hide/show elements
            if (angular.isDefined(selectedPaymentInfo)) {
                setPaymentlInfo(selectedPaymentInfo);
            }
            vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));
            vm.datePicker = {};
        })();




        function setPaymentlInfo(selectedPaymentInfo) {
            vm.paymentInfo = selectedPaymentInfo;
        }

        function savePaymentInfo(paymentInfo) {
            var newPaymentInfo = angular.copy(paymentInfo);
            newPaymentInfo.matter_id = matterId;

            newPaymentInfo.payment_date = (utils.isEmptyVal(newPaymentInfo.payment_date)) ? "" : utils.getUTCTimeStamp(newPaymentInfo.payment_date);

            switch (pageMode) {
                case "add":
                    addPayemntRecord(newPaymentInfo);
                    break;
                case "edit":
                    editPaymentRecord(newPaymentInfo);
                    break;
            }


        }

        function addPayemntRecord(paymentInfo) {
            var newPaymentInfo = setIdsSaving(paymentInfo);

            //Check valid contacts 
            if (utils.isEmptyVal(paymentInfo.payee) || utils.isNotEmptyVal(paymentInfo.payee.contactid)) {
                paymentInfo.payee;
            } else {
                return notificationService.error("Invalid Contact Selected");
            }
            if (utils.isEmptyVal(paymentInfo.payer) || utils.isNotEmptyVal(paymentInfo.payer.contactid)) {
                paymentInfo.payer;
            } else {
                return notificationService.error("Invalid Contact Selected");
            }
            matterDetailsService.savePaymentRecord(newPaymentInfo)
                .then(function (response) {
                    $modalInstance.close();
                }, function (error) {
                    //alert("unable to add");
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function editPaymentRecord(paymentInfo) {
            var newPaymentInfo = setIdsSaving(paymentInfo);

            //Check valid contacts 
            if (utils.isEmptyVal(paymentInfo.payee) || utils.isNotEmptyVal(paymentInfo.payee.contact_id)) {
                paymentInfo.payee;
            } else {
                return notificationService.error("Invalid Contact Selected");
            }
            if (utils.isEmptyVal(paymentInfo.payer) || utils.isNotEmptyVal(paymentInfo.payer.contact_id)) {
                paymentInfo.payer;
            } else {
                return notificationService.error("Invalid Contact Selected");
            }
            matterDetailsService.editPaymentRecord(newPaymentInfo)
                .then(function (response) {
                    $modalInstance.close();
                }, function (error) {
                    //alert("unable to edit");
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function setIdsSaving(paymentInfo) {
            var newPaymentInfo = angular.copy(paymentInfo); //create clone to cut the two way binding
            newPaymentInfo.payee_contactid = newPaymentInfo.payee ? newPaymentInfo.payee.contact_id : "0";
            newPaymentInfo.payer_contactid = newPaymentInfo.payer ? newPaymentInfo.payer.contact_id : "0"; //newPaymentInfo.providerid.contactid;
            return newPaymentInfo;
        }

        function closeModal(newMedicalInfo) {
            $modalInstance.dismiss();
        }

        function getContacts(contactName, searchItem) {
            var postObj = {};
            postObj.type = globalConstants.settlementTyps;
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            //postObj = matterFactory.setContactType(postObj);
            postObj.page_Size = 250


            return matterFactory.getContactsByName(postObj, vm.JavaFilterAPIForContactList)
                .then(function (response) {
                    var data = response.data;
                    matterDetailsService.setDataPropForContactsFromOffDrupalToNormalContact(data);
                    matterDetailsService.setNamePropForContactsOffDrupal(data);
                    _.forEach(data, function (contact) {
                        contact.name = utils.removeunwantedHTML(contact.first_name) + ' ' + utils.removeunwantedHTML(contact.last_name);
                    });
                    contacts = data;
                    return data;
                });
        }

        //in our display value and model value are different for the input box
        //therefore we are formatting our display value based on the model value of the input box
        function formatTypeaheadDisplay(contact) {
            if (angular.isUndefined(contact) || utils.isEmptyString(contact)) {
                return undefined;
            }
            var firstname = angular.isUndefined(contact.firstname) ? '' : contact.firstname;
            var lastname = angular.isUndefined(contact.lastname) || (contact.lastname == null) ? '' : contact.lastname;
            return (contact.name || (firstname + " " + lastname));

        }

        function openDatePicker($event, model) {
            vm.datePicker[model] = true;
            $event.preventDefault();
            $event.stopPropagation();
            angular.forEach(vm.datePicker, function (val, key) {
                vm.datePicker[key] = (key === model);
            });
        }

        // add new contact
        function addNewContact(model) {
            var selectedType = {};
            selectedType.type = 'settPayeePayer';
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                response['firstname'] = response.first_name;
                response['lastname'] = response.last_name;
                response['contactid'] = (response.contact_id).toString();
                vm.paymentInfo[model] = response;
            }, function () { });
        }

    }

})();

/**
 * view comment controller for payment information
 */

//add payment info modal controller
(function () {
    angular
        .module('cloudlex.matter')
        .controller('viewCommentCtrl', viewCommentCtrl);

    viewCommentCtrl.$inject = ['$rootScope', '$modalInstance', 'viewCommentInfo', 'notification-service'];

    function viewCommentCtrl($rootScope, $modalInstance, viewCommentInfo, notificationService) {
        var vm = this;
        vm.memo = utils.isNotEmptyVal(viewCommentInfo.selectedItems[0]) ? viewCommentInfo.selectedItems[0].memo : viewCommentInfo.selectedItems.memo;
        vm.close = function () {
            $modalInstance.close();
            $rootScope.$broadcast('unCheckSelectedItems');
        }
    }

})();
// view memo
(function () {
    angular
        .module('cloudlex.matter')
        .controller('viewMemoCtrl', viewMemoCtrl);

    viewMemoCtrl.$inject = ['$modalInstance', 'viewMemoInfo'];

    function viewMemoCtrl($modalInstance, viewMemoInfo) {
        var vm = this;
        vm.memo = utils.isNotEmptyVal(viewMemoInfo.selectedItems.memo) ? viewMemoInfo.selectedItems.memo : '';
        vm.close = function () {
            $modalInstance.close();
        }
    }

})();

//settlement Helper
(function (angular) {

    angular.module('cloudlex.matter')
        .factory('settlementInfoHelper', settlementInfoHelper);

    settlementInfoHelper.$inject = ['globalConstants', '$filter'];

    function settlementInfoHelper(globalConstants, $filter) {
        return {
            settlementInfoGrid: _settlementInfoGrid,
            printPaymentInfo: _printPaymentInfo,
            setNames: _setNames,
            setEditedContactNames: _setEditedContactNames,
            setEdited: _setEdited,
            plaintiffRecoveryGrid: _plaintiffRecoveryGrid
        };

        function _getFiltersForPrint(matterName, fileNumber, settlementData) {
            // US#8473 add headers for print
            var claim_representativeName = utils.isEmptyVal(settlementData.claim_representative.firstname) ? '' : settlementData.claim_representative.firstname;
            claim_representativeName += " ";
            claim_representativeName += utils.isEmptyVal(settlementData.claim_representative.lastname) ? '' : settlementData.claim_representative.lastname;
            var filtersForPrint = {
                'Matter Name': matterName,
                'File #': fileNumber,
                'Settlement Date': utils.isNotEmptyVal(settlementData.settlement_date) ? settlementData.settlement_date : '',
                'Settlement Amount': utils.isNotEmptyVal(settlementData.settlement_amount) ? $filter('currency')(settlementData.settlement_amount, '$', 2) : '',
                'Settlement Breakdown': utils.isNotEmptyVal(settlementData.settlement_breakdown) ? settlementData.settlement_breakdown : '',
                'Date Release To Insurance ': utils.isNotEmptyVal(settlementData.date_release_insurance) ? settlementData.date_release_insurance : '',
                'Date Release To Client': utils.isNotEmptyVal(settlementData.date_release_client) ? settlementData.date_release_client : '',
                'Total Paid': utils.isNotEmptyVal(settlementData.totalPaid) ? $filter('currency')(settlementData.totalPaid, '$', 2) : '',
                'Outstanding Amount ': utils.isNotEmptyVal(settlementData.outstandingAmount) ? currencyFormat(parseFloat(settlementData.outstandingAmount).toFixed(2)) : '',
                // 'Retainer Date': utils.isNotEmptyVal(settlementData.retainer_date) ? settlementData.retainer_date : '',
                // 'Retainer #': utils.isNotEmptyVal(settlementData.retainer_no) ? settlementData.retainer_no : '',
                // 'Closing statement Date': utils.isNotEmptyVal(settlementData.closing_statement_date) ? settlementData.closing_statement_date : '',
                // 'Closing statement #': utils.isNotEmptyVal(settlementData.closing_statement_no) ? settlementData.closing_statement_no : '',
                // 'Claim Representative': utils.isNotEmptyVal(claim_representativeName) ? claim_representativeName : '',
                // 'Demand': utils.isNotEmptyVal(settlementData.demand) ? $filter('currency')(settlementData.demand, '$', 2) : '',
                // 'Offer': utils.isNotEmptyVal(settlementData.offer) ? $filter('currency')(settlementData.offer, '$', 2) : '',

            }
            return filtersForPrint;
        }

        function _printPaymentInfo(matterName, fileNumber, selectedItem, paymentRecodList, settlementData) {
            var priPaymentRecodList = angular.copy(paymentRecodList);
            var filtersForPrint = _getFiltersForPrint(matterName, fileNumber, settlementData);
            var headers = _settlementInfoGrid();
            headers = _getPropsFromHeaders(headers);

            var printPage = _getPrintPage(filtersForPrint, headers, priPaymentRecodList);
            window.open().document.write(printPage);
        }

        function _getPropsFromHeaders(headers) {
            var displayHeaders = [];
            _.forEach(headers, function (head) {
                _.forEach(head.field, function (field) {
                    if (utils.isNotEmptyVal(field.printDisplay)) {
                        displayHeaders.push({
                            prop: field.prop,
                            display: field.printDisplay
                        });
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

        function _getPrintPage(filters, headers, priPaymentRecodList) {
            var html = "<html><title>Settlement Information </title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Settlement Information </h1><div></div>";
            html += "<body>";

            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<tr>";
            angular.forEach(filters, function (val, key) {
                if (key == "Settlement Breakdown") {
                    html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'>";
                    html += "<label><strong>" + key + " : </strong></label>";
                    html += "<span style='padding:5px; '>";
                    if (val) {
                        html += "<pre style='font-family: calibri !important;  font-size: 8pt !important;color: black;font-size: 100%;background-color: #fff;border: 0;padding: 0; white-space: pre-wrap;'>  " + utils.removeunwantedHTML(val) + '</pre></span>';
                    } else {
                        html += "</span>";
                    }
                    html += "</div>";
                } else {
                    html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'>";
                    html += "<label><strong>" + key + " : </strong></label>";
                    html += "<span style='padding:5px; '>  " + utils.removeunwantedHTML(val) + '</span>';
                    html += "</div>";
                }
            });
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "</tr>";
            html += '<tr>';
            angular.forEach(headers, function (header) {
                //html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + header.display + "</th>";
                if (header.prop == 'amount_recieved') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px;text-align:right; '>" + header.display + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + header.display + "</th>";
                }
            });
            html += '</tr>';


            angular.forEach(priPaymentRecodList, function (item) {
                html += '<tr>';
                angular.forEach(headers, function (header) {
                    item[header.prop] = (_.isNull(item[header.prop]) || angular.isUndefined(item[header.prop]) ||
                        utils.isEmptyString(item[header.prop])) ? " - " : item[header.prop];
                    if (header.prop == 'amount_recieved') {
                        item[header.prop] = (item[header.prop] == " - ") ? "0" : item[header.prop];
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" +
                            $filter('currency')(item[header.prop], '$', 2) + "</td>";
                    } else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;min-width: 90px;'>" +
                            '<pre style="font-family: calibri!important;white-space: pre-wrap !important;border-radius: 0px;border: 0px;padding: 0;word-break: break-word;">' + utils.removeunwantedHTML(item[header.prop]) + '</pre>' + "</td>";
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

        function _settlementInfoGrid() {
            return [{
                field: [{
                    html: '<span data-ng-show="data.memo" class ="sprite default-view-comment" ng-click = "settlement.viewPayemntMemo(data)" tooltip="View Memo" tooltip-append-to-body="true" tooltip-placement="right"></span>',
                    inline: true,
                    cursor: true,

                }],
                dataWidth: "4"
            },
            {
                field: [{

                    prop: 'payment_date',
                    printDisplay: 'Payment Date',
                    compile: true,
                    inline: true,
                    cursor: true

                }],
                displayName: 'Payment Date',
                dataWidth: "10"
            },

            {
                field: [{
                    prop: 'cheque_number',
                    printDisplay: 'Check #',
                    compile: true,
                    cursor: true
                },
                {
                    prop: 'bank_details',
                    printDisplay: 'Bank Details',
                    compile: true,
                    cursor: true
                },
                ],
                displayName: 'Check #, Bank Details',
                dataWidth: "15"
            },
            {
                field: [{
                    prop: 'payer_name',
                    printDisplay: 'Payer',
                    onClick: "settlement.openContactCard(data.payer)",
                    compile: true,
                    cursor: true,
                    underline: true
                }],
                displayName: 'Payer',
                dataWidth: "12"

            },
            {
                field: [{
                    prop: 'payee_name',
                    onClick: "settlement.openContactCard(data.payee)",
                    printDisplay: 'Payee',
                    cursor: true,
                    compile: true,
                    underline: true
                }],
                displayName: 'Payee',
                dataWidth: "12"
            },
            {
                field: [{
                    prop: 'amount_recieved',
                    printDisplay: 'Amount Received',
                    html: '<span tooltip="${{data.amount_recieved | number:2}}" tooltip-append-to-body="true" tooltip-placement="bottom">${{data.amount_recieved | number:2}}</span>'
                },],
                displayName: 'Amount Received',
                dataWidth: "12"
            },
            {
                field: [{
                    prop: 'created_on1',
                    printDisplay: 'Added On'
                },],
                displayName: 'Added On',
                dataWidth: "10"

            },
            {
                field: [{
                    prop: 'created_by_name',
                    printDisplay: 'Added By'
                },],
                displayName: 'Added By',
                dataWidth: "10"

            },
            {
                field: [{
                    prop: 'modified_on1',
                    printDisplay: 'Last Updated'
                },],
                displayName: 'Last Updated',
                dataWidth: "10"

            },
            {
                field: [{
                    prop: 'memo',
                    printDisplay: 'Memo'
                },],
                displayName: 'Memo',
                dataWidth: "1",
                isComment: "5"

            }
            ];
        }

        function _plaintiffRecoveryGrid() {
            return [
                {
                    field: [{

                        prop: 'plaintiff_name',
                        printDisplay: 'Plaintiff Name',
                        onClick: "settlement.openContactCardOnRecovery(data)",
                        compile: true,
                        inline: true,
                        cursor: true,
                        underline: true

                    }],
                    displayName: 'Plaintiff Name',
                    dataWidth: "16"
                },

                {
                    field: [{
                        prop: 'client_recovery_amount',
                        printDisplay: 'Recovery Amount',
                        html: '<span tooltip="${{data.client_recovery_amount | number:2}}" tooltip-append-to-body="true" tooltip-placement="bottom">${{data.client_recovery_amount | number:2}}</span>',
                        compile: true,
                        cursor: true
                    }],
                    displayName: 'Recovery Amount',
                    dataWidth: "16"
                },
                {
                    field: [{
                        prop: 'retainer_date',
                        printDisplay: 'Retainer Date',
                        compile: true,
                        cursor: true
                    }],
                    displayName: 'Retainer Date',
                    dataWidth: "16"

                },
                {
                    field: [{
                        prop: 'retainer_no',
                        printDisplay: 'Retainer #',
                        cursor: true,
                        compile: true,
                    }],
                    displayName: 'Retainer #',
                    dataWidth: "16"
                },
                {
                    field: [{
                        prop: 'closing_statement_date',
                        printDisplay: 'Closing Statement Date'
                    },],
                    displayName: 'Closing Statement Date',
                    dataWidth: "16"

                },
                {
                    field: [{
                        prop: 'closing_statement_no',
                        printDisplay: 'Closing Statement #'
                    },],
                    displayName: 'Closing Statement #',
                    dataWidth: "17"

                }
            ];
        }

        function _setNames(singleData) {
            if (utils.isNotEmptyVal(singleData.payee)) {
                var payeelastname = angular.isUndefined(singleData.payee.lastname) || (singleData.payee.lastname == null) ? '' : singleData.payee.lastname;
                singleData.payee_name = singleData.payee.firstname + " " + payeelastname;
            } else {
                singleData.payee_name = '';
            }
            if (utils.isNotEmptyVal(singleData.payer)) {
                var payerlastname = angular.isUndefined(singleData.payer.lastname) || (singleData.payer.lastname == null) ? '' : singleData.payer.lastname;
                singleData.payer_name = singleData.payer.firstname + " " + payerlastname;
            } else {
                singleData.payer_name = '';
            }

        }

        function _setEditedContactNames(payemntInfo, contact) {

            if (utils.isNotEmptyVal(payemntInfo.payee) &&
                payemntInfo.payee.contactid === contact.contactid) {
                payemntInfo.payee.firstname = contact.firstname;
                payemntInfo.payee.lastname = contact.lastname;
                payemntInfo.payee.edited = true;
            }

            if (utils.isNotEmptyVal(payemntInfo.payer) &&
                payemntInfo.payer.contactid === contact.contactid) {
                payemntInfo.payer.firstname = contact.firstname;
                payemntInfo.payer.lastname = contact.lastname;
                payemntInfo.payer.edited = true;
            }

            if (utils.isNotEmptyVal(payemntInfo.claim_representative) &&
                payemntInfo.claim_representative.contactid === contact.contactid) {
                payemntInfo.claim_representative.firstname = contact.firstname;
                payemntInfo.claim_representative.lastname = contact.lastname;
                payemntInfo.claim_representative.edited = true;
            }

        }

        function _setEdited(payemntInfo, contact) {

            if (utils.isNotEmptyVal(payemntInfo.payee)) {
                payemntInfo.payee.edited = payemntInfo.payee.contactid === contact.contactid ?
                    false : payemntInfo.payee.edited;
            }

            if (utils.isNotEmptyVal(payemntInfo.payer)) {
                payemntInfo.payer.edited = payemntInfo.payer.contactid === contact.contactid ?
                    false : payemntInfo.payer.edited;
            }

            if (utils.isNotEmptyVal(payemntInfo.claim_representative)) {
                payemntInfo.claim_representative.edited = payemntInfo.claim_representative.contactid === contact.contactid ?
                    false : payemntInfo.claim_representative.edited;
            }

        }

    }

})(angular);

//edit Plaintiff recovery
(function () {
    angular
        .module('cloudlex.matter')
        .controller('PlaintiffRecoveryCtrl', PlaintiffRecoveryCtrl);

    PlaintiffRecoveryCtrl.$inject = ['$modalInstance', 'matterDetailsService', 'plaintiffRecoveryDetails'];

    function PlaintiffRecoveryCtrl($modalInstance, matterDetailsService, plaintiffRecoveryDetails) {
        var vm = this;
        var matterId = plaintiffRecoveryDetails.matterId;
        vm.selectedRecord = angular.copy(plaintiffRecoveryDetails.selectedItem[0]);
        vm.closeModal = closeModal;
        vm.openDatePicker = openDatePicker;
        vm.isDatesValid = isDatesValid;
        vm.saveDetails = saveDetails;

        function isDatesValid() {
            if ($('#retError').css("display") == "block" || $('#closeStateError').css("display") == "block") {
                return true;
            } else {
                return false;
            }
        }




        //SAF for initialization
        (function () {
            vm.datePicker = {};
        })();

        function closeModal() {
            $modalInstance.dismiss();
        }

        function saveDetails(data) {
            var copyDetails = angular.copy(data);
            var finalObj = {};
            finalObj.plaintiff_id = copyDetails.plaintiff_id;
            finalObj.retainer_no = copyDetails.retainer_no ? copyDetails.retainer_no : null;
            finalObj.retainer_date = copyDetails.retainer_date ? utils.getUTCTimeStamp(copyDetails.retainer_date) : null;
            finalObj.closing_statement_no = copyDetails.closing_statement_no ? copyDetails.closing_statement_no : null;
            finalObj.closing_statement_date = copyDetails.closing_statement_date ? utils.getUTCTimeStamp(copyDetails.closing_statement_date) : null;
            matterDetailsService.saveDetails(finalObj)
                .then(function (response) {
                    if (response) {
                        $modalInstance.close(true);
                    }
                })
        }

        function openDatePicker($event, model) {
            vm.datePicker[model] = true;
            $event.preventDefault();
            $event.stopPropagation();
            angular.forEach(vm.datePicker, function (val, key) {
                vm.datePicker[key] = (key === model);
            });
        }


    }

})();

