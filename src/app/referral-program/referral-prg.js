(function (angular) {
    'use strict';

    angular
        .module('cloudlex.referralprg')
        .controller('RefferalProgramCtrl', RefferalProgramCtrl);
    RefferalProgramCtrl.$inject = ['$modal'];
    function RefferalProgramCtrl($modal) {
        var vm = this;
        vm.openReferralForm = openReferralForm;
        vm.loggedInUserName = localStorage.getItem('user_fname') + " " + localStorage.getItem('user_lname');

        function openReferralForm() {
            $('body').css('overflow', 'hidden');
            var modalInstance = $modal.open({
                templateUrl: 'app/referral-program/referral-prg-pop-up.html',
                controller: 'ReferralPopUpCtrl as referralPopUp',
                windowClass: 'middle-pop-up',
                backdrop: 'static',
                keyboard: false,
            });

            modalInstance.result.then(function (resp) {
            }, function (error) {
                // notificationService.error("Unable to submit Reference Details!");
            });
        }
    }
})(angular);

(function (angular) {
    'use strict';

    angular
        .module('cloudlex.referralprg')
        .controller('ReferralPopUpCtrl', ReferralPopUpCtrl);
    ReferralPopUpCtrl.$inject = ['$modalInstance', 'notification-service', '$http', 'globalConstants', '$q', 'masterData'];
    function ReferralPopUpCtrl($modalInstance, notificationService, $http, globalConstants, $q, masterData) {
        var vm = this;
        vm.referral_info = {
            firstName: "",
            lastName: "",
            firmName: "",
            emailId: "",
            phoneNumber: "",
            city:"",
            state:""
        };
        vm.save = save;
        vm.referagain = referagain;
        vm.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;
        vm.close = closePopUp;
        var referralURL = globalConstants.javaWebServiceBaseV4 + 'referal';
        vm.showThanKYouMsg = false;
        vm.closeThankYou = closeThankYou;
        vm.getArrayByName = getArrayByName;
        vm.states = getArrayByName(masterData.getMasterData().states);

        function save() {
            if (utils.isEmptyVal(vm.referral_info.firstName)) {
                notificationService.error("Please enter First Name");
                return;
            }
            if (utils.isEmptyVal(vm.referral_info.lastName)) {
                notificationService.error("Please enter Last Name");
                return;
            }
            if (utils.isEmptyVal(vm.referral_info.emailId)) {
                notificationService.error("Please enter Email Id");
                return;
            }

            if (utils.isEmptyVal(vm.referral_info.phoneNumber)) {
                notificationService.error("Please enter Phone Number");
                return;
            }
            var deferred = $q.defer();
            $http({
                url: referralURL,
                method: "POST",
                data: vm.referral_info
            }).success(function (response, status) {
                vm.showThanKYouMsg = true;
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                vm.showThanKYouMsg = false;
                ee.status = status;
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function referagain(){
            vm.referral_info = {
                firstName: "",
                lastName: "",
                firmName: "",
                emailId: "",
                phoneNumber: "",
                city:"",
                state:""
            };
            vm.showThanKYouMsg = false;
        }

        function getArrayByName(data) {
            var data_array = [];
            angular.forEach(data, function (k, v) { // convert object to array for type
                data_array.push(k.name);
            });
            return data_array;

        }


        function closeThankYou() {
            $modalInstance.close();
        }


        function closePopUp() {
            $modalInstance.dismiss();
        }

        function checkIfEnterKeyWasPressed(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
            return true;

        };
    }
})(angular);