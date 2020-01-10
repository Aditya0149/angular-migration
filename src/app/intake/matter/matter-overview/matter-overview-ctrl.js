(function () {
    'use strict';
    //TODO court details property not clear

    angular.module('intake.matter')
        .controller('IntakeOverviewCtrl', IntakeOverviewCtrl);

    IntakeOverviewCtrl.$inject = ['$scope', '$rootScope', '$stateParams', '$modal', 'intakeFactory',
        'notification-service', "$state", 'modalService', 'intakeEventsHelper', 'masterData', 'routeManager', 'intakeListHelper', '$q', 'notification-service', 'practiceAndBillingDataLayer', 'contactFactory'
    ];

    function IntakeOverviewCtrl($scope, $rootScope, $stateParams, $modal, intakeFactory,
        notification, $state, modalService, intakeEventsHelper, masterData, routeManager, intakeListHelper, $q, notificationService, practiceAndBillingDataLayer, contactFactory) {
        var vm = this;
        vm.intakeId = $stateParams.intakeId;
        var matterId = $stateParams.intakeId,
            info = intakeFactory.getMatterData();
        vm.matterOverviewData = {};
        vm.motionServedByUs = {};
        vm.motionServedOnUs = {};
        vm.valuationInfo = {};
        vm.deleteMatter = deleteMatter;
        vm.getNoteClass = getNoteClass
        vm.getNoteIcon = getNoteIcon;
        vm.valuation = valuation;
        vm.goToEvent = goToEvent;
        vm.isPlaintiff = false;
        vm.isIncident = false;
        vm.viewAllOverdueTasks = viewAllOverdueTasks;
        vm.redirectToDocument = redirectToDocument;
        vm.getContactCard = getContactCard;
        vm.getContactCardforProvider = getContactCardforProvider; //US#7001 added seaperatly because of future purposefor court contact types  
        vm.printMatterOverview = printMatterOverview;
        vm.checkRefferaldata = checkRefferaldata;
        vm.openEditmatterview = openEditmatterview;
        vm.showArchivePopup = showArchivePopup;
        vm.setSelectedTab = setSelectedTab;
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.matterOverviewmatterOverviewIntakeInfo = {};
        vm.getUsersInFirm = getUsersInFirm;
        vm.getMasterList = getMasterList;
        vm.openMigrationPopUp = openMigrationPopUp;
        vm.typeList = [{ id: '1', name: 'Facebook' }, { id: '2', name: 'Linked In' }, { id: '3', name: 'Twitter' }, { id: '4', name: 'Instagram' }, { id: '5', name: 'Google Plus' }];
        (function () {
            displayWorkflowIcon();
            getUsersInFirm();
            overviewinit();
            vm.isPlaintiff = true;
            getMasterList();

        })();

        function getPlaintiffForSMSIntake(intakeId) {
            vm.contactList1 = [];
            if (angular.isUndefined(intakeId)) {
                return;
            }
            intakeFactory.getPlaintiffByIntake(intakeId)
                .then(function (response) {
                    if (utils.isNotEmptyString(response)) {
                        var data = response[0].contact;
                        intakeFactory.getOtherDetails(intakeId)
                            .then(function (res) {
                                var otherDetailsInfo = utils.isNotEmptyVal(res) ? JSON.parse(res[0].detailsJson) : null;
                                var list = intakeEventsHelper.setContactList(data, vm.matterOverviewData.intakeSubType, otherDetailsInfo, response)
                                vm.contactList1 = _.unique(list, 'contactid');
                                intakeFactory.setAssociateContactDetails(vm.contactList1);
                            });
                    }
                });
        }

        function displayWorkflowIcon() {
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                var resData = data.matter_apps; //promise
                if (angular.isDefined(resData) && resData != '' && resData != ' ') {
                    vm.is_workflow = (resData.workflow == 1) ? true : false;
                }
            });
        }

        $rootScope.$on('updateWorkflowIcons', function (updateworkflowIconevent) {
            displayWorkflowIcon();
        });

        /*initialize matter overview*/
        function overviewinit() {
            vm.firmData = { API: "PHP", state: "mailbox" };

            getMatterOverview();
            getPlaintiffdetails();
            vm.overviewOptions = [
                { key: 'Staff', value: 'Staff' },
                { key: 'Events', value: 'Events' },
                { key: 'Tasks', value: 'Tasks' },
                { key: 'Notes', value: 'Notes' },
                { key: 'Photos', value: 'Photos' },
                { key: 'Details', value: 'Key Contacts' }
            ];
            vm.activeTab = 'Staff';
            vm.overdueLimit = 2;
            vm.todaysTaskLimit = 2;

        }

        function openMigrationPopUp() {
            var modalInstance = $modal.open({
                templateUrl: 'app/intake/matter/matter-list/migration.html',
                controller: 'IntakeMigrationCtrl as intakeMigCtrl',
                windowClass: 'modalXLargeDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    intakeName: function () {
                        return vm.matterOverviewData.intakeName;
                    },
                    isCustomFileNumber: function () {
                        return vm.matterOverviewData.fileNumber;
                    },
                    intakeTypeName: function () {
                        return vm.matterOverviewData.intakeType;
                    },
                    intakeSubTypeName: function () {
                        return vm.matterOverviewData.intakeSubType;
                    },
                    intakeCategoryName: function () {
                        return vm.matterOverviewData.intakeCategory;
                    },
                    intakeId: function () {
                        return null;
                    },
                    showIntakeName: function () {
                        return true;
                    },
                    selectedIntakes: function () {
                        return vm.matterOverviewData;
                    },
                    selectedIntakeIds: function () {
                        return angular.copy(vm.matterOverviewData.intakeId).toString();
                    },
                    fromOverView: function () {
                        return true;
                    },
                    jurisdictionId: function () {
                        return vm.matterOverviewData.jurisdictionId;
                    },
                    venueId: function () {
                        return vm.matterOverviewData.venueId;
                    }

                },
            });

            modalInstance.result.then(function (resp) {
                if (resp.sucess) {
                    $state.go("intake-list", {});
                } else {
                    overviewinit();
                }
            }, function (error) { });
        }

        //US#8330
        $rootScope.$on("callCloseComposeMail", function () {
            closeComposeMail();
        });

        //US#8330
        function closeComposeMail() {
            vm.compose = false;
        }


        function getUsersInFirm() {
            var defer = $q.defer();
            contactFactory.getUsersInFirm()
                .then(function (response) {
                    var userListing = response.data;
                    contactFactory.intakeStaffUserToMatterStaffUser(userListing);
                    _.forEach(userListing, function (userRec) {
                        userRec.id = userRec.uid;
                    })
                    vm.users = userListing;
                    defer.resolve();
                }, function (error) {
                    vm.users = [];
                    defer.resolve();
                });
            return defer.promise;

        }

        function getMasterList() {
            var defer = $q.defer();
            intakeFactory.getMasterDataList()
                .then(function (data) {
                    var subStatus = [];
                    var subType = [];
                    _.forEach(data.status, function (statusRecord) {
                        _.forEach(statusRecord.substatus, function (substatusRecord) {
                            subStatus.push(substatusRecord);
                        });
                    });
                    _.forEach(data.type, function (statusRecord) {
                        _.forEach(statusRecord.subtype, function (subtypeRecord) {
                            subType.push(subtypeRecord);
                        });
                    });
                    data.subStatus = subStatus;
                    data.subType = subType;
                    vm.masterList = data;
                    defer.resolve();
                }, function (reason) {
                    defer.resolve();
                });
            return defer.promise;
        }

        /*pop up view for edit matter */
        function openEditmatterview(matterObj) {
            var intakeID = { 'intakeId': vm.intakeId }
            vm.matterOverviewIntakeInfo = vm.matterOverviewData;
            vm.matterOverviewIntakeInfo.statusname = vm.matterOverviewIntakeInfo.intakeStatus ? _.find(vm.masterList.status, function (status) { return status.id === vm.matterOverviewIntakeInfo.intakeStatus.intakeStatusId }) : null;
            if (vm.matterOverviewIntakeInfo.statusname) {
                vm.substatus = vm.matterOverviewIntakeInfo.statusname.substatus;
                vm.matterOverviewIntakeInfo.substatus = vm.matterOverviewIntakeInfo.intakeSubStatus ? _.findWhere(vm.matterOverviewIntakeInfo.statusname.substatus, { id: vm.matterOverviewIntakeInfo.intakeSubStatus.intakeSubStatusId }) : null;
            }
            _.forEach(vm.matterOverviewIntakeInfo.assignedUser, function (item) {
                item.userId = item.userId.toString();
            });
            //if (utils.isNotEmptyVal(vm.matterOverviewIntakeInfo.leadSource)) {
            //   var leadData = _.findWhere(vm.typeList, { name: vm.matterOverviewIntakeInfo.leadSource });
            //   vm.matterOverviewIntakeInfo.leadSource = leadData;
            //}

            vm.matterOverviewIntakeInfo.user_id = vm.matterOverviewIntakeInfo.assignedUser;
            vm.matterOverviewIntakeInfo.placeOfIncident = vm.matterOverviewIntakeInfo.accidentLocation;
            vm.matterOverviewIntakeInfo.dateOfIncident = vm.matterOverviewIntakeInfo.accidentDate ? moment.unix(vm.matterOverviewIntakeInfo.accidentDate).utc().format("MM/DD/YYYY") : null;
            vm.matterOverviewIntakeInfo.description = vm.matterOverviewIntakeInfo.description;
            vm.matterOverviewIntakeInfo.incidentservices = utils.isNotEmptyVal(vm.matterOverviewIntakeInfo.otherInfo) ? JSON.parse(vm.matterOverviewIntakeInfo.otherInfo) : vm.matterOverviewIntakeInfo.otherInfo;
            var category = _.findWhere(vm.masterList.category, { name: vm.matterOverviewIntakeInfo.intakeCategory.intakeCategoryName });
            var type = _.findWhere(vm.masterList.type, { name: vm.matterOverviewIntakeInfo.intakeType.intakeTypeName });
            var subType = type ? _.findWhere(type.subtype, { name: vm.matterOverviewIntakeInfo.intakeSubType.intakeSubTypeName }) : null;
            vm.matterOverviewIntakeInfo.category = category;
            vm.matterOverviewIntakeInfo.type = type;
            vm.matterOverviewIntakeInfo.subtype = subType;
            //vm.matterOverviewIntakeInfo.leadSource = vm.matterOverviewIntakeInfo.leadSource;
            var modalInstance = $modal.open({
                templateUrl: 'app/intake/matter/add-matter/add-matter.html',
                controller: 'AddIntakeCtrl as addCtrl',
                windowClass: 'modalXLargeDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    modalParams: function () {
                        return intakeID;
                    },
                    masterDataList: function () {
                        return vm.masterList;
                    },
                    intakeInfo: function () {
                        return vm.matterOverviewIntakeInfo;
                    },
                    sub_status: function () {
                        return vm.substatus;
                    },
                    users: function () {
                        return vm.users;
                    },
                    fromOverViewTab: function () {
                        return true;
                    }
                },
            });

            modalInstance.result.then(function (resp) {
                if (resp == "cancel") {
                    overviewinit();
                } else {
                    var name = resp.intakeName;
                    var intake_info = angular.copy(resp);
                    var setDataForAPICall = intakeListHelper.setData(intake_info, name);
                    intakeFactory.editIntakeInfo(setDataForAPICall)
                        .then(function (response) {
                            notificationService.success('Intake updated successfully.');
                            if (resp.markTaskandEventForIntake) {
                                intakeFactory.saveStatusForIntake(vm.intakeId);
                            }
                            overviewinit();
                        });
                }
            }, function (error) {

            });
            overviewinit();
        }

        function getMatterOverview(contactEdited) {
            var dataObj = {
                "page_number": 1,
                "page_size": 250,
                "intake_id": matterId,
                "is_migrated": 2
            };
            var promise = intakeFactory.getMatterList(dataObj);
            promise
                .then(function (response) {
                    vm.matterOverviewData = response.intakeData[0];
                    vm.matterOverviewData.migrationDate = (utils.isEmptyVal(vm.matterOverviewData.migrationDate) || vm.matterOverviewData == 0) ? "-" : moment.unix(vm.matterOverviewData.migrationDate).utc().format('MM/DD/YYYY');
                    vm.matterOverviewData.intakeAmount = (vm.matterOverviewData.intakeAmount == null) ? ' ' : (vm.matterOverviewData.intakeAmount).toString();
                    var otherInfo = utils.isNotEmptyVal(response.intakeData) && response.intakeData.length > 0 && response.intakeData[0].otherInfo ? JSON.parse(response.intakeData[0].otherInfo) : response.intakeData[0].otherInfo;
                    vm.matterOverviewData.otherInfo_intake = utils.isNotEmptyVal(otherInfo) ? otherInfo.join(", ") : otherInfo;
                    vm.matterOverviewData.dateOfIntake = ((vm.matterOverviewData.dateOfIntake == 0 || vm.matterOverviewData.dateOfIntake == null) ? '-' : moment.unix(vm.matterOverviewData.dateOfIntake).utc().format('MM/DD/YYYY'));
                    vm.matterOverviewData.referredTo = (vm.matterOverviewData.referredTo == null) ? '-' : response.intakeData[0].referredTo.firstName + " " + response.intakeData[0].referredTo.lastName;
                    vm.matterOverviewData.referredBy = (vm.matterOverviewData.referredBy == null) ? '-' : response.intakeData[0].referredBy.firstName + " " + response.intakeData[0].referredBy.lastName;
                    var defaultJurisdiction = utils.isNotEmptyVal(localStorage.getItem('firmJurisdiction')) ? JSON.parse(localStorage.getItem('firmJurisdiction')) : '';
                    vm.matterOverviewData.jurisdictionId = (vm.matterOverviewData.jurisdictionId != 0) ? response.intakeData[0].jurisdictionId : utils.isNotEmptyVal(defaultJurisdiction) ? parseInt(defaultJurisdiction.id) : ''
                    vm.matterOverviewData.venueId = (vm.matterOverviewData.venueId != 0) ? response.intakeData[0].venueId : '';
                    //store intake information
                    intakeFactory.setMatterData(vm.matterOverviewData);
                    info = intakeFactory.getMatterData();
                    //set breadcrum
                    var breadcrum = [{ name: '...' }];
                    routeManager.setBreadcrum(breadcrum);

                    if (!utils.isEmptyObj(info) && (parseInt(info.intakeId) === parseInt(vm.intakeId))) {
                        var breadcrum = [{ name: info.intakeName }];
                        routeManager.addToBreadcrum(breadcrum);
                    }
                    vm.dataReceived = true;
                    localStorage.setItem('Migrated', vm.matterOverviewData.isMigrated);
                    getPlaintiffForSMSIntake(vm.intakeId);
                }, function (error) {
                    // notification.error('unable to fetch matter overview. Reason: ' + error.statusText);
                });
        }

        function getPlaintiffdetails() {
            intakeFactory.getPlaintiffById(vm.intakeId)
                .then(function (response) {
                    vm.plantiffInfo = response;
                    _.forEach(vm.plantiffInfo, function (contactPlantiff) {
                        if (contactPlantiff.contact) {
                            contactFactory.formatContactAddress(contactPlantiff.contact);
                        }
                        if (contactPlantiff.estateAdminId) {
                            contactFactory.formatContactAddress(contactPlantiff.estateAdminId);

                        }
                        if (contactPlantiff.poa) {
                            contactFactory.formatContactAddress(contactPlantiff.poa);

                        }
                    });
                }, function (error) {

                });
        }

        function setSelectedTab(tabname) {
            switch (tabname) {
                case 'plaintiff':
                    vm.isPlaintiff = true;
                    vm.isIncident = false;
                    break;
                case 'incident':
                    vm.isIncident = true;
                    vm.isPlaintiff = false;
                    break;
            }

        }

        function checkRefferaldata(fname, lname) {
            return (utils.isNotEmptyVal(fname) || utils.isNotEmptyVal(lname));
        }

        //motion redirect to document page
        function redirectToDocument(matterId, documentId) {
            $state.go('intakedocument-view', { "matterId": matterId, "documentId": documentId });

        }

        /*us#7001.......need to implement global contact for future purpose..*/
        function getContactCardforProvider(contact) {
            if (!utils.isEmptyVal(contact)) {
                contactFactory.displayContactCard1(contact.insuranceproviderid, contact.edited, contact.contact_type);
                contact.edited = false;
            }
        }

        // //US#8330
        $scope.$on('composeEmailFromContact', function (event, data) {
            if (!(window.isDrawerOpen)) {
                vm.compose = true;
                var html = "";
                html += ($rootScope.emailSig == undefined) ? '' : $rootScope.emailSig;
                vm.composeEmail = html;
                $rootScope.updateComposeMailMsgBody(vm.composeEmail, '', '', '', 'contactEmail', data);
            }

        });

        /* end */
        // vm.getContact = {};
        function getContactCard(contact) {
            if (!utils.isEmptyVal(contact)) {
                contactFactory.displayContactCard1(contact.contactId, contact.edited, "Local");
            }
        }


        function printMatterOverview() {
            //get all user list
            contactFactory.getUsersInFirm()
                .then(function (response) {
                    var userListing = response.data;
                    contactFactory.intakeStaffUserToMatterStaffUser(userListing);
                    vm.remindUserList = userListing;
                }, function (error) {
                    vm.remindUserList = [];
                });
            intakeFactory.getPrintIntakeData(matterId)
                .then(function (res) {
                    var intakeOverviewData = angular.copy(res);
                    //print task reminder find user name start
                    _.forEach(intakeOverviewData.Tasks, function (currentItem, key) {
                        if (currentItem.reminderUsers == "assignedusers") {
                            intakeOverviewData.Tasks[key].remind_users_new = "Assigned to Task";
                        } else if (currentItem.reminderUsers == "all") {
                            intakeOverviewData.Tasks[key].remind_users_new = "All Users";
                        } else {
                            if (JSON.parse(currentItem.reminderUsers) instanceof Array) {
                                intakeOverviewData.Tasks[key].remind_users_new = [];
                                _.forEach(JSON.parse(currentItem.reminderUsers), function (taskid, taskindex) {
                                    _.forEach(vm.remindUserList, function (item) {
                                        if (taskid == item.userId) {
                                            intakeOverviewData.Tasks[key].remind_users_new.push(item);
                                        }
                                    });
                                });
                            }
                        }
                    })
                    //print task reminder find user name end
                    //print Event reminder find user name start
                    _.forEach(intakeOverviewData.Events, function (currentItem, key) {
                        if (currentItem.remindUser == "intake") {
                            intakeOverviewData.Events[key].remind_users_new = "Assigned to Intake";
                        } else if (currentItem.remindUser == "all") {
                            intakeOverviewData.Events[key].remind_users_new = "All Users";
                        } else {
                            if (JSON.parse(currentItem.remindUser) instanceof Array) {
                                intakeOverviewData.Events[key].remind_users_new = [];
                                _.forEach(JSON.parse(currentItem.remindUser), function (taskid, taskindex) {
                                    _.forEach(vm.remindUserList, function (item) {
                                        if (taskid == item.userId) {
                                            intakeOverviewData.Events[key].remind_users_new.push(item);
                                        }
                                    });
                                });
                            }
                        }

                    })
                    //print Event reminder find user name end
                    var printPage = intakeFactory.printMatterOverview(intakeOverviewData);
                    window.open().document.write(printPage);
                });
        }

        $scope.$on('contactCardEdited', function (e, editedContact) {
            overviewinit();
        });

        function getNoteClass(noteCategoryID) {
            if (noteCategoryID == 1)
                return "attorney";
            else if (noteCategoryID == 2)
                return "client-communication";
            else if (noteCategoryID == 4)
                return "deposition";
            else if (noteCategoryID == 7)
                return "insurance";
            else
                return "uncategorized";
        };

        function getNoteIcon(noteCategoryID) {
            if (noteCategoryID == 1)
                return "default-attorney";
            else if (noteCategoryID == 2)
                return "default-client-communication";
            else if (noteCategoryID == 7)
                return "default-insurance";
            else
                return "";
        };

        // delete matter
        function deleteMatter(matterId) {
            var intakeID = '[' + matterId + ']';
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                var promesa = intakeFactory.deleteIntakeInfo(intakeID);
                promesa.then(function (data) {
                    notification.success('Intake deleted successfully');
                    $state.go("intake-list", {});
                }, function (error) {
                    notification.error('Unable to delete');
                });
            });

        };

        /*Valuation*/
        function valuation() {
            var modal = $modal.open({
                templateUrl: 'app/intake/matter/matter-overview/matter-valuation/valuation.html',
                windowClass: 'valuation-window',
                controller: 'valuation as valuation',
                backdrop: 'static',
                keyboard: false
            });
            modal.result.then(function (updateVal) {
                vm.valuationInfo.expected_value = updateVal.expected_value;
            });

        }

        /**/
        function goToEvent(data) {
            intakeEventsHelper.setSelectedEvent(data);
            $state.go('intakeevents', { matterId: matterId });
        }

        function viewAllOverdueTasks() {
            vm.overdueLimit = vm.matterOverviewData.overdueTasks.length;
        }

        /*Modal popup for Archival*/
        function showArchivePopup(selectedMatter) {
            var modalInstance = $modal.open({
                templateUrl: "app/intake/matter/matter-list/partials/archived-popup.html",
                controller: 'ArchivePopupCtrl',
                windowClass: 'medicalIndoDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    matterstoArchive: function () {
                        var matterArray = [];
                        matterArray.push(selectedMatter.matter_id);
                        return matterArray;
                    }
                }

            });

            modalInstance.result.then(function () {

            }, function () { });

        }
    }

})();
