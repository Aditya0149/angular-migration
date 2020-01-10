// jshint maxdepth:2
// jshint maxparams:4
// jshint maxstatements:30
// jshint unused:true

(function (angular) {
    'use strict';

    angular
        .module('cloudlex.referral')
        .directive('contactHasEmail', function () {

            return {
                require: 'ngModel',
                link: function (scope, element, attrs, ctrl) {
                    ctrl.$validators.contactHasEmail = function (modelValue) {

                        if (angular.isUndefined(modelValue) || utils.isEmptyString(modelValue)) {
                            return true;
                        }
                        if (angular.isUndefined(modelValue.email)) {
                            return false;
                        }
                        if (_.isNull(modelValue.email) || utils.isEmptyString(modelValue.email)) {
                            return false;
                        }
                    };
                }
            };
        });

})(angular);
