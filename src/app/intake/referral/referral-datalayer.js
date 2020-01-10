(function (angular) {

    angular
        .module('intake.referral')
        .factory('referralIntakeDatalayer', referralIntakeDatalayer);

    referralIntakeDatalayer.$inject = ['$http', 'globalConstants'];
    function referralIntakeDatalayer($http, globalConstants) {

        var restUrl = {
            getReferredOutUrl: globalConstants.webServiceBase + 'lexvia_referral/ref_out_matters/?',
            getReferredInUrl: globalConstants.webServiceBase + 'lexvia_referral/ref_in_intakes/?',
            referOutMatterUrl: globalConstants.webServiceBase + 'lexvia_referral/ref_out_intakes',
            statusCount: globalConstants.webServiceBase + 'lexvia_referral/intake_status_count/?which=',
            cancelResend: globalConstants.webServiceBase + 'lexvia_referral/ref_out_intakes/'
        };

        return {
            referOut: _referOut,
            getReferredOutMatters: _getReferredOutMatters,
            getReferredInMatters: _getReferredInMatters,
            getStatusCounts: _getStatusCounts,
            cancelResendReferral: _cancelResendReferral,
        };

        function _referOut(info) {
            var url = restUrl.referOutMatterUrl;
            return $http.post(url, info);
        }



        function _getReferredOutMatters(status, paginationParams) {
            var url = restUrl.referOutMatterUrl + '/?' + 'status_id=' + status.id + '&is_m=' + (status.isIntakeStatus === true ? '1' : '0');
            url += '&' + utils.getParams(paginationParams);
            return $http.get(url);
        }



        function _getReferredInMatters(status, paginationParams) {
            var url = restUrl.getReferredInUrl + 'status_id=' + status.id + '&is_m=' + (status.isIntakeStatus === true ? '1' : '0');
            url += '&' + utils.getParams(paginationParams);
            return $http.get(url);
        }

        function _getStatusCounts(tab) {
            var which = tab === 'referred in' ? 'in' : 'out';
            var url = restUrl.statusCount + which;
            return $http.get(url);
        }



        function _cancelResendReferral(actionObj) {
            var url = restUrl.cancelResend + actionObj.id;
            return $http.put(url, actionObj);
        }


    }

})(angular);