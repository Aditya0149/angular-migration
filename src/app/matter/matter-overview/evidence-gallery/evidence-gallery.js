(function (angular) {

    angular.module('cloudlex.matter')
        .controller('EvidenceGallery', EvidenceGallery);

    EvidenceGallery.$inject = ['$modalInstance', 'evidenceInfo'];
    function EvidenceGallery($modalInstance, evidenceInfo) {
        var vm = this;

        vm.selectEvidence = selectEvidence;
        vm.close = close;

        (function () {
            vm.selected = evidenceInfo.selected;
            vm.evidences = evidenceInfo.evidences;
        })();

        function selectEvidence(evd) {
            vm.selected = evd;
        }

        function close() {
            $modalInstance.dismiss();
        }
    }

})(angular)