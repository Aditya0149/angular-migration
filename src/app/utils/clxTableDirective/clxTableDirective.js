(function (angular) {
    'use strict';

    angular.module('clxTableDirective', []);

    angular
        .module('clxTableDirective')
        .directive('clxTable', tableDirective);

    tableDirective.$inject = ['$parse', '$compile', 'templateFactory'];
    function tableDirective($parse, $compile, templateFactory) {
        var directive = {
            restrict: 'E',
            link: linkFn,
            controller: tableController,
        };

        return directive;

        function linkFn(scope, el, attrs) {
            var options = $parse(attrs.gridOptions)(scope);
            var template = templateFactory.getHtml(options.headers, gridData);
            var linkFn = $compile(template);
            var content = linkFn(scope);
            el.replaceWith(content);
        }
    }

    function tableController() {

    }

    angular
       .module('clxTableDirective')
       .factory('templateFactory', templateFactory);

    function templateFactory() {
        return {
            getHtml: getHtml
        }

        function getHtml(headers, data) {
            var strVar = "";
            strVar += "<div class=\"clx-table-container\"";
            strVar += "        data-ng-if=\"matterCtrl.viewModel.matters.length >0 \">";
            strVar += "        <div class=\"row header-row\">";
            strVar += "            <div class=\"cell checkbox\">";
            strVar += "                <input type=\"checkbox\"";
            strVar += "                    data-ng-model=\"matterCtrl.clxGridOptions.selectAll\"";
            strVar += "                    data-ng-checked=\"matterCtrl.allMatterSelected()\"";
            strVar += "                    data-ng-click=\"matterCtrl.selectAllMatters(matterCtrl.clxGridOptions.selectAll)\" \/><label><\/label>";
            strVar += "            <\/div>";
            strVar += "            <div class=\"cell\" data-ng-repeat=\"header in ::matterCtrl.clxGridOptions.headers\">";
            strVar += "                <strong>{{header.displayName}}<\/strong>";
            strVar += "            <\/div>";
            strVar += "        <\/div>";
            strVar += "        <div class=\"row body-row\"";
            strVar += "            data-ng-class=\"{'grid-row selected':matterCtrl.display.matterSelected[data.matter_id]}\"";
            strVar += "            data-ng-if=\"matterCtrl.display.filtered\"";
            strVar += "            data-ng-repeat=\"data in matterCtrl.viewModel.matters|filter:matterCtrl.viewModel.filters.filterText\">";
            strVar += "            <div class=\"cell checkbox\">";
            strVar += "                <input type=\"checkbox\"";
            strVar += "                    data-ng-checked=\"matterCtrl.isMatterSelected(data)\"";
            strVar += "                    checklist-model=\"matterCtrl.clxGridOptions.selectedItems\"";
            strVar += "                    checklist-value=\"data\" \/><label><\/label>";
            strVar += "            <\/div>";
            strVar += "            <div class=\"cell\" data-ng-repeat=\"header in ::matterCtrl.clxGridOptions.headers\"";
            strVar += "                data-ng-class=\"{'selected-grid-row':matterCtrl.isMatterSelected(data)}\">";
            strVar += "                <div data-ng-repeat=\"field in ::header.field\">";
            strVar += "                    {{::data[field.prop]}}";
            strVar += "                <\/div>";
            strVar += "            <\/div>";
            strVar += "        <\/div>";
            strVar += "    <\/div>";
            return strVar;
        }
    }

})(angular);