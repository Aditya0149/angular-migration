
(function () {

    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('MatterCollaborationNotesCtrl', MatterCollaborationNotesController);

    MatterCollaborationNotesController.$inject = ['$scope', '$filter', '$timeout', 'notesDataService', '$stateParams', '$modal', 'mailboxDataService', 'modalService',
        'notification-service', 'matterFactory', 'matterNotesHelper', '$rootScope', 'masterData', 'globalConstants', 'practiceAndBillingDataLayer', 'contactFactory'];

    function MatterCollaborationNotesController($scope, $filter, $timeout, notesDataService, $stateParams, $modal, mailboxDataService, modalService,
        notificationService, matterFactory, matterNotesHelper, $rootScope, masterData, globalConstants, practiceAndBillingDataLayer, contactFactory) {

        var self = this;
        self.matterId = $stateParams.matterId;

        self.reloadEmail = false;
        var matterId = $stateParams.matterId;
        self.allNoteselected = allNoteselected;
        self.selectAllNotes = selectAllNotes;
        self.isNotesSelected = isNotesSelected;
        self.noteDescription = [];
        self.notesList = [];  //Data model for holding list of matter notes        
        self.noteToBeAdded = {
            text: undefined,
            noteCategory: {
                notecategory_id: ''
            }
        };  //Data model for holding new note details
        self.currentView = utils.isNotEmptyVal(sessionStorage.getItem("matter-note-grid-view")) ? sessionStorage.getItem("matter-note-grid-view") : "LIST";
        self.notesCategories = [];
        self.users = [];
        //self.printSelectedNotes = []; // object for printing selected notes
        self.isCollapsed = true;
        self.serachInput = "";
        self.selectedFilters = {};
        self.noData = true;
        self.currentDateFilter = {};
        self.matterinfo = {};
        self.isDataAvailable = false;
        self.sidebarForCategories = { "notecategory_id": "1002", "category_name": "sidebar" };
        var allMatterNoteSelected = false;
        self.printMatterNotes = printMatterNotes;
        self.exportMatterNotes = exportMatterNotes;
        self.tagCancelled = tagCancelled;
        self.filterRetain = filterRetain;
        self.composeNotesMail = composeNotesMail;
        self.isUser = true;
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.email_subscription = gracePeriodDetails.email_subscription;  // role email subscription
        self.firmData = { API: "PHP", state: "mailbox" };
        self.composeNotesFromView = composeNotesFromView;
        /**
         * firm basis module setting 
         */
        self.firmData = JSON.parse(localStorage.getItem('firmSetting'));

        self.contactList1 = [];
        self.getLinkContact = getLinkContact;
        notesDataService.customPageNum = 1;

        function getLinkContact(name) {
            if (utils.isNotEmptyVal(name)) {

                var postObj = {};
                postObj.type = globalConstants.allTypeList;
                postObj.first_name = utils.isNotEmptyVal(name) ? name : '';
                postObj.page_Size = 250

                matterFactory.getContactsByName(postObj, true)
                    .then(function (response) {
                        var data = response.data;
                        self.contactList1 = [];
                        var allData = [];
                        contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
                        contactFactory.setNamePropForContactsOffDrupal(data);
                        var allLinkedContactId = _.pluck(self.noteToBeAdded.linked_contact, 'contact_id');
                        var responseData = angular.copy(data);
                        _.forEach(responseData, function (item, index) {
                            _.forEach(allLinkedContactId, function (it) {
                                if (item.contact_id == it) {
                                    data.splice(index, 1);
                                }
                            })
                        })
                        allData = data;
                        _.forEach(allData, function (item) {
                            if (item.contact_type != "Global") {
                                self.contactList1.push(item);
                            }
                        });

                        if (utils.isNotEmptyVal(self.contactList1)) {
                            self.contactList1 = _.uniq(self.contactList1, function (item) {
                                return item.contactid;
                            });
                        }
                    });

            } else {
                self.contactList1 = [];
            }
        }

        var lengthHold;
        (function () {

            displayWorkflowIcon();

            self.notesGrid = {
                headers: [],
                selectedItems: []
            }

            self.display = {
                filtered: true,
                noteListReceived: false,
                noteSelected: {}
            };

            //Get notes and categories
            //matterFactory.setBreadcrum(self.matterId, 'Notes');
            // matterFactory.setBreadcrumWithPromise(self.matterId, 'Notes').then(function (resultData) {
            //     self.matterInfo = resultData;
            // });
            // $rootScope.retainFilters.matterID = self.matterId;
            // sessionStorage.setItem("retainFilters", JSON.stringify($rootScope.retainFilters));
            //set persisted filters
            var persistedFilter = sessionStorage.getItem("matterNotesFilters");
            var dateFilter = sessionStorage.getItem("matterNotesDateFilter");
            var retainsFilter = JSON.parse(sessionStorage.getItem("retainFilters"));
            if (utils.isNotEmptyVal(retainsFilter)) {
                if (self.matterId == retainsFilter.matterID) {
                    if (utils.isNotEmptyVal(persistedFilter)) {
                        try {
                            self.selectedFilters = JSON.parse(persistedFilter);
                            self.currentDateFilter = dateFilter;
                        } catch (e) {
                            self.selectedFilters = {};
                        }
                    } else {
                        self.selectedFilters = {};
                    }
                }
            }

            var retainSText = JSON.parse(sessionStorage.getItem("retainSearchTextForNoteCollaboration"));
            if (self.serachInput != '') {
                if (utils.isNotEmptyVal(retainSText)) {
                    if (self.matterId == retainSText.matterid) {
                        self.serachInput = retainSText.notesFiltertext;
                    }
                }
            }
            getNoteCategories();
            matterInfo();
            getUserEmailSignature(); // make user signature for email
            self.matterInfo = matterFactory.getMatterData(self.matterId);

        })();

        self.openContactCard = function (contact) {
            contactFactory.displayContactCard1(contact.contact_id, contact.edited, contact.contact_type);
            contact.edited = false;
        };

        function displayWorkflowIcon() {
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                var resData = data.matter_apps;                                   //promise
                if (angular.isDefined(resData) && resData != '' && resData != ' ') {
                    self.is_workflow = (resData.workflow == 1) ? true : false;
                }
            });
        }

        $rootScope.$on('updateWorkflowIcons', function (updateworkflowIconevent) {
            displayWorkflowIcon();
        });

        var permissions = masterData.getPermissions();
        self.notesPermissions = _.filter(permissions[0].permissions, function (per) {
            if (per.entity_id == '5') {
                return per;
            }
        });

        function setGridHeight() {
            $timeout(function () {
                if (self.currentView == "GRID") {
                    var heightForGrid = ($("#moreLink").offset().top - $("#gridViewNotes").offset().top);
                    heightForGrid = heightForGrid - $("#moreLink").height();
                    $('#gridViewNotes').css("max-height", heightForGrid + "px");
                }
            }, 100);
        }

        // select all matter notes
        function selectAllNotes(isSelected) {
            if (isSelected === true) {
                self.notesGrid.selectedItems = angular.copy(self.notesList);
                // self.notesGrid.selectedItems = _.filter(self.notesList, function(key){
                //     return (key.type != "email" && key.type != "sidebar");
                // });   
                // lengthHold = self.notesGrid.selectedItems.length;
                //allMatterNoteSelected = true;
            } else {
                self.notesGrid.selectedItems = [];
            }
        }


        // select manual matter notes
        function isNotesSelected(noteId) {
            var noteIds = _.pluck(self.notesGrid.selectedItems, 'note_id');
            if (self.notesGrid.selectedItems.length < lengthHold && allMatterNoteSelected == true) {
                self.notesGrid.selectAll = false;
                allMatterNoteSelected = false;
            }
            self.display.noteSelected[noteId] = noteIds.indexOf(noteId) > -1;
            return noteIds.indexOf(noteId) > -1;
        }

        // Check whether all matter notes selected
        function allNoteselected() {
            if (utils.isEmptyVal(self.notesList)) {
                return false;
            }
            return self.notesGrid.selectedItems.length === self.notesList.length;
        }



        // //US#8330
        $scope.$on('composeEmailFromContact', function (event, data) {
            if (!(window.isDrawerOpen)) {
                self.compose = true;
                var html = "";
                html += (self.signature == undefined) ? '' : self.signature;
                self.composeEmail = html;
                $rootScope.updateComposeMailMsgBody(self.composeEmail, '', '', '', 'contactEmail', data);
            }

        });


        // compose mail with selected notes
        function composeNotesMail() {


            var printSelectedMatterNotes = [];
            // push selected note id into object   
            _.forEach(self.notesGrid.selectedItems, function (key) {
                printSelectedMatterNotes.push(_.filter(self.notesList, function (note) {
                    return note.note_id == key.note_id;
                }));
            });
            var html = "";
            html += '<table style="border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:10pt; margin-top:10px; width:100%" cellspacing="0" cellpadding="0" border="0"><thead><tr>';
            html += '<tbody>';
            angular.forEach(printSelectedMatterNotes, function (notes) {
                angular.forEach(notes, function (note) {
                    note.text = _.isNull(note.text) ? '' : note.text;
                    note.fname = utils.isNotEmptyVal(note.user.first_name) ? note.user.first_name : '';
                    note.lname = utils.isNotEmptyVal(note.user.last_name) ? note.user.last_name : '';

                    // Linkedcontact on Email compose body
                    note.linkcontactfname = _.pluck(note.linked_contact, 'first_name');
                    note.linkcontactlname = _.pluck(note.linked_contact, 'last_name');
                    note.linkfname = utils.isNotEmptyVal(note.linkcontactfname) ? note.linkcontactfname : '';
                    note.linklname = utils.isNotEmptyVal(note.linkcontactlname) ? note.linkcontactlname : '';
                    note.linkfullname = note.linkfname + " " + note.linklname;

                    var linkedContact = [];
                    if (note.linked_contact.length > 0) {
                        _.forEach(note.linked_contact, function (item) {
                            item.last_name = (utils.isEmptyVal(item.last_name) || item.last_name == null) ? "" : item.last_name;
                            item.first_name = (utils.isEmptyVal(item.first_name) || item.first_name == null) ? "" : item.first_name;
                            linkedContact.push(item.first_name + " " + item.last_name);
                        });
                    } else {
                        linkedContact = " ";
                    }


                    var descCheck = (note.noteCategory.category_name == null) ? "Note" : note.noteCategory.category_name;
                    var noteText;
                    (note.type == 'email') ? noteText = note.plaintext + '<br>' + note.text : noteText = $filter('decodeHtmlEncoding')(note.text);
                    html += '   <tr><td>';
                    html += '<tr><td width="12%"><b>Added on: </b></td><td style="width:88%"> ' + self.getFormattedDate(note.created_date) + '</td>';
                    html += '<tr><td width="12%"><b>Added by: </b></td><td style="width:88%">' + note.fname + " " + note.lname + '</td>';
                    html += '<tr><td width="20%"><b>Linked contact: </b></td><td style="width:80%"> ' + linkedContact + '</td>';
                    html += '<tr><td width="10%" style="vertical-align: top;"><b>Note: </b></td><td style="width:90%"> ' + noteText + '</td>';
                    html += '<tr><td width="12%"><b>Category: </b></td><td style="width:88%"> ' + descCheck + '</td>';
                    html += '</td></tr><tr><td style="height:15px">-------</td></tr>';
                });
            });
            html += '</tbody>';
            html += '<tbody></table>';
            html += (self.signature == undefined) ? '' : self.signature;
            self.composeEmail = angular.copy(html);
            var selectedMatter = { matterid: self.matterinfo.matter_id, name: self.matterinfo.matter_name, filenumber: self.matterinfo.file_number };
            getMatterContact(self.matterinfo.matter_id, function (contacts) {
                $rootScope.updateComposeMailMsgBody(self.composeEmail, selectedMatter, undefined, undefined, 'matterRecipents', contacts);
                self.compose = true;
                $rootScope.composeNotesEmail = self.composeEmail;
            });
        }

        // on drawer-closed event reload the email module
        $rootScope.$on("drawer-closed", function (ev, isEmailModule) {
            if (isEmailModule) {
                reloadEmailCtrl();
            }
        });

        function reloadEmailCtrl() {
            self.reloadEmail = true;
            setTimeout(function () {
                $scope.$apply(function () {
                    self.reloadEmail = false;
                });
            }, 100);
        };

        // Get event call from mailbox controller for close compose popup
        $rootScope.$on("callCloseComposeMail", function () {
            closeComposeMail(); // close compose mail popup
        });

        // close compose mail popup
        function closeComposeMail() {

            self.compose = false;
            self.notesGrid.selectedItems = [];
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

        /*** Service call Functions ***/
        //Get notes for selected matter        
        function getMatterNotes() {
            var all = 'all';
            notesDataService.getFilteredNotes(matterId, self.selectedFilters, notesDataService.customPageNum, all)
                .then(function (data) {
                    self.isDataAvailable = true;
                    //Store notes list
                    var notesListArr = [];
                    if (data && data.notes) {
                        _.forEach(data.notes, function (notes) {
                            if (notes.noteCategory.notecategory_id != 1001 && notes.noteCategory.notecategory_id != 1002) {
                                notesListArr.push(notes);
                            }
                        });
                        self.notesList = notesListArr;
                        // self.notesList = data.notes;
                        (data.notes.length == 0) ? self.noData = true : self.noData = false;
                        self.totalNotesCount = data.totalCount;
                        _.forEach(self.notesList, function (note) {
                            note.text = note.text;
                            if (utils.isEmptyVal(note.linked_contact) || note.linked_contact == "null") {
                                note.first_name = "";
                            }
                            if (utils.isEmptyVal(note.linked_contact) || note.linked_contact == "null") {
                                note.last_name = "";
                            }
                            setDisplayText(note);
                            setSearchableData(note);
                        });
                        setGridHeight();
                    }
                });
        }

        function setDisplayText(note) {
            try {
                var text = note.plaintext;
                //text = utils.replaceHtmlEntites(text.replace(/<\/?[^>]+>/gi, ''));
                text = utils.replaceQuoteWithActual(text);
                note.displayText = text;
            } catch (e) {
                //note.displayText = (utils.isNotEmptyVal(note.text)) ? utils.replaceHtmlEntites(note.text.replace(/<\/?[^>]+>/gi, '')) : '';
                note.displayText = (utils.isNotEmptyVal(note.plaintext)) ? utils.replaceQuoteWithActual(note.plaintext) : '';
            }
        }

        function getNoteCategories() {
            notesDataService.getNotesCategories()
                .then(function (data) {
                    self.addNoteCategories = angular.copy(data);
                    self.notesCategories = angular.copy(data);
                    // add email/sidebar as categories
                    self.notesCategories.push(self.sidebarForCategories);
                    // self.notesCategories.push({ 'name': "{Blank}", 'notecategory_id': "blank" });
                    self.notesCategories = _.uniq(self.notesCategories, function (item) {
                        return item.category_name;
                    });
                    var cat = _.find(self.addNoteCategories, function (item) {
                        return item.notecategory_id == '';
                    })
                    if (utils.isEmptyObj(cat)) {
                        self.addNoteCategories.unshift({ 'category_name': undefined, 'notecategory_id': "" });
                    }
                    getNoteUsers();
                }, function (error) {
                    //console.log(error);
                });
        };

        function getNoteUsers() {
            notesDataService.getNoteUsers(matterId)
                .then(function (data) {
                    self.users = data;
                    self.tags = matterNotesHelper.createTags(self.selectedFilters, self.users, self.notesCategories);
                    getMatterNotes();
                }, function (error) {
                    //console.log(error);
                });
        }

        function matterInfo() {
            notesDataService.matterInfo(self.matterId)
                .then(function (response) {
                    self.matterinfo = response.data ? response.data[0] : '';
                });
        }

        /*** Event Handlers ***/
        self.setCurrentView = function (viewName) {
            self.isCollapsed = true;
            self.currentView = viewName;
            sessionStorage.setItem("matter-note-grid-view", self.currentView);
            self.notesGrid.selectedItems = []; //To remove buttons on changing the view 
            setGridHeight();
        };

        function setSearchableData(note) {
            var linkedNames = "";

            _.forEach(note.linked_contact, function (linkContact) {
                var fullLinkedName = [linkContact.first_name, linkContact.last_name].join(" ");
                linkedNames += fullLinkedName + " , "
            });
            var pos = linkedNames.lastIndexOf(' ,');
            if (pos > -1) {
                linkedNames = linkedNames.substring(0, pos);
            }

            note.contact_names = linkedNames;
            linkedNames = "";

            note.addedbyuser = [note.user.first_name, note.user.last_name].join(" ");
        }

        self.getMoreNotes = function (all) {
            all = 'all';
            if (!all) {
                notesDataService.customPageNum++;
                // self.currentPageNum++;
            }
            notesDataService.getFilteredNotes(matterId, self.selectedFilters, notesDataService.customPageNum, all)
                .then(function (data) {
                    //add new notes in list
                    var notesListArr = [];
                    if (data && data.notes) {
                        //angular.extend(self.notesList, data.details);
                        if (all) {
                            _.forEach(data.notes, function (notes) {
                                if (notes.noteCategory.notecategory_id != 1001 && notes.noteCategory.notecategory_id != 1002) {
                                    notesListArr.push(notes);
                                }
                            });
                            self.notesList = notesListArr;
                            // self.notesList = data.notes;

                            _.forEach(self.notesList, function (note) {
                                note.text = note.text;
                                setDisplayText(note);
                                setSearchableData(note);
                            });

                        } else {
                            angular.forEach(data.notes, function (noteObj, index) {
                                setDisplayText(noteObj);
                                setSearchableData(noteObj);
                                self.notesList.push(noteObj);

                            });
                        }

                    }
                });
        };

        //Save note for selected matter
        self.saveMatterNote = function () {
            var noteData = angular.copy(self.noteToBeAdded);
            noteData.matter_id = matterId;
            noteData.is_important = (noteData.is_important == true ? 1 : 0);
            var list = angular.copy(noteData.linked_contact);
            noteData.linked_contact = [];
            _.forEach(list, function (item) {
                var contact = { 'contact_id': item };
                noteData.linked_contact.push(contact);
            });
            var noteData = angular.copy(noteData);
            notesDataService.addNote(matterId, noteData)
                .then(function (response) {
                    self.noteToBeAdded = {};
                    self.toggleAddView();
                    notesDataService.customPageNum = 1;
                    getMatterNotes();
                    notificationService.success('Note added successfully.');
                    self.notesGrid.selectedItems.length = [];
                });
        };

        self.setSelectedCateory = function (item) {
            self.noteToBeAdded["notecategory_id"] = item["notecategory_id"];
        };

        //func to open selected note from view-note.html
        function composeNotesFromView(note) {


            var selectedNote = angular.copy(note);
            var html = "";
            html += '<table style="border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:10pt; margin-top:10px; width:100%" cellspacing="0" cellpadding="0" border="0"><thead><tr>';
            html += '<tbody>';
            selectedNote.text = _.isNull(selectedNote.text) ? '' : selectedNote.text;
            selectedNote.fname = utils.isNotEmptyVal(selectedNote.user.first_name) ? selectedNote.user.first_name : '';
            selectedNote.lname = utils.isNotEmptyVal(selectedNote.user.last_name) ? selectedNote.user.last_name : '';

            // Linkedcontact on Email compose body
            note.linkcontactfname = _.pluck(note.linked_contact, 'first_name');
            note.linkcontactlname = _.pluck(note.linked_contact, 'last_name');
            note.linkfname = utils.isNotEmptyVal(note.linkcontactfname) ? note.linkcontactfname : '';
            note.linklname = utils.isNotEmptyVal(note.linkcontactlname) ? note.linkcontactlname : '';
            note.linkfullname = note.linkfname + " " + note.linklname;

            var linkedContact = [];
            if (note.linked_contact.length > 0) {
                _.forEach(note.linked_contact, function (item) {
                    item.last_name = (utils.isEmptyVal(item.last_name) || item.last_name == null) ? "" : item.last_name;
                    item.first_name = (utils.isEmptyVal(item.first_name) || item.first_name == null) ? "" : item.first_name;
                    linkedContact.push(item.first_name + " " + item.last_name);
                });
            } else {
                linkedContact = " ";
            }

            var descCheck = (selectedNote.noteCategory.category_name == null) ? "Note" : selectedNote.noteCategory.category_name;
            var noteText;
            (selectedNote.type == 'email') ? noteText = selectedNote.plaintext + '<br>' + selectedNote.text : noteText = $filter('decodeHtmlEncoding')(selectedNote.text);
            html += '   <tr><td>';
            html += '<tr><td width="12%"><b>Added on: </b></td><td style="width:88%"> ' + self.getFormattedDate(selectedNote.created_date) + '</td>';
            html += '<tr><td width="12%"><b>Added by: </b></td><td style="width:88%">' + selectedNote.fname + " " + selectedNote.lname + '</td>';
            html += '<tr><td width="20%"><b>Linked contact: </b></td><td style="width:80%">' + linkedContact + '</td>';
            html += '<tr><td width="10%" style="vertical-align: top;"><b>Note: </b></td><td style="width:90%"> ' + noteText + '</td>';
            html += '<tr><td width="12%"><b>Category: </b></td><td style="width:88%"> ' + descCheck + '</td>';
            html += '</td></tr><tr><td style="height:15px">-------</td></tr>';
            html += '</tbody>';
            html += '<tbody></table>';
            html += (self.signature == undefined) ? '' : self.signature;
            self.composeEmail = angular.copy(html);
            var selectedMatter = { matterid: self.matterinfo.matter_id, name: self.matterinfo.matter_name, filenumber: self.matterinfo.file_number };
            getMatterContact(self.matterinfo.matter_id, function (contacts) {
                $rootScope.updateComposeMailMsgBody(self.composeEmail, selectedMatter, undefined, undefined, 'matterRecipents', contacts);
                self.compose = true;
                $rootScope.composeNotesEmail = self.composeEmail;
            });
            // set rootscope selected note DOM for compose mail
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
                    console.log(contactMerge);
                }, function (error) {
                    notificationService.error("Unable to fetch contacts!");
                });
        }

        self.openNotesView = function (note) {
            var list = angular.copy(note.linked_contact);
            var contacts = [];
            _.forEach(list, function (item) {
                if (item.last_name == null || item.last_name == undefined) {
                    contacts.push(item.first_name);
                } else if (item.first_name == null || item.first_name == undefined) {
                    contacts.push(item.last_name);
                } else if (utils.isNotEmptyVal(item.first_name) || utils.isNotEmptyVal(item.last_name)) {
                    contacts.push(item.first_name + " " + item.last_name);
                }
            });
            note.linked_names = contacts.toString();
            var noteResolve = { note: note, view: self.currentView };
            var modalInstance = $modal.open({
                templateUrl: 'app/notes/matter-notes/partials/view-note.html',
                controller: 'ViewNoteCtrl as viewNote',
                windowClass: 'medicalIndoDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    note: function () {
                        return noteResolve;
                    },
                    categories: function () {
                        return self.addNoteCategories;
                    }
                }
            });

            modalInstance.result.then(function (response) {
                if (response) {
                    if (response.composeEmail) {
                        composeNotesFromView(note);
                    }
                    if (response.edited) {
                        notificationService.success('Note edited successfully.');
                        notesDataService.customPageNum = 1;
                        self.notesList = [];
                        getMatterNotes();
                        return;
                    }

                    if (response == true) {
                        notificationService.success('Note deleted successfully.');
                        self.notesGrid.selectedItems = [];
                        notesDataService.customPageNum = 1;
                        getMatterNotes();
                        return;
                    }


                    if (response.error) {
                        notificationService.error('An error occurred. Please try later.');
                        return;
                    }

                }
            }, function () {
                //console.log('view note closed');
            });
        };
        self.openNotesEdit = function (note) {
            var userrole = masterData.getUserRole();
            self.isUser = (userrole.uid == note.user.user_id) || (userrole.role == globalConstants.adminrole) || (userrole.is_admin == '1') ? false : true;//US#8097
            if (self.isUser) {
                self.notesGrid.selectedItems = [];
                return notificationService.error('Cannot Edit Note of another user');
            }
            var noteResolve = { note: note, view: self.currentView };
            if (note.type == 'email' || note.type == 'sidebar') {
                (note.type == 'email') ? notificationService.error("Can't edit email note") : notificationService.error("Can't edit sidebar note");
                self.notesGrid.selectedItems = [];
                return false;
            } else {
                var modalInstance = $modal.open({
                    templateUrl: 'app/notes/matter-notes/partials/edit-note.html',
                    controller: 'ViewNoteCtrl as viewNote',
                    windowClass: 'medicalIndoDialog',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        note: function () {
                            return noteResolve;
                        },
                        categories: function () {
                            return self.addNoteCategories;
                        }
                    }
                });

                modalInstance.result.then(function (response) {
                    if (response) {
                        if (response.deleted == 1) {
                            notificationService.success('Note deleted successfully.');
                            self.notesGrid.selectedItems.length = 0;
                            self.notesList = [];
                            getMatterNotes();
                            return;
                        }

                        if (response.edited) {
                            notificationService.success('Note edited successfully.');
                            self.notesGrid.selectedItems.length = 0;
                            notesDataService.customPageNum = 1;
                            self.notesList = [];
                            getMatterNotes();
                            return;
                        }

                        if (response.error) {
                            notificationService.error('An error occurred. Please try later.');
                            return;
                        }

                    }
                }, function () {
                    //console.log('view note closed');
                });
            }
        };

        //
        self.editNote = function (note) {
            var noteData = angular.copy(note);
            noteData.is_important = (noteData.is_important == true ? 1 : 0);
            notesDataService.editNote(noteData)
                .then(function (res) {
                    $modalInstance.close({ edited: true });
                });
        }

        self.openContactCard = function (contact) {
            contactFactory.displayContactCard1(contact.contact_id, contact.edited, contact.contact_type);
            contact.edited = false;
        };

        // Delete function for conversation view
        self.deleteNotes = function (note, selectedNotes, filterNotes) {

            if (utils.isNotEmptyVal(self.serachInput) && allNoteselected()) {
                selectedNotes = filterNotes;
            }

            var notesTobeDeleted = [];
            var userrole = masterData.getUserRole();
            self.isUser = (userrole.uid == note.user.user_id) || (userrole.role == globalConstants.adminrole) ? false : true;
            notesTobeDeleted = _.filter(selectedNotes, function (note) {
                //US#8097 give delete access to admin to delete other user note
                if (userrole.is_admin == '1') {
                    return (selectedNotes && note.type != 'email' && note.type != 'sidebar');
                } else {
                    return (userrole.uid == note.user.user_id && note.type != 'email' && note.type != 'sidebar');
                }
            })

            //Bug#7300          
            if (notesTobeDeleted.length === 0) {
                notificationService.error('Cannot Delete Note ');
                return;
            }
            if (notesTobeDeleted.length != selectedNotes.length) {
                notificationService.error('Cannot Delete Note ');
            }

            var notetype = _.find(selectedNotes, function (key) {
                return key.type == "note";
            });
            if (notetype == undefined) {
                (note.type == 'email') ? notificationService.error('Cannot Delete Email Note') : notificationService.error('Cannot Delete Sidebar Note');
                self.notesGrid.selectedItems = [];
                return false;
            } else {
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Delete',
                    headerText: 'Delete note ?',
                    bodyText: "Do you wish to delete this note?"
                };
                modalService.showModal({}, modalOptions).then(function () {
                    var noteIds = [];
                    noteIds = _.pluck(notesTobeDeleted, 'note_id');
                    var promesa = notesDataService.deleteNote(noteIds)
                        .then(function (response) {
                            self.deleteMode = false;
                            self.isOpenNotesView = false;
                            self.notesGrid.selectedItems = [];
                            notesDataService.customPageNum = 1;
                            notificationService.success('Note deleted successfully.');
                            self.notesList = [];
                            getMatterNotes();
                        });
                });
            }
        }
        self.openFilters = function () {
            var fData = sessionStorage.getItem("retainFilters");
            if (fData) {
                var retainsFilter = JSON.parse(sessionStorage.getItem("retainFilters"));
                if (self.matterId == retainsFilter.matterID) {
                    var existingFilters = sessionStorage.getItem("matterNotesFilters");
                    var notesDateFilter = sessionStorage.getItem("matterNotesDateFilter");
                    self.selectedFilters = JSON.parse(existingFilters);
                    self.selectedFilters = self.selectedFilters == null ? {} : self.selectedFilters;
                    self.currentDateFilter = notesDateFilter;
                }
                else {
                    var existingFilters = "";//sessionStorage.getItem("matterNotesFilters");
                    var notesDateFilter = "";//sessionStorage.getItem("matterNotesDateFilter");
                    // self.selectedFilters = JSON.parse(existingFilters);
                    // self.currentDateFilter = notesDateFilter;
                }
            } else {
                var existingFilters = "";
                var notesDateFilter = "";
            }

            // self.selectedFilters = JSON.parse(existingFilters);
            // self.currentDateFilter = notesDateFilter;



            var modalInstance = $modal.open({
                templateUrl: 'app/notes/matter-notes/partials/note-filters.html',
                controller: 'NoteFiltersCtrl',
                windowClass: 'medium-pop',
                backdrop: "static",
                keyboard: false,
                // size: 'sm',
                resolve: {
                    matterID: function () {
                        return matterId;
                    },
                    categories: function () {
                        return self.notesCategories;
                    },
                    users: function () {
                        return self.users;
                    },
                    selectedFilters: function () {
                        return self.selectedFilters;
                    },
                    currentDateFilter: function () {
                        return self.currentDateFilter;
                    },
                    tags: function () {
                        return angular.copy(self.tags);
                    }
                }
            });

            modalInstance.result.then(function (response) {
                self.isCollapsed = true;
                if (response.action == "RESET") {
                    notesDataService.customPageNum = 1;
                    // self.currentPageNum = 1;
                    self.notesList = [];
                    self.selectedFilters = {};
                    getMatterNotes();
                } else {
                    var notesListArr = [];
                    _.forEach(response.filterData, function (notes) {
                        if (notes.noteCategory.notecategory_id != 1001 && notes.noteCategory.notecategory_id != 1002) {
                            notesListArr.push(notes);
                        }
                    });
                    self.notesList = notesListArr;

                    // self.notesList = response.filterData;
                    _.forEach(self.notesList, function (note) {
                        note.text = note.text;
                        setDisplayText(note);
                        setSearchableData(note);
                    });
                    setGridHeight();
                    self.selectedFilters = response.filters;
                    self.currentDateFilter = response.currentDateFilter;

                    self.tags = matterNotesHelper.createTags(self.selectedFilters, self.users, self.notesCategories);
                }

                //persist filters
                var retainsFilter = JSON.parse(sessionStorage.getItem("retainFilters"));
                if (utils.isNotEmptyVal(retainsFilter)) {
                    if (self.matterId != retainsFilter.matterID) {
                        sessionStorage.removeItem("documentFiltersMatter");
                        sessionStorage.removeItem("motionMatterID");
                        sessionStorage.removeItem("timeLineListFilters");
                    }
                }
                $rootScope.retainFilters.matterID = self.matterId;
                sessionStorage.setItem("retainFilters", JSON.stringify($rootScope.retainFilters));
                sessionStorage.setItem("matterNotesFilters", JSON.stringify(self.selectedFilters));
                sessionStorage.setItem("matterNotesDateFilter", self.currentDateFilter);

            }, function () {
                //console.log('filters closed');

            });
        };

        self.toggleAddView = function () {
            self.isCollapsed = !self.isCollapsed;
            self.noData = true;
            $("#matterNotesAdd").html("");
        };

        /*** Styling Functions ***/
        self.getNoteClass = function (noteCategoryID) {
            if (noteCategoryID == 1)
                return "attorney";
            else if (noteCategoryID == 2)
                return "client-communication";
            else if (noteCategoryID == 4)
                return "deposition";
            else if (noteCategoryID == 7)
                return "insurance";
            else
                return "uncategorized";
        };

        self.getNoteIcon = function (noteCategoryID) {
            if (noteCategoryID == 1)
                return "default-attorney";
            else if (noteCategoryID == 2)
                return "default-client-communication";
            else if (noteCategoryID == 7)
                return "default-insurance";
            else
                return "";
        };

        self.getFormattedDate = function (timestamp, formatStr) {
            if (formatStr)
                return moment.unix(timestamp).format(formatStr);
            else
                return moment.unix(timestamp).format("MM/DD/YYYY hh:mm A");
        };

        self.getCateogry = function (notecat) {
            if (notecat.category_name == null || notecat.category_name == 'null') {
                if (notecat.category_name)
                    return notecat.category_name.toUpperCase();
                else
                    return "Note";
            }

            return notecat.category_name;
        };

        /*** Alert Functions ***/
        self.alert = {};

        self.closeAlert = function () {
            self.alert = {};
        };

        // hide/show more and show all link
        self.showMoreHTML = function () {
            if (self.notesList) {
                if ((self.notesList.length > 0) && (self.notesList.length != self.totalNotesCount)) {
                    if ((self.notesList.length % 9) == 0) { // TODO - dynamic pagesize 
                        return true;
                    } else {
                        return false;
                    }
                    //return self.currentPageNum * 9 === self.notesList.length;
                }
                return false;

            }

        }
        // clear filter

        self.clearFilter = function () {
            self.isCollapsed = true;
            self.isDataAvailable = false;
            self.isFilterView = false;
            notesDataService.customPageNum = 1;
            // self.currentPageNum = 1;
            self.notesList = [];
            self.selectedFilters = {};
            self.currentDateFilter = {};
            //persist filters
            sessionStorage.setItem("matterNotesFilters", JSON.stringify(self.selectedFilters));
            sessionStorage.setItem("matterNotesDateFilter", self.currentDateFilter);
            $rootScope.retainSearchTextForNoteCollaboration.notesFiltertext = '';

            self.convCatFilter = '';
            self.serachInput = '';
            self.tags = [];
            self.currentFilter = {
                catFilter: [],
                categoryFilter: [],
                uidFilter: [],
                impFilter: 0,
                start: '',
                end: '',
                s_custom: '',
                e_custom: '',
                linked_contact: [],
            };

            self.addedOnVal = "";
            self.selectedFilters = {};
            self.notesGrid.selectedItems = [];
            //  self.isNotesSelected = [];
            getMatterNotes();
        }

        self.addNotes = function (notes) {
            self.contactList1 = [];
            notes.isCollapsed = !notes.isCollapsed;
            (notes.isCollapsed) ? self.noData = true : self.noData = false;
            notes.noteToBeAdded = {
                text: '',
                noteCategory: {
                    notecategory_id: ''
                },
                is_important: '',
                linked_contact: ''
            }
        }

        //print Matter Notes
        function printMatterNotes(all) {
            var catArr = [];
            var selectedFilter = angular.copy(self.selectedFilters);

            if (angular.isDefined(selectedFilter) && angular.isDefined(selectedFilter)) {
                var notesCat = angular.copy(self.notesCategories);

                if (typeof selectedFilter.catFilter === 'string') {
                    catArr = _.filter(notesCat, function (note) {
                        return note.notecategory_id == selectedFilter.catFilter;
                    });
                } else {
                    _.forEach(notesCat, function (singleCat) {
                        _.forEach(selectedFilter.catFilter, function (singleFilterCat) {
                            if (singleCat.notecategory_id == singleFilterCat) {
                                catArr.push(singleCat);
                            }
                        });
                    });
                }
            }

            if (self.currentView == "CONV") {
                if (self.notesGrid.selectedItems.length == 0) {
                    var printSelectedNotes = self.notesList
                } else {
                    printSelectedNotes = self.notesGrid.selectedItems;
                }
            } else {
                printSelectedNotes = self.notesList;
            }

            selectedFilter.catFilter = catArr;
            var users = angular.copy(self.users);
            var matterinfo = angular.copy(self.matterinfo);
            var list = self.notesList;
            _.forEach(list, function (item, index) {
                var contactLinked = [];
                var obj = item.linked_contact;
                _.forEach(obj, function (item1) {
                    var fname = utils.isNotEmptyVal(item1.first_name) ? item1.first_name : '';
                    var lname = utils.isNotEmptyVal(item1.last_name) ? item1.last_name : '';
                    var fullname = fname + " " + lname;
                    contactLinked.push(fullname);
                });
                list[index]['contact_names'] = contactLinked.join(", ");;
            });
            //printSelectedNotes.contact_names = contactLinked.toString();
            matterNotesHelper.pirntMatterNotes(selectedFilter, printSelectedNotes, users, matterinfo);
            self.notesGrid.selectedItems = [];
        }

        function tagCancelled(cancelled) {
            self.notesGrid.selectedItems = [];
            //if email category is checked then add key,value pair into existing object 
            if (cancelled.id == 13) {
                var newKey = "enote";
                var newValue = "1001";
                cancelled[newKey] = newValue;
            }
            notesDataService.customPageNum = 1;
            switch (cancelled.type) {
                case "date_range":
                    delete self.selectedFilters.start;
                    delete self.selectedFilters.end;
                    self.currentDateFilter = "";
                    break;
                case "imp_notes":
                    delete self.selectedFilters.impFilter;
                    break;
                case "users":
                    var index = self.selectedFilters.uidFilter.indexOf(cancelled.id);
                    if (index != -1) {
                        self.selectedFilters.uidFilter.splice(index, 1);
                    }
                    break;
                case "note_cat":
                    var index;
                    //check added key,value pair in object 
                    if (cancelled.enote == "1001") {
                        //email category is spliced
                        index = self.selectedFilters.catFilter.indexOf(cancelled.id);
                        if (index != -1) {
                            self.selectedFilters.catFilter.splice(index, 1);
                        }
                        //if email category is checked then along with it email key will also get spliced
                        var emailIdx = self.selectedFilters.catFilter.indexOf(cancelled.enote);
                        if (emailIdx != -1) {
                            self.selectedFilters.catFilter.splice(emailIdx, 1);
                        }
                    }
                    index = self.selectedFilters.catFilter.indexOf(cancelled.id);
                    if (index != -1) {
                        self.selectedFilters.catFilter.splice(index, 1);
                    }
                    break;
                case "linked_contact":
                    var idx = _.findIndex(self.selectedFilters.linked_contact, function (voteItem) { return voteItem.contactid == cancelled.key });
                    idx != -1 ? self.selectedFilters.linked_contact.splice(idx, 1) : angular.noop;
                    break;

            }
            //persist filters
            sessionStorage.setItem("matterNotesFilters", JSON.stringify(self.selectedFilters));
            sessionStorage.setItem("matterNotesDateFilter", self.currentDateFilter);
            getMatterNotes();
        }


        function filterRetain() {
            var retainSText = JSON.parse(sessionStorage.getItem("retainSearchTextForNoteCollaboration"));
            if (utils.isNotEmptyVal(retainSText)) {
                if (self.matterId != retainSText.matterid) {
                    $rootScope.retainSearchTextForNoteCollaboration = {};
                }
            }
            $rootScope.retainSearchTextForNoteCollaboration.notesFiltertext = self.serachInput;
            $rootScope.retainSearchTextForNoteCollaboration.matterid = self.matterId;
            sessionStorage.setItem("retainSearchTextForNoteCollaboration", JSON.stringify($rootScope.retainSearchTextForNoteCollaboration));

        }

        //export Matter Notes
        function exportMatterNotes(all) {

            var filter = {};

            if (utils.isNotEmptyVal(self.selectedFilters.catFilter)) {
                filter.catFilter = self.selectedFilters.catFilter;
            } else {
                filter.catFilter = '';
            }

            if (utils.isNotEmptyVal(self.selectedFilters.uidFilter)) {
                filter.uidFilter = self.selectedFilters.uidFilter;
            } else {
                filter.uidFilter = '';
            }

            if (utils.isNotEmptyVal(self.selectedFilters.start)) {
                filter.start = self.selectedFilters.start;
            } else {
                filter.start = '';
            }

            if (utils.isNotEmptyVal(self.selectedFilters.end)) {
                filter.end = self.selectedFilters.end;
            } else {
                filter.end = '';
            }

            if (utils.isNotEmptyVal(self.selectedFilters.impFilter)) {
                filter.impFilter = (self.selectedFilters.impFilter) ? 1 : 0;
            } else {
                filter.impFilter = '';
            }
            if (utils.isNotEmptyVal(self.selectedFilters.linked_contact)) {
                filter.contactIds = self.selectedFilters.linked_contact;
            } else {
                filter.contactIds = '';
            }
            filter.matterId = matterId;
            notesDataService.exportMatterNotes(filter, self.matterId)
                .then(function (response) {
                    utils.downloadFile(response.data, "MatterNotes.xlsx", response.headers("Content-Type"));

                })
        }

        $scope.$watch(function () {
            localStorage.setItem('matterCollaborationNotes', JSON.stringify(self.notesGrid.selectedItems))
            $rootScope.matterCollaborationNotesCount = self.notesGrid.selectedItems.length;
        });
        // setInterval(function () {
        //     // $scope.$watch(self.notesGrid.selectedItems, function () {
        //         // console.log(self.notesGrid.selectedItems);
        //         localStorage.setItem('matterCollaborationNotes', JSON.stringify(self.notesGrid.selectedItems))
        //         $rootScope.matterCollaborationNotesCount = self.notesGrid.selectedItems.length;
        //     // });
        // }, 50);
        // checkMatterCollaborationNotesCount();
        // function checkMatterCollaborationNotesCount(){
        //     $scope.$watch(function () {
        //         return self.notesGrid.selectedItems;
        //     }, function (newVal) {
        //         if (newVal) {
        //             localStorage.setItem('matterCollaborationNotes', JSON.stringify(self.notesGrid.selectedItems))
        //             $rootScope.matterCollaborationNotesCount = self.notesGrid.selectedItems.length;
        //         }
        //     });
        // }

        self.matterCollaborationNotePermissionToggle = matterCollaborationNotePermissionToggle;

        function matterCollaborationNotePermissionToggle(flag) {
            localStorage.setItem('matterCollaborationNotePermission', flag);
        }

    }


})();

(function (angular) {

    angular.module('cloudlex.matter')
        .factory('matterNotesHelper', matterNotesHelper);
    matterNotesHelper.$inject = ['globalConstants'];

    function matterNotesHelper(globalConstants) {
        return {
            pirntMatterNotes: _pirntMatterNotes,
            createTags: _createTags
        }


        function getFormattedDate(timestamp, formatStr) {
            if (formatStr)
                return moment.unix(timestamp).format(formatStr);
            else
                return moment.unix(timestamp).format("MM/DD/YYYY hh:mm A");
        };

        //matterId, self.selectedFilters, self.currentPageNum, all
        function _pirntMatterNotes(filterObj, noteList, user, matterinfo) {
            var newNoteList = [];
            var noteObj = {};
            var filtersForPrint = _getFiltersForPrint(filterObj, user, matterinfo);
            _.forEach(noteList, function (singleNote) {
                if (singleNote.catdes == null) {
                    singleNote.catdes = 'Note';
                }
                if (utils.isEmptyVal(singleNote.fname) && singleNote.type != 'email') {
                    singleNote.lname = '';
                }

            })

            var printPage = _getPrintPage(filtersForPrint, angular.copy(noteList));
            window.open().document.write(printPage);
        }

        function _getFiltersForPrint(filter, user, matterinfo) {
            var dueDateRange = "from : " + (utils.isNotEmptyVal(filter.start) ? moment.unix(filter.start).format('MM-DD-YYYY') : '  -  ') +
                " to : " + (utils.isNotEmptyVal(filter.end) ? moment.unix(filter.end).format('MM-DD-YYYY') : '  -  ');

            var category = [];
            if (utils.isNotEmptyVal(filter.catFilter)) {
                _.forEach(filter.catFilter, function (item) {
                    category.push(item.category_name);
                })
            }
            var importance = filter.impFilter === true ? 'Yes' : '';
            var mattername = matterinfo.matter_name;
            var filenumber = matterinfo.file_number;
            var addedBy = "";
            if (utils.isNotEmptyVal(filter.uidFilter)) {
                _.forEach(filter.uidFilter, function (id, i) {
                    var userData = _.find(user, function (u) {
                        return u.user_id == id
                    });
                    addedBy += i > 0 ? ', ' : '';
                    var name = utils.isEmptyVal(userData) ? "" : (userData.first_name || "") + ' ' + (userData.last_name || "");
                    addedBy += utils.isEmptyVal(name) ? " - " : name;
                });
            } else { addedBy = ""; }


            var linkedcontact = [];
            if (utils.isNotEmptyVal(filter.linked_contact)) {
                _.forEach(filter.linked_contact, function (item) {
                    linkedcontact.push(item.full_name);
                })
            }

            var filterObj = {
                'Matter Name': mattername,
                'File #:': filenumber,
                'Importance': importance,
                'Added By': addedBy,
                'Date Range': dueDateRange,
                'Category': category,
                'Linked contact': linkedcontact
            };

            return filterObj;
        }

        function _getPrintPage(filters, noteList) {
            var html = "<html><head><title>Notes Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style></head>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Notes Report</h1><div></div>";
            html += "<body>";
            html += "<div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<tr>";
            //US:3548 Filter unique category
            filters.Category = _.uniq(filters.Category, function (item) {
                return item;
            });
            angular.forEach(filters, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;' >";
                html += "<label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px; '>  " + utils.removeunwantedHTML(val) + '</span>';
                html += "</div>";
            });
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "</tr>";
            html += '<tr>';
            /*angular.forEach(headers, function (header) {
                html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + header.display + "</th>";
            });*/
            html += "<th >";
            html += '<tr>';
            html += "<th width='10%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Added on</th>";
            html += "<th width='10%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Added by</th>";
            html += "<th width='50%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Note</th>";
            html += "<th width='15%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Category</th>";
            html += "<th width='15%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Linked Contact</th>";


            html += '</tr>';
            html += '</th>';
            html += '</tr>';

            html += '<tbody>';
            angular.forEach(noteList, function (note) {
                var noteText;
                noteText = utils.replaceHtmlEntites(note.text.replace(/<\/?[^>]+>/gi, ''));
                noteText = utils.replaceQuoteWithActual(noteText);
                note.fname = utils.isNotEmptyVal(note.user.first_name) ? note.user.first_name : '';
                note.lname = utils.isNotEmptyVal(note.user.last_name) ? note.user.last_name : '';
                var categoryDesc = (note.noteCategory.category_name == null) ? "Note" : note.noteCategory.category_name;
                /*html += '<tr>';
                angular.forEach(headers, function (header) {
                
                    age[header.prop] = (_.isNull(age[header.prop]) || angular.isUndefined(age[header.prop]) || utils.isEmptyString(age[header.prop])) ? " - " : age[header.prop];
                    html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + age[header.prop] + "</td>";
                })
                html += '</tr>'*/
                /* html += '   <tr ng-repeat="note in notes.notesList | filter: notes.serachInput" data-ng-click="notes.openNotesView(note)" ng-show="notes.notesList.length > 0">';*/
                //alert('display text' + note.displayText);
                //US#8312 added this 
                (note.type == 'email') ? noteText = noteText + '<br>' + note.text : noteText = noteText;
                html += '<tr style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px">';
                html += '<td width="10%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;"> ' + getFormattedDate(note.created_date, "MM/DD/YYYY") + '</td>';
                html += '<td width="10%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;">' + utils.removeunwantedHTML(note.fname) + " " + utils.removeunwantedHTML(note.lname) + '</td>';
                html += '<td width="50%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;"> ' + noteText + '</td>';
                html += '<td width="15%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;"> ' + utils.removeunwantedHTML(categoryDesc) + '</td>';
                html += '<td width="15%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;"> ' + utils.removeunwantedHTML(note.contact_names) + '</td>';


                html += '</tr>';

            });
            html += '</tbody>';
            html += "</body>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</table>";
            html += "</html>";
            return html;
        }

        function cut(value) {
            var max = 508, wordwise = true, tail;
            if (!value) return '';

            max = parseInt(max, 10);
            if (!max) return value;
            if (value.length <= max) return value;

            value = value.substr(0, max);
            if (wordwise) {
                var lastspace = value.lastIndexOf(' ');
                if (lastspace !== -1) {
                    //Also remove . and , so its gives a cleaner result.
                    if (value.charAt(lastspace - 1) === '.' || value.charAt(lastspace - 1) === ',') {
                        lastspace = lastspace - 1;
                    }
                    value = value.substr(0, lastspace);
                }
            }

            return value + (tail || '…');

        }

        function _createTags(filters, users, categories) {
            var tags = [];
            tags = tags.concat(generateCatTags(filters.catFilter, categories));
            tags = tags.concat(generateUsersTags(filters.uidFilter, users));
            tags = tags.concat(generateImpTag(filters.impFilter));
            tags = tags.concat(generateAddedOnFilter(filters.start, filters.end));
            tags = tags.concat(generateLinkedContactTags(filters.linked_contact));
            return tags;
        }

        function generateCatTags(catFilters, categories) {
            var cats = angular.copy(categories);
            if (utils.isEmptyVal(catFilters) || !(catFilters instanceof Array)) {
                return [];
            }

            var catTags = [];
            _.forEach(catFilters, function (catFilter) {
                var catObj = _.find(categories, function (cat) {
                    return cat.notecategory_id == catFilter;
                });

                if (!catObj) {
                    cats.push({ 'category_name': "{Blank}", 'notecategory_id': "blank" });
                    catObj = _.find(cats, function (cat) {
                        return cat.notecategory_id == catFilter;
                    });
                }

                if (utils.isNotEmptyVal(catObj)) {
                    var tag = {};
                    tag.value = "Category: " + catObj.category_name.charAt(0).toUpperCase() + catObj.category_name.substr(1).toLowerCase();
                    tag.id = catFilter;
                    tag.type = "note_cat";
                    tag.key = "cat_" + catFilter;
                    catTags.push(tag);
                }
            });
            return catTags;
        }

        function generateLinkedContactTags(linkedContact) {
            if (utils.isEmptyVal(linkedContact) || !(linkedContact instanceof Array)) {
                return [];
            }
            var tags = [];
            _.forEach(linkedContact, function (data) {

                tags.push({ 'key': data.contactid, 'value': ('Linked contact: ' + data.full_name), 'type': 'linked_contact' });
            });
            return tags;
        }

        function generateUsersTags(uIds, users) {
            if (utils.isEmptyVal(uIds) || !(uIds instanceof Array)) {
                return [];
            }

            var userTags = [];
            _.forEach(uIds, function (id) {
                var user = _.find(users, function (usr) {
                    return usr.user_id == id
                });

                if (utils.isNotEmptyVal(user)) {
                    var tag = {};
                    var name = utils.isNotEmptyVal(user.first_name) ? (user.first_name + " ") : "";
                    name += utils.isNotEmptyVal(user.last_name) ? user.last_name : "";
                    tag.value = "Added by: " + name;
                    tag.id = id;
                    tag.type = "users";
                    tag.key = "usr_" + id;
                    userTags.push(tag);
                }

            });

            return userTags;
        }

        function generateImpTag(imp) {
            if (imp === true) {
                var tag = {};
                tag.value = "Important Notes";
                tag.key = "imp";
                tag.type = "imp_notes";
                return [tag];
            }
            return [];
        }

        function generateAddedOnFilter(start, end) {
            if (utils.isEmptyVal(start) || utils.isEmptyVal(end)) {
                return [];
            }

            var tag = {};
            var dateRange = "Added On: from: "
                + moment.unix(start).format('MM/DD/YYYY') +
                " to: " + moment.unix(end).format('MM/DD/YYYY');
            tag.value = dateRange;
            tag.key = "date_range";
            tag.type = "date_range";
            return [tag];
        }
    }

})(angular);



//var deleteIndex = -1;
//angular.forEach(self.notesList, function (noteObj, index) {
//    if (noteObj.id == response.id) {
//        deleteIndex = index;
//    }
//});

//self.notesList.splice(deleteIndex, 1);

