(function () {
    angular.module('cloudlex.spinner', ['angularSpinner'])
    .directive('usSpinner', ['$http', 'usSpinnerService', function ($http, usSpinnerService) {
        return {
            link: function (scope, elm, attrs) {
                scope.isLoading = function () {
                    return $http.pendingRequests.length > 0;
                };
                scope.$watch(scope.isLoading, function (loading) {
                    if (loading) {
                        usSpinnerService.spin('pageSpinner');
                    } else {
                        usSpinnerService.stop('pageSpinner');
                    }
                });
            }
        };

    }]);
})();
