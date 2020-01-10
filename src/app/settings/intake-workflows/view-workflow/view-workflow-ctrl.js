(function (angular) {
  "user strict";

  angular
    .module("intake.workflow")
    .controller("viewintakeWorkflowCtrl", viewintakeWorkflowCtrl);

  viewintakeWorkflowCtrl.$inject = [
    "$scope",
    "intakeviewWorkflowDatalayer",
    "modalService",
    "notification-service",
    "intakeworkflowHelper",
    "intakeworkFlowTemplateDataService"
  ];
  function viewintakeWorkflowCtrl(
    $scope,
    intakeviewWorkflowDatalayer,
    modalService,
    notificationService,
    intakeworkflowHelper,
    intakeworkFlowTemplateDataService
  ) {
    var vm = this;

    vm.selectAllTask = selectAllTask;
    vm.allTaskSelected = allTaskSelected;
    vm.isTaskSelected = isTaskSelected;

    vm.selectAllEvent = selectAllEvent;
    vm.allEventSelected = allEventSelected;
    vm.isEventSelected = isEventSelected;

    vm.addTask = addTask;
    // vm.editTask = editTask;

    vm.addEvent = addEvent;
    // vm.editEvent = editEvent;

    vm.deleteEvent = deleteEvent;
    vm.deleteTasks = deleteTasks;

    vm.activateTab = activateTab;
    vm.back = back;
    vm.activeTab = {};
    vm.display = {};
    vm.display.page = "openViewWorkflow";

    (function () {
      vm.userGrid = {
        selectedTaskItems: [],
        selectedEventItems: []
      };
      var prevActiveTab = localStorage.getItem("viewWorkFlowActiveTab");
      prevActiveTab = utils.isEmptyVal(prevActiveTab) ? "task" : prevActiveTab;
      vm.activeTab[prevActiveTab] = true;

      vm.dataReceived = false;
      vm.selctedWorkflowData = intakeworkflowHelper.getworkflowData();
      getTaskList();
      // setBreadcrum();
    })();

    // function setBreadcrum() {
    //     var initCrum = [{ name: '...' }, { name: 'Settings' }];
    //     routeManager.setBreadcrum(initCrum);
    //     var breadcrum = [{ name: 'Workflow', state: 'settings.workflows' }, { name: vm.selctedWorkflowData.name }];
    //     routeManager.addToBreadcrum(breadcrum);
    // }

    function back() {
      $scope.intakeWorkflowDisplay.page = "WorkflowList";
    }

    function activateTab(tabName, tabs) {
      tabs[tabName] = true;
      angular.forEach(tabs, function (val, key) {
        tabs[key] = key === tabName;
      });
      //persist active tab
      localStorage.setItem("viewWorkFlowActiveTab", tabName);
    }

    function getTaskList() {
      var workflowID = vm.selctedWorkflowData.workflow_id;
      intakeviewWorkflowDatalayer
        .getTaskList(workflowID)
        .then(function (response) {
          var data = response.data;
          vm.clickedWorkflow = JSON.parse(data.workflow_dates);
          vm.evntsList = getformattedEventData(data);
          vm.userList = getformattedData(data);
          vm.dataReceived = true;
        });
    }

    function getformattedData(data) {
      var copyTask = angular.copy(data.workflow_task);
      _.forEach(copyTask, function (data) {
        data.beforeAfter = parseInt(data.no_of_days) < 0 ? "Before" : "After";
        data.no_of_days =
          parseInt(data.no_of_days) < 0
            ? 0 - parseInt(data.no_of_days)
            : data.no_of_days;
        data.daytype =
          data.day_type == "W" ? "Business Days" : "Calendar days";
        if (data.type == "E" && data.ref_date_id == "1") {
          data.selectedtype = "SOL";
        }
        if (data.type == "M") {
          if (data.ref_date_id == "3") {
            data.selectedtype = "DOIn";
          } else if (data.ref_date_id == "2") {
            data.selectedtype = "DOI";
          } else if (data.ref_date_id == "1") {
            data.selectedtype = "MCD";
          }
        }

        if (data.type == "C") {
          if (vm.clickedWorkflow.custom.length > 1) {
            if (data.ref_date_id == "1") {
              data.selectedtype = vm.clickedWorkflow.custom[0].label;
            }
            if (data.ref_date_id == "2") {
              data.selectedtype = vm.clickedWorkflow.custom[1].label;
            }
          } else {
            if (data.ref_date_id == "1") {
              data.selectedtype = vm.clickedWorkflow.custom[0].label;
            } else if (data.ref_date_id == "2") {
              data.selectedtype = vm.clickedWorkflow.custom[0].label;
            }
          }
        }
      });

      return copyTask;
    }

    function getformattedEventData(data) {
      var copyEvent = angular.copy(data.workflow_event);

      _.forEach(copyEvent, function (data) {
        data.beforeAfter = parseInt(data.no_of_days) < 0 ? "Before" : "After";
        data.no_of_days =
          parseInt(data.no_of_days) < 0
            ? 0 - parseInt(data.no_of_days)
            : data.no_of_days;
        data.daytype =
          data.day_type == "W" ? "Business Days" : "Calendar days";
        if (data.type == "E" && data.ref_date_id == "1") {
          data.selectedtype = "SOL";
        }
        if (data.type == "M") {
          if (data.ref_date_id == "3") {
            data.selectedtype = "DOIn";
          } else if (data.ref_date_id == "2") {
            data.selectedtype = "DOI";
          } else if (data.ref_date_id == "1") {
            data.selectedtype = "MCD";
          }
        }
        if (data.type == "C") {
          if (vm.clickedWorkflow.custom.length > 1) {
            if (data.ref_date_id == "1") {
              data.selectedtype = vm.clickedWorkflow.custom[0].label;
            }
            if (data.ref_date_id == "2") {
              data.selectedtype = vm.clickedWorkflow.custom[1].label;
            }
          } else {
            if (data.ref_date_id == "1") {
              data.selectedtype = vm.clickedWorkflow.custom[0].label;
            } else if (data.ref_date_id == "2") {
              data.selectedtype = vm.clickedWorkflow.custom[0].label;
            }
          }
        }
      });
      return copyEvent;
    }

    function selectAllTask(isSelected) {
      if (isSelected === true) {
        vm.userGrid.selectedTaskItems = angular.copy(vm.userList);
      } else {
        vm.userGrid.selectedTaskItems = [];
      }
    }

    function allTaskSelected() {
      if (utils.isEmptyVal(vm.userList)) {
        return false;
      }
      return vm.userGrid.selectedTaskItems.length === vm.userList.length;
    }

    function isTaskSelected(id) {
      var uids = _.pluck(vm.userGrid.selectedTaskItems, "workflow_task_id");
      return uids.indexOf(id) > -1;
    }

    function selectAllEvent(isSelected) {
      if (isSelected === true) {
        vm.userGrid.selectedEventItems = angular.copy(vm.evntsList);
      } else {
        vm.userGrid.selectedEventItems = [];
      }
    }

    function allEventSelected() {
      if (utils.isEmptyVal(vm.evntsList)) {
        return false;
      }
      return vm.userGrid.selectedEventItems.length === vm.evntsList.length;
    }

    function isEventSelected(id) {
      var uids = _.pluck(vm.userGrid.selectedEventItems, "workflow_event_id");
      return uids.indexOf(id) > -1;
    }

    function addTask(task) {
      intakeworkFlowTemplateDataService.setSelectedTaskData(task);
      vm.display.page = "addTaskWorkflow";

      // var modalInstance = $modal.open({
      //     templateUrl: 'app/settings/workflows/view-workflow/add-workflowTask/add-workflowTask.html',
      //     controller: 'addTaskController as addTask',
      //     backdrop: 'static',
      //     resolve: {
      //         'taskData': function () {
      //             return {};
      //         }

      //     }
      // });

      // modalInstance.result.then(function () {
      //     vm.userGrid.selectedTaskItems.length = 0;
      //     vm.dataReceived = false;
      //     getTaskList();

      // });
    }

    function addEvent(event) {
      intakeworkFlowTemplateDataService.setSelectedEventData(event);
      vm.display.page = "addEventWorkflow";
      // var modalInstance = $modal.open({
      //     templateUrl: 'app/settings/workflows/view-workflow/add-workflowEvent/add-workflowEvent.html',
      //     controller: 'addEventController as addEvent',
      //     backdrop: 'static',
      //     resolve: {
      //         'eventData': function () {
      //             return {};
      //         },
      //         'planData': function () {
      //             return vm.subscribeplanData;
      //         }
      //     }
      // });

      // modalInstance.result.then(function () {
      //     vm.userGrid.selectedEventItems.length = 0;
      //     vm.dataReceived = false;

      //     getTaskList();

      // });
    }
    // function editEvent(event) {
    //     var modalInstance = $modal.open({
    //         templateUrl: 'app/settings/workflows/view-workflow/add-workflowEvent/add-workflowEvent.html',
    //         controller: 'addEventController as addEvent',
    //         backdrop: 'static',
    //         resolve: {
    //             'eventData': function () {
    //                 return event;
    //             },

    //         }
    //     });
    //     modalInstance.result.then(function () {
    //         vm.userGrid.selectedEventItems.length = 0;
    //         vm.dataReceived = false;
    //         getTaskList();

    //     });
    // }

    // delete Events
    function deleteEvent(event) {
      var copyDelEvents = angular.copy(event);
      //confirm before delete
      var modalOptions = modalOptDelete();

      modalService.showModal({}, modalOptions).then(function () {
        var eventIds = _.pluck(copyDelEvents, "workflow_event_id");
        var promesa = intakeviewWorkflowDatalayer.deleteEvents(
          eventIds,
          vm.selctedWorkflowData.workflow_id
        );
        promesa.then(
          function (data) {
            notificationService.success("Events deleted successfully");
            vm.userGrid.selectedEventItems.length = 0;
            //vm.dataReceived = false;
            getTaskList();
          },
          function (error) {
            alert("unable to delete");
          }
        );
      });
    }

    function modalOptDelete() {
      var modalOptions = {
        closeButtonText: "Cancel",
        actionButtonText: "Delete",
        headerText: "Delete ?",
        bodyText: "Are you sure you want to delete ?"
      };
      return modalOptions;
    }

    function deleteTasks(task) {
      var copyDelTasks = angular.copy(task);
      //confirm before delete
      var modalOptions = modalOptDelete();

      modalService.showModal({}, modalOptions).then(function () {
        var taskIds = _.pluck(copyDelTasks, "workflow_task_id");
        var promesa = intakeviewWorkflowDatalayer.deleteTasks(
          taskIds,
          vm.selctedWorkflowData.workflow_id
        );
        promesa.then(
          function (data) {
            notificationService.success("Task deleted successfully");
            vm.userGrid.selectedTaskItems.length = 0;
            //vm.dataReceived = false;
            getTaskList();
          },
          function (error) {
            alert("unable to delete");
          }
        );
      });
    }
  }
})(angular);

(function (angular) {
  angular
    .module("intake.workflow")
    .factory("intakeviewWorkflowDatalayer", intakeviewWorkflowDatalayer);

  intakeviewWorkflowDatalayer.$inject = ["$http", "globalConstants"];
  function intakeviewWorkflowDatalayer($http, globalConstants) {
    var urls = {
      workflowList: globalConstants.intakeServiceBaseV2 + "workflow_template/",
      deleteEvent:
        globalConstants.intakeServiceBaseV2 + "workflow_template/event/",
      deleteTask:
        globalConstants.intakeServiceBaseV2 + "workflow_template/task/"
    };

    function getParams(params) {
      var querystring = "";
      angular.forEach(params, function (value, key) {
        querystring += key + "=" + value;
        querystring += "&";
      });
      return querystring.slice(0, querystring.length - 1);
    }

    return {
      getTaskList: _getTaskList,
      deleteTasks: _deleteTasks,
      deleteEvents: _deleteEvents
    };

    function _getTaskList(workflowID) {
      var url = urls.workflowList + workflowID;
      return $http.get(url);
    }

    function _deleteEvents(eventIds, workflowID) {
      var data = { eventIds: eventIds.toString() };
      var url = urls.deleteEvent + workflowID + "?" + getParams(data);
      return $http({
        url: url,
        method: "DELETE"
      });
    }
    function _deleteTasks(taskIds, workflowID) {
      var data = { taskIds: taskIds.toString() };
      var url = urls.deleteTask + workflowID + "?" + getParams(data);
      return $http({
        url: url,
        method: "DELETE"
      });
    }
  }
})(angular);
