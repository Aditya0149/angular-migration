(function () {
    'use strict';

    angular
        .module('cloudlex.firms')
        .factory('firmsDataService', firmsDataService);

    firmsDataService.$inject = ["$http", "globalConstants"];

    function firmsDataService($http, globalConstants) {

        var serviceBase = {};
        //API URL Constants
        serviceBase.GET_FIRMS = globalConstants.webServiceBase + "practice/getAllFirmList.json";
        serviceBase.PROCEED_URL = globalConstants.webServiceBase + "lexviafirmselection/lexviafirmselection";

        var firms = {
            getAllFirms: getAllFirms,
            saveAndProceed: saveAndProceed
        };

        return firms;

        // Get all the firms
        function getAllFirms() {
            return $http.get(serviceBase.GET_FIRMS);
        }

        // save and proceed
        function saveAndProceed(firmId) {
            return $http.post(serviceBase.PROCEED_URL, { "firmid": firmId });
        }

    }

})();