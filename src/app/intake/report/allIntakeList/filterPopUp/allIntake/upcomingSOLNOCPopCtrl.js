(function (angular) {

    angular.module('intake.report').controller('IntakeSolFilterCtrl', ['$modalInstance',
        'params', 'notification-service', 'matterEventsReportHelper', 'intakeNotesDataService',
        function ($modalInstance, params, notificationService, matterEventsReportHelper, intakeNotesDataService) {
            var vm = this;

            vm.apply = apply;
            vm.resetFilters = resetFilters;
            vm.cancel = cancel;
            vm.openCalender = openCalender;
            vm.searchMatters = searchMatters;
            vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
            vm.setDates = setDates;
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

            function apply(filter) {
                if (filter.intakeId) {
                    if (filter.intakeId.intakeId) {
                        filter.intakeId.intakeId;
                    } else {
                        return notificationService.error("Invalid Lead Name Selected");
                    }
                }
                var filtercopy = angular.copy(filter);
                var start = (filtercopy.s) ? moment(filtercopy.s).unix() : '';
                var end = (filtercopy.e) ? moment(filtercopy.e).endOf('day').unix() : '';
                if (filtercopy) {
                    filtercopy.s = (filtercopy.s) ? utils.getUTCTimeStamp(filtercopy.s) : '';
                    filtercopy.e = (filtercopy.e) ? utils.getUTCTimeStampEndDay(moment(filtercopy.e)) : '';
                    // filtercopy.e = (filtercopy.e) ? moment(filtercopy.e).endOf('day').unix() : '';
                    filtercopy.complied = filtercopy.complied;
                }


                if ((utils.isEmptyString(start) && utils.isNotEmptyString(end)) || (utils.isNotEmptyString(start) && utils.isEmptyString(end))) {
                    notificationService.error('Invalid date range.');
                    return;
                } else if (start > end) {
                    notificationService.error('End date cannot be less than start date.');
                    return;
                }
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
                vm.viewModel.noofdays = getDays(vm.viewModel.filter);
            }

            function setDates(changeProp) {
                var filterdates = angular.copy(vm.viewModel.filter);
                if (utils.isNotEmptyVal(filterdates)) {
                    if (utils.isNotEmptyVal(filterdates.s) && utils.isNotEmptyVal(filterdates.e)) {

                        switch (changeProp) {
                            case 'start':
                                var start = utils.getTimestampStart(filterdates.s);
                                filterdates.s = start;
                                break;
                            case 'end':
                                var end = utils.getTimestampEnd(filterdates.e);
                                filterdates.e = end;
                                break;
                        }

                    }
                }
                vm.viewModel.noofdays = getDays(filterdates);
            }

            function getDays(filterdates) {
                if (utils.isNotEmptyVal(filterdates)) {
                    if (utils.isNotEmptyVal(filterdates.s) && utils.isNotEmptyVal(filterdates.e)) {
                        var start = moment(filterdates.s);
                        var end = moment(filterdates.e);
                        if (end.diff(start, 'days', true) < 0) {
                            return 0;
                        } else {
                            if (end.diff(start, 'days', true) > 0 && end.diff(start, 'days', true) < 1) {
                                return 1;
                            } else {
                                return end.diff(start, 'days');
                            }

                        }
                    }
                }
                return 0;
            }


            function searchMatters(contactName, searchItem) {
                return intakeNotesDataService.getMatterList(contactName, 0)
                    .then(function (response) {
                        var data = response;
                        _.forEach(data, function (contact) {
                            contact.name = contact.intakeName;
                        });
                        return data;
                    });
            }

            /* Formate the matter id and name */
            function formatTypeaheadDisplay(matter) {
                if (angular.isUndefined(matter) || utils.isEmptyString(matter)) {
                    return '';
                }
                else {
                    // getPlaintiffs(matter.matterid);
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
