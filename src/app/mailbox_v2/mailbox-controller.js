/* Mailbox controller*/
(function () {

    'use strict';

    angular
        .module('cloudlex.mailbox_java')
        .controller('MailboxControllerV2', MailboxControllerV2);

    MailboxControllerV2.$inject = ['$rootScope', '$timeout', '$scope', 'Upload', 'mailboxDataServiceV2', 'documentsDataService', 'notification-service',
        'modalService', 'mailboxHelperV2', 'matterFactory', 'mailboxConstantsV2', 'masterData', 'notificationDatalayer', 'profileDataLayer'
    ];

    function MailboxControllerV2($rootScope, $timeout, $scope, Upload, mailboxDataServiceV2, documentsDataService, notificationService,
        modalService, mailboxHelper, matterFactory, mailboxConstantsV2, masterData, notificationDatalayer, profileDataLayer) {
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
        self.display = {
            documentSelected: []
        };
        //US#4713 disable add edit delete
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.callUpdate = callUpdate;
        self.validateEmail = validateEmail;
        self.openTagMatterDocument = openTagMatterDocument;
        self.validEmail = false;
        self.allFiles = [];
        self.resetPage = resetPage;
        self.pageSize = 250;
        self.disabledSidebarIcon = disabledSidebarIcon;

        (function () {
            init();
            getInboxList();
            getUsers();
            getDocCategories();
            getfiltertext();
            getUserProfile();
            var filtertext = localStorage.getItem("emailSearchText");
            if (utils.isNotEmptyVal(filtertext)) {
                self.showSearch = true;
            }


            /**
             * firm basis module setting 
             */
            self.firmData = JSON.parse(localStorage.getItem('firmSetting'));
        })();

        function resetPage() {
            init();
            getInboxList();
            searchReset();
        }

        function disabledSidebarIcon() {
            $('#navMenu').addClass('cursor-pointer-events-none');
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
         * function to validate email ids from contactcard
         */
        var checkFlagForAddress = false;
        self.checkEmailAddress = function (ids) {
            var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            var validateEmail = emailRegex.test(ids);
            if (!checkFlagForAddress) {
                if (!validateEmail) {
                    checkFlagForAddress = true;
                    notificationService.error("Please enter valid email address!");
                }
            }

        }

        /**
         * 
         */
        $rootScope.updateComposeMailMsgBody = function (composeEmail, matter_id, documentList, selectedDocuments, contactFrom, contactData) {
            $('#navMenu').addClass('cursor-pointer-events-none');
            self.allDocSize = 0;
            self.composeMailMsg = composeEmail;
            self.emailDocsNote = true; // show email or docs checkbox flag
            self.matterDocs = false;
            self.composeEmail.emailNotes = "0";
            if (contactFrom == 'contactEmail') {
                self.sendToList = [];
                self.composeEmail.recipientsUsers = [];
                var emailId = [];
                emailId = contactData.email_ids.split(',');
                _.forEach(emailId, function (eValue, eKey) {
                    var removeSpace = eValue.trim();
                    var addContactData = {
                        // uid: contactData.contactid,
                        fullname: contactData.first_name + " " + contactData.last_name,
                        name: contactData.first_name,
                        personal: contactData.first_name + " " + contactData.last_name,
                        address: removeSpace,
                    };
                    self.checkEmailAddress(addContactData.address);
                    self.sendToList.push(addContactData);
                    self.composeEmail.recipientsUsers.push(addContactData);
                });
                checkFlagForAddress = false;
                self.tempStaorageVar = self.composeEmail;
                localStorage.setItem("composestore", JSON.stringify(self.tempStaorageVar));
            }
            if (contactFrom == "matterRecipents") {
                self.sendToList = [];
                self.composeEmail.recipientsUsers = [];
                _.forEach(contactData, function (currentItem, index) {
                    var addContactData = {
                        // uid: contactData.contactid,
                        fullname: currentItem.name + " " + currentItem.lname,
                        personal: currentItem.name + " " + currentItem.lname,
                        address: currentItem.mail,
                    };
                    self.sendToList.push(addContactData);
                    self.composeEmail.recipientsUsers.push(addContactData);
                });
            }
            if (utils.isNotEmptyVal(matter_id) && matter_id != "0") {
                self.composeEmail.matter_id = matter_id.matterid;
                matters = [{ name: matter_id.name, matterid: matter_id.matterid }];
                //US#8023 get file size
                if (utils.isNotEmptyVal(selectedDocuments)) {
                    self.clxGridOptions = {
                        selectedItems: selectedDocuments,
                        selectAll: false
                    };
                    getFileSize(selectedDocuments, "matterdoc");
                }
            } else {
                self.documentsList.data = documentList;
                self.composeEmail.matter_id = matter_id;
                //US#8023 get file size
                if (utils.isNotEmptyVal(selectedDocuments)) {
                    self.composeEmail.matterdocs = selectedDocuments;
                    self.clxGridOptions = {
                        selectedItems: selectedDocuments,
                        selectAll: false
                    };
                    getFileSize(selectedDocuments);
                }
            }

        }

        /**
         * @param {current emails address} ids
         */
        self.checkAddress = function (ids) {
            var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            var validateEmail = emailRegex.test(ids[ids.length - 1].address);
            if (!validateEmail) {
                notificationService.error("Please enter valid email address!");
            }
        }

        /**
         * user profile details
         */
        function getUserProfile() {
            profileDataLayer.getViewProfileData()
                .then(function (success) {
                    self.userProfile = success[0];
                }, function (error) {
                    notificationService.error("Unable load user profile details!");
                });
        }

        function searchReset() {
            self.inboxList.filterText = '';
            var filtertext = localStorage.setItem("emailSearchText", self.inboxList.filterText);
            self.showSearch = false;
        }

        function init() {
            getUserEmailSignaure();
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
            var filtertext = localStorage.getItem("emailSearchText");
            if (utils.isNotEmptyVal(filtertext)) {
                self.inboxList.filterText = filtertext;
            }
        }

        /* Get the inbox List */
        function getInboxList(filtered) {
            var promese = mailboxDataServiceV2.getInboxList(self.inboxList.pageNum, self.inboxList.sortBy, self.inboxList.sortOrder);
            promese.then(function (data) {
                if (self.activeTab == 'Inbox') {
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
                notificationService.error('Inbox Mails not loaded.');
            });
        }

        /* Get the sent mails list */
        function getSentList(filtered) {
            var promese = mailboxDataServiceV2.getSentList(self.inboxList.pageNum, self.inboxList.sortBy, self.inboxList.sortOrder);
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
            var promese = mailboxDataServiceV2.getDraftList(self.inboxList.pageNum, self.inboxList.sortBy, self.inboxList.sortOrder);
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

                _.forEach(data, function (itemValue) {
                    var newdata = {};
                    newdata = itemValue;
                    var senderName = _.pick(itemValue, 'sender');
                    _.forEach(senderName, function (currentItem) {
                        currentItem.personal = (currentItem.personal == null || currentItem.personal == "null") ? currentItem.address : currentItem.personal;
                        newdata.personal = currentItem.personal;
                        //newdata.is_read = 1;
                    });
                    //var fullname = '';
                    // if (itemValue.fname != null && itemValue.fname != 'null' && itemValue.lname != null && itemValue.lname != 'null') {
                    //     fullname = itemValue.fname + ' ' + itemValue.lname;
                    // } else if (itemValue.fname != null && itemValue.fname != 'null' && (itemValue.lname == null || itemValue.lname == 'null')) {
                    //     fullname = itemValue.fname;
                    // } else if (itemValue.fname == null) {
                    //     fullname = '';
                    //     //fullname = itemValue.from_user;
                    // }
                    //newdata.from_user = fullname;
                    //newdata.gmailthreadid = parseInt(newdata.gmailthreadid);
                    newList.push(newdata);
                });

            } else if (self.activeTab == 'Sentbox' || self.activeTab == 'Draftbox') {
                _.forEach(data, function (itemValue) {
                    //set recipient name
                    var newdata = {};
                    self.fullname = [];
                    newdata = itemValue;
                    var allreceipientsName = _.pick(itemValue, 'allRecipients');
                    _.forEach(allreceipientsName, function (parent) {
                        _.forEach(parent, function (child) {
                            child.personal = (child.personal == null || child.personal == "null") ? child.address : child.personal;
                            self.fullname.push(child.personal);
                        });
                        self.recipientName = [];
                        self.recipientName = self.fullname.toString();
                        self.fullname = [];
                        newdata.personal = self.recipientName.split(',').join(', ');
                        newdata.is_read = 1;
                        newList.push(newdata);

                    });

                    // var fullNames = '';
                    // if (itemValue.fname != null && itemValue.fname != 'null') {
                    //     var fnames = itemValue.fname.split(',');
                    //     if (itemValue.lname != null && itemValue.lname != 'null') {
                    //         var lnames = itemValue.lname.split(',');
                    //     }
                    //     fullNames = '';
                    //     _.forEach(fnames, function (nValue, nKey) {
                    //         var fullname = nValue;

                    //         if (lnames) {
                    //             if (lnames[nKey] != '' && lnames[nKey] != 'null')
                    //                 fullname = fullname + ' ' + lnames[nKey];
                    //         }
                    //         if (nKey != 0) {
                    //             fullNames = fullNames + ', ';
                    //         }
                    //         fullNames = fullNames + fullname;
                    //     });
                    // } else if (itemValue.mail_to != '') {
                    //     fullNames = itemValue.mail_to;
                    // }
                    //newdata.from_user = fullNames;
                    //newdata.is_read = 1;

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

            self.inboxList.MailSelected[(currentTab == 'Inbox') ? mail.gmailmessageid : mail.gmailmessageid] =
                mailboxHelper.isMailSelected(self.inboxList.selectedItems, mail, currentTab);
            return self.inboxList.MailSelected[(currentTab == 'Inbox') ? mail.gmailmessageid : mail.gmailmessageid];
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
            localStorage.setItem("emailSearchText", filtertext);
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

                    if (self.activeTab == 'Inbox') {
                        docdata.val = _.pluck(self.inboxList.selectedItems, 'gmailthreadid');
                        var type = "0";
                    } else if (self.activeTab == 'Sentbox') {
                        docdata.val = _.pluck(self.inboxList.selectedItems, 'gmailmessageid');
                        var type = "1";
                    } else if (self.activeTab == 'Draftbox') {
                        docdata.val = _.pluck(self.inboxList.selectedItems, 'gmailmessageid');
                        var type = "2";
                    }
                    var promesa = mailboxDataServiceV2.deleteMails(docdata.val, type);
                    promesa.then(function (data) {

                        if ($rootScope.onLauncher) {
                            notificationDatalayer.getNotificationCountForIntake()
                                .then(function (res) {
                                    // self.unreadMailcount = res.data.email_count;
                                    var unreadMailcount = res.data.email_count;
                                    $rootScope.$broadcast('updateEmailCountForIntake', { count: unreadMailcount });
                                });
                            notificationDatalayer.getNotificationCount()
                                .then(function (res) {
                                    // self.unreadMailcount = res.data.email_count;
                                    var unreadMailcount = res.data.email_count;
                                    $rootScope.$broadcast('updateEmailCount', { count: unreadMailcount });
                                });

                        } else if ($rootScope.onIntake) {
                            notificationDatalayer.getNotificationCountForIntake()
                                .then(function (res) {
                                    self.unreadMailcount = res.data.email_count;
                                    $rootScope.$broadcast('updateEmailCountForIntake', { count: self.unreadMailcount });
                                });
                        } else {
                            notificationDatalayer.getNotificationCount()
                                .then(function (res) {
                                    self.unreadMailcount = res.data.email_count;
                                    $rootScope.$broadcast('updateEmailCount', { count: self.unreadMailcount });
                                });
                        }

                        self.inboxList.inboxFiltered = true;
                        getList();
                        notificationService.success('Mail deleted successfully');
                        self.inboxList.selectAll = false;
                        self.inboxList.selectedItems = [];
                    }, function (error) {
                        notificationService.error('Unable to delete mail');
                    });
                });
        }

        /**
         * 
         * @param {data is selected maillist message} data 
         * @param {selected mail list index} index 
         */
        function getMailThread(data, index) {
            if (self.activeTab == 'Inbox') {
                var promesReturned = mailboxDataServiceV2.getMailthread(data.gmailthreadid, data.is_read);
                promesReturned.then(function (data) {
                    self.bccFlag = false;
                    if ($rootScope.onLauncher) {
                        notificationDatalayer.getNotificationCountForIntake()
                            .then(function (res) {
                                // self.unreadMailcount = res.data.email_count;
                                var unreadMailcount = res.data.email_count;
                                $rootScope.$broadcast('updateEmailCountForIntake', { count: unreadMailcount });
                            });

                        notificationDatalayer.getNotificationCount()
                            .then(function (res) {
                                // self.unreadMailcount = res.data.email_count;
                                var unreadMailcount = res.data.email_count;
                                $rootScope.$broadcast('updateEmailCount', { count: unreadMailcount });
                            });

                    } else if ($rootScope.onIntake) {
                        notificationDatalayer.getNotificationCountForIntake()
                            .then(function (res) {
                                self.unreadMailcount = res.data.email_count;
                                $rootScope.$broadcast('updateEmailCountForIntake', { count: self.unreadMailcount });
                            });
                    } else {
                        notificationDatalayer.getNotificationCount()
                            .then(function (res) {
                                self.unreadMailcount = res.data.email_count;
                                $rootScope.$broadcast('updateEmailCount', { count: self.unreadMailcount });
                            });
                    }

                    _.forEach(self.inboxList.data, function (dataValue, dataKey) {
                        self.inboxList.data[dataKey].selected = 0;
                    });
                    self.inboxList.data[index].selected = 1;
                    self.mailThread = [];
                    self.mailThread = data.data;
                    self.mailThreadAttachment = [];
                    self.mailToThread = [];
                    self.mailCcThread = [];
                    self.mailBccThread = [];

                    _.forEach(self.mailThread, function (dataValue, dataKey) {
                        self.mailToThread = [];
                        self.mailCcThread = [];
                        self.mailBccThread = [];
                        var name = "";
                        var mail_display = "";
                        self.mailThread[dataKey].files = dataValue.files;
                        if (dataValue.pic != undefined) {
                            var profilePicture = dataValue.pic.split(':/');
                            dataValue.pic = mailboxConstantsV2.profilePic + "" + profilePicture[1];
                        }
                        var senderName = _.pick(dataValue, 'sender');
                        _.forEach(senderName, function (currentItem) {
                            currentItem.personal = utils.isEmptyVal(currentItem.personal) ? '' : currentItem.personal;
                            name = currentItem.personal;
                            mail_display = currentItem.address;
                        });

                        self.mailThread[dataKey].name = name;
                        self.mailThread[dataKey].mailDisplay = mail_display;

                        // set to name 
                        if (utils.isNotEmptyVal(self.mailThread[dataKey].recipients)) {
                            _.forEach(self.mailThread[dataKey].recipients, function (thread) {
                                var personal = utils.isNotEmptyVal(thread.personal) ? thread.personal : '';
                                var mail_display = utils.isNotEmptyVal(thread.address) ? thread.address : '';
                                self.mailToThread.push({ 'name': personal, 'mailDisplay': mail_display });
                            });
                            self.mailThread[dataKey].mailToThread = self.mailToThread;
                        }

                        // set cc name 
                        if (utils.isNotEmptyVal(self.mailThread[dataKey].cc_recipients)) {
                            _.forEach(self.mailThread[dataKey].cc_recipients, function (thread) {
                                var personal = utils.isNotEmptyVal(thread.personal) ? thread.personal : '';
                                var mail_display = utils.isNotEmptyVal(thread.address) ? thread.address : '';
                                self.mailCcThread.push({ 'name': personal, 'mailDisplay': mail_display });
                            });
                            self.mailThread[dataKey].mailCcThread = self.mailCcThread;
                        }

                        // set Bcc name 
                        if (utils.isNotEmptyVal(self.mailThread[dataKey].bcc_recipients)) {
                            _.forEach(self.mailThread[dataKey].bcc_recipients, function (thread) {
                                var personal = utils.isNotEmptyVal(thread.personal) ? thread.personal : '';
                                var mail_display = utils.isNotEmptyVal(thread.address) ? thread.address : '';
                                self.mailBccThread.push({ 'name': personal, 'mailDisplay': mail_display });
                            });
                            self.mailThread[dataKey].mailBccThread = self.mailBccThread;
                        }
                    });
                    // if (self.activeTab == 'Inbox') {
                    //     self.inboxList.data[index].is_read = 1;
                    //     mailboxDataServiceV2.getReadEmail(data.gmailmessageid)
                    //     .then(function(response){
                    //         if(response){

                    //         }
                    //     })
                    // }
                    self.inboxList.data[index].is_read = 1;
                }, function (error) {
                    notificationService.error('Unable to retreive mail thread.');
                });
            }
            // Inbox End
            else if (self.activeTab == 'Sentbox' || self.activeTab == 'Draftbox') {
                self.bccFlag = true;
                var type = self.activeTab == 'Sentbox' ? 1 : 2;
                var promesReturned = mailboxDataServiceV2.getSentMailthread(data.gmailmessageid, type);
                promesReturned.then(function (data) {
                    if ($rootScope.onLauncher) {
                        notificationDatalayer.getNotificationCountForIntake()
                            .then(function (res) {
                                // self.unreadMailcount = res.data.email_count;
                                var unreadMailcount = res.data.email_count;
                                $rootScope.$broadcast('updateEmailCountForIntake', { count: unreadMailcount });
                            });

                        notificationDatalayer.getNotificationCount()
                            .then(function (res) {
                                // self.unreadMailcount = res.data.email_count;
                                var unreadMailcount = res.data.email_count;
                                $rootScope.$broadcast('updateEmailCount', { count: unreadMailcount });
                            });

                    } else if ($rootScope.onIntake) {
                        notificationDatalayer.getNotificationCountForIntake()
                            .then(function (res) {
                                self.unreadMailcount = res.data.email_count;
                                $rootScope.$broadcast('updateEmailCountForIntake', { count: self.unreadMailcount });
                            });
                    } else {
                        notificationDatalayer.getNotificationCount()
                            .then(function (res) {
                                self.unreadMailcount = res.data.email_count;
                                $rootScope.$broadcast('updateEmailCount', { count: self.unreadMailcount });
                            });
                    }

                    _.forEach(self.inboxList.data, function (dataValue, dataKey) {
                        self.inboxList.data[dataKey].selected = 0;
                    });
                    self.inboxList.data[index].selected = 1;
                    self.mailThread = [];
                    self.mailThread.push(data.data);
                    self.mailThreadAttachment = [];
                    self.mailToThread = [];
                    self.mailCcThread = [];
                    self.mailBccThread = [];
                    self.allDocSize = 0;
                    _.forEach(self.mailThread, function (dataValue, dataKey) {
                        var totalCount = dataValue.files.reduce(function (prevVal, elem) {
                            return prevVal + elem.size;
                        }, 0);
                        self.allDocSize += totalCount;

                        self.mailToThread = [];
                        self.mailCcThread = [];
                        self.mailBccThread = [];
                        self.composeEmail.gmailmessageid = dataValue.gmailmessageid;
                        self.composeEmail.gmailthreadid = dataValue.gmailthreadid;
                        var name = "";
                        var mail_display = "";
                        self.mailThread[dataKey].files = dataValue.files;
                        if (dataValue.pic != undefined) {
                            var profilePicture = dataValue.pic.split(':/');
                            dataValue.pic = mailboxConstantsV2.profilePic + "" + profilePicture[1];
                        }
                        var senderName = _.pick(dataValue, 'sender');
                        _.forEach(senderName, function (currentItem) {
                            currentItem.personal = utils.isEmptyVal(currentItem.personal) ? '' : currentItem.personal;
                            name = currentItem.personal;
                            mail_display = currentItem.address;
                        });
                        self.mailThread[dataKey].name = name;
                        self.mailThread[dataKey].mailDisplay = mail_display;
                        // if (dataValue.from_mail != null && dataValue.from_mail != 'null' && dataValue.from_mail != '') {
                        //     self.mailThread[dataKey].mailDisplay = dataValue.from_mail;
                        // }
                        //self.bccFlag = (dataValue.type == "0" || dataValue.type == null || dataValue.type == "1" || dataValue.type == "3") ? true : false;
                        // set to name 
                        if (utils.isNotEmptyVal(self.mailThread[dataKey].recipients)) {
                            _.forEach(self.mailThread[dataKey].recipients, function (thread) {
                                var personal = utils.isNotEmptyVal(thread.personal) ? thread.personal : '';
                                var mail_display = utils.isNotEmptyVal(thread.address) ? thread.address : '';
                                self.mailToThread.push({ 'name': personal, 'mailDisplay': mail_display });
                            });
                            self.mailThread[dataKey].mailToThread = self.mailToThread;
                        }

                        // set cc name 
                        if (utils.isNotEmptyVal(self.mailThread[dataKey].cc_recipients)) {
                            _.forEach(self.mailThread[dataKey].cc_recipients, function (thread) {
                                var personal = utils.isNotEmptyVal(thread.personal) ? thread.personal : '';
                                var mail_display = utils.isNotEmptyVal(thread.address) ? thread.address : '';
                                self.mailCcThread.push({ 'name': personal, 'mailDisplay': mail_display });
                            });
                            self.mailThread[dataKey].mailCcThread = self.mailCcThread;
                        }

                        // set Bcc name 
                        if (utils.isNotEmptyVal(self.mailThread[dataKey].bcc_recipients)) {
                            _.forEach(self.mailThread[dataKey].bcc_recipients, function (thread) {
                                var personal = utils.isNotEmptyVal(thread.personal) ? thread.personal : '';
                                var mail_display = utils.isNotEmptyVal(thread.address) ? thread.address : '';
                                self.mailBccThread.push({ 'name': personal, 'mailDisplay': mail_display });
                            });
                            self.mailThread[dataKey].mailBccThread = self.mailBccThread;
                        }
                        if (self.activeTab == 'Draftbox') {
                            composeDraftedMail(self.mailThread[0], self.mailThread[0].files);
                        }
                    });
                }, function (error) {
                    notificationService.error('Unable to retreive mail thread.');
                });
            }
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
            mailboxDataServiceV2.getAllUsers()
                .then(function (data) {
                    self.firmUsers = data.data;
                }, function (error) {
                    notificationService.error('Unable to retreive firm users.');
                });
        }

        /* function to get the sendTo list (UserList+ContactList+ExternalContact) as searched */
        function getSendToList(name) {
            if (name != '') {
                mailboxDataServiceV2.getContactSearched(name)
                    .then(function (data) {
                        self.sendToList = [];
                        var contacts = data.data.contacts

                        _.forEach(contacts, function (dataValue, dataKey) {
                            if (dataValue.email != null && dataValue.email != 'null' && dataValue.email != '') {
                                var emails = dataValue.email.split(',');
                                _.forEach(emails, function (eValue, eKey) {

                                    var addContact = {
                                        personal: dataValue.firstname + " " + dataValue.lastname,
                                        name: dataValue.firstname,
                                        address: eValue,
                                        fullName: dataValue.firstname + ' ' + dataValue.lastname + '<' + eValue + '>'
                                    };

                                    self.sendToList.push(addContact);
                                });
                            }
                        });
                        var emailVal = (/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(name);
                        if (emailVal) {
                            var addContact = { fullName: name, personal: name, address: name };
                            self.sendToList.push(addContact);
                        }

                        _.forEach(self.firmUsers, function (currentItem) {
                            currentItem.fullName = currentItem.name + ' ' + currentItem.lname + '<' + currentItem.mail + '>';
                            currentItem.personal = currentItem.name + ' ' + currentItem.lname;
                            currentItem.address = currentItem.mail;
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
                return matterFactory.searchMatters(matterName).then(
                    function (response) {
                        matters = response.data;
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
                documentsDataService.getDocumentsList(true, matterid, false, '1', self.pageSize, '1', 'asc', '').then(function (data) {
                    _.forEach(data.data, function (item) {
                        item.docmodified_date = (utils.isEmptyVal(item.docmodified_date)) ? "" : moment.unix(item.docmodified_date).format('MM/DD/YYYY');
                    });
                    self.documentsList.data = data.data;
                }, function (reason) {
                    notificationService.error('document list not loaded');
                });
            }

            if (utils.isNotEmptyVal(matterInfo)) {
                self.taggedMatterName = matterInfo.name;
                return matterInfo.name;
            } else {
                return matterInfo;
            }

        }

        /*check all documents selected*/
        function selectAllDocuments(selected) {
            if (selected) {
                self.clxGridOptions.selectedItems = angular.copy(self.documentsList.data);
            } else {
                self.clxGridOptions.selectedItems = [];
            }
        }

        self.isDocEqual = function () {
            if (self.clxGridOptions.selectedItems.length == self.documentsList.data.length) {
                self.clxGridOptions.selectAll = true;
            } else {
                self.clxGridOptions.selectAll = false;
            }
        }
        /**
         * selected documents check in grid
         */
        function isDocSelected(doc) {
            if (self.clxGridOptions != undefined) {
                var ids = _.pluck(self.clxGridOptions.selectedItems, 'documentid');
                return ids.indexOf(doc) > -1;
            }
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
            var doc = Math.round((data / 1024)) + 'kb';
            return doc;
        }

        /**
         * upload file and get size of file
         */
        function getFileSizeNUpload(selectedDocs) {
            self.searchDocs = "";
            getFileSize(selectedDocs, 'matterdoc');
        }

        /**
         * @param {files} selected files size
         * @param {matterdocs} matter document or global document
         */
        function getFileSize(files, matterdoc) {
            var selectedDocId = "[" + _.pluck(files, 'documentid').toString() + "]";
            mailboxDataServiceV2.getdocumentsize(selectedDocId)
                .then(function (response) {
                    self.allDocSize = calculateTotalFileSize(response.data);
                    checkDocFileSize('blobDoc', function (callback) {
                        if (callback) {
                            self.composeEmail.matterdocs = angular.copy(self.clxGridOptions.selectedItems);
                            _.forEach(self.composeEmail.matterdocs, function (parent) {
                                _.forEach(response.data, function (child) {
                                    if (parent.documentid == child.documentid) {
                                        parent.docSize = calFileSize(child.documentsize);
                                        parent.documentsize = child.documentsize;
                                    }
                                });
                            });
                            self.documentTags = [];
                            _.forEach(self.composeEmail.matterdocs, function (currentItem, index) {
                                self.documentTags.push({ value: currentItem.documentname + " " + currentItem.docSize, type: "tagged-matter-document", id: currentItem.documentid, index: index });
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
                return;
            } else {
                if (callback != undefined) {
                    callback(true);
                }
            }
            self.enableSave = true;
            self.matterDocs = false;
        }

        /**
         * open popup model for tagged matter document.
         */
        function openTagMatterDocument(taggedMatter) {
            self.searchDocs = "";
            if (self.composeEmail.matterdocs != undefined) {
                var allDocsSelected = false;
                if (self.documentsList.data.length == self.composeEmail.matterdocs.length) {
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
                if (currentItem && currentItem.documentid == cancelled.id) {
                    self.composeEmail.matterdocs.splice(matterIdx, 1);

                    self.documentTags = [];
                    _.forEach(self.composeEmail.matterdocs, function (currentItem, index) {
                        currentItem.docSize = calFileSize(currentItem.documentsize);
                        self.documentTags.push({ value: currentItem.documentname + " " + currentItem.docSize, type: "tagged-matter-document", id: currentItem.documentid, index: index });
                    });
                }
            });
            var selectedDocsCopy = self.clxGridOptions.selectedItems;
            _.forEach(selectedDocsCopy, function (currentItem, index) {
                if (currentItem && currentItem.documentid == cancelled.id) {
                    self.clxGridOptions.selectedItems.splice(index, 1);
                }
            });
            self.allDocSize = calculateTotalFileSize();
        }

        /* file upload watch */
        $scope.$watch(function () {
            return self.files;
        }, function () {
            if (self.files) {
                upload(self.files);
            }
        });

        $scope.$watch('self.composeMailMsg', function () {
            return self.composeMailMsg;
        }, function () {
            self.composeMailMsg = self.composeMailMsg;
        });

        /* File upload */
        function upload(files) {
            if (files) {
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
                                url: mailboxConstantsV2.addAttachment,
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
            mailboxDataServiceV2.deleteAttachment(data)
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
            self.emailNoteDisabled = true;
            self.composeEmail.matter_id = utils.isEmptyVal(maildata['matter_id']) ? "" : maildata['matter_id'];
            matters = [{ matterid: maildata['matter_id'], name: maildata['matter_name'] }];
            var subjectUnique = utils.isNotEmptyVal(maildata.subject) ? maildata.subject.split('Re:') : "";
            self.composeEmail.subject = utils.isNotEmptyVal(subjectUnique[subjectUnique.length - 1]) ? 'Re: ' + subjectUnique[subjectUnique.length - 1] : "Re: ";
            self.composeEmail.emailNotes = utils.isNotEmptyVal(maildata.email_note) ? maildata.email_note : '0';
            self.composeMailMsg = self.signature;
            self.composeEmail.parent_id = maildata.message_id;
            getRecipients(maildata, replyTo);
        }

        function composeDraftedMail(maildata, attachment) {
            self.composemail = false;
            self.matterDraftID = [];
            self.fileuploaded = [];
            self.draftfiles = [];
            self.compose = true;
            self.composeEmail.emailNotes = (maildata.email_note == '1') ? maildata.email_note : '0';
            self.composeEmail.matter_id = utils.isEmptyVal(maildata.matter_id) ? "" : maildata.matter_id;
            matters = [{ matterid: maildata.matter_id, name: maildata.matter_name }];
            self.composeEmail.subject = maildata.subject;
            self.composeMailMsg = maildata.messagebody;
            self.composeEmail.mail_msg_id = maildata.gmailmessageid;

            _.forEach(maildata.recipients, function (currentItem, index) {
                currentItem.fullName = currentItem.personal + " <" + currentItem.address + ">";
            });
            _.forEach(maildata.cc_recipients, function (currentItem, index) {
                currentItem.fullName = currentItem.personal + " <" + currentItem.address + ">";
            });
            _.forEach(maildata.bcc_recipients, function (currentItem, index) {
                currentItem.fullName = currentItem.personal + " <" + currentItem.address + ">";
            });

            self.composeEmail.recipientsUsers = maildata.recipients;
            self.composeEmail.recipientsUserCc = maildata.cc_recipients;
            self.composeEmail.recipientsUserBcc = maildata.bcc_recipients;

            //getRecipients(maildata, 'all');//US#6141-updated due to change in method defination
            if (attachment.length > 0) {
                _.forEach(attachment, function (dataValue, dataKey) {
                    if (dataValue.matterid == 0) {
                        var attachmentSize = calFileSize(dataValue.size);
                        var documentsId = (utils.isNotEmptyVal(dataValue.gmailattachmentid)) ? dataValue.gmailattachmentid : dataValue.documentid;
                        var filedata = {
                            //docuri: dataValue.uri,
                            docname: dataValue.docname,
                            fileSize: dataValue.size,
                            docSize: attachmentSize,
                            documentid: documentsId
                        }
                        self.fileuploaded.push(filedata);
                        self.composeEmail.file.push(filedata);
                        // self.composeEmail.matter_id = dataValue.matterid;
                        self.documentSize.push({ 'documentsize': filedata.fileSize, 'docName': filedata.docname, 'documentid': filedata.documentid });
                    } else {
                        var attachmentSize = calFileSize(dataValue.fileSize); //if doctype == matterdoc
                        var filedata = {
                            documentname: dataValue.docname,
                            //docuri: dataValue.uri,
                            documentid: documentsId,
                            fileSize: dataValue.fileSize,
                            docSize: attachmentSize
                        }
                        self.matterDraftID.push(filedata);
                        self.composeEmail.matterdocs.push(filedata);
                        // self.composeEmail.matter_id = dataValue.matterid;
                        self.documentSize.push({ 'documentsize': filedata.fileSize, 'docName': filedata.documentname, 'documentid': filedata.documentid });
                        //Bug#6395: Matter name tag issue in draft mail
                        if (utils.isEmptyVal(self.composeEmail.matter_id)) { self.composeEmail.matter_id = "0"; }
                    }
                    // var doc = calFileSize(dataValue.fileSize);
                    var filedata = {
                        //docuri: dataValue.uri,
                        docname: dataValue.docname,
                        documentid: documentsId
                    }
                    self.draftfiles.push(filedata);
                });
            }
        }

        /**
         * change recipients format for to, cc, bcc or and mails
         * @param {mail id format like name<mail>} mails 
         */
        function setRecepientFormat(mails) {
            var formatMails = [];
            var formatmail = "";
            if (mails.constructor === Array) {
                _.forEach(mails, function (currentItem, index) {
                    formatMails.push(currentItem.personal + "<" + currentItem.address + ">");
                });
                return formatMails;
            } else {
                formatmail = mails.personal + "<" + mails.address + ">";
                return formatmail;
            }
        }

        /**
         * get all to, cc, bcc details for reply mail
         * @param {mail information} maildata 
         * @param {reply or reply All} replyTo 
         */
        function getRecipients(maildata, replyTo) {
            var recipientsUsers = [];
            self.emailDocsNote = true;
            var params = {
                sender: setRecepientFormat(maildata.sender),
                recipients: setRecepientFormat(maildata.recipients),
                cc_recipients: setRecepientFormat(maildata.cc_recipients),
                bcc_recipients: setRecepientFormat(maildata.bcc_recipients),
                subject: maildata.subject,
                matter_id: maildata.matter_id,
                gmailthreadid: maildata.gmailthreadid,
                gmailmessageid: maildata.gmailmessageid
            }

            mailboxDataServiceV2.getMailRecipients(params, replyTo)
                .then(function (response) {
                    var mailList = response.data;
                    _.forEach(mailList.recipients, function (currentItem, index) {
                        currentItem.fullName = (currentItem.personal == 'null' || currentItem.personal == null) ? currentItem.address : currentItem.personal + " <" + currentItem.address + ">";
                    });
                    _.forEach(mailList.cc_recipients, function (currentItem, index) {
                        currentItem.fullName = (currentItem.personal == 'null' || currentItem.personal == null) ? currentItem.address : currentItem.personal + " <" + currentItem.address + ">";
                    });
                    _.forEach(mailList.bcc_recipients, function (currentItem, index) {
                        currentItem.fullName = (currentItem.personal == 'null' || currentItem.personal == null) ? currentItem.address : currentItem.personal + " <" + currentItem.address + ">";
                    });
                    self.composeEmail.gmailthreadid = params.gmailthreadid;
                    self.composeEmail.gmailmessageid = params.gmailmessageid;
                    self.composeEmail.recipientsUsers = mailList.recipients;
                    self.composeEmail.recipientsUserCc = mailList.cc_recipients;
                    self.composeEmail.recipientsUserBcc = mailList.bcc_recipients;
                    self.composeEmail.emailNotes = utils.isNotEmptyVal(mailList.email_note) ? mailList.email_note : '0';
                }, function (error) {
                    notificationService.error("Unable to fetch recipients!");
                });
        }

        /**
         * get recipients format
         */
        function getRecipientsFormat(recipients) {
            var recipientsList = [];
            _.forEach(recipients, function (currentItem, index) {
                if (currentItem.name != undefined || currentItem.type != undefined) {
                    if ((utils.isNotEmptyVal(currentItem.personal) && currentItem.personal == "null") || utils.isEmptyVal(currentItem.personal)) {
                        currentItem.personal = currentItem.address;
                    }
                    recipientsList.push(currentItem.personal + "<" + currentItem.address + ">");
                } else {
                    if (currentItem.personal != undefined) {
                        recipientsList.push(currentItem.personal + "<" + currentItem.address + ">");
                    } else {
                        recipientsList.push(currentItem.address);
                    }
                }
            });
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
        /* Send mail */
        function sendMail(draft) {
            $('#navMenu').removeClass('cursor-pointer-events-none');
            var recipientfound = true;
            var recipients = [];
            var ccRecipients = [];
            var bccRecipients = [];
            self.allFiles = [];
            self.composeEmail.recipientsUsers = (self.composeEmail.recipientsUsers == undefined) ? [] : self.composeEmail.recipientsUsers;
            self.composeEmail.recipientsUserCc = (self.composeEmail.recipientsUserCc == undefined) ? [] : self.composeEmail.recipientsUserCc;
            self.composeEmail.recipientsUserBcc = (self.composeEmail.recipientsUserBcc == undefined) ? [] : self.composeEmail.recipientsUserBcc;
            if ((self.composeEmail.recipientsUsers.length == 0 && draft != 'draft') && (self.composeEmail.recipientsUserCc.length == 0 && draft != 'draft') && (self.composeEmail.recipientsUserBcc.length == 0 && draft != 'draft')) {
                recipientfound = false;
                notificationService.error('Recipient Team Members are required to send mail.');
            }
            var email_note = (self.composeEmail.emailNotes == undefined) ? "1" : self.composeEmail.emailNotes;
            if (recipientfound == true) {
                if (draft == 'draft') {
                    var status = 'Draft';
                    //var from = 'draft@gmail.com';
                    var successMsg = "Draft Saved";
                } else {
                    var status = 'Sent';
                    //var from = '';
                    var successMsg = "Your mail has been sent.";
                }

                // var recipientTo = false;
                // _.forEach(self.composeEmail.recipientsUsers, function (currentItem) {
                //     if (utils.isNotEmptyVal(currentItem)) {
                //         if (!recipientTo) {
                //             var recipientId = validateEmail(currentItem.address);
                //             if (recipientId == false) {
                //                 recipientTo = true;
                //             }
                //         }
                //     }
                // });

                // var recipientCc = false;
                // _.forEach(self.composeEmail.recipientsUserCc, function (currentItem) {
                //     if (utils.isNotEmptyVal(currentItem)) {
                //         if (!recipientCc) {
                //             var recipientId = validateEmail(currentItem.address);
                //             if (recipientId == false) {
                //                 recipientCc = true;
                //             }
                //         }
                //     }
                // });

                // var recipientBcc = false;
                // _.forEach(self.composeEmail.recipientsUserBcc, function (currentItem) {
                //     if (utils.isNotEmptyVal(currentItem)) {
                //         if (!recipientBcc) {
                //             var recipientId = validateEmail(currentItem.address);
                //             if (recipientId == false) {
                //                 recipientBcc = true;
                //             }
                //         }
                //     }
                // });
                // if (recipientBcc == true || recipientCc == true || recipientTo == true) {
                //     recipientBcc = recipientBcc == true ? false : recipientBcc;
                //     recipientCc = recipientCc == true ? false : recipientCc;
                //     recipientTo = recipientTo == true ? false : recipientTo;
                //     notificationService.error("Invalid email address");
                //     return;
                // }

                recipients = utils.isNotEmptyVal(self.composeEmail.recipientsUsers) ? getRecipientsFormat(self.composeEmail.recipientsUsers) : ''; // create recipient users
                ccRecipients = utils.isNotEmptyVal(self.composeEmail.recipientsUserCc) ? getRecipientsFormat(self.composeEmail.recipientsUserCc) : ''; // create cc recipients users 
                bccRecipients = utils.isNotEmptyVal(self.composeEmail.recipientsUserBcc) ? getRecipientsFormat(self.composeEmail.recipientsUserBcc) : ''; // create bcc recipients users

                // Getting the document ID in the array from document object
                self.matterDocID = [];
                // if (self.compose) {
                _.forEach(self.composeEmail.matterdocs, function (doc) {
                    self.matterDocID.push(doc.documentid);
                });


                self.matterDocID = _.difference(self.matterDocID, _.pluck(self.matterDraftID, 'documentid'));

                if (self.composemail) {
                    self.draftfiles = [];
                } else if (self.draftfiles.length == 0) {
                    self.draftfiles = [];
                }

                // var i = 0;
                // angular.forEach(self.composeEmail.file, function (val, key) {
                //     angular.forEach(self.draftfiles, function (val1, key1) {
                //         if (val.docuri == val1.docuri) {
                //             self.composeEmail.file[i] = '';
                //         }
                //     });
                //     i++
                // });

                // self.composeEmail.file = _.reject(self.composeEmail.file, function (val) { return val == ''; });

                //fill object according to api call
                _.forEach(self.composeEmail.matterdocs, function (currentItem) {
                    self.matterFiles = {};
                    self.matterFiles.docname = currentItem.documentname;
                    self.matterFiles.documentid = currentItem.documentid;
                    self.matterFiles.docuri = currentItem.docuri;
                    self.allFiles.push(self.matterFiles);
                });
                _.forEach(self.composeEmail.file, function (currentItem) {
                    self.phyUploadFile = {};
                    self.phyUploadFile.docname = currentItem.docname;
                    if (currentItem.docuri != undefined) {
                        self.phyUploadFile.documentid = currentItem.documentid;
                        self.phyUploadFile.docuri = currentItem.docuri;
                    } else {
                        self.phyUploadFile.gmailattachmentid = currentItem.documentid;
                    }
                    self.allFiles.push(self.phyUploadFile);
                });

                // var messageContain = ($rootScope.composeNotesEmail) ? $rootScope.composeNotesEmail : self.composeMailMsg;
                var data = {
                    recipients: recipients,
                    cc_recipients: ccRecipients,
                    bcc_recipients: bccRecipients,
                    subject: self.composeEmail.subject,
                    matter_id: (self.composeEmail.matter_id == "0") ? "" : self.composeEmail.matter_id,
                    messagebody: self.composeMailMsg,
                    gmailthreadid: self.composeEmail.gmailthreadid,
                    gmailmessageid: self.composeEmail.gmailmessageid,
                    //plainmessage: '',
                    //parent_id: parent_id,
                    status: status,
                    // type: status,
                    // from_user: from,
                    // mail_msg_id: self.composeEmail.mail_msg_id,
                    files: self.allFiles,
                    //matterdocs: self.matterDocID,
                    //  new_files: self.composeEmail.file,
                    email_note: email_note
                };
                if (recipients.length == 0) {
                    delete data['recipients'];
                }

                if (ccRecipients.length == 0) {
                    delete data['cc_recipients'];
                }

                if (bccRecipients.length == 0) {
                    delete data['bcc_recipients'];
                }
                // _.forEach(data.recipients, function (mail) {
                //     if (utils.isEmptyVal(mail.uid)) {
                //         mail.uid = "0";
                //     }
                // })
                mailboxDataServiceV2.sendMail(data)
                    .then(function (data) {
                        notificationService.success(successMsg);
                        // if(draft == "draftMailSend") {
                        //     var params = [self.composeEmail.gmailmessageid];
                        //     mailboxDataServiceV2.deleteMails(params, 2)
                        //         .then(function(success) {
                        //             // TODO do something
                        //         }, function(error){
                        //             notificationService.error("Unable to delete draft!");
                        //         });
                        // }
                        if (draft == 'draft') {
                            toggleTab('Draftbox');
                        } else {
                            toggleTab('Sentbox');
                        }
                        closeCompose();
                    }, function (error) {
                        self.allFiles = [];
                        notificationService.error('Unable to process mail.');
                    });
            }
        }

        /* Close compose and clear all data*/
        function closeCompose() {
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
        }

        /* Download document*/
        function downloadAttachment(attId, msgId) {
            mailboxDataServiceV2.downloadFile(msgId, attId.gmailattachmentid, attId.docname);
        }

        /*Get email signature if user*/
        function getUserEmailSignaure() {
            mailboxDataServiceV2.emailSignature()
                .then(function (data) {
                    if (utils.isNotEmptyVal(data.data)) {
                        self.signature = data.data[0];
                        self.signature = '<br/><br/>' + self.signature;
                    }
                    self.enableCompose = true;
                }, function (error) {
                    self.enableCompose = true;
                });
        }
    }
})();

/**
 * mailbox helper 
 */
(function () {
    angular.module('cloudlex.mailbox')
        .factory('mailboxHelperV2', mailboxHelperV2);

    function mailboxHelperV2() {
        return {
            getDefinedArray: getDefinedArray,
            isMailSelected: isMailSelected,
            isDocumentSelected: isDocumentSelected
        }

        function isDocumentSelected(documentList, doc) {
            var ids = _.pluck(documentList, 'documentid');
            return ids.indexOf(doc.documentid) > -1;
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
            var ids = (currentTab == 'Inbox') ? _.pluck(mailList, 'gmailmessageid') : _.pluck(mailList, 'gmailmessageid');
            return (currentTab == 'Inbox') ? (ids.indexOf(mail.gmailmessageid) > -1) : (ids.indexOf(mail.gmailmessageid) > -1);
        }
    }
})();
