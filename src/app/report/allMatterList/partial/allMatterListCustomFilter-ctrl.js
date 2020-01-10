angular.module('cloudlex.report')
    .controller('AllMatterListCustomFilterCtrl', ['$scope', '$modalInstance', 'params', 'reportFactory', function ($scope, $modalInstance, params, reportFactory) {
        $scope.dataModel = {};
        $scope.viewModel = {};
        $scope.selectionModel = {};
        $scope.selectionModel.multiFilters = {};
        $scope.selectionModel.multiFilters.statuses = [];
        $scope.selectionModel.multiFilters.substatus = [];
        $scope.selectionModel.multiFilters.categories = [];
        $scope.selectionModel.multiFilters.types = [];
        $scope.selectionModel.multiFilters.subtypes = [];
        $scope.selectionModel.multiFilters.venues = [];
        $scope.selectionModel.multiFilters.leadAttorney = '';
        $scope.selectionModel.multiFilters.staff = '';
        $scope.selectionModel.multiFilters.paralegal = '';

        //get selected filter in {id,name} format
        $scope.viewModel.masterList = params.masterData;


        $scope.selectionModel.multiFilters = setFilters();

        var self = this;
        self.init = function () {
            getUserInfo();
        };

        $scope.viewModel.statuses = moveBlankToBottom(getFilterValues(params.masterData, 'statuses'));
        removeAllFromStatusFilter($scope.selectionModel.multiFilters.statuses);
        $scope.viewModel.type = moveBlankToBottom(getFilterValues(params.masterData, 'type'));
        $scope.viewModel.categories = moveBlankToBottom(getFilterValues(params.masterData, 'category'));

        function getUserInfo() {
            var promesa = reportFactory.getUserInfo();
            promesa.then(function (dataLists) {
                $scope.viewModel.userList = dataLists;
                _.forEach(dataLists, function (data) {

                    console.log("User data - ", data);
                    if (angular.isDefined(data.staffonly)) {
                        $scope.viewModel.staff = moveBlankToBottom(getFilterValueForUSer(data, 'staffonly'));
                    } else if (angular.isDefined(data.attorny)) {
                        $scope.viewModel.leadAttorney = moveBlankToBottom(getFilterValueForUSer(data, 'attorny'));
                    } else if (angular.isDefined(data.paralegal)) {
                        $scope.viewModel.paralegal = moveBlankToBottom(getFilterValueForUSer(data, 'paralegal'));
                    }
                })

            }, function (reason) {
            });
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
                filters[filter] = filterVal.map(function (item) {
                    return {
                        id: item.id,
                        name: item.name || item.desc
                    }
                });
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

        function getFilterValueForUSer(dataList, filter) {
            return dataList[filter].map(function (item) {
                return {
                    id: item.uid,
                    name: item.name
                };
            });
        }

        $scope.ok = function (selectionModel) {
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

        self.init();


    }]);