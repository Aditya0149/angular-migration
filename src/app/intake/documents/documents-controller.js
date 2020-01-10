/* Docuement module controller. 
 * */
(function () {

    'use strict';

    angular
        .module('intake.documents')
        .controller('IntakeDocumentsCtrl', DocumentsController);

    DocumentsController.$inject = ['$scope', '$window', 'inatkeDocumentsDataService', '$stateParams', 'intakeDocumentsConstants', 'intakeDocumentListHelper',
        'notification-service', '$modal', 'routeManager', 'intakeFactory', '$rootScope', 'globalConstants', '$state', 'IntakePlaintiffDataService', 'masterData', 'practiceAndBillingDataLayer', '$q', 'profileDataLayer', 'mailboxDataService'
    ];

    function DocumentsController($scope, $window, inatkeDocumentsDataService, $stateParams, intakeDocumentsConstants, intakeDocumentListHelper,
        notificationService, $modal, routeManager, intakeFactory, $rootScope, globalConstants, $state, IntakePlaintiffDataService, masterData, practiceAndBillingDataLayer, $q, profileDataLayer, mailboxDataService) {
        var self = this,
            initLimit = 15;
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.email_subscription = gracePeriodDetails.email_subscription; // role email subscription
        var socket;
        self.docId = [];
        self.docName;
        self.docdata = {};
        self.reloadEmail = false;
        var coAuthDocumentsName = [];
        self.insuranceTypeList = angular.copy(globalConstants.insuranceTypeList);
        var NewTabForDocSignUrl;
        /*Initial value variable*/
        if ($stateParams.intakeId) {
            self.matterId = $stateParams.intakeId;
            var matterId = $stateParams.intakeId;
            self.isGlobalDocs = false;
            self.mydocs = false;
        } else {
            var matterId = 0;
            self.isGlobalDocs = true;
            self.mydocs = true;
        }
        self.pageSize = 250;
        self.documentCategories = {};
        self.docPlaintiffs = [];

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
            var globalDocFilterText = localStorage.getItem("globalDocFilterIntakeText");
            if (utils.isNotEmptyVal(globalDocFilterText)) {
                self.showSearch = true;
            }
        } else {
            var retainSText = JSON.parse(localStorage.getItem("retainSearchTextForIntake"));
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
        self.extFlag = false;
        self.officeOnlineStat = false;
        self.firmData = { API: "PHP", state: "mailbox" };
        //US#9315 compose e-fax form documents
        self.composeFax = composeFax;
        self.closeComposefax = closeComposefax;
        self.getSearchedData = getSearchedData;
        self.getClearData = getClearData;
        self.searchDocumentOnEnter = searchDocumentOnEnter;
        self.reloadEfax = false;
        (function () {
            //set breadcrum
            getFromUser();
            getOfficeOnlineStatus(); // get office online status
            displayWorkflowIcon();
            self.clxGridOptions = {
                headers: intakeDocumentListHelper.getGridHeaders(self.isGlobalDocs),
                selectedItems: []
            };
            getDocuments();
            window.parent.document.title = "Welcome to CloudLex";
            $rootScope.$emit('favicon', "favicon.ico");
            self.limit = initLimit;
            setBreadcrum();


            getDocCategories();
            getDiscoveryDetail();
            if (!self.isGlobalDocs) {
                //getPlaintiffsForDocument(matterId);
            }
            self.activeTab = { documents: true };
            getPermissions();
            /**
             * firm basis module setting 
             */
            //self.firmData = JSON.parse(localStorage.getItem('firmSettingForIntake'));

        })();

        function getFromUser() {
            var response = profileDataLayer.getViewProfileData();
            response.then(function (data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    self.is_DocuSign = data[0].docusign;

                }
            });
        }

        function displayWorkflowIcon() {
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                var resData = data.matter_apps;                                   //promise
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
            inatkeDocumentsDataService.getOfficeStatus()
                .then(function (response) {
                    self.officeOnlineStat = (response.data.O365.is_active == 1) ? true : false;
                    self.clxGridOptions = {
                        headers: intakeDocumentListHelper.getGridHeaders(self.isGlobalDocs, self.officeOnlineStat),
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
                templateUrl: 'app/intake/documents/view-comment.html',
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
             *  rootScope: composeEmail.intake_id
             */

            var html = "";
            html += (self.signature == undefined) ? '' : self.signature;
            self.composeEmail = html;

            if (self.isGlobalDocs) {
                self.compose = true;
                $rootScope.updateComposeMailMsgBody(self.composeEmail, '0', self.documentsList.data, self.clxGridOptions.selectedItems);
            } else {
                $rootScope.rootComposeMatterId = self.matterId;
                var matter_name = _.pluck(self.clxGridOptions.selectedItems, 'intake_name');
                var selectedMatter = { matterid: self.matterId, name: matter_name[0], filenumber: "000193" };
                self.compose = true;
                _.forEach(self.clxGridOptions.selectedItems, function (item) {
                    item.docmodified_date = (utils.isEmptyVal(item.docmodified_date)) ? "" : moment.unix(item.docmodified_date).format('MM/DD/YYYY');
                    item.doc_id = parseInt(item.intake_document_id);
                    item.doc_name = item.documentname;
                    item.doc_category = {};
                    item.doc_category.doc_category_name = item.categoryname;
                    item.associated_party = {};
                    item.associated_party.associated_party_name = item.associated_party_name;
                    item.created_by_name = item.created_by;
                });
                var intakedata = intakeFactory.getMatterData();
                _.forEach(intakedata.assignedUser, function (item) {
                    item.mail = item.email;
                    item.uid = item.userId;
                    item.name = item.fullName;
                });

                $rootScope.updateComposeMailMsgBody(self.composeEmail, selectedMatter, self.documentsList.data, self.clxGridOptions.selectedItems, 'matterRecipents', intakedata.assignedUser);
            }
        }

        /**
         * get all contact of matter
         */
        function getMatterContact(matterId, callback) {
            intakeFactory.getUserAssignment(matterId)
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
                    // console.log(contactMerge);
                }, function (error) {
                    notificationService.error("Unable to fetch contacts!");
                });
        }

        $rootScope.$on("selectionChanged", function (event, data, reflectChange) {
            if (reflectChange) {
                var selectionDocIds = _.pluck(data, 'doc_id');
                self.clxGridOptions.selectedItems = _.filter(self.documentsList.data, function (doc) {
                    if (selectionDocIds.indexOf(parseInt(doc.intake_document_id)) > -1) {
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
            $rootScope.composeNotesEmail = "";
        }

        // compose mail with selected notes
        function composeFax() {
            /* check document is global or matter document
             *
             *  rootScope: composeEmail.intake_id
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
                $rootScope.rootComposeMatterId = self.matterId;
                var matter_name = _.pluck(self.clxGridOptions.selectedItems, 'matter_name');
                var selectedMatter = { matterid: self.matterId, name: matter_name[0], filenumber: "000193" };
                inatkeDocumentsDataService.getDocumentsList(true, self.matterId, false, '1', self.pageSize, '1', 'asc', '').then(function (data) {
                    self.composeEfax = true;
                    $rootScope.updateComposeEfaxMsgBody(self.composeFaxDetails, selectedMatter, data.data, self.clxGridOptions.selectedItems);
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
            var persistFilterKey = self.isGlobalDocs ? "documentFiltersGlobalIntake" : "documentFiltersIntake";
            var displayObj = localStorage.getItem(persistFilterKey);

            // var searchFilterKey = self.isGlobalDocs ? "SS" : "SS";
            // var docFiltertext = localStorage.getItem(searchFilterKey); 

            if (self.isGlobalDocs) {
                var globalDocFilterText = localStorage.getItem("globalDocFilterIntakeText");
                if (utils.isNotEmptyVal(globalDocFilterText)) {
                    self.display = {};
                    self.display.filterText = globalDocFilterText;
                }
            } else {

                var retainSText = JSON.parse(localStorage.getItem("retainSearchTextForIntake"));
                if (utils.isNotEmptyVal(retainSText)) {
                    if (self.matterId == retainSText.matterid) {
                        self.display = {};
                        self.display.filterText = retainSText.docFiltertext;
                    }
                }
            }
            // var persistFilterKey = self.isGlobalDocs ? "documentFiltersGlobalIntake" : "documentFiltersIntake";
            // var displayObj = localStorage.getItem(persistFilterKey);

            // var searchFilterKey = self.isGlobalDocs ? "SS" : "SS";
            var retainsFilter = JSON.parse(localStorage.getItem("retainFiltersForIntake"));

            if (utils.isNotEmptyVal(displayObj)) {
                try {
                    var displayObj = JSON.parse(displayObj);
                    self.mydocs = self.isGlobalDocs ? displayObj.mydocs : false;

                    if (utils.isNotEmptyVal(retainsFilter)) {
                        if (self.matterId == retainsFilter.matterID) {
                            self.display = displayObj;
                        }
                    } else {
                        self.display = displayObj;
                        if (self.display) {
                            self.display.filters.matterid = self.matterId;
                        }

                        var persistFilterKey = self.isGlobalDocs ? "documentFiltersGlobalIntake" : "documentFiltersIntake"
                        localStorage.setItem(persistFilterKey, JSON.stringify(self.display));
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
                } catch (e) { self.display = intakeDocumentListHelper.docDisplayOptions(self.isGlobalDocs); }
            } else {
                self.display = intakeDocumentListHelper.docDisplayOptions(self.isGlobalDocs);
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

            intakeFactory.setBreadcrum(self.matterId, 'Documents');
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
            _.forEach(filteredDoc, function (currentItem, index) {
                filteredDocs.push(currentItem);
            });
            //Bug#7196 : searched document should get print
            if (utils.isNotEmptyVal(self.display.filterText)) {
                var documentSearch = _.filter(filteredDocs, function (data) {
                    return data.islocked == 0;
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
            inatkeDocumentsDataService.printdocuments(printObj, self.display.filtertags, self.display.sortSeleted);
        }

        function persistFilters() {
            var display = angular.copy(self.display);
            display.documentListReceived = false;
            display.mydocs = self.mydocs;
            display.filters.matterid = self.matterId;
            // self.display.filterText = "";
            display.isGlobalDocs = self.isGlobalDocs;

            var persistFilterKey = self.isGlobalDocs ? "documentFiltersGlobalIntake" : "documentFiltersIntake"
            localStorage.setItem(persistFilterKey, JSON.stringify(display));
            if (self.isGlobalDocs) {
                var globalDocFilterText = localStorage.getItem("globalDocFilterIntakeText");
                if (utils.isNotEmptyVal(globalDocFilterText)) {
                    self.display.filterText = globalDocFilterText;
                }
            } else {
                var retainSText = JSON.parse(localStorage.getItem("retainSearchTextForIntake"));
                if (utils.isNotEmptyVal(retainSText)) {
                    if (self.matterId == retainSText.matterid) {
                        self.display.filterText = retainSText.docFiltertext;
                    }
                }
            }
        }

        function getDocumentData() {
            var promesa = inatkeDocumentsDataService.getDocumentsList(alldocuments, self.matterId, self.mydocs,
                self.documentsList.pageNum, self.pageSize, self.display.sortby, self.display.sortorder, self.display.filters);
            promesa.then(function (data) {
                self.display.documentListReceived = true;
                self.total = data.count;
                _.forEach(data.data, function (item) {
                    item.docmodified_date = (utils.isEmptyVal(item.docmodified_date)) ? "" : moment.unix(item.docmodified_date).format('MM/DD/YYYY');
                    item.date_filed_date = (utils.isEmptyVal(item.date_filed_date) || item.date_filed_date == "0") ? "" : moment.unix(item.date_filed_date).format('MM/DD/YYYY');
                    item.docusign_recieved = utils.isNotEmptyVal(item.docusign_recieved) ? item.docusign_recieved : '';
                    data.data.push(item);
                });
                if (self.filterddocs == true) {
                    self.documentsList.data = data.data;
                    self.documentsList.count = data.data.length;
                    self.documentsList.totallength = data.data.length;
                    self.filterddocs = false;
                } else {
                    _.forEach(data.data, function (item) {
                        self.documentsList.data.push(item);
                    });
                    self.documentsList.count = data.data.length;
                    self.documentsList.totallength = parseInt(self.documentsList.totallength) + parseInt(data.data.length);
                }
                self.documentsList.data = _.unique(self.documentsList.data, 'intake_document_id');
                self.clxGridOptions.selectAll = false;
                self.clxGridOptions.selectedItems = [];

            }, function (reason) {
                notificationService.error('document list not loaded');
            });

        }

        function getDocuments() {
            self.migrate = localStorage.getItem('Migrated');
            var retainsFilter = JSON.parse(localStorage.getItem("retainSearchTextForIntake"));
            if (utils.isNotEmptyVal(retainsFilter)) {
                if (self.matterId == retainsFilter.matterid) {
                    persistFilters();
                }
            } else {
                persistFilters();
            }

            if (utils.isNotEmptyVal(retainsFilter)) {
                if (self.matterId == retainsFilter.matterid) {
                    getSearchedData(retainsFilter.docFiltertext);
                } else {
                    getDocumentData();
                }
            } else {
                getDocumentData();
            }


        }

        //18193 - Search on Document Grid
        function getSearchedData(searchText) {

            $(document).ready(function () {
                $("#search").click(function () {
                    self.documentsList.data = [];
                });
            });
            
            self.searchText = searchText;
            if (self.searchText == '') {
                return '';
            }

            var myRegexp = '[&/%]';
            while (self.searchText.match(myRegexp)) {
                self.searchText = self.searchText.replace(self.searchText.match(myRegexp), '');
            }
            self.searchText = self.searchText.replace(/\\/g, '');

            self.migrate = localStorage.getItem('Migrated');
            var retainsFilter = JSON.parse(localStorage.getItem("retainSearchTextForIntake"));
            if (utils.isNotEmptyVal(retainsFilter)) {
                if (self.matterId == retainsFilter.matterid) {
                    persistFilters();
                }
            } else {
                persistFilters();
            }
            var promesa = inatkeDocumentsDataService.getSearchedData(alldocuments, self.matterId, self.mydocs,
                self.documentsList.pageNum, self.pageSize, self.display.sortby, self.display.sortorder, self.display.filters, self.searchText);
            promesa.then(function (data) {
                self.display.documentListReceived = true;
                self.total = data.count;
                _.forEach(data.data, function (item) {
                    item.docmodified_date = (utils.isEmptyVal(item.docmodified_date)) ? "" : moment.unix(item.docmodified_date).format('MM/DD/YYYY');
                    item.date_filed_date = (utils.isEmptyVal(item.date_filed_date) || item.date_filed_date == "0") ? "" : moment.unix(item.date_filed_date).format('MM/DD/YYYY');
                    item.docusign_recieved = utils.isNotEmptyVal(item.docusign_recieved) ? item.docusign_recieved : '';
                    data.data.push(item);
                });
                if (self.filterddocs == true) {
                    self.documentsList.data = data.data;
                    self.documentsList.count = data.data.length;
                    self.documentsList.totallength = data.data.length;
                    self.filterddocs = false;
                } else {
                    _.forEach(data.data, function (item) {
                        self.documentsList.data.push(item);
                    });
                    self.documentsList.count = data.data.length;
                    self.documentsList.totallength = parseInt(self.documentsList.totallength) + parseInt(data.data.length);
                }
                self.documentsList.data = _.unique(self.documentsList.data, 'intake_document_id');
                self.clxGridOptions.selectAll = false;
                self.clxGridOptions.selectedItems = [];

            }, function (reason) {
                notificationService.error('document list not loaded');
            });

        }

        function searchDocumentOnEnter($event) {
            if ($event.keyCode == 13 && self.display.filterText.length >= 3) {
                self.documentsList.data = [];
                self.documentsList.pageNum = 1;
                getSearchedData(self.display.filterText);
            }
        }

        function getClearData() {
            var retainsFilter = JSON.parse(localStorage.getItem("retainSearchTextForIntake"));
            if (utils.isNotEmptyVal(retainsFilter) && (self.matterId == retainsFilter.matterid)) {
                self.documentsList.data = [];
                localStorage.removeItem("retainSearchTextForIntake");
                self.display.filterText = '';
                getDocuments();
            } else {
                self.display.filterText = '';
                getDocuments();
            }
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
            if (self.documentsList.data.length != 0)
                return self.clxGridOptions.selectedItems.length === self.documentsList.data.length;
        }

        /*check all documents selected*/
        function selectAllDocuments(selected) {
            if (selected) {
                self.clxGridOptions.selectedItems = angular.copy(self.documentsList.data);
            } else {
                self.clxGridOptions.selectedItems = [];
            }
        }

        /*check if document is selected*/
        function isDocSelected(doc) {
            /* if (self.clxGridOptions != undefined) {
                self.display.documentSelected[doc.intake_document_id] =
                    intakeDocumentListHelper.isDocumentSelected(self.clxGridOptions.selectedItems, doc);
                return self.display.documentSelected[doc.intake_document_id];
            }*/
            var ids = _.pluck(self.clxGridOptions.selectedItems, 'intake_document_id');
            return ids.indexOf(doc.intake_document_id) > -1;
        }

        /*Get more Documents*/
        function getNextLimitDocuments(all) {
            self.documentsList.pageNum = parseInt(self.documentsList.pageNum) + parseInt(1);
            if (all == 'all') {
                alldocuments = true;
            }
            getDocuments();
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
                    return data.islocked == 0;
                });
                selectedDocs = dataCopy;
                if (selectedDocs.length == 0) {
                    notificationService.error('Please select document(s) to delete');
                    return;
                }
            }

            self.docdata['docID'] = _.pluck(selectedDocs, 'intake_document_id');

            if (!self.isGlobalDocs) {
                self.docdata['matterid'] = (function () { return _.toArray(arguments); })(matterId);
            } else {
                self.docdata['matterid'] = _.pluck(selectedDocs, 'intake_id');
            }

            // if (globalConstants.webSocketServiceEnable == true) {
            //     /*
            // * WebSocket connection start
            // */
            //     var url = globalConstants.webSocketServiceBase + "Java_Authentication_websocket/serverendpoint/CLXD/" + localStorage.getItem('accessToken') + "?dids=" + self.docdata['docID'];

            //     // Create a new instance of the websocket
            //     socket = new WebSocket(url);

            //     socket.onopen = function (event) {
            //         socket.send("Connection established");
            //     };

            //     socket.onclose = function (event) {
            //         console.log("Connection closed");
            //     };

            //     socket.onerror = function (event) {
            //         var ListDataInfo = {
            //             listData: self.documentsList.data,
            //             totalLength: self.documentsList.totallength
            //         }
            //         coAuthDocsValidation(self.docdata, ListDataInfo);
            //     };

            //     socket.onmessage = function (event) {
            //         if (event.data == 'Unauthorized') {
            //             var tokenReissue = {
            //                 'refreshToken': localStorage.getItem('refreshToken')
            //             }
            //             intakeLoginDatalayer.refreshToken(tokenReissue)
            //                 .then(function (response) {
            //                     localStorage.setItem('accessToken', response.accessToken);
            //                     deleteDocument(selectedDocs, filterdDoc);
            //                 }, function (status) {
            //                     if (status === 401) {
            //                         intakeLoginDatalayer.logoutUser()
            //                             .then(function () {
            //                                 notificationService.error('You are unauthorized to access this service.');
            //                                 localStorage.clear();
            //                                 $state.go('intakelogin');
            //                             });
            //                         return;
            //                     }
            //                 });
            //         }

            //         self.docId = JSON.parse(event.data);
            //         if (utils.isEmptyVal(self.docId)) {
            //             self.docId = [];
            //             coAuthDocumentsName = [];
            //         } else {
            //             _.forEach(self.docId, function (currentItem) {
            //                 _.forEach(selectedDocs, function (doc) {
            //                     if (currentItem == doc.documentid) {
            //                         coAuthDocumentsName.push(doc.documentname);
            //                     }
            //                 });
            //             });
            //         }
            //         /**
            //          * {self.docName}: co-auth document name
            //          * {docData}: selected document id and matter id 
            //          * {selectDocs}: selected document original object
            //          */

            //         var ListDataInfo = {
            //             listData: self.documentsList.data,
            //             totalLength: self.documentsList.totallength
            //         }
            //         coAuthDocsValidation(self.docdata, ListDataInfo);
            //     }
            // } else {
            var ListDataInfo = {
                listData: self.documentsList.data,
                totalLength: self.documentsList.totallength
            }
            coAuthDocsValidation(self.docdata, ListDataInfo);
            // }



        }

        // US:16596 DocuSign
        function sendDocuSign(selectedDocs, filterdDoc) {
            //Error message when trying to push docs to docusign more than 25MB
            getFileSize(selectedDocs, 'intakedoc');

        }
        function getFileSize(files, intakedoc) {
            var selectedDocId = "[" + _.pluck(files, 'intake_document_id').toString() + "]";
            var intakeflag = "1";
            mailboxDataService.getdocumentsize(selectedDocId, intakeflag)
                .then(function (response) {
                    var errorMsg = false;
                    response.data.slice(0).forEach(function (item) {
                        if (item.documentsize == 0 || item.documentsize == null) {
                            self.clxGridOptions.selectedItems = _.filter(angular.copy(self.clxGridOptions.selectedItems), function (it) {
                                return it.intake_document_id != item.intake_document_id
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
                        attachedEnvelopData.matterId = item.intake_id;
                        attachedEnvelopData.documentName = item.documentname;
                        attachedEnvelopData.isIntake = 1;
                        attachedEnvelopData.clxDocumentId = item.intake_document_id;
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
                            list.push(item.documentname);

                        }
                    });
                    if (list.length > 0) {
                        notificationService.error("The selected file format is not supported by DocuSign for" + ' ' + list.toString());
                        return;
                    }

                    var deferred = $q.defer();
                    inatkeDocumentsDataService.createEnvelop(DocArray)
                        .then(function (response) {
                            if (angular.isDefined(response)) {
                                getDocuments();
                                self.clxGridOptions.selectedItems = [];
                                var url = response.url;
                                url.replace(/['"]+/g, '');
                                NewTabForDocSignUrl = url;
                            }

                            window.open(NewTabForDocSignUrl, '_blank');
                            deferred.resolve(response);
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
        function calculateTotalFileSize(intakeDocs) {
            if (intakeDocs && intakeDocs.length == 0) {
                return;
            }
            var intakeDocsize = 0;
            if (intakeDocs && intakeDocs.length > 0) {
                intakeDocsize = intakeDocs.reduce(function (prevVal, elem) {
                    return prevVal + elem.documentsize;
                }, 0);
            } else if (self.composeEmail.intakeDocs && self.composeEmail.intakeDocs.length > 0) {
                intakeDocsize = self.composeEmail.intakeDocs.reduce(function (prevVal, elem) {
                    return prevVal + elem.documentsize;
                }, 0);
            }
            return intakeDocsize;
        }


        /**
         * 
         * @param {} authDocs 
         */
        function coAuthDocsValidation(docdata, ListDataInfo) {
            var modalInstance = $modal.open({
                templateUrl: 'app/intake/documents/document-delete.html',
                controller: 'intakeCoAuthCtrl as docDelete',
                windowClass: 'modalSmallDialog',
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
                // if (globalConstants.webSocketServiceEnable == true) {
                //     if (socket.readyState === WebSocket.OPEN) {
                //         socket.close();
                //     }
                // }
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
            //Bug#7196 : searched document should get download

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
            inatkeDocumentsDataService.downloadDocument(doc.intake_document_id).then(function (item) {
                utils.downloadFile(item, doc.documentname, item.contentType);
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
            filtercopy.c_start_date = (filtercopy.c_start_date) ? intakeFactory.getFormatteddate(filtercopy.c_start_date) : '';
            filtercopy.c_end_date = (filtercopy.c_end_date) ? intakeFactory.getFormatteddate(filtercopy.c_end_date) : '';
            filtercopy.u_start_date = (filtercopy.u_start_date) ? intakeFactory.getFormatteddate(filtercopy.u_start_date) : '';
            filtercopy.u_end_date = (filtercopy.u_end_date) ? intakeFactory.getFormatteddate(filtercopy.u_end_date) : '';

            var modalInstance = $modal.open({
                templateUrl: "app/intake/documents/partial/document-filter.html",
                controller: "IntakeDocumentFilterCtrl",
                windowClass: 'modalLargeDialog scroll-hidden',
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
                            needReviewFilter: filtercopy.needReviewFilter
                        };
                    }
                }
            });

            modalInstance.result.then(function (selectedItem) {
                intakeDocumentListHelper.setFilterObj(self.display.filters, selectedItem.filters);
                self.filterddocs = true;
                createFilterTags(self.display.filters, selectedItem.users);
                self.documentsList.pageNum = 1;
                $(window).scrollTop(scrollPos - 1);
                getDocuments();
            }, function () { });
        };

        function getFileExtention(doc) {
            return (doc.documentname) ? (doc.documentname).split('.').pop() : (doc.doc_name).split('.').pop();
        }

        /**
         * New document open with microsoft online
         */
        $rootScope.$on('openIntakeOnline', function ($event, args) {
            viewOnline(args.docDetails, false, undefined, 'new-document');
        });

        /**
         * Old document open with microsoft online
         */
        $rootScope.$on('openIntakeOnlineEditMode', function ($event, args) {
            var documentId = args.docDetails.documentId;
            var matterId = args.docDetails.matterId;
            getDocumentDetails(documentId, matterId);
        });

        /**
         * Get Document details
         */
        function getDocumentDetails(documentId, matterId) {
            inatkeDocumentsDataService.getOneDocumentDetails(documentId, matterId)
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
            var discData = JSON.parse(localStorage.getItem("discoveryIntake"));
            _.forEach(discData, function (data) {
                if ((extType.toLowerCase() === data.ext) && (data.actionName == action)) {
                    self.officeView = true;
                }
            });
            if ($state.current.name == 'intakedocuments') {
                isGlobalDoc = true;
            }
            var docdata = {
                doctype: type,
                matterId: doc.intake_id,
                documentId: doc.intake_document_id,
                isGlobalDoc: isGlobalDoc,
                isOfficeView: self.officeView,
                isEditPermission: docEditPermission
            };
            inatkeDocumentsDataService.setDocumentInfo(docdata);
            localStorage.setItem("intakeSelDocumentInfo", JSON.stringify(docdata));

            var modalInstance = $modal.open({
                templateUrl: "app/intake/documents/view-document/document-popup-view.html",
                controller: "IntakeDocumentsPopupViewCtrl as docpopupviewCtrl",
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
                var discData = JSON.parse(localStorage.getItem("discoveryIntake"));
                var wopiurl = intakeDocumentsConstants.RESTAPI.wopiUrl;
                (doc.intake.intake_id != undefined) ? doc.intake.intake_id = doc.intake.intake_id : doc.intake.intake_id = doc.intake.matterid;
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
                    isEditPermission: docEditPermission,
                    favIconUrl: self.favIconUrl,
                    doc_name: (doc.doc_name).split('.').shift()
                };
                inatkeDocumentsDataService.setDocumentInfo(docdata);
                localStorage.setItem("intakeSelDocumentInfo", JSON.stringify(docdata));
                if (self.OfficeFlag && self.officeOnlineStat) {
                    self.extFlag = self.OfficeFlag;
                    if ($state.current.name == 'intakedocuments') {
                        $state.go('intakeglobal-office-view');
                    } else {
                        $state.go('intakeoffice-view', { 'intakeId': doc.intake.intake_id, 'documentId': doc.doc_id });
                    }

                } else {
                    var modalInstance = $modal.open({
                        templateUrl: "app/intake/documents/view-document/document-popup-view.html",
                        controller: "IntakeDocumentsPopupViewCtrl as docpopupviewCtrl",
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

            // if (utils.isNotEmptyVal(filters.category)) {
            //     var cat = $.map(self.documentCategories, function (a) {
            //         if (a.doc_category_id == filters.category) {
            //             return a.doc_category_name;
            //         }
            //     });

            //     if (utils.isNotEmptyVal(cat)) {
            //         var catFilter = {};
            //         catFilter.value = 'Category : ' + cat[0];
            //         catFilter.key = 'category';
            //         self.display.filtertags.push(catFilter);
            //     }
            // }
            if (utils.isNotEmptyVal(filters.category)) {
                var cat = []
                _.forEach(filters.category, function (item) {
                    _.forEach(self.documentCategories, function (a) {
                        if (a.Id == item) {
                            cat.push(a.Name);
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
                    return usr.userId == filters.updatedByFilter;
                });

                updatedFilter.value = 'Updated by: ' + user.Name;
                updatedFilter.key = 'updatedByFilter';

                self.display.filtertags.push(updatedFilter);
            }

            if (utils.isNotEmptyVal(filters.createdByFilter)) {
                var createdFilter = {};
                var user = _.find(users, function (usr) {
                    return usr.userId == filters.createdByFilter;
                });

                createdFilter.value = 'Created by: ' + user.Name;
                createdFilter.key = 'createdByFilter';

                self.display.filtertags.push(createdFilter);
            }
            if (utils.isNotEmptyVal(filters.needReviewFilter) && filters.needReviewFilter) {
                var NeedToBeReviewed = {};
                NeedToBeReviewed.key = 'needReviewFilter';
                NeedToBeReviewed.type = 'needReviewFilter';
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

            var retainsFilter = JSON.parse(localStorage.getItem("retainFiltersForIntake"));
            if (utils.isNotEmptyVal(retainsFilter)) {
                if (self.matterId != retainsFilter.matterID) {
                    localStorage.removeItem("motionFiltertagsForIntake");
                    localStorage.removeItem("matterNotesFiltersForIntake");
                    localStorage.removeItem("timeLineListFiltersForIntake");
                }
            }
            $rootScope.retainFilters.matterID = self.matterId;
            localStorage.setItem("retainFiltersForIntake", JSON.stringify($rootScope.retainFilters));
        }

        function filterReatain() {
            var retainSText = JSON.parse(localStorage.getItem("retainSearchTextForIntake"));
            if (utils.isNotEmptyVal(retainSText) && (self.matterId != retainSText.matterid)) {
                $rootScope.retainSearchText = {};
            }
            $rootScope.retainSearchText.docFiltertext = self.display.filterText;
            $rootScope.retainSearchText.matterid = self.matterId;
            localStorage.setItem("retainSearchTextForIntake", JSON.stringify($rootScope.retainSearchText));
        }

        /*Remove Filter tag*/
        function cancleFilterTags(cancelled) {

            self.documentsList.pageNum = 1;
            var scrollPos = $(window).scrollTop();
            $(window).scrollTop(scrollPos - 1);
            switch (cancelled.key) {
                case 'createdByFilter':
                    self.display.filters.createdByFilter = '';
                    break;
                case 'updatedByFilter':
                    self.display.filters.updatedByFilter = '';
                    break;
                case 'category':
                    var categoryObj = [];
                    var categoryObjString = [];
                    _.forEach(self.display.filters.category, function (item) {
                        _.forEach(self.documentCategories, function (a) {
                            if (a.Id == item) {
                                categoryObj.push(a);
                            }
                        });
                    });
                    if (utils.isNotEmptyVal(categoryObj)) {
                        _.forEach(categoryObj, function (item) {
                            var catFilter = {};
                            catFilter.value = 'Category : ' + item.Name;
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
                case 'needReviewFilter':
                    self.display.filters.needReviewFilter = 0;
                    break;
            }
            var currentFilters = _.pluck(self.display.filtertags, cancelled.key);
            if (cancelled.key != 'SS') {
                self.filterddocs = true;
                getDocuments();
            }

        }

        function getDocCategories() {
            inatkeDocumentsDataService.getDocumentCategories()
                .then(function (response) {
                    self.documentCategories = response;
                }, function (error) {
                    notificationService.error('document categories not loaded');
                });
        }

        /*Get Office365 Discovery Details*/
        function getDiscoveryDetail() {
            inatkeDocumentsDataService.getDiscoveryData()
                .then(function (response) {
                    self.discoveryData = response;
                    localStorage.setItem("discoveryIntake", JSON.stringify(self.discoveryData));
                }, function (error) {
                    // refreshToken();
                });
        }

        // function refreshToken() {
        //     // get new access token for refresh token request
        //     var tokenReissue = {
        //         'refreshToken': localStorage.getItem('refreshToken')
        //     }
        //     intakeLoginDatalayer.refreshToken(tokenReissue)
        //         .then(function (response) {
        //             localStorage.setItem('accessToken', response.accessToken);
        //             getDiscoveryDetail();
        //         }, function (status) {
        //             if (status === 401) {
        //                 intakeLoginDatalayer.logoutUser()
        //                     .then(function () {
        //                         notificationService.error('You are unauthorized to access this service.');
        //                         localStorage.clear();
        //                         $state.go('login');
        //                     });
        //                 return;
        //             }
        //         });
        // }

        /*Get all plaintiffs of matter*/
        function getPlaintiffsForDocument(matterId) {
            inatkeDocumentsDataService.getPlaintiffs(matterId)
                .then(function (response) {
                    self.docPlaintiffs = response;
                    //getDefendants(matterId);
                }, function (error) {
                    notificationService.error('plaintiffs not loaded');
                });
        }

        function getDefendants(matterId) {
            IntakePlaintiffDataService.getDefendants(matterId)
                .then(function (res) {
                    self.docDefendants = res.data;
                    // IntakePlaintiffDataService.getOtherPartiesBasic(matterId)
                    //     .then(function (res) {
                    //         self.docOtherparties = res.data;
                    //         self.docPlaintiffDefendants = getDocPlaintiffData(self.docPlaintiffs, self.docDefendants, self.docOtherparties);
                    //     });
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
        .module('intake.documents')
        .controller('IntakeDocumentsPopupViewCtrl', IntakeDocumentsPopupViewCtrl);

    IntakeDocumentsPopupViewCtrl.$inject = ['$rootScope', 'inatkeDocumentsDataService', 'intakeDocumentsConstants', 'notification-service', '$state', '$modalInstance', 'docdetails', '$modal', 'masterData'];

    function IntakeDocumentsPopupViewCtrl($rootScope, inatkeDocumentsDataService, intakeDocumentsConstants, notificationService, $state, $modalInstance, docdetails, $modal, masterData) {
        var self = this;
        self.documentDetails = docdetails;
        var matterId = docdetails.matterId;
        var documentId = docdetails.documentId;
        self.moduleView = docdetails.moduleView;
        // var docdetails = {};
        docdetails = inatkeDocumentsDataService.getDocumentInfo();
        //off 365
        self.sessionId = docdetails.sessionId;
        self.openOfficeDoc = openOfficeDoc;
        /*Initial value variable*/
        self.matterId = docdetails.matterId;
        var matterId = docdetails.matterId;
        self.documentId = docdetails.documentId;
        var documentId = docdetails.documentId;
        self.isEditPermission = docdetails.isEditPermission == 0 ? true : false;
        // $state.current.name = (docdetails.isGlobalDoc) ? 'documents' : 'intake-documents';
        self.editdoc = false;
        self.editable = false;
        //US#4713 disable add edit delete 
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        //off 365
        self.extType = docdetails.extType;
        self.urlD = docdetails.docUrl;
        self.migrate = localStorage.getItem('Migrated');
        (function () {
            getPermissions();
            getDiscoveryDetail();
            getOfficeOnlineStatus();
            getDocumentDetails(self.documentId, self.matterId);
            /*Initialization on page load*/
            if ($state.current.name == 'intakedocument-edit' || $state.current.name == 'intakeglobaldocument-edit') {
                if ($state.current.name == 'intakeglobaldocument-edit') {
                    self.globalDocview = true;
                } else {
                    self.globalDocview = false;
                    setBreadcrum(self.matterId, 'Document Edit');
                }

                self.editdoc = true;
                getDocumentDetail();
                getDocCategories();
            } else if ($state.current.name == 'intake-documents' || $state.current.name == 'intakedocuments' || $state.current.name == 'intakematter-detail') {
                if ($state.current.name == 'intakematter-detail' || $state.current.name == 'intake-documents') {
                    self.globalDocview = false;
                } else {
                    self.globalDocview = true;
                }
                getDocumentDetail();
            }

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
            inatkeDocumentsDataService.getDiscoveryData()
                .then(function (response) {
                    self.discoveryData = response;
                    localStorage.setItem("discoveryIntake", JSON.stringify(self.discoveryData));
                }, function (error) {
                    refreshToken();
                });
        }

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
                templateUrl: "app/intake/documents/view-document/clone-document.html",
                controller: "cloneIntakeDocumentCtrl as cloneDocument",
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
        $rootScope.$on('openIntakeDocNow', function (event, data) {
            getDocumentDetails(data.args.documentid, data.args.matterid, 'fullDetails');
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
            inatkeDocumentsDataService.getOneDocumentDetails(documentId, matterId)
                .then(function (response) {
                    self.documentDetails = response;
                    self.documentDetails.extType = getFileExtention(response);
                    if (flag == "fullDetails") {
                        viewOnline(self.documentDetails, false, undefined, 'new-document');
                        return;
                    }
                    var discData = JSON.parse(localStorage.getItem("discoveryIntake"));
                    var extType = (getFileExtention(self.documentDetails)).toLowerCase();
                    self.documentDetails.doc_extension = (getFileExtention(self.documentDetails)).toLowerCase();
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
            var docEditPermission = self.docPermissions[0].E;
            var extType = getFileExtention(doc);
            var type = 'global';
            var javaAccessToken = localStorage.getItem("accessToken");
            if (utils.isNotEmptyVal(javaAccessToken) && self.officeOnlineStat) {
                var discData = JSON.parse(localStorage.getItem("discoveryIntake"));
                var wopiurl = intakeDocumentsConstants.RESTAPI.wopiUrl;
                (doc.intake.intake_id != undefined) ? doc.intake.intake_id = doc.intake.intake_id : doc.intake.intake_id = doc.intake.intake_id;
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
                    isEditPermission: docEditPermission,
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

        function getFileExtention(doc) {
            return (doc.documentname) ? (doc.documentname).split('.').pop() : (doc.doc_name).split('.').pop();
        }

        function closeDocModal() {
            $modalInstance.close();
        }

        /*Get all plaintiffs of matter*/
        function getPlaintiffsForDocument(matterId) {
            inatkeDocumentsDataService.getPlaintiffs(matterId)
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
            inatkeDocumentsDataService.getOneDocumentDetails(documentId, matterId)
                .then(function (response) {
                    /*Checking if received the proper responce or not*/
                    if (response.doc_name) {
                        self.singleDoc = response;
                        setDocumentDetails();
                        if (response.moreinfo_type == "insurance") {
                            //getPlaintiffsForDocument(response.matterid);
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
        // //////////////////////////
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
                    //viewdocument
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
                    name: self.singleDoc.matter_name,
                    matterid: self.singleDoc.matterid
                }];
                self.docModel.matterid = self.singleDoc.matterid;
                //    }
                self.docModel.documentname = self.singleDoc.documentname;
                self.docModel.category = self.singleDoc.categoryid;
                self.docModel.needs_review = self.singleDoc.needs_review == "1";
                self.singleDoc.associated_party_name = $.trim(self.singleDoc.associated_party_name);

                if (self.singleDoc.associated_party_name != null && self.singleDoc.associated_party_name != "") {
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
                                $state.go('intake-documents', { matterId: matterId });
                            }
                        }
                    } else if (lRes.code == 203) {
                        self.editable = true;
                    }
                }, function (error) {
                    notificationService.error('document lock not updated');
                });
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
        .module('intake.documents')
        .controller('intakeCoAuthCtrl', intakeCoAuthCtrl);

    intakeCoAuthCtrl.$inject = ['inatkeDocumentsDataService', '$modalInstance', 'coAuthDocName', 'documentInfo', 'notification-service', 'ListDataInfo'];

    function intakeCoAuthCtrl(inatkeDocumentsDataService, $modalInstance, coAuthDocName, documentInfo, notificationService, ListDataInfo) {
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
            // inatkeDocumentsDataService.checkIfFileExists(docdata.docID)
            //     .then(function (response) {
            //         if (response && response != '') {
            var promesa = inatkeDocumentsDataService.deleteDocument(docdata);
            promesa.then(function (data) {
                notificationService.success('Documents deleted successfully');
                angular.forEach(docdata['docID'], function (datavalue, datakey) {
                    var index = _.findIndex(ListDataInfo.listData, { intake_document_id: datavalue });
                    ListDataInfo.listData.splice(index, 1);
                    ListDataInfo.totalLength = parseInt(ListDataInfo.totalLength) - parseInt(1);
                });
                $modalInstance.close(ListDataInfo);
            }, function (error) {
                notificationService.error('Unable to delete documents');
            });
            //     } else {
            //         notificationService.error('Unable to delete document');
            //     }

            // });
        }


    }

})();



/**
 * view comment controller for medical information
 */

//add medical info modal controller
(function () {
    angular
        .module('intake.documents')
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
    angular.module('intake.documents')
        .factory('intakeDocumentListHelper', intakeDocumentListHelper);

    function intakeDocumentListHelper() {
        return {
            getGridHeaders: getGridHeaders,
            isDocumentSelected: isDocumentSelected,
            docDisplayOptions: docDisplayOptions,
            setFilterObj: setFilterObj,
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
                    {
                        displayName: 'Document Name',
                        dataWidth: "25",
                        field: [

                            {
                                prop: 'documentname',
                                onClick: "documentlist.opendocumentView(data, false, $event)",
                                href: { link: 'javascript: void(0);', paramProp: ['matterid', 'documentid'] }
                            },

                            {
                                prop: 'doc_tags',
                            }
                        ],
                    },
                    {
                        displayName: ' Category',
                        dataWidth: "20",
                        field: [
                            //     {
                            //     prop: 'associated_party_name',
                            // },
                            {
                                prop: 'categoryname'
                            }
                        ],
                    },
                    {
                        displayName: 'Last Updated',
                        dataWidth: "19",
                        field: [{
                            prop: 'lupbyname',
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
                    //         condition: 'islocked',
                    //     }],
                    // },
                    {
                        displayName: 'Created By',
                        dataWidth: "17",
                        field: [{
                            prop: 'created_by'
                        }],
                    },
                    {
                        displayName: 'Date Filed',
                        dataWidth: "15",
                        field: [{
                            prop: 'date_filed_date'
                        }],
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
                        dataWidth: "30",
                        field: [{
                            prop: 'documentname',
                            onClick: "documentlist.opendocumentView(data, false, $event)",
                            href: { link: 'javascript: void(0);', paramProp: ['matterid', 'documentid'] }

                        },
                        {
                            prop: 'doc_tags',
                        }
                        ],

                    },
                    {
                        displayName: 'Intake, Category and Associated Party',
                        dataWidth: "30",
                        field: [{
                            prop: 'intake_name',
                            href: { link: '#/matter-overview', paramProp: ['matterid'] },
                        },
                        {
                            prop: 'categoryname'
                        },
                        {
                            prop: 'associated_party_name',
                        }
                        ],
                    },
                    {
                        displayName: 'Last Updated',
                        dataWidth: "16",
                        field: [{
                            prop: 'lupbyname',
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
                    //         condition: 'islocked',
                    //     }],
                    // },
                    {
                        displayName: 'Created By',
                        dataWidth: "16",
                        field: [{
                            prop: 'created_by'
                        }],
                    }
                ];
            }
        }

        function isDocumentSelected(documentList, doc) {
            var ids = _.pluck(documentList, 'intake_document_id');
            return ids.indexOf(doc.documentid) > -1;
        }

        function docDisplayOptions(isGlobalDocs) {
            if (!isGlobalDocs) {
                return {
                    filtered: true,
                    documentListReceived: false,
                    documentSelected: {},
                    sortOption: [
                        //     {
                        //     'key': 1,
                        //     'lable': 'Associated Party',
                        //     'sortorder': 'asc',
                        //     'divider': 1,
                        // },
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
                        }, {
                            'key': 5,
                            'lable': 'Last Updated',
                            'divider': 0
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
                    }, {
                        'key': 5,
                        'lable': 'Last Updated',
                        'sortorder': 'desc',
                        'divider': 0
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
