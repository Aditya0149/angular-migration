angular.module('intake.components')
    .factory('dialogServiceForIntake', ['$modal', function ($modal) {

        var _initDialog = function (htmlurl, angularController, params, size) {
            size = size || 'sm';
            var modalInstance = $modal.open({
                backdrop: true,
                backdropClick: true,
                keyboard: true,
                templateUrl: htmlurl,
                controller: angularController,
                size: size,
                resolve: {
                    params: function () {
                        return params;
                    }
                }
            });
            return modalInstance;
        };

        return {
            initDialog: _initDialog
        };

    }]);
