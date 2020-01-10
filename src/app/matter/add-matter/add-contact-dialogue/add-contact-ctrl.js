angular.module('cloudlex.matter')
    .controller('AddContactDialogCtrl', ['$scope', '$modalInstance', 'contactFactory', 'masterData', function ($scope, $modalInstance, contactFactory, masterData) {

        var masterData = masterData.getMasterData();
        $scope.contactType = masterData.contact_type;

        $scope.dataModel = {};
        $scope.viewModel = {};
        $scope.viewModel.type = [
            { "id": 'Person', name: "Person" },
            { "id": 'Estate Administrator', name: "Estate Administrator" },
            { "id": 'Business', name: "Business" },
            { "id": 'Educational Institution', name: "Educational Institution" }
        ];

        $scope.ok = function (contactData) {

            var promesa = contactFactory.addContact(contactData);
            promesa.then(function (response) {
                $modalInstance.close(response);
            }, function (reason) {
                $modalInstance.close();
            });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

    }]);