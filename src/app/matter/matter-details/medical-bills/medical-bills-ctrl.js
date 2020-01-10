(function () {
    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('MedicalBillsCtrl', MedicalBillsCtrl);

    MedicalBillsCtrl.$inject = ['$scope', '$rootScope', '$stateParams', '$timeout', '$modal', 'medicalBillHelper',
        'matterDetailsService', 'notification-service', 'modalService', 'contactFactory', 'masterData', 'mailboxDataService', 'matterFactory'
    ];

    function MedicalBillsCtrl($scope, $rootScope, $stateParams, $timeout, $modal, medicalBillHelper,
        matterDetailsService, notificationService, modalService, contactFactory, masterData, mailboxDataService, matterFactory) {
        var vm = this;
        var matterId = $stateParams.matterId;

        vm.medicalBillList = [];
        vm.display = { refreshGrid: false };

        vm.openContactCard = openContactCard;
        vm.filterMedicalBills = filterMedicalBills;
        vm.addMedicalBillsInfo = addMedicalBillsInfo;
        vm.deleteMedicalBills = deleteMedicalBills;


        vm.selectAllUsers = selectAllUsers;
        vm.allUsersSelected = allUsersSelected;
        vm.isUserSelected = isUserSelected;
        vm.medicalBillList = {};
        vm.medicalBillList.medicalbills = [];
        vm.printMedicalBill = printMedicalBill;
        vm.downloadMedicalBill = downloadMedicalBill;
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.viewMedicalInfo = viewMedicalInfo;
        vm.linkUploadDoc = linkUploadDoc;
        vm.unlinkDocument = unlinkDocument;
        vm.medicalBillsTotal = {};
        vm.getSortByLabel = getSortByLabel;
        vm.showValidationForAdjusted = false;
        vm.showValidationForAdjustment = false;




        function openContactCard(contact) {

            if (utils.isEmptyVal(contact)) {
                return;
            }
            var associatedContactId = '';
            var associatedContactType = '';
            if (utils.isNotEmptyVal(contact.plaintiff)) {
                associatedContactId = contact.plaintiff.contact_id;
                associatedContactType = contact.plaintiff.contact_type;
            } else if (utils.isNotEmptyVal(contact.otherParty)) {
                associatedContactId = contact.otherParty.contact_id;
                associatedContactType = contact.otherParty.contact_type;
            } else if (utils.isNotEmptyVal(contact.defendant)) {
                associatedContactId = contact.defendant.contact_id;
                associatedContactType = contact.defendant.contact_type;
            } else {
                associatedContactId = contact.contact_id;
                associatedContactType = contact.contact_type;
            }
            contactFactory.displayContactCard1(associatedContactId, contact.edited, associatedContactType);

            _.forEach(vm.medicalBillList.medicalbills, function (medicalBill) {
                medicalBillHelper.setEdited(medicalBill, contact);
            });
        }

        $scope.$on("contactCardEdited", function (e, editedContact) {
            var contactObj = editedContact;
            var medicalBills = angular.copy(vm.medicalBillList.medicalbills);
            vm.medicalBillList.medicalbills = [];
            _.forEach(medicalBills, function (medicalBill) {
                medicalBillHelper.setEditedContactName(medicalBill, contactObj);
                medicalBillHelper.setNames(medicalBill);
            });

            vm.medicalBillList.medicalbills = medicalBills;
        });

        // US13403: Export MedicalBill List(PHP to Java)
        function downloadMedicalBill(plaintiffid) {
            var show = utils.isNotEmptyVal(plaintiffid) ? plaintiffid.id : 'all';
            var partyRole = utils.isNotEmptyVal(plaintiffid) ? plaintiffid.selectedPartyType : '';
            var sortBy = vm.sortby;
            matterDetailsService.downloadMedicalBill(matterId, show, sortBy, partyRole)
                .then(function (response) {
                    var filename = "MedicalBill_List";
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

        function printMedicalBill(plaintiffArray, plaintiffid) {
            var matterName = '';
            var plaintiffName = '';
            var fileNumber = '';
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
                    if (utils.isNotEmptyVal(vm.medicalBillsTotal)) {
                        _.forEach(vm.medicalBillsTotal.billamount, function (data) {
                            data.billamount = (_.isNull(data.billamount) || angular.isUndefined(data.billamount)) ? data.billamount = "0" : data.billamount;
                        })
                        _.forEach(vm.medicalBillsTotal.adjustedamount, function (data) {
                            data.adjustedamount = (_.isNull(data.adjustedamount) || angular.isUndefined(data.adjustedamount)) ? data.adjustedamount = "0" : data.adjustedamount;
                        })
                        _.forEach(vm.medicalBillsTotal.paidamount, function (data) {
                            data.paidamount = (_.isNull(data.paidamount) || angular.isUndefined(data.paidamount)) ? data.paidamount = "0" : data.paidamount;
                        })
                        _.forEach(vm.medicalBillsTotal.outstandingamount, function (data) {
                            data.outstandingamount = (_.isNull(data.outstandingamount) || angular.isUndefined(data.outstandingamount)) ? data.outstandingamount = "0" : data.outstandingamount;
                        })

                    } else {
                        vm.medicalBillsTotal = {};
                    }

                    var show = plaintiffid || "all";
                    var sortBy = vm.getSortByLabel(vm.sortby);
                    var sortKey = vm.sortKey;
                    medicalBillHelper.printMedicalBill(matterName, fileNumber, plaintiffName, sortBy, vm.medicalBillGrid.selectedItems, vm.medicalBillList.medicalbills, vm.medicalBillsTotal, sortKey);
                }, function () {
                    //notificationService.error('An error occurred. Please try later.');
                });
        }


        (function () {
            window.parent.document.title = "Welcome to CloudLex";
            $rootScope.$emit('favicon', "favicon.ico");
            //initGrid();
            vm.medicalBillGrid = {
                headers: medicalBillHelper.medicalBillGrid(),
                selectedItems: []
            };

            vm.sorts = [
                { key: 1, name: "Start Date of Service Asc", keyname: "service_start_date_utc" },
                { key: 2, name: "Start Date of Service Desc", keyname: "-service_start_date_utc" }
            ];
            vm.sortby = utils.isNotEmptyVal(sessionStorage.getItem('medicalBillsSortBy')) ? sessionStorage.getItem('medicalBillsSortBy') : "1";
            vm.sortKey = utils.isNotEmptyVal(sessionStorage.getItem('medicalBillsSortByKeyName')) ? sessionStorage.getItem('medicalBillsSortByKeyName') : "service_start_date_utc";
            vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));
            getMedicalBillsInfo(matterId);
            getUserEmailSignature();
            vm.matterInfo = matterFactory.getMatterData(matterId);
        })();

        function getSortByLabel(sortBy) {
            if (utils.isEmptyVal(sortBy)) {
                return " - ";
            }

            var selSort = _.find(vm.sorts, function (sort) {
                return sort.key == sortBy;
            });
            return selSort.name;
        }

        //sort by filters
        vm.applySortByFilter = function (sortBy) {
            vm.sortby = sortBy;
            sessionStorage.setItem('medicalBillsSortBy', vm.sortby);

            vm.sortKey = vm.sorts[sortBy - 1].keyname;
            sessionStorage.setItem('medicalBillsSortByKeyName', vm.sortKey);
        }

        function selectAllUsers(isSelected) {
            if (isSelected === true) {
                vm.medicalBillGrid.selectedItems = angular.copy(vm.medicalBillList.medicalbills);
            } else {
                vm.medicalBillGrid.selectedItems = [];
            }
        }

        function allUsersSelected() {
            if (utils.isEmptyVal(vm.medicalBillList) || vm.medicalBillList.medicalbills.length == 0) {
                return false;
            }

            return vm.medicalBillGrid.selectedItems.length === vm.medicalBillList.medicalbills.length;
        }

        function isUserSelected(medicaltreatmentid) {
            var uids = _.pluck(vm.medicalBillGrid.selectedItems, 'medicalbillid');
            return uids.indexOf(medicaltreatmentid) > -1;
        }


        // get medical information based on matter id and plaintiff
        function getMedicalBillsInfo(matterId, plaintiffId, selectedPartyType) {
            vm.medicalBillGrid.selectedItems.length = 0;
            var show = plaintiffId || 'all';
            matterDetailsService.getMedicalBillsInfo(matterId, show, selectedPartyType)
                .then(function (response) {
                    var data = response;
                    //vm.medicalBillList = data.medicalbills;
                    vm.medicalBillsTotal = {};
                    //US#8769 pluck amount fields to be calculated
                    if (utils.isNotEmptyVal(data)) {
                        vm.Adjustments = [];
                        var adjustedamountCal = _.pluck(data, 'adjusted_amount');
                        var billamountCal = _.pluck(data, 'bill_amount');
                        var paidamountCal = _.pluck(data, 'paid_amount');
                        var outstandingamountCal = _.pluck(data, 'outstanding_amount');
                        //convert array into object for filters in html
                        vm.medicalBillsTotal.adjustedamount = adjustedamountCal.map(function (e) { return { adjustedamount: e } });
                        vm.medicalBillsTotal.billamount = billamountCal.map(function (e) { return { billamount: e } });
                        vm.medicalBillsTotal.paidamount = paidamountCal.map(function (e) { return { paidamount: e } });
                        vm.medicalBillsTotal.outstandingamount = outstandingamountCal.map(function (e) { return { outstandingamount: e } });
                    }


                    vm.medicalBillList.medicalbills = [];

                    _.forEach(data, function (singleData) {
                        medicalBillHelper.setNames(singleData);

                        // if (utils.isNotEmptyVal(singleData.bill_amount) && utils.isNotEmptyVal(singleData.adjusted_amount)) {
                        //     singleData.adjustment_amount = Math.round((parseFloat(singleData.bill_amount) - parseFloat(singleData.adjusted_amount)) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000
                        // } else {
                        //     // if (utils.isNotEmptyVal(singleData.bill_amount)) {
                        //     //     singleData.adjustment_amount = singleData.bill_amount;
                        //     // } else {
                        //     //     singleData.adjustment_amount = (utils.isNotEmptyVal(singleData.adjusted_amount)) ? 0 : null;
                        //     // }
                        // }

                        if (utils.isNotEmptyVal(singleData.bill_amount) && utils.isNotEmptyVal(singleData.adjusted_amount)) {
                            singleData.adjustment_amount = null;
                            singleData.adjustment_amount = Math.round((parseFloat(angular.copy(singleData.bill_amount)) - parseFloat(angular.copy(singleData.adjusted_amount))) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000

                        }


                        if (utils.isEmptyVal(singleData.adjusted_amount)) {
                            singleData.adjustment_amount = null;
                        }

                        if (utils.isEmptyVal(singleData.adjustment_amount)) {
                            singleData.adjusted_amount = null
                        }

                        vm.Adjustments.push(singleData.adjustment_amount);
                        vm.medicalBillsTotal.totalAdjustments = vm.Adjustments.map(function (e) { return { Adjustment: e } });
                        singleData.service_start_date_utc = angular.copy(singleData.service_start_date);
                        singleData.service_end_date_utc = angular.copy(singleData.service_end_date);

                        singleData.service_start_date = (utils.isEmptyVal(singleData.service_start_date) || singleData.service_start_date == 0) ? "" : moment.unix(singleData.service_start_date).utc().format('MM/DD/YYYY'); //singleData.servicedate;
                        singleData.service_end_date = (utils.isEmptyVal(singleData.service_end_date) || singleData.service_end_date == 0) ? "" : moment.unix(singleData.service_end_date).utc().format('MM/DD/YYYY');
                        vm.medicalBillList.medicalbills.push(singleData);
                    });
                    vm.medicalBillsTotal.totalAdjustments = angular.copy(vm.medicalBillsTotal.totalAdjustments);
                });
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
        // refresh grid
        function refreshGrid() {
            vm.display.refreshGrid = false;
            initGrid();
            $timeout(function () {
                vm.display.refreshGrid = true;
            }, 300);
        }

        // filter based on the plaintiff
        function filterMedicalBills(plaintiffId, allParties, selectedPartyType) {
            getMedicalBillsInfo(matterId, plaintiffId, selectedPartyType);
        }

        function addMedicalBillsInfo(mode, allParties, selectedItems) {
            var resolveObj = {
                matterId: matterId,
                mode: mode,
                allParties: allParties,
                selectedItems: selectedItems
            };
            var modalInstance = openAddExpenseModal(resolveObj);
            getmedbillsListAfterSave(modalInstance);
        }

        // open add/edit medical bill form
        function openAddExpenseModal(resolveObj) {
            return $modal.open({
                templateUrl: 'app/matter/matter-details/medical-bills/add-edit-medical-bills.html',
                controller: 'AddMedicalBillsCtrl as addMedicalBill',
                //   size:'sm',
                windowClass: 'medicalIndoDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    addEditMedicalBill: function () {
                        return resolveObj;
                    }
                }
            });
        }

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
                            type: 'medicalbill'
                        };
                    }
                }
            });

            getmedbillsListAfterSave(modalInstance);
        }

        /**
        * view comment information for selected medical information
        */
        function viewMedicalInfo(selectedItems) {
            var modalInstance = $modal.open({
                templateUrl: 'app/matter/matter-details/view-memo.html',
                controller: 'viewMemoCtrl as viewMemoInfo',
                keyboard: false,
                size: 'lg',
                windowClass: 'cal-pop-up',
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
            vm.medicalBillGrid.selectedItems = [];
        });

        // get list of medical bills after save
        function getmedbillsListAfterSave(modalInstance) {
            modalInstance.result.then(function () {
                utils.isNotEmptyVal(vm.plaintiffid) ? getMedicalBillsInfo(matterId, vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getMedicalBillsInfo(matterId);
                //getMedicalBillsInfo(matterId, vm.plaintiffid.id,vm.plaintiffid.selectedPartyType); //Bug-#5297
            }, function () { });
        }

        function unlinkDocument(selectedItems) {
            vm.LinkedDocRecords = {};
            var actionButton = 'Yes';
            var closeButtonText = "Cancel";

            var msg = 'Are you sure you want to unlink this Document(s) ?'

            vm.LinkedDocRecords = _.filter(selectedItems, function (item) {
                return utils.isNotEmptyVal(item.bill_document_id) && item.bill_document_id > 0;

            });
            vm.noDocRecords = _.filter(selectedItems, function (item) {
                return utils.isEmptyVal(item.bill_document_id) || item.bill_document_id == 0;

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
                var ids = _.pluck(vm.LinkedDocRecords, 'medical_bill_id');
                var matterDetailName = "medicalbill";
                matterDetailsService.unlinkDocument(ids, matterDetailName)
                    .then(function () {
                        utils.isNotEmptyVal(vm.plaintiffid) ? getMedicalBillsInfo(matterId, vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getMedicalBillsInfo(matterId);
                        notificationService.success('document unlinked successfully.');
                    }, function () {
                        //alert("unable to delete");
                        utils.isNotEmptyVal(vm.plaintiffid) ? getMedicalBillsInfo(matterId, vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getMedicalBillsInfo(matterId);
                        notificationService.error('An error occurred. Please try later.');
                    });

            });


        }

        // delete medical bill
        function deleteMedicalBills(selectedItems) {

            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {

                var ids = _.pluck(selectedItems, 'medical_bill_id');
                matterDetailsService.deleteMedicalBillsInfo(ids)
                    .then(function () {
                        utils.isNotEmptyVal(vm.plaintiffid) ? getMedicalBillsInfo(matterId, vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getMedicalBillsInfo(matterId);
                        //getMedicalBillsInfo(matterId, vm.plaintiffid.id,vm.plaintiffid.selectedPartyType); //Bug#5927
                        //alert("deleted successfully");
                        notificationService.success('Medical bill deleted successfully.');
                    }, function () {
                        //alert("unable to delete");
                        notificationService.error('An error occurred. Please try later.');
                    });

            });
        }

    }

})();

//add/edit medical modal
(function () {
    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('AddMedicalBillsCtrl', AddMedicalBillsCtrl);

    AddMedicalBillsCtrl.$inject = ['$modalInstance', 'matterDetailsService', 'addEditMedicalBill',
        'notification-service', 'contactFactory', 'globalConstants', 'matterFactory'
    ];

    function AddMedicalBillsCtrl($modalInstance, matterDetailsService, addEditMedicalBill,
        notificationService, contactFactory, globalConstants, matterFactory) {
        var vm = this;
        var contacts = [];

        var matterId = addEditMedicalBill.matterId;
        var pageMode = addEditMedicalBill.mode; //page mode : add, edit
        var isEdited = pageMode === 'add'; //set is edited to false when mode is edit : this is to handle change evenet fired by clxBTnGrp when its value changes
        var selectedBillInfo = pageMode === 'edit' ?
            angular.copy(addEditMedicalBill.selectedItems[0]) : undefined;

        vm.newMedicalBillInfo = {};
        vm.saveMedicalBillsInfo = addMedicalBillsInfo;
        vm.getContacts = getContacts;
        vm.close = closePopup;
        vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
        vm.openDatePicker = openDatePicker;
        vm.openEndDatePicker = openEndDatePicker;
        vm.calMedicalBill = calMedicalBill;
        vm.changeValues = changeValues;
        vm.addNewContact = addNewContact; // add new contact
        vm.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;
        // to set default values
        vm.newMedicalBillInfo.payment_mode = 2 //default payment mode (unpaid) 
        vm.newMedicalBillInfo.paid_amount = null;
        vm.newMedicalBillInfo.bill_amount = null;
        vm.newMedicalBillInfo.outstanding_amount = null;
        // set todays date as a default
        // vm.newMedicalBillInfo.service_start_date = moment().format("MM/DD/YYYY");
        // vm.newMedicalBillInfo.service_end_date = moment().format("MM/DD/YYYY");
        vm.isDatesValid = isDatesValid;
        vm.groupPlaintiffDefendants = groupPlaintiffDefendants;
        vm.setPartyRole = setPartyRole;
        vm.setType = setType;
        vm.JavaFilterAPIForContactList = true;

        function isDatesValid() {
            if ($('#billstartdateErr').css("display") == "block" || $('#billenddateErr').css("display") == "block") {
                return true;
            } else {
                return false;
            }
        }
        function checkIfEnterKeyWasPressed(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
            return true;

        };

        (function () {
            vm.pageMode = pageMode; //assigned to use mode to hide/show elements
            vm.plaintiffs = addEditMedicalBill.allParties.slice(3);
            // getPlaintiffs(matterId);
            if (angular.isDefined(selectedBillInfo)) {
                setBillInfo(selectedBillInfo);
            }
            vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));
            vm.paymentBtns = [{ label: "Paid", value: 1 },
            { label: "Unpaid", value: 2 },
            { label: "Partial", value: 3 }
            ];

        })();


        function setType(model) {
            // console.log(model);
            vm.newMedicalBillInfo.is_provider_global = (model.contact_type == 'Local') ? 0 : 1;
        }

        function setPartyRole(selparty) {
            var partyInfo = _.find(vm.plaintiffs, function (party) {
                return party.id === selparty.id && party.selectedPartyType === selparty.selectedPartyType;
            });

            vm.newMedicalBillInfo.plaintiffid = partyInfo.id;
            vm.newMedicalBillInfo.party_role = partyInfo.selectedPartyType;
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

        // function getPlaintiffs(matterId) {
        //     matterDetailsService.getPlaintiffs(matterId)
        //         .then(function(response) {
        //             var data = response.data.data;
        //             matterDetailsService.setNamePropForPlaintiffs(data);
        //             vm.plaintiffs = data;
        //         }, function(error) {});
        // }

        function setBillInfo(selectedBillInfo) {
            vm.newMedicalBillInfo = selectedBillInfo;
            vm.newMedicalBillInfo.payment_mode = utils.isNotEmptyVal(vm.newMedicalBillInfo.payment_mode) ? vm.newMedicalBillInfo.payment_mode : 2; //unpaid
            vm.newMedicalBillInfo.associated_party = _.find(vm.plaintiffs, function (party) {
                switch (party.selectedPartyType) {
                    case 1:
                    case 2:
                        if (utils.isNotEmptyVal(selectedBillInfo.plaintiff)) {
                            return party.contactid.contactid == selectedBillInfo.plaintiff.contact_id && party.selectedPartyType == selectedBillInfo.party_role;
                        } else if (utils.isNotEmptyVal(selectedBillInfo.otherParty)) {
                            return party.contactid.contactid == selectedBillInfo.otherParty.contact_id && party.selectedPartyType == selectedBillInfo.party_role;
                        } else if (utils.isNotEmptyVal(selectedBillInfo.defendant)) {
                            return party.contactid.contactid == selectedBillInfo.defendant.contact_id && party.selectedPartyType == selectedBillInfo.party_role;
                        }
                        break;
                    case 3:
                        if (utils.isNotEmptyVal(selectedBillInfo.plaintiff)) {
                            return party.contactid == selectedBillInfo.plaintiff.contact_id && party.selectedPartyType == selectedBillInfo.party_role;
                        } else if (utils.isNotEmptyVal(selectedBillInfo.otherParty)) {
                            return party.contactid == selectedBillInfo.otherParty.contact_id && party.selectedPartyType == selectedBillInfo.party_role;
                        } else if (utils.isNotEmptyVal(selectedBillInfo.defendant)) {
                            return party.contactid == selectedBillInfo.defendant.contact_id && party.selectedPartyType == selectedBillInfo.party_role;
                        }
                        break;
                }
            });
            vm.newMedicalBillInfo.plaintiffid = utils.isEmptyVal(vm.newMedicalBillInfo.associated_party_id) ? '' : vm.newMedicalBillInfo.associated_party_id;
            vm.newMedicalBillInfo.service_start_date = utils.isNotEmptyVal(selectedBillInfo.service_start_date) ? selectedBillInfo.service_start_date : null; //moment.unix(selectedBillInfo.servicedate).utc().format('MM/DD/YYYY') : ''; //moment(selectedBillInfo.servicedate).format("MM/DD/YYYY")
            vm.newMedicalBillInfo.service_end_date = utils.isNotEmptyVal(selectedBillInfo.service_end_date) ? selectedBillInfo.service_end_date : null;//moment.unix(selectedBillInfo.serviceenddate).utc().format('MM/DD/YYYY') : "";
        }

        function getContacts(contactName) {
            var postObj = {};
            postObj.type = globalConstants.mattDetailsMedicalBills;
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            //postObj = matterFactory.setContactType(postObj);
            postObj.page_Size = 250

            return matterFactory.getContactsByName(postObj, vm.JavaFilterAPIForContactList)
                .then(function (response) {
                    var data = response.data;
                    matterDetailsService.setDataPropForContactsFromOffDrupalToNormalContact(data);
                    matterDetailsService.setNamePropForContactsOffDrupal(data);
                    contacts = data;
                    _.forEach(data, function (contact) {
                        contact.name = utils.removeunwantedHTML(contact.first_name) + ' ' + utils.removeunwantedHTML(contact.last_name);
                    });
                    return data;
                });
        }

        function closePopup() {
            $modalInstance.dismiss();
        }

        function addMedicalBillsInfo(newMedicalBillInfoCopy) {
            var newMedicalBillInfo = angular.copy(newMedicalBillInfoCopy);
            changeValues(newMedicalBillInfo);
            newMedicalBillInfo.matter_id = matterId;
            //var newMedicalBillInfo = setIdsBeforeSaving(newMedicalBillInfo);
            newMedicalBillInfo.adjusted_amount = (utils.isNotEmptyVal(newMedicalBillInfo.adjusted_amount)) ? newMedicalBillInfo.adjusted_amount : null;
            newMedicalBillInfo.paid_amount = (utils.isNotEmptyVal(newMedicalBillInfo.paid_amount)) ? newMedicalBillInfo.paid_amount : null;
            newMedicalBillInfo.bill_amount = (utils.isNotEmptyVal(newMedicalBillInfo.bill_amount)) ? newMedicalBillInfo.bill_amount : null;
            newMedicalBillInfo.outstanding_amount = (utils.isNotEmptyVal(newMedicalBillInfo.outstanding_amount)) ? newMedicalBillInfo.outstanding_amount : null;
            var medicalBillObj = createMediBillObject(newMedicalBillInfo);

            switch (pageMode) {
                case "add":
                    addBill(medicalBillObj);
                    break;
                case "edit":
                    medicalBillObj.medical_bill_id = newMedicalBillInfo.medical_bill_id;
                    medicalBillObj.bill_document_id = newMedicalBillInfo.bill_document_id;
                    editBill(medicalBillObj);
                    break;
            }
        }

        //to filter medical bill object
        function createMediBillObject(newMedicalBillInfo) {
            var medicalBillObj = {};

            medicalBillObj.matter_id = parseInt(newMedicalBillInfo.matter_id);
            medicalBillObj.service_start_date = utils.isNotEmptyVal(newMedicalBillInfo.service_start_date) ? newMedicalBillInfo.service_start_date : null;
            medicalBillObj.service_end_date = utils.isNotEmptyVal(newMedicalBillInfo.service_end_date) ? newMedicalBillInfo.service_end_date : null;
            medicalBillObj.payment_mode = utils.isNotEmptyVal(newMedicalBillInfo.payment_mode) ? newMedicalBillInfo.payment_mode : 2;
            medicalBillObj.bill_amount = utils.isNotEmptyVal(newMedicalBillInfo.bill_amount) ? newMedicalBillInfo.bill_amount : null;
            medicalBillObj.outstanding_amount = utils.isNotEmptyVal(newMedicalBillInfo.outstanding_amount) ? newMedicalBillInfo.outstanding_amount : null;
            medicalBillObj.adjusted_amount = utils.isNotEmptyVal(newMedicalBillInfo.adjusted_amount) ? newMedicalBillInfo.adjusted_amount : null;
            medicalBillObj.paid_amount = utils.isNotEmptyVal(newMedicalBillInfo.paid_amount) ? newMedicalBillInfo.paid_amount : null;
            medicalBillObj.memo = utils.isNotEmptyVal(newMedicalBillInfo.memo) ? newMedicalBillInfo.memo : null;
            medicalBillObj.is_provider_global = utils.isNotEmptyVal(newMedicalBillInfo.is_provider_global) ? newMedicalBillInfo.is_provider_global : 0;
            medicalBillObj.party_role = utils.isNotEmptyVal(newMedicalBillInfo.party_role) ? newMedicalBillInfo.party_role : 0;
            medicalBillObj.associated_party_id = utils.isNotEmptyVal(newMedicalBillInfo.plaintiffid) ? parseInt(newMedicalBillInfo.plaintiffid) : null;
            medicalBillObj.medical_provider_id = utils.isNotEmptyVal(newMedicalBillInfo.medical_provider) ? newMedicalBillInfo.medical_provider.contact_id : null;
            medicalBillObj.adjustment = utils.isNotEmptyVal(newMedicalBillInfo.adjustment_amount) ? newMedicalBillInfo.adjustment_amount : null;
            return medicalBillObj;
        }

        function setIdsBeforeSaving(newMedicalBillInfo) {
            var newMedicalBillInfo = angular.copy(newMedicalBillInfo);
            newMedicalBillInfo.providerid = newMedicalBillInfo.providerid ? newMedicalBillInfo.providerid.contactid : "";
            return newMedicalBillInfo;
        }

        function addBill(medicalBillObj) {
            //US#7598 Make associated parties non-mandatory in matter details and doesn't allow empty form to save
            if (medicalBillObj.outstanding_amount == null || medicalBillObj.bill_amount == null) {
                vm.amount = true;
            }
            //US#6288 
            if (typeof medicalBillObj.medical_provider_id === "undefined") {
                return notificationService.error("Invalid Contact Selected");
            }
            if (utils.isEmptyVal(medicalBillObj.associated_party_id) && utils.isEmptyVal(medicalBillObj.memo) && utils.isEmptyVal(medicalBillObj.medical_provider_id) && utils.isEmptyVal(medicalBillObj.service_start_date) && utils.isEmptyVal(medicalBillObj.service_end_date) && (vm.amount == true) && (medicalBillObj.payment_mode == 2)) {
                vm.amount = false;
                notificationService.error("Please add some data to save");
                return;
            }

            var startdate = utils.isNotEmptyVal(medicalBillObj.service_start_date) ? medicalBillObj.service_start_date : "";
            var enddate = utils.isNotEmptyVal(medicalBillObj.service_end_date) ? medicalBillObj.service_end_date : "";

            if ((!moment(startdate, 'MM/DD/YYYY', true).isValid()) && utils.isNotEmptyVal(startdate)) {
                startdate = moment(startdate).format('MM/DD/YYYY');
            }
            if ((!moment(enddate, 'MM/DD/YYYY', true).isValid()) && utils.isNotEmptyVal(enddate)) {
                enddate = moment(enddate).format('MM/DD/YYYY');
            }
            //US#8174 make end date of service non mandatory
            // if ((utils.isNotEmptyVal(startdate) && utils.isEmptyVal(enddate)) || (utils.isNotEmptyVal(enddate) && utils.isEmptyVal(startdate))) {
            //     notificationService.error('Invalid date range.');
            //     return;
            // }
            if (utils.isNotEmptyVal(startdate) && utils.isNotEmptyVal(enddate)) {
                var start = moment(startdate, "MM/DD/YYYY");
                var end = moment(enddate, "MM/DD/YYYY");
                if (end.isBefore(start)) {
                    notificationService.error('End date of service cannot be less than Start date of service');
                    return;
                }


            }
            medicalBillObj.service_start_date = startdate;
            medicalBillObj.service_end_date = enddate;
            setDates(medicalBillObj);
            var bill_amount = parseFloat(medicalBillObj.bill_amount);
            var paid_amount = parseFloat(medicalBillObj.paid_amount);
            var adjustedamount = parseFloat(medicalBillObj.adjusted_amount);
            //adjustment_amount
            var adjustment = parseFloat(medicalBillObj.adjustment);

            if (utils.isEmptyVal(bill_amount)) {
                bill_amount = "0";
            }

            if ((utils.isEmptyVal(bill_amount)) && (utils.isNotEmptyVal(paid_amount))) {
                notificationService.error('Bill amount should be greater than Paid amount');
                return;
            }

            if ((utils.isNotEmptyVal(bill_amount)) && (utils.isNotEmptyVal(paid_amount))) {
                if (paid_amount > bill_amount) {
                    notificationService.error('Bill amount should be greater than Paid amount');
                    return;
                }
            }
            if ((utils.isNotEmptyVal(bill_amount)) && (utils.isNotEmptyVal(adjustedamount))) {
                if (adjustedamount > bill_amount) {
                    notificationService.error('Bill amount should be greater than Adjusted amount');
                    return;
                }
            }
            if ((utils.isNotEmptyVal(bill_amount)) && (utils.isNotEmptyVal(adjustment))) {
                if (adjustment > bill_amount) {
                    notificationService.error('Bill amount should be greater than Adjustment amount');
                    return;
                }
            }


            matterDetailsService.addMedicalBillsInfo(medicalBillObj)
                .then(function () {
                    $modalInstance.close();
                    notificationService.success('Medical bill added successfully.');
                }, function () {
                    //alert("unable to add");
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function editBill(medicalBillObj) {
            //US#6288 
            if (typeof medicalBillObj.medical_provider_id === "undefined") {
                return notificationService.error("Invalid Contact Selected");
            }
            //US#7598 Make associated parties non-mandatory in matter details and doesn't allow empty form to save
            if (utils.isEmptyVal(medicalBillObj.associated_party_id) && utils.isEmptyVal(medicalBillObj.medical_provider_id) && utils.isEmptyVal(medicalBillObj.service_start_date) && utils.isEmptyVal(medicalBillObj.service_end_date) && utils.isEmptyVal(medicalBillObj.outstanding_amount) && utils.isEmptyVal(medicalBillObj.bill_amount) && utils.isEmptyVal(medicalBillObj.memo)) {
                notificationService.error("Please add some data to save");
                return;
            }

            var startdate = utils.isNotEmptyVal(medicalBillObj.service_start_date) ? medicalBillObj.service_start_date : "";
            var enddate = utils.isNotEmptyVal(medicalBillObj.service_end_date) ? medicalBillObj.service_end_date : "";

            if ((!moment(startdate, 'MM/DD/YYYY', true).isValid()) && utils.isNotEmptyVal(startdate)) {
                startdate = moment(startdate).format('MM/DD/YYYY');
            }
            if ((!moment(enddate, 'MM/DD/YYYY', true).isValid()) && utils.isNotEmptyVal(enddate)) {
                enddate = moment(enddate).format('MM/DD/YYYY');
            }

            //US#8174 make end date of service non mandatory
            // if ((utils.isNotEmptyVal(startdate) && utils.isEmptyVal(enddate)) || (utils.isNotEmptyVal(enddate) && utils.isEmptyVal(startdate))) {
            //     notificationService.error('Invalid date range.');
            //     return;
            // }
            if (utils.isNotEmptyVal(startdate) && utils.isNotEmptyVal(enddate)) {
                var start = moment(startdate, "MM/DD/YYYY");
                var end = moment(enddate, "MM/DD/YYYY");
                if (end.isBefore(start)) {
                    notificationService.error('Invalid date range.');
                    return;
                }
            }
            medicalBillObj.service_start_date = startdate;
            medicalBillObj.service_end_date = enddate;
            setDates(medicalBillObj);

            var bill_amount = parseFloat(medicalBillObj.bill_amount);
            var paid_amount = parseFloat(medicalBillObj.paid_amount);
            var adjustedamount = parseFloat(medicalBillObj.adjusted_amount);
            var adjustment = parseFloat(medicalBillObj.adjustment);
            //adjustment_amount

            if (utils.isEmptyVal(bill_amount)) {
                bill_amount = "0";
            }

            if ((utils.isEmptyVal(bill_amount)) && (utils.isNotEmptyVal(paid_amount))) {
                notificationService.error('Bill amount should be greater than Paid amount');
                return;
            }

            if ((utils.isNotEmptyVal(bill_amount)) && (utils.isNotEmptyVal(paid_amount))) {
                if (paid_amount > bill_amount) {
                    notificationService.error('Bill amount should be greater than Paid amount');
                    return;
                }
            }
            if ((utils.isNotEmptyVal(bill_amount)) && (utils.isNotEmptyVal(adjustedamount))) {
                if (adjustedamount > bill_amount) {
                    notificationService.error('Bill amount should be greater than Adjusted amount');
                    return;
                }
            }

            if ((utils.isNotEmptyVal(bill_amount)) && (utils.isNotEmptyVal(adjustment))) {
                if (adjustment > bill_amount) {
                    notificationService.error('Bill amount should be greater than Adjustment amount');
                    return;
                }
            }
            matterDetailsService.editMedicalBillsInfo(medicalBillObj)
                .then(function () {
                    $modalInstance.close();
                    notificationService.success('Medical bill updated successfully.');
                }, function () {
                    //alert("unable to edit");
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function setDates(medicalBillObj) {
            //convert moment string date format to date object
            medicalBillObj.service_start_date = utils.isEmptyVal(medicalBillObj.service_start_date) ? null : moment.utc(medicalBillObj.service_start_date).unix();
            medicalBillObj.service_end_date = utils.isEmptyVal(medicalBillObj.service_end_date) ? null : moment.utc(medicalBillObj.service_end_date).unix();

        }

        //in our display value and model value are different for the input box
        //therefore we are formatting our display value based on the model value of the input box
        function formatTypeaheadDisplay(contact) {
            if (utils.isEmptyVal(contact) || utils.isEmptyString(contact)) {
                return undefined;
            }
            //if name prop is not present concat firstname and lastname
            //return (contact.name || (contact.firstname + " " + contact.lastname));
            var firstname = angular.isUndefined(contact.first_name) ? '' : contact.first_name;
            var lastname = utils.isEmptyVal(contact.last_name) ? '' : contact.last_name;
            return (contact.name || (firstname + " " + lastname));

        }

        function openDatePicker($event) {
            $event.preventDefault();
            $event.stopPropagation();

            vm.openServicePicker = true;
        }

        function openEndDatePicker($event) {
            $event.preventDefault();
            $event.stopPropagation();

            vm.openEndServicePicker = true;
        }

        // Set intial values with 0 based on payment mode

        function calMedicalBill(payment_mode) {
            //check the previously set is edited value, in edit mode we ignore the first change in model value
            if (!isEdited) {
                isEdited = true;
                return;
            }

            switch (payment_mode) {
                case 1: // paid
                case 2: // Unpaid
                case 3: // Partial
                    vm.newMedicalBillInfo.paid_amount = utils.isEmptyVal(vm.newMedicalBillInfo.paid_amount) ?
                        null : vm.newMedicalBillInfo.paid_amount;
                    vm.newMedicalBillInfo.outstanding_amount = utils.isEmptyVal(vm.newMedicalBillInfo.outstanding_amount) ?
                        null : vm.newMedicalBillInfo.outstanding_amount;
                    vm.newMedicalBillInfo.paid_amount = utils.isEmptyVal(vm.newMedicalBillInfo.paid_amount) ?
                        null : vm.newMedicalBillInfo.paid_amount;
                    vm.newMedicalBillInfo.adjustment_amount = utils.isEmptyVal(vm.newMedicalBillInfo.adjustment_amount) ?
                        null : vm.newMedicalBillInfo.adjustment_amount;
                    changeValues(vm.newMedicalBillInfo);
                    break;
            }
        }

        // Calculate/set values based on payment mode for Bill amount, tatal amount and outstanding amount.
        function changeValues(objectInfo, data) {

            if (utils.isEmptyVal(objectInfo.bill_amount)) {
                if (data == 'adjusted') {
                    vm.showValidationForAdjusted = true;
                } else {
                    // vm.showValidationForAdjusted = false; 
                }
                if (data == 'adjustment') {
                    vm.showValidationForAdjustment = true;
                } else {
                    // vm.showValidationForAdjustment = false;
                }
                // if (data == 'adjustment' || data == 'adjusted') {
                //        vm.showValidationForAdjustment = true;
                //        vm.showValidationForAdjusted = true;

                //     } else {
                //         vm.showValidationForAdjustment = false;
                //         vm.showValidationForAdjusted = false;
                //     }
                //     if (data == 'adjusted' || data == 'adjustment') {
                //         vm.showValidationForAdjustment = true;
                //         vm.showValidationForAdjusted = true;

                //      } else {
                //          vm.showValidationForAdjustment = false;
                //          vm.showValidationForAdjusted = false;
                //      }

            } else {

                vm.showValidationForAdjusted = false;
                vm.showValidationForAdjustment = false;
            }
            if (utils.isEmptyVal(objectInfo.bill_amount)) {
                objectInfo.adjustment_amount = "";
                objectInfo.adjusted_amount = "";
            }

            if (data == 'adjusted' && utils.isNotEmptyVal(objectInfo.bill_amount) && utils.isNotEmptyVal(objectInfo.adjusted_amount)) {
                objectInfo.adjustment_amount = null;
                objectInfo.adjustment_amount = Math.round((parseFloat(angular.copy(objectInfo.bill_amount)) - parseFloat(angular.copy(objectInfo.adjusted_amount))) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000

            }

            if (data == 'adjustment' && utils.isNotEmptyVal(objectInfo.bill_amount) && utils.isNotEmptyVal(objectInfo.adjustment_amount)) {
                objectInfo.adjusted_amount = null;
                objectInfo.adjusted_amount = Math.round((parseFloat(angular.copy(objectInfo.bill_amount)) - parseFloat(angular.copy(objectInfo.adjustment_amount))) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000

            }
            if (!data && utils.isNotEmptyVal(objectInfo.bill_amount) && utils.isNotEmptyVal(objectInfo.adjusted_amount)) {
                objectInfo.adjustment_amount = null;
                objectInfo.adjustment_amount = Math.round((parseFloat(angular.copy(objectInfo.bill_amount)) - parseFloat(angular.copy(objectInfo.adjusted_amount))) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000

            }

            if (data == 'adjusted' && utils.isEmptyVal(objectInfo.adjusted_amount)) {
                objectInfo.adjustment_amount = null;
            }

            if (data == 'adjustment' && utils.isEmptyVal(objectInfo.adjustment_amount)) {
                objectInfo.adjusted_amount = null;
            }

            switch (objectInfo.payment_mode) {
                case 1: // paid
                    objectInfo.paid_amount = utils.isNotEmptyVal(objectInfo.adjusted_amount) ? objectInfo.adjusted_amount : objectInfo.bill_amount;
                    objectInfo.outstanding_amount = 0;
                    break;
                case 2: // Unpaid
                    objectInfo.outstanding_amount = utils.isNotEmptyVal(objectInfo.adjusted_amount) ? objectInfo.adjusted_amount : objectInfo.bill_amount;
                    objectInfo.paid_amount = 0; // 
                    break;
                case 3: // Partial
                    if (utils.isNotEmptyVal(objectInfo.adjusted_amount)) {
                        if (utils.isNotEmptyVal(objectInfo.paid_amount) && utils.isNotEmptyVal(objectInfo.adjusted_amount)) {
                            objectInfo.outstanding_amount = Math.round((parseFloat(objectInfo.adjusted_amount) - parseFloat(objectInfo.paid_amount)) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000
                        } else {
                            if (utils.isNotEmptyVal(objectInfo.adjusted_amount)) {
                                objectInfo.outstanding_amount = objectInfo.adjusted_amount;
                            } else {
                                objectInfo.outstanding_amount = (utils.isNotEmptyVal(objectInfo.paid_amount)) ? 0 : null;
                            }
                        }
                    } else {
                        if (utils.isNotEmptyVal(objectInfo.paid_amount) && utils.isNotEmptyVal(objectInfo.bill_amount)) {
                            // objectInfo.outstandingamount = (parseFloat(objectInfo.totalamount) - parseFloat(objectInfo.paidamount)).toFixed(2);
                            objectInfo.outstanding_amount = Math.round((parseFloat(objectInfo.bill_amount) - parseFloat(objectInfo.paid_amount)) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000
                        } else {
                            if (utils.isNotEmptyVal(objectInfo.bill_amount)) {
                                objectInfo.outstanding_amount = objectInfo.bill_amount;
                            } else {
                                objectInfo.outstanding_amount = (utils.isNotEmptyVal(objectInfo.paid_amount)) ? 0 : null;
                            }
                        }
                    }
                    break;
            }




        }

        // to open add new contact pop up
        function addNewContact(model) {
            var selectedType = {};
            selectedType.type = model == 'medical_provider' ? 'medicalBillsproviderid' : '';
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                response['firstname'] = response.first_name;
                response['lastname'] = response.last_name;
                response['contactid'] = (response.contact_id).toString();
                vm.newMedicalBillInfo[model] = response;
                setType(response);
            }, function () { });
        }


    }

})();




(function (angular) {

    angular.module('cloudlex.matter')
        .factory('medicalBillHelper', medicalBillHelper);

    medicalBillHelper.$inject = ['globalConstants', '$filter'];

    function medicalBillHelper(globalConstants, $filter) {
        return {
            medicalBillGrid: _medicalBillGrid,
            printMedicalBill: _printMedicalBill,
            setNames: _setNames,
            setEditedContactName: _setEditedContactName,
            setEdited: _setEdited
        };

        function _printMedicalBill(matterName, fileNumber, plaintiffName, sortby, selectedItem, medicalBillList, medicalBillsTotal, sortKey) {
            var medicalBillsTotal = angular.copy(medicalBillsTotal);
            var priMedicalBillList = angular.copy($filter('orderBy')(medicalBillList, sortKey));
            var filtersForPrint = _getFiltersForPrint(matterName, fileNumber, plaintiffName, sortby);
            var headers = _medicalBillGrid();
            headers = _getPropsFromHeaders(headers);

            var printPage = _getPrintPage(filtersForPrint, headers, priMedicalBillList, medicalBillsTotal);
            window.open().document.write(printPage);
        }

        function _getFiltersForPrint(matterName, fileNumber, plaintiffName, sortby) {
            var filtersForPrint = {
                'Matter Name': matterName,
                'File#': fileNumber,
                'Records Of': plaintiffName,
                'ORDERED BY': sortby
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
        //     return "$" + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        // }
        function currencyFormat(num) {
            num = num.toString();
            return "$" + num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        }

        function _getPrintPage(filters, headers, medicalBillList, medicalBillsTotal) {
            var html = "<html><title>Medical Bill Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Medical Bill Report</h1><div></div>";
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
            if (!(_.isEmpty(medicalBillsTotal))) {
                html += "<tr>";
                html += '<div style="float: right;margin-bottom: 20px;" data-ng-if="expenses.expensesList.expenses.length > 0">';
                html += '<div style="float: left;margin-left: 15px;"><b>Total</b></div>';
                html += '<div style="float: left;margin-left: 15px;">Bills/Adjusted Amounts (after write-off): <b>' + $filter('currency')($filter('sumOfValue')(medicalBillsTotal.billamount, 'billamount'), '$', 2) + '/' + $filter('currency')($filter('sumOfValue')(medicalBillsTotal.adjustedamount, 'adjustedamount'), '$', 2) + '</b></div>';
                html += '<div style="float: left;margin-left: 15px;">Adjustments: <b>' + $filter('currency')($filter('sumOfValue')(medicalBillsTotal.totalAdjustments, 'Adjustment'), '$', 2) + '</b></div>';
                html += '<div style="float: left;margin-left: 15px;">Paid: <b>' + $filter('currency')($filter('sumOfValue')(medicalBillsTotal.paidamount, 'paidamount'), '$', 2) + '</b></div>';
                html += '<div style="float: left;margin-left: 15px;">Outstanding: <b>' + '$' + $filter('number')($filter('sumOfValue')(medicalBillsTotal.outstandingamount, 'outstandingamount')) + '</b></div>';
                html += '</div>';
                html += "</tr>";
            }

            html += '<tr>';
            angular.forEach(headers, function (header) {
                //html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + header.display + "</th>";
                if (header.prop == 'outstanding_amount' || header.prop == 'bill_amount' || header.prop == 'paid_amount' || header.prop == "adjusted_amount" || header.prop == "adjustment_amount") {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px;text-align:right; '>" + header.display + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + header.display + "</th>";
                }
            });
            html += '</tr>';


            angular.forEach(medicalBillList, function (item) {
                html += '<tr>';
                angular.forEach(headers, function (header) {
                    item[header.prop] = (_.isNull(item[header.prop]) || angular.isUndefined(item[header.prop]) ||
                        utils.isEmptyString(item[header.prop])) ? " - " : item[header.prop];
                    if (header.prop == 'bill_amount' || header.prop == 'paid_amount' || header.prop == 'adjusted_amount' || header.prop == "adjustment_amount") {
                        item[header.prop] = (item[header.prop] == " - ") ? "" : item[header.prop];
                        if (utils.isEmptyString(item[header.prop])) {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" +
                                " - </td>";
                        } else {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" +
                                $filter('currency')(item[header.prop], '$', 2) +
                                "</td>";
                        }

                    }
                    // else if (header.prop == 'totalamount') {
                    //     item[header.prop] = (item[header.prop] == " - ") ? "" : item[header.prop];
                    //     if (utils.isEmptyString(item[header.prop])) {
                    //         html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" +
                    //             " - </td>";
                    //     } else {
                    //         html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" +
                    //             $filter('currency')(item[header.prop], '$', 2) +
                    //             "</td>";
                    //     }

                    // }
                    else if (header.prop == 'outstanding_amount') {
                        item[header.prop] = (item[header.prop] == " - ") ? "" : item[header.prop];
                        if (utils.isEmptyString(item[header.prop])) {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" +
                                " - </td>";
                        } else {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" +
                                "$" + $filter('number')(item[header.prop]) +
                                "</td>";
                        }
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

        function _medicalBillGrid() {
            return [{
                field: [{
                    html: '<span data-ng-show="(data.bill_document_id) && !(data.bill_document_id==0) ">' +
                        ' <open-doc doc-id={{[{doc_id:data.bill_document_id}]}} matter-id={{matterDetail.matterId}}></open-doc>' +
                        '</span>' + '<span data-ng-hide="(data.bill_document_id && !(data.bill_document_id==0)) || medicalBills.matterInfo.archivalMatterReadOnlyFlag" class ="sprite default-link" ng-click = "medicalBills.linkUploadDoc(data)" tooltip="Link Document" tooltip-append-to-body="true" tooltip-placement="right"></span>',
                    inline: true
                }],
                dataWidth: "4"
            },
            {
                field: [{
                    html: '<span data-ng-show="data.memo" class ="sprite default-view-comment" ng-click = "medicalBills.viewMedicalInfo(data)" tooltip="View Memo" tooltip-append-to-body="true" tooltip-placement="right"></span>',
                    inline: true,
                    cursor: true,

                }],
                dataWidth: "4"
            },
            {
                field: [{
                    prop: 'plaintiffName',
                    printDisplay: 'Associated Party',
                    onClick: "medicalBills.openContactCard(data)",
                    compile: true,
                    inline: true,
                    cursor: true,
                    underline: true
                }],
                displayName: 'Associated Party',
                dataWidth: '12'
            },
            {
                field: [{
                    prop: 'providerName',
                    printDisplay: 'Service Provider',
                    onClick: "medicalBills.openContactCard(data.medical_provider)",
                    compile: true,
                    cursor: true,
                    underline: true
                }],
                displayName: 'Service Provider',
                dataWidth: '10'

            },
            {
                field: [{
                    prop: 'service_start_date',
                    printDisplay: 'Start Date of Service'
                }],
                displayName: 'Start Date of Service',
                dataWidth: '11'
            },
            {
                field: [{
                    prop: 'service_end_date',
                    printDisplay: 'End Date of Service'
                }],
                displayName: 'End Date of Service',
                dataWidth: '10'
            },
            {
                field: [{
                    prop: 'bill_amount',
                    printDisplay: 'Bill Amount',
                    html: '<span tooltip="{{data.bill_amount ? \'$\' : \'\'}}{{data.bill_amount | number:2}}" tooltip-placement="bottom" tooltip-append-to-body="true">{{data.bill_amount ? "$" : ""}}{{data.bill_amount | number:2}}</span><span ng-if="data.adjusted_amount && data.bill_amount">/</span>',

                }, {
                    prop: 'adjusted_amount',
                    printDisplay: 'Adjusted Amount',
                    html: '<span tooltip="{{data.adjusted_amount ? \'$\' : \'\'}}{{data.adjusted_amount | number:2}}" tooltip-placement="bottom" tooltip-append-to-body="true">{{data.adjusted_amount ? "$" : ""}}{{data.adjusted_amount | number:2}}</span>',
                }],
                displayName: 'Bill Amount / Adjusted Amount',
                dataWidth: '12'
            },
            {
                field: [{
                    prop: 'adjustment_amount',
                    printDisplay: 'Adjustment',
                    html: '<span tooltip="{{data.adjustment_amount ? \'$\' : \'\'}}{{data.adjustment_amount | number:2}}" tooltip-placement="bottom" tooltip-append-to-body="true">{{data.adjustment_amount || data.adjustment_amount == 0 ? "$" : ""}}{{data.adjustment_amount | number:2}}</span>'
                }],
                displayName: 'Adjustment',
                dataWidth: '10'
            },
            {
                field: [{
                    prop: 'paid_amount',
                    printDisplay: 'Paid Amount',
                    html: '<span tooltip="{{data.paid_amount ? \'$\' : \'\'}}{{data.paid_amount | number:2}}" tooltip-placement="bottom" tooltip-append-to-body="true">{{data.paid_amount || data.paid_amount == 0 ? "$" : ""}}{{data.paid_amount | number:2}}</span>'
                }],
                displayName: 'Paid Amount',
                dataWidth: '10'
            },
            {
                field: [{
                    prop: 'outstanding_amount',
                    printDisplay: 'Outstanding Amount',
                    html: '<span tooltip="{{data.outstanding_amount ? \'$\' : \'\'}}{{data.outstanding_amount | number:2}}" tooltip-placement="bottom" tooltip-append-to-body="true">{{data.outstanding_amount || data.outstanding_amount == 0 ? "$" : ""}}{{data.outstanding_amount | number:2}}</span>'
                }],
                displayName: 'Outstanding Amount',
                dataWidth: '13'
            },
            {
                field: [{
                    prop: 'memo',
                    printDisplay: 'Memo'
                },],
                displayName: 'Memo',
                dataWidth: "1",
                isComment: "1"

            }
            ];
        }

        function _setNames(singleData) {
            if (utils.isNotEmptyVal(singleData.plaintiff)) {
                singleData.plaintiffName = singleData.plaintiff.first_name + " " + singleData.plaintiff.last_name;
            } else if (utils.isNotEmptyVal(singleData.otherParty)) {
                singleData.plaintiffName = singleData.otherParty.first_name + " " + singleData.otherParty.last_name;
            } else if (utils.isNotEmptyVal(singleData.defendant)) {
                singleData.plaintiffName = singleData.defendant.first_name + " " + singleData.defendant.last_name;
            } else {
                singleData.plaintiffName = '';
            }

            if (utils.isNotEmptyVal(singleData.medical_provider)) {
                singleData.providerName = utils.isNotEmptyVal(singleData.medical_provider.first_name) ? singleData.medical_provider.first_name : '' + " " + utils.isNotEmptyVal(singleData.medical_provider.last_name) ? singleData.medical_provider.last_name : '';
            } else {
                singleData.providerName = '';
            }
        }

        function _setEditedContactName(medicalBill, contact) {
            if (utils.isNotEmptyVal(medicalBill.plaintiff) &&
                medicalBill.plaintiff.contact_id == contact.contact_id) {
                medicalBill.plaintiff.first_name = contact.firstname;
                medicalBill.plaintiff.last_name = contact.lastname;
                medicalBill.plaintiff.edited = true;
            } else if (utils.isNotEmptyVal(medicalBill.defendant) &&
                medicalBill.defendant.contact_id == contact.contact_id) {
                medicalBill.defendant.first_name = contact.firstname;
                medicalBill.defendant.last_name = contact.lastname;
                medicalBill.defendant.edited = true;
            } else if (utils.isNotEmptyVal(medicalBill.otherParty) &&
                medicalBill.otherParty.contact_id == contact.contact_id) {
                medicalBill.otherParty.first_name = contact.firstname;
                medicalBill.otherParty.last_name = contact.lastname;
                medicalBill.otherParty.edited = true;
            }

            if (utils.isNotEmptyVal(medicalBill.medical_provider) &&
                medicalBill.medical_provider.contact_id == contact.contact_id) {
                medicalBill.medical_provider.first_name = contact.firstname;
                medicalBill.medical_provider.last_name = contact.lastname;
                medicalBill.medical_provider.edited = true;
            }
        }

        function _setEdited(medicalBill, contact) {

            if (utils.isNotEmptyVal(medicalBill.providerid)) {
                medicalBill.providerid.edited = medicalBill.providerid.contactid === contact.contactid ?
                    false : medicalBill.providerid.edited;
            }

            if (utils.isNotEmptyVal(medicalBill.plaintiffid)) {
                medicalBill.plaintiffid.edited = medicalBill.plaintiffid.contactid === contact.contactid ?
                    false : medicalBill.plaintiffid.edited;
            }
        }
    }

})(angular);
