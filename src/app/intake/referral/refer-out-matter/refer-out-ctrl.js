// jshint maxdepth:2
// jshint maxstatements:30
// jshint unused:true

(function (angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name intake.referral.controller:ReferrOutIntakeCtrl
     * @requires $timeout, $stateParams, masterData, contactFactory, referOutIntakeHelper, notification-service
     * @description
     * The ReferrOutIntakeCtrl manages the display of the refer out screen
     * It manages the control validations and handles the button clicks etc.
     */

    angular
        .module('intake.referral')
        .controller('ReferrOutIntakeCtrl', ReferOutIntakeController);

    ReferOutIntakeController.$inject = ['$state', '$modal', '$stateParams', 'contactFactory',
        'referralIntakeDatalayer', 'referOutIntakeHelper', 'notification-service', 'routeManager', 'intakeFactory', 'modalService'];
    function ReferOutIntakeController($state, $modal, $stateParams, contactFactory,
        referralIntakeDatalayer, referOutIntakeHelper, notificationService, routeManager, intakeFactory, modalService) {
        var vm = this;
        var intakeId = $stateParams.intakeId;
        var fromMatterList = $stateParams.fromMatterList;
        var info = intakeFactory.getMatterData();
        vm.getContacts = getContacts;
        vm.formatTypeaheadDisplay = contactFactory.formatTypeaheadDisplay;
        vm.isContactValid = isContactValid;
        vm.addEmail = addEmail;
        vm.addNewContact = addNewContact;
        vm.referMatterOut = referMatterOut;
        vm.goToMatterOverview = goToMatterOverview;
        vm.selectContact = selectContact;
        vm.setFeeAgreement = setFeeAgreement;
        (function () {
            vm.referOutInfo = {
                fee: referOutIntakeHelper.getFeeAgreementContent()
            };
            vm.fee_agreement = angular.copy(vm.referOutInfo.fee);
            //set breadcrum
            var breadcrum = [{ name: '...' }];
            routeManager.setBreadcrum(breadcrum);

            if (!utils.isEmptyObj(info) && (parseInt(info.intake_id) === parseInt(intakeId))) {
                var breadcrum = [{ name: info.intake_name }];
                routeManager.addToBreadcrum(breadcrum);
            }

            intakeFactory.setBreadcrum(intakeId, 'Refer Out');

            vm.referOutInfo.invitenew = 0;
            vm.materInfo = {};
            //get matter info

            var intakeObj = { "page_number": 1, "page_size": 250, "intake_id": intakeId, "is_migrated": 2 }
            var promise = intakeFactory.getMatterList(intakeObj);
            promise.then(function (data) {
                vm.matterInfo = data.intakeData ? data.intakeData : [];
            });
        })();

        /**
         * @ngdoc method
         * @name intake.referral.ReferrOutIntakeCtrl#getContacts
         * @methodOf intake.referral.ReferrOutIntakeCtrl
         * @description
         * gets all the contacts matching the input string
         *
         * @param {string} user entered contact name
         * @returns {Promise} 
         */

        function getContacts(contactName) {
            vm.noContactFound = false;
            return contactFactory.getContactsByName(contactName)
                .then(function (response) {
                    var data = response.data.contacts;
                    if (data.length === 0) {
                        vm.noContactFound = true;
                    }
                    contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
                    contactFactory.setNamePropForContactsOffDrupal(data);
                    return data;
                });
        }


        function selectContact() {

            var modalInstance = $modal.open({
                templateUrl: "app/referral/refer-out-matter/partials/search-contact-popup.html",
                controller: "SearchReferralCtrl as searchRef",
                windowClass: 'medicalIndoDialog',
                backdrop: 'static',
                // windowClass: 'modalXLargeDialog',
                keyboard: false,


            });

            modalInstance.result.then(function (response) {

                vm.referOutInfo.contact = utils.isNotEmptyVal(response) ? response.email_id : vm.referOutInfo.contact;
                vm.referOutInfo.fee = response.name ? angular.copy(vm.fee_agreement).replace('{receiver_name}', response.name) : angular.copy(vm.fee_agreement).replace('{receiver_name}', response.smp_name);
                var firm_name = localStorage.getItem('firm_name');
                vm.referOutInfo.fee = vm.referOutInfo.fee.replace('{firm_name}', firm_name);
            }, function () { });


        }
        function setFeeAgreement(data) {
            if (data == 1) {
                vm.referOutInfo.fee = angular.copy(vm.fee_agreement);
                vm.referOutInfo.contact = '';
            } else {
                vm.referOutInfo.inviteNewContact = '';
            }

        }
        /**
        * @ngdoc method
        * @name intake.referral.ReferrOutIntakeCtrl#isContactValid
        * @methodOf intake.referral.ReferrOutIntakeCtrl
        * @description
        * checks for email in the received contact object
        *
        * @param {object} contact object
        * @returns {Boolean} is contact valid or not
        */

        function isContactValid(contact) {
            if (angular.isUndefined(contact) || utils.isEmptyString(contact)) {
                return false;
            }
            return (angular.isUndefined(contact.email) || _.isNull(contact.email));
        }

        /**
        * @ngdoc method
        * @name intake.referral.ReferrOutIntakeCtrl#addEmail
        * @methodOf intake.referral.ReferrOutIntakeCtrl
        * @description
        * opens the contact modal pop up to add email to the contact
        *
        * @param {object} contact object
        */

        function addEmail(contact) {
            var modalInstance = contactFactory.openEditContactModal(contact);
            modalInstance.result.then(function (response) {
                var updatedContact = response.data;
                vm.referOutInfo.contact = updatedContact;
                if (updatedContact.email) {
                    if (updatedContact.email.length > 0) {
                        vm.referOutInfo.contact.email = vm.referOutInfo.contact.email.toString();
                    } else {
                        updatedContact.email = undefined;
                    }
                }
            });
        }

        /**
        * @ngdoc method
        * @name intake.referral.ReferrOutIntakeCtrl#addNewContact
        * @methodOf intake.referral.ReferrOutIntakeCtrl
        * @description
        * opens the contact modal pop up to add new contact
        *
        */

        function addNewContact() {
            var modalInstance = contactFactory.openContactModal();
            modalInstance.result.then(function (savedContact) {
                vm.referOutInfo.contact = savedContact;
                vm.referOutInfo.contact.email = referOutIntakeHelper.getStringFromArray(vm.referOutInfo.contact.email);
                vm.referOutInfo.contact.phone = referOutIntakeHelper.getStringFromArray(vm.referOutInfo.contact.phone);
                vm.noContactFound = false;
            });
        }


        /**
        * @ngdoc method
        * @name intake.referral.ReferrOutIntakeCtrl#addEmail
        * @methodOf intake.referral.ReferrOutIntakeCtrl
        * @description
        * validates the post object
        * forms the refer out post object and posts its
        *
        * @param {object} refer out post object object
        */

        function referMatterOut(referOutInfo) {
            referOutInfo.refer_to_email = referOutInfo.invitenew == 1 ? referOutInfo.inviteNewContact : !utils.isEmptyObj(referOutInfo.contact) ? referOutInfo.contact : '';
            var utcNow = new Date(moment().utc().toDate());
            referOutInfo.referred_date = moment(utcNow.getTime()).unix();
            referOutInfo.intake_id = intakeId;

            if (referOutIntakeHelper.isReferOutInfoValid(referOutInfo)) {
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Confirm',
                    headerText: 'Confirmation!',
                    bodyText: 'Are you sure you want to refer out this intake?'
                };

                //confirm before refer out 
                modalService.showModal({}, modalOptions).then(function () {
                    var validInfo = angular.copy(referOutInfo);

                    if (!validInfo.attachFeeAgreement) {
                        validInfo.fee = "";
                    }

                    referralIntakeDatalayer
                        .referOut(validInfo)
                        .then(function () {
                            //var message = referOutIntakeHelper.matterReferredOutMessage(vm.matterInfo.matter_name, referOutInfo.refer_to_email);
                            notificationService.success("Intake Successfully Referred Out");
                            $state.go('referred-intake');
                        }, function (error) {
                            var errorMsg = error.data[0];
                            notificationService.error(errorMsg);
                        });
                });
            }
            else {
                var message = referOutIntakeHelper.getInvalidReferOutInfoMsg(referOutInfo);
                notificationService.error(message);
            }
        }


        /**
       * @ngdoc method
       * @name intake.referral.ReferrOutIntakeCtrl#goToMatterOverview
       * @methodOf intake.referral.ReferrOutIntakeCtrl
       * @description
       * routes to matter overview page
       */

        function goToMatterOverview() {
            if (fromMatterList) {
                $state.go('intake-list');
            } else {
                $state.go('intake-overview', { intakeId: intakeId });
            }
        }

    }


    /**
   * @ngdoc service
   * @name intake.referral.services :referOutIntakeHelper
   * @requires 
   * @description
   * #referOutIntakeHelper
   * The referOutIntakeHelper provides few helper functions to help out the controller
   */

    angular
        .module('intake.referral')
        .factory('referOutIntakeHelper', referOutIntakeHelper);

    function referOutIntakeHelper() {
        return {
            getStringFromArray: _getStringFromArray,
            getFeeAgreementContent: _getFeeAgreementContent,
            isReferOutInfoValid: _isReferOutInfoValid,
            getInvalidReferOutInfoMsg: _getInvalidReferOutInfoMsg,
            matterReferredOutMessage: _matterReferredOutMessage
        };


        /**
         * @ngdoc method
         * @name intake.referral.referOutIntakeHelper#_getStringFromArray
         * @methodOf intake.referral.referOutIntakeHelper
         *
         * @description
         * returns string of value prop from an array of objects
         * @param {array} array {id,value} objects
         * @returns {string} string of value prop
         */
        function _getStringFromArray(array) {
            var data = [];
            _.forEach(array, function (item) {
                if (item.value) {
                    data.push(item.value);
                }
            });
            return data.length > 0 ? data.toString() : null;
        }


        /**
         * @ngdoc method
         * @name intake.referral.referOutIntakeHelper#_getFeeAgreementContent
         * @methodOf intake.referral.referOutIntakeHelper
         *
         * @description
         * get the fee agreement text
         *
         * @returns {string} fee agreement content as string conctenated html
         */
        function _getFeeAgreementContent() {
            var content = "";

            content += "<div>By accepting this intake, you {receiver_name} agree to pay {firm_name}, 33 <sup>1/3</sup>% (One Third) of all sums recovered by the reason of the claims in this intake or any actions related thereto, whether recovered by suit or settlement or judgment or otherwise. Such percentage shall be computed on the net sum derived after deducting all your expenses and disbursements for the services chargeable to the claim. </div>";

            return content;
        }

        /**
        * @ngdoc method
        * @name intake.referral.referOutIntakeHelper#_isReferOutInfoValid
        * @methodOf intake.referral.referOutIntakeHelper
        *
        * @description
        * validates the referOut post obj
        *
        * @param {object} referOut post obj
        * @returns {Boolean} is object valid or not
        */
        function _isReferOutInfoValid(info) {
            if (angular.isUndefined(info.refer_to_email) || utils.isEmptyString(info.refer_to_email)) {
                return false;
            }

            if (angular.isUndefined(info.message)) {
                return false;
            }
            return true;
        }

        /**
       * @ngdoc method
       * @name intake.referral.referOutIntakeHelper#_getInvalidReferOutInfoMsg
       * @methodOf intake.referral.referOutIntakeHelper
       *
       * @description
       * return validation message based on the refer out object
       *
       * @param {object} referOut post obj
       * @returns {string} validation message
       */
        function _getInvalidReferOutInfoMsg(info) {
            if (angular.isUndefined(info.refer_to_email) || utils.isEmptyString(info.refer_to_email)) {
                return "contact having email is required";
            }

            if (angular.isUndefined(info.message)) {
                return "message is required";
            }
        }

        /**
         * @ngdoc method
         * @name intake.referral.referOutIntakeHelper#_getInvalidReferOutInfoMsg
         * @methodOf intake.referral.referOutIntakeHelper
         *
         * @description
         * return validation message based on the refer out object
         *
         * @param {object} referOut post obj
         * @returns {string} validation message
         */

        function _matterReferredOutMessage(mattername, contact) {

            //if name prop is not present concat firstname and lastname
            if (angular.isDefined(contact.name)) {
                return mattername + ' : intake is referred out. Awaiting decision by ' + contact.name;
            }
            var name = (angular.isDefined(contact.firstname) && !_.isNull(contact.firstname) ? contact.firstname : "") + " ";
            name += angular.isDefined(contact.lastname) && !_.isNull(contact.lastname) ? contact.lastname : "";

            return mattername + ' : intake is referred out. Awaiting decision by ' + name;

        }
    }

})(angular);