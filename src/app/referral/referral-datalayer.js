(function (angular) {

    angular
        .module('cloudlex.referral')
        .factory('referralDatalayer', referralDatalayer);

    referralDatalayer.$inject = ['$http', 'globalConstants'];
    function referralDatalayer($http, globalConstants) {

        var restUrl = {
            getReferredOutUrl: globalConstants.webServiceBase + 'lexvia_referral/ref_out_matters/?',
            getReferredInUrl: globalConstants.webServiceBase + 'lexvia_referral/ref_in_matters/?',
            referOutMatterUrl: globalConstants.webServiceBase + 'lexvia_referral/ref_out_matters',
            matterInfoUrl: globalConstants.webServiceBase + 'matter/matter_index_edit/',
            statusCount: globalConstants.webServiceBase + 'lexvia_referral/status_count/?which=',
            cancelResend: globalConstants.webServiceBase + 'lexvia_referral/ref_out_matters/'
        };

        return {
            referOut: _referOut,
            getReferredOutMatters: _getReferredOutMatters,
            getReferredInMatters: _getReferredInMatters,
            getMatterInfo: _getMatterInfo,
            getStatusCounts: _getStatusCounts,
            cancelResendReferral: _cancelResendReferral,
        };

        function _referOut(info) {
            var url = restUrl.referOutMatterUrl;
            return $http.post(url, info);
        }

        function _getReferredOutMatters(status, paginationParams) {
            var url = restUrl.getReferredOutUrl + 'status_id=' + status.id + '&is_m=' + (status.isMatterStatus === true ? '1' : '0');
            url += '&' + utils.getParams(paginationParams);
            return $http.get(url);
        }

        function _getReferredInMatters(status, paginationParams) {
            var url = restUrl.getReferredInUrl + 'status_id=' + status.id + '&is_m=' + (status.isMatterStatus === true ? '1' : '0');
            url += '&' + utils.getParams(paginationParams);
            return $http.get(url);
        }

        function _getMatterInfo(matterId) {
            var url = restUrl.matterInfoUrl + matterId;
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