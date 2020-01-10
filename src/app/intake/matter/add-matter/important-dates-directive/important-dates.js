(function (angular) {
    'use strict';

    angular
        .module('intake.matter')
        .directive('intakeImportantDates', [function () {

            return {
                link: link,
                restrict: 'E',
                controller: controllerFn,
                controllerAs: 'addImpDates',
                bindToController: true,
                scope: {
                    dates: '=',
                },
                templateUrl: "app/intake/matter/add-matter/important-dates-directive/important-dates.html"
            };

            function link(scope, element, attrs) {

            };

        }]);

    controllerFn.$inject = ['masterData', 'intakeImportantDatesHelper', 'globalConstants', 'notification-service', '$modal', 'intakeTaskSummaryDataLayer', 'intakeFactory'];

    function controllerFn(masterData, importantDatesHelper, globalConstants, notificationService, $modal, intakeTaskSummaryDataLayer, intakeFactory) {
        var vm = this;
        var eventIds = {};
        vm.dateFormat = 'MM/dd/yyyy';
        vm.solFlag = false;
        vm.getObjectKeys = getObjectKeys;
        vm.hideDeletedDate = hideDeletedDate;
        vm.hideDeleteBtn = hideDeleteBtn;
        vm.addDate = addDate;
        vm.disableAddBtn = disableAddBtn;
        vm.dateChanged = dateChanged;
        vm.deleteDate = deleteDate;
        vm.openCalender = openCalender;
        vm.openDatepicker = openDatepicker;
        vm.maxdate = globalConstants.maxDateforAddMatter;
        vm.newDateAdded = false;


        //init
        (function () {
            var permissions = masterData.getPermissions();
            vm.criticalDatesPermission = _.filter(permissions[0].permissions, function (per) {
                if (per.entity_id == '2') {
                    return per;
                }
            });
            mapEventIds(masterData.getEventTypes());
            // vm.permission = angular.copy(vm.dates);
            vm.impDates = {};
            vm.opened = {};
            setImp(vm.dates);
            if (!vm.assignedToUserList) {
                getUsersList();
            }
        })();

        // Fetching Users List for Assigning Event
        function getUsersList() {
            intakeTaskSummaryDataLayer.getAssignedUserData()
                .then(function (response) {
                    _.forEach(response, function (currentItem) {
                        currentItem.full_name = currentItem.fullName;
                        currentItem.user_id = currentItem.userId;
                        currentItem.user_name = currentItem.uname;
                    });
                    vm.assignedToUserList = response;
                });
        }


        function mapEventIds(events) {
            var impDates = [{
                name: "Statute of Limitations",
                short: "sol"
            },
            // {
            //     name: "Note of Issue",
            //     short: "noi"
            // },
            {
                name: "Notice of Claim Filing Deadline",
                short: "noc"
            }
            ];
            _.forEach(impDates, function (date) {
                var eventObj = _.find(events, function (evnt) {
                    return evnt.Name == date.name;
                });
                eventIds[date.short] = {
                    label_id: eventObj.LabelId
                };
            });
        }

        function setImp(dates) {
            if (angular.isUndefined(dates) || dates.length == 0) {
                vm.impDates = {
                    sol: [{
                        date: '',
                        type: 'SOL',
                        label_id: eventIds['sol'].label_id
                    }],
                    noc: [{
                        date: '',
                        type: 'NOC',
                        label_id: eventIds['noc'].label_id
                    }],
                    //    noi: [{
                    //          date: '',
                    //          type: 'NOI',
                    //          label_id: eventIds['noi'].label_id
                    //      }],
                }

            } else {
                importantDatesHelper.setImpDatesArray(dates, vm.impDates, eventIds)
            }
            vm.solFlag = utils.isNotEmptyVal(vm.impDates.sol[0].start_date) ? true : false;
        }

        function getObjectKeys(obj) {
            return Object.keys(obj);
        }

        function setMinDate(impDate) {
            if (angular.isUndefined(impDate)) {
                return undefined;
            }
            impDate.minDate = new Date(impDate.start_date);
        }

        function dateChanged(type, index) {

            setStatus(type, index);
            setImportantDatesArray();
        }

        function setStatus(type, index) {
            if (utils.isEmptyVal(vm.impDates[type][index].start_date) && (vm.impDates[type][index].status == 2)) {
                vm.impDates[type][index].status = 3;
                return;
            }

            if (utils.isNotEmptyVal(vm.impDates[type][index].start_date) && (vm.impDates[type][index].status == 3)) {
                vm.impDates[type][index].status = 2;
                return;
            }

            // if (vm.impDates[type][index].status == 1) {
            //     vm.impDates[type][index].status = 2;
            //     return;
            // }

            // if (vm.impDates[type][index].status == 0 && utils.isEmptyVal(vm.impDates[type][index].start_date)) {
            //     if (vm.impDates[type].length > 1) {
            //         vm.impDates[type].splice(index, 1);
            //     }
            //     return;
            // }

            // if (utils.isEmptyVal(vm.impDates[type][index].status) && utils.isEmptyVal(vm.impDates[type][index].start_date)) {
            //     if (vm.impDates[type].length > 1) {
            //         vm.impDates[type].splice(index, 1);
            //     }
            //     return;
            // }
        }

        function openCalender($event, i1, i2, type, eventData) {
            if (vm.criticalDatesPermission[0].E == 0) {
                vm.newImportantDates = _.filter(vm.impDates[type], function (dateObj) {
                    if (utils.isEmptyVal(dateObj.event_title)) {
                        return dateObj;
                    }
                });
                vm.oldImportantDates = _.filter(vm.impDates[type], function (dateObj) {
                    if (utils.isNotEmptyVal(dateObj.event_title)) {
                        return dateObj;
                    }
                });
                if (i2 <= vm.oldImportantDates.length - 1 && vm.newDateAdded != true) {
                    if (utils.isNotEmptyVal(vm.oldImportantDates)) {
                        if (utils.isNotEmptyVal(vm.oldImportantDates[0].start_date)) {
                            notificationService.error(" You are not authorized to edit critical dates");
                            return;
                        }
                    }
                }
            }

            var resolveObj = {};
            resolveObj.mode = 'add';
            resolveObj.LabelId = eventData.label_id;

            resolveObj.criticalDats = 'ctdates';

            if (utils.isNotEmptyVal(eventData.reminder_days)) {
                eventData.reminder_days = angular.isArray(eventData.reminder_days) ? eventData.reminder_days : eventData.reminder_days.split(',');
            }

            if (utils.isNotEmptyVal(eventData.sms_reminder_days)) {
                eventData.sms_reminder_days = angular.isArray(eventData.sms_reminder_days) ? eventData.sms_reminder_days : eventData.sms_reminder_days.split(',');
            }

            if (utils.isNotEmptyVal(eventData.start_date) && utils.isEmptyVal(eventData.intake_event_id)) {
                resolveObj.mode = 'edit';
                eventData.utcend = angular.isObject(eventData.end_date) ? utils.getUTCTimeStamp(eventData.end_date) : eventData.end_date;
                eventData.utcstart = angular.isObject(eventData.start_date) ? utils.getUTCTimeStamp(eventData.start_date) : eventData.start_date;
                resolveObj.selectedEvent = eventData;

            } else if (utils.isNotEmptyVal(eventData.intake_event_id) && utils.isNotEmptyVal(eventData.event_title)) {
                resolveObj.mode = 'edit';
                resolveObj.selectedEvent = eventData;
            } else if (utils.isNotEmptyVal(eventData.intake_event_id) && utils.isEmptyVal(eventData.event_title) && utils.isNotEmptyVal(eventData.start_date)) {
                resolveObj.mode = 'edit';
                eventData.utcend = angular.isObject(eventData.end_date) ? utils.getUTCTimeStamp(eventData.end_date) : eventData.end_date;
                eventData.utcstart = angular.isObject(eventData.start_date) ? utils.getUTCTimeStamp(eventData.start_date) : eventData.start_date;
                resolveObj.selectedEvent = eventData;

            }
            resolveObj.assignedToUserList = angular.copy(vm.assignedToUserList);

            $event.preventDefault();
            $event.stopPropagation();
            angular.forEach(vm.opened, function (val, key) {
                vm.opened[key] = false;
            });
            i1 = i1.toString();
            i2 = i2.toString();
            vm.opened[i1 + i2] = true;
            vm.newDateAdded = false;
            openAddEditEventsModal(resolveObj, $event, i1, i2, type, eventData);

        };


        function openAddEditEventsModal(resolveObj, $event, i1, i2, type, eventData) {
            var sms_Details = intakeFactory.getAssociateContactDetails();
            resolveObj.fromOverview = true;
            var modalInstance = $modal.open({
                templateUrl: 'app/intake/events/partials/add-event.html',
                controller: 'intakeAddEditEventCtrl as addEditEvent',
                windowClass: 'eventDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    addEditEventsParams: function () {
                        return angular.copy(resolveObj);
                    },
                    sms_contactList: function () {
                        return sms_Details;
                    }
                },
            });

            modalInstance.result.then(function (responseData) {
                var responseDataCopy = angular.copy(responseData);
		        if (responseDataCopy.intake_event_id) {
                    responseDataCopy.status = 2;
                }                
		        responseDataCopy.assigned_to = [];
                responseDataCopy.assign_to = angular.copy(responseDataCopy.assignedUsers);
                angular.forEach(responseDataCopy.assignedUsers, function (val, key) {
                    responseDataCopy.assigned_to.push(val.userId);
                });
                responseDataCopy.start = moment(responseDataCopy.start_date).utc().startOf('day').unix();
                //Bug#11236
                responseDataCopy.end = moment(responseDataCopy.end_date).utc().endOf("day").unix();
                responseDataCopy.start_date = responseDataCopy.start;
                responseDataCopy.end_date = responseDataCopy.end;
                responseDataCopy.startCopy = moment.unix(responseDataCopy.start_date).utc().format('MM/DD/YYYY');
                vm.impDates[type][i2] = angular.extend(vm.impDates[type][i2], responseDataCopy);
                dateChanged(type, i2);
            });
        }

        function openDatepicker(i1, i2) {
            i1 = i1.toString();
            i2 = i2.toString();
            return i1 + i2;
        }

        function hideDeletedDate(impDate, index) {
            var status = impDate[index].status;
            return (status == 3 && index == 0) ? !allDatesDeleted(impDate) : status == 3;
        }

        function allDatesDeleted(impDate) {
            var undeleted = _.findIndex(impDate, function (dt) {
                return utils.isEmptyVal(dt.status) || dt.status != 3;
            });
            //no undeleted date found
            return undeleted == -1;
        }

        function hideDeleteBtn(impDate, index) {
            var condition = true && index == 0;
            if (condition) {
                return condition;
            }

            var firstDateNotDeleted = _.findIndex(impDate, function (dt) {
                return dt.status !== 3;
            });
            condition = condition || _.isEqual(index, firstDateNotDeleted);

            return condition;
        }

        function addDate(type, index) {
            vm.newDateAdded = true; //Bug#7300  
            var dt = utils.convertUTCtoDate(vm.impDates[type][index].start_date); //set min date for the added
            vm.impDates[type].splice(index + 1, 0, {
                date: '',
                minDate: dt,
                type: type.toUpperCase(),
                label_id: eventIds[type].label_id,
                status: 0
            });
        }

        function disableAddBtn(impDate, index) {
            var date = impDate[index].start_date;
            var nextDate = impDate[index + 1];
            return ((utils.isEmptyVal(date) || (date == 0)) || !isLastUndeleted(impDate, index));
        }

        function isLastUndeleted(impDate, index) {
            var isLast = false;
            var lastUndeleted;
            for (var i = (impDate.length - 1); i >= 0; i--) {
                var dt = impDate[i];
                isLast = dt.status != 3;
                if (isLast) {
                    lastUndeleted = i;
                    break;
                }
            }

            return lastUndeleted == index;
        }

        function isFirstUndeleted(impDate, index) {
            var isFirst = false;
            var firstUndeleted;
            for (var i = 0; i < impDate.length; i++) {
                var dt = impDate[i];
                isFirst = dt.status != 3;
                if (isFirst) {
                    firstUndeleted = i;
                    break;
                }
            }

            return firstUndeleted == index;
        }

        function deleteDate(type, index) {
            // vm.newDateAdded = true; //Bug#7300  
            if (vm.impDates[type][index].status == 1 || vm.impDates[type][index].status == 0) {
                vm.impDates[type].splice(index, 1);
            } else {
                //if (vm.impDates[type][index].status == 2) {
                    vm.impDates[type][index].status = 3
                //}
            }
            setImportantDatesArray();
        }

        function setImportantDatesArray() {

            vm.dates = [];
            var impDates = angular.copy(vm.impDates);
            angular.forEach(impDates, function (datesList, type) {
                _.forEach(datesList, function (dateObj) {
                    var date = angular.copy(dateObj);
                    if (angular.isUndefined(date.status) || date.status == 0) {
                        date.status = 1;
                    }
                    if (utils.isNotEmptyVal(date.start_date) || date.status > 1) {
                        vm.dates.push(date);
                    }
                });
            });
            vm.newDateAdded == false;
        }
    }

    angular
        .module('intake.matter')
        .factory('intakeImportantDatesHelper', intakeImportantDatesHelper);

    function intakeImportantDatesHelper() {
        return {
            setImpDatesArray: setImpDatesArray
        }

        function setImpDatesArray(dates, impDates, eventIds) {
            //repeat imp events 
            angular.forEach(eventIds, function (impDateEvent, impDateType) {
                //find all the event obj for particular event
                impDates[impDateType] = _.filter(dates, function (date) {
                    return date.label_id == impDateEvent.label_id;
                });
                //if data available for imp event
                if (impDates[impDateType].length > 0) {
                    //set date prop to be used on the view
                    _.forEach(impDates[impDateType], function (impDate, index) {
                        impDate.type = impDateType.toUpperCase();
                        impDate.startCopy = moment.unix(impDate.start_date).utc().format('MM/DD/YYYY');

                        //set the min date for next date
                        if (angular.isDefined(impDates[index + 1])) {
                            impDates[index + 1].minDate = new Date(impDate.start_date);
                        }
                        impDate.status = 4; //for received dates set status to 2
                    });
                } else {
                    //set default date
                    impDates[impDateType] = [{
                        date: '',
                        type: impDateType.toUpperCase(),
                        label_id: eventIds[impDateType].label_id,
                    }];
                }

            });

        }
    }

})(angular);
