(function (angular) {

    angular.module('cloudlex.report').controller('SolFilterCtrl', ['$modalInstance',
        'params', 'notification-service', 'matterFactory', 'matterEventsReportHelper',
        function ($modalInstance, params, notificationService, matterFactory, matterEventsReportHelper) {
            var vm = this;

            vm.apply = apply;
            vm.searchMatters = searchMatters;
            vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
            vm.resetFilters = resetFilters;
            vm.cancel = cancel;
            vm.openCalender = openCalender;
            vm.setDates = setDates;
            vm.isDatesValid = isDatesValid;
            vm.setComplied = setComplied;
            (function () {
                vm.showApplyButton = true;
                vm.viewModel = {};
                vm.compliedTypes = [{ label: "Complied", value: 1 }, { label: "Not Complied", value: 0 }, { label: "All", value: 2 }];
                vm.complied = 2; // set default complied type
                if (utils.isNotEmptyVal(params.filter)) {
                    vm.viewModel.filter = params.filter;
                }
                showDays();
            })();

            //US:5149 complied filter change
            function setComplied(param) {
                vm.viewModel.filter.complied = param;
            }

            function openCalender($event) {
                $event.preventDefault();
                $event.stopPropagation();
            };

            function cancel() {
                $modalInstance.dismiss('cancel');
            };

            function isDatesValid() {
                if ($('#solnolstartDateErr').css("display") == "block" ||
                    $('#solnolendDateErr').css("display") == "block") {
                    return true;
                }
                else {
                    return false;
                }
            }

            function apply(filter) {

                if (typeof (filter.matterId) === 'undefined' || filter.matterId == null) {
                    filter.matterId = '';
                }

                //Validation for matter
                if (utils.isNotEmptyVal(filter.matterId.matterid) || filter.matterId == '') {
                    filter.matterId.matterid;
                } else {
                    return notificationService.error("Invalid Matter Selected");
                }

                var filtercopy = angular.copy(filter);
                if (filtercopy) {
                    var start = (filtercopy.s) ? moment(filtercopy.s).unix() : '';
                    var end = (filtercopy.e) ? moment(filtercopy.e).endOf('day').unix() : '';
                    filtercopy.complied = filtercopy.complied;
                }

                if ((utils.isEmptyString(start) && utils.isNotEmptyString(end)) || (utils.isNotEmptyString(start) && utils.isEmptyString(end))) {
                    notificationService.error('Invalid date range.');
                    return;
                } else if (start > end) {
                    notificationService.error('End date cannot be less than start date.');
                    return;
                }


                filtercopy.s = (filtercopy.s) ? utils.getUTCTimeStamp(filtercopy.s) : '';
                filtercopy.e = (filtercopy.e) ? utils.getUTCTimeStampEndDay(moment(filtercopy.e)) : '';

                $modalInstance.close({ tags: [], filter: filtercopy });
            }

            function resetFilters() {
                vm.viewModel.noofdays = 0;
                vm.viewModel.filter = undefined;
                if (sessionStorage.getItem("reportTypeFlag") == "SOL") {
                    vm.viewModel.filter = { 'complied': 2, 'selectedReport': true };
                } else if (sessionStorage.getItem("reportTypeFlag") == "NOC") {
                    vm.viewModel.filter = { 'complied': 2, 'selectedReport': true };
                }
            }

            function showDays() {
                var filtercopy = angular.copy(vm.viewModel.filter);
                filtercopy.s = moment(filtercopy.s).unix();
                filtercopy.e = moment(filtercopy.e).unix();
                vm.viewModel.noofdays = getDays(filtercopy.s, filtercopy.e);
            }

            function setDates(changeProp, datediv) {
                var dateformate = /^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/;
                var datestring = $(datediv).val();
                if (dateformate.exec(datestring)) {
                    var filterdates = angular.copy(vm.viewModel.filter);
                    filterdates.s = (filterdates.s) ? moment(filterdates.s).unix() : '';
                    filterdates.e = (filterdates.e) ? moment(filterdates.e).endOf('day').unix() : '';
                    vm.viewModel.noofdays = getDays(filterdates.s, filterdates.e);
                }

            }

            function getDays(start, end) {
                if (utils.isNotEmptyVal(start) && utils.isNotEmptyVal(end)) {
                    var start = moment.unix(start);
                    var end = moment.unix(end);
                    if (end.diff(start, 'days', true) < 0) {
                        return 0;
                    } else {
                        return end.diff(start, 'days');
                    }
                }
                return 0;
            }

            function searchMatters(matterName) {
                if (matterName) {
                    return matterFactory.searchMatters(matterName).then(
                        function (response) {
                            // matters = response.data;
                            return response.data;
                        }, function (error) {
                            notificationService.error('Matters not loaded');
                        });
                }
            }

            /* Formate the matter id and name */
            function formatTypeaheadDisplay(matter) {
                if (angular.isUndefined(matter) || utils.isEmptyString(matter)) {
                    return '';
                }
                else {
                    getPlaintiffs(matter.matterid);
                    return matter.name
                }
            }

            function getPlaintiffs(matterId) {
                matterEventsReportHelper.getPlaintiffs(matterId).then(function (response) {
                    // console.log(response);
                    self.plaintiffData = response

                });
            }

        }]);

})(angular);
