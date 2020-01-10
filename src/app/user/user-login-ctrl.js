(function () {

    'use strict';

    angular
        .module('cloudlex.user')
        .controller('LoginCtrl', LoginController);

    LoginController.$inject = ['$timeout', 'loginDatalayer', '$state', 'userSession', 'masterData', 'notification-service', 'mailboxDataServiceV2', '$stateParams'];

    function LoginController($timeout, loginDatalayer, $state, userSession, masterData, notificationService, mailboxDataServiceV2, $stateParams) {
        var vm = this;
        //init user object
        vm.user = {};
        vm.slide = false;
        vm.refreshToken = "";
        vm.firmSettingData = { API: "PHP", state: "mailbox" };
        vm.allfirmData = [{ API: "JAVA", state: "contacts" }];
        vm.notificationIntervalFlag = false;
        vm.loginImg1 = "styles/images/marketplace-images/slide-1.svg";
        vm.loginImg2 = "styles/images/marketplace-images/slide-2.svg";
        vm.loginImg3 = "styles/images/marketplace-images/slide-3.svg";
        vm.loginImg4 = "styles/images/marketplace-images/slide-4.svg?v=12";
        vm.loginImg5 = "styles/images/marketplace-images/slide-5.svg";

        if (utils.isNotEmptyVal($stateParams.userId)) {
            var loginJSON = {
                'username': $stateParams.userId,
                'password': $stateParams.password,
            }
            vm.hidePage = true;
            $timeout(function () {
                authenticate(loginJSON);
            }, 10);

        } else {
            vm.hidePage = false;
        }

        //authenticate user and get the token if user is authenticated
        var loginRequestSent = false;
        vm.authenticate = function (user) {
            if (utils.isEmptyVal(user.username) && utils.isEmptyVal(user.password)) {
                notificationService.error('Enter Username and Password.');
                user.password = '';
                user.username = '';
                return;
            }

            else if (utils.isEmptyVal(user.username)) {
                notificationService.error('Enter Username.');
                user.username = '';
                return;
            }
            else if (utils.isEmptyVal(user.password)) {
                notificationService.error('Enter Password.');
                user.password = '';
                return;
            }

            var userCredentials = angular.copy(user);
            delete user.password;
            delete user.username;

            user.hiddenPassword = userCredentials.password;
            user.hiddenUsername = userCredentials.username;

            delete userCredentials.hiddenPassword;
            delete userCredentials.hiddenUsername;

            $timeout(function () {
                loginRequestSent === false ? authenticate(userCredentials) : angular.noop();
            }, 300);
        };

        function authenticate(userCredentials) {
            loginRequestSent = true;
            loginDatalayer.authenticateUser(userCredentials)
                .then(function (response) {
                    loginRequestSent = false;
                    userSession.data = response;
                    var fname = response.user.field_first_name.und[0].value;
                    var lname = response.user.field_last_name.und[0].value;
                    var user_id = response.user.uid;
                    localStorage.setItem('firm_name', response.user.field_firm_name.und[0].value);
                    localStorage.setItem('user_fname', fname);
                    localStorage.setItem('user_lname', lname);
                    localStorage.setItem('user_email', userCredentials.username);
                    //console.log('login response response.user.picture.url ', response.user.picture.url);
                    if (angular.isDefined(response) && angular.isDefined(response.user) && utils.isNotEmptyVal(response.user.picture) && angular.isDefined(response.user.picture) && angular.isDefined(response.user.picture.url)) {
                        localStorage.setItem('userDp', response.user.picture.url);
                    }

                    // call for java API login
                    var loginJSON = {
                        'username': userCredentials.username,
                        'password': userCredentials.password,
                    }
                    loginDatalayer.authenticateJavaService(loginJSON)
                        .then(function (response) {
                            // store access token and refresh token in localStorage
                            localStorage.setItem('accessToken', response.token.accessToken);
                            localStorage.setItem('refreshToken', response.token.refreshToken);
                            localStorage.setItem('userId', user_id);
                            localStorage.setItem('fid', response.firm_id);

                            var token = {
                                'Authorization': "Bearer " + localStorage.getItem('accessToken')
                            }

                            // user details API call
                            userDetails(token);
                            var supportSettings = { state: "support", enabled: "0" };

                            masterData.fetchFirmData().then(function (response) {
                                if (response) {
                                    //store firm data in localstorage
                                    vm.allfirmData = response;
                                    _.forEach(vm.allfirmData, function (currentItem) {
                                        if (currentItem.state == "contacts") {
                                            currentItem.API = "JAVA";
                                        }
                                    });
                                    var contactSett = _.findWhere(vm.allfirmData, { state: "contacts" });
                                    if (!contactSett) {
                                        vm.allfirmData.push({ state: "contacts", API: "JAVA" });
                                    }
                                    localStorage.setItem('allFirmSetting', JSON.stringify(vm.allfirmData));
                                    _.forEach(response, function (currentItem, index, array) {
                                        if (currentItem.state == "mailbox") {
                                            vm.firmSettingData = currentItem;
                                        }
                                        if (currentItem.state == "support") {
                                            supportSettings = currentItem;
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
                                localStorage.setItem('supportSettings', JSON.stringify(supportSettings));
                                var firmSettingData = JSON.parse(localStorage.getItem('firmSetting'));
                                if (utils.isNotEmptyVal(firmSettingData)) {
                                    if (firmSettingData.API == 'JAVA') {
                                        javaEmailInbox();
                                    }
                                }

                                getToken(userCredentials);


                            }, function (error) {
                                localStorage.setItem('supportSettings', JSON.stringify(supportSettings));
                                localStorage.setItem('launchpadSetting', JSON.stringify({ state: "launchpad", enabled: 1 }));
                                if (error && error.status == 412) {
                                    getToken(userCredentials);
                                } else {
                                    // Bug#9008 - hide notification error for superadmin role
                                    if (!(localStorage.getItem('userRole') == "LexviasuperAdmin")) {
                                        notificationService.error("Unable to fetch masterData!");
                                    }
                                }

                            });
                            // console.log(response);
                        }, function (status) {
                            loginRequestSent = false;
                            if (status === 401) {
                                // console.log("status code 401");
                            }
                        });

                }, function (status) {
                    loginRequestSent = false;
                    if (status === 403) {
                        notificationService.error("The user has not been activated or blocked");
                    }
                    if (status === 406) {
                        $state.go('launcher');
                    }
                });



        }

        // get user details from java API service call 
        function userDetails(token) {
            // user details request
            loginDatalayer.userDetails(token)
                .then(function (response) {
                    if (response.errorCode != undefined) {
                        if (response.errorCode == 103) {
                            refreshToken({
                                'refreshToken': localStorage.getItem('refreshToken')
                            });
                        }
                    }
                    //console.log(response);
                }, function (status) {
                    loginRequestSent = false;
                    if (status === 401) {
                        refreshToken({
                            'refreshToken': localStorage.getItem('refreshToken')
                        });
                    }
                });
        }

        /**
         * Get email indexbox for providing email notification count
         */
        function javaEmailInbox() {
            mailboxDataServiceV2.getInboxList(1, 0, 'desc')
                .then(function (repsonse) {
                    console.log("Java Inbox email for providing notification count!");
                }, function (error) {
                    console.log("Unable to load java inbox email for providing notification count!");
                })
        }

        // get refresh token from java API service call
        function refreshToken(token) {

            // get new access token for refresh token request
            loginDatalayer.refreshToken(token)
                .then(function (response) {

                    localStorage.setItem('accessToken', response.accessToken);

                    var token = {
                        'Authorization': "Bearer " + localStorage.getItem('accessToken')
                    }

                    // user details API call
                    userDetails(token);
                    // console.log(response);
                }, function (status) {
                    loginRequestSent = false;
                    if (status === 401) {
                    }
                });
        }

        //get the token and store the token
        function getToken(data) {
            localStorage.setItem('suData', JSON.stringify(data));
            loginDatalayer.getToken()
                .then(function (response) {
                    userSession.storeToken(response); //token stored
                    if (localStorage.getItem('fid') != 0) {
                        masterData.fetchMasterData()
                            .then(function () {
                                masterData.fetchUserRole()
                                    .then(function () {
                                        loginDatalayer.navigateUserToLanding();
                                    }, function () {
                                        alert('unable to fetch user role');
                                    });
                            });
                    } else {
                        masterData.fetchUserRole()
                            .then(function () {
                                loginDatalayer.navigateUserToLanding();
                            }, function () {
                                alert('unable to fetch user role');
                            });
                    }


                }, function (error) {
                    //TODO : handle error response
                    alert("token not received");
                });
        };

    }


    angular
        .module('cloudlex.user')
        .controller('EmailLoginCtrl', EmailLoginController);


    EmailLoginController.$inject = ['loginDatalayer', '$state', '$stateParams', 'userSession', 'masterData'];
    function EmailLoginController(loginDatalayer, $state, $stateParams, userSession, masterData) {
        var vm = this;
        //init user object
        vm.user = {};

        //authenticate user and get the token if user is authenticated
        vm.authenticate = function (user) {
            var token = $stateParams.token;
            loginDatalayer.authenticateUser(user, token)
                .then(function (response) {
                    userSession.data = response;
                    getToken();
                }, function (error) {

                });
        };

        //get the token and store the token
        function getToken() {
            loginDatalayer.getToken()
                .then(function (response) {
                    userSession.storeToken(response); //token stored
                    masterData.fetchMasterData()
                        .then(function () {
                            masterData.fetchUserRole()
                                .then(function () {
                                    $state.go('referred-in-matters', { tab: 'in' });
                                }, function () {
                                    alert('unable to fetch user role');
                                })
                        });
                }, function (error) {
                    //TODO : handle error response
                    alert("token not received");
                });
        };

    }

})();