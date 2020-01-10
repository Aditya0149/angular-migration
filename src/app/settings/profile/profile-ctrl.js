// jshint maxdepth:2
// jshint maxstatements:30
// jshint unused:true

(function() {
    'use strict';

    /**
     * @ngdoc controller
     * @name cloudlex.settings.controller:ProfileCtrl
     * @requires '$scope', 'profileDataLayer', 'profileHelper', 'Upload','Password', 'notification-service', 'masterData'
     * @description
     * The ProfileCtrl manages the user profile details.
     * It manages the user profile related data.
     */
    angular
        .module('cloudlex.settings')
        .controller('ProfileCtrl', ProfileController);

    ProfileController.$inject = ['$scope', 'profileDataLayer', 'profileHelper', 'Upload',
        'Password', 'notification-service', 'masterData', 'routeManager', 'practiceAndBillingDataLayer', 'globalConstants'
    ];

    function ProfileController($scope, profileDataLayer, profileHelper, Upload,
        Password, notificationService, masterData, routeManager, practiceAndBillingDataLayer, globalConstants) {

        var vm = this;
        vm.viewProfileFlag = true;
        vm.passwordEnteredFlag = false;
        vm.confirmPasswordFlag = false;
        vm.viewProfileData = {};
        vm.editProfileData = {};
        vm.passwordStrength = {};
        vm.userRoleObj = {};
        vm.selectedImageFile = {};
        vm.files = [];
        vm.uploadData = {
            file: []
        };
        vm.configInfoEmailData = {};

        vm.disableFirmSize = true;
        vm.configuredinfo = {};
        var calenderData;
        var dropboxurl;
        var googleDriveurl;
        var msExchangeUrl;
        var oneDriveurl;
        var DocuSignurl;
        var ExpenseMangerurl;

        vm.handleFileSelect = handleFileSelect;
        vm.saveCroppedImage = saveCroppedImage;
        vm.editProfile = editProfile;
        vm.cancelEdit = cancelEdit;
        vm.croppedImageFlag = false;
        vm.isInputValid = isInputValid;
        vm.isInputInValid = isInputInValid;
        vm.isPasswordStrong = isPasswordStrong;
        vm.isPasswordOk = isPasswordOk;
        vm.isPasswordWeak = isPasswordWeak;
        vm.passwordEntered = passwordEntered;
        vm.checkPasswordSimilarity = checkPasswordSimilarity;
        vm.saveProfile = saveProfile;
        vm.checkAllPasswordEntered = checkAllPasswordEntered;
        // US# 5341 update and save user configuration 
        vm.info = {};
        // vm.info.is_googleCalender = 1;
        //  vm.saveConfigEmailData = saveConfigEmailData ;
        vm.resetMicroExchangeData = resetMicroExchangeData;
        vm.passwordEmptyflag = false;
        vm.getConfiguredData = getConfiguredData;
        vm.setmsUserName = setmsUserName;
        vm.msusernameChangeFlag = false;

        vm.getConfigGoogleDrive = getConfigGoogleDrive;
        vm.getRevokeGoogleDrive = getRevokeGoogleDrive;

        vm.getConfigOneDrive = getConfigOneDrive;
        vm.getRevokeOneDrive = getRevokeOneDrive;

        // US:16596 DocuSign
        vm.getConfigDocuSign = getConfigDocuSign;
        vm.getRevokeDocuSign = getRevokeDocuSign;

        //US16929 : Expense Manager (Quickbooks integration)
        vm.getConfigQuickBooks = getConfigQuickBooks;
        vm.getRevokeQuickBooks = getRevokeQuickBooks;


        vm.getConfigGoogleCal = getConfigGoogleCal;
        vm.getConfigMsExchange = getConfigMsExchange;
        vm.getRevokeMsExchange = getRevokeMsExchange;
        vm.getRevokeGoogleCal = getRevokeGoogleCal;
        vm.getConfigDrpbox = getConfigDrpbox;
        vm.getIcalLink = getIcalLink;


        var REDIRECT = globalConstants.webServiceRedirectUrl;
        // console.log(REDIRECT);
        var win;
        var isExpenseActive = localStorage.getItem('isExpenseActive');





        (function() {
            getViewProfile();
            /* file upload watch */
            vm.myImage = '';
            vm.myCroppedImage = '';
            angular.element(document.querySelector('#fileInput')).on('change', handleFileSelect);
            setBreadcrum();
            getConfiguredData();
            callGooglecalender(); // for future enhancement uncomment the code 
            callDropbox();
            callGoogleDrive(); // for future enhancement uncomment the code 
            callOneDrive();
            callMsExchange();
            // US:16596 DocuSign
            // callDocuSign();


        })();


        vm.msversions = [{ id: "6", name: "Office 365 and Exchange Online" },
            { id: "5", name: "Exchange 2013 SP1" },
            { id: "4", name: "Exchange 2013" },
            { id: "3", name: "Exchange 2010 SP2" },
            { id: "2", name: "Exchange 2010 SP1" },
            { id: "1", name: "Exchange 2010" },
            { id: "0", name: "Exchange 2007 SP1" }
        ];


        function setBreadcrum() {
            var initCrum = [{ name: '...' }, { name: 'Settings' }, { name: 'My Profile' }];
            routeManager.setBreadcrum(initCrum);
        }


        function setmsUserName() {
            vm.msusernameChangeFlag = true;
        }

        function getConfiguredData() {
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function(data) {

                var resData = data.matter_apps;
                if (angular.isDefined(resData) && resData != '' && resData != ' ') {
                    vm.configuredinfo.is_googleDrive = resData.google_drive;
                    vm.configuredinfo.is_onedrive = resData.onedrive;
                    // US:16596 DocuSign
                    vm.configuredinfo.is_eSignature = resData.docusign;

                    vm.configuredinfo.is_dropBox = resData.dropbox;
                    vm.configuredinfo.is_googleCalender = resData.google_calendar;
                    vm.configuredinfo.is_Ical = resData.icalendar;
                    vm.configuredinfo.is_microsoftExchange = resData.ms_exchange;
                    vm.configuredinfo.is_emailVCloudlex = resData.google_mail;
                    vm.configuredinfo.is_CustomFileNumber = resData.file_number;
                    // vm.configuredinfo.is_allevent = parseInt(resData.is_allevent);                                      
                }

                var expesneData = data.EM;
                if (angular.isDefined(expesneData) && expesneData != '' && expesneData != ' ') {
                    // US:16929 Expense Manager (Quickbooks integration)
                    vm.configuredinfo.is_quickBooks = expesneData.is_active;

                }
            });
        }

        //  /** US#5341 this method save Email Configuration data */
        function resetMicroExchangeData(info) {
            vm.info.msusername = '';
            vm.info.mspassword = '';
            vm.info.msversion = '';

        }


        function getIcalLink() {
            var response = profileDataLayer.getIcalLink();
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    if (angular.isDefined(data[0])) {
                        var url = data[0];
                        vm.iCalLink = url;
                        vm.userMessage = 'Copy URL to sync with iCal:';
                    }
                }

            }, function(error) {
                notificationService.error(error.data[0]);
            });
        }


        function callMsExchange() {
            var response = profileDataLayer.callMsExchange();
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    if (angular.isDefined(data[0])) {
                        var url = data[0];
                        url.replace(/['"]+/g, '');
                        msExchangeUrl = url;
                    }
                }

            }, function(error) {
                notificationService.error(error.data[0]);
            });
        }

        function callGoogleDrive() {
            var response = profileDataLayer.callGoogleDrive();
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    if (angular.isDefined(data[0])) {
                        var url = data[0];
                        url.replace(/['"]+/g, '');
                        googleDriveurl = url;
                    }
                }

            }, function(error) {
                notificationService.error(error.data[0]);
            });
        }


        function getConfigGoogleDrive() {
            var win = window.open(googleDriveurl, "GoogleDrive", 'width=600, height=400');
            win.focus();
            var pollTimer = window.setInterval(function() {
                try {
                    //console.log(win.document.URL);
                    if (win.document.URL.indexOf(REDIRECT) != -1) {
                        window.clearInterval(pollTimer);
                        var url = win.document.URL;
                        var params = url.split("?")[1].split("&");
                        var acToken = params[0];
                        var response = profileDataLayer.getConfigGoogleDrive(acToken);
                        response.then(function(response) {
                            win.close();
                            window.focus();
                            getViewProfile();
                            console.log("success");
                        }, function(error) {
                            notificationService.error(error.data[0]);
                        });

                        //   win.close();
                        window.focus();
                    }
                } catch (e) {}
            }, 5000);
        }

        function getRevokeGoogleDrive() {
            var response = profileDataLayer.revokeGoogleDrive();
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    getViewProfile();
                }

            }, function(error) {
                notificationService.error(error.data[0]);
            });
        }


        function callOneDrive() {
            var response = profileDataLayer.callOneDrive();
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    if (angular.isDefined(data[0])) {
                        var url = data[0];
                        url.replace(/['"]+/g, '');
                        oneDriveurl = url;
                    }
                }

            }, function(error) {
                notificationService.error(error.data[0]);
            });
        }


        function getConfigOneDrive() {
            var win = window.open(oneDriveurl, "OneDrive", 'width=600, height=400');
            win.focus();
            var pollTimer = window.setInterval(function() {
                try {
                    //console.log(win.document.URL);
                    if (win.document.URL.indexOf(REDIRECT) != -1) {
                        window.clearInterval(pollTimer);
                        var url = win.document.URL;
                        var params = url.split("?")[1].split("#");
                        var acToken = params[0];
                        var response = profileDataLayer.getConfigOneDrive(acToken);
                        response.then(function(response) {
                            win.close();
                            window.focus();
                            getViewProfile();
                            console.log("success");
                        }, function(error) {
                            notificationService.error(error.data[0]);
                        });

                        //   win.close();
                        window.focus();
                    }
                } catch (e) {}
            }, 5000);
        }

        function getRevokeOneDrive() {
            var response = profileDataLayer.revokeOneDrive();
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    getViewProfile();
                }

            }, function(error) {
                notificationService.error(error.data[0]);
            });
        }

        // US:16596 Config DocuSign
        function callDocuSign() {
            var response = profileDataLayer.callDocuSign();
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    if (angular.isDefined(data)) {
                        var url = data;
                        url.replace(/['"]+/g, '');
                        DocuSignurl = url;
                    }
                }

            }, function(error) {
                notificationService.error(error.data[0]);
            });
        }

        // US:16596 Config DocuSign
        function getConfigDocuSign() {
            var win = window.open(DocuSignurl, "DocuSign", 'width=600, height=400');
            win.focus();
            var pollTimer = window.setInterval(function() {
                try {
                    //console.log(win.document.URL);
                    if (win.document.URL.indexOf(REDIRECT) != -1) {
                        window.clearInterval(pollTimer);
                        var url = win.document.URL;
                        var params = url.split("?")[1].split("#");
                        var acToken = params[0];
                        var response = profileDataLayer.getConfigDocuSign(acToken);
                        response.then(function(response) {
                            win.close();
                            window.focus();
                            getViewProfile();
                            console.log("success");
                        }, function(error) {
                            notificationService.error(error.data[0]);
                        });

                        //   win.close();
                        window.focus();
                    }
                } catch (e) {}
            }, 5000);
        }

        // US:16596 Revoke DocuSign
        function getRevokeDocuSign() {
            var response = profileDataLayer.revokeDocuSign();
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    getViewProfile();
                }

            }, function(error) {
                notificationService.error(error.data[0]);
            });
        }

        //US16929 : Expense Manager (Quickbooks integration)
        function callQuickBooks() {
            var response = profileDataLayer.callExpenseManger();
            response.then(function(data) {
                data = data.data;
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    if (angular.isDefined(data)) {
                        var url = decodeURIComponent(data);
                        url.replace(/['"]+/g, '');
                        ExpenseMangerurl = url;
                    }
                }

            }, function(error) {
                notificationService.error(error.data[0]);
            });
        }

        //US16929 : Config Expense Manager (Quickbooks integration)
        function getConfigQuickBooks() {
            var win = window.open(ExpenseMangerurl, "ExpenseMangerurl", 'width=600, height=400');
            win.focus();
            var pollTimer = window.setInterval(function() {
                try {
                    //console.log(win.document.URL);
                    if (win.document.URL.indexOf(REDIRECT) != -1) {
                        window.clearInterval(pollTimer);
                        var url = win.document.URL;
                        var params = url.split("?")[1].split("#");
                        var acToken = params[0];
                        var response = profileDataLayer.getConfigExpenseManage(acToken);
                        response.then(function(response) {
                            win.close();
                            window.focus();
                            getViewProfile();
                            console.log("success");
                        }, function(error) {
                            notificationService.error(error.data[0]);
                        });

                        //   win.close();
                        window.focus();
                    }
                } catch (e) {}
            }, 5000);
        }

        //US16929 : Revoke Expense Manager (Quickbooks integration)
        function getRevokeQuickBooks() {
            var response = profileDataLayer.revokeExpenseManage();
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    getViewProfile();
                }

            }, function(error) {
                notificationService.error(error.data[0]);
            });
        }


        function callGooglecalender() {
            var response = profileDataLayer.callGooglecalender();
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    if (angular.isDefined(data[0])) {
                        var url = data[0];
                        url.replace(/['"]+/g, '');
                        calenderData = url;
                    }
                }

            }, function(error) {
                notificationService.error(error.data[0]);
            });
        }


        function getConfigGoogleCal() {
            var win = window.open(calenderData, "GoogleCalender", 'width=600, height=400');
            win.focus();
            var pollTimer = window.setInterval(function() {
                try {
                    //console.log(win.document.URL);
                    if (win.document.URL.indexOf(REDIRECT) != -1) {
                        window.clearInterval(pollTimer);
                        var url = win.document.URL;
                        var params = url.split("?")[1].split("&");
                        var acToken = params[0];
                        var response = profileDataLayer.getConfigGoogleCal(acToken);
                        response.then(function(response) {
                            win.close();
                            window.focus();
                            getViewProfile();
                            console.log("success");
                        }, function(error) {
                            notificationService.error(error.data[0]);
                        });

                        // win.close();                    
                        window.focus();
                        // validateToken(acToken);
                    }
                } catch (e) {}
            }, 5000);
        }


        function getRevokeGoogleCal() {
            var response = profileDataLayer.revokeGooglecalender();
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    getViewProfile();
                }

            }, function(error) {
                notificationService.error(error.data[0]);
            });
        }

        //MS exhange US#6841 requirement change 
        function getConfigMsExchange() {
            var win = window.open(msExchangeUrl, "MSExchange", 'width=600, height=400');
            win.focus();
            var pollTimer = window.setInterval(function() {
                try {
                    //console.log(win.document.URL);
                    if (win.document.URL.indexOf(REDIRECT) != -1) {
                        window.clearInterval(pollTimer);
                        var url = win.document.URL;
                        var params = url.split("?")[1].split("#");
                        var acToken = params[0];
                        var response = profileDataLayer.getConfigMsExchange(acToken);
                        response.then(function(response) {
                            win.close();
                            window.focus();
                            getViewProfile();
                            console.log("success");
                        }, function(error) {
                            notificationService.error(error.data[0]);
                        });

                        // win.close();                    
                        window.focus();
                        // validateToken(acToken);
                    }
                } catch (e) {}
            }, 5000);
        }


        function getRevokeMsExchange() {
            var response = profileDataLayer.revokeMsExchange();
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    getViewProfile();
                }

            }, function(error) {
                notificationService.error(error.data[0]);
            });
        }


        function callDropbox() {
            var response = profileDataLayer.callDropbox();
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    if (angular.isDefined(data[0])) {
                        var url = data[0];
                        url.replace(/['"]+/g, '');
                        dropboxurl = url;
                    }
                }

            }, function(error) {
                notificationService.error(error.data);
            });
        }

        function getConfigDrpbox() {
            var win = window.open(dropboxurl, "Dropbox", 'width=600, height=400');
            win.focus();
            var pollTimer = window.setInterval(function() {
                try {
                    //console.log(win.document.URL);
                    if (win.document.URL.indexOf(REDIRECT) != -1) {
                        window.clearInterval(pollTimer);
                        var url = win.document.URL;
                        var params = url.split("?")[1].split('"');
                        var acToken = params[0];
                        var response = profileDataLayer.getConfigDrpbox(acToken)
                        response.then(function(response) {
                            console.log("success");
                            win.close();
                            window.focus();
                            getViewProfile();
                        }, function(error) {
                            notificationService.error(error.data);
                        });
                    }
                    window.focus();
                } catch (e) {}
            }, 5000);
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.ProfileCtrl#handleFileSelect
         * @methodOf cloudlex.settings.ProfileCtrl
         * @description
         * this method is used to get the change done in upload image file
         */
        function handleFileSelect(evt) {
            vm.selectedImageFile = evt.currentTarget.files[0];
            var reader = new FileReader();
            reader.onload = function(evt) {
                $scope.$apply(function() {
                    vm.myImage = evt.target.result;
                    if (utils.isNotEmptyVal(vm.myImage)) {
                        vm.croppedImageFlag = true;
                    }
                });
            };
            reader.readAsDataURL(vm.selectedImageFile);
        };

        /**
         * @ngdoc method
         * @name cloudlex.settings.ProfileCtrl#checkAllPasswordEntered
         * @methodOf cloudlex.settings.ProfileCtrl
         * @description
         * this method is used to check whether all the password is entered
         */
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

        /**
         * @ngdoc method
         * @name cloudlex.settings.ProfileCtrl#getPostDataObj
         * @methodOf cloudlex.settings.ProfileCtrl
         * @description
         * this method is used to create post data object
         */
        function getPostDataObj() {
            var postObj = {};
            postObj.fname = vm.editProfileData.fname;
            postObj.lname = vm.editProfileData.lname;
            postObj.email_sig = vm.editProfileData.email_sig;
            postObj.phone = vm.editProfileData.phone;
            postObj.office_number = vm.editProfileData.office_number;
            if (angular.isDefined(vm.editProfileData.firm_size)) {
                postObj.fsize = vm.editProfileData.firm_size;
            }
            if (angular.isDefined(vm.currentPassword)) {
                postObj.current_pass = vm.currentPassword;
            }
            if (angular.isDefined(vm.password)) {
                postObj.new_password = vm.password;
            } else {
                postObj.new_password = '';
            }
            if (angular.isDefined(vm.confirmPassword)) {
                postObj.conf_password = vm.confirmPassword;
            } else {
                postObj.conf_password = '';
            }

            //  if(vm.msusernameChangeFlag==true && vm.info.mspassword==''){
            //       notificationService.error("Password Field should not be blank");
            //       return false;                
            // }

            postObj.is_allevent = (vm.info.is_allevent == 1) ? 1 : 0;


            if (!vm.info.msusername == ' ' || !vm.info.mspassword == ' ' || !vm.info.msversion == ' ') {
                postObj.msservice_name = 'MSExchange';
                // if(utils.isNotEmptyVal(vm.info.msusername)){
                postObj.msusername = vm.info.msusername;
                //  }

                if (angular.isDefined(vm.info.mspassword) && utils.isNotEmptyVal(vm.info.msversion.id)) {
                    vm.info.msversion = vm.info.msversion.id;
                }
                if (angular.isDefined(vm.info.mspassword)) {
                    postObj.mspassword = vm.info.mspassword;
                } else {
                    postObj.mspassword = '';
                }
                //  postObj.mspassword =  vm.info.mspassword;
                postObj.msversion = vm.info.msversion;
            } else {
                postObj.msservice_name = 'MSExchange';
                postObj.msusername = '';
                postObj.mspassword = '';
                postObj.msversion = '';
            }

            if (!vm.info.emailViaCloudlex == ' ') {
                postObj.service_name = 'Googlemail';
                postObj.username = vm.info.emailViaCloudlex;
            } else {
                postObj.service_name = 'Googlemail';
                postObj.username = '';

            }
            /**
             * US#8349 set email remainder 
             */
            postObj.email_reminder = { 'event': vm.reminderType.event, 'task': vm.reminderType.task };
            postObj.sms_reminder = { 'event': vm.textReminderType.event, 'task': vm.textReminderType.task };
            localStorage.setItem('reminderType', vm.reminderType);
            localStorage.setItem('textReminderType', vm.textReminderType);
            return postObj;

        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.ProfileCtrl#saveProfile
         * @methodOf cloudlex.settings.ProfileCtrl
         * @description
         * this method is used to save the user details
         */
        function saveProfile() {
            //  if(vm.msusernameChangeFlag==true && vm.info.mspassword==''){
            //       notificationService.error("Password Field should not be blank");
            //       return false;                
            // }
            var postDataObj = getPostDataObj();
            if (parseInt(postDataObj.fsize) != 0) {
                var response = profileDataLayer.saveProfileData(postDataObj, vm.editProfileData.uid);
                response.then(function(data) {
                    if (angular.isDefined(data) && data != '' && data != ' ') {
                        if (angular.isDefined(data.data[0])) {
                            getViewProfile();
                            vm.password = '';
                            vm.currentPassword = '';
                            vm.confirmPassword = '';
                            notificationService.success('Profile Data Saved Successfully');
                        }
                    }
                }, function(error) {
                    notificationService.error(error.data[0]);
                });
            } else {
                notificationService.error('Firm size should not be empty');
            }
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.ProfileCtrl#checkPasswordSimilarity
         * @methodOf cloudlex.settings.ProfileCtrl
         * @description
         * this method is used to check whether new password and confirm password are similar or not
         * @param {newPass, confPass} getting param from UI to check new pass and confirm pass are similar
         */
        function checkPasswordSimilarity(newPass, confPass) {
            if (newPass === confPass) {
                vm.confirmPasswordFlag = true;
                vm.passwordEnteredFlag = true;
            } else {
                vm.confirmPasswordFlag = false;
                vm.passwordEnteredFlag = false;
            }
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.ProfileCtrl#passwordEntered
         * @methodOf cloudlex.settings.ProfileCtrl
         * @description
         * this method is used check password strength
         */
        function passwordEntered() {
            if (angular.isDefined(vm.password)) {
                checkPasswordSimilarity(vm.password, vm.confirmPassword);
                if (vm.password.length > 5) {
                    vm.passwordEnteredFlag = true;
                } else {
                    vm.passwordEnteredFlag = false;
                }
            }
        }

        function isInputValid(input) {
            return input.$dirty && input.$valid;
        }

        function isInputInValid(input) {
            return input.$dirty && input.$invalid;
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.ProfileCtrl#isPasswordWeak
         * @methodOf cloudlex.settings.ProfileCtrl
         * @description
         * this method is used check password strength
         */
        function isPasswordWeak() {
            return vm.passwordStrength.score < 40;
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.ProfileCtrl#isPasswordOk
         * @methodOf cloudlex.settings.ProfileCtrl
         * @description
         * this method is used check password strength
         */
        function isPasswordOk() {
            return vm.passwordStrength.score >= 40 && vm.passwordStrength.score <= 70;
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.ProfileCtrl#isPasswordStrong
         * @methodOf cloudlex.settings.ProfileCtrl
         * @description
         * this method is used check password strength
         */
        function isPasswordStrong() {
            return vm.passwordStrength.score > 70;
        }


        $scope.$watch(function() {
            return vm.password;
        }, function(pass) {
            checkPasswordSimilarity(vm.password, vm.confirmPassword);
            vm.passwordStrength = Password.getStrength(pass);
            if (angular.isDefined(vm.password)) {
                if (vm.password.length > 5 && vm.passwordStrength.satisfyCondition) {
                    vm.passwordEnteredFlag = true;
                } else {
                    vm.passwordEnteredFlag = false;
                }
            }
            if (vm.passwordStrength.score < 40) {
                vm.passwordStrength.durable = "Weak";
            } else if (vm.passwordStrength.score >= 40 && vm.passwordStrength.score <= 70) {
                vm.passwordStrength.durable = "Good";
            } else if (vm.passwordStrength.score > 70) {
                vm.passwordStrength.durable = "Strong";
            }
            if (isPasswordWeak()) {
                if (angular.isDefined($scope.profileCtrl) && angular.isDefined($scope.profileCtrl.password)) {
                    $scope.profileCtrl.profileForm.password.$setValidity('strength', false);
                }
            } else {
                if (angular.isDefined($scope.profileCtrl) && angular.isDefined($scope.profileCtrl.password)) {
                    $scope.profileCtrl.profileForm.password.$setValidity('strength', true);
                }
            }
        });

        /**
         * @ngdoc method
         * @name cloudlex.settings.ProfileCtrl#getViewProfile
         * @methodOf cloudlex.settings.ProfileCtrl
         * @description
         * this method is used get view profile data
         */
        function getViewProfile() {

            vm.croppedImageFlag = false;
            vm.selectedImageFile = {};
            vm.myImage = '';
            vm.myCroppedImage = '';
            document.getElementById('fileInput').value = '';
            var response = profileDataLayer.getViewProfileData();
            response.then(function(data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    vm.viewProfileData = data[0];
                    //US#8561 set email reminder in localStorage
                    vm.reminderType = {};
                    vm.textReminderType = {};
                    localStorage.setItem('reminderType', data[0].email_reminder);
                    localStorage.setItem('textReminderType', data[0].sms_reminder);
                    var remind = localStorage.getItem('reminderType');
                    var textRemind = localStorage.getItem('textReminderType');
                    vm.reminderType = JSON.parse(remind);
                    vm.reminderType.event = parseInt(vm.reminderType.event);
                    vm.reminderType.task = parseInt(vm.reminderType.task);
                    vm.textReminderType = JSON.parse(textRemind);
                    vm.textReminderType.event = parseInt(vm.textReminderType.event);
                    vm.textReminderType.task = parseInt(vm.textReminderType.task);
                    // vm.iCalLink = vm.viewProfileData.icalendar;
                    //vm.iCalLink.replace(/['"]+/g, '');
                    // if (vm.viewProfileData.ms_exchange != '') {
                    //     vm.isMsExchange = 1;
                    // } else {
                    //     vm.isMsExchange = 0;
                    // }
                    if (vm.viewProfileData.google_mail != '') {
                        vm.isSetEmail = 1;
                    } else {
                        vm.isSetEmail = 0;
                    }
                    if (utils.isNotEmptyVal(data[0].pic)) {
                        vm.uploadImageUrl = data[0].pic;
                    } else {
                        vm.uploadImageUrl = 'styles/images/super-big-profile.png';
                    }
                    vm.viewProfileData.fullName = data[0].fname + ' ' + data[0].lname;
                    vm.userRoleObj = masterData.getUserRole();
                    if (vm.userRoleObj.role == 'LexviasuperAdmin' || vm.userRoleObj.is_admin === "1") {
                        vm.disableOfficeNumber = false;
                    } else {
                        vm.disableOfficeNumber = true;
                    }
                    //US16929 : Expense Manager (Quickbooks integration)
                    if (isExpenseActive == 1 && vm.userRoleObj.is_admin == 1) {
                        callQuickBooks();
                    }

                }
                vm.viewProfileFlag = true;
            });
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.ProfileCtrl#editProfile
         * @methodOf cloudlex.settings.ProfileCtrl
         * @description
         * this method is used get edit profile data
         */
        function editProfile() {

            if (vm.userRoleObj.role == "Managing Partner/Attorney" || vm.userRoleObj.role === 'LexviasuperAdmin') {
                vm.disableFirmSize = !(vm.userRoleObj.is_subscriber == "1");
            }



            vm.myImage = '';
            vm.myCroppedImage = '';
            vm.viewProfileFlag = false;
            vm.editProfileData = angular.copy(vm.viewProfileData);
            vm.editProfileData.firm_size = utils.isNotEmptyVal(vm.editProfileData.firm_size) ? vm.editProfileData.firm_size.trim() : '';
            vm.editProfileData.pw = '';
            vm.info.mspassword = '';

            // if( angular.isDefined(vm.viewProfileData.ms_exchange)){
            // vm.info.msusername = vm.viewProfileData.ms_exchange.username ;

            // var versionId = vm.viewProfileData.ms_exchange.version_selected;
            // vm.info.msversion = _.find(vm.msversions, function(version) {
            //     return versionId == version.id;
            // });
            // }

            vm.info.emailViaCloudlex = vm.viewProfileData.google_mail;
            vm.info.is_allevent = vm.viewProfileData.is_allevent;


            if (angular.isDefined(vm.editProfileData.pic)) {
                vm.uploadImageUrl = vm.editProfileData.pic;
            }

            vm.profileForm.phone_name.$invalid = false;
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.ProfileCtrl#cancelEdit
         * @methodOf cloudlex.settings.ProfileCtrl
         * @description
         * this method is used get cancel any edit
         */
        function cancelEdit() {
            vm.viewProfileFlag = true;
            vm.passwordEnteredFlag = false;
            vm.confirmPasswordFlag = false;
            vm.password = '';
            vm.currentPassword = '';
            vm.confirmPassword = '';
            vm.editProfileData = {};
            vm.passwordStrength = {};
            //document.getElementById('fileInput').value = '';
            getViewProfile();
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.ProfileCtrl#saveCroppedImage
         * @methodOf cloudlex.settings.ProfileCtrl
         * @description
         * this method is used to save the cropped Image
         */
        function saveCroppedImage(cropImage) {
            //console.log('profileCtrl.myCroppedImage', vm.myCroppedImage);
            if (utils.isNotEmptyVal(cropImage)) {
                var blobData = '';
                blobData = utils.dataURItoBlob(cropImage);

                vm.files = vm.selectedImageFile;

                if (utils.isNotEmptyVal(vm.files) && angular.isDefined(vm.files.name)) {
                    blobData.name = vm.files.name;
                    var findme = "image";
                    if (angular.isDefined(vm.files.type) && vm.files.type.indexOf(findme) > -1) {
                        //notificationService.success('upload success');
                        if (blobData.size <= 200000) {
                            //notificationService.success('upload success');
                            if (blobData && blobData.name) {
                                var extindex = blobData.name.lastIndexOf('.');
                                blobData.filename = blobData.name.substr(blobData.name, extindex);
                                upload(blobData);
                            }
                        } else {
                            notificationService.error('Image Size is more than 200kb');
                        }
                    } else {
                        notificationService.error('Please upload image file only');
                    }
                }

            } else {
                notificationService.error('Please choose any image file');
            }

        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.ProfileCtrl#upload
         * @methodOf cloudlex.settings.ProfileCtrl
         * @description
         * this method is used to upload the file on server
         */
        function upload(file) {
            if (file && file.name) {
                //self.enableSave = false;
                if (vm.uploadData.file.length > 0) {
                    var fileIndex = parseInt(vm.uploadData.file.length);
                } else {
                    fileIndex = 0;
                }
                vm.uploadData.file[fileIndex] = {};
                vm.uploadData.file[fileIndex].docname = file.name;

                Upload.upload({
                    url: profileHelper.getUploadUrl(vm.userRoleObj),
                    /*fields: {
                        'category': getPostDataObj()
                    },*/
                    file: file
                }).progress(function(evt) {
                    //var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    //vm.uploadData.file[fileIndex].fileProgress = progressPercentage;
                }).success(function(data, status, headers, config) {
                    notificationService.success('image uploaded successfully');
                    vm.uploadImageUrl = data[0];
                    localStorage.setItem('userDp', vm.uploadImageUrl);
                    vm.croppedImageFlag = false;
                    //getViewProfile();
                    document.getElementById('fileInput').value = '';

                }).error(function(data, status, headers, config) {
                    notificationService.success('image not uploaded. Please try again');
                    vm.selectedImageFile = {};
                });
            }
        }

    }

})();

(function() {
    angular.module('cloudlex.settings')
        .factory('profileHelper', profileHelper);

    profileHelper.$inject = ['globalConstants'];

    function profileHelper(globalConstants) {
        return {
            getUploadUrl: getUploadUrl
        };

        function getUploadUrl() {
            var url;
            url = globalConstants.webServiceBase;
            url += 'lexvia_users/users_info.json';
            return url;
        }
    }
})();