(function () {

    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('MatterDetailsCtrl', MatterDetailsCtrl);

    MatterDetailsCtrl.$inject = ['$scope', '$state', '$stateParams', 'matterDetailsService', 'allPartiesDataService', 'matterFactory', 'practiceAndBillingDataLayer', '$rootScope', 'contactFactory', 'mailboxDataService', 'masterData'];
    function MatterDetailsCtrl($scope, $state, $stateParams, matterDetailsService, allPartiesDataService, matterFactory, practiceAndBillingDataLayer, $rootScope, contactFactory, mailboxDataService, masterData) {

        var vm = this, plaintiffs, defendants, otherParties;
        //prestntation logic
        vm.activateTab = activateTab;
        vm.groupPlaintiffDefendants = groupPlaintiffDefendants;
        vm.showViewDoc = showViewDoc;
        vm.viewDocument = viewDocument;
        vm.firmData = { API: "PHP", state: "mailbox" };
        vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));
        vm.isIntakeActive = localStorage.getItem('isIntakeActive');
        vm.matterId = $stateParams.matterId;

        //SAF to initialize data
        (function () {

            getPlaintiffs(vm.matterId);
            //matterFactory.setBreadcrum(vm.matterId, 'Details');
            matterFactory.setBreadcrumWithPromise(vm.matterId, 'Details').then(function (resultData) {
                vm.matterInfo = resultData;
                localStorage.setItem("matterName", vm.matterInfo.matter_name);
                vm.activeTab = {};
                displayWorkflowIcon();
                var prevActiveTab = ""; //sessionStorage.getItem("matterDetailActiveTab");
                var retainSText = JSON.parse(sessionStorage.getItem("matterDetailActiveTab"));
                if (utils.isNotEmptyVal(retainSText)) {
                    if (vm.matterId == retainSText.matterid) {
                        prevActiveTab = retainSText.tabName;
                    }
                }
                var defaultTab = utils.isEmptyVal(vm.matterInfo.intake_id) ? 'negligence' : 'intakeInfo';
                var redirectToExpenseDeatils = utils.isNotEmptyVal(localStorage.getItem("redirectToExpenseDetails")) ? localStorage.getItem('redirectToExpenseDetails') : false;
                if (redirectToExpenseDeatils) {
                    var defaultTab = 'expenses';
                }
                vm.showIntakeDetails = utils.isEmptyVal(vm.matterInfo.intake_id) ? false : true;
                prevActiveTab = utils.isEmptyVal(prevActiveTab) ? defaultTab : prevActiveTab;
                vm.activeTab[prevActiveTab] = true;
                var matterPermissions = masterData.getPermissions();
                vm.mattersettlement = _.filter(matterPermissions[0].permissions, function (per) {
                    if (per.entity_id == '9') {
                        return per;
                    }
                });
            });
            getUserEmailSignature();

        })();

        function displayWorkflowIcon() {
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                var resData = data.matter_apps;                                   //promise
                if (angular.isDefined(resData) && resData != '' && resData != ' ') {
                    vm.is_workflow = (resData.workflow == 1) ? true : false;
                }
            });
        }

        vm.getContactCard = function (contact) {
            if (!utils.isEmptyVal(contact)) {
                contactFactory.displayContactCard1(contact.contactid, contact.edited, contact.contact_type);
            }
        }

        $rootScope.$on('updateWorkflowIcons', function (updateworkflowIconevent) {
            displayWorkflowIcon();
        });

        //get email signature
        function getUserEmailSignature() {
            mailboxDataService.emailSignature()
                .then(function (data) {
                    if (utils.isNotEmptyVal(data.data)) {
                        vm.signature = data.data[0];
                        vm.signature = '<br/><br/>' + vm.signature;
                    }
                });
        }

        $scope.$on('composeEmailFromContact', function (event, data) {
            if (!(window.isDrawerOpen)) {
                vm.compose = true;
                var html = "";
                html += (vm.signature == undefined) ? '' : vm.signature;
                vm.composeEmail = html;
                $rootScope.updateComposeMailMsgBody(vm.composeEmail, '', '', '', 'contactEmail', data);
            }
        });

        // Get event call from mailbox controller for close compose popup
        $rootScope.$on("callCloseComposeMail", function () {
            closeComposeMail(); // close compose mail popup
        });

        // close compose mail popup
        function closeComposeMail() {

            vm.compose = false;
        }

        function activateTab(tabName, tabs) {
            tabs[tabName] = true;
            angular.forEach(tabs, function (val, key) {
                tabs[key] = key === tabName;
            });
            //persist active tab
            $rootScope.retainSearchText = {};
            $rootScope.retainSearchText.tabName = tabName;
            $rootScope.retainSearchText.matterid = vm.matterId;
            sessionStorage.setItem("matterDetailActiveTab", JSON.stringify($rootScope.retainSearchText));
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
                    // vm.plaintiffDefendants.unshift({ name: "All Plaintiffs", id: "allplaintiffs", });
                    // vm.plaintiffDefendants.unshift({ name: "All Defendants", id: "alldefendant", });
                    // vm.plaintiffDefendants.unshift({ name: "All Parties", id: "all", });
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
            return selectedArray.length <= 1 && utils.isNotEmptyVal(selectedArray[0][id]) && (selectedArray[0][id] > 0);
        }

        function viewDocument(selectedObj, id) {
            $state.go('document-view', { matterId: vm.matterId, documentId: selectedObj[id] });
        }

    }


    angular
        .module('cloudlex.matter')
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