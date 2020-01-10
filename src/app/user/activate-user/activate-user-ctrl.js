(function (angular) {
    'use strict';

    angular.module('cloudlex.user')
        .controller('ActivateUser', ActivateUser)

    ActivateUser.$inject = ['$state', '$stateParams', 'routeManager',
        'notification-service', 'isLinkActive', 'activateUserDatalayer'];

    function ActivateUser($state, $stateParams, routeManager,
        notificationService, isLinkActive, activateUserDatalayer) {
        var vm = this;

        vm.activateUser = activateUser;
        vm.goToLogin = false;

        (function () {
            vm.display = {
                setPassword: isLinkActive.active,
                loggedIn: isLinkActive.loggedIn,
                expired: isLinkActive.expired || isLinkActive.used
            };

            if (vm.display.loggedIn) {
                var preState = routeManager.getPreviousState();
                notificationService.error('Already logged in, please log out to use the link.');

                var isLoggedIn = localStorage.getItem('loggedIn') == 'true';
                isLoggedIn ? $state.go('dashboard.analytics') : $state.go('login');
                return;
            }

            vm.display.main = true;
        })();

        function activateUser(newPass, cnfrmPass) {
            var params = {
                uid: $stateParams.uid,
                hashed_pass: $stateParams.hashed_pass,
                timestamp: $stateParams.timestamp,
                new_pass: newPass,
                confirm_pass: cnfrmPass
            };

            activateUserDatalayer.activateUser(params)
                .then(function (res) {
                    if (res.data[0] == true) {
                        vm.goToLogin = true;
                    }
                }, function (e) {
                    var errorMsg = e.data[0];
                    notificationService.error(errorMsg);
                });
        }

    }


    angular.module('cloudlex.user')
        .controller('ForgotPasswordCtrl', ForgotPasswordController);

    ForgotPasswordController.$inject = ['$state', 'activateUserDatalayer', 'notification-service'];
    function ForgotPasswordController($state, activateUserDatalayer, notificationService) {

        var vm = this;

        vm.forgotPassword = forgotPassword;

        function forgotPassword(email) {
            activateUserDatalayer.forgotPassword(email)
                .then(function (res) {
                    var successMsg = res.data[0];
                    notificationService.success(successMsg);
                    $state.go('login');
                }, function (err) {
                    if (err.status === 403) {
                        var msg = err.data[0];
                        notificationService.error(msg);
                    }
                });
        }

    }

})(angular);


(function (angular) {
    'use strict';

    angular.module('cloudlex.user')
        .factory('activateUserDatalayer', ['$http', 'globalConstants', function ($http, globalConstants) {

            var resetPasswordUrl = globalConstants.webServiceBase + 'lexvia_users/password_reset.json?';
            var forgotPassword = globalConstants.webServiceBase + 'practice/forgotpass.json?email=';

            return {
                isLinkActive: _isLinkActive,
                activateUser: _activateUser,
                forgotPassword: _forgotPassword
            };

            function _isLinkActive(params) {
                params.action = 'validatelink';
                var url = resetPasswordUrl + utils.getParams(params);
                return $http.get(url);
            }

            function _activateUser(params) {
                params.action = 'resetpass';
                params.new_pass = encodeURIComponent(params.new_pass);
                params.confirm_pass = encodeURIComponent(params.confirm_pass);

                var queryParams = utils.getParams(params);
                var url = resetPasswordUrl + queryParams;
                return $http.get(url);
            }

            function _forgotPassword(email) {
                var url = forgotPassword + email;
                return $http.get(url);
            }

        }])


})(angular);