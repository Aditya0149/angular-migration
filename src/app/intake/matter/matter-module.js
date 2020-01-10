'use strict';

angular.module('intake.matter', ['ui.router'])

    .config(['$stateProvider', function ($stateProvider) {


        $stateProvider
            .state('intake-list', {
                url: '/intake/intake-list',
                templateUrl: 'app/intake/matter/matter-list/matter-list.html',
                controller: 'IntakeListCtrl as matterCtrl',
                resolve: {
                    'MasterData': ['masterData', function (masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData().then(function (res) {
                                return res;
                            });
                        }
                        return data;
                    }],
                    'IntakeMasterData': ['intakeMasterData', function (masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData().then(function (res) {
                                return res;
                            });
                        }
                        return data;
                    }]
                },
                data: {
                    breadcrum: [
                        {
                            state: 'intake-list', name: 'Intake List',
                        }]
                },
                onEnter: function ($rootScope) {
                    $rootScope.onLauncher = false;
                    $rootScope.onMatter = false;
                    $rootScope.onIntake = true;
                    $rootScope.onReferral = false;
                    $rootScope.onArchival = false;
                    $rootScope.onMarkerplace = false;
                    $rootScope.onExpense = false;
                    $rootScope.onReferralPrg = false;
                }
            }).state('intake-overview', {
                url: '/intake/intake-overview/:intakeId',
                templateUrl: 'app/intake/matter/matter-overview/matter-overview.html',
                controller: 'IntakeOverviewCtrl as matterOverview',
                resolve: {
                    'MasterData': ['masterData', function (masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData();
                        }
                        return data;
                    }],
                    'RoleData': ['masterData', function (masterData) {
                        var role = masterData.getUserRole();
                        if (utils.isEmptyObj(role)) {
                            return masterData.fetchUserRole();
                        }
                        return role;
                    }],
                    'IntakeMasterData': ['intakeMasterData', function (masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData().then(function (res) {
                                return res;
                            });
                        }
                        return data;
                    }]
                },
                onEnter: function ($rootScope) {
                    $rootScope.onLauncher = false;
                    $rootScope.onMatter = false;
                    $rootScope.onIntake = true;
                    $rootScope.onReferral = false;
                    $rootScope.onArchival = false;
                    $rootScope.onMarkerplace = false;
                    $rootScope.onExpense = false;
                    $rootScope.onReferralPrg = false;
                }
            });
    }]);
