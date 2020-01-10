/* Document Upload module controller. 
 * */
(function () {

    'use strict';

    angular
        .module('cloudlex.documents')
        .controller('ViewDocumentsCtrl', ViewDocumentsCtrl);

    ViewDocumentsCtrl.$inject = ['$rootScope', '$window', '$scope', '$q', 'documentsDataService', '$stateParams',
        'notification-service', '$state', 'documentsConstants', 'globalConstants', 'usSpinnerService',
        'matterFactory', 'matterDetailsService', 'allPartiesDataService', 'routeManager', 'documentAddHelper',
        'masterData', 'contactFactory', 'taskAgeDatalayer'
    ];

    function ViewDocumentsCtrl($rootScope, $window, $scope, $q, documentsDataService, $stateParams,
        notificationService, $state, documentsConstants, globalConstants, usSpinnerService,
        matterFactory, matterDetailsService, allPartiesDataService, routeManager, documentAddHelper, masterData, contactFactory, taskAgeDatalayer) {

        var self = this;

        /*Initial value variable*/
        self.matterId = $stateParams.matterId;
        var matterId = $stateParams.matterId;
        self.documentId = $stateParams.documentId;
        var documentId = $stateParams.documentId;
        var dynamicSelect;
        self.documentCategories = [];
        self.docPlaintiffs = [];
        self.editdoc = false;
        self.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;
        //self.editable = false;
        self.officeOnlineStat = false;
        self.officeDocs = true;
        self.allUser = [];
        self.needReview = needReview; // show and hide needs review user list drop down
        //US#4713 disable add edit delete
        var gracePeriodDetails = masterData.getUserRole();
        self.permissionArray = "";
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.openOfficeDoc = openOfficeDoc;
        self.getDocumentDetail = getDocumentDetail;
        self.socketMessage = '';
        var socket;
        self.connectionCloseForSocket = connectionCloseForSocket;
        //check api call to get Contacts
        self.permissionArray = JSON.parse(localStorage.getItem('permissionval'));
        self.JavaFilterAPIForContactList = true;
        self.insuranceTypeList = angular.copy(globalConstants.insuranceTypeList);
        self.showValidationForAdjusted = false;
        self.showValidationForAdjustment = false;
        (function () {
            window.parent.document.title = "Welcome to CloudLex";
            $rootScope.$emit('favicon', "favicon.ico");
            if (self.permissionArray) {
                var permissionArray = self.permissionArray;
            } else {
                var permissionArray = masterData.getPermissions();
            }
            getPermissions(permissionArray);
            //getPermissions();
            //self.permissions=masterData.getPermissions();
            getDiscoveryDetail();
            getOfficeOnlineStatus();
            /*Initialization on page load*/
            if ($state.current.name == 'document-edit' || $state.current.name == 'globaldocument-edit') {

                if (globalConstants.webSocketServiceEnable == true) {
                    /*
                * WebSocket connection start
                */
                    var url = globalConstants.webSocketServiceBase1 + "Matter-Manager/serverendpoint/CLXE/" + localStorage.getItem('accessToken') + "?dids=" + documentId;

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

                var role = masterData.getUserRole();
                var prevState = localStorage.getItem("prevState");
                if (prevState == "global-office-view" || prevState == "global-office-edit" || prevState == "global-office-redirect") {
                    localStorage.removeItem("prevState");
                }

                if ($state.current.name == 'globaldocument-edit') {
                    self.globalDocview = true;
                } else {
                    self.globalDocview = false;
                    setBreadcrum(self.matterId, 'Document Edit');
                }

                self.editdoc = true;
                getDocCategories();
                getPlaintiffsForDocument(matterId)
                    .then(function (response) {
                        getDocumentDetail();
                    });
                dynamicSelect = documentAddHelper.dynamicFormOptions();
                //self.dynamicSelect = documentAddHelper.dynamicFormOptions();
                toggleButtons(true);
            } else if ($state.current.name == 'matter-documents' || $state.current.name == 'document-view' || $state.current.name == 'documents' ||
                $state.current.name == 'global-office-view' || $state.current.name == 'globaldocument-view' || $state.current.name == 'office-view') {
                if ($state.current.name == 'documents' || $state.current.name == 'global-office-view') {
                    self.globalDocview = true;
                } else {
                    if ($state.current.name == 'matter-documents') {
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
            self.matterInfomation = matterFactory.getMatterData(self.matterId);
        })();

        //when tab closed websocket connection should also get close
        $window.onbeforeunload = function () {
            if (globalConstants.webSocketServiceEnable == true) {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.close();
                }
            }
        }

        function getPermissions(permissionArray) {
            var permissions = permissionArray;
            localStorage.setItem("permissionval", JSON.stringify(permissions));
            self.permissionArray = JSON.parse(localStorage.getItem('permissionval'));
            self.docPermissions = _.filter(permissions[0].permissions, function (per) {
                if (per.entity_id == '4') {
                    return per;
                }
            });
        }
        /**
         * get office online subscribe status
         */
        function getOfficeOnlineStatus() {
            documentsDataService.getOfficeStatus()
                .then(function (response) {
                    self.officeOnlineStat = (response.data.O365.is_active == 1) ? true : false;
                }, function (error) {
                    notificationService.error('Unable to fetch subscription status!');
                });
        }
        function checkIfEnterKeyWasPressed(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
            return true;

        };
        function setBreadcrum(matterId, pagename) {
            var initCrum = [{
                name: '...'
            }];
            routeManager.setBreadcrum(initCrum);

            var matterinfo = matterFactory.getMatterData();

            if (utils.isEmptyObj(matterinfo) || (parseInt(matterinfo.matter_id) !== parseInt(matterId))) {
                matterFactory.getMatterInfo(matterId).then(function (response) {
                    var matterData = response.data[0];
                    matterFactory.setMatterData(matterData);
                    addToBreadcrumList(matterData, matterId, pagename);
                });
            } else {
                addToBreadcrumList(matterinfo, matterId, pagename);
            }
        }

        function addToBreadcrumList(matteData, matterId, pagename) {
            self.matterInfomation = angular.copy(matteData);
            if (matteData && matteData.archivalMatterReadOnlyFlag) {
                $rootScope.onLauncher = false;
                $rootScope.onMatter = false;
                $rootScope.onIntake = false;
                $rootScope.onReferral = false;
                $rootScope.onArchival = true;
                $rootScope.onMarkerplace = false;
                $rootScope.onExpense = false;
                $rootScope.onReferralPrg = false;
            }

            var breadcrum = [{
                name: matteData.matter_name,
                state: 'add-overview',
                param: {
                    matterId: matterId
                }
            },
            {
                name: 'Documents',
                state: 'matter-documents',
                param: {
                    matterId: matterId
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
                var discData = JSON.parse(localStorage.getItem("discovery"));
                var wopiurl = documentsConstants.RESTAPI.wopiUrl1;
                if ($state.current.name.indexOf("global") == -1) {
                    type = docData.matter.matterid;
                    wopiurl = wopiurl.replace("[type]", docData.matter.matter_id);
                } else {
                    wopiurl = wopiurl.replace("[type]", "global");
                }
                if (extType.toLowerCase() != "pdf") {
                    _.forEach(discData, function (data) {
                        if ((extType.toLowerCase() === data.ext) && (data.actionName == "view")) {
                            // $rootScope.$emit('favicon', data.favIconUrl);
                            self.favIconUrl = data.favIconUrl;
                            if (extType == "WopiTest") {
                                self.actionUrlToCall = ((data.url).split("<ui=").shift()) + "ui=en-US&rs=en-US&dchat=0&IsLicensedUser=0&testcategory=OfficeOnline&WOPISrc=" + wopiurl + docData.doc_id;
                            } else {
                                self.actionUrlToCall = ((data.url).split("<ui=").shift()) + "ui=en-US&rs=en-US&dchat=0&IsLicensedUser=0&WOPISrc=" + wopiurl + docData.doc_id;
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
                    matterId: docData.matter.matter_id,
                    documentId: docData.doc_id,
                    favIconUrl: self.favIconUrl,
                    doctype: type,
                    doc_name: (docData.doc_name).split('.').shift(),
                    // isGlobalDoc: isGlobalDoc,
                    // isEditPermission: docEditPermission
                };
                documentsDataService.setDocumentInfo(docdata);
                localStorage.setItem("selDocumentInfo", JSON.stringify(docdata));
            } else {
                notificationService.error("Uable to authenticate user");
            }
        }

        /*Get Office365 Discovery Details*/
        function getDiscoveryDetail() {
            documentsDataService.getDiscoveryData()
                .then(function (response) {
                    self.discoveryData = response;
                    localStorage.setItem("discovery", JSON.stringify(self.discoveryData));
                }, function (error) {
                    refreshToken();
                });
        }

        //Restrict user based on permissions 

        /* function getPermissions() {         
             var permissions = masterData.getPermissions();
       if(!angular.isUndefined(permissions)){
             self.docPermissions = _.filter(permissions[0].permissions, function (per) {
                 if (per.entity_id == '4') {
                     return per;
                 }
             });
         }
         else {
         var permissions = masterData.fetchMasterData();
         self.docPermissions = _.filter(permissions[0], function (per) {
                 if (per.entity_id == '4') {
                     return per;
                 }
             });
           }
         }*/


        /**
         * Get Document details
         */
        self.goOnline = function (documentId, matterId) {
            documentsDataService.getOneDocumentDetails(documentId, matterId)
                .then(function (response) {
                    self.documentDetails = response;
                    //self.documentDetails.document_ext = angular.lowercase(self.documentDetails.document_ext);
                    viewOnline(self.documentDetails, false, undefined, 'edit-document');
                }, function (error) {
                    notificationService.error("Unable to get document details");
                });
        }

        function openOfficeDoc() {
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
            var docEditPermission = self.docPermissions[0].E;
            var extType = getFileExtention(doc);
            var type = 'global';
            var javaAccessToken = localStorage.getItem("accessToken");
            if (utils.isNotEmptyVal(javaAccessToken) && self.officeOnlineStat) {
                var discData = JSON.parse(localStorage.getItem("discovery"));
                var wopiurl = documentsConstants.RESTAPI.wopiUrl1;
                (doc.matter_id != undefined) ? doc.matter_id = doc.matter_id : doc.matter_id = doc.matterid;
                if (doc.matter && doc.matter.matter_id) {
                    doc.matter_id = utils.isNotEmptyVal(doc.matter.matter_id) ? doc.matter.matter_id : '';
                }
                if ($state.current.name != 'documents') {
                    type = doc.matter_id;
                    wopiurl = wopiurl.replace("[type]", doc.matter_id);
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
                if ($state.current.name == 'documents') {
                    isGlobalDoc = true;
                }
                var docdata = {
                    docUrl: self.actionUrlToCall,
                    sessionId: javaAccessToken,
                    extType: extType,
                    doctype: type,
                    matterId: doc.matter_id,
                    documentId: utils.isNotEmptyVal(doc.documentid) ? doc.documentid : doc.doc_id,
                    isGlobalDoc: isGlobalDoc,
                    isOfficeView: self.OfficeFlag,
                    isEditPermission: docEditPermission,
                    favIconUrl: self.favIconUrl,
                    doc_name: utils.isNotEmptyVal(doc.documentname) ? utils.isNotEmptyVal(doc.documentname).split('.').shift() : (doc.doc_name).split('.').shift()
                };
                documentsDataService.setDocumentInfo(docdata);
                localStorage.setItem("selDocumentInfo", JSON.stringify(docdata));
                if (self.OfficeFlag) {
                    self.extFlag = self.OfficeFlag;
                    if ($state.current.name == 'documents') {
                        $state.go('global-office-view');
                    } else {
                        $state.go('office-view', { 'matterId': doc.matter.matter_id, 'documentId': doc.doc_id });
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
        // self.changeValues = documentAddHelper.changeValues;
        // self.changeAdjustment = documentAddHelper.changeAdjustment;
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
        self.setMoreInfoType = setMoreInfoType;
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

        self.setMoreInformationType = setMoreInformationType;

        self.openDateOfService = openDateOfService;
        self.openReturnableDate = openReturnableDate;
        self.addNewContactforDocumentMotion = addNewContactforDocumentMotion;
        self.setTypeMotion = setTypeMotion;
        self.setTypeMedicalBills = setTypeMedicalBills;


        self.getDocumentMotionContact = getDocumentMotionContact;
        self.formatTypeaheadDisplayForDocumentMotion = contactFactory.formatTypeaheadDisplay;
        self.documentMotionValidationError = false;
        self.selectedMotion = selectedMotion;
        self.isDatesValid = isDatesValid;
        self.checkContact = checkContact; // US#6288
        self.addNewMbillsContact = addNewMbillsContact;
        function isDatesValid() {
            if ($('#docincurredError').css("display") == "block" || $('#docservicestartDateError').css("display") == "block" || $('#docserviceendDateError').css("display") == "block" ||
                $('#docmedstartDateErr').css("display") == "block" ||
                $('#docmedendDateErr').css("display") == "block" || $('#filledDatedivError').css("display") == "block") {
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

        function calExpenseBill(payment_mode) {
            //check the previously set is edited value, in edit mode we ignore the first change in model value

            switch (payment_mode) {
                case 1: // paid
                case 2: // Unpaid
                case 3: // Partial

                    self.newExpenseInfo.paid_amount = utils.isEmptyVal(self.newExpenseInfo.paid_amount) ?
                        null : self.newExpenseInfo.paid_amount;
                    self.newExpenseInfo.outstandingamount = utils.isEmptyVal(self.newExpenseInfo.outstandingamount) ?
                        null : self.newExpenseInfo.outstandingamount;
                    self.newExpenseInfo.paid_amount = utils.isEmptyVal(self.newExpenseInfo.paid_amount) ?
                        null : self.newExpenseInfo.paid_amount;
                    changeExpenseValues(self.newExpenseInfo);

                    break;
            }
        }

        // Calculate/set values based on payment mode for Bill amount, tatal amount and outstanding amount.
        function changeExpenseValues(objectInfo) {
            switch (objectInfo.payment_mode) {
                case 1: // paid
                    objectInfo.paid_amount = objectInfo.expense_amount;
                    objectInfo.outstandingamount = utils.isNotEmptyVal(objectInfo.expense_amount) ? 0 : null;
                    break;
                case 2: // Unpaid
                    objectInfo.outstandingamount = objectInfo.expense_amount;
                    objectInfo.paid_amount = utils.isNotEmptyVal(objectInfo.expense_amount) ? 0 : null; // 
                    break;
                case 3: // Partial
                    if (utils.isNotEmptyVal(objectInfo.paid_amount) && utils.isNotEmptyVal(objectInfo.expense_amount)) {
                        // objectInfo.outstandingamount = (parseFloat(objectInfo.expense_amount) - parseFloat(objectInfo.paidamount)).toFixed(2);
                        objectInfo.outstandingamount = Math.round((parseFloat(objectInfo.expense_amount) - parseFloat(objectInfo.paid_amount)) * 100) / 100;

                    } else {
                        if (utils.isNotEmptyVal(objectInfo.expense_amount)) {
                            objectInfo.outstandingamount = objectInfo.expense_amount;
                        } else {
                            objectInfo.outstandingamount = utils.isNotEmptyVal(objectInfo.paid_amount) ? -objectInfo.paid_amount : null;
                        }
                    }
                    break;
            }
        }

        var docDataReceived = false;

        function calMedicalBill(paymentmode) {

            self.newMedicalBillInfo.adjustedamount = utils.isEmptyVal(self.newMedicalBillInfo.adjustedamount) ?
                null : self.newMedicalBillInfo.adjustedamount;
            self.newMedicalBillInfo.paidamount = utils.isEmptyVal(self.newMedicalBillInfo.paidamount) ?
                null : self.newMedicalBillInfo.paidamount;
            self.newMedicalBillInfo.totalamount = utils.isEmptyVal(self.newMedicalBillInfo.totalamount) ?
                null : self.newMedicalBillInfo.totalamount;
            self.newMedicalBillInfo.outstandingamount = utils.isEmptyVal(self.newMedicalBillInfo.outstandingamount) ?
                null : self.newMedicalBillInfo.outstandingamount;

            documentAddHelper.changeValues(self.newMedicalBillInfo);
            documentAddHelper.changeAdjustment(self.newMedicalBillInfo);

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
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            //postObj = matterFactory.setContactType(postObj);
            postObj.page_Size = 250
            return matterFactory.getContactsByName(postObj, self.JavaFilterAPIForContactList)
                .then(function (response) {
                    var data = response.data;
                    contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
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
            documentsDataService.getDocumentDetails(matterId, documentId)
                .then(function (response) {
                    /*Checking if received the proper responce or not*/
                    if (response.doc_name) {
                        self.singleDoc = response;
                        var doc_ext = getFileExtention(self.singleDoc);
                        self.singleDoc.doc_ext = doc_ext.toLowerCase();
                        processMoreInfoByType(self.singleDoc.more_info_type);
                        //self.editable = (response.islocked == "1") ? false : true;
                        getDocInfoForOffice(response);
                        setDocumentDetails();
                        response.more_info_type === "insurance" ? getPlaintiffsForDocument(response.matterid) : angular.noop();
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
            //self.singleDoc.currentlyusedby = self.singleDoc.currentlyusedby.trim();
            //self.singleDoc.document_ext = angular.lowercase(self.singleDoc.document_ext);
            var doc_ext = getFileExtention(self.singleDoc);
            doc_ext = angular.lowercase(doc_ext);
            self.singleDoc.doc_ext = doc_ext;
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
                    var documentNameEncoded = encodeURIComponent(self.singleDoc.documentname);
                    documentsDataService.viewdocument(self.singleDoc.doc_id).then(function (res) {
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
                    name: self.singleDoc.matter.matter_name,
                    matterid: self.singleDoc.matter.matter_id
                }];
                self.categorySelected = self.singleDoc.doc_category.doc_category_name;
                self.docModel.matter_id = self.singleDoc.matter.matter_id;
                //    }
                self.docModel.doc_name = self.singleDoc.doc_name;
                self.docModel.date_filed_date = (utils.isEmptyVal(self.singleDoc.date_filed_date) || self.singleDoc.date_filed_date == 0 || self.singleDoc.date_filed_date == null) ? '' : moment.unix(self.singleDoc.date_filed_date).format('MM/DD/YYYY');
                localStorage.setItem("documentName", self.docModel.doc_name);
                self.docModel.category = self.singleDoc.doc_category;
                self.docModel.needs_review = (self.singleDoc.needs_review == "1") ? true : false;
                self.docModel.showNeedReview = (self.singleDoc.needs_review == "1") ? true : false;
                self.docModel.review_user = self.docModel.review_user; // set review user id
                self.docModel.memo = utils.isNotEmptyVal(self.singleDoc.memo) ? self.singleDoc.memo : '';
                if (self.singleDoc.review_user) {
                    self.docModel.reviewUser = (self.singleDoc.review_user.length == 1 || self.singleDoc.review_user.length == 0) ? [self.singleDoc.review_user.toString()] : self.singleDoc.review_user.toString().split(",");
                } else {
                    self.docModel.reviewUser = '';
                }
                //self.singleDoc.plaintiff_name = $.trim(self.singleDoc.plaintiff_name);
                self.singleDoc.plaintiff_name = $.trim(self.singleDoc.associated_party.associated_party_name);

                if (self.singleDoc.associated_party && self.singleDoc.associated_party.associated_party_id == 0) {
                    self.docModel.associated_party = '';
                } else {
                    self.docModel.associated_party = utils.isNotEmptyVal(self.singleDoc.associated_party) ? self.singleDoc.associated_party : '';
                }

                // if (self.singleDoc.plaintiff_name != null && self.singleDoc.plaintiff_name != "") {
                //     self.docModel.associated_party_id = self.singleDoc.doc_plaintiff;
                // } else {
                //     self.docModel.associated_party_id = '';
                // }
                self.docModel.party_role = self.singleDoc.associated_party.associated_party_role;
                if (self.singleDoc.doc_tags != null && self.singleDoc.doc_tags != '') {
                    //var tagsOfDoc = self.singleDoc.doc_tags.split(' ');
                    angular.forEach(self.singleDoc.doc_tags, function (datavalue, datakey) {
                        self.docAddTags.push({
                            "name": datavalue.tag_name
                        });
                    });
                }


                // self.categorySelected = self.singleDoc.categoryname;
                self.moreInfoSelect = self.singleDoc.more_info_type;
                setMoreInfoType(self.singleDoc.more_info_type);
                self.setMoreInformationType(self.docModel.category.doc_category_id);
                self.moreinfoPrased = self.singleDoc.more_info_type;

                //self.docModel.associated_party_id = utils.isNotEmptyVal(self.singleDoc.moreInfo_parsed.associated_party_id) ?
                //self.singleDoc.moreInfo_parsed.associated_party_id : '';

                // self.docModel.party_role = utils.isNotEmptyVal(self.singleDoc.moreInfo_parsed.party_role) ?
                //     self.singleDoc.moreInfo_parsed.party_role : '';
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
            taskAgeDatalayer.getUsersInFirm()
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
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            //postObj = matterFactory.setContactType(postObj);
            postObj.page_Size = 250
            return matterFactory.getContactsByName(postObj, self.JavaFilterAPIForContactList)
                .then(function (response) {
                    var data = response.data;
                    contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
                    contactFactory.setNamePropForContactsOffDrupal(data);
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
            self.documentMotionDetailInfo.motion_date_of_service = moment.unix(todayDate).format("MM/DD/YYYY");
        }



        // ------------------ motion changes end ----------------------------------

        /*Get the Document Categories*/
        function getDocCategories() {
            documentsDataService.getDocumentCategories()
                .then(function (response) {
                    self.documentCategories = response;
                    self.setMoreInformationType(self.docModel.category);
                }, function (error) {
                    notificationService.error('document categories not loaded');
                });
        }

        /*Get all plaintiffs*/
        function getPlaintiffsForDocument(matterId) {
            var deferred = $q.defer();
            documentsDataService.getPlaintiffs(matterId)
                .then(function (response) {
                    _.forEach(response, function (item) {
                        item['associated_party_name'] = item.plaintiffName;
                        item['associated_party_id'] = item.plaintiffID;
                        item['associated_party_role'] = 1;
                    });
                    self.docPlaintiffs = response;
                    getDefendants(matterId);
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        /*Get all defendants*/
        function getDefendants(matterId) {
            allPartiesDataService.getDefendants(matterId)
                .then(function (res) {
                    self.docDefendants = res.data;
                    allPartiesDataService.getOtherPartiesBasic(matterId)
                        .then(function (res) {
                            self.docOtherparties = res.data;
                            self.docPlaintiffDefendants = getDocPlaintiffData(self.docPlaintiffs, self.docDefendants, self.docOtherparties);
                            setAssociatedParty(self.singleDoc, self.docPlaintiffDefendants);
                        })
                });
        }

        function setAssociatedParty(docInfo, partyData) {
            if (utils.isNotEmptyVal(docInfo.plaintiff_name)) {
                if (docInfo.doc_category || docInfo.categoryid) {
                    if (docInfo.doc_category.doc_category_id == "10" || docInfo.categoryid == "10") {
                        var party = _.find(partyData, function (party) {
                            return party.type == parseInt(docInfo.party_role) && (party.id == docInfo.doc_plaintiff)
                        });
                        docInfo.assosiatedPartyName = angular.isDefined(party) ? utils.isNotEmptyVal(party.name) ? party.name : '' : '';
                    } else if (docInfo.more_info_type == "insurance") {
                        var party = _.find(partyData, function (party) {
                            return party.type == parseInt(docInfo.associated_party.associated_party_role) && (party.id == docInfo.associated_party.associated_party_id)
                        });
                        docInfo.assosiatedPartyName = utils.isNotEmptyVal(party.name) ? party.name : '';

                    } else {

                        var party = _.find(partyData, function (party) {
                            return party.type == parseInt(docInfo.associated_party.associated_party_role) && (party.id == docInfo.associated_party.associated_party_id)
                        });
                        docInfo.assosiatedPartyName = (party && party.name) ? party.name : '';

                    }
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

            _.forEach(plaintiffDefendantsArray, function (item) {
                item['associated_party_id'] = item.id,
                    item['associated_party_role'] = item.type,
                    item['associated_party_name'] = item.name
            });

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
            // if (insuranceObj.category.doc_category_id == 10 || insuranceObj.category == 10) {
            //     //self.docModel.associated_party_id = insuranceObj.docPlaintiff
            //     insuranceObj.party_role = 1;
            // } else {
            //     insuranceObj.party_role = utils.isNotEmptyVal(selectedItem) ? selectedItem.type : '';
            // }
            insuranceObj.party_role = utils.isNotEmptyVal(selectedItem) ? selectedItem.type : '';

        }

        /*open Docuemt in Office */
        function openDocumentEdit() {
            if (globalConstants.webSocketServiceEnable == true) {
                connectionCloseForSocket();
            }
            $state.go('global-office-edit');
            localStorage.setItem("prevState", 'global-office-edit');
        }

        /*Generate download link for documents*/
        function generateDocLink() {
            documentsDataService.downloadDocument(documentId)
                .then(function (response) {
                    if (response && response && response != '') {
                        utils.downloadFile(response, self.singleDoc.doc_name, "Content-Type");

                    } else {
                        notificationService.error('Unable to download document');
                    }

                }, function (error) {
                    notificationService.error('document categories not loaded');
                });
        }

        /*Replace document block display*/
        function replaceDoc() {
            self.docModel.doc_name = '';
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

        /*Single File edit / Version upload  */
        function initializeSingleFileDropnzone() {
            self.editdropzoneObj = new Dropzone("#singledropzone", {
                url: documentsConstants.RESTAPI.updateDocument1 + parseInt(self.documentId),
                method: "PUT",
                withCredentials: true,
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
                    if (file.size == 0) {
                        notificationService.error("Cannot upload 0kb document");
                        removeUploadingDocument();
                        return;
                    }
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
                                self.docModel.doc_name = file.name;
                                localStorage.setItem("documentName", self.singleFileName);
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
                    var displayError = true;
                    var receivedSizeCheck = checkfileSize(file.size);
                    if (receivedSizeCheck === 0) {
                        notificationService.error("Size of file should not be greater than 500 MB");
                    } else if (message === "You can not upload any more files.") {
                        notificationService.error("You can not upload more than one file in single file upload");
                        displayError = false;
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
                        if (message.message != '') {
                            notificationService.error(message.message);
                        } else {
                            if (receivedSizeCheck == 0) {
                                notificationService.error("Size of file should not be greater than 500 MB");
                            } else {
                                notificationService.error("Document not updated. please try again.");
                            }
                        }
                        usSpinnerService.stop('pageSpinner');
                    }
                    if (displayError) {
                        clearSetInterval();
                        toggleButtons(true);
                        $scope.$apply();
                        self.docModel.doc_name = self.singleDoc.doc_name;
                    }
                },
                headers: {
                    'Authorization': "Bearer " + localStorage.getItem('accessToken')
                },
                dictResponseError: 'Error while uploading file!',
                previewTemplate: '<span></span>'
            });
        }

        function processMoreInfoByType(moreInfo) {
            switch (moreInfo) {
                case 'motion':
                    //self.singleDoc.more_info_type === 'motion' ? setMotion() : selectedMotion();
                    self.singleDoc.motion.motion_date_of_service_copy = angular.copy(self.singleDoc.motion.motion_date_of_servic);
                    self.singleDoc.motion.motion_date_returnable_copy = angular.copy(self.singleDoc.motion.motion_date_returnable);
                    break;
                case 'liens':
                    self.singleDoc.lien.date_of_claim_copy = angular.copy(self.singleDoc.lien.date_of_claim);
                    self.singleDoc.lien.date_paid_copy = angular.copy(self.singleDoc.lien.date_paid);
                    break;
                case 'medicalbill':
                    self.singleDoc.medical_bill.service_start_date_copy = angular.copy(self.singleDoc.medical_bill.service_start_date);
                    self.singleDoc.medical_bill.service_end_date_copy = angular.copy(self.singleDoc.medical_bill.service_end_date);
                    break;
                case 'insurance':
                    break;
                case 'expense':
                    self.singleDoc.expense.incurred_date_copy = angular.copy(self.singleDoc.expense.incurred_date);
                    break;
                case 'medicalrecord':
                    self.singleDoc.medical_information.service_start_date_copy = angular.copy(self.singleDoc.medical_information.service_start_date);
                    self.singleDoc.medical_information.service_end_date_copy = angular.copy(self.singleDoc.medical_information.service_end_date);
                    self.singleDoc.medical_information.date_requested_copy = angular.copy(self.singleDoc.medical_information.date_requested);
                    break;
            }
        }

        function setMoreInfoType(moreInfo) {
            switch (moreInfo) {
                case 'motion':
                    self.singleDoc.more_info_type === 'motion' ? setMotion() : selectedMotion();
                    break;
                case 'liens':
                    self.newLiensInfo = {};
                    self.singleDoc.more_info_type === 'liens' ? angular.extend(self.newLiensInfo, self.singleDoc.lien) : angular.noop();
                    if (self.singleDoc.lien) {
                        self.singleDoc.lien.date_of_claim = (utils.isEmptyVal(self.singleDoc.lien.date_of_claim_copy)) ? "" : moment.unix(self.singleDoc.lien.date_of_claim_copy).utc().format('MM/DD/YYYY');
                        self.singleDoc.lien.date_paid = (utils.isEmptyVal(self.singleDoc.lien.date_paid_copy)) ? "" : moment.unix(self.singleDoc.lien.date_paid_copy).utc().format('MM/DD/YYYY');
                    }
                    break;
                case 'medicalbill':
                    self.paymentBtns = documentAddHelper.paymentBtns();
                    self.newMedicalBillInfo = {};
                    if (self.singleDoc.medical_bill) {
                        if (utils.isNotEmptyVal(self.singleDoc.medical_bill.bill_amount) && utils.isNotEmptyVal(self.singleDoc.medical_bill.adjusted_amount)) {
                            self.singleDoc.medical_bill.adjustment_amount = Math.round((parseFloat(angular.copy(self.singleDoc.medical_bill.bill_amount)) - parseFloat(angular.copy(self.singleDoc.medical_bill.adjusted_amount))) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000

                        }
                    }
                    self.singleDoc.more_info_type === 'medicalbill' ? angular.extend(self.newMedicalBillInfo, self.singleDoc.medical_bill) : angular.noop();
                    if (self.singleDoc.medical_bill) {
                        if (utils.isEmptyVal(self.singleDoc.medical_bill.service_start_date_copy) && utils.isEmptyVal(self.singleDoc.medical_bill.service_end_date_copy)) {
                            self.singleDoc.medical_bill.service_start_date = '';
                            self.singleDoc.medical_bill.service_end_date = '';
                        } else {
                            self.singleDoc.medical_bill.service_start_date = (utils.isEmptyVal(self.singleDoc.medical_bill.service_start_date_copy) || (self.singleDoc.medical_bill.service_start_date_copy == 0)) ? "" : moment.unix(self.singleDoc.medical_bill.service_start_date_copy).utc().format('MM/DD/YYYY');
                            self.singleDoc.medical_bill.service_end_date = (utils.isEmptyVal(self.singleDoc.medical_bill.service_end_date_copy) || (self.singleDoc.medical_bill.service_end_date_copy == 0)) ? "" : moment.unix(self.singleDoc.medical_bill.service_end_date_copy).utc().format('MM/DD/YYYY');
                        }
                    }
                    //self.newMedicalBillInfo.service_end_date = self.singleDoc.medical_bill.service_end_date;
                    self.newMedicalBillInfo.payment_mode = self.singleDoc.medical_bill ? self.singleDoc.medical_bill.payment_mode : 2;
                    break;
                case 'insurance':
                    self.newInsauranceInfo = {};
                    self.singleDoc.more_info_type === 'insurance' ? angular.extend(self.newInsauranceInfo, self.singleDoc.insurance) : angular.noop();
                    self.excessConfirmed = [{
                        label: "Yes",
                        value: "yes"
                    }, {
                        label: "No",
                        value: "no"
                    }];
                    break;
                case 'expense':
                    self.newExpenseInfo = {};
                    self.disbursableBtns = [{
                        label: "Yes",
                        value: 1
                    }, {
                        label: "No",
                        value: 0
                    }];
                    self.paymentBtns = [{
                        label: "Paid",
                        value: 1
                    }, {
                        label: "Unpaid",
                        value: 2
                    }, {
                        label: "Partial",
                        value: 3
                    }];
                    matterDetailsService.getExpenseType()
                        .then(function (response) {
                            self.expenseTypes = response;
                        });
                    self.singleDoc.more_info_type === 'expense' ? angular.extend(self.newExpenseInfo, self.singleDoc.expense) : angular.noop();
                    if (self.singleDoc.expense) {
                        self.newExpenseInfo.incurred_date = utils.isNotEmptyVal(self.singleDoc.expense.incurred_date_copy) ? moment.unix(self.singleDoc.expense.incurred_date_copy).utc().format('MM/DD/YYYY') : '';
                    }
                    self.newExpenseInfo.payment_mode = self.singleDoc.expense ? self.singleDoc.expense.payment_mode : 2;
                    break;
                case 'medicalrecord':
                    self.newMedicalInfo = {};
                    self.singleDoc.more_info_type === 'medicalrecord' ? angular.extend(self.newMedicalInfo, self.singleDoc.medical_information) : angular.noop();
                    if (self.singleDoc.medical_information) {
                        self.singleDoc.medical_information.service_start_date = (utils.isEmptyVal(self.singleDoc.medical_information.service_start_date_copy) || (self.singleDoc.medical_information.service_start_date_copy == 0)) ? "" : moment.unix(self.singleDoc.medical_information.service_start_date_copy).utc().format('MM/DD/YYYY');
                        self.singleDoc.medical_information.service_end_date = (utils.isEmptyVal(self.singleDoc.medical_information.service_end_date_copy) || (self.singleDoc.medical_information.service_end_date_copy == 0)) ? "" : moment.unix(self.singleDoc.medical_information.service_end_date_copy).utc().format('MM/DD/YYYY');
                        self.singleDoc.medical_information.date_requested = (utils.isEmptyVal(self.singleDoc.medical_information.date_requested_copy) || (self.singleDoc.medical_information.date_requested_copy == 0)) ? "" : moment.unix(self.singleDoc.medical_information.date_requested_copy).utc().format('MM/DD/YYYY');
                        self.newMedicalInfo.memo = self.singleDoc.medical_information.memo;
                    }
                    break;
            }
        }

        function setMotion() {
            var motion = {};
            self.moreInfoSelect = self.singleDoc.more_info_type;
            motion = getMotionDetails(self.singleDoc.motion);

            self.documentMotionDetailInfo.motion_title = motion.motion_title;
            self.documentMotionDetailInfo.motion_date_of_service = motion.motion_date_of_service;
            self.documentMotionDetailInfo.motion_date_returnable = motion.motion_date_returnable;
            self.documentMotionDetailInfo.motion_type = motion.motion_type;
            self.documentMotionDetailInfo.motion_status = motion.motion_status;
            //self.documentMotionDetailInfo.motion_judgeid = motion.motion_judgeid;
            self.documentMotionDetailInfo.motion_description = motion.motion_description;
            self.documentMotionDetailInfo.motion_on_by = motion.motion_on_by;
            self.documentMotionDetailInfo.motion_id = motion.motion_id;
            self.documentMotionDetailInfo.contact = {};
            self.documentMotionDetailInfo.contact.contactid = motion.motion_judgeid;
            self.documentMotionDetailInfo.contact.firstname = motion.judge_firstname;
            self.documentMotionDetailInfo.contact.lastname = motion.judge_lastname;
            self.documentMotionDetailInfo.contact.contact_type = angular.isDefined(motion.contact_type) ? motion.contact_type : '';
        }

        function getMotionDetails(motionDetails) {
            var motion = {};
            motion.motion_title = motionDetails.motion_title;
            motion.motion_datecreated = motionDetails.motion_datecreated;
            if (angular.isDefined(motionDetails.motion_date_of_service)) {
                if (motionDetails.motion_date_of_service != '' && motionDetails.motion_date_of_service != 0 && motionDetails.motion_date_of_service != null) {
                    motion.motion_date_of_service = moment.unix(motionDetails.motion_date_of_service).utc().format('MM/DD/YYYY');
                } else {
                    motion.motion_date_of_service = '';
                }
            } else {
                motion.motion_date_of_service = '';
            }

            if (angular.isDefined(motionDetails.motion_date_returnable)) {
                if (motionDetails.motion_date_returnable != '' && motionDetails.motion_date_returnable != 0 && motionDetails.motion_date_returnable != null) {
                    motion.motion_date_returnable = moment.unix(motionDetails.motion_date_returnable).utc().format('MM/DD/YYYY');
                } else {
                    motion.motion_date_returnable = '';
                }
            } else {
                motion.motion_date_returnable = '';
            }

            motion.motion_description = motionDetails.motion_description;
            motion.motion_id = motionDetails.motion_id;
            motion.motion_judgeid = motionDetails.motion_judge_id;
            motion.judge_firstname = motionDetails.judge_first_name;
            motion.judge_lastname = motionDetails.judge_last_name;
            motion.contact_type = motionDetails.is_global == 1 ? "Global" : "Local";
            //motion.motion_on_by = motionDetails.motion_on_by;
            motion.motion_status = (motionDetails.motion_status == 0) ? '' : motionDetails.motion_status.toString();
            motion.motion_type = (motionDetails.motion_type == 0) ? ' ' : motionDetails.motion_type.toString();



            self.motionToBeSelected = [{
                "value": "motionByUs",
                "label": "Motion By Us"
            }, {
                "value": "motionOnUs",
                "label": "Motion On Us"
            }];
            if (motionDetails.motion_on_by == "on") {
                motion.motion_on_by = "motionOnUs";
            } else {
                motion.motion_on_by = "motionByUs";
            }

            var mstData = angular.copy(masterData.getMasterData());
            if (angular.isDefined(mstData) && angular.isDefined(mstData.motion_statuses)) {
                self.motionStatus = mstData.motion_statuses;
            }

            if (angular.isDefined(mstData) && angular.isDefined(mstData.motion_types)) {
                self.motionType = mstData.motion_types;
            }

            return motion;

        }

        function selectedMotion() {
            if (angular.isDefined(self.documentMotionDetailInfo) &&
                angular.isUndefined(self.documentMotionDetailInfo.motion_date_of_service) && (self.documentMotionDetailInfo.motion_date_of_service == '' || self.documentMotionDetailInfo.motion_date_of_service == null)) {
                if (!(self.moreInfoSelect == 'motion')) {
                    displayDateOfService();
                }
            }

            self.motionToBeSelected = [{
                "value": "motionByUs",
                "label": "Motion By Us"
            },
            {
                "value": "motionOnUs",
                "label": "Motion On Us"
            }
            ];

            if (self.documentMotionDetailInfo.motion_on_by == '' ||
                self.documentMotionDetailInfo.motion_on_by == null ||
                angular.isUndefined(self.documentMotionDetailInfo.motion_on_by)) {
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
                    self.documentMotionDetailInfo.motion_type = "";
                }

            }
            if (self.documentMotionDetailInfo.motion_date_returnable == '' && self.documentMotionDetailInfo.motion_date_returnable == null) {
                self.documentMotionDetailInfo.motion_date_returnable = '';
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
                if (utils.isEmptyVal(data.insurance_provider) || utils.isNotEmptyVal(data.insurance_provider.contact_id)) {
                    data.insurance_provider;
                } else {
                    notificationService.error("Invalid Contact Selected");
                    return true;
                }
            }
            if (data.insurance_adjuster) {
                if (utils.isEmptyVal(data.insurance_adjuster) || utils.isNotEmptyVal(data.insurance_adjuster.contact_id)) {
                    data.insurance_adjuster;
                } else {
                    notificationService.error("Invalid Contact Selected");
                    return true;
                }
            }
            if (data.lien_adjuster) {
                if (utils.isEmptyVal(data.lien_adjuster) || utils.isNotEmptyVal(data.lien_adjuster.contact_id)) {
                    data.lien_adjuster;
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
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send("Connection closed");
                socket.close();
            }
        }

        function processDocuments() {
            if (globalConstants.webSocketServiceEnable == true) {
                connectionCloseForSocket();
            }
            //To check valid Service Provider for Edit in Medical Bills US#6288
            if (self.docModel.category.doc_category_id == 8 || self.docModel.category == 8) {
                if (utils.isNotEmptyVal(self.newMedicalBillInfo)) {
                    if (utils.isNotEmptyVal(self.newMedicalBillInfo.medical_provider)) {
                        self.newMedicalBillInfo.medical_provider_id;
                    }
                } else {
                    notificationService.error("Invalid Contact Selected");
                    return;
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
            //To check valid Service Provider and Physician name for Edit in Medical Records US#6288
            if (self.docModel.category.doc_category_id == 7 || self.docModel.category == 7) {
                if (utils.isEmptyVal(self.newMedicalInfo.physician) || utils.isNotEmptyVal(self.newMedicalInfo.physician.contact_id)) {
                    self.newMedicalInfo.physician;
                } else {
                    notificationService.error("Invalid Contact Selected");
                    return;
                }
                if (utils.isEmptyVal(self.newMedicalInfo.medical_provider) || utils.isNotEmptyVal(self.newMedicalInfo.medical_provider.contact_id)) {
                    self.newMedicalInfo.medical_provider;
                } else {
                    notificationService.error("Invalid Contact Selected");
                    return;
                }
            }
            //To check validation on contacts US#6288
            if (self.docModel.category.doc_category_id == 22 || self.docModel.category == 22) {
                if (utils.isEmptyVal(self.newLiensInfo.lien_holder) || utils.isNotEmptyVal(self.newLiensInfo.lien_holder.contact_id)) {
                    self.newLiensInfo.lien_holder;
                } else {
                    notificationService.error("Invalid Contact Selected");
                    return;
                }
                if (self.newLiensInfo) {
                    if (checkContact(self.newLiensInfo)) {
                        return;
                    }
                }
            }
            //To check validation on contacts US#6288
            if (self.docModel.category.doc_category_id == 6 || self.docModel.category == 6) {
                if (utils.isEmptyVal(self.newInsauranceInfo.insured_party) || utils.isNotEmptyVal(self.newInsauranceInfo.insured_party.contact_id)) {
                    self.newInsauranceInfo.insured_party;
                } else {
                    notificationService.error("Invalid Contact Selected");
                    return;
                }
                //Bug#9271
                if (parseFloat(self.newInsauranceInfo.policy_limit) > parseFloat(self.newInsauranceInfo.policy_limit_max)) {
                    return notificationService.error("Policy limit range is incorrect.");
                }
                if (self.newInsauranceInfo) {
                    if (checkContact(self.newInsauranceInfo)) {
                        return;
                    }
                }
            }
            //To check Validation for Expense
            if (self.docModel.category.doc_category_id == 15 || self.docModel.category == 15) {
                var expense_amount = self.newExpenseInfo ? parseFloat(self.newExpenseInfo.expense_amount) : null;
                var paidamount = self.newExpenseInfo ? parseFloat(self.newExpenseInfo.paid_amount) : null;
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
            // check whether needs review and reviewer is selected.
            if (utils.isEmptyVal(self.docModel.reviewUser) && self.docModel.needs_review == true) {
                notificationService.error('Please select a reviewer from user list.');
                return false;
            }

            if (utils.isEmptyVal(self.docModel.doc_name)) {
                self.docModel.doc_name = localStorage.getItem("documentName");
                //notificationService.error("Document name is required");
                //return false;
            }

            if (utils.isEmptyVal(self.docModel.category)) {
                notificationService.error("Category is required");
                return false;
            }
            self.documentMotionValidationError = false;
            var singledovParams = createPrams();
            if (singledovParams === false) {
                return false;
            }
            stripScriptTag(singledovParams);

            if (self.uploaddoc == true && utils.isNotEmptyVal(self.singleFileName)) {
                usSpinnerService.spin('pageSpinner');
                self.editdropzoneObj.options.params = singledovParams;
                sessionalive = setInterval(keepSessionalive, 900000);
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
                    
                    var newSingleDovParams = {
                        "doc_id": singledovParams.doc_id,
                        "doc_name": singledovParams.documentname,
                        "doc_category": { "doc_category_id": singledovParams.categoryid },
                        "associated_party": {
                            "associated_party_id": singledovParams.associated_party_id,
                            "associated_party_role": singledovParams.party_role
                        },
                        "needs_review": singledovParams.needs_review,
                        "review_user": singledovParams.review_user,
                        "uploadtype": "version",
                        "matter": { "matter_id": singledovParams.matter_id },
                        "memo": singledovParams.memo,
                        "tags_String": singledovParams.tags_String,
                        "more_info_type": singledovParams.more_info_type,
                        "more_info": singledovParams.more_info,
                        "date_filed_date": singledovParams.date_filed_date
                    }
                    documentsDataService.updateDocument(newSingleDovParams)
                        .then(function (response) {
                            if (response && response.message) {
                                notificationService.error(response.message);
                            } else if (self.singleDoc.doc_name) {
                                self.singleDoc.doc_name = self.docModel.doc_name;
                                notificationService.success(self.singleDoc.doc_name + ' updated successfully.');
                                gotodocList();
                            } else {
                                notificationService.success('Document updated successfully.');
                                gotodocList();
                            }

                        }, function (error) {
                            // console.log(error);
                            if (utils.isNotEmptyVal(error.data)) {
                                if(error.status == 610){
                                    notificationService.error(error.data.message);
                                } else{
                                    notificationService.error(error.data.message);
                                }
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

        //US#7853 
        function insuranceInfo() {
            if (utils.isEmptyVal(self.newInsauranceInfo.insured_party) && utils.isEmptyVal(self.newInsauranceInfo.memo) && utils.isEmptyVal(self.newInsauranceInfo.insurance_provider) && utils.isEmptyVal(self.newInsauranceInfo.insurance_adjuster) && utils.isEmptyVal(self.newInsauranceInfo.insurance_type) && utils.isEmptyVal(self.newInsauranceInfo.policy_limit) && utils.isEmptyVal(self.newInsauranceInfo.policy_limit_max) && utils.isEmptyVal(self.newInsauranceInfo.policy_number) && utils.isEmptyVal(self.newInsauranceInfo.claim_number)) {
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
                && utils.isEmptyVal(self.newExpenseInfo.expense_type) && utils.isEmptyVal(self.newExpenseInfo.incurred_date) && utils.isEmptyVal(self.newExpenseInfo.expense_amount)) {
                self.moreInfoSelect = '';
            }
        }


        function liensInfo() {
            if (utils.isEmptyVal(self.newLiensInfo.lien_holder) && utils.isEmptyVal(self.newLiensInfo.memo) && utils.isEmptyVal(self.newLiensInfo.claim_number) && utils.isEmptyVal(self.newLiensInfo.insurance_provider) && utils.isEmptyVal(self.newLiensInfo.date_paid) && utils.isEmptyVal(self.newLiensInfo.lien_amount) && utils.isEmptyVal(self.newLiensInfo.lien_adjuster) && utils.isEmptyVal(self.newLiensInfo.due_amount) && utils.isEmptyVal(self.newLiensInfo.date_of_claim)) {
                self.moreInfoSelect = '';
            }
        }

        function motionInfo() {
            if (self.documentMotionDetailInfo.motion_on_by == "motionByUs" && (utils.isEmptyVal(self.documentMotionDetailInfo.motion_date_returnable)) && (utils.isEmptyVal(self.documentMotionDetailInfo.motion_date_of_service)) && (self.documentMotionDetailInfo.motion_status == '') && (self.documentMotionDetailInfo.motion_type == '') && utils.isEmptyVal(self.documentMotionDetailInfo.motion_description) && utils.isEmptyVal(self.documentMotionDetailInfo.motion_title) && utils.isEmptyVal(self.documentMotionDetailInfo.is_global)) {
                self.moreInfoSelect = '';
            }
        }

        /* Create paramter to send in edit document service */
        function createPrams() {
            var moreInfo = {};
            var singledovParams = {};
            singledovParams.documentname = self.docModel.doc_name;
            singledovParams.doc_id = self.singleDoc.doc_id;
            if (self.docModel.category.doc_category_id == 7 || self.docModel.category == 7) {
                singledovParams.date_filed_date = '';
            } else {
                singledovParams.date_filed_date = utils.isNotEmptyVal(self.docModel.date_filed_date) ? moment.utc(moment(angular.copy(self.docModel.date_filed_date)).startOf('day')).unix() : '';
            }
            singledovParams.categoryid = self.docModel.category.doc_category_id || self.docModel.category;
            singledovParams.associated_party_id = utils.isNotEmptyVal(self.docModel.associated_party) ? parseInt(self.docModel.associated_party.associated_party_id) : '';
            singledovParams.party_role = utils.isNotEmptyVal(self.docModel.associated_party) ? self.docModel.associated_party.associated_party_role : '';
            singledovParams.needs_review = self.docModel.needs_review ? 1 : 0;
            singledovParams.review_user = utils.isNotEmptyVal(self.docModel.reviewUser) ? self.docModel.reviewUser.toString() : ''; //self.docModel.reviewUser.toString(); // assign reviewer
            singledovParams.uploadtype = 'version';

            singledovParams.matter_id = self.docModel.matter_id ? parseInt(self.docModel.matter_id) : parseInt(self.matterId);
            // singledovParams.associated_party_id = angular.isUndefined(self.docModel.associated_party_id) ? '' : self.docModel.associated_party_id;
            // singledovParams.party_role =  utils.isNotEmptyVal(self.docModel.party_role) ? self.docModel.party_role : "";
            // singledovParams.is_global = utils.isNotEmptyVal(self.singleDoc.moreInfo_parsed.is_global) ? self.singleDoc.moreInfo_parsed.is_global : 0;

            // ? self.docModel.matterid : self.matterId;
            if (singledovParams.categoryid == 10) {
                motionInfo();
            }
            //US#7853 check category and send moreInfoselect for this categories as  empty 
            if (singledovParams.categoryid == 6 || singledovParams.categoryid == 7 || singledovParams.categoryid == 8 || singledovParams.categoryid == 15 || singledovParams.categoryid == 22) {
                switch (singledovParams.categoryid) {
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
                // var obj = {};
                //angular.isDefined(self.docModel.memo) ? singledovParams.memo = self.docModel.memo : singledovParams.memo = '';
                // angular.isDefined(self.docModel.memo) ? singledovParams.memo = JSON.stringify(obj) : singledovParams.memo = '';
                angular.isDefined(self.memo) ? singledovParams.memo = self.memo : singledovParams.memo = '';
                utils.isNotEmptyVal(self.docModel.memo) ? singledovParams.memo = self.docModel.memo : singledovParams.memo = '';
            }
            singledovParams.tags_String = _.pluck(self.docAddTags, 'name');
            singledovParams.tags_String = utils.isEmptyVal(singledovParams.tags_String) ? "" : singledovParams.tags_String.toString();
            singledovParams.more_info_type = angular.isUndefined(self.moreInfoSelect) ? '' : self.moreInfoSelect;

            // if (angular.isUndefined(self.moreInfoSelect)) {
            //     singledovParams.moreInfoSelect = '';
            // } else {
            //     singledovParams.moreInfoSelect = self.moreInfoSelect;
            // }

            var isMoreInfoValid = setMoreInfo(moreInfo);
            if (isMoreInfoValid === false) {
                return false;
            }

            singledovParams.more_info = utils.isEmptyVal(self.moreInfoSelect) ? '' : JSON.stringify(moreInfo);

            return singledovParams;
        }

        function setMoreInfo(moreInfo) {
            switch (self.moreInfoSelect) {
                case "motion":
                    setMoreInfoForMotion(moreInfo);
                    break;
                case "liens":
                    moreInfo.associated_party_id = utils.isNotEmptyVal(self.docModel.associated_party) ? parseInt(self.docModel.associated_party.associated_party_id) : "";
                    moreInfo.party_role = utils.isNotEmptyVal(self.docModel.associated_party) ? self.docModel.associated_party.associated_party_role : 0;
                    moreInfo.matter_id = self.globalDocview ? parseInt(self.matterId) : parseInt(self.docModel.matter_id)
                    moreInfo.liens_documentid = utils.isNotEmptyVal(self.newLiensInfo.liens_documentid) ? self.newLiensInfo.liens_documentid : "";
                    moreInfo.lien_id = utils.isNotEmptyVal(self.newLiensInfo) ? self.newLiensInfo.lien_id : "";
                    var isLiensAmountValid = documentAddHelper.setMoreInfoForLiens(moreInfo, self.newLiensInfo);

                    if (isLiensAmountValid === false) {
                        return false;
                    } else {
                        break;
                    }
                    break;
                case 'medicalbill':
                    // var medinfoforsave = self.newMedicalBillInfo;
                    // medinfoforsave.adjusted_amount = utils.isNotEmptyVal(medinfoforsave.adjustedamount) ? medinfoforsave.adjustedamount : null;
                    // medinfoforsave.bill_amount = utils.isNotEmptyVal(medinfoforsave.bill_amount) ? medinfoforsave.bill_amount : null;
                    // medinfoforsave.outstanding_amount = utils.isNotEmptyVal(medinfoforsave.outstanding_amount) ? medinfoforsave.outstanding_amount : null;
                    // medinfoforsave.paid_amount = utils.isNotEmptyVal(medinfoforsave.paid_amount) ? medinfoforsave.paid_amount : null;

                    // var isDateRangeValid = documentAddHelper.setMoreInfoForMedicalBill(moreInfo, medinfoforsave);
                    // if (isDateRangeValid === false) {
                    //     return false;
                    // } else {
                    //     break;
                    // }
                    var isDateRangeValid = documentAddHelper.setMoreInfoForMedicalBill(moreInfo, self.newMedicalBillInfo);
                    moreInfo.medical_bill_id = utils.isNotEmptyVal(self.newMedicalBillInfo) ? self.newMedicalBillInfo.medical_bill_id : "";
                    moreInfo.associated_party_id = utils.isNotEmptyVal(self.docModel.associated_party) ? parseInt(self.docModel.associated_party.associated_party_id) : "";
                    moreInfo.party_role = utils.isNotEmptyVal(self.docModel.associated_party) ? self.docModel.associated_party.associated_party_role : 0;
                    moreInfo.matter_id = self.globalDocview ? parseInt(self.matterId) : parseInt(self.docModel.matter_id)
                    if (isDateRangeValid === false) { return false; } else { break; }
                    break;
                case 'insurance':
                    documentAddHelper.setMoreInfoForInsurance(moreInfo, self.newInsauranceInfo);
                    moreInfo.insurance_id = utils.isNotEmptyVal(self.newInsauranceInfo) ? self.newInsauranceInfo.insurance_id : "";
                    moreInfo.associated_party_id = utils.isNotEmptyVal(self.docModel.associated_party) ? parseInt(self.docModel.associated_party.associated_party_id) : "";
                    moreInfo.party_role = utils.isNotEmptyVal(self.docModel.associated_party) ? self.docModel.associated_party.associated_party_role : 0;
                    moreInfo.matter_id = self.globalDocview ? parseInt(self.matterId) : parseInt(self.docModel.matter_id);
                    moreInfo.insurance_documentid = utils.isNotEmptyVal(self.newInsauranceInfo.insurance_documentid) ? self.newInsauranceInfo.insurance_documentid : "";
                    break;
                case 'expense':
                    var expenseinfoforsave = angular.copy(self.newExpenseInfo);
                    documentAddHelper.setMoreInfoForExpense(moreInfo, expenseinfoforsave);
                    moreInfo.associated_party.associated_party_id = utils.isNotEmptyVal(self.docModel.associated_party) ? parseInt(self.docModel.associated_party.associated_party_id) : "";
                    moreInfo.associated_party.associated_party_role = utils.isNotEmptyVal(self.docModel.associated_party) ? self.docModel.associated_party.associated_party_role : 0;
                    moreInfo.expense_document_id = utils.isNotEmptyVal(self.newExpenseInfo.expense_document_id) ? parseInt(self.newExpenseInfo.expense_document_id) : "";
                    moreInfo.expense_id = utils.isNotEmptyVal(self.newExpenseInfo) ? self.newExpenseInfo.expense_id : '';
                    delete moreInfo.matter;
                    delete moreInfo.created_by;
                    delete moreInfo.created_date;
                    delete moreInfo.modified_by;
                    delete moreInfo.modified_date;
                    delete moreInfo.contact;
                    delete moreInfo.incurred_date_copy;
                    break;
                case 'medicalrecord':
                    moreInfo.matter_id = self.globalDocview ? parseInt(self.matterId) : parseInt(self.docModel.matter_id)
                    moreInfo.medical_information_id = utils.isNotEmptyVal(self.newMedicalInfo) ? self.newMedicalInfo.medical_information_id : '';
                    moreInfo.date_requested = utils.isNotEmptyVal(self.newMedicalInfo) ? self.newMedicalInfo.date_requested : '';
                    moreInfo.associated_party_id = utils.isNotEmptyVal(self.docModel.associated_party) ? parseInt(self.docModel.associated_party.associated_party_id) : '';
                    moreInfo.party_role = utils.isNotEmptyVal(self.docModel.associated_party) ? self.docModel.associated_party.associated_party_role : 0;
                    moreInfo.medical_info_document_id = utils.isNotEmptyVal(self.newMedicalInfo.medical_info_document_id) ? parseInt(self.newMedicalInfo.medical_info_document_id) : "";
                    var isMedicalDateRangeValid = documentAddHelper.setMoreInfoForMedicalInfo(moreInfo, self.newMedicalInfo);
                    if (isMedicalDateRangeValid === false) {
                        return false;
                    } else {
                        break;
                    }
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
            // moreInfo.party_role = angular.isUndefined(self.docModel.party_role) ? '' : self.docModel.party_role;
            // moreInfo.plaintiffid = angular.isUndefined(self.docModel.associated_party_id) ? '' : self.docModel.associated_party_id;
            // moreInfo.matterid = matterId;
        }

        function setMoreInfoForMotion(moreInfo) {
            moreInfo.associated_party = { associated_party_id: '', associated_party_role: '' };
            validateMotionDate(self.documentMotionDetailInfo.motion_date_of_service, self.documentMotionDetailInfo.motion_date_returnable);
            moreInfo.motion_id = (self.documentMotionDetailInfo && self.documentMotionDetailInfo.motion_id) ? self.documentMotionDetailInfo.motion_id : "";
            moreInfo.motion_title = (self.documentMotionDetailInfo && self.documentMotionDetailInfo.motion_title) ? self.documentMotionDetailInfo.motion_title : "";
            moreInfo.motion_date_of_service = (utils.isEmptyVal(self.dateOfServiceInUTC)) ? "" : utils.getUTCTimeStamp(self.dateOfServiceInUTC);

            moreInfo.motion_date_returnable = (utils.isEmptyVal(self.returnableDateInUTC)) ? "" : utils.getUTCTimeStamp(self.returnableDateInUTC);
            moreInfo.motion_type = (self.documentMotionDetailInfo && self.documentMotionDetailInfo.motion_type) ? self.documentMotionDetailInfo.motion_type : "";
            moreInfo.motion_status = (self.documentMotionDetailInfo && self.documentMotionDetailInfo.motion_status) ? self.documentMotionDetailInfo.motion_status : "";
            //moreInfo.is_global = utils.isNotEmptyVal(self.documentMotionDetailInfo.is_global) ?self.documentMotionDetailInfo.is_global :0;
            moreInfo.is_global = angular.isDefined(self.documentMotionDetailInfo.contact) ? self.documentMotionDetailInfo.contact.contact_type == "Global" ? 1 : 0 : '';

            moreInfo.motion_judge_id = (angular.isDefined(self.documentMotionDetailInfo) &&
                angular.isDefined(self.documentMotionDetailInfo.contact) && angular.isDefined(self.documentMotionDetailInfo.contact.contactid)) ? parseInt(self.documentMotionDetailInfo.contact.contactid) : '';

            moreInfo.motion_description = (angular.isDefined(self.documentMotionDetailInfo) &&
                angular.isDefined(self.documentMotionDetailInfo.motion_description)) ?
                self.documentMotionDetailInfo.motion_description : '';

            moreInfo.motion_on_by = (self.documentMotionDetailInfo.motion_on_by == "motionByUs") ? "by" : "on";
            moreInfo.associated_party.associated_party_id = utils.isNotEmptyVal(self.docModel.associated_party) ? parseInt(self.docModel.associated_party.associated_party_id) : '';
            moreInfo.associated_party.associated_party_role = utils.isNotEmptyVal(self.docModel.associated_party) ? parseInt(self.docModel.associated_party.associated_party_role) : 0;
        }

        function setMoreInformationType(catId) {

            if (utils.isEmptyVal(catId) || utils.isEmptyVal(self.documentCategories)) {
                return;
            }

            var category = _.find(self.documentCategories, function (cat) {
                return cat.doc_category_id === catId.toString();
            });
            self.categorySelected = category.doc_category_name;
            self.moreInfoSelect = '';
            switch (category.doc_category_name) {
                case "Medical Records":
                    self.moreInfoSelect = 'medicalrecord';
                    self.dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'medicalrecord';
                    });
                    setMoreInfoType('medicalrecord');
                    break;
                case "Medical Bills":
                    self.moreInfoSelect = 'medicalbill';
                    self.dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'medicalbill';
                    });
                    setMoreInfoType('medicalbill');
                    break;
                //Insurance is now seperate category accordingly more info is set    
                case "Insurance":
                    self.moreInfoSelect = 'insurance';
                    self.dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'insurance';
                    });
                    self.dynamicSelect.unshift({
                        'keytext': "",
                        'valuetext': ""
                    }); // add blank value at top in array for extra option...
                    setMoreInfoType('insurance'); //set more info for 'insurance'
                    break;
                case "Expenses":
                    self.moreInfoSelect = 'expense';
                    self.dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'expense';
                    });
                    setMoreInfoType('expense');
                    break;
                case "Motions":
                    if (self.docModel.party_role == '2' || self.docModel.party_role == '3') {
                        self.docModel.associated_party_id = '';
                    }
                    self.moreInfoSelect = 'motion';
                    self.dynamicSelect = [{
                        'keytext': "",
                        'valuetext': ""
                    }];
                    var filterValue = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'motion';
                    });
                    self.dynamicSelect.push({
                        'keytext': filterValue[0].keytext,
                        'valuetext': filterValue[0].valuetext
                    });
                    setMoreInfoType('motion');
                    break;
                //Liens has been added as seperate category accordingly more info is set
                case "Liens":
                    self.moreInfoSelect = 'liens';

                    self.dynamicSelect = _.filter(dynamicSelect, function (opt) {
                        return opt.keytext === 'liens';
                    });
                    self.dynamicSelect.unshift({
                        'keytext': "",
                        'valuetext': ""
                    }); // add blank value at top in array for extra option...
                    setMoreInfoType('liens'); //set more info for 'liens'
                    break;
                default:
                    self.moreInfoSelect = '';
                    self.dynamicSelect = [];
            }
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
                    $state.go('documents');
                } else {
                    $state.go('matter-documents', {
                        matterId: matterId
                    });
                }
            } else {
                $window.history.back();
                // routeManager.goToPrevState();
            }
        }

        /*Search matter in case of global documents*/
        function searchMatters(matterName) {
            if (matterName) {
                return matterFactory.searchMatters(matterName).then(
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

                if (self.singleDoc.matter) {
                    if (!angular.isUndefined(self.singleDoc.matter.matter_id) && self.singleDoc.matter.matter_id != matterid) {
                        self.docModel.matter_id = matterid;
                        getPlaintiffsForDocument(matterid);
                        self.docModel.associated_party = '';
                    }
                }
                return matter.matterid === matterid;
            });
            self.singleDoc.matter['matter_name'] = matterInfo.name;
            self.singleDoc.matter['matter_id'] = matterInfo.matterid;
            return matterInfo.name;
        }

        /*destroy method for stop calling methods repetevly  */
        $scope.$on('$destroy', function () {
            connectionCloseForSocket();
        });

    }
})();

/* Edit office documents types controller 
 */


(function () {
    angular
        .module('cloudlex.documents')
        .controller('officeDocCtrl', officeDocCtrl);

    officeDocCtrl.$inject = ['documentsDataService', '$rootScope'];

    function officeDocCtrl(documentsDataService, $rootScope) {
        var self = this;
        self.openOfficeDoc = openOfficeDoc;
        self.DocDetailInfo = documentsDataService.getDocumentInfo();
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
