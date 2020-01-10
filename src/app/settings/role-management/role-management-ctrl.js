(function () {

    'use strict';

    angular
        .module('cloudlex.settings')
        .controller('roleManagementCtrl', roleManagementCtrl);

    roleManagementCtrl.$inject = ['$q', 'globalConstants', 'routeManager', 'notification-service', 'userManagementDatalayer', 'addAccessDatalayer', 'masterData', '$rootScope', '$timeout'];

    function roleManagementCtrl($q, globalConstants, routeManager, notificationService, userManagementDatalayer, addAccessDatalayer, masterData, $rootScope, $timeout) {
        var vm = this;
        vm.users = [];
        vm.save = save;
        vm.userInfo = {};
        vm.getUserInfo = getUserInfo;
        vm.setDeafultPermissions = setDeafultPermissions;
        vm.reset = reset;
        vm.selectedUser = {};
        var persistUserAccess = {};
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.launchpad = JSON.parse(localStorage.getItem('launchpadSetting'));
        vm.launchpadAccess = (vm.launchpad.enabled == 1) ? true : false;

        (function () {
            setBreadcrum();
            getUserAccesList();

        })();
        vm.userListFlag = true;
        vm.setResetBtn = function () {
            if (!angular.equals(vm.userList, vm.userListCopy)) {
                return false;
            }
            if (!angular.equals(vm.apps, vm.appsCopy)) {
                return false;
            }
            return true;
        }

        vm.setSaveBtn = function () {
            if (!angular.equals(vm.userList, vm.userListCopy)) {
                return false;
            }
            if (!angular.equals(vm.apps, vm.appsCopy)) {
                return false;
            }
            return true;
        }







        function setBreadcrum() {
            var initCrum = [{ name: '...' }, { name: 'Settings' }, { name: 'Access Management' }];
            routeManager.setBreadcrum(initCrum);
        }


        var permissions = masterData.getPermissions();
        vm.ugmtPermissions = _.filter(permissions[0].permissions, function (per) {
            if (per.entity_id == '6') {
                return per;
            }
        });


        // get user List 
        function getUserAccesList(user) {
            var matterPermissions = userManagementDatalayer.getUserAccesList();
            var appPermissions = userManagementDatalayer.getUserAppAccesList();
            $q.all([matterPermissions, appPermissions]).then(function (values) {
                vm.users = values[0].data.user_permission;
                vm.allUsersApps = values[1].data.all_user_permission;
                vm.users = _.sortBy(vm.users, function (i) { return i.name.toLowerCase(); });
                if (utils.isNotEmptyVal(user)) {
                    vm.selectedUser = user;
                    getUserInfo(user);
                }
                else {
                    vm.selectedUser = vm.users[0];
                    getUserInfo(vm.users[0]);
                }
            });
        }



        function getUserInfo(uinfo) {
            persistUserAccess = angular.copy(uinfo);
            vm.userInfo = uinfo;
            var filterUserList = _.filter(uinfo.permissions, function (entity) {
                if (entity.entity_id != '4') {
                    return entity;
                }
            });
            vm.selectedUser_Id = uinfo.user_id;
            getApps();
            vm.userList = angular.copy(filterUserList);
            vm.userListCopy = angular.copy(filterUserList);
            vm.setResetBtn();
            vm.setSaveBtn();
        }

        function getApps() {
            var userSpecificAppPermissions = _.filter(vm.allUsersApps, function (entity) {
                if (entity.user_id == vm.selectedUser_Id) {
                    return entity;
                }
            });
            vm.apps = userSpecificAppPermissions && userSpecificAppPermissions.length > 0 ? angular.copy(userSpecificAppPermissions[0].permission) : [];
            vm.apps.slice(0).forEach(function (app) {
                if (app.app_code == "SMS" && $rootScope.hideSMS) {
                    vm.apps.splice(vm.apps.indexOf(app), 1);
                }

            });
            angular.forEach(vm.apps, function (app) {
                app.$open = false;
                if (app.app_code == "SMS") {
                    app.app_name = "Client Messenger"
                }
            });
            vm.apps.push({ app_id: 1, is_active: 1, permission: 1, $open: false, app_name: "Matter Manager", app_code: "MM" });
            vm.appsCopy = angular.copy(vm.apps);
        }

        function reset(userinfo) {
            angular.forEach(vm.apps, function (app) {
                app.$open = false;
            });
            $timeout(function () {
                var resetFilterUserList = _.filter(persistUserAccess.permissions, function (entity) {
                    if ((entity.entity_id != '4')) {
                        return entity;
                    }
                });
                vm.userList = angular.copy(resetFilterUserList);
                vm.userListCopy = angular.copy(resetFilterUserList);
                getApps();
            }, 1000);
        }
        vm.toggleAccordionGroup = toggleAccordionGroup;
        function toggleAccordionGroup(contact) {
            contact.$open = !contact.$open;
        }
        function setDeafultPermissions(uinfo) {

            if (uinfo.V == 0 && (uinfo.A != 0 && uinfo.E != 0 && uinfo.D != 0)) {
                return uinfo.A = 0, uinfo.E = 0, uinfo.D = 0;
            } else if ((uinfo.V == 0 && (uinfo.A == 1 && uinfo.E == 1))
                || (uinfo.V == 0 && (uinfo.A == 1 && uinfo.D == 1))
                || (uinfo.V == 0 && (uinfo.E == 1 && uinfo.D == 1))) {
                return uinfo.A = 0, uinfo.E = 0, uinfo.D = 0;
            }
            else {
                if ((uinfo.A == 1)) { return uinfo.V = 1; }
                if ((uinfo.E == 1)) { return uinfo.V = 1; }
                if ((uinfo.D == 1)) { return uinfo.V = 1; }
            }
            // if (uinfo.A == 1 && uinfo.E == 1 && uinfo.D == 1) {
            //     return uinfo.V = 1;
            // }

        }


        function save(userinfo) {
            if (vm.ugmtPermissions[0].E == 0) {
                notificationService.error(globalConstants.accessMgmtMessage + "edit access management");
                return;
            }
            vm.userInfo.permissions = userinfo;
            vm.userInfo.appPermission = {
                user_permission: []
            };

            angular.forEach(vm.apps, function (app) {
                if (app.app_id != 1) {
                    var appData = {
                        user_app_id: app.app_id,
                        user_permission: app.permission
                    }
                    vm.userInfo.appPermission.user_permission.push(appData);
                }

            });

            var promiseUserAccess = addAccessDatalayer.updateUserAccess(vm.userInfo.permissions, vm.userInfo.user_id);
            var promiseUserAppAccess = addAccessDatalayer.updateUserAppAccess(vm.userInfo.appPermission, vm.userInfo.user_id);
            $q.all([promiseUserAccess, promiseUserAppAccess]).then(function (values) {
                var response1 = values[0].data;
                var response2 = values[1].data;
                if (response1 && response2 && response1[0] == true) {
                    notificationService.success("Access permissions updated successfully");
                    vm.userListFlag = true;
                } else {
                    notificationService.error("Access permissions Not Updated ");
                }
                getUserAccesList(vm.userInfo);
            });
        }
    }
})();

(function (angular) {

    'use strict';

    angular.module('cloudlex.settings')
        .factory('addAccessDatalayer', addAccessDatalayer);

    addAccessDatalayer.$inject = ['$http', 'globalConstants'];
    function addAccessDatalayer($http, globalConstants) {

        var urls = {
            editUserAccess: globalConstants.webServiceBase + 'lexvia_users/user_permission/',
            editUserAppAccess: globalConstants.javaWebServiceBaseV4 + 'launchpad-accessmanagement/user-permission/'
        };

        return {
            updateUserAccess: _updateUserAccess,
            updateUserAppAccess: _updateUserAppAccess
        };

        function _updateUserAccess(userinfo, userID) {
            var url = urls.editUserAccess + userID;
            return $http.put(url, userinfo);
        }

        function _updateUserAppAccess(userinfo, userID) {
            var url = urls.editUserAppAccess + userID;
            return $http.put(url, userinfo);
        }

    }



})(angular);



