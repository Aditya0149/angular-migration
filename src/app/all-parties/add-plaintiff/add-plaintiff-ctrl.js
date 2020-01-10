(function () {
    'use strict';

    angular.module('cloudlex.allParties')
        .controller('AddPlaintiffCtrl', AddPlaintiffCtrl);

    AddPlaintiffCtrl.$inject = ["$scope", "globalConstants", '$modal', 'modalService', "matterFactory", "addPlaintiffFactory", "allPartiesDataService", "contactFactory", "$stateParams", "$state", "notification-service"];

    function AddPlaintiffCtrl($scope, globalConstants, $modal, modalService, matterFactory, addPlaintiffFactory, allPartiesDataService, contactFactory, $stateParams, $state, notificationService) {

        var matterId = $stateParams.matterId;
        var vm = this;
        var plaintiffDataCopy = null;
        vm.currentRecIndex = -1;
        vm.getContacts = getContacts;
        vm.formatTypeaheadDisplay = selectPlaintiff;
        vm.openCalender = openCalender;
        vm.next = goToNextPage;
        vm.isPlaintiffMinor = isPlaintiffMinor;
        vm.addNewContact = addNewContact;
        vm.addNewEmployer = addNewEmployer;
        vm.save = savePlaintiff;
        vm.cancel = cancelSave;
        vm.isEditMode = false;
        vm.Currentdate = new Date();
        vm.processEmployment = true;
        vm.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;
        vm.disableNext = disableNext;
        vm.goToPage = goToPage;
        vm.getSearchContactStepClass = getSearchContactStepClass;
        vm.getGenInfoStepClass = getGenInfoStepClass;
        vm.getOtherInfoStepClass = getOtherInfoStepClass;
        vm.getSearchContactConnectorClass = getSearchContactConnectorClass;
        vm.getGenInfoConnectorClass = getGenInfoConnectorClass;
        vm.isDatesValid = isDatesValid;
        //Salary button options
        vm.salaryBtns = [{ label: "Hourly", value: "1" },
        { label: "Weekly", value: "4" }, //add new label(weekly) US#7507
        { label: "Monthly", value: "2" },
        { label: "Yearly", value: "3" },

        ];
        vm.setDateofDeath = setDateofDeath;
        vm.setsalaryMode = setsalaryMode;
        vm.setSalMode = setSalMode;
        //vm.getOtherInfoConnectorClass = getOtherInfoConnectorClass;
        vm.JavaFilterAPIForContactList = true;

        function initPlaintiff() {
            vm.plaintiffInfo = {};
            vm.plaintiffInfo.isalive = '2'; // default, set status to true = alive
            vm.plaintiffInfo.isprimary = true;
            vm.plaintiffInfo.gender = 'Not specified';
            vm.plaintiffInfo.maritalstatus = 'Not specified';
            vm.plaintiffInfo.salarymode = "2" //default salary mode (monthly)
        }

        (function () {

            vm.dateFormat = "MM/DD/YYYY";
            vm.selectionLists = {};
            vm.currentPage = {
                "searchOrAdd": true,
                "generalInfo": false,
                "otherInfo": false
            };
            vm.completedPages = [];
            initSelectionLists();
            initPlaintiff();
            vm.selectedsalaryMode = 'Monthly';

            if ($state.current) {
                if ($state.current.name === "editPlaintiff") {
                    initiateEditMode();
                }
            }

        })();
        function checkIfEnterKeyWasPressed(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
            return true;

        };
        vm.openContactCard = function (contact) {
            contactFactory.displayContactCard1(contact.contact_id, contact.edited, contact.contact_type);
            contact.edited = false;
        };

        function selectPlaintiff(contact) {
            plaintiffDataCopy = null;
            return contactFactory.formatTypeaheadDisplay(contact);
        }

        function setDateofDeath() {
            var Dodeath = moment(vm.plaintiffInfo.dateofdeath).unix();
            vm.plaintiffInfo.dateofdeath = utils.isNotEmptyVal(vm.plaintiffInfo.dateofdeath) ? moment(vm.plaintiffInfo.dateofdeath).format('MM/DD/YYYY') : '';
            vm.plaintiffInfo.dateofdeath = (vm.plaintiffInfo.isalive == "0") ? vm.plaintiffInfo.dateofdeath : '';

            if ((vm.currentAliveStatus == 1 || vm.currentAliveStatus == 2) && (vm.plaintiffInfo.isalive == 0)) {
                vm.plaintiffInfo.estateadminid = '';
            }

            if ((vm.currentAliveStatus == 0) && (vm.plaintiffInfo.isalive == 1 || vm.plaintiffInfo.isalive == 2)) {
                vm.plaintiffInfo.estateadminid = '';
            }
            vm.currentAliveStatus = angular.copy(vm.plaintiffInfo.isalive);

            //vm.plaintiffInfo.estateadminid = (vm.plaintiffInfo.isalive == "0") ? vm.plaintiffInfo.estateadminid : '';
        }

        /*set lable as per the selected salary mode*/
        function setsalaryMode() {
            var salaryBtn = _.find(vm.salaryBtns, function (btn) {
                return btn.value == vm.plaintiffInfo.salarymode;
            });
            vm.selectedsalaryMode = utils.isNotEmptyVal(salaryBtn) ? salaryBtn.label : '2';
        }

        function setSalMode(val) {
            var salaryBtn = _.find(vm.salaryBtns, function (btn) {
                return btn.value == val;
            });
            return utils.isNotEmptyVal(salaryBtn) ? salaryBtn.label : '';
        }

        function setMode(label) {
            var salaryBtn = _.find(vm.salaryBtns, function (btn) {
                return btn.label == label;
            });
            return utils.isNotEmptyVal(salaryBtn) ? salaryBtn.value : '';
        }

        function isDatesValid() {
            if ($('#DojDateError').css("display") == "block" ||
                $('#DoDDateError').css("display") == "block" ||
                $('#DobDateError').css("display") == "block" ||
                $('#retError').css("display") == "block") {
                return true;
            } else {
                return false;
            }
        }



        //models for clx-btn-group directive
        //value prop will be model value and label prop will be the view value
        //for more details check out the clx-btn-group directive in utils->filterUtils.js 
        function initSelectionLists() {
            vm.selectionLists.isPrimary = [
                { label: "Primary Plaintiff", value: true },
                { label: "Secondary Plaintiff", value: false }
            ];

            vm.selectionLists.gender = [
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" },
                { label: "Not specified", value: "Not specified" }
            ];

            vm.selectionLists.maritalStatus = [
                { label: "Single", value: "single" },
                { label: "Married", value: "married" },
                { label: "Widowed", value: "widowed" },
                { label: "Other", value: "other" },
                { label: "Not specified", value: "Not specified" }
            ];

            vm.selectionLists.status = [
                { label: "Alive", value: "1" },
                { label: "Deceased", value: "0" },
                { label: "Not specified", value: "2" }
            ];
        }

        function initiateEditMode() {
            vm.isEditMode = true;
            vm.currentPage["searchOrAdd"] = false;
            vm.currentPage["generalInfo"] = true;
            vm.currentPage["otherInfo"] = false;

            vm.completedPages.push("searchOrAdd");
            var selectedPlaintiff = {};
            //Populate plaintiff info
            var plaintiffData = sessionStorage.getItem("selectedPlaintiff");
            if (plaintiffData) {
                plaintiffData = JSON.parse(plaintiffData);
                if (plaintiffData.matterId == matterId) {
                    selectedPlaintiff = plaintiffData.plaintiff;
                }
            } else {
                selectedPlaintiff = $stateParams.selectedPlaintiff;
            }

            vm.plaintiffInfo.contactid = angular.isUndefined(selectedPlaintiff.contactid) ? null : selectedPlaintiff.contactid.contactid;
            vm.plaintiffInfo.contact = angular.isUndefined(selectedPlaintiff.contactid) ? null : selectedPlaintiff.contactid;

            vm.plaintiffInfo.is_global = angular.isUndefined(selectedPlaintiff.is_global) ? 0 : selectedPlaintiff.is_global;

            vm.plaintiffInfo.isprimary = (selectedPlaintiff.isprimary == 1) ? true : false;
            vm.plaintiffInfo.dateofbirth = (utils.isEmptyVal(selectedPlaintiff.dateofbirth)) ? "" : moment.unix(selectedPlaintiff.dateofbirth).utc().format('MM/DD/YYYY');
            vm.plaintiffInfo.retainer_date = (utils.isEmptyVal(selectedPlaintiff.retainer_date)) ? "" : moment.unix(selectedPlaintiff.retainer_date).utc().format('MM/DD/YYYY');
            vm.plaintiffInfo.retainer_no = selectedPlaintiff.retainer_no ? selectedPlaintiff.retainer_no : null;
            vm.plaintiffInfo.closing_statement_date = (utils.isEmptyVal(selectedPlaintiff.closing_statement_date)) ? "" : moment.unix(selectedPlaintiff.closing_statement_date).utc().format('MM/DD/YYYY');
            vm.plaintiffInfo.closing_statement_no = selectedPlaintiff.closing_statement_no ? selectedPlaintiff.closing_statement_no : null;
            vm.plaintiffInfo.ssn = selectedPlaintiff.ssn;
            vm.plaintiffInfo.gender = (selectedPlaintiff.gender) ? selectedPlaintiff.gender : "Not specified";
            vm.plaintiffInfo.maritalstatus = (selectedPlaintiff.maritalstatus) ? selectedPlaintiff.maritalstatus : "Not specified";
            vm.plaintiffInfo.isalive = (selectedPlaintiff.isalive) ? selectedPlaintiff.isalive : '2';
            vm.currentAliveStatus = angular.copy(vm.plaintiffInfo.isalive);

            vm.plaintiffInfo.employerid = selectedPlaintiff.employerid;
            if (vm.plaintiffInfo.employerid == 1) {
                vm.plaintiffInfo.employerid = [];
            }
            if (vm.plaintiffInfo.employerid && typeof (vm.plaintiffInfo.employerid) === 'object' && vm.plaintiffInfo.employerid.length > 0) {
                angular.forEach(vm.plaintiffInfo.employerid, function (val, key) {
                    val.salarymode = setSalMode(val.salarymode);
                });
            }

            vm.plaintiffInfo.estateadminid = selectedPlaintiff.estateadminid;
            vm.plaintiffInfo.dateofdeath = (selectedPlaintiff.utcdateofdeath == 0) ? null : moment.unix(selectedPlaintiff.dateofdeath).utc().format('MM/DD/YYYY'); //selectedPlaintiff.dateofdeath;

            vm.plaintiffInfo.isminor = (selectedPlaintiff.isinfant == 1) ? true : false;
            if (vm.plaintiffInfo.isminor) {
                vm.plaintiffInfo.guardianid = selectedPlaintiff.guardianid;
            }

            vm.plaintiffInfo.isstudent = (selectedPlaintiff.isstudent == 1) ? true : false;
            if (vm.plaintiffInfo.isstudent) {
                vm.plaintiffInfo.studentinstitutionid = selectedPlaintiff.studentinstitutionid;
                vm.plaintiffInfo.studentprogram = selectedPlaintiff.studentprogram;
                vm.plaintiffInfo.studentlostdays = selectedPlaintiff.studentlostdays;
            }

            vm.plaintiffInfo.isemployed = (selectedPlaintiff.isemployed == 1 && selectedPlaintiff.employerid) ? true : false;
            vm.plaintiffInfo.plaintiffid = selectedPlaintiff.plaintiffid;
            vm.plaintiffInfo.matterid = selectedPlaintiff.matterid;

            //set salary mode for selected plaintiff
            vm.plaintiffInfo.salarymode = utils.isEmptyVal(selectedPlaintiff.salarymode) ? '2' : selectedPlaintiff.salarymode;
            vm.setsalaryMode();

            //US#5874: set primary language for selected plaintiff
            vm.plaintiffInfo.primarylanguage = selectedPlaintiff.primarylanguage
        };

        $scope.$on("contactCardEdited", function (event, editedContact) {
            var contact = editedContact;
            if (vm.plaintiffInfo.employerid && vm.plaintiffInfo.employerid.length > 0) {
                _.forEach(vm.plaintiffInfo.employerid, function (emp) {

                    if (emp.contactid.contactid === contact.contactid) {
                        emp.contactid = angular.extend({}, emp.contactid, contact);
                        emp.contactid.phone_number = utils.isNotEmptyVal(emp.contactid.phone) ?
                            emp.contactid.phone.split(',')[0] : emp.contactid.phone;
                        emp.contactid.emailid = utils.isNotEmptyVal(emp.contactid.email) ?
                            emp.contactid.email.split(',')[0] : emp.contactid.email;
                        contactFactory.formatContactAddress(emp.contactid);
                        emp.contactid.edited = true;
                    }
                });
            }
        });

        function getContacts(contactName, searchItem) {

            var postObj = {};
            switch (searchItem) {
                case "PLAINTIFF":
                    postObj.type = globalConstants.plaintiffTypeList;
                    break;
                case "ESTATE_ADMIN":
                    postObj.type = globalConstants.estateAdminTypeList;
                    break;
                case "GUARDIAN":
                    postObj.type = globalConstants.gaurdianTypeList;
                    break;

                case "SCHOOL":
                    postObj.type = globalConstants.schoolTypeList;
                    break;
                case "EMPLOYEE":
                    postObj.type = globalConstants.employeeTypeList;
                    break;
                case "allTypeList":
                    postObj.type = globalConstants.allTypeList;
                    break;
                case "allTypeListWithoutCourt":
                    postObj.type = globalConstants.allTypeListWithoutCourt;
                    break;

            }
            // postObj.type = searchItem == 'PLAINTIFF' ? ['Law Firm'] : ['Person', 'Estate Administrator', 'Estate Executor', 'Business', 'Educational Institution', 'Medical Provider', 'Law Firm', 'Other'];
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            //postObj = matterFactory.setContactType(postObj);
            postObj.page_Size = 250;

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

        function openCalender($event, model) {
            $event.preventDefault();
            $event.stopPropagation();
            vm[model] = true;
        }

        function goToNextPage() {
            if (!vm.isEditMode) {
                if (vm.currentPage.searchOrAdd) {
                    plaintiffDataCopy = (!plaintiffDataCopy) ? angular.copy(vm.plaintiffInfo) : plaintiffDataCopy;
                    allPartiesDataService.getPlaintiffByContactId(vm.plaintiffInfo.contact.contactid)
                        .then(function (response) {
                            if (response) {
                                vm.plaintiffInfo.contactid = response.contactid;
                                vm.plaintiffInfo.dateofbirth = (utils.isEmptyVal(response.dateofbirth)) ? "" : moment.unix(response.dateofbirth).utc().format('MM/DD/YYYY');
                                vm.plaintiffInfo.dateofdeath = (utils.isEmptyVal(response.dateofdeath)) ? "" : moment.unix(response.dateofdeath).utc().format('MM/DD/YYYY');
                                vm.plaintiffInfo.employerid = response.employerid;
                                vm.plaintiffInfo.estateadminid = response.estateadminid;
                                vm.plaintiffInfo.gender = response.gender;
                                vm.plaintiffInfo.guardianid = response.guardianid;
                                vm.plaintiffInfo.is_global = response.is_global;
                                vm.plaintiffInfo.isalive = response.isalive;
                                vm.plaintiffInfo.isemployed = response.isemployed == 1 ? true : false;
                                vm.plaintiffInfo.isminor = response.isinfant == 1 ? true : false;
                                vm.plaintiffInfo.isprimary = response.isprimary == 1 ? true : false;
                                vm.plaintiffInfo.isstudent = response.isstudent == 1 ? true : false;
                                vm.plaintiffInfo.maritalstatus = response.maritalstatus;
                                vm.plaintiffInfo.primarylanguage = response.primarylanguage;
                                vm.plaintiffInfo.ssn = response.ssn;
                                vm.plaintiffInfo.studentinstitutionid = response.studentinstitutionid;
                                vm.plaintiffInfo.studentprogram = response.studentprogram;
                                vm.plaintiffInfo.studentlostdays = response.studentlostdays;
                                vm.plaintiffInfo.memo = response.memo;
                                vm.plaintiffInfo.poa_type = response.poa_type;
                                vm.plaintiffInfo.retainer_date = (utils.isEmptyVal(response.retainer_date)) ? "" : moment.unix(response.retainer_date).utc().format('MM/DD/YYYY');
                                vm.plaintiffInfo.closing_statement_date = (utils.isEmptyVal(response.closing_statement_date)) ? "" : moment.unix(response.closing_statement_date).utc().format('MM/DD/YYYY');
                                vm.plaintiffInfo.retainer_no = response.retainer_no;
                                vm.plaintiffInfo.closing_statement_no = response.closing_statement_no;
                                nxtPageSetting();
                            } else {
                                vm.plaintiffInfo = angular.copy(plaintiffDataCopy);
                                nxtPageSetting();
                            }
                        }, function () {
                            nxtPageSetting();
                        });
                } else {

                    if ((utils.isEmptyVal(vm.plaintiffInfo.estateadminid)) || (utils.isNotEmptyVal(vm.plaintiffInfo.estateadminid.contactid))) {
                        vm.plaintiffInfo.estateadminid;
                    } else {
                        return notificationService.error("Invalid Contact Selected");
                    }
                    var dateofbirth = vm.plaintiffInfo.dateofbirth;
                    var dateofdeath = vm.plaintiffInfo.dateofdeath;
                    var ssnNumber = vm.plaintiffInfo.ssn;

                    if (utils.isNotEmptyVal(dateofdeath) && utils.isEmptyVal(dateofbirth)) {
                        notificationService.error("Date of Birth should be Present");
                        return;
                    }

                    if (!utils.isEmptyVal(vm.plaintiffInfo.ssn) && vm.plaintiffInfo.ssn.length < 11) {
                        notificationService.error("Invalid SSN number");
                        return;
                    }

                    if (utils.isNotEmptyVal(dateofbirth) && utils.isNotEmptyVal(dateofdeath)) {
                        var dateofbirth = moment(dateofbirth);
                        var dateofdeath = moment(dateofdeath);
                        if (dateofdeath.isBefore(dateofbirth)) {
                            notificationService.error('Date of Death should be after Date of Birth');
                            return;
                        }
                    }

                    nxtPageSetting();
                    if (vm.processEmployment) {
                        vm.processEmployment = false;
                        if (vm.plaintiffInfo.employerid && typeof (vm.plaintiffInfo.employerid) === 'object' && vm.plaintiffInfo.employerid.length > 0) {
                            vm.plaintiffInfo.employerid.sort(function (a, b) { return b.employmentstartdate - a.employmentstartdate; })
                            angular.forEach(vm.plaintiffInfo.employerid, function (fieldOperty, indexOparty) {
                                fieldOperty.employmentstartdate = (utils.isEmptyVal(fieldOperty.employmentstartdate) || fieldOperty.employmentstartdate == 0) ? "" : moment.unix(fieldOperty.employmentstartdate).utc().format('MM/DD/YYYY');
                                fieldOperty.employmentenddate = (utils.isEmptyVal(fieldOperty.employmentenddate) || fieldOperty.employmentenddate == 0) ? "" : moment.unix(fieldOperty.employmentenddate).utc().format('MM/DD/YYYY');
                                fieldOperty.salarymode = vm.setSalMode(fieldOperty.salarymode);
                                contactFactory.formatContactAddress(fieldOperty.contactid);
                                delete fieldOperty.plaintiffid;
                                delete fieldOperty.employerid;
                                delete fieldOperty.createdby;
                                delete fieldOperty.createddate;
                                delete fieldOperty.modifiedby;
                                delete fieldOperty.modifieddate;
                                vm.currentRecIndex++;
                                fieldOperty.recIndex = vm.currentRecIndex;
                            });
                            $("#empInfo").addClass("collapse in");
                            $("#empInfo").css("height", "auto");
                            $("#empInfo").removeClass("collapsing");

                        }
                    }

                    if (vm.plaintiffInfo.isstudent) {
                        $("#studInfo").addClass("collapse in");
                        $("#studInfo").css("height", "auto");
                        $("#studInfo").removeClass("collapsing");
                    }
                }
            } else {

                //US#6288 To check Valid Estate Administrator Contact
                if ((utils.isEmptyVal(vm.plaintiffInfo.estateadminid)) || (utils.isNotEmptyVal(vm.plaintiffInfo.estateadminid.contactid))) {
                    vm.plaintiffInfo.estateadminid;
                } else {
                    return notificationService.error("Invalid Contact Selected");
                }
                var dateofbirth = vm.plaintiffInfo.dateofbirth;
                var dateofdeath = vm.plaintiffInfo.dateofdeath;
                var ssnNumber = vm.plaintiffInfo.ssn;

                if (utils.isNotEmptyVal(dateofdeath) && utils.isEmptyVal(dateofbirth)) {
                    notificationService.error("Date of Birth should be Present");
                    return;
                }

                if (!utils.isEmptyVal(vm.plaintiffInfo.ssn) && vm.plaintiffInfo.ssn.length < 11) {
                    notificationService.error("Invalid SSN number");
                    return;
                }

                if (utils.isNotEmptyVal(dateofbirth) && utils.isNotEmptyVal(dateofdeath)) {
                    var dateofbirth = moment(dateofbirth);
                    var dateofdeath = moment(dateofdeath);
                    if (dateofdeath.isBefore(dateofbirth)) {
                        notificationService.error('Date of Death should be after Date of Birth');
                        return;
                    }
                }
                nxtPageSetting();
            }
        };

        function nxtPageSetting() {
            angular.forEach(vm.currentPage, function (val, key) {
                if (val) {
                    if (vm.completedPages.indexOf(key) < 0) {
                        vm.completedPages.push(key);
                    }
                }
            });

            vm.currentPage = addPlaintiffFactory.nextPage(angular.copy(vm.currentPage));
        };

        function goToPage(pageNm) {
            if (vm.completedPages.indexOf("searchOrAdd") >= 0) {

                angular.forEach(vm.currentPage, function (val, key) {
                    vm.currentPage[key] = false;
                });

                vm.currentPage[pageNm] = true;
            }
        };

        function isPlaintiffMinor(dob) {
            if (angular.isUndefined(dob)) {
                return false;
            }
            var birthDate = moment(dob);
            var diff = moment().diff(moment(birthDate).format("MM/DD/YYYY"), 'years');
            vm.plaintiffInfo.isminor = diff < 18;
            return diff < 18;
        }

        vm.deleteSelectedEmp = function (emp, recIndex) {
            var eid = emp.employerid;
            var plaintiff = vm.plaintiffInfo;
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                if (!vm.plaintiffInfo.employerid_deleted) {
                    vm.plaintiffInfo.employerid_deleted = [];
                }
                if (eid) {
                    vm.plaintiffInfo.employerid_deleted.push(eid);
                    var index = _.indexOf(plaintiff.employerid, _.findWhere(plaintiff.employerid, { employerid: eid }));
                    if (index > -1) {
                        plaintiff.employerid.splice(index, 1);
                    }
                } else {
                    var index = _.indexOf(plaintiff.employerid_new, _.findWhere(plaintiff.employerid_new, { recIndex: emp.recIndex }));
                    if (index > -1) {
                        vm.plaintiffInfo.employerid_new.splice(index, 1);
                    }
                    var indexRec = _.indexOf(plaintiff.employerid, _.findWhere(plaintiff.employerid, { recIndex: emp.recIndex }));
                    if (indexRec > -1) {
                        vm.plaintiffInfo.employerid.splice(indexRec, 1);
                    }
                }

            });
        };

        function addNewEmployer(empRecord, recIndex) {
            if (empRecord) {
                var empRecordCopy = angular.copy(empRecord);
                var empRecordAnotherCopy = angular.copy(empRecord);
                empRecordAnotherCopy.salarymode = setMode(empRecord.salarymode);
            }
            var modalInstance = $modal.open({
                templateUrl: 'app/all-parties/add-plaintiff/add-employer/addNewEmployer.html',
                controller: 'AddEmployerCtrl as addEmp',
                windowClass: 'modalXLargeDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    data: function () {
                        return {
                            emp: (empRecord) ? empRecordAnotherCopy : { iscurrent: 0, salarymode: "2" },
                            plaintiff: vm.plaintiffInfo,
                            op: (empRecord) ? 'edit' : 'add'
                        };
                    }
                }
            });
            modalInstance.result.then(function (response) {
                if (response) {
                    if (response.empData) {
                        contactFactory.formatContactAddress(response.empData.contactid);
                        var eData = response.empData;

                        var dataCopy = eData;
                        dataCopy.employmentstartdate = (utils.isEmptyVal(dataCopy.employmentstartdate)) ? "" : moment(dataCopy.employmentstartdate).format('MM/DD/YYYY');
                        dataCopy.employmentenddate = (utils.isEmptyVal(dataCopy.employmentenddate)) ? "" : moment(dataCopy.employmentenddate).format('MM/DD/YYYY');
                        dataCopy.is_global = (!utils.isEmptyVal(dataCopy.contactid) && dataCopy.contactid.contact_type == "Local") ? 0 : 1;
                        dataCopy.salarymode = setSalMode(dataCopy.salarymode);

                        if (vm.isEditMode) {
                            // In edit mode call the add/edit immediately
                            if (!vm.plaintiffInfo.employerid_new) {
                                vm.plaintiffInfo.employerid_new = [];
                            }
                            if (!vm.plaintiffInfo.employerid_updated) {
                                vm.plaintiffInfo.employerid_updated = [];
                            }
                            if (!vm.plaintiffInfo.employerid) {
                                vm.plaintiffInfo.employerid = [];
                            }

                            if (eData.employerid) {
                                // Edit operation
                                var index = _.indexOf(vm.plaintiffInfo.employerid_updated, _.findWhere(vm.plaintiffInfo.employerid_updated, { employerid: eData.employerid }));
                                if (index > -1) {
                                    vm.plaintiffInfo.employerid_updated[index] = dataCopy;
                                } else {
                                    vm.plaintiffInfo.employerid_updated.push(dataCopy);
                                }

                                var index = _.indexOf(vm.plaintiffInfo.employerid, _.findWhere(vm.plaintiffInfo.employerid, { employerid: dataCopy.employerid }));
                                if (index > -1) {
                                    vm.plaintiffInfo.employerid[index] = dataCopy;
                                }

                            } else {
                                // Add operation
                                if (typeof (recIndex) !== 'undefined' && recIndex != null) {
                                    // Edit operation
                                    var index = _.indexOf(vm.plaintiffInfo.employerid, _.findWhere(vm.plaintiffInfo.employerid, { recIndex: eData.recIndex }));
                                    if (index > -1) {
                                        vm.plaintiffInfo.employerid[recIndex] = dataCopy;
                                    }

                                    var index = _.indexOf(vm.plaintiffInfo.employerid_new, _.findWhere(vm.plaintiffInfo.employerid_new, { recIndex: eData.recIndex }));
                                    if (index > -1) {
                                        vm.plaintiffInfo.employerid_new[recIndex] = dataCopy;
                                    }
                                } else {
                                    vm.currentRecIndex++;
                                    dataCopy.recIndex = vm.currentRecIndex;
                                    vm.plaintiffInfo.employerid.push(dataCopy);
                                    vm.plaintiffInfo.employerid_new.push(dataCopy);
                                }

                            }
                        } else {
                            // In add mode store the employers locally and make a single call
                            if (typeof (recIndex) !== 'undefined' && recIndex != null) {
                                // Edit operation
                                var index = _.indexOf(vm.plaintiffInfo.employerid, _.findWhere(vm.plaintiffInfo.employerid, { recIndex: eData.recIndex }));
                                if (index > -1) {
                                    vm.plaintiffInfo.employerid[recIndex] = dataCopy;
                                }

                            } else {
                                vm.currentRecIndex++;
                                // Add operation
                                if (!vm.plaintiffInfo.employerid) {
                                    vm.plaintiffInfo.employerid = [];
                                }
                                dataCopy.recIndex = vm.currentRecIndex;
                                vm.plaintiffInfo.employerid.push(dataCopy);
                            }
                        }

                    } else {
                        // on cancellation restore all values.
                        empRecord.salarymode = empRecordCopy.salarymode;
                        empRecord.employmentstartdate = empRecordCopy.employmentstartdate;
                        empRecord.employmentenddate = empRecordCopy.employmentenddate;
                        empRecord.contactid = empRecordCopy.contactid;
                        empRecord.occupation = empRecordCopy.occupation;
                        empRecord.position = empRecordCopy.position;
                        empRecord.monthlysalary = empRecordCopy.monthlysalary;
                        empRecord.memo = empRecordCopy.memo;
                        empRecord.lostdays = empRecordCopy.lostdays;
                        empRecord.iscurrent = empRecordCopy.iscurrent;
                    }

                    if (response.error) {
                        notificationService.error('An error occurred. Please try later.');
                    }

                }
            });
        }

        function addNewContact(type) {
            var selectedType = {};
            selectedType.type = type;
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                response['firstname'] = response.first_name;
                response['lastname'] = response.last_name;
                response['contactid'] = (response.contact_id).toString();
                if (utils.isNotEmptyVal(response)) {
                    switch (type) {
                        case "PLAINTIFF":
                            initPlaintiff();
                            vm.plaintiffInfo.contact = response;
                            break;
                        case "ESTATE_ADMIN":
                            vm.plaintiffInfo.estateadminid = response;
                            break;
                        case "allTypeList":
                            vm.plaintiffInfo.estateadminid = response;
                            break;
                        case "allTypeListWithoutCourt":
                            vm.plaintiffInfo.estateadminid = response;
                            break;
                        case "GUARDIAN":
                            vm.plaintiffInfo.guardianid = response;
                            break;
                        case "SCHOOL":
                            vm.plaintiffInfo.studentinstitutionid = response;
                            break;
                        case "EMPLOYEE":
                            vm.plaintiffInfo.employerid = response;
                            break;
                    }
                }
            }, function () {
            });
        };

        // save plaintiff
        function savePlaintiff() {
            //
            if (utils.isEmptyVal(vm.plaintiffInfo.contact)) {
                notificationService.error("Plaintiff name can not be empty");
                return;
            }
            //US#6288 To check valid guardian name
            if (utils.isEmptyVal(vm.plaintiffInfo.guardianid) || utils.isNotEmptyVal(vm.plaintiffInfo.guardianid.contactid)) {
                vm.plaintiffInfo.guardianid;
            } else {
                if (vm.plaintiffInfo.isminor) {
                    notificationService.error("Invalid Guardian Name");
                    return;
                }
            }
            //US#6288 To check valid Institute name
            if ((utils.isEmptyVal(vm.plaintiffInfo.studentinstitutionid) || utils.isNotEmptyVal(vm.plaintiffInfo.studentinstitutionid.contactid)) && vm.plaintiffInfo.isstudent) {
                vm.plaintiffInfo.studentinstitutionid;
            } else {
                if (vm.plaintiffInfo.isstudent) {
                    notificationService.error("Invalid Institute name");
                    return;
                }
            }

            var plaintiffinfo = {};
            // pluck the information from different associated objects and push to the plaintiff info object
            plaintiffinfo.contactid = utils.isEmptyVal(vm.plaintiffInfo.contact) ? null : vm.plaintiffInfo.contact.contactid;
            plaintiffinfo.guardianid = utils.isEmptyVal(vm.plaintiffInfo.guardianid) ? null : vm.plaintiffInfo.guardianid.contactid;
            plaintiffinfo.studentinstitutionid = utils.isEmptyVal(vm.plaintiffInfo.studentinstitutionid) ? null : vm.plaintiffInfo.studentinstitutionid.contactid;

            //changes made for Show DOD
            if (vm.plaintiffInfo.isalive == "0") {
                plaintiffinfo.dateofdeath = utils.isEmptyVal(vm.plaintiffInfo.dateofdeath) ? null : utils.getUTCTimeStamp(vm.plaintiffInfo.dateofdeath); //moment(vm.plaintiffInfo.dateofdeath).format("MM/DD/YYYY");
            }

            // Set POA-type & estateadmin/poa details
            plaintiffinfo.poa_type = (!utils.isEmptyVal(vm.plaintiffInfo.estateadminid) && vm.plaintiffInfo.estateadminid.contact_type == "Local") ? 0 : 1;
            plaintiffinfo.estateadminid = utils.isEmptyVal(vm.plaintiffInfo.estateadminid) ? null : vm.plaintiffInfo.estateadminid.contactid;

            // Check if the gender is set
            plaintiffinfo.gender = vm.plaintiffInfo.gender ? vm.plaintiffInfo.gender : "Not specified";

            // Check if the maritalstatus is set
            plaintiffinfo.maritalstatus = vm.plaintiffInfo.maritalstatus ? vm.plaintiffInfo.maritalstatus : "Not specified";

            // set matter id 
            plaintiffinfo.matterid = matterId;
            // set deleted = 0 
            plaintiffinfo.deleted = 0;

            // set DOB
            plaintiffinfo.dateofbirth = utils.isEmptyVal(vm.plaintiffInfo.dateofbirth) ? null : utils.getUTCTimeStamp(vm.plaintiffInfo.dateofbirth); //moment(vm.plaintiffInfo.dateofbirth).format("MM/DD/YYYY");
            plaintiffinfo.utcdateofbirth = utils.isEmptyVal(vm.plaintiffInfo.dateofbirth) ? null : utils.getUTCTimeStamp(vm.plaintiffInfo.dateofbirth); //moment(vm.plaintiffInfo.dateofbirth).format('MM/DD/YYYY')

            //set Retainer Date
            plaintiffinfo.retainer_date = utils.isEmptyVal(vm.plaintiffInfo.retainer_date) ? null : utils.getUTCTimeStamp(vm.plaintiffInfo.retainer_date); //moment(vm.plaintiffInfo.dateofbirth).format("MM/DD/YYYY");
            plaintiffinfo.closing_statement_date = utils.isEmptyVal(vm.plaintiffInfo.closing_statement_date) ? null : utils.getUTCTimeStamp(vm.plaintiffInfo.closing_statement_date);
            //set ssn
            plaintiffinfo.ssn = vm.plaintiffInfo.ssn;
            plaintiffinfo.retainer_no = vm.plaintiffInfo.retainer_no ? vm.plaintiffInfo.retainer_no : null;
            plaintiffinfo.closing_statement_no = vm.plaintiffInfo.closing_statement_no ? vm.plaintiffInfo.closing_statement_no : null;
            //set flags
            plaintiffinfo.isprimary = vm.plaintiffInfo.isprimary ? "1" : "0";
            plaintiffinfo.isinfant = vm.plaintiffInfo.isminor ? "1" : "0";
            plaintiffinfo.isstudent = vm.plaintiffInfo.isstudent ? "1" : "0";
            plaintiffinfo.isemployed = vm.plaintiffInfo.isemployed ? "1" : "0";
            plaintiffinfo.isalive = vm.plaintiffInfo.isalive ? vm.plaintiffInfo.isalive : "2";

            if (vm.plaintiffInfo.isstudent) {
                plaintiffinfo.studentprogram = vm.plaintiffInfo.studentprogram;
                plaintiffinfo.studentlostdays = vm.plaintiffInfo.studentlostdays;
            }

            //set salary Mode for save
            plaintiffinfo.salarymode = vm.plaintiffInfo.salarymode;

            //US#5678-set primary language for save
            plaintiffinfo.primarylanguage = vm.plaintiffInfo.primarylanguage

            plaintiffinfo.employerid = angular.copy(vm.plaintiffInfo.employerid);

            if (vm.isEditMode) {
                plaintiffinfo.plaintiffid = vm.plaintiffInfo.plaintiffid;
                // Update employers if any
                if (vm.plaintiffInfo.employerid_updated && vm.plaintiffInfo.employerid_updated.length > 0) {
                    var updatedEmp = angular.copy(vm.plaintiffInfo.employerid_updated);
                    angular.forEach(updatedEmp, function (rec, key) {
                        if (!vm.plaintiffInfo.employerid_deleted) {
                            vm.plaintiffInfo.employerid_deleted = [];
                        }
                        if (rec.employerid && !_.contains(vm.plaintiffInfo.employerid_deleted, rec.employerid)) {
                            rec.plaintiffid = vm.plaintiffInfo.plaintiffid;
                            rec.employmentstartdate = utils.isEmptyVal(rec.employmentstartdate) ? "" : utils.getUTCTimeStamp(rec.employmentstartdate);
                            rec.employmentenddate = utils.isEmptyVal(rec.employmentenddate) ? "" : utils.getUTCTimeStamp(rec.employmentenddate);
                            rec.salarymode = setMode(rec.salarymode);
                            rec.is_global = (!utils.isEmptyVal(rec.contactid) && rec.contactid.contact_type == "Local") ? 0 : 1;
                            rec.contactid = rec.contactid.contactid;
                            allPartiesDataService.editPlaintiffEmployee(rec).then(function (response) {

                            }, function (reason) {
                                notificationService.error('An error occurred. Please try later.');
                            });
                        }

                    });

                }

                // Add employers if any
                if (vm.plaintiffInfo.employerid_new && vm.plaintiffInfo.employerid_new.length > 0) {
                    var insertedEmp = angular.copy(vm.plaintiffInfo.employerid_new);
                    angular.forEach(insertedEmp, function (rec, key) {
                        rec.plaintiffid = vm.plaintiffInfo.plaintiffid;
                        rec.employmentstartdate = utils.isEmptyVal(rec.employmentstartdate) ? "" : utils.getUTCTimeStamp(rec.employmentstartdate);
                        rec.employmentenddate = utils.isEmptyVal(rec.employmentenddate) ? "" : utils.getUTCTimeStamp(rec.employmentenddate);
                        rec.salarymode = setMode(rec.salarymode);
                        rec.is_global = (!utils.isEmptyVal(rec.contactid) && rec.contactid.contact_type == "Local") ? 0 : 1;
                        rec.contactid = rec.contactid.contactid;
                    });
                    allPartiesDataService.addPlaintiffEmployers(insertedEmp).then(function (response) {
                    }, function (reason) {
                        notificationService.error('An error occurred. Please try later.');
                    });
                }

                // Delete employers if any
                if (vm.plaintiffInfo.employerid_deleted && vm.plaintiffInfo.employerid_deleted.length > 0) {
                    angular.forEach(vm.plaintiffInfo.employerid_deleted, function (rec, key) {
                        allPartiesDataService.deletePlaintiffsEmployee(rec).then(function (data) {
                        }, function (error) {
                            notificationService.error('An error occurred. Please try later.');
                        });
                    });
                }

                plaintiffinfo.employerid = null;

                allPartiesDataService.editPlaintiff(plaintiffinfo).then(function (response) {
                    notificationService.success('Plaintiff updated successfully!');
                    sessionStorage.removeItem("selectedPlaintiff");
                    var matterInfo = matterFactory.getMatterData();
                    if (matterInfo.plaintiff_contactid == response.data.contactid.contactid) {
                        matterInfo.dateofbirth = response.data.dateofbirth;
                        matterInfo.intake_date = matterInfo.dateofincidence ? moment.unix(matterInfo.dateofincidence).utc().format('MM/DD/YYYY') : '';
                        matterInfo.date_birth = matterInfo.dateofbirth ? moment.unix(matterInfo.dateofbirth).utc().format('MM/DD/YYYY') : '';
                    }
                    matterFactory.setMatterData(matterInfo);
                    $state.go("allParties", { 'matterId': matterId });

                }, function (reason) {
                    notificationService.error('An error occurred. Please try later.');
                });

            } else {
                angular.forEach(plaintiffinfo.employerid, function (fieldOperty, indexOparty) {
                    fieldOperty.employmentstartdate = utils.isEmptyVal(fieldOperty.employmentstartdate) ? "" : utils.getUTCTimeStamp(fieldOperty.employmentstartdate);
                    fieldOperty.employmentenddate = utils.isEmptyVal(fieldOperty.employmentenddate) ? "" : utils.getUTCTimeStamp(fieldOperty.employmentenddate);
                    fieldOperty.salarymode = setMode(fieldOperty.salarymode);
                    fieldOperty.contactid = fieldOperty.contactid.contactid;
                });
                addPlaintiff(plaintiffinfo);
            }
        }

        function addPlaintiff(plaintiffinfo) {
            if (plaintiffinfo.isemployed == 0 && plaintiffinfo.employerid) {
                delete plaintiffinfo.employerid;
            }
            allPartiesDataService.addPlaintiff(plaintiffinfo).then(function (response) {
                notificationService.success('Plaintiff added successfully!');
                $state.go("allParties", { 'matterId': matterId }, { reload: true });
            }, function (reason) {
                notificationService.error('An error occurred. Please try later.');
            });
        }

        function cancelSave() {
            sessionStorage.removeItem("selectedPlaintiff");
            $state.go("allParties", { 'matterId': matterId });
        }

        function disableNext() {
            if (vm.currentPage.searchOrAdd && typeof vm.plaintiffInfo.contact === 'object') {
                return false;
            } else if (vm.currentPage.generalInfo) {
                return false;
            }
            return true;
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

            return "sprite default-wizard-ongoing";
        };

        function getGenInfoStepClass() {
            if (vm.currentPage.searchOrAdd) {
                return "sprite default-wizard-tostart";
            } else if (vm.currentPage.generalInfo) {
                return "sprite default-wizard-ongoing";
            } else if (vm.currentPage.otherInfo) {
                return "sprite default-wizard-completed";
            }
            return "sprite default-wizard-tostart";
        };

        function getOtherInfoStepClass() {
            if (vm.currentPage.generalInfo) {
                return "sprite default-wizard-tostart";
            } else if (vm.currentPage.otherInfo) {
                return "sprite default-wizard-ongoing";
            }
            return "sprite default-wizard-tostart";
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

        function getGenInfoConnectorClass() {
            if (vm.currentPage.generalInfo) {
                return "col-md-4 connector gray-connector";
            } else if (vm.currentPage.otherInfo) {
                return "col-md-4 connector filled-connector";
            }
            return "col-md-4 connector gray-connector";
        };

        /*function getOtherInfoConnectorClass() {
            if (vm.currentPage.otherInfo) {
                return "col-md-4 connector gray-connector";
            }
            return "col-md-4 connector";
        };*/
    }


})();

(function () {

    'use strict';

    angular.module('cloudlex.allParties')
        .factory('addPlaintiffFactory', addPlaintiffFactory);

    function addPlaintiffFactory() {

        var pagesInfo = {
            "searchOrAdd": { next: "generalInfo", prev: "" },
            "generalInfo": { next: "otherInfo", prev: "searchOrAdd" },
            "otherInfo": { next: "", prev: "generalInfo" },
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
