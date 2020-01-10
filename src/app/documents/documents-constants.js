angular.module('cloudlex.documents')
    .factory('documentsConstants', ['globalConstants', function(globalConstants) {

        var documentFactory = {};
        documentFactory.RESTAPI = {};
        documentFactory.RESTAPI.documentPlaintiffs = globalConstants.webServiceBase + "allparties/getPlaintiffLimited/";
        documentFactory.RESTAPI.uploadDocument = globalConstants.webServiceBase + "lexviadocuments/documents.json";
        documentFactory.RESTAPI.getDocumentList = globalConstants.javaWebServiceBaseV1 + "lexviadocuments/documentslimit?";
        documentFactory.RESTAPI.keepsessionalive = globalConstants.webServiceBase + 'lexviadocuments/keepsessionalive.json';
        documentFactory.RESTAPI.getOfficeStatus = globalConstants.webServiceBase + "modulesubscription/subscription.json";
        documentFactory.RESTAPI.fileExists = globalConstants.webServiceBase + "lexviadocuments/file_exists/[ID]";
        documentFactory.RESTAPI.getDocumentDetails = globalConstants.webServiceBase + "lexviadocuments/documentdetails/";
        documentFactory.RESTAPI.cloneSourceDocument = globalConstants.webServiceBase + "lexviadocuments/duplicatedocument";
        documentFactory.RESTAPI.linkDocument = globalConstants.webServiceBase + "lexviadocuments/linkdocument"; // US#8255 
        
        //OFF-Drupal Document module
        documentFactory.RESTAPI.getDocumentList1 = globalConstants.javaWebServiceBaseV4 + "documents?";
        documentFactory.RESTAPI.uploadDocument1 = globalConstants.javaWebServiceBaseV4 + "documents";
        documentFactory.RESTAPI.getSingleDoc1 = globalConstants.javaWebServiceBaseV4 + "documents/";
        documentFactory.RESTAPI.updateDocument1 = globalConstants.javaWebServiceBaseV4 + "documents/";
        documentFactory.RESTAPI.deleteDocument1 = globalConstants.javaWebServiceBaseV4 + "documents/delete?docids=";
        documentFactory.RESTAPI.getDocumentDetails1 = globalConstants.javaWebServiceBaseV4 + "documents/";//1
        documentFactory.RESTAPI.downloadDocument1 = globalConstants.javaWebServiceBaseV4 + "documents/download/";
        documentFactory.RESTAPI.linkDocument1 = globalConstants.javaWebServiceBaseV4 + "documents";    //off-drupal link document
        documentFactory.RESTAPI.wopiUrl1 = globalConstants.javaWebServiceBaseV4 + "[type]/wopi/files/"; 
        documentFactory.RESTAPI.discoveryUrl1 = globalConstants.javaWebServiceBaseV4 + "wopi/discoveryDetails";
        documentFactory.RESTAPI.viewDocument1 = globalConstants.javaWebServiceBaseV4 + "documents/view/";   //off-drupal VIEW DOCUMENT
        documentFactory.RESTAPI.getTags1 = globalConstants.javaWebServiceBaseV4 + "documents/tags";
        documentFactory.RESTAPI.docSearchUrl = globalConstants.javaWebServiceBaseV4 + "documents?";

        // US:16596 DocuSign
        documentFactory.RESTAPI.createEnvelopUrl = globalConstants.javaWebServiceBaseV4 + "cloudlex-docusign/create-envelop";
        //Matter-Collaboration
        documentFactory.RESTAPI.savePermission = globalConstants.webServiceBase + "Cloudlex-Lite/v1/lite/disable-entity-access";

        return documentFactory;
    }]);
