(function () {

    'use strict';

    angular
        .module('cloudlex.settings')
        .controller('userManagementTabCtrl', userManagementTabCtrl);

    userManagementTabCtrl.$inject = ['masterData'];
    function userManagementTabCtrl(masterData) {

        var vm = this;

        vm.activateTab = activateTab;
        vm.role = masterData.getUserRole();

        (function () {
            vm.activeTab = {};
            var prevActiveTab = localStorage.getItem("userMgmtActiveTab");
            prevActiveTab = utils.isEmptyVal(prevActiveTab) ? 'pra' : prevActiveTab;
            vm.activeTab[prevActiveTab] = true;

        })();


    }

    function activateTab(tabName, tabs) {
        tabs[tabName] = true;
        angular.forEach(tabs, function (val, key) {
            tabs[key] = key === tabName;
        });
        //persist active tab
        localStorage.setItem("userMgmtActiveTab", tabName);
    }

})();

