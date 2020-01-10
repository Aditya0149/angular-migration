(function (angular) {

    'user strict';

    angular.module('cloudlex.workflow')
        .controller('workFlowCtrl', workFlowCtrl);

    workFlowCtrl.$inject = ['workFlowDatalayer', 'workflowHelper', 'workFlowTemplateDataService',
        'modalService', 'notification-service', '$rootScope', 'practiceAndBillingDataLayer'
    ];

    function workFlowCtrl(workFlowDatalayer, workflowHelper, workFlowTemplateDataService,
        modalService, notificationService, $rootScope, practiceAndBillingDataLayer) {

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
        vm.display = {};
        vm.display.page = "WorkflowList";
        vm.init = init;

        $rootScope.viewWorkflowflag = false;

        (function () {
            init();
        })();


        function init() {
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                var resData = data.matter_apps; //promise
                if (angular.isDefined(resData) && resData != '' && resData != ' ') {
                    vm.is_workflow = (resData.workflow == 1) ? true : false;
                }
            });
            vm.userGrid = {
                headers: workflowHelper.getWorkflowGrid(),
                selectedItems: []
            };
            vm.dataReceived = false;
            getWorkflowList();
            // workflowHelper.setWorkflowBreadCrum('Settings','settings.profile');
        }


        function getWorkflowList() {
            workFlowDatalayer.getWorkflowList()
                .then(function (response) {
                    response.data = _.sortBy(response.data, 'created_on').reverse();
                    _.forEach(response.data, function (item) {
                        item.created_on = (utils.isEmptyVal(item.created_on)) ? "" : moment.unix(item.created_on).utc().format('MM/DD/YYYY');
                    });
                    var data = response.data;
                    vm.workflowList = data;
                    vm.dataReceived = true;
                    workFlowTemplateDataService.setTemplatelist(data); 
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
            var uids = _.pluck(vm.userGrid.selectedItems, 'workflow_id');
            return uids.indexOf(uid.workflow_id) > -1;

        }

        function addWorkflow(data) {
            workFlowTemplateDataService.setSelectedTemplateData(data);
            vm.display.page = "addWorkflow";

        }


        function editWorkflow(workflowdata) {
            workFlowTemplateDataService.setSelectedTemplateData(workflowdata);
            vm.display.page = "editWorkflow";
        }

        function cloneWorkflow(workflowdata, cloneWorkflow) {
            workflowdata.cloneWorkflow = cloneWorkflow;
            workFlowTemplateDataService.setSelectedTemplateData(workflowdata);
            vm.display.page = "editWorkflow";
        }

        function viewWorkflow(workflowdata) {
            vm.display.page = "viewWorkflowflag";
            workflowHelper.setworkflowData(workflowdata);
            //  $rootScope.viewWorkflowflag =true;             
        }


        function deleteWorkflow(workflow, filterdData) {
            var selectedWorkflow = angular.copy(workflow);
            if (utils.isNotEmptyVal(vm.searchText) && allWorkflowSelected()) {
                selectedWorkflow = filterdData;
            }
            //confirm before delete
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };
            modalService.showModal({}, modalOptions).then(function () {
                var workflowIds = _.pluck(selectedWorkflow, 'workflow_id');
                var promesa = workFlowDatalayer.deleteWorkflow(workflowIds);
                promesa.then(function (data) {
                    notificationService.success('Workflow deleted successfully');
                    vm.userGrid.selectedItems.length = 0;
                    //vm.dataReceived = false;
                    getWorkflowList();
                }, function (error) {
                    alert("unable to delete")
                });
            });

        }

    }

})(angular);

(function (angular) {

    angular.module('cloudlex.workflow')
        .factory('workFlowDatalayer', workFlowDatalayer);

    workFlowDatalayer.$inject = ['$http', 'globalConstants', '$rootScope'];

    function workFlowDatalayer($http, globalConstants, $rootScope) {

        var urls = {
            workflowList: globalConstants.javaWebServiceBaseV4 + 'workflow_template',
            deleteWorkflow: globalConstants.javaWebServiceBaseV4 + 'workflow_template',
            rolelist: globalConstants.webServiceBase + '/practice/all_user_role',
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
            var data = {
                'workflowIds': selWorkflow.toString()
            };
            var url = urls.deleteWorkflow + '?' + getParams(data);
            return $http({
                url: url,
                method: "DELETE"
            });
        }
    }


})(angular);

(function (angular) {

    angular.module('cloudlex.workflow')
        .service('workFlowTemplateDataService', workFlowTemplateDataService);

    workFlowTemplateDataService.$inject = [];

    function workFlowTemplateDataService() {

        var selectedTemplateInfo = {};
        var selectedTaskInfo = {};
        var selectedEventInfo = {};
        var selectedRoleId = {};
        var workflowTemplatelist ={};

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

    angular.module('cloudlex.workflow')
        .factory('workflowHelper', workflowHelper);

    workflowHelper.$inject = ['routeManager'];

    function workflowHelper(routeManager) {

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
            return [{
                field: [{
                    prop: 'name',
                    html: '<span ng-click="workFlowCtrl.viewWorkflow(data)" tooltip-append-to-body="true" tooltip={{data.name}}>{{data.name}}</span>',
                    cursor: true
                }],
                displayName: 'Workflow Name',
                dataWidth: "20"
            },

            {
                field: [{
                    prop: 'description',
                    html: '<span tooltip-append-to-body="true" style="text-align: left;"  tooltip-placement="top" tooltip={{data.description}}>{{data.description}}</span>',
                    // printDisplay: 'Workflow Description'
                }],
                displayName: 'Workflow Description',
                dataWidth: "35"
            },
            {
                field: [{
                    prop: 'created_by',
                    // printDisplay: 'Created By'
                }],
                displayName: 'Created By',
                dataWidth: "20"
            },
            {
                field: [{
                    prop: 'created_on',
                    // printDisplay: 'Created Date'
                }],
                displayName: 'Created Date',
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