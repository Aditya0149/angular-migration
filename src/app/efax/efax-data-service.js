/* Mailbox module data services
 * */
(function () {
    'use strict';

    angular
        .module('cloudlex.efax')
        .factory('efaxDataService', efaxDataService);

    efaxDataService.$inject = ["$http", "$q", "efaxConstants", "globalContactConstants"];

    function efaxDataService($http, $q, efaxConstants, globalContactConstants) {

        var mailboxService = {
            getSentList: getSentListFn,
            getFaxthread: getFaxthreadFn,
            getAllUsers: getAllUsersFn,
            getContactSearched: getContactSearchedFn,
            getRecipients: getRecipients,
            sendMail: sendMailFn,
            downloadFile: downloadFileFn,
            emailSignature: getSignature,
            getdocumentsize: getdocumentsizeFn
        };

        return mailboxService;



        /* Fucntion to get the sent fax */
        function getSentListFn(pageNum, pageSize) {
            var url = efaxConstants.getSent1 + '/' + pageNum + '/' + pageSize;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: url,
                method: "GET",
                headers: token
            })
        }

        function getFaxthreadFn(faxid) {
            var url = efaxConstants.mailThread1 + '/' + faxid;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: url,
                method: "GET",
                headers: token
            });
        }


        /* download blob*/
        function downloadFileFn(attId) {
            var deferred = $q.defer();
            var url = efaxConstants.downloadBlob1 + '/' + attId + '?accesstoken=' + localStorage.getItem('accessToken');
            window.open(url, '_blank');
        }

        function getRecipientsList(messageId) {
            var url = efaxConstants.getRecipients + messageId;
            return $http.get(url);
        }

        /* Get all users from firm */
        function getAllUsersFn() {
            var url = efaxConstants.getFirmUsers;
            return $http.get(url);
        }

        /* Get contact according to serached */
        function getContactSearchedFn(name) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: globalContactConstants.RESTAPI.javacourtContactsMatt1,
                method: "POST",
                headers: token,
                data: name
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;

        }

        /* Get fax recipient */
        function getRecipients(messageId, replyTo) {
            var url = efaxConstants.getRecipients + messageId + "?reply=" + replyTo;
            return $http.get(url);
        }

        /* Send fax */
        function sendMailFn(data) {
            var url = efaxConstants.sendEmail1;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: url,
                method: "post",
                headers: token,
                data: data
            })
        }

        /* Delete the attachment from blob */
        function deleteAttachmentFn(data) {
            var deferred = $q.defer();
            var url = efaxConstants.deleteBlob;
            $http.post(url, data)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }



        /*Get email signature of User*/
        function getSignature() {
            var url = efaxConstants.getEmailSignature;
            return $http.get(url);
        }


        function getdocumentsizeFn(docId) {
            var url = efaxConstants.getdocumentsize + '?documentids=' + docId;
            return $http.get(url);
        }

    };
})();
