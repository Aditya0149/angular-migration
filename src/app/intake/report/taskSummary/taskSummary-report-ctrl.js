(function (angular) {
    'use strict';

    angular.module('intake.report')
        .controller('IntakeTaskSummaryReportCtrl', IntakeTaskSummaryReportCtrl);

    IntakeTaskSummaryReportCtrl.$inject = ['$modal', 'intakeReportFactory', 'masterData', 'intakeTaskSummaryReportDataLayer', 'intakeTaskSummaryReportHelper'];

    function IntakeTaskSummaryReportCtrl($modal, intakeReportFactory, masterData, intakeTaskSummaryReportDataLayer, intakeTaskSummaryReportHelper) {

        var vm = this,
            initTaskLimit = 10,
            pageSize = 250;

        vm.filterByUser = filterByUser;
        vm.getMore = getMore;
        vm.getAll = getAll;
        vm.showPaginationButtons = showPaginationButtons;
        vm.applySortByFilter = applySortByFilter;
        vm.print = print;
        vm.exportTaskSummary = exportTaskSummary;
        vm.filterTaskSummary = filterTaskSummary;
        vm.tagCancelled = tagCancelled;
        vm.scrollReachedBottom = scrollReachedBottom;
        vm.scrollReachedTop = scrollReachedTop;
        vm.priorityList = [{ "id": 3, "name": "High", "showName": "High" }, { "id": 1, "name": "Low", "showName": "Low" }, { "id": 2, "name": "Medium", "showName": "Normal" }];

        (function () {
            vm.clickedRow = -1;
            vm.sorts = intakeTaskSummaryReportHelper.getSorts();
            vm.tags = [];
            vm.taskLimit = initTaskLimit;
            vm.taskSummaryGrid = {
                headers: intakeTaskSummaryReportHelper.taskSummaryGrid()
            };
            vm.taskSummaryList = [];
            vm.statusList = intakeTaskSummaryReportHelper.getTaskStatus();

            var persistedFilters = sessionStorage.getItem("taskSummaryFilters");
            if (utils.isNotEmptyVal(persistedFilters)) {
                try {
                    vm.filter = JSON.parse(persistedFilters);
                    vm.selectedSort = _.find(vm.sorts, function (sort) {
                        return ((sort.id === vm.filter.sortBy))
                    }).name;

                    intakeTaskSummaryReportDataLayer.getAssignedUserData()
                        .then(function (users) {
                            vm.assignedUserlist = users;
                            vm.filter.assignedto = vm.filter.for === 'mytask' ? "" : vm.filter.assignedto;
                            vm.tags = intakeTaskSummaryReportHelper.createFilterTags(angular.copy(vm.filter), vm.statusList, vm.assignedUserlist, vm.priorityList);
                        });
                } catch (e) {
                    setFilters();
                    getAssignedUsers();
                }
            } else {
                setFilters();
                getAssignedUsers();
            }

            getTaskSummaryData(vm.filter);
        })();

        function getAssignedUsers() {
            intakeTaskSummaryReportDataLayer.getAssignedUserData()
                .then(function (users) {
                    vm.assignedUserlist = users;
                });
        }

        function setFilters() {
            vm.filter = {
                'for': 'mytask',
                sortBy: 1,
                pageNum: 1,
                pageSize: pageSize,
                s: '',
                e: '',
                assignedto: '',
                assignedby: '',
                status: [],
            };

            vm.selectedSort = 'Lead name ASC';
        }

        function getTaskSummaryData(filterObj) {
            var localFilter = angular.copy(filterObj);
            if (localFilter.status.length != 0) {
                var status = [];
                _.forEach(vm.statusList, function (stsList) {
                    _.forEach(localFilter.status, function (data) {
                        if (stsList.name == data.name) {
                            status.push(encodeURIComponent(stsList.name));
                        }
                    });
                });
                localFilter.status = status;
            } else {
                localFilter.status = "";
            }

            if (angular.isDefined(localFilter.priority) && localFilter.priority.length != 0) {
                var priority = [];
                _.forEach(vm.priorityList, function (pList) {
                    _.forEach(localFilter.priority, function (data) {
                        if (pList.showName == data.showName) {
                            priority.push(encodeURIComponent(pList.showName));
                        }
                    });
                });
                localFilter.priority = priority;
            } else {
                localFilter.priority = "";
            }

            localFilter.e = utils.isNotEmptyVal(localFilter.e) ? localFilter.e : '';
            localFilter.s = utils.isNotEmptyVal(localFilter.s) ? localFilter.s : '';


            //set category and subcategory
            setCategory(localFilter);

            vm.filter = filterObj;
            //persit filter
            var filters = angular.copy(vm.filter);
            filters.pageSize = pageSize;
            filters.pageNum = 1;
            sessionStorage.setItem("intakeTaskSummaryFilters", JSON.stringify(filters));

            vm.dataReceived = false;
            vm.clickedRow = -1;
            if (localFilter.intake && typeof localFilter.intake == "object") {
                localFilter.intakeId = localFilter.intake.intakeId;
                delete localFilter.intake;
            }

            // intakeTaskSummaryReportDataLayer.getTaskSummaryData(localFilter)
            //     .then(function (response) {
            //         intakeTaskSummaryReportHelper.setDates(response.task_summary);
            //         vm.taskSummaryList = response.task_summary;
            //         vm.dataReceived = true;
            //     });

            // var count = intakeTaskSummaryReportDataLayer.getTaskSummaryCount(localFilter);
            // count.then(function (res) { vm.total = res.data[0]; });
            var filterObj = intakeTaskSummaryReportDataLayer.getFilterObject(localFilter);

            var promesa = intakeReportFactory.getTaskSummaryData(filterObj);
            promesa.then(function (response) {
                processData(response);
                vm.total = (utils.isNotEmptyVal(response.totalCount)) ? parseInt(response.totalCount) : 0;
                var data = response.taskSummaryData;
                _.forEach(data, function (item) {
                    item.assigned_to_ids = utils.isNotEmptyVal(item.assigned_to_ids) ? item.assigned_to_ids : '';
                    item.assignedto = utils.isNotEmptyVal(item.assignedto) ? item.assignedto.replace(",", ", ") : '';
                })
                vm.taskSummaryList = data;
                vm.dataReceived = true;
            }, function (reason) { });
        }
        function processData(response) {
            _.forEach(response.taskSummaryData, function (item) {
                //  item.assignmentDate = (item.assignment_date == 0) ? "-" : moment.unix(item.assignment_date).utc().format('MM-DD-YYYY');
                item.dateofincidence = (item.dateOfIncidence == 0) ? "-" : moment.unix(item.dateOfIncidence).utc().format('MM-DD-YYYY');
                item.dueutcdate = (item.duedate == 0) ? "-" : moment.unix(item.duedate).utc().format('MM-DD-YYYY');
                item.intakeName = item.intakeName ? item.intakeName : "";
                item.assignedby = item.assignedByUsers ? item.assignedByUsers : "";
                item.assignedto = item.assignedToUsers ? item.assignedToUsers : "";
                item.taskname = item.taskName ? item.taskName : "";
                item.status = item.status ? item.status : "";
                item.intakeId = item.intakeId ? item.intakeId : 0;
            });
            utils.replaceNullByEmptyStringArray(response.tasks);
        }
        function setCategory(filters) {
            if (utils.isEmptyVal(filters.taskcategoryid)) {
                removeUnwantedFilters();
                return;
            }

            filters.task_category = filters.taskcategoryid;
            // 
            if (filters.task_category == 0) {
                filters.task_subcategory = utils.isNotEmptyVal(filters.category) ? filters.category[0].label : '';
            } else {
                var subCats = ((filters.category instanceof Array) && filters.category.length > 0) ?
                    _.pluck(filters.category, 'tasksubcategoryid').toString() : '';
                filters.task_subcategory = subCats;
            }

            removeUnwantedFilters();

            function removeUnwantedFilters() {
                //remove unwanted params from the filter obj
                delete filters.category;
                delete filters.taskcategoryid;
                delete filters.taskcategoryName;
                delete filters.tasksubcategoryid;
            }
        }

        function filterByUser(forFilter) {
            vm.filter['for'] = forFilter;
            vm.filter.pageNum = 1;
            vm.filter.pageSize = pageSize;
            if (forFilter === 'mytask') {
                vm.filter.mytask = 1;
                vm.filter.assignedto = "";
                vm.filter.for = 'mytask';
                vm.tags = intakeTaskSummaryReportHelper.createFilterTags(angular.copy(vm.filter), vm.statusList, vm.assignedUserlist, vm.priorityList);
            } else {
                vm.filter.mytask = 0;
                vm.filter.for = 'alltask';

            }
            getTaskSummaryData(vm.filter);
        }

        function getMore() {
            vm.filter.pageNum += 1;
            vm.filter.pageSize = pageSize;
            var filterStatusPrintFormat = vm.filter.status;
            var filterStatus = [];
            _.forEach(vm.filter.status, function (data) {
                filterStatus.push(data.name);
            });
            vm.filter.status = [];
            vm.filter.status = encodeURIComponent(filterStatus);
            var filterObj = intakeTaskSummaryReportDataLayer.getFilterObject(vm.filter);
            var promesa = intakeReportFactory.getTaskSummaryData(filterObj);
            promesa.then(function (response) {
                processData(response);
                vm.total = (utils.isNotEmptyVal(response.totalCount)) ? parseInt(response.totalCount) : 0;
                var data = response.taskSummaryData;
                _.forEach(data, function (item) {
                    item.assigned_to_ids = utils.isNotEmptyVal(item.assigned_to_ids) ? item.assigned_to_ids : '';
                    item.assignedto = utils.isNotEmptyVal(item.assignedto) ? item.assignedto.replace(",", ", ") : '';
                })
                vm.taskSummaryList = vm.taskSummaryList.concat(data);
                vm.dataReceived = true;
            }, function (reason) { });
            vm.filter.status = [];
            vm.filter.status = filterStatusPrintFormat;
        }

        function getAll() {
            vm.filter.pageSize = 1000;
            vm.dataReceived = false;
            getTaskSummaryData(vm.filter);
        }

        function showPaginationButtons() {

            if (!vm.dataReceived) {
                return false;
            }

            if (angular.isUndefined(vm.taskSummaryList) || vm.taskSummaryList.length <= 0) {
                return false;
            }

            if (vm.filter.pageSize === 'all') {
                return false;
            }

            if (vm.taskSummaryList.length < (vm.filter.pageSize * vm.filter.pageNum)) {
                return false
            }
            return true;
        }

        function applySortByFilter(sortBy) {
            vm.selectedSort = sortBy.name;
            vm.filter.sortBy = sortBy.id;
            vm.filter.pageNum = 1;
            vm.filter.pageSize = pageSize;

            if (vm.filter.for == "alltask") {
                vm.filter.mytask = vm.filter.mytask;
            } else {
                vm.filter.mytask = 1;
            }
            getTaskSummaryData(vm.filter);
        }

        function print() {
            var printFilters = angular.copy(vm.filter);
            if (vm.filter['for'] == 'mytask') {
                var role = masterData.getUserRole();
                printFilters.assignedto = role.uid;
            }

            intakeTaskSummaryReportHelper.print(printFilters, vm.assignedUserlist, vm.statusList, vm.taskSummaryList);
        }

        function exportTaskSummary() {
            var filterObj = angular.copy(vm.filter);

            if (filterObj.status.length != 0) {
                var status = [];
                //var newStatus = [];
                _.forEach(vm.statusList, function (stsList) {
                    _.forEach(filterObj.status, function (data) {
                        if (stsList.name == data.name) {
                            status.push(encodeURIComponent(stsList.name));
                            //newStatus.push(filterObj.status);
                        }
                    });
                });
                filterObj.status = status;
                //vm.filter.status = filterObj.status;
            } else {
                filterObj.status = "";
                //vm.filter.status = filterObj.status;
            }
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
            filterObj.pageSize = 1000;

            

            var filterObject = intakeTaskSummaryReportDataLayer.getFilterObject(filterObj);
            if (angular.isDefined(filterObj.taskcategoryid)) {
                filterObject.taskCategory = filterObj.taskcategoryid;
            }

            if (angular.isDefined(filterObj.category) && filterObj.category.length != 0) {

                if (filterObj.tasksubcategoryid == 0 && filterObj.category[0].label == "") {
                    filterObject.taskSubCategory = "";
                } else {

                    if (filterObject.taskCategory == "0") {
                        filterObject.taskSubCategory = filterObj.category[0].label;
                    } else {
                        var subCat = _.pluck(filterObj.category, 'tasksubcategoryid');
                        filterObject.taskSubCategory = subCat.toString();

                    }
                }

            }
            filterObject.pageSize = 1000;
            filterObject.pageNum = 1;
            // var tz = utils.getTimezone();
            // var timeZone = moment.tz.guess();
            // filterObject.tz = timeZone;
            intakeReportFactory.exportTaskSummary(filterObject)
                .then(function (response) {
                    utils.downloadFile(response.data, "Task_Summary_Report", response.headers("Content-Type"));

                })
        }
        // function exportTaskSummary() {
        //     var localFilter = angular.copy(vm.filter);
        //     if (localFilter.status.length != 0) {
        //         var status = [];
        //         //var newStatus = [];
        //         _.forEach(vm.statusList, function (stsList) {
        //             _.forEach(localFilter.status, function (data) {
        //                 if (stsList.name == data.name) {
        //                     status.push(encodeURIComponent(stsList.name));
        //                     //newStatus.push(filterObj.status);
        //                 }
        //             });
        //         });
        //         localFilter.status = status;
        //         //vm.filter.status = filterObj.status;
        //     } else {
        //         localFilter.status = "";
        //         //vm.filter.status = filterObj.status;
        //     }

        //     if (angular.isDefined(localFilter.priority) && localFilter.priority.length != 0) {
        //         var priority = [];
        //         _.forEach(vm.priorityList, function (pList) {
        //             _.forEach(localFilter.priority, function (data) {
        //                 if (pList.showName == data.showName) {
        //                     priority.push(encodeURIComponent(pList.showName));
        //                 }
        //             });
        //         });
        //         localFilter.priority = priority;
        //     } else {
        //         localFilter.priority = "";
        //     }

        //     //set category and subcategory
        //     setCategory(localFilter);

        //     if (localFilter.selectedintake && typeof localFilter.selectedintake == "object") {
        //         localFilter.intakeId = localFilter.selectedintake.intakeId;
        //         delete localFilter.selectedintake;
        //     }

        //     localFilter.pageSize = 'all';
        //     intakeTaskSummaryReportDataLayer.exportTaskSummary(localFilter);
        // }

        function tagCancelled(cancelled) {
            var localFilter = angular.copy(vm.filter);
            if (cancelled.type === "Assigned By") {
                localFilter.assignedby = ''
            } else if (cancelled.type === "Intake") {
                delete localFilter.intake;
                delete localFilter.intakeId
            } else if (cancelled.type === "Assigned To") {
                localFilter.assignedto = '';
            } else if (cancelled.type === "dateRange") {
                localFilter.s = '';
                localFilter.e = '';
            } else if (cancelled.type === "Due date end") {
                localFilter.e = ''
            } else if (cancelled.type === "subCat") {
                var index = _.findIndex(localFilter.category, { tasksubcategoryid: cancelled.tasksubcategoryid });
                if (index != -1) {
                    localFilter.category.splice(index, 1);
                }
            } else if (cancelled.type === "Cat") {
                localFilter.taskcategoryid = "";
                localFilter.tasksubcategoryid = "";
                localFilter.taskcategoryName = "";
                localFilter.category = [];
                //remove all the sub-cat tags
                var tags = angular.copy(vm.tags);
                _.forEach(tags, function (tag, i) {
                    if (tag.type == "subCat") {
                        var index = _.findIndex(vm.tags, function (tg) {
                            return tg.type == "subCat"
                        });
                        vm.tags.splice(index, 1);
                    }
                });
            } else if (cancelled.type === "Status") {
                var currentFilters = _.pluck(localFilter.status, 'id');
                var index = currentFilters.indexOf(cancelled.key);
                localFilter.status.splice(index, 1);
            } else if (cancelled.type === "priority") {
                var currentFilters = _.pluck(localFilter.priority, 'id');
                var index = currentFilters.indexOf(cancelled.key);
                localFilter.priority.splice(index, 1);
            }

            // fixed for Task filter reset issues 
            if (angular.isDefined(localFilter.category) && localFilter.category.length > 0) {
                if (utils.isNotEmptyVal(localFilter.category[0].label)) {
                    if (cancelled.type === "subCat") {
                        var index = _.findIndex(localFilter.category, { label: cancelled.tasksubcategoryid });
                        if (index != -1) {
                            localFilter.category.splice(index, 1);
                        }
                    }
                }
            }

            vm.filter = localFilter;

            getTaskSummaryData(localFilter);
            vm.filter.pageNum = 1;
        }

        function filterTaskSummary() {
            if (angular.isDefined(vm.assignedUserlist)) {
                _.forEach(vm.assignedUserlist, function (data) {
                    if (vm.filter.assignedby == data.uid) {
                        vm.filter.assignedby = data;
                        //vm.filter.assignedby.name = data.name;
                    }
                });
            } else {
                vm.filter.assignedby = '';
            }

            if (angular.isDefined(vm.assignedUserlist)) {
                _.forEach(vm.assignedUserlist, function (data) {
                    if (vm.filter.assignedto == data.uid) {
                        vm.filter.assignedto = data
                    }
                });
            } else {
                vm.filter.assignedto = '';
            }

            if (angular.isDefined(vm.filter.s) && vm.filter.s != '') {

            }
            var filtercopy = angular.copy(vm.filter);
            filtercopy.s = (filtercopy.s) ? moment.unix(filtercopy.s).utc().format('MM/DD/YYYY') : '';
            filtercopy.e = (filtercopy.e) ? moment.unix(filtercopy.e).utc().format('MM/DD/YYYY') : '';




            var modalInstance = $modal.open({
                templateUrl: 'app//intake/report/taskSummary/taskSummaryPopUp/task-summary-popup.html',
                controller: 'IntakeTaskSummaryPopUpCtrl as intakeTaskSummaryPopUpCtrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    params: function () {
                        return {
                            //masterData: vm.masterList,
                            filters: filtercopy,
                            statusList: angular.copy(vm.statusList),
                            assignedUserList: angular.copy(vm.assignedUserlist),
                            priorityList: angular.copy(vm.priorityList),
                            tags: angular.copy(vm.tags)
                        };
                    }
                }
            });

            modalInstance.result.then(function (filterObj) {
                vm.filter.pageSize = pageSize;
                vm.filter = filterObj;
                vm.filter.pageNum = 1;
                vm.filter.assignedto = vm.filter.for === 'mytask' ? "" : vm.filter.assignedto;
                vm.tags = intakeTaskSummaryReportHelper.createFilterTags(angular.copy(vm.filter), vm.statusList, vm.assignedUserlist, vm.priorityList);
                getTaskSummaryData(vm.filter);

            }, function () {

            });
        }

        function scrollReachedBottom() {
            if (vm.taskLimit <= vm.total) {
                vm.taskLimit += initTaskLimit;
            }
        }

        function scrollReachedTop() {
            vm.taskLimit = initTaskLimit;
        }
    }

})(angular);


(function (angular) {

    angular.module('intake.report')
        .factory('intakeTaskSummaryReportHelper', intakeTaskSummaryReportHelper);
    intakeTaskSummaryReportHelper.$inject = ['globalConstants'];

    function intakeTaskSummaryReportHelper(globalConstants) {
        return {
            taskSummaryGrid: _taskSummaryGrid,
            getSorts: _getSorts,
            setDates: _setDates,
            print: _print,
            getTaskStatus: getTaskStatus,
            createFilterTags: _createFilterTags

        };

        function _createFilterTags(filters, statusList, assignedList, priorityList) {
            var tags = [];

            var status = {};
            var assignedby = {};
            var assignedto = {};
            var dateRange = {};
            var selintake = {};
            /*var start = {};
            var end = {};*/

            if (angular.isDefined(filters.assignedby) && filters.assignedby != '') {

                if (angular.isDefined(assignedList)) {
                    _.forEach(assignedList, function (data) {
                        if (filters.assignedby == data.uid) {
                            assignedby.key = "assingedby";
                            assignedby.type = "Assigned By";
                            assignedby.value = "Assigned By: " + data.fname;
                            tags.push(assignedby);
                        }
                    });
                }
            }

            if (angular.isDefined(filters.intake) && filters.intake.intakename != '' && typeof filters.intake == "object") {
                selintake.key = "intake";
                selintake.type = "Intake";
                selintake.value = "Lead: " + filters.intake.intakeName;
                tags.push(selintake);
            }

            if (angular.isDefined(filters.assignedto) && filters.assignedto != '') {

                if (angular.isDefined(assignedList)) {
                    _.forEach(assignedList, function (data) {
                        if (filters.assignedto == data.uid) {
                            assignedto.key = "assingedto";
                            assignedto.type = "Assigned To";
                            assignedto.value = "Assigned To: " + data.fname;
                            tags.push(assignedto);
                        }
                    });
                }
            }
            _.forEach(priorityList, function (pList) {
                if (angular.isDefined(filters.priority) && filters.priority.length != 0 && filters.priority != null) {

                    _.forEach(filters.priority, function (data) {
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

            _.forEach(statusList, function (stsList) {
                if (filters.status.length != 0 && filters.status != null) {

                    _.forEach(filters.status, function (data) {
                        if (stsList.name == data.name) {
                            status = {};
                            status.key = stsList.id;
                            status.type = "Status";
                            status.value = "Status: " + stsList.name;
                            tags.push(status);
                        }
                    });

                }
            });

            if (utils.isNotEmptyVal(filters.s) && (utils.isNotEmptyVal(filters.e) && filters.s != 0 && filters.e != 0)) {
                dateRange.key = "dateRange";
                dateRange.type = "dateRange";
                dateRange.value = 'Due Date from: ' + moment.unix(filters.s).utc().format('MM-DD-YYYY') + ' to: ' + moment.unix(filters.e).utc().format('MM-DD-YYYY')
                tags.push(dateRange);
            }

            if (utils.isNotEmptyVal(filters.taskcategoryid)) {
                var taskCat = {};
                taskCat.key = "cat_" + filters.taskcategoryid;
                taskCat.type = "Cat";
                taskCat.taskcategoryid = filters.taskcategoryid;
                taskCat.value = "Category: " + filters.taskcategoryName;
                tags.push(taskCat);
            }

            if (utils.isNotEmptyVal(filters.category) && (filters.category instanceof Array)) {
                _.forEach(filters.category, function (cat) {
                    var tasksubCatObj = {};
                    tasksubCatObj.key = "subcatid_" + cat.tasksubcategoryid;
                    tasksubCatObj.type = "subCat";
                    tasksubCatObj.tasksubcategoryid = utils.isNotEmptyVal(cat.label) ? cat.label : cat.tasksubcategoryid;
                    tasksubCatObj.value = (cat.tasksubcategoryid == 0 ? "Task Name: " : "Sub-category: ") + cat.label;
                    tags.push(tasksubCatObj);
                });
            }


            return tags;
        }

        function _taskSummaryGrid() {
            return [{
                field: [{
                    prop: 'intakeName',
                    href: { link: '#/intake-overview', paramProp: ['intakeId'] },
                    printDisplay: 'Lead Name'
                }],
                displayName: 'Lead Name',
                dataWidth: 20
            }, {
                field: [{ //DOI show on grid for US#5886 
                    prop: 'dateofincidence',
                    printDisplay: 'Date of Incident'
                }],
                displayName: 'Date of Incident',
                dataWidth: 11
            }, {
                field: [{
                    prop: 'dueutcdate',
                    printDisplay: 'Due Date'
                }],
                displayName: 'Due Date',
                dataWidth: 11

            }, {
                field: [{
                    prop: 'taskname',
                    printDisplay: 'Task Name'
                }],
                displayName: 'Task Name',
                dataWidth: 16

            }, {
                field: [{
                    prop: 'status',
                    printDisplay: 'Status'
                }],
                displayName: 'Status',
                dataWidth: 12

            }, {
                field: [{
                    prop: 'assignedby',
                    printDisplay: 'Task Assigned By'
                }],
                displayName: 'Task Assigned By',
                dataWidth: 15

            }, {
                field: [{
                    prop: 'assignedto',
                    printDisplay: 'Task Assigned To'
                }],
                displayName: 'Task Assigned To',
                dataWidth: 15
            }];
        }

        function getTaskStatus() {
            var options = [{
                id: 1,
                name: "Not Started"
            }, {
                id: 2,
                name: "In Progress"
            }, {
                id: 3,
                name: "Awaiting Clarification"
            }, {
                id: 4,
                name: "Received & Acknowledged"
            }, {
                id: 5,
                name: "Completed"
            }];
            return options
        }

        function _getSorts() {
            var sorts = [{
                id: 1,
                param: "intake_name",
                name: 'Lead name ASC'
            }, {
                id: 2,
                param: "intake_name",
                name: 'Lead name DESC '
            }, {
                id: 3,
                param: "duedate",
                name: 'Due Date Old-New'
            }, {
                id: 4,
                param: "duedate",
                name: 'Due Date New-Old'
            }];

            return sorts;
        }

        function _setDates(taskList) {
            _.forEach(taskList, function (taskData) {
                taskData.dateofincidence = (utils.isNotEmptyVal(taskData.dateofincidence) && taskData.dateofincidence != 0) ? moment.unix(taskData.dateofincidence).utc().format('DD MMM YYYY') : '-';
                if (angular.isDefined(taskData.dueutcdate) && !_.isNull(taskData.dueutcdate) && !utils.isEmptyString(taskData.dueutcdate) && taskData.dueutcdate != 0) {
                    taskData.dueutcdate = moment.unix(taskData.dueutcdate).utc().format('DD MMM YYYY')
                } else {
                    taskData.dueutcdate = "   -   "
                }
            });
        }

        function _print(filter, users, statusList, data) {
            var sorts = _getSorts();
            var filtersForPrint = _getFilterObj(filter, users, statusList, sorts);

            var headers = _taskSummaryGrid();
            headers = _getPropsFromHeaders(headers);

            var printPage = _getPrintPage(filtersForPrint, headers, data);
            window.open().document.write(printPage);
        }

        function _getFilterObj(filter, users, statusList, sorts) {
            var userList = users;
            var sortData = _.find(sorts, function (sort) {
                return (sort.id === filter.sortBy);
            });

            var assignedto = utils.isNotEmptyVal(filter.assignedto) ? _.find(userList, function (user) {
                return user.uid === filter.assignedto
            }).fname : '';

            var assignedby = utils.isNotEmptyVal(filter.assignedby) ? _.find(userList, function (user) {
                return user.uid === filter.assignedby
            }).fname : " ";

            var status = '';

            if (utils.isNotEmptyVal(filter.status)) {

                _.forEach(filter.status, function (sts, index) {
                    status += sts.name + (index !== (filter.status.length - 1) ? ', ' : '');
                });
            }

            var priority = '';
            if (utils.isNotEmptyVal(filter.priority)) {

                _.forEach(filter.priority, function (p, index) {
                    priority += p.showName + (index !== (filter.priority.length - 1) ? ', ' : '');
                });
            }

            var dueDateRange = "from : " + (utils.isNotEmptyVal(filter.s) ? moment.unix(filter.s).utc().format('MM-DD-YYYY') : '  -  ') +
                " to : " + (utils.isNotEmptyVal(filter.e) ? moment.unix(filter.e).utc().format('MM-DD-YYYY') : '  -  ');

            var filterObj = {
                For: filter.for === 'mytask' ? 'My Tasks' : 'All Tasks',
                'Assigned To': utils.isNotEmptyVal(assignedto) ? assignedto : '',
                'Assigned By': assignedby,
                'Sort By': sortData.name,
                'Due Date': dueDateRange,
                'Status': status,
                'Priority': priority,
                'Task Category': utils.isNotEmptyVal(filter.taskcategoryName) ? filter.taskcategoryName : '',
            };

            if (utils.isNotEmptyVal(filter.taskcategoryid) && filter.taskcategoryid == '0') {
                filterObj["Task Name"] = (filter.category && filter.category[0]) ? filter.category[0].label : "";
            } else {
                var subcats = _.pluck(filter.category, 'label');
                filterObj["Sub-category"] = subcats.join(', ');
            }

            if (filter.intake && typeof filter.intake == "object") {
                filterObj["Lead Name"] = filter.intake.intakeName;
            } else {
                filterObj["Lead Name"]= '';
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
            var html = "<html><title>Task Summary Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; } table td { word-break:break-word}  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Task Summary Report</h1><div></div>";
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
                if (header.prop == 'dueutcdate') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse;width:10%; padding:12px 5px;'>" + header.display + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse;width:10%; padding:12px 5px'>" + header.display + "</th>";
                }

                /*                html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + header.display + "</th>";*/
            });
            html += '</tr>';


            angular.forEach(taskAgeData, function (age) {
                html += '<tr>';
                angular.forEach(headers, function (header) {
                    age[header.prop] = (_.isNull(age[header.prop]) || angular.isUndefined(age[header.prop]) || utils.isEmptyString(age[header.prop])) ? " - " : utils.removeunwantedHTML(age[header.prop]);

                    if (header.prop == 'dueutcdate') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse;  padding:5px'>" + age[header.prop] + "</td>";
                    } else {

                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; padding:5px'>" + age[header.prop] + "</td>";

                    }

                });
                html += '</tr>'

                html += "<tr ><td colspan='1' style='border:1px solid #e2e2e2; border-right:none; border-collapse:collapse; padding:5px'><b>" + 'Task Description :' + "</b></td>";
                if (age.notes != '') {
                    html += "<td colspan='9'style='border:1px solid #e2e2e2;  border-left:none; border-collapse:collapse; padding:5px'>" + utils.removeunwantedHTML(age.notes) + "</td></tr>";
                } else {
                    html += "<td colspan='9'style='border:1px solid #e2e2e2;  border-left:none; border-collapse:collapse; padding:5px'>" + '-' + "</td></tr>";
                }

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

angular.module('intake.report')
    .factory('intakeTaskSummaryReportDataLayer', intakeTaskSummaryReportDataLayer);

intakeTaskSummaryReportDataLayer.$inject = ['$q', '$http', 'globalConstants'];

function intakeTaskSummaryReportDataLayer($q, $http, globalConstants) {

    var baseUrl = globalConstants.webServiceBase;

    // var taskSummaryUrl = baseUrl + 'reports/task_status_summary.json';
    //   var taskSummaryCountUrl = baseUrl + 'reports/task_status_summary_count.json';
    var assignedUserUrl = baseUrl + "tasks/staffsinfirm.json"
    //   var exportUrl = baseUrl + 'reports/report.json';


    // function getParams(params) {
    //     var querystring = "";
    //     angular.forEach(params, function (value, key) {
    //         querystring += key + "=" + value;
    //         querystring += "&";
    //     });
    //     return querystring.slice(0, querystring.length - 1);
    // }

    return {
        //  getTaskSummaryData: getTaskSummaryData,
        // getTaskSummaryCount: getTaskSummaryCount,
        // exportTaskSummary: exportTaskSummary,
        getAssignedUserData: getAssignedUserData,
        getFilterObject: getFilterObject

    }
    function getFilterObject(filters) {
        var formattedFilters = {};

        formattedFilters.priority = utils.isNotEmptyVal(filters.priority) ? filters.priority : "";
        formattedFilters.taskSubCategory = utils.isNotEmptyVal(filters.task_subcategory) ? filters.task_subcategory : "";
        formattedFilters.taskCategory = utils.isNotEmptyVal(filters.task_category) ? filters.task_category : "";
        formattedFilters.assignedto = utils.isNotEmptyVal(filters.assignedto) && !isNaN(filters.assignedto) && (filters.mytask != 1) ? parseInt(filters.assignedto) : "";
        formattedFilters.assignedby = utils.isNotEmptyVal(filters.assignedby) && !isNaN(filters.assignedby) ? parseInt(filters.assignedby) : "";
        formattedFilters.dueStartDate = utils.isNotEmptyVal(filters.s) ? filters.s : "";
        formattedFilters.dueEndDate = utils.isNotEmptyVal(filters.e) ? filters.e : "";
        formattedFilters.sortBy = filters.sortBy;
        formattedFilters.pageNum = filters.pageNum;
        formattedFilters.pageSize = filters.pageSize;
        formattedFilters.mytask = angular.isDefined(filters.mytask) ? filters.mytask : 1;
        formattedFilters.status = utils.isNotEmptyVal(filters.status) ? filters.status : "";
        formattedFilters.intakeId = utils.isNotEmptyVal(filters.intakeId) ? parseInt(filters.intakeId) : 0;

        return formattedFilters;
    };
    // function exportTaskSummary(requestFilters) {
    //     var url = exportUrl;

    //     url += '?reportname=TaskSummary&filename=Report_task_summary.xlsx&type=excel';
    //     url += "&" + utils.getParams(requestFilters);
    //     var download = window.open(url, '_self');
    // }

    // function getTaskSummaryCount(requestFilters) {
    //     var url = taskSummaryCountUrl;
    //     url += '?' + getParams(requestFilters);
    //     return $http.get(url);
    // }

    // function getTaskSummaryData(requestFilters) {
    //     var url = taskSummaryUrl;
    //     url += '?' + getParams(requestFilters);
    //     var deferred = $q.defer();
    //     $http({
    //         url: url,
    //         method: "GET",
    //         withCredentials: true
    //     }).success(function (response) {
    //         deferred.resolve(response);
    //     });
    //     return deferred.promise;
    // }

    function getAssignedUserData(requestFilters) {
        var url = assignedUserUrl;
        var deferred = $q.defer();
        $http({
            url: url,
            method: "GET",
            withCredentials: true
        }).success(function (response) {
            deferred.resolve(response);
        });
        return deferred.promise;
    }

}