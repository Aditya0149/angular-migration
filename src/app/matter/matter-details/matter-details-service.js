(function () {
    'use strict';
    angular
        .module('cloudlex.matter')
        .factory('matterDetailsService', matterDetailsService);

    matterDetailsService.$inject = ['$http', "globalConstants", "$q"];

    function matterDetailsService($http, globalConstants, $q) {

        var getNegligenceLiabilityInfoUrl = globalConstants.webServiceBase + 'litigationmatter/litigationmatter/';
        var saveNegligenceLiabilityInfoUrl = globalConstants.webServiceBase + 'litigationmatter/litigationmatter/';
        // Off-Drupal

        var getMedicalRecordUrl = globalConstants.webServiceBase + 'medical/medicalrecord/';
        var getAllPlaintiffsUrl = globalConstants.webServiceBase + 'allparties/plaintiffs/';
        var addMedicalRecordUrl = globalConstants.webServiceBase + 'medical/medicalrecord.json';
        var getBodilyInjuryDataUrl = globalConstants.webServiceBase + 'allparties/getbodilyinjuries/';
        var updateBodilyInjuryUrl = globalConstants.webServiceBase + 'allparties/getbodilyinjuries/';
        var getContactsUrl = globalConstants.webServiceBase + 'lexviacontacts/GetContactlimit';
        var editMedicalRecordUrl = globalConstants.webServiceBase + 'medical/medicalrecord/';
        var deleteMedicalRecordUrl = globalConstants.webServiceBase + 'medical/medicalrecord/1';
        var getInsauranceUrl = globalConstants.webServiceBase + 'insuranceliens/insurance/';
        var addInsauranceRecordUrl = globalConstants.webServiceBase + 'insuranceliens/insurance';
        var editInsuranceRecordUrl = globalConstants.webServiceBase + 'insuranceliens/insurance/';
        var deleteInsuranceUrl = globalConstants.webServiceBase + 'insuranceliens/insurance/1';
        //Off-Drupal

        var getLiensUrl = globalConstants.webServiceBase + 'insuranceliens/liens/';
        var addLienUrl = globalConstants.webServiceBase + 'insuranceliens/liens';
        var editLienUrl = globalConstants.webServiceBase + 'insuranceliens/liens/';
        var deleteLienUrl = globalConstants.webServiceBase + 'insuranceliens/liens/1';

        //Off-Drupal 

        var getExpenseTypeUrl = globalConstants.webServiceBase + 'insuranceliens/getexpensetypes/1';
        //off drupal get expense type
        var addExpenseRecordUrl = globalConstants.webServiceBase + 'insuranceliens/expense';
        //off drupal add expense
        var editExpenseRecordUrl = globalConstants.webServiceBase + 'insuranceliens/expense/';
        //Off drupal edit expense info
        var getExpensesUrl = globalConstants.webServiceBase + 'insuranceliens/expense/';
        //off drupal get expense info
        var deleteExpensesUrl = globalConstants.webServiceBase + 'insuranceliens/expense/1';
        //off drupal delete expense
        var getMedicalBillsInfoUrl = globalConstants.webServiceBase + 'medical/medicalbill/';
        var addMedicalBillsInfoUrl = globalConstants.webServiceBase + 'medical/medicalbill';
        var editMedicalBillsInfoUrl = globalConstants.webServiceBase + 'medical/medicalbill/';
        var deleteMedicalBillsInfoUrl = globalConstants.webServiceBase + 'medical/medicalbill/1';
        var matterInfoUrl = globalConstants.webServiceBase + "matter/matter_index_edit/";

        //Off-drupal Medical Bills

        //Off-drupal Medical Info

        var unLinkDocument = globalConstants.webServiceBase + 'lexviadocuments/linkdocument/1';
        //off-drupal Unlink document
        var unlinkDocument1 = globalConstants.javaWebServiceBaseV4 + 'documents';

        //export for all matter details
        var downloadMatterAPExpensesUrl = globalConstants.webServiceBase + "reports/export_report.json";
        //var downloadMedicalBillUrl

        //US13403 : Export - PHP to Java

        //  US16929: Expense Manager (Quickbooks integration)
        //Move Expense details to Expense manager
        var moveToExpenseManagerUrl = globalConstants.javaWebServiceBaseV4 + "expense_manager/movetoEM";

        if (!globalConstants.useApim) {
            var getsettlementtDataUrl = globalConstants.javaWebServiceBaseV4 + 'settlements/settlement-payment/';
            var getsettlementtDataUrl1 = globalConstants.javaWebServiceBaseV4 + 'settlements/settlement-update/';
            var savePaymentDataUrl = globalConstants.javaWebServiceBaseV4 + 'settlements/settlement-payment';
            var editPaymentDataUrl = globalConstants.javaWebServiceBaseV4 + 'settlements/settlement-payment/';
            var deletepaymentRecordUrl = globalConstants.javaWebServiceBaseV4 + 'settlements/settlement-payment/1';
            var saveCalculation = globalConstants.javaWebServiceBaseV4 + 'settlements/settlement-calculator';
            var downloadMatterDetailsUrl = globalConstants.javaWebServiceBaseV4 + "settlements/settlement-payment-export";
            var negotiation = globalConstants.javaWebServiceBaseV4 + 'settlements';
            var getExpenseTypeUrl1 = globalConstants.javaWebServiceBaseV4 + 'expense/expense-type';
            var addExpenseRecordUrl1 = globalConstants.javaWebServiceBaseV4 + 'expense';
            var editExpenseRecordUrl1 = globalConstants.javaWebServiceBaseV4 + 'expense';
            var getExpensesUrl1 = globalConstants.javaWebServiceBaseV4 + 'expense/';
            var deleteExpensesUrl1 = globalConstants.javaWebServiceBaseV4 + 'expense';
            var downloadAllExpenseUrl = globalConstants.javaWebServiceBaseV4 + "expense/export-expense";
            var downloadLiensExpenseUrl = globalConstants.javaWebServiceBaseV4 + "expense/export-expense-liens";
            var downloadInsuranceUrl = globalConstants.javaWebServiceBaseV4 + "insurances/export-insurance";
            var getInsauranceUrl1 = globalConstants.javaWebServiceBaseV4 + 'insurances/';
            var addInsauranceRecordUrl1 = globalConstants.javaWebServiceBaseV4 + 'insurances';
            var editInsuranceRecordUrl1 = globalConstants.javaWebServiceBaseV4 + 'insurances/';
            var deleteInsuranceUrl1 = globalConstants.javaWebServiceBaseV4 + 'insurances';
            var downloadMattersLiensUrl = globalConstants.javaWebServiceBaseV4 + "liens/export-lien";
            var getLiensUrl1 = globalConstants.javaWebServiceBaseV4 + 'liens/';
            var addLienUrl1 = globalConstants.javaWebServiceBaseV4 + 'liens';
            var editLienUrl1 = globalConstants.javaWebServiceBaseV4 + 'liens/';
            var deleteLienUrl1 = globalConstants.javaWebServiceBaseV4 + 'liens';
            var getMedicalBillsInfoUrl1 = globalConstants.javaWebServiceBaseV4 + 'medicalbills/';
            var addMedicalBillsInfoUrl1 = globalConstants.javaWebServiceBaseV4 + 'medicalbills/';
            var deleteMedicalBillsInfoUrl1 = globalConstants.javaWebServiceBaseV4 + 'medicalbills';
            var editMedicalBillsInfoUrl1 = globalConstants.javaWebServiceBaseV4 + 'medicalbills/';
            var downloadMedicalBillUrl = globalConstants.javaWebServiceBaseV4 + "medicalbills/export-medicalbill";
            var getMedicalRecordUrl1 = globalConstants.javaWebServiceBaseV4 + 'medicalinformations/';
            var addMedicalRecordUrl1 = globalConstants.javaWebServiceBaseV4 + 'medicalinformations';
            var deleteMedicalRecordUrl1 = globalConstants.javaWebServiceBaseV4 + 'medicalinformations';
            var editMedicalRecordUrl1 = globalConstants.javaWebServiceBaseV4 + 'medicalinformations/';
            var downloadMedicalInformationUrl = globalConstants.javaWebServiceBaseV4 + "medicalinformations/export-medicalinfo";
            var getNegligenceLiabilityInfoUrl1 = globalConstants.javaWebServiceBaseV4 + 'negligenceliabilities/';
            var saveNegligenceLiabilityInfoUrl1 = globalConstants.javaWebServiceBaseV4 + 'negligenceliabilities/';
        } else {
            var getsettlementtDataUrl = globalConstants.matterBase + 'settlements/v1/settlement-payment/';
            var getsettlementtDataUrl1 = globalConstants.matterBase + 'settlements/v1/settlement-update/';
            var savePaymentDataUrl = globalConstants.matterBase + 'settlements/v1/settlement-payment';
            var editPaymentDataUrl = globalConstants.matterBase + 'settlements/v1/settlement-payment/';
            var deletepaymentRecordUrl = globalConstants.matterBase + 'settlements/v1/settlement-payment/1';
            var saveCalculation = globalConstants.matterBase + 'settlements/v1/settlement-calculator';
            var downloadMatterDetailsUrl = globalConstants.matterBase + "settlements/v1/settlement-payment-export";
            var negotiation = globalConstants.matterBase + 'settlements/v1';
            var getExpenseTypeUrl1 = globalConstants.matterBase + 'expense/v1/expense-type';
            var addExpenseRecordUrl1 = globalConstants.matterBase + 'expense/v1';
            var editExpenseRecordUrl1 = globalConstants.matterBase + 'expense/v1';
            var getExpensesUrl1 = globalConstants.matterBase + 'expense/v1/';
            var deleteExpensesUrl1 = globalConstants.matterBase + 'expense/v1';
            var downloadAllExpenseUrl = globalConstants.matterBase + "expense/v1/export-expense";
            var downloadLiensExpenseUrl = globalConstants.matterBase + "expense/v1/export-expense-liens";
            var downloadInsuranceUrl = globalConstants.matterBase + "insurances/v1/export-insurance";
            var getInsauranceUrl1 = globalConstants.matterBase + 'insurances/v1/';
            var addInsauranceRecordUrl1 = globalConstants.matterBase + 'insurances/v1';
            var editInsuranceRecordUrl1 = globalConstants.matterBase + 'insurances/v1/';
            var deleteInsuranceUrl1 = globalConstants.matterBase + 'insurances/v1';
            var downloadMattersLiensUrl = globalConstants.matterBase + "liens/v1/export-lien";
            var getLiensUrl1 = globalConstants.matterBase + 'liens/v1/';
            var addLienUrl1 = globalConstants.matterBase + 'liens/v1';
            var editLienUrl1 = globalConstants.matterBase + 'liens/v1/';
            var deleteLienUrl1 = globalConstants.matterBase + 'liens/v1';
            var getMedicalBillsInfoUrl1 = globalConstants.matterBase + 'medicalbills/v1/';
            var addMedicalBillsInfoUrl1 = globalConstants.matterBase + 'medicalbills/v1/';
            var deleteMedicalBillsInfoUrl1 = globalConstants.matterBase + 'medicalbills/v1';
            var editMedicalBillsInfoUrl1 = globalConstants.matterBase + 'medicalbills/v1/';
            var downloadMedicalBillUrl = globalConstants.matterBase + "medicalbills/v1/export-medicalbill";
            var getMedicalRecordUrl1 = globalConstants.matterBase + 'medicalinformations/v1/';
            var addMedicalRecordUrl1 = globalConstants.matterBase + 'medicalinformations/v1';
            var deleteMedicalRecordUrl1 = globalConstants.matterBase + 'medicalinformations/v1';
            var editMedicalRecordUrl1 = globalConstants.matterBase + 'medicalinformations/v1/';
            var downloadMedicalInformationUrl = globalConstants.matterBase + "medicalinformations/v1/export-medicalinfo";
            var getNegligenceLiabilityInfoUrl1 = globalConstants.matterBase + 'negligenceliabilities/v1/';
            var saveNegligenceLiabilityInfoUrl1 = globalConstants.matterBase + 'negligenceliabilities/v1/';
        }

        //TODO : move to utils
        function getParams(params) {
            var querystring = "";
            angular.forEach(params, function (value, key) {
                querystring += key + "=" + value;
                querystring += "&";
            });
            return querystring.slice(0, querystring.length - 1);
        }

        return {
            getMatterInfo: getMatterInfo,
            setNamePropForPlaintiffs: setNamePropForPlaintiffs,
            setNamePropForOtherParties: setNamePropForOtherParties,
            setNamePropForContacts: setNamePropForContacts,
            setDataPropForContactsFromOffDrupalToNormalContact: setDataPropForContactsFromOffDrupalToNormalContact,
            setNamePropForContactsOffDrupal: setNamePropForContactsOffDrupal,
            getNegligenceLiabilityInfo: getNegligenceLiabilityInfo,
            saveNegligenceLiabilityInfo: saveNegligenceLiabilityInfo,
            getMedicalInfo_BEFORE_OFF_DRUPAL: getMedicalInfo_BEFORE_OFF_DRUPAL,
            getMedicalInfo: getMedicalInfo,
            getPlaintiffs: getPlaintiffs,
            getExpenseType: getExpenseType,
            getExpenseTypePHP: getExpenseTypePHP,
            getBodilyInjuryData: getBodilyInjuryData,
            updateBodilyInjuryData: updateBodilyInjuryData,
            saveMedicalRecord: saveMedicalRecord,
            editMedicalRecord: editMedicalRecord,
            deleteMedicalRecords: deleteMedicalRecords,
            getContactsByName: getContactsByName,
            getInsauranceInfo: getInsauranceInfo,
            getInsauranceInfo_BEFORE_OFF_DRUPAL: getInsauranceInfo_BEFORE_OFF_DRUPAL,
            addInsauranceRecord: addInsauranceRecord,
            editInsauranceRecord: editInsauranceRecord,
            deleteInsurance: deleteInsurance,
            getLiensInfo: getLiensInfo,
            getLiensInfo_BEFORE_OFF_DRUPAL: getLiensInfo_BEFORE_OFF_DRUPAL,
            addLienRecord: addLienRecord,
            editLienRecord: editLienRecord,
            deleteLienRecord: deleteLienRecord,
            getExpensesInfo: getExpensesInfo,
            getExpensesInfo_BEFORE_OFF_DRUPAL: getExpensesInfo_BEFORE_OFF_DRUPAL,
            addExpenseRecord: addExpenseRecord,
            editExpenseRecord: editExpenseRecord,
            deleteExpenseRecord: deleteExpenseRecord,
            getMedicalBillsInfo: getMedicalBillsInfo,
            getMedicalBillsInfo_BEFORE_OFF_DRUPAL: getMedicalBillsInfo_BEFORE_OFF_DRUPAL,
            deleteMedicalBillsInfo: deleteMedicalBillsInfo,
            addMedicalBillsInfo: addMedicalBillsInfo,
            editMedicalBillsInfo: editMedicalBillsInfo,
            downloadMedicalInfo: downloadMedicalInfo,
            downloadMedicalBill: downloadMedicalBill,
            downloadInsurance: downloadInsurance,
            downloadLiens: downloadLiens,
            downloadExpense: downloadExpense,
            downloadAPExpense: downloadAPExpense,
            unlinkDocument: unlinkDocument,
            unlinkDocumentPHP: unlinkDocumentPHP,

            // US#8114--start
            getsettlementData: getsettlementData,
            updateSettlementInfo: updateSettlementInfo,
            savePaymentRecord: savePaymentRecord,
            editPaymentRecord: editPaymentRecord,
            deletePaymentRecords: deletePaymentRecords,
            downloadPaymentInfo: downloadPaymentInfo,
            //--end
            getNegotiation: getNegotiation,
            saveNegotiation: saveNegotiation,
            saveSettlementCal: saveSettlementCal,
            deleteNeg: deleteNeg,
            deleteCalculator: deleteCalculator,
            saveNegotiationEdit: saveNegotiationEdit,
            getDetails: getDetails,
            saveDetails: saveDetails,

            //  US16929: Expense Manager (Quickbooks integration)
            //Move Expense details to Expense manager
            moveToExpenseManager: moveToExpenseManager

        };

        function getNegotiation(matterId) {
            var deferred = $q.defer();
            var url = negotiation + '/' + matterId;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function getDetails(matterId) {
            var deferred = $q.defer();
            var url = negotiation + '/plaintiff-recovery-details/' + matterId;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function saveSettlementCal(data) {
            var deferred = $q.defer();
            var url = saveCalculation;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "POST",
                headers: token, // Add params into headers
                data: data
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function saveDetails(data) {
            var deferred = $q.defer();
            var url = negotiation + '/plaintiff-recovery-details/' + data.plaintiff_id;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            delete data.plaintiff_id;
            $http({
                url: url,
                method: "PUT",
                headers: token, // Add params into headers
                data: data
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function saveNegotiation(data) {
            var deferred = $q.defer();
            var url = negotiation;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "POST",
                headers: token, // Add params into headers
                data: data
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function deleteNeg(id) {
            var deferred = $q.defer();
            var url = negotiation + '?settlementNegotiationIds=' + id;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: url,
                method: "DELETE",
                headers: token,
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
        }

        function deleteCalculator(id) {
            var deferred = $q.defer();
            var url = saveCalculation + '/' + id;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: url,
                method: "DELETE",
                headers: token,
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
        }

        function saveNegotiationEdit(data) {
            var deferred = $q.defer();
            var url = negotiation + '/' + data.negotiation_id;
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            delete data.negotiation_id;
            return $http({
                url: url,
                method: "PUT",
                headers: token,
                data: data,
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
        }

        function unlinkDocumentPHP(matterDetailId, matterDetailName) {
            var data = { matter_detail_id: matterDetailId, matter_detail_name: matterDetailName };
            return $http.put(unLinkDocument, data);
        }

        function unlinkDocument(matterDetailId, matterDetailName) {
            var deferred = $q.defer();
            var url = unlinkDocument1 + '/link?more_info_type_id=' + matterDetailId.toString();
            var data = { more_info_type: matterDetailName };
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: url,
                method: "DELETE",
                headers: token,
                data: data
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
        }

        // US13403: Export Expense List(PHP to Java)
        function downloadExpense(matterId, show, party_role) {
            var party_role = angular.isDefined(party_role) ? party_role : '';
            var deferred = $q.defer();
            var url = downloadAllExpenseUrl;
            var params = { pageNum: 1, pageSize: 1000, show: show, party_role: party_role, matterId: matterId, fileName: "Expenses_List" };
            url += '?' + getParams(params);
            // var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                // headers: token, // Add params into headers
                responseType: 'arraybuffer'
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }

        // US13403: Export ExpenseLiens List(PHP to Java)
        function downloadAPExpense(matterId, show, party_role) {
            var party_role = angular.isDefined(party_role) ? party_role : '';
            var deferred = $q.defer();
            var url = downloadLiensExpenseUrl;
            var params = { pageNum: 1, pageSize: 1000, show: show, party_role: party_role, matterId: matterId, fileName: "Expenses_Liens_List" };
            url += '?' + getParams(params);
            // var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                // headers: token, // Add params into headers
                responseType: 'arraybuffer'
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }

        // US13403: Export Liens List(PHP to Java)
        function downloadLiens(matterId, show, party_role) {
            var party_role = angular.isDefined(party_role) ? party_role : '';
            var deferred = $q.defer();
            var url = downloadMattersLiensUrl;
            var params = { pageNum: 1, pageSize: 1000, show: show, party_role: party_role, matterId: matterId, fileName: "Lien-List" };
            url += '?' + getParams(params);
            // var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                // headers: token, // Add params into headers
                responseType: 'arraybuffer'
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }

        // US13403: Export Insurance List(PHP to Java )
        function downloadInsurance(matterId, show, party_role) {
            var party_role = angular.isDefined(party_role) ? party_role : '';
            var deferred = $q.defer();
            var url = downloadInsuranceUrl;
            var params = { pageNum: 1, pageSize: 1000, show: show, party_role: party_role, matterId: matterId, fileName: "MedicalBills-List" };
            url += '?' + getParams(params);
            // var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                // headers: token, // Add params into headers
                responseType: 'arraybuffer'
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }

        // US13403: Export MedicalBill List(PHP to Java )
        function downloadMedicalBill(matterId, show, sortby, party_role) {
            var party_role = angular.isDefined(party_role) ? party_role : '';
            var deferred = $q.defer();
            var url = downloadMedicalBillUrl;
            var params = { pageNum: 1, pageSize: 1000, show: show, party_role: party_role, sort_by: sortby, matterId: matterId, fileName: "MedicalBills-List" };
            url += '?' + getParams(params);
            // var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                // headers: token, // Add params into headers
                responseType: 'arraybuffer'
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }

        // US13403: Export MedicalInfo List(PHP to Java )
        function downloadMedicalInfo(matterId, show, sortby, party_role) {
            var party_role = angular.isDefined(party_role) ? party_role : '';
            var deferred = $q.defer();
            var url = downloadMedicalInformationUrl;
            var params = { pageNum: 1, pageSize: 1000, show: show, party_role: party_role, sort_by: sortby, matterId: matterId, fileName: "MedicalInfo_List" };
            url += '?' + getParams(params);
            // var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                // headers: token, // Add params into headers
                responseType: 'arraybuffer'
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }

        function downloadPaymentInfo(matterId) {
            var deferred = $q.defer();
            var url = downloadMatterDetailsUrl;
            var params = { matter_id: matterId };
            url += '?' + getParams(params);
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                headers: token, // Add params into headers
                responseType: 'arraybuffer'
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function getMatterInfo(matterId) {
            var url = matterInfoUrl + matterId;
            return $http.get(url);
        }

        function setNamePropForPlaintiffs(plaintiffs) {
            _.forEach(plaintiffs, function (plaintiff) {
                plaintiff.name = utils.isNotEmptyVal(plaintiff.contactid) ?
                    (plaintiff.contactid.firstname + " " + plaintiff.contactid.lastname) :
                    '';
            });
        }

        function setNamePropForOtherParties(otherparty) {
            _.forEach(otherparty, function (op) {
                op.name = utils.isNotEmptyVal(op.contactid) ?
                    (op.firstname + " " + op.lastname) :
                    '';
            });
        }

        function setDataPropForContactsFromOffDrupalToNormalContact(contacts) {
            _.forEach(contacts, function (contact) {
                contact['city'] = utils.isNotEmptyVal(contact.address.city) ? contact.address.city : '';
                contact['country'] = utils.isNotEmptyVal(contact.address.country) ? contact.address.country : '';
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
                contact['city'] = utils.isNotEmptyVal(contact.address.city) ? contact.address.city : '';
                contact['state'] = utils.isNotEmptyVal(contact.address.state) ? contact.address.state : '';
                contact['country'] = utils.isNotEmptyVal(contact.address.country) ? contact.address.country : '';
                contact['street'] = utils.isNotEmptyVal(contact.address.street) ? contact.address.street : '';
                contact['zipcode'] = utils.isNotEmptyVal(contact.address.zip_code) ? contact.address.zip_code : '';
                contact['contactid'] = (contact.contact_id).toString();
            });
        }

        function setNamePropForContacts(contacts) {
            _.forEach(contacts, function (contact) {
                contact.name = contact.firstname + ' ' + contact.lastname;
            });
        }

        // function getNegligenceLiabilityInfo(matterId) {
        //     var url = getNegligenceLiabilityInfoUrl + matterId + '.json';
        //     return $http.get(url);
        // }
        function getNegligenceLiabilityInfo(matterId) {
            var deferred = $q.defer();
            var url = getNegligenceLiabilityInfoUrl1 + matterId;
            // var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                // headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }

        // function saveNegligenceLiabilityInfo(matterId, description, propertyDamage) {
        //     var data = { matterid: matterId, description: description, property_damage: propertyDamage };
        //     var url = saveNegligenceLiabilityInfoUrl + matterId + '.json';
        //     return $http.put(url, data);
        // }
        function saveNegligenceLiabilityInfo(matterId, description, propertyDamage) {
            var deferred = $q.defer();
            var url = saveNegligenceLiabilityInfoUrl1 + matterId;
            var data = { matterid: matterId, description: description, property_damage: propertyDamage };
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "PUT",
                data: data,
                headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve();
            }).error(function (ee, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;
        }

        function getMedicalInfo_BEFORE_OFF_DRUPAL(matterId, show, sortBy, party_role) {
            var url = getMedicalRecordUrl + matterId + ".json";
            var params = { pageNum: 1, pageSize: 250, show: show, sortby: sortBy, party_role: party_role };
            url += '?' + getParams(params);
            return $http.get(url);
        }

        function getMedicalInfo(matterId, show, sortBy, party_role) {
            var deferred = $q.defer();
            var url = getMedicalRecordUrl1 + matterId;
            party_role = (party_role == undefined) ? "" : party_role;
            var params = { pageNum: 1, pageSize: 250, show: show, party_role: party_role };
            url += '?' + getParams(params);
            // var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                // headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function getPlaintiffs(matterId) {
            var url = getAllPlaintiffsUrl + matterId + '.json';
            return $http.get(url);
        }

        function getExpenseTypePHP() {
            var url = getExpenseTypeUrl;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function getExpenseType() {
            var url = getExpenseTypeUrl1;
            // var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            var deferred = $q.defer();
            $http({
                url: url,
                method: "GET",
                // headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function getBodilyInjuryData(matterId) {
            var url = getBodilyInjuryDataUrl + matterId;
            return $http.get(url);
        }

        function getsettlementData(matterId) {
            var url = getsettlementtDataUrl + matterId;
            return $http.get(url);
        }



        function updateBodilyInjuryData(matterId, bodilyInjurydata) {
            var url = updateBodilyInjuryUrl + matterId;
            return $http.put(url, bodilyInjurydata);
        }

        function updateSettlementInfo(matterId, settlementData) {
            var url = getsettlementtDataUrl1 + matterId;
            return $http.put(url, settlementData);
        }


        function saveMedicalRecord(data) {
            var deferred = $q.defer();
            var url = addMedicalRecordUrl1;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "POST",
                data: data,
                headers: token
            }).success(function (response, status, headers, config) {
                deferred.resolve();
            }).error(function (ee, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;
        }

        function savePaymentRecord(data) {
            var url = savePaymentDataUrl;
            return $http.post(url, data);
        }

        function editMedicalRecord(data) {
            var deferred = $q.defer();
            var url = editMedicalRecordUrl1 + data.medical_information_id;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "PUT",
                data: data,
                headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve();
            }).error(function (ee, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;
        }

        function editPaymentRecord(data) {
            var url = editPaymentDataUrl + data.id;
            return $http.put(url, data);
        }

        function deleteMedicalRecords(ids) {
            var deferred = $q.defer();
            var url = deleteMedicalRecordUrl1 + '?medicalInformationIds=' + ids.toString();
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "DELETE",
                headers: token,
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function deletePaymentRecords(ids) {
            var url = deletepaymentRecordUrl;
            url += '?settlement_payment_id=' + ids.toString();
            return $http.delete(url);
        }

        function getContactsByName(name) {
            var url = getContactsUrl;
            var params = { params: { 'fname': name } };
            return $http.get(url, params);
        }

        function getInsauranceInfo(matterId, show, partyRole, insuranceType) {
            var deferred = $q.defer();
            (partyRole == undefined) ? partyRole = "" : partyRole;
            show = (show == 'allplaintiff') ? 'allplaintiffs' : show;
            var url = getInsauranceUrl1 + matterId;
            var params = { pageNum: 1, pageSize: 250, show: show, party_role: partyRole, insuranceType: '' };
            url += '?' + getParams(params);
            // var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                // headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }

        function getInsauranceInfo_BEFORE_OFF_DRUPAL(matterId, show, partyRole) {
            show = (show == 'allplaintiffs') ? 'allplaintiff' : show;
            var url = getInsauranceUrl + matterId;
            var params = { pageNum: 1, pageSize: 250, show: show, party_role: partyRole };
            url += '?' + getParams(params);
            return $http.get(url);
        }

        function addInsauranceRecord(insuranceRecord) {

            var deferred = $q.defer();
            var url = addInsauranceRecordUrl1;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "POST",
                headers: token, // Add params into headers
                data: insuranceRecord
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function editInsauranceRecord(insuranceRecord) {

            var deferred = $q.defer();
            var url = editInsuranceRecordUrl1 + insuranceRecord.insurance_id;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "PUT",
                headers: token, // Add params into headers
                data: insuranceRecord
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function deleteInsurance(insuranceIds) {
            var deferred = $q.defer();
            var url = deleteInsuranceUrl1 + '?insuranceIds=' + insuranceIds.toString();
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "DELETE",
                headers: token,
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }


        function getLiensInfo_BEFORE_OFF_DRUPAL(matterId, show, party_role) {
            var url = getLiensUrl + matterId;
            var params = { pageNum: 1, pageSize: 250, show: show, party_role: party_role };
            url += '?' + getParams(params);
            return $http.get(url);
        }

        function getLiensInfo(matterId, show, party_role) {
            var deferred = $q.defer();
            (party_role == undefined) ? party_role = "" : party_role;
            var url = getLiensUrl1 + matterId;
            var params = { pageNum: 1, pageSize: 250, show: show, party_role: party_role };
            url += '?' + getParams(params);
            // var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                // headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;

        }

        function addLienRecord(lienRecord) {
            var deferred = $q.defer();
            var url = addLienUrl1;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "POST",
                data: lienRecord,
                headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve();
            }).error(function (ee, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;

        }


        function editLienRecord(lienId, lienRecord) {
            var deferred = $q.defer();
            var url = editLienUrl1 + lienId;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "PUT",
                data: lienRecord,
                headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve();
            }).error(function (ee, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;

        }

        function deleteLienRecord(lienIds) {
            var url = deleteLienUrl1;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            url += '?lienIds=' + lienIds.toString() + '';
            return $http({
                url: url,
                method: "DELETE",
                // params: data,
                headers: token // Add params into headers
            });
        }

        function getExpensesInfo_BEFORE_OFF_DRUPAL(matterId, show, partyRole) {
            var url = getExpensesUrl + matterId;
            var params = { pageNum: 1, pageSize: 250, show: show, party_role: partyRole };
            url += '?' + getParams(params);
            return $http.get(url);
        }

        function getExpensesInfo(matterId, show, partyRole) {
            var deferred = $q.defer();
            // var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            var url = getExpensesUrl1 + matterId;
            var params = { page_num: 1, page_size: 1000, show: show, party_role: partyRole };
            url += '?' + getParams(params);
            $http({
                url: url,
                method: "GET",
                // headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });

            return deferred.promise;
        }

        function addExpenseRecord(newExpenseRecord) {
            // var url = addExpenseRecordUrl1;
            // return $http.post(url, newExpenseRecord);
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            var deferred = $q.defer();

            return $http({
                url: addExpenseRecordUrl1,
                method: "POST",
                headers: token,
                data: newExpenseRecord
            }).then(function (response) {
                deferred.resolve(response);
            }, function (error) {
                deferred.reject(error);
            });
        }

        function editExpenseRecord(newExpenceRecord) {
            var url = editExpenseRecordUrl1 + "/" + newExpenceRecord.expense_id;
            return $http.put(url, newExpenceRecord);
        }

        function deleteExpenseRecord(ids) {
            // var url = deleteExpensesUrl;
            // url += '?did=[' + ids.toString() + ']';
            // return $http.delete(url);
            var deferred = $q.defer();
            var url = deleteExpensesUrl1 + '?expenseids=' + ids.toString();
            var token = {
                'Authorization': "Bearer " + localStorage.getItem('accessToken'),
                'Content-type': 'application/json'
            }
            return $http({
                url: url,
                method: "DELETE",
                headers: token
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                ee.status = status;
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function getMedicalBillsInfo_BEFORE_OFF_DRUPAL(matterId, show, party_role) {
            var url = getMedicalBillsInfoUrl + matterId;
            var params = { pageNum: 1, pageSize: 250, show: show, party_role: party_role };
            url += '?' + getParams(params);
            return $http.get(url);
        }

        function getMedicalBillsInfo(matterId, show, party_role) {
            var deferred = $q.defer();
            party_role = (party_role == undefined) ? "" : party_role;
            var url = getMedicalBillsInfoUrl1 + matterId;
            var params = { pageNum: 1, pageSize: 250, show: show, party_role: party_role };
            url += '?' + getParams(params);
            // var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "GET",
                // headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        function editMedicalBillsInfo(medicalBillObj) {
            delete medicalBillObj.adjustment;
            var deferred = $q.defer();
            var url = editMedicalBillsInfoUrl1 + medicalBillObj.medical_bill_id;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "PUT",
                data: medicalBillObj,
                headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve();
            }).error(function (ee, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;
        }

        function addMedicalBillsInfo(medicalBillObj) {
            // var url = getMedicalBillsInfoUrl;
            delete medicalBillObj.adjustment;
            // return $http.post(url, newMedicalBill);
            var deferred = $q.defer();
            var url = addMedicalBillsInfoUrl1;
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "POST",
                data: medicalBillObj,
                headers: token // Add params into headers
            }).success(function (response, status, headers, config) {
                deferred.resolve();
            }).error(function (ee, status, headers, config) {
                deferred.reject();
            });
            return deferred.promise;
        }

        function deleteMedicalBillsInfo(ids) {
            var deferred = $q.defer();
            var url = deleteMedicalBillsInfoUrl1 + '?medicalBillIds=' + ids.toString();
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "DELETE",
                headers: token,
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }

        //  US16929: Expense Manager (Quickbooks integration)
        //Function to move Expense details to Expense Manager
        function moveToExpenseManager(expenseId) {
            var deferred = $q.defer();
            var url = moveToExpenseManagerUrl + '?expenseId=' + expenseId.toString();
            var token = { 'Authorization': "Bearer " + localStorage.getItem('accessToken') }
            $http({
                url: url,
                method: "POST",
                headers: token, // Add params into headers
                data: null
            }).success(function (response, status, headers, config) {
                deferred.resolve(response);
            }).error(function (ee, status, headers, config) {
                deferred.reject(ee);
            });
            return deferred.promise;
        }
    }

})();

//var getNegligenceLiabilityInfoUrl = 'https://cloudlexhttp.cloudapp.net/litigationmatter/litigationmatter/';
//var saveNegligenceLiabilityInfoUrl = 'https://cloudlexhttp.cloudapp.net/litigationmatter/litigationmatter/';
//var getMedicalRecordUrl = 'https://cloudlexhttp.cloudapp.net/medical/medicalrecord/';
//var getAllPlaintiffsUrl = 'https://cloudlexhttp.cloudapp.net/allparties/plaintiffs/';
//var addMedicalRecordUrl = 'https://cloudlexhttp.cloudapp.net/medical/medicalrecord.json';
//var getBodilyInjuryDataUrl = 'https://cloudlexhttp.cloudapp.net/allparties/getbodilyinjuries/';
//var updateBodilyInjuryUrl = 'https://cloudlexhttp.cloudapp.net/allparties/getbodilyinjuries/';
//var getContactsUrl = 'https://cloudlexhttp.cloudapp.net/lexviacontacts/GetContactlimit';
//var editMedicalRecordUrl = 'https://cloudlexhttp.cloudapp.net/medical/medicalrecord/';
//var deleteMedicalRecordUrl = 'https://cloudlexhttp.cloudapp.net/medical/medicalrecord/1';
//var getInsauranceUrl = 'https://cloudlexhttp.cloudapp.net/insuranceliens/insurance/';
//var addInsauranceRecordUrl = 'https://cloudlexhttp.cloudapp.net/insuranceliens/insurance';
//var editInsuranceRecordUrl = 'https://cloudlexhttp.cloudapp.net/insuranceliens/insurance/';
//var deleteInsuranceUrl = 'https://cloudlexhttp.cloudapp.net/insuranceliens/insurance/1';
//var getLiensUrl = 'https://cloudlexhttp.cloudapp.net/insuranceliens/liens/';
//var addLienUrl = 'https://cloudlexhttp.cloudapp.net/insuranceliens/liens';
//var editLienUrl = 'https://cloudlexhttp.cloudapp.net/insuranceliens/liens/';
//var deleteLienUrl = 'https://cloudlexhttp.cloudapp.net/insuranceliens/liens/1';
//var getExpenseTypeUrl = 'https://cloudlexhttp.cloudapp.net/insuranceliens/getexpensetypes/1';
//var addExpenseRecordUrl = 'https://cloudlexhttp.cloudapp.net/insuranceliens/expense';
//var editExpenseRecordUrl = 'https://cloudlexhttp.cloudapp.net/insuranceliens/expense/';
//var getExpensesUrl = 'https://cloudlexhttp.cloudapp.net/insuranceliens/expense/';
//var deleteExpensesUrl = 'https://cloudlexhttp.cloudapp.net/insuranceliens/expense/1';
//var getMedicalBillsInfoUrl = 'https://cloudlexhttp.cloudapp.net/medical/medicalbill/';
//var addMedicalBillsInfoUrl = 'https://cloudlexhttp.cloudapp.net/medical/medicalbill';
//var editMedicalBillsInfoUrl = 'https://cloudlexhttp.cloudapp.net/medical/medicalbill/';
//var deleteMedicalBillsInfoUrl = 'https://cloudlexhttp.cloudapp.net/medical/medicalbill/1';