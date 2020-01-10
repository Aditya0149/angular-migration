(function () {
    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('InsauranceCtrl', InsauranceCtrl);

    InsauranceCtrl.$inject = ['$scope', '$rootScope', '$stateParams', '$modal', 'insuranceHelper', 'matterDetailsService',
        'notification-service', 'modalService', 'contactFactory', 'matterFactory', 'masterData', 'mailboxDataService', '$filter'
    ];

    function InsauranceCtrl($scope, $rootScope, $stateParams, $modal, insuranceHelper, matterDetailsService,
        notificationService, modalService, contactFactory, matterFactory, masterData, mailboxDataService, $filter) {
        var vm = this,
            allPartyData;
        var matterId = $stateParams.matterId;

        vm.insauranceList = [];
        vm.setInitData = setInitData;
        vm.downloadInsurance = downloadInsurance;
        vm.printInsurance = printInsurance;
        vm.openContactCard = openContactCard;
        vm.selectAllUsers = selectAllUsers;
        vm.allUsersSelected = allUsersSelected;
        vm.isUserSelected = isUserSelected;

        vm.filterInsurance = filterInsurance;
        vm.addInsauranceInfo = addInsauranceInfo;
        vm.deleteInsurance = deleteInsurance;

        vm.insuranceList = {};
        vm.insuranceList.insurance = [];
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.viewMedicalInfo = viewMedicalInfo;
        vm.linkUploadDoc = linkUploadDoc;
        vm.unlinkDocument = unlinkDocument;


        (function () {
            window.parent.document.title = "Welcome to CloudLex";
            $rootScope.$emit('favicon', "favicon.ico");
            //initGrid();
            vm.insuranceGrid = {
                headers: insuranceHelper.insuranceGrid(),
                selectedItems: []
            };
            getInsauranceInfo(matterId);
            vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));
            getUserEmailSignature();
            vm.matterInfo = matterFactory.getMatterData(matterId);
        })();

        function selectAllUsers(isSelected) {
            if (isSelected === true) {
                vm.insuranceGrid.selectedItems = angular.copy(vm.insuranceList.insurance);
            } else {
                vm.insuranceGrid.selectedItems = [];
            }
        }

        function allUsersSelected() {
            if (utils.isEmptyVal(vm.insuranceList) || vm.insuranceList.insurance == 0) {
                return false;
            }

            return vm.insuranceGrid.selectedItems.length === vm.insuranceList.insurance.length;
        }

        function isUserSelected(medicaltreatmentid) {
            var uids = _.pluck(vm.insuranceGrid.selectedItems, 'insurance_id');
            return uids.indexOf(medicaltreatmentid) > -1;
        }

        var selectedPartyRole;

        function currencyFormat(num) {
            if (utils.isEmptyVal(num)) {
                return -1;
            }
            num = num.toString();
            return "$" + num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        }

        function getInsauranceInfo(matterId, plaintiffId, selectedPartyType) {
            vm.insuranceGrid.selectedItems.length = 0;
            vm.insuranceGrid.selectAll = false;
            var show = plaintiffId || 'all';
            var partyRole = selectedPartyType;
            selectedPartyRole = partyRole;
            matterDetailsService.getInsauranceInfo(matterId, show, partyRole)
                .then(function (response) {
                    var data = response;
                    //US#8103 show policy limit and policy limit max on grid
                    _.forEach(data, function (item) {
                        if ((utils.isEmptyVal(item.policy_limit) && utils.isEmptyVal(item.policy_limit_max))) {
                            item.policy = "";
                        } else {
                            var policy_limit_max = utils.isNotEmptyVal(item.policy_limit_max) ? $filter('currency')(angular.copy(item.policy_limit_max), '$', 2) : "-";
                            var policy_limit = utils.isNotEmptyVal(item.policy_limit) ? $filter('currency')(angular.copy(item.policy_limit), '$', 2) : "-";
                            item.policy = policy_limit + '/' + policy_limit_max;
                        }
                    });
                    vm.insuranceList.insurance = [];
                    setNames(data);
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

        function setNames(insurances) {
            _.forEach(insurances, function (singleData) {
                //var singleDataOjb = {};
                insuranceHelper.setNames(singleData);
                vm.insuranceList.insurance.push(singleData);
            })
        }

        function setInitData(allPartyArray) {
            allPartyData = allPartyArray;
        }

        // US13403: Export Insurance List(PHP to Java)
        function downloadInsurance(partyId) {
            var show = utils.isNotEmptyVal(partyId) ? partyId.id : 'all';
            var partyRole = utils.isNotEmptyVal(partyId) ? partyId.selectedPartyType : '';
            matterDetailsService.downloadInsurance(matterId, show, partyRole)
                .then(function (response) {
                    var filename = "Insurance_List";
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

        function printInsurance(partyArray, plaintiffid) {
            var matterName = '';
            var fileNumber = '';
            var plaintiffName = '';
            var partyName = "";
            var partyId = angular.isDefined(plaintiffid) ? plaintiffid.id : "";
            //     (selectedPartyRole === 'defendant' ? 'defendantid' : '');

            // if (utils.isNotEmptyVal(partyId)) {
            //     var partyName = _.find(partyArray, function(party) {
            //         return party[partyId] === partyid;
            //     });
            //     partyName = utils.isNotEmptyVal(partyName) ? partyName.name : '';
            // }

            _.forEach(partyArray, function (plaintiff) {
                if (angular.isDefined(plaintiff.id) && plaintiffid != undefined) {
                    if (plaintiff.id == plaintiffid.id && plaintiffid.selectedPartyType == plaintiff.selectedPartyType) {
                        partyName = plaintiff.name;
                    }
                }

            })

            //get matter name
            var matterInfo = matterFactory.getMatterData();
            matterName = matterInfo.matter_name;

            var printInfo = {
                partyName: utils.isEmptyVal(partyName) ? "" : partyName,
                matterName: matterInfo.matter_name,
                fileNumber: matterInfo.file_number,
                partyRole: selectedPartyRole,
                partyId: partyId
            };

            insuranceHelper.printInsurance(printInfo, vm.insuranceList.insurance);
        }

        function openContactCard(contact) {
            contactFactory.displayContactCard1(contact.contact_id, contact.edited, contact.contact_type);
            _.forEach(vm.insuranceList.insurance, function (insu) {
                insuranceHelper.setEdited(insu, contact);
            });
        }

        //listen to contact card edited event
        $scope.$on('contactCardEdited', function (e, editedContact) {
            var contactObj = editedContact;
            var insurances = angular.copy(vm.insuranceList.insurance);
            _.forEach(insurances, function (insurance) {
                insuranceHelper.setEditedContactName(insurance, contactObj);
                insuranceHelper.setNames(insurance);
            });

            vm.insuranceList.insurance = insurances;
        });

        function filterInsurance(plaintiffId, allPartyData, selectedPartyType) {
            /*to fix bug 5000 this check and update line is coded*/
            plaintiffId = (plaintiffId == 'allplaintiffs') ? 'allplaintiff' : plaintiffId;
            getInsauranceInfo(matterId, plaintiffId, selectedPartyType);
        }

        function addInsauranceInfo(mode, allParties, selectedItems) {
            var resolveObj = {
                matterId: matterId,
                mode: mode,
                allParties: allParties,
                selectedItems: selectedItems
            };
            var modalInstance = openAddInsauranceModal(resolveObj);
            getInsauranceListAfterSave(modalInstance);
        }


        /**
        * view comment information for selected insuarnce
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
                            type: 'insurance'
                        };
                    }
                }
            });

            getInsauranceListAfterSave(modalInstance);
        }

        /**
        * uncheck seleted items from grid
        */
        $rootScope.$on('unCheckSelectedItems', function () {
            vm.insuranceGrid.selectedItems = [];
        });

        function openAddInsauranceModal(resolveObj) {
            return $modal.open({
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
        }

        function getInsauranceListAfterSave(modalInstance) {
            modalInstance.result.then(function () {
                utils.isNotEmptyVal(vm.associated_party_id) ? getInsauranceInfo(matterId, vm.associated_party_id.id, vm.associated_party_id.selectedPartyType) : getInsauranceInfo(matterId);
                //  getInsauranceInfo(matterId, vm.associated_party_id.id);
            }, function () {
                console.log("add insurance pop up closed");
            });
        }

        function unlinkDocument(selectedItems) {
            vm.LinkedDocRecords = {};
            var actionButton = 'Yes';
            var closeButtonText = "Cancel";
            var msg = 'Are you sure you want to unlink this Document(s) ?'

            vm.LinkedDocRecords = _.filter(selectedItems, function (item) {
                return utils.isNotEmptyVal(item.insurance_documentid) && item.insurance_documentid > 0;

            });
            vm.noDocRecords = _.filter(selectedItems, function (item) {
                return utils.isEmptyVal(item.insurance_documentid) || item.insurance_documentid == 0;

            });

            if (vm.noDocRecords.length > 0) {
                var msg = "There is no Document(s) to unlink.";
                actionButton = '';
                closeButtonText = 'Ok';

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
                var ids = _.pluck(vm.LinkedDocRecords, 'insurance_id');
                var matterDetailName = "insurance";
                matterDetailsService.unlinkDocument(ids, matterDetailName)
                    .then(function () {
                        utils.isNotEmptyVal(vm.associated_party_id) ? getInsauranceInfo(matterId, vm.associated_party_id.id, vm.associated_party_id.selectedPartyType) : getInsauranceInfo(matterId);
                        notificationService.success('document unlinked successfully.');
                    }, function () {
                        //alert("unable to delete");
                        utils.isNotEmptyVal(vm.associated_party_id) ? getInsauranceInfo(matterId, vm.associated_party_id.id, vm.associated_party_id.selectedPartyType) : getInsauranceInfo(matterId);
                        notificationService.error('An error occurred. Please try later.');
                    });

            });


        }

        function deleteInsurance(selectedItems) {

            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {

                var ids = _.pluck(selectedItems, 'insurance_id');
                matterDetailsService.deleteInsurance(ids)
                    .then(function () {
                        utils.isNotEmptyVal(vm.associated_party_id) ? getInsauranceInfo(matterId, vm.associated_party_id.id, vm.associated_party_id.selectedPartyType) : getInsauranceInfo(matterId);
                        //alert("deleted successfully");
                        notificationService.success('Insurance deleted successfully.');
                    }, function () {
                        notificationService.error('An error occurred. Please try later.');
                    });
            });

        }

    }

})();

//add edit insaurance modal
(function () {
    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('AddInsauranceCtrl', AddInsauranceCtrl);

    AddInsauranceCtrl.$inject = ['$modalInstance', 'masterData', 'matterDetailsService', 'addEditInsaurance', 'notification-service', 'contactFactory', 'matterFactory', 'globalConstants'];

    function AddInsauranceCtrl($modalInstance, masterData, matterDetailsService, addEditInsaurance, notificationService, contactFactory, matterFactory, globalConstants) {
        var vm = this;
        var contacts = [];
        var masterData = masterData.getMasterData();
        var matterId = addEditInsaurance.matterId;
        var pageMode = addEditInsaurance.mode; //page mode : add, edit
        if (pageMode == "edit") {
            var Insauranceedit = addEditInsaurance.selectedItems[0];
            _.forEach(Insauranceedit, function (val, item) {
                val == " - " ? Insauranceedit[item] = "" : Insauranceedit[item] = val;
            });
        }
        var selectedInsauranceInfo = pageMode === 'edit' ?
            angular.copy(addEditInsaurance.selectedItems[0]) : undefined;

        vm.newInsauranceInfo = {};
        vm.setPartyRole = setPartyRole;
        vm.groupPlaintiffDefendants = groupPlaintiffDefendants;
        vm.saveInsauranceInfo = saveInsauranceInfo;
        vm.getContacts = getContacts;
        vm.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;
        vm.close = closePopup;
        vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
        vm.addNewContact = addNewContact; // add new contact
        vm.insuranceTypeList = angular.copy(globalConstants.insuranceTypeList);
        vm.JavaFilterAPIForContactList = true;
        (function () {
            vm.pageMode = pageMode; //assigned to use mode to hide/show elements    
            //getPlaintiffs(matterId);
            vm.plaintiffs = addEditInsaurance.allParties.slice(3);
            if (angular.isDefined(selectedInsauranceInfo)) {
                setInsuranceInfo(selectedInsauranceInfo);
            }

            vm.excessConfirmed = [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }];
        })();
        function checkIfEnterKeyWasPressed(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
            return true;

        };
        // get plaintiff based on matter id
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

        function setPartyRole(selparty) {
            var partyInfo = _.find(vm.plaintiffs, function (party) {
                return party.id === selparty.id && party.selectedPartyType === selparty.selectedPartyType;
            });

            vm.newInsauranceInfo.associated_party_id = partyInfo.id;

            vm.newInsauranceInfo.party_role = partyInfo.selectedPartyType;

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

        // set insurance info 
        function setInsuranceInfo(selectedInsauranceInfo) {
            var info = angular.copy(selectedInsauranceInfo);

            if (utils.isNotEmptyVal(info.party_role)) {
                var value = parseInt(info.party_role);
                var rec_id = null;
                switch (value) {
                    case 1:
                        if (selectedInsauranceInfo.plaintiff && selectedInsauranceInfo.plaintiff.plaintiff_id)
                            rec_id = selectedInsauranceInfo.plaintiff.plaintiff_id;

                        break;
                    case 2:
                        if (selectedInsauranceInfo.defendant && selectedInsauranceInfo.defendant.defendant_id)
                            rec_id = selectedInsauranceInfo.defendant.defendant_id;

                        break;
                    case 3:
                        if (selectedInsauranceInfo.otherParty && selectedInsauranceInfo.otherParty.other_party_id)
                            rec_id = selectedInsauranceInfo.otherParty.other_party_id;

                        break;
                }
                if (rec_id) {
                    info.associated_party = _.find(vm.plaintiffs, function (party) {
                        return party.id == rec_id && party.selectedPartyType == selectedInsauranceInfo.party_role;
                    });
                } else {
                    info.associated_party = null;
                }

            }
            info.associated_party_id = utils.isEmptyVal(info.associated_party) ? '' : info.associated_party.id;

            vm.newInsauranceInfo = info;
            //vm.newInsauranceInfo.plaintiffid = selectedInsauranceInfo.plaintiffid.plaintiffid;
        }

        // get contacts
        function getContacts(contactName, searchItem) {
            var postObj = {};
            postObj.type = globalConstants.mattDetailsInsurance;
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

        // close popup
        function closePopup() {
            $modalInstance.dismiss();
        }

        function saveInsauranceInfo(insauranceInfo) {
            insauranceInfo.matterid = matterId;

            if (validateInsauranceData(insauranceInfo)) {
                localStorage.setItem('ins_provider_for_settlement', insauranceInfo.insurance_provider_id);
                setIdsBeforeSaving(insauranceInfo);
                var insauranceObj = createInsauranceObject(insauranceInfo);
                switch (pageMode) {
                    case "add":
                        addInsurance(insauranceObj);
                        break;
                    case "edit":
                        editInsurance(insauranceObj, insauranceInfo.insurance_id);
                        break;
                }
            }

        }

        function validateInsauranceData(newInsauranceInfo) {
            if (utils.isEmptyVal(vm.newInsauranceInfo.associated_party) && utils.isEmptyVal(vm.newInsauranceInfo.insured_party) && utils.isEmptyVal(vm.newInsauranceInfo.insurance_provider) && utils.isEmptyVal(vm.newInsauranceInfo.insurance_adjuster) && utils.isEmptyVal(vm.newInsauranceInfo.insurance_type) && utils.isEmptyVal(vm.newInsauranceInfo.policy_limit) && utils.isEmptyVal(vm.newInsauranceInfo.policy_limit_max) && utils.isEmptyVal(vm.newInsauranceInfo.policy_number) && utils.isEmptyVal(vm.newInsauranceInfo.claim_number) && utils.isEmptyVal(vm.newInsauranceInfo.excess_confirmed) && utils.isEmptyVal(vm.newInsauranceInfo.policy_exhausted) && utils.isEmptyVal(vm.newInsauranceInfo.memo)) {
                notificationService.error("Please add some data to save");
                return;
            }

            //US#6288
            if (newInsauranceInfo.insured_party && newInsauranceInfo.insured_party.contact_id) {
                newInsauranceInfo.insured_party_id = newInsauranceInfo.insured_party.contact_id.toString();
            } else if (newInsauranceInfo.insured_party && newInsauranceInfo.insured_party.contactid) {
                newInsauranceInfo.insured_party_id = newInsauranceInfo.insured_party.contactid.toString();
            } else if (utils.isNotEmptyVal(newInsauranceInfo.insured_party)) {
                notificationService.error("Invalid Contact Selected in Insured Party");
                return false;
            } else {
                newInsauranceInfo.insured_party_id = '';
            }

            if (newInsauranceInfo.insurance_provider && newInsauranceInfo.insurance_provider.contact_id) {
                newInsauranceInfo.insurance_provider_id = newInsauranceInfo.insurance_provider.contact_id.toString();
            } else if (newInsauranceInfo.insurance_provider && newInsauranceInfo.insurance_provider.contactid) {
                newInsauranceInfo.insurance_provider_id = newInsauranceInfo.insurance_provider.contactid.toString();
            } else if (utils.isNotEmptyVal(newInsauranceInfo.insurance_provider)) {
                notificationService.error("Invalid Contact Selected in Insurance Provider");
                return false
            } else {
                newInsauranceInfo.insurance_provider_id = '';
            }

            if (newInsauranceInfo.insurance_adjuster && newInsauranceInfo.insurance_adjuster.contact_id) {
                newInsauranceInfo.insurance_adjuster_id = newInsauranceInfo.insurance_adjuster.contact_id.toString();
            } else if (newInsauranceInfo.insurance_adjuster && newInsauranceInfo.insurance_adjuster.contactid) {
                newInsauranceInfo.insurance_adjuster_id = newInsauranceInfo.insurance_adjuster.contactid.toString();
            } else if (utils.isNotEmptyVal(newInsauranceInfo.insurance_adjuster)) {
                notificationService.error("Invalid Contact Selected in Adjuster Name");
                return false
            } else {
                newInsauranceInfo.insurance_adjuster_id = '';
            }

            //US#7598 Make associated parties non-mandatory in matter details and doesn't allow empty form to save
            //Bug#9136
            if (parseFloat(newInsauranceInfo.policy_limit) > parseFloat(newInsauranceInfo.policy_limit_max)) {
                return notificationService.error("Policy limit range is incorrect.");
            }

            delete newInsauranceInfo.policy; //US#8103

            return true

        }

        // set ids which are in the form of object

        function setIdsBeforeSaving(newInsauranceInfo) {
            newInsauranceInfo.policy_limit = utils.isNotEmptyVal(newInsauranceInfo.policy_limit) ? newInsauranceInfo.policy_limit : null;
            newInsauranceInfo.policy_limit_max = (isNaN(parseFloat(newInsauranceInfo.policy_limit_max)) ? undefined : parseFloat(newInsauranceInfo.policy_limit_max));
            if (newInsauranceInfo.policy_limit_max != null && newInsauranceInfo.policy_limit_max != "" && newInsauranceInfo.policy_limit_max != undefined) {
                newInsauranceInfo.policy_limit_max = (newInsauranceInfo.policy_limit_max).toString();
            }

        }

        // add insurance
        function addInsurance(newInsauranceInfo) {

            matterDetailsService.addInsauranceRecord(newInsauranceInfo)
                .then(function () {
                    $modalInstance.close();
                    notificationService.success('Insurance added successfully.');
                }, function () {
                    // alert("unable to add");
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        // edit insurance
        function editInsurance(newInsauranceInfo, insuranceId) {
            newInsauranceInfo.insurance_id = insuranceId;
            matterDetailsService.editInsauranceRecord(newInsauranceInfo)
                .then(function () {
                    $modalInstance.close();
                    notificationService.success('Insurance updated successfully.');
                }, function () {
                    //alert("unable to edit");
                    notificationService.error('An error occurred. Please try later.');
                });
        }


        function createInsauranceObject(newInsauranceInfo) {
            var insauranceObj = {};

            insauranceObj.excess_confirmed = utils.isNotEmptyVal(newInsauranceInfo.excess_confirmed) ? (newInsauranceInfo.excess_confirmed) : null;
            insauranceObj.policy_exhausted = utils.isNotEmptyVal(newInsauranceInfo.policy_exhausted) ? (newInsauranceInfo.policy_exhausted) : null;

            insauranceObj.claim_number = utils.isNotEmptyVal(newInsauranceInfo.claim_number) ? (newInsauranceInfo.claim_number) : null;
            insauranceObj.policy_number = utils.isNotEmptyVal(newInsauranceInfo.policy_number) ? (newInsauranceInfo.policy_number) : null;
            insauranceObj.policy_limit = utils.isNotEmptyVal(newInsauranceInfo.policy_limit) ? parseFloat(newInsauranceInfo.policy_limit) : null;
            insauranceObj.policy_limit_max = utils.isNotEmptyVal(newInsauranceInfo.policy_limit_max) ? parseFloat(newInsauranceInfo.policy_limit_max) : null;

            insauranceObj.insurance_type = utils.isNotEmptyVal(newInsauranceInfo.insurance_type) ? newInsauranceInfo.insurance_type : null;
            insauranceObj.insured_party_id = utils.isNotEmptyVal(newInsauranceInfo.insured_party_id) ? newInsauranceInfo.insured_party_id : null;
            insauranceObj.insurance_provider_id = utils.isNotEmptyVal(newInsauranceInfo.insurance_provider_id) ? newInsauranceInfo.insurance_provider_id : null;
            insauranceObj.insurance_adjuster_id = utils.isNotEmptyVal(newInsauranceInfo.insurance_adjuster_id) ? newInsauranceInfo.insurance_adjuster_id : null;

            insauranceObj.associated_party_id = utils.isNotEmptyVal(newInsauranceInfo.associated_party_id) ? parseInt(newInsauranceInfo.associated_party_id) : null;
            insauranceObj.party_role = utils.isNotEmptyVal(newInsauranceInfo.party_role) ? newInsauranceInfo.party_role : null;

            insauranceObj.memo = newInsauranceInfo.memo;
            insauranceObj.matter_id = parseInt(newInsauranceInfo.matterid);
            if (newInsauranceInfo.insurance_documentid) {
                insauranceObj.insurance_documentid = newInsauranceInfo.insurance_documentid;
            }
            return insauranceObj;
        }

        //in our display value and model value are different for the input box
        //therefore we are formatting our display value based on the model value of the input box
        function formatTypeaheadDisplay(contact) {
            if (angular.isUndefined(contact) || utils.isEmptyString(contact)) {
                return undefined;
            }
            //if name prop is not present concat firstname and lastname
            //return (contact.name || (contact.firstname + " " + contact.lastname));
            var firstname = angular.isUndefined(contact.first_name) ? '' : contact.first_name;
            var lastname = angular.isUndefined(contact.last_name) ? '' : contact.last_name;
            return (contact.name || (firstname + " " + lastname));
        }

        // to open add new contact pop up
        function addNewContact(model) {
            var selectedType = {};
            selectedType.type = model;
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                response['firstname'] = response.first_name;
                response['lastname'] = response.last_name;
                response['contactid'] = (response.contact_id).toString();
                vm.newInsauranceInfo[model] = response;
                console.log("saved ");
            }, function () {
                console.log("closed");
            });
        }
    }

})();


(function (angular) {

    angular.module('cloudlex.matter')
        .factory('insuranceHelper', insuranceHelper);

    insuranceHelper.$inject = ['globalConstants'];

    function insuranceHelper(globalConstants) {
        return {
            insuranceGrid: _insuranceGrid,
            printInsurance: _printInsurance,
            getPartyRole: _getPartyRole,
            setEditedContactName: _setEditedContactName,
            setNames: _setNames,
            setEdited: _setEdited
        };

        function _printInsurance(printInfo, insuranceList) {
            var priinsuranceList = angular.copy(insuranceList);
            var party = printInfo.partyRole;
            var partyName = printInfo.partyName;

            switch (printInfo.partyId) {
                case 'alldefendant':
                    printInfo.partyName = 'All Defendants';
                    printInfo.partyRole = 'Defendant';
                    break;
                case 'allplaintiffs':
                    printInfo.partyName = 'All Plaintiffs';
                    printInfo.partyRole = 'Plaintiff';
                    break;
                case 'all':
                    printInfo.partyName = 'All Parties';
                    printInfo.partyRole = 'Records of';
                    break;
            }

            var filtersForPrint = _getFiltersForPrint(printInfo);
            var headers = _insuranceGrid();
            headers = _getPropsFromHeaders(headers);

            var printPage = _getPrintPage(filtersForPrint, headers, priinsuranceList);
            window.open().document.write(printPage);
        }

        function _getFiltersForPrint(printInfo, party) {
            var filtersForPrint = {
                'Matter Name': printInfo.matterName,
                'File #': printInfo.fileNumber
            };
            // printInfo.partyRole = printInfo.partyRole.charAt(0).toUpperCase() + printInfo.partyRole.slice(1);
            filtersForPrint["Records Of"] = printInfo.partyName;

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

        function _getPrintPage(filters, headers, insuranceList) {
            var html = "<html><title>Insurance Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Insurance Report</h1><div></div>";
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
            angular.forEach(headers, function (header) {
                //html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + header.display + "</th>";
                if (header.prop == 'policy') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px;text-align:right;'>" + header.display + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + header.display + "</th>";
                }
            });
            html += '</tr>';


            angular.forEach(insuranceList, function (item) {
                html += '<tr>';
                angular.forEach(headers, function (header) {
                    item[header.prop] = (_.isNull(item[header.prop]) || angular.isUndefined(item[header.prop]) ||
                        utils.isEmptyString(item[header.prop])) ? " - " : item[header.prop];

                    if (header.prop == 'policy') {
                        item[header.prop] = (item[header.prop] == -1) ? " $0.00 " : item[header.prop];
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;text-align:right;'>" +
                            item[header.prop] + "</td>";
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

        function _insuranceGrid() {
            return [{
                field: [{
                    html: '<span data-ng-show="(data.insurance_documentid && !(data.insurance_documentid==0))">' +
                        ' <open-doc doc-id={{[{doc_id:data.insurance_documentid}]}} matter-id={{matterDetail.matterId}}></open-doc>' +
                        '</span>' + '<span data-ng-hide="(data.insurance_documentid && !(data.insurance_documentid==0)) || insaurance.matterInfo.archivalMatterReadOnlyFlag" class ="sprite default-link" ng-click = "insaurance.linkUploadDoc(data)" tooltip="Link Document" tooltip-append-to-body="true" tooltip-placement="right"></span>',
                    inline: true
                }],
                dataWidth: "4"
            },
            {
                field: [{
                    html: '<span data-ng-show="data.memo" class ="sprite default-view-comment" ng-click = "insaurance.viewMedicalInfo(data)" tooltip="View Memo" tooltip-append-to-body="true" tooltip-placement="right"></span>',
                    inline: true,
                    cursor: true,

                }],
                dataWidth: "4"
            },
            {
                field: [{
                    prop: 'partyName',
                    template: 'custom',
                    customTemplate: '<span data-toggle="partyName-tooltip" title="{cellData}" data-ng-click="insaurance.openContactCard(data.associatedPartyForContactCard)">' +
                        '{cellData}' +
                        '</span>',
                    printDisplay: 'Associated Party',
                    compile: true,
                    inline: true,
                    cursor: true,
                    underline: true
                }],
                displayName: 'Associated Party',
                dataWidth: "12"
            },
            {
                field: [{
                    prop: 'insurance_type',
                    printDisplay: 'Type'
                }],
                displayName: 'Type',
                dataWidth: "10"
            },
            {
                field: [{
                    prop: 'insuredPartyName',
                    template: 'custom',
                    customTemplate: '<span data-toggle="insuredPartyName-tooltip" title="{cellData}" data-ng-click="insaurance.openContactCard(data.insured_party)">' +
                        '{cellData}' +
                        '</span>',
                    printDisplay: 'Insured Party',
                    //onClick: "insaurance.openContactCard(data.insuredpartyid.contactid)",
                    compile: true,
                    cursor: true,
                    underline: true
                }],
                displayName: 'Insured Party',
                dataWidth: "10"
            },
            {
                field: [{
                    prop: 'insuranceProviderName',
                    template: 'custom',
                    customTemplate: '<span data-toggle="insuranceProviderName-tooltip" title="{cellData}" data-ng-click="insaurance.openContactCard(data.insurance_provider)">' +
                        '{cellData}' +
                        '</span>',
                    printDisplay: 'Insurance Provider',
                    //onClick: "insaurance.openContactCard(data.insuranceproviderid)",
                    compile: true,
                    cursor: true,
                    underline: true
                }],
                displayName: 'Insurance Provider',
                dataWidth: "15"
            },
            {
                field: [{
                    prop: 'policy_number',
                    printDisplay: 'Policy Number'
                }],
                displayName: 'Policy Number',
                dataWidth: "10"
            },
            {
                field: [{
                    prop: 'policy',
                    html: '<span  tooltip="{{data.policy}}" tooltip-placement="bottom" tooltip-append-to-body="true">{{data.policy}}</span>',
                    printDisplay: 'Policy Limit'
                }],
                displayName: 'Policy Limit',
                dataWidth: "10"
            },
            {
                field: [{
                    prop: 'adjusterName',
                    printDisplay: 'Adjuster Name',
                    template: 'custom',
                    customTemplate: '<span data-toggle="adjusterName-tooltip" title="{cellData}" data-ng-click="insaurance.openContactCard(data.insurance_adjuster)">' +
                        '{cellData}' +
                        '</span>',
                    //onClick: "insaurance.openContactCard(data.adjusterid.contactid)",
                    compile: true,
                    cursor: true,
                    underline: true
                }],
                displayName: 'Adjuster Name',
                dataWidth: "10"
            },
            {
                field: [{
                    prop: 'claim_number',
                    printDisplay: 'Claim Number'
                }],
                displayName: 'Claim Number',
                dataWidth: "10"
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

        function _getPartyRole(show, allPartiesData) {

            if (show === 'all' || show === 'allplaintiff' || show === 'alldefendant') {
                return;
            }
            var partyInfo = _.find(allPartiesData, function (party) { return party.id === show });

            return partyInfo.isPlaintiff ? 'plaintiff' : 'defendant';

        }


        function _setPartyName(singleData) {
            if (utils.isNotEmptyVal(singleData.party_role)) {
                var value = parseInt(singleData.party_role);
                switch (value) {
                    case 1:
                        if (utils.isNotEmptyVal(singleData.plaintiff)) {
                            var fname = utils.isNotEmptyVal(singleData.plaintiff.first_name) ? singleData.plaintiff.first_name : '';
                            var lname = utils.isNotEmptyVal(singleData.plaintiff.last_name) ? singleData.plaintiff.last_name : '';
                            singleData.partyName = fname + " " + lname;
                            singleData.associatedPartyForContactCard = singleData.plaintiff;
                        } else {
                            singleData.partyName = '';
                        }
                        break;
                    case 2:
                        if (utils.isNotEmptyVal(singleData.defendant)) {
                            var fname = utils.isNotEmptyVal(singleData.defendant.first_name) ? singleData.defendant.first_name : '';
                            var lname = utils.isNotEmptyVal(singleData.defendant.last_name) ? singleData.defendant.last_name : '';
                            singleData.partyName = fname + " " + lname;
                            singleData.associatedPartyForContactCard = singleData.defendant;
                        } else {
                            singleData.partyName = '';
                        }
                        break;
                    case 3:
                        if (utils.isNotEmptyVal(singleData.otherParty)) {
                            var fname = utils.isNotEmptyVal(singleData.otherParty.first_name) ? singleData.otherParty.first_name : '';
                            var lname = utils.isNotEmptyVal(singleData.otherParty.last_name) ? singleData.otherParty.last_name : '';
                            singleData.partyName = fname + " " + lname;
                            singleData.associatedPartyForContactCard = singleData.otherParty;
                        } else {
                            singleData.partyName = '';
                        }
                        break;
                    default:
                        singleData.partyName = '';
                }
            } else {
                singleData.partyName = '';
            }
        }

        function _setEditedContactName(insurance, contactObj) {
            if (utils.isNotEmptyVal(insurance.associatedPartyForContactCard) &&
                insurance.associatedPartyForContactCard.contact_id === contactObj.contact_id) {
                insurance.associatedPartyForContactCard.first_name = contactObj.first_name;
                insurance.associatedPartyForContactCard.last_name = contactObj.last_name;
                insurance.edited = true;
            }

            if (utils.isNotEmptyVal(insurance.insured_party) &&
                insurance.insured_party.contact_id === contactObj.contact_id) {
                insurance.insured_party.first_name = contactObj.first_name;
                insurance.insured_party.last_name = contactObj.last_name;
                insurance.insured_party.edited = true;
            }

            if (utils.isNotEmptyVal(insurance.insurance_provider) &&
                insurance.insurance_provider.contact_id === contactObj.contact_id) {
                insurance.insurance_provider.first_name = contactObj.first_name;
                insurance.insurance_provider.last_name = contactObj.last_name;
                insurance.insurance_provider.edited = true;
            }

            if (utils.isNotEmptyVal(insurance.insurance_adjuster) &&
                insurance.insurance_adjuster.contact_id === contactObj.contact_id) {
                insurance.insurance_adjuster.first_name = contactObj.first_name;
                insurance.insurance_adjuster.last_name = contactObj.last_name;
                insurance.insurance_adjuster.edited = true;
            }
        }

        function _setNames(singleData) {
            _setPartyName(singleData);
            // _setPlaintiffName(singleData);
            _setInsurancePartyName(singleData);
            _setInsuranceProviderName(singleData);
            _setAdjusterName(singleData);
        }

        function _setPlaintiffName(singleData) {
            if (utils.isNotEmptyVal(singleData.plaintiffid)) {
                singleData.plaintiffName = singleData.plaintiffid.firstname + " " + singleData.plaintiffid.lastname;
            } else {
                singleData.plaintiffName = '';
            }
        }

        function _setInsurancePartyName(singleData) {
            if (utils.isNotEmptyVal(singleData.insured_party)) {
                singleData.insuredPartyName = singleData.insured_party.first_name + " " + singleData.insured_party.last_name;
            } else {
                singleData.insuredPartyName = '';
            }
        }

        function _setInsuranceProviderName(singleData) {
            if (utils.isNotEmptyVal(singleData.insurance_provider)) {
                singleData.insuranceProviderName = singleData.insurance_provider.first_name + " " + singleData.insurance_provider.last_name;
            } else {
                singleData.insuranceProviderName = '';
            }
        }

        function _setAdjusterName(singleData) {
            if (utils.isNotEmptyVal(singleData.insurance_adjuster)) {
                singleData.adjusterName = singleData.insurance_adjuster.first_name + " " + singleData.insurance_adjuster.last_name;
            } else {
                singleData.adjusterName = '';
            }
        }

        function _setEdited(insurance, contact) {

            insurance.edited = insurance.contactid === contact.contactid ? false : insurance.edited;

            if (utils.isNotEmptyVal(insurance.insured_party)) {
                insurance.insured_party.edited = insurance.insured_party.contactid === contact.contactid ?
                    false : insurance.insured_party.edited;
            }

            if (utils.isNotEmptyVal(insurance.insurance_provider)) {
                insurance.insurance_provider.edited = insurance.insurance_provider.contactid === contact.contactid ?
                    false : insurance.insurance_provider.edited;
            }

            if (utils.isNotEmptyVal(insurance.insurance_adjuster)) {
                insurance.insurance_adjuster.edited = insurance.insurance_adjuster.contactid === contact.contactid ?
                    false : insurance.insurance_adjuster.edited;
            }
        }
    }

})(angular);



//var isPlaintiff = insuData.role === 'plaintiff';
//var isDefendant = insuData.party_role === 'defendant';

//var partyName = _.find(allPartyData, function (party) {
//    return party.isPlaintiff ? (party.plaintiffid === insuData.associated_party_id) :
//        (party.defendantid === insuData.associated_party_id);
//});

//insuData.partyName = utils.isNotEmptyVal(partyName) ? partyName.name : '';
