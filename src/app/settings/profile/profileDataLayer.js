(function() {
    'use strict';

    angular.module('cloudlex.settings')
        .factory('profileDataLayer', profileDataLayer);

    profileDataLayer.$inject = ['$q', '$http', 'globalConstants'];

    function profileDataLayer($q, $http, globalConstants) {

        var baseUrl = globalConstants.webServiceBase;
        var getViewProfileUrl = baseUrl + 'lexvia_users/users_info.json';
        var saveProfileUrl = baseUrl + 'lexvia_users/users_info/';

        var configGoogleCalenderUrl = baseUrl + 'modulesubscription/configuregcalendar';
        var getConfigGoogleCalenderUrl = baseUrl + 'modulesubscription/configuregcalendar?';

        var configGoogleDriveUrl = baseUrl + 'modulesubscription/configuregdrive';
        var getConfigGoogleDriveUrl = baseUrl + 'modulesubscription/configuregdrive?';

        var configOneDriveUrl = baseUrl + 'modulesubscription/configureonedrive';
        var getConfigOneDriveUrl = baseUrl + 'modulesubscription/configureonedrive?';

        // US:16596 Config DocuSign
        var configDocuSignUrl = globalConstants.javaWebServiceBaseV4 + 'cloudlex-docusign';
        var getConfigDocuSignUrl = globalConstants.javaWebServiceBaseV4 + 'cloudlex-docusign?';
        var revokeDocuSignURL = globalConstants.javaWebServiceBaseV4 + 'cloudlex-docusign/revoke';

        //US16929 : Config Expense Manager (Quickbooks integration)
        var configExpenseManagerUrl = globalConstants.javaWebServiceBaseV4 + 'quickbook';
        var getConfigExpenseManagerUrl = globalConstants.javaWebServiceBaseV4 + 'quickbook?';
        var revokeExpenseManagerURL = globalConstants.javaWebServiceBaseV4 + 'quickbook/revoke';


        //us#6841 MS Exchange added
        var configMsExchangeUrl = baseUrl + 'modulesubscription/configuremsexchange';
        var getConfigMsExchangeUrl = baseUrl + 'modulesubscription/configuremsexchange?';
        var revokeMsExchangeURL = baseUrl + 'modulesubscription/revokemsexchange';

        var configDropboxUrl = baseUrl + 'modulesubscription/configuredropbox';
        var getConfigDropboxUrl = baseUrl + 'modulesubscription/configuredropbox?';
        var revokeGooglecalenderURL = baseUrl + 'modulesubscription/revokegcalendar';
        var revokeGoogleDriveURL = baseUrl + 'modulesubscription/revokegdrive';
        var revokeOneDriveURL = baseUrl + 'modulesubscription/revokeonedrive';
        var iCalLinkUrl = baseUrl + 'modulesubscription/getIcalurlforuser.json';




        return {
            getViewProfileData: getViewProfileData,
            saveProfileData: saveProfileData,

            callGooglecalender: callGooglecalender,
            getConfigGoogleCal: getConfigGoogleCal,

            callGoogleDrive: callGoogleDrive,
            getConfigGoogleDrive: getConfigGoogleDrive,


            callOneDrive: callOneDrive,
            getConfigOneDrive: getConfigOneDrive,

            callMsExchange: callMsExchange,
            getConfigMsExchange: getConfigMsExchange,

            callDropbox: callDropbox,
            getConfigDrpbox: getConfigDrpbox,

            // US:16596 Config DocuSign
            callDocuSign: callDocuSign,
            getConfigDocuSign: getConfigDocuSign,
            revokeDocuSign: revokeDocuSign,

            //US16929 : Config Expense Manager (Quickbooks integration)
            callExpenseManger: callExpenseManger,
            getConfigExpenseManage: getConfigExpenseManage,
            revokeExpenseManage: revokeExpenseManage,


            revokeGooglecalender: revokeGooglecalender,
            revokeGoogleDrive: revokeGoogleDrive,
            revokeMsExchange: revokeMsExchange,
            revokeOneDrive: revokeOneDrive,

            getIcalLink: getIcalLink

        }

        function getViewProfileData() {
            var url;
            url = getViewProfileUrl;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                sessionStorage.setItem('DocuSignConfigure', response[0].docusign);
                deferred.resolve(response);
            });
            return deferred.promise;

        }

        function saveProfileData(postData, uid) {
            var url = saveProfileUrl;
            url = url + uid + ".json";
            return $http.put(url, postData);
        }

        function getIcalLink() {
            var url = iCalLinkUrl;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }

        //US6841 

        function callMsExchange() {
            var url = configMsExchangeUrl;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }

        function getConfigMsExchange(acToken) {
            var url = getConfigMsExchangeUrl + acToken;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }

        function revokeMsExchange() {
            var url = revokeMsExchangeURL;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }
        //...end

        function callGoogleDrive() {
            var url = configGoogleDriveUrl;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }

        function getConfigGoogleDrive(acToken) {
            var url = getConfigGoogleDriveUrl + acToken;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }



        function revokeGoogleDrive() {
            var url = revokeGoogleDriveURL;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }

        function callOneDrive() {
            var url = configOneDriveUrl;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }

        function getConfigOneDrive(acToken) {
            var url = getConfigOneDriveUrl + acToken;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }



        function revokeOneDrive() {
            var url = revokeOneDriveURL;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }

        // US:16596 Config DocuSign
        function callDocuSign() {
            var url = configDocuSignUrl;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }

        function getConfigDocuSign(acToken) {
            var url = getConfigDocuSignUrl + acToken;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }

        function revokeDocuSign() {
            var url = revokeDocuSignURL;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }

        // US:16596 Config DocuSign
        function callExpenseManger() {
            var url = configExpenseManagerUrl;
            return $http.get(url);
        }

        function getConfigExpenseManage(acToken) {
            var url = getConfigExpenseManagerUrl + acToken;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }


        function revokeExpenseManage() {
            var deferred = $q.defer();
            var url = revokeExpenseManagerURL;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "POST",
                data: null,
                headers: token
            }).success(function(response, status) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }
        ///


        function callGooglecalender() {
            var url = configGoogleCalenderUrl;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }

        function getConfigGoogleCal(acToken) {
            var url = getConfigGoogleCalenderUrl + acToken;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }


        function revokeGooglecalender() {
            var url = revokeGooglecalenderURL;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }

        function callDropbox() {
            var url = configDropboxUrl;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }

        //    function getConfigDrpbox(acToken) {
        //     var url = getConfigDropboxUrl + acToken;
        //     return $http.get(url);
        // }
        function getConfigDrpbox(acToken) {
            var url = getConfigDropboxUrl + acToken;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                deferred.resolve(ee);
            });
            return deferred.promise;
        }
        //  function getConfigGoogleCal(acToken) {
        //     var url = getConfigGoogleCalenderUrl + acToken;
        //     return $http.get(url);
        // }
    }
})();