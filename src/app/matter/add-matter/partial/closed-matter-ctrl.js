(function (angular) {
    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('Closed_MatterCtrl', Closed_MatterCtrl)

    Closed_MatterCtrl.$inject = ['$modalInstance'];

    function Closed_MatterCtrl($modalInstance) {
        var vm = this;
        vm.cancel = cancel;
        vm.Confirm = Confirm;

        function cancel() {
            $modalInstance.dismiss();
        }

        function Confirm() {
            $modalInstance.close();
        }
    }
})(angular);