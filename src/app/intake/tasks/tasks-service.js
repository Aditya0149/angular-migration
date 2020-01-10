(function () {
    angular
        .module('intake.tasks')
        .factory('IntakeTasksHelper', intakeTasksService);

    function intakeTasksService() {

        var globalTaskInfo = {
            isGlobal: false,
            taskId: undefined,
        };

        var savedTask = {

        };

        return {
            getGlobalTaskInfo: getGlobalTaskInfo,
            resetTaskInfo: resetTaskInfo,
            setGlobalTaskInfo: setGlobalTaskInfo,
            getDefaultFilter: getDefaultFilter,
            getTaskFilters: getTaskFilters,
            setProgressInfo: setProgressInfo,
            setSavedTask: setSavedTask,
            getSavedTask: getSavedTask,
            setTaskCategories: setTaskCategories,
            printSelectedTask: printSelectedTask,
        };

        function getGlobalTaskInfo() {
            return globalTaskInfo;
        }

        function resetTaskInfo() {
            globalTaskInfo = {
                isGlobal: false,
                taskId: undefined,
            };
        }

        function setGlobalTaskInfo(taskId) {
            globalTaskInfo.taskId = taskId;
            globalTaskInfo.isGlobal = true;
        }

        function getDefaultFilter() {
            //     var d = moment().startOf('day').utc();
            //     d = new Date(d.toDate());
            //    // var startOfDayUTC = d.getTime();
            //    var startOfDayUTC = moment(d).utc();
            var today = moment().startOf('day');
            var startOfDayUTC = utils.getUTCTimeStamp(today);

            return {
                pageNum: 1,
                pageSize: 1000,
                tab: 'cu',
                status: [],
                complete: [],
                period: {},
                priority: '',
                taskdate: startOfDayUTC
            };
        }

        function getTaskFilters() {
            return [
                { key: 'ov', value: 'Overdue', count: 0 },
                { key: 'cu', value: 'Current', count: 0 },
                { key: 'co', value: 'Completed', count: 0 }
            ];
        }

        function setProgressInfo(taskList) {
            _.forEach(taskList, function (task) {
                var completed = task.percentage_complete || 0;
                task.completed = [
                    { value: completed, type: 'success' }, { value: 100 - completed, type: 'danger' }
                ]
            });
        }

        function setSavedTask(task) {
            savedTask.data = task;
            savedTask.tab = utils.isEmptyObj(task) ? 'cu' : getStatus(task);
        }

        function getStatus(task) {
            if (isTaskComplete(task)) {
                return "co"
            }
            if (isTaskCurrent(task)) {
                return "cu";
            }
            if (isTaskOverdue(task)) {
                return "ov";
            }

        }

        function isTaskComplete(task) {
            return parseInt(task.percentage_complete) === 100;
        }

        function isTaskCurrent(task) {
            var dueDate = moment(moment.unix(task.due_date).utc().format('MM/DD/YYYY'));
            var todayStartOfDay = moment().startOf('day');
            return ((parseInt(task.percentage_complete) < 100) &&
                (dueDate.isAfter(todayStartOfDay) || dueDate.isSame(todayStartOfDay)));
        }

        function isTaskOverdue(task) {
            var dueDate = moment.unix(task.due_date);
            var todayStartOfDay = moment().startOf('day');
            return ((parseInt(task.percentage_complete) < 100) && dueDate.isBefore(todayStartOfDay));
        }

        function getSavedTask() {
            return savedTask;
        }

        function setTaskCategories(categories) {
            var displayCategories = [];
            angular.forEach(categories, function (val, key) {
                var catObj = {
                    label: key,
                    children: setChildren(val)
                };
				catObj.taskcategoryid = catObj.children[0].taskcategoryid;
                displayCategories.push(catObj);
            });

            displayCategories.push({
                label: 'Other',
                tasksubcategoryid: "0",
                taskcategoryid: "0",
                children: [{
                    label: "",
                    taskcategoryid: "0",
                    tasksubcategoryid: "0"
                }]
            });

            return displayCategories;

            function setChildren(children) {
                var childs = [];
                _.forEach(children, function (child) {
                    var childObj = {
                        label: child.name,
                        notes: child.name,
                        taskcategoryid: child.intake_taskcategory_id,
                        tasksubcategoryid: child.intake_task_subcategory_id,
                        taskcategoryname: child.categoryname
                    };
                    childs.push(childObj);
                });
                return childs;
            }
        }

        //US#8147 print selected task
        function printSelectedTask(task) {
            var printTask = angular.copy(task);

            var usrfullname = [];
            if (printTask.assignedTo.length > 0) {
                var usrname = [];
                usrname = _.filter(_.unique(printTask.assignedTo, 'userId'));
                _.forEach(usrname, function (item) {
                    // item.user_fname = utils.isEmptyVal(item.fname) ? '' : item.fname;
                    // item.user_lname = utils.isEmptyVal(item.lname) ? '' : item.lname;
                    usrfullname.push(item.fullName);
                })
                printTask.name = usrfullname.join(', ');
            } else {
                printTask.name = "";
            }
            if (printTask.remind_users_new instanceof Array) {
                _.forEach(printTask.remind_users_new, function (currentItem) {
                    currentItem.name = utils.isEmptyVal(currentItem.fullName) ? '' : currentItem.fullName;
                })
                printTask.remind_users_new = _.pluck(printTask.remind_users_new, 'fullName').join(', ');
            }
            printTask.assignment_date = utils.isEmptyVal(printTask.assignment_date) ? '-' : moment.unix(printTask.assignment_date).utc().format('MM-DD-YYYY');
            printTask.due_date = utils.isEmptyVal(printTask.due_date) ? '-' : moment.unix(printTask.due_date).utc().format('MM-DD-YYYY');
            printTask.notes = utils.isEmptyVal(printTask.notes) ? ' ' : printTask.notes;
            printTask.doc_uri = utils.isEmptyVal(printTask.doc_uri) ? ' ' : printTask.doc_uri;
            // printTask.asgnfname = utils.isEmptyVal(printTask.assigned_by.fname) ? '' : printTask.assigned_by.fname;
            // printTask.asgnlname = utils.isEmptyVal(printTask.assigned_by.lname) ? '' : printTask.assigned_by.lname;
            var assignedBy = printTask.assigned_by.fullName;
            assignedBy = utils.isEmptyVal(assignedBy) ? '-' : assignedBy;
            printTask.priority = utils.isEmptyVal(printTask.priority) ? '-' : printTask.priority;
            printTask.status = utils.isEmptyVal(printTask.status) ? '-' : printTask.status;
            printTask.percentage_complete = utils.isEmptyVal(printTask.percentage_complete) ? '-' : printTask.percentage_complete
            if (utils.isNotEmptyVal(printTask.reminder_days)) {
                printTask.reminder_days = printTask.reminder_days.map(function (currentItem) {
                    return currentItem == '0' ? 'Due Day' : currentItem;
                })
                if (printTask.reminder_days.toString() == "null") {
                    printTask.reminder_days = '-';
                }
            }
            printTask.reminder_days = utils.isEmptyVal(printTask.reminder_days) ? '-' : printTask.reminder_days;
            printTask.custom_reminder = utils.isEmptyVal(printTask.custom_reminder) ? '' : moment.unix(printTask.custom_reminder).utc().format('MM-DD-YYYY');
            var strVar = "";
            strVar += "<html><head><title>Task <\/title>";
            strVar += "<link rel='shortcut icon' href='favicon.ico' type='image\/vnd.microsoft.icon'>";
            strVar += "<style> td{border-top: 1px solid #ddd; padding:8px;} @media print{ #printBtn{display:none} thead {display: table-header-group;}} td{padding:6px 0;}</style>";
            strVar += "<\/head>";
            strVar += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=\"styles\/images\/logo.png \" width='200px'\/>";
            strVar += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'\/>Task <\/h1>";
            strVar += "";
            strVar += "<div style=\"width:100%; clear:both\"><button onclick=\"window.print()\" style=\"margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;\" id=\"printBtn\">Print<\/button><\/div>";
            strVar += "    ";
            strVar += "    ";
            strVar += "<table style='width:100%; margin-top:10px;'>";
            strVar += "<tr><td style='width:15%;'><b>Task Name:</b></td><td>" + utils.removeunwantedHTML(printTask.task_name) + "</td></tr>";
            strVar += "<tr><td style='width:15%;'><b>Assigned To:</b></td><td>" + utils.removeunwantedHTML(printTask.name) + "</td></tr>";
            if (utils.isNotEmptyVal(printTask.doc_uri)) {
                strVar += "<tr><td style='width:15%;'><b>Description:</b></td><td style='white-space:pre-wrap'>" + utils.removeunwantedHTML(printTask.doc_uri) + '&nbsp;&nbsp;' + utils.removeunwantedHTML(printTask.notes) + "</td></tr>";
            } else {
                strVar += "<tr><td style='width:15%;'><b>Description:</b></td><td style='white-space:pre-wrap'>" + utils.removeunwantedHTML(printTask.notes) + "</td></tr>";
            } strVar += "<tr><td style='width:15%;'><b>Assigned on:</b></td><td>" + printTask.assignment_date + "</td></tr>";
            strVar += "<tr><td style='width:15%;'><b>Assigned By:</b></td><td>" + assignedBy + "</td></tr>";
            strVar += "<tr><td style='width:15%;'><b>Due Date:</b></td><td>" + printTask.due_date + "</td></tr>";
            strVar += "<tr><td style='width:15%;'><b>Priority:</b></td><td>" + printTask.priority + "</pre></td></tr>";
            strVar += "<tr><td style='width:15%;'><b>Status:</b></td><td>" + printTask.status + "</pre></td></tr>";
            strVar += "<tr><td style='width:15%;'><b>Percentage Complete:</b></td><td>" + printTask.percentage_complete + ' %' + "</td></tr>";
            strVar += "<tr><td style='width:15%;'><b>Reminder Days Prior to Due Date:</b></td><td>" + printTask.reminder_days.toString() + "</td></tr>";
            if (utils.isNotEmptyVal(printTask.custom_reminder)) {
                strVar += "<tr><td style='width:15%;'><b>And/Or Custom Date Reminder:</b></td><td>" + printTask.custom_reminder + "</td></tr>";
            }
            if (utils.isNotEmptyVal(printTask.remind_users_new)) {
                strVar += "<tr><td style='width:15%;'><b>Remind Users:</b></td><td>" + utils.removeunwantedHTML(printTask.remind_users_new.toString()) + "</td></tr>";
            }
            strVar += "</table></td><td style='vertical-align:top'>";
            return strVar;

        }
    }

})();


(function (angular) {

    angular
        .module('intake.tasks')
        .factory('IntakeTasksHelperForIntake', IntakeTasksHelperForIntake);

    function IntakeTasksHelperForIntake() {
        return {
            getDefaultFilter: getDefaultFilter,
            getTaskFilters: getTaskFilters,
            setProgressInfo: setProgressInfo,
            setFilterTaskCount: setFilterTaskCount,
            getTaskByFilter: getTaskByFilter,
        };

        function getDefaultFilter() {
            var d = new Date();
            var utc_start_of_day = utils.getStartOfDayUTCDate(d);
            var startOfDayUTC = utils.getStartOfDayTimestamp(utc_start_of_day);
            return {
                pageNum: 1,
                pageSize: 1000,
                status: '',
            };
        }

        function getTaskFilters() {
            return [
                { key: 'ov', value: 'Overdue', count: 0 },
                { key: 'cu', value: 'Current', count: 0 },
                { key: 'co', value: 'Completed', count: 0 }
            ];
        }

        function setProgressInfo(taskList) {
            _.forEach(taskList, function (task) {
                var completed = task.percentage_complete;
                task.completed = [
                    { value: completed, type: 'success' }, { value: 100 - completed, type: 'danger' }
                ]
            });
        }

        function setFilterTaskCount(allTasks, filters) {
            _.forEach(filters, function (filter) {
                filter.count = getTaskByFilter(allTasks, filter.key).length;
            });
        }

        function getTaskByFilter(allTasks, param) {
            switch (param) {
                case 'cu':
                    return getCurrentTasks(allTasks);
                    break;
                case 'co':
                    return getCompletedTasks(allTasks);
                    break;
                case 'ov':
                    return getOverdueTasks(allTasks);
                    break;
            }
        }

        function getCurrentTasks(allTasks) {
            var currentTasks = _.filter(allTasks, function (task) {
                var dueDate = moment.unix(task.dueutcdate);
                var todayStartOfDay = moment().startOf('day');
                return ((parseInt(task.percentage_complete) < 100) &&
                    (dueDate.isAfter(todayStartOfDay) || dueDate.isSame(todayStartOfDay)));
            });

            return currentTasks;
        }

        function getCompletedTasks(allTasks) {
            var completedTasks = _.filter(allTasks, function (task) {
                return parseInt(task.percentage_complete) === 100;
            });

            return completedTasks;
        }

        function getOverdueTasks(allTasks) {
            var overdueTasks = _.filter(allTasks, function (task) {
                var dueDate = moment.unix(task.dueutcdate);
                var todayStartOfDay = moment().startOf('day');
                return ((parseInt(task.percentage_complete) < 100) && dueDate.isBefore(todayStartOfDay));
            });

            return overdueTasks;
        }


    }

})(angular);
