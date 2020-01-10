(function (angular) {
    'use strict';

    angular.module('cloudlex.report')
        .controller('UserActivityReportCtrl', UserActivityReportController);

    UserActivityReportController.$inject = ['$modal', 'userActivityService', 'userActivityReportHelper', 'matterFactory'];

    function UserActivityReportController($modal, userActivityService, userActivityReportHelper, matterFactory) {

        var vm = this,
            initUserLimit = 50,
            pageSize = 250;

        vm.filterByUser = filterByUser;
        vm.getMore = getMore;
        vm.getAll = getAll;
        vm.showPaginationButtons = showPaginationButtons;
        vm.printUserActivity = printUserActivity;
        vm.exportUserActivity = exportUserActivity;
        vm.filterUserActivity = filterUserActivity;
        vm.tagCancelled = tagCancelled;
        vm.scrollReachedTop = scrollReachedTop;
        vm.scrollReachedBottom = scrollReachedBottom;

        (function () {
            vm.tags = [];
            //init clicked row index
            vm.clickedRow = -1;
            vm.userLimit = initUserLimit;
            vm.userActivityList = [];
            vm.userActivityGrid = {
                headers: userActivityReportHelper.userActivityGrid()
            };

            var persistedFilters = sessionStorage.getItem("userActivityReportFilters");

            if (utils.isNotEmptyVal(persistedFilters)) {
                try {
                    vm.filter = JSON.parse(persistedFilters);
                    userActivityService.getAssignedUserData()
                        .then(function (userList) {
                            vm.assignedUserlist = userList;
                            vm.tags = userActivityReportHelper
                                .createFilterTags(angular.copy(vm.filter), [], vm.assignedUserlist);
                        });
                } catch (e) {
                    setFilters();
                    getAssignedUser();
                }
            } else {
                setFilters();
                getAssignedUser();
            }

            getUserActivity(vm.filter);
        })();

        function setFilters() {
            vm.filter = {
                pageNum: 1,
                pageSize: pageSize,
                startDate: '',
                endDate: '',
                userID: ''
            };
        }

        function getAssignedUser() {
            userActivityService.getAssignedUserData()
                .then(function (userList) {
                    vm.assignedUserlist = userList;
                });
        }

        function getUserActivity(filterObj) {
            var localFilter = angular.copy(filterObj);

            vm.dataReceived = false;
            if (angular.isUndefined(localFilter.userID)) {
                localFilter.userID = '';
            }

            localFilter.endDate = utils.isNotEmptyVal(localFilter.endDate) ? localFilter.endDate : '';
            localFilter.startDate = utils.isNotEmptyVal(localFilter.startDate) ? localFilter.startDate : '';

            vm.filter = localFilter;
            //init clicked row index
            vm.clickedRow = -1;

            //persist applied filter
            var appliedFilter = angular.copy(vm.filter);
            appliedFilter.pageSize = pageSize;
            appliedFilter.pageNum = 1;
            sessionStorage.setItem("userActivityReportFilters", JSON.stringify(appliedFilter));
            userActivityService.getUserActivity(localFilter)
                .then(function (response) {
                    userActivityReportHelper.setDates(response.userActivity);
                    vm.userActivityList = response.userActivity;
                    vm.total = response.count;
                    vm.dataReceived = true;
                });

           // var count = userActivityService.getUserActivityCount(localFilter);
           // count.then(function (res) { vm.total = res.data[0] });
        }

        function filterByUser(forFilter) {
            vm.filter['for'] = forFilter;
            vm.filter.pageNum = 1;
            vm.filter.pageSize = pageSize;
            getUserActivity(vm.filter);
        }

        function getMore() {
            vm.filter.pageNum += 1;
            vm.filter.pageSize = pageSize;
            userActivityService.getUserActivity(vm.filter)
                .then(function (response) {
                    userActivityReportHelper.setDates(response.userActivity);
                    vm.userActivityList = vm.userActivityList.concat(response.userActivity);
                    vm.dataReceived = true;
                });
        }

        function getAll() {
            vm.filter.pageSize = '';
            vm.dataReceived = false;
            getUserActivity(vm.filter);
        }

        function showPaginationButtons() {

            if (!vm.dataReceived) {
                return false;
            }

            if (angular.isUndefined(vm.userActivityList) || vm.userActivityList.length <= 0) {
                return false;
            }

            if (vm.filter.pageSize === '') {
                return false;
            }

            if (vm.userActivityList.length < (vm.filter.pageSize * vm.filter.pageNum)) {
                return false
            }
            return true;
        }

        function printUserActivity() {
            userActivityReportHelper.printUserActivity(vm.filter, vm.assignedUserlist, vm.userActivityList);
        }

        function exportUserActivity() {
            var localFilter = angular.copy(vm.filter);
            localFilter.pageSize = 1000;
            localFilter.pageNum = 1;
            userActivityService.exportUserActivity(localFilter).then(function (response) {
                utils.downloadFile(response.data, "UserActivityReport", response.headers("Content-Type"));

            });
        }

        function tagCancelled(cancelled) {
            var localFilter = angular.copy(vm.filter);
            if (cancelled.type === "User") {
                localFilter.userID = ''
            } else if (cancelled.type === "dateRange") {
                localFilter.startDate = '';
                localFilter.endDate = '';

            } else if (cancelled.type === "Date range end") {
                localFilter.endDate = ''
            }

            vm.dataReceived = false;
            localFilter.pageNum = 1;
            localFilter.pageSize = pageSize;
            vm.filter = localFilter;
            getUserActivity(localFilter);
            vm.filter.pageNum = 1;

        }

        function filterUserActivity() {
            if (angular.isDefined(vm.assignedUserlist)) {
                _.forEach(vm.assignedUserlist, function (data) {
                    if (vm.filter.userID == data.uid) {
                        vm.filter.userID = data;
                    }
                });
            } else {
                vm.filter.userID = '';
            }
            var filtercopy = angular.copy(vm.filter);

            filtercopy.startDate = (filtercopy.startDate) ? moment.unix(filtercopy.startDate).utc().format('MM/DD/YYYY') : '';
            filtercopy.endDate = (filtercopy.endDate) ? moment.unix(filtercopy.endDate).utc().format('MM/DD/YYYY') : '';



            var modalInstance = $modal.open({
                templateUrl: 'app/report/userActivity/userActivityPopUp/userActivityReportFilterPopUp.html',
                controller: 'UserActivityPopUoCtrl as userActivityPopUoCtrl',
                backdrop: 'static',
                keyboard: false,
                size: 'sm',
                resolve: {
                    params: function () {
                        return {
                            filters: filtercopy,
                            statusList: angular.copy(vm.statusList),
                            assignedUserList: angular.copy(vm.assignedUserlist),
                            tags: vm.tags
                        };
                    }
                }
            });

            modalInstance.result.then(function (filterObj) {
                vm.filter.pageNum = 1;
                vm.filter.pageSize = pageSize;
                vm.filter = filterObj;
                vm.filter.pageNum = 1;
                vm.tags = userActivityReportHelper.createFilterTags(angular.copy(vm.filter), vm.statusList, vm.assignedUserlist);
                getUserActivity(vm.filter);

            }, function () {

            });
        }

        function scrollReachedBottom() {
            if (vm.userLimit <= vm.total) {
                vm.userLimit += initUserLimit;
            }
        }

        function scrollReachedTop() {
            vm.userLimit = initUserLimit;
        }
    }

})(angular);


(function (angular) {

    angular.module('cloudlex.report')
        .factory('userActivityReportHelper', userActivityReportHelper);
    userActivityReportHelper.$inject = ['globalConstants'];

    function userActivityReportHelper(globalConstants) {
        return {
            userActivityGrid: _userActivityGrid,
            setDates: _setDates,
            printUserActivity: _printUserActivity,
            createFilterTags: _createFilterTags

        };

        function _createFilterTags(filters, statusList, assignedList) {
            var tags = [];
            var user = {};
            var dateRange = {};
            /* var start = {};
             var end = {};*/

            if (angular.isDefined(filters.userID) && filters.userID != '') {

                if (angular.isDefined(assignedList)) {
                    _.forEach(assignedList, function (data) {
                        if (filters.userID == data.uid) {
                            user.key = data.uid;
                            user.type = "User";
                            user.value = "User: " + data.fname;
                            tags.push(user);
                        }
                    });
                }
            }

            if (utils.isNotEmptyVal(filters.startDate) && filters.startDate != 0 && filters.endDate != 0 && utils.isNotEmptyVal(filters.endDate)) {
                dateRange.key = 'dateRange';
                dateRange.type = 'dateRange';
                dateRange.value = 'Range from :' + moment.unix(filters.startDate).utc().format('MM-DD-YYYY') +
                    ' to: ' + moment.unix(filters.endDate).utc().format('MM-DD-YYYY');
                tags.push(dateRange);
            }

            /*if(angular.isDefined(filters.startDate) && filters.startDate!='' && filters.startDate!=0) {
                start.key = 'dateRangeStart';
                start.type = "Date range start";
                if (angular.isDefined( filters.startDate) && !_.isNull( filters.startDate) && !utils.isEmptyString( filters.startDate) &&  filters.startDate!=0 ) {
                    filters.startDate = moment.unix( filters.startDate).format('MM/DD/YYYY')
                }
                start.value = "Date range start: " + filters.startDate;
                tags.push(start);
            }

            if(angular.isDefined(filters.endDate) && filters.endDate!='' && filters.endDate!=0) {
                end.key = 'dateRangeEnd';
                end.type = "Date range end";
                if (angular.isDefined( filters.endDate) && !_.isNull( filters.endDate) && !utils.isEmptyString( filters.endDate) &&  filters.endDate!=0 ) {
                    filters.endDate = moment.unix( filters.endDate).format('MM/DD/YYYY')
                }
                end.value = "Date range end: " + filters.endDate;
                tags.push(end);
            }*/
            return tags;

        }

        function _userActivityGrid() {
            return [{
                field: [{
                    prop: 'user_name',
                    template: 'bold',
                    printDisplay: 'User Name'
                }],
                displayName: 'User Name',
                dataWidth: 25
            }, {
                field: [{
                    prop: 'login_time',
                    printDisplay: 'Login Date And Time'
                }],
                displayName: 'Login Date And Time',
                dataWidth: 25

            }, {
                field: [{
                    prop: 'logout_time',
                    printDisplay: 'Logout Date And Time'
                }],
                displayName: 'Logout Date And Time',
                dataWidth: 25

            }, {
                field: [{
                    prop: 'time_spent',
                    printDisplay: 'Total Time'
                }],
                displayName: 'Total Time',
                dataWidth: 25

            }];
        }

        function _setDates(userActivityList) {
            _.forEach(userActivityList, function (userData) {
                if (angular.isDefined(userData.login_time) && !_.isNull(userData.login_time) && !utils.isEmptyString(userData.login_time) && userData.login_time != 0 && userData.login_time != '-') {
                    userData.login_time = moment.unix(userData.login_time).format('MM/DD/YYYY hh:mm A')
                } else {
                    userData.login_time = "   -   "
                }

                if (angular.isDefined(userData.logout_time) && !_.isNull(userData.logout_time) && !utils.isEmptyString(userData.logout_time) && userData.logout_time != 0 && userData.logout_time != '-') {
                    userData.logout_time = moment.unix(userData.logout_time).format('MM/DD/YYYY hh:mm A')
                } else {
                    userData.logout_time = "   -   "
                }
            });
        }

        function _printUserActivity(filter, users, data) {
            var filtersForPrint = _getFilterObj(filter, users);

            var headers = _userActivityGrid();
            headers = _getPropsFromHeaders(headers);

            var printPage = _getPrintPage(filtersForPrint, headers, data);
            window.open().document.write(printPage);
        }

        function _getFilterObj(filter, users) {
            var userList = users;

            var user = utils.isNotEmptyVal(filter.userID) ? _.find(userList, function (user) {
                return user.uid === filter.userID
            }).fname : " ";

            var dateRange = "from : " + (utils.isNotEmptyVal(filter.startDate) ? moment.unix(filter.startDate).format('MM-DD-YYYY') : '  -  ') +
                " to : " + (utils.isNotEmptyVal(filter.endDate) ? moment.unix(filter.endDate).format('MM-DD-YYYY') : '  -  ');


            var filterObj = {
                'User': user,
                'Date range': dateRange
            };

            return filterObj;
        }

        function _getPropsFromHeaders(headers) {
            var displayHeaders = [];
            _.forEach(headers, function (head) {
                _.forEach(head.field, function (field) {
                    displayHeaders.push({
                        prop: field.prop,
                        display: field.printDisplay
                    });
                });
            });
            return displayHeaders;
        }

        function _getPrintPage(filters, headers, taskAgeData) {
            var html = "<html><title>User Activity</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>User Activity</h1><div></div>";
            html += "<body>";
            html += "<div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<tr>";
            angular.forEach(filters, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;' class='labelTxt'>";
                html += "<label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px; '>  " + utils.removeunwantedHTML(val) + '</span>';
                html += "</div>";
            });
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "</tr>";
            html += '<tr>';
            angular.forEach(headers, function (header) {

                if (header.prop == 'age') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + header.display + "</th>";
                } else if (header.prop == 'login_time') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + header.display + "</th>";
                } else if (header.prop == 'logout_time') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + header.display + "</th>";
                } else if (header.prop == 'time_spent') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + header.display + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + header.display + "</th>";
                }


                /*                html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + header.display + "</th>";*/
            });
            html += '</tr>';


            angular.forEach(taskAgeData, function (age) {
                html += '<tr>';
                angular.forEach(headers, function (header) {
                    age[header.prop] = (utils.isEmptyVal(age[header.prop])) ? " - " : age[header.prop];

                    if (header.prop == 'age') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + age[header.prop] + "</td>";
                    } else if (header.prop == 'login_time') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + age[header.prop] + "</td>";
                    } else if (header.prop == 'logout_time') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + age[header.prop] + "</td>";
                    } else if (header.prop == 'time_spent') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + age[header.prop] + "</td>";
                    } else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(age[header.prop]) + "</td>";
                    }


                });
                html += '</tr>'
            });

            html += "</body>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</table>";
            html += "</html>";
            return html;
        }
    }
})(angular);