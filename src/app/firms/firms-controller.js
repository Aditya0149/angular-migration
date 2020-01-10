(function () {
    'use strict';

    angular
        .module('cloudlex.firms')
        .controller('FirmsCtrl', FirmsController);

    FirmsController.$inject = ['firmsDataService', 'notification-service', 'masterData', '$rootScope', 'loginDatalayer', '$stateParams'];

    function FirmsController(firmsDataService, notificationService, masterData, $rootScope, loginDatalayer, $stateParams) {

        var vm = this;
        vm.saveProceed = saveProceed;
        vm.loginCredentials = $stateParams.credentials; //US#8543
        vm.firmData = { API: "PHP", state: "mailbox" };

        // Init
        (function () {
            vm.firmsList = [];
            getFirms();
        })();

        // Get all firms
        function getFirms() {

            firmsDataService.getAllFirms()
                .then(function (response) {
                    var firms = response.data;
                    vm.firmsList = firms;
                }, function (error) {
                    notificationService.error('Unable to load firms');
                });
        }

        // save and proceed
        function saveProceed(firmId) {
            vm.firmSettingData = { API: "PHP", state: "mailbox" };
            vm.allfirmData = [{ API: "JAVA", state: "contacts" }];
            // Bug#9008 - Call fetchFirmData with parameters
            masterData.fetchFirmData(firmId).then(function (response) {
                if (response) {
                    //store firm data in localstorage
                    vm.allfirmData = response;

                    localStorage.setItem('allFirmSetting', JSON.stringify(vm.allfirmData));
                    _.forEach(response, function (currentItem, index, array) {
                        if (currentItem.state == "mailbox") {
                            vm.firmSettingData = currentItem;
                        }
                    });
                    localStorage.setItem('firmSetting', JSON.stringify(vm.firmSettingData));

                    var launchpadSett = _.findWhere(vm.allfirmData, { state: "launchpad" });
                    if (launchpadSett) {
                        launchpadSett.enabled = 1;
                        localStorage.setItem('launchpadSetting', JSON.stringify(launchpadSett));
                    } else {
                        localStorage.setItem('launchpadSetting', JSON.stringify({ state: "launchpad", enabled: 1 }));
                    }


                } else {
                    //vm.firmSettingData
                    localStorage.setItem('firmSetting', JSON.stringify(vm.firmSettingData));
                    localStorage.setItem('allFirmSetting', JSON.stringify(vm.allfirmData));
                    localStorage.setItem('launchpadSetting', JSON.stringify({ state: "launchpad", enabled: 1 }));
                }

                firmsDataService.saveAndProceed(firmId)
                    .then(function (data) {
                        localStorage.setItem('isFirmSelected', true);
                        //fetch the user role for the newly selected firm
                        masterData.fetchUserRole()
                            .then(function () {
                                /*
                                * US#8543 to send firm id in java auth
                                */
                                var userRole = masterData.getUserRole();
                                $rootScope.$emit('updatereferralIcon', 'updateIcon');
                                var data = localStorage.getItem('suData');
                                data = JSON.parse(data);
                                vm.loginCredentials = vm.loginCredentials ? data : vm.loginCredentials;
                                vm.userData = { 'username': vm.loginCredentials.username, 'password': vm.loginCredentials.password, 'firmId': parseInt(userRole.firm_id) };

                                loginDatalayer.authenticateJavaService(vm.userData)
                                    .then(function (response) {
                                        localStorage.setItem('accessToken', response.token.accessToken);
                                        localStorage.setItem('refreshToken', response.token.refreshToken);

                                        loginDatalayer.navigateUserToLanding(true);
                                    })

                            })

                    }, function () {
                        notificationService.error('An error occurred. Please try later.');
                    });
            }, function (error) {
            });

        }

    }


})();