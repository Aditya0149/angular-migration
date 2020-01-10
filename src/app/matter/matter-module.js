'use strict';

//TODO : modulerize into add-matter, matter-list
// no need to have to routes in same modules, if two routes exists make two different modules


angular.module('cloudlex.matter', ['ngRoute', 'ui.router'])

    .config(['$stateProvider', function ($stateProvider) {


        $stateProvider
            .state('add-matter', {
                url: '/add-matter',
                templateUrl: 'app/matter/add-matter/add-matter.html',
                controller: 'AddMatterCtrl as addCtrl',
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
                    }]
                },
                breadcrum: [
                    { name: 'Matters', state: 'matter-list' },
                    {
                        name: 'Add Matter'
                    }]
            }).state('edit-matter', {
                url: '/add-matter/:matterId',
                templateUrl: 'app/matter/add-matter/add-matter.html',
                controller: 'AddMatterCtrl as addCtrl',
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
                    }]
                },
                breadcrum: [{ name: 'Matters', state: 'matter-list' }, {
                    name: 'Edit Matter'
                }]
            }).state('matter-list', {
                url: '/matter-list',
                templateUrl: 'app/matter/matter-list/matter-list.html',
                controller: 'MatterListCtrl as matterCtrl',
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
                    }]
                },
                data: {
                    breadcrum: [
                        {
                            state: 'matter-list', name: 'Matter List',
                        }]
                },
                onEnter: function ($rootScope) {
                    $rootScope.onLauncher = false;
                    $rootScope.onMatter = true;
                    $rootScope.onIntake = false;
                    $rootScope.onReferral = false;
                    $rootScope.onArchival = false;
                    $rootScope.onMarkerplace = false;
                    $rootScope.onExpense = false;
                    $rootScope.onReferralPrg = false;
                }
            }).state('matter-detail', {
                url: '/matter-details/:matterId',
                templateUrl: 'app/matter/matter-details/matter-details.html',
                controller: 'MatterDetailsCtrl as matterDetail',
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
                    }]
                },
            }).state('add-overview', {
                url: '/matter-overview/:matterId',
                templateUrl: 'app/matter/matter-overview/matter-overview.html',
                controller: 'MatterOverviewCtrl as matterOverview',
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
                    }]
                },
                params: {
                    matterId: null,
                    isArchived: false,
                    isMatter: false
                },
                onEnter: function ($rootScope, $stateParams) {
                    if ($stateParams.isArchived) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = false;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = true;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }
                    if ($stateParams.isMatter) {
                        $rootScope.onLauncher = false;
                        $rootScope.onMatter = true;
                        $rootScope.onIntake = false;
                        $rootScope.onReferral = false;
                        $rootScope.onArchival = false;
                        $rootScope.onMarkerplace = false;
                        $rootScope.onExpense = false;
                        $rootScope.onReferralPrg = false;
                    }
                }
            }).state('archival', {
                url: '/archival',
                templateUrl: 'app/matter/matter-list/matter-archive/archive-matter-list.html',
                controller: 'archiveMatterListCtrl as archiveMatterCtrl',
                resolve: {
                    'MasterData': ['masterData', function (masterData) {
                        var data = masterData.getMasterData();
                        if (utils.isEmptyObj(data)) {
                            return masterData.fetchMasterData();
                        }
                        return data;
                    }]
                },
                onEnter: function ($rootScope) {
                    // $rootScope.onLauncher = false;
                    // $rootScope.onMatter = false;
                    // $rootScope.onIntake = false;
                    // $rootScope.onReferral = false;
                    // $rootScope.onArchival = true;
                    // $rootScope.onMarkerplace = false;
                }
            }).state('matter-sharing', {
                url: '/matter-sharing/:matterId',
                templateUrl: 'app/matter/matter-collaboration/matter-collaboration.html',
                controller: 'MatterCollaborationCtrl as matterCollaborationCtrl',
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
                    }]
                },
                data: {
                    breadcrum: [
                        {
                            state: 'matter-collaboration', name: 'Matter collaboration',
                        }]
                },
                params: {
                    matterName: null,
                },
                onEnter: function ($rootScope) {
                    $rootScope.onLauncher = false;
                    $rootScope.onMatter = true;
                    $rootScope.onIntake = false;
                    $rootScope.onReferral = false;
                    $rootScope.onArchival = false;
                    $rootScope.onMarkerplace = false;
                    $rootScope.onExpense = false;
                    $rootScope.onReferralPrg = false;
                }
            });
    }]);
