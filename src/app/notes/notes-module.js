
(function () {
    'use strict';

    angular.module('cloudlex.notes', ['ngRoute', 'theaquaNg', 'cloudlex.mailbox'])

        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('notes', {
                    url: '/notes/:matterId',
                    templateUrl: 'app/notes/matter-notes/notes.html',
                    controller: 'NotesCtrl as notes',
                    params: {
                        liteNotificationFilter: false,
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
                })
                .state('addGlobalNote', {
                    url: '/add-global-note',
                    templateUrl: 'app/notes/global-notes/partials/add-global-note.html',
                    controller: 'AddGlobalNoteCtrl as addGlobalNotes'
                })
                .state('matterNotesCollaboration', {
                    url: '/notes-collaboration',
                    templateUrl: 'app/notes/notes-collaboration/notes-collaboration.html',
                    controller: 'NotesCollaborationCtrl  as notesCollaboration'
                });
        }]);

})();

