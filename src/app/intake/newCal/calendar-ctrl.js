(function () {
    'use strict';
    angular.module('intake.calendar', []);

    angular
        .module('intake.calendar')
        .controller('LauncherCalDayDetailsCtrl', LauncherCalDayDetailsCtrl);

    LauncherCalDayDetailsCtrl.$inject = ['$scope', '$modalInstance', '$state', 'data'
    ];

    function LauncherCalDayDetailsCtrl($scope, $modalInstance, $state, data) {

        var vm = this;

        vm.dayClickedInfo = angular.copy(data);
        vm.header = vm.dayClickedInfo.dayClicked.format("Do MMM, YYYY");
        $scope.closeDayDetails = function () {
            $modalInstance.dismiss();
        }

        $scope.cancel = function () {
            $modalInstance.dismiss();
        }

        $scope.goToEventMatter = function (event) {
            if (event.ismatter) {
                $state.go('add-overview', { matterId: event.matter_id }, { reload: true });
            } else {
                $state.go('intake-overview', { intakeId: event.matter_id }, { reload: true });
            }
        }

        $scope.goToEvent = function (event) {
            $modalInstance.close(event);
        }

    }

    angular
        .module('intake.calendar')
        .controller('LauncherCalendarCtrl', LauncherCalendarCtrl);

    LauncherCalendarCtrl.$inject = ['$scope', '$modal', '$filter', 'globalcalendarHelper', 'notification-service', 'eventsDataService',
        '$timeout', 'uiCalendarConfig', 'launcherCalendarDatalayer', 'intakeCalendarDatalayer', 'masterData',
        'globalConstants', '$rootScope', '$q', 'intakeEventsDataService'
    ];

    function LauncherCalendarCtrl($scope, $modal, $filter, calendarHelper, notificationService, eventsDataService,
        $timeout, uiCalendarConfig, launcherCalendarDatalayer, intakeCalendarDatalayer, masterData,
        globalConstants, $rootScope, $q, intakeEventsDataService) {

        var userRole = masterData.getUserRole();
        var vm = this;

        vm.rowCountOption = [{
            key: 1,
            lable: '1',
            divider: 1
        }, {
            key: 2,
            lable: '2',
            divider: 1
        }, {
            key: 3,
            lable: '3',
            divider: 1
        }, {
            key: 4,
            lable: '4',
            divider: 1
        }, {
            key: 5,
            lable: '5',
            divider: 1
        }, {
            key: 6,
            lable: 'All'
        }];

        vm.rowCountSeleted = 4;

        vm.changeRowCount = function (key, lable) {
            vm.rowCountSeleted = lable;
            if (lable == "All") {
                vm.uiConfig.calendar.eventLimit = false;
            } else {
                vm.uiConfig.calendar.eventLimit = key;
            }

        };

        var dataForAllEvent = [];
        var dataForMyEvent = [];
        var dataForPersonalEvent = [];
        var initializing = true;
        var masterData = angular.copy(masterData.getMasterData());
        vm.userSelectedDate = "";
        vm.dateFormat = 'MM/dd/yyyy';
        vm.datepickerOptions = {
            'starting-day': 0,
            'show-weeks': false
        };
        vm.openCloseDateSelector = false;
        vm.init = init;
        vm.resetCalendar = resetCalendar;
        vm.openFilterPopUp = openFilterPopUp;
        vm.tagCancelled = tagCancelled;
        vm.filter = {};
        vm.tags = [];
        vm.assignedToUserList = [];
        vm.showIntakeEvents = $rootScope.isIntakeActive == 1 ? '1' : '0';
        vm.showMatterEvents = '1';
        var modalInstance;
        var displayView;
        var defaultFilters = {
            "location": "",
            "selectedUsers": [],
            "showIntakeEvents": $rootScope.isIntakeActive == 1 ? '1' : '0',
            "showMatterEvents": "1",
            "showFuturEvents": "0"
        };
        vm.calArrayList = [];

        (function () {
            init();
            var filterStorageName = $rootScope.onMatter ? "onMatterIntakeCalendarFilter" : $rootScope.onIntake ? "onIntakeIntakeCalendarFilter" : "onLauncherIntakeCalendarFilter";
            vm.filter = JSON.parse(sessionStorage.getItem(filterStorageName));

            if (utils.isNotEmptyVal(vm.filter)) {
                if (typeof vm.filter.showIntakeEvents != 'undefined' && !utils.isEmptyString(vm.filter.showIntakeEvents)) {
                    if ($rootScope.isIntakeActive == 1) {

                    } else {
                        vm.filter.showIntakeEvents = '0';
                    }
                    vm.showIntakeEvents = vm.filter.showIntakeEvents;
                } else {
                    vm.filter.showIntakeEvents = vm.showIntakeEvents;
                }
                if (typeof vm.filter.showMatterEvents != 'undefined' && !utils.isEmptyString(vm.filter.showMatterEvents)) {
                    vm.showMatterEvents = vm.filter.showMatterEvents;
                } else {
                    vm.filter.showMatterEvents = vm.showMatterEvents;
                }
            } else {
                vm.filter = {};
                if (vm.showIntakeEvents == '1') {
                    vm.filter.showIntakeEvents = '1';
                }
                if (vm.showMatterEvents == '1') {
                    vm.filter.showMatterEvents = '1';
                }
            }
            vm.tags = generateTags(vm.filter);
            eventsDataService.getStaffsInFirm()
                .then(function (data) {
                    vm.assignedToUserList = data
                }, function (err) {
                    console.log(err);
                });

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

            vm.selectedMode = $rootScope.onMatter || $rootScope.onLauncher ? 2 : 1;
        })();
        function init() {
            var storageName = $rootScope.onMatter ? "onMatterselectedCalView" : $rootScope.onIntake ? "onIntakeselectedCalView" : "onLauncherselectedCalView";
            if (localStorage.getItem(storageName)) {
                switch (localStorage.getItem(storageName)) {
                    case "month":
                        vm.selectedButton = 0;
                        vm.displayCalendarView = 'month';
                        break;
                    case "agendaWeek":
                        vm.selectedButton = 1;
                        vm.displayCalendarView = 'agendaWeek';
                        break;
                    case "agendaDay":
                        vm.selectedButton = 2;
                        vm.displayCalendarView = 'agendaDay';
                        break;
                    default: vm.selectedButton = 0;
                        vm.displayCalendarView = 'month';
                }
            }
            else {
                vm.selectedButton = 0;
                vm.displayCalendarView = 'month';
            }

            displayView = vm.displayCalendarView;
            vm.eventClick = '1';
            vm.eventSources = [];
            vm.dropDownSource = [];
            vm.category = [];
            vm.eventClicked = false;
            vm.displayCalendar = true;
            vm.addEditMatterEventSelector = false;
            vm.addEditIntakeEvent = false;
            vm.addEditMatterEvent = false;
            vm.scheduleCalendar = false;
            vm.dropMatterId = '';
            vm.dateClicked = '';
            vm.calStartDate = '';
            vm.calEndDate = '';
            vm.showModal = false;
            vm.myEventFlag = true;

            vm.selectCategory = {
                LabelId: '0',
                Name: 'All Categories'
            };

            vm.selectedCategory = {};
            vm.categoryLength = 0;

            var typeStorageName = $rootScope.onMatter ? "onMatterglobalEventType" : $rootScope.onIntake ? "onIntakeglobalEventType" : "onLauncherglobalEventType";
            vm.filters = {
                complied: '0',
                filterby: (sessionStorage.getItem(typeStorageName) == "myevents" || sessionStorage.getItem(typeStorageName) == null) ? 'mymatterevent' : 'allmatterevent',
                assigned: [],
                location: ''
            };

            vm.allCompliedEventListBtns = [
                { label: "All", value: "0" },
                { label: "Hide Complied", value: "1" }
            ];

            vm.hideComplied = '0';

            if (angular.isDefined(masterData.event_types)) {
                vm.category.push(masterData.event_types);
            }
        }

        $scope.apply = function (selectedUsers, location, showIntakeEvents, showMatterEvents, showFuturEvents) {
            if (selectedUsers == undefined) {
                selectedUsers = {};
            }
            if (location == undefined) {
                location = '';
            }
            if (showMatterEvents == '0') {
                showFuturEvents = '0';
            }
            var obj = {
                selectedUsers: selectedUsers,
                location: location,
                showIntakeEvents: showIntakeEvents,
                showMatterEvents: showMatterEvents,
                showFuturEvents: showFuturEvents
            }
            modalInstance.close(obj);
        }

        $scope.reset = function () {
            vm.assignedUsers = {};
            vm.location = "";
            vm.showIntakeEvents = $rootScope.isIntakeActive == 1 ? '1' : '0';
            vm.showMatterEvents = '1';
            vm.showFuturEvents = '0';
        }

        $scope.cancelAddEventOp = function () {
            vm.addEditMatterEvent = false;
            vm.addEditIntakeEvent = false;
            modalInstance.dismiss();
        }

        $scope.proceedAddEventOp = function (addEventFor) {
            if (addEventFor == 1) {
                modalInstance.close(true);
            } else {
                modalInstance.close(false);
            }

        }

        $scope.cancel = function () {
            modalInstance.dismiss();
        }

        $scope.$watch(function () {
            if (
                ($scope.calendar.assignedUsers && $scope.calendar.assignedUsers.length > 0) ||
                ($scope.calendar && utils.isNotEmptyVal($scope.calendar.location)) ||
                $scope.calendar.tags.length > 0 ||
                $scope.calendar.showIntakeEvents == vm.showIntakeEvents ||
                $scope.calendar.showMatterEvents == vm.showMatterEvents
            ) {
                $scope.enableApply = false;
            } else {
                $scope.enableApply = true;
            }
        })

        //open filter pop up
        function openFilterPopUp() {
            var filterStorageName = $rootScope.onMatter ? "onMatterIntakeCalendarFilter" : $rootScope.onIntake ? "onIntakeIntakeCalendarFilter" : "onLauncherIntakeCalendarFilter";
            var calFilterV1 = sessionStorage.getItem(filterStorageName) ? sessionStorage.getItem(filterStorageName) : JSON.stringify(angular.copy(defaultFilters));
            var obj = JSON.parse(calFilterV1);
            var location;
            (utils.isNotEmptyVal(obj) && utils.isNotEmptyVal(obj.location)) ? location = obj.location : location = "";
            var assigned;
            (utils.isNotEmptyVal(obj) && utils.isNotEmptyVal(obj.selectedUsers)) ? assigned = obj.selectedUsers : assigned = {};
            if (utils.isNotEmptyVal(assigned)) {
                vm.assignedUsers = assigned;
            }
            vm.location = location;
            if ((utils.isNotEmptyVal(obj) && utils.isNotEmptyVal(obj.showFuturEvents))) {
                vm.showFuturEvents = obj.showFuturEvents;
            }

            modalInstance = $modal.open({
                templateUrl: 'app/intake/newCal/calendar-filter.html',
                scope: $scope,
                windowClass: 'modalMidiumDialog event-filter-popup',
                backdrop: 'static',
                keyboard: false
            });

            modalInstance.result.then(function (result) {
                vm.filter = result;
                vm.tags = generateTags(result);
                var filterStorageName = $rootScope.onMatter ? "onMatterIntakeCalendarFilter" : $rootScope.onIntake ? "onIntakeIntakeCalendarFilter" : "onLauncherIntakeCalendarFilter";
                sessionStorage.setItem(filterStorageName, JSON.stringify(vm.filter));
                var typeStorageName = $rootScope.onMatter ? "onMatterglobalEventType" : $rootScope.onIntake ? "onIntakeglobalEventType" : "onLauncherglobalEventType";
                var callFunc = sessionStorage.getItem(typeStorageName);
                callFunc == "allevents" ? vm.allEvent() : vm.myEvent();
            });

        }

        //generate tag for assigned user
        function generateTags(result) {
            var tags = [];

            if (result.showIntakeEvents == '1') {
                var tagObj = {
                    key: 'showIntakeEvents',
                    value: 'Intake Events'
                };
                tags.push(tagObj);
            }

            if (result.showMatterEvents == '1') {
                var tagObj = {
                    key: 'showMatterEvents',
                    value: 'Matter Events'
                };
                tags.push(tagObj);
            }

            if (result.showFuturEvents == '1') {
                var tagObj = {
                    key: 'showFuturEvents',
                    value: 'Include Future Events Of Closed Matters'
                };
                tags.push(tagObj);
            }

            if (utils.isNotEmptyVal(result.selectedUsers) && (result.selectedUsers.length > 0)) {
                _.forEach(result.selectedUsers, function (currentItem) {
                    var tagObj = {
                        key: 'assignto',
                        id: currentItem.user_id,
                        value: 'Assign to: ' + currentItem.full_name
                    };
                    tags.push(tagObj);
                });
            }

            if (utils.isNotEmptyVal(result.location)) {
                var tagObj = {
                    key: 'location',
                    value: 'Location: ' + result.location
                };
                tags.push(tagObj);
            }



            return tags;
        }

        //tagcancelled for selected assign to
        function tagCancelled(tag) {

            switch (tag.key) {
                case 'assignto':
                    var currentFilters = _.pluck(vm.filter.selectedUsers, 'user_id');
                    var index = currentFilters.indexOf(tag.id);
                    vm.filter.selectedUsers.splice(index, 1);
                    if (angular.isDefined(vm.filters) && angular.isDefined(vm.filters.selectedUsers)) {
                        vm.filters.selectedUsers.splice(index, 1);
                    }
                    break;
                case 'location':
                    vm.filter['location'] = '';
                    break;
                case 'showIntakeEvents':
                    vm.filter['showIntakeEvents'] = '0';
                    vm.showIntakeEvents = '0';
                    break;
                case 'showMatterEvents':
                    vm.filter['showMatterEvents'] = '0';
                    vm.showMatterEvents = '0';
                    vm.filter['showFuturEvents'] = '0';
                    vm.showFuturEvents = '0';
                    break;
                case 'showFuturEvents':
                    vm.filter['showFuturEvents'] = '0';
                    vm.showFuturEvents = '0';
                    break;
            }

            var filterStorageName = $rootScope.onMatter ? "onMatterIntakeCalendarFilter" : $rootScope.onIntake ? "onIntakeIntakeCalendarFilter" : "onLauncherIntakeCalendarFilter";
            sessionStorage.setItem(filterStorageName, JSON.stringify(vm.filter)); //store applied filters
            vm.tags = generateTags(vm.filter);
            var typeStorageName = $rootScope.onMatter ? "onMatterglobalEventType" : $rootScope.onIntake ? "onIntakeglobalEventType" : "onLauncherglobalEventType";
            var callFunc = sessionStorage.getItem(typeStorageName);
            callFunc == "allevents" ? vm.allEvent() : vm.myEvent();
        }

        function resetCalendar() {
            vm.filter = {};
            vm.filter['showIntakeEvents'] = '1';
            vm.filter['showMatterEvents'] = '1';
            var filterStorageName = $rootScope.onMatter ? "onMatterIntakeCalendarFilter" : $rootScope.onIntake ? "onIntakeIntakeCalendarFilter" : "onLauncherIntakeCalendarFilter";
            sessionStorage.setItem(filterStorageName, JSON.stringify(vm.filter));
            vm.tags = generateTags(vm.filter);
            $rootScope.$emit('calendarFilter', 'Events');
            //selected custom date should get removed and it should navigate to 'month' view
            localStorage.setItem('onMatterselectedCalView', 'month');
            localStorage.setItem('onLauncherselectedCalView', 'month');
            localStorage.setItem('onIntakeselectedCalView', 'month');


        }

        var permissions = masterData.user_permission;
        vm.eventsPermissions = _.filter(permissions[0].permissions, function (per) {
            if (per.entity_id == '3') {
                return per;
            }
        });


        vm.criticalDatesPermission = _.filter(permissions[0].permissions, function (user) {
            if (user.entity_id == '2') {
                return user;
            }
        });


        vm.printCalendar = printCalendar;
        vm.goToSelectedDate = goToSelectedDate;
        vm.openCloseDate = openCloseDate;

        vm.scheduleEvent = function () {
            vm.scheduleCalendar = true;
            vm.displayCalendar = false;
        };

        //display all event on click on All Event
        vm.allEvent = function () {
            var typeStorageName = $rootScope.onMatter ? "onMatterglobalEventType" : $rootScope.onIntake ? "onIntakeglobalEventType" : "onLauncherglobalEventType";
            sessionStorage.setItem(typeStorageName, "allevents");
            vm.myEventFlag = false;
            // check if current category is Personal event. If yes then chenge to All categories
            if (vm.selectCategory.Name == 'Personal Event') {
                // vm.selectCategory = { LabelId: '0', Name: 'All Categories' };
                vm.personalCategory = false;
            }
            var filterStorageName = $rootScope.onMatter ? "onMatterIntakeCalendarFilter" : $rootScope.onIntake ? "onIntakeIntakeCalendarFilter" : "onLauncherIntakeCalendarFilter";
            var calFilterV1 = sessionStorage.getItem(filterStorageName) ? sessionStorage.getItem(filterStorageName) : JSON.stringify(angular.copy(defaultFilters));
            var obj = JSON.parse(calFilterV1);
            var location = obj.location;
            var assigned = obj.selectedUsers;
            if (utils.isNotEmptyVal(assigned)) {
                vm.filters.assigned = angular.copy(_.pluck(assigned, 'user_id'));
            } else {
                vm.filters.assigned = [];
            }
            if (utils.isNotEmptyVal(location)) {
                vm.filters.location = angular.copy(location);
            } else {
                vm.filters.location = '';
            }
            vm.filters.filterby = "allmatterevent";
            vm.filters.showFuturEvents = obj.showFuturEvents;
            fetchData(true, vm.filters.showFuturEvents == 1);

        };

        function fetchData(allEvents, isComplied) {
            var eventList = [];
            var dataRequests = [];
            if (vm.filters && typeof (vm.filters.showFuturEvents) == 'undefined') {
                vm.filters.showFuturEvents = '0';
            }

            if (vm.showMatterEvents == '1') {
                if (isComplied) {
                    dataRequests.push(getCompliedMatterEvents(allEvents));
                } else {
                    dataRequests.push(getMatterEvents(allEvents));
                }
            }
            if (vm.showIntakeEvents == '1' && $rootScope.isIntakeActive == 1) {
                if (isComplied) {
                    dataRequests.push(getCompliedIntakeEvents(allEvents));
                } else {
                    dataRequests.push(getIntakeEvents(allEvents));
                }
            }
            $q.all(dataRequests).then(function (responses) {
                var values = angular.copy(responses);
                var intakeEvents = [], matterEvents = [];
                if (vm.showMatterEvents == '1') {
                    if (vm.showIntakeEvents == '1' && $rootScope.isIntakeActive == 1) {
                        intakeEvents = calendarHelper.intakeToMatterEventMapping(values[1].data);
                        matterEvents = calendarHelper.matterToMatterEventMapping(values[0].data);
                        vm.calArrayList = values[0].data;
                    } else {
                        matterEvents = calendarHelper.matterToMatterEventMapping(values[0].data);
                        vm.calArrayList = values[0].data;
                    }

                } else {
                    if (vm.showIntakeEvents == '1' && $rootScope.isIntakeActive == 1) {
                        intakeEvents = calendarHelper.intakeToMatterEventMapping(values[0].data);
                    }
                }

                var events = {
                    data: matterEvents.concat(intakeEvents)
                };
                eventList = vm.criticalDatesPermission[0].V == 0 ? setCriticalEvents(events) : events;
                _.forEach(eventList.data, function (eve) {
                    eve.originalTitle = eve.title;
                });
                if (allEvents) {
                    dataForAllEvent = angular.copy(eventList);
                } else {
                    dataForMyEvent = angular.copy(eventList);
                }
                if (vm.selectedModel.length > 0) {
                    vm.getSelectCategoryDetails(vm.selectedModel);
                } else {
                    vm.getSelectCategoryDetails(typeof vm.selectedModel === 'object' && vm.selectedModel.length > 0 ? vm.selectedModel : vm.selectCategory.Name);
                }
            });
        }

        //display my event on click of My Event
        vm.myEvent = function () {
            var typeStorageName = $rootScope.onMatter ? "onMatterglobalEventType" : $rootScope.onIntake ? "onIntakeglobalEventType" : "onLauncherglobalEventType";
            sessionStorage.setItem(typeStorageName, "myevents");
            vm.myEventFlag = true;
            // check if current category is Personal event. If yes then chenge to All categories
            if (vm.selectCategory.Name == 'Personal Event') {
                // vm.selectCategory = { LabelId: '0', Name: 'All Categories' };
                vm.personalCategory = false;
            }
            var filterStorageName = $rootScope.onMatter ? "onMatterIntakeCalendarFilter" : $rootScope.onIntake ? "onIntakeIntakeCalendarFilter" : "onLauncherIntakeCalendarFilter";
            var calFilterV1 = sessionStorage.getItem(filterStorageName) ? sessionStorage.getItem(filterStorageName) : JSON.stringify(angular.copy(defaultFilters));
            var obj = JSON.parse(calFilterV1);
            var location = obj.location;
            var assigned = obj.selectedUsers;
            if (utils.isNotEmptyVal(assigned)) {
                vm.filters.assigned = angular.copy(_.pluck(assigned, 'user_id'));
            } else {
                vm.filters.assigned = [];
            }
            if (utils.isNotEmptyVal(location)) {
                vm.filters.location = angular.copy(location);
            } else {
                vm.filters.location = '';
            }

            vm.filters.filterby = 'mymatterevent';
            vm.filters.showFuturEvents = obj.showFuturEvents;
            fetchData(false, vm.filters.showFuturEvents == 1);
        };

        function getMatterEvents(allEvent) {
            var filterCopy = angular.copy(vm.filters);
            filterCopy.start = filterCopy.s;
            filterCopy.end = filterCopy.e;
            delete filterCopy.s;
            delete filterCopy.e;
            delete filterCopy.selectedUsers;
            if (allEvent) {
                return launcherCalendarDatalayer
                    .allEvent(filterCopy);
            } else {
                return launcherCalendarDatalayer
                    .myEvent(filterCopy);
            }

        }

        function getIntakeEvents(allEvent) {
            var filterCopy = angular.copy(vm.filters);
            delete filterCopy.selectedUsers;
            if (allEvent) {
                return intakeCalendarDatalayer
                    .allEvent(filterCopy);
            } else {
                return intakeCalendarDatalayer
                    .myEvent(filterCopy);
            }

        }

        function getCompliedMatterEvents(allEvent) {
            var filterCopy = angular.copy(vm.filters);
            delete filterCopy.selectedUsers;
            if (allEvent) {
                return launcherCalendarDatalayer
                    .getCompliedEventList(filterCopy);
            } else {
                return launcherCalendarDatalayer
                    .getCompliedEventList(filterCopy);
            }

        }

        function getCompliedIntakeEvents(allEvent) {
            var filterCopy = angular.copy(vm.filters);
            delete filterCopy.selectedUsers;
            if (allEvent) {
                return intakeCalendarDatalayer
                    .getCompliedEventList(filterCopy);
            } else {
                return intakeCalendarDatalayer
                    .getCompliedEventList(filterCopy);
            }

        }

        function scrollTo8AMFunc() {
            $timeout(function () {
                if (displayView === "agendaWeek" || displayView === "agendaDay") {
                    var container = $('.fc-time-grid-container');
                    var data;
                    switch (vm.filters.filterby) {
                        case "mymatterevent": {
                            data = dataForMyEvent;
                            break;
                        };
                        case "allmatterevent": {
                            data = dataForAllEvent;
                            break;
                        };
                        case "personalevent": {
                            data = dataForPersonalEvent;
                        }

                    };

                    container.animate({
                        scrollTop: $("#8am").position().top
                    }, 100);
                }
            }, 300);
        }

        function setCriticalEvents(events) {
            if (vm.criticalDatesPermission[0].V == 0) {
                var event = _.filter(events.data, function (event) {
                    if (event.is_critical != 1) {
                        events.data.push(event);
                    }
                });
                return events;
            }
            else {
                return events;
            }
        }

        //display Personal events on Click of Personal Events link
        vm.personalEvents = function () {
            vm.filters.filterby = "personalevent";
            var filterStorageName = $rootScope.onMatter ? "onMatterIntakeCalendarFilter" : $rootScope.onIntake ? "onIntakeIntakeCalendarFilter" : "onLauncherIntakeCalendarFilter";
            var calFilterV1 = sessionStorage.getItem(filterStorageName) ? sessionStorage.getItem(filterStorageName) : JSON.stringify(angular.copy(defaultFilters));
            var obj = JSON.parse(calFilterV1);
            var location = obj.location;
            var assigned = obj.selectedUsers;
            if (utils.isNotEmptyVal(assigned)) {
                vm.filters.assigned = angular.copy(_.pluck(assigned, 'user_id'));
            } else {
                vm.filters.assigned = [];
            }
            if (utils.isNotEmptyVal(location)) {
                vm.filters.location = angular.copy(location);
            } else {
                vm.filters.location = '';
            }
            launcherCalendarDatalayer
                .personalEvents(vm.filters)
                .then(function (events) {
                    dataForPersonalEvent = events;
                    _.forEach(dataForPersonalEvent.data, function (eve) {
                        eve.originalTitle = eve.title;
                    });
                    vm.selectCategory = { Name: "Personal Event", LabelId: "19" }; // since for personal event, Personal event is the only category
                    vm.personalCategory = true; // for disable function
                    if (vm.selectedModel.length > 0) {
                        vm.getSelectCategoryDetails(vm.selectedModel);
                    } else {
                        vm.getSelectCategoryDetails(typeof vm.selectedModel === 'object' && vm.selectedModel.length > 0 ? vm.selectedModel : vm.selectCategory.Name);
                    }

                })
        };

        vm.getSelectCategoryDetails = function (categoryName) {
            vm.selectedModel;
            vm.selectedCategory = [];
            vm.categoryLength;
            var filteredData = [];
            var events;
            switch (vm.filters.filterby) {
                case "mymatterevent": {
                    events = dataForMyEvent;
                    break;
                };
                case "allmatterevent": {
                    events = dataForAllEvent;
                    break;
                };
                case "personalevent": {
                    events = dataForPersonalEvent;
                }

            };
            if (!(categoryName == "All Categories" || utils.isEmptyVal(categoryName) || categoryName == "Personal Event")) {
                var filteredEvents = [];
                vm.eventSources.length = 0;
                _.forEach(categoryName, function (categoryNameKey) {
                    vm.selectedCategory.push(categoryNameKey.id);
                    vm.categoryLength = vm.category[0].length;
                    _.forEach(events.data, function (evnt) {
                        if (evnt.isIntake) {

                            if (categoryNameKey.id == "Other" && evnt.labelid == 100 || categoryNameKey.id == "Deadline" && evnt.labelid == 32) {
                                filteredEvents.push(evnt);
                            } else {
                                if (categoryNameKey.id == evnt.event_title) {
                                    filteredEvents.push(evnt);
                                }
                            }
                        } else {
                            if (categoryNameKey.id == evnt.name) {
                                filteredEvents.push(evnt);
                            }
                        }
                    });
                });

                _.forEach(filteredEvents, function (filteredEvent) {
                    calendarHelper.setEvent(filteredEvent, userRole.role);
                    filteredData.push(filteredEvent);
                });

                vm.eventSources.push(filteredData);
            } else {
                setEvents(events)
            }
            scrollTo8AMFunc();
        };

        function setEvents(events) {
            if (events.data) {
                vm.eventSources.length = 0;
                _.forEach(events.data, function (event) {
                    calendarHelper.setEvent(event, userRole.role);
                });
                vm.eventSources.push(events.data);
            }
        };

        /* Show all event list */
        vm.allCompliedEventList = function (showFuturEvents) {

            if (initializing) {
                return;
            }
            var filterStorageName = $rootScope.onMatter ? "onMatterIntakeCalendarFilter" : $rootScope.onIntake ? "onIntakeIntakeCalendarFilter" : "onLauncherIntakeCalendarFilter";
            var calFilterV1 = sessionStorage.getItem(filterStorageName) ? sessionStorage.getItem(filterStorageName) : JSON.stringify(angular.copy(defaultFilters));
            var obj = JSON.parse(calFilterV1);
            var location = obj.location;
            var assigned = obj.selectedUsers;

            if (utils.isNotEmptyVal(obj)) {
                if (typeof obj.showIntakeEvents != 'undefined' && !utils.isEmptyString(obj.showIntakeEvents)) {
                    if ($rootScope.isIntakeActive == 1) {

                    } else {
                        obj.showIntakeEvents = '0';
                    }
                    vm.showIntakeEvents = obj.showIntakeEvents;
                } else {
                    obj.showIntakeEvents = vm.showIntakeEvents;
                }
                if (typeof obj.showMatterEvents != 'undefined' && !utils.isEmptyString(obj.showMatterEvents)) {
                    vm.showMatterEvents = obj.showMatterEvents;
                } else {
                    obj.showMatterEvents = vm.showMatterEvents;
                }
            } else {
                obj = {};
                if (vm.showIntakeEvents == '1') {
                    obj.showIntakeEvents = '1';
                }
                if (vm.showMatterEvents == '1') {
                    obj.showMatterEvents = '1';
                }
            }

            if (utils.isNotEmptyVal(assigned)) {
                vm.filters.assigned = angular.copy(_.pluck(assigned, 'user_id'));
                vm.filters.selectedUsers = obj.selectedUsers;
            } else {
                vm.filters.assigned = [];
            }
            if (utils.isNotEmptyVal(location)) {
                vm.filters.location = angular.copy(location);
            } else {
                vm.filters.location = '';
            }
            vm.filters.showIntakeEvents = angular.copy(obj.showIntakeEvents);
            vm.filters.showMatterEvents = angular.copy(obj.showMatterEvents);

            // if (showFuturEvents) {
            //     vm.filters.showMatterEvents = '1';
            //     vm.filter['showMatterEvents'] = '1';
            //     vm.showMatterEvents = '1';
            // }
            vm.tags = generateTags(vm.filters);
            var filterStorageName = $rootScope.onMatter ? "onMatterIntakeCalendarFilter" : $rootScope.onIntake ? "onIntakeIntakeCalendarFilter" : "onLauncherIntakeCalendarFilter";
            sessionStorage.setItem(filterStorageName, JSON.stringify(vm.filter));
            fetchData(vm.filters.filterby != "mymatterevent", true);
        };

        // Change View
        vm.changeView = function (view, calendar) {
            switch (view) {
                case "month":
                    vm.selectedButton = 0;
                    break;
                case "agendaWeek":
                    vm.selectedButton = 1;
                    break;
                case "agendaDay":
                    vm.selectedButton = 2;
                    break;
            }
            displayView = view;
            var storageName = $rootScope.onMatter ? "onMatterselectedCalView" : $rootScope.onIntake ? "onIntakeselectedCalView" : "onLauncherselectedCalView";
            localStorage.setItem(storageName, displayView);
            uiCalendarConfig.calendars[calendar].fullCalendar('changeView', view);
        };

        // Change View
        vm.renderCalender = function (calendar) {
            if (uiCalendarConfig.calendars[calendar]) {
                uiCalendarConfig.calendars[calendar].fullCalendar('render');
            }
        };

        // Render Tooltip
        vm.eventRender = function (event, element, view) {
            var allUsers = "";
            var intakeType = "Matter Event";

            if (event.assignedTo) {
                allUsers = "";
                _.forEach(event.assignedTo, function (currentItem, currentIndex) {
                    allUsers += [currentItem.first_name, currentItem.last_name].join(" ");
                    if (currentIndex < (event.assignedTo.length - 1))
                        allUsers += ",\n";
                })
            }
            if (event.isIntake && event.assign_to) {
                intakeType = "Intake Event";
                allUsers = "";
                _.forEach(event.assign_to, function (currentItem, currentIndex) {
                    allUsers += [currentItem.fname, currentItem.lname].join(" ");
                    if (currentIndex < (event.assign_to.length - 1))
                        allUsers += ",\n";
                });

            }
            var tooltipEventDesc;
            if (event.description && event.description.length > 100) {
                tooltipEventDesc = $filter('cut')(event.description, false, 99)
            }
            else {
                tooltipEventDesc = event.description;
            }

            //Check for null value - Tooltip
            if (tooltipEventDesc == null) {
                tooltipEventDesc = "";
            }

            //remove whitespace without matter for other and personal events
            // if(event.labelid == 19 && event.matter_id == 0){
            //     event.title = "Personal Event";
            // }

            // if(event.labelid == 100 && event.matter_id == 0){
            //     event.title = "Other";
            // }


            // element.attr({

            //     'tooltip': intakeType + ",\n" + event.title + "" + '\nAssigned To:' + " " + allUsers + '\nDescription:' + " " + tooltipEventDesc,
            //     'tooltip-append-to-body': true,
            // });
            // $compile(element)($scope);
            // $('.tooltip').remove();
        };

        function openAddEditEvent(event) {
            $timeout(function () {

                if (event.isIntake) {
                    vm.addEditIntakeEvent = true;
                } else {
                    vm.addEditMatterEvent = true;
                }
                vm.displayCalendar = false;
                $('.tooltip').remove();
            }, 100);

            if (event.isIntake) {
                vm.intake_event_id = event.intake_event_id;
                vm.intake_id = event.intake_id;
            } else {
                vm.eventId = event.id;
                vm.matterId = event.matterid;
            }

            vm.editCalendarEvent = true;
        };

        var dateRangeFilter = {};
        function openPopUp(event) {
            var modalInstance = $modal.open({
                templateUrl: 'app/intake/newCal/openDetailsPopUp.html',
                controller: 'EventDetailsCtrl as detailsCtrl',
                windowClass: 'cal-pop-up',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    data: function () {
                        return angular.copy(event);
                    },
                    userList: function () {
                        return angular.copy(vm.assignedToUserList);
                    },
                    access: function () {
                        return {
                            criticalDate: angular.copy(vm.criticalDatesPermission),
                            permission: angular.copy(vm.eventsPermissions)
                        }
                    }
                }
            });

            modalInstance.result.then(function (eventselected) {
                vm.dayClickedInfo = null;
                if (eventselected == 'showDetails') {
                    vm.showEventDetails(event);
                }
                if (eventselected != 'showDetails') {
                    event.assignedTo = eventselected;
                }
            }, function () {
                vm.dayClickedInfo = null;
            });
        }
        vm.showEventDetails = function (event) {
            openAddEditEvent(event);
            dateRangeFilter.mode = vm.selectedButton;
            dateRangeFilter.date = event.start;
            vm.userSelectedDate = moment(dateRangeFilter.date).format("MM/DD/YYYY");
        }
        vm.alertOnEventClick = function (event, date, jsEvent, view) {
            openPopUp(event);
        };

        vm.goToCalendar = function () {
            vm.selectedMode = $rootScope.onMatter || $rootScope.onLauncher ? 2 : 1;
            vm.editCalendarEvent = false;
            vm.displayCalendar = true;
            vm.addEditMatterEventSelector = false;
            vm.addEditIntakeEvent = false;
            vm.addEditMatterEvent = false;
            setSelectedDateRangeFilters();
        }

        function setSelectedDateRangeFilters() {
            var dateRangeFilters = ["month", "agendaWeek", "agendaDay"];
            vm.selectedButton = dateRangeFilter.mode;

            uiCalendarConfig.calendars['myCalendar1']
                .fullCalendar('changeView', dateRangeFilters[vm.selectedButton]);

            uiCalendarConfig.calendars['myCalendar1']
                .fullCalendar('gotoDate', dateRangeFilter.date);
            switch (vm.filters.filterby) {
                case 'mymatterevent':
                    vm.myEvent();
                    break;
                case 'allmatterevent':
                    vm.allEvent();
                    break;
                case 'personalevent':
                    vm.personalEvents();
            }
        };

        /* alert on Drop */
        vm.alertOnDrop = function (event, delta, revertFunc, jsEvent, ui, view) {
            $('.tooltip').remove();
            saveCalendarEvent(event, delta, null);
        };

        vm.eventResize = function (event, delta, revertFunc, jsEvent, ui, view) {
            $('.tooltip').remove();
            (event.allDay || event.allday == '1' || event.all_day == '1') ? revertFunc() : saveCalendarEvent(event, delta, true);
        };

        function saveCalendarEvent(dragEvent, delta, isResized) {
            if (vm.selectedButton == 2 || vm.selectedButton == 1) {
                if (dragEvent.labelid == 1 || dragEvent.labelid == 6 || dragEvent.labelid == 15 || dragEvent.labelid == 17) {
                    switch (vm.filters.filterby) {
                        case 'mymatterevent':
                            vm.myEvent();
                            break;
                        case 'allmatterevent':
                            vm.allEvent();
                            break;
                        case 'personalevent':
                            vm.personalEvents();
                    }
                    notificationService.error('Can not update critical dates as non full day');
                    return;
                } else {
                    dragEvent.allday = (dragEvent.allDay) ? 1 : 0;
                    dragEvent.all_day = (dragEvent.allDay) ? 1 : 0;
                }
            } else {
                dragEvent.allday = (dragEvent.allDay) ? 1 : 0;
                dragEvent.all_day = (dragEvent.allDay) ? 1 : 0;
            }
            var newDragEvent = dragEvent.isIntake ? calendarHelper.modifyIntakeEventToEdit(dragEvent, delta, isResized) : calendarHelper.modifyEventToEdit(dragEvent, delta, isResized);

            if (dragEvent.isIntake) {
                editEvents(newDragEvent, true)
            }
            else {
                var calEventList = angular.copy(vm.calArrayList);
                _.forEach(calEventList, function (event, index) {
                    if (event.event_id == dragEvent.id) {
                        var mId = null;
                        if (!(event.reminder_users == "matter" || event.reminder_users == "all")) {
                            event.reminder_users = JSON.parse(event.reminder_users).join();
                            event.reminder_users_id = 3;
                        }

                        event.sms_contact_ids = event.sms_contact_ids ? JSON.parse(event.sms_contact_ids).join() : '';
                        if (event.matter && event.matter.matter_id) {
                            mId = event.matter.matter_id;
                        }

                        if (newDragEvent.end < parseInt(event.custom_reminder)) {
                            event.custom_reminder = "";
                        }
                        if (newDragEvent.end < parseInt(event.sms_custom_reminder)) {
                            event.sms_custom_reminder = "";
                        }
                        var newEvent = {
                            all_day: (newDragEvent.allday) ? newDragEvent.allday : 0,
                            custom_reminder: event.custom_reminder,
                            sms_custom_reminder: event.sms_custom_reminder,
                            description: (event.description) ? event.description : "",
                            is_comply: 0,
                            is_task_created: event.is_task_created,
                            label_id: parseInt(event.label_id),
                            location: event.location,
                            matter: {
                                matter_id: mId
                            },
                            private: event.private,
                            remind_date: event.remind_date,
                            reminder_days: (event.reminder_days) ? event.reminder_days : "",
                            sms_reminder_days: (event.sms_reminder_days) ? event.sms_reminder_days : "",
                            reminder_users_id: event.reminder_users_id,
                            reminder_users: event.reminder_users,
                            sms_contact_ids: event.sms_contact_ids,
                            title: event.title,
                            user_defined: event.user_defined,
                            end: newDragEvent.end,
                            start: newDragEvent.start,
                            is_personalevent: (event.label_id == 19) ? 1 : 0,
                            user_ids: utils.isEmptyVal(event.assignedTo) ? [] : _.pluck(event.assignedTo, 'user_id'),
                            share_with: (event.share_with) ? event.share_with.map(Number) : [],
                            is_critical: event.is_critical,
                            is_deadline: event.is_deadline,
                            matterdatetypeid: event.matterdatetypeid,
                            event_name: event.event_name,
                            task: { "task_id": event.task && (event.task.task_id) ? event.task.task_id : "" },
                            event_id: event.event_id,
                            reason: event.reason,
                            comments: event.comments

                        }
                        editEvents(newEvent, false);
                    }
                });
            }

        };

        function refreshCalGrid(data) {
            switch (vm.filters.filterby) {
                case 'mymatterevent':
                    vm.myEvent();
                    break;
                case 'allmatterevent':
                    vm.allEvent();
                    break;
                case 'personalevent':
                    vm.personalEvents();
            }
            if (data && data.message == "You do not have permission to update event") {
                notificationService.error(data.message);
            } else if (!data) {
                notificationService.success('Event updated succesfully!');
            }
        }

        function editEvents(event, isIntake) {
            if (isIntake) {

                intakeEventsDataService.updateEvent(event.intake_event_id, event)
                    .then(function (data) {
                        refreshCalGrid();
                    }, function () {
                    });
            }
            else {

                eventsDataService.updateEvent_OFF_DRUPAL(event.event_id, event)
                    .then(function (data) {
                        refreshCalGrid();
                    }, function (data) {
                        refreshCalGrid(data);
                    });
            }

        };

        function fetchEventfromObject(allEventsFromDay) {
            var eventList = [];
            _.forEach(allEventsFromDay, function (singleEventData) {
                var singleEvent = singleEventData.event;
                var eventObj = {
                    allDay: singleEvent.allDay,
                    allday: singleEvent.allday,
                    assignedTo: singleEvent.assignedTo,
                    description: singleEvent.description,
                    id: singleEvent.id,
                    intake_event_id: singleEvent.intake_event_id,
                    isComply: singleEvent.isComply,
                    is_critical: singleEvent.is_critical,
                    isdeleted: singleEvent.isdeleted,
                    ismatter: singleEvent.ismatter,
                    isIntake: singleEvent.isIntake,
                    ispersonalevent: singleEvent.ispersonalevent,
                    labelid: singleEvent.labelid,
                    location: singleEvent.location,
                    matter_name: singleEvent.matter_name,
                    matter_id: singleEvent.matter_id,
                    matterid: singleEvent.matter_id,
                    intake_id: singleEvent.matter_id,
                    name: singleEvent.name,
                    originalTitle: singleEvent.originalTitle,
                    title: singleEvent.title,
                    utcend: singleEvent.utcend,
                    utcstart: singleEvent.utcstart
                }
                eventList.push(eventObj);
            });

            return eventList;
        }

        vm.showMoreClick = function (info) {
            vm.dayClickedInfo = {
                dayClicked: moment(info.date),
                events: fetchEventfromObject(info.segs)
            };
            modalInstance = $modal.open({
                templateUrl: 'app/intake/newCal/eventTypeSelector.html',
                controller: 'LauncherCalDayDetailsCtrl as dayDetail',
                size: 'lg',
                windowClass: 'modalLargeDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    data: function () {
                        return angular.copy(vm.dayClickedInfo);
                    }
                }
            });

            modalInstance.result.then(function (eventselected) {
                vm.dayClickedInfo = null;
                if (eventselected) {
                    vm.alertOnEventClick(eventselected);
                }
            }, function () {
                vm.dayClickedInfo = null;
            });


        }

        vm.addNewEvent = function (date, jsEvent, view) {

            $timeout(function () {
                vm.displayCalendar = false;
                vm.addEditMatterEventSelector = true;
                dateRangeFilter.mode = vm.selectedButton;
                dateRangeFilter.date = date;
                $scope.calendar.startTimeSlot = date.format("hh:mm A");
                $scope.calendar.endTimeSlot = date.add(1, 'h').format("hh:mm A");
                $scope.calendar.displayCalView = displayView;
                vm.dateClicked = date.format('YYYY-MM-DD');
                vm.selectedDateToAdd = date;
                vm.userSelectedDate = moment(date).format("MM/DD/YYYY");

            }, 100);
        };

        vm.calDateRange = function (view, element) {
            vm.dateString = view.title;
            /*Get the date range displayed on calendar*/
            $('.tooltip').remove();

            var dateRange = calendarHelper.setCalDateRange(view);
            vm.startPrint = dateRange.startdate;
            vm.endPrint = dateRange.enddate;

            if (vm.selectedButton == 2) {
                var date = new Date(view.title);
                vm.userSelectedDate = moment(date).format("MM/DD/YYYY");
            }
            //by default my event will display
            if (utils.isNotEmptyVal(dateRange.startdate) || utils.isNotEmptyVal(dateRange.enddate)) {
                vm.calStartDate = dateRange.startdate;
                vm.calEndDate = dateRange.enddate;

                vm.filters.s = dateRange.startdate;
                vm.filters.e = dateRange.enddate;

                vm.eventSources.length = 0;
                //show my or all events based on the selected filters
                switch (vm.filters.filterby) {
                    case 'mymatterevent':
                        vm.myEvent();
                        break;
                    case 'allmatterevent':
                        vm.allEvent();
                        break;
                    case 'personalevent':
                        vm.personalEvents();
                }
            }

            initializing = false;
        };

        function getDefaultView() {
            var storageName = $rootScope.onMatter ? "onMatterselectedCalView" : $rootScope.onIntake ? "onIntakeselectedCalView" : "onLauncherselectedCalView";
            return localStorage.getItem(storageName) ? localStorage.getItem(storageName) : "month";
        }

        vm.uiConfig = {
            calendar: {
                eventLimit: vm.rowCountSeleted,
                //eventLimitClick: vm.showMoreClick,
                //eventLimitText: "",
                //views: {
                //    dayGridMonth: {
                //        eventLimit: 2
                //    }
                //},
                height: '100%',
                //height: 'auto',
                editable: true,
                selectable: true,
                nextDayThreshold: '00:00:00',
                defaultView: getDefaultView(),
                header: {
                    left: '',
                    center: '',
                    right: ''
                },
                buttonText: {
                    today: 'Today'
                },
                firstDay: 0,
                slotDuration: '00:60:00',
                allDayText: "All-Day",
                axisFormat: 'h(:mm) A',
                //slotDuration: '00:30:00',
                //minTime: "08:00:00",
                //maxTime: "18:00:00",
                dayClick: vm.addNewEvent,
                eventClick: vm.alertOnEventClick,
                eventDrop: vm.alertOnDrop,
                eventRender: vm.eventRender,
                eventDragStart: dragStart,
                eventDragStop: dragStop,
                eventResize: vm.eventResize,
                viewRender: vm.calDateRange
            }
        };

        vm.clickNext = function () {
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('next');
        }


        vm.clickPrev = function () {
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('prev');
        }


        vm.clickToday = function () {
            uiCalendarConfig.calendars['myCalendar1'].fullCalendar('today');
            if (vm.selectedButton == 1 || vm.selectedButton == 0) {
                vm.userSelectedDate = moment().format("MM/DD/YYYY");
            }
        }

        function dragStop() {
            $('.tooltip').remove();
        };

        function dragStart() {
            $('.tooltip').remove();
        };

        /*Print Events*/
        function printCalendar(selectedFilters, selectedCat) {
            $timeout(function () {
                var datesObj = new Array();
                var selectCategory = new Array();
                var filters = angular.copy(selectedFilters);
                filters.from = "sch";
                filters.allEvent = filters.filterby === "allmatterevent";
                var eventClick;
                switch (filters.filterby) {
                    case "mymatterevent": { eventClick = 1; break; };
                    case "allmatterevent": { eventClick = 0; break; };
                    case "personalevent": { eventClick = 2 }
                };
                var filterStorageName = $rootScope.onMatter ? "onMatterIntakeCalendarFilter" : $rootScope.onIntake ? "onIntakeIntakeCalendarFilter" : "onLauncherIntakeCalendarFilter";
                var calFilterV1 = sessionStorage.getItem(filterStorageName) ? sessionStorage.getItem(filterStorageName) : JSON.stringify(angular.copy(defaultFilters));
                var obj = JSON.parse(calFilterV1);
                var location = obj.location;
                var assigned = obj.selectedUsers;
                if (utils.isNotEmptyVal(assigned)) {
                    vm.filters.assigned = angular.copy(_.pluck(assigned, 'user_id'));
                    filters.assigned = angular.copy(_.pluck(assigned, 'user_id'));
                } else {
                    vm.filters.assigned = [];
                    filters.asigned = [];
                }
                if (utils.isNotEmptyVal(location)) {
                    filters.location = angular.copy(location);
                } else {
                    filters.location = '';
                }
                delete filters.selectedUsers;
                //ajax call required to get assigned to property
                //intakeCalendarDatalayer.getEventDetails
                var dataRequests = [];
                //
                if (obj.showMatterEvents == '1') {

                    var matterFilters = angular.copy(filters);

                    matterFilters.start = matterFilters.s;
                    matterFilters.end = matterFilters.e;
                    delete matterFilters.s;
                    delete matterFilters.e;
                    delete matterFilters.from;
                    delete matterFilters.allEvent;

                    dataRequests.push(launcherCalendarDatalayer
                        .allEvent(matterFilters));
                }
                if (obj.showIntakeEvents == '1' && $rootScope.isIntakeActive == 1) {

                    dataRequests.push(intakeCalendarDatalayer.getEventDetails(filters));
                }
                $q.all(dataRequests).then(function (responses) {
                    /////////////
                    var values = angular.copy(responses);
                    var intakeEvents = [], matterEvents = [];
                    if (obj.showMatterEvents == '1') {
                        if (obj.showIntakeEvents == '1' && $rootScope.isIntakeActive == 1) {
                            intakeEvents = calendarHelper.intakeToMatterEventMapping(values[1]);
                            matterEvents = calendarHelper.matterToMatterEventMapping(values[0].data);
                        } else {
                            matterEvents = calendarHelper.matterToMatterEventMapping(values[0].data);
                        }

                    } else {
                        if (obj.showIntakeEvents == '1' && $rootScope.isIntakeActive == 1) {
                            intakeEvents = calendarHelper.intakeToMatterEventMapping(values[0]);
                        }
                    }

                    var value = matterEvents.concat(intakeEvents);
                    //////////////////////
                    if (selectedCat.length > 0) {
                        _.forEach(selectedCat, function (selectCategoryKey) {
                            selectCategory.push(selectCategoryKey.id);
                        });

                        _.forEach(selectCategory, function (selectCategoryKey) {
                            _.filter(value, function (valueKey) {
                                if (selectCategoryKey == valueKey.name) {
                                    datesObj.push(valueKey);
                                }
                            });
                        });
                    } else {
                        datesObj = value;
                    }

                    datesObj = getEventsForDateFilters(filters, datesObj);
                    datesObj = _.sortBy(datesObj, 'utcstart');

                    angular.forEach(datesObj, function (obj) {
                        if (obj.allday == '1') {
                            obj.utcstart = calendarHelper.getFullDayEventTimeForPrint(obj.utcstart, obj.utcend);
                        } else {
                            obj.utcstart = moment.unix(obj.utcstart).format('MM/DD/YYYY hh:mm A ');
                        }
                    });

                    var isMonthView = vm.selectedButton === 0;
                    var filterStorageName = $rootScope.onMatter ? "onMatterIntakeCalendarFilter" : $rootScope.onIntake ? "onIntakeIntakeCalendarFilter" : "onLauncherIntakeCalendarFilter";
                    var userList = JSON.parse(sessionStorage.getItem(filterStorageName));
                    if (utils.isNotEmptyVal(userList)) {
                        filters.assigned = userList;
                    }
                    var output = getCalendarData(datesObj, eventClick, selectCategory, filters, isMonthView, obj);
                    if (datesObj.length > 0) {
                        window.open().document.write(output);
                    }
                    else {
                        notificationService.error('No data available for printing!');
                    }
                }, function (a, b, c, d) {
                });
            }, 100);
        };

        function openCloseDate($event, currentstate) {
            $event.preventDefault();
            $event.stopPropagation();
            vm.openCloseDateSelector = true;
        }

        function goToSelectedDate(date) {
            vm.changeView('agendaDay', 'myCalendar1');
            if (utils.isEmptyVal(date)) {

            }
            else {
                var calDate = $("#calselecteddateDiv").val();
                if (moment(calDate, 'MM/DD/YYYY', true).isValid() || calDate == "") {
                    uiCalendarConfig.calendars['myCalendar1']
                        .fullCalendar('gotoDate', date);
                }
            }

        }

        function getEventsForDateFilters(filters, datesObj) {
            //get data for selected month only
            if (vm.selectedButton === 0) {
                datesObj = getSelectedMonthsData(filters, datesObj);
            }

            return datesObj;
        };

        function getSelectedMonthsData(filters, datesObj) {
            var start = moment.unix(filters.s);
            var end = moment.unix(filters.e);
            var range = moment.range(start, end);
            //get the center of the date range
            var center = range.center();
            //get the new start and end which will consist of only selected month
            var newStart = angular.copy(center).startOf('month');
            var newEnd = angular.copy(center).endOf('month');
            var newRange = moment.range(newStart, newEnd);

            filters.s = angular.copy(newStart).utc().valueOf();
            filters.s = moment(filters.s).unix();

            filters.e = angular.copy(newEnd).utc().valueOf();
            filters.e = moment(filters.e).unix();

            return _.filter(datesObj, function (date) {
                var dt = moment(moment.unix(date.utcstart).utc().format('MM/DD/YYYY'));
                //moment.unix(date.utcstart);
                return newRange.contains(dt);
            });
        };

        function getCalendarData(datesObj, eventClick, selectCategory, selectedFilters, isMonthView, obj) {
            var title = [{
                name: 'utcstart',
                desc: 'Date & Time'
            }, {
                name: 'matter_name',
                desc: 'Matter'
            }, {
                name: 'intake_name',
                desc: 'Intake'
            }, {
                name: 'name',
                desc: 'Event'
            }, {
                name: 'title',
                desc: 'Event Title'
            }, {
                name: 'description',
                desc: 'Event Description'
            }, {
                name: 'assignToUser',
                desc: 'Assigned To'
            }, {
                name: 'location',
                desc: 'Location'
            }];


            _.forEach(datesObj, function (event) {
                if (utils.isNotEmptyVal(event.assignedTo)) {
                    _.forEach(event.assignedTo, function (currentItem) {
                        currentItem.name = utils.isNotEmptyVal(currentItem.first_name) ? currentItem.first_name : utils.isNotEmptyVal(currentItem.fname) ? currentItem.fname : '';
                        currentItem.name += " ";
                        currentItem.name += utils.isNotEmptyVal(currentItem.last_name) ? currentItem.last_name : utils.isNotEmptyVal(currentItem.lname) ? currentItem.lname : '';
                    })
                    event.assignToUser = _.pluck(event.assignedTo, 'name').toString();
                } else {
                    event.assignToUser = '-';
                }
            });

            var selectedCategoryName = "";
            _.forEach(vm.selectedCategory, function (selectedCategoryKey) {
                selectedCategoryName += selectedCategoryKey + ", ";
            });
            selectedCategoryName = selectedCategoryName.replace(/,\s*$/, "");
            if (vm.categoryLength == vm.selectedCategory.length || vm.selectedCategory.length == 0) {
                selectedCategoryName = "All Categories";
            }
            var eventsFor = "";
            if (obj.showMatterEvents == '1') {

                if (obj.showIntakeEvents == '1' && $rootScope.isIntakeActive == 1) {
                    eventsFor = "Matter, Intake";
                } else {
                    eventsFor = "Matter";
                }
            } else {
                if (obj.showIntakeEvents == '1' && $rootScope.isIntakeActive == 1) {
                    eventsFor = "Intake";
                }
            }



            var Clkevents = [{ name: 'All Events', value: 1 }, { name: 'My Events', value: 0 }, { name: 'Personal Events', value: 2 }];
            var complied = [{ name: 'All', value: 0 }, { name: 'Hide Complied', value: 1 }];

            var html = "<html><head><title>Events</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style></head>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Events</h1><div></div>";
            html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><strong>Show events of: </strong>" + eventsFor + "</div>";
            html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><strong>Event: </strong>" + Clkevents[eventClick].name + "</div>";
            html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><strong>Category: </strong>" + selectedCategoryName + "</div>";
            html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><strong>Date Range: </strong>" + moment.unix(selectedFilters.s).format('MM/DD/YYYY') + ' - ' + moment.unix(selectedFilters.e).format('MM/DD/YYYY') + "</div>";
            html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><strong> </strong>" + complied[vm.filters.complied].name + "</div>";
            var assignedToUser = _.pluck(selectedFilters.assigned.selectedUsers, 'full_name').toString();
            var assignedTo = assignedToUser.split(',').join(', ');
            html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><strong>Assign to : </strong>" + assignedTo + "</div>";

            var location = (selectedFilters.location).toString();
            html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><strong>Location : </strong>" + utils.removeunwantedHTML(location) + "</div>";

            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<tr>";
            angular.forEach(title, function (val, key) {
                html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + val.desc + "</th>";
            });
            html += "</tr>";
            angular.forEach(datesObj, function (data) {
                html += "<tr>";
                angular.forEach(title, function (val) {
                    data[val.name] = (_.isNull(data[val.name]) || angular.isUndefined(data[val.name]) || utils.isEmptyString(data[val.name])) ? " - " : utils.removeunwantedHTML(data[val.name]);
                    if (val.name == 'assignToUser') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>";
                        //angular.forEach(data[val.name], function (assignUser) {
                        html += angular.isUndefined(data.assignToUser) ? '' : data.assignToUser;
                        html += '<br/>';
                        // });
                        "</td>";
                    }
                    else if (val.name == 'title') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>";
                        if (data.labelid == 19 || data.labelid == 100 || data.labelid == 32) {
                            html += angular.isUndefined(data.title) ? '' : utils.removeunwantedHTML(data.title);
                        } else {
                            html += '';
                        }

                        html += '<br/>';
                        "</td>";
                    }
                    else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(data[val.name]) + "</td>";
                    }
                });

                html += "</tr>";
            });
            html += "</body>";
            html += "</table>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</html>";
            return html;
        };
    }
})(angular);


(function (angular) {
    angular
        .module('intake.calendar')
        .factory('globalcalendarHelper', globalcalendarHelper);

    globalcalendarHelper.$inject = ['calendarEventHelper', 'masterData'];

    function globalcalendarHelper(calendarEventHelper, masterData) {

        return {
            setEvent: setEvent,
            setCalDateRange: setCalDateRange,
            modifyEventToEdit: modifyEventToEdit,
            modifyIntakeEventToEdit: modifyIntakeEventToEdit,
            getFullDayEventTimeForPrint: getFullDayEventTimeForPrint,
            intakeToMatterEventMapping: intakeToMatterEventMapping,
            matterToMatterEventMapping: matterToMatterEventMapping
        };

        function intakeToMatterEventMapping(intakeEvents) {
            var matterEvents = [];
            _.forEach(intakeEvents, function (intakeEvent) {
                var matterEvent = {
                    id: intakeEvent.intake_event_id,
                    allday: intakeEvent.all_day,
                    title: intakeEvent.event_title,
                    isComply: intakeEvent.is_comply,
                    isdeleted: intakeEvent.is_deleted,
                    ispersonalevent: intakeEvent.is_personal_event,
                    start: intakeEvent.start_date,
                    utcstart: intakeEvent.start_date,
                    end: intakeEvent.end_date,
                    utcend: intakeEvent.end_date,
                    isIntake: true,
                    ismatter: false,
                    is_critical: 0,
                    labelid: intakeEvent.label_id > 0 ? intakeEvent.label_id : null,
                    assignedTo: intakeEvent.assign_to,
                    name: mapIntakeEventType(intakeEvent),
                    intake_name: intakeEvent.intake_name,
                    intake_id: intakeEvent.intake_id,
                    matter_id: intakeEvent.intake_id,
                    is_task_created: intakeEvent.is_task_created,
                };
                intakeEvent.assignedTo = intakeEvent.assign_to;
                angular.extend(intakeEvent, matterEvent);
                matterEvents.push(intakeEvent);
            });

            return matterEvents;
        }

        function mapIntakeEventType(intakeEvent) {
            if (intakeEvent.label_id == 100) {
                return 'Other';
            }
            if (intakeEvent.label_id == 19) {
                return 'Personal Event';
            }
            if (intakeEvent.label_id == 32) {
                return 'Deadline';
            }
            return intakeEvent.event_title;
        };


        function matterToMatterEventMapping(matterEvents) {
            var newMatterEventArr = [];
            _.forEach(matterEvents, function (matterEvent) {
                var newMatterEvent = {
                    id: matterEvent.event_id,
                    allday: matterEvent.all_day,
                    title: matterEvent.title,
                    isComply: matterEvent.is_comply,
                    isdeleted: matterEvent.is_deleted,
                    ispersonalevent: matterEvent.is_personalevent,
                    start: matterEvent.start,
                    utcstart: matterEvent.start,
                    end: matterEvent.end,
                    utcend: matterEvent.end,
                    isIntake: false,
                    ismatter: true,
                    is_critical: matterEvent.is_critical,
                    labelid: matterEvent.label_id > 0 ? matterEvent.label_id : null,
                    assignedTo: matterEvent.assigned_to,
                    name: matterEvent.event_name,
                    matter_name: (matterEvent.matter && matterEvent.matter.matter_name) ? matterEvent.matter.matter_name : "",
                    matter_id: (matterEvent.matter && matterEvent.matter.matter_id) ? matterEvent.matter.matter_id : "",
                    location: matterEvent.location,
                    description: matterEvent.description,
                    is_task_created: matterEvent.is_task_created,
                    custom_reminder: matterEvent.custom_reminder ? parseInt(matterEvent.custom_reminder) : '',
                    sms_custom_reminder: matterEvent.sms_custom_reminder ? parseInt(matterEvent.sms_custom_reminder) : '',
                    private: matterEvent.private,
                    reminder_days: matterEvent.reminder_days,
                    sms_reminder_days: matterEvent.sms_reminder_days,
                    reminder_users_id: matterEvent.reminder_users_id,
                    reminder_users: matterEvent.reminder_users,
                    sms_contact_ids: matterEvent.sms_contact_ids,
                    user_defined: matterEvent.user_defined,
                    assigned_taskid: matterEvent.task ? matterEvent.task.task_id : matterEvent.assigned_taskid,
                    reason: matterEvent.reason,
                    comments: matterEvent.comments,
                    matterdatetypeid: matterEvent.matterdatetypeid,
                    is_critical: matterEvent.is_critical,
                    is_deadline: matterEvent.is_deadline,
                };
                matterEvent.assignedTo = matterEvent.assigned_to;
                matterEvent.name = matterEvent.event_name;
                angular.extend(matterEvent, newMatterEvent);
                newMatterEventArr.push(newMatterEvent);
            });

            return newMatterEventArr;
        }

        function setEvent(event, role) {
            event.allDay = event.allday == '1';
            _setStartEndDate(event);
            _setEventTitle(event);
            _setBackgroundColor(event, role);
        }

        function _setStartEndDate(event) {
            var start, end;

            // && calendarEventHelper.isValidDateRange(event.utcstart, event.utcend)
            if (event.allday == '1') {
                var nextDay = moment.unix(event.utcend).add(1, "days").unix();
                start = setFullDayTime(event.utcstart, 'start');
                end = setFullDayTime(nextDay, 'end');
            } else {
                start = moment.unix(event.utcstart);
                end = moment.unix(event.utcend);
            }

            start = new Date(start.toDate());
            end = new Date(end.toDate());

            event.start = start;
            event.end = end;
        }

        function setFullDayTime(timestamp, setTimeFor) {
            var format = 'ddd MMM DD YYYY HH:mm:ss';

            var date = moment.unix(timestamp);
            date = date.utc().format(format);
            date = moment(date, format);

            var isCorrectFullDayTime;
            var time = utils.prependZero(date.hour()) + ':'
                + utils.prependZero(date.minute()) + ':'
                + utils.prependZero(date.second());

            switch (setTimeFor) {
                case 'start':
                    isCorrectFullDayTime = time === '00:00:00';
                    break;
                case 'end':
                    isCorrectFullDayTime = time === '23:59:59';
                    break;
            }

            return isCorrectFullDayTime ? date : moment.unix(timestamp);
        }

        function _setBackgroundColor(event, role) {
            if (!event.labelid) {
                event.backgroundColor = "#ff0000 !important";
                event.editable = true;
            } else {
                var labelId = event.labelid.toString();

                switch (labelId) {
                    case '1':
                        event.backgroundColor = "#ff0000 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '2':
                        event.backgroundColor = "#67f80d !important";
                        event.textColor = "#000000 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '3':
                        event.backgroundColor = "#b96f06 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '4':
                        event.backgroundColor = "#53a322 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '5':
                        event.backgroundColor = "#998c41 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '6':
                        event.backgroundColor = "#f89406 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '7':
                    case '33':
                        event.backgroundColor = "#f15a5a !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '8':
                        event.backgroundColor = "#375624 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '9':
                        event.backgroundColor = "#319575 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '10':
                        event.backgroundColor = "#199d73 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '11':
                        event.backgroundColor = "#018c50 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '12':
                    case '26':
                        event.backgroundColor = "#6994d4 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '13':
                        event.backgroundColor = "#2442b0 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '14':
                        event.backgroundColor = "#831bcc !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '15':
                        event.backgroundColor = "#fee188 !important";
                        event.textColor = "#000000 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '16':
                        event.backgroundColor = "#c90cac !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '17':
                        event.backgroundColor = "#9f1c72 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '18':
                        event.backgroundColor = "#34710d !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '19':
                        event.backgroundColor = "#3b4c41 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '22':
                        event.backgroundColor = "#56A96B !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '23':
                        event.backgroundColor = "#4C925E !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '21':
                        event.backgroundColor = "#8480D7 !important";
                        event.editable = role !== 'Staff';
                        break;
                    case '100':
                        event.backgroundColor = "#9585bf !important";
                        break;
                }
            }

        }
        //set event on calendar
        function _setEventTitle(event) {
            var eventType = _.filter(masterData.getMasterData().event_types, function (item) {
                if (item.labelId == event.labelid) {
                    return item.name;
                }
            });
            // if event has matter name defined
            if (angular.isDefined(event.matter_name) || angular.isDefined(event.intake_name)) {
                var mattName = event.isIntake ? event.intake_name : event.matter_name;

                // if event is Other then title will be mix of matter name plus event title
                if (event.name == 'Other' || event.name == 'Personal Event' || event.name == 'Deadline') {
                    if (mattName && event.originalTitle) {
                        event.title = mattName + " - " + event.originalTitle;
                    } else {
                        if (utils.isNotEmptyVal(mattName)) {
                            event.title = mattName + " " + eventType[0].Name;
                        } else {
                            event.title = event.originalTitle;
                        }
                        
                    }
                }
                // if event is other than Other
                else {
                    var eventTitle = utils.isEmptyVal(event.originalTitle) ? eventType[0].Name : event.originalTitle; //US#7635: onmousehover display personal event title
                    if (mattName && event.originalTitle) {
                        event.title = mattName + " - " + eventTitle;
                    } else {
                        event.title = utils.isNotEmptyVal(mattName) ? mattName + " " + eventTitle : eventTitle;
                    }
                }
            }
            else if (angular.isDefined(event.mattername) || angular.isDefined(event.intake_name)) {
                var mattName = event.isIntake ? event.intake_name : event.mattername;

                if (event.name == 'Other' || event.name == 'Personal Event' || event.name == 'Deadline') {
                    event.title = "";//Bug#6048
                    event.title = mattName + "  " + event.title;
                }
                else {
                    if (mattName && event.name) {
                        event.title = mattName + " - " + eventType[0].Name;
                    } else {
                        event.title = mattName + " " + eventType[0].Name;
                    }
                }
            }

        }

        function getFullDayEventTimeForPrint(start, end) {
            var date;
            if (calendarEventHelper.isValidDateRange(start, end)) {
                date = setFullDayTime(start, 'start');
            } else {
                date = moment.unix(start);
            }

            return date.format('MM/DD/YYYY hh:mm A');
        }

        function setCalDateRange(view) {
            //ui calendar's view.start and view.end dates are utc's start and end dates
            //start date is utc's 12 am and end date is utc's 11:59:59
            //and convert it to local time

            var format = 'ddd MMM DD YYYY HH:mm:ss';

            var startdate = angular.copy(view.start);
            startdate = startdate.utc().format(format);
            startdate = moment(startdate, format);

            //get the delta between start date and end date given by the ui-calendar plugin
            var diff = moment.duration(view.end.diff(view.start));
            diff = diff.asSeconds();
            //subtract 1 sec to avoid date change
            diff = diff - 1;

            var start = angular.copy(startdate);
            var startToCompute = angular.copy(startdate);

            //add delta to start date to get end date
            var end = startToCompute.add(diff, 's');

            //convert to unix timestamp
            startdate = new Date(start.toDate());
            startdate = startdate.getTime();
            startdate = moment(startdate).unix();

            var enddate = new Date(end.toDate());
            enddate = enddate.getTime();
            enddate = moment(enddate).unix();

            return {
                startdate: startdate,
                enddate: enddate
            };
        }

        function modifyIntakeEventToEdit(event, delta, isResized) {
            var reminder;
            if (event.reminder_users != 'intake' && event.reminder_users != 'all') {
                reminder = JSON.parse(event.reminder_users);
                event.reminder_users = reminder.toString();
                event.reminder_users_id = 3;
            } else {
                reminder = event.reminder_users;
            }
            if (event.reminder_users == 'intake') {
                event.reminder_users_id = 1;
            }
            if (event.reminder_users == 'all') {
                event.reminder_users_id = 2;
            }
            var sms;
            if (event.sms_contact_ids) {
                sms = JSON.parse(event.sms_contact_ids);
                event.sms_contact_ids = sms.toString();
            }
            var start, end;
            var startTimeNew = moment(event.start).format("HH:mm");
            start = _getStartDate(moment(event.start.format("MM-DD-YYYY")), startTimeNew, event.all_day);

            if (event.end) {
                var endDate = moment(event.end.format("MM-DD-YYYY"));
                var endTimeNew = moment(event.end).format("HH:mm");
                if (event.all_day == 1) {
                    endDate = moment(event.end.add(-1, 'd').format("MM-DD-YYYY"));
                }
                end = _getEndDate(endDate, endTimeNew, event.all_day);

            } else {
                if (event.all_day == 1) {
                    end = _getEndDate(moment(event.start.format("MM-DD-YYYY")), null, event.all_day);
                } else {
                    end = moment.unix(start).add(1, 'h').unix();
                }
            }

            var newEvent = {};
            newEvent.all_day = event.all_day;
            newEvent.deleted_by = event.deleted_by;
            newEvent.deleted_date = event.deleted_date;
            newEvent.description = event.description;
            newEvent.intake_event_id = event.intake_event_id;
            newEvent.is_deleted = event.is_deleted;
            newEvent.is_personal_event = event.is_personal_event;
            newEvent.labelid = event.labelid;
            newEvent.label_id = event.label_id;
            newEvent.modified_date = event.modified_date;
            newEvent.location = event.location;
            newEvent.intake_name = event.intake_name;
            newEvent.matterdatetypeid = event.matterdatetypeid;
            newEvent.intake_id = event.intake_id;
            newEvent.name = event.name;
            newEvent.event_title = event.originalTitle;
            newEvent.practiceid = event.practiceid;
            newEvent.is_task_created = event.is_task_created,
                newEvent.reminder_days = (event.reminder_days) ? event.reminder_days : "",
                newEvent.sms_reminder_days = (event.sms_reminder_days) ? event.sms_reminder_days : "";
            newEvent.reminder_users_id = event.reminder_users_id;
            newEvent.reminder_users = event.reminder_users;
            newEvent.sms_contact_ids = event.sms_contact_ids;
            if (event.allDay || event.all_day == 1) {
                newEvent.all_day = 1;
            }
            if (end < parseInt(event.custom_reminder)) {
                event.custom_reminder = "";
            }
            if (end < parseInt(event.sms_custom_reminder)) {
                event.sms_custom_reminder = "";
            }
            newEvent.custom_reminder = event.custom_reminder;
            newEvent.sms_custom_reminder = event.sms_custom_reminder;
            newEvent.start_date = start;
            newEvent.end_date = end;
            newEvent.remindMe = false;
            newEvent.reminder_datetime = 0;
            newEvent.openStartDatepicker = false;
            newEvent.remind_date = 0;

            newEvent.reminderdays = event.reminderdays;
            newEvent.remind_users = event.remind_users;
            newEvent.userdefined = event.userdefined;


            newEvent.assigned_to = _.pluck(event.assign_to, 'userId');
            newEvent.is_comply = 0,
                newEvent.assigned_taskid = event.assigned_taskid && event.assigned_taskid > 0 ? event.assigned_taskid : null;

            return newEvent;
        }

        function _getStartDate(date, offset, allDay) {
            var start;

            start = moment(date, [moment.ISO_8601, 'YYYY-MM-DD', 'YYYY/MM/DD', 'MM-DD-YYYY', 'MM/DD/YYYY']);

            if (allDay == '1') {
                start = start.startOf('day');
                start = start.toDate();
                start = new Date(start);
                start = subtractUTCOffset(start);
                start = moment(start.getTime()).unix();

            } else {
                var startTimeOffset = {
                    h: parseInt(offset.substring(0, 2)),
                    m: parseInt(offset.substring(3))
                };

                start.startOf('day').add(startTimeOffset);
                start = start.utc();

                start = start.toDate();
                start = new Date(start);
                start = moment(start.getTime()).unix();
            }

            return start;
        }

        function _getEndDate(date, offset, allDay) {
            var end;

            end = moment(date, [moment.ISO_8601, 'YYYY-MM-DD', 'YYYY/MM/DD', 'MM-DD-YYYY', 'MM/DD/YYYY']);

            if (allDay == '1') {
                end = end.endOf('day');
                end = new Date(end.toDate());
                end = subtractUTCOffset(end);
                end = moment(end.getTime()).unix();
            } else {
                var endTimeOffset = {
                    h: parseInt(offset.substring(0, 2)),
                    m: parseInt(offset.substring(3))
                };
                end.startOf('day').add(endTimeOffset);
                end = end.utc();
                end = new Date(end.toDate());
                end = moment(end.getTime()).unix();
            }

            return end;
        }

        function subtractUTCOffset(_date) {
            var _userOffset = _date.getTimezoneOffset() * 60 * 1000; // user's offset time
            _date = new Date(_date.getTime() - _userOffset); // redefine variable
            return _date;
        }

        function modifyEventToEdit(event, delta, isResized) {
            var start, end;
            var startTimeNew = moment(event.start).format("HH:mm");
            start = _getStartDate(moment(event.start.format("MM-DD-YYYY")), startTimeNew, event.all_day);

            if (event.end) {
                var endDate = moment(event.end.format("MM-DD-YYYY"));
                var endTimeNew = moment(event.end).format("HH:mm");
                if (event.all_day == 1) {
                    endDate = moment(event.end.add(-1, 'd').format("MM-DD-YYYY"));
                }
                end = _getEndDate(endDate, endTimeNew, event.all_day);

            } else {
                if (event.all_day == 1) {
                    end = _getEndDate(moment(event.start.format("MM-DD-YYYY")), null, event.all_day);
                } else {
                    end = moment.unix(start).add(1, 'h').unix();
                }
            }

            var newEvent = {};
            newEvent.allDay = event.allDay;
            newEvent.deletedby = event.deletedby;
            newEvent.deleteddate = event.deleteddate;
            newEvent.description = event.description;
            newEvent.id = event.id;
            newEvent.isdeleted = event.isdeleted;
            newEvent.ispersonalevent = event.ispersonalevent;
            newEvent.labelid = event.labelid;
            newEvent.lastmodified = event.lastmodified;
            newEvent.location = event.location;
            newEvent.matter_name = event.matter_name;
            newEvent.matterdatetypeid = event.matterdatetypeid;
            newEvent.matterid = event.matterid;
            newEvent.name = event.name;
            newEvent.title = event.originalTitle;
            newEvent.practiceid = event.practiceid;
            newEvent.remind_users = event.remind_users;
            // newEvent.is_cp_share = event.is_cp_share;
            newEvent.share_with = _.pluck(event.shared_with, 'plaintiffid');

            if (event.allDay || event.allday == 1) {
                newEvent.allday = 1;
            }

            newEvent.start = start;
            newEvent.end = end;
            newEvent.remindMe = false;
            newEvent.reminder_datetime = 0;
            newEvent.openStartDatepicker = false;
            newEvent.remind_date = 0;
            newEvent.reminderdays = event.reminderdays;
            newEvent.userdefined = event.userdefined;


            newEvent.assigned_to = event.assignedTo;
            newEvent.istaskcreated = event.istaskcreated;
            newEvent.isComply = event.isComply;
            newEvent.assigned_taskid = event.istaskcreated == 1 ? event.assignedTo[0].taskid : null;

            return newEvent;
        }

        function getUTCTimestamp(date) {
            date = date.utc();
            date = date.toDate();
            date = new Date(date);
            date = moment(date.getTime()).unix();
            return date;
        }
    }
})(angular);
(function () {
    angular
        .module('intake.calendar')
        .controller('EventDetailsCtrl', EventDetailsCtrl);

    EventDetailsCtrl.$inject = ['$modalInstance', 'data', 'masterData', 'userList', 'IntakeCalendarEventHelper', 'intakeEventsDataService', 'eventsDataService', 'notification-service', 'calendarEventHelper', 'globalConstants', 'access'];
    function EventDetailsCtrl($modalInstance, data, masterData, userList, IntakeCalendarEventHelper, intakeEventsDataService, eventsDataService, notificationService, calendarEventHelper, globalConstants, access) {
        var vm = this;
        vm.assign_to = '';
        vm.singleEventDetail = angular.copy(data);
        vm.cancelAssignTo = cancelAssignTo;
        vm.saveAssignTo = saveAssignTo;
        vm.viewDetails = viewDetails;
        vm.cancel = cancel;
        vm.showAssignedToEdit = false;
        vm.assignedToUserList = userList;
        vm.criticalDatesPermission = access.criticalDate;
        vm.eventsPermissions = access.permission;
        vm.setUserList = setUserList;
        vm.refreshGrid = false;
        vm.eventName = '';
        vm.category = angular.copy(masterData.getEventTypes());
        _.forEach(vm.category, function (item) {
            item.label_id = item.LabelId;
        });
        if (vm.singleEventDetail.labelid == 19 || vm.singleEventDetail.labelid == 100 || vm.singleEventDetail.labelid == 32) {
            vm.eventName = vm.singleEventDetail.originalTitle;
        } else {
            vm.eventName = vm.singleEventDetail.name;
        }
        vm.isIntake = data.intake_event_id ? true : false;
        if (data.assignedTo.length > 0) {
            _.forEach(data.assignedTo, function (it) {
                it.user_id = it.userId ? it.userId : it.user_id;
            })
            var array = []
            _.forEach(data.assignedTo, function (item) {
                _.forEach(vm.assignedToUserList, function (currentItem) {
                    if (item.user_id == currentItem.user_id) {
                        array.push(currentItem);
                    }
                })
            });
            vm.assign_to = _.pluck(array, 'full_name').join(', ');
            vm.singleEventDetail.assignedTo = array;
            var list = _.difference(vm.assignedToUserList, array);
            vm.assignedToUserList = _.uniq(angular.copy(list), 'user_id');
        } else {
            vm.assign_to = '';
            vm.assignedToUserList = userList;
        }

        function setUserList(list) {
            var copyList = angular.copy(vm.assignedToUserList);
            copyList.push(list);
            vm.assignedToUserList = _.uniq(angular.copy(copyList), 'user_id');
        }


        function cancel() {
            if (vm.refreshGrid) {
                vm.refreshGrid = false;
                $modalInstance.close(vm.singleEventDetail.assignedTo);
            } else {
                $modalInstance.dismiss();
            }
        }

        function viewDetails() {
            $modalInstance.close("showDetails");
        }

        function cancelAssignTo() {
            vm.showAssignedToEdit = false;
            vm.singleEventDetail.assignedTo = angular.copy(array);
        }
        var matterId;
        function saveAssignTo(event) {
            vm.refreshGrid = true;
            if (!event.intake_event_id) {
                if (vm.criticalDatesPermission[0].E == 0 && (event.labelid == 1 || event.labelid == 6 || event.labelid == 15)) {
                    notificationService.error(globalConstants.accessMgmtMessage + "edit critical events")
                    return;
                }
                if (vm.eventsPermissions[0].E == 0 && (event.labelid != '1' && event.labelid != 6 && event.labelid != 15)) {
                    notificationService.error(globalConstants.accessMgmtMessage + "edit events")
                    return;
                }
            }
            vm.showAssignedToEdit = false;
            var newEvent = angular.copy(event);
            vm.assign_to = _.pluck(vm.singleEventDetail.assignedTo, 'full_name').join(', ');
            //US#3119- Check For existing events ... Start
            if (newEvent.reminder_days != null) {
                newEvent.reminder_days = angular.isDefined(newEvent.reminder_days) ? newEvent.reminder_days.toString() : '';
            }
            else {
                newEvent.reminder_days = '';
            }

            if (newEvent.sms_reminder_days != null) {
                newEvent.sms_reminder_days = angular.isDefined(newEvent.sms_reminder_days) ? newEvent.sms_reminder_days.toString() : '';
            }
            else {
                newEvent.sms_reminder_days = '';
            }
            if (data.intake_event_id) {
                newEvent.is_task_created = (!utils.isEmptyObj(newEvent) && utils.isNotEmptyVal(newEvent.intake_id) && newEvent.assign_to && newEvent.assign_to.length > 0) ? parseInt(newEvent.is_task_created) : 0;
                newEvent.intake_id = utils.isNotEmptyVal(newEvent.intake_id) ? newEvent.intake_id : '0';
                IntakeCalendarEventHelper.setEventTitle(newEvent, vm.category);
                newEvent.comments = "";
                newEvent.intake_event_id = newEvent.intake_event_id;
                editEvents(newEvent);
            } else {
                newEvent.is_task_created = (!utils.isEmptyObj(newEvent) && utils.isNotEmptyVal(newEvent.matter_id) && newEvent.assignedTo && newEvent.assignedTo.length > 0) ? parseInt(newEvent.is_task_created) : 0;
                matterId = utils.isNotEmptyVal(event) ? event.matter_id : '';
                newEvent.matterid = utils.isNotEmptyVal(matterId) ? matterId : '0';
                newEvent.label_id = newEvent.labelid;
                newEvent.title = newEvent.originalTitle;
                calendarEventHelper.setEventTitle(newEvent, vm.category);
                editEventsOfMatter(newEvent);
            }

        }

        function editEventsOfMatter(event) {
            if (!(event.reminder_users == "matter" || event.reminder_users == "all")) {
                event.reminder_users_id = 3;
                event.reminder_users = JSON.parse(event.reminder_users).toString();
            }
            event.sms_contact_ids = event.sms_contact_ids ? JSON.parse(event.sms_contact_ids).toString() : '';
            var newEvent = {
                all_day: (event.allday) ? event.allday : 0,
                custom_reminder: event.custom_reminder,
                sms_custom_reminder: event.sms_custom_reminder,
                description: (event.description) ? event.description : "",
                is_comply: (event.isComply) ? event.isComply : 0,
                is_task_created: event.is_task_created,
                label_id: parseInt(event.label_id),
                location: event.location ? event.location : '',
                matter: {
                    matter_id: parseInt(matterId)
                },
                private: event.private,
                reminder_days: event.reminder_days,
                sms_reminder_days: event.sms_reminder_days,
                reminder_users_id: event.reminder_users_id,
                reminder_users: event.reminder_users,
                sms_contact_ids: event.sms_contact_ids,
                title: event.title,
                user_defined: event.user_defined,
                end: event.utcend,
                start: event.utcstart,
                is_personalevent: (event.label_id == 19) ? 1 : 0,
                user_ids: utils.isEmptyVal(vm.singleEventDetail.assignedTo) ? [] : _.pluck(vm.singleEventDetail.assignedTo, 'user_id'),
            };
            newEvent.matterdatetypeid = event.matterdatetypeid;
            newEvent.event_name = event.name;
            newEvent.task = { "task_id": (event.assigned_taskid) ? event.assigned_taskid : "" };
            newEvent.event_id = event.id;
            newEvent.reason = event.reason ? event.reason : "1";
            newEvent.comments = event.comments ? event.comments : '';
            newEvent.share_with = [];
            eventsDataService.updateEvent_OFF_DRUPAL(event.id, newEvent)
                .then(function (data) {
                    if (data.status == 406) {
                        notificationService.error('At present none of the plaintiffs have Client Portal enabled. Event will be shared only when you enable if for plaintiff(s)');
                    }
                    else if (data.status == 403) {
                        notificationService.error('At present Client Portal is not enabled. Event will be shared only when Client Portal is Enabled');
                    } else {
                        notificationService.success('Event updated succesfully!');
                    }

                }, function () {
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function editEvents(event) {
            if (!(event.reminder_users == "intake" || event.reminder_users == "all")) {
                event.reminder_users_id = 3;
                event.reminder_users = JSON.parse(event.reminder_users).toString();
            }
            event.sms_contact_ids = event.sms_contact_ids ? JSON.parse(event.sms_contact_ids).toString() : '';
            event.start_date = angular.copy(event.utcstart);
            event.end_date = angular.copy(event.utcend);
            event.label_id = parseInt(event.label_id);
            if (event.label_id == 100 || event.label_id == 19 || event.label_id == 32) {
                event.event_title = (event.event_title) ? event.event_title : "";
            } else {
                event.event_title = "";
            }
            var eventData = angular.copy(event);
            var RecordData = {
                label_id: eventData.label_id,
                custom_reminder: event.custom_reminder,
                sms_custom_reminder: event.sms_custom_reminder,
                event_title: eventData.event_title,
                intake_event_id: eventData.intake_event_id,
                all_day: eventData.all_day,
                start_date: eventData.start_date,
                end_date: eventData.end_date,
                is_private: eventData.is_private,
                location: eventData.location,
                description: eventData.description,
                intake_id: eventData.intake_id,
                comments: eventData.comments,
                is_comply: eventData.is_comply,
                assigned_to: utils.isEmptyVal(vm.singleEventDetail.assignedTo) ? [] : _.pluck(vm.singleEventDetail.assignedTo, "user_id"),
                assigned_taskid: eventData.assigned_taskid,
                reason: eventData.reason,
                reminder_days: (event.reminder_days) ? (event.reminder_days).toString() : "",
                sms_reminder_days: (event.sms_reminder_days) ? (event.sms_reminder_days).toString() : "",
                reminder_users_id: event.reminder_users_id,
                reminder_users: event.reminder_users,
                sms_contact_ids: event.sms_contact_ids,
                is_task_created: event.is_task_created,
            }
            intakeEventsDataService.updateEvent(RecordData.intake_event_id, RecordData)
                .then(function (data) {
                    if (data.status == 400) {
                        notificationService.error('Event has not been updated!');
                    } else {
                        notificationService.success('Event updated successfully!');
                    }
                }, function () {
                    notificationService.error('An error occurred. Please try later.');
                });
        }
    }
})(angular);
