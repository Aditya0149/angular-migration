(function (angular) {

    angular.module('cloudlex.settings')
    .controller('AddEmailCtrl', AddEmail);

    AddEmail.$inject = ['$modalInstance', 'user', 'addUserDatalayer', 'notification-service'];
    function AddEmail($modalInstance, user, addUserDatalayer, notificationService) {

        var vm = this;

        vm.undeleteUser = undeleteUser;
        vm.cancel = cancel;

        (function () {
            vm.emailData = {};
        })();

        function undeleteUser(email) {
            addUserDatalayer
                .undelete(user.uid, email)
                .then(function (response) {

                    var emailResponse = response.data;

                    if (emailResponse.require_email) {
                        notificationService.error('email already exists');
                        return;
                    }

                    $modalInstance.close();
                });
        }

        function cancel() {
            $modalInstance.dismiss();
        }

    }

})(angular);