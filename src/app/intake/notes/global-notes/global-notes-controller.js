(function () {

    'use strict';

    angular
        .module('intake.notes')
        .controller('IntakeGlobalNotesCtrl', GlobalNotesController);

    GlobalNotesController.$inject = ['$rootScope', '$scope', '$timeout', '$filter', 'intakeNotesDataService', '$modal',
        'notification-service', '$state', 'intakeglobalNoteHelper', 'contactFactory',
        'globalConstants', 'mailboxDataService', 'mailboxDataServiceV2', 'masterData', 'modalService', 'matterFactory', '$q', 'notesDataService'];

    function GlobalNotesController($rootScope, $scope, $timeout, $filter, intakeNotesDataService, $modal,
        notificationService, $state, globalNoteHelper, contactFactory,
        globalConstants, mailboxDataService, mailboxDataServiceV2, masterData, modalService, matterFactory, $q, notesDataService) {

        var self = this;
        self.allglobalNoteselected = allglobalNoteselected; // check all global notes
        self.selectAllglobalNotes = selectAllglobalNotes;  // check all global notes
        self.isglobalNotesSelected = isglobalNotesSelected; // check whether global note selected
        self.resetNotes = resetNotes;
        self.printGlobalNote = printGlobalNote;
        self.exportGlobalNote = exportGlobalNote;
        self.openCalender = openCalender;
        self.notesTextLimit = 100;
        self.goToMatter = goToMatter;
        self.isDatesValid = isDatesValid;
        self.myNotes = myNotes;
        self.composeNotesMail = composeNotesMail; // open compose mail popup with selected notes
        self.closeComposeMail = closeComposeMail; // close compose mail popup
        self.composeNotesFromView = composeNotesFromView; //open compose email form view note pop up
        var allMatterNoteSelected = false;
        self.appliedFilter = false;
        self.getLinkContactFilter = getLinkContactFilter;
        self.isUser = true;
        self.searchRetain = searchRetain; //Bug#7326
        self.serachInput = "";
        self.firmData = { API: "PHP", state: "mailbox" };
        // self.selectedItems =[];
        //US#4713 disable add edit delete 
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.email_subscription = gracePeriodDetails.email_subscription;  // role email subscription
        self.sidebarComments = []; //array to store sidebar post
        self.sidebarForCategories = { "notecategory_id": "1002", "category_name": "sidebar" };
        self.clientMsngrForCategories = { "notecategory_id": "1003", "category_name": "client messenger" };
        var request = masterData.fetchUserRole();
        $q.all([request]).then(function (values) {
        });
        function preInit() {	//Get notes and categories
            init();
            var currentNotesView = sessionStorage.getItem('intakeglobal-note-view');
            if (!currentNotesView || currentNotesView == "my") {
                self.myNotes();
            } else {
                self.allNotes();
            }

            getUserEmailSignaure(); // make user signature for email

            self.globalNotesGrid = {
                headers: [],
                selectedItems: []
            }

            /**
             * firm basis module setting 
             */
            self.firmData = JSON.parse(localStorage.getItem('firmSetting'));
        };
        //Bug#5278: Filter retainsion issue after adding note fixed
        $rootScope.$on("noteAdded", function () {
            var type = sessionStorage.getItem('intakeglobalNotesType');
            if (type == 'allNotes') {
                self.allNotes();

            } else {
                self.myNotes();
            }
        });

        var permissions = masterData.getPermissions();
        self.notesPermissions = _.filter(permissions[0].permissions, function (per) {
            if (per.entity_id == '5') {
                return per;
            }
        });

        //Bug#7326 : search retaintion for global notes
        function searchRetain() {
            var globalNotesText = self.serachInput;
            sessionStorage.setItem("intakeglobalNotesText", globalNotesText);
            if (utils.isEmptyString(self.serachInput)) {
                $scope.regenrateGrid();
            }
        }

        $scope.regenrateGrid = function () {
            var notesCopy = angular.copy(self.notesList);
            self.notesList = [];
            self.notesList = angular.copy(notesCopy);
        }

        function isDatesValid() {
            if ($('#addedonStartdateError').css("display") == "block" ||
                $('#addedonEnddateError').css("display") == "block") {
                return true;
            }
            else {
                return false;
            }
        }

        function getLinkContactFilter(name) {
            if (utils.isNotEmptyVal(name)) {
                var postObj = {};
                postObj.type = globalConstants.allTypeList;
                postObj.first_name = utils.isNotEmptyVal(name) ? name : '';
                postObj.page_Size = 250


                matterFactory.getContactsByName(postObj, true)
                    .then(function (response) {
                        var data = response.data;
                        self.contact = [];
                        contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
                        contactFactory.setNamePropForContactsOffDrupal(data);
                        _.forEach(data, function (item) {
                            if (item.contact_type != "Global") {
                                self.contact.push(item);
                            }
                        });

                        var allLinkedContactId = _.pluck(self.currentFilter.linked_contact, 'contact_id');
                        var responseData = angular.copy(data);
                        _.forEach(responseData, function (item, index) {
                            _.forEach(allLinkedContactId, function (it) {
                                if (item.contact_id == it) {
                                    data.splice(index, 1);
                                }
                            })
                        })
                        self.contact = data;


                        if (utils.isNotEmptyVal(self.contact)) {
                            self.contact = _.uniq(self.contact, function (item) {
                                return item.contactid;
                            });
                        }
                    }, function (error) {
                    });
            } else {
                self.contact = [];
            }
        }

        function resetNotes() {
            //persist notes filter
            sessionStorage.setItem("intakeglobalNotesFilters", JSON.stringify({}));
            sessionStorage.setItem("intakeglobalNotesText", '');
            init();
            var type = sessionStorage.getItem('intakeglobalNotesType');
            if (type == 'allNotes') {
                self.allNotes();

            } else {
                self.myNotes();
            }
            getNoteCategories();
        }

        function init() {
            self.notesList = [];  //Data model for holding list of matter notes        
            self.noteToBeAdded = {};  //Data model for holding new note details
            self.currentView = utils.isNotEmptyVal(sessionStorage.getItem("intakeglobal-note-grid-view")) ? sessionStorage.getItem("intakeglobal-note-grid-view") : "LIST";
            self.notesCategories = [];
            self.contact = [];
            self.users = [];
            sessionStorage.globalNotesText = "";
            self.isCollapsed = true;
            self.serachInput = "";
            self.currentPageNum = 1;
            self.currentDateFilter = {};
            self.matterinfo = {};
            self.isDataAvailable = false;
            self.isFilterView = false;
            self.showeditnote = false;
            self.showMoreAll = true;
            self.addedOnVal = '',
                self.addedOnArr = [
                    { "name": "YESTERDAY", "val": "Yesterday" },
                    { "name": "TODAY", "val": "Today" },
                    { "name": "LAST_WEEK", "val": "Last Week" },
                    { "name": "MONTH_AGO", "val": "Going Back a Month" },
                    { "name": "CUSTOM_DATE", "val": "Custom Dates" }];

            self.currentFilter = {
                catFilter: [],
                uidFilter: [],
                tab: (sessionStorage.getItem('intakeglobalNotesType') == "myNotes") ? 'myglobalnotes' : 'allglobalnotes',
                impFilter: 0,
                start: '',
                end: '',
                s_custom: '',
                e_custom: '',
                linked_contact: [],
            };

            self.matterList = [];
            self.tags = [];
            self.openAddContactView = false;
            self.isOpenNotesView = false;
            self.note = {};
            self.notesLimit = 9;
            setSelectedFilters();
            self.error = false;
            self.lengthHold = false;
            //Bug#7326
            var globalNotesText = sessionStorage.getItem("intakeglobalNotesText");
            if (utils.isNotEmptyVal(globalNotesText)) {
                self.serachInput = globalNotesText;
            }
        }

        $scope.$watch(function () {
            if (utils.isNotEmptyVal(self.currentFilter.matterid) || self.currentFilter.catFilter.length > 0 ||
                self.currentFilter.uidFilter.length > 0 || self.currentFilter.impFilter != 0 || utils.isNotEmptyVal(self.addedOnVal) || self.tags.length > 0 || utils.isNotEmptyVal(self.currentFilter.linked_contact)) {
                self.enableApply = false;
            } else {
                self.enableApply = true;
            }
        })

        // select all global notes list
        function selectAllglobalNotes(isSelected) {
            if (isSelected === true) {
                self.globalNotesGrid.selectedItems = angular.copy(self.notesList);
            } else {
                self.globalNotesGrid.selectedItems = [];
            }
        }

        self.openContactCard = function (contact) {
            contactFactory.displayContactCard1(contact.contact_id, contact.edited, contact.contact_type);
            contact.edited = false;
        };

        // Check global notes is selected or not
        function isglobalNotesSelected(globalNoteid) {
            var uids = _.pluck(self.globalNotesGrid.selectedItems, 'note_id');
            if (self.globalNotesGrid.selectedItems.length < self.lengthHold && allMatterNoteSelected == true) {
                self.globalNotesGrid.selectAll = false;
                allMatterNoteSelected = false;
            }
            return uids.indexOf(globalNoteid) > -1;
        }

        // get all selected global notes ids 
        function allglobalNoteselected() {
            if (utils.isEmptyVal(self.notesList)) {
                return false;
            }
            return self.globalNotesGrid.selectedItems.length === self.notesList.length;
        }

        function setSelectedFilters() {
            var selectedFilters = sessionStorage.getItem("intakeglobalNotesFilters");
            if (utils.isNotEmptyVal(selectedFilters)) {
                try {
                    self.selectedFilters = JSON.parse(selectedFilters);
                    self.currentFilter = angular.extend({}, self.currentFilter, self.selectedFilters);
                    self.currentDateFilter = self.selectedFilters.currentDateFilter;
                    self.addedOnVal = self.currentDateFilter;
                    _.forEach(self.selectedFilters.catFilter, function (value, key) {
                        if (utils.isNotEmptyVal(value)) {
                            if (value == '13' && self.selectedFilters.catFilter.indexOf('1001') == -1) {

                                self.selectedFilters.catFilter.push('1001');
                            };
                        }

                    })
                    getNoteCategories()
                        .then(getUsers)
                        .then(function () {
                            self.tags = globalNoteHelper
                                .prepareTags(self.selectedFilters, self.notesCategories,
                                    self.users, self.currentDateFilter, self.tags);
                            setGridHeight();
                        });
                } catch (e) { self.selectedFilters = {}; }
            } else {
                self.selectedFilters = {};
                getNoteCategories();
                getUsers();
            }

            self.matterId = utils.isEmptyVal(self.selectedFilters.matterid) ?
                'global' : self.selectedFilters.matterid.intakeId;
        }

        function setExistingFilters() {
            var existingFilters = sessionStorage.getItem("intakeglobalNotesFilters");
            if (utils.isNotEmptyVal(existingFilters)) {
                self.selectedFilters = JSON.parse(existingFilters);
                self.currentFilter = angular.extend({}, self.currentFilter, self.selectedFilters);
                self.currentDateFilter = self.selectedFilters.currentDateFilter;
                self.addedOnVal = self.currentDateFilter;

            } else {
                self.selectedFilters = {};
            }

            self.matterId = utils.isEmptyVal(self.selectedFilters.matterid) ?
                'global' : self.selectedFilters.matterid.intakeId;
            self.applyFilters(self.selectedFilters);
        }

        //function to go on specific intake 
        function goToMatter(intakeId) {
            $state.go('intake-overview', { intakeId: intakeId }, { reload: true });
        }

        /*** Service call Functions ***/
        function myNotes() {
            self.showMoreAll = true;
            self.loaderFlagStatus = false;
            self.currentPageNum = 1;
            self.currentFilter.tab = "myglobalnotes";
            sessionStorage.setItem('intakeglobal-note-view', "my");
            if (self.globalNotesGrid && self.globalNotesGrid.selectedItems) {
                self.globalNotesGrid.selectedItems = [];
            }
            sessionStorage.setItem('intakeglobalNotesType', "myNotes");
            self.notesList = [];
            intakeNotesDataService.getFilteredMyNotes(self.matterId, self.selectedFilters, self.currentPageNum)
                .then(function (data) {
                    self.isDataAvailable = true;

                    //hide more and all
                    if (self.currentPageNum == 1 && data.notes.length < 9) {
                        self.showMoreAll = false;
                    }

                    //Store notes list
                    if (data && data.notes) {
                        self.notesList = data.notes;
                        self.totalNotesCount = data.totalCount;

                        _.forEach(self.notesList, function (note) {
                            if (utils.isEmptyVal(note.mattername)) {
                                note.mattername = "";
                            }
                            if (utils.isEmptyVal(note.fname) || note.fname == "null") {
                                note.fname = "";
                            }
                            if (utils.isEmptyVal(note.lname) || note.lname == "null") {
                                note.lname = "";
                            }

                            var text = note.plaintext;
                            note.displayText = utils.replaceQuoteWithActual(text);
                            notesDataService.setSearchableData(note);
                        });
                        setGridHeight();
                    }
                    self.loaderFlagStatus = true;
                });
        }

        /*** Service call Functions ***/
        self.allNotes = function () {
            self.showMoreAll = true;
            self.loaderFlagStatus = false;
            self.currentPageNum = 1;
            self.currentFilter.tab = "allglobalnotes";
            sessionStorage.setItem('intakeglobal-note-view', "all");
            if (self.globalNotesGrid && self.globalNotesGrid.selectedItems) {
                self.globalNotesGrid.selectedItems = [];
            }
            sessionStorage.setItem('intakeglobalNotesType', "allNotes");
            self.notesList = [];
            intakeNotesDataService.getFilteredAllNotes(self.matterId, self.selectedFilters, self.currentPageNum)
                .then(function (data) {
                    self.isDataAvailable = true;

                    //hide more and all
                    if (self.currentPageNum == 1 && data.notes.length < 9) {
                        self.showMoreAll = false;
                    }

                    //Store notes list
                    if (data && data.notes) {
                        self.notesList = data.notes;
                        self.totalNotesCount = data.totalCount;

                        _.forEach(self.notesList, function (note) {
                            if (utils.isEmptyVal(note.mattername)) {
                                note.mattername = "";
                            }
                            if (utils.isEmptyVal(note.fname) || note.fname == "null") {
                                note.fname = "";
                            }
                            if (utils.isEmptyVal(note.lname) || note.lname == "null") {
                                note.lname = "";
                            }
                            var text = note.plaintext;
                            note.displayText = utils.replaceQuoteWithActual(text);
                            notesDataService.setSearchableData(note);
                        });
                        setGridHeight();
                    }
                    self.loaderFlagStatus = true;
                });
        }

        function getNoteCategories() {
            return intakeNotesDataService.getNotesCategories()
                .then(function (data) {
                    self.notesCategories = data;
                    self.notesCategories.push(self.sidebarForCategories);
                    self.notesCategories.push(self.clientMsngrForCategories);
                    // add email/sidebar as categories
                    self.notesCategories.push({ 'category_name': "{Blank}", 'notecategory_id': "blank" });
                    self.notesCategories = _.uniq(self.notesCategories, function (item) {
                        return item.category_name;
                    });
                }, function (error) { });
        };

        // get note users based on matter id
        function getUsers() {
            return contactFactory.getUsersList()
                .then(function (data) {
                    self.users = globalNoteHelper.setUserList(data);
                }, function (error) {
                    //console.log(error);
                });
        }

        /*** Event Handlers ***/
        self.setCurrentView = function (viewName) {
            if (!self.appliedFilter) {
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
                    tab: sessionStorage.getItem('intakeglobalNotesType') == "myNotes" ? 'myglobalnotes' : 'allglobalnotes'
                };
            }

            self.isFilterView = false;
            self.currentView = viewName;
            sessionStorage.setItem("intakeglobal-note-grid-view", self.currentView);
            self.globalNotesGrid.selectedItems = [];
            setGridHeight();
        };

        self.getMoreNotes = function (all) {

            self.currentPageNum++;
            self.notesLimit += 9;
            if (all) {
                self.allNotes = true;
            }

            self.matterId = (self.matterId == 'global' || _.isUndefined(self.matterId)) ? 'global' : self.matterId;
            if (self.currentFilter.tab == "allglobalnotes") {
                intakeNotesDataService.getFilteredAllNotes(self.matterId, self.selectedFilters, self.currentPageNum)
                    .then(function (data) {

                        if (data.count == 0) {
                            notificationService.error("No more notes found");
                            self.showMoreAll = false;
                        }

                        self.notesList = utils.isEmptyVal(all) ? self.notesList : [];
                        //add new notes in list
                        if (data && data.notes) {
                            angular.forEach(data.notes, function (noteObj, index) {
                                var text = noteObj.plaintext;
                                noteObj.displayText = utils.replaceQuoteWithActual(text);
                                notesDataService.setSearchableData(noteObj);
                                self.notesList.push(noteObj);
                            });
                        }
                    });
            }
            else {

                intakeNotesDataService.getFilteredMyNotes(self.matterId, self.selectedFilters, self.currentPageNum, '')

                    .then(function (data) {
                        self.notesList = utils.isEmptyVal(all) ? self.notesList : [];

                        if (data.count == 0) {
                            notificationService.error("No more notes found");
                            self.showMoreAll = false;
                        }

                        //add new notes in list
                        if (data && data.notes) {
                            angular.forEach(data.notes, function (noteObj, index) {
                                var text = noteObj.plaintext;
                                noteObj.displayText = utils.replaceQuoteWithActual(text);
                                notesDataService.setSearchableData(noteObj);
                                self.notesList.push(noteObj);
                            });
                        }
                    });
            }

        };

        self.setSelectedCateory = function (item) {
            self.noteToBeAdded["notecategory_id"] = item["notecategory_id"];
        };

        self.openFilters = function () {
            self.isFilterView = !self.isFilterView;
            self.globalNotesGrid.selectedItems = [];
            if (self.isFilterView) {
                sessionStorage.setItem("intakeglobalNotesFilters", JSON.stringify(self.selectedFilters));
            }
            else {
                setExistingFilters();
            }
        };

        self.openAddView = function () {
            self.openAddContactView = true;
            self.globalNotesGrid.selectedItems.length = [];
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
            if (utils.isEmptyVal(timestamp)) {
                return;
            }

            if (utils.isNotEmptyVal(formatStr)) {
                return moment.unix(timestamp).format(formatStr);
            }
            else {
                return moment.unix(timestamp).format("MM/DD/YYYY hh:mm A");
            }
        };

        self.getCateogry = function (note) {
            if (note.category_name == null || note.category_name == 'null') {
                if (note.category_name)
                    return note.category_name.toUpperCase();
                else
                    return "Note";
            }

            return note.category_name;
        };

        // filter from conversation view
        self.applyCatFilters = function (convCatFilter) {
            self.selectedFilters.catFilter = convCatFilter.notecategory_id;
            //persist notes filter
            sessionStorage.setItem("intakeglobalNotesFilters", JSON.stringify(self.selectedFilters));

            intakeNotesDataService.getFilteredNotes('global', self.selectedFilters, self.currentPageNum)
                .then(function (data) {
                    if (data && data.notes) {
                        self.notesList = data.notes;
                    }
                    self.notesLimit = 9;
                    _.forEach(self.notesList, function (noteObj) {
                        var text = noteObj.plaintext;
                        noteObj.displayText = utils.replaceQuoteWithActual(text);
                        notesDataService.setSearchableData(noteObj);
                    });
                });
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
            self.isFilterView = false;
            self.currentPageNum = 1;
            self.tags = [];
            self.isCollapsed = true;
            self.isDataAvailable = false;
            self.currentPageNum = 1;
            self.notesList = [];
            self.selectedFilters = {};
            self.convCatFilter = '';
            self.serachInput = '';
            self.currentDateFilter = {};
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
                tab: sessionStorage.getItem('intakeglobalNotesType') == "myNotes" ? 'myglobalnotes' : 'allglobalnotes'
            };
            self.matterId = "global";
            sessionStorage.setItem("intakeglobalNotesText", '');
            self.addedOnVal = "";
            //persist notes filter
            sessionStorage.setItem("intakeglobalNotesFilters", JSON.stringify(self.selectedFilters));
            if (self.globalNotesGrid && self.globalNotesGrid.selectedItems) {
                self.globalNotesGrid.selectedItems = [];
            }

            if (self.currentFilter.tab == "myglobalnotes") {
                myNotes();
            } else {
                self.allNotes();
            }

            setGridHeight();

        }

        function setGridHeight() {
            $timeout(function () {
                if (self.currentView == "GRID") {
                    var screenHeight = $("#nav").height();
                    var heightForGrid = screenHeight - ($("#gridViewNotes").position().top + $("#nav").position().top);
                    var gridHeight = heightForGrid - $("#globalnotesmoreLink").height();
                    $('#gridViewNotes').css("max-height", gridHeight + "px");
                } else {
                    // var screenHeight = $("#nav").height();
                    // var heightForGrid = screenHeight - ($('#listViewNotes').offset().top - $('#nav').offset().top);
                    // var gridHeight = (heightForGrid - ($("#listViewHeader").height() * 2));
                    // gridHeight = gridHeight - 10;
                    // $('#listViewNotes').css("max-height", gridHeight + "px");
                }
            }, 100);
        }

        self.setDateFilter = function (param) {
            self.currentDateFilter = param;
            self.addedOnVal = param;
            globalNoteHelper.setDateFilter(param, self.currentFilter);
            self.selectedFilters = angular.extend({}, self.currentFilter, self.selectedFilters);
        };

        self.reset = function () {
            self.serachInput = "";
            self.addedOnVal = "";
            self.currentDateFilter = {};

            self.currentFilter = {
                catFilter: [],
                categoryFilter: [],
                linked_contact: [],
                uidFilter: [],
                impFilter: 0,
                start: '',
                end: '',
                s_custom: '',
                e_custom: '',
                tab: self.currentFilter.tab
            };
            self.selectedFilters = {};
            sessionStorage.setItem("intakeglobalNotesFilters", JSON.stringify(self.selectedFilters));
            self.tags = [];
        };

        self.cancel = function () {
            self.isFilterView = false;
            self.openAddContactView = false;
        };

        self.editNote = function (note) {
            self.showeditnote = true;
        }

        self.applyFilters = function (currentFilter) {
            //Bug#8211
            self.showMoreAll = true;
            self.appliedFilter = true;
            if (angular.isDefined(currentFilter.catFilter)) {
                currentFilter.catFilter = currentFilter.catFilter[0] == '1001' ? '' : currentFilter.catFilter;
            }

            if (self.currentDateFilter == 'CUSTOM_DATE') {
                getUTCDates(currentFilter);
                if (!isDateRangeValid(currentFilter)) {
                    notificationService.error("Invalid date range.");
                    return;
                }
            }
            if (!_.isUndefined(currentFilter.matterid)) {
                if ((currentFilter.matterid != "") && _.isUndefined(currentFilter.matterid.intakeId)) {
                    notificationService.error("Invalid intake selected.");
                    return;
                }
            }
            self.isFilterView = false;
            self.currentPageNum = 1;
            if (_.isUndefined(currentFilter.matterid) || currentFilter.matterid == "") {
                self.matterId = 'global';
            } else {
                self.matterId = currentFilter.matterid.intakeId;
            }
            self.selectedFilters = angular.copy(currentFilter);
            self.selectedFilters.tab = (sessionStorage.getItem('intakeglobalNotesType') == "myNotes") ? 'myglobalnotes' : 'allglobalnotes';
            self.currentFilter.tab = self.selectedFilters.tab;
            //persist notes filter
            self.selectedFilters.currentDateFilter = self.addedOnVal;
            _.forEach(self.selectedFilters.catFilter, function (value, key) {
                if (utils.isNotEmptyVal(value)) {
                    if (value == '13' && self.selectedFilters.catFilter.indexOf('1001') == -1) {

                        self.selectedFilters.catFilter.push('1001');
                    };
                }

            })
            sessionStorage.setItem("intakeglobalNotesFilters", JSON.stringify(self.selectedFilters));
            //if email category checked then along with it email is also pushed into object

            // find the selected filters and push to tags to display
            self.tags = globalNoteHelper.prepareTags(self.selectedFilters,
                self.notesCategories, self.users, self.currentDateFilter, self.tags);
            if (self.selectedFilters.tab == 'myglobalnotes') {
                intakeNotesDataService.getFilteredMyNotes(self.matterId, self.selectedFilters, self.currentPageNum)

                    .then(function (data) {

                        if (self.currentPageNum == 1 && data.notes.length < 9) {
                            self.showMoreAll = false;
                        }

                        if (data && data.notes) {
                            self.notesList = data.notes;
                            self.totalNotesCount = data.totalCount;
                        }
                        _.forEach(self.notesList, function (noteObj) {
                            var text = noteObj.plaintext;
                            noteObj.displayText = utils.replaceQuoteWithActual(text);
                            notesDataService.setSearchableData(noteObj);
                        });
                    });
            }
            else {
                intakeNotesDataService.getFilteredAllNotes(self.matterId, self.selectedFilters, self.currentPageNum)

                    .then(function (data) {
                        if (data && data.notes) {
                            self.notesList = data.notes;
                            self.totalNotesCount = data.totalCount;
                        }
                        _.forEach(self.notesList, function (noteObj) {
                            var text = noteObj.plaintext;
                            noteObj.displayText = utils.replaceQuoteWithActual(text);
                            notesDataService.setSearchableData(noteObj);
                        });
                    });
            };

            setGridHeight();

        };

        function isDateRangeValid(filter) {
            if (utils.isNotEmptyVal(filter.start) && utils.isNotEmptyVal(filter.end)) {
                var start = moment.unix(filter.start);
                var end = moment.unix(filter.end);

                return start.isBefore(end);
            }
            return false;
        }

        self.getMatterList = function (name, migrate) {
            return intakeNotesDataService.getMatterList(name, migrate);
        }

        //in our display value and model value are different for the input box
        //therefore we are formatting our display value based on the model value of the input box
        self.formatTypeaheadDisplay = function (intake) {
            if (angular.isUndefined(intake) || utils.isEmptyString(intake)) {
                return undefined;
            }
            var name = angular.isUndefined(intake.intakeName) ? '' : intake.intakeName;
            return (name);
        }

        self.tagCancelled = function (cancelled) {
            //if email category is checked then add key,value pair into existing object  
            if (cancelled.key == 13) {
                var newKey = "enote";
                var newValue = "1001";
                cancelled[newKey] = newValue;
            }
            globalNoteHelper.spliceFilter(cancelled, self.currentFilter);
            globalNoteHelper.spliceFilter(cancelled, self.selectedFilters);
            switch (cancelled.key) {
                case 'MONTH_AGO':
                case 'LAST_WEEK':
                case 'TODAY':
                case 'YESTERDAY':
                case 'CUSTOM_DATE':
                    self.currentDateFilter = {};
                    self.addedOnVal = "";
                    break;
            }
            self.selectedFilters.tab = self.currentFilter.tab;
            self.applyFilters(self.selectedFilters);
        }

        /* View note*/
        self.deleteMode = false;

        self.openNotesView = function (note) {
            if (note.type == 'email') {
                if (self.firmData.API != "PHP") {
                    mailboxDataServiceV2.getNoteThread(note.note_id).then(function (res) {
                        if (utils.isNotEmptyVal(res.data)) {
                            self.note = note;

                            _.forEach(res.data, function (mailKey) {
                                var recipientsArr = [];
                                var ccRecipientsArr = [];
                                // To mail
                                _.forEach(mailKey.recipients, function (recipient_key) {
                                    recipientsArr.push(recipient_key.address);
                                });
                                // cc mail
                                _.forEach(mailKey.cc_recipients, function (cc_recipient_key) {
                                    ccRecipientsArr.push(cc_recipient_key.address);
                                });

                                mailKey.recipients_mail = recipientsArr.toString();
                                mailKey.cc_recipients_mail = ccRecipientsArr.toString();
                                mailKey.message = mailKey.messagebody;
                                mailKey.from_mail_user = mailKey.sender.address;
                                mailKey.from_mail = mailKey.sender.address;
                                mailKey.createddate = mailKey.internaldate;
                            });

                            self.note.emailMessages = res.data;
                            self.openNotesViewPopup(self.note);
                        } else { self.note.emailMessages = []; }
                    });
                } else {
                    mailboxDataService.getMailthread(note.note_id)
                        .then(function (res) {
                            if (utils.isNotEmptyVal(res.data)) {
                                self.note = note;

                                _.forEach(res.data.message, function (mailKey) {
                                    var recipientsArr = [];
                                    var ccRecipientsArr = [];
                                    // To mail
                                    _.forEach(mailKey.recipients, function (recipient_key) {
                                        recipientsArr.push(recipient_key.mail_to);
                                    });
                                    // cc mail
                                    _.forEach(mailKey.cc_recipients, function (cc_recipient_key) {
                                        ccRecipientsArr.push(cc_recipient_key.mail_to);
                                    });

                                    mailKey.recipients_mail = recipientsArr.toString();
                                    mailKey.cc_recipients_mail = ccRecipientsArr.toString();

                                });

                                self.note.emailMessages = res.data.message;
                                self.openNotesViewPopup(self.note);
                            } else { self.note.emailMessages = []; }
                        });
                }
            } else {
                self.note = note;
                self.openNotesViewPopup(self.note);
            }
        }

        // //US#8330
        $scope.$on('composeEmailFromContact', function (event, data) {
            if ((window.isDrawerOpen)) {
                self.compose = true;
                var html = "";
                html += (self.signature == undefined) ? '' : self.signature;
                self.composeEmail = html;
                $rootScope.updateComposeMailMsgBody(self.composeEmail, '', '', '', 'contactEmail', data);
            }

        });

        //func to open selected note from view-note.html
        function composeNotesFromView(note) {
            $rootScope.composeNotesEmail = "";
            var selectedNote = angular.copy(note);
            selectedNote.text = _.isNull(selectedNote.text) ? '' : selectedNote.text;
            var printSelectedGlobalNotes = [];
            printSelectedGlobalNotes.push(selectedNote);
            var html = "";
            html += notesDataService.composemailHtml(printSelectedGlobalNotes, true);
            html += (self.signature == undefined) ? '' : self.signature;
            self.composeEmail = angular.copy(html);
            $rootScope.composeNotesEmail = angular.copy(self.composeEmail);
            $rootScope.updateComposeMailMsgBody(self.composeEmail);
            self.compose = true;
            // set rootscope selected note DOM for compose mail
        }

        self.openNotesViewPopup = function (notedata) {
            var modalInstance = $modal.open({
                templateUrl: 'app/notes/global-notes/partials/view-global-note.html',
                controller: 'IntakeViewGlobalNoteCtrl as ViewGlobalNoteCtrl',
                windowClass: 'medicalIndoDialog static-new-scrollbar',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    NoteData: function () {
                        return notedata;
                    },
                }
            });
            modalInstance.result.then(function (response) {
                if (response) {
                    if (response.composeEmail) {
                        notedata.threadMessages = response.note.threadMessages;
                        composeNotesFromView(notedata);
                    }
                    if (response.edited) {
                        notificationService.success('Note edited successfully.');
                        var type = sessionStorage.getItem('intakeglobalNotesType');
                        self.notesList = [];
                        if (type == 'allNotes') {
                            self.allNotes();

                        } else {
                            self.myNotes();
                        }
                        return;
                    }
                    if (response == true) {
                        notificationService.success('Note deleted successfully.');
                        self.globalNotesGrid.selectedItems = [];
                        var type = sessionStorage.getItem('intakeglobalNotesType');
                        if (type == 'allNotes') {
                            self.allNotes();

                        } else {
                            self.myNotes();
                        }
                        return;
                    }

                    if (response.error) {
                        notificationService.error('An error occurred. Please try later.');
                        return;
                    }

                }
            }, function () {
            });
        }

        // selected global note open with model
        self.openGlobalNotesEdit = function (NoteData) {
            var userrole = masterData.getUserRole();
            self.isUser = (userrole.uid == NoteData.user.user_id) || (userrole.role == globalConstants.adminrole) || (userrole.is_admin == '1') ? false : true; //US#8097
            if (self.isUser) {
                self.globalNotesGrid.selectedItems = [];
                return notificationService.error('Cannot Edit Note of another user');
            }
            if (NoteData.type == 'email' || NoteData.type == 'sidebar' || NoteData.type == 'Client Messenger') {
                (NoteData.type == 'email') ? notificationService.error("Can't Edit Email Note") : (NoteData.type == 'sidebar') ? notificationService.error("Can't Edit Sidebar Note") : notificationService.error("Can't Edit Client Messenger Note");
                self.globalNotesGrid.selectedItems = [];
                return false;
            } else {
                var modalInstance = $modal.open({
                    templateUrl: 'app/notes/global-notes/partials/edit-global-note.html',
                    controller: 'IntakeViewGlobalNoteCtrl as ViewGlobalNoteCtrl',
                    windowClass: 'medicalIndoDialog static-new-scrollbar',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        NoteData: function () {
                            return NoteData;
                        },
                    }
                });

                modalInstance.result.then(function (response) {
                    if (response) {

                        if (response.edited) {
                            notificationService.success('Note edited successfully.');
                            var type = sessionStorage.getItem('intakeglobalNotesType');
                            self.notesList = [];
                            if (type == 'allNotes') {
                                self.allNotes();

                            } else {
                                self.myNotes();
                            }
                            self.globalNotesGrid.selectedItems = [];
                            return;
                        }

                        if (response.error) {
                            notificationService.error('An error occurred. Please try later.');
                            return;
                        }

                    }
                }, function () {
                });
            }
        }

        //Delete function for conversation view
        self.deleteNotes = function (note, selectedNotes, filterNotes) {

            if (utils.isNotEmptyVal(self.serachInput) && allglobalNoteselected()) {
                selectedNotes = filterNotes;
            }
            var notesTobeDeleted = [];
            var userrole = masterData.getUserRole();
            self.isUser = (userrole.uid == note.user.user_id) || (userrole.role == globalConstants.adminrole) || (userrole.is_admin == '1') ? false : true; //US#8097
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
                self.globalNotesGrid.selectedItems = [];
                return false;
            } else {
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
                            self.globalNotesGrid.selectedItems = [];
                            notificationService.success('Note deleted successfully.');
                            self.notesList = [];
                            var type = sessionStorage.getItem('intakeglobalNotesType');
                            if (type == 'allNotes') {
                                self.allNotes();

                            } else {
                                self.myNotes();
                            }
                        });
                })
            }
        }

        //Delete note
        self.doDeleteNote = function () {
            intakeNotesDataService.deleteNote(self.note.note_id)
                .then(function (response) {
                    self.deleteMode = false;
                    self.isOpenNotesView = false;
                    notificationService.success('Note deleted successfully.');
                    self.applyFilters(self.selectedFilters);
                });
        };

        self.deleteNote = function () {
            self.deleteMode = true;
        };

        self.cancelDelete = function () {
            self.deleteMode = false;
            self.isOpenNotesView = false;
        };

        self.cancelNoteView = function () {
            self.isOpenNotesView = false;
        };

        function printGlobalNote() {
            var catArr = [];
            var selectedFilter = angular.copy(self.selectedFilters);
            if (angular.isDefined(selectedFilter) && angular.isDefined(selectedFilter.catFilter)) {
                _.forEach(self.notesCategories, function (singleCat) {
                    _.forEach(selectedFilter.catFilter, function (singleFilterCat) {
                        if (singleCat.notecategory_id == singleFilterCat) {
                            catArr.push(singleCat);
                        }
                    })
                })
            }

            var selectedFilter = angular.copy(self.selectedFilters);

            var eventClick;

            switch (self.currentFilter.tab) {
                case "myglobalnotes": { eventClick = 1; break; };
                case "allglobalnotes": { eventClick = 0 }
            };

            if (self.currentView == "CONV") {
                if (self.globalNotesGrid.selectedItems.length == 0) {
                    var printSelectedGlobalNotes = self.notesList;
                } else {
                    printSelectedGlobalNotes = self.globalNotesGrid.selectedItems;
                }
            } else {
                printSelectedGlobalNotes = self.notesList;
            }
            selectedFilter.catFilter = catArr;
            var notesList = angular.copy(self.notesList);
            var users = angular.copy(self.users);
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
            globalNoteHelper.printGlobalNote(selectedFilter, angular.copy(printSelectedGlobalNotes), users, eventClick);
            self.globalNotesGrid.selectedItems = [];

        }

        function exportGlobalNote() {

            var filter = {};

            if (utils.isNotEmptyVal(self.selectedFilters.catFilter)) {
                filter.catFilter = self.selectedFilters.catFilter;
            } else {
                filter.catFilter = '';
            }

            if (utils.isNotEmptyVal(self.currentFilter.tab)) {
                filter.tab = self.currentFilter.tab;
            } else {
                filter.tab = self.selectedFilters.tab;
            }

            if (utils.isNotEmptyVal(self.selectedFilters.uidFilter)) {
                filter.uidFilter = self.selectedFilters.uidFilter.toString();
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

            if (utils.isNotEmptyVal(self.selectedFilters.impFilter) && self.selectedFilters.impFilter != 0) {
                filter.impFilter = (self.selectedFilters.impFilter) ? 1 : 0;
            } else {
                filter.impFilter = '';
            }

            filter.matterId = utils.isNotEmptyVal(self.selectedFilters.matterid) ?
                self.selectedFilters.matterid.intakeId : '';
            if (utils.isNotEmptyVal(self.selectedFilters.linked_contact)) {
                filter.contactIds = self.selectedFilters.linked_contact;
            } else {
                filter.contactIds = '';
            }

            self.matterId = 'global';
            intakeNotesDataService.exportMatterNotes(filter, self.matterId)
                .then(function (response) {
                    utils.downloadFile(response.data, "GlobalIntakeNotes.xlsx", response.headers("Content-Type"));

                })
        }

        function openCalender($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }

        function getUTCDates(filters) {
            if (angular.isDefined(filters)) {
                if (utils.isNotEmptyVal(filters.e_custom) && utils.isNotEmptyVal(filters.s_custom)) {
                    var toDate = moment.unix(filters.e_custom).endOf('day');
                    toDate = toDate.utc();
                    toDate = toDate.toDate();
                    toDate = new Date(toDate);
                    filters.end = moment(toDate.getTime()).unix();

                    var fromDate = moment.unix(filters.s_custom).startOf('day');
                    fromDate = fromDate.utc();
                    fromDate = fromDate.toDate();
                    fromDate = new Date(fromDate);
                    filters.start = moment(fromDate.getTime()).unix();
                } else {
                    filters.start = "";
                    filters.end = "";
                }
            }
        }

        // compose mail with selected notes
        function composeNotesMail() {
            $rootScope.composeNotesEmail = "";
            var printSelectedGlobalNotes = [];
            // push selected note id into object   
            _.forEach(self.globalNotesGrid.selectedItems, function (key) {
                printSelectedGlobalNotes.push(_.find(self.notesList, function (note) {
                    return note.note_id == key.note_id;
                }));
            });
            var html = "";
            html += notesDataService.composemailHtml(printSelectedGlobalNotes, true);
            html += (self.signature == undefined) ? '' : self.signature;
            self.composeEmail = angular.copy(html);
            $rootScope.composeNotesEmail = angular.copy(self.composeEmail);
            $rootScope.updateComposeMailMsgBody(self.composeEmail);
            self.compose = true;
        }

        // Get event call from mailbox controller for close compose popup
        $rootScope.$on("callCloseComposeMail", function () {
            closeComposeMail();
        });

        // Close compose mail popup
        function closeComposeMail() {
            self.compose = false;
            self.globalNotesGrid.selectedItems = [];
        }

        /*Get email signature if user*/
        function getUserEmailSignaure() {
            mailboxDataService.emailSignature()
                .then(function (data) {
                    if (utils.isNotEmptyVal(data.data)) {
                        self.signature = data.data[0];
                        self.signature = '<br/><br/>' + self.signature;
                    }
                });
        }

        preInit();
    }
})();

(function () {

    'use strict';

    angular
        .module('intake.notes')
        .controller('IntakeViewGlobalNoteCtrl', IntakeViewGlobalNoteCtrl);

    IntakeViewGlobalNoteCtrl.$inject = ['intakeNotesDataService', '$modalInstance', 'globalConstants', 'NoteData', 'masterData', '$state', 'matterFactory', 'contactFactory', 'notesDataService', '$scope', '$filter'];

    function IntakeViewGlobalNoteCtrl(intakeNotesDataService, $modalInstance, globalConstants, NoteData, masterData, $state, matterFactory, contactFactory, notesDataService, $scope, $filter) {
        var self = this;
        $scope.isIntake = true;
        self.note = {
            noteCategory: {
                notecategory_id: ""
            }
        };
        self.noteToEdit = {
            noteCategory: {
                notecategory_id: ""
            }
        };
        if (NoteData.noteCategory.category_name) {
            self.note.catdes = utils.isNotEmptyVal(NoteData.noteCategory.category_name) ? NoteData.noteCategory.category_name : "Note";
        } else {
            self.note.catdes = utils.isNotEmptyVal(NoteData.catdes) ? NoteData.catdes : "Note";
        }
        self.note.noteCategory.notecategory_id = NoteData.noteCategory.notecategory_id;
        self.note.fname = NoteData.user.first_name;
        self.note.lname = NoteData.user.last_name;
        self.note.emailMessages = NoteData.emailMessages;
        self.note.text = NoteData.text;
        self.note.id = NoteData.id;
        self.note.type = NoteData.type;
        self.note.is_important = NoteData.is_important;
        self.note.created_date = NoteData.created_date;
        self.note.matter_name = NoteData.matter_name;
        self.note.matter_id = NoteData.matter_id;
        self.note.note_id = NoteData.note_id;
        self.note.file_number = NoteData.file_number;
        self.addNoteCategories = [];
        self.isUser = true;
        self.edit = edit;
        self.display = {};
        self.migrate = NoteData.is_migrated;
        self.note.linked_contact = NoteData.linked_contact;
        if (utils.isNotEmptyVal(NoteData.linked_contact)) {
            self.note.linked_contact_temp = _.map(NoteData.linked_contact, function (item) {
                item['firstname'] = utils.isNotEmptyVal(item.first_name) ? item.first_name : "";
                item['lastname'] = utils.isNotEmptyVal(item.last_name) ? item.last_name : "";
                item['contactid'] = item.contact_id;
                return item.contact_id;
            });
        } else {
            self.note.linked_contact_temp = [];
            self.noteToEdit.linked_contact_temp = [];
        }
        var contact_names = [];
        _.forEach(self.note.linked_contact, function (item) {
            var fname = utils.isNotEmptyVal(item.first_name) ? item.first_name : "";
            var lname = utils.isNotEmptyVal(item.last_name) ? item.last_name : "";
            contact_names.push(fname + " " + lname);
        })
        self.note['contact_names'] = contact_names.toString();
        if (utils.isNotEmptyVal(NoteData.linked_contact)) {
            self.contactList1 = angular.copy(NoteData.linked_contact);
        } else {
            self.contactList1 = [];
        }

        self.getLinkContact = getLinkContact;
        self.addNewContact = addNewContact;

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
                        var allLinkedContactId = [];
                        if (angular.isDefined(self.noteToEdit)) {
                            allLinkedContactId = _.pluck(self.noteToEdit.linked_contact, 'contact_id');
                        }
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
                                return item.contact_id;
                            });
                        }
                    });

            } else {
                self.contactList1 = [];
            }
        }


        self.noteToEdit = angular.extend({}, self.note);
        self.noteToEdit.text = utils.getTextFromHtml(self.noteToEdit.text);
        self.noteToEdit.noteCategory.notecategory_id = self.note.noteCategory.notecategory_id;
        self.noteToEdit.is_important = self.note.is_important;
        setIsImportant(self.noteToEdit);
        self.composeNotesMail = composeNotesMail;

        //US#4713 disable add edit delete 
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.email_subscription = gracePeriodDetails.email_subscription;

        (function () {
            getNoteCategories();
            getpermissions();
            if (NoteData.attachment_count != "") {
                getNoteAttachments(NoteData);
            }
            // selected edit note details
            var userrole = masterData.getUserRole();
            self.isUser = (userrole.uid == NoteData.user.user_id) || (userrole.role == globalConstants.adminrole) || (userrole.is_admin == '1') ? false : true; //US#8097

        })();

        /**
         * get note attachment notes
         */
        function getNoteAttachments(note) {
            notesDataService.getNoteAttachments(note.note_id, 1)
                .then(function (response) {
                    self.documentTags = [];
                    _.forEach(response.data, function (currentItem, index) {
                        self.documentTags.push({ 'value': currentItem.doc_name, 'documentid': currentItem.doc_id, 'matterid': note.matter_id });
                    });
                }, function (error) {
                });
        }

        function getpermissions() {
            var permissions = masterData.getPermissions();
            self.notesPermissions = _.filter(permissions[0].permissions, function (per) {
                if (per.entity_id == '5') {
                    return per;
                }
            });
        }

        if (self.note.type == 'sidebar') {
            if (self.note.noteCategory.notecategory_id == 1002) {
                intakeNotesDataService.sidebarComment(self.note.note_id)
                    .then(function (response) {
                        self.sidebarComments = utils.isEmptyVal(response.data) ? '' : response.data;
                        self.sidebarPost = self.sidebarComments.length == 0 ? true : false;
                    });
            }

        }
        if (self.note.noteCategory.notecategory_id == 1003) {
            notesDataService.getSelectedSMSThread(self.note.note_id, self.note.matter_id)
                .then(function (response) {
                    var data = response;
                    $scope.selectedSMSThread = data.threadMessages;
                    self.note.threadMessages = $scope.selectedSMSThread;
                });
        }

        function getNoteCategories() {
            intakeNotesDataService.getNotesCategories()
                .then(function (data) {
                    self.addNoteCategories = angular.copy(data);
                    var cat = _.find(self.addNoteCategories, function (item) {
                        return item.notecategory_id == '';
                    })
                    if (utils.isEmptyObj(cat)) {
                        self.addNoteCategories.unshift({ 'category_name': undefined, 'notecategory_id': "" });
                    }
                    self.notesCategories = self.addNoteCategories;
                }, function (error) {
                });
        };

        /**
         * go to document view 
         */
        self.gotoDocument = function (attachment) {
            $state.go('intakedocument-view', { intakeId: attachment.matterid, documentId: attachment.documentid }, { reload: true });
        }

        self.display = {
            mode: 'view'
        };
        self.close = function () {
            $modalInstance.dismiss();

        }
        self.getFormattedDate = function (timestamp) {
            return moment.unix(timestamp).format("MM/DD/YYYY hh:mm A");
        };

        /*Print Note*/
        self.printNote = function (note, sidebar) {
            //US#7770
            var sidebarPrint = angular.isDefined(sidebar) ? sidebar : '';
            if (utils.isEmptyVal(note.fname)) {
                note.fname = '';
            }
            if (utils.isEmptyVal(note.lname)) {
                note.lname = '';
            }
            var output = getNoteData(note, sidebarPrint, note.threadMessages);
            window.open().document.write(output);

        };

        function composeNotesMail() {
            $modalInstance.close({ composeEmail: true, note: self.note });
        }

        //edit note
        function edit() {

            self.display.mode = 'edit';
            //set the note to be edited on new obj
            self.noteToEdit = angular.extend({}, self.note);
            self.noteToEdit.text = utils.getTextFromHtml(self.noteToEdit.text);
            self.noteToEdit.noteCategory.notecategory_id = self.note.noteCategory.notecategory_id;
            self.noteToEdit.is_important = self.note.is_important;
            setIsImportant(self.noteToEdit);
        };

         // to open add new contact pop up
         function addNewContact (type) {
            var selectedType = {};
            selectedType.type = type;
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                if (response) {
                    response.firstname = response.first_name;
                    response.lastname = response.last_name;
                    response.contactid = (response.contact_id).toString();
                    
                    self.noteToEdit.linked_contact_temp.push(response);
                }
            }, function () { });
        }

        //Delete note
        self.doDeleteNote = function () {
            intakeNotesDataService.deleteNote(self.note.note_id)
                .then(function (response) {
                    $modalInstance.close(response);
                    self.display.mode = 'view';
                });
        };

        self.deleteNote = function () {

            self.display.mode = 'delete';
        };

        self.cancelDelete = function () {
            self.display.mode = 'view';
        };

        function setIsImportant(note) {
            var isImp = parseInt(note.is_important);
            if (isNaN(isImp)) {
                note.is_important = (utils.isEmptyVal(note.is_important) || note.is_important == "null") ? false : true;
            } else {
                note.is_important = isImp === 1;
            }
        }

        self.editNote = function (note) {
            var noteDataedit = angular.copy(note);
            if (utils.isNotEmptyVal(noteDataedit.linked_contact_temp)) {
                var arr = [];
                _.forEach(noteDataedit.linked_contact_temp, function (item, index) {
                    if (item.contact_id == undefined) {
                        arr.push({ 'contact_id': item });
                    } else {
                        arr.push({ 'contact_id': item.contact_id });
                    }
                });
                noteDataedit.linked_contact_temp = arr;
            }
            utils.isEmptyVal(noteDataedit.text) ? noteDataedit.text = "<p></p>" : noteDataedit.text = noteDataedit.text;
            noteDataedit.is_important = (noteDataedit.is_important == true ? 1 : 0);
            noteDataedit.linked_contact = [];
            noteDataedit.linked_contact = noteDataedit.linked_contact_temp; // Temp arr assigned to linked contact
            intakeNotesDataService.editNote(noteDataedit)
                .then(function (res) {
                    $modalInstance.close({ edited: true });
                });
        }

        function getSidebarDate(timestamp) {
            return moment.unix(timestamp).format('hh:mm A MMM DD,YYYY');
        }

        function getNoteData(note, sidebar, threadMessages) {
            if (note.type == 'email') {
                return emailPrintView(note);
            }
            var linkedcontact_names = [];
            _.forEach(note.linked_contact, function (item) {
                var fname = utils.isNotEmptyVal(item.first_name) ? utils.removeunwantedHTML(item.first_name) : "";
                var lname = utils.isNotEmptyVal(item.last_name) ? utils.removeunwantedHTML(item.last_name) : "";
                linkedcontact_names.push(fname + " " + lname);
            });
            note.contact_names = linkedcontact_names.toString();
            if (note.is_important == 1) {
                var imp = '<div style="float:left;margin: 5px 7px 32px 7px;"><img src='
                    + globalConstants.images_path + 'print_alert.png /></div>'
            } else { var imp = ''; }
            if (note.catdes) { var cat = note.catdes } else { var cat = '' }
            var cat = utils.isNotEmptyVal(note.catdes) && note.catdes == "sidebar" ? "Sidebar" : note.catdes;

            var formattedtext = utils.replaceHtmlEntites(note.text.replace(/<\/?[^>]+>/gi, ''));
            formattedtext = utils.replaceQuoteWithActual(formattedtext);
            formattedtext = $filter('showSafeHtml')(formattedtext);
            var html = "<html><title>Note</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>pre {overflow-x: auto;white-space: pre-wrap; white-space: -moz-pre-wrap;white-space: -pre-wrap;white-space: -o-pre-wrap; word-wrap: break-word;} table tr { page-break-inside: always; }  </style>";
            html += "<style>@media print{ #printBtn{display:none} </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 10pt;'><img src="
                + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right; '><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Note</h1><div style='margin:30px 0 0 '>";
            html += imp;
            html += "<strong style='display:block; min-height:7px'>" + cat + "</strong>";
            html += " <small>Intake Name:" + utils.removeunwantedHTML(note.matter_name) + " </small>" + "</br>";
            html += " <small>Added By:" + note.fname + ' ' + ((note.fname.toUpperCase() != note.lname.toUpperCase()) ? note.lname : '') + "|" + getFormattedDate(note.created_date) + "</small> <br> ";
            html += " <small>Linked Contact:" + utils.removeunwantedHTML(note.contact_names) + " </small> </div>";

            if (!threadMessages) {
                html += "<pre style='width: 100%; text-align:justify;border-top: 1px solid #ccc; padding: 10px 0; word-break: keep-all;background-color: #ffffff;border:none;font-family: GothamRounded-Book;padding:0px;'>" + formattedtext + "</pre></div>";
            } else {
                html += "<pre style='width: 100%; text-align:justify;border-top: 1px solid #ccc; padding: 10px 0; word-break: keep-all;background-color: #ffffff;border:none;font-family: GothamRounded-Book;padding:0px;'></pre></div>";
            }
            //US#7770
            if (note.type == 'sidebar' || note.type == 'Client Messenger') {
                if (!threadMessages) {
                    var checkSidebarLen = sidebar.length;
                    checkSidebarLen != 0 ? html += '<span>Comment</span><br>' : '';

                    _.forEach(sidebar, function (data) {
                        html += data.user_name + ' <br> ' + getSidebarDate(data.created) + "</br>" + "<p style='width: 44%; text-align:justify;border-top: 1px solid #ccc; padding: 10px 0; word-break:break-word'>" + data.comment_body_value + '</p><br><br>';
                    });
                } else {
                    html += notesDataService.getSmsPrint(threadMessages);
                }
            }
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border: none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';

            return html;
        }

        function emailPrintView(note) {
            var html = " <html><head><title>Note</title>" +
                "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'><style>@media print{ #printBtn{display:none} </style>" +

                "</head>" +

                "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 10pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";

            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Note</h1><div></div>";

            html += "<strong style='display:block; min-height:7px; word-wrap:break-word;width: 44%;margin:30px 0 0 '>Email</strong>";
            html += " <small>Intake Name:" + utils.removeunwantedHTML(note.matter_name) + " | " + "File #:" + note.file_number + " </small>" + "</br>";
            html += "<small>Added By: " +
                note.fname + ' ' + ((note.fname.toUpperCase() != note.lname.toUpperCase()) ? note.lname : '') + "|" + getFormattedDate(note.created_date) + "</small>" + "</br>";



            html += '<div style="width:100%; clear:both;border-top: 1px solid #ccc;padding: 10px 0 0;width: 44%;"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';

            _.forEach(note.emailMessages, function (mail, key) {
                html += "<table style='width:100%;text-align: left; word-break:break-word;padding:10px;";
                html += key != note.emailMessages.length - 1 ?
                    "border-left:1px solid #e2e2e2;'" : "border-left:1px solid #FFF;'";
                html += " cellspacing='0' cellpadding='0' border='0'>";
                html += "<tr>";
                html += "<td>To: " + mail.recipients_mail + "</td>";
                html += "</tr>";
                if (mail.cc_recipients_mail != "") {
                    html += "<tr>";
                    html += "<td>Cc: " + mail.cc_recipients_mail + "</td>";
                    html += "</tr>";
                }
                html += "<tr>";
                html += "<td>From: " + mail.from_mail + "</td>";
                html += "</tr>";
                html += "<tr>";
                html += "<td>Date: " + getFormattedDate(mail.createddate) + "</td>";
                html += "</tr>";

                html += "<tr>";
                html += "<td style='padding:10px 0;'>Sub: " + mail.subject + "</td>";
                html += "</tr>";



                html += "<tr>";
                html += "<td>" + mail.message + "</td>";
                html += "</tr>";
                html += "</table>";

            });
            html += "</body>";
            html += "</html>";
            return html;
        }
    }

})();

(function (angular) {
    angular
        .module('intake.notes')
        .factory('intakeglobalNoteHelper', intakeglobalNoteHelper);

    intakeglobalNoteHelper.$inject = ['globalConstants', 'masterData', '$filter'];

    function intakeglobalNoteHelper(globalConstants, masterData, $filter) {

        return {
            setDateFilter: setDateFilter,
            prepareTags: prepareTags,
            spliceFilter: spliceFilter,
            getmatterlist: getmatterlist,
            printGlobalNote: _printGlobalNote,
            setUserList: setUserList
        }

        function getFormattedDate(timestamp, formatStr) {
            if (utils.isNotEmptyVal(formatStr)) {
                return moment.unix(timestamp).format(formatStr);
            }
            else {
                return moment.unix(timestamp).format("MM/DD/YYYY hh:mm A");
            }
        }

        function _printGlobalNote(filterObj, noteList, user, eventClick) {
            var filtersForPrint = _getFiltersForPrint(filterObj, user, eventClick);
            _.forEach(noteList, function (singleNote) {

                if (singleNote.noteCategory.category_name == null) {
                    singleNote.catdes = 'Note';
                } else {
                    singleNote.catdes = singleNote.noteCategory.category_name;
                }
                if (utils.isEmptyVal(singleNote.fname)) {
                    singleNote.fname = '';

                }

                if (utils.isEmptyVal(singleNote.file_number)) {
                    singleNote.file_number = '';
                }

                if (utils.isEmptyVal(singleNote.lname)) {
                    singleNote.lname = '';

                }
            })

            var printPage = _getPrintPage(filtersForPrint, noteList);
            window.open().document.write(printPage);
        }

        function _getFiltersForPrint(filter, user, eventClick) {
            var dueDateRange = "from : " + (utils.isNotEmptyVal(filter.start) ? moment.unix(filter.start).format('MM-DD-YYYY') : '  -  ') +
                " to : " + (utils.isNotEmptyVal(filter.end) ? moment.unix(filter.end).format('MM-DD-YYYY') : '  -  ');

            var category = [];
            if (utils.isNotEmptyVal(filter.catFilter)) {
                _.forEach(filter.catFilter, function (item) {
                    category.push(item.category_name);
                })
            }
            var importance = filter.impFilter === true ? 'Yes' : '';
            var addedBy = "";
            if (utils.isNotEmptyVal(filter.uidFilter)) {
                _.forEach(filter.uidFilter, function (id, i) {
                    var userData = _.find(user, function (u) {
                        return u.uid == id
                    });
                    addedBy += i > 0 ? ', ' : '';
                    var name = utils.isEmptyVal(userData) ? "" : (userData.name || "") + ' ' + (userData.lname || "");
                    addedBy += utils.isEmptyVal(name) ? " - " : name;
                });
            } else { addedBy = ""; }

            var matterName = '';
            if (utils.isNotEmptyVal(filter.matterid)) {
                matterName = filter.matterid.intakeName;
            }


            var linkedcontact = [];
            if (utils.isNotEmptyVal(filter.linked_contact)) {
                _.forEach(filter.linked_contact, function (item) {
                    linkedcontact.push(utils.removeunwantedHTML(item.full_name));
                })
            }

            var Clkevents = [{ name: 'All Notes', value: 1 }, { name: 'My Notes', value: 0 }];
            var filterObj = {
                'Note': Clkevents[eventClick].name,
                'Intake': matterName,
                'Importance': importance,
                'Added By': addedBy,
                'Date Range': dueDateRange,
                'Category': category,
                'Linked contact': linkedcontact
            };

            return filterObj;
        }

        function _getPrintPage(filters, noteList) {
            var html = "<html><title>Intake Notes</title>";
            html += "<head><link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style></head>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 10pt; '><img src="
                + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Intake Notes</h1><div></div>";
            html += "<body>";
            html += "<div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:10pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<tr>";
            //US:3548 Filter Unique category
            filters.Category = _.uniq(filters.Category, function (item) {
                return item;
            });
            angular.forEach(filters, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;' class=''>";
                html += "<label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px; '>  " + utils.removeunwantedHTML(val) + '</span>';
                html += "</div>";
            });
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "</tr>";
            html += '<tr>';
            html += "<th >";
            html += '<tr>';
            html += "<th width='10%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Added on</th>";
            html += "<th width='18%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Intake Name</th>";
            html += "<th width='15%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Added by</th>";
            html += "<th width='28%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Note</th>";
            html += "<th width='15%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Category</th>";
            html += "<th width='20%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Linked Contact</th>";



            html += '</tr>';
            html += '</th>';
            html += '</tr>';

            html += '<tbody>';
            angular.forEach(noteList, function (note) {
                var noteText;
                if (note.text) {
                    noteText = utils.replaceHtmlEntites(note.text.replace(/<\/?[^>]+>/gi, ''));
                    noteText = utils.replaceQuoteWithActual(noteText);
                    noteText = $filter('showSafeHtml')(noteText);
                }
                //var checkval = utils.isEmptyVal(note.catdes);
                //note.catdes = checkval ? "-" : note.catdes;
                var firstName = utils.isNotEmptyVal(note.user.first_name) ? note.user.first_name : "";
                var lastName = (utils.isEmptyVal(note.user.last_name) || note.user.last_name == "null") ? "" : note.user.last_name;
                var categoryName = [firstName, lastName].join(' ');
                var categoryGlobalDesc = (note.catdes == null) ? "" : note.catdes;
                //US#8312 added this 

                if (note.type == 'email') {
                    noteText = (noteText = note.plaintext + '<br>' + (note.text ? note.text : ""));
                } else if (note.noteCategory.notecategory_id == 1003) {
                    noteText = note.displayText.replace(/(?:\r\n|\r|\n)/g, '<br>');
                } else {
                    noteText = noteText;
                }
                html += '   <tr >';
                html += '<td width="10%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;"> ' + getFormattedDate(note.created_date, "MM/DD/YYYY") + '</td>';
                html += '<td width="18%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px; vertical-align:top"> ' + utils.removeunwantedHTML(note.matter_name) + '</td>';
                html += '<td width="15%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;">' + categoryName + '</td>';
                html += '<td width="28%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;"> ' + noteText + '</td>';
                html += '<td width="15%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px; vertical-align:top"> ' + utils.removeunwantedHTML(categoryGlobalDesc) + '</td>';
                html += '<td width="20%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px; vertical-align:top"> ' + utils.removeunwantedHTML(note.contact_names) + '</td>';
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

        function getmatterlist(intake_name) {
            var deferred = $q.defer();
            var dataObj = {
                "page_number": 1,
                "page_size": 1000,
                "name": intake_name
            };
            var promise = intakeFactory.getMatterList(dataObj);
            promise
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;

        }

        function setDateFilter(param, currentFilter) {
            var start = moment().startOf('day');
            var end = moment().endOf("day"); //Now
            switch (param) {
                case "YESTERDAY":
                    start = angular.copy(start).subtract(1, 'days');        // Start of day 7 days ago
                    end = angular.copy(start).endOf("day");
                    currentFilter.s_custom = "";
                    currentFilter.e_custom = "";
                    break;
                case "LAST_WEEK":
                    start = angular.copy(start).subtract(7, 'days');        // Start of day 7 days ago
                    currentFilter.s_custom = "";
                    currentFilter.e_custom = "";
                    break;
                case "MONTH_AGO":
                    start = angular.copy(start).subtract(1, 'months');        // Start of day 1 month ago
                    currentFilter.s_custom = "";
                    currentFilter.e_custom = "";
                    break;
            }
            currentFilter.start = start.utc().unix();
            currentFilter.end = end.utc().unix();
        };

        // prepare tags
        function prepareTags(selectedFilters, allcategories, allUsers, currentDateFilter, tags, alllinkedcontact) {
            tags = [];
            var addedOn = '';
            // category
            _.forEach(selectedFilters.catFilter, function (data) {
                angular.forEach(allcategories, function (value, key) {
                    if (value.notecategory_id == data) {
                        tags.push({ 'key': data, 'value': value.category_name.charAt(0).toUpperCase() + value.category_name.substr(1).toLowerCase(), 'type': 'category' });
                    }
                });
            })

            _.forEach(selectedFilters.linked_contact, function (data) {
                tags.push({ 'key': data.contactid, 'value': ('Linked contact: ' + data.full_name), 'type': 'linked_contact' });

            })

            // add by
            _.forEach(selectedFilters.uidFilter, function (data) {
                angular.forEach(allUsers, function (value, key) {
                    if (value.uid == data) {
                        tags.push({ 'key': data, 'value': ('Added by:' + value.Name), 'type': 'addedby' });
                    }
                });
            })

            // Is impotant
            if (selectedFilters.impFilter) {
                tags.push({ 'key': 1, 'value': 'Important Notes', 'type': 'imp' });
            }

            // 
            switch (currentDateFilter) {
                case "LAST_WEEK":
                    addedOn = 'Last Week';
                    break;
                case "MONTH_AGO":
                    addedOn = 'Going Back a Month';
                    break;
                case "TODAY":
                    addedOn = 'Today';
                    break;
                case "YESTERDAY":
                    addedOn = 'Yesterday';
                    break;
                case "CUSTOM_DATE":
                    addedOn = 'Custom Date';
                    break;
            }

            // Added On
            if (utils.isNotEmptyVal(addedOn)) {
                if (utils.isNotEmptyVal(selectedFilters.s_custom) && selectedFilters.s_custom != 0 && selectedFilters.e_custom != 0 && utils.isNotEmptyVal(selectedFilters.e_custom)) {
                    addedOn = addedOn + ': ' + moment.unix(selectedFilters.s_custom).format('MM-DD-YYYY') +
                        ' to ' + moment.unix(selectedFilters.e_custom).format('MM-DD-YYYY');
                }
                tags.push({ 'key': currentDateFilter, 'value': addedOn, 'type': 'addedon' });
            }

            // Intake
            if (!_.isUndefined(selectedFilters.matterid) && (selectedFilters.matterid != "")) {
                tags.push({ 'key': selectedFilters.matterid.intakeId, 'value': selectedFilters.matterid.intakeName, 'type': 'matter' });
            }
            return tags;
        }

        function spliceFilter(cancelled, selectedFilters) {
            var idx;
            if (cancelled.type == 'category') {
                //check added key,value pair in object 
                if (cancelled.enote) {
                    //email category is spliced
                    index = selectedFilters.catFilter.indexOf(cancelled.key);
                    if (index != -1) {
                        selectedFilters.catFilter.splice(index, 1);
                    }
                    //if email category is checked then along with it email key will also get spliced
                    var emailIdx = selectedFilters.catFilter.indexOf(cancelled.enote);
                    if (emailIdx != -1) {
                        selectedFilters.catFilter.splice(emailIdx, 1);
                    }
                } else {
                    idx = selectedFilters.catFilter.indexOf(cancelled.key);
                    idx != -1 ? selectedFilters.catFilter.splice(idx, 1) : angular.noop;
                }

            } else if (cancelled.type == 'imp') {
                selectedFilters.impFilter = 0;
            } else if (cancelled.type == 'addedon') {
                selectedFilters.end = '';
                selectedFilters.start = '';
                selectedFilters.e_custom = '';
                selectedFilters.s_custom = '';
            } else if (cancelled.type == 'addedby') {
                var idx = selectedFilters.uidFilter.indexOf(cancelled.key);
                idx != -1 ? selectedFilters.uidFilter.splice(idx, 1) : angular.noop;
            } else if (cancelled.type == 'matter') {
                delete selectedFilters.matterid;
            } else if (cancelled.type == 'linked_contact') {
                var idx = _.findIndex(selectedFilters.linked_contact, function (voteItem) { return voteItem.contactid == cancelled.key });
                idx != -1 ? selectedFilters.linked_contact.splice(idx, 1) : angular.noop;
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
            var lexviaUsr = {};
            lexviaUsr.mail = "";
            lexviaUsr.uid = 0;
            lexviaUsr.name = "Lexvia";
            lexviaUsr.lname = "";
            lexviaUsr.Name = "Lexvia";
            var isLexvia_subscribe = masterData.getUserRole().lexvia_services;
            if (isLexvia_subscribe) {
                userList.push(lexviaUsr);
            }
            userList = _.uniq(userList, function (item) {
                return item.uid;
            });
            return userList;
        }

    }
})(angular);
