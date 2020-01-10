/* Mailbox constants */
angular.module('cloudlex.mailbox')
    .factory('mailboxConstants', ['globalConstants', function (globalConstants) {

        var mailboxFactory = {};
        mailboxFactory.RESTAPI = {};
        mailboxFactory.RESTAPI.getInbox = globalConstants.webServiceBase + "mail/inboxmail.json";
        mailboxFactory.RESTAPI.getSent = globalConstants.webServiceBase + "mail/sentmail.json";
        mailboxFactory.RESTAPI.getDraft = globalConstants.webServiceBase + "mail/draftmail.json";
        mailboxFactory.RESTAPI.deleteMail = globalConstants.webServiceBase + "mail/deletemails/";
        mailboxFactory.RESTAPI.mailThread = globalConstants.webServiceBase + "mail/mail/";
        mailboxFactory.RESTAPI.getFirmUsers = globalConstants.webServiceBase + "matter/allusers_for_matter/1.json?from=mail";
        mailboxFactory.RESTAPI.getContacts = globalConstants.webServiceBase + "lexviacontacts/GetContactlimit.json?fname=";
        mailboxFactory.RESTAPI.getRecipients = globalConstants.webServiceBase + "mail/getrecipientslist/";
        mailboxFactory.RESTAPI.addAttachment = globalConstants.webServiceBase + "lexviafiles/lexviafiles";
        mailboxFactory.RESTAPI.sendEmail = globalConstants.webServiceBase + "mail/mail.json";
        mailboxFactory.RESTAPI.draftEmail = globalConstants.webServiceBase + "mail/mail/";
        mailboxFactory.RESTAPI.deleteBlob = globalConstants.webServiceBase + "lexviafiles/deleteblob?folder=mailbox";
        //mailboxFactory.RESTAPI.downloadBlob  = globalConstants.webServiceBase + "lexviafiles/getsharedaccess?folder=mailbox";
        mailboxFactory.RESTAPI.downloadBlob = globalConstants.javaWebServiceBaseV4 + "documents/download/";
        mailboxFactory.RESTAPI.getEmailSignature = globalConstants.webServiceBase + "modulesubscription/emailsignature.json";
        mailboxFactory.RESTAPI.getdocumentsize = globalConstants.webServiceBase + "lexviafiles/getdocumentsize"; //US#7824
        return mailboxFactory.RESTAPI;
    }]);
