angular.module('cloudlex.components')
    .controller('FilterDialogCtrl', ['$scope', '$modalInstance', 'matterFactory', 'params', 'notification-service',
        function ($scope, $modalInstance, matterFactory, params, notificationService) {

            var substatusPopulated = false;
            var subtypesPopulated = false;

            (function () {
                $scope.dataModel = {};
                $scope.viewModel = {};
                $scope.matterFilters = {};
                $scope.selectionModel = {};
                $scope.selectionModel.multiFilters = {};
                $scope.selectionModel.multiFilters.statuses = [];
                $scope.statusCase = '';
                $scope.selectionModel.multiFilters.substatus = [];
                $scope.selectionModel.multiFilters.categories = [];
                $scope.selectionModel.multiFilters.types = [];
                $scope.selectionModel.multiFilters.subtypes = [];
                $scope.selectionModel.multiFilters.venues = [];
                $scope.selectionModel.multiFilters.lawtypes = [];
                $scope.selectionModel.multiFilters.jurisdictions = null;//US#7123
                $scope.checkVenues = checkVenues;
                $scope.tagList = params.tags;
                $scope.statusPresent = params.status;
                $scope.setVenues = setVenues;
                $scope.isDatesValid = isDatesValid;
                $scope.includeReferredOut = 0;
                var selectedFilter = sessionStorage.getItem('matterListSelectionModel');
                var checkJurisdiction = JSON.parse(selectedFilter);
                if (checkJurisdiction.multiFilters.jurisdictions != "") {
                    setVenues(checkJurisdiction.multiFilters.jurisdictions);
                }
                $scope.checkVenue = false;
                //get selected filter in {id,name} format
                $scope.viewModel.masterList = params.masterData;

                //US#7123
                $scope.viewModel.jurisdictions = getFilterValues(params.masterData, 'jurisdictions');
                $scope.viewModel.statuses = moveBlankToBottom(getFilterValues(params.masterData, 'statuses'));
                removeAllFromStatusFilter($scope.selectionModel.multiFilters.statuses);
                $scope.viewModel.type = moveBlankToBottom(getFilterValues(params.masterData, 'type'));
                $scope.viewModel.categories = moveBlankToBottom(getFilterValues(params.masterData, 'category'));
                $scope.viewModel.lawtypes = moveBlankToBottom(getFilterValues(params.masterData, 'law-types'));

                $scope.selectionModel.multiFilters = setFilters();

                utils.isNotEmptyVal($scope.selectionModel.multiFilters.statuses) ?
                    getSubstatuses($scope.selectionModel.multiFilters.statuses) : angular.noop();

                utils.isNotEmptyVal($scope.selectionModel.multiFilters.types) ?
                    getSubtypes($scope.selectionModel.multiFilters.types[0]) : angular.noop();

                matterFactory.getAllUsers()
                    .then(function (res) {
                        var attorneys = res.data[1].attorny;
                        $scope.attorneys = attorneys.map(function (att) {
                            var attName = att.name + ' ' + att.lname;
                            att.attName = attName;
                            return att;
                        });
                        var staffs = res.data[4].staffonly;
                        $scope.staffs = staffs.map(function (att) {
                            var attName = att.name + ' ' + att.lname;
                            att.attName = attName;
                            return att;
                        });
                        var paralegals = res.data[3].paralegal;
                        $scope.paralegals = paralegals.map(function (att) {
                            var attName = att.name + ' ' + att.lname;
                            att.attName = attName;
                            return att;
                        });
                    });

            })();

            $scope.$watch(function () {
                if ((($scope.selectionModel.multiFilters.categories.length > 0) || utils.isNotEmptyVal($scope.selectionModel.multiFilters.doiEnd) || utils.isNotEmptyVal($scope.selectionModel.multiFilters.doiStart)
                    || utils.isNotEmptyVal($scope.selectionModel.multiFilters.includeReferredOut)
                    || utils.isNotEmptyVal($scope.selectionModel.multiFilters.lawtypes) || utils.isNotEmptyVal($scope.selectionModel.multiFilters.statusCase) || utils.isNotEmptyVal($scope.selectionModel.multiFilters.staff) || utils.isNotEmptyVal($scope.selectionModel.multiFilters.paralegal)
                    || ($scope.selectionModel.multiFilters.statuses.length > 0) || ($scope.selectionModel.multiFilters.substatus.length > 0) || utils.isNotEmptyVal($scope.selectionModel.multiFilters.leadAttorney) || utils.isNotEmptyVal($scope.selectionModel.multiFilters.attorney)
                    || ($scope.selectionModel.multiFilters.subtypes.length > 0) || ($scope.selectionModel.multiFilters.types.length > 0) || ($scope.selectionModel.multiFilters.venues.length > 0)) || ($scope.tagList.length > 0) || $scope.statusPresent) {
                    $scope.enableApply = false;
                } else {
                    $scope.enableApply = true;
                }
                return $scope.enableApply;
            })

            function isDatesValid() {
                if ($('#DOIstartDateError').css("display") == "block" ||
                    $('#DOIendDateError').css("display") == "block") {
                    return true;
                }
                else {
                    return false;
                }
            }

            function removeAllFromStatusFilter(statuses) {
                var allStatus = _.find(statuses, function (status) {
                    return status.id === 'all';
                });

                if (angular.isDefined(allStatus)) {
                    var ids = _.pluck(statuses, 'id');
                    var index = ids.indexOf(allStatus.id);
                    statuses.splice(index, 1);
                }
            }
            //To enable Apply button on selection of venue US#7123
            function checkVenues(data) {
                if (data.id == undefined || utils.isNotEmptyVal(data.id)) {
                    $scope.checkVenue = false;
                }
            }
            //US#7123
            function setVenues(jurisdictionId) {
                $scope.checkVenue = true;
                $scope.selectionModel.multiFilters.venues = [];
                if (utils.isEmptyVal(jurisdictionId)) {
                    return;
                }
                //  $scope.venue = [];
                var venue = _.filter(params.masterData.venues, function (venue) {
                    return venue.jurisdiction_id === jurisdictionId.id;
                });
                $scope.venues = _.sortBy(venue, 'name');
            }
            function moveBlankToBottom(array) {
                //make sure array has {id,name} objects
                var values = _.pluck(array, 'name');
                var index = values.indexOf('');
                utils.moveArrayElement(array, index, array.length - 1);
                return array;
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
                //US#7123
                filters.jurisdictions = utils.isEmptyVal(filters.jurisdictions) ? null : utils.isEmptyObj(filters.jurisdictions) ? null : filters.jurisdictions;
                $scope.matterFilters.statusFilter = utils.isNotEmptyVal(filters.statuses) ? filters.statuses : null;
                $scope.matterFilters.types = utils.isNotEmptyVal(filters.types) ? filters.types[0] : null;
                if (utils.isNotEmptyVal($scope.matterFilters.types)) {
                    $scope.matterFilters.types.name = utils.isNotEmptyVal($scope.matterFilters.types.name) ? $scope.matterFilters.types.name : '';
                }
                if (utils.isNotEmptyVal($scope.matterFilters.statusFilter)) {
                    _.forEach($scope.matterFilters.statusFilter, function (item, index) {
                        _.forEach(filters.statuses, function (currentItem) {
                            if (item.id == 'all' || item.id == 'stalled') {
                                $scope.matterFilters.statusFilter.splice(index, 1)
                            } else {
                                item.name = utils.isNotEmptyVal(item.name) ? item.name : item.desc;
                            }

                            // US#5557 Filter Changes for Stalled  .. Start
                            if (item.desc == 'Stalled') {
                                $scope.statusCase = item.desc;
                                $scope.includeReferredOut = 1;
                                item = '';
                                updatedStatuses();
                            }
                            else if (filters.statusCase == 'Stalled' && angular.isUndefined(item.desc) && currentItem.name != "Closed") {
                                $scope.statusCase = filters.statusCase;
                                $scope.includeReferredOut = 1;
                                updatedStatuses();
                            }
                            //..End 
                        })
                    })
                } else if (filters.statusCase == 'Stalled') {
                    $scope.statusCase = filters.statusCase;
                    $scope.includeReferredOut = 1;
                    updatedStatuses();
                }

                return filters;
            }

            function getFilterValues(masterList, filter) {
                return masterList[filter].map(function (item) {
                    return {
                        id: item.id,
                        name: item.name
                    };
                });
            }

            function updatedStatuses() {
                $scope.viewModel.statuses = _.filter($scope.viewModel.statuses, function (status) {
                    return status.name != 'Referred out' && status.name != 'Closed';
                });
            }

            $scope.statusSelected = function (status) {
                $scope.selectionModel.multiFilters.statuses = [];
                // if (substatusPopulated) {
                //     $scope.selectionModel.multiFilters.substatus = [];
                // }
                $scope.selectionModel.multiFilters.statuses = status;
                getSubstatuses(status);
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

            function getSubstatuses(status) {
                //get selected statuses substatus
                if (utils.isEmptyVal(status)) {
                    $scope.substatuses = [];
                    return;
                }
                var statuses = params.masterData.statuses;
                var selectedStatus = [];
                _.forEach(status, function (item) {
                    _.forEach(statuses, function (currentItem) {
                        if (item.id == currentItem.id) {
                            _.forEach(currentItem["sub-status"], function (currentI) {
                                currentI.statusname = currentItem.name;
                                currentI.statusid = currentItem.id
                                selectedStatus.push(currentI);
                            })
                        }
                    })
                })
                $scope.substatuses = selectedStatus;
            }

            $scope.openCalendar = function ($event) {
                $event.stopPropagation();
            }

            $scope.ok = function (selectionModel) {
                _.forEach(selectionModel.subtypes, function (data) {
                    if (utils.isEmptyVal(data.name)) {
                        data.name = "{Blank}";
                    }
                });
                _.forEach(selectionModel.substatus, function (data) {
                    if (utils.isEmptyVal(data.name)) {
                        data.name = "{Blank}";
                    }
                });
                if (utils.isNotEmptyVal(selectionModel.substatus)) {
                    var selectedSubStatus = [];
                    _.forEach(selectionModel.statuses, function (item) {
                        _.forEach(selectionModel.substatus, function (currentItem) {
                            if (item.id == currentItem.statusid) {
                                selectedSubStatus.push(currentItem);
                            }
                        })
                    })
                    selectionModel.substatus = selectedSubStatus;
                }

                var selectedmodelcopy = angular.copy(selectionModel);
                selectedmodelcopy.doiStart = (selectedmodelcopy.doiStart) ? utils.getUTCTimeStamp(selectedmodelcopy.doiStart) : '';
                selectedmodelcopy.doiEnd = (selectedmodelcopy.doiEnd) ? utils.getUTCTimeStampEndDay(selectedmodelcopy.doiEnd) : '';
                selectedmodelcopy.statusCase = $scope.statusCase;
                selectedmodelcopy.includeReferredOut = selectedmodelcopy.includeReferredOut;

                var isValid = setDOIRange(selectedmodelcopy);
                if (isValid) {
                    $modalInstance.close(selectedmodelcopy);
                } else {
                    notificationService.error("Invalid date range.");
                }
            };

            function setDOIRange(filters) {

                if ((utils.isEmptyVal(filters.doiEnd) && utils.isEmptyVal(filters.doiStart))) {
                    return true
                }

                if ((utils.isEmptyVal(filters.doiEnd) && utils.isNotEmptyVal(filters.doiStart))
                    || (utils.isEmptyVal(filters.doiStart) && utils.isNotEmptyVal(filters.doiEnd))) {
                    return false;
                }
                var end = moment.unix(filters.doiEnd).endOf('day');
                var start = moment.unix(filters.doiStart).startOf('day');

                if (end.isBefore(start)) {
                    return false;
                }
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
                $scope.checkVenue = false;
                //Bug#8316 added this
                $scope.venues = '';
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
