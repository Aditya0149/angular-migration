(function () {
    'use strict';
    angular
        .module('cloudlex.schedule')
        .controller('ScheduleCtrl', ScheduleController);

    ScheduleController.$inject = ['$scope', 'scheduleDataLayer', 'scheduleHelper', 'resetCallbackHelper'];

    function ScheduleController($scope, scheduleDataLayer, scheduleHelper, resetCallbackHelper) {

        var vm = this;
        //vm.eventDetails = {};
        var localDatePickerDate = vm.datePickerDate;
        vm.removeAssignUser = removeAssignUser;

        vm.init = function () {
            vm.displayDefaultDate = '';
            vm.calendarDate = '';
            vm.myEventList = [];
            vm.allEventList = [];
            vm.displayEventList = [];
            vm.eventDetailsFlag = false;
            vm.eventDataClickFlag = false;
            vm.eventClickData = [];
            vm.dateFlag = false;
            vm.assingedToUserID = [];
            vm.assignedToUserName = [];
            vm.isSaveAssignUser = false;
            vm.datePickerDate = '';
            vm.getFormattedDateString = getFormattedDateString;
            vm.open = openCalender;
            vm.datePickerEvent = {};
            vm.scheduleEventData = {};
            vm.assignDate = '';
            vm.resetPage = resetPage;
            vm.scheduleEventFilter = {
                taskid: ''
            }
            vm.filters = {
                s: '',
                e: '',
                from: 'sch'
            };
            vm.filters.allEvent = 0;

            vm.dateFormat = 'MMM DD, YYYY';
            vm.datepickerOptions = {
                formatYear: 'yyyy',
                startingDay: 0,
                'show-weeks': false
            };

            displayDate(null);
            //getEventDetails();

            vm.selectedShowEventFrom = { LabelId: '0', Name: 'My Matter' };
            vm.showEventFrom = [{ LabelId: '0', Name: 'My Matter' }, { LabelId: '1', Name: 'All Matter' }];

        };

        vm.init();
        vm.createTaskDisabled = true;

        function resetPage() {
            vm.init();
        }

        function displayDate(localDatePickerDate) {
            var tomorrowStartOfDay, tomorrowEndOfDay;
            if (localDatePickerDate == '' || localDatePickerDate == null) {
                tomorrowStartOfDay = moment().startOf('day');
                tomorrowEndOfDay = moment().endOf('day');

                tomorrowStartOfDay = moment(tomorrowStartOfDay).unix();
                tomorrowEndOfDay = moment(tomorrowEndOfDay).unix();

                //since there is no data for tomorrow so passing blank s and e only
                vm.filters.s = tomorrowStartOfDay;
                vm.filters.e = tomorrowEndOfDay;

                // Updated the code to set the Assigned Date to current timestamp
                // vm.assignDate = moment.unix(tomorrowStartOfDay).format("MM/DD/YYYY");
                vm.assignDate = moment(new Date().getTime()).unix();
                vm.displayDefaultDate = moment.unix(tomorrowStartOfDay).format("MMM DD, YYYY");
                vm.datePickerDate = vm.displayDefaultDate;
                localDatePickerDate = vm.datePickerDate;
            } else {

                if (angular.isDefined(vm.datePickerDate) && angular.isDefined(vm.datePickerDate.length) && vm.datePickerDate.length == 12) {
                    vm.displayDefaultDate = vm.datePickerDate;
                } else {
                    vm.displayDefaultDate = vm.datePickerDate;
                    vm.calendarDate = vm.datePickerDate;
                    //vm.dateFlag = true;
                    var year, month, day;
                    year = vm.displayDefaultDate.getFullYear();
                    month = vm.displayDefaultDate.getMonth();
                    day = vm.displayDefaultDate.getDate();

                    var date = year + "/" + (month + 1) + "/" + day;

                    var momDate = moment(date, "YYYY/MM/DD");

                    var start, end;
                    start = angular.copy(momDate);
                    end = angular.copy(momDate);

                    start = start.startOf('day');
                    end = end.endOf('day');

                    tomorrowStartOfDay = moment(start).unix();
                    tomorrowEndOfDay = moment(end).unix();

                    //since there is no data for tomorrow so passing blank s and e only
                    vm.filters.s = tomorrowStartOfDay;
                    vm.filters.e = tomorrowEndOfDay;
                    // Updated the code to set the Assigned Date to current timestamp
                    // vm.assignDate = moment.unix(tomorrowStartOfDay).format("MM/DD/YYYY");
                    vm.assignDate = moment(new Date().getTime()).unix();
                    vm.displayDefaultDate = moment.unix(tomorrowStartOfDay).format("MMM DD, YYYY");
                    vm.datePickerDate = vm.displayDefaultDate;
                    localDatePickerDate = vm.datePickerDate;
                }
            }
            getEventDetails();
        }

        //US#8100 set user name while getting event details
        function setAssignUserName(displayEventList) {
            vm.userfullname = [];
            vm.assignToFullname = [];
            _.forEach(displayEventList, function (data) {
                if (data.assignedTo.length > 0) {
                    _.forEach(data.assignedTo, function (item) {
                        item.fname = utils.isEmptyVal(item.fname) ? '' : item.fname;
                        item.lname = utils.isEmptyVal(item.lname) ? '' : item.lname;
                        vm.userfullname.push(item.fname + ' ' + item.lname);
                    })
                    vm.fullname = [];
                    vm.fullname = vm.userfullname.toString();
                    vm.userfullname = []
                    vm.fullname = vm.fullname.split(',').join(', ');
                }
                data.fullname = vm.fullname;
            })
        }

        //US#8100 func to cancel assign eventto user
        function removeAssignUser(data) {
            if (utils.isNotEmptyVal(data)) {
                vm.assignedToUserName = _.pluck(data, 'name').toString();
            } else {
                vm.isSaveAssignUser = false;
            }
            enableDisableTaskFlag();
        }

        //set datepicker options
        function getEventDetails() {
            var filterObj = scheduleHelper.getFiltersObj(vm.filters);
            var promise = scheduleDataLayer.getEventDetails(filterObj);
            promise.then(function (data) {
                var result = [];
                vm.myEventList = [];
                vm.allEventList = [];
                vm.displayEventList = [];

                _.forEach(data, function (item) {
                    item.assignedTo = utils.isEmptyVal(item.assignedTo) ?
                        [{ "uid": '', "fname": "Unassigned", "lname": "" }] : item.assignedTo; //US#8100

                    //if (item.allday == '1') {
                    //    var start = moment.unix(vm.filters.s);
                    //    var end = moment.unix(vm.filters.e);
                    //    var range = moment.range(start, end);
                    //    var dt = moment.unix(item.utcstart);
                    //    //if (range.contains(dt)) {
                    //    //    result.push(item);
                    //    //}
                    //    result.push(item);
                    //} else {
                    //    result.push(item);
                    //}
                    result.push(item);

                });


                if (vm.filters.allEvent == 0) {
                    vm.myEventList = result;
                    vm.displayEventList = result;
                    setAssignUserName(vm.displayEventList);
                    vm.eventDetailsFlag = true;
                } else if (vm.filters.allEvent == 1) {
                    vm.allEventList = result;
                    vm.displayEventList = result;
                    setAssignUserName(vm.displayEventList);
                    vm.eventDetailsFlag = true;
                }

            });
        }

        function scheduleEventDataForAPI(userId) {
            var event = vm.eventClickData[0];
            vm.scheduleEventData.taskname = event.title;
            vm.scheduleEventData.userid = userId;
            vm.scheduleEventData.notes = null;
            vm.scheduleEventData.location = event.location;
            vm.scheduleEventData.description = event.description;
            vm.scheduleEventData.duedate = setDueDate(event.utcstart, event.allday);
            vm.scheduleEventData.priority = "Normal";
            vm.scheduleEventData.status = "Not Started";
            vm.scheduleEventData.percentagecomplete = 0,
                vm.scheduleEventData.matterid = event.matterid;
            vm.scheduleEventData.isother = true;
            vm.scheduleEventData.deleted = 0;
            vm.scheduleEventData.tasksubcategoryid = 0
            vm.scheduleEventData.assignmentdate = vm.assignDate;
            vm.scheduleEventData.eventid = event.id;
            vm.scheduleEventData.istaskcreated = vm.istaskcreated;

        }

        function setDueDate(timestamp, allday) {
            // IF event is full day then return the timestamp without change.
            if ((allday == "1")) {
                return timestamp;
            }
            // If event is not full day then strip the time part and then generate the unix timestamp.
            var date = moment.utc(timestamp, 'X').format('YYYY-MM-DD');
            return moment.utc(date).unix();
        }

        function createScheduleEvent(userId) {
            scheduleEventDataForAPI(userId);
            var promise = scheduleDataLayer.createScheduleEvent(vm.scheduleEventData);
            promise.then(function (data) {
                vm.isSaveAssignUser = false;
                vm.eventDataClickFlag = false;
                vm.myEventList = [];
                vm.allEventList = [];
                vm.displayEventList = [];
                vm.eventDetailsFlag = false;
                vm.dateFlag = true;
                displayDate(vm.calendarDate);
            });
        };

        function updateScheduleEvent(userId) {
            var event = vm.eventClickData[0];
            vm.scheduleEventFilter.taskid = event.assignedTo[0].taskid; //US#8100
            if (vm.scheduleEventFilter.taskid) {
                var filterObj = scheduleHelper.getScheduleEventFilterObj(vm.scheduleEventFilter);
                scheduleEventDataForAPI(userId);
                var promise = scheduleDataLayer.updateScheduleEvent(filterObj, vm.scheduleEventData);
                promise.then(function (data) {
                    vm.isSaveAssignUser = false;
                    vm.eventDataClickFlag = false;
                    vm.myEventList = [];
                    vm.allEventList = [];
                    vm.displayEventList = [];
                    vm.eventDetailsFlag = false;
                    vm.dateFlag = true;
                    displayDate(vm.calendarDate);

                });
            } else {
                createScheduleEvent(userId);
            }
        }

        vm.calendarView = function () {
            resetCallbackHelper.setCallback();
            $scope.calendar.displayCalendar = true;
            $scope.calendar.scheduleCalendar = false;
        };

        vm.getSelectCategoryDetails = function (showEventFromName) {
            vm.eventClickData = [];
            vm.eventDataClickFlag = false;
            vm.assignedToUserName = [];
            vm.assingedToUserID = [];
            if (showEventFromName == "My Matter") {
                vm.filters.allEvent = 0;
                displayDate(vm.calendarDate);
            } else if (showEventFromName == "All Matter") {
                vm.filters.allEvent = 1;
                displayDate(vm.calendarDate);
            }
        };

        function enableDisableTaskFlag() {
            if (vm.assingedToUserID && vm.assingedToUserID.length > 0) {
                vm.createTaskDisabled = false;
            } else {
                vm.createTaskDisabled = true;
            }
        }

        //US#8100 func to set username when clicked on event
        function setNameOnEventClick(item) {
            var assignUser = angular.copy(item);
            if (utils.isEmptyVal(assignUser.assignedTo[0].uid)) {
                vm.assingedToUserID = undefined;
                vm.assignedToUserName = '';
                vm.createTaskDisabled = true;
            } else {
                var assignMultipleId = [];
                var assignUserName = [];
                _.forEach(assignUser.assignedTo, function (assignUserId) {
                    _.forEach(assignUser.users, function (userItem) {
                        if (userItem.uid == assignUserId.uid) {
                            assignMultipleId.push(userItem);
                            assignUserName.push(userItem.name);
                            vm.isSaveAssignUser = true;
                        }
                        vm.assignedToUserName = assignUserName.toString();
                        vm.assingedToUserID = assignMultipleId;
                    })
                });
                vm.createTaskDisabled = false;
                vm.isSaveAssignUser = true;
            }
        }

        vm.eventDataClick = function (eventDataId) {
            vm.eventClickData = [];
            vm.isSaveAssignUser = false;
            vm.assignedToUserName = [];
            vm.assingedToUserID = [];
            vm.eventDataClickFlag = true;
            if (vm.filters.allEvent == 0) {
                _.forEach(vm.myEventList, function (item) {
                    if (item.id == eventDataId) {
                        setNameOnEventClick(item);
                        vm.eventClickData.push(item);
                    }
                });
            } else if (vm.filters.allEvent == 1) {
                _.forEach(vm.allEventList, function (item) {
                    if (item.id == eventDataId) {
                        setNameOnEventClick(item);
                        vm.eventClickData.push(item);
                    }
                });
            }
            vm.istaskcreated = vm.eventClickData[0].istaskcreated;
        };

        vm.userSelected = function (userId) {
            var assignUname = _.pluck(userId, 'name'); //US#8100
            vm.assignedToUserName = assignUname.toString();
            vm.isSaveAssignUser = true;
            enableDisableTaskFlag();
        };

        vm.assignedSelectedEventToUser = function (userId) {
            var assignId = _.pluck(userId, 'uid');
            userId = assignId.toString();
            _.forEach(vm.eventClickData, function (item) {
                // _.forEach(item.users, function (userItem) { //US#8100
                //     if (userItem.uid == userId) {
                if (angular.isDefined(item.assignedTo)) {
                    if (item.assignedTo[0].fname == "Unassigned") {
                        createScheduleEvent(userId);
                    } else {
                        updateScheduleEvent(userId);
                    }
                }
                //     }
                // })
            });
        };

        //event handlers
        function openCalender($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            vm.datePickerEvent[isOpened] = true; //isOpened is a string specifying the model name
        }

        // get formatter string
        function getFormattedDateString(event) {
            vm.eventDataClickFlag = false;
            localDatePickerDate = vm.datePickerDate;
            vm.calendarDate = vm.datePickerDate;
            vm.eventClickData = [];
            vm.eventDataClickFlag = false;
            vm.assignedToUserName = [];
            vm.assingedToUserID = "";
            //vm.dateFlag = false;
            displayDate(vm.calendarDate);
        }
    }

})();

(function () {
    angular.module('cloudlex.schedule')
        .factory('scheduleHelper', scheduleHelper);

    function scheduleHelper() {
        return {
            getFiltersObj: getFiltersObj,
            getScheduleEventFilterObj: getScheduleEventFilterObj

        };

        function getFiltersObj(filters) {
            var formattedFilters = {};

            formattedFilters.s = filters.s;
            formattedFilters.e = filters.e;
            formattedFilters.from = filters.from;
            formattedFilters.allEvent = filters.allEvent;
            return formattedFilters;
        }

        function getScheduleEventFilterObj(filters) {
            var formattedFilters = {};
            formattedFilters.taskid = filters.taskid;
            return formattedFilters;
        }
    }

})();



//if (angular.isDefined(item.assignedTo)) {
//    result.push(item);
//} else {
//    item.assignedTo = { "uid": '', "fname": "Unassigned", "lname": "" };
//    result.push(item);
//}


/*if(!vm.dateFlag){
                   vm.displayDefaultDate= vm.datePickerDate ;
                   vm.calendarDate = vm.datePickerDate ;
                   //vm.dateFlag = true;
                   var year, month, day;
                   year = vm.displayDefaultDate.getFullYear();
                   month = vm.displayDefaultDate.getMonth();
                   day = vm.displayDefaultDate.getDate();

                   var date = year + "/" + (month+1) + "/" + day;

                   var momDate = moment(date, "YYYY/MM/DD");

                   var start, end;
                   start = angular.copy(momDate);
                   end = angular.copy(momDate);

                   start = start.startOf('day');
                   end = end.endOf('day');

                   tomorrowStartOfDay = moment(start).unix();
                   tomorrowEndOfDay = moment(end).unix();

                   //since there is no data for tomorrow so passing blank s and e only
                   vm.filters.s = tomorrowStartOfDay;
                   vm.filters.e = tomorrowEndOfDay;
                   vm.assignDate = moment.unix(tomorrowStartOfDay).format("MM/DD/YYYY");
                   vm.displayDefaultDate = moment.unix(tomorrowStartOfDay).format("MMM DD, YYYY");
                   vm.datePickerDate = vm.displayDefaultDate;
                   localDatePickerDate = vm.datePickerDate;

               }else{
                   vm.displayDefaultDate =  vm.calendarDate;
               }*/