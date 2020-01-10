(function (angular) {

    'use strict';
    angular.module('cloudlex.report').
        controller('matterValuationFillter', matterValuationFillter);
    matterValuationFillter.$inject = ['$modalInstance', 'masterData', 'filter', 'notification-service', '$scope', 'tags', 'userList'];


    function matterValuationFillter($modalInstance, masterData, filter, notificationService, $scope, tags, userList) {
        var self = this;
        self.cancel = cancel;
        self.apply = apply;
        self.resetFilters = resetFilters;
        self.states = [];
        var masterData = masterData.getMasterData();
        self.states = masterData.states;
        self.tags = tags;


        //  console.log('self.states ',self.states );
        function cancel() {
            $modalInstance.dismiss('cancel');
        }

        function getFilterValueForUSer(dataList, filter) {
            return dataList[filter].map(function (item) {
                return {
                    id: item.uid,
                    name: item.name
                };
            });
        }

        function moveBlankToBottom(array) {
            //make sure array has {id,name} objects
            var values = _.pluck(array, 'name');
            var index = values.indexOf('');
            utils.moveArrayElement(array, index, array.length - 1);
            return array;
        }


        function init() {
            self.filter = angular.copy(filter);
            self.filter.paralegal = angular.copy(self.filter.paralegalCopy);
            self.filter.attorney = angular.copy(self.filter.attorneyCopy);
            self.filter.minimumAmount = angular.copy(self.filter.lowlimitCopy);
            self.filter.maximumAmount = angular.copy(self.filter.maxlimitCopy);
            self.viewModel = {};
            if (angular.isDefined(userList)) {
                _.forEach(userList, function (data) {

                    if (angular.isDefined(data.staffonly)) {
                        self.viewModel.staff = moveBlankToBottom(getFilterValueForUSer(data, 'staffonly'));
                    } else if (angular.isDefined(data.attorny)) {
                        self.viewModel.attorney = moveBlankToBottom(getFilterValueForUSer(data, 'attorny'));
                    } else if (angular.isDefined(data.paralegal)) {
                        self.viewModel.paralegal = moveBlankToBottom(getFilterValueForUSer(data, 'paralegal'));
                    }
                })
            }

        }
        init();

        //reset filters
        function resetFilters() {
            //self.filter.matterId = '';
            self.filter.attorney = '';
            self.filter.paralegal = '';
            self.filter.minimumAmount = '';
            self.filter.maximumAmount = '';
            self.filter.attorneyCopy = '';
            self.filter.paralegalCopy = '';
            self.filter.lowlimitCopy = '';
            self.filter.maxlimitCopy = '';
            self.filter.includeArchived = 0;
        }
        $scope.$watch(function () {
            if (
                (self.filter && utils.isNotEmptyVal(self.filter.attorney)) ||
                (self.filter && utils.isNotEmptyVal(self.filter.paralegal)) ||
                (self.filter && utils.isNotEmptyVal(self.filter.minimumAmount)) || (self.filter.includeArchived == 1) ||
                (self.filter && utils.isNotEmptyVal(self.filter.maximumAmount)) || (self.tags && self.tags.length > 0)) {
                self.enableApply = false;
            } else {
                self.enableApply = true;
            }
        })

        //when we submit popup collect the scope object
        function apply(filter) {
            var filtercopy = angular.copy(filter);
            if (_.isObject(filtercopy.attorney)) {
                filtercopy.attorneyCopy = angular.copy(filtercopy.attorney);
                filtercopy.attorney = filtercopy.attorney.id;
            }
            if (_.isObject(filtercopy.paralegal)) {
                filtercopy.paralegalCopy = angular.copy(filtercopy.paralegal);
                filtercopy.paralegal = filtercopy.paralegal.id;
            }
            if (parseInt(filtercopy.minimumAmount) > parseInt(filtercopy.maximumAmount)) {
                notificationService.error("Matter valuation limit range is incorrect.");
                return;
            }
            filtercopy.lowlimitCopy = angular.copy(filtercopy.minimumAmount);
            filtercopy.maxlimitCopy = angular.copy(filtercopy.maximumAmount);

            $modalInstance.close({ tags: [], filter: filtercopy });
        }


    }



})(angular);
