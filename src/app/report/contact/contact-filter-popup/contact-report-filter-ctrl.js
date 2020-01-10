(function (angular) {
    'use strict';

    angular.module('cloudlex.report')
        .controller('ContactReportFilterCtrl', ContactReportFilterCtrl);

    ContactReportFilterCtrl.$inject = ['params', '$modalInstance', 'contactFactory', '$scope'];
    function ContactReportFilterCtrl(params, $modalInstance, contactFactory, $scope) {

        var vm = this, role;
        vm.close = close;
        vm.apply = apply;
        vm.resetFilters = resetFilters;

        vm.selectionModel = {};
        vm.selectionModel.multiFilters = {};
        vm.selectionModel.multiFilters.statuses = [];
        vm.selectionModel.multiFilters.roles = [];

        vm.viewModel = {};
        vm.viewModel.userFilter = {};

        vm.selectionModel.contact = params.filters.contact;
        vm.selectionModel.statuses = params.filters.statuses;
        vm.selectionModel.roles = params.filters.roles;

        vm.tags = params.tags;

        vm.viewModel.masterList = params.masterData;
        vm.getContactForReport = getContactForReport;
        vm.formatTypeaheadDisplayForContactReport = contactFactory.formatTypeaheadDisplay;

        function getContactForReport(contactName) {
            return contactFactory.getContactsByName(contactName)
                .then(function (response) {
                    var data = response.data.contacts;
                    contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
                    contactFactory.setNamePropForContactsOffDrupal(data);
                    return data;
                });
        }

        (function () {
            vm.filter = angular.copy(params.filter);

        })();


        vm.viewModel.statuses = moveBlankToBottom(getFilterValues(params.masterData, 'statuses'));
        vm.viewModel.roles = moveBlankToBottom(getRolesFilterValues(params.masterData, 'matter_contact_roles'));

        function getFilterValues(masterList, filter) {
            return masterList[filter].map(function (item) {
                return {
                    id: item.id,
                    name: item.name
                };
            });
        }
        /**
         * matter_contact_roles has cid and c_role_name attribute
         * @param {*} masterList 
         * @param {*} filter 
         */
        function getRolesFilterValues(masterList, filter) {
            return masterList[filter].map(function (item) {
                return {
                    id: item.cid,
                    name: item.c_role_name
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

        function close() {
            $modalInstance.dismiss();
        }

        $scope.$watch(function () {
            if (vm.selectionModel.statuses.length > 0 || vm.selectionModel.roles.length > 0 || (vm.tags && vm.tags.length > 0)) {
                vm.enableApply = false;
            } else {
                vm.enableApply = true;
            }
        })

        function apply(filter) {
            $modalInstance.close(filter);
        }

        function resetFilters() {
            vm.selectionModel.contact = undefined;
            vm.selectionModel.statuses = [];
            vm.selectionModel.roles = [];
        }
    }

})(angular);