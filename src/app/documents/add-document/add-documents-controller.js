/* Document Upload module controller. 
 * */
(function () {

    'use strict';

    angular
        .module('cloudlex.documents')
        .controller('AddDocumentsCtrl', AddDocumentsCtrl);

    AddDocumentsCtrl.$inject = ['$scope', '$rootScope', '$q', 'loginDatalayer', 'documentsDataService', 'matterDetailsService', '$stateParams',
        'routeManager', 'notification-service', '$state', 'documentsConstants', 'usSpinnerService', 'matterFactory',
        'documentAddHelper', 'allPartiesDataService', 'modalService', 'masterData', 'contactFactory', 'taskAgeDatalayer', 'globalConstants'];

    function AddDocumentsCtrl($scope, $rootScope, $q, loginDatalayer, documentsDataService, matterDetailsService, $stateParams,
        routeManager, notificationService, $state, documentsConstants, usSpinnerService, matterFactory,
        documentAddHelper, allPartiesDataService, modalService, masterData, contactFactory, taskAgeDatalayer, globalConstants) {

        var self = this;
        self.goOnline = goOnline;
        self.showValidationForAdjusted = false;
        self.showValidationForAdjustment = false;
        self.cancelCreateOnline = cancelCreateOnline;
        self.onlineDocType = 'docx';
        /*Initial value variable*/
        self.matterId = 0;
        var matterId = 0;
        var dynamicSelect;
        self.officeOnlineStat = false;
        self.docModel = {};
        self.JavaFilterAPIForContactList = true;
        self.insuranceTypeList = angular.copy(globalConstants.insuranceTypeList);

        if ($state.current.name == 'document-upload') {
            self.matterId = $stateParams.matterId;
            matterId = $stateParams.matterId;
            self.isGlobal = false;
            //set breadcrum
            setBreadcrum(self.matterId);
        } else if ($state.current.name == 'globaldocument-upload') {
            self.isGlobal = true;
            var matters = [];
        } else if ($state.current.name == "create-online") {

            ($stateParams.matterId != "") ? self.matterId = $stateParams.matterId : '';
            if (self.matterId != 0) {
                setBreadcrum(self.matterId);
                getMatterDetails(self.matterId);
                getPlaintiffsForDocument(self.matterId);
                getDefendants(self.matterId);
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
            matterFactory.getMatterById(matterId)
                .then(function (response) {
                    matters = response.data[0];
                    self.docModel.document_name = '';
                    self.docModel.matterid = response.data[0].matter_id;
                });
        }

        /**
         * go online
         */
        function goOnline() {
            if (self.officeOnlineStat) {
                if (self.matterId != 0) {
                    $state.go('create-online', { "matterId": self.matterId });
                } else {
                    $state.go('create-online');
                }

            } else {
                notificationService.error("Please subscribe Microsoft Office Online!");
            }
        }

        function cancelCreateOnline() {
            if (self.matterId != 0) {
                $state.go('matter-documents', { matterId: self.matterId });
            } else {
                $state.go('documents');
            }
        }

        function setBreadcrum(matterId) {
            var initCrum = [{ name: '...' }];
            routeManager.setBreadcrum(initCrum);

            var matterinfo = matterFactory.getMatterData();

            if (utils.isEmptyObj(matterinfo) || (parseInt(matterinfo.matter_id) !== parseInt(matterId))) {
                matterFactory.getMatterInfo(matterId).then(function (response) {
                    var matterData = response.data[0];
                    matterFactory.setMatterData(matterData);
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
                    name: 'Documents', state: 'matter-documents'
                },
                { name: 'Create Online Document' }];
            routeManager.addToBreadcrum(breadcrum);
        }

        function addToBreadcrumList(matteData, matterId) {
            var breadcrum = [
                {
                    name: matteData.matter_name, state: 'add-overview',
                    param: { matterId: matterId }
                },
                {
                    name: 'Documents', state: 'matter-documents',
                    param: { matterId: matterId }
                },
                { name: ($state.current.name == "create-online") ? 'Create Online' : 'Upload' }];
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
        self.moreInfoSelect = '';
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
        self.formatTypeaheadDisplayForDocumentMotion = contactFactory.formatTypeaheadDisplay;
        self.setType = setType;
        self.documentMotionDetailInfo = {};
        self.motionTitle = '';
        self.documentMotionValidationError = false;

        self.changeValues = function (objectInfo, data) {
            self.showValidationForAdjusted = documentAddHelper.changeValues(objectInfo, data);
            if (utils.isNotEmptyVal(objectInfo.bill_amount)) {
                self.showValidationForAdjusted = false;
                self.showValidationForAdjustment = false;
            }
        }
        self.changeAdjustment = function (objectInfo, data) {
            self.showValidationForAdjustment = documentAddHelper.changeAdjustment(objectInfo, data);
            if (utils.isNotEmptyVal(objectInfo.bill_amount)) {
                self.showValidationForAdjusted = false;
                self.showValidationForAdjustment = false;
            }
        }
        self.addNewContactforDocumentMotion = addNewContactforDocumentMotion;
        self.selectedMotion = selectedMotion;
        self.formatTypeaheadDisplayPartials = contactFactory.formatTypeaheadDisplay;
        self.getContacts = getContacts;
        self.addNewContact = addNewContact;
        self.addNewLineContact = addNewLineContact;
        self.setMoreInformationType = setMoreInformationType;
        self.openDatePicker = openDatePicker;
        self.incurredDatePicker = incurredDatePicker;
        self.calExpenseBill = calExpenseBill;
        self.changeExpenseValues = changeExpenseValues;
        self.openServiceEndDatePicker = openServiceEndDatePicker;
        self.allUser = [];
        self.needReview = needReview;
        self.setTypeMedicalBills = setTypeMedicalBills;
        self.addNewMbillsContact = addNewMbillsContact;
        self.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;
        (function () {
            window.parent.document.title = "Welcome to CloudLex";
            $rootScope.$emit('favicon', "favicon.ico");
            if (self.isGlobal === false) {
                getPlaintiffsForDocument(matterId);
            }
            getOfficeOnlineStatus(); // get office online status
            getDocCategories();
            //self.dynamicSelect = documentAddHelper.dynamicFormOptions();
            dynamicSelect = documentAddHelper.dynamicFormOptions();
            if ($state.current.name != "create-online") {
                initializeSingleFileDropnzone();
                initializeMultiUpload();
            }
            getUsers(); // get all users list for asign document review.


        })();
        function checkIfEnterKeyWasPressed(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
            return true;

        };
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
                case "AllTypeWithoutLead":
                    postObj.type = globalConstants.allTypeListWithoutCourt;
                    break;
                default:
                    postObj.type = globalConstants.docdefaultNameTypeList;
                    break;
            }
            // postObj.type = searchItem =='liens' ? globalConstants.docLinesTypeList: globalConstants.docdefaultNameTypeList ;
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            //postObj = matterFactory.setContactType(postObj);
            postObj.page_Size = 250
            return matterFactory.getContactsByName(postObj, self.JavaFilterAPIForContactList)
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

        function setTypeMotion(model) {
            self.documentMotionDetailInfo.is_global = (model.contact_type == 'Local') ? 0 : 1;
        }

        function setTypeMedicalBills(model) {
            self.newMedicalBillInfo.is_global = (model.contact_type == 'Local') ? 0 : 1;
        }


        function getDocumentMotionContact(contactName) {
            var postObj = {};
            postObj.type = globalConstants.docmotionsTypeList;
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            //postObj = matterFactory.setContactType(postObj);
            postObj.page_Size = 250
            return matterFactory.getContactsByName(postObj, self.JavaFilterAPIForContactList)
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


        function addNewContactforDocumentMotion(type) {
            var selectedType = {};
            selectedType.type = type;

            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (savedContact) {
                contactFactory.setDataPropForContactsFromOffDrupalToNormalContact([savedContact]);
                self.documentMotionDetailInfo.contact = savedContact;
                self.documentMotionDetailInfo.contact.email_ids = documentAddHelper.getStringFromArray(self.documentMotionDetailInfo.contact.email_ids);
                self.documentMotionDetailInfo.contact.phone = documentAddHelper.getStringFromArray(self.documentMotionDetailInfo.contact.phone);
            });
        }

        /* funciton handlers*/
        self.checkContact = checkContact;
        self.processDocuments = processDocuments;
        self.setMoreInfoType = setMoreInfoType;
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
            self.newMedicalBillInfo.paid_amount = utils.isEmptyVal(self.newMedicalBillInfo.paid_amount) ?
                null : self.newMedicalBillInfo.paid_amount;
            self.newMedicalBillInfo.bill_amount = utils.isEmptyVal(self.newMedicalBillInfo.bill_amount) ?
                null : self.newMedicalBillInfo.bill_amount;
            self.newMedicalBillInfo.outstanding_amount = utils.isEmptyVal(self.newMedicalBillInfo.outstanding_amount) ?
                null : self.newMedicalBillInfo.outstanding_amount;

            documentAddHelper.changeValues(self.newMedicalBillInfo);
            documentAddHelper.changeAdjustment(self.newMedicalBillInfo);

        }

        function isDatesValid() {
            if ($('#docincurredError').css("display") == "block" || $('#docservicestartDateError').css("display") == "block" || $('#docserviceendDateError').css("display") == "block" ||
                $('#docmedstartDateErr').css("display") == "block" ||
                $('#docmedendDateErr').css("display") == "block" || $('#filledDatedivError').css("display") == "block") {
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
            documentsDataService.getOfficeStatus()
                .then(function (response) {
                    self.officeOnlineStat = (response.data.O365.is_active == 1) ? true : false;
                }, function (error) {
                    notificationService.error('document categories not loaded');
                });
        }

        /*Get the Document Categories*/
        function getDocCategories() {
            documentsDataService.getDocumentCategories()
                .then(function (response) {
                    self.documentCategories = response;
                    self.docModel.category = response[0].doc_category_id;
                }, function (error) {
                    notificationService.error('document categories not loaded');
                });
        }

        /*Get all plaintiffs*/
        function getPlaintiffsForDocument(matterId, index) {
            var deferred = $q.defer();
            documentsDataService.getPlaintiffs(matterId)
                .then(function (response) {
                    _.forEach(response, function (item) {
                        item['associated_party_name'] = item.plaintiffName;
                        item['associated_party_id'] = item.plaintiffID;
                    });
                    if (self.isGlobal && self.multifileUpload) {
                        self.docPlaintiffs = response;
                    } else {
                        self.docPlaintiffs = response;
                        self.singlePlaintiffError = '';
                        // if (self.docPlaintiffs.length == 0) {
                        //     self.singlePlaintiffError = "No Associated Plaintiffs with matter";
                        // }
                    }
                    getDefendants(matterId, index);
                    //  getOtherparties(matterId);
                    deferred.resolve(response);
                }, function (error) {
                    notificationService.error('plaintiffs not loaded');
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function getDefendants(matterId, index) {
            allPartiesDataService.getDefendants(matterId)
                .then(function (res) {
                    self.docDefendants = res.data;
                    allPartiesDataService.getOtherPartiesBasic(matterId)
                        .then(function (res) {
                            self.docOtherparties = res.data;
                            if (self.isGlobal && self.multifileUpload) {
                                self.multiFilesdata[index].docPlaintiffDefendants = getDocPlaintiffData(self.docPlaintiffs, self.docDefendants, self.docOtherparties);
                            } else {
                                self.docPlaintiffDefendants = getDocPlaintiffData(self.docPlaintiffs, self.docDefendants, self.docOtherparties);
                            }
                        });
                });
        }

        // function getOtherparties(matterId) {
        //     allPartiesDataService.getOtherParties(matterId)
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
                response['firstname'] = response.first_name;
                response['lastname'] = response.last_name;
                response['contactid'] = (response.contact_id).toString();
                model[prop] = response;
            }, function () {
            });
        }


        function addNewMbillsContact(model, prop) {
            var selectedType = {};
            selectedType.type = 'mbillsproviderid';

            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                response['firstname'] = response.first_name;
                response['lastname'] = response.last_name;
                response['contactid'] = (response.contact_id).toString();
                model[prop] = response;
                //setTypeMedicalBills(response);
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
                case "insured_party_id":
                    selectedType.type = 'docinsuinsuredpartyid';
                    break;
                case "insuranceproviderid":
                case "insurance_provider_id":
                    selectedType.type = 'docinsuranceproviderid';
                    break;
                case "medical_provider":
                    selectedType.type = 'allTypeListWithoutCourt';
                    break;
                case "physician":
                    selectedType.type = 'allTypeListWithoutCourt';
                    break;
                case "insured_party":
                    selectedType.type = 'allTypeListWithoutCourt';
                    break;
                case "insurance_provider":
                    selectedType.type = 'allTypeListWithoutCourt';
                    break;
                case "insurance_adjuster":
                    selectedType.type = 'allTypeListWithoutCourt';
                    break;
                case "adjusterid":
                case "insurance_adjuster_id":
                    selectedType.type = 'docinsuadjusterid';
                    break;

            }
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                response['firstname'] = response.first_name;
                response['lastname'] = response.last_name;
                response['contactid'] = (response.contact_id).toString();
                model[prop] = response;
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
            // if (insuranceObj.category == 10) {
            //     self.multiFilesdata.associated_party_id = insuranceObj.associated_party_id;
            //     self.docModel.associated_party_id = insuranceObj.associated_party_id;
            //     insuranceObj.party_role = 1;
            // } else {
            //     insuranceObj['party_role'] = utils.isNotEmptyVal(selectedItem) ? selectedItem.type : '';
            // }
            insuranceObj['party_role'] = utils.isNotEmptyVal(selectedItem) ? selectedItem.type : '';
        }

        function setPartyRoleMultiUpload(selectedItem, insuranceObj) {
            // if (insuranceObj.categoryid == 10) {
            //     self.docModel.associated_party_id = insuranceObj.docPlaintiff
            //     insuranceObj.party_role = 1;
            // } else {
            //     insuranceObj.party_role = selectedItem.type;
            // }
            insuranceObj.party_role = selectedItem.type;
        }




        /*Get document tags*/
        function loadTags(query) {
            var tagData = {};
            tagData.searchtag = query;
            tagData.excludetags = self.docAddTags;
            var deferred = $q.defer();
            documentsDataService.loaddocTags(tagData)
                .then(function (response) {
                    _.forEach(response, function (item) {
                        item['name'] = item.tag_name;
                        item['id'] = item.tag_id;
                    });
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        /* Dummy call to server to keep session alive*/
        function keepSessionalive() {
            documentsDataService.keepSessionalive()
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
                url: documentsConstants.RESTAPI.uploadDocument1,
                method: "POST",
                withCredentials: true,
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
                    if (file.size == 0) {
                        notificationService.error("Cannot upload 0kb document");
                        removeUploadingDocument();
                        return;
                    }
                    self.singlefileUpload = true;
                    self.singleuploadError = '';
                    if (self.isGlobal) {
                        if (self.docModel.matterid > 0) {
                            toggleButtons(true);
                        }
                    } else if (!self.isGlobal) {
                        toggleButtons(true);
                    }
                    sessionalive = setInterval(keepSessionalive, 900000);
                    $scope.$apply();
                    return done();
                },
                init: function () {
                    this.on("addedfile", function (file) {
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
                        $state.go('documents');
                    else
                        $state.go('matter-documents', { matterId: matterId });

                    return true;
                },
                error: function (file, message) {
                    var displayError = true;
                    var receivedSizeCheck = checkfileSize(file.size);
                    if (receivedSizeCheck === 0) {
                        ferror = "Size of file should not be greater than 500 MB";
                    } else if (message === "You can not upload any more files.") {
                        var ferror = "You can not upload more than one file in single file upload";
                        displayError = false;
                        notificationService.error(ferror);
                        return;
                    } else {

                        if (file.xhr.status == 401) {
                            loginDatalayer.logoutUser()
                                .then(function () {
                                    notificationService.error('You are unauthorized to access this service.');
                                    localStorage.clear();
                                    $state.go('login');
                                });
                            return;
                        }

                        removeUploadingDocument();
                        if (file.xhr && $.trim(file.xhr.responseText) != '') {
                            var ferror = message.message;
                        } else {
                            var ferror = "Document not uploaded.Please try again.";
                        }
                    }
                    if (message.message) {
                        if (message.message == "You do not have permission to create task") {
                            toggleButtons(true, 'Save'); //Bug#15989 :enable save button
                        }
                        notificationService.error(message.message);

                    } else {
                        if (receivedSizeCheck == 0) {
                            notificationService.error("Size of file should not be greater than 500 MB");
                        } else {
                            notificationService.error('Upload Error ');

                        }
                    }

                    if (displayError) {
                        $scope.$apply(function () {

                            if (file.xhr.responseText == " Please upload valid document.") {
                                self.singleuploadError = message.message;
                            } else {
                                self.singleuploadError = message.message;
                            }
                            //self.singleuploadError = file.xhr.responseText;
                            usSpinnerService.stop('pageSpinner');

                            clearSetInterval();
                            toggleButtons(true, 'Cancel');
                        });
                    }
                },
                headers: { 'Authorization': "Bearer " + localStorage.getItem('accessToken') },
                dictResponseError: 'Error while uploading file!',
                previewTemplate: '<span></span>'
            });
        }

        /*Initialize multifile upload*/
        function initializeMultiUpload() {
            var usernotified = false;
            self.multidropzoneObj = new Dropzone("#multidropzone", {
                url: documentsConstants.RESTAPI.uploadDocument1,
                method: "POST",
                withCredentials: true,
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
                        var msgForUpload = false;
                        if (file.size == 0) {
                            msgForUpload = true;
                            var idx = _.findIndex(self.multidropzoneObj.files, { size: 0 });
                            self.multidropzoneObj.files.splice(idx, 1);
                        }
                        if (msgForUpload) {
                            notificationService.error("Cannot upload 0kb document");
                            return;
                        }
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
                                    self.multiFilesdata.push({ matterId: '', docnum: self.multidocCount, fileName: file.name, fileSize: size, fileProgress: 0, categoryid: '', plaintiffId: '', multitags: [], error: '', plainitfflist: [] });
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

                                //$scope.$apply();
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
                        // multidovParams.categoryid = fileparams[0].categoryid;
                        // multidovParams.plaintiffId = fileparams[0].plaintiffId;
                        // multidovParams.party_role = fileparams[0].party_role;
                        /**US:7108:-- add more info object for insuarance category which have associated party id for storing data*/
                        // if (fileparams[0].categoryid == 6) {
                        //     var moreInfoSelect = {
                        //         plaintiffId: fileparams[0].plaintiffId,
                        //         party_role: fileparams[0].party_role,
                        //         associated_party_id: fileparams[0].plaintiffId
                        //     }
                        // }
                        // multidovParams.moreInfo = utils.isEmptyVal(moreInfoSelect) ? '' : JSON.stringify(moreInfoSelect);
                        // multidovParams.uploadtype = 'fresh';
                        // if (self.isGlobal) {
                        //     multidovParams.matterid = fileparams[0].matterId;
                        // } else {
                        //     multidovParams.matterid = self.matterId;
                        // }
                        //multidovParams.tags = fileparams[0].multitags;

                        angular.isUndefined(fileparams[0]) ? fileparams[0] = self.multiFilesdata[0] : '';
                        multidovParams = createMutipleParam(fileparams[0]);
                        self.multidropzoneObj.options.params = multidovParams;
                    });

                },
                fallback: function () {
                },
                success: function (file) {
                    var index = _.findIndex(self.multiFilesdata, { fileName: file.name });
                    self.multiFilesdata[index].error = "Document uploaded";
                    self.multiFilesdata.splice(index, 1);

                    self.multidropzoneObj.files.splice(index, 1);

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
                            $state.go('documents');
                        else
                            $state.go('matter-documents', { matterId: matterId });

                    } else if (self.multiuploadError > 0 && (self.successMultiUpload == self.multidocCount)) {
                        notificationService.success("Some Documents are not uploaded.");
                    }

                    return true;
                },
                error: function (file, message) {
                    self.enableButtonSave = true;
                    if (self.multidocCount == self.maxNumfiles) {
                        return;
                    }
                    if (file.xhr) {
                        if (file.xhr.status == 422) {
                            notificationService.error('Document name already exist in Matter and category ');
                            toggleButtons(true, 'Cancel'); //Bug#7190 :enable cancel button                         
                            return;
                        }

                        if (file.xhr.status == 500) {
                            var erroMessage = JSON.parse(file.xhr.responseText);
                            if (erroMessage.message == " Please upload valid document.") {
                                notificationService.error(erroMessage.message);
                            } else if (erroMessage.message == "You do not have permission to create task") {
                                toggleButtons(true, 'Save'); //Bug#15989 :enable save button 
                                notificationService.error('You do not have permission to create task');
                            } else {
                                notificationService.error('Upload Error ');
                            }
                            toggleButtons(true, 'Cancel'); //Bug#7190 :enable cancel button                    
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
                                    loginDatalayer.logoutUser()
                                        .then(function () {
                                            notificationService.error('You are unauthorized to access this service.');
                                            localStorage.clear();
                                            $state.go('login');
                                        });
                                    return;
                                }
                                var filename = file.name;
                                var index = _.findIndex(self.multiFilesdata, { fileName: file.name });
                                if (index >= 0) {
                                    if (file.xhr && $.trim(file.xhr.responseText) != '' && (file.xhr.status != 506)) {
                                        var ferror = file.xhr.responseText;
                                    } else {
                                        var ferror = "Document not uploaded.Please try again.";
                                    }

                                    if (file.xhr.status == 506) {
                                        ferror = file.xhr.responseText;

                                    }

                                    self.multiFilesdata[index].error = ferror;
                                    self.multiuploadError = parseInt(self.multiuploadError) + parseInt(1);
                                }
                                fileCount--;
                                self.multiFilesdata[index].fileProgress = 0;
                                if ((parseInt(self.multiuploadError) + parseInt(self.successMultiUpload)) == self.multidocCount) {
                                    if (self.multiuploadError >= 2) {
                                        self.multiuploadError = self.multiuploadError - self.multiuploadError;
                                    } else {
                                        self.multiuploadError = self.multiuploadError--;
                                    }
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
            checkCatSeleted();
            if (self.multidocCount == 0) {
                notificationService.success("There is no document in queue to upload.");
                //Dropzone.forElement("#YourDropBoxId").removeAllFiles(true);
                self.multidropzoneObj.removeAllFiles(true);
                self.multifileUpload = false;
                self.enableButtonSave = false;
                toggleButtons(true, 'Cancel'); //Bug#7190:Enable Cancel button on document upload page
            }
        }
        function setMoreInfoType(moreInfo) {
            switch (moreInfo) {
                case 'motion':
                    selectedMotion();
                    break;
                case 'liens':
                    self.newLiensInfo = {};
                    break;
                case 'medicalbill':
                    self.paymentBtns = documentAddHelper.paymentBtns();
                    self.newMedicalBillInfo = {};
                    self.newMedicalBillInfo.payment_mode = 2;
                    break;
                case 'insurance':
                    self.newInsauranceInfo = {};
                    self.excessConfirmed = [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }];
                    break;
                case 'expense':
                    self.newExpenseInfo = {};
                    self.disbursableBtns = [{ label: "Yes", value: 1 }, { label: "No", value: 0 }];
                    self.paymentBtns = [{ label: "Paid", value: 1 }, { label: "Unpaid", value: 2 }, { label: "Partial", value: 3 }];
                    self.newExpenseInfo.payment_mode = 2 //default payment mode (unpaid) 
                    self.newExpenseInfo.paid_amount = null;
                    self.newExpenseInfo.expense_amount = null;
                    self.newExpenseInfo.outstandingamount = null;
                    matterDetailsService.getExpenseType()
                        .then(function (response) {
                            self.expenseTypes = response;
                        });
                    break;
                case 'medicalrecord':
                    self.newMedicalInfo = {};
                    break;
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
            if (data.insurance_provider) {
                if (data.insurance_provider.contact_id == undefined) {
                    notificationService.error("Invalid Contact Selected");
                    return true;
                }
            }
            if (data.lien_adjuster) {
                if (data.lien_adjuster.contact_id == undefined) {
                    notificationService.error("Invalid Contact Selected");
                    return true;
                }
            }
            if (data.insurance_adjuster) {
                if (data.insurance_adjuster.contact_id == undefined) {
                    notificationService.error("Invalid Contact Selected");
                    return true;
                }
            }
        }

        /**
         * Get document details for specific document
         */
        function getDocumentDetails(docId, matterId) {
            documentsDataService.getOneDocumentDetails(docId, matterId)
                .then(function (response) {
                    $rootScope.$emit('openOnlineOnline', { docDetails: response });
                    // $state.go('matter-documents', { matterId: matterId });
                }, function (error) {
                    notificationService.error("Unable to get document details");
                });
        }


        /*Process the documents queue */
        function processDocuments(officeOnlineFlag) {
            /**
             * office onlive document add
             */
            if (officeOnlineFlag) {
                // check whether needs review and reviewer user selected
                if (utils.isEmptyVal(self.reviewUser) && self.docModel.needs_review == true) {
                    notificationService.error('Please select a reviewer from user list.');
                    return false;
                }
                if (utils.isEmptyVal(self.docModel.matterid)) {
                    notificationService.error("Matter is required");
                    return false;
                }

                if (utils.isEmptyVal(self.docModel.document_name)) {
                    notificationService.error("Document name is required");
                    return false;
                }

                if (utils.isEmptyVal(self.docModel.category)) {
                    notificationService.error("Category is required");
                    return false;
                }
                var setPlaintiifId = '';
                var setPlaintiifRole = '';
                if (self.moreInfoSelect == "motion") {
                    setPlaintiifId = angular.isUndefined(self.docModel.associated_party_id) ? '' : self.docModel.associated_party_id;
                    setPlaintiifRole = angular.isUndefined(self.docModel.party_role) ? '' : self.docModel.party_role;

                } else {
                    setPlaintiifId = angular.isUndefined(self.docModel.associated_party_id) ? '' : self.docModel.associated_party_id;
                    setPlaintiifRole = angular.isUndefined(self.docModel.party_role) ? '' : self.docModel.party_role;
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
                params.associated_party = {};
                params.associated_party.associated_party_id = setPlaintiifId;
                params.associated_party.associated_party_role = setPlaintiifRole;
                params.matter = { "matter_id": self.docModel.matterid };
                params.doc_name = self.docModel.document_name + "." + self.onlineDocType;
                params.doc_category = { "doc_category_id": self.docModel.category };
                params.date_filed_date = utils.isNotEmptyVal(self.docModel.date_filed_date) ? moment.utc(self.docModel.date_filed_date).unix() : '';
                params.tags_String = self.docAddTags ? (_.pluck(self.docAddTags, 'name')).toString() : '';
                params.needs_review = self.docModel.needs_review ? "1" : "0";
                params.review_user = review_User;
                params.uploadtype = "fresh";
                documentsDataService.uploadOfficeDocs(params)
                    .then(function (response) {
                        getDocumentDetails(response.doc_id, self.docModel.matterid);
                    }, function (error) {
                        if (error.message == "Document name already exists in Matter and Category") {
                            notificationService.error("Document name already exist in Matter and category!");
                        } else {
                            notificationService.error(error.message);
                        }
                    });
                return;
            }

            //US#6288
            if (self.moreInfoSelect == 'medicalrecord') {
                if (self.newMedicalInfo.medical_provider) {
                    if (self.newMedicalInfo.medical_provider.contact_id == undefined) {
                        notificationService.error("Invalid Contact Selected");
                        return;
                    }
                }
                if (self.newMedicalInfo.physician) {
                    if (self.newMedicalInfo.physician.contact_id == undefined) {
                        notificationService.error("Invalid Contact Selected");
                        return;
                    }

                }
            }
            //BUG#10878
            if (self.moreInfoSelect == 'motion') {

                if (self.documentMotionDetailInfo.contact) {
                    if (self.documentMotionDetailInfo.contact.contact_id == undefined) {
                        notificationService.error("Invalid Judge Selected");
                        return;
                    }
                }
            }
            if (self.moreInfoSelect == 'medicalbill') {
                //US#6288
                if (self.newMedicalBillInfo.medical_provider) {
                    if (self.newMedicalBillInfo.medical_provider.contact_id == undefined) {
                        notificationService.error("Invalid Contact Selected");
                        return;
                    }
                }
                //validation for payment status 
                var totalamount = parseFloat(self.newMedicalBillInfo.bill_amount);
                var paidamount = parseFloat(self.newMedicalBillInfo.paid_amount);
                var adjustedamount = parseFloat(self.newMedicalBillInfo.adjusted_amount);
                var adjustment = parseFloat(self.newMedicalBillInfo.adjustment_amount);


                if (utils.isEmptyVal(totalamount)) {
                    totalamount = "0";
                }
                if ((utils.isEmptyVal(totalamount)) && (utils.isNotEmptyVal(paidamount))) {
                    notificationService.error('Bill amount should be greater than Paid amount');
                    return;
                }

                if ((utils.isNotEmptyVal(totalamount)) && (utils.isNotEmptyVal(paidamount))) {
                    if (paidamount > totalamount) {
                        notificationService.error('Bill amount should be greater than Paid amount');
                        return;
                    }
                }
                if ((utils.isNotEmptyVal(totalamount)) && (utils.isNotEmptyVal(adjustedamount))) {
                    if (adjustedamount > totalamount) {
                        notificationService.error('Bill amount should be greater than Adjusted amount');
                        return;
                    }
                }
                if ((utils.isNotEmptyVal(totalamount)) && (utils.isNotEmptyVal(adjustment))) {
                    if (adjustment > totalamount) {
                        notificationService.error('Bill amount should be greater than Adjustment amount');
                        return;
                    }
                }
            }

            if (self.moreInfoSelect == 'liens') {
                if (self.newLiensInfo) {
                    if (checkContact(self.newLiensInfo)) {
                        return;
                    }

                    if (self.newLiensInfo.lien_holder) {
                        if (self.newLiensInfo.lien_holder.contact_id == undefined) {
                            notificationService.error("Invalid Contact Selected");
                            return;
                        }
                    }
                }

            }
            //
            if (self.moreInfoSelect == 'insurance') {
                if (self.newInsauranceInfo) {
                    if (checkContact(self.newInsauranceInfo)) {
                        return;
                    }
                }
                //Bug#9271
                if (parseFloat(self.newInsauranceInfo.policy_limit) > parseFloat(self.newInsauranceInfo.policy_limit_max)) {
                    return notificationService.error("Policy limit range is incorrect.");
                }
                if (self.newInsauranceInfo.insured_party) {
                    if (self.newInsauranceInfo.insured_party.contact_id == undefined) {
                        notificationService.error("Invalid Contact Selected");
                        return;
                    }
                }
            }
            if (self.moreInfoSelect == 'expense') {
                var expense_amount = parseFloat(self.newExpenseInfo.expense_amount);
                var paidamount = parseFloat(self.newExpenseInfo.paid_amount);
                if (utils.isEmptyVal(expense_amount)) {
                    //expense_amount = "0";
                }

                if ((utils.isEmptyVal(expense_amount)) && (utils.isNotEmptyVal(paidamount))) {
                    notificationService.error('Expense amount should be greater than Paid amount');
                    return;
                }

                if ((utils.isNotEmptyVal(expense_amount)) && (utils.isNotEmptyVal(paidamount))) {
                    if (paidamount > expense_amount) {
                        notificationService.error('Expense amount should be greater than Paid amount');
                        return;
                    }
                }

            }


            self.documentMotionValidationError = false;
            var moreInfo = {};
            if (self.singlefileUpload == true) {
                // check whether needs review and reviewer user selected
                if (utils.isEmptyVal(self.reviewUser) && self.docModel.needs_review == true) {
                    notificationService.error('Please select a reviewer from user list.');
                    return false;
                }

                if (self.isGlobal && (self.docModel.matterid == 0
                    || utils.isEmptyVal(self.docModel.matterid))) {
                    notificationService.error("Matter is required");
                    return false;
                }

                if (utils.isEmptyVal(self.singleFileName)) {
                    notificationService.error("Document is required");
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
                            self.enableButtonSave = true;
                            flag = false;
                            notificationService.error('Please select a reviewer from user list.');
                            return false;
                        }

                        if (datavalue.isGlobal && (datavalue.matterid == 0
                            || utils.isEmptyVal(datavalue.matterid))) {
                            self.enableButtonSave = true;
                            flag = false;
                            notificationService.error("Matter is required");
                            return false;
                        }

                        if (utils.isEmptyVal(datavalue.fileName)) {
                            self.enableButtonSave = true;
                            flag = false;
                            notificationService.error("Document is required");
                            return false;
                        }

                        if (utils.isEmptyVal(datavalue.categoryid)) {
                            self.enableButtonSave = true;
                            flag = false;
                            notificationService.error("Category is required");
                            return false;
                        }


                        if (datavalue.moreInfoSelect == 'medicalrecord') {

                            if (datavalue.newMedicalInfo.medical_provider) {
                                if (datavalue.newMedicalInfo.medical_provider.contact_id == undefined) {
                                    notificationErrorMsg('#providerid', datakey);
                                    self.enableButtonSave = true;
                                    flag = false;
                                    notificationService.error("Invalid Contact Selected");
                                    return;
                                }
                            }
                            if (datavalue.newMedicalInfo.physician) {
                                if (datavalue.newMedicalInfo.physician.contact_id == undefined) {
                                    notificationErrorMsg('#physicianid', datakey);
                                    self.enableButtonSave = true;
                                    flag = false;
                                    notificationService.error("Invalid Contact Selected");
                                    return;
                                }

                            }
                        }
                        //BUG#10878
                        if (datavalue.moreInfoSelect == 'motion') {

                            if (datavalue.documentMotionDetailInfo.contact) {
                                if (datavalue.documentMotionDetailInfo.contact.contactid == undefined) {
                                    notificationErrorMsg('#contactid', datakey);
                                    self.enableButtonSave = true;
                                    flag = false;
                                    notificationService.error("Invalid Judge Selected");
                                    return;
                                }
                            }
                        }
                        if (datavalue.moreInfoSelect == 'medicalbill') {
                            //US#6288
                            if (datavalue.newMedicalBillInfo.medical_provider) {
                                if (datavalue.newMedicalBillInfo.medical_provider.contact_id == undefined) {
                                    notificationErrorMsg('#providerid', datakey);
                                    self.enableButtonSave = true;
                                    flag = false;
                                    notificationService.error("Invalid Contact Selected");
                                    return;
                                }
                            }
                            //validation for payment status 
                            var totalamount = parseFloat(datavalue.newMedicalBillInfo.bill_amount);
                            var paidamount = parseFloat(datavalue.newMedicalBillInfo.paid_amount);
                            var adjustedamount = parseFloat(datavalue.newMedicalBillInfo.adjusted_amount);
                            var adjustment = parseFloat(datavalue.newMedicalBillInfo.adjustment_amount);
                            if (utils.isEmptyVal(totalamount)) {
                                totalamount = "0";
                            }
                            if ((utils.isEmptyVal(totalamount)) && (utils.isNotEmptyVal(paidamount))) {
                                notificationErrorMsg('#billamount', datakey);
                                self.enableButtonSave = true;
                                flag = false;
                                notificationService.error('Bill amount should be greater than Paid amount');
                                return;
                            }

                            if ((utils.isNotEmptyVal(totalamount)) && (utils.isNotEmptyVal(paidamount))) {
                                if (paidamount > totalamount) {
                                    notificationErrorMsg('#billamount', datakey);
                                    self.enableButtonSave = true;
                                    flag = false;
                                    notificationService.error('Bill amount should be greater than Paid amount');
                                    return;
                                }
                            }
                            if ((utils.isNotEmptyVal(totalamount)) && (utils.isNotEmptyVal(adjustedamount))) {
                                if (adjustedamount > totalamount) {
                                    notificationErrorMsg('#billamount', datakey);
                                    self.enableButtonSave = true;
                                    flag = false;
                                    notificationService.error('Bill amount should be greater than Adjusted amount');
                                    return;
                                }
                            }
                            if ((utils.isNotEmptyVal(totalamount)) && (utils.isNotEmptyVal(adjustment))) {
                                if (adjustment > totalamount) {
                                    notificationErrorMsg('#billamount', datakey);
                                    self.enableButtonSave = true;
                                    flag = false;
                                    notificationService.error('Bill amount should be greater than Adjustment amount');
                                    return;
                                }
                            }
                        }

                        if (datavalue.moreInfoSelect == 'liens') {
                            if (datavalue.newLiensInfo) {

                                if (datavalue.newLiensInfo.lien_holder) {
                                    if (datavalue.newLiensInfo.lien_holder.contact_id == undefined) {
                                        notificationErrorMsg('#lienholdername', datakey);
                                        self.enableButtonSave = true;
                                        flag = false;
                                        notificationService.error("Invalid Contact Selected");
                                        return;
                                    }
                                }

                                if (datavalue.newLiensInfo.insurance_provider) {
                                    if (datavalue.newLiensInfo.insurance_provider.contact_id == undefined) {
                                        notificationErrorMsg('#insuranceproviderid', datakey);
                                        self.enableButtonSave = true;
                                        flag = false;
                                        notificationService.error("Invalid Contact Selected");
                                        return true;
                                    }
                                }

                                if (datavalue.newLiensInfo.lien_adjuster) {
                                    if (datavalue.newLiensInfo.lien_adjuster.contact_id == undefined) {
                                        notificationErrorMsg('#adjusterid', datakey);
                                        self.enableButtonSave = true;
                                        flag = false;
                                        notificationService.error("Invalid Contact Selected");
                                        return true;
                                    }
                                }

                                var amount = parseFloat(datavalue.newLiensInfo.lien_amount);
                                var dueamount = parseFloat(datavalue.newLiensInfo.due_amount);
                                
                                //US#16912 Removing logic in "Amount Due" when adding a lien
                                /* if (utils.isNotEmptyVal(amount) && utils.isNotEmptyVal(dueamount)) {
                                    if (amount < dueamount) {
                                        notificationErrorMsg('#dueamount', datakey);
                                        self.enableButtonSave = true;
                                        flag = false;
                                        notificationService.error('Due Amount Should be less than Amount');
                                        return false;
                                    }
                                } */

                            }

                        }
                        //
                        if (datavalue.moreInfoSelect == 'insurance') {
                            if (datavalue.newInsauranceInfo) {
                                if (datavalue.newInsauranceInfo.insured_party) {
                                    if (datavalue.newInsauranceInfo.insured_party.contact_id == undefined) {
                                        notificationErrorMsg('#insured_party_id', datakey);
                                        self.enableButtonSave = true;
                                        flag = false;
                                        notificationService.error("Invalid Contact Selected");
                                        return;
                                    }
                                }

                                if (datavalue.newInsauranceInfo.insurance_provider) {
                                    if (datavalue.newInsauranceInfo.insurance_provider.contact_id == undefined) {
                                        notificationErrorMsg('#insurance_provider_id', datakey);
                                        self.enableButtonSave = true;
                                        flag = false;
                                        notificationService.error("Invalid Contact Selected");
                                        return true;
                                    }
                                }
                                if (datavalue.newInsauranceInfo.insurance_adjuster) {
                                    if (datavalue.newInsauranceInfo.insurance_adjuster.contact_id == undefined) {
                                        notificationErrorMsg('#insurance_adjuster_id', datakey);
                                        self.enableButtonSave = true;
                                        flag = false;
                                        notificationService.error("Invalid Contact Selected");
                                        return true;
                                    }
                                }

                            }
                            //Bug#9271
                            if (parseFloat(datavalue.newInsauranceInfo.policy_limit) > parseFloat(datavalue.newInsauranceInfo.policy_limit_max)) {
                                notificationErrorMsg('#policylimit', datakey);
                                self.enableButtonSave = true;
                                flag = false;
                                return notificationService.error("Policy limit range is incorrect.");
                            }

                        }
                        if (datavalue.moreInfoSelect == 'expense') {
                            var expense_amount = parseFloat(datavalue.newExpenseInfo.expense_amount);
                            var paidamount = parseFloat(datavalue.newExpenseInfo.paid_amount);
                            if (utils.isEmptyVal(expense_amount)) {
                                //expense_amount = "0";
                            }

                            if ((utils.isEmptyVal(expense_amount)) && (utils.isNotEmptyVal(paidamount))) {
                                notificationErrorMsg('#paidamount', datakey);
                                self.enableButtonSave = true;
                                flag = false;
                                notificationService.error('Expense amount should be greater than Paid amount');
                                return;
                            }

                            if ((utils.isNotEmptyVal(expense_amount)) && (utils.isNotEmptyVal(paidamount))) {
                                if (paidamount > expense_amount) {
                                    notificationErrorMsg('#expenseamount', datakey);
                                    self.enableButtonSave = true;
                                    flag = false;
                                    notificationService.error('Expense amount should be greater than Paid amount');
                                    return;
                                }
                            }

                        }

                        //  var moreInfo = {};
                        //  var isMoreInfoValid = setMoreInfoForMultiDov(datavalue, moreInfo);
                        //  if (isMoreInfoValid === false) { return; }

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
            //toggleButtons(false);

            sessionalive = setInterval(keepSessionalive, 900000);
            usSpinnerService.spin('pageSpinner');
        }

        function applyQueueStatus(files, callback) {
            for (var i = 0; i < files.length; i++) {
                files[i].status = "queued";
            }
            callback();
        }

        //US#7853
        function insuranceInfo() {
            if (utils.isEmptyVal(self.newInsauranceInfo.insured_party) && (utils.isEmptyVal(self.newInsauranceInfo.memo)) && utils.isEmptyVal(self.newInsauranceInfo.insurance_provider) && utils.isEmptyVal(self.newInsauranceInfo.insurance_adjuster) && utils.isEmptyVal(self.newInsauranceInfo.insurance_type) && utils.isEmptyVal(self.newInsauranceInfo.policy_limit) && utils.isEmptyVal(self.newInsauranceInfo.policy_limit_max) && utils.isEmptyVal(self.newInsauranceInfo.policy_number) && utils.isEmptyVal(self.newInsauranceInfo.claim_number)) {
                self.moreInfoSelect = '';
            }
        }

        function medicalRecordInfo() {
            if (utils.isEmptyVal(self.newMedicalInfo.physician) && utils.isEmptyVal(self.newMedicalInfo.medical_provider) && utils.isEmptyVal(self.newMedicalInfo.service_start_date) && utils.isEmptyVal(self.newMedicalInfo.service_end_date) && utils.isEmptyVal(self.newMedicalInfo.date_requested) && utils.isEmptyVal(self.newMedicalInfo.treatment_type) && utils.isEmptyVal(self.newMedicalInfo.memo)) {
                self.moreInfoSelect = '';
            }
        }

        function medicalBillsInfo() {
            if (utils.isEmptyVal(self.newMedicalBillInfo.medical_provider) && utils.isEmptyVal(self.newMedicalBillInfo.memo) && utils.isEmptyVal(self.newMedicalBillInfo.service_start_date) && utils.isEmptyVal(self.newMedicalBillInfo.service_end_date) && utils.isEmptyVal(self.newMedicalBillInfo.bill_amount)) {
                self.moreInfoSelect = '';
            }
        }

        function expenseInfo() {
            if (utils.isEmptyVal(self.newExpenseInfo.expense_name) && utils.isEmptyVal(self.newExpenseInfo.memo)
                && utils.isEmptyVal(self.newExpenseInfo.cheque_no) && utils.isEmptyVal(self.newExpenseInfo.bank_account)
                && (utils.isEmptyVal(self.newExpenseInfo.memo)) && utils.isEmptyVal(self.newExpenseInfo.expense_type) && utils.isEmptyVal(self.newExpenseInfo.incurred_date) && utils.isEmptyVal(self.newExpenseInfo.expense_amount)) {
                self.moreInfoSelect = '';
            }
        }


        function liensInfo() {
            if (utils.isEmptyVal(self.newLiensInfo.lien_holder) && (utils.isEmptyVal(self.newLiensInfo.memo)) && utils.isEmptyVal(self.newLiensInfo.claim_number) && utils.isEmptyVal(self.newLiensInfo.insurance_provider) && utils.isEmptyVal(self.newLiensInfo.date_paid) && utils.isEmptyVal(self.newLiensInfo.lien_amount) && utils.isEmptyVal(self.newLiensInfo.lien_adjuster) && utils.isEmptyVal(self.newLiensInfo.due_amount) && utils.isEmptyVal(self.newLiensInfo.date_of_claim)) {
                self.moreInfoSelect = '';
            }
        }

        function motionInfo() {
            if (self.documentMotionDetailInfo.motion_on_by == "motionByUs" && (utils.isEmptyVal(self.documentMotionDetailInfo.motion_date_returnable)) && (utils.isEmptyVal(self.documentMotionDetailInfo.motion_date_of_service)) && (self.documentMotionDetailInfo.motion_status == '') && (self.documentMotionDetailInfo.motion_type == '') && utils.isEmptyVal(self.documentMotionDetailInfo.motion_description) && utils.isEmptyVal(self.documentMotionDetailInfo.motion_title) && utils.isEmptyVal(self.documentMotionDetailInfo.is_global) && utils.isEmptyVal(self.documentMotionDetailInfo.contact)) {
                self.moreInfoSelect = '';
            }
        }

        /*Create params fro single file upload*/
        function createParam() {
            var singledovParams = {};
            singledovParams.documentname = self.docModel.documentname;
            singledovParams.categoryid = self.docModel.category;
            singledovParams.needs_review = self.docModel.needs_review ? 1 : 0;
            singledovParams.review_user = utils.isNotEmptyVal(self.reviewUser) ? self.reviewUser.toString() : ''; // assign reviewer user
            singledovParams.date_filed_date = utils.isNotEmptyVal(self.docModel.date_filed_date) ? moment.utc(self.docModel.date_filed_date).unix() : '';
            singledovParams.uploadtype = 'fresh';
            singledovParams.matter_id = self.isGlobal ? parseInt(self.docModel.matter_id) : parseInt(self.matterId);
            singledovParams.associated_party_id = utils.isEmptyVal(self.docModel.associated_party_id) ? '' : parseInt(self.docModel.associated_party_id);
            singledovParams.party_role = utils.isNotEmptyVal(self.docModel.party_role) ? self.docModel.party_role : "";
            //var singleTags = [];
            //angular.forEach(self.docAddTags, function (datavalue, datakey) {
            //    singleTags.push(datavalue.name);
            //});
            if (singledovParams.categoryid == '10') {
                motionInfo();
            }
            //US#7853 check category and send moreInfoselect for this categories as  empty 
            if (singledovParams.categoryid == '6' || singledovParams.categoryid == '7' || singledovParams.categoryid == '8' || singledovParams.categoryid == '15' || singledovParams.categoryid == '22') {
                
                switch (parseInt(singledovParams.categoryid)) {
                    case 6: insuranceInfo();
                        break;
                    case 7: medicalRecordInfo();
                        break;
                    case 8: medicalBillsInfo();
                        break;
                    case 15: expenseInfo();
                        break;
                    case 22: liensInfo();
                        break;
                }
            } else {
                angular.isDefined(self.memo) ? singledovParams.memo = self.memo : singledovParams.memo = '';
            }
            singledovParams.tags_String = _.pluck(self.docAddTags, 'name');
            singledovParams.tags_String = utils.isEmptyVal(singledovParams.tags_String) ? "" : singledovParams.tags_String.toString();
            singledovParams.more_info_type = angular.isUndefined(self.moreInfoSelect) ? null : self.moreInfoSelect;

            var moreInfo = {};
            var isMoreInfoValid = setMoreInfo(moreInfo);
            if (isMoreInfoValid === false) { return false; }
            singledovParams.more_info = utils.isEmptyVal(self.moreInfoSelect) ? null : JSON.stringify(moreInfo);
            return singledovParams;
        }

        function setMoreInfo(moreInfo) {
            switch (self.moreInfoSelect) {
                case "motion":
                    setMoreInfoForMotion(moreInfo);
                    break;
                case "liens":
                    var isLiensAmountValid = documentAddHelper.setMoreInfoForLiens(moreInfo, self.newLiensInfo);
                    moreInfo.associated_party_id = utils.isNotEmptyVal(self.docModel.associated_party_id) ? parseInt(self.docModel.associated_party_id) : null;
                    moreInfo.party_role = utils.isNotEmptyVal(self.docModel.party_role) ? self.docModel.party_role : 0;
                    moreInfo.matter_id = self.isGlobal ? parseInt(self.docModel.matter_id) : parseInt(self.matterId);
                    if (isLiensAmountValid === false) { return false; } else { break; }
                    break;
                case 'medicalbill':
                    var isDateRangeValid = documentAddHelper.setMoreInfoForMedicalBill(moreInfo, self.newMedicalBillInfo);
                    moreInfo.associated_party_id = utils.isNotEmptyVal(self.docModel.associated_party_id) ? parseInt(self.docModel.associated_party_id) : null;
                    moreInfo.party_role = utils.isNotEmptyVal(self.docModel.party_role) ? self.docModel.party_role : 0;
                    moreInfo.matter_id = self.isGlobal ? parseInt(self.docModel.matter_id) : parseInt(self.matterId);
                    if (isDateRangeValid === false) { return false; } else { break; }
                    break;
                case 'insurance':
                    documentAddHelper.setMoreInfoForInsurance(moreInfo, self.newInsauranceInfo);
                    moreInfo.associated_party_id = utils.isNotEmptyVal(self.docModel.associated_party_id) ? parseInt(self.docModel.associated_party_id) : null;
                    moreInfo.party_role = utils.isNotEmptyVal(self.docModel.party_role) ? self.docModel.party_role : null;
                    moreInfo.matter_id = utils.isNotEmptyVal(self.docModel.matterId) ? parseInt(self.docModel.matterId) : parseInt(self.matterId);
                    break;
                case 'expense':
                    documentAddHelper.setMoreInfoForExpense(moreInfo, self.newExpenseInfo);
                    moreInfo.expense_type.expense_type_id = utils.isNotEmptyVal(self.newExpenseInfo.expense_type) ? self.newExpenseInfo.expense_type.expense_type_id : '';
                    moreInfo.associated_party.associated_party_id = utils.isNotEmptyVal(self.docModel.associated_party_id) ? parseInt(self.docModel.associated_party_id) : null;
                    moreInfo.associated_party.associated_party_role = utils.isNotEmptyVal(self.docModel.party_role) ? self.docModel.party_role : null;
                    break;
                case 'medicalrecord':
                    moreInfo.matter_id = utils.isNotEmptyVal(self.matterId) ? parseInt(self.matterId) : self.docModel.matterid;
                    moreInfo.associated_party_id = utils.isNotEmptyVal(self.docModel.associated_party_id) ? parseInt(self.docModel.associated_party_id) : null;
                    moreInfo.party_role = utils.isNotEmptyVal(self.docModel.party_role) ? self.docModel.party_role : 0;
                    var isMedicalDateRangeValid = documentAddHelper.setMoreInfoForMedicalInfo(moreInfo, self.newMedicalInfo);
                    if (isMedicalDateRangeValid === false) { return false; } else { break; }
                    break;
                default:
                    if (document.getElementById(self.moreInfoSelect)) {
                        var formElementslength = document.getElementById(self.moreInfoSelect).elements.length;
                        if (formElementslength > 0) {
                            var formElements = document.getElementById(self.moreInfoSelect).elements;
                            $.each(formElements, function (datavalue, datakey) {
                                var value = $(datakey).val();
                                var ctype = $(datakey).attr("ctype");
                                var eleName = $(datakey).attr("name");

                                var obj = { "name": eleName, "ctype": ctype, "value": value };

                                moreInfo[eleName] = obj;
                            });
                        }
                    }
            }
            // if(self.moreInfoSelect != 'expense'){
            //     moreInfo.associated_party_id = angular.isUndefined(self.docModel.associated_party_id) ? '' : self.docModel.associated_party_id;
            //     moreInfo.party_role = angular.isUndefined(self.docModel.party_role) ? '' : self.docModel.party_role;
            // }    
        }

        function setMoreInfoForMotion(moreInfo) {
            validateMotionDate(self.documentMotionDetailInfo.motion_date_of_service, self.documentMotionDetailInfo.motion_date_returnable);
            moreInfo.associated_party = { associated_party_id: '', associated_party_role: '' };
            moreInfo.motion_title = utils.isNotEmptyVal(self.documentMotionDetailInfo.motion_title) ? self.documentMotionDetailInfo.motion_title : '';
            moreInfo.motion_date_of_service = (self.dateOfServiceInUTC == null || self.dateOfServiceInUTC == "" || self.dateOfServiceInUTC == undefined) ? "" : utils.getUTCTimeStamp(self.dateOfServiceInUTC);
            moreInfo.motion_date_returnable = (self.returnableDateInUTC == null || self.returnableDateInUTC == "" || self.returnableDateInUTC == undefined) ? "" : utils.getUTCTimeStamp(self.returnableDateInUTC);
            moreInfo.motion_status = utils.isNotEmptyVal(self.documentMotionDetailInfo.motion_status) ? self.documentMotionDetailInfo.motion_status : '';
            moreInfo.motion_type = utils.isNotEmptyVal(self.documentMotionDetailInfo.motion_type) ? self.documentMotionDetailInfo.motion_type : '';
            moreInfo.is_global = angular.isDefined(self.documentMotionDetailInfo.is_global) ? self.documentMotionDetailInfo.is_global : 0;

            moreInfo.motion_judge_id = (angular.isDefined(self.documentMotionDetailInfo) && angular.isDefined(self.documentMotionDetailInfo.contact)
                && angular.isDefined(self.documentMotionDetailInfo.contact.contactid)) ? self.documentMotionDetailInfo.contact.contactid : '';

            moreInfo.motion_description = (angular.isDefined(self.documentMotionDetailInfo)
                && angular.isDefined(self.documentMotionDetailInfo.motion_description)) ? self.documentMotionDetailInfo.motion_description : '';

            moreInfo.motion_on_by = (self.documentMotionDetailInfo.motion_on_by == "motionByUs") ? "by" : "on";
            moreInfo.associated_party.associated_party_id = utils.isNotEmptyVal(self.docModel.associated_party_id) ? parseInt(self.docModel.associated_party_id) : null;
            moreInfo.associated_party.associated_party_role = utils.isNotEmptyVal(self.docModel.party_role) ? parseInt(self.docModel.party_role) : 0;
        }

        // Start : Multiple Document Upload
        self.setMultiUploadMoreInformationType = setMultiUploadMoreInformationType;
        function setMultiUploadMoreInformationType(catId, index) {
            if (utils.isEmptyVal(catId)) {
                return;
            }
            accordianFn(index);
            var category = _.find(self.documentCategories, function (cat) { return cat.doc_category_id === catId });
            switch (category.doc_category_name) {

                case "Medical Records":
                    self.multiFilesdata[index].moreInfoSelect = 'medicalrecord';
                    self.multiFilesdata[index].dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'medicalrecord';
                    });
                    self.multiFilesdata[index].dynamicSelect.unshift({ 'keytext': "", 'valuetext': "" }); // add blank value at top in array for extra option...
                    setMultiUploadMoreInfoType('medicalrecord', index);
                    break;
                case "Medical Bills":
                    self.multiFilesdata[index].moreInfoSelect = 'medicalbill';
                    self.multiFilesdata[index].dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'medicalbill';
                    });
                    self.multiFilesdata[index].dynamicSelect.unshift({ 'keytext': "", 'valuetext': "" }); // add blank value at top in array for extra option...
                    setMultiUploadMoreInfoType('medicalbill', index);
                    break;
                //Insurance is now seperate category accordingly more info is set
                case "Insurance":
                    self.multiFilesdata[index].moreInfoSelect = 'insurance';

                    self.multiFilesdata[index].dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'insurance';
                    });
                    self.multiFilesdata[index].dynamicSelect.unshift({ 'keytext': "", 'valuetext': "" }); // add blank value at top in array for extra option...
                    setMultiUploadMoreInfoType('insurance', index);
                    break;
                case "Expenses":
                    self.multiFilesdata[index].moreInfoSelect = 'expense';

                    self.multiFilesdata[index].dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'expense';
                    });
                    self.multiFilesdata[index].dynamicSelect.unshift({ 'keytext': "", 'valuetext': "" }); // add blank value at top in array for extra option...
                    setMultiUploadMoreInfoType('expense', index);
                    break;
                case "Motions":
                    self.multiFilesdata[index].moreInfoSelect = 'motion';
                    self.multiFilesdata[index].dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'motion';
                    });
                    self.multiFilesdata[index].dynamicSelect.unshift({ 'keytext': "", 'valuetext': "" }); // add blank value at top in array for extra option...
                    setMultiUploadMoreInfoType('motion', index);
                    break;
                //Liens has been added as seperate category accordingly more info is set
                case "Liens":
                    self.multiFilesdata[index].moreInfoSelect = 'liens';

                    self.multiFilesdata[index].dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'liens';
                    });
                    self.multiFilesdata[index].dynamicSelect.unshift({ 'keytext': "", 'valuetext': "" }); // add blank value at top in array for extra option...
                    setMultiUploadMoreInfoType('liens', index);
                    break;

                default:
                    self.multiFilesdata[index].moreInfoSelect = '';
                    self.multiFilesdata[index].dynamicSelect = [];
            }
        }

        self.setMultiUploadMoreInfoType = setMultiUploadMoreInfoType;
        function setMultiUploadMoreInfoType(moreInfo, index) {
            switch (moreInfo) {
                case 'motion':
                    self.multiFilesdata[index].documentMotionDetailInfo = {};
                    self.multiFilesdata[index].documentMotionDetailInfo.dateOfService = '';
                    self.multiFilesdata[index].documentMotionDetailInfo.returnableDate = '';

                    self.multiFilesdata[index].motionToBeSelected = [{ "value": "motionByUs", "label": "Motion By Us" }, { "value": "motionOnUs", "label": "Motion On Us" }];
                    if (self.multiFilesdata[index].documentMotionDetailInfo.motion_on_by == '' || self.multiFilesdata[index].documentMotionDetailInfo.motion_on_by == null || angular.isUndefined(self.multiFilesdata[index].documentMotionDetailInfo.motion_on_by)) {
                        self.multiFilesdata[index].documentMotionDetailInfo.motion_on_by = "motionByUs";
                    }

                    var mstData = angular.copy(masterData.getMasterData());
                    if (angular.isDefined(mstData) && angular.isDefined(mstData.motion_statuses)) {
                        self.motionStatus = mstData.motion_statuses;
                        if (self.multiFilesdata[index].documentMotionDetailInfo.motion_status == '' || self.multiFilesdata[index].documentMotionDetailInfo.motion_status == null || angular.isUndefined(self.multiFilesdata[index].documentMotionDetailInfo.motion_status)) {
                            self.multiFilesdata[index].documentMotionDetailInfo.motion_status = "";
                        }

                    }

                    if (angular.isDefined(mstData) && angular.isDefined(mstData.motion_types)) {
                        self.motionType = mstData.motion_types;
                        if (self.multiFilesdata[index].documentMotionDetailInfo.motion_type == '' || self.multiFilesdata[index].documentMotionDetailInfo.motion_type == null || angular.isUndefined(self.multiFilesdata[index].documentMotionDetailInfo.motion_type)) {
                            self.multiFilesdata[index].documentMotionDetailInfo.motion_type = "";
                        }

                    }
                    break;
                case 'liens':

                    self.multiFilesdata[index].newLiensInfo = {};
                    break;
                case 'medicalbill':
                    self.multiFilesdata[index].paymentBtns = documentAddHelper.paymentBtns();
                    self.multiFilesdata[index].newMedicalBillInfo = {};
                    self.multiFilesdata[index].newMedicalBillInfo.payment_mode = 2;
                    break;
                case 'insurance':
                    self.multiFilesdata[index].newInsauranceInfo = {};
                    self.multiFilesdata[index].excessConfirmed = [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }];
                    break;
                case 'expense':
                    self.multiFilesdata[index].newExpenseInfo = {};
                    self.multiFilesdata[index].disbursableBtns = [{ label: "Yes", value: "1" }, { label: "No", value: "0" }];
                    self.multiFilesdata[index].paymentBtns = [{ label: "Paid", value: 1 }, { label: "Unpaid", value: 2 }, { label: "Partial", value: 3 }];
                    self.multiFilesdata[index].newExpenseInfo.payment_mode = 2 //default payment mode (unpaid) 
                    self.multiFilesdata[index].newExpenseInfo.paid_amount = null;
                    self.multiFilesdata[index].newExpenseInfo.expense_amount = null;
                    self.multiFilesdata[index].newExpenseInfo.outstandingamount = null;
                    matterDetailsService.getExpenseType()
                        .then(function (response) {
                            self.expenseTypes = response;
                        });
                    break;
                case 'medicalrecord':
                    self.multiFilesdata[index].newMedicalInfo = {};
                    break;
            }
        }


        //  /*Create params fro single file upload*/
        function createMutipleParam(data) {
            var singledovParams = {};
            singledovParams.documentname = data.fileName;
            singledovParams.categoryid = data.categoryid;
            singledovParams.needs_review = data.needs_review ? 1 : 0;
            singledovParams.review_user = utils.isNotEmptyVal(data.reviewUser) ? data.reviewUser.toString() : ''; // assign reviewer user

            singledovParams.uploadtype = 'fresh';
            singledovParams.matter_id = self.isGlobal ? parseInt(data.matterId) : parseInt(self.matterId);
            singledovParams.date_filed_date = utils.isNotEmptyVal(data.date_filed_date) ? moment.utc(data.date_filed_date).unix() : '';
            singledovParams.associated_party_id = utils.isNotEmptyVal(data.associated_party_id) ? parseInt(data.associated_party_id) : '';
            singledovParams.party_role = utils.isNotEmptyVal(data.party_role) ? data.party_role : '';

            //singledovParams.plaintiffId = data.plaintiffId;
            //var singleTags = [];
            //angular.forEach(self.docAddTags, function (datavalue, datakey) {
            //    singleTags.push(datavalue.name);
            //});
            //singledovParams.tags = _.pluck(data.docAddTags, 'name');

            singledovParams.tags_String = data.multitags;
            if (singledovParams.categoryid == '10') {
                if (data.documentMotionDetailInfo.motion_on_by == "motionByUs" && (utils.isEmptyVal(data.documentMotionDetailInfo.motion_date_of_service)) && (utils.isEmptyVal(data.documentMotionDetailInfo.motion_date_returnable)) && (data.documentMotionDetailInfo.motion_status == '') && (data.documentMotionDetailInfo.motion_type == '') && utils.isEmptyVal(data.documentMotionDetailInfo.motion_description) && utils.isEmptyVal(data.documentMotionDetailInfo.motion_title) && utils.isEmptyVal(data.documentMotionDetailInfo.is_global) && utils.isEmptyVal(data.documentMotionDetailInfo.contact)) {
                    data.moreInfoSelect = '';
                }
            }

            //US#7853 check category and send moreInfoselect for this categories as  empty 
            if (singledovParams.categoryid == '6' || singledovParams.categoryid == '7' || singledovParams.categoryid == '8' || singledovParams.categoryid == '15' || singledovParams.categoryid == '22') {
                switch (parseInt(singledovParams.categoryid)) {
                    case 6:
                        //insuranceInfo();
                        if (utils.isEmptyVal(data.newInsauranceInfo.insured_party) && (utils.isEmptyVal(data.newInsauranceInfo.memo)) && utils.isEmptyVal(data.newInsauranceInfo.insurance_provider) && utils.isEmptyVal(data.newInsauranceInfo.insurance_adjuster) && utils.isEmptyVal(data.newInsauranceInfo.insurance_type) && utils.isEmptyVal(data.newInsauranceInfo.policy_limit) && utils.isEmptyVal(data.newInsauranceInfo.policy_limit_max) && utils.isEmptyVal(data.newInsauranceInfo.policy_number) && utils.isEmptyVal(data.newInsauranceInfo.claim_number)) {
                            data.moreInfoSelect = '';
                        }
                        break;
                    case 7:
                        // medicalRecordInfo();
                        if (utils.isEmptyVal(data.newMedicalInfo.physician) && utils.isEmptyVal(data.newMedicalInfo.medical_provider) && utils.isEmptyVal(data.newMedicalInfo.service_start_date) && utils.isEmptyVal(data.newMedicalInfo.service_end_date) && utils.isEmptyVal(data.newMedicalInfo.date_requested) && utils.isEmptyVal(data.newMedicalInfo.treatment_type) && utils.isEmptyVal(data.newMedicalInfo.memo)) {
                            data.moreInfoSelect = '';
                        }
                        break;
                    case 8:
                        //medicalBillsInfo();
                        if (utils.isEmptyVal(data.newMedicalBillInfo.medical_provider) && utils.isEmptyVal(data.newMedicalBillInfo.memo) && utils.isEmptyVal(data.newMedicalBillInfo.service_start_date) && utils.isEmptyVal(data.newMedicalBillInfo.service_end_date) && utils.isEmptyVal(data.newMedicalBillInfo.bill_amount)) {
                            data.moreInfoSelect = '';
                        }
                        break;
                    case 15:
                        //expenseInfo();
                        if (utils.isEmptyVal(data.newExpenseInfo.expense_name) && utils.isEmptyVal(data.newExpenseInfo.memo)
                            && utils.isEmptyVal(data.newExpenseInfo.cheque_no) && utils.isEmptyVal(data.newExpenseInfo.bank_account)
                            && utils.isEmptyVal(data.newExpenseInfo.expense_type) && utils.isEmptyVal(data.newExpenseInfo.incurred_date) && utils.isEmptyVal(data.newExpenseInfo.expense_amount)) {
                            data.moreInfoSelect = '';
                        }
                        break;
                    case 22:
                        //liensInfo();
                        if (utils.isEmptyVal(data.newLiensInfo.lien_holder) && (utils.isEmptyVal(data.newLiensInfo.memo)) && utils.isEmptyVal(data.newLiensInfo.claim_number) && utils.isEmptyVal(data.newLiensInfo.insurance_provider) && utils.isEmptyVal(data.newLiensInfo.date_paid) && utils.isEmptyVal(data.newLiensInfo.lien_amount) && utils.isEmptyVal(data.newLiensInfo.lien_adjuster_id) && utils.isEmptyVal(data.newLiensInfo.due_amount) && utils.isEmptyVal(data.newLiensInfo.date_of_claim)) {
                            data.moreInfoSelect = '';
                        }
                        break;
                }
            } else {
                //var obj = {};
                singledovParams.memo = angular.isDefined(data.memo) ? data.memo : '';
                //angular.isDefined(data.memo) ? singledovParams.memo = JSON.stringify(obj) : singledovParams.memo = '';
            }
            singledovParams.more_info_type = angular.isUndefined(data.moreInfoSelect) ? null : data.moreInfoSelect;

            var moreInfo = {};
            var more_info = {};
            var isMoreInfoValid = setMoreInfoForMultiDov(data, moreInfo);
            if (isMoreInfoValid === false) { return false; }
            singledovParams.more_info = utils.isEmptyVal(data.moreInfoSelect) ? null : JSON.stringify(moreInfo);
            return singledovParams;
        }

        function setMoreInfoForMultiDov(data, moreInfo) {
            switch (data.moreInfoSelect) {
                case "motion":
                    //validateMotionDate(data.documentMotionDetailInfo.dateOfService, data.documentMotionDetailInfo.returnableDate);
                    moreInfo.associated_party = { associated_party_id: '', associated_party_role: '' };
                    var dateOfService = data.documentMotionDetailInfo.motion_date_of_service;
                    var returnableDate = data.documentMotionDetailInfo.motion_date_returnable;
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
                    var dateOfServiceInUTC = dosStartOfTheDay;
                    var returnableDateInUTC = rdStartOfTheDay;

                    if (dateOfService != '' && dateOfService != 0 && dateOfService != null && returnableDate != '' && returnableDate != 0 && returnableDate != null) {
                        if (dosStartOfTheDay >= rdStartOfTheDay) {
                            //self.documentMotionValidationError = true;
                            notificationService.error('Returnable Date Cannot be Same or Less Than Date of Service');
                            self.multiuploadError--;
                            return false;
                        }
                    }

                    moreInfo.motion_title = utils.isNotEmptyVal(data.documentMotionDetailInfo.motion_title) ? data.documentMotionDetailInfo.motion_title : '';
                    moreInfo.motion_date_of_service = (dateOfServiceInUTC == null || dateOfServiceInUTC == "" || dateOfServiceInUTC == undefined) ? "" : utils.getUTCTimeStamp(dateOfServiceInUTC);

                    moreInfo.motion_date_returnable = (returnableDateInUTC == null || returnableDateInUTC == "" || returnableDateInUTC == undefined) ? "" : utils.getUTCTimeStamp(returnableDateInUTC);
                    moreInfo.motion_type = utils.isNotEmptyVal(data.documentMotionDetailInfo.motion_type) ? data.documentMotionDetailInfo.motion_type : '';
                    moreInfo.motion_status = utils.isNotEmptyVal(data.documentMotionDetailInfo.motion_status) ? data.documentMotionDetailInfo.motion_status : '';

                    moreInfo.is_global = angular.isDefined(data.documentMotionDetailInfo.is_global) ? data.documentMotionDetailInfo.is_global : 0;

                    moreInfo.motion_judge_id = (angular.isDefined(data.documentMotionDetailInfo)
                        && angular.isDefined(data.documentMotionDetailInfo.contact)
                        && angular.isDefined(data.documentMotionDetailInfo.contact.contactid)) ?
                        data.documentMotionDetailInfo.contact.contactid : '';

                    moreInfo.motion_description = (angular.isDefined(data.documentMotionDetailInfo)
                        && angular.isDefined(data.documentMotionDetailInfo.motion_description)) ?
                        data.documentMotionDetailInfo.motion_description : '';
                    moreInfo.motion_on_by = (data.documentMotionDetailInfo.motion_on_by == "motionByUs") ? "by" : "on";
                    moreInfo.associated_party.associated_party_id = angular.isUndefined(data.associated_party_id) ? '' : parseInt(data.associated_party_id);
                    moreInfo.associated_party.associated_party_role = angular.isUndefined(data.party_role) ? 0 : data.party_role;
                    break;
                case "liens":
                    var isLiensAmountValid = documentAddHelper.setMoreInfoForLiens(moreInfo, data.newLiensInfo);
                    moreInfo.associated_party_id = angular.isUndefined(data.associated_party_id) ? '' : parseInt(data.associated_party_id);
                    moreInfo.party_role = angular.isUndefined(data.party_role) ? 0 : data.party_role;
                    moreInfo.matter_id = utils.isNotEmptyVal(self.matterId) ? parseInt(self.matterId) : parseInt(self.docModel.matterid);
                    if (isLiensAmountValid === false) { return false; } else { break; }
                    break;
                case 'medicalbill':
                    var isDateRangeValid = documentAddHelper.setMoreInfoForMedicalBill(moreInfo, data.newMedicalBillInfo);
                    moreInfo.associated_party_id = angular.isUndefined(data.associated_party_id) ? '' : parseInt(data.associated_party_id);
                    moreInfo.party_role = angular.isUndefined(data.party_role) ? 0 : data.party_role;
                    moreInfo.matter_id = utils.isNotEmptyVal(self.matterId) ? parseInt(self.matterId) : parseInt(self.docModel.matterid);
                    if (isDateRangeValid === false) { return false; } else { break; }
                    break;
                case 'insurance':
                    documentAddHelper.setMoreInfoForInsurance(moreInfo, data.newInsauranceInfo);
                    moreInfo.associated_party_id = angular.isUndefined(data.associated_party_id) ? '' : parseInt(data.associated_party_id);
                    moreInfo.party_role = angular.isUndefined(data.party_role) ? '' : data.party_role;
                    moreInfo.matter_id = utils.isNotEmptyVal(self.matterId) ? parseInt(self.matterId) : parseInt(self.docModel.matterid);
                    break;
                case 'expense':
                    var expenseinfoforsave = angular.copy(data.newExpenseInfo);
                    documentAddHelper.setMoreInfoForExpense(moreInfo, expenseinfoforsave);
                    moreInfo.associated_party.associated_party_id = angular.isUndefined(data.associated_party_id) ? '' : parseInt(data.associated_party_id);
                    moreInfo.associated_party.associated_party_role = angular.isUndefined(data.party_role) ? '' : data.party_role;
                    break;
                case 'medicalrecord':
                    var isMedicalDateRangeValid = documentAddHelper.setMoreInfoForMedicalInfo(moreInfo, data.newMedicalInfo);
                    moreInfo.matter_id = utils.isNotEmptyVal(self.matterId) ? parseInt(self.matterId) : parseInt(self.docModel.matterid);
                    moreInfo.associated_party_id = angular.isUndefined(data.associated_party_id) ? '' : parseInt(data.associated_party_id);
                    moreInfo.party_role = angular.isUndefined(data.party_role) ? 0 : data.party_role;
                    if (isMedicalDateRangeValid === false) { return false; } else { break; }
                    break;
                default:
                    if (document.getElementById(data.moreInfoSelect)) {
                        var formElementslength = document.getElementById(data.moreInfoSelect).elements.length;
                        if (formElementslength > 0) {
                            var formElements = document.getElementById(data.moreInfoSelect).elements;
                            $.each(formElements, function (datavalue, datakey) {
                                var value = $(datakey).val();
                                var ctype = $(datakey).attr("ctype");
                                var eleName = $(datakey).attr("name");

                                var obj = { "name": eleName, "ctype": ctype, "value": value };

                                moreInfo[eleName] = obj;
                            });
                        }
                    }
            }
            //moreInfo.plaintiffid = angular.isUndefined(data.plaintiffId) ? '' : data.plaintiffId;
        }

        self.addNewContactforDocumentMotionMultiUpload = addNewContactforDocumentMotionMultiUpload;
        function addNewContactforDocumentMotionMultiUpload(index, type) {
            var selectedType = {};
            selectedType.type = type;

            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (savedContact) {
                contactFactory.setDataPropForContactsFromOffDrupalToNormalContact([savedContact]);
                self.multiFilesdata[index].documentMotionDetailInfo.contact = savedContact;
                self.multiFilesdata[index].documentMotionDetailInfo.contact.email_ids = documentAddHelper.getStringFromArray(self.multiFilesdata[index].documentMotionDetailInfo.contact.email_ids);
                self.multiFilesdata[index].documentMotionDetailInfo.contact.phone = documentAddHelper.getStringFromArray(self.multiFilesdata[index].documentMotionDetailInfo.contact.phone);
            });
        }

        self.calExpenseBillMultiUpload = calExpenseBillMultiUpload;
        function calExpenseBillMultiUpload(payment_mode, data) {
            //check the previously set is edited value, in edit mode we ignore the first change in model value

            switch (payment_mode) {
                case 1:// paid
                case 2:// Unpaid
                case 3:// Partial

                    data.newExpenseInfo.paid_amount = utils.isEmptyVal(data.newExpenseInfo.paid_amount) ?
                        null : data.newExpenseInfo.paid_amount;
                    data.newExpenseInfo.outstandingamount = utils.isEmptyVal(data.newExpenseInfo.outstandingamount) ?
                        null : data.newExpenseInfo.outstandingamount;
                    data.newExpenseInfo.paid_amount = utils.isEmptyVal(data.newExpenseInfo.paid_amount) ?
                        null : data.newExpenseInfo.paid_amount;
                    changeExpenseValues(data.newExpenseInfo);

                    break;
            }
        }

        self.calMedicalBillMultiUpload = calMedicalBillMultiUpload;
        function calMedicalBillMultiUpload(paymentmode, data) {
            data.newMedicalBillInfo.paid_amount = utils.isEmptyVal(data.newMedicalBillInfo.paid_amount) ?
                null : data.newMedicalBillInfo.paid_amount;
            data.newMedicalBillInfo.bill_amount = utils.isEmptyVal(data.newMedicalBillInfo.bill_amount) ?
                null : data.newMedicalBillInfo.bill_amount;
            data.newMedicalBillInfo.outstandingamount = utils.isEmptyVal(data.newMedicalBillInfo.outstandingamount) ?
                null : data.newMedicalBillInfo.outstandingamount;

            documentAddHelper.changeValues(data.newMedicalBillInfo);
        }

        self.needReviewMultiUpload = needReviewMultiUpload;
        function needReviewMultiUpload(data, index) {
            data.showNeedReview = data.needs_review;
            data.reviewUser = "";   // reset value of review asign user
        }

        self.openDatePickerMultiUpload = openDatePickerMultiUpload;
        function openDatePickerMultiUpload(data, $event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            data[isOpened] = true; //isOpened is a string specifying the model name
        }

        self.setTypeMotionForMultiupload = setTypeMotionForMultiupload;
        function setTypeMotionForMultiupload(model, index) {
            self.multiFilesdata[index].documentMotionDetailInfo.is_global = (model.contact_type == 'Local') ? 0 : 1;
        }

        self.setTypeMedicalBillsForMultiupload = setTypeMedicalBillsForMultiupload;
        function setTypeMedicalBillsForMultiupload(model, index) {
            self.multiFilesdata[index].newMedicalBillInfo.is_global = (model.contact_type == 'Local') ? 0 : 1;
        }

        self.setTypeForMultiupload = setTypeForMultiupload;
        function setTypeForMultiupload(model, type, index) {
            switch (type) {
                case "insuprovider":
                    self.multiFilesdata[index].newLiensInfo.insu_provider_is_global = (model.contact_type == 'Local') ? 0 : 1;
                    break;
                case "linholder":
                    self.multiFilesdata[index].newLiensInfo.lien_holder_is_global = (model.contact_type == 'Local') ? 0 : 1;
                    break;
                case "adjuster":
                    self.multiFilesdata[index].newLiensInfo.lien_adjuster_is_global = (model.contact_type == 'Local') ? 0 : 1;
                    break;
            }
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

        function setMoreInformationType(catId) {
            if (utils.isEmptyVal(catId)) {
                return;
            }

            var category = _.find(self.documentCategories, function (cat) { return cat.doc_category_id === catId });
            switch (category.doc_category_name) {
                case "Medical Records":
                    self.moreInfoSelect = 'medicalrecord';
                    self.dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'medicalrecord';
                    });
                    self.dynamicSelect.unshift({ 'keytext': "", 'valuetext': "" }); // add blank value at top in array for extra option...
                    setMoreInfoType('medicalrecord');
                    break;
                case "Medical Bills":
                    self.moreInfoSelect = 'medicalbill';
                    self.dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'medicalbill';
                    });
                    self.dynamicSelect.unshift({ 'keytext': "", 'valuetext': "" }); // add blank value at top in array for extra option...
                    setMoreInfoType('medicalbill');
                    break;
                //Insurance is now seperate category accordingly more info is set
                case "Insurance":
                    self.moreInfoSelect = 'insurance';

                    self.dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'insurance';
                    });
                    self.dynamicSelect.unshift({ 'keytext': "", 'valuetext': "" }); // add blank value at top in array for extra option...
                    setMoreInfoType('insurance');
                    break;
                case "Expenses":
                    self.moreInfoSelect = 'expense';

                    self.dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'expense';
                    });
                    self.dynamicSelect.unshift({ 'keytext': "", 'valuetext': "" }); // add blank value at top in array for extra option...
                    setMoreInfoType('expense');
                    break;
                case "Motions":
                    self.moreInfoSelect = 'motion';
                    self.dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'motion';
                    });
                    self.dynamicSelect.unshift({ 'keytext': "", 'valuetext': "" }); // add blank value at top in array for extra option...
                    setMoreInfoType('motion');
                    break;
                //Liens has been added as seperate category accordingly more info is set
                case "Liens":
                    self.moreInfoSelect = 'liens';

                    self.dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'liens';
                    });
                    self.dynamicSelect.unshift({ 'keytext': "", 'valuetext': "" }); // add blank value at top in array for extra option...
                    setMoreInfoType('liens');
                    break;
                default:
                    self.moreInfoSelect = '';
                    self.dynamicSelect = [];
            }
        }

        /*Remove the going to upload document */
        function removeUploadingDocument(cancel) {
            if (cancel == 1) {
                if (self.isGlobal)
                    $state.go('documents');
                else
                    $state.go('matter-documents', { matterId: matterId });
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
                    $state.go('documents');
                else
                    $state.go('matter-documents', { matterId: matterId });
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
                    //Bug#9810 - File Selection dialog box is not getting open.
                    // self.dropzoneObj.destroy();
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
                if (datavalue.categoryid == '' || datavalue.error != '') {
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
                return matterFactory.searchMatters(matterName).then(
                    function (response) {
                        matters = response.data;
                        return response.data;
                    }, function (error) {
                        notificationService.error('Matters not loaded');
                    });
            }
        }

        /* Formate the matter id and name in case of global documents*/
        function formatTypeaheadDisplay(matterid, index) {
            if (self.isGlobal) {
                self.matterId = 0;
                matterId = 0;
            }
            if (angular.isUndefined(matterid) || utils.isEmptyString(matterid) || matters.length === 0) {
                return undefined;
            }
            var matterInfo = _.find(matters, function (matter) {

                if (self.singlefileUpload == true) {
                    self.matterId = matterid;
                    matterId = matterid;
                    self.docModel.matterid = matterid;
                    self.docModel.associated_party_id = '';
                    getPlaintiffsForDocument(matterid);
                    if (self.isGlobal && self.singlefileUpload == true) {
                        if (self.singleFileName != '')
                            toggleButtons(true);

                    }
                } else if (self.multifileUpload == true) {
                    self.multiFilesdata[index].matterId = matterid;
                    self.multiFilesdata[index].plaintiffId = '';
                    if (matterid != 0) {
                        getPlaintiffsForDocument(matterid, index);
                    }
                } else if ($state.current.name == "create-online") {
                    self.docModel.associated_party_id = '';
                    self.docModel.docPlaintiff = '';
                    getPlaintiffsForDocument(matterid, index);
                }
                return matter.matterid === matterid;
            });
            return matterInfo ? matterInfo.name : "";
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

        function calExpenseBill(payment_mode) {
            //check the previously set is edited value, in edit mode we ignore the first change in model value

            switch (payment_mode) {
                case 1:// paid
                case 2:// Unpaid
                case 3:// Partial

                    self.newExpenseInfo.paid_amount = utils.isEmptyVal(self.newExpenseInfo.paid_amount) ? null : self.newExpenseInfo.paid_amount;
                    self.newExpenseInfo.outstandingamount = utils.isEmptyVal(self.newExpenseInfo.outstandingamount) ? null : self.newExpenseInfo.outstandingamount;
                    changeExpenseValues(self.newExpenseInfo);

                    break;
            }
        }

        // Calculate/set values based on payment mode for Bill amount, tatal amount and outstanding amount.
        function changeExpenseValues(objectInfo) {
            switch (objectInfo.payment_mode) {
                case 1:// paid
                    objectInfo.paid_amount = objectInfo.expense_amount;
                    objectInfo.outstandingamount = utils.isNotEmptyVal(objectInfo.expense_amount) ? 0 : null;
                    break;
                case 2: // Unpaid
                    objectInfo.outstandingamount = objectInfo.expense_amount;
                    objectInfo.paid_amount = utils.isNotEmptyVal(objectInfo.expense_amount) ? 0 : null; // 
                    break;
                case 3:// Partial
                    if (utils.isNotEmptyVal(objectInfo.paid_amount) && utils.isNotEmptyVal(objectInfo.expense_amount)) {
                        // objectInfo.outstandingamount = (parseFloat(objectInfo.expense_amount) - parseFloat(objectInfo.paidamount)).toFixed(2);
                        objectInfo.outstandingamount = Math.round((parseFloat(objectInfo.expense_amount) - parseFloat(objectInfo.paid_amount)) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000

                    }
                    else {
                        if (utils.isNotEmptyVal(objectInfo.expense_amount)) {
                            objectInfo.outstandingamount = objectInfo.expense_amount;
                        }
                        else {
                            objectInfo.outstandingamount = utils.isNotEmptyVal(objectInfo.paid_amount) ? -objectInfo.paid_amount : null;
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

        function selectedMotion() {
            if (self.moreInfoSelect == "motion") {
                //                if (angular.isDefined(self.documentMotionDetailInfo) && angular.isUndefined(self.documentMotionDetailInfo.dateOfService) && (self.documentMotionDetailInfo.dateOfService == '' || self.documentMotionDetailInfo.dateOfService == null)) {
                //                    displayDateOfService();
                //                }
                self.documentMotionDetailInfo.dateOfService = '';
                self.documentMotionDetailInfo.returnableDate = '';


                self.motionToBeSelected = [{ "value": "motionByUs", "label": "Motion By Us" }, { "value": "motionOnUs", "label": "Motion On Us" }];
                if (self.documentMotionDetailInfo.motion_on_by == '' || self.documentMotionDetailInfo.motion_on_by == null || angular.isUndefined(self.documentMotionDetailInfo.motion_on_by)) {
                    self.documentMotionDetailInfo.motion_on_by = "motionByUs";
                }

                var mstData = angular.copy(masterData.getMasterData());
                if (angular.isDefined(mstData) && angular.isDefined(mstData.motion_statuses)) {
                    self.motionStatus = mstData.motion_statuses;
                    if (self.documentMotionDetailInfo.motion_status == '' || self.documentMotionDetailInfo.motion_status == null || angular.isUndefined(self.documentMotionDetailInfo.motion_status)) {
                        self.documentMotionDetailInfo.motion_status = "";
                    }

                }

                if (angular.isDefined(mstData) && angular.isDefined(mstData.motion_types)) {
                    self.motionType = mstData.motion_types;
                    if (self.documentMotionDetailInfo.motion_type == '' || self.documentMotionDetailInfo.motion_type == null || angular.isUndefined(self.documentMotionDetailInfo.motion_type)) {
                        self.documentMotionDetailInfo.motion_type = ""
                    }

                }
                //                  if (self.documentMotionDetailInfo.returnableDate == '' && self.documentMotionDetailInfo.returnableDate == null) {
                ////                    self.documentMotionDetailInfo.returnableDate = '';
                //                }
            }

        }
        // added code for document motion end

        // US:4810 get all user list start

        // change event for need review flag button
        function needReview() {
            self.showNeedReview = self.docModel.needs_review;
            self.reviewUser = "";   // reset value of review asign user
        }

        // get all users list
        function getUsers() {

            taskAgeDatalayer.getUsersInFirm()
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
    angular.module('cloudlex.documents')
        .factory('documentAddHelper', documentAddHelper);
    documentAddHelper.$inject = ["notification-service"];

    function documentAddHelper(notificationService) {
        return {
            paymentBtns: paymentBtns,
            dynamicFormOptions: dynamicFormOptions,
            setMoreInfoForLiens: setMoreInfoForLiens,
            setMoreInfoForMedicalBill: setMoreInfoForMedicalBill,
            setMoreInfoForInsurance: setMoreInfoForInsurance,
            setMoreInfoForMedicalInfo: setMoreInfoForMedicalInfo,
            setMoreInfoForExpense: setMoreInfoForExpense,
            getStringFromArray: getStringFromArray,
            changeValues: changeValues,
            changeAdjustment: changeAdjustment
        };

        function paymentBtns() {
            return [{ label: "Paid", value: 1 }, { label: "Unpaid", value: 2 }, { label: "Partial", value: 3 }];
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

        // Calculate/set values based on payment mode for Bill amount, total/bill amount and outstanding amount.
        function changeValues(objectInfo, data) {

            if (utils.isEmptyVal(objectInfo.bill_amount)) {
                objectInfo.adjustment_amount = "";
                objectInfo.adjusted_amount = "";
            }

            if (data == 'adjusted' && utils.isNotEmptyVal(objectInfo.bill_amount) && utils.isNotEmptyVal(objectInfo.adjusted_amount)) {
                objectInfo.adjustment_amount = null;
                objectInfo.adjustment_amount = Math.round((parseFloat(angular.copy(objectInfo.bill_amount)) - parseFloat(angular.copy(objectInfo.adjusted_amount))) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000

            }

            if (data == 'adjustment' && utils.isNotEmptyVal(objectInfo.bill_amount) && utils.isNotEmptyVal(objectInfo.adjustment_amount)) {
                objectInfo.adjusted_amount = null;
                objectInfo.adjusted_amount = Math.round((parseFloat(angular.copy(objectInfo.bill_amount)) - parseFloat(angular.copy(objectInfo.adjustment_amount))) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000

            }
            if (!data && utils.isNotEmptyVal(objectInfo.bill_amount) && utils.isNotEmptyVal(objectInfo.adjusted_amount)) {
                objectInfo.adjustment_amount = null;
                objectInfo.adjustment_amount = Math.round((parseFloat(angular.copy(objectInfo.bill_amount)) - parseFloat(angular.copy(objectInfo.adjusted_amount))) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000

            }

            if (data == 'adjusted' && utils.isEmptyVal(objectInfo.adjusted_amount)) {
                objectInfo.adjustment_amount = null;
            }

            if (data == 'adjustment' && utils.isEmptyVal(objectInfo.adjustment_amount)) {
                objectInfo.adjusted_amount = null;
            }

            switch (objectInfo.payment_mode) {
                case 1:// paid
                    objectInfo.paid_amount = utils.isNotEmptyVal(objectInfo.adjusted_amount) ? objectInfo.adjusted_amount : objectInfo.bill_amount;
                    objectInfo.outstanding_amount = 0;
                    break;
                case 2: // Unpaid
                    objectInfo.outstanding_amount = utils.isNotEmptyVal(objectInfo.adjusted_amount) ? objectInfo.adjusted_amount : objectInfo.bill_amount;
                    objectInfo.paid_amount = 0; // 
                    break;
                case 3:// Partial
                    if (utils.isNotEmptyVal(objectInfo.adjusted_amount)) {
                        if (utils.isNotEmptyVal(objectInfo.paid_amount) && utils.isNotEmptyVal(objectInfo.adjusted_amount)) {
                            // objectInfo.outstandingamount = (parseFloat(objectInfo.adjustedamount) - parseFloat(objectInfo.paidamount)).toFixed(2);
                            objectInfo.outstanding_amount = Math.round((parseFloat(objectInfo.adjusted_amount) - parseFloat(objectInfo.paid_amount)) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000
                        } else {
                            if (utils.isNotEmptyVal(objectInfo.adjusted_amount)) {
                                objectInfo.outstanding_amount = objectInfo.adjusted_amount;
                            } else {
                                objectInfo.outstanding_amount = (utils.isNotEmptyVal(objectInfo.paid_amount)) ? 0 : null;
                            }
                        }
                    } else {
                        if (utils.isNotEmptyVal(objectInfo.paid_amount) && utils.isNotEmptyVal(objectInfo.bill_amount)) {
                            //objectInfo.outstandingamount = (parseFloat(objectInfo.totalamount) - parseFloat(objectInfo.paidamount)).toFixed(2);
                            objectInfo.outstanding_amount = Math.round((parseFloat(objectInfo.bill_amount) - parseFloat(objectInfo.paid_amount)) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000
                        }
                        else {
                            if (utils.isNotEmptyVal(objectInfo.bill_amount)) {
                                objectInfo.outstanding_amount = objectInfo.bill_amount;
                            } else {
                                objectInfo.outstanding_amount = (utils.isNotEmptyVal(objectInfo.paid_amount)) ? 0 : null;
                            }
                        }
                    }
                    break;
            }



            if (utils.isEmptyVal(objectInfo.bill_amount)) {
                if (data == 'adjusted') {
                    return true;
                } else {
                    return false;
                }

            }
            return false;

        }

        function changeAdjustment(objectInfo, data) {



            if (utils.isEmptyVal(objectInfo.adjustment_amount)) {
                objectInfo.adjusted_amount = null;
            }
            if (utils.isEmptyVal(objectInfo.bill_amount)) {
                objectInfo.adjustment_amount = "";
                objectInfo.adjusted_amount = "";
            }


            if (utils.isNotEmptyVal(objectInfo.bill_amount) && utils.isNotEmptyVal(objectInfo.adjustment_amount)) {
                objectInfo.adjusted_amount = Math.round((parseFloat(angular.copy(objectInfo.bill_amount)) - parseFloat(angular.copy(objectInfo.adjustment_amount))) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000
            }
            if (objectInfo.payment_mode == 3) {
                if (utils.isNotEmptyVal(objectInfo.adjusted_amount)) {
                    if (utils.isNotEmptyVal(objectInfo.paid_amount) && utils.isNotEmptyVal(objectInfo.adjusted_amount)) {
                        objectInfo.outstanding_amount = Math.round((parseFloat(objectInfo.adjusted_amount) - parseFloat(objectInfo.paid_amount)) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000
                    } else {
                        if (utils.isNotEmptyVal(objectInfo.adjusted_amount)) {
                            objectInfo.outstanding_amount = objectInfo.adjusted_amount;
                        } else {
                            objectInfo.outstanding_amount = (utils.isNotEmptyVal(objectInfo.paid_amount)) ? 0 : null;
                        }
                    }
                } else {
                    if (utils.isNotEmptyVal(objectInfo.paid_amount) && utils.isNotEmptyVal(objectInfo.bill_amount)) {
                        objectInfo.outstanding_amount = Math.round((parseFloat(objectInfo.bill_amount) - parseFloat(objectInfo.paid_amount)) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000
                    } else {
                        if (utils.isNotEmptyVal(objectInfo.bill_amount)) {
                            objectInfo.outstanding_amount = objectInfo.bill_amount;
                        } else {
                            objectInfo.outstanding_amount = (utils.isNotEmptyVal(objectInfo.paid_amount)) ? 0 : null;
                        }
                    }
                }
            }
            if (objectInfo.payment_mode == 2) {
                objectInfo.outstanding_amount = utils.isNotEmptyVal(objectInfo.adjusted_amount) ? objectInfo.adjusted_amount : objectInfo.bill_amount;
                objectInfo.paid_amount = 0;
            }
            if (objectInfo.payment_mode == 1) {
                objectInfo.paid_amount = utils.isNotEmptyVal(objectInfo.adjusted_amount) ? objectInfo.adjusted_amount : objectInfo.bill_amount;
                objectInfo.outstanding_amount = 0;
            }

            if (utils.isEmptyVal(objectInfo.bill_amount)) {
                if (data == 'adjustment') {
                    return true;
                } else {
                    return false;
                }

            }
            return false;
        }


        function setMoreInfoForLiens(moreInfo, newLiensInfoObj) {
            /*if more info is not present set moreinfo object to empty object*/
            var liensInfoForSave = {};
            newLiensInfoObj = angular.isDefined(newLiensInfoObj) ? newLiensInfoObj : {};
            var newLienInfo = angular.copy(newLiensInfoObj);
            angular.extend(liensInfoForSave, newLienInfo);
            moreInfo.date_paid = liensInfoForSave.date_paid instanceof Date ? moment((liensInfoForSave.date_paid.getMonth() + 1) + '/' + (liensInfoForSave.date_paid.getDate()) + '/' + (liensInfoForSave.date_paid.getFullYear()))
                .format("MM/DD/YYYY") : liensInfoForSave.date_paid;
            moreInfo.date_of_claim = liensInfoForSave.date_of_claim instanceof Date ? moment((liensInfoForSave.date_of_claim.getMonth() + 1) + '/' + (liensInfoForSave.date_of_claim.getDate()) + '/' + (liensInfoForSave.date_of_claim.getFullYear()))
                .format("MM/DD/YYYY") : liensInfoForSave.date_of_claim;

            moreInfo.is_global_lien_holder = utils.isNotEmptyVal(liensInfoForSave.lien_holder) ? liensInfoForSave.lien_holder.contact_type == "Global" ? 1 : 0 : 0;
            moreInfo.is_global_insurance_provider = utils.isNotEmptyVal(liensInfoForSave.insurance_provider) ? liensInfoForSave.insurance_provider.contact_type == "Global" ? 1 : 0 : 0;
            moreInfo.is_golbal_lien_adjuster = utils.isNotEmptyVal(liensInfoForSave.lien_adjuster) ? liensInfoForSave.lien_adjuster.contact_type == "Global" ? 1 : 0 : 0;
            moreInfo.claim_number = utils.isNotEmptyVal(liensInfoForSave.claim_number) ? liensInfoForSave.claim_number : null;
            moreInfo.lien_holder_id = utils.isNotEmptyVal(liensInfoForSave.lien_holder) ? liensInfoForSave.lien_holder.contact_id : '';
            moreInfo.lien_adjuster_id = utils.isNotEmptyVal(liensInfoForSave.lien_adjuster) ? liensInfoForSave.lien_adjuster.contact_id : '';
            moreInfo.insurance_provider_Id = utils.isNotEmptyVal(liensInfoForSave.insurance_provider) ? liensInfoForSave.insurance_provider.contact_id : '';
            moreInfo.lien_amount = utils.isNotEmptyVal(liensInfoForSave.lien_amount) ? liensInfoForSave.lien_amount : null;
            moreInfo.due_amount = utils.isNotEmptyVal(liensInfoForSave.due_amount) ? liensInfoForSave.due_amount : null;
            moreInfo.memo = utils.isNotEmptyVal(liensInfoForSave.memo) ? liensInfoForSave.memo : null;

            var amount = parseFloat(moreInfo.lien_amount);
            var dueamount = parseFloat(moreInfo.due_amount);

            //US#16912 Removing logic in "Amount Due" when adding a lien
            /* if (utils.isNotEmptyVal(amount) && utils.isNotEmptyVal(dueamount)) {
                if (amount < dueamount) {
                    notificationService.error('Due Amount Should be less than Amount');
                    return false;
                }
            } */

            moreInfo.date_paid = (utils.isEmptyVal(moreInfo.date_paid)) ? "" : utils.getUTCTimeStamp(moreInfo.date_paid);
            moreInfo.date_of_claim = (utils.isEmptyVal(moreInfo.date_of_claim)) ? "" : utils.getUTCTimeStamp(moreInfo.date_of_claim);
        }

        function setMoreInfoForMedicalBill(moreInfo, newMedicalBillInfoObj) {
            var newMedicalBillInfo = angular.copy(newMedicalBillInfoObj);

            moreInfo.service_start_date = newMedicalBillInfo.service_start_date instanceof Date ? moment((newMedicalBillInfo.service_start_date.getMonth() + 1) + '/' + (newMedicalBillInfo.service_start_date.getDate()) + '/' + (newMedicalBillInfo.service_start_date.getFullYear()))
                .format('MM/DD/YYYY')
                : newMedicalBillInfo.service_start_date;

            moreInfo.service_end_date = newMedicalBillInfo.service_end_date instanceof Date ? moment((newMedicalBillInfo.service_end_date.getMonth() + 1) + '/' + (newMedicalBillInfo.service_end_date.getDate()) + '/' + (newMedicalBillInfo.service_end_date.getFullYear()))
                .format('MM/DD/YYYY')
                : newMedicalBillInfo.service_end_date;

            var startdate = moreInfo.service_start_date;
            var enddate = moreInfo.service_end_date;
            //US#8174 make end date of service non mandatory
            // if ((utils.isNotEmptyVal(startdate) && utils.isEmptyVal(enddate)) || (utils.isNotEmptyVal(enddate) && utils.isEmptyVal(startdate))) {
            //     notificationService.error('Invalid date range.');
            //     return false;
            // }
            if (utils.isNotEmptyVal(startdate) && utils.isNotEmptyVal(enddate)) {
                var start = moment(startdate, "MM/DD/YYYY");
                var end = moment(enddate, "MM/DD/YYYY");
                if (end.isBefore(start)) {
                    notificationService.error('Invalid date range.');
                    return false;
                }
            }

            moreInfo.service_start_date = (utils.isEmptyVal(moreInfo.service_start_date)) ? "" : utils.getUTCTimeStamp(moreInfo.service_start_date);
            moreInfo.service_end_date = (utils.isEmptyVal(moreInfo.service_end_date)) ? "" : utils.getUTCTimeStamp(moreInfo.service_end_date);
            moreInfo.medical_provider_id = newMedicalBillInfo.medical_provider ? newMedicalBillInfo.medical_provider.contact_id : "";
            moreInfo.payment_mode = utils.isNotEmptyVal(newMedicalBillInfo.payment_mode) ? newMedicalBillInfo.payment_mode : "";
            moreInfo.paid_amount = utils.isNotEmptyVal(newMedicalBillInfo.paid_amount) ? parseFloat(newMedicalBillInfo.paid_amount) : "";
            moreInfo.outstanding_amount = utils.isNotEmptyVal(newMedicalBillInfo.outstanding_amount) ? parseFloat(newMedicalBillInfo.outstanding_amount) : "";
            moreInfo.adjusted_amount = utils.isNotEmptyVal(newMedicalBillInfo.adjusted_amount) ? parseFloat(newMedicalBillInfo.adjusted_amount) : "";
            moreInfo.bill_amount = utils.isNotEmptyVal(newMedicalBillInfo.bill_amount) ? parseFloat(newMedicalBillInfo.bill_amount) : "";
            moreInfo.is_provider_global = (newMedicalBillInfo.is_global == 1) ? 1 : 0;
            moreInfo.memo = utils.isNotEmptyVal(newMedicalBillInfo.memo) ? newMedicalBillInfo.memo : "";
        }

        function setMoreInfoForInsurance(moreInfo, newInsauranceInfoObj) {
            /*if moreinfo is not present set moreinfo object to empty object*/
            newInsauranceInfoObj = angular.isDefined(newInsauranceInfoObj) ? newInsauranceInfoObj : {};
            var insuranceInfoCopy = angular.copy(newInsauranceInfoObj);
            var insuInfoForSave = {};
            insuInfoForSave.insured_party_id = utils.isNotEmptyVal(insuranceInfoCopy.insured_party) ? insuranceInfoCopy.insured_party.contact_id : null;
            insuInfoForSave.insurance_provider_id = utils.isNotEmptyVal(insuranceInfoCopy.insurance_provider) ? insuranceInfoCopy.insurance_provider.contact_id : null;
            insuInfoForSave.insurance_adjuster_id = utils.isNotEmptyVal(insuranceInfoCopy.insurance_adjuster) ? insuranceInfoCopy.insurance_adjuster.contact_id : null;
            insuInfoForSave.policy_exhausted = utils.isNotEmptyVal(insuranceInfoCopy.policy_exhausted) ? insuranceInfoCopy.policy_exhausted : '';
            insuInfoForSave.excess_confirmed = utils.isNotEmptyVal(insuranceInfoCopy.excess_confirmed) ? insuranceInfoCopy.excess_confirmed : '';
            insuInfoForSave.policy_number = utils.isNotEmptyVal(insuranceInfoCopy.policy_number) ? insuranceInfoCopy.policy_number : null;
            insuInfoForSave.policy_limit_max = utils.isNotEmptyVal(insuranceInfoCopy.policy_limit_max) ? insuranceInfoCopy.policy_limit_max : null;
            insuInfoForSave.policy_limit = utils.isNotEmptyVal(insuranceInfoCopy.policy_limit) ? insuranceInfoCopy.policy_limit : null;
            insuInfoForSave.memo = utils.isNotEmptyVal(insuranceInfoCopy.memo) ? insuranceInfoCopy.memo : null;
            insuInfoForSave.insurance_type = utils.isNotEmptyVal(insuranceInfoCopy.insurance_type) ? insuranceInfoCopy.insurance_type : null;
            insuInfoForSave.claim_number = utils.isNotEmptyVal(insuranceInfoCopy.claim_number) ? insuranceInfoCopy.claim_number : null;
            angular.extend(moreInfo, insuInfoForSave);
        }


        function setMoreInfoForExpense(moreInfo, newExpenseInfoObj) {
            var expenseinfoforsave = angular.copy(newExpenseInfoObj);
            expenseinfoforsave.expense_type = { expense_type_id: '' };
            expenseinfoforsave.associated_party = { associated_party_id: '', associated_party_role: '' };

            expenseinfoforsave.payment_mode = utils.isNotEmptyVal(expenseinfoforsave.payment_mode) ? expenseinfoforsave.payment_mode : 2;
            expenseinfoforsave.expense_type.expense_type_id = utils.isNotEmptyVal(newExpenseInfoObj.expense_type) ? newExpenseInfoObj.expense_type.expense_type_id : '';
            expenseinfoforsave.expense_name = utils.isNotEmptyVal(expenseinfoforsave.expense_name) ? expenseinfoforsave.expense_name : '';
            expenseinfoforsave.disbursable = utils.isNotEmptyVal(expenseinfoforsave.disbursable) ? expenseinfoforsave.disbursable : '';
            expenseinfoforsave.bank_account = utils.isNotEmptyVal(expenseinfoforsave.bank_account) ? expenseinfoforsave.bank_account : '';
            expenseinfoforsave.cheque_no = utils.isNotEmptyVal(expenseinfoforsave.cheque_no) ? expenseinfoforsave.cheque_no : '';
            expenseinfoforsave.incurred_date = utils.isNotEmptyVal(expenseinfoforsave.incurred_date) ? utils.getUTCTimeStamp(expenseinfoforsave.incurred_date) : ''; //moment(expenseinfoforsave.incurreddate).unix()
            expenseinfoforsave.expense_amount = utils.isNotEmptyVal(expenseinfoforsave.expense_amount) ? parseFloat(expenseinfoforsave.expense_amount) : null;
            expenseinfoforsave.paid_amount = utils.isNotEmptyVal(expenseinfoforsave.paid_amount) ? parseFloat(expenseinfoforsave.paid_amount) : null;
            expenseinfoforsave.outstandingamount = utils.isNotEmptyVal(expenseinfoforsave.outstandingamount) ? expenseinfoforsave.outstandingamount : null;
            expenseinfoforsave.memo = utils.isNotEmptyVal(expenseinfoforsave.memo) ? expenseinfoforsave.memo : null;
            angular.extend(moreInfo, expenseinfoforsave);
        }

        function setMoreInfoForMedicalInfo(moreInfo, newMedicalInfoObj) {
            var newMedicalInfo = angular.copy(newMedicalInfoObj);
            var newMedicalInfoCopy = {};
            //convert moment string date format to date object
            moreInfo.service_start_date = newMedicalInfo.service_start_date instanceof Date ? moment((newMedicalInfo.service_start_date.getMonth() + 1) + '/' + (newMedicalInfo.service_start_date.getDate()) + '/' + (newMedicalInfo.service_start_date.getFullYear()))
                .format('MM/DD/YYYY')
                : newMedicalInfo.service_start_date;

            moreInfo.service_end_date = newMedicalInfo.service_end_date instanceof Date ? moment((newMedicalInfo.service_end_date.getMonth() + 1) + '/' + (newMedicalInfo.service_end_date.getDate()) + '/' + (newMedicalInfo.service_end_date.getFullYear()))
                .format('MM/DD/YYYY')
                : newMedicalInfo.service_end_date;

            moreInfo.date_requested = newMedicalInfo.date_requested instanceof Date ? moment((newMedicalInfo.date_requested.getMonth() + 1) + '/' + (newMedicalInfo.date_requested.getDate()) + '/' + (newMedicalInfo.date_requested.getFullYear()))
                .format('MM/DD/YYYY')
                : newMedicalInfo.date_requested;

            var startdate = moreInfo.service_start_date;
            var enddate = moreInfo.service_end_date;
            //US#8174 make end date of service non mandatory
            // if ((utils.isNotEmptyVal(startdate) && utils.isEmptyVal(enddate)) || (utils.isNotEmptyVal(enddate) && utils.isEmptyVal(startdate))) {
            //     notificationService.error('Invalid date range.');
            //     return false;
            // }
            if (utils.isNotEmptyVal(startdate) && utils.isNotEmptyVal(enddate)) {
                var start = moment(startdate, "MM/DD/YYYY");
                var end = moment(enddate, "MM/DD/YYYY");
                if (end.isBefore(start)) {
                    notificationService.error('Invalid date range.');
                    return false;
                }
            }

            // newMedicalInfoCopy.service_start_date = (utils.isEmptyVal(newMedicalInfo.service_start_date)) ? "" : utils.getUTCTimeStamp(newMedicalInfo.service_start_date);
            // newMedicalInfoCopy.service_end_date = (utils.isEmptyVal(newMedicalInfo.service_start_date)) ? "" : utils.getUTCTimeStamp(newMedicalInfo.service_start_date);
            newMedicalInfoCopy.service_start_date = (utils.isEmptyVal(moreInfo.service_start_date)) ? "" : utils.getUTCTimeStamp(moreInfo.service_start_date);
            newMedicalInfoCopy.service_end_date = (utils.isEmptyVal(moreInfo.service_end_date)) ? "" : utils.getUTCTimeStamp(moreInfo.service_end_date);
            newMedicalInfoCopy.date_requested = (utils.isEmptyVal(moreInfo.date_requested)) ? "" : utils.getUTCTimeStamp(moreInfo.date_requested);
            newMedicalInfoCopy.memo = newMedicalInfo.memo;
            newMedicalInfoCopy.treatment_type = newMedicalInfo.treatment_type ? newMedicalInfo.treatment_type : "";
            newMedicalInfoCopy.physician_id = newMedicalInfo.physician ? newMedicalInfo.physician.contact_id : "";
            newMedicalInfoCopy.medical_provider_id = newMedicalInfo.medical_provider ? newMedicalInfo.medical_provider.contact_id : ""; //newMedicalInfo.providerid.contactid;
            angular.extend(moreInfo, newMedicalInfoCopy);
        }

    }
})();


//if (serviceStartDate != '' && serviceStartDate != 0 && serviceStartDate != null
//    && serviceEndDate != '' && serviceEndDate != 0 && serviceEndDate != null) {
//    if (dosStartOfTheDay > rdStartOfTheDay) {
//        notificationService.error('Start date of service cannot be less than end date of service');
//    }

//}
