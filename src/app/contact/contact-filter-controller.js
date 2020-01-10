;

(function () {

	'use strict';

	angular
		.module('cloudlex.contact')
		.controller('GlobalContactFiltersCtrl', GlobalContactFiltersCtrl);

	GlobalContactFiltersCtrl.$inject = ['$rootScope', 'contactFactory', '$scope', 'type', 'JavaFilterAPIForContactList', '$modalInstance', 'states', 'tags'];

	function GlobalContactFiltersCtrl($rootScope, contactFactory, $scope, type, JavaFilterAPIForContactList, $modalInstance, states, tags) {

		var self = this;
		self.type = [];
		self.currentFilter = {
			catFilter: []
		};
		self.extraFilter = {};
		self.tags = tags;
		// utils.isNotEmptyVal(localStorage.getItem("contactList"));
		//      if(utils.isEmptyObj(contactListFilter)){
		// 		 	selectedFilters = '';
		// 		self.currentFilter = selectedFilters;
		// 	}
		var pageNum = 1;
		var pageSize = 250;

		(function () {

			_.forEach(type, function (t) {
				self.type.push(t);
			});
			//self.type = type;
			self.states = states;
			//Bug#4164 for Selected filter is to be reset 
			if ($rootScope.onContactManager == true) {
				var obj = localStorage.getItem('contactList')
			} else if ($rootScope.onIntake) {
				var obj = localStorage.getItem('intake_contactList')
			} else if ($rootScope.onMatter) {
				var obj = localStorage.getItem('matter_contactList')
			}
			self.currentFilter = JSON.parse(obj);


			/**
			 * contact extra filter
			 */
			// var extraFilter = sessionStorage.getItem('contactExtraFilter');
			if ($rootScope.onContactManager == true) {
				var contactExtraFilter = localStorage.getItem('contactExtraFilter');
			} else if($rootScope.onIntake) {
				var contactExtraFilter = localStorage.getItem('intake_contactExtraFilter');
			} else if($rootScope.onMatter) {
				var contactExtraFilter = localStorage.getItem('matter_contactExtraFilter');
			}
			self.extraFilter = JSON.parse(contactExtraFilter);
		})();

		self.cancel = function () {
			$modalInstance.dismiss('cancel');
			selectedFilters = self.currentFilter;
		};

		$scope.$watch(function () {
			if (utils.isEmptyObj(self.currentFilter) && utils.isEmptyVal(self.extraFilter)) {
				self.enableApply = true;
			} else {
				if ((self.currentFilter.type && self.currentFilter.type.length > 0) || (self.currentFilter.statename && utils.isNotEmptyVal(self.currentFilter.statename)) || (self.extraFilter && self.extraFilter.egc_type && self.extraFilter.egc_type == true) || (self.tags.length > 0)) {
					self.enableApply = false;
				} else {
					self.enableApply = true;
				}

			}
		})
		/**
		 * @ extraFilter : represent exclude global contact filter
		 */
		self.applyFilters = function (selectedFilter, extraFilter) {
			//Bug#5015
			sessionStorage.setItem('pageMore', 'false');
			contactFactory.getGlobalContactsList(pageNum, pageSize, selectedFilter, extraFilter, JavaFilterAPIForContactList)
				.then(function (data) {
					$modalInstance.close({ filterData: data, filters: selectedFilter, extraFilter: extraFilter });
				});
		}

		self.reset = function () {
			self.currentFilter = {};
			if (utils.isNotEmptyVal(self.extraFilter)) {
				self.extraFilter.egc_type = false;
			}

		};

	}

})();




