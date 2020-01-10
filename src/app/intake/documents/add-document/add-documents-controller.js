/* Document Upload module controller. 
 * */
(function () {

    'use strict';

    angular
        .module('intake.documents')
        .controller('IntakeAddDocumentsCtrl', IntakeAddDocumentsCtrl);

    IntakeAddDocumentsCtrl.$inject = ['$scope', '$rootScope', '$q', 'inatkeDocumentsDataService', '$stateParams',
        'routeManager', 'notification-service', '$state', 'intakeDocumentsConstants', 'usSpinnerService', 'intakeFactory',
        'intakeDocumentAddHelper', 'IntakePlaintiffDataService', 'modalService', 'masterData', 'intakeTaskAgeDatalayer', 'globalConstants','contactFactory'];

    function IntakeAddDocumentsCtrl($scope, $rootScope, $q, inatkeDocumentsDataService, $stateParams,
        routeManager, notificationService, $state, intakeDocumentsConstants, usSpinnerService, intakeFactory,
        intakeDocumentAddHelper, IntakePlaintiffDataService, modalService, masterData, intakeTaskAgeDatalayer, globalConstants,contactFactory) {

        var self = this;
        self.goOnline = goOnline;
        self.cancelCreateOnline = cancelCreateOnline;
        self.onlineDocType = 'docx';
        /*Initial value variable*/
        self.matterId = 0;
        var matterId = 0;
        var dynamicSelect;
        self.officeOnlineStat = false;
        self.needReview = needReview;
        self.needReviewMultiUpload = needReviewMultiUpload;
        self.docModel = {};
        self.insuranceTypeList = angular.copy(globalConstants.insuranceTypeList);
        //check api call to get Contacts
        self.allFirmDetails = JSON.parse(localStorage.getItem('allFirmSetting'));
        _.forEach(self.allFirmDetails, function (currentItem) {
            if (currentItem.state == "contacts") {
                if (currentItem.API == "JAVA") {
                    self.JavaFilterAPIForContactList = true;
                } else {
                    self.JavaFilterAPIForContactList = false;
                }
            }
        });

        if ($state.current.name == 'intakedocument-upload') {
            self.matterId = $stateParams.intakeId;
            matterId = $stateParams.intakeId;
            self.isGlobal = false;
            //set breadcrum
            setBreadcrum(self.matterId);
        } else if ($state.current.name == 'intakeglobaldocument-upload') {
            self.isGlobal = true;
            var matters = [];
        } else if ($state.current.name == "intakecreate-online") {

            ($stateParams.intakeId != "") ? self.matterId = $stateParams.intakeId : '';
            if (self.matterId != 0) {
                setBreadcrum(self.matterId);
                getMatterDetails(self.matterId);
                getPlaintiffsForDocument(self.matterId);
                //getDefendants(self.matterId);
            } else {
                setToBreadcrumList(self.matterId);
            }
        }

        $scope.$on('ngRepeatFinishedMultiDoc', function (ngRepeatFinishedEvent) {
            utils.resizeNiceScroll();
        });

        /**
         * Get specific matter details
         */
        function getMatterDetails(matterId) {
            var dataObj = {
                "page_number": 1,
                "page_size": 250,
                "intake_id": matterId
            };
            var promise = intakeFactory.getMatterList(dataObj);
            promise
                .then(function (response) {
                    matters = response.intakeData[0];
                    self.docModel.document_name = '';
                    self.docModel.matterid = response.intakeData[0].intakeId;

                }, function (error) {
                    // notification.error('unable to fetch matter overview. Reason: ' + error.statusText);
                });
        }

        /**
         * go online
         */
        function goOnline() {
            if (self.officeOnlineStat) {
                if (self.matterId != 0) {
                    $state.go('intakecreate-online', { "intakeId": self.matterId });
                } else {
                    $state.go('intakecreate-online');
                }

            } else {
                notificationService.error("Please subscribe Microsoft Office Online!");
            }
        }

        function cancelCreateOnline() {
            if (self.matterId != 0) {
                $state.go('intake-documents', { intakeId: self.matterId });
            } else {
                $state.go('intakedocuments');
            }
        }

        function setBreadcrum(matterId) {
            var initCrum = [{ name: '...' }];
            routeManager.setBreadcrum(initCrum);
            var matterinfo = intakeFactory.getMatterData();

            if (utils.isEmptyObj(matterinfo) || (parseInt(matterinfo.intakeId) !== parseInt(matterId))) {
                intakeFactory.fetchMatterData(matterId).then(function (response) {
                    var matterData = response;
                    addToBreadcrumList(matterData, matterId);
                });
            } else {
                addToBreadcrumList(matterinfo, matterId);
            }
        }

        function setToBreadcrumList() {
            var initCrum = [{ name: '...' }];
            routeManager.setBreadcrum(initCrum);
            var breadcrum = [
                {
                    name: 'Documents', state: 'intake-documents'
                },
                { name: 'Create Online Document' }];
            routeManager.addToBreadcrum(breadcrum);
        }

        function addToBreadcrumList(matteData, matterId) {
            var breadcrum = [
                {
                    name: matteData.intakeName, state: 'intake-overview',
                    param: { intakeId: matterId }
                },
                {
                    name: 'Documents', state: 'intake-documents',
                    param: { intakeId: matterId }
                },
                { name: ($state.current.name == "intakecreate-online") ? 'Create Online' : 'Upload' }];
            routeManager.addToBreadcrum(breadcrum);
        }



        //self.CRSFToken = userSession.getToken();
        self.documentCategories = [];
        self.docPlaintiffs = [];
        self.docAddTags = [];

        /*Add/Edit document Variables*/
        // self.docModel = {};

        /* UI Handle Variable*/
        self.enableButtonSave = false;
        self.enableButtonCancel = true;
        self.singlefileUpload = false;
        self.multifileUpload = false;

        /* file upload variables*/
        self.dropzoneObj;
        self.documentProcessing = false;
        /*Single file upload variable*/
        self.singleFileProgress = 0;
        self.singleFileName = '';
        self.singleFileSize = '';
        self.singleuploadError = '';
        self.dynamicForm = {};
        self.singlePlaintiffError = '';
        var fileCount = 1;

        /*Multifile progress*/
        self.maxNumfiles = 20;
        self.multidocCount = 0;
        self.multiFilesdata = [];
        self.multiuploadError = 0;
        self.successMultiUpload = 0;

        //added below thing for document motion
        self.dateFormat = 'MM/dd/yyyy';
        self.datepickerOptions = {
            formatYear: 'yyyy',
            startingDay: 1,
            'show-weeks': false
        };

        self.dateOfServiceInUTC = '';
        self.returnableDateInUTC = '';

        self.openDateOfService = openDateOfService;
        self.openReturnableDate = openReturnableDate;

        self.dateOfServiceEvent = {};
        self.returnableDateEvent = {};

        self.showErrorMsgForDates = showErrorMsgForDates;
        self.calMedicalBill = calMedicalBill;
        self.groupPlaintiffDefendants = groupPlaintiffDefendants;
        self.setPartyRole = setPartyRole;
        self.setPartyRoleMultiUpload = setPartyRoleMultiUpload;
        self.getDocumentMotionContact = getDocumentMotionContact;
        self.formatTypeaheadDisplayForDocumentMotion = contactFactory.formatTypeaheadDisplay_Document;
        self.setType = setType;
        self.documentMotionDetailInfo = {};
        self.motionTitle = '';
        self.documentMotionValidationError = false;

        self.changeValues = intakeDocumentAddHelper.changeValues;
        self.addNewContactforDocumentMotion = addNewContactforDocumentMotion;
        self.formatTypeaheadDisplayPartials = contactFactory.formatTypeaheadDisplay_Document;
        self.getContacts = getContacts;
        self.addNewContact = addNewContact;
        self.addNewLineContact = addNewLineContact;
        self.openDatePicker = openDatePicker;
        self.incurredDatePicker = incurredDatePicker;
        self.calExpenseBill = calExpenseBill;
        self.changeExpenseValues = changeExpenseValues;
        self.openServiceEndDatePicker = openServiceEndDatePicker;
        self.allUser = [];
        self.setTypeMedicalBills = setTypeMedicalBills;
        self.addNewMbillsContact = addNewMbillsContact;
        (function () {
            window.parent.document.title = "Welcome to CloudLex";
            $rootScope.$emit('favicon', "favicon.ico");
            if (self.isGlobal === false) {
                getPlaintiffsForDocument(matterId);
            }
            getOfficeOnlineStatus(); // get office online status
            getDocCategories();
            //self.dynamicSelect = intakeDocumentAddHelper.dynamicFormOptions();
            dynamicSelect = intakeDocumentAddHelper.dynamicFormOptions();
            if ($state.current.name != "intakecreate-online") {
                initializeSingleFileDropnzone();
                initializeMultiUpload();
            }
            getUsers(); // get all users list for asign document review.
        })();

        function showErrorMsgForDates(startDate, endDate) {
            if (utils.isEmptyVal(startDate) || utils.isEmptyVal(endDate)) {
                return false;
            }

            var st, ed;

            if (typeof startDate === "string") {
                st = moment(startDate, "MM/DD/YYYY");
            } else if (startDate instanceof Date) {
                var dt = startDate.getMonth() + 1 + "/" + startDate.getDate() + "/" + startDate.getFullYear();
                st = moment(dt, "MM/DD/YYYY");
            }

            if (typeof endDate === "string") {
                ed = moment(endDate, "MM/DD/YYYY");
            } else if (endDate instanceof Date) {
                var dt = endDate.getMonth() + 1 + "/" + endDate.getDate() + "/" + endDate.getFullYear();
                ed = moment(dt, "MM/DD/YYYY");
            }

            return (utils.isEmptyVal(st) || utils.isEmptyVal(ed)) ? false : st.isAfter(ed);
        }

        function getContacts(contactName, searchItem) {
            var postObj = {};
            switch (searchItem) {
                case "liens":
                    postObj.type = globalConstants.docLinesTypeList;
                    break;
                case "medicalinfo":
                    postObj.type = globalConstants.docMedicalInfoTypeList;
                    break;
                case "docInsuAdjust":
                    postObj.type = globalConstants.docinsuProviderTypeList;
                    break;
                case "medicalbills":
                    postObj.type = globalConstants.docMedicalBillsList;
                    break;
                default:
                    postObj.type = globalConstants.docdefaultNameTypeList;
                    break;
            }
            // postObj.type = searchItem =='liens' ? globalConstants.docLinesTypeList: globalConstants.docdefaultNameTypeList ;
            postObj.fname = utils.isNotEmptyVal(contactName) ? contactName : '';
            postObj = intakeFactory.setContactType(postObj);
            return intakeFactory.getContactsByName(postObj, self.JavaFilterAPIForContactList)
                .then(function (response) {
                    var data = response.data;
                    contactFactory.setNamePropForContactsOffDrupal(data);
                    return data;
                });
        }

        function setTypeMotion(model) {
            self.documentMotionDetailInfo.is_global = (model.contact_type == 'Local') ? 0 : 1;
        }

        function setTypeMedicalBills(model) {
            self.newMedicalBillInfo.is_global = (model.contact_type == 'Local') ? 0 : 1;
        }


        function getDocumentMotionContact(contactName) {
            var postObj = {};
            postObj.type = globalConstants.docmotionsTypeList;
            postObj.fname = utils.isNotEmptyVal(contactName) ? contactName : '';
            postObj = intakeFactory.setContactType(postObj);
            return intakeFactory.getContactsByName(postObj, self.JavaFilterAPIForContactList)
                .then(function (response) {
                    var data = response.data;
                    contactFactory.setNamePropForContactsOffDrupal(data);
                    return data;
                });
        }


        function addNewContactforDocumentMotion(type) {
            var selectedType = {};
            selectedType.type = type;

            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (savedContact) {
                self.documentMotionDetailInfo.contact = savedContact[0];
                self.documentMotionDetailInfo.contact.email = intakeDocumentAddHelper.getStringFromArray(self.documentMotionDetailInfo.contact.email);
                self.documentMotionDetailInfo.contact.phone = intakeDocumentAddHelper.getStringFromArray(self.documentMotionDetailInfo.contact.phone);
            });
        }

        /* function handlers*/
        self.checkContact = checkContact;
        self.processDocuments = processDocuments;
        self.removeUploadingDocument = removeUploadingDocument;
        self.toggleButtons = toggleButtons;
        self.changeView = changeView;
        self.initializeSingleFileDropnzone = initializeSingleFileDropnzone;
        self.initializeMultiUpload = initializeMultiUpload;
        self.loadTags = loadTags;
        self.checkCatSeleted = checkCatSeleted;
        self.searchMatters = searchMatters;
        self.formatTypeaheadDisplay = formatTypeaheadDisplay;
        self.isDatesValid = isDatesValid;
        self.isMultiDatesValid = isMultiDatesValid;
        self.setTypeMotion = setTypeMotion;

        function calMedicalBill(paymentmode) {
            self.newMedicalBillInfo.paidamount = utils.isEmptyVal(self.newMedicalBillInfo.paidamount) ?
                null : self.newMedicalBillInfo.paidamount;
            self.newMedicalBillInfo.totalamount = utils.isEmptyVal(self.newMedicalBillInfo.totalamount) ?
                null : self.newMedicalBillInfo.totalamount;
            self.newMedicalBillInfo.outstandingamount = utils.isEmptyVal(self.newMedicalBillInfo.outstandingamount) ?
                null : self.newMedicalBillInfo.outstandingamount;

            intakeDocumentAddHelper.changeValues(self.newMedicalBillInfo);
        }

        function isDatesValid() {
            if ($('#docincurredError').css("display") == "block" || $('#docservicestartDateError').css("display") == "block" || $('#docserviceendDateError').css("display") == "block" ||
                $('#docmedstartDateErr').css("display") == "block" ||
                $('#docmedendDateErr').css("display") == "block" || $('#filledDatedivError').css("display") == "block" || $('#filedDatediv').css("display") == "block") {
                return true;
            }
            else {
                return false;
            }
        }
        function isMultiDatesValid(length) {
            for (var i = 0; i < length; i++) {
                if ($('#filedDatedivErr' + i).css("display") == "block") {
                    return true;
                }
            }
            return false;
        }
        /**
         * get office online subscribe status
         */
        function getOfficeOnlineStatus() {
            inatkeDocumentsDataService.getOfficeStatus()
                .then(function (response) {
                    self.officeOnlineStat = (response.data.O365.is_active == 1) ? true : false;
                }, function (error) {
                    notificationService.error('document categories not loaded');
                });
        }

        /*Get the Document Categories*/
        function getDocCategories() {
            if (utils.isEmptyObj(masterData.getMasterData())) {
                var request = masterData.fetchMasterData();
                $q.all([request]).then(function (values) {
                    self.documentCategories = values[0].documents_cat;
                    self.docModel.category = values[0].documents_cat[0];
                })
            } else {
                self.documentCategories = masterData.getMasterData().documents_cat;
                self.docModel.category = masterData.getMasterData().documents_cat[0];
            }
        }

        /*Get all plaintiffs*/
        function getPlaintiffsForDocument(matterId, index) {
            var deferred = $q.defer();
            inatkeDocumentsDataService.getPlaintiffs(matterId)
                .then(function (response) {
                    if (self.isGlobal && self.multifileUpload) {
                        self.docPlaintiffs = response;
                    } else {
                        self.docPlaintiffs = response;
                        self.singlePlaintiffError = '';
                        // if (self.docPlaintiffs.length == 0) {
                        //     self.singlePlaintiffError = "No Associated Plaintiffs with matter";
                        // }
                    }
                    //getDefendants(matterId, index);
                    //  getOtherparties(matterId);
                    deferred.resolve(response);
                }, function (error) {
                    notificationService.error('plaintiffs not loaded');
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function getDefendants(matterId, index) {
            IntakePlaintiffDataService.getDefendants(matterId)
                .then(function (res) {
                    self.docDefendants = res.data;
                    // IntakePlaintiffDataService.getOtherPartiesBasic(matterId)
                    //     .then(function (res) {
                    //         self.docOtherparties = res.data;
                    //         if (self.isGlobal && self.multifileUpload) {
                    //             self.multiFilesdata[index].docPlaintiffDefendants = getDocPlaintiffData(self.docPlaintiffs, self.docDefendants, self.docOtherparties);
                    //         } else {
                    //             self.docPlaintiffDefendants = getDocPlaintiffData(self.docPlaintiffs, self.docDefendants, self.docOtherparties);
                    //         }
                    //     });
                });
        }

        // function getOtherparties(matterId) {
        //     IntakePlaintiffDataService.getOtherParties(matterId)
        //         .then(function (res) {
        //             self.docOtherparties = res.data;
        //             self.docPlaintiffDefendants = getDocPlaintiffData(self.docPlaintiffs, self.docDefendants,self.docOtherparties);
        //         });
        // }

        function getDocPlaintiffData(plaintiffs, defendants, otherParties) {

            var plaintiffDefendantsArray = [];

            var plaintiff = plaintiffs.map(function (plaintiff) {
                var newplaintiff = {
                    id: plaintiff.plaintiffID,
                    name: plaintiff.plaintiffName,
                    type: 1 // 1 refer plaintiff
                };
                return newplaintiff;
            });
            plaintiffDefendantsArray = plaintiffDefendantsArray.concat(plaintiff);

            var defendants = defendants.map(function (defendant) {
                if (utils.isNotEmptyVal(defendant.contactid)) {
                    var defendantName = utils.isNotEmptyVal(defendant.contactid.firstname) ? defendant.contactid.firstname : " ";
                    defendantName += " " + utils.isNotEmptyVal(defendant.contactid.lastname) ? " " + defendant.contactid.lastname : " ";

                    var newDefendant = {
                        id: defendant.defendantid,
                        name: defendantName,
                        type: 2 // 2 refer defendant role
                    };
                    return newDefendant;
                }
            });
            plaintiffDefendantsArray = plaintiffDefendantsArray.concat(defendants);

            var otherParties = otherParties.map(function (otherParty) {
                if (utils.isNotEmptyVal(otherParty.contactid)) {
                    var otherPartyName = utils.isNotEmptyVal(otherParty.firstname) ? otherParty.firstname : " ";
                    otherPartyName += " " + utils.isNotEmptyVal(otherParty.lastname) ? " " + otherParty.lastname : " ";

                    var newOtherParty = {
                        id: otherParty.mattercontactid,
                        name: otherPartyName,
                        type: 3 // 3 refer other party role
                    };
                    return newOtherParty;
                }
            });
            plaintiffDefendantsArray = plaintiffDefendantsArray.concat(otherParties);

            return plaintiffDefendantsArray;
        }

        function addNewLineContact(model, prop) {
            var selectedType = {};
            selectedType.type = 'doclineTypes';

            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                model[prop] = response[0];
            }, function () {
            });
        }


        function addNewMbillsContact(model, prop) {
            var selectedType = {};
            selectedType.type = 'mbillsproviderid';

            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                model[prop] = response[0];
                setTypeMedicalBills(response[0]);
            }, function () {
            });
        }

        function setType(model, type) {
            switch (type) {
                case "insuprovider":
                    self.newLiensInfo.insu_provider_is_global = (model.contact_type == 'Local') ? 0 : 1;
                    break;
                case "linholder":
                    self.newLiensInfo.lien_holder_is_global = (model.contact_type == 'Local') ? 0 : 1;
                    break;
                case "adjuster":
                    self.newLiensInfo.lien_adjuster_is_global = (model.contact_type == 'Local') ? 0 : 1;
                    break;
            }
        }

        function addNewContact(model, prop, moreinfoType) {
            var selectedType = {};
            //selectedType.type = prop;
            switch (prop) {
                case "providerid":
                    selectedType.type = moreinfoType === 'docMedicalBills' ? 'mbillsproviderid' : 'docproviddmediinfo';
                    // selectedType.type = 'docproviddmediinfo';
                    break;
                case "physicianid":
                    selectedType.type = 'docmediinfophysicianid';
                    break;
                case "insuredpartyid":
                    selectedType.type = 'docinsuinsuredpartyid';
                    break;
                case "insuranceproviderid":
                    selectedType.type = 'docinsuranceproviderid';
                    break;
                case "adjusterid":
                    selectedType.type = 'docinsuadjusterid';
                    break;

            }
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                model[prop] = response[0];
            }, function () {
            });
        }

        function groupPlaintiffDefendants(party) {
            if (party.type == 1) {
                return "Plaintiffs";
            }

            if (party.type == 2) {
                return "Defendants";
            }

            if (party.type == 3) {
                return "Other Party";
            }

            return "All";
        }

        function setPartyRole(selectedItem, insuranceObj) {
            if (insuranceObj.category == 10) {
                self.multiFilesdata.associated_party_id = insuranceObj.associated_party_id
                self.docModel.associated_party_id = insuranceObj.docPlaintiff
                insuranceObj.party_role = 1;
            } else {
                insuranceObj['party_role'] = selectedItem.type;
            }
        }

        function setPartyRoleMultiUpload(selectedItem, insuranceObj) {
            if (insuranceObj.categoryid == 10) {
                self.docModel.associated_party_id = insuranceObj.docPlaintiff
                insuranceObj.party_role = 1;
            } else {
                insuranceObj.party_role = selectedItem.type;
            }
        }




        /*Get document tags*/
        function loadTags(query) {
            var tagData = {};
            tagData.searchtag = query;
            tagData.excludetags = self.docAddTags;
            return inatkeDocumentsDataService.loaddocTags(tagData);
        }

        /* Dummy call to server to keep session alive*/
        function keepSessionalive() {
            inatkeDocumentsDataService.keepSessionalive()
                .then(function (response) { });
        }

        /* clear the set interval*/
        function clearSetInterval() {
            clearInterval(sessionalive);
        }

        /* Check file size */
        function checkfileSize(size) {
            if (size >= 1024 * 1024 / 10) {
                var sizeofFile = size / (1024 * 1024 / 10);
                sizeofFile = Math.round(sizeofFile) / 10;
                if (sizeofFile > 500) {
                    return 0;
                }
            }
            return 1;
        }

        var sessionalive;

        /*Initialize the single file upload*/
        function initializeSingleFileDropnzone() {
            self.dropzoneObj = new Dropzone("#singledropzone", {
                url: intakeDocumentsConstants.RESTAPI.uploadDocument,
                method: "POST",
                //withCredentials: true,
                parallelUploads: 1,
                uploadMultiple: false,
                maxFilesize: 500,
                createImageThumbnails: false,
                maxFiles: 1,
                params: self.docModel,
                autoProcessQueue: false,
                addRemoveLinks: false,
                dictDefaultMessage:
                    '<span class="sprite default-document-single-upload"></span><h2 class="margin-top10px">Drop File Here</h2>',
                dictRemoveFile: '',
                accept: function (file, done) {
                    self.singlefileUpload = true;
                    self.singleuploadError = '';
                    if (self.isGlobal) {
                        if (self.docModel.matterid > 0) {
                            toggleButtons(true);
                        }
                    } else if (!self.isGlobal) {
                        toggleButtons(true);
                    }
                    // sessionalive = setInterval(keepSessionalive, 900000);
                    $scope.$apply();
                    return done();
                },
                init: function () {
                    this.on("addedfile", function (file) {
                        self.filename = file;
                        if (fileCount == 1) {
                            var receivedSizeCheck = checkfileSize(file.size);
                            if (receivedSizeCheck === 1) {
                                self.singleFileName = file.name;
                                self.docModel.documentname = file.name;
                                var size = this.filesize(file.size);
                                size = size.replace("<strong>", "");
                                size = size.replace("</strong>", "");
                                self.singleFileSize = size;
                                $scope.$apply();
                                fileCount = parseInt(fileCount) + 1;
                            }
                        }
                    });

                    this.on("uploadprogress", function (files) {
                        if (files) {
                            self.singleFileProgress = files.upload.progress;
                            $scope.$apply();
                        }
                    });

                    this.on("error", function (files, response, xhr) {

                    });
                },
                fallback: function () {
                },
                success: function (file) {
                    usSpinnerService.stop('pageSpinner');
                    clearSetInterval();
                    notificationService.success("Document uploaded successfully");
                    removeUploadingDocument();
                    if (self.isGlobal)
                        $state.go('intakedocuments');
                    else
                        $state.go('intake-documents', { intakeId: matterId });

                    return true;
                },
                error: function (file, message) {
                    self.enableButtonSave = true;
                    var receivedSizeCheck = checkfileSize(file.size);
                    removeUploadingDocument();
                    if (receivedSizeCheck === 0) {
                        notificationService.error("Size of file should not be greater than 500 MB");
                    } else if (file.xhr.status == 401) {
                        loginDatalayer.logoutUser()
                            .then(function () {
                                notificationService.error('You are unauthorized to access this service.');
                                localStorage.clear();
                                $state.go('login');
                            });
                        return;

                    } else {
                        notificationService.error(message.message);
                        if (message.message == "You do not have permission to create task") {
                            toggleButtons(true, 'Save'); //Bug#15989 :enable save button 
                        }
                    }
                    if (message.message == "Document name already exists in Intake and Category") {
                        self.singleuploadError = message.message;
                    }
                    $scope.$apply(function () {
                        usSpinnerService.stop('pageSpinner');
                        clearSetInterval();
                        toggleButtons(true, 'Cancel');
                    });
                    // else if (file.xhr.status == 422) {
                    //     removeUploadingDocument();
                    //     var text = JSON.parse(file.xhr.response);
                    //     notificationService.error(text.message);
                    //     var ferror = text.message;
                    //     displayError = true;
                    // } else if (file.xhr.status == 401) {
                    //     localStorage.clear();
                    //     $state.go('login');
                    // } else if (file.xhr.status == 412) {
                    //     notificationService.error("Please upload valid document.");
                    // } else {
                    //     notificationService.error(message["Message : "]);
                    // }

                    // if (displayError) {
                    //     $scope.$apply(function () {

                    //         if (file.xhr.responseText == " Please upload valid document.") {
                    //             self.singleuploadError = file.xhr.responseText;
                    //         } else {
                    //             self.singleuploadError = text.message;
                    //         }
                    //         usSpinnerService.stop('pageSpinner');

                    //         clearSetInterval();
                    //         toggleButtons(true, 'Cancel');
                    //     });
                    // }
                },
                headers: { 'Authorization': "Bearer " + localStorage.getItem('accessToken') },
                dictResponseError: 'Error while uploading file!',
                previewTemplate: '<span></span>'
            });
        }

        function needReviewMultiUpload(data, index) {
            data.showNeedReview = data.needs_review;
            data.reviewUser = "";   // reset value of review asign user
        }
        // change event for need review flag button
        function needReview() {
            self.showNeedReview = self.docModel.needs_review;
            self.reviewUser = "";   // reset value of review asign user
        }
        /*Initialize multifile upload*/
        function initializeMultiUpload() {
            var usernotified = false;
            self.multidropzoneObj = new Dropzone("#multidropzone", {
                url: intakeDocumentsConstants.RESTAPI.uploadDocument,
                method: "POST",
                // withCredentials: true,
                parallelUploads: 100,
                uploadMultiple: false,
                maxFilesize: 500,
                createImageThumbnails: false,
                maxFiles: self.maxNumfiles,
                params: self.multidocCount,
                autoProcessQueue: false,
                addRemoveLinks: false,
                dictDefaultMessage:
                    '<span class="sprite default-document-single-upload"></span><h2 class="margin-top10px">Drop File Here</h2>',
                dictRemoveFile: '',
                accept: function (file, done) {
                    self.multifileUpload = true;
                    toggleButtons(true, "Cancel");

                    $scope.$apply();
                    return done();
                },
                init: function () {
                    this.on("addedfile", function (file) {

                        var receivedSizeCheck = checkfileSize(file.size);
                        /* check if maximum file count has reached*/
                        if (receivedSizeCheck === 1) {

                            if (self.multidocCount == self.maxNumfiles) {
                                if (usernotified == false) {
                                    usernotified = true;
                                    notificationService.success_document("Only " + self.maxNumfiles + " are allowed to upload at a time");
                                }
                                self.multidropzoneObj.files.splice(20);
                            } else {
                                var size = this.filesize(file.size);
                                size = size.replace("<strong>", "");
                                size = size.replace("</strong>", "");
                                if (self.isGlobal) {
                                    self.multiFilesdata.push({ matterId: self.matterId, docnum: self.multidocCount, fileName: file.name, fileSize: size, fileProgress: 0, categoryid: '', plaintiffId: '', multitags: [], error: '' });
                                } else {
                                    self.multiFilesdata.push({ matterId: '', docnum: self.multidocCount, fileName: file.name, fileSize: size, fileProgress: 0, categoryid: '', plaintiffId: '', multitags: [], error: '', plainitfflist: [], memo: self.memo, date_filed_date: '' });
                                }
                                self.multidocCount = parseInt(self.multidocCount) + parseInt(1);

                                var _this = this;
                                var removeid = 'remove' + self.multidocCount;
                                self.removeMultifile = function (filename) {

                                    var index = _.findIndex(self.multiFilesdata, { fileName: filename });
                                    if (self.multiFilesdata[index].error == '') {
                                        var modalOptions = {
                                            closeButtonText: 'Cancel',
                                            actionButtonText: 'Delete',
                                            headerText: 'Delete ?',
                                            bodyText: 'Are you sure you want to delete ?'
                                        };
                                        modalService.showModal({}, modalOptions).then(function () {
                                            removeUploadingfile(filename, index);
                                        });
                                    } else {
                                        removeUploadingfile(filename, index);
                                    }
                                }

                                $scope.$apply();
                            }
                        }
                    });

                    this.on("uploadprogress", function (files) {
                        var filename = files.name;
                        jQuery.grep(self.multiFilesdata, function (a) {
                            if (a.fileName == filename) {
                                a.fileProgress = files.upload.progress;
                                return a;
                            }
                        });
                        $scope.$apply();
                    });

                    this.on("processing", function (files) {
                        var multidovParams = {};
                        var filename = files.name;
                        var fileparams = jQuery.grep(self.multiFilesdata, function (a) {
                            if (a.fileName == filename) {
                                return a;
                            }
                        });


                        ///////////////////
                        multidovParams.documentname = fileparams[0].fileName;
                        multidovParams.categoryid = fileparams[0].categoryid;
                        multidovParams.uploadtype = 'fresh';
                        multidovParams.needs_review = fileparams[0].needs_review ? 1 : 0;
                        multidovParams.review_user = utils.isNotEmptyVal(fileparams[0].reviewUser) ? fileparams[0].reviewUser.toString() : ''; // assign reviewer user
                        multidovParams.intake_id = self.isGlobal ? fileparams[0].matterId : parseInt(self.matterId);
                        multidovParams.associated_party_id = angular.isUndefined(self.docModel.associated_party_id) ? 0 : parseInt(self.docModel.associated_party_id);
                        multidovParams.party_role = fileparams[0].party_role ? fileparams[0].party_role : 0;
                        multidovParams.tags = fileparams[0].multitags;
                        angular.isDefined(fileparams[0].memo) ? multidovParams.memo = fileparams[0].memo : multidovParams.memo = '';
                        multidovParams.date_filed_date = utils.isNotEmptyVal(fileparams[0].date_filed_date) ? moment.utc(fileparams[0].date_filed_date).unix() : '';

                        self.multidropzoneObj.options.params = multidovParams;
                    });

                },
                fallback: function () {
                },
                success: function (file) {

                    var index = _.findIndex(self.multiFilesdata, { fileName: file.name });
                    self.multiFilesdata[index].error = "Document uploaded";
                    self.multiFilesdata.splice(index, 1);

                    self.successMultiUpload = parseInt(self.successMultiUpload) + parseInt(1);
                    $scope.$apply();

                    if ((parseInt(self.multiuploadError) + parseInt(self.successMultiUpload)) == self.multidocCount) {
                        usSpinnerService.stop('pageSpinner');
                        toggleButtons(true, 'Cancel');
                        clearSetInterval();
                    }

                    if (self.multiuploadError == 0 && (self.successMultiUpload == self.multidocCount)) {
                        notificationService.success("Documents Uploaded Successfully");
                        if (self.isGlobal)
                            $state.go('intakedocuments');
                        else
                            $state.go('intake-documents', { intakeId: matterId });

                    } else if (self.multiuploadError > 0 && (self.successMultiUpload == self.multidocCount)) {
                        notificationService.success("Some Documents are not uploaded.");
                    }

                    return true;
                },
                error: function (file, message) {
                    var displayError = true;
                    if (file.xhr) {
                        if (file.xhr.status == 422) {
                            var text = JSON.parse(file.xhr.response);
                            notificationService.error(text.message);
                            toggleButtons(true, 'Cancel'); //Bug#7190 :enable cancel button                         
                            return;
                        } else if (file.xhr.status == 401) {
                            localStorage.clear();
                            $state.go('login');
                        } else if (file.xhr.status == 412) {
                            notificationService.error("Please upload valid document.");
                            toggleButtons(true, 'Cancel'); //Bug#7190 :enable cancel button                         
                            return;
                        } else {
                            if (message.message == "You do not have permission to create task") {
                                toggleButtons(true, 'Save'); //Bug#15989 :enable save button 
                            }
                            notificationService.error(message.message);
                            return;
                        }
                    }



                    if (file.status != 'canceled' && file.status == 'error') {

                        var receivedSizeCheck = checkfileSize(file.size);

                        if (receivedSizeCheck === 0) {
                            notificationService.error("File not accepted. May be file size is greater than 500 MB");
                        } else {

                            $scope.$apply(function () {

                                if (file.xhr.status == 401) {
                                    notificationService.error('You are unauthorized to access this service.');
                                    localStorage.clear();
                                    $state.go('login');
                                }
                                var filename = file.name;
                                var index = _.findIndex(self.multiFilesdata, { fileName: file.name });
                                if (index >= 0) {
                                    if (file.xhr && $.trim(file.xhr.responseText) != '' && (file.xhr.status != 506)) {
                                        var ferror = file.xhr.responseText;
                                    } else {
                                        var ferror = "Document not uploaded.Please try again.";
                                    }

                                    self.multiFilesdata[index].error = ferror;
                                    self.multiuploadError = parseInt(self.multiuploadError) + parseInt(1);
                                }

                                if ((parseInt(self.multiuploadError) + parseInt(self.successMultiUpload)) == self.multidocCount) {
                                    usSpinnerService.stop('pageSpinner');
                                    clearSetInterval();
                                    toggleButtons(true, 'Cancel');
                                }
                            });
                        }
                    }
                },
                headers: { 'Authorization': "Bearer " + localStorage.getItem('accessToken') },
                dictResponseError: 'Error while uploading file!',
                previewTemplate: '<span></span>'
            });
        }

        /* Remove the uploading file from dropzone */
        function removeUploadingfile(filename, index) {
            var dropzoneQueued = self.multidropzoneObj.getAcceptedFiles();
            var filetoremove = _.find(dropzoneQueued, { name: filename });
            self.multidropzoneObj.removeFile(filetoremove);

            if (self.multiFilesdata[index].error != '') {
                self.multiuploadError = parseInt(self.multiuploadError) - parseInt(1);
            }

            self.multiFilesdata.splice(index, 1);
            self.multidocCount = self.multiFilesdata.length;

            if (self.multidocCount == 0) {
                notificationService.success("There is no document in queue to upload.");
                //Dropzone.forElement("#YourDropBoxId").removeAllFiles(true);
                self.multidropzoneObj.removeAllFiles(true);
                self.enableButtonSave = false;
                self.multifileUpload = false;
                toggleButtons(true, 'Cancel'); //Bug#7190:Enable Cancel button on document upload page
            }
        }

        function stripScriptTag(object) {
            angular.forEach(object, function (val, key) {
                object[key] = (typeof object[key] === "string") ?
                    object[key].replace(/<script.*?>.*?<\/script>/igm, '') : object[key];

                if (typeof object[key] === "object") {
                    stripScriptTag(object[key]);
                }
            });
        }

        function checkContact(data) {
            if (data.insuranceproviderid) {
                if (data.insuranceproviderid.contactid == undefined) {
                    notificationService.error("Invalid Contact Selected");
                    return true;
                }
            }
            if (data.adjusterid) {
                if (data.adjusterid.contactid == undefined) {
                    notificationService.error("Invalid Contact Selected");
                    return true;
                }
            }
        }

        /**
         * Get document details for specific document
         */
        function getDocumentDetails(docId, matterId) {
            inatkeDocumentsDataService.getOneDocumentDetails(docId, matterId)
                .then(function (response) {
                    $rootScope.$broadcast("openIntakeOnline", { docDetails: response });
                }, function (error) {
                    notificationService.error("Unable to get document details");
                });
        }
        self.accordianFn = accordianFn;
        function accordianFn(index) {
            for (var i = 0; i < self.multiFilesdata.length; i++) {
                if (!(index == i)) {
                    var body = '#collapseBody' + i;
                    var heading = "#collapseHeading1" + i;
                    $(heading).addClass("collapsed");
                    $(body).removeClass("in");
                    $(heading).attr("aria-expanded", "false");
                    $(body).attr("aria-expanded", "false");
                }
            }

        }

        self.notificationErrorMsg = notificationErrorMsg;
        function notificationErrorMsg(name, index) {
            var body = '#collapseBody' + index;
            var heading = "#collapseHeading" + index;
            $(heading).attr("aria-expanded", "true");
            $(heading).removeClass("collapsed");
            $(body).addClass("in");
            $(body).attr("aria-expanded", "true");
            $(body).css("height", "");
            accordianFn(index);
            var id = name + index;
            if (angular.isDefined($(heading).offset())) {
                $('html, body').animate({
                    scrollTop: $(heading).offset().top - 150
                }, 2000);
            } else {
                $('html, body').animate({
                    scrollTop: $(id).offset().top - 250
                }, 2000);
            }
            setTimeout(function () {
                $(id).focus();
            }, 500);

        }
        // End : Multiple Document Upload

        /*Process the documents queue */
        function processDocuments(officeOnlineFlag) {
            /**
             * office onlive document add
             */
            if (officeOnlineFlag) {
                if (utils.isEmptyVal(self.docModel.document_name)) {
                    notificationService.error("Document name is required");
                    return false;
                }
                if (utils.isEmptyVal(self.reviewUser) && self.docModel.needs_review == true) {
                    notificationService.error('Please select a reviewer from user list.');
                    return false;
                }
                if (utils.isEmptyVal(self.docModel.category)) {
                    notificationService.error("Category is required");
                    return false;
                }

                if (self.reviewUser) {
                    if (self.reviewUser.length == 1 || self.reviewUser.length == 0) {
                        var review_User = [self.reviewUser.toString()];
                    } else {
                        var review_User = [];
                        var reviewUser = self.reviewUser.toString().split(",");
                        _.forEach(reviewUser, function (currentItem) {
                            review_User.push(parseInt(currentItem));
                        });
                    }
                } else {
                    var review_User = [];
                }
                var params = {};
                params.doc_name = self.docModel.document_name + "." + self.onlineDocType;
                params.intake = { "intake_id": parseInt(self.docModel.matterid) };
                params.doc_category = { "doc_category_id": self.docModel.category.doc_category_id };
                params.associated_party = { "associated_party_id": 0 };
                params.tags_String = self.docAddTags ? (_.pluck(self.docAddTags, 'name')).toString() : '';
                params.uploadtype = "fresh";
                params.mode = "officeOnline";
                params.needs_review = self.docModel.needs_review ? "1" : "0";
                params.review_user = review_User;
                angular.isDefined(self.memo) ? params.memo = self.memo : params.memo = '';
                params.date_filed_date = utils.isNotEmptyVal(self.docModel.date_filed_date) ? moment.utc(self.docModel.date_filed_date).unix() : '';
                inatkeDocumentsDataService.uploadOfficeDocs(params)
                    .then(function (response) {
                        getDocumentDetails(response.doc_id, self.docModel.matterid);
                    }, function (error) {
                        if (error.status == 500 && error.data.message == "You do not have permission to create task") {
                            notificationService.error("You do not have permission to create task");
                        } else {
                            notificationService.error(error.data.message);
                        }
                    });
                return;
            }


            self.documentMotionValidationError = false;

            if (self.singlefileUpload == true) {

                if (self.isGlobal && (self.docModel.matterid == 0
                    || utils.isEmptyVal(self.docModel.matterid))) {
                    notificationService.error("Intake name is required");
                    return false;
                }
                // check whether needs review and reviewer user selected
                if (utils.isEmptyVal(self.reviewUser) && self.docModel.needs_review == true) {
                    notificationService.error('Please select a reviewer from user list.');
                    return false;
                }

                if (utils.isEmptyVal(self.docModel.documentname)) {
                    notificationService.error("Invalid document name");
                    return false;
                }

                if (utils.isEmptyVal(self.docModel.category)) {
                    notificationService.error("Category is required");
                    return false;
                }

                var singledovParams = createParam();
                if (singledovParams === false) { return false; }
                stripScriptTag(singledovParams);

                if (!self.documentMotionValidationError) {
                    self.dropzoneObj.options.params = singledovParams;
                    self.documentProcessing = true;
                    stripScriptTag(self.docModel);
                    self.dropzoneObj.processQueue();
                } else {
                    return false;
                }

            } else if (self.multifileUpload == true) {
                var matterfound = true;
                var fileCount = 0;
                var flag = true;
                angular.forEach(self.multiFilesdata, function (datavalue, datakey) {
                    if (flag) {
                        self.enableButtonSave = false;
                        if (self.isGlobal && (datavalue.matterId == 0 || angular.isUndefined(datavalue.matterId))) {
                            matterfound = false;
                        }
                        var Tags = [];
                        var fileTagData = angular.copy(datavalue.multitags);
                        angular.isDefined(self.memo) ? fileTagData.memo = self.memo : fileTagData.memo = '';
                        fileTagData.date_filed_date = utils.isNotEmptyVal(self.docModel.date_filed_date) ? moment.utc(self.docModel.date_filed_date).unix() : '';
                        fileTagData.needs_review = self.multiFilesdata[datakey].needs_review ? 1 : 0;
                        fileTagData.review_user = utils.isNotEmptyVal(self.multiFilesdata[datakey].reviewUser) ? self.multiFilesdata[datakey].reviewUser.toString() : ''; // assign reviewer user

                        stripScriptTag(fileTagData);

                        angular.forEach(fileTagData, function (tagvalue, tagkey) {
                            Tags.push(tagvalue.name);
                        });
                        self.multiFilesdata[datakey].multitags = '';
                        self.multiFilesdata[datakey].multitags = Tags;

                        // check whether needs review and reviewer user selected
                        if (utils.isEmptyVal(datavalue.reviewUser) && datavalue.needs_review == true) {
                            var heading = "#batchFileUpload" + datakey;
                            var id = '#reviewUser' + datakey;
                            $('html, body').animate({
                                scrollTop: $(heading).offset().top - 250
                            }, 2000);
                            setTimeout(function () {
                                $(id + ' input').focus();
                            }, 500);
                            flag = false;
                            self.enableButtonSave = true;
                            notificationService.error('Please select a reviewer from user list.');
                            return false;
                        }
                        fileCount = fileCount + 1;

                    }
                });

                if (self.isGlobal && matterfound == false) {
                    notificationService.error("Matter is required for all documents");
                    return false;
                }
                self.documentProcessing = true;

                stripScriptTag(self.multidocCount);

                //Resolving Bug-8410  
                //function call to make sure file status is "queued" before the file is sent to the process queue. 
                if (fileCount == self.multidropzoneObj.files.length) {
                    applyQueueStatus(self.multidropzoneObj.files, function () {
                        self.multidropzoneObj.processQueue();
                    });
                } else {
                    //console.log("Error in upload");
                }
            }
            //  toggleButtons(false);

            // sessionalive = setInterval(keepSessionalive, 900000);
            usSpinnerService.spin('pageSpinner');
        }

        function applyQueueStatus(files, callback) {
            for (var i = 0; i < files.length; i++) {
                files[i].status = "queued";
            }
            callback();
        }
        self.openDatePickerMultiUpload = openDatePickerMultiUpload;
        function openDatePickerMultiUpload(data, $event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            data[isOpened] = true; //isOpened is a string specifying the model name
        }

        /*Create params fro single file upload*/
        function createParam() {
            var singledovParams = {};
            var mattId = self.isGlobal ? self.docModel.matterid : self.matterId;
            mattId = parseInt(mattId);
            singledovParams.documentname = self.docModel.documentname;
            singledovParams.categoryid = self.docModel.category.doc_category_id;
            singledovParams.needs_review = self.docModel.needs_review ? 1 : 0;
            singledovParams.review_user = utils.isNotEmptyVal(self.reviewUser) ? self.reviewUser.toString() : ''; // assign reviewer user
            singledovParams.uploadtype = 'fresh';
            singledovParams.intake_id = mattId;
            singledovParams.associated_party_id = angular.isUndefined(self.docModel.associated_party_id) ? 0 : self.docModel.associated_party_id;
            singledovParams.party_role = self.docModel.party_role ? self.docModel.party_role : 0;
            singledovParams.tags = _.pluck(self.docAddTags, 'name');
            angular.isDefined(self.memo) ? singledovParams.memo = self.memo : singledovParams.memo = '';
            singledovParams.date_filed_date = utils.isNotEmptyVal(self.docModel.date_filed_date) ? moment.utc(self.docModel.date_filed_date).unix() : '';
            return singledovParams;
        }

        /*Remove the going to upload document */
        function removeUploadingDocument(cancel) {
            if (cancel == 1) {
                if (self.isGlobal)
                    $state.go('intakedocuments');
                else
                    $state.go('intake-documents', { intakeId: matterId });
            }

            if (self.dropzoneObj) {
                fileCount = 1;
                self.documentProcessing = false;
                self.dropzoneObj.removeAllFiles();
                self.singleFileProgress = 0;
                self.singleFileName = '';
                self.singleFileSize = '';
                self.singleuploadError = '';
                self.docModel.documentname = '';
                toggleButtons(false, 'Save');
            } else {
                if (self.isGlobal)
                    $state.go('intakedocuments');
                else
                    $state.go('intake-documents', { intakeId: matterId });
            }

        }

        /*Toggle the Cancel and save buttons*/
        function toggleButtons(type, one) {
            if (one && one == 'Save') {
                self.enableButtonSave = type;
            } else if (one && one == 'Cancel') {
                self.enableButtonCancel = type;
            } else {
                self.enableButtonCancel = type;
                self.enableButtonSave = type;
            }
        }

        /*Change the view of single file upload and batch file upload*/
        function changeView(add, remove) {
            if (self.isGlobal) {
                self.matterId = matterId = 0;
            }
            if (add == 'singlefileuploader') {
                self.singlefileUpload = true;
                if (self.multidropzoneObj) {
                    self.multidropzoneObj.destroy();
                }
                if (!self.dropzoneObj) {
                    initializeSingleFileDropnzone();
                }
                self.enableButtonCancel = true;
            } else if (add == 'batchfileuploader') {
                if (self.dropzoneObj) {
                    //self.dropzoneObj.destroy();
                }
                if (!self.multidropzoneObj) {
                    initializeMultiUpload();
                }
            }

            $('#' + add).addClass('file-upload-active');
            $('#' + remove).removeClass('file-upload-active');
        }

        /* For Multi document upload : check if all documents have category associated*/
        function checkCatSeleted() {
            var allcatSelected = true;
            angular.forEach(self.multiFilesdata, function (datavalue, datakey) {
                if (datavalue.doc_category_id == '' || datavalue.error != '') {
                    allcatSelected = false;
                }
            });

            if (allcatSelected == true) {
                toggleButtons(true);

            } else {
                toggleButtons(false);
                toggleButtons(true, 'Cancel');
            }
        }

        /*Search matter in case of global documents*/
        function searchMatters(matterName) {
            if (matterName) {
                return intakeFactory.searchMatters(matterName).then(
                    function (response) {
                        matters = response;
                        return response;
                    }, function (error) {
                        notificationService.error('Intake not loaded');
                    });
            }
        }

        /* Formate the matter id and name in case of global documents*/
        function formatTypeaheadDisplay(intake, index) {
            if (self.isGlobal) {
                self.matterId = 0;
                matterId = 0;
            }
            if (angular.isUndefined(intake) || utils.isEmptyString(intake) || matters.length === 0) {
                return undefined;
            }
            var matterInfo = _.find(matters, function (matter) {

                if (self.singlefileUpload == true) {
                    self.matterId = intake;
                    matterId = intake;
                    self.docModel.intake = intake;
                    self.docModel.associated_party_id = '';
                    getPlaintiffsForDocument(intake);
                    if (self.isGlobal && self.singlefileUpload == true) {
                        if (self.singleFileName != '')
                            toggleButtons(true);

                    }
                } else if (self.multifileUpload == true) {
                    self.multiFilesdata[index].matterId = intake;
                    self.multiFilesdata[index].plaintiffId = '';
                    if (intake != 0) {
                        getPlaintiffsForDocument(intake, index);
                    }
                } else if ($state.current.name == "intakecreate-online") {
                    getPlaintiffsForDocument(intake, index);
                }
                return matter.intakeId === intake;
            });
            return matterInfo ? matterInfo.intakeName : "";
        }

        // ------- added below code for document motion start ----------
        function compareDate(dos, rd) {

        }


        function openDatePicker($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            self[isOpened] = true; //isOpened is a string specifying the model name
        }

        function incurredDatePicker($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            self.incurredServicePicker = true;
        }

        function calExpenseBill(paymentmode) {
            //check the previously set is edited value, in edit mode we ignore the first change in model value

            switch (paymentmode) {
                case '1':// paid
                case '2':// Unpaid
                case '3':// Partial

                    self.newExpenseInfo.paidamount = utils.isEmptyVal(self.newExpenseInfo.paidamount) ?
                        null : self.newExpenseInfo.paidamount;
                    self.newExpenseInfo.outstandingamount = utils.isEmptyVal(self.newExpenseInfo.outstandingamount) ?
                        null : self.newExpenseInfo.outstandingamount;
                    self.newExpenseInfo.paidamount = utils.isEmptyVal(self.newExpenseInfo.paidamount) ?
                        null : self.newExpenseInfo.paidamount;
                    changeExpenseValues(self.newExpenseInfo);

                    break;
            }
        }

        // Calculate/set values based on payment mode for Bill amount, tatal amount and outstanding amount.
        function changeExpenseValues(objectInfo) {
            switch (objectInfo.paymentmode) {
                case '1':// paid
                    objectInfo.paidamount = objectInfo.expense_amount;
                    objectInfo.outstandingamount = utils.isNotEmptyVal(objectInfo.expense_amount) ? 0 : null;
                    break;
                case '2': // Unpaid
                    objectInfo.outstandingamount = objectInfo.expense_amount;
                    objectInfo.paidamount = utils.isNotEmptyVal(objectInfo.expense_amount) ? 0 : null; // 
                    break;
                case '3':// Partial
                    if (utils.isNotEmptyVal(objectInfo.paidamount) && utils.isNotEmptyVal(objectInfo.expense_amount)) {
                        // objectInfo.outstandingamount = (parseFloat(objectInfo.expense_amount) - parseFloat(objectInfo.paidamount)).toFixed(2);
                        objectInfo.outstandingamount = (parseFloat(objectInfo.expense_amount) - parseFloat(objectInfo.paidamount));

                    }
                    else {
                        if (utils.isNotEmptyVal(objectInfo.expense_amount)) {
                            objectInfo.outstandingamount = objectInfo.expense_amount;
                        }
                        else {
                            objectInfo.outstandingamount = utils.isNotEmptyVal(objectInfo.paidamount) ? -objectInfo.paidamount : null;
                        }
                    }
                    break;
            }
        }

        function openServiceEndDatePicker($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            self[isOpened] = true; //isOpened is a string specifying the model name
        }

        function openDateOfService($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            self.dateOfServiceEvent[isOpened] = true; //isOpened is a string specifying the model name
        }

        function openReturnableDate($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            self.returnableDateEvent[isOpened] = true; //isOpened is a string specifying the model name
        }

        function displayDateOfService() {
            var todayDate;
            todayDate = moment().startOf('day');
            todayDate = moment(todayDate).unix();
            //self.filters.dateOfService = todayDate;
            self.documentMotionDetailInfo.dateOfService = moment.unix(todayDate).format("MM/DD/YYYY");
        }


        function validateMotionDate(dos, rd) {
            var dateOfService = dos;
            var returnableDate = rd;
            var dosYear, dosMonth, dosDay, dosDate, dosMomentDate, dosStart, dosStartOfTheDay;
            var rdYear, rdMonth, rdDay, rdDate, rdMomentDate, rdStart, rdStartOfTheDay;


            if (dateOfService != '' && dateOfService != 0 && dateOfService != null) {
                if (angular.isDefined(dateOfService) && angular.isDefined(dateOfService.length) && dateOfService.length == 10) {
                    dosYear = dateOfService.substring(6, 10);
                    dosMonth = dateOfService.substring(0, 2);
                    dosDay = dateOfService.substring(3, 5);
                    dosDate = dosYear + "/" + (dosMonth) + "/" + dosDay;
                }
                else {
                    dosYear = dateOfService.getFullYear();
                    dosMonth = dateOfService.getMonth();
                    dosDay = dateOfService.getDate();
                    dosDate = dosYear + "/" + (dosMonth + 1) + "/" + dosDay;

                }
                dosMomentDate = moment(dosDate, "YYYY/MM/DD");
                dosStart = angular.copy(dosMomentDate);
                dosStart = dosStart.startOf('day');
                dosStartOfTheDay = dosStart; //moment(dosStart).unix();

            } else {
                dosStartOfTheDay = '';
            }

            if (returnableDate != '' && returnableDate != 0 && returnableDate != null) {
                if (angular.isDefined(returnableDate) && returnableDate != '') {
                    rdYear = returnableDate.getFullYear();
                    rdMonth = returnableDate.getMonth();
                    rdDay = returnableDate.getDate();
                    rdDate = rdYear + "/" + (rdMonth + 1) + "/" + rdDay;

                    rdMomentDate = moment(rdDate, "YYYY/MM/DD");
                    rdStart = angular.copy(rdMomentDate);
                    rdStart = rdStart.startOf('day');
                    rdStartOfTheDay = rdStart; //moment(rdStart).unix();

                }
            } else {
                rdStartOfTheDay = '';
            }
            self.dateOfServiceInUTC = dosStartOfTheDay;
            self.returnableDateInUTC = rdStartOfTheDay;

            if (dateOfService != '' && dateOfService != 0 && dateOfService != null && returnableDate != '' && returnableDate != 0 && returnableDate != null) {
                if (dosStartOfTheDay >= rdStartOfTheDay) {
                    self.documentMotionValidationError = true;
                    notificationService.error('Returnable Date Cannot be Same or Less Than Date of Service');
                }
            }
        }

        // get all users list
        function getUsers() {

            intakeTaskAgeDatalayer.getUsersInFirm()
                .then(function (response) {
                    self.allUser = response.data;
                }, function (error) {
                    notificationService.error('Users not loaded');
                });
        }
        // US:4810 End
    }
})();

(function () {
    angular.module('intake.documents')
        .factory('intakeDocumentAddHelper', intakeDocumentAddHelper);
    intakeDocumentAddHelper.$inject = [];

    function intakeDocumentAddHelper() {
        return {
            paymentBtns: paymentBtns,
            dynamicFormOptions: dynamicFormOptions,
            getStringFromArray: getStringFromArray,
            changeValues: changeValues
        };

        function paymentBtns() {
            return [{ label: "Paid", value: "1" }, { label: "Unpaid", value: "2" }, { label: "Partial", value: "3" }];
        }

        function dynamicFormOptions() {
            return [
                {
                    'keytext': 'motion',
                    'valuetext': 'Motion'
                },
                {
                    'keytext': 'liens',
                    'valuetext': 'Liens'
                },
                {
                    'keytext': 'medicalbill',
                    'valuetext': 'Medical Bills'
                },
                {
                    'keytext': 'insurance',
                    'valuetext': 'Insurance'
                },
                {
                    'keytext': 'expense',
                    'valuetext': 'Expenses'
                },
                {
                    'keytext': 'medicalrecord',
                    'valuetext': 'Medical Record'
                }
            ];
        }

        function getStringFromArray(array) {
            var data = [];
            _.forEach(array, function (item) {
                if (item.value) {
                    data.push(item.value);
                }
            });
            return data.length > 0 ? data.toString() : null;
        }

        // Calculate/set values based on payment mode for Bill amount, tatal amount and outstanding amount.
        function changeValues(objectInfo) {
            switch (objectInfo.paymentmode) {
                case '1':// paid
                    objectInfo.paidamount = objectInfo.totalamount;
                    objectInfo.outstandingamount = utils.isNotEmptyVal(objectInfo.totalamount) ? 0 : null;
                    break;
                case '2': // Unpaid
                    objectInfo.outstandingamount = objectInfo.totalamount;
                    objectInfo.paidamount = utils.isNotEmptyVal(objectInfo.totalamount) ? 0 : null; // 
                    break;
                case '3':// Partial
                    if (utils.isNotEmptyVal(objectInfo.paidamount) && utils.isNotEmptyVal(objectInfo.totalamount)) {
                        //objectInfo.outstandingamount = (parseFloat(objectInfo.totalamount) - parseFloat(objectInfo.paidamount)).toFixed(2);
                        objectInfo.outstandingamount = (parseFloat(objectInfo.totalamount) - parseFloat(objectInfo.paidamount));
                    }
                    else {
                        if (utils.isNotEmptyVal(objectInfo.totalamount)) {
                            objectInfo.outstandingamount = objectInfo.totalamount;
                        }
                        else {
                            objectInfo.outstandingamount = utils.isNotEmptyVal(objectInfo.paidamount) ? -objectInfo.paidamount : null;
                        }
                    }
                    break;
            }

        }
    }
})();


//if (serviceStartDate != '' && serviceStartDate != 0 && serviceStartDate != null
//    && serviceEndDate != '' && serviceEndDate != 0 && serviceEndDate != null) {
//    if (dosStartOfTheDay > rdStartOfTheDay) {
//        notificationService.error('Start date of service cannot be less than end date of service');
//    }

//}
