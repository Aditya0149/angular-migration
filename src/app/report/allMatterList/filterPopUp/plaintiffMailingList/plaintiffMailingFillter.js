(function (angular) {

    'use strict';
    angular.module('cloudlex.report').
        controller('plaintiffMailingFillter', plaintiffMailingFillter);
    plaintiffMailingFillter.$inject = ['$modalInstance', 'matterFactory', 'plaintiffMailingListHelper', 'masterData', 'filter', 'notification-service', '$scope', 'tags'];


    function plaintiffMailingFillter($modalInstance, matterFactory, plaintiffMailingListHelper, masterData, filter, notificationService, $scope, tags) {
        var self = this;
        self.cancel = cancel;
        self.apply = apply;
        self.resetFilters = resetFilters;
        self.searchMatters = searchMatters;
        self.formatTypeaheadDisplay = formatTypeaheadDisplay;
        var matters = [];
        self.states = [];
        var masterData = masterData.getMasterData();
        self.states = masterData.states;
        self.tags = tags;
        self.enableArchivedCheck = false;
        //  console.log('self.states ',self.states );
        function cancel() {
            $modalInstance.dismiss('cancel');
        }


        function init() {
            self.filter = angular.copy(filter);
            self.viewModel = {};

        }
        init();

        //reset filters
        function resetFilters() {
            self.filter.matter_id = '';
            self.filter.plaintiff_id = '';
            self.plaintiffData = '';
            self.filter.state = '';
            self.filter.had_surgery = '';
            self.filter.is_active = '';
            self.filter.is_closed = '';
            self.filter.include_archived = 0;
            self.enableArchivedCheck = false;
        }
        $scope.$watch(function () {
            if ((self.filter && utils.isNotEmptyVal(self.filter.matter_id)) ||
                (self.filter && utils.isNotEmptyVal(self.filter.plaintiff_id)) ||
                (self.filter && utils.isNotEmptyVal(self.filter.state)) || (self.filter.include_archived == 1) ||
                (self.filter.had_surgery != 0) || (self.filter.is_active != 0) ||
                (self.filter.is_closed != 0) || (self.tags && self.tags.length > 0)) {
                self.enableApply = false;
            } else {
                self.enableApply = true;
            }

            if (self.filter.is_active == '1') {
                self.enableArchivedCheck = true;
            }
            if (self.filter.is_active == '0') {
                self.enableArchivedCheck = false;
            }
            if (self.filter.is_closed == '1' && self.filter.is_active == '1') {
                self.enableArchivedCheck = false;
            }
            if (self.filter.is_closed == '0' && self.filter.is_active == '1') {
                self.enableArchivedCheck = true;
                self.filter.include_archived = 0;
            }
        })

        //when we submit popup collect the scope object
        function apply(filter) {
            if (typeof (filter.matter_id) === 'undefined' || filter.matter_id == null || filter.matter_id == "") {
                filter.matter_id = '';
                filter.plaintiff_id = '';
            }

            if (typeof (filter.had_surgery) !== 'undefined' && filter.had_surgery != null && filter.had_surgery == 0) {
                filter.had_surgery = '';
            }

            if (typeof (filter.is_active) !== 'undefined' && filter.is_active != null && filter.is_active == 0) {
                filter.is_active = '';
            }

            if (typeof (filter.is_closed) !== 'undefined' && filter.is_closed != null && filter.is_closed == 0) {
                filter.is_closed = '';
            }

            //Bug#6515 Validation for matter
            if (utils.isNotEmptyVal(filter.matter_id.matterid) || filter.matter_id == '') {
                filter.matter_id.matterid;
            } else {
                return notificationService.error("Invalid Matter Selected");
            }
            $modalInstance.close({ tags: [], filter: filter });
            //console.log('submit popup', filter); //		
        }


        /* Formate the matter id and name */
        function formatTypeaheadDisplay(matter) {
            if (angular.isUndefined(matter) || utils.isEmptyString(matter)) {
                return undefined;
            }
            else {
                getPlaintiffs(matter.matterid);
                return matter.name
            }
        }

        function getPlaintiffs(matter_id) {
            plaintiffMailingListHelper.getPlaintiffs(matter_id).then(function (response) {
                self.plaintiffData = response
            });
        }

        $scope.$watch(function () {
            return self.filter.matter_id;
        }, function (newValue) {
            if (angular.isUndefined(newValue) || utils.isEmptyString(newValue)) {
                self.filter.plaintiff_id = '';
                self.plaintiffData = {
                    "response": {
                        "data": []
                    }
                };

            }
        });


        function searchMatters(matterName) {
            if (matterName) {
                return matterFactory.searchMatters(matterName).then(
                    function (response) {
                        matters = response.data;
                        return response.data;
                    }, function (error) {
                        notificationService.error('Matters not loaded');
                    });
            }
        }


    }



})(angular);
