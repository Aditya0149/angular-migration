(function () {
    'use strict';

    angular
        .module('intake.matter')
        .factory('intakeFactory', matterService);

    matterService.$inject = ['$http', '$q', '$filter', 'intakeConstants',
        'globalConstants', 'routeManager', 'pendingRequests', 'globalContactConstants'
    ];

    function matterService($http, $q, $filter, intakeConstants,
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
            getContactById: getContactById,
            printMatterOverview: printMatterOverview,
            getValuationData: getValuationData,
            archiveMatters: archiveMatters,
            getFormatteddate: getFormatteddate,
            //archive matter list 
            getArchiveMatterList: getArchiveMatterList,
            //getArchiveMatterCount: getArchiveMatterCount,
            printArchiveMatters: printArchiveMatters,
            // downloadArchivedMatters: downloadArchivedMatters,
            getArchiveMatterData: getArchiveMatterData,
            setRetrieveArchivedMatter: setRetrieveArchivedMatter,
            setContactType: setContactType,
            getMasterDataList: getMasterDataList,
            migrateIntake: migrateIntake,
            addIntakeInfo: addIntakeInfo,
            editIntakeInfo: editIntakeInfo,
            addPlaintiffInfo: addPlaintiffInfo,
            deleteIntakeInfo: deleteIntakeInfo,
            saveMatterList: saveMatterList,
            getPlaintiffByIntake: getPlaintiffByIntake,
            getPlaintiffById: getPlaintiffById,
            deleteInsuranceInfo: deleteInsuranceInfo,
            deleteMedicalRecordInfo: deleteMedicalRecordInfo,
            getInsuranceType: getInsuranceType,
            addInsuranceInfo: addInsuranceInfo,
            addMedicalRecordInfo: addMedicalRecordInfo,
            addOtherDetails: addOtherDetails,
            updateOtherDetails: updateOtherDetails,
            getOtherDetails: getOtherDetails,
            addEmployer: addEmployer,
            addWitness: addWitness,
            deleteWitness: deleteWitness,
            getPrintIntakeData: getPrintIntakeData,
            yesNoFn: yesNoFn,
            checkProp: checkProp,
            salaryModeFn: salaryModeFn,
            openOccupationfn: openOccupationfn,
            typeOfIncidentFn: typeOfIncidentFn,
            typeOfBuildingFn: typeOfBuildingFn,
            getIntakeFormUrl: getIntakeFormUrl,
            getOtherDetailsForMatter: getOtherDetailsForMatter,
            validateEmployer: validateEmployer,
            setAssociateContactDetails: setAssociateContactDetails,
            getAssociateContactDetails: getAssociateContactDetails,
            saveStatusForIntake: saveStatusForIntake
        };
        matterFactory.matterList = [];
        function saveStatusForIntake(matterId) {
            var deferred = $q.defer();
            var url = intakeConstants.RESTAPI.saveConsentForStatus.replace('{intakeId}', matterId);
            return $http({
                url: url,
                method: "PUT",
                data: '"timeout":{}',
            }).success(function (response, status, headers, config) {
                deferred.resolve();
            }).error(function (ee, status, headers, config) {
                deferred.reject();
            });
        }
        function addEmployer(data) {
            return postCall(intakeConstants.RESTAPI.addEmployer, data);
        }

        function validateEmployer(ids) {
            return getCall(intakeConstants.RESTAPI.validateEmployer + ids)
        }

        function getOtherDetailsForMatter(matterId, data) {
            return getCall(intakeConstants.RESTAPI.getIntakeOtherDetails + matterId, data);
        }
        var list = [];
        function setAssociateContactDetails(data) {
            list = data;
        }

        function getAssociateContactDetails() {
            return list;
        }

        function getCall(url, data) {
            var deferred = $q.defer();
            if (data == 'no_auth') {
                var token = {
                    'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                    'Content-type': 'application/json',
                    'no_auth': true
                }
            } else {
                var token = {
                    'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                    'Content-type': 'application/json'
                }
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

        function postCall(url, data, authorization) {
            var deferred = $q.defer();
            if (authorization == 'no_auth') {
                var token = {
                    'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                    'Content-type': 'application/json',
                    'no_auth': true
                }
            } else {
                var token = {
                    'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                    'Content-type': 'application/json'
                }
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

        function putCall(url, data, authorization) {
            var deferred = $q.defer();
            if (authorization == 'no_auth') {
                var token = {
                    'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                    'Content-type': 'application/json',
                    'no_auth': true
                }
            } else {
                var token = {
                    'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                    'Content-type': 'application/json'
                }
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

        function deleteWitness(data) {
            return deleteCall(intakeConstants.RESTAPI.deleteWitness, data);
        }

        function getPlaintiffByIntake(intakeId, data) {
            return getCall(intakeConstants.RESTAPI.getPlaintiff + intakeId, data);
        };

        function getIntakeFormUrl(templateId, intakeId, intakePlaintiffId) {
            return getCall(intakeConstants.RESTAPI.getInTakeUrl + templateId + "?intakeId=" + intakeId + "&intakePlaintiffId=" + intakePlaintiffId);
        };

        function getPlaintiffById(id) {
            return getCall(intakeConstants.RESTAPI.getPlaintiffDetail + id);
        };

        function getMasterDataList(data) {
            return getCall(intakeConstants.RESTAPI.getMasterDataFromJAVA, data);
        }

        function deleteIntakeInfo(data) {
            return deleteCall(intakeConstants.RESTAPI.deleteIntake, data);
        }

        function deleteInsuranceInfo(date) {
            return deleteCall(intakeConstants.RESTAPI.deleteInsurance, data);
        }

        function deleteMedicalRecordInfo(date) {
            return deleteCall(intakeConstants.RESTAPI.deleteMedicalRecord, data);
        }

        function addPlaintiffInfo(data, isEdit, authorization) {
            return isEdit ? putCall(intakeConstants.RESTAPI.editPlaintiff, data, authorization) : postCall(intakeConstants.RESTAPI.addPlaintiff, data, authorization);
        }

        function editIntakeInfo(data) {
            return putCall(intakeConstants.RESTAPI.editIntake, data);
        };

        function migrateIntake(data) {
            return postCall(intakeConstants.RESTAPI.intakeMigrate, data);
        }

        function addIntakeInfo(data) {
            return postCall(intakeConstants.RESTAPI.addIntake, data);
        }

        function addInsuranceInfo(data, isEdit) {
            return isEdit ? putCall(intakeConstants.RESTAPI.editInsurance, data) : postCall(intakeConstants.RESTAPI.addInsurance, data);
        }

        function addWitness(data, isEdit) {
            return isEdit ? putCall(intakeConstants.RESTAPI.editWitness, data) : postCall(intakeConstants.RESTAPI.addWitness, data);
        }

        function addOtherDetails(data, authorization) {
            return postCall(intakeConstants.RESTAPI.addOtherDetails, data, authorization);
        }

        function updateOtherDetails(data, authorization) {
            return putCall(intakeConstants.RESTAPI.updateOtherDetails, data, authorization);
        }

        function getOtherDetails(intakeId, data) {
            return getCall(intakeConstants.RESTAPI.getOtherDetails + intakeId, data);
        }


        function addMedicalRecordInfo(data, isEdit) {
            return isEdit ? putCall(intakeConstants.RESTAPI.editMedicalRecord, data) : postCall(intakeConstants.RESTAPI.addMedicalRecord, data);
        }

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
            var url = intakeConstants.RESTAPI.matterInfo + matterId;
            var canceller = $q.defer();
            pendingRequests.add({ url: url, canceller: canceller });
            return $http.get(url, { timeout: canceller.promise });
        }

        function closeEventTask(matterId) {
            var url = intakeConstants.RESTAPI.markCompleteTaskEvent + matterId;
            var canceller = $q.defer();
            pendingRequests.add({ url: url, canceller: canceller });
            return $http.put(url, { timeout: canceller.promise });
        }

        function getFormatteddate(epoch) {
            var formdate = new Date(epoch * 1000);
            formdate = moment(formdate).format('MM/DD/YYYY');
            return formdate;
        }

        function setMatterData(data) {
            matterInfo = data;
        }

        function getMatterData() {
            return matterInfo;
        }

        function fetchMatterData(matterId) {
            var deferred = $q.defer();
            if (utils.isEmptyObj(matterInfo) || matterInfo.intakeId != matterId) {
                var dataObj = {
                    "page_number": 1,
                    "page_size": 250,
                    "intake_id": matterId
                };
                var promise = getMatterList(dataObj);
                promise
                    .then(function (response) {
                        var matterInfo = response.intakeData[0];
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
            //setBreadcrum(matterId, pagename);
            var deferred = $q.defer();

            // var initCrum = [{ name: '...' }];
            // routeManager.setBreadcrum(initCrum);


            var matterInfo = getMatterData();

            //fetch matter info if it dosen't exists
            if (utils.isEmptyObj(matterInfo) || (parseInt(matterInfo.intakeId) !== parseInt(matterId))) {

                var dataObj = {
                    "page_number": 1,
                    "page_size": 250,
                    "intake_id": matterId
                };
                var promise = getMatterList(dataObj);
                promise
                    .then(function (response) {
                        var matterInfo = response.intakeData[0];
                        setMatterData(matterInfo);
                        // var breadcrum = [{ name: matterInfo.intakeName, state: 'intake-overview', param: { intakeId: matterId } },
                        // { name: pagename }
                        // ];
                        // routeManager.addToBreadcrum(breadcrum);
                        setBreadcrum(matterId, pagename);
                        deferred.resolve(matterInfo);

                    }, function (error) {
                        deferred.reject([]);
                        // notification.error('unable to fetch matter overview. Reason: ' + error.statusText);
                    });
            } else {
                // var breadcrum = [{ name: matterInfo.intakeName, state: 'intake-overview', param: { intakeId: matterId } },
                // { name: pagename }
                // ];
                // routeManager.addToBreadcrum(breadcrum);
                setBreadcrum(matterId, pagename);
                deferred.resolve(matterInfo);
            }

            return deferred.promise;
        }

        // function setBreadcrum(matterId, pagename) {
        //     var initCrum = [{ name: '...' }];
        //     routeManager.setBreadcrum(initCrum);

        //     var matterInfo = getMatterData();

        //     //fetch matter info if it dosen't exists
        //     if (utils.isEmptyObj(matterInfo) || (parseInt(matterInfo.matter_id) !== parseInt(matterId))) {

        //         var dataObj = {
        //             "page_number": 1,
        //             "page_size": 250,
        //             "intake_id": matterId
        //         };
        //         var promise = getMatterList(dataObj);
        //         promise
        //             .then(function (response) {
        //                 var matterInfo = response.intakeData[0];
        //                 setMatterData(matterInfo);
        //                 var breadcrum = [{ name: matterInfo.intakeName, state: 'intake-overview', param: { intakeId: matterId } },
        //                 { name: pagename }
        //                 ];
        //                 routeManager.addToBreadcrum(breadcrum);

        //             }, function (error) {
        //                 // notification.error('unable to fetch matter overview. Reason: ' + error.statusText);
        //             });
        //     } else {
        //         var breadcrum = [{ name: matterInfo.intakeName, state: 'intake-overview', param: { intakeId: matterId } },
        //         { name: pagename }
        //         ];
        //         routeManager.addToBreadcrum(breadcrum);
        //     }
        // }

        function setBreadcrum(matterId, pagename) {
            var initCrum = [{ name: '...' }];
            routeManager.setBreadcrum(initCrum);
            var matterinfo = getMatterData();

            if (utils.isEmptyObj(matterinfo) || (parseInt(matterinfo.intakeId) !== parseInt(matterId))) {
                fetchMatterData(matterId).then(function (response) {
                    var matterData = response;
                    addToBreadcrumList(matterData, matterId, pagename);
                });
            } else {
                addToBreadcrumList(matterinfo, matterId, pagename);
            }
        }

        function addToBreadcrumList(matteData, matterId, pagename) {
            var breadcrum = [
                {
                    name: matteData.intakeName, state: 'intake-overview',
                    param: { intakeId: matterId }
                },
                {
                    name: pagename,

                }];
            routeManager.addToBreadcrum(breadcrum);
        }

        function getMaster(data) {
            var deferred = $q.defer();
            $http({
                url: intakeConstants.RESTAPI.master,
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
                url: intakeConstants.RESTAPI.matter,
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
            var url = intakeConstants.RESTAPI.deleteMatter + '?' + getParams(data);
            return $http({
                url: url,
                method: "DELETE"
            });
        }

        // function getArchiveMatterData(matterIds) {
        //     var data = { 'mids': matterIds.toString() };
        //     var response;
        //     var url = intakeConstants.RESTAPI.archivematterData + '?' + getParams(data);
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
            var url = intakeConstants.RESTAPI.archivePayment + '?' + getParams(data);
            return $http.get(url, data)
        }

        function addMatter(data) {
            //data.importantdates = "[" + data.importantdates.toString() + "]";
            var deferred = $q.defer();
            var url = intakeConstants.RESTAPI.addMatter;
            //url += getParams(data);
            $http.post(url, data)
                .then(function (response) {
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function editMatter(data, matterId) {
            var url = intakeConstants.RESTAPI.addMatter + '/' + matterId;
            return $http.put(url, data);
        }

        function getMatterList(requestFilters, data) {
            var deferred = $q.defer();
            if (data == 'no_auth') {
                var token = {
                    'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                    'Content-type': 'application/json',
                    'no_auth': true
                }
            } else {
                var token = {
                    'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                    'Content-type': 'application/json'
                }
            }
            $http({
                url: intakeConstants.RESTAPI.getIntakeList,
                method: "POST",
                headers: token,
                data: requestFilters
            })
                .then(function (response) {
                    matterFactory.matterList = response.data;
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function saveMatterList() {
            return matterFactory.matterList;
        }

        function getMatterCount(filters, allMatter) {
            var url = (allMatter == 1) ? intakeConstants.RESTAPI.getAllMatterCount :
                intakeConstants.RESTAPI.getMyMatterCount;
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

        // function getArchiveMatterCount(filters, allMatter) {
        //     var url = intakeConstants.RESTAPI.getAllArchiveMatterCount;
        //     url += '?' + getParams(filters);
        //     return $http.get(url);
        // }

        //... End 

        function getAllMatters(requestFilters, allMatter) {
            var url = (allMatter == 1) ? intakeConstants.RESTAPI.allMatters : intakeConstants.RESTAPI.myMatters;
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
            var url = intakeConstants.RESTAPI.getMatterById + matterId;
            return $http({
                url: url,
                method: "GET",
                withCredentials: true
            });
        }

        function getURL(serviceUrl, id, categoryCheck) {
            var url = serviceUrl.replace("[ID]", id).replace("[CAT]", categoryCheck);
            return url;
        }

        function getImportantDates(matterId) {

            var url = getURL(intakeConstants.RESTAPI.getImportantDates, matterId);
            return $http.get(url,
                {
                    withCredentials: true
                });
        }

        function getUserAssignment(matterId) {
            var url = intakeConstants.RESTAPI.getUserAssignment + matterId;
            return $http({
                url: url,
                method: "GET",
                withCredentials: true
            });
        }

        function getStatusWiseCounts(intakeFlag) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: intakeConstants.RESTAPI.statusWiseCounts + "?myIntake=" + intakeFlag,
                method: "GET",
                headers: token,
                withCredentials: true,
            }).success(function (response) {
                deferred.resolve(response);
            });

            return deferred.promise;
        }

        function getInsuranceType() {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: intakeConstants.RESTAPI.InsuranceType,
                method: "GET",
                headers: token,
                withCredentials: true,
            }).success(function (response) {
                deferred.resolve(response);
            });

            return deferred.promise;
        }

        function downloadMatters(data) {
            var deferred = $q.defer();

            $http({
                url: intakeConstants.RESTAPI.downloadMatter,
                method: "POST",
                data: data,
                responseType: 'arraybuffer',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem('accessToken'),
                    'Content-type': 'application/json'
                }
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }

        function uploadMatters() { }

        function printMatters(dataList, filters, tab) {
            var output = getDataListTable(dataList, filters, tab);
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
                { name: 'index_number', desc: 'Index#' },
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
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" + (utils.isEmptyVal(val) ? '-' : moment.utc(val, 'X').format('MM/DD/YYYY')) + "</td>";
                    }
                    else if (titlevalue.name == 'settlement_date') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" + (utils.isEmptyVal(val) ? '-' : moment.utc(val, 'X').format('MM/DD/YYYY')) + "</td>";
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
                            '$' + $filter('number')(val, 2) + "</td>";
                    }
                    else if (titlevalue.name == 'total_paid') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" +
                            '$' + $filter('number')(val, 2) + "</td>";
                    } else if (titlevalue.name == 'outstanding_amount') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px;'>" +
                            '$' + $filter('number')(val, 2) + "</td>";
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

        function getDataListTable(dataList, filters, tab) {
            var stalledCase = angular.isUndefined(filters.statusCase) ? '' : filters.statusCase.name;
            var title = [
                { name: 'intakeName', desc: 'Lead Name' },
                { name: 'status_name', desc: 'Status' },
                { name: 'sub_status_name', desc: 'Sub Status' },
                { name: 'intakeType', desc: 'Type' },
                { name: 'intakeSubType', desc: 'Sub Type' },
                { name: 'intakeCategory', desc: 'Category' },
                { name: 'createdDate', desc: 'Date Created' },
                { name: 'assignedUserNames', desc: 'Assigned To' }
            ];

            if (tab == 'Migrated') {
                title.splice(7, 0, { name: 'migrationDate', desc: 'Migrated Date' });
            }

            var html = "<html><title>" + stalledCase + " Intake List</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}</style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt;'><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/><span>" + stalledCase + "</span> Intake List</h1><div></div>";
            html += "<body>";
            html += "<div><h2 style='text-align:left;padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";

            var updateFilters = _.filter(filters, function (status) {
                return status.name != 'Stalled';
            });
            angular.forEach(updateFilters, function (val, key) {
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

                if (value.name == 'dateofincidence') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'file_number') {
                    html += "<th style='border:1px solid #e2e2e2; background-color:#E9EEF0!important;-webkit-print-color-adjust:exact;border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'index_number') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else { html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + value.desc + "</th>"; }
            });
            html += "</tr>";


            if (dataList && dataList.intakeData) {
                angular.forEach(dataList.intakeData, function (data) {
                    html += "<tr>";
                    angular.forEach(title, function (titlevalue, titlekey) {
                        var val = (_.isNull(data[titlevalue.name])) ? '' : utils.removeunwantedHTML(data[titlevalue.name]);
                        if (titlevalue.name == 'status_name') {
                            //
                            val = (_.isNull(data.intakeStatus)) ? '' : _.isNull(data.intakeStatus.intakeStatusName) ? "" : data.intakeStatus.intakeStatusName;
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                        } else if (titlevalue.name == 'sub_status_name') {
                            val = (_.isNull(data.intakeSubStatus)) ? '' : _.isNull(data.intakeSubStatus.intakeSubStatusName) ? '' : data.intakeSubStatus.intakeSubStatusName;
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                        } else if (titlevalue.name == 'intakeType') {
                            val = (_.isNull(data.intakeType)) ? '' : _.isNull(data.intakeType.intakeTypeName) ? '' : data.intakeType.intakeTypeName;
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                        } else if (titlevalue.name == 'intakeSubType') {
                            val = (_.isNull(data.intakeSubType)) ? '' : _.isNull(data.intakeSubType.intakeSubTypeName) ? '' : data.intakeSubType.intakeSubTypeName;
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                        } else if (titlevalue.name == 'intakeCategory') {
                            val = (_.isNull(data.intakeCategory)) ? '' : _.isNull(data.intakeCategory.intakeCategoryName) ? '' : data.intakeCategory.intakeCategoryName;
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                        } else if (titlevalue.name == 'createdDate') {
                            val = (_.isNull(data.createdDate)) ? '' : data.createdDate;
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + (utils.isEmptyVal(val) ? "-" : (moment.unix(val).utc().format('MM/DD/YYYY'))) + "</td>";
                        }
                        else if (titlevalue.name == 'migrationDate' && tab == 'Migrated') {
                            val = (_.isNull(data.migrationDate)) ? '' : data.migrationDate;
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + (utils.isEmptyVal(val) ? "-" : (moment.unix(val).utc().format('MM/DD/YYYY'))) + "</td>";
                        }

                        else if (titlevalue.name == 'assignedUserNames') {
                            val = _.pluck(data.assignedUser, 'userName').join(",");
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                        } else {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;'>" + val + "</td>";
                        }
                    });
                    html += "</tr>";
                });
            }

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
            var url = intakeConstants.RESTAPI.evidencePhotos;
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
            var statusOrder = ['New Case', 'Litigation', 'Discovery', 'Trial', 'Settled', 'Closed'];
            var matterAgeData = [];
            _.forEach(statusOrder, function (status) {
                var ageData = _.find(matterAge, function (age) {
                    return age.status === status;
                });
                if (ageData) {
                    ageData.days = ageData.avg + " Days";
                    matterAgeData.push(ageData)
                } else {
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

        function searchMatters(name, migrate) {

            var dataObj = {
                "page_number": 1,
                "page_size": 1000,
                "name": name,
                "is_migrated": migrate
            };
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: intakeConstants.RESTAPI.getIntakeList,
                method: "POST",
                headers: token,
                data: dataObj
            })
                .then(function (response) {

                    if (response.data.intakeData) {
                        _.forEach(response.data.intakeData, function (item, index) {
                            item.createdDate = moment.unix(item.createdDate).utc().format('MM/DD/YYYY');
                        });
                        return response.data.intakeData;
                    } else {
                        return [];
                    }
                    //  _.forEach(response.data.intakeData, function (item, index) {
                    //   item.createdDate = moment.unix(item.createdDate).utc().format('MM/DD/YYYY');
                    //  });
                    // return response.data.intakeData;
                }, function (error) {
                });
        }

        function getAllUsers() {
            var url = intakeConstants.RESTAPI.allUsers;
            // return $http.get(url);
        }

        function getContactsByName(name, data) {
            var deferred = $q.defer();
            if (data == 'no_auth') {
                var token = {
                    'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                    'Content-type': 'application/json',
                    'no_auth': true
                }
            } else {
                var token = {
                    'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                    'Content-type': 'application/json'
                }
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

        function getContactById(id) {
            var url = intakeConstants.RESTAPI.getContactById + id;
            return $http.get(url);
        }

        function setNamePropForContacts(contacts) {
            _.forEach(contacts, function (contact) {
                contact.name = utils.removeunwantedHTML(contact.firstname) + ' ' + utils.removeunwantedHTML(contact.lastname);
            });
        }

        function yesNoFn(number) {
            var type = '';
            switch (number) {
                case '1':
                    type = "Yes";
                    break;
                case '2':
                    type = "No";
                    break;
                case '3':
                    type = "Don't Know";
                    break;
            }
            return type;
        }

        function openOccupationfn(data) {
            switch (data) {
                case '1':
                    return "Driver";
                    break;
                case '2':
                    return "Passenger";
                    break;
                case '3':
                    return "Pedestrian ";
                    break;
                case '4':
                    return "Cyclist ";
                    break;
            }
        }

        function typeOfIncidentFn(data) {
            switch (data) {
                case '1':
                    return "Trip and Fall";
                    break;
                case '2':
                    return "Slip and Fall";
                    break;
                case '3':
                    return "Assault ";
                    break;
                default:
                    return "-";
            }
        }

        function typeOfBuildingFn(data) {
            switch (data) {
                case '1':
                    return "Commercial";
                    break;
                case '2':
                    return "Residential";
                    break;
                case '3':
                    return "City owned";
                    break;
            }
        }

        function checkProp(data) {
            if (angular.isUndefined(data) || data == null || data == "") {
                return "-";
            } else {
                return data;
            }
        }

        function isAliveFn(data) {
            switch (data) {
                case 0:
                    return "Deceased"
                    break;
                case 1:
                    return "Alive"
                    break;
                case 2:
                    return "Not Specified"
                    break;
            }
        }

        function salaryModeFn(data) {
            switch (data) {
                case 1:
                    return "Hourly"
                    break;
                case 2:
                    return "Monthly"
                    break;
                case 3:
                    return "Yearly"
                    break;
                case 4:
                    return "Weekly"
                    break;
            }
        }


        function printMatterOverview(intakeOverviewData) {
            var other_details;
            var plaintiff1EmpltyObj = {
                "plaintiff1": {
                    "intakePlaintiffId": 0,
                    "placeOfBirth": "",
                    "nationality": "",
                    "InstituteName": "",
                    "Program": "",
                    "DaysAbsent": "",
                    "typeOfPerson": "Not Specified",
                    "spouseName": "",
                    "street": "",
                    "city": "",
                    "state": "",
                    "zipCode": "",
                    "country": "",
                    "contactList": "",
                    "childrenList": "",
                    "insuranceDetails": "3",
                    "describeDenial": "",
                    "describeDetails": "",
                    "denied": "3",
                    "State": "3",
                    "deniedMedicare": "3",
                    "medicare": "3",
                    "medicareNext": "3",
                    "healthInsuranceFrom": "",
                    "auto": "3",
                    "memo": "",
                    "service": "3",
                    "serviceBranch": "",
                    "describeMilitary": "",
                    "serviceNumber": "",
                    "datesOfService": "",
                    "typeOfDischarge": "",
                    "awardsReceived": "",
                    "information": "",
                    "percentage": "",
                    "injuredparts": "",
                    "injuries": "3",
                    "driverLiscenseNumber": "",
                    "timeheldLiscense": "",
                    "paymentsCoverage": "3",
                    "coverage": "",
                    "yearOfVehicalAuto": "",
                    "modelOfVehicalAuto": "",
                    "colorOfVehicalAuto": "",
                    "yearOfVehicalOther": "",
                    "modelOfVehicalOther": "",
                    "colorOfVehicalOther": "",
                    "optionDamaged": "3",
                    "describe": "",
                    "optionTowed": "3",
                    "describeTowed": "",
                    "optionEstimate": "3",
                    "estimateToRepair": "",
                    "optionPhotographs": "3",
                    "proDamaged": "",
                    "propDamage": "",
                    "injuredareas": "",
                    "Description": "",
                    "aid": "3",
                    "describeAid": "",
                    "claim": "3",
                    "describeClaim": "",
                    "listHealthCare": "",
                    "court": "3",
                    "describeBankruptcyCourt": "",
                    "contemplat": "3",
                    "contemplatingFilling": "",
                    "lawsuit": "3",
                    "describeLawsuit": "",
                    "judgments": "3",
                    "describeJudgmentsPending": "",
                    "aidType": "3",
                    "stateAid": "",
                    "childSupport": "",
                    "obligation": "3",
                    "alcoholorDrug": "3",
                    "describeAlcohol": "",
                    "claimDoubleCheck": "3",
                    "describeCarAccident": "",
                    "noClaim": "3",
                    "describeInjured": "",
                    "MRIorCTScan": "3",
                    "describeMRIOrCT": "",
                    "convictions": "3",
                    "describeConvictions": "",
                    "dateCriminal": "",
                    "placeCriminal": "",
                    "incarcerate": "3",
                    "detailsCriminal": "",
                    "claimLawsuit": "3",
                    "natureOfClaim": "",
                    "dateClaimLawsit": "",
                    "detailsClaimLawsit": "",
                    "SSD": "3",
                    "natureOfDisability": "",
                    "dateDeterminedDisabled": "",
                    "nature": "",
                    "describeNature": "",
                    "prenatalVisit": "",
                    "dueDate": "",
                    "streetPrenatal": "",
                    "parentalCity": "",
                    "statePrenatal": "",
                    "zIPCode": "",
                    "countryPrenatal": "",
                    "nameAndAddress1Parental": "",
                    "nameAndAddress2Parental": "",
                    "nameAndAddress3Parental": "",
                    "accidentPrior": "",
                    "priorLaw": "",
                    "typeAccident": "",
                    "whenWhere": "",
                    "isInjured": "",
                    "reInjured": "",
                    "selectInjuries": "",
                    "notes": "",
                    "birthInfoServiceProvider": "",
                    "physicianName": "",
                    "birthDateInfo": "",
                    "timeOfBirthInfo": "",
                    "dateOfTimeInfo": "",
                    "labor": "",
                    "dateWaterBroke": "",
                    "timeWaterBroke": "",
                    "childDateOFBirth": "",
                    "timeOfBirth": "",
                    "birthDateDischarge": "",
                    "pediatriciansName": "",
                    "neurologistsName": "",
                    "birthContactList": [{
                        "id": "phone2861",
                        "contactTypeName": "Cell"
                    }],
                    "nameOfChild": "",
                    "dateChildBirth": "",
                    "ChildSsn": "",
                    "otherdetails": null,
                    "Treatment2": {
                        "insuranceProviderList": [{
                            "id": "insuranceProviderList"
                        }]
                    },
                    "damage": null,
                    "inciDetail": null,
                    "mvaTreatment": {
                        "optionAmbulance": "3",
                        "emsinfo": "3",
                        "optionInjuries": "3"
                    },
                    "mvaIncident": {
                        "country": "",
                        "stateshow": true,
                        "reportToPolice": "3",
                        "mvField": "3",
                        "clientCopy": "3",
                        "timeAccident": ""
                    },
                    "basicInfoOtherDetails": {
                        "deathCertificate": "3",
                        "administration": "3"
                    },
                    "automobileOtherDetails": {
                        "nofaultInsurance": "3",
                        "accidentReportedCompany": "3",
                        "noFaultClaim": "3",
                        "clientCopy": "3",
                        "hitAndRun": "3",
                        "hitAndRunNotice": "3",
                        "deathCertificate": "3",
                        "client_Copy": "3",
                        "clientVehicle": "3",
                        "auto": "3"
                    },
                    "defautomobileOtherDetails": {},
                    "details": {
                        "witnessNameListForDetails": [],
                        "insurance": "3",
                        "employment": "3"
                    },
                    "healthMedicare": null,
                    "MedMalDetails": null,
                    "MedMal": null,
                    "MiscellaneousMedMal": {
                        "medicalRecordCopies": "",
                        "havePhotos": ""
                    },
                    "IncDetailsForPremises": {
                        "country": "",
                        "accidentOccur": "3",
                        "accidentOccur2": "3",
                        "accidentOccurBlg": "3",
                        "accInvolveSteps": "3",
                        "accInvolveElevator": "3",
                        "picTaken": "3",
                        "timeAccident": ""
                    },
                    "witnessOtherDetails": {
                        "witness": "3"
                    }
                }
            };
            utils.isNotEmptyVal(intakeOverviewData.Other_Details[0]) ? other_details = JSON.parse(intakeOverviewData.Other_Details[0].detailsJson) : other_details = plaintiff1EmpltyObj;
            var mvaIncidentCopy = utils.isNotEmptyVal(intakeOverviewData.Basic_Details) ? intakeOverviewData.Basic_Details.intakeData[0].accidentDate : '';
            var intakeTypeName = intakeOverviewData.Basic_Details.intakeData[0].intakeType.intakeTypeName;
            var intakeSubTypeName = intakeOverviewData.Basic_Details.intakeData[0].intakeSubType.intakeSubTypeName;
            var strVar = "";
            strVar += '<!DOCTYPE html>';
            strVar += '<html lang="en">';
            strVar += '<head>';
            strVar += '    <meta charset="utf-8">';
            strVar += '    <meta http-equiv="X-UA-Compatible" content="IE=edge">';
            strVar += '    <title>CloudLex Intake Print</title>';
            strVar += '    <link rel="shortcut icon" href="favicon.ico" type="image/vnd.microsoft.icon">';
            strVar += '    <style>';
            strVar += '        h1,h2,h3,h4,h5,h6,p{padding: 0;margin: 0;}';
            strVar += '        h1{font-size: 18pt;}';
            strVar += '        h2{font-size: 13pt;}';
            strVar += '        h3{font-size: 12pt;}';
            strVar += '        strong{font-size: 10.5pt;}';
            strVar += '        p{font-size: 10pt;}';
            strVar += '        .main{margin:10px 0% 10px 2%;}';
            strVar += '        .sub-main{margin:0px 0% 10px 2%;}';
            strVar += '        .plaintiff-table{border: 1px solid #d3d9de;padding: 5px 0;}';
            strVar += '        .grid-table{border-left: 1px solid #e2e2e2;}';
            strVar += '        *{vertical-align: top !important;}';
            strVar += '        .grid-table th{border-right: 1px solid #e2e2e2;border-collapse: collapse;text-align: left;vertical-align: top !important;border-bottom:1px solid #e2e2e2;border-top:1px solid #e2e2e2;}';
            strVar += '        .grid-table td{border-right:1px solid #e2e2e2;border-collapse: collapse;text-align: left;vertical-align: top !important;border-bottom:1px solid #e2e2e2;}';
            strVar += '    </style>';
            strVar += '</head>';
            strVar += '<body style="font-family: \'Calibri\', Fallback, sans-serif;margin:2% 5%;font-size: 8pt;">';
            strVar += '    <img src="https://app.cloudlex.net/styles/images/logo.png" width="200px">';
            strVar += '    <h1 style="float:right"><img src="favicon.ico" style="position: relative; top: 8px; right: 6px;">Intake Details</h1>';
            strVar += '    <div style="width:100%; clear:both">';
            strVar += '        <button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button>';
            strVar += '    </div>';
            strVar += '    <!-- Start HTML For Overview Print -->';
            strVar += '    <h1>Overview</h1>';
            strVar += '    <div class="main">';
            strVar += '        <table width="100%" cellspacing="0" cellpadding="0">';
            strVar += '            <tr>';
            strVar += '                <td valign="top" style="width: 30%;border-right:1px solid #d3d9de;padding-right: 20px;">';
            strVar += '                    <h2 style="border-bottom: 1px solid #d3d9de;padding-bottom: 5px;">Basic Details</h2>';
            strVar += '                    ';
            strVar += '                    <div style="margin-top: 10px;">';
            strVar += '                        <strong>Name:</strong>';
            strVar += '                        <p>';
            strVar += utils.removeunwantedHTML(intakeOverviewData.Basic_Details.intakeData[0].intakeName);
            strVar += '                        </p>';
            strVar += '                    </div>';
            strVar += '                    <div style="margin-top: 10px;">';
            strVar += '                        <strong>Type:</strong>';
            strVar += '                        <p>';
            strVar += intakeOverviewData.Basic_Details.intakeData[0].intakeType.intakeTypeName;
            strVar += '                        </p>';
            strVar += '                    </div>';
            strVar += '                    <div style="margin-top: 10px;">';
            strVar += '                        <strong>Sub Type:</strong>';
            strVar += '                        <p>';
            strVar += intakeOverviewData.Basic_Details.intakeData[0].intakeSubType.intakeSubTypeName;
            strVar += '                        </p>';
            strVar += '                    </div>';
            strVar += '                    <div style="margin-top: 10px;">';
            strVar += '                        <strong>Category:</strong>';
            strVar += '                        <p>';
            strVar += utils.isNotEmptyVal(intakeOverviewData.Basic_Details.intakeData[0].intakeCategory.intakeCategoryName) ? intakeOverviewData.Basic_Details.intakeData[0].intakeCategory.intakeCategoryName : "-";
            strVar += '                        </p>';
            strVar += '                    </div>';
            strVar += '                    <div style="margin-top: 10px;">';
            strVar += '                        <strong>Lead Source:</strong>';
            if (utils.isNotEmptyVal(intakeOverviewData.Basic_Details.intakeData[0]) && intakeOverviewData.Basic_Details.intakeData[0].leadSource == "Other") {
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(intakeOverviewData.Basic_Details.intakeData[0].leadSourceDescription) ? intakeOverviewData.Basic_Details.intakeData[0].leadSourceDescription : "-";
                strVar += '                        </p>';
            } else {
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(intakeOverviewData.Basic_Details.intakeData[0].leadSource) ? intakeOverviewData.Basic_Details.intakeData[0].leadSource : "-";
                strVar += '                        </p>';
            }
            strVar += '                    </div>';
            strVar += '                    <div style="margin-top: 10px;">';
            strVar += '                        <strong>Date of Intake:</strong>';
            strVar += '                        <p class="ng-binding">';
            strVar += intakeOverviewData.Basic_Details.intakeData[0].dateOfIntake == null ? "-" : ($filter('utcDateFilter')(intakeOverviewData.Basic_Details.intakeData[0].dateOfIntake, "MM/DD/YYYY", 1, "start"));
            strVar += '                        </p>';
            strVar += '                    </div>';
            strVar += '                    <div style="margin-top: 10px;">';
            strVar += '                        <strong>Referred To:</strong>';
            strVar += '                        <p class="ng-binding">';
            strVar += intakeOverviewData.Basic_Details.intakeData[0].referredTo == null ? "-" : ((intakeOverviewData.Basic_Details.intakeData[0].referredTo.firstName) + " " + (intakeOverviewData.Basic_Details.intakeData[0].referredTo.lastName));
            strVar += '                        </p>';
            strVar += '                    </div>';
            strVar += '                    <div style="margin-top: 10px;">';
            strVar += '                        <strong>Referred By:</strong>';
            strVar += '                        <p class="ng-binding">';
            strVar += intakeOverviewData.Basic_Details.intakeData[0].referredBy == null ? "-" : ((intakeOverviewData.Basic_Details.intakeData[0].referredBy.firstName) + " " + (intakeOverviewData.Basic_Details.intakeData[0].referredBy.lastName));
            strVar += '                        </p>';
            strVar += '                    </div>';
            strVar += '                    <div style="margin-top: 10px;">';
            strVar += '                        <strong>';
            strVar += utils.isNotEmptyVal(intakeOverviewData.Basic_Details.intakeData[0].intakeAmount) ? $filter('currency')(intakeOverviewData.Basic_Details.intakeData[0].intakeAmount, '$', 2) : "-";
            strVar += '                        </strong>';
            strVar += '                    </div>';
            strVar += '                    ';
            strVar += '                </td>';
            strVar += '                <td valign="top" style="width: 70%;padding-left: 20px;">';
            strVar += '                    <h2 style="border-bottom: 1px solid #d3d9de;padding-bottom: 5px;margin-bottom: 10px;">Plaintiff</h2>';
            strVar += '                        <table width="100%" cellspacing="0" cellpadding="5px">';
            strVar += '                            <tr style="background-color: #E9EEF0;">';
            strVar += '                                <th width="50%" align="left"><strong>Name</strong></th>';
            strVar += '                                <th width="50%" align="left"><strong>Phone</strong></th>';
            strVar += '                            </tr>';
            strVar += '                            <tr>';
            strVar += '                                <td><p>';
            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].contact) ? utils.removeunwantedHTML(intakeOverviewData.Plaintiff_Details[0].contact.firstName) + " " + utils.removeunwantedHTML(intakeOverviewData.Plaintiff_Details[0].contact.lastName) : "-";
            strVar += '                                </p></td>';
            strVar += '                                <td>';
            if (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].contact)) {
                var phone, img;
                var conObj = intakeOverviewData.Plaintiff_Details[0].contact;
                if (utils.isNotEmptyVal(conObj.phoneCell)) {
                    phone = conObj.phoneCell;
                    img = globalConstants.images_path + "print_cell.svg";
                }
                else if (utils.isNotEmptyVal(conObj.phoneWork)) {
                    phone = conObj.phoneWork;
                    img = globalConstants.images_path + "print_work.svg";
                }
                else if (utils.isNotEmptyVal(conObj.phoneHome)) {
                    phone = conObj.phoneHome;
                    img = globalConstants.images_path + "print_home.svg";
                }
                else {
                    phone = "-";
                    img = globalConstants.images_path + "print_cell.svg";
                }

                strVar += "<p><span class='sprite default-contactPhone-new pull-left' style=\"";
                strVar += "        margin-right:10px;\"><img src=" + img + "><\/span><span style=\"display: inline-block;width: 80%;vertical-align: top;\">" +
                    phone +
                    "<\/span>";
            } else {
                strVar += "-";
            }

            strVar += '                                </p></td>';
            strVar += '                            </tr>';
            strVar += '                        </table>';
            strVar += '                    <h2 style="border-bottom: 1px solid #d3d9de;padding-bottom: 5px;margin-top: 20px;">Incident Details</h2>';
            strVar += '                        <div style="margin-top: 10px;float: left;width: 22%;">';
            strVar += '                            <strong>Date of Incident:</strong>';
            strVar += '                            <p>';
            strVar += ($filter('utcDateFilter')(intakeOverviewData.Basic_Details.intakeData[0].accidentDate, "MM/DD/YYYY", 1, "start"));
            strVar += '                            </p>';
            strVar += '                        </div>';
            strVar += '                        <div style="margin-top: 10px;">';
            strVar += '                            <strong>Service Responded:</strong>';
            strVar += '                            <p>';
            strVar += (utils.isNotEmptyVal(intakeOverviewData.Basic_Details.intakeData[0].otherInfo) && intakeOverviewData.Basic_Details.intakeData[0].otherInfo != "null" && intakeOverviewData.Basic_Details.intakeData[0].otherInfo != '""') ? (JSON.parse(intakeOverviewData.Basic_Details.intakeData[0].otherInfo)).join(",") : "-";
            strVar += '                            </p>';
            strVar += '                        </div>';
            strVar += '                        <div style="margin-top: 10px;">';
            strVar += '                            <strong>Location of Incident:</strong>';
            strVar += '                            <p>';
            strVar += utils.isNotEmptyVal(intakeOverviewData.Basic_Details.intakeData[0].accidentLocation) ? utils.removeunwantedHTML(intakeOverviewData.Basic_Details.intakeData[0].accidentLocation) : "-";
            strVar += '                            </p>';
            strVar += '                        </div>';
            strVar += '                        <div style="margin-top: 10px;">';
            strVar += '                            <strong>Description of Incident:</strong>';
            strVar += '                            <p>';
            strVar += utils.isNotEmptyVal(intakeOverviewData.Basic_Details.intakeData[0].description) ? utils.removeunwantedHTML(intakeOverviewData.Basic_Details.intakeData[0].description) : "-";
            strVar += '                            </p>';
            strVar += '                        </div>';
            strVar += '                </td>';
            strVar += '            </tr>';
            strVar += '        </table>';
            strVar += '    </div>';
            strVar += '    <!-- End HTML For Overview Print -->';
            strVar += '    ';
            strVar += '    <!-- Start HTML For Plaintiff Print -->';
            strVar += '    <h1>Details</h1>';
            strVar += '    <div class="main">';
            strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Client Details</h2>';
            strVar += '        <div class="sub-main">';
            strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Basic Details</h3>';
            strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
            strVar += '                <tr>';
            strVar += '                    <td width="8%">';
            strVar += '                        <strong>Gender</strong>';
            strVar += '                        <p>';
            strVar += intakeOverviewData.Plaintiff_Details[0].gender;
            strVar += '                        </p>';
            strVar += '                    </td>';
            strVar += '                    <td width="12%">';
            strVar += '                        <strong>Date of Birth</strong>';
            strVar += '                        <p>';
            strVar += ($filter('utcDateFilter')(intakeOverviewData.Plaintiff_Details[0].dateOfBirth, "MM/DD/YYYY", 1, "start"));
            strVar += '                        </p>';
            strVar += '                    </td>';
            strVar += '                    <td width="12%">';
            strVar += '                        <strong>Place of Birth</strong>';
            strVar += '                        <p>';
            strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.placeOfBirth));
            strVar += '                        </p>';
            strVar += '                    </td>';
            strVar += '                    <td width="12%">';
            strVar += '                        <strong>Primary Language</strong>';
            strVar += '                        <p>';
            strVar += utils.removeunwantedHTML(checkProp(intakeOverviewData.Plaintiff_Details[0].primaryLanguage));
            strVar += '                        </p>';
            strVar += '                    </td>';
            strVar += '                    <td width="12%">';
            strVar += '                        <strong>Status</strong>';
            strVar += '                        <p>';
            strVar += isAliveFn(intakeOverviewData.Plaintiff_Details[0].isAlive);
            strVar += '                        </p>';
            strVar += '                    </td>';
            strVar += '                </tr>';
            strVar += '                <tr>';
            if (intakeOverviewData.Plaintiff_Details[0].isAlive == 0) {
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Date of Death</strong>';
                strVar += '                        <p>';
                strVar += ($filter('utcDateFilter')(intakeOverviewData.Plaintiff_Details[0].dateOfDeath, "MM/DD/YYYY", 1, "start"));
                strVar += '                        </p>';
                strVar += '                    </td>';

                strVar += '                    <td width="20%">';
                strVar += '                        <strong>Estate Administrator/Executor</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].estateAdminId) ? (intakeOverviewData.Plaintiff_Details[0].estateAdminId.firstName + " " + intakeOverviewData.Plaintiff_Details[0].estateAdminId.lastName) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';

                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Death certificate?</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.basicInfoOtherDetails) ? yesNoFn(other_details.plaintiff1.basicInfoOtherDetails.deathCertificate) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';

                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td colspan="5">';
                strVar += '                        <strong>Family tree history?</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.basicInfoOtherDetails) ? checkProp(other_details.plaintiff1.basicInfoOtherDetails.familyTreeHistory) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';

                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Letters of administration?</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.basicInfoOtherDetails) ? yesNoFn(other_details.plaintiff1.basicInfoOtherDetails.administration) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';

            } else {
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Power of Attorney</strong>';
                strVar += '                        <p>';
                if (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].poa)) {
                    var firstname, lastName;
                    utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].poa.firstName) ? firstname = utils.removeunwantedHTML(intakeOverviewData.Plaintiff_Details[0].poa.firstName) : firstname = "";
                    utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].poa.lastName) ? lastName = utils.removeunwantedHTML(intakeOverviewData.Plaintiff_Details[0].poa.lastName) : lastName = "";
                    strVar += firstname + " " + lastName;
                } else {
                    strVar += "-";
                }
                strVar += '                        </p>';
                strVar += '                    </td>';
            }
            strVar += '                    <td width="12%">';
            strVar += '                        <strong>Nationality</strong>';
            strVar += '                        <p>';
            strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.nationality));
            strVar += '                        </p>';
            strVar += '                    </td>';
            strVar += '                    <td width="12%">';
            strVar += '                        <strong>Social Security Number</strong>';
            strVar += '                        <p>';
            strVar += checkProp(intakeOverviewData.Plaintiff_Details[0].ssn);
            strVar += '                        </p>';
            strVar += '                    </td>';
            strVar += '                </tr>';
            strVar += '            </table>';
            strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Marital Details</h3>';
            strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
            strVar += '                <tr>';
            strVar += '                    <td width="8%" valign="top">';
            strVar += '                        <strong>';
            var input = (intakeOverviewData.Plaintiff_Details[0].maritalStatus).toLowerCase();
            input = input.substring(0, 1).toUpperCase() + input.substring(1);
            strVar += input;
            strVar += '                        </strong>';
            strVar += '                    </td>';
            if (intakeOverviewData.Plaintiff_Details[0].maritalStatus == "married") {
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Spouse Name</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.spouseName));
                strVar += '                        </p>';
                strVar += '                    </td>';
                var phone, contactList;
                if (utils.isNotEmptyVal(_.where(other_details.plaintiff1.contactList, { 'contactTypeName': "Cell" }))) {
                    var obj = _.where(other_details.plaintiff1.contactList, { 'contactTypeName': "Cell" });
                    contactList = _.map(obj, function (item) {
                        var phoneIcon = '<p><span style="background-image: url(../styles/images/sprite.png);display: inline-block;background-position: -115px -489px;height: 16px;width: 11px;margin-right: 5px;float: left;"></span>';
                        utils.isNotEmptyVal(item.ext) ? phone = phoneIcon + item.name + " Ext: " + item.ext : phone = phoneIcon + item.name;
                        return phone;
                    })
                } else if (utils.isNotEmptyVal(_.where(other_details.plaintiff1.contactList, { 'contactTypeName': "Home" }))) {
                    var obj = _.where(other_details.plaintiff1.contactList, { 'contactTypeName': "Home" });
                    contactList = _.map(obj, function (item) {
                        var phoneIcon = '<p><span style="background-image: url(../styles/images/sprite.png);display: inline-block;background-position: -113px -593px;;height: 14px;width: 16px;top: 2px;position: relative;margin-right: 5px;"></span>';
                        utils.isNotEmptyVal(item.ext) ? phone = phoneIcon + item.name + " Ext: " + item.ext : phone = phoneIcon + item.name;
                        return phone;
                    })
                } else if (utils.isNotEmptyVal(_.where(other_details.plaintiff1.contactList, { 'contactTypeName': "Work" }))) {
                    var obj = _.where(other_details.plaintiff1.contactList, { 'contactTypeName': "Work" });
                    contactList = _.map(obj, function (item) {
                        var phoneIcon = '<p><span style="background-image: url(../styles/images/sprite.png);display: inline-block;background-position: -113px -567px;height: 14px;width: 16px;top: 2px;position: relative;margin-right: 5px;"></span>';
                        utils.isNotEmptyVal(item.ext) ? phone = phoneIcon + item.name + " Ext: " + item.ext : phone = phoneIcon + item.name;
                        return phone;
                    })
                }
                strVar += '                    <td width="18%">';
                strVar += '                        <strong>Contact Number</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(contactList) ? contactList : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';

                var childName = _.map(other_details.plaintiff1.childrenList, function (item) {
                    var val;
                    utils.isNotEmptyVal(item.name) ? val = utils.removeunwantedHTML(item.name) : val = "-";
                    return val;
                })
                var childAge = _.map(other_details.plaintiff1.childrenList, function (item) {
                    var val;
                    utils.isNotEmptyVal(item.age) ? val = item.age : val = "-";
                    return val;
                })
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Child Name</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.childrenList) ? childName : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Child Age</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.childrenList) ? childAge : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';

                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Street</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.street));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>City</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.city));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>State</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.state));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td width="8%">';
                strVar += '                        <strong>ZIP Code</strong>';
                strVar += '                        <p>';
                strVar += checkProp(other_details.plaintiff1.zipCode);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Country</strong>';
                strVar += '                        <p>';
                strVar += checkProp(other_details.plaintiff1.country);
                strVar += '                        </p>';
                strVar += '                    </td>';
            }

            strVar += '                </tr>';
            strVar += '            </table>';
            strVar += '        </div>';
            strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Employment & Educational Details</h2>';
            strVar += '        <div class="sub-main">';
            strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Employment Details</h3>';
            strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';

            for (var i = 0; i < intakeOverviewData.Plaintiff_Details[0].intakeEmployer.length; i++) {
                strVar += '                <tr>';
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Employer</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeEmployer[i].contact) ? utils.removeunwantedHTML(intakeOverviewData.Plaintiff_Details[0].intakeEmployer[i].contact.firstName) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="8%">';
                strVar += '                        <strong>Start Date</strong>';
                strVar += '                        <p>';
                strVar += ($filter('utcDateFilter')(intakeOverviewData.Plaintiff_Details[0].intakeEmployer[i].employmentStartDate, "MM/DD/YYYY"));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="8%">';
                strVar += '                        <strong>End Date</strong>';
                strVar += '                        <p>';
                strVar += ($filter('utcDateFilter')(intakeOverviewData.Plaintiff_Details[0].intakeEmployer[i].employmentEndDate, "MM/DD/YYYY"));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="15%">';
                strVar += '                        <strong>Occupation</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(intakeOverviewData.Plaintiff_Details[0].intakeEmployer[i].occupation));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Salary Mode</strong>';
                strVar += '                        <p>';
                strVar += salaryModeFn(intakeOverviewData.Plaintiff_Details[0].intakeEmployer[i].salaryMode);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Position</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(intakeOverviewData.Plaintiff_Details[0].intakeEmployer[i].position));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Salary</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeEmployer[i].monthlySalary) ? $filter('currency')(intakeOverviewData.Plaintiff_Details[0].intakeEmployer[i].monthlySalary, '$', 2) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Days Lost</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeEmployer[i]) ? utils.removeunwantedHTML(checkProp(intakeOverviewData.Plaintiff_Details[0].intakeEmployer[i].lostDays)) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td colspan="8" width="100%">';
                strVar += '                        <strong>Description</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(intakeOverviewData.Plaintiff_Details[0].intakeEmployer[i].memo));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
            }
            strVar += '            </table>';
            strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Educational Details</h3>';
            strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
            strVar += '                <tr>';
            strVar += '                    <td width="11.7%">';
            strVar += '                        <strong>School Information: Institute Name</strong>';
            strVar += '                        <p>';
            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].studentInstitution) && utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].studentInstitution.firstName) ? utils.removeunwantedHTML(intakeOverviewData.Plaintiff_Details[0].studentInstitution.firstName) : '-';
            strVar += '                        </p>';
            strVar += '                    </td>';
            strVar += '                    <td width="6.5%">';
            strVar += '                        <strong>Program</strong>';
            strVar += '                        <p>';
            strVar += utils.removeunwantedHTML(checkProp(intakeOverviewData.Plaintiff_Details[0].studentProgram));
            strVar += '                        </p>';
            strVar += '                    </td>';
            strVar += '                    <td width="20%">';
            strVar += '                        <strong>Days Absent</strong>';
            strVar += '                        <p>';
            strVar += checkProp(intakeOverviewData.Plaintiff_Details[0].studentLostDays);
            strVar += '                        </p>';
            strVar += '                    </td>';
            strVar += '                </tr>';
            strVar += '            </table>';
            strVar += '        </div>';

            if (intakeTypeName == "Personal Injury" && intakeSubTypeName == "MVA") {
                //console.log("MVA");
                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Incident Details</h2>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Incident Details</h3>';
                strVar += '            <div class="plaintiff-table">';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Date of Incident</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(intakeOverviewData.Basic_Details.intakeData[0].accidentDate) ? ($filter('utcDateFilter')(intakeOverviewData.Basic_Details.intakeData[0].accidentDate, "MM/DD/YYYY", 1, "start")) : (utils.isNotEmptyVal(mvaIncidentCopy) ? $filter('utcDateFilter')(mvaIncidentCopy, "MM/DD/YYYY", 1, "start") : "-");
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Day of Incident</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(intakeOverviewData.Basic_Details.intakeData[0].accidentDate) ? ($filter('utcDateFilter')(intakeOverviewData.Basic_Details.intakeData[0].accidentDate, "dddd", 1, "start")) : (utils.isNotEmptyVal(mvaIncidentCopy) ? $filter('utcDateFilter')(mvaIncidentCopy, "dddd", 1, "start") : "-");
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Time of Incident</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.mvaIncident.timeAccident) ? moment(other_details.plaintiff1.mvaIncident.timeAccident).format("HH:mm") : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="30%">';
                strVar += '                        <strong>Were you a driver, passenger, pedestrian or cyclist?</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.mvaIncident.openOccupation) ? utils.removeunwantedHTML(openOccupationfn(other_details.plaintiff1.mvaIncident.openOccupation)) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="30%">';
                strVar += '                        <strong>Road conditions on the date of incident?</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.mvaIncident.roadConditionAccident) ? utils.removeunwantedHTML(checkProp(other_details.plaintiff1.mvaIncident.roadConditionAccident)) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <b style="padding: 5px;margin-top: 10px;display: block;font-size: 11.5pt;">Location of Incident</b>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td width="9.5%">';
                strVar += '                        <strong>Street</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.mvaIncident.mvaStreet));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="9.5%">';
                strVar += '                        <strong>City/Town</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.mvaIncident.mvaCity));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="9.5%">';
                strVar += '                        <strong>State</strong>';
                strVar += '                        <p>';
                strVar += checkProp(other_details.plaintiff1.mvaIncident.state);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="9.5%">';
                strVar += '                        <strong>ZIP Code</strong>';
                strVar += '                        <p>';
                strVar += checkProp(other_details.plaintiff1.mvaIncident.mvaZipCode);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="10%">';
                strVar += '                        <strong>Country</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.mvaIncident.country) ? checkProp(other_details.plaintiff1.mvaIncident.country) : "United States";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="28%">';
                strVar += '                        <strong>Was incident reported to police?</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(yesNoFn(other_details.plaintiff1.mvaIncident.reportToPolice));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                if (other_details.plaintiff1.mvaIncident.reportToPolice == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td width="12.5%">';
                    strVar += '                        <strong>Police Report Number</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.mvaIncident.policeReportNo));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="12.5%">';
                    strVar += '                        <strong>Precinct No</strong>';
                    strVar += '                        <p>';
                    strVar += checkProp(other_details.plaintiff1.mvaIncident.predictNo);
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="12.5%">';
                    strVar += '                        <strong>Police Officer Name</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.mvaIncident.policeOfficerNo));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="12.5%">';
                    strVar += '                        <strong>Badge Number</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.mvaIncident.badgeNo));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                    <td width="13.3%">';
                strVar += '                        <strong>Was MV 104 filed?</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.mvaIncident.mvField) ? utils.removeunwantedHTML(yesNoFn(other_details.plaintiff1.mvaIncident.mvField)) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.mvaIncident.mvField == 1) {
                    strVar += '                    <td width="">';
                    strVar += '                        <strong>Date Filed</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.mvaIncident.mv104Date) ? moment(other_details.plaintiff1.mvaIncident.mv104Date).format("MM/DD/YYYY") : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                    <td width="">';
                strVar += '                        <strong>Does client have copy?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.mvaIncident.clientCopy);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td colspan="8">';
                strVar += '                        <strong>Vehicle information for your car or car you were a passenger in</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.mvaIncident.vehicalInformation) ? utils.removeunwantedHTML(other_details.plaintiff1.mvaIncident.vehicalInformation) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td colspan="7">';
                strVar += '                        <strong>Vehicle information for defendant(s)</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.mvaIncident.vehicalDefendentInfo) ? utils.removeunwantedHTML(other_details.plaintiff1.mvaIncident.vehicalDefendentInfo) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td colspan="7">';
                strVar += '                        <strong>Describe your incident in detail</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.mvaIncident.incidentDescription) ? utils.removeunwantedHTML(other_details.plaintiff1.mvaIncident.incidentDescription) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            </div>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Injuries & Treatment</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Injuries claimed?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.mvaTreatment.optionInjuries);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.mvaTreatment.optionInjuries == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="10">';
                    strVar += '                        <strong>Injury information</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.mvaTreatment.information) ? utils.removeunwantedHTML(other_details.plaintiff1.mvaTreatment.information) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Hospital</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.mvaTreatment.hospPhysicianId) ? utils.removeunwantedHTML(other_details.plaintiff1.mvaTreatment.hospPhysicianId.name) : '-';
                strVar += '                        </p>';
                strVar += '                        <strong>Hospital information</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.mvaTreatment.hospInformation) ? utils.removeunwantedHTML(other_details.plaintiff1.mvaTreatment.hospInformation) : '-';
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Were you taken by ambulance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.mvaTreatment.optionAmbulance);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Treated by any Medical Provider?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.mvaTreatment.emsinfo);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                if (other_details.plaintiff1.mvaTreatment.emsinfo == 1) {
                    if (intakeOverviewData.Plaintiff_Details && intakeOverviewData.Plaintiff_Details.length > 0 && intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords.length > 0) {

                        for (var i = 0; i < intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders.length; i++) {
                            strVar += '                    <td>';
                            strVar += '                        <strong>Service Provider</strong>';
                            strVar += '                        <p>';
                            if (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords) && intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i] != null && intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders.length > 0) {
                                // var serviceProviderName = _.map(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders, function (item) {
                                //     var fname, lname;
                                var fname = utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].medicalProviders) && utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].medicalProviders.firstName) ? intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].medicalProviders.firstName : "";
                                var lname = utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].medicalProviders) && utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].medicalProviders.lastName) ? intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].medicalProviders.lastName : "";
                                fname = utils.removeunwantedHTML(fname);
                                lname = utils.removeunwantedHTML(lname);
                                //   return fname + " " + lname;
                                // });
                                strVar += fname + " " + lname;
                            } else {
                                strVar += "-";
                            }
                            strVar += '                        </p>';
                            strVar += '                    </td>';


                            strVar += '                    <td>';
                            strVar += '                        <strong>Physician Name</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords) && utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].physician)) ? utils.removeunwantedHTML((intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].physician.firstName) + " " + utils.removeunwantedHTML(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].physician.lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>Start Date of Service</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords) ? ($filter('utcDateFilter')(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].serviceStartDate, "MM/DD/YYYY")) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>End Date of Service</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords) ? ($filter('utcDateFilter')(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].serviceEndDate, "MM/DD/YYYY")) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>Treatment Type</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords) ? utils.removeunwantedHTML(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].treatmentType) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                </tr>';
                        }
                    } else {
                        strVar += '                    <td>';
                        strVar += '                        <strong>Service Provider</strong>';
                        strVar += '                        <p>';
                        strVar += "-";

                        strVar += '                        </p>';
                        strVar += '                    </td>';


                        strVar += '                    <td>';
                        strVar += '                        <strong>Physician Name</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td>';
                        strVar += '                        <strong>Start Date of Service</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td>';
                        strVar += '                        <strong>End Date of Service</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td>';
                        strVar += '                        <strong>Treatment Type</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                </tr>';
                    }
                }





                strVar += '                ';
                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Damage Details</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Property Damaged?</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.proDamaged) ? yesNoFn(other_details.plaintiff1.proDamaged) : "Don't Know";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';

                if (other_details.plaintiff1.proDamaged == 1) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe Property Damage</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.propDamage) ? utils.removeunwantedHTML(other_details.plaintiff1.propDamage) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Was the vehicle damaged?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.optionDamaged);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.optionDamaged == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe Vehicle Damage</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describe));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Was the Vehicle Towed?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.optionTowed);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.optionTowed == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe why and by whom the vehicle was towed</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeTowed));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you have a property damage estimate?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.optionEstimate);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.optionEstimate == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>How much was the estimate to repair?</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.estimateToRepair));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you have property damage photographs?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.optionPhotographs);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Witness Details</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td width="30%">';
                strVar += '                        <strong>Were there any witnesses to your accident?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.witnessOtherDetails.witness);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.witnessOtherDetails.witness == 1) {
                    var witnessName = _.map(intakeOverviewData.Plaintiff_Details[0].intakeWitnesses, function (item) {
                        var fname, lname;
                        utils.isNotEmptyVal(item.contact.firstName) ? fname = utils.removeunwantedHTML(item.contact.firstName) : fname = "";
                        utils.isNotEmptyVal(item.contact.lastName) ? lname = utils.removeunwantedHTML(item.contact.lastName) : lname = "";
                        return fname + " " + lname;
                    });
                    strVar += '                    <td>';
                    strVar += '                        <strong>Name of Witness</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeWitnesses) ? utils.removeunwantedHTML(witnessName) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '        </div>';
                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Insurance Details</h2>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Health Insurance</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td width="">';
                strVar += '                        <strong>Have you ever had Medicaid/Medicare?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.medicare);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="">';
                strVar += '                        <strong>Do you presently have health insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.insuranceDetails);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.insuranceDetails == 1) {

                    var healthobj = _.map(intakeOverviewData.Plaintiff_Details[0].insuranceInfos, function (item) {
                        if (item.insuranceType == "Health") {
                            return item;
                        }
                    })
                    healthobj = healthobj.filter(function (element) {
                        return element !== undefined;
                    });
                    if (intakeOverviewData.Plaintiff_Details && intakeOverviewData.Plaintiff_Details.length > 0 && intakeOverviewData.Plaintiff_Details[0].insuranceInfos != null && healthobj.length != 0) {
                        _.forEach(healthobj, function (currentItem) {
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insured Party</strong>';
                            strVar += '                        <p>';
                            if (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.insuredParty)) {
                                var insuredPartyName = _.map(currentItem.insuredParty, function (item) {
                                    var fname, lname;
                                    utils.isNotEmptyVal(item.firstName) ? fname = utils.removeunwantedHTML(item.firstName) : fname = "";
                                    utils.isNotEmptyVal(item.lastName) ? lname = utils.removeunwantedHTML(item.lastName) : lname = "";
                                    return fname + " " + lname;
                                });
                                strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.insuredParty)) ? insuredPartyName : "-";

                            } else {
                                strVar += "-";
                            }
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insurance Provider</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.insuranceProvider)) ? (utils.removeunwantedHTML(currentItem.insuranceProvider.firstName) + '' + utils.removeunwantedHTML(currentItem.insuranceProvider.lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insurance Type</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.type)) ? checkProp(currentItem.type) : "";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Excess Confirmed</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.excessConfirmed)) ? checkProp(currentItem.excessConfirmed) : "Don't Know";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                </tr>';
                            strVar += '                <tr>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>Policy Exhausted</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.policyExhausted)) ? checkProp(currentItem.policyExhausted) : "Don't Know";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>Where do you get health insurance from?</strong>';
                            strVar += '                        <p>';
                            strVar += checkProp(other_details.plaintiff1.healthInsuranceFrom);
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Policy Limit</strong>';
                            strVar += '                        <p>'
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem)) ? (utils.isNotEmptyVal(currentItem.policyLimit) ? $filter('currency')(currentItem.policyLimit, '$', 2) : "-") + '/' + (utils.isNotEmptyVal(currentItem.policyLimitMax) ? $filter('currency')(currentItem.policyLimitMax, '$', 2) : "-") : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Policy Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? (utils.isNotEmptyVal(currentItem.policyNumber) ? (utils.isNotEmptyVal(currentItem.policyNumber) ? currentItem.policyNumber : "-") : "-") : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Claim Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? (utils.isNotEmptyVal(currentItem.claimNumber) ? (utils.isNotEmptyVal(currentItem.claimNumber) ? currentItem.claimNumber : "-") : "-") : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                        })
                    } else {
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insured Party</strong>';
                        strVar += '                        <p>';

                        strVar += "-";

                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insurance Provider</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insurance Type</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Excess Confirmed</strong>';
                        strVar += '                        <p>';
                        strVar += "Don't Know";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                </tr>';
                        strVar += '                <tr>';
                        strVar += '                    <td>';
                        strVar += '                        <strong>Policy Exhausted</strong>';
                        strVar += '                        <p>';
                        strVar += "Don't Know";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td>';
                        strVar += '                        <strong>Where do you get health insurance from?</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Policy Limit</strong>';
                        strVar += '                        <p>'
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Policy Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Claim Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                    }

                }

                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td colspan="5">';
                strVar += '                        <strong>Have you ever been denied health insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.denied);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.denied == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="5">';
                    strVar += '                        <strong>Describe company and reason for denial</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeDenial));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td colspan="5">';
                strVar += '                        <strong>Have you ever been on State Insurance of any type?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.State);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.State == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="5">';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeDetails));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td colspan="2">';
                strVar += '                        <strong>Have you been denied medicare in the past 36 months?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.deniedMedicare);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td colspan="3">';
                strVar += '                        <strong>Will you apply for medicare in the next 36 months?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.medicareNext);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '        </div>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Automobile Insurance</h3>';
                strVar += '            <div class="plaintiff-table">';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="6">';
                strVar += '                        <strong>Does anyone in house presently have auto insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.auto);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.auto == 1) {
                    // intakeOverviewData.Plaintiff_Details && intakeOverviewData.Plaintiff_Details.length > 0 && intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords.length > 0
                    if (intakeOverviewData.Plaintiff_Details && intakeOverviewData.Plaintiff_Details.length > 0 && intakeOverviewData.Plaintiff_Details[0].insuranceInfos != null) {
                        var AutomobileObj = _.map(intakeOverviewData.Plaintiff_Details[0].insuranceInfos, function (item) {
                            if (item.insuranceType == "AutoMobile") {
                                return item;
                            }
                        })
                        AutomobileObj = AutomobileObj.filter(function (element) {
                            return element !== undefined;
                        });
                        AutomobileObj = _.sortBy(AutomobileObj, 'createdDate');
                        _.forEach(AutomobileObj, function (item) {
                            strVar += '                <tr>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Insured Party</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuredParty[0])) ? (utils.removeunwantedHTML(item.insuredParty[0].firstName) + '' + utils.removeunwantedHTML(item.insuredParty[0].lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Insurance Provider</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuranceProvider)) ? (utils.removeunwantedHTML(item.insuranceProvider.firstName) + '' + utils.removeunwantedHTML(item.insuranceProvider.lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insurance Type</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.type)) ? checkProp(item.type) : "";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Adjuster Name</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.adjuster)) ? (utils.removeunwantedHTML(item.adjuster.firstName) + ' ' + utils.removeunwantedHTML(item.adjuster.lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Policy Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.policyNumber) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Claim Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.claimNumber) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Driver Licence Number</strong>';
                            strVar += '                        <p>';
                            strVar += checkProp(item.licenceNumber);
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td colspan="2">';
                            strVar += '                        <strong>Duration for which state licence was held</strong>';
                            strVar += '                        <p>';
                            strVar += utils.removeunwantedHTML(checkProp(item.licenceDuration));
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                </tr>';
                        })
                    } else {
                        strVar += '                <tr>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Insured Party</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Insurance Provider</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insurance Type</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Adjuster Name</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Policy Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Claim Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Driver Licence Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td colspan="2">';
                        strVar += '                        <strong>Duration for which state licence was held</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                </tr>';
                    }
                }

                strVar += '                <tr>';

                strVar += '                    <td colspan="4">';
                strVar += '                        <strong>Do you have any medical payments coverage (A/KA/MED PAY) under your Automobile Insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.paymentsCoverage);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                if (other_details.plaintiff1.paymentsCoverage == 1) {
                    strVar += '                    <td width="28%">';
                    strVar += '                        <strong>Please state how much coverage</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.coverage));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                    <td>';
                strVar += '                        <strong>Year of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += checkProp(other_details.plaintiff1.yearOfVehicalAuto);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Model of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.modelOfVehicalAuto));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Color of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.colorOfVehicalAuto));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>No-fault insurance ever filed?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.nofaultInsurance);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Was incident reported to an insurance company?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.accidentReportedCompany);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.automobileOtherDetails.accidentReportedCompany == 1) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Name of insurance company</strong>';
                    strVar += '                        <p>';
                    if (other_details.plaintiff1.automobileOtherDetails.insuredParty) {
                        strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.insuredParty.name));
                    }
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date it was reported?</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.automobileOtherDetails.dateReported) ? moment(other_details.plaintiff1.automobileOtherDetails.dateReported).format('MM/DD/YYYY') : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Claim Number</strong>';
                    strVar += '                        <p>';
                    strVar += checkProp(other_details.plaintiff1.automobileOtherDetails.claimNumber);
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="5">';
                    strVar += '                        <strong>Vehicle Insurance information for client</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.vehicleInfo));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Was no-fault claim filed?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.noFaultClaim);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.automobileOtherDetails.noFaultClaim == 1) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date on which fault claim was filed</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.automobileOtherDetails.dateOfNoFaultClaim) ? moment(other_details.plaintiff1.automobileOtherDetails.dateOfNoFaultClaim).format('MM/DD/YYYY') : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                    <td>';
                strVar += '                        <strong>Does client have copy?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.clientCopy);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Hit and run?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.hitAndRun);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';

                strVar += '                <tr>';
                if (other_details.plaintiff1.automobileOtherDetails.hitAndRun == 1) {
                    strVar += '                    <td colspan="2">';
                    strVar += '                        <strong>If this was a hit and run incident, was Notice of Intention filed with MVIAC?</strong>';
                    strVar += '                        <p>';
                    strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.hitAndRunNotice);
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                if (other_details.plaintiff1.automobileOtherDetails.hitAndRunNotice == 1) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date on which hit and run incident was filed</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.automobileOtherDetails.dateOfHitAndRun) ? moment(other_details.plaintiff1.automobileOtherDetails.dateOfHitAndRun).format('MM/DD/YYYY') : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                    <td>';
                strVar += '                        <strong>Notice of intention ever filed?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.deathCertificate);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Does client have copy?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.client_Copy);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Does anyone living with client own a vehicle?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.clientVehicle);
                strVar += '                        </p>';
                strVar += '                    </td>';

                if (other_details.plaintiff1.automobileOtherDetails.clientVehicle == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="1">';
                    strVar += '                        <strong>Make and Model</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.makeAndModel));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Owner of Vehicle</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.ownerOfVehicle));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td colspan="5">';
                strVar += '                        <strong>Insurance coverage information</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.insuranceCoverageInfo));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            </div>';
                strVar += '        </div>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Other driver insurance coverage information</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                var OtherDriverObj = _.map(intakeOverviewData.Plaintiff_Details[0].insuranceInfos, function (item) {
                    if (item.insuranceType == "OtherDriver") {
                        return item;
                    }
                })
                OtherDriverObj = OtherDriverObj.filter(function (element) {
                    return element !== undefined;
                });
                if (OtherDriverObj.length == 0) {
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insured Party</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insurance Provider</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="17%">';
                    strVar += '                        <strong>Insurance Type</strong>';
                    strVar += '                        <p>';
                    strVar += "";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Adjuster Name</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                _.forEach(OtherDriverObj, function (item) {
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insured Party</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuredParty[0])) ? (utils.removeunwantedHTML(item.insuredParty[0].firstName) + ' ' + utils.removeunwantedHTML(item.insuredParty[0].lastName)) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insurance Provider</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuranceProvider)) ? (utils.removeunwantedHTML(item.insuranceProvider.firstName) + ' ' + utils.removeunwantedHTML(item.insuranceProvider.lastName)) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="17%">';
                    strVar += '                        <strong>Insurance Type</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.type)) ? checkProp(item.type) : "";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Adjuster Name</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.adjuster)) ? (utils.removeunwantedHTML(item.adjuster.firstName) + ' ' + utils.removeunwantedHTML(item.adjuster.lastName)) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                })

                strVar += '                    <td width="25%">';
                strVar += '                        <strong>Year of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += checkProp(other_details.plaintiff1.yearOfVehicalOther);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Model of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.modelOfVehicalOther));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Color of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.colorOfVehicalOther));
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (OtherDriverObj.length == 0) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Policy Number</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Claim Number</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                _.forEach(OtherDriverObj, function (item) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Policy Number</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.policyNumber) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Claim Number</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.claimNumber) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                })

                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '        </div>';

                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Other Details</h2>';
                strVar += '        <div class="sub-main">';

                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Claims</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="3">';
                strVar += '                        <b style="margin-top: 10px;display: block;font-size: 11.5pt;">Prior Injury Claims and Law Suits</b>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td width="30%">';
                strVar += '                        <strong>Have you ever filled a claim and/or lawsuit for personal injuries?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.claimLawsuit);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.claimLawsuit == 1) {
                    strVar += '                    <td width="15%">';
                    strVar += '                        <strong>Date of Claim</strong>';
                    strVar += '                        <p>'
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.dateClaimLawsit) ? moment(other_details.plaintiff1.dateClaimLawsit).format("MM/DD/YYYY") : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="30%">';
                    strVar += '                        <strong>Nature of Claim</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.natureOfClaim));
                    strVar += '                        </p>';
                    strVar += '                    </td>';

                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="3">';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.detailsClaimLawsit));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Disability Claims</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="2">';
                strVar += '                        <strong>Have you ever filled for any type of disability claims such as SSD, short term disability, long term disability etc.?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.SSD);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.SSD == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td width="15%">';
                    strVar += '                        <strong>Date when determined disabled</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.dateDeterminedDisabled) ? moment(other_details.plaintiff1.dateDeterminedDisabled).format("MM/DD/YYYY") : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="30%">';
                    strVar += '                        <strong>Nature of Disability</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.natureOfDisability));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="2">';
                    strVar += '                        <strong>Describe what body parts were disabled</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeNature));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Worker Compensation Claims</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever filled a worker compensation claim?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.claim);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.claim == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe how and when injured</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeClaim));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>List health care providers for workers compensation injuries</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.listHealthCare));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Miscellaneous</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <b style="margin-top: 5px;display: block;font-size: 11.5pt;">Lawsuits, Judgments, State Assistance and Child Support</b>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever been involved in a lawsuit?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.lawsuit);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.lawsuit == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeLawsuit));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you have any judgments pending against you now?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.judgments);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.judgments == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeJudgmentsPending));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you received state aid of any type?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.aidType);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.aidType == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.stateAid));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you have a court ordered child support obligation?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.obligation);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.obligation == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.childSupport));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Criminal or Motor Vehicle Convictions</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="3">';
                strVar += '                        <strong>Do you have any prior criminal or motor vehicle convictions?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.convictions);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                if (other_details.plaintiff1.convictions == 1) {
                    strVar += '                    <td colspan="3">';
                    strVar += '                        <strong>Describe type of any and all charges and outcome</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeConvictions));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td width="10%">';
                    strVar += '                        <strong>Date</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.dateCriminal) ? moment(other_details.plaintiff1.dateCriminal).format("MM/DD/YYYY") : "-";
                    strVar += '                        <p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Place</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.placeCriminal));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever been incarcerated?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.incarcerate);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.incarcerate == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="3">';
                    strVar += '                        <strong>Provide details (including dates)</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.detailsCriminal));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Details on Military Service</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="4">';
                strVar += '                        <strong>Have you ever been in the military service?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.service);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.service == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Service Branch</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.serviceBranch));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Service Number</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.serviceNumber));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date of Service</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.datesOfService) ? moment(other_details.plaintiff1.datesOfService).format("MM/DD/YYYY") : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Type of Discharge</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.typeOfDischarge));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="4">';
                    strVar += '                        <strong>Awards Received</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.awardsReceived));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="4">';
                    strVar += '                        <strong>Information on any service connected injuries or disability</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.information));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Percentage of Disability</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.percentage));
                    strVar += '                        </p>';
                    strVar += '                    </td>';

                    strVar += '                    <td colspan="2">';
                    strVar += '                        <strong>Body parts receiving disability</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.injuredparts));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="2" width="35%">';
                    strVar += '                        <strong>Do you receive payments for service connected injuries?</strong>';
                    strVar += '                        <p>';
                    strVar += yesNoFn(other_details.plaintiff1.injuries);
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                if (other_details.plaintiff1.injuries == 1) {
                    strVar += '                    <td colspan="4">';
                    strVar += '                        <strong>Describe details of payments received for service conected injuries</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.describeMilitary) ? utils.removeunwantedHTML(other_details.plaintiff1.describeMilitary) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Eyes and/or Ears</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you now or have you ever had eye glasses and/or hearing aid?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.aid);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.aid == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeAid));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Alcohol and Drug Addiction and/or Treatment</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever been treated for alcohol and/or drug use?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.alcoholorDrug);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.alcoholorDrug == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeAlcohol));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Bankruptcy</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Are you currently under any orders from the bankruptcy court?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.court);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.court == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeBankruptcyCourt));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Are you contemplating filling for bankruptcy in the next 6 months?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.contemplat);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.contemplat == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.contemplatingFilling));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Incident Double Check</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Other than this incident, have you ever been in a car incident (regardless of wheather a driver or a passanger) even if you did not make a claim?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.claimDoubleCheck);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.claimDoubleCheck == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeCarAccident));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Other than this incident, have you ever been injured in a fall (regardless of how occured) even if you did not make a claim?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.noClaim);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.noClaim == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeInjured));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Other than this incident, have you ever had an MRI or CT Scan or similar Diagnostic tests done before this incident?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.MRIorCTScan);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.MRIorCTScan == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeMRIOrCT));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '        </div>';
                strVar += '    </div>';

                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Memo</h2>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Memo</h3>';
                strVar += '            <div class="plaintiff-table">';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.OtherMemo) ? utils.removeunwantedHTML(checkProp(other_details.plaintiff1.OtherMemo.memo)) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            </div>';
                strVar += '            </div>';
            } else if (intakeTypeName == "Personal Injury" && intakeSubTypeName == "Premises") {
                //console.log("Premises");
                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Incident Details</h2>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Incident Details</h3>';
                strVar += '            <div class="plaintiff-table">';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Date of Incident</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.IncDetailsForPremises.incidentDate) ? ($filter('utcDateFilter')(other_details.plaintiff1.IncDetailsForPremises.incidentDate, "MM/DD/YYYY", 1, "start")) : (utils.isNotEmptyVal(mvaIncidentCopy) ? $filter('utcDateFilter')(mvaIncidentCopy, "MM/DD/YYYY", 1, "start") : "-");
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Day of Incident</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.IncDetailsForPremises.incidentDateCopy) ? ($filter('utcDateFilter')(other_details.plaintiff1.IncDetailsForPremises.incidentDateCopy, "dddd", 1, "start")) : (utils.isNotEmptyVal(mvaIncidentCopy) ? $filter('utcDateFilter')(mvaIncidentCopy, "dddd", 1, "start") : "-");
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="12%">';
                strVar += '                        <strong>Time of Incident</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.IncDetailsForPremises.timeAccident) ? moment(other_details.plaintiff1.IncDetailsForPremises.timeAccident).format("HH:mm") : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="30%">';
                strVar += '                        <strong>Type of Incident</strong>';
                strVar += '                        <p>';
                strVar += typeOfIncidentFn(other_details.plaintiff1.IncDetailsForPremises.accidentType);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="30%">';
                strVar += '                        <strong>Weather conditions on the date of incident</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.IncDetailsForPremises.weatherCond));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <b style="padding: 5px;margin-top: 10px;display: block;font-size: 11.5pt;">Location of Incident</b>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td width="9.5%">';
                strVar += '                        <strong>Street</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.IncDetailsForPremises.mvaStreet));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="9.5%">';
                strVar += '                        <strong>City/Town</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.IncDetailsForPremises.mvaCity));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="9.5%">';
                strVar += '                        <strong>State</strong>';
                strVar += '                        <p>';
                strVar += checkProp(other_details.plaintiff1.IncDetailsForPremises.state);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="9.5%">';
                strVar += '                        <strong>ZIP Code</strong>';
                strVar += '                        <p>';
                strVar += checkProp(other_details.plaintiff1.IncDetailsForPremises.mvaZipCode);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td width="10%">';
                strVar += '                        <strong>Country</strong>';
                strVar += '                        <p>';
                strVar += checkProp(other_details.plaintiff1.IncDetailsForPremises.country);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                    <tr>';
                strVar += '                    <td width="28%">';
                strVar += '                        <strong>Did incident occur in the street/sidewalk?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.IncDetailsForPremises.accidentOccur);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.IncDetailsForPremises.accidentOccur == 1) {
                    strVar += '                    <td width="28%">';
                    strVar += '                        <strong>Intersection?</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.IncDetailsForPremises.intersection));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                    <td width="28%">';
                strVar += '                        <strong>Did incident occur in a park or roadway?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.IncDetailsForPremises.accidentOccur2);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.IncDetailsForPremises.accidentOccur2 == 1) {
                    strVar += '                    <td width="28%">';
                    strVar += '                        <strong>Name of park/roadway including intersection</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.IncDetailsForPremises.nameOfIntersection));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    </tr>';
                    strVar += '                    <tr>';
                    strVar += '                    <td width="28%">';
                    strVar += '                        <strong>Exact location of incident</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.IncDetailsForPremises.exactLocation));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                    </tr>';
                strVar += '                    <tr>';
                strVar += '                    <td width="28%">';
                strVar += '                        <strong>Did incident occur in building?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.IncDetailsForPremises.accidentOccurBlg);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.IncDetailsForPremises.accidentOccurBlg == 1) {
                    strVar += '                    <td width="28%">';
                    strVar += '                        <strong>What type of building?</strong>';
                    strVar += '                        <p>';
                    strVar += typeOfBuildingFn(other_details.plaintiff1.IncDetailsForPremises.typeOfBlg);
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                if (other_details.plaintiff1.IncDetailsForPremises.typeOfBlg == 1) {
                    strVar += '                    <td width="28%">';
                    strVar += '                        <strong>Building owner information</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.IncDetailsForPremises.blgOwnerInfo));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    </tr>';
                    strVar += '                    <tr>';
                    strVar += '                    <td width="28%">';
                    strVar += '                        <strong>Building management information</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.IncDetailsForPremises.blgManagementInfo));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="28%">';
                    strVar += '                        <strong>Superintendent information</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.IncDetailsForPremises.superintendent));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                    <td width="28%">';
                strVar += '                        <strong>Did incident involve steps?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.IncDetailsForPremises.accInvolveSteps);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.IncDetailsForPremises.accInvolveSteps == 1) {
                    strVar += '                    <td width="28%">';
                    strVar += '                        <strong>Stairway information</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.IncDetailsForPremises.stairwayInfo));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                    </tr>';
                strVar += '                    <tr>';
                strVar += '                    <td width="28%">';
                strVar += '                        <strong>Did incident involve elevator?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.IncDetailsForPremises.accInvolveElevator);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.IncDetailsForPremises.accInvolveElevator == 1) {
                    strVar += '                    <td width="28%">';
                    strVar += '                        <strong>Elevator company information</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.IncDetailsForPremises.elevatorInfo));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="28%">';
                    strVar += '                        <strong>Date of last inspection</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.IncDetailsForPremises.lastDateInception) ? moment(other_details.plaintiff1.IncDetailsForPremises.lastDateInception).format("MM/DD/YYYY") : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="28%">';
                    strVar += '                        <strong>Did you report the incident to anyone? Give details</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.IncDetailsForPremises.reportDetails));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                    </tr>';
                strVar += '                    <tr>';
                strVar += '                    <td width="28%">';
                strVar += '                        <strong>Were photos taken?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.IncDetailsForPremises.picTaken);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="28%">';
                strVar += '                        <strong>Description of incident</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.IncDetailsForPremises.descAccident));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    </tr>';
                strVar += '            </table>';
                strVar += '            </div>';

                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Injuries & Treatment</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Injuries claimed?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.mvaTreatment.optionInjuries);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.mvaTreatment.optionInjuries == 1) {
                    strVar += '                    <td colspan="10">';
                    strVar += '                        <strong>Injury information</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.mvaTreatment.information));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Hospital</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.mvaTreatment.hospPhysicianId) ? utils.removeunwantedHTML(other_details.plaintiff1.mvaTreatment.hospPhysicianId.name) : '-';
                strVar += '                        </p>';
                strVar += '                        <strong>Hospital information</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.mvaTreatment) ? utils.removeunwantedHTML(checkProp(other_details.plaintiff1.mvaTreatment.hospInformation)) : '-';
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Were you taken by ambulance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.mvaTreatment.optionAmbulance);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Treated by EMS?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.mvaTreatment.emsinfo);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.mvaTreatment.emsinfo == 1) {

                    if (intakeOverviewData.Plaintiff_Details && intakeOverviewData.Plaintiff_Details.length > 0 && intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords.length > 0) {

                        for (var i = 0; i < intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders.length; i++) {
                            strVar += '                <tr>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>Service Provider</strong>';
                            strVar += '                        <p>';
                            if (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords) && intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders.length > 0) {

                                if (intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].medicalProviders != null || utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].medicalProviders)) {
                                    var serviceProviderName = utils.removeunwantedHTML(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].medicalProviders.firstName) + " " + utils.removeunwantedHTML(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].medicalProviders.lastName);
                                } else {
                                    serviceProviderName = "-";
                                }
                                strVar += serviceProviderName;
                            } else {
                                strVar += "-";
                            }

                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>Physician Name</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords) && utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].physician)) ? (utils.removeunwantedHTML(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].physician.firstName) + " " + utils.removeunwantedHTML(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].physician.lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>Start Date of Service</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords) ? ($filter('utcDateFilter')(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].serviceStartDate, "MM/DD/YYYY")) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>End Date of Service</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords) ? ($filter('utcDateFilter')(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].serviceEndDate, "MM/DD/YYYY")) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>Treatment Type</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords) ? utils.removeunwantedHTML(intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords[0].intakeMedicalProviders[i].treatmentType) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                </tr>';
                        }
                    }
                }
                strVar += '                ';
                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Witness Details</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td width="30%">';
                strVar += '                        <strong>Were there any witnesses to your accident?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.witnessOtherDetails.witness);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.witnessOtherDetails.witness == 1) {
                    var witnessName = _.map(intakeOverviewData.Plaintiff_Details[0].intakeWitnesses, function (item) {
                        var fname, lname;
                        utils.isNotEmptyVal(item.contact.firstName) ? fname = utils.removeunwantedHTML(item.contact.firstName) : fname = "";
                        utils.isNotEmptyVal(item.contact.lastName) ? lname = utils.removeunwantedHTML(item.contact.lastName) : lname = "";
                        return fname + " " + lname;
                    });
                    strVar += '                    <td>';
                    strVar += '                        <strong>Name of Witness</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].intakeWitnesses) ? utils.removeunwantedHTML(witnessName) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '        </div>';

                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Insurance Details</h2>';
                // %%%%%%%%%%%
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Health Insurance</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td width="">';
                strVar += '                        <strong>Have you ever had Medicaid/Medicare?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.medicare);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="">';
                strVar += '                        <strong>Do you presently have health insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.insuranceDetails);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.insuranceDetails == 1) {

                    var healthobj = _.map(intakeOverviewData.Plaintiff_Details[0].insuranceInfos, function (item) {
                        if (item.insuranceType == "Health") {
                            return item;
                        }
                    })
                    healthobj = healthobj.filter(function (element) {
                        return element !== undefined;
                    });
                    if (intakeOverviewData.Plaintiff_Details && intakeOverviewData.Plaintiff_Details.length > 0 && intakeOverviewData.Plaintiff_Details[0].insuranceInfos != null && healthobj.length != 0) {
                        _.forEach(healthobj, function (currentItem) {
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insured Party</strong>';
                            strVar += '                        <p>';
                            if (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.insuredParty)) {
                                var insuredPartyName = _.map(currentItem.insuredParty, function (item) {
                                    var fname, lname;
                                    utils.isNotEmptyVal(item.firstName) ? fname = utils.removeunwantedHTML(item.firstName) : fname = "";
                                    utils.isNotEmptyVal(item.lastName) ? lname = utils.removeunwantedHTML(item.lastName) : lname = "";
                                    return fname + " " + lname;
                                });
                                strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.insuredParty)) ? insuredPartyName : "-";

                            } else {
                                strVar += "-";
                            }
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insurance Provider</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.insuranceProvider)) ? (utils.removeunwantedHTML(currentItem.insuranceProvider.firstName) + '' + utils.removeunwantedHTML(currentItem.insuranceProvider.lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insurance Type</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.type)) ? checkProp(currentItem.type) : "";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Excess Confirmed</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.excessConfirmed)) ? checkProp(currentItem.excessConfirmed) : "Don't Know";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                </tr>';
                            strVar += '                <tr>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>Policy Exhausted</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.policyExhausted)) ? checkProp(currentItem.policyExhausted) : "Don't Know";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>Where do you get health insurance from?</strong>';
                            strVar += '                        <p>';
                            strVar += checkProp(other_details.plaintiff1.healthInsuranceFrom);
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Policy Limit</strong>';
                            strVar += '                        <p>'
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem)) ? (utils.isNotEmptyVal(currentItem.policyLimit) ? $filter('currency')(currentItem.policyLimit, '$', 2) : "-") + '/' + (utils.isNotEmptyVal(currentItem.policyLimitMax) ? $filter('currency')(currentItem.policyLimitMax, '$', 2) : "-") : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Policy Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? (utils.isNotEmptyVal(currentItem.policyNumber) ? (utils.isNotEmptyVal(currentItem.policyNumber) ? currentItem.policyNumber : "-") : "-") : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Claim Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? (utils.isNotEmptyVal(currentItem.claimNumber) ? (utils.isNotEmptyVal(currentItem.claimNumber) ? currentItem.claimNumber : "-") : "-") : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                        })
                    } else {
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insured Party</strong>';
                        strVar += '                        <p>';

                        strVar += "-";

                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insurance Provider</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insurance Type</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Excess Confirmed</strong>';
                        strVar += '                        <p>';
                        strVar += "Don't Know";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                </tr>';
                        strVar += '                <tr>';
                        strVar += '                    <td>';
                        strVar += '                        <strong>Policy Exhausted</strong>';
                        strVar += '                        <p>';
                        strVar += "Don't Know";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td>';
                        strVar += '                        <strong>Where do you get health insurance from?</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Policy Limit</strong>';
                        strVar += '                        <p>'
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Policy Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Claim Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                    }

                }

                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td colspan="5">';
                strVar += '                        <strong>Have you ever been denied health insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.denied);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.denied == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="5">';
                    strVar += '                        <strong>Describe company and reason for denial</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeDenial));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td colspan="5">';
                strVar += '                        <strong>Have you ever been on State Insurance of any type?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.State);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.State == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="5">';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeDetails));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td colspan="2">';
                strVar += '                        <strong>Have you been denied medicare in the past 36 months?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.deniedMedicare);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td colspan="3">';
                strVar += '                        <strong>Will you apply for medicare in the next 36 months?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.medicareNext);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '        </div>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Automobile Insurance</h3>';
                strVar += '            <div class="plaintiff-table">';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="6">';
                strVar += '                        <strong>Does anyone in house presently have auto insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.auto);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.auto == 1) {
                    // intakeOverviewData.Plaintiff_Details && intakeOverviewData.Plaintiff_Details.length > 0 && intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords.length > 0
                    if (intakeOverviewData.Plaintiff_Details && intakeOverviewData.Plaintiff_Details.length > 0 && intakeOverviewData.Plaintiff_Details[0].insuranceInfos != null) {
                        var AutomobileObj = _.map(intakeOverviewData.Plaintiff_Details[0].insuranceInfos, function (item) {
                            if (item.insuranceType == "AutoMobile") {
                                return item;
                            }
                        })
                        AutomobileObj = AutomobileObj.filter(function (element) {
                            return element !== undefined;
                        });
                        AutomobileObj = _.sortBy(AutomobileObj, 'createdDate');
                        _.forEach(AutomobileObj, function (item) {
                            strVar += '                <tr>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Insured Party</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuredParty[0])) ? (utils.removeunwantedHTML(item.insuredParty[0].firstName) + '' + utils.removeunwantedHTML(item.insuredParty[0].lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Insurance Provider</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuranceProvider)) ? (utils.removeunwantedHTML(item.insuranceProvider.firstName) + '' + utils.removeunwantedHTML(item.insuranceProvider.lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insurance Type</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.type)) ? checkProp(item.type) : "";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Adjuster Name</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.adjuster)) ? (utils.removeunwantedHTML(item.adjuster.firstName) + ' ' + utils.removeunwantedHTML(item.adjuster.lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Policy Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.policyNumber) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Claim Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.claimNumber) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Driver Licence Number</strong>';
                            strVar += '                        <p>';
                            strVar += checkProp(item.licenceNumber);
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td colspan="2">';
                            strVar += '                        <strong>Duration for which state licence was held</strong>';
                            strVar += '                        <p>';
                            strVar += utils.removeunwantedHTML(checkProp(item.licenceDuration));
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                </tr>';
                        })
                    } else {
                        strVar += '                <tr>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Insured Party</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Insurance Provider</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insurance Type</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Adjuster Name</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Policy Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Claim Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Driver Licence Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td colspan="2">';
                        strVar += '                        <strong>Duration for which state licence was held</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                </tr>';
                    }
                }

                strVar += '                <tr>';

                strVar += '                    <td colspan="4">';
                strVar += '                        <strong>Do you have any medical payments coverage (A/KA/MED PAY) under your Automobile Insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.paymentsCoverage);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                if (other_details.plaintiff1.paymentsCoverage == 1) {
                    strVar += '                    <td width="28%">';
                    strVar += '                        <strong>Please state how much coverage</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.coverage));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                    <td>';
                strVar += '                        <strong>Year of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += checkProp(other_details.plaintiff1.yearOfVehicalAuto);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Model of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.modelOfVehicalAuto));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Color of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.colorOfVehicalAuto));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>No-fault insurance ever filed?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.nofaultInsurance);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Was incident reported to an insurance company?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.accidentReportedCompany);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.automobileOtherDetails.accidentReportedCompany == 1) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Name of insurance company</strong>';
                    strVar += '                        <p>';
                    if (other_details.plaintiff1.automobileOtherDetails.insuredParty) {
                        strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.insuredParty.name));
                    }
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date it was reported?</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.automobileOtherDetails.dateReported) ? moment(other_details.plaintiff1.automobileOtherDetails.dateReported).format('MM/DD/YYYY') : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Claim Number</strong>';
                    strVar += '                        <p>';
                    strVar += checkProp(other_details.plaintiff1.automobileOtherDetails.claimNumber);
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="5">';
                    strVar += '                        <strong>Vehicle Insurance information for client</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.vehicleInfo));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Was no-fault claim filed?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.noFaultClaim);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.automobileOtherDetails.noFaultClaim == 1) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date on which fault claim was filed</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.automobileOtherDetails.dateOfNoFaultClaim) ? moment(other_details.plaintiff1.automobileOtherDetails.dateOfNoFaultClaim).format('MM/DD/YYYY') : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                    <td>';
                strVar += '                        <strong>Does client have copy?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.clientCopy);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Hit and run?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.hitAndRun);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';

                strVar += '                <tr>';
                if (other_details.plaintiff1.automobileOtherDetails.hitAndRun == 1) {
                    strVar += '                    <td colspan="2">';
                    strVar += '                        <strong>If this was a hit and run incident, was Notice of Intention filed with MVIAC?</strong>';
                    strVar += '                        <p>';
                    strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.hitAndRunNotice);
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                if (other_details.plaintiff1.automobileOtherDetails.hitAndRunNotice == 1) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date on which hit and run incident was filed</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.automobileOtherDetails.dateOfHitAndRun) ? moment(other_details.plaintiff1.automobileOtherDetails.dateOfHitAndRun).format('MM/DD/YYYY') : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                    <td>';
                strVar += '                        <strong>Notice of intention ever filed?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.deathCertificate);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Does client have copy?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.client_Copy);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Does anyone living with client own a vehicle?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.clientVehicle);
                strVar += '                        </p>';
                strVar += '                    </td>';

                if (other_details.plaintiff1.automobileOtherDetails.clientVehicle == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="1">';
                    strVar += '                        <strong>Make and Model</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.makeAndModel));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Owner of Vehicle</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.ownerOfVehicle));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td colspan="5">';
                strVar += '                        <strong>Insurance coverage information</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.insuranceCoverageInfo));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            </div>';
                strVar += '        </div>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Other driver insurance coverage information</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                var OtherDriverObj = _.map(intakeOverviewData.Plaintiff_Details[0].insuranceInfos, function (item) {
                    if (item.insuranceType == "OtherDriver") {
                        return item;
                    }
                })
                OtherDriverObj = OtherDriverObj.filter(function (element) {
                    return element !== undefined;
                });
                if (OtherDriverObj.length == 0) {
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insured Party</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insurance Provider</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="17%">';
                    strVar += '                        <strong>Insurance Type</strong>';
                    strVar += '                        <p>';
                    strVar += "";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Adjuster Name</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                _.forEach(OtherDriverObj, function (item) {
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insured Party</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuredParty[0])) ? (utils.removeunwantedHTML(item.insuredParty[0].firstName) + ' ' + utils.removeunwantedHTML(item.insuredParty[0].lastName)) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insurance Provider</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuranceProvider)) ? (utils.removeunwantedHTML(item.insuranceProvider.firstName) + ' ' + utils.removeunwantedHTML(item.insuranceProvider.lastName)) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="17%">';
                    strVar += '                        <strong>Insurance Type</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.type)) ? checkProp(item.type) : "";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Adjuster Name</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.adjuster)) ? (utils.removeunwantedHTML(item.adjuster.firstName) + ' ' + utils.removeunwantedHTML(item.adjuster.lastName)) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                })

                strVar += '                    <td width="25%">';
                strVar += '                        <strong>Year of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += checkProp(other_details.plaintiff1.yearOfVehicalOther);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Model of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.modelOfVehicalOther));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Color of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.colorOfVehicalOther));
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (OtherDriverObj.length == 0) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Policy Number</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Claim Number</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                _.forEach(OtherDriverObj, function (item) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Policy Number</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.policyNumber) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Claim Number</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.claimNumber) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                })

                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '        </div>';


                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Other Details</h2>';
                strVar += '        <div class="sub-main">';

                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Claims</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="3">';
                strVar += '                        <b style="margin-top: 10px;display: block;font-size: 11.5pt;">Prior Injury Claims and Law Suits</b>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td width="30%">';
                strVar += '                        <strong>Have you ever filled a claim and/or lawsuit for personal injuries?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.claimLawsuit);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.claimLawsuit == 1) {
                    strVar += '                    <td width="15%">';
                    strVar += '                        <strong>Date of Claim</strong>';
                    strVar += '                        <p>'
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.dateClaimLawsit) ? moment(other_details.plaintiff1.dateClaimLawsit).format("MM/DD/YYYY") : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="30%">';
                    strVar += '                        <strong>Nature of Claim</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.natureOfClaim));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="3">';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.detailsClaimLawsit));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Disability Claims</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="2">';
                strVar += '                        <strong>Have you ever filled for any type of disability claims such as SSD, short term disability, long term disability etc.?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.SSD);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.SSD == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td width="15%">';
                    strVar += '                        <strong>Date when determined disabled</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.dateDeterminedDisabled) ? moment(other_details.plaintiff1.dateDeterminedDisabled).format("MM/DD/YYYY") : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="30%">';
                    strVar += '                        <strong>Nature of Disability</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.natureOfDisability));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="2">';
                    strVar += '                        <strong>Describe what body parts were disabled</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeNature));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Worker Compensation Claims</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever filled a worker compensation claim?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.claim);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.claim == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe how and when injured</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeClaim));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>List health care providers for workers compensation injuries</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.listHealthCare));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Miscellaneous</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <b style="margin-top: 5px;display: block;font-size: 11.5pt;">Lawsuits, Judgments, State Assistance and Child Support</b>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever been involved in a lawsuit?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.lawsuit);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.lawsuit == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeLawsuit));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you have any judgments pending against you now?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.judgments);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.judgments == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeJudgmentsPending));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you received state aid of any type?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.aidType);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.aidType == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.stateAid));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you have a court ordered child support obligation?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.obligation);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.obligation == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.childSupport));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Criminal or Motor Vehicle Convictions</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="3">';
                strVar += '                        <strong>Do you have any prior criminal or motor vehicle convictions?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.convictions);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.convictions == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="3">';
                    strVar += '                        <strong>Describe type of any and all charges and outcome</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeConvictions));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td width="10%">';
                    strVar += '                        <strong>Date</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.dateCriminal) ? moment(other_details.plaintiff1.dateCriminal).format("MM/DD/YYYY") : "-";
                    strVar += '                        <p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Place</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.placeCriminal));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever been incarcerated?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.incarcerate);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.incarcerate == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="3">';
                    strVar += '                        <strong>Provide details (including dates)</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.detailsCriminal));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }


                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Details on Military Service</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="4">';
                strVar += '                        <strong>Have you ever been in the military service?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.service);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.service == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Service Branch</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.serviceBranch));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Service Number</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.serviceNumber));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date of Service</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.datesOfService) ? moment(other_details.plaintiff1.datesOfService).format("MM/DD/YYYY") : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Type of Discharge</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.typeOfDischarge));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="4">';
                    strVar += '                        <strong>Awards Received</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.awardsReceived));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="4">';
                    strVar += '                        <strong>Information on any service connected injuries or disability</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.information));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Percentage of Disability</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.percentage));
                    strVar += '                        </p>';
                    strVar += '                    </td>';

                    strVar += '                    <td colspan="2">';
                    strVar += '                        <strong>Body parts receiving disability</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.injuredparts));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="2" width="35%">';
                    strVar += '                        <strong>Do you receive payments for service connected injuries?</strong>';
                    strVar += '                        <p>';
                    strVar += yesNoFn(other_details.plaintiff1.injuries);
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';

                }

                strVar += '                <tr>';
                if (other_details.plaintiff1.injuries == 1) {
                    strVar += '                    <td colspan="4">';
                    strVar += '                        <strong>Describe details of payments received for service conected injuries</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.describeMilitary) ? utils.removeunwantedHTML(other_details.plaintiff1.describeMilitary) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                </tr>';

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Eyes and/or Ears</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table" class="plaintiff-table">';

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you now or have you ever had eye glasses and/or hearing aid?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.aid);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.aid == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeAid));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Alcohol and Drug Addiction and/or Treatment</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever been treated for alcohol and/or drug use?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.alcoholorDrug);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.alcoholorDrug == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeAlcohol));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Bankruptcy</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Are you currently under any orders from the bankruptcy court?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.court);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.court == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeBankruptcyCourt));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Are you contemplating filling for bankruptcy in the next 6 months?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.contemplat);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.contemplat == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.contemplatingFilling));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Incident Double Check</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Other than this incident, have you ever been in a car incident (regardless of wheather a driver or a passanger) even if you did not make a claim?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.claimDoubleCheck);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.claimDoubleCheck == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeCarAccident));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Other than this incident, have you ever been injured in a fall (regardless of how occured) even if you did not make a claim?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.noClaim);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.noClaim == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeInjured));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Other than this incident, have you ever had an MRI or CT Scan or similar Diagnostic tests done before this incident?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.MRIorCTScan);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.MRIorCTScan == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeMRIOrCT));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '        </div>';
                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Memo</h2>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Memo</h3>';
                strVar += '            <div class="plaintiff-table">';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.OtherMemo) ? utils.removeunwantedHTML(checkProp(other_details.plaintiff1.OtherMemo.memo)) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            </div>';
                strVar += '            </div>';

            } else if (intakeTypeName == "Medical Malpractice") {
                //console.log("Medical Malpractice");
                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Medical Malpractice Details</h2>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Medical Malpractice Details</h3>';
                strVar += '            <div class="plaintiff-table">';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Type of Malpractice</strong>';
                strVar += '                        <p>';
                strVar += (utils.isNotEmptyVal(other_details.plaintiff1.MedMalDetails) && !utils.isEmptyObj(other_details.plaintiff1.MedMalDetails) && (other_details.plaintiff1.MedMalDetails.typeOfMalpractice)) ? utils.removeunwantedHTML(other_details.plaintiff1.MedMalDetails.typeOfMalpractice) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Date of Malpractice</strong>';
                strVar += '                        <p>';
                strVar += (utils.isNotEmptyVal(other_details.plaintiff1.MedMalDetails) && !utils.isEmptyObj(other_details.plaintiff1.MedMalDetails) && (other_details.plaintiff1.MedMalDetails.dateMalpractice)) ? moment(other_details.plaintiff1.MedMalDetails.dateMalpractice).format('MM/DD/YYYY') : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Describe what happened </strong>';
                strVar += '                        <p>';
                strVar += (utils.isNotEmptyVal(other_details.plaintiff1.MedMalDetails) && !utils.isEmptyObj(other_details.plaintiff1.MedMalDetails)) ? utils.removeunwantedHTML(checkProp(other_details.plaintiff1.MedMalDetails.description)) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';

                strVar += '             </table>';
                strVar += '             </div>';
                strVar += '        </div>';

                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Injuries & Treatment</h3>';
                strVar += '            <div class="plaintiff-table">';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Injuries sustained?</strong>';
                strVar += '                        <p>';
                strVar += (utils.isNotEmptyVal(other_details.plaintiff1.MedMal) && utils.isNotEmptyVal(other_details.plaintiff1.MedMal.injuriesSustained)) ? utils.removeunwantedHTML(other_details.plaintiff1.MedMal.injuriesSustained) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>List radiology and medical offices that may be responsible</strong>';
                strVar += '                        <p>';
                strVar += (utils.isNotEmptyVal(other_details.plaintiff1.MedMal) && utils.isNotEmptyVal(other_details.plaintiff1.MedMal.responsible)) ? utils.removeunwantedHTML(other_details.plaintiff1.MedMal.responsible) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Insurance Provider</strong>';
                strVar += '                        <p>';
                strVar += (utils.isNotEmptyVal(other_details.plaintiff1.MedMal) && !utils.isEmptyObj(other_details.plaintiff1.MedMal) && ((utils.isNotEmptyVal(other_details.plaintiff1.MedMal.insuranceProviderId)) && (utils.isNotEmptyVal(other_details.plaintiff1.MedMal.insuranceProviderId.name)))) ? utils.removeunwantedHTML(other_details.plaintiff1.MedMal.insuranceProviderId.name) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';

                strVar += '             </table>';
                strVar += '             </div>';
                strVar += '        </div>';

                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Miscellaneous</h3>';
                strVar += '            <div class="plaintiff-table">';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>As a result of your injuries what activities are you no longer able to do?</strong>';
                strVar += '                        <p>';
                strVar += (utils.isNotEmptyVal(other_details.plaintiff1.MiscellaneousMedMal) && utils.isNotEmptyVal(other_details.plaintiff1.MiscellaneousMedMal.notAbleTo)) ? utils.removeunwantedHTML(other_details.plaintiff1.MiscellaneousMedMal.notAbleTo) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>List all medications currently being taken</strong>';
                strVar += '                        <p>';
                strVar += (utils.isNotEmptyVal(other_details.plaintiff1.MiscellaneousMedMal) && utils.isNotEmptyVal(other_details.plaintiff1.MiscellaneousMedMal.medsTaken)) ? utils.removeunwantedHTML(other_details.plaintiff1.MiscellaneousMedMal.medsTaken) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>List any out of pocket expenses as a result of this malpractice</strong>';
                strVar += '                        <p>';
                strVar += (utils.isNotEmptyVal(other_details.plaintiff1.MiscellaneousMedMal) && utils.isNotEmptyVal(other_details.plaintiff1.MiscellaneousMedMal.expense)) ? utils.removeunwantedHTML(other_details.plaintiff1.MiscellaneousMedMal.expense) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>List all medical bills received as a result of this incident</strong>';
                strVar += '                        <p>';
                strVar += (utils.isNotEmptyVal(other_details.plaintiff1.MiscellaneousMedMal) && utils.isNotEmptyVal(other_details.plaintiff1.MiscellaneousMedMal.medicalBills)) ? utils.removeunwantedHTML(other_details.plaintiff1.MiscellaneousMedMal.medicalBills) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you have copies of any medical records?</strong>';
                strVar += '                        <p>';
                strVar += (utils.isNotEmptyVal(other_details.plaintiff1.MiscellaneousMedMal) && utils.isNotEmptyVal(other_details.plaintiff1.MiscellaneousMedMal.medicalRecordCopies)) ? utils.removeunwantedHTML(other_details.plaintiff1.MiscellaneousMedMal.medicalRecordCopies) : "Don't Know";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you have photos?</strong>';
                strVar += '                        <p>';
                strVar += (utils.isNotEmptyVal(other_details.plaintiff1.MiscellaneousMedMal) && utils.isNotEmptyVal(other_details.plaintiff1.MiscellaneousMedMal.havePhotos)) ? utils.removeunwantedHTML(other_details.plaintiff1.MiscellaneousMedMal.havePhotos) : "Don't Know";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';

                strVar += '             </table>';
                strVar += '             </div>';
                strVar += '        </div>';
                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Insurance Details</h2>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Health Insurance</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td width="">';
                strVar += '                        <strong>Have you ever had Medicaid/Medicare?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.medicare);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="">';
                strVar += '                        <strong>Do you presently have health insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.insuranceDetails);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.insuranceDetails == 1) {

                    var healthobj = _.map(intakeOverviewData.Plaintiff_Details[0].insuranceInfos, function (item) {
                        if (item.insuranceType == "Health") {
                            return item;
                        }
                    })
                    healthobj = healthobj.filter(function (element) {
                        return element !== undefined;
                    });
                    if (intakeOverviewData.Plaintiff_Details && intakeOverviewData.Plaintiff_Details.length > 0 && intakeOverviewData.Plaintiff_Details[0].insuranceInfos != null && healthobj.length != 0) {
                        _.forEach(healthobj, function (currentItem) {
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insured Party</strong>';
                            strVar += '                        <p>';
                            if (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.insuredParty)) {
                                var insuredPartyName = _.map(currentItem.insuredParty, function (item) {
                                    var fname, lname;
                                    utils.isNotEmptyVal(item.firstName) ? fname = utils.removeunwantedHTML(item.firstName) : fname = "";
                                    utils.isNotEmptyVal(item.lastName) ? lname = utils.removeunwantedHTML(item.lastName) : lname = "";
                                    return fname + " " + lname;
                                });
                                strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.insuredParty)) ? insuredPartyName : "-";

                            } else {
                                strVar += "-";
                            }
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insurance Provider</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.insuranceProvider)) ? (utils.removeunwantedHTML(currentItem.insuranceProvider.firstName) + '' + utils.removeunwantedHTML(currentItem.insuranceProvider.lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insurance Type</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.type)) ? checkProp(currentItem.type) : "";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Excess Confirmed</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.excessConfirmed)) ? checkProp(currentItem.excessConfirmed) : "Don't Know";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                </tr>';
                            strVar += '                <tr>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>Policy Exhausted</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.policyExhausted)) ? checkProp(currentItem.policyExhausted) : "Don't Know";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>Where do you get health insurance from?</strong>';
                            strVar += '                        <p>';
                            strVar += checkProp(other_details.plaintiff1.healthInsuranceFrom);
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Policy Limit</strong>';
                            strVar += '                        <p>'
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem)) ? (utils.isNotEmptyVal(currentItem.policyLimit) ? $filter('currency')(currentItem.policyLimit, '$', 2) : "-") + '/' + (utils.isNotEmptyVal(currentItem.policyLimitMax) ? $filter('currency')(currentItem.policyLimitMax, '$', 2) : "-") : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Policy Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? (utils.isNotEmptyVal(currentItem.policyNumber) ? (utils.isNotEmptyVal(currentItem.policyNumber) ? currentItem.policyNumber : "-") : "-") : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Claim Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? (utils.isNotEmptyVal(currentItem.claimNumber) ? (utils.isNotEmptyVal(currentItem.claimNumber) ? currentItem.claimNumber : "-") : "-") : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                        })
                    } else {
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insured Party</strong>';
                        strVar += '                        <p>';

                        strVar += "-";

                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insurance Provider</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insurance Type</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Excess Confirmed</strong>';
                        strVar += '                        <p>';
                        strVar += "Don't Know";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                </tr>';
                        strVar += '                <tr>';
                        strVar += '                    <td>';
                        strVar += '                        <strong>Policy Exhausted</strong>';
                        strVar += '                        <p>';
                        strVar += "Don't Know";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td>';
                        strVar += '                        <strong>Where do you get health insurance from?</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Policy Limit</strong>';
                        strVar += '                        <p>'
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Policy Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Claim Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                    }

                }

                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td colspan="5">';
                strVar += '                        <strong>Have you ever been denied health insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.denied);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.denied == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="5">';
                    strVar += '                        <strong>Describe company and reason for denial</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeDenial));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td colspan="5">';
                strVar += '                        <strong>Have you ever been on State Insurance of any type?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.State);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.State == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="5">';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeDetails));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td colspan="2">';
                strVar += '                        <strong>Have you been denied medicare in the past 36 months?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.deniedMedicare);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td colspan="3">';
                strVar += '                        <strong>Will you apply for medicare in the next 36 months?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.medicareNext);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '        </div>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Automobile Insurance</h3>';
                strVar += '            <div class="plaintiff-table">';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="6">';
                strVar += '                        <strong>Does anyone in house presently have auto insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.auto);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.auto == 1) {
                    // intakeOverviewData.Plaintiff_Details && intakeOverviewData.Plaintiff_Details.length > 0 && intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords.length > 0
                    if (intakeOverviewData.Plaintiff_Details && intakeOverviewData.Plaintiff_Details.length > 0 && intakeOverviewData.Plaintiff_Details[0].insuranceInfos != null) {
                        var AutomobileObj = _.map(intakeOverviewData.Plaintiff_Details[0].insuranceInfos, function (item) {
                            if (item.insuranceType == "AutoMobile") {
                                return item;
                            }
                        })
                        AutomobileObj = AutomobileObj.filter(function (element) {
                            return element !== undefined;
                        });
                        AutomobileObj = _.sortBy(AutomobileObj, 'createdDate');
                        _.forEach(AutomobileObj, function (item) {
                            strVar += '                <tr>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Insured Party</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuredParty[0])) ? (utils.removeunwantedHTML(item.insuredParty[0].firstName) + '' + utils.removeunwantedHTML(item.insuredParty[0].lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Insurance Provider</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuranceProvider)) ? (utils.removeunwantedHTML(item.insuranceProvider.firstName) + '' + utils.removeunwantedHTML(item.insuranceProvider.lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insurance Type</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.type)) ? checkProp(item.type) : "";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Adjuster Name</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.adjuster)) ? (utils.removeunwantedHTML(item.adjuster.firstName) + ' ' + utils.removeunwantedHTML(item.adjuster.lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Policy Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.policyNumber) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Claim Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.claimNumber) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Driver Licence Number</strong>';
                            strVar += '                        <p>';
                            strVar += checkProp(item.licenceNumber);
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td colspan="2">';
                            strVar += '                        <strong>Duration for which state licence was held</strong>';
                            strVar += '                        <p>';
                            strVar += utils.removeunwantedHTML(checkProp(item.licenceDuration));
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                </tr>';
                        })
                    } else {
                        strVar += '                <tr>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Insured Party</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Insurance Provider</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insurance Type</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Adjuster Name</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Policy Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Claim Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Driver Licence Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td colspan="2">';
                        strVar += '                        <strong>Duration for which state licence was held</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                </tr>';
                    }
                }

                strVar += '                <tr>';

                strVar += '                    <td colspan="4">';
                strVar += '                        <strong>Do you have any medical payments coverage (A/KA/MED PAY) under your Automobile Insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.paymentsCoverage);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                if (other_details.plaintiff1.paymentsCoverage == 1) {
                    strVar += '                    <td width="28%">';
                    strVar += '                        <strong>Please state how much coverage</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.coverage));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                    <td>';
                strVar += '                        <strong>Year of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += checkProp(other_details.plaintiff1.yearOfVehicalAuto);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Model of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.modelOfVehicalAuto));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Color of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.colorOfVehicalAuto));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>No-fault insurance ever filed?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.nofaultInsurance);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Was incident reported to an insurance company?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.accidentReportedCompany);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.automobileOtherDetails.accidentReportedCompany == 1) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Name of insurance company</strong>';
                    strVar += '                        <p>';
                    if (other_details.plaintiff1.automobileOtherDetails.insuredParty) {
                        strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.insuredParty.name));
                    }
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date it was reported?</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.automobileOtherDetails.dateReported) ? moment(other_details.plaintiff1.automobileOtherDetails.dateReported).format('MM/DD/YYYY') : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Claim Number</strong>';
                    strVar += '                        <p>';
                    strVar += checkProp(other_details.plaintiff1.automobileOtherDetails.claimNumber);
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="5">';
                    strVar += '                        <strong>Vehicle Insurance information for client</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.vehicleInfo));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Was no-fault claim filed?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.noFaultClaim);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.automobileOtherDetails.noFaultClaim == 1) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date on which fault claim was filed</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.automobileOtherDetails.dateOfNoFaultClaim) ? moment(other_details.plaintiff1.automobileOtherDetails.dateOfNoFaultClaim).format('MM/DD/YYYY') : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                    <td>';
                strVar += '                        <strong>Does client have copy?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.clientCopy);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Hit and run?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.hitAndRun);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';

                strVar += '                <tr>';
                if (other_details.plaintiff1.automobileOtherDetails.hitAndRun == 1) {
                    strVar += '                    <td colspan="2">';
                    strVar += '                        <strong>If this was a hit and run incident, was Notice of Intention filed with MVIAC?</strong>';
                    strVar += '                        <p>';
                    strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.hitAndRunNotice);
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                if (other_details.plaintiff1.automobileOtherDetails.hitAndRunNotice == 1) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date on which hit and run incident was filed</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.automobileOtherDetails.dateOfHitAndRun) ? moment(other_details.plaintiff1.automobileOtherDetails.dateOfHitAndRun).format('MM/DD/YYYY') : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                    <td>';
                strVar += '                        <strong>Notice of intention ever filed?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.deathCertificate);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Does client have copy?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.client_Copy);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Does anyone living with client own a vehicle?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.clientVehicle);
                strVar += '                        </p>';
                strVar += '                    </td>';

                if (other_details.plaintiff1.automobileOtherDetails.clientVehicle == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="1">';
                    strVar += '                        <strong>Make and Model</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.makeAndModel));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Owner of Vehicle</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.ownerOfVehicle));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td colspan="5">';
                strVar += '                        <strong>Insurance coverage information</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.insuranceCoverageInfo));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            </div>';
                strVar += '        </div>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Other driver insurance coverage information</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                var OtherDriverObj = _.map(intakeOverviewData.Plaintiff_Details[0].insuranceInfos, function (item) {
                    if (item.insuranceType == "OtherDriver") {
                        return item;
                    }
                })
                OtherDriverObj = OtherDriverObj.filter(function (element) {
                    return element !== undefined;
                });
                if (OtherDriverObj.length == 0) {
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insured Party</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insurance Provider</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="17%">';
                    strVar += '                        <strong>Insurance Type</strong>';
                    strVar += '                        <p>';
                    strVar += "";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Adjuster Name</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                _.forEach(OtherDriverObj, function (item) {
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insured Party</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuredParty[0])) ? (utils.removeunwantedHTML(item.insuredParty[0].firstName) + ' ' + utils.removeunwantedHTML(item.insuredParty[0].lastName)) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insurance Provider</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuranceProvider)) ? (utils.removeunwantedHTML(item.insuranceProvider.firstName) + ' ' + utils.removeunwantedHTML(item.insuranceProvider.lastName)) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="17%">';
                    strVar += '                        <strong>Insurance Type</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.type)) ? checkProp(item.type) : "";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Adjuster Name</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.adjuster)) ? (utils.removeunwantedHTML(item.adjuster.firstName) + ' ' + utils.removeunwantedHTML(item.adjuster.lastName)) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                })

                strVar += '                    <td width="25%">';
                strVar += '                        <strong>Year of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += checkProp(other_details.plaintiff1.yearOfVehicalOther);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Model of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.modelOfVehicalOther));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Color of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.colorOfVehicalOther));
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (OtherDriverObj.length == 0) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Policy Number</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Claim Number</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                _.forEach(OtherDriverObj, function (item) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Policy Number</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.policyNumber) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Claim Number</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.claimNumber) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                })

                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '        </div>';

                // Other Details Added
                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Other Details</h2>';
                strVar += '        <div class="sub-main">';

                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Claims</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="3">';
                strVar += '                        <b style="margin-top: 10px;display: block;font-size: 11.5pt;">Prior Injury Claims and Law Suits</b>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td width="30%">';
                strVar += '                        <strong>Have you ever filled a claim and/or lawsuit for personal injuries?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.claimLawsuit);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.claimLawsuit == 1) {
                    strVar += '                    <td width="15%">';
                    strVar += '                        <strong>Date of Claim</strong>';
                    strVar += '                        <p>'
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.dateClaimLawsit) ? moment(other_details.plaintiff1.dateClaimLawsit).format("MM/DD/YYYY") : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="30%">';
                    strVar += '                        <strong>Nature of Claim</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.natureOfClaim));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="3">';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.detailsClaimLawsit));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Disability Claims</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="2">';
                strVar += '                        <strong>Have you ever filled for any type of disability claims such as SSD, short term disability, long term disability etc.?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.SSD);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.SSD == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td width="15%">';
                    strVar += '                        <strong>Date when determined disabled</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.dateDeterminedDisabled) ? moment(other_details.plaintiff1.dateDeterminedDisabled).format("MM/DD/YYYY") : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="30%">';
                    strVar += '                        <strong>Nature of Disability</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.natureOfDisability));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="2">';
                    strVar += '                        <strong>Describe what body parts were disabled</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeNature));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Worker Compensation Claims</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever filled a worker compensation claim?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.claim);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.claim == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe how and when injured</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeClaim));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>List health care providers for workers compensation injuries</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.listHealthCare));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Miscellaneous</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <b style="margin-top: 5px;display: block;font-size: 11.5pt;">Lawsuits, Judgments, State Assistance and Child Support</b>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever been involved in a lawsuit?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.lawsuit);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.lawsuit == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeLawsuit));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you have any judgments pending against you now?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.judgments);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.judgments == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeJudgmentsPending));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you received state aid of any type?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.aidType);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.aidType == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.stateAid));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you have a court ordered child support obligation?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.obligation);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.obligation == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.childSupport));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Criminal or Motor Vehicle Convictions</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="3">';
                strVar += '                        <strong>Do you have any prior criminal or motor vehicle convictions?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.convictions);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.convictions == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="3">';
                    strVar += '                        <strong>Describe type of any and all charges and outcome</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeConvictions));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td width="10%">';
                    strVar += '                        <strong>Date</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.dateCriminal) ? moment(other_details.plaintiff1.dateCriminal).format("MM/DD/YYYY") : "-";
                    strVar += '                        <p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Place</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.placeCriminal));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever been incarcerated?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.incarcerate);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.incarcerate == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="3">';
                    strVar += '                        <strong>Provide details (including dates)</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.detailsCriminal));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }


                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Details on Military Service</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="4">';
                strVar += '                        <strong>Have you ever been in the military service?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.service);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.service == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Service Branch</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.serviceBranch));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Service Number</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.serviceNumber));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date of Service</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.datesOfService) ? moment(other_details.plaintiff1.datesOfService).format("MM/DD/YYYY") : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Type of Discharge</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.typeOfDischarge));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="4">';
                    strVar += '                        <strong>Awards Received</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.awardsReceived));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="4">';
                    strVar += '                        <strong>Information on any service connected injuries or disability</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.information));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Percentage of Disability</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.percentage));
                    strVar += '                        </p>';
                    strVar += '                    </td>';

                    strVar += '                    <td colspan="2">';
                    strVar += '                        <strong>Body parts receiving disability</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.injuredparts));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="2" width="35%">';
                    strVar += '                        <strong>Do you receive payments for service connected injuries?</strong>';
                    strVar += '                        <p>';
                    strVar += yesNoFn(other_details.plaintiff1.injuries);
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';

                }

                strVar += '                <tr>';
                if (other_details.plaintiff1.injuries == 1) {
                    strVar += '                    <td colspan="4">';
                    strVar += '                        <strong>Describe details of payments received for service conected injuries</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.describeMilitary) ? utils.removeunwantedHTML(other_details.plaintiff1.describeMilitary) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                </tr>';

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Eyes and/or Ears</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table" class="plaintiff-table">';

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you now or have you ever had eye glasses and/or hearing aid?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.aid);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.aid == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeAid));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Alcohol and Drug Addiction and/or Treatment</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever been treated for alcohol and/or drug use?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.alcoholorDrug);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.alcoholorDrug == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeAlcohol));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Bankruptcy</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Are you currently under any orders from the bankruptcy court?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.court);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.court == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeBankruptcyCourt));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Are you contemplating filling for bankruptcy in the next 6 months?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.contemplat);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.contemplat == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.contemplatingFilling));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Incident Double Check</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Other than this incident, have you ever been in a car incident (regardless of wheather a driver or a passanger) even if you did not make a claim?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.claimDoubleCheck);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.claimDoubleCheck == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeCarAccident));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Other than this incident, have you ever been injured in a fall (regardless of how occured) even if you did not make a claim?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.noClaim);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.noClaim == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeInjured));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Other than this incident, have you ever had an MRI or CT Scan or similar Diagnostic tests done before this incident?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.MRIorCTScan);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.MRIorCTScan == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeMRIOrCT));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '        </div>';
                // Other details Ended

                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Memo</h2>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Memo</h3>';
                strVar += '            <div class="plaintiff-table">';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.OtherMemo) ? utils.removeunwantedHTML(checkProp(other_details.plaintiff1.OtherMemo.memo)) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            </div>';
                strVar += '            </div>';

            } else {
                //console.log("other");
                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Details</h2>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Details</h3>';
                strVar += '            <div class="plaintiff-table">';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Injuries</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.details.injuries) ? utils.removeunwantedHTML(other_details.plaintiff1.details.injuries) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Witnesses</strong>';
                var witnessName = _.map(other_details.plaintiff1.details.witnessNameListForDetails, function (item) {
                    var fname;
                    utils.isNotEmptyVal(item.name.name) ? fname = utils.removeunwantedHTML(item.name.name) : fname = "";
                    return fname;
                });
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.details.witnessNameListForDetails) ? utils.removeunwantedHTML(witnessName) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Police Report</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.details.policeReport) ? utils.removeunwantedHTML(other_details.plaintiff1.details.policeReport) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Incident Report</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.details.incidentReport) ? utils.removeunwantedHTML(other_details.plaintiff1.details.incidentReport) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Medical Attention</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.details.medicalAttention) ? utils.removeunwantedHTML(other_details.plaintiff1.details.medicalAttention) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Physician</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.details.physician) ? utils.removeunwantedHTML(other_details.plaintiff1.details.physician.name) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Hospital</strong>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.details.hospital) ? utils.removeunwantedHTML(other_details.plaintiff1.details.hospital.name) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.details.insurance);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Employment</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.details.employment);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            </div>';
                strVar += '            </div>';
                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Insurance Details</h2>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Health Insurance</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td width="">';
                strVar += '                        <strong>Have you ever had Medicaid/Medicare?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.medicare);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td width="">';
                strVar += '                        <strong>Do you presently have health insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.insuranceDetails);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.insuranceDetails == 1) {

                    var healthobj = _.map(intakeOverviewData.Plaintiff_Details[0].insuranceInfos, function (item) {
                        if (item.insuranceType == "Health") {
                            return item;
                        }
                    })
                    healthobj = healthobj.filter(function (element) {
                        return element !== undefined;
                    });
                    if (intakeOverviewData.Plaintiff_Details && intakeOverviewData.Plaintiff_Details.length > 0 && intakeOverviewData.Plaintiff_Details[0].insuranceInfos != null && healthobj.length != 0) {
                        _.forEach(healthobj, function (currentItem) {
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insured Party</strong>';
                            strVar += '                        <p>';
                            if (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.insuredParty)) {
                                var insuredPartyName = _.map(currentItem.insuredParty, function (item) {
                                    var fname, lname;
                                    utils.isNotEmptyVal(item.firstName) ? fname = utils.removeunwantedHTML(item.firstName) : fname = "";
                                    utils.isNotEmptyVal(item.lastName) ? lname = utils.removeunwantedHTML(item.lastName) : lname = "";
                                    return fname + " " + lname;
                                });
                                strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.insuredParty)) ? insuredPartyName : "-";

                            } else {
                                strVar += "-";
                            }
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insurance Provider</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.insuranceProvider)) ? (utils.removeunwantedHTML(currentItem.insuranceProvider.firstName) + '' + utils.removeunwantedHTML(currentItem.insuranceProvider.lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insurance Type</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.type)) ? checkProp(currentItem.type) : "";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Excess Confirmed</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.excessConfirmed)) ? checkProp(currentItem.excessConfirmed) : "Don't Know";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                </tr>';
                            strVar += '                <tr>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>Policy Exhausted</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem.policyExhausted)) ? checkProp(currentItem.policyExhausted) : "Don't Know";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td>';
                            strVar += '                        <strong>Where do you get health insurance from?</strong>';
                            strVar += '                        <p>';
                            strVar += checkProp(other_details.plaintiff1.healthInsuranceFrom);
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Policy Limit</strong>';
                            strVar += '                        <p>'
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(currentItem)) ? (utils.isNotEmptyVal(currentItem.policyLimit) ? $filter('currency')(currentItem.policyLimit, '$', 2) : "-") + '/' + (utils.isNotEmptyVal(currentItem.policyLimitMax) ? $filter('currency')(currentItem.policyLimitMax, '$', 2) : "-") : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Policy Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? (utils.isNotEmptyVal(currentItem.policyNumber) ? (utils.isNotEmptyVal(currentItem.policyNumber) ? currentItem.policyNumber : "-") : "-") : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Claim Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? (utils.isNotEmptyVal(currentItem.claimNumber) ? (utils.isNotEmptyVal(currentItem.claimNumber) ? currentItem.claimNumber : "-") : "-") : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                        })
                    } else {
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insured Party</strong>';
                        strVar += '                        <p>';

                        strVar += "-";

                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insurance Provider</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insurance Type</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Excess Confirmed</strong>';
                        strVar += '                        <p>';
                        strVar += "Don't Know";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                </tr>';
                        strVar += '                <tr>';
                        strVar += '                    <td>';
                        strVar += '                        <strong>Policy Exhausted</strong>';
                        strVar += '                        <p>';
                        strVar += "Don't Know";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td>';
                        strVar += '                        <strong>Where do you get health insurance from?</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Policy Limit</strong>';
                        strVar += '                        <p>'
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Policy Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Claim Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                    }

                }

                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td colspan="5">';
                strVar += '                        <strong>Have you ever been denied health insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.denied);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.denied == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="5">';
                    strVar += '                        <strong>Describe company and reason for denial</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeDenial));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td colspan="5">';
                strVar += '                        <strong>Have you ever been on State Insurance of any type?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.State);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.State == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="5">';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeDetails));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td colspan="2">';
                strVar += '                        <strong>Have you been denied medicare in the past 36 months?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.deniedMedicare);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td colspan="3">';
                strVar += '                        <strong>Will you apply for medicare in the next 36 months?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.medicareNext);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '        </div>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Automobile Insurance</h3>';
                strVar += '            <div class="plaintiff-table">';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="6">';
                strVar += '                        <strong>Does anyone in house presently have auto insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.auto);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.auto == 1) {
                    // intakeOverviewData.Plaintiff_Details && intakeOverviewData.Plaintiff_Details.length > 0 && intakeOverviewData.Plaintiff_Details[0].intakeMedicalRecords.length > 0
                    if (intakeOverviewData.Plaintiff_Details && intakeOverviewData.Plaintiff_Details.length > 0 && intakeOverviewData.Plaintiff_Details[0].insuranceInfos != null) {
                        var AutomobileObj = _.map(intakeOverviewData.Plaintiff_Details[0].insuranceInfos, function (item) {
                            if (item.insuranceType == "AutoMobile") {
                                return item;
                            }
                        })
                        AutomobileObj = AutomobileObj.filter(function (element) {
                            return element !== undefined;
                        });
                        AutomobileObj = _.sortBy(AutomobileObj, 'createdDate');
                        _.forEach(AutomobileObj, function (item) {
                            strVar += '                <tr>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Insured Party</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuredParty[0])) ? (utils.removeunwantedHTML(item.insuredParty[0].firstName) + '' + utils.removeunwantedHTML(item.insuredParty[0].lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Insurance Provider</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuranceProvider)) ? (utils.removeunwantedHTML(item.insuranceProvider.firstName) + '' + utils.removeunwantedHTML(item.insuranceProvider.lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="17%">';
                            strVar += '                        <strong>Insurance Type</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.type)) ? checkProp(item.type) : "";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Adjuster Name</strong>';
                            strVar += '                        <p>';
                            strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.adjuster)) ? (utils.removeunwantedHTML(item.adjuster.firstName) + ' ' + utils.removeunwantedHTML(item.adjuster.lastName)) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Policy Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.policyNumber) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Claim Number</strong>';
                            strVar += '                        <p>';
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.claimNumber) : "-";
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td width="">';
                            strVar += '                        <strong>Driver Licence Number</strong>';
                            strVar += '                        <p>';
                            strVar += checkProp(item.licenceNumber);
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                    <td colspan="2">';
                            strVar += '                        <strong>Duration for which state licence was held</strong>';
                            strVar += '                        <p>';
                            strVar += utils.removeunwantedHTML(checkProp(item.licenceDuration));
                            strVar += '                        </p>';
                            strVar += '                    </td>';
                            strVar += '                </tr>';
                        })
                    } else {
                        strVar += '                <tr>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Insured Party</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Insurance Provider</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="17%">';
                        strVar += '                        <strong>Insurance Type</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Adjuster Name</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Policy Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Claim Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td width="">';
                        strVar += '                        <strong>Driver Licence Number</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                    <td colspan="2">';
                        strVar += '                        <strong>Duration for which state licence was held</strong>';
                        strVar += '                        <p>';
                        strVar += "-";
                        strVar += '                        </p>';
                        strVar += '                    </td>';
                        strVar += '                </tr>';
                    }
                }

                strVar += '                <tr>';

                strVar += '                    <td colspan="4">';
                strVar += '                        <strong>Do you have any medical payments coverage (A/KA/MED PAY) under your Automobile Insurance?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.paymentsCoverage);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                if (other_details.plaintiff1.paymentsCoverage == 1) {
                    strVar += '                    <td width="28%">';
                    strVar += '                        <strong>Please state how much coverage</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.coverage));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                    <td>';
                strVar += '                        <strong>Year of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += checkProp(other_details.plaintiff1.yearOfVehicalAuto);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Model of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.modelOfVehicalAuto));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Color of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.colorOfVehicalAuto));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>No-fault insurance ever filed?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.nofaultInsurance);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Was incident reported to an insurance company?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.accidentReportedCompany);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.automobileOtherDetails.accidentReportedCompany == 1) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Name of insurance company</strong>';
                    strVar += '                        <p>';
                    if (other_details.plaintiff1.automobileOtherDetails.insuredParty) {
                        strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.insuredParty.name));
                    }
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date it was reported?</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.automobileOtherDetails.dateReported) ? moment(other_details.plaintiff1.automobileOtherDetails.dateReported).format('MM/DD/YYYY') : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Claim Number</strong>';
                    strVar += '                        <p>';
                    strVar += checkProp(other_details.plaintiff1.automobileOtherDetails.claimNumber);
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="5">';
                    strVar += '                        <strong>Vehicle Insurance information for client</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.vehicleInfo));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Was no-fault claim filed?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.noFaultClaim);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.automobileOtherDetails.noFaultClaim == 1) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date on which fault claim was filed</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.automobileOtherDetails.dateOfNoFaultClaim) ? moment(other_details.plaintiff1.automobileOtherDetails.dateOfNoFaultClaim).format('MM/DD/YYYY') : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                    <td>';
                strVar += '                        <strong>Does client have copy?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.clientCopy);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Hit and run?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.hitAndRun);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';

                strVar += '                <tr>';
                if (other_details.plaintiff1.automobileOtherDetails.hitAndRun == 1) {
                    strVar += '                    <td colspan="2">';
                    strVar += '                        <strong>If this was a hit and run incident, was Notice of Intention filed with MVIAC?</strong>';
                    strVar += '                        <p>';
                    strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.hitAndRunNotice);
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                if (other_details.plaintiff1.automobileOtherDetails.hitAndRunNotice == 1) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date on which hit and run incident was filed</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.automobileOtherDetails.dateOfHitAndRun) ? moment(other_details.plaintiff1.automobileOtherDetails.dateOfHitAndRun).format('MM/DD/YYYY') : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                    <td>';
                strVar += '                        <strong>Notice of intention ever filed?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.deathCertificate);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Does client have copy?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.client_Copy);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Does anyone living with client own a vehicle?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.automobileOtherDetails.clientVehicle);
                strVar += '                        </p>';
                strVar += '                    </td>';

                if (other_details.plaintiff1.automobileOtherDetails.clientVehicle == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="1">';
                    strVar += '                        <strong>Make and Model</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.makeAndModel));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Owner of Vehicle</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.ownerOfVehicle));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td colspan="5">';
                strVar += '                        <strong>Insurance coverage information</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.automobileOtherDetails.insuranceCoverageInfo));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            </div>';
                strVar += '        </div>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Other driver insurance coverage information</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                var OtherDriverObj = _.map(intakeOverviewData.Plaintiff_Details[0].insuranceInfos, function (item) {
                    if (item.insuranceType == "OtherDriver") {
                        return item;
                    }
                })
                OtherDriverObj = OtherDriverObj.filter(function (element) {
                    return element !== undefined;
                });
                if (OtherDriverObj.length == 0) {
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insured Party</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insurance Provider</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="17%">';
                    strVar += '                        <strong>Insurance Type</strong>';
                    strVar += '                        <p>';
                    strVar += "";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Adjuster Name</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                _.forEach(OtherDriverObj, function (item) {
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insured Party</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuredParty[0])) ? (utils.removeunwantedHTML(item.insuredParty[0].firstName) + ' ' + utils.removeunwantedHTML(item.insuredParty[0].lastName)) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Insurance Provider</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.insuranceProvider)) ? (utils.removeunwantedHTML(item.insuranceProvider.firstName) + ' ' + utils.removeunwantedHTML(item.insuranceProvider.lastName)) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="17%">';
                    strVar += '                        <strong>Insurance Type</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.type)) ? checkProp(item.type) : "";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Adjuster Name</strong>';
                    strVar += '                        <p>';
                    strVar += (utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) && utils.isNotEmptyVal(item.adjuster)) ? (utils.removeunwantedHTML(item.adjuster.firstName) + ' ' + utils.removeunwantedHTML(item.adjuster.lastName)) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                })

                strVar += '                    <td width="25%">';
                strVar += '                        <strong>Year of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += checkProp(other_details.plaintiff1.yearOfVehicalOther);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Model of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.modelOfVehicalOther));
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                    <td>';
                strVar += '                        <strong>Color of Vehicle</strong>';
                strVar += '                        <p>';
                strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.colorOfVehicalOther));
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (OtherDriverObj.length == 0) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Policy Number</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Claim Number</strong>';
                    strVar += '                        <p>';
                    strVar += "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                _.forEach(OtherDriverObj, function (item) {
                    strVar += '                    <td>';
                    strVar += '                        <strong>Policy Number</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.policyNumber) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Claim Number</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(intakeOverviewData.Plaintiff_Details[0].insuranceInfos) ? checkProp(item.claimNumber) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                })

                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '        </div>';

                //Other Details for every type
                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Other Details</h2>';
                strVar += '        <div class="sub-main">';

                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Claims</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="3">';
                strVar += '                        <b style="margin-top: 10px;display: block;font-size: 11.5pt;">Prior Injury Claims and Law Suits</b>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td width="30%">';
                strVar += '                        <strong>Have you ever filled a claim and/or lawsuit for personal injuries?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.claimLawsuit);
                strVar += '                        </p>';
                strVar += '                    </td>';
                if (other_details.plaintiff1.claimLawsuit == 1) {
                    strVar += '                    <td width="15%">';
                    strVar += '                        <strong>Date of Claim</strong>';
                    strVar += '                        <p>'
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.dateClaimLawsit) ? moment(other_details.plaintiff1.dateClaimLawsit).format("MM/DD/YYYY") : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="30%">';
                    strVar += '                        <strong>Nature of Claim</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.natureOfClaim));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="3">';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.detailsClaimLawsit));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Disability Claims</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="2">';
                strVar += '                        <strong>Have you ever filled for any type of disability claims such as SSD, short term disability, long term disability etc.?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.SSD);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.SSD == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td width="15%">';
                    strVar += '                        <strong>Date when determined disabled</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.dateDeterminedDisabled) ? moment(other_details.plaintiff1.dateDeterminedDisabled).format("MM/DD/YYYY") : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td width="30%">';
                    strVar += '                        <strong>Nature of Disability</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.natureOfDisability));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="2">';
                    strVar += '                        <strong>Describe what body parts were disabled</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeNature));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Worker Compensation Claims</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever filled a worker compensation claim?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.claim);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.claim == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe how and when injured</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeClaim));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>List health care providers for workers compensation injuries</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.listHealthCare));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Miscellaneous</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <b style="margin-top: 5px;display: block;font-size: 11.5pt;">Lawsuits, Judgments, State Assistance and Child Support</b>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever been involved in a lawsuit?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.lawsuit);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.lawsuit == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeLawsuit));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you have any judgments pending against you now?</strong>';
                strVar += '                        <p>'
                strVar += yesNoFn(other_details.plaintiff1.judgments);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.judgments == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeJudgmentsPending));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you received state aid of any type?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.aidType);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.aidType == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.stateAid));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you have a court ordered child support obligation?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.obligation);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.obligation == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.childSupport));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Criminal or Motor Vehicle Convictions</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="3">';
                strVar += '                        <strong>Do you have any prior criminal or motor vehicle convictions?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.convictions);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.convictions == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="3">';
                    strVar += '                        <strong>Describe type of any and all charges and outcome</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeConvictions));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td width="10%">';
                    strVar += '                        <strong>Date</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.dateCriminal) ? moment(other_details.plaintiff1.dateCriminal).format("MM/DD/YYYY") : "-";
                    strVar += '                        <p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Place</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.placeCriminal));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever been incarcerated?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.incarcerate);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.incarcerate == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="3">';
                    strVar += '                        <strong>Provide details (including dates)</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.detailsCriminal));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }


                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Details on Military Service</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td colspan="4">';
                strVar += '                        <strong>Have you ever been in the military service?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.service);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.service == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Service Branch</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.serviceBranch));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Service Number</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.serviceNumber));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Date of Service</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.datesOfService) ? moment(other_details.plaintiff1.datesOfService).format("MM/DD/YYYY") : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Type of Discharge</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.typeOfDischarge));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="4">';
                    strVar += '                        <strong>Awards Received</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.awardsReceived));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="4">';
                    strVar += '                        <strong>Information on any service connected injuries or disability</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.information));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td width="25%">';
                    strVar += '                        <strong>Percentage of Disability</strong>';
                    strVar += '                        <p>'
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.percentage));
                    strVar += '                        </p>';
                    strVar += '                    </td>';

                    strVar += '                    <td colspan="2">';
                    strVar += '                        <strong>Body parts receiving disability</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.injuredparts));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                    strVar += '                <tr>';
                    strVar += '                    <td colspan="2" width="35%">';
                    strVar += '                        <strong>Do you receive payments for service connected injuries?</strong>';
                    strVar += '                        <p>';
                    strVar += yesNoFn(other_details.plaintiff1.injuries);
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';

                }

                strVar += '                <tr>';
                if (other_details.plaintiff1.injuries == 1) {
                    strVar += '                    <td colspan="4">';
                    strVar += '                        <strong>Describe details of payments received for service conected injuries</strong>';
                    strVar += '                        <p>';
                    strVar += utils.isNotEmptyVal(other_details.plaintiff1.describeMilitary) ? utils.removeunwantedHTML(other_details.plaintiff1.describeMilitary) : "-";
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                }

                strVar += '                </tr>';

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Eyes and/or Ears</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table" class="plaintiff-table">';

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Do you now or have you ever had eye glasses and/or hearing aid?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.aid);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.aid == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeAid));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Alcohol and Drug Addiction and/or Treatment</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Have you ever been treated for alcohol and/or drug use?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.alcoholorDrug);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.alcoholorDrug == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeAlcohol));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Bankruptcy</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Are you currently under any orders from the bankruptcy court?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.court);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.court == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeBankruptcyCourt));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Are you contemplating filling for bankruptcy in the next 6 months?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.contemplat);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.contemplat == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.contemplatingFilling));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Prior Incident Double Check</h3>';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px" class="plaintiff-table">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Other than this incident, have you ever been in a car incident (regardless of wheather a driver or a passanger) even if you did not make a claim?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.claimDoubleCheck);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.claimDoubleCheck == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeCarAccident));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Other than this incident, have you ever been injured in a fall (regardless of how occured) even if you did not make a claim?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.noClaim);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.noClaim == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeInjured));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <strong>Other than this incident, have you ever had an MRI or CT Scan or similar Diagnostic tests done before this incident?</strong>';
                strVar += '                        <p>';
                strVar += yesNoFn(other_details.plaintiff1.MRIorCTScan);
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                if (other_details.plaintiff1.MRIorCTScan == 1) {
                    strVar += '                <tr>';
                    strVar += '                    <td>';
                    strVar += '                        <strong>Describe</strong>';
                    strVar += '                        <p>';
                    strVar += utils.removeunwantedHTML(checkProp(other_details.plaintiff1.describeMRIOrCT));
                    strVar += '                        </p>';
                    strVar += '                    </td>';
                    strVar += '                </tr>';
                }

                strVar += '            </table>';
                strVar += '        </div>';
                // Other details added

                strVar += '        <h2 style="background-color: #E9EEF0;padding: 5px;padding-bottom: 5px;">Memo</h2>';
                strVar += '        <div class="sub-main">';
                strVar += '            <h3 style="margin-bottom:3px;border: 1px solid #d3d9de;padding: 5px;margin: 0;border-bottom: 0;margin-top: 10px;">Memo</h3>';
                strVar += '            <div class="plaintiff-table">';
                strVar += '            <table width="100%" cellspacing="0" cellpadding="5px">';
                strVar += '                <tr>';
                strVar += '                    <td>';
                strVar += '                        <p>';
                strVar += utils.isNotEmptyVal(other_details.plaintiff1.OtherMemo) ? utils.removeunwantedHTML(checkProp(other_details.plaintiff1.OtherMemo.memo)) : "-";
                strVar += '                        </p>';
                strVar += '                    </td>';
                strVar += '                </tr>';
                strVar += '            </table>';
                strVar += '            </div>';
                strVar += '            </div>';
            }

            strVar += '    <!-- End HTML For Plaintiff Print -->';
            strVar += '    ';
            strVar += '    <!-- Start HTML For Notes Print -->';
            strVar += '    <h1>Notes</h1>';
            strVar += '    <div class="main">';
            strVar += '        <table width="100%" cellspacing="0" cellpadding="5px" class="grid-table">';
            strVar += '            <tr style="background-color: #E9EEF0;">';
            strVar += '                <th width="40%" align="left"><strong>Note</strong></th>';
            strVar += '                <th width="15%" align="left"><strong>Category</strong></th>';
            strVar += '                <th width="15%" align="left"><strong>Added by</strong></th>';
            strVar += '                <th width="10%" align="left"><strong>Added on</strong></th>';
            strVar += '                <th width="20%" align="left"><strong>Linked contact</strong></th>';
            strVar += '            </tr>';
            if (intakeOverviewData.Notes.notes.length > 0) {
                for (var i = 0; i < intakeOverviewData.Notes.notes.length; i++) {
                    var linkedContact = [];
                    if (intakeOverviewData.Notes.notes[i].linked_contact.length > 0) {
                        _.forEach(intakeOverviewData.Notes.notes[i].linked_contact, function (item) {
                            item.last_name = (utils.isEmptyVal(item.last_name) || item.last_name == null) ? "" : utils.removeunwantedHTML(item.last_name);
                            item.first_name = (utils.isEmptyVal(item.first_name) || item.first_name == null) ? "" : utils.removeunwantedHTML(item.first_name);
                            linkedContact.push(item.first_name + " " + item.last_name);
                        });
                    } else {
                        linkedContact = " ";
                    }
                    var noteText;
                    noteText = utils.isNotEmptyVal(intakeOverviewData.Notes.notes[i].text) ? utils.replaceHtmlEntites(intakeOverviewData.Notes.notes[i].text.replace(/<\/?[^>]+>/gi, '')) : '';
                    noteText = utils.replaceQuoteWithActual(noteText);
                    (intakeOverviewData.Notes.notes[i].noteCategory.category_name == 'email') ? noteText = noteText : noteText = intakeOverviewData.Notes.notes[i].plaintext;

                    strVar += '            <tr>';
                    strVar += '                <td><p>';
                    strVar += utils.removeunwantedHTML(noteText);
                    strVar += '                 </p></td>';
                    strVar += '                <td><p>';
                    strVar += utils.isNotEmptyVal(intakeOverviewData.Notes.notes[i].noteCategory.category_name) ? intakeOverviewData.Notes.notes[i].noteCategory.category_name : "NOTE";
                    strVar += '                 </p></td>';
                    strVar += '                <td><p>';
                    strVar += intakeOverviewData.Notes.notes[i].user.first_name + ' ' + intakeOverviewData.Notes.notes[i].user.last_name;
                    strVar += '                 </p></td>';
                    strVar += '                <td><p>';
                    strVar += ($filter('utcDateFilter')(intakeOverviewData.Notes.notes[i].created_date, "MM/DD/YYYY hh:mm A"));
                    strVar += '                 </p></td>';
                    strVar += '                <td><p>';
                    strVar += linkedContact.toString();
                    strVar += '                 </p></td>';
                    strVar += '            </tr>';
                }
            }
            else {
                strVar += '            <tr>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '            </tr>';
            }
            strVar += '        </table>';
            strVar += '    </div>';
            strVar += '    <!-- End HTML For Notes Print -->';
            strVar += '    ';
            strVar += '    <!-- Start HTML For Events Print -->';
            strVar += '    <h1>Events</h1>';
            strVar += '    <div class="main">';
            strVar += '        <table width="100%" cellspacing="0" cellpadding="5px" class="grid-table">';
            strVar += '            <tr style="background-color: #E9EEF0;">';
            strVar += '                <th width="15%" align="left"><strong>Event Title</strong></th>';
            strVar += '                <th width="7%" align="left"><strong>Assigned To</strong></th>';
            strVar += '                <th width="7%" align="left"><strong>Start Date</strong></th>';
            strVar += '                <th width="7%" align="left"><strong>End Date</strong></th>';
            strVar += '                <th width="12%" align="left"><strong>Location</strong></th>';
            strVar += '                <th width="10%" align="left"><strong>Description</strong></th>';
            strVar += '                <th width="7%" align="left"><strong>Reminder Days Prior to Due Date</strong></th>';
            strVar += '                <th width="7%" align="left"><strong>And/Or Custom Date Reminder</strong></th>'
            strVar += '                <th width="7%" align="left"><strong>Remind Users</strong></th>';
            strVar += '                <th width="7%" align="left"><strong>Reminder Days Prior to Due Date</strong></th>';
            strVar += '                <th width="7%" align="left"><strong>And/Or Custom Date Reminder</strong></th>'
            strVar += '                <th width="7%" align="left"><strong>Remind Associated Parties</strong></th>';
            strVar += '            </tr>';
            if (intakeOverviewData.Events.length > 0) {
                for (var i = 0; i < intakeOverviewData.Events.length; i++) {
                    var smsCustomReminderContact = [];
                    if (intakeOverviewData.Events[i].eventSmsContacts.length > 0) {
                        _.forEach(intakeOverviewData.Events[i].eventSmsContacts, function (item) {
                            item.last_name = (utils.isEmptyVal(item.lastName) || item.lastName == null) ? "" : utils.removeunwantedHTML(item.lastName);
                            item.first_name = (utils.isEmptyVal(item.firstName) || item.firstName == null) ? "" : utils.removeunwantedHTML(item.firstName);
                            smsCustomReminderContact.push(item.first_name + " " + item.last_name);
                        });
                    } else {
                        smsCustomReminderContact = " ";
                    }
                    strVar += '            <tr>';
                    strVar += '                <td><p>';
                    strVar += utils.removeunwantedHTML(checkProp(intakeOverviewData.Events[i].eventTitle));
                    strVar += '                 </p></td>';
                    strVar += '                <td><p>';
                    var obj = utils.isEmptyVal(intakeOverviewData.Events[i].assignTo) ? '-' : _.pluck(intakeOverviewData.Events[i].assignTo, 'fullName').join(', ');
                    strVar += obj;
                    strVar += '                 </p></td>';
                    if (intakeOverviewData.Events[i].allDay == 1) {
                        strVar += '                <td><p>';
                        strVar += ($filter('utcImpDateFilter')(intakeOverviewData.Events[i].startDate, "MM/DD/YYYY"));
                        strVar += '                 </p></td>';
                        strVar += '                <td><p>';
                        strVar += ($filter('utcImpDateFilter')(intakeOverviewData.Events[i].endDate, "MM/DD/YYYY"));
                        strVar += '                 </p></td>';
                    } else {
                        strVar += '                <td><p>';
                        strVar += ($filter('utcDateFilter')(intakeOverviewData.Events[i].startDate, "MM/DD/YYYY hh:mm A"));
                        strVar += '                 </p></td>';
                        strVar += '                <td><p>';
                        strVar += ($filter('utcDateFilter')(intakeOverviewData.Events[i].endDate, "MM/DD/YYYY hh:mm A"));
                        strVar += '                 </p></td>';
                    }
                    strVar += '                <td><p>';
                    strVar += utils.removeunwantedHTML(checkProp(intakeOverviewData.Events[i].location));
                    strVar += '                 </p></td>';
                    strVar += '                <td><p>';
                    strVar += utils.removeunwantedHTML(checkProp(intakeOverviewData.Events[i].description));
                    strVar += '                 </p></td>';
                    strVar += '                <td><p>';
                    if (utils.isNotEmptyVal(intakeOverviewData.Events[i].reminderDays)) {
                        var tempRemdays = intakeOverviewData.Events[i].reminderDays.split(",");
                        strVar += intakeOverviewData.Events[i].reminderDays = tempRemdays.map(function (currentItem) {
                            return currentItem == '0' ? 'Event Day' : currentItem;
                        })
                        if (intakeOverviewData.Events[i].reminderDays.toString() == "null") {
                            strVar += intakeOverviewData.Events[i].reminderDays = '-';
                        }
                    }
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    strVar += utils.isNotEmptyVal(intakeOverviewData.Events[i].customReminder) ? ($filter('utcImpDateFilter')(intakeOverviewData.Events[i].customReminder, "MM/DD/YYYY")) : '-';
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    if (utils.isNotEmptyVal(intakeOverviewData.Events[i].remind_users_new)) {
                        var dataName = intakeOverviewData.Events[i].remind_users_new;
                        if (dataName === "All Users") {
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Events[i].remind_users_new) ? intakeOverviewData.Events[i].remind_users_new : "-";

                        } else if (dataName === "Assigned to Intake") {
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Events[i].remind_users_new) ? intakeOverviewData.Events[i].remind_users_new : "-";
                        }
                        else {
                            var RemindUserfullName = _.pluck(intakeOverviewData.Events[i].remind_users_new, 'fullName').toString();
                            strVar += utils.isNotEmptyVal(RemindUserfullName) ? RemindUserfullName : "-";
                        }
                    }

                    strVar += '                </p></td>';
                    // SMS
                    strVar += '                <td><p>';
                    if (utils.isNotEmptyVal(intakeOverviewData.Events[i].smsReminderDays)) {
                        var tempRemdays = intakeOverviewData.Events[i].smsReminderDays.split(",");
                        strVar += intakeOverviewData.Events[i].smsReminderDays = tempRemdays.map(function (currentItem) {
                            return currentItem == '0' ? 'Event Day' : currentItem;
                        })
                        if (intakeOverviewData.Events[i].smsReminderDays.toString() == "null") {
                            strVar += intakeOverviewData.Events[i].smsReminderDays = '-';
                        }
                    }
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    strVar += utils.isNotEmptyVal(intakeOverviewData.Events[i].smsCustomReminder) ? ($filter('utcImpDateFilter')(intakeOverviewData.Events[i].smsCustomReminder, "MM/DD/YYYY")) : '-';
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';

                    strVar += smsCustomReminderContact.toString();


                    strVar += '                </p></td>';

                    strVar += '            </tr>';
                }
            }
            else {
                strVar += '            <tr>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '            </tr>';
            }
            strVar += '        </table>';
            strVar += '    </div>';
            strVar += '    <!-- End HTML For Events Print -->';
            strVar += '    ';
            strVar += '    <!-- Start HTML For Tasks Print -->';
            strVar += '    <h1>Tasks</h1>';
            strVar += '    <div class="main">';
            strVar += '        <table width="100%" cellspacing="0" cellpadding="5px" class="grid-table">';
            strVar += '            <tr style="background-color: #E9EEF0;">';
            strVar += '                <th width="15%" align="left"><strong>Task Name</strong></th>';
            strVar += '                <th width="7%" align="left"><strong>Assigned To</strong></th>';
            strVar += '                <th width="15%" align="left"><strong>Description</strong></th>';
            strVar += '                <th width="7%" align="left"><strong>Assigned on</strong></th>';
            strVar += '                <th width="7%" align="left"><strong>Assigned By</strong></th>';
            strVar += '                <th width="7%" align="left"><strong>Due Date</strong></th>';
            strVar += '                <th width="7%" align="left"><strong>Priority</strong></th>';
            strVar += '                <th width="7%" align="left"><strong>Status</strong></th>';
            strVar += '                <th width="7%" align="left"><strong>Percentage Complete</strong></th>';
            strVar += '                <th width="10%" align="left"><strong>Reminder Days Prior to Due Date</strong></th>';
            strVar += '                <th width="10%" align="left"><strong>And/Or Custom Date Reminder</strong></th>'
            strVar += '                <th width="11%" align="left"><strong>Remind Users</strong></th>';
            strVar += '            </tr>';
            if (intakeOverviewData.Tasks.length > 0) {
                for (var i = 0; i < intakeOverviewData.Tasks.length; i++) {
                    strVar += '            <tr>';
                    strVar += '                <td><p>';
                    strVar += utils.removeunwantedHTML(intakeOverviewData.Tasks[i].taskName);
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    var obj = utils.isEmptyVal(intakeOverviewData.Tasks[i].assignedTo) ? '-' : _.pluck(intakeOverviewData.Tasks[i].assignedTo, 'fullName').join(', ');
                    strVar += obj;
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    strVar += utils.isNotEmptyVal(intakeOverviewData.Tasks[i].docURI) ? utils.removeunwantedHTML(intakeOverviewData.Tasks[i].docURI) + ' ' + utils.removeunwantedHTML(intakeOverviewData.Tasks[i].notes) : utils.removeunwantedHTML(checkProp(intakeOverviewData.Tasks[i].notes));
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    strVar += ($filter('utcDateFilter')(intakeOverviewData.Tasks[i].assignmentDate, "MM/DD/YYYY"));
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    var fullName;
                    utils.isNotEmptyVal(intakeOverviewData.Tasks[i].assignedBy.fullName) ? fullName = intakeOverviewData.Tasks[i].assignedBy.fullName : fullName = "-";
                    utils.isNotEmptyVal(intakeOverviewData.Tasks[i].assignedBy) ? strVar += fullName : strVar += "-";
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    strVar += ($filter('utcImpDateFilter')(intakeOverviewData.Tasks[i].dueDate, "MM/DD/YYYY"));
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    strVar += intakeOverviewData.Tasks[i].priority;
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    strVar += intakeOverviewData.Tasks[i].status;
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    strVar += intakeOverviewData.Tasks[i].percentageComplete;
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    if (utils.isNotEmptyVal(intakeOverviewData.Tasks[i].reminderDays) && intakeOverviewData.Tasks[i].reminderDays != "null") {
                        var tempRemdays = intakeOverviewData.Tasks[i].reminderDays.split(",");
                        strVar += intakeOverviewData.Tasks[i].reminderDays = tempRemdays.map(function (currentItem) {
                            return currentItem == '0' ? 'Due Day' : currentItem;
                        })

                    } else {

                        strVar += intakeOverviewData.Tasks[i].reminderDays = '-';

                    }

                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    strVar += utils.isNotEmptyVal(intakeOverviewData.Tasks[i].customReminder) ? ($filter('utcImpDateFilter')(intakeOverviewData.Tasks[i].customReminder, "MM/DD/YYYY")) : '-';
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    if (utils.isNotEmptyVal(intakeOverviewData.Tasks[i].remind_users_new)) {
                        var dataName = intakeOverviewData.Tasks[i].remind_users_new;
                        if (dataName === "All Users") {
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Tasks[i].remind_users_new) ? intakeOverviewData.Tasks[i].remind_users_new : "-";

                        } else if (dataName === "Assigned to Task") {
                            strVar += utils.isNotEmptyVal(intakeOverviewData.Tasks[i].remind_users_new) ? intakeOverviewData.Tasks[i].remind_users_new : "-";
                        }
                        else {
                            var RemindUserfullName = _.pluck(intakeOverviewData.Tasks[i].remind_users_new, 'fullName').toString();
                            strVar += utils.isNotEmptyVal(RemindUserfullName) ? RemindUserfullName : "-";
                        }
                    }
                    strVar += '                </p></td>';
                    strVar += '            </tr>';
                }
            }
            else {
                strVar += '            <tr>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '            </tr>';
            }

            strVar += '        </table>';
            strVar += '    </div>';
            strVar += '    <!-- End HTML For Tasks Print -->';
            strVar += '    ';
            strVar += '    <!-- Start HTML For Documents Print -->';
            strVar += '    <h1>Documents</h1>';
            strVar += '    <div class="main">';
            strVar += '        <table width="100%" cellspacing="0" cellpadding="5px" class="grid-table">';
            strVar += '            <tr style="background-color: #E9EEF0;">';
            strVar += '                <th width="39%" align="left"><strong>Document Name</strong></th>';
            strVar += '                <th width="25%" align="left"><strong>Intake Name</strong></th>';
            strVar += '                <th width="12%" align="left"><strong>Category</strong></th>';
            strVar += '                <th width="12%" align="left"><strong>Created By</strong></th>';
            strVar += '                <th width="12%" align="left"><strong>Date Filed</strong></th>';
            strVar += '            </tr>';
            if (intakeOverviewData.Documents.data.length > 0) {
                for (var i = 0; i < intakeOverviewData.Documents.data.length; i++) {
                    strVar += '            <tr>';
                    strVar += '                <td><p>';
                    strVar += utils.removeunwantedHTML(intakeOverviewData.Documents.data[i].documentname);
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    strVar += utils.removeunwantedHTML(intakeOverviewData.Documents.data[i].intake_name);
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    strVar += intakeOverviewData.Documents.data[i].categoryname;
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    strVar += intakeOverviewData.Documents.data[i].created_by;
                    strVar += '                </p></td>';
                    strVar += '                <td><p>';
                    strVar += ($filter('utcDateFilter')(intakeOverviewData.Documents.data[i].date_filed_date, "MM/DD/YYYY"));
                    strVar += '                </p></td>';
                    strVar += '            </tr>';
                }
            }
            else {
                strVar += '            <tr>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '                <td><p>';
                strVar += "-";
                strVar += '                 </p></td>';
                strVar += '            </tr>';
            }

            strVar += '        </table>';
            strVar += '    </div>';
            strVar += '    <!-- End HTML For Documents Print -->';
            strVar += '</body>';
            strVar += '</html>';
            strVar += "";
            return strVar;
        }

        function getValuationData(matterId) {
            var url = intakeConstants.RESTAPI.valuationData + matterId;
            return $http.get(url);
        }

        function getPrintIntakeData(matterId) {

            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: intakeConstants.RESTAPI.printIntakeData + matterId,
                method: "GET",
                headers: token,
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




//angular.forEach(dataList[0], function (value, key) {
//    html += "<th>" + key + "</th>";
//});
//html += "</tr>";
//angular.forEach(dataList, function (data) {
//    html += "<tr>";
//    angular.forEach(data, function (val, key) {
//        html += "<td>" + val + "</td>";
//    });
//    html += "</tr>";
//});