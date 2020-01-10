(function () {
    'use strict';
    //TODO court details property not clear

    angular.module('intake.matter')
        .controller('IntakeMigrationCtrl', IntakeMigrationCtrl);

    IntakeMigrationCtrl.$inject = ['$modal', '$stateParams', '$modalInstance', 'masterData', 'intakeMasterData',
        'intakeListHelper', 'notification-service', 'intakeName', 'intakeTypeName', 'intakeSubTypeName', 'intakeCategoryName',
        'intakeId', 'contactFactory', 'addmigrateintakeHelper', 'showIntakeName', 'selectedIntakes', 'selectedIntakeIds', 'matterFactory', 'fromOverView', '$q', 'intakeFactory', 'isCustomFileNumber', 'practiceAndBillingDataLayer', '$rootScope', 'jurisdictionId', 'venueId'];

    function IntakeMigrationCtrl($modal, $stateParams, $modalInstance, masterDataService, intakeMasterData,
        intakeListHelper, notificationService, intakeName, intakeTypeName, intakeSubTypeName, intakeCategoryName,
        intakeId, contactFactory, addmigrateintakeHelper, showIntakeName, selectedIntakes, selectedIntakeIds, matterFactory, fromOverView, $q, intakeFactory, isCustomFileNumber, practiceAndBillingDataLayer, $rootScope, jurisdictionId, venueId) {

        var vm = this,
            initializing = true;
        vm.role = masterDataService.getUserRole();
        var masterData = masterDataService.getMasterData()
        vm.intakeId = intakeId ? intakeId : $stateParams.intakeId;
        vm.allDataFromMaster = intakeMasterData.getMasterData();
        vm.intakeMigrationInfo = {};
        vm.getSubstatus = getSubstatus;
        vm.pageMode = angular.isDefined(vm.intakeId) && utils.isNotEmptyString(vm.intakeId) ? 'edit' : 'add';
        vm.test = ['Global', 'Local'];
        vm.getMatterSubtype = getMatterSubtype;
        vm.intakeMigrationInfo.intakeId = vm.intakeId;
        vm.intakeMigrationInfo.intakeName = intakeName;
        vm.intakeMigrationInfo.fileNumber = isCustomFileNumber;
        vm.intakeMigrationInfo.intakeTypeName = intakeTypeName;
        vm.intakeMigrationInfo.intakeSubTypeName = intakeSubTypeName;
        vm.intakeMigrationInfo.intakeCategoryName = intakeCategoryName;
        vm.save = save;
        vm.setVenues = setVenues;
        vm.cancelList = cancelList;
        vm.getCourtContactList = getCourtContactList;
        vm.addNewCourtContact = addNewCourtContact;
        vm.showFields = showIntakeName;
        vm.groupCoutcontact = groupCoutcontact;
        vm.setCourtContactInfo = setCourtContactInfo;
        vm.searchMatters = searchMatters;
        vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
        vm.intake_ids = selectedIntakeIds;
        vm.fromOverViewFlag = fromOverView;
        vm.getSubscribedInfo = getSubscribedInfo;
        vm.typeOfMigration = [
            {
                id: 1,
                name: "As a new matter"
            },
            {
                id: 2,
                name: "Add to an existing matter"
            },
        ];
        vm.selectedMode = 1;
        vm.intakeList = [];
        vm.matterInfoFromSearch = {};
        vm.intakeMigrationInfo.primaryIntake = {};
        vm.intakeList = vm.fromOverViewFlag ? [angular.copy(selectedIntakes)] : angular.copy(selectedIntakes);
        vm.checkEmployer = checkEmployer;

        //US#5341 hide custom file number on subsciption Data
        function getSubscribedInfo() {
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    vm.isCustomFileNumber = data.matter_apps.file_number;
                }
            });
        }

        //hide custom file number on subsciption Data
        // var subData = masterDataService.getSubscription();
        // if(utils.isEmptyObj(subData)){
        //     var request = masterDataService.fetchSubscription()
        //     $q.all([request]).then(function (values) {
        //         vm.checkCustonFileNumber = parseInt(masterDataService.getSubscription().matter_apps.file_number);
        //     })
        // }else{
        //     vm.checkCustonFileNumber = parseInt(subData.matter_apps.file_number);

        // }

        (function () {
            vm.display = addmigrateintakeHelper.getDisplayObject(vm.pageMode);
            setDataFromMasterList();
            getUsersList();
            getSubscribedInfo();
            vm.venues = utils.isNotEmptyVal(vm.venues) ? vm.venues : [];
            vm.copyData = angular.copy(vm.intakeMigrationInfo);

        })();

        var matters = [];
        function searchMatters(matterName) {
            return matterFactory.searchMatters(matterName)
                .then(function (response) {
                    matters = response.data;
                    return response.data;
                });
        }

        vm.isEmpty = function (obj) {
            return Object.keys(obj).length == 0;
        }

        function formatTypeaheadDisplay(matterid) {
            if (angular.isUndefined(matterid) || utils.isEmptyString(matterid)) {
                return undefined;
            }
            var matterInfo = _.find(matters, function (matter) {
                return matter.matterid === matterid;
            });
            vm.matterInfoFromSearch = {};
            vm.matterInfoFromSearch = matterInfo;
            return matterInfo.name;
        }

        function setDataFromMasterList() {
            vm.jurisdictionList = vm.allDataFromMaster.jurisdiction;
            vm.categoryList = vm.allDataFromMaster.matterCategories;
            //clx-btn-group directive requires list to list <{label:'',value: ''}>
            //therefore conversion is done
            vm.statuses = intakeListHelper.getClxBtnGroupArray(vm.allDataFromMaster.statuses);
            vm.matterTypes = vm.allDataFromMaster.intake_type;
            _.forEach(vm.matterTypes, function (item) {
                item.subtype = item["intakeSubType"];
            });

            ////////////////////
            //set blank status by default
            vm.intakeMigrationInfo.matter_status_id = _.find(vm.statuses, function (status) { return status.value == 1 }); //Bydefault status should be 'New Case'		
            getSubstatus(vm.intakeMigrationInfo.matter_status_id);
            vm.intakeMigrationInfo.sub_status_id = _.find(vm.subStatusList, function (item) { return item.name === "Intake" });
            //set blank type by default
            // get type matching to MM master data
            var matchingType = _.find(vm.matterTypes, function (mtype) { return mtype.name == vm.intakeMigrationInfo.intakeTypeName.intakeTypeName });
            vm.intakeMigrationInfo.matter_type_id = matchingType;
            getMatterSubtype(vm.intakeMigrationInfo.matter_type_id.id);
            vm.intakeMigrationInfo.jurisdiction_id = _.findWhere(vm.jurisdictionList, { id: jurisdictionId });
            if (venueId && venueId != 0) {
                vm.intakeMigrationInfo.venueId = venueId.toString();
            }
            setVenues(vm.intakeMigrationInfo.jurisdiction_id);
            getCourtContactList(vm.intakeMigrationInfo.venueId, vm.intakeMigrationInfo.court_contact_id); //get court contact list
            var matchingSubType = _.find(matchingType.subtype, function (mstype) { return mstype.name == vm.intakeMigrationInfo.intakeSubTypeName.intakeSubTypeName });
            vm.intakeMigrationInfo.matter_sub_type_id = matchingSubType;
            var matchingCat = _.find(vm.categoryList, function (mctype) { return mctype.name == vm.intakeMigrationInfo.intakeCategoryName.intakeCategoryName });
            vm.intakeMigrationInfo.matter_category_id = matchingCat ? matchingCat : getBlankId(vm.categoryList);
            initializing = false;
        }

        function getUsersList() {
            contactFactory.getUsersList().then(function (response) {
                var staffList = response[4].staffonly; // staff is on 0th position
                addmigrateintakeHelper.addLexviaStaff(staffList, vm.pageMode, vm.role);
                vm.staffList = contactFactory.getUniqueContacts(staffList);
                vm.paralegal = contactFactory.getUniqueContacts(response[3].paralegal);
                vm.attorneyList = response[1] ? contactFactory.getUniqueContacts(response[1].attorny) : [];
                vm.leadAttorneyList = response[1] ? contactFactory.getUniqueContacts(response[1].attorny) : [];
                vm.partner = response[2] ? contactFactory.getUniqueContacts(response[2].partner) : [];
            }, function (reason) {

            });
        }

        function getBlankId(inputArray) {
            var substatus = _.find(inputArray, function (arr) {
                arr.name == "{Blank}" ? arr.name = " " : arr.name;
                return utils.isEmptyVal(arr.name);
            });

            return substatus ? substatus.id : null;
        }

        function setCourtContactInfo(courtDetail, courtContactList, courtContactId) {
            vm.courtDetailInfo = _.find(courtContactList, function (courtContact) {
                return courtContact.contactid == courtContactId;
            });


        }

        //if contact id is not defined clear the contact id value from the view model
        function getCourtContactList(venueId, courtContactId) {
            vm.courtContactList = [];
            vm.showCourt = utils.isNotEmptyVal(venueId) ? true : false;

            if (!initializing) {
                vm.intakeMigrationInfo.court_contact_id = null;
            }

            if (utils.isEmptyVal(courtContactId)) {
                vm.intakeMigrationInfo.court_contact_id = null;
                vm.courtDetailInfo = {};
            }

            vm.display.courtContactDetailMsg = false;
            if (utils.isEmptyVal(venueId)) {
                return;
            }
            var queryObj = {
                "type": ["Court"],
                "venue_id": utils.isNotEmptyVal(venueId) ? venueId : ''
            }
            contactFactory.getCourtContactListAddMatt(queryObj).then(function (response) {
                vm.display.courtContactDetailMsg = utils.isNotEmptyVal(vm.intakeMigrationInfo.venueId);
                vm.courtContactList = response.data.data;
                contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(vm.courtContactList);

                //set court contact details if court_contact_id is defined(edit mode)
                if (angular.isDefined(courtContactId)) {
                    setCourtContactInfo(courtContactId, vm.courtContactList, courtContactId);
                    vm.intakeMigrationInfo.court_contact_id = utils.isNotEmptyVal(vm.courtDetailInfo) ? vm.courtDetailInfo : '';
                }


            }, function (reason) {

            });
        }

        //bindable function's implementation
        function setVenues(jurisdictionId) {
            if (utils.isEmptyVal(jurisdictionId)) {
                return;
            }

            if (!initializing) {
                vm.intakeMigrationInfo.venueId = null;
                vm.intakeMigrationInfo.court_contact_id = null;
                vm.courtContactList = [];
                vm.courtDetailInfo = null;
                vm.display.courtContactDetailMsg = false;
            }
            var venueId = utils.isNotEmptyVal(jurisdictionId.id) ? jurisdictionId.id : jurisdictionId;
            var venues = _.filter(masterData.venues, function (venue) {
                return venue.jurisdiction_id == venueId;
            });
            vm.venues = _.sortBy(venues, 'name');
            vm.showCourt = false;
        }

        function groupCoutcontact(party) {
            if (utils.isNotEmptyVal(party.contactid)) {
                _.forEach(vm.test, function (contactType) {
                    if (contactType == party.contact_type) {
                        vm.groupBy = contactType;
                    }
                })
                return vm.groupBy;
            }

        }

        function getMatterSubtype(typeId, subTypeID) {
            var type = _.find(vm.allDataFromMaster.type, function (typ) {
                return typ.id === typeId;
            });
            var subTypes = angular.isDefined(type) ? (type['sub-type'] || []) : [];
            //if the selected id is not present in the array deselect the selected value
            vm.intakeMigrationInfo.matter_sub_type_id = getBlankId(subTypes);
            vm.subType = _.forEach(subTypes, function (arr) {
                arr.name = arr.name == "{Blank}" ? "" : arr.name;
                return arr;
            });
        }

        function getSubstatus(status) {
            vm.intakeMigrationInfo.sub_status_id = null;
            vm.subStatusList = [];
            //get selected statuses substatus  
            if (utils.isEmptyVal(status)) {
                vm.subStatusList = [];
                return;
            }
            var selectedStatusFromList = [];
            selectedStatusFromList.push(status);
            var statuses = angular.copy(vm.allDataFromMaster.statuses);
            var selectedStatus = [];
            _.forEach(selectedStatusFromList, function (item) {
                _.forEach(statuses, function (currentItem) {
                    if (item.value == currentItem.id) {
                        _.forEach(currentItem["sub-status"], function (currentI) {
                            currentI.statusname = currentItem.name;
                            currentI.statusid = currentItem.id
                            selectedStatus.push(currentI);
                        })
                    }
                })
            })
            vm.subStatusList = selectedStatus;
            vm.intakeMigrationInfo.sub_status_id = getBlankId(selectedStatus);
        }

        vm.setData = function (mode) {
            if (mode == 2) {
                vm.intakeList = vm.fromOverViewFlag ? [angular.copy(selectedIntakes)] : angular.copy(selectedIntakes);
                vm.intakeMigrationInfo = angular.copy(vm.copyData);
            } else {
                vm.matterId = '';
                vm.matterInfoFromSearch = {};
                vm.intakeList = vm.fromOverViewFlag ? [angular.copy(selectedIntakes)] : angular.copy(selectedIntakes);
            }
        }

        function checkEmployer() {
            var data = true;
            var deferred = $q.defer();
            intakeFactory.validateEmployer(vm.intake_ids)
                .then(function (response) {
                    if (response.length > 0) {
                        $modalInstance.dismiss();
                        var modalInstance_emp = $modal.open({
                            templateUrl: 'app/intake/matter/matter-list/showEmployer.html',
                            controller: 'ValidateEmployer as validateEmp',
                            windowClass: 'modalMidiumDialog',
                            backdrop: "static",
                            keyboard: false,
                            resolve: {
                                employeeDetails: function () {
                                    return angular.copy(response);
                                }
                            }
                        });
                        modalInstance_emp.result.then(function (response) {
                            data = false;
                            deferred.resolve(data);
                        })
                    } else {
                        deferred.resolve(false);
                    }
                })
            return deferred.promise;
        }

        function saveMigration(migrationInfs) {
            var data = vm.selectedMode == 1 ? migrationInfs : vm.copyData;
            var matchingMMType = null;
            var matchingMMSubType = null;

            if (utils.isNotEmptyVal(angular.copy(data.matter_type_id))) {
                matchingMMType = _.findWhere(masterData.type, { name: data.matter_type_id.name });
                matchingMMSubType = _.findWhere(matchingMMType["sub-type"], { name: data.matter_sub_type_id.name });
            }

            var migrationInfo = {};
            migrationInfo.intakeIds = vm.intake_ids;
            migrationInfo.primaryIntakeId = vm.fromOverViewFlag ? parseInt(vm.intake_ids) : vm.intakeMigrationInfo.primaryIntake.intakeId;
            migrationInfo.matterId = utils.isNotEmptyVal(vm.matterId) ? vm.matterId : 0;
            migrationInfo.categoryId = utils.isNotEmptyVal(angular.copy(data.matter_category_id)) ? typeof (data.matter_category_id) == "object" ? parseInt(angular.copy(data.matter_category_id.id)) : parseInt(angular.copy(data.matter_category_id)) : '';
            migrationInfo.statusId = utils.isNotEmptyVal(angular.copy(data.matter_status_id)) ? parseInt(angular.copy(data.matter_status_id.value)) : '';
            migrationInfo.subStatusId = utils.isNotEmptyVal(angular.copy(data.sub_status_id)) ? typeof (data.sub_status_id) == "object" ? parseInt(angular.copy(data.sub_status_id.id)) : parseInt(angular.copy(data.sub_status_id)) : '';
            migrationInfo.typeId = matchingMMType ? parseInt(matchingMMType.id) : '';
            migrationInfo.subTypeId = matchingMMSubType ? parseInt(matchingMMSubType.id) : '';
            if (data.jurisdiction_id && data.jurisdiction_id.id) {
                migrationInfo.jurisdictionId = utils.isNotEmptyVal(angular.copy(data.jurisdiction_id.id)) ? parseInt(angular.copy(data.jurisdiction_id.id)) : 0;
            } else {
                migrationInfo.jurisdictionId = utils.isNotEmptyVal(angular.copy(data.jurisdiction_id)) ? parseInt(angular.copy(data.jurisdiction_id)) : 0;
            }
            migrationInfo.courtContactId = utils.isNotEmptyVal(angular.copy(data.court_contact_id)) ? parseInt(angular.copy(data.court_contact_id.contactid)) : 0;
            migrationInfo.venueId = utils.isNotEmptyVal(angular.copy(data.venueId)) ? parseInt(angular.copy(data.venueId)) : 0;
            migrationInfo.courtContactType = utils.isNotEmptyVal(data.court_contact_id) ? angular.copy(data.court_contact_id.contact_type) : '';
            migrationInfo.intakeName = vm.selectedMode == 1 ? data.matterName.trim() : vm.matterInfoFromSearch.name;
            migrationInfo.fileNumber = vm.selectedMode == 1 ? data.fileNumber : '';
            migrationInfo.managingPartnerId = angular.isDefined(data.managing_att_id) ? data.managing_att_id.toString() : '';
            migrationInfo.paralegalId = angular.isDefined(data.paralegal) ? data.paralegal.toString() : '';

            // LeadAttorney and Attorney validation

            var uniqueAttorney = (utils.isNotEmptyVal(data.atterney_id)) ? (utils.isNotEmptyVal(data.leadattorny)) ? data.atterney_id.filter(function (val) {
                return data.leadattorny.indexOf(val) != -1;
            }) : "" : "";


            // if (uniqueAttorney.length > 0) {
            //     notificationService.error("Lead Attorney and Attorney can not be same");
            //     return;
            // }
            migrationInfo.leadAttorneyId = angular.isDefined(data.leadattorny) ? data.leadattorny.toString() : '';
            migrationInfo.attorneyId = angular.isDefined(data.atterney_id) ? data.atterney_id.toString() : '';
            migrationInfo.staffId = angular.isDefined(data.user_staff_id) ? data.user_staff_id.toString() : '';

            //$modalInstance.close(migrationInfo);

            intakeFactory.migrateIntake(migrationInfo)
                .then(function (data) {
                    notificationService.success('Migration successful! Please continue to Matter Manager to view.');
                    //overviewinit();
                    $rootScope.$emit('getNotificationCountData', '');
                    var dataRes = {
                        sucess: true
                    }
                    vm.intakeMigrationInfo = {};
                    $modalInstance.close(dataRes);
                }, function (reason) {
                    if (reason.data && reason.data.errorCode == 117) {
                        notificationService.error(reason.data.message);
                        return;
                    }
                    else {
                        notificationService.error('Unable to migrate intake');
                        var dataRes = {
                            sucess: false
                        }
                        vm.intakeMigrationInfo = {};
                        $modalInstance.close(dataRes);
                    }

                });
        }

        function save(migrationInfo) {
            var data = vm.selectedMode == 1 ? migrationInfo : vm.copyData;
            if (vm.selectedMode == 1) {
                if (utils.isEmptyVal(data.matterName)) {
                    notificationService.error("Please enter matter name");
                    return;
                }
                if (utils.isEmptyVal(data.jurisdiction_id)) {
                    notificationService.error("Please select jurisdiction");
                    return;
                }
            } else {
                if (utils.isEmptyVal(vm.matterId)) {
                    notificationService.error("Please select matter name");
                    return;
                }
                if (isNaN(vm.matterId)) {
                    notificationService.error("Invalid matter name");
                    return;
                }
            }

            if (!vm.fromOverViewFlag) {
                checkEmployer().then(function (response) {
                    saveMigration(migrationInfo);
                });
            } else {
                saveMigration(migrationInfo);
            }

        }

        function cancelList() {
            vm.intakeMigrationInfo = {};
            $modalInstance.dismiss(vm.intakeMigrationInfo);
        }

        function addNewCourtContact(model, venue, type) {
            var selectedType = {};
            selectedType.venue = venue;
            selectedType.type = type;
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                response['firstname'] = response.first_name;
                response['lastname'] = response.last_name;
                response['contactid'] = (response.contact_id).toString();
                vm.intakeMigrationInfo[model] = response;
                var venueId = JSON.parse(vm.intakeMigrationInfo[model].court_venue);
                getCourtContactList(venueId, vm.intakeMigrationInfo[model].contactid);
                console.log("saved ");
            }, function () {
                console.log("closed");
            });
        }

    }
})(angular);

(function (angular) {
    angular
        .module('intake.matter')
        .factory('addmigrateintakeHelper', addmigrateintakeHelper);

    function addmigrateintakeHelper() {
        return {

            getDisplayObject: getDisplayObject,
            addLexviaStaff: addLexviaStaff
        }

        function getDisplayObject(pageMode) {
            var display = {};
            if (pageMode === 'edit') {
                display.importantDates = false;
                display.userAssignment = false;
            } else {
                display.importantDates = true;
                display.userAssignment = true;
            }
            display.courtContactDetailMsg = true;
            return display;
        }

        function addLexviaStaff(staffList, pagemode, role) {
            var isSubscribed = role.lexvia_services;
            if (isSubscribed == 1 && pagemode === 'edit') {
                // var lexviaStaff = { uid: '0', name: 'Lexvia' };
                // staffList.push(lexviaStaff);
            }
        }

    }

})(angular);

(function () {
    'use strict';

    angular.module('intake.matter')
        .controller('ValidateEmployer', ValidateEmployer);

    ValidateEmployer.$inject = ['$modalInstance', 'employeeDetails'];

    function ValidateEmployer($modalInstance, employeeDetails) {
        var vm = this;
        vm.details = angular.copy(employeeDetails);
        vm.dismiss = dismiss;

        function dismiss() {
            $modalInstance.close();
        }
        // (function () {

        // })


    }

})(angular);

