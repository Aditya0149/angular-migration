(function () {

    angular
        .module('cloudlex.expense')
        .factory('expenseMangerDatalayer', expenseMangerDatalayer);


    expenseMangerDatalayer.$inject = ['$http', 'globalConstants', '$modal', '$q'];

    function expenseMangerDatalayer($http, globalConstants, $modal, $q) {

        function getParams(params) {
            var querystring = "";
            angular.forEach(params, function (value, key) {
                querystring += key + "=" + value;
                querystring += "&";
            });
            return querystring.slice(0, querystring.length - 1);
        }

        var javaBaseUrl = globalConstants.javaWebServiceBaseV4;
        var baseUrl = globalConstants.webServiceBase;

        var getDropdownDataUrl = globalConstants.javaWebServiceBaseV4 + 'quickbook/dropdowns';
        var getExpenseNewRecordUrl = globalConstants.javaWebServiceBaseV4 + 'expense_manager/expense';
        var proceedToExpenseDataUrl = globalConstants.javaWebServiceBaseV4 + 'quickbook/saveExpense';


        return {
            getDropdownData: _getDropdownData,
            getExpenseNewRecord: _getExpenseNewRecord,
            proceedToExpenseData: _proceedToExpenseData

        }


        function _getDropdownData() {
            var url;
            url = getDropdownDataUrl;
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

        function _getExpenseNewRecord(filter) {
            var url;
            url = getExpenseNewRecordUrl + '?' + getParams(filter);;
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

        function _proceedToExpenseData(obj, expenseId) {
            var deferred = $q.defer();
            $http({
                url: proceedToExpenseDataUrl + '/' + expenseId,
                method: "POST",
                withCredentials: true,
                data: obj
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                ee.status = status;
                deferred.reject(ee);
            });
            return deferred.promise;
        }


    }

})();