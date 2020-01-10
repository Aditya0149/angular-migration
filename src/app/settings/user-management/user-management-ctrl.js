(function (angular) {

    'user strict';

    /**
    * @ngdoc controller
    * @name cloudlex.settings.controller:UserManagementCtrl
    * @requires $modal, userManagementDatalayer, addUserDatalayer, userManagementHelper,
                modalService, notification-service
    */

    angular.module('cloudlex.settings')
        .controller('UserManagementCtrl', UserManagementCtrl);

    UserManagementCtrl.$inject = ['$modal', 'userManagementDatalayer', 'addUserDatalayer', 'userManagementHelper',
        'modalService', 'notification-service', 'routeManager', 'masterData'];
    function UserManagementCtrl($modal, userManagementDatalayer, addUserDatalayer, userManagementHelper,
        modalService, notificationService, routeManager, masterData) {

        var vm = this, pageSize = 10;

        vm.selectAllUsers = selectAllUsers;
        vm.allUsersSelected = allUsersSelected;
        vm.isUserSelected = isUserSelected;
        vm.showUndelete = showUndelete;
        vm.showDelete = showDelete;
        vm.addUser = addUser;
        vm.editUser = editUser;
        vm.deleteUser = deleteUser;
        vm.undeleteUser = undeleteUser;
        vm.blockUser = blockUser;
        vm.unblockUser = unblockUser;
        vm.showBlockUser = showBlockUser;
        vm.showUnblockUser = showUnblockUser;
        vm.showPaginationButtons = showPaginationButtons;
        vm.getMore = getMore;
        vm.getAll = getAll;
        vm.subscribeplanData = {};
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.hideTooltip = hideTooltip;
        (function () {
            vm.userGrid = {
                headers: userManagementHelper.getUserManagementGrid(),
                selectedItems: []
            };

            vm.filter = {
                pageNum: 1,
                pageSize: pageSize
            };
            vm.dataReceived = false;
            getsubscriptionPackage();

            getUserList(vm.filter);
            setBreadcrum();


            /* Message to display if activated user limit is over*/
            var role = masterData.getUserRole();
            vm.isSubsriber = (role.is_subscriber == "1") ? true : false;
            vm.userMsg = userManagementDatalayer.getuserMessage(vm.isSubsriber);

        })();

        var permissions = masterData.getPermissions();
        vm.ugmtPermissions = _.filter(permissions[0].permissions, function (per) {
            if (per.entity_id == '6') {
                return per;
            }
        });




        function getsubscriptionPackage() {
            userManagementDatalayer.getsubscriptionPlan()
                .then(function (response) {
                    var data = response.data;
                    vm.subscribeplanData = data.matter;
                    vm.activeUsers = utils.isNotEmptyVal(data.matter.active_user_count) ? parseInt(data.matter.active_user_count) : 0;
                    vm.maxUsers = utils.isNotEmptyVal(data.matter.max_users_count) ? parseInt(data.matter.max_users_count) : 0;
                }, function (error) {
                    notificationService.error('User limit counts not loaded');
                });
        }

        
        function setBreadcrum() {
            var initCrum = [{ name: '...' }, { name: 'Settings' }, { name: 'User Management' }];
            routeManager.setBreadcrum(initCrum);
        }


        /**
         * @ngdoc method
         * @name cloudlex.settings.UserManagementCtrl#getUserList
         * @methodOf cloudlex.settings.UserManagementCtrl
         * @description
         * gets the user list
         * @param {object} applied filters
         */

        function getUserList(filter) {
            userManagementDatalayer.getUserList(filter)
                .then(function (response) {
                    var data = response.data;
                    vm.userList = data;
                    vm.dataReceived = true;
                });
        }

        /**
         * @ngdoc method
         * @name cloudlex.settings.UserManagementCtrl#selectAllUsers
         * @methodOf cloudlex.settings.UserManagementCtrl
         * @description
         * selectes all user
         * @param {Boolean} is select all checked
         */

        function selectAllUsers(isSelected) {
            if (isSelected === true) {
                vm.userGrid.selectedItems = angular.copy(vm.userList);
            } else {
                vm.userGrid.selectedItems = [];
            }
        }

        /**
        * @ngdoc method
        * @name cloudlex.settings.UserManagementCtrl#allUsersSelected
        * @methodOf cloudlex.settings.UserManagementCtrl
        * @description
        * check if all users are selected
        * @returns {Boolean} 
        */

        function allUsersSelected() {
            if (utils.isEmptyVal(vm.userList)) {
                return false;
            }
            return vm.userGrid.selectedItems.length === vm.userList.length;
        }

        /**
       * @ngdoc method
       * @name cloudlex.settings.UserManagementCtrl#allUsersSelected
       * @methodOf cloudlex.settings.UserManagementCtrl
       * @description
       * check if a user is selected
       * @param uid
       * @returns {Boolean} 
       */
        function isUserSelected(uid) {
            var uids = _.pluck(vm.userGrid.selectedItems, 'uid');
            return uids.indexOf(uid) > -1;
        }


        /**
         * @ngdoc method
         * @name cloudlex.settings.UserManagementCtrl#showUndelete
         * @methodOf cloudlex.settings.UserManagementCtrl
         * @description
         * show or hide undelete button
         */

        function showUndelete() {
            var showUndelete = false;
            _.forEach(vm.userGrid.selectedItems, function (item) {
                if (!showUndelete) {
                    showUndelete = parseInt(item.isDeleted) === 1;
                }
            });
            return showUndelete;
        }

        /**
        * @ngdoc method
        * @name cloudlex.settings.UserManagementCtrl#showDelete
        * @methodOf cloudlex.settings.UserManagementCtrl
        * @description
        * show or hide delete button
        */
        function showDelete() {
            var showUndelete = false;
            _.forEach(vm.userGrid.selectedItems, function (item) {
                if (!showUndelete) {
                    showUndelete = parseInt(item.isDeleted) === 0;
                }
            });
            return showUndelete;
        }


        /**
       * @ngdoc method
       * @name cloudlex.settings.UserManagementCtrl#addUser
       * @methodOf cloudlex.settings.UserManagementCtrl
       * @description
       * add user
       */
        function addUser() {
            var modalInstance = $modal.open({
                templateUrl: 'app/settings/user-management/add-user/add-user.html',
                controller: 'AddUserController as addUser',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    'userData': function () {
                        return {};
                    },
                    'planData': function () {
                        return vm.subscribeplanData;
                    }
                }
            });

            modalInstance.result.then(function () {
                vm.userGrid.selectedItems.length = 0;
                vm.dataReceived = false;
                vm.filter.pageNum = 1;
                vm.filter.pageSize = pageSize;
                getUserList(vm.filter);
                getsubscriptionPackage();
            });
        }

        /**
        * @ngdoc method
        * @name cloudlex.settings.UserManagementCtrl#editUser
        * @methodOf cloudlex.settings.UserManagementCtrl
        * @description
        * edit user
        */
        function editUser(user) {
            var modalInstance = $modal.open({
                templateUrl: 'app/settings/user-management/add-user/add-user.html',
                controller: 'AddUserController as addUser',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    'userData': function () {
                        return user;
                    },
                    'planData': function () {
                        return vm.subscribeplanData;
                    }
                }
            });

            modalInstance.result.then(function () {
                vm.userGrid.selectedItems.length = 0;
                vm.dataReceived = false;
                vm.filter.pageNum = 1;
                vm.filter.pageSize = pageSize;
                getUserList(vm.filter);
                getsubscriptionPackage();
            });
        }

        /**
       * @ngdoc method
       * @name cloudlex.settings.UserManagementCtrl#deleteUser
       * @methodOf cloudlex.settings.UserManagementCtrl
       * @description
       * delete user
       */
        function deleteUser(user) {
            if (vm.userGrid.selectedItems.length > 1) {
                notificationService.error('can not delete multiple user');
                return;
            }

            //confirm before delete
            transferUser(user).result.then(function () {

                notificationService.success('user deleted successfully');
                vm.userGrid.selectedItems.length = 0;
                vm.dataReceived = false;
                vm.filter.pageNum = 1;
                vm.filter.pageSize = pageSize;
                getUserList(vm.filter);
                getsubscriptionPackage();
            });
        }

        /**
      * @ngdoc method
      * @name cloudlex.settings.UserManagementCtrl#undeleteUser
      * @methodOf cloudlex.settings.UserManagementCtrl
      * @description
      * undelete user
      * @param {object} user Obj
      */
        function undeleteUser(user) {
            if (vm.userGrid.selectedItems.length > 1) {
                notificationService.error('can not undelete multiple user');
                return;
            }

            addUserDatalayer.undelete(user.uid)
                .then(function (response) {
                    var undeleteResponse = response.data;
                    handleUndelete(undeleteResponse, user);
                }, function (reason) {
                    notificationService.error(reason.statusText);
                });
        }


        /**
   * @ngdoc method
   * @name cloudlex.settings.UserManagementCtrl#handleUndelete
   * @methodOf cloudlex.settings.UserManagementCtrl
   * @description
   * handle different undelete cases
   * @param {object} undelete response
   * @param {object} user obj
   */
        function handleUndelete(undeleteRes, user) {
            if (undeleteRes.is_undeleted) {
                notificationService.success('user undeleted successfully');
                vm.userGrid.selectedItems.length = 0;
                getUserList(vm.filter);
                getsubscriptionPackage();
                return;
            }

            if (undeleteRes.deletion_inprogress) {
                var modalOptions = {
                    closeButtonText: 'Close',
                    headerText: 'Can not undelete',
                    bodyText: 'Matter and Task transfer is in progress'
                };
                modalService.showModal({}, modalOptions);
                return;
            }

            var modalInstance = $modal.open({
                templateUrl: 'app/settings/user-management/set-email/set-email.html',
                controller: 'AddEmailCtrl as setEmail',
                windowClass: 'modalMidiumDialog',
                backdrop: 'static',
                resolve: {
                    'user': function () {
                        return user
                    }
                }
            });

            modalInstance.result.then(function () {
                notificationService.success('user undeleted successfully');
                vm.userGrid.selectedItems.length = 0;
                getUserList(vm.filter);
                getsubscriptionPackage();
            });

        }


        /**
 * @ngdoc method
 * @name cloudlex.settings.UserManagementCtrl#transferUser
 * @methodOf cloudlex.settings.UserManagementCtrl
 * @description
 * opens transfer user pop up
 * @param {object} user obj
 */
        function transferUser(user) {
            return $modal.open({
                templateUrl: 'app/settings/user-management/transfer-user/transfer-user.html',
                controller: 'TransferUser as transfer',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    'user': function () {
                        return user
                    }
                },
                size: 'sm'
            });


        }


        /**
        * @ngdoc method
        * @name cloudlex.settings.UserManagementCtrl#blockUser
        * @methodOf cloudlex.settings.UserManagementCtrl
        * @description
        * blocks the user
        * @param {object} user obj
        */
        function blockUser(user) {
            if (vm.userGrid.selectedItems.length > 1) {
                notificationService.error('can not block multiple users');
                return;
            }

            user.status = 0;
            userManagementDatalayer.blockUnblock(user)
                .then(function (response) {
                    notificationService.success('user blocked successfully');
                    vm.userGrid.selectedItems.length = 0;
                    vm.dataReceived = false;
                    vm.filter.pageNum = 1;
                    vm.filter.pageSize = pageSize;
                    getUserList(vm.filter);
                    getsubscriptionPackage();
                });
        }

        /**
        * @ngdoc method
        * @name cloudlex.settings.UserManagementCtrl#unblockUser
        * @methodOf cloudlex.settings.UserManagementCtrl
        * @description
        * unblocks the user
        * @param {object} user obj
        */

        function unblockUser(user) {
            if (vm.userGrid.selectedItems.length > 1) {
                notificationService.error('can not unblock multiple users');
                return;
            }

            user.status = 1;
            userManagementDatalayer.blockUnblock(user)
                .then(function (response) {
                    notificationService.success('user unblocked successfully');
                    vm.userGrid.selectedItems.length = 0;
                    vm.dataReceived = false;
                    vm.filter.pageNum = 1;
                    vm.filter.pageSize = pageSize;
                    getUserList(vm.filter);
                    getsubscriptionPackage();
                });
        }

        function hideTooltip() {
            if(vm.searchText.length) {
                $('.tooltip').tooltip('hide');
            }
        }

        function showUnblockUser(user) {
            var showUnblock = false;
            _.forEach(vm.userGrid.selectedItems, function (item) {
                if (!showUnblock) {
                    showUnblock = (parseInt(item.isActive) === 0) && (parseInt(item.isDeleted) === 0);
                }
            });
            return showUnblock;
        }

        function showBlockUser() {
            var showUnblock = false;
            _.forEach(vm.userGrid.selectedItems, function (item) {
                if (!showUnblock) {
                    showUnblock = (parseInt(item.isActive) === 1) && (parseInt(item.isDeleted) === 0);
                }
            });
            return showUnblock;
        }

        function showPaginationButtons() {

            if (!vm.dataReceived) {
                return false;
            }

            if (angular.isUndefined(vm.userList) || vm.userList.length <= 0) { return false; }

            if (vm.filter.pageSize === 'all') {
                return false;
            }

            if (vm.userList.length < (vm.filter.pageSize * vm.filter.pageNum)) {
                return false
            }
            return true;
        }

        function getMore() {
            vm.filter.pageNum += 1;
            userManagementDatalayer.getUserList(vm.filter)
                .then(function (response) {
                    var data = response.data;
                    vm.userList = vm.userList.concat(data);
                    vm.dataReceived = true;
                });
        }

        function getAll() {
            vm.filter.pageSize = 'all';
            getUserList(vm.filter);
        }
    }

})(angular);

(function (angular) {

    angular.module('cloudlex.settings')
        .factory('userManagementDatalayer', userManagementDatalayer);


    userManagementDatalayer.$inject = ['$http', 'globalConstants'];
    function userManagementDatalayer($http, globalConstants) {

        var urls = {
            accessList: globalConstants.webServiceBase + 'lexvia_users/user_permission',
            appAccessList: globalConstants.javaWebServiceBaseV4 + 'launchpad-accessmanagement/user-permission/all',
            userList: globalConstants.webServiceBase + 'practice/SetupUser?',
            blockUnblock: globalConstants.webServiceBase + 'practice/UserAction/',
            subscriptionPlan: globalConstants.webServiceBase + 'packagesubscription/plansubscription'
        };

        return {
            getUserList: _getUserList,
            getUserAccesList: _getUserAccesList,
            getUserAppAccesList: _getUserAppAccesList,
            blockUnblock: _blockUnblock,
            getsubscriptionPlan: _getsubscriptionPlan,
            getuserMessage: _getuserMessage
        };

        function _getUserList(filter) {
            var url = urls.userList + utils.getParams(filter);
            return $http.get(url);
        }

        function _getUserAccesList(filter) {
            return $http.get(urls.accessList);
        }

        function _getUserAppAccesList(filter) {
            return $http.get(urls.appAccessList);
        }


        function _blockUnblock(user) {
            var url = urls.blockUnblock + user.uid;
            return $http.put(url, user);
        }

        function _getsubscriptionPlan() {
            var url = urls.subscriptionPlan;
            return $http.get(url);
        }

        function _getuserMessage(isSubsriber) {
            var userMsg = (isSubsriber) ? 'You have reached the maximum number of users for your current subscription.' : 'You have reached the maximum number of users for your current subscription. Please contact the subscribing managing partner to increase user capacity.';
            return userMsg;
        }
    }


})(angular);

(function (angular) {

    angular.module('cloudlex.settings')
        .factory('userManagementHelper', userManagementHelper);

    function userManagementHelper() {
        return {
            getUserManagementGrid: _getUserManagementGrid
        };

        function _getUserManagementGrid() {
            return [
                {
                    field: [
                        {
                            prop: 'fname',
                            printDisplay: 'First Name'
                        }
                    ],
                    displayName: 'First Name',
                    dataWidth: "24"
                },
                {
                    field: [
                        {
                            prop: 'lname',
                            printDisplay: 'Last Name'
                        }],
                    displayName: 'Last Name',
                    dataWidth: "23"
                },
                {
                    field: [
                        {
                            prop: 'role',
                            printDisplay: 'Role'
                        }
                    ],
                    displayName: 'Role',
                    dataWidth: "23"
                },
                {
                    field: [
                        {
                            prop: 'mail',
                            printDisplay: 'Mail'
                        }
                    ],
                    displayName: 'Mail',
                    dataWidth: "25"
                }
                //   {
                //      field: [
                //          {
                //              prop: 'has_access',
                //              printDisplay: 'UMGMT',
                //              html: '<span>{{data.has_access | userMgmtYesNo}}</span>'
                //          }
                //      ],
                //      displayName: 'UMGMT',
                //        dataWidth:"15"
                //  }
            ];
        }
    }

})(angular);
