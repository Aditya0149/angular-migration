(function (angular) {

    angular.module('cloudlex.notification')
        .factory('notificationDatalayer', notificationDatalayer);

    notificationDatalayer.$inject = ['$http', 'globalConstants', '$q'];

    function notificationDatalayer($http, globalConstants, $q) {

        var urls = {
            //   deleteMessageNotification :globalConstants.webServiceBase + 'practice/delete_notify/',
            messageList: globalConstants.webServiceBase + 'notification/notification_messaging.json',
            //  documentList:globalConstants.webServiceBase + 'notification/notification_documentlist',
            cloudlexLiteNotify: globalConstants.javaWebServiceBaseV4 + 'notifications',
            counts: globalConstants.webServiceBase + 'notification/notification_count',
            sidebar: globalConstants.webServiceBase + 'notification/notification_sidebarlist',
            readComment: globalConstants.webServiceBase + 'sidebar/readnotification/',
            tasklist: globalConstants.webServiceBase + 'notification/notification_tasklist',
            eventlist: globalConstants.webServiceBase + 'notification/notification_eventlist',
            syncList: globalConstants.webServiceBase + 'notification/notification_synclist',
            readNotification: globalConstants.webServiceBase + 'notification/read_notification/1',
            updateReadStatus: globalConstants.javaWebServiceBaseV4 + 'notifications/update-read-status',
            newMessageList: globalConstants.javaWebServiceBaseV4 + "message/get-notification",
            newNotifications: globalConstants.javaWebServiceBaseV4 + "notification/all_notification?",
            setUserFirstReadTime: globalConstants.javaWebServiceBaseV4 + "notification/bell_count/",
            markRead: globalConstants.javaWebServiceBaseV4 + "notification/mark_as_read?notification_ids=",
            markDismiss: globalConstants.javaWebServiceBaseV4 + "notification/dismiss_notifications?notification_ids=",
        };

        return {
            getDeleteMessageNotification: _getDeleteMessageNotification,
            getMessageList: _getMessageList,
            getcloudlexLiteNotify: _getcloudlexLiteNotify,
            getNotificationCount: _getNotificationCount,
            getSidebarList: _getSidebarList,
            readComment: _readComment,
            getTaskList: _getTaskList,
            getEventList: _getEventList,
            getSyncList: _getSyncList,
            readNotifications: _readNotifications,
            updateReadStatus: _updateReadStatus,
            getNewMessageList: _getNewMessageList,
            setUserFirstReadTime: _setUserFirstReadTime,
            markRead: _markRead,
            markDismiss: _markDismiss,

            //For Intake
            getNotificationCountForIntake: _getNotificationCountForIntake,
            newNotifications: _newNotifications

        };

        function _setUserFirstReadTime() {
            return $http.put(urls.setUserFirstReadTime + localStorage.getItem('userId'));
        }

        function _markRead(ids) {
            return $http.put(urls.markRead + ids.toString());
        }

        function _markDismiss(ids) {
            return $http({
                url: urls.markDismiss + ids.toString(),
                method: "DELETE"
            });
        }


        function _getDeleteMessageNotification(matter_id) {
            var url = globalConstants.webServiceBase + 'practice/delete_notify/';
            url += matter_id + '.json';
            return $http({
                url: url,
                method: "DELETE",
                withCredentials: true
            });
        }

        function _getMessageList() {
            return $http.get(urls.messageList);
        }

        function _getNewMessageList() {
            var deferred = $q.defer();
            $http({
                url: urls.newMessageList,
                method: "GET",
                withCredentials: true,
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem('accessToken')
                }
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function _getcloudlexLiteNotify(isIntake) {
            var url = urls.cloudlexLiteNotify;
            if (isIntake) {
                url = url + "?is_intake=1";
            } else {
                url = url + "?is_intake=0";
            }
            return $http.get(url);
        }
        function _getNotificationCount() {
            return $http.get(urls.counts + "?is_intake=0");
        }

        function _getSidebarList(isIntake) {
            var url = urls.sidebar;
            if (isIntake) {
                url = url + "?is_intake=1";
            } else {
                url = url + "?is_intake=0";
            }
            return $http.get(url);
        }

        function _readComment(commentId) {
            return $http.get(urls.readComment + commentId);
        }

        function _getTaskList(isIntake) {
            var url = urls.tasklist;
            if (isIntake) {
                url = url + "?is_intake=1";
            } else {
                url = url + "?is_intake=0";
            }
            return $http.get(url);
        }

        function _getEventList(isIntake) {
            var url = urls.eventlist;
            if (isIntake) {
                url = url + "?is_intake=1";
            } else {
                url = url + "?is_intake=0";
            }
            return $http.get(url);
        }

        function _getSyncList(isIntake) {
            var url = urls.syncList;
            if (isIntake) {
                url = url + "?is_intake=1";
            } else {
                url = url + "?is_intake=0";
            }
            return $http.get(url);
        }

        function _readNotifications(notifId, fromTab, isIntake) {
            var data = { from: fromTab, ids: notifId };
            var url = urls.readNotification;
            if (isIntake) {
                url = url + "?is_intake=1";
            } else {
                url = url + "?is_intake=0";
            }
            return $http.put(url, data);
        }

        // updateReadStatus
        function _updateReadStatus(notifId) {
            return $http.put(urls.updateReadStatus, notifId);
        }

        //For Intake
        function _getNotificationCountForIntake() {
            return $http.get(urls.counts + "?is_intake=1");
        }

        function _newNotifications(is_intake, start_date, end_date, notification_type, pageNum, pageSize, hideLoader) {
            var filter = {
                is_intake: is_intake,
                start_date: start_date ? start_date : 0,
                end_date: end_date ? end_date : 0,
                notification_type: notification_type,
                page_number: pageNum ? pageNum : 1,
                page_size: pageSize ? pageSize : 20
            }
            var url = urls.newNotifications + utils.getParamsNew(filter);
            if(hideLoader){
                url+='&hideLoader=true'
            }
            var deferred = $q.defer();
            $http.get(url).then(function (res) {
                var data = {};
                data.totalCount = res.data.totalCount;
                res = res.data.notifications;
                res = utils.processNotification(res);
                data.result = res;
                deferred.resolve(data);
            }, function () {
                deferred.reject({});
            })
            return deferred.promise;
        }

    }


})(angular);
