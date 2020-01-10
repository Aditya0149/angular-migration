angular.module('cloudlex.motion')
    .controller('MotionFilterCtrl', ['$scope', '$modalInstance', 'params', function ($scope, $modalInstance, params) {
        $scope.dataModel = {};
        $scope.viewModel = {};
        $scope.selectionModel = {};
        $scope.selectionModel.multiFilters = {};
        /* $scope.selectionModel.multiFilters.statuses = [];
         $scope.selectionModel.multiFilters.substatus = [];
         $scope.selectionModel.multiFilters.categories = [];
         $scope.selectionModel.multiFilters.types = [];
         $scope.selectionModel.multiFilters.subtypes = [];
         $scope.selectionModel.multiFilters.venues = [];*/
        $scope.selectionModel.multiFilters.motion_statuses = [];
        $scope.selectionModel.multiFilters.motion_types = [];

        //get selected filter in {id,name} format
        $scope.viewModel.masterList = params.masterData;
        $scope.selectionModel.multiFilters = setFilters();
        /* $scope.viewModel.statuses = moveBlankToBottom(getFilterValues(params.masterData, 'statuses'));
         removeAllFromStatusFilter($scope.selectionModel.multiFilters.statuses);
         $scope.viewModel.type = moveBlankToBottom(getFilterValues(params.masterData, 'type'));
         $scope.viewModel.categories = moveBlankToBottom(getFilterValues(params.masterData, 'category'));*/
        /* $scope.selectionModel.multiFilters = setMotionStatusFilters();
         $scope.selectionModel.multiFilters = setMotionTypeFilters();*/
        $scope.viewModel.motion_statuses = moveBlankToBottom(getFilterValues(params.masterData, 'motion_statuses'));
        $scope.viewModel.motion_types = moveBlankToBottom(getFilterValues(params.masterData, 'motion_types'));




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


        function moveBlankToBottom(array) {
            //make sure array has {id,name} objects
            var values = _.pluck(array, 'name');
            var index = values.indexOf('');
            utils.moveArrayElement(array, index, array.length - 1);
            return array;
        }

        function setFilters() {
            var filters = angular.copy(params.filters);
            if (!(filters.defaultFilter == true || filters.defaultFilter == false)) {
                angular.forEach(filters, function (filterVal, filter) {
                    filters[filter] = filterVal.map(function (item) {
                        if (filter == 'motion_statuses') {
                            if (item.id == "8") {
                                return {
                                    id: item.id,
                                    name: ""
                                }
                            }
                        }
                        if (filter == 'motion_types') {
                            if (item.id == "10") {
                                return {
                                    id: item.id,
                                    name: ""
                                }
                            }
                        }
                        return {
                            id: item.id,
                            name: item.name || item.desc
                        }
                    });
                });


            }

            return filters;
        }

        function getFilterValues(masterList, filter) {
            var statusObj = {};
            return masterList[filter].map(function (item) {
                return {
                    id: item.id,
                    name: item.name
                };
            });
        }

        /*function setMotionStatusFilters() {
            var filters = angular.copy(params.filters);
            angular.forEach(filters, function (filterVal, filter) {
                filters[filter] = filterVal.map(function (item) {
                    return {
                        motion_statusid: item.motion_statusid,
                        motion_status_name: item.motion_status_name
                    }
                });
            });

            return filters;
        }*/

        /*function setMotionTypeFilters() {
            var filters = angular.copy(params.filters);
            angular.forEach(filters, function (filterVal, filter) {
                filters[filter] = filterVal.map(function (item) {
                    return {
                        motion_typeid: item.motion_typeid,
                        motion_type_name: item.motion_type_name
                    }
                });
            });
            return filters;
        }*/


        /*function getMotionStatusFilter(masterList, filter) {
            return masterList[filter].map(function (item) {
                return {
                    motion_statusid: item.motion_statusid,
                    motion_status_name: item.motion_status_name
                };
            });
        }*/

        /*function getMotionTypeFilter(masterList, filter) {
            return masterList[filter].map(function (item) {
                return {
                    motion_typeid: item.motion_typeid,
                    motion_type_name: item.motion_type_name
                };
            });
        }*/

        $scope.ok = function (selectionModel) {
            $scope.defaultFlag = false;
            $scope.counter = 1;
            $modalInstance.close(selectionModel);
        };

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
                $scope.selectionModel.multiFilters[index] = [];
            });

            _.each(params.filters, function (val, index) {
                params.filters[index] = [];
            });
        }

    }]);