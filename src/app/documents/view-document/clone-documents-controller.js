/**
 * 
 * Author: Kailash kumar
 * Module: Document
 * Action: Clone Document / Open with microsoft online
 */
(function () {
    angular
        .module('cloudlex.documents')
        .controller('cloneDocumentCtrl', cloneDocumentCtrl);

    cloneDocumentCtrl.$inject = ['$rootScope', 'documentsDataService', 'matterFactory', 'docDetails', 'notification-service', '$modalInstance'];

    function cloneDocumentCtrl($rootScope, documentsDataService, matterFactory, docDetails, notificationService, $modalInstance) {
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
        vm.docModel = {
            category: (docDetails.doc_category.doc_category_id).toString(),
            document_name: docDetails.doc_name.substr(0, docDetails.doc_name.lastIndexOf('.'))
        };
        (function () {
            getDocCategories();
            searchMatters(docDetails.matter.matter_name, docDetails.matter.matter_id);
        })();

        /*Search matter in case of global documents*/
        function searchMatters(matterName, matterId) {
            if (matterName) {
                return matterFactory.searchMatters(matterName).then(
                    function (response) {
                        vm.searchMatterList = response.data;
                        if (matterId != undefined) {
                            formatTypeaheadDisplay(matterId);
                        }
                        return response.data;
                    }, function (error) {
                        notificationService.error('Matters not loaded');
                    });
            }
        }

        /*Get the Document Categories*/
        function getDocCategories() {
            documentsDataService.getDocumentCategories()
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
                return matter.matterid == matterid;
            });
            return matterInfo.name;
        }

        /**
         * Clone source document 
         */
        function cloneDocument(info) {
            var params = {
                source_documentid: vm.documentId,
                matterid: info.matterid.toString(),
                categoryid: info.category,
                documentname: info.document_name
            }
            documentsDataService.cloneSourceDocument(params)
                .then(function (response) {
                    if (response.data != undefined) {
                        $rootScope.$broadcast('openNow', { args: response.data });
                    }
                }, function (error) {
                    if (error.status == 506) {
                        notificationService.error("Document name already exist in Matter and category");
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
