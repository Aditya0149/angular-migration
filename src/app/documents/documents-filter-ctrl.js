/*Doocument Filter controller*/
(function () {

    'use strict';

    angular
        .module('cloudlex.components')
        .controller('DocumentFilterCtrl', DocumentFilterCtrl);

    DocumentFilterCtrl.$inject = ['$scope', '$modalInstance', 'params', 'matterFactory',
        'documentsDataService', 'contactFactory', 'notification-service', 'allPartiesDataService'];

    function DocumentFilterCtrl($scope, $modalInstance, params, matterFactory,
        documentsDataService, contactFactory, notificationService, allPartiesDataService) {

        var matters = [];

        var tags = params.docTags;

        (function () {
            contactFactory.getUsersList()
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
            $scope.clear = clear;
            setFilters();

            setTimeout(function () {
                $('#CategoryDropdownId>.select2-choices').addClass('dashboard-tasks-due');
            }, 3000);
        })();
        function clear() {
            if (!$scope.display.filters.matterid || $scope.display.filters.matterid == "" || isNaN($scope.display.filters.matterid)) {
                $scope.display.filters.plaintiff = '';
                $scope.multiFilters.docPlaintiffDefendants = "";
            }
        }
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

        $scope.$watch(function () {
            if ($scope.display.isGlobalDocs) {
                if ((($scope.display.filters.category.length > 0) || utils.isNotEmptyVal($scope.display.filters.c_start_date) ||
                    utils.isNotEmptyVal($scope.display.filters.c_end_date) || utils.isNotEmptyVal($scope.display.filters.createdByFilter) ||
                    ($scope.display.filters.need_to_be_Reviewed && $scope.display.filters.need_to_be_Reviewed != 0) || utils.isNotEmptyVal($scope.display.filters.matterid) ||
                    utils.isNotEmptyVal($scope.display.filters.plaintiff) || utils.isNotEmptyVal($scope.display.filters.u_end_date) ||
                    utils.isNotEmptyVal($scope.display.filters.u_start_date) || utils.isNotEmptyVal($scope.display.filters.updatedByFilter)) || tags.length > 0) {
                    $scope.enableApply = false;
                } else {
                    $scope.enableApply = true;
                }
            } else {
                if ((($scope.display.filters.category.length > 0) || utils.isNotEmptyVal($scope.display.filters.c_start_date) ||
                    utils.isNotEmptyVal($scope.display.filters.c_end_date) || utils.isNotEmptyVal($scope.display.filters.createdByFilter) ||
                    ($scope.display.filters.need_to_be_Reviewed && $scope.display.filters.need_to_be_Reviewed != 0) ||
                    utils.isNotEmptyVal($scope.display.filters.plaintiff) || utils.isNotEmptyVal($scope.display.filters.u_end_date) ||
                    utils.isNotEmptyVal($scope.display.filters.u_start_date) || utils.isNotEmptyVal($scope.display.filters.updatedByFilter)) || tags.length > 0) {
                    $scope.enableApply = false;
                } else {
                    $scope.enableApply = true;
                }
            }
            return $scope.enableApply;
        })



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
            $scope.display.filters.need_to_be_Reviewed = params.need_to_be_Reviewed;
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
            // if (insuranceObj.category == 10) {
            //     $scope.display.filters.plaintiffName = selectedItem.plaintiffName
            //     $scope.display.filters.party_role = 1;
            // } else {
            //     $scope.display.filters.party_role = selectedItem.type;
            // }
            $scope.display.filters.party_role = selectedItem.type;
        }

        function setUserList(users) {
            var userList = [];
            _.forEach(users, function (user) {
                _.forEach(user, function (val, key) {
                    if (user[key] instanceof Array) {
                        _.forEach(user[key], function (usr) {
                            usr.Name = usr.name + ' ' + usr.lname;
                            userList.push(usr);
                        });
                    }
                })
            });
            //get unique user ids
            userList = _.uniq(userList, function (item) {
                return item.uid;
            });

            var lexviaUsr = {};
            lexviaUsr.mail = "";
            lexviaUsr.uid = 0;
            lexviaUsr.name = "Lexvia";
            lexviaUsr.lname = "";
            lexviaUsr.Name = "Lexvia";
            userList.push(lexviaUsr);
            userList = _.uniq(userList, function (item) {
                return item.uid;
            });
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
            $scope.display.filters.need_to_be_Reviewed = '';
        }

        /* Apply the filters and */
        $scope.OK = function () {
            if (!(utils.isNotEmptyVal($scope.display.filters.matterid))) {
                $scope.display.filters.mattername = '';
            }

            if ($scope.display.filters.matterid && isNaN($scope.display.filters.matterid)) {
                notificationService.error("Please enter valid matter name.");
                return;
            }

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

            if (typeof ($scope.display.filters.need_to_be_Reviewed) !== 'undefined' && $scope.display.filters.need_to_be_Reviewed != null && $scope.display.filters.need_to_be_Reviewed == 0) {
                $scope.display.filters.need_to_be_Reviewed = '';
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
                return matterFactory.searchMatters(matterName).then(
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
            documentsDataService.getPlaintiffs(matterId)
                .then(function (response) {
                    $scope.multiFilters.plaintiffs = response;
                    getDefendants(matterId);
                }, function (error) {
                    notificationService.error('plaintiffs not loaded');
                });
        }

        /*Get all plaintiffs of matter*/
        function getPlaintiffsForDocument(matterId) {
            documentsDataService.getPlaintiffs(matterId)
                .then(function (response) {
                    self.docPlaintiffs = response;
                    getDefendants(matterId);
                }, function (error) {
                    notificationService.error('plaintiffs not loaded');
                });
        }

        function getDefendants(matterId) {
            allPartiesDataService.getDefendants(matterId)
                .then(function (res) {
                    self.docDefendants = res.data;
                    allPartiesDataService.getOtherPartiesBasic(matterId)
                        .then(function (res) {
                            self.docOtherparties = res.data;
                            $scope.multiFilters.docPlaintiffDefendants = getDocPlaintiffData(self.docPlaintiffs, self.docDefendants, self.docOtherparties);
                        });
                });
        }

        function getDocPlaintiffData(plaintiffs, defendants, otherParties) {
            var plaintiffDefendantsArray = [];

            var plaintiff = plaintiffs.map(function (plaintiff) {
                var newplaintiff = {
                    id: plaintiff.plaintiffID,
                    name: plaintiff.plaintiffName,
                    type: 1 // 1 refer plaintiff
                };
                return newplaintiff;
            });
            plaintiffDefendantsArray = plaintiffDefendantsArray.concat(plaintiff);

            var defendants = defendants.map(function (defendant) {
                if (utils.isNotEmptyVal(defendant.contactid)) {
                    // var defendantName = utils.isNotEmptyVal(defendant.contactid.firstname) ? defendant.contactid.firstname : "";
                    // defendantName += "" + utils.isNotEmptyVal(defendant.contactid.lastname) ? defendant.contactid.lastname : "";
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
                    // var otherPartyName = utils.isNotEmptyVal(otherParty.firstname) ? otherParty.firstname : "";
                    // otherPartyName += "" + utils.isNotEmptyVal(otherParty.lastname) ? otherParty.lastname : "";
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
