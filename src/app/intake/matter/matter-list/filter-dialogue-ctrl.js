angular.module('intake.components')
    .controller('IntakeFilterDialogCtrl', ['$scope', '$modalInstance', 'params', '$timeout',
        function ($scope, $modalInstance, params, $timeout) {

            var substatusPopulated = false;
            var subtypesPopulated = false;

            (function () {
                $scope.dataModel = {};
                $scope.viewModel = {};
                $scope.matterFilters = {};
                $scope.selectionModel = {};
                $scope.selectionModel.multiFilters = {};
                $scope.selectionModel.multiFilters.intake_status_id = [];
                $scope.selectionModel.multiFilters.intake_sub_status_id = [];
                $scope.selectionModel.multiFilters.intake_category_id = [];
                $scope.selectionModel.multiFilters.intake_type_id = [];
                $scope.selectionModel.multiFilters.intake_sub_type_id = [];
                $scope.selectionModel.multiFilters.user_id = [];

                var selectedFilter = localStorage.getItem('matterListSelectionModel');

                $scope.viewModel.masterList = angular.copy(params.masterData);
                $scope.users = params.users;
                $scope.viewModel.status = moveBlankToBottom(getFilterValues(params.masterData, 'status'));
                $scope.viewModel.substatus = moveBlankToBottom(getFilterValues(params.masterData, 'subStatus'));
                $scope.viewModel.type = moveBlankToBottom(getFilterValues(params.masterData, 'type'));
                $scope.viewModel.subtype = moveBlankToBottom(getFilterValues(params.masterData, 'subType'));
                $scope.viewModel.category = moveBlankToBottom(getFilterValues(params.masterData, 'category'));

                $scope.selectionModel.multiFilters = setFilters();

                var statusFromMasterList = [];
                _.forEach($scope.selectionModel.multiFilters.intake_status_id, function (item) {
                    _.forEach($scope.viewModel.status, function (currentItem) {
                        if (currentItem.id == item) {
                            statusFromMasterList.push(currentItem);
                        }
                    })
                })
                $scope.matterFilters.statusFilter = statusFromMasterList;
                $scope.selectionModel.multiFilters.intake_status_id = statusFromMasterList;

                var typeFromMasterList = [];
                _.forEach($scope.selectionModel.multiFilters.intake_type_id, function (item) {
                    _.forEach($scope.viewModel.type, function (currentItem) {
                        if (currentItem.id == item) {
                            typeFromMasterList.push(currentItem);
                        }
                    })
                })
                $scope.matterFilters.type = typeFromMasterList && typeFromMasterList.length > 0 ? typeFromMasterList[0] : null;
                $scope.selectionModel.multiFilters.intake_type_id = typeFromMasterList;

                var subTypeFromMasterList = [];
                _.forEach($scope.selectionModel.multiFilters.intake_sub_type_id, function (item) {
                    _.forEach($scope.viewModel.subtype, function (currentItem) {
                        if (currentItem.id == item) {
                            subTypeFromMasterList.push(currentItem);
                        }
                    })
                })
                _.forEach(subTypeFromMasterList, function (data) {
                    if (utils.isEmptyVal(data.name)) {
                        data.name = "{Blank}";
                    }
                });
                $scope.selectionModel.multiFilters.subtype = subTypeFromMasterList;

                var catFromMasterList = [];
                _.forEach($scope.selectionModel.multiFilters.intake_category_id, function (item) {
                    _.forEach($scope.viewModel.category, function (currentItem) {
                        if (currentItem.id == item) {
                            catFromMasterList.push(currentItem);
                        }
                    })
                });

                $scope.selectionModel.multiFilters.category = catFromMasterList;

                $timeout(function () {
                    utils.isNotEmptyVal($scope.selectionModel.multiFilters.intake_status_id) ?
                        getSubstatuses($scope.matterFilters.statusFilter) : angular.noop();

                    utils.isNotEmptyVal($scope.selectionModel.multiFilters.intake_type_id) ?
                        getSubtypes($scope.matterFilters.type) : angular.noop();

                    var subStatusFromMasterList = [];
                    _.forEach($scope.selectionModel.multiFilters.intake_sub_status_id, function (item) {
                        _.forEach($scope.substatus, function (currentItem) {
                            if (currentItem.id == item) {
                                subStatusFromMasterList.push(currentItem);
                            }
                        })
                    });
                    $scope.selectionModel.multiFilters.substatus = subStatusFromMasterList;
                }, 1);

            })();

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

            $scope.statusSelected = function (status) {
                $scope.selectionModel.multiFilters.intake_status_id = [];
                $scope.selectionModel.multiFilters.intake_status_id = status;
                $timeout(function () {
                    if (utils.isEmptyVal(status)) {
                        $scope.substatus = [];
                        $scope.selectionModel.multiFilters.intake_sub_status_id = [];
                        $scope.selectionModel.multiFilters.substatus = [];
                    } else {
                        getSubstatuses(status);
                    }
                }, 1);
            }

            $scope.typeSelected = function (type) {
                $scope.selectionModel.multiFilters.intake_type_id = [];
                $scope.selectionModel.multiFilters.subtype = [];
                if (subtypesPopulated) {
                    $scope.selectionModel.multiFilters.intake_sub_type_id = [];
                }
                $scope.selectionModel.multiFilters.intake_type_id.push(type);
                getSubtypes(type);
            }

            function getSubtypes(type) {
                var selectedTyp = _.find(params.masterData.type, function (typ) {
                    return typ.id === type.id;
                });
                selectedTyp['subtype'] = _.sortBy(selectedTyp['subtype'], "name");
                if (angular.isDefined(selectedTyp)) {
                    $scope.subtype = moveBlankToBottom(selectedTyp['subtype']);
                }
                subtypesPopulated = true;
            }

            function getSubstatuses(status) {
                //get selected statuses substatus
                var statuses = angular.copy(params.masterData.status);
                var selectedStatus = [];
                _.forEach(status, function (item) {
                    _.forEach(statuses, function (currentItem) {
                        //Bug#12986
                        var aaray1 = [];
                        if (item.id == currentItem.id) {
                            var lastIndex = currentItem["substatus"].length - 1;
                            _.forEach(currentItem["substatus"], function (currentI, index) {
                                currentI.statusname = currentItem.name;
                                currentI.statusid = currentItem.id
                                //Bug#12986
                                aaray1.push(currentI);
                                if (lastIndex == index) {
                                    aaray1.unshift({
                                        id: 0,
                                        name: "",
                                        statusid: currentItem.id,
                                        statusname: currentItem.name
                                    });
                                }
                            });
                        }
                        selectedStatus = selectedStatus.concat(aaray1);
                    })
                });
                var matchingRec;
                var newSubStatus = [];
                var selectedStatusId = _.pluck(status, "id");

                _.forEach(selectedStatus, function (item) {
                    matchingRec = _.findWhere($scope.substatus, { id: item.id });
                    // if (!matchingRec) { //Bug#12986
                    newSubStatus.push(item);
                    // }
                });
                if (!$scope.substatus) {
                    $scope.substatus = [];
                }
                // if (newSubStatus.length > 0) {
                //     newSubStatus.unshift({
                //         id: 0,
                //         name: "",
                //         statusid: newSubStatus[0].statusid,
                //         statusname: newSubStatus[0].statusname
                //     });
                // }

                $scope.substatus = newSubStatus;
                $scope.substatus = _.filter($scope.substatus, function (rec) {
                    return selectedStatusId.indexOf(rec.statusid) > -1;
                });
                $scope.selectionModel.multiFilters.substatus = _.filter($scope.selectionModel.multiFilters.substatus, function (rec) {
                    return selectedStatusId.indexOf(rec.statusid) > -1;
                });

            }


            $scope.ok = function (selectionModel) {
                _.forEach(selectionModel.subtype, function (data) {
                    if (utils.isEmptyVal(data.name)) {
                        data.name = "{Blank}";
                    }
                });
                _.forEach(selectionModel.substatus, function (data) {
                    if (utils.isEmptyVal(data.name)) {
                        data.name = "{Blank}";
                    }
                });
                // if (utils.isNotEmptyVal(selectionModel.substatus)) {
                //     var selectedSubStatus = [];
                //     _.forEach(selectionModel.status, function (item) {
                //         _.forEach(selectionModel.substatus, function (currentItem) {
                //             if (item.id == currentItem.statusid) {
                //                 selectedSubStatus.push(currentItem);
                //             }
                //         })
                //     })
                //     selectionModel.substatus = selectedSubStatus;
                // }
                selectionModel.intake_sub_status_id = selectionModel.substatus;
                selectionModel.intake_sub_type_id = selectionModel.subtype;
                selectionModel.intake_category_id = selectionModel.category;

                var selectedmodelcopy = angular.copy(selectionModel);
                $modalInstance.close(selectedmodelcopy);
            };

            $scope.showChildOptions = function (item, list) {
                var ids = _.pluck(list, 'id');
                return ids.indexOf(item.id) > -1;
            }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.resetMultiSelectFilter = function () {
                $scope.checkVenue = false;

                _.each($scope.selectionModel.multiFilters, function (val, index) {
                    $scope.selectionModel.multiFilters[index] = $scope.selectionModel.multiFilters[index] instanceof Array ?
                        [] : null;
                });

                _.each(params.masterData.filters, function (val, key) {
                    params.masterData.filters[key] = params.masterData.filters[key] instanceof Array ? [] : null;
                });
                // $scope.selectionModel.multiFilters.user_id = [];
                $scope.matterFilters.statusFilter = null;
                $scope.substatus = [];
                $scope.matterFilters.type = null;
                $scope.subtype = [];
            }

        }]);
