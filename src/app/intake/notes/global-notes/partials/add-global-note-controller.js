;

(function () {

    'use strict';

    angular
        .module('intake.notes')
        .controller('IntakeAddGlobalNoteCtrl', IntakeAddGlobalNoteCtrl);

    IntakeAddGlobalNoteCtrl.$inject = ['$rootScope', '$scope', 'intakeNotesDataService', 'notification-service', 'resetCallbackHelper', 'matterFactory', 'contactFactory', 'globalConstants'];

    function IntakeAddGlobalNoteCtrl($rootScope, $scope, intakeNotesDataService, notificationService, resetCallbackHelper, matterFactory, contactFactory, globalConstants) {
        var self = this;
        self.resetAddGlobalNotes = resetAddGlobalNotes;
        $scope.isIntake = true;
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
                        contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
                        contactFactory.setNamePropForContactsOffDrupal(data);
                        _.forEach(data, function (item) {
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

        (function () {	//Get notes and categories
            init();
            getNoteCategories();
        })();

        function resetAddGlobalNotes() {
            $("input[name='matterid']").val("");
            init();
        }

        function init() {
            var noteToBeEdited = intakeNotesDataService.getEditedNote();
            self.noteToBeAdded = utils.isEmptyObj(noteToBeEdited) ? {
                text: undefined,
                noteCategory: {
                    notecategory_id: ""
                }
            } : noteToBeEdited;

            self.noteToBeAdded.text = utils.getTextFromHtml(self.noteToBeAdded.text);
            // we need this to load the note list from page 1
            self.pageNum = 1;
        }

        //Save note for selected matter
        self.saveMatterNote = function () {
            var noteData = angular.copy(self.noteToBeAdded);
            noteData.is_important = (noteData.is_important == true ? 1 : 0);
            noteData.matter_id = noteData.matter.matterid;
            if (noteData.noteCategory) {
                noteData.noteCategory.notecategory_id = (utils.isNotEmptyVal(noteData.noteCategory.notecategory_id)) ? noteData.noteCategory.notecategory_id : "";
            } else {
                noteData.noteCategory = { notecategory_id: "" };

            }

            // to add linked contact in object contact_id
            // var list = angular.copy(noteData.linked_contact);
            // noteData.linked_contact = [];
            // _.forEach(list, function (item) {
            //     var contact = { 'contact_id': item };
            //     noteData.linked_contact.push(contact);
            // });

            if (noteData.mode === 'edit') {
                editNote(noteData);
                return;
            }
            addNote(noteData);
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

        function editNote(note) {
            var noteDataedit = angular.copy(note);
            intakeNotesDataService.editNote(noteDataedit)
                .then(function () {
                    getGlobalNotes().then(function () {
                        notificationService.success('Note edited successfully.');
                        //change the reset callback
                        $scope.globalNotes.isFilterView ?
                            resetCallbackHelper.setCallback($scope.globalNotes.reset) :
                            resetCallbackHelper.setCallback($scope.globalNotes.resetNotes);
                        //go to view page
                        intakeNotesDataService.setNoteToBeEdited({});
                        $scope.globalNotes.openAddContactView = false;
                    });
                });
        }

        function addNote(Note) {
            var noteDataadd = angular.copy(Note);
            noteDataadd.matter_id = noteDataadd.matter.intakeId;
            noteDataadd.is_important = (noteDataadd.is_important == true ? 1 : 0);
            var list = angular.copy(noteDataadd.linked_contact);
            noteDataadd.linked_contact = [];
            _.forEach(list, function (item) {
                var contact = { 'contact_id': item };
                noteDataadd.linked_contact.push(contact);
            });
            var noteData = angular.copy(noteDataadd);
            if (!noteData.noteCategory) {
                noteData.noteCategory = {
                    notecategory_id: ""
                }
            }
            delete noteData.matter;
            intakeNotesDataService.addNote(noteData)
                .then(function (response) {
                    //getGlobalNotes();
                    //Bug#5278: Filter retainsion issue after adding note fixed
                    $rootScope.$broadcast("noteAdded");
                    notificationService.success('Note added successfully.');
                    self.cancel();
                    //$state.go("globalNotes");
                });
        }

        function getGlobalNotes() {
            self.pageNum = 1;
            return intakeNotesDataService.getGlobalNotes(self.pageNum)
                .then(function (data) {
                    //Store notes list
                    if (data && data.details) {
                        // self.notesList = data.details;
                        $scope.globalNotes.notesList = data.details;
                        _.forEach($scope.globalNotes.notesList, function (note) {
                            note.text = note.text;
                            note.displayText = utils.replaceHtmlEntites(note.text.replace(/<\/?[^>]+>/gi, ''));
                        });
                        self.noteToBeAdded = {};		//Data model for holding new note details				          
                        ///console.log("get global notes call : 138");
                    }
                });
        }

        self.cancel = function () {
            self.contactList1 = [];
            var currentMode = self.noteToBeAdded.mode;
            self.noteToBeAdded = {};
            self.noteToBeAdded = {
                text: undefined,
                noteCategory: {
                    notecategory_id: "",
                    category_name: undefined
                }
            };
            if (currentMode != 'edit') {
                $("#globalNotesAdd").html("")
            }
            //reset note to be edited
            intakeNotesDataService.setNoteToBeEdited({});
            //change the reset callback to the that of the view page
            $scope.globalNotes.isFilterView ?
                resetCallbackHelper.setCallback($scope.globalNotes.reset) :
                resetCallbackHelper.setCallback($scope.globalNotes.resetNotes);

            //set the view
            $scope.globalNotes.openAddContactView = false;
            $scope.globalNotes.isOpenNotesView = currentMode === 'edit';
            $scope.regenrateGrid();
        };

        function getNoteCategories() {
            intakeNotesDataService.getNotesCategories()
                .then(function (data) {

                    self.notesCategories = data;
                    var cat = _.find(self.notesCategories, function (item) {
                        return item.notecategory_id == '';
                    })
                    if (utils.isEmptyObj(cat)) {
                        self.notesCategories.unshift({ 'category_name': undefined, 'notecategory_id': "" });
                    }
                    init();
                }, function (error) {
                    //console.log(error);
                });
        };

        self.getMatterList = function (contactName, migrate) {
            return intakeNotesDataService.getMatterList(contactName, migrate);
        };

        self.formatTypeaheadDisplay = function (matter) {
            if (angular.isUndefined(matter) || utils.isEmptyString(matter)) {
                return undefined;
            }
            var intakeName = angular.isUndefined(matter.intakeName) ? '' : matter.intakeName;
            var name = intakeName + matter.dateIntake;
            return (name);
        };

    }

})();