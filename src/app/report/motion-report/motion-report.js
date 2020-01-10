/**
 * Moition Report Motion helper
 **/
(function (angular) {

    'use strict';

    angular.module('cloudlex.report')
        .factory('motionReportHelper', motionReportHelper);

    motionReportHelper.$inject = ['globalConstants'];

    function motionReportHelper(globalConstants) {
        return {
            motionReportGrid: _motionReportGrid,
            getSorts: _getSorts,
            setDisplayDates: _setDisplayDates,
            setFilterObj: _setFilterObj,
            print: _print,
        };

        /* Returns grid headers and colum options */
        function _motionReportGrid() {
            return [{
                field: [{
                    prop: 'matter_name',
                    href: { link: '#/matter-overview', paramProp: ['matter_id'] },
                    printDisplay: 'Matter Name'
                }],
                displayName: 'Matter Name',
                dataWidth: 10
            }, {
                field: [{ //DOI show on grid for US#5886 
                    prop: 'dateofincidence',
                    printDisplay: 'Date of Incident'
                }],
                displayName: 'Date of Incident',
                dataWidth: '10'
            }, {
                field: [{
                    prop: 'motion_title',
                    printDisplay: 'Title'
                }],
                displayName: 'Title',
                dataWidth: 10
            }, {
                field: [{
                    prop: 'returnable_formated',
                    printDisplay: 'Returnable Date',
                },],
                displayName: 'Returnable Date',
                dataWidth: 9
            }, {
                field: [{
                    prop: 'service_date_formated',
                    printDisplay: 'Date of Service'
                },],
                displayName: 'Date of Service',
                dataWidth: 10
            }, {
                field: [{
                    prop: 'motion_type_name',
                    printDisplay: 'Type',
                }],
                displayName: 'Type',
                dataWidth: 10
            }, {
                field: [{
                    prop: 'motion_status_name',
                    printDisplay: 'Status'
                }],
                displayName: 'Status',
                dataWidth: 10
            }, {
                field: [{
                    prop: 'document_name',
                    // href: { link: '#/matter-documents/view', paramProp: ['matter_id', 'motion_documentid'] },
                    printDisplay: 'Document Name'
                }],
                displayName: 'Document Name',
                dataWidth: 10
            }, {
                field: [{
                    prop: 'judge_name',
                    printDisplay: 'Judge'
                }],
                displayName: 'Judge',
                dataWidth: 5
            }, {
                field: [{
                    prop: 'motion_daysoverdue',
                    printDisplay: 'Days overdue'
                }],
                displayName: 'Days overdue',
                dataWidth: 6
            }, {
                field: [{
                    prop: 'motion_datecreated',
                    printDisplay: 'Date Created'
                }],
                displayName: 'Date Created',
                dataWidth: 10
            }]
        }

        /* Return Grid sortign options */
        function _getSorts() {
            var sorts = [{
                sortBy: "returnable_date",
                sortOrder: "ASC",
                name: "Returnable date ASC"
            },
            {
                sortBy: "returnable_date",
                sortOrder: "DESC",
                name: "Returnable date DESC"
            },
            {
                sortBy: "service_date",
                sortOrder: "ASC",
                name: "Date of service ASC"
            },
            {
                sortBy: "service_date",
                sortOrder: "DESC",
                name: "Date of service DESC"
            },
            {
                sortBy: "judge",
                sortOrder: "ASC",
                name: "Judge ASC"
            },
            {
                sortBy: "judge",
                sortOrder: "DESC",
                name: "Judge DESC"
            },
            {
                sortBy: "days_overdue",
                sortOrder: "ASC",
                name: "Days overdue ASC"
            },
            {
                sortBy: "days_overdue",
                sortOrder: "DESC",
                name: "Days overdue DESC"
            },
            {
                sortBy: "matter_name",
                sortOrder: "ASC",
                name: "Matter name ASC"
            },
            {
                sortBy: "matter_name",
                sortOrder: "DESC",
                name: "Matter name DESC"
            },
            {
                sortBy: "doc_name",
                sortOrder: "ASC",
                name: "Document name ASC"
            },
            {
                sortBy: "doc_name",
                sortOrder: "DESC",
                name: "Document name DESC"
            }
            ];

            return sorts;
        }

        /* Implements dates display logic */
        function _setDisplayDates(motions) {
            _.forEach(motions, function (motion) {
                // motion.motion_datereturnable = (utils.isNotEmptyVal(motion.motion_datereturnable) && motion.motion_datereturnable != 0) ? moment.unix(motion.motion_datereturnable).utc().format('MM-DD-YYYY') : '-';
                //motion.service_date_formated = (utils.isNotEmptyVal(motion.service_date_formated) && motion.service_date_formated != 0) ? moment.unix(motion.service_date_formated).utc().format('MM-DD-YYYY') : '-';
                motion.motion_datecreated = (utils.isNotEmptyVal(motion.motion_datecreated) && motion.motion_datecreated != 0) ? moment.unix(motion.motion_datecreated).format('MM-DD-YYYY') : '-';
                motion.dateofincidence = (utils.isNotEmptyVal(motion.matter.date_of_incidence) && motion.matter.date_of_incidence != 0) ? moment.unix(motion.matter.date_of_incidence).utc().format('MM-DD-YYYY') : '-';

                motion.motion_title = (utils.isNotEmptyVal(motion.motion_title) && motion.motion_title != 0) ? motion.motion_title : '-';
                motion.motion_type_name = (utils.isNotEmptyVal(motion.motion_type_name) && motion.motion_type_name != 0) ? motion.motion_type_name : '-';
                motion.motion_status_name = (utils.isNotEmptyVal(motion.motion_status_name) && motion.motion_status_name != 0) ? motion.motion_status_name : '-';
                motion.judge_name = (utils.isNotEmptyVal(motion.judge_name) && motion.judge_name != 0) ? motion.judge_name : '-';
                motion.matter_name = motion.matter.matter_name;
                motion.matter_id = motion.matter.matter_id;

            });
        }

        /* Formate the filters before sendign API call */
        function _setFilterObj(filter) {
            var filterObj = angular.copy(filter);
            if (utils.isNotEmptyVal(filterObj.typeIds)) {
                filterObj.motion_type = filterObj.typeIds;
            }
            if (utils.isNotEmptyVal(filterObj.statusIds)) {
                filterObj.motion_status = filterObj.statusIds;
            }
            if (utils.isNotEmptyVal(filterObj.matter_id)) {
                filterObj.matter_id = filterObj.matter_id.matterid;
            }
            delete filterObj.typeIds;
            delete filterObj.statusIds;
            delete filterObj.quickFilters;
            delete filterObj.need_to_be_reviewed;
            delete filterObj.need_to_be;
            delete filterObj.needToBeReviewed;
            delete filterObj.reviewUser;
            return filterObj;
        }

        /* Call back for getting print pade headers, filters and data */
        function _print(data, filter, users) {
            var sorts = _getSorts();
            var filtersForPrint = _getPrintFilterObj(sorts, filter, users);

            var headers = _motionReportGrid();
            headers = _getPropsFromHeaders(headers);

            var printPage = _getPrintPage(filtersForPrint, headers, data, filter.motion_on_by);
            window.open().document.write(printPage);
        }

        /* Creats filters for print page */
        function _getPrintFilterObj(sorts, filter, users) {
            var sort = _.find(sorts, function (sort) {
                return (sort.sortBy === filter.sort_by && sort.sortOrder === filter.sort_order);
            });

            var filterObj = {};

            if (utils.isNotEmptyVal(filter.date_filter)) {
                var start = moment.unix(filter.start_date).utc().format('MM-DD-YYYY');
                var end = moment.unix(filter.end_date).utc().format('MM-DD-YYYY');

                var dateFilter = filter.date_filter === 'createddate' ? 'Created date  ' : 'Last updated';
                filterObj[dateFilter] = ' from: ' + start + '  to: ' + end;
            }

            if (utils.isNotEmptyVal(filter.motion_type)) {
                var types = '';
                _.forEach(filter.motion_type, function (type, index) {
                    if (type.id == "10") {
                        types += "{Blank}" + (index !== (filter.motion_type.length - 1) ? ', ' : '');
                    } else {
                        types += type.name + (index !== (filter.motion_type.length - 1) ? ', ' : '');
                    }
                });

                filterObj['Motion Type'] = types;
            } else {
                filterObj['Motion Type'] = '';
            }

            if (utils.isNotEmptyVal(filter.motion_status)) {
                var statuses = '';
                _.forEach(filter.motion_status, function (status, index) {
                    if (status.id == "8") {
                        statuses += "{Blank}" + (index !== (filter.motion_status.length - 1) ? ', ' : '');
                    } else {
                        statuses += status.name + (index !== (filter.motion_status.length - 1) ? ', ' : '');
                    }
                });

                filterObj['Motion Status'] = statuses;
            } else {
                filterObj['Motion Status'] = '';
            }

            if (utils.isNotEmptyVal(filter.matter_id)) {
                filterObj['Matter'] = filter.matter_id.name;
            } else {
                filterObj['Matter'] = '';
            }

            if (utils.isNotEmptyVal(filter.updated_by_filter)) {
                var user = _.find(users, function (usr) {
                    return usr.uid == filter.updated_by_filter;
                });

                filterObj['Updated by'] = user.name;
            } else {
                filterObj['Updated by'] = ''
            }

            if (utils.isNotEmptyVal(filter.created_by_filter)) {
                var user = _.find(users, function (usr) {
                    return usr.uid == filter.created_by_filter;
                });

                filterObj['Created by'] = user.name;
            } else {
                filterObj['Created by'] = '';
            }

            filterObj['Sort By'] = sort.name;

            if (filter.need_to_be_Reviewed == 1) {
                filterObj['Needs Review'] = 'Yes';
            } else {
                filterObj['Needs Review'] = '';
            }

            return filterObj;

        }

        /* Creates header for print page */
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

        /* Creates HTMl for pritn page */
        function _getPrintPage(filters, headers, data, motion_on_by) {
            if (motion_on_by === 'on') {
                var title = 'Motion on us Report';
            } else {
                var title = 'Motion by us Report';
            }
            var html = "<html><title>" + title + "</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>" + title + "</h1><div></div>";
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
                if (header.prop == 'createdDate') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + header.display + "</th>";
                } else if (header.prop == 'lastUpdated') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + header.display + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + header.display + "</th>";
                }

            });
            html += '</tr>';


            angular.forEach(data, function (age) {
                html += '<tr>';
                angular.forEach(headers, function (header) {
                    age[header.prop] = (_.isNull(age[header.prop]) || angular.isUndefined(age[header.prop]) || utils.isEmptyString(age[header.prop])) ? " - " : utils.removeunwantedHTML(age[header.prop]);

                    if (header.prop == 'createdDate') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + age[header.prop] + "</td>";
                    } else if (header.prop == 'lastUpdated') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + age[header.prop] + "</td>";
                    } else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + age[header.prop] + "</td>";
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

/**
 * Moition Report Motion Dala layer
 **/
(function (angular) {

    'use strict';

    angular.module('cloudlex.report')
        .factory('motionReportDatalayer', motionReportDatalayer);

    motionReportDatalayer.$inject = ['$http', 'globalConstants', 'reportFactory'];

    function motionReportDatalayer($http, globalConstants, reportFactory) {
        var url1, url2, url3;
        if (!globalConstants.useApim) {
            url1 = globalConstants.javaWebServiceBaseV4 + 'reports/motion-report?';
            url2 = globalConstants.javaWebServiceBaseV4 + 'reports/motion-report-count?';
            url3 = globalConstants.javaWebServiceBaseV4 + 'reports/export-motion?'
        } else {
            url1 = globalConstants.matterBase + 'reports/v1/motion-report?';
            url2 = globalConstants.matterBase + 'reports/v1/motion-report-count?';
            url3 = globalConstants.matterBase + 'reports/v1/export-motion?'
        }
        /* API URL declaration */
        var urls = {
            getMotionList: url1,
            getMotionListCount: url2,
            exportReport: url3
        };

        return {
            getMotionStat: _getMotionStat,
            getMotionStatCount: _getMotionStatCount,
            exportReport: _exportReport,
        };

        /* Callbak to get motion report data */
        function _getMotionStat(filter) {
            var url = urls.getMotionList + utils.getParamsNew(filter);
            return $http.get(url);
        }

        function _getMotionStatCount(filter) {
            var url = urls.getMotionListCount + utils.getParamsNew(filter);
            return $http.get(url);
        }

        /* Callbak to export motion report data */
        function _exportReport(filter) {
            var filterObj = angular.copy(filter);
            //delete filterObj.page_num;
            // delete filterObj.page_size;
            if (utils.isNotEmptyVal(filterObj.typeIds))
                filterObj.motion_type = filterObj.typeIds;
            if (utils.isNotEmptyVal(filterObj.statusIds))
                filterObj.motion_status = filterObj.statusIds;

            if (utils.isNotEmptyVal(filterObj.matter_id))
                filterObj.matter_id = filterObj.matter_id.matterid;

            // delete filterObj.typeIds;
            //  delete filterObj.statusIds;
            delete filterObj.quickFilters;
            filterObj.page_num = 1;
            filterObj.page_size = 1000;
            var url = urls.exportReport + utils.getParamsNew(filterObj);
            reportFactory.ExportReportxlsx(url).then(function (response) {
                utils.downloadFile(response.data, "MotionList.xlsx", response.headers("Content-Type"));

            })
            //var download = window.open(url, '_self');
        }

    }


})(angular);

/**
 * Moition Report Motion controller
 **/
(function (angular) {

    'use strict';

    angular.module('cloudlex.report')
        .controller('MotionReportCtrl', MotionReportCtrl);

    MotionReportCtrl.$inject = ['$modal', 'motionReportDatalayer', 'motionReportHelper', 'masterData', 'contactFactory'];

    function MotionReportCtrl($modal, motionReportDatalayer, motionReportHelper, masterData, contactFactory) {

        var vm = this,
            initMotionLimit = 15,
            pageSize = 250;
        var typeIds = [];
        var statusIds = [];
        vm.reachedBottom = reachedBottom;
        vm.reachedTop = reachedTop;
        vm.applySortByFilter = applySortByFilter;
        vm.filtermotionReport = filtermotionReport;
        vm.tagCancelled = tagCancelled;
        vm.print = print;
        vm.exportReport = exportReport;
        vm.showPaginationButtons = showPaginationButtons;
        vm.getMore = getMore;
        vm.getAll = getAll;
        vm.filterByMotion = filterByMotion;
        var masterDataObj = masterData.getMasterData();
        /* initial function calls */
        (function () {

            vm.sorts = motionReportHelper.getSorts();
            vm.selectedSort = vm.sorts[0].name;
            vm.users = [];
            vm.dataReceived = false;
            vm.clickedRow = -1;

            var persistedFilters = sessionStorage.getItem("motionReportFilters");
            if (utils.isNotEmptyVal(persistedFilters)) {
                try {
                    persistedFilters = JSON.parse(persistedFilters);
                    vm.filter = persistedFilters;
                    var seletedSort = _.filter(vm.sorts, function (venue) {
                        return venue.sortBy == vm.filter.sort_by && venue.sortOrder == vm.filter.sort_order;
                    });
                    vm.selectedSort = seletedSort ? seletedSort[0].name : vm.sorts[0].name;;
                    contactFactory.getUsersList()
                        .then(function (users) {
                            vm.users = contactFactory.getFlatUserList(users);
                            vm.tags = generateTags();
                        });
                } catch (err) {
                    setDefaultfilter();
                }
            } else {
                setDefaultfilter();
            }

            vm.motionReportGrid = {
                headers: motionReportHelper.motionReportGrid()
            };
            getMotionReport(vm.filter);
            vm.motionLimit = initMotionLimit;
        })();

        /* Declares filters object */
        function setDefaultfilter() {
            contactFactory.getUsersList()
                .then(function (users) {
                    vm.users = contactFactory.getFlatUserList(users);
                });
            vm.filter = {
                page_size: pageSize,
                page_num: 1,
                sort_order: vm.sorts[0].sortOrder,
                sort_by: vm.sorts[0].sortBy,
                motion_on_by: 'on',
                motion_type: '',
                motion_status: '',
                matter_id: '',
                date_filter: '',
                start_date: '',
                end_date: '',
                updated_by_filter: '',
                created_by_filter: '',
                typeIds: '',
                statusIds: '',
                need_to_be_Reviewed: 0,
            };
        }

        /* Gets motion report data */
        function getMotionReport(filter) {
            //persist filters
            var filterForStorage = angular.copy(vm.filter);
            filterForStorage.page_size = pageSize;
            filterForStorage.page_num = 1;
            sessionStorage.setItem("motionReportFilters", JSON.stringify(filterForStorage));
            var formattedFilters = motionReportHelper.setFilterObj(filter);

            motionReportDatalayer
                .getMotionStat(formattedFilters)
                .then(function (response) {
                    //init selected row index
                    vm.clickedRow = -1;
                    vm.motionLimit = initMotionLimit;
                    var data = response.data;
                    motionReportHelper.setDisplayDates(data);
                    vm.motionReportList = data;
                    vm.dataReceived = true;
                });

            var count = motionReportDatalayer.getMotionStatCount(formattedFilters);
            count.then(function (res) { vm.total = res.data; });
        }

        /* Get all data of motion report */
        function reachedBottom() {
            if (vm.motionLimit <= vm.total) {
                vm.motionLimit = initMotionLimit + vm.motionLimit;
            }
        }

        /* check whether the total limit has been reached */
        function reachedTop() {
            vm.motionLimit = initMotionLimit;
        }

        /* Applies sorting and call fn to get report data */
        function applySortByFilter(sort) {
            vm.filter.page_num = 1;
            vm.filter.page_size = pageSize;
            vm.filter.sort_by = sort.sortBy;
            vm.selectedSort = sort.name;
            vm.filter.sort_order = sort.sortOrder;
            vm.dataReceived = false;
            getMotionReport(vm.filter);
        }
        function getFormatteddate(epoch) {
            var formdate = new Date(epoch * 1000);
            formdate = moment(formdate).utc().format('MM/DD/YYYY');
            return formdate;
        }
        /* Callback to opent the filter model and apply report filter */
        function filtermotionReport() {
            var motionfilter = angular.copy(vm.filter);
            motionfilter.start_date = (motionfilter.start_date) ? getFormatteddate(motionfilter.start_date) : '';
            motionfilter.end_date = (motionfilter.end_date) ? getFormatteddate(motionfilter.end_date) : '';




            var modalInstance = $modal.open({
                templateUrl: 'app/report/motion-report/filter/motion-report-filter.html',
                controller: 'MotionReportFilterCtrl as motionFilter',
                windowClass: 'medicalIndoDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    filter: function () {
                        return motionfilter
                    },
                    users: function () {
                        return vm.users
                    },
                    tags: function () {
                        return vm.tags;
                    }
                }
            });

            modalInstance.result.then(function (filters) {
                vm.filter.page_num = 1;
                vm.filter.page_size = pageSize;
                vm.filter = filters.filter;
                vm.dataReceived = false;
                vm.tags = generateTags();
                vm.filter.typeIds = filters.filter.typeIds = (utils.isNotEmptyVal(typeIds)) ? typeIds : "";
                vm.filter.statusIds = filters.filter.statusIds = (utils.isNotEmptyVal(statusIds)) ? statusIds : "";
                getMotionReport(filters.filter);

            }, function () {

            });
        }

        /* Creates filter tags */
        function generateTags() {
            var tags = [];
            typeIds = [];

            if (utils.isNotEmptyVal(vm.filter.motion_type)) {
                _.forEach(vm.filter.motion_type, function (type) {
                    if (type.id == "10") {
                        var tagObj = {
                            type: 'motion_type',
                            key: "t" + type.id,
                            id: type.id,
                            value: 'Type: {Blank}'
                        };
                    } else {
                        var tagObj = {
                            type: 'motion_type',
                            key: "t" + type.id,
                            id: type.id,
                            value: 'Type: ' + type.name
                        };
                    }
                    typeIds.push(type.id);
                    tags.push(tagObj);

                });
            }

            statusIds = [];
            if (utils.isNotEmptyVal(vm.filter.motion_status)) {
                _.forEach(vm.filter.motion_status, function (status) {
                    if (status.id == "8") {
                        var tagObj = {
                            type: 'motion_status',
                            key: "s" + status.id,
                            id: status.id,
                            value: 'Status: {Blank}'
                        };
                    } else {
                        var tagObj = {
                            type: 'motion_status',
                            key: "s" + status.id,
                            id: status.id,
                            value: 'Status: ' + status.name
                        };
                    }

                    statusIds.push(status.id);
                    tags.push(tagObj);
                });
            }

            if (utils.isNotEmptyVal(vm.filter.matter_id)) {
                var tagObj = {
                    type: 'matter_id',
                    key: vm.filter.matter_id.matterid,
                    id: vm.filter.matter_id.matterid,
                    value: 'Matter: ' + vm.filter.matter_id.name
                };
                tags.push(tagObj);
            }

            if (utils.isNotEmptyVal(vm.filter.date_filter) &&
                (utils.isNotEmptyVal(vm.filter.start_date) && utils.isNotEmptyVal(vm.filter.end_date))) {
                var start = moment.unix(vm.filter.start_date).utc().format('MM-DD-YYYY');
                var end = moment.unix(vm.filter.end_date).utc().format('MM-DD-YYYY');
                var tag = {
                    type: 'date_filter',
                    key: 'date_filter',
                    value: (vm.filter.date_filter === 'createddate' ? 'created date  ' : 'last updated  ') +
                        ' from: ' + start + '  to: ' + end
                };
                tags.push(tag);
            }

            if (utils.isNotEmptyVal(vm.filter.updated_by_filter)) {
                var updatedByUser = {};
                var user = _.find(vm.users, function (usr) {
                    return usr.uid == vm.filter.updated_by_filter;
                });

                updatedByUser.value = 'Updated by: ' + user.Name;
                updatedByUser.key = 'updatedByFilter';
                updatedByUser.type = 'updatedByFilter';
                tags.push(updatedByUser);
            }

            if (utils.isNotEmptyVal(vm.filter.created_by_filter)) {
                var createdByUser = {};
                var user = _.find(vm.users, function (usr) {
                    return usr.uid == vm.filter.created_by_filter;
                });

                createdByUser.value = 'Created by: ' + user.Name;
                createdByUser.key = 'createdByFilter';
                createdByUser.type = 'createdByFilter';
                tags.push(createdByUser);
            }

            if (utils.isNotEmptyVal(vm.filter.need_to_be_Reviewed) && vm.filter.need_to_be_Reviewed) {
                var tagObj = {

                    key: 'need_to_be_Reviewed',
                    type: 'need_to_be_Reviewed',
                    value: 'Needs Review'
                };
                tags.push(tagObj);
            }

            return tags;
        }

        /* Call back funtion for when filter tag is calncelled */
        function tagCancelled(tag) {

            switch (tag.type) {
                case 'motion_type':
                    var index = _.pluck(vm.filter.motion_type, 'id').indexOf(tag.id);
                    vm.filter.motion_type.splice(index, 1);
                    if (vm.filter.motion_type.length > 0) {
                        vm.filter.typeIds = [];
                        _.forEach(vm.filter.motion_type, function (type) {
                            vm.filter.typeIds.push(type.id);
                        });
                        vm.filter.typeIds = vm.filter.typeIds;
                    } else {
                        vm.filter.typeIds = "";
                    }
                    break;
                case 'motion_status':
                    var index = _.pluck(vm.filter.motion_status, 'id').indexOf(tag.id);
                    vm.filter.motion_status.splice(index, 1);
                    if (vm.filter.motion_status.length > 0) {
                        vm.filter.statusIds = [];
                        _.forEach(vm.filter.motion_status, function (status) {
                            vm.filter.statusIds.push(status.id);
                        });
                        vm.filter.statusIds = vm.filter.statusIds;
                    } else {
                        vm.filter.statusIds = "";
                    }
                    break;
                case 'matter_id':
                    vm.filter.matter_id = "";
                    break;
                case 'date_filter':
                    vm.filter.date_filter = "";
                    vm.filter.start_date = "";
                    vm.filter.end_date = "";
                    vm.filter.quickFilters = "";
                    break;
                case 'updatedByFilter':
                    vm.filter.updated_by_filter = "";
                    break;
                case 'createdByFilter':
                    vm.filter.created_by_filter = "";
                    break;
                case 'need_to_be_Reviewed':
                    vm.filter.need_to_be_Reviewed = 0;
                    break;

            }

            vm.dataReceived = false;
            vm.filter.page_num = 1;
            vm.filter.page_size = pageSize;
            var filtercopy = angular.copy(vm.filter);
            filtercopy.typeIds = filtercopy.typeIds.toString();
            filtercopy.statusIds = filtercopy.statusIds.toString();
            getMotionReport(filtercopy);
            vm.filter.pageNum = 1;
        }

        /* Calls print helper */
        function print() {
            motionReportHelper.print(vm.motionReportList, vm.filter, vm.users);
        }

        /* Calls export helper */
        function exportReport() {
            motionReportDatalayer.exportReport(vm.filter);
        }

        /* check whether to show more and all buttons*/
        function showPaginationButtons() {

            if (!vm.dataReceived) {
                return false;
            }

            if (angular.isUndefined(vm.motionReportList) || vm.motionReportList.length <= 0) {
                return false;
            }

            if (vm.filter.page_size === 'all') {
                return false;
            }

            if (vm.motionReportList.length < (vm.filter.page_size * vm.filter.page_num)) {
                return false
            }
            return true;
        }

        /* Callback to get more data according to pagination */
        function getMore() {
            vm.filter.page_num += 1;
            vm.filter.page_size = pageSize;
            vm.dataReceived = false;
            var formattedFilters = motionReportHelper.setFilterObj(vm.filter);
            motionReportDatalayer
                .getMotionStat(formattedFilters)
                .then(function (response) {
                    var data = response.data;
                    motionReportHelper.setDisplayDates(data);
                    vm.motionReportList = vm.motionReportList.concat(data);
                    vm.dataReceived = true;
                });
        }

        /* Callback to get all report data */
        function getAll() {
            vm.filter.page_size = 'all';
            vm.dataReceived = false;
            getMotionReport(vm.filter);
        }

        /* Callback to chaneg motion on and by tabs */
        function filterByMotion(val) {
            vm.filter.motion_on_by = val;
            vm.dataReceived = false;
            getMotionReport(vm.filter);
        }

    }

})(angular);