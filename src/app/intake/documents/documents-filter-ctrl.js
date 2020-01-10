/*Doocument Filter controller*/
(function () {

    'use strict';

    angular
        .module('intake.components')
        .controller('IntakeDocumentFilterCtrl', IntakeDocumentFilterCtrl);

    IntakeDocumentFilterCtrl.$inject = ['$scope', '$modalInstance', 'params', 'intakeFactory',
        'inatkeDocumentsDataService', 'notification-service', 'intakeNotesDataService'];

    function IntakeDocumentFilterCtrl($scope, $modalInstance, params, intakeFactory,
        inatkeDocumentsDataService, notificationService, intakeNotesDataService) {

        var matters = [];

        (function () {
            intakeNotesDataService.getGlobalAllUsers()
                .then(function (users) {
                    $scope.users = setUserList(users);
                });

            $scope.display = {};
            $scope.display.isGlobalDocs = params.isGlobalDocs;
            $scope.display.filters = {};
            setAppliedFilters(params);

            $scope.multiFilters = {};
            $scope.multiFilters.plaintiffs = params.plaintifflist;
            $scope.multiFilters.docPlaintiffDefendants = params.docPlaintiffDefendants;

            $scope.multiFilters.categories = params.categories;
            $scope.searchMatters = searchMatters;
            $scope.formatTypeaheadDisplay = formatTypeaheadDisplay;
            $scope.isDatesValid = isDatesValid;
            $scope.groupPlaintiffDefendants = groupPlaintiffDefendants;
            $scope.setPartyRole = setPartyRole;
            setFilters();
        })();

        function isDatesValid() {
            if ($('#updatestartDateErr').css("display") == "block" ||
                $('#updateendDateErr').css("display") == "block" ||
                $('#createstartDateError').css("display") == "block" ||
                $('#createendDateError').css("display") == "block") {
                return true;
            }
            else {
                return false;
            }
        }

        function setAppliedFilters(params) {
            $scope.display.filters.plaintiff = params.filteredPlaintiff;
            $scope.display.filters.plaintiffName = params.filteredPlaintiffName;
            $scope.display.filters.category = params.filteredCategory;
            $scope.display.filters.matterid = params.filteredMatter;
            $scope.display.filters.mattername = params.filteredMatterName;
            $scope.display.filters.createdByFilter = params.createdByFilter;
            $scope.display.filters.updatedByFilter = params.updatedByFilter;
            $scope.display.filters.c_start_date = params.c_start_date;
            $scope.display.filters.c_end_date = params.c_end_date;
            $scope.display.filters.u_start_date = params.u_start_date;
            $scope.display.filters.u_end_date = params.u_end_date;
            $scope.display.filters.needReviewFilter = params.needReviewFilter;
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

        function setPartyRole(selectedItem, insuranceObj) {
            if (insuranceObj.category == 10) {
                $scope.display.filters.plaintiffName = selectedItem.plaintiffName
                $scope.display.filters.party_role = 1;
            } else {
                $scope.display.filters.party_role = selectedItem.type;
            }
        }

        function setUserList(users) {
            var userList = [];
            _.forEach(users, function (user) {
                _.forEach(user, function (val, key) {
                    val.Name = val.fname + ' ' + val.lname;
                    userList.push(val);
                })
            });
            //get unique user ids
            userList = _.uniq(userList, function (item) {
                return item.userId;
            });

            var lexviaUsr = {};
            lexviaUsr.uname = "";
            lexviaUsr.userId = 0;
            lexviaUsr.fname = "Lexvia";
            lexviaUsr.lname = "";
            lexviaUsr.Name = "Lexvia";
            userList.push(lexviaUsr);

            return userList;
        }

        $scope.openCalendar = function (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        /* Reset the filters */
        $scope.resetFilter = function () {
            $scope.display.isGlobalDocs = params.isGlobalDocs;
            $scope.display.filters.plaintiff = '';
            $scope.display.filters.plaintiffName = '';
            if ($scope.display.isGlobalDocs) {   //Bug#7199:do not reset plaintiff filter type
                $scope.multiFilters.docPlaintiffDefendants = "";
            }
            //$scope.multiFilters.plaintiffs = ""; //Bug#7199:do not reset plaintiff filter type
            $scope.display.filters.category = '';
            $scope.display.filters.matterid = '';
            $scope.display.filters.mattername = '';
            $scope.display.filters.updatedByFilter = '';
            $scope.display.filters.createdByFilter = '';
            $scope.display.filters.u_start_date = '';
            $scope.display.filters.u_end_date = '';
            $scope.display.filters.c_start_date = '';
            $scope.display.filters.c_end_date = '';
            $scope.display.filters.needReviewFilter = '';
        }

        /* Apply the filters and */
        $scope.OK = function () {
            var filtercopy = angular.copy($scope.display.filters);
            filtercopy.u_start_date = (filtercopy.u_start_date) ? moment(filtercopy.u_start_date).unix() : '';
            var u_end_date = (filtercopy.u_end_date) ?
                moment(filtercopy.u_end_date).unix() : '';
            filtercopy.u_end_date = selecteddate(u_end_date);
            filtercopy.c_start_date = (filtercopy.c_start_date) ? moment(filtercopy.c_start_date).unix() : '';
            var c_end_date = (filtercopy.c_end_date) ?
                moment(filtercopy.c_end_date).unix() : '';
            filtercopy.c_end_date = selecteddate(c_end_date);
            //setDateFilters();
            if (areDatesValid(filtercopy)) {
                $modalInstance.close({ filters: filtercopy, users: $scope.users });
            }
            if (typeof ($scope.display.filters.needReviewFilter) !== 'undefined' && $scope.display.filters.needReviewFilter != null && $scope.display.filters.needReviewFilter == 0) {
                $scope.display.filters.needReviewFilter = '';
            }
        }

        function areDatesValid(filtercopy) {
            var isCreatedRangeValid = isDateRangeValid(filtercopy.c_start_date, filtercopy.c_end_date);
            if (isCreatedRangeValid) {
                var isUpdatedRangeValid = isDateRangeValid(filtercopy.u_start_date, filtercopy.u_end_date);
                if (isUpdatedRangeValid) {
                    return true;
                } else {
                    notificationService.error('Invalid updated date range.');
                    return false;
                }
            } else {
                notificationService.error('Invalid created date range.');
                return false;
            }
        }

        function isDateRangeValid(start, end) {
            if (utils.isEmptyVal(start)
                && utils.isEmptyVal(end)) {
                return true;
            }

            if (utils.isNotEmptyVal(start) && utils.isNotEmptyVal(end)) {
                var momentStart = moment.unix(start);
                var momentEnd = moment.unix(end);

                return momentStart.isBefore(momentEnd);
            }

            return false;
        }

        function selecteddate(dateSel) {
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
        /* Cancel the Filter and close the box */
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        /* Get matter accordign to typed letters */

        function searchMatters(matterName) {
            if (matterName) {
                return intakeFactory.searchMatters(matterName).then(
                    function (response) {
                        matters = response.data;
                        $scope.display.filters.plaintiff = undefined; //Bug#7199
                        return response.data;
                    }, function (error) {
                        notificationService.error('Matters not loaded');
                    });
            }
        }

        /* Formate the matter id and name */
        function formatTypeaheadDisplay(matterid) {
            // $scope.display.filters.plaintiff='';

            if (angular.isUndefined(matterid) || utils.isEmptyString(matterid) || matters.length === 0) {
                return undefined;
            }
            var matterInfo = _.find(matters, function (matter) {
                $scope.display.filters.matterid = matterid;
                $scope.display.filters.category == 10 ? getPlaintiffsForMotion(matterid) : getPlaintiffsForDocument(matterid);
                return matter.matterid === matterid;
            });
            $scope.display.filters.mattername = matterInfo.name;
            return matterInfo.name;
        }

        /*Get all plaintiffs of matter for motion*/
        function getPlaintiffsForMotion(matterId) {
            inatkeDocumentsDataService.getPlaintiffs(matterId)
                .then(function (response) {
                    $scope.multiFilters.plaintiffs = response;
                    //getDefendants(matterId);
                }, function (error) {
                    notificationService.error('plaintiffs not loaded');
                });
        }

        /*Get all plaintiffs of matter*/
        function getPlaintiffsForDocument(matterId) {
            inatkeDocumentsDataService.getPlaintiffs(matterId)
                .then(function (response) {
                    self.docPlaintiffs = response;
                    //getDefendants(matterId);
                }, function (error) {
                    notificationService.error('plaintiffs not loaded');
                });
        }

        function setFilters() {
            if (!angular.isUndefined($scope.display.filters.matterid) && $scope.display.filters.matterid != '' && $scope.display.filters.matterid > 0) {
                matters = [{
                    name: $scope.display.filters.mattername,
                    matterid: $scope.display.filters.matterid
                }];
            }
            return true;
        }
    }
})();