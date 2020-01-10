(function (angular) {

    angular
        .module('cloudlex.referral')
        .controller('RefferedMatterInfoCtrl', RefferedMatterInfoCtrl);

    /**
    * @ngdoc controller
    * @name cloudlex.referral.controller:RefferedMatterInfoCtrl
    * @requires $modalInstance
    * @description
    * 
    */
    RefferedMatterInfoCtrl.$inject = ['$modalInstance', 'referredOutInfo'];
    function RefferedMatterInfoCtrl($modalInstance, referredOutInfo) {
        var vm = this;
        vm.close = close;

        (function () {
            referredOutInfo.referrerText = referredOutInfo.activeTab === 'referred in' ? 'Referred Out By:' : 'Referred Out To:';
            referredOutInfo.referrerName = referredOutInfo.activeTab === 'referred in' ? (referredOutInfo.ref_out_by_fname + ' ' + referredOutInfo.ref_out_by_lname) : (referredOutInfo.ref_out_fname + ' ' + referredOutInfo.ref_out_lname)
            vm.referOutInfo = referredOutInfo;
            vm.title = referredOutInfo.activeTab === 'referred in' ? "Referred In Matter Info" : "Referred Out Matter Info";
        })();

        function close() {
            $modalInstance.dismiss();
        }

    }

})(angular);