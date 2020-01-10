angular.module('cloudlex.user').factory('loginConstants', ['globalConstants', function (globalConstants) {

    var loginConstants = {};

    loginConstants.RESTAPI = {};
    loginConstants.RESTAPI.authenticate = globalConstants.webServiceBase + "services/user/login";
    loginConstants.RESTAPI.token = globalConstants.webServiceBase + "services/session/token";
    //loginConstants.RESTAPI.logoutUser = globalConstants.webServiceBase + "user/logout";
    loginConstants.RESTAPI.logoutUser = globalConstants.webServiceBase + "services/user/logout";
    loginConstants.RESTAPI.userRole = globalConstants.webServiceBase + 'practice / user_role';
    loginConstants.RESTAPI.userDetails = globalConstants.javaWebServiceBaseV1 + 'login/details';
    loginConstants.RESTAPI.javaLogin = globalConstants.javaWebServiceBaseV1 + 'login/userLogin'; // login service API call with JAVA
    loginConstants.RESTAPI.refreshToken = globalConstants.javaWebServiceBaseV1 + 'login/reissueToken'; // refresh token service API call with JAVA
    // Off drupal refresh api
    loginConstants.RESTAPI.refreshToken1 = globalConstants.javaWebServiceBaseV5 + 'login/reissue-token';
    // Off drupal LOGIN API
    loginConstants.RESTAPI.javaLogin1 = globalConstants.javaWebServiceBaseV5 + 'login/user-login';
    // Off drupal Logout aoi
    loginConstants.RESTAPI.logoutUser1 = globalConstants.javaWebServiceBaseV5 + "login/user-logout";
    return loginConstants;

}]);
