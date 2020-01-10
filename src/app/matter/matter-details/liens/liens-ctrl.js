(function () {
    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('LiensCtrl', LiensCtrl);

    LiensCtrl.$inject = ['$scope', '$rootScope', '$stateParams', '$modal', 'liensHelper', 'matterDetailsService',
        'notification-service', 'modalService', 'contactFactory', 'masterData', 'mailboxDataService', 'matterFactory'
    ];

    function LiensCtrl($scope, $rootScope, $stateParams, $modal, liensHelper, matterDetailsService,
        notificationService, modalService, contactFactory, masterData, mailboxDataService, matterFactory) {
        var vm = this;
        var matterId = $stateParams.matterId;

        vm.liensList = [];
        vm.display = { refreshGrid: false };

        vm.openContactCard = openContactCard;
        vm.filterLienInfo = filterLienInfo;
        vm.addLiensInfo = addLiensInfo;
        vm.deleteLiens = deleteLiens;

        vm.selectAllUsers = selectAllUsers;
        vm.allUsersSelected = allUsersSelected;
        vm.isUserSelected = isUserSelected;
        vm.liensList = {};
        vm.liensList.liens = [];
        vm.printLiens = printLiens;
        vm.downloadLiens = downloadLiens;
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.viewMedicalInfo = viewMedicalInfo;
        vm.linkUploadDoc = linkUploadDoc;
        vm.unlinkDocument = unlinkDocument;
        vm.liensTotal = {};



        function openContactCard(contact) {

            if (utils.isEmptyVal(contact)) {
                return;
            }

            var contactId = utils.isNotEmptyVal(contact.contactid) ? contact.contactid : contact.contact_id;;

            contactFactory.displayContactCard1(contactId, contact.edited, contact.contact_type);

            _.forEach(vm.liensList.liens, function (lien) {
                liensHelper.setEdited(lien, contact);
            });

        }

        $scope.$on('contactCardEdited', function (e, editedContact) {
            var contactObj = editedContact;
            var liens = angular.copy(vm.liensList.liens);
            vm.liensList.liens = [];
            _.forEach(liens, function (lien) {
                liensHelper.setEditedContactName(lien, contactObj);
                liensHelper.setNames(lien);
            });
            vm.liensList.liens = liens;
        });

        // US13403: Export Liens List(PHP to Java)
        function downloadLiens(plaintiffid) {
            var show = utils.isNotEmptyVal(plaintiffid) ? plaintiffid.id : 'all';
            var partyRole = utils.isNotEmptyVal(plaintiffid) ? plaintiffid.selectedPartyType : '';
            matterDetailsService.downloadLiens(matterId, show, partyRole)
                .then(function (response) {
                    var filename = "Liens_List";
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

        function printLiens(plaintiffArray, plaintiffid) {
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
                    if (utils.isNotEmptyVal(vm.liensTotal)) {
                        _.forEach(vm.liensTotal.dueamount, function (data) {
                            data.dueamount = (_.isNull(data.dueamount) || angular.isUndefined(data.dueamount)) ? data.dueamount = "0" : data.dueamount;
                        })
                        _.forEach(vm.liensTotal.lienamount, function (data) {
                            data.lienamount = (_.isNull(data.lienamount) || angular.isUndefined(data.lienamount)) ? data.lienamount = "0" : data.lienamount;
                        })
                    } else {
                        vm.liensTotal = {};
                    }

                    liensHelper.printLiens(matterName, fileNumber, plaintiffName, vm.liensGrid.selectedItems, vm.liensList.liens, vm.liensTotal);
                }, function () {
                    //notificationService.error('An error occurred. Please try later.');
                })
        }

        (function () {
            window.parent.document.title = "Welcome to CloudLex";
            $rootScope.$emit('favicon', "favicon.ico");
            //initGrid();
            vm.liensGrid = {
                headers: liensHelper.liensGrid(),
                selectedItems: []
            };
            getLiensInfo(matterId);
            vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));
            getUserEmailSignature();
            vm.matterInfo = matterFactory.getMatterData(matterId);
        })();

        function selectAllUsers(isSelected) {
            if (isSelected === true) {
                vm.liensGrid.selectedItems = angular.copy(vm.liensList.liens);
            } else {
                vm.liensGrid.selectedItems = [];
            }
        }

        function allUsersSelected() {
            if (utils.isEmptyVal(vm.liensList) || vm.liensList.liens.length == 0) {
                return false;
            }

            return vm.liensGrid.selectedItems.length === vm.liensList.liens.length;
        }

        function isUserSelected(medicaltreatmentid) {
            var uids = _.pluck(vm.liensGrid.selectedItems, 'lien_id');
            return uids.indexOf(medicaltreatmentid) > -1;
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

        function getLiensInfo(matterId, plaintiffId, selectedPartyType) {
            vm.liensGrid.selectedItems.length = 0;
            var show = plaintiffId || "all";
            matterDetailsService.getLiensInfo(matterId, show, selectedPartyType)
                .then(function (response) {
                    var data = response;
                    //vm.liensList = data.liens;
                    vm.liensTotal = {};
                    //US#8769 pluck amount fields to be calculated
                    if (utils.isNotEmptyVal(data)) {
                        var dueamountCal = _.pluck(data, 'due_amount');
                        var lienamountCal = _.pluck(data, 'lien_amount');
                        //convert array into object for filters in html
                        vm.liensTotal.dueamount = dueamountCal.map(function (e) { return { dueamount: e } });
                        vm.liensTotal.lienamount = lienamountCal.map(function (e) { return { lienamount: e } });
                    }
                    vm.liensList.liens = [];
                    _.forEach(data, function (singleData) {
                        //var singleDataOjb = {};
                        liensHelper.setNames(singleData);
                        singleData.date_paid = (utils.isEmptyVal(singleData.date_paid) || singleData.date_paid == 0) ? "" : moment.unix(singleData.date_paid).utc().format("MM/DD/YYYY");
                        singleData.date_of_claim = (utils.isEmptyVal(singleData.date_of_claim) || singleData.date_of_claim == 0) ? "" : moment.unix(singleData.date_of_claim).utc().format("MM/DD/YYYY");
                        vm.liensList.liens.push(singleData);
                    })

                }, function () {
                    alert('unable to fetch liens');
                });
        }

        function filterLienInfo(plaintiffId, allPartyData, selectedPartyType) {
            getLiensInfo(matterId, plaintiffId, selectedPartyType);
        }




        function addLiensInfo(mode, allParties, selectedItems) {

            var resolveObj = {
                matterId: matterId,
                mode: mode,
                allParties: allParties,
                selectedItems: selectedItems
            };

            var modalInstance = openAddInsauranceModal(resolveObj);
            getliensListAfterSave(modalInstance);
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
                            type: 'liens'
                        };
                    }
                }
            });

            getliensListAfterSave(modalInstance);
        }

        /**
      * view comment information for selected Liens
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
            vm.liensGrid.selectedItems = [];
        });

        function openAddInsauranceModal(resolveObj) {
            return $modal.open({
                templateUrl: 'app/matter/matter-details/liens/add-edit-liens.html',
                controller: 'AddLiensCtrl as addLiens',
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

        function getliensListAfterSave(modalInstance) {
            modalInstance.result.then(function () {
                utils.isNotEmptyVal(vm.plaintiffid) ? getLiensInfo(matterId, vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getLiensInfo(matterId);
                //getLiensInfo(matterId, vm.plaintiffid.id,vm.plaintiffid.selectedPartyType); //Bug#5927
            }, function () { });
        }

        function unlinkDocument(selectedItems) {
            vm.LinkedDocRecords = {};
            var actionButton = 'Yes';
            var closeButtonText = "Cancel";
            var msg = 'Are you sure you want to unlink this Document(s) ?'

            vm.LinkedDocRecords = _.filter(selectedItems, function (item) {
                return utils.isNotEmptyVal(item.liens_documentid) && item.liens_documentid > 0;

            });
            vm.noDocRecords = _.filter(selectedItems, function (item) {
                return utils.isEmptyVal(item.liens_documentid) || item.liens_documentid == 0;

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
                var ids = _.pluck(vm.LinkedDocRecords, 'lien_id');
                var matterDetailName = "liens";
                matterDetailsService.unlinkDocument(ids, matterDetailName)
                    .then(function () {
                        utils.isNotEmptyVal(vm.plaintiffid) ? getLiensInfo(matterId, vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getLiensInfo(matterId);
                        notificationService.success('document unlinked successfully.');
                    }, function () {
                        //alert("unable to delete");
                        utils.isNotEmptyVal(vm.plaintiffid) ? getLiensInfo(matterId, vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getLiensInfo(matterId);
                        notificationService.error('An error occurred. Please try later.');
                    });

            });


        }

        function deleteLiens(selectedItems) {

            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {

                var ids = _.pluck(selectedItems, 'lien_id');
                matterDetailsService.deleteLienRecord(ids)
                    .then(function () {
                        utils.isNotEmptyVal(vm.plaintiffid) ? getLiensInfo(matterId, vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getLiensInfo(matterId);
                        //alert("deleted successfully");
                        notificationService.success('Lien deleted successfully.');
                    }, function () {
                        //alert("unable to delete");
                        notificationService.error('An error occurred. Please try later.');
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
        .controller('AddLiensCtrl', AddLiensCtrl);

    AddLiensCtrl.$inject = ['$modalInstance', 'matterDetailsService', 'addEditInsaurance', 'notification-service', 'contactFactory', 'matterFactory', 'globalConstants'];

    function AddLiensCtrl($modalInstance, matterDetailsService, addEditInsaurance, notificationService, contactFactory, matterFactory, globalConstants) {
        var vm = this;
        var contacts = [];

        var matterId = addEditInsaurance.matterId;
        var pageMode = addEditInsaurance.mode; //page mode : add, edit
        if (pageMode == "edit") {
            var Liensedit = addEditInsaurance.selectedItems[0];
            _.forEach(Liensedit, function (val, item) {
                val == " - " ? Liensedit[item] = "" : Liensedit[item] = val;
            });
        }
        var selectedLienInfo = pageMode === 'edit' ?
            angular.copy(addEditInsaurance.selectedItems[0]) : undefined;

        vm.newLiensInfo = {};
        vm.saveLiensInfo = saveLiensInfo;
        vm.getContacts = getContacts;
        vm.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;
        vm.setType = setType;
        vm.close = closePopup;
        vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
        vm.openDatePicker = openDatePicker;
        vm.newLiensInfo.due_amount = "";
        vm.newLiensInfo.lien_amount = "";
        vm.mode = pageMode;
        vm.addNewContact = addNewContact; // add new contact
        vm.isDatesValid = isDatesValid;

        vm.groupPlaintiffDefendants = groupPlaintiffDefendants;
        vm.setPartyRole = setPartyRole;
        vm.JavaFilterAPIForContactList = true;
        function isDatesValid() {
            if ($('#paiddateError').css("display") == "block" || $('#claimdateError').css("display") == "block") {
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
            vm.dateOptions = {
                formatYear: 'yyyy',
                startingDay: 1
            };
            vm.dateFormat = "MM/dd/yyyy";
            //  getPlaintiffs(matterId);
            vm.plaintiffs = addEditInsaurance.allParties.slice(3);
            // console.log(vm.plaintiffs);

            if (angular.isDefined(selectedLienInfo)) {
                setInsuranceInfo(selectedLienInfo);
            }



        })();


        function setPartyRole(selparty) {
            var partyInfo = _.find(vm.plaintiffs, function (party) {
                return party.id === selparty.id && party.selectedPartyType === selparty.selectedPartyType;
            });

            vm.newLiensInfo.plaintiffid = partyInfo.id;
            vm.newLiensInfo.party_role = partyInfo.selectedPartyType;
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


        // get plaintiffs
        function getPlaintiffs(matterId) {
            matterDetailsService.getPlaintiffs(matterId)
                .then(function (response) {
                    var data = response.data.data;
                    matterDetailsService.setNamePropForPlaintiffs(data);
                    vm.plaintiffs = data;
                }, function (error) { });
        }
        // set insurance information
        function setInsuranceInfo(selectedLienInfo) {
            vm.newLiensInfo = selectedLienInfo;
            if (utils.isNotEmptyVal(vm.newLiensInfo.party_role)) {
                var value = parseInt(vm.newLiensInfo.party_role);
                var rec_id = null;
                switch (value) {
                    case 1:
                        if (selectedLienInfo.plaintiff && selectedLienInfo.plaintiff.plaintiff_id)
                            rec_id = selectedLienInfo.plaintiff.plaintiff_id;

                        break;
                    case 2:
                        if (selectedLienInfo.defendant && selectedLienInfo.defendant.defendant_id)
                            rec_id = selectedLienInfo.defendant.defendant_id;

                        break;
                    case 3:
                        if (selectedLienInfo.otherParty && selectedLienInfo.otherParty.other_party_id)
                            rec_id = selectedLienInfo.otherParty.other_party_id;

                        break;
                }
                if (rec_id) {
                    vm.newLiensInfo.associated_party = _.find(vm.plaintiffs, function (party) {
                        return party.id == rec_id && party.selectedPartyType == selectedLienInfo.party_role;
                    });
                } else {
                    vm.newLiensInfo.associated_party = null;
                }

            }
            vm.newLiensInfo.plaintiffid = utils.isEmptyVal(vm.newLiensInfo.associated_party) ? '' : vm.newLiensInfo.associated_party.id;
        }

        function setType(model, type) {
            switch (type) {
                case "insurance_provider":
                    vm.newLiensInfo.is_global_insurance_provider = (model.contact_type == 'Local') ? 0 : 1;
                    break;
                case "lien_holder":
                    vm.newLiensInfo.is_global_lien_holder = (model.contact_type == 'Local') ? 0 : 1;
                    break;
                case "lien_adjuster":
                    vm.newLiensInfo.is_golbal_lien_adjuster = (model.contact_type == 'Local') ? 0 : 1;
                    break;
            }
        }
        // get contacts
        function getContacts(contactName) {
            var postObj = {};
            postObj.type = globalConstants.docLinesTypeList;
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

        function saveLiensInfo(newLiensInfo) {

            newLiensInfo.matterid = matterId;

            newLiensInfo.is_global_lien_holder = utils.isNotEmptyVal(newLiensInfo.lien_holder) ? newLiensInfo.lien_holder.contact_type == "Global" ? 1 : 0 : '';
            newLiensInfo.is_global_insurance_provider = utils.isNotEmptyVal(newLiensInfo.insurance_provider) ? newLiensInfo.insurance_provider.contact_type == "Global" ? 1 : 0 : '';
            newLiensInfo.is_golbal_lien_adjuster = utils.isNotEmptyVal(newLiensInfo.lien_adjuster) ? newLiensInfo.lien_adjuster.contact_type == "Global" ? 1 : 0 : '';

            newLiensInfo.due_amount = utils.isNotEmptyVal(newLiensInfo.due_amount) ? newLiensInfo.due_amount : null;
            newLiensInfo.lien_amount = utils.isNotEmptyVal(newLiensInfo.lien_amount) ? newLiensInfo.lien_amount : null;

            if (validateLiensData(newLiensInfo)) {
                setIdsBeforeSaving(newLiensInfo);
                var lienObj = createLienObject(newLiensInfo);
                switch (pageMode) {
                    case "add":
                        addLien(lienObj);
                        break;
                    case "edit":
                        editLien(lienObj);
                        break;
                }
            }

        }

        function validateLiensData(newLiensInfo) {

            //US#6288
            if (newLiensInfo.lien_holder && newLiensInfo.lien_holder.contact_id) {
                newLiensInfo.lien_holder_id = newLiensInfo.lien_holder.contact_id.toString();
            } else if (newLiensInfo.lien_holder && newLiensInfo.lien_holder.contactid) {
                newLiensInfo.lien_holder_id = newLiensInfo.lien_holder.contactid.toString();
            } else if (utils.isNotEmptyVal(newLiensInfo.lien_holder)) {
                notificationService.error("Invalid Contact Selected in Line Holder");
                return false;
            } else {
                newLiensInfo.lien_holder_id = '';
            }

            if (newLiensInfo.insurance_provider && newLiensInfo.insurance_provider.contact_id) {
                newLiensInfo.insurance_provider_Id = newLiensInfo.insurance_provider.contact_id.toString();
            } else if (newLiensInfo.insurance_provider && newLiensInfo.insurance_provider.contactid) {
                newLiensInfo.insurance_provider_Id = newLiensInfo.insurance_provider.contactid.toString();
            } else if (utils.isNotEmptyVal(newLiensInfo.insurance_provider)) {
                notificationService.error("Invalid Contact Selected in Insurance Provider");
                return false
            } else {
                newLiensInfo.insurance_provider_Id = '';
            }

            //US#7598 Make associated parties non-mandatory in matter details and doesn't allow empty form to save
            if (utils.isEmptyVal(newLiensInfo.associated_party) && utils.isEmptyVal(newLiensInfo.lien_holder) && utils.isEmptyVal(newLiensInfo.claim_number) && utils.isEmptyVal(newLiensInfo.insurance_provider) && utils.isEmptyVal(newLiensInfo.lien_amount) && utils.isEmptyVal(newLiensInfo.due_amount) && utils.isEmptyVal(newLiensInfo.date_paid) && utils.isEmptyVal(newLiensInfo.lien_adjuster) && utils.isEmptyVal(newLiensInfo.date_of_claim) && utils.isEmptyVal(newLiensInfo.memo)) {
                notificationService.error("Please add some data to save");
                return false;
            }

            var amount = parseFloat(newLiensInfo.lien_amount);
            var dueamount = parseFloat(newLiensInfo.due_amount);

            //US#16912 Removing logic in "Amount Due" when adding a lien
            /* if (utils.isNotEmptyVal(amount) && utils.isNotEmptyVal(dueamount)) {
                if (amount < dueamount) {
                    notificationService.error('Due Amount Should be less than Amount');
                    return false;
                }
            } */

            if (newLiensInfo.lien_adjuster && newLiensInfo.lien_adjuster.contact_id) {
                newLiensInfo.lien_adjuster_id = newLiensInfo.lien_adjuster.contact_id.toString();
            } else if (newLiensInfo.lien_adjuster && newLiensInfo.lien_adjuster.contactid) {
                newLiensInfo.lien_adjuster_id = newLiensInfo.lien_adjuster.contactid.toString();
            } else if (utils.isNotEmptyVal(newLiensInfo.lien_adjuster)) {
                notificationService.error("Invalid Contact Selected in Adjuster Name");
                return false
            } else {
                newLiensInfo.lien_adjuster_id = '';
            }
            return true
        }

        function setIdsBeforeSaving(newLiensInfo) {

            if (utils.isNotEmptyVal(vm.newLiensInfo.party_role) && vm.newLiensInfo.associated_party) {
                var value = vm.newLiensInfo.party_role;
                switch (value) {
                    case 1:
                        newLiensInfo.associated_party_id = vm.newLiensInfo.associated_party.plaintiffid;
                        break;
                    case 2:
                        newLiensInfo.associated_party_id = vm.newLiensInfo.associated_party.defendantid;
                        break;
                    case 3:
                        newLiensInfo.associated_party_id = vm.newLiensInfo.associated_party.id;
                        break;
                }
            }
        }
        // add lien
        function addLien(lienObj) {
            matterDetailsService.addLienRecord(lienObj)
                .then(function () {
                    $modalInstance.close();
                    notificationService.success('Lien added successfully.');
                }, function () {
                    //alert("unable to add");
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        // edit lien
        function editLien(lienObj) {
            matterDetailsService.editLienRecord(lienObj.lien_id, lienObj)
                .then(function () {
                    $modalInstance.close();
                    notificationService.success('Lien updated successfully.');
                }, function () {
                    // alert("unable to edit");
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function createLienObject(newLiensInfo) {
            var lienObj = {};
            lienObj.lien_id = newLiensInfo.lien_id;
            lienObj.date_of_claim = utils.isNotEmptyVal(newLiensInfo.date_of_claim) ? moment(newLiensInfo.date_of_claim).unix() : null;
            lienObj.date_paid = utils.isNotEmptyVal(newLiensInfo.date_paid) ? moment(newLiensInfo.date_paid).unix() : null;
            lienObj.claim_number = utils.isNotEmptyVal(newLiensInfo.claim_number) ? (newLiensInfo.claim_number) : null;
            lienObj.lien_amount = utils.isNotEmptyVal(newLiensInfo.lien_amount) ? parseFloat(newLiensInfo.lien_amount) : null;
            lienObj.due_amount = utils.isNotEmptyVal(newLiensInfo.due_amount) ? parseFloat(newLiensInfo.due_amount) : null;

            lienObj.lien_holder_id = utils.isNotEmptyVal(newLiensInfo.lien_holder_id) ? parseInt(newLiensInfo.lien_holder_id) : null;
            lienObj.insurance_provider_Id = utils.isNotEmptyVal(newLiensInfo.insurance_provider_Id) ? parseInt(newLiensInfo.insurance_provider_Id) : null;
            lienObj.lien_adjuster_id = utils.isNotEmptyVal(newLiensInfo.lien_adjuster_id) ? parseInt(newLiensInfo.lien_adjuster_id) : null;

            lienObj.associated_party_id = utils.isNotEmptyVal(newLiensInfo.associated_party_id) ? parseInt(newLiensInfo.associated_party_id) : null;
            lienObj.party_role = utils.isNotEmptyVal(newLiensInfo.party_role) ? newLiensInfo.party_role : null;
            lienObj.liens_documentid = utils.isNotEmptyVal(newLiensInfo.liens_documentid) ? parseInt(newLiensInfo.liens_documentid) : null;

            lienObj.is_global_lien_holder = utils.isNotEmptyVal(newLiensInfo.is_global_lien_holder) ? newLiensInfo.is_global_lien_holder : 0;
            lienObj.is_global_insurance_provider = utils.isNotEmptyVal(newLiensInfo.is_global_insurance_provider) ? newLiensInfo.is_global_insurance_provider : 0;
            lienObj.is_golbal_lien_adjuster = utils.isNotEmptyVal(newLiensInfo.is_golbal_lien_adjuster) ? newLiensInfo.is_golbal_lien_adjuster : 0;

            lienObj.memo = newLiensInfo.memo;
            lienObj.matter_id = parseInt(newLiensInfo.matterid);
            return lienObj;
        }

        //in our display value and model value are different for the input box
        //therefore we are formatting our display value based on the model value of the input box
        function formatTypeaheadDisplay(contact) {
            if (utils.isEmptyVal(contact)) {
                return undefined;
            }
            //if name prop is not present concat firstname and lastname
            //return (contact.name || (contact.firstname + " " + contact.lastname));
            var firstname = utils.isEmptyVal(contact) ? '' : contact.first_name;
            var lastname = utils.isEmptyVal(contact) ? '' : contact.last_name;
            return (contact.name || (firstname + " " + lastname));
        }

        // open date picker
        function openDatePicker($event) {
            $event.preventDefault();
            $event.stopPropagation();
            //vm.openDatePaidPicker = true;
        }

        // to open add new contact pop up
        function addNewContact(model, prop, type) {
            var selectedType = {};
            switch (type) {
                case "lien_holder":
                    selectedType.type = 'lien_holder';
                    break;
                case "liensinsuranceproviderid":
                    selectedType.type = 'liensinsuranceproviderid';
                    break;
                case "lien_adjuster":
                    selectedType.type = 'lien_adjuster';
                    break;
            }
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                response['firstname'] = response.first_name;
                response['lastname'] = response.last_name;
                response['contactid'] = (response.contact_id).toString();
                model[prop] = response;
            }, function () { });
        }

    }

})();


(function (angular) {

    angular.module('cloudlex.matter')
        .factory('liensHelper', liensHelper);

    liensHelper.$inject = ['globalConstants', '$filter'];

    function liensHelper(globalConstants, $filter) {
        return {
            liensGrid: _liensGrid,
            printLiens: _printLiens,
            setNames: _setNames,
            setEditedContactName: _setEditedContactName,
            setEdited: _setEdited
        };

        function _printLiens(matterName, fileNumber, plaintiffName, selectedItem, liensList, liensTotal) {
            var liensTotal = angular.copy(liensTotal);
            var priliensList = angular.copy(liensList);
            var filtersForPrint = _getFiltersForPrint(matterName, fileNumber, plaintiffName);
            var headers = _liensGrid();
            headers = _getPropsFromHeaders(headers);

            var printPage = _getPrintPage(filtersForPrint, headers, priliensList, liensTotal);
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
        //     return "$" + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        // }
        function currencyFormat(num) {
            num = num.toString();
            return "$" + num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        }

        function _getPrintPage(filters, headers, liensList, liensTotal) {
            var html = "<html><title>Liens Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Liens Report</h1><div></div>";
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
            if (!(_.isEmpty(liensTotal))) {
                html += "<tr>";
                html += '<div style="float: right;margin-bottom: 20px;" data-ng-if="expenses.expensesList.expenses.length > 0">';
                html += '<div style="float: left;margin-left: 15px;"><b>Total</b> </div>';
                html += '<div style="float: left;margin-left: 15px;">Amount: <b>' + $filter('currency')($filter('sumOfValue')(liensTotal.lienamount, 'lienamount'), '$', 2) + '</b></div>';
                html += '<div style="float: left;margin-left: 15px;">Amount Due: <b>' + $filter('currency')($filter('sumOfValue')(liensTotal.dueamount, 'dueamount'), '$', 2) + '</b></div>';
                html += '</div>';
                html += "</tr>";
            }


            html += '<tr>';
            angular.forEach(headers, function (header) {
                //html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + header.display + "</th>";
                if (header.prop == 'lien_amount' || header.prop == 'due_amount') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px;text-align:right;'>" + header.display + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + header.display + "</th>";
                }
            });
            html += '</tr>';


            angular.forEach(liensList, function (item) {
                html += '<tr>';
                angular.forEach(headers, function (header) {
                    item[header.prop] = (_.isNull(item[header.prop]) || angular.isUndefined(item[header.prop]) ||
                        utils.isEmptyString(item[header.prop])) ? " - " : item[header.prop];
                    if (header.prop == 'lien_amount' || header.prop == 'due_amount') {
                        item[header.prop] = (item[header.prop] == " - ") ? "" : item[header.prop];
                        if (utils.isEmptyString(item[header.prop])) {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'> - </td>";
                        } else {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" +
                                $filter('currency')(item[header.prop], '$', 2) + "</td>";
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

        function _liensGrid() {
            return [{
                field: [{
                    html: '<span data-ng-show="data.liens_documentid && !(data.liens_documentid==0)">' +
                        '<open-doc doc-id={{[{doc_id:data.liens_documentid}]}} matter-id={{matterDetail.matterId}}></open-doc>' +
                        '</span>' + '<span data-ng-hide="(data.liens_documentid && !(data.liens_documentid==0)) || liens.matterInfo.archivalMatterReadOnlyFlag" class ="sprite default-link" ng-click = "liens.linkUploadDoc(data)" tooltip="Link Document" tooltip-append-to-body="true" tooltip-placement="right"></span>',
                    inline: true
                }],
                dataWidth: "4"
            },
            {
                field: [{
                    html: '<span data-ng-show="data.memo" class ="sprite default-view-comment" ng-click = "liens.viewMedicalInfo(data)" tooltip="View Memo" tooltip-append-to-body="true" tooltip-placement="right"></span>',
                    inline: true,
                    cursor: true,

                }],
                dataWidth: "4"
            },
            {
                field: [{
                    prop: 'plaintiffName',
                    printDisplay: 'Associated Party',
                    template: 'custom',
                    customTemplate: '<span data-toggle="plaintiffName-tooltip" title="{cellData}" data-ng-click="liens.openContactCard(data.associatedPartyForContactCard)">' +
                        '{cellData}' +
                        '</span>',
                    compile: true,
                    inline: true,
                    cursor: true,
                    underline: true
                }],
                displayName: 'Associated Party',
                dataWidth: "14"
            },
            {
                field: [{
                    prop: 'lienholderName',
                    printDisplay: 'Lien Holder',
                    onClick: "liens.openContactCard(data.lien_holder)",
                    compile: true,
                    cursor: true,
                    underline: true
                }],
                displayName: 'Lien Holder',
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
                    prop: 'insuranceProviderName',
                    printDisplay: 'Insurance Provider',
                    onClick: "liens.openContactCard(data.insurance_provider)",
                    compile: true,
                    cursor: true,
                    underline: true
                }],
                displayName: 'Insurance Provider',
                dataWidth: "12"
            },
            {
                field: [{
                    prop: 'lien_amount',
                    printDisplay: 'Amount',
                    html: '<span tooltip="{{data.lien_amount ? (data.lien_amount | currency) : \'\'}}" tooltip-placement="bottom" tooltip-append-to-body="true">{{data.lien_amount ? (data.lien_amount | currency) : \"\"}}</span>'
                }],
                displayName: 'Amount',
                dataWidth: "10"
            },
            {
                field: [{
                    prop: 'due_amount',
                    printDisplay: 'Amount Due',
                    html: '<span tooltip="{{data.due_amount ? (data.due_amount | currency) : \'\'}}" tooltip-placement="bottom" tooltip-append-to-body="true">{{data.due_amount ? (data.due_amount | currency) : \"\"}}</span>'
                }],
                displayName: 'Amount Due',
                dataWidth: "10"
            },
            {
                field: [{
                    prop: 'date_paid',
                    printDisplay: 'Date Paid'
                }],
                displayName: 'Date Paid',
                dataWidth: "10"
            },
            {
                field: [{
                    prop: 'adjusterName',
                    printDisplay: 'Adjuster Name',
                    onClick: "liens.openContactCard(data.lien_adjuster)",
                    compile: true,
                    cursor: true,
                    underline: true
                }],
                displayName: 'Adjuster Name',
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

        function _setNames(singleData) {

            if (utils.isNotEmptyVal(singleData.party_role)) {
                var value = parseInt(singleData.party_role);
                switch (value) {
                    case 1:
                        if (utils.isNotEmptyVal(singleData.plaintiff)) {
                            var fname = utils.isNotEmptyVal(singleData.plaintiff.first_name) ? singleData.plaintiff.first_name : '';
                            var lname = utils.isNotEmptyVal(singleData.plaintiff.last_name) ? singleData.plaintiff.last_name : '';
                            singleData.plaintiffName = fname + " " + lname;
                            singleData.associatedPartyForContactCard = singleData.plaintiff;
                        } else {
                            singleData.plaintiffName = '';
                        }
                        break;
                    case 2:
                        if (utils.isNotEmptyVal(singleData.defendant)) {
                            var fname = utils.isNotEmptyVal(singleData.defendant.first_name) ? singleData.defendant.first_name : '';
                            var lname = utils.isNotEmptyVal(singleData.defendant.last_name) ? singleData.defendant.last_name : '';
                            singleData.plaintiffName = fname + " " + lname;
                            singleData.associatedPartyForContactCard = singleData.defendant;
                        } else {
                            singleData.plaintiffName = '';
                        }
                        break;
                    case 3:
                        if (utils.isNotEmptyVal(singleData.otherParty)) {
                            var fname = utils.isNotEmptyVal(singleData.otherParty.first_name) ? singleData.otherParty.first_name : '';
                            var lname = utils.isNotEmptyVal(singleData.otherParty.last_name) ? singleData.otherParty.last_name : '';
                            singleData.plaintiffName = fname + " " + lname;
                            singleData.associatedPartyForContactCard = singleData.otherParty;
                        } else {
                            singleData.plaintiffName = '';
                        }
                        break;
                    default:
                        singleData.plaintiffName = '';
                }
            }


            if (utils.isNotEmptyVal(singleData.lien_holder)) {
                singleData.lienholderName = singleData.lien_holder.first_name + " " + singleData.lien_holder.last_name;
            } else {
                singleData.lienholderName = '';
            }


            if (utils.isNotEmptyVal(singleData.insurance_provider)) {
                singleData.insuranceProviderName = singleData.insurance_provider.first_name + " " + singleData.insurance_provider.last_name;

            } else {
                singleData.insuranceProviderName = '';
            }

            if (utils.isNotEmptyVal(singleData.lien_adjuster)) {
                singleData.adjusterName = singleData.lien_adjuster.first_name + " " + singleData.lien_adjuster.last_name;

            } else {
                singleData.adjusterName = '';
            }
        }

        function _setEdited(lien, contact) {

            if (utils.isNotEmptyVal(lien.associatedPartyForContactCard)) {
                lien.associatedPartyForContactCard['edited'] = lien.associatedPartyForContactCard.contact_id === contact.contact_id ? false : true;
            }

            if (utils.isNotEmptyVal(lien.lien_adjuster)) {
                lien.lien_adjuster['edited'] = lien.lien_adjuster.contact_id === contact.contact_id ? false : true;
            }

            if (utils.isNotEmptyVal(lien.insurance_provider)) {
                lien.insurance_provider['edited'] = lien.insurance_provider.contact_id === contact.contact_id ? false : true;
            }

            if (utils.isNotEmptyVal(lien.lien_holder)) {
                lien.lien_holder['edited'] = lien.lien_holder.contact_id === contact.contact_id ? false : true;
            }

        }

        function _setEditedContactName(lien, contact) {

            if (utils.isNotEmptyVal(lien.associatedPartyForContactCard) &&
                lien.associatedPartyForContactCard.contact_id === contact.contact_id) {
                lien.associatedPartyForContactCard.first_name = contact.first_name;
                lien.associatedPartyForContactCard.last_name = contact.last_name;
                lien.associatedPartyForContactCard.edited = true;
            }

            if (utils.isNotEmptyVal(lien.lien_adjuster) &&
                lien.lien_adjuster.contact_id === contact.contact_id) {
                lien.lien_adjuster.first_name = contact.first_name;
                lien.lien_adjuster.last_name = contact.last_name;
                lien.lien_adjuster.edited = true;
            }

            if (utils.isNotEmptyVal(lien.insurance_provider) &&
                lien.insurance_provider.contact_id === contact.contact_id) {
                lien.insurance_provider.first_name = contact.first_name;
                lien.insurance_provider.last_name = contact.last_name;
                lien.insurance_provider.edited = true;
            }

            if (utils.isNotEmptyVal(lien.lien_holder) &&
                lien.lien_holder.contact_id === contact.contact_id) {
                lien.lien_holder.first_name = contact.first_name;
                lien.lien_holder.last_name = contact.last_name;
                lien.lien_holder.edited = true;
            }
        }
    }

})(angular);
