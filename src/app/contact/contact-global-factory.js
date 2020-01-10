(function () {
    'use strict';

    angular
        .module('cloudlex.contact')
        .factory('contactFactory', ['$modal', '$http', '$q', 'globalContactConstants', 'masterData', 'globalConstants', '$rootScope',
            function ($modal, $http, $q, globalContactConstants, masterData, globalConstants, $rootScope) {

                var contactFactory = {};

                var contactCardInfo = {};

                function setName(contact, includeMiddleName) {
                    if (utils.isEmptyVal(contact)) {
                        return undefined;
                    }

                    if (angular.isDefined(contact.name)) {
                        return contact.name;
                    }

                    var name = '';

                    if (angular.isDefined(contact.firstname)) {
                        if (includeMiddleName) {
                            name = [contact.firstname, contact.middlename, contact.lastname].join(' ');
                        } else {
                            name = [contact.firstname, contact.lastname].join(' ');
                        }
                    } else if (angular.isDefined(contact.first_name)) {
                        if (includeMiddleName) {
                            name = [contact.first_name, contact.middle_name, contact.last_name].join(' ');
                        } else {
                            name = [contact.first_name, contact.last_name].join(' ');
                        }

                    } if (angular.isDefined(contact.firstName)) {
                        if (includeMiddleName) {
                            name = [contact.firstName, contact.middleName, contact.lastName].join(' ');
                        } else {
                            name = [contact.firstName, contact.lastName].join(' ');
                        }
                    } else {

                    }

                    return name;
                }

                return {
                    seletedContact: {},

                    intakeStaffUserToMatterStaffUser: function (data) {
                        angular.forEach(data, function (rec) {
                            rec.firmId = rec.firm_id;
                            rec.fullName = rec.full_name;
                            rec.isActive = rec.is_active;
                            rec.isAdmin = rec.is_admin;
                            rec.userId = rec.user_id;
                            rec.uname = rec.user_name;
                            rec.userRole = rec.user_role;
                        });
                    },

                    addContact: function (data) {

                        var deferred = $q.defer();
                        $http({
                            url: globalContactConstants.RESTAPI.addContact1,
                            method: "POST",
                            data: data
                        }).then(function (response) {
                            deferred.resolve(response.data);
                        }, function (error) {
                            deferred.reject(error);
                        });

                        return deferred.promise;

                    },

                    editContact: function (data, id) {
                        var deferred = $q.defer();
                        $http({
                            url: globalContactConstants.RESTAPI.editContact1,
                            method: "PUT",
                            data: data
                        }).then(function (response) {
                            deferred.resolve(response.data);
                        }, function (error) {
                            deferred.reject(error);
                        });

                        return deferred.promise;
                    },

                    updateContactOnEdit: function (contact, obj, contactProp) {

                        if (utils.isEmptyVal(obj[contactProp])) { return; }

                        if (obj[contactProp].contactid === contact.contactid) {
                            obj[contactProp] = angular.extend({}, obj[contactProp], contact);
                            obj[contactProp].phone_number = utils.isNotEmptyVal(obj[contactProp].phone) ?
                                obj[contactProp].phone.split(',')[0] : obj[contactProp].phone;
                            obj[contactProp].emailid = utils.isNotEmptyVal(obj[contactProp].email) ?
                                obj[contactProp].email.split(',')[0] : obj[contactProp].email;
                            obj[contactProp].edited = true;
                        }
                    },

                    checkContact: function (fname, lname, type, venueid, mname) {
                        var data = {
                            'first_name': fname ? fname : undefined,
                            'lname': lname ? lname : undefined,
                            'mname': mname ? mname : undefined,
                            'type': type.split(),
                            'venue_ids': venueid
                        };

                        return $http({
                            url: globalContactConstants.RESTAPI.getContactsUrl1,
                            method: "POST",
                            data: data
                        })
                    },

                    getUsersInFirm: function (data) {
                        if (data == 'no_auth') {
                            var token = {
                                'no_auth': true
                            }
                        }

                        return $http.get(globalContactConstants.RESTAPI.getStaffInFirmUrl,
                            {
                                headers: token
                            });
                    },

                    getRoleViewData: function (roleViewData) {
                        var params = {
                            "types": roleViewData.types,
                            "roleids": roleViewData.roleids,
                            "all_contacts": roleViewData.all_contacts,
                            "page_Num": roleViewData.page_number,
                            "page_Size": roleViewData.page_size
                        }
                        var deferred = $q.defer();
                        $http({
                            url: globalContactConstants.RESTAPI.countForRoleView1,
                            method: "POST",
                            data: params
                        }).success(function (response, status) {
                            deferred.resolve(response);

                        }).error(function (ee, status, headers, config) {
                            deferred.reject(ee);
                        });
                        return deferred.promise;

                    },
                    exportRoleViewData: function (roleViewData) {
                        var params = {
                            "types": utils.isNotEmptyVal(roleViewData.types) ? roleViewData.types : [],
                            "roles": roleViewData.roles,
                            "roleids": roleViewData.roleids,
                            "all_contacts": roleViewData.all_contacts,
                            "page_Num": roleViewData.page_number,
                            "page_Size": roleViewData.page_size
                        }
                        var deferred = $q.defer();
                        $http({
                            url: globalContactConstants.RESTAPI.getExportForRoleView1,
                            method: "POST",
                            data: params,
                            responseType: 'arraybuffer'
                        }).success(function (response, status) {
                            deferred.resolve(response);
                        }).error(function (ee, status, headers, config) {
                            deferred.reject(ee);
                        });
                        return deferred.promise;

                    },

                    getUsersList: function () {
                        var deferred = $q.defer();
                        $http({
                            url: globalContactConstants.RESTAPI.usersList,
                            method: "GET",
                            withCredentials: true
                        }).success(function (response) {
                            deferred.resolve(response);
                        }).error(function (ee, status, headers, config) {
                            deferred.resolve(ee);
                        });

                        return deferred.promise;

                    },

                    nodegraph: function (params) {
                        var deferred = $q.defer();
                        $http.post(globalContactConstants.RESTAPI.nodeGraph, params)
                            .then(function (response) {
                                deferred.resolve(response.data);
                            }, function (error) {
                                deferred.reject(error);
                            });

                        return deferred.promise;
                    },

                    matterContactRoles: function () {
                        var deferred = $q.defer();
                        $http({
                            url: globalContactConstants.RESTAPI.matterContactroles,
                            method: "GET",
                        }).success(function (response) {
                            deferred.resolve(response);
                        }).error(function (ee, status, headers, config) {
                            deferred.resolve(ee);
                        });

                        return deferred.promise;
                    },

                    getFlatUserList: function (users) {
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
                        //get unique user ids
                        userList = _.uniq(userList, function (item) {
                            return item.uid;
                        });

                        return userList;
                    },
                    getUniqueContacts: function (contacts) {
                        return _.uniq(contacts, function (contact) {
                            return contact.uid;
                        });
                    },

                    getCourtList: function () {
                        var deferred = $q.defer();
                        $http({
                            url: globalContactConstants.RESTAPI.courts,
                            method: "GET",
                            withCredentials: true,
                        }).success(function (response) {
                            deferred.resolve(response);
                        });

                        return deferred.promise;
                    },

                    getCourtContactListAddMatt: function (data) {
                        return $http({
                            url: globalContactConstants.RESTAPI.javacourtContactsMatt1,
                            method: "POST",
                            data: data
                        });

                    },


                    /**
                     * Function to get the contact list by name. 
                     * param name string (name of contact)
                     * param showDeleted boolean (to show deleted contact or not)
                     */
                    getContactsByName: function (name, showDeleted) {
                        var url = globalContactConstants.RESTAPI.getContactsUrl;
                        if (utils.isNotEmptyVal(showDeleted)) {
                            var params = { params: { 'fname': name, 'showDeleted': 1 } };
                        } else {
                            var params = { params: { 'fname': name } };
                        }
                        return $http.get(url, params);
                    },
                    setDataPropForContactsFromOffDrupalToNormalContact: setDataPropForContactsFromOffDrupalToNormalContact,
                    setNamePropForContactsOffDrupal: function (contacts) {
                        _.forEach(contacts, function (contact) {
                            contact.name = setName(contact, true);
                        });


                    },
                    getNameForContact: function (contact) {
                        return setName(contact, true)
                    },
                    // in our display value and model value are different for the input
                    // box
                    // therefore we are formatting our display value based on the model
                    // value of the input box
                    formatTypeaheadDisplay: function (contact) {
                        return setName(contact);
                    },

                    //function to set name in document modules
                    formatTypeaheadDisplay_Document: function (contact) {
                        return setName(contact);
                    },

                    openContactModal: function (ItemLoc) {
                        contactFactory.seletedContact = {};
                        var selectedType = ItemLoc;
                        // selectedType.type = ItemLoc.type;
                        // selectedType.venue = ItemLoc.venue;
                        return $modal.open({
                            templateUrl: 'app/contact/add-contact.html',
                            controller: 'ContactCtrl as addContact',
                            windowClass: 'modalMidiumDialog',
                            backdrop: 'static',
                            keyboard: false,
                            resolve: {
                                'MasterData': ['masterData', function (masterData) {
                                    return masterData.promise;
                                }],
                                SelectedType: function () {
                                    return selectedType;
                                }
                                /*
                                 * 'contact': function () { return null; // Add contact
                                 * view - set to null }
                                 */
                            }
                        });
                    },

                    getContact: function () {
                        return contactFactory.seletedContact;
                    },

                    openEditContactModal: function (contact) {
                        var selectedType = {};
                        contactFactory.seletedContact = contact;
                        if (contact.contact_id == contactCardInfo.contact_id) { contactCardInfo.edited = true; }

                        return $modal.open({
                            templateUrl: 'app/contact/add-contact.html',
                            controller: 'ContactCtrl as addContact',
                            windowClass: 'modalMidiumDialog',
                            backdrop: 'static',
                            keyboard: false,
                            resolve: {
                                'MasterData': ['masterData', function (masterData) {
                                    return masterData.promise;
                                }],
                                SelectedType: function () { return selectedType; }
                            }
                        });
                    },

                    getGlobalContactsList: function (pageNum, pageSize, selectedFilter, extraFilter, isJavaConfig, isAll) {
                        var deferred = $q.defer();
                        var contact = {};
                        contact.page_Num = pageNum;
                        (pageSize == '250') ? contact.page_Size = pageSize : contact.page_Size = 250;
                        (extraFilter != undefined) ? (extraFilter.egc_type == true) ? contact.exclude_global_contact = 1 : contact.exclude_global_contact = 0 : '';
                        contact.state = utils.isNotEmptyVal(selectedFilter.statename) ? selectedFilter.statename : '';
                        contact.type = utils.isNotEmptyVal(selectedFilter.type) ? selectedFilter.type : ['All'];
                        (isAll == true) ? contact.all_contacts = 1 : contact.all_contacts = 0;

                        if (isJavaConfig) {
                            $http({
                                url: globalContactConstants.RESTAPI.javacourtContactsMatt1,
                                method: "POST",
                                data: contact
                            })
                                .then(function (response) {
                                    deferred.resolve(response.data);
                                }, function (error) {
                                    deferred.reject(error);
                                });

                            return deferred.promise;

                        } else {

                            $http.post(globalContactConstants.RESTAPI.courtContactsMatt, postObj)
                                .then(function (response) {
                                    deferred.resolve(response.data);
                                }, function (error) {
                                    deferred.reject(error);
                                });

                            return deferred.promise;

                        }


                    },



                    // delete contact
                    deleteContact: function (cid) {
                        var deferred = $q.defer();
                        var data = { 'cid': cid.toString() };
                        $http({
                            url: globalContactConstants.RESTAPI.deleteContacts1 + '?' + getParams(data),
                            method: "DELETE"
                        }).then(function (response) {
                            deferred.resolve(response.data);
                        }, function (error) {
                            deferred.reject(error);
                        });
                        return deferred.promise;
                    },

                    printContacts: function (dataList, filter, extraFilter) {
                        var output = getDataListTable(dataList, filter, extraFilter);
                        window.open().document.write(output);
                    },

                    printRoleContacts: function (dataList, filter) {
                        var output = getContactRoleTable(dataList, filter);
                        window.open().document.write(output);
                    },

                    displayContactCard1: function (contactId, edited, contacttype) {

                        var contact = {};
                        contact.contact_id = contactId;
                        utils.isNotEmptyVal(contacttype) ? contact.contact_type = contacttype : contact.contact_type = "Local";

                        var url = globalContactConstants.RESTAPI.getContactById1 + contact.contact_id + '?type=' + contact.contact_type;
                        $http({
                            url: url,
                            method: "GET"
                        }).then(function (response) {
                            var contact = response.data;
                            contactCardInfo = angular.copy(contact);
                            var selectedType = {};
                            $modal.open({
                                templateUrl: 'app/contact/contact-card.html',
                                windowClass: 'modalMidiumDialog',
                                backdrop: 'static',
                                keyboard: false,
                                resolve: {
                                    contactData: function () { return contact; },
                                    SelectedType: function () { return selectedType; }
                                },
                                controller: ['$rootScope', '$scope', '$modalInstance', 'contactData', 'contactFactory', 'notification-service', 'mailboxDataService',
                                    function ($rootScope, $scope, $modalInstance, contactData, contactFactory, notificationService, mailboxDataService) {

                                        $scope.close = closeModal;
                                        $scope.editContact = editContact;
                                        $scope.hideEditButton = false;
                                        $scope.composeMail = composeMail;
                                        $scope.viewCalculation = viewCalculation;
                                        $scope.viewPrevCalculation = viewPrevCalculation;
                                        $scope.viewNextCalculation = viewNextCalculation;
                                        //US#4713 disable add edit delete 
                                        $scope.gracePeriodDetails = masterData.getUserRole();
                                        $scope.isGraceOver = $scope.gracePeriodDetails.plan_subscription_status;
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

                                        setData(contactData);

                                        function setData(contactObj) {
                                            var contactInfo = angular.copy(contactObj);
                                            if (contactInfo.contact_type == "Global") {
                                                $scope.hideEditButton = true;
                                            }

                                            contactInfo.name = setName(contact, true);

                                            contactInfo.address = contactInfo.address;
                                            //US#12913
                                            $scope.gridObj = {}; // obj to show address 
                                            if (contactInfo.address.length > 0) {
                                                var b;
                                                // get object with primary address and also index
                                                var a = _.find(contactInfo.address, function (item, index) {
                                                    if (item.is_primary == 1) {
                                                        b = index;
                                                        return item;
                                                    }
                                                });


                                                contactInfo.address.splice(b, 1);
                                                contactInfo.address.unshift(a);
                                                contactData.address = [];
                                                contactData.address = contactInfo.address;
                                            }
                                            $scope.addressLength = contactInfo.address.length;
                                            $scope.gridObj = contactInfo.address[0];
                                            $scope.idx = 0; // set idx

                                            contactInfo.phone = utils.isNotEmptyVal(contactInfo.phone_work) ?
                                                contactInfo.phone_work.split(',') : "";

                                            contactInfo.email = utils.isNotEmptyVal(contactInfo.email_ids) ?
                                                contactInfo.email_ids.split(',') : "";

                                            contactInfo.phone_work = utils.isNotEmptyVal(contactInfo.phone_work) ?
                                                contactInfo.phone_work.split(',') : "";

                                            contactInfo.phone_home = utils.isNotEmptyVal(contactInfo.phone_home) ?
                                                contactInfo.phone_home.split(',') : "";

                                            contactInfo.phone_cell = utils.isNotEmptyVal(contactInfo.phone_cell) ?
                                                contactInfo.phone_cell.split(',') : "";

                                            contactInfo.faxnumber = utils.isNotEmptyVal(contactInfo.fax_numbers) ?
                                                contactInfo.fax_numbers.split(',') : "";

                                            contactInfo.contact_note = contactInfo.note;

                                            $scope.contact = contactInfo;
                                        }

                                        function closeModal() {
                                            $modalInstance.dismiss();

                                        }

                                        function viewCalculation(data) {
                                            (data == 'last') ? $scope.idx = contactData.address.length - 1 : $scope.idx = 0;
                                            $scope.gridObj = {};
                                            $scope.gridObj = contactData.address[$scope.idx];
                                        }
                                        function viewPrevCalculation() {
                                            if ($scope.idx == 0) {
                                                return;
                                            }
                                            $scope.idx = $scope.idx - 1;
                                            $scope.gridObj = {};
                                            $scope.gridObj = contactData.address[$scope.idx];

                                        }
                                        function viewNextCalculation() {
                                            if ($scope.idx == (contactData.address.length - 1)) {
                                                return;
                                            }
                                            $scope.idx = $scope.idx + 1;
                                            $scope.gridObj = {};
                                            $scope.gridObj = contactData.address[$scope.idx];
                                        }

                                        function editContact() {
                                            var contactInfo = angular.copy(contactData);
                                            $modalInstance.dismiss();
                                            var editContactModalInstance = contactFactory.openEditContactModal(contactInfo);
                                            editContactModalInstance
                                                .result
                                                .then(function (editedContactRes) {
                                                    setDataPropForContactsFromOffDrupalToNormalContact([editedContactRes]);
                                                    $rootScope.$broadcast('contactCardEdited', editedContactRes);
                                                });
                                        }

                                        //US#8330 func compose email when clicked on contact card
                                        function composeMail() {


                                            var contactDetail = angular.copy(contactData);
                                            localStorage.setItem('emailfromcontact', true);
                                            if (utils.isEmptyVal(contactDetail.email_ids)) {
                                                notificationService.error('Please add email address');
                                                return;
                                            }
                                            $rootScope.$broadcast('composeEmailFromContact', contactDetail);
                                            $modalInstance.dismiss();
                                        }

                                        function formatContact(con) {
                                            con.phone = utils.isNotEmptyVal(con.phone) ? con.phone.replace(/,/g, "<br/>") : '';
                                            con.faxnumber = utils.isNotEmptyVal(con.faxnumber) ? con.faxnumber.replace(/,/g, "<br/>") : '';
                                            con.email = utils.isNotEmptyVal(con.email) ? con.email.replace(/,/g, "<br/>") : '';
                                        }
                                    }]
                            });


                        });
                    },
                    exportContacts: function (filters, extraFilter, pageSize, all) {
                        var params = {
                            "exclude_global_contact": (extraFilter && extraFilter.egc_type == true) ? 1 : 0,
                            "type": utils.isNotEmptyVal(filters.type) ? filters.type : ['All'],
                            "state": filters.statename ? filters.statename : '',
                            "page_Num": 1,
                            "page_Size": (pageSize == '250') ? 250 : pageSize,
                            "all_contacts": (all == true) ? 1 : 0
                        };
                        var deferred = $q.defer();
                        $http({
                            url: globalContactConstants.RESTAPI.exportContact1,
                            method: "POST",
                            data: params,
                            responseType: 'arraybuffer'
                        }).success(function (response, status) {
                            deferred.resolve(response);
                        }).error(function (ee, status, headers, config) {
                            deferred.reject(ee);
                        });
                        return deferred.promise;

                    },

                    formatContactAddress: function (contact) {
                        if (utils.isNotEmptyVal(contact) && (typeof contact === 'object')) {
                            contact.streetCityStateZip = utils.isNotEmptyVal(contact.street) ? contact.street : '';
                            contact.streetCityStateZip += (utils.isNotEmptyVal(contact.street) && (utils.isNotEmptyVal(contact.city) || utils.isNotEmptyVal(contact.state) || utils.isNotEmptyVal(contact.zipcode))) ? ',  <br />' : '';
                            contact.streetCityStateZip += utils.isNotEmptyVal(contact.city) ? contact.city : '';
                            contact.streetCityStateZip += (utils.isNotEmptyVal(contact.city) && utils.isNotEmptyVal(contact.state)) ? ', ' : '';
                            contact.streetCityStateZip += (utils.isNotEmptyVal(contact.city) && utils.isEmptyVal(contact.state) && utils.isNotEmptyVal(contact.zipcode)) ? ', ' : '';
                            contact.streetCityStateZip += utils.isNotEmptyVal(contact.state) ? contact.state : '';
                            contact.streetCityStateZip += (utils.isNotEmptyVal(contact.state) && utils.isNotEmptyVal(contact.zipcode)) ? ', ' : '';
                            contact.streetCityStateZip += utils.isNotEmptyVal(contact.zipcode) ? contact.zipcode : '';

                            //US#9630
                            var numbr = "";
                            var phoneType = "";
                            if (contact.phone_cell) {
                                numbr = contact.phone_cell;
                                phoneType = "c";
                            } else if (contact.phone_home) {
                                numbr = contact.phone_home;
                                phoneType = "h";
                            } else if (contact.phone_work) {
                                numbr = contact.phone_work;
                                phoneType = "w";
                            }
                            if (contact.phoneCell) {
                                numbr = contact.phoneCell;
                                phoneType = "c";
                            } else if (contact.phoneHome) {
                                numbr = contact.phoneHome;
                                phoneType = "h";
                            } else if (contact.phoneWork) {
                                numbr = contact.phoneWork;
                                phoneType = "w";
                            }

                            contact.primaryPhoneNumber = numbr;
                            contact.phoneType = phoneType;
                        }
                    },

                    getProfileUploadUrl: getProfileUploadUrl,
                    getProfileDeleteUrl: getProfileDeleteUrl,
                    getPhonesInSeq: getPhoneType

                };

                function setDataPropForContactsFromOffDrupalToNormalContact(contacts) {
                    _.forEach(contacts, function (contact) {
                        contact['emailid'] = utils.isNotEmptyVal(contact.email_ids) ? contact.email_ids : '';
                        contact['city'] = utils.isNotEmptyVal(contact.address[0].city) ? contact.address[0].city : '';
                        contact['state'] = utils.isNotEmptyVal(contact.address[0].state) ? contact.address[0].state : '';
                        contact['country'] = utils.isNotEmptyVal(contact.address[0].country) ? contact.address[0].country : '';
                        contact['street'] = utils.isNotEmptyVal(contact.address[0].street) ? contact.address[0].street : '';
                        contact['zipcode '] = utils.isNotEmptyVal(contact.address[0].zip_code) ? contact.address[0].zip_code : '';
                        contact['address_type '] = utils.isNotEmptyVal(contact.address[0].address_type) ? contact.address[0].address_type : '"Other"';
                        contact['contactid'] = (contact.contact_id).toString();
                        contact['contactId'] = (contact.contact_id).toString();
                        contact['firstname'] = angular.isDefined(contact.first_name) && !_.isNull(contact.first_name) ? contact.first_name : "";
                        contact['lastname'] = angular.isDefined(contact.last_name) && !_.isNull(contact.last_name) ? contact.last_name : "";
                        contact['middlename'] = angular.isDefined(contact.middle_name) && !_.isNull(contact.middle_name) ? contact.middle_name : "";
                        contact['phoneCell'] = contact.phone_cell;
                        contact['phoneHome'] = contact.phone_home;
                        contact['phoneWork'] = contact.phone_work;
                    });
                };

                function getCell(contact) {
                    var phonec = contact.phone_cell.split(',');
                    if (phonec.length >= 3) {
                        phonec = phonec.slice(0, 2);
                    }
                    return phonec;
                }

                function getHome(contact) {
                    var phoneh = contact.phone_home.split(',');
                    if (phoneh.length >= 3) {
                        phoneh = phoneh.slice(0, 2);
                    }
                    return phoneh;
                }

                function getWork(contact) {
                    var phonew = contact.phone_work.split(',');
                    if (phonew.length >= 3) {
                        phonew = phonew.slice(0, 2);
                    }
                    return phonew;
                }

                function setPhoneProps(contact, seq) {
                    var phone1 = [];
                    var phone2 = [];
                    var phoneType1 = "";
                    var phoneType2 = "";

                    if (seq == "chw") {
                        if (utils.isNotEmptyVal(contact.phone_cell)) {
                            phone1 = getCell(contact);
                            phoneType1 = 1;

                            if (utils.isNotEmptyVal(contact.phone_home)) {
                                phone2 = getHome(contact);
                                phoneType2 = 2;
                            } else if (utils.isNotEmptyVal(contact.phone_work)) {
                                phone2 = getWork(contact);
                                phoneType2 = 3;
                            }

                        } else {
                            if (utils.isNotEmptyVal(contact.phone_home)) {
                                phone1 = getHome(contact);
                                phoneType1 = 2;

                                if (utils.isNotEmptyVal(contact.phone_work)) {
                                    phone2 = getWork(contact);
                                    phoneType2 = 3;
                                }
                            } else {
                                if (utils.isNotEmptyVal(contact.phone_work)) {
                                    phone1 = getWork(contact);
                                    phoneType1 = 3;
                                }
                            }

                        }
                    } else {
                        if (utils.isNotEmptyVal(contact.phone_work)) {
                            phone1 = getWork(contact);
                            phoneType1 = 3;

                            if (utils.isNotEmptyVal(contact.phone_cell)) {
                                phone2 = getCell(contact);
                                phoneType2 = 1;
                            } else if (utils.isNotEmptyVal(contact.phone_home)) {
                                phone2 = getHome(contact);
                                phoneType2 = 2;
                            }

                        } else {
                            if (utils.isNotEmptyVal(contact.phone_cell)) {
                                phone1 = getCell(contact);
                                phoneType1 = 1;

                                if (utils.isNotEmptyVal(contact.phone_home)) {
                                    phone2 = getHome(contact);
                                    phoneType2 = 2;
                                }
                            } else {
                                if (utils.isNotEmptyVal(contact.phone_home)) {
                                    phone1 = getHome(contact);
                                    phoneType1 = 2;
                                }
                            }

                        }
                    }
                    contact.phone1 = phone1.toString();
                    contact.phone2 = phone2.toString();
                    contact.phoneType1 = phoneType1;
                    contact.phoneType2 = phoneType2;
                }

                function getPhoneType(contacts) {
                    _.forEach(contacts, function (contact, index) {
                        if (contact.type == 'Person' || contact.type == 'Client' || contact.type == 'Lead' || contact.type == 'Estate Administrator' || contact.type == 'Estate Executor') {
                            setPhoneProps(contact, "chw");

                        } else if (contact.type == 'Business' || contact.type == 'Court' || contact.type == 'Educational Institution'
                            || contact.type == 'Doctor' || contact.type == 'Government' || contact.type == 'Insurance Company'
                            || contact.type == 'Law Firm' || contact.type == 'Medical Provider' || contact.type == 'Other') {

                            setPhoneProps(contact, "wch");
                        }

                    });

                }

                function getProfileUploadUrl() {
                    var url;
                    if (!globalConstants.useApim) {
                        url = globalConstants.javaWebServiceBaseV4 + 'contact/picture';
                    } else {
                        url = globalConstants.matterBase + 'contact/v1/picture';
                    }
                    return url;
                }
                function getProfileDeleteUrl(id) {
                    var url;
                    if (!globalConstants.useApim) {
                        url = globalConstants.javaWebServiceBaseV4 + 'contact/picture/' + id;
                    } else {
                        url = globalConstants.matterBase + 'contact/picture/' + id;
                    }
                    return url;
                }

                // TODO - move to utils
                function getParams(params) {
                    var querystring = "";
                    angular.forEach(params, function (value, key) {
                        querystring += key + "=" + value;
                        querystring += "&";
                    });
                    return querystring.slice(0, querystring.length - 1);
                }

                function getContactRoleTable(dataList, filters) {
                    var title = [
                        { name: 'contact_name', desc: 'Contact Name' },
                        { name: 'type', desc: 'Type' },
                        { name: 'specialty', desc: 'Specialty' },
                        { name: 'matter_name', desc: 'Matter Name' },
                        { name: 'role', desc: 'Role' },
                        { name: 'status', desc: 'Status' },
                        { name: 'sub_status', desc: 'Sub Status' }
                    ];

                    var html = "<html><head><title>Role View</title>";
                    html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
                    html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
                    html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}</style>";
                    html += "<style>table tr { page-break-inside: always; }  </style></head>";
                    html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
                    html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Role View</h1><div></div>";
                    html += "<body>";
                    html += "<div><h2 style='text-align:left;padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";
                    var typename;
                    if (utils.isNotEmptyVal(filters.type)) {
                        typename = _.pluck(filters.type, 'name').toString().split(',').join(', ');
                    } else {
                        typename = '';
                    }
                    var specialityname;
                    if (utils.isNotEmptyVal(filters.specialty)) {
                        specialityname = _.pluck(filters.specialty, 'name').toString().split(',').join(', ');
                    } else {
                        specialityname = '';
                    }
                    var rolename;
                    if (utils.isNotEmptyVal(filters.roles)) {
                        rolename = _.pluck(filters.roles, 'name').toString().split(',').join(', ');
                    } else {
                        rolename = '';
                    }
                    html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><label><strong>TYPE : </strong></label>";
                    html += "<span style='padding:5px'> " + typename;
                    html += "</span></div>";

                    // html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><label><strong>Specialty : </strong></label>";
                    // html += "<span style='padding:5px'> " + specialityname;
                    // html += "</span></div>";

                    html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><label><strong>ROLE : </strong></label>";
                    html += "<span style='padding:5px'> " + rolename;
                    html += "</span></div>";


                    html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
                    html += "<table style='border:1px solid #e2e2e2;width:100%;text-align: left; font-size:8pt;' cellspacing='0' cellpadding='0' border='0'>";
                    html += "<tr>";
                    angular.forEach(title, function (value, key) {
                        html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + value.desc + "</th>";
                    });
                    html += "</tr>";

                    angular.forEach(dataList, function (data) {
                        html += "<tr>";
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + (utils.isNotEmptyVal(data.contact_name) ? utils.removeunwantedHTML(data.contact_name) : '') + "</td>";
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + (utils.isNotEmptyVal(data.type) ? data.type : '') + "</td>";
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + (utils.isNotEmptyVal(data.specialty) ? data.specialty : '') + "</td>";
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + (utils.isNotEmptyVal(data.matter_name) ? utils.removeunwantedHTML(data.matter_name) : '') + "</td>";
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + (utils.isNotEmptyVal(data.role) ? data.role : '') + "</td>";
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + (utils.isNotEmptyVal(data.status) ? data.status : '') + "</td>";
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + (utils.isNotEmptyVal(data.sub_status) ? data.sub_status : '') + "</td>";
                        html += "</tr>";
                    });



                    html += "</body>";
                    html += "</table>";
                    html += "</html>";
                    return html;
                }

                function getDataListTable(dataList, filters, extraFilter) {

                    var title = [
                        { name: 'name', desc: 'Name' },
                        { name: 'type', desc: 'Type' },
                        { name: 'specialty', desc: 'Specialty' },
                        { name: 'email_id', desc: 'Email ID' },
                        { name: 'cell_contact', desc: 'Phone(Cell)' },
                        { name: 'home_contact', desc: 'Phone(Home)' },
                        { name: 'fax', desc: 'Fax#' },
                        { name: 'city_state', desc: 'Address' }
                    ];
                    if ($rootScope.onMatter) {
                        var html = "<html><head><title>Directory View</title>";
                    } else if ($rootScope.onIntake) {
                        var html = "<html><head><title>Contacts</title>";
                    } else if ($rootScope.onContactManager) {
                        var html = "<html><head><title>Contacts</title>";
                    }
                    html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
                    html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
                    html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}</style>";
                    html += "<style>table tr { page-break-inside: always; }  </style></head>";
                    html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
                    if ($rootScope.onMatter) {
                        html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Directory View</h1><div></div>";
                    }

                    html += "<body>";
                    html += "<div><h2 style='text-align:left;padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";

                    html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><label><strong>TYPE : </strong></label>";
                    html += "<span style='padding:5px'> " + ((filters.type) ? filters.type : ' ');
                    html += "</span></div>";

                    html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><label><strong>Exclude Global Contacts : </strong></label>";
                    html += "<span style='padding:5px'>";
                    if (utils.isNotEmptyVal(extraFilter)) {
                        (extraFilter.egc_type == true) ? html += "Yes" : html += "No";
                    }

                    html += "</span></div>";

                    html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><label><strong>STATE : </strong></label>";
                    html += "<span style='padding:5px'> " + ((filters.statename) ? filters.statename : ' ');
                    html += "</span></div>";

                    html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
                    html += "<table style='border:1px solid #e2e2e2;width:100%;text-align: left; font-size:8pt;' cellspacing='0' cellpadding='0' border='0'>";
                    html += "<tr>";
                    angular.forEach(title, function (value, key) {

                        if (value.name == 'modified_date') {
                            html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + value.desc + "</th>";
                        }
                        else if (value.name == 'file_number') {
                            html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + value.desc + "</th>";
                        }
                        else if (value.name == 'index_number') {
                            html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + value.desc + "</th>";
                        }
                        else { html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + value.desc + "</th>"; }
                    });
                    html += "</tr>";
                    angular.forEach(dataList, function (data) {
                        data.specialty = data.specialty ? data.specialty : '';
                        html += "<tr>";
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(data.name) + "</td>";
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(data.type) + "</td>";
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(data.specialty) + "</td>";
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + ((data.email) ? data.email : '') + "</td>";
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + ((data.phone_cell) ? data.phone_cell : '') + "</td>";
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + ((data.phone_home) ? data.phone_home : '') + "</td>";
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + ((data.fax_numbers) ? data.fax_numbers : '') + "</td>";
                        // html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + ((data.zip_code) ? data.zip_code : '') + "</td>";
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(((data.street)) ? data.street + '&nbsp;' : '-') + "<br/>" + utils.removeunwantedHTML(((data.city)) ? data.city + '&nbsp;' : '-') + "<br/>" + ((data.state) ? data.state : '-') + "<br/>" + ((data.zip_code ? data.zip_code : '-')) + "<br/>" + ((data.country ? data.country : '-')) + "</td>";
                        html += "</tr>";
                    });

                    html += "</body>";
                    html += "</table>";
                    html += "</html>";
                    return html;
                }

            }]);

})();
