(function (angular) {
    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('AddMatterCtrl', AddMatterCtrl);

    AddMatterCtrl.$inject = ['matterFactory', 'addMatterHelper', 'contactFactory',
        'masterData', 'notification-service', 'globalConstants', '$modal', '$modalInstance', 'modalParams', 'practiceAndBillingDataLayer', '$q'
    ];

    function AddMatterCtrl(matterFactory, addMatterHelper, contactFactory,
        masterDataService, notificationService, globalConstants, $modal, $modalInstance, modalParams, practiceAndBillingDataLayer, $q) {
        //variable declarations
        var vm = this,
            //$stateParams = {},
            //$stateParams.matterId = modalParams.matterId,
            masterData = masterDataService.getMasterData(),
            matterId = modalParams.matterId,
            role = masterDataService.getUserRole(),
            initializing = true,
            userPermission = masterData.user_permission[0].permissions,
            pageMode = angular.isDefined(matterId) && utils.isNotEmptyString(matterId) ? 'edit' : 'add';
        vm.test = ['Global', 'Local'];
        //bindable functions
        vm.setVenues = setVenues;
        vm.cancel = cancel;
        vm.openCalender = openCalender;
        vm.setCourtContactInfo = setCourtContactInfo;
        vm.getCourtContactList = getCourtContactList;
        vm.getSubstatus = getSubstatus;
        vm.getMatterSubtype = getMatterSubtype;
        vm.typeChanged = typeChanged;
        vm.save = save;
        vm.getContacts = getContacts;
        vm.formatTypeaheadDisplay = contactFactory.formatTypeaheadDisplay;
        vm.addNewContact = addNewContact;
        vm.addNewCourtContact = addNewCourtContact;
        vm.maxdate = globalConstants.maxDateforAddMatter;
        vm.isDatesValid = isDatesValid;
        vm.getSubscribedInfo = getSubscribedInfo;
        //US# 4713 disable save button
        var gracePeriodDetails = masterDataService.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.isCustomFileNumber = 0;
        vm.userId = gracePeriodDetails.uid;
        vm.showCourt = false;
        vm.groupCoutcontact = groupCoutcontact;
        // vm.checkRegEx = checkRegEx; //US#7264
        vm.JavaFilterAPIForContactList = true;

        //init
        (function () {
            vm.matterInfo = {
                importantdates: []
                // isAddAccess:criticalDatesPermission
            };
            vm.display = addMatterHelper.getDisplayObject(pageMode);
            setDataFromMasterList();
            vm.venues = [];
            var courtPromise = getCourtDetails();
            var userPromise = getUsersList();
            var matterLimitPromise = getAllmatterLimits();
            var subscriptionPromise = getSubscribedInfo();
            $q.all([courtPromise, userPromise, matterLimitPromise, subscriptionPromise]).then(function (values) {
                if (pageMode === 'edit') {
                    var breadcrum = [{ name: '...' }, { name: 'Edit Matter' }];
                    vm.mode = 'edit';
                    vm.pageTitle = "Edit Matter";
                    getMatterDataForEdit(matterId);
                } else {
                    vm.mode = 'add';
                    vm.pageTitle = "Add Matter";
                    matterFactory.saveMatterId(undefined);
                    //set blank status by default
                    vm.matterInfo.matter_status_id = _.find(vm.statuses, function (status) { return status.value == "1" }).value; //Bydefault status should be 'New Case'
                    getSubstatus(vm.matterInfo.matter_status_id);
                    //set blank type by default
                    vm.matterInfo.matter_type_id = _.find(vm.matterTypes, function (status) { return status.label === "" }).value;
                    getMatterSubtype(vm.matterInfo.matter_type_id);
                    vm.matterInfo.matter_category_id = vm.matterInfo.matter_category_id ? vm.matterInfo.matter_category_id : getBlankId(vm.categoryList);
                    vm.matterInfo.law_type_id = vm.matterInfo.law_type_id ? vm.matterInfo.law_type_id : getBlankId(vm.lawTypeList);
                    var defaultJurisdiction = utils.isNotEmptyVal(localStorage.getItem('firmJurisdiction')) ? JSON.parse(localStorage.getItem('firmJurisdiction')) : '';
                    vm.matterInfo.jurisdiction_id = utils.isNotEmptyVal(defaultJurisdiction) ? defaultJurisdiction.id : '';
                    setVenues(vm.matterInfo.jurisdiction_id);
                    initializing = false;
                    //US#6148-by default both checkboxes matters assigned to SMP and Created user are checked.
                    vm.matterInfo.smp_assigned = '1';
                    vm.matterInfo.creater_assigned = '1';
                }
            });
        })();
        //US#7264 : function to validate non ascii characters
        // function checkRegEx(pattern){
        //    vm.checkSummary = /^[\000-\177,\240-\240]*$/.test(pattern);
        // }

        function groupCoutcontact(party) {
            if (utils.isNotEmptyVal(party.contactid)) {
                _.forEach(vm.test, function (contactType) {
                    if (contactType == party.contact_type) {
                        vm.groupBy = contactType;
                    }
                })
                return vm.groupBy;
            }

        }

        //US#5341 hide custom file number on subsciption Data
        function getSubscribedInfo() {
            var defer = $q.defer();

            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    vm.isCustomFileNumber = data.matter_apps.file_number;
                }
                defer.resolve();
            });
            return defer.promise;
        }

        function getAllmatterLimits() {
            var defer = $q.defer();
            var promesa = matterFactory.getMatterCount("all", 1);
            promesa.then(function (res) {
                var data = res.data;
                vm.usedMatters = (utils.isNotEmptyVal(data.active_all_case_count)) ? parseInt(data.active_all_case_count) : 0;
                vm.maxMatter = (utils.isNotEmptyVal(data.max_cases_count)) ? parseInt(data.max_cases_count) : 0;
                vm.hostingCapacity = vm.maxMatter == 0 ? "0" : (Math.floor(vm.usedMatters * 100 / vm.maxMatter));
                vm.graphColor = (vm.hostingCapacity <= 50) ? "#008000" : (vm.hostingCapacity <= 75) ? '#F4A460' : "#d9534f";
                defer.resolve();
            }, function (error) {
                notificationService.error('Matter limits not loaded');
                defer.resolve();
            });
            return defer.promise;
        }

        function isDatesValid() {
            if ($('#incidentDateError').css("display") == "block" || $('#intakeDateError').css("display") == "block" || $('#retainerDateError').css("display") == "block" || vm.matterInfo.file_number == "") {
                return true;
            } else {
                return false;
            }
        }

        function setDataFromMasterList() {
            vm.jurisdictionList = masterData.jurisdictions;
            vm.categoryList = masterData.category;
            vm.lawTypeList = masterData['law-types'];

            //clx-btn-group directive requires list to list <{label:'',value: ''}>
            //therefore conversion is done
            vm.statuses = addMatterHelper.getClxBtnGroupArray(masterData.statuses);
            vm.matterTypes = addMatterHelper.getClxBtnGroupArray(masterData.type);
        }

        function getCourtDetails() {
            var defer = $q.defer();
            contactFactory.getCourtList()
                .then(function (data) {
                    vm.courtList = data;
                    defer.resolve();
                }, function (reason) {
                    defer.resolve();
                });
            return defer.promise;
        }


        function getUsersList() {
            var defer = $q.defer();
            contactFactory.getUsersList().then(function (response) {
                var staffList = response[4].staffonly; // staff is on 0th position
                addMatterHelper.addLexviaStaff(staffList, pageMode, role);
                vm.staffList = contactFactory.getUniqueContacts(staffList);
                vm.paralegal = contactFactory.getUniqueContacts(response[3].paralegal);
                vm.attorneyList = response[1] ? contactFactory.getUniqueContacts(response[1].attorny) : [];
                vm.leadAttorneyList = response[1] ? contactFactory.getUniqueContacts(response[1].attorny) : [];
                /*
                Removing the condition to detach the logged in partner from Partners list
                // var partners = response[2] ? addMatterHelper.removeUser(response[2].partner, role.uid) : [];
                // partners = contactFactory.getUniqueContacts(partners);
                // vm.partner = partners;
                */
                vm.partner = response[2] ? contactFactory.getUniqueContacts(response[2].partner) : [];
                defer.resolve();
            }, function (reason) {
                defer.resolve();
            });
            return defer.promise;
        }



        function getMatterDataForEdit(matterId) {
            //we are populating same object 'matterInfo' using different ajax calls
            //therefore we are populating it synchronously
            getMatterInfo(matterId);
        }

        function getMatterInfo(matterId) {
            matterFactory.getMatterOverview(matterId)
                .then(function (response) {
                    var matterInfo = response.data.matter_info[0];
                    setVenues(matterInfo.jurisdiction_id);
                    matterInfo.date_of_intake = matterInfo.intake_date_utc;
                    if (utils.isNotEmptyVal(matterInfo.date_of_intake)) {
                        matterInfo.date_of_intake = moment.unix(matterInfo.date_of_intake).utc().format('MM/DD/YYYY');
                    }
                    matterInfo.dateofincidence = (matterInfo.dateofincidence == "0") ? "" : matterInfo.dateofincidence
                    if (utils.isNotEmptyVal(matterInfo.dateofincidence)) {
                        matterInfo.dateofincidence = moment.unix(matterInfo.dateofincidence).utc().format('MM/DD/YYYY');
                    }
                    //US#8309 set retainer date
                    matterInfo.retainer_date = matterInfo.retainer_date;
                    if (utils.isNotEmptyVal(matterInfo.retainer_date)) {
                        matterInfo.retainer_date = matterInfo.retainer_date == 0 ? '' : moment.unix(matterInfo.retainer_date).utc().format('MM/DD/YYYY');
                    }
                    getSubstatus(matterInfo.matter_status_id, matterInfo.sub_status_id);
                    getMatterSubtype(matterInfo.matter_type_id, matterInfo.matter_sub_type_id);
                    getCourtContactList(matterInfo.court_id, matterInfo.court_contact_id); //get court contact list
                    addMatterHelper.setMatterInfo(matterInfo, vm.matterInfo);
                    getImportantDates(matterId);
                    vm.display.courtContactDetailMsg = utils.isNotEmptyVal(matterInfo.court_id);

                    vm.matterInfo.referred_to = utils.isNotEmptyVal(matterInfo.referred_to) ?
                        matterInfo.referred_to_data : undefined;
                    vm.matterInfo.referred_by = utils.isNotEmptyVal(matterInfo.referred_by) ?
                        matterInfo.referred_by_data : undefined;
                    initializing = false;
                    //US#6148-User Assignment for matter created user
                    vm.matterInfo.smp_assigned = utils.isNotEmptyVal(matterInfo.smp_assigned) ?
                        matterInfo.smp_assigned.toString() : '1';
                    vm.matterInfo.creater_assigned = utils.isNotEmptyVal(matterInfo.creater_assigned) ?
                        matterInfo.creater_assigned.toString() : '1';
                    vm.matterCreater = matterInfo.created_by;
                }, function (error) {
                    notificationService.error('Unable to fetch matter info');
                });
        }

        function getImportantDates(matterId) {
            matterFactory.getImportantDates(matterId)
                .then(function (response) {
                    vm.matterInfo.importantdates = response.data.data;
                    matterFactory.saveMatterId(vm.matterInfo.matter_id);
                    _.forEach(vm.matterInfo.importantdates, function (event, index) {
                        var array = [];
                        _.forEach(event.shared_with, function (obj) {
                            array.push(obj.plaintiffid);
                        });
                        event.share_with = array;
                        delete event.shared_with;
                    });


                    vm.display.importantDates = true;
                    getUserAssignment(matterId);
                }, function (error) {
                    notificationService.error('Unable to fetch important dates');
                });
        }


        function getUserAssignment(matterId) {
            matterFactory.getUserAssignment(matterId)
                .then(function (response) {
                    var userAssignments = response.data;
                    vm.matterInfo.user_staff_id = _.unique(_.pluck(userAssignments.staffs, 'uid')); //assign staffs
                    vm.matterInfo.paralegal = _.unique(_.pluck(userAssignments.paralegal, 'uid')); //assign paraleagel
                    //get lead attorney, obj who's islead === true
                    var leadAttorney = _.where(userAssignments.attorney, { islead: 1 });
                    vm.matterInfo.leadattorny = _.unique(_.pluck(leadAttorney, 'uid'));
                    //get lead attorney, obj who's islead === false
                    var attorney = _.where(userAssignments.attorney, { islead: 0 });
                    vm.matterInfo.atterney_id = _.unique(_.pluck(attorney, 'uid'));
                    vm.matterInfo.managing_att_id = _.unique(_.pluck(userAssignments.partner, 'uid'));
                    //get lead attorney, obj who's islead == 2
                    var common_attorney = _.where(userAssignments.attorney, { islead: 2 });
                    common_attorney = _.unique(_.pluck(common_attorney, 'uid'));
                    vm.matterInfo.leadattorny = vm.matterInfo.leadattorny.concat(common_attorney);
                    vm.matterInfo.atterney_id = vm.matterInfo.atterney_id.concat(common_attorney);
                    //    vm.matterInfo.managing_att_id = angular.isDefined(userAssignments.partner) ?
                    //        addMatterHelper.removeCreatedBy(userAssignments.partner, vm.matterInfo.created_by).uid : '';

                    vm.display.userAssignment = true;

                    ////////////////
                    vm.matterInfo.managing_att_id.slice(0).forEach(function (item, itemIndex) {
                        if (_.indexOf(_.pluck(vm.partner, 'uid'), item) == -1) {
                            vm.matterInfo.managing_att_id.splice(vm.matterInfo.managing_att_id.indexOf(item), 1);
                        }
                    });
                    vm.matterInfo.leadattorny.slice(0).forEach(function (item, itemIndex) {
                        if (_.indexOf(_.pluck(vm.leadAttorneyList, 'uid'), item) == -1) {
                            vm.matterInfo.leadattorny.splice(vm.matterInfo.leadattorny.indexOf(item), 1);
                        }
                    });
                    vm.matterInfo.atterney_id.slice(0).forEach(function (item, itemIndex) {
                        if (_.indexOf(_.pluck(vm.attorneyList, 'uid'), item) == -1) {

                            vm.matterInfo.atterney_id.splice(vm.matterInfo.atterney_id.indexOf(item), 1);
                        }
                    });
                    vm.matterInfo.paralegal.slice(0).forEach(function (item, itemIndex) {
                        if (_.indexOf(_.pluck(vm.paralegal, 'uid'), item) == -1) {
                            vm.matterInfo.paralegal.splice(vm.matterInfo.paralegal.indexOf(item), 1);
                        }
                    });
                    vm.matterInfo.user_staff_id.slice(0).forEach(function (item, itemIndex) {
                        if (_.indexOf(_.pluck(vm.staffList, 'uid'), item) == -1) {
                            vm.matterInfo.user_staff_id.splice(vm.matterInfo.user_staff_id.indexOf(item), 1);
                        }
                    });
                    ////////////////////
                }, function (error) {
                    notificationService.error('Unable to fetch user assignments');
                });
        }

        //bindable function's implementation
        function setVenues(jurisdictionId) {
            if (utils.isEmptyVal(jurisdictionId)) {
                return;
            }

            if (!initializing) {
                vm.matterInfo.court_id = null;
                vm.matterInfo.court_contact_id = null;
                vm.courtContactList = [];
                vm.courtDetailInfo = null;
                vm.display.courtContactDetailMsg = false;
            }

            var venues = _.filter(masterData.venues, function (venue) {
                return venue.jurisdiction_id === jurisdictionId;
            });
            vm.venues = _.sortBy(venues, 'name');
            vm.showCourt = false;
        }

        /* close modal pop up*/

        function cancel() {
            $modalInstance.close();
        }

        function openCalender($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }

        function setCourtContactInfo(courtDetail, courtContactList, courtContactId) {
            vm.courtDetailInfo = _.find(courtContactList, function (courtContact) {
                return courtContact.contactid == courtContactId;
            });


        }


        //if contact id is not defined clear the contact id value from the view model
        function getCourtContactList(venueId, courtContactId) {
            vm.courtContactList = [];
            vm.showCourt = (utils.isNotEmptyVal(venueId) && venueId != 0) ? true : false;

            if (!initializing) {
                vm.matterInfo.court_contact_id = null;
            }

            if (utils.isEmptyVal(courtContactId)) {
                vm.matterInfo.court_contact_id = null;
                vm.courtDetailInfo = {};
            }

            vm.display.courtContactDetailMsg = false;
            if (utils.isNotEmptyVal(venueId)) {
                var queryObj = {
                    "type": ["Court"],
                    "venue_id": utils.isNotEmptyVal(venueId) ? venueId : ''
                }
                contactFactory.getCourtContactListAddMatt(queryObj).then(function (response) {
                    vm.display.courtContactDetailMsg = utils.isNotEmptyVal(vm.matterInfo.court_id);
                    vm.courtContactList = response.data.data;
                    contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(vm.courtContactList);

                    //set court contact details if court_contact_id is defined(edit mode)
                    if (angular.isDefined(courtContactId)) {
                        setCourtContactInfo(courtContactId, vm.courtContactList, courtContactId);
                        vm.matterInfo.court_contact_id = utils.isNotEmptyVal(vm.courtDetailInfo) ? vm.courtDetailInfo : '';
                    }

                    vm.matterInfo.court_id = vm.matterInfo.court_id == '0' ? '' : vm.matterInfo.court_id;

                }, function (reason) {

                });
            }
        }

        function getSubstatus(statusId, subStatusID) {
            //check statusId 0 or empty if yes set to blank
            statusId = (statusId == 0 || utils.isEmptyVal(statusId)) ? _.find(vm.statuses, function (status) { return status.label === "" }).value : statusId;
            var status = _.find(masterData.statuses, function (status) {
                return status.id === statusId;
            });
            var subStatuses = angular.isDefined(status) ? (status['sub-status'] || []) : [];
            //if the selected id is not present in the array deselect the selected value
            vm.matterInfo.sub_status_id = addMatterHelper.isIdPresentInArray(subStatusID, subStatuses) ? subStatusID : getBlankId(subStatuses);
            vm.subStatus = _.forEach(subStatuses, function (arr) {
                arr.name = arr.name == "{Blank}" ? "" : arr.name;
                return arr;
            });
        }





        function getMatterSubtype(typeId, subTypeID) {
            var type = _.find(masterData.type, function (typ) {
                return typ.id === typeId;
            });
            var subTypes = angular.isDefined(type) ? (type['sub-type'] || []) : [];
            //if the selected id is not present in the array deselect the selected value
            vm.matterInfo.matter_sub_type_id = addMatterHelper.isIdPresentInArray(subTypeID, subTypes) ? subTypeID : getBlankId(subTypes);
            vm.subType = _.forEach(subTypes, function (arr) {
                arr.name = arr.name == "{Blank}" ? "" : arr.name;
                return arr;
            });
        }

        function typeChanged(typeId) {
            var type = _.find(masterData.type, function (typ) {
                return typ.id === typeId;
            });
            if (type && type.name == "SSD") {
                // if type is SSD then set status as SSD
                var status = _.find(masterData.statuses, function (status) {
                    return status.name === "SSD";
                });

                if (status) {
                    if (vm.matterInfo.matter_status_id == status.id) {

                    } else {
                        vm.matterInfo.matter_status_id = status.id ? status.id : null;
                        getSubstatus(vm.matterInfo.matter_status_id);
                    }
                }
            }
        }

        function getBlankId(inputArray) {
            var substatus = _.find(inputArray, function (arr) {
                arr.name == "{Blank}" ? arr.name = " " : arr.name;
                return utils.isEmptyVal(arr.name);
            });

            return substatus.id;
        }

        function save(matterInfo) {
            //Refered by and Refered to US#6288
            if (utils.isEmptyVal(matterInfo.referred_by) || utils.isNotEmptyVal(matterInfo.referred_by.contactid)) {
                matterInfo.referred_by;
            } else {
                notificationService.error("Invalid refer by");
                return;
            }
            if (utils.isEmptyVal(matterInfo.referred_to) || utils.isNotEmptyVal(matterInfo.referred_to.contactid)) {
                matterInfo.referred_to;
            } else {
                notificationService.error("Invalid refer to");
                return;
            }


            var info = angular.copy(matterInfo);
            info.court_contact_type = utils.isNotEmptyVal(matterInfo.court_contact_id) ? matterInfo.court_contact_id.contact_type : '';
            info.court_contact_id = utils.isNotEmptyVal(info.court_contact_id) ? info.court_contact_id.contactid : '';
            //US#8967 intake should not be greater than created date
            // if (utils.isNotEmptyVal(info.date_of_intake)) {
            //     var createdDate = moment(moment.unix(info.created_date)).utc()
            //     var intakeDate = info.date_of_intake;
            //     if (createdDate.isBefore(intakeDate)) {
            //         notificationService.error("Intake Date should be less than Created Date");
            //         return;
            //     }
            // }
            // leadAttorney and attorney validation
            // var uniqueAttorney = (utils.isNotEmptyVal(matterInfo.atterney_id)) ? (utils.isNotEmptyVal(matterInfo.leadattorny)) ? matterInfo.atterney_id.filter(function (val) {
            //     return matterInfo.leadattorny.indexOf(val) != -1;
            // }) : "" : "";
            // if (uniqueAttorney.length > 0) {
            //     notificationService.error("Lead Attorney and Attorney can not be same");
            // } else {
            //server requires comma separated list of ids therefore array<ids> converted to string
            addMatterHelper.setMatterInfoForSave(info);
            switch (pageMode) {
                case 'add':
                    addMatterInfo(info);
                    break;
                case 'edit':
                    editMatterInfo(info);
                    break;
            }
            // }
        }

        function addMatterInfo(info) {
            info.contactList ? delete info.contactList : angular.noop();
            matterFactory.addMatter(info)
                .then(function (response) {
                    notificationService.success("matter saved successfully");
                    /* close modal pop up after save*/
                    var obj = {};
                    obj.matterId = response[0].matter_id;
                    obj.mode = 'add';
                    $modalInstance.close(obj);
                }, function (reason) {
                    if (reason.status == 406) {
                        notificationService.error(reason.statusText)
                    }
                    //validation for non-ascii characters
                    // (reason.status == 422) ? notificationService.error("Invalid characters in Matter " + reason.data[0]) : notificationService.error(reason.statusText);
                });
        }

        function editMatterInfo(info) {

            if (info.matter_status_id === '8') {
                var matterObj = matterId;
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
                    updateMatter(info, matterId, true);
                }, function (error) {
                    updateMatter(info, matterId, false);
                });
            } else {
                updateMatter(info, matterId, false);
            }
        };

        function updateMatter(info, matterId, closeTaskAndEvent) {
            if (utils.isEmptyVal(info.dateofincidence)) {
                delete info.dateofincidence;
            }
            info.contactList ? delete info.contactList : angular.noop();
            matterFactory.editMatter(info, matterId)
                .then(function (response) {
                    notificationService.success("matter edited successfully");
                    matterFactory.setMatterData({});
                    if (closeTaskAndEvent) {
                        matterFactory.closeEventTask_JAVA(matterId);
                    }
                    var obj = {};
                    obj.matterId = matterId;
                    obj.mode = 'edit';
                    /* close modal pop up after save*/
                    $modalInstance.close(obj);
                }, function (reason) {
                    if (reason.status == 406) {
                        notificationService.error(reason.statusText)
                    }
                    //validation for non-ascii characters
                    //(reason.status == 422) ? notificationService.error("Invalid characters in Matter " + reason.data[0]) : notificationService.error(reason.statusText);
                });
        };

        function formatTypeaheadDisplay(contact) {
            if (angular.isUndefined(contact) || utils.isEmptyString(contact)) {
                return undefined;
            }
            //if name prop is not present concat firstname and lastname
            //return (contact.name || (contact.firstname + " " + contact.lastname));
            var firstname = angular.isUndefined(contact.firstname) ? '' : contact.firstname;
            var lastname = angular.isUndefined(contact.lastname) ? '' : contact.lastname;
            return (contact.name || (firstname + " " + lastname));

        }

        function addNewContact(model, prop) {
            var selectedType = {};
            selectedType.type = prop;
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                response['firstname'] = response.first_name;
                response['lastname'] = response.last_name;
                response['contactid'] = (response.contact_id).toString();
                model[prop] = response;

            });
        }

        function getContacts(contactName, searchItem) {
            var postObj = {};
            postObj.type = searchItem == 'refTo' ? globalConstants.refferedToTypeList : globalConstants.refferedByTypeList;
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            //postObj = matterFactory.setContactType(postObj);
            postObj.page_Size = 250

            return matterFactory.getContactsByName(postObj, vm.JavaFilterAPIForContactList)
                .then(function (response) {
                    var data = response.data;
                    // data = getGroupBy(data,contactName);
                    matterFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
                    matterFactory.setNamePropForContactsOffDrupal(data);
                    // matterFactory.setNamePropForContacts(data);
                    _.forEach(data, function (contact) {
                        contact.name = utils.removeunwantedHTML(contact.first_name) + ' ' + utils.removeunwantedHTML(contact.last_name);
                    });
                    return data;
                });
        }

        // add new contact
        function addNewCourtContact(model, venue, type) {
            var selectedType = {};
            selectedType.venue = venue;
            selectedType.type = type;
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                response['firstname'] = response.first_name;
                response['lastname'] = response.last_name;
                response['contactid'] = (response.contact_id).toString();
                vm.matterInfo[model] = response;
                var venueId = JSON.parse(vm.matterInfo[model].court_venue);
                getCourtContactList(venueId, vm.matterInfo[model].contactid);
                console.log("saved ");
            }, function () {
                console.log("closed");
            });
        }

    }
})(angular);


(function (angular) {
    angular
        .module('cloudlex.matter')
        .factory('addMatterHelper', addMatterHelper);

    function addMatterHelper() {
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
            info.referred_to = (utils.isNotEmptyVal(info.referred_to) && utils.isNotEmptyVal(info.referred_to.contactid)) ?
                info.referred_to.contactid.toString() : '';
            info.referred_by = (utils.isNotEmptyVal(info.referred_by) && utils.isNotEmptyVal(info.referred_by.contactid)) ?
                info.referred_by.contactid.toString() : '';

            _setCriticalDates(info);
        }

        function _setCriticalDates(info) {
            _.forEach(info.importantdates, function (date, i) {
                _setUTCDate(info, i);
            });
        }

        function _setUTCDate(info, i) {
            var date = info.importantdates[i];
            var impDates = angular.copy(info.importantdates[i]);
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

            //info.importantdates[i].start = moment(startDate.getTime()).unix();
            //info.importantdates[i].enddate = moment(endDate.getTime()).unix();
            info.importantdates[i].start = info.importantdates[i].utcstart;

            if (info.importantdates[i].reminderdays) {
                if (_.isArray(info.importantdates[i].reminderdays)) {
                    info.importantdates[i].reminderdays = info.importantdates[i].reminderdays.toString();
                }

            } else {
                info.importantdates[i].reminderdays = "";
            }
            return date;
        }

        function removeUser(users, loggedInUserId) {
            var uids = _.pluck(users, 'uid');
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
