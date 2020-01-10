/* Mailbox controller*/
(function () {

    'use strict';

    angular
        .module('cloudlex.mailbox')
        .controller('MailboxController', MailboxController);

    MailboxController.$inject = ['$rootScope', '$timeout', '$scope', 'Upload', 'mailboxDataService', 'documentsDataService', 'notification-service',
        'modalService', 'mailboxHelper', 'matterFactory', 'mailboxConstants', 'masterData', 'intakeNotesDataService', 'inatkeDocumentsDataService'
    ];

    function MailboxController($rootScope, $timeout, $scope, Upload, mailboxDataService, documentsDataService, notificationService,
        modalService, mailboxHelper, matterFactory, mailboxConstants, masterData, intakeNotesDataService, inatkeDocumentsDataService) {
        var self = this;
        var listvars = mailboxHelper.getDefinedArray();
        var matters = [];
        /* function handeler  */
        self.toggleTab = toggleTab;
        self.sortMails = sortMails;
        self.allMailsSelected = allMailsSelected;
        self.selectAllMails = selectAllMails;
        self.isMailSelected = isMailSelected;
        self.getNextLimitMails = getNextLimitMails;
        self.filterRetain = filterRetain;
        // self.createSearchFilterTag = createSearchFilterTag;
        self.cancleFilterTags = cancleFilterTags;
        self.deleteMails = deleteMails;
        self.getMailThread = getMailThread;
        self.selectUnreadRead = selectUnreadRead;
        self.getUsers = getUsers;
        self.getSendToList = getSendToList;
        self.searchMatters = searchMatters;
        self.formatTypeaheadDisplay = formatTypeaheadDisplay;
        self.allDocumentsSelected = allDocumentsSelected;
        self.cancleAttachment = cancleAttachment;
        self.getFileSizeNUpload = getFileSizeNUpload;
        self.tagCancelled = tagCancelled;
        self.sendMail = sendMail;
        self.reply = reply;
        self.closeCompose = closeCompose;
        self.downloadAttachment = downloadAttachment;
        self.isDocSelected = isDocSelected;
        self.selectAllDocuments = selectAllDocuments;
        self.taggedMatterName = "";
        self.signature = '';
        self.documentsList = {};
        self.documentCategories = {};
        self.categories = [];
        self.groupMatterDoc = groupMatterDoc;
        self.matterdoc = '';
        self.enableCompose = false;
        self.matterDocID = [];
        self.fileuploaded = [];
        self.matterDraftID = [];
        self.draftfiles = [];
        self.mailToThread = [];
        self.mailCcThread = [];
        self.mailBccThread = [];
        self.bccFlag = false;
        self.composemail = true;
        self.getfiltertext = getfiltertext;
        self.emailDocsNote = true;
        self.emailNoteDisabled = false;
        self.removeDocProgress = false;
        self.matterDocs = false;
        self.userProfile = [];
        self.firmData = { API: "PHP", state: "mailbox" };
        self.documentTags = [];
        self.getFileSize = getFileSize; //funct to get file size from api call
        self.allDocSize = 0;
        self.showselection = $rootScope.onMatter || $rootScope.onIntake ? true : false;
        self.tagggedmatter = false;
        self.unreadCount = 0;
        self.display = {
            documentSelected: []
        };
        //US#4713 disable add edit delete
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.callUpdate = callUpdate;
        localStorage.setItem('notificationError', "false");
        self.validateEmail = validateEmail;
        self.openTagMatterDocument = openTagMatterDocument;
        self.validEmail = false;
        self.allFiles = [];
        self.resetPage = resetPage;
        self.pageSize = 250;
        self.disabledSidebarIcon = disabledSidebarIcon;
        self.tempMatterId= '';
        self.getTagAMatter = getTagAMatter;
        (function () {
            init();
            getInboxList();
            getUsers();
            getDocCategories();
            self.selectedMode = $rootScope.onMatter || $rootScope.onLauncher || $rootScope.onContactManager || $rootScope.onExpense ? 2 : 1;
            self.emailSearchText = "";
            if ($rootScope.onMatter) {
                self.emailSearchText = "matteremailSearchText";
            }
            else if ($rootScope.onLauncher) {
                self.emailSearchText = "launcheremailSearchText";
            }
            else if ($rootScope.onContactManager) {
                self.emailSearchText = "contactemailSearchText";
            }
            else if ($rootScope.onIntake) {
                self.emailSearchText = "intakeemailSearchText"
            }

            getfiltertext();
            var filtertext = localStorage.getItem(self.emailSearchText);
            if (utils.isNotEmptyVal(filtertext)) {
                self.showSearch = true;
            }
            $scope.eventFor = [
                {
                    id: 1,
                    name: "Intake"
                },
                {
                    id: 2,
                    name: "Matter"
                },
            ];

        })();


        function resetPage() {
            init();
            getInboxList();
            searchReset();
        }
        /**
         * 
         * @param {current emails address} ids
         */
        self.checkAddress = function (ids) {
            var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            var validateEmail = emailRegex.test(ids[ids.length - 1].mail);
            if (!validateEmail) {
                notificationService.error("Please enter valid email address!");
            }
        }

        function disabledSidebarIcon() {
            $('#navMenu').addClass('cursor-pointer-events-none');
            self.showselection = $rootScope.onMatter || $rootScope.onIntake ? true : false;
            self.selectedMode = $rootScope.onMatter || $rootScope.onLauncher || $rootScope.onContactManager ? 2 : 1;
            self.tagggedmatter = false;
        }

        function callUpdate(data) {
            var emailClickedFlag = localStorage.getItem('emailfromcontact');
            if (emailClickedFlag == 'true') {
                var tempData = JSON.parse(localStorage.getItem("composestore"));
                if (tempData) {
                    self.composeEmail = tempData;
                    self.sendToList = tempData.recipientsUsers;
                }
                localStorage.setItem('emailfromcontact', false);
            }
        }

        /**
         * mail from contat, document, note etc
         */
        $rootScope.updateComposeMailMsgBody = function (composeEmail, matter_id, documentList, selectedDocuments, contactFrom, contactData, selectedmode) {
            $('#navMenu').addClass('cursor-pointer-events-none');
            self.allDocSize = 0;
            if (selectedmode) {
                self.selectedMode = selectedmode;
            }
            self.composeMailMsg = composeEmail;
            self.emailDocsNote = true;
            // show email or docs checkbox flag
            // self.emailDocsNote = false;
            //  if(selectedmode != "1")
            // {
            //     self.emailDocsNote = true;
            // }
            self.matterDocs = false;
            self.composeEmail.emailNotes = "0";
            if (contactFrom == "matterRecipents") {
                self.sendToList = [];
                self.composeEmail.recipientsUsers = [];
                self.sendToList = contactData;
                self.composeEmail.recipientsUsers = contactData;
            }
            if (contactFrom == 'contactEmail') {
                self.sendToList = [];
                self.composeEmail.recipientsUsers = [];
                var emailId = [];
                emailId = contactData.email_ids.split(',');
                _.forEach(emailId, function (eValue, eKey) {
                    var addContactData = {
                        uid: contactData.contactid,
                        name: contactData.first_name,
                        lname: contactData.last_name,
                        mail: eValue.trim(),
                    };
                    self.sendToList.push(addContactData);
                    self.composeEmail.recipientsUsers.push(addContactData);
                });
                self.tempStaorageVar = self.composeEmail;
                localStorage.setItem("composestore", JSON.stringify(self.tempStaorageVar));


            }

            else if (utils.isNotEmptyVal(matter_id) && matter_id != "0") {
                self.composeEmail.matter_id = matter_id.matterid;
                matters = [{ name: matter_id.name, matterid: matter_id.matterid }];
            } else {
                self.composeEmail.matter_id = matter_id;
            }
            self.documentsList.data = documentList;
            //US#8023 get file size
            if (utils.isNotEmptyVal(selectedDocuments)) {
                self.clxGridOptions = {
                    selectedItems: selectedDocuments,
                    selectAll: false
                };
                self.composeEmail.matterdocs = self.clxGridOptions.selectedItems;

                getFileSize(selectedDocuments);
            }

        }

        function searchReset() {
            self.inboxList.filterText = '';
            localStorage.setItem(self.emailSearchText, self.inboxList.filterText);
            self.showSearch = false;
        }

        function init() {
            getUserEmailSignaure();
            self.filterScopeName = $rootScope.onMatter ? "0" : $rootScope.onIntake ? "1" : "";
            if ($rootScope.isIntakeActive != 1) {
                self.filterScopeName = "0";
            }
            self.compose = false;
            self.activeTab = 'Inbox';
            self.inboxList = angular.copy(listvars['inboxList']);
            /*Single email details*/
            self.mailThread = [];
            self.mailThreadAttachment = [];

            /* Compose email variable*/
            self.composeEmail = {
                recipientsUsers: [],
                matterdocs: [],
                subject: '[Cloudlex] -', //US#6565 'Cloudlex' should be by default while composing email
                matter_id: '',
                message: '',
                parent_id: 0,
                mail_msg_id: '',
                file: [],
                new_files: [],
            };
            self.tempMatterId= '';
            // $rootScope.rootSelectedDocument = [];
            self.files = [];
            self.firmUsers = [];
            self.contactList = [];
            self.sendToList = [];
            self.enableSave = true;
            // self.inboxList.filterText='';
            self.documentSize = [];
        }


        function toggleTab(tab) {
            self.inboxList = angular.copy(listvars['inboxList']);
            self.mailThread = [];
            self.mailThreadAttachment = [];
            self.activeTab = tab;
            if (tab == 'Inbox') {
                getInboxList(true);
                getfiltertext();
            } else if (tab == 'Sentbox') {
                getSentList(true);
                getfiltertext();
            } else if (tab == 'Draftbox') {
                getDraftList(true);
                getfiltertext();
            }
        }


        function getfiltertext() {
            var filtertext = localStorage.getItem(self.emailSearchText);
            if (utils.isNotEmptyVal(filtertext)) {
                self.inboxList.filterText = filtertext;
            }
        }

        var sideBarScrollEmail;

        /* Get the inbox List */
        function getInboxList(filtered) {

            if (localStorage.getItem('sideBarScrollEmailId')) {
                sideBarScrollEmail = JSON.parse(localStorage.getItem('sideBarScrollEmailId'));
                sideBarScrollEmail = sideBarScrollEmail.eid.toString();
                localStorage.removeItem('sideBarScrollEmailId');
            } else {
                sideBarScrollEmail = null;
            }

            var promese = mailboxDataService.getInboxList(self.inboxList.allmails, self.inboxList.pageNum, self.inboxList.sortBy, self.inboxList.sortOrder, self.filterScopeName, sideBarScrollEmail);
            promese.then(function (data) {
                self.unreadCount = data.data.unread_count;
                if (self.activeTab == 'Inbox') {
                    data = data.data.mails;
                    data = processTheList(data);
                    self.inboxList.inboxListreceived = true;

                    if (self.inboxList.inboxFiltered == true || (filtered && filtered == true)) {
                        //self.inboxList.datafiltered = false;
                        self.inboxList.data = data;
                        self.inboxList.count = data.length;
                        self.inboxList.totallength = data.length;
                        self.inboxList.inboxFiltered = false;
                        self.inboxList.selectAll = false;
                        self.inboxList.selectedItems = [];
                        self.inboxList.MailSelected = {};
                        /*$timeout(function(){
	                    	self.inboxList.datafiltered = true;
	    	       		 },100);*/
                    } else {
                        _.forEach(data, function (item) {
                            self.inboxList.data.push(item);
                        });
                        self.inboxList.count = data.length;
                        self.inboxList.totallength = parseInt(self.inboxList.totallength) + parseInt(data.length);
                    }

                    if (sideBarScrollEmail) {
                        $timeout(function () {
                            var mailIndex = _.indexOf(_.pluck(self.filteredMails, 'mail_msg_id'), sideBarScrollEmail);
                            if (mailIndex > -1) {
                                self.getMailThread(sideBarScrollEmail, mailIndex);
                            }
                            var container = $('#main-event'),
                                scrollTo = $('#' + sideBarScrollEmail);
                            if (scrollTo.offset() && scrollTo.offset().top) {
                                container.animate({
                                    scrollTop: scrollTo.offset().top - $("#main-event").offset().top
                                }, 100);
                            }
                        }, 500);
                    }
                }
            }, function (reason) {
                notificationService.error('Inbox Mails not loaded.');
            });
        }

        /* Get the sent mails list */
        function getSentList(filtered) {
            var promese = mailboxDataService.getSentList(self.inboxList.allmails, self.inboxList.pageNum, self.inboxList.sortBy, self.inboxList.sortOrder, self.filterScopeName);
            promese.then(function (data) {
                if (self.activeTab == 'Sentbox') {
                    data = data.data;
                    data = processTheList(data);
                    self.inboxList.inboxListreceived = true;

                    if (self.inboxList.inboxFiltered == true || (filtered && filtered == true)) {
                        //self.inboxList.datafiltered = false;
                        self.inboxList.data = data;
                        self.inboxList.count = data.length;
                        self.inboxList.totallength = data.length;
                        self.inboxList.inboxFiltered = false;
                        self.inboxList.selectAll = false;
                        self.inboxList.selectedItems = [];
                        self.inboxList.MailSelected = {};
                        /*$timeout(function(){
	                    	self.inboxList.datafiltered = true;
	    	       		 },100);*/
                    } else {
                        _.forEach(data, function (item) {
                            self.inboxList.data.push(item);
                        });
                        self.inboxList.count = data.length;
                        self.inboxList.totallength = parseInt(self.inboxList.totallength) + parseInt(data.length);
                    }
                }
            }, function (reason) {
                notificationService.error('Sent Mails not loaded.');
            });
        }

        /* Get the sent mails list */
        function getDraftList(filtered) {
            var promese = mailboxDataService.getDraftList(self.inboxList.allmails, self.inboxList.pageNum, self.inboxList.sortBy, self.inboxList.sortOrder, self.filterScopeName);
            promese.then(function (data) {
                if (self.activeTab == 'Draftbox') {
                    data = data.data;
                    data = processTheList(data);
                    self.inboxList.inboxListreceived = true;
                    if (self.inboxList.inboxFiltered == true || (filtered && filtered == true)) {
                        //self.inboxList.datafiltered = false;
                        self.inboxList.data = data;
                        self.inboxList.count = data.length;
                        self.inboxList.totallength = data.length;
                        self.inboxList.inboxFiltered = false;
                        self.inboxList.selectAll = false;
                        self.inboxList.selectedItems = [];
                        self.inboxList.MailSelected = {};
                        /* $timeout(function(){
                             self.inboxList.datafiltered = true;
                          },100);*/
                    } else {
                        _.forEach(data, function (item) {
                            self.draftList.data.push(item);
                        });
                        self.inboxList.count = data.length;
                        self.inboxList.totallength = parseInt(self.inboxList.totallength) + parseInt(data.length);
                    }
                }
            }, function (reason) {
                notificationService.error('Sent Mails not loaded.');
            });
        }

        /* Parse and change the indexes of result from sent and draft service call accodign to display*/
        function processTheList(data) {
            var newList = [];

            if (self.activeTab == 'Inbox') {

                _.forEach(data, function (itemValue, itemkey) {
                    var newdata = {};
                    newdata = itemValue;
                    var fullname = '';
                    if (itemValue.fname != null && itemValue.fname != 'null' && itemValue.lname != null && itemValue.lname != 'null') {
                        fullname = itemValue.fname + ' ' + itemValue.lname;
                    } else if (itemValue.fname != null && itemValue.fname != 'null' && (itemValue.lname == null || itemValue.lname == 'null')) {
                        fullname = itemValue.fname;
                    } else if (itemValue.fname == null) {
                        fullname = '';
                        //fullname = itemValue.from_user;
                    }
                    newdata.from_user = fullname;
                    newList.push(newdata);
                });

            } else if (self.activeTab == 'Sentbox' || self.activeTab == 'Draftbox') {
                _.forEach(data, function (itemValue, itemkey) {
                    var newdata = {};
                    newdata = itemValue;
                    newdata.datereceived = itemValue.datetime
                    var fullNames = '';
                    if (itemValue.fname != null && itemValue.fname != 'null') {
                        var fnames = itemValue.fname.split(',');
                        if (itemValue.lname != null && itemValue.lname != 'null') {
                            var lnames = itemValue.lname.split(',');
                        }
                        fullNames = '';
                        _.forEach(fnames, function (nValue, nKey) {
                            var fullname = nValue;

                            if (lnames) {
                                if (lnames[nKey] != '' && lnames[nKey] != 'null')
                                    fullname = fullname + ' ' + lnames[nKey];
                            }
                            if (nKey != 0) {
                                fullNames = fullNames + ', ';
                            }
                            fullNames = fullNames + fullname;
                        });
                    } else if (itemValue.mail_to != '') {
                        fullNames = itemValue.mail_to;
                    }
                    newdata.from_user = fullNames;
                    newdata.is_read = 1;
                    newList.push(newdata);
                });

            }
            return newList;
        }

        function sortMails(by, order) {
            self.inboxList.sortBy = by;
            self.inboxList.sortOrder = order;
            self.inboxList.inboxFiltered = true;
            getList();
        }

        /*Select all the documents*/
        function allMailsSelected() {
            if (self.inboxList.data.length > 0) {
                var dataCopy = angular.copy(self.inboxList.data);
                return self.inboxList.selectedItems.length === dataCopy.length;
            }
        }

        /*check all documents selected*/
        function selectAllMails(selected) {
            if (selected) {
                var dataCopy = angular.copy(self.inboxList.data);
                self.inboxList.selectedItems = dataCopy;
            } else {
                self.inboxList.selectedItems = [];
            }
        }

        /*check if document is selected*/
        function isMailSelected(mail, currentTab) {

            self.inboxList.MailSelected[(currentTab == 'Inbox') ? mail.mail_inbox_id : mail.mail_msg_id] =
                mailboxHelper.isMailSelected(self.inboxList.selectedItems, mail, currentTab);
            return self.inboxList.MailSelected[(currentTab == 'Inbox') ? mail.mail_inbox_id : mail.mail_msg_id];
        }

        /*Get more Documenets*/
        function getNextLimitMails(all) {
            self.inboxList.pageNum = parseInt(self.inboxList.pageNum) + parseInt(1);
            if (all == 'all') {
                self.inboxList.allmails = true;
            }
            getList();
        }

        //function for  retaintion of search field
        function filterRetain() {
            var filtertext = self.inboxList.filterText;
            localStorage.setItem(self.emailSearchText, filtertext);
        }
        /*Create Search filter tag for both uploaded and unindexed documents*/
        // function createSearchFilterTag() {
        //     if (self.inboxList.filterText && self.inboxList.filterText != '') {
        //         var index = _.findIndex(self.inboxList.filtertags, { key: 'SS' });
        //         if (index >= 0) {
        //             self.inboxList.filtertags[index].value = 'Search : ' + self.inboxList.filterText;
        //         } else {
        //             var sFilter = {};
        //             sFilter.value = 'Search : ' + self.inboxList.filterText;
        //             sFilter.key = 'SS';
        //             self.inboxList.filtertags.push(sFilter);
        //         }
        //     } else {
        //         var index = _.findIndex(self.inboxList.filtertags, { key: 'SS' });
        //         self.inboxList.filtertags.splice(index, 1);
        //     }
        // }

        /*Cancle the search filter tag*/
        function cancleFilterTags(cancelled) {
            self.inboxList.filterText = '';
        }

        function deleteMails(currentTab) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            // confirm before delete
            modalService.showModal({}, modalOptions)
                .then(function () {
                    var docdata = {};
                    docdata.val = (currentTab == 'Inbox') ? _.pluck(self.inboxList.selectedItems, 'mail_inbox_id') : _.pluck(self.inboxList.selectedItems, 'mail_msg_id');
                    var data = JSON.stringify(docdata);

                    if (self.activeTab == 'Inbox') {
                        var type = "inbox";
                    } else if (self.activeTab == 'Sentbox') {
                        var type = "sent";
                    } else if (self.activeTab == 'Draftbox') {
                        var type = "draft";
                    }
                    var promesa = mailboxDataService.deleteMails(docdata.val[0], data, type);
                    promesa.then(function (data) {

                        //$rootScope.$broadcast('updateEmailCountForIntake', { count: self.unreadMailcount });

                        self.inboxList.inboxFiltered = true;
                        getList();
                        notificationService.success('Mail deleted successfully');
                        self.inboxList.selectAll = false;
                        self.inboxList.selectedItems = [];
                        self.mailThread = [];
                        self.mailThreadAttachment = [];
                    }, function (error) {
                        notificationService.error('Unable to delete mail');
                    });
                });
        }

        function getMailThread(msgid, index) {
            var promesReturned = mailboxDataService.getMailthread(msgid);
            promesReturned.then(function (data) {
                //$rootScope.$broadcast('updateEmailCount', { count: self.unreadMailcount });

                _.forEach(self.inboxList.data, function (dataValue, dataKey) {
                    self.inboxList.data[dataKey].selected = '';
                });
                //getInboxList();
                self.inboxList.data[index].selected = 1;
                self.mailThread = data.data.message;
                self.mailThreadAttachment = [];
                self.mailToThread = [];
                self.mailCcThread = [];
                self.mailBccThread = [];
                if (data.data.attachments.length > 0) {
                    self.mailThreadAttachment = data.data.attachments;
                }

                if (self.activeTab == 'Inbox') {
                    _.forEach(self.mailThread, function (dataValue, dataKey) {
                        self.mailToThread = [];
                        self.mailCcThread = [];
                        self.mailBccThread = [];
                        var name = "";
                        if (dataValue.from_id != 'null' && dataValue.from_id != null && dataValue.from_id != '') {
                            if (dataValue.from_fname == 'null' || dataValue.from_fname == null || dataValue.from_fname == '') {
                                if (dataValue.from_mail != 'null' && dataValue.from_mail != null && dataValue.from_mail != '') {
                                    name = dataValue.from_mail;
                                } else {
                                    name = '';
                                }
                            } else if (dataValue.from_fname != 'null' && dataValue.from_fname != null && dataValue.from_fname != '') {
                                name = dataValue.from_fname;

                                if (dataValue.from_lname != 'null' && dataValue.from_lname != null && dataValue.from_lname != '') {
                                    name = name + ' ' + dataValue.from_lname;
                                }
                            } else {
                                name = '';
                            }
                        }
                        self.mailThread[dataKey].name = name;
                        self.mailThread[dataKey].mailDisplay = dataValue.from_mail_user;
                        self.bccFlag = (dataValue.type == "0" || dataValue.type == null || dataValue.type == "3") ? true : false;
                        // set to name 
                        if (utils.isNotEmptyVal(self.mailThread[dataKey].recipients)) {
                            _.forEach(self.mailThread[dataKey].recipients, function (thread) {
                                var f_name = utils.isNotEmptyVal(thread.f_name) ? thread.f_name : '';
                                var l_name = utils.isNotEmptyVal(thread.l_name) ? thread.l_name : '';
                                var mail_display = utils.isNotEmptyVal(thread.mail_to) ? thread.mail_to : '';
                                self.mailToThread.push({ 'name': f_name + " " + l_name, 'mailDisplay': mail_display });
                            });
                            self.mailThread[dataKey].mailToThread = self.mailToThread;
                        }

                        // set cc name 
                        if (utils.isNotEmptyVal(self.mailThread[dataKey].cc_recipients)) {
                            _.forEach(self.mailThread[dataKey].cc_recipients, function (thread) {
                                var f_name = utils.isNotEmptyVal(thread.f_name) ? thread.f_name : '';
                                var l_name = utils.isNotEmptyVal(thread.l_name) ? thread.l_name : '';
                                var mail_display = utils.isNotEmptyVal(thread.mail_to) ? thread.mail_to : '';
                                self.mailCcThread.push({ 'name': f_name + " " + l_name, 'mailDisplay': mail_display });
                            });
                            self.mailThread[dataKey].mailCcThread = self.mailCcThread;
                        }

                        // set Bcc name 
                        if (utils.isNotEmptyVal(self.mailThread[dataKey].bcc_recipients)) {
                            _.forEach(self.mailThread[dataKey].bcc_recipients, function (thread) {
                                var f_name = utils.isNotEmptyVal(thread.f_name) ? thread.f_name : '';
                                var l_name = utils.isNotEmptyVal(thread.l_name) ? thread.l_name : '';
                                var mail_display = utils.isNotEmptyVal(thread.mail_to) ? thread.mail_to : '';
                                self.mailBccThread.push({ 'name': f_name + " " + l_name, 'mailDisplay': mail_display });
                            });
                            self.mailThread[dataKey].mailBccThread = self.mailBccThread;
                        }
                    });



                } else if (self.activeTab == 'Sentbox' || self.activeTab == 'Draftbox') {
                    _.forEach(self.mailThread, function (dataValue, dataKey) {
                        self.mailToThread = [];
                        self.mailCcThread = [];
                        self.mailBccThread = [];
                        var name = "";
                        self.tempMatterId = dataValue.matter_id

                        if (dataValue.id != 'null' && dataValue.id != null && dataValue.id != '') {
                            if (dataValue.fname == 'null' || dataValue.fname == null || dataValue.fname == '') {
                                name = '';

                            } else if (dataValue.fname != 'null' && dataValue.fname != null && dataValue.fname != '') {
                                var fnames = dataValue.fname.split(',');

                                if (dataValue.lname && dataValue.lname != null && dataValue.lname != 'null') {
                                    var lnames = dataValue.lname.split(',');
                                }
                                _.forEach(fnames, function (nValue, nKey) {
                                    var fullname = nValue;
                                    if (lnames) {
                                        if (lnames[nKey] != '' && lnames[nKey] != 'null')
                                            fullname = fullname + ' ' + lnames[nKey];
                                    }
                                    if (nKey != 0) {
                                        name = name + ', ';
                                    }

                                    name = name + fullname;
                                });
                            }
                        }
                        self.mailThread[dataKey].name = name;

                        if (dataValue.from_mail != null && dataValue.from_mail != 'null' && dataValue.from_mail != '') {
                            self.mailThread[dataKey].mailDisplay = dataValue.from_mail;
                        }
                        self.bccFlag = (dataValue.type == "0" || dataValue.type == null || dataValue.type == "1" || dataValue.type == "3") ? true : false;
                        // set to name 
                        if (utils.isNotEmptyVal(self.mailThread[dataKey].recipients)) {
                            _.forEach(self.mailThread[dataKey].recipients, function (thread) {
                                var f_name = utils.isNotEmptyVal(thread.f_name) ? thread.f_name : '';
                                var l_name = utils.isNotEmptyVal(thread.l_name) ? thread.l_name : '';
                                var mail_display = utils.isNotEmptyVal(thread.mail_to) ? thread.mail_to : '';
                                self.mailToThread.push({ 'name': f_name + " " + l_name, 'mailDisplay': mail_display });
                            });
                            self.mailThread[dataKey].mailToThread = self.mailToThread;
                        }

                        // set cc name 
                        if (utils.isNotEmptyVal(self.mailThread[dataKey].cc_recipients)) {
                            _.forEach(self.mailThread[dataKey].cc_recipients, function (thread) {
                                var f_name = utils.isNotEmptyVal(thread.f_name) ? thread.f_name : '';
                                var l_name = utils.isNotEmptyVal(thread.l_name) ? thread.l_name : '';
                                var mail_display = utils.isNotEmptyVal(thread.mail_to) ? thread.mail_to : '';
                                self.mailCcThread.push({ 'name': f_name + " " + l_name, 'mailDisplay': mail_display });
                            });
                            self.mailThread[dataKey].mailCcThread = self.mailCcThread;
                        }

                        // set Bcc name 
                        if (utils.isNotEmptyVal(self.mailThread[dataKey].bcc_recipients)) {
                            _.forEach(self.mailThread[dataKey].bcc_recipients, function (thread) {
                                var f_name = utils.isNotEmptyVal(thread.f_name) ? thread.f_name : '';
                                var l_name = utils.isNotEmptyVal(thread.l_name) ? thread.l_name : '';
                                var mail_display = utils.isNotEmptyVal(thread.mail_to) ? thread.mail_to : '';
                                self.mailBccThread.push({ 'name': f_name + " " + l_name, 'mailDisplay': mail_display });
                            });
                            self.mailThread[dataKey].mailBccThread = self.mailBccThread;
                        }
                    });

                    if (self.activeTab == 'Draftbox') {
                        self.showselection = $rootScope.onMatter || $rootScope.onIntake ? true : false;
                        composeDraftedMail(self.mailThread[0], self.mailThreadAttachment);
                    }
                }
                if (self.activeTab == 'Inbox') {
                    self.inboxList.data[index].is_read = 1;
                }
            }, function (error) {
                notificationService.error('Unable to retreive mail thread.');
            });
        }


        /* Function to select read or unread mails  */
        function selectUnreadRead(type) {
            var dataCopy = [];
            if (type == 'unread') {
                dataCopy = _.filter(self.inboxList.data, function (data) {
                    return data.is_read == 0;
                });
            } else if (type == 'read') {
                dataCopy = _.filter(self.inboxList.data, function (data) {
                    return data.is_read == 1;
                });
            }
            self.inboxList.selectedItems = dataCopy;
            var mailIds = [];
            mailIds = _.pluck(self.inboxList.selectedItems, 'mail_inbox_id');
            self.inboxList.MailSelected = mailIds;
        }

        /* Funtion to get the all firm users */
        function getUsers() {
            mailboxDataService.getAllUsers()
                .then(function (data) {
                    self.firmUsers = data.data;
                }, function (error) {
                    notificationService.error('Unable to retreive firm users.');
                });
        }

        /* function to get the sendTo list (UserList+ContactList+ExternalContact) as searched */
        function getSendToList(name) {
            if (name != '') {
                // self.sendToList.push(name);
                mailboxDataService.getContactSearched(name)
                    .then(function (data) {
                        self.sendToList = [];
                        var contacts = data.data.contacts

                        _.forEach(contacts, function (dataValue, dataKey) {
                            if (dataValue.email != null && dataValue.email != 'null' && dataValue.email != '') {
                                var emials = dataValue.email.split(',');
                                _.forEach(emials, function (eValue, eKey) {

                                    var addContact = {
                                        uid: dataValue.contactid,
                                        name: dataValue.firstname,
                                        lname: dataValue.lastname,
                                        firstLastname: dataValue.firstname + " " + dataValue.lastname,
                                        mail: eValue,
                                    };
                                    self.sendToList.push(addContact);
                                });
                            }
                        });
                        var emailVal = (/\S+@\S+\.\S+/).test(name);
                        if (emailVal) {
                            var addContact = { uid: 0, role: 'External', firstLastname: name, name: name, mail: name };
                            self.sendToList.push(addContact);
                        }
                        _.forEach(self.firmUsers, function (currentItem) {
                            currentItem.firstLastname = currentItem.name + " " + currentItem.lname;
                        });
                        self.sendToList = (self.sendToList).concat(self.firmUsers);
                    }, function (error) {
                        notificationService.error('Unable to retreive contacts.');
                    });
            }
        }

        /* Function to get the list of mails accordign to tab selected*/
        function getList() {
            if (self.activeTab == 'Inbox') {
                getInboxList();
            } else if (self.activeTab == 'Sentbox') {
                getSentList();
            } else if (self.activeTab == 'Draftbox') {
                getDraftList();
            }
        }

        /*Search matter in case of global documents*/
        function searchMatters(matterName, matterID, selectedDocuments) {
            if (matterName) {
                if (self.selectedMode == 2) {
                    return matterFactory.searchMatters(matterName).then(
                        function (response) {
                            matters = response.data;
                            self.matterSearched = true;
                            _.forEach(matters, function (item) {
                                item.fileNumber = item.filenumber ? (" - " + item.filenumber) : " ";
                            });
                            if (utils.isNotEmptyVal(matterID)) {
                                self.composeEmail.matter_id = matterID;
                                formatTypeaheadDisplay(matterID);
                                // self.composeEmail.matterdocs = selectedDocuments;
                            }
                            return response.data;
                        },
                        function (error) {
                            notificationService.error('Matters not loaded');
                        });
                }
                else if (self.selectedMode == 1) {
                    return intakeNotesDataService.getMatterList(matterName, 0).then(
                        function (response) {
                            matters = response;
                            _.forEach(matters, function (item) {
                                item.matterid = item.intakeId;
                                item.name = item.intakeName;
                                item.createdDate = item.dateIntake ? (item.dateIntake) : " ";
                            });
                            self.matterSearched = true;
                            if (utils.isNotEmptyVal(matterID)) {
                                self.composeEmail.matter_id = matterID;
                                formatTypeaheadDisplay(matterID);
                                // self.composeEmail.matterdocs = selectedDocuments;
                            }
                            return response;
                        },
                        function (error) {
                            notificationService.error('Intake not loaded');
                        });
                }
            }
        }

        /* Formate the matter id and name in case of global documents*/
        function formatTypeaheadDisplay(matterid) {
            if (utils.isEmptyVal(matterid)) {
                self.documentTags = [];
                self.composeEmail.matterdocs = [];
                self.clxGridOptions = {
                    selectedItems: [],
                    selectAll: false
                };
                self.documentsList.data = '';
            }
            var matterInfo = _.find(matters, function (matter) {
                return matter.matterid === matterid;
            });
            if (utils.isNotEmptyVal(matterid) && matterid != "0") {
                if (self.selectedMode == 2) {
                    documentsDataService.getDocumentsList(true, matterid, false, '1', self.pageSize, '1', 'asc', '').then(function (data) {
                        _.forEach(data.documents, function (item) {
                            item.docmodified_date = (utils.isEmptyVal(item.docmodified_date)) ? "" : moment.unix(item.docmodified_date).format('MM/DD/YYYY');
                        });
                        setDocs(data.documents);
                    }, function (reason) {
                        notificationService.error('document list not loaded');
                    });
                }
                else if (self.selectedMode == 1) {
                    inatkeDocumentsDataService.getDocumentsList(false, matterid, false, '1', self.pageSize, '', '', '').then(function (data) {
                        _.forEach(data.data, function (item) {
                            item.docmodified_date = (utils.isEmptyVal(item.docmodified_date)) ? "" : moment.unix(item.docmodified_date).format('MM/DD/YYYY');
                            item.doc_id = parseInt(item.intake_document_id);
                            item.doc_name = item.documentname;
                            item.doc_category = {};
                            item.doc_category.doc_category_name = item.categoryname;
                            item.associated_party = {};
                            item.associated_party.associated_party_name = item.associated_party_name;
                            item.created_by_name = item.created_by;
                        });
                        setDocs(data.data);

                    }, function (reason) {
                        notificationService.error('document list not loaded');
                    });
                }
            }


            if (utils.isNotEmptyVal(matterInfo)) {
                self.taggedMatterName = matterInfo.name ? matterInfo.name : "";
                var createdDate = matterInfo.createdDate ? matterInfo.createdDate : " ";
                var fileNumber = matterInfo.filenumber ? " - " + matterInfo.filenumber : " ";
                //var date_of_intake = matterInfo.date_of_intake? " - " + moment.unix(matterInfo.date_of_intake).utc().format('MM/DD/YYYY'):""; 
                return self.taggedMatterName + fileNumber + createdDate;
            } else {
                return matterInfo;
            }

        }
        self.checkChange = checkChange;
        function checkChange() {
            self.documentsList.data = [];
            matters = [];
            self.composeEmail.matter_id = "";

        }

        function setDocs(docList) {
            self.documentsList.data = docList;
            if (self.matterSearched == true) {
                self.matterChanged = true;
            } else {
                self.matterChanged = false;
            }
            var selectionDocIds = _.pluck(self.clxGridOptions.selectedItems, 'doc_id');

            var selectedDocuments = _.filter(self.documentsList.data, function (doc) {
                if (selectionDocIds.indexOf(doc.doc_id) > -1) {
                    return doc;
                }
            });
            //US#8023 get file size
            if (utils.isNotEmptyVal(selectedDocuments)) {
                self.clxGridOptions = {
                    selectedItems: selectedDocuments,
                    selectAll: false
                };
                if (selectedDocuments.length == self.documentsList.data.length && self.documentsList.data.length != 0) {
                    self.clxGridOptions.selectAll = true;
                } else {
                    self.clxGridOptions.selectAll = false;
                }
                self.composeEmail.matterdocs = self.clxGridOptions.selectedItems;
            }
        }

        /*Select all the documents*/
        function allDocumentsSelected() {
            var dataCopy = [];
            dataCopy = _.filter(self.documentsList.data, function (data) {
                return data.islocked == 0;
            });
            self.clxGridOptions.selectedItems = [];
        }

        /*check all documents selected*/
        function selectAllDocuments(selected) {
            self.selectedItemsCopy = [];
            $timeout(function () {
                if (selected) {
                    self.selectedItemsCopy = angular.copy(self.documentsList.data);
                }
            });
        }

        self.isDocEqual = function () {
            if (self.selectedItemsCopy.length == self.documentsList.data.length && self.documentsList.data.length != 0) {
                self.clxGridOptions.selectAll = true;
            } else {
                self.clxGridOptions.selectAll = false;
            }
        }

        /**
         * selected documents check in grid
         */
        function isDocSelected(doc) {
            var ids = _.pluck(self.selectedItemsCopy, 'doc_id');
            return ids.indexOf(doc) > -1;
        }

        function getDocCategories() {
            documentsDataService.getDocumentCategories()
                .then(function (response) {
                    self.documentCategories = response;
                    _.forEach(self.documentCategories, function (category) {
                        self.categories.push(category.Name);
                    });
                    self.categories = self.categories.sort();
                }, function (error) {
                    notificationService.error('document categories not loaded');
                });
        }

        function groupMatterDoc(doc) {
            if (utils.isNotEmptyVal(doc.categoryname)) {
                _.forEach(self.documentCategories, function (category) {
                    if (category.Name == doc.categoryname) {
                        self.matterdoc = category.Name;
                    }
                });
                return self.matterdoc;
            }
        }

        $scope.status = {
            isopen: false
        };

        $scope.toggled = function (open) {
            $log.log('Dropdown is now: ', open);
        };

        $scope.toggleDropdown = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.status.isopen = !$scope.status.isopen;
        };

        //US#7824 func to convert bytes to kb
        function calFileSize(data) {
            var doc = Math.ceil((data / 1024)) + 'kb';
            return doc;
        }

        /**
         * upload file and get size of file
         */
        function getFileSizeNUpload(selectedDocs) {
            selectedDocs = _.uniq(selectedDocs, function (x) {
                return x.doc_id;
            });
            $rootScope.$emit("selectionChanged", selectedDocs, self.matterChanged != true);
            self.clxGridOptions.selectedItems = angular.copy(selectedDocs);
            self.searchDocs = "";
            getFileSize(selectedDocs, 'matterdoc');
        }

        /**
         * @param {files} selected files size
         * @param {matterdocs} matter document or global document
         */
        function getFileSize(files, matterdoc) {
            var selectedDocId = "[" + _.pluck(files, 'doc_id').toString() + "]";
            var intakeflag = "";
            if (self.composeEmail.matter_id != "0" && self.composeEmail.matter_id != "") {
                intakeflag = (self.selectedMode == 1) ? "1" : "0";
            }
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
                    _.forEach(self.clxGridOptions.selectedItems, function (parent) {
                        _.forEach(response.data, function (child) {
                            if (parent.doc_id == child.documentid) {
                                parent.documentsize = child.documentsize;
                            }
                        });
                    });

                    if (errorMsg) {
                        notificationService.error("Cannot upload 0kb file");
                        errorMsg = false;
                    }
                    self.allDocSize = calculateTotalFileSize(response.data);
                    checkDocFileSize('blobDoc', function (callback) {
                        if (callback) {
                            self.composeEmail.matterdocs = angular.copy(self.clxGridOptions.selectedItems);
                            _.forEach(self.composeEmail.matterdocs, function (parent) {
                                _.forEach(response.data, function (child) {
                                    if (parent.doc_id == child.documentid) {
                                        parent.docSize = calFileSize(child.documentsize);
                                        parent.documentsize = child.documentsize;
                                    }
                                });
                            });
                            self.documentTags = [];
                            _.forEach(self.composeEmail.matterdocs, function (currentItem, index) {
                                self.documentTags.push({ value: currentItem.doc_name + " " + currentItem.docSize, type: "tagged-matter-document", id: currentItem.doc_id, index: index });
                            });
                        }
                    });
                }, function (error) {
                    if (error.status == 406) {
                        var index = self.composeEmail.matterdocs.indexOf(self.composeEmail.matterdocs)
                        self.composeEmail.matterdocs.splice(index, 1);
                        notificationService.error('This document does not exist');
                    }
                });
        }

        //func to get size of all attached files (matter docs + uploaded docs)
        function calculateTotalFileSize(matterDocs) {
            if (matterDocs && matterDocs.length == 0) {
                return;
            }
            var uploadedDocSize = self.composeEmail.file.reduce(function (prevVal, elem) {
                return prevVal + elem.fileSize;
            }, 0);

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
            return uploadedDocSize + matterDocSize;
        }

        //func to get file size from documents
        function checkDocFileSize(docType, callback) {
            self.enableSave = true;
            self.removeDocProgress = false;
            if (self.allDocSize > 25165824) {
                if (docType == 'phyUpload') {
                    self.composeEmail.file.splice(self.composeEmail.file.length - 1, 1);
                } else {
                    self.clxGridOptions.selectedItems.splice(self.clxGridOptions.selectedItems.length - 1, 1);
                }
                notificationService.error("The attachment size exceeds the allowable limit of 24 MB");

                self.allDocSize = calculateTotalFileSize();
                if (self.allDocSize > 25165824) {
                    checkDocFileSize(docType, callback);
                } else {
                    callback(true);
                }
            } else {
                if (callback != undefined) {
                    callback(true);
                }
            }
            self.enableSave = true;
            self.matterDocs = false;
        }

        /**US#7824 func to check size of all the files in blob as well as in physical upload
         * @param {msgCount will be update on files size exceed 24MB } msgCount
         */
        function checkFileSize(data, docType, callback) {
            self.removeDocProgress = false;
            size = 0;
            var file = angular.copy(data);
            _.forEach(file, function (item) {
                size += item;
            });
            if (size > 25165824) {
                if (docType == 'blobDoc') {
                    //     self.composeEmail.matterdocs.splice(self.composeEmail.matterdocs.length - 1, 1);
                } else if (docType == 'phyUpload') {
                    //     self.removeDocProgress = true;
                    self.composeEmail.file.splice(self.composeEmail.file.length - 1, 1);
                    self.documentSize.splice(self.documentSize.length - 1, 1);
                }
                notificationService.error("The attachment size exceeds the allowable limit of 24 MB");
                return;
            } else {
                self.matterDocs = false;
                if (callback) {
                    callback(true);
                }
            }
        }

        /**
         * open popup model for tagged matter document.
         */
        function openTagMatterDocument(taggedMatter) {
            var selectionDocIds = _.pluck(self.clxGridOptions.selectedItems, 'doc_id');

            var selectedDocuments = _.filter(self.documentsList.data, function (doc) {
                if (selectionDocIds.indexOf(doc.doc_id) > -1) {
                    return doc;
                }
            });
            self.clxGridOptions.selectedItems = selectedDocuments;
            self.composeEmail.matterdocs = self.clxGridOptions.selectedItems;

            self.selectedItemsCopy = angular.copy(self.clxGridOptions.selectedItems);
            self.isDocEqual();
            self.searchDocs = "";
            // if (utils.isNotEmptyVal(taggedMatter) && taggedMatter != "0") {
            if (self.composeEmail.matterdocs != undefined) {
                var allDocsSelected = false;
                if (self.documentsList.data.length == self.composeEmail.matterdocs.length && self.documentsList.data.length != 0) {
                    allDocsSelected = true;
                }
            }
            self.matterDocs = true;
        }

        /**
         * tag document cancel
         */
        function tagCancelled(cancelled) {
            var matterDocsCopy = angular.copy(self.composeEmail.matterdocs);
            _.forEach(matterDocsCopy, function (currentItem, matterIdx) {
                if (currentItem && currentItem.doc_id == cancelled.id) {
                    self.composeEmail.matterdocs.splice(matterIdx, 1);
                    self.documentTags = [];
                    _.forEach(self.composeEmail.matterdocs, function (currentItem, index) {
                        self.documentTags.push({ value: currentItem.doc_name + " " + currentItem.docSize, type: "tagged-matter-document", id: currentItem.doc_id, index: index });
                    });
                }
            });
            var selectedDocsCopy = self.clxGridOptions.selectedItems;
            _.forEach(selectedDocsCopy, function (currentItem, index) {
                if (currentItem && currentItem.doc_id == cancelled.id) {
                    self.clxGridOptions.selectedItems.splice(index, 1);
                }
            });

            if (self.draftfiles.length > 0) {
                _.forEach(self.draftfiles, function (currentItem, index) {
                    if (currentItem && currentItem.doc_id == cancelled.id) {
                        self.draftfiles.splice(index, 1);
                    }
                });
            }
            self.allDocSize = calculateTotalFileSize();
            $rootScope.$emit("selectionChanged", self.clxGridOptions.selectedItems, self.matterChanged != true);
        }

        /* file upload watch */
        $scope.$watch(function () {
            return self.files;
        }, function () {
            if (self.files) {
                upload(self.files);
            }
        });

        /* File upload */
        function upload(files) {
            if (files) {
                var checkSize = mailboxHelper.getSize(files);
                if (checkSize) {
                    notificationService.error("Cannot upload 0kb file");
                }
                localStorage.setItem('notificationError', "false");
                _.forEach(files, function (file) {
                    self.enableSave = false;
                    if (self.composeEmail.file.length > 0) {
                        var fileIndex = parseInt(self.composeEmail.file.length);
                    } else {
                        fileIndex = 0;
                    }
                    self.composeEmail.file[fileIndex] = {};
                    self.composeEmail.file[fileIndex].docname = file.name;
                    self.composeEmail.file[fileIndex].fileSize = file.size; //add file size in existing array
                    self.composeEmail.file[fileIndex].docSize = calFileSize(file.size);
                    self.allDocSize = calculateTotalFileSize();
                    checkDocFileSize('phyUpload', function (callback) {
                        if (callback) {
                            Upload.upload({
                                url: mailboxConstants.addAttachment,
                                fields: {
                                    'category': 'mailbox'
                                },
                                file: file
                            }).progress(function (evt) {
                                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                                self.composeEmail.file[fileIndex].fileProgress = progressPercentage;

                            }).success(function (data, status, headers, config) {
                                $timeout(function () {
                                    self.enableSave = true;
                                    if (data.code == '200') {
                                        self.composeEmail.file[fileIndex].docuri = data.successmessage.url;
                                        delete self.composeEmail.file[fileIndex].fileProgress;
                                    } else {
                                        self.composeEmail.file.splice(fileIndex, 1);
                                        self.allDocSize = calculateTotalFileSize();
                                        notificationService.error('File not attached!');
                                    }
                                });
                            }).error(function (data, status, headers, config) {
                                self.enableSave = true;
                                self.composeEmail.file.splice(fileIndex, 1);
                                self.allDocSize = calculateTotalFileSize();
                                notificationService.error('File not attached!');
                            });
                        }
                    });
                    self.enableSave = true;
                });
            }
        }

        /* Remove the attachment */
        function cancleAttachment(index) {
            var data = {
                docname: self.composeEmail.file[index].docname,
                uri: self.composeEmail.file[index].docuri,
                fileSize: self.composeEmail.file[index].fileSize
            };
            data.fileSize = utils.isEmptyVal(data.fileSize) ? 0 : data.fileSize;
            var documentSizeFilter = false;
            _.forEach(self.documentSize, function (item, index) {
                if (!documentSizeFilter) {
                    if (item.documentsize == data.fileSize && item.docName == data.docname) {
                        self.documentSize.splice(index, 1);
                        documentSizeFilter = true;
                    }
                }
            });
            self.composeEmail.file.splice(index, 1);
            self.allDocSize = calculateTotalFileSize();
            var index = _.findIndex(self.draftfiles, { docuri: data.uri })
            self.draftfiles[index] = '';
            self.draftfiles = _.reject(self.draftfiles, function (val) { return val == ''; });
            mailboxDataService.deleteAttachment(data)
                .then(function (data) {
                    // self.composeEmail.file.splice(index, 1);
                    //self.documentSize.splice(index, 1);
                });
        }


        /* Reply to mail set data */
        function reply(maildata, replyTo) {
            /*
              US#6141-If user clicks on 'Reply to all' then  it replies to all recipients of the e-mail not just the person that sent it. 
            */
            self.showselection = $rootScope.onMatter || $rootScope.onIntake ? true : false;
            self.emailNoteDisabled = true;
            self.composeEmail.matter_id = utils.isEmptyVal(maildata['matter_id']) ? "" : maildata['matter_id'];
            maildata['date_of_intake'] = maildata['date_of_intake'] ? " - " + moment.unix(maildata['date_of_intake']).utc().format('MM/DD/YYYY') : "";
            matters = [{ matterid: maildata['matter_id'], name: maildata['matter_name'], filenumber: maildata['file_number'], createdDate: maildata['date_of_intake'] }];
            var matterid = maildata['matter_id'];
            if (matterid != null) {
                self.showselection = true;
                self.tagggedmatter = true;
            }
            var subjectUnique = utils.isNotEmptyVal(maildata.subject) ? maildata.subject.split('Re:') : "";
            self.composeEmail.subject = utils.isNotEmptyVal(subjectUnique[subjectUnique.length - 1]) ? 'Re: ' + subjectUnique[subjectUnique.length - 1] : "Re: ";
            self.composeEmail.emailNotes = utils.isNotEmptyVal(maildata.email_note) ? maildata.email_note : '0';
            self.composeMailMsg = self.signature;
            self.composeEmail.parent_id = maildata.message_id;
            self.selectedMode = (maildata.is_intake == 1) ? "1" : "2";
            getRecipients(maildata, replyTo);
        }

        function composeDraftedMail(maildata, attachment) {
            self.composemail = false;
            self.matterDraftID = [];
            self.fileuploaded = [];
            self.draftfiles = [];
            self.compose = true;
            self.composeEmail.emailNotes = (maildata.email_note == '1') ? maildata.email_note : '0';
            self.composeEmail.matter_id = maildata['matter_id'];
            var parentId = maildata['parent_id'];
            self.selectedMode = (maildata.is_intake == 1) ? "1" : "2";
            if (self.composeEmail.matter_id != null && parentId != -1) {
                self.showselection = true;
                self.tagggedmatter = true;
            }
            else {
                self.tagggedmatter = false;
            }
            if ((utils.isNotEmptyVal(self.composeEmail.matter_id) && self.composeEmail.matter_id != "0") || attachment.length > 0) {
                self.documentsList.data = [];
                self.composeEmail.matterdocs = [];
                var selectedDocs = [];
                var docListPromise = null;
                if ((utils.isNotEmptyVal(self.composeEmail.matter_id) && self.composeEmail.matter_id != "0")) {
                    docListPromise = documentsDataService.getDocumentsList(true, self.composeEmail.matter_id, false, '1', self.pageSize, '1', 'asc', '');
                } else {
                    docListPromise = documentsDataService.getDocumentsList(true, null, false, '', '', '1', 'asc', '', null, true);
                }

                docListPromise.then(function (data) {
                    _.forEach(data.documents, function (item) {
                        item.docmodified_date = (utils.isEmptyVal(item.docmodified_date)) ? "" : moment.unix(item.docmodified_date).format('MM/DD/YYYY');
                    });
                    self.documentsList.data = data.documents;
                    _.forEach(attachment, function (dataValue, dataKey) {
                        _.forEach(self.documentsList.data, function (currentItem, index) {
                            if (dataValue.documentid == currentItem.doc_id) {
                                selectedDocs.push(currentItem);
                            }
                        });
                    });
                    selectedDocs = _.uniq(selectedDocs, function (item) {
                        return item.doc_id;
                    });
                    self.composeEmail.matterdocs = selectedDocs;
                    self.clxGridOptions = {
                        selectedItems: selectedDocs
                    };
                }, function (reason) {
                    notificationService.error('document list not loaded');
                });
            }
            maildata['date_of_intake'] = maildata['date_of_intake'] ? " - " + moment.unix(maildata['date_of_intake']).utc().format('MM/DD/YYYY') : "";
            matters = [{ matterid: maildata['matter_id'], name: maildata['matter_name'], filenumber: maildata['file_number'], createdDate: maildata['date_of_intake'] }];
            if (!maildata['is_intake']) {
                self.selectedMode = $rootScope.onMatter || $rootScope.onLauncher || $rootScope.onContactManager ? 2 : 1;
            }
            self.composeEmail.subject = maildata.subject;
            self.composeMailMsg = maildata.message;
            self.composeEmail.mail_msg_id = maildata.message_id;
            getRecipients(maildata, 'all');//US#6141-updated due to change in method defination
            if (attachment.length > 0) {
                _.forEach(attachment, function (dataValue, dataKey) {
                    if (dataValue.doctype == "mailbox") {
                        var attachmentSize = calFileSize(dataValue.fileSize);
                        var filedata = {
                            docuri: dataValue.uri,
                            docname: dataValue.docname,
                            fileSize: dataValue.fileSize,
                            docSize: attachmentSize,
                            documentid: dataValue.documentid
                        }
                        self.fileuploaded.push(filedata);
                        self.composeEmail.file.push(filedata);
                        self.documentSize.push({ 'documentsize': filedata.fileSize, 'docName': filedata.docname, 'documentid': filedata.documentid });
                    } else {
                        var attachmentSize = calFileSize(dataValue.fileSize); //if doctype == matterdoc
                        var filedata = {
                            documentname: dataValue.docname,
                            docuri: dataValue.uri,
                            documentid: dataValue.documentid,
                            fileSize: dataValue.fileSize,
                            docSize: attachmentSize
                        }
                        self.matterDraftID.push(filedata);
                        self.composeEmail.matterdocs.push(filedata);
                        self.documentTags = [];
                        _.forEach(self.composeEmail.matterdocs, function (currentItem, index) {
                            self.documentTags.push({ value: currentItem.documentname + " " + currentItem.docSize, type: "tagged-matter-document", id: currentItem.documentid, index: index });
                        });
                        self.documentTags = _.uniq(self.documentTags, function (item) {
                            return item.id;
                        });
                        self.documentSize.push({ 'documentsize': filedata.fileSize, 'docName': filedata.documentname, 'documentid': filedata.documentid });
                        //Bug#6395: Matter name tag issue in draft mail
                        if (utils.isEmptyVal(self.composeEmail.matter_id)) { self.composeEmail.matter_id = "0"; }
                    }
                    // var doc = calFileSize(dataValue.fileSize);
                    var filedata = {
                        docuri: dataValue.uri,
                        docname: dataValue.docname,
                        documentid: dataValue.documentid
                    }
                    self.draftfiles.push(filedata);
                });
            }
        }

        function getRecipients(maildata, replyTo) {
            var recipientsUsers = [];
            self.emailDocsNote = true;
            mailboxDataService.getRecipients(maildata.message_id, replyTo)
                .then(function (response) {
                    var recipients = response.data;
                    _.forEach(recipients, function (dataValue, dataKey) {
                        var addUser = {};
                        addUser.type = dataValue.type;
                        addUser.uid = dataValue.id;
                        addUser.mail = dataValue.mail;
                        addUser.name = dataValue.fname;
                        addUser.lname = dataValue.lname;
                        recipientsUsers.push(addUser);
                    });
                    setRecepientsUsers(replyTo, recipientsUsers, maildata);


                    // /*Bug#6223-Add mail sender to reciepent list*/
                    // if (utils.isEmptyVal(mailSender)) {
                    //     recipientsUsers.push(fromMailUser);
                    // }

                    // if (replyTo == 'all') {
                    //     self.composeEmail.recipientsUsers = recipientsUsers;
                    // }
                    // else {
                    //     recipientsUsers = [];
                    //     fromMailUser = (utils.isEmptyVal(mailSender[0])) ? fromMailUser
                    //         : mailSender[0]
                    //     recipientsUsers.push(fromMailUser);
                    //     self.composeEmail.recipientsUsers = recipientsUsers;
                    // }
                });
        }

        /**
         * set To, Cc, Bcc recepients  
         * typeId 1:    "To"
         * typeId 2:    "Cc"
         * typeId 3:    "Bcc"
         * reply:       "reply or reply all"
         */
        function setRecepientsUsers(reply, recepients, mailInfo) {
            // var sendToMailId = (utils.isEmptyVal(maildata.from_mail)) ?
            //     maildata.from_mail_user : maildata.from_mail;
            // var mailSender = _.filter(recipientsUsers, function (user) {
            //     return (maildata.from_id == user.uid);
            // });
            // var fromMailUser = { lname: maildata.from_lname, name: maildata.from_fname, mail: sendToMailId, uid: maildata.from_id };
            if (reply == 'all') {
                self.composeEmail.recipientsUsers = _.filter(recepients, function (recKey) {
                    return recKey.type == null || recKey.type == "1";
                });
                self.composeEmail.recipientsUserCc = _.filter(recepients, function (recKey) {
                    return recKey.type == "2";
                });
                if (self.activeTab == 'Draftbox') {
                    self.composeEmail.recipientsUserBcc = _.filter(recepients, function (recKey) {
                        return recKey.type == "3";
                    });
                }
            } else {
                createRecepientsTo(recepients);
            }
        }

        function createRecepientsTo(recepients) {
            self.composeEmail.recipientsUsers = _.filter(recepients, function (recKey) {
                return recKey.type == null || recKey.type == "1";
            });
            self.composeEmail.recipientsUserCc = [];
            self.composeEmail.recipientsUserBcc = [];
        }

        /**
         * get recipients format
         */
        function getRecipientsFormat(recipients) {
            var recipientsList = [];
            if (recipients.length > 0) {
                _.forEach(recipients, function (dataValue, dataKey) {
                    var roleVal = "";
                    if (utils.isNotEmptyVal(dataValue.role)) {
                        roleVal = dataValue.role;
                    } else {
                        if (dataValue.uid == "0" || dataValue.uid == null) {
                            roleVal = "External";
                        } else {
                            roleVal = "User";
                        }
                    }
                    var rep = {
                        mail: dataValue.mail,
                        role: roleVal,
                        id: dataValue.uid
                    };
                    recipientsList.push(rep);
                });
            }
            return recipientsList;
        }

        function validateEmail(data) {
            var recipientId = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data);
            // var validateId  = recipientId.test();
            if (recipientId == false) {
                return false;
            } else {
                return true;
            }

        }

        function validateEmails(Ids) {
            var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            var allValidIds = true;
            if (!Ids) {
                return allValidIds;

            }
            _.forEach(Ids, function (userId) {
                var validateEmail = emailRegex.test(userId.mail.trim());
                if (!validateEmail) {
                    allValidIds = false;
                }
            });
            return allValidIds;
        }
        /* Send mail */
        function sendMail(draft) {            
            $('#navMenu').removeClass('cursor-pointer-events-none');
            var recipientfound = true;
            var recipients = [];
            var ccRecipients = [];
            var bccRecipients = [];
            self.composeEmail.recipientsUsers = (self.composeEmail.recipientsUsers == undefined) ? [] : self.composeEmail.recipientsUsers;
            if (self.composeEmail.recipientsUsers.length == 0 && draft != 'draft') {
                recipientfound = false;
                notificationService.error('Recipient Team Members are required to send mail.');
            }

            var email_note = (self.composeEmail.emailNotes == undefined) ? "1" : self.composeEmail.emailNotes;

            if (recipientfound == true) {

                if (!validateEmails(self.composeEmail.recipientsUsers) ||
                    !validateEmails(self.composeEmail.recipientsUserCc) ||
                    !validateEmails(self.composeEmail.recipientsUserBcc)) {
                    notificationService.error("Please enter valid email address!");
                    return;
                }
                if (draft == 'draft') {
                    var status = 'Draft';
                    var from = 'draft@gmail.com';
                    var successMsg = "Draft Saved";
                } else {
                    var status = 'Sent';
                    var from = '';
                    var successMsg = "Your mail has been sent.";
                }

                if (self.composeEmail.parent_id > 0) {
                    var parent_id = self.composeEmail.parent_id;
                } else {
                    var parent_id = -1;
                }

                recipients = utils.isNotEmptyVal(self.composeEmail.recipientsUsers) ? getRecipientsFormat(self.composeEmail.recipientsUsers) : ''; // create recipient users
                ccRecipients = utils.isNotEmptyVal(self.composeEmail.recipientsUserCc) ? getRecipientsFormat(self.composeEmail.recipientsUserCc) : ''; // create cc recipients users 
                bccRecipients = utils.isNotEmptyVal(self.composeEmail.recipientsUserBcc) ? getRecipientsFormat(self.composeEmail.recipientsUserBcc) : ''; // create bcc recipients users

                // Getting the document ID in the array from document object
                self.matterDocID = [];
                // if (self.compose) {
                _.forEach(self.composeEmail.matterdocs, function (doc) {
                    self.matterDocID.push(doc.doc_id);

                });
                // }
                // if (utils.isNotEmptyVal($rootScope.rootSelectedDocument)) {
                //     _.forEach($rootScope.rootSelectedDocument, function(doc) {
                //         self.matterDocID.push(doc.documentid);
                //     });
                // }

                self.matterDocID = _.difference(self.matterDocID, _.pluck(self.matterDraftID, 'doc_id'));

                if (self.composemail) {
                    self.draftfiles = [];
                } else if (self.draftfiles.length == 0) {
                    self.draftfiles = [];
                }

                var i = 0;
                angular.forEach(self.composeEmail.file, function (val, key) {
                    angular.forEach(self.draftfiles, function (val1, key1) {
                        if (val.docuri == val1.docuri) {
                            self.composeEmail.file[i] = '';
                        }
                    });
                    i++
                });

                self.composeEmail.file = _.reject(self.composeEmail.file, function (val) { return val == ''; });
                // var messageContain = ($rootScope.composeNotesEmail) ? $rootScope.composeNotesEmail : self.composeMailMsg;
                var intakeflag;
                if (self.composeEmail.matter_id != "0" && self.composeEmail.matter_id != "" && self.composeEmail.matter_id) {
                    intakeflag = (self.selectedMode == 1) ? "1" : "0";
                }
                if (!self.composeEmail.matter_id) {
                    self.composeEmail.matter_id = "0";
                }
                else if (isNaN(self.composeEmail.matter_id)) {
                    var selectionname = (self.selectedMode == 1) ? 'Intake name' : 'Matter name'
                    notificationService.error("Please enter valid " + selectionname + " !");
                    return;
                }
                var data = {
                    recipients: recipients,
                    cc_recipients: ccRecipients,
                    bcc_recipients: bccRecipients,
                    subject: self.composeEmail.subject,
                    matter_id: (self.composeEmail.matter_id == "0") ? "" : self.composeEmail.matter_id.toString(),
                    message: self.composeMailMsg,
                    plainmessage: '',
                    parent_id: parent_id,
                    status: status,
                    type: status,
                    from_user: from,
                    mail_msg_id: self.composeEmail.mail_msg_id,
                    files: self.draftfiles,
                    matterdocs: self.matterDocID,
                    new_files: self.composeEmail.file,
                    email_note: email_note,
                    is_intake: intakeflag
                };
                if (recipients.length == 0) {
                    delete data['recipients'];
                }

                _.forEach(data.recipients, function (mail) {
                    if (utils.isEmptyVal(mail.id)) {
                        mail.id = "0";
                    }
                })
                
                mailboxDataService.sendMail(data)
                    .then(function (data) {
                        notificationService.success(successMsg);
                        if (draft == 'draft') {
                            toggleTab('Draftbox');
                        } else {
                            toggleTab('Sentbox');
                        }
                        closeCompose();
                    }, function (error) {
                        notificationService.error('Unable to process mail.');
                    });
            }
        }

        /* Close compose and clear all data*/
        function closeCompose() {
            self.tempMatterId= '';
            $('#navMenu').removeClass('cursor-pointer-events-none');
            self.composeEmail = {
                recipientsUsers: [],
                matterdocs: [],
                recipientsContacts: [],
                subject: '[Cloudlex] -', //US#6565 'Cloudlex' should be by default while composing email
                matter_id: '',
                message: '',
                parent_id: 0,
                mail_msg_id: '',
                file: [],
            };
            self.documentSize = []; //empty file size array
            self.fileName = '';
            self.fileProgress = '';
            self.compose = false;
            self.composemail = true;
            self.composeEmail.matter_id = "";
            self.composeEmail.matterdocs = [];
            self.clxGridOptions = {
                selectedItems: [],
                selectAll: false
            };
            self.documentTags = [];
            $rootScope.$emit("callCloseComposeMail", {});
            self.allDocSize = 0;
            self.selectedMode = $rootScope.onMatter || $rootScope.onLauncher || $rootScope.onContactManager || $rootScope.onExpense ? 2 : 1;
        }

        /* Download document*/
        function downloadAttachment(attId) {
            mailboxDataService.downloadFile(attId.attachment_id)
                .then(function (response) {

                    if (response && response.data && response.data != '') {
                        utils.downloadFile(response.data, attId.docname, response.headers("Content-Type"));

                    } else {
                        notificationService.error('Unable to download attachment');
                    }

                }, function (error) {
                    notificationService.error('Unable to download attachment');
                })
        }

        /*Get email signature if user*/
        function getUserEmailSignaure() {
            mailboxDataService.emailSignature()
                .then(function (data) {
                    if (utils.isNotEmptyVal(data.data)) {
                        self.signature = data.data[0];
                        self.signature = '<br/><br/>' + self.signature;
                        $rootScope.emailSig = angular.copy(self.signature);
                    }
                    self.enableCompose = true;
                }, function (error) {
                    self.enableCompose = true;
                });
        }
        function getTagAMatter(data) {
            self.composeEmail.matter_id = data;
        }
    }
})();

/**
 * mailbox helper 
 */
(function () {
    angular.module('cloudlex.mailbox')
        .factory('mailboxHelper', mailboxHelper);

    function mailboxHelper() {
        return {
            getDefinedArray: getDefinedArray,
            isMailSelected: isMailSelected,
            isDocumentSelected: isDocumentSelected,
            getSize: getSize
        }

        function isDocumentSelected(documentList, doc) {
            var ids = _.pluck(documentList, 'documentid');
            return ids.indexOf(doc.documentid) > -1;
        }

        function getSize(files) {
            var msgForUpload = false;
            files.slice(0).forEach(function (item) {
                if (item.size == 0) {
                    files.splice(files.indexOf(item), 1);
                    msgForUpload = true;
                }
            });
            return msgForUpload;
        }

        function getDefinedArray() {
            var arrayRet = [];
            arrayRet['inboxList'] = {
                data: [],
                count: 0,
                totallength: 0,
                pageNum: 1,
                allmails: false,
                mailSelected: [],
                datafiltered: true,
                inboxFiltered: true,
                inboxListreceived: false,
                // filterText: '',
                filtertags: [],
                sortBy: 0,
                sortOrder: 'desc',
                sortSeleted: 'Date',
                selectAll: false,
                selectedItems: [],
                MailSelected: {},

            };

            return arrayRet;
        }

        function isMailSelected(mailList, mail, currentTab) {

            var ids = (currentTab == 'Inbox') ? _.pluck(mailList, 'mail_inbox_id') : _.pluck(mailList, 'mail_msg_id');
            return (currentTab == 'Inbox') ? (ids.indexOf(mail.mail_inbox_id) > -1) : (ids.indexOf(mail.mail_msg_id) > -1);
        }


    }
})();
