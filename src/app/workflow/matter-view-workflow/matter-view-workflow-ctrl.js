(function (angular) {

    'user strict';

    angular.module('cloudlex.workflow')
        .controller('viewMattWorkflowCtrl', viewMattWorkflowCtrl);

    viewMattWorkflowCtrl.$inject = ['$modal', 'workflowOverviewDatalayer',
        'modalService', 'notification-service','$state' ,'routeManager', 'masterData', 'mattWorkFlowHelper','$stateParams','matterFactory','tasksHelper','eventsHelper'];
    function viewMattWorkflowCtrl($modal, workflowOverviewDatalayer,
        modalService, notificationService,$state, routeManager, masterData, mattWorkFlowHelper,$stateParams,matterFactory,tasksHelper,eventsHelper) {

        var vm = this;
        vm.viewWorkflowOverview =false;
        vm.matterId = $stateParams.matterId;
        vm.gotoTask = gotoTask;
        vm.goToEvent = goToEvent;
        vm.cursor= true;

        (function () {
           
            vm.dataReceived = false;
            vm.selctedWorkflowData = mattWorkFlowHelper.getworkflowData();
            getWorkflowOverview();
            setBreadcrum(vm.matterId);

        })();

        function setBreadcrum(matterId) {
            var initCrum = [{ name: '...' }];
            routeManager.setBreadcrum(initCrum);

            var matterinfo = matterFactory.getMatterData();

            if (utils.isEmptyObj(matterinfo) || (parseInt(matterinfo.matter_id) !== parseInt(matterId))) {
                matterFactory.getMatterInfo(matterId).then(function (response) {
                    var matterData = response.data[0];
                    matterFactory.setMatterData(matterData);
                    addToBreadcrumList(matterData, matterId);
                });
            } else {
                addToBreadcrumList(matterinfo, matterId);
            }
        }

        function addToBreadcrumList(matteData, matterId) {
            var breadcrum = [
                {
                    name: matteData.matter_name, state: 'add-overview',
                    param: { matterId: matterId }
                },
                {
                    name: 'Workflow', state: 'workflow',
                    param: { matterId: matterId }
                },
                { name: vm.selctedWorkflowData.name }];
            routeManager.addToBreadcrum(breadcrum);
        }

        function gotoTask(selectedTask) {
            selectedTask.task_id = selectedTask.task_id;
            tasksHelper.setSavedTask(selectedTask);
            $state.go('tasks', { matterId: vm.matterId},  {
                reload: true
            });
        }

         function goToEvent(data) {
            data.event_id = data.event_id;
            eventsHelper.setSelectedEvent(data);
            $state.go('events', { matterId: vm.matterId });
        }


        function getWorkflowOverview() {
            var workflowID = vm.selctedWorkflowData.workflow_id;
            workflowOverviewDatalayer.getWorkflowOverview(workflowID,vm.matterId)
                .then(function (response) {
                   // var data = response.data;
                    vm.info = response.data;
                    
                   // vm.clickedWorkflow = JSON.parse(data.workflow_date);
                    _.forEach( response.data.workflow_event, function (event) {
                        event.start = (utils.isEmptyVal(event.start)) ? "" : moment.unix(event.start).utc().format('MM/DD/YYYY');
                        event.end = (utils.isEmptyVal(event.end)) ? "" : moment.unix(event.end).utc().format('MM/DD/YYYY');
                    }); 
                    vm.evntsList =  response.data.workflow_event;

                     _.forEach( response.data.workflow_task, function (task) {
                        task.dueutcdate =  task.duedate;
                        task.duedate = (utils.isEmptyVal(task.due_date)) ? "" : moment.unix(task.due_date).utc().format('MM/DD/YYYY');
                        
                    }); 
                    vm.userList = response.data.workflow_task;
                    vm.dataReceived = true;
                });
        }


      

    }

})(angular);

(function (angular) {

    angular.module('cloudlex.workflow')
        .factory('workflowOverviewDatalayer', workflowOverviewDatalayer);


    workflowOverviewDatalayer.$inject = ['$http', 'globalConstants'];
    function workflowOverviewDatalayer($http, globalConstants) {

        var urls = {
            workflowList: globalConstants.javaWebServiceBaseV4 + 'workflow_apply/workflow_overview/',
            
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
            getWorkflowOverview: _getWorkflowOverview,
           
        };

        function _getWorkflowOverview(workflowID,matterId) {
             var data = { 'workflowId': workflowID.toString() };
            var url = urls.workflowList + matterId + '?' + getParams(data);;
            return $http.get(url);
        }

      

    }


})(angular);

