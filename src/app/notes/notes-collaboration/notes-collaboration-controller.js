
(function () {

    'use strict';

    angular
        .module('cloudlex.notes')
        .controller('NotesCollaborationCtrl', NotesCollaborationCtrl);

    NotesCollaborationCtrl.$inject = ['$stateParams', 'masterData', '$modalInstance', 'notification-service', 'collaborationNote', 'notesDataService'];

    function NotesCollaborationCtrl($stateParams, masterData, $modalInstance, notificationService, collaborationNote, notesDataService) {

        var self = this;
        self.cancel = cancel;
        self.save = save;
        self.matterId = $stateParams.matterId;
        var matterId = $stateParams.matterId;
        self.noteData = collaborationNote.noteData;
        self.contacts = [];
        var gracePeriodDetails = masterData.getUserRole();
        self.firmID = gracePeriodDetails.firm_id;

        self.collab2 = angular.copy(collaborationNote.noteData.noteCollaboratedEntityArr);

        self.data = angular.copy(self.collab2);

        function save() {
            for (var i = 0; i < self.collab2.length; i++) {
                if (self.collab2[i].notePermission != self.data[i].notePermission) {
                    var obj = {};
                    obj.id = self.collab2[i].id;
                    obj.isEnable = self.collab2[i].notePermission ? 1 : 0;
                    self.contacts.push(obj);
                }
            }

            var saveObj = {};
            saveObj.contacts = self.contacts;
            saveObj.firmId = self.firmID;
            saveObj.matterId = self.matterId;
            saveObj.entityType = 3;
            var noteIds = [self.noteData.note_id];
            saveObj.noteEntity = {};
            saveObj.noteEntity['noteIds'] = noteIds;

            if (saveObj.contacts.length > 0) {
                notesDataService.saveNotePermission(saveObj)
                    .then(function (response) {
                        /*Checking if received the proper responce or not*/
                        if (response) {
                            notificationService.success('Access modified successfully');
                            // cancel();
                            $modalInstance.close();

                        }
                    }, function (error) {
                        notificationService.error('Access not modified successfully');
                        cancel();
                    });
            } else {
                $modalInstance.close();
            }

        }

        function cancel() {
            $modalInstance.dismiss();
        }

        // var modalInstance = openAddEditEventsModal(angular.copy(resolveObj));
        // function openAddEditEventsModal(resolveObj) {
        //     return $modal.open({
        //         templateUrl: 'app/events/partials/add-event.html',
        //         controller: 'addEditEventCtrl as addEditEvent',
        //         windowClass: 'eventDialog',
        //         backdrop: 'static',
        //         keyboard: false,
        //         resolve: {
        //             addEditEventsParams: function () {
        //                 return resolveObj;
        //             }
        //         },
        //     });
        // }

    }
})(angular);