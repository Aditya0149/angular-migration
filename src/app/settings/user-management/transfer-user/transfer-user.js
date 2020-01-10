(function (angular) {

    angular.module('cloudlex.settings')
    .controller('TransferUser', TransferUser);

    TransferUser.$inject = ['$modalInstance', 'addUserDatalayer', 'modalService', 'user'];
    function TransferUser($modalIntance, addUserDatalayer, modalService, user) {

        var vm = this;
        vm.deleteUser = deleteUser;
        vm.cancel = cancel;

        (function () {

            addUserDatalayer.getUsers()
            .then(function (response) {
                var users = response.data;
                removeUserToBeDeleted(users);
                vm.users = users;
            });

        })();

        function removeUserToBeDeleted(users) {
            var uids = _.pluck(users, 'uid');
            users.splice(uids.indexOf(user.uid),1);
        }

        function deleteUser(transferTo) {

            if (utils.isEmptyVal(transferTo)) {
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Ok',
                    headerText: 'User not selected for transfer',
                    bodyText: ' Do you want to delete?'
                };

                //confirm before delete
                modalService.showModal({}, modalOptions).then(function () {

                    addUserDatalayer.deleteUser(user.uid, transferTo)
                            .then(function (response) {
                                $modalIntance.close();
                            });
                });
            } else {
                addUserDatalayer.deleteUser(user.uid, transferTo)
                            .then(function (response) {
                                $modalIntance.close();
                            });
            }
        }

        function cancel() {
            $modalIntance.dismiss();
        }

    }





})(angular);