(function (angular) {
    'use strict';

    angular.module('cloudlex.settings')
    .controller('AddUserController', AddUserController);

    AddUserController.$inject = ['$modalInstance', 'addUserDatalayer', 'notification-service', 'userData','planData','masterData'];
    function AddUserController($modalInstance, addUserDatalayer, notificationService, userData,planData,masterData) {

        var vm = this;

        vm.save = save;
        vm.cancel = cancel;
        vm.maxUsers = parseInt(planData.max_users_count);
        vm.activeUsers = parseInt(planData.active_user_count);
        vm.userCapacity = Math.floor(vm.activeUsers*100/vm.maxUsers);
        vm.graphColor = (vm.userCapacity<=50) ? "#008000" : (vm.userCapacity<=75) ? '#F4A460':"#d9534f"; 
       
        vm.isAdmin = false;
        (function () {

             
            vm.role = masterData.getUserRole();
            
            // US#5668 Add Role Management Access
            if(!(vm.role.is_admin === "1") && !(vm.role.is_subscriber === "1")) {
                 vm.disableAdmAccess=true;
            }

            vm.mode = utils.isEmptyObj(userData) ? 'add' : 'edit';
            vm.userInfo = userData;

            addUserDatalayer.getUserRoles()
            .then(function (response) {
                var data = response.data;
                vm.roles = Object.keys(data).map(function (prop) {
                    var roleObj = { rid: prop, role: data[prop] };
                    return roleObj;
                });
            });

        })();   

        function save(user) {
           // user.userLimits = {maxUsers: vm.maxUsers, activeUsers: vm.activeUsers};
            var promise = vm.mode === 'edit' ? addUserDatalayer.editUser(user) : addUserDatalayer.addUser(user);

            promise.then(function (response) {

                if (response.data[0] === 'Already exists') {
                    notificationService.error('email already exists');
                    return;
                }

                if (response.data[0] === 'All the Users are used') {
                    notificationService.error('User limit reached!');
                    return;
                }

                var msg = 'user ' + (vm.mode === 'edit' ? 'edited ' : 'added ') + 'successfully';
                notificationService.success(msg);
                $modalInstance.close();
            });
        }

        function cancel() {
            $modalInstance.close();
        }

    }

})(angular);

(function (angular) {

    'use strict';

    angular.module('cloudlex.settings')
    .factory('addUserDatalayer', addUserDatalayer);

    addUserDatalayer.$inject = ['$http', 'globalConstants'];
    function addUserDatalayer($http, globalConstants) {

        var urls = {
            getRoles: globalConstants.webServiceBase + 'practice/all_user_role',
            getUsers: globalConstants.webServiceBase + 'tasks/staffsinfirm',
            editUser: globalConstants.webServiceBase + 'practice/SetupUser/',
            addUser: globalConstants.webServiceBase + 'practice/SetupUser',
            deleteUser: globalConstants.webServiceBase + 'practice/SetupUser/',
            undelete: globalConstants.webServiceBase + 'practice/undeleteuser/'
        };

        return {
            getUserRoles: _getUserRoles,
            editUser: _editUser,
            addUser: _addUser,
            deleteUser: _deleteUser,
            undelete: _undelete,
            getUsers: _getUsers
        };

        function _getUserRoles() {
            var url = urls.getRoles;
            return $http.get(url);
        }

        function _getUsers() {
            var url = urls.getUsers;
            return $http.get(url);
        }

        function _editUser(user) {
            var url = urls.editUser + user.uid;
            return $http.put(url, user);
        }

        function _addUser(user) {
            var url = urls.addUser;
            user['practice_id'] = 1;
            return $http.post(url, user);
        }

        function _deleteUser(id, transferTo) {
            var url = urls.deleteUser + id;

            if (utils.isNotEmptyVal(transferTo)) {
                url += '/?transferTo=' + transferTo
            }
            return $http.delete(url);
        }

        function _undelete(uid, email) {
            var url = urls.undelete + uid;
            return utils.isNotEmptyVal(email) ? $http.put(url, email) : $http.put(url);
        }


    }

})(angular);
