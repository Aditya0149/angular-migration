(function () {
    'use strict';

    angular
        .module('cloudlex.matter')
        .factory('matterFactory', matterService);

    matterService.$inject = ['$http', '$q', '$filter', 'matterConstants', '$rootScope',
        'globalConstants', 'routeManager', 'pendingRequests', 'globalContactConstants'
    ];

    function matterService($http, $q, $filter, matterConstants, $rootScope,
        globalConstants, routeManager, pendingRequests, globalContactConstants) {

        var matterInfo = {};
        //TODO : move to utils
        function getParams(params) {
            var querystring = "";
            angular.forEach(params, function (value, key) {
                querystring += key + "=" + value;
                querystring += "&";
            });
            return querystring.slice(0, querystring.length - 1);
        }

        var matterFactory = {
            getMatterInfo: getMatterInfo,
            closeEventTask: closeEventTask,
            closeEventTask_JAVA: closeEventTask_JAVA,
            setMatterData: setMatterData,
            getMatterData: getMatterData,
            fetchMatterData: fetchMatterData,
            setBreadcrum: setBreadcrum,
            setBreadcrumWithPromise: setBreadcrumWithPromise,
            getMaster: getMaster,
            getMatter: getMatter,
            deleteMatters: deleteMatters,
            addMatter: addMatter,
            editMatter: editMatter,
            getMatterList: getMatterList,
            getMatterCount: getMatterCount,
            getAllMatters: getAllMatters,
            getMatterById: getMatterById,
            getImportantDates: getImportantDates,
            getUserAssignment: getUserAssignment,
            getStatusWiseCounts: getStatusWiseCounts,
            downloadMatters: downloadMatters,
            exportMatterList: exportMatterList,
            uploadMatters: uploadMatters,
            printMatters: printMatters,
            getMatterOverview: getMatterOverview,
            getEvidencePhotos: getEvidencePhotos,
            setMatterOverviewVM: setMatterOverviewVM,
            searchMatters: searchMatters,
            getMotionDetails: getMotionDetails,
            getAllUsers: getAllUsers,
            getContactsByName: getContactsByName,
            setNamePropForContacts: setNamePropForContacts,
            setNamePropForContactsOffDrupal: setNamePropForContactsOffDrupal,
            setDataPropForContactsFromOffDrupalToNormalContact: setDataPropForContactsFromOffDrupalToNormalContact,
            getContactById: getContactById,
            printMatterOverview: printMatterOverview,
            getValuationData: getValuationData,
            archiveMatters: archiveMatters,
            getFormatteddate: getFormatteddate,
            //archive matter list 
            getArchiveMatterList: getArchiveMatterList,
            // getArchiveMatterCount: getArchiveMatterCount,
            printArchiveMatters: printArchiveMatters,
            downloadArchivedMatters: downloadArchivedMatters,
            getArchiveMatterData: getArchiveMatterData,
            setRetrieveArchivedMatter: setRetrieveArchivedMatter,
            setContactType: setContactType,
            getMatterCollaboratedEntity: getMatterCollaboratedEntity,
            saveMatterId: saveMatterId,
            getMatterid: getMatterid
        };
        var matterid;
        function saveMatterId(data) {
            matterid = data;
        }

        function getMatterid() {
            return matterid;
        }

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

        function postCall(url, data) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "POST",
                headers: token,
                data: data
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        function putCall(url, data) {
            var deferred = $q.defer();
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
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        function deleteCall(url, data) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: url,
                method: "DELETE",
                headers: token,
                data: data
            })
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        function setContactType(postData) {
            var contact = {};
            var postObj = {};
            contact.filter = {};
            postObj.contact = [];
            // contact.type = [];
            contact.type = postData.type;
            contact.filter.fname = utils.isNotEmptyVal(postData.fname) ? postData.fname : '';
            postObj.contact.push(contact);
            return postObj;
        }

        // US:5011->5245 Retrive archived matters
        function setRetrieveArchivedMatter(selectedMatters, retrieveMatterflag) {
            var data = { "matterIds": selectedMatters.toString() };
            var url = matterConstants.RESTAPI.retrieveMatters;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            // url += '?' + getParams(data);
            // url += '&flag=' + retrieveMatterflag;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "PUT",
                data: data,
                headers: token
            }).success(function (response, status, headers, config) {
                deferred.resolve();
            }).error(function (ee, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;
        }

        function getMatterInfo(matterId) {
            var deferred = $q.defer();
            $http({
                url: matterConstants.RESTAPI.matterInfo + matterId,
                method: "GET"
            }).then(function (response) {
                var md = response.data[0];
                md.intake_date = md.dateofincidence ? moment.unix(md.dateofincidence).utc().format('MM/DD/YYYY') : '';
                md.date_birth = md.dateofbirth ? moment.unix(md.dateofbirth).utc().format('MM/DD/YYYY') : '';
                var res = {
                    data: [
                    ]
                };
                res.data.push(md);
                deferred.resolve(res);
            }, function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function closeEventTask(matterId) {
            var url = matterConstants.RESTAPI.markCompleteTaskEvent + matterId;
            var canceller = $q.defer();
            pendingRequests.add({ url: url, canceller: canceller });
            return $http.put(url, { timeout: canceller.promise });
        }
        function closeEventTask_JAVA(matterId) {
            var deferred = $q.defer();
            var url = matterConstants.RESTAPI.markCompleteTaskEvent1.replace('{matterid}', matterId);
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            return $http({
                url: url,
                method: "PUT",
                data: '"timeout":{}',
                headers: token
            }).success(function (response, status, headers, config) {
                deferred.resolve();
            }).error(function (ee, status, headers, config) {
                deferred.reject();
            });
        }

        function getFormatteddate(epoch) {
            var formdate = new Date(epoch * 1000);
            formdate = moment(formdate).format('MM/DD/YYYY');
            return formdate;
        }

        function setMatterData(data) {
            if (data.matter_archive_status && (data.matter_archive_status == null || data.matter_archive_status == 1 || data.matter_archive_status == 2 || data.matter_archive_status == 3)) {
                data.archivalMatterReadOnlyFlag = true;
                $rootScope.archivalMatterReadOnlyFlag = true;
            } else {
                data.archivalMatterReadOnlyFlag = false;
                $rootScope.archivalMatterReadOnlyFlag = false;
            }
            matterInfo = data;
        }

        function getMatterData(matterId) {
            if (utils.isEmptyObj(matterInfo) && matterId) {
                getMatterInfo(matterId).then(function (response) {
                    var matterInfo = response.data[0];
                    setMatterData(matterInfo);
                    return matterInfo;
                }, function (error) {
                    return matterInfo;
                });
            } else {
                return matterInfo;
            }

        }

        function fetchMatterData(matterId) {
            var deferred = $q.defer();
            if (utils.isEmptyObj(matterInfo)) {
                getMatterInfo(matterId).then(function (response) {
                    var matterInfo = response.data[0];
                    setMatterData(matterInfo);
                    deferred.resolve(matterInfo);
                }, function (error) {
                    deferred.reject([]);
                });
            } else {
                deferred.resolve(matterInfo);
            }
            return deferred.promise;
        }

        function setBreadcrumWithPromise(matterId, pagename) {
            var deferred = $q.defer();

            var initCrum = [{ name: '...' }];
            routeManager.setBreadcrum(initCrum);

            var matterInfo = getMatterData();

            if (utils.isEmptyObj(matterInfo) || (parseInt(matterInfo.matter_id) !== parseInt(matterId))) {
                getMatterInfo(matterId).then(function (response) {

                    var matterInfo = response.data[0];
                    setMatterData(matterInfo);
                    setApp(matterInfo);
                    var breadcrum = [{ name: matterInfo.matter_name, state: 'add-overview', param: { matterId: matterId } },
                    { name: pagename }
                    ];
                    routeManager.addToBreadcrum(breadcrum);
                    deferred.resolve(matterInfo);
                }, function (error) {
                    deferred.reject([]);
                });
            } else {
                var breadcrum = [{ name: matterInfo.matter_name, state: 'add-overview', param: { matterId: matterId } },
                { name: pagename }
                ];
                setApp(matterInfo);
                routeManager.addToBreadcrum(breadcrum);
                deferred.resolve(matterInfo);
            }

            return deferred.promise;
        }

        function setApp(data) {
            var isArchived = false;
            if (data.matter_archive_status && (data.matter_archive_status == null || data.matter_archive_status == 1 || data.matter_archive_status == 2 || data.matter_archive_status == 3)) {
                isArchived = true;
                $rootScope.archivalMatterReadOnlyFlag = true;
            } else {
                isArchived = false;
                $rootScope.archivalMatterReadOnlyFlag = false;
            }

            if (isArchived) {
                $rootScope.onLauncher = false;
                $rootScope.onMatter = false;
                $rootScope.onIntake = false;
                $rootScope.onReferral = false;
                $rootScope.onArchival = true;
                $rootScope.onMarkerplace = false;
                $rootScope.onExpense = false;
                $rootScope.onReferralPrg = false;
            } else {
                $rootScope.onLauncher = false;
                $rootScope.onMatter = true;
                $rootScope.onIntake = false;
                $rootScope.onReferral = false;
                $rootScope.onArchival = false;
                $rootScope.onMarkerplace = false;
                $rootScope.onExpense = false;
                $rootScope.onReferralPrg = false;
            }
        }

        function setBreadcrum(matterId, pagename) {
            var initCrum = [{ name: '...' }];
            routeManager.setBreadcrum(initCrum);

            var matterInfo = getMatterData();

            //fetch matter info if it dosen't exists
            if (utils.isEmptyObj(matterInfo) || (parseInt(matterInfo.matter_id) !== parseInt(matterId))) {
                getMatterInfo(matterId).then(function (response) {
                    var matterInfo = response.data[0];
                    setMatterData(matterInfo);
                    var breadcrum = [{ name: matterInfo.matter_name, state: 'add-overview', param: { matterId: matterId } },
                    { name: pagename }
                    ];
                    routeManager.addToBreadcrum(breadcrum);
                });
            } else {
                var breadcrum = [{ name: matterInfo.matter_name, state: 'add-overview', param: { matterId: matterId } },
                { name: pagename }
                ];
                routeManager.addToBreadcrum(breadcrum);
            }
        }

        function getMaster(data) {
            var deferred = $q.defer();
            $http({
                url: matterConstants.RESTAPI.master,
                method: "GET",
                withCredentials: true
            }).success(function (response, status) {
                var res = angular.copy(response);
                response = {};
                response = utils.mapKeys(res);
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });

            return deferred.promise;
        }

        function getMatter(requestFilters) {
            var deferred = $q.defer();
            $http({
                url: matterConstants.RESTAPI.matter,
                method: "GET",
                params: requestFilters,
                withCredentials: true
            }).success(function (response) {
                deferred.resolve(response);
            });

            return deferred.promise;
        }

        function deleteMatters(matterIds) {
            var data = { 'mids': "[" + matterIds.toString() + "]" };
            var url = matterConstants.RESTAPI.deleteMatter + '?' + getParams(data);
            return $http({
                url: url,
                method: "DELETE"
            });
        }

        // function getArchiveMatterData(matterIds) {
        //     var data = { 'mids': matterIds.toString() };
        //     var response;
        //     var url = matterConstants.RESTAPI.archivematterData + '?' + getParams(data);
        //     return $http.get(url, data);
        // }

        function getArchiveMatterData(matterIds) {
            var data = { "matterIds": matterIds.toString() };
            var url = matterConstants.RESTAPI.archivematterData;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            // url += '?' + getParams(data);
            // url += '&flag=' + retrieveMatterflag;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "PUT",
                data: data,
                headers: token
            }).success(function (response, status, headers, config) {
                deferred.resolve();
            }).error(function (ee, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;
        }

        function archiveMatters(matterIds, archiveAmount) {
            var data = {
                'mids': "[" + matterIds + "]",
                amount: archiveAmount,
                'pageNum': 1,
                'pageSize': 100
            };
            var url = matterConstants.RESTAPI.archivePayment + '?' + getParams(data);
            return $http.get(url, data)
        }

        function addMatter(data) {
            //data.importantdates = "[" + data.importantdates.toString() + "]";
            var deferred = $q.defer();
            var url = matterConstants.RESTAPI.addMatter;
            //url += getParams(data);
            $http.post(url, data)
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });
            /*$http({
                url: url,
                method: "POST",
                withCredentials: true,
                headers: {
                    'X-CSRF-Token': userSession.token,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                }
            }).success(function (response, status) {
                console.log(status);
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                console.log(status);
                deferred.reject(ee);
            });;*/

            return deferred.promise;
        }

        function editMatter(data, matterId) {
            var url = matterConstants.RESTAPI.addMatter + '/' + matterId;
            return $http.put(url, data);
        }

        function getMatterList(requestFilters, allMatter) {
            var statusKey = requestFilters.statusFilter;
            delete requestFilters.statusFilter;
            var url = (allMatter == 1) ? matterConstants.RESTAPI.allMatters : matterConstants.RESTAPI.myMatters;
            url += '?statusFilter=' + encodeURIComponent(statusKey) + '&' + getParams(requestFilters);
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

        function getMatterCount(filters, allMatter) {
            var url = (allMatter == 1) ? matterConstants.RESTAPI.getAllMatterCount : matterConstants.RESTAPI.getMyMatterCount;
            url += '?' + getParams(filters);
            return $http.get(url);
        }

        //US#5160 -  API Call for Get Archive matter List...... Start
        function getArchiveMatterList(requestFilters, allMatter) {
            var url = matterConstants.RESTAPI.allArchiveMatters;
            url += '?' + getParams(requestFilters);
            url = url.replace(/[[]*]*/g, "");
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                // withCredentials: true
            }).success(function (response) {
                deferred.resolve(response);
            });
            return deferred.promise;
        }

        //function getArchiveMatterCount(filters, allMatter) {
        //  var url = matterConstants.RESTAPI.getAllArchiveMatterCount;
        //url += '?' + getParams(filters);
        //return $http.get(url);
        //}

        //... End 
        function getAllMatters(requestFilters, allMatter) {
            var url = (allMatter == 1) ? matterConstants.RESTAPI.allMatters : matterConstants.RESTAPI.myMatters;
            requestedFilters.pageSize = "all";
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

        function getMatterById(matterId) {
            var url = matterConstants.RESTAPI.getMatterById + matterId;
            return $http({
                url: url,
                method: "GET",
                withCredentials: true
            });
        }

        function getImportantDates(matterId) {
            var url = matterConstants.RESTAPI.getImportantDates;
            url += matterId;
            var deferred = $q.defer();
            return $http({
                url: url,
                method: "GET",
                withCredentials: true
            });
        }

        function getUserAssignment(matterId) {
            var url = matterConstants.RESTAPI.getUserAssignment + matterId;
            return $http({
                url: url,
                method: "GET",
                withCredentials: true
            });
        }

        function getStatusWiseCounts(flagVal) {
            var deferred = $q.defer();
            $http({
                url: matterConstants.RESTAPI.statusWiseCounts + "?isMyMatter" + flagVal,
                method: "GET",
                params: {
                    flag: flagVal
                },
                withCredentials: true,
            }).success(function (response) {
                deferred.resolve(response);
            });

            return deferred.promise;
        }

        function downloadMatters(popUpFilters, pageFilters, allMatter) {
            //popUpFilters["reportname"] = "all_matters_list";
            popUpFilters["reportname"] = (allMatter == 1) ? "all_matters_list" : "matters_list";
            popUpFilters["filename"] = "Matter_List.xlsx";
            popUpFilters["type"] = "excel";
            popUpFilters["user"] = "all-users";

            var url = matterConstants.RESTAPI.downloadMatter;
            url += '?' + utils.getParams(popUpFilters)
            var download = window.open(url, '_self');
        }

        function exportMatterList(popUpFilters) {
            var statusKey = popUpFilters.statusFilter;
            delete popUpFilters.statusFilter;
            //popUpFilters.pageSize = 1000;
            var url = matterConstants.RESTAPI.exportMyAllMatterList;
            url += '?statusFilter=' + encodeURIComponent(statusKey) + '&' + getParams(popUpFilters);
            var tz = utils.getTimezone();
            var timeZone = moment.tz.guess();
            url += '&tz=' + timeZone;
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                responseType: 'arraybuffer',
            })
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        function downloadArchivedMatters(popUpFilters, pageFilters, allMatter) {

            popUpFilters["reportname"] = 'archive_matters_list';
            popUpFilters["filename"] = "Archive_Matter_List.xlsx";
            popUpFilters["type"] = "excel";
            popUpFilters["user"] = "all-users";

            var url = matterConstants.RESTAPI.downloadArchiveMatter;
            url += '?' + utils.getParams(popUpFilters)
            var download = window.open(url, '_self');
        }

        function uploadMatters() { }

        function printMatters(dataList, filters) {
            var output = getDataListTable(dataList, filters);
            window.open().document.write(output);
        }


        function printArchiveMatters(dataList, filters) {
            var output = getArchiveDataListTable(dataList, filters);
            window.open().document.write(output);
        }

        function getArchiveDataListTable(dataList, filters) {
            var title = [
                { name: 'matter_name', desc: 'Matter Name' },
                { name: 'file_number', desc: 'File#' },
                { name: 'index_number', desc: 'Index/Docket#' },
                { name: 'status', desc: 'Archival Status' },
                { name: 'matter_type_name', desc: 'Type' },
                { name: 'matter_sub_type_name', desc: 'Sub Type' },
                { name: 'law_type_name', desc: 'Law Type' },
                { name: 'category_name', desc: 'Category' },
                { name: 'mattercourt', desc: 'Court' },
                { name: 'venue_name', desc: 'Venue' },
                { name: 'matter_archive_date', desc: 'Matter Archival Date' },
                { name: 'dateofincidence', desc: 'Date of Incident' },
                { name: 'settlement_date', desc: 'Settlement Date' },
                { name: 'settlement_amount', desc: 'Settlement Amount' },
                { name: 'total_paid', desc: 'Total Paid' },
                { name: 'outstanding_amount', desc: 'Outstanding Amount' },
                { name: 'retainer_no', desc: 'Retainer No' },
                { name: 'closing_statement_no', desc: 'Closing Statement No' },
                // { name: 'matter_closure_date', desc: 'Matter Closure Date' },


            ];

            var html = "<html><title> Archive Matter List</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}</style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt;'><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/> Archive Matter List</h1><div></div>";
            html += "<body>";
            html += "<div><h2 style='text-align:left;padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";

            angular.forEach(filters, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><label><strong>" + val.name + " : </strong></label>";
                _.forEach(val.data, function (item, index) {
                    html += "<span style='padding:5px'> " + item;
                    if (index + 1 < val.data.length) {
                        html += " , "
                    }
                    html += "</span>";
                });
                html += "</div>";
            });

            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "<table style='border:1px solid #e2e2e2;width:100%;text-align: left; font-size:8pt;' cellspacing='0' cellpadding='0' border='0'>";
            html += "<tr>";
            angular.forEach(title, function (value, key) {

                if (value.name == 'matter_archive_date') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'dateofincidence') {
                    html += "<th style='border:1px solid #e2e2e2; background-color:#E9EEF0!important;-webkit-print-color-adjust:exact;border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                }
                else if (value.name == 'settlement_date') {
                    html += "<th style='border:1px solid #e2e2e2; background-color:#E9EEF0!important;-webkit-print-color-adjust:exact;border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                }
                else if (value.name == 'file_number') {
                    html += "<th style='border:1px solid #e2e2e2; background-color:#E9EEF0!important;-webkit-print-color-adjust:exact;border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'index_number') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else { html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + value.desc + "</th>"; }
            });
            html += "</tr>";



            angular.forEach(dataList, function (data) {
                html += "<tr>";
                angular.forEach(title, function (titlevalue, titlekey) {
                    var val = (_.isNull(data[titlevalue.name])) ? '' : data[titlevalue.name];
                    if (titlevalue.name == 'matter_archive_date') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" + moment.utc(val, 'X').format('MM/DD/YYYY') + "</td>";
                    } else if (titlevalue.name == 'dateofincidence') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" + (utils.isEmptyVal(val) ? ' ' : moment.utc(val, 'X').format('MM/DD/YYYY')) + "</td>";
                    }
                    else if (titlevalue.name == 'settlement_date') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" + (utils.isEmptyVal(val) ? ' ' : moment.utc(val, 'X').format('MM/DD/YYYY')) + "</td>";
                    }
                    //  else if (titlevalue.name == 'matter_closure_date') {
                    //     html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" + moment.unix(val).format('MM/DD/YYYY') + "</td>";
                    // }
                    else if (titlevalue.name == 'file_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" + val + "</td>";
                    } else if (titlevalue.name == 'index_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" + val + "</td>";
                    } else if (titlevalue.name == 'settlement_amount') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" +
                            (utils.isEmptyVal(val) ? ' ' : ('$' + $filter('number')(val, 2))) + "</td>";
                    }
                    else if (titlevalue.name == 'total_paid') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" +
                            (utils.isEmptyVal(val) ? ' ' : ('$' + $filter('number')(val, 2))) + "</td>";
                    } else if (titlevalue.name == 'outstanding_amount') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" +
                            (utils.isEmptyVal(val) ? ' ' : ('$' + $filter('number')(val, 2))) + "</td>";
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

        function removeunwantedHTML(value) {
            if (utils.isHTML(value)) {
                value = utils.replaceHtmlEntites(value.replace(/<\/?[^>]+>/gi, ''));
            }
            return value;
        }

        function getDataListTable(dataList, filters) {
            var stalledCase = angular.isUndefined(filters.statusCase) ? '' : filters.statusCase.name;
            var title = [
                { name: 'matter_name', desc: 'Matter Name' },
                { name: 'file_number', desc: 'File#' },
                { name: 'index_number', desc: 'Index/Docket#' },
                { name: 'date_of_incidence', desc: 'Date of Incident' },
                { name: 'status', desc: 'Status' },
                { name: 'sub_status', desc: 'Sub Status' },
                { name: 'type', desc: 'Type' },
                { name: 'sub_type', desc: 'Sub Type' },
                { name: 'law_type_name', desc: 'Law Type' },
                { name: 'category', desc: 'Category' },
                { name: 'plaintiff_name', desc: 'Plaintiff Name' }, //plaintiff column added     
                { name: 'courtName', desc: 'Court' },
                { name: 'courtVenue', desc: 'Venue' },
                { name: 'matter_lead_attorney', desc: 'Lead Attorney' },
                { name: 'matter_attorney', desc: 'Attorney' }
            ];

            var html = "<html><title>" + stalledCase + " Matter List</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}</style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt;'><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/><span>" + stalledCase + "</span> Matter List</h1><div></div>";
            html += "<body>";
            html += "<div><h2 style='text-align:left;padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";

            var updateFilters = _.filter(filters, function (status) {
                return status.name != 'Stalled';
            });
            angular.forEach(updateFilters, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'><label><strong>" + val.name + " : </strong></label>";
                _.forEach(val.data, function (item, index) {
                    html += "<span style='padding:2px'>" + item;
                    if (index + 1 < val.data.length) {
                        html += ","
                    }
                    html += "</span>";
                });
                html += "</div>";
            });

            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "<table style='border:1px solid #e2e2e2;width:100%;text-align: left; font-size:8pt;' cellspacing='0' cellpadding='0' border='0'>";
            html += "<tr>";
            angular.forEach(title, function (value, key) {
                if (value.name == 'date_of_incidence') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'file_number') {
                    html += "<th style='border:1px solid #e2e2e2; background-color:#E9EEF0!important;-webkit-print-color-adjust:exact;border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'index_number') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else { html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + value.desc + "</th>"; }
            });
            html += "</tr>";



            angular.forEach(dataList, function (data) {
                html += "<tr>";
                angular.forEach(title, function (titlevalue, titlekey) {
                    var val = (_.isNull(data[titlevalue.name])) ? '' : data[titlevalue.name];
                    val = removeunwantedHTML(val)
                    if (titlevalue.name == 'date_of_incidence') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" + (utils.isEmptyVal(val) || (val == 0) ? "-" : (moment.unix(val).utc().format('MM/DD/YYYY'))) + "</td>";
                    } else if (titlevalue.name == 'file_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" + val + "</td>";
                    } else if (titlevalue.name == 'index_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" + val + "</td>";
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

        function getMatterOverview(matterId) {
            var today = moment().startOf('day');
            today = utils.getUTCTimeStamp(today);
            var url = globalConstants.webServiceBase + 'matter/matter/';
            url += matterId + '?today=' + today;

            var canceller = $q.defer();
            pendingRequests.add({ url: url, canceller: canceller });
            return $http.get(url, { timeout: canceller.promise });
        }

        //motion
        function getMotionDetails(matterId) {
            var url = globalConstants.webServiceBase + 'lexviadocuments/accordianmotion.json';
            url = url + "?matterId=" + matterId;
            return $http.get(url);
        }

        function getEvidencePhotos(matterId) {
            var url = matterConstants.RESTAPI.evidencePhotos;
            url += matterId;
            return $http.get(url);
        }

        function setMatterOverviewVM(matterOverviewData) {
            var tasks = [];

            // Notes - replacing html content by spaces
            _.forEach(matterOverviewData.recent_notes, function (note) {
                setDisplayText(note);
            });

            var matterOverview = {
                matterInfo: matterOverviewData.matter_info[0],
                importantDates: matterOverviewData.important_dates,
                lastActivity: matterOverviewData.m_last_activity,
                todaysEvent: matterOverviewData.todays_events.data,
                tasksDueToday: getTodaysTasks(matterOverviewData.tasks_due_today.data),
                overdueTasks: getOverdueTasks(matterOverviewData.overdue_tasks.data),
                recentNotes: matterOverviewData.recent_notes,
                totalAge: getTotalMatterAge(matterOverviewData.matter_age),
                matterAge: setMatterAge(matterOverviewData.matter_age),
                latt: getAtty(matterOverviewData.assigned_users, 1),
                att: getAtty(matterOverviewData.assigned_users, 0),
                staff: getStaff(matterOverviewData.assigned_users),
                paralegal: getParalegal(matterOverviewData.assigned_users),
                plaintiffContact: setPlaintiff(matterOverviewData.plaintiffs),
                defendentContact: setDefendents(matterOverviewData.defendants),
                adjusterContact: setAdjuster(matterOverviewData.adjuster),
                referredToContact: setReferredTo(matterOverviewData.matter_info),
                referredByContact: setReferredBy(matterOverviewData.matter_info),
                plaintiffsContact: matterOverviewData.plaintiffs,
            };
            var common_attorney = getAtty(matterOverviewData.assigned_users, 2);
            common_attorney = _.unique(common_attorney);
            matterOverview.latt = matterOverview.latt.concat(common_attorney);
            matterOverview.att = matterOverview.att.concat(common_attorney);
            return matterOverview;
        }

        //Get first phone number
        function setReferredBy(referredBy) {
            _.forEach(referredBy, function (referredBy) {
                if (utils.isNotEmptyVal(referredBy.referred_by_data)) {
                    referredBy.referred_by_data.phone_number = utils.isNotEmptyVal(referredBy.referred_by_data.phone_number) ?
                        referredBy.referred_by_data.phone_number.split(',')[0] : '';
                }
            });
            return referredBy;
        }

        //Get first phone number
        function setReferredTo(referredTo) {
            _.forEach(referredTo, function (referredTo) {
                if (utils.isNotEmptyVal(referredTo.referred_to_data)) {
                    referredTo.referred_to_data.phone_number = utils.isNotEmptyVal(referredTo.referred_to_data.phone_number) ?
                        referredTo.referred_to_data.phone_number.split(',')[0] : '';

                }
            });
            return referredTo;
        }

        //Get first phone number
        function setPlaintiff(plaintiffs) {
            _.forEach(plaintiffs.data, function (plaintiff) {
                if (utils.isNotEmptyVal(plaintiff.contactid)) {
                    plaintiff.contactid.phone_number = utils.isNotEmptyVal(plaintiff.contactid.phone_number) ?
                        plaintiff.contactid.phone_number.split(',')[0] : '';
                }
                if (plaintiff.dateofbirth) {
                    plaintiff.dateofbirth = moment.unix(plaintiff.dateofbirth).utc().format('MM/DD/YYYY');
                } else {
                    plaintiff.dateofbirth = '-';
                }
                if ((!plaintiff.ssn) || (!utils.isNotEmptyVal(plaintiff.ssn))) {
                    plaintiff.ssn = '-';
                }
            });
            return plaintiffs;
        }

        //Get first phone number
        function setDefendents(defendents) {
            _.forEach(defendents.data, function (defendent) {
                if (utils.isNotEmptyVal(defendent.defendant_attorney)) {
                    defendent.defendant_attorney.phone_number = utils.isNotEmptyVal(defendent.defendant_attorney.phone_number) ?
                        defendent.defendant_attorney.phone_number.split(',')[0] : '';

                    defendent.defendant_attorney.phone_work = utils.isNotEmptyVal(defendent.defendant_attorney.phone_work) ?
                        defendent.defendant_attorney.phone_work.split(',')[0] : '';
                }
            });
            return defendents;
        }

        function setAdjuster(adjusters) {
            _.forEach(adjusters.insurance_adjuster, function (adjuster) {
                if (utils.isNotEmptyVal(adjuster)) {
                    adjuster.phone_work = utils.isNotEmptyVal(adjuster.phone_work) ?
                        adjuster.phone_work.split(',')[0] : '';
                }
            });
            return adjusters
        }

        function setDisplayText(note) {
            try {
                var text = utils.isHTML(note.text) ? $(note.text).text() : note.text;
                text = utils.replaceHtmlEntites(text.replace(/<\/?[^>]+>/gi, ''));
                note.text = text;
            } catch (e) {
                note.text = utils.replaceHtmlEntites(note.text.replace(/<\/?[^>]+>/gi, ''));
            }
        }

        function getTodaysTasks(allTasks) {
            var currentTasks = _.filter(allTasks, function (task) {
                var dueDate = moment.unix(task.dueutcdate);
                var todayStartOfDay = moment().startOf('day');
                return ((parseInt(task.percentagecomplete) < 100));
            });

            return currentTasks;
        }

        function getOverdueTasks(allTasks) {
            var overdueTasks = _.filter(allTasks, function (task) {
                var dueDate = moment.unix(task.dueutcdate);
                var todayStartOfDay = moment().startOf('day');
                return ((parseInt(task.percentagecomplete) < 100));
            });

            return overdueTasks;
        }

        function getTotalMatterAge(matterAge) {
            var cnt = 0;
            _.forEach(matterAge, function (age) {
                cnt += age.avg;
            });
            return cnt;
        }

        function setMatterAge(matterAge) {
            var statusOrder = ['New Case/Pre-Lit', 'Litigation', 'Discovery', 'Trial', 'Settled', 'Closed'];
            var matterAgeData = [];
            _.forEach(statusOrder, function (status) {
                var ageData = _.find(matterAge, function (age) {
                    return age.status === status;
                });
                if (ageData && ageData.avg <= 1) {
                    ageData.days = ageData.avg + " Day";
                    matterAgeData.push(ageData)
                }
                else if (ageData && ageData.avg > 1) {
                    ageData.days = ageData.avg + " Days";
                    matterAgeData.push(ageData)
                }
                else {
                    matterAgeData.push({ status: status, avg: "", days: "" });
                }
            });
            setIsCompleteFlag(matterAgeData);
            return matterAgeData;
        }

        function getAtty(assignedUsers, isLead) {
            if (utils.isEmptyVal(assignedUsers)) {
                return [];
            }

            var attorneys = assignedUsers.attorney;
            if (utils.isEmptyVal(attorneys)) {
                return [];
            }

            var attys = _.filter(attorneys, function (att) {
                return parseInt(att.islead) === isLead;
            });

            attys = attys.map(function (att) {
                var fullName = att.name + ' ' + att.lname;
                att.fullName = fullName;
                return att;
            });

            return attys;
        }

        function getStaff(users) {
            if (utils.isEmptyVal(users)) {
                return [];
            }

            var staffs = users.staffs;

            if (utils.isEmptyVal(staffs)) {
                return [];
            }

            staffs = staffs.map(function (staff) {
                var fullName = staff.name + ' ' + staff.lname;
                staff.fullName = fullName;
                return staff;
            });

            return staffs;
        }

        function getParalegal(users) {
            if (utils.isEmptyVal(users)) {
                return [];
            }

            var paralegals = users.paralegal

            if (utils.isEmptyVal(paralegals)) {
                return [];
            }

            paralegals = paralegals.map(function (paralegal) {
                var fullName = paralegal.name + ' ' + paralegal.lname;
                paralegal.fullName = fullName;
                return paralegal;
            });
            return paralegals;
        }

        function setIsCompleteFlag(matterAgeData) {
            var isCurrent = _.pluck(matterAgeData, 'isCurrent');
            var isCurrentIndex = isCurrent.indexOf(1);
            _.forEach(matterAgeData, function (ageData, index) {
                if (index < isCurrentIndex) {
                    ageData.isComplete = true;
                    ageData.days = utils.isEmptyVal(ageData.days) ? "0 Days" : ageData.days;
                }

                if (index > isCurrentIndex) {
                    ageData.days = "";
                }

            });
        }

        // function searchMatters(name) {
        //     var url = matterConstants.RESTAPI.searchMatter + name;
        //     return $http.get(url);
        // }

        // Java Call for matter search
        function searchMatters(name) {
            var deferred = $q.defer();
            var data = { "matter_name": name }
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: matterConstants.RESTAPI.searchMatter_OffDrupal,
                method: "POST",
                headers: token,
                data: data
            }).then(function (response) {
                    _.forEach(response.data, function (data) {
                        data['category_name'] = data.category;
                        data['filenumber'] = data.file_number;
                        data['matter_sub_type_name'] = data.sub_type;
                        data['matter_type_name'] = data.type;
                        data['matterid'] = (data.matter_id).toString();
                        data['name'] = data.matter_name;
                    });
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

        function getAllUsers() {
            var url = matterConstants.RESTAPI.allUsers;
            return $http.get(url);
        }

        function getContactsByName(name, isJavaConfig) {
            // var url = matterConstants.RESTAPI.getContactsUrl;
            // var params = { params: { 'fname': name } };
            // return $http.get(url, params);
            if (isJavaConfig) {
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

            } else {
                var deferred = $q.defer();
                $http.post(matterConstants.RESTAPI.getContactsUrl, name)
                    .then(function (response) {
                        deferred.resolve(response.data);
                    }, function (error) {
                        deferred.reject(error);
                    });

                return deferred.promise;
            }
        }

        function getContactById(id) {
            var url = matterConstants.RESTAPI.getContactById + id;
            return $http.get(url);
        }
        function setDataPropForContactsFromOffDrupalToNormalContact(contacts) {
            _.forEach(contacts, function (contact) {
                contact['city'] = utils.isNotEmptyVal(contact.address.city) ? contact.address.city : '';
                contact['country'] = utils.isNotEmptyVal(contact.address.country) ? contact.address.country : '';
                contact['state'] = utils.isNotEmptyVal(contact.address.state) ? contact.address.state : '';
                contact['street'] = utils.isNotEmptyVal(contact.address.street) ? contact.address.street : '';
                contact['zipcode'] = utils.isNotEmptyVal(contact.address.zip_code) ? contact.address.zip_code : '';
                contact['contactid'] = (contact.contact_id).toString();
                contact['firstname'] = angular.isDefined(contact.first_name) && !_.isNull(contact.first_name) ? contact.first_name : "";
                contact['lastname'] = angular.isDefined(contact.last_name) && !_.isNull(contact.last_name) ? contact.last_name : "";
            });
        }    
        function setNamePropForContactsOffDrupal(contacts) {
            _.forEach(contacts, function (contact) {
                contact.name = contact.first_name + ' ' + contact.last_name;
            });
        }
        function setNamePropForContacts(contacts) {
            _.forEach(contacts, function (contact) {
                contact.name = contact.firstname + ' ' + contact.lastname;
            });
        }

        function getNumberAndIcon(conObj, showOnlyWorkPhone) {
            var phone, img;
            if (showOnlyWorkPhone) {
                phone = "-";
                img = globalConstants.images_path + "print_work.svg";
                if (utils.isNotEmptyVal(conObj.phone_work)) {
                    phone = conObj.phone_work;
                }
            } else {
                if (utils.isNotEmptyVal(conObj.phone_cell)) {
                    phone = conObj.phone_cell;
                    img = globalConstants.images_path + "print_cell.svg";
                }
                else if (utils.isNotEmptyVal(conObj.phone_work)) {
                    phone = conObj.phone_work;
                    img = globalConstants.images_path + "print_work.svg";
                }
                else if (utils.isNotEmptyVal(conObj.phone_home)) {
                    phone = conObj.phone_home;
                    img = globalConstants.images_path + "print_home.svg";
                }
                else {
                    phone = "-";
                    img = globalConstants.images_path + "print_cell.svg";
                }
            }


            return {
                phone: phone,
                img: img
            }
        }

        function printMatterOverview(matterOverviewData) {
            var index_number = utils.isNotEmptyVal(matterOverviewData.matterInfo.index_number) ? matterOverviewData.matterInfo.index_number : '';
            var strVar = "";
            strVar += "<html><head><title>Matter Overview<\/title>";
            strVar += "<link rel='shortcut icon' href='favicon.ico' type='image\/vnd.microsoft.icon'>";
            strVar += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}</style>";
            strVar += "<\/head>";
            strVar += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 10pt; '><img src=\"styles\/images\/logo.png \" width='200px'\/>";
            strVar += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'\/>Matter Summary<\/h1>";
            strVar += "";
            strVar += "<div style=\"width:100%; clear:both\"><button onclick=\"window.print()\" style=\"margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;\" id=\"printBtn\">Print<\/button><\/div>";
            strVar += "    ";
            strVar += "    ";
            strVar += "<table style='width:100%;text-align: left; font-size:8pt;word-break:break-word;' cellspacing='0' cellpadding='0' border='0'>";
            strVar += "    <tr>";
            strVar += "        <td colspan=\"2\" style=\"width:100%;border-bottom:1px solid #e2e2e2; padding:10px 0; font-size: 16pt; \">";
            strVar += "            <div>" + utils.removeunwantedHTML(matterOverviewData.matterInfo.matter_name) + "<\/div>";
            strVar += "            <div>File #: " + utils.removeunwantedHTML(matterOverviewData.matterInfo.file_number) + "  <span style=\"padding-left: 10px;\"> Index/Docket#: " + utils.removeunwantedHTML(index_number) + "</span><\/div>";
            strVar += "        <\/td>";
            strVar += "    <\/tr>";
            strVar += "    ";
            strVar += "    <tr>";
            strVar += "        <td width=\"55%\" style=\"border-right:1px solid #e2e2e2; padding:0px 10px 10px 0;\" valign=\"top\">";
            strVar += "            <table>";
            strVar += "                <tr>";
            strVar += "                    <td style=\"border-bottom:1px solid #e2e2e2;padding:0 0 10px 0;\">";
            strVar += "                        <table  width=\"100%\">";
            strVar += "                            <tr>";
            strVar += "                                <td style=\"font-weight: bold;padding-bottom: 10px;font-size:18px;\">Matter Summary<\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            <tr>";
            strVar += "                                <td style=\"padding-left: 12px;\">";
            strVar += utils.removeunwantedHTML(matterOverviewData.matterInfo.summary);
            strVar += "                                <\/td>";
            strVar += "                            <\/tr>";
            strVar += "                        <\/table>";
            strVar += "                    <\/td>";
            strVar += "                <\/tr>";
            strVar += "                <tr>";
            strVar += "                    <td valign=\"top\" style=\"border-bottom:1px solid #e2e2e2;padding:0 0 10px 0;\">";
            strVar += "                        <table  width=\"100%\">";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" width=\"50%\"><strong>Matter Status:<\/strong> " + matterOverviewData.matterInfo.status_name + "<\/td>";
            strVar += "                                <td valign=\"top\" width=\"40%\"><strong>Sub-Status:<\/strong> " + matterOverviewData.matterInfo.sub_status_name + "<\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" width=\"50%\"><strong>Case type:<\/strong> " + matterOverviewData.matterInfo.matter_type_name + "<\/td>";
            strVar += "                                <td valign=\"top\" width=\"40%\"><strong>Sub-type:<\/strong> " + matterOverviewData.matterInfo.matter_sub_type_name + "<\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" width=\"50%\"><strong>Category:<\/strong> " + matterOverviewData.matterInfo.category_name + "<\/td>";
            strVar += "                            <\/tr>";
            strVar += "                        <\/table>";
            strVar += "                    <\/td>";
            strVar += "                <\/tr>";
            strVar += "                <tr>";
            strVar += "                    <td style=\"border-bottom:1px solid #e2e2e2;padding:0 0 10px 0;\">";
            strVar += "                        <table  width=\"100%\">";
            strVar += "                            <tr>";
            strVar += "                                <td colspan=\"5\" style=\"font-weight: bold;padding-bottom: 10px;font-size:18px;\">Matter Valuation<\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            <tr>";
            strVar += "                                <td width=\"20%\" valign=\"top\" style=\"padding-left: 12px;\">Injury<\/td>";
            strVar += "                                <td width=\"15%\" valign=\"top\">Surgery Involved<\/td>";
            strVar += "                                <td width=\"25%\" valign=\"top\">Total Policy Amount Available<\/td>";
            strVar += "                                <td width=\"20%\" valign=\"top\">Assessment of future loss<\/td>";
            strVar += "                                <td width=\"20%\" valign=\"top\">Expected Value<\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            <tr>";
            strVar += "                                <td width=\"20%\" valign=\"top\" align=\"right\" style=\"padding-right: 16px;\">" +
                (utils.isNotEmptyVal(matterOverviewData.valuation.injury) ?
                    matterOverviewData.valuation.injury : "-") + "<\/td>";
            strVar += "                                <td width=\"15%\" valign=\"top\">" +
                (utils.isNotEmptyVal(matterOverviewData.valuation.surgery_involved) ?
                    (matterOverviewData.valuation.surgery_involved == "1" ? "Yes" :
                        (matterOverviewData.valuation.surgery_involved == "2" ? "No" : "-")) : "-") + "<\/td>";
            strVar += "                                <td width=\"25%\" valign=\"top\" align=\"right\" style=\"padding-right: 18px;\">" +
                (utils.isNotEmptyVal(matterOverviewData.valuation.total_policy_amount) ?
                    "$" + $filter("number")(matterOverviewData.valuation.total_policy_amount, 2) : "-") + "<\/td>";
            strVar += "                                <td width=\"20%\" valign=\"top\" align=\"right\" style=\"padding-right: 18px;\">" +
                (utils.isNotEmptyVal(matterOverviewData.valuation.future_loss) ?
                    "$" + $filter("number")(matterOverviewData.valuation.future_loss, 2) : "-") + "<\/td>";
            strVar += "                                <td width=\"20%\" valign=\"top\" align=\"right\" style=\"padding-right: 18px;\">" +
                (utils.isNotEmptyVal(matterOverviewData.valuation.expected_value) ?
                    "$" + $filter("number")(matterOverviewData.valuation.expected_value, 2) : "-") + "<\/td>";
            strVar += "                            <\/tr>";
            strVar += "                        <\/table>";
            strVar += "                    <\/td>";
            strVar += "                <\/tr>";

            strVar += "                <tr>";
            strVar += "                    <td style=\"border-bottom:1px solid #e2e2e2;padding:0 0 10px 0;\">";
            strVar += "                        <table  width=\"100%\" style=\"padding:0 0 10px 0;\">";
            strVar += "                            <tr>";
            strVar += "                                <td colspan=\"2\" style=\"font-weight: bold;padding-bottom: 10px;font-size:18px;\">Matter Assignment<\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"padding-left: 12px;\"><b>Lead Attorney: <\/b>";
            //lead attorney list
            for (var i = 0; i < matterOverviewData.latt.length; i++) {
                strVar += utils.removeunwantedHTML(matterOverviewData.latt[i].fullName) + ((i < (matterOverviewData.latt.length - 1)) ? ", " : " ");
            }

            strVar += "                                <\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"padding-left: 12px;\"><b>Attorney: <\/b>";
            //attorney list
            for (var i = 0; i < matterOverviewData.att.length; i++) {
                strVar += utils.removeunwantedHTML(matterOverviewData.att[i].fullName) + ((i < (matterOverviewData.att.length - 1)) ? ", " : " ");
            }
            strVar += "                                <\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"padding-left: 12px;\"><b>Staff: <\/b>";
            //staff list
            for (var i = 0; i < matterOverviewData.staff.length; i++) {
                strVar += utils.removeunwantedHTML(matterOverviewData.staff[i].fullName) + ((i < (matterOverviewData.staff.length - 1)) ? ", " : " ");
            }
            strVar += "                                <\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"padding-left: 12px;\"><b>Paralegal: <\/b>";
            //paralegal list
            for (var i = 0; i < matterOverviewData.paralegal.length; i++) {
                strVar += utils.removeunwantedHTML(matterOverviewData.paralegal[i].fullName) + ((i < (matterOverviewData.paralegal.length - 1)) ? ", " : " ");
            }
            strVar += "                                <\/td>";
            strVar += "                            <\/tr>";
            strVar += "                        <\/table>";
            strVar += "                    <\/td>";
            strVar += "                <\/tr>";
            strVar += "                <tr>";
            strVar += "                    <td style=\"border-bottom:1px solid #e2e2e2;padding:0 0 10px 0;\">";
            strVar += "                        <table  width=\"100%\" style=\"padding:0 0 10px 0;\">";
            strVar += "                            <tr>";
            strVar += "                                <td colspan=\"2\" style=\"font-weight: bold;font-size:18px;\">Events<\/td>";
            strVar += "                            <\/tr>";
            //todays events
            for (var i = 0; i < matterOverviewData.todaysEvent.length; i++) {
                strVar += "<tr>";
                strVar += "<td style='padding:10px 0 0 12px;'><b>" + matterOverviewData.todaysEvent[i].name + "</b><br>";
                strVar += matterOverviewData.todaysEvent[i].allday == 1 ? "Full Day" :
                    ($filter('utcDateFilter')(matterOverviewData.todaysEvent[i].utcstart, "hh:mm A") +
                        "-" +
                        $filter('utcDateFilter')(matterOverviewData.todaysEvent[i].utcend, "hh:mm A"));
                strVar += "<br>" + (utils.removeunwantedHTML(matterOverviewData.todaysEvent[i].location) || "-") + "</td>";
                strVar += "<\/tr>";
            }
            //no data message
            if (matterOverviewData.todaysEvent.length === 0) {
                strVar += "<tr><td style=\"padding:10px 0 0 12px;\">No events available.</td></tr>"
            }

            strVar += "                        <\/table>";
            strVar += "                    <\/td>";
            strVar += "                <\/tr>";
            strVar += "                <tr>";
            strVar += "                    <td style=\"border-bottom:1px solid #e2e2e2;padding:0 0 10px 0;\">";
            strVar += "                        <table  width=\"100%\" style=\"padding:0 0 10px 0;\">";
            strVar += "                            <tr>";
            strVar += "                                <td colspan=\"2\" style=\"font-weight: bold;font-size:18px;\">Tasks<\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"padding:10px 0 0 12px;width: 60%;\">";
            strVar += "                                    <table>";
            strVar += "                                        <tr>";
            strVar += "                                            <td style=\"font-weight: bold;\">Today's Tasks<\/td>";
            strVar += "                                        <\/tr>";
            //tasks due today
            for (var i = 0; i < matterOverviewData.tasksDueToday.length; i++) {
                strVar += "<tr>";
                strVar += "<td style=\"padding:10px 0 0 0px;\">" + utils.removeunwantedHTML(matterOverviewData.tasksDueToday[i].taskname) || "-";
                strVar += "<br/>Status: " + matterOverviewData.tasksDueToday[i].status || "-";
                strVar += "<br/>Percentage Complete: " + matterOverviewData.tasksDueToday[i].percentagecomplete || "-";
                strVar += "</td>";
                strVar += "</tr>";
            }
            //no data message
            if (matterOverviewData.tasksDueToday.length === 0) {
                strVar += "<tr><td>No tasks due today.</td></tr>"
            }
            strVar += "                                        ";
            strVar += "                                    <\/table>";
            strVar += "                                <\/td>";
            strVar += "                                <td valign=\"top\" style=\"padding:10px 0 0 12px;\">";
            strVar += "                                    <table>";
            strVar += "                                        <tr>";
            strVar += "                                            <td style=\"font-weight: bold;\">Overdue Tasks<\/td>";
            strVar += "                                        <\/tr>";
            //overdue tasks
            for (var i = 0; i < matterOverviewData.overdueTasks.length; i++) {
                strVar += "<tr>";
                strVar += "<td style=\"padding:10px 0 0 0px;\">" + utils.removeunwantedHTML(matterOverviewData.overdueTasks[i].taskname) || "-";
                strVar += "<br/>Status: " + matterOverviewData.overdueTasks[i].status || "-";
                strVar += "<br/>Percentage Complete: " + matterOverviewData.overdueTasks[i].percentagecomplete || "-";
                strVar += "</td>";
                strVar += "</tr>";
            }
            //no data message
            if (matterOverviewData.overdueTasks.length === 0) {
                strVar += "<tr><td>No overdue tasks.</td></tr>"
            }

            strVar += "                                        ";
            strVar += "                                    <\/table>";
            strVar += "                                <\/td>";
            strVar += "                            <\/tr>";
            strVar += "                        <\/table>";
            strVar += "                    <\/td>";
            strVar += "                <\/tr>";


            //Start: US#10029 - adding items on the overview print screen

            strVar += '<tr>';
            strVar += '     <td style="border-bottom:1px solid #e2e2e2;padding:0 0 10px 0;"> ';
            strVar += '         <table width="100%" style="padding:0 0 10px 0;"> ';
            strVar += '            <tbody> ';
            strVar += '                <tr> ';
            strVar += '                     <td colspan="2" style="font-weight: bold;font-size:18px;">Medical Bills</td> ';
            strVar += '                 </tr> ';
            strVar += '                 <tr> ';
            strVar += '                     <td valign="top" style="padding:10px 0 0 12px;width: 45%;"> ';
            strVar += '                         <table> ';
            strVar += '                             <tbody> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td style="font-weight: bold;">Bills/Adjusted Amounts (after write-off)</td> ';
            strVar += '                                 </tr> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td>';
            strVar += utils.isNotEmptyVal(matterOverviewData.medicalBillsTotal.totalamountCal) ? $filter('currency')(matterOverviewData.medicalBillsTotal.totalamountCal, '$', 2) : "-";
            strVar += '/';
            strVar += utils.isNotEmptyVal(matterOverviewData.medicalBillsTotal.adjustedamount) ? $filter('currency')(matterOverviewData.medicalBillsTotal.adjustedamount, '$', 2) : "-";
            strVar += '                                     </td> ';
            strVar += '                                 </tr> ';
            strVar += '                             </tbody> ';
            strVar += '                         </table> ';
            strVar += '                     </td> ';
            strVar += '                     <td valign="top" style="padding:10px 0 0 12px;width: 20%;"> ';
            strVar += '                         <table> ';
            strVar += '                             <tbody> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td style="font-weight: bold;">Adjustments</td> ';
            strVar += '                                 </tr> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td>';
            strVar += utils.isNotEmptyVal(matterOverviewData.medicalBillsTotal.totalAdjustments) ? $filter('currency')(matterOverviewData.medicalBillsTotal.totalAdjustments, '$', 2) : "-";
            strVar += '                                      </td> ';
            strVar += '                                 </tr> ';
            strVar += '                             </tbody> ';
            strVar += '                         </table> ';
            strVar += '                     </td> ';
            strVar += '                     <td valign="top" style="padding:10px 0 0 12px;width: 16%;"> ';
            strVar += '                         <table> ';
            strVar += '                             <tbody> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td style="font-weight: bold;">Paid</td> ';
            strVar += '                                 </tr> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td>';
            strVar += utils.isNotEmptyVal(matterOverviewData.medicalBillsTotal.paidamountCal) ? $filter('currency')(matterOverviewData.medicalBillsTotal.paidamountCal, '$', 2) : "-";
            strVar += '                                      </td> ';
            strVar += '                                 </tr> ';
            strVar += '                             </tbody> ';
            strVar += '                         </table> ';
            strVar += '                     </td> ';
            strVar += '                     <td valign="top" style="padding:10px 0 0 12px;width: 20%;"> ';
            strVar += '                         <table> ';
            strVar += '                             <tbody>';
            strVar += '                                 <tr> ';
            strVar += '                                     <td style="font-weight: bold;">Outstanding</td> ';
            strVar += '                                 </tr> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td>';
            strVar += utils.isNotEmptyVal(matterOverviewData.medicalBillsTotal.outstandingamountCal) ? '$' + $filter('number')(matterOverviewData.medicalBillsTotal.outstandingamountCal, 2) : "-";
            strVar += '                                      </td> ';
            strVar += '                                 </tr> ';
            strVar += '                             </tbody> ';
            strVar += '                         </table>';
            strVar += '                     </td> ';
            strVar += '                 </tr> ';
            strVar += '             </tbody> ';
            strVar += '         </table>';
            strVar += '     </td>';
            strVar += ' </tr>';

            //For Liens
            strVar += '<tr>';
            strVar += '     <td style="border-bottom:1px solid #e2e2e2;padding:0 0 10px 0;"> ';
            strVar += '         <table width="100%" style="padding:0 0 10px 0;"> ';
            strVar += '            <tbody> ';
            strVar += '                <tr> ';
            strVar += '                     <td colspan="2" style="font-weight: bold;font-size:18px;">Liens</td> ';
            strVar += '                 </tr> ';
            strVar += '                 <tr> ';
            strVar += '                     <td valign="top" style="padding:10px 0 0 12px;width: 45%;"> ';
            strVar += '                         <table> ';
            strVar += '                             <tbody> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td style="font-weight: bold;">Amount</td> ';
            strVar += '                                 </tr> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td>';
            strVar += utils.isNotEmptyVal(matterOverviewData.liensTotal.lienamountCal) ? $filter('currency')(matterOverviewData.liensTotal.lienamountCal, '$', 2) : "-";
            strVar += '                                      </td> ';
            strVar += '                                 </tr> ';
            strVar += '                             </tbody> ';
            strVar += '                         </table> ';
            strVar += '                     </td> ';
            strVar += '                     <td valign="top" style="padding:10px 0 0 12px;width: 25%;"> ';
            strVar += '                         <table> ';
            strVar += '                             <tbody> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td style="font-weight: bold;">Amount Due</td> ';
            strVar += '                                 </tr> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td>';
            strVar += utils.isNotEmptyVal(matterOverviewData.liensTotal.dueamountCal) ? $filter('currency')(matterOverviewData.liensTotal.dueamountCal, '$', 2) : "-";
            strVar += '                                      </td> ';
            strVar += '                                 </tr> ';
            strVar += '                             </tbody> ';
            strVar += '                         </table> ';
            strVar += '                     </td> ';
            strVar += '                     <td valign="top" style="padding:10px 0 0 12px;width: 30%;"> ';
            strVar += '                         <table> ';
            strVar += '                             <tbody>';
            strVar += '                                 <tr> ';
            strVar += '                                     <td style="font-weight: bold;"></td> ';
            strVar += '                                 </tr> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td></td> ';
            strVar += '                                 </tr> ';
            strVar += '                             </tbody> ';
            strVar += '                         </table>';
            strVar += '                     </td> ';
            strVar += '                 </tr> ';
            strVar += '             </tbody> ';
            strVar += '         </table>';
            strVar += '     </td>';
            strVar += ' </tr>';

            //Expenses
            strVar += '<tr>';
            strVar += '     <td style="border-bottom:1px solid #e2e2e2;padding:0 0 10px 0;"> ';
            strVar += '         <table width="100%" style="padding:0 0 10px 0;"> ';
            strVar += '            <tbody> ';
            strVar += '                <tr> ';
            strVar += '                     <td colspan="2" style="font-weight: bold;font-size:18px;">Expenses</td> ';
            strVar += '                 </tr> ';
            strVar += '                 <tr> ';
            strVar += '                     <td valign="top" style="padding:10px 0 0 12px;width: 45%;"> ';
            strVar += '                         <table> ';
            strVar += '                             <tbody> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td style="font-weight: bold;">Expense</td> ';
            strVar += '                                 </tr> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td>';
            strVar += utils.isNotEmptyVal(matterOverviewData.expensesListTotal.expenseamountCal) ? $filter('currency')(matterOverviewData.expensesListTotal.expenseamountCal, '$', 2) : "-";
            strVar += '                                      </td> ';
            strVar += '                                 </tr> ';
            strVar += '                             </tbody> ';
            strVar += '                         </table> ';
            strVar += '                     </td> ';
            strVar += '                     <td valign="top" style="padding:10px 0 0 12px;width: 25%;"> ';
            strVar += '                         <table> ';
            strVar += '                             <tbody> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td style="font-weight: bold;">Paid</td> ';
            strVar += '                                 </tr> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td>';
            strVar += utils.isNotEmptyVal(matterOverviewData.expensesListTotal.paidamountCal) ? $filter('currency')(matterOverviewData.expensesListTotal.paidamountCal, '$', 2) : "-";
            strVar += '                                      </td> ';
            strVar += '                                 </tr> ';
            strVar += '                             </tbody> ';
            strVar += '                         </table> ';
            strVar += '                     </td> ';
            strVar += '                     <td valign="top" style="padding:10px 0 0 12px;width: 30%;"> ';
            strVar += '                         <table> ';
            strVar += '                             <tbody>';
            strVar += '                                 <tr> ';
            strVar += '                                     <td style="font-weight: bold;">Outstanding</td> ';
            strVar += '                                 </tr> ';
            strVar += '                                 <tr> ';
            strVar += '                                     <td>';
            strVar += utils.isNotEmptyVal(matterOverviewData.expensesListTotal.outstandingamountCal) ? $filter('currency')(matterOverviewData.expensesListTotal.outstandingamountCal, '$', 2) : "-";
            strVar += '                                      </td> ';
            strVar += '                                 </tr> ';
            strVar += '                             </tbody> ';
            strVar += '                         </table>';
            strVar += '                     </td> ';
            strVar += '                 </tr> ';
            strVar += '             </tbody> ';
            strVar += '         </table>';
            strVar += '     </td>';
            strVar += ' </tr>';

            // //Settlement
            // strVar += '<tr>';
            // strVar += '     <td style="border-bottom:1px solid #e2e2e2;padding:0 0 10px 0;"> ';
            // strVar += '         <table width="100%" style="padding:0 0 10px 0;"> ';
            // strVar += '            <tbody> ';
            // strVar += '                <tr> ';
            // strVar += '                     <td colspan="2" style="font-weight: bold;font-size:18px;">Settlement</td> ';
            // strVar += '                 </tr> ';
            // strVar += '                 <tr> ';
            // strVar += '                     <td valign="top" style="padding:10px 0 0 12px;width: 45%;"> ';
            // strVar += '                         <table> ';
            // strVar += '                             <tbody> ';
            // strVar += '                                 <tr> ';
            // strVar += '                                     <td style="font-weight: bold;">Demand</td> ';
            // strVar += '                                 </tr> ';
            // strVar += '                                 <tr> ';
            // strVar += '                                     <td>';
            // strVar += utils.isNotEmptyVal(matterOverviewData.settlementTotal.demand) ? $filter('currency')(matterOverviewData.settlementTotal.demand, '$', 2) : "-";
            // strVar += '                                      </td> ';
            // strVar += '                                 </tr> ';
            // strVar += '                             </tbody> ';
            // strVar += '                         </table> ';
            // strVar += '                     </td> ';
            // strVar += '                     <td valign="top" style="padding:10px 0 0 12px;width: 25%;"> ';
            // strVar += '                         <table> ';
            // strVar += '                             <tbody> ';
            // strVar += '                                 <tr> ';
            // strVar += '                                     <td style="font-weight: bold;">Offer</td> ';
            // strVar += '                                 </tr> ';
            // strVar += '                                 <tr> ';
            // strVar += '                                     <td>';
            // strVar += utils.isNotEmptyVal(matterOverviewData.settlementTotal.offer) ? $filter('currency')(matterOverviewData.settlementTotal.offer, '$', 2) : "-";
            // strVar += '                                      </td> ';
            // strVar += '                                 </tr> ';
            // strVar += '                             </tbody> ';
            // strVar += '                         </table> ';
            // strVar += '                     </td> ';
            // strVar += '                     <td valign="top" style="padding:10px 0 0 12px;width: 30%;"> ';
            // strVar += '                         <table> ';
            // strVar += '                             <tbody>';
            // strVar += '                                 <tr> ';
            // strVar += '                                     <td style="font-weight: bold;"></td> ';
            // strVar += '                                 </tr> ';
            // strVar += '                                 <tr> ';
            // strVar += '                                     <td></td> ';
            // strVar += '                                 </tr> ';
            // strVar += '                             </tbody> ';
            // strVar += '                         </table>';
            // strVar += '                     </td> ';
            // strVar += '                 </tr> ';
            // strVar += '             </tbody> ';
            // strVar += '         </table>';
            // strVar += '     </td>';
            // strVar += ' </tr>';
            // //End: US#10029 - adding items on the overview print screens

            strVar += "            <\/table>";
            strVar += "        <\/td>";
            strVar += "        <td width=\"45%\" style=\" padding:0px 0px 10px 10;\" valign=\"top\">";
            strVar += "            <table style=\"border-bottom:1px solid #e2e2e2;\">";
            strVar += "				<tr>";
            strVar += "                    <td width=\"50%\" style=\"border-right:1px solid #e2e2e2; padding:0px 10px 10px 0;\" valign=\"top\">";
            strVar += "                        <table>";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"font-weight: bold;font-size:18px;\">Court Details<\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"padding:15px 0 0 12px;\">";

            strVar += utils.isNotEmptyVal(matterOverviewData.matterInfo.mattercourt) ?
                matterOverviewData.matterInfo.mattercourt : "";
            strVar += utils.isNotEmptyVal(matterOverviewData.matterInfo.street) ?
                "<br>" + matterOverviewData.matterInfo.street : "";
            strVar += utils.isNotEmptyVal(matterOverviewData.matterInfo.city) ?
                "<br>" + matterOverviewData.matterInfo.city : "";
            strVar += utils.isNotEmptyVal(matterOverviewData.matterInfo.state) ?
                "<br>" + matterOverviewData.matterInfo.state : "";
            strVar += utils.isNotEmptyVal(matterOverviewData.matterInfo.country) ?
                "<br>" + matterOverviewData.matterInfo.country : "";
            strVar += utils.isNotEmptyVal(matterOverviewData.matterInfo.zipcode) ?
                "<br>" + matterOverviewData.matterInfo.zipcode : "";


            strVar += "                          </td>";
            strVar += "                            <\/tr>";

            //Location of Incident 
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"font-weight: bold;padding-top:20px;font-size:18px;\">Location of Incident<\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"padding:10px 0 0 12px;\">"
            strVar += utils.isNotEmptyVal(matterOverviewData.matterInfo.accident_location) ? utils.removeunwantedHTML(matterOverviewData.matterInfo.accident_location) : "";


            strVar += "                            <\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"font-weight: bold;padding-top:20px;font-size:18px;\">Important Dates<\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            <tr>";
            strVar += "                                <td style=\"padding:10px 0 0 12px;\" valign=\"top\">";
            strVar += "                                    <table style=\"width:100%;\">";
            //important dates
            for (var i = 0; i < matterOverviewData.importantDates.length; i++) {
                strVar += "   <tr>";
                strVar += "       <td colspan=\"2\" valign=\"top\"><b>";
                strVar += $filter("impDatesFilter")(matterOverviewData.importantDates[i].name) + ": <\/b>";
                strVar += $filter("utcImpDateFilter")(matterOverviewData.importantDates[i].utcstart, "DD MMM YYYY", matterOverviewData.importantDates[i].allday, "start") + "&nbsp;&nbsp;";
                strVar += matterOverviewData.importantDates[i].isComply == "1" ? "Complied" : "";
                strVar += "       <\/td>";
                strVar += "   <\/tr>";
            }
            //no data message
            if (matterOverviewData.importantDates.length === 0) {
                strVar += "<tr><td>No important dates available.</td></tr>"
            }
            strVar += "                                    <\/table>";
            strVar += "                                <\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            <tr>";
            strVar += "                                <td>";
            strVar += "                                    <table width=\"100%\">";
            strVar += "                                        <tr>";
            strVar += "                                            <td colspan=\"2\" valign=\"top\" style=\"font-weight: bold;padding:10px 0 0 0;font-size:18px;\">Motion by us<\/td>";
            strVar += "                                        <\/tr>";
            // motion served by us
            for (var i = 0; i < matterOverviewData.motionServedByUs.data.length; i++) {
                strVar += "                                        <tr>";
                strVar += "                                            <td colspan=\"2\" valign=\"top\" style=\"padding:10px 0 0 12px;\">" + matterOverviewData.motionServedByUs.data[i].motion_title + "<\/td>";
                strVar += "                                        <\/tr>";
                strVar += "                                        <tr>";
                strVar += "                                            <td width=\"50%\" valign=\"top\" style=\"padding:0px 0 0 12px;\">" + matterOverviewData.motionServedByUs.data[i].motion_datereturnable + "<\/td>";
                strVar += "                                            <td width=\"40%\" valign=\"top\" style=\"padding:0px 0 0 12px;\">Open<\/td>";
                strVar += "                                        <\/tr>";
            }
            //no data message
            if (matterOverviewData.motionServedByUs.data.length === 0) {
                strVar += "<tr><td  style=\"padding:10px 0 0 12px;\">No motion served by us.</td></tr>";
            }
            strVar += "                                        <tr>";
            strVar += "                                            <td colspan=\"2\" valign=\"top\" style=\"font-weight: bold;padding:10px 0 0 0;font-size:18px;\">Motion on us<\/td>";
            strVar += "                                        <\/tr>";
            // motion served on us
            for (var i = 0; i < matterOverviewData.motionServedOnUs.data.length; i++) {
                strVar += "                             <tr>";
                strVar += "                                 <td colspan=\"2\" valign=\"top\" style=\"padding:10px 0 0 12px;\">" + matterOverviewData.motionServedOnUs.data[i].motion_title + "<\/td>";
                strVar += "                             <\/tr>";
                strVar += "                             <tr>";
                strVar += "                                 <td width=\"50%\" valign=\"top\" style=\"padding:0px 0 0 12px;\">" + matterOverviewData.motionServedOnUs.data[i].motion_datereturnable + "<\/td>";
                strVar += "                                 <td width=\"40%\" valign=\"top\" style=\"padding:0px 0 0 12px;\">Open<\/td>";
                strVar += "                             <\/tr>";
            }
            //no data message
            if (matterOverviewData.motionServedOnUs.data.length === 0) {
                strVar += "<tr><td style=\"padding:10px 0 0 12px;\">No motion served on us.</td></tr>";
            }
            strVar += "                                    <\/table>";
            strVar += "                                <\/td>";
            strVar += "                            <\/tr>";
            strVar += "                            ";
            strVar += "                            ";
            strVar += "                        <\/table>";
            strVar += "                    <\/td>";
            strVar += "                    <td width=\"50%\" valign=\"top\">";
            strVar += "                        <table>";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"font-weight: bold;font-size:18px;\">Key Contacts<\/td>";
            strVar += "                            <\/tr>";
            strVar += "                        <\/table>";
            strVar += "                        <table style=\"padding:10px 0 0 10px;\">";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"font-weight: bold;\">Plaintiff<\/td>";
            strVar += "                            <\/tr>";
            //plaintiffs
            for (var i = 0; i < matterOverviewData.plaintiffContact.data.length; i++) {
                var plaintiff = matterOverviewData.plaintiffContact.data[i];
                strVar += "                            <tr>";
                strVar += "                                <td valign=\"top\" style=\"padding:10px 0 0 12px;\">";
                if (plaintiff.isalive == 0 && plaintiff.estateadminid) {
                    strVar += "<div><strong >" + plaintiff.estateadminid.searchlabel + "(Administrator)</strong></div>";
                }
                if (plaintiff.isalive != 0 && plaintiff.estateadminid) {
                    strVar += "<div><strong >" + plaintiff.estateadminid.searchlabel + "(Power Of Attorney)</strong></div>";
                }
                strVar += "<div>" + plaintiff.contactid.searchlabel + "</div><\/td>";
                strVar += "                            <\/tr>";
                strVar += "                            <tr>";
                strVar += "                                <td valign=\"top\" style=\"padding:0px 0 0 12px;\">";
                strVar += "                                    <span style=\"width: 40px;display:inline-block;position:relative;";
                strVar += "        \">DOB:<\/span><span\">" + plaintiff.dateofbirth +
                    "<\/span><\/td>";
                strVar += "                            <\/tr>";
                strVar += "                            <tr>";
                strVar += "                                <td valign=\"top\" style=\"padding:0px 0 0 12px;\">";
                strVar += "                                    <span style=\"width: 40px;display:inline-block;position:relative;";
                strVar += "        \">SSN:<\/span><span\">" + '#########' +
                    "<\/span><\/td>";
                strVar += "                            <\/tr>";

                var resObj = getNumberAndIcon(!plaintiff.estateadminid ? plaintiff.contactid : plaintiff.estateadminid);

                strVar += "                            <tr>";
                strVar += "                                <td valign=\"top\" style=\"padding:0px 0 0 12px;\">";
                strVar += "                                    <span class='sprite default-contactPhone-new pull-left' style=\"";
                strVar += "        margin-right:10px;\"><img src=" + resObj.img + "><\/span><span style=\"display: inline-block;width: 80%;vertical-align: top;\">" +
                    resObj.phone +
                    "<\/span><\/td>";
                strVar += "                            <\/tr>";
                strVar += "                            ";
                strVar += "                            ";
            }
            //no data message
            if (matterOverviewData.plaintiffContact.data.length === 0) {
                strVar += "<tr><td>No plaintiffs.</td></tr>";
            }
            strVar += "                        <\/table>";
            strVar += "                        <table style=\"padding:15px 0 0 10px;width:100%;\">";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"font-weight: bold;font-size:18px;\">Defendant<\/td>";
            strVar += "                            <\/tr>";
            //defendants
            for (var i = 0; i < matterOverviewData.defendentContact.data.length; i++) {
                var defendant = matterOverviewData.defendentContact.data[i];

                strVar += "                            <tr>";
                strVar += "                                <td valign=\"top\" style=\"padding:0px 0 0 12px;\">Attorney: " +
                    (utils.isNotEmptyVal(defendant.defendant_attorney) ?
                        (utils.isNotEmptyVal(defendant.defendant_attorney.searchlabel) ?
                            utils.removeunwantedHTML(defendant.defendant_attorney.searchlabel) : "-") : "-") + "<\/td>";
                strVar += "                            <\/tr>";

                var resObj = getNumberAndIcon(defendant.defendant_attorney);

                strVar += "                            <tr>";
                strVar += "                                <td valign=\"top\" style=\"padding:0px 0 0 12px;\">";
                strVar += "                                    <span style=\"";
                strVar += "        margin-right:10px;\"><img src=" + resObj.img + "><\/span><span style=\"display: inline-block;width: 80%;vertical-align: top;\">" +
                    resObj.phone + "<\/span><\/td>";
                strVar += "                            <\/tr>";

                strVar += "                            <tr>";
                strVar += "                                <td valign=\"top\" style=\"padding:10px 0 0 12px;\">Defendant: " +
                    (utils.isNotEmptyVal(defendant.defendant) ?
                        (utils.isNotEmptyVal(defendant.defendant.searchlabel) ?
                            defendant.defendant.searchlabel : "-") : "-") + "<\/td>";
                strVar += "                            <\/tr>";
            }
            //no data message
            if (matterOverviewData.defendentContact.data.length === 0) {
                strVar += "<tr><td style=\"padding:10px 0 0 12px;\">" + "No defendants." + "<tr><td>";
            }
            strVar += "                        <\/table>";
            strVar += "                        <table style=\"padding:15px 0 0 10px;width:100%;\">";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"font-weight: bold;font-size:18px;\">Insurance Adjuster<\/td>";
            strVar += "                            <\/tr>";
            //adjuster
            for (var i = 0; i < matterOverviewData.adjusterContact.insurance_adjuster.length; i++) {
                var adjuster = matterOverviewData.adjusterContact.insurance_adjuster[i];
                var party = matterOverviewData.adjusterContact.insured_party[i]
                strVar += "                            <tr>";
                strVar += "                                <td valign=\"top\" style=\"padding:10px 0 0 12px;\">Adjuster: " + (utils.isNotEmptyVal(adjuster.searchlabel) ? utils.removeunwantedHTML(adjuster.searchlabel) : "-") + "<\/td>";
                strVar += "                            <\/tr>";
                var resObj = getNumberAndIcon(adjuster);
                strVar += "                            <tr>";
                strVar += "                                <td valign=\"top\" style=\"padding:0px 0 0 12px;\">";
                strVar += "                                    <span style=\"";
                strVar += "        margin-right:10px;\"><img src=" + resObj.img + "><\/span><span style=\"display: inline-block;width: 80%;vertical-align: top;\">" +
                    resObj.phone +
                    "<\/span><\/td>";
                strVar += "                            <\/tr>";
                strVar += "                            <tr>";
                strVar += "                                <td valign=\"top\" style=\"padding:10px 0 0 12px;\">Insured: " +
                    (utils.isNotEmptyVal(party.searchlabel) ? utils.removeunwantedHTML(party.searchlabel) : "-") + "<\/td>";
                strVar += "                            <\/tr>";
                strVar += "                            <tr>";
                strVar += "                                <td valign=\"top\" style=\"padding:10px 0 0 12px;\">Claim Number: " +
                    (utils.isNotEmptyVal(party.claim_number) ? utils.removeunwantedHTML(party.claim_number) : "-") + "<\/td>";
                strVar += "                            <\/tr>";

                strVar += "                                <td valign=\"top\" style=\"padding:10px 0 0 12px;\">Provider: " +
                    (utils.isNotEmptyVal(adjuster.provider) ? utils.removeunwantedHTML(adjuster.provider) : "-") + "<\/td>";
                strVar += "                            <\/tr>";

                strVar += "                                <td valign=\"top\" style=\"padding:10px 0 0 12px;\">Type: " +
                    (utils.isNotEmptyVal(adjuster.type) ? utils.removeunwantedHTML(adjuster.type) : "-") + "<\/td>";
                strVar += "                            <\/tr>";
            }
            //no data
            if (matterOverviewData.adjusterContact.insurance_adjuster.length === 0) {
                strVar += "<tr><td style=\"padding:10px 0 0 12px;\">No insurance adjuster data.</td></tr>";
            }
            strVar += "                        <\/table>";
            strVar += "                        <table style=\"padding:15px 0 0 10px;width:100%;\">";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"font-weight: bold;font-size:18px;\">Referred To<\/td>";
            strVar += "                            <\/tr>";
            if (utils.isNotEmptyVal(matterOverviewData.matterInfo.referred_to_data)) {
                var referredTo = matterOverviewData.matterInfo.referred_to_data;
                strVar += "                            <tr>";
                strVar += "                                <td valign=\"top\" style=\"padding:10px 0 0 12px;\">" +
                    (utils.isNotEmptyVal(referredTo) ?
                        (utils.isNotEmptyVal(referredTo.searchlabel) ? utils.removeunwantedHTML(referredTo.searchlabel) : "-") : "-") + "<\/td>";
                strVar += "                            <\/tr>";
                var resObj = getNumberAndIcon(referredTo, true);
                strVar += "                            <tr>";
                strVar += "                                <td valign=\"top\" style=\"padding:0px 0 0 12px;\">";
                strVar += "                                    <span style=\"";
                strVar += "        margin-right:10px;\"><img src=" + resObj.img + "><\/span><span style=\"display: inline-block;width: 80%;vertical-align: top;\">" +
                    resObj.phone +
                    "<\/span><\/td>";
                strVar += "                            <\/tr>";
            } else {
                strVar += "<tr><td>No referred to data.</td></tr>";
            }

            strVar += "                        <\/table>";
            strVar += "                        <table style=\"padding:15px 0 0 10px;width:100%;\">";
            strVar += "                            <tr>";
            strVar += "                                <td valign=\"top\" style=\"font-weight: bold;font-size:18px;\">Referred By<\/td>";
            strVar += "                            <\/tr>";
            if (utils.isNotEmptyVal(matterOverviewData.matterInfo.referred_by_data)) {
                var referredBy = matterOverviewData.matterInfo.referred_by_data;
                strVar += "                            <tr>";
                strVar += "                                <td valign=\"top\" style=\"padding:10px 0 0 12px;\">" +
                    (utils.isNotEmptyVal(referredBy) ?
                        (utils.isNotEmptyVal(referredBy.searchlabel) ? utils.removeunwantedHTML(referredBy.searchlabel) : "-") : "-") + "<\/td>";
                strVar += "                            <\/tr>";
                var resObj = getNumberAndIcon(referredBy, true);
                strVar += "                            <tr>";
                strVar += "                                <td valign=\"top\" style=\"padding:0px 0 0 12px;\">";
                strVar += "                                    <span style=\"";
                strVar += "        margin-right:10px;\"><img src=" + resObj.img + "><\/span><span style=\"display: inline-block;width: 80%;vertical-align: top;\">" +
                    resObj.phone +
                    "<\/span><\/td>";
                strVar += "                            <\/tr>";
            } else {
                strVar += "<tr><td>No referred by data.</td></tr>";
            }
            strVar += "                        <\/table>";
            strVar += "                    <\/td>";
            strVar += "                <\/tr>";
            strVar += "            <\/table>";
            strVar += "            <table width=\"100%\">";
            strVar += "                <tr>";
            strVar += "                    <td style=\"font-weight: bold;padding:15px 0 0 0;font-size: 18px;\">Notes<\/td>";
            strVar += "                <\/tr>";
            strVar += "                <tr>";
            strVar += "                    <td>";
            //notes
            for (var i = 0; i < matterOverviewData.recentNotes.length; i++) {
                strVar += "                        <div style=\"padding:10px;margin:10px;border:1px solid #e2e2e2;width:215px;height:170px;float:left;\" valign=\"top\">";
                strVar += "                            <b style=\"display:block;\">" + (matterOverviewData.recentNotes[i].catdes || "-") + "<\/b>";
                strVar += "                            <span style=\"display:block;float:left;\">" + moment.unix(matterOverviewData.recentNotes[i].datereceived).format("MM/DD/YYYY hh:mm A");
                strVar += "<\/span>";
                strVar += matterOverviewData.recentNotes[i].is_important == "1" ?
                    "<span style=\"float:right;\"><img src=" + globalConstants.images_path + "print_alert.svg /><\/span>" : "";
                strVar += "                            <span style=\"overflow: hidden;text-overflow: ellipsis;display: -webkit-box;line-height: 16px;max-height: 130px;-webkit-line-clamp: 7;-webkit-box-orient: vertical;clear: both;\">" +
                    matterOverviewData.recentNotes[i].text || "-" + "<\/span>";
                strVar += "                        <\/div>";
            }
            //no data message
            if (matterOverviewData.recentNotes.length === 0) {
                strVar += "<tr><td style=\"padding:10px 0 0 12px;\">No recent notes available.</td></tr>"
            }

            strVar += "                <tr>";
            strVar += "                    <td style=\"font-weight: bold;padding:15px 0 0 0;font-size: 18px;\">Injuries<\/td>";
            strVar += "                <\/tr>";
            strVar += "                <tr>";
            strVar += "                    <td>";

            //bodyinjuries 
            for (var i = 0; i < matterOverviewData.bodilyInjuries.length; i++) {
                strVar += "                        <div style=\"padding:10px;margin:10px;border:1px solid #e2e2e2;width:215px;height:170px;float:left;\" valign=\"top\">";
                strVar += "                            <b style=\"display:block;\">" + (utils.removeunwantedHTML(matterOverviewData.bodilyInjuries[i].firstname) + " " + utils.removeunwantedHTML(matterOverviewData.bodilyInjuries[i].lastname)) + "<\/b>";
                strVar += "                            <span style=\"overflow: hidden;text-overflow: ellipsis;display: -webkit-box;line-height: 16px;max-height: 130px;-webkit-line-clamp: 7;-webkit-box-orient: vertical;clear: both;\">" +
                    (matterOverviewData.bodilyInjuries[i].bodilyinjury || "-") + "<\/span>";
                strVar += "                        <\/div>";
            }
            //no data message
            if (matterOverviewData.bodilyInjuries.length === 0) {
                strVar += "<tr><td>No recent injuries available.</td></tr>"
            }

            strVar += "                    <\/td>";
            strVar += "                <\/tr>";
            strVar += "            <\/table>";
            strVar += "        <\/td>";
            strVar += "    <\/tr>";
            strVar += "<\/table>    ";

            strVar += "</body>";
            return strVar;
        }

        function getValuationData(matterId) {
            var url = matterConstants.RESTAPI.valuationData + matterId;
            return $http.get(url);
        }


        function getMatterCollaboratedEntity(mId, firmId) {
            var deferred = $q.defer();
            var token = {
                'clxAuthToken': localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: matterConstants.RESTAPI.getMatterCollaboratedEntityURL + "matterId=" + mId + "&firmId=" + firmId,
                method: "GET",
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

        return matterFactory;
    }

})();