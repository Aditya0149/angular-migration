(function () {
    'use strict';

    angular.module('cloudlex.allParties')
        .controller('AddDefendantCtrl', AddDefendantCtrl);

    AddDefendantCtrl.$inject = ["globalConstants", "matterFactory", "addDefendantFactory", "allPartiesDataService", "contactFactory", "$stateParams", "$state", "notification-service"];

    function AddDefendantCtrl(globalConstants, matterFactory, addDefendantFactory, allPartiesDataService, contactFactory, $stateParams, $state, notificationService) {

        var matterId = $stateParams.matterId;

        //console.log(matterId);
        var vm = this;

        vm.getContacts = getContacts;
        vm.formatTypeaheadDisplay = contactFactory.formatTypeaheadDisplay;
        vm.openCalender = openCalender;
        vm.next = goToNextPage;
        vm.addNewContact = addNewContact;
        vm.save = saveDefendant;
        vm.cancel = cancelSave;
        vm.isEditMode = false;
        vm.Currentdate = new Date();
        vm.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;
        vm.goToPage = goToPage;

        vm.getSearchContactConnectorClass = getSearchContactConnectorClass;
        vm.getSearchContactStepClass = getSearchContactStepClass;
        vm.getGenInfoStepClass = getGenInfoStepClass;
        vm.disableNext = disableNext;
        vm.isDatesValid = isDatesValid;
        vm.JavaFilterAPIForContactList = true;
        (function () {
            vm.dateFormat = "MM/DD/YYYY";
            vm.selectionLists = {};
            vm.defendantInfo = {};
            vm.currentPage = {
                "searchOrAdd": true,
                "generalInfo": false
            };
            vm.completedPages = [];

            initSelectionLists();

            vm.defendantInfo.defendantRole = 'prime';
            vm.defendantInfo.gender = 'Not Specified';

            if ($state.current) {
                if ($state.current.name === "editDefendant") {
                    initiateEditMode();
                }
            }

        })();

        function isDatesValid() {
            if ($('.error').css("display") == "block") {
                return true;
            }
            else {
                return false;
            }
        }

        function initiateEditMode() {
            vm.isEditMode = true;
            vm.currentPage["searchOrAdd"] = false;
            vm.currentPage["generalInfo"] = true;

            vm.completedPages.push("searchOrAdd");

            //Populdate defendant info
            var selectedDefendant = {};
            var plaintiffData = sessionStorage.getItem("selectedDefendant");
            if (plaintiffData) {
                plaintiffData = JSON.parse(plaintiffData);
                if (plaintiffData.matterId == matterId) {
                    selectedDefendant = plaintiffData.defendant;
                }
            } else {
                selectedDefendant = $stateParams.selectedDefendant;
            }

            switch (selectedDefendant.type) {

                case 'Primary Defendant':
                    vm.defendantInfo.defendantRole = 'prime';
                    break;

                case 'Secondary Defendant':
                    vm.defendantInfo.defendantRole = 'secondary';
                    break;

                case '3rd Party Defendant':
                    vm.defendantInfo.defendantRole = 'tertiary';
                    break;

                case 'Discontinued Defendant':
                    vm.defendantInfo.defendantRole = 'quaternary';
                    break;
            }

            // vm.defendantInfo.isprimary = (selectedDefendant.type == "Primary Defendant") ? true : false;
            vm.defendantInfo.gender = (selectedDefendant.gender) ? selectedDefendant.gender : "Not Specified";
            vm.defendantInfo.ssn = selectedDefendant.ssn;
            vm.defendantInfo.dateofbirth = utils.isEmptyVal(selectedDefendant.dateofbirth) ? "" : selectedDefendant.dateofbirth; //moment.unix(selectedDefendant.dateofbirth).utc().format('MM/DD/YYYY');
            vm.defendantInfo.defendantid = selectedDefendant.defendantid;
            vm.defendantInfo.matterid = selectedDefendant.matterid;
            vm.defendantInfo.contactid = angular.isUndefined(selectedDefendant.contactid) ? null : selectedDefendant.contactid.contactid;

            //console.log(selectedDefendant);
            //console.log(vm.defendantInfo);
        };

        //models for clx-btn-group directive
        //value prop will be model value and label prop will be the view value
        //for more details check out the clx-btn-group directive in utils->filterUtils.js 
        function initSelectionLists() {
            vm.selectionLists.defendantRole = [
                { label: "Primary Defendant", value: "prime" },
                { label: "Secondary Defendant", value: "secondary" },
                { label: "3rd Party Defendant ", value: "tertiary" },
                { label: "Discontinued Defendant", value: "quaternary" }
            ];

            vm.selectionLists.gender = [
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" },
                { label: "Not Specified", value: "Not Specified" }
            ];

        }

        function getContacts(contactName) {
            var postObj = {};
            postObj.type = globalConstants.defendentTypeList;
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
        function checkIfEnterKeyWasPressed(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
            return true;

        };

        function openCalender($event, model) {
            $event.preventDefault();
            $event.stopPropagation();
            vm[model] = true;
        }

        function goToNextPage() {
            //US#6288
            if (utils.isEmptyVal(vm.defendantInfo.contact.contactid)) {
                notificationService.error("Invalid Contact Selected");
                return;
            }
            angular.forEach(vm.currentPage, function (val, key) {
                if (val) {
                    if (vm.completedPages.indexOf(key) < 0) {
                        vm.completedPages.push(key);
                    }
                }
            });

            //console.log(vm.completedPages);

            vm.currentPage = addDefendantFactory.nextPage(angular.copy(vm.currentPage));
        }

        function goToPage(pageNm) {
            if (vm.completedPages.indexOf("searchOrAdd") >= 0) {

                angular.forEach(vm.currentPage, function (val, key) {
                    vm.currentPage[key] = false;
                });

                vm.currentPage[pageNm] = true;
            }
        };

        function addNewContact(type) {
            var selectedType = {};
            selectedType.type = type;
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                //console.log("saved ");
                if (response) {
                    vm.defendantInfo.contact = response;
                    vm.defendantInfo.contact['firstname'] = vm.defendantInfo.contact.first_name;
                    vm.defendantInfo.contact['lastname'] = vm.defendantInfo.contact.last_name;
                    vm.defendantInfo.contact['contactid'] = (vm.defendantInfo.contact.contact_id).toString();
                }
            }, function () {
                console.log("closed");
            });
        }


        // save defendant
        function saveDefendant() {
            if (vm.isEditMode) {
                updateDefendant();
            } else {
                addDefendant();
            }
        };

        function addDefendant() {
            var defendantinfo = {};
            // pluck the information from different object and push to the plaintiff info object
            defendantinfo.contactid = utils.isEmptyVal(vm.defendantInfo.contact) ? null : vm.defendantInfo.contact.contactid;

            // Check if the gender is set
            defendantinfo.gender = vm.defendantInfo.gender ? vm.defendantInfo.gender : "Not Specified";

            // Check if the role is set

            switch (vm.defendantInfo.defendantRole) {

                case 'prime':
                    defendantinfo.type = 'Primary Defendant';
                    break;

                case 'secondary':
                    defendantinfo.type = 'Secondary Defendant';
                    break;

                case 'tertiary':
                    defendantinfo.type = '3rd Party Defendant';
                    break;

                case 'quaternary':
                    defendantinfo.type = 'Discontinued Defendant';
                    break;
            }


            //set ssn
            defendantinfo.ssn = vm.defendantInfo.ssn;

            // set matter id 
            defendantinfo.matterid = matterId;
            // set deleted = 0 
            defendantinfo.deleted = 0;

            defendantinfo.dateofbirth = utils.isEmptyVal(vm.defendantInfo.dateofbirth) ? null : utils.getUTCTimeStamp(vm.defendantInfo.dateofbirth);//moment(vm.defendantInfo.dateofbirth).format("MM/DD/YYYY"); //moment(vm.defendantInfo.dateofbirth).format("MM/DD/YYYY");
            defendantinfo.utcdateofbirth = utils.isEmptyVal(vm.defendantInfo.dateofbirth) ? null : utils.getUTCTimeStamp(vm.defendantInfo.dateofbirth);//moment(vm.defendantInfo.dateofbirth).format("MM/DD/YYYY"); //moment(vm.defendantInfo.dateofbirth).format('MM/DD/YYYY')
            //console.log(defendantinfo);

            // call the data serivce function to make post call 
            allPartiesDataService.addDefendant(defendantinfo).then(function (response) {
                //                allPartiesDataService
                //                .getAllParties(matterId).then(function () {
                //                });
                notificationService.success('Defendant added successfully!');
                $state.go("allParties", { 'matterId': matterId, 'openView': 'DEFENDANT_VIEW' });
            }, function (reason) {
                notificationService.error('An error occurred. Please try later.');
            });
        };

        function updateDefendant() {
            var defendantinfo = {};
            // pluck the information from different object and push to the plaintiff info object
            defendantinfo.contactid = vm.defendantInfo.contactid;

            // Check if the gender is set
            defendantinfo.gender = vm.defendantInfo.gender ? vm.defendantInfo.gender : "Not Specified";

            // Check if the role is set

            switch (vm.defendantInfo.defendantRole) {
                case 'prime':
                    defendantinfo.type = 'Primary Defendant';
                    break;

                case 'secondary':
                    defendantinfo.type = 'Secondary Defendant';
                    break;

                case 'tertiary':
                    defendantinfo.type = '3rd Party Defendant';
                    break;

                case 'quaternary':
                    defendantinfo.type = 'Discontinued Defendant';
                    break;
            }


            //set date of birth
            //defendantinfo.dateofbirth = vm.defendantInfo.dateofbirth;

            //set ssn
            defendantinfo.ssn = vm.defendantInfo.ssn;

            //set defendant id
            defendantinfo.defendantid = vm.defendantInfo.defendantid;

            // set matter id 
            defendantinfo.matterid = vm.defendantInfo.matterid;

            // set deleted = 0 
            defendantinfo.deleted = 0;

            // set DOB
            defendantinfo.dateofbirth = utils.isEmptyVal(vm.defendantInfo.dateofbirth) ? null : utils.getUTCTimeStamp(vm.defendantInfo.dateofbirth); //moment(vm.defendantInfo.dateofbirth).format("MM/DD/YYYY"); //moment(vm.defendantInfo.dateofbirth).format("MM/DD/YYYY");
            defendantinfo.utcdateofbirth = utils.isEmptyVal(vm.defendantInfo.dateofbirth) ? null : utils.getUTCTimeStamp(vm.defendantInfo.dateofbirth); //moment(vm.defendantInfo.dateofbirth).format("MM/DD/YYYY"); //moment(vm.defendantInfo.dateofbirth).format('MM/DD/YYYY')

            //console.log(defendantinfo);

            // call the data serivce function to make post call 
            allPartiesDataService.editDefendant(defendantinfo).then(function (response) {
                //                allPartiesDataService
                //                .getAllParties(matterId).then(function () {
                //                });
                sessionStorage.removeItem("selectedDefendant");
                notificationService.success('Defendant updated successfully!');
                $state.go("allParties", { 'matterId': matterId, 'openView': 'DEFENDANT_VIEW' });
            }, function (reason) {
                notificationService.error('An error occurred. Please try later.');
            });
        };

        function cancelSave() {
            sessionStorage.removeItem("selectedDefendant");
            $state.go("allParties", { 'matterId': matterId, 'openView': 'DEFENDANT_VIEW' });
        };

        /** Styling functions **/
        function getSearchContactStepClass() {
            if (vm.currentPage.searchOrAdd) {
                if (vm.completedPages.indexOf("searchOrAdd") >= 0)
                    return "sprite default-wizard-completed";
                return "sprite default-wizard-ongoing";
            } else {
                return "sprite default-wizard-completed";
            }
        };

        function getSearchContactConnectorClass() {
            if (vm.currentPage.searchOrAdd) {
                if (vm.completedPages.indexOf("searchOrAdd") >= 0)
                    return "col-md-4 connector filled-connector";
                return "col-md-4 connector gray-connector";
            } else {
                return "col-md-4 connector filled-connector";
            }
        };

        function getGenInfoStepClass() {
            if (vm.currentPage.searchOrAdd) {
                return "sprite default-wizard-tostart";
            } else if (vm.currentPage.generalInfo) {
                return "sprite default-wizard-ongoing";
            }
            return "sprite default-wizard-ongoing";
        };

        function disableNext() {
            if (utils.isEmptyVal(vm.defendantInfo.contact)) {
                return true;
            }
        };
    }


})();

(function () {

    'use strict';

    angular.module('cloudlex.allParties')
        .factory('addDefendantFactory', addDefendantFactory);

    function addDefendantFactory() {

        var pagesInfo = {
            "searchOrAdd": { next: "generalInfo", prev: "" },
            "generalInfo": { next: "", prev: "searchOrAdd" }
        };

        return {
            nextPage: nextPage
        }

        function nextPage(currentPage) {
            var activePage;
            angular.forEach(currentPage, function (val, key) {
                if (val) {
                    activePage = key;
                }
                currentPage[key] = false;
            });
            currentPage[pagesInfo[activePage].next] = true;
            return currentPage;
        }
    }


})();
