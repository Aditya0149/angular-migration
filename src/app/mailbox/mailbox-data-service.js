/* Mailbox module data services
 * */
(function () {
    'use strict';

    angular
        .module('cloudlex.mailbox')
        .factory('mailboxDataService', mailboxDataService);

    mailboxDataService.$inject = ["$http", "$q", "mailboxConstants"];

    function mailboxDataService($http, $q, mailboxConstants) {

        var mailboxService = {
            getInboxList: getInboxListFn,
            getSentList: getSentListFn,
            getDraftList: getDraftListFn,
            deleteMails: deleteMailsFn,
            getMailthread: getMailthreadFn,
            getAllUsers: getAllUsersFn,
            getContactSearched: getContactSearchedFn,
            getRecipients: getRecipients,
            sendMail: sendMailFn,
            deleteAttachment: deleteAttachmentFn,
            downloadFile: downloadFileFn,
            emailSignature: getSignature,
            getdocumentsize: getdocumentsizeFn //US#7824
        };

        return mailboxService;

        /* Fucntion to get the inbox mails */
        function getInboxListFn(allMail, pageNum, sortBy, sortOrder, scopename, scrollToEmailId) {
            var url = mailboxConstants.getInbox + '?allmails=' + allMail + '&pageNum=' + pageNum + '&sortBy=' + sortBy + "&sortOrder=" + sortOrder + "&is_intake=" + scopename;
            if(scrollToEmailId){
                url += '&message_id=' + scrollToEmailId;
            }
            return $http.get(url);
        }

        /* Fucntion to get the sent mails */
        function getSentListFn(allMail, pageNum, sortBy, sortOrder, scopename) {
            var url = mailboxConstants.getSent + '?allmails=' + allMail + '&pageNum=' + pageNum + '&sortBy=' + sortBy + "&sortOrder=" + sortOrder + "&is_intake=" + scopename;
            return $http.get(url);
        }

        /* Fucntion to get the drafted mails */
        function getDraftListFn(allMail, pageNum, sortBy, sortOrder, scopename) {
            var url = mailboxConstants.getDraft + '?allmails=' + allMail + '&pageNum=' + pageNum + '&sortBy=' + sortBy + "&sortOrder=" + sortOrder + "&is_intake=" + scopename;
            return $http.get(url);
        }

        /*Delete multiple mails*/
        function deleteMailsFn(id, data, type) {
            var deferred = $q.defer();
            var url = mailboxConstants.deleteMail + id + '.json?type=' + type;
            $http.put(url, data)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        /* Get the complete mail thread*/
        function getMailthreadFn(mailId) {
            var url = mailboxConstants.mailThread + mailId + '.json';
            return $http.get(url);
        }

        function getRecipientsList(messageId) {
            var url = mailboxConstants.getRecipients + messageId;
            return $http.get(url);
        }

        /* Get all users from firm */
        function getAllUsersFn() {
            var url = mailboxConstants.getFirmUsers;
            return $http.get(url);
        }

        /* Get contact according to serached */
        function getContactSearchedFn(name) {
            var deferred = $q.defer();
            var url = mailboxConstants.getContacts + name;
            $http.get(url)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        /* Get mail recipient */
        function getRecipients(messageId, replyTo) {
            var url = mailboxConstants.getRecipients + messageId + "?reply=" + replyTo;
            return $http.get(url);
        }

        /* Send Mail */
        function sendMailFn(data) {
            var deferred = $q.defer();
            if (data.status == 'Draft') {
                if (data.mail_msg_id == '')
                    data.mail_msg_id = 'null';

                var url = mailboxConstants.draftEmail + data.mail_msg_id + '.json';
                $http.put(url, data)
                    .then(function (response) {
                        deferred.resolve(response);
                    }, function (error) {
                        deferred.reject(error);
                    });
            } else {

                var url = mailboxConstants.sendEmail;
                $http.post(url, data)
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
            var url = mailboxConstants.deleteBlob;
            $http.post(url, data)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        /* download blob*/
        function downloadFileFn(attId) {
            var url = mailboxConstants.downloadBlob + attId + '?doctype=mail'
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: url,
                method: "GET",
                headers: token,
                responseType: 'arraybuffer'
            });
        }

        /*Get email signature of User*/
        function getSignature() {
            var url = mailboxConstants.getEmailSignature;
            return $http.get(url);
        }

        //US#7824
        function getdocumentsizeFn(docId, is_intake) {
            var url = mailboxConstants.getdocumentsize + '?documentids=' + docId + '&is_intake=' + is_intake;
            return $http.get(url);
        }

    };
})();
