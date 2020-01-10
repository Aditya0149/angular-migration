;

(function () {

    'use strict';

    angular
        .module('cloudlex.components')
        .controller('CustomDialogCtrl', CustomDialogController);

    CustomDialogController.$inject = ['$scope', '$modalInstance', 'isConfirm', 'title', 'msg'];

    function CustomDialogController($scope, $modalInstance, isConfirm, title, msg) {
        $scope.isConfirm = isConfirm;
        $scope.title = title;
        $scope.msg = msg;
        $scope.ok = function () {
            $modalInstance.close({ type: 'confirm' });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }

})();




