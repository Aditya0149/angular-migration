angular.module('intake.documents')
    .factory('intakeDocumentsConstants', ['globalConstants', function (globalConstants) {

        var documentFactory = {};
        documentFactory.RESTAPI = {};
        // https://demoapi.cloudlex.net/Cloudlex_Intake/webapi/v1/intake/documents/documentslimit?alldocuments=false&mydocs=false&pageNum=1&pageSize=250&sortBy=5&sortOrder=&categoryFilter=&plaintiffFilter=&party_role=&intakeFilter=1284&updatedByFilter=&createdByFilter=&c_start_date=&c_end_date=&u_start_date=&u_end_date=
        // https://demoapi.cloudlex.net:8080/Cloudlex_Intake/webapi/v1/intake/documents/documentslimit?pageSize=250&alldocuments=false&mydocs=false&pageNum=1&sortBy=5&sortOrder=desc&categoryFilter=&assocPartyFilter=&party_role=1&intakeFilter=&updatedByFilter=&createdByFilter=&c_start_date=&c_end_date=&u_start_date=&u_end_date=
        documentFactory.RESTAPI.documentPlaintiffs = globalConstants.webServiceBase + "allparties/getPlaintiffLimited/";
        documentFactory.RESTAPI.documentCategories = globalConstants.webServiceBase + "lexviadocuments/getcategories.json";
        documentFactory.RESTAPI.uploadDocument = globalConstants.intakeServiceBaseV2 + "documents";
        documentFactory.RESTAPI.getDocumentList = globalConstants.intakeServiceBase + "documents/documentslimit?";
        documentFactory.RESTAPI.getDocumentListCount = globalConstants.webServiceBase + "lexviadocuments/documentslimit_count";
        documentFactory.RESTAPI.getMatterDocumentListCount = globalConstants.webServiceBase + "lexviadocuments/matterdocumentslimit_count";
        documentFactory.RESTAPI.getTags = globalConstants.intakeServiceBaseV2 + "documents/tags?";
        documentFactory.RESTAPI.getSingleDoc = globalConstants.webServiceBase + "intake_document/intake_document_detail/";
        documentFactory.RESTAPI.docLock = globalConstants.webServiceBase + "lexviadocuments/lock/";
        documentFactory.RESTAPI.generateDownLink = globalConstants.webServiceBase + "lexviafiles/getsharedaccess.json";
        documentFactory.RESTAPI.updateDocument = globalConstants.intakeServiceBaseV2 + "documents";
        documentFactory.RESTAPI.deleteDocument = globalConstants.intakeServiceBaseV2 + "documents/delete";
        //documentFactory.RESTAPI.downloadDocument = globalConstants.webServiceBase + "lexviafiles/sharedaccessdownload/";
        documentFactory.RESTAPI.downloadDocument = globalConstants.intakeServiceBaseV2 + "documents/download/";
        documentFactory.RESTAPI.keepsessionalive = globalConstants.webServiceBase + 'lexviadocuments/keepsessionalive.json';
        documentFactory.RESTAPI.viewDocument = globalConstants.intakeServiceBaseV2 + "documents/view/";
        documentFactory.RESTAPI.getOfficeStatus = globalConstants.webServiceBase + "modulesubscription/subscription.json";
        documentFactory.RESTAPI.discoveryUrl = globalConstants.intakeServiceBaseV2 + "wopi/discoveryDetails";
        documentFactory.RESTAPI.wopiUrl = globalConstants.intakeServiceBaseV2 + "[type]/wopi/files/";
        documentFactory.RESTAPI.fileExists = globalConstants.webServiceBase + "lexviadocuments/file_exists/[ID]";
        ///intake_document/intake_document_detail/339645(document id)?intake_id=19954
        documentFactory.RESTAPI.getDocumentDetails = globalConstants.intakeServiceBaseV2 + "documents/";
        documentFactory.RESTAPI.cloneSourceDocument = globalConstants.intakeServiceBaseV2 + "documents/clone-document";
        documentFactory.RESTAPI.getPlaintiff = globalConstants.intakeServiceBase + "plaintiff/get-plaintiff-details/intake/";
        documentFactory.RESTAPI.linkDocument = globalConstants.webServiceBase + "lexviadocuments/linkdocument"; // US#8255 
        // US:16596 DocuSign
        documentFactory.RESTAPI.createEnvelopUrl = globalConstants.javaWebServiceBaseV4 + "cloudlex-docusign/create-envelop";
        documentFactory.RESTAPI.docSearchUrl = globalConstants.intakeServiceBase + "documents/documentslimit?";
        return documentFactory;
    }]);