angular.module('cloudlex.newSidebar')
    .factory('newSidebarDataLayer', newSidebarDataLayer);

newSidebarDataLayer.$inject = ['$q', '$http', 'globalConstants'];

function newSidebarDataLayer($q, $http, globalConstants) {

    var baseUrl = globalConstants.webServiceBase;

    var baseUrlForSocket = globalConstants.webSocketServiceBase;

    var getAllPostUrl = baseUrl + 'sidebar/allpost.json';
    var getFollowingUrl = baseUrl + 'sidebar/followingpost.json';
    var getNotificationCount = baseUrl + 'notification/notification_count';
    var postFollowUrl = baseUrl + 'sidebar/sidebarFollow.json';
    var addCommentUrl = baseUrl + 'sidebar/postcomment/';
    var deleteCommentUrl = baseUrl + 'sidebar/postcomment/';
    var editPostUrl = baseUrl + 'sidebar/allpost/';
    var deletePostUrl = baseUrl + 'sidebar/allpost/';
    var getContactsAndEmailsURL = baseUrl;

    // Start: External Chat 
    var getCollaboratedMatterURL = baseUrl + 'Cloudlex-Lite/v1/lite/search-collaborated-matter/';
    var createNewExternalMsgGroupURL = baseUrl + 'Matter-Manager/v1/message/create-new-group';
    var openExtMsgWebSocketURL = baseUrlForSocket + 'Cloudlex-Messenger/serverendpoint/';
    var getExternalMsgGroupListURL = baseUrl + 'Matter-Manager/v1/message/group-details?offset=1&limit=50';
    var getExternalMsgSelectedGroupConversionURL = baseUrl + 'Matter-Manager/v1/message/all-Conversation/';
    // End: External Chat 

    // Start: SMS
    var createNewSMSURL = baseUrl + "Matter-Manager/v1/sms/send";
    var getAllSMSThreadURL = baseUrl + "Matter-Manager/v1/sms/threads?isIntake=";
    var getSelectedSMSThreadURL = baseUrl + "Matter-Manager/v1/sms/threads/";
    var getSMSAttachmentFormUrl = baseUrl + "Matter-Manager/v1/sms/link_thread";
    var getSMSExportUrl = baseUrl + "Matter-Manager/v1/sms/export-sms?threadId=";
    //US#14854 : Note Sync Update
    var updateNotesSyncUrl = baseUrl + "Matter-Manager/v1/sms/note_sync";
    // attach file to a mms
    var attachFileToMatterMMS = globalConstants.javaWebServiceBaseV4 + 'documents/mms-document?mms_id=';
    var attachFileToIntakeMMS = globalConstants.intakeServiceBaseV2 + 'documents/mms-document?mms_id=';
    // End: SMS
    //Send MMS
    var sendMMS = baseUrl + "Matter-Manager/v1/documents/mms-document";

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
        getNotificationCount: _getNotificationCount,
        getContactsAndEmails: _getContactsAndEmails,
        getCollaboratedMatter: _getCollaboratedMatter,
        createNewExternalMsgGroup: _createNewExternalMsgGroup,
        openExtMsgWebSocket: _openExtMsgWebSocket,
        getExternalMsgGroupList: _getExternalMsgGroupList,
        getExternalMsgSelectedGroupConversion: _getExternalMsgSelectedGroupConversion,
        createNewSMS: _createNewSMS,
        getAllSMSThread: _getAllSMSThread,
        getSelectedSMSThread: _getSelectedSMSThread,
        getSMSAttachmentForm: _getSMSAttachmentForm,
        getSMSExport: _getSMSExport,
        updateNotesSync: updateNotesSync,
        postFileAttachMMS: postFileAttachMMS,
        sendMMS: sendMMS
    };

    function postFileAttachMMS(postData, isIntake, mmsId) {
        var url = isIntake ? attachFileToIntakeMMS : attachFileToMatterMMS;
        return $http.post(url + mmsId, postData);

    }

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

    function sendMMS(data) {
        var deferred = $q.defer();
        $http({
            url: sendMMS,
            method: "POST",
            data: data
        }).then(function (response) {
            deferred.resolve(response.data);
        }, function (error) {
            deferred.reject(error);
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

    function _getContactsAndEmails(matterId) {
        var deferred = $q.defer();
        $http.get(getContactsAndEmailsURL + 'lexviatemplates/getAllMatterContacts/' + matterId + '.json')
            .then(function (response) {
                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject(error);
            });

        return deferred.promise;
    }

    function _getCollaboratedMatter(searchString, firmId) {
        var deferred = $q.defer();
        var token = {
            'clxAuthToken': localStorage.getItem('accessToken'),
            'Content-type': 'application/json'
        }
        $http({
            url: getCollaboratedMatterURL + firmId + '/' + searchString,
            method: "GET",
            headers: token
        })
            .then(function (response) {
                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject(error);
            });

        return deferred.promise;
    }

    function _createNewExternalMsgGroup(data) {

        var deferred = $q.defer();
        var token = {
            'Authorization': "Bearer " + localStorage.getItem('accessToken'),
            'Content-type': 'application/json'
        }

        $http({
            url: createNewExternalMsgGroupURL,
            method: "POST",
            headers: token,
            data: data
        }).then(function (response) {
            deferred.resolve(response.data);
        }, function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    }

    function _openExtMsgWebSocket(firmId, threadId, SOCKET_CONNECTION) {
        var token = localStorage.getItem('accessToken');
        var webSocketUrl = openExtMsgWebSocketURL + firmId + '/' + threadId + '/1/' + token;
        SOCKET_CONNECTION = new WebSocket(webSocketUrl);
        return SOCKET_CONNECTION;
    }

    function _getExternalMsgGroupList() {
        var deferred = $q.defer();
        var token = {
            'Authorization': "Bearer " + localStorage.getItem('accessToken'),
            'Content-type': 'application/json'
        }
        $http({
            url: getExternalMsgGroupListURL,
            method: "GET",
            responseType: 'arraybuffer',
            headers: token
        }).then(function (response) {
            deferred.resolve(response.data);
        }, function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }

    function _getExternalMsgSelectedGroupConversion(threadId) {

        // {},{offset}{limit}

        var deferred = $q.defer();
        var token = {
            'Authorization': "Bearer " + localStorage.getItem('accessToken'),
            'Content-type': 'application/json'
        }

        $http({
            url: getExternalMsgSelectedGroupConversionURL + threadId + '/1/50',
            method: "GET",
            headers: token
        }).then(function (response) {
            deferred.resolve(response.data);
        }, function (error) {
            deferred.reject(error);
        });

        return deferred.promise;

    }

    function _createNewSMS(data) {

        var deferred = $q.defer();
        var token = {
            'Authorization': "Bearer " + localStorage.getItem('accessToken'),
            'Content-type': 'application/json'
        }
        $http({
            url: createNewSMSURL,
            method: "POST",
            headers: token,
            data: data
        }).then(function (response) {
            deferred.resolve(response.data);
        }, function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    }

    function _getAllSMSThread(id, pageNum, pageSize, cid, txtId) {
        var deferred = $q.defer();
        var token = {
            'Authorization': "Bearer " + localStorage.getItem('accessToken'),
            'Content-type': 'application/json'
        }
        var url = getAllSMSThreadURL + id + "&pageNum=" + pageNum + "&pageSize=" + pageSize;
        if (cid) {
            url = url + "&contactId=" + cid
        }

        if (txtId) {
            url = url + "&smsId=" + txtId
        }

        $http({
            url: url,
            method: "GET",
            headers: token
        }).then(function (response) {
            deferred.resolve(response.data);
        }, function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }

    function _getSelectedSMSThread(threadId, matterId) {
        var deferred = $q.defer();
        var token = {
            'Authorization': "Bearer " + localStorage.getItem('accessToken'),
            'Content-type': 'application/json'
        }
        $http({
            url: getSelectedSMSThreadURL + threadId,
            method: "GET",
            headers: token
        }).then(function (response) {
            deferred.resolve(response.data);
        }, function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }

    function _getSMSAttachmentForm(obj) {
        var deferred = $q.defer();
        var token = {
            'Authorization': "Bearer " + localStorage.getItem('accessToken'),
            'Content-type': 'application/json'
        }
        $http({
            url: getSMSAttachmentFormUrl,
            method: "PUT",
            headers: token,
            data: obj
        }).then(function (response) {
            deferred.resolve(response.data);
        }, function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }

    function _getSMSExport(threadId) {
        return $http({
            url: getSMSExportUrl + threadId + "&fileName=Client_Messenger&pageNum=1&pageSize=1000",
            method: "GET",
            responseType: 'arraybuffer'
        });
    }

    //US#14854 : Note Sync 
    function updateNotesSync(note) {
        var finalnote = angular.copy(note);
        var deferred = $q.defer();
        var url = updateNotesSyncUrl;
        var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
        return $http({
            url: url,
            method: "PUT",
            data: finalnote,
            headers: token
        }).success(function (response, status, headers, config) {
            deferred.resolve();
        }).error(function (ee, status, headers, config) {
            deferred.reject();
        });
    }


}
