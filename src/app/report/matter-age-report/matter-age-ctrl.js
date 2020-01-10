(function (angular) {


    angular.module('cloudlex.report')
        .controller('MatterAgeCtrl', MatterAgeController);

    MatterAgeController.$inject = ['matterAgeReportDatalayer', 'matterAgeReportHelper', 'globalConstants'];

    function MatterAgeController(matterAgeReportDatalayer, matterAgeReportHelper, globalConstants) {

        var vm = this,
            pageSize = 250,
            initMatterLimit = 10;

        vm.filterByUser = filterByUser;
        vm.getMore = getMore;
        vm.getAll = getAll;
        vm.showPaginationButtons = showPaginationButtons;
        vm.applySortByFilter = applySortByFilter;
        vm.print = print;
        vm.exportMatterAge = exportMatterAge;
        vm.scrollReachedBottom = scrollReachedBottom;
        vm.scrollReachedTop = scrollReachedTop;
        vm.init = init;
        vm.getMatterAgeData = getMatterAgeData;

        (function () {
            init();
        })();

        function init() {
            vm.matterLimit = initMatterLimit;
            //index of the clicked row
            vm.clickedRow = -1;
            vm.sorts = matterAgeReportHelper.getSorts();
            vm.matterAgeGrid = {
                headers: matterAgeReportHelper.matterAgeGrid(),
            };

            var persistedFilter = sessionStorage.getItem("matterAgeReportFilter");

            if (utils.isNotEmptyVal(persistedFilter)) {
                try {
                    vm.filter = JSON.parse(persistedFilter);
                    vm.selectedSort = _.find(vm.sorts, function (sort) {
                        return ((sort.param === vm.filter.sortby) && (sort.order === vm.filter.sortorder))
                    }).name;
                } catch (e) {
                    setFilterObj();
                }
            } else {
                setFilterObj();
            }

            vm.matterAgeList = [];
            getMatterAgeData(vm.filter);
        }

        function setFilterObj() {
            vm.filter = {
                //'for': 'mymatter',
                sortby: '1',
                sortorder: 'ASC',
                pageNum: 1,
                pageSize: pageSize,
                includeArchived: 0,
                isMyMatter: 1
            };

            vm.selectedSort = 'Matter name ASC';
        }

        function getMatterAgeData(filterObj) {
            vm.dataReceived = false;
            //persist filters
            var filters = angular.copy(vm.filter);
            filters.pageSize = pageSize;
            filters.pageNum = 1;
            filterObj.pageNum = 1;
            sessionStorage.setItem("matterAgeReportFilter", JSON.stringify(filters));
            matterAgeReportDatalayer
                .getMatterAgeList(filters)
                .then(function (response) {
                    var list = response.data.matters; //filterObj.for === 'mymatter' ? response.data.statusagereport : response.data.allstatusagereport;
                    matterAgeReportHelper.setDates(list);
                    //index of the clicked row
                    vm.total = response.data.max_cases_count;
                    vm.clickedRow = -1;
                    vm.matterAgeList = list;
                    vm.dataReceived = true;
                });
            // var count = matterAgeReportDatalayer.getMatterAgeCount(filterObj);
            // count.then(function (res) { vm.total = res.data[0] });
        }

        function filterByUser(forFilter) {
            //vm.filter['for'] = forFilter;
            vm.filter.isMyMatter = forFilter;
            vm.filter.pageNum = 1;
            vm.filter.pageSize = pageSize;
            getMatterAgeData(vm.filter);
        }

        function getMore() {
            vm.filter.pageNum += 1;
            vm.filter.pageSize = pageSize;
            matterAgeReportDatalayer
                .getMatterAgeList(vm.filter)
                .then(function (response) {
                    var list = response.data.matters; //vm.filter.for === 'mymatter' ? response.data.statusagereport : response.data.allstatusagereport;
                    matterAgeReportHelper.setDates(list);
                    vm.matterAgeList = vm.matterAgeList.concat(list);
                    vm.dataReceived = true;
                });
        }

        function getAll() {
            vm.filter.pageSize = 100000;
            vm.dataReceived = false;
            pageSize = 10000;
            getMatterAgeData(vm.filter);
        }

        function showPaginationButtons() {

            if (!vm.dataReceived) {
                return false;
            }

            if (angular.isUndefined(vm.matterAgeList) || vm.matterAgeList.length <= 0) {
                return false;
            }

            if (vm.filter.pageSize === 100000) {
                return false;
            }

            if (vm.matterAgeList.length < (vm.filter.pageSize * vm.filter.pageNum)) {
                return false
            }
            return true;
        }

        function applySortByFilter(sortBy) {
            vm.selectedSort = sortBy.name;
            vm.filter.sortby = sortBy.param;
            vm.filter.sortorder = sortBy.order;
            vm.filter.pageNum = 1;
            vm.filter.pageSize = pageSize;
            getMatterAgeData(vm.filter);
        }

        function print() {
            matterAgeReportHelper.print(vm.matterAgeList, vm.filter);
        }

        function exportMatterAge() {
            vm.filter.pageNum = 1;
            matterAgeReportDatalayer.exportMatterAge(vm.filter).then(function (response) {
                utils.downloadFile(response.data, "matter_age_report.xlsx", response.headers("Content-Type"));
            });
        }

        function scrollReachedBottom() {
            if (vm.matterLimit <= vm.total) {
                vm.matterLimit += initMatterLimit;
            }
        }

        function scrollReachedTop() {
            vm.matterLimit = initMatterLimit;
        }
    }

})(angular);


(function (angular) {

    angular.module('cloudlex.report')
        .factory('matterAgeReportHelper', matterAgeReportHelper);
    matterAgeReportHelper.$inject = ['globalConstants'];

    function matterAgeReportHelper(globalConstants) {
        return {
            matterAgeGrid: _matterAgeGrid,
            getSorts: _getSorts,
            setDates: _setDates,
            print: _print
        }

        function _matterAgeGrid() {
            return [{
                field: [{
                    prop: 'age',
                    showBig: true,
                    printDisplay: 'Age',

                }],
                displayName: 'Age(days)',
                dataWidth: 10
            }, {
                field: [{
                    prop: 'matter_name',
                    printDisplay: 'Matter Name',
                    href: { link: '#/matter-overview', paramProp: ['matter_id'] }
                }, {
                    prop: 'file_number',
                    label: 'File#',
                    printDisplay: 'File #'
                }, {
                    prop: 'index_number',
                    label: 'Index/Docket#',
                    printDisplay: 'Index/Docket#'
                }],
                displayName: 'Matter Name, File number, Index/Docket#',
                dataWidth: 40
            }, {
                field: [{
                    prop: 'status',
                    template: 'bold',
                    printDisplay: 'Status Name',

                }, {
                    prop: 'sub_status',
                    printDisplay: 'Substatus Name'
                }],
                displayName: 'Status & Substatus',
                dataWidth: 25

            },


            {
                field: [{
                    prop: 'date_of_incidence',
                    label: 'DOI: ',
                    printDisplay: 'DOI'
                }, {
                    prop: 'intake_date',
                    label: 'Intake: ',
                    printDisplay: 'Intake Date'
                }],
                displayName: 'DOI & Intake Date',
                dataWidth: 25

            }
            ];
        }

        function _getSorts() {
            var sorts = [{
                order: 'ASC',
                param: "1",
                name: 'Matter name ASC'
            }, {
                order: 'DESC',
                param: "3",
                name: 'Matter name DESC '
            }, {
                order: 'ASC',
                param: "4",
                name: 'Intake date old-new'
            }, {
                order: 'DESC',
                param: "5",
                name: 'Intake date new-old'
            }, {
                order: 'ASC',
                param: "6",
                name: 'Incident date old-new'
            }, {
                order: 'DESC',
                param: "7",
                name: 'Incident date new-old'
            }, {
                order: 'ASC',
                param: "2",
                name: 'File # ASC'
            }, {
                order: 'DESC',
                param: "8",
                name: 'File # DESC'
            }];

            return sorts;
        }

        function _setDates(ageList) {
            _.forEach(ageList, function (ageData) {
                if (angular.isDefined(ageData.date_of_incidence) && !_.isNull(ageData.date_of_incidence) && !utils.isEmptyString(ageData.date_of_incidence) && ageData.date_of_incidence != 0) {
                    ageData.date_of_incidence = moment.unix(ageData.date_of_incidence).utc().format('DD MMM YYYY');
                } else {
                    ageData.date_of_incidence = "   -   "
                }

                if (angular.isDefined(ageData.intake_date) && !_.isNull(ageData.intake_date) && !utils.isEmptyString(ageData.intake_date) && ageData.intake_date != 0) {
                    ageData.intake_date = moment.unix(ageData.intake_date).utc().format('DD MMM YYYY')
                } else {
                    ageData.intake_date = "   -   ";
                }
            });

        }

        function _print(matterAgeData, filterObj) {
            var sorts = _getSorts();
            var filtersForPrint = _getFiltersForPrint(filterObj, sorts);
            var headers = _matterAgeGrid();
            headers = _getPropsFromHeaders(headers);

            var printPage = _getPrintPage(filtersForPrint, headers, matterAgeData);
            window.open().document.write(printPage);
        }

        function _getFiltersForPrint(filterObj, sorts) {
            var filtersForPrint = {
                For: (filterObj.isMyMatter == 1 ? 'My Matters' : 'All Matters'),
                'Sort By': _.find(sorts, function (sort) {
                    return (sort.param === filterObj.sortby) && (sort.order === filterObj.sortorder)
                }).name
            }
            if (filterObj.includeArchived == 1) {
                filtersForPrint['Include Archived Matters'] = 'Yes';
            }
            return filtersForPrint;
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

        function _getPrintPage(filters, headers, matterAgeData) {
            var html = "<html><title>Matter Age Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; } table td { word-break:break-word }  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Matter Age Report</h1><div></div>";
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

                if (header.prop == 'age') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + header.display + "</th>";
                } else if (header.prop == 'file_number') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + header.display + "</th>";
                } else if (header.prop == 'index_number') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + header.display + "</th>";
                } else if (header.prop == 'date_of_incidence') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + header.display + "</th>";
                } else if (header.prop == 'intake_date') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + header.display + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + header.display + "</th>";
                }

            });
            html += '</tr>';


            angular.forEach(matterAgeData, function (age) {
                html += '<tr>';
                angular.forEach(headers, function (header) {
                    age[header.prop] = (_.isNull(age[header.prop]) || angular.isUndefined(age[header.prop]) || utils.isEmptyString(age[header.prop])) ? " - " : age[header.prop];
                    // console.log(header.prop);
                    if (header.prop == 'age') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + age[header.prop] + "</td>";
                    } else if (header.prop == 'file_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + age[header.prop] + "</td>";
                    } else if (header.prop == 'index_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + age[header.prop] + "</td>";
                    } else if (header.prop == 'date_of_incidence') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + age[header.prop] + "</td>";
                    } else if (header.prop == 'intake_date') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + age[header.prop] + "</td>";
                    } else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; padding:5px'>" + utils.removeunwantedHTML(age[header.prop]) + "</td>";
                    }


                })
                html += '</tr>'
            })


            html += "</body>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</table>";
            html += "</html>";
            return html;
        }
    }

})(angular);


(function (angular) {

    angular.module('cloudlex.report')
        .factory('matterAgeReportDatalayer', matterAgeReportDatalayer);

    matterAgeReportDatalayer.$inject = ['$http', 'globalConstants', '$q'];

    function matterAgeReportDatalayer($http, globalConstants, $q) {
        var url;
        if (!globalConstants.useApim) {
            url = globalConstants.javaWebServiceBaseV4 + 'reports/export-matterstatus-age-report'
        } else {
            url = globalConstants.matterBase + 'reports/v1/export-matterstatus-age-report'
        }
        var urls = {
            getMatterstatusAge: globalConstants.javaWebServiceBaseV4 + 'matter/get-matters-status-age',
            matterAgeExport: url,
            getMatterstatusAgeCount: globalConstants.javaWebServiceBaseV4 + 'reports/matter_status_age_count'
        };

        return {
            getMatterAgeList: _getMatterAgeList,
            getMatterAgeCount: _getMatterAgeCount,
            exportMatterAge: _exportMatterAge
        };

        function _getMatterAgeList(filterObj) {
            var query = utils.getParams(filterObj);
            var url = urls.getMatterstatusAge + '?' + query;
            return $http.get(url)
        }

        function _getMatterAgeCount(filterObj) {
            var query = utils.getParams(filterObj);
            var url = urls.getMatterstatusAgeCount + '?' + query;
            return $http.get(url)
        }

        function _exportMatterAge(filter) {
            filter.pageSize = 1000;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            var deferred = $q.defer();
            var url = urls.matterAgeExport;
            url += '?' + utils.getParams(filter); //'&sortby=' + filter.sortby + '&includeArchived=' + filter.includeArchived+ '&sortorder=' + filter.sortorder + '&tz=' + utils.getTimezone();
            // var url = intakeReportConstant.RESTAPI.allIntakeList;
            $http({
                url: url,
                method: "GET",
                headers: token,
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


})(angular);
