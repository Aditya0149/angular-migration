(function () {

    'use strict';

    angular
        .module('cloudlex.settings')
        .controller('SubScriptionCtrl', SubScriptionCtrl);

    SubScriptionCtrl.$inject = [];
    function SubScriptionCtrl() {

        var vm = this;
        //prestntation logic
        vm.activateTab = activateTab;
        // vm.groupPlaintiffDefendants = groupPlaintiffDefendants;
        // vm.showViewDoc = showViewDoc;
        // vm.viewDocument = viewDocument;

        //SAF to initialize data


        (function () {
            vm.activeTab = {};
            var prevActiveTab = localStorage.getItem("SubscriptionActiveTab");
            prevActiveTab = utils.isEmptyVal(prevActiveTab) ? 'pra' : prevActiveTab;
            vm.activeTab[prevActiveTab] = true;
            // vm.activeTab= prevActiveTab;

            // matterFactory.setBreadcrum(vm.matterId, 'Details');
        })();
    }

    function activateTab(tabName, tabs) {
        tabs[tabName] = true;
        angular.forEach(tabs, function (val, key) {
            tabs[key] = key === tabName;
        });
        //persist active tab
        localStorage.setItem("SubscriptionActiveTab", tabName);
    }

})();

