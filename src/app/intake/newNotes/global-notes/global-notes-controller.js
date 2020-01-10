(function () {

    'use strict';

    angular
        .module('cloudlex.notes')
        .controller('LauncherGlobalNotesCtrl', LauncherGlobalNotesCtrl);

    LauncherGlobalNotesCtrl.$inject = ['$rootScope', '$scope', '$timeout', '$filter', 'launcherNotesDataService', '$modal',
        'notification-service', '$state', 'globalNoteHelper', 'launcherNoteHelper', 'contactFactory',
        'globalConstants', 'mailboxDataService', 'mailboxDataServiceV2', 'masterData', 'modalService', 'matterFactory', '$q', 'notesDataService'];

    function LauncherGlobalNotesCtrl($rootScope, $scope, $timeout, $filter, launcherNotesDataService, $modal,
        notificationService, $state, globalNoteHelper, launcherNoteHelper, contactFactory,
        globalConstants, mailboxDataService, mailboxDataServiceV2, masterData, modalService, matterFactory, $q, notesDataService) {

        var self = this;
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
        self.showIntakeNote = $rootScope.isIntakeActive == 1 ? '1' : '0';
        self.selectedMode = $rootScope.onMatter || $rootScope.onLauncher ? 2 : 1;
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

        self.getLinkContactFilter = getLinkContactFilter;

        self.isglobalNotesSelectedForComposeMailIcon = isglobalNotesSelectedForComposeMailIcon;
        self.isglobalNotesSelectedComposeMail = [];
        var request = masterData.fetchUserRole();
        $q.all([request]).then(function (values) {
        })
        function isglobalNotesSelectedForComposeMailIcon(note) {
            self.isglobalNotesSelectedComposeMail = angular.copy(self.globalNotesGrid.selectedItems);
            checkComposeFlag(self.isglobalNotesSelectedComposeMail);
        }

        function checkComposeFlag(sourceArray) {
            self.emailFlag = true;
            var selectedFilters = sessionStorage.getItem("launcherglobalNotesFilters");
            if (utils.isNotEmptyVal(selectedFilters)) {
                self.selectedFilters = JSON.parse(selectedFilters);
                if (self.selectedFilters.showMatterEvents && self.selectedFilters.showIntakeEvents && (self.selectedFilters.showMatterEvents == 1 && self.selectedFilters.showIntakeEvents == 1)) {
                    if (sourceArray.length > 1) {
                        for (var i = 0; i < sourceArray.length; i++) {
                            if (sourceArray[i].is_intake == 1) {
                                self.emailFlag = false;
                                return;
                            } else {
                                self.emailFlag = true;
                            }
                        }
                    }
                }
            }
            else {
                if (sourceArray.length > 1) {
                    var intakecount = _.filter(sourceArray, function (item) {
                        return item.is_intake == 1;
                    });
                    if (intakecount == 0 || (sourceArray.length == intakecount.length)) {
                        self.emailFlag = true;
                    }
                    else {
                        self.emailFlag = false;
                    }
                }
            }
        }

        self.isUser = true;
        self.searchRetain = searchRetain; //Bug#7326
        self.serachInput = "";
        self.firmData = { API: "PHP", state: "mailbox" };
        //US#4713 disable add edit delete 
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.email_subscription = gracePeriodDetails.email_subscription;  // role email subscription
        self.sidebarComments = []; //array to store sidebar post
        function preInit() {	//Get notes and categories
            init();
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
            var type = sessionStorage.getItem('launcherglobalNotesType');
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
            sessionStorage.setItem("launcherglobalNotesText", globalNotesText);
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
                        var allData = [];
                        contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
                        contactFactory.setNamePropForContactsOffDrupal(data);
                        var allLinkedContactId = _.pluck(self.currentFilter.linked_contact, 'contact_id');
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
                                self.contact.push(item);
                            }
                        });

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
            getAppFlags();
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
                tab: self.currentFilter.tab,
                showMatterEvents: 1,
                showIntakeEvents: $rootScope.isIntakeActive == 1 ? 1 : 0
            };
            self.selectedFilters = { showMatterEvents: 1, showIntakeEvents: $rootScope.isIntakeActive == 1 ? 1 : 0 };
            //persist notes filter

            sessionStorage.setItem("launcherglobalNotesFilters", JSON.stringify(self.selectedFilters));
            sessionStorage.setItem("launcherglobalNotesText", '');

            var type = sessionStorage.getItem('launcherglobalNotesType');
            self.tags = launcherNoteHelper
                .prepareTags(self.selectedFilters, self.notesCategories,
                    self.users, self.currentDateFilter, self.tags);
            if (type == 'allNotes') {
                self.allNotes();

            } else {
                self.myNotes();
            }
        }

        function init() {
            self.notesList = [];  //Data model for holding list of matter notes        
            self.noteToBeAdded = {};  //Data model for holding new note details
            self.currentView = utils.isNotEmptyVal(sessionStorage.getItem("launcherglobal-note-grid-view")) ? sessionStorage.getItem("launcherglobal-note-grid-view") : "LIST";
            self.notesCategories = [];
            self.contact = [];
            self.users = [];
            sessionStorage.globalNotesText = "";
            self.isCollapsed = true;
            self.serachInput = "";
            self.currentPageNum = 1;
            self.currentDateFilter = {};
            self.matterinfo = {};
            self.emailForCategories = { "notecategory_id": "1001", "category_name": "email" };
            self.sidebarForCategories = { "notecategory_id": "1002", "category_name": "sidebar" };
            self.clientMsngrForCategories = { "notecategory_id": "1003", "category_name": "client messenger" };
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

            var existing_launcherglobalNotesType = sessionStorage.getItem('launcherglobalNotesType');
            if (!existing_launcherglobalNotesType) {
                sessionStorage.setItem('launcherglobalNotesType', "myNotes");
            }

            self.currentFilter = {
                catFilter: [],
                uidFilter: [],
                tab: (sessionStorage.getItem('launcherglobalNotesType') == "myNotes") ? 'myglobalnotes' : 'allglobalnotes',
                impFilter: 0,
                start: '',
                end: '',
                s_custom: '',
                e_custom: '',
                linked_contact: [],
                showMatterEvents: 1,
                showIntakeEvents: $rootScope.isIntakeActive == 1 ? 1 : 0,
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
            var globalNotesText = sessionStorage.getItem("launcherglobalNotesText");
            if (utils.isNotEmptyVal(globalNotesText)) {
                self.serachInput = globalNotesText;
            }
        }

        $scope.$watch(function () {
            if ((self.currentFilter.catFilter && self.currentFilter.catFilter.length > 0) || self.showMatterEvents == 1 || ($rootScope.isIntakeActive == 1 && self.showIntakeEvents == 1) ||
                (self.currentFilter.uidFilter && self.currentFilter.uidFilter.length > 0) || self.currentFilter.impFilter != 0 || utils.isNotEmptyVal(self.addedOnVal) || (self.tags.length > 0) || utils.isNotEmptyVal(self.currentFilter.linked_contact)) {
                self.enableApply = false;
            } else {
                self.enableApply = true;
            }
        })

        // select all global notes list
        function selectAllglobalNotes(isSelected) {
            self.emailFlag = true;
            if (isSelected === true) {
                var selectedFilters = sessionStorage.getItem("launcherglobalNotesFilters");
                self.globalNotesGrid.selectedItems = angular.copy(self.notesList);
                if (utils.isNotEmptyVal(selectedFilters)) {
                    self.selectedFilters = JSON.parse(selectedFilters);
                    if (self.selectedFilters.showMatterEvents && self.selectedFilters.showIntakeEvents && (self.selectedFilters.showMatterEvents == 1 && self.selectedFilters.showIntakeEvents == 1)) {
                        for (var i = 0; i < self.globalNotesGrid.selectedItems.length; i++) {
                            if (self.globalNotesGrid.selectedItems[i].is_intake == 1) {
                                self.emailFlag = false;
                                break;
                            } else {
                                self.emailFlag = true;
                            }
                        }
                    }
                }
                else {
                    for (var i = 0; i < self.globalNotesGrid.selectedItems.length; i++) {
                        if (self.globalNotesGrid.selectedItems[i].is_intake == 1) {
                            self.emailFlag = false;
                            break;
                        } else {
                            self.emailFlag = true;
                        }
                    }
                }

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

            var selectedFilters = sessionStorage.getItem("launcherglobalNotesFilters");
            if (utils.isNotEmptyVal(selectedFilters)) {
                try {
                    self.selectedFilters = JSON.parse(selectedFilters);
                    if (self.selectedFilters.showMatterEvents && (self.selectedFilters.showMatterEvents == 0 || self.selectedFilters.showMatterEvents == 1)) {
                        self.showMatterEvents = self.selectedFilters.showMatterEvents;
                    }
                    if (self.selectedFilters.showIntakeEvents && (self.selectedFilters.showIntakeEvents == 0 || self.selectedFilters.showIntakeEvents == 1)) {
                        if (self.selectedFilters.showIntakeEvents == 1) {
                            self.showIntakeEvents = $rootScope.isIntakeActive == 1 ? 1 : 0;
                            self.selectedFilters.showIntakeEvents = self.showIntakeEvents;
                        } else {
                            self.showIntakeEvents = self.selectedFilters.showIntakeEvents;
                        }
                    }
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
                            _.forEach(self.selectedFilters.catFilter, function (value, key) {
                                if (utils.isNotEmptyVal(value)) {
                                    if (value == '13' && self.selectedFilters.catFilter.indexOf('1001') == -1) {
                                        self.selectedFilters.catFilter.push('1001');
                                    }
                                }
                            })
                            self.tags = launcherNoteHelper
                                .prepareTags(self.selectedFilters, self.notesCategories,
                                    self.users, self.currentDateFilter, self.tags);
                            var currentNotesView = sessionStorage.getItem('launcherglobal-note-view');
                            if (!currentNotesView || currentNotesView == "my") {
                                self.myNotes();
                            } else {
                                self.allNotes();
                            }
                            setGridHeight();
                        });
                } catch (e) { self.selectedFilters = { showMatterEvents: 1, showIntakeEvents: 1 }; }
            } else {
                getAppFlags();
                self.selectedFilters = { showMatterEvents: 1, showIntakeEvents: $rootScope.isIntakeActive == 1 ? 1 : 0 };
                getNoteCategories()
                    .then(getUsers)
                    .then(function () {
                        _.forEach(self.selectedFilters.catFilter, function (value, key) {
                            if (utils.isNotEmptyVal(value)) {
                                if (value == '13' && self.selectedFilters.catFilter.indexOf('1001') == -1) {
                                    self.selectedFilters.catFilter.push('1001');
                                }
                            }
                        })
                        self.tags = launcherNoteHelper
                            .prepareTags(self.selectedFilters, self.notesCategories,
                                self.users, self.currentDateFilter, self.tags);
                        var currentNotesView = sessionStorage.getItem('launcherglobal-note-view');
                        if (!currentNotesView || currentNotesView == "my") {
                            self.myNotes();
                        } else {
                            self.allNotes();
                        }
                        setGridHeight();
                    });
            }
        }

        function setExistingFilters() {
            _.forEach(self.selectedFilters.catFilter, function (value, key) {
                if (utils.isNotEmptyVal(value)) {
                    if (value == '13' && self.selectedFilters.catFilter.indexOf('1001') == -1) {

                        self.selectedFilters.catFilter.push('1001');
                    }
                }

            })
            var existingFilters = sessionStorage.getItem("launcherglobalNotesFilters");
            if (utils.isNotEmptyVal(existingFilters)) {
                self.selectedFilters = JSON.parse(existingFilters);
                var filter = angular.copy(self.selectedFilters);
                self.currentDateFilter = self.selectedFilters.currentDateFilter;
                self.addedOnVal = self.currentDateFilter;
                self.showMatterEvents = filter.showMatterEvents;
                self.showIntakeEvents = filter.showIntakeEvents;
                self.currentFilter = {};
                self.currentFilter = angular.copy(filter);
                self.currentFilter.tab = (sessionStorage.getItem('launcherglobalNotesType') == "myNotes") ? 'myglobalnotes' : 'allglobalnotes';

            } else {
                self.selectedFilters = { showMatterEvents: 1, showIntakeEvents: $rootScope.isIntakeActive == 1 ? 1 : 0 };
                self.currentFilter = {
                    catFilter: [],
                    uidFilter: [],
                    tab: (sessionStorage.getItem('launcherglobalNotesType') == "myNotes") ? 'myglobalnotes' : 'allglobalnotes',
                    impFilter: 0,
                    start: '',
                    end: '',
                    s_custom: '',
                    e_custom: '',
                    linked_contact: [],
                    showMatterEvents: 1,
                    showIntakeEvents: $rootScope.isIntakeActive == 1 ? 1 : 0,
                };
            }
        }

        function getAppFlags() {
            self.showIntakeEvents = $rootScope.isIntakeActive == 1 ? 1 : 0;
            self.showMatterEvents = self.notesPermissions[0].V == 1 ? 1 : 0;
        }

        //function to go on sepecific matter 
        function goToMatter(matterId, isIntake) {
            if (isIntake == 1) {
                $state.go('intake-overview', { intakeId: matterId }, { reload: true });
            } else {
                $state.go('add-overview', { matterId: matterId }, { reload: true });
            }
        }

        /*** Service call Functions ***/
        function myNotes() {
            self.showMoreAll = true;
            self.loaderFlagStatus = false;
            self.currentPageNum = 1;
            self.currentFilter.tab = "myglobalnotes";
            sessionStorage.setItem('launcherglobal-note-view', "my");
            if (self.globalNotesGrid && self.globalNotesGrid.selectedItems) {
                self.globalNotesGrid.selectedItems = [];
            }
            sessionStorage.setItem('launcherglobalNotesType', "myNotes");
            self.notesList = [];
            launcherNotesDataService.getFilteredMyNotes(self.selectedFilters, self.currentPageNum)
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
            sessionStorage.setItem('launcherglobal-note-view', "all");
            if (self.globalNotesGrid && self.globalNotesGrid.selectedItems) {
                self.globalNotesGrid.selectedItems = [];
            }
            sessionStorage.setItem('launcherglobalNotesType', "allNotes");
            self.notesList = [];
            launcherNotesDataService.getFilteredAllNotes(self.selectedFilters, self.currentPageNum)
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
            return launcherNotesDataService.getNotesCategories()
                .then(function (data) {
                    self.notesCategories = data;
                    // add email/sidebar as categories
                    //self.notesCategories.push(self.emailForCategories);
                    self.notesCategories.push(self.sidebarForCategories);
                    self.notesCategories.push(self.clientMsngrForCategories);
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
            if (self.isFilterView == true) {
                //self.applyFilters(self.selectedFilters);
            }
            self.isFilterView = false;
            self.currentView = viewName;
            sessionStorage.setItem("launcherglobal-note-grid-view", self.currentView);
            self.globalNotesGrid.selectedItems = [];
            setGridHeight();
        };

        self.getMoreNotes = function (all) {

            self.currentPageNum++;
            self.notesLimit += 9;
            self.notesList = utils.isEmptyVal(all) ? self.notesList : [];
            fetchData();
        };

        self.setSelectedCateory = function (item) {
            self.noteToBeAdded["notecategory_id"] = item["notecategory_id"];
        };

        self.openFilters = function () {
            self.isFilterView = !self.isFilterView;
            self.globalNotesGrid.selectedItems = [];
            setExistingFilters();
        };

        self.openAddView = function () {
            if (self.notesPermissions[0].A == 0 || self.isGraceOver == 0) {
                self.showMatterEvents = 0;
                self.selectedMode = 1;
            } else {
                self.selectedMode = $rootScope.onMatter || $rootScope.onLauncher ? 2 : 1;
            }
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

        // hide/show more and show all link
        self.showMoreHTML = function () {
            if (self.notesList.length > 0) {
                return true;
            }
        }

        // clear filter

        self.clearFilter = function () {
            self.isFilterView = false;
            self.currentPageNum = 1;
            self.tags = [];
            self.isCollapsed = true;
            self.showMoreAll = true;
            self.isDataAvailable = false;
            self.currentPageNum = 1;
            self.notesList = [];
            self.selectedFilters = { showMatterEvents: 1, showIntakeEvents: $rootScope.isIntakeActive == 1 ? 1 : 0 };
            getAppFlags();
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
                tab: sessionStorage.getItem('launcherglobalNotesType') == "myNotes" ? 'myglobalnotes' : 'allglobalnotes',
                showMatterEvents: 1,
                showIntakeEvents: $rootScope.isIntakeActive == 1 ? 1 : 0
            };

            self.addedOnVal = "";
            sessionStorage.setItem("launcherglobalNotesText", '');
            //persist notes filter
            sessionStorage.setItem("launcherglobalNotesFilters", JSON.stringify(self.selectedFilters));
            if (self.globalNotesGrid && self.globalNotesGrid.selectedItems) {
                self.globalNotesGrid.selectedItems = [];
            }
            self.tags = launcherNoteHelper
                .prepareTags(self.selectedFilters, self.notesCategories,
                    self.users, self.currentDateFilter, self.tags);

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
            resetNotes();
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
                if ((currentFilter.matterid != "") && _.isUndefined(currentFilter.matterid.matterid)) {
                    notificationService.error("Invalid matter selected.");
                    return;
                }
            }
            self.isFilterView = false;
            self.currentPageNum = 1;
            self.selectedFilters = angular.copy(currentFilter);

            //persist notes filter
            self.selectedFilters.currentDateFilter = self.addedOnVal;
            self.selectedFilters.showMatterEvents = angular.copy(self.showMatterEvents);
            self.selectedFilters.showIntakeEvents = angular.copy(self.showIntakeEvents);
            self.selectedFilters.tab = sessionStorage.getItem('launcherglobalNotesType') == "myNotes" ? 'myglobalnotes' : 'allglobalnotes'
            self.currentFilter.tab = self.selectedFilters.tab;
            sessionStorage.setItem("launcherglobalNotesFilters", JSON.stringify(self.selectedFilters));
            //if email category checked then along with it email is also pushed into object
            _.forEach(self.selectedFilters.catFilter, function (value, key) {
                if (utils.isNotEmptyVal(value)) {
                    if (value == '13' && self.selectedFilters.catFilter.indexOf('1001') == -1) {

                        self.selectedFilters.catFilter.push('1001');
                    };
                }

            })
            // find the selected filters and push to tags to display
            self.tags = launcherNoteHelper.prepareTags(self.selectedFilters,
                self.notesCategories, self.users, self.currentDateFilter, self.tags);
            self.notesList = [];
            fetchData();
        };

        function fetchData() {
            self.showMoreAll = true;
            var fetchNote;
            if (self.selectedFilters.tab == 'myglobalnotes' || self.currentFilter.tab == 'myglobalnotes') {
                fetchNote = launcherNotesDataService.getFilteredMyNotes(self.selectedFilters, self.currentPageNum);
            }
            else {
                fetchNote = launcherNotesDataService.getFilteredAllNotes(self.selectedFilters, self.currentPageNum);
            };
            fetchNote.then(function (data) {

                if (data.count == 0) {
                    notificationService.error("No more notes found");
                    self.showMoreAll = false;
                }

                //hide MORE&ALL is filtered data less than 9
                if(self.currentPageNum == 1 && data.notes.length < 9){
                    self.showMoreAll = false;
                }
                

                if (data && data.notes) {
                    angular.forEach(data.notes, function (noteObj, index) {
                        var text = noteObj.plaintext;
                        noteObj.displayText = utils.replaceQuoteWithActual(text);
                        notesDataService.setSearchableData(noteObj);
                        self.notesList.push(noteObj);
                    });
                }

                //bug#17241
                //self.totalNotesCount = self.notesList.length; 
                setGridHeight();
            });
        }

        function isDateRangeValid(filter) {
            if (utils.isNotEmptyVal(filter.start) && utils.isNotEmptyVal(filter.end)) {
                var start = moment.unix(filter.start);
                var end = moment.unix(filter.end);

                return start.isBefore(end);
            }
            return false;
        }

        self.getMatterList = function (contactName) {
            return globalNoteHelper.getmatterlist(contactName);
        }

        self.getIntakeList = function (name, migrate) {
            return intakeNotesDataService.getMatterList(name, migrate);
        }

        //in our display value and model value are different for the input box
        //therefore we are formatting our display value based on the model value of the input box
        self.formatTypeaheadDisplay = function (matter) {
            if (angular.isUndefined(matter) || utils.isEmptyString(matter)) {
                return undefined;
            }
            var name = angular.isUndefined(matter.name) ? '' : matter.name;
            return (name);
        }

        //in our display value and model value are different for the input box
        //therefore we are formatting our display value based on the model value of the input box
        self.formatTypeaheadIntakeDisplay = function (intake) {
            if (angular.isUndefined(intake) || utils.isEmptyString(intake)) {
                return undefined;
            }
            var name = angular.isUndefined(intake.intakeName) ? '' : intake.intakeName;
            return (name);
        }

        self.tagCancelled = function (cancelled) {
            //if email category is checked then add key,value pair into existing object  
            var existingFilters = sessionStorage.getItem("launcherglobalNotesFilters");
            if (utils.isNotEmptyVal(existingFilters)) {
                self.selectedFilters = JSON.parse(existingFilters);
                self.currentFilter = angular.extend({}, self.currentFilter, self.selectedFilters);
            }
            var filter = angular.copy(self.currentFilter);
            if (cancelled.key == 13) {
                var newKey = "enote";
                var newValue = "1001";
                cancelled[newKey] = newValue;
            }
            self.showMatterEvents = filter.showMatterEvents;
            self.showIntakeEvents = filter.showIntakeEvents;
            if (cancelled.type == "showIntakeEvents") {
                self.showIntakeEvents = 0;
            }
            if (cancelled.type == "showMatterEvents") {
                self.showMatterEvents = 0;
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
            self.selectedIntakeNotes = [];
            self.selectedMatterNotes = [];
            _.forEach(self.globalNotesGrid.selectedItems, function (currentItem) {
                if (currentItem.is_intake == 1) {
                    self.selectedIntakeNotes.push(currentItem);
                } else {
                    self.selectedMatterNotes.push(currentItem);
                }
            });
            if (cancelled.value == "Matter Notes") {
                self.globalNotesGrid.selectedItems = self.selectedIntakeNotes;
                self.emailFlag = true;
            } else {
                self.globalNotesGrid.selectedItems = self.selectedMatterNotes;
                self.emailFlag = true;
            }
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
            $rootScope.updateComposeMailMsgBody(self.composeEmail, "", "", "", "", "", self.selectedMode);
            self.compose = true;
            // set rootscope selected note DOM for compose mail
        }

        self.openNotesViewPopup = function (notedata) {
            if (notedata.is_intake == 0) {
                var modalInstance = $modal.open({
                    templateUrl: 'app/notes/global-notes/partials/view-global-note.html',
                    controller: 'ViewGlobalNoteCtrl as ViewGlobalNoteCtrl',
                    windowClass: 'medicalIndoDialog static-new-scrollbar',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        NoteData: function () {
                            return notedata;
                        },
                    }
                });
            } else {
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
            }

            modalInstance.result.then(function (response) {
                if (response) {
                    if (response.composeEmail) {
                        notedata.threadMessages = response.note.threadMessages;
                        composeNotesFromView(notedata);
                    }
                    if (response.edited) {
                        notificationService.success('Note edited successfully.');
                        var type = sessionStorage.getItem('launcherglobalNotesType');
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
                        var type = sessionStorage.getItem('launcherglobalNotesType');
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
                if (NoteData.is_intake == 0) {
                    if (self.notesPermissions[0].E == 0 || self.isGraceOver == 0) {
                        return notificationService.error('You are not authorized to edit matter notes.');
                    }
                    var modalInstance = $modal.open({
                        templateUrl: 'app/notes/global-notes/partials/edit-global-note.html',
                        controller: 'ViewGlobalNoteCtrl as ViewGlobalNoteCtrl',
                        windowClass: 'medicalIndoDialog static-new-scrollbar',
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            NoteData: function () {
                                return NoteData;
                            },
                        }
                    });
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
                }

                modalInstance.result.then(function (response) {
                    if (response) {

                        if (response.edited) {
                            notificationService.success('Note edited successfully.');
                            var type = sessionStorage.getItem('launcherglobalNotesType');
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
            })

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
                //Bug#7300
                if (notesTobeDeleted.length === 0) {
                    notificationService.error("Can't Delete Note");
                    return;
                }
                if (notesTobeDeleted.length != selectedNotes.length) {
                    notificationService.error("Can't Delete Note");
                }

                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Delete',
                    headerText: 'Delete note ?',
                    bodyText: "Do you wish to delete this note?"
                };
                modalService.showModal({}, modalOptions).then(function () {
                    var matterNoteIds = [];
                    var intakeNoteIds = [];
                    var matterNotes = _.filter(notesTobeDeleted, function (num) { return num.is_intake == 0; });
                    var intakeNotes = _.filter(notesTobeDeleted, function (num) { return num.is_intake == 1; });
                    matterNoteIds = _.pluck(matterNotes, 'note_id');
                    intakeNoteIds = _.pluck(intakeNotes, 'note_id');
                    if (matterNoteIds.length > 0) {
                        if (self.notesPermissions[0].D == 0 || self.isGraceOver == 0) {
                            return notificationService.error('You are not authorized to delete matter notes.');
                        }
                    }

                    launcherNotesDataService.deleteNote(matterNoteIds, intakeNoteIds)
                        .then(function (response) {
                            self.deleteMode = false;
                            self.isOpenNotesView = false;
                            self.globalNotesGrid.selectedItems = [];
                            notificationService.success('Note deleted successfully.');
                            self.notesList = [];
                            var type = sessionStorage.getItem('launcherglobalNotesType');
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
            launcherNotesDataService.deleteNote(self.note.note_id)
                .then(function (response) {
                    self.deleteMode = false;
                    self.isOpenNotesView = false;
                    notificationService.success('Note deleted successfully.');
                    self.applyFilters(self.selectedFilters);
                });
        };

        self.deleteNote = function () {
            self.deleteMode = true;
            //self.isOpenNotesView = false;
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
            launcherNoteHelper.printGlobalNote(selectedFilter, angular.copy(printSelectedGlobalNotes), users, eventClick);
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
                self.selectedFilters.matterid.matterid : '';
            if (utils.isNotEmptyVal(self.selectedFilters.linked_contact)) {
                filter.contactIds = self.selectedFilters.linked_contact;
            } else {
                filter.contactIds = '';
            }

            filter.showIntakeEvents = angular.copy(self.selectedFilters.showIntakeEvents);
            filter.showMatterEvents = angular.copy(self.selectedFilters.showMatterEvents);

            launcherNotesDataService.exportMatterNotes(filter)
                .then(function (response) {
                    utils.downloadFile(response.data, "GlobalNotes.xlsx", response.headers("Content-Type"));

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
            $rootScope.updateComposeMailMsgBody(self.composeEmail, "", "", "", "", "", self.selectedMode);
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


(function (angular) {
    angular
        .module('cloudlex.notes')
        .factory('launcherNoteHelper', launcherNoteHelper);

    launcherNoteHelper.$inject = ['globalConstants', '$rootScope', '$filter'];

    function launcherNoteHelper(globalConstants, $rootScope, $filter) {

        return {
            printGlobalNote: _printGlobalNote,
            prepareTags: prepareTags
        }

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

            // Is showIntakeEvents
            if (selectedFilters.showIntakeEvents == '1') {
                tags.push({ 'key': 1, 'value': 'Intake Notes', 'type': 'showIntakeEvents' });
            }

            // Is showMatterEvents
            if (selectedFilters.showMatterEvents == '1') {
                tags.push({ 'key': 1, 'value': 'Matter Notes', 'type': 'showMatterEvents' });
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

            // Matter
            if (!_.isUndefined(selectedFilters.matterid) && (selectedFilters.matterid != "")) {
                tags.push({ 'key': selectedFilters.matterid.matterid, 'value': selectedFilters.matterid.name, 'type': 'matter' });
            }
            return tags;
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
                } else {
                    if (singleNote.is_intake == 1) {
                        singleNote.file_number = '';
                    }
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
                matterName = filter.matterid['name'];
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
                'Importance': importance,
                'Added By': addedBy,
                'Date Range': dueDateRange,
                'Category': category,
                'Linked contact': linkedcontact
            };

            return filterObj;
        }


        function _getPrintPage(filters, noteList) {
            var html = "<html><title>Notes Report</title>";
            html += "<head><link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }</style></head>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 10pt; '><img src="
                + globalConstants.site_logo + " width='200px'/>";
            if ($rootScope.isIntakeActive == 1) {
                html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Matter/Intake Notes</h1><div></div>";
            } else {
                html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Matter Notes</h1><div></div>";
            }
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
                html += "<span style='padding:5px; '>  " + val + '</span>';
                html += "</div>";
            });
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "</tr>";
            html += '<tr>';
            html += "<th >";
            html += '<tr>';
            html += "<th width='10%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Added on</th>";
            html += "<th width='10%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>File #</th>";
            html += "<th width='15%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Matter/Intake Name</th>";
            html += "<th width='10%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Added by</th>";
            html += "<th width='25%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Note</th>";
            html += "<th width='15%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Category</th>";
            html += "<th width='15%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Linked Contact</th>";



            html += '</tr>';
            html += '</th>';
            html += '</tr>';

            html += '<tbody>';
            angular.forEach(noteList, function (note) {
                var noteText = '';
                if (utils.isNotEmptyVal(note.text)) {
                    noteText = utils.replaceHtmlEntites(note.text.replace(/<\/?[^>]+>/gi, ''));
                }
                noteText = utils.replaceQuoteWithActual(noteText);
                noteText = $filter('showSafeHtml')(noteText);
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
                html += '<td width="11%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;"> ' + getFormattedDate(note.created_date, "MM/DD/YYYY") + '</td>';
                html += '<td width="10%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;"> ' + utils.removeunwantedHTML(note.file_number) + '</td>';
                html += '<td width="15%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px; vertical-align:top"> ' + utils.removeunwantedHTML(note.matter_name) + '</td>';
                html += '<td width="10%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;">' + categoryName + '</td>';
                html += '<td width="25%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;"> ' + noteText + '</td>';
                html += '<td width="15%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px; vertical-align:top"> ' + utils.removeunwantedHTML(categoryGlobalDesc) + '</td>';
                html += '<td width="15%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px; vertical-align:top"> ' + utils.removeunwantedHTML(note.contact_names) + '</td>';
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

    }
})(angular);
