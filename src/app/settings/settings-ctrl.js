(function (angular) {

    angular.module('cloudlex.settings')
        .controller('SettingsCtrl', SettingsCtrl)

    SettingsCtrl.$inject = ['$state', 'masterData'];
    function SettingsCtrl($state, masterData) {
        var vm = this;

        vm.changePage = changePage;
        vm.highlightCurrentNav = highlightCurrentNav;

        (function () {

            vm.role = masterData.getUserRole();
            var permissions = masterData.getPermissions();
            vm.ugmtPermissions = _.filter(permissions[0].permissions, function (per) {
                if (per.entity_id == '6') {
                    return per;
                }
            });
            // if (vm.role.role == 'LexviasuperAdmin') {
            //     vm.settingsNavigation = [{ name: 'My Profile', state: '.profile' },
            //      { name: 'User Management', state: '.userManagement' },
            //     ];
            // } else
            if (vm.role.is_subscriber === "1") {
                vm.settingsNavigation = [
                    { name: 'My Profile', state: '.profile' },
                    { name: 'User Management', state: '.userManagement' },
                    { name: 'Subscription', state: '.subscription' },
                    { name: 'Notifications', state: '.notifications' },
                    { name: 'Configuration', state: '.configuration' },
                    // { name: 'Workflow', state: '.workflows' }
                ];
            } else if (vm.role.role == 'LexviasuperAdmin' || vm.role.is_admin === "1") {
                vm.settingsNavigation = [{ name: 'My Profile', state: '.profile' },
                { name: 'User Management', state: '.userManagement' },
                { name: 'Configuration', state: '.configuration' },
                { name: 'Notifications', state: '.notifications' },
                    //  { name: 'Workflow', state: '.workflows' }
                ];
            }
            //        // US 4553: for Users has access to see User Managemnt 
            //      else if (vm.role.has_access === "1" && !(vm.role.is_admin === "1") && !(vm.role.is_subscriber === "1")) {
            //         vm.settingsNavigation =  [
            //         { name: 'My Profile', state: '.profile' },
            //         { name: 'User Management', state: '.userManagement' }
            //        // { name: 'Subscription', state: '.subscription' }
            //    ]; 
            // else if (vm.role.is_admin === "1" && !(vm.role.is_subscriber === "1")) {
            //     vm.settingsNavigation = [
            //         { name: 'My Profile', state: '.profile' },
            //         { name: 'User Management', state: '.userManagement' }
            //         // { name: 'Subscription', state: '.subscription' }
            //     ];
            // } 
            else {
                if (vm.ugmtPermissions[0].V == 1) {
                    vm.settingsNavigation = [
                        { name: 'My Profile', state: '.profile' },
                        { name: 'User Management', state: '.userManagement' },
                        // { name: 'Workflow', state: '.workflows' }
                    ];
                } else
                    vm.settingsNavigation = [
                        { name: 'My Profile', state: '.profile' },
                        // { name: 'Workflow', state: '.workflows' }
                    ];
            }

            /*
                        if ($rootScope.onIntake == true) {
                            sessionStorage.setItem("ActiveScope", "Intake")
                        }
                        else if ($rootScope.onLauncher == true) {
                            sessionStorage.setItem("ActiveScope", "Launcher")
                        }
                        else if ($rootScope.onMatter == true) {
                            sessionStorage.setItem("ActiveScope", "Matter")
                        }
                        else if ($rootScope.onReferral == true) {
                            sessionStorage.setItem("ActiveScope", "Referral")
                        }
                        else if ($rootScope.onArchival == true) {
                            sessionStorage.setItem("ActiveScope", "Archival")
                        }
                        else if ($rootScope.onMarkerplace == true) {
                            sessionStorage.setItem("ActiveScope", "Markerplace")
                        }
                        else {
                            var activescope = sessionStorage.getItem("ActiveScope");
                            setscopefalse($rootScope);
                            if (activescope == "Intake") {
                                $rootScope.onIntake = true;
                            }
                            else if (activescope == "Launcher") {
                                $rootScope.onLauncher = true;
                            }
                            else if (activescope == "Matter") {
                                $rootScope.onMatter = true;
                            }
                            else if (activescope == "Referral") {
                                $rootScope.onReferral = true;
                            }
                            else if (activescope == "Archival") {
                                $rootScope.onArchival = true;
                            }
                            else if (activescope == "Markerplace") {
                                $rootScope.onMarkerplace = true;
                            }
                        }
                        */
        }


        )();

        function setscopefalse($rootScope) {
            $rootScope.onLauncher = false;
            $rootScope.onMatter = false;
            $rootScope.onIntake = false;
            $rootScope.onReferral = false;
            $rootScope.onArchival = false;
            $rootScope.onMarkerplace = false;
            $rootScope.onExpense = false;
            $rootScope.onReferralPrg = false;
        }

        function changePage(stateName) {
            $state.go(stateName);
        }

        function highlightCurrentNav(stateName) {
            var state = ('settings' + stateName);
            return $state.current.name === state;
        }

    }

})(angular);
