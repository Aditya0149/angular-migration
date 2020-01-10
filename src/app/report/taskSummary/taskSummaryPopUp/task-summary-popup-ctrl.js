(function (angular) {
    'use strict';

    angular.module('cloudlex.report').controller('TaskSummaryPopUpCtrl',
        ['masterData', '$modalInstance', 'params', 'notification-service', 'tasksHelper', '$scope',
            function (masterData, $modalInstance, params, notificationService, tasksHelper, $scope) {

                var vm = this, role;

                vm.filters = angular.copy(params.filters);
                //vm.filters.selectedmatter = [];
                vm.taskSummaryEvent = {};

                vm.statusList = params.statusList;
                vm.assignedUserList = {};
                vm.assignedUserList.assignedby = angular.copy(params.assignedUserList);
                vm.assignedUserList.assignedto = angular.copy(params.assignedUserList);
                vm.priorityList = angular.copy(params.priorityList);
                vm.firstTImeFlag = true;

                vm.apply = apply;
                vm.cancel = cancel;
                vm.openCalender = openCalender;
                vm.resetMultiSelectFilter = resetMultiSelectFilter;
                vm.setSubCategory = setSubCategory;
                vm.isDatesValid = isDatesValid;
                vm.tagList = (params.tags) ? params.tags : [];
                (function () {

                    role = masterData.getUserRole();
                    var taskCategories = masterData.getMasterData().taskcategories;
                    var categories = _.groupBy(taskCategories, 'categoryname');
                    vm.taskCategories = tasksHelper.setTaskCategories(categories);



                    vm.disableAssignedto = vm.filters.for === 'mytask';
                    setAssignedCatFilter(vm.filters);

                    if (vm.disableAssignedto) {
                        vm.filters.assignedto = role.uid;
                        if (vm.filters.assignedto !== '' && vm.filters.assignedto !== null && angular.isDefined(vm.filters.assignedto)) {
                            var assignedto = _.find(vm.assignedUserList.assignedto, function (item) {
                                return item.uid === vm.filters.assignedto;
                            });
                            vm.filters.assignedto = assignedto;
                        }

                        if (vm.filters.assignedby !== '' && vm.filters.assignedby !== null && angular.isDefined(vm.filters.assignedby)) {
                            var assignedby = _.find(vm.assignedUserList.assignedby, function (item) {
                                return item.uid === vm.filters.assignedby.uid;
                            });

                            vm.filters.assignedby = assignedby;
                        }
                    } else {

                        if (vm.filters.assignedto !== '' && vm.filters.assignedto !== null && angular.isDefined(vm.filters.assignedto)) {
                            var assignedto = _.find(vm.assignedUserList.assignedto, function (item) {
                                return item.uid === vm.filters.assignedto.uid;
                            });
                            vm.filters.assignedto = assignedto;
                        }
                        if (vm.filters.assignedby !== '' && vm.filters.assignedby !== null && angular.isDefined(vm.filters.assignedby)) {
                            var assignedby = _.find(vm.assignedUserList.assignedby, function (item) {
                                return item.uid === vm.filters.assignedby.uid;
                            });

                            vm.filters.assignedby = assignedby;
                        }
                    }
                })();

                function isDatesValid() {
                    if ($('#TasksummarystartDateErr').css("display") == "block" ||
                        $('#TasksummaryendDateErr').css("display") == "block") {
                        return true;
                    }
                    else {
                        return false;
                    }
                }

                $scope.$watch(function () {
                    if (vm.filters.for != 'mytask') {
                        if (((vm.filters && vm.filters.status.length > 0) || (vm.filters && utils.isNotEmptyVal(vm.filters.assignedby)) || (vm.filters && utils.isNotEmptyVal(vm.filters.assignedto)) ||
                            (vm.filters && utils.isNotEmptyVal(vm.filters.selectedmatter)) || (vm.filters && utils.isNotEmptyVal(vm.filters.s)) || (vm.filters && utils.isNotEmptyVal(vm.filters.e)) ||
                            (vm.filters.priority && vm.filters.priority.length > 0) || vm.filters.exclude_closed_matters != 0 || (vm.filters && utils.isNotEmptyVal(vm.filters.category) || (angular.isDefined(vm.category))) || vm.tagList.length > 0)) {
                            vm.enableApply = false;
                        } else {
                            vm.enableApply = true
                        }
                    }

                })

                function setAssignedCatFilter(filter) {
                    if (utils.isEmptyVal(vm.filters.taskcategoryid)) { return; }

                    vm.category = _.find(vm.taskCategories, function (taskcat) {
                        return vm.filters.taskcategoryid == taskcat.taskcategoryid;
                    });

                    //if ((filter.category instanceof Array) && filter.category.length > 0) {
                    //    var subCatObj = filter.category[0];
                    //    var cat = _.find(vm.taskCategories, function (taskCat) {
                    //        return taskCat.children[0].taskcategoryid == subCatObj.taskcategoryid;
                    //    });
                    //    vm.category = cat;
                    //}
                }

                function cancel() {
                    $modalInstance.dismiss('cancel');
                };

                function apply(selectedFilterValue) {
                    //convertStatus(vm.filters);
                    var filtercopy = angular.copy(selectedFilterValue);
                    var start = (filtercopy.s) ? moment(filtercopy.s).unix() : '';
                    var end = (filtercopy.e) ? moment(filtercopy.e).endOf('day').unix() : '';

                    //Exclude closed matters
                    if (typeof (filtercopy.exclude_closed_matters) !== 'undefined' && filtercopy.exclude_closed_matters != null && filtercopy.exclude_closed_matters == 0) {
                        filtercopy.exclude_closed_matters = '';
                    }
                    delete filtercopy.exclude_closed_Matters;

                    //Bug#9276 Validation for matter
                    if (utils.isEmptyVal(filtercopy.selectedmatter) || typeof filtercopy.selectedmatter == "object") {
                    } else {
                        return notificationService.error("Invalid Matter Selected");
                    }

                    if (utils.isNotEmptyVal(start) && utils.isEmptyVal(end)) {
                        notificationService.error('Due end date could not be blank');
                    } else if (utils.isNotEmptyVal(end) && utils.isEmptyVal(start)) {
                        notificationService.error('Due start date could not be blank');
                    } else if (start > end) {
                        notificationService.error('Due end date should not be less than Due start date');
                    } else {
                        filtercopy.s = (filtercopy.s) ? utils.getUTCTimeStamp(filtercopy.s) : '';
                        filtercopy.e = (filtercopy.e) ? utils.getUTCTimeStampEndDay(moment(filtercopy.e)) : '';
                        convertUserAssinged(filtercopy);
                        //set task cat id
                        filtercopy.taskcategoryid = utils.isNotEmptyVal(vm.category) ? vm.category.taskcategoryid : '';
                        filtercopy.taskcategoryName = utils.isNotEmptyVal(vm.category) ? vm.category.label : '';
                        $modalInstance.close(filtercopy);
                    }
                };

                function convertUserAssinged(filters) {
                    if (filters.assignedby !== '' && filters.assignedby !== null && angular.isDefined(filters.assignedby)) {
                        var assignedby = _.find(vm.assignedUserList.assignedby, function (item) {
                            return item.uid === vm.filters.assignedby.uid;
                        });
                        if (isNaN(assignedby.uid)) {
                            filters.assignedby = '';
                        } else {
                            filters.assignedby = assignedby.uid;
                        }

                    }

                    if (filters.assignedto !== '' && filters.assignedto !== null && angular.isDefined(filters.assignedto)) {
                        var assignedto = _.find(vm.assignedUserList.assignedto, function (item) {
                            return item.uid === vm.filters.assignedto.uid;
                        });

                        if (isNaN(assignedto.uid)) {
                            filters.assignedto = '';
                        } else {
                            filters.assignedto = assignedto.uid;
                        }
                    }
                }

                function getUTCDates(filters) {
                    if (angular.isDefined(filters)) {
                        if (utils.isNotEmptyVal(filters.e)) {
                            var toDate = moment.unix(filters.e).endOf('day');
                            toDate = toDate.utc();
                            toDate = toDate.toDate();
                            toDate = new Date(toDate);
                            filters.e = moment(toDate.getTime()).unix();
                        }

                        if (utils.isNotEmptyVal(filters.s)) {
                            var fromDate = moment.unix(filters.s).startOf('day');
                            fromDate = fromDate.utc();
                            fromDate = fromDate.toDate();
                            fromDate = new Date(fromDate);
                            filters.s = moment(fromDate.getTime()).unix();
                        }
                    }
                }

                function openCalender($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                }

                function resetMultiSelectFilter() {

                    if (vm.disableAssignedto) {
                        vm.filters.assignedto = role.uid;
                        if (vm.filters.assignedto !== '' && vm.filters.assignedto !== null && angular.isDefined(vm.filters.assignedto)) {
                            var assignedto = _.find(vm.assignedUserList.assignedto, function (item) {
                                return item.uid === vm.filters.assignedto;
                            });
                            vm.filters.assignedto = assignedto;
                        }
                    } else {
                        vm.filters.assignedto = "";
                    }

                    vm.filters.s = "";
                    vm.filters.e = "";
                    vm.filters.taskcategoryid = "";
                    vm.filters.tasksubcategoryid = "";
                    vm.filters.assignedby = "";
                    vm.filters.category = [];
                    vm.category = undefined;
                    vm.filters.status = [];
                    vm.filters.priority = [];
                    vm.filters.exclude_closed_matters = "";
                    vm.filters.selectedmatter = "";
                }

                function setSubCategory(category) {
                    if (category.tasksubcategoryid == 0) {
                        vm.filters.category = category.children;
                    } else {
                        vm.filters.category = [];
                    }
                }

            }]);

})(angular);



/*if(vm.disableAssignedto){
               vm.firstTImeFlag = false;
               vm.filters.assignedto = role.uid;
               if(vm.filters.assignedto !=='' && vm.filters.assignedto!==null && angular.isDefined(vm.filters.assignedto)){
                   var assignedto = _.find(vm.assignedUserList.assignedto, function(item){
                       return item.uid === vm.filters.assignedto;
                   });
                   vm.filters.assignedto = assignedto;
               }

               if(vm.filters.assignedby !=='' && vm.filters.assignedby!==null && angular.isDefined(vm.filters.assignedby)){
                   var assignedby =  _.find(vm.assignedUserList.assignedby, function(item){
                       return item.uid === vm.filters.assignedby;
                   });

                   vm.filters.assignedby = assignedby;
               }
           }else{
               *//*if(vm.firstTImeFlag){
                        if(vm.filters.assignedto !=='' && vm.filters.assignedto!==null && angular.isDefined(vm.filters.assignedto)){
                            var assignedto = _.find(vm.assignedUserList.assignedto, function(item){
                                return item.uid === vm.filters.assignedto;
                            });
                            vm.filters.assignedto = assignedto;
                        }else{
                            vm.filters.assignedto = "";
                        }
                    }*//*
                    vm.filters.assignedto = "";

                    if(vm.filters.assignedby !=='' && vm.filters.assignedby!==null && angular.isDefined(vm.filters.assignedby)){
                        var assignedby =  _.find(vm.assignedUserList.assignedby, function(item){
                            return item.uid === vm.filters.assignedby;
                        });

                        vm.filters.assignedby = assignedby;
                    }
                }*/

/*if(vm.filters.assignedby !=='' && vm.filters.assignedby!==null && angular.isDefined(vm.filters.assignedby)){
    var assignedby =  _.find(vm.assignedUserList.assignedby, function(item){
        return item.uid === vm.filters.assignedby;
    });

    vm.filters.assignedby = assignedby;
}

if(vm.filters.assignedto !=='' && vm.filters.assignedto!==null && angular.isDefined(vm.filters.assignedto)){
    var assignedto = _.find(vm.assignedUserList.assignedto, function(item){
        return item.uid === vm.filters.assignedto;
    });
    vm.filters.assignedto = assignedto;
}*/



/*var status = [];
vm.filters.status = [];
_.forEach(vm.statusList, function(stsList){

    if(params.filters.status.length!=0 && params.filters.status!=null){

        _.forEach(params.filters.status, function(data){
            if(stsList.name == data){
                vm.filters.status.push(stsList);
            }
        });

    }

});*/

//dateConverter(vm.filters);

/*function convertStatus(filters){
          var status = [];
          _.forEach(vm.statusList, function(stsList){
              _.forEach(filters.status, function(data){
                  if(stsList.name == data.name){
                      status.push(stsList.name);
                  }
              });
          });
          filters.status = status;

      }*/


/*function dateConverter(filters){
    *//*if(filters.s!='' && filters.s!=null && filters.s!=0){
                    vm.filters.s = moment.unix(filters.s).format("MM/DD/YYYY");
                }*//*
                if (angular.isDefined(filters.s) && !_.isNull(filters.s) && !utils.isEmptyString(filters.s) && filters.s!=0 ) {
                    filters.s = moment.unix(filters.s).format('MM/DD/YYYY')
                }
                if (angular.isDefined(filters.e) && !_.isNull(filters.e) && !utils.isEmptyString(filters.e) && filters.e!=0 ) {
                    filters.e = moment.unix(filters.e).format('MM/DD/YYYY')
                }

            }*/