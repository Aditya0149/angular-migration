(function (angular) {

    angular
        .module('clxFilterTags', []);

    angular
        .module('clxFilterTags')
        .directive('clxFilterTags', clxFilterTags)

    function clxFilterTags() {
        var directive = {
            restrict: 'E',
            link: linkFn,
            scope: {
                tagList: '=',
                onFilterCancel: '&'
            },
            template: templateFn
        }

        return directive;

        function linkFn(scope) {
            scope.removeTag = function (filter) {
                if (angular.isUndefined(filter)) {
                    return;
                }

                var keys = _.pluck(scope.tagList, 'key');
                var index = keys.indexOf(filter.key);
                if (index > -1) {
                    scope.tagList.splice(index, 1);
                }
                scope.onFilterCancel()(filter);
            }
        }

        function templateFn() {
            var html = '<ul class="tags">';
            html += '<li class="paddingRLR" data-ng-repeat="filter in tagList" class="bg-info">';
            html += ' <strong>{{filter.value | replaceByBlank}}</strong>'
            html += ' <a href="javascript:void(0)" data-ng-click="removeTag(filter)" aria-hidden="true">×</a>';
            html += '</li>';
            html += '</ul>';
            return html;
        }
    }

})(angular);