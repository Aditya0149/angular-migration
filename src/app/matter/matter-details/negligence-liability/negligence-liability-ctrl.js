(function () {
    'use strict';

    angular
        .module('cloudlex.matter')
        .controller('NegligenceLiabilityCtrl', NegligenceLiabilityCtrl);

    NegligenceLiabilityCtrl.$inject = ['$stateParams', 'matterDetailsService', 'notification-service', 'masterData', 'matterFactory'];

    function NegligenceLiabilityCtrl($stateParams, matterDetailsService, notificationService, masterData, matterFactory) {
        var vm = this;
        var matterId = $stateParams.matterId, description, damageDetails;
        // Adding variable damageDetails to store a local copy of Property Damage Details 
        vm.saveDescription = saveDescription;
        vm.goToViewMode = goToViewMode;
        vm.damageStatusChange = damageStatusChange;// Function to keep track of Property Damage Status i.e. whether added or not.
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;

        //SAF for initialization
        (function () {
            vm.negligenceLiability = {};

            matterDetailsService.getNegligenceLiabilityInfo(matterId)
                .then(function (response) {
                    var data = response;
                    vm.negligenceLiability.description = data.description;
                    vm.negligenceLiability.propertyDamage = data.property_damage;
                    vm.negligenceLiability.damageStatus = (data.property_damage) ? (data.property_damage.length !== 0) : false;//Truth Value for Property Damage Checkbox.
                    description = vm.negligenceLiability.description || "";
                    damageDetails = vm.negligenceLiability.propertyDamage || "";
                    vm.mode = 'view';
                });
            vm.matterInfo = matterFactory.getMatterData(matterId);

        })();

        function saveDescription(desc) {
            matterDetailsService.saveNegligenceLiabilityInfo(matterId, desc.description, desc.propertyDamage)
                .then(function (response) {
                    description = desc.description;
                    if (utils.isNotEmptyVal(desc.propertyDamage)) {
                        damageDetails = desc.propertyDamage;
                    } else {
                        damageDetails = "";
                    }

                    vm.negligenceLiability.damageStatus = (damageDetails) ? (damageDetails.length !== 0) : false;
                    vm.mode = 'view';
                    //localStorage.setItem("desc", '');
                    notificationService.success('Information saved successfully.');
                }, function (error) {
                    notificationService.error('An error occurred. Please try later.');
                });
        };

        function goToViewMode() {
            vm.negligenceLiability.description = description;
            vm.mode = 'view';
            vm.negligenceLiability.damageStatus = (damageDetails) ? (damageDetails.length !== 0) : false;
            vm.negligenceLiability.propertyDamage = damageDetails;
        }
        function damageStatusChange() {
            if (!vm.negligenceLiability.damageStatus) {
                vm.negligenceLiability.propertyDamage = "";
            }

        }


    }

})();