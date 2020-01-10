/* Mailbox constants */
angular.module('cloudlex.mailbox_java')
    .factory('mailboxConstantsV2', ['globalConstants', function (globalConstants) {

        var mailboxFactory = {};
        mailboxFactory.RESTAPI = {};
        mailboxFactory.RESTAPI.getInbox = globalConstants.javaWebServiceBaseV1 + "email/getReceivedEmails";
        mailboxFactory.RESTAPI.getSent = globalConstants.javaWebServiceBaseV1 + "email/getSentEmails";
        mailboxFactory.RESTAPI.getDraft = globalConstants.javaWebServiceBaseV1 + "email/getDraftEmails";
        mailboxFactory.RESTAPI.deleteMail = globalConstants.javaWebServiceBaseV1 + "email/deleteEmail";
        mailboxFactory.RESTAPI.mailThread = globalConstants.javaWebServiceBaseV1 + "email/getEmailThread";
        mailboxFactory.RESTAPI.noteThread = globalConstants.javaWebServiceBaseV1 + "email/getEmailNote";
        mailboxFactory.RESTAPI.sentMailThread = globalConstants.javaWebServiceBaseV1 + "email/getEmail";
        mailboxFactory.RESTAPI.getFirmUsers = globalConstants.webServiceBase + "matter/allusers_for_matter/1.json?from=mail";
        mailboxFactory.RESTAPI.getContacts = globalConstants.webServiceBase + "lexviacontacts/GetContactlimit.json?fname=";
        // mailboxFactory.RESTAPI.getRecipients = globalConstants.webServiceBase + "mail/getrecipientslist/";  
        mailboxFactory.RESTAPI.getRecipients = globalConstants.javaWebServiceBaseV1 + "email/replyHeader";
        mailboxFactory.RESTAPI.addAttachment = globalConstants.webServiceBase + "lexviafiles/lexviafiles";
        mailboxFactory.RESTAPI.sendEmail = globalConstants.javaWebServiceBaseV1 + "email/sendEmail";
        mailboxFactory.RESTAPI.draftEmail = globalConstants.javaWebServiceBaseV1 + "email/saveDraft";
        mailboxFactory.RESTAPI.deleteBlob = globalConstants.webServiceBase + "lexviafiles/deleteblob?folder=mailbox";
        //mailboxFactory.RESTAPI.downloadBlob  = globalConstants.webServiceBase + "lexviafiles/getsharedaccess?folder=mailbox";
        mailboxFactory.RESTAPI.downloadBlob = globalConstants.javaWebServiceBaseV1 + "email/getAttachment";
        mailboxFactory.RESTAPI.getEmailSignature = globalConstants.webServiceBase + "modulesubscription/emailsignature.json";
        mailboxFactory.RESTAPI.getdocumentsize = globalConstants.webServiceBase + "lexviafiles/getdocumentsize"; //US#7824
        mailboxFactory.RESTAPI.profilePic = globalConstants.webServiceBase + "azure/remote/userpictures/styles/thumbnail/userpictures";
        return mailboxFactory.RESTAPI;
    }]);
