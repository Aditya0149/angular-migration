(function () {
    'use strict';

    angular.module('cloudlex.marketplace')
        .factory('applicationsDataLayer', applicationsDataLayer);

    applicationsDataLayer.$inject = ['$q', '$http', 'globalConstants'];

    function applicationsDataLayer($q, $http, globalConstants) {

        var baseUrl = globalConstants.webServiceBase;

        var saveProfileUrl = baseUrl + 'marketplace/appsubscription';
        var applcationsUrl = baseUrl + 'marketplace/appsubscription.json';
        var servicesUrl = baseUrl + 'modulesubscription/subscription';
        var officeOnlinePay = baseUrl + 'marketplace/subscription_payment';



        return {
            getConfigurableData: _getConfigurableData,
            saveServicesData: saveServicesData,
            saveProfileData: saveProfileData,
            confirm: _confirm,
            savePlan: savePlan
        }

        function savePlan(putData) {
            var url = saveProfileUrl + "/1";
            return $http.put(url, putData);
        }

        function _getConfigurableData() {
            var url;
            url = applcationsUrl;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function (response) {
                deferred.resolve(response);
            });
            return deferred.promise;

        }

        function _confirm(postData) {
            var url = officeOnlinePay;
            return $http.post(url, postData);
        }

        function saveProfileData(postData) {
            var url = saveProfileUrl;
            return $http.post(url, postData);
        }

        function saveServicesData(postData) {
            var url = servicesUrl;
            return $http.post(url, postData);
        }


    }
})();