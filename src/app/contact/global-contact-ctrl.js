(function () {

    'use strict';

    angular.module('cloudlex.contact')
        .controller('ContactListCtrl', ContactListCtrl)

    ContactListCtrl.$inject = ['$rootScope', '$scope', 'contactFactory', 'masterData', 'contactListHelper',
        '$modal', 'modalService', 'notification-service', 'routeManager', 'mailboxDataService', 'globalContactConstants', '$http'
    ];

    function ContactListCtrl($rootScope, $scope, contactFactory, masterData, contactListHelper,
        $modal, modalService, notificationService, routeManager, mailboxDataService, globalContactConstants, $http) {

        var self = this;
        var initLimit = 15;
        self.contacts = {};
        self.contactType = [];
        self.states = [];
        self.totalRecords = 0;
        self.selectedFilters = {};
        self.contactExtraFilter = "";
        self.pageNum = 1;
        self.pageSize = 250 // TODO - get it from global constant
        self.isAll = false;
        self.tags = [];
        self.filterRetain = filterRetain;
        self.filterRetainForRole = filterRetainForRole;
        self.clickSearch = clickSearch;
        self.filters = {};
        self.showSearchTrue = true;
        //US#4713 disable add edit delete 
        var gracePeriodDetails = masterData.getUserRole();
        self.firmID = gracePeriodDetails.firm_id;
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.allContactSelected = allContactSelected;
        self.isDirectories = false;
        self.isRoleView = false;
        self.setSelectedTab = setSelectedTab;
        self.firmData = { API: "PHP", state: "mailbox" };
        self.selectionModel = {
            multiFilters: {
                type: [],
                roles: []
            }
        };
        self.selectedContact = [];
        self.pageNumForRole = 1;
        self.pageSizeForRole = 250;
        self.roleDataCallOnGoing = false;
        self.toggleAccordionGroup = toggleAccordionGroup;
        self.selectAllRoleContact = selectAllRoleContact;
        self.allContactRoleSelected = allContactRoleSelected;
        self.isContactRoleSelected = isContactRoleSelected;
        self.allContacts = [];
        self.updatedData = [];
        self.printRoleView = printRoleView;
        self.search = search;
        self.getMoreRoleContacts = getMoreRoleContacts;
        self.getAllRoleContacts = getAllRoleContacts;
        self.tagCancelForRoleView = tagCancelForRoleView;
        self.exportForRole = exportForRole;
        self.totalCount = 0;
        self.isAllRole = false;
        /**
         * firm basis module setting 
         */
        self.firmData = JSON.parse(localStorage.getItem('firmSetting'));
        self.JavaFilterAPIForContactList = true;


        //for retaintion of search feild on refresh page
        var filtertext = sessionStorage.getItem("contact_filtertext");
        if (utils.isNotEmptyVal(filtertext)) {
            self.showSearch = true;
        }

        function clickSearch(event) {
            self.showSearch = true;

        }
        function search(event) {
            self.showSearchForRole = true;

        }

        var masterDataProvider = masterData;
        var masterData = masterData.getMasterData();
        self.salutations = masterData.matter_contact_salutations;

        var typeFilter = '';
        (function () {
            init();
            self.isDirectories = true;
        })();
        function init() {
            self.limit = initLimit;
            self.contactType = masterData.contact_type;
            self.states = masterData.states;
            if ($rootScope.onContactManager == true) {
                var contactListFilter = localStorage.getItem('contactList')
            } else if ($rootScope.onIntake) {
                var contactListFilter = localStorage.getItem('intake_contactList')
            } else if ($rootScope.onMatter) {
                var contactListFilter = localStorage.getItem('matter_contactList')
            }
            // var contactListFilter =  $rootScope.onContactManager == true ? localStorage.getItem('contactList') : localStorage.getItem('intake_contactList');
            if ($rootScope.onContactManager == true) {
                var contactExtraFilter = localStorage.getItem('contactExtraFilter')
            } else if ($rootScope.onIntake) {
                var contactExtraFilter = localStorage.getItem('intake_contactExtraFilter')
            } else if ($rootScope.onMatter) {
                var contactExtraFilter = localStorage.getItem('matter_contactExtraFilter')
            }
            // var contactExtraFilter = $rootScope.onContactManager == true ? localStorage.getItem("contactExtraFilter") : localStorage.getItem("intake_contactExtraFilter");

            // var contactListFilter = sessionStorage.getItem("contactList");
            // var contactExtraFilter = sessionStorage.getItem("contactExtraFilter");
            if (utils.isNotEmptyVal(contactListFilter)) {
                try {
                    self.selectedFilters = JSON.parse(contactListFilter);
                    self.contactExtraFilter = JSON.parse(contactExtraFilter);
                    self.tags = contactListHelper.prepareTags(self.selectedFilters, self.contactType, self.states, self.contactExtraFilter);
                } catch (e) {
                    self.selectedFilters = {};
                }
            }


            getContactList();
            setBreadcrums();
            getUserEmailSignature();
        }

        function filterRetain() {

            var filtertext = self.filters.filterText;
            if ($rootScope.onContactManager == true) {
                localStorage.setItem('contact_filtertext', filtertext)
            } else if ($rootScope.onIntake == true) {
                localStorage.setItem('intake_contact_filtertext', filtertext)
            } else if ($rootScope.onMatter == true) {
                localStorage.setItem('matter_contact_filtertext', filtertext)
            }

            //sessionStorage.setItem("contact_filtertext", filtertext);


        }

        function filterRetainForRole() {
            var filtertext = self.filters.filterTextForRole;
            sessionStorage.setItem("contact_filtertextForRole", filtertext);

        }
        function toggleAccordionGroup(contact) {
            var newVal = !contact.open;
            angular.forEach(self.updatedData, function (conDetail, index) {
                if (conDetail.contact_id == contact.contact_id) {
                    conDetail.open = newVal;
                } else {
                    conDetail.open = false;
                }
            });
        }

        function setSelectedTab(tabname) {
            switch (tabname) {
                case 'directories':
                    self.isDirectories = true;
                    self.isRoleView = false;
                    init();
                    break;
                case 'roleview':
                    self.isRoleView = true;
                    self.isDirectories = false;
                    var persistFilter = JSON.parse(sessionStorage.getItem('roleViewFilter'));
                    if (_.isNull(persistFilter)) {
                        self.selectionModel = {
                            multiFilters: {
                                type: [],
                                roles: []
                            }
                        };
                    } else {
                        self.selectionModel.multiFilters = persistFilter;
                    }
                    self.tagList = contactListHelper.generateTags(self.selectionModel.multiFilters);
                    getRoleData(self.selectionModel.multiFilters);
                    break;
            }

        }

        self.contactRoleGrid = {
            headers: contactListHelper.getContactRoleGrid(),
            selectedItems: []
        }
        self.display = {
            filtered: true,
            contactListReceived: false,
            contactSelected: {}
        };
        function selectAllRoleContact(isSelected) {
            if (isSelected === true) {
                self.contactRoleGrid.selectedItems = angular.copy(self.allContacts);
            } else {
                self.contactRoleGrid.selectedItems = [];
            }

        }

        function allContactRoleSelected() {
            if (self.allContacts.length != 0)
                return self.contactRoleGrid.selectedItems.length === self.allContacts.length;
        };


        // select manual matter notes
        /*  function isContactRoleSelected(contactid) {
              var contactIds = _.pluck(self.contactRoleGrid.selectedItems, 'contact_id');
              return contactIds.indexOf(contactid.contact_id) > -1;
          }*/

        function printRoleView(selectedItems) {
            if (selectedItems == undefined) {
                contactFactory.printRoleContacts(self.allContacts, 'all', self.selectionModel.multiFilters);
                self.contactRoleGrid.selectedItems = [];
            } else {
                contactFactory.printRoleContacts(self.allContacts, selectedItems, self.selectionModel.multiFilters);
                self.contactRoleGrid.selectedItems = [];
            }
        }

        function exportForRole() {
            self.isAll = true;
            //var filename = "Contact Roleview";
            self.pageSizeForRole = 1000;
            var filteredData = contactListHelper.setDataForRole(self.selectionModel.multiFilters, self.pageNumForRole, self.pageSizeForRole, self.isAll);
            contactFactory.exportRoleViewData(filteredData)
                .then(function (response) {
                    var filename = "Role_Based_Contacts";
                    var linkElement = document.createElement('a');
                    try {
                        var blob = new Blob([response], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                        var url = window.URL.createObjectURL(blob);

                        linkElement.setAttribute('href', url);
                        linkElement.setAttribute("download", filename + ".xlsx");

                        var clickEvent = new MouseEvent("click", {
                            "view": window,
                            "bubbles": true,
                            "cancelable": false
                        });
                        linkElement.dispatchEvent(clickEvent);
                    } catch (ex) {
                        console.log(ex);
                    }
                })
        }

        function getMoreRoleContacts() {
            self.pageNumForRole = self.pageNumForRole + 1;
            var filterData = contactListHelper.setDataForRole(self.selectionModel.multiFilters, self.pageNumForRole, self.pageSizeForRole);
            self.roleDataCallOnGoing = true;
            contactFactory.getRoleViewData(filterData)
                .then(function (response) {

                    _.forEach(response.contacts, function (item) {
                        self.allContacts.push(item);
                    })

                    processRoleContacts(response.contacts);
                    self.allContactLength = self.allContacts.length;
                })
        }

        function getAllRoleContacts(all) {
            self.isAllRole = true;
            if (utils.isNotEmptyVal(all)) {
                var filterData = contactListHelper.setDataForRole(self.selectionModel.multiFilters, self.pageNumForRole, self.pageSizeForRole, all);
                self.roleDataCallOnGoing = true;
                contactFactory.getRoleViewData(filterData)//contactData
                    .then(function (response) {
                        self.allContacts = response.contacts;
                        self.updatedData = [];
                        processRoleContacts(response.contacts);
                        self.allContactLength = self.allContacts.length;
                    })
            }
        }

        function filterRetainForRole() {
            var filtertext = self.filters.filterTextForRole;
            sessionStorage.setItem("contact_filtertextForRole", filtertext);

        }

        self.contactRoleGrid = {
            headers: contactListHelper.getContactRoleGrid(),
            selectedItems: []
        };

        self.display = {
            filtered: true,
            contactListReceived: false,
            contactSelected: {}
        };
        function selectAllRoleContact(isSelected) {
            if (isSelected === true) {
                self.contactRoleGrid.selectedItems = angular.copy(self.updatedData);
            } else {
                self.contactRoleGrid.selectedItems = [];
            }

        }

        function allContactRoleSelected() {
            if (self.updatedData.length != 0)
                return self.contactRoleGrid.selectedItems.length === self.updatedData.length;
        };


        // select manual matter notes
        function isContactRoleSelected(contactid) {
            var dataForPrint = [];
            angular.forEach(self.contactRoleGrid.selectedItems, function (conDetail, index) {
                if (conDetail.isFirst == true) {
                    dataForPrint.push(conDetail);

                }
            });
            var contactIds = _.pluck(dataForPrint, 'contact_id');
            return contactIds.indexOf(contactid.contact_id) > -1;

        }

        function printRoleView(selectedItems) {

            if (!selectedItems || (selectedItems && selectedItems.length == 0)) {
                contactFactory.printRoleContacts(self.updatedData, self.selectionModel.multiFilters);

            } else {
                var dataForPrint = [];
                var selectedIds = _.pluck(selectedItems, 'contact_id');
                if (selectedIds.length == self.updatedData.length) {
                    dataForPrint = angular.copy(self.updatedData);
                } else {
                    angular.forEach(self.updatedData, function (conDetail, index) {
                        if (selectedIds.indexOf(conDetail.contact_id) > -1) {
                            dataForPrint.push(conDetail);
                        }
                    });
                }

                contactFactory.printRoleContacts(dataForPrint, self.selectionModel.multiFilters);
            }
        }

        function processRoleContacts(response) {
            angular.forEach(response, function (contactObj, index) {
                var hasSubRecords = (contactObj.matter_detail && contactObj.matter_detail.length > 1) ? true : false;
                angular.forEach(contactObj.matter_detail, function (conDetail, index) {
                    var obj = {};
                    obj.contact_id = contactObj.contact_id;
                    obj.contactid = obj.contact_id;
                    obj.totalRecords = (contactObj.matter_detail.length - 1);
                    obj.isFirst = (index == 0) ? true : false;
                    obj.open = false;
                    obj.hasSubRecords = hasSubRecords;
                    obj.contact_name = (index == 0) ? contactObj.contact_name : "";
                    obj.type = (index == 0) ? contactObj.type : "";
                    obj.contact_type = (index == 0) ? contactObj.contact_type : "";
                    obj.matter_name = conDetail.matter_name;
                    obj.role = conDetail.role;
                    obj.status = conDetail.status;
                    obj.sub_status = conDetail.sub_status;
                    obj.specialty = contactObj.specialty;
                    self.updatedData.push(obj);
                });
            });
            self.noRoleData = (self.updatedData.length == 0) ? true : false;
            self.roleDataCallOnGoing = false;
        }

        function tagCancelForRoleView(cancelled) {
            self.pageNumForRole = 1;
            var scrollPos = $(window).scrollTop();
            contactListHelper.spliceFilterForRoleView(cancelled, self.selectionModel.multiFilters);
            sessionStorage.setItem('roleViewFilter', JSON.stringify(self.selectionModel.multiFilters));
            self.pageNum = 1;
            getRoleData(self.selectionModel.multiFilters);
            $(window).scrollTop(scrollPos - 1);
        }

        function getRoleData(roleInfo, call) {
            self.pageNumForRole = 1;
            var filtertext = sessionStorage.getItem("contact_filtertextForRole");
            if (utils.isNotEmptyVal(filtertext)) {
                self.filters.filterTextForRole = filtertext;
            }
            if (utils.isEmptyVal(roleInfo.roles) && utils.isEmptyVal(roleInfo.type)) {
                self.updatedData = [];
                self.noRoleData = false;
                self.allContacts = [];
                self.tagList = contactListHelper.generateTags(self.selectionModel.multiFilters);
                self.contactRoleGrid.selectedItems = [];
                //persist filters
                sessionStorage.setItem("roleViewFilter", JSON.stringify(self.selectionModel.multiFilters));
            } else {
                self.roleDataCallOnGoing = true;
                var filterData = contactListHelper.setDataForRole(roleInfo, self.pageNumForRole, self.pageSizeForRole);
                contactFactory.getRoleViewData(filterData)
                    .then(function (response) {

                        self.updatedData = [];
                        self.contactRoleGrid.selectedItems = [];
                        processRoleContacts(response.contacts);
                        self.allContacts = response.contacts;
                    });
                contactFactory.getRoleViewData(filterData)
                    .then(function (res) {
                        self.totalCount = res.count;
                    });
            }

        }

        $scope.$on("persistState", function () {
            // sessionStorage.setItem("contactList", JSON.stringify(self.selectedFilters));
            if ($rootScope.onContactManager == true) {
                localStorage.setItem('contactList', JSON.stringify(self.selectedFilters))
            } else if ($rootScope.onIntake) {
                localStorage.setItem('intake_contactList', JSON.stringify(self.selectedFilters))
            } else if ($rootScope.onMatter) {
                localStorage.setItem('matter_contactList', JSON.stringify(self.selectedFilters))
            }
            $rootScope.onContactManager == true ? localStorage.setItem('contactList', JSON.stringify(self.selectedFilters)) : localStorage.setItem('intake_contactList', JSON.stringify(self.selectedFilters));
            // localStorage.setItem("contactList", JSON.stringify(self.selectedFilters));

        });

        //set email signature
        function getUserEmailSignature() {
            mailboxDataService.emailSignature()
                .then(function (data) {
                    if (utils.isNotEmptyVal(data.data)) {
                        self.signature = data.data[0];
                        self.signature = '<br/><br/>' + self.signature;
                    }
                });
        }

        //US#8330
        $scope.$on('composeEmailFromContact', function (event, data) {
            if (!(window.isDrawerOpen)) {
                self.compose = true;
                var html = "";
                html += (self.signature == undefined) ? '' : self.signature;
                self.composeEmail = html;
                $rootScope.updateComposeMailMsgBody(self.composeEmail, '', '', '', 'contactEmail', data);
            }
        });

        //US#8330
        $rootScope.$on("callCloseComposeMail", function () {
            closeComposeMail();
        });

        //US#8330
        function closeComposeMail() {
            self.compose = false;
            //getContactCard(vm.getContact);
        }

        function getContactList() {
            self.pageNum = 1; // show added on first page
            contactFactory.getGlobalContactsList(self.pageNum, self.pageSize, self.selectedFilters, self.contactExtraFilter, self.JavaFilterAPIForContactList)
                .then(function (response) {

                    self.contacts = contactListHelper.setContactResponse(response.data);
                    contactFactory.getPhonesInSeq(self.contacts);
                    contactListHelper.constructName(self.contacts, self.salutations);
                    contactListHelper.setAddress(self.contacts);
                    self.totalRecords = response.count;
                    contactListHelper.formatObject(self.contacts);
                    self.clxGridOptions.selectedItems = [];
                    self.total = response.count;
                    //see for preselected contact
                    var selectedContact = contactListHelper.getContact();
                    if (angular.isDefined(selectedContact) && !utils.isEmptyObj(selectedContact)) { }

                    //persist filters
                    if ($rootScope.onContactManager == true) {
                        var filtertext = localStorage.getItem('contact_filtertext')
                    } else if ($rootScope.onIntake == true) {
                        var filtertext = localStorage.getItem('intake_contact_filtertext')
                    } else if ($rootScope.onMatter == true) {
                        var filtertext = localStorage.getItem('matter_contact_filtertext')
                    }

                    if (utils.isNotEmptyVal(filtertext)) {
                        self.filters.filterText = filtertext;
                    }
                    if ($rootScope.onContactManager == true) {
                        localStorage.setItem('contactList', JSON.stringify(self.selectedFilters))
                    } else if ($rootScope.onIntake) {
                        localStorage.setItem('intake_contactList', JSON.stringify(self.selectedFilters))
                    } else if ($rootScope.onMatter) {
                        localStorage.setItem('matter_contactList', JSON.stringify(self.selectedFilters))
                    }


                    // sessionStorage.setItem("contactList", JSON.stringify(self.selectedFilters));
                    if ($rootScope.onContactManager == true) {
                        localStorage.setItem('contactExtraFilter', JSON.stringify(self.contactExtraFilter))
                    } else if ($rootScope.onIntake) {
                        localStorage.setItem('intake_contactExtraFilter', JSON.stringify(self.contactExtraFilter))
                    } else if ($rootScope.onMatter) {
                        localStorage.setItem('matter_contactExtraFilter', JSON.stringify(self.contactExtraFilter))
                    }
                    // $rootScope.onContactManager == true ? localStorage.setItem("contactExtraFilter", JSON.stringify(self.contactExtraFilter)) : localStorage.setItem("intake_contactExtraFilter", JSON.stringify(self.contactExtraFilter));
                    // sessionStorage.setItem("contactExtraFilter", JSON.stringify(self.contactExtraFilter));
                }, function (reason) { });

        }

        function setBreadcrums() {
            var initCrum = [];
            if ($rootScope.onIntake) {
                initCrum = [{ name: '...' }, { name: 'Contacts' }];
            }
            else if ($rootScope.onMatter) {
                initCrum = [{ name: '...' }, { name: 'Contacts' }];
            }
            routeManager.setBreadcrum(initCrum);
        }

        self.reachedBottom = function () {
            if (self.limit <= self.total) {
                self.limit += initLimit;
            }
        }
        self.reachedTop = function () {
            self.limit = initLimit;
        }

        self.clxGridOptions = {
            headers: contactListHelper.getGridHeaders(),
            selectedItems: []
        };



        self.openAddContact = function () {
            var modalInstance = contactFactory.openContactModal();
            modalInstance.result.then(function () {
                self.pageNum = 1;   //Bug#11910
                getContactList();
            });
        }

        self.setData = function (contactObj) {
            var contactInfo = angular.copy(contactObj);
            contactInfo.name = contactInfo.first_name ? contactInfo.first_name : '';
            contactInfo.name += ' ' + (contactInfo.middle_name ? contactInfo.middle_name : ''); //US#7017 changes to add middlename
            contactInfo.name += ' ' + (contactInfo.last_name ? contactInfo.last_name : '');

            contactInfo.address.street = utils.isNotEmptyVal(contactInfo.address.street) ? (contactInfo.address.street) : '';
            contactInfo.address.street = utils.isEmptyVal(contactInfo.address.street) ? '' : contactInfo.address.street;

            contactInfo.address.cityState = utils.isNotEmptyVal(contactInfo.address.city) ? (contactInfo.address.city) : '';
            contactInfo.address.cityState += (utils.isNotEmptyVal(contactInfo.address.city) && utils.isNotEmptyVal(contactInfo.address.state)) ? ', ' : '';
            contactInfo.address.cityState += utils.isNotEmptyVal(contactInfo.address.state) ? (contactInfo.address.state) : '';
            contactInfo.address.cityState = utils.isEmptyVal(contactInfo.address.cityState) ? '' : contactInfo.address.cityState;

            contactInfo.address.zipcode = utils.isEmptyVal(contactInfo.address.zipcode) ?
                undefined : contactInfo.address.zipcode;

            contactInfo.specialty = contactInfo.specialty ? contactInfo.specialty : '';
            contactInfo.fax_number = contactInfo.fax_numbers ? contactInfo.fax_numbers : '';

            return contactInfo;
        }

        self.openEditContact = function () {
            if (self.clxGridOptions.selectedItems[0].contact_type == "Global") {
                notificationService.error("user can not edit global contact");
                return;
            }
            var contact = {};
            contact.contact_id = self.clxGridOptions.selectedItems[0].contact_id;
            contact.contact_type = self.clxGridOptions.selectedItems[0].contact_type;

            var url = globalContactConstants.RESTAPI.getContactById1 + contact.contact_id + '?type=' + contact.contact_type;
            $http({
                url: url,
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem('accessToken'),
                    'Content-type': 'application/json'
                }
            })
                .then(function (response) {
                    var contactData = response.data;
                    var formattedData = self.setData(contactData);
                    var modalInstance = contactFactory.openEditContactModal(angular.copy(formattedData))
                    modalInstance.result.then(function () {
                        getContactList();
                    });
                });


        }

        self.openFilters = function () {
            var scrollPos = $(window).scrollTop();




            var modalInstance = $modal.open({
                templateUrl: 'app/contact/contact-filter.html',
                controller: 'GlobalContactFiltersCtrl as filterCntrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    type: function () {
                        return self.contactType;
                    },
                    states: function () {
                        return self.states;
                    },
                    selectedFilters: function () {
                        return self.selectedFilters;
                    },
                    contactExtraFilter: function () {
                        return self.contactExtraFilter;
                    },
                    JavaFilterAPIForContactList: function () {
                        return self.JavaFilterAPIForContactList;
                    },
                    tags: function () {
                        return self.tags;
                    }
                }
            });

            modalInstance.result.then(function (response) {
                self.pageNum = 1;
                if (response.action == "RESET") {
                    self.pageNum = 1;
                    self.contacts = [];
                    self.selectedFilters = {};
                    self.tags = [];
                    getContactList();
                } else {
                    self.contacts = response.filterData.data;
                    self.contacts = contactListHelper.setContactResponse(self.contacts);
                    contactListHelper.constructName(self.contacts, self.salutations);
                    contactListHelper.formatObject(self.contacts);
                    contactFactory.getPhonesInSeq(self.contacts);
                    self.selectedFilters = response.filters;
                    self.contactExtraFilter = response.extraFilter;
                    self.tags = contactListHelper.prepareTags(self.selectedFilters, self.contactType, self.states, self.contactExtraFilter);
                    self.totalRecords = response.filterData.count;
                    self.total = response.filterData.count;
                }
                //persist filters
                if ($rootScope.onContactManager == true) {
                    localStorage.setItem('contactList', JSON.stringify(self.selectedFilters))
                } else if ($rootScope.onIntake) {
                    localStorage.setItem('intake_contactList', JSON.stringify(self.selectedFilters))
                } else if ($rootScope.onMatter) {
                    localStorage.setItem('matter_contactList', JSON.stringify(self.selectedFilters))
                }
                // sessionStorage.setItem("contactList", JSON.stringify(self.selectedFilters));
                if ($rootScope.onContactManager == true) {
                    localStorage.setItem('contactExtraFilter', JSON.stringify(self.contactExtraFilter))
                } else if ($rootScope.onIntake) {
                    localStorage.setItem('intake_contactExtraFilter', JSON.stringify(self.contactExtraFilter))
                } else if ($rootScope.onMatter) {
                    localStorage.setItem('matter_contactExtraFilter', JSON.stringify(self.contactExtraFilter))
                }
                // sessionStorage.setItem("contactExtraFilter", JSON.stringify(self.contactExtraFilter));
                $(window).scrollTop(scrollPos - 1);

            }, function () {
                //console.log('filters closed');

            });

        };

        self.openFilterForRole = function () {
            var scrollPos = $(window).scrollTop();




            var modalInstance = $modal.open({
                templateUrl: 'app/contact/contact-role_viewFilter.html',
                controller: 'RoleViewFilterCtrl as roleViewFilterCtrl',
                windowClass: 'valuation-window',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    filters: function () {
                        return angular.copy(self.selectionModel.multiFilters)
                    },
                    tags: function () {
                        return self.tagList;
                    }
                }
            });

            modalInstance.result.then(function (response) {
                self.APICall = response.APICall;
                delete response.APICall;
                self.selectionModel.multiFilters = response;
                if (utils.isEmptyVal(self.selectionModel.multiFilters.roles) && utils.isEmptyVal(self.selectionModel.multiFilters.type)) {
                    if (self.APICall == true) {
                        self.tagList = contactListHelper.generateTags(self.selectionModel.multiFilters);
                        //persist filters
                        sessionStorage.setItem("roleViewFilter", JSON.stringify(response));
                        getRoleData(self.selectionModel.multiFilters, self.APICall);
                        self.contactRoleGrid.selectedItems = [];
                    } else {
                        self.updatedData = [];
                        self.allContacts = [];
                        self.tagList = contactListHelper.generateTags(self.selectionModel.multiFilters);
                        self.contactRoleGrid.selectedItems = [];
                        //persist filters
                        sessionStorage.setItem("roleViewFilter", JSON.stringify(response));
                    }
                } else {
                    self.tagList = contactListHelper.generateTags(self.selectionModel.multiFilters);
                    //persist filters
                    sessionStorage.setItem("roleViewFilter", JSON.stringify(response));
                    getRoleData(self.selectionModel.multiFilters, self.APICall);
                }

                $(window).scrollTop(scrollPos - 1);

            }, function () {

                //console.log('filters closed');
            });

        };
        /**
       * Forced directed graph
       */
        self.nodeGraph = function (args) {
            var scrollPos = $(window).scrollTop();

            var modalInstance = $modal.open({
                templateUrl: 'app/contact/relationship-graph.html',
                controller: 'RelationshipGraphCtrl as relationGraphCtrl',
                resolve: {
                    contactdetails: function () {
                        return args;
                    }
                }
            });

            modalInstance.result.then(function (response) {

            }, function () {
                self.clxGridOptions.selectedItems = [];
            });

        };


        self.openContactCard = function (contact) {
            contactFactory.displayContactCard1(contact.contact_id, contact.edited, contact.contact_type);
            contact.edited = false;
        };

        $rootScope.nodeModelClose = function () {
            self.clxGridOptions.selectedItems = [];
        };

        $scope.$on('contactCardEdited', function (e, editedContact) {
            self.clxGridOptions.selectedItems = [];

            var contactObj = editedContact;
            var index = _.findIndex(self.contacts, function (contact) {
                return contact.contact_id === contactObj.contact_id;
            });

            var toBeUpdated = self.contacts[index];
            var updatedContact = angular.extend({}, toBeUpdated, contactObj);
            updatedContact.phone = utils.isNotEmptyVal(updatedContact.phone_numbers) ?
                updatedContact.phone_numbers.replace(/,/g, "<br/>") : updatedContact.phone_numbers;
            updatedContact.email = utils.isNotEmptyVal(updatedContact.email_ids) ?
                updatedContact.email_ids.replace(/,/g, "<br/>") : updatedContact.email_ids;
            updatedContact.fax_number = utils.isNotEmptyVal(updatedContact.fax_numbers) ?
                updatedContact.fax_numbers.replace(/,/g, "<br/>") : updatedContact.fax_numbers;

            if (utils.isNotEmptyVal(updatedContact.address)) {
                updatedContact.address_id = utils.isNotEmptyVal(updatedContact.address[0].address_id) ? updatedContact.address[0].address_id : '';
                updatedContact.city = utils.isNotEmptyVal(updatedContact.address[0].city) ? updatedContact.address[0].city : '';
                updatedContact.state = utils.isNotEmptyVal(updatedContact.address[0].state) ? updatedContact.address[0].state : '';
                updatedContact.street = utils.isNotEmptyVal(updatedContact.address[0].street) ? updatedContact.address[0].street : '';
                updatedContact.zip_code = utils.isNotEmptyVal(updatedContact.address[0].zip_code) ? updatedContact.address[0].zip_code : '';
            }
            contactListHelper.constructNameAndTitle(updatedContact, self.salutations);
            updatedContact.edited = true;

            contactFactory.getPhonesInSeq([updatedContact]);

            self.contacts[index] = updatedContact;
            if (self.isRoleView == true) {
                getRoleData(self.selectionModel.multiFilters);
            }
        });

        //checkbox select state manager start
        self.selectAllContact = function (selected) {
            if (selected) {
                self.clxGridOptions.selectedItems = angular.copy(self.contacts);
            } else {
                self.clxGridOptions.selectedItems = [];
            }
        };

        function allContactSelected() {
            if (self.contacts.length != 0)
                return self.clxGridOptions.selectedItems.length === self.contacts.length;
        };

        self.isContactSelected = function (contact) {
            var ids = _.pluck(self.clxGridOptions.selectedItems, 'contact_id');
            return ids.indexOf(contact.contact_id) > -1;
        };

        //checkbox select state manager end


        // get more contacts
        self.getMoreContacts = function () {
            //Bug#5015
            if (localStorage.getItem('pageMore') == 'false') {
                self.pageNum = 1;
                localStorage.setItem('pageMore', 'true');
            }
            self.pageNum++;
            contactFactory.getGlobalContactsList(self.pageNum, self.pageSize, self.selectedFilters, self.contactExtraFilter, self.JavaFilterAPIForContactList)
                .then(function (data) {
                    //add new contact in list
                    if (data && data.data) {
                        angular.forEach(data.data, function (contactObj, index) {
                            self.contacts.push(contactObj);
                            self.contacts = contactListHelper.setContactResponse(self.contacts);
                            contactListHelper.constructName(self.contacts, self.salutations);
                        });
                    }
                    contactFactory.getPhonesInSeq(self.contacts);
                });
        };
        // get all contacts
        self.getAllContacts = function () {
            self.isAll = true;
            self.pageNum = 1; // show all on first page
            self.pageSize = '250';
            contactFactory.getGlobalContactsList(self.pageNum, self.pageSize, self.selectedFilters, self.contactExtraFilter, self.JavaFilterAPIForContactList, self.isAll)
                .then(function (data) {
                    //add new contact in list
                    if (data && data.data) {
                        self.contacts = data.data;
                        self.contacts = contactListHelper.setContactResponse(self.contacts);
                        contactListHelper.formatObject(self.contacts);
                        contactListHelper.constructName(self.contacts, self.salutations);
                        contactFactory.getPhonesInSeq(self.contacts);
                    }
                });
        };

        self.print = function () {
            contactFactory.printContacts(self.contacts, self.selectedFilters, self.contactExtraFilter);
        }

        function setexportdata(selectedFilter) {
            var contact = {};
            var postObj = {};
            contact.filter = {};
            contact.page = [];
            contact.type = utils.isNotEmptyVal(selectedFilter.type) ? selectedFilter.type : ['All'];
            contact.filter.state = utils.isNotEmptyVal(selectedFilter.statename) ? selectedFilter.statename : '';
            var params = { 'pageNum': selectedFilter.pageNum, 'pageSize': selectedFilter.pageSize };
            contact.page.push(params);
            postObj.contact = []
            postObj.contact.push(contact);
            return postObj;
        }



        self.exportContact = function () {
            self.isAll = true;
            self.pageSize = 1000;
            //var postData = setexportdata(self.selectedFilters);
            contactFactory.exportContacts(self.selectedFilters, self.contactExtraFilter, self.pageSize, self.isAll)
                .then(function (response) {
                    var filename = "ContactList";
                    var linkElement = document.createElement('a');
                    try {
                        var blob = new Blob([response], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                        var url = window.URL.createObjectURL(blob);

                        linkElement.setAttribute('href', url);
                        linkElement.setAttribute("download", filename + ".xlsx");

                        var clickEvent = new MouseEvent("click", {
                            "view": window,
                            "bubbles": true,
                            "cancelable": false
                        });
                        linkElement.dispatchEvent(clickEvent);
                    } catch (ex) {
                        console.log(ex);
                    }
                })
        };

        self.deleteContacts = function (selectedData, filterdContact) {

            if (utils.isNotEmptyVal(self.filters.filterText) && allContactSelected()) {
                selectedData = filterdContact;
            }


            self.localContactSelected = {};
            var actionButton = 'Delete';
            var msg = 'Are you sure you want to delete ?'

            self.localContactSelected = _.filter(selectedData, function (contact) {
                return contact.contact_type != "Global";

            });
            self.globalContactSelected = _.filter(selectedData, function (contact) {
                return contact.contact_type == "Global";

            });


            if (self.globalContactSelected.length > 0) {
                var msg = "You are not allowed to delete global Contact(s).";
                actionButton = '';
            }

            if (self.globalContactSelected.length > 0 && self.localContactSelected.length > 0) {
                var total = self.globalContactSelected.length + self.localContactSelected.length;
                var msg = "Out of " + total + " contact(s), only " + self.localContactSelected.length + " contact(s) will be deleted. " + self.globalContactSelected.length + " global contact(s) can not be deleted. "
                actionButton = 'Delete';
            }

            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: actionButton,
                headerText: 'Confirmation!',
                bodyText: msg
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                var cid = _.pluck(self.localContactSelected, 'contact_id');
                var promesa = contactFactory.deleteContact(cid);
                promesa.then(function (data) {
                    self.pageNum = 1;
                    getContactList();
                    notificationService.success('Contact(s) deleted successfully');
                }, function (error) {
                    notificationService.error('Unable to delete!');
                });

            });

        };


        self.tagCancelled = function (cancelled) {
            var scrollPos = $(window).scrollTop();
            contactListHelper.spliceFilter(cancelled, self.selectedFilters, self.contactExtraFilter);
            self.pageNum = 1;
            getContactList();
            $(window).scrollTop(scrollPos - 1);
        }
    }

})();

(function () {
    'use strict';

    angular.module('cloudlex.contact')
        .factory('contactListHelper', contactListHelper);

    function contactListHelper() {
        var selectedContact = {};

        return {
            setContact: setContact,
            getContact: getContact,
            getGridHeaders: getGridHeaders,
            formatObject: formatObject,
            prepareTags: prepareTags,
            spliceFilter: spliceFilter,
            constructName: constructName,
            constructNameAndTitle: constructNameAndTitle,
            setAddress: setAddress,
            generateTags: generateTags,
            setDataForRole: setDataForRole,
            getContactRoleGrid: getContactRoleGrid,
            spliceFilterForRoleView: spliceFilterForRoleView,
            //getFax:getFax
            setContactResponse: setContactResponse
        };

        function getContactRoleGrid() {

        }

        function setDataForRole(roleData, pageNum, pageSize, all) {
            var contactData = {};
            contactData.roles = utils.isNotEmptyVal(roleData.roles) ? _.pluck(roleData.roles, 'name') : [];
            contactData.types = utils.isNotEmptyVal(roleData.type) ? roleData.type : [];
            var role = _.pluck(roleData.roles, 'id').toString();
            var roleIds = role.split(',').map(function (item) {
                return parseInt(item, 10);
            });
            contactData.roleids = utils.isNotEmptyVal(roleData.roles) ? roleIds : [];
            contactData.page_number = pageNum;
            contactData.page_size = pageSize;
            contactData.all_contacts = (all == true || all == "all") ? 1 : 0;
            return contactData;
        }

        function setContactResponse(contact) {
            var contacts = angular.copy(contact);
            var contactList = [];
            _.forEach(contacts, function (contact) {
                _.forEach(contact, function (val, key) {
                    if (key == "address" && utils.isNotEmptyVal(contact[key])) {
                        contact.address_id = contact.address[0].address_id,
                            contact.city = contact.address[0].city,
                            contact.country = contact.address[0].country,
                            contact.state = contact.address[0].state,
                            contact.street = contact.address[0].street,
                            contact.zip_code = contact.address[0].zip_code,
                            contactList.push(contact);
                    }
                })
            });
            return contactList;

        }

        function setContact(contact) {
            selectedContact = contact;
        }

        function getContact() {
            return selectedContact;
        }

        function getGridHeaders() {
            return [{
                field: [{
                    prop: 'name',
                    onClick: "contactList.openContactCard(data)",
                    cursor: true,
                    underline: true
                }],
                displayName: 'Name',
                dataWidth: "15"
            },
            {
                field: [{
                    prop: 'type'
                }, {
                    prop: 'specialty',
                    filter: 'replaceByDash'
                }],
                displayName: 'Type & Specialty',
                dataWidth: "15"
            },
            {
                field: [{
                    prop: 'email_ids',
                    tooltipOption: {
                        html: true,
                        template: '<span class="tooltip" style="width:auto" role="tooltip">' +
                            '<span class="tooltip-inner display-inline-block"></span>' +
                            '</span>'
                    },
                }],
                displayName: 'Email ID',
                dataWidth: "17"
            },
            {
                field: [/*{
                prop: 'phonecell',
                html: '<div><span class="sprite default-contactPhone-new"></span><span ng-bind="data.phone_cell"></span></div>',
                
            },*/
                    {
                        prop: 'phone_home',
                        html: '<div><div ng-show="data.phoneType1 == 1"><span tooltip-placement="bottom" tooltip="Cell"  class="sprite default-contactPhone-new"></span><span class="cell contactphonemerge"  ng-bind="data.phone1"></span></div>' +
                            '<div ng-show="data.phoneType1 == 2"><span tooltip-placement="bottom" tooltip="Home"  class="sprite default-contactPhone-home-new"></span><span class="cell contactphonemerge"  ng-bind="data.phone1"></span></div>' +
                            '<div ng-show="data.phoneType1 == 3"><span tooltip-placement="bottom" tooltip="Work"  class="sprite default-contactPhone-work-new"></span><span class="cell contactphonemerge"  ng-bind="data.phone1"></span></div>'
                            +
                            '<div ng-show="data.phoneType2 == 3"><span tooltip-placement="bottom" tooltip="Work"  class="sprite default-contactPhone-work-new"></span><span class="cell contactphonemerge"  ng-bind="data.phone2"></span></div>' +
                            '<div ng-show="data.phoneType2 == 1"><span tooltip-placement="bottom" tooltip="Cell"  class="sprite default-contactPhone-new"></span><span class="cell contactphonemerge"  ng-bind="data.phone2"></span></div>' +
                            '<div ng-show="data.phoneType2 == 2"><span tooltip-placement="bottom" tooltip="Home"  class="sprite default-contactPhone-home-new"></span><span class="cell contactphonemerge"  ng-bind="data.phone2"></span></div>' +

                            '</div>'
                    }],
                displayName: 'Phone',
                dataWidth: "24"
            },
            {
                field: [{
                    prop: 'fax_numbers',
                    tooltipOption: {
                        html: true,
                        template: '<span class="tooltip" style="width:auto" role="tooltip">' +
                            '<span class="tooltip-inner display-inline-block"></span>' +
                            '</span>'
                    }
                }],
                displayName: 'Fax#',
                dataWidth: "9"
            },
			/* {
                 field: [{
                     prop: 'zipcode',
                     tooltipOption: {
                         html: true,
                         template: '<span class="tooltip" style="width:auto" role="tooltip">' +
                             '<span class="tooltip-inner display-inline-block"></span>' +
                             '</span>'
                     }
                 }],
                 displayName: 'ZIP Code',
                 dataWidth: "7"
             },*/
            {
                field: [{
                    prop: 'street',
                    filter: 'replaceByDash'
                },
                {
                    prop: 'city',
                    filter: 'replaceByDash'
                },
                {
                    prop: 'state',
                    filter: 'replaceByDash'
                },
                {
                    prop: 'zip_code',
                    filter: 'replaceByDash'
                }
                ],
                displayName: 'Address',
                dataWidth: "14"
            }
            ];
        }

        function formatObject(con) // to format phone and email id
        {
            var obj;
            for (obj in con) {
                if (utils.isNotEmptyVal(con[obj].phone)) {
                    con[obj].phone = con[obj].phone.replace(/,/g, "<br/>");
                }

                if (utils.isNotEmptyVal(con[obj].email_ids)) {
                    con[obj].email = con[obj].email_ids.replace(/,/g, "<br/>");
                }

                if (utils.isNotEmptyVal(con[obj].faxnumber)) {
                    con[obj].faxnumber = con[obj].faxnumber.replace(/,/g, "<br/>");
                }
            }
        }

        // prepare tags
        function prepareTags(selectedFilters, type, states, extraFilter) {
            var tags = [];
            // category
            _.forEach(selectedFilters.type, function (data) {
                angular.forEach(type, function (value, key) {
                    if (value == data) {
                        tags.push({ 'key': data, 'value': value, 'type': 'type' });
                    }
                });
            })
            // state
            angular.forEach(states, function (value, key) {
                if (value.name == selectedFilters.statename) {
                    tags.push({ 'key': value.name, 'value': value.name, 'type': 'state' });
                }
            });
            /**
             * Add extra filter for contact
             * @ exclude global contacts
             */
            if (extraFilter != undefined) {
                if (extraFilter.egc_type == true) {
                    tags.push({ 'key': "Exclude Global Contacts", 'value': "Exclude Global Contacts", 'type': 'type' });
                }
            }
            return tags;
        }
        function generateTags(filter) {
            var tags = [];
            _.forEach(filter.roles, function (item) {
                tags.push({ 'key': item.id, 'value': 'Role : ' + item.name, 'type': 'role' });
            })
            _.forEach(filter.type, function (item, key) {
                tags.push({ 'key': item, 'value': 'Type : ' + item, 'type': 'type' });
            })


            return tags;
        }

        function spliceFilterForRoleView(cancelled, selectedFilter) {
            switch (cancelled.type) {
                case 'type':
                    var idx;
                    _.forEach(selectedFilter.type, function (item, index) {
                        if (item.id == cancelled.key) {
                            idx = index;
                        }
                    });
                    selectedFilter.type.splice(idx, 1);
                    break;

                case 'role':
                    var idxs;
                    _.forEach(selectedFilter.roles, function (item, index) {
                        if (item.id == cancelled.key) {
                            idxs = index;
                        }
                    })
                    selectedFilter.roles.splice(idxs, 1);
                    break;
            }
        }

        function spliceFilter(cancelled, selectedFilters, contactExtraFilter) {
            if (cancelled.key == "Exclude Global Contacts") {
                contactExtraFilter.egc_type = false;
            }
            if (cancelled.key != "Exclude Global Contacts") {
                if (cancelled.type == 'type') {
                    var idx = selectedFilters.type.indexOf(cancelled.key);
                    selectedFilters.type.splice(idx, 1);
                } else if (cancelled.type == 'state') {
                    delete selectedFilters.statename;
                }
            }

        }

        function constructName(contacts, salutations) {
            if (contacts) {
                _.forEach(contacts, function (contact, index) {
                    //contact.name = utils.isNoEmptyVal(contact.firstname) ? contact.firstname : '';
                    //contact.name += ' ' + utils.isNoEmptyVal(contact.lastname) ? contact.lastname : '';
                    //getTitle(contact, salutations);
                    constructNameAndTitle(contact, salutations);
                });
            }
        }

        function constructNameAndTitle(contact, salutations) {
            contact.name = utils.isNotEmptyVal(contact.first_name) ? contact.first_name : '';
            contact.name += ' ';
            contact.name += utils.isNotEmptyVal(contact.last_name) ? contact.last_name : '';
            getTitle(contact, salutations);
        }

        function getTitle(contact, salutations) {
            if (salutations) {
                _.forEach(salutations, function (salObj, index) {
                    if (salObj.id == contact.title) {
                        contact.name = salObj.value + ' ' + contact.first_name + ' ' + contact.last_name;
                    }
                });
            }
        }


        function setAddress(contacts) {
            _.forEach(contacts, function (contact) {
                if (contact.address.length > 0) {
                    _.forEach(contact.address, function (item) {
                        contact.street = utils.isNotEmptyVal(item.street) ? item.street : ' - ';
                        contact.city = utils.isNotEmptyVal(item.city) ? item.city : ' - ';
                        contact.state = utils.isNotEmptyVal(item.state) ? item.state : ' - ';
                        contact.country = utils.isNotEmptyVal(item.country) ? item.country : ' - ';
                        contact.zip_code = utils.isNotEmptyVal(item.zip_code) ? item.zip_code : ' - ';
                        contact.address_type = utils.isNotEmptyVal(item.address_type) ? item.address_type : ' "Other" ';
                    })
                }
            });
        }

    }
})();
(function () {
    'use strict';

    angular
        .module('cloudlex.contact')
        .controller('RoleViewFilterCtrl', RoleViewFilterCtrl);

    RoleViewFilterCtrl.$inject = ['$scope', 'filters', '$modalInstance', 'masterData', 'tags'];

    function RoleViewFilterCtrl($scope, filters, $modalInstance, masterData, tags) {
        var vm = this;
        vm.selectionModel = {};
        vm.selectionModel.type = filters.type;
        vm.selectionModel.roles = filters.roles;
        vm.masterList = masterData.getMasterData();
        vm.viewModel = {};
        vm.apply = apply;
        vm.close = close;
        vm.resetFilters = resetFilters;
        vm.selectionModel.APICall = false;
        vm.tags = tags;
        (function () {
            vm.filter = angular.copy(filters);
        })
        vm.viewModel.type = [];
        _.forEach(vm.masterList.contact_type, function (item, key) {
            vm.viewModel.type.push(item);
        });
        //  vm.viewModel.type = getArray(vm.masterList.contact_type);
        vm.viewModel.roles = moveBlankToBottom(getRolesFilterValues(vm.masterList, 'matter_contact_roles'));

        function getArray(data) {
            var data_array = [];
            angular.forEach(data, function (k, v) { // convert key-val to array for type
                data_array.push(v);

            });
            var type_array = [];
            _.forEach(data_array, function (data, index) {
                type_array.push({ 'id': index, 'name': data });
            })
            return type_array;
        }
        /**
         * matter_contact_roles has cid and c_role_name attribute
         * @param {*} masterList 
         * @param {*} filter 
         */
        function getRolesFilterValues(masterList, filter) {
            return masterList[filter].map(function (item) {
                return {
                    id: item.cid,
                    name: item.c_role_name
                };
            });
        }

        function moveBlankToBottom(array) {
            //make sure array has {id,name} objects
            var values = _.pluck(array, 'name');
            var index = values.indexOf('');
            utils.moveArrayElement(array, index, array.length - 1);
            return array;
        }

        function close() {
            $modalInstance.dismiss();
        }

        $scope.$watch(function () {
            if (vm.selectionModel.type.length > 0 || vm.selectionModel.roles.length > 0 || vm.tags.length > 0) {
                vm.enableApply = false;
            } else {
                vm.enableApply = true;
            }
        })

        function apply(filter) {
            $modalInstance.close(filter);
        }

        function resetFilters() {
            vm.selectionModel.APICall = true;
            vm.selectionModel.type = [];
            vm.selectionModel.roles = [];
        }
    }

})();
