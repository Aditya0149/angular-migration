(function (angular) {

    angular.module('cloudlex.launcherSearch', [])

    angular
        .module('cloudlex.launcherSearch')
        .controller('LauncherSearchCtrl', SearchController)

    SearchController.$inject = ['$scope', '$state', 'launcherSearchDatalayer', 'launcherSearchHelper', 'eventsHelper', 'intakeEventsHelper', 'tasksHelper', 'IntakeTasksHelper',
        'notification-service', 'contactFactory', '$rootScope', 'mailboxDataService', 'globalConstants', 'scrollHelper'];

    function SearchController($scope, $state, searchDatalayer, searchHelper, eventsHelper, intakeEventsHelper, tasksHelper, IntakeTasksHelper,
        notificationService, contactFactory, $rootScope, mailboxDataService, globalConstants, scrollHelper) {
        var vm = this,
            initPageDataLimit = 50;

        vm.groupSavedSearches = groupSavedSearches;
        vm.setSelectedSearch = setSelectedSearch;
        vm.getResultForSearchParam = getResultForSearchParam;
        vm.getSearchedData = getSearchedData;
        vm.saveSearch = saveSearch;
        vm.showSave = showSave;
        vm.deleteSearch = deleteSearch;
        vm.goToContact = displayContactCard1;
        vm.goToDocuments = goToDocuments;
        vm.goToMatter = goToMatter;
        vm.goToEvent = goToEvent;
        vm.goToTask = goToTask;
        vm.setSelectedTab = setSelectedTab;
        vm.getStatusString = getStatusString;
        vm.defaultSearchParam = $rootScope.onIntake ? "intakes" : "matters";
        vm.firmData = { API: "PHP", state: "mailbox" };
        vm.resetPage = resetPage;
        vm.azureCallFlag = globalConstants.azureSearchServiceEnable;
        vm.reachedBottom = reachedBottom;
        vm.reachedTop = reachedTop;

        (function () {
            // vm.showSearchResults = false;
            vm.showSearchResultsMatter = false;
            vm.showSearchResultsIntake = false;
            vm.showSearchResultsContact = false;
            vm.showSearchResultsDocument = false;
            vm.showSearchResultsTaskAndEvent = false;

            vm.searchData = {
                contacts: [],
                matters: [],
                events: [],
                tasks: [],
                documents: []
            };
            vm.activeTab = $rootScope.onIntake ? "Intakes" : "Matters";
            scrollHelper.setReachedBottom(reachedBottom);
            scrollHelper.setReachedTop(reachedTop);
            vm.tabs = searchHelper.setTabs(vm.searchData);


            vm.searchParams = [
                { value: "matters", label: "Matters" },
                { value: "contacts", label: "Contacts" },
                { value: "documents", label: "Documents" },
                { value: "task_event", label: "Tasks & Events" }
            ];
            vm.searchParam = vm.defaultSearchParam;

            getUserEmailSignature();

            /**
             * firm basis module setting 
             */
            vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));

        })();

        function resetPage(param) {
            // vm.showSearchResults = false;
            //$scope.$apply(function () {
            vm.searchString = "";
            vm.includeArchived = "";

            //vm.searchParam = vm.defaultSearchParam;
            getSearchedData(vm.searchString);

            /**
             * reset search current tab
             */
            resetCurrentTabSearchInfo();
            if (param == 'Close') {
                vm.activeTab = "Matters";
            }
            //});
        }

        /**
         * reset current selected tab information 
         */
        function resetCurrentTabSearchInfo() {

            vm.showSearchResultsMatter = false;
            vm.showSearchResultsContact = false;
            vm.showSearchResultsDocument = false;
            vm.showSearchResultsTaskAndEvent = false;
            vm.showSearchResultsIntake = false;


            vm.matters = [];
            vm.contacts = [];
            vm.documents = [];
            vm.events = [];
            vm.tasks = [];
            vm.intakes = [];
            vm.searchString = "";

            switch (vm.activeTab) {
                case 'Matters':
                    vm.defaultSearchParam = "matters";
                    break;
                case 'Contacts':
                    vm.defaultSearchParam = "contacts";
                    break;
                case 'Documents':
                    vm.defaultSearchParam = "documents";
                    break;
                case 'TaskAndEvents':
                    vm.defaultSearchParam = "task_event";
                    break;
                case 'Intakes':
                    vm.defaultSearchParam = "intakes";
                    break;
            }
        }

        //  //set email signature
        function getUserEmailSignature() {
            mailboxDataService.emailSignature()
                .then(function (data) {
                    if (utils.isNotEmptyVal(data.data)) {
                        vm.signature = data.data[0];
                        vm.signature = '<br/><br/>' + vm.signature;
                    }
                });
        }

        // //US#8330
        $scope.$on('composeEmailFromContact', function (event, data) {
            vm.compose = true;
            var html = "";
            html += (vm.signature == undefined) ? '' : vm.signature;
            vm.composeEmail = html;
            $rootScope.updateComposeMailMsgBody(vm.composeEmail, '', '', '', 'contactEmail', data);
        });

        //US#8330
        $rootScope.$on("callCloseComposeMail", function () {
            closeComposeMail();
        });

        //US#8330
        function closeComposeMail() {
            vm.compose = false;
        }

        function reachedBottom() {
            vm.limit += initPageDataLimit;
        }

        function reachedTop() {
            vm.limit = initPageDataLimit;
        }

        function groupSavedSearches(saved) {
            if (!saved.isRecent) {
                return "Saved Searches";
            }

            if (saved.isRecent) {
                return "Last Searches";
            }
        }

        function setSelectedSearch(searchString) {
            vm.searchString = searchString;
            getSearchedData(vm.searchString);
        }

        function getSavedSearch() {
            searchDatalayer.getSavedSearches()
                .then(function (response) {
                    var data = response.data;
                    vm.savedSearchList = searchHelper.setSavedList(data);
                });
        }

        function getResultForSearchParam(searchString, searchParam) {
            if (utils.isEmptyVal(searchString)) {
                return;
            }

            getSearchedData(searchString, searchParam);
        }

        function getSearchedData(searchString, searchParam) {
            if (searchString == '') { return ''; }

            if (vm.azureCallFlag && searchParam == 'contacts') {
                searchDatalayer
                    .search1(searchString, searchParam)
                    .then(function (response) {
                        vm.contacts = response.data;
                        _.forEach(vm.contacts, function (item) {
                            setUpdatedContact(item);
                        })

                        vm.tabs = searchHelper.setTabs(response.data);
                        // vm.showSearchResults = true;
                        vm.showSearchResultsContact = true;


                        vm.showTabs = utils.isNotEmptyVal(searchString);
                        vm.isDataPresent = searchHelper.isDataPresent(response.data, vm.searchString);
                        vm.showNoDataMsg = (!vm.isDataPresent) && (angular.isDefined(searchString) && !utils.isEmptyString(searchString));
                        vm.savedSearchString = searchHelper.isInSavedList(searchString, vm.savedSearchList) ? searchString : undefined;

                        vm.setSelectedTab(searchParam);

                    });


            } else {

                if (searchParam == 'intakes' || searchParam == 'documents' || searchParam == 'task_event' || searchParam == 'matters') {

                    var searchFor = "";
                    var includeArchived = "";
                    switch (searchParam) {
                        case 'documents':
                            searchFor = "documents";
                            includeArchived = (vm.includeArchived) ? parseInt(vm.includeArchived) : 0;
                            vm.showSearchResultsDocument = true;
                            break;
                        case 'intakes':
                            searchFor = "intakes";
                            includeArchived = (vm.includeArchived) ? parseInt(vm.includeArchived) : 0;
                            vm.showSearchResultsIntake = true;
                            break;
                        case 'task_event':
                            searchFor = "task,events";
                            includeArchived = (vm.includeArchived) ? parseInt(vm.includeArchived) : 0;
                            vm.showSearchResultsTaskAndEvent = true;
                            break;
                        case 'matters':
                            searchFor = "matter";
                            includeArchived = (vm.includeArchived) ? parseInt(vm.includeArchived) : 0;
                            vm.showSearchResultsMatter = true;
                            break;
                    }
                    searchDatalayer
                        .searchJava(searchString, searchFor, includeArchived)
                        .then(function (response) {
                            $('.tooltip').remove();
                            vm.limit = initPageDataLimit;
                            vm.searchData = response;
                            processData(searchString, searchParam);
                        });
                } else {

                    var includeArchived = (vm.includeArchived) ? parseInt(vm.includeArchived) : 0;

                    searchDatalayer
                        .search(searchString, searchParam, includeArchived)
                        .then(function (response) {
                            $('.tooltip').remove();
                            vm.limit = initPageDataLimit;
                            vm.searchData = response.data;
                            processData(searchString, searchParam);
                        });
                }

            }

        }

        function processData(searchString, searchParam) {
            switch (searchParam) {
                case 'matters':
                    // vm.matters = _.uniq(vm.searchData.data.matter, 'matter_id');
                    vm.matters = vm.searchData.data.matter ? vm.searchData.data.matter : [];
                    vm.showSearchResultsMatter = true;

                    break;
                case 'contacts':
                    vm.contacts = vm.searchData.data.contacts;
                    vm.showSearchResultsContact = true;

                    break;
                case 'documents':
                    //vm.matterInfo = data.intakeData ? data.intakeData : [];
                    vm.documents = vm.searchData.data.documents ? vm.searchData.data.documents : [];
                    vm.showSearchResultsDocument = true;
                    // vm.documents = _.uniq(vm.searchData.data.documents, 'document_id');
                    break;
                case 'task_event':
                    vm.events = _.uniq(vm.searchData.data.events, 'event_id');
                    vm.tasks = _.uniq(vm.searchData.data.tasks, 'task_id');
                    vm.eventsLimits = (angular.isDefined(vm.tasks)) ? vm.tasks.length >= 2 ? 2 : 3 : 4;
                    vm.tasksLimit = (angular.isDefined(vm.events)) ? vm.events.length >= 2 ? 2 : 3 : 4;

                    vm.showSearchResultsTaskAndEvent = true;
                    break;
                case 'intakes':
                    vm.intakes = vm.searchData.data.intakes ? vm.searchData.data.intakes : [];
                    vm.showSearchResultsIntake = true;

                    break;
            }
            vm.tabs = searchHelper.setTabs(vm.searchData.data);
            //vm.showSearchResults = true;
            vm.showTabs = utils.isNotEmptyVal(searchString);
            vm.isDataPresent = searchHelper.isDataPresent(vm.searchData.data, vm.searchString);
            vm.showNoDataMsg = (!vm.isDataPresent) && (angular.isDefined(searchString) && !utils.isEmptyString(searchString));
            vm.savedSearchString = searchHelper.isInSavedList(searchString, vm.savedSearchList) ? searchString : undefined;

            vm.setSelectedTab(searchParam);
        }

        function saveSearch(searchString) {
            var searchObj = { string: searchString, save: 1 };
            searchDatalayer.saveSearch(searchObj)
                .then(function () {
                    vm.searchData.is_saved = 1;
                    getSavedSearch();
                    notificationService.success('search saved successfully');
                }, function () {
                    notificationService.success('unable to save search');
                })
        }

        function showSave(searchString) {
            if (utils.isEmptyVal(searchString) || utils.isEmptyVal(vm.savedSearchList)) {
                return false;
            }

            var savedStrings = _.find(vm.savedSearchList, function (search) {
                return ((search.string === searchString) && !search.isRecent)
            });

            return utils.isEmptyVal(savedStrings);
        }

        function deleteSearch(id, $event) {
            $event.stopPropagation();
            searchDatalayer.deleteSearch(id)
                .then(function () {
                    //vm.searchData.is_saved = 0;
                    getSavedSearch();
                    notificationService.success('search deleted successfully');
                }, function () {
                    notificationService.success('unable to delete search')
                })
        }

        function displayContactCard1(contact) {
            var contactId;
            if (vm.azureCallFlag) {
                contactId = contact.contact_id;
            } else {
                contactId = contact.contactid;
            }
            contactFactory.displayContactCard1(contactId, contact.edited, contact.contact_type);
            delete contact.edited;

            $scope.$on('contactCardEdited', function (event, editedContact) {

                var editedContactObj = editedContact;
                var index = _.findIndex(vm.contacts, function (contact) {
                    return contact.contact_id === editedContactObj.contact_id;
                });

                var updatedContact = angular.extend({}, vm.contacts[index], editedContactObj);
                setUpdatedContact(updatedContact);
                updatedContact.edited = true;
                vm.contacts[index] = updatedContact;
            })
        }

        function setUpdatedContact(contact) {
            var phoneNos = utils.isNotEmptyVal(contact.phone_numbers) ? contact.phone_numbers.split(',') : [];
            contact.phones_phone_number = phoneNos[0];

            var emails = utils.isNotEmptyVal(contact.email_ids) ? contact.email_ids.split(',') : [];
            contact.emailid = emails[0];
            return contact;
        }

        function goToDocuments(docRec) {
            if (docRec.is_Matter == 0) {
                //intake
                $state.go('intakedocument-view', { intakeId: docRec.id, documentId: docRec.document_id }, { reload: true });
            } else {
                //matter
                $state.go('document-view', { matterId: docRec.id, documentId: docRec.document_id }, { reload: true });
            }
        }

        function goToMatter(matter) {
            $state.go('add-overview', { matterId: matter.matter_id, isArchived: matter.is_archived == 1, isMatter: matter.is_archived == 0 });
        }

        function goToEvent(eventRec) {
            if (eventRec.id == 0) {
                return;
            }
            if (eventRec.is_Matter == 1) {
                var eventObj = { event_id: eventRec.event_id };
                eventsHelper.setSelectedEvent(eventObj);
                $state.go('events', { matterId: eventRec.id }, { reload: true });
            } else {
                var eventObj = { intake_event_id: eventRec.event_id };
                intakeEventsHelper.setSelectedEvent(eventObj);
                $state.go('intakeevents', { intakeId: eventRec.id }, { reload: true });
            }

        }

        function goToTask(task) {
            if (task.id == 0) {
                return;
            }
            if (task.is_Matter == 1) {
                var taskObj = { task_id: task.task_id, due_date: task.due_date, percentage_complete: task.percentage_complete };
                tasksHelper.setSavedTask(taskObj);
                $state.go('tasks', { matterId: task.id }, { reload: true });
            } else {
                task.intake_task_id = task.task_id;
                IntakeTasksHelper.setSavedTask(task);
                $state.go('intaketasks', { intakeId: task.id }, { reload: true });
            }

        }

        function setSelectedTab(tab) {
            vm.limit = initPageDataLimit;
            vm.currentTab = tab;
        }

        function getStatusString(matterobj) {
            if (utils.isEmptyVal(matterobj.status_name) && utils.isEmptyVal(matterobj.sub_status_name)) {
                return '-';
            } else {
                var status = utils.isEmptyVal(matterobj.status_name) ? '-' : matterobj.status_name;
                var subStatus = utils.isEmptyVal(matterobj.sub_status_name) ? '-' : matterobj.sub_status_name;
                return status + ' | ' + subStatus;
            }
        }

    }

    angular
        .module('cloudlex.launcherSearch')
        .factory('launcherSearchHelper', launcherSearchHelper)

    function launcherSearchHelper() {
        return {
            setTabs: _setTabs,
            setSavedList: _setSavedList,
            isDataPresent: _isDataPresent,
            isInSavedList: _isInSavedList
        };

        function _setTabs(data) {
            var tabs = [];

            var tabModel = [
                { prop: 'matters', display: 'Matters' },
                { prop: 'documents', display: 'Documents' },
                { prop: 'contacts', display: 'Contacts' }
            ];
            //set tabs mentioned in the obj above
            angular.forEach(tabModel, function (tab) {
                var tabObj = {
                    value: tab.prop,
                    label: (angular.isDefined(data[tab.prop]) ? data[tab.prop].length : 0) + ' ' + tab.display
                };
                tabs.push(tabObj);
            });
            //club tasks and events
            var taskCnt = angular.isDefined(data.tasks) ? data.tasks.length : 0;
            var eventCnt = angular.isDefined(data.events) ? data.events.length : 0;

            var taskAndEventsObj = {
                value: 'task_event',
                label: (taskCnt + eventCnt) + ' ' + 'Tasks & Events'
            };
            tabs.push(taskAndEventsObj);
            tabs.unshift({ value: 'all', label: 'All' });
            return tabs;
        }

        function _setSavedList(savedSearchData) {
            var list = [];
            _.forEach(savedSearchData.recent, function (item) {
                var searchObj = { count: item.count, string: item.string, isRecent: true };
                list.push(searchObj);
            })

            _.forEach(savedSearchData.saved, function (item) {
                var searchObj = { count: item.count, id: item.id, string: item.string, isRecent: false };
                list.push(searchObj);
            })

            return list;
        }

        function _isDataPresent(searchData, searchString) {
            return (!utils.isEmptyObj(searchData)) && (angular.isDefined(searchString) && !utils.isEmptyString(searchString));
        }

        function _isInSavedList(string, savedList) {
            var strings = _.pluck(savedList, 'string');
            return strings.indexOf(string) > -1;
        }
    }

})(angular);
