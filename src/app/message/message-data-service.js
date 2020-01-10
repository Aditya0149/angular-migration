(function () {
    angular.module("cloudlex.message").factory("messageFactory", messageFactory);
    messageFactory.$inject = ['$http', '$q', 'messageConstants'];

    function messageFactory($http, $q, messageConstants) {

        //  var saveMessage = appConstants.webService + "http://demoui.cloudapp.net:8080/Java_Authentication_new/webapi/v1/login/saveMessage"

        var chatMessage = {
            saveMessage: _saveMessage,
            getMessage: _getMessage,
            getPlaintiffMessageNotificationList: _getPlaintiffMessageNotificationList,
            getDeleteMessageNotification: _getDeleteMessageNotification,
            getMatterPlaintiffs: _getMatterPlaintiffs,
            sendSMS: _sendSMS,

            //Start: Group-Chat-Message Client-Portal
            createNewGroup: _createNewGroup,
            getGroupsByMatterId: _getGroupsByMatterId,
            updateUserDetails: _updateUserDetails,
            getMessageNotification: _getMessageNotification,
            getAllConversationHistory: _getAllConversationHistory,
            openWebSocket: _openWebSocket,
            getMatterPlaintiffsForMessage: _getMatterPlaintiffsForMessage,
            getNewMessage: _getNewMessage
            //End: Group-Chat-Message Client-Portal

        }
        return chatMessage;

        function _saveMessage(saveMessageDetail) {
            return $http({
                url: messageConstants.RESTAPI.saveMessage,
                method: "POST",
                data: saveMessageDetail
            });
        }

        function _getMessage(firm_id, matter_id, user_id, pageNum, pageSize) {
            var url = messageConstants.RESTAPI.getMessages;
            url += firm_id + "/" + matter_id + "/" + pageNum + "/" + pageSize;
            return $http({
                url: url,
                method: "GET",
                withCredentials: true,
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem('accessToken')
                }
            });
        }

        /**
         * get matter plaintiff message nitification
         */
        function _getPlaintiffMessageNotificationList() {
            var url = messageConstants.RESTAPI.getNotificationMessagesList;
            return $http({
                url: url,
                method: "GET",
                withCredentials: true
            });
        }

        /**
         * Delete matter message notification 
         */
        function _getDeleteMessageNotification(matter_id) {
            var url = messageConstants.RESTAPI.deleteMessageNotification;
            url += matter_id + '.json';
            return $http({
                url: url,
                method: "DELETE",
                withCredentials: true
            });
        }

        /**
         * get matter specific plaintiffs
         */
        function _getMatterPlaintiffs(matter_id) {
            var url = messageConstants.RESTAPI.getMatterPlaintiffs;
            url += matter_id + '.json';
            return $http({
                url: url,
                method: "GET",
                withCredentials: true
            });
        }

		/**
         * send SMS
         */
        function _sendSMS(smsParams) {
            return $http({
                url: messageConstants.RESTAPI.sendSMS,
                method: "POST",
                data: smsParams
            });
        }


        // function _getSearchMessage(matterId){
        //       var url = messageConstants.RESTAPI.getSearchMessages;
        //       url+= '?matter_id=' + matterId;
        //       return $http({
        //         url: url,
        //         method: "GET",
        //         withCredentials: true
        //     });
        // }


        //Start: Group-Chat-Message Client-Portal

        /**
        * get matter specific plaintiffs
        */
        function _getMatterPlaintiffsForMessage(matterId) {
            var deferred = $q.defer();
            $http({
                url: messageConstants.RESTAPI.getMatterPlaintiffsForMessageUrl + matterId,
                method: "GET",
                withCredentials: true,
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem('accessToken')
                },
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }

        function _createNewGroup(data) {
            var deferred = $q.defer();
            $http({
                url: messageConstants.RESTAPI.createNewGroupUrl,
                method: "POST",
                withCredentials: true,
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem('accessToken')
                },
                data: data
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function _getGroupsByMatterId(matterId) {
            var deferred = $q.defer();
            $http({
                url: messageConstants.RESTAPI.getGroupsByMatterIdUrl + matterId,
                method: "GET",
                withCredentials: true,
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem('accessToken')
                },
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function _updateUserDetails(firmId, matterId, userId, groupId) {
            var data = {
                "firmId": firmId,
                "matterId": matterId,
                "userId": userId,
                "groupId": groupId
            }
            var deferred = $q.defer();
            $http({
                url: messageConstants.RESTAPI.updateUserDetailsUrl,
                method: "PUT",
                withCredentials: true,
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem('accessToken')
                },
                data: data
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function _getMessageNotification() {
            var deferred = $q.defer();
            $http({
                url: messageConstants.RESTAPI.getMessageNotificationUrl,
                method: "GET",
                withCredentials: true,
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem('accessToken')
                },
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function _getAllConversationHistory(data) {
            var deferred = $q.defer();

            var groupId = data.groupId;
            var offset = 1;
            var limit = 5;

            $http({
                url: messageConstants.RESTAPI.getAllConversationHistoryUrl + groupId + '/' + offset + '/' + limit,
                method: "GET",
                withCredentials: true,
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem('accessToken')
                },
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function _openWebSocket(firmId, matterId, userId, groupId, socketType, SOCKET_CONNECTION) {
            var token = localStorage.getItem('accessToken');
            var webSocketUrl = messageConstants.RESTAPI.openWebSocketUrl + firmId + '/' + matterId + '/' + userId + '/' + groupId + '/' + socketType + '/' + token;
            SOCKET_CONNECTION = new WebSocket(webSocketUrl);
            return SOCKET_CONNECTION;
        }

        function _getNewMessage(groupId, pageNum, pageSize) {
            var deferred = $q.defer();
            var offset = pageNum;
            var limit = pageSize;

            $http({
                url: messageConstants.RESTAPI.getAllConversationHistoryUrl + groupId + '/' + offset + '/' + limit,
                method: "GET",
                withCredentials: true,
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem('accessToken')
                },
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }

        //End: Group-Chat-Message Client-Portal

    }

})(angular);
