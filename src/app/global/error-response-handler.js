(function (angular) {

    angular
        .module('cloudlex')
        .factory('errorResponseHandler', errorResponseHandler);

    errorResponseHandler.$inject = ['$rootScope', '$injector'];

    function errorResponseHandler($rootScope, $injector) {
        return {
            handle: handle
        }

        function handle(errorResponse) {
            var $state = $injector.get('$state');
            var $http = $injector.get('$http');
            var $modal = $injector.get('$modal');


            switch (errorResponse.status) {
                case 401:
                    $rootScope.errors.push(errorResponse.statusText);
                    break;
                case 406:
                    if (utils.endsWith(errorResponse.config.url, 'logout')) {
                        if ($http.pendingRequests.length <= 0) {
                        }
                        localStorage.clear();
                        sessionStorage.clear();
                        $state.go('login');
                    }
                    break;
                case 0:
                    if ($http.pendingRequests.length < 1) {
                        var modalInstance = $modal.open({
                            template: '<style>.connection-failed .modal-dialog{width: 350px;margin-top: 0px !important;}</style><div class="modal-header clearfix">    <h1 class="modal-title fl-left">Connection failed!</h1></div><div class="filter-greybox container modal-body"><div class="clearfix"> <div>There seems to be a temporary network issue. Please try after some time</div> </div></div><div class="modal-footer"> <div>  <div class="pull-right"> <button ng-click="close()" type="button" class="btn btn-default btn-styleNone">Ok</button></div>    </div></div>',
                            controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {

                                $scope.close = function () {
                                    $modalInstance.close();
                                };

                            }],
                            backdrop: 'static',
                            windowClass: 'modalMidiumDialog connection-failed',

                        });
                    }

            }

        }

    }

})(angular);