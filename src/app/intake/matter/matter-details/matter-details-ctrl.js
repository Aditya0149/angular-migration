(function () {

    'use strict';

    angular
        .module('intake.matter')
        .controller('MatterDetailsCtrlIntake', MatterDetailsCtrl);

    MatterDetailsCtrl.$inject = ['$scope', '$state', '$stateParams', 'matterDetailsService', 'IntakePlaintiffDataService', 'matterFactory'];
    function MatterDetailsCtrl($scope, $state, $stateParams, matterDetailsService, IntakePlaintiffDataService, matterFactory) {

        var vm = this, plaintiffs, defendants, otherParties;
        //prestntation logic
        vm.activateTab = activateTab;
        vm.groupPlaintiffDefendants = groupPlaintiffDefendants;
        vm.showViewDoc = showViewDoc;
        vm.viewDocument = viewDocument;

        vm.matterId = $stateParams.matterId;

        //SAF to initialize data
        (function () {
            vm.activeTab = {};
            var prevActiveTab = localStorage.getItem("matterDetailActiveTab");
            prevActiveTab = utils.isEmptyVal(prevActiveTab) ? 'negligence' : prevActiveTab;
            vm.activeTab[prevActiveTab] = true;

            getPlaintiffs(vm.matterId);
            matterFactory.setBreadcrum(vm.matterId, 'Details');

        })();

        function activateTab(tabName, tabs) {
            tabs[tabName] = true;
            angular.forEach(tabs, function (val, key) {
                tabs[key] = key === tabName;
            });
            //persist active tab
            localStorage.setItem("matterDetailActiveTab", tabName);
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
            IntakePlaintiffDataService.getDefendants(matterId)
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
                    // vm.plaintiffDefendants.unshift({ name: "All Plaintiffs", id: "allplaintiffs", });
                    // vm.plaintiffDefendants.unshift({ name: "All Defendants", id: "alldefendant", });
                    // vm.plaintiffDefendants.unshift({ name: "All Parties", id: "all", });
                }, function () {
                });
        }

        function getOtherParties(matterId) {
            IntakePlaintiffDataService.getOtherPartiesBasic(matterId)
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
                }, function () {
                });
        }

        $scope.$on('contactCardEdited', function (e, upadatedContact) {
            var contactObj = upadatedContact;

            _.forEach(vm.plaintiffDefendants, function (contact) {
                if (utils.isEmptyVal(contact.contactid)) { return; }

                if (contact.contactid.contactid == contactObj.contactid) {
                    setUpdatedContact(contact);
                }
            });

            _.forEach(vm.plaintiffs, function (contact) {
                if (utils.isEmptyVal(contact.contactid)) { return; }

                if (contact.contactid.contactid == contactObj.contactid) {
                    setUpdatedContact(contact);
                }
            });

            function setUpdatedContact(contact) {
                var updatedCntct = angular.extend({}, contact.contactid, contactObj);
                contact.contactid = updatedCntct;

                contact.name = utils.isNotEmptyVal(contact.contactid.firstname) ? contact.contactid.firstname : "";
                contact.name += " ";
                contact.name += utils.isNotEmptyVal(contact.contactid.lastname) ? contact.contactid.lastname : "";
            }
        });


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


        function showViewDoc(selectedArray, id) {
            if (utils.isEmptyVal(selectedArray) || utils.isEmptyVal(id)) {
                return false;
            }
            return selectedArray.length <= 1 && utils.isNotEmptyVal(selectedArray[0][id]);
        }

        function viewDocument(selectedObj, id) {
            $state.go('document-view', { matterId: vm.matterId, documentId: selectedObj[id] });
        }

    }


    angular
        .module('intake.matter')
        .factory('matterDetailsHelper', matterDetailsHelper);

    function matterDetailsHelper() {

        return {
            updateEditedPlaintiffName: _updateEditedPlaintiffName
        };

        function _updateEditedPlaintiffName(details, updatedContact) {
            _.forEach(details, function (detail) {
                if (detail.contact.contact_id == updatedContact.contactid) {
                    detail.contact.first_name = updatedContact.firstname;
                    detail.contact.last_name = updatedContact.lastname;
                    detail.plaintiffName = updatedContact.firstname + ' ' + updatedContact.lastname;
                    detail.contact.edited = true;
                }
            });
            return details;
        }
    }
})();


//set breadcrum
//var initCrum = [{ name: '...' }];
//routeManager.setBreadcrum(initCrum);

//var matterInfo = matterFactory.getMatterData();

////fetch matter info if it dosen't exists
//if (utils.isEmptyObj(matterInfo) || (parseInt(matterInfo.matter_id) !== parseInt(vm.matterId))) {
//    matterDetailsService.getMatterInfo(vm.matterId).then(function (response) {
//        var matterInfo = response.data[0];
//        matterFactory.setMatterData(matterInfo);
//        var breadcrum = [{ name: matterInfo.matter_name, state: 'intake-overview', param: { matterId: vm.matterId } },
//            { name: 'Details' }];
//        routeManager.addToBreadcrum(breadcrum);
//    });
//} else {
//    var breadcrum = [{ name: matterInfo.matter_name, state: 'intake-overview', param: { matterId: vm.matterId } },
//           { name: 'Details' }];
//    routeManager.addToBreadcrum(breadcrum);
//}