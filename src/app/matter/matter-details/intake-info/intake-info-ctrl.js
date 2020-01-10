
(function () {

    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('intakeInfoCtrl', intakeInfoCtrl);

    intakeInfoCtrl.$inject = ['$q', 'IntakePlaintiffDataService', 'modalService', '$timeout',
        'notification-service', 'intakeFactory', 'globalConstants', 'masterData', 'intakeListHelper', 'matterFactory', '$stateParams', '$filter', 'contactFactory'];

    function intakeInfoCtrl($q, IntakePlaintiffDataService, modalService, $timeout,
        notificationService, intakeFactory, globalConstants, masterData, intakeListHelper, matterFactory, $stateParams, $filter, contactFactory) {
        var self = this;
        var matterId = $stateParams.matterId;
        matterFactory.setBreadcrumWithPromise(matterId, 'Details').then(function (resultData) {
            self.matterInfo = resultData;
        });

        self.dataReceived = false;
        self.selectedPlaintiffs = [];
        self.formatTypeaheadDisplay = formatTypeaheadDisplay;
        self.getContacts = getContacts;
        self.intakeName = {};
        self.totalIntake = 0;
        self.InsuranceInfo = {};
        self.Currentdate = new Date();
        self.pageNumber = 1;
        self.validateZipcode = validateZipcode;
        var initIntakeLimit = 50;
        self.intakeLimit = initIntakeLimit;
        var filtertext = localStorage.getItem("intake_filtertext");
        if (utils.isNotEmptyVal(filtertext)) {
            self.showSearch = true;
        };

        self.insuranceTypeList = angular.copy(globalConstants.insuranceTypeList);
        self.views = {
            Client_Details: "Client_Details",
            EmpAndEdu_Details: "EmpAndEdu_Details",
            Inci_Details: "Inci_Details",
            MedMal_Details: "MedMal_Details",
            Insurance_Details: "Insurance_Details",
            Other_Details: "Other_Details",
            Memo: "Memo",
            Details: "Details"
        };
        self.currentView = self.views.Client_Details;
        self.showView = function (view, noScroll) {
            self.currentView = view;
            if (!noScroll) {
                $('#intakeDetails').animate({
                    scrollTop: 0
                }, 500);
            }
        };
        self.intakeInfo = {};
        self.intakeObj = {};
        self.users = [];
        self.addIntakeFromEdit = {};
        self.list = [];
        self.addIntake = false;
        self.defendantRole = [
            { label: "Primary Defendant", value: "prime" },
            { label: "Secondary Defendant", value: "secondary" },
            { label: "3rd Party Defendant ", value: "tertiary" }
        ];
        self.genderList = [{ id: '1', name: 'Male' }, { id: '2', name: 'Female' }, { id: '3', name: 'Other' }, { id: '4', name: 'Not Specified' }];
        self.statusList = [{ id: '1', name: 'Alive' }, { id: '0', name: 'Deceased' }, { id: '2', name: 'Not Specified' }];
        self.typeOfPerson = [{ id: '1', name: 'Single' }, { id: '2', name: 'Married' }, { id: '4', name: 'Widowed' }, { id: '5', name: 'Other' }, { id: '3', name: 'Not Specified' }];
        self.optionList = [{ id: '1', name: 'Yes' }, { id: '2', name: 'No' }, { id: '3', name: "Don't Know" }];
        self.occupassionList = [{ id: '1', name: 'Driver' }, { id: '2', name: 'Passenger' }, { id: '3', name: 'Pedestrian' }, { id: '4', name: 'Cyclist' }];
        self.optionCircleList = [{ id: '1', name: 'MV accident' }, { id: '2', name: 'Med malpractice' }, { id: '3', name: 'Trip' }, { id: '4', name: 'Product Liab' }, { id: '5', name: 'Slip and Fall' }, { id: '6', name: 'Construc.' }, { id: '7', name: 'Premises' }];
        self.nameList = [{ id: 'nameList' }];
        self.addNewMedInsuranceProvider = addNewMedInsuranceProvider;
        self.addProviderListTreatment2 = addProviderListTreatment2;
        self.insuranceProviderList = [{ id: 'insuranceProviderList' }];
        self.deleteTreatment2InsuranceProviderList = deleteTreatment2InsuranceProviderList;
        self.insuredPartyList = [{ id: 'insuredPartyList' }];
        self.autoMobileList = [{ id: 'autoMobileList' }];
        self.typeOfAccident = [{ id: '1', name: 'Trip and Fall' }, { id: '2', name: 'Slip and Fall' }, { id: '3', name: 'Assault' }];
        self.typeOfBuilding = [{ id: '1', name: 'Commercial' }, { id: '2', name: 'Residential' }, { id: '3', name: 'City owned' }];
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

        self.addContactList = addContactList;
        self.deleteContactList = deleteContactList;

        self.addChildrenList = addChildrenList;
        self.deleteChildrenList = deleteChildrenList;

        self.datepickerOptions = {
            formatYear: 'yyyy',
            startingDay: 1,
            'show-weeks': false
        };
        self.dateFormat = 'MM/dd/yyyy';
        self.open = openCalender;
        self.incidentList = angular.copy(globalConstants.incidentList);
        self.injuredList = angular.copy(globalConstants.injuredList);
        self.updatePlaintiff = updatePlaintiff;
        self.stateshow = true;
        self.excessConfirmed = [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }, { label: "Don't Know", value: "dontknow" }];
        self.paymentBtns = [{ label: "Hourly", value: "1" },
        { label: "Weekly", value: "4" },
        { label: "Monthly", value: "2" },
        { label: "Yearly", value: "3" }
        ];
        self.intake_name = [];
        self.witnessNameList = [{ id: 'witnessNameList' }];
        self.witnessNameListForDetails = [{ id: 'witnessNameListForDetails' }];
        self.employerInfo = [];
        self.isDatesValid = isDatesValid;
        self.enableEditMode = enableEditMode;
        var allUsersData = getUsersInFirm('no_auth');
        var allMasterData = getMasterList('no_auth');
        self.addNewAutoInsuredPartyOther = addNewAutoInsuredPartyOther;
        self.uisorts = [
            { key: 'asc', name: "Name ASC", 'divider': 1 },
            { key: 'desc', name: "Name DESC", 'divider': '' }

        ];
        self.getSortOpbyApi = getSortOpbyApi;
        self.getOtherDetailsForMatter = getOtherDetailsForMatter;
        self.getIntakeDetails = getIntakeDetails;
        self.filterRetain = filterRetain;
        $q.all([allUsersData, allMasterData]).then(function (values) {
            self.viewModel.masterList.user = [];
            self.viewModel.masterList.user = self.users;
            getOtherDetailsForMatter(matterId);
            self.view = true;
            self.allDataFromMaster = masterData.getMasterData();
            self.countries = getArrayByName(self.allDataFromMaster.contries);
            self.states = getArrayByName(self.allDataFromMaster.states);

        });

        function getOtherDetailsForMatter(matterId) {
            intakeFactory.getOtherDetailsForMatter(matterId, 'no_auth')
                .then(function (response) {
                    self.plaintiffList = response;
                    self.list = angular.copy(self.plaintiffList);
                    if (sessionStorage.getItem("intake_otherDetailsretainSearchText")) {
                        var intake_otherDetailsretainSearchText = JSON.parse(sessionStorage.getItem("intake_otherDetailsretainSearchText"));
                        if (utils.isNotEmptyVal(intake_otherDetailsretainSearchText)) {
                            if (matterId != intake_otherDetailsretainSearchText.matterId) {
                                sessionStorage.removeItem("intake_otherDetailsretainSearchText");
                            }
                        }
                    }
                    var sort = null;
                    if (sessionStorage.getItem("intake_otherDetailsretainSort")) {
                        var intake_otherDetailsretainSort = JSON.parse(sessionStorage.getItem("intake_otherDetailsretainSort"));
                        if (utils.isNotEmptyVal(intake_otherDetailsretainSort)) {
                            if (matterId != intake_otherDetailsretainSort.matterId) {
                                sessionStorage.removeItem("intake_otherDetailsretainSort");
                            } else {
                                sort = intake_otherDetailsretainSort.sortbyapi;
                            }
                        }
                    }

                    if (sort == null) {
                        self.intake_sortBy = self.uisorts[0];
                        getSortOpbyApi(self.intake_sortBy, self.list);
                    } else {
                        getSortOpbyApi(sort, self.list);
                    }
                    var intakeId = self.plaintiffList[0].intake_id;
                    getIntakeDetails(intakeId);
                });
        }

        function getIntakeDetails(intakeId) {
            self.view = true;
            var data = '';
            if (sessionStorage.getItem("intake_otherDetailsretainSearchText")) {
                var intake_otherDetailsretainSearchText = JSON.parse(sessionStorage.getItem("intake_otherDetailsretainSearchText"));
                if (utils.isNotEmptyVal(intake_otherDetailsretainSearchText)) {
                    if (matterId != intake_otherDetailsretainSearchText.matterId) {
                        sessionStorage.removeItem("intake_otherDetailsretainSearchText");
                    } else {
                        data = intake_otherDetailsretainSearchText.retainSearchText;
                    }
                }
            }

            self.currentView = self.views.Client_Details;
            self.filterText = data ? data : '';
            self.intakeId = intakeId;
            if (utils.isNotEmptyVal(self.filterText)) {
                filterRetain(self.plaintiffList)
            } else {
                init();
            }
        }

        function filterRetain() {
            var filtertext = self.filterText;
            if (utils.isEmptyVal(self.filterText)) {
                self.plaintiffList = $filter('filter')(self.list, filtertext);
            } else {
                self.plaintiffList = $filter('filter')(self.plaintiffList, filtertext);
            }
            $timeout(function () {
                self.intakeId = self.plaintiffList[0].intake_id;
                init();
            }, 500);

            var intake_otherDetailsretainSearchText = {};
            intake_otherDetailsretainSearchText.matterId = matterId;
            intake_otherDetailsretainSearchText.retainSearchText = filtertext;
            sessionStorage.setItem("intake_otherDetailsretainSearchText", JSON.stringify(intake_otherDetailsretainSearchText));
        }
        function getUsersInFirm() {
            var defer = $q.defer();
            contactFactory.getUsersInFirm('no_auth')
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

        function getSortOpbyApi(sortbyapi, list, data) {
            var sortbyapi = _.find(self.uisorts, function (sortapi) {
                return sortapi.name == sortbyapi.name;
            });
            var array = angular.copy(list);
            var intake_name_list = angular.copy(self.list);
            switch (sortbyapi.key) {
                case 'asc':
                    var arraySortedAsc = _.sortBy(array, function (i) { return i.intake_name.toLowerCase() });
                    self.plaintiffList = arraySortedAsc;
                    var arraySortedAsc_list = _.sortBy(intake_name_list, function (i) { return i.intake_name.toLowerCase() });
                    self.list = arraySortedAsc_list;
                    break;
                case 'desc':
                    var arraySortedAsc = _.sortBy(array, function (i) { return i.intake_name.toLowerCase() });
                    var arraySortedDesc = arraySortedAsc.reverse();
                    self.plaintiffList = arraySortedDesc;
                    var arraySortedAsc_list = _.sortBy(intake_name_list, function (i) { return i.intake_name.toLowerCase() });
                    var arraySortedDesc_list = arraySortedAsc_list.reverse();
                    self.list = arraySortedDesc_list;
                    break;
            }
            var intake_otherDetailsretainSort = {};
            intake_otherDetailsretainSort.matterId = matterId;
            intake_otherDetailsretainSort.sortbyapi = sortbyapi;
            sessionStorage.setItem("intake_otherDetailsretainSort", JSON.stringify(intake_otherDetailsretainSort));

            self.intake_sortBy = sortbyapi;

        }

        function enableEditMode() {
            self.view = false;
            self.dataCopy = angular.copy(self.intake_name);
            $("textarea").attr("readonly", false);
        }

        function getMasterList() {
            var defer = $q.defer();
            intakeFactory.getMasterDataList('no_auth')
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
                    defer.resolve();
                }, function (reason) {
                    if (self.viewModel) {
                        self.viewModel.masterList = {};
                    }
                    defer.resolve();
                });
            return defer.promise;
        }

        self.deleteSelectedPlaintiffs = function (plaintiff, event) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                var promesa = IntakePlaintiffDataService.deletePlaintiffs(self.selectedPlaintiffs, 'no_auth');
                promesa.then(function (data) {
                    self.selectedPlaintiffs = [];
                    notificationService.success('Intake details deleted successfully.');
                    init();
                }, function (error) {
                    notificationService.error('An error occurred. Please try later.');
                });
            });
        };

        self.setSelectedPlaintiff = function (item) {
            $timeout(function () {
                item.checked = item.checked ? false : true;
                if (item.checked) {
                    self.selectedPlaintiffs.push(item.intakePlaintiffId);
                    self.clxGridOptions.selectedItems.push(item.intakePlaintiffId)

                } else {
                    var removeIndex = self.selectedPlaintiffs.indexOf(item.intakePlaintiffId);
                    self.selectedPlaintiffs.splice(removeIndex, 1);
                    _.forEach(self.clxGridOptions.selectedItems, function (selectedData, selectedDataIndex) {
                        if (selectedData == item.intakePlaintiffId) {
                            self.clxGridOptions.selectedItems.splice(selectedDataIndex, 1);
                        }
                    });

                }
            });
        }

        self.formatId = function (contact) {
            contact.contact_id = contact.contactId;
            return contact;
        }

        function init() {
            self.dataLoaderFlag = false;
            var dataObj = {
                "page_number": 1,
                "page_size": 250,
                "intake_id": self.intakeId,
                "is_migrated": 2
            };
            intakeFactory.getMatterList(dataObj, 'no_auth').then(function (resultData) {
                self.intakeInfo = resultData.intakeData && resultData.intakeData.length > 0 ? resultData.intakeData[0] : {};

                var category = _.findWhere(self.viewModel.masterList.category, { name: self.intakeInfo.intakeCategory.intakeCategoryName });
                var type = _.findWhere(self.viewModel.masterList.type, { name: self.intakeInfo.intakeType.intakeTypeName });
                var subType = type ? _.findWhere(type.subtype, { name: self.intakeInfo.intakeSubType.intakeSubTypeName }) : null;
                self.intakeInfo.category = category;
                self.intakeInfo.type = type;
                self.intakeInfo.subtype = subType;
                self.type = type ? type.id : null;
                self.subtype = subType ? subType.id : null;
                self.category = category ? category.id : null;

                if (self.type == 1 && self.subtype == 1) {
                    self.isOtherFormCombination = false;
                } else if (self.type == 1 && self.subtype == 2) {
                    self.isOtherFormCombination = false;
                } else if (self.type == 2) {
                    self.isOtherFormCombination = false;
                } else {
                    self.isOtherFormCombination = true;
                }

                intakeFactory.getPlaintiffByIntake(self.intakeId, 'no_auth')
                    .then(function (response) {
                        if (utils.isNotEmptyString(response)) {

                            self.intake_name = response;
                            intakeFactory.getOtherDetails(self.intakeId, 'no_auth')
                                .then(function (res) {
                                    var otherDetailsInfo = utils.isNotEmptyVal(res) ? JSON.parse(res[0].detailsJson) : null;
                                    self.otherDetailsID = utils.isNotEmptyVal(res) ? JSON.parse(res[0].detailId) : null;
                                    _.forEach(self.intake_name, function (item, index) {
                                        if (index == 0) { item.open = true; } else {
                                            item.open = false;
                                        }

                                        if (item.contact) {
                                            item.name = [item.contact.firstName, item.contact.lastName].join(" ");
                                        }
                                        item.basicInfo = {
                                            primaryLang: item.primaryLanguage,
                                            ssn: item.ssn,
                                            gender: utils.isNotEmptyVal(item.gender) ? item.gender == 'male' ? 1 : item.gender == 'female' ? 2 : item.gender == 'other' ? 3 : 4 : 4,
                                            dateOfBirth: utils.isNotEmptyVal(item.dateOfBirth) && item.dateOfBirth != 0 ? moment.unix(item.dateOfBirth).format("MM/DD/YYYY") : '',
                                            status_list: item.isAlive,
                                            dateOfDeath: utils.isNotEmptyVal(item.dateOfDeath) && item.dateOfDeath != 0 ? moment.unix(item.dateOfDeath).format("MM/DD/YYYY") : '',
                                        };

                                        if (utils.isNotEmptyVal(item.estateAdminId) || utils.isNotEmptyVal(item.poa)) {
                                            item.basicInfo.estateAdminId = utils.isNotEmptyVal(item.estateAdminId) ? self.formatContact(item.estateAdminId) : self.formatContact(item.poa);
                                        } else {
                                            item.basicInfo.estateAdminId = '';
                                        }

                                        item.EducationDetails = {
                                            InstituteName: utils.isEmptyVal(item.studentInstitution) ? '' : self.formatContact(item.studentInstitution),
                                            Program: utils.isEmptyVal(item.studentProgram) ? '' : item.studentProgram,
                                            DaysAbsent: utils.isEmptyVal(item.studentLostDays) ? '' : item.studentLostDays,
                                        };
                                        if (utils.isNotEmptyVal(item.defendants)) {
                                            item.defendantsData = {
                                                defendantDetails: [],
                                                defendantInfo: { defendantRole: "prime", gender: "Not Specified" }
                                            };
                                            _.forEach(item.defendants, function (itr) {
                                                item.defendantsData.defendantDetails.push({
                                                    contact: self.formatContact(itr.contact),
                                                    defendantRole: itr.defendantRole,
                                                    dateofbirth: utils.isNotEmptyVal(itr.dateofbirth) && itr.dateofbirth != 0 ? moment.unix(itr.dateofbirth).format("MM/DD/YYYY") : '',
                                                    ssn: utils.isNotEmptyVal(itr.ssn) ? itr.ssn : '',
                                                    gender: utils.isNotEmptyVal(itr.gender) ? itr.gender : ''
                                                });

                                            });
                                        } else {
                                            item.defendantsData = {
                                                defendantDetails: [],
                                                defendantInfo: { defendantRole: "prime", gender: "Not Specified" }
                                            };
                                        }

                                        if (utils.isNotEmptyVal(item.intakeEmployer)) {
                                            item.Employer = {
                                                employerDetails: [],
                                                EmployerInfo: { salarymode: "2", selectedsalaryMode: "Monthly" }
                                            };
                                            _.forEach(item.intakeEmployer, function (itr) {
                                                item.Employer.employerDetails.push({
                                                    iscurrent: itr.isCurrent.toString(),
                                                    EmployerName: utils.isNotEmptyVal(itr.contact) ? self.formatContact(itr.contact, 'witness') : {},
                                                    startDate: utils.isNotEmptyVal(itr.employmentStartDate) && itr.employmentStartDate != 0 ? moment.unix(itr.employmentStartDate) : '',
                                                    EndDate: utils.isNotEmptyVal(itr.employmentEndDate) && itr.employmentEndDate != 0 ? moment.unix(itr.employmentEndDate) : '',
                                                    startdate: utils.isNotEmptyVal(itr.employmentStartDate) && itr.employmentStartDate != 0 ? moment.unix(itr.employmentStartDate).format("MM/DD/YYYY") : '',
                                                    endDate: utils.isNotEmptyVal(itr.employmentEndDate) && itr.employmentEndDate != 0 ? moment.unix(itr.employmentEndDate).format("MM/DD/YYYY") : '',
                                                    Occupation: utils.isNotEmptyVal(itr.occupation) ? itr.occupation : '',
                                                    Position: utils.isNotEmptyVal(itr.position) ? itr.position : '',
                                                    salarymode: utils.isNotEmptyVal(itr.salaryMode) ? itr.salaryMode.toString() : '',
                                                    salaryModeLabel: utils.isNotEmptyVal(itr.salaryMode) ? self.salaryModeForEdit(itr) : '',
                                                    Salary: utils.isNotEmptyVal(itr.monthlySalary) ? itr.monthlySalary.toString() : '',
                                                    Description: utils.isNotEmptyVal(itr.memo) ? itr.memo : '',
                                                    DaysLost: utils.isNotEmptyVal(itr.lostDays) ? itr.lostDays : '',
                                                    intakeEmployerId: itr.intakeEmployerId,
                                                    isDeleted: itr.isDeleted
                                                });

                                            });
                                        } else {
                                            item.Employer = {
                                                employerDetails: [],
                                                EmployerInfo: { salarymode: "2", selectedsalaryMode: "Monthly" }
                                            };
                                        }

                                        if (utils.isNotEmptyVal(item.intakeWitnesses)) {
                                            item.witness = { witnessNameList: [] };
                                            _.forEach(item.intakeWitnesses, function (data, i) {
                                                item.witness.witnessNameList.push({
                                                    id: 'witnessNameList',
                                                    name: self.formatContact(data.contact, 'witness'),
                                                    intakeWitnessid: data.intakeWitnessid
                                                });
                                            });
                                        } else {
                                            item.witness = {};
                                            item.witness.witnessNameList = [{ id: 'witnessNameList' }];
                                        }

                                        if (utils.isNotEmptyVal(item.insuranceInfos)) {
                                            item.insuranceInfos = _.uniq(item.insuranceInfos, 'intakeInsuranceId');
                                            var autoMobileList = _.filter(item.insuranceInfos, { insuranceType: "AutoMobile" });
                                            autoMobileList = _.sortBy(autoMobileList, 'createdDate');
                                            var healthList = _.findWhere(item.insuranceInfos, { insuranceType: "Health" });
                                            var otherDriverList = _.findWhere(item.insuranceInfos, { insuranceType: "OtherDriver" });
                                            if (otherDriverList) {
                                                item.otherDriverInsurance = {
                                                    intakeInsuranceId: otherDriverList.intakeInsuranceId,
                                                    insuranceProvider: utils.isEmptyVal(otherDriverList.insuranceProvider) || _.isNull(otherDriverList.insuranceProvider) ? '' : self.formatContact(otherDriverList.insuranceProvider, 'witness'),
                                                    adjusterName: utils.isEmptyVal(otherDriverList.adjuster) || _.isNull(otherDriverList.adjuster) ? '' : self.formatContact(otherDriverList.adjuster, 'witness'),
                                                    policyNumber: utils.isEmptyVal(otherDriverList.policyNumber) ? '' : otherDriverList.policyNumber,
                                                    claimNumber: utils.isEmptyVal(otherDriverList.claimNumber) ? '' : otherDriverList.claimNumber,
                                                    type: angular.isDefined(otherDriverList.type) ? utils.isEmptyVal(otherDriverList.type) ? '' : otherDriverList.type : '',
                                                }
                                                _.forEach(otherDriverList.insuredParty, function (abc) {
                                                    item.otherDriverInsurance.insuredParty = utils.isEmptyVal(abc) ? {} : self.formatContact(abc, 'witness');
                                                })
                                            }

                                            if (healthList) {
                                                if (utils.isNotEmptyVal(healthList.insuredParty)) {
                                                    item.healthInsurance = { insuredPartyList: [] };
                                                    _.forEach(healthList.insuredParty, function (data) {
                                                        item.healthInsurance.insuredPartyList.push({
                                                            id: 'insuredPartyList',
                                                            name: self.formatContact(data, 'witness'),
                                                        });
                                                    });
                                                } else {
                                                    item.healthInsurance = { insuredPartyList: [{ id: 'insuredPartyList' }] };
                                                }
                                                item.healthInsurance.policyLimit = utils.isEmptyVal(healthList.policyLimit) ? '' : healthList.policyLimit.toString();
                                                item.healthInsurance.policyLimitMax = utils.isEmptyVal(healthList.policyLimitMax) ? '' : healthList.policyLimitMax.toString();
                                                item.healthInsurance.excessConfirmed = utils.isEmptyVal(healthList.excessConfirmed) ? 'dontknow' : healthList.excessConfirmed;
                                                item.healthInsurance.policyExhausted = utils.isEmptyVal(healthList.policyExhausted) ? 'dontknow' : healthList.policyExhausted;
                                                item.healthInsurance.intakeInsuranceId = healthList.intakeInsuranceId;
                                                item.healthInsurance.insuranceProviderId = utils.isEmptyVal(healthList.insuranceProvider) || _.isNull(healthList.insuranceProvider) ? null : self.formatContact(healthList.insuranceProvider, 'witness');
                                                item.healthInsurance.policyNumber = utils.isEmptyVal(healthList.policyNumber) ? '' : healthList.policyNumber;
                                                item.healthInsurance.claimNumber = utils.isEmptyVal(healthList.claimNumber) ? '' : healthList.claimNumber;


                                            } else {
                                                item.healthInsurance = { insuredPartyList: [{ id: 'insuredPartyList' }] };
                                                item.healthInsurance.excessConfirmed = 'dontknow';
                                                item.healthInsurance.policyExhausted = 'dontknow';
                                            }
                                            if (autoMobileList.length > 0) {
                                                item.automobileInsurance = {
                                                    autoMobileList: []
                                                };
                                                _.forEach(autoMobileList, function (data) {
                                                    var obj = {};
                                                    obj.id = 'autoMobileList'
                                                    obj.intakeInsuranceId = data.intakeInsuranceId;
                                                    obj.adjusterName = utils.isEmptyVal(data.adjuster) || _.isNull(data.adjuster) ? '' : self.formatContact(data.adjuster, 'witness');
                                                    obj.insuranceProvider = utils.isEmptyVal(data.insuranceProvider) || _.isNull(data.insuranceProvider) ? '' : self.formatContact(data.insuranceProvider, 'witness');
                                                    obj.policyNumber = utils.isEmptyVal(data.policyNumber) ? '' : data.policyNumber;
                                                    obj.claimNumber = utils.isEmptyVal(data.claimNumber) ? '' : data.claimNumber;
                                                    obj.type = angular.isDefined(data.type) ? utils.isEmptyVal(data.type) ? '' : data.type : '';
                                                    obj.driverLiscenseNumber = data.licenceNumber ? data.licenceNumber : '';
                                                    obj.timeheldLiscense = data.licenceDuration ? data.licenceDuration : '';
                                                    obj.intakeInsuranceId = data.intakeInsuranceId;
                                                    obj.isDeleted = data.isDeleted;
                                                    if (utils.isNotEmptyVal(data.insuredParty)) {
                                                        _.forEach(data.insuredParty, function (current) {
                                                            obj.insuredParty = self.formatContact(current, 'witness');
                                                        });
                                                    }
                                                    item.automobileInsurance.autoMobileList.push(obj);
                                                })
                                            } else {
                                                item.automobileInsurance = {
                                                    autoMobileList: [{
                                                        id: 'autoMobileList',
                                                        adjusterName: {},
                                                        insuranceProvider: {},
                                                        insuredParty: {},
                                                        type: '',
                                                        policyNumber: '',
                                                        claimNumber: '',
                                                        timeheldLiscense: '',
                                                        driverLiscenseNumber: '',
                                                        isDeleted: 0
                                                    }]
                                                };
                                            }
                                        } else {
                                            item.healthInsurance = { insuredPartyList: [{ id: 'insuredPartyList' }] };
                                            item.healthInsurance.excessConfirmed = 'dontknow';
                                            item.healthInsurance.policyExhausted = 'dontknow';
                                            item.healthInsurance.medicare = '3';
                                            item.healthInsurance.insuranceDetails = '3';
                                            item.healthInsurance.denied = '3';
                                            item.healthInsurance.State = '3';
                                            item.healthInsurance.deniedMedicare = '3';
                                            item.healthInsurance.medicareNext = '3';
                                            item.automobileInsurance = {
                                                autoMobileList: [{
                                                    id: 'autoMobileList',
                                                    adjusterName: {},
                                                    insuranceProvider: {},
                                                    insuredParty: {},
                                                    type: '',
                                                    policyNumber: '',
                                                    claimNumber: '',
                                                    timeheldLiscense: '',
                                                    driverLiscenseNumber: '',
                                                    isDeleted: 0
                                                }]
                                            };
                                            item.automobileInsurance.paymentsCoverage = '3';
                                            item.automobileInsurance.auto = '3';
                                            item.otherDriverInsurance = {};
                                        }

                                        if (utils.isNotEmptyVal(item.intakeMedicalRecords)) {
                                            _.forEach(item.intakeMedicalRecords, function (i) {
                                                if (utils.isNotEmptyVal(i.medicalProviders)) {
                                                    item.Treatment = { insuranceProviderList: [] };
                                                    _.forEach(i.medicalProviders, function (data) {
                                                        item.Treatment.insuranceProviderList.push({
                                                            id: 'insuranceProviderList',
                                                            name: self.formatContact(data, 'witness'),
                                                        });

                                                    });
                                                } else {
                                                    item.Treatment = { insuranceProviderList: [{ id: 'insuranceProviderList' }] };
                                                }
                                                item.Treatment.intakeMedicalRecordId = i.intakeMedicalRecordId;
                                                item.Treatment.physicianId = utils.isEmptyVal(i.physician) || _.isNull(i.physician) ? null : self.formatContact(i.physician, 'witness');
                                                item.Treatment.serviceStartDate = utils.isNotEmptyVal(i.serviceStartDate) && i.serviceStartDate != 0 ? moment.unix(i.serviceStartDate).format("MM/DD/YYYY") : '';
                                                item.Treatment.serviceEndDate = utils.isNotEmptyVal(i.serviceEndDate) && i.serviceEndDate != 0 ? moment.unix(i.serviceEndDate).format("MM/DD/YYYY") : '';
                                                item.Treatment.treatmentType = utils.isEmptyVal(i.treatmentType) ? '' : i.treatmentType;
                                                item.Treatment.memo = utils.isEmptyVal(item.memo) ? '' : item.memo;
                                            });

                                        } else {
                                            item.Treatment = {};
                                            item.Treatment.insuranceProviderList = [{ id: 'insuranceProviderList' }];
                                        }


                                        if (otherDetailsInfo) {
                                            _.forEach(otherDetailsInfo, function (currentItem) {
                                                if (currentItem.intakePlaintiffId == item.intakePlaintiffId) {
                                                    if (utils.isNotEmptyVal(item.insuranceInfos)) {
                                                        item.insuranceInfos = _.uniq(item.insuranceInfos, 'intakeInsuranceId');
                                                        _.forEach(item.insuranceInfos, function (info) {
                                                            if (info.insuranceType == "OtherDriver") {
                                                                item.otherDriverInsurance.yearOfVehicalOther = currentItem.yearOfVehicalOther;
                                                                item.otherDriverInsurance.modelOfVehicalOther = currentItem.modelOfVehicalOther;
                                                                item.otherDriverInsurance.colorOfVehicalOther = currentItem.colorOfVehicalOther;
                                                            }
                                                            if (info.insuranceType == "Health") {
                                                                item.healthInsurance.healthInsuranceFrom = utils.isEmptyVal(currentItem.healthInsuranceFrom) ? '' : currentItem.healthInsuranceFrom;
                                                                item.healthInsurance.describeDenial = utils.isEmptyVal(currentItem.describeDenial) ? '' : currentItem.describeDenial;
                                                                item.healthInsurance.describeDetails = utils.isEmptyVal(currentItem.describeDetails) ? '' : currentItem.describeDetails;
                                                                //health Insurance other details
                                                                item.healthInsurance.medicare = utils.isEmptyVal(currentItem.medicare) ? '3' : currentItem.medicare;
                                                                item.healthInsurance.insuranceDetails = utils.isEmptyVal(currentItem.insuranceDetails) ? '3' : currentItem.insuranceDetails;
                                                                item.healthInsurance.denied = utils.isEmptyVal(currentItem.denied) ? '3' : currentItem.denied;
                                                                item.healthInsurance.State = utils.isEmptyVal(currentItem.State) ? '3' : currentItem.State;
                                                                item.healthInsurance.deniedMedicare = utils.isEmptyVal(currentItem.deniedMedicare) ? '3' : currentItem.deniedMedicare;
                                                                item.healthInsurance.medicareNext = utils.isEmptyVal(currentItem.medicareNext) ? '3' : currentItem.medicareNext;
                                                            }
                                                            if (info.insuranceType == "AutoMobile") {
                                                                item.automobileInsurance.paymentsCoverage = utils.isEmptyVal(currentItem.paymentsCoverage) ? '3' : currentItem.paymentsCoverage;
                                                                item.automobileInsurance.auto = utils.isEmptyVal(currentItem.auto) ? '' : currentItem.auto;
                                                                item.automobileInsurance.coverage = utils.isEmptyVal(currentItem.coverage) ? '' : currentItem.coverage;
                                                                item.automobileInsurance.yearOfVehicalAuto = utils.isEmptyVal(currentItem.yearOfVehicalAuto) ? '' : currentItem.yearOfVehicalAuto;
                                                                item.automobileInsurance.modelOfVehicalAuto = utils.isEmptyVal(currentItem.modelOfVehicalAuto) ? '' : currentItem.modelOfVehicalAuto;
                                                                item.automobileInsurance.colorOfVehicalAuto = utils.isEmptyVal(currentItem.colorOfVehicalAuto) ? '' : currentItem.colorOfVehicalAuto;
                                                            }
                                                        });
                                                    } else {
                                                        //bug#14716 - Unable to update insurance info if blank intake migrate to MM
                                                        if (utils.isNotEmptyVal(currentItem)) {
                                                            item.otherDriverInsurance.yearOfVehicalOther = currentItem.yearOfVehicalOther;
                                                            item.otherDriverInsurance.modelOfVehicalOther = currentItem.modelOfVehicalOther;
                                                            item.otherDriverInsurance.colorOfVehicalOther = currentItem.colorOfVehicalOther;
                                                            item.healthInsurance.healthInsuranceFrom = utils.isEmptyVal(currentItem.healthInsuranceFrom) ? '' : currentItem.healthInsuranceFrom;
                                                            item.healthInsurance.describeDenial = utils.isEmptyVal(currentItem.describeDenial) ? '' : currentItem.describeDenial;
                                                            item.healthInsurance.describeDetails = utils.isEmptyVal(currentItem.describeDetails) ? '' : currentItem.describeDetails;
                                                            item.healthInsurance.medicare = utils.isEmptyVal(currentItem.medicare) ? '3' : currentItem.medicare;
                                                            item.healthInsurance.insuranceDetails = utils.isEmptyVal(currentItem.insuranceDetails) ? '3' : currentItem.insuranceDetails;
                                                            item.healthInsurance.denied = utils.isEmptyVal(currentItem.denied) ? '3' : currentItem.denied;
                                                            item.healthInsurance.State = utils.isEmptyVal(currentItem.State) ? '3' : currentItem.State;
                                                            item.healthInsurance.deniedMedicare = utils.isEmptyVal(currentItem.deniedMedicare) ? '3' : currentItem.deniedMedicare;
                                                            item.healthInsurance.medicareNext = utils.isEmptyVal(currentItem.medicareNext) ? '3' : currentItem.medicareNext;
                                                            item.automobileInsurance.paymentsCoverage = utils.isEmptyVal(currentItem.paymentsCoverage) ? '3' : currentItem.paymentsCoverage;
                                                            item.automobileInsurance.auto = utils.isEmptyVal(currentItem.auto) ? '' : currentItem.auto;
                                                            item.automobileInsurance.coverage = utils.isEmptyVal(currentItem.coverage) ? '' : currentItem.coverage;
                                                            item.automobileInsurance.yearOfVehicalAuto = utils.isEmptyVal(currentItem.yearOfVehicalAuto) ? '' : currentItem.yearOfVehicalAuto;
                                                            item.automobileInsurance.modelOfVehicalAuto = utils.isEmptyVal(currentItem.modelOfVehicalAuto) ? '' : currentItem.modelOfVehicalAuto;
                                                            item.automobileInsurance.colorOfVehicalAuto = utils.isEmptyVal(currentItem.colorOfVehicalAuto) ? '' : currentItem.colorOfVehicalAuto;
                                                        }
                                                    }
                                                    if (utils.isNotEmptyVal(item.intakeMedicalRecords)) {
                                                        _.forEach(item.intakeMedicalRecords, function (i) {
                                                            item.Treatment.memo = utils.isEmptyVal(currentItem.memo) ? '' : currentItem.memo;

                                                        });

                                                    }
                                                    item.basicInfo.nationality = currentItem.nationality;
                                                    item.basicInfo.placeOfBirth = currentItem.placeOfBirth;

                                                    item.maritalStatus = {
                                                        typeOfPerson: utils.isEmptyVal(currentItem.typeOfPerson) ? 'Not Specified' : currentItem.typeOfPerson,
                                                        spouseName: utils.isEmptyVal(currentItem.spouseName) ? '' : currentItem.spouseName,
                                                        street: utils.isEmptyVal(currentItem.street) ? '' : currentItem.street,
                                                        state: utils.isEmptyVal(currentItem.state) ? '' : currentItem.state,
                                                        zipCode: utils.isEmptyVal(currentItem.zipCode) ? '' : currentItem.zipCode,
                                                        country: utils.isEmptyVal(currentItem.country) ? 'United States' : currentItem.country,

                                                        city: utils.isEmptyVal(currentItem.city) ? '' : currentItem.city,
                                                        showMarriedDetails: utils.isNotEmptyVal(currentItem.typeOfPerson) && currentItem.typeOfPerson == "Married" ? true : false,
                                                        contactList: utils.isEmptyVal(currentItem.contactList) ? [{
                                                            id: 'phone' + response + (length + 1),
                                                            contactTypeName: 'Cell'
                                                        }] : currentItem.contactList,
                                                        childrenList: utils.isEmptyVal(currentItem.childrenList) ? [{
                                                            id: 'childrenList' + response + (length + 1)
                                                        }] : currentItem.childrenList
                                                    };
                                                    item.IncidentDetails = {
                                                        Description: utils.isEmptyVal(currentItem.Description) ? '' : currentItem.Description,
                                                        injuredareas: utils.isEmptyVal(currentItem.injuredareas) ? '' : currentItem.injuredareas,
                                                    };

                                                    item.propertyDamaged = {
                                                        optionDamaged: angular.isDefined(currentItem.optionDamaged) ? currentItem.optionDamaged : '3',
                                                        describe: utils.isEmptyVal(currentItem.describe) ? '' : currentItem.describe,
                                                        optionTowed: angular.isDefined(currentItem.optionTowed) ? currentItem.optionTowed : '3',
                                                        describeTowed: utils.isEmptyVal(currentItem.describeTowed) ? '' : currentItem.describeTowed,
                                                        optionEstimate: angular.isDefined(currentItem.optionEstimate) ? currentItem.optionEstimate : '3',
                                                        estimateToRepair: utils.isEmptyVal(currentItem.estimateToRepair) ? '' : currentItem.estimateToRepair,
                                                        optionPhotographs: angular.isDefined(currentItem.optionPhotographs) ? currentItem.optionPhotographs : '3',
                                                        proDamaged: utils.isEmptyVal(currentItem.proDamaged) ? '3' : currentItem.proDamaged,
                                                        propDamage: utils.isEmptyVal(currentItem.propDamage) ? '' : currentItem.propDamage,

                                                    };

                                                    item.History = {
                                                        accidentPrior: utils.isEmptyVal(currentItem.accidentPrior) ? '' : currentItem.accidentPrior,
                                                        priorLaw: utils.isEmptyVal(currentItem.priorLaw) ? '' : currentItem.priorLaw,
                                                        typeAccident: utils.isEmptyVal(currentItem.typeAccident) ? '' : currentItem.typeAccident,
                                                        whenWhere: utils.isEmptyVal(currentItem.whenWhere) ? '' : currentItem.whenWhere,
                                                        isInjured: utils.isEmptyVal(currentItem.isInjured) ? '' : currentItem.isInjured,
                                                        selectInjuries: utils.isEmptyVal(currentItem.selectInjuries) ? '' : currentItem.selectInjuries,
                                                        reInjured: utils.isEmptyVal(currentItem.reInjured) ? '' : currentItem.reInjured,
                                                        notes: utils.isEmptyVal(currentItem.notes) ? '' : currentItem.notes,
                                                    };

                                                    item.injuryClaims = {
                                                        claimLawsuit: utils.isEmptyVal(currentItem.claimLawsuit) ? '3' : currentItem.claimLawsuit,
                                                        natureOfClaim: utils.isEmptyVal(currentItem.natureOfClaim) ? '' : currentItem.natureOfClaim,
                                                        detailsClaimLawsit: utils.isEmptyVal(currentItem.detailsClaimLawsit) ? '' : currentItem.detailsClaimLawsit,
                                                        dateClaimLawsit: utils.isEmptyVal(currentItem.dateClaimLawsit) ? null : moment(currentItem.dateClaimLawsit).format('MM/DD/YYYY')
                                                    };
                                                    item.disabilityClaims = {
                                                        SSD: utils.isEmptyVal(currentItem.SSD) ? '3' : currentItem.SSD,
                                                        natureOfDisability: utils.isEmptyVal(currentItem.natureOfDisability) ? '' : currentItem.natureOfDisability,
                                                        dateDeterminedDisabled: utils.isEmptyVal(currentItem.dateDeterminedDisabled) ? null : moment(currentItem.dateDeterminedDisabled).format('MM/DD/YYYY'),
                                                        nature: utils.isEmptyVal(currentItem.nature) ? '' : currentItem.nature,
                                                        describeNature: utils.isEmptyVal(currentItem.describeNature) ? '' : currentItem.describeNature,
                                                    };
                                                    item.militaryService = {
                                                        service: utils.isEmptyVal(currentItem.service) ? '3' : currentItem.service,
                                                        serviceBranch: utils.isEmptyVal(currentItem.serviceBranch) ? '' : currentItem.serviceBranch,
                                                        serviceNumber: utils.isEmptyVal(currentItem.serviceNumber) ? '' : currentItem.serviceNumber,
                                                        datesOfService: utils.isEmptyVal(currentItem.datesOfService) ? null : moment(currentItem.datesOfService).format('MM/DD/YYYY'),
                                                        typeOfDischarge: utils.isEmptyVal(currentItem.typeOfDischarge) ? '' : currentItem.typeOfDischarge,
                                                        awardsReceived: utils.isEmptyVal(currentItem.awardsReceived) ? '' : currentItem.awardsReceived,
                                                        information: utils.isEmptyVal(currentItem.information) ? '' : currentItem.information,
                                                        percentage: utils.isEmptyVal(currentItem.percentage) ? '' : currentItem.percentage,
                                                        injuredparts: utils.isEmptyVal(currentItem.injuredparts) ? '' : currentItem.injuredparts,
                                                        injuries: utils.isEmptyVal(currentItem.injuries) ? '3' : currentItem.injuries,
                                                        describeMilitary: utils.isEmptyVal(currentItem.describeMilitary) ? '' : currentItem.describeMilitary,
                                                    };
                                                    item.incidentDoubleCheck = {
                                                        claimDoubleCheck: utils.isEmptyVal(currentItem.claimDoubleCheck) ? '3' : currentItem.claimDoubleCheck,
                                                        describeCarAccident: utils.isEmptyVal(currentItem.describeCarAccident) ? '' : currentItem.describeCarAccident,
                                                        noClaim: utils.isEmptyVal(currentItem.noClaim) ? '3' : currentItem.noClaim,
                                                        describeInjured: utils.isEmptyVal(currentItem.describeInjured) ? '' : currentItem.describeInjured,
                                                        MRIorCTScan: utils.isEmptyVal(currentItem.MRIorCTScan) ? '3' : currentItem.MRIorCTScan,
                                                        describeMRIOrCT: utils.isEmptyVal(currentItem.describeMRIOrCT) ? '' : currentItem.describeMRIOrCT,
                                                    };
                                                    item.addictionOrtreatment = {
                                                        alcoholorDrug: utils.isEmptyVal(currentItem.alcoholorDrug) ? '3' : currentItem.alcoholorDrug,
                                                        describeAlcohol: utils.isEmptyVal(currentItem.describeAlcohol) ? '' : currentItem.describeAlcohol,
                                                    };
                                                    item.assistanceAndSupport = {
                                                        lawsuit: utils.isEmptyVal(currentItem.lawsuit) ? '3' : currentItem.lawsuit,
                                                        describeLawsuit: utils.isEmptyVal(currentItem.describeLawsuit) ? '' : currentItem.describeLawsuit,
                                                        judgments: utils.isEmptyVal(currentItem.judgments) ? '3' : currentItem.judgments,
                                                        describeJudgmentsPending: utils.isEmptyVal(currentItem.describeJudgmentsPending) ? '' : currentItem.describeJudgmentsPending,
                                                        aidType: utils.isEmptyVal(currentItem.aidType) ? '3' : currentItem.aidType,
                                                        stateAid: utils.isEmptyVal(currentItem.stateAid) ? '' : currentItem.stateAid,
                                                        obligation: utils.isEmptyVal(currentItem.obligation) ? '3' : currentItem.obligation,
                                                        childSupport: utils.isEmptyVal(currentItem.childSupport) ? '' : currentItem.childSupport,
                                                    };
                                                    item.bankruptcy = {
                                                        court: utils.isEmptyVal(currentItem.court) ? '3' : currentItem.court,
                                                        describeBankruptcyCourt: utils.isEmptyVal(currentItem.describeBankruptcyCourt) ? '' : currentItem.describeBankruptcyCourt,
                                                        contemplat: utils.isEmptyVal(currentItem.contemplat) ? '3' : currentItem.contemplat,
                                                        contemplatingFilling: utils.isEmptyVal(currentItem.contemplatingFilling) ? '' : currentItem.contemplatingFilling,
                                                    };
                                                    item.workerCompensation = {
                                                        claim: utils.isEmptyVal(currentItem.claim) ? '3' : currentItem.claim,
                                                        describeClaim: utils.isEmptyVal(currentItem.describeClaim) ? '' : currentItem.describeClaim,
                                                        listHealthCare: utils.isEmptyVal(currentItem.listHealthCare) ? '' : currentItem.listHealthCare,
                                                    };
                                                    item.criminalOrMotorVehical = {
                                                        convictions: utils.isEmptyVal(currentItem.convictions) ? '3' : currentItem.convictions,
                                                        describeConvictions: utils.isEmptyVal(currentItem.describeConvictions) ? '' : currentItem.describeConvictions,
                                                        dateCriminal: utils.isEmptyVal(currentItem.dateCriminal) ? null : moment(currentItem.dateCriminal).format('MM/DD/YYYY'),
                                                        describeJudgmentsPending: utils.isEmptyVal(currentItem.describeJudgmentsPending) ? '' : currentItem.describeJudgmentsPending,
                                                        placeCriminal: utils.isEmptyVal(currentItem.placeCriminal) ? '' : currentItem.placeCriminal,
                                                        detailsCriminal: utils.isEmptyVal(currentItem.detailsCriminal) ? '' : currentItem.detailsCriminal,
                                                        incarcerate: utils.isEmptyVal(currentItem.incarcerate) ? '3' : currentItem.incarcerate,
                                                    };
                                                    item.eyesOrEars = {
                                                        aid: utils.isEmptyVal(currentItem.aid) ? '3' : currentItem.aid,
                                                        describeAid: utils.isEmptyVal(currentItem.describeAid) ? '' : currentItem.describeAid,
                                                    };
                                                    item.parentalCare = {
                                                        prenatalVisit: utils.isEmptyVal(currentItem.prenatalVisit) ? '' : currentItem.prenatalVisit,
                                                        dueDate: utils.isEmptyVal(currentItem.dueDate) ? '' : currentItem.dueDate,
                                                        nameAndAddress1Parental: utils.isEmptyVal(currentItem.nameAndAddress1Parental) ? '' : currentItem.nameAndAddress1Parental,
                                                        nameAndAddress2Parental: utils.isEmptyVal(currentItem.nameAndAddress2Parental) ? '' : currentItem.nameAndAddress2Parental,
                                                        nameAndAddress3Parental: utils.isEmptyVal(currentItem.nameAndAddress3Parental) ? '' : currentItem.nameAndAddress3Parental,
                                                        street: utils.isEmptyVal(currentItem.streetPrenatal) ? '' : currentItem.streetPrenatal,
                                                        country: utils.isEmptyVal(currentItem.countryPrenatal) ? 'United States' : currentItem.countryPrenatal,
                                                        City: utils.isEmptyVal(currentItem.parentalCity) ? '' : currentItem.parentalCity,
                                                        state: utils.isEmptyVal(currentItem.statePrenatal) ? '' : currentItem.statePrenatal,
                                                        zIPCode: utils.isEmptyVal(currentItem.zIPCode) ? '' : currentItem.zIPCode,
                                                    };
                                                    item.birthInformation = {
                                                        serviceProvider: utils.isEmptyVal(currentItem.birthInfoServiceProvider) ? '' : currentItem.birthInfoServiceProvider.serviceProvider,
                                                        physicianName: utils.isEmptyVal(currentItem.physicianName) ? '' : currentItem.physicianName,
                                                        birthDateInfo: utils.isEmptyVal(currentItem.birthDateInfo) ? '' : currentItem.birthDateInfo,
                                                        timeOfBirthInfo: utils.isEmptyVal(currentItem.timeOfBirthInfo) ? '' : currentItem.timeOfBirthInfo,
                                                        dateOfTimeInfo: utils.isEmptyVal(currentItem.dateOfTimeInfo) ? '' : currentItem.dateOfTimeInfo,
                                                        labor: utils.isEmptyVal(currentItem.labor) ? '' : currentItem.labor,
                                                        dateWaterBroke: utils.isEmptyVal(currentItem.dateWaterBroke) ? '' : currentItem.dateWaterBroke,
                                                        timeWaterBroke: utils.isEmptyVal(currentItem.timeWaterBroke) ? '' : currentItem.timeWaterBroke,
                                                        childDateOFBirth: utils.isEmptyVal(currentItem.childDateOFBirth) ? '' : currentItem.childDateOFBirth,
                                                        timeOfBirth: utils.isEmptyVal(currentItem.timeOfBirth) ? '' : currentItem.timeOfBirth,
                                                        birthDateDischarge: utils.isEmptyVal(currentItem.birthDateDischarge) ? '' : currentItem.birthDateDischarge,
                                                        pediatriciansName: utils.isEmptyVal(currentItem.pediatriciansName) ? '' : currentItem.pediatriciansName,
                                                        neurologistsName: utils.isEmptyVal(currentItem.neurologistsName) ? '' : currentItem.neurologistsName,
                                                        contactList: utils.isEmptyVal(currentItem.birthContactList) ? '' : currentItem.birthContactList
                                                    };

                                                    if (utils.isEmptyString(item.birthInformation.contactList)) {
                                                        item.birthInformation.contactList = [];
                                                        item.birthInformation.contactList.push({
                                                            id: 'phone' + item.intakePlaintiffId + (item.birthInformation.contactList.length + 1),
                                                            contactTypeName: 'Cell'
                                                        });
                                                    }

                                                    if (utils.isEmptyVal(currentItem.otherdetails)) {
                                                        item.otherdetails = {};
                                                    } else {
                                                        item.otherdetails = currentItem.otherdetails;
                                                    }

                                                    if (utils.isEmptyVal(currentItem.Treatment2)) {
                                                        item.Treatment2 = {};
                                                        item.Treatment2.insuranceProviderList = [{ id: 'insuranceProviderList' }];
                                                    } else {
                                                        item.Treatment2 = currentItem.Treatment2;
                                                        item.Treatment2.insuranceProviderList = angular.isDefined(item.Treatment2.insuranceProviderList) ? utils.isNotEmptyVal(item.Treatment2.insuranceProviderList) ? item.Treatment2.insuranceProviderList : [{ id: 'insuranceProviderList' }] : [{ id: 'insuranceProviderList' }];
                                                    }

                                                    if (utils.isEmptyVal(currentItem.damage)) {
                                                        item.damage = {};
                                                    } else {
                                                        item.damage = currentItem.damage;
                                                        if (item.damage && item.damage.deathDate) {
                                                            item.damage.deathDate = moment.unix(item.damage.deathDate).format('MM/DD/YYYY');
                                                        }
                                                    }

                                                    if (utils.isEmptyVal(currentItem.inciDetail)) {
                                                        item.inciDetail = {};
                                                    } else {
                                                        item.inciDetail = currentItem.inciDetail;
                                                    }

                                                    if (utils.isEmptyVal(currentItem.OtherMemo)) {
                                                        item.OtherMemo = {};
                                                    } else {
                                                        item.OtherMemo = currentItem.OtherMemo;
                                                    }

                                                    if (utils.isEmptyVal(currentItem.mvaTreatment)) {
                                                        item.mvaTreatment = {};
                                                        item.mvaTreatment.optionAmbulance = '3';
                                                        item.mvaTreatment.emsinfo = '3';
                                                        item.mvaTreatment.optionInjuries = '3';
                                                    } else {
                                                        item.mvaTreatment = currentItem.mvaTreatment;
                                                        item.mvaTreatment.hospPhysicianId = angular.isDefined(currentItem.mvaTreatment.hospPhysicianId) ? utils.isNotEmptyVal(currentItem.mvaTreatment.hospPhysicianId) ? self.formatContact(currentItem.mvaTreatment.hospPhysicianId) : '' : '',
                                                            item.mvaTreatment.optionAmbulance = angular.isDefined(item.mvaTreatment.optionAmbulance) ? item.mvaTreatment.optionAmbulance : '3';
                                                        item.mvaTreatment.emsinfo = angular.isDefined(item.mvaTreatment.emsinfo) ? item.mvaTreatment.emsinfo : '3';
                                                        item.mvaTreatment.optionInjuries = angular.isDefined(item.mvaTreatment.optionInjuries) ? item.mvaTreatment.optionInjuries : '3';
                                                    }

                                                    if (utils.isEmptyVal(currentItem.MiscellaneousMedMal)) {
                                                        item.MiscellaneousMedMal = {};
                                                        item.MiscellaneousMedMal.medicalRecordCopies = 'dontknow';
                                                        item.MiscellaneousMedMal.havePhotos = 'dontknow';
                                                    } else {
                                                        item.MiscellaneousMedMal = currentItem.MiscellaneousMedMal;
                                                        item.MiscellaneousMedMal.medicalRecordCopies = utils.isEmptyVal(item.MiscellaneousMedMal.medicalRecordCopies) ? 'dontknow' : item.MiscellaneousMedMal.medicalRecordCopies;
                                                        item.MiscellaneousMedMal.havePhotos = utils.isEmptyVal(item.MiscellaneousMedMal.havePhotos) ? 'dontknow' : item.MiscellaneousMedMal.havePhotos;
                                                    }

                                                    if (utils.isEmptyVal(currentItem.healthMedicare)) {
                                                        item.healthMedicare = {};
                                                    } else {
                                                        item.healthMedicare = currentItem.healthMedicare;
                                                    }

                                                    if (utils.isEmptyVal(currentItem.MedMalDetails)) {
                                                        item.MedMalDetails = {};
                                                    } else {
                                                        item.MedMalDetails = currentItem.MedMalDetails;
                                                    }

                                                    if (utils.isEmptyVal(currentItem.MedMal)) {
                                                        item.MedMal = {};
                                                    } else {
                                                        item.MedMal = currentItem.MedMal;
                                                        item.MedMal.insuranceProviderId = angular.isDefined(item.MedMal.insuranceProviderId) ? utils.isNotEmptyVal(item.MedMal.insuranceProviderId) ? self.formatContact(item.MedMal.insuranceProviderId) : '' : '';
                                                    }

                                                    if (utils.isEmptyVal(currentItem.mvaIncident)) {
                                                        item.mvaIncident = {};
                                                        item.mvaIncident.timeAccident = new Date(1970, 0, 1, 0, 0, 0);
                                                        if (item.mvaIncident && item.mvaIncident.country) {
                                                            item.mvaIncident.country = "United States";
                                                        }
                                                        item.mvaIncident.reportToPolice = '3';
                                                        item.mvaIncident.mvField = '3';
                                                        item.mvaIncident.clientCopy = '3';

                                                    } else {
                                                        item.mvaIncident = currentItem.mvaIncident;
                                                        item.mvaIncident.timeAccident = utils.isNotEmptyVal(item.mvaIncident.timeAccident) ? new Date(item.mvaIncident.timeAccident) : new Date(1970, 0, 1, 0, 0, 0);
                                                        item.mvaIncident.reportToPolice = angular.isDefined(item.mvaIncident.reportToPolice) ? item.mvaIncident.reportToPolice : '3';
                                                        item.mvaIncident.mvField = angular.isDefined(item.mvaIncident.mvField) ? item.mvaIncident.mvField : '3';
                                                        item.mvaIncident.clientCopy = angular.isDefined(item.mvaIncident.clientCopy) ? item.mvaIncident.clientCopy : '3';
                                                        item.mvaIncident.mv104Date = utils.isNotEmptyVal(item.mvaIncident.mv104Date) ? moment(item.mvaIncident.mv104Date).format("MM/DD/YYYY") : null;
                                                        if (self.intakeInfo.accidentDate && self.type == 1 && self.subtype == 1) {
                                                            item.mvaIncident.incidentDate = utils.isNotEmptyVal(self.intakeInfo.accidentDate) ? moment.unix(self.intakeInfo.accidentDate).utc().format("MM/DD/YYYY") : null;
                                                            item.mvaIncident.incidentDateCopy = moment.unix(self.intakeInfo.accidentDate).utc().format("dddd");
                                                        }
                                                    }

                                                    if (utils.isEmptyVal(currentItem.automobileOtherDetails)) {
                                                        item.automobileOtherDetails = {};
                                                        item.automobileOtherDetails.nofaultInsurance = '3';
                                                        item.automobileOtherDetails.accidentReportedCompany = '3';
                                                        item.automobileOtherDetails.noFaultClaim = '3';
                                                        item.automobileOtherDetails.clientCopy = '3';
                                                        item.automobileOtherDetails.hitAndRun = '3';
                                                        item.automobileOtherDetails.hitAndRunNotice = '3';
                                                        item.automobileOtherDetails.deathCertificate = '3';
                                                        item.automobileOtherDetails.client_Copy = '3';
                                                        item.automobileOtherDetails.clientVehicle = '3';
                                                        item.automobileOtherDetails.auto = '3';
                                                    } else {
                                                        item.automobileOtherDetails = currentItem.automobileOtherDetails;
                                                        item.automobileOtherDetails.insuredParty = angular.isDefined(item.automobileOtherDetails.insuredParty) ? utils.isNotEmptyVal(item.automobileOtherDetails.insuredParty) ? self.formatContact(item.automobileOtherDetails.insuredParty) : '' : '';														// item.automobileOtherDetails.paymentsCoverage = utils.isEmptyVal(currentItem.automobileOtherDetails.paymentsCoverage) ? '3' : currentItem.automobileOtherDetails.paymentsCoverage;
                                                        item.automobileOtherDetails.nofaultInsurance = utils.isEmptyVal(currentItem.automobileOtherDetails.nofaultInsurance) ? '3' : currentItem.automobileOtherDetails.nofaultInsurance;
                                                        item.automobileOtherDetails.accidentReportedCompany = utils.isEmptyVal(currentItem.automobileOtherDetails.accidentReportedCompany) ? '3' : currentItem.automobileOtherDetails.accidentReportedCompany;
                                                        item.automobileOtherDetails.noFaultClaim = utils.isEmptyVal(currentItem.automobileOtherDetails.noFaultClaim) ? '3' : currentItem.automobileOtherDetails.noFaultClaim;
                                                        item.automobileOtherDetails.clientCopy = utils.isEmptyVal(currentItem.automobileOtherDetails.clientCopy) ? '3' : currentItem.automobileOtherDetails.clientCopy;
                                                        item.automobileOtherDetails.hitAndRun = utils.isEmptyVal(currentItem.automobileOtherDetails.hitAndRun) ? '3' : currentItem.automobileOtherDetails.hitAndRun;
                                                        item.automobileOtherDetails.hitAndRunNotice = utils.isEmptyVal(currentItem.automobileOtherDetails.hitAndRunNotice) ? '3' : currentItem.automobileOtherDetails.hitAndRunNotice;
                                                        item.automobileOtherDetails.deathCertificate = utils.isEmptyVal(currentItem.automobileOtherDetails.deathCertificate) ? '3' : currentItem.automobileOtherDetails.deathCertificate;
                                                        item.automobileOtherDetails.client_Copy = utils.isEmptyVal(currentItem.automobileOtherDetails.client_Copy) ? '3' : currentItem.automobileOtherDetails.client_Copy;
                                                        item.automobileOtherDetails.clientVehicle = utils.isEmptyVal(currentItem.automobileOtherDetails.clientVehicle) ? '3' : currentItem.automobileOtherDetails.clientVehicle;
                                                        item.automobileOtherDetails.auto = utils.isEmptyVal(currentItem.automobileOtherDetails.auto) ? '3' : currentItem.automobileOtherDetails.auto;
                                                        item.automobileOtherDetails.dateReported = utils.isNotEmptyVal(item.automobileOtherDetails.dateReported) ? moment(item.automobileOtherDetails.dateReported).format("MM/DD/YYYY") : null;
                                                        item.automobileOtherDetails.dateOfNoFaultClaim = utils.isNotEmptyVal(item.automobileOtherDetails.dateOfNoFaultClaim) ? moment(item.automobileOtherDetails.dateOfNoFaultClaim).format("MM/DD/YYYY") : null;
                                                        item.automobileOtherDetails.dateOfHitAndRun = utils.isNotEmptyVal(item.automobileOtherDetails.dateOfHitAndRun) ? moment(item.automobileOtherDetails.dateOfHitAndRun).format("MM/DD/YYYY") : null;
                                                    }
                                                    if (utils.isEmptyVal(currentItem.witnessOtherDetails)) {
                                                        item.witnessOtherDetails = {};
                                                        item.witnessOtherDetails.witness = '3';
                                                    } else {
                                                        item.witnessOtherDetails = currentItem.witnessOtherDetails;
                                                        item.witnessOtherDetails.witness = angular.isDefined(item.witnessOtherDetails.witness) ? item.witnessOtherDetails.witness : '3';
                                                    }
                                                    if (utils.isEmptyVal(currentItem.basicInfoOtherDetails)) {
                                                        item.basicInfoOtherDetails = {};
                                                        item.basicInfoOtherDetails.deathCertificate = '3';
                                                        item.basicInfoOtherDetails.administration = '3';
                                                    } else {
                                                        item.basicInfoOtherDetails = currentItem.basicInfoOtherDetails;
                                                        item.basicInfoOtherDetails.deathCertificate = angular.isDefined(item.basicInfoOtherDetails.deathCertificate) ? item.basicInfoOtherDetails.deathCertificate : '3';
                                                        item.basicInfoOtherDetails.administration = angular.isDefined(item.basicInfoOtherDetails.administration) ? item.basicInfoOtherDetails.administration : '3';
                                                    }
                                                    if (utils.isEmptyVal(currentItem.defautomobileOtherDetails)) {
                                                        item.defautomobileOtherDetails = {};
                                                    } else {
                                                        item.defautomobileOtherDetails = currentItem.defautomobileOtherDetails;
                                                    }
                                                    if (utils.isEmptyVal(currentItem.details)) {
                                                        item.details = {};
                                                        item.details.witnessNameListForDetails = [{ id: 'witnessNameListForDetails' }];
                                                        item.details.insurance = '3';
                                                        item.details.employment = '3';
                                                    } else {
                                                        item.details = currentItem.details;
                                                        item.details.hospital = angular.isDefined(item.details.hospital) ? utils.isNotEmptyVal(item.details.hospital) ? self.formatContact(item.details.hospital) : '' : '';
                                                        item.details.physician = angular.isDefined(item.details.physician) ? utils.isNotEmptyVal(item.details.physician) ? self.formatContact(item.details.physician) : '' : '';
                                                        item.details.insurance = angular.isDefined(item.details.insurance) ? item.details.insurance : '3';
                                                        item.details.employment = angular.isDefined(item.details.employment) ? item.details.employment : '3';
                                                        if (utils.isEmptyVal(item.details.witnessNameListForDetails)) {
                                                            item.details.witnessNameListForDetails = [{ id: 'witnessNameListForDetails' }];
                                                        } else {
                                                            if (item.details.witnessNameListForDetails) {
                                                                _.forEach(item.details.witnessNameListForDetails, function (item) {
                                                                    item.name = utils.isNotEmptyVal(item.name) ? self.formatContact(item.name) : item.name;
                                                                });
                                                            }
                                                        }
                                                    }

                                                    if (utils.isEmptyVal(currentItem.IncDetailsForPremises)) {
                                                        item.IncDetailsForPremises = {};
                                                        item.IncDetailsForPremises.timeAccident = new Date(1970, 0, 1, 0, 0, 0);
                                                        self.countries = getArrayByName(self.allDataFromMaster.countries);
                                                        self.states = getArrayByName(self.allDataFromMaster.states);
                                                        item.IncDetailsForPremises.country = "United States";
                                                        item.IncDetailsForPremises.accidentOccur = '3';
                                                        item.IncDetailsForPremises.accidentOccur2 = '3';
                                                        item.IncDetailsForPremises.accidentOccurBlg = '3';
                                                        item.IncDetailsForPremises.accInvolveSteps = '3';
                                                        item.IncDetailsForPremises.accInvolveElevator = '3';
                                                        item.IncDetailsForPremises.picTaken = '3';
                                                    } else {
                                                        item.IncDetailsForPremises = currentItem.IncDetailsForPremises;
                                                        item.IncDetailsForPremises.timeAccident = utils.isNotEmptyVal(item.IncDetailsForPremises.timeAccident) ? new Date(item.IncDetailsForPremises.timeAccident) : new Date(1970, 0, 1, 0, 0, 0);
                                                        item.IncDetailsForPremises.accidentOccur = angular.isDefined(item.IncDetailsForPremises.accidentOccur) ? item.IncDetailsForPremises.accidentOccur : '3';
                                                        item.IncDetailsForPremises.accidentOccur2 = angular.isDefined(item.IncDetailsForPremises.accidentOccur2) ? item.IncDetailsForPremises.accidentOccur2 : '3';
                                                        item.IncDetailsForPremises.accidentOccurBlg = angular.isDefined(item.IncDetailsForPremises.accidentOccurBlg) ? item.IncDetailsForPremises.accidentOccurBlg : '3';
                                                        item.IncDetailsForPremises.accInvolveSteps = angular.isDefined(item.IncDetailsForPremises.accInvolveSteps) ? item.IncDetailsForPremises.accInvolveSteps : '3';
                                                        item.IncDetailsForPremises.accInvolveElevator = angular.isDefined(item.IncDetailsForPremises.accInvolveElevator) ? item.IncDetailsForPremises.accInvolveElevator : '3';
                                                        item.IncDetailsForPremises.picTaken = angular.isDefined(item.IncDetailsForPremises.picTaken) ? item.IncDetailsForPremises.picTaken : '3';
                                                        item.IncDetailsForPremises.lastDateInception = utils.isEmptyVal(item.IncDetailsForPremises.lastDateInception) ? null : moment(item.IncDetailsForPremises.lastDateInception).format('MM/DD/YYYY');

                                                        if (self.intakeInfo.accidentDate && self.type == 1 && self.subtype == 2) {
                                                            item.IncDetailsForPremises.incidentDate = utils.isNotEmptyVal(self.intakeInfo.accidentDate) ? moment.unix(self.intakeInfo.accidentDate).utc().format("MM/DD/YYYY") : null;
                                                            item.IncDetailsForPremises.incidentDateCopy = moment.unix(self.intakeInfo.accidentDate).utc().format("dddd");
                                                        }
                                                    }
                                                    item.maritalStatus.stateshow = item.maritalStatus.country == "United States" ? true : false,
                                                        item.parentalCare.stateshow = item.parentalCare.countryPrenatal == "United States" ? true : false,
                                                        item.mvaIncident.stateshow = item.mvaIncident.country == "United States" ? true : false,
                                                        item.IncDetailsForPremises.stateshow = item.IncDetailsForPremises.country == "United States" ? true : false,

                                                        item.childInfo = {
                                                            nameOfChild: utils.isEmptyVal(currentItem.nameOfChild) ? '' : currentItem.nameOfChild,
                                                            dateChildBirth: utils.isEmptyVal(currentItem.dateChildBirth) ? '' : currentItem.dateChildBirth,
                                                            ChildSsn: utils.isEmptyVal(currentItem.ChildSsn) ? '' : currentItem.ChildSsn,
                                                        };
                                                }
                                            });
                                        } else {
                                            // no other detail saved till now thus reset all object with defaults.

                                            item.Treatment2 = {};
                                            item.Treatment2.insuranceProviderList = [{ id: 'insuranceProviderList' }];
                                            item.birthInformation = {};
                                            item.birthInformation.contactList = [];
                                            item.birthInformation.contactList.push({
                                                id: 'phone' + item.intakePlaintiffId + (item.birthInformation.contactList.length + 1),
                                                contactTypeName: 'Cell'
                                            });
                                            item.maritalStatus = {};
                                            item.maritalStatus.typeOfPerson = 'Not Specified';
                                            item.maritalStatus.contactList = [];
                                            item.maritalStatus.contactList.push({
                                                id: 'phone' + item.intakePlaintiffId + (item.maritalStatus.contactList.length + 1),
                                                contactTypeName: 'Cell'
                                            });
                                            item.maritalStatus.childrenList = [];
                                            item.maritalStatus.childrenList.push({
                                                id: 'childrenList' + item.intakePlaintiffId + (item.maritalStatus.childrenList.length + 1)
                                            });
                                            item.maritalStatus.country = 'United States';
                                            item.maritalStatus.stateshow = true;

                                            item.parentalCare = {};
                                            item.parentalCare.country = 'United States';
                                            item.parentalCare.stateshow = true;

                                            item.healthInsurance.medicare = '3';
                                            item.healthInsurance.insuranceDetails = '3';
                                            item.healthInsurance.denied = '3';
                                            item.healthInsurance.State = '3';
                                            item.healthInsurance.deniedMedicare = '3';
                                            item.healthInsurance.medicareNext = '3';

                                            item.automobileInsurance.paymentsCoverage = '3';
                                            item.mvaIncident = {};
                                            item.mvaIncident.country = 'United States';
                                            item.mvaIncident.stateshow = true;
                                            item.mvaIncident.reportToPolice = '3';
                                            item.mvaIncident.mvField = '3';
                                            item.mvaIncident.clientCopy = '3';
                                            item.mvaIncident.timeAccident = new Date(1970, 0, 1, 0, 0, 0);
                                            if (self.intakeInfo.accidentDate && self.type == 1 && self.subtype == 1) {
                                                item.mvaIncident.incidentDate = utils.isNotEmptyVal(self.intakeInfo.accidentDate) ? moment.unix(self.intakeInfo.accidentDate).utc().format("MM/DD/YYYY") : null;
                                                item.mvaIncident.incidentDateCopy = moment.unix(self.intakeInfo.accidentDate).utc().format("dddd");
                                            }

                                            item.mvaTreatment = {};
                                            item.mvaTreatment.optionAmbulance = '3';
                                            item.mvaTreatment.emsinfo = '3';
                                            item.mvaTreatment.optionInjuries = '3';

                                            item.propertyDamaged = {};
                                            item.propertyDamaged.optionDamaged = '3';
                                            item.propertyDamaged.optionTowed = '3';
                                            item.propertyDamaged.optionEstimate = '3';
                                            item.propertyDamaged.optionPhotographs = '3';
                                            item.propertyDamaged.proDamaged = '3';


                                            item.EducationDetails = {};
                                            item.otherDriverInsurance = {};

                                            item.automobileOtherDetails = {};
                                            item.automobileOtherDetails.nofaultInsurance = '3';
                                            item.automobileOtherDetails.accidentReportedCompany = '3';
                                            item.automobileOtherDetails.noFaultClaim = '3';
                                            item.automobileOtherDetails.clientCopy = '3';
                                            item.automobileOtherDetails.hitAndRun = '3';
                                            item.automobileOtherDetails.hitAndRunNotice = '3';
                                            item.automobileOtherDetails.deathCertificate = '3';
                                            item.automobileOtherDetails.client_Copy = '3';
                                            item.automobileOtherDetails.clientVehicle = '3';
                                            item.automobileOtherDetails.auto = '3';

                                            item.injuryClaims = {};
                                            item.injuryClaims.claimLawsuit = '3';

                                            item.disabilityClaims = {};
                                            item.disabilityClaims.SSD = '3';

                                            item.workerCompensation = {};
                                            item.workerCompensation.claim = '3';

                                            item.assistanceAndSupport = {};
                                            item.assistanceAndSupport.lawsuit = '3';
                                            item.assistanceAndSupport.judgments = '3';
                                            item.assistanceAndSupport.aidType = '3';
                                            item.assistanceAndSupport.obligation = '3';

                                            item.criminalOrMotorVehical = {};
                                            item.criminalOrMotorVehical.convictions = '3';
                                            item.criminalOrMotorVehical.incarcerate = '3';

                                            item.militaryService = {};
                                            item.militaryService.injuries = '3';
                                            item.militaryService.service = '3';

                                            item.eyesOrEars = {};
                                            item.eyesOrEars.aid = '3';

                                            item.addictionOrtreatment = {};
                                            item.addictionOrtreatment.alcoholorDrug = '3';

                                            item.bankruptcy = {};
                                            item.bankruptcy.court = '3';
                                            item.bankruptcy.contemplat = '3';

                                            item.MiscellaneousMedMal = {};
                                            item.MiscellaneousMedMal.medicalRecordCopies = 'dontknow';
                                            item.MiscellaneousMedMal.havePhotos = 'dontknow';

                                            item.incidentDoubleCheck = {};
                                            item.incidentDoubleCheck.claimDoubleCheck = '3';
                                            item.incidentDoubleCheck.noClaim = '3';
                                            item.incidentDoubleCheck.MRIorCTScan = '3';

                                            item.basicInfoOtherDetails = {};
                                            item.basicInfoOtherDetails.deathCertificate = '3';
                                            item.basicInfoOtherDetails.administration = '3';
                                            item.defautomobileOtherDetails = {};
                                            item.details = {};
                                            item.details.witnessNameListForDetails = [{ id: 'witnessNameListForDetails' }];
                                            item.details.insurance = '3';
                                            item.details.employment = '3';

                                            item.IncDetailsForPremises = {};
                                            item.IncDetailsForPremises.country = "United States";
                                            item.IncDetailsForPremises.accidentOccur = '3';
                                            item.IncDetailsForPremises.accidentOccur2 = '3';
                                            item.IncDetailsForPremises.accidentOccurBlg = '3';
                                            item.IncDetailsForPremises.accInvolveSteps = '3';
                                            item.IncDetailsForPremises.accInvolveElevator = '3';
                                            item.IncDetailsForPremises.picTaken = '3';
                                            item.IncDetailsForPremises.timeAccident = new Date(1970, 0, 1, 0, 0, 0);
                                            if (self.intakeInfo.accidentDate && self.type == 1 && self.subtype == 1) {
                                                item.IncDetailsForPremises.incidentDate = utils.isNotEmptyVal(self.intakeInfo.accidentDate) ? moment.unix(self.intakeInfo.accidentDate).utc().format("MM/DD/YYYY") : null;
                                                item.IncDetailsForPremises.incidentDateCopy = moment.unix(self.intakeInfo.accidentDate).utc().format("dddd");
                                            }

                                            item.witnessOtherDetails = {};
                                            item.witnessOtherDetails.witness = '3';
                                        }


                                    });
                                    self.goToPage = true;
                                    $timeout(function () {
                                        $("textarea").css("pointer-events", "all");
                                        $("textarea").attr("readonly", true);
                                    }, 500);

                                }, function () {
                                    self.goToPage = true;
                                    $timeout(function () {
                                        $("textarea").css("pointer-events", "all");
                                        $("textarea").attr("readonly", true);
                                    }, 500);
                                });

                        } else {
                            self.intake_name = [];
                        }
                        self.dataLoaderFlag = true;
                    });

            });
        };

        self.cancel = function () {
            init();
            self.view = true;
        }

        self.scrollTo = function (id) {
            $('html, body').animate({
                scrollTop: ($(id).offset().top)
            }, 1000);
            $timeout(function () {
                $(id).focus();
            }, 1000);
        }

        self.clearDate = function (item) {
            if (item.iscurrent == 1) {
                item.EndDate = "";
            }
        }

        self.deleteDefendantDetails = function (item, idx) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };
            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                item.defendantsData.defendantDetails[idx].isDeleted = 1;
                notificationService.success("Defendant details deleted successfully.");
            });
        };

        self.deleteEmployeeDetails = function (item, idx) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };
            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                item.Employer.employerDetails[idx].isDeleted = 1;
                notificationService.success("Employment details deleted successfully.");
            }, function () {
            });

        }


        self.showFieldsOfStatus = function (id) {
            if (id == '0' || id == '2') {
                self.showPOA = true;
                self.showEstateAdministrator = false;
            } else {
                self.showPOA = false;
                self.showEstateAdministrator = true;
            }
        }


        function isDatesValid() {
            var isValid = true;
            var flag = false
            _.forEach(self.intake_name, function (item) {
                if (!flag) {
                    var id = item.intakePlaintiffId;
                    if ($('#dateofIncident' + id).css("display") == "block"
                        || $('#dateofIncident' + id).css("display") == "block"
                        || $('#mvDateError' + id).css("display") == "block"
                        || $('#dateOfChildDischarge' + id).css("display") == "block" || $('#dateOfBirth' + id).css("display") == "block"
                        || $('#dateofDeath' + id).css("display") == "block" || $('#employerStartDate' + id).css("display") == "block"
                        || $('#employerEndDate' + id).css("display") == "block" || $('#treatmentStartDate' + id).css("display") == "block"
                        || $('#treatmentEndDate' + id).css("display") == "block" || $('#injuryDate' + id).css("display") == "block"
                        || $('#disabilityClaimDate' + id).css("display") == "block" || $('#militaryDateOfService' + id).css("display") == "block"
                        || $('#criminalDate' + id).css("display") == "block" || $('#parentaldueDate' + id).css("display") == "block"
                        || $('#childDateOfBirth' + id).css("display") == "block" || $('#birthInfo' + id).css("display") == "block"
                        || $('#parentalDate' + id).css("display") == "block" || $('#dateofTimeYouWereAdmitted' + id).css("display") == "block"
                        || $('#dateOfWaterBroke' + id).css("display") == "block" || $('#dateOfChildBirth' + id).css("display") == "block"
                        || $('#fillingDateError' + id).css("display") == "block" || $('#admissionDatePicker' + id).css("display") == "block"
                        || $('#defendantBirthDateError' + id).css("display") == "block" || $('#openDateReported' + id).css("display") == "block"
                        || $('#dateofNoFaultFiled' + id).css("display") == "block" || $('#dateOfHitAndRunFil' + id).css("display") == "block"
                        || $('#defDateOfHitAndRunFil' + id).css("display") == "block" || $('#defDateofNoFaultFiled' + id).css("display") == "block"
                        || $('#defOpenDateReported' + id).css("display") == "block" || $('#incidentDateErrorforPremises' + id).css("display") == "block"
                        || $('#lastDateError' + id).css("display") == "block") {
                        isValid = true;
                        flag = true;
                    } else {
                        isValid = false;
                    }
                }

            });
            return isValid;

        }

        self.clearDefendant = function (data) {
            data.defendantsData = {
                defendantDetails: [],
                defendantInfo: { defendantRole: "prime", gender: "Not Specified" }
            };
        };


        self.cancelIntake = function () {
            self.goToPage = true;
            self.showAddIntake = false;
            self.view = true;
        }

        self.showTab;
        function updatePlaintiff() {
            var flag = false;
            _.forEach(self.intake_name, function (item) {
                if (!flag) {
                    if (utils.isNotEmptyVal(item.basicInfo.ssn) && item.basicInfo.ssn.length < 11) {
                        flag = true;
                        notificationService.error("Invalid SSN number");
                        return;
                    }
                    if (utils.isNotEmptyVal(item.childInfo) && utils.isNotEmptyVal(item.childInfo.ChildSsn) && item.childInfo.ChildSsn.length < 11) {
                        flag = true;
                        notificationService.error("Invalid SSN number");
                        return;
                    }
                }
            })
            if (flag == true) {
                return;
            }
            var id = "";
            var idx;
            var message;
            var messageForDate;
            var messageForPolicyLimit;
            var messageForStartDate;
            var isContactValid = _.find(self.intake_name, function (item, index) {
                idx = index;
                if (utils.isNotEmptyVal(item.basicInfo)) {
                    if (!utils.isEmptyObj(item.basicInfo.estateAdminId) && utils.isEmptyVal(item.basicInfo.estateAdminId.contact_id)) {
                        id = "#estateAdminId";
                        self.showTab = self.views.Client_Details;
                        return true;
                    }
                    if (item.basicInfo.status_list == 0 && utils.isNotEmptyVal(item.basicInfo.dateOfBirth) && utils.isNotEmptyVal(item.basicInfo.dateOfDeath)) {
                        var dob = angular.copy(item.basicInfo.dateOfBirth);
                        var dod = angular.copy(item.basicInfo.dateOfDeath);
                        var dateofbirth = moment(dob).unix();
                        var dateofdeath = moment(dod).unix();
                        if (dateofdeath < dateofbirth) {
                            message = true;
                            id = "#openBirthDatePicker";
                            self.showTab = self.views.Client_Details;
                            return true;
                        }
                    }
                    if (id) {
                        return true;
                    }
                }

                if (utils.isNotEmptyVal(item.EducationDetails)) {
                    if (!utils.isEmptyObj(item.EducationDetails.InstituteName) && utils.isEmptyVal(item.EducationDetails.InstituteName.contact_id)) {
                        id = "#institute";
                        self.showTab = self.views.EmpAndEdu_Details;
                        return true;
                    }
                }

                if (utils.isNotEmptyVal(item.MedMal)) {
                    if (!utils.isEmptyObj(item.MedMal.insuranceProviderId) && utils.isEmptyVal(item.MedMal.insuranceProviderId.contact_id)) {
                        id = "#insuMisHealthInsurance";
                        self.showTab = self.views.MedMal_Details;
                        return true;
                    }
                }
                if (utils.isNotEmptyVal(item.mvaTreatment)) {
                    if (!utils.isEmptyObj(item.mvaTreatment.hospPhysicianId) && utils.isEmptyVal(item.mvaTreatment.hospPhysicianId.contact_id)) {
                        id = "#hospitalMVA";
                        self.showTab = self.views.Inci_Details;
                        return true;
                    }
                }
                if (utils.isNotEmptyVal(item.Treatment)) {
                    if (utils.isNotEmptyVal(item.Treatment.serviceEndDate) && utils.isNotEmptyVal(item.basicInfo.dateOfBirth)) {
                        var dob = angular.copy(item.basicInfo.dateOfBirth);
                        var sed = angular.copy(item.Treatment.serviceEndDate);
                        var dateofbirth = moment(dob).unix();
                        var serviceendDate = moment(sed).unix();
                        if (serviceendDate < dateofbirth) {
                            messageForDate = true;
                            id = "#openEndDatePickerForEndDate";
                            self.showTab = self.views.Inci_Details;
                            return true;
                        }
                    }
                    if (utils.isNotEmptyVal(item.Treatment.serviceEndDate) && utils.isNotEmptyVal(item.Treatment.serviceStartDate)) {
                        var ssd = angular.copy(item.Treatment.serviceStartDate);
                        var sed = angular.copy(item.Treatment.serviceEndDate);
                        var servicestartDate = moment(ssd).unix();
                        var serviceendDate = moment(sed).unix();
                        if (serviceendDate < servicestartDate) {
                            messageForStartDate = true;
                            id = "#openStartDatePicker";
                            self.showTab = self.views.Inci_Details;
                            return true;
                        }
                    }

                    if ((item.Treatment.physicianId != null) && utils.isEmptyVal(item.Treatment.physicianId.contact_id) && utils.isNotEmptyVal(item.Treatment.physicianId)) {
                        id = "#physician";
                        self.showTab = self.views.Inci_Details;
                        return true;
                    }
                    if (utils.isNotEmptyVal(item.Treatment.insuranceProviderList)) {
                        _.forEach(item.Treatment.insuranceProviderList, function (currentItem, index) {
                            if (!utils.isEmptyObj(currentItem.name) && utils.isEmptyVal(currentItem.name.contact_id)) {
                                id = "#insuranceProvider" + (index + 1) + '_';
                                self.showTab = self.views.Inci_Details;
                                return true;
                            }
                        });
                        if (id) {
                            return true;
                        }
                    }

                }
                if (item.Treatment2 && utils.isNotEmptyVal(item.Treatment2.insuranceProviderList)) {
                    _.forEach(item.Treatment2.insuranceProviderList, function (currentItem, index) {
                        if (!utils.isEmptyObj(currentItem.name) && utils.isEmptyVal(currentItem.name.contact_id)) {
                            id = "#insuranceProviderTreatment2" + (index + 1) + '_';
                            self.showTab = self.views.Inci_Details;
                            return true;
                        }
                    });
                    if (id) {
                        return true;
                    }
                }

                if (utils.isNotEmptyVal(item.witness.witnessNameList)) {
                    _.forEach(item.witness.witnessNameList, function (currentItem, index) {
                        if (!utils.isEmptyObj(currentItem.name) && utils.isEmptyVal(currentItem.name.contact_id)) {
                            id = "#witness" + (index + 1) + '_';
                            self.showTab = self.views.Inci_Details;
                            return true;
                        }
                    });
                    if (id) {
                        return true;
                    }
                }


                if (utils.isNotEmptyVal(item.birthInformation)) {
                    if (!utils.isEmptyObj(item.birthInformation.physicianName) && utils.isEmptyVal(item.birthInformation.physicianName.contact_id)) {
                        id = "#phyBirth";
                        self.showTab = 'Client_Details';
                        return true;
                    }
                    if (!utils.isEmptyObj(item.birthInformation.serviceProvider) && utils.isEmptyVal(item.birthInformation.serviceProvider.contact_id)) {
                        id = "#spBirth";
                        self.showTab = 'Client_Details';
                        return true;
                    }
                    if (!utils.isEmptyObj(item.birthInformation.pediatriciansName) && utils.isEmptyVal(item.birthInformation.pediatriciansName.contact_id)) {
                        id = "#pediBirth";
                        self.showTab = 'Client_Details';
                        return true;
                    }
                    if (!utils.isEmptyObj(item.birthInformation.neurologistsName) && utils.isEmptyVal(item.birthInformation.neurologistsName.contact_id)) {
                        id = "#neuroBirth";
                        self.showTab = 'Client_Details';
                        return true;
                    }

                }
                if (utils.isNotEmptyVal(item.automobileOtherDetails)) {
                    if (!utils.isEmptyObj(item.automobileOtherDetails.insuredParty) && utils.isEmptyVal(item.automobileOtherDetails.insuredParty.contact_id)) {
                        id = "#insPartyAutoInsuOtherDetails";
                        self.showTab = self.views.Insurance_Details;
                        return true;
                    }
                }

                if (utils.isNotEmptyVal(item.healthInsurance)) {
                    if (parseFloat(item.healthInsurance.policyLimit) > parseFloat(item.healthInsurance.policyLimitMax)) {
                        id = "#policyLimit";
                        messageForPolicyLimit = true;
                        self.showTab = self.views.Insurance_Details;
                        return true;

                    }
                    if ((item.healthInsurance.insuranceProviderId != null) && utils.isEmptyVal(item.healthInsurance.insuranceProviderId.contact_id) && (utils.isNotEmptyVal(item.healthInsurance.insuranceProviderId))) {
                        id = "#insuProHealthInsu";
                        self.showTab = self.views.Insurance_Details;
                        return true;
                    }
                    if (utils.isNotEmptyVal(item.healthInsurance.insuredPartyList)) {
                        _.forEach(item.healthInsurance.insuredPartyList, function (currentItem, index) {
                            if ((currentItem.name != null) && utils.isEmptyVal(currentItem.name.contact_id)) {
                                id = "#insuredPartyHealthInsu" + (index + 1) + '_';
                                self.showTab = self.views.Insurance_Details;
                                return true;
                            }
                        });
                        if (id) {
                            return true;
                        }
                    }

                }

                if (utils.isNotEmptyVal(item.automobileInsurance)) {
                    var flag = true;
                    _.forEach(item.automobileInsurance.autoMobileList, function (currentItem, index) {
                        if (flag) {
                            if (!utils.isEmptyObj(currentItem.insuredParty) && utils.isEmptyVal(currentItem.insuredParty.contact_id)) {
                                id = "#insuredPartyAutoInsu" + (index + 1) + '_';
                                self.showTab = self.views.Insurance_Details;
                                flag = false;
                                return true;
                            }
                            if (!utils.isEmptyObj(currentItem.insuranceProvider) && utils.isEmptyVal(currentItem.insuranceProvider.contact_id)) {
                                id = "#insurProAutoInsu" + (index + 1) + '_';
                                self.showTab = self.views.Insurance_Details;
                                flag = false;
                                return true;
                            }
                            if (!utils.isEmptyObj(currentItem.adjusterName) && utils.isEmptyVal(currentItem.adjusterName.contact_id)) {
                                id = "#adjusterAutoInsu" + (index + 1) + '_';
                                self.showTab = self.views.Insurance_Details;
                                flag = false;
                                return true;
                            }
                        }


                    })
                    if (id) {
                        return true;
                    }


                }
                if (utils.isNotEmptyVal(item.otherDriverInsurance)) {
                    if (!utils.isEmptyObj(item.otherDriverInsurance.insuredParty) && utils.isEmptyVal(item.otherDriverInsurance.insuredParty.contact_id)) {
                        id = "#insuredPartyOtherInsu";
                        self.showTab = self.views.Insurance_Details;
                        return true;
                    }
                    if (!utils.isEmptyObj(item.otherDriverInsurance.insuranceProvider) && utils.isEmptyVal(item.otherDriverInsurance.insuranceProvider.contact_id)) {
                        id = "#insurProAutoInsu";
                        self.showTab = self.views.Insurance_Details;
                        return true;
                    }
                    if (!utils.isEmptyObj(item.otherDriverInsurance.adjusterName) && utils.isEmptyVal(item.otherDriverInsurance.adjusterName.contact_id)) {
                        id = "#adjusterAutoInsu";
                        self.showTab = self.views.Insurance_Details;
                        return true;
                    }

                }
                if (utils.isNotEmptyVal(item.details)) {
                    if (utils.isNotEmptyVal(item.details.witnessNameListForDetails)) {
                        _.forEach(item.details.witnessNameListForDetails, function (currentItem, index) {
                            if (!utils.isEmptyObj(currentItem.name) && utils.isEmptyVal(currentItem.name.contact_id)) {
                                id = "#witnesses" + (index + 1) + '_';
                                self.showTab = self.views.Details;
                                return true;
                            }
                        });
                        if (id) {
                            return true;
                        }
                    }
                    if (!utils.isEmptyObj(item.details.hospital) && utils.isEmptyVal(item.details.hospital.contact_id)) {
                        id = "#generalHospital";
                        self.showTab = self.views.Details;
                        return true;
                    }
                    if (!utils.isEmptyObj(item.details.physician) && utils.isEmptyVal(item.details.physician.contact_id)) {
                        id = "#generalPhy";
                        self.showTab = self.views.Details;
                        return true;
                    }

                }


            });
            if (isContactValid) {
                if (message) {
                    notificationService.error('Date of Death should be after Date of Birth');
                } else if (messageForDate) {
                    notificationService.error('End date of service cannot be less than Date of Birth');
                } else if (messageForPolicyLimit) {
                    notificationService.error("Policy limit range is incorrect");
                } else if (messageForStartDate) {
                    notificationService.error("Service End Date should not be less than Service Start Date");
                } else {
                    notificationService.error("Invalid contact");
                }
                self.intake_name[idx].open = false;
                self.showView(self.showTab, true);
                getContactId(self.intake_name[idx]);
                $timeout(function () {
                    self.scrollTo(id + isContactValid.intakePlaintiffId);
                }, 500);
                return;
            }
            self.goToPage = false;
            savePlaintiff();

            var allData = [];
            allData = intakeListHelper.setOtherDetails(angular.copy(self.intake_name), self.intakeId, self.type, self.subtype, self.category);
            allData.detailId = self.otherDetailsID;
            if (utils.isNotEmptyVal(allData)) {
                if (!allData.detailId) {
                    intakeFactory.addOtherDetails(allData, 'no_auth')
                        .then(function (res) {
                            notificationService.success('Intake details updated successfully.');
                            init();
                        });
                } else {
                    intakeFactory.updateOtherDetails(allData, 'no_auth')
                        .then(function (res) {
                            notificationService.success('Intake details updated successfully.');
                            init();
                        });
                }

            }
            self.view = true;

        };

        function getContacts(contactName, searchItem) {
            var searchString = searchItem;
            var postObj = {};
            switch (searchItem) {
                case "PLAINTIFF":
                    postObj.type = globalConstants.plaintiffTypeList;
                    searchString = "ExcludeGlobalCourt";
                    break;
                case "ESTATE_ADMIN":
                    postObj.type = globalConstants.estateAdminTypeList;
                    searchString = "ExcludeGlobalCourt";
                    break;
                case "GUARDIAN":
                    postObj.type = globalConstants.gaurdianTypeList;
                    searchString = "ExcludeGlobalCourt";
                    break;
                case "physicianName":
                case "serviceprovider":
                    postObj.type = globalConstants.mattDetailsMedicalInfo;
                    searchString = "ExcludeGlobalCourt";
                    break;
                case "SCHOOL":
                    postObj.type = globalConstants.schoolTypeList;
                    searchString = "ExcludeGlobalCourt";
                    break;
                case "EMPLOYEE":
                    postObj.type = globalConstants.employeeTypeList;
                    searchString = "ExcludeGlobalCourt";
                    break;
                case "allTypeList":
                    postObj.type = globalConstants.allTypeList;
                    searchString = "ExcludeGlobalCourt";
                    break;
                case "insuranceInfo":
                    postObj.type = globalConstants.mattDetailsInsurance;
                    searchString = "ExcludeGlobalCourt";
                    break;
                case "ExcludeGlobalCourt":
                    postObj.type = globalConstants.allTypeList;
                    break;
                default:
                    postObj.type = globalConstants.allTypeList;
                    searchString = "ExcludeGlobalCourt";
                    break;

            }
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';

            if (searchString == "ExcludeGlobalCourt") {
                postObj.exclude_global_contact = 1
            }
            return intakeFactory.getContactsByName(postObj)
                .then(function (response) {
                    var data = response.data;
                    _.forEach(data, function (contact) {
                        contact.name = contact.first_name + ' ' + contact.last_name;
                    });
                    contacts = data;
                    return data;
                });
        }

        function getArrayByName(data) {
            var data_array = [];
            angular.forEach(data, function (k, v) { // convert object to array for type
                data_array.push(k.name);
            });
            return data_array;

        }

        self.salaryModeForEdit = function (params) {
            var paymentBtns;
            _.forEach(self.paymentBtns, function (btn) {
                if (btn.value == params.salaryMode) {
                    paymentBtns = btn;
                }
            })

            var selectedsalaryMode = utils.isNotEmptyVal(paymentBtns) ? paymentBtns.label : '';
            return selectedsalaryMode;
        }

        function validateZipcode(zipcode, item) {
            self.checkZipcode = /^[\040-\100,\133-\140,\173-\177]*$/.test(zipcode);
            if (item.maritalStatus) {
                item.maritalStatus.checkzipvalue = self.checkZipcode;
                item.parentalCare.checkzipvalue == true;
            }
            if (item.parentalCare) {
                item.parentalCare.checkzipvalue = self.checkZipcode;
                item.parentalCare.checkzipvalue == true;
            }
            if (item.mvaIncident) {
                item.mvaIncident.checkzipvalue = self.checkZipcode;
                item.mvaIncident.checkzipvalue == true;
            }
            if (item.IncDetailsForPremises) {
                item.IncDetailsForPremises.checkzipvalue = self.checkZipcode;
                item.IncDetailsForPremises.checkzipvalue == true;
            }
            self.checkZip = self.checkZipcode == false ? true : false;
        }

        self.setMode = function (label) {
            var paymentBtns = _.find(self.paymentBtns, function (btn) {
                return btn.label == label;
            });
            return utils.isNotEmptyVal(paymentBtns) ? paymentBtns.value : '';
        }

        self.countryChange = function (data) {
            if (data.country != 'United States') {
                data.stateshow = false;
                data.state = null;
            } else {
                data.stateshow = true;
            }
        }

        function savePlaintiff() {
            var plaintiffData = angular.copy(self.intake_name);
            var allData = [];
            _.forEach(plaintiffData, function (item, index) {
                allData.push(intakeListHelper.setPlaintiffInfo(item, self.intakeId));
            });

            $q.all(allData.map(function (channel) {
                if (channel.intakePlaintiffId) {
                    return intakeFactory.addPlaintiffInfo(channel, true, 'no_auth');
                } else {
                    return intakeFactory.addPlaintiffInfo(channel, false, 'no_auth');
                }
            })).then(function (response) {
                self.intake_name = plaintiffData;
                _.forEach(response, function (item, index) {
                    if (!isNaN(item)) {
                        self.intake_name[index].intakePlaintiffId = item;
                    }

                });
            }).catch(function () {

            });
        }

        function getContactId(data) {
            data.open = !data.open;
            _.forEach(self.intake_name, function (item) {
                if (typeof (item.contact) == "object") {
                    if (item.contact.contact_id != data.contact.contact_id) {
                        item.open = false;
                    }
                } else {
                    if (item.contact_id != data.contact_id) {
                        item.open = false;
                    }
                }

            });
        }

        function openCalender($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
        };

        function addNewMedInsuranceProvider(index, data, type) {
            var selectedType = {};
            selectedType.type = type;
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                if (utils.isNotEmptyVal(response)) {
                    data.MedMal.insuranceProviderId = response;
                }
            }, function () {
            });
        }

        function addNewAutoInsuredPartyOther(index, data) {
            var modalInstance = contactFactory.openContactModal();
            modalInstance.result.then(function (response) {
                if (utils.isNotEmptyVal(response)) {
                    data.automobileOtherDetails.insuredParty = response;
                }
            }, function () {
            });
        }

        function addProviderListTreatment2(item) {
            item.Treatment2.insuranceProviderList.push({
                id: 'insuranceProviderList' + (item.Treatment2.insuranceProviderList.length + 1)
            });

        }

        function deleteTreatment2InsuranceProviderList(item, index) {
            if (index !== -1) {
                item.Treatment2.insuranceProviderList.splice(index, 1);
            }
        }

        function addContactList(item) {
            if (!item.maritalStatus.contactList) {
                item.maritalStatus.contactList = [];
            }
            item.maritalStatus.contactList.push({
                id: 'phone' + item.intakePlaintiffId + (item.maritalStatus.contactList.length + 1),
                contactTypeName: 'Cell'
            });
        }

        function deleteContactList(data, index) {
            if (index !== -1) {
                data.contactList.splice(index, 1);
            }
        }

        function addChildrenList(item) {
            if (!item.maritalStatus.childrenList) {
                item.maritalStatus.childrenList = [];
            }
            item.maritalStatus.childrenList.push({
                id: 'childrenList' + (item.maritalStatus.childrenList.length + 1)
            });
        }

        function deleteChildrenList(data, index) {
            if (index !== -1) {
                data.childrenList.splice(index, 1);
            }
        }

        self.formatContact = function (contact, witness) {
            if (!contact.contact_id) {
                if (witness) {
                    contact.contact_id = angular.isDefined(contact.contactId) ? contact.contactId.toString() : contact.contactid.toString();
                } else {
                    contact.contact_id = angular.isDefined(contact.contactId) ? contact.contactId.toString() : contact.contactid.toString();
                }
            }
            else {
                contact.contact_id = contact.contact_id.toString();
            }

            contact.firstname = angular.isDefined(contact.firstName) ? contact.firstName : angular.isDefined(contact.firstname) ? contact.firstname : angular.isDefined(contact.first_name) ? contact.first_name : '';
            contact.middlename = angular.isDefined(contact.middleName) ? contact.middleName : angular.isDefined(contact.middlename) ? contact.middlename : angular.isDefined(contact.middle_name) ? contact.middle_name : '';
            contact.lastname = angular.isDefined(contact.lastName) ? contact.lastName : angular.isDefined(contact.lastname) ? contact.lastname : angular.isDefined(contact.last_name) ? contact.last_name : '';
            contact.name = contact.firstname + ' ' + contact.lastname;
            return contact;
        }

        function formatTypeaheadDisplay(contact) {
            if (utils.isEmptyVal(contact) || utils.isEmptyString(contact)) {
                return undefined;
            }
            return (contact.name);

        }

    }

})();

