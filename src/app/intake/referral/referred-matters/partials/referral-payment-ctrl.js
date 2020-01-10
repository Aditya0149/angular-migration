(function (angular) {

    angular.module('cloudlex.referral')
        .controller('referralPaymentCtrl', offOnlinePaymentController)

    offOnlinePaymentController.$inject = ['$modalInstance', 'selectedInfo'];

    function offOnlinePaymentController($modalInstance, selectedInfo) {

        var vm = this;
        vm.referralMatter = {};
        vm.referralMatter = selectedInfo;
        vm.confirm = confirm;
        function confirm(data) {

            $modalInstance.close(data);
            // var postDataObj = {
            //     application_id: data.id,
            //     amount: data.amount
            // };
            // applicationsDataLayer.confirm(postDataObj)
            //     .then(function (response) {
            //         if (response.data) {
            //             notificationService.success("Payment successfully");
            //         }

            //         $modalInstance.close();

            //     }, function (error) {
            //         if (error.status == 406) {
            //             notificationService.error(error.statusText);
            //         } else if (error.status == 400) {
            //             notificationService.error(error.statusText);
            //         }
            //         $modalInstance.close();

            //     });
        };

        /* Cancel the Popup and close the box */
        vm.cancel = function () {
            $modalInstance.dismiss();
        };

    }

})(angular);