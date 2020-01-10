(function () {
    'use strict';

    angular.module('cloudlex.matter')
        .controller('MatterCollaborationCtrl', MatterCollaborationCtrl);

    MatterCollaborationCtrl.$inject = ["$scope", 'modalService', "matterCollaborationFactory", "$stateParams", "$state", "notification-service", "routeManager", "masterData", '$q'];

    function MatterCollaborationCtrl($scope, modalService, matterCollaborationFactory, $stateParams, $state, notificationService, routeManager, masterData, $q) {

        var matterId = $stateParams.matterId;
        var vm = this;
        vm.matterId = $stateParams.matterId;
        vm.currentRecIndex = -1;
        vm.next = goToNextPage;
        vm.previous = goToPreviousPage;
        vm.save = save;
        vm.cancel = cancelSave;
        vm.isEditMode = false;
        vm.Currentdate = new Date();
        vm.processEmployment = true;
        vm.disableNext = disableNext;
        vm.goToPage = goToPage;
        vm.getSearchContactStepClass = getSearchContactStepClass;
        vm.getGenInfoStepClass = getGenInfoStepClass;
        vm.getconfirmDetailsStepClass = getconfirmDetailsStepClass;
        vm.getSearchContactConnectorClass = getSearchContactConnectorClass;
        vm.getGenInfoConnectorClass = getGenInfoConnectorClass;
        vm.contacts = [];
        vm.contactEmails = [];
        vm.contactBlockList = [{ contactEntity: {}, contactEntityEmail: "", flag: 0 }];
        // vm.contactBlockList = [{ contactEntity: {}, contactEntityEmail: "" }];
        vm.contactEntity = [];
        vm.contactEntityEmail = [];
        var gracePeriodDetails = masterData.getUserRole();
        vm.firmID = gracePeriodDetails.firm_id;
        vm.addNewEmailForSelectedContact = addNewEmailForSelectedContact;
        vm.selectedContactEmail = selectedContactEmail;
        vm.addContactBlock = addContactBlock;
        vm.removeContactBlock = removeContactBlock;
        vm.sortedContactIds = [];
        vm.goToSelectMatter = goToSelectMatter;

        if (!$stateParams.matterName) {
            vm.matterName = localStorage.getItem('matterNameForCM');
        } else {
            localStorage.setItem('matterNameForCM', $stateParams.matterName);
            vm.matterName = $stateParams.matterName;
        }

        vm.views = {
            DOCUMENT_VIEW: "DOCUMENT_VIEW",
            NOTE_VIEW: "NOTE_VIEW",
            EVENT_VIEW: "EVENT_VIEW"

        };

        vm.showView = function (view) {
            vm.currentView = view;
        };


        function selectedContactEmail(contactObj, index) {
            vm.contactEmails[index] = contactObj.email.split(",");
        }

        function addNewEmailForSelectedContact(email, index) {
            if (!checkAddress(email)) {

                vm.contactBlockList[index].contactEntityEmail = '';
                var emailIdsArr = [];
                var emailIds = vm.contactBlockList[index].contactEntity.email.split(",");
                // _.forEach(emailIds, function (item, index) {
                //     if (utils.isNotEmptyVal(item)) {
                //         emailIdsArr.push({
                //             id: 'email' + index + '1',
                //             value: item.trim()
                //         })
                //     }

                // });

                if (email) {
                    emailIdsArr.push({
                        id: 'email' + emailIds.length + '1',
                        value: email.trim()
                    })
                }

                var saveEmailForContactObj = {
                    email: emailIdsArr,
                    contact_id: parseInt(vm.contactBlockList[index].contactEntity.contactid)
                }

                matterCollaborationFactory.saveEmailForContact(saveEmailForContactObj)
                    .then(function (data) {
                        getContactsAndEmails(vm.matterId);
                        vm['addNewEmailForSelectedContactFlag' + index] = false;
                        vm.contactBlockList[index].contactEntityEmail = email;
                        vm.contactEmails[index].push(email);
                        vm.addNewEmailForSelectedContactModel[index] = '';
                        // notificationService.success('Event deleted successfully!');
                        notificationService.success('The Email ID has been linked to the contact successfully');

                    }, function (data) {
                        // notificationService.error('Event has not been deleted!');
                        notificationService.error('The Email ID has not been linked to the contact successfully');
                    });
            }
        }




        (function () {

            //Set current view
            if ($stateParams.openView) {
                vm.currentView = $stateParams.openView;
            } else {
                vm.currentView = vm.views.DOCUMENT_VIEW;
            }

            vm.currentPage = {
                "searchOrAdd": true,
                "generalInfo": false,
                "otherInfo": false
            };
            vm.completedPages = [];

            if ($state.current) {
                if ($state.current.name === "editPlaintiff") {
                    initiateEditMode();
                }
            }

            setBreadcrum();
            getContactsAndEmails(vm.matterId);

        })();

        vm.newCBLIndexForBlock = 0;
        function addContactBlock(index) {
            vm.newCBLIndexForBlock = vm.newCBLIndexForBlock + 1;
            vm.contactBlockList.push({ contactEntity: {}, contactEntityEmail: "", flag: vm.newCBLIndexForBlock });
        }

        function removeContactBlock(index) {
            var newIndex = _.findIndex(vm.contactBlockList, { flag: index });
            vm.contactBlockList.splice(newIndex, 1);
            vm.contactEmails.splice(newIndex, 1);
        }

        function getContactsAndEmails(matterId) {

            vm.contacts = [];

            var emails = matterCollaborationFactory.getContactsAndEmails(matterId).then(function (data) {
                var contactObj = angular.copy(data);
                /**
                 *  defendant - not added
                 */

                // plaintiff
                if (contactObj && contactObj.plaintiff != undefined) {
                    _.forEach(contactObj.plaintiff, function (item) {
                        var contact = addContactObj(item);
                        vm.contacts.push(contact);
                    });
                }

                // insurance_provider: []
                if (contactObj && contactObj.insurance_provider != undefined) {
                    _.forEach(contactObj.insurance_provider, function (item) {
                        var contact = addContactObj(item);
                        vm.contacts.push(contact);
                    });
                }

                // insured_party: []
                // if (contactObj && contactObj.insured_party != undefined) {
                //     _.forEach(contactObj.insured_party, function (item) {
                //         var contact = addContactObj(item);
                //         vm.contacts.push(contact);
                //     });
                // }

                // medicalbills_service_provider: []
                if (contactObj && contactObj.medicalbills_service_provider != undefined) {
                    _.forEach(contactObj.medicalbills_service_provider, function (item) {
                        var contact = addContactObj(item);
                        vm.contacts.push(contact);
                    });
                }

                // oparty: []
                if (contactObj && contactObj.oparty != undefined) {
                    _.forEach(contactObj.oparty, function (item) {
                        var contact = addContactObj(item);
                        vm.contacts.push(contact);
                    });
                }

                // insurance_adjuster: []
                if (contactObj && contactObj.insurance_adjuster != undefined) {
                    _.forEach(contactObj.insurance_adjuster, function (item) {
                        var contact = addContactObj(item);
                        vm.contacts.push(contact);
                    });
                }

                // lien_insurance_provider: []
                if (contactObj && contactObj.lien_insurance_provider != undefined) {
                    _.forEach(contactObj.lien_insurance_provider, function (item) {
                        var contact = addContactObj(item);
                        vm.contacts.push(contact);
                    });
                }

                // lien_adjuster: []
                if (contactObj && contactObj.lien_adjuster != undefined) {
                    _.forEach(contactObj.lien_adjuster, function (item) {
                        var contact = addContactObj(item);
                        vm.contacts.push(contact);
                    });
                }

                // lien_holder: []
                if (contactObj && contactObj.lien_holder != undefined) {
                    _.forEach(contactObj.lien_holder, function (item) {
                        var contact = addContactObj(item);
                        vm.contacts.push(contact);
                    });
                }

                // physician: []
                if (contactObj && contactObj.physician != undefined) {
                    _.forEach(contactObj.physician, function (item) {
                        var contact = addContactObj(item);
                        vm.contacts.push(contact);
                    });
                }

                // service_provider: []
                if (contactObj && contactObj.service_provider != undefined) {
                    _.forEach(contactObj.service_provider, function (item) {
                        var contact = addContactObj(item);
                        vm.contacts.push(contact);
                    });
                }


                vm.contacts = _.uniq(vm.contacts, function (item) {
                    return item.contactid;
                });


            }, function () {
                // console.log(data);
            });

        }


        function addContactObj(item) {
            var fname = item.fname ? item.fname : "";
            var mname = item.mname ? item.mname : "";
            var lname = item.lname ? item.lname : "";
            var fullname = fname + " " + mname + " " + lname;

            var contact = {
                name: fullname,
                email: item.email,
                contactid: item.contactid,
                type: item.type
            }

            return contact;

        }

        function initiateEditMode() {
            vm.isEditMode = true;
            vm.currentPage["searchOrAdd"] = false;
            vm.currentPage["matterDetails"] = true;
            vm.currentPage["confirmDetails"] = false;

            vm.completedPages.push("searchOrAdd");

        };



        function goToSelectMatter() {
            if (!checkEmailFields(vm.contactBlockList) && checkEmailOpenText() && checkEmailDuplicateUser()) {
                if (vm.completedPages.indexOf("searchOrAdd") >= 0) {
                    var promesa = saveEmail();
                    promesa.then(function () {
                        angular.forEach(vm.currentPage, function (val, key) {
                            vm.currentPage[key] = false;
                        });
                        vm.currentPage['matterDetails'] = true;
                    }, function () {

                    });

                } else {
                    var promesa = saveEmail();
                    promesa.then(function () {
                        nxtPageSetting();
                    }, function () {

                    });

                    // nxtPageSetting();
                }
            }
        }

        function checkEmailOpenText() {
            var flag = true;
            for (var i = 0; i < vm.contactBlockList.length; i++) {
                if (vm['addNewEmailForSelectedContactFlag' + i]) {
                    notificationService.error("Please save an Email ID");
                    flag = false;
                } else {
                }
            }
            return flag;
        }

        function checkEmailDuplicateUser() {
            var duplicateContact = _.uniq(vm.contactBlockList, function (item) {
                return item.contactEntity.contactid;
            });
            if (duplicateContact.length == vm.contactBlockList.length) {
                return true;
            } else {
                notificationService.error("Please remove the duplicate contact");
                return false;
            }

        }

        function goToNextPage() {

            if (!checkEmailFields(vm.contactBlockList) && checkEmailOpenText() && checkEmailDuplicateUser()) {
                var promesa = saveEmail();
                promesa.then(function () {
                    nxtPageSetting();
                }, function () {

                });

            }

        };

        function checkEmailFields(obj) {
            var flagContactEntity = false;
            var flagContactEntityEmail = false;
            var flag = false;
            _.forEach(obj, function (item, index) {
                if (!flagContactEntity) {
                    if (utils.isEmptyObj(item.contactEntity)) {
                        notificationService.error("Please select the contact");
                        flag = true;
                        flagContactEntity = true;
                    }
                    // if (!utils.isNotEmptyVal(item.contactEntityEmail)) {
                    //     notificationService.error("Please select/add email related with collaborate user");
                    //     flag = true;
                    // }
                }

            });
            _.forEach(obj, function (item, index) {
                if (!flagContactEntity && !flagContactEntityEmail) {
                    // if (utils.isEmptyObj(item.contactEntity)) {
                    //     notificationService.error("Please select collaborate user");
                    //     flag = true;
                    // }
                    // checkAddress(item.contactEntityEmail);
                    if (!utils.isNotEmptyVal(item.contactEntityEmail)) {
                        notificationService.error("Please select/add an Email ID");
                        flag = true;
                        flagContactEntityEmail = true;
                    }

                    if (!flagContactEntityEmail && checkAddress(item.contactEntityEmail)) {
                        flag = true;
                        flagContactEntityEmail = true;
                    }
                }

            });
            return flag;
        }

        vm.checkAddress = checkAddress;
        function checkAddress(ids) {
            var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            var validateEmail = emailRegex.test(ids.trim());
            if (!validateEmail) {
                notificationService.error("Please enter a valid Email ID");
            }
            return !validateEmail;
        }

        function nxtPageSetting() {
            angular.forEach(vm.currentPage, function (val, key) {
                if (val) {
                    if (vm.completedPages.indexOf(key) < 0) {
                        vm.completedPages.push(key);
                    }
                }
            });

            vm.currentPage = matterCollaborationFactory.nextPage(angular.copy(vm.currentPage));

            if (vm.currentPage['matterDetails'] != undefined && vm.currentPage.matterDetails) {
                // saveEmail();
            }

            if (vm.currentPage['confirmDetails'] != undefined && vm.currentPage.confirmDetails) {
                confirmDetailsConfig();
            }

        };

        function confirmDetailsConfig() {
            vm.selectedDocuments = JSON.parse(localStorage.getItem('matterCollaborationDocuments'));
            vm.selectedNotes = JSON.parse(localStorage.getItem('matterCollaborationNotes'));
            vm.selectedEvents = JSON.parse(localStorage.getItem('matterCollaborationEvents'));
        }

        function goToPreviousPage() {
            previousPageSetting();
        }

        function previousPageSetting() {
            vm.currentPage = matterCollaborationFactory.previousPage(angular.copy(vm.currentPage));
            vm.currentView = "DOCUMENT_VIEW";
        };

        function goToPage(pageNm) {

            if (pageNm == 'confirmDetails') {
                if (vm.currentPage.hasOwnProperty('matterDetails')) {
                    if (!checkEmailFields(vm.contactBlockList) && checkEmailOpenText() && checkEmailDuplicateUser()) {
                        var promesa = saveEmail();
                        promesa.then(function () {
                            if (vm.currentPage.hasOwnProperty('confirmDetails')) {
                                angular.forEach(vm.currentPage, function (val, key) {
                                    vm.currentPage[key] = false;
                                });
                                vm.currentPage['confirmDetails'] = true;
                                confirmDetailsConfig();
                            } else {
                                nxtPageSetting();
                            }
                        }, function () {

                        });
                    }
                }
            } else {
                if (vm.completedPages.indexOf("searchOrAdd") >= 0) {

                    angular.forEach(vm.currentPage, function (val, key) {
                        vm.currentPage[key] = false;
                    });

                    vm.currentPage[pageNm] = true;
                }
            }
        };

        function saveEmail() {

            var deferred = $q.defer();

            var contactIds = [];
            var flagForPostMatterCollaboration = 0;

            _.forEach(vm.contactBlockList, function (contact, index) {
                contactIds.push({
                    id: parseInt(contact.contactEntity.contactid),
                    emailId: (contact.contactEntityEmail) ? contact.contactEntityEmail.trim() : '',
                    contactName: contact.contactEntity.name
                })
            })

            _.forEach(contactIds, function (contact, index, array) {

                matterCollaborationFactory.checkValidateUserMattercollaboration(parseInt(vm.matterId), parseInt(contact.id), parseInt(vm.firmID))
                    .then(function (data) {
                        flagForPostMatterCollaboration = flagForPostMatterCollaboration + 1;
                        if (data) {
                            vm.sortedContactIds.push(contact);
                        }
                        // notificationService.success('Matter Collaboration Successfully!');
                        // if (flagForPostMatterCollaboration === (array.length)) {
                        //     postMatterCollaboration(vm.sortedContactIds);
                        // }
                        if (flagForPostMatterCollaboration == contactIds.length) {
                            deferred.resolve(true);
                        }
                    }, function (data) {
                        if (data.status == 409) {
                            notificationService.error(data.data.message);
                        }
                        deferred.reject(false);
                        // notificationService.error('Event has not been deleted!');
                        // if (flagForPostMatterCollaboration === (array.length)) {
                        //     postMatterCollaboration(vm.sortedContactIds);
                        // }
                    });

            });

            return deferred.promise;
        }

        function save() {
            vm.sortedContactIds = _.uniq(vm.sortedContactIds, function (item) {
                return item.id;
            });
            postMatterCollaboration(vm.sortedContactIds);
        }

        function postMatterCollaboration(sortedContactIds) {
            var clxUserId = localStorage.getItem('userId');
            var clxUserName = ((localStorage.getItem('user_fname')) ? localStorage.getItem('user_fname') : "") + " " + ((localStorage.getItem('user_lname')) ? localStorage.getItem('user_lname') : "");

            var docObj = JSON.parse(localStorage.getItem('matterCollaborationDocuments'));
            var docIds = _.pluck(docObj, 'doc_id');
            var docPermission = JSON.parse(localStorage.getItem('matterCollaborationDocPermission'));

            var eventObj = JSON.parse(localStorage.getItem('matterCollaborationEvents'));
            var eventIds = _.pluck(eventObj, 'event_id');
            var eventPermission = JSON.parse(localStorage.getItem('matterCollaborationEventPermission'));

            var noteObj = JSON.parse(localStorage.getItem('matterCollaborationNotes'));
            var noteIds = _.pluck(noteObj, 'note_id');
            var notePermission = JSON.parse(localStorage.getItem('matterCollaborationNotePermission'));

            var CollaborateMatterEntitiesObj = {
                clxUserId: parseInt(clxUserId),
                matterId: parseInt(vm.matterId),
                firmId: parseInt(vm.firmID),
                contacts: sortedContactIds,
                documentEntity: {
                    docIds: docIds,
                    docPermission: (docPermission) ? 1 : 0
                },
                eventEntity: {
                    eventIds: eventIds,
                    eventPermission: (eventPermission) ? 1 : 0
                },
                noteEntity: {
                    noteIds: noteIds,
                    notePermission: (notePermission) ? 1 : 0
                },
                matterName: vm.matterName,
                clxUserName: clxUserName
            }

            matterCollaborationFactory.saveMattercollaborationCompleteData(CollaborateMatterEntitiesObj)
                .then(function (data) {
                    var modalOptions = {
                        closeButtonText: '',
                        actionButtonText: 'Ok',
                        headerText: 'Invitation Sent',
                        bodyText: 'Your Invitation Request was sent successfully'
                    };

                    modalService.showModal({}, modalOptions).then(function () {
                        $state.go('add-overview', { matterId: vm.matterId });
                    });
                    // $state.go('add-overview', { matterId: vm.matterId });
                    // notificationService.success('The sharing have been added successfully');
                }, function (data) {
                    notificationService.error('The sharing have not been added successfully');
                });
        }

        $scope.$on('$destroy', function () {
            localStorage.removeItem('matterCollaborationDocuments');
            localStorage.removeItem('matterCollaborationNotes');
            localStorage.removeItem('matterCollaborationEvents');
            localStorage.removeItem('matterCollaborationDocPermission');
            localStorage.removeItem('matterCollaborationNotePermission');
            localStorage.removeItem('matterCollaborationEventPermission');

        });


        function cancelSave() {
            window.history.back();
        }

        function disableNext() {
            if (vm.currentPage.searchOrAdd && typeof vm.plaintiffInfo.contact === 'object') {
                return false;
            } else if (vm.currentPage.matterDetails) {
                return false;
            }
            return true;
        };


        /** Styling functions **/
        function getSearchContactStepClass() {
            if (vm.currentPage.searchOrAdd) {
                if (vm.completedPages.indexOf("searchOrAdd") >= 0)
                    return "sprite default-wizard-completed";
                return "sprite default-wizard-ongoing";
            } else {
                return "sprite default-wizard-completed";
            }

            return "sprite default-wizard-ongoing";
        };

        function getGenInfoStepClass() {
            if (vm.currentPage.searchOrAdd) {
                return "sprite default-wizard-tostart";
            } else if (vm.currentPage.matterDetails) {
                return "sprite default-wizard-ongoing";
            } else if (vm.currentPage.confirmDetails) {
                return "sprite default-wizard-completed";
            }
            return "sprite default-wizard-tostart";
        };

        function getconfirmDetailsStepClass() {
            if (vm.currentPage.matterDetails) {
                return "sprite default-wizard-tostart";
            } else if (vm.currentPage.confirmDetails) {
                return "sprite default-wizard-ongoing";
            }
            return "sprite default-wizard-tostart";
        };

        function getSearchContactConnectorClass() {
            if (vm.currentPage.searchOrAdd) {
                if (vm.completedPages.indexOf("searchOrAdd") >= 0)
                    return "col-md-4 connector filled-connector";
                return "col-md-4 connector gray-connector";
            } else {
                return "col-md-4 connector filled-connector";
            }
        };

        function getGenInfoConnectorClass() {
            if (vm.currentPage.matterDetails) {
                return "col-md-4 connector gray-connector";
            } else if (vm.currentPage.confirmDetails) {
                return "col-md-4 connector filled-connector";
            }
            return "col-md-4 connector gray-connector";
        };

        function setBreadcrum() {
            // if (matterId === 0) {
            var breadcrum = [{ name: vm.matterName, state: 'add-overview', param: { matterId: matterId } }];

            routeManager.setBreadcrum([{ name: '...' }]);
            // routeManager.addToBreadcrum([{ name: vm.matterName }]);
            routeManager.addToBreadcrum(breadcrum);
            routeManager.addToBreadcrum([{ name: 'Add Sharing' }]);
            // return;
            // }
            // matterFactory.setBreadcrumWithPromise(self.matterId, 'Documents').then(function (resultData) {
            //     self.matterInfo = resultData;
            // });
        }


    }


})();

(function () {

    'use strict';

    angular.module('cloudlex.matter')
        .factory('matterCollaborationFactory', matterCollaborationFactory);

    matterCollaborationFactory.$inject = ['$http', '$q', 'globalConstants'];

    function matterCollaborationFactory($http, $q, globalConstants) {

        var getContactsAndEmailsURL = globalConstants.webServiceBase;
        var saveEmailForContactURL = globalConstants.javaWebServiceBaseV4;
        var saveMattercollaborationCompleteDataURL = globalConstants.webServiceBase;
        var checkValidateUserMattercollaborationURL = globalConstants.webServiceBase;

        var pagesInfo = {
            "searchOrAdd": { next: "matterDetails", prev: "" },
            "matterDetails": { next: "confirmDetails", prev: "searchOrAdd" },
            "confirmDetails": { next: "", prev: "matterDetails" },
        };

        return {
            nextPage: nextPage,
            previousPage: previousPage,
            getContactsAndEmails: getContactsAndEmails,
            saveEmailForContact: saveEmailForContact,
            saveMattercollaborationCompleteData: saveMattercollaborationCompleteData,
            checkValidateUserMattercollaboration: checkValidateUserMattercollaboration
        }

        function nextPage(currentPage) {
            var activePage;
            angular.forEach(currentPage, function (val, key) {
                if (val) {
                    activePage = key;
                }
                currentPage[key] = false;
            });
            currentPage[pagesInfo[activePage].next] = true;

            return currentPage;
        }

        function previousPage(currentPage) {
            var activePage;
            angular.forEach(currentPage, function (val, key) {
                if (val) {
                    activePage = key;
                }
                currentPage[key] = false;
            });
            currentPage[pagesInfo[activePage].prev] = true;


            return currentPage;
        }


        function getContactsAndEmails(matterId) {
            var deferred = $q.defer();
            $http.get(getContactsAndEmailsURL + 'lexviatemplates/getAllMatterContacts/' + matterId + '.json')
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }



        function saveEmailForContact(data) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: saveEmailForContactURL + "contact/email",
                method: "PUT",
                headers: token,
                data: data
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject(error);
            });
            return deferred.promise;

        }


        function saveMattercollaborationCompleteData(data) {
            var deferred = $q.defer();
            var token = {
                'clxAuthToken': localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: saveMattercollaborationCompleteDataURL + "Cloudlex-Lite/v1/lite/collaborate-matter",
                method: "POST",
                headers: token,
                data: data
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject(error);
            });
            return deferred.promise;

        }

        function checkValidateUserMattercollaboration(mId, contactId, firmId) {
            var deferred = $q.defer();
            var token = {
                'clxAuthToken': localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: checkValidateUserMattercollaborationURL + "Cloudlex-Lite/v1/lite/validate-user?" + "matterId=" + mId + "&contactId=" + contactId + "&firmId=" + firmId,
                method: "GET",
                headers: token
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject(error);
            });
            return deferred.promise;

        }


    }


})();
