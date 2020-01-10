(function () {
    "use strict";
    angular.module('cloudlex.matter')
        .controller('ArchivePopupCtrl', ['$scope', '$state', 'modalService', '$modalInstance', 'matterstoArchive',
            'matterFactory', 'notification-service',
            function ($scope, $state, modalService, $modalInstance,
                matterstoArchive, matterFactory, notificationService) {
                var vm = $scope;
                vm.archiveData = {};
                vm.archivematterId = matterstoArchive; //selected matters
                vm.disablePayoption = false;


                (function () {
                    vm.actionbuttonText = "Confirm";
                })();

                /* Cancel the Popup and close the box */
                vm.cancel = function () {
                    $modalInstance.dismiss();
                };

                vm.oK = function () {
                    $modalInstance.close();
                };

                /*function to archive selected matters*/
                vm.archiveMatters = function () {
                    matterFactory.getArchiveMatterData(vm.archivematterId)
                        .then(function (response) {
                            vm.oK();
                            vm.showarchivalMessage();

                        }, function (error) {
                            notificationService.error("Matter Archival failed..");
                        });
                }

                //show archival confirmation message
                vm.showarchivalMessage = function () {
                    var modalOptions = {
                        closeButtonText: 'OK',
                        actionButtonText: '',
                        headerText: 'Archival Success',
                        bodyText: '' + vm.archivematterId.length + ' matter(s) have been marked for archival. During archival, these matter(s) will have a status of Archiving within the Archive matters List. Confirmation will be provided once they have been successfully archived.'
                    };

                    modalService.showModal({}, modalOptions).then(function () {

                    }, function () {
                        //route page to matter list
                        $state.go("matter-list");
                    });
                };

            }
        ]);
})(angular);