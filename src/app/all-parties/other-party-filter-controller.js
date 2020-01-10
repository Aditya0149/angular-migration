(function () {
	'use strict';
	angular
		.module('cloudlex.allParties')
		.controller('OtherPartiesFilterCtrl', OtherPartiesFilterCtrl)
		.controller('OtherPartiesFilterApiCtrl', OtherPartiesFilterApiCtrl);
	OtherPartiesFilterCtrl.$inject = ['$scope', '$modalInstance', 'role', 'filters', 'tags'];
	function OtherPartiesFilterCtrl($scope, $modalInstance, role, filters, tags) {
		var self = this;
		self.role = [];
		$scope.currentFilter = {
			roleFilter: [],
		};
		self.taglist = tags;
		(function () {
			self.role = role;
			self.role = _.uniq(self.role, function (item) {
				return item;
			});
			self.selectedFilters = filters;
			self.roleFilter = self.selectedFilters;
		})();
		self.cancel = function () {
			$modalInstance.dismiss('cancel');
			//selectedFilters = self.currentFilter;
		};
		/**
		 * @ extraFilter : represent exclude global contact filter
		 */
		self.applyFilters = function (filter) {
			var filtercopy = [];
			//var flag=flag;
			filtercopy = angular.copy(filter);
			$modalInstance.close({ filters: filtercopy });
		}

		$scope.$watch(function () {
			if (self.roleFilter.length > 0 || self.taglist.length > 0) {
				self.enableApplyForOther = false;
			} else {
				self.enableApplyForOther = true;
			}
			return self.enableApplyForOther;
		})
		/*self.reset = function () {
		    self.roleFilter = [];
				$modalInstance.close({ filters: filtercopy});
		}*/
		self.reset = function () {
			self.roleFilter = [];
			//$modalInstance.dismiss('cancel');
		};

	}
	OtherPartiesFilterApiCtrl.$inject = ['allPartiesDataService', '$scope', '$modalInstance', 'matterID', 'role', 'filters', 'tags'];
	function OtherPartiesFilterApiCtrl(allPartiesDataService, $scope, $modalInstance, matterID, role, filters, tags) {
		var self = this;
		self.role = [];
		$scope.currentFilter = {
			roleFilter: [],
		};
		var tag = tags;
		self.role = role;
		(function () {
			self.role = role;
			self.role = _.uniq(self.role, function (item) {
				return item.contactrolename;
			});
			if (filters != null) {
				self.selectedFiltersapi = filters;
				self.roleFilter = self.selectedFiltersapi;
			}
			//self.selectedFilters = filters;
			//self.roleFilter = self.selectedFilters;
		})();
		self.cancel = function () {
			$modalInstance.dismiss('cancel');
			//selectedFilters = self.currentFilter;
		};
		/**
		 * @ extraFilter : represent exclude global contact filter
		 */
		self.applyFilters = function (filter) {
			var filtercopy = [];
			//var flag=flag;
			filtercopy = angular.copy(filter);
			$modalInstance.close({ filters: filtercopy });
		}

		$scope.$watch(function () {
			if (self.roleFilter.length > 0 || tag.length > 0) {
				$scope.enableApply = false;
			} else {
				$scope.enableApply = true;
			}
			return $scope.enableApply;
		})
		/*	self.reset = function () {
				self.roleFilter = [];
					$modalInstance.close({ filters: filtercopy});
			}*/
		self.reset = function () {
			self.roleFilter = [];
			//$modalInstance.dismiss('cancel');
		};

	}

})();




