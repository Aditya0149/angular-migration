(function (angular) {

    'user strict';  

    angular.module('cloudlex.workflow')
    .controller('matterWorkflowCtrl', matterWorkflowCtrl);

    matterWorkflowCtrl.$inject = ['$modal', 'workFlowDataService','mattWorkFlowHelper',
        'modalService', 'notification-service', 'routeManager', 'masterData', '$rootScope', '$stateParams', 'matterFactory', '$scope', 'contactFactory', 'mailboxDataService'];
    function matterWorkflowCtrl($modal, workFlowDataService,mattWorkFlowHelper,
        modalService, notificationService, routeManager, masterData, $rootScope, $stateParams, matterFactory, $scope, contactFactory, mailboxDataService) {

        var vm = this;

        vm.selectAllUsers = selectAllUsers;
        vm.allUsersSelected = allUsersSelected;
        vm.isUserSelected = isUserSelected;
        vm.addWorkflow = addWorkflow;
       
        vm.deleteWorkflow = deleteWorkflow;

        vm.applyWorkFlow = applyWorkFlow ;
        
        vm.viewWorkflow=viewWorkflow; 
        vm.applyMattWorkflow = false;
        vm.viewMattWorkflow =false;
        vm.viewapplyworkflow = false;
        vm.firmData = { API: "PHP", state: "mailbox" };
        vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));
      //  $rootScope.viewWorkflowflag  = false;

        vm.matterId = $stateParams.matterId;

        //get email signature
        function getUserEmailSignature() {
            mailboxDataService.emailSignature()
                .then(function (data) {
                    if (utils.isNotEmptyVal(data.data)) {
                        vm.signature = data.data[0];
                        vm.signature = '<br/><br/>' + vm.signature;
                    }
                });
        }

        $scope.$on('composeEmailFromContact', function (event, data) {
            if (!(window.isDrawerOpen)) {
                vm.compose = true;
                var html = "";
                html += (vm.signature == undefined) ? '' : vm.signature;
                vm.composeEmail = html;
                $rootScope.updateComposeMailMsgBody(vm.composeEmail, '', '', '', 'contactEmail', data);
            }
        });

        // Get event call from mailbox controller for close compose popup
        $rootScope.$on("callCloseComposeMail", function () {
            closeComposeMail(); // close compose mail popup
        });

        // close compose mail popup
        function closeComposeMail() {
            
            vm.compose = false;
        }

        localStorage.removeItem("applyWorkflowInfo");
        localStorage.removeItem("selectedApplyTaskData");
        localStorage.removeItem("selectedApplyEventData");
        
        $scope.$on("matterWorkFlowViewChanged",function(){
            vm.applyWorkflow = false;
            vm.viewMattWorkflow = false;
            vm.viewapplyworkflow = false;
            matterFactory.setBreadcrumWithPromise(vm.matterId, 'Workflow').then(function (resultData) {
                vm.matterInfo = resultData;
            });
             vm.userGrid = {
                headers: mattWorkFlowHelper.getWorkflowGrid(),
                selectedItems: []
            };
            vm.dataReceived = false;
            getWorkflowList();
        });
       
        (function () {
            vm.userGrid = {
                headers: mattWorkFlowHelper.getWorkflowGrid(),
                selectedItems: []
            };
            vm.dataReceived = false;
            getWorkflowList();
            matterFactory.setBreadcrumWithPromise(vm.matterId, 'Workflow').then(function (resultData) {
                vm.matterInfo = resultData;
            });
            getUserEmailSignature();
            vm.matterInfo = matterFactory.getMatterData(vm.matterId);
            
        })();

        vm.openContactCard = function (contact) {
            contactFactory.displayContactCard1(contact.contactid, contact.edited,contact.contact_type);
            contact.edited = false;
        };
        
        var permissions = masterData.getPermissions();
        vm.eventsPermissions = _.filter(permissions[0].permissions, function (per) {
            if (per.entity_id == '3') {
                return per;
            }
        });

        vm.criticalDatesPermission = _.filter(permissions[0].permissions, function (user) {
            if (user.entity_id == '2') {
                return user;
            }
        });

         function applyWorkFlow() {
            vm.applyWorkflow = true;
            vm.viewapplyworkflow = true;
         } 

       
        function getWorkflowList() {
            workFlowDataService.getWorkflowList(vm.matterId)
            .then(function (response) {
                 _.forEach(response.data, function (item) {
                        item.applied_on = (utils.isEmptyVal(item.applied_on)) ? "" : moment.unix(item.applied_on).utc().format('MM/DD/YYYY');
                    }); 
                var data = response.data;
                vm.workflowList = data;
                vm.dataReceived = true;
            });
        }

        function selectAllUsers(isSelected) {
            if (isSelected === true) {
                vm.userGrid.selectedItems = angular.copy(vm.workflowList);
            } else {
                vm.userGrid.selectedItems = [];
            }
        }

        function allUsersSelected() {
            if (utils.isEmptyVal(vm.workflowList)) {
                return false;
            }
            return vm.userGrid.selectedItems.length === vm.workflowList.length;
        }

       
        function isUserSelected(uid) {
            var uids = _.pluck(vm.userGrid.selectedItems, 'workflow_id');
            return uids.indexOf(uid) > -1;
        }

        function addWorkflow() {
            var modalInstance = $modal.open({
                templateUrl: 'app/settings/workflows/add-workflow/add-workflow.html',
                controller: 'addWorkflowCtrl as addWorkflow',
                windowClass: 'modalLargeDialog',
                resolve: {
                    'workflowData': function () {
                        return {};
                    }
                     
                }
            });

            modalInstance.result.then(function () {
                vm.userGrid.selectedItems.length = 0;
                vm.dataReceived = false;
                getWorkflowList();
            });
        }

       
         function viewWorkflow(workflowdata) {
             vm.viewMattWorkflow =true; 
           mattWorkFlowHelper.setworkflowData(workflowdata);
             // $rootScope.viewWorkflowflag =true;             
        }

       
         function deleteWorkflow(workflow) {
           var selectedWorkflow =angular.copy(workflow);
            //confirm before delete
              var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Delete',
                    headerText: 'Delete ?',
                    bodyText: 'Are you sure you want to delete ?'
                };
            modalService.showModal({}, modalOptions).then(function () {
                    var workflowIds = _.pluck(selectedWorkflow, 'workflow_id');
                    var promesa = workFlowDataService.deleteWorkflow(workflowIds,vm.matterId);
                    promesa.then(function (data) {
                        notificationService.success('Workflow deleted successfully');
                        vm.userGrid.selectedItems.length = 0;
                        //vm.dataReceived = false;
                        getWorkflowList();
                    }, function (error) {
                        notificationService.error("You do not have permission to delete task/event");
                    });
                });
               
            }

    }

})(angular);


(function (angular) {

    angular.module('cloudlex.workflow')
    .factory('mattWorkFlowHelper', mattWorkFlowHelper);
    
     mattWorkFlowHelper.$inject = ['routeManager','matterFactory'];
    
    function mattWorkFlowHelper(routeManager,matterFactory) {

        var selectedWorkflowData= {};
        
        return {
            getWorkflowGrid: _getWorkflowGrid,
            setworkflowData :_setworkflowData,
            getworkflowData : _getworkflowData,
            setWorkflowBreadCrum: _setWorkflowBreadCrum
        };
        
        function _getworkflowData(){
           return selectedWorkflowData;
        }

        function _setworkflowData(workflowdata){
            selectedWorkflowData =workflowdata;
            //return workflowdata;
        }

        function _getWorkflowGrid() {
            return [
                {
                    field: [
                        {
                            prop: 'workflow_name',
                              html: '<span ng-click="workflow.viewWorkflow(data)" tooltip-append-to-body="true" tooltip={{data.workflow_name}}>{{data.workflow_name}}</span>',
                          //  onClick: "workflow.viewWorkflow(data)",
                         
                            cursor:true
                        }
                    ],
                    displayName: 'Workflow Name',
                    dataWidth:"25"
                },
           
             {
                 field: [
                     {
                         prop: 'description',
                        // printDisplay: 'Workflow Description'
                         html: '<span tooltip-append-to-body="true" style="text-align: left;"  tooltip-placement="left" tooltip={{data.description}}>{{data.description}}</span>',
                     }
                 ],
                 displayName: 'Workflow Description',
                   dataWidth:"25"
             },
              {
                 field: [
                     {
                         prop: 'applied_on',
                        
                     }
                 ],
                 displayName: 'Applied On',
                   dataWidth:"20"
             },
              {
                 field: [
                     {
                         prop: 'applied_by',
                        
                     }
                 ],
                 displayName: 'Applied By',
                   dataWidth:"25"
             }
             
           
            ];
        }
        
        function _setWorkflowBreadCrum(matterId){
            matterFactory.setBreadcrum(matterId, 'Workflow');
        }
  
    }

})(angular);