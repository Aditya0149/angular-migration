(function (angular) {

    angular.module('intake.tasks')
        .controller('IntakeTaskTreeCtrl', IntakeTaskTreeCtrl);

    IntakeTaskTreeCtrl.$inject = ['$modalInstance', 'intakeMasterData', 'Subcategory'];
    function IntakeTaskTreeCtrl($modalInstance, intakeMasterData, Subcategory) {

        var vm = this;

        vm.subTaskSelected = subTaskSelected;
        vm.ok = ok;
        vm.cancel = cancel;

        (function () {
            var taskCategories = intakeMasterData.getMasterData().intakeTaskCategories;
            var categories = _.groupBy(taskCategories, 'categoryname');
            vm.displayCategories = [];
            vm.selectedCategory = {};
            vm.opts = {
                dirSelectable: false
            };
            setCategories(categories);
            setSelectedCat(Subcategory);
        })();

        function setCategories(categories) {

            angular.forEach(categories, function (val, key) {
                var catObj = {
                    label: key,
                    children: setChildren(val)
                };
                vm.displayCategories.push(catObj);
            });

            vm.displayCategories.push({
                label: 'Other', intake_task_subcategory_id: 0
            });

            function setChildren(children) {
                var childs = [];
                _.forEach(children, function (child) {
                    var childObj = {
                        label: child.intake_task_subcategory_name,
                        notes: child.intake_task_subcategory_name,
                        taskcategoryid: child.intake_taskcategory_id,
                        intake_task_subcategory_id: child.intake_task_subcategory_id
                    };
                    childs.push(childObj);
                });
                return childs;
            }
        }

        function setSelectedCat(subcategory) {
            if (utils.isEmptyVal(subcategory)) { return; }

            if (parseInt(subcategory.intake_task_subcategory_id) === 0) {

                vm.selectedCategory = _.find(vm.displayCategories, function (cat) {
                    return cat.intake_task_subcategory_id == 0
                });
                vm.selectedCategory.notes = subcategory.notes;
                return;
            }

            for (var i = 0; i < vm.displayCategories.length; i++) {
                var children = vm.displayCategories[i].children;
                var matchedChild = _.find(children, function (child) {
                    return subcategory.intake_task_subcategory_id === child.intake_task_subcategory_id;
                });

                if (utils.isNotEmptyVal(matchedChild)) {
                    vm.selectedCategory = matchedChild;
                    vm.expandedNodes = [vm.displayCategories[i]];
                    break;
                }
            }
        }

        function subTaskSelected(subTask) {
            vm.selectedCategory = subTask;
        }

        function ok() {
            $modalInstance.close(vm.selectedCategory);
        }

        function cancel() {
            $modalInstance.dismiss();
        }
    }

})(angular);