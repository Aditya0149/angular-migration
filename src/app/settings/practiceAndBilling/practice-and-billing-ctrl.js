// jshint maxdepth:2
// jshint maxstatements:30
// jshint unused:true

(function () {
    'use strict';

    /**
     * @ngdoc controller
     * @name cloudlex.settings.controller:PracticeAndBillingCtrl
     * @requires 'globalConstants', 'practiceAndBillingDataLayer', 'practiceAndBillingHelper', 'modalService', 'masterData'
     * @description
     * The PracticeAndBillingCtrl manages the practise and billing details.
     * It manages the billing related details and handles the button clicks etc.
     */
    angular
        .module('cloudlex.settings')
        .controller('PracticeAndBillingCtrl', PracticeAndBillingController);

    PracticeAndBillingController.$inject = ['globalConstants', 'practiceAndBillingDataLayer', 'practiceAndBillingHelper',
        'modalService', 'masterData', 'routeManager', 'notification-service'];

    function PracticeAndBillingController(globalConstants, practiceAndBillingDataLayer, practiceAndBillingHelper,
        modalService, masterData, routeManager, notificationService) {

        var vm = this;


        vm.addressInfo = {};
        vm.cardInfo = {};
        vm.billingInfo = {};
        vm.viewAddressInfo = {};
        vm.viewCardInfo = {};
        vm.viewBillingInfo = {};
        vm.displayData = false;
        vm.viewFlag = true;
        vm.cardDetailsChangeFlag = true;
        vm.creditCardDetailChangeFlag = false;
        vm.displayExpiryDate = false;
        vm.cardInfo.creditCardLength = 15;
        vm.cardInfo.cvvNumberLength = 3;

        (function () {
            getPractiseAndBillingDetails();
            setBreadcrum();
        })();

        function setBreadcrum() {
            var initCrum = [{ name: '...' }, { name: 'Settings' }, { name: 'Subscription' }];
            routeManager.setBreadcrum(initCrum);
        }

        vm.save = save;
        vm.getCheckBoxInfo = getCheckBoxInfo;
        vm.editPracAndBill = editPracAndBill;
        vm.cancelEdit = cancelEdit;
        vm.stateChangeForAddressInfo = stateChangeForAddressInfo;
        vm.stateChangeForBillingInfo = stateChangeForBillingInfo;
        vm.changeCreditCardDetails = changeCreditCardDetails;
        vm.showInfo = showInfo;
        vm.creditCardWithStar = false;
        vm.checkAddressInfo = checkAddressInfo;
        vm.checkExpirationDate = checkExpirationDate;
        vm.isDateAfter = true;

        /**
         * @ngdoc method
         * @name cloudlex.settings.PracticeAndBillingCtrl#checkAddressInfo
         * @methodOf cloudlex.settings.PracticeAndBillingCtrl
         * @description
         * this method is used to change the billing address details if check box is checked
         */
        function checkAddressInfo(checked) {
            if (checked) {
                getCheckBoxInfo();
            }
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.PracticeAndBillingCtrl#getPractiseAndBillingDetails
         * @methodOf cloudlex.settings.PracticeAndBillingCtrl
         * @description
         * this method is used to get the view details for Practise and Billing
         */
        function getPractiseAndBillingDetails() {
            //alert('getPractiseAndBillingDetails');
            var response = practiceAndBillingDataLayer.getPracBillDetails();
            response.then(function (data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    vm.viewAddressInfo = data.firm_address_details;
                    vm.viewBillingInfo = data.bill_address_details;
                    vm.viewCardInfo = data.credit_card_details;
                    if (vm.viewCardInfo.credit_card_expiry_date != 0 && !utils.isEmptyVal(vm.viewCardInfo.credit_card_expiry_date)) {
                        vm.displayExpiryDate = true;
                    }
                    vm.subscribe_lexvia_service = data.subscribe_lexvia_service === 1 ? true : false;
                    vm.viewSubscribe_lexvia_service = data.subscribe_lexvia_service === 1 ? true : false;
                    vm.disableSubscription = vm.subscribe_lexvia_service ? true : false;
                }
                vm.displayData = true;
                vm.viewFlag = true;

            });
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.PracticeAndBillingCtrl#editPracAndBill
         * @methodOf cloudlex.settings.PracticeAndBillingCtrl
         * @description
         * this method is used to used to display information on edit page
         */
        function editPracAndBill() {
            //alert('editPracAndBill');
            vm.displayData = true;
            vm.viewFlag = false;

            if (angular.isDefined(vm.viewAddressInfo)) {
                vm.addressInfo = angular.copy(vm.viewAddressInfo);
                vm.addressInfo.countries = globalConstants.allCountries;
                vm.addressInfo.states = globalConstants.allstates.United_States;

                _.forEach(vm.addressInfo.countries, function (data) {
                    if (data.name == vm.addressInfo.firm_country) {
                        vm.addressInfo.firm_country = data.code;
                    }
                });

                vm.addressInfo.firm_country = utils.isEmptyVal(vm.addressInfo.firm_country) ?
                    _.find(vm.addressInfo.countries, function (cntry) {
                        return cntry.name = "United States";
                    }).code : vm.addressInfo.firm_country;
            }

            if (angular.isDefined(vm.viewBillingInfo)) {
                vm.billingInfo = angular.copy(vm.viewBillingInfo);
                if (vm.billingInfo.same_as_firm_address == 1) {
                    vm.billingInfo.checkBoxInfo = true;
                } else {
                    vm.billingInfo.checkBoxInfo = false;
                }
                vm.billingInfo.countries = globalConstants.allCountries;
                vm.billingInfo.states = globalConstants.allstates.United_States;

                _.forEach(vm.billingInfo.countries, function (data) {
                    if (data.name == vm.billingInfo.bill_country) {
                        vm.billingInfo.bill_country = data.code;
                    }
                });
                vm.billingInfo.bill_country = utils.isNotEmptyVal(vm.billingInfo.bill_country) ? vm.billingInfo.bill_country : 'US';
            }

            if (angular.isDefined(vm.viewCardInfo)) {
                vm.cardInfo = angular.copy(vm.viewCardInfo);
                if (vm.cardInfo.credit_card_type == "AmericanExpress") {
                    //vm.cardInfo.creditCardMinLength = 15;
                    vm.cardInfo.creditCardLength = 15;
                    vm.cardInfo.cvvNumberLength = 4;
                } else {
                    vm.cardInfo.creditCardLength = 16;
                    vm.cardInfo.cvvNumberLength = 3;
                }
                vm.cardInfo.credit_card_no = vm.cardInfo.credit_card_no.trim();
                vm.cardInfo.card_cvv_number = vm.cardInfo.card_cvv_number.trim();
                vm.cardInfo.months = practiceAndBillingHelper.getMonths();
                vm.cardInfo.years = practiceAndBillingHelper.getYears();

                if (utils.isNotEmptyVal(vm.cardInfo.credit_card_expiry_date)) {
                    var month, year;
                    var monthYear = vm.cardInfo.credit_card_expiry_date;
                    if (angular.isDefined(monthYear) && monthYear != '' && monthYear != 0) {
                        monthYear = moment.unix(monthYear).format('MM YYYY');
                        vm.cardInfo.monthId = monthYear.substr(0, 2);
                        vm.cardInfo.yearId = parseInt(monthYear.substr(3, 6));
                    }
                }

            }
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.PracticeAndBillingCtrl#stateChangeForAddressInfo
         * @methodOf cloudlex.settings.PracticeAndBillingCtrl
         * @description
         * this method is used to get the information on country and according to that display state with or without drop down
         */
        function stateChangeForAddressInfo(checkBoxChecked) {
            //alert('stateChangeForCountry');
            if (vm.addressInfo.firm_country != "US") {
                vm.addressInfo.firm_state = '';
            }

            if (checkBoxChecked) {
                vm.billingInfo.bill_country = vm.addressInfo.firm_country;
                vm.billingInfo.bill_state = vm.addressInfo.firm_state;
            }
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.PracticeAndBillingCtrl#stateChangeForBillingInfo
         * @methodOf cloudlex.settings.PracticeAndBillingCtrl
         * @description
         * this method is used to get the information on country and according to that display state with or without drop down
         */
        function stateChangeForBillingInfo() {
            //alert('stateChangeForBillingInfo');
            if (vm.billingInfo.bill_country != "US") {
                vm.billingInfo.bill_state = '';
            }
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.PracticeAndBillingCtrl#changeCreditCardDetails
         * @methodOf cloudlex.settings.PracticeAndBillingCtrl
         * @description
         * this method is used to change credit card information
         */
        function changeCreditCardDetails(id, changeDropDownVal, creditCard) {
            if (vm.cardInfo.credit_card_type == 'Visa' || vm.cardInfo.credit_card_type == 'MasterCard') {

                //vm.cardInfo.creditCardMinLength = 16;
                vm.cardInfo.creditCardLength = 16;
                vm.cardInfo.cvvNumberLength = 3;
            } else {
                //vm.cardInfo.creditCardMinLength = 15;
                vm.cardInfo.creditCardLength = 15;
                vm.cardInfo.cvvNumberLength = 4;
            }
            //alert('changeCreditCardDetails');
            if (vm.cardDetailsChangeFlag) {
                vm.creditCardDetailChangeFlag = true;
                vm.cardDetailsChangeFlag = false;
                vm.cardInfo.credit_holder_name = '';
                vm.cardInfo.credit_card_type = '';
                vm.cardInfo.credit_card_no = '';
                if (changeDropDownVal == 'month') {
                    vm.cardInfo.monthId = id;
                } else {
                    vm.cardInfo.monthId = '';
                }

                if (changeDropDownVal == 'year') {
                    vm.cardInfo.yearId = id;
                } else {
                    vm.cardInfo.yearId = '';
                }
                vm.cardInfo.card_cvv_number = '';
            }

        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.PracticeAndBillingCtrl#cancelEdit
         * @methodOf cloudlex.settings.PracticeAndBillingCtrl
         * @description
         * this method is used to cancel and get back to view page
         */
        function cancelEdit() {
            vm.displayData = true;
            vm.viewFlag = true
            vm.cardDetailsChangeFlag = true;
            vm.creditCardDetailChangeFlag = false;
            vm.subscribe_lexvia_service = vm.viewSubscribe_lexvia_service;
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.PracticeAndBillingCtrl#save
         * @methodOf cloudlex.settings.PracticeAndBillingCtrl
         * @description
         * this method is used to save the billing and address details of user
         */
        function save() {
            //alert('save');
            /*var hash = CryptoJS.SHA256(vm.cardInfo.credit_card_no);
            var encp = hash.toString(CryptoJS.enc.Base64);
            var decp = encp.toString(CryptoJS.decode.Base64);
            alert(hash.toString(CryptoJS.enc.Base64));
            console.log('hash ', hash);
            alert()*/

            var postData = {};
            var practice_id = 1;
            postData.practice_id = practice_id;
            var jurisdiction_id = 1;
            postData.jurisdiction_id = jurisdiction_id;
            var firm_address_details = {};
            firm_address_details.firm_street = vm.addressInfo.firm_street;
            firm_address_details.firm_city = vm.addressInfo.firm_city;
            _.forEach(vm.addressInfo.countries, function (data) {
                if (data.code == vm.addressInfo.firm_country) {
                    firm_address_details.firm_country = data.name;
                }
            });
            firm_address_details.firm_state = vm.addressInfo.firm_state;
            firm_address_details.firm_zipcode = vm.addressInfo.firm_zipcode;
            postData.firm_address_details = firm_address_details;
            var bill_address_details = {};
            if (vm.billingInfo.same_as_firm_address == 1) {
                bill_address_details.same_as_firm_address = vm.billingInfo.same_as_firm_address;
            } else {
                bill_address_details.same_as_firm_address = '';
            }

            bill_address_details.bill_street = vm.billingInfo.bill_street;
            bill_address_details.bill_city = vm.billingInfo.bill_city;
            //firm_address_details.firm_country = vm.addressInfo.firm_country;
            _.forEach(vm.billingInfo.countries, function (data) {
                if (data.code == vm.billingInfo.bill_country) {
                    bill_address_details.bill_country = data.name;
                }
            });
            bill_address_details.bill_state = vm.billingInfo.bill_state;
            bill_address_details.bill_zipcode = vm.billingInfo.bill_zipcode;
            postData.bill_address_details = bill_address_details;
            if (vm.creditCardDetailChangeFlag) {
                var credit_card_details = {};
                //var encryptCardNumber = SHA256(vm.cardInfo.credit_card_no);
                //credit_card_details.credit_card_no = encryptCardNumber;
                //var encryptCVVNumber = SHA256(vm.cardInfo.card_cvv_number);
                //credit_card_details.card_cvv_number = encryptCVVNumber;

                credit_card_details.credit_card_no = vm.cardInfo.credit_card_no;
                credit_card_details.card_cvv_number = vm.cardInfo.card_cvv_number;

                credit_card_details.credit_holder_name = vm.cardInfo.credit_holder_name;
                credit_card_details.credit_card_type = vm.cardInfo.credit_card_type;
                credit_card_details.month = vm.cardInfo.monthId;
                credit_card_details.year = vm.cardInfo.yearId;
                postData.credit_card_details = credit_card_details;
            }
            postData.subscribe_lexvia_service = (vm.subscribe_lexvia_service === true || vm.subscribe_lexvia_service === 1) ? 1 : 0;

            var saveResponse = practiceAndBillingDataLayer.savePracAndBillDetails(postData);
            saveResponse.then(function (data) {
                if (angular.isDefined(data) && angular.isDefined(data.data)) {
                    notificationService.success('Details updated successfully.');
                    if (angular.isDefined(data.data.firm_address_details)) {
                        vm.viewAddressInfo = data.data.firm_address_details;
                    }
                    if (angular.isDefined(data.data.bill_address_details)) {
                        vm.viewBillingInfo = data.data.bill_address_details;
                        if (vm.billingInfo.same_as_firm_address === 1) {
                            vm.billingInfo.checkBoxInfo = true;
                        } else {
                            vm.billingInfo.checkBoxInfo = false;
                        }
                    }
                    if (angular.isDefined(data.data.credit_card_details)) {
                        vm.viewCardInfo = data.data.credit_card_details;
                        if (vm.viewCardInfo.credit_card_expiry_date != 0 && vm.viewCardInfo.credit_card_expiry_date != '') {
                            vm.displayExpiryDate = true;
                        }
                    }
                }
                vm.subscribe_lexvia_service = data.data.subscribe_lexvia_service === 1 ? true : false;
                vm.viewSubscribe_lexvia_service = data.data.subscribe_lexvia_service === 1 ? true : false;
                vm.disableSubscription = vm.subscribe_lexvia_service ? true : false;
                masterData.fetchUserRole();
                vm.displayData = true;
                vm.viewFlag = true;
                vm.cardDetailsChangeFlag = true;
            }, function () {
                notificationService.error('Details not updated successfully.');
            });
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.PracticeAndBillingCtrl#getCheckBoxInfo
         * @methodOf cloudlex.settings.PracticeAndBillingCtrl
         * @description
         * this method is used to check whether billing address and firm address are change
         */
        function getCheckBoxInfo() {
            //alert('getCheckBoxInfo');
            //var country;
            if (vm.billingInfo.checkBoxInfo) {
                vm.billingInfo.same_as_firm_address = 1;
                vm.billingInfo.bill_street = vm.addressInfo.firm_street;
                vm.billingInfo.bill_city = vm.addressInfo.firm_city;
                vm.billingInfo.bill_state = vm.addressInfo.firm_state;
                vm.billingInfo.bill_country = vm.addressInfo.firm_country;
                vm.billingInfo.bill_zipcode = vm.addressInfo.firm_zipcode;

            } else {
                vm.billingInfo.same_as_firm_address = 0;
                vm.billingInfo.bill_street = '';
                vm.billingInfo.bill_city = '';
                vm.billingInfo.bill_state = '';
                vm.billingInfo.bill_country = 'US';
                vm.billingInfo.bill_zipcode = '';
            }
        }

        function showInfo() {
            var modalOptions = {
                closeButtonText: 'Close',
                headerText: 'Infomation',
                bodyText: 'some info some info some info some info some info some info some info some info some info some info ' +
                    'some info some info some info some info some info some info some info some info some info some info some info some info ' +
                    'some info some info some info some info some info some info some info some info some info some info some info some info some info'
            };
            modalService.showModal({}, modalOptions);
        }

        function checkExpirationDate() {
            var inputMonth = parseInt(vm.cardInfo.monthId);
            var inputYear = parseInt(vm.cardInfo.yearId);
            var date = new Date(inputYear, inputMonth);
            // var enteredDate = moment(date).format('MM/YYYY');
            // var todayDate = moment().format('MM/YYYY');
            vm.isDateAfter = moment(date).isAfter();
        }
    }

})();

(function () {
    angular.module('cloudlex.settings')
        .factory('practiceAndBillingHelper', practiceAndBillingHelper);

    function practiceAndBillingHelper() {
        return {
            getMonths: _getMonths,
            getYears: _getYears
        };

        function _getMonths() {
            var months = [{ id: "01", name: "01" },
            { id: "02", name: "02" },
            { id: "03", name: "03" },
            { id: "04", name: "04" },
            { id: "05", name: "05" },
            { id: "06", name: "06" },
            { id: "07", name: "07" },
            { id: "08", name: "08" },
            { id: "09", name: "09" },
            { id: "10", name: "10" },
            { id: "11", name: "11" },
            { id: "12", name: "12" }];

            return months;
        }

        function _getYears() {
            var date = new Date();
            var yr = date.getFullYear();
            var years = [];
            var arrYear = '';
            for (var i = -5; i <= 15; i++) {
                arrYear = { id: yr + i, name: yr + i };
                years.push(arrYear);
            }
            return years;
        }
    }

})();
