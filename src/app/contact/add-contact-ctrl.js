(function () {
    'use strict';

    angular.module('cloudlex.contact')
        .controller('ContactCtrl', ContactCtrl)

    ContactCtrl.$inject = ['$modalInstance', 'masterData', 'contactFactory', 'SelectedType', 'notification-service', 'globalConstants', '$scope', '$http'];

    function ContactCtrl($modalInstance, masterData, contactFactory, SelectedType, notificationService, globalConstants, $scope, $http) {
        var vm = this;
        vm.contact = {
            fax_number: [{
                id: 'fax1'
            }],
            address: [{
                id: 'address1',
                stateshow: true
            }]
        };
        var contact = contactFactory.getContact();
        var masterDataProvider = masterData;
        var masterData = masterData.getMasterData();
        var selectedtype;

        // vm.stateshow = true;
        vm.showName = true;
        vm.showVenue = false;
        vm.showcheckname = false;
        vm.isOpen = false;
        vm.showMoreLess = true;
        vm.groupjurisdictions = groupjurisdictions;
        vm.jurisdictions = [];
        vm.jurisdictionName = '';
        vm.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;
        vm.duplicateCheckEvent = ['blur', 'addoredit'];
        vm.saveorblurEvent = '';
        vm.alreadychecked = "";
        vm.currentcheck = "";
        vm.validateZipcode = validateZipcode; //US#7859
        vm.showVenueFlag = false;//Added this for Bug#8236
        vm.checkAddress = checkAddress;

        vm.emaillist = [{
            id: 'email1'
        }]; // initialise email
        vm.phonelist = [{
            id: 'phone1',
            extid: 'ext1',
            contactTypeName: 'Cell'
        }]; // initialise phone
        vm.contactTypeName = [{
            type: 'phone_cell',
            name: 'Cell'
        }, {
            type: 'phone_home',
            name: 'Home'
        },
        {
            type: 'phone_work',
            name: 'Work'
        }];
        vm.addressTypeName = [{
            id: 'Home',
            name: 'Home'
        }, {
            id: 'Work',
            name: 'Work'
        },
        {
            id: 'Other',
            name: 'Other'
        }];
        vm.title = [{ id: 0, value: "{Blank}" }];
        _.forEach(masterData.matter_contact_salutations, function (item) {
            vm.title.push(item);
        });


        (function () {
            initialisevalue();
        })();

        function checkIfEnterKeyWasPressed(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
            return true;

        };

        function setContactTypes() {
            switch (SelectedType.type) {
                case "PLAINTIFF":
                    vm.contactType = globalConstants.plaintiffTypeList;
                    vm.contact.type = "Client";
                    break;
                case "ESTATE_ADMIN":
                    vm.contactType = globalConstants.estateAdminTypeList;
                    break;
                case "GUARDIAN":
                    vm.contactType = globalConstants.gaurdianTypeList;
                    break;
                case "SCHOOL":
                    vm.contactType = globalConstants.schoolTypeList;
                    break;
                case "EMPLOYEE":
                    vm.contactType = globalConstants.employeeTypeList;
                    break;

                case "Court":
                    vm.contactType = globalConstants.courtTypeList;
                    break;

                case "defendent":
                    vm.contactType = globalConstants.defendentTypeList;
                    break;
                case "otherparty":
                    vm.contactType = globalConstants.ALLTypeListDetails;
                    break;
                case "physicianid":
                case "physician":
                    vm.contactType = globalConstants.mattDetailsMedicalInfo;
                    break;

                case "providerid":
                case "medical_provider":
                    vm.contactType = globalConstants.mattDetailsMedicalInfo;
                    break;

                case "medicalBillsproviderid":
                    vm.contactType = globalConstants.mattDetailsMedicalBills;
                    break;

                case "insured_party":
                case "insuredpartyid":
                    vm.contactType = globalConstants.mattDetailsInsurance;
                    break;
                case "insuranceproviderid":
                case "insurance_provider":
                    vm.contactType = globalConstants.mattDetailsInsurance;
                    break;
                case "insurance_adjuster":
                case "adjusterid":
                    vm.contactType = globalConstants.mattDetailsInsurance;
                    break;

                case "lien_adjuster":
                case "linesadjusterid":
                    vm.contactType = globalConstants.docLinesTypeList;
                    break;

                case "lien_holder":
                case "linesholdername":
                    vm.contactType = globalConstants.docLinesTypeList;
                    break;

                case "liensinsuranceproviderid":
                    vm.contactType = globalConstants.docLinesTypeList;
                    break;

                //    document medical info           
                case "docproviddmediinfo":
                    vm.contactType = globalConstants.docMedicalInfoTypeList;
                    break;
                case "docmediinfophysicianid":
                    vm.contactType = globalConstants.docMedicalInfoTypeList;
                    break; //stops

                // docuemnt medical bills 
                case "mbillsproviderid":
                    vm.contactType = globalConstants.docMedicalBillsList;
                    break;


                //docuemnt insuarance 
                case "docinsuinsuredpartyid":
                    vm.contactType = globalConstants.docinsuProviderTypeList;
                    break;

                case "docinsuranceproviderid":
                    vm.contactType = globalConstants.docinsuProviderTypeList;
                    break;

                case "docinsuadjusterid":
                    vm.contactType = globalConstants.docinsuProviderTypeList;
                    break; //end

                //docuemnt lines 
                case "doclineTypes":
                    vm.contactType = globalConstants.docLinesTypeList;
                    break;
                //end

                case "docmotion":
                    vm.contactType = globalConstants.docmotionsTypeList;
                    break;
                case "referred_by":
                    vm.contactType = globalConstants.refferedByTypeList;
                    break;
                case "referred_to":
                    vm.contactType = globalConstants.refferedToTypeList;
                    break;
                case "settPayeePayer":
                    vm.contactType = globalConstants.settlementTyps;
                    break;
                case "allTypeListWithoutCourt":
                    vm.contactType = globalConstants.allTypeListWithoutCourt;
                    break;
                case "all":
                    vm.contact.type = "Lead";
                    break;
                case "all_notes":
                    vm.contact.type = '';
                    break;
            }
        }

        function setVenues() {
            var venue = _.filter(vm.venuelist, function (venu) {
                return venu.id === SelectedType.venue;
            });
            vm.venuelist = venue;

        }

        function initialisevalue() {
            //  console.log("SelectedType"+SelectedType);
            if (contact.type == 'Medical Provider' || contact.type == 'Doctor') {
                vm.showSpecialty = true;
            } else {
                vm.showSpecialty = false;
            }
            vm.contactType = [];
            _.forEach(masterData.contact_type, function (item, key) {

                vm.contactType.push(item);
            });

            // vm.contactType = getArray(masterData.contact_type);

            // // Move Doctor below Medical Provider
            // var doctorIndex = _.indexOf(vm.contactType, "Doctor");
            // var medicalProviderIndex = -1;
            // if (doctorIndex > -1) {
            //     // remove doctor
            //     vm.contactType.splice(doctorIndex, 1);
            //     medicalProviderIndex = _.indexOf(vm.contactType, "Medical Provider");
            //     if (medicalProviderIndex > -1) {
            //         vm.contactType.splice((medicalProviderIndex + 1), 0, 'Doctor');
            //     }
            // }

            // // Move Client below Person
            // var clientIndex = _.indexOf(vm.contactType, "Client");
            // var personIndex = -1;
            // if (clientIndex > -1) {
            //     // remove doctor
            //     vm.contactType.splice(clientIndex, 1);
            //     personIndex = _.indexOf(vm.contactType, "Person");
            //     if (personIndex > -1) {
            //         vm.contactType.splice((personIndex + 1), 0, 'Client');
            //     }
            // }

            utils.isEmptyObj(SelectedType) ? vm.contactType : setContactTypes();
            vm.countries = getArrayByName(masterData.contries);
            vm.states = getArrayByName(masterData.states);
            vm.venues = getArrayByName(masterData.venues);
            vm.venuelist = masterData.venues;
            (utils.isEmptyObj(SelectedType) || (SelectedType.type != 'Court')) ? vm.venues : setVenues();

            if (_.isNull(contact) || utils.isEmptyObj(contact)) {
                vm.contact.address = [{
                    id: 'address1',
                    country: 'United States',
                    checked: false,
                    is_primary: 0,
                    stateshow: true
                }];

                if (vm.contact.type == 'Person' || vm.contact.type == 'Client' || vm.contact.type == 'Lead' || vm.contact.type == 'Estate Administrator' || vm.contact.type == 'Estate Executor') {
                    vm.contact.address[0].address_type = vm.addressTypeName[0].name;
                } else if (vm.contact.type == 'Court' || vm.contact.type == 'Doctor' || vm.contact.type == 'Educational Institution' || vm.contact.type == 'Business' || vm.contact.type == 'Government' || vm.contact.type == 'Insurance Company' || vm.contact.type == 'Law Firm' || vm.contact.type == 'Medical Provider' || vm.contact.type == 'Other') {
                    vm.contact.address[0].address_type = vm.addressTypeName[1].name;
                } else {
                    vm.contact.address[0].address_type = vm.addressTypeName[2].name;
                }

                vm.mode = 'Add';
            } else {
                vm.mode = 'Edit';
                vm.contact = angular.copy(contact); // Set values during edit
                //US#12913 assign address to edit object
                vm.contact.address = [];
                vm.contact.address = angular.copy(contact.address);
                if (vm.contact.address.length > 0) {
                    _.forEach(vm.contact.address, function (item) {
                        if (item.is_primary == 1) {
                            item.checked = true;
                        } else {
                            item.checked = false;
                        }
                    });
                    _.forEach(vm.contact.address, function (data, i) {
                        data.id = 'address' + (parseInt(i) + 1);
                    });
                }


                vm.contact.note = vm.contact.note;
                if (utils.isNotEmptyVal(vm.contact.email_ids)) {
                    vm.emaillist = getFormatteddata(vm.contact.email_ids, 'email');
                }
                if (utils.isNotEmptyVal(vm.contact.phone_cell) || utils.isNotEmptyVal(vm.contact.phone_work) || utils.isNotEmptyVal(vm.contact.phone_home)) {
                    vm.phonelist = getFormatteddata(vm.contact, 'phone');
                } else {

                }
                vm.contact.fax_number = utils.isNotEmptyVal(vm.contact.fax_numbers) ?
                    getFormatteddata(vm.contact.fax_numbers, 'fax') : [{
                        id: 'fax1'
                    }];
                vm.contact.venue = [];
                angular.forEach(masterData.venues, function (v) {
                    _.forEach(vm.contact.court_venue, function (item) {
                        if (v.id == item) {
                            vm.contact.venue.push(v);
                        }
                    });
                });
                vm.contact.middlename = vm.contact.middelname;
                vm.contact.titleid = { "id": vm.contact.title, "value": vm.contact.salutation }; //Bug#6763-Contact Title name not display
                showVenuAndName(vm.contact);
            }
        }

        _.forEach(masterData.jurisdictions, function (jurisdiction) {
            vm.jurisdictions.push(jurisdiction.name);
        })
        vm.jurisdictions = vm.jurisdictions.sort();

        function groupjurisdictions(venue) {
            if (utils.isNotEmptyVal(venue.jurisdiction_id)) {
                _.forEach(masterData.jurisdictions, function (jurisdiction) {
                    if (jurisdiction.id == venue.jurisdiction_id) {
                        vm.jurisdictionName = jurisdiction.name;
                    }
                })
                return vm.jurisdictionName;
            }
        }

        //US#12913 assign value to primary address and toggle checkbox
        function checkAddress(list, checked) {
            list.checked = !list.checked;
            (list.checked) ? list.is_primary = 1 : list.is_primary = 0;
            _.forEach(checked, function (item) {
                if (item.id != list.id) {
                    item.checked = false;
                    item.is_primary = 0
                }
            })
        }

        function getArray(data) {
            var data_array = [];
            angular.forEach(data, function (k, v) { // convert key-val to array for type
                data_array.push(v);

            });
            return data_array;
        }

        function getArrayByName(data) {
            var data_array = [];
            angular.forEach(data, function (k, v) { // convert object to array for type
                data_array.push(k.name);
            });
            return data_array;

        }
        //US#7859
        function validateZipcode(list, index) {
            vm.checkZipcode = /^[\040-\100,\133-\140,\173-\177]*$/.test(list[index].zip_code);
            vm.checkZip = vm.checkZipcode == false ? true : false;
            list[index].checkZip = vm.checkZipcode == false ? true : false;
        }

        function getFormatteddata(Alldata, datatype) { // remove br to show data in edit mode
            //     var data_array = Alldata.phone.split("<br/>");
            var datalist = [];
            var phonetype;

            switch (datatype) {
                case 'phone':


                    var keys = Object.keys(Alldata);

                    if (utils.isNotEmptyVal(Alldata.phone_cell)) {
                        var splittedwithcomma = Alldata.phone_cell.split(","); // split string: 999-999-9999 Ext:1234, 999-999-9999 Ext:1234 > [0]=999-999-9999 Ext:1234 [1]=999-999-9999 Ext:1234 

                        _.forEach(splittedwithcomma, function (commaSeperated, i) { // [0]=999-999-9999 Ext:1234
                            var indexOfE = commaSeperated.indexOf("E");
                            var phoneNumberStr, extentionStr, phoneNumber, extention;
                            if (indexOfE > -1) {
                                phoneNumberStr = (commaSeperated.slice(0, indexOfE - 1)).trim();
                                extentionStr = (commaSeperated.slice(indexOfE - 1)).trim();
                                phoneNumber = utils.isEmptyVal(phoneNumberStr) ? '' : phoneNumberStr;
                                extention = utils.isEmptyVal(extentionStr) ? '' : extentionStr.split(":"); // split string: Ext:1234
                            } else {
                                phoneNumberStr = (commaSeperated.slice(0)).trim();
                                phoneNumber = utils.isEmptyVal(phoneNumberStr) ? '' : phoneNumberStr;
                                extention = '';
                            }
                            datalist.push({
                                id: '' + datatype + (parseInt(i) + 1),
                                name: phoneNumber,
                                extid: 'ext' + (parseInt(i) + 1),
                                ext: extention[1],
                                contactTypeName: 'Cell'
                            });

                        });
                    }

                    if (utils.isNotEmptyVal(Alldata.phone_home)) {
                        var splittedwithcomma = Alldata.phone_home.split(","); // split string: 999-999-9999 Ext:1234, 999-999-9999 Ext:1234 > [0]=999-999-9999 Ext:1234 [1]=999-999-9999 Ext:1234 
                        _.forEach(splittedwithcomma, function (commaSeperated, i) { // [0]=999-999-9999 Ext:1234
                            var indexOfE = commaSeperated.indexOf("E");
                            var phoneNumberStr, extentionStr, phoneNumber, extention;
                            if (indexOfE > -1) {
                                phoneNumberStr = (commaSeperated.slice(0, indexOfE - 1)).trim();
                                extentionStr = (commaSeperated.slice(indexOfE - 1)).trim();
                                phoneNumber = utils.isEmptyVal(phoneNumberStr) ? '' : phoneNumberStr;
                                extention = utils.isEmptyVal(extentionStr) ? '' : extentionStr.split(":"); // split string: Ext:1234
                            } else {
                                phoneNumberStr = (commaSeperated.slice(0)).trim();
                                phoneNumber = utils.isEmptyVal(phoneNumberStr) ? '' : phoneNumberStr;
                                extention = '';
                            }
                            datalist.push({
                                id: '' + datatype + (parseInt(i) + 1),
                                name: phoneNumber,
                                extid: 'ext' + (parseInt(i) + 1),
                                ext: extention[1],
                                contactTypeName: 'Home'
                            });

                        });
                    }


                    if (utils.isNotEmptyVal(Alldata.phone_work)) {
                        var splittedwithcomma = Alldata.phone_work.split(","); // split string: 999-999-9999 Ext:1234, 999-999-9999 Ext:1234 > [0]=999-999-9999 Ext:1234 [1]=999-999-9999 Ext:1234 
                        _.forEach(splittedwithcomma, function (commaSeperated, i) { // [0]=999-999-9999 Ext:1234
                            var indexOfE = commaSeperated.indexOf("E");
                            var phoneNumberStr, extentionStr, phoneNumber, extention;
                            if (indexOfE > -1) {
                                phoneNumberStr = (commaSeperated.slice(0, indexOfE - 1)).trim();
                                extentionStr = (commaSeperated.slice(indexOfE - 1)).trim();
                                phoneNumber = utils.isEmptyVal(phoneNumberStr) ? '' : phoneNumberStr;
                                extention = utils.isEmptyVal(extentionStr) ? '' : extentionStr.split(":"); // split string: Ext:1234
                            } else {
                                phoneNumberStr = (commaSeperated.slice(0)).trim();
                                phoneNumber = utils.isEmptyVal(phoneNumberStr) ? '' : phoneNumberStr;
                                extention = '';
                            }
                            datalist.push({
                                id: '' + datatype + (parseInt(i) + 1),
                                name: phoneNumber,
                                extid: 'ext' + (parseInt(i) + 1),
                                ext: extention[1],
                                contactTypeName: 'Work'
                            });

                        });
                    }
                    break;
                case 'email':
                    var data_array = Alldata.split(",");
                    _.forEach(data_array, function (data, i) {
                        data = data.trim();
                        datalist.push({
                            id: '' + datatype + (parseInt(i) + 1),
                            name: data
                        });
                    });
                    break;
                case 'fax':
                    var data_array = Alldata.split(",");
                    _.forEach(data_array, function (data, i) {
                        data = data.trim();
                        datalist.push({
                            id: '' + datatype + (parseInt(i) + 1),
                            value: data
                        });
                    });
                    break;
            }

            return datalist;
        }

        /**
         * Start: Contact Card Profile Code
         */
        if (utils.isNotEmptyVal(vm.contact.contact_picture_uri)) {
            $scope.showProfileEditFlag = true;
        } else {
            $scope.showProfileEditFlag = false;
        }
        $scope.removeEditProfilePic = function () {
            $scope.removeProfileAPICalled = true;
            $scope.showProfileEditFlag = false;
        }

        $scope.removeProfile = function () {
            document.getElementById('xxx').value = '';
            $('#profile-img-tag').attr('src', '');
            //$('#remove-profile-btn').attr('display', 'none');
            $scope.showProfileAddFlag = false;
        }
        $scope.showProfileFlag = false;
        $scope.showRemoveProfileBtn = function () {
            $scope.$apply(function () {
                //$scope.showProfileAddFlag =  !$scope.showProfileAddFlag;
                $scope.showProfileAddFlag = true;
            });
        }
        $scope.showProfilePreview = function (input) {
            if (input.files && input.files[0]) {
                $scope.showProfileFlag = true;
                var reader = new FileReader();
                reader.onload = function (e) {
                    $('#profile-img-tag').attr('src', e.target.result);
                    //$('#remove-profile-btn').attr('display', '');
                }
                reader.readAsDataURL(input.files[0]);
            }
        }
        $scope.trustSrc = function (src) {
            if (src !== null) {
                var uriArr = src.split('/');
                var filename = uriArr[uriArr.length - 2] + '/' + uriArr[uriArr.length - 1];
                var filenameArr = filename.split('.');
                var extension = filenameArr[filenameArr.length - 1].toLowerCase();
                try {
                    var dfilename = decodeURIComponent(filename);
                    filename = dfilename;
                } catch (err) { }
                var filenameEncoded = encodeURIComponent(filename);
                var documentNameEncoded = encodeURIComponent("download.jpg");
                // return globalConstants.webServiceBase + "lexviafiles/downloadfile/ViewDocument.json?filename=" + filenameEncoded + "&&downloadname=" + documentNameEncoded + "&&containername=" + uriArr[uriArr.length - 3];
                return globalConstants.webServiceBase + "lexviafiles/downloadfile/ViewDocument.json?filename=" + filenameEncoded + "&&containername=" + uriArr[uriArr.length - 3];
            } else {
                return 'styles/images/contact_picture/profile.png';
            }
        }
        /**
         * End: Contact Card Profile Code
         */

        vm.save = function (contactData) {
            if (document.getElementById('xxx') != null) {
                var files = document.getElementById('xxx').files[0];
                if (files != null && files) {
                    if (!(files.type == 'image/jpeg' || files.type == 'image/jpg' || files.type == 'image/png')) {
                        notificationService.error("Please upload valid image.")
                        return;
                    }
                    if (files.size > 8388608) {
                        notificationService.error("Please upload image less than 8 MB size.")
                        return;
                    }
                }
            }
            //US#12913 if no contact is selected as primary then byDefault first contact is selected
            if (contactData.address.length > 0) {
                var a = _.every(contactData.address, function (item) {
                    return item.is_primary == 0;
                });
                if (a) {
                    contactData.address[0].is_primary = 1;
                }
            }

            var venue_ids = [];
            var venueid;
            if (contactData.type == "Court") {
                angular.forEach(masterData.venues, function (v) {
                    _.forEach(vm.contact.venue, function (item) {
                        if (v.name == item.name && v.jurisdiction_id == item.jurisdiction_id) {
                            venue_ids.push(v.id);
                        }
                    })

                });
                //US#9055
                venueid = venue_ids.toString();
            }

            var promise = null;
            //check duplicacy
            if (vm.showName) {
                promise = contactFactory.checkContact(vm.contact.first_name, vm.contact.last_name,
                    vm.contact.type, venueid, vm.contact.middle_name);
            } else {
                promise = contactFactory.checkContact(vm.contact.first_name, null,
                    vm.contact.type, venueid, null);
            }
            promise.then(function (response) {
                response = response.data;
                if (response && response.length > 0 && vm.mode == 'Add') {
                    vm.showcheckname = true;
                    vm.duplicatelist = response;
                    return;
                } else if (response && response.length > 1 && vm.mode == 'Edit') {
                    vm.showcheckname = true;
                    vm.duplicatelist = response;
                    return;
                } {
                    saveContact(contactData);
                }
            }, function (reason) { });

        };

        function saveContact(contactData) {
            var contactToBeSaved = {};
            contactToBeSaved.type = contactData.type;
            contactToBeSaved.is_sms_consent = contactData.is_sms_consent;
            //US#12143 - Company name
            if (contactData.type == 'Person' || contactData.type == 'Client' || contactData.type == 'Lead' || contactData.type == 'Estate Administrator' || contactData.type == 'Estate Executor' || contactData.type == 'Doctor' || contactData.type == 'Other') {
                contactToBeSaved.company = utils.isNotEmptyVal(contactData.company) ? contactData.company : '';
            } else {
                contactToBeSaved.company = '';
            }

            //US#10751 -Other Parties : Add text box for Specialty 
            if (contactToBeSaved.type) {
                contactToBeSaved.specialty = utils.isNotEmptyVal(contactData.specialty) ? contactData.specialty : '';
            } else {
                contactToBeSaved.specialty = "";
            }

            contactToBeSaved.first_name = contactData.first_name;
            //(vm.showName == true) ? contactToBeSaved.title_id = contactData.title_id.id : contactToBeSaved.title_id = "";
            angular.isObject(contactData.title_id) ? contactToBeSaved.title_id = contactData.title_id.id : contactToBeSaved.title_id = contactData.title_id; //Bug#6822
            if (contactToBeSaved.type && (contactToBeSaved.type == "Person" || contactToBeSaved.type == "Client" || contactToBeSaved.type == "Lead" || contactToBeSaved.type == "Doctor" || contactToBeSaved.type == "Estate Administrator" || contactToBeSaved.type == "Estate Executor")) {

            } else {
                delete contactToBeSaved.title_id;
            }
            contactToBeSaved.middle_name = (vm.showName) ? angular.isDefined(contactData.middle_name) ? contactData.middle_name : '' : '';
            contactToBeSaved.last_name = (vm.showName) ? angular.isDefined(contactData.last_name) ? contactData.last_name : '' : '';
            contactToBeSaved.note = contactData.note;
            contactToBeSaved.contact_type = utils.isNotEmptyVal(contactData.contact_type) ? contactData.contact_type : "Local";

            var emails = [];
            var e = 0;
            //emails.push({ id: 'email1', value: contactData.email });
            for (e in vm.emaillist) {
                emails.push({
                    id: 'email' + (e + 1),
                    value: vm.emaillist[e].name
                });
            }
            // contactToBeSaved.email = emails;

            vm.sampleEmails = [];
            _.forEach(emails, function (data, index) {
                if (utils.isNotEmptyVal(data.value)) {
                    vm.sampleEmails.push(data);
                }
            })
            contactToBeSaved.email = vm.sampleEmails;

            var phones = [];
            //phones.push({ id: 'phone1', value: contactData.phone });
            for (e in vm.phonelist) {

                phones.push({
                    id: 'phone' + (e + 1),
                    value: vm.phonelist[e].name,
                    ext: vm.phonelist[e].ext,
                    phone_type: vm.phonelist[e].contactTypeName
                });
            }

            vm.samplePhones = [];
            _.forEach(phones, function (data, index) {
                if (utils.isNotEmptyVal(data.value)) {
                    vm.samplePhones.push(data);
                }
            })
            contactToBeSaved.phone = vm.samplePhones;

            vm.sampleFax = [];
            _.forEach(contactData.fax_number, function (data, index) {
                if (utils.isNotEmptyVal(data.value)) {
                    vm.sampleFax.push(data);
                }
            })
            contactToBeSaved.fax_number = vm.sampleFax;

            contactToBeSaved.address = [];
            _.forEach(contactData.address, function (item) {
                var finalObj = {};
                finalObj.street = utils.isNotEmptyVal(item.street) ? item.street : "";
                finalObj.address_id = item.address_id ? item.address_id : 0;
                finalObj.zip_code = utils.isNotEmptyVal(item.zip_code) ? item.zip_code : "";
                finalObj.city = utils.isNotEmptyVal(item.city) ? item.city : "";
                finalObj.country = utils.isNotEmptyVal(item.country) ? item.country : '';
                finalObj.state = utils.isNotEmptyVal(item.state) ? item.state : '';
                finalObj.is_primary = item.is_primary;
                finalObj.address_type = utils.isNotEmptyVal(item.address_type) ? item.address_type : 'Other';
                contactToBeSaved.address.push(finalObj);
            })

            if (contactData.type == "Court") {
                var venueId = [];
                angular.forEach(masterData.venues, function (v) {
                    //add id into array
                    _.forEach(vm.contact.venue, function (item) {
                        if (v.name == item.name && v.jurisdiction_id == item.jurisdiction_id) {
                            venueId.push(v.id);
                        }
                    });
                });
                contactToBeSaved.venue_id = venueId;
            }


            if (_.isNull(contact) || utils.isEmptyObj(contact)) {
                var promesa = contactFactory.addContact(contactToBeSaved);
                promesa.then(function (response) {
                    if (document.getElementById('xxx') != null) {
                        var files = document.getElementById('xxx').files[0];
                        if (files) {
                            $scope.uploadFile(response);
                        }
                    }

                    notificationService.success("Contact added successfully");
                    $modalInstance.close(response);
                }, function (reason) {
                    $modalInstance.close();
                });
            } else {
                contactToBeSaved.contact_id = contact.contact_id;
                var promesa = contactFactory.editContact(contactToBeSaved, contact.contact_id);
                promesa.then(function (response) {
                    if (document.getElementById('xxx') != null) {
                        var files = document.getElementById('xxx').files[0];
                        if (files) {
                            $scope.uploadFile(response);
                        } else if ($scope.removeProfileAPICalled) {
                            $http.delete(contactFactory.getProfileDeleteUrl(response.contact_id), {
                            }).success(function () {
                                //notificationService.success('Image removed successfully');
                            }).error(function () {
                                //notificationService.error('Image not removed. Please try again');
                            });
                        }
                    }
                    notificationService.success("Contact edited successfully");
                    $modalInstance.close(response);
                }, function (reason) {
                    $modalInstance.close();
                });
            }
        }

        $scope.uploadFile = function (data) {

            var files = document.getElementById('xxx').files[0];
            // var fd = new FormData;
            // fd.append("file", files); //Take the first selected file
            // fd.append('contact_id', data.contact_id);

            // $http.post(contactFactory.getProfileUploadUrl(), fd, {
            //     withCredentials: true,
            //     responseType: "",
            //     headers: {
            //         "Authorization": "Bearer " + localStorage.getItem('accessToken'),
            //         // 'Content-Type': 'undefined'
            //     },
            //     transformRequest: angular.identity
            // }).success(function (response, status) {
            //     //notificationService.success('Image added successfully');
            // }).error(function () {
            //     //notificationService.error('Image did not add successfully');
            //});
            var url = contactFactory.getProfileUploadUrl();
            var fd = new FormData();
            fd.append('file', files);
            fd.append('contact_id', data.contact_id);
            $http.post(url, fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined },
                "Authorization": "Bearer " + localStorage.getItem('accessToken'),
            })
                .success(function () {
                })
                .error(function () {
                });

        };

        vm.typeSelected = function () {
            showVenuAndName(vm.contact)
            //Added this for Bug#8236
            if (vm.contact.type == 'Court') {
                if (!_.isEmpty(vm.contact.venue)) {
                    vm.showVenueFlag = false;
                } else {
                    vm.showVenueFlag = true;
                }
            } else {
                vm.showVenueFlag = false;
            }

            if (vm.contact.type == 'Medical Provider' || vm.contact.type == 'Doctor') {
                vm.showSpecialty = true;
            } else {
                vm.showSpecialty = false;
            }

            if (vm.contact.type == 'Person' || vm.contact.type == 'Client' || vm.contact.type == 'Lead' || vm.contact.type == 'Estate Administrator' || vm.contact.type == 'Estate Executor') {
                vm.contact.address[0].address_type = vm.addressTypeName[0].name;
            } else if (vm.contact.type == 'Court' || vm.contact.type == 'Doctor' || vm.contact.type == 'Educational Institution' || vm.contact.type == 'Business' || vm.contact.type == 'Government' || vm.contact.type == 'Insurance Company' || vm.contact.type == 'Law Firm' || vm.contact.type == 'Medical Provider' || vm.contact.type == 'Other') {
                vm.contact.address[0].address_type = vm.addressTypeName[1].name;
            } else {
                vm.contact.address[0].address_type = vm.addressTypeName[2].name;
            }
        }
        //Added this for Bug#8236
        vm.showVenueSelected = function () {
            if (!_.isEmpty(vm.contact.venue)) {
                vm.showVenueFlag = false;
            }
        }

        function showVenuAndName(contact) {
            vm.showName = (vm.contact.type == "Person" || vm.contact.type == "Estate Administrator" || vm.contact.type == "Estate Executor" || vm.contact.type == "Client" || vm.contact.type == "Lead" || vm.contact.type == "Doctor") ? true : false;
            vm.showVenue = (vm.contact.type == "Court") ? true : false;
            _.forEach(contact.address, function (item) {
                if ((item.country != 'United States')) {
                    item.stateshow = false;
                } else {
                    item.stateshow = true;
                }
            })
            // vm.stateshow = ((vm.contact.address[0].country != 'United States')) ? false : true;
        }


        vm.countryChange = function (list, index) {
            if (list[index].country != 'United States') {
                list[index].stateshow = false;
                list[index].state = null;
            } else {
                list[index].stateshow = true;
            }
        }

        vm.addEmail = function () {
            vm.emaillist.push({
                id: 'email' + (vm.emaillist.length + 1)
            });
        }

        vm.deleteEmail = function (data) {
            var index = _.findIndex(vm.emaillist, function (email) {
                return email.id == data;
            });
            if (index !== -1) {
                vm.emaillist.splice(index, 1);
            }
        }

        vm.addPhone = function () {
            vm.phonelist.push({
                id: 'phone' + (vm.phonelist.length + 1),
                extid: 'ext' + (vm.phonelist.length + 1),
                contactTypeName: 'Cell'
            });
        };

        vm.toggleCard = function () {
            vm.isOpen = !vm.isOpen;
            vm.showMoreLess = !vm.showMoreLess;
        };

        vm.deletePhone = function (data, index) {
            // var index = _.findIndex(vm.phonelist[index], function(phone) {
            //     return phone.id == data;
            // });
            if (index !== -1) {
                vm.phonelist.splice(index, 1);
            }
        }

        vm.addFax = function () {
            vm.contact.fax_number.push({
                id: 'fax' + vm.contact.fax_number.length + 1
            })
        }

        //US#12913 update existing array when clicked on add 
        vm.addAddress = function () {
            vm.contact.address.push({
                id: 'address' + vm.contact.address.length + 1,
                country: "United States",
                checked: false,
                is_primary: 0,
                stateshow: true
            })
        }

        //US#12913 delete contact object
        vm.deleteAddress = function (Id) {
            var index = _.findIndex(vm.contact.address, function (item) {
                return item.id == Id;
            });

            if (index !== -1) {
                vm.contact.address.splice(index, 1);
            }
        }
        vm.deleteFax = function (faxId) {
            var index = _.findIndex(vm.contact.fax_number, function (fax) {
                return fax.id == faxId;
            });

            if (index !== -1) {
                vm.contact.fax_number.splice(index, 1);
            }
        }



        vm.close = function () {
            $modalInstance.dismiss('cancel');
        };

        vm.noduplicate = function () {
            vm.showcheckname = false;
            //$modalInstance.dismiss('cancel');
        }

        vm.cancel = function () {
            vm.showcheckname = false;
            // vm.contact = {};
            //  vm.contact.address.country = 'United States';
        }

        vm.yesduplicate = function () {
            saveContact(vm.contact);
        }
    }

})();