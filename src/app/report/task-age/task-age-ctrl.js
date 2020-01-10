(function (angular) {

    angular.module('cloudlex.report')
        .controller('TaskAgeReportCtrl', TaskAgeReportCtrl);


    TaskAgeReportCtrl.$inject = ['$modal', 'reportFactory', 'masterData', 'taskAgeDatalayer', 'taskAgeHelper'];

    function TaskAgeReportCtrl($modal, reportFactory, masterData, taskAgeDatalayer, taskAgeHelper) {
        var vm = this,
            pageSize = 250,
            initTasklimit = 10,
            users = [];

        vm.filterByUser = filterByUser;
        vm.applySortByFilter = applySortByFilter;
        vm.filterTaskAge = filterTaskAge;
        vm.tagCancelled = tagCancelled;
        vm.exportReport = exportReport;
        vm.print = print;
        vm.getMore = getMore;
        vm.getAll = getAll;
        vm.showPaginationButtons = showPaginationButtons;
        vm.scrollReachedBottom = scrollReachedBottom;
        vm.scrollReachedTop = scrollReachedTop;
        vm.priorityList = [{ "id": 3, "name": "High", "showName": "High" }, { "id": 1, "name": "Low", "showName": "Low" }, { "id": 2, "name": "Medium", "showName": "Normal" }];

        (function () {
            vm.sorts = taskAgeHelper.getSorts();
            vm.taskLimit = initTasklimit;
            //init clicked row index
            vm.clickedRow = -1;
            var persistedFilter = sessionStorage.getItem("taskAgeReportFilters");

            if (utils.isNotEmptyVal(persistedFilter)) {
                try {
                    vm.filter = JSON.parse(persistedFilter);
                    taskAgeDatalayer.getUsersInFirm()
                        .then(function (response) {
                            users = response.data;
                            vm.filter.assignedTo = vm.filter.assignedTo;
                            vm.tags = taskAgeHelper.generateTags(vm.filter, users);
                            vm.selectedSort = _.find(vm.sorts, function (sort) {
                                return (sort.sortBy === vm.filter.sortBy && sort.sortOrder === vm.filter.sortOrder);
                            }).name;
                        });
                } catch (e) {
                    setFilters();
                    getUsersInFirm();
                }
            } else {
                setFilters();
                getUsersInFirm();
            }

            vm.dataReceived = false;
            vm.taskAgeGrid = {
                headers: taskAgeHelper.taskAgeGrid()
            };

            getTasks(vm.filter);
        })();


        function setFilters() {
            var defaultSort = _.find(vm.sorts, function (sort) {
                return (sort.sortBy === 'matter_name' && sort.sortOrder === 'ASC');
            });

            vm.selectedSort = defaultSort.name;

            vm.filter = {
                pageNum: 1,
                pageSize: pageSize,
                'for': 'mytask',
                sortBy: defaultSort.sortBy,
                sortOrder: defaultSort.sortOrder,

                priority: []
            };
        }

        function getUsersInFirm() {
            taskAgeDatalayer.getUsersInFirm()
                .then(function (response) {
                    users = response.data;
                });
        }

        function getTasks(filter) {
            //persist filters
            var appliedFilters = angular.copy(vm.filter);
            appliedFilters.pageSize = pageSize;
            appliedFilters.pageNum = 1;
            var filterCopy = angular.copy(filter);

            if (angular.isDefined(filterCopy.priority) && filterCopy.priority.length != 0) {
                var priority = [];
                _.forEach(vm.priorityList, function (pList) {
                    _.forEach(filterCopy.priority, function (data) {
                        if (pList.showName == data.showName) {
                            priority.push(encodeURIComponent(pList.showName));
                        }
                    });
                });
                filterCopy.priority = priority;
            } else {
                filterCopy.priority = [];
            }

            //init clicked row index
            vm.clickedRow = -1;
            sessionStorage.setItem("taskAgeReportFilters", JSON.stringify(appliedFilters));
            vm.taskLimit = initTasklimit;

            if (filterCopy.selectedmatter && typeof filterCopy.selectedmatter == "object") {
                filterCopy.matterid = filterCopy.selectedmatter.matterid;
                delete filterCopy.selectedmatter;
            }
            var filterObj = taskAgeHelper.getFilterObject(filterCopy);
            var promesa = reportFactory.getTaskAgeData(filterObj);
            promesa.then(function (response) {
                processData(response);
                vm.total = (utils.isNotEmptyVal(response.totalCount)) ? parseInt(response.totalCount) : 0;
                var data = response.tasks;
                _.forEach(data, function (item) {
                    item.assigned_to_ids = utils.isNotEmptyVal(item.assigned_to_ids) ? item.assigned_to_ids : '';
                    item.assigned_to_user = utils.isNotEmptyVal(item.assigned_to_user) ? item.assigned_to_user : '';
                })
                vm.taskAgeList = data;

                vm.dataReceived = true;
            }, function (reason) { });
        }
        function processData(response) {
            _.forEach(response.tasks, function (item) {
                item.assignmentDate = (item.assignment_date == 0) ? "-" : moment.unix(item.assignment_date).utc().format('MM-DD-YYYY');
                item.dateofIncidence = (item.date_of_incidence == 0) ? "-" : moment.unix(item.date_of_incidence).utc().format('MM-DD-YYYY');
                item.dueDate = (item.due_date == 0) ? "-" : moment.unix(item.due_date).utc().format('MM-DD-YYYY');
                item.matter_name = item.matter ? item.matter.matter_name : "";
                item.taskname = item.task_name ? item.task_name : "";
                item.status = item.status ? item.status : "";
                item.matter_id = item.matter.matter_id ? item.matter.matter_id : 0;
            });
            utils.replaceNullByEmptyStringArray(response.tasks);
        }
        function filterByUser(taskFor) {


            vm.filter.pageNum = 1;
            vm.filter.pageSize = pageSize;

            if (taskFor === 'mytask') {
                vm.filter.mytask = 1;
                vm.filter.assignedTo = "";
                vm.tags = taskAgeHelper.generateTags(vm.filter, users);
                vm.filter.for = 'mytask';
            }
            else {
                vm.filter.mytask = 0;
                vm.filter.for = 'alltask';

            }

            getTasks(vm.filter);
        }

        function applySortByFilter(sort) {
            vm.filter.pageNum = 1;
            vm.filter.pageSize = pageSize;
            vm.filter.sortBy = sort.sortBy;
            vm.filter.sortOrder = sort.sortOrder;
            vm.selectedSort = sort.name;

            if (vm.filter.for == "alltask") {
                vm.filter.mytask = vm.filter.mytask;
            } else {
                vm.filter.mytask = 1;
            }
            getTasks(vm.filter);
        }

        function filterTaskAge() {
            var taskagefilter = angular.copy(vm.filter);
            taskagefilter.s = (taskagefilter.s) ? getFormatteddate(taskagefilter.s) : '';
            taskagefilter.e = (taskagefilter.e) ? getFormatteddate(taskagefilter.e) : '';
            taskagefilter.dueStartDate = (taskagefilter.dueStartDate) ? getFormatteddate(taskagefilter.dueStartDate) : '';
            taskagefilter.dueEndDate = (taskagefilter.dueEndDate) ? getFormatteddate(taskagefilter.dueEndDate) : '';




            var modalInstance = $modal.open({
                templateUrl: 'app/report/task-age/filter-pop-up/filter.html',
                controller: 'TaskAgeFilterCtrl as taskAgeFilter',
                windowClass: 'valuation-window',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    filter: function () {
                        return taskagefilter;
                    },
                    tags: function () {
                        return vm.tags;
                    }
                }
            });

            modalInstance.result.then(function (filterObj) {
                vm.filter = angular.extend(vm.filter, filterObj.filter);
                vm.filter.pageNum = 1;
                vm.filter.pageSize = pageSize;
                var assignTo = utils.isNotEmptyVal(vm.filter.assignedTo) ? vm.filter.assignedTo : '';
                vm.filter.assignedTo = assignTo;
                vm.tags = taskAgeHelper.generateTags(vm.filter, users);
                getTasks(vm.filter);

            }, function () {

            });
        }

        function getFormatteddate(epoch) {
            var formdate = new Date(epoch * 1000);
            formdate = moment(formdate).utc().format('MM/DD/YYYY');
            return formdate;
        }

        function tagCancelled(filter) {
            if (filter.type == "priority") {
                var currentFilters = _.pluck(vm.filter.priority, 'id');
                var index = currentFilters.indexOf(filter.key);
                vm.filter.priority.splice(index, 1);
            }
            switch (filter.key) {
                case 'assignedTo':
                    vm.filter.assignedTo = "";
                    break;
                case 'assignedBy':
                    vm.filter.assignedBy = "";
                    break;
                case 'assignmentDateRange':
                    vm.filter.s = ""
                    vm.filter.e = ""
                    break;
                case 'dueDateRange':
                    vm.filter.dueStartDate = "";
                    vm.filter.dueEndDate = "";
                    break;
                case 'matter':
                    delete vm.filter.selectedmatter;
                    break;
            }
            vm.filter.pageNum = 1;
            getTasks(vm.filter);
            vm.filter.pageNum = 1;
        }

        function exportReport() {
            vm.filter.pageNum = 1; // Set 1 for export
            var filterObj = angular.copy(vm.filter);
            
            if (angular.isDefined(filterObj.priority) && filterObj.priority.length != 0) {
                var priority = [];
                _.forEach(vm.priorityList, function (pList) {
                    _.forEach(filterObj.priority, function (data) {
                        if (pList.showName == data.showName) {
                            priority.push(encodeURIComponent(pList.showName));
                        }
                    });
                });
                filterObj.priority = priority;
            } else {
                filterObj.priority = "";
            }
            delete filterObj.pageSize;

            if (filterObj.selectedmatter && typeof filterObj.selectedmatter == "object") {
                filterObj.matterid = filterObj.selectedmatter.matterid;
                delete filterObj.selectedmatter;
            }

            var filterObject = taskAgeHelper.getFilterObject(filterObj);
            filterObject.pageSize = 1000;
            var tz = utils.getTimezone();
            var timeZone = moment.tz.guess();
            filterObject.tz = timeZone;
            reportFactory.downloadTaskAge(filterObject)
                .then(function (response) {
                    utils.downloadFile(response.data, "Task_Age_Report", response.headers("Content-Type"));

                })
        }

        function print() {
            var printFilters = angular.copy(vm.filter);
            if (vm.filter.mytask === 1) {
                var role = masterData.getUserRole();
                printFilters.assignedTo = role.uid;
            }
            taskAgeHelper.print(printFilters, users, vm.taskAgeList);
        }

        function getAll() {
            vm.filter.pageSize = 1000;
            getTasks(vm.filter);
            vm.dataReceived = false;
        }

        function getMore() {
            vm.filter.pageNum += 1;
            vm.filter.pageSize = pageSize;
            vm.dataReceived = true;
            var promesa = reportFactory.getTaskAgeData(vm.filter);
            promesa.then(function (response) {
                processData(response);
                vm.total = (utils.isNotEmptyVal(response.totalCount)) ? parseInt(response.totalCount) : 0;
                var data = response.tasks;
                // taskAgeHelper.setDates(data);
                vm.taskAgeList = vm.taskAgeList.concat(data);
                vm.dataReceived = true;
            }, function (reason) { });

        }

        function showPaginationButtons() {

            if (!vm.dataReceived) {
                return false;
            }

            if (angular.isUndefined(vm.taskAgeList) || vm.taskAgeList.length <= 0) {
                return false;
            }

            if (vm.filter.pageSize === 'all') {
                return false;
            }

            if (vm.taskAgeList.length < (vm.filter.pageSize * vm.filter.pageNum)) {
                return false
            }
            return true;
        }

        function scrollReachedBottom() {
            if (vm.taskLimit <= vm.total) {
                vm.taskLimit = vm.taskLimit + initTasklimit;
            }
        }

        function scrollReachedTop() {
            vm.taskLimit = initTasklimit;
        }

    }


})(angular);


(function (angular) {

    angular.module('cloudlex.report')
        .factory('taskAgeHelper', taskAgeHelper);

    taskAgeHelper.$inject = ['globalConstants'];

    function taskAgeHelper(globalConstants) {
        return {
            taskAgeGrid: _taskAgeGrid,
            getSorts: _getSorts,
            setDates: _setDates,
            print: _print,
            generateTags: _generateTags,
            getFilterObject: getFilterObject
        };

        function _taskAgeGrid() {
            return [{
                field: [{
                    prop: 'matter_name',
                    printDisplay: 'Matter Name',
                    href: { link: '#/matter-overview', paramProp: ['matter_id'] }
                }],
                displayName: 'Matter Name',
                dataWidth: 15
            }, {
                field: [{						//DOI show on grid for US#5886 
                    prop: 'dateofIncidence',
                    printDisplay: 'Date of Incident'
                }],
                displayName: 'Date of Incident',
                dataWidth: 11
            }, {
                field: [{
                    prop: 'taskname',
                    printDisplay: 'Task'
                }],
                displayName: 'Task',
                dataWidth: 10
            }, {
                field: [{
                    prop: 'status',
                    printDisplay: 'Status'
                },


                ],
                displayName: 'Task Status',
                dataWidth: 10

            }, {
                field: [{
                    prop: 'assignmentDate',
                    printDisplay: 'Assignment Date'
                }],
                displayName: 'Assignment Date',
                dataWidth: 10
            }, {
                field: [{
                    prop: 'dueDate',
                    printDisplay: 'Due Date'
                },],
                displayName: 'Due Date',
                dataWidth: 10
            }, {
                field: [{
                    prop: 'age',
                    printDisplay: 'Age'
                },],
                displayName: 'Age',
                dataWidth: 8

            }, {
                field: [{
                    prop: 'assigned_by_user',
                    printDisplay: 'Assigned By'
                }],
                displayName: 'Assigned By',
                dataWidth: 13
            }, {
                field: [{
                    prop: 'assigned_to_user',
                    printDisplay: 'Assigned To'
                }],
                displayName: 'Assigned To',
                dataWidth: 13
            }];
        }

        function _getSorts() {
            var sorts = [{
                name: 'Task name  ASC',
                sortBy: 'taskname',
                sortOrder: 'ASC'
            }, {
                name: 'Task name  DESC',
                sortBy: 'taskname',
                sortOrder: 'DESC'
            }, {
                name: 'Matter name ASC',
                sortBy: 'matter_name',
                sortOrder: 'ASC'
            }, {
                name: 'Matter name DESC',
                sortBy: 'matter_name',
                sortOrder: 'DESC'
            }, {
                name: 'Due date ASC',
                sortBy: 'duedate',
                sortOrder: 'ASC'
            }, {
                name: 'Due date DESC',
                sortBy: 'duedate',
                sortOrder: 'DESC'
            }, {
                name: 'Assignment date ASC',
                sortBy: 'assignmentdate',
                sortOrder: 'ASC'
            }, {
                name: 'Assignment date DESC',
                sortBy: 'assignmentdate',
                sortOrder: 'DESC'
            }];
            return sorts;
        }

        function _setDates(data) {
            _.forEach(data, function (item) {
                item.dueDate = utils.isNotEmptyVal(item.duedate) ?
                    moment.unix(item.duedate).utc().format('MM-DD-YYYY') : '';
                item.assignmentDate = utils.isNotEmptyVal(item.assignmentdate) ?
                    moment.unix(item.assignmentdate).utc().format('MM-DD-YYYY') : '';
                if ((angular.isDefined(item.dateofincidence) && !_.isNull(item.dateofincidence) && !utils.isEmptyString(item.dateofincidence) && item.dateofincidence != 0 && item.dateofincidence != '-')) {
                    item.dateofincidence = moment.unix(item.dateofincidence).utc().format('MM-DD-YYYY');
                } else {
                    item.dateofincidence = "  -  "
                }

            });
        }
        function getFilterObject(filters) {
            var formattedFilters = {};

            formattedFilters.priority = utils.isNotEmptyVal(filters.priority) ? filters.priority : [];
            formattedFilters.e = utils.isNotEmptyVal(filters.e) ? filters.e : "";
            formattedFilters.s = utils.isNotEmptyVal(filters.s) ? filters.s : "";
            formattedFilters.assignedto = utils.isNotEmptyVal(filters.assignedTo) ? parseInt(filters.assignedTo) : "";
            formattedFilters.assignedby = utils.isNotEmptyVal(filters.assignedBy) ? parseInt(filters.assignedBy) : "";
            formattedFilters.dueStartDate = utils.isNotEmptyVal(filters.dueStartDate) ? filters.dueStartDate : "";
            formattedFilters.dueEndDate = utils.isNotEmptyVal(filters.dueEndDate) ? filters.dueEndDate : "";
            formattedFilters.sortby = filters.sortBy;
            formattedFilters.sortorder = filters.sortOrder
            formattedFilters.pageNum = filters.pageNum;
            formattedFilters.pageSize = filters.pageSize;
            formattedFilters.mytask = angular.isDefined(filters.mytask) ? filters.mytask : 1;
            //leadNameFilter
            formattedFilters.matterId = utils.isNotEmptyVal(filters.matterid) ? parseInt(filters.matterid) : "";

            return formattedFilters;
        };
        function _print(filter, users, data) {
            var sorts = _getSorts();
            var filtersForPrint = _getFilterObj(filter, users, sorts);

            var headers = _taskAgeGrid();
            headers = _getPropsFromHeaders(headers);

            var printPage = _getPrintPage(filtersForPrint, headers, data);
            window.open().document.write(printPage);
        }

        function _getFilterObj(filter, users, sorts) {

            var sortData = _.find(sorts, function (sort) {
                return (sort.sortBy === filter.sortBy && sort.sortOrder === filter.sortOrder);
            });

            var assignedto = utils.isNotEmptyVal(filter.assignedTo) ? _.find(users, function (user) {
                return user.uid == filter.assignedTo
            }).fname : '';

            var assignedby = utils.isNotEmptyVal(filter.assignedBy) ? _.find(users, function (user) {
                return user.uid === filter.assignedBy
            }).fname : " ";

            var assignedDateRange = "from : " + (utils.isNotEmptyVal(filter.s) ? moment.unix(filter.s).utc().format('MM-DD-YYYY') : '  -  ') +
                " to : " + (utils.isNotEmptyVal(filter.e) ? moment.unix(filter.e).utc().format('MM-DD-YYYY') : '  -  ');

            var dueDateRange = "from : " + (utils.isNotEmptyVal(filter.dueStartDate) ? moment.unix(filter.dueStartDate).utc().format('MM-DD-YYYY') : '  -  ') +
                " to : " + (utils.isNotEmptyVal(filter.dueEndDate) ? moment.unix(filter.dueEndDate).utc().format('MM-DD-YYYY') : '  -  ');


            var priority = '';
            if (utils.isNotEmptyVal(filter.priority)) {
                _.forEach(filter.priority, function (p, index) {
                    priority += p.showName + (index !== (filter.priority.length - 1) ? ', ' : '');
                });
            }


            var filterObj = {
                //   For: filter.for === 'mytask' ? 'My Tasks' : 'All Tasks',
                'Assigned To': utils.isNotEmptyVal(assignedto) ? assignedto : '',
                'Assigned By': assignedby,
                'Sort By': sortData.name,
                'Assigned On': assignedDateRange,
                'Due Date': dueDateRange,
                'Matter': '',
                'Priority': priority
            };

            if (filter.selectedmatter && typeof filter.selectedmatter == "object") {
                filterObj.Matter = filter.selectedmatter.name
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

        function _getPrintPage(filters, headers, taskAgeData) {
            var html = "<html><title>Task Age Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; } table td { word-break:break-word } </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Task Age Report</h1><div></div>";
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
                if (header.prop == 'assignmentDate') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact;width:10%; border-collapse:collapse; padding:12px 5px;'>" + header.display + "</th>";
                } else if (header.prop == 'dueDate') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact;width:10%; border-collapse:collapse; padding:12px 5px;'>" + header.display + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact;width:10%; border-collapse:collapse; padding:12px 5px'>" + header.display + "</th>";
                }

            });
            html += '</tr>';


            angular.forEach(taskAgeData, function (age) {
                html += '<tr>';
                angular.forEach(headers, function (header) {
                    age[header.prop] = (_.isNull(age[header.prop]) || angular.isUndefined(age[header.prop]) || utils.isEmptyString(age[header.prop])) ? " - " : utils.removeunwantedHTML(age[header.prop]);

                    if (header.prop == 'assignmentDate') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; padding:5px'>" + age[header.prop] + "</td>";
                    } else if (header.prop == 'dueDate') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; padding:5px'>" + age[header.prop] + "</td>";
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

        function _generateTags(appliedFilter, users) {

            var filterProps = [{
                prop: 'assignedTo',
                tagname: 'Assigned To:'
            }, {
                prop: 'assignedBy',
                tagname: 'Assigned By:'
            }, {
                prop: 'assignmentDateRange',
                tagname: 'Assignment Date Range:'
            }, {
                prop: 'dueDateRange',
                tagname: 'Due Date Range:'
            }, {
                prop: 'matter',
                tagname: 'Matter:'
            }, {
                prop: 'priority',
                tagname: 'Priority:'
            }
            ];

            var tags = [];

            _.forEach(filterProps, function (filter) {
                switch (filter.prop) {

                    case 'assignedTo':
                        if (utils.isNotEmptyVal(appliedFilter.assignedTo)) {
                            var filterObj = {
                                key: 'assignedTo',
                                value: 'Assigned To: ' + _.find(users, function (user) {
                                    return user.uid === appliedFilter.assignedTo
                                }).fname
                            };
                            tags.push(filterObj);
                        }
                        break;

                    case 'assignedBy':
                        if (utils.isNotEmptyVal(appliedFilter.assignedBy)) {
                            var filterObj = {
                                key: 'assignedBy',
                                value: 'Assigned By: ' + _.find(users, function (user) {
                                    return user.uid === appliedFilter.assignedBy
                                }).fname
                            };
                            tags.push(filterObj);
                        }
                        break;

                    case 'assignmentDateRange':
                        if (utils.isNotEmptyVal(appliedFilter.s) && (utils.isNotEmptyVal(appliedFilter.e))) {
                            var filterObj = {
                                key: 'assignmentDateRange',
                                value: 'Assignment Date from :' + moment.unix(appliedFilter.s).utc().format('MM-DD-YYYY') +
                                    ' to: ' + moment.unix(appliedFilter.e).utc().format('MM-DD-YYYY')
                            };
                            tags.push(filterObj);
                        }
                        break;

                    case 'dueDateRange':
                        if (utils.isNotEmptyVal(appliedFilter.dueStartDate) && utils.isNotEmptyVal(appliedFilter.dueEndDate)) {
                            var filterObj = {
                                key: 'dueDateRange',
                                value: 'Due Date from :' + moment.unix(appliedFilter.dueStartDate).utc().format('MM-DD-YYYY') +
                                    'to: ' + moment.unix(appliedFilter.dueEndDate).utc().format('MM-DD-YYYY')
                            };
                            tags.push(filterObj);
                        }
                        break;

                    case 'matter':
                        if (angular.isDefined(appliedFilter.selectedmatter) && appliedFilter.selectedmatter != '' && typeof appliedFilter.selectedmatter == "object") {
                            var filterObj = {
                                key: 'matter',
                                value: "Matter: " + appliedFilter.selectedmatter.name
                            };
                            tags.push(filterObj);
                        }
                        break;
                    case 'priority':
                        var obj = [{ "id": 3, "name": "High", "showName": "High" }, { "id": 1, "name": "Low", "showName": "Low" }, { "id": 2, "name": "Medium", "showName": "Normal" }];
                        _.forEach(obj, function (pList) {
                            if (angular.isDefined(appliedFilter.priority) && appliedFilter.priority.length != 0 && appliedFilter.priority != null) {

                                _.forEach(appliedFilter.priority, function (data) {
                                    if (pList.showName == data.showName) {
                                        var priority = {};
                                        priority.key = pList.id;
                                        priority.type = "priority";
                                        priority.value = "Priority: " + pList.showName;
                                        tags.push(priority);
                                    }
                                });
                            }
                        });
                        break;
                }
            });

            return tags;
        }
    }

})(angular);

(function (angular) {

    angular.module('cloudlex.report')
        .factory('taskAgeDatalayer', taskAgeDatalayer);

    taskAgeDatalayer.$inject = ['$http', 'globalConstants'];

    function taskAgeDatalayer($http, globalConstants) {
        var url;
        url = globalConstants.webServiceBase + 'tasks/staffsinfirm';
        
        var urls = {
            //  taskAgeData: globalConstants.webServiceBase + 'Matter-Manager/v1/task/age?',
            //    taskAgeDataCount: globalConstants.webServiceBase + 'reports/taskage_count?',
            getUsers: url

            //  exportReport: globalConstants.webServiceBase + 'reports/report.json?reportname=TaskAge&filename=Task_Age_Report.xlsx&type=excel&'
        };

        return {
            //    getTaskAgeData: _getTaskAgeData,
            //    getTaskAgeCount: _getTaskAgeDataCount,
            getUsersInFirm: _getUsersInFirm,
            // exportReport: _exportReport
        };

        // function _getTaskAgeData(filters) {
        //     var url = urls.taskAgeData + utils.getParams(filters);
        //     return $http.get(url);
        // }

        // function _getTaskAgeDataCount(filters) {
        //     var url = urls.taskAgeDataCount + utils.getParams(filters);
        //     return $http.get(url);
        // }

        function _getUsersInFirm() {
            var url = urls.getUsers;
            return $http.get(url);
        }

        // function _exportReport(filter) {
        //     var url = urls.exportReport + utils.getParams(filter);
        //     var download = window.open(url, '_self');
        // }
    }
})(angular);
