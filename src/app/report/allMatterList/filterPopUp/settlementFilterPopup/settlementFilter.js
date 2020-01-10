(function (angular) {
    angular.module('cloudlex.report').
        controller('settlementFilterCtrl', settlementFilterCtrl);

    settlementFilterCtrl.$inject = ['$modalInstance', 'masterData', 'notification-service', 'matterFactory', 'filter', '$scope', 'tags'];

    function settlementFilterCtrl($modalInstance, masterData, notificationService, matterFactory, filter, $scope, tags) {
        var self = this;
        var matters = [];
        var masterDataObj = masterData.getMasterData();
        self.apply = apply;
        self.openCalender = openCalender; // $event date incurred function reference...        
        self.searchMatters = searchMatters;
        self.cancel = cancel;
        self.resetFilters = resetFilters;
        self.isDatesValid = isDatesValid;
        self.formatTypeaheadDisplay = formatTypeaheadDisplay;
        self.getSubstatus = getSubstatus; //US#8445 add status and sub-status filter
        var edited = false;
        self.enableArchivedCheck = false;
        self.tags = tags;
        self.payment_status = [{
            name: 'Outstanding',
            id: '1'
        }, {
            name: 'Paid',
            id: '2'
        }];
        self.negotiation_status = [{
            name: 'Accepted',
            id: '1'
        },{
            name: 'Pending',
            id: '2'
        },{
            name: 'Rejected',
            id: '3'
        }];


        function init() {
            self.filter = angular.copy(filter);
            // if date incurred is set then convert into datepicker format
            self.filter.settlement_date_start = (self.filter.settlement_date_start) ? getFormatteddate(self.filter.settlement_date_start) : '';
            self.filter.settlement_date_end = (self.filter.settlement_date_end) ? getFormatteddate(self.filter.settlement_date_end) : '';


            self.viewModel = {};
            //to get substatus list 
            if (utils.isNotEmptyVal(self.filter.statuses)) {
                getSubstatus(self.filter.statuses, 'init');
            }
        }
        init();


        self.statuses = moveBlankToBottom(getFilterValues(masterDataObj, 'statuses'));

        //func to get sub-status 
        function getSubstatus(status, data) {
            if (utils.isEmptyVal(status)) {
                self.substatuses = [];
                return;
            }
            if (self.filter.statuses.length > 0) {
                var flag = true;
                _.forEach(self.filter.statuses, function (item) {
                    if (flag) {
                        if (item.name == 'Closed') {
                            self.enableArchivedCheck = false;
                            flag = false;
                        } else {
                            self.enableArchivedCheck = true;
                            if (data == 'init') {
                                angular.noop();
                            } else {
                                self.filter.include_archived = 0;

                            }
                        }
                    }
                })

            } else {
                self.enableArchivedCheck = false;
            }
            var statuses = masterDataObj['statuses']; //US#8445 add status and sub-status filter on report
            //get selected statuses substatus
            var selectedStatus = [];
            _.forEach(status, function (item) {
                _.forEach(statuses, function (currentItem) {
                    if (item.id == currentItem.id) {
                        _.forEach(currentItem["sub-status"], function (currentI) {
                            currentI.statusname = currentItem.name;
                            currentI.statusid = currentItem.id
                            selectedStatus.push(currentI);
                        })
                    }
                })
            })
            self.substatuses = selectedStatus;
            edited = true;
        }

        // To solve Bug#8300 Added this function
        function isDatesValid() {
            if ($('#expenceStartDateErr').css("display") == "block" ||
                $('#expenceEndDateErr').css("display") == "block") {
                return true;
            }
            else {
                return false;
            }
        }

        /* Formate the matter id and name */
        function formatTypeaheadDisplay(matter) {
            if (angular.isUndefined(matter) || utils.isEmptyString(matter)) {
                return undefined;
            } else {

                return matter.name
            }
        }

        function getFilterValues(masterList, filter) {
            return masterList[filter].map(function (item) {
                return {
                    id: item.id,
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


        // convert date timestamp to MM/DD/YYYY format...
        function getFormatteddate(epoch) {
            var formdate = new Date(epoch * 1000);
            formdate = moment(formdate).utc().format('MM/DD/YYYY');
            return formdate;
        }

        // $event bind with date incurred datepicker...
        function openCalender($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }

        function cancel() {
            $modalInstance.dismiss('cancel');
        }

        $scope.$watch(function () {
            if (utils.isNotEmptyVal(self.filter.matter_id) ||
                self.filter.statuses.length > 0 ||
                utils.isNotEmptyVal(self.filter.payment_status) ||
                utils.isNotEmptyVal(self.filter.negotiation_status) ||
                utils.isNotEmptyVal(self.filter.settlement_date_start) ||
                utils.isNotEmptyVal(self.filter.settlement_date_end) ||
                utils.isNotEmptyVal(self.filter.settlement_amount_start) || (self.filter.include_archived == 1) ||
                utils.isNotEmptyVal(self.filter.settlement_amount_end) || (self.tags && self.tags.length > 0)) {
                self.enableApply = false;
            } else {
                self.enableApply = true;
            }
        })
        //when we submit popup collect the scope object
        function apply(filter) {
            //to rename empty filter to 'Blank' US#8445
            if (filter.statuses.length > 0) {
                var substatusCopy = [];
                _.forEach(filter.statuses, function (parent) {
                    _.forEach(filter.substatus, function (child) {
                        if (parent.id == child.statusid) {
                            child.name = utils.isEmptyVal(child.name) ? "{Blank}" : child.name;
                            substatusCopy.push(child);
                        }
                    });
                });
                filter.substatus = substatusCopy;
            } else {
                filter.substatus = [];
            }
            _.forEach(filter.statuses, function (data) {
                if (utils.isEmptyVal(data.name)) {
                    data.name = "{Blank}";
                }
            });
            //Bug#6515 Validation for matter name
            if (angular.isDefined(filter.matter_id)) {
                if (utils.isNotEmptyVal(filter.matter_id.matterid) || utils.isEmptyVal(filter.matter_id)) {
                    filter.matter_id.matterid;
                } else {
                    return notificationService.error("Invalid Matter Selected");
                }
            }
            var filtercopy = angular.copy(filter);

            if (parseFloat(filtercopy.settlement_amount_end) < parseFloat(filtercopy.settlement_amount_start)) {
                notificationService.error('Max amount cannot be less than Min amount');
                return;
            }

            if ((utils.isEmptyVal(filtercopy.settlement_amount_end) && utils.isNotEmptyVal(filtercopy.settlement_amount_start)) || (utils.isNotEmptyVal(filtercopy.settlement_amount_end) && utils.isEmptyVal(filtercopy.settlement_amount_start))) {
                notificationService.error('settlement amount field can not be empty ');
                return;
            }
            if (filtercopy) {
                // convert into timestamp format...
                var start = (filtercopy.settlement_date_start) ? moment(filtercopy.settlement_date_start).unix() : '';
                var end = (filtercopy.settlement_date_end) ? moment(filtercopy.settlement_date_end).unix() : '';
            }


            if ((utils.isEmptyString(start) && utils.isNotEmptyString(end)) || (utils.isNotEmptyString(start) && utils.isEmptyString(end))) {
                notificationService.error('Invalid date range.');
                return;
            } else if (start > end) {
                notificationService.error('End date cannot be less than start date.');
                return;
            }



            // convert into timestamp format...
            filtercopy.settlement_date_start = (filtercopy.settlement_date_start) ? utils.getUTCTimeStamp(filtercopy.settlement_date_start) : '';
            filtercopy.settlement_date_end = (filtercopy.settlement_date_end) ? utils.getUTCTimeStampEndDay(moment(filtercopy.settlement_date_end)) : '';

            $modalInstance.close({ tags: [], filter: filtercopy });

            //check then in controller
        }

        // Function For reset 
        function resetFilters() {
            self.filter.payment_status = "";
            self.filter.negotiation_status = "";
            self.filter.matter_id = "";
            self.filter.statuses = [];
            self.filter.substatus = [];
            self.substatuses = [];
            self.filter.settlement_date_start = ""; // set blank start date
            self.filter.settlement_date_end = ""; // set blank end date
            self.filter.settlement_amount_start = "";
            self.filter.settlement_amount_end = "";
            self.filter.include_archived = 0;
            self.enableArchivedCheck = false;

        }


        function searchMatters(matterName) {
            if (matterName) {
                return matterFactory.searchMatters(matterName).then(
                    function (response) {
                        matters = response.data;
                        return response.data;
                    },
                    function (error) {
                        notificationService.error('Matters not loaded');
                    });
            }
        }


    }
})(angular)