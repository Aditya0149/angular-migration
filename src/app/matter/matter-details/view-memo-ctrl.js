(function () {
    angular
        .module('cloudlex.matter')
        .controller('viewMemoCtrl', viewMemoCtrl);

    viewMemoCtrl.$inject = ['$rootScope', '$modalInstance', 'viewMemoInfo'];

    function viewMemoCtrl($rootScope, $modalInstance, viewMemoInfo) {
        var vm = this;
        vm.memo = utils.isNotEmptyVal(viewMemoInfo.selectedItems[0]) ? viewMemoInfo.selectedItems[0].memo : viewMemoInfo.selectedItems.memo;
        vm.close = function () {
            $modalInstance.close();
            $rootScope.$broadcast('unCheckSelectedItems');
        }
    }

})();