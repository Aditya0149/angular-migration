(function () {
    angular
        .module('cloudlex.documents')
        .controller('openIntakeDocuSignCtrl', openIntakeDocuSignCtrl);

        openIntakeDocuSignCtrl.$inject = ['$modalInstance','data'];

    function openIntakeDocuSignCtrl( $modalInstance, data) {
        var self = this;
        self.cancel = cancel;
        self.data = data;

        function cancel() {
            $modalInstance.dismiss();
        }

    }


})();



