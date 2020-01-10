(function (angular) {

    'use strict';
    angular.module('cloudlex.timeline').
        controller('timelineFillterCtrl', timelineFillterCtrl);
    timelineFillterCtrl.$inject = ['$modalInstance', 'masterData', 'filter', 'notification-service', '$scope', 'contactFactory', 'tags'];


    function timelineFillterCtrl($modalInstance, masterData, filter, notificationService, $scope, contactFactory, tags) {
        var self = this;
        self.cancel = cancel;
        self.apply = apply;
        self.resetFilters = resetFilters;
        self.isDateValid = isDateValid;
        self.openCalender = openCalender;
        self.getFormattedDate = getFormattedDate;
        self.tagList = (tags) ? tags : [];
        var matters = [];

        var masterData = masterData.getMasterData();


        self.activities = [{ id: 1, name: 'Status Change' },
        { id: 2, name: 'Note Updated' },
        { id: 10, name: 'Note Added' },
        { id: 3, name: 'Calendar Entry Added / Updated ' },
        { id: 4, name: 'Document Uploaded' },
        { id: 5, name: 'Document Deleted' },
        { id: 6, name: 'Calendar Entry Deleted' },
        { id: 7, name: 'Note Deleted' },//Bug#7198 Add activity name
        { id: 8, name: 'Document Updated' },//US-9137
        { id: 9, name: 'Document Moved' }];




        function cancel() {
            $modalInstance.dismiss('cancel');
        }

        contactFactory.getUsersList()
            .then(function (users) {
                self.users = contactFactory.getFlatUserList(users);
            });


        function init() {
            self.filter = angular.copy(filter);
            self.filter.start_date = (self.filter.start_date) ? getFormattedDate(self.filter.start_date) : '';
            self.filter.end_date = (self.filter.end_date) ? getFormattedDate(self.filter.end_date) : '';

            self.viewModel = {};

        }
        init();


        // convert date timestamp to MM/DD/YYYY format...
        function getFormattedDate(epoch) {
            var formdate = new Date(epoch * 1000);
            formdate = moment(formdate).format('MM/DD/YYYY');
            return formdate;
        }

        // $event bind with date incurred datepicker...
        function openCalender($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }
        //reset filters
        function resetFilters() {
            self.filter.activity_filter = '';
            self.filter.updated_by_filter = '';
            self.filter.created_by_filter = '';
            self.filter.start_date = ""; // set blank start date
            self.filter.end_date = ""; // set blank end date
        }

        function isDateValid() {
            if ($('#timelineStartDateErr').css("display") == "block" ||
                $('#timelineEndDateErr').css("display") == "block") {
                return true;
            }
            else {
                return false;
            }
        }


        $scope.$watch(function () {
            if (utils.isNotEmptyVal(self.filter.activity_filter) ||
                utils.isNotEmptyVal(self.filter.updated_by_filter) ||
                utils.isNotEmptyVal(self.filter.created_by_filter) ||
                utils.isNotEmptyVal(self.filter.start_date) ||
                utils.isNotEmptyVal(self.filter.end_date) || self.tagList && self.tagList.length > 0) {
                self.enableApply = false;
            } else {
                self.enableApply = true;
            }
        })

        //when  submit popup collect the scope object
        function apply(filter) {
            var filtercopy = angular.copy(filter);
            if (filtercopy) {
                // convert into timestamp format...
                filtercopy.start_date = (filtercopy.start_date) ? moment(filtercopy.start_date).unix() : '';

                filtercopy.end_date = setStartEndDate((filtercopy.end_date) ? moment(filtercopy.end_date).unix() : '');
            }

            if (utils.isNotEmptyVal(filtercopy)) {
                if ((utils.isEmptyString(filtercopy.start_date) && utils.isNotEmptyString(filtercopy.end_date)) || (utils.isNotEmptyString(filtercopy.start_date) && utils.isEmptyString(filtercopy.end_date))) {
                    notificationService.error('Invalid date range.');
                    return;
                } else if (filtercopy.start_date > filtercopy.end_date) {
                    notificationService.error('End date cannot be less than start date.');
                    return;
                }
            }


            $modalInstance.close({ tags: [], filter: filtercopy });

        }

        function setStartEndDate(dateSel) {
            if (utils.isEmptyVal(dateSel)) {
                return dateSel;
            }
            else {
                var date = moment.unix(dateSel).endOf('day');
                date = date.utc();
                date = date.toDate();
                date = new Date(date);
                date = moment(date.getTime()).unix();
                return date;
            }
        }

    }



})(angular);