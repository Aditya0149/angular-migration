/**
 * 
 * Author: Kailash kumar
 * Module: Document
 * Action: Clone Document / Open with microsoft online
 */
(function () {
    angular
        .module('intake.documents')
        .controller('cloneIntakeDocumentCtrl', cloneIntakeDocumentCtrl);

    cloneIntakeDocumentCtrl.$inject = ['$rootScope', 'inatkeDocumentsDataService', 'intakeFactory', 'docDetails', 'notification-service', '$modalInstance'];

    function cloneIntakeDocumentCtrl($rootScope, inatkeDocumentsDataService, intakeFactory, docDetails, notificationService, $modalInstance) {
        var vm = this;

        /**
         * function assign controller scope
         */
        vm.documentId = docDetails.doc_id;
        vm.searchMatters = searchMatters;
        vm.formatTypeaheadDisplay = formatTypeaheadDisplay;
        vm.cloneDocument = cloneDocument;
        vm.closeModal = closeModal;
        vm.searchMatterList = "";
        var cat = docDetails.doc_category ? { Id: docDetails.doc_category.doc_category_id, Name: docDetails.doc_category.doc_category_name } : {};
        vm.docModel = {
            category: cat,
            document_name: docDetails.doc_name.substr(0, docDetails.doc_name.lastIndexOf('.'))
        };
        (function () {
            getDocCategories();
            searchMatters(docDetails.intake.intake_name, docDetails.intake.intake_id);
        })();

        /*Search matter in case of global documents*/
        function searchMatters(matterName, matterId) {
            if (matterName) {
                return intakeFactory.searchMatters(matterName).then(
                    function (response) {
                        vm.searchMatterList = response;
                        if (matterId != undefined) {
                            formatTypeaheadDisplay(matterId);
                        }
                        return response;
                    }, function (error) {
                        notificationService.error('Matters not loaded');
                    });
            }
        }

        /*Get the Document Categories*/
        function getDocCategories() {
            inatkeDocumentsDataService.getDocumentCategories()
                .then(function (response) {
                    vm.documentCategories = response;
                }, function (error) {
                    notificationService.error('document categories not loaded');
                });
        }


        /* Formate the matter id and name in case of global documents*/
        function formatTypeaheadDisplay(matterid, index) {
            if (angular.isUndefined(matterid) || utils.isEmptyString(matterid) || vm.searchMatterList.length === 0) {
                return undefined;
            }
            var matterInfo = _.find(vm.searchMatterList, function (matter) {
                vm.docModel.matterid = matterid;
                return matter.intakeId === matterid;
            });
            return matterInfo.intakeName;
        }

        /**
         * Clone source document 
         */
        function cloneDocument(info) {
            var params = {
                doc_id: vm.documentId,
                intake: { "intake_id": info.matterid },
                doc_category: { "doc_category_id": info.category.Id },
                doc_name: info.document_name,
                uploadtype: "fresh"
            }
            inatkeDocumentsDataService.cloneSourceDocument(params)
                .then(function (response) {
                    var obj = { documentid: response, matterid: vm.docModel.matterid }
                    if (response != undefined) {
                        $rootScope.$broadcast('openIntakeDocNow', { args: obj });
                    }
                }, function (error) {
                    if (error.status == 500) {
                        notificationService.error("Document name already exist in Intake and category");
                    } else {
                        notificationService.error("Unable to clone source document!");
                    }
                });
        }

        /**
         * Close modal
         */
        function closeModal() {
            $modalInstance.close();
        }
    }
})();
