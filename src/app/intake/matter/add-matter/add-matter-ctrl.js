(function (angular) {
    'use strict';

    angular
        .module('intake.matter')
        .controller('AddIntakeCtrl', AddIntakeCtrl);

    AddIntakeCtrl.$inject = ['intakeFactory', 'addIntakeHelper', 'notification-service', 'globalConstants', '$modalInstance', 'modalParams', 'masterDataList', 'intakeEventsHelper', '$modal',
        'intakeInfo', 'sub_status', 'users', 'intakeListHelper', '$location', '$q', 'fromOverViewTab', 'contactFactory', 'intakeMasterData'
    ];

    function AddIntakeCtrl(intakeFactory, addIntakeHelper, notificationService, globalConstants, $modalInstance, modalParams, masterDataList, intakeEventsHelper, $modal,
        intakeInfo, sub_status, users, intakeListHelper, $location, $q, fromOverViewTab, contactFactory, intakeMasterData) {
        //variable declarations
        var vm = this;
        vm.masterDataList = masterDataList;
        vm.intakeId = modalParams.intakeId;
        vm.pageMode = angular.isDefined(vm.intakeId) && utils.isNotEmptyString(vm.intakeId) ? 'edit' : 'add';
        vm.cancel = cancel;
        vm.formatTypeaheadDisplay = contactFactory.formatTypeaheadDisplay_Document;
        vm.addNewContact = addNewContact;
        vm.isDatesValid = isDatesValid;
        vm.nameList = [{ id: 'nameList' }];
        vm.datepickerOptions = {
            formatYear: 'yyyy',
            startingDay: 1,
            'show-weeks': false
        };
        vm.dateFormat = 'MM/dd/yyyy';
        vm.open = openCalender;
        vm.intakeInfo = intakeInfo;
        vm.substatus = sub_status;
        vm.incidentList = angular.copy(globalConstants.incidentList);
        vm.getSubstatuses = getSubstatuses;
        vm.saveIntake = saveIntake;
        vm.getContacts = getContacts;
        vm.deleteNameList = deleteNameList;
        vm.addNameList = addNameList;
        vm.addNewPlaintiff = addNewPlaintiff;
        vm.users = users;
        vm.typeList = [{ id: '1', name: 'Facebook' }, { id: '2', name: 'Linked In' }, { id: '3', name: 'Twitter' }, { id: '4', name: 'Instagram' }, { id: '5', name: 'Google' }, { id: '6', name: 'Other' }, { id: '7', name: 'Referral' }, { id: '8', name: 'TV Ad' }, { id: '9', name: 'Radio Ad' }, { id: '10', name: 'Billboard' }, { id: '11', name: 'Website' }, { id: '12', name: 'Lead Generator' }];
        vm.addEditIntake = addEditIntake;
        vm.setVenues = setVenues;
        vm.masterData = intakeMasterData.getMasterData();
        vm.jurisdictionList = vm.masterData.jurisdiction;
        vm.venues = {};
        vm.initializing = true;
        (function () {

            vm.display = addIntakeHelper.getDisplayObject(vm.pageMode);

            if (vm.pageMode === 'edit') {
                vm.mode = 'edit';
                vm.pageTitle = "Edit Intake";
                getMatterDataForEdit(vm.intakeId);
            } else {
                vm.mode = 'add';
                vm.pageTitle = "Add Intake";
                vm.intakeInfo.dateOfIntake = moment().format('MM/DD/YYYY');
                var defaultJurisdiction = utils.isNotEmptyVal(localStorage.getItem('firmJurisdiction')) ? JSON.parse(localStorage.getItem('firmJurisdiction')) : '';
                vm.intakeInfo.jurisdictionId = utils.isNotEmptyVal(defaultJurisdiction) ? parseInt(defaultJurisdiction.id) : '';
                setVenues(vm.intakeInfo.jurisdictionId);
                vm.initializing = false;
            }
        })();

        function openCalender($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }
        function getPlaintiffForSMSIntake(intakeId) {
            vm.contactList1 = [];
            if (angular.isUndefined(intakeId)) {
                return;
            }
            intakeFactory.getPlaintiffByIntake(intakeId)
                .then(function (response) {
                    if (utils.isNotEmptyString(response)) {
                        var data = response[0].contact;
                        intakeFactory.getOtherDetails(intakeId)
                            .then(function (res) {
                                var otherDetailsInfo = utils.isNotEmptyVal(res) ? JSON.parse(res[0].detailsJson) : null;
                                var list = intakeEventsHelper.setContactList(data, vm.intakeInfo.intakeSubType, otherDetailsInfo, response)
                                vm.contactList1 = _.unique(list, 'contactid');
                                intakeFactory.setAssociateContactDetails(vm.contactList1);
                            });
                    }
                });
        }

        function getContacts(contactName, searchItem) {
            var postObj = {};
            if (searchItem) {
                postObj.type = searchItem == 'refTo' ? globalConstants.refferedToTypeList : searchItem == 'intake_name' ? globalConstants.intakeNameList : globalConstants.refferedByTypeList;
            } else {
                postObj.type = globalConstants.allTypeList;
            }
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';


            return intakeFactory.getContactsByName(postObj)
                .then(function (response) {
                    var data = response.data;
                    _.forEach(data, function (contact) {
                        contact.name = utils.removeunwantedHTML(contact.first_name) + ' ' + utils.removeunwantedHTML(contact.last_name);
                    });
                    return data;
                });
        }

        function addNewPlaintiff(index) {
            var selectedType = {};
            selectedType.type = "all";
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                if (utils.isNotEmptyVal(response)) {
                    vm.nameList[index].name = response;
                }
            }, function () {
            });
        }

        function addNameList() {
            vm.nameList.push({
                id: 'nameList' + (vm.nameList.length + 1)
            });
        }

        function deleteNameList(index) {
            if (index !== -1) {
                vm.nameList.splice(index, 1);
            }
        }

        function saveIntake(intakeData, closeTaskAndEvent) {
            if (!intakeData.intakeId) {
                if (vm.nameList[0].name == undefined) {
                    notificationService.error("Please add intake name");
                    return;
                }

                if (typeof (vm.nameList[0].name) != "object") {
                    notificationService.error("Invalid intake name");
                    return;
                }
                vm.flag = false;
                vm.intakeInfo.name = [];
                _.forEach(vm.nameList, function (item) {
                    if (!vm.flag) {
                        if (typeof item.name === 'object') {
                            item.name.name = [item.name.first_name, item.name.last_name].join(" "),
                                vm.intakeInfo.name.push(item.name);
                        } else {
                            vm.flag = true;
                            notificationService.error("Invalid Intake name");
                            return;
                        }
                    }
                });
                if (vm.flag) {
                    return;
                }
                if (utils.isEmptyVal(vm.intakeInfo.type)) {
                    notificationService.error("Please select type");
                    return;
                }
                if (utils.isEmptyVal(vm.intakeInfo.subtype)) {
                    notificationService.error("Please select subtype");
                    return;
                }
                if (utils.isEmptyVal(vm.intakeInfo.jurisdictionId)) {
                    notificationService.error("Please select jurisdiction");
                    return;
                }
            } else {
                if (utils.isEmptyVal(vm.intakeInfo.intakeName)) {
                    notificationService.error("Please add intake name");
                    return;
                }
                if (utils.isEmptyVal(vm.intakeInfo.subtype)) {
                    notificationService.error("Please select subtype");
                    return;
                }
                if (utils.isEmptyVal(vm.intakeInfo.jurisdictionId)) {
                    notificationService.error("Please select jurisdiction");
                    return;
                }
            }

            //Bug#16795
            if (utils.isNotEmptyVal(intakeData.leadSource) && intakeData.leadSource.id !== "6") {
                intakeData.leadSourceDescription = "";
            }

            //Refered by and Refered to US#6288
            if (utils.isEmptyVal(intakeData.referredBy) || utils.isNotEmptyVal(intakeData.referredBy.contact_id)) {
                intakeData.referredBy;
            } else {
                notificationService.error("Invalid refer by");
                return;
            }
            if (utils.isEmptyVal(intakeData.referredTo) || utils.isNotEmptyVal(intakeData.referredTo.contact_id)) {
                intakeData.referredTo;
            } else {
                notificationService.error("Invalid refer to");
                return;
            }
            if (fromOverViewTab) {
                intakeData.markTaskandEventForIntake = closeTaskAndEvent;
                $modalInstance.close(intakeData);
            }
            else {
                vm.intake_name = angular.copy(intakeData.name);
                save(angular.copy(intakeData), closeTaskAndEvent);
            }
        }

        function addEditIntake(info) {
            if (info.statusname.id == '3') {
                var matterObj = vm.intakeId;
                var modalInstance = $modal.open({
                    templateUrl: 'app/matter/add-matter/partial/closed-matter.html',
                    controller: 'Closed_MatterCtrl as closedCtrl',
                    windowClass: 'modalMidiumDialog',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        modalParams: function () {
                            return matterObj;
                        }
                    },
                });

                modalInstance.result.then(function (resp) {
                    saveIntake(info, true);
                }, function (error) {
                    saveIntake(info, false);
                });
            } else {
                saveIntake(info, false);
            }
        }

        function getSubstatuses(status) {
            vm.intakeInfo.substatus = null;
            var substatus = [];
            //get selected statuses substatus                
            if (utils.isEmptyVal(status)) {
                substatus = [];
                return;
            }
            var selectedStatusFromList = [];
            selectedStatusFromList.push(status);
            var statuses = vm.masterDataList.status;
            var selectedStatus = [];
            _.forEach(selectedStatusFromList, function (item) {
                _.forEach(statuses, function (currentItem) {
                    if (item.id == currentItem.id) {
                        _.forEach(currentItem["substatus"], function (currentI) {
                            currentI.statusname = currentItem.name;
                            currentI.statusid = currentItem.id
                            selectedStatus.push(currentI);
                        })
                    }
                })
            })
            vm.substatus = selectedStatus;
            //return substatus;
        }

        function isDatesValid() {
            if ($('#dateofIncident').css("display") == "block" || $('#dateOfIntake').css("display") == "block") {
                return true;
            } else {
                return false;
            }
        }

        function getMatterDataForEdit(intakeId) {
            //we are populating same object 'matterInfo' using different ajax calls
            //therefore we are populating it synchronously
            getMatterInfo(intakeId);
        }

        function getMatterInfo(intakeId) {
            var dataObj = {
                "page_number": 1,
                "page_size": 250,
                "intake_id": intakeId,
                "is_migrated": 2
            };
            var promise = intakeFactory.getMatterList(dataObj);
            promise
                .then(function (response) {
                    var matterInfo = response.intakeData[0];
                    addIntakeHelper.setMatterInfo(matterInfo, vm.intakeInfo);
                    vm.intakeInfo.dateOfIntake = matterInfo.dateOfIntake && matterInfo.dateOfIntake != null ? moment.unix(matterInfo.dateOfIntake).utc().format('MM/DD/YYYY') : '';
                    var leadSource = angular.copy(vm.intakeInfo.leadSource);
                    if (utils.isNotEmptyVal(leadSource)) {
                        _.forEach(vm.typeList, function (item) {
                            if (item.name == leadSource) { vm.intakeInfo.leadSource = item; }
                        })

                    };
                    if (utils.isNotEmptyVal(matterInfo.referredTo)) {
                        intakeListHelper.processContactObj(matterInfo.referredTo);

                    }
                    if (utils.isNotEmptyVal(matterInfo.referredBy)) {
                        intakeListHelper.processContactObj(matterInfo.referredBy);

                    }
                    var defaultJurisdiction = utils.isNotEmptyVal(localStorage.getItem('firmJurisdiction')) ? JSON.parse(localStorage.getItem('firmJurisdiction')) : '';
                    vm.intakeInfo.jurisdictionId = (vm.intakeInfo.jurisdictionId != 0) ? vm.intakeInfo.jurisdictionId : utils.isNotEmptyVal(defaultJurisdiction) ? parseInt(defaultJurisdiction.id) : ''
                    vm.intakeInfo.venueId = (vm.intakeInfo.venueId != 0) ? vm.intakeInfo.venueId : '';
                    getPlaintiffForSMSIntake(vm.intakeId);
                    getImportantDates(intakeId);
                    setVenues(vm.intakeInfo.jurisdictionId);
                    vm.initializing = false;
                }, function (error) {
                });
        }

        function getImportantDates(intakeId) {
            intakeFactory.getImportantDates(intakeId)
                .then(function (response) {
                    var filteredEvents = [];
                    var fulldayEventsId = angular.copy(globalConstants.fulldayEvents);
                    var Removedid = fulldayEventsId.splice(1, 1);
                    var fulldayEventsIds = angular.copy(fulldayEventsId);
                    if (response.data.events && response.data.events.length > 0) {
                        filteredEvents = _.filter(response.data.events, function (event) {
                            return fulldayEventsIds.indexOf(parseInt(event.label_id)) > -1;
                        });
                    }

                    vm.intakeInfo.importantDates = filteredEvents;
                    vm.display.importantDates = true;
                }, function (error) {
                    notificationService.error('Unable to fetch important dates');
                });
        }

        /* close modal pop up*/

        function cancel() {
            $modalInstance.close("cancel");
        }

        function addNewContact(model, prop) {
            var selectedType = {};
            selectedType.type = prop;
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                model[prop] = response;
            });
        }

        ////////////////////////////////////////
        function save(intakeData, closeTaskAndEvent) {
            var name = "";
            if (!intakeData.intakeId) {
                name = angular.isDefined(intakeData.name[0].name) ? intakeData.name[0].name : intakeData.name[0].name;
            } else {
                name = intakeData.intakeName;
            }
            var intake_info = angular.copy(intakeData);
            var setDataForAPICall = intakeListHelper.setData(intake_info, name);
            setDataForAPICall.contactList ? delete setDataForAPICall.contactList : angular.noop();
            if (setDataForAPICall.intakeId) {
                intakeFactory.editIntakeInfo(setDataForAPICall)
                    .then(function (response) {
                        notificationService.success('Intake updated successfully.');
                        $modalInstance.close();
                        if (closeTaskAndEvent) {
                            intakeFactory.saveStatusForIntake(vm.intakeId);
                        }
                        $location.path("/intake/intake-overview/" + setDataForAPICall.intakeId);

                    });
            } else {
                intakeFactory.addIntakeInfo(setDataForAPICall)
                    .then(function (response) {
                        vm.intakeId = response;
                        intakeData.intakeId = response;
                        if (closeTaskAndEvent) {
                            intakeFactory.saveStatusForIntake(vm.intakeId);
                        }
                        notificationService.success('Intake added successfully.');
                        savePlaintiff();
                    });
            }

        }


        function savePlaintiff() {
            var allData = [];
            _.forEach(vm.intake_name, function (item, index) {
                allData.push(intakeListHelper.setPlaintiffInfo(item, vm.intakeId, index));
            });

            $q.all(allData.map(function (channel) {
                if (channel.intakePlaintiffId) {
                    return intakeFactory.addPlaintiffInfo(channel, true);
                } else {
                    return intakeFactory.addPlaintiffInfo(channel);
                }
            })).then(function (response) {
                $location.path("/intake/plaintiff/" + vm.intakeId);
                $modalInstance.close();
            });
        }
        //////////////////////////////////////////////
        function setVenues(jurisdictionId) {
            if (utils.isEmptyVal(jurisdictionId)) {
                return;
            }
            if (!vm.initializing) {
                vm.intakeInfo.venueId = null;
            }
            var venues = _.filter(vm.masterData.venues, function (venue) {
                return venue.jurisdiction_id === jurisdictionId;
            });
            vm.venues = _.sortBy(venues, 'name');
        }

    }
})(angular);


(function (angular) {
    angular
        .module('intake.matter')
        .factory('addIntakeHelper', addIntakeHelper);

    function addIntakeHelper() {
        return {
            getClxBtnGroupArray: getClxBtnGroupArray,
            isIdPresentInArray: isIdPresentInArray,
            getDisplayObject: getDisplayObject,
            setMatterInfo: setMatterInfo,
            setMatterInfoForSave: setMatterInfoForSave,
            addLexviaStaff: addLexviaStaff,
            removeUser: removeUser,
            removeCreatedBy: removeCreatedBy
        }

        function addLexviaStaff(staffList, pagemode, role) {
            var isSubscribed = role.lexvia_services;
            if (isSubscribed == 1 && pagemode === 'edit') {
                var lexviaStaff = { uid: '0', name: 'Lexvia' };
                staffList.push(lexviaStaff);
            }
        }

        function getClxBtnGroupArray(array) {
            array = array.map(function (item) {
                return {
                    value: item.id,
                    label: item.name
                };
            });
            var values = _.pluck(array, 'label');
            var index = values.indexOf("");
            //move blank to top
            utils.moveArrayElement(array, index, 0);
            //array[array.length - 1].label = '';
            return array;
        }

        function isIdPresentInArray(id, array) {
            var ids = _.pluck(array, 'id');
            return ids.indexOf(id) > -1;
        }

        function getDisplayObject(pageMode) {
            var display = {};
            if (pageMode === 'edit') {
                display.importantDates = false;
                display.userAssignment = false;
            } else {
                display.importantDates = true;
                display.userAssignment = true;
            }
            display.courtContactDetailMsg = true;
            return display;
        }

        function setMatterInfo(matterData, matterVM) {
            angular.extend(matterVM, matterData);
        }

        function setMatterInfoForSave(info) {
            if (angular.isUndefined(info)) {
                return;
            }
            if (!(angular.isUndefined(info.dateofincidence))) {
                info.dateofincidence = utils.isEmptyVal(info.dateofincidence) ? "" : utils.getUTCTimeStamp(info.dateofincidence);
            }
            if (!(angular.isUndefined(info.date_of_intake))) {
                info.date_of_intake = utils.isEmptyVal(info.date_of_intake) ? "" : utils.getUTCTimeStamp(info.date_of_intake);
            }
            //US#8309 covert ratainer date into timestamp
            if (!(angular.isUndefined(info.retainer_date))) {
                info.retainer_date = utils.isEmptyVal(info.retainer_date) ? "" : utils.getUTCTimeStamp(info.retainer_date);
            }
            info.managing_att_id = angular.isDefined(info.managing_att_id) ? info.managing_att_id.toString() : '';
            info.paralegal = angular.isDefined(info.paralegal) ? info.paralegal.toString() : '';
            info.leadattorny = angular.isDefined(info.leadattorny) ? info.leadattorny.toString() : '';
            info.atterney_id = angular.isDefined(info.atterney_id) ? info.atterney_id.toString() : '';
            info.user_staff_id = angular.isDefined(info.user_staff_id) ? info.user_staff_id.toString() : '';
            //c_opened_date : date on which case in added in system
            info.c_opened_date = utils.getUTCTimeStamp(moment());
            info.referredTo = (utils.isNotEmptyVal(info.referredTo) && utils.isNotEmptyVal(info.referredTo.contactid)) ?
                info.referredTo.contactid.toString() : '';
            info.referredBy = (utils.isNotEmptyVal(info.referredBy) && utils.isNotEmptyVal(info.referredBy.contactid)) ?
                info.referredBy.contactid.toString() : '';

            _setCriticalDates(info);
        }

        function _setCriticalDates(info) {
            _.forEach(info.importantDates, function (date, i) {
                _setUTCDate(info, i);
            });
        }

        function _setUTCDate(info, i) {
            var date = info.importantDates[i];
            var impDates = angular.copy(info.importantDates[i]);
            var startTimestamp = utils.isEmptyVal(date.start) ? date.utcstart : date.start;
            var date = moment.unix(startTimestamp).format('MM DD YYYY');
            date = moment(date, 'MM DD YYYY');
            date = new Date(date.toDate());

            //Bug#11236
            var endTimeStamp = utils.isEmptyVal(impDates.end) ? impDates.utcend : impDates.end;
            var endDateTime = moment.unix(endTimeStamp).format('MM DD YYYY');
            endDateTime = moment(endDateTime, 'MM DD YYYY');
            endDateTime = new Date(endDateTime.toDate());

            var startDate = date;
            var endDate = new Date(Date.UTC(endDateTime.getFullYear(), endDateTime.getMonth(), endDateTime.getDate(), 23, 59, 59, 0));

            //info.importantDates[i].start = moment(startDate.getTime()).unix();
            //info.importantDates[i].enddate = moment(endDate.getTime()).unix();
            info.importantDates[i].start = info.importantDates[i].utcstart;
            if (info.importantDates[i].reminder_days) {
                if (info.importantDates[i].reminder_days) {
                    if (_.isArray(info.importantDates[i].reminder_days)) {
                        info.importantDates[i].reminder_days = info.importantDates[i].reminder_days.toString();
                    }

                } else {
                    info.importantDates[i].reminder_days = "";
                }
            } else {
                if (info.importantDates[i].reminderdays) {
                    if (_.isArray(info.importantDates[i].reminderdays)) {
                        info.importantDates[i].reminderdays = info.importantDates[i].reminderdays.toString();
                    }

                } else {
                    info.importantDates[i].reminderdays = "";
                }
            }

            return date;
        }

        function removeUser(users, loggedInUserId) {
            var uids = _.pluck(users, 'userId');
            var loggedInUserIdIndex = uids.indexOf(loggedInUserId);

            if (loggedInUserIdIndex > -1) {
                users.splice(loggedInUserIdIndex, 1);
            }

            return users;
        }

        function removeCreatedBy(partners, createdBy) {
            //filter out partner whoes id is not equal to created by
            var filteredPartners = _.filter(partners, function (partner) {
                return partner.uid !== createdBy;
            });
            return filteredPartners.length === 0 ? {} : filteredPartners[0];
        }
    }

})(angular);
