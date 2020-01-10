(function (constants) {
	/*
	To change the environment to either of QA or DEMO, UNCOMMENT the lines with the required environment 
	and COMMENT the lines which have the unrequired environment.
	*/

    constants.env = "https://qa.cloudlex.com/"; //QA
    //constants.env = "https://stage.cloudlex.net/";
    //constants.env = "https://demoapi.cloudlex.net/"; // DEMO

    constants.javaWebServiceBaseV1 = "Java_Authentication/webapi/v1/";
    constants.javaWebServiceBaseV2 = "Java_Authentication/webapi/v2/";
    constants.javaWebServiceBaseV4 = "Matter-Manager/v1/";
    constants.javaWebServiceBaseV5 = "Matter-Manager/v2/";
    constants.zohoSignUp1 = "Matter-Manager/v1/zoho/signup";
    constants.webSocketServiceBase = "wss://qa.cloudlex.com/";
    constants.webServiceRedirectUrl = "https://qa.app.cloudlex.com/";
    //constants.webServiceRedirectUrl = "https://localhost:9000/";
    //constants.serviceWorkerUrl = "https://localhost:9000/";
    constants.serviceWorkerUrl = "https://qa.app.cloudlex.com/";
    constants.site_logo = 'https://qa.app.cloudlex.com/styles/images/logo.png';
    constants.images_path = 'https://qa.app.cloudlex.com/styles/images/';
    constants.createFirmRecaptcha = '6LdAcT8UAAAAAK9fNiyLXXL5TW_dTCJTdMGI1u1z';
    constants.webSocketServiceEnable = true;
    constants.azureSearchServiceEnable = true;
    constants.isIntakeKeywordSearchEnable = true;
    constants.sidebarSMSTimeDifference = [0, 5];

    var buster = new Date().getTime();
    var plugin = "https://lexviav2staging.blob.core.windows.net/stgtemp/"
    constants.downloadOfficeConnectorURL = plugin + "CloudLex%20Word%20Connector.exe?v="+buster;
    constants.downloadOutlookConnectorURL = plugin + "CloudLex%20Outlook%20Connector.exe?v="+buster;
    constants.downloadOfficeConnectorURLforMAC = plugin + "wordplugin/WordForMac/PublishOutput/Word-Connector.app.zip?v="+buster;

    constants.intakeServiceBase = "Cloudlex_Intake/webapi/v1/intake/";
    constants.intakeServiceBaseV2 = "Intake-Manager/v1/";
    constants.hideSMS = false;

    // Azure API Management
    //var apimBase = 'https://cloudlexqa.azure-api.net/' //NOT TO BE USED
    // var apimBase = 'https://api2.cloudlex.net/' //NOT TO BE USED
    var apimBase = 'https://qa2.cloudlex.net/'  //QA
    //var apimBase = 'https://demoapi2.cloudlex.net/' //DEMO
    constants.intakeBase = apimBase + 'Intake-Manager/';
    constants.matterBase = apimBase + 'Matter-Manager/';
     //constants.Ocp_Apim_Subscription_Key = 'a5e823294ec74db5a95c0ea810528467' //DEMO
    constants.Ocp_Apim_Subscription_Key = 'b14824168b174afa942ae9e509a6ad4c'; //QA
    //constants.Ocp_Apim_Subscription_Key = '8e695442df4341808c59bf84029c71d6'; //NOT TO BE USED
    constants.useApim = true;

    // SignalR
    // constants.signalrUrl = apimBase + 'Signalr-Notification-Negotiater-Demo?hub=' //DEMO
    // constants.signalrUrl = apimBase + 'Signalr-Notification-Negotiater-Stag?hub=' //STAG
    // constants.signalrUrl = apimBase + 'SignalR-Notification-Negotiater-Prod?hub=' //PRODUCTION
    constants.signalrUrl = apimBase + 'signalr-notification-negotiater?hub='; //QA
    constants.useSignalr = true;
    constants.autoLogoutTime = 7200;
})(window.clxAppConstants = {});
