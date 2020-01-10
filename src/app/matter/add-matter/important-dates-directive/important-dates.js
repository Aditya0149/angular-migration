(function (angular) {
    'use strict';

    angular
        .module('cloudlex.matter')
        .directive('importantDates', [function () {

            return {
                link: link,
                restrict: 'E',
                controller: controllerFn,
                controllerAs: 'addImpDates',
                bindToController: true,
                scope: {
                    dates: '=',
                },
                templateUrl: "app/matter/add-matter/important-dates-directive/important-dates.html"
            };

            function link(scope, element, attrs) {

            };

        }]);

    controllerFn.$inject = ['masterData', 'importantDatesHelper', 'globalConstants', 'notification-service', '$modal', 'matterFactory', 'eventsDataService'];

    function controllerFn(masterData, importantDatesHelper, globalConstants, notificationService, $modal, matterFactory, eventsDataService) {
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
            eventsDataService.getStaffsInFirm()
                .then(function (data) {
                    vm.users = data;
                    setImp(vm.dates);
                });
        })();


        function mapEventIds(events) {
            var impDates = [{
                name: "Statute of Limitations",
                short: "sol"
            },
            {
                name: "Note of Issue",
                short: "noi"
            },
            {
                name: "Notice of Claim Filing Deadline",
                short: "noc"
            }
            ];
            _.forEach(impDates, function (date) {
                var eventObj = _.find(events, function (evnt) {
                    return evnt.Name === date.name;
                });
                eventIds[date.short] = {
                    labelid: eventObj.LabelId
                };
            });
        }

        function setImp(dates) {
            if (angular.isUndefined(dates) || dates.length === 0) {
                vm.impDates = {
                    sol: [{
                        date: '',
                        type: 'SOL',
                        labelid: eventIds['sol'].labelid
                    }],
                    noc: [{
                        date: '',
                        type: 'NOC',
                        labelid: eventIds['noc'].labelid
                    }],
                    noi: [{
                        date: '',
                        type: 'NOI',
                        labelid: eventIds['noi'].labelid
                    }],
                }

            } else {
                importantDatesHelper.setImpDatesArray(dates, vm.impDates, eventIds)
            }
            vm.solFlag = utils.isNotEmptyVal(vm.impDates.sol[0].start) ? true : false;
        }

        function getObjectKeys(obj) {
            return Object.keys(obj);
        }

        function dateChanged(type, index) {

            setStatus(type, index);
            setImportantDatesArray();
        }

        function setStatus(type, index) {
            if (utils.isEmptyVal(vm.impDates[type][index].start) && (vm.impDates[type][index].status === 2)) {
                vm.impDates[type][index].status = 3;
                return;
            }

            if (utils.isNotEmptyVal(vm.impDates[type][index].start) && (vm.impDates[type][index].status === 3)) {
                vm.impDates[type][index].status = 2;
                return;
            }

            // if (vm.impDates[type][index].status === 1) {
            //     vm.impDates[type][index].status = 2;
            //     return;
            // }

            // if (vm.impDates[type][index].status === 0 && utils.isEmptyVal(vm.impDates[type][index].start)) {
            //     if (vm.impDates[type].length > 1) {
            //         vm.impDates[type].splice(index, 1);
            //     }
            //     return;
            // }

            // if (utils.isEmptyVal(vm.impDates[type][index].status) && utils.isEmptyVal(vm.impDates[type][index].start)) {
            //     if (vm.impDates[type].length > 1) {
            //         vm.impDates[type].splice(index, 1);
            //     }
            //     return;
            // }
        }

        function openCalender($event, i1, i2, type, eventData) {
            if (vm.criticalDatesPermission[0].E == 0) {
                vm.newImportantDates = _.filter(vm.impDates[type], function (dateObj) {
                    if (utils.isEmptyVal(dateObj.title)) {
                        return dateObj;
                    }
                });
                vm.oldImportantDates = _.filter(vm.impDates[type], function (dateObj) {
                    if (utils.isNotEmptyVal(dateObj.title)) {
                        return dateObj;
                    }
                });
                if (i2 <= vm.oldImportantDates.length - 1 && vm.newDateAdded != true) {
                    if (utils.isNotEmptyVal(vm.oldImportantDates)) {
                        if (utils.isNotEmptyVal(vm.oldImportantDates[0].start)) {
                            notificationService.error(" You are not authorized to edit critical dates");
                            return;
                        }
                    }
                }
            }

            var resolveObj = {};
            resolveObj.mode = 'add';
            resolveObj.LabelId = eventData.labelid;
            resolveObj.criticalDats = 'ctdates';
            if (utils.isNotEmptyVal(eventData.reminderdays)) {
                eventData.reminderdays = angular.isArray(eventData.reminderdays) ? eventData.reminderdays : eventData.reminderdays.split(',');
            }
            if (utils.isNotEmptyVal(eventData.sms_reminder_days)) {
                eventData.sms_reminder_days = angular.isArray(eventData.sms_reminder_days) ? eventData.sms_reminder_days : eventData.sms_reminder_days.split(',');
            }
            if (utils.isNotEmptyVal(eventData.start) && utils.isEmptyVal(eventData.id)) {
                resolveObj.mode = 'edit';
                eventData.utcend = angular.isObject(eventData.utcend) ? utils.getUTCTimeStamp(eventData.utcend) : eventData.utcend;
                eventData.utcstart = angular.isObject(eventData.utcstart) ? utils.getUTCTimeStamp(eventData.utcstart) : eventData.utcstart;
                resolveObj.selectedEvent = eventData;
            } else if (utils.isNotEmptyVal(eventData.id) && utils.isNotEmptyVal(eventData.title)) {
                resolveObj.mode = 'edit';
                resolveObj.selectedEvent = eventData;
            } else if (utils.isNotEmptyVal(eventData.id) && utils.isEmptyVal(eventData.title) && utils.isNotEmptyVal(eventData.start)) {
                resolveObj.mode = 'edit';
                eventData.utcend = angular.isObject(eventData.utcend) ? utils.getUTCTimeStamp(eventData.utcend) : eventData.utcend;
                eventData.utcstart = angular.isObject(eventData.utcstart) ? utils.getUTCTimeStamp(eventData.utcstart) : eventData.utcstart;
                resolveObj.selectedEvent = eventData;

            }

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
            resolveObj.fromOverview = true;

            var assigned_to = [];
            if (resolveObj.selectedEvent && resolveObj.selectedEvent.assigned_to) {
                _.forEach(resolveObj.selectedEvent.assigned_to, function (item) {
                    var a = {};
                    a.full_name = item.fname;
                    a.user_name = item.name;
                    a.user_id = item.uid;
                    assigned_to.push(a);
                });
            }

            if (resolveObj && resolveObj.selectedEvent && resolveObj.selectedEvent.remind_users && (resolveObj.selectedEvent.remind_users instanceof Array)) {
                var remind_users = [];
                _.forEach(resolveObj.selectedEvent.remind_users, function (item) {
                    remind_users.push(item);
                });
                resolveObj.selectedEvent.remind_users = JSON.stringify(remind_users);
            }

            if (resolveObj && resolveObj.selectedEvent) {
                var selectedEvent = {
                    DeadlineDatesClicked: resolveObj.selectedEvent.DeadlineDatesClicked,
                    all_day: parseInt(resolveObj.selectedEvent.allday),
                    assigned_to: assigned_to,
                    comments: resolveObj.selectedEvent.comments,
                    criticalDatesClicked: resolveObj.selectedEvent.criticalDatesClicked,
                    custom_reminder: resolveObj.selectedEvent.custom_reminder,
                    sms_custom_reminder: resolveObj.selectedEvent.sms_custom_reminder,
                    // end: resolveObj.selectedEvent.end,
                    is_critical: parseInt(resolveObj.selectedEvent.is_critical),
                    is_deadline: parseInt(resolveObj.selectedEvent.is_deadline),
                    is_comply: (resolveObj.selectedEvent.isComply) ? parseInt(resolveObj.selectedEvent.isComply) : 0,
                    is_task_created: parseInt(resolveObj.selectedEvent.istaskcreated),
                    label_id: resolveObj.selectedEvent.label_id,
                    labelid: resolveObj.selectedEvent.label_id,
                    matter: {
                        matter_id: matterFactory.getMatterid()
                    },
                    private: resolveObj.selectedEvent.private,
                    remind_date: resolveObj.selectedEvent.remind_date,
                    reminder_days: resolveObj.selectedEvent.reminderdays,
                    sms_reminder_days: resolveObj.selectedEvent.sms_reminder_days,
                    reminder_users: resolveObj.selectedEvent.remind_users,
                    sms_contact_ids: resolveObj.selectedEvent.sms_contact_ids,
                    // start: resolveObj.selectedEvent.start,
                    title: resolveObj.selectedEvent.title,
                    user_defined: resolveObj.selectedEvent.user_defined,
                    end: resolveObj.selectedEvent.utcend,
                    start: resolveObj.selectedEvent.utcstart,
                    reason: resolveObj.selectedEvent.reason,
                    share_with: resolveObj.selectedEvent.share_with ? resolveObj.selectedEvent.share_with : [],
                    event_id: resolveObj.selectedEvent.id,
                    location: resolveObj.selectedEvent.location,
                    description: resolveObj.selectedEvent.description
                }

            } else {
                selectedEvent = {
                    matter: {
                        matter_id: matterFactory.getMatterid()
                    }
                }
            }

            var modalInstance = $modal.open({
                templateUrl: 'app/events/partials/add-event.html',
                controller: 'addEditEventCtrl as addEditEvent',
                windowClass: 'eventDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    addEditEventsParams: function () {
                        var newResolveObj = {
                            label_id: resolveObj.LabelId,
                            criticalDats: resolveObj.criticalDats,
                            fromOverview: resolveObj.fromOverview,
                            mode: resolveObj.mode,
                            selectedEvent: selectedEvent,
                            users: vm.users
                        }
                        return angular.copy(newResolveObj);
                    }
                },
            });

            modalInstance.result.then(function (responseData) {
                var assigned_to = [];
                if (responseData && responseData.assigned_to) {
                    _.forEach(responseData.assigned_to, function (item) {
                        var a = {};
                        a.fname = item.full_name;
                        a.name = item.user_name;
                        a.uid = parseInt(item.user_id);
                        assigned_to.push(a);
                    });
                }

                if (responseData && responseData.remind_users_temp && (responseData.remind_users_temp instanceof Array)) {
                    var remind_users = [];
                    _.forEach(responseData.remind_users_temp, function (item) {
                        remind_users.push(item.toString());
                    });
                    responseData.remind_users_temp = remind_users;
                }
                if (responseData.sms_contact_ids instanceof Array) {
                    var remind_users = [];
                    _.forEach(responseData.sms_contact_ids, function (item) {
                        remind_users.push(item.toString());
                    });
                    responseData.sms_contact_ids = remind_users;
                }

                var newResponseData = {
                    DeadlineDatesClicked: responseData.DeadlineDatesClicked,
                    allday: responseData.all_day.toString(),
                    assigned_to: assigned_to,
                    comments: responseData.comments,
                    criticalDatesClicked: responseData.criticalDatesClicked,
                    custom_reminder: responseData.custom_reminder,
                    sms_custom_reminder: responseData.sms_custom_reminder,
                    description: responseData.description,
                    // end: responseData.end,
                    id: responseData.event_id,
                    is_critical: utils.isNotEmptyVal(responseData.is_critical) ? responseData.is_critical.toString() : "0",
                    is_deadline: utils.isNotEmptyVal(responseData.is_deadline) ? responseData.is_deadline.toString() : "0",
                    isComply: utils.isNotEmptyVal(responseData.is_comply) ? responseData.is_comply.toString() : "0",
                    isdeleted: responseData.is_deleted,
                    ispersonalevent: utils.isNotEmptyVal(responseData.is_personalevent) ? responseData.is_personalevent.toString() : "0",
                    istaskcreated: parseInt(responseData.is_task_created),
                    labelid: responseData.label_id,
                    lastmodified: responseData.lastmodified,
                    location: responseData.location,
                    matterid: responseData.matterid,
                    private: responseData.private,
                    reminderdays: responseData.reminder_days,
                    sms_reminder_days: responseData.sms_reminder_days,
                    utcstart: responseData.start,
                    utcend: responseData.end,
                    start: responseData.start,
                    end: responseData.end,
                    title: responseData.title,
                    userdefined: responseData.user_defined,
                    remind_users: responseData.remind_users_temp,
                    remind_users_temp: responseData.remind_users_temp,
                    sms_contact_ids: responseData.sms_contact_ids,
                    share_with: responseData.share_with ? responseData.share_with : [],
                    remind_date: responseData.remind_date,
                    reminder_datetime: responseData.reminder_datetime,
                    reason: responseData.reason
                }
                if (newResponseData.id) {
                    newResponseData.status = 2;
                }
                var responseDataCopy = angular.copy(newResponseData);
                responseDataCopy.startCopy = moment.unix(responseDataCopy.utcstart).utc().format('MM/DD/YYYY');
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
            return (status === 3 && index === 0) ? !allDatesDeleted(impDate) : status === 3;
        }

        function allDatesDeleted(impDate) {
            var undeleted = _.findIndex(impDate, function (dt) {
                return utils.isEmptyVal(dt.status) || dt.status != 3;
            });
            //no undeleted date found
            return undeleted == -1;
        }

        function hideDeleteBtn(impDate, index) {
            var condition = true && index === 0;
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
            var dt = utils.convertUTCtoDate(vm.impDates[type][index].start); //set min date for the added
            vm.impDates[type].splice(index + 1, 0, {
                date: '',
                minDate: dt,
                type: type.toUpperCase(),
                labelid: eventIds[type].labelid,
                status: 0
            });
        }

        function disableAddBtn(impDate, index) {
            var date = impDate[index].start;
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

            return lastUndeleted === index;
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

            return firstUndeleted === index;
        }

        function deleteDate(type, index) {
            // vm.newDateAdded = true; //Bug#7300  
            if (vm.impDates[type][index].status === 1 || vm.impDates[type][index].status === 0) {
                vm.impDates[type].splice(index, 1);
            } else {
                //if (vm.impDates[type][index].status === 2) {
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
                    if (angular.isUndefined(date.status) || date.status === 0) {
                        date.status = 1;
                    }
                    if (utils.isNotEmptyVal(date.start) || date.status > 1) {
                        vm.dates.push(date);
                    }
                });
            });
            vm.newDateAdded == false;
        }
    }

    angular
        .module('cloudlex.matter')
        .factory('importantDatesHelper', importantDatesHelper);
    importantDatesHelper.$inject = ['matterFactory'];

    function importantDatesHelper(matterFactory) {
        return {
            setImpDatesArray: setImpDatesArray
        }

        function setImpDatesArray(dates, impDates, eventIds) {
            //repeat imp events 
            angular.forEach(eventIds, function (impDateEvent, impDateType) {
                //find all the event obj for particular event
                impDates[impDateType] = _.filter(dates, function (date) {
                    return date.labelid === impDateEvent.labelid;
                });
                //if data available for imp event
                if (impDates[impDateType].length > 0) {
                    //set date prop to be used on the view
                    _.forEach(impDates[impDateType], function (impDate, index) {
                        impDate.type = impDateType.toUpperCase();
                        impDate.startCopy = moment.unix(impDate.utcstart).utc().format('MM/DD/YYYY');
                        // var isValid = utils.isValidFullDayDate(impDate.utcstart, 'start');
                        // var isValidEndDate = utils.isValidFullDayDate(impDate.utcend, 'end');
                        // if (isValid) {
                        // var format = 'ddd MMM DD YYYY HH:mm:ss';
                        // var date = moment.unix(impDate.utcstart);
                        // date = date.utc().format(format);
                        // date = moment(date, format);
                        // impDate.start = moment(date.valueOf()).unix();

                        // }
                        // if (isValidEndDate) {
                        // var format = 'ddd MMM DD YYYY HH:mm:ss';
                        // var endDate = moment.unix(impDate.utcend);
                        // endDate = endDate.utc().format(format);
                        // endDate = moment(endDate, format);
                        // impDate.end = moment(endDate.valueOf()).unix();

                        // }
                        //set the min date for next date
                        if (angular.isDefined(impDates[index + 1])) {
                            impDates[index + 1].minDate = new Date(impDate.start);
                        }
                        impDate.status = 4; //for received dates set status to 2
                    });
                } else {
                    //set default date
                    impDates[impDateType] = [{
                        date: '',
                        type: impDateType.toUpperCase(),
                        labelid: eventIds[impDateType].labelid,
                    }];
                }

            });

        }
    }

})(angular);