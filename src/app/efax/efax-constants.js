/* Mailbox constants */
angular.module('cloudlex.efax')
    .factory('efaxConstants', ['globalConstants', function (globalConstants) {

        var eFaxFactory = {};
        eFaxFactory.RESTAPI = {};

        // New Java End Points 
        eFaxFactory.RESTAPI.getSent = globalConstants.javaWebServiceBaseV1 + "fax/sentList";
        eFaxFactory.RESTAPI.sendEmail = globalConstants.javaWebServiceBaseV1 + "fax/composeFax";
        eFaxFactory.RESTAPI.addAttachment = globalConstants.javaWebServiceBaseV1 + "fax/uploadFiles";
        // Fax Attachment - Off Drupal
        eFaxFactory.RESTAPI.addAttachment1 = globalConstants.javaWebServiceBaseV4 + "fax/attachment";
        eFaxFactory.RESTAPI.mailThread = globalConstants.javaWebServiceBaseV1 + "fax/faxInfo";
        // Get Fax Thread - Off Drupal 
        eFaxFactory.RESTAPI.mailThread1 = globalConstants.javaWebServiceBaseV4 + "fax";
        eFaxFactory.RESTAPI.downloadBlob = globalConstants.javaWebServiceBaseV1 + "fax/downloadFiles";


        // PHP End points
        eFaxFactory.RESTAPI.getFirmUsers = globalConstants.webServiceBase + "matter/allusers_for_matter/1.json?from=mail";
        eFaxFactory.RESTAPI.getContacts = globalConstants.webServiceBase + "lexviacontacts/GetContactlimit.json?fname=";
        eFaxFactory.RESTAPI.getRecipients = globalConstants.webServiceBase + "mail/getrecipientslist/";
        eFaxFactory.RESTAPI.getEmailSignature = globalConstants.webServiceBase + "modulesubscription/emailsignature.json";
        eFaxFactory.RESTAPI.getdocumentsize = globalConstants.webServiceBase + "lexviafiles/getdocumentsize"; //US#7824

        // Drupal off
        eFaxFactory.RESTAPI.getSent1 = globalConstants.javaWebServiceBaseV4 + "fax";
        eFaxFactory.RESTAPI.downloadBlob1 = globalConstants.javaWebServiceBaseV4 + "fax/download";
        eFaxFactory.RESTAPI.sendEmail1 = globalConstants.javaWebServiceBaseV4 + "fax";


        return eFaxFactory.RESTAPI;


    }]);
