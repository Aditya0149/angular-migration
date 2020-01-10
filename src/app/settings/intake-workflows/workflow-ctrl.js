(function (angular) {
  "user strict";

  angular
    .module("intake.workflow")
    .controller("intakeworkFlowCtrl", intakeworkFlowCtrl);

  intakeworkFlowCtrl.$inject = [
    "$scope",
    "intakeworkFlowDatalayer",
    "intakeworkflowHelper",
    "intakeworkFlowTemplateDataService",
    "modalService",
    "notification-service",
    "$rootScope",
    "practiceAndBillingDataLayer"
  ];
  function intakeworkFlowCtrl(
    $scope,
    intakeworkFlowDatalayer,
    intakeworkflowHelper,
    intakeworkFlowTemplateDataService,
    modalService,
    notificationService,
    $rootScope,
    practiceAndBillingDataLayer
  ) {
    var vm = this;

    vm.selectAllWorkflow = selectAllWorkflow;
    vm.allWorkflowSelected = allWorkflowSelected;
    vm.isUserSelected = isUserSelected;
    vm.addWorkflow = addWorkflow;
    vm.editWorkflow = editWorkflow;
    vm.cloneWorkflow = cloneWorkflow;
    vm.viewWorkflow = viewWorkflow;
    vm.deleteWorkflow = deleteWorkflow;
    // vm.is_workflow =false;
    $scope.intakeWorkflowDisplay = {};
    $scope.intakeWorkflowDisplay.page = "WorkflowList";
    vm.init = init;

    $rootScope.viewWorkflowflag = false;

    (function () {
      init();
    })();

    function init() {
      var response = practiceAndBillingDataLayer.getConfigurableData();
      response.then(function (data) {
        var resData = data.matter_apps; //promise
        if (angular.isDefined(resData) && resData != "" && resData != " ") {
          vm.is_workflow = resData.workflow == 1 ? true : false;
        }
      });
      vm.userGrid = {
        headers: intakeworkflowHelper.getWorkflowGrid(),
        selectedItems: []
      };
      vm.dataReceived = false;
      getWorkflowList();
      // intakeworkflowHelper.setWorkflowBreadCrum('Settings','settings.profile');
    }

    function getWorkflowList() {
      intakeworkFlowDatalayer.getWorkflowList().then(function (response) {
        response.data = _.sortBy(response.data, 'created_on').reverse();
        _.forEach(response.data, function (item) {
          item.created_on = utils.isEmptyVal(item.created_on)
            ? ""
            : moment
              .unix(item.created_on)
              .utc()
              .format("MM/DD/YYYY");
        });
        var data = response.data;
        vm.workflowList = data;
        vm.dataReceived = true;
        intakeworkFlowTemplateDataService.setTemplatelist(data);
      });
    }

    function selectAllWorkflow(isSelected) {
      if (isSelected === true) {
        vm.userGrid.selectedItems = angular.copy(vm.workflowList);
      } else {
        vm.userGrid.selectedItems = [];
      }
    }

    function allWorkflowSelected() {
      if (utils.isEmptyVal(vm.workflowList)) {
        return false;
      }
      return vm.userGrid.selectedItems.length === vm.workflowList.length;
    }

    function isUserSelected(uid) {
      var uids = _.pluck(vm.userGrid.selectedItems, "workflow_id");
      return uids.indexOf(uid.workflow_id) > -1;
    }

    function addWorkflow(data) {
      intakeworkFlowTemplateDataService.setSelectedTemplateData(data);
      $scope.intakeWorkflowDisplay.page = "addWorkflow";
    }

    function editWorkflow(workflowdata) {
      intakeworkFlowTemplateDataService.setSelectedTemplateData(workflowdata);
      $scope.intakeWorkflowDisplay.page = "editWorkflow";
    }

    function cloneWorkflow(workflowdata, cloneWorkflow) {
      workflowdata.cloneWorkflow = cloneWorkflow;
      intakeworkFlowTemplateDataService.setSelectedTemplateData(workflowdata);
      $scope.intakeWorkflowDisplay.page = "editWorkflow";
    }
    function viewWorkflow(workflowdata) {
      $scope.intakeWorkflowDisplay.page = "viewWorkflowflagNew";
      intakeworkflowHelper.setworkflowData(workflowdata);
      //  $rootScope.viewWorkflowflag =true;
    }

    function deleteWorkflow(workflow, filterdData) {
      var selectedWorkflow = angular.copy(workflow);
      if (utils.isNotEmptyVal(vm.searchText) && allWorkflowSelected()) {
        selectedWorkflow = filterdData;
      }
      //confirm before delete
      var modalOptions = {
        closeButtonText: "Cancel",
        actionButtonText: "Delete",
        headerText: "Delete ?",
        bodyText: "Are you sure you want to delete ?"
      };
      modalService.showModal({}, modalOptions).then(function () {
        var workflowIds = _.pluck(selectedWorkflow, "workflow_id");
        var promesa = intakeworkFlowDatalayer.deleteWorkflow(workflowIds);
        promesa.then(
          function (data) {
            notificationService.success("Workflow deleted successfully");
            vm.userGrid.selectedItems.length = 0;
            //vm.dataReceived = false;
            getWorkflowList();
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
    .factory("intakeworkFlowDatalayer", intakeworkFlowDatalayer);

  intakeworkFlowDatalayer.$inject = ["$http", "globalConstants"];
  function intakeworkFlowDatalayer($http, globalConstants) {
    var urls = {
      workflowList: globalConstants.intakeServiceBaseV2 + "workflow_template",
      deleteWorkflow: globalConstants.intakeServiceBaseV2 + "workflow_template",
      rolelist: globalConstants.intakeServiceBaseV2 + "practice/all_user_role"
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
      getWorkflowList: _getWorkflowList,
      deleteWorkflow: _deleteWorkflow,
      getRoleList: _getRoleList
    };

    function _getWorkflowList() {
      var url = urls.workflowList;
      return $http.get(url);
    }

    function _getRoleList() {
      var url = urls.rolelist;
      return $http.get(url);
    }

    function _deleteWorkflow(selWorkflow) {
      var data = { workflowIds: selWorkflow.toString() };
      var url = urls.deleteWorkflow + "?" + getParams(data);
      return $http({
        url: url,
        method: "DELETE"
      });
    }
  }
})(angular);

(function (angular) {
  angular
    .module("intake.workflow")
    .service(
      "intakeworkFlowTemplateDataService",
      intakeworkFlowTemplateDataService
    );

  intakeworkFlowTemplateDataService.$inject = [];
  function intakeworkFlowTemplateDataService() {
    var selectedTemplateInfo = {};
    var selectedTaskInfo = {};
    var selectedEventInfo = {};
    var selectedRoleId = {};
    var workflowTemplatelist = {};
    return {
      setSelectedTemplateData: _setSelectedTemplateData,
      getSelectedTemplateData: _getSelectedTemplateData,

      setSelectedTaskData: _setSelectedTaskData,
      getSelectedTaskData: _getSelectedTaskData,

      setSelectedEventData: _setSelectedEventData,
      getSelectedEventData: _getSelectedEventData,

      setTemplatelist: _setTemplatelist,
      getTemplatelist: _getTemplatelist
    };


    function _setTemplatelist(data) {
      workflowTemplatelist = data;
    }

    function _getTemplatelist() {
      return workflowTemplatelist;
    }
    function _setSelectedTemplateData(data) {
      selectedTemplateInfo = data;
    }

    function _getSelectedTemplateData() {
      return selectedTemplateInfo;
    }

    function _setSelectedTaskData(data) {
      selectedTaskInfo = data;
    }

    function _getSelectedTaskData() {
      return selectedTaskInfo;
    }

    function _setSelectedEventData(data) {
      selectedEventInfo = data;
    }

    function _getSelectedEventData() {
      return selectedEventInfo;
    }
  }
})(angular);

(function (angular) {
  angular
    .module("intake.workflow")
    .factory("intakeworkflowHelper", intakeworkflowHelper);

  intakeworkflowHelper.$inject = [];

  function intakeworkflowHelper() {
    var selectedWorkflowData = {};

    return {
      getWorkflowGrid: _getWorkflowGrid,
      setworkflowData: _setworkflowData,
      getworkflowData: _getworkflowData
      // setWorkflowBreadCrum: _setWorkflowBreadCrum
    };

    function _getworkflowData() {
      return selectedWorkflowData;
    }

    function _setworkflowData(workflowdata) {
      selectedWorkflowData = workflowdata;
      //return workflowdata;
    }

    function _getWorkflowGrid() {
      return [
        {
          field: [
            {
              prop: "workflow_name",
              html:
                '<span ng-click="intakeworkFlowCtrl.viewWorkflow(data)" tooltip-append-to-body="true" tooltip={{data.workflow_name}}>{{data.workflow_name}}</span>',
              cursor: true
            }
          ],
          displayName: "Workflow Name",
          dataWidth: "20"
        },

        {
          field: [
            {
              prop: "description",
              html:
                '<span tooltip-append-to-body="true" style="text-align: left;"  tooltip-placement="top" tooltip={{data.description}}>{{data.description}}</span>'
              // printDisplay: 'Workflow Description'
            }
          ],
          displayName: "Workflow Description",
          dataWidth: "35"
        },
        {
          field: [
            {
              prop: "created_by"
              // printDisplay: 'Created By'
            }
          ],
          displayName: "Created By",
          dataWidth: "20"
        },
        {
          field: [
            {
              prop: "created_on"
              // printDisplay: 'Created Date'
            }
          ],
          displayName: "Created Date",
          dataWidth: "20"
        }
      ];
    }

    // function _setWorkflowBreadCrum(name,state,param){
    //     var initCrum = [{ name: '...' }];
    //     routeManager.setBreadcrum(initCrum);
    //     var breadcrum = [{ name: name, state: state,param:param},{ name: 'Workflow' }];
    //     routeManager.addToBreadcrum(breadcrum);
    // }
  }
})(angular);
