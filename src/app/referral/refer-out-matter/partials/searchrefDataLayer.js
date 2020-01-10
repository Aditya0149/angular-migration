(function (angular) {

    angular
        .module('cloudlex.referral')
        .factory('searchRefDatalayer', searchRefDatalayer)

    searchRefDatalayer.$inject = ['$http', 'globalConstants'];

    function searchRefDatalayer($http, globalConstants) {

        var searchUrl = globalConstants.webServiceBase + 'lexvia_referral/referral_search?';
        var saveSearchUrl = globalConstants.webServiceBase + 'lexvia_search/search';
        var inviteNewUrl = globalConstants.webServiceBase + 'lexvia_referral/send_invite';
        var deleteSearchUrl = globalConstants.webServiceBase + '/lexvia_search/search/';

        return {
            search: _search,
            saveSearch: _saveSearch,
            deleteSearch: _deleteSearch,
            inviteNewContact: _inviteNewContact
        }

        function _search(searchString, searchParam) {
            var param = searchParam;

            var url = searchUrl + 'searchType=' + param + '&searchKey=' + encodeURIComponent(searchString);
            return $http.get(url);
        }

        function _saveSearch(searchObj) {
            var url = saveSearchUrl;
            return $http.post(url, searchObj);
        }

        function _inviteNewContact(postObj) {
            var url = inviteNewUrl;
            return $http.post(url, postObj);
        }



        function _deleteSearch(id) {
            var url = deleteSearchUrl + id;
            return $http.delete(url);
        }
    }

})(angular)