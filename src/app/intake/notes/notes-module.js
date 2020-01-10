
(function () {
    'use strict';

    angular.module('intake.notes', ['ngRoute', 'theaquaNg'])

        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('intakenotes', {
                    url: '/intake/notes/:intakeId',
                    templateUrl: 'app/intake/notes/matter-notes/notes.html',
                    controller: 'IntakeNotesCtrl as notes',
                    resolve: {
                        'MasterData': ['masterData', function (masterData) {
                            var data = masterData.getMasterData();
                            if (utils.isEmptyObj(data)) {
                                return masterData.fetchMasterData();
                            }
                            return data;
                        }]
                    }
                })
                .state('addIntakeGlobalNote', {
                    url: '/add-global-note',
                    templateUrl: 'app/notes/global-notes/partials/add-global-note.html',
                    controller: 'IntakeAddGlobalNoteCtrl as addGlobalNotes'
                });
        }]);

})();

