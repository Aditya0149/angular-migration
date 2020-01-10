(function (angular) {

    angular
        .module('intake.referral')
        .controller('RefferedIntakeInfoCtrl', RefferedIntakeInfoCtrl);

    /**
    * @ngdoc controller
    * @name cloudlex.referral.controller:RefferedIntakeInfoCtrl
    * @requires $modalInstance
    * @description
    * 
    */
    RefferedIntakeInfoCtrl.$inject = ['$modalInstance', 'referredOutInfo'];
    function RefferedIntakeInfoCtrl($modalInstance, referredOutInfo) {
        var vm = this;
        vm.close = close;

        (function () {
            referredOutInfo.referrerText = referredOutInfo.activeTab === 'referred in' ? 'Referred Out By:' : 'Referred Out To:';

            referredOutInfo.referrerName = referredOutInfo.activeTab === 'referred in' ? (referredOutInfo.ref_out_by_fname + ' ' + referredOutInfo.ref_out_by_lname) : (referredOutInfo.ref_out_fname + ' ' + referredOutInfo.ref_out_lname)
            vm.referOutInfo = referredOutInfo;
            vm.title = referredOutInfo.activeTab === 'referred in' ? "Referred In Intake Info" : "Referred Out Intake Info";
        })();

        function close() {
            $modalInstance.dismiss();
        }

    }

})(angular);