(function (angular) {

    'use strict';

    angular.module('cloudlex.report')
        .factory('documentReportHelper', documentReportHelper);

    documentReportHelper.$inject = ['globalConstants'];

    function documentReportHelper(globalConstants) {
        return {
            docReportGrid: _docReportGrid,
            getSorts: _getSorts,
            setDisplayDates: _setDisplayDates,
            setFilterObj: _setFilterObj,
            print: _print
        };

        function _docReportGrid() {
            return [{
                field: [{
                    prop: 'created_date',
                    printDisplay: 'Created Date'
                }],
                displayName: 'Created Date',
                dataWidth: 10
            }, {
                field: [{
                    prop: 'doc_name',
                    // href: { link: '#/matter-documents/view', paramProp: ['matterid', 'documentid'] },
                    printDisplay: 'Name'
                }],
                displayName: 'Name',
                dataWidth: 20
            }, {
                field: [{
                    prop: 'matter_name',
                    printDisplay: 'Matter Name',
                    href: { link: '#/matter-overview', paramProp: ['matter_id'] }
                },],
                displayName: 'Matter Name',
                dataWidth: 20

            }, {
                field: [{						//DOI show on grid for US#5886 
                    prop: 'dateofincidence',
                    printDisplay: 'Date of Incident'
                }],
                displayName: 'Date of Incident',
                dataWidth: '10'
            }, {
                field: [{
                    prop: 'last_updated',
                    printDisplay: 'Last Updated At'
                },],
                displayName: 'Last Updated At',
                dataWidth: '10'

            }, {
                field: [{
                    prop: 'last_updated_by_name',
                    printDisplay: 'Last Updated By',


                }],
                displayName: 'Last Updated By',
                dataWidth: '15'
            }, {
                field: [{
                    prop: 'created_by_name',
                    printDisplay: 'Created By'
                }],
                displayName: 'Created By ',
                dataWidth: '15'
            }]
        }

        function _getSorts() {
            var sorts = [{
                sort_by: "matter_name",
                sort_order: "ASC",
                name: "Matter name ASC"
            }, {
                sort_by: "matter_name",
                sort_order: "DESC",
                name: "Matter name DESC"
            }, {
                sort_by: "documentname",
                sort_order: "ASC",
                name: "Document name ASC"
            }, {
                sort_by: "documentname",
                sort_order: "DESC",
                name: "Document name DESC"
            },
            {
                sort_by: "docmodified_date",
                sort_order: "DESC",
                name: "Last updated DESC"
            },
            {
                sort_by: "createddate",
                sort_order: "DESC",
                name: "Date created DESC"
            }];

            return sorts;
        }

        function _setDisplayDates(docs) {
            _.forEach(docs, function (doc) {
                doc.created_date = utils.isNotEmptyVal(doc.created_date) ? moment.unix(doc.created_date).format('MM-DD-YYYY') : '-';
                doc.last_updated = utils.isNotEmptyVal(doc.last_updated) ? moment.unix(doc.last_updated).format('MM-DD-YYYY') : '-';
                if ((angular.isDefined(doc.matter.date_of_incidence) && !_.isNull(doc.matter.date_of_incidence) && !utils.isEmptyString(doc.matter.date_of_incidence) && doc.matter.date_of_incidence != 0 && doc.matter.date_of_incidence != '-')) {
                    doc.dateofincidence = moment.unix(doc.matter.date_of_incidence).utc().format('MM-DD-YYYY');
                } else {
                    doc.dateofincidence = "  -  "
                }
                doc.matter_name = doc.matter.matter_name;
                doc.matter_id = doc.matter.matter_id;
            });
        }

        function _setFilterObj(filter) {
            var filterObj = angular.copy(filter);
            filterObj.category_filter = utils.isNotEmptyVal(filterObj.category_filter) ? _.pluck(filterObj.category_filter, 'doc_category_id').toString() : '';
            return filterObj;
        }

        function _print(data, filter, categories, users) {
            var sorts = _getSorts();
            var filtersForPrint = _getFilterObj(sorts, filter, categories, users);

            var headers = _docReportGrid();
            headers = _getPropsFromHeaders(headers);

            var printPage = _getPrintPage(filtersForPrint, headers, data);
            window.open().document.write(printPage);
        }

        function _getFilterObj(sorts, filter, categories, users) {

            var sort = _.find(sorts, function (sort) {
                return (sort.sort_by === filter.sort_by && sort.sort_order === filter.sort_order);
            });

            var filterObj = {};

            if (utils.isNotEmptyVal(filter.date_filter)) {
                var start = moment.unix(filter.start_date).utc().format('MM-DD-YYYY');
                var end = moment.unix(filter.end_date).format('MM-DD-YYYY');

                var date_filter = filter.date_filter === 'createddate' ? 'Created date  ' : 'Last updated';
                filterObj[date_filter] = ' from: ' + start + '  to: ' + end;
            }

            if (utils.isNotEmptyVal(filter.category_filter)) {
                var cats = '';
                _.forEach(filter.category_filter, function (cat, index) {
                    cats += cat.doc_category_name + (index !== (filter.category_filter.length - 1) ? ', ' : '');
                });

                filterObj['Category'] = cats;
            } else {
                filterObj['Category'] = '';
            }


            if (utils.isNotEmptyVal(filter.updated_by_filter)) {
                var user = _.find(users, function (usr) {
                    return usr.uid == filter.updated_by_filter;
                });

                filterObj['Updated by'] = user.Name;
            } else {
                filterObj['Updated by'] = ''
            }

            if (utils.isNotEmptyVal(filter.created_by_filter)) {
                var user = _.find(users, function (usr) {
                    return usr.uid == filter.created_by_filter;
                });

                filterObj['Created by'] = user.Name;
            } else {
                filterObj['Created by'] = '';
            }

            filterObj['Sort By'] = sort.name;

            if (filter.need_to_be_Reviewed == 1) {
                filterObj['Needs Review'] = 'Yes';
            }
            else {
                filterObj['Needs Review'] = '';
            }
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

        function _getPrintPage(filters, headers, data) {
            var html = "<html><title>Document Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Document Report</h1><div></div>";
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
                if (header.prop == 'created_date') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + header.display + "</th>";
                } else if (header.prop == 'last_updated') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + header.display + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + header.display + "</th>";
                }

            });
            html += '</tr>';


            angular.forEach(data, function (age) {
                html += '<tr>';
                angular.forEach(headers, function (header) {
                    age[header.prop] = (_.isNull(age[header.prop]) || angular.isUndefined(age[header.prop]) || utils.isEmptyString(age[header.prop])) ? " - " : age[header.prop];

                    if (header.prop == 'created_date') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + age[header.prop] + "</td>";
                    } else if (header.prop == 'last_updated') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + age[header.prop] + "</td>";
                    } else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(age[header.prop]) + "</td>";
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

    'use strict';

    angular.module('cloudlex.report')
        .factory('documentReportDatalayer', documentReportDatalayer);

    documentReportDatalayer.$inject = ['$http', 'globalConstants', 'reportFactory'];

    function documentReportDatalayer($http, globalConstants, reportFactory) {
        var url1, url2, url3;
        if (!globalConstants.useApim) {
            url1 = globalConstants.javaWebServiceBaseV4 + 'reports/document-report?';
            url2 = globalConstants.javaWebServiceBaseV4 + 'reports/document-report-count?';
            url3 = globalConstants.javaWebServiceBaseV4 + 'reports/export-document?'
        } else {
            url1 = globalConstants.matterBase + 'reports/v1/document-report?';
            url2 = globalConstants.matterBase + 'reports/v1/document-report-count?';
            url3 = globalConstants.matterBase + 'reports/v1/export-document?'
        }
        var urls = {
            getDocumentList: url1,
            getDocumentCount: url2,
            documentCategories: globalConstants.javaWebServiceBaseV4 + 'documents/get-doc-categories',
            exportReport: url3
        };

        return {
            getDocumentStat: _getDocumentStat,
            getDocumentStatCount: _getDocumentStatCount,
            exportReport: _exportReport,
            getDocumentCategories: _getDocumentCategories,
        };

        function _getDocumentStat(filter) {
            var filtercopy = angular.copy(filter);
            delete filtercopy.quickFilters;
            var url = urls.getDocumentList + utils.getParamsNew(filtercopy);
            return $http.get(url);
        }

        function _getDocumentStatCount(filter) {
            var filtercopy = angular.copy(filter);
            delete filtercopy.quickFilters;
            var url = urls.getDocumentCount + utils.getParamsNew(filtercopy);
            return $http.get(url);
        }

        function _getDocumentCategories() {
            var url = urls.documentCategories;
            return $http.get(url);
        }

        function _exportReport(filter) {
            var filterObj = angular.copy(filter);
            //delete filterObj.page_num;
            //delete filterObj.page_size;
            filterObj.page_num = 1;
            filterObj.page_size = 1000;
            filterObj.category_filter = utils.isNotEmptyVal(filterObj.category_filter) ? _.pluck(filterObj.category_filter, 'doc_category_id').toString() : '';
            delete filterObj.quickFilters;
            var url = urls.exportReport + utils.getParamsNew(filterObj);
            reportFactory.ExportReportxlsx(url).then(function (response) {
                utils.downloadFile(response.data, "DocumentList.xlsx", response.headers("Content-Type"));

            })
            //var download = window.open(url, '_self');
        }



    }


})(angular);

(function (angular) {

    'use strict';

    angular.module('cloudlex.report')
        .controller('DocumentReportCtrl', DocumentReportCtrl);

    DocumentReportCtrl.$inject = ['$modal', 'documentReportDatalayer', 'documentReportHelper', 'contactFactory'];

    function DocumentReportCtrl($modal, documentReportDatalayer, documentReportHelper, contactFactory) {

        var vm = this,
            initDocLimit = 25,
            page_size = 250;

        vm.handleAll = handleAll;
        vm.reachedTop = reachedTop;
        vm.applySortByFilter = applySortByFilter;
        vm.filterdocReport = filterdocReport;
        vm.tagCancelled = tagCancelled;
        vm.print = print;
        vm.exportReport = exportReport;
        vm.showPaginationButtons = showPaginationButtons;
        vm.getMore = getMore;
        vm.getAll = getAll;

        (function () {
            //set clicked row index
            vm.clickedRow = -1;
            vm.sorts = documentReportHelper.getSorts();
            vm.users = [];
            vm.dataReceived = false;

            vm.docReportGrid = {
                headers: documentReportHelper.docReportGrid()
            };
            contactFactory.getUsersList()
                .then(function (users) {
                    vm.users = contactFactory.getFlatUserList(users);
                });
            setFilters();
            getDocumentReport(vm.filter);

            documentReportDatalayer.getDocumentCategories()
                .then(function (response) {
                    var data = response.data;
                    vm.categories = data;
                });

            vm.documentLimit = initDocLimit;
        })();

        function setFilters() {
            var persistedFilters = sessionStorage.getItem("docReportFilters");
            var defaultFilters = {
                page_size: page_size,
                page_num: 1,
                sort_order: vm.sorts[0].sort_order,
                sort_by: vm.sorts[0].sort_by
            };
            //set filters
            if (utils.isNotEmptyVal(persistedFilters)) {
                try {
                    vm.filter = JSON.parse(persistedFilters);
                } catch (e) {
                    vm.filter = defaultFilters;
                }
            } else { vm.filter = defaultFilters; }
            //set tags
            var persistedTags = sessionStorage.getItem("docReportTags");
            if (utils.isNotEmptyVal(persistedTags)) {
                try {
                    vm.tags = JSON.parse(persistedTags);
                } catch (e) {
                    vm.tags = [];
                }
            } else { vm.tags = [] }
            //set sort name
            vm.selectedSort = _.find(vm.sorts, function (sort) {
                return (sort.sort_by === vm.filter.sort_by && sort.sort_order === vm.filter.sort_order);
            }).name;
        }

        function persistFilters() {
            //persist filters
            var filter = angular.copy(vm.filter);
            filter.page_num = 1;
            filter.page_size = page_size;
            sessionStorage.setItem("docReportFilters", JSON.stringify(filter));
            //persist tags
            vm.tags = utils.isNotEmptyVal(vm.tags) ? vm.tags : [];
            sessionStorage.setItem("docReportTags", JSON.stringify(vm.tags));
        }

        function getDocumentReport(filter) {
            persistFilters();
            //set clicked row index
            vm.clickedRow = -1;
            var formattedFilters = documentReportHelper.setFilterObj(filter);
            documentReportDatalayer
                .getDocumentStat(formattedFilters)
                .then(function (response) {
                    vm.documentLimit = initDocLimit;
                    var data = response.data;
                    documentReportHelper.setDisplayDates(data);
                    vm.docReportList = data;
                    vm.dataReceived = true;
                });
            var count = documentReportDatalayer.getDocumentStatCount(formattedFilters);
            count.then(function (res) {
                vm.total = res.data;
            });
        }

        function handleAll() {
            if (vm.documentLimit <= vm.total) {
                vm.documentLimit = initDocLimit + vm.documentLimit;
            }
        }

        function reachedTop() {
            vm.documentLimit = initDocLimit;
        }

        function applySortByFilter(sort) {
            vm.filter.page_num = 1;
            vm.filter.page_size = page_size;
            vm.filter.sort_by = sort.sort_by;
            vm.selectedSort = sort.name;
            vm.filter.sort_order = sort.sort_order;
            vm.dataReceived = false;
            getDocumentReport(vm.filter);
        }

        function filterdocReport() {
            if (utils.isEmptyVal(vm.categories) || utils.isEmptyObj(vm.categories)) {
                return;
            }




            var filtercopy = angular.copy(vm.filter);
            filtercopy.start_date = (filtercopy.start_date) ? getFormatteddate(filtercopy.start_date) : '';
            filtercopy.end_date = (filtercopy.end_date) ? getFormatteddate(filtercopy.end_date) : '';
            var modalInstance = $modal.open({
                templateUrl: 'app/report/document-report/filter/doc-report-filter.html',
                controller: 'DocumentReportFilterCtrl as docFilter',
                windowClass: 'medicalIndoDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    filter: function () {
                        return filtercopy
                    },
                    categories: function () {
                        return vm.categories
                    }, tags: function () {
                        return vm.tags;
                    }
                }
            });

            modalInstance.result.then(function (filters) {
                vm.filter.page_num = 1;
                vm.filter.page_size = page_size;
                vm.tags = filters.tags;
                vm.users = filters.users;
                vm.dataReceived = false;
                vm.filter = filters.filter;
                vm.filter.page_num = 1;
                //persist filters
                persistFilters();

                getDocumentReport(filters.filter);

            }, function () {

            });
        }

        function getFormatteddate(epoch) {
            var formdate = new Date(epoch * 1000);
            formdate = moment(formdate).utc().format('MM/DD/YYYY');
            return formdate;
        }

        function tagCancelled(tag) {

            switch (tag.type) {
                case 'cat_filter':
                    var index = _.pluck(vm.filter.category_filter, 'doc_category_id').indexOf(tag.id);
                    vm.filter.category_filter.splice(index, 1);
                    break;
                case 'date_filter':
                    vm.filter.date_filter = "";
                    vm.filter.start_date = "";
                    vm.filter.end_date = "";
                    vm.filter.quickFilters = "";
                    break;
                case 'updated_by_filter':
                    vm.filter.updated_by_filter = "";
                    break;
                case 'created_by_filter':
                    vm.filter.created_by_filter = "";
                    break;
                case 'need_to_be_Reviewed':
                    vm.filter.need_to_be_Reviewed = 0;
                    break;
            }

            vm.dataReceived = false;
            vm.filter.page_num = 1;
            vm.filter.page_size = page_size;

            getDocumentReport(vm.filter);
            vm.filter.page_num = 1;
        }

        function print() {
            documentReportHelper.print(vm.docReportList, vm.filter, vm.categories, vm.users);
        }

        function exportReport() {
            documentReportDatalayer.exportReport(vm.filter);
        }

        function showPaginationButtons() {

            if (!vm.dataReceived) {
                return false;
            }

            if (angular.isUndefined(vm.docReportList) || vm.docReportList.length <= 0) {
                return false;
            }

            if (vm.filter.page_size === 'all') {
                return false;
            }

            if (vm.docReportList.length < (vm.filter.page_size * vm.filter.page_num)) {
                return false
            }
            return true;
        }

        function getMore() {
            vm.filter.page_num += 1;
            vm.filter.page_size = page_size;
            vm.dataReceived = false;
            var formattedFilters = documentReportHelper.setFilterObj(vm.filter);
            documentReportDatalayer
                .getDocumentStat(formattedFilters)
                .then(function (response) {
                    var data = response.data;
                    documentReportHelper.setDisplayDates(data);
                    vm.docReportList = vm.docReportList.concat(data);
                    vm.dataReceived = true;
                });
        }

        function getAll() {
            vm.filter.page_size = 'all';
            vm.dataReceived = false;
            getDocumentReport(vm.filter);
        }

    }

})(angular);