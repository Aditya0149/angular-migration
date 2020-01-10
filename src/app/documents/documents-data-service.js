/* Document module data services
 * */
(function () {
    'use strict';

    angular
        .module('cloudlex.documents')
        .factory('documentsDataService', documentsDataService);

    documentsDataService.$inject = ["$http", "$q", "documentsConstants", "globalConstants", 'masterData'];

    function documentsDataService($http, $q, documentsConstants, globalConstants, masterData) {

        var docInfoObj = {};
        var discoveryData = null;

        var documentsService = {
            getDocumentsList: getDocumentsList,
            getDocumentsList_PHP: getDocumentsList_PHP,
            getDocumentCategories: getDocumentCategories,
            getPlaintiffs: getPlaintiffs,
            loaddocTags: loaddocTags,
            createEnvelop: createEnvelop,
            getDocumentDetails: getDocumentDetails,
            updateDocument: updateDocument,
            deleteDocument: deleteDocument,
            downloadDocument: downloadDocument,
            keepSessionalive: keepSessionalive,
            viewdocument: viewDocument,
            printdocuments: printdocuments,
            getDiscoveryData: getDiscoveryData,
            getDocumentInfo: getDocumentInfo,
            setDocumentInfo: setDocumentInfo,
            checkIfFileExists: checkIfFileExists,
            uploadOfficeDocs: uploadOfficeDocs,
            getOneDocumentDetails: getOneDocumentDetails,
            getOfficeStatus: getOfficeStatus,
            cloneSourceDocument: cloneSourceDocument,
            linkExsitingDocument: linkExsitingDocument,
            saveDocumentPermission: saveDocumentPermission,
            getSearchedData: getSearchedData
        };

        return documentsService;

        /**
         * Clone source document
         */
        function cloneSourceDocument(docDetails) {
            var deferred = $q.defer();
            var url = documentsConstants.RESTAPI.cloneSourceDocument;
            $http.post(url, docDetails)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        /** Link Exisiting Document */
        function linkExsitingDocument(docDetails) {
            var deferred = $q.defer();
            var moreInfoId = docDetails.matter_detail_id;
            var data = {
                doc_id: docDetails.document_id,
                more_info_type: docDetails.matter_detail_name,
                associated_party: {
                    associated_party_id: (utils.isNotEmptyVal(docDetails.associated_party_id) && docDetails.associated_party_id != 0) ? docDetails.associated_party_id : '',
                    associated_party_role: (utils.isNotEmptyVal(docDetails.associated_party_role) && docDetails.associated_party_role != 0) ? docDetails.associated_party_role : ''
                }
            };
            var url = documentsConstants.RESTAPI.linkDocument1 + "/link/" + moreInfoId;
            var deferred = $q.defer();
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "POST",
                data: data,
                headers: token// Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve();
            }).error(function (ee, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;
        }

        function getOfficeStatus() {
            var deferred = $q.defer();
            var url = documentsConstants.RESTAPI.getOfficeStatus;
            $http.get(url)
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function getOneDocumentDetails(docId, matterId) {
            var deferred = $q.defer();
            var url = documentsConstants.RESTAPI.getDocumentDetails1 + docId;
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function uploadOfficeDocs(params) {
            var deferred = $q.defer();
            var url = documentsConstants.RESTAPI.uploadDocument1;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "POST",
                data: params,
                headers: token
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function checkIfFileExists(fileID) {
            var deferred = $q.defer();
            var url = getURL(documentsConstants.RESTAPI.fileExists, fileID[0]);
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

        /* Get Document PHP */
        function getDocumentsList_PHP(alldocuments, matterId, mydocs, pagenum, pagesize, sortby, sortorder, filters, moreinfo, isglobal) {
            if (moreinfo == undefined) {
                moreinfo = '';
            }
            if (matterId > 0) {
                var url = documentsConstants.RESTAPI.getDocumentList + 'alldocuments=' + alldocuments + '&mydocs=' + mydocs + '&pageNum=' + pagenum + '&pageSize=' + pagesize + '&sortBy=' + sortby + '&sortOrder=' + sortorder + '&moreinfo=' + moreinfo;
            } else {
                var url = documentsConstants.RESTAPI.getDocumentList + 'alldocuments=' + alldocuments + '&mydocs=' + mydocs + '&pageNum=' + pagenum + '&pageSize=' + pagesize + '&sortBy=' + sortby + '&sortOrder=' + sortorder + '&moreinfo=' + moreinfo;
            }
            if (utils.isEmptyVal(filters)) {
                var filters = {};
                filters.matterid = matterId;
            }
            if (utils.isEmptyVal(filters.matterid)) {
                filters.matterid = matterId;
            }
            if (isglobal == false) {
                filters.is_matter = 1;
            }
            else {
                filters.is_matter = 0;
            }
            url += setFilters_PHP(filters);
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

        /*Get documents List*/
        function getDocumentsList(alldocuments, matterId, mydocs, pagenum, pagesize, sortby, sortorder, filters, moreinfo, isglobal) {
            if (moreinfo == undefined) {
                moreinfo = '';
            }
            if (matterId > 0) {
                var url = documentsConstants.RESTAPI.getDocumentList1 + 'all_documents=' + alldocuments + '&my_docs=' + mydocs + '&page_num=' + pagenum + '&page_size=' + pagesize + '&sort_by=' + sortby + '&sort_order=' + sortorder + '&more_info=' + moreinfo;
            } else {
                var url = documentsConstants.RESTAPI.getDocumentList1 + 'all_documents=' + alldocuments + '&my_docs=' + mydocs + '&page_num=' + pagenum + '&page_size=' + pagesize + '&sort_by=' + sortby + '&sort_order=' + sortorder + '&more_info=' + moreinfo;
            }
            if (utils.isEmptyVal(filters)) {
                var filters = {};
                filters.matterid = matterId;
            }
            if (utils.isEmptyVal(filters.matterid)) {
                filters.matterid = matterId;
            }
            if (isglobal == false) {
                filters.is_matter = 1;
            }
            else {
                filters.is_matter = 0;
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

        function setFilters(filters) {
            var filterParams = '';
            filterParams += '&category_filter=' + (utils.isNotEmptyVal(filters.category) ? filters.category : '');
            filterParams += '&plaintiff_filter=' + (utils.isNotEmptyVal(filters.plaintiff) ? filters.plaintiff : '');
            filterParams += '&party_role=' + (utils.isNotEmptyVal(filters.party_role) ? filters.party_role : '');
            filterParams += '&matter_filter=' + (utils.isNotEmptyVal(filters.matterid) ? filters.matterid : '');
            filterParams += '&updated_by_filter=' + (utils.isNotEmptyVal(filters.updatedByFilter) ? filters.updatedByFilter : '');
            filterParams += '&created_by_filter=' + (utils.isNotEmptyVal(filters.createdByFilter) ? filters.createdByFilter : '');
            filterParams += '&created_start=' + (utils.isNotEmptyVal(filters.c_start_date) ? filters.c_start_date : '');
            filterParams += '&created_end=' + (utils.isNotEmptyVal(filters.c_end_date) ? filters.c_end_date : '');
            filterParams += '&updated_start=' + (utils.isNotEmptyVal(filters.u_start_date) ? filters.u_start_date : '');
            filterParams += '&updated_end=' + (utils.isNotEmptyVal(filters.u_end_date) ? filters.u_end_date : '');
            filterParams += '&need_review_filter=' + (utils.isNotEmptyVal(filters.need_to_be_Reviewed) ? filters.need_to_be_Reviewed : '');
            filterParams += '&is_matter=' + filters.is_matter;

            return filterParams;
        }
        /** Filter Function for PHP Api */
        function setFilters_PHP(filters) {
            var filterParams = '';
            filterParams += '&categoryFilter=' + (utils.isNotEmptyVal(filters.category) ? filters.category : '');
            filterParams += '&plaintiffFilter=' + (utils.isNotEmptyVal(filters.plaintiff) ? filters.plaintiff : '');
            filterParams += '&party_role=' + (utils.isNotEmptyVal(filters.party_role) ? filters.party_role : '');
            filterParams += '&matterFilter=' + (utils.isNotEmptyVal(filters.matterid) ? filters.matterid : '');
            filterParams += '&updatedByFilter=' + (utils.isNotEmptyVal(filters.updatedByFilter) ? filters.updatedByFilter : '');
            filterParams += '&createdByFilter=' + (utils.isNotEmptyVal(filters.createdByFilter) ? filters.createdByFilter : '');
            filterParams += '&c_start_date=' + (utils.isNotEmptyVal(filters.c_start_date) ? filters.c_start_date : '');
            filterParams += '&c_end_date=' + (utils.isNotEmptyVal(filters.c_end_date) ? filters.c_end_date : '');
            filterParams += '&u_start_date=' + (utils.isNotEmptyVal(filters.u_start_date) ? filters.u_start_date : '');
            filterParams += '&u_end_date=' + (utils.isNotEmptyVal(filters.u_end_date) ? filters.u_end_date : '');
            filterParams += '&need_to_be_Reviewed=' + (utils.isNotEmptyVal(filters.need_to_be_Reviewed) ? filters.need_to_be_Reviewed : '');
            filterParams += '&is_matter=' + filters.is_matter;

            return filterParams;
        }

        /*Get the Document Categories*/
        function getDocumentCategories() {
            var deferred = $q.defer();
            var mData = masterData.getMasterData();
            if (utils.isEmptyObj(mData)) {
                masterData.fetchMasterData().then(function (data) {
                    deferred.resolve(data.documents_cat);
                });
            } else {
                deferred.resolve(mData.documents_cat);
            }
            return deferred.promise;
        }

        function getDiscoveryData() {
            var deferred = $q.defer();
            if (discoveryData == null) {
                $http({
                    url: documentsConstants.RESTAPI.discoveryUrl1,
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

            if (isNaN(matterId)) {
                return '';
            }
            var deferred = $q.defer();
            var url = documentsConstants.RESTAPI.documentPlaintiffs + matterId + '.json';
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function (response, status) {
                var data = response;
                var docPlaintiffs = [];
                var i = 0;
                angular.forEach(data, function (datavalue, datakey) {
                    docPlaintiffs[i] = {};
                    docPlaintiffs[i].plaintiffID = datavalue.plaintiffid;
                    docPlaintiffs[i].plaintiffName = datavalue.firstname;
                    if (datavalue.middelname != '' && datavalue.middelname != null) {
                        docPlaintiffs[i].plaintiffName = docPlaintiffs[i].plaintiffName + ' ' + datavalue.middelname;
                    }

                    if (datavalue.lastname != '' && datavalue.lastname != null) {
                        docPlaintiffs[i].plaintiffName = docPlaintiffs[i].plaintiffName + ' ' + datavalue.lastname;
                    }
                    i++;
                });
                deferred.resolve(docPlaintiffs);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        /*Function to get the tags from server*/
        function loaddocTags(data) {
            var deferred = $q.defer();
            var sTag = data.searchtag;
            var exTag = utils.isNotEmptyVal(data.excludetags) ? _.pluck(data.excludetags, 'name') : "";
            exTag = exTag.toString();
            var tagData = { "search_tag": sTag, "exclude_tag": exTag }
            var url = documentsConstants.RESTAPI.getTags1;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "POST",
                headers: token,// Add params into headers
                data: tagData
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        // US:16596 DocuSign
        function createEnvelop(tagData) {
            var deferred = $q.defer();
            var url = documentsConstants.RESTAPI.createEnvelopUrl;
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

        function getDocumentDetails(matterId, documentId) {
            var deferred = $q.defer();
            var url = documentsConstants.RESTAPI.getSingleDoc1 + documentId
            $http({
                url: url,
                method: "GET",
                withCredentials: true
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function updateDocument(data) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            var url = documentsConstants.RESTAPI.updateDocument1 + data.doc_id;
            $http({
                url: url,
                method: "PUT",
                headers: token,
                data: data
            }).then(function (response) {
                console.log(response);
                deferred.resolve(response);
            }, function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        }

        function deleteDocument(data) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            var url = documentsConstants.RESTAPI.deleteDocument1 + data.docID.join(",");
            $http({
                url: url,
                method: "DELETE",
                headers: token,
            }).success(function(response, status, headers, config) {
                deferred.resolve(response);
            }).error(function(ee, status, headers, config) {
                ee.status = status;
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        /*Get the single document from azure storage */
        function downloadDocument(documentId) {
            var deferred = $q.defer();
            var url = documentsConstants.RESTAPI.downloadDocument1 + documentId;
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
            var url = documentsConstants.RESTAPI.keepsessionalive;
            return $http.get(url);
        }

        function getURL(serviceUrl, id) {
            var url = serviceUrl.replace("[ID]", id);
            return url;
        }

        /*view the document in new browser window*/
        function viewDocument(documentId) {
            var deferred = $q.defer();
            var url = documentsConstants.RESTAPI.viewDocument1 + documentId + '?doctype=doc';
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
        function getSearchedData(alldocuments, matterId, mydocs, pagenum, pagesize, sortby, sortorder, filters, moreinfo, isglobal, searchText) {
            if (moreinfo == undefined) {
                moreinfo = '';
            }
            if (matterId > 0) {
                var url = documentsConstants.RESTAPI.docSearchUrl + 'all_documents=' + alldocuments + '&my_docs=' + mydocs + '&page_num=' + pagenum + '&page_size=' + pagesize + '&sort_by=' + sortby + '&sort_order=' + sortorder + '&more_info=' + moreinfo + '&search_string=' +searchText;
            } else {
                var url = documentsConstants.RESTAPI.docSearchUrl + 'all_documents=' + alldocuments + '&my_docs=' + mydocs + '&page_num=' + pagenum + '&page_size=' + pagesize + '&sort_by=' + sortby + '&sort_order=' + sortorder + '&more_info=' + moreinfo + '&search_string=' +searchText;
            }
            if (utils.isEmptyVal(filters)) {
                var filters = {};
                filters.matterid = matterId;
            }
            if (utils.isEmptyVal(filters.matterid)) {
                filters.matterid = matterId;
            }
            if (isglobal == false) {
                filters.is_matter = 1;
            }
            else {
                filters.is_matter = 0;
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
        function printdocuments(data, filters, sortorder, fileNum) {
            var output = getDataListTable(data, filters, sortorder, fileNum);
            window.open().document.write(output);
        }
        function getDataListTable(dataList, filters, sortorder, fileNum) {
            var filterobj = [];
            var CategoryStr = [];
            var mattername = utils.isEmptyVal(dataList[0]) ? '' : dataList[0].matter_name;
            _.forEach(filters, function (item) {
                if (item.key == "need_to_be_Reviewed") {
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
            if (fileNum) {
                filterobj.push("Matter Name: " + mattername);
                filterobj.push("File #: " + fileNum);
            }

            filterobj.push("ORDERED BY: " + sortorder);
            var title = [
                { name: 'doc_name', desc: 'Document Name' },
                { name: 'matter_name', desc: 'Matter Name' },
                { name: 'categoryname', desc: 'Category' },
                { name: 'plaintiff_name', desc: 'Associated Party' },
                { name: 'created_by_name', desc: 'Created By' },
                { name: 'date_filed_date', desc: 'Date Filed' }
                // { name: 'currentlyusedby', desc: 'Currently Used By' }    
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
                    html += "<th style='width: 35%;border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                } else if (value.name == 'matter_name') {
                    html += "<th style='width: 25%;border:1px solid #e2e2e2; background-color:#E9EEF0!important;-webkit-print-color-adjust:exact;border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                } else if (value.name == 'categoryname') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                } else if (value.name == 'plaintiff_name') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                } else if (value.name == 'created_by_name') {
                    html += "<th style='width: 10%;border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                } else if (value.name == 'date_filed_date') {
                    html += "<th style='width: 7%;border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
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
                    } else if (titlevalue.name == 'matter_name') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + utils.removeunwantedHTML(val) + "</td>";
                    } else if (titlevalue.name == 'categoryname') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + utils.removeunwantedHTML(val) + "</td>";
                    } else if (titlevalue.name == 'plaintiff_name') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + utils.removeunwantedHTML(val) + "</td>";
                    } else if (titlevalue.name == 'created_by') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + utils.removeunwantedHTML(val) + "</td>";
                    } else if (titlevalue.name == 'date_filed_date') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + utils.removeunwantedHTML(val) + "</td>";
                    } else if (titlevalue.name == 'currentlyusedby') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + utils.removeunwantedHTML(val) + "</td>";
                    } else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + utils.removeunwantedHTML(val) + "</td>";
                    }
                });
                html += "</tr>";
            });

            html += "</body>";
            html += "</table>";
            html += "</html>";
            return html;
        }

        // Matter Collaboration Permission Modify
        function saveDocumentPermission(data) {
            var deferred = $q.defer();
            var url = documentsConstants.RESTAPI.savePermission;
            var deferred = $q.defer();
            var token = {
                'clxAuthToken': localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "PUT",
                data: data,
                headers: token// Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

    };
})();
