(function (angular) {
    angular.module('cloudlex.matter')
        .controller('valuation', valuation);

    valuation.$inject = ['$modalInstance', '$stateParams', 'globalConstants', '$http', 'notification-service', 'masterData', 'matterFactory'];

    function valuation($modalInstance, $stateParams, globalConstants, $http, notificationService, masterData, matterFactory) {
        var vm = this;
        vm.valBtnTxt = 'Edit'; //button text to edit
        vm.editvar = false; // to set edit mode hidden and hide edit heading 
        var matterId = $stateParams.matterId;
        var addvaluationURL = globalConstants.webServiceBase + 'matter/matter_valuation/' + matterId;
        vm.close = close;
        vm.operation = operation;
        var matterPermissions = masterData.getPermissions();
        vm.matterValuatiion = _.filter(matterPermissions[0].permissions, function (per) {

            if (per.entity_id == '8') {
                return per;
            }
        });
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.surgery = [{
            label: 'Yes',
            value: '1'
        }, {
            label: 'No',
            value: '2'
        }];
        vm.limitExhausted = [{
            label: 'Yes',
            value: '1'
        }, {
            label: 'No',
            value: '2'
        }];
        vm.valuationInfo = {};
        vm.valuationInfo.injury = 0;
        vm.getValuation = getValuation;
        getValuation(addvaluationURL);
        vm.matterInfo = matterFactory.getMatterData(matterId);
        function operation(matterId) {
            if (vm.editvar == true) {

                vm.valuationInfo.expected_value = (typeof (vm.valuationInfo.expected_value) == 'undefined' || vm.valuationInfo.expected_value == null || vm.valuationInfo.expected_value == "") ? null : vm.valuationInfo.expected_value;
                vm.valuationInfo.total_policy_amount = (typeof (vm.valuationInfo.total_policy_amount) == 'undefined' || vm.valuationInfo.total_policy_amount == null || vm.valuationInfo.total_policy_amount == "") ? null : vm.valuationInfo.total_policy_amount;
                vm.valuationInfo.future_loss = (typeof (vm.valuationInfo.future_loss) == 'undefined' || vm.valuationInfo.future_loss == null || vm.valuationInfo.future_loss == "") ? null : vm.valuationInfo.future_loss;

                save(vm.valuationInfo);
            }
            vm.editvar = true; //on click of edit operation is executed and chnage edit var to true to show edit mode
            vm.valBtnTxt = 'Save'; //change button text to save       
        }

        function getValuation(matterId) {
            var url = addvaluationURL + ".json";
            $http.get(url).then(function (response) {
                var novaluation = response.data;
                if (typeof novaluation[0] === "string") {
                    vm.error = novaluation;
                    vm.errorFlag = true;
                    return;
                } else {
                    vm.valuationInfo = response.data;
                    vm.valuationInfo.policy_limit_perperson = (typeof (vm.valuationInfo.policy_limit_perperson) == 'undefined' || vm.valuationInfo.policy_limit_perperson == null) ? null : parseFloat(vm.valuationInfo.policy_limit_perperson);
                    vm.valuationInfo.total_policy_amount = (typeof (vm.valuationInfo.total_policy_amount) == 'undefined' || vm.valuationInfo.total_policy_amount == null) ? null : (parseFloat(vm.valuationInfo.total_policy_amount)).toString();
                    vm.valuationInfo.injury = parseFloat(vm.valuationInfo.injury);
                    vm.valuationInfo.future_loss = (typeof (vm.valuationInfo.future_loss) == 'undefined' || vm.valuationInfo.future_loss == null) ? null : (parseFloat(vm.valuationInfo.future_loss)).toString();
                    vm.valuationInfo.expected_value = (typeof (vm.valuationInfo.expected_value) == 'undefined' || vm.valuationInfo.expected_value == null) ? null : (parseFloat(vm.valuationInfo.expected_value)).toString();
                    vm.valuationInfo.policy_limit_max = (typeof (vm.valuationInfo.policy_limit_max) == 'undefined' || vm.valuationInfo.policy_limit_max == null) ? null : (parseFloat(vm.valuationInfo.policy_limit_max)).toString();
                }
            }, function (error) {

            });

        }

        function save(valuationInfo) {
            delete valuationInfo[0];
            valuationInfo.expected_value = isNaN(valuationInfo.expected_value) ? null : valuationInfo.expected_value;
            valuationInfo.future_loss = isNaN(valuationInfo.future_loss) ? null : valuationInfo.future_loss;
            valuationInfo.policy_limit_max = isNaN(valuationInfo.policy_limit_max) ? null : valuationInfo.policy_limit_max;
            valuationInfo.policy_limit_perperson = isNaN(valuationInfo.policy_limit_perperson) ? null : valuationInfo.policy_limit_perperson;
            valuationInfo.total_policy_amount = isNaN(valuationInfo.total_policy_amount) ? null : valuationInfo.total_policy_amount;

            $http.put(addvaluationURL, valuationInfo)
                .then(function (response) {
                    notificationService.success("Valuation saved successfully");
                    $modalInstance.close(valuationInfo);

                }, function (error) {
                    notificationService.error('An error occurred. Please try later.');
                });
        }

        function close() {
            $modalInstance.dismiss();
        }
    }

})(angular)