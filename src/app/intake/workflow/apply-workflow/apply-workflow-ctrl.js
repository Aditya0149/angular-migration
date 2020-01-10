(function (angular) {

    'use strict';
    angular.module('intake.workflow').
        controller('applyintakeWorkflowCtrl', applyWorkflowCtrl);
    applyWorkflowCtrl.$inject = ['applyintakeWorkflowDatalayer', 'intkWorkFlowHelper', '$stateParams'];


    function applyWorkflowCtrl(applyintakeWorkflowDatalayer, intkWorkFlowHelper, $stateParams) {

        var vm = this;
        vm.viewWorkflowOverview = false;
        vm.matterId = $stateParams.intakeId;

        vm.openCalenderdoi = openCalenderdoi;
        vm.openCalenderdoin = openCalenderdoin;
        vm.openCalendercust1 = openCalendercust1;
        vm.openCalendercust2 = openCalendercust2;

        vm.getFormattedDate = getFormattedDate;
        vm.getMattDetails = getMattDetails;
        vm.cancel = cancel;

        // var matters = [];
        // var masterData = masterData.getMasterData();

        vm.goNext = goNext;
        vm.goToTask = false;
        vm.workflowSlected = true;
        vm.showSolDatePick = false;
        vm.dissableDoin = false;
        vm.dissableDoi = false;
        vm.dissableSol = false;
        vm.viewapplyworkflow = true;
        vm.fromBackButton = false;




        (function () {
            vm.selctedWorkflowData = intkWorkFlowHelper.getworkflowData();
            var applyWorkInfoData = localStorage.getItem("applyintakeWorkflowInfo");
            if (utils.isNotEmptyVal(applyWorkInfoData)) {
                vm.applyWorkInfo = JSON.parse(applyWorkInfoData);
                vm.fromBackButton = true;
                vm.listOfSol = vm.applyWorkInfo.listOfSol;
                vm.listWorkflow = vm.applyWorkInfo.listWorkflow;
                getMattDetails(vm.applyWorkInfo.selWorkflow, vm.fromBackButton);



                vm.applyWorkInfo.customDate1 = (utils.isEmptyVal(vm.applyWorkInfo.customDate1)) ? "" : utils.getUTCTimeStamp(vm.applyWorkInfo.customDate1);
                vm.applyWorkInfo.customDate1 = (utils.isEmptyVal(vm.applyWorkInfo.customDate1)) ? "" : moment.unix(vm.applyWorkInfo.customDate1).utc().format('MM/DD/YYYY');
                vm.applyWorkInfo.customDate2 = (utils.isEmptyVal(vm.applyWorkInfo.customDate2)) ? "" : utils.getUTCTimeStamp(vm.applyWorkInfo.customDate2);
                vm.applyWorkInfo.customDate2 = (utils.isEmptyVal(vm.applyWorkInfo.customDate2)) ? "" : moment.unix(vm.applyWorkInfo.customDate2).utc().format('MM/DD/YYYY');

                vm.applyWorkInfo.intake.dateOfIncident = (utils.isEmptyVal(vm.applyWorkInfo.intake.dateOfIncident)) ? "" : utils.getUTCTimeStamp(vm.applyWorkInfo.intake.dateOfIncident);
                vm.applyWorkInfo.intake.dateOfIncident = (utils.isEmptyVal(vm.applyWorkInfo.intake.dateOfIncident)) ? "" : moment.unix(vm.applyWorkInfo.intake.dateOfIncident).utc().format('MM/DD/YYYY');

                vm.applyWorkInfo.intake.date_of_intake = (utils.isEmptyVal(vm.applyWorkInfo.intake.date_of_intake)) ? "" : utils.getUTCTimeStamp(vm.applyWorkInfo.intake.date_of_intake);
                vm.applyWorkInfo.intake.date_of_intake = (utils.isEmptyVal(vm.applyWorkInfo.intake.date_of_intake)) ? "" : moment.unix(vm.applyWorkInfo.intake.date_of_intake).utc().format('MM/DD/YYYY');

                if (angular.isUndefined(vm.applyWorkInfo.sol.start)) {
                    vm.applyWorkInfo.sol = (utils.isEmptyVal(vm.applyWorkInfo.sol)) ? "" : utils.getUTCTimeStamp(vm.applyWorkInfo.sol);
                    vm.applyWorkInfo.sol = (utils.isEmptyVal(vm.applyWorkInfo.sol)) ? "" : moment.unix(vm.applyWorkInfo.sol).utc().format('MM/DD/YYYY');
                }
                getVerifyWorkflowData();


            } else {

                init();
            }
            //setBreadcrum();

        })();

        function init() {
            getWorkflowList();
        }


        function getVerifyWorkflowData(workFlowInfo) {
            applyintakeWorkflowDatalayer.getWorkflowList(vm.matterId)
                .then(function (response) {

                    response.data.Sol = (utils.isEmptyVal(response.data.sol)) ? "" : moment.unix(response.data.sol[0]).utc().format('MM/DD/YYYY');
                    if (utils.isNotEmptyVal(response.data.intake.dateOfIncident) && response.data.intake.dateOfIncident != 0) {
                        vm.dissableDoi = true;
                    }
                    if (utils.isNotEmptyVal(response.data.intake.date_of_intake) && response.data.intake.date_of_intake != 0) {
                        vm.dissableDoin = true;
                    }

                    if (response.data.sol.length <= 1) {
                        vm.showSolDatePick = true;
                        // vm.applyWorkInfo.sol = (utils.isEmptyVal(response.data.sol[0].start)) ? "" : moment.unix(response.data.sol[0].start).utc().format('MM/DD/YYYY');
                        //vm.applyWorkInfo.sol =utils.isNotEmptyVal(response.data.sol) ? (utils.isEmptyVal(response.data.sol[0].start)) ? "" : moment.unix(response.data.sol[0].start).utc().format('MM/DD/YYYY') :'';
                    } else {
                        response.data.solCopy = angular.copy(response.data.sol);
                        response.data.sol = [];
                        _.forEach(response.data.solCopy, function (sol) {
                            var solObj = {};
                            solObj.start = (utils.isEmptyVal(sol)) ? "" : moment.unix(sol).utc().format('MM/DD/YYYY');
                            response.data.sol.push(solObj);
                        });

                    }

                    if (utils.isNotEmptyVal(response.data.Sol)) {
                        vm.dissableSol = true;
                    }
                });
        }

        function resetWorkflowData(workFlowInfo) {
            applyintakeWorkflowDatalayer.getWorkflowList(vm.matterId)
                .then(function (response) {

                    response.data.sol = (utils.isEmptyVal(response.data.sol)) ? "" : moment.unix(response.data.sol[0]).utc().format('MM/DD/YYYY');
                    if (utils.isEmptyVal(response.data.intake.dateOfIncident) || response.data.intake.dateOfIncident == 0) {
                        vm.applyWorkInfo.intake.dateOfIncident = '';
                    }
                    if (utils.isEmptyVal(response.data.intake.date_of_intake) || response.data.intake.date_of_intake == 0) {
                        vm.applyWorkInfo.intake.date_of_intake = '';
                    }

                    if (response.data.sol.length < 1) {
                        vm.applyWorkInfo.sol = '';

                    }
                    vm.applyWorkInfo.customDate1 = '';
                    vm.applyWorkInfo.customDate2 = '';
                });
        }





        function getWorkflowList() {
            applyintakeWorkflowDatalayer.getWorkflowList(vm.matterId)
                .then(function (response) {
                    vm.applyWorkInfo = response.data;
                    vm.listWorkflow = response.data.workflow;
                    vm.applyWorkInfo.intake.dateOfIncident = (utils.isEmptyVal(vm.applyWorkInfo.intake.dateOfIncident)) || vm.applyWorkInfo.intake.dateOfIncident == 0 ? "" : moment.unix(vm.applyWorkInfo.intake.dateOfIncident).utc().format('MM/DD/YYYY');
                    // vm.applyWorkInfo.intake.date_of_intake = (utils.isEmptyVal(vm.applyWorkInfo.intake.date_of_intake)) ? "" : moment.unix(vm.applyWorkInfo.intake.date_of_intake).utc().format('MM/DD/YYYY');
                    vm.applyWorkInfo.intake.date_of_intake = (utils.isEmptyVal(vm.applyWorkInfo.intake.date_of_intake)) || vm.applyWorkInfo.intake.date_of_intake == 0 ? "" : moment.unix(vm.applyWorkInfo.intake.date_of_intake).utc().format('MM/DD/YYYY');
                    vm.applyWorkInfo.intake.intake_created_date = (utils.isEmptyVal(vm.applyWorkInfo.intake.intake_created_date)) ? "" : moment.unix(vm.applyWorkInfo.intake.intake_created_date).utc().format('MM/DD/YYYY');
                    vm.applyWorkInfo.Sol = (utils.isEmptyVal(vm.applyWorkInfo.sol)) ? "" : moment.unix(vm.applyWorkInfo.sol[0]).utc().format('MM/DD/YYYY');

                    if (utils.isNotEmptyVal(vm.applyWorkInfo.intake.dateOfIncident) || vm.applyWorkInfo.intake.dateOfIncident != 0) {
                        vm.dissableDoi = true;
                    }
                    if (utils.isNotEmptyVal(vm.applyWorkInfo.intake.date_of_intake) || vm.applyWorkInfo.intake.date_of_intake != 0) {
                        vm.dissableDoin = true;
                    }
                    if (utils.isNotEmptyVal(vm.applyWorkInfo.Sol)) {
                        vm.dissableSol = true;
                    }
                    if (response.data.sol.length <= 1) {
                        vm.showSolDatePick = true;
                        // vm.applyWorkInfo.sol = (utils.isEmptyVal(response.data.sol[0].start)) ? "" : moment.unix(response.data.sol[0].start).utc().format('MM/DD/YYYY');
                        vm.applyWorkInfo.sol = utils.isNotEmptyVal(response.data.sol) ? (utils.isEmptyVal(response.data.sol[0])) ? "" : moment.unix(response.data.sol[0]).utc().format('MM/DD/YYYY') : '';
                    } else {
                        response.data.solCopy = angular.copy(response.data.sol);
                        response.data.sol = [];
                        _.forEach(response.data.solCopy, function (sol) {
                            var solObj = {};
                            solObj.start = (utils.isEmptyVal(sol)) ? "" : moment.unix(sol).utc().format('MM/DD/YYYY');
                            response.data.sol.push(solObj);
                        });
                        vm.listOfSol = response.data.sol;
                        vm.applyWorkInfo.listOfSol = response.data.sol;

                        vm.applyWorkInfo.sol = vm.listOfSol[0];
                    }
                    vm.applyWorkInfo.listWorkflow = response.data.workflow;
                });
        }



        function getMattDetails(selWorkflow, workFlowInfo, fromBackButton) {

            vm.workflowSlected = false;
            //getWorkflowList();
            vm.clickedWorkflow = JSON.parse(selWorkflow.workflow_dates);
            formatDates(vm.clickedWorkflow);
            // console.log(vm.Info);
            if (!vm.fromBackButton || fromBackButton) {
                resetWorkflowData(workFlowInfo);
            }
        }

        function cancel() {
            vm.viewapplyworkflow = false;
        }

        function formatDates(editData) {
            vm.Info = {};
            if (utils.isNotEmptyVal(editData.custom)) {
                _.forEach(editData.custom, function (task) {
                    if (task.id == '1') {
                        vm.Info.customDate1Label = utils.isNotEmptyVal(task.label) ? task.label : '';
                        vm.Info.customDate1 = 1;
                    }
                    if (task.id == '2') {
                        vm.Info.customDate2Label = utils.isNotEmptyVal(task.label) ? task.label : '';
                        vm.Info.customDate2 = 1;
                    }

                });
            }
            vm.Info.SOL = angular.isDefined(editData.intake_event[0]) ? utils.isNotEmptyVal(editData.intake_event[0].code) ? 1 : 0 : 0;

            _.forEach(editData.intake_specific_dates, function (task) {
                if (task.code == 'MCD') {
                    vm.Info.MCD = 1;
                } else if (task.code == 'DOI') {
                    vm.Info.DOI = 1;
                } else if (task.code == 'DOIn') {
                    vm.Info.DOIn = 1;
                }

            });
        }

        function goNext(applyWorkflowInfo) {
            //Bug#9335
            // if (utils.isNotEmptyVal(applyWorkflowInfo.intake.date_of_intake)) {
            //     var intake.date_of_intake = new Date(applyWorkflowInfo.intake.date_of_intake) ;
            //     var created_date = new Date(applyWorkflowInfo.matter_created_date);
            //     if (created_date < intake.date_of_intake) {
            //         notificationService.error("Intake Date should be less than Created Date");
            //         return;
            //     }
            // }

            localStorage.setItem("applyintakeWorkflowInfo", JSON.stringify(applyWorkflowInfo));
            vm.goToTask = true;
            applyintakeWorkflowDatalayer.setApllyWorkflowData(applyWorkflowInfo);
            // alert('in controller');
        }

        // convert date timestamp to MM/DD/YYYY format...
        function getFormattedDate(epoch) {
            var formdate = new Date(epoch * 1000);
            formdate = moment(formdate).format('MM/DD/YYYY');
            return formdate;
        }

        // $event bind with date incurred datepicker...
        function openCalenderdoi($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            vm.applyWorkInfo[isOpened] = true;

        }
        function openCalenderdoin($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            vm.applyWorkInfo[isOpened] = true;

        }
        function openCalendercust1($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            vm.applyWorkInfo[isOpened] = true;

        }
        function openCalendercust2($event, isOpened) {
            $event.preventDefault();
            $event.stopPropagation();
            vm.applyWorkInfo[isOpened] = true;

        }




    }



})(angular);



(function (angular) {

    angular.module('intake.workflow')
        .factory('applyintakeWorkflowDatalayer', applyintakeWorkflowDatalayer);


    applyintakeWorkflowDatalayer.$inject = ['$http', 'globalConstants'];
    function applyintakeWorkflowDatalayer($http, globalConstants) {

        var selectedWorkflowData = {};

        var urls = {
            workflowList: globalConstants.intakeServiceBaseV2 + 'workflow/workflow_apply',
            TaskEventsList: globalConstants.intakeServiceBaseV2 + 'workflow',

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
            setApllyWorkflowData: _setApllyWorkflowData,
            getApllyWorkflowData: _getApllyWorkflowData,
            getTasksEventsList: _getTasksEventsList,
            groupByUserType: _groupByUserType
        };

        function _getApllyWorkflowData() {
            return selectedWorkflowData;
        }

        function _setApllyWorkflowData(workflowdata) {
            selectedWorkflowData = workflowdata;
            //return workflowdata;
        }

        function _getWorkflowList(matterId) {
            var data = { 'intakeId': matterId.toString() };
            var url = urls.workflowList + '?' + getParams(data);;
            return $http.get(url);
        }

        function _getTasksEventsList(selWorkflowId, matterId) {
            var data = { 'intakeId': matterId, workflowId: selWorkflowId.toString() };
            var url = urls.TaskEventsList + '?' + getParams(data);;
            return $http.get(url);
        }

        function _groupByUserType(user) {
            if (user.isFirmUser) {
                return "Firm User";
            }

            if (!user.isFirmUser) {
                return "Intake Assigned User";
            }

            return "All";
        }



    }


})(angular);

