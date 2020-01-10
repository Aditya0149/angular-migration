;

(function () {
    'use strict';

    angular
        .module('cloudlex.allParties')
        .factory('allPartiesDataService', allPartiesDataService);

    allPartiesDataService.$inject = ["$http", "$q", "globalConstants", "contactFactory", "$filter"];

    function allPartiesDataService($http, $q, globalConstants, contactFactory, $filter) {

        var serviceBase = {};
        var getResp = {};
        var allPartiesData = {};

        //API URL Constants
        serviceBase.GET_ContactDetailsById = globalConstants.webServiceBase + "allparties/contactinfo/[ID]";
        serviceBase.GET_PLAINTIFFS = globalConstants.webServiceBase + "allparties/plaintiffs/[ID].json";
        serviceBase.GET_DEFENDANTS = globalConstants.webServiceBase + "allparties/defendants/[ID].json";
        serviceBase.GET_OTHER_PARTIES = globalConstants.webServiceBase + "allparties/otherparties/[ID].json";
        serviceBase.GET_OTHER_PARTIES_NEW_DETAILS = globalConstants.webServiceBase + "lexviatemplates/getMatterContacts/";
        serviceBase.ADD_PLAINTIFF = globalConstants.webServiceBase + "allparties/plaintiffs";
        serviceBase.ADD_PLAINTIFF_EMP = globalConstants.webServiceBase + "allparties/plaintiffsemployee";
        serviceBase.EDIT_PLAINTIFF = globalConstants.webServiceBase + "allparties/plaintiffs/[ID].json";
        serviceBase.EDIT_PLAINTIFFS = globalConstants.webServiceBase + "allparties/allplaintiffsupdate/[ID]"
        serviceBase.EDIT_PLAINTIFF_EMP = globalConstants.webServiceBase + "allparties/plaintiffsemployee/[ID].json";
        serviceBase.ADD_DEFENDANT = globalConstants.webServiceBase + "allparties/defendants";
        serviceBase.EDIT_DEFENDANT = globalConstants.webServiceBase + "allparties/defendants/[ID].json";
        serviceBase.EDIT_OTHER_PARTY = globalConstants.webServiceBase + "allparties/otherparties/[ID].json";
        serviceBase.ADD_OTHER_PARTY = globalConstants.webServiceBase + "allparties/otherparties";
        serviceBase.DELETE_PLAINTIFFS = globalConstants.webServiceBase + "allparties/plaintiffs/1.json";
        serviceBase.DELETE_PLAINTIFFS_EMP = globalConstants.webServiceBase + "allparties/plaintiffsemployee/1.json";
        serviceBase.DELETE_DEFENDANTS = globalConstants.webServiceBase + "allparties/defendants/1.json";
        serviceBase.DELETE_OTHER_PARTIES = globalConstants.webServiceBase + "allparties/otherparties/1.json";
        serviceBase.GET_OTHER_PARTIES_BASIC = globalConstants.webServiceBase + "allparties/otherpartiesbasic/"

        // Get combined result for other parties,defendants and plaintiffs
        serviceBase.GET_ALL_PARTIES = globalConstants.webServiceBase + "allparties/getAllParties/[ID].json";

        serviceBase.GET_MATTER_INFO = globalConstants.webServiceBase + "matter/matter_index_edit/";

        serviceBase.modifyEntityPermissionForMattercollaborationURL = globalConstants.webServiceBase + "Cloudlex-Lite/v1/lite/modify-entity-permission";
        serviceBase.endUserCollaborationURL = globalConstants.webServiceBase + "Cloudlex-Lite/v1/lite/end-collaboration";
        serviceBase.disableEntityAccessURL = globalConstants.webServiceBase + "Cloudlex-Lite/v1/lite/disable-entity-access";

        return {
            getMatterInfo: getMatterInfo,
            getPlaintiffs: getPlaintiffs,
            getPlaintiffByContactId: getPlaintiffByContactId,
            getDefendants: getDefendants,
            getOtherParties: getOtherParties,
            getOtherPartiesNewDetails: getOtherPartiesNewDetails,
            getOtherPartiesBasic: getOtherPartiesBasic,
            addPlaintiff: addPlaintiff,
            addPlaintiffEmployers: addPlaintiffEmployers,
            addDefendant: addDefendant,
            addOtherParty: addOtherParty,
            editPlaintiff: editPlaintiff,
            editPlaintiffs: editPlaintiffs,
            editPlaintiffEmployee: editPlaintiffEmployee,
            editDefendant: editDefendant,
            editOtherParty: editOtherParty,
            deletePlaintiffs: deletePlaintiffs,
            deletePlaintiffsEmployee: deletePlaintiffsEmployee,
            deleteDefendants: deleteDefendants,
            deleteOtherParties: deleteOtherParties,
            getAllParties: getAllParties,
            resetAllPartiesData: resetAllPartiesData,
            getAllPartiesData: getAllPartiesData,
            updateAllPartiesDataOnContactEdit: updateAllPartiesDataOnContactEdit,
            updateOtherPartyContact: updateOtherPartyContact,
            printPlaintiff: printPlaintiff,
            printDefendent: printDefendent,
            printOtherParty: printOtherParty,
            printOtherPartyAll: printOtherPartyAll,
            printOtherPartyNewGrid: printOtherPartyNewGrid,
            modifyEntityPermissionForMattercollaboration: modifyEntityPermissionForMattercollaboration,
            endUserCollaboration: endUserCollaboration,
            disableEntityAccess: disableEntityAccess
        };


        function getMatterInfo(matterId) {
            var url = serviceBase.GET_MATTER_INFO + matterId;
            return $http.get(url);
        }

        // Get plaintiff details by contact id
        function getPlaintiffByContactId(contactId) {
            return $http.get(getURL(serviceBase.GET_ContactDetailsById, contactId), {
                withCredentials: true
            }).then(function (response) {
                return response.data;
            }, function (error) {
                return error;
            });
        }

        function getPlaintiffs(matterID, args) {
            var params = {};
            if (args == "No-Fault") {
                params = {
                    pageNum: 1,
                    pageSize: 1000,
                    type: args
                }
            } else {
                params = {
                    pageNum: 1,
                    pageSize: 1000
                }
            }
            return $http.get(getURL(serviceBase.GET_PLAINTIFFS, matterID), {
                withCredentials: true,
                params: params
            }).then(function (response) {
                allPartiesData.plaintiff = response.data;
                return response.data;
            }, function (error) {
                return error;
            });
        };

        function getDefendants(matterID) {
            return $http.get(getURL(serviceBase.GET_DEFENDANTS, matterID), {
                withCredentials: true,
                params: {
                    pageNum: 1,
                    pageSize: 1000
                }
            }).then(function (response) {
                allPartiesData.defendant = response.data;
                return response.data;
            }, function (error) {
                return error;
            });
        };

        function getOtherParties(matterID, filtersapi, sort) {
            var filtersid;
            (filtersapi == '' || filtersapi == null) ? filtersid = "" : filtersid = filtersapi.filters.toString();
            return $http.get(getURL(serviceBase.GET_OTHER_PARTIES, matterID), {
                withCredentials: true,
                params: {
                    pageNum: 1,
                    pageSize: 1000,
                    role: filtersid,
                    otherpartysort: sort
                }
            }).then(function (response) {
                allPartiesData.oparty = response.data;
                return response.data;
            }, function (error) {
                return error;
            });
        };

        function getOtherPartiesBasic(matterId) {
            var url = serviceBase.GET_OTHER_PARTIES_BASIC + matterId + '.json';
            return $http.get(url);
        }

        function getOtherPartiesNewDetails(matterId) {
            var url = serviceBase.GET_OTHER_PARTIES_NEW_DETAILS + matterId + '.json';
            return $http.get(url);
        }

        function deletePlaintiffs(plaintiffIDs) {
            var data = {
                'pid': getArrayString(plaintiffIDs)
            };
            var url = serviceBase.DELETE_PLAINTIFFS + '?' + getParams(data);
            return $http.delete(url, {}, {
                withCredentials: true
            }).then(function (response) {
                return response.data;
            }, function (error) {
                return error;
            });
        };

        function deletePlaintiffsEmployee(empId) {
            var data = {
                'eid': empId
            };
            var url = serviceBase.DELETE_PLAINTIFFS_EMP + '?' + getParams(data);
            return $http.delete(url, {}, {
                withCredentials: true
            }).then(function (response) {
                return response.data;
            }, function (error) {
                return error;
            });
        };

        function deleteDefendants(defendantIDs) {
            var data = {
                'did': getArrayString(defendantIDs)
            };
            var url = serviceBase.DELETE_DEFENDANTS + '?' + getParams(data);
            return $http.delete(url, {}, {
                withCredentials: true
            }).then(function (response) {
                return response.data;
            }, function (error) {
                return error;
            });
        };

        function deleteOtherParties(otherPartyIDs) {
            var data = {
                'oid': getArrayString(otherPartyIDs)
            };
            var url = serviceBase.DELETE_OTHER_PARTIES + '?' + getParams(data);
            return $http.delete(url, {}, {
                withCredentials: true
            }).then(function (response) {
                return response.data;
            }, function (error) {
                return error;
            });
        };

        // save plaintiff info
        function addPlaintiff(plaintiffinfo) {
            return $http.post(serviceBase.ADD_PLAINTIFF, plaintiffinfo);
        }

        // save plaintiff employers
        function addPlaintiffEmployers(employersInfo) {
            return $http.post(serviceBase.ADD_PLAINTIFF_EMP, employersInfo);
        }

        function editPlaintiff(plaintiffinfo) {
            return $http.put(getURL(serviceBase.EDIT_PLAINTIFF, plaintiffinfo.plaintiffid), plaintiffinfo);
        }

        function editPlaintiffs(allPlaintiffInfo, matterId) {
            return $http.put(getURL(serviceBase.EDIT_PLAINTIFFS, matterId), allPlaintiffInfo);
        }
        function editPlaintiffEmployee(employersInfo) {
            return $http.put(getURL(serviceBase.EDIT_PLAINTIFF_EMP, employersInfo.employerid), employersInfo);
        }

        //save defendant info
        function addDefendant(defendantInfo) {
            return $http.post(serviceBase.ADD_DEFENDANT, defendantInfo);
        };

        function editDefendant(defendantInfo) {
            return $http.put(getURL(serviceBase.EDIT_DEFENDANT, defendantInfo.defendantid), defendantInfo);
        };

        function editOtherParty(otherPartyInfo) {
            return $http.put(getURL(serviceBase.EDIT_OTHER_PARTY, 1), otherPartyInfo);
        };

        //save other party info
        function addOtherParty(otherPartyInfo) {
            return $http.post(serviceBase.ADD_OTHER_PARTY, otherPartyInfo);
        };

        function getArrayString(array) {
            var str = (array != null ? array.toString() : "");
            return "[" + str + "]";
        };

        function getURL(serviceUrl, id) {
            var url = serviceUrl.replace("[ID]", id);
            return url;
        };

        function getParams(params) {
            var querystring = "";
            angular.forEach(params, function (value, key) {
                querystring += key + "=" + value;
                querystring += "&";
            });
            return querystring.slice(0, querystring.length - 1);
        };

        function getAllParties(matterID) {
            var deferred = $q.defer();
            $http.get(getURL(serviceBase.GET_ALL_PARTIES, matterID), {
                withCredentials: true,
                params: {
                    pageNum: 1,
                    pageSize: 1000
                }
            }).then(function (response) {
                //to implement the changes suggested and to make sure that the current implementation dosen't break
                //we are storing the data in an object which is exposed and can be used by others
                allPartiesData = response.data;
                deferred.resolve(allPartiesData);
            }, function () {
                deferred.reject();
                console.log('handle error');
            });
            return deferred.promise;
        };

        function getAllPartiesData() {
            return allPartiesData;
        }

        function resetAllPartiesData() {
            allPartiesData = {};
        }


        function updateAllPartiesDataOnContactEdit(contact) {
            angular.forEach(allPartiesData, function (partyData, partyType) {
                switch (partyType) {
                    case "plaintiff":
                    case "defendant":
                        updateParty(contact, partyType);
                        break;
                    case "oparty":
                        _.forEach(partyData.data, function (otherParty, i) {
                            updateOtherPartyContact(partyData.data, i, contact);
                            contactFactory.updateContactOnEdit(contact, partyData.data[i], 'party_contact_id');
                        });
                        break;
                }
            });
        }

        function updateParty(contact, partyName) {
            _.forEach(allPartiesData[partyName].data, function (party) {
                if (utils.isNotEmptyVal(party.contactid)) {
                    contactFactory.updateContactOnEdit(contact, party, 'guardianid');
                    contactFactory.updateContactOnEdit(contact, party, 'studentinstitutionid');
                    contactFactory.updateContactOnEdit(contact, party, 'estateadminid');

                    if (party.employerid && party.employerid.length > 0) {
                        _.forEach(party.employerid, function (emp) {

                            if (emp.contactid.contactid === contact.contactid) {
                                emp.contactid = angular.extend({}, emp.contactid, contact);
                                emp.contactid.phone_number = utils.isNotEmptyVal(emp.contactid.phone) ?
                                    emp.contactid.phone.split(',')[0] : emp.contactid.phone;
                                emp.contactid.emailid = utils.isNotEmptyVal(emp.contactid.email) ?
                                    emp.contactid.email.split(',')[0] : emp.contactid.email;
                                contactFactory.formatContactAddress(emp.contactid);
                                emp.contactid.edited = true;
                            }
                        });
                    }

                    contactFactory.updateContactOnEdit(contact, party, 'insurance_details');
                    updatePlaintiffDefendant(party, contact);
                    var otherPartyProp = (partyName == "plaintiff") ? "plaintiff_otherparty_id" : "defendant_otherparty_id";
                    _.forEach(party[otherPartyProp], function (otherParty, i) {
                        updateOtherPartyContact(party[otherPartyProp], i, contact);
                    });
                }
            });
        }

        function updatePlaintiffDefendant(party, contact) {
            if (party.contactid.contactid === contact.contactid) {
                party.contactid = angular.extend({}, party.contactid, contact);
                party.contactid.phone_number = utils.isNotEmptyVal(party.contactid.phone) ?
                    party.contactid.phone.split(',')[0] : party.contactid.phone;
                party.contactid.emailid = utils.isNotEmptyVal(party.contactid.email_ids) ?
                    (party.contactid.email_ids.split(',')).join(",") : party.contactid.email_ids;
                party.contactid.email = party.contactid.email_ids;
                party.contactid.edited = true;
            }
        }

        function updateOtherPartyContact(otherParties, i, contact) {
            if (otherParties[i].contactid === contact.contactid) {
                otherParties[i] = angular.extend({}, otherParties[i], contact);
                otherParties[i].phone_number = utils.isNotEmptyVal(otherParties[i].phone) ?
                    otherParties[i].phone.split(',')[0] : otherParties[i].phone;
                otherParties[i].emailid = utils.isNotEmptyVal(otherParties[i].email) ?
                    otherParties[i].email : otherParties[i].email;
                otherParties[i].edited = true;
            }
        }

        //PLAINTIFF PRINT
        function printPlaintiff(plaintiffData, matterInformation) {
            //Bug#5349
            var plaintiffData = angular.copy(plaintiffData);

            var role;
            var roleType = [];
            var bodilyInjury = utils.isNotEmptyVal(plaintiffData.bodilyinjury) ? plaintiffData.bodilyinjury : 'No information available.';

            /*set lable for salary mode for plaintiff view page*/
            var salaryMode = utils.isEmptyVal(plaintiffData.salarymode) ? 'Monthly' : (plaintiffData.salarymode == "1") ? 'Hourly' : (plaintiffData.salarymode == "2") ? 'Monthly' : (plaintiffData.salarymode == "3") ? 'Yearly' : 'Weekly';

            function getSalaryMode(mode) {
                return utils.isEmptyVal(mode) ? 'Monthly' : (mode == "1") ? 'Hourly' : (mode == "2") ? 'Monthly' : (mode == "3") ? 'Yearly' : 'Weekly';
            }

            function currencyFormat(num) {
                if (num) {
                    //return "$" + parseFloat(num).toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
                    num = num.toString();
                    return "$" + num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
                }
                else {
                    return ''
                }
            }

            if (plaintiffData.isprimary == '1') {
                role = 'Primary Plaintiff';
            } else {
                role = 'Secondary Plaintiff';
            }

            if (plaintiffData.isinfant == 1 || plaintiffData.isinfant == true) {
                roleType.push("Minor");
            }

            if (plaintiffData.isstudent == 1 || plaintiffData.isstudent == true) {
                roleType.push("Student");
            }

            if (plaintiffData.isemployed == 1 || plaintiffData.isemployed == true) {
                roleType.push("Employed");
            }

            if (!plaintiffData.insurance_details) {
                plaintiffData.insurance_details = {};
                plaintiffData.insurance_details.firstname = "";
                plaintiffData.insurance_details.lastname = "";
                plaintiffData.insurance_details.insurancetype = "";
                plaintiffData.insurance_details.policylimit = "";
            }

            //if insurance details is null, convert it to empty and create properties with emty string
            plaintiffData.insurance_details.firstname = utils.isNotEmptyVal(plaintiffData.insurance_details.firstname) ? plaintiffData.insurance_details.firstname : '';
            plaintiffData.insurance_details.lastname = utils.isNotEmptyVal(plaintiffData.insurance_details.lastname) ? plaintiffData.insurance_details.lastname : '';
            plaintiffData.insurance_details.insurancetype = utils.isNotEmptyVal(plaintiffData.insurance_details.insurancetype) ? plaintiffData.insurance_details.insurancetype : '';
            plaintiffData.insurance_details.policylimit = utils.isNotEmptyVal(plaintiffData.insurance_details.policylimit) ? plaintiffData.insurance_details.policylimit : '';
            //insurance details ends here 

            roleType.toString().replace(/,/g, ", ");

            plaintiffData.studentlostdays = utils.isNotEmptyVal(plaintiffData.studentlostdays) ? plaintiffData.studentlostdays : '';
            plaintiffData.medical_bills.medical_bills_amount = utils.isNotEmptyVal(plaintiffData.medical_bills.medical_bills_amount) ? plaintiffData.medical_bills.medical_bills_amount : '';
            plaintiffData.liens.lien_amount = utils.isNotEmptyVal(plaintiffData.liens.lien_amount) ? plaintiffData.liens.lien_amount : '';
            plaintiffData.expense.expense_amount = utils.isNotEmptyVal(plaintiffData.expense.expense_amount) ? plaintiffData.expense.expense_amount : '';
            //if the plaintiff contact is null, convert it to empty and create properties with emty string
            if (plaintiffData.contactid) {
                plaintiffData.contactid.phone_work = utils.isNotEmptyVal(plaintiffData.contactid.phone_work) ? plaintiffData.contactid.phone_work : '';
                plaintiffData.contactid.phone_home = utils.isNotEmptyVal(plaintiffData.contactid.phone_home) ? plaintiffData.contactid.phone_home : '';
                plaintiffData.contactid.phone_cell = utils.isNotEmptyVal(plaintiffData.contactid.phone_cell) ? plaintiffData.contactid.phone_cell : '';
                plaintiffData.contactid.emailid = utils.isNotEmptyVal(plaintiffData.contactid.emailid) ? plaintiffData.contactid.emailid : '';
                plaintiffData.contactid.contact_note = utils.isNotEmptyVal(plaintiffData.contactid.contact_note) ? plaintiffData.contactid.contact_note : '';
            }
            else {
                plaintiffData.contactid = {};
                plaintiffData.contactid.firstname = '';
                plaintiffData.contactid.lastname = '';
                plaintiffData.contactid.streetCityStateZip = '';
                plaintiffData.contactid.phone_work = '';
                plaintiffData.contactid.phone_home = '';
                plaintiffData.contactid.phone_cell = '';
                plaintiffData.contactid.emailid = '';
                plaintiffData.contactid.contact_note = '';
                plaintiffData.ssn = '';
                plaintiffData.dateofbirth = '';
                plaintiffData.dateofdeath = '';
                plaintiffData.gender = '';
            }

            plaintiffData.ssn = utils.isNotEmptyVal(plaintiffData.ssn) ? plaintiffData.ssn : '';
            plaintiffData.dateofbirth = utils.isNotEmptyVal(plaintiffData.dateofbirth) ? moment.unix(plaintiffData.dateofbirth).utc().format('MM/DD/YYYY') : '';
            plaintiffData.dateofdeath = utils.isNotEmptyVal(plaintiffData.dateofdeath) ? moment.unix(plaintiffData.dateofdeath).utc().format('MM/DD/YYYY') : '';
            plaintiffData.retainer_date = utils.isNotEmptyVal(plaintiffData.retainer_date) ? moment.unix(plaintiffData.retainer_date).utc().format('MM/DD/YYYY') : '';
            plaintiffData.retainer_no = plaintiffData.retainer_no ? plaintiffData.retainer_no : '';
            plaintiffData.closing_statement_date = utils.isNotEmptyVal(plaintiffData.closing_statement_date) ? moment.unix(plaintiffData.closing_statement_date).utc().format('MM/DD/YYYY') : '';
            plaintiffData.closing_statement_no = plaintiffData.closing_statement_no ? plaintiffData.closing_statement_no : '';

            plaintiffData.gender = utils.isNotEmptyVal(plaintiffData.gender) ? plaintiffData.gender : '';
            //US#5874 : null check for primary language while print
            plaintiffData.primarylanguage = utils.isNotEmptyVal(plaintiffData.primarylanguage) ? plaintiffData.primarylanguage : '';

            var strVar = "";
            strVar += "<html><head><title>Plaintiffs Report<\/title>";
            strVar += "<link rel='shortcut icon' href='favicon.ico' type='image\/vnd.microsoft.icon'>";
            strVar += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}} td{padding:6px 0}</style>";
            strVar += "<\/head>";
            strVar += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=\"styles\/images\/logo.png \" width='200px'\/>";
            strVar += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'\/>Plaintiffs Report<\/h1>";
            strVar += "";
            angular.forEach(matterInformation, function (val, key) {
                strVar += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;font-size: 12pt;' class='labelTxt'>";
                strVar += "<label><strong>" + key + " : </strong></label>";
                strVar += "<span style='padding:5px; '>  " + utils.removeunwantedHTML(val) + '</span>';
                strVar += "</div>";
            });
            strVar += "<div style=\"width:100%; clear:both\"><button onclick=\"window.print()\" style=\"margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;\" id=\"printBtn\">Print<\/button><\/div>";
            strVar += "    ";
            strVar += "    ";
            var middlename = utils.isEmptyVal(plaintiffData.contactid.middelname) ? '' : plaintiffData.contactid.middelname;
            strVar += "<h2 style='padding:10px 5px 0;margin:0'>" + utils.removeunwantedHTML(plaintiffData.contactid.firstname) + " " + utils.removeunwantedHTML(middlename) + " " + utils.removeunwantedHTML(plaintiffData.contactid.lastname) + "</h2>";
            strVar += "<table style='width:100%'><tr><td style='vertical-align:top; width:60%'><table style='width:100%'><tr><th style='text-align:left;border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:10px 5px' colspan='2'>Plaintiffs Details</th></tr>";
            strVar += "<tr><td style='vertical-align:top; width='60%'><table><tr>";
            strVar += "<tr><td width='40%' style='vertical-align:top'>Role:</td><td><strong>" + role + " | " + roleType + "</strong></td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Phone(Work):</td><td>" + plaintiffData.contactid.phone_work + "</td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Phone(home):</td><td>" + plaintiffData.contactid.phone_home + "</td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Phone(Cell):</td><td>" + plaintiffData.contactid.phone_cell + "</td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Email:</td><td>" + plaintiffData.contactid.emailid + "</td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Address:</td><td>" + utils.removeunwantedHTML(plaintiffData.contactid.streetCityStateZip) + "</td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Note:</td><td><pre style='white-space: pre-wrap;' class='pre-default'>" + utils.removeunwantedHTML(plaintiffData.contactid.contact_note) + "</pre></td></tr>";
            // var clientportal = '';
            // ($rootScope.isPortalEnabled) ? (clientportal = "<tr><td style='vertical-align:top'>Client Portal:</td><td>" + ((plaintiffData.client_status) ? "Enabled" : "Disabled" ) + "</td></tr> ") : " " ;
            // strVar += clientportal;
            strVar += "</table></td><td style='vertical-align:top'>";
            strVar += "<table>";
            strVar += "<tr><td width='50%'>SSN:</td><td><strong>" + plaintiffData.ssn + "</strong></td></tr>";
            strVar += "<tr><td width='20%'>Primary Language:</td><td width='200px'><strong>" + utils.removeunwantedHTML(plaintiffData.primarylanguage) + "</strong></td></tr>";//US#5874:primary language added on print page
            strVar += "<tr><td>DOB:</td><td><strong>" + plaintiffData.dateofbirth + "</strong></td></tr>";
            strVar += "<tr><td>DOD:</td><td><strong>" + plaintiffData.dateofdeath + "</strong></td></tr>";
            strVar += "<tr><td>Gender:</td><td><strong>" + plaintiffData.gender + "</strong></td></tr>";
            strVar += "<tr><td>Retainer Date:</td><td><strong>" + plaintiffData.retainer_date + "</strong></td></tr>";
            strVar += "<tr><td>Retainer #:</td><td><strong>" + utils.removeunwantedHTML(plaintiffData.retainer_no) + "</strong></td></tr>";
            strVar += "<tr><td>Closing Statement Date:</td><td><strong>" + plaintiffData.closing_statement_date + "</strong></td></tr>";
            strVar += "<tr><td>Closing Statement #:</td><td><strong>" + plaintiffData.closing_statement_no + "</strong></td></tr>";

            plaintiffData.studentlostdays = utils.isNotEmptyVal(plaintiffData.studentlostdays) ? utils.removeunwantedHTML(plaintiffData.studentlostdays) : '';
            plaintiffData.studentprogram = utils.isNotEmptyVal(plaintiffData.studentprogram) ? utils.removeunwantedHTML(plaintiffData.studentprogram) : '';

            strVar += "<tr><td></td><td></td></tr>";
            strVar += "<tr><td></td><td></td></tr>";
            strVar += "</table></td></tr>";

            strVar += "</tr>";
            strVar += "<tr><td colspan='2'>";
            strVar += "<table style='width:100%'><tr><th style='text-align:left;border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:10px 5px' colspan='2'>Medical Details</th></tr></table>";
            strVar += "</td></tr>";
            strVar += "<tr><td style='padding:10px 5px' colspan='2'><strong>Bodily Injury</strong></td></tr>";

            strVar += "<tr><td style='padding:10px 5px' colspan='2'>" + utils.removeunwantedHTML(bodilyInjury) + "</td></tr>";
            strVar += "<tr><td colspan='2'>";

            strVar += "<table style='width:100%'><tr><td style='vertical-align:top;'><table style='width:100%'>";
            strVar += "<tr><td style='width:50%'><table style='width:100%'><tr>";

            strVar += "<tr><td style='vertical-align:top; width:50%'>Insurance Provider:</td><td><strong>" + utils.removeunwantedHTML(plaintiffData.insurance_details.firstname) + " " + utils.removeunwantedHTML(plaintiffData.insurance_details.lastname) + "</strong></td></tr>";
            strVar += "<tr><td style='vertical-align:top;width:50%'>Insurance Type:</td><td><strong>" + plaintiffData.insurance_details.insurancetype + "</strong></td></tr>";

            if (utils.isNotEmptyVal(plaintiffData.insurance_details.policylimit_max) || utils.isNotEmptyVal(plaintiffData.insurance_details.policylimit)) {
                var policylimit = utils.isEmptyVal(plaintiffData.insurance_details.policylimit) ? " " : plaintiffData.insurance_details.policylimit;
                var policylimit_max = utils.isEmptyVal(plaintiffData.insurance_details.policylimit_max) ? " " : plaintiffData.insurance_details.policylimit_max;
                strVar += "<tr><td style='vertical-align:top;width:50%'>Policy Limit:</td><td><strong>" + (utils.isNotEmptyVal(policylimit) ? $filter('currency')(policylimit, '$', 2) : "-") + '/' + (utils.isNotEmptyVal(policylimit_max) ? $filter('currency')(policylimit_max, '$', 2) : "-") + "</strong></td></tr>";
            }
            else {
                strVar += "<tr><td style='vertical-align:top;width:50%'>Policy Limit:</td><td><strong>" + (utils.isNotEmptyVal(plaintiffData.insurance_details.policylimit) ? $filter('currency')(plaintiffData.insurance_details.policylimit, '$', 2) : ' ') + "</strong></td></tr>";
            }

            strVar += "</table></td><td width='50%' style='vertical-align:top'>";
            strVar += "<table>";
            strVar += "<tr><td>Medical Bills Total:</td><td><strong>" + (utils.isNotEmptyVal(plaintiffData.medical_bills.medical_bills_amount) ? $filter('currency')(plaintiffData.medical_bills.medical_bills_amount, '$', 2) : ' ') + "</strong></td></tr>";
            strVar += "<tr><td>Liens Amount Total:</td><td><strong>" + (utils.isNotEmptyVal(plaintiffData.liens.lien_amount) ? $filter('currency')(plaintiffData.liens.lien_amount, '$', 2) : ' ') + "</strong></td></tr>";
            strVar += "<tr><td>Expenses Total:</td><td><strong>" + (utils.isNotEmptyVal(plaintiffData.expense.expense_amount) ? $filter('currency')(plaintiffData.expense.expense_amount, '$', 2) : ' ') + "</strong></td></tr></table>";

            strVar += "</td></tr></table></td></tr></table></tr>";


            strVar += "</table>";
            strVar += "<td  style='vertical-align:top; width:1px;'>";
            strVar += "<td  style='vertical-align:top; width:1px; border-left:1px solid #ccc'>";
            strVar += "<td  style='vertical-align:top; width:40%'>";
            if (plaintiffData.plaintiff_otherparty_id) {
                strVar += "<table style='width:100%'><tr><th style='text-align:left;border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:10px 5px' colspan='2'>Associated Other Parties</th></tr>";
                for (var i = 0; i < plaintiffData.plaintiff_otherparty_id.length; i++) {
                    plaintiffData.plaintiff_otherparty_id[i].firstname = utils.isNotEmptyVal(plaintiffData.plaintiff_otherparty_id[i].firstname) ? utils.removeunwantedHTML(plaintiffData.plaintiff_otherparty_id[i].firstname) : '';
                    plaintiffData.plaintiff_otherparty_id[i].lastname = utils.isNotEmptyVal(plaintiffData.plaintiff_otherparty_id[i].lastname) ? utils.removeunwantedHTML(plaintiffData.plaintiff_otherparty_id[i].lastname) : '';
                    plaintiffData.plaintiff_otherparty_id[i].phone_work = utils.isNotEmptyVal(plaintiffData.plaintiff_otherparty_id[i].phone_work) ? plaintiffData.plaintiff_otherparty_id[i].phone_work : '';
                    plaintiffData.plaintiff_otherparty_id[i].phone_home = utils.isNotEmptyVal(plaintiffData.plaintiff_otherparty_id[i].phone_home) ? plaintiffData.plaintiff_otherparty_id[i].phone_home : '';
                    plaintiffData.plaintiff_otherparty_id[i].phone_cell = utils.isNotEmptyVal(plaintiffData.plaintiff_otherparty_id[i].phone_cell) ? plaintiffData.plaintiff_otherparty_id[i].phone_cell : '';
                    plaintiffData.plaintiff_otherparty_id[i].emailid = utils.isNotEmptyVal(plaintiffData.plaintiff_otherparty_id[i].emailid) ? plaintiffData.plaintiff_otherparty_id[i].emailid : '';
                    plaintiffData.plaintiff_otherparty_id[i].streetCityStateZip = utils.isNotEmptyVal(plaintiffData.plaintiff_otherparty_id[i].streetCityStateZip) ? plaintiffData.plaintiff_otherparty_id[i].streetCityStateZip : '';
                    plaintiffData.plaintiff_otherparty_id[i].contact_note = utils.isNotEmptyVal(plaintiffData.plaintiff_otherparty_id[i].contact_note) ? utils.removeunwantedHTML(plaintiffData.plaintiff_otherparty_id[i].contact_note) : '';


                    strVar += "<tr><td style='border-bottom:1px solid #ccc;padding:10px 5px'><strong>" + utils.removeunwantedHTML(plaintiffData.plaintiff_otherparty_id[i].firstname) + " " + utils.removeunwantedHTML(plaintiffData.plaintiff_otherparty_id[i].lastname) + "</strong></td><tr>";
                    strVar += "<tr><td style='width:50%'><table><tr>";
                    strVar += "<tr><td style='vertical-align:top' width='20%'>Role:</td><td width='60%'>" + plaintiffData.plaintiff_otherparty_id[i].contactrolename + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Phone(Work):</td><td>" + plaintiffData.plaintiff_otherparty_id[i].phone_work + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Phone(home):</td><td>" + plaintiffData.plaintiff_otherparty_id[i].phone_home + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Phone(Cell):</td><td>" + plaintiffData.plaintiff_otherparty_id[i].phone_cell + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Email:</td><td>" + plaintiffData.plaintiff_otherparty_id[i].emailid + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Address:</td><td>" + utils.removeunwantedHTML(plaintiffData.plaintiff_otherparty_id[i].streetCityStateZip) + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Note:</td><td><pre style='white-space: pre-wrap;' class='pre-default'>" + utils.removeunwantedHTML(plaintiffData.plaintiff_otherparty_id[i].contact_note) + "</pre></td></tr>";
                    strVar += "</table>";
                }

                strVar += "</table>";
            }



            if (plaintiffData.isinfant == 1 && plaintiffData.guardianid) {
                strVar += "<table style='width:100%'><tr><th style='text-align:left;border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:10px 5px' colspan='2'>Guardian Details</th></tr>";

                plaintiffData.guardianid.phone_work = utils.isNotEmptyVal(plaintiffData.guardianid.phone_work) ? plaintiffData.guardianid.phone_work : '';
                plaintiffData.guardianid.phone_home = utils.isNotEmptyVal(plaintiffData.guardianid.phone_home) ? plaintiffData.guardianid.phone_home : '';
                plaintiffData.guardianid.phone_cell = utils.isNotEmptyVal(plaintiffData.guardianid.phone_cell) ? plaintiffData.guardianid.phone_cell : '';
                plaintiffData.guardianid.emailid = utils.isNotEmptyVal(plaintiffData.guardianid.emailid) ? plaintiffData.guardianid.emailid : '';
                plaintiffData.guardianid.contact_note = utils.isNotEmptyVal(plaintiffData.guardianid.contact_note) ? plaintiffData.guardianid.contact_note : '';

                strVar += "<tr><td style='width:50%'><table><tr>";
                strVar += "<tr><td style='vertical-align:top;' width='30%'>Guardian:</td><td>" + utils.removeunwantedHTML(plaintiffData.guardianid.firstname) + " " + utils.removeunwantedHTML(plaintiffData.guardianid.lastname) + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Phone(Work):</td><td>" + plaintiffData.guardianid.phone_work + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Phone(home):</td><td>" + plaintiffData.guardianid.phone_home + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Phone(Cell):</td><td>" + plaintiffData.guardianid.phone_cell + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Email:</td><td>" + plaintiffData.guardianid.emailid + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Address:</td><td>" + utils.removeunwantedHTML(plaintiffData.guardianid.streetCityStateZip) + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Note:</td><td><pre style='white-space: pre-wrap;' class='pre-default'>" + utils.removeunwantedHTML(plaintiffData.guardianid.contact_note) + "</pre></td></tr>";

                strVar += "</table>";
                strVar += "</table>";
            }

            if (plaintiffData.estateadminid) {
                var header = '';
                if (plaintiffData.isalive == 0) {
                    header = "Estate Administrator/Executor"
                } else {
                    header = "Power Of Attorney"
                }

                strVar += "<table style='width:100%'><tr><th style='text-align:left;border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:10px 5px' colspan='2'>" + header + " Details</th></tr>";
                plaintiffData.estateadminid.phone_work = utils.isNotEmptyVal(plaintiffData.estateadminid.phone_work) ? plaintiffData.estateadminid.phone_work : '';
                plaintiffData.estateadminid.phone_home = utils.isNotEmptyVal(plaintiffData.estateadminid.phone_home) ? plaintiffData.estateadminid.phone_home : '';
                plaintiffData.estateadminid.phone_cell = utils.isNotEmptyVal(plaintiffData.estateadminid.phone_cell) ? plaintiffData.estateadminid.phone_cell : '';
                plaintiffData.estateadminid.emailid = utils.isNotEmptyVal(plaintiffData.estateadminid.emailid) ? plaintiffData.estateadminid.emailid : '';
                plaintiffData.estateadminid.contact_note = utils.isNotEmptyVal(plaintiffData.estateadminid.contact_note) ? plaintiffData.estateadminid.contact_note : '';
                plaintiffData.estateadminid.street = utils.isNotEmptyVal(plaintiffData.estateadminid.street) ? plaintiffData.estateadminid.street : '';
                plaintiffData.estateadminid.city = utils.isNotEmptyVal(plaintiffData.estateadminid.city) ? plaintiffData.estateadminid.city : '';
                plaintiffData.estateadminid.state = utils.isNotEmptyVal(plaintiffData.estateadminid.state) ? plaintiffData.estateadminid.state : '';
                plaintiffData.estateadminid.zipcode = utils.isNotEmptyVal(plaintiffData.estateadminid.zipcode) ? plaintiffData.estateadminid.zipcode : '';
                var streetCityStateZip = plaintiffData.estateadminid.street + ' ' + plaintiffData.estateadminid.city + ' ' + plaintiffData.estateadminid.state + ' ' + plaintiffData.estateadminid.zipcode;

                strVar += "<tr><td style='width:50%'><table><tr>";
                strVar += "<tr><td style='vertical-align:top;' width='30%'>Employer:</td><td><strong>" + utils.removeunwantedHTML(plaintiffData.estateadminid.firstname) + " " + utils.removeunwantedHTML(plaintiffData.estateadminid.lastname) + "</strong></td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Phone(Work):</td><td>" + plaintiffData.estateadminid.phone_work + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Phone(home):</td><td>" + plaintiffData.estateadminid.phone_home + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Phone(Cell):</td><td>" + plaintiffData.estateadminid.phone_cell + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Email:</td><td>" + plaintiffData.estateadminid.emailid + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Address:</td><td>" + utils.removeunwantedHTML(streetCityStateZip) + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Note:</td><td><pre style='white-space: pre-wrap;' class='pre-default'>" + utils.removeunwantedHTML(plaintiffData.estateadminid.contact_note) + "</pre></td></tr>";

                strVar += "</table>";
                strVar += "</table>";

            }

            if (plaintiffData.isemployed == 1 && plaintiffData.employerid) {

                _.forEach(plaintiffData.employerid, function (currentItem) {
                    strVar += "<table style='width:100%'><tr><th style='text-align:left;border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:10px 5px' colspan='2'>Employer Details</th></tr>";
                    currentItem.contactid.phone_work = utils.isNotEmptyVal(currentItem.contactid.phone_work) ? currentItem.contactid.phone_work : '';
                    currentItem.contactid.phone_home = utils.isNotEmptyVal(currentItem.contactid.phone_home) ? currentItem.contactid.phone_home : '';
                    currentItem.contactid.phone_cell = utils.isNotEmptyVal(currentItem.contactid.phone_cell) ? currentItem.contactid.phone_cell : '';
                    currentItem.contactid.emailid = utils.isNotEmptyVal(currentItem.contactid.emailid) ? currentItem.contactid.emailid : '';
                    currentItem.contactid.contact_note = utils.isNotEmptyVal(currentItem.contactid.contact_note) ? currentItem.contactid.contact_note : '';
                    currentItem.contactid.street = utils.isNotEmptyVal(currentItem.contactid.street) ? currentItem.contactid.street : '';
                    currentItem.contactid.city = utils.isNotEmptyVal(currentItem.contactid.city) ? currentItem.contactid.city : '';
                    currentItem.contactid.state = utils.isNotEmptyVal(currentItem.contactid.state) ? currentItem.contactid.state : '';
                    currentItem.contactid.zipcode = utils.isNotEmptyVal(currentItem.contactid.zipcode) ? currentItem.contactid.zipcode : '';
                    var streetCityStateZip = currentItem.contactid.street + ' ' + currentItem.contactid.city + ' ' + currentItem.contactid.state + ' ' + currentItem.contactid.zipcode;
                    currentItem.monthlysalary = utils.isNotEmptyVal(currentItem.monthlysalary) ? currentItem.monthlysalary : null;
                    currentItem.lostdays = utils.isNotEmptyVal(currentItem.lostdays) ? currentItem.lostdays : '';
                    currentItem.memo = utils.isNotEmptyVal(currentItem.memo) ? currentItem.memo : '';
                    currentItem.occupation = utils.isNotEmptyVal(currentItem.occupation) ? currentItem.occupation : '';
                    currentItem.position = utils.isNotEmptyVal(currentItem.position) ? currentItem.position : '';
                    currentItem.employmentstartdate = utils.isNotEmptyVal(currentItem.employmentstartdate) ? currentItem.employmentstartdate : '';
                    currentItem.employmentenddate = utils.isNotEmptyVal(currentItem.employmentenddate) ? currentItem.employmentenddate : '';
                    strVar += "<tr><td style='width:50%'><table><tr>";
                    strVar += "<tr><td style='vertical-align:top;' width='30%'>Employer:</td><td><strong>" + utils.removeunwantedHTML(currentItem.contactid.firstname) + " " + utils.removeunwantedHTML(currentItem.contactid.lastname) + "</strong></td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Phone(Work):</td><td>" + currentItem.contactid.phone_work + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Phone(home):</td><td>" + currentItem.contactid.phone_home + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Phone(Cell):</td><td>" + currentItem.contactid.phone_cell + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Email:</td><td>" + currentItem.contactid.emailid + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Address:</td><td>" + utils.removeunwantedHTML(streetCityStateZip) + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Note:</td><td><pre style='white-space: pre-wrap;' class='pre-default'>" + utils.removeunwantedHTML(currentItem.contactid.contact_note) + "</pre></td></tr>";

                    strVar += "<tr><td style='vertical-align:top'>Position:</td><td>" + utils.removeunwantedHTML(currentItem.position) + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Occupation:</td><td>" + utils.removeunwantedHTML(currentItem.occupation) + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Salary Mode:</td><td>" + getSalaryMode(currentItem.salarymode) + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>" + getSalaryMode(currentItem.salarymode) + " Salary:</td><td>" + (utils.isNotEmptyVal(currentItem.monthlysalary) ? $filter('currency')(currentItem.monthlysalary, '$', 2) : ' ') + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Days Lost:</td><td>" + utils.removeunwantedHTML(currentItem.lostdays) + "</td></tr>";
                    strVar += "<tr><td>Employment History:</td><td><pre style='white-space: pre-line !important;background-color: white; border-radius: 0px;border: 0px;padding: 0;font-family: calibri !important;word-break: break-word;'>" + utils.removeunwantedHTML(currentItem.memo) + "</pre></td></tr>";
                    if (currentItem.iscurrent == 1) {
                        strVar += "<tr><td style='vertical-align:top'>Start Date:</td><td>" + currentItem.employmentstartdate + "</td></tr>";
                    } else {
                        strVar += "<tr><td style='vertical-align:top'>Start Date:</td><td>" + currentItem.employmentstartdate + "</td></tr>";
                        strVar += "<tr><td style='vertical-align:top'>End Date:</td><td>" + currentItem.employmentenddate + "</td></tr>";
                    }
                    strVar += "</table>";
                    strVar += "</table>";
                })

            }

            if (plaintiffData.isstudent == 1 && plaintiffData.studentinstitutionid) {
                strVar += "<table style='width:100%'><tr><th style='text-align:left;border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:10px 5px' colspan='2'>School Details</th></tr>";

                if (plaintiffData.studentinstitutionid) {
                    plaintiffData.studentinstitutionid.phone_work = utils.isNotEmptyVal(plaintiffData.studentinstitutionid.phone_work) ? plaintiffData.studentinstitutionid.phone_work : '';
                    plaintiffData.studentinstitutionid.phone_home = utils.isNotEmptyVal(plaintiffData.studentinstitutionid.phone_home) ? plaintiffData.studentinstitutionid.phone_home : '';
                    plaintiffData.studentinstitutionid.phone_cell = utils.isNotEmptyVal(plaintiffData.studentinstitutionid.phone_cell) ? plaintiffData.studentinstitutionid.phone_cell : '';
                    plaintiffData.studentinstitutionid.emailid = utils.isNotEmptyVal(plaintiffData.studentinstitutionid.emailid) ? plaintiffData.studentinstitutionid.emailid : '';
                    plaintiffData.studentinstitutionid.contact_note = utils.isNotEmptyVal(plaintiffData.studentinstitutionid.contact_note) ? plaintiffData.studentinstitutionid.contact_note : '';
                }

                strVar += "<tr><td style='width:50%'><table><tr>";
                strVar += "<tr><td style='vertical-align:top;' width='30%'>School:</td><td><strong>" + utils.removeunwantedHTML(plaintiffData.studentinstitutionid.firstname) + " " + utils.removeunwantedHTML(plaintiffData.studentinstitutionid.lastname) + "</strong></td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Phone(Work):</td><td>" + plaintiffData.studentinstitutionid.phone_work + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Phone(home):</td><td>" + plaintiffData.studentinstitutionid.phone_home + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Phone(Cell):</td><td>" + plaintiffData.studentinstitutionid.phone_cell + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Email:</td><td>" + plaintiffData.studentinstitutionid.emailid + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Address:</td><td>" + utils.removeunwantedHTML(plaintiffData.studentinstitutionid.streetCityStateZip) + "</td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Note:</td><td><pre style='white-space: pre-wrap;' class='pre-default'>" + utils.removeunwantedHTML(plaintiffData.studentinstitutionid.contact_note) + "</pre></td></tr>";
                strVar += "<tr><td colspan='2'>Days Absent at School:  <strong>" + utils.removeunwantedHTML(plaintiffData.studentlostdays) + "</strong></td></tr>";
                strVar += "<tr><td style='vertical-align:top'>Program:</td><td><pre style='white-space: pre-wrap;' class='pre-default'>" + utils.removeunwantedHTML(plaintiffData.studentprogram) + "</pre></td></tr>";
                strVar += "</table>";
                strVar += "</td></tr></table>";
            }


            strVar += "</table>";


            return strVar;

        }

        // DEFENDANT PRINT 
        function printDefendent(defendantData, matterInformation) {
            var role;
            var roleType = [];


            if (defendantData.isinfant == 1 || defendantData.isinfant == true) {
                roleType.push("Minor");
            }

            if (defendantData.isstudent == 1 || defendantData.isstudent == true) {
                roleType.push("Student");
            }

            if (defendantData.isemployed == 1 || defendantData.isemployed == true) {
                roleType.push("Employed");
            }

            if (defendantData.contactid) {
                defendantData.contactid.phone_work = utils.isNotEmptyVal(defendantData.contactid.phone_work) ? defendantData.contactid.phone_work : '';
                defendantData.contactid.phone_home = utils.isNotEmptyVal(defendantData.contactid.phone_home) ? defendantData.contactid.phone_home : '';
                defendantData.contactid.phone_cell = utils.isNotEmptyVal(defendantData.contactid.phone_cell) ? defendantData.contactid.phone_cell : '';
                defendantData.contactid.emailid = utils.isNotEmptyVal(defendantData.contactid.emailid) ? defendantData.contactid.emailid : '';
                defendantData.contactid.contact_note = utils.isNotEmptyVal(defendantData.contactid.contact_note) ? defendantData.contactid.contact_note : '';
                defendantData.ssn = utils.isNotEmptyVal(defendantData.ssn) ? defendantData.ssn : '';
                defendantData.dateofbirth = utils.isNotEmptyVal(defendantData.dateofbirth) ? defendantData.dateofbirth : '';

                defendantData.gender = utils.isNotEmptyVal(defendantData.gender) ? defendantData.gender : '';
            }
            else {
                defendantData.contactid = {};
                defendantData.contactid.firstname = '';
                defendantData.contactid.lastname = '';
                defendantData.contactid.streetCityStateZip = '';
                defendantData.contactid.phone_work = '';
                defendantData.contactid.phone_home = '';
                defendantData.contactid.phone_cell = '';
                defendantData.contactid.emailid = '';
                defendantData.contactid.contact_note = '';
                defendantData.ssn = '';
                defendantData.dateofbirth = '';
                defendantData.gender = '';
            }


            var strVar = "";
            strVar += "<html><head><title>Defendant Report<\/title>";
            strVar += "<link rel='shortcut icon' href='favicon.ico' type='image\/vnd.microsoft.icon'>";
            strVar += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}} td{padding:6px 0;}</style>";
            strVar += "<\/head>";
            strVar += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=\"styles\/images\/logo.png \" width='200px'\/>";
            strVar += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'\/>Defendant Report<\/h1>";
            strVar += "";
            angular.forEach(matterInformation, function (val, key) {
                strVar += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;font-size: 12pt;' class='labelTxt'>";
                strVar += "<label><strong>" + key + " : </strong></label>";
                strVar += "<span style='padding:5px; '>  " + utils.removeunwantedHTML(val) + '</span>';
                strVar += "</div>";
            });
            strVar += "<div style=\"width:100%; clear:both\"><button onclick=\"window.print()\" style=\"margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;\" id=\"printBtn\">Print<\/button><\/div>";
            strVar += "    ";
            strVar += "    ";
            strVar += "<h2 style='padding:10px 5px 0; margin:0'>" + utils.removeunwantedHTML(defendantData.contactid.firstname) + " " + utils.removeunwantedHTML(defendantData.contactid.lastname) + "</h2>";
            strVar += "<table style='width:100%'><tr><td style='vertical-align:top; width:60%'><table style='width:100%'><tr><th style='text-align:left;border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:10px 5px' colspan='2'>Defendant Details</th></tr>";
            strVar += "<tr><td style='width:50%'><table><tr>";
            strVar += "<tr><td style='vertical-align:top'>Role:</td><td><strong>" + defendantData.type + "</strong></td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Phone(Work):</td><td>" + defendantData.contactid.phone_work + "</td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Phone(home):</td><td>" + defendantData.contactid.phone_home + "</td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Phone(Cell):</td><td>" + defendantData.contactid.phone_cell + "</td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Email:</td><td>" + defendantData.contactid.emailid + "</td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Address:</td><td>" + utils.removeunwantedHTML(defendantData.contactid.streetCityStateZip) + "</td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Note:</td><td><pre style='white-space: pre-wrap;' class='pre-default'>" + utils.removeunwantedHTML(defendantData.contactid.contact_note) + "</pre></td></tr>";
            strVar += "</table></td><td style='vertical-align:top'>";
            strVar += "<table>";
            strVar += "<tr><td>SSN:</td><td><strong>" + defendantData.ssn + "</strong></td></tr>";
            strVar += "<tr><td>DOB:</td><td><strong>" + defendantData.dateofbirth + "</strong></td></tr>";
            strVar += "<tr><td>Gender:</td><td><strong>" + defendantData.gender + "</strong></td></tr>";


            strVar += "<tr><td></td><td></td></tr>";
            strVar += "<tr><td></td><td></td></tr>";
            strVar += "</table></td></tr></table>";
            strVar += "<td  style='vertical-align:top; width:1px;'>";
            strVar += "<td  style='vertical-align:top; width:1px; border-left:1px solid #ccc'>";
            strVar += "<td  style='vertical-align:top; width:40%'>";
            if (defendantData.defendant_otherparty_id) {
                strVar += "<table style='width:100%'><tr><th style='text-align:left;border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:10px 5px' colspan='2'>Associated Other Parties</th></tr>";
                for (var i = 0; i < defendantData.defendant_otherparty_id.length; i++) {
                    defendantData.defendant_otherparty_id[i].firstname = utils.isNotEmptyVal(defendantData.defendant_otherparty_id[i].firstname) ? defendantData.defendant_otherparty_id[i].firstname : '';
                    defendantData.defendant_otherparty_id[i].lastname = utils.isNotEmptyVal(defendantData.defendant_otherparty_id[i].lastname) ? defendantData.defendant_otherparty_id[i].lastname : '';
                    defendantData.defendant_otherparty_id[i].phone_work = utils.isNotEmptyVal(defendantData.defendant_otherparty_id[i].phone_work) ? defendantData.defendant_otherparty_id[i].phone_work : '';
                    defendantData.defendant_otherparty_id[i].phone_home = utils.isNotEmptyVal(defendantData.defendant_otherparty_id[i].phone_home) ? defendantData.defendant_otherparty_id[i].phone_home : '';
                    defendantData.defendant_otherparty_id[i].phone_cell = utils.isNotEmptyVal(defendantData.defendant_otherparty_id[i].phone_cell) ? defendantData.defendant_otherparty_id[i].phone_cell : '';
                    defendantData.defendant_otherparty_id[i].emailid = utils.isNotEmptyVal(defendantData.defendant_otherparty_id[i].emailid) ? defendantData.defendant_otherparty_id[i].emailid : '';
                    defendantData.defendant_otherparty_id[i].streetCityStateZip = utils.isNotEmptyVal(defendantData.defendant_otherparty_id[i].streetCityStateZip) ? defendantData.defendant_otherparty_id[i].streetCityStateZip : '';
                    defendantData.defendant_otherparty_id[i].contact_note = utils.isNotEmptyVal(defendantData.defendant_otherparty_id[i].contact_note) ? defendantData.defendant_otherparty_id[i].contact_note : '';


                    strVar += "<tr><td style='border-bottom:1px solid #ccc;padding:10px 5px'><strong>" + utils.removeunwantedHTML(defendantData.defendant_otherparty_id[i].firstname) + " " + utils.removeunwantedHTML(defendantData.defendant_otherparty_id[i].lastname) + "</strong></td><tr>";
                    strVar += "<tr><td style='width:50%'><table style='width:100%'><tr>";
                    strVar += "<tr><td style='vertical-align:top'>Role:</td><td>" + defendantData.defendant_otherparty_id[i].contactrolename + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Phone(Work):</td><td>" + defendantData.defendant_otherparty_id[i].phone_work + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Phone(home):</td><td>" + defendantData.defendant_otherparty_id[i].phone_home + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Phone(Cell):</td><td>" + defendantData.defendant_otherparty_id[i].phone_cell + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Email:</td><td>" + defendantData.defendant_otherparty_id[i].emailid + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Address:</td><td>" + utils.removeunwantedHTML(defendantData.defendant_otherparty_id[i].streetCityStateZip) + "</td></tr>";
                    strVar += "<tr><td style='vertical-align:top'>Note:</td><td><pre style='white-space: pre-wrap;' class='pre-default'>" + utils.removeunwantedHTML(defendantData.defendant_otherparty_id[i].contact_note) + "</pre></td></tr>";
                }
                strVar += "</table>";
                strVar += "</table>";
            }
            strVar += "</table>";
            return strVar;
        }

        // OTHER PARTY PRINT
        function printOtherParty(otherPartyData) {
            var role;
            var roleType = [];

            if (otherPartyData.isinfant == 1 || otherPartyData.isinfant == true) {
                roleType.push("Minor");
            }

            if (otherPartyData.isstudent == 1 || otherPartyData.isstudent == true) {
                roleType.push("Student");
            }

            if (otherPartyData.isemployed == 1 || otherPartyData.isemployed == true) {
                roleType.push("Employed");
            }


            otherPartyData.phone_work = utils.isNotEmptyVal(otherPartyData.phone_work) ? otherPartyData.phone_work : '';
            otherPartyData.phone_home = utils.isNotEmptyVal(otherPartyData.phone_home) ? otherPartyData.phone_home : '';
            otherPartyData.phone_cell = utils.isNotEmptyVal(otherPartyData.phone_cell) ? otherPartyData.phone_cell : '';
            otherPartyData.emailid = utils.isNotEmptyVal(otherPartyData.emailid) ? otherPartyData.emailid : '';
            otherPartyData.contact_note = utils.isNotEmptyVal(otherPartyData.contact_note) ? otherPartyData.contact_note : '';
            otherPartyData.ssn = utils.isNotEmptyVal(otherPartyData.ssn) ? otherPartyData.ssn : '';
            otherPartyData.dateofbirth = utils.isNotEmptyVal(otherPartyData.dateofbirth) ? moment.unix(otherPartyData.dateofbirth).utc().format('MM/DD/YYYY') : '';
            otherPartyData.gender = utils.isNotEmptyVal(otherPartyData.gender) ? otherPartyData.gender : '';

            var strVar = "";
            strVar += "<html><head><title>Other Parties Report<\/title>";
            strVar += "<link rel='shortcut icon' href='favicon.ico' type='image\/vnd.microsoft.icon'>";
            strVar += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}} td{padding:6px 0;}</style>";
            strVar += "<\/head>";
            strVar += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=\"styles\/images\/logo.png \" width='200px'\/>";
            strVar += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'\/>Other Parties Report<\/h1>";
            strVar += "";
            strVar += "<div style=\"width:100%; clear:both\"><button onclick=\"window.print()\" style=\"margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;\" id=\"printBtn\">Print<\/button><\/div>";
            strVar += "    ";
            strVar += "    ";
            strVar += "<h2 style='padding:10px 5px 0; margin:0'>" + utils.removeunwantedHTML(otherPartyData.firstname) + " " + (utils.isNotEmptyVal(otherPartyData.lastname) ? utils.removeunwantedHTML(otherPartyData.lastname) : '') + "</h2>";
            strVar += "<table style='width:100%'><tr><td style='vertical-align:top; width:60%'><table style='width:100%'><tr><th style='text-align:left;border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:10px 5px' colspan='2'>Other Parties Details</th></tr>";
            strVar += "<tr><td style='width:50%'><table><tr>";
            strVar += "<tr><td style='vertical-align:top'>Role:</td><td><strong>" + otherPartyData.contactrolename + "</strong></td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Phone(Work):</td><td>" + otherPartyData.phone_work + "</td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Phone(home):</td><td>" + otherPartyData.phone_home + "</td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Phone(Cell):</td><td>" + otherPartyData.phone_cell + "</td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Email:</td><td>" + otherPartyData.emailid + "</td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Address:</td><td>" + utils.removeunwantedHTML(otherPartyData.streetCityStateZip) + "</td></tr>";
            strVar += "<tr><td style='vertical-align:top'>Note:</td><td>" + utils.removeunwantedHTML(otherPartyData.contact_note) + "</td></tr>";
            strVar += "</table></td><td style='vertical-align:top'>";

            strVar += "</td></tr></table>";
            strVar += "<td  style='vertical-align:top; width:1px;'>";
            strVar += "<td  style='vertical-align:top; width:1px; border-left:1px solid #ccc'>";
            strVar += "<td  style='vertical-align:top; width:39%'>";
            if (otherPartyData.party_contact_id) {
                strVar += "<table style='width:100%'><tr><th style='text-align:left;border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:10px 5px' colspan='2'>Associated Party / Parties </th></tr>";

                otherPartyData.party_contact_id.firstname = utils.isNotEmptyVal(otherPartyData.party_contact_id.firstname) ? otherPartyData.party_contact_id.firstname : '';
                otherPartyData.party_contact_id.lastname = utils.isNotEmptyVal(otherPartyData.party_contact_id.lastname) ? otherPartyData.party_contact_id.lastname : '';
                otherPartyData.party_contact_id.phone_work = utils.isNotEmptyVal(otherPartyData.party_contact_id.phone_work) ? otherPartyData.party_contact_id.phone_work : '';
                otherPartyData.party_contact_id.phone_home = utils.isNotEmptyVal(otherPartyData.party_contact_id.phone_home) ? otherPartyData.party_contact_id.phone_home : '';
                otherPartyData.party_contact_id.phone_cell = utils.isNotEmptyVal(otherPartyData.party_contact_id.phone_cell) ? otherPartyData.party_contact_id.phone_cell : '';
                otherPartyData.party_contact_id.emailid = utils.isNotEmptyVal(otherPartyData.party_contact_id.emailid) ? otherPartyData.party_contact_id.emailid : '';
                otherPartyData.party_contact_id.streetCityStateZip = utils.isNotEmptyVal(otherPartyData.party_contact_id.streetCityStateZip) ? otherPartyData.party_contact_id.streetCityStateZip : '';
                otherPartyData.party_contact_id.contact_note = utils.isNotEmptyVal(otherPartyData.party_contact_id.contact_note) ? otherPartyData.party_contact_id.contact_note : '';


                strVar += "<tr><td style='border-bottom:1px solid #ccc;padding:10px 5px'><strong>" + utils.removeunwantedHTML(otherPartyData.party_contact_id.firstname) + " " + utils.removeunwantedHTML(otherPartyData.party_contact_id.lastname) + "</strong></td><tr>";


                strVar += "</table>";
                strVar += "</table>";
            }
            strVar += "</table>";
            return strVar;

        }
        //US#7867
        function printOtherPartyNewGrid(otherPartyData, matterInformation) {
            var html = "<html><head><title>Other related parties</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style></head>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=\"styles\/images\/logo.png \" width='200px'\/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Other related parties</h1><div></div>";
            html += "<body>";
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<tr>";
            angular.forEach(matterInformation, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;font-size: 9pt;'>";
                html += "<label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px; '>  " + utils.removeunwantedHTML(val) + '</span>';
                html += "</div>";
            });
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "</tr>";
            html += '<tr>';
            html += "<th >";
            html += '<tr>';
            html += "<th width='25%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Other Party</th>";
            html += "<th width='25%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Role</th>";
            html += "<th width='25%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Specialty</th>";
            html += "<th width='25%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Associated Party / Parties</th>";
            html += "<th width='25%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Type</th>";
            html += '</tr>';
            html += '</th>';
            html += '</tr>';
            html += '<tbody>';
            // var printWhole = _.sortBy(otherPartyData, 'fname');
            angular.forEach(otherPartyData, function (otherPartyData) {
                var otherPartyFullName = null;
                var fname = otherPartyData.fname;
                var lname = otherPartyData.lname;
                var fullName = fname + ' ' + lname;
                fullName = utils.isEmptyVal(fullName) ? '-' : fullName;
                var role = utils.isEmptyVal(otherPartyData.role) ? '-' : otherPartyData.role;
                var type = utils.isEmptyVal(otherPartyData.added_by) ? '-' : otherPartyData.added_by;
                var specialty = utils.isEmptyVal(otherPartyData.specialty) ? '-' : otherPartyData.specialty;

                var associatedPartyFname = (utils.isNotEmptyVal(otherPartyData.assoParty)) ? (utils.isNotEmptyVal(otherPartyData.assoParty.fname)) ? otherPartyData.assoParty.fname : '' : '';
                var associatedPartyLname = (utils.isNotEmptyVal(otherPartyData.assoParty)) ? (utils.isNotEmptyVal(otherPartyData.assoParty.lname)) ? otherPartyData.assoParty.lname : '' : '';
                if (utils.isNotEmptyVal(otherPartyData.assoParty)) {
                    angular.forEach(otherPartyData.assoParty, function (data) {
                        var associatedPartyFname = utils.isEmptyVal(data.fname) ? '' : data.fname;
                        var associatedPartyLname = utils.isEmptyVal(data.lname) ? '' : data.lname;
                        data.name = associatedPartyFname + ' ' + associatedPartyLname;
                        otherPartyFullName = (utils.isNotEmptyVal(data.name)) ? (utils.isNotEmptyVal(otherPartyFullName)) ? otherPartyFullName + ', ' + data.name : data.name : '-';
                    });
                } else {
                    otherPartyFullName = '-';
                }

                html += '<tr style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px">';
                html += '<td width="25%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;"> ' + utils.removeunwantedHTML(fullName) + '</td>';
                html += '<td width="25%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;">' + utils.removeunwantedHTML(role) + '</td>';
                html += '<td width="25%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;"> ' + utils.removeunwantedHTML(specialty) + '</td>';
                html += '<td width="25%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;"> ' + utils.removeunwantedHTML(otherPartyFullName) + '</td>';
                html += '<td width="25%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;"> ' + utils.removeunwantedHTML(type) + '</td>';
                html += '</tr>';
            });
            html += '</tbody>';
            html += "</body>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</table>";
            html += "</html>";
            return html;
        }

        // OTHER PARTY PRINT
        function printOtherPartyAll(otherPartyData, matterInformation) {
            var html = "<html><head><title>Other Parties Report</title>";
            html += "<link rel='shortcut icon' href='favicon.ico' type='image/vnd.microsoft.icon'>";
            html += "<style>.labelTxt{text-transform:lowercase;} .labelTxt:first-letter{text-transform:uppercase}</style>";
            html += "<style>table tr { page-break-inside: always; }  </style></head>";
            html += "<body class='page' style='font-family:calibri; margin:0.5cm 2cm;font-size: 8pt; '><img src=\"styles\/images\/logo.png \" width='200px'\/>";
            html += "<h1 style='float:right'><img src='favicon.ico' style='position: relative; top: 2px; right: 6px;'/>Other Parties Report</h1><div></div>";
            html += "<body>";
            html += "<table style='border-collapse: collapse;border:1px solid #e2e2e2;text-align: left; font-size:8pt; margin-top:10px; width:100%' cellspacing='0' cellpadding='0' border='0' >";
            html += "<tr>";

            angular.forEach(matterInformation, function (val, key) {
                html += "<div style='padding:10px;  border-bottom:1px solid #e2e2e2;font-size: 9pt;'>";
                html += "<label><strong>" + key + " : </strong></label>";
                html += "<span style='padding:5px; '>  " + utils.removeunwantedHTML(val) + '</span>';
                html += "</div>";
            });
            html += '<div style="width:100%; clear:both"><button onclick="window.print()" style="margin:10px 0px; background:#004E75; color:#fff; border:none; padding:10px; font-weight:bold;" id="printBtn">Print</button></div>';
            html += "</tr>";
            html += '<tr>';
            html += "<th >";
            html += '<tr>';
            html += "<th width='30%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Other Party</th>";
            html += "<th width='10%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Type</th>";
            html += "<th width='15%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Role</th>";
            html += "<th width='20%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Specialty</th>";
            html += "<th width='25%' style='border:1px solid #e2e2e2;background-color:#E9EEF0!important;-webkit-print-color-adjust:exact; border-collapse:collapse; padding:5px; '>Associated Party / Parties</th>";


            html += '</tr>';
            html += '</th>';
            html += '</tr>';

            html += '<tbody>';
            angular.forEach(otherPartyData, function (otherPartyInfo) {
                if (otherPartyInfo.isOtherRelatedPArty) {
                    var otherPartyFullName = null;
                    var fname = otherPartyInfo.firstname;
                    var lname = otherPartyInfo.lastname;
                    var fullName = fname + ' ' + lname;
                    fullName = utils.isEmptyVal(fullName) ? '-' : fullName;
                    var role = utils.isEmptyVal(otherPartyInfo.role) ? '-' : otherPartyInfo.role;
                    //  var type = utils.isEmptyVal(otherPartyInfo.added_by) ? '-' : otherPartyInfo.added_by;
                    for (var i = 0; i < otherPartyInfo.added_bys.length; i++) {
                        if (utils.isNotEmptyVal(otherPartyInfo.added_bys != null && otherPartyInfo.added_bys.length > 0)) {
                            var type = _.pluck(otherPartyInfo.added_bys, '');
                        }
                    }
                    var specialty = utils.isEmptyVal(otherPartyInfo.specialty) ? '-' : otherPartyInfo.specialty;
                    var associatedPartyFname = (utils.isNotEmptyVal(otherPartyInfo.assoParty)) ? (utils.isNotEmptyVal(otherPartyInfo.assoParty.fname)) ? otherPartyInfo.assoParty.fname : '' : '';
                    var associatedPartyLname = (utils.isNotEmptyVal(otherPartyInfo.assoParty)) ? (utils.isNotEmptyVal(otherPartyInfo.assoParty.lname)) ? otherPartyInfo.assoParty.lname : '' : '';
                    if (utils.isNotEmptyVal(otherPartyInfo.assoParty)) {
                        angular.forEach(otherPartyInfo.assoParty, function (data) {
                            var associatedPartyFname = utils.isEmptyVal(data.fname) ? '' : data.fname;
                            var associatedPartyLname = utils.isEmptyVal(data.lname) ? '' : data.lname;
                            data.name = associatedPartyFname + ' ' + associatedPartyLname;

                            otherPartyFullName = (utils.isNotEmptyVal(data.name)) ? (utils.isNotEmptyVal(otherPartyFullName)) ? otherPartyFullName + ', ' + data.name : data.name : '-';
                        });
                    } else {
                        otherPartyFullName = '-';
                    }
                } else {
                    var otherPartyFullName = null;
                    var fname = (utils.isNotEmptyVal(otherPartyInfo.firstname)) ? otherPartyInfo.firstname : '';
                    var lname = (utils.isNotEmptyVal(otherPartyInfo.lastname)) ? otherPartyInfo.lastname : '';
                    var role = (utils.isNotEmptyVal(otherPartyInfo.contactrolename)) ? otherPartyInfo.contactrolename : '-';
                    var otherPartyFname = (utils.isNotEmptyVal(otherPartyInfo.party_contact_id)) ? (utils.isNotEmptyVal(otherPartyInfo.party_contact_id.firstname)) ? otherPartyInfo.party_contact_id.firstname : '' : '';
                    var otherPartyLname = (utils.isNotEmptyVal(otherPartyInfo.party_contact_id)) ? (utils.isNotEmptyVal(otherPartyInfo.party_contact_id.lastname)) ? otherPartyInfo.party_contact_id.lastname : '' : '';
                    var specialty = (utils.isNotEmptyVal(otherPartyInfo.specialty)) ? otherPartyInfo.specialty : '-';
                    // angular.forEach(otherPartyInfo.party_contact_id, function (data) {
                    //     otherPartyInfo.party_contact_id = otherPartyInfo.party_contact_id = _.uniq(otherPartyInfo.party_contact_id, function (item) {
                    //         return item.contactid;
                    //     });


                    // });
                    otherPartyInfo.party_contact_id = _.uniq(otherPartyInfo.party_contact_id, function (item) {
                        return item.associated_party_id;
                    });
                    angular.forEach(otherPartyInfo.party_contact_id, function (data) {
                        otherPartyFullName = (utils.isNotEmptyVal(data.name)) ? (utils.isNotEmptyVal(otherPartyFullName)) ? otherPartyFullName + ', ' + data.name : data.name : '-';
                    });
                }

                html += '<tr style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px">';
                html += '<td width="30%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;"> ' + utils.removeunwantedHTML(fname) + ' ' + utils.removeunwantedHTML(lname) + '</td>';
                if (otherPartyInfo.isOtherRelatedPArty) {
                    var addedBy = otherPartyInfo.added_bys.toString();
                    html += '<td width="10%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;">' + utils.removeunwantedHTML(addedBy) + '</td>';
                } else {
                    html += '<td width="15%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;">' + '-' + '</td>';
                }
                html += '<td width="20%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;">' + utils.removeunwantedHTML(role) + '</td>';
                html += '<td width="20%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;">' + utils.removeunwantedHTML(specialty) + '</td>';
                html += '<td width="25%" style="border:1px solid #e2e2e2; border-collapse:collapse; text-align:left; padding:5px;vertical-align: top;"> ' + utils.removeunwantedHTML(otherPartyFullName) + '</td>';
                html += '</tr>';

            });
            html += '</tbody>';
            html += "</body>";
            html += "<style>@media print{ #printBtn{display:none} thead {display: table-header-group;}}";
            html += "tbody {display:table-row-group;}</style>";
            html += "</table>";
            html += "</html>";
            return html;
        }

        function modifyEntityPermissionForMattercollaboration(data) {
            var deferred = $q.defer();
            var token = {
                'clxAuthToken': localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: serviceBase.modifyEntityPermissionForMattercollaborationURL,
                method: "PUT",
                headers: token,
                data: data
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject(error);
            });
            return deferred.promise;

        }

        function endUserCollaboration(data) {
            var deferred = $q.defer();
            var token = {
                'clxAuthToken': localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: serviceBase.endUserCollaborationURL,
                method: "PUT",
                headers: token,
                data: data
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject(error);
            });
            return deferred.promise;

        }

        function disableEntityAccess(data) {

            var deferred = $q.defer();
            var token = {
                'clxAuthToken': localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            $http({
                url: serviceBase.disableEntityAccessURL,
                method: "PUT",
                headers: token,
                data: data
            }).then(function (response) {
                deferred.resolve(response.data);
            }, function (error) {
                deferred.reject(error);
            });
            return deferred.promise;


        }


    };
})();
