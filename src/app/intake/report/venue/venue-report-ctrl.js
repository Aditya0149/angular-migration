(function (angular) {

    angular.module('intake.report')
        .controller('IntakeVenueReportCtrl', IntakeVenueReportCtrl);

    IntakeVenueReportCtrl.$inject = ['intakeVenueReportDatalayer', 'intakeVenueHelper'];

    function IntakeVenueReportCtrl(intakeVenueReportDatalayer, intakeVenueHelper) {

        var vm = this, venueData = {}, pageSize = 250, initVenueLimit = 15;
        vm.filterByUser = filterByUser;
        vm.setSortBy = setSortBy;
        vm.print = print;
        vm.getMore = getMore;
        vm.getAll = getAll;
        vm.exportReport = exportReport;
        vm.showPaginationButtons = showPaginationButtons;
        vm.scrollReachedBottom = scrollReachedBottom;
        vm.scrollReachedTop = scrollReachedTop;
        vm.getVenueList = getVenueList;
        vm.applySortByFilter = applySortByFilter;


        (function () {
            vm.venueList = [];
            //init clicked row index
            vm.clickedRow = -1;
            vm.venueLimit = initVenueLimit;
            var persistedFilter = sessionStorage.getItem("intakeVenueReportFilters");
            if (utils.isNotEmptyVal(persistedFilter)) {
                try {
                    vm.filter = JSON.parse(persistedFilter);
                    vm.dataReceived = false;
                    vm.selectedSort = setSortBy(vm.filter.sortBy);
                } catch (e) {
                    setFilters();
                }
            } else {
                setFilters();
            }

            vm.venueGrid = {
                headers: intakeVenueHelper.getVenueGrid()
            };

            getVenueList();
        })();

        function setFilters() {
            vm.filter = {
                'type': 'mymatter',
                sortBy: 1,
                pageNum: 1,
                pageSize: pageSize,
                // includeArchived : 0
            };
            vm.dataReceived = false;
            vm.selectedSort = setSortBy(vm.filter.sortBy);
        }

        function setSortBy(sortBy) {
            var sortByString;
            switch (sortBy) {
                case 1:
                    sortByString = "State ASC";
                    break;
                case 2:
                    sortByString = "State DESC";
                    break;
                case 3:
                    sortByString = "Venue ASC";
                    break;
                case 4:
                    sortByString = "Venue DESC";
                    break;
            }
            return sortByString;
        }

        function filterByUser(userFilter) {
            vm.filter.type = userFilter;
            vm.filter.pageNum = 1;
            vm.filter.pageSize = pageSize;
            vm.dataReceived = false;
            //vm.venueList = [];
            getVenueList();
        }

        function applySortByFilter(sortBy) {
            vm.filter.sortBy = sortBy;
            vm.selectedSort = setSortBy(vm.filter.sortBy);
            vm.filter.pageNum = 1;
            vm.filter.pageSize = pageSize;
            vm.dataReceived = false;
            //vm.venueList = [];
            getVenueList();
        }

        function print() {
            var data = vm.venueList;
            intakeVenueHelper.print(data, vm.filter);
        }

        function exportReport() {
            intakeVenueReportDatalayer.exportVenueAgeReport(vm.filter).then(function (response) {
                utils.downloadFile(response.data, "State and Venue Report.xlsx", response.headers("Content-Type"));
            });
        }

        function showPaginationButtons() {

            if (!vm.dataReceived) {
                return false;
            }

            if (angular.isUndefined(vm.venueList) || vm.venueList.length <= 0) {
                return false;
            }

            if (vm.filter.pageSize == 99999) {
                return false;
            }

            if (vm.venueList.length < (vm.filter.pageSize * vm.filter.pageNum)) {
                return false
            }
            return true;
        }

        function getAll() {
            vm.filter.pageNum = 1;
            vm.filter.pageSize = 99999;
            vm.dataReceived = false;
            //vm.venueList = [];
            getVenueList();
        }

        function getMore() {
            vm.filter.pageNum += 1;
            vm.filter.pageSize = pageSize;
            vm.dataReceived = false;
            getVenueList();
        }

        function getVenueList() {
            //persist applied filters
            self.dataLoaderFlag = false;
            var filters = angular.copy(vm.filter);
            // filters.pageSize = pageSize;
            filters.pageNum = 1;
            sessionStorage.setItem("intakeVenueReportFilters", JSON.stringify(filters));
            intakeVenueReportDatalayer.getVenueList(filters)
                .then(function (response) {
                    //init clicked row index
                    vm.clickedRow = -1;
                    vm.venueList = [];
                    vm.venueList = vm.venueList.concat(response.data.stateAndVenueList);
                    vm.dataReceived = true;
                    self.dataLoaderFlag = true;
                    vm.total = response.data.totalcount;
                });

            // var count = intakeVenueReportDatalayer.getVenueCount(vm.filter);
            // count.then(function (res) {
            //     vm.total = res.data;
            // });
        }

        function scrollReachedBottom() {
            if (vm.venueLimit <= vm.total) {
                vm.venueLimit += initVenueLimit;
            }
        }

        function scrollReachedTop() {
            vm.venueLimit = initVenueLimit;
        }
    }

    angular.module('cloudlex.report')
        .factory('intakeVenueReportDatalayer', intakeVenueReportDatalayer);

    intakeVenueReportDatalayer.$inject = ['$http', 'globalConstants', '$q']

    function intakeVenueReportDatalayer($http, globalConstants, $q) {

        var urls = {
            // getVenueList: globalConstants.javaWebServiceBaseV4 + 'reports/mattercourtvenue',
            // getVenueListCount: globalConstants.javaWebServiceBaseV4 + 'reports/mattercourtvenue_count',
            getVenueList: globalConstants.intakeServiceBaseV2 + 'report/intake-state-venue-report',
            exportVenueAge: globalConstants.intakeServiceBaseV2 + 'report/intake-state-venue-export'
        }

        return {
            getVenueList: _getVenueList,
            // getVenueCount: _getVenueCount,
            exportVenueAgeReport: _exportVenueAgeReport
        }

        function _getVenueList(filter) {
            var url = urls.getVenueList + '?' + utils.getParams(filter);
            return $http.get(url);
        }

        // function _getVenueCount(filter) {
        //     var url = urls.getVenueListCount + '?' + utils.getParams(filter);
        //     return $http.get(url);
        // }

        function _exportVenueAgeReport(filters) {
            var filterObj = angular.copy(filters);
            filterObj.pageNum = 1;
            filterObj.pageSize = 99999;

            var url = urls.exportVenueAge + '?' + utils.getParams(filterObj);
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                responseType: 'arraybuffer',
            })
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

    }


    angular.module('cloudlex.report')
        .factory('intakeVenueHelper', intakeVenueHelper);

    intakeVenueHelper.$inject = ['globalConstants'];

    function intakeVenueHelper(globalConstants) {
        return {
            getVenueGrid: _getVenueGrid,
            print: _print
        }

        function _getVenueGrid() {
            return [{
                field: [{
                    prop: 'jurisdictionName',
                    printDisplay: 'State'
                }],
                displayName: 'State',
                dataWidth: 33
            }, {
                field: [{
                    prop: 'venueName',
                    printDisplay: 'Venue',

                }],
                displayName: 'Venue',
                dataWidth: 33
            }, {
                field: [{
                    prop: 'count',
                    showBig: true,
                    printDisplay: 'Intake Count'
                },],
                displayName: 'Intake Count',
                dataWidth: 33

            }]
        }

        function _print(venueCourtData, filterObj) {
            var filtersForPrint = {

                'Sort By': setSortBy(filterObj.sortBy),
                'For': filterObj.type === 'mymatter' ? "My Intakes" : "All Intakes",
            };
            // if(filterObj.includeArchived == 1){
            //     filtersForPrint['Include Archived Matters'] = 'Yes';
            // }
            var headers = _getVenueGrid();
            headers = _getPropsFromHeaders(headers);

            var printPage = _getPrintPage(filtersForPrint, headers, venueCourtData);
            window.open().document.write(printPage);
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

        function _getPrintPage(filters, headers, venueCourtData) {
            var html = "<html><title>State And Venue Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>State And Venue Report</h1><div></div>";
            html += "<body>";
            html += "<div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<tr>";
            angular.forEach(filters, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'>";
                html += "<label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px; '>  " + val + '</span>';
                html += "</div>";
            });
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "</tr>";
            html += '<tr>';
            angular.forEach(headers, function (header) {
                // console.log(header)
                if (header.prop == 'count') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + header.display + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + header.display + "</th>";
                }

            });
            html += '</tr>';


            angular.forEach(venueCourtData, function (age) {
                html += '<tr>';
                angular.forEach(headers, function (header) {
                    age[header.prop] = (_.isNull(age[header.prop]) || angular.isUndefined(age[header.prop]) || utils.isEmptyString(age[header.prop])) ? " - " : utils.removeunwantedHTML(age[header.prop]);


                    if (header.prop == 'count') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + age[header.prop] + "</td>";
                    } else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; padding:5px'>" + age[header.prop] + "</td>";
                    }

                })
                html += '</tr>';
            })


            html += "</body>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</table>";
            html += "</html>";
            return html;
        }
        function setSortBy(sortBy) {
            var sortByString;
            switch (sortBy) {
                case 1:
                    sortByString = "State ASC";
                    break;
                case 2:
                    sortByString = "State DESC";
                    break;
                case 3:
                    sortByString = "Venue ASC";
                    break;
                case 4:
                    sortByString = "Venue DESC";
                    break;
            }
            return sortByString;
        }
    }

})(angular)
