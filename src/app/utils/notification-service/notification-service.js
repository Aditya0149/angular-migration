angular.module('notification', ['cgNotify'])
.factory('notification-service', ['notify', function (notify) {
    return {
        success: success,
        success_document: success_document,
        error: error,
        warning: warning,
        info: info,
        custom: custom
    }

    function success(message, position) {
        notify({
            message: message,
            classes: 'alert-success',
            templateUrl: '',
            position: angular.isDefined(position) ? position : "center",
            duration: 3000
        });
    }

    function success_document(message, position) {
        notify({
            message: message,
            classes: 'alert-success',
            templateUrl: '',
            position: angular.isDefined(position) ? position : "center",
            duration: 8000
        });
    }

    function error(message, position) {
        notify({
            message: message,
            classes: 'alert-danger max-width-630px',
            templateUrl: '',
            position: angular.isDefined(position) ? position : "center",
            duration: 3000
        });
    }

    function warning(message, position) {
        notify({
            message: message,
            classes: 'alert-warning',
            templateUrl: '',
            position: angular.isDefined(position) ? position : "center",
            duration: 3000
        });
    }

    function info(message, position) {
        notify({
            message: message,
            classes: 'alert-info',
            templateUrl: '',
            position: angular.isDefined(position) ? position : "center",
            duration: 3000
        });
    }

    function custom(customNotification) {
        notify(customNotification);
    }

}]);
