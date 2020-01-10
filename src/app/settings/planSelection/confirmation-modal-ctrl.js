(function () {

    'use strict';

    angular
        .module('cloudlex.settings')
        .controller('ConfirmationModalCtrl', ConfirmationModalCtrl);

    ConfirmationModalCtrl.$inject = ['$modalInstance', 'isConfirmInfo', 'notification-service', 'applicationsDataLayer', '$rootScope', '$q'];

    function ConfirmationModalCtrl($modalInstance, isConfirmInfo, notificationService, applicationsDataLayer, $rootScope, $q) {
        var vm = this;
        vm.unSubscribe = unSubscribe;
        vm.close = close;

        vm.isConfirmInformation = isConfirmInfo;
        //Two Way Text
        if (vm.isConfirmInformation.app_code == "SMS") {
            vm.isConfirmInformation.name = "Client Messenger";
        }
        if (vm.isConfirmInformation.app_code == "GA") {
            vm.isConfirmInformation.name = "Email Connector";
        }
        /**
         * close modal
         */
        function close() {
            vm.isConfirmInformation.is_active = true;
            vm.isConfirmInformation.isactive = true;
            $modalInstance.dismiss('cancel');
        }

        function unSubscribe(info) {
            //confirm before Retrieve matter
            info.is_active = info.isactive;
            var dataRequests = [];

            if (info.app_code == "IM" || info.app_code == "SMS") {
                var postDataObj = {
                    application_id: info.id,
                    status: 0,
                }
            } else {
                var postDataObj = {
                    application_id: info.id,
                    status: info.is_active == 1 ? 0 : 1,
                }
            }
            dataRequests.push(applicationsDataLayer.saveProfileData(postDataObj));
            if (info.app_code == "GA") {
                var postDataObjoutlook = {
                    application_id: "7",
                    status: 0
                }
                dataRequests.push(applicationsDataLayer.saveProfileData(postDataObjoutlook));
            }
            //var response = applicationsDataLayer.saveProfileData(postDataObj);
            $q.all(dataRequests).then(function (data) {
                if (angular.isDefined(data) && data != '' && data != ' ') {
                    //getConfiguredData();
                    info.is_active = false;
                    $rootScope.$emit('updatereferralIcon', 'updateIcon');
                    if (info.app_code == 'CCOM' && info.id == 1) {
                        $rootScope.isPortalEnabled = false;
                    }
                    notificationService.success('You have unsubscribed Successfully');
                    $modalInstance.close('cancel');
                }
            }, function (error) {
                info.is_active = true;
                notificationService.error(error.data[0]);
            });
        }
    }
})();


