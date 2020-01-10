(function () {
    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('MedicalInfoCtrl', MedicalInfoCtrl);

    MedicalInfoCtrl.$inject = ['$scope', '$rootScope', '$stateParams', '$modal', 'medicalInfoHelper', 'matterDetailsService',
        'notification-service', 'modalService', 'contactFactory', 'masterData', 'mailboxDataService', 'matterFactory'
    ];

    function MedicalInfoCtrl($scope, $rootScope, $stateParams, $modal, medicalInfoHelper, matterDetailsService,
        notificationService, modalService, contactFactory, masterData, mailboxDataService, matterFactory) {
        var vm = this;
        var matterId = $stateParams.matterId;
        var medicalData = [];
        vm.medicalDetails = [];



        vm.openContactCard = openContactCard;
        vm.filterMedicalInfo = filterMedicalInfo;
        vm.addMedicalInfo = addMedicalInfo;
        vm.editMedicalInfo = editMedicalInfo;
        vm.deleteMedicalInfo = deleteMedicalInfo;
        vm.updateBodilyInjury = updateBodilyInjury;

        vm.selectAllUsers = selectAllUsers;
        vm.allUsersSelected = allUsersSelected;
        vm.isUserSelected = isUserSelected;
        vm.viewMedicalInfo = viewMedicalInfo;
        vm.medicalInfoList = {};
        vm.medicalInfoList.medicalinfo = [];
        vm.printMedicalInfo = printMedicalInfo;
        vm.downloadMedicalInfo = downloadMedicalInfo;
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.getSortByLabel = getSortByLabel;
        vm.mode = 'view';
        vm.opendocumentView = opendocumentView;
        vm.linkUploadDoc = linkUploadDoc;
        vm.unlinkDocument = unlinkDocument;

        vm.selectMedicalInfo = selectMedicalInfo;

        //SAF for initialization
        (function () {
            vm.status = {
                isFirstOpen: false
            };
            window.parent.document.title = "Welcome to CloudLex";
            $rootScope.$emit('favicon', "favicon.ico");
            //initGrid();
            vm.selectedMedicalInfo = {};
            vm.medicalInfoGrid = {
                headers: medicalInfoHelper.medicalInfoGrid(),
                selectedItems: []
            };
            vm.sorts = [
                { key: 1, name: "Start Date of Service Asc", keyname: "service_start_date" },
                { key: 2, name: "Start Date of Service Desc", keyname: "-service_start_date" },
                { key: 3, name: "Physician Asc", keyname: "physicianName" },
                { key: 4, name: "Physician Desc", keyname: "-physicianName" },
                { key: 5, name: "Service Provider Asc", keyname: "providerName" },
                { key: 6, name: "Service Provider Desc", keyname: "-providerName" }
            ];
            vm.sortby = utils.isNotEmptyVal(localStorage.getItem('medicalInfoSortBy')) ? localStorage.getItem('medicalInfoSortBy') : "1";
            vm.sortKey = utils.isNotEmptyVal(localStorage.getItem('medicalInfoSortByKeyName')) ? localStorage.getItem('medicalInfoSortByKeyName') : "service_start_date";
            getBodilyInjuryData();
            vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));
            getMedicalInfo();
            getUserEmailSignature();
            vm.matterInfo = matterFactory.getMatterData(matterId);
        })();

        //get sort by label
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
            localStorage.setItem('medicalInfoSortBy', vm.sortby);

            vm.sortKey = vm.sorts[sortBy - 1].keyname;
            localStorage.setItem('medicalInfoSortByKeyName', vm.sortKey);
            // utils.isNotEmptyVal(vm.plaintiffid) ? getMedicalInfo(vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getMedicalInfo();
        }
        function selectMedicalInfo(medicalinfo) {
            vm.selectedMedicalInfo = medicalinfo;
            vm.mode = 'view';
            _.forEach(vm.bodilyInjuries, function (rec, recIndex) {
                if (rec.plaintiffid != medicalinfo.plaintiffid) {
                    rec.bodilyinjury = vm.bodilyInjuriesCopy[recIndex].bodilyinjury;
                    rec.surgery = vm.bodilyInjuriesCopy[recIndex].surgery;
                }
                // medicalInfoHelper.setEdited(medicalInfo, contact);
            });
        }
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
            _.forEach(vm.medicalInfoList.medicalinfo, function (medicalInfo) {
                medicalInfoHelper.setEdited(medicalInfo, contact);
            });
        }

        $scope.$on('contactCardEdited', function (e, editedContact) {
            var contactObj = editedContact;
            var medicalInfos = angular.copy(vm.medicalInfoList.medicalinfo);
            vm.medicalInfoList.medicalinfo = [];

            _.forEach(medicalInfos, function (medicalInfo) {
                medicalInfoHelper.setEditedContactNames(medicalInfo, contactObj);
                medicalInfoHelper.setNames(medicalInfo);
            });

            vm.medicalInfoList.medicalinfo = medicalInfos;
        });

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
        function selectAllUsers(isSelected) {
            if (isSelected === true) {
                vm.medicalInfoGrid.selectedItems = angular.copy(vm.medicalInfoList.medicalinfo);
            } else {
                vm.medicalInfoGrid.selectedItems = [];
            }
        }

        function allUsersSelected() {
            if (utils.isEmptyVal(vm.medicalInfoList) || vm.medicalInfoList.medicalinfo.length == 0) {
                return false;
            }

            return vm.medicalInfoGrid.selectedItems.length === vm.medicalInfoList.medicalinfo.length;
        }

        function isUserSelected(medical_information_id) {
            var uids = _.pluck(vm.medicalInfoGrid.selectedItems, 'medical_information_id');
            return uids.indexOf(medical_information_id) > -1;
        }

        function getBodilyInjuryData() {
            matterDetailsService.getBodilyInjuryData(matterId)
                .then(function (response) {
                    var bodilyInjuries = response.data;
                    // console.log(bodilyInjuries);
                    vm.bodilyInjuries = bodilyInjuries;
                    vm.bodilyInjuriesCopy = angular.copy(bodilyInjuries);
                    vm.selectedMedicalInfo = (vm.bodilyInjuries && vm.bodilyInjuries.length > 0) ? vm.bodilyInjuries[0] : null;
                }, function () {
                    alert("cannot get bodily injury data");
                });
        }
        function filterMedicalInfo(id, allPartyData, selectedPartyType) {
            getMedicalInfo(id, selectedPartyType);
        }

        function getMedicalInfo(plaintiffid, selectedPartyType) {
            vm.medicalInfoGrid.selectedItems.length = 0;
            var show = (plaintiffid == undefined) ? "all" : vm.plaintiffid.id;
            var sortBy = vm.sortby;
            matterDetailsService.getMedicalInfo(matterId, show, sortBy, selectedPartyType)
                .then(function (response) {
                    var data = response;

                    medicalData = data;
                    vm.medicalDetails = data;
                    vm.medicalInfoList.medicalinfo = [];
                    _.forEach(data, function (singleData) {
                        medicalInfoHelper.setNames(singleData);
                        singleData.servicestartdate = (utils.isEmptyVal(singleData.service_start_date) || singleData.service_start_date == 0) ? "" : moment.unix(singleData.service_start_date).utc().format('MM/DD/YYYY');
                        singleData.serviceenddate = (utils.isEmptyVal(singleData.service_end_date) || singleData.service_end_date == 0) ? "" : moment.unix(singleData.service_end_date).utc().format('MM/DD/YYYY');
                        singleData.date_requested = (utils.isEmptyVal(singleData.date_requested) || singleData.date_requested == 0) ? "" : moment.unix(singleData.date_requested).utc().format('MM/DD/YYYY');
                        vm.medicalInfoList.medicalinfo.push(singleData);
                    });

                }, function (error) { });
        }

        function addMedicalInfo(allParties) {
            var modalInstance = $modal.open({
                templateUrl: 'app/matter/matter-details/medical-info/add-medical-info.html',
                controller: 'AddMedicalInfoCtrl as addMedicalInfo',
                windowClass: 'medicalIndoDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    addEditMedicalInfo: function () {
                        return {
                            matterId: matterId,
                            mode: "add",
                            allParties: allParties
                        };
                    }
                }
            });

            modalInstance.result.then(function () {
                utils.isNotEmptyVal(vm.plaintiffid) ? getMedicalInfo(vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getMedicalInfo();
                //getMedicalInfo(vm.plaintiffid.id,vm.plaintiffid.selectedPartyType); //Bug-#5297-refresh the medical information grid
                notificationService.success('Medical information added successfully.');
                //alert("Medical information added successfully");
            }, function () {
                //alert("An error occurred. Please try later");
                //console.log("add-medical-info popup closed");
            });
        }

        function editMedicalInfo(allParties, selectedItems) {
            var modalInstance = $modal.open({
                templateUrl: 'app/matter/matter-details/medical-info/add-medical-info.html',
                controller: 'AddMedicalInfoCtrl as addMedicalInfo',
                windowClass: 'medicalIndoDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    addEditMedicalInfo: function () {
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
                utils.isNotEmptyVal(vm.plaintiffid) ? getMedicalInfo(vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getMedicalInfo();
                //getMedicalInfo(vm.plaintiffid.id,vm.plaintiffid.selectedPartyType); //refresh the medical information grid
                notificationService.success('Medical information updated successfully.');
            }, function () { });
        }

        /* open document on View pop-up US#7316 */
        function opendocumentView(doc, isGlobalDoc, $event) {
            $event.stopPropagation();
            var docdata = { matterId: doc.matter_id, documentId: doc.medical_info_document_id, isGlobalDoc: isGlobalDoc };
            var modalInstance = $modal.open({
                templateUrl: "app/documents/view-document/document-popup-view.html",
                controller: "DocumentsPopupViewCtrl as docpopupviewCtrl",
                size: 'lg',
                windowClass: 'modalLargeDialog',
                resolve: {
                    docdetails: function () {
                        return docdata;
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
                            type: 'medicalrecord'
                        };
                    }
                }
            });

            modalInstance.result.then(function () {
                utils.isNotEmptyVal(vm.plaintiffid) ? getMedicalInfo(vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getMedicalInfo();
            }, function () { });
        }

        /**
         * view comment information for selected medical information
         */
        function viewMedicalInfo(selectedItems) {
            var modalInstance = $modal.open({
                templateUrl: 'app/matter/matter-details/medical-info/view-comment.html',
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
            vm.medicalInfoGrid.selectedItems = [];
        });


        function unlinkDocument(selectedItems) {
            vm.LinkedDocRecords = {};
            var actionButton = 'Yes';
            var closeButtonText = "Cancel";

            var msg = 'Are you sure you want to unlink this Document(s) ?'

            vm.LinkedDocRecords = _.filter(selectedItems, function (item) {
                return utils.isNotEmptyVal(item.medical_info_document_id) && item.medical_info_document_id > 0;

            });
            vm.noDocRecords = _.filter(selectedItems, function (item) {
                return utils.isEmptyVal(item.medical_info_document_id) || item.medical_info_document_id == 0;

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
                var ids = _.pluck(vm.LinkedDocRecords, 'medical_information_id');
                var matterDetailName = "medicalrecord";
                matterDetailsService.unlinkDocument(ids, matterDetailName)
                    .then(function () {
                        utils.isNotEmptyVal(vm.plaintiffid) ? getMedicalInfo(vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getMedicalInfo();
                        notificationService.success('document unlinked successfully.');
                    }, function () {
                        //alert("unable to delete");
                        utils.isNotEmptyVal(vm.plaintiffid) ? getMedicalInfo(vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getMedicalInfo();
                        notificationService.error('An error occurred. Please try later.');
                    });

            });


        }

        function deleteMedicalInfo(selectedItems) {

            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {

                var selectedIds = _.pluck(selectedItems, 'medical_information_id');
                matterDetailsService.deleteMedicalRecords(selectedIds)
                    .then(function () {
                        //alert("deleted successfully");
                        notificationService.success('Medical information deleted successfully.');
                        utils.isNotEmptyVal(vm.plaintiffid) ? getMedicalInfo(vm.plaintiffid.id, vm.plaintiffid.selectedPartyType) : getMedicalInfo();
                        //getMedicalInfo(vm.plaintiffid.id,vm.plaintiffid.selectedPartyType); //Bug#5927
                    });

            });
        }

        function updateBodilyInjury(bodilyInjuries) {
            vm.mode = 'view';
            var bodilyInjuryUpdateData = getbodilyInjuryUpdateData(bodilyInjuries);
            matterDetailsService.updateBodilyInjuryData(matterId, bodilyInjuryUpdateData)
                .then(function () {
                    //alert("updated successfully");
                    notificationService.success('Bodily injury updated successfully.');
                    vm.bodilyInjuries = bodilyInjuries;
                    vm.bodilyInjuriesCopy = angular.copy(bodilyInjuries);
                }, function () {
                    //alert("unable to update bodily injury");
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function getbodilyInjuryUpdateData(bodilyInjuries) {
            var updateJSON = {
                bodilyinjuri: []
            };
            _.forEach(bodilyInjuries, function (bodilyInjury) {
                updateJSON.bodilyinjuri.push({
                    plaintiffid: bodilyInjury.plaintiffid,
                    text: bodilyInjury.bodilyinjury,
                    surgery: bodilyInjury.surgery
                });
            });
            return updateJSON;
        }

        //US13403 - Export MedicalInfo List(PHP to Java)
        function downloadMedicalInfo(plaintiffid) {
            var show = utils.isNotEmptyVal(plaintiffid) ? plaintiffid.id : 'all';
            var partyRole = utils.isNotEmptyVal(plaintiffid) ? plaintiffid.selectedPartyType : '';
            var sortBy = vm.sortby;
            matterDetailsService.downloadMedicalInfo(matterId, show, sortBy, partyRole)
                .then(function (response) {
                    var filename = "MedicalInfo_list";
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

        function printMedicalInfo(plaintiffArray, plaintiffid) {
            var matterName = '';
            var fileNumber = '';
            var plaintiffName = '';
            _.forEach(plaintiffArray, function (plaintiff) {
                if (angular.isDefined(plaintiff.id) && plaintiffid != undefined) {
                    if (plaintiff.id == plaintiffid.id && plaintiffid.selectedPartyType == plaintiff.selectedPartyType) {
                        plaintiffName = plaintiff.name;
                    }
                }

            })
            matterDetailsService.getMatterInfo(matterId)
                .then(function (response) {
                    matterName = response.data[0].matter_name;
                    fileNumber = response.data[0].file_number;
                    var show = plaintiffid || "all";
                    var sortBy = vm.getSortByLabel(vm.sortby);
                    var sortKey = vm.sortKey;
                    medicalInfoHelper.printMedicalInfo(matterName, fileNumber, plaintiffName, sortBy, vm.medicalInfoGrid.selectedItems, vm.medicalInfoList.medicalinfo, sortKey);

                }, function () {
                    //notificationService.error('An error occurred. Please try later.');
                })

        }


    }

})();

//add medical info modal controller
(function () {
    angular
        .module('cloudlex.matter')
        .controller('AddMedicalInfoCtrl', AddMedicalInfoCtrl);

    AddMedicalInfoCtrl.$inject = ['$modalInstance', 'matterFactory', 'matterDetailsService', 'addEditMedicalInfo', 'notification-service', 'contactFactory', 'globalConstants'];

    function AddMedicalInfoCtrl($modalInstance, matterFactory, matterDetailsService, addEditMedicalInfo, notificationService, contactFactory, globalConstants) {
        var vm = this;
        var contacts = [];

        var matterId = addEditMedicalInfo.matterId;
        var pageMode = addEditMedicalInfo.mode; //page mode : add, edit
        if (pageMode == "edit") {
            var medicalinfoedit = addEditMedicalInfo.selectedItems[0];
            _.forEach(medicalinfoedit, function (val, item) {
                val == " - " ? medicalinfoedit[item] = "" : medicalinfoedit[item] = val;
            });
        }
        var selectedMedicalInfo = pageMode === 'edit' ?
            angular.copy(addEditMedicalInfo.selectedItems[0]) : undefined;

        vm.newMedicalInfo = {};
        vm.saveMedicalInfo = saveMedicalInfo;
        vm.close = closeModal;
        vm.getContacts = getContacts;
        vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
        vm.openDatePicker = openDatePicker;
        vm.addNewContact = addNewContact;
        vm.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;
        vm.isDatesValid = isDatesValid;
        vm.groupPlaintiffDefendants = groupPlaintiffDefendants;
        vm.setPartyRole = setPartyRole;
        vm.JavaFilterAPIForContactList = true;
        function isDatesValid() {
            if ($('#medstartDatedivError').css("display") == "block" || $('#medendDatedivError').css("display") == "block" || $('#medreqDatedivError').css("display") == "block") {
                return true;
            } else {
                return false;
            }
        }



        //SAF for initialization
        (function () {
            vm.pageMode = pageMode; //assigned to use mode to hide/show elements
            //getPlaintiffs(matterId);
            vm.plaintiffs = addEditMedicalInfo.allParties.slice(3);
            if (angular.isDefined(selectedMedicalInfo)) {
                setMedicalInfo(selectedMedicalInfo);
            }
            vm.datePicker = {};
        })();

        function setPartyRole(selparty) {
            var partyInfo = _.find(vm.plaintiffs, function (party) {
                return party.id === selparty.id && party.selectedPartyType === selparty.selectedPartyType;
            });

            vm.newMedicalInfo.plaintiffid = partyInfo.id;
            vm.newMedicalInfo.party_role = partyInfo.selectedPartyType;

        }
        function checkIfEnterKeyWasPressed(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
            return true;

        };
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


        function getPlaintiffs(matterId) {
            matterDetailsService.getPlaintiffs(matterId)
                .then(function (response) {
                    var data = response.data.data;
                    matterDetailsService.setNamePropForPlaintiffs(data);
                    vm.plaintiffs = data;
                }, function (error) { });
        }

        function setMedicalInfo(medicalInfo) {
            //set the popup model
            vm.newMedicalInfo = medicalInfo;

            vm.newMedicalInfo.associatedParty = _.find(vm.plaintiffs, function (party) {
                return party.id == medicalInfo.associated_party_id && party.selectedPartyType == medicalInfo.party_role;
            });

            vm.newMedicalInfo.plaintiffid = utils.isEmptyVal(vm.newMedicalInfo.associatedParty) ? '' : vm.newMedicalInfo.associatedParty.id;


        }

        function saveMedicalInfo(addMedInfo) {
            var newMedicalInfo = angular.copy(addMedInfo);
            newMedicalInfo.matter_id = matterId;

            //convert moment string date format to date object 
            var originalServiceStartDate = newMedicalInfo.servicestartdate;
            var originalServiceEndDate = newMedicalInfo.serviceenddate;
            var originaldate_requested = newMedicalInfo.date_requested;

            newMedicalInfo.servicestartdate = (utils.isEmptyVal(newMedicalInfo.servicestartdate)) ? "" : utils.getUTCTimeStamp(newMedicalInfo.servicestartdate);
            newMedicalInfo.serviceenddate = (utils.isEmptyVal(newMedicalInfo.serviceenddate)) ? "" : utils.getUTCTimeStampEndDay(newMedicalInfo.serviceenddate);
            newMedicalInfo.date_requested = (utils.isEmptyVal(newMedicalInfo.date_requested)) ? "" : utils.getUTCTimeStamp(newMedicalInfo.date_requested);

            var serviceStartDate = utils.isEmptyVal(originalServiceStartDate) ? "" : moment(originalServiceStartDate).format('MM/DD/YYYY');
            var serviceEndDate = utils.isEmptyVal(originalServiceEndDate) ? "" : moment(originalServiceEndDate).format('MM/DD/YYYY');
            var dosYear, dosMonth, dosDay, dosDate, dosMomentDate, dosStart, dosStartOfTheDay;
            var rdYear, rdMonth, rdDay, rdDate, rdMomentDate, rdStart, rdStartOfTheDay;


            if (serviceStartDate != '' && serviceStartDate != 0 && serviceStartDate != null) {
                if (angular.isDefined(serviceStartDate) && angular.isDefined(serviceStartDate.length) && serviceStartDate.length == 10) {
                    dosYear = serviceStartDate.substring(6, 10);
                    dosMonth = serviceStartDate.substring(0, 2);
                    dosDay = serviceStartDate.substring(3, 5);
                    dosDate = dosYear + "/" + (dosMonth) + "/" + dosDay;
                } else {
                    dosYear = serviceStartDate.getFullYear();
                    dosMonth = serviceStartDate.getMonth();
                    dosDay = serviceStartDate.getDate();
                    dosDate = dosYear + "/" + (dosMonth + 1) + "/" + dosDay;

                }
                dosMomentDate = moment(dosDate, "YYYY/MM/DD");
                dosStart = angular.copy(dosMomentDate);
                dosStart = dosStart.startOf('day');
                dosStartOfTheDay = moment(dosStart).unix();

            } else {
                dosStartOfTheDay = '';
            }

            if (serviceEndDate != '' && serviceEndDate != 0 && serviceEndDate != null) {
                if (angular.isDefined(serviceEndDate) && angular.isDefined(serviceEndDate.length) && serviceEndDate.length == 10) {
                    rdYear = serviceEndDate.substring(6, 10);
                    rdMonth = serviceEndDate.substring(0, 2);
                    rdDay = serviceEndDate.substring(3, 5);
                    rdDate = rdYear + "/" + (rdMonth) + "/" + rdDay;
                } else {
                    rdYear = serviceEndDate.getFullYear();
                    rdMonth = serviceEndDate.getMonth();
                    rdDay = serviceEndDate.getDate();
                    rdDate = rdYear + "/" + (rdMonth + 1) + "/" + rdDay;

                }
                rdMomentDate = moment(rdDate, "YYYY/MM/DD");
                rdStart = angular.copy(rdMomentDate);
                rdStart = rdStart.startOf('day');
                rdStartOfTheDay = moment(rdStart).unix();

            } else {
                rdStartOfTheDay = '';
            }
            newMedicalInfo.servicestartdate = (utils.isEmptyVal(newMedicalInfo.servicestartdate)) ? "" : moment.unix(newMedicalInfo.servicestartdate).utc().format('MM/DD/YYYY'); //originalServiceStartDate;
            newMedicalInfo.serviceenddate = (utils.isEmptyVal(newMedicalInfo.serviceenddate)) ? "" : moment.unix(newMedicalInfo.serviceenddate).utc().format('MM/DD/YYYY'); //originalServiceEndDate;
            newMedicalInfo.date_requested = (utils.isEmptyVal(newMedicalInfo.date_requested)) ? "" : moment.unix(newMedicalInfo.date_requested).utc().format('MM/DD/YYYY');

            //US#8174 make end date of service non-mandatory
            // if (utils.isNotEmptyVal(rdStartOfTheDay) && utils.isEmptyVal(dosStartOfTheDay)) {
            //     notificationService.error('Please select Start Date of Service');
            //     return;
            // }

            // if (utils.isNotEmptyVal(dosStartOfTheDay) && utils.isEmptyVal(rdStartOfTheDay)) {
            //     notificationService.error('Please select End Date of Service');
            //     return;
            // }
            //US#8174 make end date of service non-mandatory
            if (utils.isNotEmptyVal(rdStartOfTheDay)) {
                if (dosStartOfTheDay > rdStartOfTheDay) {
                    notificationService.error('End date of service cannot be less than Start date of service');
                    return;
                }
            }


            newMedicalInfo.servicestartdate = (utils.isEmptyVal(newMedicalInfo.servicestartdate)) ? "" : utils.getUTCTimeStamp(newMedicalInfo.servicestartdate);
            newMedicalInfo.serviceenddate = (utils.isEmptyVal(newMedicalInfo.serviceenddate)) ? "" : utils.getUTCTimeStampEndDay(newMedicalInfo.serviceenddate);
            newMedicalInfo.date_requested = (utils.isEmptyVal(newMedicalInfo.date_requested)) ? "" : utils.getUTCTimeStamp(newMedicalInfo.date_requested);
            var medicalInfoObj = createMedicalInfoObj(newMedicalInfo);

            switch (pageMode) {
                case "add":
                    addMedicalRecord(medicalInfoObj);
                    break;
                case "edit":
                    medicalInfoObj.medical_information_id = newMedicalInfo.medical_information_id;
                    editMedicalRecord(medicalInfoObj);
                    break;
            }
        }

        function createMedicalInfoObj(newMedicalInfo) {
            var medicalInfoObj = {};

            medicalInfoObj.matter_id = parseInt(newMedicalInfo.matter_id);
            medicalInfoObj.party_role = utils.isNotEmptyVal(newMedicalInfo.party_role) ? newMedicalInfo.party_role : 0;
            medicalInfoObj.service_start_date = utils.isNotEmptyVal(newMedicalInfo.servicestartdate) ? newMedicalInfo.servicestartdate : null;
            medicalInfoObj.service_end_date = utils.isNotEmptyVal(newMedicalInfo.serviceenddate) ? newMedicalInfo.serviceenddate : null;
            medicalInfoObj.date_requested = utils.isNotEmptyVal(newMedicalInfo.date_requested) ? newMedicalInfo.date_requested : null;
            medicalInfoObj.treatment_type = utils.isNotEmptyVal(newMedicalInfo.treatment_type) ? newMedicalInfo.treatment_type : null;
            medicalInfoObj.memo = utils.isNotEmptyVal(newMedicalInfo.memo) ? newMedicalInfo.memo : null;
            medicalInfoObj.medical_info_document_id = utils.isNotEmptyVal(newMedicalInfo.medical_info_document_id) ? newMedicalInfo.medical_info_document_id : null;
            medicalInfoObj.physician_id = utils.isNotEmptyVal(newMedicalInfo.physician) ? newMedicalInfo.physician.contact_id : null;
            medicalInfoObj.medical_provider_id = utils.isNotEmptyVal(newMedicalInfo.medical_provider) ? newMedicalInfo.medical_provider.contact_id : null;
            if (newMedicalInfo.associatedParty) {
                switch (newMedicalInfo.associatedParty.selectedPartyType) {
                    case 1:
                        medicalInfoObj.associated_party_id = utils.isNotEmptyVal(newMedicalInfo.associatedParty) ? parseInt(newMedicalInfo.associatedParty.plaintiffid) : null;
                        break;
                    case 2:
                        medicalInfoObj.associated_party_id = utils.isNotEmptyVal(newMedicalInfo.associatedParty) ? parseInt(newMedicalInfo.associatedParty.defendantid) : null;
                        break;
                    case 3:
                        medicalInfoObj.associated_party_id = utils.isNotEmptyVal(newMedicalInfo.associatedParty) ? parseInt(newMedicalInfo.associatedParty.id) : null;
                        break;
                }
            } else {
                medicalInfoObj.associated_party_id = null;
            }

            return medicalInfoObj;
        }

        function addMedicalRecord(medicalInfoObj) {
            //US#6288 Check valid contacts 
            if (typeof medicalInfoObj.physician_id === "undefined") {
                return notificationService.error("Invalid Contact Selected");
            }
            if (typeof medicalInfoObj.medical_provider_id === "undefined") {
                return notificationService.error("Invalid Contact Selected");
            }
            if (utils.isEmptyVal(medicalInfoObj.associated_party_id) && utils.isEmptyVal(medicalInfoObj.physician_id) && utils.isEmptyVal(medicalInfoObj.medical_provider_id) && utils.isEmptyVal(medicalInfoObj.service_start_date) && utils.isEmptyVal(medicalInfoObj.service_end_date) && utils.isEmptyVal(medicalInfoObj.date_requested) && utils.isEmptyVal(medicalInfoObj.treatment_type) && utils.isEmptyVal(medicalInfoObj.memo)) {
                notificationService.error("Please add some data to save");
                return;
            }
            //var newMedicalInfo = setIdsSaving(newMedicalInfo);
            matterDetailsService.saveMedicalRecord(medicalInfoObj)
                .then(function (response) {
                    $modalInstance.close();
                }, function (error) {
                    //alert("unable to add");
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function editMedicalRecord(medicalInfoObj) {
            //US#6288 Check valid contacts 
            if (typeof medicalInfoObj.physician_id === "undefined") {
                return notificationService.error("Invalid Contact Selected");
            }

            if (typeof medicalInfoObj.medical_provider_id === "undefined") {
                return notificationService.error("Invalid Contact Selected");
            }
            if (utils.isEmptyVal(medicalInfoObj.associated_party_id) && utils.isEmptyVal(medicalInfoObj.physician_id) && utils.isEmptyVal(medicalInfoObj.medical_provider_id) && utils.isEmptyVal(medicalInfoObj.service_start_date) && utils.isEmptyVal(medicalInfoObj.service_end_date) && utils.isEmptyVal(medicalInfoObj.date_requested) && utils.isEmptyVal(medicalInfoObj.treatment_type) && utils.isEmptyVal(medicalInfoObj.memo)) {
                notificationService.error("Please add some data to save");
                return;
            }
            //var newMedicalInfo = setIdsSaving(medicalInfo);
            matterDetailsService.editMedicalRecord(medicalInfoObj)
                .then(function (response) {
                    $modalInstance.close();
                }, function (error) {
                    //alert("unable to edit");
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function setIdsSaving(medicalInfo) {
            var newMedicalInfo = angular.copy(medicalInfo); //create clone to cut the two way binding
            newMedicalInfo.physicianid = newMedicalInfo.physicianid ? newMedicalInfo.physicianid.contactid : "";
            newMedicalInfo.providerid = newMedicalInfo.providerid ? newMedicalInfo.providerid.contactid : ""; //newMedicalInfo.providerid.contactid;
            return newMedicalInfo;
        }

        function closeModal(newMedicalInfo) {
            $modalInstance.dismiss();
        }

        function getContacts(contactName, searchItem) {
            var postObj = {};
            postObj.type = globalConstants.mattDetailsMedicalInfo;
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            //postObj.page_Size = 250;
            //postObj = matterFactory.setContactType(postObj);


            return matterFactory.getContactsByName(postObj, vm.JavaFilterAPIForContactList)
                .then(function (response) {
                    var data = response.data;
                    matterDetailsService.setNamePropForContactsOffDrupal(data);
                    contacts = data;
                    _.forEach(data, function (contact) {
                        contact.name = utils.removeunwantedHTML(contact.first_name) + ' ' + utils.removeunwantedHTML(contact.last_name);
                    });
                    return data;
                });
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
            return (firstname + " " + lastname);

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
            selectedType.type = model;
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                response['firstname'] = response.first_name;
                response['lastname'] = response.last_name;
                response['contactid'] = (response.contact_id).toString();
                vm.newMedicalInfo[model] = response;
            }, function () { });
        }

    }

})();

/**
 * view comment controller for medical information
 */

//add medical info modal controller
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

(function (angular) {

    angular.module('cloudlex.matter')
        .factory('medicalInfoHelper', medicalInfoHelper);

    medicalInfoHelper.$inject = ['globalConstants', '$filter'];

    function medicalInfoHelper(globalConstants, $filter) {
        return {
            medicalInfoGrid: _medicalInfoGrid,
            printMedicalInfo: _printMedicalInfo,
            setNames: _setNames,
            setEditedContactNames: _setEditedContactNames,
            setEdited: _setEdited
        };

        function _getFiltersForPrint(matterName, fileNumber, plaintiffName, sortby) {
            var filtersForPrint = {
                'Matter Name': matterName,
                'File #': fileNumber,
                'Records Of': plaintiffName,
                'ORDERED BY': sortby
            }
            return filtersForPrint;
        }

        function _printMedicalInfo(matterName, fileNumber, plaintiffName, sortby, selectedItem, medicalList, sortKey) {
            var priMedicalList = angular.copy($filter('orderBy')(medicalList, sortKey));
            //var sorts = _getSorts();
            var filtersForPrint = _getFiltersForPrint(matterName, fileNumber, plaintiffName, sortby);
            var headers = _medicalInfoGrid();
            headers = _getPropsFromHeaders(headers);

            var printPage = _getPrintPage(filtersForPrint, headers, priMedicalList);
            window.open().document.write(printPage);
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

        function _getPrintPage(filters, headers, priMedicalList) {
            var html = "<html><title>Medical Info Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Medical Info Report</h1><div></div>";
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
                html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + header.display + "</th>";
            });
            html += '</tr>';


            angular.forEach(priMedicalList, function (item) {
                html += '<tr>';
                angular.forEach(headers, function (header) {
                    item[header.prop] = (_.isNull(item[header.prop]) || angular.isUndefined(item[header.prop]) ||
                        utils.isEmptyString(item[header.prop])) ? " - " : item[header.prop];
                    html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;min-width: 90px;'>" +
                        '<pre style="font-family: calibri!important;white-space: pre-wrap !important;border-radius: 0px;border: 0px;padding: 0;word-break: break-word;">' + utils.removeunwantedHTML(item[header.prop]) + '</pre>' + "</td>";
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

        function _medicalInfoGrid() {
            return [{
                field: [

                    {
                        html: '<span data-ng-show="data.medical_info_document_id && !(data.medical_info_document_id==0)" ng-click="medicalInfo.opendocumentView(data, false, $event)" class ="sprite default-linked-document" tooltip="View document" tooltip-append-to-body="true" tooltip-placement="right">' +
                            '</span>' + '<span data-ng-hide="(data.medical_info_document_id && !(data.medical_info_document_id==0)) || medicalInfo.matterInfo.archivalMatterReadOnlyFlag" class ="sprite default-link" ng-click = "medicalInfo.linkUploadDoc(data)" tooltip="Link Document" tooltip-append-to-body="true" tooltip-placement="right"></span>',
                        inline: true,
                        cursor: true,
                        href: { link: 'javascript: void(0);', paramProp: ['matterid', 'documentid'] }
                    }

                ],
                dataWidth: "4"
            },
            {
                field: [{
                    html: '<span data-ng-show="data.memo" class ="sprite default-view-comment" ng-click = "medicalInfo.viewMedicalInfo(data)" tooltip="View Memo" tooltip-append-to-body="true" tooltip-placement="right"></span>',
                    inline: true,
                    cursor: true,

                }],
                dataWidth: "4"
            },
            {
                field: [{
                    prop: 'date_requested',
                    printDisplay: 'Date Requested'
                },],
                displayName: 'Date Requested',
                dataWidth: "10"

            },
            {
                field: [{

                    prop: 'plaintiffName',
                    printDisplay: 'Associated Party',
                    onClick: "medicalInfo.openContactCard(data)",
                    compile: true,
                    inline: true,
                    cursor: true,
                    underline: true

                }],
                displayName: 'Associated Party',
                dataWidth: "15"
            },

            {
                field: [{
                    prop: 'physicianName',
                    printDisplay: 'Physician',
                    onClick: "medicalInfo.openContactCard(data.physician)",
                    compile: true,
                    cursor: true,
                    underline: true
                }],
                displayName: 'Physician',
                dataWidth: "15"
            },
            {
                field: [{
                    prop: 'providerName',
                    printDisplay: 'Service Provider',
                    onClick: "medicalInfo.openContactCard(data.medical_provider)",
                    compile: true,
                    cursor: true,
                    underline: true
                }],
                displayName: 'Service Provider',
                dataWidth: "12"

            },
            {
                field: [{
                    prop: 'treatment_type',
                    printDisplay: 'Treatment Type'
                }],
                displayName: 'Treatment Type',
                dataWidth: "12"
            },
            {
                field: [{
                    prop: 'servicestartdate',
                    printDisplay: 'Start Date of Service'
                },],
                displayName: 'Start Date of Service',
                dataWidth: "10"
            },
            {
                field: [{
                    prop: 'serviceenddate',
                    printDisplay: 'End Date of Service'
                },],
                displayName: 'End Date of Service',
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
            switch (singleData.party_role) {
                case 1:
                    singleData.plaintiffName = (singleData.plaintiff) ? singleData.plaintiff.first_name + " " + singleData.plaintiff.last_name : "";
                    break;
                case 2:
                    singleData.plaintiffName = (singleData.defendant) ? singleData.defendant.first_name + " " + singleData.defendant.last_name : "";
                    break;
                case 3:
                    singleData.plaintiffName = (singleData.otherParty) ? singleData.otherParty.first_name + " " + singleData.otherParty.last_name : "";
                    break;
                default:
                    singleData.plaintiffName = "";
                    break;
            }
            if (utils.isNotEmptyVal(singleData.physician)) {
                singleData.physicianName = singleData.physician.first_name + " " + singleData.physician.last_name;
            } else {
                singleData.physicianName = '';
            }
            if (utils.isNotEmptyVal(singleData.medical_provider)) {
                singleData.providerName = singleData.medical_provider.first_name + " " + singleData.medical_provider.last_name;
            } else {
                singleData.providerName = '';
            }
        }

        function _setEditedContactNames(medicalInfo, contact) {

            if (utils.isNotEmptyVal(medicalInfo.plaintiff) &&
                medicalInfo.plaintiff.contact_id === contact.contact_id) {
                medicalInfo.plaintiff.first_name = contact.firstname;
                medicalInfo.plaintiff.last_name = contact.lastname;
                medicalInfo.plaintiff.edited = true;
            }

            if (utils.isNotEmptyVal(medicalInfo.defendant) &&
                medicalInfo.defendant.contact_id === contact.contact_id) {
                medicalInfo.defendant.first_name = contact.firstname;
                medicalInfo.defendant.last_name = contact.lastname;
                medicalInfo.defendant.edited = true;
            }

            if (utils.isNotEmptyVal(medicalInfo.otherParty) &&
                medicalInfo.otherParty.contact_id === contact.contact_id) {
                medicalInfo.otherParty.first_name = contact.firstname;
                medicalInfo.otherParty.last_name = contact.lastname;
                medicalInfo.otherParty.edited = true;
            }

            if (utils.isNotEmptyVal(medicalInfo.physician) &&
                medicalInfo.physician.contact_id === contact.contact_id) {
                medicalInfo.physician.first_name = contact.firstname;
                medicalInfo.physician.last_name = contact.lastname;
                medicalInfo.physician.edited = true;
            }

            if (utils.isNotEmptyVal(medicalInfo.medical_provider) &&
                medicalInfo.medical_provider.contact_id === contact.contact_id) {
                medicalInfo.medical_provider.first_name = contact.firstname;
                medicalInfo.medical_provider.last_name = contact.lastname;
                medicalInfo.medical_provider.edited = true;
            }
        }

        function _setEdited(medicalInfo, contact) {

            if (utils.isNotEmptyVal(medicalInfo.plaintiff)) {
                medicalInfo.plaintiff.edited = medicalInfo.plaintiff.contact_id === contact.contact_id ?
                    false : medicalInfo.plaintiff.edited;
            }

            if (utils.isNotEmptyVal(medicalInfo.defendant)) {
                medicalInfo.defendant.edited = medicalInfo.defendant.contact_id === contact.contact_id ?
                    false : medicalInfo.defendant.edited;
            }

            if (utils.isNotEmptyVal(medicalInfo.otherParty)) {
                medicalInfo.otherParty.edited = medicalInfo.otherParty.contact_id === contact.contact_id ?
                    false : medicalInfo.otherParty.edited;
            }

            if (utils.isNotEmptyVal(medicalInfo.medical_provider)) {
                medicalInfo.medical_provider.edited = medicalInfo.medical_provider.contact_id === contact.contact_id ?
                    false : medicalInfo.medical_provider.edited;
            }


            if (utils.isNotEmptyVal(medicalInfo.physician)) {
                medicalInfo.physician.edited = medicalInfo.physician.contact_id === contact.contact_id ?
                    false : medicalInfo.physician.edited;
            }

        }

    }

})(angular);

//if (serviceStartDate != '' && serviceStartDate != 0 && serviceStartDate != null && serviceEndDate != '' && serviceEndDate != 0 && serviceEndDate != null) {
//    if (dosStartOfTheDay > rdStartOfTheDay) {
//        notificationService.error('Start date of service cannot be less than end date of service');
//    } else {
//        switch (pageMode) {
//            case "add":
//                addMedicalRecord(newMedicalInfo);
//                break;
//            case "edit":
//                editMedicalRecord(newMedicalInfo);
//                break;
//        }
//    }
//}
