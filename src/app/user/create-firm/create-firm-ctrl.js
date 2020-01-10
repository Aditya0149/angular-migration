(function (angular) {
    'use strict';

    angular.module('cloudlex.user')
        .controller('createFirmCtrl', createFirmCtrl)

    createFirmCtrl.$inject = ['$state', '$scope', '$stateParams', 'Password',
        'notification-service', '$rootScope', 'createFirmDatalayer', 'isFirmLinkActive', 'vcRecaptchaService', 'globalConstants',
    ];

    function createFirmCtrl($state, $scope, $stateParams, Password,
        notificationService, $rootScope, createFirmDatalayer, isFirmLinkActive, vcRecaptchaService, globalConstants) {
        var vm = this;
        vm.signIn = signIn;
        vm.checkAllPasswordEntered = checkAllPasswordEntered;
        vm.checkPasswordSimilarity = checkPasswordSimilarity;
        vm.isPasswordStrong = isPasswordStrong;
        vm.isPasswordWeak = isPasswordWeak;
        vm.passwordEntered = passwordEntered;
        vm.passwordStrength = {};
        vm.firmInfo = {};
        vm.firmInfo.smppassword = '';
        vm.firmInfo.mail = isFirmLinkActive.email_to;
        $scope.respone1 = '';
        vm.resetForm = resetForm;

        $scope.secretKey = "6LdnJCsUAAAAAL2-NMHtWIfAqrkBhE98WJ31G9sk";
        vm.userInfo = {
            token: $stateParams.token
        };

        if (localStorage.getItem('toReferredIntakeLink') == 1) {
            localStorage.setItem("gotoState", 'referred-intake');
        } else {
            localStorage.setItem("gotoState", 'referred-matters');
        }


        (function () {
            /**
             * code to find out system ip address which is required as captcha validation paramenter
             * to validate captcha on server end  
             */
            window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection; //compatibility for firefox and chrome
            var pc = new RTCPeerConnection({
                iceServers: []
            }),
                noop = function () { };
            pc.createDataChannel(""); //create a bogus data channel
            pc.createOffer(pc.setLocalDescription.bind(pc), noop); // create offer and set local description
            pc.onicecandidate = function (ice) { //listen for candidate events
                if (!ice || !ice.candidate || !ice.candidate.candidate) return;
                vm.myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
                console.log('my IP: ', vm.myIP);
                pc.onicecandidate = noop;
            };

            vm.recaptchaStr = globalConstants.createFirmRecaptcha;

        })();


        function resetForm(data) {
            vm.firmInfo = {};
            vm.firmInfo.smppassword = '';
            vm.firmInfo.firmSize = '';
            vm.firmInfo.telephone_no = '';
            vm.firmInfo.mail = isFirmLinkActive.email_to;
        }


        function signIn(info) {
            if (vcRecaptchaService.getResponse() === "") { //if string is empty
                notificationService.error("Please resolve the captcha and submit!");
            } else {
                registerNewUser(info);
            }



        }

        function registerNewUser(info) {
            var postUserInfo = [];
            var postData = angular.copy(info);
            postData.plan_id = 2
            postData.plan_start_date = (moment(new Date()).startOf('day')).unix();
            postData.plan_transaction_date = (moment(new Date()).startOf('day')).unix();
            postData.amount = 0
            postData.transaction_id = "ord"
            postData.order_id = "ord";
            postData.firm_status = "active"
            postData.token = vm.userInfo.token;
            postUserInfo.push(postData);
            $rootScope.showWaitMessage = true;
            $rootScope.waitMessage = "Please wait while we are processing your request. Kindly do not refresh.";
            createFirmDatalayer.registerNewUser(postUserInfo)
                .then(function (res) {
                    notificationService.success('firm created successfully');

                    //$timeout(function () {
                    $rootScope.display.sideNav = false;
                    $state.go('autologin', { userId: info.mail, password: info.smppassword }, { reload: true });
                    //}, 10);
                    //$state.go('login');	
                }, function (e) {
                    $rootScope.showWaitMessage = false;
                    $rootScope.waitMessage = "";
                    if (e.status == 400) {
                        notificationService.error('Please correct errors below');
                    } else if (e.status == 401) {
                        notificationService.error('Token Invalid');
                    } else {
                        notificationService.error('unable to create new firm');
                    }

                });

        }


        function passwordEntered() {
            if (angular.isDefined(vm.firmInfo.smppassword)) {
                checkPasswordSimilarity(vm.firmInfo.smppassword, vm.firmInfo.confirm_smppassword);

            }
        }


        $scope.$watch(function () {
            return vm.firmInfo.smppassword;
        }, function (pass) {
            checkPasswordSimilarity(vm.firmInfo.smppassword, vm.firmInfo.confirm_smppassword);
            vm.passwordStrength = Password.getStrength(pass);
            if (vm.passwordStrength.score < 40) {
                vm.passwordStrength.durable = "Weak";
            } else if (vm.passwordStrength.score >= 40 && vm.passwordStrength.score <= 70) {
                vm.passwordStrength.durable = "Good";
            } else if (vm.passwordStrength.score > 70) {
                vm.passwordStrength.durable = "Strong";
            }
            if (isPasswordWeak()) {
                if (angular.isDefined($scope.createfirm) && angular.isDefined($scope.createfirm.firmInfo.smppassword)) {
                    $scope.createfirm.createfirmForm.smppassword.$setValidity('strength', false);
                }
            } else {
                if (angular.isDefined($scope.createfirm) && angular.isDefined($scope.createfirm.firmInfo.smppassword)) {
                    $scope.createfirm.createfirmForm.smppassword.$setValidity('strength', true);
                }
            }
        });

        function isPasswordWeak() {
            return vm.passwordStrength.score < 40;
        }

        function isPasswordStrong() {
            return vm.passwordStrength.score > 70;
        }



        function checkPasswordSimilarity(newPass, confPass) {
            if (newPass === confPass) {
                vm.confirmPasswordFlag = true;
            } else {
                vm.confirmPasswordFlag = false;

            }
        }

        function checkAllPasswordEntered(currPass, newPass, confPass) {
            var allPasswordEntered = false;
            if (utils.isNotEmptyVal(currPass) && currPass.length > 0) {
                if (utils.isNotEmptyVal(newPass) && utils.isNotEmptyVal(confPass)) {
                    allPasswordEntered = false;
                } else {
                    allPasswordEntered = true;
                }
            }
            if (utils.isNotEmptyVal(newPass) && newPass.length > 0) {
                if (utils.isNotEmptyVal(currPass) && utils.isNotEmptyVal(confPass)) {
                    allPasswordEntered = false;
                } else {
                    allPasswordEntered = true;
                }
            }
            if (utils.isNotEmptyVal(confPass) && confPass.length > 0) {
                if (utils.isNotEmptyVal(currPass) && utils.isNotEmptyVal(newPass)) {
                    allPasswordEntered = false;
                } else {
                    allPasswordEntered = true;
                }
            }
            return allPasswordEntered;
        }



    }


})(angular);


(function (angular) {
    'use strict';

    angular.module('cloudlex.user')
        .factory('createFirmDatalayer', ['$http', 'globalConstants', function ($http, globalConstants) {
            var getvalidatemail = globalConstants.webServiceBase + 'lexvia_referral/getinviteemail?';
            var registerNewUserurl = globalConstants.webServiceBase + 'practice/lexvia_firm_createfirm';
            var resendRequestUrl = globalConstants.webServiceBase + 'lexvia_referral/requestresend?';

            return {
                checkFirmLinkActive: checkFirmLinkActive,
                registerNewUser: registerNewUser,
                resendReferralRequest: resendReferralRequest
            };

            function checkFirmLinkActive(params) {
                var url = getvalidatemail + utils.getParamsOnly(params);
                return $http.get(url);
            }

            function registerNewUser(params) {
                var url = registerNewUserurl //+ utils.getParamsOnly(userData)         
                return $http.post(url, params);
            }

            /**
             * resend request for referral 
             */
            function resendReferralRequest(params) {
                var url = resendRequestUrl + utils.getParamsOnly(params)
                return $http.get(url, params);
            }



        }])


})(angular);

/**
 * resend token is token expierd controller 
 */
(function () {
    angular
        .module('cloudlex.user')
        .controller('referralExpTokenCtrl', referralExpTokenCtrl);

    referralExpTokenCtrl.$inject = ['$stateParams', 'createFirmDatalayer', 'notification-service'];

    function referralExpTokenCtrl($stateParams, createFirmDatalayer, notificationService) {
        var vm = this;


        vm.resendRequest = resendRequest;
        vm.token = $stateParams.token;

        function resendRequest() {
            var postData = {};
            postData.token = vm.token
            createFirmDatalayer.resendReferralRequest(postData)
                .then(function (res) {
                    notificationService.success('Resend request sent successfully');
                }, function (e) {
                    notificationService.error('unable to resend request');
                });
        }


    }

})();
