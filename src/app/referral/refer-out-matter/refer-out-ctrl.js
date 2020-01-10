// jshint maxdepth:2
// jshint maxstatements:30
// jshint unused:true

(function (angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name cloudlex.referral.controller:ReferrOutCtrl
     * @requires $timeout, $stateParams, masterData, contactFactory, referOutHelper, notification-service
     * @description
     * The ReferrOutCtrl manages the display of the refer out screen
     * It manages the control validations and handles the button clicks etc.
     */

    angular
        .module('cloudlex.referral')
        .controller('ReferrOutCtrl', ReferOutController);

    ReferOutController.$inject = ['$state', '$modal', '$stateParams', 'contactFactory',
        'referralDatalayer', 'referOutHelper', 'notification-service', 'routeManager', 'matterFactory', 'modalService'];
    function ReferOutController($state, $modal, $stateParams, contactFactory,
        referralDatalayer, referOutHelper, notificationService, routeManager, matterFactory, modalService) {
        var vm = this;
        var matterId = $stateParams.matterId;
        var fromMatterList = $stateParams.fromMatterList;
        var info = matterFactory.getMatterData();
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
                fee: referOutHelper.getFeeAgreementContent()
            };
            vm.fee_agreement = angular.copy(vm.referOutInfo.fee);
            //set breadcrum
            var breadcrum = [{ name: '...' }];
            routeManager.setBreadcrum(breadcrum);

            if (!utils.isEmptyObj(info) && (parseInt(info.matter_id) === parseInt(matterId))) {
                var breadcrum = [{ name: info.matter_name }];
                routeManager.addToBreadcrum(breadcrum);
            }

            matterFactory.setBreadcrum(matterId, 'Refer Out');

            vm.referOutInfo.invitenew = 0;
            vm.materInfo = {};
            //get matter info
            referralDatalayer
                .getMatterInfo(matterId)
                .then(function (response) {
                    vm.matterInfo = response.data[0];
                });
        })();

        /**
         * @ngdoc method
         * @name cloudlex.referral.ReferrOutCtrl#getContacts
         * @methodOf cloudlex.referral.ReferrOutCtrl
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
        * @name cloudlex.referral.ReferrOutCtrl#isContactValid
        * @methodOf cloudlex.referral.ReferrOutCtrl
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
        * @name cloudlex.referral.ReferrOutCtrl#addEmail
        * @methodOf cloudlex.referral.ReferrOutCtrl
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
        * @name cloudlex.referral.ReferrOutCtrl#addNewContact
        * @methodOf cloudlex.referral.ReferrOutCtrl
        * @description
        * opens the contact modal pop up to add new contact
        *
        */

        function addNewContact() {
            var modalInstance = contactFactory.openContactModal();
            modalInstance.result.then(function (savedContact) {
                vm.referOutInfo.contact = savedContact;
                vm.referOutInfo.contact.email = referOutHelper.getStringFromArray(vm.referOutInfo.contact.email);
                vm.referOutInfo.contact.phone = referOutHelper.getStringFromArray(vm.referOutInfo.contact.phone);
                vm.noContactFound = false;
            });
        }


        /**
        * @ngdoc method
        * @name cloudlex.referral.ReferrOutCtrl#addEmail
        * @methodOf cloudlex.referral.ReferrOutCtrl
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
            referOutInfo.matter_id = matterId;

            if (referOutHelper.isReferOutInfoValid(referOutInfo)) {
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Confirm',
                    headerText: 'Confirmation!',
                    bodyText: 'Are you sure you want to refer out this matter?'
                };

                //confirm before refer out 
                modalService.showModal({}, modalOptions).then(function () {
                    var validInfo = angular.copy(referOutInfo);

                    if (!validInfo.attachFeeAgreement) {
                        validInfo.fee = "";
                    }

                    referralDatalayer
                        .referOut(validInfo)
                        .then(function () {
                            //var message = referOutHelper.matterReferredOutMessage(vm.matterInfo.matter_name, referOutInfo.refer_to_email);
                            notificationService.success("Matter Successfully Referred Out");
                            $state.go('referred-matters');
                        }, function (error) {
                            var errorMsg = error.data[0];
                            notificationService.error(errorMsg);
                        });
                });
            }
            else {
                var message = referOutHelper.getInvalidReferOutInfoMsg(referOutInfo);
                notificationService.error(message);
            }
        }


        /**
       * @ngdoc method
       * @name cloudlex.referral.ReferrOutCtrl#goToMatterOverview
       * @methodOf cloudlex.referral.ReferrOutCtrl
       * @description
       * routes to matter overview page
       */

        function goToMatterOverview() {
            if (fromMatterList) {
                $state.go('matter-list');
            } else {
                $state.go('add-overview', { matterId: matterId });
            }
        }

    }


    /**
   * @ngdoc service
   * @name cloudlex.referral.services :referOutHelper
   * @requires 
   * @description
   * #referOutHelper
   * The referOutHelper provides few helper functions to help out the controller
   */

    angular
        .module('cloudlex.referral')
        .factory('referOutHelper', referOutHelper);

    function referOutHelper() {
        return {
            getStringFromArray: _getStringFromArray,
            getFeeAgreementContent: _getFeeAgreementContent,
            isReferOutInfoValid: _isReferOutInfoValid,
            getInvalidReferOutInfoMsg: _getInvalidReferOutInfoMsg,
            matterReferredOutMessage: _matterReferredOutMessage
        };


        /**
         * @ngdoc method
         * @name cloudlex.referral.referOutHelper#_getStringFromArray
         * @methodOf cloudlex.referral.referOutHelper
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
         * @name cloudlex.referral.referOutHelper#_getFeeAgreementContent
         * @methodOf cloudlex.referral.referOutHelper
         *
         * @description
         * get the fee agreement text
         *
         * @returns {string} fee agreement content as string conctenated html
         */
        function _getFeeAgreementContent() {
            var content = "";

            content += "<div>By accepting this matter, you {receiver_name} agree to pay {firm_name}, 33 <sup>1/3</sup>% (One Third) of all sums recovered by the reason of the claims in this matter or any actions related thereto, whether recovered by suit or settlement or judgment or otherwise. Such percentage shall be computed on the net sum derived after deducting all your expenses and disbursements for the services chargeable to the claim. </div>";
            return content;
        }

        /**
        * @ngdoc method
        * @name cloudlex.referral.referOutHelper#_isReferOutInfoValid
        * @methodOf cloudlex.referral.referOutHelper
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
       * @name cloudlex.referral.referOutHelper#_getInvalidReferOutInfoMsg
       * @methodOf cloudlex.referral.referOutHelper
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
         * @name cloudlex.referral.referOutHelper#_getInvalidReferOutInfoMsg
         * @methodOf cloudlex.referral.referOutHelper
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
                return mattername + ' : matter is referred out. Awaiting decision by ' + contact.name;
            }
            var name = (angular.isDefined(contact.firstname) && !_.isNull(contact.firstname) ? contact.firstname : "") + " ";
            name += angular.isDefined(contact.lastname) && !_.isNull(contact.lastname) ? contact.lastname : "";

            return mattername + ' : matter is referred out. Awaiting decision by ' + name;

        }
    }

})(angular);