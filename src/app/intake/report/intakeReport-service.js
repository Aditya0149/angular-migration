(function () {
    'use strict';

    angular
        .module('intake.report')
        .factory('intakeReportFactory', intakeReportFactory);

    intakeReportFactory.$inject = ['$http', '$q', 'intakeReportConstant', 'globalConstants'];

    function intakeReportFactory($http, $q, intakeReportConstant, globalConstants) {

        //TODO : move to utils
        function getParams(params) {
            var querystring = "";
            angular.forEach(params, function (value, key) {
                querystring += key + "=" + value;
                querystring += "&";
            });
            return querystring.slice(0, querystring.length - 1);
        }

        var intakeReportFactory = {
            getIntakeReportList: getIntakeReportList,
            getMatterstats: getMatterstats,
            getMasterDataList: getMasterDataList,
            getContactsByName: getContactsByName,
            printSOLsIntake: printSOLsIntake,
            downLoadUpcomingSOLs: downLoadUpcomingSOLs,
            downloadMatters: downloadMatters,
            printMatters: printMatters,
            printNOCsIntake: printNOCsIntake,
            printIntakeCampaign: printIntakeCampaign,
            getIntakeVaulationReportList: getIntakeVaulationReportList,
            printIntakeValuation: printIntakeValuation,
            getTaskSummaryData: getTaskSummaryData,
            exportTaskSummary: exportTaskSummary,
            getMatterList: getMatterList
        };

        intakeReportFactory.intakeList = [];


        function getMasterDataList() {
            return getCall(intakeReportConstant.RESTAPI.getMasterDataFromJAVA);
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

        function getContactsByName(name) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: intakeReportConstant.RESTAPI.javacourtContactsMatt,
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

        //get upcoming SOL data
        function getMatterstats(requestFilters, allMatter) {
            // if (requestFilters.intakeid) {
            //     requestFilters.intakeid = requestFilters.intakeid.intakeid;
            // }

            var url = intakeReportConstant.RESTAPI.intakeSOL;
            url += '?' + getParams(requestFilters);
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                // withCredentials: true
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (response) {
                deferred.reject(response.data);
            });
            return deferred.promise;
        }

        function getIntakeReportList(requestFilters) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: intakeReportConstant.RESTAPI.allIntakeReport,
                method: "POST",
                headers: token,
                data: requestFilters
            })
                .then(function (response) {
                    intakeReportFactory.intakeList = response.data;
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function getIntakeVaulationReportList(requestFilters) {
            var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: intakeReportConstant.RESTAPI.allIntakeReport,
                method: "POST",
                headers: token,
                data: requestFilters
            })
                .then(function (response) {
                    intakeReportFactory.intakeList = response.data;
                    deferred.resolve(response.data);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }
        function getImportantDates(intakeId) {
            var url = intakeReportConstant.RESTAPI.getImportantDates;
            url += intakeId;
            var deferred = $q.defer();
            return $http({
                url: url,
                method: "GET",
                withCredentials: true
            });
        }



        function downLoadUpcomingSOLs(popUpFilters, pageFilters) {
            // var token = {
            //     'Authorization': "Bearer " + localStorage.getItem('accessToken'),
            //     'Content-type': 'application/json'
            // }
            var deferred = $q.defer();
            var url = intakeReportConstant.RESTAPI.downloadIntake;
            url += '?' + getParams(popUpFilters);
            $http({
                url: url,
                method: "GET",
                // headers: token,
                responseType: 'arraybuffer',
            })
                .then(function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        function downloadMatters(popUpFilters) {
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            var deferred = $q.defer();

            $http({
                url: intakeReportConstant.RESTAPI.allIntakeList,
                method: "POST",
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
                url: intakeReportConstant.RESTAPI.taskSummaryData + getParams(requestFilters),
                method: "GET",
                headers: token,
                data: requestFilters
            })
                .then(function (response) {
                    intakeReportFactory.taskSummaryList = response;
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
            $http({
                url: intakeReportConstant.RESTAPI.taskSummaryExport + getParams(popUpFilters),
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

        function getMatterList(intakeName, migrate) {
            var dataObj = {
                "page_number": 1,
                "page_size": 1000,
                "name": intakeName,
                "is_migrated": migrate
            };
            // var deferred = $q.defer();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: intakeReportConstant.RESTAPI.getIntakeList,
                method: "POST",
                headers: token,
                data: dataObj
            })
                .then(function (response) {
                    if (response.data.intakeData) {
                        _.forEach(response.data.intakeData, function (item, index) {
                            item.createdDate = moment.unix(item.createdDate).utc().format('MM/DD/YYYY');
                            item.dateIntake = item.dateOfIntake ? " - " + moment.unix(item.dateOfIntake).utc().format('MM/DD/YYYY') : "";
                        });
                        return response.data.intakeData;
                    } else {
                        return [];
                    }
                }, function (error) {
                    return [];
                });
        }

        function getMatterTypeDataListTable(response) {
            var html = "<html><title>Matter type & sub-type summary</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size:10pt;'><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right; margin-right:3%'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Matter type & sub-type summary</h1><div></div>";
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "<div>";
            html += "<div style='display:flex; flex-wrap:wrap'>";
            angular.forEach(response, function (statusData) {
                html += "<div  style='border: 1px solid lightgrey; margin: 10px 10px 10px 0; padding-top:10px; width: 48%; float: left;'>";
                html += "<span style='margin-left: 20px; font-weight:bold; font-size:11pt'>" + statusData.matter_type_name + "</span>";
                html += "<span style='margin-left: 5px; font-weight:bold; font-size:11pt'>" + statusData.count + "</span>";
                angular.forEach(statusData.subType, function (subStatusData) {
                    html += "<ul>";
                    html += "<li>";
                    html += "<span style='margin-left: 20px;'>" + subStatusData.matter_sub_type_name + "</span>";
                    html += "<span style='text-align: right;margin-left: 5px;'>" + subStatusData.count + "</span>";
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

        function printMatterStatusAndSubStatus(response) {
            var output = getMatterStatusDataListTable(response);
            window.open().document.write(output);
        };

        function getMatterStatusDataListTable(response) {
            var html = "<html><title>Matter status summary</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size:10pt;'><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right; margin-right:3%'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Matter status summary</h1><div></div>";
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "<div>";
            html += "<div style='display:flex; flex-wrap:wrap'>";
            angular.forEach(response, function (statusData) {
                html += "<div style='border: 1px solid lightgrey; margin: 10px 10px 10px 0; padding-top:10px; width: 48%; float: left;'>";
                html += "<span style='margin-left: 20px; font-weight:bold; font-size:11pt'>" + statusData.status + "</span>";
                html += "<span style='margin-left: 5px; font-weight:bold; font-size:11pt'>" + statusData.count + "</span>";
                angular.forEach(statusData.subStatus, function (subStatusData) {
                    html += "<ul>";
                    html += "<li>";
                    html += "<span style='margin-left: 20px;'>" + subStatusData.sub_status_name + "</span>";
                    html += "<span style='text-align: right;margin-left: 5px;'>" + subStatusData.count + "</span>";
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


        function printSOLsIntake(dataList, printObjFilter) {
            var output = getSOLsDataListTable(dataList, printObjFilter);
            window.open().document.write(output);
        };
        function printNOCsIntake(dataList, printObjFilter) {
            var output = getNOCsDataListTable(dataList, printObjFilter);
            window.open().document.write(output);
        };

        //function getSOLsDataListTable(dataList, filters) {
        function getSOLsDataListTable(dataList, printObjFilter) {
            var title = [
                {
                    name: 'SOLDate',
                    desc: 'SOL Date'
                },
                {
                    name: 'dateOfIncident',
                    desc: 'Date of Incident'
                }, {
                    name: 'intakeName',
                    desc: 'Lead name'
                }, {
                    name: 'intakeTypeName',
                    desc: 'Type'
                }, {
                    name: 'intakeSubTypeName',
                    desc: 'Sub Type'
                }, {
                    name: 'intakeCategoryName',
                    desc: 'Category'
                }, {
                    name: 'intakeStatusName',
                    desc: 'Status'
                }, {
                    name: 'intakeSubStatusName',
                    desc: 'Sub Status'
                }, {
                    name: "compliedValue",
                    desc: 'Complied/Held'
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
            html += "<div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";
            html += "<tr>";
            angular.forEach(printObjFilter, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'>";
                html += "<label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px; '>  " + val + '</span>';
                html += "</div>";


            });
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

            angular.forEach(dataList, function (data) {
                html += "<tr>";
                angular.forEach(title, function (titlevalue, titlekey) {
                    var val = (_.isNull(data[titlevalue.name])) ? '' : data[titlevalue.name];

                    if (titlevalue.name == 'nocdateutc') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'dateofincidenceutc') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'file_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'index_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(val) + "</td>";
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

        function getNOCsDataListTable(dataList, printObjFilter) {
            var title = [
                {
                    name: 'SOLDate',
                    desc: 'NOC Date'
                },
                {
                    name: 'dateOfIncident',
                    desc: 'Date of Incident'
                }, {
                    name: 'intakeName',
                    desc: 'Lead name'
                }, {
                    name: 'intakeTypeName',
                    desc: 'Type'
                }, {
                    name: 'intakeSubTypeName',
                    desc: 'Sub Type'
                }, {
                    name: 'intakeCategoryName',
                    desc: 'Category'
                }, {
                    name: 'intakeStatusName',
                    desc: 'Status'
                }, {
                    name: 'intakeSubStatusName',
                    desc: 'Sub Status'
                }, {
                    name: "compliedValue",
                    desc: 'Complied/Held'
                }];

            var html = "<html><title>Upcoming NOCs</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Upcoming NOCs</h1><div></div>";
            html += "<body>";
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";
            html += "<tr>";
            angular.forEach(printObjFilter, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;'>";
                html += "<label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px; '>  " + val + '</span>';
                html += "</div>";


            });
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

            angular.forEach(dataList, function (data) {
                html += "<tr>";
                angular.forEach(title, function (titlevalue, titlekey) {
                    var val = (_.isNull(data[titlevalue.name])) ? '' : data[titlevalue.name];

                    if (titlevalue.name == 'nocdateutc') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'dateofincidenceutc') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'file_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else if (titlevalue.name == 'index_number') {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + val + "</td>";
                    } else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(val) + "</td>";
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

        function printMatterByInTookDate(dataList, filters) {
            var output = getMatterInTooKDataListTable(dataList, filters);
            window.open().document.write(output);
        }

        function getMatterInTooKDataListTable(dataList, filters) {

            var title = [{
                name: 'intake_date_utc',
                desc: 'Intake Date'
            }, {
                name: 'dateofincidence',
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
            }];
            var html = "<html><title>New Matters Opened by date</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
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
                    var val = (_.isNull(data[titlevalue.name])) ? '' : data[titlevalue.name];
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

        function getDataListTable(dataList, filters) {
            delete filters.substatus;
            var title = [{
                name: 'intakeName',
                desc: 'Lead Name'
            }, {
                name: 'accidentDate',
                desc: 'Date of Incident'
            }, {
                name: 'createdDate_formatted',
                desc: 'Date Created'
            }, {
                name: 'intakeTypeName',
                desc: 'Type'
            }, {
                name: 'intakeSubTypeName',
                desc: 'Sub Type'
            }, {
                name: 'intakeCategoryName',
                desc: 'Category'
            }, {
                name: 'intakeStatusName',
                desc: 'Status'
            }, {
                name: 'intakeSubStatusName',
                desc: 'Sub Status'
            }, {
                name: 'campaign',
                desc: 'Campaign'
            }, {
                name: 'assignedUserNames',
                desc: 'Assign To'
            }, {
                name: 'referredToName',
                desc: 'Referred To'
            }, {
                name: 'referredByName',
                desc: 'Referred By'
            },
            ];

            var html = "<html><title>All Intake List</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; } table td{} </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>All Intake List</h1><div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";




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
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<thead style='display: table-header-group;'><tr>";
            angular.forEach(title, function (value, key) {
                if (value.name == 'accidentDate') {
                    html += "<th width='5%' style='border:1px solid #e2e2e2; background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; width:50px; text-align:left'>" + value.desc + "</th>";
                } else if (value.name == 'created_date') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'intakeName') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + value.desc + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + value.desc + "</th>";
                }
            });
            html += "</tr></thead><tbody>";
            angular.forEach(dataList, function (data) {
                html += "<tr>";
                angular.forEach(title, function (titlevalue, titlekey) {
                    var val = (_.isNull(data[titlevalue.name])) ? '' : data[titlevalue.name];
                    if (titlevalue.name == 'accidentDate') {
                        if (val == 0 && val == '') {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; padding:5px'>" + '-' + "</td>";
                        } else {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse;  padding:5px'>" + moment.unix(val).utc().format('DD MMM YYYY') + "</td>";
                        }
                    }
                    else if (titlevalue.name == 'createdDate') {
                        if (val == 0 && val == '') {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + '-' + "</td>";
                        } else {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + moment.unix(val).utc().format('DD MMM YYYY') + "</td>";
                        }
                    } else if (titlevalue.name == 'referredTo') {
                        var f_name = val.firstName ? val.firstName : '';
                        var l_name = val.lastName ? val.lastName : '';
                        var full_name = f_name + '' + l_name;
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + full_name + "</td>";
                    }
                    else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(val) + "</td>";
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


        function printIntakeValuation(dataList, filters) {
            var output = getintakeValDataListTable(dataList, filters);
            window.open().document.write(output);
        }

        function getintakeValDataListTable(dataList, filters) {
            delete filters.substatus;
            var title = [{
                name: 'intakeName',
                desc: 'Lead Name'
            }, {
                name: 'accidentDate',
                desc: 'Date of Incident'
            }, {
                name: 'createdDate_formatted',
                desc: 'Date Created'
            }, {
                name: 'intakeTypeName',
                desc: 'Type'
            }, {
                name: 'intakeSubTypeName',
                desc: 'Sub Type'
            }, {
                name: 'intakeCategoryName',
                desc: 'Category'
            }, {
                name: 'intakeStatusName',
                desc: 'Status'
            }, {
                name: 'intakeSubStatusName',
                desc: 'Sub Status'
            }, {
                name: 'campaign',
                desc: 'Campaign'
            }, {
                name: 'assignedUserNames',
                desc: 'Assign To'
            }, {
                name: 'referredToName',
                desc: 'Referred To'
            }, {
                name: 'referredByName',
                desc: 'Referred By'
            }, {
                name: 'intakeAmount',
                desc: 'Estimated Case Value'
            },
            ];

            var html = "<html><title>Intake Valuation Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; } table td{} </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Intake Valuation Report</h1><div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";




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
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<thead style='display: table-header-group;'><tr>";
            angular.forEach(title, function (value, key) {
                if (value.name == 'accidentDate') {
                    html += "<th width='5%' style='border:1px solid #e2e2e2; background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; width:50px; text-align:left'>" + value.desc + "</th>";
                } else if (value.name == 'created_date') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'intakeName') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + value.desc + "</th>";
                } else if (value.name == 'intakeAmount') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";

                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + value.desc + "</th>";
                }
            });
            html += "</tr></thead><tbody>";
            angular.forEach(dataList, function (data) {
                html += "<tr>";
                angular.forEach(title, function (titlevalue, titlekey) {
                    var val = (_.isNull(data[titlevalue.name])) ? '' : data[titlevalue.name];
                    if (titlevalue.name == 'accidentDate') {
                        if (val == 0 && val == '') {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; padding:5px'>" + '-' + "</td>";
                        } else {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse;  padding:5px'>" + moment.unix(val).utc().format('DD MMM YYYY') + "</td>";
                        }
                    }
                    else if (titlevalue.name == 'createdDate') {
                        if (val == 0 && val == '') {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + '-' + "</td>";
                        } else {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + moment.unix(val).utc().format('DD MMM YYYY') + "</td>";
                        }
                    } else if (titlevalue.name == 'intakeAmount') {
                        html += "<th style='border:1px solid #e2e2e2;border-collapse:collapse; padding:5px; text-align:right;font-weight: normal;'>" + val + " </th>";
                    } else if (titlevalue.name == 'referredTo') {
                        var f_name = val.firstName ? val.firstName : '';
                        var l_name = val.lastName ? val.lastName : '';
                        var full_name = f_name + '' + l_name;
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + full_name + "</td>";
                    }
                    else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(val) + "</td>";
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

        function printIntakeCampaign(dataList, filters) {
            var output = getCampaignDataListTable(dataList, filters);
            window.open().document.write(output);
        }

        function getCampaignDataListTable(dataList, filters) {
            delete filters.substatus;
            var title = [{
                name: 'intakeName',
                desc: 'Lead Name'
            }, {
                name: 'accidentDate',
                desc: 'Date of Incident'
            }, {
                name: 'createdDate_formatted',
                desc: 'Date Created'
            },
            {
                name: 'intakeTypeName',
                desc: 'Type'
            }, {
                name: 'intakeSubTypeName',
                desc: 'Sub Type'
            }, {
                name: 'intakeCategoryName',
                desc: 'Category'
            }, {
                name: 'intakeStatusName',
                desc: 'Status'
            }, {
                name: 'intakeSubStatusName',
                desc: 'Sub Status'
            }, {
                name: 'leadSource',
                desc: 'Lead Source'
            }, {
                name: 'leadSourceDescription',
                desc: 'Description'
            }, {
                name: 'campaign',
                desc: 'Campaign'
            },
            ];

            var html = "<html><title>Intake Campaign Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>table tr { page-break-inside: always; } table td{} </style>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=" + globalConstants.site_logo + " width='200px'/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Intake Campaign Report</h1><div><h2 style='padding:0 0 0 10px; margin:20px 0 0 0'>Filters</h2></div>";




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
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<thead style='display: table-header-group;'><tr>";
            angular.forEach(title, function (value, key) {
                if (value.name == 'accidentDate') {
                    html += "<th width='5%' style='border:1px solid #e2e2e2; background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; width:50px; text-align:left'>" + value.desc + "</th>";
                } else if (value.name == 'created_date') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; text-align:right'>" + value.desc + "</th>";
                } else if (value.name == 'intakeName') {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>" + value.desc + "</th>";
                } else {
                    html += "<th style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px'>" + value.desc + "</th>";
                }
            });
            html += "</tr></thead><tbody>";
            angular.forEach(dataList, function (data) {
                html += "<tr>";
                angular.forEach(title, function (titlevalue, titlekey) {
                    var val = (_.isNull(data[titlevalue.name])) ? '' : data[titlevalue.name];
                    if (titlevalue.name == 'accidentDate') {
                        if (val == 0 && val == '') {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; padding:5px'>" + '-' + "</td>";
                        } else {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse;  padding:5px'>" + moment.unix(val).utc().format('DD MMM YYYY') + "</td>";
                        }
                    }
                    else if (titlevalue.name == 'createdDate') {
                        if (val == 0 && val == '') {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + '-' + "</td>";
                        } else {
                            html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:right; padding:5px'>" + moment.unix(val).utc().format('DD MMM YYYY') + "</td>";
                        }
                    } else if (titlevalue.name == 'referredTo') {
                        var f_name = val.firstName ? val.firstName : '';
                        var l_name = val.lastName ? val.lastName : '';
                        var full_name = f_name + '' + l_name;
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + full_name + "</td>";
                    }
                    else {
                        html += "<td style='border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px'>" + utils.removeunwantedHTML(val) + "</td>";
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

        return intakeReportFactory;
    }
})();
