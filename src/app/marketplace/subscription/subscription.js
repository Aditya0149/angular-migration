(function (angular) {
    'use strict';

    angular
        .module('cloudlex.marketplace')
        .controller('SubscriptionCtrl', SubscriptionCtrl)

    SubscriptionCtrl.$inject = ["$modalInstance", "practiceAndBillingDataLayer", "data", "isPlanChange", "applicationsDataLayer", "appName"]
    function SubscriptionCtrl($modalInstance, practiceAndBillingDataLayer, data, isPlanChange, applicationsDataLayer, appName) {
        var vm = this;
        // vm.planList = [{ id: 1, name: 'Unlimited texts', duration: 'Per Month', amount: '$30.00' }, { id: 2, name: '3000 texts', duration: 'Per Month', amount: '$20.00' }];
        vm.subscriptionPlan = {};
        vm.cancel = cancel;
        vm.subscribe = subscribe;
        var packageDetails = {};
        vm.planList = [];
        vm.showSMSplan = true;
        vm.appSMS = data.isSMS;
        vm.appIntake = data.isIntake;

        vm.isIntake = data.isIntake ? false : true;
        vm.confirm = isPlanChange ? true : false;
        vm.savePlan = savePlan;
        vm.appName = appName;
        (function () {
            getDetails();
        })();
        var list;
        function getDetails() {
            packageDetails = practiceAndBillingDataLayer.getPlanDetails();
            if (utils.isEmptyObj(packageDetails)) {
                var response = practiceAndBillingDataLayer.getPackageSubscripDetails();
                response.then(function (response) {
                    list = angular.copy(response);
                    vm.planList = vm.showSMSplan ? response.sms.active_sms_plan : response.intake.active_intake_plan;
                    vm.planList = _.sortBy(angular.copy(vm.planList), 'amount');
                });
            } else {
                list = angular.copy(packageDetails);
                vm.planList = vm.showSMSplan ? packageDetails.sms.active_sms_plan : packageDetails.intake.active_intake_plan;
                vm.planList = _.sortBy(angular.copy(vm.planList), 'amount');
            }
            if (isPlanChange) {
                if (vm.showSMSplan) {
                    _.forEach(vm.planList, function (item) {
                        if (list.sms.current_sms_plan[0].amount < item.amount) {
                            item.disablePlan = false;
                        } else {
                            item.disablePlan = true;
                        }
                    });
                    _.forEach(vm.planList, function (item) {
                        if (item.id == list.sms.current_sms_plan[0].sms_plan_id) {
                            vm.subscriptionPlan.plan = item;
                        }
                    });
                } else {
                    _.forEach(vm.planList, function (item) {
                        if (list.intake.current_intake_plan[0].amount < item.amount) {
                            item.disablePlan = false;
                        } else {
                            item.disablePlan = true;
                        }
                    });
                    _.forEach(vm.planList, function (item) {
                        if (item.id == list.intake.current_intake_plan[0].intake_plan_id) {
                            vm.subscriptionPlan.plan = item;
                        }
                    });
                }
            }
        }

        function savePlan(data) {
            // if (utils.isEmptyObj(data)) {
            //     notificationService.error('Please select plan');
            //     return;
            // }
            var checkForTypeOfApp;
            if (isPlanChange) {
                if (vm.showSMSplan) {
                    checkForTypeOfApp = list.sms.current_sms_plan[0].sms_plan_id;
                } else {
                    checkForTypeOfApp = list.intake.current_intake_plan[0].intake_plan_id;
                }
            }
            // if (vm.subscriptionPlan.plan.id == checkForTypeOfApp) {
            //     notificationService.error("You have already subscribed the same plan");
            //     return;
            // }
            var finalObj = {};
            finalObj.application_id = vm.showSMSplan ? "10" : "9";
            finalObj.plan_id = data.id;
            applicationsDataLayer.savePlan(finalObj)
                .then(function (response) {
                    // notificationService.success("Thank you! We will contact you soon.");
                    $modalInstance.close(response.data);
                })
        }

        function cancel() {
            $modalInstance.dismiss();
        }

        function subscribe() {
            // start
            // Intake manager/ SMS plan hardcoded to plan 4
            if (vm.appIntake || vm.appSMS) {
                var lastIndex = vm.planList.length;
                if (lastIndex > 0) {
                    vm.subscriptionPlan.plan = angular.copy(vm.planList[lastIndex - 1]);
                }
            }
            // end


            // if (utils.isEmptyVal(vm.subscriptionPlan.plan)) {
            //     notificationService.error("Please select plan");
            //     return;
            // }
            $modalInstance.close(vm.subscriptionPlan.plan);
        }

    }

})(angular);

