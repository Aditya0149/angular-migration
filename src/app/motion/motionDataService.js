angular.module('cloudlex.motion')
    .factory('motionDataService', motionDataService);

motionDataService.$inject = ['$q', '$http', 'globalConstants'];

function motionDataService($q, $http, globalConstants) {

    var baseUrl = globalConstants.javaWebServiceBaseV4;

    /*var getAllPostUrl = baseUrl + 'sidebar/allpost.json';
    var getFollowingUrl = baseUrl + 'sidebar/followingpost.json';
    var postFollowUrl = baseUrl + 'sidebar/sidebarFollow.json';*/

    var getMotionDetailUrl = baseUrl + 'motion/all-motion';

    function getParams(params) {
        var querystring = "";
        angular.forEach(params, function (value, key) {
            querystring += key + "=" + value;
            querystring += "&";
        });
        return querystring.slice(0, querystring.length - 1);
    }

    return {
        getMotionDetail: getMotionDetail
        /* getAllPost: getAllPost,
         getFollowingPost: getFollowingPost,
         postFollow: postFollow,
         postCommentPost: postCommentPost,
         addComment: addComment*/
    }

    function getMotionDetail(requestFilters) {
        var url = getMotionDetailUrl;
        url += '?' + getParams(requestFilters);
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

    /*function getFollowingPost(requestFilters){
        var url = getFollowingUrl;
        url += '?' + getParams(requestFilters);
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

    function postFollow(followData){
        var url = postFollowUrl;
        return $http.post(url, followData);

    }

    function postCommentPost(postData){
        var url = getAllPostUrl;
        return $http.post(url, postData);

    }

    function addComment(addCommentData){
        var url = postFollowUrl;
        return $http.post(url, followData);

    }*/



}