angular.module('intake.components')
	.factory('createDialogForIntake', ['$modal', function ($modal) {

		return function Dialog(isConfirm, title, msg, successFn) {
			var modalInstance = $modal.open({
				templateUrl: 'app/components/dialogue/custom-dialog.html',
				controller: 'CustomDialogCtrlForIntake',
				resolve: {
					isConfirm: function () {
						return isConfirm;
					},
					msg: function () {
						if (msg)
							return msg;
						else
							return null;
					},
					title: function () {
						return title;
					}
				}
			});

			modalInstance.result.then(function (data) {
				if (data.type == "msg")
					successFn.call();
			});
		};
	}]);
