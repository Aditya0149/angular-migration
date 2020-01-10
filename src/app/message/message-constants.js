angular.module('cloudlex.message')
    .factory('messageConstants', ['globalConstants', function (globalConstants) {

        var messageFactory = {};
        messageFactory.RESTAPI = {};
        messageFactory.RESTAPI.saveMessage = globalConstants.webServiceBase + "practice/save_messaging.json";
        messageFactory.RESTAPI.getMessages = globalConstants.javaWebServiceBaseV1 + "user/messageDetails/";
        messageFactory.RESTAPI.getNotificationMessagesList = globalConstants.webServiceBase + 'notification/notification_messaging.json';
        messageFactory.RESTAPI.deleteMessageNotification = globalConstants.webServiceBase + 'practice/delete_notify/';
        messageFactory.RESTAPI.getMatterPlaintiffs = globalConstants.webServiceBase + "allparties/plaintiffs/";
        messageFactory.RESTAPI.sendSMS = globalConstants.webServiceBase + "sms_integration/sms";
        //    messageFactory.RESTAPI.getSearchMessages = globalConstants.webServiceBase + "practice/search_matter.json";

        //Start:  Group-Chat-Message Client-Portal
        messageFactory.RESTAPI.createNewGroupUrl = globalConstants.javaWebServiceBaseV4 + "message/create-new-group";
        messageFactory.RESTAPI.getGroupsByMatterIdUrl = globalConstants.javaWebServiceBaseV4 + "message/group-details/";
        messageFactory.RESTAPI.updateUserDetailsUrl = globalConstants.javaWebServiceBaseV4 + "message/update-user-details";
        messageFactory.RESTAPI.getMessageNotificationUrl = globalConstants.javaWebServiceBaseV4 + "message/get-notification";
        messageFactory.RESTAPI.getAllConversationHistoryUrl = globalConstants.javaWebServiceBaseV4 + "message/all-Conversation/";
        messageFactory.RESTAPI.getMatterPlaintiffsForMessageUrl = globalConstants.javaWebServiceBaseV4 + "message/plaintiffs/";
        messageFactory.RESTAPI.openWebSocketUrl = globalConstants.webSocketServiceBase1 + "CloudlexMessenger/serverendpoint/";
        //End:  Group-Chat-Message Client-Portal

        return messageFactory;
    }]);
