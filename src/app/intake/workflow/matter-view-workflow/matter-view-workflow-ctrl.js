(function (angular) {

    'user strict';

    angular.module('intake.workflow')
        .controller('viewintkWorkflowCtrl', viewMattWorkflowCtrl);

    viewMattWorkflowCtrl.$inject = ['intkworkflowOverviewDatalayer',
        '$state', 'routeManager', 'intkWorkFlowHelper', '$stateParams', 'intakeFactory', 'IntakeTasksHelper', 'intakeEventsHelper'];
    function viewMattWorkflowCtrl(intkworkflowOverviewDatalayer,
        $state, routeManager, intkWorkFlowHelper, $stateParams, intakeFactory, IntakeTasksHelper, intakeEventsHelper) {

        var vm = this;
        vm.viewWorkflowOverview = false;
        vm.matterId = $stateParams.intakeId;
        vm.gotoTask = gotoTask;
        vm.goToEvent = goToEvent;
        vm.cursor = true;

        (function () {

            vm.dataReceived = false;
            vm.selctedWorkflowData = intkWorkFlowHelper.getworkflowData();
            getWorkflowOverview();
            setBreadcrum(vm.matterId);

        })();

        function setBreadcrum(matterId) {
            var initCrum = [{ name: '...' }];
            routeManager.setBreadcrum(initCrum);
            var matterinfo = intakeFactory.getMatterData();

            if (utils.isEmptyObj(matterinfo) || (parseInt(matterinfo.intakeId) !== parseInt(matterId))) {
                intakeFactory.fetchMatterData(matterId).then(function (response) {
                    var matterData = response;
                    addToBreadcrumList(matterData, matterId);
                });
            } else {
                addToBreadcrumList(matterinfo, matterId);
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
                },
                { name: vm.selctedWorkflowData.workflow_name }];
            routeManager.addToBreadcrum(breadcrum);
        }

        function gotoTask(selectedTask) {
            if (selectedTask.intakeName == null && selectedTask.intake_id == '0') {
                return;
            }
            selectedTask.intake_task_id = selectedTask.workflow_task_id;
            IntakeTasksHelper.setSavedTask(selectedTask);
            $state.go('intaketasks', { intakeId: selectedTask.intake_id });
        }

        function goToEvent(data) {
            if (data.intakeId == null) {
                return;
            }
            data.eventId = data.workflow_event_id;
            data.id = data.workflow_event_id;
            data.intake_event_id = data.workflow_event_id;
            intakeEventsHelper.setSelectedEvent(data);
            $state.go('intakeevents', { intakeId: data.intakeId });
        }


        function getWorkflowOverview() {
            var workflowID = vm.selctedWorkflowData.workflow_id;
            intkworkflowOverviewDatalayer.getWorkflowOverview(workflowID, vm.matterId)
                .then(function (response) {
                    // var data = response.data;
                    vm.info = response.data;

                    // vm.clickedWorkflow = JSON.parse(data.workflow_date);
                    _.forEach(response.data.workflow_event, function (event) {
                        event.start = (utils.isEmptyVal(event.start_date)) ? "" : moment.unix(event.start_date).utc().format('MM/DD/YYYY');
                        event.end = (utils.isEmptyVal(event.end_date)) ? "" : moment.unix(event.end_date).utc().format('MM/DD/YYYY');
                        event.intakeId = vm.info.intake.intake_id;
                        event.intakeName = vm.info.intake.intake_name;
                    });
                    vm.evntsList = response.data.workflow_event;

                    _.forEach(response.data.workflow_task, function (task) {
                        task.dueutcdate = task.due_date;
                        if (task.due_date != 0) {
                            task.duedate = (utils.isEmptyVal(task.due_date)) ? "" : moment.unix(task.due_date).utc().format('MM/DD/YYYY');
                        }
                        else {
                            task.duedate = "-";
                        }
                        task.intake_id = vm.info.intake.intake_id;
                        task.intakeName = vm.info.intake.intake_name;
                    });
                    vm.userList = response.data.workflow_task;
                    vm.dataReceived = true;
                });
        }




    }

})(angular);

(function (angular) {

    angular.module('intake.workflow')
        .factory('intkworkflowOverviewDatalayer', intkworkflowOverviewDatalayer);


    intkworkflowOverviewDatalayer.$inject = ['$http', 'globalConstants'];
    function intkworkflowOverviewDatalayer($http, globalConstants) {

        var urls = {
            workflowList: globalConstants.intakeServiceBaseV2 + 'workflow/workflow_overview/',

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

        function _getWorkflowOverview(workflowID, matterId) {
            var data = { 'workflowId': workflowID.toString() };
            var url = urls.workflowList + matterId + '?' + getParams(data);;
            return $http.get(url);
        }



    }


})(angular);

