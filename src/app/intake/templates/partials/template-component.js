//Template Generate controller
(function (angular) {
    'use strict';

    angular.module('intake.clxIntakeTemplateComponent', []);


    /**
     * (Directive and when to use)
     * @clxSelect - For All Dropdown
     * @clxTextbox - For All textbox
     * @clxDate - For datepicker
     */

    /**
    * (Parameters that can pass in directive)
    * @list - 
    * @model - 
    * @modelname -
    * @affectmodelname -
    * @dependmodelname
    * @changefn 
    * @dependchangefn 
    * @multiple - for mutiselect dropdown
    * @ngexpression - e.g. item, item.uid, item.contactid, etc
    * @ngfilter - e.g. track by $index, | filter: something, etc
    * @groupby -
    * @groupfilter -
    * @selectedviewproperty - pass html that you want to show after selection (Note: it must be pass in single quote and if there is any condition you want to use single quote then use &apos; instead ' )
    * @dropdownviewproperty -  pass html that you want to show in dropdown view (Note: it must be pass in single quote and if there is any condition you want to use single quote then use &apos; instead ' )
    * @label - for label
    * @placeholder - for placeholder
    * @validation - for validation
    * @dependvalidation - for 
    */
    angular
        .module('intake.clxIntakeTemplateComponent')
        .directive('clxIntakeSelect', function () {
            var directive = {
                restrict: 'E',
                scope: {
                    list: '=',
                    model: "=",
                    modelname: "@",
                    affectmodelname: "@",
                    dependmodelname: "@",
                    changefn: "@",
                    dependchangefn: "@",
                    ngmultiple: "@",
                    selectedItemsChanged: '&',
                    ngexpression: "@",
                    ngfilter: "@",
                    groupby: "=",
                    groupfilter: "=",
                    selectedviewproperty: "@",
                    dropdownviewproperty: "@",
                    label: "@",
                    placeholder: "@",
                    validation: "@",
                    dependvalidation: "@"
                },
                controller: ['$scope', function ($scope) {

                    $scope.$watch('list', function(newVal) {
                        // if(newVal) { el.text(scope.product.name);}
                    }, true);

                    $scope.change = function () {
                        $scope.selectedItemsChanged({ selectedItems: $scope.model[$scope.modelname] });
                        $scope.model[$scope.affectmodelname] = undefined;
                    }
                }],
                template: function ($scope, element, attributes) {
                    var brTag = " ";
                    (element.ngmultiple == "yes") ? brTag == " <br> " : brTag = " ";
                    element.ngmultiple = (element.ngmultiple == "yes") ? ' class="select-physician-height" style="width: 94%;" multiple theme="select2" ' : ' theme="selectize" ';
                    element.changefn = (element.changefn == "yes") ? ' ng-change="change()" ' : '';

                    var groupBlock = (element.groupby) ? ' group-by="groupby" ' : '' + " " + (element.groupfilter) ? ' group-filter="groupfilter" ' : '';

                    var validationBlock1 = ' <span ng-show="list.length == 0">';
                    validationBlock1 += '        <small>{{ validation }}</small>';
                    validationBlock1 += '    </span>';

                    var validationBlock2 = '<span ng-show="model[dependmodelname] != undefined && list.length == 0">';
                    validationBlock2 += '        <small>{{ validation }}</small>';
                    validationBlock2 += '    </span>';
                    validationBlock2 += '    <span ng-show="model[dependmodelname] == undefined">';
                    validationBlock2 += '        <small>{{ dependvalidation }}</small>';
                    validationBlock2 += '    </span>';

                    element.dependchangefn = (element.dependchangefn == "yes") ? validationBlock2 : validationBlock1;

                    element.selectedviewproperty = (element.selectedviewproperty) ? element.selectedviewproperty : "<span>{{$select.selected.name}}</span>";
                    element.ngexpression = (element.ngexpression) ? element.ngexpression : "item ";
                    element.ngfilter = (element.ngfilter) ? element.ngfilter : " | filter:{name:$select.search} | orderBy: \'name\' ";
                    element.dropdownviewproperty = (element.dropdownviewproperty) ? element.dropdownviewproperty : "<small>{{item.name}}</small>";

                    var html = '<div class="height80px">';
                    html += '    <span><label>{{label}}</label></br></span>';
                    html += '    <ui-select  ng-model="model[modelname]" ' + element.ngmultiple + ' ' + element.changefn + ' >';
                    html += '        <ui-select-match placeholder="{{placeholder}}">';
                    html += element.selectedviewproperty;
                    html += '       </ui-select-match> ';
                    html += '        <ui-select-choices ' + groupBlock + ' repeat=" ' + element.ngexpression + ' as item in list ' + element.ngfilter + ' " >';
                    html += element.dropdownviewproperty;
                    html += '        </ui-select-choices>';
                    html += '    </ui-select>';
                    html += element.dependchangefn;
                    html += ' </div>';
                    return html;

                }
            }
            return directive;

        });


    /**
* (Parameters that can pass in directive)
* @model - 
* @modelname -
* @compulsarymark: pass yes if textbox is compulsary,
* @currency: for apply currency filter,
* @label - for label
* @placeholder - for placeholder
* @validation - for validation
* @dollarbox - for "$" sign before amount input field.
* Note - after passing modelname append string 'DateDiv' for validation error in ctrl e.g custom_date -> custom_dateDateDiv
*/
    angular
        .module('intake.clxIntakeTemplateComponent')
        .directive('clxIntakeTextbox', function () {
            var directive = {
                restrict: 'E',
                scope: {
                    model: "=",
                    modelname: "@",
                    compulsarymark: "@",
                    currency: "@",
                    label: "@",
                    placeholder: "@",
                    validation: "@",
                    dollarbox: "@"
                },
                template: function ($scope, element, attributes) {

                    var currencyBlock = (element.currency == "yes") ? ' custom-currency-filter ' : '';
                    var compulsarymarkBlock = (element.compulsarymark == "yes") ? ' <span class="compulsary-mark">*</span> ' : '';
                    var dollarBoxStartBlock = (element.dollarbox == "yes") ? ' <div class="input-group" style="width:94%;"> <span class="input-group-addon">$</span> ' : '';
                    var dollarBoxEndBlock = (element.dollarbox == "yes") ? ' </div> ' : '';

                    var html = '<div class="height80px">';
                    html += '       <span><label>{{label}} ' + compulsarymarkBlock + ' </label></br></span>';
                    html += dollarBoxStartBlock;
                    html += '       <input type="text" ' + currencyBlock + ' ng-model="model[modelname]" placeholder="{{placeholder}}" class=" form-control"/> '
                    html += dollarBoxEndBlock;
                    html += '   </div>';
                    return html;

                }
            }
            return directive;

        });


    /**
   * (Parameters that can pass in directive)
   * @model - 
   * @modelname -
   * @label - for label
   * @placeholder - for placeholder
   * @validation - for validation
   * Note - after passing modelname append string 'DateDiv' for validation error in ctrl e.g custom_date -> custom_dateDateDivError
   */
    angular
        .module('intake.clxIntakeTemplateComponent')
        .directive('clxIntakeDate', function () {
            var directive = {
                restrict: 'E',
                scope: {
                    model: "=",
                    modelname: "@",
                    condition: "&",
                    label: "@",
                    placeholder: "@",
                    validation: "@",
                },
                controller: ['$scope', function ($scope) {
                    $scope.call = function ($event) {
                        $scope.condition({ event: $event });
                    }
                }],
                template: function ($scope, element, attributes) {

                    var opencondition = element.modelname + 'DateDiv';
                    var id = element.modelname + 'DateDiv';
                    var errDiv = '#' + element.modelname + 'DateDiv';
                    var errId = element.modelname + 'DateDivError'

                    var html = '<div class="height80px">';
                    html += '       <span><label>{{label}}</label></br></span>';
                    html += '       <div class="input-group datepicker">'
                    html += '           <input type="text" class="form-control" datepicker-popup="MM/dd/yyyy"  tooltip="mm/dd/yyyy" placeholder="mm/dd/yyyy"  validate-date name="doi" close-text="Close" data-ng-disabled="false" '
                    html += '              ng-model="model[modelname]" is-open="' + opencondition + '" id="' + id + '" error-div="' + errDiv + '" />'
                    html += '           <span class="input-group-btn"> '
                    html += '               <button type="button" class="btn btn-default" ng-click="call($event);' + opencondition + ' = true;"> '
                    html += '                   <i class="default-calendar-small sprite"></i>'
                    html += '               </button>'
                    html += '           </span>'
                    html += '       </div>'
                    html += '       <div class="error" style="float:left" id="' + errId + '">Invalid date format!</div> '
                    html += '   </div>'

                    return html;

                }
            }
            return directive;

        });

    angular
        .module('intake.clxIntakeTemplateComponent')
        .directive("intakelayoutd60", function () {
            return {
                restrict: "E",
                templateUrl: "app/intake/templates/partials/layout/Intakelayoutd60.html"
            };
        });

    // angular
    //     .module('intake.clxIntakeTemplateComponent')
    //     .directive("layoutd43", function () {
    //         return {
    //             restrict: "E",
    //             templateUrl: "app/templates/partials/layout/layoutd43.html"
    //         };
    //     });

})(angular);