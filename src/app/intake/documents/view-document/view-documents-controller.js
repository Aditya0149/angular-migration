/* Document Upload module controller. 
 * */
(function () {

    'use strict';

    angular
        .module('intake.documents')
        .controller('IntakeViewDocumentsCtrl', IntakeViewDocumentsCtrl);

    IntakeViewDocumentsCtrl.$inject = ['$rootScope', '$scope', '$q', 'inatkeDocumentsDataService', '$stateParams',
        'notification-service', '$state', 'intakeDocumentsConstants', 'globalConstants', 'usSpinnerService',
        'intakeFactory', 'IntakePlaintiffDataService', 'routeManager', 'intakeDocumentAddHelper', 'masterData',
        'intakeTaskAgeDatalayer', 'contactFactory'
    ];

    function IntakeViewDocumentsCtrl($rootScope, $scope, $q, inatkeDocumentsDataService, $stateParams,
        notificationService, $state, intakeDocumentsConstants, globalConstants, usSpinnerService,
        intakeFactory, IntakePlaintiffDataService, routeManager, intakeDocumentAddHelper, masterData, intakeTaskAgeDatalayer, contactFactory) {

        var self = this;
        /*Initial value variable*/
        self.matterId = $stateParams.intakeId;
        var matterId = $stateParams.intakeId;
        self.documentId = $stateParams.documentId;
        var documentId = $stateParams.documentId;
        var dynamicSelect;
        self.documentCategories = [];
        self.docPlaintiffs = [];
        self.editdoc = false;
        //self.editable = false;
        self.officeOnlineStat = false;
        self.officeDocs = true;
        self.allUser = [];
        self.needReview = needReview; // show and hide needs review user list drop down
        //US#4713 disable add edit delete
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.openOfficeDoc = openOfficeDoc;
        self.getDocumentDetail = getDocumentDetail;
        self.socketMessage = '';
        var socket;
        self.connectionCloseForSocket = connectionCloseForSocket;
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
        (function () {
            window.parent.document.title = "Welcome to CloudLex";
            $rootScope.$emit('favicon', "favicon.ico");
            getPermissions();
            getDiscoveryDetail();
            getOfficeOnlineStatus();
            /*Initialization on page load*/
            if ($state.current.name == 'intakedocument-edit' || $state.current.name == 'intakeglobaldocument-edit') {

                if (globalConstants.webSocketServiceEnable == true) {
                    /*
                * WebSocket connection start
                */
                    var url = globalConstants.webSocketServiceBase + "Java_Authentication_websocket/serverendpoint/CLXE/" + localStorage.getItem('accessToken') + "?dids=" + documentId;

                    // Create a new instance of the websocket
                    socket = new WebSocket(url);

                    socket.onopen = function (event) {
                        socket.send("Connection established");
                    };
                    socket.onmessage = function (event) {
                        self.socketMessage = (event.data == "Unauthorized") ? '' : event.data;
                    }
                    /*
                    * WebSocket connection End
                    */
                }

                var prevState = localStorage.getItem("intakePrevState");
                if (prevState == "global-office-view" || prevState == "global-office-edit" || prevState == "intakeglobal-office-redirect") {
                    localStorage.removeItem("intakePrevState");
                }

                if ($state.current.name == 'intakeglobaldocument-edit') {
                    self.globalDocview = true;
                } else {
                    self.globalDocview = false;
                    setBreadcrum(self.matterId, 'Document Edit');
                }

                self.editdoc = true;
                getDocCategories();
                // getPlaintiffsForDocument(matterId)
                //     .then(function (response) {
                getDocumentDetail();
                // });
                dynamicSelect = intakeDocumentAddHelper.dynamicFormOptions();
                //self.dynamicSelect = intakeDocumentAddHelper.dynamicFormOptions();
                toggleButtons(true);
            } else if ($state.current.name == 'intake-documents' || $state.current.name == 'intakedocument-view' || $state.current.name == 'intakedocuments' ||
                $state.current.name == 'intakeglobal-office-view' || $state.current.name == 'intakeglobaldocument-view' || $state.current.name == 'intakeoffice-view') {
                if ($state.current.name == 'intakedocuments' || $state.current.name == 'intakeglobal-office-view') {
                    self.globalDocview = true;
                } else {
                    if ($state.current.name == 'intake-documents') {
                        self.globalDocview = false;
                        setBreadcrum(self.matterId, 'Document View');
                    } else {
                        self.globalDocview = false;
                        setBreadcrum(self.matterId, 'Office View');
                    }
                }
                getDocumentDetail();
            }

            //added for document motion
            self.documentMotionDetailInfo = {};
            //self.documentMotionDetailInfo.contact = {};
            self.dateFormat = 'MM/dd/yyyy';
            self.datepickerOptions = {
                formatYear: 'yyyy',
                startingDay: 1,
                'show-weeks': false
            };
            self.dateOfServiceEvent = {};
            self.returnableDateEvent = {};
            getUsers(); // get all users list for asign document review.
        })();

        /**
         * get office online subscribe status
         */
        function getOfficeOnlineStatus() {
            inatkeDocumentsDataService.getOfficeStatus()
                .then(function (response) {
                    self.officeOnlineStat = (response.data.O365.is_active == 1) ? true : false;
                }, function (error) {
                    notificationService.error('Unable to fetch subscription status!');
                });
        }

        function setBreadcrum(matterId, pagename) {
            var initCrum = [{
                name: '...'
            }];
            routeManager.setBreadcrum(initCrum);

            var matterinfo = intakeFactory.getMatterData();
            if (utils.isEmptyObj(matterinfo) || (parseInt(matterinfo.intakeId) !== parseInt(matterId))) {
                intakeFactory.fetchMatterData(matterId).then(function (response) {
                    var matterData = response;
                    addToBreadcrumList(matterData, matterId, pagename);
                });
            } else {
                addToBreadcrumList(matterinfo, matterId, pagename);
            }
        }

        function addToBreadcrumList(matteData, matterId, pagename) {
            var breadcrum = [{
                name: matteData.intakeName,
                state: 'intake-overview',
                param: {
                    intakeId: matterId
                }
            },
            {
                name: 'Documents',
                state: 'intake-documents',
                param: {
                    intakeId: matterId
                }
            },
            {
                name: pagename
            }
            ];

            routeManager.addToBreadcrum(breadcrum);
        }

        //office 365 start
        function getFileExtention(doc) {
            return (doc.doc_name).split('.').pop();
        }

        function getDocInfoForOffice(docData) {
            self.extFlag = false;
            var type = 'global';
            var extType = getFileExtention(docData);
            var javaAccessToken = localStorage.getItem("accessToken");
            if (utils.isNotEmptyVal(javaAccessToken)) {
                var discData = JSON.parse(localStorage.getItem("discoveryIntake"));
                var wopiurl = intakeDocumentsConstants.RESTAPI.wopiUrl;
                if ($state.current.name.indexOf("intakeglobal") == -1) {
                    type = docData.matterid;
                    wopiurl = wopiurl.replace("[type]", docData.matterid);
                } else {
                    wopiurl = wopiurl.replace("[type]", "global");
                }
                if (extType.toLowerCase() != "pdf") {
                    _.forEach(discData, function (data) {
                        if ((extType.toLowerCase() === data.ext) && (data.actionName == "view")) {
                            // $rootScope.$emit('favicon', data.favIconUrl);
                            self.favIconUrl = data.favIconUrl;
                            if (extType == "WopiTest") {
                                self.actionUrlToCall = ((data.url).split("<ui=").shift()) + "ui=en-US&rs=en-US&dchat=0&IsLicensedUser=0&testcategory=OfficeOnline&WOPISrc=" + wopiurl + docData.documentid;
                            } else {
                                self.actionUrlToCall = ((data.url).split("<ui=").shift()) + "ui=en-US&rs=en-US&dchat=0&IsLicensedUser=0&WOPISrc=" + wopiurl + docData.documentid;
                            }
                            self.extFlag = true;
                        }
                    });
                } else {
                    self.extFlag = false;
                }

                var docdata = {
                    docUrl: self.actionUrlToCall,
                    sessionId: javaAccessToken,
                    extType: extType,
                    matterId: docData.matterid,
                    documentId: docData.documentid,
                    favIconUrl: self.favIconUrl,
                    doctype: type,
                    doc_name: (docData.doc_name).split('.').shift(),
                    //isGlobalDoc: isGlobalDoc,
                    // isEditPermission: docEditPermission
                };
                inatkeDocumentsDataService.setDocumentInfo(docdata);
                localStorage.setItem("intakeSelDocumentInfo", JSON.stringify(docdata));
            } else {
                notificationService.error("Uable to authenticate user");
            }
        }

        /*Get Office365 Discovery Details*/
        function getDiscoveryDetail() {
            inatkeDocumentsDataService.getDiscoveryData()
                .then(function (response) {
                    self.discoveryData = response;
                    localStorage.setItem("discoveryIntake", JSON.stringify(self.discoveryData));
                }, function (error) {
                    refreshToken();
                });
        }

        //Restrict user based on permissions 
        function getPermissions() {
            var permissions = masterData.getPermissions();
            self.docPermissions = _.filter(permissions[0].permissions, function (per) {
                if (per.entity_id == '4') {
                    return per;
                }
            });
        }

        /**
         * Get Document details
         */
        self.goOnline = function (documentId, matterId) {
            inatkeDocumentsDataService.getOneDocumentDetails(documentId, matterId)
                .then(function (response) {
                    self.documentDetails = response;
                    viewOnline(self.documentDetails, false, undefined, 'edit-document');
                }, function (error) {
                    notificationService.error("Unable to get document details");
                });
        }

        function openOfficeDoc() {
            // self.DocDetailInfo = inatkeDocumentsDataService.getDocumentInfo();
            window.parent.document.title = docdetails.doc_name;
            var curTimestamp = moment().unix();
            curTimestamp = moment.unix(curTimestamp).add(120, 'minutes');
            curTimestamp = ((curTimestamp).unix()) * 1000;
            document.getElementById("access_token").value = self.sessionId;
            document.getElementById("office_form").action = self.urlD;
            document.getElementById("access_token_ttl").value = curTimestamp;
            var frameholder = document.getElementById("frameholder");
            var office_frame = document.createElement("iframe");
            office_frame.name = "office_frame";
            office_frame.id = "office_frame";
            office_frame.setAttribute('allowfullscreen', 'true');
            frameholder.appendChild(office_frame);
            document.getElementById("office_form").submit();

        }

        /**
         * View document online with microsoft 365
         */
        function viewOnline(doc, isGlobalDoc, $event, actionType) {
            var action = (actionType == 'new-document') ? 'edit' : 'view';
            // var docEditPermission = self.docPermissions[0].E;
            var extType = getFileExtention(doc);
            var type = 'global';
            var javaAccessToken = localStorage.getItem("accessToken");
            if (utils.isNotEmptyVal(javaAccessToken) && self.officeOnlineStat) {
                var discData = JSON.parse(localStorage.getItem("discoveryIntake"));
                var wopiurl = intakeDocumentsConstants.RESTAPI.wopiUrl;
                (doc.intake.intake_id != undefined) ? doc.intake.intake_id = doc.intake.intake_id : doc.intake.intake_id = doc.matterid;
                if ($state.current.name != 'intakedocuments') {
                    type = doc.intake.intake_id;
                    wopiurl = wopiurl.replace("[type]", doc.intake.intake_id);
                } else {
                    wopiurl = wopiurl.replace("[type]", "global");
                }
                if (extType != "pdf") {
                    _.forEach(discData, function (data) {
                        if ((extType.toLowerCase() === data.ext) && (data.actionName == action)) {
                            $rootScope.$emit('favicon', data.favIconUrl);
                            self.favIconUrl = data.favIconUrl;
                            if (extType == "WopiTest") {
                                self.actionUrlToCall = ((data.url).split("<ui=").shift()) + "ui=en-US&rs=en-US&dchat=0&IsLicensedUser=0&testcategory=OfficeOnline&WOPISrc=" + wopiurl + doc.doc_id;
                            } else {
                                self.actionUrlToCall = ((data.url).split("<ui=").shift()) + "ui=en-US&rs=en-US&dchat=0&IsLicensedUser=0&WOPISrc=" + wopiurl + doc.doc_id;
                            }
                            self.OfficeFlag = true;
                        }
                    });
                }
                if ($state.current.name == 'intakedocuments') {
                    isGlobalDoc = true;
                }
                var docdata = {
                    docUrl: self.actionUrlToCall,
                    sessionId: javaAccessToken,
                    extType: extType,
                    doctype: type,
                    matterId: doc.intake.intake_id,
                    documentId: doc.doc_id,
                    isGlobalDoc: isGlobalDoc,
                    isOfficeView: self.OfficeFlag,
                    // isEditPermission: docEditPermission,
                    favIconUrl: self.favIconUrl,
                    doc_name: (doc.doc_name).split('.').shift()
                };
                inatkeDocumentsDataService.setDocumentInfo(docdata);
                localStorage.setItem("intakeSelDocumentInfo", JSON.stringify(docdata));
                if (self.OfficeFlag) {
                    self.extFlag = self.OfficeFlag;
                    if ($state.current.name == 'intakedocuments') {
                        $state.go('intakeglobal-office-view');
                    } else {
                        $state.go('intakeoffice-view', { 'intakeId': doc.intake.intake_id, 'documentId': doc.doc_id });
                    }
                }
            } else {
                notificationService.error("Uable to authenticate user");
            }
        }



        //...Office Online End 

        /*Storing document detials*/
        self.singleDoc = [];
        self.locked = [];
        self.viewable = true;

        /*document Edit*/
        self.uploaddoc = false;
        self.docModel = {};
        self.editdropzoneObj;
        self.docAddTags = [];
        self.singleFileProgress = 0;
        self.singleFileName = '';
        self.singleFileSize = '';
        self.singleuploadError = '';
        self.moreInfoSelect = '';
        self.dynamicForm = {};
        self.moreinfoPrased = [];
        var matters = [];
        var fileCount = 1;

        /* funciton handlers*/
        self.calMedicalBill = calMedicalBill;
        self.openDatePicker = openDatePicker;
        self.openServiceEndDatePicker = openServiceEndDatePicker;
        self.getContacts = getContacts;
        self.changeValues = intakeDocumentAddHelper.changeValues;
        self.addNewContact = addNewContact;
        self.setType = setType;
        self.addNewLineContact = addNewLineContact;
        self.groupPlaintiffDefendants = groupPlaintiffDefendants;
        self.setPartyRole = setPartyRole;
        self.showErrorMsgForDates = showErrorMsgForDates;
        self.gotoPreStat = gotodocList;
        self.generateDocLink = generateDocLink;
        self.replaceDoc = replaceDoc;
        self.processDocuments = processDocuments;
        self.removeUploadingDocument = removeUploadingDocument;
        self.toggleButtons = toggleButtons;
        self.loadTags = loadTags;
        self.searchMatters = searchMatters;
        self.incurredDatePicker = incurredDatePicker;
        self.calExpenseBill = calExpenseBill;
        self.changeExpenseValues = changeExpenseValues;
        self.formatTypeaheadDisplay = formatTypeaheadDisplay;
        self.formatTypeaheadDisplayPartials = contactFactory.formatTypeaheadDisplay_Document;
        self.openDocumentEdit = openDocumentEdit; //offcie 365 integration

        self.openDateOfService = openDateOfService;
        self.openReturnableDate = openReturnableDate;
        self.addNewContactforDocumentMotion = addNewContactforDocumentMotion;
        self.setTypeMotion = setTypeMotion;
        self.setTypeMedicalBills = setTypeMedicalBills;


        self.getDocumentMotionContact = getDocumentMotionContact;
        self.formatTypeaheadDisplayForDocumentMotion = contactFactory.formatTypeaheadDisplay_Document;
        self.documentMotionValidationError = false;
        self.isDatesValid = isDatesValid;
        self.checkContact = checkContact; // US#6288
        self.addNewMbillsContact = addNewMbillsContact;
        function isDatesValid() {
            if ($('#docincurredError').css("display") == "block" || $('#docservicestartDateError').css("display") == "block" || $('#docserviceendDateError').css("display") == "block" ||
                $('#docmedstartDateErr').css("display") == "block" ||
                $('#docmedendDateErr').css("display") == "block") {
                return true;
            } else {
                return false;
            }
        }

        function openDatePicker($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            self[isOpened] = true; //isOpened is a string specifying the model name
        }

        function openServiceEndDatePicker($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            self[isOpened] = true; //isOpened is a string specifying the model name
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
                case '1': // paid
                case '2': // Unpaid
                case '3': // Partial

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
                case '1': // paid
                    objectInfo.paidamount = objectInfo.expense_amount;
                    objectInfo.outstandingamount = utils.isNotEmptyVal(objectInfo.expense_amount) ? 0 : null;
                    break;
                case '2': // Unpaid
                    objectInfo.outstandingamount = objectInfo.expense_amount;
                    objectInfo.paidamount = utils.isNotEmptyVal(objectInfo.expense_amount) ? 0 : null; // 
                    break;
                case '3': // Partial
                    if (utils.isNotEmptyVal(objectInfo.paidamount) && utils.isNotEmptyVal(objectInfo.expense_amount)) {
                        // objectInfo.outstandingamount = (parseFloat(objectInfo.expense_amount) - parseFloat(objectInfo.paidamount)).toFixed(2);
                        objectInfo.outstandingamount = (parseFloat(objectInfo.expense_amount) - parseFloat(objectInfo.paidamount));

                    } else {
                        if (utils.isNotEmptyVal(objectInfo.expense_amount)) {
                            objectInfo.outstandingamount = objectInfo.expense_amount;
                        } else {
                            objectInfo.outstandingamount = utils.isNotEmptyVal(objectInfo.paidamount) ? -objectInfo.paidamount : null;
                        }
                    }
                    break;
            }
        }

        var docDataReceived = false;

        function calMedicalBill(paymentmode) {

            self.newMedicalBillInfo.paidamount = utils.isEmptyVal(self.newMedicalBillInfo.paidamount) ?
                null : self.newMedicalBillInfo.paidamount;
            self.newMedicalBillInfo.totalamount = utils.isEmptyVal(self.newMedicalBillInfo.totalamount) ?
                null : self.newMedicalBillInfo.totalamount;
            self.newMedicalBillInfo.outstandingamount = utils.isEmptyVal(self.newMedicalBillInfo.outstandingamount) ?
                null : self.newMedicalBillInfo.outstandingamount;

            intakeDocumentAddHelper.changeValues(self.newMedicalBillInfo);

            if (!docDataReceived) {
                docDataReceived = true;
                return;
            }
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


        function addNewLineContact(model, prop) {
            var selectedType = {};
            selectedType.type = 'doclineTypes';

            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                model[prop] = response[0];
            }, function () { });
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


        function addNewContact(model, prop, moreinfoType) {
            var selectedType = {};
            //selectedType.type = prop;
            switch (prop) {
                case "providerid":
                    selectedType.type = moreinfoType === 'docMedicalBills' ? 'mbillsproviderid' : 'docproviddmediinfo';
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
            }, function () { });
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

            return st.isAfter(ed);
        }


        /*Get a single document detial*/
        function getDocumentDetail() {
            inatkeDocumentsDataService.getOneDocumentDetails(documentId)
                .then(function (response) {
                    /*Checking if received the proper responce or not*/
                    if (response.doc_name) {
                        self.singleDoc = response;
                        var doc_ext = getFileExtention(self.singleDoc);
                        self.singleDoc.doc_ext = doc_ext.toLowerCase();
                        self.singleDoc.allTags = _.pluck(self.singleDoc.doc_tags, "tag_name").join(" ");
                        //self.editable = (response.islocked == "1") ? false : true;
                        getDocInfoForOffice(response);
                        setDocumentDetails();
                        // response.moreinfo_type === "insurance" ? getPlaintiffsForDocument(response.matterid) : angular.noop();
                    } else {
                        /*show Error if responce is invalid*/
                        notificationService.error('document detail not loaded');
                        gotodocList();
                    }
                }, function (error) {
                    notificationService.error('document detail not loaded');
                    gotodocList();
                });
        }

        /* Assign the value to models from document details*/
        function setDocumentDetails() {
            self.singleDoc.currentlyusedby = self.singleDoc.currently_used_by.fname.trim();
            var doc_ext = getFileExtention(self.singleDoc);
            doc_ext = angular.lowercase(doc_ext);
            if (doc_ext == 'pdf' || doc_ext == 'txt' || doc_ext == 'png' || doc_ext == 'jpg' || doc_ext == 'jpeg' || doc_ext == 'gif') {
                /* Generate view link if document is pdf/image/txt */
                if (self.singleDoc.doc_uri !== null) {
                    var uriArr = self.singleDoc.doc_uri.split('/');
                    var filename = uriArr[uriArr.length - 2] + '/' + uriArr[uriArr.length - 1];
                    var filenameArr = filename.split('.');
                    var extension = filenameArr[filenameArr.length - 1].toLowerCase();

                    try {
                        var dfilename = decodeURIComponent(filename);
                        filename = dfilename;
                    } catch (err) { }
                    var filenameEncoded = encodeURIComponent(filename);
                    var documentNameEncoded = encodeURIComponent(self.singleDoc.doc_name);
                    inatkeDocumentsDataService.viewdocument(self.singleDoc.doc_id).then(function (res) {
                        self.singleDoc.viewdocumenturi = res;
                    })
                } else {
                    self.singleDoc.viewdocumenturi = '';
                }
            } else {
                self.viewable = false;
            }

            if (self.editdoc == true) {
                // if (self.globalDocview == true) {  for US4153
                matters = [{
                    name: self.singleDoc.intake.intake_name,
                    matterid: self.singleDoc.intake.intake_id
                }];
                self.categorySelected = self.singleDoc.doc_category.doc_category_name;
                self.docModel.intake_id = self.singleDoc.intake.intake_id;

                self.docModel.documentname = self.singleDoc.doc_name;
                localStorage.setItem("intakeDocumentName", self.docModel.doc_name);
                self.docModel.category = self.singleDoc.doc_category;
                self.docModel.needs_review = (self.singleDoc.needs_review == "1") ? true : false;
                self.docModel.review_user = self.singleDoc.review_user; // set review user id
                self.docModel.showNeedReview = (self.singleDoc.needs_review == "1") ? true : false;
                if (utils.isNotEmptyVal(self.docModel.category.doc_category_id)) {
                    self.docModel.category.doc_category_id = self.docModel.category.doc_category_id.toString();
                }

                self.docModel.associated_party_id = self.singleDoc.associated_party.associated_party_id;

                self.docModel.party_role = self.singleDoc.associated_party.associated_party_role;
                self.docModel.memo = utils.isNotEmptyVal(self.singleDoc.memo) ? self.singleDoc.memo : '';
                if (self.singleDoc.review_user) {
                    self.docModel.reviewUser = (self.singleDoc.review_user.length == 1 || self.singleDoc.review_user.length == 0) ? self.singleDoc.review_user : self.singleDoc.review_user;
                } else {
                    self.docModel.reviewUser = '';
                }
                self.docModel.date_filed_date = (utils.isEmptyVal(self.singleDoc.date_filed_date) || self.singleDoc.date_filed_date == 0 || self.singleDoc.date_filed_date == null) ? '' : moment.unix(self.singleDoc.date_filed_date).format('MM/DD/YYYY');
                if (self.singleDoc.doc_tags != null && self.singleDoc.doc_tags != '') {
                    var tagsOfDoc = _.uniq(self.singleDoc.doc_tags, 'tag_id');
                    angular.forEach(tagsOfDoc, function (tagvalue, tagkey) {
                        tagvalue.id = tagvalue.tag_id;
                        tagvalue.name = tagvalue.tag_name;
                    });

                    angular.forEach(tagsOfDoc, function (datavalue, datakey) {
                        self.docAddTags.push({
                            "name": datavalue.tag_name
                        });
                    });
                }

                // self.moreinfoPrased = self.singleDoc.moreInfo_parsed;

            }
            return true;
        }

        // US:4810 
        // change event for need review flag button
        function needReview() {
            self.docModel.showNeedReview = self.docModel.needs_review;
            self.docModel.reviewUser = ""; // reset value of review asign user
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

        // ------------------ motion changes start ----------------------------------


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

        function setTypeMotion(model) {
            // console.log(model);
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
                // self.documentMotionDetailInfo.contact = savedContact;
                // // if (angular.isDefined(savedContact.firstname) && savedContact.firstname != '') {
                // //     self.documentMotionDetailInfo.contact.firstname = savedContact.firstname;
                // // } else {
                // //     self.documentMotionDetailInfo.contact.firstname = '';
                // // }
                // // if (angular.isDefined(savedContact.lastname) && savedContact.lastname != '') {
                // //     self.documentMotionDetailInfo.contact.lastname = savedContact.lastname;
                // // } else {
                // //     self.documentMotionDetailInfo.contact.lastname = '';
                // // }
                self.documentMotionDetailInfo.contact = savedContact[0];
                self.documentMotionDetailInfo.contact.email = intakeDocumentAddHelper.getStringFromArray(self.documentMotionDetailInfo.contact.email);
                self.documentMotionDetailInfo.contact.phone = intakeDocumentAddHelper.getStringFromArray(self.documentMotionDetailInfo.contact.phone);
            });
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
                } else {
                    dosYear = dateOfService.getFullYear();
                    dosMonth = dateOfService.getMonth();;
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
                    if (angular.isDefined(returnableDate) && angular.isDefined(returnableDate.length) && returnableDate.length == 10) {
                        rdYear = returnableDate.substring(6, 10);
                        rdMonth = returnableDate.substring(0, 2);
                        rdDay = returnableDate.substring(3, 5);
                        rdDate = rdYear + "/" + (rdMonth) + "/" + rdDay;
                    } else {
                        rdYear = returnableDate.getFullYear();
                        rdMonth = returnableDate.getMonth();;
                        rdDay = returnableDate.getDate();
                        rdDate = rdYear + "/" + (rdMonth + 1) + "/" + rdDay;
                    }
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
            } else if ((dateOfService != '' && dateOfService != 0 && dateOfService != null) && returnableDate != '' && returnableDate != 0 && returnableDate != null) {
                self.documentMotionValidationError = true;
                notificationService.error('Date of Service is blank');
            }


        }

        function displayDateOfService() {
            var todayDate;
            todayDate = moment().startOf('day');
            todayDate = moment(todayDate).unix();
            self.documentMotionDetailInfo.dateOfService = moment.unix(todayDate).format("MM/DD/YYYY");
        }



        // ------------------ motion changes end ----------------------------------

        /*Lock / Unlock document*/
        function updateDocumentLock(islock) {
            inatkeDocumentsDataService.updateDocuemntlock(documentId, islock)
                .then(function (response) {
                    var lRes = response.data;
                    if (lRes.code == 200 || lRes.code == 202) {
                        self.locked.currentlyusedby = lRes.currentlyusedby;
                        self.editable = true;
                    } else if (lRes.code == 201) {
                        self.editable = false;
                        if (self.editdoc == true) {
                            notificationService.success("Document already locked by other user");
                            if (self.globalDocview) {
                                $state.go('intakedocuments');
                            } else {
                                $state.go('intake-documents', {
                                    intakeId: matterId
                                });
                            }
                        }
                    } else if (lRes.code == 203) {
                        self.editable = true;
                    }
                }, function (error) {
                    notificationService.error('document lock not updated');
                });
        }

        /*Get the Document Categories*/
        function getDocCategories() {
            if (utils.isEmptyObj(masterData.getMasterData())) {
                var request = masterData.fetchMasterData();
                $q.all([request]).then(function (values) {
                    self.documentCategories = values[0].documents_cat;
                })
            } else {
                self.documentCategories = masterData.getMasterData().documents_cat;
            }
        }

        /*Get all plaintiffs*/
        function getPlaintiffsForDocument(matterId) {
            var deferred = $q.defer();
            inatkeDocumentsDataService.getPlaintiffs(matterId)
                .then(function (response) {
                    self.docPlaintiffs = response;
                    //getDefendants(matterId);
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        /*Get all defendants*/
        function getDefendants(matterId) {
            IntakePlaintiffDataService.getDefendants(matterId)
                .then(function (res) {
                    self.docDefendants = res.data;
                    // IntakePlaintiffDataService.getOtherPartiesBasic(matterId)
                    //     .then(function (res) {
                    //         self.docOtherparties = res.data;
                    //         self.docPlaintiffDefendants = getDocPlaintiffData(self.docPlaintiffs, self.docDefendants, self.docOtherparties);
                    //         setAssociatedParty(self.singleDoc, self.docPlaintiffDefendants);
                    //     })
                });
        }

        function setAssociatedParty(docInfo, partyData) {
            if (utils.isNotEmptyVal(docInfo.plaintiff_name)) {
                if (docInfo.categoryid == "10") {
                    var party = _.find(partyData, function (party) {
                        return party.type == parseInt(docInfo.party_role) && (party.id == docInfo.doc_plaintiff)
                    });
                    docInfo.assosiatedPartyName = angular.isDefined(party) ? utils.isNotEmptyVal(party.name) ? party.name : '' : '';
                }

                else if (docInfo.moreinfo_type == "insurance") {
                    var party = _.find(partyData, function (party) {
                        return party.type == parseInt(docInfo.moreInfo_parsed.party_role) && (party.id == docInfo.moreInfo_parsed.associated_party_id)
                    });
                    docInfo.assosiatedPartyName = utils.isNotEmptyVal(party.name) ? party.name : '';

                } else {

                    var party = _.find(partyData, function (party) {
                        return party.type == parseInt(docInfo.party_role) && (party.id == docInfo.doc_plaintiff)
                    });
                    docInfo.assosiatedPartyName = utils.isNotEmptyVal(party.name) ? party.name : '';

                }
                // else {
                //    
                //     var party = _.find(partyData, function (party) {
                //         return party.type == parseInt(docInfo.moreInfo_parsed.party_role) && (party.id == docInfo.moreInfo_parsed.plaintiffid.plaintiffid)
                //     });
                //     docInfo.assosiatedPartyName = utils.isNotEmptyVal(party.name) ? party.name : '';

                // }
            }
        }

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
                var defendantName = utils.isNotEmptyVal(defendant.contactid) ? defendant.contactid.firstname : "";
                defendantName += " ";
                defendantName += utils.isNotEmptyVal(defendant.contactid) ? " " + defendant.contactid.lastname : "";

                var newDefendant = {
                    id: defendant.defendantid,
                    name: defendantName,
                    type: 2 // 2 refer defendant role
                };
                return newDefendant;
            });
            plaintiffDefendantsArray = plaintiffDefendantsArray.concat(defendants);

            var otherParties = otherParties.map(function (otherParty) {
                if (utils.isNotEmptyVal(otherParty.contactid)) {
                    var otherPartyName = utils.isNotEmptyVal(otherParty.firstname) ? otherParty.firstname : "";
                    otherPartyName += "" + utils.isNotEmptyVal(otherParty.lastname) ? " " + otherParty.lastname : "";

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
                //self.docModel.associated_party_id = insuranceObj.docPlaintiff
                insuranceObj.party_role = 1;
            } else {
                insuranceObj.party_role = selectedItem.type;
            }

        }

        /*open Docuemt in Office */
        function openDocumentEdit(docDetails) {
            // if (globalConstants.webSocketServiceEnable == true) {
            //     connectionCloseForSocket();
            // }
            viewOnline(docDetails.singleDoc, false, undefined, 'edit-document');
            // localStorage.setItem("intakePrevState", 'global-office-edit');
        }

        /*Generate download link for documents*/
        function generateDocLink() {
            var documentName = self.singleDoc.doc_name;
            inatkeDocumentsDataService.downloadDocument(documentId)
                .then(function (response) {
                    if (response && response != '') {
                        var file = new Blob([response], { type: 'application/binary' });
                        var fileURL = URL.createObjectURL(file);
                        var link = document.createElement('a');
                        link.href = fileURL;
                        link.download = documentName;
                        link.click();
                    } else {
                        notificationService.error('Unable to download document');
                    }

                }, function (error) {
                    notificationService.error('document categories not loaded');
                });
        }

        /*Replace document block display*/
        function replaceDoc() {
            self.docModel.documentname = '';
            self.uploaddoc = true;
            self.officeDocs = false;
            toggleButtons(false);
            toggleButtons(true, 'Cancel');
            initializeSingleFileDropnzone();
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

        /*Single File edit / Version upload  */
        function initializeSingleFileDropnzone() {
            self.editdropzoneObj = new Dropzone("#singledropzone", {
                url: intakeDocumentsConstants.RESTAPI.updateDocument + '/' + parseInt(self.singleDoc.doc_id),
                method: "PUT",
                // withCredentials: true,
                parallelUploads: 1,
                uploadMultiple: false,
                maxFilesize: 500,
                createImageThumbnails: false,
                maxFiles: 1,
                params: self.docModel,
                autoProcessQueue: false,
                addRemoveLinks: false,
                dictDefaultMessage: '<span class="sprite default-document-single-upload"></span><h2 class="margin-top10px">Drop File Here</h2>',
                dictRemoveFile: '',
                accept: function (file, done) {
                    self.singlefileUpload = true;
                    toggleButtons(true);
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
                                localStorage.setItem("intakeDocumentName", self.singleFileName);
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
                fallback: function () { },
                success: function (file) {
                    usSpinnerService.stop('pageSpinner');
                    notificationService.success("Document uploaded successfully");
                    removeUploadingDocument();
                    clearSetInterval();
                    gotodocList();
                    return true;
                },
                error: function (file, message) {
                    var receivedSizeCheck = checkfileSize(file.size);
                    if (receivedSizeCheck === 0) {
                        notificationService.error("Size of file should not be greater than 500 MB");
                    } else if (file.xhr.status == 401) {
                        localStorage.clear();
                        $state.go('login');
                    } else {
                        notificationService.error(message.message);
                    }
                    removeUploadingDocument();
                    $scope.$apply(function () {
                        usSpinnerService.stop('pageSpinner');
                        clearSetInterval();
                        toggleButtons(true);
                        self.docModel.documentname = self.singleDoc.documentname;
                    });
                    // var displayError = true;
                    // var receivedSizeCheck = checkfileSize(file.size);
                    // if (receivedSizeCheck === 0) {
                    //     ferror = "Size of file should not be greater than 500 MB";
                    // } else if (file.xhr.status == 422) {
                    //     var text = JSON.parse(file.xhr.response);
                    //     // if (text["Message : "] != "Document type is not similar with uploaded Document type") {
                    //         removeUploadingDocument();
                    //     // }
                    //     notificationService.error(text.message);
                    // } else if (file.xhr.status == 401) {
                    //     localStorage.clear();
                    //     $state.go('login');
                    // } else if (file.xhr.status == 412) {
                    //     notificationService.error("Please upload valid document.");
                    // } else {
                    //     notificationService.error(message["Message : "]);
                    //     toggleButtons(true, 'Cancel');
                    // }
                    // if (displayError) {
                    //     toggleButtons(true);
                    //     $scope.$apply();
                    //     self.docModel.documentname = self.singleDoc.doc_name;
                    // }
                },
                headers: { 'Authorization': "Bearer " + localStorage.getItem('accessToken') },
                dictResponseError: 'Error while uploading file!',
                previewTemplate: '<span></span>'
            });
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
                if (utils.isEmptyVal(data.insuranceproviderid) || utils.isNotEmptyVal(data.insuranceproviderid.contactid)) {
                    data.insuranceproviderid;
                } else {
                    notificationService.error("Invalid Contact Selected");
                    return true;
                }
            }
            if (data.adjusterid) {
                if (utils.isEmptyVal(data.adjusterid) || utils.isNotEmptyVal(data.adjusterid.contactid)) {
                    data.adjusterid;
                } else {
                    notificationService.error("Invalid Contact Selected");
                    return true;
                }
            }
        }

        function connectionCloseForSocket() {
            /*
           *   Websocket connection closed
           */
            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        }
        self.setParams = function () {
            var singledovParams = {};
            singledovParams.documentname = self.docModel.documentname;
            singledovParams.categoryid = angular.isDefined(self.docModel.category.doc_category_id) ? parseInt(self.docModel.category.doc_category_id) : parseInt(self.docModel.category);
            singledovParams.uploadtype = 'version';
            singledovParams.memo = self.docModel.memo;
            singledovParams.needs_review = self.docModel.needs_review ? 1 : 0;
            singledovParams.review_user = utils.isNotEmptyVal(self.docModel.reviewUser) ? self.docModel.reviewUser.toString() : ''; //self.docModel.reviewUser.toString(); // assign reviewer
            singledovParams.date_filed_date = utils.isNotEmptyVal(self.docModel.date_filed_date) ? moment.utc(moment(angular.copy(self.docModel.date_filed_date)).startOf('day')).unix() : '';
            singledovParams.intake_id = self.docModel.intake_id;
            singledovParams.associated_party_id = angular.isUndefined(self.docModel.associated_party_id) ? 0 : self.docModel.associated_party_id;
            singledovParams.party_role = self.docModel.party_role ? self.docModel.party_role : 0;
            singledovParams.tags = _.pluck(self.docAddTags, 'name');
            return singledovParams;
        }

        function processDocuments() {
            if (globalConstants.webSocketServiceEnable == true) {
                connectionCloseForSocket();
            }

            if (utils.isEmptyVal(self.docModel.documentname)) {
                self.docModel.documentname = localStorage.getItem("intakeDocumentName");
                //notificationService.error("Document name is required");
                //return false;
            }
            // check whether needs review and reviewer is selected.
            if (utils.isEmptyVal(self.docModel.reviewUser) && self.docModel.needs_review == true) {
                notificationService.error('Please select a reviewer from user list.');
                return false;
            }
            if (utils.isEmptyVal(self.docModel.category)) {
                notificationService.error("Category is required");
                return false;
            }
            self.documentMotionValidationError = false;
            if (self.uploaddoc == true) {
                var singledovParams = self.setParams();
            } else {
                var singledovParams = createPrams();
            }
            if (singledovParams === false) {
                return false;
            }
            stripScriptTag(singledovParams);

            if (self.uploaddoc == true && utils.isNotEmptyVal(self.singleFileName)) {
                usSpinnerService.spin('pageSpinner');
                self.editdropzoneObj.options.params = singledovParams;
                // sessionalive = setInterval(keepSessionalive, 900000);
                if (!self.documentMotionValidationError) {
                    toggleButtons(false);
                    stripScriptTag(self.docModel);
                    self.editdropzoneObj.processQueue();
                } else {
                    return false;
                }

            } else {
                if (!self.documentMotionValidationError) {
                    toggleButtons(false);
                    if( utils.isEmptyVal(singledovParams.review_user) ){
                        singledovParams.review_user = [];
                    } else {
                        var reviewUser = singledovParams.review_user.split(",");
                        singledovParams.review_user = [];
                        _.forEach(reviewUser, function (currentItem) {
                            singledovParams.review_user.push(parseInt(currentItem));
                        });
                    }
                    inatkeDocumentsDataService.updateDocument(singledovParams)
                        .then(function (response) {
                            self.singleDoc.documentname = self.docModel.documentname;
                            notificationService.success(self.singleDoc.documentname + ' updated successfully.');
                            gotodocList();

                        }, function (error) {
                            if (utils.isNotEmptyVal(error.data)) {
                                notificationService.error(error.data.message);
                            } else {
                                notificationService.error('Document not updated');
                            }
                            toggleButtons(true);
                        });
                } else {
                    return false;
                }
            }
        }

        /* Create paramter to send in edit document service */
        function createPrams() {
            var singledovParams = {};
            singledovParams.intake_document_id = parseInt(self.singleDoc.doc_id);
            singledovParams.doc_name = self.docModel.documentname;
            singledovParams.memo = self.docModel.memo;
            singledovParams.date_filed_date = utils.isNotEmptyVal(self.docModel.date_filed_date) ? moment.utc(moment(angular.copy(self.docModel.date_filed_date)).startOf('day')).unix() : '';
            singledovParams.doc_category = { "doc_category_id": utils.isNotEmptyVal(self.docModel.category) ? parseInt(self.docModel.category.doc_category_id) : "" };
            singledovParams.associated_party = { "associated_party_id": utils.isNotEmptyVal(self.docModel.associated_party_id) ? parseInt(self.docModel.associated_party_id) : 0, "associated_party_role": utils.isNotEmptyVal(self.docModel.party_role) ? parseInt(self.docModel.party_role) : 0 };
            // singledovParams.party_role = self.docModel.party_role;
            singledovParams.uploadtype = 'version';
            singledovParams.needs_review = self.docModel.needs_review ? 1 : 0;
            singledovParams.review_user = utils.isNotEmptyVal(self.docModel.reviewUser) ? self.docModel.reviewUser.toString() : ''; //self.docModel.reviewUser.toString(); // assign reviewer
            singledovParams.intake = { "intake_id": parseInt(self.singleDoc.intake.intake_id) },
                singledovParams.tags_String = _.pluck(self.docAddTags, 'name').toString();
            return singledovParams;
        }

        function setMoreInfo(moreInfo) {
            switch (self.moreInfoSelect) {
                default:
                    if (document.getElementById(self.moreInfoSelect)) {
                        var formElementslength = document.getElementById(self.moreInfoSelect).elements.length;
                        if (formElementslength > 0) {
                            var formElements = document.getElementById(self.moreInfoSelect).elements;
                            $.each(formElements, function (datavalue, datakey) {
                                var value = $(datakey).val();
                                var ctype = $(datakey).attr("ctype");
                                var eleName = $(datakey).attr("name");

                                var obj = {
                                    "name": eleName,
                                    "ctype": ctype,
                                    "value": value
                                };

                                moreInfo[eleName] = obj;
                            });
                        }
                    }
            }
            // moreInfo.associated_party_id = angular.isUndefined(self.docModel.associated_party_id) ? '' : self.docModel.associated_party_id;
            moreInfo.party_role = angular.isUndefined(self.docModel.party_role) ? '' : self.docModel.party_role;
            moreInfo.plaintiffid = angular.isUndefined(self.docModel.associated_party_id) ? '' : self.docModel.associated_party_id;
            moreInfo.matterid = matterId;
        }

        /*Remove the going to upload document */
        function removeUploadingDocument(cancel) {
            if (globalConstants.webSocketServiceEnable == true) {
                connectionCloseForSocket();
            }
            if (self.editdropzoneObj) {
                fileCount = 1;
                self.editdropzoneObj.removeAllFiles();
                self.singleFileProgress = 0;
                self.singleFileName = '';
                self.singleFileSize = '';
                self.singleuploadError = '';
                self.uploaddoc = false;
                self.officeDocs = true;
                self.editdropzoneObj.destroy();
            }

            if (cancel == 1) {
                gotodocList();
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

        /*Go back to document list*/
        function gotodocList() {
            if (self.editdoc == true) {
                if (self.globalDocview) {
                    $state.go('intakedocuments');
                } else {
                    $state.go('intake-documents', {
                        intakeId: matterId
                    });
                }
                // inatkeDocumentsDataService.updateDocuemntlock(documentId, 0)
                //     .then(function (response) {
                //         if (self.globalDocview) {
                //             $state.go('documents');
                //         } else {
                //             $state.go('intake-documents', {
                //                 matterId: matterId
                //             });
                //         }
                //     }, function (error) {
                //         if (self.globalDocview) {
                //             $state.go('documents');
                //         } else {
                //             $state.go('intake-documents', {
                //                 matterId: matterId
                //             });
                //         }
                //     });
            } else {
                routeManager.goToPrevState();
            }
        }

        /*Search matter in case of global documents*/
        function searchMatters(matterName) {
            if (matterName) {
                return intakeFactory.searchMatters(matterName).then(
                    function (response) {
                        matters = response.data;
                        return response.data;
                    },
                    function (error) {
                        notificationService.error('Matters not loaded');
                    });
            }
        }

        /* Formate the matter id and name in case of global documents*/
        function formatTypeaheadDisplay(matterid) {
            if (angular.isUndefined(matterid) || utils.isEmptyString(matterid) || matters.length === 0) {
                return undefined;
            }
            var matterInfo = _.find(matters, function (matter) {

                if (!angular.isUndefined(self.singleDoc.matterid) && self.singleDoc.matterid != matterid) {
                    self.docModel.matterid = matterid;
                    getPlaintiffsForDocument(matterid);
                    self.docModel.associated_party_id = '';
                }
                return matter.matterid === matterid;
            });
            return matterInfo.name;
        }

    }
})();

/* Edit office documents types controller 
 */


(function () {
    angular
        .module('intake.documents')
        .controller('intakeOfficeDocCtrl', intakeOfficeDocCtrl);

    intakeOfficeDocCtrl.$inject = ['inatkeDocumentsDataService', '$rootScope'];

    function intakeOfficeDocCtrl(inatkeDocumentsDataService, $rootScope) {
        var self = this;
        self.openOfficeDoc = openOfficeDoc;
        self.DocDetailInfo = inatkeDocumentsDataService.getDocumentInfo();
        openOfficeDoc();
        function openOfficeDoc() {
            window.parent.document.title = self.DocDetailInfo.doc_name;
            $rootScope.$emit('favicon', self.DocDetailInfo.favIconUrl);
            var curTimestamp = moment().unix();
            curTimestamp = moment.unix(curTimestamp).add(120, 'minutes');
            curTimestamp = ((curTimestamp).unix()) * 1000;
            document.getElementById("access_token").value = self.DocDetailInfo.sessionId;
            document.getElementById("office_form").action = self.DocDetailInfo.docUrl;
            document.getElementById("access_token_ttl").value = curTimestamp;
            var frameholder = document.getElementById("frameholder");
            var office_frame = document.createElement("iframe");
            office_frame.name = "office_frame";
            office_frame.id = "office_frame";
            frameholder.appendChild(office_frame);
            document.getElementById("office_form").submit();
        }
    }

})();


//function setMoreInfoForLiens(moreInfo) {
//    var newLienInfo = angular.copy(self.newLiensInfo);
//    angular.extend(moreInfo, newLienInfo);
//    moreInfo.matterid = matterId;
//    moreInfo.datepaid = moment(moreInfo.datepaid).format("MM/DD/YYYY");
//    moreInfo.dateofclaim = moment(moreInfo.dateofclaim).format("MM/DD/YYYY");
//    moreInfo.lienholdername = moreInfo.lienholdername ? moreInfo.lienholdername.contactid : '';
//    moreInfo.adjusterid = moreInfo.adjusterid ? moreInfo.adjusterid.contactid : '';
//    moreInfo.insuranceproviderid = moreInfo.insuranceproviderid ? moreInfo.insuranceproviderid.contactid : '';
//}

//function setMoreInfoForMedicalBill(moreInfo) {
//    var newMedicalBillInfo = angular.copy(self.newMedicalBillInfo);
//    angular.extend(moreInfo, newMedicalBillInfo);
//    moreInfo.matterid = matterId;
//    moreInfo.providerid = moreInfo.providerid ? moreInfo.providerid.contactid : "";
//}

//function setMoreInfoForInsurance(moreInfo) {
//    var newInsauranceInfo = angular.copy(self.newInsauranceInfo);
//    angular.extend(moreInfo, newInsauranceInfo);
//    moreInfo.matterid = matterId;
//    moreInfo.insuredpartyid = newInsauranceInfo.insuredpartyid ? newInsauranceInfo.insuredpartyid.contactid : "";
//    moreInfo.adjusterid = newInsauranceInfo.adjusterid ? newInsauranceInfo.adjusterid.contactid : "";
//    moreInfo.insuranceproviderid = newInsauranceInfo.insuranceproviderid ? newInsauranceInfo.insuranceproviderid.contactid : "";
//}

//function setMoreInfoForExpense(moreInfo) {
//    moreInfo.matterid = matterId;
//    angular.extend(moreInfo, self.newExpenseInfo);
//}
