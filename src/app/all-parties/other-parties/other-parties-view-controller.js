;

(function () {

    'use strict';

    angular
        .module('cloudlex.allParties')
        .controller('OtherPartiesViewCtrl', OtherPartiesViewController);

    OtherPartiesViewController.$inject = ['allPartiesDataService', '$stateParams', '$state',
        '$scope', '$q', '$timeout', 'modalService', '$modal', 'matterFactory', 'notification-service', 'masterData', 'contactFactory'];

    function OtherPartiesViewController(allPartiesDataService, $stateParams, $state,
        $scope, $q, $timeout, modalService, $modal, matterFactory, notificationService, masterData, contactFactory) {

        var self = this;
        self.otherDatafilter_Text = "";
        self.filterRetain = filterRetain;
        self.selectAllOtherParty = selectAllOtherParty;
        self.isOtherPartySelected = isOtherPartySelected;
        self.allOtherPartyselected = allOtherPartyselected;
        self.matterId = $stateParams.matterId;
        self.otherParties = [];
        self.displayOthrPartyCount = displayOthrPartyCount;
        // self.allPartiesPrint = allPartiesPrint;
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.firmID = gracePeriodDetails.firm_id;
        // var otherPartySelected = false;
        self.printAll = printAll;
        self.getNewGridDetails = getNewGridDetails;
        self.otherPartyDetails = [];
        self.printNewGrid = printNewGrid;
        self.uisorts = [];
        self.masterData = '';
        self.contactRoles = [];
        self.contactRolesapi = [];
        self.getSortOpbyUi = getSortOpbyUi;
        self.sortOtherPartiesUi = sortOtherPartiesUi;
        self.openFiltersUi = openFiltersUi;
        self.otherPartyFilter = otherPartyFilter;
        self.otherRelatedTagCancelled = otherRelatedTagCancelled;
        self.sortOtherPartiesApi = sortOtherPartiesApi;
        self.getSortOpbyApi = getSortOpbyApi;
        self.openFiltersApi = openFiltersApi;
        self.createopTagsApi = createopTagsApi;

        self.otherRelatedTagApiCancelled = otherRelatedTagApiCancelled;
        self.contactRoles = ['Service Provider', 'Insurance Provider', 'Physician', 'Lien Holder', 'Insurance Adjuster', 'Lien Adjuster'];
        //var plaintiffs = [];
        self.entityPermissionToggleForMattercollaboration = entityPermissionToggleForMattercollaboration;
        self.clxUserId = localStorage.getItem('userId');
        self.endUserCollaboration = endUserCollaboration;
        self.disableSingleEntityForMattercollaboration = disableSingleEntityForMattercollaboration;
        (function () {
            self.masterData = masterData.getMasterData();
            if (utils.isEmptyObj(self.masterData)) {
                masterData.fetchMasterData().then(function () {
                    self.masterData = masterData.getMasterData();
                    init();
                });
            } else {
                init();
            }

            self.matterInfo = matterFactory.getMatterData(self.matterId);
            self.matterCollaboratedEntity = JSON.parse(localStorage.getItem('getMatterCollaboratedEntity'));
        })();

        function init() {
            self.showGrid = false;
            self.contactRolesapi = self.masterData.contact_roles;
            self.contactRoles = [
                {
                    contactroleid: "30",
                    contactrolename: "Service Provider"
                },
                {
                    contactroleid: "31",
                    contactrolename: "Insurance Provider"
                },
                {
                    contactroleid: "32",
                    contactrolename: "Physician"
                },
                {
                    contactroleid: "33",
                    contactrolename: "Lien Holder"
                },
                {
                    contactroleid: "34",
                    contactrolename: "Insurance Adjuster"
                },
                {
                    contactroleid: "35",
                    contactrolename: "Lien Adjuster"
                }];
            var role = angular.copy(self.contactRolesapi);
            self.contactRolesapi = [];
            self.contactRolesapi = role.concat(self.contactRoles);
            self.otherPartyGrid = {
                headers: getOtherPartyGrid(),
                selectedOtherParties: []
            }
            self.display = {
                otherPartySelected: {}
            };
            self.uisorts = [
                { key: 'asc', name: "Name ASC", 'divider': 1 },
                { key: 'desc', name: "Name DESC", 'divider': '' }

            ];
            self.otherRelatedtags = JSON.parse(sessionStorage.getItem('otherRelatedTags'));
            self.otherpartyDetailsCount = sessionStorage.getItem("otherpartyDetailsCount");
            // var selectedSortui = sessionStorage.getItem('sortLocally');
            // _.forEach(self.uisorts, function (item) {
            //     if (item.key == selectedSortui) {
            //         sortOtherPartiesUi(item.key);
            //     }
            // });
            self.sortbyapi = sessionStorage.getItem('sortbyopapi');
            if (self.sortbyapi) {
                self.sortbyapi = self.sortbyapi;
            } else {
                self.sortbyapi = 'asc';
            }
            self.selectedFiltersapi = JSON.parse(sessionStorage.getItem('apiOtherpartyfilter'));
            var savedMatterId = sessionStorage.getItem("matterId");
            if (savedMatterId && self.matterId == savedMatterId) {
                var filtertext = sessionStorage.getItem("otherData_filterText");
                if (utils.isNotEmptyVal(filtertext)) {
                    self.showSearch = true;
                    self.otherDatafilter_Text = filtertext;
                }
            } else {
                self.otherRelatedtags = [];
                self.catTags = [];
                self.selectedFiltersapi = [];
                self.otherpartyDetailsCount = 0;
                // sessionStorage.removeItem('otherRelatedTags');
                // sessionStorage.removeItem('apiOtherpartyfilter');
            }

            if (utils.isNotEmptyVal(self.selectedFiltersapi) || utils.isNotEmptyVal(self.sortbyapi)) {
                var obj;
                (utils.isNotEmptyVal(self.selectedFiltersapi)) ? obj = self.selectedFiltersapi : obj = '';
                self.catTags = createopTagsApi(obj, self.contactRolesapi);
                var getData = getOtherParties(self.matterId, '', self.sortbyapi);
                $q.all([getData]).then(function (values) {
                    nextCourse();
                });
            } else {
                nextCourse();
            }


        };

        function filterRetain() {
            var filtertext = self.otherDatafilter_Text;
            sessionStorage.setItem("otherData_filterText", filtertext);
            sessionStorage.setItem("matterId", self.matterId);
        }

        function nextCourse() {
            self.allfirmData = JSON.parse(localStorage.getItem('allFirmSetting'));
            _.forEach(self.allfirmData, function (item) {
                if (item.state == "entity_sharing") {
                    self.isCollaborationActive = (item.enabled == 1) ? true : false;
                }
            });
            initData();
        }


        // Get data for other party and other related party grids
        function initData() {
            self.loaderFlagStatus = false;
            //createopTags(filter,self.contactRolesapi);
            var otherParties = getOtherPartyGridData();
            var otherRelatedParties = getNewGridDetails();
            $q.all([otherParties, otherRelatedParties]).then(function (values) {
                (utils.isNotEmptyVal(self.otherpartyDetailsCount)) ? self.otherpartyDetailsCount = self.otherpartyDetailsCount : self.otherpartyDetailsCount = 0;
                var otherData = angular.copy(self.otherParties);
                _.forEach(otherData, function (obj) {
                    obj.fullname = obj.firstname + " " + obj.lastname;
                });
                self.otherParties = [];
                _.forEach(self.otherPartyDetails, function (item) {
                    item.fullname = item.firstname + " " + item.lastname;
                    if (item.assoParty.length > 0) {
                        item.assopartyname = item.assoParty[0].fname + " " + item.assoParty[0].lname;
                    }
                });
                self.otherParties = otherData.concat(self.otherPartyDetails);
                var info = JSON.parse(localStorage.getItem('otherParties'));


                if (!utils.isEmptyObj(info)) {
                    self.otherParties.slice(0).forEach(function (item, index) {
                        if (info.contactid == item.contactid) {
                            self.otherParties['open' + index] = true;
                        } else {
                            self.otherParties['open' + self.otherParties.indexOf(item)] = false;
                        }
                    });
                }
                $scope.$parent.otherPartiesCount = self.otherParties.length;
                sortOtherPartiesApi(self.sortbyapi)
                self.loaderFlagStatus = true;
            });
        };


        function entityPermissionToggleForMattercollaboration(flag, entity, status) {

            var obj = {
                firmId: parseInt(self.firmID),
                matterId: parseInt(self.matterId),
                contacts: [{ id: entity.id }],
            }

            if (flag == 'document') {
                obj['entityType'] = 1;
                obj["documentEntity"] = {
                    docPermission: (status ? 1 : 0)
                }
            } else if (flag == 'event') {
                obj['entityType'] = 2;
                obj["eventEntity"] = {
                    eventPermission: (status ? 1 : 0)
                }
            } if (flag == 'note') {
                obj['entityType'] = 3;
                obj["noteEntity"] = {
                    notePermission: (status ? 1 : 0)
                }
            }

            allPartiesDataService.modifyEntityPermissionForMattercollaboration(obj)
                .then(function (data) {
                    getMatterCollaboratedEntity();
                }, function (data) {
                });

        }

        function endUserCollaboration(entity) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Confirm',
                headerText: 'Stop Sharing?',
                bodyText: 'Are you sure you want to stop sharing with this contact?'
            };
            var obj = {
                firmId: parseInt(self.firmID),
                matterId: parseInt(self.matterId),
                contacts: [{ id: entity.id }],
                clxUserId: self.clxUserId,
            }
            modalService.showModal({}, modalOptions).then(function () {
                var promise = allPartiesDataService.endUserCollaboration(obj);
                promise.then(function (data) {
                    notificationService.success('Access disabled successfully');
                    init();
                }, function (data) {
                    notificationService.error('Access not disabled successfully');
                });
            });
        }

        function disableSingleEntityForMattercollaboration(flag, entity, selectedObj, state) {
            var obj = {
                firmId: parseInt(self.firmID),
                matterId: parseInt(self.matterId),
                contacts: [{ id: entity.id, isEnable: 0 }]
            }

            if (flag == 'document') {
                obj['entityType'] = 1;
                obj["documentEntity"] = {
                    docIds: [selectedObj.doc_id]
                }
            } else if (flag == 'event') {
                obj['entityType'] = 2;
                obj["eventEntity"] = {
                    eventIds: [selectedObj.event_id]
                }
            } if (flag == 'note') {
                obj['entityType'] = 3;
                obj["noteEntity"] = {
                    noteIds: [selectedObj.note_id]
                }
            }

            ///////////////
            var modalInstance = $modal.open({
                templateUrl: 'app/all-parties/plaintiffs/disable-collaboration/disable-collaboration.html',
                controller: 'disableSingleEntityForMattercollaborationCtrl as disableEntityMC',
                size: 'lg',
                backdrop: 'static',
                keyboard: false,
                windowClass: 'modalLargeDialog',
                resolve: {
                    inputParams: function () {
                        return { 'matterId': self.matterId, 'flag': flag, 'entity': entity, 'selectedObj': selectedObj, 'state': state, 'configObj': obj };
                    }
                }
            });
            modalInstance.result.then(function () {

            });
            /////////////////

            //$state.go('disableEntity', { 'matterId': self.matterId, 'flag': flag, 'entity': entity, 'selectedObj': selectedObj, 'state': state, 'configObj': obj });
        }


        function getOtherPartyGrid() {

        }
        function displayOthrPartyCount(count) {
            self.otherpartyDetailsCount = parseInt(count);
            sessionStorage.setItem("otherpartyDetailsCount", self.otherpartyDetailsCount);
            $scope.$parent.otherPartiesCount = self.otherParties.length;
        }
        function createopTagsApi(filter, contactRoles) {
            var tags = [];
            tags = tags.concat(generateopConTags(filter.filters, contactRoles));
            return tags;
        }
        function generateopConTags(filter, contactRoles) {
            if (utils.isEmptyVal(filter) || !(filter instanceof Array)) {
                return [];
            }
            var catTags = [];
            _.forEach(filter, function (apiRole) {
                var conObj = _.find(contactRoles, function (conrole) {
                    return conrole.contactrolename == apiRole;
                });
                if (utils.isNotEmptyVal(conObj)) {
                    var contag = {};
                    contag.value = "Role: " + conObj.contactrolename;
                    contag.id = apiRole;
                    contag.key = "conrole_" + conObj.contactrolename;
                    catTags.push(contag);
                }
            });
            return catTags;
        };
        function getSortOpbyUi(sortbyui) {
            if (utils.isEmptyVal(sortbyui)) {
                return "Name ASC";
            }
            var sortbyui = _.find(self.uisorts, function (sortui) {
                return sortui.key == sortbyui;

            });
            return sortbyui.name;
        }
        function sortOtherPartiesApi(sortapikey) {
            setTimeout(function () {
                var heightForGrid = ($("#allPartiesFooter").offset().top - $("#myDiv1").offset().top);
                heightForGrid = heightForGrid - $("#gridHeaderOtherParties").height();
                $('#myGrid').css("max-height", heightForGrid + "px");
                $('#myGrid').css("height", heightForGrid + "px");
            }, 100);
            
            self.showGrid = true;
            self.sortbyapi = sortapikey;
            sessionStorage.setItem('sortbyopapi', self.sortbyapi);
            if (self.sortbyapi == 'desc') {
                return self.uiasc = true;
            } else {
                return self.uiasc = false;
            }
            // getOtherParties(self.matterId, self.selectedFiltersapi, self.sortbyapi);

        }
        function getSortOpbyApi(sortbyapi) {
            if (utils.isEmptyVal(sortbyapi)) {
                return "Name ASC";
            }
            var sortbyapi = _.find(self.uisorts, function (sortapi) {
                return sortapi.key == sortbyapi;

            });
            return sortbyapi.name;

        }
        function sortOtherPartiesUi(sortuikey) {
            self.sortbyui = sortuikey;
            sessionStorage.setItem('sortLocally', self.sortbyui);
            if (self.sortbyui == 'desc') {
                return self.uiasc = true;
            } else {
                return self.uiasc = false;
            }
        }
        function otherRelatedTagCancelled(cancelled) {
            var index;
            index = _.findIndex(self.catTags, function (tag) { return tag.id == cancelled.id })
            var idx = self.selectedFiltersapi.filters.indexOf(cancelled.id);
            if (idx != -1) {
                self.selectedFiltersapi.filters.splice(idx, 1);
            }
            if (index != -1) {
                self.catTags.splice(index, 1);
            }
            sessionStorage.setItem('apiOtherpartyfilter', JSON.stringify(self.selectedFiltersapi));
        };
        function otherPartyFilter(item) {
            if (!self.catTags || self.catTags.length == 0) {
                return true;
            }
            var roleresult = _.pluck(self.catTags, 'id');
            if (_.indexOf(roleresult, item.contactrolename) > -1) {
                return true;
            } else {
                return false;
            }
        };
        function otherRelatedTagApiCancelled(cancelled) {
            var indexapi;
            indexapi = self.selectedFiltersapi.filters.indexOf(cancelled.id);
            if (indexapi != -1) {
                self.selectedFiltersapi.filters.splice(indexapi, 1);
            }
            sessionStorage.setItem('apiOtherpartyfilter', JSON.stringify(self.selectedFiltersapi));
            // getOtherParties(self.matterId, self.selectedFiltersapi, self.sortbyapi);
        };

        function selectAllOtherParty(isSelected) {
            if (isSelected === true) {
                var list = angular.copy(self.otherParties);
                _.forEach(list, function (item) {
                    if (!item.isOtherRelatedPArty) {
                        self.otherPartyGrid.selectedOtherParties.push(item);
                    }
                })
            } else {
                self.otherPartyGrid.selectedOtherParties = [];
            }
        }


        function isOtherPartySelected(otherPartyId) {
            var otherPartyIds = _.pluck(self.otherPartyGrid.selectedOtherParties, 'uid');
            return otherPartyIds.indexOf(otherPartyId) > -1;
        }

        function allOtherPartyselected() {
            if (utils.isEmptyVal(self.otherParties)) {
                return false;
            }
            return self.otherPartyGrid.selectedOtherParties.length === self.otherParties.length;
        }

        function getOtherPartyGridData() {
            var defer = $q.defer();
            self.otherParties = allPartiesDataService.getAllPartiesData(self.matterID, '').oparty.data;
            angular.forEach(self.otherParties, function (field, index) {
                field.isOtherRelatedPArty = false;
                contactFactory.formatContactAddress(field);
                field.party_contact_id = _.filter(field.party_contact_id, function (oparty) {
                    return utils.isNotEmptyVal(oparty.contactid);
                });
            });
            defer.resolve();
            return defer.promise;
        }

        //set the updated names of the edited contact
        $scope.$on("contactCardEdited", function (event, editedContact) {
            var contactObj = editedContact;
            allPartiesDataService.updateAllPartiesDataOnContactEdit(contactObj);
            initData();//Bug#5436
        });

        //US#8376 other related parties merge for same contactids based on role
        function mergeDuplicateOtherpartyRecords(data) {
            self.newdetails = [];
            var uniqueData = _.groupBy(data, 'contactid');
            _.forEach(uniqueData, function (item, index, array) {
                self.newdetails = item[0];
                self.newdetails.assoParty = [];
                self.newdetails.added_bys = [];
                _.forEach(item, function (data, index) {
                    utils.isNotEmptyVal(data.associated_party) && (data.associated_party != false) ? self.newdetails.assoParty.push(data.associated_party) : angular.noop();
                    utils.isNotEmptyVal(data.added_by) ? self.newdetails.added_bys.push(data.added_by) : angular.noop();
                });
                //(utils.isNotEmptyVal(self.newdetails.assoParty)) || (self.newdetails.associated_party != false) ? self.otherPartyDetails.push(self.newdetails) : angular.noop();
                self.newdetails.added_bys = _.uniq(self.newdetails.added_bys);
                self.newdetails.assoParty = _.uniq(self.newdetails.assoParty, function (item, key, a) {
                    return item.contactid.toString();
                });
                self.otherPartyDetails.push(self.newdetails);
            });

        }

        //US#7867 func to get new grid details
        function getNewGridDetails() {
            var defer = $q.defer();

            allPartiesDataService.getOtherPartiesNewDetails(self.matterId)
                .then(function (response) {
                    self.newGridDetails = response.data;
                    self.otherPartyDetails = [];
                    self.details = {};

                    self.details = _.pick(self.newGridDetails, ['insurance_adjuster', 'insurance_provider', 'insured_party', 'lien_adjuster', 'lien_holder', 'lien_insurance_provider', 'medicalbills_service_provider', 'physician', 'service_provider']);
                    Array.prototype.push.apply(self.details.medicalbills_service_provider, self.details.service_provider);
                    delete self.details.service_provider;
                    Array.prototype.push.apply(self.details.insurance_provider, self.details.lien_insurance_provider);
                    delete self.details.lien_insurance_provider;
                    _.forEach(self.details, function (item) {
                        mergeDuplicateOtherpartyRecords(item);
                    });
                    _.forEach(self.otherPartyDetails, function (item) {
                        item.firstname = item.fname;
                        item.lastname = item.lname;
                        item.contactrolename = item.role;
                        item.contactroleid = item.party_role;
                        item.isOtherRelatedPArty = true;
                    })
                    // US# 8738 : Applied filter to remove Contacts with role "Insured Party" from other related parties grid.
                    self.otherPartyDetails = _.filter(self.otherPartyDetails, function (otherRelatedParty) {
                        if (otherRelatedParty.role != "Insured Party") {
                            return otherRelatedParty;
                        }
                    });
                    var info = JSON.parse(localStorage.getItem('otherRelatedParties'));
                    if (!utils.isEmptyObj(info)) {
                        self.otherPartyDetails.slice(0).forEach(function (item) {
                            if (info.contactid == item.contactid) {
                                self.otherPartyDetails['open' + info.index] = true;
                            } else {
                                self.otherPartyDetails['open' + self.otherPartyDetails.indexOf(item)] = false;
                            }
                        })
                    }

                    getMatterCollaboratedEntity();
                    defer.resolve();
                });
            return defer.promise;
        }


        //print other parties
        function printAll(otherPartyInfo) {
            matterFactory.fetchMatterData(self.matterId).then(function (resultData) {
                self.matterInfo = resultData;
                var matterInfo = angular.copy(self.matterInfo);
                var matterInformation = {
                    'Matter Name': matterInfo.matter_name,
                    'File #': matterInfo.file_number
                };

                var printObj = (utils.isEmptyVal(otherPartyInfo)) ? self.otherParties : otherPartyInfo;
                var sortById = angular.copy(self.sortbyapi);
                if (sortById == 'asc') {
                    var arraySortedAsc = _.sortBy(angular.copy(printObj), 'firstname');
                    printObj = arraySortedAsc;
                } else {
                    var arraySortedAsc = _.sortBy(angular.copy(printObj), 'firstname');
                    var arraySortedDesc = arraySortedAsc.reverse();
                    printObj = arraySortedDesc;
                }
                var printPage = allPartiesDataService.printOtherPartyAll(printObj, matterInformation);
                self.otherPartyGrid.selectedOtherParties = [];
                window.open().document.write(printPage);
            });
        }
        //US#7867 func to print other related parties grid
        function printNewGrid(newInfo) {
            matterFactory.fetchMatterData(self.matterId).then(function (resultData) {
                self.matterInfo = resultData;
                var matterInfo = angular.copy(self.matterInfo);
                var matterInformation = {
                    'Matter Name': matterInfo.matter_name,
                    'File #': matterInfo.file_number
                };

                var printObj = (utils.isEmptyVal(newInfo)) ? '' : newInfo;
                var printPage = allPartiesDataService.printOtherPartyNewGrid(printObj, matterInformation);
                self.otherPartyGrid.selectedOtherParties = [];
                window.open().document.write(printPage);
            });
        }
        /*** Service call Functions ***/
        function getOtherParties(matterid, filters, sort) {
            var defer = $q.defer();
            allPartiesDataService.getOtherParties(self.matterId, '', sort)
                .then(function (response) {
                    if (response.data) {
                        self.otherParties = response.data;
                        getMatterCollaboratedEntity();
                        $scope.$parent.otherPartiesCount = self.otherParties.length;
                    }
                    defer.resolve();
                });
            return defer.promise;

        };

        /*** Event Handlers ***/
        self.setSelectedOtherParty = function (otherParty) {
            $timeout(function () {
                otherParty.checked = otherParty.checked ? false : true;

                if (otherParty.checked) {
                    self.selectedOtherParties.push(otherParty);
                } else {
                    var removeIndex = self.selectedOtherParties.indexOf(otherParty.mattercontactid);
                    self.selectedOtherParties.splice(removeIndex, 1);
                }
            });
        };

        self.deleteSelectedOtherParties = function () {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {

                var promise = allPartiesDataService.deleteOtherParties(deleteother_parties);
                promise.then(function (data) {
                    // getOtherParties();
                    getOtherParties(self.matterId, '', self.sortbyapi);
                    self.selectedOtherParties = [];
                    notificationService.success('Other parties deleted successfully.');
                }, function (error) {
                    notificationService.error('An error occurred. Please try later.');
                });
            });
        };

        self.deleteSelectedOtherParty = function (otherParties) {
            //event.stopPropagation();
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                var deleteother_parties = [];
                if (utils.isNotEmptyVal(self.otherDatafilter_Text) && self.otherPartyGrid.selectAll) {
                    deleteother_parties = self.filterdOtherParty;
                }
                else {
                    deleteother_parties = otherParties;
                }
                var inputArr = [];
                angular.forEach(deleteother_parties, function (field) {
                    var arrayToDelete = _.pluck(field.party_contact_id, 'mattercontactid');
                    inputArr = inputArr.concat(arrayToDelete);
                });
                var promise = allPartiesDataService.deleteOtherParties(inputArr);
                promise.then(function (data) {
                    if (data && data.status == 400) {
                        if (data.data && data.data[0]) {
                            notificationService.error(data.data[0]);
                        } else {
                            notificationService.error('An error occurred. Please try later.');
                        }

                    } else {
                        // getOtherParties();
                        // getOtherParties(self.matterId, '', self.sortbyapi);
                        init();
                        self.otherPartyGrid.selectedOtherParties = [];
                        notificationService.success('Other party deleted successfully.');
                    }
                }, function (error) {
                    notificationService.error('An error occurred. Please try later.');
                });
            });
        };

        self.addOtherParty = function () {
            localStorage.setItem('mode', 'add');
            $state.go("addOtherParty", { 'matterId': self.matterId, 'mode': allPartiesDataService.mode });
        };

        self.editOtherParty = function (otherParty) {
            localStorage.setItem('mode', 'edit');
            var data = {
                otherParty: otherParty,
                matterId: self.matterId
            }
            sessionStorage.setItem("selectedOtherParty", JSON.stringify(data));
            $state.go("editOtherParty", { 'matterId': self.matterId, 'selectedOtherParty': otherParty, 'mode': allPartiesDataService.mode });
        };

        self.print = function (otherParty, event) {
            //event.stopPropagation();
            //TODO: Print details
        };

        self.toggleAccordionGroup = function (index, flag) {
            for (var i = 0; i < self.otherParties.length; i++) {
                if (i == index && flag == 'otherParties') {
                    var obj = {};
                    obj.contactid = self.otherParties[index].contactid;
                    obj.index = index;
                    localStorage.setItem('otherParties', JSON.stringify(obj));
                    self.otherParties['open' + i] = !self.otherParties['open' + i];
                    if (!self.otherParties['open' + i]) {
                        localStorage.removeItem('otherParties');
                    }
                } else {
                    self.otherParties['open' + i] = false;
                }
            }


        };

        /*** Styling Functions ***/

        /*** Alert Functions ***/


        function openFiltersUi() {
            var scrollPos = $(window).scrollTop();
            var modalInstance = $modal.open({
                templateUrl: 'app/all-parties/other-party-filter.html',
                controller: 'OtherPartiesFilterCtrl as filterCntrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    matterID: function () {
                        return self.matterId;
                    },
                    role: function () {
                        return self.contactRoles;
                    },
                    filters: function () {
                        return (self.otherRelatedtags) ? _.pluck(self.otherRelatedtags, 'id') : [];
                    },
                    tags: function () {
                        return (self.otherRelatedtags) ? self.otherRelatedtags : [];
                    }
                }
            });

            modalInstance.result.then(function (response) {
                // if(response.flag=='UI'){
                if (response.action == "RESET") {
                    self.pageNum = 1;
                    self.selectedFiltersui = [];
                    self.otherRelatedtags = [];
                } else {
                    self.selectedFiltersui = response;
                    self.otherRelatedtags = [];
                    _.forEach(self.selectedFiltersui.filters, function (role, i) {
                        var tag = {};
                        tag.value = "Role: " + role;
                        tag.id = role;
                        tag.key = "Role: " + role;
                        self.otherRelatedtags.push(tag);
                        sessionStorage.setItem('otherRelatedTags', JSON.stringify(self.otherRelatedtags));
                        sessionStorage.setItem("matterId", self.matterId);
                    });
                }

                $(window).scrollTop(scrollPos - 1);
            }, function () {
            });
        }

        function openFiltersApi() {
            var scrollPos = $(window).scrollTop();
            var modalInstance = $modal.open({
                templateUrl: 'app/all-parties/other-party-filter-api.html',
                controller: 'OtherPartiesFilterApiCtrl as filterApiCntrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    matterID: function () {
                        return self.matterId;
                    },
                    role: function () {
                        return self.contactRolesapi;
                    },
                    filters: function () {
                        return (self.catTags) ? _.pluck(self.catTags, 'id') : [];
                    },
                    tags: function () {
                        return self.catTags;
                    }
                }
            });

            modalInstance.result.then(function (response) {
                if (response.action == "RESET") {
                    self.pageNum = 1;
                    self.selectedFiltersapi = [];
                    self.catTags = [];
                } else {
                    self.selectedFiltersapi = response;
                    sessionStorage.setItem('apiOtherpartyfilter', JSON.stringify(self.selectedFiltersapi));
                    sessionStorage.setItem("matterId", self.matterId);
                    self.catTags = self.createopTagsApi(self.selectedFiltersapi, self.contactRolesapi);
                }
                $(window).scrollTop(scrollPos - 1);
            }, function () {
            });

        }

        function contactMatterCollaboaratedEntity() {
            _.forEach(self.otherParties, function (otherParty, plaintiffIndex) {
                otherParty['collaboratedEntityFileCount'] = 0;
                otherParty['disableCollaborationFlag'] = true;
                _.forEach(self.matterCollaboratedEntity, function (entity, entityIndex) {
                    if (parseInt(entity.id) == parseInt(otherParty.contactid)) {
                        otherParty['collaboratedEntity'] = entity;
                        var doc = 0, note = 0, event = 0;
                        if (entity.documentEntity && entity.documentEntity.documents) {
                            doc = entity.documentEntity.documents.length;
                        }
                        if (entity.noteEntity && entity.noteEntity.notes) {
                            note = entity.noteEntity.notes.length;
                        }
                        if (entity.eventEntity && entity.eventEntity.events) {
                            event = entity.eventEntity.events.length;
                        }
                        otherParty['collaboratedEntityFileCount'] = doc + note + event;
                        otherParty['disableCollaborationFlag'] = false;
                    }

                });
            });
        }

        function contactMatterCollaboaratedEntityOtherPartyDetails() {
            _.forEach(self.otherPartyDetails, function (otherParty, plaintiffIndex) {
                otherParty['collaboratedEntityFileCount'] = 0;
                otherParty['disableCollaborationFlag'] = true;
                _.forEach(self.matterCollaboratedEntity, function (entity, entityIndex) {
                    if (parseInt(entity.id) == parseInt(otherParty.contactid)) {
                        otherParty['collaboratedEntity'] = entity;
                        var doc = 0, note = 0, event = 0;
                        if (entity.documentEntity && entity.documentEntity.documents) {
                            doc = entity.documentEntity.documents.length;
                        }
                        if (entity.noteEntity && entity.noteEntity.notes) {
                            note = entity.noteEntity.notes.length;
                        }
                        if (entity.eventEntity && entity.eventEntity.events) {
                            event = entity.eventEntity.events.length;
                        }
                        otherParty['collaboratedEntityFileCount'] = doc + note + event;
                        otherParty['disableCollaborationFlag'] = false;
                    }

                });
            });
        }

        function getMatterCollaboratedEntity() {
            if (self.isCollaborationActive) {
                matterFactory.getMatterCollaboratedEntity(self.matterId, self.firmID)
                    .then(function (data) {
                        _.forEach(data, function (rec) {
                            _.forEach(rec.noteEntity.notes, function (note) {
                                var text = note.plaintext;
                                text = utils.replaceQuoteWithActual(text);
                                note.displayText = text;
                            });
                        });
                        localStorage.setItem('getMatterCollaboratedEntity', JSON.stringify(data));
                        self.matterCollaboratedEntity = JSON.parse(localStorage.getItem('getMatterCollaboratedEntity'));
                        contactMatterCollaboaratedEntity();
                        contactMatterCollaboaratedEntityOtherPartyDetails();
                    }, function (data) {
                        // notification.error('Error ');
                    });
            }

        }


    }

})();


/*function getPlaintiffs() {
           allPartiesDataService.getPlaintiffs(self.matterId)
               .then(function (response) {
                   plaintiffs = response.data;
               });
       };*/

//function setContactName(contact) {
//    _.forEach(self.otherParties, function (otherParties, i) {
//        if (utils.isNotEmptyVal(otherParties.contactid)) {
//            if (otherParties.contactid === contact.contactid) {
//                //otherParties.firstname = contact.firstname;
//                //otherParties.lastname = contact.lastname;
//                //otherParties.edited = true;

//                otherParties = angular.extend({}, otherParties, contact);
//                otherParties.phone_number = utils.isNotEmptyVal(otherParties.phone) ?
//                    otherParties.phone.split(',')[0] : otherParties.phone;
//                otherParties.emailid = utils.isNotEmptyVal(otherParties.email) ?
//                    otherParties.email.split(',')[0] : otherParties.email;
//                otherParties.edited = true;
//                self.otherParties[i] = otherParties;
//            }
//        }
//    });
//}
