/* fax controller*/
(function () {

    'use strict';

    angular
        .module('cloudlex.efax')
        .controller('efaxController', efaxController);

    efaxController.$inject = ['$rootScope', '$timeout', '$scope', 'Upload', 'efaxDataService', 'documentsDataService', 'notification-service',
        'efaxHelper', 'matterFactory', 'efaxConstants', 'masterData', 'profileDataLayer', 'globalConstants', 'contactFactory', 'mailboxHelper'
    ];

    function efaxController($rootScope, $timeout, $scope, Upload, efaxDataService, documentsDataService, notificationService,
        efaxHelper, matterFactory, efaxConstants, masterData, profileDataLayer, globalConstants, contactFactory, mailboxHelper) {
        var self = this;
        var listvars = efaxHelper.getDefinedArray();
        var matters = [];

        self.pageSize = 250;
        self.getNextLimitFax = getNextLimitFax;
        self.filterRetain = filterRetain;
        self.getFaxthread = getFaxthread;
        self.getUsers = getUsers;
        self.getSendToList = getSendToList;
        self.searchMatters = searchMatters;
        self.formatTypeaheadDisplay = formatTypeaheadDisplay;
        self.cancleAttachment = cancleAttachment;
        // self.canclematterdoc = canclematterdoc;
        self.sendMail = sendMail;
        self.closeCompose = closeCompose;
        self.downloadAttachment = downloadAttachment;
        self.signature = '';
        self.documentsList = {};
        self.documentCategories = {};
        self.categories = [];
        self.groupMatterDoc = groupMatterDoc;
        self.matterdoc = '';
        self.enableCompose = true;
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
        self.getFileSize = getFileSize;
        self.getFileSizeNUpload = getFileSizeNUpload;
        self.isDocSelected = isDocSelected;
        self.allDocSize = 0;
        self.matterDocs = false;
        self.tagCancelled = tagCancelled;
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.getFromUser = getFromUser;
        self.openTagMatterDocument = openTagMatterDocument;
        self.selectAllDocuments = selectAllDocuments;
        localStorage.setItem('notificationError', "false");
        self.setSelectedDoc = setSelectedDoc;
        self.resetPage = resetPage;
        self.disabledSidebarIcon = disabledSidebarIcon;

        (function () {
            init();
            getSentList();
            getUsers();
            getFromUser();
            getDocCategories();
            getfiltertext();
            var filtertext = localStorage.getItem("faxSearchText");
            if (utils.isNotEmptyVal(filtertext)) {
                self.showSearch = true;
            }

        })();

        function resetPage() {
            init();
            searchReset();
            getSentList();
            getUsers();
            getFromUser();
            getDocCategories();
        }

        function setSelectedDoc(selectedDocuments) {
            //US#8023 get file size
            if (utils.isNotEmptyVal(selectedDocuments)) {
                self.clxGridOptions = {
                    selectedItems: selectedDocuments,
                    selectAll: false
                };
                getFileSize(selectedDocuments);
            }
        }

        function disabledSidebarIcon() {
            $('#navMenu').addClass('cursor-pointer-events-none');
        }

        //efax call from documents
        $rootScope.updateComposeEfaxMsgBody = function (composeEmail, matter_id, documentList, selectedDocuments, contactFrom, contactData) {
            self.allDocSize = 0;
            self.composeMailMsg = composeEmail;
            self.matterDocs = false;
            if (contactFrom == 'contactEmail') {
                self.sendToList = [];
                self.composeEmail.recipientsUsers = [];
                var emailId = [];
                emailId = contactData.email.split(',');
                _.forEach(emailId, function (eValue, eKey) {
                    var addContactData = {
                        uid: contactData.contactid,
                        name: contactData.firstname,
                        lname: contactData.lastname,
                        mail: eValue,
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
                setSelectedDoc(selectedDocuments);
            } else {
                self.documentsList.data = documentList;
                self.composeEmail.matter_id = matter_id;
                setSelectedDoc(selectedDocuments);
            }
        }

        function getFromUser() {
            var response = profileDataLayer.getViewProfileData();
            response.then(function (data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    self.composeEmail.fromEmail = data[0].email;

                }
            });
        }


        function searchReset() {
            self.filterText = '';
            var filtertext = localStorage.setItem("faxSearchText", self.filterText);
            self.showSearch = false;
        }

        function init() {
            getUserEmailSignaure();
            self.composeFax = false;
            self.sentBoxList = angular.copy(listvars['sentBoxList']);
            self.mailThread = [];
            self.mailThreadAttachment = [];

            /* Compose email variable*/
            self.composeEmail = {
                recipientsUsers: [],
                matterdocs: [],
                subject: '[Cloudlex] -',
                matter_id: '',
                message: '',
                parent_id: 0,
                mail_msg_id: '',
                file: [],
                new_files: [],
            };
            self.files = [];
            self.firmUsers = [];
            self.contactList = [];
            self.sendToList = [];
            self.enableSave = true;
            self.documentSize = [];
        }

        function getfiltertext() {
            var filtertext = localStorage.getItem("faxSearchText");
            if (utils.isNotEmptyVal(filtertext)) {
                self.filterText = filtertext;
            }
        }


        /**
         * open popup model for tagged matter document.
         */
        function openTagMatterDocument(taggedMatter) {
            self.selectedItemsCopy = angular.copy(self.clxGridOptions.selectedItems);
            self.searchDocs = "";
            if (self.composeEmail.matterdocs != undefined) {
                var allDocsSelected = false;
                if (self.documentsList.data.length == self.composeEmail.matterdocs.length && self.documentsList.data.length != 0) {
                    allDocsSelected = true;
                }
                self.clxGridOptions.selectAll = allDocsSelected;
                // self.clxGridOptions = {
                //     selectedItems: self.composeEmail.matterdocs,
                //     selectAll: allDocsSelected
                // }
            }
            self.matterDocs = true;

        }


        /* Get the sent mails list */
        function getSentList(filtered) {
            var promese = efaxDataService.getSentList(self.sentBoxList.pageNum, self.sentBoxList.pageSize);
            promese.then(function (data) {
                if (!filtered) {
                    self.sentBoxList.data = [];
                };
                _.forEach(data.data.fax, function (item) {
                    self.sentBoxList.data.push(item);
                });
                // sort sent list in desc manner (last fax first)
                self.sentBoxList.data = _.sortBy(self.sentBoxList.data, 'createdOn').reverse();

                self.sentBoxList.count = self.sentBoxList.data.length;
                self.sentBoxList.totallength = data.data.faxcount;

            }, function (reason) {
                //notificationService.error('fax list not loaded.');
            });
        }


        /*Get more Documenets*/
        function getNextLimitFax(all) {
            self.sentBoxList.pageNum = parseInt(self.sentBoxList.pageNum) + parseInt(1);
            if (all == 'all') {
                self.sentBoxList.allmails = true;
            }
            getSentList(true);
        }

        //function for  retaintion of search field
        function filterRetain() {
            var filtertext = self.filterText;
            localStorage.setItem("faxSearchText", filtertext);
        }

        function getFaxthread(msgid, index) {
            self.mailThread = [];
            var promesReturned = efaxDataService.getFaxthread(msgid);
            promesReturned.then(function (data) {
                self.mailThread.push(data.data);
                self.mailThreadAttachment = [];
                self.mailToThread = [];

                if (data.data.hasAttachment) {
                    self.mailThreadAttachment = data.data.attachments;
                }


            }, function (error) {
                notificationService.error('Unable to retreive fax thread.');
            });
        }




        /* Funtion to get the all firm users */
        function getUsers() {
            efaxDataService.getAllUsers()
                .then(function (data) {
                    self.firmUsers = data.data;
                }, function (error) {
                    notificationService.error('Unable to retreive firm users.');
                });
        }


        function getSendToList(name) {
            if (name != '') {

                var postObj = {};
                postObj.type = globalConstants.allTypeList;
                postObj.first_name = utils.isNotEmptyVal(name) ? name : '';
                //postObj = matterFactory.setContactType(postObj);
                postObj.page_Size = 250

                // self.sendToList.push(name);
                efaxDataService.getContactSearched(postObj)
                    .then(function (data) {
                        self.sendToList = [];
                        var contacts = data.data;
                        contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(contacts);
                        contactFactory.setNamePropForContactsOffDrupal(contacts);


                        _.forEach(contacts, function (dataValue, dataKey) {
                            dataValue['email'] = utils.isNotEmptyVal(dataValue.email_ids) ? dataValue.email_ids : '';

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
                            var addContact = {
                                uid: 0,
                                role: 'External',
                                firstLastname: name,
                                name: name,
                                mail: name
                            };
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




        function searchMatters(matterName, matterID, selectedDocuments) {
            if (matterName) {
                return matterFactory.searchMatters(matterName).then(
                    function (response) {
                        matters = response.data;
                        self.matterSearched = true;
                        if (utils.isNotEmptyVal(matterID)) {
                            self.composeEmail.matter_id = matterID;
                            formatTypeaheadDisplay(matterID);
                            self.composeEmail.matterdocs = selectedDocuments;
                        }
                        return response.data;
                    },
                    function (error) {
                        notificationService.error('Matters not loaded');
                    });
            }
        }

        /**
         * tag document cancel
         */
        function tagCancelled(cancelled) {
            var matterDocsCopy = angular.copy(self.composeEmail.matterdocs);
            _.forEach(matterDocsCopy, function (currentItem, matterIdx) {
                if (currentItem && currentItem.doc_id == cancelled.id) {
                    self.composeEmail.matterdocs.splice(matterIdx, 1);
                    self.documentSize.splice(matterIdx, 1);
                    self.documentTags = [];
                    _.forEach(self.composeEmail.matterdocs, function (currentItem, index) {
                        self.documentTags.push({
                            value: currentItem.doc_name + " " + currentItem.docSize,
                            type: "tagged-matter-document",
                            id: currentItem.doc_id,
                            index: index
                        });
                    });
                }
            });

            var selectedDocsCopy = self.clxGridOptions.selectedItems;
            _.forEach(selectedDocsCopy, function (currentItem, index) {
                if (currentItem && currentItem.doc_id == cancelled.id) {
                    self.clxGridOptions.selectedItems.splice(index, 1);
                }
            });
            self.allDocSize = calculateTotalFileSize();
            self.clxGridOptions.selectAll = false;
            $rootScope.$emit("selectionChanged", self.clxGridOptions.selectedItems, self.matterChanged != true);

        }

        /* Formate the matter id and name in case of global documents*/
        function formatTypeaheadDisplay(matterid) {
            self.documentTags = [];
            self.composeEmail.matterdocs = [];
            self.clxGridOptions = {
                selectedItems: [],
                selectAll: false
            };

            if (matterid == null || matterid == 'null') {
                _.forEach(self.documentSize, function (data, index) {
                    _.forEach(self.composeEmail.matterdocs, function (item) {
                        if (data.docName == item.documentname) {
                            self.documentSize.splice(index, 1);
                        }
                    })
                })
                self.documentsList.data = '';
                return undefined;
            }
            if (angular.isUndefined(matterid) || utils.isEmptyString(matterid)) {
                _.forEach(self.documentSize, function (data, index) {
                    _.forEach(self.composeEmail.matterdocs, function (item) {
                        if (data.docName == item.documentname) {
                            self.documentSize.splice(index, 1);
                        }
                    })
                })
                self.documentsList.data = '';
                return undefined;
            }
            var matterInfo = _.find(matters, function (matter) {
                return matter.matterid === matterid;
            });
            if (utils.isNotEmptyVal(matterid) && matterid != "0") {
                documentsDataService.getDocumentsList(false, matterid, true, '1', self.pageSize, '5', '', '').then(function (data) {
                    // _.forEach(data.documents, function (item) {
                    //     item.docmodified_date = (utils.isEmptyVal(item.docmodified_date)) ? "" : moment.unix(item.docmodified_date).format('MM/DD/YYYY');
                    // });

                    self.documentsList.data = data.documents;
                    if (self.matterSearched == true) {
                        self.matterChanged = true;
                    } else {
                        self.matterChanged = false;
                    }
                }, function (reason) {
                    notificationService.error('document list not loaded');
                });
            }
            if (utils.isNotEmptyVal(matterInfo)) {

                self.documentSize = [];
                self.taggedMatterName = matterInfo.name;
                return matterInfo.name;
            } else {
                return matterInfo;
            }

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
            if (self.selectedItemsCopy.length == self.documentsList.data.length) {
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
                var ids = _.pluck(self.selectedItemsCopy, 'doc_id');
                return ids.indexOf(doc) > -1;
            }
        }

        function getDocCategories() {
            documentsDataService.getDocumentCategories()
                .then(function (response) {
                    self.documentCategories = response;
                    _.forEach(self.documentCategories, function (category) {
                        self.categories.push(category.Name);
                    })
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

        function checkDocFileSize(docType, callback) {
            self.enableSave = true;
            self.removeDocProgress = false;
            if (self.allDocSize > 19000000) {
                if (docType == 'phyUpload') {
                    self.composeEmail.file.splice(self.composeEmail.file.length - 1, 1);
                } else {
                    self.clxGridOptions.selectedItems.splice(self.clxGridOptions.selectedItems.length - 1, 1);
                }
                notificationService.error("The attachment size exceeds the allowable limit of 19 MB");
                self.allDocSize = calculateTotalFileSize();
            } else {
                if (callback != undefined) {
                    callback(true);
                }
            }
            self.enableSave = true;
            self.matterDocs = false;
        }

        /**
         * upload file and get size of file
         */
        function getFileSizeNUpload(selectedDocs) {
            $rootScope.$emit("selectionChanged", selectedDocs, self.matterChanged != true);
            self.clxGridOptions.selectedItems = angular.copy(selectedDocs);
            getFileSize(selectedDocs, 'matterdoc');
        }

        function getFileSize(files, matterdoc) {
            var selectedItem = self.clxGridOptions.selectedItems;
            var selectedDocId = "[" + _.pluck(files, 'doc_id').toString() + "]";
            efaxDataService.getdocumentsize(selectedDocId)
                .then(function (response) {
                    self.clxGridOptions.selectedItems = selectedItem;
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


        function checkFileSize(data, docType, callback) {
            self.removeDocProgress = false;
            size = 0;
            var file = angular.copy(data);
            _.forEach(file, function (item) {
                size += item;
            });
            if (size > 19000000) {
                // if (docType == 'blobDoc') {
                //     //     self.composeEmail.matterdocs.splice(self.composeEmail.matterdocs.length - 1, 1);
                // } else if (docType == 'phyUpload') {
                //     //     self.removeDocProgress = true;
                //     self.composeEmail.file.splice(self.composeEmail.file.length - 1, 1);
                //     self.documentSize.splice(self.documentSize.length - 1, 1);
                // }

                notificationService.error("The attachment size exceeds the allowable limit of 19 MB");
                return;
            } else {
                self.matterDocs = false;
                if (callback != undefined) {
                    callback(true);
                }
            }
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
                                url: efaxConstants.addAttachment1,
                                transformRequest: angular.identity,
                                headers: {
                                    'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                                    'Content-Type': undefined
                                },
                                file: file,
                            }).progress(function (evt) {
                                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                                self.composeEmail.file[fileIndex].fileProgress = progressPercentage;

                            }).success(function (data, status, headers, config) {
                                $timeout(function () {
                                    self.enableSave = true;
                                    if (utils.isNotEmptyVal(data)) {
                                        self.composeEmail.file[fileIndex].docuri = data.docUri;
                                        delete self.composeEmail.file[fileIndex].fileProgress;
                                    } else {
                                        self.allDocSize = calculateTotalFileSize();
                                        self.composeEmail.file.splice(fileIndex, 1);
                                        notificationService.error('File not attached. Please try again.');
                                    }
                                });
                            }).error(function (data, status, headers, config) {
                                self.enableSave = true;
                                self.allDocSize = calculateTotalFileSize();
                                self.composeEmail.file.splice(fileIndex, 1);
                                notificationService.error('File not attached!');
                            });
                        }
                    });
                    self.enableSave = true;
                });
            }
        }

        /* Remove the matter doc attached */
        // function canclematterdoc(item) {
        //     var documentCancelId = '[' + item.documentid + ']';
        //     var index = _.findIndex(self.matterDraftID, {
        //         docuri: item.docuri
        //     })
        //     //US#7824 to get file size of cancel document   
        //     efaxDataService.getdocumentsize(documentCancelId)
        //         .then(function (response) {
        //             self.cancelDocSize = response.data;

        //             self.matterDraftID[index] = '';
        //             self.matterDraftID = _.reject(self.matterDraftID, function (val) {
        //                 return val == '';
        //             });
        //             index = _.findIndex(self.draftfiles, {
        //                 docuri: item.docuri
        //             })
        //             self.draftfiles[index] = '';
        //             self.draftfiles = _.reject(self.draftfiles, function (val) {
        //                 return val == '';
        //             });

        //             self.cancelDocSize[0] = utils.isEmptyVal(self.cancelDocSize[0]) ? 0 : self.cancelDocSize[0];
        //             size = size - parseInt(self.cancelDocSize[0].documentsize);
        //             var documentSizeFilter = false;
        //             _.forEach(self.documentSize, function (item, index) {
        //                 if (!documentSizeFilter) {
        //                     if (item.documentid == self.cancelDocSize[0].documentid) {
        //                         self.documentSize.splice(index, 1);
        //                         documentSizeFilter = true;
        //                     }
        //                 }
        //             });
        //         });
        // }


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
            // efaxDataService.deleteAttachment(data)
            //     .then(function (data) {
            //         // self.composeEmail.file.splice(index, 1);
            //         //self.documentSize.splice(index, 1);
            //     });
        }




        function getRecipients(maildata, replyTo) {
            var recipientsUsers = [];
            self.emailDocsNote = true;
            efaxDataService.getRecipients(maildata.message_id, replyTo)
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



                });
        }


        function setRecepientsUsers(reply, recepients, mailInfo) {
            createRecepientsTo(recepients);
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

                    recipientsList.push(dataValue.mail);
                });
            }
            return recipientsList;
        }


        function checkEmailAddress(data) {
            self.invalidMail = false;
            _.forEach(data, function (d) {
                var mailID = ((d.mail).substr(0, ((d.mail).indexOf('@'))));
                if (/^\d+$/.test(mailID)) {
                    self.invalidMail = true;
                }
            });
            return self.invalidMail;
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



        function sendMail() {
            var recipientfound = true;
            //US#9302
            if (utils.isEmptyVal(self.composeEmail.subject)) {
                notificationService.error('Subject should not be blank.');
                return;
            }
            if (utils.isEmptyVal(self.composeMailMsg)) {
                notificationService.error('Message body should not be blank.');
                return;
            }

            self.composeEmail.recipientsUsers = (self.composeEmail.recipientsUsers == undefined) ? [] : self.composeEmail.recipientsUsers;
            if (self.composeEmail.recipientsUsers.length == 0) {
                recipientfound = false;
                notificationService.error('Recipient Team Members are required to send fax.');
                return false;
            }

            sendFax();
            // if (checkEmailAddress(self.composeEmail.recipientsUsers)) {
            //     var modalOptions = {
            //         closeButtonText: 'No',
            //         actionButtonText: 'Yes',
            //         headerText: 'Confirmation',
            //         bodyText: 'This email seems to be incorrect. Do you still want to send this email?'
            //     };

            //     //confirm before Procced
            //     modalService.showModal({}, modalOptions).then(function () {
            //         sendFax();
            //     });
            // } else {
            //     sendFax();
            // }


        }

        function sendFax() {
            $('#navMenu').removeClass('cursor-pointer-events-none');
            var recipients = [];
            var recipientTo = false;
            _.forEach(self.composeEmail.recipientsUsers, function (currentItem) {
                if (utils.isNotEmptyVal(currentItem)) {
                    if (!recipientTo) {
                        var recipientId = validateEmail(currentItem.mail);
                        if (recipientId == false) {
                            recipientTo = true;
                        }
                    }
                }
            });

            if (recipientTo == true) {
                recipientTo = recipientTo == true ? false : recipientTo;
                notificationService.error("Invalid email address");
                return;
            }

            recipients = utils.isNotEmptyVal(self.composeEmail.recipientsUsers) ? getRecipientsFormat(self.composeEmail.recipientsUsers) : ''; // create recipient users
            self.matterDocID = [];

            _.forEach(self.composeEmail.matterdocs, function (doc) {
                self.matterDocID.push(doc.doc_id);
            });
            self.matterDocID = _.difference(self.matterDocID, _.pluck(self.matterDraftID, 'doc_id'));

            self.composeEmail.file = _.reject(self.composeEmail.file, function (val) {
                return val == '';
            });

            var attachmentsVar = [];
            _.forEach(self.composeEmail.file, function (item) {
                var obj = {
                    "fileSize": item.fileSize,
                    "docName": item.docname,
                    "docUri": item.docuri
                }

                attachmentsVar.push(obj);
            });
            _.forEach(self.composeEmail.matterdocs, function (item) {
                var obj1 = {
                    "fileSize": item.documentsize,
                    "docName": item.doc_name,
                    "documentId": parseInt(item.doc_id)
                }

                attachmentsVar.push(obj1);
            });
            var data = {
                recipients: recipients,
                from: self.composeEmail.fromEmail,
                subject: self.composeEmail.subject,
                matterId: (self.composeEmail.matter_id == "0") || (utils.isEmptyVal(self.composeEmail.matter_id)) ? '0' : self.composeEmail.matter_id,
                body: self.composeMailMsg,
                attachments: attachmentsVar
            };

            efaxDataService.sendMail(data)
                .then(function (data) {
                    notificationService.success("Your fax sent successfully");
                    self.sentBoxList.pageNum = 1;
                    self.sentBoxList.pageSize = 50;
                    getSentList();
                    closeCompose();
                }, function (error) {
                    notificationService.error('Unable to process fax.');
                });
        }



        function closeCompose() {
            self.composeEmail = {
                recipientsUsers: [],
                matterdocs: [],
                recipientsContacts: [],
                subject: '[Cloudlex] -',
                matter_id: '',
                message: '',
                parent_id: 0,
                mail_msg_id: '',
                file: [],
            };
            self.documentSize = []; //empty file size array
            self.fileName = '';
            self.fileProgress = '';
            self.composeFax = false;
            self.composemail = true;
            self.composeEmail.matter_id = "";
            self.clxGridOptions = {
                selectedItems: [],
                selectAll: false
            };
            self.documentTags = [];
            getFromUser();
            $rootScope.$emit("callCloseEfaxMail", {});
            self.allDocSize = 0;
            // $rootScope.$emit("callCloseComposeMail", {});
            $('#navMenu').removeClass('cursor-pointer-events-none');
        }

        /* Download document*/
        function downloadAttachment(attId) {
            efaxDataService.downloadFile(attId);
        }

        /*Get email signature if user*/
        function getUserEmailSignaure() {
            efaxDataService.emailSignature()
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

(function () {
    angular.module('cloudlex.efax')
        .factory('efaxHelper', efaxHelper);

    function efaxHelper() {
        return {
            getDefinedArray: getDefinedArray,
        }

        function getDefinedArray() {
            var arrayRet = [];
            arrayRet['sentBoxList'] = {
                data: [],
                count: 0,
                totallength: 0,
                pageNum: 1,
                pageSize: 50,
                allmails: false,
                MailSelected: {},

            };

            return arrayRet;
        }

    }
})();