(function (angular) {

    'use strict';

    angular
        .module('cloudlex.dashboard')
        .directive('clxAverageMatterAge', avarageMatterAge);

    avarageMatterAge.$inject = [];

    function avarageMatterAge() {
        var directive = {
            restrict: 'E',
            scope: {
                data: '=',
            },
            controller: controllerFn,
            template: getHtml,
            controllerAs: 'matterAge',
            bindToController: true,
            replace: true,
        };

        return directive;

        function getHtml() {
            var html = ' <div class="container">';
            html += '       <div class="row">';
            html += '           <div data-ng-repeat="matterAge.data" class="col-md-2  matter-age-chart-section">';
            html += '               <div class="graph-tip">';
            html += '                   25 Days<div class="matter-stage">New Case/Pre-Lit</div>';
            html += '               </div>';
            html += '           </div>';
            html += '       </div>';
            html += '   </div>';
            html += '  <div class="col-md-1 total-matters matter-age-chart-section">';
            html += '       <h1>115</h1>';
            html += '       Total Days';
            html += '  </div>';
            return html;
        }
    }

    function controllerFn() {

    }

})(angular)


