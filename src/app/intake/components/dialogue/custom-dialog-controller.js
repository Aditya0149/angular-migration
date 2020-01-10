;

(function () {

    'use strict';

    angular
        .module('intake.components')
        .controller('CustomDialogCtrlForIntake', CustomDialogCtrlForIntake);

    CustomDialogCtrlForIntake.$inject = ['$scope', '$modalInstance', 'isConfirm', 'title', 'msg'];

    function CustomDialogCtrlForIntake($scope, $modalInstance, isConfirm, title, msg) {
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




