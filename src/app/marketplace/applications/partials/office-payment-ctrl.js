(function (angular) {

    angular.module('cloudlex.marketplace')
        .controller('paymentCtrl', offOnlinePaymentController)

    offOnlinePaymentController.$inject = ['$modalInstance', 'selectedInfo', 'notification-service', 'applicationsDataLayer'];

    function offOnlinePaymentController($modalInstance, selectedInfo, notificationService, applicationsDataLayer) {

        var vm = this;
        vm.offOnlineInfo = {};
        vm.offOnlineInfo = selectedInfo;
        vm.confirm = confirm;
        function confirm(data) {
            var postDataObj = {
                application_id: data.id,
                amount: data.amount
            };
            applicationsDataLayer.confirm(postDataObj)
                .then(function (response) {
                    if (response.data) {
                        notificationService.success("Payment successfully");
                    }

                    $modalInstance.close();

                }, function (error) {
                    if (error.status == 406) {
                        notificationService.error(error.statusText);
                    } else if (error.status == 400) {
                        notificationService.error(error.statusText);
                    }
                    $modalInstance.close();

                });
        };

        /* Cancel the Popup and close the box */
        vm.cancel = function () {
            $modalInstance.dismiss();
        };

    }

})(angular);