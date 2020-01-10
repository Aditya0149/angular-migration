(function (angular) {

    angular.module('cloudlex.report')
        .controller('TaskAgeFilterCtrl', TaskAgeFilterCtrl);

    TaskAgeFilterCtrl.$inject = ['$modalInstance', 'taskAgeDatalayer', 'masterData', 'notification-service', 'filter', '$scope', 'tags'];

    function TaskAgeFilterCtrl($modalInstance, taskAgeDatalayer, masterData, notificationService, filter, $scope, tags) {
        var vm = this,
            role;


        vm.close = close;
        vm.apply = apply;
        vm.openCalender = openCalender;
        vm.setMinMaxDate = setMinMaxDate;
        vm.resetFilters = resetFilters;
        vm.isDatesValid = isDatesValid;
        vm.priorityList = [{ "id": 3, "name": "High", "showName": "High" }, { "id": 1, "name": "Low", "showName": "Low" }, { "id": 2, "name": "Medium", "showName": "Normal" }];
        vm.tagsList = tags ? tags : [];
        (function () {
            vm.filter = angular.copy(filter);
            role = masterData.getUserRole();

            vm.disableAssignedTo = vm.filter.for === 'mytask';

            taskAgeDatalayer.getUsersInFirm()
                .then(function (response) {
                    vm.users = response.data;
                    if (vm.disableAssignedTo) {
                        vm.filter.assignedTo = role.uid;
                    }
                });

        })();

        function close() {
            $modalInstance.dismiss();
        }

        function isDatesValid() {
            if ($('#assignstartDateErr').css("display") == "block" ||
                $('#assignendDateErr').css("display") == "block" ||
                $('#duefiltstartDateErr').css("display") == "block" ||
                $('#duefiltendDateErr').css("display") == "block") {
                return true;
            } else {
                return false;
            }
        }

        $scope.$watch(function () {
            if ((vm.filter && utils.isNotEmptyVal(vm.filter.assignedTo)) || (vm.filter && utils.isNotEmptyVal(vm.filter.assignedBy)) || (vm.filter && utils.isNotEmptyVal(vm.filter.s))
                || (vm.filter && utils.isNotEmptyVal(vm.filter.e)) || (vm.filter && utils.isNotEmptyVal(vm.filter.dueStartDate) || vm.filter.dueStartDat != "") || (vm.filter && utils.isNotEmptyVal(vm.filter.dueEndDate) || vm.filter.dueEndDate != "") ||
                (vm.filter && vm.filter.priority.length > 0) || (vm.tagsList.length > 0) || (vm.filter && utils.isNotEmptyVal(vm.filter.selectedmatter))) {
                vm.enableApply = false;
            } else {
                vm.enableApply = true;
            }
        })

        function apply(filter) {
            var filtercopy = angular.copy(filter);
            filtercopy.s = (filtercopy.s) ? moment(filtercopy.s).unix() : '';
            filtercopy.e = (filtercopy.e) ? moment(filtercopy.e).unix() : '';
            filtercopy.dueStartDate = (filtercopy.dueStartDate) ? moment(filtercopy.dueStartDate).unix() : '';
            filtercopy.dueEndDate = (filtercopy.dueEndDate) ? moment(filtercopy.dueEndDate).unix() : '';

            //Bug#9276 Validation for matter
            if (utils.isEmptyVal(filtercopy.selectedmatter) || typeof filtercopy.selectedmatter == "object") {
            } else {
                return notificationService.error("Invalid Matter Selected");
            }
            if (filtercopy.for == "mytask") {
                filtercopy.assignedTo = "";
            }
            var isValid = validateDateRange(filtercopy);
            if (isValid) {
                setDates(filtercopy);
                $modalInstance.close({ tags: [], filter: filtercopy });
            } else {
                showErrorToast(vm.filter);
            }
        }


        function setDates(filters) {
            if (angular.isUndefined(filters)) { return; }

            if (utils.isNotEmptyVal(filters.s)) {
                filters.s = (filters.s) ? utils.getUTCTimeStamp(filters.s) : '';
                filters.e = (filters.e) ? utils.getUTCTimeStampEnd(moment(filters.e).startOf('day')) : '';
            }
            if (utils.isNotEmptyVal(filters.dueEndDate)) {
                filters.dueStartDate = (filters.dueStartDate) ? utils.getUTCTimeStamp(filters.dueStartDate) : '';
                filters.dueEndDate = (filters.dueEndDate) ? utils.getUTCTimeStampEnd(moment(filters.dueEndDate).startOf('day')) : '';
            }
        }

        function showErrorToast(filter) {
            notificationService.error('Invalid date range.');
        }

        function validateDateRange(filters) {
            var isvalid = true;

            filters.dueStartDate = utils.isNotEmptyVal(filters.dueStartDate) ? filters.dueStartDate : "";
            filters.dueEndDate = utils.isNotEmptyVal(filters.dueEndDate) ? filters.dueEndDate : "";
            filters.s = utils.isNotEmptyVal(filters.s) ? filters.s : "";
            filters.e = utils.isNotEmptyVal(filters.e) ? filters.e : "";

            if (utils.isNotEmptyVal(filters.dueStartDate)) {
                isvalid = isvalid && (utils.isNotEmptyVal(filters.dueEndDate));
                if (!isvalid) {
                    return isvalid;
                }
            }

            if (utils.isNotEmptyVal(filters.s)) {
                isvalid = isvalid && (utils.isNotEmptyVal(filters.e));
                if (!isvalid) {
                    return isvalid;
                }
            }

            if (utils.isNotEmptyVal(filters.e)) {
                isvalid = isvalid && (utils.isNotEmptyVal(filters.s));
                if (!isvalid) {
                    return isvalid;
                }
            }

            if (utils.isNotEmptyVal(filters.dueEndDate)) {
                isvalid = isvalid && (utils.isNotEmptyVal(filters.dueStartDate));
                if (!isvalid) {
                    return isvalid;
                }
            }

            isvalid = checkDateRange(filters);

            return isvalid;
        }

        function checkDateRange(filters) {
            if (utils.isNotEmptyVal(filters.dueStartDate)) {
                filters.dueStartDate = moment.unix(filters.dueStartDate).startOf("day");
                // filters.dueStartDate = utils.getUTCTimeStamp(filters.dueStartDate);

                filters.dueEndDate = moment.unix(filters.dueEndDate).endOf('day');
                // filters.dueEndDate = utils.getUTCTimeStampEndDay(filters.dueEndDate);

                if (!isStartBeforeEnd(filters.dueStartDate, filters.dueEndDate)) {
                    return false;
                }
            }

            if (utils.isNotEmptyVal(filters.s)) {
                filters.s = moment.unix(filters.s).startOf("day");
                // filters.s = utils.getUTCTimeStamp(filters.s);

                filters.e = moment.unix(filters.e).endOf('day');
                // filters.e = utils.getUTCTimeStampEndDay(filters.e);

                if (!isStartBeforeEnd(filters.s, filters.e)) {
                    return false;
                }
            }

            return true;
        }

        function isStartBeforeEnd(start, end) {
            start = moment.unix(start);
            end = moment.unix(end);

            return start.isBefore(end);
        }

        function openCalender($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }

        function setMinMaxDate(dt, modelname) {
            dt = moment(dt).unix();
            var date = moment.unix(dt).add(1, 'day').toDate();
            date = new Date(date);
            vm[modelname] = date;
        }

        function resetFilters() {
            vm.filter.assignedTo = vm.filter.for === 'mytask' ? role.uid : "";
            vm.filter.assignedBy = "";
            vm.filter.s = "";
            vm.filter.e = "";
            vm.filter.dueStartDate = "";
            vm.filter.dueEndDate = "";
            vm.filter.priority = "";
            vm.filter.selectedmatter = "";
        }
    }

})(angular);


