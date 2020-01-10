/* Document Upload module controller. 
 * */
(function () {

    'use strict';

    angular
        .module('cloudlex.documents')
        .controller('CollaborationDocumentsCtrl', CollaborationDocumentsCtrl);

    CollaborationDocumentsCtrl.$inject = ['$stateParams', 'masterData', '$modalInstance', 'documentsDataService', 'notification-service', 'collaborationDocument'];

    function CollaborationDocumentsCtrl($stateParams, masterData, $modalInstance, documentsDataService, notificationService, collaborationDocument) {

        var self = this;
        /*Initial value variable*/
        self.matterId = $stateParams.matterId;
        var matterId = $stateParams.matterId;
        self.documentId = collaborationDocument.selectedItems.doc_id;
        self.save = save;
        self.cancel = cancel;
        var documentId = $stateParams.documentId;
        self.is_enable = false;
        self.contacts = [];
        var gracePeriodDetails = masterData.getUserRole();
        self.firmID = gracePeriodDetails.firm_id;
        //self.matterCollaboratedEntity = JSON.parse(localStorage.getItem('getMatterCollaboratedEntity'));

        self.collab2 = angular.copy(collaborationDocument.selectedItems.documentCollaboratedEntityArr);

        self.data = angular.copy(self.collab2);

        function save() {
            for (var i = 0; i < self.collab2.length; i++) {
                if (self.collab2[i].docPermission != self.data[i].docPermission) {
                    var obj = {};
                    obj.id = self.collab2[i].id;
                    obj.isEnable = self.collab2[i].docPermission ? 1 : 0;
                    self.contacts.push(obj);
                }
            }

            var saveObj = {};
            saveObj.contacts = self.contacts;
            saveObj.firmId = self.firmID;
            saveObj.matterId = self.matterId;
            saveObj.entityType = 1;
            var docIds = [self.documentId];
            saveObj.documentEntity = {};
            saveObj.documentEntity['docIds'] = docIds;

            if (saveObj.contacts.length > 0) {
                documentsDataService.saveDocumentPermission(saveObj)
                    .then(function (response) {
                        /*Checking if received the proper responce or not*/
                        if (response) {
                            notificationService.success('Access modified successfully');
                            $modalInstance.close();
                        }
                    }, function (error) {
                        notificationService.error('Access not modified successfully');
                    });
            } else {
                $modalInstance.close();
            }

        }

        function cancel() {
            $modalInstance.dismiss();
        }
    }
})();
