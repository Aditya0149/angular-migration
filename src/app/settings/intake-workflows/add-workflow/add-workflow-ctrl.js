(function (angular) {
    'use strict';

    angular.module('intake.workflow')
        .controller('addintakeWorkflowCtrl', addintakeWorkflowCtrl);

    addintakeWorkflowCtrl.$inject = ['intakeaddWorkflowDatalayer', 'notification-service', 'intakeworkFlowTemplateDataService'];
    function addintakeWorkflowCtrl(intakeaddWorkflowDatalayer, notificationService, intakeworkFlowTemplateDataService) {

        var vm = this;
        vm.save = save;
        vm.cancel = cancel;
        vm.isDisableDates = false;
        vm.calDates = true;
        vm.checkDates = checkDates;
        vm.workflowInfo = {};
        vm.workflowInfo.customDate1 = 0;
        vm.workflowInfo.customDate2 = 0;
        vm.display = {};
        vm.display.page = 'addworkflow';
        var workflowData = intakeworkFlowTemplateDataService.getSelectedTemplateData();
        var workflowList = intakeworkFlowTemplateDataService.getTemplatelist();
        vm.resetAddWorkflowPage = resetAddWorkflowPage;

        (function () {
            if (angular.isDefined(workflowData)) {
                if (workflowData.cloneWorkflow) {
                    vm.mode = 'Clone'
                } else {
                    vm.mode = utils.isEmptyObj(workflowData) ? 'New' : 'Edit';
                }
            } else {
                vm.mode = utils.isEmptyObj(workflowData) ? 'New' : 'Edit';
            }


            if (vm.mode == 'Edit') {
                vm.isDisableDates = true;
                vm.calDates = false;
                var editData = JSON.parse(workflowData.workflow_dates);
                vm.workflowInfo = workflowData;
                formatData(editData);
            } else if (vm.mode == 'Clone') {
                vm.isDisableDates = false;
                vm.calDates = false;
                var editData = JSON.parse(workflowData.workflow_dates);
                vm.workflowInfo = workflowData;
                formatData(editData);
                dissableDates(vm.workflowInfo);
            }
            //JSON.parse(userData.workflow_date)
            vm.workflowInfo = angular.copy(workflowData);

            // resetCallbackHelper.setCallback(resetAddWorkflowPage);

        })();


        // In case of cloneing dissable dates wich are already selected in selected workflow.
        // call this function only in Clone mode
        function dissableDates(data) {
            vm.clonecustomDate1 = data.customDate1 == 1 ? true : false;
            vm.clonecustomDate2 = data.customDate2 == 1 ? true : false;
            vm.cloneSOL = data.SOL == 1 ? true : false;
            vm.cloneMCD = data.MCD == 1 ? true : false;
            vm.cloneDOI = data.DOI == 1 ? true : false;
            vm.cloneDOIn = data.DOIn == 1 ? true : false;
        }


        function resetAddWorkflowPage() {
            if (vm.mode == 'New') {
                vm.workflowInfo = workflowData;
            } else if (vm.mode == 'Edit') {
                vm.isDisableDates = true;
                vm.calDates = false;
                var editData = JSON.parse(workflowData.workflow_dates);
                vm.workflowInfo = angular.copy(workflowData);
                formatData(editData);
            }
        }




        function formatData(editData) {
            //label
            _.forEach(editData.custom, function (event) {
                if (event.id == '1') {
                    vm.workflowInfo.customDate1Label = utils.isNotEmptyVal(event.label) ? event.label : '';
                    vm.workflowInfo.customDate1 = event.id == '1' ? "1" : 0;
                } else if (event.id == '2') {
                    vm.workflowInfo.customDate2Label = utils.isNotEmptyVal(event.label) ? event.label : '';
                    vm.workflowInfo.customDate2 = event.id == '2' ? "1" : 0;
                }

            });

            vm.workflowInfo.SOL = angular.isDefined(editData.intake_event[0]) ? utils.isNotEmptyVal(editData.intake_event[0].code) ? "1" : 0 : 0;

            _.forEach(editData.intake_specific_dates, function (event) {
                if (event.code == 'MCD') {
                    vm.workflowInfo.MCD = event.code == 'MCD' ? "1" : 0;
                } else if (event.code == 'DOI') {
                    vm.workflowInfo.DOI = event.code == 'DOI' ? "1" : 0;
                } else if (event.code == 'DOIn') {
                    vm.workflowInfo.DOIn = event.code == 'DOIn' ? "1" : 0;
                }

            });


        }

        function checkDates(workflowInfo) {
            if (workflowInfo.customDate1 == 1 || workflowInfo.customDate2 == 1 || workflowInfo.SOL == 1 || workflowInfo.DOI == 1
                || workflowInfo.DOIn == 1 || workflowInfo.MCD == 1) {
                vm.calDates = false;
            } else {
                vm.calDates = true;
            }

        }
        
        function checkworkflowname(workflowData) {
            var workflowname = {};
            workflowname = _.filter(workflowList, function (work) {
                if (work.workflow_name == workflowData.workflow_name) {
                    return true;
                }
            });
            return workflowname;
        }

        function save(workflowData) {
            if (checkworkflowname(workflowData).length > 0) {
                notificationService.error("Workflow with the same name already exists");
                return;
            }
            if (workflowData.customDate1 == 1 || workflowData.customDate2 == 1) {
                if (workflowData.customDate1 == 1 && utils.isEmptyVal(workflowData.customDate1Label)) {
                    notificationService.error("custom date label required ");
                    return;
                } else if (workflowData.customDate2 == 1 && utils.isEmptyVal(workflowData.customDate2Label)) {
                    notificationService.error("custom date label required ");
                    return;
                }
            }

            if ((angular.isUndefined(workflowData.customDate1) || workflowData.customDate1 == 0) && utils.isNotEmptyVal(workflowData.customDate1Label)) {
                notificationService.error("custom date required");
                return;
            } else if ((angular.isUndefined(workflowData.customDate2) || workflowData.customDate2 == 0) && utils.isNotEmptyVal(workflowData.customDate2Label)) {
                notificationService.error("custom date required");
                return;


            }


            var postJson = JSON.stringify(jsonData(workflowData));
            var postDataObj = getPostData(workflowData, postJson);

            if (vm.mode === 'Clone') {
                var promise = intakeaddWorkflowDatalayer.cloneWorkflow(postDataObj);
            } else {
                var promise = vm.mode === 'Edit' ? intakeaddWorkflowDatalayer.editWorkflow(postDataObj, vm.workflowInfo.workflow_id) : intakeaddWorkflowDatalayer.addWorkflow(postDataObj);
            }
            promise.then(function (response) {
                if (response.data.length === '0') {
                    notificationService.error('Unable to edit workflow ');
                    return;
                } else {
                    if (vm.mode === 'Clone') {
                        notificationService.success("Workflow Cloned successfully");
                        vm.display.page = 'closeAddWorkflow';
                    } else {
                        var msg = 'Workflow ' + (vm.mode === 'Edit' ? 'edited ' : 'added ') + 'successfully';
                        notificationService.success(msg);
                        vm.display.page = 'closeAddWorkflow';
                    }
                    // $modalInstance.close();
                }
            });
        }


        function getPostData(workflowData, postJson) {
            var postObj = {};
            vm.mode === 'Clone' ? postObj.old_workflow_id = workflowData.workflow_id : angular.noop();
            postObj.workflow_name = workflowData.workflow_name;
            postObj.description = (workflowData.description) ? workflowData.description : "";
            postObj.workflow_dates = postJson;
            return postObj;
        }

        function jsonData(workflowData) {
            workflowData.matterSpecificDates = [];
            workflowData.intake_event = [];
            workflowData.custom = [];
            if (workflowData.MCD == 1) {
                var msd = {};
                msd.code = 'MCD'
                msd.id = '1';
                workflowData.matterSpecificDates.push(msd);
            }
            if (workflowData.DOI == 1) {
                var msd = {};
                msd.code = 'DOI'
                msd.id = '2';
                workflowData.matterSpecificDates.push(msd);
            }
            if (workflowData.DOIn == 1) {
                var msd = {};
                msd.code = 'DOIn'
                msd.id = '3';
                workflowData.matterSpecificDates.push(msd);
            }
            if (workflowData.SOL == 1) {
                var msd = {};
                msd.code = 'SOL'
                msd.id = '1';
                workflowData.intake_event.push(msd);
            }
            if (workflowData.customDate1 == 1) {
                var msd = {};
                msd.label = workflowData.customDate1Label;
                msd.id = '1';
                workflowData.custom.push(msd);
            }
            if (workflowData.customDate2 == 1) {
                var msd = {};
                msd.label = workflowData.customDate2Label;
                msd.id = '2';
                workflowData.custom.push(msd);
            }

            var postObj = {};
            // postObj.intake_specific_dates={};
            postObj.intake_specific_dates = workflowData.matterSpecificDates;
            postObj.intake_event = workflowData.intake_event;
            postObj.custom = workflowData.custom;
            var obj = angular.extend({}, postObj);

            return obj;
        }

        function cancel() {
            vm.display.page = 'closeAddWorkflow';
        }

    }

})(angular);

(function (angular) {

    'use strict';

    angular.module('intake.workflow')
        .factory('intakeaddWorkflowDatalayer', intakeaddWorkflowDatalayer);

    intakeaddWorkflowDatalayer.$inject = ['$http', 'globalConstants'];
    function intakeaddWorkflowDatalayer($http, globalConstants) {

        var urls = {
            editWorkflow: globalConstants.intakeServiceBaseV2 + 'workflow_template/',
            addWorkflow: globalConstants.intakeServiceBaseV2 + 'workflow_template',
            cloneWorkflow: globalConstants.intakeServiceBaseV2 + 'workflow_template/clone',
        };

        return {
            editWorkflow: _editWorkflow,
            addWorkflow: _addWorkflow,
            cloneWorkflow: _cloneWorkflow
        };


        function _editWorkflow(workflowData, workflowId) {
            var url = urls.editWorkflow + workflowId;
            return $http.put(url, workflowData);
        }

        function _addWorkflow(workflowData) {
            var url = urls.addWorkflow;
            return $http.post(url, workflowData);
        }

        function _cloneWorkflow(workflowData) {
            var url = urls.cloneWorkflow;
            return $http.post(url, workflowData);
        }

    }

})(angular);
