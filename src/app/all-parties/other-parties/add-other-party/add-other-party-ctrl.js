(function () {
    'use strict';

    angular.module('cloudlex.allParties')
        .controller('AddOtherPartyCtrl', AddOtherPartyCtrl);

    AddOtherPartyCtrl.$inject = ["globalConstants", "matterFactory", "allPartiesDataService", "contactFactory", "masterData", "$stateParams",
        "$state", "notification-service"
    ];

    function AddOtherPartyCtrl(globalConstants, matterFactory, allPartiesDataService, contactFactory, masterData, $stateParams,
        $state, notificationService) {

        var matterId = $stateParams.matterId;
        var vm = this;
        var selectedOtherParty = $stateParams.selectedOtherParty;

        var masterDt = masterData.getMasterData();

        vm.getContacts = getContacts;
        vm.formatTypeaheadDisplay = contactFactory.formatTypeaheadDisplay;
        vm.setType = setType;
        vm.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;
        vm.mode = localStorage.getItem('mode');
        vm.addNewContact = addNewContact;
        vm.save = saveOtherParty;
        vm.cancel = cancelSave;
        vm.disableSave = disableSave;
        vm.groupPlaintiffDefendants = groupPlaintiffDefendants;
        vm.isEditMode = false;
        vm.updateAssociatedParty = updateAssociatedParty;
        vm.addAssociatedParty = addAssociatedParty;
        vm.JavaFilterAPIForContactList = true;

        (function () {
            vm.otherPartyInfo = {};
            vm.contactRoles = [];
            vm.plaintiffs = [];
            vm.plaintiffDefendants = [];
            vm.contactRoles = masterDt.contact_roles;



            if ($state.current) {
                if ($state.current.name === "editOtherParty") {
                    //Populdate other party info
                    initiateEditMode();
                }
                /*else {
                                   if (vm.contactRoles) {
                                       vm.otherPartyInfo.contactRole = vm.contactRoles[0];
                                   }
                               }*/
            }

            getPlaintiffs();
        })();


        function updateAssociatedParty(item) {
            var partyId = item.party_role == "plaintiff" ? "plaintiffid" : "defendantid";
            _.forEach(selectedOtherParty.party_contact_id, function (party) {
                if (party['party_role'] == item.party_role && party.associated_party_id == item[partyId]) {
                    party.action = "D";
                }
            });
            vm.otherPartyInfo.party_contact_id = selectedOtherParty.party_contact_id;
        }

        function addAssociatedParty(item) {
            var partyId = item.party_role == "plaintiff" ? "plaintiffid" : "defendantid";
            var recordAdded = false;
            _.forEach(selectedOtherParty.party_contact_id, function (party) {
                if (party['party_role'] == item.party_role && party.associated_party_id == item[partyId]) {
                    party.action = party.action == "D" ? null : party.action;
                    recordAdded = true;
                    //  selectedOtherParty.associated_party_id = item.party_role == "plaintiff" ? _.unique(selectedOtherParty.associated_party_id,"plaintiffid") : _.unique(selectedOtherParty.associated_party_id,"defendantid"); 
                }
            });
            if (!recordAdded) {
                var Obj = {};
                Obj.associated_party_id = item[partyId];
                Obj.action = "A"
                // Obj.contact_type = item.contactid.type;
                // Obj.contactid = item.contactid.contactid;
                // Obj.mattercontactid = '';
                // Obj.name = item.contactid.firstname + ' ' + item.contactid.lastname;
                Obj.party_role = item.party_role;
                selectedOtherParty.party_contact_id.push(Obj);
                vm.otherPartyInfo.party_contact_id = selectedOtherParty.party_contact_id;
            }
        }


        function getContacts(contactName) {
            var postObj = {};
            postObj.type = globalConstants.allTypeListWithoutCourt;
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            //postObj = matterFactory.setContactType(postObj);
            postObj.page_Size = 250

            return matterFactory.getContactsByName(postObj, vm.JavaFilterAPIForContactList)
                .then(function (response) {
                    var data = response.data;
                    contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
                    contactFactory.setNamePropForContactsOffDrupal(data);
                    _.forEach(data, function (contact) {
                        contact.name = utils.removeunwantedHTML(contact.first_name) + ' ' + utils.removeunwantedHTML(contact.last_name);
                    });
                    return data;
                });
        }

        function getPlaintiffs() {
            selectedOtherParty = $stateParams.selectedOtherParty;
            var plaintiffData = sessionStorage.getItem("selectedOtherParty");
            if (plaintiffData) {
                plaintiffData = JSON.parse(plaintiffData);
                if (plaintiffData.matterId == matterId) {
                    selectedOtherParty = plaintiffData.otherParty;
                    selectedOtherParty.party_contact_id = selectedOtherParty.party_contact_id ? _.uniq(selectedOtherParty.party_contact_id, 'associated_party_id') : selectedOtherParty.party_contact_id;
                }
            }
            allPartiesDataService.getPlaintiffs(matterId)
                .then(function (response) {
                    vm.plaintiffs = response.data;
                    getDefendants();
                });
        };

        function getDefendants() {
            allPartiesDataService.getDefendants(matterId)
                .then(function (response) {
                    vm.defendants = response.data;
                    var plaintiffs = angular.copy(vm.plaintiffs);
                    var defendants = angular.copy(vm.defendants);
                    setPlaintiffDefendantData(plaintiffs, defendants);
                    //If edit mode; show associated plaintiff selected
                    if (vm.isEditMode && selectedOtherParty && selectedOtherParty.party_contact_id) {

                        _.forEach(selectedOtherParty.party_contact_id, function (selectedOtParty) {
                            selectedOtParty.action = null;
                            var partyId = selectedOtParty.party_role == "plaintiff" ? "plaintiffid" : "defendantid";
                            var selAssoParty = _.find(vm.plaintiffDefendants, function (party) {
                                return party['party_role'] == selectedOtParty.party_role && party[partyId] == selectedOtParty.associated_party_id;
                            });

                            utils.isNotEmptyVal(selAssoParty) ? vm.otherPartyInfo.associated_party_id.push(selAssoParty) : angular.noop();
                        });
                    }
                });
        }

        function setPlaintiffDefendantData(plaintiffs, defendants) {
            plaintiffs = utils.isEmptyVal(plaintiffs) ? [] : plaintiffs;
            defendants = utils.isEmptyVal(defendants) ? [] : defendants;

            plaintiffs.forEach(function (plaintiff) {
                plaintiff['party_role'] = 'plaintiff'
            });
            defendants.forEach(function (defendant) {
                defendant['party_role'] = 'defendant'
            });

            vm.plaintiffDefendants = plaintiffs.concat(defendants);
        }

        function groupPlaintiffDefendants(party) {
            if (party['party_role'] == 'plaintiff') {
                return "Plaintiffs";
            }

            if (party['party_role'] == 'defendant') {
                return "Defendants";
            }
        }

        function initiateEditMode() {
            vm.isEditMode = true;
            /*if (utils.isNotEmptyVal(selectedOtherParty.associated_party_id)) {
                selectedOtherParty.associated_party_id['party_role'] = selectedOtherParty.party_role;
            }*/
            var plaintiffData = sessionStorage.getItem("selectedOtherParty");
            if (plaintiffData) {
                plaintiffData = JSON.parse(plaintiffData);
                if (plaintiffData.matterId == matterId) {
                    selectedOtherParty = plaintiffData.otherParty;
                }
            }
            vm.otherPartyInfo = selectedOtherParty;
            if (vm.otherPartyInfo) {
                vm.otherPartyInfo.associated_party_id = [];
            }
            angular.forEach(vm.contactRoles, function (field, index) {
                if (selectedOtherParty && selectedOtherParty.contactroleid && field.contactroleid == selectedOtherParty.contactroleid) {
                    vm.otherPartyInfo.contactRole = field;
                }
            });
        };

        function setType(model) {
            // console.log(model);
            vm.otherPartyInfo.is_global = (model.contact_type == 'Local') ? 0 : 1;
        }
        function checkIfEnterKeyWasPressed(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
            return true;

        };
        function addNewContact(type) {
            var selectedType = {};
            selectedType.type = type;
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                if (response) {
                    vm.otherPartyInfo.contact = response;
                    vm.otherPartyInfo.contact['firstname'] = vm.otherPartyInfo.contact.first_name;
                    vm.otherPartyInfo.contact['lastname'] = vm.otherPartyInfo.contact.last_name;
                    vm.otherPartyInfo.contact['contactid'] = (vm.otherPartyInfo.contact.contact_id).toString();
                }
            }, function () { });
        }

        // save other party
        function saveOtherParty() {

            if (vm.isEditMode) {
                updateOtherParty();
            } else {
                addOtherParty();
            }

        }


        function getFormatteddata(Alldata, datatype) { // remove br to show data in edit mode
            //     var data_array = Alldata.phone.split("<br/>");
            var datalist = [];
            var phonetype;

            switch (datatype) {
                case 'phone':
                    var keys = Object.keys(Alldata);
                    if (utils.isNotEmptyVal(Alldata.phone_cell)) {
                        var splittedwithcomma = Alldata.phone_cell.split(","); // split string: 999-999-9999 Ext:1234, 999-999-9999 Ext:1234 > [0]=999-999-9999 Ext:1234 [1]=999-999-9999 Ext:1234 
                        _.forEach(splittedwithcomma, function (commaSeperated, i) { // [0]=999-999-9999 Ext:1234
                            var indexOfE = commaSeperated.indexOf("E");
                            var phoneNumberStr, extentionStr, phoneNumber, extention;
                            if (indexOfE > -1) {
                                phoneNumberStr = (commaSeperated.slice(0, indexOfE - 1)).trim();
                                extentionStr = (commaSeperated.slice(indexOfE - 1)).trim();
                                phoneNumber = utils.isEmptyVal(phoneNumberStr) ? '' : phoneNumberStr;
                                extention = utils.isEmptyVal(extentionStr) ? '' : extentionStr.split(":"); // split string: Ext:1234
                            } else {
                                phoneNumberStr = (commaSeperated.slice(0)).trim();
                                phoneNumber = utils.isEmptyVal(phoneNumberStr) ? '' : phoneNumberStr;
                                extention = '';
                            }
                            datalist.push({
                                id: '' + datatype + (parseInt(i) + 1),
                                value: phoneNumber,
                                extid: 'ext' + (parseInt(i) + 1),
                                ext: extention[1],
                                phone_type: 'Cell'
                            });
                        });
                    }
                    if (utils.isNotEmptyVal(Alldata.phone_home)) {
                        var splittedwithcomma = Alldata.phone_home.split(","); // split string: 999-999-9999 Ext:1234, 999-999-9999 Ext:1234 > [0]=999-999-9999 Ext:1234 [1]=999-999-9999 Ext:1234 
                        _.forEach(splittedwithcomma, function (commaSeperated, i) { // [0]=999-999-9999 Ext:1234
                            var indexOfE = commaSeperated.indexOf("E");
                            var phoneNumberStr, extentionStr, phoneNumber, extention;
                            if (indexOfE > -1) {
                                phoneNumberStr = (commaSeperated.slice(0, indexOfE - 1)).trim();
                                extentionStr = (commaSeperated.slice(indexOfE - 1)).trim();
                                phoneNumber = utils.isEmptyVal(phoneNumberStr) ? '' : phoneNumberStr;
                                extention = utils.isEmptyVal(extentionStr) ? '' : extentionStr.split(":"); // split string: Ext:1234
                            } else {
                                phoneNumberStr = (commaSeperated.slice(0)).trim();
                                phoneNumber = utils.isEmptyVal(phoneNumberStr) ? '' : phoneNumberStr;
                                extention = '';
                            }
                            datalist.push({
                                id: '' + datatype + (parseInt(i) + 1),
                                value: phoneNumber,
                                extid: 'ext' + (parseInt(i) + 1),
                                ext: extention[1],
                                phone_type: 'Home'
                            });
                        });
                    }
                    if (utils.isNotEmptyVal(Alldata.phone_work)) {
                        var splittedwithcomma = Alldata.phone_work.split(","); // split string: 999-999-9999 Ext:1234, 999-999-9999 Ext:1234 > [0]=999-999-9999 Ext:1234 [1]=999-999-9999 Ext:1234 
                        _.forEach(splittedwithcomma, function (commaSeperated, i) { // [0]=999-999-9999 Ext:1234
                            var indexOfE = commaSeperated.indexOf("E");
                            var phoneNumberStr, extentionStr, phoneNumber, extention;
                            if (indexOfE > -1) {
                                phoneNumberStr = (commaSeperated.slice(0, indexOfE - 1)).trim();
                                extentionStr = (commaSeperated.slice(indexOfE - 1)).trim();
                                phoneNumber = utils.isEmptyVal(phoneNumberStr) ? '' : phoneNumberStr;
                                extention = utils.isEmptyVal(extentionStr) ? '' : extentionStr.split(":"); // split string: Ext:1234
                            } else {
                                phoneNumberStr = (commaSeperated.slice(0)).trim();
                                phoneNumber = utils.isEmptyVal(phoneNumberStr) ? '' : phoneNumberStr;
                                extention = '';
                            }
                            datalist.push({
                                id: '' + datatype + (parseInt(i) + 1),
                                value: phoneNumber,
                                extid: 'ext' + (parseInt(i) + 1),
                                ext: extention[1],
                                phone_type: 'Work'
                            });
                        });
                    }
                    break;
                case 'email':
                    var data_array = Alldata.split(",");
                    _.forEach(data_array, function (data, i) {
                        data = data.trim();
                        datalist.push({
                            id: '' + datatype + (parseInt(i) + 1),
                            value: data
                        });
                    });
                    break;
                case 'fax':
                    var data_array = Alldata.split(",");
                    _.forEach(data_array, function (data, i) {
                        data = data.trim();
                        datalist.push({
                            id: '' + datatype + (parseInt(i) + 1),
                            value: data
                        });
                    });
                    break;
            }
            return datalist;
        }

        function updateOtherParty() {

            var saveInput = {};
            saveInput.contactid = vm.otherPartyInfo.contactid;
            saveInput.matterid = matterId;
            // saveInput.uid = vm.otherPartyInfo.uid;
            saveInput.is_global = vm.otherPartyInfo.is_global;
            saveInput.contactroleid = angular.isUndefined(vm.otherPartyInfo.contactRole) ? null :
                vm.otherPartyInfo.contactRole.contactroleid;
            saveInput.contactrolename = angular.isUndefined(vm.otherPartyInfo.contactRole) ? null :
                vm.otherPartyInfo.contactRole.contactrolename;
            saveInput.party_contact_id = vm.otherPartyInfo.party_contact_id;

            saveInput['party_role'] = (utils.isEmptyVal(vm.otherPartyInfo.associated_party_id) &&
                utils.isEmptyVal(vm.otherPartyInfo.associated_party_id.contactid)) ? null :
                vm.otherPartyInfo.associated_party_id['party_role'];

            if (utils.isNotEmptyVal(saveInput['party_role'])) {
                saveInput.associated_party_id = (utils.isEmptyVal(vm.otherPartyInfo.associated_party_id)) ? null :
                    ((saveInput['party_role'] == 'defendant') ?
                        vm.otherPartyInfo.associated_party_id.defendantid :
                        vm.otherPartyInfo.associated_party_id.plaintiffid);
            }

            // call the data serivce function to make post call 
            allPartiesDataService.editOtherParty(saveInput).then(function (response) {
                //                allPartiesDataService
                //                .getAllParties(matterId).then(function () {
                //                    
                //                });
                notificationService.success('Other Party updated successfully!');
                $state.go("allParties", {
                    'matterId': matterId,
                    'openView': 'OTHER_PARTY_VIEW'
                });
            }, function (reason) {
                notificationService.error(reason.data[0]);
            });

        };

        function addOtherParty() {

            var saveInput = {};
            var associated_id = []
            var associated_party_role = [];
            saveInput.contactid = angular.isUndefined(vm.otherPartyInfo.contact) ? null : vm.otherPartyInfo.contact.contactid;
            saveInput.matterid = matterId;
            saveInput.contactroleid = angular.isUndefined(vm.otherPartyInfo.contactRole) ? null : vm.otherPartyInfo.contactRole.contactroleid;
            saveInput.contactrolename = angular.isUndefined(vm.otherPartyInfo.contactRole) ? null : vm.otherPartyInfo.contactRole.contactrolename;
            saveInput.is_global = angular.isDefined(vm.otherPartyInfo.is_global) ? vm.otherPartyInfo.is_global : 0;
            saveInput.specialty = angular.isUndefined(vm.otherPartyInfo.contact) ? null : vm.otherPartyInfo.contact.specialty;
            _.forEach(vm.otherPartyInfo.associated_party_id, function (currentItem, index) {

                var party_role = "",
                    party_id = "";
                (currentItem.defendantid != undefined) ? party_id = currentItem.defendantid : party_id = currentItem.plaintiffid;
                associated_id.push(party_id);
                (currentItem.party_role == 'plaintiff') ? party_role = 'pl' : (currentItem.party_role == 'defendant') ? party_role = 'df' : '';
                associated_party_role.push(party_role);
            })

            saveInput.associated_party_id = {
                'id': associated_id.toString(),
                'party_role': associated_party_role.toString()
            };

            saveInput['party_role'] = (utils.isEmptyVal(vm.otherPartyInfo.associated_party_id) &&
                utils.isEmptyVal(vm.otherPartyInfo.associated_party_id.contactid)) ? null :
                vm.otherPartyInfo.associated_party_id['party_role'];

            if (utils.isNotEmptyVal(saveInput['party_role'])) {
                saveInput.associated_party_id = (utils.isEmptyVal(vm.otherPartyInfo.associated_party_id)) ? null :
                    ((saveInput['party_role'] == 'defendant') ?
                        vm.otherPartyInfo.associated_party_id.defendantid :
                        vm.otherPartyInfo.associated_party_id.plaintiffid);
            }
            // call the data serivce function to make post call 
            allPartiesDataService.addOtherParty(saveInput).then(function (response) {
                //                allPartiesDataService
                //                .getAllParties(matterId).then(function () {
                //                });
                notificationService.success('Other Party added successfully!');
                sessionStorage.removeItem("selectedOtherParty");
                $state.go("allParties", {
                    'matterId': matterId,
                    'openView': 'OTHER_PARTY_VIEW'
                }, {
                        reload: true
                    });
            }, function (reason) {
                notificationService.error(reason.data[0]);
            });
        }


        function cancelSave() {
            sessionStorage.removeItem("selectedOtherParty");
            $state.go("allParties", {
                'matterId': matterId,
                'openView': 'OTHER_PARTY_VIEW'
            });
        }

        function disableSave() {

            if (vm.isEditMode && vm.otherPartyInfo && typeof vm.otherPartyInfo.associated_party_id == 'object' && vm.otherPartyInfo.associated_party_id.length != 0) {
                return false;
            }
            if (vm.otherPartyInfo && typeof vm.otherPartyInfo.contact === 'object' && typeof vm.otherPartyInfo.contactRole === 'object' && typeof vm.otherPartyInfo.associated_party_id === 'object' && vm.otherPartyInfo.associated_party_id != 0 && vm.otherPartyInfo.contact.contactid) {
                return false;
            }

            return true;
        };

    }


})();
