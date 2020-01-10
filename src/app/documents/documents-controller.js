/* Docuement module controller. 
 * */
(function () {

    'use strict';

    angular
        .module('cloudlex.documents')
        .controller('DocumentsCtrl', DocumentsController);

    DocumentsController.$inject = ['$scope', '$window', 'documentsDataService', '$stateParams', 'documentsConstants', 'documentListHelper', 'mailboxDataService',
        'notification-service', '$modal', 'routeManager', 'matterFactory', 'contactFactory', '$rootScope', 'globalConstants', 'masterData', '$state', 'allPartiesDataService', 'loginDatalayer', 'practiceAndBillingDataLayer', '$q', 'profileDataLayer',
    ];

    function DocumentsController($scope, $window, documentsDataService, $stateParams, documentsConstants, documentListHelper, mailboxDataService,
        notificationService, $modal, routeManager, matterFactory, contactFactory, $rootScope, globalConstants, masterData, $state, allPartiesDataService, loginDatalayer, practiceAndBillingDataLayer, $q, profileDataLayer) {
        var self = this,
            initLimit = 15;
        var gracePeriodDetails = masterData.getUserRole();
        self.firmID = gracePeriodDetails.firm_id;
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.email_subscription = gracePeriodDetails.email_subscription; // role email subscription
        var socket;
        var selectDocument;
        self.docId = [];
        self.docName;
        self.all = "";
        self.docdata = {};
        self.reloadEmail = false;
        var coAuthDocumentsName = [];
        var NewTabForDocSignUrl;
        self.insuranceTypeList = angular.copy(globalConstants.insuranceTypeList);

        /*Initial value variable*/
        if ($stateParams.matterId) {
            self.matterId = $stateParams.matterId;
            var matterId = $stateParams.matterId;
            self.isGlobalDocs = false;
            self.mydocs = false;
            self.matterInfomation = matterFactory.getMatterData(self.matterId);
        } else {
            var matterId = 0;
            self.isGlobalDocs = true;
            self.mydocs = true;
        }
        selectDocument = documentListHelper.getSelectedDocument();

        self.pageSize = 250;
        self.documentCategories = {};
        self.docPlaintiffs = [];
        self.collaboratedEntityFlag = false;

        /*Documents handeling Varialbe*/
        self.documentsList = {
            data: [],
            count: 0,
            totallength: 0,
            pageNum: 1,
        };

        var alldocuments = false;
        self.filterddocs = false;
        setFilters();

        self.multiFilters = {
            plaintiffs: [],
            categories: [],
        };

        if (self.isGlobalDocs) {
            var globalDocFilterText = sessionStorage.getItem("globalDocFilterText");
            if (utils.isNotEmptyVal(globalDocFilterText)) {
                self.showSearch = true;
            }
        } else {
            var retainSText = JSON.parse(sessionStorage.getItem("retainSearchText"));
            if (utils.isNotEmptyVal(retainSText)) {
                if ((self.matterId == retainSText.matterid) && utils.isNotEmptyVal(retainSText.docFiltertext)) {
                    self.display.filterText = retainSText.docFiltertext;
                    self.showSearch = true;
                } else {
                    self.display.filterText = "";
                }
            }
        }

        /* funciton handlers*/
        self.increaseLimit = increaseLimit;
        self.activateTab = activateTab;
        self.togleDocType = togleDocType;
        self.allDocumentsSelected = allDocumentsSelected;
        self.selectAllDocuments = selectAllDocuments;
        self.isDocSelected = isDocSelected;
        self.getNextLimitDocuments = getNextLimitDocuments;
        self.getAllDocs = getAllDocs;
        self.deleteDocument = deleteDocument;
        self.sendDocuSign = sendDocuSign;
        self.downloadDocument = downloadDocument;
        // self.createSearchFilterTag = createSearchFilterTag;
        self.filterReatain = filterReatain;
        self.sortDocument = sortDocument;
        self.cancleFilterTags = cancleFilterTags;
        self.print = print;
        self.composeNotesMail = composeNotesMail;
        self.closeComposeMail = closeComposeMail;
        self.getDiscoveryDetail = getDiscoveryDetail;
        self.getSearchedData = getSearchedData;
        self.searchDocumentOnEnter = searchDocumentOnEnter;
        self.getClearData = getClearData;
        // self.onChange = onChange;
        self.extFlag = false;
        self.officeOnlineStat = false;
        self.searchString = '';
        self.firmData = { API: "PHP", state: "mailbox" };
        //US#9315 compose e-fax form documents
        self.composeFax = composeFax;
        self.closeComposefax = closeComposefax;
        self.reloadEfax = false;
        var liteNotificationFilter = $stateParams.liteNotificationFilter;
        // self.is_DocuSign = utils.isNotEmptyVal(sessionStorage.getItem('DocuSignConfigure')) ? sessionStorage.getItem('DocuSignConfigure') : 0;
        (function () {
            getFromUser();
            //set breadcrum
            getOfficeOnlineStatus(); // get office online status
            window.parent.document.title = "Welcome to CloudLex";
            $rootScope.$emit('favicon', "favicon.ico");
            self.limit = initLimit;
            setBreadcrum();

            //US14425 - CloudLex Lite Document/Event/Note  Notification Navigation 
            if (liteNotificationFilter) {
                self.display.filters.category = [16];
                self.display.filters.createdByFilter = [0];
                self.display.filtertags = [{ value: "Category : Miscellaneous", key: "category" }, { value: "Created by : Lexvia", key: "createdByFilter" }];
                sessionStorage.setItem("documentFiltersMatter", JSON.stringify(self.display));
                $rootScope.retainFilters.matterID = self.matterId;
                sessionStorage.setItem("retainFilters", JSON.stringify($rootScope.retainFilters));
            }

            getDocCategories();
            getDiscoveryDetail();
            getUserEmailSignature();
            if (!self.isGlobalDocs) {
                getPlaintiffsForDocument(matterId);
            }
            self.activeTab = { documents: true };
            //get permissions 
            getPermissions();
            displayWorkflowIcon();

            /**
             * firm basis module setting 
             */
            self.firmData = JSON.parse(localStorage.getItem('firmSetting'));
            self.allfirmData = JSON.parse(localStorage.getItem('allFirmSetting'));
            _.forEach(self.allfirmData, function (item) {
                if (item.state == "entity_sharing") {
                    self.isCollaborationActive = (item.enabled == 1) ? true : false;
                }
            });
        })();

        function getFromUser() {
            var response = profileDataLayer.getViewProfileData();
            response.then(function (data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    self.is_DocuSign = data[0].docusign;
                }
            });
        }

        function getMatterCollaboratedEntity() {
            if (self.isCollaborationActive) {
                matterFactory.getMatterCollaboratedEntity(self.matterId, self.firmID)
                    .then(function (data) {
                        localStorage.setItem('getMatterCollaboratedEntity', JSON.stringify(data));
                        self.matterCollaboratedEntity = JSON.parse(localStorage.getItem('getMatterCollaboratedEntity'));
                        documentMatterCollaboaratedEntity();
                    }, function (data) {
                        notificationService.error('Error ');
                    });
            }
        }

        //18193 - Search on Document Grid
        function getSearchedData(searchText) {

            $(document).ready(function () {
                $("#search").click(function () {
                    self.documentsList.data = [];
                });
            });

            if (self.all != "more") {
                self.documentsList.pageNum = 1;
            }

            self.searchText = searchText;
            if (self.searchText == '') {
                return '';
            }

            var myRegexp = '[&/%]';
            while (self.searchText.match(myRegexp)) {
                self.searchText = self.searchText.replace(self.searchText.match(myRegexp), '');
            }
            self.searchText = self.searchText.replace(/\\/g, '');

            var promesa = documentsDataService.getSearchedData(alldocuments, self.matterId, self.mydocs,
                self.documentsList.pageNum, self.pageSize, self.display.sortby, self.display.sortorder, self.display.filters, '', self.isGlobalDocs, self.searchText);
            promesa.then(function (data) {
                self.display.documentListReceived = true;
                self.total = data.document_count;
                _.forEach(data.documents, function (item) {
                    item.docmodified_date = (utils.isEmptyVal(item.document_modified_date)) ? "" : moment.unix(item.document_modified_date).format('MM/DD/YYYY');
                    item.date_filed_date = (utils.isEmptyVal(item.date_filed_date) || item.date_filed_date == 0) ? "" : moment.unix(item.date_filed_date).format('MM/DD/YYYY');
                    item['plaintiff_name'] = utils.isNotEmptyVal(item.associated_party.associated_party_name) ? item.associated_party.associated_party_name : '';
                    item['categoryname'] = utils.isNotEmptyVal(item.doc_category.doc_category_name) ? item.doc_category.doc_category_name : '';
                    item['matter_name'] = utils.isNotEmptyVal(item.matter.matter_name) ? item.matter.matter_name : '';
                    item['mid'] = utils.isNotEmptyVal(item.matter.matter_id) ? item.matter.matter_id : '';
                    item['docusign_recieved'] = utils.isNotEmptyVal(item.docusign_recieved) ? item.docusign_recieved : '';
                    //data.documents.push(item);
                });
                if (self.filterddocs == true) {
                    self.documentsList.data = data.documents;
                    self.documentsList.count = data.documents.length;
                    self.documentsList.totallength = data.documents.length;
                    self.filterddocs = false;
                } else {
                    _.forEach(data.documents, function (item) {
                        self.documentsList.data.push(item);
                    });
                    // self.documentsList.data = data.documents;
                    self.documentsList.count = data.documents.length;
                    self.documentsList.totallength = parseInt(self.documentsList.data.length); //+ parseInt(data.documents.length);
                }
                self.documentsList.data = _.unique(self.documentsList.data, 'doc_id');
                self.clxGridOptions.selectAll = false;
                self.clxGridOptions.selectedItems = [];

                if (!self.isGlobalDocs && self.isCollaborationActive) {
                    getMatterCollaboratedEntity();
                }

            }, function (reason) {
                notificationService.error('document list not loaded');
            });
        }

        function getClearData() {
            self.documentsList.pageNum = 1;
            if (self.isGlobalDocs) {
                var globalDocFilterText = sessionStorage.getItem("globalDocFilterText");
                if (utils.isNotEmptyVal(globalDocFilterText)) {
                    self.documentsList.data = [];
                    sessionStorage.removeItem("globalDocFilterText");
                    self.display.filterText = '';
                    getDocuments();
                } else {
                    self.display.filterText = '';
                    getDocuments();
                }
            }
            else {
                var retainSText = JSON.parse(sessionStorage.getItem("retainSearchText"));
                if (utils.isNotEmptyVal(retainSText)) {
                    if ((self.matterId == retainSText.matterid) && utils.isNotEmptyVal(retainSText.docFiltertext)) {
                        sessionStorage.removeItem("retainSearchText");
                        self.documentsList.data = [];
                        self.display.filterText = '';
                        getDocuments();
                    }
                } else {
                    self.display.filterText = '';
                    getDocuments();

                }
            }
        }

        function searchDocumentOnEnter($event) {

            if ($event.keyCode == 13 && self.display.filterText.length >= 3) {
                self.documentsList.data = [];
                self.documentsList.pageNum = 1;
                getSearchedData(self.display.filterText);

            }
        }

        function documentMatterCollaboaratedEntity() {
            self.collaboratedEntityFlagArr = [];
            if (self.matterCollaboratedEntity.length > 0) {
                self['collaboratedEntityFlag'] = true;
            }
            // _.forEach(self.matterCollaboratedEntity, function (entity, entityIndex) {

            //     if (utils.isNotEmptyVal(entity.documentEntity)) {
            //         self.collaboratedEntityFlagArr = self.collaboratedEntityFlagArr.concat(_.pluck(entity.documentEntity.documents, 'doc_id'));
            //     }
            // });
            // self.collaboratedEntityFlagArr = _.uniq(self.collaboratedEntityFlagArr);

            // _.forEach(self.documentsList.data, function(document, documentIndex){ 
            //     var flag = _.find(self.collaboratedEntityFlagArr, function(id){ return id == document.doc_id; });
            //     document['collaboratedEntityFlag'] = (flag) ? true : false;
            //     if(!self.collaboratedEntityFlag && document.collaboratedEntityFlag){
            //         self['collaboratedEntityFlag'] = true;
            //     }
            // });

            _.forEach(self.documentsList.data, function (document) {
                document['documentCollaboratedEntityArr'] = [];
                //document['collaboratedEntity'] = [];
                _.forEach(self.matterCollaboratedEntity, function (entity) {
                    var obj = {
                        contactName: entity.contactName,
                        id: entity.id,
                        docPermission: 0,
                        emailId: entity.emailId,
                    }
                    if (document && utils.isNotEmptyVal(entity.documentEntity)) {
                        var flag = _.find(entity.documentEntity.documents, function (doc) { return doc.doc_id == document.doc_id; });
                        obj['docPermission'] = (flag) ? 1 : 0;
                    }
                    //document['collaboratedEntity'].push(entity);
                    document['documentCollaboratedEntityArr'].push(obj);
                });
            });

        }

        self.openContactCard = function (contact) {
            contactFactory.displayContactCard1(contact.contactid, contact.edited, contact.contact_type);
            contact.edited = false;
        };

        function displayWorkflowIcon() {
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                var resData = data.matter_apps;
                self.isEfax = resData.fax;                                   //promise
                if (angular.isDefined(resData) && resData != '' && resData != ' ') {
                    self.is_workflow = (resData.workflow == 1) ? true : false;
                    // US:16596 DocuSign
                    self.is_eSignature = resData.docusign;
                }
            });
        }



        $rootScope.$on('updateWorkflowIcons', function (updateworkflowIconevent) {
            displayWorkflowIcon();
        });


        /**
         * get office online subscribe status
         */
        function getOfficeOnlineStatus() {
            documentsDataService.getOfficeStatus()
                .then(function (response) {
                    self.officeOnlineStat = (response.data.O365.is_active == 1) ? true : false;
                    self.clxGridOptions = {
                        headers: documentListHelper.getGridHeaders(self.isGlobalDocs, self.officeOnlineStat),
                        selectedItems: []
                    };
                    getDocuments();
                }, function (error) {
                    getDocuments();
                    notificationService.error('Unable to fetch subscription status!');
                });
        }

        /**
         * view comment in medical information
         */
        self.viewCommentMedicalInfo = function (selectedItem) {
            var modalInstance = $modal.open({
                templateUrl: 'app/documents/view-comment.html',
                controller: 'viewCommentDocumentCtrl as viewCommentInfo',
                keyboard: false,
                size: 'lg',
                windowClass: 'modalMidiumDialog',
                resolve: {
                    viewCommentInfo: function () {
                        return {
                            selectedItems: selectedItem
                        };
                    }
                }
            });
        }

        self.viewCollaborateInfo = function (selectedItem) {
            var modalInstance = $modal.open({
                templateUrl: 'app/documents/collaboration-document/view-collaboration.html',
                controller: 'CollaborationDocumentsCtrl as collaborationDocument',
                keyboard: false,
                backdrop: 'static',
                size: 'lg',
                windowClass: 'modalMidiumDialog',
                resolve: {
                    collaborationDocument: function () {
                        return {
                            selectedItems: selectedItem
                        };
                    }
                }
            })
            modalInstance.result.then(function (data) {
                self.clxGridOptions.selectedItems = [];
                getMatterCollaboratedEntity();
            }, function () {
                getMatterCollaboratedEntity();
            });
        }

        /**
         * uncheck seleted items from grid
         */
        $rootScope.$on('unCheckSelectedItems', function () {
            self.clxGridOptions.selectedItems = [];
        });

        //Restrict user based on permissions 
        function getPermissions() {
            var permissions = masterData.getPermissions();
            self.docPermissions = _.filter(permissions[0].permissions, function (per) {
                if (per.entity_id == '4') {
                    return per;
                }
            });
        }

        // compose mail with selected notes
        function composeNotesMail() {
            /* check document is global or matter document
             *
             *  rootScope: composeEmail.matter_id
             */


            var html = "";
            html += (self.signature == undefined) ? '' : self.signature;
            self.composeEmail = html;

            if (self.isGlobalDocs) {
                self.compose = true;
                $rootScope.updateComposeMailMsgBody(self.composeEmail, '0', self.documentsList.data, self.clxGridOptions.selectedItems);
            } else {
                $rootScope.rootComposeMatterId = self.matterId;
                var matter_name = _.pluck(self.clxGridOptions.selectedItems, 'matter_name');
                var selectedMatter = { matterid: self.matterId, name: matter_name[0], filenumber: "000193" };
                self.compose = true;
                getMatterContact(self.matterId, function (contacts) {
                    $rootScope.updateComposeMailMsgBody(self.composeEmail, selectedMatter, self.documentsList.data, self.clxGridOptions.selectedItems, 'matterRecipents', contacts);
                });
            }
        }

        /**
         * get all contact of matter
         */
        function getMatterContact(matterId, callback) {
            matterFactory.getUserAssignment(matterId)
                .then(function (response) {
                    var attorney = response.data.attorney;
                    var paralegal = response.data.paralegal;
                    var partner = response.data.partner;
                    var staffs = response.data.staffs;
                    var subscriber = response.data.subscriber;
                    var contactMerge = attorney.concat(paralegal).concat(partner).concat(staffs).concat(subscriber);
                    contactMerge = _.filter(contactMerge, function (currentItem, index) {
                        return currentItem.mail != "";
                    });
                    callback(contactMerge);
                }, function (error) {
                    notificationService.error("Unable to fetch contacts!");
                });
        }

        $scope.$on('composeEmailFromContact', function (event, data) {
            if (!(window.isDrawerOpen)) {
                self.compose = true;
                var html = "";
                html += (self.signature == undefined) ? '' : self.signature;
                self.composeEmail = html;
                $rootScope.updateComposeMailMsgBody(self.composeEmail, '', '', '', 'contactEmail', data);
            }
        });

        $rootScope.$on("selectionChanged", function (event, data, reflectChange) {
            if (reflectChange) {
                var selectionDocIds = _.pluck(data, 'doc_id');
                self.clxGridOptions.selectedItems = _.filter(self.documentsList.data, function (doc) {
                    if (selectionDocIds.indexOf(doc.doc_id) > -1) {
                        return doc;
                    }
                });
            }

        });

        // Get event call from mailbox controller for close compose popup
        $rootScope.$on("callCloseComposeMail", function () {
            closeComposeMail(); // close compose mail popup
        });

        // on drawer-closed event reload the email module
        $rootScope.$on("drawer-closed", function (ev, isEmailModule, isFaxModule) {
            if (isEmailModule) {
                reloadEmailCtrl();
            }
            if (isFaxModule) {
                reloadEfaxCtrl();
            }
        });

        function reloadEmailCtrl() {
            self.reloadEmail = true;
            setTimeout(function () {
                $scope.$apply(function () {
                    self.reloadEmail = false;
                });
            }, 100);
        }

        // close compose mail popup
        function closeComposeMail() {

            self.compose = false;
            self.clxGridOptions.selectedItems = [];
            self.selDocs = [];
            $rootScope.composeNotesEmail = "";
        }

        /*Get email signature if user*/
        function getUserEmailSignature() {
            mailboxDataService.emailSignature()
                .then(function (data) {
                    if (utils.isNotEmptyVal(data.data)) {
                        self.signature = data.data[0];
                        self.signature = '<br/><br/>' + self.signature;
                    }
                });
        }

        // compose mail with selected notes
        function composeFax() {
            /* check document is global or matter document
             *
             *  rootScope: composeEmail.matter_id
             */
            var html = "";
            html += (self.signature == undefined) ? '' : self.signature;
            self.composeFaxDetails = html;

            if (self.isGlobalDocs) {
                self.composeEfax = true;
                $rootScope.updateComposeEfaxMsgBody(self.composeFaxDetails, '0', self.documentsList.data, self.clxGridOptions.selectedItems);
            } else {
                /*
                 * set document list 
                 * rootScope: composeFax.matterdocs 
                 */
                var selectionDocIds = _.pluck(self.clxGridOptions.selectedItems, 'doc_id');

                $rootScope.rootComposeMatterId = self.matterId;
                var matter_name = _.pluck(self.clxGridOptions.selectedItems, 'matter_name');
                var selectedMatter = { matterid: self.matterId, name: matter_name[0], filenumber: "000193" };
                documentsDataService.getDocumentsList(true, self.matterId, false, '1', self.pageSize, '1', 'asc', '').then(function (data) {
                    self.composeEfax = true;
                    getMatterContact(self.matterId, function (contacts) {
                        self.selDocs = _.filter(data.documents, function (doc) {
                            if (selectionDocIds.indexOf(doc.doc_id) > -1) {
                                return doc;
                            }
                        });
                        $rootScope.updateComposeEfaxMsgBody(self.composeFaxDetails, selectedMatter, data.documents, self.selDocs);
                    });
                }, function (reason) {
                    notificationService.error('document list not loaded');
                });
            }
        }

        // Get event call from mailbox controller for close compose popup
        $rootScope.$on("callCloseEfaxMail", function () {
            closeComposefax(); // close compose mail popup
        });

        function reloadEfaxCtrl() {
            self.reloadEfax = true;
            setTimeout(function () {
                $scope.$apply(function () {
                    self.reloadEfax = false;
                });
            }, 100);
        }

        // close compose mail popup
        function closeComposefax() {
            self.composeEfax = false;
            self.clxGridOptions.selectedItems = [];
        }

        function setFilters() {
            var persistFilterKey = self.isGlobalDocs ? "documentFiltersGlobal" : "documentFiltersMatter";
            var displayObj = sessionStorage.getItem(persistFilterKey);

            // var searchFilterKey = self.isGlobalDocs ? "SS" : "SS";
            // var docFiltertext = sessionStorage.getItem(searchFilterKey); 

            if (self.isGlobalDocs) {
                var globalDocFilterText = sessionStorage.getItem("globalDocFilterText");
                if (utils.isNotEmptyVal(globalDocFilterText)) {
                    self.display = {};
                    self.display.filterText = globalDocFilterText;
                }
            } else {

                var retainSText = JSON.parse(sessionStorage.getItem("retainSearchText"));
                if (utils.isNotEmptyVal(retainSText)) {
                    if (self.matterId == retainSText.matterid) {
                        self.display = {};
                        self.display.filterText = retainSText.docFiltertext;
                    }
                }
            }
            var persistFilterKey = self.isGlobalDocs ? "documentFiltersGlobal" : "documentFiltersMatter";
            var displayObj = sessionStorage.getItem(persistFilterKey);

            // var searchFilterKey = self.isGlobalDocs ? "SS" : "SS";
            var retainsFilter = JSON.parse(sessionStorage.getItem("retainFilters"));
            if (utils.isNotEmptyVal(displayObj)) {
                try {
                    var displayObj = JSON.parse(displayObj);
                    self.mydocs = self.isGlobalDocs ? displayObj.mydocs : false;
                    // We need to clear the documentSelected on page refresh
                    displayObj.documentSelected = {};
                    if (displayObj.filters && displayObj.filters.matterid && !self.isGlobalDocs) {
                        // Correct the matterid incase the tab is duplicate

                        displayObj.filters.matterid = $stateParams.matterId;
                    }
                    if (utils.isNotEmptyVal(retainsFilter) && !self.isGlobalDocs) {
                        if (self.matterId == retainsFilter.matterID) {
                            self.display = displayObj;
                        }
                    } else {
                        self.display = displayObj;
                        var persistFilterKey = self.isGlobalDocs ? "documentFiltersGlobal" : "documentFiltersMatter"
                        sessionStorage.setItem(persistFilterKey, JSON.stringify(self.display));
                    }

                    // Added below code to resolve the timestamp issue (Newly created documents are not displayed for default date range filter)
                    if ((moment.unix(self.display.filters.u_end_date).format('MM/DD/YYYY')).toString == (moment().format('MM/DD/YYYY')).toString) {
                        if (utils.isNotEmptyVal(self.display.filters.u_start_date)) {
                            self.display.filters.u_start_date = self.display.filters.u_start_date;
                            self.display.filters.u_end_date = moment.unix(self.display.filters.u_end_date).add(2, 'minutes');
                            self.display.filters.u_end_date = (self.display.filters.u_end_date).unix();
                        }
                    }
                    //Ends here
                } catch (e) { self.display = documentListHelper.docDisplayOptions(self.isGlobalDocs); }
            } else {
                self.display = documentListHelper.docDisplayOptions(self.isGlobalDocs);
                if (self.isGlobalDocs) {
                    if (utils.isEmptyVal(self.display.filters.u_start_date) || utils.isEmptyVal(self.display.filters.u_end_date)) {
                        self.display.filters.u_start_date = moment().subtract(7, 'days').unix();
                        self.display.filters.u_end_date = moment().unix();
                        createFilterTags(self.display.filters, []);
                    }
                }
            }
        }

        function setUserList(users) {
            var userList = [];
            _.forEach(users, function (user) {
                _.forEach(user, function (val, key) {
                    if (user[key] instanceof Array) {
                        _.forEach(user[key], function (usr) {
                            usr.Name = usr.name + ' ' + usr.lname;
                            userList.push(usr);
                        });
                    }
                })
            });
            //get unique user ids
            userList = _.uniq(userList, function (item) {
                return item.uid;
            });

            return userList;
        }

        function setBreadcrum() {
            if (matterId === 0) {
                routeManager.setBreadcrum([{ name: '...' }]);
                routeManager.addToBreadcrum([{ name: 'Documents' }]);
                return;
            }
            //matterFactory.setBreadcrum(self.matterId, 'Documents');
            matterFactory.setBreadcrumWithPromise(self.matterId, 'Documents').then(function (resultData) {
                self.matterInfo = resultData;
            });
        }

        function increaseLimit() {
            if (self.limit <= self.total) {
                self.limit += initLimit;
            }
        }

        function activateTab(tabName, tabs) {
            tabs[tabName] = true;
            angular.forEach(tabs, function (val, key) {
                tabs[key] = key === tabName ? true : false;
            });

            if (!tabs.documents) {
                //unbind window scroll listner
                var windowEl = angular.element($window);
                windowEl.unbind("scroll");
            }
        }


        function print(filteredDoc) {
            var filteredDocs = [];
            var fileNum = self.isGlobalDocs ? null : self.matterInfo ? self.matterInfo.file_number : null;
            _.forEach(filteredDoc, function (currentItem, index) {
                filteredDocs.push(currentItem);
            });
            //Bug#7196 : searched document should get print
            if (utils.isNotEmptyVal(self.display.filterText)) {
                var documentSearch = _.filter(filteredDocs, function (data) {
                    return data.is_locked == 0;
                });
                filteredDocs = documentSearch;

                // if (filteredDocs.length == 0) {
                //     notificationService.error('Please select document(s) to print');
                //     return;
                // }
            } else {
                filteredDocs = [];
            }
            if (self.documentsList.totallength == 0) {
                var filteredDocs = [];
            }
            var printObj = (utils.isEmptyVal(filteredDocs)) ? self.documentsList.data : filteredDocs;
            getDocuments();
            documentsDataService.printdocuments(printObj, self.display.filtertags, self.display.sortSeleted, fileNum);
        }

        function persistFilters() {
            var display = angular.copy(self.display);
            display.documentListReceived = false;
            display.mydocs = self.mydocs;
            // self.display.filterText = "";
            display.isGlobalDocs = self.isGlobalDocs;

            var persistFilterKey = self.isGlobalDocs ? "documentFiltersGlobal" : "documentFiltersMatter"
            sessionStorage.setItem(persistFilterKey, JSON.stringify(display));
            if (self.isGlobalDocs) {
                var globalDocFilterText = sessionStorage.getItem("globalDocFilterText");
                if (utils.isNotEmptyVal(globalDocFilterText)) {
                    self.display.filterText = globalDocFilterText;
                }
            } else {
                var retainSText = JSON.parse(sessionStorage.getItem("retainSearchText"));
                if (utils.isNotEmptyVal(retainSText)) {
                    if (self.matterId == retainSText.matterid) {
                        self.display.filterText = retainSText.docFiltertext;
                    }
                }
            }
        }


        function getDocumentData() {
            var promesa = documentsDataService.getDocumentsList(alldocuments, self.matterId, self.mydocs,
                self.documentsList.pageNum, self.pageSize, self.display.sortby, self.display.sortorder, self.display.filters, '', self.isGlobalDocs);
            promesa.then(function (data) {
                self.display.documentListReceived = true;
                self.total = data.document_count;
                _.forEach(data.documents, function (item) {
                    item.docmodified_date = (utils.isEmptyVal(item.document_modified_date)) ? "" : moment.unix(item.document_modified_date).format('MM/DD/YYYY');
                    item.date_filed_date = (utils.isEmptyVal(item.date_filed_date) || item.date_filed_date == 0) ? "" : moment.unix(item.date_filed_date).format('MM/DD/YYYY');
                    item['plaintiff_name'] = utils.isNotEmptyVal(item.associated_party.associated_party_name) ? item.associated_party.associated_party_name : '';
                    item['categoryname'] = utils.isNotEmptyVal(item.doc_category.doc_category_name) ? item.doc_category.doc_category_name : '';
                    item['matter_name'] = utils.isNotEmptyVal(item.matter.matter_name) ? item.matter.matter_name : '';
                    item['mid'] = utils.isNotEmptyVal(item.matter.matter_id) ? item.matter.matter_id : '';
                    item['docusign_recieved'] = utils.isNotEmptyVal(item.docusign_recieved) ? item.docusign_recieved : '';
                    //data.documents.push(item);
                });
                if (self.filterddocs == true) {
                    self.documentsList.data = data.documents;
                    self.documentsList.count = data.documents.length;
                    self.documentsList.totallength = data.documents.length;
                    self.filterddocs = false;
                } else {
                    _.forEach(data.documents, function (item) {
                        self.documentsList.data.push(item);
                    });
                    self.documentsList.count = data.documents.length;
                    self.documentsList.totallength = parseInt(self.documentsList.data.length); //+ parseInt(data.documents.length);
                }
                self.documentsList.data = _.unique(self.documentsList.data, 'doc_id');
                self.clxGridOptions.selectAll = false;
                self.clxGridOptions.selectedItems = [];

                if (!self.isGlobalDocs && self.isCollaborationActive) {
                    getMatterCollaboratedEntity();
                }

                delete self.all;

            }, function (reason) {
                notificationService.error('document list not loaded');
            });
        }

        function getDocuments() {
            var retainsFilter = JSON.parse(sessionStorage.getItem("retainFilters"));
            if (utils.isNotEmptyVal(retainsFilter) && !self.isGlobalDocs) {
                if (self.matterId == retainsFilter.matterID) {
                    persistFilters();
                }
            } else {
                persistFilters();
            }

            if (self.isGlobalDocs) {
                var globalDocFilterText = sessionStorage.getItem("globalDocFilterText");
                if (utils.isNotEmptyVal(globalDocFilterText)) {
                    getSearchedData(globalDocFilterText);
                } else {
                    getDocumentData();
                }
            }
            else {
                var retainSText = JSON.parse(sessionStorage.getItem("retainSearchText"));
                if (utils.isNotEmptyVal(retainSText) && (self.matterId == retainSText.matterid) && utils.isNotEmptyVal(retainSText.docFiltertext)) {
                    getSearchedData(retainSText.docFiltertext);
                } else {
                    getDocumentData();
                }
            }

            //get count
            // var count = documentsDataService.getDocumentsListCount(alldocuments, matterId, self.mydocs,
            //     self.documentsList.pageNum, self.display.sortby, self.display.sortorder, self.display.filters);
            // count.then(setCount);
        }

        function setCount(res) {
            var cnt = res.data[0];
            self.total = cnt;
        }

        /*Toggle between My documents and All documents*/
        function togleDocType(type) {
            self.documentsList.pageNum = 1;
            self.mydocs = type;
            self.filterddocs = true;
            self.showAllOptions = true;
            alldocuments = false;
            getDocuments();
        }

        /*Select all the documents*/
        function allDocumentsSelected() {
            if (self.clxGridOptions != undefined) {
                var dataCopy = [];
                dataCopy = _.filter(self.documentsList.data, function (data) {
                    return true;
                });
                if (dataCopy.length > 0) {
                    return self.clxGridOptions.selectedItems.length === dataCopy.length;
                }
            }
        }

        /*check all documents selected*/
        function selectAllDocuments(selected) {
            if (selected) {
                var dataCopy = _.filter(self.documentsList.data, function (data) {
                    return true;
                });
                self.clxGridOptions.selectedItems = dataCopy;
            } else {
                self.clxGridOptions.selectedItems = [];
            }
        }

        /*check if document is selected*/
        function isDocSelected(doc) {
            if (self.clxGridOptions != undefined) {
                self.display.documentSelected[doc.doc_id] =
                    documentListHelper.isDocumentSelected(self.clxGridOptions.selectedItems, doc);
                return self.display.documentSelected[doc.doc_id];
            }
        }

        /*Get more Documenets*/
        function getNextLimitDocuments(all) {
            self.documentsList.pageNum = parseInt(self.documentsList.pageNum) + parseInt(1);
            if (all == 'all') {
                self.all = 'all';
                alldocuments = true;
            }
            else {
                self.all = "more";
            }
            getDocuments();
        }
        //when tab closed websocket connection should also get close
        $window.onbeforeunload = function () {
            if (globalConstants.webSocketServiceEnable == true) {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.close();
                }
            }
        }

        /*get all from 'all' clicked on the top*/
        function getAllDocs() {
            self.showAllOptions = false;
            getNextLimitDocuments('all');
        }

        /*delete multiple document*/
        function deleteDocument(selectedDocs, filterdDoc) {
            self.docId = [];
            self.docdata = {};
            coAuthDocumentsName = [];
            if (utils.isNotEmptyVal(self.display.filterText) && allDocumentsSelected()) {
                var dataCopy = _.filter(filterdDoc, function (data) {
                    return data.is_locked == 0;
                });
                selectedDocs = dataCopy;
                if (selectedDocs.length == 0) {
                    notificationService.error('Please select document(s) to delete');
                    return;
                }
            }

            self.docdata['docID'] = _.pluck(selectedDocs, 'doc_id');

            if (!self.isGlobalDocs) {
                self.docdata['matterid'] = matterId;
            } else {
                self.docdata['matterid'] = _.pluck(selectedDocs, 'matter_id');
            }

            if (globalConstants.webSocketServiceEnable == true) {
                /*
            * WebSocket connection start
            */
                var url = globalConstants.webSocketServiceBase1 + "Matter-Manager/serverendpoint/CLXD/" + localStorage.getItem('accessToken') + "?dids=" + self.docdata['docID'];

                // Create a new instance of the websocket
                socket = new WebSocket(url);

                socket.onopen = function (event) {
                    socket.send("Connection established");
                };

                socket.onclose = function (event) {
                    console.log("Connection closed");
                };

                socket.onerror = function (event) {
                    var ListDataInfo = {
                        listData: self.documentsList.data,
                        totalLength: self.documentsList.totallength
                    }
                    coAuthDocsValidation(self.docdata, ListDataInfo);
                };

                socket.onmessage = function (event) {
                    if (event.data == 'Unauthorized') {
                        var tokenReissue = {
                            'refreshToken': localStorage.getItem('refreshToken')
                        }
                        loginDatalayer.refreshToken(tokenReissue)
                            .then(function (response) {
                                localStorage.setItem('accessToken', response.accessToken);
                                deleteDocument(selectedDocs, filterdDoc);
                            }, function (status) {
                                if (status === 401) {
                                    loginDatalayer.logoutUser()
                                        .then(function () {
                                            notificationService.error('You are unauthorized to access this service.');
                                            localStorage.clear();
                                            $state.go('login');
                                        });
                                    return;
                                }
                            });
                    }

                    self.docId = JSON.parse(event.data);
                    if (utils.isEmptyVal(self.docId)) {
                        self.docId = [];
                        coAuthDocumentsName = [];
                    } else {
                        _.forEach(self.docId, function (currentItem) {
                            _.forEach(selectedDocs, function (doc) {
                                if (currentItem == doc.doc_id) {
                                    coAuthDocumentsName.push(doc.doc_name);
                                }
                            });
                        });
                    }
                    /**
                     * {self.docName}: co-auth document name
                     * {docData}: selected document id and matter id 
                     * {selectDocs}: selected document original object
                     */

                    var ListDataInfo = {
                        listData: self.documentsList.data,
                        totalLength: self.documentsList.totallength
                    }
                    coAuthDocsValidation(self.docdata, ListDataInfo);
                }
            } else {
                var ListDataInfo = {
                    listData: self.documentsList.data,
                    totalLength: self.documentsList.totallength
                }
                coAuthDocsValidation(self.docdata, ListDataInfo);
            }



        }

        // US:16596 DocuSign
        function sendDocuSign(selectedDocs, filterdDoc) {
            //Error message when trying to push docs to docusign more than 25MB
            getFileSize(selectedDocs, 'matterdoc');
        }

        /**
       * @param {files} selected files size
       * @param {matterdocs} matter document or global document
       */
        function getFileSize(files, matterdoc) {
            var selectedDocId = "[" + _.pluck(files, 'doc_id').toString() + "]";
            var intakeflag = "0";
            mailboxDataService.getdocumentsize(selectedDocId, intakeflag)
                .then(function (response) {
                    var errorMsg = false;
                    response.data.slice(0).forEach(function (item) {
                        if (item.documentsize == 0 || item.documentsize == null) {
                            self.clxGridOptions.selectedItems = _.filter(angular.copy(self.clxGridOptions.selectedItems), function (it) {
                                return it.documentid != item.documentid
                            })
                            response.data.splice(response.data.indexOf(item), 1);
                            errorMsg = true;
                        }
                    });
                    if (errorMsg) {
                        notificationService.error("Cannot upload 0kb file");
                        errorMsg = false;
                    }
                    self.allDocSize = calculateTotalFileSize(response.data);
                    if (self.allDocSize > 26214400 && response.data.length > 1) {
                        notificationService.error("Selected documents is greater than 25 MB. This exceeds the allowed DocuSign limit");
                        return;
                    } else if (self.allDocSize > 26214400 && response.data.length == 1) {
                        notificationService.error("Selected document is greater than 25 MB. This exceeds the allowed DocuSign limit");
                        return;
                    }
                    var DocArray = [];
                    _.forEach(files, function (item) {
                        item.ext = getFileExtention(item);
                        item.ext = item.ext.toLowerCase();
                        var attachedEnvelopData = {};
                        attachedEnvelopData.matterId = item.matter.matter_id;
                        attachedEnvelopData.documentName = item.doc_name;
                        attachedEnvelopData.isIntake = 0;
                        attachedEnvelopData.clxDocumentId = item.doc_id;
                        attachedEnvelopData.esignature = 1;
                        attachedEnvelopData.envelopId = "";
                        attachedEnvelopData.is_received = 0;
                        attachedEnvelopData.docType = null;
                        attachedEnvelopData.docExtension = item.ext;
                        attachedEnvelopData.redirectUrl = globalConstants.webServiceRedirectUrl + "docuSign-redirect/";
                        DocArray.push(attachedEnvelopData);
                    });
                    var list = [];
                    //If the user tries to send a document other than supported formats, we show an error message
                    _.forEach(files, function (item) {
                        if (item.ext == 'pdf' || item.ext == 'doc' || item.ext == 'docm' || item.ext == 'docx' || item.ext == 'dot' || item.ext == 'dotm' || item.ext == 'dotx' ||
                            item.ext == 'htm' || item.ext == 'html' || item.ext == 'msg' || item.ext == 'rtf' || item.ext == 'txt' || item.ext == 'wpd' || item.ext == 'xps' || item.ext == 'bmp' ||
                            item.ext == 'gif' || item.ext == 'jpg' || item.ext == 'jpeg' || item.ext == 'png' || item.ext == 'tif' || item.ext == 'tiff' || item.ext == 'pot' || item.ext == 'potx' ||
                            item.ext == 'pps' || item.ext == 'ppt' || item.ext == 'pptm' || item.ext == 'pptx' || item.ext == 'csv' || item.ext == 'xls' || item.ext == 'xlsm' || item.ext == 'xlsx') {
                        } else {
                            list.push(item.doc_name);

                        }
                    });
                    if (list.length > 0) {
                        notificationService.error("The selected file format is not supported by DocuSign for" + ' ' + list.toString());
                        return;
                    }
                    var deferred = $q.defer();
                    documentsDataService.createEnvelop(DocArray)
                        .then(function (response) {
                            if (angular.isDefined(response)) {
                                getDocuments();
                                self.clxGridOptions.selectedItems = [];
                                var url = response.url;
                                url.replace(/['"]+/g, '');
                                NewTabForDocSignUrl = url;
                            }

                            window.open(NewTabForDocSignUrl, '_blank');
                            deferred.resolve(response)
                        }, function (error) {
                            if (error.status == 601) {
                                var myRegexp = /(.*)\. Error:/;
                                var match = myRegexp.exec(error.message);
                                if (match && match.length > 0) {
                                    openPopUp(match[1] + '.');
                                } else {
                                    notificationService.error(error.message);
                                }
                            } else {
                                notificationService.error(error.message);
                            }

                        });
                    return deferred.promise;
                }, function (error) {
                    if (error.status == 406) {
                        notificationService.error('This document does not exist');
                    }
                });
        }

        function openPopUp(ErrorData) {
            var modalInstance = $modal.open({
                templateUrl: 'app/intake/documents/open-docuSign-PopUp.html',
                controller: "openIntakeDocuSignCtrl as openIntakeDocuSignCtrl",
                windowClass: 'cal-pop-up',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    data: function () {
                        return angular.copy(ErrorData);
                    },
                }
            });

            modalInstance.result.then(function () {

            }, function () {

            });
        }

        //func to get size of all attached files 
        function calculateTotalFileSize(matterDocs) {
            if (matterDocs && matterDocs.length == 0) {
                return;
            }
            var matterDocSize = 0;
            if (matterDocs && matterDocs.length > 0) {
                matterDocSize = matterDocs.reduce(function (prevVal, elem) {
                    return prevVal + elem.documentsize;
                }, 0);
            } else if (self.composeEmail.matterdocs && self.composeEmail.matterdocs.length > 0) {
                matterDocSize = self.composeEmail.matterdocs.reduce(function (prevVal, elem) {
                    return prevVal + elem.documentsize;
                }, 0);
            }
            return matterDocSize;
        }


        /**
         * 
         * @param {} authDocs 
         */
        function coAuthDocsValidation(docdata, ListDataInfo) {
            var modalInstance = $modal.open({
                templateUrl: 'app/documents/document-delete.html',
                controller: 'coAuthCtrl as docDelete',
                windowClass: 'modalMidiumDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    documentInfo: function () {
                        return docdata;
                    },
                    coAuthDocName: function () {
                        return coAuthDocumentsName;
                    },
                    ListDataInfo: function () {
                        return ListDataInfo;
                    },


                }

            })
            modalInstance.result.then(function (resolve) {
                if (globalConstants.webSocketServiceEnable == true) {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.close();
                    }
                }

                if (utils.isNotEmptyVal(resolve)) {
                    self.documentsList.data = resolve.listData;
                    self.documentsList.totalLength = resolve.totalLength;

                    self.clxGridOptions.selectAll = false;
                    self.clxGridOptions.selectedItems = [];
                    self.clxGridOptions.selectedItems.length = 0;
                    getDocuments();
                }
            })
        }

        /*download single document*/
        function downloadDocument(selectedDocs, filteredDoc) {
            if (utils.isNotEmptyVal(self.display.filterText) && allDocumentsSelected()) {
                if (selectedDocs.length == 0) {
                    notificationService.error('Please select document(s) to download');
                    return;
                }
            }

            if (selectedDocs.length > 0) {
                callDownloadDocumentUntilComplete(selectedDocs, selectedDocs.length);
            }


        }

        //US#15637 - User should be able to download more than 10 or all intake documents same as MM
        self.downloadDocumentCount = 0;
        function callDownloadDocumentUntilComplete(documentList, count) {
            var doc = documentList[self.downloadDocumentCount];
            documentsDataService.downloadDocument(doc.doc_id).then(function (item) {
                utils.downloadFile(item, doc.doc_name, item.contentType);
                self.downloadDocumentCount = self.downloadDocumentCount + 1;
                if (count > self.downloadDocumentCount) {
                    callDownloadDocumentUntilComplete(documentList, count);
                } else if (count == self.downloadDocumentCount) {
                    self.downloadDocumentCount = 0;
                }
            });
        }

        /*Sort document function*/
        function sortDocument($sortby, $sortorder, $label) {
            self.documentsList.pageNum = 1;
            self.display.sortby = $sortby;
            self.display.sortorder = $sortorder;
            self.display.sortSeleted = $label;
            self.filterddocs = true;
            alldocuments = false;
            getDocuments();
        }

        /*Process filter popup*/
        self.toggleFilterPage = function () {
            var scrollPos = $(window).scrollTop();
            var filtercopy = angular.copy(self.display.filters);
            filtercopy.c_start_date = (filtercopy.c_start_date) ? matterFactory.getFormatteddate(filtercopy.c_start_date) : '';
            filtercopy.c_end_date = (filtercopy.c_end_date) ? matterFactory.getFormatteddate(filtercopy.c_end_date) : '';
            filtercopy.u_start_date = (filtercopy.u_start_date) ? matterFactory.getFormatteddate(filtercopy.u_start_date) : '';
            filtercopy.u_end_date = (filtercopy.u_end_date) ? matterFactory.getFormatteddate(filtercopy.u_end_date) : '';



            var modalInstance = $modal.open({
                templateUrl: "app/documents/partial/document-filter.html",
                controller: "DocumentFilterCtrl",
                windowClass: 'modalLargeDialog scroll-hidden',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    params: function () {
                        return {
                            isGlobalDocs: self.isGlobalDocs,
                            plaintifflist: self.docPlaintiffs,
                            docPlaintiffDefendants: self.docPlaintiffDefendants,
                            categories: self.documentCategories,
                            filteredCategory: filtercopy.category,
                            filteredPlaintiff: filtercopy.plaintiff,
                            filteredPlaintiffName: filtercopy.plaintiffName,
                            filteredMatter: filtercopy.matterid,
                            filteredMatterName: filtercopy.mattername,
                            createdByFilter: filtercopy.createdByFilter,
                            updatedByFilter: filtercopy.updatedByFilter,
                            c_start_date: filtercopy.c_start_date,
                            c_end_date: filtercopy.c_end_date,
                            u_start_date: filtercopy.u_start_date,
                            u_end_date: filtercopy.u_end_date,
                            need_to_be_Reviewed: filtercopy.need_to_be_Reviewed,
                            docTags: angular.copy(self.display.filtertags)
                        };
                    }
                }
            });

            modalInstance.result.then(function (selectedItem) {
                documentListHelper.setFilterObj(self.display.filters, selectedItem.filters);
                self.filterddocs = true;
                createFilterTags(self.display.filters, selectedItem.users);
                self.documentsList.pageNum = 1;
                $(window).scrollTop(scrollPos - 1);
                getDocuments();

            }, function () {

            });
        };

        function getFileExtention(doc) {
            var docName;
            if (doc && doc.doc_name) {
                docName = doc.doc_name;
            } else if (doc && doc.documentname) {
                docName = doc.documentname;
            }
            var extension = (docName).split('.').pop();
            extension = extension.toLowerCase();
            return extension;
        }

        /**
         * New document open with microsoft online
         */
        var newDocOpenOnline = $rootScope.$on('openOnlineOnline', function ($event, args) {
            viewOnline(args.docDetails, false, undefined, 'new-document');
        });

        /**
         * Old document open with microsoft online
         */
        var exsitingDocOpenOnline = $rootScope.$on('openOnlineEditMode', function ($event, args) {
            var documentId = args.docDetails.documentId;
            var matterId = args.docDetails.matterId;
            getDocumentDetails(documentId, matterId);
        });

        // $scope.$on('$destroy', function () {
        //     newDocOpenOnline();
        //     exsitingDocOpenOnline();
        // });

        /**
         * Get Document details
         */
        function getDocumentDetails(documentId, matterId) {
            documentsDataService.getOneDocumentDetails(documentId, matterId)
                .then(function (response) {
                    viewOnline(response.data, true, undefined, 'edit-document');
                }, function (error) {
                    notificationService.error("Unable to get document details");
                });
        }

        /**
         * Open document with microsoft online (docx, xlsx, pptx)
         */
        self.opendocumentView = function (doc, isGlobalDoc, $event, actionType) {
            var action = (actionType == 'new-document') ? 'edit' : 'view';
            var docEditPermission = self.docPermissions[0].E;
            var extType = getFileExtention(doc);
            var type = 'global';
            self.officeView = false;
            var discData = JSON.parse(localStorage.getItem("discovery"));
            _.forEach(discData, function (data) {
                if ((extType.toLowerCase() === data.ext) && (data.actionName == action)) {
                    self.officeView = true;
                }
            });
            if ($state.current.name == 'documents') {
                isGlobalDoc = true;
            }
            var docdata = {
                doctype: type,
                matterId: doc.matter.matter_id,
                documentId: doc.doc_id,
                isGlobalDoc: isGlobalDoc,
                isOfficeView: self.officeView,
                isEditPermission: docEditPermission
            };
            documentsDataService.setDocumentInfo(docdata);
            localStorage.setItem("selDocumentInfo", JSON.stringify(docdata));



            var modalInstance = $modal.open({
                templateUrl: "app/documents/view-document/document-popup-view.html",
                controller: "DocumentsPopupViewCtrl as docpopupviewCtrl",
                size: 'lg',
                backdrop: 'static',
                keyboard: false,
                windowClass: 'modalLargeDialog',
                resolve: {
                    docdetails: function () {
                        return docdata;
                    }
                }
            });
            modalInstance.result.then(function () {

            });
        };

        /**
         * View document online with microsoft 365
         */
        function viewOnline(doc, isGlobalDoc, $event, actionType) {
            var action = (actionType == 'new-document') ? 'edit' : 'view';
            var docEditPermission = self.docPermissions[0].E;
            var extType = getFileExtention(doc);
            var type = 'global';
            var javaAccessToken = localStorage.getItem("accessToken");
            if (utils.isNotEmptyVal(javaAccessToken)) {
                var discData = JSON.parse(localStorage.getItem("discovery"));
                var wopiurl = documentsConstants.RESTAPI.wopiUrl1;
                if (doc.matter && doc.matter.matter_id) {
                    doc.matter_id = utils.isNotEmptyVal(doc.matter.matter_id) ? doc.matter.matter_id : '';
                }
                (doc.matter_id != undefined) ? doc.matter_id = doc.matter_id : doc.matter_id = doc.matterid;
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
                    documentId: (doc.doc_id) ? doc.doc_id : doc.documentid,
                    isGlobalDoc: isGlobalDoc,
                    isOfficeView: self.OfficeFlag,
                    isEditPermission: docEditPermission,
                    favIconUrl: self.favIconUrl,
                    doc_name: (doc.doc_name) ? (doc.doc_name).split('.').shift() : (doc.documentname).split('.').shift()
                };
                documentsDataService.setDocumentInfo(docdata);
                localStorage.setItem("selDocumentInfo", JSON.stringify(docdata));
                if (self.OfficeFlag && self.officeOnlineStat) {
                    self.extFlag = self.OfficeFlag;
                    if ($state.current.name == 'documents') {
                        $state.go('global-office-view');
                    } else {
                        $state.go('office-view', { 'matterId': doc.matter_id, 'documentId': doc.doc_id });
                    }

                } else {
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
            } else {
                notificationService.error("Uable to authenticate user");
            }
        }

        /*Cteate tags*/
        function createFilterTags(filters, users) {
            self.display.filtertags = [];

            if (utils.isNotEmptyVal(filters.category)) {
                var cat = []
                _.forEach(filters.category, function (item) {
                    _.forEach(self.documentCategories, function (a) {
                        if (a.doc_category_id == item) {
                            cat.push(a.doc_category_name);
                        }
                    });
                });

                if (utils.isNotEmptyVal(cat)) {
                    _.forEach(cat, function (item) {
                        var catFilter = {};
                        catFilter.value = 'Category : ' + item;
                        catFilter.key = 'category';
                        self.display.filtertags.push(catFilter);
                    });
                }
            }

            if (utils.isNotEmptyVal(filters.plaintiff)) {
                if (!angular.isUndefined(filters.plaintiffName) && filters.plaintiffName != '') {
                    pt = filters.plaintiffName;
                } else {
                    var pt = $.map(self.docPlaintiffs, function (a) {
                        if (a.plaintiffID == filters.plaintiff) {
                            return a.plaintiffName;
                        }
                    });
                    pt = pt[0];
                }

                if (utils.isNotEmptyVal(pt)) {
                    var ptFilter = {};
                    ptFilter.value = 'Associated Party : ' + pt;
                    ptFilter.key = 'plaintiff';
                    self.display.filtertags.push(ptFilter);
                }
            }

            if (utils.isNotEmptyVal(filters.mattername)) {
                var mFilter = {};
                mFilter.value = 'Matter : ' + filters.mattername;
                mFilter.key = 'matterid';
                self.display.filtertags.push(mFilter);
            }

            if (utils.isNotEmptyVal(filters.updatedByFilter)) {
                var updatedFilter = {};
                var user = _.find(users, function (usr) {
                    return usr.uid == filters.updatedByFilter;
                });

                updatedFilter.value = 'Updated by: ' + user.Name;
                updatedFilter.key = 'updatedByFilter';

                self.display.filtertags.push(updatedFilter);
            }

            if (utils.isNotEmptyVal(filters.createdByFilter)) {
                var createdFilter = {};
                var user = _.find(users, function (usr) {
                    return usr.uid == filters.createdByFilter;
                });

                createdFilter.value = 'Created by: ' + user.Name;
                createdFilter.key = 'createdByFilter';

                self.display.filtertags.push(createdFilter);
            }



            if (utils.isNotEmptyVal(filters.need_to_be_Reviewed) && filters.need_to_be_Reviewed) {
                var NeedToBeReviewed = {};
                NeedToBeReviewed.key = 'need_to_be_Reviewed';
                NeedToBeReviewed.type = 'need_to_be_Reviewed';
                NeedToBeReviewed.value = 'Needs Review';

                self.display.filtertags.push(NeedToBeReviewed);
            }

            if (utils.isNotEmptyVal(filters.c_start_date) && utils.isNotEmptyVal(filters.c_end_date)) {
                var cDateRange = {};

                cDateRange.value = 'Created Range: ' + moment.unix(filters.c_start_date).format('MM/DD/YYYY') + ' - ' + moment.unix(filters.c_end_date).format('MM/DD/YYYY');
                cDateRange.key = 'cDateRange';

                self.display.filtertags.push(cDateRange);
            }

            if (utils.isNotEmptyVal(filters.u_start_date) && utils.isNotEmptyVal(filters.u_end_date)) {
                var uDateRange = {};

                uDateRange.value = 'Updated Range: ' + moment.unix(filters.u_start_date).format('MM/DD/YYYY') + ' - ' + moment.unix(filters.u_end_date).format('MM/DD/YYYY');
                uDateRange.key = 'uDateRange';

                self.display.filtertags.push(uDateRange);
            }

            var retainsFilter = JSON.parse(sessionStorage.getItem("retainFilters"));

            if (utils.isNotEmptyVal(retainsFilter) && !self.isGlobalDocs) {
                if (self.matterId != retainsFilter.matterID) {
                    sessionStorage.removeItem("motionFiltertags");
                    sessionStorage.removeItem("matterNotesFilters");
                    sessionStorage.removeItem("timeLineListFilters");
                }
            }
            if (!self.isGlobalDocs) {
                $rootScope.retainFilters.matterID = self.matterId;
                sessionStorage.setItem("retainFilters", JSON.stringify($rootScope.retainFilters));
            }
        }

        function filterReatain() {
            if (self.isGlobalDocs) {
                var globalDocFilterText = self.display.filterText;
                sessionStorage.setItem("globalDocFilterText", globalDocFilterText);
            } else {
                var retainSText = JSON.parse(sessionStorage.getItem("retainSearchText"));
                if (utils.isNotEmptyVal(retainSText)) {
                    if (self.matterId != retainSText.matterid) {
                        $rootScope.retainSearchText = {};
                    }
                }
                $rootScope.retainSearchText.docFiltertext = self.display.filterText;
                $rootScope.retainSearchText.matterid = self.matterId;
                sessionStorage.setItem("retainSearchText", JSON.stringify($rootScope.retainSearchText));
            }
        }

        /*Remove Filter tag*/
        function cancleFilterTags(cancelled) {
            self.documentsList.pageNum = 1;
            var scrollPos = $(window).scrollTop();
            $(window).scrollTop(scrollPos - 1);
            switch (cancelled.key) {
                case 'category':
                    var categoryObj = [];
                    var categoryObjString = [];
                    _.forEach(self.display.filters.category, function (item) {
                        _.forEach(self.documentCategories, function (a) {
                            if (a.doc_category_id == item) {
                                categoryObj.push(a);
                            }
                        });
                    });
                    if (utils.isNotEmptyVal(categoryObj)) {
                        _.forEach(categoryObj, function (item) {
                            var catFilter = {};
                            catFilter.value = 'Category : ' + item.doc_category_name;
                            catFilter.key = 'category';
                            categoryObjString.push(catFilter);
                        });
                        self.display.filtertags.unshift(categoryObjString[0]);
                    }
                    _.forEach(categoryObjString, function (item, index) {
                        if (item.value == cancelled.value) {
                            self.display.filters.category.splice(index, 1);
                            self.display.filtertags.splice(index, 1);
                        }
                    });
                    break;
                case 'matterid':
                    _.forEach(self.display.filtertags, function (item, index) {
                        if (angular.isDefined(item)) {
                            if (item.key === 'plaintiff') {
                                self.display.filtertags.splice(index, 1);
                                self.display.filters[item.key] = '';
                                self.display.filters['plaintiffName'] = '';
                            }
                        }
                    });
                    self.display.filters[cancelled.key] = '';
                    self.display.filters['mattername'] = '';
                    break;
                case 'createdByFilter':
                case 'updatedByFilter':
                case 'plaintiff':
                    self.display.filters[cancelled.key] = '';
                    break;
                case 'SS':
                    // self.display.filterText = '';
                    break;
                case 'cDateRange':
                    self.display.filters.c_end_date = '';
                    self.display.filters.c_start_date = '';
                    break;
                case 'uDateRange':
                    self.display.filters.u_end_date = '';
                    self.display.filters.u_start_date = '';
                    break;

                case 'need_to_be_Reviewed':
                    self.display.filters.need_to_be_Reviewed = 0;
                    break;

            }
            var currentFilters = _.pluck(self.display.filtertags, cancelled.key);
            if (cancelled.key != 'SS') {
                self.filterddocs = true;
                getDocuments();
            }

        }

        /*Get the Document Categories*/
        function getDocCategories() {
            documentsDataService.getDocumentCategories()
                .then(function (response) {
                    self.documentCategories = response;
                }, function (error) {
                    notificationService.error('document categories not loaded');
                });
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

        function refreshToken() {
            // get new access token for refresh token request
            var tokenReissue = {
                'refreshToken': localStorage.getItem('refreshToken')
            }
            loginDatalayer.refreshToken(tokenReissue)
                .then(function (response) {
                    localStorage.setItem('accessToken', response.accessToken);
                    getDiscoveryDetail();
                }, function (status) {
                    if (status === 401) {
                        loginDatalayer.logoutUser()
                            .then(function () {
                                notificationService.error('You are unauthorized to access this service.');
                                localStorage.clear();
                                $state.go('login');
                            });
                        return;
                    }
                });
        }

        /*Get all plaintiffs of matter*/
        function getPlaintiffsForDocument(matterId) {
            documentsDataService.getPlaintiffs(matterId)
                .then(function (response) {
                    self.docPlaintiffs = response;
                    getDefendants(matterId);
                }, function (error) {
                    notificationService.error('plaintiffs not loaded');
                });
        }

        function getDefendants(matterId) {
            allPartiesDataService.getDefendants(matterId)
                .then(function (res) {
                    self.docDefendants = res.data;
                    allPartiesDataService.getOtherPartiesBasic(matterId)
                        .then(function (res) {
                            self.docOtherparties = res.data;
                            self.docPlaintiffDefendants = getDocPlaintiffData(self.docPlaintiffs, self.docDefendants, self.docOtherparties);
                        });
                });
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
                if (utils.isNotEmptyVal(defendant.contactid)) {
                    // var defendantName = utils.isNotEmptyVal(defendant.contactid.firstname) ? defendant.contactid.firstname : "";
                    // defendantName += "" + utils.isNotEmptyVal(defendant.contactid.lastname) ? defendant.contactid.lastname : "";
                    var defendantFirstName = utils.isNotEmptyVal(defendant.contactid.firstname) ? defendant.contactid.firstname : "";
                    var defendantLastName = utils.isNotEmptyVal(defendant.contactid.lastname) ? defendant.contactid.lastname : "";
                    var defendantName = defendantFirstName + " " + defendantLastName;
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
                    // var otherPartyName = utils.isNotEmptyVal(otherParty.firstname) ? otherParty.firstname : "";
                    // otherPartyName += "" + utils.isNotEmptyVal(otherParty.lastname) ? otherParty.lastname : "";
                    var otherFirstName = utils.isNotEmptyVal(otherParty.firstname) ? otherParty.firstname : "";
                    var otherLastName = utils.isNotEmptyVal(otherParty.lastname) ? otherParty.lastname : "";
                    var otherPartyName = otherFirstName + " " + otherLastName;
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

    }
})();



/* Document Pop up view controller. 
 * */
(function () {

    'use strict';

    angular
        .module('cloudlex.documents')
        .controller('DocumentsPopupViewCtrl', DocumentsPopupViewCtrl);

    DocumentsPopupViewCtrl.$inject = ['$scope', '$rootScope', 'documentsDataService', 'documentsConstants', 'notification-service', '$state', 'masterData', '$modalInstance', 'docdetails', '$modal', 'matterFactory'];

    function DocumentsPopupViewCtrl($scope, $rootScope, documentsDataService, documentsConstants, notificationService, $state, masterData, $modalInstance, docdetails, $modal, matterFactory) {

        var self = this;
        self.documentDetails = docdetails;
        var matterId = docdetails.matterId;
        var documentId = docdetails.documentId;
        self.moduleView = docdetails.moduleView;
        // var docdetails = {};

        //off 365
        self.sessionId = docdetails.sessionId;
        self.openOfficeDoc = openOfficeDoc;
        /*Initial value variable*/
        self.matterId = docdetails.matterId;
        var matterId = docdetails.matterId;
        self.documentId = docdetails.documentId;
        var documentId = docdetails.documentId;
        self.isEditPermission = docdetails.isEditPermission == 0 ? true : false;
        // $state.current.name = (docdetails.isGlobalDoc) ? 'documents' : 'matter-documents';
        self.editdoc = false;
        self.editable = false;
        //US#4713 disable add edit delete 
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        //off 365
        self.extType = docdetails.extType;
        self.urlD = docdetails.docUrl;
        (function () {
            getPermissions();
            getDiscoveryDetail();
            getOfficeOnlineStatus();
            getDocumentDetails(self.documentId, self.matterId);
            /*Initialization on page load*/
            if ($state.current.name == 'document-edit' || $state.current.name == 'globaldocument-edit') {
                if ($state.current.name == 'globaldocument-edit') {
                    self.globalDocview = true;
                } else {
                    self.globalDocview = false;
                    setBreadcrum(self.matterId, 'Document Edit');
                }

                self.editdoc = true;
                getDocumentDetail();
                getDocCategories();
            } else if ($state.current.name == 'matter-documents' || $state.current.name == 'documents' || $state.current.name == 'matter-detail') {
                if ($state.current.name == 'matter-detail' || $state.current.name == 'matter-documents') {
                    self.globalDocview = false;
                } else {
                    self.globalDocview = true;
                }
                getDocumentDetail();
            }

            self.matterInfomation = matterFactory.getMatterData(self.matterId);

        })();

        self.locked = [];
        self.viewable = true;

        /* funciton handlers*/
        self.generateDocLink = generateDocLink;
        self.closeDocModal = closeDocModal;
        self.cloneViewDocumentOnline = cloneViewDocumentOnline;
        self.officeOnlineStat = false;

        /**
        * close modal popup
        */
        function closeDocModal() {
            $modalInstance.close();
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
 * Clone document and view online
 */
        function cloneViewDocumentOnline(docDetails) {
            var modalInstance = $modal.open({
                templateUrl: "app/documents/view-document/clone-document.html",
                controller: "cloneDocumentCtrl as cloneDocument",
                windowClass: 'modalMidiumDialog no-scroll-model',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    docDetails: function () {
                        return docDetails;
                    }
                }
            });
        }

        /**
         * clone document and open with microsoft online
         */
        var openDocAfterClone = $rootScope.$on('openNow', function (event, data) {

            getDocumentDetails(data.args.documentid, data.args.matterid, 'fullDetails');
        });

        $scope.$on('$destroy', function () {
            openDocAfterClone();
        });

        /**
         * view document online from view modal 
         */
        self.viewDocumentOnline = function (docDetails) {
            $modalInstance.close();
            viewOnline(docDetails, true, undefined, 'edit-document');
        }

        /**
         * Get Document details
         * @ flag: To open document with online
         */
        function getDocumentDetails(documentId, matterId, flag) {
            documentsDataService.getOneDocumentDetails(documentId, matterId)
                .then(function (response) {
                    self.documentDetails = response;
                    if (flag == "fullDetails") {
                        viewOnline(self.documentDetails, false, undefined, 'new-document');
                        return;
                    }
                    var discData = JSON.parse(localStorage.getItem("discovery"));
                    var extType = getFileExtention(self.documentDetails);
                    self.documentDetails.doc_ext = self.documentDetails.doc_extension.toLowerCase();
                    self.OfficeFlag = false;
                    if (extType != "pdf") {
                        _.forEach(discData, function (data) {
                            if (extType.toLowerCase() === data.ext) {
                                self.OfficeFlag = true;
                            }
                        });
                    }
                    self.documentDetails.isOfficeView = self.OfficeFlag;
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
                (doc.matter.matter_id != undefined) ? doc.matter_id = doc.matter.matter_id : doc.matter_id = doc.matterid;
                if ($state.current.name != 'documents') {
                    type = doc.matter.matter_id;
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
                } else {
                    isGlobalDoc = false;
                }
                var docdata = {
                    docUrl: self.actionUrlToCall,
                    sessionId: javaAccessToken,
                    extType: extType,
                    doctype: type,
                    matterId: doc.matter.matter_id,
                    documentId: doc.doc_id,
                    isGlobalDoc: isGlobalDoc,
                    isOfficeView: self.OfficeFlag,
                    isEditPermission: docEditPermission,
                    favIconUrl: self.favIconUrl,
                    doc_name: (doc.doc_name).split('.').shift()
                };
                documentsDataService.setDocumentInfo(docdata);
                localStorage.setItem("selDocumentInfo", JSON.stringify(docdata));
                if (self.OfficeFlag) {
                    self.extFlag = self.OfficeFlag;
                    if ($state.current.name == 'documents') {
                        $state.go('global-office-view');
                    } else {
                        $state.go('office-view', { 'matterId': doc.matter_id, 'documentId': doc.doc_id });
                    }
                }
            } else {
                notificationService.error("Uable to authenticate user");
            }
        }

        function getFileExtention(doc) {
            var docName;
            if (doc && doc.doc_name) {
                docName = doc.doc_name;
            } else if (doc && doc.documentname) {
                docName = doc.documentname;
            }
            var extension = (docName).split('.').pop();
            extension = extension.toLowerCase();
            return extension;
        }

        function closeDocModal() {
            $modalInstance.close();
        }

        /*Get all plaintiffs of matter*/
        function getPlaintiffsForDocument(matterId) {
            documentsDataService.getPlaintiffs(matterId)
                .then(function (response) {
                    self.docPlaintiffs = response;
                    //getDefendants(matterId);
                }, function (error) {
                    notificationService.error('plaintiffs not loaded');
                });
        }

        var docDataReceived = false;
        /*Get a single document detial*/
        function getDocumentDetail() {
            documentsDataService.getDocumentDetails(matterId, documentId)
                .then(function (response) {
                    /*Checking if received the proper responce or not*/
                    if (response.doc_name) {
                        self.singleDoc = response;
                        setDocumentDetails();
                        if (response.more_info_type == "insurance") {
                            getPlaintiffsForDocument(response.matter.matter_id);
                        }
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
            self.singleDoc.currentlyusedby = self.singleDoc.currently_used_by.first_name.trim();
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
                    name: self.singleDoc.matter_name,
                    matterid: self.singleDoc.matterid
                }];
                self.docModel.matterid = self.singleDoc.matterid;
                //    }
                self.docModel.documentname = self.singleDoc.documentname;
                self.docModel.category = self.singleDoc.categoryid;
                self.docModel.needs_review = self.singleDoc.needs_review == "1";
                self.singleDoc.plaintiff_name = $.trim(self.singleDoc.plaintiff_name);

                if (self.singleDoc.plaintiff_name != null && self.singleDoc.plaintiff_name != "") {
                    self.docModel.docPlaintiff = self.singleDoc.doc_plaintiff;
                } else {
                    self.docModel.docPlaintiff = '';
                }

                if (self.singleDoc.doc_tags != null && self.singleDoc.doc_tags != '') {
                    var tagsOfDoc = self.singleDoc.doc_tags.split(' ');
                    angular.forEach(tagsOfDoc, function (datavalue, datakey) {
                        self.docAddTags.push({ "name": datavalue });
                    });
                }

                self.moreInfoSelect = self.singleDoc.moreinfo_type;
                setMoreInfoType(self.singleDoc.moreinfo_type);
                self.setMoreInformationType(self.docModel.category);
                self.moreinfoPrased = self.singleDoc.moreInfo_parsed;

                self.docModel.associated_party_id = utils.isNotEmptyVal(self.singleDoc.moreInfo_parsed.associated_party_id) ?
                    self.singleDoc.moreInfo_parsed.associated_party_id : '';

                self.docModel.party_role = utils.isNotEmptyVal(self.singleDoc.moreInfo_parsed.party_role) ?
                    self.singleDoc.moreInfo_parsed.party_role : '';
            }
            return true;
        }

        /*Generate download link for documents*/
        function generateDocLink() {
            documentsDataService.downloadDocument(documentId)
                .then(function (response) {
                    if (response && response && response != '') {
                        utils.downloadFile(response, self.documentDetails.doc_name, "Content-Type");

                    } else {
                        notificationService.error('Unable to download document');
                    }

                }, function (error) {
                    notificationService.error('document categories not loaded');
                });
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
                if (sizeofFile > 250) {
                    return 0;
                }
            }
            return 1;
        }

        var sessionalive;

        function stripScriptTag(object) {
            angular.forEach(object, function (val, key) {
                object[key] = (typeof object[key] === "string") ?
                    object[key].replace(/<script.*?>.*?<\/script>/igm, '') : object[key];

                if (typeof object[key] === "object") {
                    stripScriptTag(object[key]);
                }
            });
        }
        /* Create paramter to send in edit document service */
        function createPrams() {
            var moreInfo = {};
            var singledovParams = {};
            singledovParams.documentId = self.singleDoc.documentid;
            singledovParams.documentname = self.docModel.documentname;
            singledovParams.categoryid = self.docModel.category;
            singledovParams.plaintiffId = self.docModel.docPlaintiff;
            singledovParams.needs_review = self.docModel.needs_review ? "1" : "0";
            singledovParams.uploadtype = 'version';
            singledovParams.matterid = self.docModel.matterid;
            // ? self.docModel.matterid : self.matterId;
            singledovParams.tags = _.pluck(self.docAddTags, 'name');
            singledovParams.moreInfoSelect = angular.isUndefined(self.moreInfoSelect) ? '' : self.moreInfoSelect;
            if (angular.isUndefined(self.moreInfoSelect)) {
                singledovParams.moreInfoSelect = '';
            } else {
                singledovParams.moreInfoSelect = self.moreInfoSelect;
            }

            var isMoreInfoValid = setMoreInfo(moreInfo);
            if (isMoreInfoValid === false) { return false; }

            singledovParams.moreInfo = utils.isEmptyVal(moreInfo) ? '' : JSON.stringify(moreInfo);

            return singledovParams;
        }


    }
})();

/**
 co-auth
 */

(function () {
    angular
        .module('cloudlex.documents')
        .controller('coAuthCtrl', coAuthCtrl);

    coAuthCtrl.$inject = ['documentsDataService', '$modalInstance', 'coAuthDocName', 'documentInfo', 'notification-service', 'ListDataInfo'];

    function coAuthCtrl(documentsDataService, $modalInstance, coAuthDocName, documentInfo, notificationService, ListDataInfo) {
        var vm = this;
        vm.coAuthDocName = coAuthDocName;
        vm.deleteSelectedDocument = deleteSelectedDocument;
        vm.cancel = cancel;

        function cancel() {
            $modalInstance.close();
        }

        /*
            func to delete document
         */
        function deleteSelectedDocument() {
            var docdata = documentInfo;
            documentsDataService.checkIfFileExists(docdata.docID)
                .then(function (response) {
                    if (response && response != '') {
                        var promesa = documentsDataService.deleteDocument(docdata);
                        promesa.then(function (data) {
                            notificationService.success('Documents deleted successfully');
                            angular.forEach(docdata['docID'], function (datavalue, datakey) {
                                var index = _.findIndex(ListDataInfo.listData, { doc_id: datavalue });
                                ListDataInfo.listData.splice(index, 1);
                                ListDataInfo.totalLength = parseInt(ListDataInfo.totalLength) - parseInt(1);
                            });
                            $modalInstance.close(ListDataInfo);
                        }, function (error) {
                            notificationService.error('Unable to delete documents');
                        });
                    } else {
                        notificationService.error('Unable to delete document');
                    }

                });
        }


    }

})();



/**
 * view comment controller for medical information
 */

//add medical info modal controller
(function () {
    angular
        .module('cloudlex.documents')
        .controller('viewCommentDocumentCtrl', viewCommentDocumentCtrl);

    viewCommentDocumentCtrl.$inject = ['$rootScope', '$modalInstance', 'viewCommentInfo'];

    function viewCommentDocumentCtrl($rootScope, $modalInstance, viewCommentInfo) {
        var vm = this;
        vm.memo = (viewCommentInfo.selectedItems.memo != null) ? viewCommentInfo.selectedItems.memo : "";
        vm.close = function () {
            $modalInstance.close();
            $rootScope.$broadcast('unCheckSelectedItems');
        };
    }

})();

(function () {
    angular.module('cloudlex.documents')
        .factory('documentListHelper', documentListHelper);

    function documentListHelper() {
        var selectedDocument = {};
        return {
            setSelectedDocument: _setSelectedDocument,
            getSelectedDocument: _getSelectedDocument,
            getGridHeaders: getGridHeaders,
            isDocumentSelected: isDocumentSelected,
            docDisplayOptions: docDisplayOptions,
            setFilterObj: setFilterObj,
        }

        function _setSelectedDocument(document) {
            selectedDocument = document;
        }

        function _getSelectedDocument() {
            return selectedDocument;
        }
        function getGridHeaders(isGlobalDocs) {
            if (!isGlobalDocs) {
                return [

                    {
                        dataWidth: "4",
                        field: [{
                            html: '<span data-ng-show="data.memo" class ="sprite default-view-comment" ng-click = "documentlist.viewCommentMedicalInfo(data)" tooltip="View Memo" tooltip-append-to-body="true" tooltip-placement="right"></span>',
                            inline: true
                        }],

                    },
                    // {
                    //     dataWidth: "4",
                    //     field: [{
                    //         html: '<span data-ng-show="documentlist.collaboratedEntityFlag" class ="sprite default-userprofile" ng-click = "documentlist.viewCollaborateInfo(data)" tooltip="Collaborated Info" tooltip-append-to-body="true" tooltip-placement="right"></span>',
                    //         inline: true
                    //     }],

                    // },
                    {
                        displayName: 'Document Name',
                        dataWidth: "23",
                        field: [

                            {
                                prop: 'doc_name',
                                onClick: "documentlist.opendocumentView(data, false, $event)",
                                href: { link: 'javascript: void(0);', paramProp: ['mid', 'doc_id'] }
                            },
                            {
                                prop: 'tags_String',
                            }
                        ],
                    },
                    {
                        displayName: 'Associated Party and Category',
                        dataWidth: "22",
                        field: [{
                            prop: 'plaintiff_name',
                        },
                        {
                            prop: 'categoryname'
                        }
                        ],
                    },
                    {
                        displayName: 'Last Updated',
                        dataWidth: "15",
                        field: [{
                            prop: 'last_updated_by_name',
                        },
                        {
                            prop: 'docmodified_date'
                        }
                        ],
                    },
                    // {
                    //     displayName: 'Currently Used By',
                    //     dataWidth: "12",
                    //     field: [{
                    //         prop: 'currentlyusedby',
                    //         condition: 'is_locked',
                    //     }],
                    // },
                    {
                        displayName: 'Created By',
                        dataWidth: "15",
                        field: [{
                            prop: 'created_by_name'
                        }],
                    },
                    {
                        displayName: 'Date Filed',
                        dataWidth: "15",
                        field: [
                            {
                                prop: 'date_filed_date'
                            }
                        ],
                    }
                ];
            } else if (isGlobalDocs) {
                return [

                    {
                        dataWidth: "4",
                        field: [{
                            html: '<span data-ng-show="data.memo" class ="sprite default-view-comment" ng-click = "documentlist.viewCommentMedicalInfo(data)" tooltip="View Memo" tooltip-append-to-body="true" tooltip-placement="right"></span>',
                            inline: true
                        }],

                    },

                    {
                        displayName: 'Document Name',
                        dataWidth: "25",
                        field: [{
                            prop: 'doc_name',
                            onClick: "documentlist.opendocumentView(data, false, $event)",
                            href: { link: 'javascript: void(0);', paramProp: ['mid', 'doc_id'] }

                        },
                        {
                            prop: 'tags_String',
                        }
                        ],

                    },
                    {
                        displayName: 'Matter, Category and Associated Party',
                        dataWidth: "24",
                        field: [{
                            prop: 'matter_name',
                            href: { link: '#/matter-overview', paramProp: ['mid'] },
                        },
                        {
                            prop: 'categoryname'
                        },
                        {
                            prop: 'plaintiff_name',
                        }
                        ],
                    },
                    {
                        displayName: 'Last Updated',
                        dataWidth: "15",
                        field: [{
                            prop: 'last_updated_by_name',
                        },
                        {
                            prop: 'docmodified_date'
                        }
                        ],
                    },
                    // {
                    //     displayName: 'Currently Used By',
                    //     dataWidth: "12",
                    //     field: [{
                    //         prop: 'currentlyusedby',
                    //         condition: 'is_locked',
                    //     }],
                    // },
                    {
                        displayName: 'Created By',
                        dataWidth: "15",
                        field: [{
                            prop: 'created_by_name'
                        }],
                    },
                    {
                        displayName: 'Date Filed',
                        dataWidth: "15",
                        field: [
                            {
                                prop: 'date_filed_date'
                            }
                        ],
                    }
                ];
            }
        }

        function isDocumentSelected(documentList, doc) {
            var ids = _.pluck(documentList, 'doc_id');
            return ids.indexOf(doc.doc_id) > -1;
        }

        function docDisplayOptions(isGlobalDocs) {
            if (!isGlobalDocs) {
                return {
                    filtered: true,
                    documentListReceived: false,
                    documentSelected: {},
                    sortOption: [{
                        'key': 1,
                        'lable': 'Associated Party',
                        'sortorder': 'asc',
                        'divider': 1,
                    },
                    // {
                    //     'key': 2,
                    //     'lable': 'Date Uploaded',
                    //     'sortorder': 'desc',
                    //     'divider': 1,
                    // },
                    {
                        'key': 3,
                        'lable': 'Document Name ASC',
                        'sortorder': 'asc',
                        'divider': 1,
                    },
                    {
                        'key': 3,
                        'lable': 'Document Name DESC',
                        'sortorder': 'desc',
                        'divider': 1,
                    },
                    {
                        'key': 5,
                        'lable': 'Last Updated',
                        'divider': 1
                    },
                    {
                        'key': 6,
                        'lable': 'Date Filed ASC',
                        'sortorder': 'asc',
                        'divider': 1,
                    },
                    {
                        'key': 6,
                        'lable': 'Date Filed DESC',
                        'sortorder': 'desc',
                        'divider': 0,
                    }
                    ],
                    sortSeleted: 'Last Updated',
                    sortby: '5',
                    sortorder: '',
                    filters: {
                        plaintiff: '',
                        category: '',
                    },
                    filtertags: [],
                    filterText: '',
                };
            } else if (isGlobalDocs) {
                return {
                    filtered: true,
                    documentListReceived: false,
                    documentSelected: {},
                    sortOption: [{
                        'key': 3,
                        'lable': 'Document Name ASC',
                        'sortorder': 'asc',
                        'divider': 1,
                    },
                    {
                        'key': 3,
                        'lable': 'Document Name DESC',
                        'sortorder': 'desc',
                        'divider': 1,
                    },
                    {
                        'key': 4,
                        'lable': 'Matter Name',
                        'sortorder': 'asc',
                        'divider': 1,
                    },
                    {
                        'key': 5,
                        'lable': 'Last Updated',
                        'sortorder': 'desc',
                        'divider': 1
                    },
                    {
                        'key': 6,
                        'lable': 'Date Filed ASC',
                        'sortorder': 'asc',
                        'divider': 1,
                    },
                    {
                        'key': 6,
                        'lable': 'Date Filed DESC',
                        'sortorder': 'desc',
                        'divider': 0,
                    }
                    ],
                    sortSeleted: 'Last Updated',
                    sortby: 5,
                    sortorder: '',
                    filters: {
                        plaintiff: '',
                        category: '',
                        matterid: '',
                        mattername: '',
                    },
                    filtertags: [],
                    filterText: '',
                };
            }

        }

        function setFilterObj(filterObj, selectedFilters) {
            _.forEach(selectedFilters, function (val, key) {
                if (utils.isNotEmptyVal(val)) {
                    filterObj[key] = val;
                } else {
                    filterObj[key] = '';
                }
            });
        }

    }
})();
