(function () {
    angular
        .module('cloudlex.tasks')
        .factory('tasksHelper', tasksService);

    function tasksService() {

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
            setSavedTask_notification: setSavedTask_notification,
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
                status: [],
                complete: [],
                period: {},
                priority: '',
                tab: 'cu',
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

        // Functions for Notification navigation for bug#14226

        function setSavedTask_notification(task) {
            savedTask.data = task;
            savedTask.tab = utils.isEmptyObj(task) ? 'cu' : getStatus(task);
        }

        function getStatus_notification(task) {
            if (isTaskComplete_notification(task)) {
                return "co"
            }
            if (isTaskCurrent_notification(task)) {
                return "cu";
            }
            if (isTaskOverdue_notification(task)) {
                return "ov";
            }

        }

        function isTaskComplete_notification(task) {
            if (task.percentagecomplete) {
                return parseInt(task.percentagecomplete) === 100;
            } else {
                return parseInt(task.percentage_complete) === 100;
            }
        }

        function isTaskCurrent_notification(task) {
            var dueDate = (task.due_date) ? moment(task.due_date) : moment(task.duedate); //moment(moment.unix(task.due_date).utc().format('MM/DD/YYYY')) : moment(moment.unix(task.duedate).utc().format('MM/DD/YYYY'));
            var todayStartOfDay = moment().startOf('day');
            return ((parseInt(task.percentage_complete || task.percentagecomplete) < 100) &&
                (moment(dueDate).isAfter(todayStartOfDay) || dueDate.isSame(todayStartOfDay)));
        }

        function isTaskOverdue_notification(task) {
            var dueDate = (task.due_date) ? moment(task.due_date) : moment(task.duedate); //moment(moment.unix(task.due_date).utc().format('MM/DD/YYYY')) : moment(moment.unix(task.duedate).utc().format('MM/DD/YYYY'));
            var todayStartOfDay = moment().startOf('day');
            return ((parseInt(task.percentage_complete || task.percentagecomplete) < 100) && dueDate.isBefore(todayStartOfDay));
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
                        practiceareaid: child.practiceareaid,
                        taskcategoryid: child.taskcategoryid,
                        tasksubcategoryid: child.tasksubcategoryid
                    };
                    childs.push(childObj);
                });
                return childs;
            }
        }

        //US#8147 print selected task
        function printSelectedTask(task, filenumber) {
            var filenumber = filenumber;
            var printTask = angular.copy(task);
            if (printTask.assigned_to) {
                _.forEach(printTask.assigned_to, function (currentItem) {
                    currentItem.name = utils.isEmptyVal(currentItem.first_name) ? '' : currentItem.first_name;
                    currentItem.name += ' ';
                    currentItem.name += utils.isEmptyVal(currentItem.last_name) ? '' : currentItem.last_name;
                })
                printTask.name = _.pluck(printTask.assigned_to, 'name').join(', ');
            } else {
                printTask.assign_to = '-';
            }
            if (printTask.remind_users_new instanceof Array) {
                _.forEach(printTask.remind_users_new, function (currentItem) {
                    currentItem.name = utils.isEmptyVal(currentItem.full_name) ? '' : currentItem.full_name;
                })
                printTask.remind_users_new = _.pluck(printTask.remind_users_new, 'full_name').join(', ');
            }
            printTask.assignment_date = utils.isEmptyVal(printTask.assignment_date) ? '-' : moment.unix(printTask.assignment_date).utc().format('MM-DD-YYYY');
            printTask.due_date = utils.isEmptyVal(printTask.due_date) ? '-' : moment.unix(printTask.due_date).utc().format('MM-DD-YYYY');
            printTask.notes = utils.isEmptyVal(printTask.notes) ? ' ' : printTask.notes;
            printTask.doc_uri = utils.isEmptyVal(printTask.doc_uri) ? ' ' : printTask.doc_uri;
            printTask.first_name = utils.isEmptyVal(printTask.assigned_by.first_name) ? '' : printTask.assigned_by.first_name;
            printTask.last_name = utils.isEmptyVal(printTask.assigned_by.last_name) ? '' : printTask.assigned_by.last_name;
            var assignedBy = printTask.first_name + " " + printTask.last_name;
            assignedBy = utils.isEmptyVal(assignedBy) ? '-' : assignedBy;
            filenumber = utils.isEmptyVal(filenumber) ? '-' : filenumber;
            printTask.matter_name = utils.isEmptyVal(printTask.matter.matter_name) ? '-' : printTask.matter.matter_name;
            printTask.priority = utils.isEmptyVal(printTask.priority) ? '-' : printTask.priority;
            printTask.status = utils.isEmptyVal(printTask.status) ? '-' : printTask.status;
            printTask.percentagecomplete = utils.isEmptyVal(printTask.percentage_complete) ? '-' : printTask.percentage_complete
            if (utils.isNotEmptyVal(printTask.reminder_days)) {
                printTask.reminder_days = printTask.reminder_days.map(function (currentItem) {
                    return currentItem == '0' ? 'Due Day' : currentItem;
                })
                if (printTask.reminder_days.toString() == "null") {
                    printTask.reminder_days = '-';
                }
            }
            printTask.reminder_days = utils.isEmptyVal(printTask.reminder_days) ? '-' : printTask.reminder_days;
            printTask.task_name = utils.isEmptyVal(printTask.task_name) ? '-' : printTask.task_name;
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
            strVar += "<tr><td style='width:15%;'><b>Matter Name:</b></td><td>" + utils.removeunwantedHTML(printTask.matter_name) + "</td></tr>";
            strVar += "<tr><td style='width:15%;'><b>File #:</b></td><td>" + utils.removeunwantedHTML(filenumber) + "</td></tr>";
            strVar += "<tr><td style='width:15%;'><b>Task Name:</b></td><td>" + utils.removeunwantedHTML(printTask.task_name) + "</td></tr>";
            strVar += "<tr><td style='width:15%;'><b>Assigned To:</b></td><td>" + utils.removeunwantedHTML(printTask.name) + "</td></tr>";
            if (utils.isNotEmptyVal(printTask.doc_uri)) {
                strVar += "<tr><td style='width:15%;'><b>Description:</b></td><td style='white-space:pre-wrap'>" + utils.removeunwantedHTML(printTask.doc_uri) + '&nbsp;&nbsp;' + utils.removeunwantedHTML(printTask.notes) + "</td></tr>";
            } else {
                strVar += "<tr><td style='width:15%;'><b>Description:</b></td><td style='white-space:pre-wrap'>" + utils.removeunwantedHTML(printTask.notes) + "</td></tr>";
            }

            strVar += "<tr><td style='width:15%;'><b>Assigned on:</b></td><td>" + printTask.assignment_date + "</td></tr>";
            strVar += "<tr><td style='width:15%;'><b>Assigned By:</b></td><td>" + utils.removeunwantedHTML(assignedBy) + "</td></tr>";
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
