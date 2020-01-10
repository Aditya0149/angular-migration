angular.module('cloudlex.sidebar')
    .factory('sidebarDataLayer', sidebarDataLayer);

sidebarDataLayer.$inject = ['$q', '$http', 'globalConstants'];

function sidebarDataLayer($q, $http, globalConstants) {

    var baseUrl = globalConstants.webServiceBase;

    var getAllPostUrl = baseUrl + 'sidebar/allpost.json';
    var getFollowingUrl = baseUrl + 'sidebar/followingpost.json';
    var getNotificationCount = baseUrl + 'notification/notification_count';
    var postFollowUrl = baseUrl + 'sidebar/sidebarFollow.json';
    var addCommentUrl = baseUrl + 'sidebar/postcomment/';
    var deleteCommentUrl = baseUrl + 'sidebar/postcomment/';
    var editPostUrl = baseUrl + 'sidebar/allpost/';
    var deletePostUrl = baseUrl + 'sidebar/allpost/';


    function getParams(params) {
        var querystring = "";
        angular.forEach(params, function (value, key) {
            querystring += key + "=" + value;
            querystring += "&";
        });
        return querystring.slice(0, querystring.length - 1);
    }

    return {
        getAllPost: getAllPost,
        getFollowingPost: getFollowingPost,
        postFollow: postFollow,
        postCommentPost: postCommentPost,
        addComment: addComment,
        deleteComment: deleteComment,
        editPost: editPost,
        deletePost: deletePost,
        getNotificationCount: _getNotificationCount
    };

    function getAllPost(requestFilters) {
        var url = getAllPostUrl;
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

    function getFollowingPost(requestFilters) {
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

    function postFollow(followData) {
        var url = postFollowUrl;
        return $http.post(url, followData);

    }

    function postCommentPost(postData) {
        var url = getAllPostUrl;
        return $http.post(url, postData);

    }

    /*function addComment(addCommentData){
        var url = addCommentsUrl;
        return $http.post(url, addCommentData);

    }*/

    function addComment(addCommentData) {
        var data = {};
        data.comment = addCommentData.comment;
        var postId = addCommentData.post_id;
        var url = addCommentUrl + postId + '.json';
        return $http.put(url, data);
    }

    function deleteComment(commentId) {
        var url = deleteCommentUrl + commentId + '.json';
        return $http.delete(url);
    }

    function editPost(id, msg) {
        var url = editPostUrl + id;
        return $http.put(url, msg);
    }

    function deletePost(id) {
        var url = deletePostUrl + id;
        return $http.delete(url);
    }

    /**
     * Get Notification count
     */
    function _getNotificationCount() {
        var url = getNotificationCount;
        return $http.get(url);
    }

}
