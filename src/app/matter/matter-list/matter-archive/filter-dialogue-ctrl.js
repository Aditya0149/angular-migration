angular.module('cloudlex.components')
    .controller('archivFilterDialogCtrl', ['$scope', '$modalInstance', 'params', 'notification-service',
        function ($scope, $modalInstance, params, notificationService) {

            var substatusPopulated = false;
            var subtypesPopulated = false;

            (function () {
                $scope.dataModel = {};
                $scope.viewModel = {};
                $scope.matterFilters = {};
                $scope.selectionModel = {};
                $scope.selectionModel.multiFilters = {};
                $scope.selectionModel.multiFilters.statuses = [];
                $scope.selectionModel.multiFilters.types = [];
                $scope.selectionModel.multiFilters.subtypes = [];
                $scope.selectionModel.multiFilters.venues = [];
                $scope.selectionModel.multiFilters.archivalStatus = [];
                $scope.selectionModel.multiFilters.lawtypes = [];
                $scope.groupjurisdictions = groupjurisdictions;
                $scope.isDatesValid = isDatesValid;
                $scope.tagList = params.tags;
                $scope.viewModel.archivalStat = [
                    { id: 1, name: "Archived" },
                    { id: 2, name: "Archiving" },
                    { id: 3, name: "Retrieving" }
                ];


                //get selected filter in {id,name} format
                $scope.viewModel.masterList = params.masterData;
                $scope.jurisdictions = [];

                $scope.viewModel.type = moveBlankToBottom(getFilterValues(params.masterData, 'type'));
                $scope.viewModel.categories = moveBlankToBottom(getFilterValues(params.masterData, 'category'));
                $scope.viewModel.lawtypes = moveBlankToBottom(getFilterValues(params.masterData, 'law-types'));

                $scope.selectionModel.multiFilters = setFilters();

                utils.isNotEmptyVal($scope.selectionModel.multiFilters.types) ?
                    getSubtypes($scope.selectionModel.multiFilters.types[0]) : angular.noop();


            })();

            function isDatesValid() {
                if ($('#DOASstartDateError').css("display") == "block" ||
                    $('#DOAEendDateError').css("display") == "block") {
                    return true;
                }
                else {
                    return false;
                }
            }

            function moveBlankToBottom(array) {
                //make sure array has {id,name} objects
                var values = _.pluck(array, 'name');
                var index = values.indexOf('');
                utils.moveArrayElement(array, index, array.length - 1);
                return array;
            }

            _.forEach(params.masterData.jurisdictions, function (jurisdiction) {
                $scope.jurisdictions.push(jurisdiction.name);
            })
            $scope.jurisdictions = $scope.jurisdictions.sort();

            var jurisdictionName = "";

            function groupjurisdictions(venue) {
                if (utils.isNotEmptyVal(venue.jurisdiction_id)) {
                    _.forEach(params.masterData.jurisdictions, function (jurisdiction) {
                        if (jurisdiction.id == venue.jurisdiction_id) {
                            jurisdictionName = jurisdiction.name;
                        }
                    })
                    return jurisdictionName;
                }
            }

            function setFilters() {
                var filters = angular.copy(params.filters);
                angular.forEach(filters, function (filterVal, filter) {
                    if (filter instanceof Array) {
                        filters[filter] = filterVal.map(function (item) {
                            return {
                                id: item.id,
                                name: utils.isEmptyVal(item.name) ? item.desc : item.name
                            }
                        });
                    }
                });

                $scope.matterFilters.types = utils.isNotEmptyVal(filters.types) ? filters.types[0] : null;
                if (utils.isNotEmptyVal($scope.matterFilters.types)) {
                    $scope.matterFilters.types.name = utils.isNotEmptyVal($scope.matterFilters.types.name) ? $scope.matterFilters.types.name : '';
                }


                return filters;
            }

            $scope.typeSelected = function (type) {
                $scope.selectionModel.multiFilters.types = [];
                if (subtypesPopulated) {
                    $scope.selectionModel.multiFilters.subtypes = [];
                }
                $scope.selectionModel.multiFilters.types.push(type);
                getSubtypes(type);
            }

            function getSubtypes(type) {
                var selectedTyp = _.find(params.masterData.type, function (typ) {
                    return typ.id === type.id;
                });
                selectedTyp['sub-type'] = _.sortBy(selectedTyp['sub-type'], "name");
                if (angular.isDefined(selectedTyp)) {
                    $scope.subtypes = moveBlankToBottom(selectedTyp['sub-type']);
                }
                subtypesPopulated = true;
            }

            function getFilterValues(masterList, filter) {
                return masterList[filter].map(function (item) {
                    return {
                        id: item.id,
                        name: item.name
                    };
                });
            }


            $scope.openCalendar = function ($event) {
                $event.stopPropagation();
            }

            $scope.$watch(function () {
                if ($scope.selectionModel.multiFilters.archivalStatus.length > 0 || $scope.selectionModel.multiFilters.types.length > 0 ||
                    $scope.selectionModel.multiFilters.subtypes.length > 0 || $scope.selectionModel.multiFilters.categories.length > 0 ||
                    $scope.selectionModel.multiFilters.lawtypes.length > 0 || $scope.selectionModel.multiFilters.venues.length > 0 ||
                    utils.isNotEmptyVal($scope.selectionModel.multiFilters.dateArchivedStart) || utils.isNotEmptyVal($scope.selectionModel.multiFilters.dateArchivedEnd) ||
                    utils.isNotEmptyVal($scope.selectionModel.multiFilters.dateClosedStart) || utils.isNotEmptyVal($scope.selectionModel.multiFilters.dateClosedEnd) || $scope.tagList.length > 0) {
                    $scope.enableApply = false;
                } else {
                    $scope.enableApply = true;
                }
            })

            $scope.ok = function (selectionModel) {
                var selectedmodelcopy = angular.copy(selectionModel);
                selectedmodelcopy.dateArchivedStart = (selectedmodelcopy.dateArchivedStart) ? selectedmodelcopy.dateArchivedStart : '';
                selectedmodelcopy.dateArchivedEnd = (selectedmodelcopy.dateArchivedEnd) ? selectedmodelcopy.dateArchivedEnd : '';

                selectedmodelcopy.dateClosedStart = (selectedmodelcopy.dateClosedStart) ? selectedmodelcopy.dateClosedStart : '';
                selectedmodelcopy.dateClosedEnd = (selectedmodelcopy.dateClosedEnd) ? selectedmodelcopy.dateClosedEnd : '';

                var flagisValid = false;

                var isValid = setDOARange(selectedmodelcopy);
                var isvalidDOC = setDOCRange(selectedmodelcopy);
                if (isValid && isvalidDOC) {
                    $modalInstance.close(selectedmodelcopy);
                } else {
                    flagisValid = true;
                    notificationService.error("Invalid date range.");
                }

                if (!flagisValid) {
                    if (isvalidDOC && isValid) {
                        $modalInstance.close(selectedmodelcopy);
                    } else {
                        notificationService.error("Invalid date range.");
                    }
                }
            };

            function setDOARange(filters) {
                var dateArchivedStart = moment(filters.dateArchivedStart).unix();
                var dateArchivedEnd = moment(filters.dateArchivedEnd).unix();
                if ((utils.isEmptyVal(dateArchivedEnd) && utils.isEmptyVal(dateArchivedStart))) {
                    return true
                }

                if ((utils.isEmptyVal(dateArchivedEnd) && utils.isNotEmptyVal(dateArchivedStart))
                    || (utils.isEmptyVal(dateArchivedStart) && utils.isNotEmptyVal(dateArchivedEnd))) {
                    return false;
                }

                var end = moment.unix(dateArchivedEnd).endOf('day');
                var start = moment.unix(dateArchivedStart).startOf('day');

                if (end.isBefore(start)) {
                    return false;
                }

                filters.dateArchivedEnd = utils.getUTCTimeStampEndDay(filters.dateArchivedEnd);
                filters.dateArchivedStart = utils.getUTCTimeStamp(filters.dateArchivedStart);

                return true;
            }

            function setDOCRange(filters) {
                var dateClosedStart = moment(filters.dateClosedStart).unix();
                var dateClosedEnd = moment(filters.dateClosedEnd).unix();
                if ((utils.isEmptyVal(dateClosedEnd) && utils.isEmptyVal(dateClosedStart))) {
                    return true
                }

                if ((utils.isEmptyVal(dateClosedEnd) && utils.isNotEmptyVal(dateClosedStart))
                    || (utils.isEmptyVal(dateClosedStart) && utils.isNotEmptyVal(dateClosedEnd))) {
                    return false;
                }

                var end = moment.unix(dateClosedEnd).endOf('day');
                var start = moment.unix(dateClosedStart).startOf('day');

                if (end.isBefore(start)) {
                    return false;
                }

                filters.dateClosedEnd = utils.getUTCTimeStampEndDay(filters.dateClosedEnd);
                filters.dateClosedStart = utils.getUTCTimeStamp(filters.dateClosedStart);

                return true;
            }

            $scope.showChildOptions = function (item, list) {
                var ids = _.pluck(list, 'id');
                return ids.indexOf(item.id) > -1;
            }

            $scope.isOptionChecked = function (option, listname) {
                var listIds = _.pluck(params.filters[listname], 'id');
                return listIds.indexOf(option.id) > -1;
            }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.resetMultiSelectFilter = function () {
                _.each($scope.selectionModel.multiFilters, function (val, index) {
                    $scope.selectionModel.multiFilters[index] = $scope.selectionModel.multiFilters[index] instanceof Array ?
                        [] : null;
                });

                _.each(params.filters, function (val, key) {
                    params.filters[key] = params.filters[key] instanceof Array ? [] : null;
                });

                $scope.matterFilters.statusFilter = null;
                $scope.substatuses = [];
                $scope.matterFilters.types = null;
                $scope.subtypes = [];
            }

        }]);