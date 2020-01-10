/* Mailbox module data services
 * */
(function () {
    'use strict';

    angular
        .module('cloudlex.mailbox_java')
        .factory('mailboxDataServiceV2', mailboxDataService);

    mailboxDataService.$inject = ["$http", "$q", "mailboxConstantsV2"];

    function mailboxDataService($http, $q, mailboxConstantsV2) {

        var mailboxService = {
            getInboxList: getInboxListFn,
            getSentList: getSentListFn,
            getDraftList: getDraftListFn,
            deleteMails: deleteMailsFn,
            getMailthread: getMailthreadFn,
            getNoteThread: getNoteThreadFn,
            getSentMailthread: getSentMailthreadFn,
            getAllUsers: getAllUsersFn,
            getContactSearched: getContactSearchedFn,
            getMailRecipients: getRecipients,
            sendMail: sendMailFn,
            deleteAttachment: deleteAttachmentFn,
            downloadFile: downloadFileFn,
            emailSignature: getSignature,
            getdocumentsize: getdocumentsizeFn, //US#7824
            //getReadEmail : getReadEmailFn
        };

        return mailboxService;

        /* Fucntion to get the inbox mails */
        function getInboxListFn(pageNum, sortBy, sortOrder) {
            var url = mailboxConstantsV2.getInbox + '?pageNum=' + pageNum + '&sortBy=' + sortBy + "&sortOrder=" + sortOrder;;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: url,
                method: "GET",
                headers: token,
            })
        }

        /* Fucntion to get the sent mails */
        function getSentListFn(pageNum, sortBy, sortOrder) {
            var url = mailboxConstantsV2.getSent + '?pageNum=' + pageNum + '&sortBy=' + sortBy + "&sortOrder=" + sortOrder;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: url,
                method: "GET",
                headers: token,
            })
        }

        /* Fucntion to get the drafted mails */
        function getDraftListFn(pageNum, sortBy, sortOrder) {
            var url = mailboxConstantsV2.getDraft + '?pageNum=' + pageNum + '&sortBy=' + sortBy + "&sortOrder=" + sortOrder;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: url,
                method: "GET",
                headers: token,
            })
        }

        /*Delete multiple mails*/
        function deleteMailsFn(data, type) {
            var deferred = $q.defer();
            var url = mailboxConstantsV2.deleteMail + '?flag=' + type;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "PUT",
                headers: token,
                data: data
            })
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        /* Get the complete mail thread*/
        function getMailthreadFn(mailId, isRead) {
            var url = mailboxConstantsV2.mailThread + '?tid=' + mailId + '&isread=' + isRead;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: url,
                method: "GET",
                headers: token,
            });
        }

        /* Get the complete note thread*/
        function getNoteThreadFn(threadId) {
            var url = mailboxConstantsV2.noteThread + '?tid=' + threadId;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: url,
                method: "GET",
                headers: token,
            });
        }

        function getSentMailthreadFn(mailId, type) {
            var url = mailboxConstantsV2.sentMailThread + '?mid=' + mailId + '&flag=' + type;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: url,
                method: "GET",
                headers: token,
            });
        }

        // function getReadEmailFn(mid){
        //     var url = mailboxConstantsV2.sentMailThread + '?mid=' + mailId;
        //     var token = {
        //         'Authorization': "Bearer " + localStorage.getItem('accessToken'),
        //         'Content-type': 'application/json'
        //     }
        //     return $http({
        //         url: url,
        //         method: "GET",
        //         headers: token,
        //     })
        // }

        function getRecipientsList(messageId) {
            var url = mailboxConstantsV2.getRecipients + messageId;
            return $http.get(url);
        }

        /* Get all users from firm */
        function getAllUsersFn() {
            var url = mailboxConstantsV2.getFirmUsers;
            return $http.get(url);
        }

        /* Get contact according to serached */
        function getContactSearchedFn(name) {
            var deferred = $q.defer();
            var url = mailboxConstantsV2.getContacts + name;
            $http.get(url)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        /* Get mail recipient */
        function getRecipients(maildata, replyTo) {
            var replyOption = "";
            (replyTo == 'all') ? replyOption = 1 : replyOption = 0;
            var url = mailboxConstantsV2.getRecipients + "?flag=" + replyOption;
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "POST",
                headers: token,
                data: maildata
            })
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        /* Send Mail */
        function sendMailFn(data) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            if (data.status == 'Draft') {
                delete data['status'];
                // if (data.mail_msg_id == '')
                //     data.mail_msg_id = 'null';

                var url = mailboxConstantsV2.draftEmail;
                $http({
                    url: url,
                    method: "POST",
                    headers: token,
                    data: data
                })
                    .then(function (response) {
                        deferred.resolve(response);
                    }, function (error) {
                        deferred.reject(error);
                    });
            } else {
                delete data['status'];
                //  $http({
                //     url: url,
                //     method: "POST",
                //     headers: token, // Add params into headers
                //     data: resetParams,
                //     responseType: 'arraybuffer'
                // }).success(function (response, status, type, headers) {
                //     deferred.resolve(response);
                // }).error(function (error) {
                //     deferred.resolve(ee);
                // });
                // return deferred.promise;


                var url = mailboxConstantsV2.sendEmail;
                $http({
                    url: url,
                    method: "POST",
                    headers: token,
                    data: data
                })
                    .then(function (response) {
                        deferred.resolve(response);
                    }, function (error) {
                        deferred.reject(error);
                    });
            }
            return deferred.promise;

        }

        /* Delete the attachment from blob */
        function deleteAttachmentFn(data) {
            var deferred = $q.defer();
            var url = mailboxConstantsV2.deleteBlob;
            $http.post(url, data)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        /* download blob*/
        function downloadFileFn(msgId, aid, docname) {
            var deferred = $q.defer();
            var url = mailboxConstantsV2.downloadBlob + '?mid=' + msgId + '&aid=' + aid + '&filename=' + docname + '&accesstoken=' + localStorage.getItem('accessToken');
            window.open(url, '_blank');
        }

        /*Get email signature of User*/
        function getSignature() {
            var url = mailboxConstantsV2.getEmailSignature;
            return $http.get(url);
        }

        //US#7824
        function getdocumentsizeFn(docId) {
            var url = mailboxConstantsV2.getdocumentsize + '?documentids=' + docId;
            return $http.get(url);
        }

    };
})();
