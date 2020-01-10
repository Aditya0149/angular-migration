
(function () {

    'use strict';

    angular
        .module('intake.notes')
        .controller('IntakeNotesCtrl', NotesController);

    NotesController.$inject = ['$scope', '$filter', '$timeout', 'intakeNotesDataService', '$stateParams', '$modal', 'modalService',
        'notification-service', 'intakeFactory', 'IntakeNotesHelper', '$rootScope', 'globalConstants', 'masterData', 'matterFactory', 'contactFactory', 'mailboxDataService', 'practiceAndBillingDataLayer','notesDataService'];

    function NotesController($scope, $filter, $timeout, intakeNotesDataService, $stateParams, $modal, modalService,
        notificationService, intakeFactory, IntakeNotesHelper, $rootScope, globalConstants, masterData, matterFactory, contactFactory, mailboxDataService, practiceAndBillingDataLayer,notesDataService) {

        var self = this;
        self.intakeId = $stateParams.intakeId;
        self.reloadEmail = false;
        var intakeId = $stateParams.intakeId;

        self.allNoteselected = allNoteselected;
        self.selectAllNotes = selectAllNotes;
        self.isNotesSelected = isNotesSelected;
        self.noteDescription = [];
        self.notesList = [];  //Data model for holding list of matter notes        
        self.noteToBeAdded = {
            text: undefined
        };  //Data model for holding new note details
        self.currentView = utils.isNotEmptyVal(localStorage.getItem("matter-note-grid-view-intake")) ? localStorage.getItem("matter-note-grid-view-intake") : "LIST";
        self.notesCategories = [];
        self.users = [];
        //self.printSelectedNotes = []; // object for printing selected notes
        self.isCollapsed = true;
        self.serachInput = "";
        self.selectedFilters = {};
        self.noData = true;
        self.showMoreAll = true;
        self.currentDateFilter = {};
        self.matterinfo = {};
        self.isDataAvailable = false;
        var allMatterNoteSelected = false;
        self.printMatterNotes = printMatterNotes;
        self.exportMatterNotes = exportMatterNotes;
        self.sidebarForCategories = { "notecategory_id": "1002", "category_name": "sidebar" };
        self.clientMsngrForCategories = { "notecategory_id": "1003", "category_name": "client messenger" };
        self.tagCancelled = tagCancelled;
        self.filterRetain = filterRetain;
        self.composeNotesMail = composeNotesMail;
        self.isUser = true;
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.email_subscription = gracePeriodDetails.email_subscription;  // role email subscription
        self.firmData = { API: "PHP", state: "mailbox" };
        self.composeNotesFromView = composeNotesFromView;
        intakeNotesDataService.customPageNum = 1;

        self.contactList1 = [];
        self.getLinkContact = getLinkContact;

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

            self.notesGrid = {
                headers: [],
                selectedItems: []
            }

            self.display = {
                filtered: true,
                noteListReceived: false,
                noteSelected: {}
            };

            intakeFactory.setBreadcrum(self.intakeId, 'Notes')
            //Get notes and categories
            // intakeFactory.setBreadcrumWithPromise(self.intakeId, 'Notes').then(function (resultData) {
            //     self.matterInfo = resultData;
            //     self.intake_name = resultData.intakeName;
            // });

            //set persisted filters
            var persistedFilter = localStorage.getItem("matterNotesFiltersForIntake");
            var dateFilter = localStorage.getItem("matterNotesDateFilterForIntake");
            var retainsFilter = JSON.parse(localStorage.getItem("retainFiltersForIntake"));
            if (utils.isNotEmptyVal(retainsFilter)) {
                if (self.intakeId == retainsFilter.intakeId) {
                    if (utils.isNotEmptyVal(persistedFilter)) {
                        try {
                            self.selectedFilters = JSON.parse(persistedFilter);
                            self.currentDateFilter = dateFilter;
                        } catch (e) {
                            self.selectedFilters = {};
                        }
                    }
                }
            }

            var retainSText = JSON.parse(localStorage.getItem("retainSearchTextForIntake"));
            if (utils.isNotEmptyVal(retainSText)) {
                if (self.intakeId == retainSText.intakeId) {
                    self.serachInput = retainSText.notesFiltertext;
                }
            }
            displayWorkflowIcon();
            getMatterNotes();
            getNoteCategories();
            getUserEmailSignature();
        })();

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

        self.openContactCard = function (contact) {
            contactFactory.displayContactCard1(contact.contact_id, contact.edited, contact.contact_type);
            contact.edited = false;
        };
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

        function getUserEmailSignature() {
            mailboxDataService.emailSignature()
                .then(function (data) {
                    if (utils.isNotEmptyVal(data.data)) {
                        self.signature = data.data[0];
                        self.signature = '<br/><br/>' + self.signature;
                    }
                });
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
                printSelectedMatterNotes.push(_.find(self.notesList, function (note) {
                    return note.note_id == key.note_id;
                }));
            });
            var intakeInfo = intakeFactory.getMatterData();
            var html = "";
            html += notesDataService.composemailHtml(printSelectedMatterNotes);
            html += (self.signature == undefined) ? '' : self.signature;
            self.composeEmail = angular.copy(html);
            var selectedMatter = { matterid: self.intakeId, name: intakeInfo.intakeName, filenumber: self.matterinfo.file_number };
            var intakedata = intakeFactory.getMatterData();
            _.forEach(intakedata.assignedUser, function (item) {
                item.mail = item.email;
                item.uid = item.userId;
                item.name = item.fullName;
            });
            $rootScope.updateComposeMailMsgBody(self.composeEmail, selectedMatter, undefined, undefined, 'matterRecipents', intakedata.assignedUser);
            self.compose = true;
            $rootScope.composeNotesEmail = self.composeEmail; // set rootscope selected note DOM for compose mail
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

        /*** Service call Functions ***/
        //Get notes for selected matter        
        function getMatterNotes() {
            self.loaderFlagStatus = false;
            self.migrate = localStorage.getItem('Migrated');
            intakeNotesDataService.getFilteredNotes(intakeId, self.selectedFilters, intakeNotesDataService.customPageNum)
                .then(function (data) {
                    self.isDataAvailable = true;
                    self.showMoreAll = true;
                    
                    //hide more and all
                    if(intakeNotesDataService.customPageNum == 1 && data.notes.length < 9 ){
                        self.showMoreAll = false;
                    }

                    // self.intake_name = utils.isNotEmptyVal(data.notes) ? data.notes[0].intake_name : '';
                    //Store notes list
                    if (data && data.notes) {
                        self.notesList = data.notes;
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
                            notesDataService.setSearchableData(note);
                        });
                        setGridHeight();
                    } else {
                        self.notesList = [];
                    }
                    self.loaderFlagStatus = true;
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
            intakeNotesDataService.getNotesCategories()
                .then(function (data) {
                    self.addNoteCategories = angular.copy(data);
                    self.notesCategories = angular.copy(data);
                    self.notesCategories.push(self.sidebarForCategories);
                    self.notesCategories.push(self.clientMsngrForCategories);
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
            intakeNotesDataService.getNoteUsers(intakeId)
                .then(function (data) {
                    self.users = data.data;
                    self.tags = IntakeNotesHelper.createTags(self.selectedFilters, self.users, angular.copy(self.notesCategories));
                }, function (error) {
                });
        }

        /*** Event Handlers ***/
        self.setCurrentView = function (viewName) {
            self.isCollapsed = true;
            self.currentView = viewName;
            localStorage.setItem("matter-note-grid-view-intake", self.currentView);
            self.notesGrid.selectedItems = []; //To remove buttons on changing the view 
            setGridHeight();
        };

        self.getMoreNotes = function (all) {

            if (!all) {
                intakeNotesDataService.customPageNum++;
                // self.currentPageNum++;
            }
            intakeNotesDataService.getFilteredNotes(intakeId, self.selectedFilters, intakeNotesDataService.customPageNum, all)
                .then(function (data) {

                    if (data.count == 0) {
                        notificationService.error("No more notes found");
                        self.showMoreAll = false;
                    }

                    //add new notes in list
                    if (data && data.notes) {
                        //angular.extend(self.notesList, data.details);
                        if (all) {
                            self.notesList = data.notes;
                            _.forEach(self.notesList, function (note) {
                                note.text = note.text;
                                setDisplayText(note);
                            });
                            self.showMoreAll = false;

                        } else {
                            angular.forEach(data.notes, function (noteObj, index) {
                                setDisplayText(noteObj);
                                self.notesList.push(noteObj);
                            });
                        }

                    }
                });
        };

        //Save note for selected matter
        self.saveMatterNote = function () {
            var noteData = angular.copy(self.noteToBeAdded);
            noteData.matter_id = self.intakeId;
            noteData.is_important = (noteData.is_important == true ? 1 : 0);
            var list = angular.copy(noteData.linked_contact);
            noteData.linked_contact = [];
            _.forEach(list, function (item) {
                var contact = { 'contact_id': item };
                noteData.linked_contact.push(contact);
            });
            var noteData = angular.copy(noteData);
            if (!noteData.noteCategory) {
                noteData.noteCategory = {
                    notecategory_id: ""
                }
            }
            intakeNotesDataService.addNote(noteData)
                .then(function (response) {
                    self.noteToBeAdded = {};
                    self.toggleAddView();
                    intakeNotesDataService.customPageNum = 1;
                    getMatterNotes();
                    notificationService.success('Note added successfully.');
                    self.notesGrid.selectedItems.length = [];
                });
        };

        self.setSelectedCateory = function (item) {
            self.noteToBeAdded["notecategory_id"] = item["notecategory_id"];
        };

        // to open add new contact pop up
        self.addNewContact = function(type) {
            var selectedType = {};
            selectedType.type = type;
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                if (response) {
                    response.firstname = response.first_name;
                    response.lastname = response.last_name;
                    response.contactid = (response.contact_id).toString();
                    var tempLinked_contact = [];
                    self.contactList1.push(response);
                    tempLinked_contact.push(response.contactid);
                    
                    if(self.noteToBeAdded.linked_contact instanceof Array){
                        self.noteToBeAdded.linked_contact = self.noteToBeAdded.linked_contact.concat(tempLinked_contact);                    
                    } else {
                        self.noteToBeAdded.linked_contact = [];
                        self.noteToBeAdded.linked_contact = self.noteToBeAdded.linked_contact.concat(tempLinked_contact);                    
                    }
                }
            }, function () { });
        }

        //func to open selected note from view-note.html
        function composeNotesFromView(note) {
            var selectedNote = angular.copy(note);
            var intakeInfo = intakeFactory.getMatterData();
            var printSelectedMatterNotes = [];
            printSelectedMatterNotes.push(selectedNote);
            var html = "";
            html += notesDataService.composemailHtml(printSelectedMatterNotes);
            html += (self.signature == undefined) ? '' : self.signature;
            self.composeEmail = angular.copy(html);
            var selectedMatter = { matterid: self.intakeId, name: intakeInfo.intakeName, filenumber: self.matterinfo.file_number };
            var intakedata = intakeFactory.getMatterData();
            _.forEach(intakedata.assignedUser, function (item) {
                item.mail = item.email;
                item.uid = item.userId;
                item.name = item.fullName;
            });
            $rootScope.updateComposeMailMsgBody(self.composeEmail, selectedMatter, undefined, undefined, 'matterRecipents', intakedata.assignedUser);
            self.compose = true;
            $rootScope.composeNotesEmail = self.composeEmail; // set rootscope selected note DOM for compose mail
        }

        self.openNotesView = function (note) {
            var list = angular.copy(note.linked_contact);
            self.notesGrid.selectedItems = [];
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
            var noteResolve = { note: angular.copy(note), view: self.currentView };
            var modalInstance = $modal.open({
                templateUrl: 'app/notes/matter-notes/partials/view-note.html',
                controller: 'IntakeViewNoteCtrl as viewNote',
                windowClass: 'medicalIndoDialog static-new-scrollbar',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    note: function () {
                        return angular.copy(noteResolve);
                    },
                    categories: function () {
                        return self.addNoteCategories;
                    }
                }
            });

            modalInstance.result.then(function (response) {
                if (response) {
                    if (response.composeEmail) {
                        composeNotesFromView(response.note);
                    }
                    if (response.edited) {
                        intakeNotesDataService.customPageNum = 1;
                        notificationService.success('Note edited successfully.');
                        self.notesList = [];
                        getMatterNotes();
                        return;
                    }

                    if (response.deleted) {
                        intakeNotesDataService.customPageNum = 1;
                        notificationService.success('Note deleted successfully.');
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

            var cat = _.filter(self.notesCategories, function (item) {
                return item.notecategory_id != "blank";
            })
            var noteResolve = { note: note, view: self.currentView };
            if (note.type == 'email' || note.type == 'sidebar' || note.type == 'Client Messenger') {
                (note.type == 'email') ? notificationService.error("Can't Edit Email Note") : (note.type == 'sidebar') ? notificationService.error("Can't Edit Sidebar Note") : notificationService.error("Can't Edit Client Messenger Note");
                self.notesGrid.selectedItems = [];
                return false;
            } else {
                var modalInstance = $modal.open({
                    templateUrl: 'app/notes/matter-notes/partials/edit-note.html',
                    controller: 'IntakeViewNoteCtrl as viewNote',
                    windowClass: 'medicalIndoDialog static-new-scrollbar',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        note: function () {
                            return noteResolve;
                        },
                        categories: function () {
                            return angular.copy(cat);
                        }
                    }
                });

                modalInstance.result.then(function (response) {
                    if (response) {
                        if (response.deleted == 1) {
                            intakeNotesDataService.customPageNum = 1;
                            notificationService.success('Note deleted successfully.');
                            self.notesGrid.selectedItems.length = 0;
                            self.notesList = [];
                            getMatterNotes();
                            return;
                        }

                        if (response.edited) {
                            intakeNotesDataService.customPageNum = 1;
                            notificationService.success('Note edited successfully.');
                            self.notesGrid.selectedItems.length = 0;
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

        self.editNote = function (note) {
            var notesData = angular.copy(note);
            // note.is_important = (note.is_important == true ? 1 : 0);
            var recordNotes = {
                id: notesData.id,
                noteCategory: { "notecategory_id": notesData.notecategory_id, "catdes": notesData.catdes },
                fname: notesData.fname,
                lname: notesData.lname,
                text: notesData.text,
                type: notesData.type,
                is_important: notesData.is_important == true ? 1 : 0,
                datereceived: notesData.datereceived,
                intake_name: notesData.intake_name,
                file_number: notesData.file_number,
            }
            intakeNotesDataService.editNote(recordNotes)
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
            });

            var notetype = _.find(selectedNotes, function (key) {
                return key.type == "note";
            });
            if (notetype == undefined) {
                (note.type == 'email') ? notificationService.error("Can't Delete Email Note") : (note.type == 'sidebar') ? notificationService.error("Can't Delete Sidebar Note") : notificationService.error("Can't Delete Client Messenger Note");
                self.notesGrid.selectedItems = [];
                return false;
            } else {
                //Bug#7300
                var sidebarnotetype = _.find(selectedNotes, function (key) {
                    return key.type == "sidebar";
                });
                var emailnotetype = _.find(selectedNotes, function (key) {
                    return key.type == "email";
                });
                var clientMsgnotetype = _.find(selectedNotes, function (key) {
                    return key.type == "Client Messenger";
                });
                if (sidebarnotetype) {
                    notificationService.error("Can't Delete Sidebar Note");
                    return;
                }
                if (emailnotetype) {
                    notificationService.error("Can't Delete Email Note");
                    return;
                }
                if (clientMsgnotetype) {
                    notificationService.error("Can't Delete Client Messenger Note");
                    return;
                }
                if (notesTobeDeleted.length === 0) {
                    notificationService.error("Can't Delete Note");
                    return;
                }
                if (notesTobeDeleted.length != selectedNotes.length) {
                    notificationService.error("Can't Delete Note");
                    return;
                }

                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Delete',
                    headerText: 'Delete note ?',
                    bodyText: "Do you wish to delete this note?"
                };
                modalService.showModal({}, modalOptions).then(function () {
                    var noteIds = [];
                    noteIds = _.pluck(notesTobeDeleted, 'note_id');
                    var promesa = intakeNotesDataService.deleteNote(noteIds)
                        .then(function (response) {
                            self.deleteMode = false;
                            self.isOpenNotesView = false;
                            self.notesGrid.selectedItems = [];
                            intakeNotesDataService.customPageNum = 1;
                            notificationService.success('Note deleted successfully.');
                            self.applyCatFilters();
                            self.notesList = [];
                            getMatterNotes();
                        });
                });
            }
        }
        self.openFilters = function () {
            var existingFilters = localStorage.getItem("matterNotesFiltersForIntake");
            var notesDateFilter = localStorage.getItem("matterNotesDateFilterForIntake");
            /////////////
            var retainsFilter = JSON.parse(localStorage.getItem("retainFiltersForIntake"));
            if (utils.isNotEmptyVal(retainsFilter)) {
                if (self.intakeId == retainsFilter.intakeId) {
                    if (utils.isNotEmptyVal(existingFilters)) {
                        try {
                            self.selectedFilters = JSON.parse(existingFilters);
                            self.currentDateFilter = notesDateFilter;
                        } catch (e) {
                            self.selectedFilters = {};
                        }
                    }
                }
            }
            ///////////////////
            // self.selectedFilters = JSON.parse(existingFilters);
            // self.currentDateFilter = notesDateFilter;

            var modalInstance = $modal.open({
                templateUrl: 'app/notes/matter-notes/partials/note-filters.html',
                controller: 'IntakeNoteFiltersCtrl',
                windowClass: 'medium-pop',
                backdrop: "static",
                keyboard: false,
                // size: 'sm',
                resolve: {
                    matterID: function () {
                        return self.intakeId;
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
                self.showMoreAll = true;
                
                if(intakeNotesDataService.customPageNum == 1 && response.filterData.length < 9){
                    self.showMoreAll = false;
                }
                if (response.action == "RESET") {
                    intakeNotesDataService.customPageNum = 1;
                    // self.currentPageNum = 1;
                    self.notesList = [];
                    self.selectedFilters = {};
                    getMatterNotes();
                } else {
                    self.notesList = response.filterData;
                    self.totalNotesCount = response.totalCount;
                    _.forEach(self.notesList, function (note) {
                        note.text = note.text;
                        setDisplayText(note);
                        notesDataService.setSearchableData(note);
                    });
                    setGridHeight();
                    self.selectedFilters = response.filters;
                    self.currentDateFilter = response.currentDateFilter;

                    self.tags = IntakeNotesHelper.createTags(self.selectedFilters, self.users, self.notesCategories);
                }

                //persist filters
                var retainsFilter = JSON.parse(localStorage.getItem("retainFiltersForIntake"));
                if (utils.isNotEmptyVal(retainsFilter)) {
                    if (self.intakeId != retainsFilter.intakeId) {
                        localStorage.removeItem("documentFiltersIntake");
                        localStorage.removeItem("motionIntakeID");
                        localStorage.removeItem("timeLineListFiltersForIntake");
                    }
                }
                $rootScope.retainFilters.intakeId = self.intakeId;
                localStorage.setItem("retainFiltersForIntake", JSON.stringify($rootScope.retainFilters));
                localStorage.setItem("matterNotesFiltersForIntake", JSON.stringify(self.selectedFilters));
                localStorage.setItem("matterNotesDateFilterForIntake", self.currentDateFilter);
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

        // filter from conversation view
        self.applyCatFilters = function () {
            intakeNotesDataService.customPageNum = 1;
            intakeNotesDataService.getFilteredNotes(intakeId, self.selectedFilters, intakeNotesDataService.customPageNum)
                .then(function (data) {
                    if (data && data.details) {
                        self.notesList = data.details;
                        _.forEach(self.notesList, function (note) {
                            note.text = note.text;
                            setDisplayText(note);
                        });
                    }
                });
        };

        /*** Alert Functions ***/
        self.alert = {};

        function showAlert(item) {
            self.alert = item;
        };

        self.closeAlert = function () {
            self.alert = {};
        };

        // hide/show more and show all link
        self.showMoreHTML = function () {
            if (self.notesList.length > 0) {
                return true;
            }
        }

        // clear filter

        self.clearFilter = function () {
            self.showMoreAll = true;
            self.isCollapsed = true;
            self.isDataAvailable = false;
            intakeNotesDataService.customPageNum = 1;
            // self.currentPageNum = 1;
            self.notesList = [];
            self.selectedFilters = {};
            //persist filters
            localStorage.setItem("matterNotesFiltersForIntake", JSON.stringify(self.selectedFilters));
            localStorage.setItem("matterNotesDateFilterForIntake", self.currentDateFilter);
            localStorage.removeItem("retainSearchTextForIntake");
            self.currentDateFilter = {};
            self.convCatFilter = '';
            self.serachInput = '';
            self.tags = [];
            getMatterNotes();
        }

        self.addNotes = function (notes) {
            self.contactList1 = [];
            notes.intake_name = self.intake_name;
            notes.isCollapsed = !notes.isCollapsed;
            (notes.isCollapsed) ? self.noData = true : self.noData = false;
            notes.noteToBeAdded = {};
            notes.noteToBeAdded = {
                text: undefined,
                noteCategory: {
                    notecategory_id: "",
                    category_name: undefined
                }
            };
            notes.noteToBeAdded.is_important = '';
            notes.noteToBeAdded.linked_contact = '';
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
            var intakeInfo = intakeFactory.getMatterData();
            var matterinfo = angular.copy(intakeInfo);
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
            IntakeNotesHelper.pirntMatterNotes(selectedFilter, printSelectedNotes, users, matterinfo);
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
            intakeNotesDataService.customPageNum = 1;
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
                    delete self.selectedFilters.uidFilter;
                    //   var index = self.selectedFilters.uidFilter.indexOf(cancelled.id);
                    // if (index != -1) {
                    //     self.selectedFilters.uidFilter.splice(index, 1);
                    // }
                    break;
                case "note_cat":
                    var index;
                    //check added key,value pair in object 
                    if (cancelled.enote) {
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
            localStorage.setItem("matterNotesFiltersForIntake", JSON.stringify(self.selectedFilters));
            localStorage.setItem("matterNotesDateFilterForIntake", self.currentDateFilter);
            getMatterNotes();
        }


        function filterRetain() {
            var retainSText = JSON.parse(localStorage.getItem("retainSearchTextForIntake"));
            if (utils.isNotEmptyVal(retainSText)) {
                if (self.intakeId != retainSText.intakeId) {
                    $rootScope.retainSearchText = {};
                }
            }
            $rootScope.retainSearchText.notesFiltertext = self.serachInput;
            $rootScope.retainSearchText.intakeId = self.intakeId;
            localStorage.setItem("retainSearchTextForIntake", JSON.stringify($rootScope.retainSearchText));

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
                self.selectedFilters.impFilter ? filter.impFilter = 1 : filter.impFilter = 0;
            }
            else {
                filter.impFilter = 0;
            }
            if (utils.isNotEmptyVal(self.selectedFilters.linked_contact)) {
                filter.contactIds = self.selectedFilters.linked_contact;
            } else {
                filter.contactIds = '';
            }
            filter.intakeId = intakeId;
            intakeNotesDataService.exportMatterNotes(filter, self.intakeId)
                .then(function (response) {
                    utils.downloadFile(response.data, "IntakeNotes.xlsx", response.headers("Content-Type"));

                })
        }
    }
})();

(function (angular) {

    angular.module('intake.notes')
        .factory('IntakeNotesHelper', IntakeNotesHelper);
    IntakeNotesHelper.$inject = ['globalConstants','$filter'];

    function IntakeNotesHelper(globalConstants, $filter) {
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

        //intakeId, self.selectedFilters, self.currentPageNum, all
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
            var mattername = matterinfo.intakeName;
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
                'Intake Name': mattername,
                'Importance': importance,
                'Added By': addedBy,
                'Date Range': dueDateRange,
                'Category': category,
                'Linked contact': linkedcontact
            };

            return filterObj;
        }

        function _getPrintPage(filters, noteList) {
            var html = "<html><head><title>Intake Notes</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style> pre {overflow-x: auto;white-space: pre-wrap; white-space: -moz-pre-wrap;white-space: -pre-wrap;white-space: -o-pre-wrap; word-wrap: break-word;} table tr { page-break-inside: always; }  </style></head>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Intake Notes</h1><div></div>";
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
                if (note.plaintext) {
                    noteText = utils.replaceHtmlEntites(note.plaintext.replace(/<\/?[^>]+>/gi, ''));
                    noteText = utils.replaceQuoteWithActual(noteText);
                    noteText = $filter('showSafeHtml')(noteText);
                }
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
                if (!note.text) {
                    note.text = "";
                }
                if (note.type == 'email') {
                    noteText = noteText + '<br>' + note.text;
                } else if (note.noteCategory.notecategory_id == 1003) {
                    noteText = note.displayText.replace(/(?:\r\n|\r|\n)/g, '<br>');
                } else {
                    noteText = noteText;
                }
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

