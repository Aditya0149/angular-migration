(function (angular) {

    angular.module('cloudlex.tasks')
        .controller('TaskTreeCtrl', TaskTreeCtrl);

    TaskTreeCtrl.$inject = ['$modalInstance', 'masterData', 'Subcategory'];
    function TaskTreeCtrl($modalInstance, masterData, Subcategory) {

        var vm = this;

        vm.subTaskSelected = subTaskSelected;
        vm.ok = ok;
        vm.cancel = cancel;

        (function () {
            var taskCategories = masterData.getMasterData().taskcategories;
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
                label: 'Other', tasksubcategoryid: 0
            });

            function setChildren(children) {
                var childs = [];
                _.forEach(children, function (child) {
                    var childObj = {
                        label: child.name,
                        notes: child.name,
                        practiceareaid: child.practiceareaid,
                        taskcategoryid: child.taskcategoryid,
                        tasksubcategoryid: child.tasksubcategoryid
                    };
                    childs.push(childObj);
                });
                return childs;
            }
        }

        function setSelectedCat(subcategory) {
            if (utils.isEmptyVal(subcategory)) { return; }

            if (parseInt(subcategory.tasksubcategoryid) === 0) {

                vm.selectedCategory = _.find(vm.displayCategories, function (cat) {
                    return cat.tasksubcategoryid == 0
                });
                vm.selectedCategory.notes = subcategory.notes;
                return;
            }

            for (var i = 0; i < vm.displayCategories.length; i++) {
                var children = vm.displayCategories[i].children;
                var matchedChild = _.find(children, function (child) {
                    return subcategory.tasksubcategoryid == child.tasksubcategoryid;
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