;

(function () {
    'use strict';

    angular.module('cloudlex.allParties', ['ui.router'])
        .config(['$stateProvider', function ($stateProvider) {

            $stateProvider
                .state('allParties', {
                    url: '/allParties/:matterId',
                    params: {
                        openView: null
                    },
                    templateUrl: 'app/all-parties/all-parties.html',
                    controller: 'AllPartiesCtrl as allParties',

                }).state('addPlaintiff', {
                    url: '/allParties/addPlaintiff/:matterId',
                    templateUrl: 'app/all-parties/add-plaintiff/add-plaintiff.html',
                    controller: 'AddPlaintiffCtrl as addPlaintiff'
                }).state('editPlaintiff', {
                    url: '/allParties/editPlaintiff/:matterId',
                    templateUrl: 'app/all-parties/add-plaintiff/add-plaintiff.html',
                    controller: 'AddPlaintiffCtrl as addPlaintiff',
                    params: {
                        selectedPlaintiff: null
                    }
                }).state('addDefendant', {
                    url: '/allParties/addDefendant/:matterId',
                    templateUrl: 'app/all-parties/defendants/add-defendant/add-defendant.html',
                    controller: 'AddDefendantCtrl as addDefendant'
                }).state('editDefendant', {
                    url: '/allParties/editDefendant/:matterId',
                    templateUrl: 'app/all-parties/defendants/add-defendant/add-defendant.html',
                    controller: 'AddDefendantCtrl as addDefendant',
                    params: {
                        selectedDefendant: null
                    },
                }).state('addOtherParty', {
                    url: '/allParties/addOtherParty/:matterId',
                    templateUrl: 'app/all-parties/other-parties/add-other-party/add-other-party.html',
                    controller: 'AddOtherPartyCtrl as addOtherParty',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    }
                }).state('editOtherParty', {
                    url: '/allParties/editOtherParty/:matterId',
                    templateUrl: 'app/all-parties/other-parties/add-other-party/add-other-party.html',
                    controller: 'AddOtherPartyCtrl as addOtherParty',
                    params: {
                        selectedOtherParty: null
                    },
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    }

                }).state('disableEntity', {
                    url: '/disableEntity',
                    templateUrl: 'app/all-parties/plaintiffs/disable-collaboration/disable-collaboration.html',
                    controller: 'disableSingleEntityForMattercollaborationCtrl as disableEntityMC',
                    params: {
                        matterId: null,
                        flag: null,
                        entity: null,
                        selectedObj: null,
                        state: null,
                        configObj: null
                    }
                });
        }]);

})();