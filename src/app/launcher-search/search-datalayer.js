(function (angular) {

    angular
        .module('cloudlex.launcherSearch')
        .factory('launcherSearchDatalayer', launcherSearchDatalayer)

    launcherSearchDatalayer.$inject = ['$http', 'globalConstants', '$q', '$rootScope'];

    function launcherSearchDatalayer($http, globalConstants, $q, $rootScope) {

        var searchUrl = globalConstants.webServiceBase + 'lexvia_search/search.json?';
        //Off-Drupal
        if (!globalConstants.useApim) {
            var searchUrl1 = globalConstants.javaWebServiceBaseV4 + 'contact/contact-search?';
        } else {
            var searchUrl1 = globalConstants.matterBase + 'contact/v1/contact-search?';
        }
        //var searchUrl = globalConstants.webServiceBase + 'Matter_Manager/webapi/v1/search?';
        var saveSearchUrl = globalConstants.webServiceBase + 'lexvia_search/search';
        var getSavedSearchesUrl = globalConstants.webServiceBase + '/lexvia_search/getsearches.json?for=svdsrch';
        var deleteSearchUrl = globalConstants.webServiceBase + '/lexvia_search/search/';
        var docSearchUrl = globalConstants.javaWebServiceBaseV4 + "globalsearch?";
        return {
            search: _search,
            search1: _search1,
            saveSearch: _saveSearch,
            getSavedSearches: _getSavedSearches,
            deleteSearch: _deleteSearch,
            searchJava: _searchJava
        }

        function _search(searchString, searchParam, includeArchived) {
            var param = searchParam;
            if (param === "task_event") {
                param = "task,events";
            }

            var url = searchUrl + 'searchType=' + param + '&srch=' + encodeURIComponent(searchString);// + '&isArchive=1';
            if (param == "matters") {
                if (includeArchived == 0 || includeArchived == 1) {
                    url = url + "&includeArchived=" + includeArchived;
                }
            }

            return $http.get(url);

        }

        function _searchJava(searchString, searchType, includeArchived) {
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            var searchFor = $rootScope.onLauncher ? 0 : $rootScope.onIntake ? 1 : 2
            if (utils.isNotEmptyVal(searchString)) {
                var url = docSearchUrl + 'searchType=' + searchType + '&searchString=' + encodeURIComponent(searchString) + "&pageNum=1&pageSize=100&isIntake=" + searchFor;
                if (searchType == "matter" || searchType == "documents" || searchType == "task,events") {
                    if (includeArchived == 0 || includeArchived == 1) {
                        url += "&includeArchived=" + includeArchived;
                    }
                }
                return $http({
                    url: url,
                    method: "GET",
                    headers: token
                })
            } else {
                var deferred = $q.defer();
                deferred.resolve(response = {
                    data: []
                });
                return deferred.promise;
            }

        }

        function _search1(searchString, searchParam) {
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            searchString = $.trim(searchString.replace(/[^a-zA-Z0-9._' ]/g, " "));
            if (utils.isNotEmptyVal(searchString)) {
                var url = searchUrl1 + 'search=' + searchString + "&pageNumber=1&pageSize=100";
                return $http({
                    url: url,
                    method: "GET",
                    headers: token
                })
            } else {
                var deferred = $q.defer();
                deferred.resolve(response = {
                    data: []
                });
                return deferred.promise;
            }

        }

        function _saveSearch(searchObj) {
            var url = saveSearchUrl;
            return $http.post(url, searchObj);
        }

        function _getSavedSearches() {
            var url = getSavedSearchesUrl;
            return $http.get(getSavedSearchesUrl);
        }

        function _deleteSearch(id) {
            var url = deleteSearchUrl + id;
            return $http.delete(url);
        }
    }

})(angular)
