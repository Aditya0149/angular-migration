(function (angular) {

    'user strict';

    angular.module('intake.workflow')
        .controller('WorkflowintakeCtrl', WorkflowintakeCtrl);

    WorkflowintakeCtrl.$inject = ['$modal', 'intakeworkFlowDataService', 'intkWorkFlowHelper',
        'modalService', 'notification-service', 'routeManager', '$rootScope', '$stateParams', 'intakeFactory', '$scope', 'contactFactory', 'mailboxDataService', 'masterData'];
    function WorkflowintakeCtrl($modal, intakeworkFlowDataService, intkWorkFlowHelper,
        modalService, notificationService, routeManager, $rootScope, $stateParams, intakeFactory, $scope, contactFactory, mailboxDataService, masterData) {

        var vm = this;

        vm.selectAllUsers = selectAllUsers;
        vm.allUsersSelected = allUsersSelected;
        vm.isUserSelected = isUserSelected;
        vm.addWorkflow = addWorkflow;

        vm.deleteWorkflow = deleteWorkflow;

        vm.applyWorkFlow = applyWorkFlow;

        vm.viewWorkflow = viewWorkflow;
        vm.applyMattWorkflow = false;
        vm.viewMattWorkflow = false;
        vm.viewapplyworkflow = false;
        vm.firmData = { API: "PHP", state: "mailbox" };
        //vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));
        //  $rootScope.viewWorkflowflag  = false;

        vm.matterId = $stateParams.intakeId;

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

        localStorage.removeItem("applyintakeWorkflowInfo");
        localStorage.removeItem("intakeselectedApplyTaskData");
        localStorage.removeItem("intakeselectedApplyEventData");

        $scope.$on("intakeWorkFlowViewChanged", function () {
            vm.applyWorkflow = false;
            vm.viewMattWorkflow = false;
            vm.viewapplyworkflow = false;
            setBreadcrum();
            vm.userGrid = {
                headers: intkWorkFlowHelper.getWorkflowGrid(),
                selectedItems: []
            };
            vm.dataReceived = false;
            getWorkflowList();
        });

        // function setBreadcrum() {
        //     if (vm.matterId === 0) {
        //         routeManager.setBreadcrum([{ name: '...' }]);
        //         routeManager.addToBreadcrum([{ name: 'Workflow' }]);
        //         return;
        //     }

        //     intakeFactory.setBreadcrum(vm.matterId, 'Workflow');
        // }

        function setBreadcrum() {
            var initCrum = [{ name: '...' }];
            routeManager.setBreadcrum(initCrum);
            var matterinfo = intakeFactory.getMatterData();

            if (utils.isEmptyObj(matterinfo) || (parseInt(matterinfo.intakeId) !== parseInt(vm.matterId))) {
                intakeFactory.fetchMatterData(vm.matterId).then(function (response) {
                    var matterData = response;
                    addToBreadcrumList(matterData, vm.matterId);
                });
            } else {
                addToBreadcrumList(matterinfo, vm.matterId);
            }
        }

        function addToBreadcrumList(matteData, matterId) {
            var breadcrum = [
                {
                    name: matteData.intakeName, state: 'intake-overview',
                    param: { intakeId: matterId }
                },
                {
                    name: 'Workflow', state: 'intakeworkflow',
                    param: { intakeId: matterId }
                }];
            routeManager.addToBreadcrum(breadcrum);
        }
        (function () {
            vm.userGrid = {
                headers: intkWorkFlowHelper.getWorkflowGrid(),
                selectedItems: []
            };
            vm.dataReceived = false;
            getWorkflowList();
            setBreadcrum();
            getUserEmailSignature();
            vm.matterInfo = intakeFactory.getMatterData(vm.matterId);

        })();

        vm.openContactCard = function (contact) {
            contactFactory.displayContactCard1(contact.contactid, contact.edited, contact.contact_type);
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
            intakeworkFlowDataService.getWorkflowList(vm.matterId)
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
                templateUrl: 'app/settings/intake-workflows/add-workflow/add-workflow.html',
                controller: 'addintakeWorkflowCtrl as addWorkflow',
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
            vm.viewMattWorkflow = true;
            intkWorkFlowHelper.setworkflowData(workflowdata);
            // $rootScope.viewWorkflowflag =true;             
        }


        function deleteWorkflow(workflow) {
            var selectedWorkflow = angular.copy(workflow);
            //confirm before delete
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };
            modalService.showModal({}, modalOptions).then(function () {
                var workflowIds = _.pluck(selectedWorkflow, 'workflow_id');
                var promesa = intakeworkFlowDataService.deleteWorkflow(workflowIds, vm.matterId);
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

    angular.module('intake.workflow')
        .factory('intkWorkFlowHelper', intkWorkFlowHelper);

    intkWorkFlowHelper.$inject = [];

    function intkWorkFlowHelper() {

        var selectedWorkflowData = {};

        return {
            getWorkflowGrid: _getWorkflowGrid,
            setworkflowData: _setworkflowData,
            getworkflowData: _getworkflowData,
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
                            prop: 'workflow_name',
                            html: '<span ng-click="workflow.viewWorkflow(data)" tooltip-append-to-body="true" tooltip={{data.workflow_name}}>{{data.workflow_name}}</span>',
                            //  onClick: "workflow.viewWorkflow(data)",

                            cursor: true
                        }
                    ],
                    displayName: 'Workflow Name',
                    dataWidth: "25"
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
                    dataWidth: "25"
                },
                {
                    field: [
                        {
                            prop: 'applied_on',

                        }
                    ],
                    displayName: 'Applied On',
                    dataWidth: "20"
                },
                {
                    field: [
                        {
                            prop: 'applied_by',

                        }
                    ],
                    displayName: 'Applied By',
                    dataWidth: "25"
                }


            ];
        }



    }

})(angular);