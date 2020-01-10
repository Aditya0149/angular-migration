/* Document module data services
 * */
(function () {
    'use strict';

    angular
        .module('intake.documents')
        .factory('inatkeDocumentsDataService', inatkeDocumentsDataService);

    inatkeDocumentsDataService.$inject = ["$http", "$q", "intakeDocumentsConstants", "userSession", "globalConstants"];

    function inatkeDocumentsDataService($http, $q, intakeDocumentsConstants, userSession, globalConstants) {

        var config = {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': userSession.getToken()
            }
        };

        var docInfoObj = {};
        var discoveryData = null;

        var documentsService = {
            getDocumentsList: getDocumentsList,
            // getDocumentsListCount: getDocumentsListCount,
            getDocumentCategories: getDocumentCategories,
            createEnvelop: createEnvelop,
            getPlaintiffs: getPlaintiffs,
            loaddocTags: loaddocTags,
            getDocumentDetails: getDocumentDetails,
            updateDocuemntlock: updateDocumentlock,
            updateDocument: updateDocument,
            deleteDocument: deleteDocument,
            downloadDocument: downloadDocument,
            keepSessionalive: keepSessionalive,
            viewdocument: viewDocument,
            printdocuments: printdocuments,
            getDiscoveryData: getDiscoveryData,
            getDocumentInfo: getDocumentInfo,
            setDocumentInfo: setDocumentInfo,
            getDocForOffice: getDocForOffice,
            checkIfFileExists: checkIfFileExists,
            uploadOfficeDocs: uploadOfficeDocs,
            getOneDocumentDetails: getOneDocumentDetails,
            getOfficeStatus: getOfficeStatus,
            cloneSourceDocument: cloneSourceDocument,
            linkExsitingDocument: linkExsitingDocument,
            getSearchedData: getSearchedData

        };

        return documentsService;

        function getCall(url) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "GET",
                headers: token,
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };



        /**
        * Link Existing document
        */
        function linkExsitingDocument(docDetails) {
            var deferred = $q.defer();
            var url = intakeDocumentsConstants.RESTAPI.linkDocument;
            $http.post(url, docDetails)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }


        /**
         * Clone source document
         */
        function cloneSourceDocument(docDetails) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: intakeDocumentsConstants.RESTAPI.cloneSourceDocument,
                method: "POST",
                headers: token,
                data: docDetails
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function getDocForOffice(data, url) {
            var deferred = $q.defer();
            var url = url;
            $http.post(url, data)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function getOfficeStatus() {
            var deferred = $q.defer();
            // deferred.resolve({});
            var url = intakeDocumentsConstants.RESTAPI.getOfficeStatus;
            $http.get(url)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        /**
         * get specific document details
         */
        function getOneDocumentDetails(docId) {
            return getCall(intakeDocumentsConstants.RESTAPI.getDocumentDetails + docId);
        }

        /**
         *  create upload document office online
         */
        function uploadOfficeDocs(params) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: intakeDocumentsConstants.RESTAPI.uploadDocument,
                method: "POST",
                headers: token,
                data: params
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function checkIfFileExists(fileID) {
            var deferred = $q.defer();
            var url = getURL(intakeDocumentsConstants.RESTAPI.fileExists, fileID[0]);
            $http.get(url)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }


        function getDocumentInfo() {
            return docInfoObj;
        }

        function setDocumentInfo(docinfo) {
            docInfoObj = docinfo;
        }

        /*Get documents List*/
        function getDocumentsList(alldocuments, matterId, mydocs, pagenum, pagesize, sortby, sortorder, filters, moreinfo) {
            if (moreinfo == undefined) {
                moreinfo = '';
            }
            if (matterId > 0) {
                var url = intakeDocumentsConstants.RESTAPI.getDocumentList + 'alldocuments=' + alldocuments + '&mydocs=' + mydocs + '&pageNum=' + pagenum + '&pageSize=' + pagesize + '&sortBy=' + sortby + '&sortOrder=' + sortorder;
            } else {
                var url = intakeDocumentsConstants.RESTAPI.getDocumentList + 'alldocuments=' + alldocuments + '&mydocs=' + mydocs + '&pageNum=' + pagenum + '&pageSize=' + pagesize + '&sortBy=' + sortby + '&sortOrder=' + sortorder;
            }
            if (utils.isEmptyVal(filters)) {
                var filters = {};
                filters.matterid = matterId;
            }
            if (utils.isEmptyVal(filters.matterid)) {
                filters.matterid = matterId;
            }
            url += setFilters(filters);
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
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



        // US:16596 DocuSign
        function createEnvelop(tagData) {
            var deferred = $q.defer();
            var url = intakeDocumentsConstants.RESTAPI.createEnvelopUrl;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "POST",
                headers: token,// Add params into headers
                data: tagData
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                ee.status = status;
                deferred.reject(ee);
            });
            return deferred.promise;
        }


        function setFilters(filters) {
            var filterParams = '';
            filterParams += '&categoryFilter=' + (utils.isNotEmptyVal(filters.category) ? filters.category : '');
            filterParams += '&assocPartyFilter=' + (utils.isNotEmptyVal(filters.plaintiff) ? filters.plaintiff : '');
            filterParams += '&party_role=' + (utils.isNotEmptyVal(filters.party_role) ? filters.party_role : '');
            filterParams += '&intakeFilter=' + (utils.isNotEmptyVal(filters.matterid) ? filters.matterid : '');
            filterParams += '&updatedByFilter=' + (utils.isNotEmptyVal(filters.updatedByFilter) ? filters.updatedByFilter : '');
            filterParams += '&createdByFilter=' + (utils.isNotEmptyVal(filters.createdByFilter) ? filters.createdByFilter : '');
            filterParams += '&c_start_date=' + (utils.isNotEmptyVal(filters.c_start_date) ? filters.c_start_date : '');
            filterParams += '&c_end_date=' + (utils.isNotEmptyVal(filters.c_end_date) ? filters.c_end_date : '');
            filterParams += '&u_start_date=' + (utils.isNotEmptyVal(filters.u_start_date) ? filters.u_start_date : '');
            filterParams += '&u_end_date=' + (utils.isNotEmptyVal(filters.u_end_date) ? filters.u_end_date : '');
            filterParams += '&needReviewFilter=' + (utils.isNotEmptyVal(filters.needReviewFilter) ? filters.needReviewFilter : '');

            return filterParams;
        }

        /*Get the Document Categories*/
        function getDocumentCategories() {
            var deferred = $q.defer();
            $http({
                url: intakeDocumentsConstants.RESTAPI.documentCategories,
                method: "GET",
                withCredentials: true
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function getDiscoveryData() {
            var deferred = $q.defer();
            if (discoveryData == null) {
                $http({
                    url: intakeDocumentsConstants.RESTAPI.discoveryUrl,
                    method: "GET",
                    withCredentials: true,
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem('accessToken')
                    }
                }).success(function (response, status) {
                    discoveryData = angular.copy(response);
                    deferred.resolve(response);
                }).error(function (ee, status, headers, config) {
                    deferred.reject(ee);
                });
            } else {
                deferred.resolve(discoveryData);
            }

            return deferred.promise;
        }

        /*Get Matter Plaintiffs*/
        function getPlaintiffs(matterId) {
            var url = intakeDocumentsConstants.RESTAPI.getPlaintiff + matterId;
            return getCall(url);
        }

        /*Function to get the tags from server*/
        function loaddocTags(data) {
            var tagList = _.pluck(data.excludetags, 'name').toString();
            var url = intakeDocumentsConstants.RESTAPI.getTags + "searchtag=" + data.searchtag + "&excludetags=" + tagList;

            var deferred = $q.defer();
            getCall(url).then(function (response) {
                if (response) {
                    angular.forEach(response, function (tagvalue, tagkey) {
                        tagvalue.id = tagvalue.tag_id;
                        tagvalue.name = tagvalue.tag_name;
                    });
                } else {
                    response = [];
                }
                deferred.resolve(response);
            }, function () {
                deferred.reject([]);
            })
            return deferred.promise;
        }

        /*Get the single document detail from server */
        function getDocumentDetails(matterId, documentId) {
            var url = intakeDocumentsConstants.RESTAPI.getSingleDoc + documentId + '?intake_id=' + matterId;
            return getCall(url);
        }

        /*Update the document lock to 0 or 1 on server*/
        function updateDocumentlock(data) {
            var data = {};
            var deferred = $q.defer();
            var url = intakeDocumentsConstants.RESTAPI.docLock + data.doc_id + '.json';
            $http.put(url, data)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        /*this function is called when only document detials are changes and document version is not uploaded*/
        function updateDocument(data) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            var docId = parseInt(data.intake_document_id);
            delete data.intake_document_id;
            var url = intakeDocumentsConstants.RESTAPI.updateDocument + "/" + docId;
            $http({
                url: url,
                method: "PUT",
                headers: token,
                data: data
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
            // var url = intakeDocumentsConstants.RESTAPI.updateDocument;
            // $http.post(url, data)
            //     .then(function (response) {
            //         deferred.resolve(response);
            //     }, function (error) {
            //         deferred.reject(error);
            //     });
        }

        /*Delete multiple documents*/
        function deleteDocument(data) {
            var deferred = $q.defer();
            var docids = data.docID.toString();
            var url = intakeDocumentsConstants.RESTAPI.deleteDocument + '?docids=' + docids;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "DELETE",
                headers: token,
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            // return deferred.promise;
            // var url = intakeDocumentsConstants.RESTAPI.deleteDocument;
            // $http.post(url, data)
            //     .then(function (response) {
            //         deferred.resolve(response);
            //     }, function (error) {
            //         deferred.reject(error);
            //     });
            return deferred.promise;
        }

        /*Get the single document from azure storage */
        function downloadDocument(documentId) {
            var deferred = $q.defer();
            var url = intakeDocumentsConstants.RESTAPI.downloadDocument + documentId;
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

        /*Keep the session alive on server while large document is uploading*/
        function keepSessionalive() {
            // var url = intakeDocumentsConstants.RESTAPI.keepsessionalive;
            // return $http.get(url);
        }

        function getURL(serviceUrl, id) {
            var url = serviceUrl.replace("[ID]", id);
            return url;
        }

        /*view the document in new browser window*/
        function viewDocument(documentId) {
            // https://demoapi.cloudlex.net/Intake-Manager/v1/documents/view/114?doctype=doc
            var deferred = $q.defer();
            var url = intakeDocumentsConstants.RESTAPI.viewDocument + documentId + '?doctype=doc';
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "GET",
                headers: token,
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        // 18193 - Search on Document Grid
        function getSearchedData(alldocuments, matterId, mydocs, pagenum, pagesize, sortby, sortorder, filters, searchText) {
            // if (moreinfo == undefined) {
            //     moreinfo = '';
            // }
            if (matterId > 0) {
                var url = intakeDocumentsConstants.RESTAPI.docSearchUrl + 'alldocuments=' + alldocuments + '&mydocs=' + mydocs + '&pageNum=' + pagenum + '&pageSize=' + pagesize + '&sortBy=' + sortby + '&sortOrder=' + sortorder + '&search_string=' +searchText;
            } else {
                var url = intakeDocumentsConstants.RESTAPI.docSearchUrl + 'alldocuments=' + alldocuments + '&mydocs=' + mydocs + '&pageNum=' + pagenum + '&pageSize=' + pagesize + '&sortBy=' + sortby + '&sortOrder=' + sortorder + '&search_string=' +searchText;
            }
            if (utils.isEmptyVal(filters)) {
                var filters = {};
                filters.matterid = matterId;
            }
            if (utils.isEmptyVal(filters.matterid)) {
                filters.matterid = matterId;
            }
            url += setFilters(filters);
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
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

        // function to print documents
        function printdocuments(data, filters, sortorder) {
            var output = getDataListTable(data, filters, sortorder);
            window.open().document.write(output);
        }
        function getDataListTable(dataList, filters, sortorder) {
            var filterobj = [];
            var CategoryStr = [];
            var intakeName = utils.isEmptyVal(dataList[0]) ? '' : dataList[0].intake_name;
            _.forEach(filters, function (item) {
                if (item.key == "needReviewFilter") {
                    filterobj.push('Needs Review: Yes');
                } else if (item.key == "category") {
                    CategoryStr.push((item.value).replace("Category :", ""));
                } else {
                    filterobj.push(item.value);
                }
            });
            if (CategoryStr.length > 0) {
                CategoryStr = CategoryStr.toString();
                filterobj.push("Category: " + CategoryStr);
            }
            filterobj.push("Intake Name: " + intakeName);

            filterobj.push("ORDERED BY: " + sortorder);
            var title = [
                { name: 'documentname', desc: 'Document Name' },
                { name: 'intake_name', desc: 'Intake Name' },
                { name: 'categoryname', desc: 'Category' },
                //{ name: 'plaintiff_name', desc: 'Associated Party' },
                { name: 'created_by', desc: 'Created By' },
                { name: 'date_filed_date', desc: 'Date Filed' }
            ];

            var html = "<html><title>Document List</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}</style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt;'><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Document List</h1><div></div>";
            html += "<body>";
            html += "<div><h2 style='text-align:left;padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";

            angular.forEach(filterobj, function (item) {
                var start = _.indexOf(item, ':');
                var key = item.substr(0, start);
                var val = item.substr((start + 1), item.length);
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px'> " + utils.removeunwantedHTML(val);
                html += "</span>";
                html += "</div>";
            });

            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "<table style='border:1px solid #e2e2e2;width:100%;text-align: left; font-size:8pt;' cellspacing='0' cellpadding='0' border='0'>";
            html += "<tr>";
            angular.forEach(title, function (value, key) {

                if (value.name == 'documentname') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                } else if (value.name == 'intake_name') {
                    html += "<th style='border:1px solid #e2e2e2; background-color:#E9EEF0!important;-webkit-print-color-adjust:exact;border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                } else if (value.name == 'categoryname') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                    //} else if (value.name == 'plaintiff_name') {
                    //    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                } else if (value.name == 'created_by') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                } else if (value.name == 'date_filed_date') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                }
                // else if (value.name == 'currentlyusedby') {
                //     html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                // } 
                else { html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + value.desc + "</th>"; }
            });
            html += "</tr>";



            angular.forEach(dataList, function (data) {
                html += "<tr>";
                angular.forEach(title, function (titlevalue, titlekey) {
                    var val = (_.isNull(data[titlevalue.name])) ? '' : data[titlevalue.name];
                    if (titlevalue.name == 'documentname') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + utils.removeunwantedHTML(val) + "</td>";
                    } else if (titlevalue.name == 'intake_name') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + utils.removeunwantedHTML(val) + "</td>";
                    } else if (titlevalue.name == 'categoryname') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                        //} else if (titlevalue.name == 'plaintiff_name') {
                        //   html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                    } else if (titlevalue.name == 'created_by') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                    } else if (titlevalue.name == 'currentlyusedby') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                    } else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                    }
                });
                html += "</tr>";
            });

            html += "</body>";
            html += "</table>";
            html += "</html>";
            return html;
        }

    };
})();
