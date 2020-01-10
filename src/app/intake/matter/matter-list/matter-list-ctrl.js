(function () {
    'use strict';

    angular.module('intake.matter').controller('IntakeListCtrl', ['$scope', '$q', 'masterData', 'intakeFactory', 'contactFactory', '$state', '$modal', 'modalService',
        '$timeout', 'intakeListHelper', 'notification-service', 'routeManager', 'globalConstants', 'intakeNotesDataService', 'practiceAndBillingDataLayer', 'notification-service', '$rootScope',
        function ($scope, $q, masterData, intakeFactory, contactFactory, $state, $modal, modalService,
            $timeout, intakeListHelper, notificationService, routeManager, globalConstants, intakeNotesDataService, practiceAndBillingDataLayer, notification, $rootScope) {

            //event fired when the drawer opens
            $scope.$on('drawer-opened', function () {
                if (angular.isDefined(matterList) && matterList.length > 0) {
                    self.viewModel.matters = matterList.slice(0, 20);
                }
            });

            //on clicking on body we close the drawer
            $scope.$on('drawer-closed', function () {
                if (angular.isDefined(matterList) && matterList.length > 0) {
                    self.viewModel.matters = matterList;
                }
            });

            var self = this;
            self.totalIntake = 0;
            self.showPager = true;
            var matterList = [];
            self.InsuranceInfo = {};
            self.Currentdate = new Date();
            self.pageNumber = 1;
            var allDisplayStatuses = {};
            self.filterRetain = filterRetain;
            self.allMatterSelected = allMatterSelected;
            //US# 4713 disable add button
            var gracePeriodDetails = masterData.getUserRole();
            self.isGraceOver = gracePeriodDetails.plan_subscription_status;
            // var matterPermissions = masterData.getPermissions();
            // self.matterPermissions = _.filter(matterPermissions[0].permissions, function (per) {
            //     if (per.entity_id == '1') {
            //         return per;
            //     }
            // });
            var filtertext = localStorage.getItem("intake_filtertext");
            if (utils.isNotEmptyVal(filtertext)) {
                self.showSearch = true;
            }

            self.intakeInfo = {};
            self.users = [];
            self.masterDataCopy = [];
            self.addIntake = false;
            self.genderList = [{ id: '1', name: 'Male' }, { id: '2', name: 'Female' }, { id: '3', name: 'Other' }, { id: '4', name: 'Not Specified' }];
            self.statusList = [{ id: '1', name: 'Alive' }, { id: '0', name: 'Deceased' }, { id: '2', name: 'Not Specified' }];
            self.typeOfPerson = [{ id: '1', name: 'Single' }, { id: '2', name: 'Married' }, { id: '3', name: 'Not Specified' }, { id: '4', name: 'Widowed' }, { id: '5', name: 'Other' }];
            self.optionList = [{ id: '1', name: 'Yes' }, { id: '2', name: 'No' }];
            self.optionCircleList = [{ id: '1', name: 'MV accident' }, { id: '2', name: 'Med malpractice' }, { id: '3', name: 'Trip' }, { id: '4', name: 'Product Liab' }, { id: '5', name: 'Slip and Fall' }, { id: '6', name: 'Construc.' }, { id: '7', name: 'Premises' }];
            self.nameList = [{ id: 'nameList' }];
            self.insuranceProviderList = [{ id: 'insuranceProviderList' }];
            self.insuredPartyList = [{ id: 'insuredPartyList' }];
            self.getData = getData;
            self.typeList = [{ id: '1', name: 'Facebook' }, { id: '2', name: 'Linked In' }, { id: '3', name: 'Twitter' }, { id: '4', name: 'Instagram' }, { id: '5', name: 'Google' }, { id: '6', name: 'Other' }, { id: '7', name: 'Referral' }, { id: '8', name: 'TV Ad' }, { id: '9', name: 'Radio Ad' }, { id: '10', name: 'Billboard' }, { id: '11', name: 'Website' }, { id: '12', name: 'Lead Generator' }];

            // initialise phone
            self.contactTypeName = [{
                type: 'phone_work',
                name: 'Work'
            }, {
                type: 'phone_home',
                name: 'Home'
            }, {
                type: 'phone_cell',
                name: 'Cell'
            }];

            self.datepickerOptions = {
                formatYear: 'yyyy',
                startingDay: 1,
                'show-weeks': false
            };
            self.dateFormat = 'MM/dd/yyyy';
            self.incidentList = angular.copy(globalConstants.incidentList);
            self.injuredList = angular.copy(globalConstants.injuredList);
            self.allDataFromMaster = masterData.getMasterData();
            self.countries = getArrayByName(self.allDataFromMaster.contries);
            self.states = getArrayByName(self.allDataFromMaster.states);
            self.stateshow = true;
            self.excessConfirmed = [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }];
            self.paymentBtns = [{ label: "Hourly", value: "1" },
            { label: "Weekly", value: "4" },
            { label: "Monthly", value: "2" },
            { label: "Yearly", value: "3" }
            ];
            self.intake_name = [];
            self.witnessNameList = [{ id: 'witnessNameList' }];
            self.employerInfo = [];
            self.openMigrationPopUp = openMigrationPopUp;
            self.openInatkeFormTab = openInatkeFormTab;
            self.sendMail = sendMail;
            (function () {
                /* Set a Message to display if matter limit is over*/
                setuserMsg();
                getSubscriptionInfo();
                var allUsersData = getUsersInFirm();
                var allMasterData = getMasterList();
                $q.all([allUsersData, allMasterData]).then(function (values) {
                    self.viewModel.masterList.user = [];
                    self.viewModel.masterList.user = self.users;
                    self.init();
                });
                // getData();
            })();

            function getSubscriptionInfo() {
                var response = practiceAndBillingDataLayer.getConfigurableData();
                response.then(function (data) {
                    self.isReferralExchange = data.RE.is_active;
                    self.isDigiArchivalSub = data.DA.is_active;
                    self.customFileNumber = data.matter_apps.file_number;
                });
            }
            //Refer-out
            self.goToReferOut = function () {
                $state.go('refer-out-intake', { intakeId: self.clxGridOptions.selectedItems[0].intakeId, fromMatterList: true });
            }

            function openInatkeFormTab(selectedItem) {
                var intakeData = angular.copy(selectedItem);
                intakeData.intakeType = angular.copy(intakeData.intakeTypeCopy);
                intakeData.intakeSubType = angular.copy(intakeData.intakeSubTypeCopy);
                intakeData.intakeCategory = angular.copy(intakeData.intakeCategoryCopy);
                var intakeId = intakeData.intakeId;
                var templateId = 4;
                if (intakeData.intakeType.intakeTypeId == 1 && intakeData.intakeSubType.intakeSubTypeId == 1) {
                    templateId = 1;
                } else if (intakeData.intakeType.intakeTypeId == 1 && intakeData.intakeSubType.intakeSubTypeId == 2) {
                    templateId = 2;
                } else if (intakeData.intakeType.intakeTypeId == 2) {
                    templateId = 3;
                } else {
                    templateId = 4;
                }
                intakeFactory.getPlaintiffByIntake(intakeId)
                    .then(function (response) {
                        if (utils.isNotEmptyString(response)) {
                            var intake_name = response;
                            var intakePlaintiffId = intake_name[0].intakePlaintiffId;
                            intakeFactory.getIntakeFormUrl(templateId, intakeId, intakePlaintiffId)
                                .then(function (response) {
                                    var Url = response;
                                    window.open(Url, '_blank');
                                    //window.open(Url);
                                });
                        }
                    });
            }

            function sendMail(selectedItem) {
                var intakeData = angular.copy(selectedItem);
                intakeData.intakeType = angular.copy(intakeData.intakeTypeCopy);
                intakeData.intakeSubType = angular.copy(intakeData.intakeSubTypeCopy);
                intakeData.intakeCategory = angular.copy(intakeData.intakeCategoryCopy);
                var intakeId = intakeData.intakeId;
                var templateId = 4;
                if (intakeData.intakeType.intakeTypeId == 1 && intakeData.intakeSubType.intakeSubTypeId == 1) {
                    templateId = 1;
                } else if (intakeData.intakeType.intakeTypeId == 1 && intakeData.intakeSubType.intakeSubTypeId == 2) {
                    templateId = 2;
                } else if (intakeData.intakeType.intakeTypeId == 2) {
                    templateId = 3;
                } else {
                    templateId = 4;
                }
                intakeFactory.getPlaintiffByIntake(intakeId)
                    .then(function (response) {
                        if (utils.isNotEmptyString(response)) {
                            var intake_name = response;
                            var intakePlaintiffId = intake_name[0].intakePlaintiffId;
                            var modalInstance = $modal.open({
                                templateUrl: 'app/intake/all-parties/sendMail-popUp.html',
                                controller: 'IntakeSendMail as IntakeSendMail',
                                windowClass: 'medium-pop',
                                backdrop: "static",
                                keyboard: false,
                                // size: 'sm',
                                resolve: {
                                    Contact: function () {
                                        return intake_name[0].contact;
                                    },
                                    templateId: function () {
                                        return templateId;

                                    },
                                    intakeId: function () {
                                        return intakeId;

                                    },
                                    PlaintiffintakeId: function () {
                                        return intakePlaintiffId;

                                    },
                                }
                            });

                            modalInstance.result.then(function (response) {

                            })
                        }
                    });

            }

            function openMigrationPopUp(selectedItem) {
                getSubscriptionInfo();
                var venue_id = 0;
                var data = _.filter(selectedItem, function (item) {
                    if (utils.isNotEmptyVal(item.intakeCategory)) {
                        return item;
                    }
                });
                if (selectedItem.length > 0) {
                    var selectedItemCopy = angular.copy(selectedItem);
                    var intakeData = angular.copy(selectedItemCopy[0]);
                    var intakeDataNext = {};
                    var intakeDataList = [];
                    var check = _.every(selectedItemCopy, function (item) {
                        return (intakeData.intakeType == item.intakeType && intakeData.intakeSubType == item.intakeSubType);
                    });
                    var check_2 = _.every(selectedItemCopy, function (item) {
                        return (intakeData.jurisdictionId == item.jurisdictionId);
                    });
                    if (intakeData.venueId != 0) {
                        _.forEach(selectedItemCopy, function (item) {
                            if (item.venueId == 0) { intakeDataList.push(item) };
                            item.venueId = (item.venueId != 0) ? item.venueId : intakeData.venueId;
                        })
                        venue_id = intakeData.venueId;
                    } else {
                        var index = 1;
                        while (index < selectedItemCopy.length) {
                            intakeDataNext = angular.copy(selectedItemCopy[index]);
                            if (intakeDataNext.venueId != 0) {
                                _.forEach(selectedItemCopy, function (item) {
                                    if (item.venueId == 0) { intakeDataList.push(item) };
                                    item.venueId = (item.venueId != 0) ? item.venueId : intakeDataNext.venueId;
                                })
                                venue_id = intakeDataNext.venueId;
                                intakeData = angular.copy(intakeDataNext);
                                break;
                            } else {
                                index++;
                                continue;
                            }
                        }
                    }

                    var check_3 = _.every(selectedItemCopy, function (item) {
                        return (intakeData.venueId == item.venueId);
                    });
					if (!check_3) {
                        _.forEach(intakeDataList, function (item) {
                            item.venueId = 0;
                        })
                    }
                    if (data.length > 0) {
                        var intakeData = angular.copy(data[0]);
                        var check_1 = _.every(data, function (item) {
                            return (intakeData.intakeCategory == item.intakeCategory);
                        });
                    }
                    if (!check || !check_2 || !check_3 || (angular.isDefined(check_1) && !check_1)) {
                        notificationService.error("Types, Subtypes, Categories and Jurisdiction/Venue must match in order to migrate multiple intakes.");
                        return;
                    }
                } else {
                    var intakeData = angular.copy(selectedItem[0]);
                }

                var intake_names = _.pluck(selectedItem, 'intakeName').toString();
                var intake_ids = _.pluck(selectedItem, 'intakeId').toString();
                //var isCustomFileNumber = utils.isNotEmptyVal(self.customFileNumber) ? self.customFileNumber : '';
                intakeData.intakeType = angular.copy(intakeData.intakeTypeCopy);
                intakeData.intakeSubType = angular.copy(intakeData.intakeSubTypeCopy);
                intakeData.intakeCategory = angular.copy(intakeData.intakeCategoryCopy);
                var defaultJurisdiction = utils.isNotEmptyVal(localStorage.getItem('firmJurisdiction')) ? JSON.parse(localStorage.getItem('firmJurisdiction')) : '';
                intakeData.jurisdictionId = (intakeData.jurisdictionId != 0) ? intakeData.jurisdictionId : utils.isNotEmptyVal(defaultJurisdiction) ? parseInt(defaultJurisdiction.id) : ''
                intakeData.venueId = (intakeData.venueId != 0) ? intakeData.venueId : '';

                var modalInstance = $modal.open({
                    templateUrl: 'app/intake/matter/matter-list/migration.html',
                    controller: 'IntakeMigrationCtrl as intakeMigCtrl',
                    windowClass: 'modalXLargeDialog',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        intakeName: function () {
                            return intake_names;
                        },
                        isCustomFileNumber: function () {
                            return intakeData.fileNumber;
                        },
                        intakeTypeName: function () {
                            return intakeData.intakeType;
                        },
                        intakeSubTypeName: function () {
                            return intakeData.intakeSubType;
                        },
                        intakeCategoryName: function () {
                            return intakeData.intakeCategory;
                        },
                        intakeId: function () {
                            return selectedItem.intakeId;
                        },
                        showIntakeName: function () {
                            return false;
                        },
                        selectedIntakes: function () {
                            return selectedItem;
                        },
                        selectedIntakeIds: function () {
                            return intake_ids;
                        },
                        fromOverView: function () {
                            return false;
                        },
                        jurisdictionId: function () {
                            return intakeData.jurisdictionId;
                        },
                        venueId: function () {
                            return venue_id;
                        }
                    }
                });

                modalInstance.result.then(function (resp) {
                    if (resp.sucess) {
                        getMatterList();
                        self.init();
                    } else {
                        self.init();
                    }

                }, function (error) {
                });
            }

            function getArrayByName(data) {
                var data_array = [];
                angular.forEach(data, function (k, v) { // convert object to array for type
                    data_array.push(k.name);
                });
                return data_array;

            }

            function getSubstatuses(status) {
                self.intakeInfo.substatus = null;
                var substatus = [];
                //get selected statuses substatus                
                if (utils.isEmptyVal(status)) {
                    substatus = [];
                    return;
                }
                var selectedStatusFromList = [];
                selectedStatusFromList.push(status);
                var statuses = angular.copy(self.viewModel.masterList.status);
                var selectedStatus = [];
                _.forEach(selectedStatusFromList, function (item) {
                    _.forEach(statuses, function (currentItem) {
                        if (item.id == currentItem.id) {
                            _.forEach(currentItem["substatus"], function (currentI) {
                                currentI.statusname = currentItem.name;
                                currentI.statusid = currentItem.id
                                selectedStatus.push(currentI);
                            })
                        }
                    })
                })
                substatus = selectedStatus;
                return substatus;
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
                        self.users = userListing;
                        defer.resolve();
                    }, function (error) {
                        self.users = [];
                        defer.resolve();
                    });
                return defer.promise;

            }

            /*functions which returns the matter 
              limit over effect message as per the type of user*/
            function setuserMsg() {
                var role = masterData.getUserRole();
                self.isSubsriber = (role.is_subscriber == "1") ? true : false;
                self.userMsg = (self.isSubsriber) ? 'You have reached the matter hosting limit for your current subscription.' : 'You have reached the matter hosting limit for your current subscription. Please contact the subscribing managing partner to increase the matter hosting capacity.';
            }

            function setBreadcrum() {
                routeManager.setBreadcrum([{ name: '...' }, { name: 'Intake List' }]);
            }


            function setSortAttribute(tab) {
                if (tab == 'Ongoing') {
                    self.sorts = [
                        { key: 1, name: "Lead Name Asc", value: 'intake_name' },
                        { key: 2, name: "Lead Name Desc", value: 'intake_name DESC' },
                        // { key: 3, name: "Last Updated Asc", value: 'created_date' },
                        { key: 4, name: "Last Updated", value: 'created_date DESC' }
                    ];
                }
                else if (tab == 'Migrated') {
                    self.sorts = [
                        { key: 1, name: "Lead Name Asc", value: 'intake_name' },
                        { key: 2, name: "Lead Name Desc", value: 'intake_name DESC' },
                        { key: 3, name: "Migrate Date Asc", value: 'migrated_date ASC' },
                        { key: 4, name: "Migrate Date Desc", value: 'migrated_date DESC' }
                    ];
                }
            }

            //initialization start
            self.init = function () {
                setBreadcrum();
                self.tags = [];
                setSortAttribute('Ongoing');
                var selectionModel = localStorage.getItem("intakeListSelectionModel");
                var viewModel = localStorage.getItem("intakeListViewModel");
                var displayStatuses = localStorage.getItem("intakeListAllDisplayStatuses");
                var filtertext = localStorage.getItem("intake_filtertext");
                var filterName = localStorage.getItem("matterActivTab");

                if (utils.isNotEmptyVal(selectionModel) || utils.isNotEmptyVal(viewModel) || utils.isNotEmptyVal(filtertext)) {
                    retainFilters(selectionModel, viewModel, displayStatuses);
                    self.viewModel.filters.filterText = filtertext;
                    //US#5160  for tab retaintion
                    if (utils.isNotEmptyVal(filterName)) {
                        self.applyFooterFilters(filterName);
                    }

                    //..end 

                } else {
                    initModels();
                    // initAllFilter();
                    applySetFilters();
                }
            };

            function retainFilters(selectionModel, viewModel, displayStatuses) {

                self.selectionModel = JSON.parse(selectionModel);
                if (!viewModel) {
                    initViewModel();
                } else {
                    self.viewModel = JSON.parse(viewModel);
                }

                if (utils.isEmptyObj(self.viewModel.masterList)) {
                    self.viewModel.masterList = angular.copy(self.masterDataCopy);
                }
                self.viewModel.masterList.user = [];
                self.viewModel.masterList.user = self.users;
                displayStatuses = JSON.parse(displayStatuses);

                intakeNotesDataService.getGlobalAllUsers()
                    .then(function (res) {
                        self.allUsers = res.allIntakeUsers;
                        self.tags = intakeListHelper
                            .createFilterTags(self.viewModel.filters, angular.copy(self.viewModel.masterList), displayStatuses, self.allUsers);

                        applySetFilters();
                    });

            }

            //filter by status specified on footer
            self.applyFooterFilters = function (filterName, clickedTab) {
                self.pageNumber = 1;
                self.viewModel.filters = {
                    filterText: '',
                    useExternalFilter: true,
                    sortby: 4
                };
                var filtertext = self.viewModel.filters.filterText;
                //localStorage.setItem("intake_filtertext", filtertext);
                localStorage.setItem("current_tab", filterName);

                if (clickedTab != 'clickedTab') {
                    filterName = localStorage.getItem("matterActivTab");
                    (filterName) ? filterName = filterName : filterName = 'Ongoing';
                } else {
                    self.selectionModel.statusName = filterName;
                    self.viewModel.matters = [];
                }

                switch (filterName) {
                    case 'Ongoing':
                        setBreadcrum();
                        localStorage.setItem("matterActivTab", filterName);
                        self.viewModel.filters.is_migrated = 0;
                        setSortAttribute('Ongoing');
                        break;
                    case 'Migrated':
                        setBreadcrum();
                        localStorage.setItem("matterActivTab", filterName);
                        self.viewModel.filters.is_migrated = 1;
                        setSortAttribute('Migrated');
                        break;
                }
                self.clxGridOptions = {
                    headers: intakeListHelper.getGridHeaders(self.selectionModel.statusName == 'Ongoing'),
                    selectedItems: []
                };
                getMatterList();
                $("#matterlistbody").scrollTop(0);
            }

            function applySetFilters() {
                getData();

                //display object for managing the display
                self.display = {
                    filtered: true,
                    matterListReceived: false,
                    matterSelected: {}
                };

                self.clxGridOptions = {
                    headers: intakeListHelper.getGridHeaders(self.selectionModel.statusName == 'Ongoing'),
                    selectedItems: []
                };
                self.addIntake = false;
                // intakeFactory.getAllUsers()
                //     .then(function (res) {
                //         self.allUsers = res.data;
                //     });
            }

            function filterRetain() {
                var filtertext = self.viewModel.filters.filterText;
                localStorage.setItem("intake_filtertext", filtertext);
            }

            function persistData() {
                //self.viewModel.filters.filterText = "";
                localStorage.setItem("intakeListSelectionModel", JSON.stringify(self.selectionModel));
                localStorage.setItem("intakeListViewModel", JSON.stringify(self.viewModel));
                localStorage.setItem("intakeListAllDisplayStatuses", JSON.stringify(allDisplayStatuses));
                var filtertext = localStorage.getItem("intake_filtertext");
                if (utils.isNotEmptyVal(filtertext)) {
                    self.viewModel.filters.filterText = filtertext;
                }

            }

            function initAllFilter() {
                var allFilter = { desc: 'All', id: 'All' };
                self.selectionModel.statusWise = allFilter;
            };

            function initModels() {
                initViewModel();
                initSelectionModel();
            };

            function initViewModel() {
                self.viewModel = {
                    masterList: {},
                    statusWiseCounts: [],
                    statusWiseCountsAll: []
                };
                self.viewModel.page = "GRIDVIEW";
                self.viewModel.matters = [];
                self.viewModel.filters = {
                    filterText: '',
                    useExternalFilter: true,
                    sortby: 4
                };
            };

            function initSelectionModel() {
                self.selectionModel = {
                    statusWise: {},
                    statusName: "Ongoing",
                    multiFilters: {
                        intake_status_id: [],
                        intake_sub_status_id: [],
                        intake_type_id: [],
                        intake_sub_type_id: [],
                        intake_category_id: [],
                        user_id: []
                    }
                };
            }

            function getData() {
                getStatusWiseCounts();
            }
            //initialization end

            //display manager start
            self.highlightSelectedStatus = function (id) {
                if (angular.isUndefined(id)) {
                    return false;
                }

                if (angular.isUndefined(self.viewModel.filters.intake_status_id)) {
                    return (self.selectionModel.statusWise.id === id);
                }

                if (self.viewModel.filters.intake_status_id instanceof Array) {
                    if (self.viewModel.filters.intake_status_id.length === 0) {
                        initAllFilter();
                        return (self.selectionModel.statusWise.id === id);
                    }

                    if (id != "All") {
                        return (self.viewModel.filters.intake_status_id.indexOf(id) > -1 || self.viewModel.filters.intake_status_id.indexOf(parseInt(id)) > -1);
                    } else {
                        return self.viewModel.filters.intake_status_id.indexOf(id) > -1;
                    }

                }
                return self.viewModel.filters.intake_status_id.split(',').indexOf(id) > -1;

            }

            self.isMatterSelected = function (matter) {
                self.display.matterSelected[matter.intakeId] =
                    intakeListHelper.isMatterSelected(self.clxGridOptions.selectedItems, matter);
                return self.display.matterSelected[matter.intakeId];
            }
            //display manager end

            //checkbox select state manager start
            self.selectAllMatters = function (selected) {
                if (selected) {
                    self.clxGridOptions.selectedItems = angular.copy(matterList);
                } else {
                    self.clxGridOptions.selectedItems = [];
                }
            }

            function allMatterSelected() {
                if (utils.isEmptyVal(self.clxGridOptions)) {
                    return false;
                }
                if (!matterList) {
                    return false;
                } else {
                    return self.clxGridOptions.selectedItems.length === matterList.length;
                }
            }
            //checkbox select state manager end

            //select filters in the pop up
            self.toggleFilterPage = function () {
                var filtercopy = angular.copy(self.selectionModel.multiFilters);

                $timeout(function () {
                    var scrollPos = $(window).scrollTop();
                    var modalInstance = $modal.open({
                        templateUrl: "app/intake/matter/matter-list/partials/new_filters.html",
                        controller: "IntakeFilterDialogCtrl",
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            params: function () {
                                return {
                                    masterData: angular.copy(self.viewModel.masterList),
                                    filters: filtercopy,
                                    users: self.users
                                };
                            }
                        }
                    });
                    modalInstance.result.then(function (selectedItem) {
                        var selectedItemCopy = angular.copy(selectedItem);
                        self.selectionModel.multiFilters.intake_status_id = _.pluck(selectedItemCopy.intake_status_id, "id");
                        self.selectionModel.multiFilters.intake_sub_status_id = _.pluck(selectedItemCopy.intake_sub_status_id, "id");
                        self.selectionModel.multiFilters.intake_type_id = _.pluck(selectedItemCopy.intake_type_id, "id");
                        self.selectionModel.multiFilters.intake_sub_type_id = _.pluck(selectedItemCopy.intake_sub_type_id, "id");
                        self.selectionModel.multiFilters.intake_category_id = _.pluck(selectedItemCopy.intake_category_id, "id");
                        self.selectionModel.multiFilters.user_id = selectedItemCopy.user_id;

                        //self.selectionModel.multiFilters = selectedItem;

                        $(window).scrollTop(scrollPos - 1);
                        self.applyMultiSelectFilter();
                        self.showPager = true;
                    }, function () { });
                }, 10);
            };

            self.applyFilterLazyLoading = function () {
                getNextMatterList();
            };

            self.applyMultiSelectFilter = function (tagcancelled) {
                var postArray = ['intake_status_id', 'intake_sub_status_id', 'intake_type_id', 'intake_sub_type_id', 'intake_category_id', 'user_id'];
                var valKey = ['intake_status_id', 'intake_sub_status_id', 'intake_type_id', 'intake_sub_type_id', 'intake_category_id', 'user_id'];
                _.each(postArray, function (val, index) {
                    var data = self.selectionModel.multiFilters[valKey[index]];
                    if (!_.isEmpty(data)) {
                        self.viewModel.filters[val] = data;
                    } else {
                        self.viewModel.filters[val] = [];
                    }
                });
                if (tagcancelled) {
                    if (utils.isNotEmptyVal(self.viewModel.filters.substatusFilter)) {
                        var statusArray = self.viewModel.filters.statusFilter.split(',');
                        var statusFromMasterList = [];
                        _.forEach(statusArray, function (item) {
                            _.forEach(self.viewModel.masterList.statuses, function (currentItem) {
                                if (currentItem.id == item) {
                                    statusFromMasterList.push(currentItem);
                                }
                            })
                        })

                        var selectedSubStatus = [];
                        _.forEach(statusFromMasterList, function (currentItem) {
                            _.forEach(currentItem["sub-status"], function (currentI) {
                                selectedSubStatus.push(currentI.id);
                            })
                        })

                        var getSubStatus = _.intersection(selectedSubStatus, self.viewModel.filters.substatusFilter.split(","));
                        self.viewModel.filters.substatusFilter = getSubStatus.toString();
                    } else {
                        self.viewModel.filters.substatusFilter = [];
                    }
                }

                self.tags = intakeListHelper
                    .createFilterTags(self.viewModel.filters, angular.copy(self.viewModel.masterList), allDisplayStatuses, self.allUsers);
                self.pageNumber = 1;
                self.showPager = true;
                getMatterList();
                self.viewModel.page = "GRIDVIEW";
            };

            self.tagCancelled = function (cancelled) {
                self.pageNumber = 1;
                var scrollPos = $(window).scrollTop();
                switch (cancelled.type) {
                    case 'status':
                        self.selectionModel.multiFilters.intake_status_id = _.reject(self.selectionModel.multiFilters.intake_status_id, function (num) { return num == cancelled.id; });

                        var selectedSubStatus = [];
                        _.forEach(self.viewModel.masterList.status, function (item) {
                            if (item.id == cancelled.id) {
                                _.forEach(item["substatus"], function (currentI) {
                                    selectedSubStatus.push(currentI.id);
                                })
                            }
                        });
                        _.forEach(selectedSubStatus, function (item) {
                            self.selectionModel.multiFilters.intake_sub_status_id = _.reject(self.selectionModel.multiFilters.intake_sub_status_id, function (num) { return num == item; });
                        });

                        break;
                    case 'category':
                        self.selectionModel.multiFilters.intake_category_id = _.reject(self.selectionModel.multiFilters.intake_category_id, function (num) { return num == cancelled.id; });
                        break;
                    case 'type':
                        self.selectionModel.multiFilters.intake_type_id = _.reject(self.selectionModel.multiFilters.intake_type_id, function (num) { return num == cancelled.id; });

                        var selectedSubType = [];
                        _.forEach(self.viewModel.masterList.type, function (item) {
                            if (item.id == cancelled.id) {
                                _.forEach(item["subtype"], function (currentI) {
                                    selectedSubType.push(currentI.id);
                                })
                            }
                        });
                        _.forEach(selectedSubType, function (item) {
                            self.selectionModel.multiFilters.intake_sub_type_id = _.reject(self.selectionModel.multiFilters.intake_sub_type_id, function (num) { return num == item; });
                        });
                        break;
                    case 'subtype':
                        self.selectionModel.multiFilters.intake_sub_type_id = _.reject(self.selectionModel.multiFilters.intake_sub_type_id, function (num) { return num == cancelled.id; });
                        break;
                    case 'substatus':
                        self.selectionModel.multiFilters.intake_sub_status_id = _.reject(self.selectionModel.multiFilters.intake_sub_status_id, function (num) { return num == cancelled.id; });
                        break;
                    case 'assignedto':
                        self.selectionModel.multiFilters.user_id = _.reject(self.selectionModel.multiFilters.user_id, function (num) { return num == cancelled.id; });
                        break;

                }
                //reassign the new filters
                $(window).scrollTop(scrollPos - 1);
                self.showPager = true;
                self.applyMultiSelectFilter("tagcancelled");

            }

            //sort by filters
            self.applySortByFilter = function (sortBy) {
                self.viewModel.filters.sortby = sortBy;
                self.showPager = true;
                self.pageNumber = 1;
                getMatterList();
            }

            //get sort by label
            self.getSortByLabel = function (sortBy) {
                if (utils.isEmptyVal(sortBy)) {
                    return " - ";
                }

                var selSort = _.find(self.sorts, function (sort) {
                    return sort.key == sortBy;
                });
                return selSort.name;
            }

            //filter by users ('my matters','all matters')
            self.filterByUser = function (param) {
                self.viewModel.matters = []
                self.selectionModel.allMatter = param;
                getStatusWiseCounts();
                self.showPager = true;
                self.pageNumber = 1;
                $("#matterlistbody").scrollTop(0);
            };

            //filter by status specified at the top(with counts All,Arbitration etc...)
            self.applyStatusFilter = function (filter) {
                self.showPager = true;
                self.pageNumber = 1;
                self.selectionModel.statusName = 'Ongoing';
                self.viewModel.matters = [];
                applyFilterStatusWiseCount(filter);
            }

            //statuswise filters
            function applyFilterStatusWiseCount(item) {
                self.selectionModel.statusWise = item;
                //two different models are used for filters
                //one is viewModel.filters and other is selectionModel.multiFilters
                //to keep both of them is sync
                //refresh multiFilters arrays for statuses and sub statuses
                self.selectionModel.multiFilters.status = [item];
                if (utils.isNotEmptyVal(self.selectionModel.multiFilters.substatus)) {
                    var sub_status = [];
                    _.forEach(self.selectionModel.multiFilters.substatus, function (currentItem) {
                        if (item.id == currentItem.statusid) {
                            sub_status.push(currentItem);
                        }
                    })
                    self.selectionModel.multiFilters.substatus = sub_status;
                } else {
                    self.selectionModel.multiFilters.substatus = [];
                }

                self.viewModel.filters.intake_status_id = self.selectionModel.statusWise.id != "All" ? [self.selectionModel.statusWise.id] : [];
                self.selectionModel.multiFilters.intake_status_id = self.viewModel.filters.intake_status_id;
                self.tags = intakeListHelper.createFilterTags(self.viewModel.filters, angular.copy(self.viewModel.masterList), allDisplayStatuses, self.allUsers);

                getMatterList();
            };

            function getMatterList(getAll) {
                self.viewModel.matters = [];
                intakeListHelper.setStatuswiseFilter(self.viewModel.filters, self.selectionModel.statusWise.id, self.selectionModel.allMatter);
                setMultiSelectFilter();
                self.viewModel.filters.pageNumber = getAll ? 1 : self.pageNumber;
                var filterObj = intakeListHelper.getFiltersObj(self.viewModel.filters, getAll, angular.copy(self.viewModel.masterList), self.selectionModel.allMatter);

                var promise = intakeFactory.getMatterList(filterObj);
                promise.then(function (data) {

                    self.totalIntake = data.count;
                    processData(data);
                    self.display.matterListReceived = true;
                    matterList = data.intakeData ? data.intakeData : []; //store all matters locally, this list will be used while client side filtering
                    self.viewModel.matters = data.intakeData ? data.intakeData : [];
                    // self.showPager = self.viewModel.matters.length < self.totalIntake;

                    if (data.intakeData && data.intakeData.length < 250) {
                        self.showPager = false;
                    } else {
                        self.showPager = true;
                    }
                    self.totalmattersUsed = (utils.isNotEmptyVal(data.activeIntakeCount)) ? parseInt(data.activeIntakeCount) : 0;
                    self.subscribematterLimit = (utils.isNotEmptyVal(data.maxIntakeCount)) ? parseInt(data.maxIntakeCount) : 0;

                    //deselect all matters
                    self.clxGridOptions.selectAll = false;
                    self.clxGridOptions.selectedItems = [];
                    delete self.viewModel.filters.lastMatterId;

                    persistData();
                    // getMatterCount(filterObj);
                }, function (reason) { });
            };

            function processData(data) {
                _.forEach(data.intakeData, function (item) {
                    item.migrationDate = (utils.isEmptyVal(item.migrationDate)) ? "-" : moment.unix(item.migrationDate).utc().format('MM/DD/YYYY');
                    item.createdDate = (utils.isEmptyVal(item.createdDate)) ? "-" : moment.unix(item.createdDate).format('MM/DD/YYYY');
                    var category = _.findWhere(self.viewModel.masterList.category, { id: item.intakeCategory.intakeCategoryId });
                    item.intakeCategoryCopy = angular.copy(item.intakeCategory);
                    item.intakeCategory = category ? category.name : "";
                    var status = _.findWhere(self.viewModel.masterList.status, { id: item.intakeStatus.intakeStatusId });
                    item.status_name = status ? status.name : "";
                    var subStatus = status ? _.findWhere(status.substatus, { id: item.intakeSubStatus.intakeSubStatusId }) : null;
                    item.sub_status_name = subStatus ? subStatus.name : "";
                    var type = _.findWhere(self.viewModel.masterList.type, { id: item.intakeType.intakeTypeId });
                    var subType = type ? _.findWhere(type.subtype, { id: item.intakeSubType.intakeSubTypeId }) : null;
                    item.intakeTypeCopy = angular.copy(item.intakeType);
                    item.intakeSubTypeCopy = angular.copy(item.intakeSubType);
                    item.intakeType = type ? type.name : "";
                    item.intakeSubType = subType ? subType.name : "";
                    item.assignedUserNames = _.pluck(item.assignedUser, 'userName').join(",");
                });
                utils.replaceNullByEmptyStringArray(data.intakeData);
            }

            self.getAllMatterList = function () {
                self.showPager = false;
                getMatterList(1000);
            }


            //ensure to set other filter values while fetching next data
            function setMultiSelectFilter() {
                var postArray = ['intake_status_id', 'intake_sub_status_id', 'intake_type_id', 'intake_sub_type_id', 'intake_category_id', 'user_id'];
                var valKey = ['intake_status_id', 'intake_sub_status_id', 'intake_type_id', 'intake_sub_type_id', 'intake_category_id', 'user_id'];
                _.each(postArray, function (val, index) {
                    var data = self.selectionModel.multiFilters[valKey[index]];
                    if (utils.isNotEmptyVal(data)) {
                        self.viewModel.filters[val] = data;
                    } else {
                        //if (utils.isEmptyVal(self.viewModel.filters[val])) {
                        self.viewModel.filters[val] = [];
                        //}
                    }
                });

            }

            function getNextMatterList() {
                intakeListHelper.setStatuswiseFilter(self.viewModel.filters, self.selectionModel.statusWise.id, self.selectionModel.allMatter);
                setMultiSelectFilter();
                self.pageNumber = self.pageNumber + 1;
                self.viewModel.filters.pageNumber = self.pageNumber;
                var filterObj = intakeListHelper.getFiltersObj(self.viewModel.filters, '', angular.copy(self.viewModel.masterList), self.selectionModel.allMatter);
                var promesa = intakeFactory.getMatterList(filterObj, self.selectionModel.allMatter);
                promesa.then(function (data) {
                    processData(data);
                    matterList = matterList.concat(data.intakeData);
                    self.viewModel.matters = self.viewModel.matters.concat(data.intakeData);
                    // self.showPager = self.viewModel.matters.length < self.totalIntake;
                    if (self.totalIntake && self.totalIntake > 0) {
                        if (self.totalIntake < 250) {
                            self.showPager = false;
                        }
                    } else {
                        self.showPager = false;
                    }
                }, function (reason) {

                });
            };

            self.deleteMatters = function (selectedData, filterdMatter) {
                if (utils.isNotEmptyVal(self.viewModel.filters.filterText) && allMatterSelected()) {
                    selectedData = filterdMatter;
                }

                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Delete',
                    headerText: 'Delete ?',
                    bodyText: 'Are you sure you want to delete ?'
                };

                //confirm before delete
                modalService.showModal({}, modalOptions).then(function () {
                    var intakeIds = _.pluck(selectedData, 'intakeId');
                    var promesa = intakeFactory.deleteIntakeInfo(intakeIds);
                    promesa.then(function (data) {
                        notificationService.success('Intake deleted successfully');
                        self.pageNumber = 1;
                        self.showPager = true;
                        getStatusWiseCounts();
                    }, function (error) {
                        alert("unable to delete")
                    });
                });
            };

            self.downloadMatters = function () {
                delete self.viewModel.filters.substatusFilter;
                delete self.viewModel.filters.useExternalFilter;
                // delete self.viewModel.filters.filterText;
                // intakeListHelper.setStatuswiseFilter(self.viewModel.filters, self.selectionModel.statusWise.id);
                // setMultiSelectFilter();
                self.viewModel.filters.pageNumber = 1;
                var tz = utils.getTimezone();
                var filterObj = intakeListHelper.getFiltersObj(self.viewModel.filters, 10000, angular.copy(self.viewModel.masterList), self.selectionModel.allMatter);
                filterObj.timeZone = moment.tz.guess();
                // var allMatter = self.selectionModel.allMatter;
                intakeFactory.downloadMatters(filterObj)
                    .then(function (response) {
                        var filename = "Intake_list";
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
                        }
                    });
            };

            self.print = function () {
                intakeListHelper.setStatuswiseFilter(self.viewModel.filters, self.selectionModel.statusWise.id, self.selectionModel.allMatter);
                setMultiSelectFilter();
                self.viewModel.filters.pageNumber = 1;
                var filterObj = intakeListHelper.getFiltersObj(self.viewModel.filters, 10000, angular.copy(self.viewModel.masterList), self.selectionModel.allMatter);

                intakeFactory.getMatterList(filterObj, self.selectionModel.allMatter)
                    .then(function (data) {
                        var filterDisplayObj = setFilterDisplayObj();
                        intakeFactory.printMatters(data, filterDisplayObj, self.selectionModel.statusName);
                    });
            };

            // set filter obj to be displayed on print page
            function setFilterDisplayObj() {
                var postArray = ['intake_status_id', 'intake_sub_status_id', 'intake_type_id', 'intake_sub_type_id', 'intake_category_id', 'user_id'];
                var valKey = ['status', 'subStatus', 'type', 'subType', 'category', 'user'];
                var filterObj = {};
                _.each(postArray, function (val, index) {
                    var array = angular.copy(self.viewModel.masterList[valKey[index]]);

                    var appliedFilters = [];
                    //iterate over current selected filters

                    var filterString = self.viewModel.filters[val].toString();
                    _.forEach(filterString.split(','), function (id) {
                        if (utils.isEmptyString(id)) { return; } //if filter id is all/stalled push as is
                        // find object from array having the current id
                        var appliedFilter = _.find(array, function (item) {
                            return item.id == id;
                        });

                        if (val == "user_id") {
                            appliedFilter = _.find(array, function (item) {
                                return item.userId == id;
                            });
                            appliedFilters.push(appliedFilter.fullName);
                        } else {
                            if (appliedFilter && utils.isEmptyVal(appliedFilter.name)) {
                                appliedFilter.name = "{Blank}";
                            }
                            if (appliedFilter) {
                                appliedFilters.push(appliedFilter.name);
                            }
                        }

                    });
                    filterObj[val] = {};
                    filterObj[val].name = valKey[index].toUpperCase();
                    if (val == "user_id") {
                        filterObj[val].name = "ASSIGNED TO";
                    }
                    filterObj[val].data = appliedFilters;
                });
                filterObj.orderby = {
                    name: "ORDERED BY",
                    data: [self.getSortByLabel(self.viewModel.filters.sortby)]
                };

                return filterObj;
            }

            function getStatusWiseCounts() {

                if (angular.isUndefined(self.selectionModel.allMatter)) {
                    self.selectionModel.allMatter = 1;
                }

                var promesa = intakeFactory.getStatusWiseCounts(self.selectionModel.allMatter);
                promesa.then(function (data) {
                    var newdata = {};
                    var all_data = {};
                    var stalled_data = {};

                    angular.forEach(data, function (value, key) {
                        switch (key) {
                            case 'All':
                                all_data[key] = value;

                                break;
                            default:
                                newdata[key] = value;
                                break;
                        }
                    });
                    data = newdata;
                    self.viewModel.statusWiseCounts = data;
                    self.viewModel.statusWiseCountsAll = all_data;
                    if (utils.isEmptyObj(self.viewModel.masterList)) {
                        self.viewModel.masterList = angular.copy(self.masterDataCopy);
                    }
                    self.viewModel.masterList.user = [];
                    self.viewModel.masterList.user = self.users;
                    // self.viewModel.statusWiseCountsStalled = stalled_data;
                    angular.extend(allDisplayStatuses, data, all_data);

                    getMatterList();
                }, function (reason) {

                });
            };

            self.notSorted = function (obj) {
                if (!obj) {
                    return [];
                } else {
                    var keys = Object.keys(obj);
                    return _.filter(keys, function (key) { return utils.isNotEmptyString(key); })
                }
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
                        if (!self.viewModel) {
                            self.viewModel = {};
                        }
                        self.viewModel.masterList = data;
                        self.masterDataCopy = angular.copy(data);
                        defer.resolve();
                    }, function (reason) {
                        if (self.viewModel) {
                            self.viewModel.masterList = {};
                            self.masterDataCopy = {};
                        }
                        defer.resolve();
                    });
                return defer.promise;
            }

            /*Modal popup for Archived matter*/
            self.showArchivePopup = function (selectedData, filterdMatter) {
                if (utils.isNotEmptyVal(self.viewModel.filters.filterText)) {
                    selectedData = filterdMatter;
                }
                var selectedMatters = _.pluck(selectedData, 'matter_id');
                var modalInstance = $modal.open({
                    templateUrl: "app/intake/matter/matter-list/partials/archived-popup.html",
                    controller: "ArchivePopupCtrl",
                    windowClass: 'medicalIndoDialog',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        matterstoArchive: function () {
                            return selectedMatters;
                        }
                    }

                });

                modalInstance.result.then(function () {
                    getStatusWiseCounts(); //update matter counts
                    /*Initialise after archival*/
                    self.init();
                }, function () { });

            }

            /*pop up view for add/edit matter */
            self.openAddEditmatterview = function (intakeId) {
                var matterObj = { intakeId: intakeId };
                if (intakeId) {
                    self.intakeId = intakeId;
                    self.isEdit = true;
                    self.intakeInfo = _.find(self.viewModel.matters, function (intakeRecord) { return intakeRecord.intakeId == intakeId });

                    self.intakeInfo.statusname = self.intakeInfo.intakeStatus ? _.find(self.viewModel.masterList.status, function (status) { return status.id === self.intakeInfo.intakeStatus.intakeStatusId }) : null;

                    if (self.intakeInfo.statusname) {
                        self.substatus = self.intakeInfo.statusname.substatus;
                        self.intakeInfo.substatus = self.intakeInfo.intakeSubStatus ? _.findWhere(self.intakeInfo.statusname.substatus, { id: self.intakeInfo.intakeSubStatus.intakeSubStatusId }) : null;
                    }
                    _.forEach(self.intakeInfo.assignedUser, function (item) {
                        item.userId = item.userId.toString();
                    });
                    if (utils.isNotEmptyVal(self.intakeInfo.leadSource)) {
                        var leadData = _.findWhere(self.typeList, { name: self.intakeInfo.leadSource });
                        self.intakeInfo.leadSource = leadData;
                    }

                    self.intakeInfo.user_id = self.intakeInfo.assignedUser;
                    self.intakeInfo.placeOfIncident = self.intakeInfo.accidentLocation;
                    self.intakeInfo.dateOfIncident = self.intakeInfo.accidentDate ? moment.unix(self.intakeInfo.accidentDate).utc().format("MM/DD/YYYY") : null;
                    self.intakeInfo.description = self.intakeInfo.description;
                    self.intakeInfo.incidentservices = utils.isNotEmptyVal(self.intakeInfo.otherInfo) ? JSON.parse(self.intakeInfo.otherInfo) : self.intakeInfo.otherInfo;
                } else {
                    self.otherDetailsID = null;
                    self.isEdit = false;
                    self.intakeInfo = {
                        importantDates: []
                    };
                    self.intakeInfo.statusname = _.find(self.viewModel.masterList.status, function (status) { return status.name === "New Leads" });
                    self.substatus = getSubstatuses(self.intakeInfo.statusname);
                }
                var category = _.findWhere(self.viewModel.masterList.category, { name: self.intakeInfo.intakeCategory });
                var type = _.findWhere(self.viewModel.masterList.type, { name: self.intakeInfo.intakeType });
                var subType = type ? _.findWhere(type.subtype, { name: self.intakeInfo.intakeSubType }) : null;
                self.intakeInfo.category = category;
                self.intakeInfo.type = type;
                self.intakeInfo.subtype = subType;
                var modalInstance = $modal.open({
                    templateUrl: 'app/intake/matter/add-matter/add-matter.html',
                    controller: 'AddIntakeCtrl as addCtrl',
                    windowClass: 'modalXLargeDialog',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        modalParams: function () {
                            return matterObj;
                        },
                        masterDataList: function () {
                            return angular.copy(self.viewModel.masterList);
                        },
                        intakeInfo: function () {
                            return angular.copy(self.intakeInfo);
                        },
                        sub_status: function () {
                            return self.substatus;
                        },
                        users: function () {
                            return self.users;
                        },
                        fromOverViewTab: function () {
                            return false;
                        }
                    },
                });

                modalInstance.result.then(function (resp) {
                    if (resp == "cancel") {
                        self.init();
                        self.pageNumber = 1;
                        self.showPager = true;
                    } else {

                    }
                }, function (error) {

                });

            }

        }
    ]);
})();


(function () {
    angular.module('intake.matter')
        .factory('intakeListHelper', intakeListHelper);

    function intakeListHelper() {
        return {
            setModifiedDisplayDate: setModifiedDisplayDate,
            getGridHeaders: getGridHeaders,
            isMatterSelected: isMatterSelected,
            getFiltersObj: getFiltersObj,
            setStatuswiseFilter: setStatuswiseFilter,
            createFilterTags: createFilterTags,
            setData: setData,
            setPlaintiffInfo: setPlaintiffInfo,
            setMedicalInfo: setMedicalInfo,
            setInsuranceInfo: setInsuranceInfo,
            setAutoMobileInsuranceInfo: setAutoMobileInsuranceInfo,
            setOtherDriverInsuranceInfo: setOtherDriverInsuranceInfo,
            setOtherDetails: setOtherDetails,
            setWitnessInfo: setWitnessInfo,
            getClxBtnGroupArray: getClxBtnGroupArray,
            processContactObj: processContactObj
        }

        function getClxBtnGroupArray(array) {
            array = array.map(function (item) {
                return {
                    value: item.id,
                    label: item.name
                };
            });
            var values = _.pluck(array, 'label');
            var index = values.indexOf("");
            //move blank to top
            utils.moveArrayElement(array, index, 0);
            return array;
        }

        function processContactObj(contact) {
            contact.contact_id = angular.isDefined(contact.contactId) ? contact.contactId.toString() : contact.contactid.toString();

            contact.firstname = angular.isDefined(contact.firstName) ? contact.firstName : angular.isDefined(contact.firstname) ? contact.firstname : angular.isDefined(contact.first_name) ? contact.first_name : '';
            contact.middlename = angular.isDefined(contact.middleName) ? contact.middleName : angular.isDefined(contact.middlename) ? contact.middlename : angular.isDefined(contact.middle_name) ? contact.middle_name : '';
            contact.lastname = angular.isDefined(contact.lastName) ? contact.lastName : angular.isDefined(contact.lastname) ? contact.lastname : angular.isDefined(contact.last_name) ? contact.last_name : '';
            contact.name = contact.firstname + ' ' + contact.lastname;
            return contact;
        }

        function setWitnessInfo(witnessDataData, intakeId, index) {
            var intake_witness = angular.copy(witnessDataData);
            var plaintiffId = intake_witness.intakePlaintiffId;
            var witnessRecord = [];

            if (utils.isNotEmptyVal(intake_witness.witness.witnessNameList)) {
                _.forEach(intake_witness.witness.witnessNameList, function (currentItem) {
                    var record = {};
                    if (utils.isNotEmptyVal(currentItem.name)) {
                        record.contact = {};
                        record.contact = { "contactId": currentItem.name.contact_id };
                        record.intakePlaintiffId = plaintiffId;
                        if (currentItem.intakeWitnessid) {
                            record.intakeWitnessid = currentItem.intakeWitnessid;
                        }
                        witnessRecord.push(record);
                    } else if (currentItem.intakeWitnessid) {
                        witnessRecord.push({ contact: {}, intakePlaintiffId: plaintiffId, intakeWitnessid: currentItem.intakeWitnessid, isDeleted: 1 });
                    }
                })

            } else {
                witnessRecord.push({ contact: {}, intakePlaintiffId: plaintiffId });
            }
            return witnessRecord;
        }

        function setData(intakeList, name) {
            var intake = {
                intakeStatus: {},
                intakeSubStatus: {},
                intakeType: {},
                intakeSubType: {},
                intakeCategory: {}
            };
            intake.intakeId = utils.isNotEmptyVal(intakeList.intakeId) ? intakeList.intakeId : null;
            intake.intakeName = utils.isNotEmptyVal(name) ? name : '';
            intake.summary = utils.isNotEmptyVal(intakeList.summary) ? intakeList.summary : '';
            intake.campaign = utils.isNotEmptyVal(intakeList.campaign) ? intakeList.campaign : '';
            intake.intakeAmount = utils.isNotEmptyVal(intakeList.intakeAmount) ? parseFloat(intakeList.intakeAmount) : null;
            intake.intakeStatus.intakeStatusId = utils.isNotEmptyVal(intakeList.statusname) ? intakeList.statusname.id : 5;
            intake.intakeSubStatus.intakeSubStatusId = utils.isNotEmptyVal(intakeList.substatus) ? intakeList.substatus.id : '';
            intake.intakeType.intakeTypeId = utils.isNotEmptyVal(intakeList.type) ? intakeList.type.id : '';
            intake.intakeSubType.intakeSubTypeId = utils.isNotEmptyVal(intakeList.subtype) ? intakeList.subtype.id : '';
            intake.intakeCategory.intakeCategoryId = utils.isNotEmptyVal(intakeList.category) ? intakeList.category.id : 13;
            intake.leadSource = intakeList.leadSource ? intakeList.leadSource.name : "";
            if (intakeList.jurisdictionId != 0) {
                intake.jurisdictionId = intakeList.jurisdictionId;
            } else {
                var defaultJurisdiction = utils.isNotEmptyVal(localStorage.getItem('firmJurisdiction')) ? JSON.parse(localStorage.getItem('firmJurisdiction')) : '';
                vm.intake.jurisdictionId = utils.isNotEmptyVal(defaultJurisdiction) ? parseInt(defaultJurisdiction.id) : '';
            }
            if (intakeList.venueId != 0) {
                intake.venueId = intakeList.venueId;
            }
            // if (utils.isNotEmptyVal(intakeList.leadSource)) {
            //     intake.leadSource.contactId = intakeList.leadSource.contactid;
            // }
            intake.assignedUser = [];
            if (utils.isNotEmptyVal(intakeList.user_id)) {
                _.forEach(intakeList.user_id, function (item) {
                    intake.assignedUser.push({ "userId": item.userId });
                });
            }

            intake.accidentLocation = utils.isNotEmptyVal(intakeList.placeOfIncident) ? intakeList.placeOfIncident : '';
            intake.leadSourceDescription = utils.isNotEmptyVal(intakeList.leadSourceDescription) ? intakeList.leadSourceDescription : '';
            if (!(angular.isUndefined(intakeList.dateOfIncident))) {
                intake.accidentDate = utils.isEmptyVal(intakeList.dateOfIncident) ? "" : utils.getUTCTimeStamp(intakeList.dateOfIncident);
            }
            intake.description = utils.isNotEmptyVal(intakeList.description) ? intakeList.description : '';
            intake.otherInfo = utils.isEmptyVal(intakeList.incidentservices) ? '' : JSON.stringify(intakeList.incidentservices);

            intake.referredTo = (utils.isNotEmptyVal(intakeList.referredTo) && utils.isNotEmptyVal(intakeList.referredTo.contact_id)) ? { "contactId": intakeList.referredTo.contact_id } : null;
            intake.referredBy = (utils.isNotEmptyVal(intakeList.referredBy) && utils.isNotEmptyVal(intakeList.referredBy.contact_id)) ? { "contactId": intakeList.referredBy.contact_id } : null;
            intake.importantDates = angular.copy(intakeList.importantDates);
            intake.dateOfIntake = intakeList.dateOfIntake && utils.isNotEmptyVal(intakeList.dateOfIntake) ? utils.getUTCTimeStamp(intakeList.dateOfIntake) : null;
            _setCriticalDates(intake);


            return intake;
        }

        function _setCriticalDates(info) {
            _.forEach(info.importantDates, function (date, i) {
                _setUTCDate(info, i);
            });
        }

        function _setUTCDate(info, i) {
            var date = info.importantDates[i];
            var impDates = angular.copy(info.importantDates[i]);
            var startTimestamp = utils.isEmptyVal(date.start) ? date.start_date : date.start;
            var date = moment.unix(startTimestamp).format('MM DD YYYY');
            date = moment(date, 'MM DD YYYY');
            date = new Date(date.toDate());

            //Bug#11236
            var endTimeStamp = utils.isEmptyVal(impDates.end) ? impDates.end_date : impDates.end;
            var endDateTime = moment.unix(endTimeStamp).format('MM DD YYYY');
            endDateTime = moment(endDateTime, 'MM DD YYYY');
            endDateTime = new Date(endDateTime.toDate());

            var startDate = date;
            var endDate = new Date(Date.UTC(endDateTime.getFullYear(), endDateTime.getMonth(), endDateTime.getDate(), 23, 59, 59, 0));

            //info.importantDates[i].start = moment(startDate.getTime()).unix();
            //info.importantDates[i].enddate = moment(endDate.getTime()).unix();
            info.importantDates[i].start = info.importantDates[i].start_date;

            if (info.importantDates[i].reminder_days) {
                if (_.isArray(info.importantDates[i].reminder_days)) {
                    info.importantDates[i].reminder_days = info.importantDates[i].reminder_days.toString();
                }

            } else {
                info.importantDates[i].reminder_days = "";
            }

            if (info.importantDates[i].sms_reminder_days) {
                if (_.isArray(info.importantDates[i].sms_reminder_days)) {
                    info.importantDates[i].sms_reminder_days = info.importantDates[i].sms_reminder_days.toString();
                }

            } else {
                info.importantDates[i].sms_reminder_days = "";
            }

            if (info.importantDates[i].reminder_users == "intake") {
                info.importantDates[i].reminder_users_id = 1;
            } else if (info.importantDates[i].reminder_users == "all") {
                info.importantDates[i].reminder_users_id = 2;
            } else {
                info.importantDates[i].reminder_users_id = 3;
            }
            var reminder;
            if (info.importantDates[i].reminder_users == 'intake' || info.importantDates[i].reminder_users == 'all') {
                reminder = info.importantDates[i].reminder_users;
            } else {
                reminder = (info.importantDates[i].reminder_users instanceof Array) ? info.importantDates[i].reminder_users : (utils.isNotEmptyVal(info.importantDates[i].reminder_users)) ? JSON.parse(info.importantDates[i].reminder_users) : info.importantDates[i].reminder_users;
                info.importantDates[i].reminder_users = reminder.toString();
            }
            var criticalDate = {
                "labelId": info.importantDates[i].label_id,
                "eventTitle": info.importantDates[i].event_title,
                "allday": info.importantDates[i].all_day,
                "startDate": info.importantDates[i].start_date,
                "endDate": info.importantDates[i].end_date,
                "isPrivate": info.importantDates[i].is_private,
                "eventLocation": info.importantDates[i].location,
                "eventDescription": info.importantDates[i].description,
                "intakeId": info.importantDates[i].intake_id,
                "comments": info.importantDates[i].comments,
                "isComply": info.importantDates[i].is_comply,
                "assignTo": [],
                "assignedTaskId": info.importantDates[i].assigned_taskid,
                "reason": info.importantDates[i].reason,
                "eventId": info.importantDates[i].intake_event_id,
                "status": info.importantDates[i].status,
                "reminder_users": info.importantDates[i].reminder_users,
                "reminder_days": info.importantDates[i].reminder_days,
                "custom_reminder": info.importantDates[i].custom_reminder,
                "reminder_users_id": info.importantDates[i].reminder_users_id,
                "is_task_created": info.importantDates[i].is_task_created,
                "sms_reminder_days": info.importantDates[i].sms_reminder_days,
                "sms_custom_reminder": info.importantDates[i].sms_custom_reminder,
                "sms_contact_ids": info.importantDates[i].sms_contact_ids ? _.isArray(info.importantDates[i].sms_contact_ids) ? info.importantDates[i].sms_contact_ids.toString() : JSON.parse(info.importantDates[i].sms_contact_ids).toString() : "",
            }
            _.forEach(info.importantDates[i].assigned_to, function (id) {
                criticalDate.assignTo.push({
                    "userId": id
                });
            });
            info.importantDates[i] = angular.copy(criticalDate);
            return criticalDate;
        }

        function setOtherDetails(allData, intakeId, type, subtype) {
            var otherDetails = {};
            var index = [];
            _.forEach(allData, function (item) {
                if (item.details && item.details.witnessNameListForDetails && item.details.witnessNameListForDetails.length > 0) {
                    for (var i = (item.details.witnessNameListForDetails.length - 1); i >= 0; i--) {
                        if (item.details.witnessNameListForDetails[i].name == undefined) {
                            item.details.witnessNameListForDetails.splice(i, 1);
                        }
                    }
                }

                if (item.maritalStatus && item.maritalStatus.contactList && item.maritalStatus.contactList.length > 0) {
                    for (var i = (item.maritalStatus.contactList.length - 1); i >= 0; i--) {
                        if (item.maritalStatus.contactList[i].name == undefined) {
                            item.maritalStatus.contactList.splice(i, 1);
                        }
                    }
                }

                if (item.maritalStatus && item.maritalStatus.childrenList && item.maritalStatus.childrenList.length > 0) {
                    for (var i = (item.maritalStatus.childrenList.length - 1); i >= 0; i--) {
                        if (item.maritalStatus.childrenList[i].name == undefined) {
                            item.maritalStatus.childrenList.splice(i, 1);
                        }
                    }
                }

            });

            _.forEach(allData, function (intake_otherDetails, index) {
                //if(intake_otherDetails.mvaIncident && intake_otherDetails.mvaIncident.incidentDate){
                //    intake_otherDetails.mvaIncident.incidentDate = utils.isNotEmptyVal(intake_otherDetails.mvaIncident.incidentDate) ? moment(intake_otherDetails.mvaIncident.incidentDate).unix() : '';
                //}

                var otherRecord =
                {
                    intakePlaintiffId: intake_otherDetails.intakePlaintiffId,
                    placeOfBirth: angular.isDefined(intake_otherDetails.basicInfo) ? utils.isEmptyVal(intake_otherDetails.basicInfo.placeOfBirth) ? '' : intake_otherDetails.basicInfo.placeOfBirth : '',
                    //estateAdminId: angular.isDefined(intake_otherDetails.basicInfo) ? utils.isEmptyVal(intake_otherDetails.basicInfo.estateAdminId) ? '' : intake_otherDetails.basicInfo.estateAdminId : '',
                    nationality: angular.isDefined(intake_otherDetails.basicInfo) ? utils.isEmptyVal(intake_otherDetails.basicInfo.nationality) ? '' : intake_otherDetails.basicInfo.nationality : '',

                    // InstituteName: angular.isDefined(intake_otherDetails.EducationDetails) ? utils.isEmptyVal(intake_otherDetails.EducationDetails.InstituteName) ? '' : intake_otherDetails.EducationDetails.InstituteName : '',
                    // Program: angular.isDefined(intake_otherDetails.EducationDetails) ? utils.isEmptyVal(intake_otherDetails.EducationDetails.Program) ? '' : intake_otherDetails.EducationDetails.Program : '',
                    // DaysAbsent: angular.isDefined(intake_otherDetails.EducationDetails) ? utils.isEmptyVal(intake_otherDetails.EducationDetails.DaysAbsent) ? '' : intake_otherDetails.EducationDetails.DaysAbsent : '',

                    typeOfPerson: angular.isDefined(intake_otherDetails.maritalStatus) ? utils.isEmptyVal(intake_otherDetails.maritalStatus.typeOfPerson) ? '' : intake_otherDetails.maritalStatus.typeOfPerson : '',
                    spouseName: angular.isDefined(intake_otherDetails.maritalStatus) ? utils.isEmptyVal(intake_otherDetails.maritalStatus.spouseName) ? '' : intake_otherDetails.maritalStatus.spouseName : '',
                    street: angular.isDefined(intake_otherDetails.maritalStatus) ? utils.isEmptyVal(intake_otherDetails.maritalStatus.street) ? '' : intake_otherDetails.maritalStatus.street : '',
                    city: angular.isDefined(intake_otherDetails.maritalStatus) ? utils.isEmptyVal(intake_otherDetails.maritalStatus.city) ? '' : intake_otherDetails.maritalStatus.city : '',
                    state: angular.isDefined(intake_otherDetails.maritalStatus) ? utils.isEmptyVal(intake_otherDetails.maritalStatus.state) ? '' : intake_otherDetails.maritalStatus.state : '',
                    zipCode: angular.isDefined(intake_otherDetails.maritalStatus) ? utils.isEmptyVal(intake_otherDetails.maritalStatus.zipCode) ? '' : intake_otherDetails.maritalStatus.zipCode : '',
                    country: angular.isDefined(intake_otherDetails.maritalStatus) ? utils.isEmptyVal(intake_otherDetails.maritalStatus.country) ? '' : intake_otherDetails.maritalStatus.country : '',
                    contactList: angular.isDefined(intake_otherDetails.maritalStatus) ? utils.isEmptyVal(intake_otherDetails.maritalStatus.contactList) ? '' : intake_otherDetails.maritalStatus.contactList : '',
                    childrenList: angular.isDefined(intake_otherDetails.maritalStatus) ? utils.isEmptyVal(intake_otherDetails.maritalStatus.childrenList) ? '' : intake_otherDetails.maritalStatus.childrenList : '',

                    insuranceDetails: angular.isDefined(intake_otherDetails.healthInsurance) ? utils.isEmptyVal(intake_otherDetails.healthInsurance.insuranceDetails) ? '' : intake_otherDetails.healthInsurance.insuranceDetails : '',
                    describeDenial: angular.isDefined(intake_otherDetails.healthInsurance) ? utils.isEmptyVal(intake_otherDetails.healthInsurance.describeDenial) ? '' : intake_otherDetails.healthInsurance.describeDenial : '',
                    describeDetails: angular.isDefined(intake_otherDetails.healthInsurance) ? utils.isEmptyVal(intake_otherDetails.healthInsurance.describeDetails) ? '' : intake_otherDetails.healthInsurance.describeDetails : '',
                    denied: angular.isDefined(intake_otherDetails.healthInsurance) ? utils.isEmptyVal(intake_otherDetails.healthInsurance.denied) ? '' : intake_otherDetails.healthInsurance.denied : '',
                    State: angular.isDefined(intake_otherDetails.healthInsurance) ? utils.isEmptyVal(intake_otherDetails.healthInsurance.State) ? '' : intake_otherDetails.healthInsurance.State : '',
                    deniedMedicare: angular.isDefined(intake_otherDetails.healthInsurance) ? utils.isEmptyVal(intake_otherDetails.healthInsurance.deniedMedicare) ? '' : intake_otherDetails.healthInsurance.deniedMedicare : '',
                    medicare: angular.isDefined(intake_otherDetails.healthInsurance) ? utils.isEmptyVal(intake_otherDetails.healthInsurance.medicare) ? '' : intake_otherDetails.healthInsurance.medicare : '',
                    medicareNext: angular.isDefined(intake_otherDetails.healthInsurance) ? utils.isEmptyVal(intake_otherDetails.healthInsurance.medicareNext) ? '' : intake_otherDetails.healthInsurance.medicareNext : '',
                    healthInsuranceFrom: angular.isDefined(intake_otherDetails.healthInsurance) ? utils.isEmptyVal(intake_otherDetails.healthInsurance.healthInsuranceFrom) ? '' : intake_otherDetails.healthInsurance.healthInsuranceFrom : '',

                    auto: angular.isDefined(intake_otherDetails.automobileInsurance) ? utils.isEmptyVal(intake_otherDetails.automobileInsurance.auto) ? '' : intake_otherDetails.automobileInsurance.auto : '',
                    memo: angular.isDefined(intake_otherDetails.Treatment) ? utils.isEmptyVal(intake_otherDetails.Treatment.memo) ? '' : intake_otherDetails.Treatment.memo : '',

                    service: angular.isDefined(intake_otherDetails.militaryService) ? utils.isEmptyVal(intake_otherDetails.militaryService.service) ? '' : intake_otherDetails.militaryService.service : '',
                    serviceBranch: angular.isDefined(intake_otherDetails.militaryService) ? utils.isEmptyVal(intake_otherDetails.militaryService.serviceBranch) ? '' : intake_otherDetails.militaryService.serviceBranch : '',
                    describeMilitary: angular.isDefined(intake_otherDetails.militaryService) ? utils.isEmptyVal(intake_otherDetails.militaryService.describeMilitary) ? '' : intake_otherDetails.militaryService.describeMilitary : '',
                    serviceNumber: angular.isDefined(intake_otherDetails.militaryService) ? utils.isEmptyVal(intake_otherDetails.militaryService.serviceNumber) ? '' : intake_otherDetails.militaryService.serviceNumber : '',
                    datesOfService: angular.isDefined(intake_otherDetails.militaryService) ? utils.isEmptyVal(intake_otherDetails.militaryService.datesOfService) ? '' : intake_otherDetails.militaryService.datesOfService : '',
                    typeOfDischarge: angular.isDefined(intake_otherDetails.militaryService) ? utils.isEmptyVal(intake_otherDetails.militaryService.typeOfDischarge) ? '' : intake_otherDetails.militaryService.typeOfDischarge : '',
                    awardsReceived: angular.isDefined(intake_otherDetails.militaryService) ? utils.isEmptyVal(intake_otherDetails.militaryService.awardsReceived) ? '' : intake_otherDetails.militaryService.awardsReceived : '',
                    information: angular.isDefined(intake_otherDetails.militaryService) ? utils.isEmptyVal(intake_otherDetails.militaryService.information) ? '' : intake_otherDetails.militaryService.information : '',
                    percentage: angular.isDefined(intake_otherDetails.militaryService) ? utils.isEmptyVal(intake_otherDetails.militaryService.percentage) ? '' : intake_otherDetails.militaryService.percentage : '',
                    injuredparts: angular.isDefined(intake_otherDetails.militaryService) ? utils.isEmptyVal(intake_otherDetails.militaryService.injuredparts) ? '' : intake_otherDetails.militaryService.injuredparts : '',
                    injuries: angular.isDefined(intake_otherDetails.militaryService) ? utils.isEmptyVal(intake_otherDetails.militaryService.injuries) ? '' : intake_otherDetails.militaryService.injuries : '',


                    // driverLiscenseNumber: angular.isDefined(intake_otherDetails.automobileInsurance) ? utils.isEmptyVal(intake_otherDetails.automobileInsurance.driverLiscenseNumber) ? '' : intake_otherDetails.automobileInsurance.driverLiscenseNumber : '',
                    // timeheldLiscense: angular.isDefined(intake_otherDetails.automobileInsurance) ? utils.isEmptyVal(intake_otherDetails.automobileInsurance.timeheldLiscense) ? '' : intake_otherDetails.automobileInsurance.timeheldLiscense : '',
                    paymentsCoverage: angular.isDefined(intake_otherDetails.automobileInsurance) ? utils.isEmptyVal(intake_otherDetails.automobileInsurance.paymentsCoverage) ? '' : intake_otherDetails.automobileInsurance.paymentsCoverage : '',
                    coverage: angular.isDefined(intake_otherDetails.automobileInsurance) ? utils.isEmptyVal(intake_otherDetails.automobileInsurance.coverage) ? '' : intake_otherDetails.automobileInsurance.coverage : '',
                    yearOfVehicalAuto: angular.isDefined(intake_otherDetails.automobileInsurance) ? utils.isEmptyVal(intake_otherDetails.automobileInsurance.yearOfVehicalAuto) ? '' : intake_otherDetails.automobileInsurance.yearOfVehicalAuto : '',
                    modelOfVehicalAuto: angular.isDefined(intake_otherDetails.automobileInsurance) ? utils.isEmptyVal(intake_otherDetails.automobileInsurance.modelOfVehicalAuto) ? '' : intake_otherDetails.automobileInsurance.modelOfVehicalAuto : '',
                    colorOfVehicalAuto: angular.isDefined(intake_otherDetails.automobileInsurance) ? utils.isEmptyVal(intake_otherDetails.automobileInsurance.colorOfVehicalAuto) ? '' : intake_otherDetails.automobileInsurance.colorOfVehicalAuto : '',

                    yearOfVehicalOther: angular.isDefined(intake_otherDetails.otherDriverInsurance) ? utils.isEmptyVal(intake_otherDetails.otherDriverInsurance.yearOfVehicalOther) ? '' : intake_otherDetails.otherDriverInsurance.yearOfVehicalOther : '',
                    modelOfVehicalOther: angular.isDefined(intake_otherDetails.otherDriverInsurance) ? utils.isEmptyVal(intake_otherDetails.otherDriverInsurance.modelOfVehicalOther) ? '' : intake_otherDetails.otherDriverInsurance.modelOfVehicalOther : '',
                    colorOfVehicalOther: angular.isDefined(intake_otherDetails.otherDriverInsurance) ? utils.isEmptyVal(intake_otherDetails.otherDriverInsurance.colorOfVehicalOther) ? '' : intake_otherDetails.otherDriverInsurance.colorOfVehicalOther : '',

                    optionDamaged: angular.isDefined(intake_otherDetails.propertyDamaged) ? utils.isEmptyVal(intake_otherDetails.propertyDamaged.optionDamaged) ? '' : intake_otherDetails.propertyDamaged.optionDamaged : '',
                    describe: angular.isDefined(intake_otherDetails.propertyDamaged) ? utils.isEmptyVal(intake_otherDetails.propertyDamaged.describe) ? '' : intake_otherDetails.propertyDamaged.describe : '',
                    optionTowed: angular.isDefined(intake_otherDetails.propertyDamaged) ? utils.isEmptyVal(intake_otherDetails.propertyDamaged.optionTowed) ? '' : intake_otherDetails.propertyDamaged.optionTowed : '',
                    describeTowed: angular.isDefined(intake_otherDetails.propertyDamaged) ? utils.isEmptyVal(intake_otherDetails.propertyDamaged.describeTowed) ? '' : intake_otherDetails.propertyDamaged.describeTowed : '',
                    optionEstimate: angular.isDefined(intake_otherDetails.propertyDamaged) ? utils.isEmptyVal(intake_otherDetails.propertyDamaged.optionEstimate) ? '' : intake_otherDetails.propertyDamaged.optionEstimate : '',
                    estimateToRepair: angular.isDefined(intake_otherDetails.propertyDamaged) ? utils.isEmptyVal(intake_otherDetails.propertyDamaged.estimateToRepair) ? '' : intake_otherDetails.propertyDamaged.estimateToRepair : '',
                    optionPhotographs: angular.isDefined(intake_otherDetails.propertyDamaged) ? utils.isEmptyVal(intake_otherDetails.propertyDamaged.optionPhotographs) ? '' : intake_otherDetails.propertyDamaged.optionPhotographs : '',
                    proDamaged: angular.isDefined(intake_otherDetails.propertyDamaged) ? intake_otherDetails.propertyDamaged.proDamaged == '3' ? '' : intake_otherDetails.propertyDamaged.proDamaged : '3',
                    propDamage: angular.isDefined(intake_otherDetails.propertyDamaged) ? utils.isEmptyVal(intake_otherDetails.propertyDamaged.propDamage) ? '' : intake_otherDetails.propertyDamaged.propDamage : '',

                    injuredareas: angular.isDefined(intake_otherDetails.IncidentDetails) ? utils.isEmptyVal(intake_otherDetails.IncidentDetails.injuredareas) ? '' : intake_otherDetails.IncidentDetails.injuredareas : '',
                    Description: angular.isDefined(intake_otherDetails.IncidentDetails) ? utils.isEmptyVal(intake_otherDetails.IncidentDetails.Description) ? '' : intake_otherDetails.IncidentDetails.Description : '',

                    aid: angular.isDefined(intake_otherDetails.eyesOrEars) ? utils.isEmptyVal(intake_otherDetails.eyesOrEars.aid) ? '' : intake_otherDetails.eyesOrEars.aid : '',
                    describeAid: angular.isDefined(intake_otherDetails.eyesOrEars) ? utils.isEmptyVal(intake_otherDetails.eyesOrEars.describeAid) ? '' : intake_otherDetails.eyesOrEars.describeAid : '',

                    claim: angular.isDefined(intake_otherDetails.workerCompensation) ? utils.isEmptyVal(intake_otherDetails.workerCompensation.claim) ? '' : intake_otherDetails.workerCompensation.claim : '',
                    describeClaim: angular.isDefined(intake_otherDetails.workerCompensation) ? utils.isEmptyVal(intake_otherDetails.workerCompensation.describeClaim) ? '' : intake_otherDetails.workerCompensation.describeClaim : '',
                    listHealthCare: angular.isDefined(intake_otherDetails.workerCompensation) ? utils.isEmptyVal(intake_otherDetails.workerCompensation.listHealthCare) ? '' : intake_otherDetails.workerCompensation.listHealthCare : '',

                    court: angular.isDefined(intake_otherDetails.bankruptcy) ? utils.isEmptyVal(intake_otherDetails.bankruptcy.court) ? '' : intake_otherDetails.bankruptcy.court : '',
                    describeBankruptcyCourt: angular.isDefined(intake_otherDetails.bankruptcy) ? utils.isEmptyVal(intake_otherDetails.bankruptcy.describeBankruptcyCourt) ? '' : intake_otherDetails.bankruptcy.describeBankruptcyCourt : '',
                    contemplat: angular.isDefined(intake_otherDetails.bankruptcy) ? utils.isEmptyVal(intake_otherDetails.bankruptcy.contemplat) ? '' : intake_otherDetails.bankruptcy.contemplat : '',
                    contemplatingFilling: angular.isDefined(intake_otherDetails.bankruptcy) ? utils.isEmptyVal(intake_otherDetails.bankruptcy.contemplatingFilling) ? '' : intake_otherDetails.bankruptcy.contemplatingFilling : '',

                    lawsuit: angular.isDefined(intake_otherDetails.assistanceAndSupport) ? utils.isEmptyVal(intake_otherDetails.assistanceAndSupport.lawsuit) ? '' : intake_otherDetails.assistanceAndSupport.lawsuit : '',
                    describeLawsuit: angular.isDefined(intake_otherDetails.assistanceAndSupport) ? utils.isEmptyVal(intake_otherDetails.assistanceAndSupport.describeLawsuit) ? '' : intake_otherDetails.assistanceAndSupport.describeLawsuit : '',
                    judgments: angular.isDefined(intake_otherDetails.assistanceAndSupport) ? utils.isEmptyVal(intake_otherDetails.assistanceAndSupport.judgments) ? '' : intake_otherDetails.assistanceAndSupport.judgments : '',
                    describeJudgmentsPending: angular.isDefined(intake_otherDetails.assistanceAndSupport) ? utils.isEmptyVal(intake_otherDetails.assistanceAndSupport.describeJudgmentsPending) ? '' : intake_otherDetails.assistanceAndSupport.describeJudgmentsPending : '',
                    aidType: angular.isDefined(intake_otherDetails.assistanceAndSupport) ? utils.isEmptyVal(intake_otherDetails.assistanceAndSupport.aidType) ? '' : intake_otherDetails.assistanceAndSupport.aidType : '',
                    stateAid: angular.isDefined(intake_otherDetails.assistanceAndSupport) ? utils.isEmptyVal(intake_otherDetails.assistanceAndSupport.stateAid) ? '' : intake_otherDetails.assistanceAndSupport.stateAid : '',
                    childSupport: angular.isDefined(intake_otherDetails.assistanceAndSupport) ? utils.isEmptyVal(intake_otherDetails.assistanceAndSupport.childSupport) ? '' : intake_otherDetails.assistanceAndSupport.childSupport : '',
                    obligation: angular.isDefined(intake_otherDetails.assistanceAndSupport) ? utils.isEmptyVal(intake_otherDetails.assistanceAndSupport.obligation) ? '' : intake_otherDetails.assistanceAndSupport.obligation : '',

                    alcoholorDrug: angular.isDefined(intake_otherDetails.addictionOrtreatment) ? utils.isEmptyVal(intake_otherDetails.addictionOrtreatment.alcoholorDrug) ? '' : intake_otherDetails.addictionOrtreatment.alcoholorDrug : '',
                    describeAlcohol: angular.isDefined(intake_otherDetails.addictionOrtreatment) ? utils.isEmptyVal(intake_otherDetails.addictionOrtreatment.describeAlcohol) ? '' : intake_otherDetails.addictionOrtreatment.describeAlcohol : '',

                    claimDoubleCheck: angular.isDefined(intake_otherDetails.incidentDoubleCheck) ? utils.isEmptyVal(intake_otherDetails.incidentDoubleCheck.claimDoubleCheck) ? '' : intake_otherDetails.incidentDoubleCheck.claimDoubleCheck : '',
                    describeCarAccident: angular.isDefined(intake_otherDetails.incidentDoubleCheck) ? utils.isEmptyVal(intake_otherDetails.incidentDoubleCheck.describeCarAccident) ? '' : intake_otherDetails.incidentDoubleCheck.describeCarAccident : '',
                    noClaim: angular.isDefined(intake_otherDetails.incidentDoubleCheck) ? utils.isEmptyVal(intake_otherDetails.incidentDoubleCheck.noClaim) ? '' : intake_otherDetails.incidentDoubleCheck.noClaim : '',
                    describeInjured: angular.isDefined(intake_otherDetails.incidentDoubleCheck) ? utils.isEmptyVal(intake_otherDetails.incidentDoubleCheck.describeInjured) ? '' : intake_otherDetails.incidentDoubleCheck.describeInjured : '',
                    MRIorCTScan: angular.isDefined(intake_otherDetails.incidentDoubleCheck) ? utils.isEmptyVal(intake_otherDetails.incidentDoubleCheck.MRIorCTScan) ? '' : intake_otherDetails.incidentDoubleCheck.MRIorCTScan : '',
                    describeMRIOrCT: angular.isDefined(intake_otherDetails.incidentDoubleCheck) ? utils.isEmptyVal(intake_otherDetails.incidentDoubleCheck.describeMRIOrCT) ? '' : intake_otherDetails.incidentDoubleCheck.describeMRIOrCT : '',

                    convictions: angular.isDefined(intake_otherDetails.criminalOrMotorVehical) ? utils.isEmptyVal(intake_otherDetails.criminalOrMotorVehical.convictions) ? '' : intake_otherDetails.criminalOrMotorVehical.convictions : '',
                    describeConvictions: angular.isDefined(intake_otherDetails.criminalOrMotorVehical) ? utils.isEmptyVal(intake_otherDetails.criminalOrMotorVehical.describeConvictions) ? '' : intake_otherDetails.criminalOrMotorVehical.describeConvictions : '',
                    dateCriminal: angular.isDefined(intake_otherDetails.criminalOrMotorVehical) ? utils.isNotEmptyVal(intake_otherDetails.criminalOrMotorVehical.dateCriminal) ? intake_otherDetails.criminalOrMotorVehical.dateCriminal : '' : '',
                    placeCriminal: angular.isDefined(intake_otherDetails.criminalOrMotorVehical) ? utils.isEmptyVal(intake_otherDetails.criminalOrMotorVehical.placeCriminal) ? '' : intake_otherDetails.criminalOrMotorVehical.placeCriminal : '',
                    incarcerate: angular.isDefined(intake_otherDetails.criminalOrMotorVehical) ? utils.isEmptyVal(intake_otherDetails.criminalOrMotorVehical.incarcerate) ? '' : intake_otherDetails.criminalOrMotorVehical.incarcerate : '',
                    detailsCriminal: angular.isDefined(intake_otherDetails.criminalOrMotorVehical) ? utils.isEmptyVal(intake_otherDetails.criminalOrMotorVehical.detailsCriminal) ? '' : intake_otherDetails.criminalOrMotorVehical.detailsCriminal : '',

                    claimLawsuit: angular.isDefined(intake_otherDetails.injuryClaims) ? utils.isEmptyVal(intake_otherDetails.injuryClaims.claimLawsuit) ? '' : intake_otherDetails.injuryClaims.claimLawsuit : '',
                    natureOfClaim: angular.isDefined(intake_otherDetails.injuryClaims) ? utils.isEmptyVal(intake_otherDetails.injuryClaims.natureOfClaim) ? '' : intake_otherDetails.injuryClaims.natureOfClaim : '',
                    dateClaimLawsit: angular.isDefined(intake_otherDetails.injuryClaims) ? utils.isEmptyVal(intake_otherDetails.injuryClaims.dateClaimLawsit) ? '' : intake_otherDetails.injuryClaims.dateClaimLawsit : '',
                    detailsClaimLawsit: angular.isDefined(intake_otherDetails.injuryClaims) ? utils.isEmptyVal(intake_otherDetails.injuryClaims.detailsClaimLawsit) ? '' : intake_otherDetails.injuryClaims.detailsClaimLawsit : '',

                    SSD: angular.isDefined(intake_otherDetails.disabilityClaims) ? utils.isEmptyVal(intake_otherDetails.disabilityClaims.SSD) ? '' : intake_otherDetails.disabilityClaims.SSD : '',
                    natureOfDisability: angular.isDefined(intake_otherDetails.disabilityClaims) ? utils.isEmptyVal(intake_otherDetails.disabilityClaims.natureOfDisability) ? '' : intake_otherDetails.disabilityClaims.natureOfDisability : '',
                    dateDeterminedDisabled: angular.isDefined(intake_otherDetails.disabilityClaims) ? utils.isNotEmptyVal(intake_otherDetails.disabilityClaims.dateDeterminedDisabled) ? intake_otherDetails.disabilityClaims.dateDeterminedDisabled : '' : '',
                    nature: angular.isDefined(intake_otherDetails.disabilityClaims) ? utils.isEmptyVal(intake_otherDetails.disabilityClaims.nature) ? '' : intake_otherDetails.disabilityClaims.nature : '',
                    describeNature: angular.isDefined(intake_otherDetails.disabilityClaims) ? utils.isEmptyVal(intake_otherDetails.disabilityClaims.describeNature) ? '' : intake_otherDetails.disabilityClaims.describeNature : '',

                    prenatalVisit: angular.isDefined(intake_otherDetails.parentalCare) ? utils.isNotEmptyVal(intake_otherDetails.parentalCare.prenatalVisit) ? intake_otherDetails.parentalCare.prenatalVisit : '' : '',
                    dueDate: angular.isDefined(intake_otherDetails.parentalCare) ? utils.isNotEmptyVal(intake_otherDetails.parentalCare.dueDate) ? intake_otherDetails.parentalCare.dueDate : '' : '',
                    streetPrenatal: angular.isDefined(intake_otherDetails.parentalCare) ? utils.isEmptyVal(intake_otherDetails.parentalCare.street) ? '' : intake_otherDetails.parentalCare.street : '',
                    parentalCity: angular.isDefined(intake_otherDetails.parentalCare) ? utils.isEmptyVal(intake_otherDetails.parentalCare.City) ? '' : intake_otherDetails.parentalCare.City : '',
                    statePrenatal: angular.isDefined(intake_otherDetails.parentalCare) ? utils.isEmptyVal(intake_otherDetails.parentalCare.state) ? '' : intake_otherDetails.parentalCare.state : '',
                    zIPCode: angular.isDefined(intake_otherDetails.parentalCare) ? utils.isEmptyVal(intake_otherDetails.parentalCare.zIPCode) ? '' : intake_otherDetails.parentalCare.zIPCode : '',
                    countryPrenatal: angular.isDefined(intake_otherDetails.parentalCare) ? utils.isEmptyVal(intake_otherDetails.parentalCare.country) ? '' : intake_otherDetails.parentalCare.country : '',
                    nameAndAddress1Parental: angular.isDefined(intake_otherDetails.parentalCare) ? utils.isEmptyVal(intake_otherDetails.parentalCare.nameAndAddress1Parental) ? '' : intake_otherDetails.parentalCare.nameAndAddress1Parental : '',
                    nameAndAddress2Parental: angular.isDefined(intake_otherDetails.parentalCare) ? utils.isEmptyVal(intake_otherDetails.parentalCare.nameAndAddress2Parental) ? '' : intake_otherDetails.parentalCare.nameAndAddress2Parental : '',
                    nameAndAddress3Parental: angular.isDefined(intake_otherDetails.parentalCare) ? utils.isEmptyVal(intake_otherDetails.parentalCare.nameAndAddress3Parental) ? '' : intake_otherDetails.parentalCare.nameAndAddress3Parental : '',

                    accidentPrior: angular.isDefined(intake_otherDetails.History) ? utils.isEmptyVal(intake_otherDetails.History.accidentPrior) ? '' : intake_otherDetails.History.accidentPrior : '',
                    priorLaw: angular.isDefined(intake_otherDetails.History) ? utils.isEmptyVal(intake_otherDetails.History.priorLaw) ? '' : intake_otherDetails.History.priorLaw : '',
                    typeAccident: angular.isDefined(intake_otherDetails.History) ? utils.isEmptyVal(intake_otherDetails.History.typeAccident) ? '' : intake_otherDetails.History.typeAccident : '',
                    whenWhere: angular.isDefined(intake_otherDetails.History) ? utils.isEmptyVal(intake_otherDetails.History.whenWhere) ? '' : intake_otherDetails.History.whenWhere : '',
                    isInjured: angular.isDefined(intake_otherDetails.History) ? utils.isEmptyVal(intake_otherDetails.History.isInjured) ? '' : intake_otherDetails.History.isInjured : '',
                    reInjured: angular.isDefined(intake_otherDetails.History) ? utils.isEmptyVal(intake_otherDetails.History.reInjured) ? '' : intake_otherDetails.History.reInjured : '',
                    selectInjuries: angular.isDefined(intake_otherDetails.History) ? utils.isEmptyVal(intake_otherDetails.History.selectInjuries) ? '' : intake_otherDetails.History.selectInjuries : '',
                    notes: angular.isDefined(intake_otherDetails.History) ? utils.isEmptyVal(intake_otherDetails.History.notes) ? '' : intake_otherDetails.History.notes : '',

                    birthInfoServiceProvider: angular.isDefined(intake_otherDetails.birthInformation) ? utils.isEmptyVal(intake_otherDetails.birthInformation.serviceProvider) ? '' : intake_otherDetails.birthInformation : '',
                    physicianName: angular.isDefined(intake_otherDetails.birthInformation) ? utils.isEmptyVal(intake_otherDetails.birthInformation.physicianName) ? '' : intake_otherDetails.birthInformation.physicianName : '',
                    birthDateInfo: angular.isDefined(intake_otherDetails.birthInformation) ? utils.isNotEmptyVal(intake_otherDetails.birthInformation.birthDateInfo) ? intake_otherDetails.birthInformation.birthDateInfo : '' : '',
                    timeOfBirthInfo: angular.isDefined(intake_otherDetails.birthInformation) ? utils.isEmptyVal(intake_otherDetails.birthInformation.timeOfBirthInfo) ? '' : intake_otherDetails.birthInformation.timeOfBirthInfo : '',
                    dateOfTimeInfo: angular.isDefined(intake_otherDetails.birthInformation) ? utils.isNotEmptyVal(intake_otherDetails.birthInformation.dateOfTimeInfo) ? intake_otherDetails.birthInformation.dateOfTimeInfo : '' : '',
                    labor: angular.isDefined(intake_otherDetails.birthInformation) ? utils.isEmptyVal(intake_otherDetails.birthInformation.labor) ? '' : intake_otherDetails.birthInformation.labor : '',
                    dateWaterBroke: angular.isDefined(intake_otherDetails.birthInformation) ? utils.isNotEmptyVal(intake_otherDetails.birthInformation.dateWaterBroke) ? intake_otherDetails.birthInformation.dateWaterBroke : '' : '',
                    timeWaterBroke: angular.isDefined(intake_otherDetails.birthInformation) ? utils.isEmptyVal(intake_otherDetails.birthInformation.timeWaterBroke) ? '' : intake_otherDetails.birthInformation.timeWaterBroke : '',
                    childDateOFBirth: angular.isDefined(intake_otherDetails.birthInformation) ? utils.isNotEmptyVal(intake_otherDetails.birthInformation.childDateOFBirth) ? intake_otherDetails.birthInformation.childDateOFBirth : '' : '',
                    timeOfBirth: angular.isDefined(intake_otherDetails.birthInformation) ? utils.isEmptyVal(intake_otherDetails.birthInformation.timeOfBirth) ? '' : intake_otherDetails.birthInformation.timeOfBirth : '',
                    birthDateDischarge: angular.isDefined(intake_otherDetails.birthInformation) ? utils.isNotEmptyVal(intake_otherDetails.birthInformation.birthDateDischarge) ? intake_otherDetails.birthInformation.birthDateDischarge : '' : '',
                    pediatriciansName: angular.isDefined(intake_otherDetails.birthInformation) ? utils.isEmptyVal(intake_otherDetails.birthInformation.pediatriciansName) ? '' : intake_otherDetails.birthInformation.pediatriciansName : '',
                    neurologistsName: angular.isDefined(intake_otherDetails.birthInformation) ? utils.isEmptyVal(intake_otherDetails.birthInformation.neurologistsName) ? '' : intake_otherDetails.birthInformation.neurologistsName : '',
                    birthContactList: angular.isDefined(intake_otherDetails.birthInformation) ? utils.isEmptyVal(intake_otherDetails.birthInformation.contactList) ? '' : intake_otherDetails.birthInformation.contactList : '',

                    nameOfChild: angular.isDefined(intake_otherDetails.childInfo) ? utils.isEmptyVal(intake_otherDetails.childInfo.nameOfChild) ? '' : intake_otherDetails.childInfo.nameOfChild : '',
                    dateChildBirth: angular.isDefined(intake_otherDetails.childInfo) ? utils.isNotEmptyVal(intake_otherDetails.childInfo.dateChildBirth) ? intake_otherDetails.childInfo.dateChildBirth : '' : '',
                    ChildSsn: angular.isDefined(intake_otherDetails.childInfo) ? utils.isEmptyVal(intake_otherDetails.childInfo.ChildSsn) ? '' : intake_otherDetails.childInfo.ChildSsn : '',

                    otherdetails: angular.isDefined(intake_otherDetails.otherdetails) ? intake_otherDetails.otherdetails : null,
                    Treatment2: angular.isDefined(intake_otherDetails.Treatment2) ? intake_otherDetails.Treatment2 : null,
                    damage: angular.isDefined(intake_otherDetails.damage) ? intake_otherDetails.damage : null,
                    inciDetail: angular.isDefined(intake_otherDetails.inciDetail) ? intake_otherDetails.inciDetail : null,
                    OtherMemo: angular.isDefined(intake_otherDetails) ? intake_otherDetails.OtherMemo : null,

                    mvaTreatment: angular.isDefined(intake_otherDetails.mvaTreatment) ? intake_otherDetails.mvaTreatment : null,

                    mvaIncident: angular.isDefined(intake_otherDetails.mvaIncident) ? intake_otherDetails.mvaIncident : null,
                    basicInfoOtherDetails: angular.isDefined(intake_otherDetails.basicInfoOtherDetails) ? intake_otherDetails.basicInfoOtherDetails : null,
                    automobileOtherDetails: angular.isDefined(intake_otherDetails.automobileOtherDetails) ? intake_otherDetails.automobileOtherDetails : null,
                    defautomobileOtherDetails: angular.isDefined(intake_otherDetails.defautomobileOtherDetails) ? intake_otherDetails.defautomobileOtherDetails : null,
                    details: angular.isDefined(intake_otherDetails.details) ? intake_otherDetails.details : null,
                    healthMedicare: angular.isDefined(intake_otherDetails.healthMedicare) ? intake_otherDetails.healthMedicare : null,
                    MedMalDetails: angular.isDefined(intake_otherDetails.MedMalDetails) ? intake_otherDetails.MedMalDetails : null,
                    MedMal: angular.isDefined(intake_otherDetails.MedMal) ? intake_otherDetails.MedMal : null,
                    MiscellaneousMedMal: angular.isDefined(intake_otherDetails.MiscellaneousMedMal) ? intake_otherDetails.MiscellaneousMedMal : null,
                    IncDetailsForPremises: angular.isDefined(intake_otherDetails.IncDetailsForPremises) ? intake_otherDetails.IncDetailsForPremises : null,
                    witnessOtherDetails: angular.isDefined(intake_otherDetails.witnessOtherDetails) ? intake_otherDetails.witnessOtherDetails : null,
                }
                if (utils.isNotEmptyVal(otherRecord.MiscellaneousMedMal)) {
                    otherRecord.MiscellaneousMedMal.medicalRecordCopies = (otherRecord.MiscellaneousMedMal.medicalRecordCopies == 'dontknow') ? '' : otherRecord.MiscellaneousMedMal.medicalRecordCopies;
                    otherRecord.MiscellaneousMedMal.havePhotos = (otherRecord.MiscellaneousMedMal.havePhotos == 'dontknow') ? '' : otherRecord.MiscellaneousMedMal.havePhotos;
                }
                if (otherRecord.damage && otherRecord.damage.deathDate) {
                    otherRecord.damage.deathDate = moment.utc(otherRecord.damage.deathDate).unix();
                }
                otherDetails['plaintiff' + (index + 1)] = otherRecord;
            });
            var rec = {
                "intakeId": intakeId,
                "detailsJson": JSON.stringify(otherDetails),
            };

            return rec
        }

        function setPlaintiffInfo(plaintiffData, intakeId, index) {
            var intake_plaintiff = angular.copy(plaintiffData);
            var employerDetails = [];
            if (angular.isDefined(intake_plaintiff.Employer)) {
                if (utils.isNotEmptyVal(intake_plaintiff.Employer.employerDetails)) {
                    _.forEach(intake_plaintiff.Employer.employerDetails, function (item) {
                        var details = {};
                        details.contact = angular.isDefined(item.EmployerName) ? { "contactId": item.EmployerName.contact_id } : null;
                        details.intakePlaintiffId = angular.isDefined(item) ? intake_plaintiff.intakePlaintiffId : '';
                        details.occupation = utils.isNotEmptyVal(item.Occupation) ? item.Occupation : '';
                        details.position = utils.isNotEmptyVal(item.Position) ? item.Position : null;
                        details.employmentStartDate = utils.isNotEmptyVal(item.startdate) ? moment(item.startdate).unix() : null;
                        details.employmentEndDate = utils.isNotEmptyVal(item.endDate) ? moment(item.endDate).unix() : null;
                        details.salaryMode = utils.isNotEmptyVal(item.salarymode) ? item.salarymode : null;
                        details.lostDays = utils.isNotEmptyVal(item.DaysLost) ? item.DaysLost : null;
                        details.memo = utils.isNotEmptyVal(item.Description) ? item.Description : null;
                        details.isCurrent = utils.isNotEmptyVal(item.iscurrent) ? item.iscurrent : null;
                        details.monthlySalary = utils.isNotEmptyVal(item.Salary) ? parseFloat(item.Salary) : null;
                        details.isDeleted = item.isDeleted;
                        if (item.intakeEmployerId) {
                            details.intakeEmployerId = item.intakeEmployerId;
                        }
                        employerDetails.push(details);
                    });
                }
            }
            if (intake_plaintiff.basicInfo && intake_plaintiff.basicInfo.dateOfBirth) {
                var birthDate = moment(intake_plaintiff.basicInfo.dateOfBirth);
                var diff = moment().diff(moment(birthDate).format("MM/DD/YYYY"), 'years');
                intake_plaintiff.basicInfo.isminor = diff < 18;
            }

            var employed = false;
            if (intake_plaintiff.Employer && intake_plaintiff.Employer.employerDetails && intake_plaintiff.Employer.employerDetails.length > 0) {
                var deletedEmp = _.filter(intake_plaintiff.Employer.employerDetails, function (filter) {
                    return filter.isDeleted == 1;
                });
                employed = (deletedEmp && deletedEmp.length == intake_plaintiff.Employer.employerDetails.length) ? false : true;
            }

            var student = false;
            if (intake_plaintiff.EducationDetails && (intake_plaintiff.EducationDetails.InstituteName || intake_plaintiff.EducationDetails.Program || intake_plaintiff.EducationDetails.DaysAbsent)) {
                student = true;
            }

            var plaintiffRecord = {
                isPrimary: 1,
                gender: utils.isNotEmptyVal(intake_plaintiff.basicInfo) ? intake_plaintiff.basicInfo.gender == '1' ? 'male' : intake_plaintiff.basicInfo.gender == '2' ? 'female' : intake_plaintiff.basicInfo.gender == '3' ? 'other' : 'Not specified' : 'Not specified',
                dateOfBirth: angular.isDefined(intake_plaintiff.basicInfo) ? utils.isNotEmptyVal(intake_plaintiff.basicInfo.dateOfBirth) ? utils.getUTCTimeStamp(intake_plaintiff.basicInfo.dateOfBirth) : '' : '',
                ssn: angular.isDefined(intake_plaintiff.basicInfo) ? utils.isEmptyVal(intake_plaintiff.basicInfo.ssn) ? '' : intake_plaintiff.basicInfo.ssn : '',
                maritalStatus: angular.isDefined(intake_plaintiff.maritalStatus) ? intake_plaintiff.maritalStatus.typeOfPerson == "Married" ? 'married' : intake_plaintiff.maritalStatus.typeOfPerson == "Single" ? 'single' : intake_plaintiff.maritalStatus.typeOfPerson == "Widowed" ? 'widowed' : intake_plaintiff.maritalStatus.typeOfPerson == "Other" ? 'other' : 'Not specified' : 'Not specified',
                isEmployed: !employed ? 0 : 1,
                isAlive: utils.isNotEmptyVal(intake_plaintiff.basicInfo) ? intake_plaintiff.basicInfo.status_list == 0 ? 0 : intake_plaintiff.basicInfo.status_list == 1 ? 1 : 2 : 2,
                isInfant: utils.isNotEmptyVal(intake_plaintiff.basicInfo) ? intake_plaintiff.basicInfo.isminor ? 1 : 0 : 0,
                isDeleted: 0,
                dateOfDeath: angular.isDefined(intake_plaintiff.basicInfo) ? utils.isNotEmptyVal(intake_plaintiff.basicInfo.dateOfDeath) ? utils.getUTCTimeStamp(intake_plaintiff.basicInfo.dateOfDeath) : '' : '',
                contact: utils.isNotEmptyVal(intake_plaintiff.contact) ? { "contactId": intake_plaintiff.contact.contactId } : { "contactId": intake_plaintiff.contact_id },
                intakeId: intakeId,
                bodilyInjury: "",
                surgery: 0,
                primaryLanguage: angular.isDefined(intake_plaintiff.basicInfo) ? utils.isNotEmptyVal(intake_plaintiff.basicInfo.primaryLang) ? intake_plaintiff.basicInfo.primaryLang : '' : '',
                isStudent: student ? 1 : 0,
                estateAdminId: angular.isDefined(intake_plaintiff.basicInfo) ? utils.isNotEmptyVal(intake_plaintiff.basicInfo.estateAdminId) ? { "contactId": intake_plaintiff.basicInfo.estateAdminId.contact_id } : {} : {},
                studentInstitution: {},
                studentProgram: angular.isDefined(intake_plaintiff.EducationDetails) ? utils.isEmptyVal(intake_plaintiff.EducationDetails.Program) ? '' : intake_plaintiff.EducationDetails.Program : '',
                studentLostDays: angular.isDefined(intake_plaintiff.EducationDetails) ? utils.isEmptyVal(intake_plaintiff.EducationDetails.DaysAbsent) ? '' : intake_plaintiff.EducationDetails.DaysAbsent : '',
                memo: "",
                intakeEmployer: employerDetails
            }

            if (intake_plaintiff.EducationDetails && intake_plaintiff.EducationDetails.InstituteName && intake_plaintiff.EducationDetails.InstituteName.contact_id) {
                plaintiffRecord.studentInstitution.contactId = intake_plaintiff.EducationDetails.InstituteName.contact_id;
            }

            if (intake_plaintiff.intakePlaintiffId) {
                plaintiffRecord.intakePlaintiffId = intake_plaintiff.intakePlaintiffId;
            }
            //if (intake_plaintiff.contact) {
            //    plaintiffRecord.contact = intake_plaintiff.contact;
            // }

            return plaintiffRecord;
        }

        //new code changes by chetna
        function setMedicalInfo(medicalData, intakeId, index) {
            var intake_Medical = angular.copy(medicalData);
            var medicalrecordinfo = [];
            var intakeMedicalProviderList = [];
            if (angular.isDefined(intake_Medical.Treatment.insuranceProviderList)) {
                _.forEach(intake_Medical.Treatment.insuranceProviderList, function (currentItem) {
                    // if (utils.isNotEmptyVal(currentItem.name)) {
                    //     medicalrecordinfo.push({ "contactId": currentItem.name.contact_id });
                    // }
                    var obj = {};
                    obj.intakeMedicalRecordId = angular.isDefined(currentItem.intakeMedicalRecordId) ? currentItem.intakeMedicalRecordId : '',
                        obj.serviceStartDate = angular.isDefined(currentItem.serviceStartDate) ? utils.isNotEmptyVal(currentItem.serviceStartDate) ? moment(currentItem.serviceStartDate).unix() : '' : '',
                        obj.serviceEndDate = angular.isDefined(currentItem.serviceEndDate) ? utils.isNotEmptyVal(currentItem.serviceEndDate) ? moment(currentItem.serviceEndDate).unix() : '' : '',
                        obj.treatmentType = angular.isDefined(currentItem.treatmentType) ? utils.isNotEmptyVal(currentItem.treatmentType) ? currentItem.treatmentType : '' : '',
                        obj.isDeleted = angular.isDefined(currentItem.isDeleted) ? utils.isEmptyVal(currentItem.isDeleted) ? 0 : currentItem.isDeleted : 0,
                        obj.medicalProviders = {
                            "contactId": angular.isDefined(currentItem.name) && (currentItem.name != null) ? parseInt(currentItem.name.contact_id) : '',
                        },
                        obj.physician = {
                            "contactId": angular.isDefined(currentItem.physicianId) && (currentItem.physicianId != null) ? parseInt(currentItem.physicianId.contact_id) : '',
                        }
                    if (obj.treatmentType == "" && obj.serviceEndDate == "" && obj.serviceEndDate == "" && obj.medicalProviders.contactId == "" && obj.physician.contactId == "") {

                    } else {
                        intakeMedicalProviderList.push(obj);
                    }



                }
                )
            }

            var medicalRecord = {
                intakeId: intakeId,
                //   intakeMedicalRecordId: intake_Medical.Treatment.intakeMedicalRecordId,
                //  serviceStartDate: angular.isDefined(intake_Medical.Treatment) ? utils.isNotEmptyVal(intake_Medical.Treatment.serviceStartDate) ? moment(intake_Medical.Treatment.serviceStartDate).unix() : '' : '',
                //  serviceEndDate: angular.isDefined(intake_Medical.Treatment) ? utils.isNotEmptyVal(intake_Medical.Treatment.serviceEndDate) ? moment(intake_Medical.Treatment.serviceEndDate).unix() : '' : '',
                //  treatmentType: angular.isDefined(intake_Medical.Treatment) ? utils.isEmptyVal(intake_Medical.Treatment.treatmentType) ? '' : intake_Medical.Treatment.treatmentType : '',
                medicalRecordComment: "",
                //  isDeleted: angular.isDefined(intake_Medical.Treatment) ? utils.isEmptyVal(intake_Medical.Treatment.isDeleted) ? 0 : intake_Medical.Treatment.isDeleted : 0,
                // medicalProviders: medicalrecordinfo,
                intakeMedicalProviders: intakeMedicalProviderList,
                // physician: angular.isDefined(intake_Medical.Treatment.physicianId) && (intake_Medical.Treatment.physicianId != null) ? { "contactId": intake_Medical.Treatment.physicianId.contact_id } : {},
                partyRole: "",
                recordDocumentId: "",
                createdBy: "",
                createdDate: "",
                modifiedBy: "",
                modifiedDate: "",
            }

            if (intake_Medical.intakePlaintiffId) {
                medicalRecord.associatedPartyId = intake_Medical.intakePlaintiffId;
            }
            return medicalRecord;
        }

        function setInsuranceInfo(insuranceData, intakeId, index) {
            var intake_insurance = angular.copy(insuranceData);
            var insurancerecordinfo = [];
            if (angular.isDefined(intake_insurance.healthInsurance) && angular.isDefined(intake_insurance.healthInsurance.insuredPartyList)) {
                _.forEach(intake_insurance.healthInsurance.insuredPartyList, function (currentItem) {
                    if (utils.isNotEmptyVal(currentItem.name)) {
                        insurancerecordinfo.push({ "contactId": currentItem.name.contact_id });
                    }
                })
            }

            var insuranceRecord = {
                intakeInsuranceId: intake_insurance.healthInsurance.intakeInsuranceId,
                intakeId: intakeId,
                policyLimit: angular.isDefined(intake_insurance.healthInsurance) ? utils.isEmptyVal(intake_insurance.healthInsurance.policyLimit) ? null : parseFloat(intake_insurance.healthInsurance.policyLimit) : null,
                policyLimitMax: angular.isDefined(intake_insurance.healthInsurance) ? utils.isEmptyVal(intake_insurance.healthInsurance.policyLimitMax) ? null : parseFloat(intake_insurance.healthInsurance.policyLimitMax) : null,
                insuranceType: "Health",
                type: "Health",
                memo: "",
                isDeleted: angular.isDefined(intake_insurance.healthInsurance) ? utils.isEmptyVal(intake_insurance.healthInsurance.isDeleted) ? 0 : intake_insurance.healthInsurance.isDeleted : 0,
                policyNumber: angular.isDefined(intake_insurance.healthInsurance) ? utils.isEmptyVal(intake_insurance.healthInsurance.policyNumber) ? '' : intake_insurance.healthInsurance.policyNumber : '',
                claimNumber: angular.isDefined(intake_insurance.healthInsurance) ? utils.isEmptyVal(intake_insurance.healthInsurance.claimNumber) ? '' : intake_insurance.healthInsurance.claimNumber : '',
                isDeductible: 0,
                insuranceProvider: angular.isDefined(intake_insurance.healthInsurance.insuranceProviderId) && (intake_insurance.healthInsurance.insuranceProviderId != null) ? { "contactId": intake_insurance.healthInsurance.insuranceProviderId.contact_id } : {},
                insuredParty: insurancerecordinfo,
                excessConfirmed: angular.isDefined(intake_insurance.healthInsurance) ? (intake_insurance.healthInsurance.excessConfirmed == 'dontknow') ? '' : intake_insurance.healthInsurance.excessConfirmed : '',
                policyExhausted: angular.isDefined(intake_insurance.healthInsurance) ? (intake_insurance.healthInsurance.policyExhausted == 'dontknow') ? '' : intake_insurance.healthInsurance.policyExhausted : '',
                insuranceDocumentId: 0,
                adjuster: null,
            }
            if (intake_insurance.intakePlaintiffId) {
                insuranceRecord.associatedPartyId = intake_insurance.intakePlaintiffId;
            }


            return insuranceRecord;
        }

        function setAutoMobileInsuranceInfo(autoMobileInsuranceData, intakeId, deleteList) {
            var intake_autoMobileInsurance = angular.copy(autoMobileInsuranceData);
            var autoMobileInsuranceRecord = {
                intakeInsuranceId: intake_autoMobileInsurance.intakeInsuranceId,
                intakeId: intakeId,
                insuranceType: "AutoMobile",
                type: intake_autoMobileInsurance.type ? intake_autoMobileInsurance.type : '',
                memo: "",
                isDeleted: intake_autoMobileInsurance.isDeleted ? intake_autoMobileInsurance.isDeleted : 0,
                policyLimit: null,
                policyNumber: intake_autoMobileInsurance.policyNumber ? intake_autoMobileInsurance.policyNumber : '',
                claimNumber: intake_autoMobileInsurance.claimNumber ? intake_autoMobileInsurance.claimNumber : '',
                isDeductible: 0,
                insuranceProvider: intake_autoMobileInsurance.insuranceProvider ? { "contactId": intake_autoMobileInsurance.insuranceProvider.contact_id } : {},
                insuredParty: intake_autoMobileInsurance.insuredParty ? [{ "contactId": intake_autoMobileInsurance.insuredParty.contact_id }] : [{}],
                policyLimitMax: null,
                insuranceDocumentId: 0,
                licenceNumber: intake_autoMobileInsurance.driverLiscenseNumber,
                licenceDuration: intake_autoMobileInsurance.timeheldLiscense,
                adjuster: intake_autoMobileInsurance.adjusterName ? { "contactId": intake_autoMobileInsurance.adjusterName.contact_id } : {},
            }

            if (intake_autoMobileInsurance.intakePlaintiffId) {
                autoMobileInsuranceRecord.associatedPartyId = intake_autoMobileInsurance.intakePlaintiffId;
            }
            return autoMobileInsuranceRecord;
        }

        function setOtherDriverInsuranceInfo(otherDeriverInsuranceData, intakeId, index) {
            var intake_otherDriverInsurance = angular.copy(otherDeriverInsuranceData);
            var otherDriverInsuranceRecord = {
                intakeInsuranceId: intake_otherDriverInsurance.otherDriverInsurance.intakeInsuranceId,
                intakeId: intakeId,
                insuranceType: "OtherDriver",
                type: angular.isDefined(intake_otherDriverInsurance.otherDriverInsurance) ? utils.isEmptyVal(intake_otherDriverInsurance.otherDriverInsurance.type) ? '' : intake_otherDriverInsurance.otherDriverInsurance.type : '',
                memo: "",
                isDeleted: angular.isDefined(intake_otherDriverInsurance.otherDriverInsurance) ? utils.isEmptyVal(intake_otherDriverInsurance.otherDriverInsurance.isDeleted) ? 0 : intake_otherDriverInsurance.otherDriverInsurance.isDeleted : 0,
                policyLimit: null,
                policyNumber: angular.isDefined(intake_otherDriverInsurance.otherDriverInsurance) ? utils.isEmptyVal(intake_otherDriverInsurance.otherDriverInsurance.policyNumber) ? '' : intake_otherDriverInsurance.otherDriverInsurance.policyNumber : '',
                claimNumber: angular.isDefined(intake_otherDriverInsurance.otherDriverInsurance) ? utils.isEmptyVal(intake_otherDriverInsurance.otherDriverInsurance.claimNumber) ? '' : intake_otherDriverInsurance.otherDriverInsurance.claimNumber : '',
                isDeductible: 0,
                insuranceProvider: angular.isDefined(intake_otherDriverInsurance.otherDriverInsurance.insuranceProvider) ? { "contactId": intake_otherDriverInsurance.otherDriverInsurance.insuranceProvider.contact_id } : {},
                insuredParty: angular.isDefined(intake_otherDriverInsurance.otherDriverInsurance.insuredParty) ? [{ "contactId": intake_otherDriverInsurance.otherDriverInsurance.insuredParty.contact_id }] : [{}],
                policyLimitMax: null,
                insuranceDocumentId: 0,
                adjuster: angular.isDefined(intake_otherDriverInsurance.otherDriverInsurance.adjusterName) ? { "contactId": intake_otherDriverInsurance.otherDriverInsurance.adjusterName.contact_id } : {},
            }
            if (intake_otherDriverInsurance.intakePlaintiffId) {
                otherDriverInsuranceRecord.associatedPartyId = intake_otherDriverInsurance.intakePlaintiffId;
            }

            return otherDriverInsuranceRecord;
        }

        function setModifiedDisplayDate(matterList) {
            _.forEach(matterList, function (matter) {
                matter.createdDate = (utils.isEmptyVal(matter.createdDate)) ? "-" : moment.unix(matter.createdDate).utc().format('MM/DD/YYYY');
            });
        }

        function getGridHeaders(isOngoing) {
            var headers = [
                {
                    field: [{
                        prop: 'intakeName',
                        href: { link: '#/intake/intake-overview', paramProp: ['intakeId'] }
                    }],
                    displayName: '<b>Lead Name</b>',
                    dataWidth: "25"
                },
                {
                    field: [{
                        prop: 'status_name',
                        filter: 'replaceByDash'
                    },
                    {
                        prop: 'sub_status_name',
                        filter: 'replaceByDash'
                    }
                    ],
                    displayName: '<b>Status & Substatus</b>',
                    dataWidth: "20"

                },
                {
                    field: [{
                        prop: 'intakeType',
                        filter: 'replaceByDash'
                    }, {
                        prop: 'intakeSubType',
                        filter: 'replaceByDash'
                    }, {
                        prop: 'intakeCategory',
                        filter: 'replaceByDash'
                    }],
                    displayName: '<b>Type, Subtype, Category</b>',
                    dataWidth: isOngoing ? "25" : "22"

                },
                {
                    field: [{
                        prop: 'createdDate'
                    }],
                    displayName: '<b>Date Created</b>',
                    dataWidth: isOngoing ? "17" : "10"

                }, //plaintiff column added  

                {
                    field: [{
                        prop: 'assignedUserNames'
                    }],
                    displayName: '<b>Assigned To</b>',
                    dataWidth: isOngoing ? "10" : "10"

                }
            ];

            if (!isOngoing) {
                headers.splice(4, 0,
                    {
                        field: [{
                            prop: 'migrationDate'
                        }],
                        displayName: '<b>Migrated Date</b>',
                        dataWidth: "10"
                    });
            }

            return headers;
        }

        function isMatterSelected(matterList, matter) {
            var ids = _.pluck(matterList, 'intakeId');
            return ids.indexOf(matter.intakeId) > -1;
        }

        function getFiltersObj(filters, getAll, masterList, intakeFlag) {

            var formattedFilters = {};
            _.forEach(masterList.status, function (item) {
                _.forEach(item.substatus, function (currentI) {
                    currentI.statusname = item.name;
                    currentI.statusid = item.id
                })
            })
            var statusData = getStatusFilter(filters, masterList);
            formattedFilters.intake_status_ids = angular.isUndefined(statusData) ? [] : statusData;
            // formattedFilters.intake_status_id = filters ? filters.intake_status_id : [];

            // formattedFilters.intake_sub_status_id = filters ? filters.intake_sub_status_id : [];

            formattedFilters.intake_type_id = filters ? filters.intake_type_id : [];

            formattedFilters.intake_category_id = filters ? filters.intake_category_id : [];

            formattedFilters.intake_sub_type_id = filters ? filters.intake_sub_type_id : [];

            formattedFilters.user_id = filters ? filters.user_id : [];

            formattedFilters.sortBy = filters.sortby == 1 ? 'intake_name' : filters.sortby == 2 ? 'intake_name DESC' : filters.sortby == 3 ? 'modified_date' : filters.sortby == 4 ? 'modified_date DESC' : '';

            formattedFilters.page_number = filters.pageNumber;

            formattedFilters.page_size = getAll ? 'all' : 250;

            formattedFilters.is_migrated = filters ? filters.is_migrated : 0;
            if (formattedFilters.is_migrated == 1) {
                formattedFilters.sortBy = filters.sortby == 1 ? 'intake_name' : filters.sortby == 2 ? 'intake_name DESC' : filters.sortby == 3 ? 'migrated_date ASC' : filters.sortby == 4 ? 'migrated_date DESC' : '';
            }

            formattedFilters.myIntake = intakeFlag;

            return formattedFilters;
        };

        function getStatusFilter(filters, masterList) {
            var statusFilter;
            var filter = angular.copy(filters);
            if (utils.isNotEmptyVal(filter.intake_status_id)) {
                var status = filter.intake_status_id;
                var substatus = filter.intake_sub_status_id;
                var getStatusAndSubStatus = [];
                //get status along with sub status in an array
                _.forEach(status, function (item) {
                    _.forEach(masterList.status, function (currentItem) {
                        if (item == currentItem.id) {
                            getStatusAndSubStatus.push(currentItem);
                        }
                    })
                })
                //push selected status and all substatus in an array
                var selectedSubStatus = [];
                _.forEach(getStatusAndSubStatus, function (currentItem) {
                    _.forEach(currentItem["substatus"], function (currentI) {
                        selectedSubStatus.push(currentI);
                    })
                })
                //push selected substatus in an array
                var selectedStatusAndSubStatus = [];
                _.forEach(substatus, function (item) {
                    _.forEach(selectedSubStatus, function (currentItem) {
                        if (item == currentItem.id) {
                            selectedStatusAndSubStatus.push(currentItem);
                        }
                    })

                });

                var getstatusIds = _.pluck(selectedStatusAndSubStatus, 'statusid');
                var diffStatus = _.difference(status, getstatusIds);
                if (diffStatus.length > 0) {
                    _.forEach(diffStatus, function (item) {
                        var evens = _.filter(masterList.status, function (rec) { return rec.id == item; });
                        selectedStatusAndSubStatus.push({
                            id: '',
                            name: '',
                            statusid: evens[0].id,
                            statusname: evens[0].name
                        })
                    })

                }

                //combine status with sub-status in an array
                var group_to_values = selectedStatusAndSubStatus.reduce(function (obj, item) {
                    obj[item.statusid] = obj[item.statusid] || [];
                    obj[item.statusid].push(item.id);
                    return obj;
                }, {});

                statusFilter = Object.keys(group_to_values).map(function (key) {
                    return { statusId: key, subStatusId: group_to_values[key] };
                });


                _.forEach(statusFilter, function (item) {
                    item.subStatusId = item.subStatusId.toString();
                })
            }
            return statusFilter;
        }

        function getArrayString(array) {
            var str = (array != null ? array.toString() : "");
            return "[" + str + "]";
        };

        function setStatuswiseFilter(filters, statuswiseId, intakeFlag) {
            //if statusFilter is not defined then assign statuswise id 
            if (angular.isUndefined(filters.statusFilter)) {
                //check if statuswise id is defined
                //this condition is to manager the page load call 
                //where self.selectionModel.statusWise.id is not defined
                //statuswise is assigned later in when we receive all the status
                if (angular.isDefined(statuswiseId)) {
                    filters.statusFilter = [statuswiseId];
                }
            } else {
                filters.statusFilter = [statuswiseId];
            }
        }

        function createFilterTags(filters, masterList, toBeExcluded, users) {
            var tags = [];
            //var postArray = ['intake_status_id', 'intake_sub_status_id', 'intake_type_id', 'intake_sub_type_id', 'intake_category_id'];
            var filterArray = [
                { type: 'category', list: 'category', filter: 'intake_category_id', tagname: 'Category' },
                { type: 'status', list: 'status', filter: 'intake_status_id', tagname: 'Status' },
                { type: 'substatus', list: 'subStatus', filter: 'intake_sub_status_id', tagname: 'Sub-Status' },
                { type: 'type', list: 'type', filter: 'intake_type_id', tagname: 'Type' },
                { type: 'subtype', list: 'subType', filter: 'intake_sub_type_id', tagname: 'Sub-Type' },
                { type: 'assignedto', list: 'user', filter: 'user_id', tagname: 'Assigned To' },
            ];

            _.forEach(filterArray, function (filterObj) {
                var filterData = getFilterValues(masterList, filterObj.list, filterObj.type);
                var appliedFilters = filters[filterObj.filter] && filters[filterObj.filter].length > 0 ? filters[filterObj.filter].toString().split(',') : null;

                _.forEach(appliedFilters, function (filterId) {
                    var selectedFilter = _.find(filterData, function (filter) {
                        return parseInt(filter.id) == parseInt(filterId);
                    });


                    if (angular.isDefined(selectedFilter)) {
                        selectedFilter.value = !selectedFilter.value || utils.isEmptyString(selectedFilter.value) ? '{Blank}' : selectedFilter.value;
                        selectedFilter.value = filterObj.tagname + ' : ' + selectedFilter.value;
                        tags.push(selectedFilter);
                    }
                });
            });


            if (utils.isNotEmptyVal(filters.substatusFilter)) {
                var statusId = filters.statusFilter instanceof Array ? filters.statusFilter : filters.statusFilter.split(',');
                var statusObj = [];
                _.forEach(statusId, function (item) {
                    _.forEach(masterList.statuses, function (currentItem) {
                        if (item == currentItem.id) {
                            statusObj.push(currentItem);
                        }
                    })
                })
                if (angular.isDefined(statusObj)) {
                    if (utils.isNotEmptyVal(filters.substatusFilter)) {
                        var selectedSubstatuses;
                        selectedSubstatuses = _.pluck(statusObj, 'substatus');
                        var appliedSubstatuses = utils.isNotEmptyVal(filters.substatusFilter) ? filters.substatusFilter.split(',') : filters.substatusFilter;
                        _.forEach(appliedSubstatuses, function (subStId) {
                            var subStObj = [];
                            _.forEach(selectedSubstatuses, function (currentItem) {
                                _.forEach(currentItem, function (item) {
                                    if (subStId == item.id) {
                                        if (utils.isEmptyString(item.name)) {
                                            item.name = '{Blank}';
                                        }
                                        subStObj.push(item);
                                    }
                                })
                            })
                            _.forEach(subStObj, function (subSt) {
                                var tagObj = {
                                    id: subSt.id,
                                    type: 'substatus',
                                    value: 'Sub-Status: ' + subSt.name
                                };
                                tags.push(tagObj);
                            })
                        })
                    }
                }
            }

            // set subtypes  
            if (utils.isNotEmptyVal(filters.subTypeFilter)) {

                var selectedTyp = _.find(masterList.type, function (typ) {
                    return typ.id === filters.typeFilter;
                });

                if (angular.isDefined(selectedTyp)) {
                    if (utils.isNotEmptyVal(filters.subTypeFilter)) {
                        var appliedSubTypes = filters.subTypeFilter.toString().split(',');
                        _.forEach(appliedSubTypes, function (appliedSubTyp) {
                            var selectedSubTyp = _.find(selectedTyp['subtype'], function (subtyp) {
                                return subtyp.id === appliedSubTyp;
                            });
                            if (angular.isDefined(selectedSubTyp)) {
                                if (utils.isEmptyString(selectedSubTyp.name)) {
                                    selectedSubTyp.name = "{Blank}";
                                }
                                var filterTag = {
                                    value: 'Sub-Type: ' + selectedSubTyp.name,
                                    type: 'subtype',
                                    id: selectedSubTyp.id
                                };
                                tags.push(filterTag);
                            }
                        });
                    }
                }
            }

            return tags;
        }

        function getFilterValues(masterList, filter, type) {
            if (masterList[filter]) {
                return masterList[filter].map(function (item) {
                    return {
                        id: type == "assignedto" ? item.userId : item.id,
                        value: type == "assignedto" ? item.fullName : item.name,
                        type: type || ''
                    };
                });
            } else {
                return {
                    id: null,
                    value: null,
                    type: type || ''
                };
            }

        }

        function excludeTags(tags, toBeExcluded) {
            delete toBeExcluded[""];

            angular.forEach(toBeExcluded, function (val, key) {
                var key = val.id;
                var index = _.findIndex(tags, function (tag) {
                    return ((parseInt(tag.id) === parseInt(key)) && tag.type == "statuses");
                });

                if (index != -1) {
                    tags.splice(index, 1);
                }
            });
        }
    }

})();
