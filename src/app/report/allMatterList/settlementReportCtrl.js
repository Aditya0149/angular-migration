(function (angular) {

	'use strict';

	angular.module('cloudlex.report').
		controller('settlementReportCtrl', settlementReportCtrl);
	settlementReportCtrl.$inject = ['$modal', 'masterData', 'settlementHelper'];

	//controller definition 
	function settlementReportCtrl($modal, masterData, settlementHelper) {
		var self = this;
		var page_size = 250;
		var matterType = 'mymatter';
		self.getSettlementInfo = getSettlementInfo;
		var initSettlimit = 10;

		self.tagCancelled = tagCancelled;
		self.getMore = getMore;
		self.getAll = getAll;
		self.showPaginationButtons = showPaginationButtons;
		self.scrollReachedBottom = scrollReachedBottom;
		self.scrollReachedTop = scrollReachedTop;
		self.filter = {};
		self.openPopupFilter = openPopupFilter;
		self.dataReceived = false;
		self.print = print;
		self.downloadSettlementInfo = downloadSettlementInfo;
		self.clickedRow = -1;
		var masterDataObj = masterData.getMasterData();
		self.getStatusFilter = getStatusFilter;



		// sort object
		self.sorts = [{
			name: 'Matter name ASC',
			sort_by: 'matter_name',
			sortOrder: 'ASC',
			value: '1'
		}, {
			name: 'Matter name DESC',
			sort_by: 'matter_name',
			sortOrder: 'DSC',
			value: '2'
		}, {
			name: 'Settlement Amount ASC',
			sort_by: 'settlement_amount',
			sortOrder: 'ASC',
			value: 3
		}, {
			name: 'Settlement Amount DESC',
			sort_by: 'settlement_amount',
			sortOrder: 'DESC',
			value: 4
		},
		{
			name: 'Paid Amount ASC',
			sort_by: 'total_paid',
			sortOrder: 'ASC',
			value: 5
		}, {
			name: 'Paid Amount DESC',
			sort_by: 'total_paid',
			sortOrder: 'DESC',
			value: 6
		},
		{
			name: 'Outstanding Amount ASC',
			sort_by: 'outstanding_amount',
			sortOrder: 'ASC',
			value: 7
		}, {
			name: 'Outstanding Amount DESC',
			sort_by: 'outstanding_amount',
			sortOrder: 'DESC',
			value: 8
		}, {
			name: 'Settlement Date ASC',
			sort_by: 'settlement_date',
			sortOrder: 'ASC',
			value: 9
		}, {
			name: 'Settlement Date DESC',
			sort_by: 'settlement_date',
			sortOrder: 'DESC',
			value: 10
		}, {
			name: 'Retainer Date ASC',
			sort_by: 'retainer_date',
			sortOrder: 'ASC',
			value: 11
		}, {
			name: 'Retainer Date DESC',
			sort_by: 'retainer_date',
			sortOrder: 'DESC',
			value: 12
		}, {
			name: 'Closing statement Date ASC',
			sort_by: 'closing_statement_date',
			sortOrder: 'ASC',
			value: 13
		}, {
			name: 'Closing statement Date DESC',
			sort_by: 'closing_statement_date',
			sortOrder: 'DESC',
			value: 14
		}
		];

		//sort initialization self.selectedSort = 'Matter name ASC';

		var persistFilter = sessionStorage.getItem('settlementReportFilters');

		if (utils.isNotEmptyVal(persistFilter)) { //if the filters are not empty, then try 
			try {
				self.filter = JSON.parse(persistFilter);
				self.selectedSort = _.find(self.sorts, function (sort) { //check if which is the current selected sort
					return sort.value === self.filter.sort_by
				}).name;
				getSettlementInfo(self.filter);
				self.tags = generateTags(self.filter);
			} catch (e) {
				setFilters();
			}
		} else {
			setFilters(); // set filters
			getSettlementInfo(self.filter);
		}


		function getFilterValues(masterList, filter) {
			return masterList[filter].map(function (item) {
				return {
					id: item.id,
					name: item.name
				};
			});
		}


		// function currencyFormat(num) {
		// 	return "$" + parseFloat(num).toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
		// }
		function currencyFormat(num) {
			num = num.toString();
			return "$" + num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
		}

		function moveBlankToBottom(array) {
			//make sure array has {id,name} objects
			var values = _.pluck(array, 'name');
			var index = values.indexOf('');
			utils.moveArrayElement(array, index, array.length - 1);
			return array;
		}

		// set the default state of sort/filter if persisted item is not found
		function setFilters() {
			var defaultSelected = _.find(self.sorts, function (sort) {
				return sort.value == 1 && sort.sortOrder == 'ASC'
			});
			self.selectedSort = defaultSelected.name;
			self.filter = {
				page_num: 1,
				page_size: page_size,
				sort_by: defaultSelected.value,
				statuses: [],
				include_archived: 0
			};
		}




		/* check whether to show more and all buttons*/
		function showPaginationButtons() {

			if (!self.dataReceived) { // if data not received
				return false;
			}

			if (angular.isUndefined(self.settlementDataList) || self.settlementDataList.length <= 0) { //if data is empty
				return false;
			}

			if (self.filter.page_size === 'all') { // if page_size is all
				return false;
			}

			if (self.settlementDataList.length < (self.filter.page_size * self.filter.page_num)) {
				return false
			}
			return true;
		}

		/* Callback to get more data according to pagination */
		function getMore() {
			self.dataReceived = false;
			var postSettParams = setSettInfoParams(self.filter, masterDataObj);
			postSettParams.page_num += 1;
			postSettParams.page_size = page_size;
			settlementHelper.getSettlementData(postSettParams)
				.then(function (response) {
					_.forEach(response[0].data, function (settlement, index) {
						response[0].data[index].date_of_incidence = (settlement.date_of_incidence == '0') ? '-' : (utils.isEmptyVal(settlement.date_of_incidence)) ?
							'' : moment.unix(settlement.date_of_incidence).utc().format("MM/DD/YYYY");
						response[0].data[index].settlement_date = (settlement.settlement_date == '0') ? '-' : (utils.isEmptyVal(settlement.settlement_date)) ?
							'' : moment.unix(settlement.settlement_date).utc().format("MM/DD/YYYY");
						//US#8309
						response[0].data[index].retainer_date = (settlement.retainer_date == '0') ? '' : (utils.isEmptyVal(settlement.retainer_date)) ?
							'' : moment.unix(settlement.retainer_date).utc().format("MM/DD/YYYY");
						response[0].data[index].closing_statement_date = (settlement.closing_statement_date == '0') ? '' : (utils.isEmptyVal(settlement.closing_statement_date)) ?
							'' : moment.unix(settlement.closing_statement_date).utc().format("MM/DD/YYYY");
						self.settlementDataList.push(settlement);
					});
					//self.settlementDataList = response[0].data;
					self.dataReceived = true;
				});



		}


		/* Callback to get all report data */
		function getAll() {
			self.filter.page_size = 'all';
			self.dataReceived = false;
			getSettlementInfo(self.filter);

		}
		function removeCancelledSubStatus(filter) {
			var substatus;
			if (utils.isNotEmptyVal(filter.statuses)) {
				var statusArray = _.pluck(filter.statuses, 'id');
				var statusFromMasterList = [];
				_.forEach(statusArray, function (item) {
					_.forEach(masterDataObj.statuses, function (currentItem) {
						if (currentItem.id == item) {
							statusFromMasterList.push(currentItem);
						}
					})
				})

				var selectedSubStatus = [];
				_.forEach(statusFromMasterList, function (currentItem) {
					_.forEach(currentItem["sub-status"], function (currentI) {
						selectedSubStatus.push(currentI);
					})
				})
				var intersect = [];
				_.forEach(filter.substatus, function (item) {
					_.forEach(selectedSubStatus, function (ct) {
						if (ct.id == item.id) {
							intersect.push(item);
						}

					})
				})
				substatus = intersect;
			} else {
				substatus = [];
			}
			return substatus;
		}

		/* Call back funtion for when filter tag is calncelled */
		function tagCancelled(tag) {
			switch (tag.key) {
				case 'matter':
					self.filter.matter_id = '';
					break;

				case 'payment_status':
					var currentFilters = _.pluck(self.filter[tag.key], 'id');
					var index = currentFilters.indexOf(tag.id);
					self.filter[tag.key].splice(index, 1);
					break;

				case 'negotiation_status':
					var currentFilters = _.pluck(self.filter[tag.key], 'id');
					var index = currentFilters.indexOf(tag.id);
					self.filter[tag.key].splice(index, 1);
					break;

				case 'statuses':
					var currentFilters = _.pluck(self.filter[tag.key], 'id');
					var index = currentFilters.indexOf(tag.id);
					self.filter[tag.key].splice(index, 1);
					if (utils.isNotEmptyVal(self.filter.substatus)) {
						self.filter.substatus = removeCancelledSubStatus(self.filter);
					} if (tag.id == '8' && self.filter.include_archived == 1 && tag.key == 'statuses') {
						self.filter.include_archived = 0;
					}
					break;

				//US#8445
				case 'substatus':
					var currentFilters = _.pluck(self.filter[tag.key], 'id');
					var index = currentFilters.indexOf(tag.id);
					self.filter[tag.key].splice(index, 1);
					break;
				case 'dateRange':
					self.filter.settlement_date_start = "";
					self.filter.settlement_date_end = "";
					break;

				case 'settAmountRange':
					self.filter.settlement_amount_start = "";
					self.filter.settlement_amount_end = "";
					break;
				case 'archiveMatters':
					self.filter.include_archived = 0;
					break;

			}

			sessionStorage.setItem("settlementReportFilters", JSON.stringify(self.filter)); //store applied filters
			getSettlementInfo(self.filter);
			self.tags = generateTags(self.filter);
			self.filter.page_num = 1;

		}


		//on changesort selection change the value
		self.applySortByFilter = function (sort_by) {
			self.for = matterType;
			self.selectedSort = sort_by.name;
			self.filter.sort_by = sort_by.value;
			self.filter.page_num = 1;
			self.filter.page_size = page_size;
			//self.filter.sortOrder = sort_by.sortOrder;

			getSettlementInfo(self.filter); // function to invoke helper function
		}



		// filter popup
		function openPopupFilter() {
			var modalInstance = $modal.open({
				templateUrl: 'app/report/allMatterList/filterPopUp/settlementFilterPopup/settlementFilter.html',
				windowClass: 'medicalIndoDialog',
				controller: 'settlementFilterCtrl as settlementFilterCtrl',
				backdrop: 'static',
				keyboard: false,
				resolve: {
					filter: function () {
						return self.filter;
					},
					tags: function () {
						return self.tags;
					}

				}

			});
			//on close of popup
			modalInstance.result.then(function (filterObj) {
				self.filter = filterObj.filter;
				self.filter.page_num = 1;
				self.filter.page_size = page_size;
				self.tags = generateTags(self.filter);
				sessionStorage.setItem("settlementReportFilters", JSON.stringify(self.filter)); //store applied filters
				getSettlementInfo(self.filter); // function to invoke helper function

			}, function () {

			});

		}

		function generateTags(filtersTags) {
			var tags = [];
			if (utils.isNotEmptyVal(self.filter.matter_id)) {
				var tagObj = {

					key: 'matter',
					id: self.filter.matter_id.matterid,
					value: 'Matter: ' + self.filter.matter_id.name
				};
				tags.push(tagObj);
			}

			if (utils.isNotEmptyVal(self.filter.payment_status)) {
				_.forEach(self.filter.payment_status, function (status) {
					var tagObj = {
						key: 'payment_status',
						id: status.id,
						value: 'Payment Status: ' + status.name
					};
					tags.push(tagObj);
				});

			}

			if (utils.isNotEmptyVal(self.filter.negotiation_status)) {
				_.forEach(self.filter.negotiation_status, function (status) {
					var tagObj = {
						key: 'negotiation_status',
						id: status.id,
						value: 'Negotiation Status: ' + status.name
					};
					tags.push(tagObj);
				});

			}

			if (utils.isNotEmptyVal(self.filter.statuses)) {
				_.forEach(self.filter.statuses, function (item) {
					var tagObj = {
						key: 'statuses',
						id: item.id,
						value: 'Status: ' + item.name
					};
					tags.push(tagObj);
				});
			}
			if (utils.isNotEmptyVal(self.filter.substatus)) {
				_.forEach(self.filter.substatus, function (item) {
					var tagObj = {
						key: 'substatus',
						id: item.id,
						value: 'Sub-Status: ' + item.name
					};
					tags.push(tagObj);

				});
			}


			if (utils.isNotEmptyVal(self.filter.settlement_date_start) && (utils.isNotEmptyVal(self.filter.settlement_date_end))) {
				var filterObj = {
					key: 'dateRange',
					value: 'Settlement Date Range :' + moment.unix(self.filter.settlement_date_start).utc().format('MM/DD/YYYY') +
						' to: ' + moment.unix(self.filter.settlement_date_end).utc().format('MM/DD/YYYY')
				};
				tags.push(filterObj);
			}


			if (utils.isNotEmptyVal(self.filter.settlement_amount_start) && (utils.isNotEmptyVal(self.filter.settlement_amount_end))) {
				var filterObj = {
					key: 'settAmountRange',
					value: 'Settlement Amount Range : ' + currencyFormat(self.filter.settlement_amount_start) +
						' to ' + currencyFormat(self.filter.settlement_amount_end)
				};
				tags.push(filterObj);

			}
			if (self.filter.include_archived == 1) {
				var tagObj = {
					key: 'archiveMatters',
					value: 'Include Archived Matters'
				};
				tags.push(tagObj);
			}

			return tags;
		}


		//headers of grid 
		self.clxGridOptions = {
			headers: settlementHelper.getGridHeaders()
		}


		function scrollReachedBottom() {
			if (self.initSettlementLimit <= self.total) {
				self.initSettlementLimit = self.initSettlementLimit + initSettlimit;
			}
		}

		function scrollReachedTop() {
			self.initSettlementLimit = initSettlimit;
		}
		function getStatusFilter(filters, masterList) {
			var statusFilter;
			var filter = angular.copy(filters);
			if (utils.isNotEmptyVal(filter.statuses)) {
				var status = _.pluck(filter.statuses, 'id');
				var substatus = utils.isNotEmptyVal(filter.substatus) ? _.pluck(filter.substatus, 'id') : [];
				var getStatusAndSubStatus = [];
				//get status along with sub status in an array
				_.forEach(status, function (item) {
					_.forEach(masterList.statuses, function (currentItem) {
						if (item == currentItem.id) {
							getStatusAndSubStatus.push(currentItem);
						}
					})
				})
				//push selected status and all substatus in an array
				var selectedSubStatus = [];
				_.forEach(getStatusAndSubStatus, function (currentItem) {
					_.forEach(currentItem["sub-status"], function (currentI) {
						var subStatusDetail = angular.copy(currentI);
						subStatusDetail.statusid = currentItem.id;
						subStatusDetail.statusname = currentItem.name;
						selectedSubStatus.push(subStatusDetail);
					})
				})
				//push selected substatus in an array
				var selectedStatusAndSubStatus = [];
				_.forEach(substatus, function (item) {
					_.forEach(selectedSubStatus, function (currentItem) {
						if (item == currentItem.id) {
							selectedStatusAndSubStatus.push(currentItem);
						}
					})

				});

				var getstatusIds = _.pluck(selectedStatusAndSubStatus, 'statusid');
				var diffStatus = _.difference(status, getstatusIds);
				if (diffStatus.length > 0) {
					_.forEach(diffStatus, function (item) {
						var evens = _.filter(masterList.statuses, function (rec) { return rec.id == item; });
						selectedStatusAndSubStatus.push({
							id: '',
							name: '',
							statusid: evens[0].id,
							statusname: evens[0].name
						})
					})

				}

				//combine status with sub-status in an array
				var group_to_values = selectedStatusAndSubStatus.reduce(function (obj, item) {
					obj[item.statusid] = obj[item.statusid] || [];
					obj[item.statusid].push(item.id);
					return obj;
				}, {});

				statusFilter = Object.keys(group_to_values).map(function (key) {
					return { statusid: key, subStatusid: group_to_values[key] };
				});


				_.forEach(statusFilter, function (item) {
					item.subStatusid = item.subStatusid.toString();
				})
			}
			return statusFilter;
		}
		/**
		 * set filters object  to get settlement information 
		 */
		function setSettInfoParams(filters, masterDataObj) {
			var filtersApplied = {};
			filtersApplied.matter_status = utils.isNotEmptyVal(filters.statuses) ? JSON.stringify(getStatusFilter(filters, masterDataObj)) : "";
			// filtersApplied.matterSubStatus = utils.isNotEmptyVal(filters.substatus) ? _.pluck(filters.substatus, "id") : '';
			//filtersApplied.matterSubStatus = "[]";
			filtersApplied.payment_status = utils.isNotEmptyVal(filters.payment_status) ? _.pluck(filters.payment_status, "name") : '';
			filtersApplied.sort_by = filters.sort_by;
			filtersApplied.settlement_date_start = utils.isNotEmptyVal(filters.settlement_date_start) ? filters.settlement_date_start : '';
			filtersApplied.settlement_date_end = utils.isNotEmptyVal(filters.settlement_date_end) ? filters.settlement_date_end : '';
			filtersApplied.settlement_amount_start = utils.isNotEmptyVal(filters.settlement_amount_start) ? filters.settlement_amount_start : '';
			filtersApplied.settlement_amount_end = utils.isNotEmptyVal(filters.settlement_amount_end) ? filters.settlement_amount_end : '';
			filtersApplied.matter_id = utils.isNotEmptyVal(filters.matter_id) ? filters.matter_id.matterid : '';
			filtersApplied.page_size = filters.page_size == 'all' ? 'all' : page_size;
			filtersApplied.page_num = 1;
			filtersApplied.include_archived = filters.include_archived;
			self.initSettlementLimit = initSettlimit;
			filtersApplied.negotiation_status = utils.isNotEmptyVal(filters.negotiation_status) ? (_.pluck(filters.negotiation_status, "id")).toString() : '';
			return filtersApplied;
		}


		function getSettlementInfo(filters) {

			var postSettParams = setSettInfoParams(filters, masterDataObj);
			settlementHelper.getSettlementData(postSettParams)
				.then(function (response) {

					_.forEach(response[0].data, function (settlement, index) {
						response[0].data[index].date_of_incidence = (settlement.date_of_incidence == '0') ? '-' : (utils.isEmptyVal(settlement.date_of_incidence)) ?
							'' : moment.unix(settlement.date_of_incidence).utc().format("MM/DD/YYYY");
						response[0].data[index].settlement_date = (settlement.settlement_date == '0') ? '-' : (utils.isEmptyVal(settlement.settlement_date)) ?
							'' : moment.unix(settlement.settlement_date).utc().format("MM/DD/YYYY");
						//US#8309
						response[0].data[index].retainer_date = (settlement.retainer_date == '0') ? '' : (utils.isEmptyVal(settlement.retainer_date)) ?
							'' : moment.unix(settlement.retainer_date).utc().format("MM/DD/YYYY");
						response[0].data[index].closing_statement_date = (settlement.closing_statement_date == '0') ? '' : (utils.isEmptyVal(settlement.closing_statement_date)) ?
							'' : moment.unix(settlement.closing_statement_date).utc().format("MM/DD/YYYY");
					});
					self.settlementDataList = response[0].data;
					self.total = response[1].count;
					self.dataReceived = true;

				})
		}

		//print

		function print() {
			settlementHelper.printSettlementInfo(self.settlementDataList, self.filter, self.selectedSort);
		}

		//export

		function downloadSettlementInfo() {
			settlementHelper.exportSettlementInfo(self.filter, self.selectedSort, masterDataObj);
		}
	}




})(angular);


// helper functin

(function (angular) {
	angular.module('cloudlex.report').
		factory('settlementHelper', settlementHelper);

	settlementHelper.$inject = ['$http', '$q', 'reportConstant', 'globalConstants', '$filter'];

	function settlementHelper($http, $q, reportConstant, globalConstants, $filter) {

		//Empty tag array
		var tags = [];

		function getParams(params) {
			var querystring = "";
			angular.forEach(params, function (value, key) {
				if (key == 'matter_status' || key == 'payment_status') {
					querystring += key + "=" + value;
					querystring += "&";
				} else {
					querystring += key + "=" + value;
					querystring += "&";
				}
			});
			return querystring.slice(0, querystring.length - 1);
		}
		return {
			getGridHeaders: getGridHeaders,
			getSettlementData: getSettlementData,

			printSettlementInfo: _printSettlementInfo,
			exportSettlementInfo: _exportSettlementInfo,

		}

		//print helper
		function _printSettlementInfo(data, filter, sort) {
			var getSettlementDom = getSettlementDomData(data, filter, sort)
		}

		/**
		 * User Story 8115 Settlemnt report 
		 */
		function downloadSettlementInfoObj(popUpFilters) {
			var status = popUpFilters.matter_status;
			delete popUpFilters.matter_status;
			var tz = utils.getTimezone();
			var timeZone = moment.tz.guess();
			var url = reportConstant.RESTAPI.exportsettlementreport;
			url += '?matter_status=' + encodeURIComponent((status)) + '&' + getParams(popUpFilters) + '&tz=' + timeZone;
			var deferred = $q.defer();
			$http({
				url: url,
				method: "GET",
				responseType: 'arraybuffer',
			})
				.then(function (response) {
					deferred.resolve(response);
				}, function (error) {
					deferred.reject(error);
				});

			return deferred.promise;
		}


		//export
		function _exportSettlementInfo(filter, sort, masterDataObj) {
			var FilteObj = getExportObj(filter, masterDataObj);
			downloadSettlementInfoObj(FilteObj).then(function (response) {
				utils.downloadFile(response.data, "Settlement Report.xlsx", response.headers("Content-Type"));
			});
		}

		// Print fun
		function getSettlementDomData(data, filter, sort) {
			var headers = getGridHeaders();
			var headersForPrint = getHeadersForPrint(headers);
			var filtersForPrint = getFiltersParamsPrint(filter, sort);
			var printDom = printSettlemntInfo(data, headersForPrint, filtersForPrint, sort);
			window.open().document.write(printDom);
		}

		// getExportObj
		function getStatusFilter(filters, masterList) {
			var statusFilter;
			var filter = angular.copy(filters);
			if (utils.isNotEmptyVal(filter.statuses)) {
				var status = _.pluck(filter.statuses, 'id');
				var substatus = utils.isNotEmptyVal(filter.substatus) ? _.pluck(filter.substatus, 'id') : [];
				var getStatusAndSubStatus = [];
				//get status along with sub status in an array
				_.forEach(status, function (item) {
					_.forEach(masterList.statuses, function (currentItem) {
						if (item == currentItem.id) {
							getStatusAndSubStatus.push(currentItem);
						}
					})
				})
				//push selected status and all substatus in an array
				var selectedSubStatus = [];
				_.forEach(getStatusAndSubStatus, function (currentItem) {
					_.forEach(currentItem["sub-status"], function (currentI) {
						var subStatusDetail = angular.copy(currentI);
						subStatusDetail.statusid = currentItem.id;
						subStatusDetail.statusname = currentItem.name;
						selectedSubStatus.push(subStatusDetail);
					})
				})
				//push selected substatus in an array
				var selectedStatusAndSubStatus = [];
				_.forEach(substatus, function (item) {
					_.forEach(selectedSubStatus, function (currentItem) {
						if (item == currentItem.id) {
							selectedStatusAndSubStatus.push(currentItem);
						}
					})

				});

				var getstatusIds = _.pluck(selectedStatusAndSubStatus, 'statusid');
				var diffStatus = _.difference(status, getstatusIds);
				if (diffStatus.length > 0) {
					_.forEach(diffStatus, function (item) {
						var evens = _.filter(masterList.statuses, function (rec) { return rec.id == item; });
						selectedStatusAndSubStatus.push({
							id: '',
							name: '',
							statusid: evens[0].id,
							statusname: evens[0].name
						})
					})

				}

				//combine status with sub-status in an array
				var group_to_values = selectedStatusAndSubStatus.reduce(function (obj, item) {
					obj[item.statusid] = obj[item.statusid] || [];
					obj[item.statusid].push(item.id);
					return obj;
				}, {});

				statusFilter = Object.keys(group_to_values).map(function (key) {
					return { statusid: key, subStatusid: group_to_values[key] };
				});


				_.forEach(statusFilter, function (item) {
					item.subStatusid = item.subStatusid.toString();
				})
			}
			return statusFilter;
		}
		function getExportObj(filter, masterDataObj) {
			var filterObj = {};
			if (filter.statuses) {
				filterObj.matter_status = utils.isNotEmptyVal(filter.statuses) ? JSON.stringify(getStatusFilter(filter, masterDataObj)) : "";
			} else {
				filterObj.matter_status = '';
			}


			if (filter.matter_id) {
				filterObj['matter_id'] = filter.matter_id.matterid;
			} else {
				filterObj['matter_id'] = '';
			}

			if (filter.payment_status) {
				filterObj['payment_status'] = utils.isNotEmptyVal(filter.payment_status) ? (_.pluck(filter.payment_status, "name").join()) : '';;
			} else {
				filterObj['payment_status'] = '';
			}

			if (filter.negotiation_status) {
				filterObj['negotiation_status'] = utils.isNotEmptyVal(filter.negotiation_status) ? (_.pluck(filter.negotiation_status, "id").join()) : '';;
			} else {
				filterObj['negotiation_status'] = '';
			}

			filterObj['sort_by'] = filter.sort_by;
			filterObj['settlement_date_start'] = (filter.settlement_date_start) ? moment(filter.settlement_date_start) : '';
			filterObj['settlement_date_end'] = (filter.settlement_date_end) ? moment(filter.settlement_date_end) : '';
			filterObj['settlement_amount_start'] = (filter.settlement_amount_start) ? filter.settlement_amount_start : '';
			filterObj['settlement_amount_end'] = (filter.settlement_amount_end) ? filter.settlement_amount_end : '';
			filterObj['include_archived'] = filter.include_archived;
			return filterObj;
		}

		// filter object for print

		function getFiltersParamsPrint(filter, sort) {
			var filterObj = {};
			if (filter.statuses) {
				filterObj['Matter Status'] = utils.isNotEmptyVal(filter.statuses) ? (_.pluck(filter.statuses, "name").join()) : '';

			} else {
				filterObj['Matter Status'] = '';
			}
			if (filter.substatus) {
				filterObj['Matter Sub-Status'] = utils.isNotEmptyVal(filter.substatus) ? (_.pluck(filter.substatus, "name").join(', ')) : '';

			} else {
				filterObj['Matter Sub-Status'] = '';
			}
			if (filter.matter_id) {
				filterObj['Matter Name'] = filter.matter_id.name;
			} else {
				filterObj['Matter Name'] = '';
			}

			if (filter.payment_status) {
				filterObj['Payment Status'] = utils.isNotEmptyVal(filter.payment_status) ? (_.pluck(filter.payment_status, "name").join()) : '';;
			} else {
				filterObj['Payment Status'] = '';
			}

			if (filter.negotiation_status) {
				filterObj['Negotiation Status'] = utils.isNotEmptyVal(filter.negotiation_status) ? (_.pluck(filter.negotiation_status, "name").join()) : '';;
			} else {
				filterObj['Negotiation Status'] = '';
			}

			filterObj['Sort By'] = sort;
			// set from and to date for print view...
			var from = (filter.settlement_date_start) ? moment.unix(filter.settlement_date_start).utc().format('MM/DD/YYYY') : '-';
			var to = (filter.settlement_date_end) ? moment.unix(filter.settlement_date_end).utc().format('MM/DD/YYYY') : '-'
			filterObj['Settlement Date Range'] = 'from ' + from + ' to ' + to;

			var fromAmount = (filter.settlement_amount_start) ? filter.settlement_amount_start : '';
			var toAmount = (filter.settlement_amount_end) ? filter.settlement_amount_end : ''
			filterObj['Settlement Amount Range'] = utils.isNotEmptyVal(fromAmount && toAmount) ? '' + currencyFormat(fromAmount) + ' to ' + currencyFormat(toAmount) : '-';

			if (filter.include_archived == 1) {
				filterObj['Include Archived Matters'] = 'Yes';
			}
			return filterObj
		}

		// function currencyFormat(num) {
		// 	return "$" + parseFloat(num).toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
		// }
		function currencyFormat(num) {
			num = num.toString();
			return "$" + num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
		}

		// printdom
		function printSettlemntInfo(data, headers, filters, sort) {
			var html = "<html><title>Settlement Report</title>";
			html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
			html += "<style>table tr { page-break-inside: always; }  </style>";
			html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}tbody {display:table-row-group;}</style>";
			html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
			html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Settlement Report</h1><div></div>";
			html += "<body>";
			html += "<div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";
			html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
			html += "<tr>";
			angular.forEach(filters, function (val, key) {
				html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;' class='labelTxt'>";
				html += "<label><strong>" + key + " : </strong></label>";
				html += "<span style='padding:5px; '>  " + utils.removeunwantedHTML(val) + '</span>';
				html += "</div>";
			});
			html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
			html += "</tr>";
			html += '<tr>';
			angular.forEach(headers, function (head) {
				if (head.prop == 'settlement_amount' || head.prop == 'total_paid' || head.prop == 'outstanding_amount' || head.prop == 'demand' || head.prop == 'offer') {
					html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right;'>" + head.display + "</th>";
				} else {
					html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + head.display + "</th>";
				}
			});
			html += '</tr>';


			angular.forEach(data, function (settlementObj) {
				html += '<tr>';
				angular.forEach(headers, function (head) {
					settlementObj[head.prop] = (_.isNull(settlementObj[head.prop]) || angular.isUndefined(settlementObj[head.prop]) || utils.isEmptyString(settlementObj[head.prop])) ? "" : utils.removeunwantedHTML(settlementObj[head.prop]);
					if (head.prop == 'settlement_amount' || head.prop == 'total_paid') {
						html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse;padding:5px; text-align:right'>" + (utils.isNotEmptyVal(settlementObj[head.prop]) ? $filter('currency')(settlementObj[head.prop], '$', 2) : '-') + "</td>";
					} else if (head.prop == 'outstanding_amount') {
						html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse;padding:5px; text-align:right'>" + (utils.isNotEmptyVal(settlementObj[head.prop]) ? currencyFormat(parseFloat(settlementObj[head.prop]).toFixed(2)) : '-') + "</td>";
					}
					else if (head.prop == 'offer' || head.prop == 'demand') {
						html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse;padding:5px; text-align:right'>" + (utils.isNotEmptyVal(settlementObj[head.prop]) ? $filter('currency')(settlementObj[head.prop], '$', 2) : '-') + "</td>";
					}
					else {
						html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + settlementObj[head.prop] + "</td>";
					}
				})
				html += '</tr>'
			})

			return html;

		}


		//extract headers

		function getHeadersForPrint(headers) {
			var displayHeaders = [];
			_.forEach(headers, function (head) {
				_.forEach(head.field, function (field) {
					displayHeaders.push({
						prop: field.prop,
						display: field.printDisplay
					});
				})
			})
			return displayHeaders
		}

		function getSettlementData(filters) {
			var removeStatusKey = filters.matter_status;
			delete filters.matter_status;
			var url = reportConstant.RESTAPI.settlement + "?" + getParams(filters);
			url += '&matter_status=' + encodeURIComponent((removeStatusKey));
			var deferred = $q.defer();
			$http({
				url: url,
				method: "GET",
				//withCredentials: true
			}).success(function (response) {
				deferred.resolve(response);
			});
			return deferred.promise;
		}

		function getGridHeaders() {
			return [

				{
					field: [{
						prop: 'matter_name',
						href: {
							link: '#/matter-overview',
							paramProp: ['matter_id']
						},
						printDisplay: 'Matter Name'
					}, {
						prop: 'file_number', //US#8309 add fields on report
						label: 'File# ',
						printDisplay: 'File Number'
					}],
					displayName: 'Matter name, File Number',
					dataWidth: '12'
				}, {
					field: [{
						prop: 'plaintiff_name',
						printDisplay: 'Plaintiff Name'
					}],
					displayName: 'Plaintiff Name',
					dataWidth: '8'
				}, {
					field: [{
						prop: 'date_of_incidence',
						printDisplay: 'Date of Incident'
					}],
					displayName: 'Date of Incident',
					dataWidth: '8'
				}, {
					field: [{
						prop: 'status_name',
						template: 'bold',
						printDisplay: 'Status'
					}, {
						prop: 'sub_status_name',
						filter: 'replaceByDash',
						printDisplay: 'Sub-status'
					}],
					displayName: 'Status, Sub-status',
					dataWidth: '8'
				}, {
					field: [{
						prop: 'settlement_amount',
						html: '<span ng-if="data.settlement_amount" tooltip="${{ (data.settlement_amount) ? (data.settlement_amount | number:2) : (data.settlement_amount) }}" tooltip-append-to-body="true" tooltip-placement="bottom">${{ (data.settlement_amount) ? (data.settlement_amount | number:2) : data.settlement_amount }}</span>',
						printDisplay: 'Settlement Amount',
					}, {
						prop: 'settlement_date',
						printDisplay: 'Settlement Date',
					}],
					displayName: 'Settlement Amount & Settlement Date',
					dataWidth: '12'
				}, {
					field: [{
						prop: 'total_paid',
						html: '<span ng-if="data.total_paid" tooltip="${{(data.total_paid) ? (data.total_paid | number:2) : (data.total_paid) }}" tooltip-append-to-body="true" tooltip-placement="bottom">${{ (data.total_paid) ? (data.total_paid | number:2) : (data.total_paid) }}</span>',
						printDisplay: 'Total Paid',
					}],
					displayName: 'Total Paid',
					dataWidth: '8'
				}, {
					field: [{
						prop: 'outstanding_amount',
						html: '<span ng-if="data.outstanding_amount" tooltip="${{ (data.outstanding_amount) ? (data.outstanding_amount | number:2) : (data.outstanding_amount) }}" tooltip-append-to-body="true" tooltip-placement="bottom">${{(data.outstanding_amount) ? (data.outstanding_amount | number:2) : (data.outstanding_amount)}}</span>',
						printDisplay: 'Outstanding Amount',
					}],
					displayName: 'Outstanding Amount',
					dataWidth: '8'
				}, {
					field: [{
						prop: 'retainer_num', //US#8309 add fields on report
						html: '<span ng-if="data.retainer_num" tooltip="{{data.retainer_num }}" tooltip-append-to-body="true" tooltip-placement="bottom">{{data.retainer_num}}</span>',
						printDisplay: 'Retainer Number',
					}, {
						prop: 'retainer_date',
						printDisplay: 'Retainer Date'
					}],
					displayName: 'Retainer Number, Retainer Date',
					dataWidth: '8'
				}, {
					field: [{
						prop: 'closing_statement_no', //US#8309 add fields on report
						html: '<span ng-if="data.closing_statement_no" tooltip="{{data.closing_statement_no }}" tooltip-append-to-body="true" tooltip-placement="bottom">{{data.closing_statement_no}}</span>',
						printDisplay: 'Closing Statement Number'
					}, {
						prop: 'closing_statement_date',
						printDisplay: 'Closing Statement Date'
					}],
					displayName: 'Closing Statement Number, Closing Statement Date',
					dataWidth: '10'
				 }, 
				//{
				// 	field: [{
				// 		prop: 'claim_representative_name',
				// 		printDisplay: 'Claim Representative',
				// 	}],
				// 	displayName: 'Claim Representative',
				// 	dataWidth: '9'
				// },
				{
					field: [{
						prop: 'negotiation_status',
						printDisplay: 'Status',
					}],
					displayName: 'Status',
					dataWidth: '7'
				}, 
				{
					field: [{
						prop: 'demand',
						html: '<span ng-if="data.demand" tooltip="${{ (data.demand) ? (data.demand | number:2) : (data.demand) }}" tooltip-append-to-body="true" tooltip-placement="left">${{ (data.demand) ? (data.demand | number:2) : (data.demand) }}</span>',
						printDisplay: 'Demand',
					}, {
						prop: 'offer',
						html: '<span ng-if="data.offer" tooltip="${{ (data.offer) ? (data.offer | number:2) : (data.offer) }}" tooltip-append-to-body="true" tooltip-placement="left">${{ (data.offer) ? (data.offer | number:2) : (data.offer) }}</span>',
						printDisplay: 'Offer',
					}],
					displayName: 'Demand & Offer',
					dataWidth: '11'
				}


			]
		}


	}



})(angular);
