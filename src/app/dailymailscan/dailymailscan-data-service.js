/* Document module data services
 * */
(function () {
    'use strict';

    angular
        .module('cloudlex.dailymailscan')
        .factory('dailyMailScanDataService', dailyMailScanDataService);

    dailyMailScanDataService.$inject = ["$http", "$q", "userSession", "globalConstants"];

    function dailyMailScanDataService($http, $q, userSession, globalConstants) {

        function getParams(params) {
            var querystring = "";
            angular.forEach(params, function (value, key) {
                querystring += key + "=" + value;
                querystring += "&";
            });
            return querystring.slice(0, querystring.length - 1);
        }

        /* Daily Mail Scan URLs*/
        var dailymailFactory = {
            RESTAPI: {
                getUploadeddailymailUrl: globalConstants.javaWebServiceBaseV4 + "dailymailscan",
                getUnindexeddailymailUrl: globalConstants.javaWebServiceBaseV4 + "dailymailscan/unindexeddailymailscan",
                deleteUploadedDailymailUrl: globalConstants.javaWebServiceBaseV4 + "dailymailscan/uploadeddailymailscan/delete",
                //downloadDocumentUrl 	    : globalConstants.webServiceBase + "lexviafiles/sharedaccessdownload/",
                downloadDocumentUrl: globalConstants.javaWebServiceBaseV4 + "documents/download/",
                deleteUnindexedDailymailUrl: globalConstants.javaWebServiceBaseV4 + "dailymailscan/unindexdailymail/delete",
                updateUnindexedDailymailUrl: globalConstants.webServiceBase + "dailymailscan/undexeddailymailscan/",
                getuserRoleUrl: globalConstants.webServiceBase + 'practice/user_role.json',
                addCommentUrl: globalConstants.javaWebServiceBaseV4 + 'dailymailscan/unindexeddailymailscan/update',
                statuschangeUrl: globalConstants.javaWebServiceBaseV4 + 'dailymailscan/uploadeddailymailscan/update',
                keepsessionaliveUrl: globalConstants.webServiceBase + 'lexviadocuments/keepsessionalive.json',
            }
        };

        var config = {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': userSession.getToken()
            }
        };

        var dailymailService = {
            getUserRole: getUserRoleFunc,
            getUploadedDailymail: getUploadedDailymailFunc,
            deleteUploadedDocument: deleteUploadedDocumentFunc,
            downloadDocument: downloadDocumentFunc,
            deleteUnindexedDocument: deleteUnindexedDocumentFunc,
            getUnindexedDailymail: getUnindexedDailymailFunc,
            updateComments: updateCommentsFunc,
            changeStatus: changeStatusFunc,
            keepSessionalive: keepSessionaliveFunc,
        };

        return dailymailService;

        /* Get User role */
        function getUserRoleFunc() {
            var url = dailymailFactory.RESTAPI.getuserRoleUrl;
            return $http.get(url);
        }

        /* Get list of ulpoded documents*/
        function getUploadedDailymailFunc(sortby, sortOrder, pagenum, alluploaded) {
            var url = dailymailFactory.RESTAPI.getUploadeddailymailUrl + '?sortBy=' + sortby + '&sortOrder=' + sortOrder + '&pageNum=' + pagenum + '&pageSize=100' + '&alluploaded=' + alluploaded;
            return $http.get(url);
        }

        /* Delete uploaded document */
        function deleteUploadedDocumentFunc(docdata) {
            var data = { 'docIds': docdata['docID'].toString() };
            var url = dailymailFactory.RESTAPI.deleteUploadedDailymailUrl + '?' + getParams(data);
            return $http({
                url: url,
                method: "DELETE"
            });
        }

        /*Get the single document from azure storage */
        function downloadDocumentFunc(documentId, type) {
            var deferred = $q.defer();
            var url = dailymailFactory.RESTAPI.downloadDocumentUrl + documentId + '?doctype=' + type
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "GET",
                headers: token,
                responseType: 'arraybuffer'
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        /*Delete Unindexed documents*/
        function deleteUnindexedDocumentFunc(docdata) {
            var data = { 'docIds': docdata['docID'].toString() };
            var url = dailymailFactory.RESTAPI.deleteUnindexedDailymailUrl + '?' + getParams(data);
            return $http({
                url: url,
                method: "DELETE"
            });
        }

        /* get List of Unindexed documents*/
        function getUnindexedDailymailFunc(pagenum, allunindexed) {
            var url = dailymailFactory.RESTAPI.getUnindexeddailymailUrl + '?pageNum=' + pagenum + '&pageSize=100' + '&allunindexed=' + allunindexed;
            return $http.get(url);
        }

        /* Update comments on unindexed documents */
        function updateCommentsFunc(docId, comments) {
            var data = { 'comment': comments, 'id': docId };
            var deferred = $q.defer();
            var url = dailymailFactory.RESTAPI.addCommentUrl;
            $http.put(url, data)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;

        }

        /* Change status of uploaded documents */
        function changeStatusFunc(docId, newstatus) {
            var data = { 'id': docId, 'status': newstatus };
            var deferred = $q.defer();
            var url = dailymailFactory.RESTAPI.statuschangeUrl;
            $http.put(url, data)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;

        }

        /*Keep the session alive on server while large document is uploading*/
        function keepSessionaliveFunc() {
            var url = dailymailFactory.RESTAPI.keepsessionaliveUrl;
            return $http.get(url);
        }
    };
})();