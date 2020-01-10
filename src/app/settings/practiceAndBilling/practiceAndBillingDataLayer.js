angular.module('cloudlex.settings')
    .factory('practiceAndBillingDataLayer', practiceAndBillingDataLayer);

practiceAndBillingDataLayer.$inject = ['$q', '$http', 'globalConstants', 'masterData'];

function practiceAndBillingDataLayer($q, $http, globalConstants, masterData) {

    var baseUrl = globalConstants.webServiceBase;
    var getPractiseAndBillInfoUrl = baseUrl + 'practice/practice.json';
    var saveUrl = baseUrl + 'practice/practice';
    var getPlanSubscriptionUrl = baseUrl + 'packagesubscription/plansubscription';
    var savePackageSubscriptionUrl = baseUrl + 'modulesubscription/subscription';
    var getConfigurableDataUrl = baseUrl + 'modulesubscription/subscription.json';
    var planDetails;


    function getParams(params) {
        var querystring = "";
        angular.forEach(params, function (value, key) {
            querystring += key + "=" + value;
            querystring += "&";
        });
        return querystring.slice(0, querystring.length - 1);
    }

    return {
        getPracBillDetails: getPracBillDetails,
        savePracAndBillDetails: savePracAndBillDetails,
        getPackageSubscripDetails: getPackageSubscripDetails,
        savePackageSubscriptionDetails: savePackageSubscriptionDetails,
        getConfigurableData: getConfigurableData,
        getPlanDetails: getPlanDetails
    }

    function getPackageSubscripDetails() {
        var url = getPlanSubscriptionUrl;
        var deferred = $q.defer();
        $http({
            url: url,
            method: "GET",
            withCredentials: true
        }).success(function (response) {
            planDetails = response;
            deferred.resolve(response);
        });
        return deferred.promise;
    }

    function getPlanDetails() {
        return planDetails;
    }

    function getConfigurableData() {
        var url = getConfigurableDataUrl;
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

    function savePackageSubscriptionDetails(postData) {
        var url = savePackageSubscriptionUrl;
        url = url;
        return $http.post(url, postData);
    }

    function getPracBillDetails() {
        var url;
        url = getPractiseAndBillInfoUrl;
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

    function savePracAndBillDetails(postData) {
        var role = masterData.getUserRole();
        var url = saveUrl + '/' + role.firm_id;
        return $http.put(url, postData);
    }
}