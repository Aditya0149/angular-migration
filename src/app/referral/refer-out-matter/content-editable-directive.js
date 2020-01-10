// jshint maxdepth:2
// jshint maxstatements:30
// jshint unused:true

(function (angular) {
    'use strict';

    /**
     * @ngdoc directive
     * @name cloudlex.referral.directive:editableHtml
     * @restrict A
     * @element block level elements
     * @function
     *
     * @description
     * allows editing of the html contents and bind it to ng-model
     *
     * @example
       <div editable-html="" disable-edit="disableEditCondition" ng-model="text"></div>
     */

    angular
        .module('cloudlex.referral')
        .directive("editableHtml", function () {
            return {
                restrict: "A",
                require: "ngModel",
                link: function (scope, element, attrs, ngModel) {

                    scope.$watch(function () {
                        return scope.$eval(attrs.disableEdit);
                    }, function (cannotEdit) {

                        if (cannotEdit === true) {
                            element.removeAttr('contenteditable');
                        }

                        if (cannotEdit === false) {
                            element.attr('contenteditable', '');
                        }
                    });

                    function read() {
                        ngModel.$setViewValue(element.html());
                    }

                    ngModel.$render = function () {
                        element.html(ngModel.$viewValue || "");
                    };

                    element.bind("blur keyup change", function () {
                        scope.$apply(read);
                    });
                }
            };
        });

})(angular);
