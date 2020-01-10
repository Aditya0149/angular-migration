(function () {
    'use strict';

    angular
        .module('cloudlex.report')
        .factory('reportFactory', reportService);

    reportService.$inject = ['$http', '$q', 'reportConstant', 'globalConstants','masterData'];

    function reportService($http, $q, reportConstant, globalConstants,masterData) {

        //TODO : move to utils
        function getParams(params) {
            var querystring = "";
            angular.forEach(params, function (value, key) {
                querystring += key + "=" + value;
                querystring += "&";
            });
            return querystring.slice(0, querystring.length - 1);
        }

        var reportFactory = {
            getMaster: getMaster,
            getMatter: getMatter,
            getMatterList: getMatterList,
            getMatterListCount: getMatterListCount,
            getAllMatters: getAllMatters,
            getMatterById: getMatterById,
            getImportantDates: getImportantDates,
            getUserAssignment: getUserAssignment,
            downloadMatters: downloadMatters,
            matterReportExport: matterReportExport,
            printMatters: printMatters,
            ExportReportxlsx: ExportReportxlsx,
            getMatterstats: getMatterstats,
            getMatterstatscount: getMatterstatscount,
            printSOLsMatter: printSOLsMatter,
            printEventMatters: printEventMatters,
            downLoadUpcomingSOLs: downLoadUpcomingSOLs,
            downLoadMatterEvents: downLoadMatterEvents,
            printNOCsMatter: printNOCsMatter,
            downLoadUpcomingNOCs: downLoadUpcomingNOCs,
            printMatterByInTookDate: printMatterByInTookDate,
            downLoadMatterByInTookDate: downLoadMatterByInTookDate,
            getMatterSubStatus: getMatterSubStatus,
            printMatterStatusAndSubStatus: printMatterStatusAndSubStatus,
            downLoadMatterStatusAndSubStatus: downLoadMatterStatusAndSubStatus,
            getMatterType: getMatterType,
            printMatterType: printMatterType,
            downLoadMatterType: downLoadMatterType,
            getUserInfo: getUserInfo,
            getStatusWiseCounts: getStatusWiseCounts,
            downloadmatterExpenses: downloadmatterExpenses,
            downloadMailinglist: downloadMailinglist,
            downloadMatterValuation: downloadMatterValuation,
            downloadMatterContact: downloadMatterContact,
            downloadMedicalRecordRequest: downloadMedicalRecordRequest,
            textSearch: textSearch,
            getTaskAgeData: getTaskAgeData,
            downloadTaskAge: downloadTaskAge,
            getTaskSummaryData: getTaskSummaryData,
            exportTaskSummary: exportTaskSummary,
            getFormattedData: getFormattedData,
            getMatterstatsForNewMatter: getMatterstatsForNewMatter

        };
        //US#12586
        function textSearch(obj) {
            var deferred = $q.defer();
            $http({
                url: reportConstant.RESTAPI.text_search,
                method: "POST",
                withCredentials: true,
                data: obj
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }


        function getStatusWiseCounts(flagVal) {
            var deferred = $q.defer();
            $http({
                url: reportConstant.RESTAPI.statusWiseCounts,
                method: "GET",
                params: {
                    flag: flagVal
                },
                withCredentials: true
            }).success(function (response) {
                deferred.resolve(response);
            });

            return deferred.promise;
        }

        function getUserInfo(data) {
            var deferred = $q.defer();
            $http({
                url: reportConstant.RESTAPI.getUserInfo,
                method: "GET",
                withCredentials: true
            }).success(function (response, status) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        };

        function getMaster(data) {
            var deferred = $q.defer();
            $http({
                url: reportConstant.RESTAPI.master,
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
        };

        function getMatterSubStatus(filter) {
            var url = reportConstant.RESTAPI.matter_substatus;
            url += '?' + getParams(filter);

            var deferred = $q.defer();
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

        function getMatterType(filter) {
            var url = reportConstant.RESTAPI.matterType;
            url += '?' + getParams(filter);

            var deferred = $q.defer();
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

        function getFormattedData(reqData, allMatter) {
            var obj = {};
            obj.complied = reqData.complied;
            obj.start = reqData.s;
            obj.end = reqData.e;
            obj.pageSize = reqData.pageSize;
            obj.pageNum = reqData.pageNum;
            if (reqData.eventFilter && utils.isNotEmptyVal(reqData.eventFilter)) {
                obj.eventType = reqData.eventFilter;
            }
            obj.myMatter = allMatter == 1 ? 0 : 1;
            return obj;
        }

        function getMatterstats(data, allMatter, reportType) {
            var requestFilters = getFormattedData(data, allMatter);
            if (data.matterid) {
                requestFilters.matterId = data.matterid.matterid;
            }
            if (reportType) {
                requestFilters.eventTypeId = reportType == 1 ? '1' : '6';
                //reportType == 6 ? delete requestFilters.complied : angular.noop();
                delete requestFilters.eventType;
            }
            var url = reportConstant.RESTAPI.matterstats;
            url += '?' + getParams(requestFilters) + '&tz=' + utils.getTimezone();;
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

        function getMatterstatscount(requestFilters, allMatter) {
            var url = reportConstant.RESTAPI.matterstatscount;
            url += '?' + getParams(requestFilters);
            return $http.get(url);
        }

        function getMatter(requestFilters) {
            var deferred = $q.defer();
            $http({
                url: reportConstant.RESTAPI.matter,
                method: "GET",
                params: requestFilters,
                withCredentials: true
            }).success(function (response) {
                deferred.resolve(response);
            });
            return deferred.promise;
        }

        function getMatterList(requestFilters, allMatter) {
            //var url = (allMatter == 1) ? reportConstant.RESTAPI.allMatters : reportConstant.RESTAPI.myMatters;
            var statusKey = requestFilters.statusFilter;
            delete requestFilters.statusFilter;
            var url = reportConstant.RESTAPI.matterReport;
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


        function getMatterListCount(requestFilters, allMatter) {
            var url = (allMatter == 1) ? reportConstant.RESTAPI.allMattersCount : reportConstant.RESTAPI.myMattersCount;
            url += '?' + getParams(requestFilters);
            return $http.get(url);
        }

        function getAllMatters(requestFilters, allMatter) {
            var url = (allMatter == 1) ? reportConstant.RESTAPI.allMatters : reportConstant.RESTAPI.myMatters;
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
            var url = reportConstant.RESTAPI.getMatterById + matterId;
            return $http({
                url: url,
                method: "GET",
                withCredentials: true
            });
        }

        function getImportantDates(matterId) {
            var url = reportConstant.RESTAPI.getImportantDates;
            url += matterId;
            var deferred = $q.defer();
            return $http({
                url: url,
                method: "GET",
                withCredentials: true
            });
        }

        function getUserAssignment(matterId) {
            var url = reportConstant.RESTAPI.getUserAssignment + matterId;
            return $http({
                url: url,
                method: "GET",
                withCredentials: true
            });
        }

        function getTaskAgeData(requestFilters) {
            var deferred = $q.defer();

            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: reportConstant.RESTAPI.taskAgeData + getParams(requestFilters),
                method: "GET",
                headers: token,
                data: requestFilters
            })
                .then(function (response) {
                    reportFactory.taskAgeList = response.data;
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }
        function downloadTaskAge(popUpFilters) {
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            var deferred = $q.defer();
            // var url = intakeReportConstant.RESTAPI.allIntakeList;
            $http({
                url: reportConstant.RESTAPI.downloadTaskAge + getParams(popUpFilters),
                method: "GET",
                headers: token,
                data: popUpFilters,
                responseType: 'arraybuffer',
            })
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }
        function getTaskSummaryData(requestFilters) {
            var deferred = $q.defer();

            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: reportConstant.RESTAPI.taskSummaryData + getParams(requestFilters),
                method: "GET",
                headers: token,
                data: requestFilters
            })
                .then(function (response) {
                    reportFactory.taskSummaryList = response.data;
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }
        function exportTaskSummary(popUpFilters) {
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            var deferred = $q.defer();
            // var url = intakeReportConstant.RESTAPI.allIntakeList;
            $http({
                url: reportConstant.RESTAPI.exportTaskSummary + getParams(popUpFilters),
                method: "GET",
                headers: token,
                data: popUpFilters,
                responseType: 'arraybuffer',
            })
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function downloadMatters(popUpFilters, pageFilters, allMatter) {
            popUpFilters["reportname"] = (allMatter == 1) ? "all_matters_list" : "matters_list";
            //popUpFilters["reportname"] = "all_matters_list";
            popUpFilters["filename"] = "Report_All_Matter_List.xlsx";
            popUpFilters["type"] = "excel";
            popUpFilters["user"] = "all-users";
            var url = reportConstant.RESTAPI.downloadMatterReport;
            url += '?' + getParams(popUpFilters) + '&tz=' + utils.getTimezone();
            var download = window.open(url, '_self');
        }

        function matterReportExport(popUpFilters) {
            var statusKey = popUpFilters.statusFilter;
            delete popUpFilters.statusFilter;
            popUpFilters.pageSize = 2000;
            var url = reportConstant.RESTAPI.allmyMatterReportExport;
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



        function getMatterstatsForNewMatter(requestFilters, allMatter) {
            if (requestFilters.matterid) {
                requestFilters.matterid = requestFilters.matterid.matterid;
            }
            //var url = (allMatter == 1) ? reportConstant.RESTAPI.allMatters : reportConstant.RESTAPI.myMatters;
            var url = reportConstant.RESTAPI.matterstatscount;
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
        function downLoadUpcomingSOLs(popUpFilters, pageFilters, reportType, allMatter) {
            var requestFilters = getFormattedData(popUpFilters, pageFilters);
            requestFilters.matterId = popUpFilters.matterid;
            requestFilters.myMatter = allMatter == 1 ? 0 : 1;
            if (reportType) {
                requestFilters.eventTypeId = reportType == 1 ? '1' : '6';
            } else {
                delete requestFilters.eventType;
            }
            requestFilters.pageSize = 1000;
            var url = reportConstant.RESTAPI.downloadMatter;
            url += '?' + getParams(requestFilters) + '&tz=' + utils.getTimezone();
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

        function downLoadMatterEvents(popUpFilters, pageFilters, allMatter) {
            var requestFilters = getFormattedData(popUpFilters, pageFilters);
            requestFilters.matterId = popUpFilters.matterid;
            requestFilters.pageSize = 1000;
            requestFilters.myMatter = allMatter == 1 ? 0 : 1;
            var url = reportConstant.RESTAPI.downloadMatter;
            url += '?' + getParams(requestFilters) + '&tz=' + utils.getTimezone();
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

        function downLoadUpcomingNOCs(popUpFilters, pageFilters, reportType, allMatter) {
            var requestFilters = getFormattedData(popUpFilters, pageFilters);
            requestFilters.matterId = popUpFilters.matterid;
            requestFilters.myMatter = allMatter == 1 ? 0 : 1;
            //delete requestFilters.complied;
            if (reportType) {
                requestFilters.eventTypeId = reportType == 1 ? '1' : '6';
            } else {
                delete requestFilters.eventType;
            }
            requestFilters.pageSize = 1000;
            var url = reportConstant.RESTAPI.downloadMatter;
            url += '?' + getParams(requestFilters) + '&tz=' + utils.getTimezone();
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

        // function downLoadMatterByInTookDate(popUpFilters, pageFilters) {
        //     popUpFilters["reportname"] = "matter_by_intakedate";
        //     popUpFilters["filename"] = "matter_opened_date.xlsx";
        //     popUpFilters["type"] = "excel";
        //     popUpFilters["user"] = "allusers";
        //     var url = reportConstant.RESTAPI.downloadMatterReport;
        //     url += '?' + getParams(popUpFilters) + '&tz=00:00';
        //     var download = window.open(url, '_self');
        // };

        function downLoadMatterByInTookDate(popUpFilters) {
            var url = reportConstant.RESTAPI.newMatterOpenbyDateReport + getParams(popUpFilters);
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

        function downLoadMatterStatusAndSubStatus(popUpFilters, pageFilters) {
            popUpFilters["reportname"] = "SubStatusReport";
            popUpFilters["filename"] = "SubStatusReport.xlsx";
            popUpFilters["type"] = "excel";
            popUpFilters["user"] = "all-users";
            var url = reportConstant.RESTAPI.downloadMatterReport;
            url += '?' + getParams(popUpFilters) + '&tz=' + utils.getTimezone();
            var download = window.open(url, '_self');
        };

        function downLoadMatterType(popUpFilters, pageFilters) {
            popUpFilters["reportname"] = "TypeReport";
            popUpFilters["filename"] = "TypeReport.xlsx";
            popUpFilters["type"] = "excel";
            popUpFilters["user"] = "all-users";
            var url = reportConstant.RESTAPI.downloadMatterReport;
            url += '?' + getParams(popUpFilters) + '&tz=' + utils.getTimezone();
            var download = window.open(url, '_self');
        };

        function downloadmatterExpenses(popUpFilters) {
            // popUpFilters["reportname"] = "Expense_Report";
            // popUpFilters["filename"] = "Report_Expense.xlsx";
            // popUpFilters["type"] = "excel";
            // popUpFilters["user"] = "all-users";
            var matterIds = (popUpFilters.matterid == undefined) ? '' : popUpFilters.matterid;
            // delete popUpFilters.matterid;
            // var url = reportConstant.RESTAPI.downloadMatterReport;
            // url += '?' + getParams(popUpFilters) + '&matterIds=' + matterIds + '&tz=' + utils.getTimezone();
            // var download = window.open(url, '_self');
            popUpFilters["pageNum"] = 1;
            popUpFilters["pageSize"] = 1000;
            var tz = utils.getTimezone();
            var timeZone = moment.tz.guess();
            var url = reportConstant.RESTAPI.exportexpensesreport;
            url += '?' + getParams(popUpFilters) + '&matterIds=' + matterIds + '&tz=' + timeZone;
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
        }

        function downloadMailinglist(popUpFilters) {
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            var deferred = $q.defer();
            // var url = intakeReportConstant.RESTAPI.allIntakeList;
            $http({
                url: reportConstant.RESTAPI.plaintiffReport + getParams(popUpFilters),
                method: "GET",
                headers: token,
                data: popUpFilters,
                responseType: 'arraybuffer',
            })
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function downloadMatterValuation(popUpFilters, pageFilters) {
            var url = reportConstant.RESTAPI.downloadMatterValuationReport;
            url += getParams(popUpFilters);
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
        }

        //Export Matter contact relationship
        function downloadMatterContact(Filters) {
            var url = reportConstant.RESTAPI.downloadMatterContact_offDrupal;
            url += utils.getContactReportParams(Filters);
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
        }

        //download MedicalRecordRequest report
        function downloadMedicalRecordRequest(popUpFilters, pageFilters) {
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            var deferred = $q.defer();
            var url = reportConstant.RESTAPI.exportMedicalRecordRequest;
            url += '?' + getParams(popUpFilters) + '&tz=' + utils.getTimezone();
            // var url = intakeReportConstant.RESTAPI.allIntakeList;
            $http({
                url: url,
                method: "GET",
                headers: token,
                data: popUpFilters,
                responseType: 'arraybuffer',
            })
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function printMatterType(response, filter) {
            var output = getMatterTypeDataListTable(response, filter);
            window.open().document.write(output);
        };

        function getMatterTypeDataListTable(response, filter) {
            var html = "<html><title>Matter type & sub-type summary</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size:10pt;'><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right; margin-right:3%'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Matter type & sub-type summary</h1><div></div>";
            if (filter.includeArchived == 1) {
                html += "<div style='margin-top:10px!important;margin-bottom: 10px;'>Include Archived Matters: Yes</div>"
            }
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "<div>";
            html += "<div style='display:flex; flex-wrap:wrap'>";
            angular.forEach(response, function (statusData) {
                html += "<div  style='border: 1px solid lightgrey; margin: 10px 10px 10px 0; padding-top:10px; width: 48%; float: left;'>";
                html += "<span style='margin-left: 20px; font-weight:bold; font-size:11pt'>" + utils.removeunwantedHTML(statusData.matter_type_name) + "</span>";
                html += "<span style='margin-left: 5px; font-weight:bold; font-size:11pt'>" + utils.removeunwantedHTML(statusData.count) + "</span>";
                angular.forEach(statusData.subType, function (subStatusData) {
                    html += "<ul>";
                    html += "<li>";
                    html += "<span style='margin-left: 20px;'>" + utils.removeunwantedHTML(subStatusData.matter_sub_type_name) + "</span>";
                    html += "<span style='text-align: right;margin-left: 5px;'>" + utils.removeunwantedHTML(subStatusData.count) + "</span>";
                    html += "</li>";
                    html += "</ul>";
                })
                html += "</div>";
            })
            html += "</div>";
            html += "</div>";
            html += "</body>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</html>";
            return html;
        }

        function printMatterStatusAndSubStatus(response, filter) {
            var output = getMatterStatusDataListTable(response, filter);
            window.open().document.write(output);
        };

        function getMatterStatusDataListTable(response, filter) {
            var html = "<html><title>Matter status summary</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size:10pt;'><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right; margin-right:3%'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Matter status summary</h1><div></div>";
            if (filter.includeArchived == 1) {
                html += "<div style='margin-top:10px!important;margin-bottom: 10px;'>Include Archived Matters: Yes</div>"
            }

            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "<div>";
            html += "<div style='display:flex; flex-wrap:wrap'>";
            angular.forEach(response, function (statusData) {
                html += "<div style='border: 1px solid lightgrey; margin: 10px 10px 10px 0; padding-top:10px; width: 48%; float: left;'>";
                html += "<span style='margin-left: 20px; font-weight:bold; font-size:11pt'>" + utils.removeunwantedHTML(statusData.status) + "</span>";
                html += "<span style='margin-left: 5px; font-weight:bold; font-size:11pt'>" + utils.removeunwantedHTML(statusData.count) + "</span>";
                angular.forEach(statusData.subStatus, function (subStatusData) {
                    html += "<ul>";
                    html += "<li>";
                    html += "<span style='margin-left: 20px;'>" + utils.removeunwantedHTML(subStatusData.sub_status_name) + "</span>";
                    html += "<span style='text-align: right;margin-left: 5px;'>" + utils.removeunwantedHTML(subStatusData.count) + "</span>";
                    html += "</li>";
                    html += "</ul>";
                })
                html += "</div>";
            })
            html += "</div>";
            html += "</div>";
            html += "</body>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</html>";
            return html;
        }

        /*function printSOLsMatter(dataList, filters) {
            var output = getSOLsDataListTable(dataList, filters);
            window.open().document.write(output);
        };*/
        function printSOLsMatter(dataList, printObjFilter) {
            var output = getSOLsDataListTable(dataList, printObjFilter);
            window.open().document.write(output);
        };

        function printEventMatters(dataList, printObjFilter) {
            var output = getMatterEventsListTable(dataList, printObjFilter);
            window.open().document.write(output);
        };

        function getMatterEventsListTable(dataList, printObjFilter) {
            var title = [{
                name: 'start',
                desc: 'Event Date'
            }, {
                name: 'dateofincidenceutc',
                desc: 'Date of Incident'
            },
            {
                name: 'time',
                desc: 'Event Time'
            },
            {
                name: 'matter_name',
                desc: 'Matter Name'
            }, {
                name: 'file_number',
                desc: 'File#'
            }, {
                name: 'index_number',
                desc: 'Index/Docket#'
            }, {
                name: 'eventtype',
                desc: 'Event Type'
            }, {
                name: 'checkEventTitle',
                desc: 'Event Title'
            },
            {
                name: 'location',
                desc: 'Event Location'
            },
            {
                name: 'assigned_to',
                desc: 'Assigned to'
            },
            {
                name: 'mattercourt',
                desc: 'Court'
            }, {
                name: 'venue_name',
                desc: 'Venue'
            }, {
                name: "complied",
                desc: 'Complied'
            }
            ];
            _.forEach(dataList, function (info) {
                var eventTypeList = _.filter(masterData.getMasterData().event_types, function (item) {
                    if (item.labelId == info.label_id) {
                        return item.name;
                    }
                });
                if (info.label_id == 19 || info.label_id == 100 || info.label_id == 32) {
                    info.checkEventTitle = info.title ? info.title : eventTypeList[0].Name;
                } else {
                    info.checkEventTitle = "-";
                }
            });
            var html = "<html><title>Events Report </title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Events Report</h1><div></div>";
            html += "<body>";
            html += "<div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<tr>";
            angular.forEach(printObjFilter, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'>";
                html += "<label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px; '>  " + val + '</span>';
                html += "</div>";


            });
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            angular.forEach(title, function (value, key) {
                if (value.name == 'nocdateutc') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'dateofincidenceutc') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'file_number') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'index_number') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + value.desc + "</th>";
                }
            });
            html += "</tr>";




            //   angular.forEach(filters, function(val, key) {
            //     html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;' class='labelTxt'><label><strong>" + val.name + " : </strong></label>";
            //     if (val.data instanceof Array) {
            //         _.forEach(val.data, function(item, index) {
            //             html += "<span style='padding:5px; '>  " + item;
            //             if (index + 1 < val.data.length) {
            //                 html += " , "
            //             }
            //             html += "</span>";
            //         });
            //     } else {
            //         html += "<span style='padding:5px; '>  " + val.data + '</span>';
            //     }
            //     html += "</div>";
            // });

            angular.forEach(dataList, function (data) {
                html += "<tr>";
                angular.forEach(title, function (titlevalue, titlekey) {
                    var val = (_.isNull(data[titlevalue.name])) ? '' : utils.removeunwantedHTML(data[titlevalue.name]);

                    if (titlevalue.name == 'nocdateutc') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'dateofincidenceutc') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'file_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'index_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>"
                    } else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + val + "</td>";
                    }



                });
                html += "</tr>";
            });
            html += "</body>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</table>";
            html += "</html>";
            return html;
        }

        function printSOLsMatter(dataList, printObjFilter) {
            var output = getSOLsDataListTable(dataList, printObjFilter);
            window.open().document.write(output);
        };
        //function getSOLsDataListTable(dataList, filters) {
        function getSOLsDataListTable(dataList, printObjFilter) {
            var title = [{
                name: 'start',
                desc: 'SOL Date'
            }, {
                name: 'dateofincidenceutc',
                desc: 'Date of Incident'
            }, {
                name: 'matter_name',
                desc: 'Matter Name'
            }, {
                name: 'file_number',
                desc: 'File#'
            }, {
                name: 'index_number',
                desc: 'Index/Docket#'
            }, {
                name: 'matter_type_name',
                desc: 'Type'
            }, {
                name: 'matter_sub_type_name',
                desc: 'Sub Type'
            }, {
                name: 'category_name',
                desc: 'Category'
            }, {
                name: 'status_name',
                desc: 'Status'
            }, {
                name: 'sub_status_name',
                desc: 'Sub Status'
            }, {
                name: 'mattercourt',
                desc: 'Court'
            }, {
                name: 'venue_name',
                desc: 'Venue'
            }, {
                name: "complied",
                desc: 'Complied'
            }];

            var html = "<html><title>Upcoming SOLs</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Upcoming SOLs</h1><div></div>";
            html += "<body>";
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<tr>";
            angular.forEach(printObjFilter, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'>";
                html += "<label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px; '>  " + val + '</span>';
                html += "</div>";


            });
            angular.forEach(title, function (value, key) {
                if (value.name == 'start') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'dateofincidenceutc') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'file_number') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'index_number') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + value.desc + "</th>";
                }
            });
            html += "</tr>";

            angular.forEach(dataList, function (data) {
                html += "<tr>";
                angular.forEach(title, function (titlevalue, titlekey) {
                    var val = (_.isNull(data[titlevalue.name])) ? '' : utils.removeunwantedHTML(data[titlevalue.name]);

                    if (titlevalue.name == 'start') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'dateofincidenceutc') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'file_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'index_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + val + "</td>";
                    }



                });
                html += "</tr>";
            });
            html += "</body>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</table>";
            html += "</html>";
            return html;
        }

        function printNOCsMatter(dataList, printObjFilter) {
            var output = getNOCsDataListTable(dataList, printObjFilter);
            window.open().document.write(output);
        }

        function getNOCsDataListTable(dataList, printObjFilter) {
            var title = [{
                name: 'start',
                desc: 'NOC Date'
            }, {
                name: 'dateofincidenceutc',
                desc: 'Date of Incident'
            }, {
                name: 'matter_name',
                desc: 'Matter Name'
            }, {
                name: 'file_number',
                desc: 'File#'
            }, {
                name: 'index_number',
                desc: 'Index/Docket#'
            }, {
                name: 'matter_type_name',
                desc: 'Type'
            }, {
                name: 'matter_sub_type_name',
                desc: 'Sub Type'
            }, {
                name: 'category_name',
                desc: 'Category'
            }, {
                name: 'status_name',
                desc: 'Status'
            }, {
                name: 'sub_status_name',
                desc: 'Sub Status'
            }, {
                name: 'mattercourt',
                desc: 'Court'
            }, {
                name: 'venue_name',
                desc: 'Venue'
            }, {
                name: 'complied',
                desc: 'Complied'
            }];

            var html = "<html><title>Upcoming NOCs</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Upcoming NOCs</h1><div></div>";
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<tr>";
            angular.forEach(title, function (value, key) {
                if (value.name == 'start') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'dateofincidenceutc') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'file_number') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'index_number') {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color: #E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + value.desc + "</th>";
                }
            });
            html += "</tr>";

            angular.forEach(printObjFilter, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'>";
                html += "<label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px; '>  " + val + '</span>';
                html += "</div>";


            });
            angular.forEach(dataList, function (data, value) {
                html += "<tr>";
                angular.forEach(title, function (titlevalue, titlekey) {
                    var val = (_.isNull(data[titlevalue.name])) ? '' : utils.removeunwantedHTML(data[titlevalue.name]);


                    if (titlevalue.name == 'start') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'dateofincidenceutc') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'file_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'index_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + val + "</td>";
                    }




                });
                html += "</tr>";
            });
            html += "</body>";
            html += "</table>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</html>";
            return html;
        }

        function printMatterByInTookDate(dataList, filters) {
            var output = getMatterInTooKDataListTable(dataList, filters);
            window.open().document.write(output);
        }

        function getMatterInTooKDataListTable(dataList, filters) {

            var title = [{
                name: 'intake_date',
                desc: 'Intake Date'
            }, {
                name: 'date_of_incidence',
                desc: 'Date of Incident'
            }, {
                name: 'matter_name',
                desc: 'Matter Name'
            }, {
                name: 'file_number',
                desc: 'File#'
            }, {
                name: 'index_number',
                desc: 'Index/Docket#'
            }, {
                name: 'type',
                desc: 'Type'
            }, {
                name: 'sub_type',
                desc: 'Sub Type'
            }, {
                name: 'category',
                desc: 'Category'
            }, {
                name: 'status',
                desc: 'Status'
            }, {
                name: 'sub_status',
                desc: 'Sub Status'
            }, {
                name: 'courtName',
                desc: 'Court'
            }, {
                name: 'courtVenue',
                desc: 'Venue'
            }];
            var html = "<html><title>New Matters Opened by date</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            //html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>.my-table { page-break-before: always; page-break-after: always; } .my-table tr { page-break-inside: avoid; } table tr { page-break-inside: always; } table td {} </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>New Matters Opened by date</h1><div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";

            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0'>";
            html += "<tr>";

            angular.forEach(filters, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;' class='labelTxt'><label><strong>" + val.name + " : </strong></label>";
                if (val.data instanceof Array) {
                    _.forEach(val.data, function (item, index) {
                        html += "<span style='padding:5px; '>  " + item;
                        if (index + 1 < val.data.length) {
                            html += " , "
                        }
                        html += "</span>";
                    });
                } else {
                    html += "<span style='padding:5px; '>  " + val.data + '</span>';
                }
                html += "</div>";
            });
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            angular.forEach(title, function (value, key) {
                if (value.name == 'intake_date_utc') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px;text-align:right '>" + value.desc + "</th>";
                } else if (value.name == 'dateofincidence') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px;text-align:right '>" + value.desc + "</th>";
                } else if (value.name == 'file_number') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px;text-align:right '>" + value.desc + "</th>";
                } else if (value.name == 'index_number') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right '>" + value.desc + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + value.desc + "</th>";
                }
            });
            html += "</tr>";
            angular.forEach(dataList, function (data) {
                html += "<tr>";
                angular.forEach(title, function (titlevalue, titlekey) {
                    var val = (_.isNull(data[titlevalue.name])) ? '' : utils.removeunwantedHTML(data[titlevalue.name]);
                    if (angular.isDefined(val)) {
                        if (titlevalue.name == 'intake_date_utc') {
                            //html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                            if (val == 0 || val == '' || val == 'undefined') {
                                html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + ' - ' + "</td>";
                            } else {
                                html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                            }
                        } else if (titlevalue.name == 'dateofincidence') {
                            if (val == 0 || val == '') {
                                html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + '' + "</td>";
                            } else {
                                html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                            }
                        } else if (titlevalue.name == 'file_number') {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                        } else if (titlevalue.name == 'index_number') {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                        } else {
                            if (angular.isDefined(val)) {
                                html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + val + "</td>";
                            } else {
                                html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + ' - ' + "</td>";
                            }

                        }

                    }
                });
                html += "</tr>";
            });
            html += "</body>";
            html += "</table>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</html>";
            return html;
        }

        function printMatters(dataList, filters) {
            var output = getDataListTable(dataList, filters);
            window.open().document.write(output);
        }

        function ExportReportxlsx(Url) {
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            var deferred = $q.defer();
            var url = Url;

            $http({
                url: url,
                method: "GET",
                headers: token,
                responseType: 'arraybuffer',
            })
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        function getDataListTable(dataList, filters) {
            var title = [{
                name: 'matter_name',
                desc: 'Matter Name'
            }, {
                name: 'file_number',
                desc: 'File#'
            }, {
                name: 'index_number',
                desc: 'Index/Docket#'
            }, {
                name: 'date_of_incidence',
                desc: 'Date of Incident'
            }, {
                name: 'intake_date',
                desc: 'Intake Date'
            }, {
                name: 'matter_created_date',
                desc: 'Date Created'
            }, {
                name: 'closed_date',
                desc: 'Date Closed'
            }, {
                name: 'settled_date',
                desc: 'Date Settled'
            }, {
                name: 'type',
                desc: 'Type'
            }, {
                name: 'sub_type',
                desc: 'Sub Type'
            }, {
                name: 'law_type_name',
                desc: 'Law Type'
            }, {
                name: 'category',
                desc: 'Category'
            }, {
                name: 'status',
                desc: 'Status'
            },
            {
                name: 'plaintiff_name', //plaintiff column added
                desc: 'Plaintiff Name'
            },
            {
                name: 'sub_status',
                desc: 'Sub Status'
            }, {
                name: 'courtName',
                desc: 'Court'
            }, {
                name: 'courtVenue',
                desc: 'Venue'
            }, {
                name: 'matter_lead_attorney',
                desc: 'Lead Attorney'
            }, {
                name: 'matter_attorney',
                desc: 'Attorney'
            }, {
                name: 'matter_staffs',
                desc: 'Assigned Staff'
            }, {
                name: 'matter_paralegals',
                desc: 'Assigned Paralegal'
            },
            {
                name: 'referred_to',
                desc: 'Referred To'
            },
            {
                name: 'referred_by',
                desc: 'Referred By'
            }
            ];

            var html = "<html><title>All Matters Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; } table td{} </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>All Matters Report</h1><div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";




            /*angular.forEach(filters, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;' class='labelTxt'><label><strong>" + val.name + "  :</strong></label>";
                _.forEach(val.data, function (item, index) {
                    html += "<span style='padding:5px; '>  " + item;
                    if (index + 1 < val.data.length) {
                        html += " , "
                    }
                    html += "</span>";
                });
                html += "</div>";
            });*/

            angular.forEach(filters, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;' class='labelTxt'><label><strong>" + val.name + " : </strong></label>";
                if (val.data instanceof Array) {
                    _.forEach(val.data, function (item, index) {
                        html += "<span style='padding:2px; '>  " + item;
                        if (index + 1 < val.data.length) {
                            html += " ,"
                        }
                        html += "</span>";
                    });
                } else {
                    html += "<span style='padding:5px; '>  " + val.data + '</span>';
                }
                html += "</div>";
            });

            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<thead style='display: table-header-group;'><tr>";
            angular.forEach(title, function (value, key) {
                if (value.name == 'date_of_incidence') {
                    html += "<th width='5%' style='border:1px solid #e2e2e2; background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; width:50px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'intake_date') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'matter_created_date') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:left'>" + value.desc + "</th>";
                } else if (value.name == 'file_number') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'index_number') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'matter_name') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + value.desc + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + value.desc + "</th>";
                }
            });
            html += "</tr></thead><tbody>";
            angular.forEach(dataList, function (data) {
                html += "<tr>";

                angular.forEach(title, function (titlevalue, titlekey) {
                    var val = (_.isNull(data[titlevalue.name])) ? '' : utils.removeunwantedHTML(data[titlevalue.name]);
                    if (titlevalue.name == 'date_of_incidence') {
                        if (val == 0 && val == '') {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + "-" + "</td>";
                        } else {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + moment.unix(val).utc().format('DD MMM YYYY') + "</td>";
                        }
                    } else if (titlevalue.name == 'intake_date') {
                        if (val == 0 && val == '') {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + "-" + "</td>";
                        } else {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + moment.unix(val).utc().format('MM/DD/YYYY') + "</td>";
                        }
                        //using in temperory till the time didn't get intake date from backend.
                        //val = '';
                        // html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + moment.unix(val).utc().format('MM/DD/YYYY') + "</td>";
                    } else if (titlevalue.name == 'file_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'index_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + val + "</td>";
                    }
                });
                html += "</tr>";
            });

            html += "</tbody></table>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</body>";
            html += "</html>";
            return html;
        }


        return reportFactory;
    }
})();