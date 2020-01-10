(function (angular) {
    angular.module('cloudlex.expense').
        controller('expenseManagerFilterCtrl', expenseManagerFilterCtrl);

    expenseManagerFilterCtrl.$inject = ['$scope', '$modalInstance', 'notification-service', 'matterDetailsService', 'matterFactory', 'expenseHelper', 'filter', 'tags'];

    function expenseManagerFilterCtrl($scope, $modalInstance, notificationService, matterDetailsService, matterFactory, expenseHelper, filter, tags) {
        var self = this;
        var matters = [];
        self.apply = apply;
        self.openCalender = openCalender; // $event date incurred function reference...
        self.getExpenseType = getExpenseType;
        self.searchMatters = searchMatters;
        self.getAssociatedPlaintiffs = getAssociatedPlaintiffs;
        self.formatTypeaheadDisplay = formatTypeaheadDisplay;
        self.cancel = cancel;
        self.resetFilters = resetFilters;
        self.groupPlaintiffDefendants = groupPlaintiffDefendants;
        self.expense_category_list = [{ id: "di", Name: "Disbursable" }, { id: "udi", Name: "Undisbursable" }]; //list of expense category 
        self.onSelectMatter = onSelectMatter;
        self.tags = (tags) ? tags : [];
        self.enableArchivedCheck = true;
        self.isDatesValid = isDatesValid;

        function init() {
            self.filter = angular.copy(filter);
            if (utils.isNotEmptyVal(self.filter.matterid)) {
                getAssociatedPlaintiffs(self.filter.matterid, 'fromView');
            }

            // // if date incurred is set then convert into datepicker format
            self.filter.start = (self.filter.start) ? getFormatteddate(self.filter.start) : '';
            self.filter.end = (self.filter.end) ? getFormatteddate(self.filter.end) : '';

            //Object {pageNum: 1, pageSize: 250, sortBy: "1", sortOrder: "ASC", matterid: ""�} expenseTypeId : "" matterid : "" pageNum : 1 pageSize : 250 plaintiffId : "" sortBy : "1" sortOrder : "ASC" tz : "+05:30"
            self.viewModel = {};
            getExpenseType();
        }
        init();

        // convert date timestamp to MM/DD/YYYY format...
        function getFormatteddate(epoch) {
            var formdate = new Date(epoch * 1000);
            formdate = moment(formdate).utc().format('MM/DD/YYYY');
            return formdate;
        }

        //$event bind with date incurred datepicker...
        function openCalender($event) {
            $event.preventDefault();
            $event.stopPropagation();
        }

        function cancel() {
            $modalInstance.dismiss('cancel');
        }

        $scope.$watch(function () {
            if (utils.isNotEmptyVal(self.filter.expenseTypeId) || utils.isNotEmptyVal(self.filter.matterid) ||
                utils.isNotEmptyVal(self.filter.expenseCategory) || utils.isNotEmptyVal(self.filter.plaintiffId) || self.filter.includeArchived == 1 ||
                utils.isNotEmptyVal(self.filter.start) || utils.isNotEmptyVal(self.filter.end) || (typeof (self.filter.includeClosed) != 'undefined' && self.filter.includeClosed != 0) || self.tags.length > 0) {
                self.enableApply = false;
            } else {
                self.enableApply = true;
            }

            if (self.filter.includeClosed == '1') {
                self.enableArchivedCheck = false;
            }
            if (self.filter.includeClosed == '0') {
                self.enableArchivedCheck = true;
                self.filter.includeArchived = 0;
            }
        })

        function isDatesValid() {
            if ($('#expenceStartDateErr').css("display") == "block" ||
                $('#expenceEndDateErr').css("display") == "block") {
                return true;
            } else {
                return false;
            }
        }

        //when we submit popup collect the scope object
        function apply(filter) {
            var filtercopy = angular.copy(filter);
            if (filtercopy) {
                // convert into timestamp format...
                var start = (filtercopy.start) ? moment(filtercopy.start).unix() : '';
                var end = (filtercopy.end) ? moment(filtercopy.end).unix() : '';
            }

            // STORY:4735 check whether start date cannot be less then end date...
            if ((utils.isEmptyString(start) && utils.isNotEmptyString(end)) || (utils.isNotEmptyString(start) && utils.isEmptyString(end))) {
                notificationService.error('Invalid date range.');
                return;
            } else if (start > end) {
                notificationService.error('End date cannot be less than start date.');
                return;
            }

            // convert into timestamp format...
            filtercopy.start = (filtercopy.start) ? utils.getUTCTimeStamp(filtercopy.start) : '';
            filtercopy.end = (filtercopy.end) ? utils.getUTCTimeStampEndDay(moment(filtercopy.end)) : '';

            if (typeof (filter.includeClosed) !== 'undefined' && filter.includeClosed != null && filter.includeClosed == 0) {
                filter.includeClosed = '';
            }
            $modalInstance.close({ tags: [], filter: filtercopy });

            //check then in controller
        }

        function setStartEndDate(dateSel) {
            if (utils.isEmptyVal(dateSel)) {
                return dateSel;
            } else {
                var date = moment.unix(dateSel).endOf('day');
                date = date.utc();
                date = date.toDate();
                date = new Date(date);
                date = moment(date.getTime()).unix();
                return date;
            }
        }

        // Function For reset 
        function resetFilters() {

            //  self.filter={};
            self.filter.expenseTypeId = "";
            self.filter.matterid = []; //US#8644
            self.filter.plaintiffId = "";
            self.associatedPlaintiffs = '';
            self.filter.start = ""; // set blank start date
            self.filter.end = ""; // set blank end date
            self.filter.expenseCategory = ""; //US#8644
            self.filter.includeClosed = '';
            self.filter.includeArchived = 0;
            self.enableArchivedCheck = true;
        }

        /* group by Party Role */
        function groupPlaintiffDefendants(party) {
            if (party.type == 1) {
                return "Plaintiffs";
            }

            if (party.type == 2) {
                return "Defendants";
            }

            if (party.type == 3) {
                return "Other Party";
            }

            return "All";
        }

        //get expenses type
        function getExpenseType() {
            return matterDetailsService.getExpenseTypePHP()
                .then(function (response) {
                    self.expenseTypes = response;
                }, function () {
                    //alert("cannot get expense type");
                });
        }

        /* Formate the matter id and name */
        function formatTypeaheadDisplay(matter) {
            if (angular.isUndefined(matter) || utils.isEmptyString(matter)) {
                return undefined;
            } else {
                getAssociatedPlaintiffs(matter.matterid);
                return matter.name
            }

        }

        //func to get associated plaintiff on selected matter
        function onSelectMatter(matterArry) {
            if (angular.isUndefined(matterArry) || utils.isEmptyString(matterArry)) {
                self.filter.plaintiffId = '';
                self.associatedPlaintiffs = [];
                return undefined;
            } else {
                getAssociatedPlaintiffs(matterArry);
            }
        }


        /*Get all associated parties of matter*/
        function getAssociatedPlaintiffs(matterObj, fromview) {
            if (fromview == undefined) {
                self.filter.plaintiffId = '';
            }

            var mid = _.pluck(matterObj, 'matterid');
            expenseHelper.getAssociatedParty(mid)
                .then(function (response) {
                    self.associatedPlaintiffs = response.data;
                    _.forEach(self.associatedPlaintiffs, function (currentItem) {
                        currentItem.contact_name = currentItem.firstname + " " + currentItem.lastname;
                    });
                    //getDefendants(mid);
                }, function (error) {
                    notificationService.error('associated party not loaded');
                });
        }

        function getDefendants(matterId) {
            allPartiesDataService.getDefendants(matterId)
                .then(function (res) {
                    self.docDefendants = res.data;
                    allPartiesDataService.getOtherPartiesBasic(matterId)
                        .then(function (res) {
                            self.docOtherparties = res.data;
                            self.associatedPlaintiffs = getDocPlaintiffData(self.docPlaintiffs, self.docDefendants, self.docOtherparties);
                        });
                });
        }

        function getDocPlaintiffData(plaintiffs, defendants, otherParties) {
            var plaintiffDefendantsArray = [];

            var plaintiff = plaintiffs.map(function (plaintiff) {
                if (utils.isNotEmptyVal(plaintiff)) {
                    var newplaintiff = {
                        id: plaintiff.plaintiffid,
                        name: plaintiff.firstname + " " + plaintiff.lastname,
                        type: 1 // 1 refer plaintiff
                    };
                    return newplaintiff;
                }

            });

            plaintiffDefendantsArray = plaintiffDefendantsArray.concat(plaintiff);

            var defendants = defendants.map(function (defendant) {
                if (utils.isNotEmptyVal(defendant.contactid)) {
                    var defendantFirstName = utils.isNotEmptyVal(defendant.contactid.firstname) ? defendant.contactid.firstname : "";
                    var defendantLastName = utils.isNotEmptyVal(defendant.contactid.lastname) ? defendant.contactid.lastname : "";
                    var defendantName = defendantFirstName + " " + defendantLastName;
                    var newDefendant = {
                        id: defendant.defendantid,
                        name: defendantName,
                        type: 2 // 2 refer defendant role
                    };
                    return newDefendant;
                }
            });
            plaintiffDefendantsArray = plaintiffDefendantsArray.concat(defendants);

            var otherParties = otherParties.map(function (otherParty) {
                if (utils.isNotEmptyVal(otherParty.contactid)) {
                    var otherFirstName = utils.isNotEmptyVal(otherParty.firstname) ? otherParty.firstname : "";
                    var otherLastName = utils.isNotEmptyVal(otherParty.lastname) ? otherParty.lastname : "";
                    var otherPartyName = otherFirstName + " " + otherLastName;
                    var newOtherParty = {
                        id: otherParty.mattercontactid,
                        name: otherPartyName,
                        type: 3 // 3 refer other party role
                    };
                    return newOtherParty;
                }
            });
            plaintiffDefendantsArray = plaintiffDefendantsArray.concat(otherParties);

            return plaintiffDefendantsArray;
        }

        //get Search Matter list
        function searchMatters(matterName) {
            self.searchMatterList = [];
            if (matterName) {
                return matterFactory.searchMatters(matterName).then(
                    function (response) {
                        self.searchMatterList = response.data;
                        matters = response.data;
                        return response.data;
                    },
                    function (error) {
                        notificationService.error('Matters not loaded');
                    });
            } else {
                return [];
            }
        }

        //filter dropdown values
        self.viewModel.expenseFilter = [{
            label: 'expense type'
        }, {
            label: 'matter name'
        }, {
            label: 'associated plaintiff'
        }];
    }
})(angular)