angular.module('cloudlex.report')
    .factory('reportConstant', ['globalConstants', function (globalConstants) {

        var reportFactory = {};
        //added for Report
        reportFactory.RESTAPI = {};
        reportFactory.RESTAPI.master = globalConstants.javaWebServiceBaseV4 + 'master-data';
        //reportFactory.RESTAPI.allMatters = globalConstants.webServiceBase + "matter/all_matter_index_limitv2.json";
        reportFactory.RESTAPI.matterReport = globalConstants.javaWebServiceBaseV4 + 'matter/get-matters-data'
        //reportFactory.RESTAPI.myMatters = globalConstants.webServiceBase + "matter/matter_index_limitv2.json";
        reportFactory.RESTAPI.allMattersCount = globalConstants.webServiceBase + "matter/all_matter_index_limit_count.json";
        reportFactory.RESTAPI.myMattersCount = globalConstants.webServiceBase + "matter/matter_index_limit_count.json";
        reportFactory.RESTAPI.getMatterById = globalConstants.webServiceBase + '/matter/matter_index_edit/';
        reportFactory.RESTAPI.statusWiseCounts = globalConstants.webServiceBase + "matter/matter_status_count/1.json";
        reportFactory.RESTAPI.downloadMatterReport = globalConstants.webServiceBase + "reports/report.json";
        //reportFactory.RESTAPI.matterstatsForReport = globalConstants.webServiceBase + 'reports/matterstats.json';
        //reportFactory.RESTAPI.matterstatscount = globalConstants.webServiceBase + 'reports/matterstats_count.json';
        reportFactory.RESTAPI.matterstatscount = globalConstants.javaWebServiceBaseV4 + 'matter/get-matters-by-date';
        reportFactory.RESTAPI.matter_substatus = globalConstants.webServiceBase + 'reports/matter_substatus.json';
        reportFactory.RESTAPI.matterType = globalConstants.webServiceBase + 'reports/mattertype.json';
        reportFactory.RESTAPI.expensesCount = globalConstants.webServiceBase + 'reports/firm_expenses_count.json';
        //reportFactory.RESTAPI.plaintiffMailingList = globalConstants.webServiceBase + 'reports/client_mailing_list.json';
        reportFactory.RESTAPI.getPlaintiffLimited = globalConstants.webServiceBase + 'allparties/getPlaintiffLimited/'
        reportFactory.RESTAPI.getUserInfo = globalConstants.webServiceBase + 'matter/allusers_for_matter/1.json';
        reportFactory.RESTAPI.getAssociatedParty = globalConstants.webServiceBase + 'allparties/getAllPartiesContacts.json';
        reportFactory.RESTAPI.text_search = globalConstants.webServiceBase + 'reports/text_search';
        reportFactory.RESTAPI.taskAgeData = globalConstants.webServiceBase + 'Matter-Manager/v1/reports/age?';
        reportFactory.RESTAPI.downloadTaskAge = globalConstants.webServiceBase + 'Matter-Manager/v1/reports/export-age-summary?';
        reportFactory.RESTAPI.taskSummaryData = globalConstants.webServiceBase + 'Matter-Manager/v1/reports/status-summary?'
        reportFactory.RESTAPI.exportTaskSummary = globalConstants.webServiceBase + 'Matter-Manager/v1/reports/export-status-summary?'

        //Off-Drupal
        if (!globalConstants.useApim) {
            reportFactory.RESTAPI.downloadMatter = globalConstants.javaWebServiceBaseV4 + 'reports/export-event-report';
            reportFactory.RESTAPI.expenses = globalConstants.javaWebServiceBaseV4 + 'reports/expense-report';
            reportFactory.RESTAPI.insuranceExport = globalConstants.javaWebServiceBaseV4 + 'reports/export-insurance-report?'
            reportFactory.RESTAPI.exportMedicalRecordRequest = globalConstants.javaWebServiceBaseV4 + 'reports/export-medical-record-report';
            reportFactory.RESTAPI.getMedicalRecordRequest = globalConstants.javaWebServiceBaseV4 + 'reports/medical-record-report';
            reportFactory.RESTAPI.insurance = globalConstants.javaWebServiceBaseV4 + 'reports/insurance-report';
            reportFactory.RESTAPI.matterValuation = globalConstants.javaWebServiceBaseV4 + 'reports/matter-valuation-report?';
            reportFactory.RESTAPI.exportsettlementreport = globalConstants.javaWebServiceBaseV4 + 'reports/settlement-export';
            reportFactory.RESTAPI.settlement = globalConstants.javaWebServiceBaseV4 + 'reports/settlement-report';
            reportFactory.RESTAPI.exportexpensesreport = globalConstants.javaWebServiceBaseV4 + 'reports/export-expense-report';
            reportFactory.RESTAPI.plaintiffMailingList = globalConstants.javaWebServiceBaseV4 + 'reports/plaintiff-contact-report';
            reportFactory.RESTAPI.downloadMatterValuationReport = globalConstants.javaWebServiceBaseV4 + "reports/export-matter-valuation-report";
            reportFactory.RESTAPI.allmyMatterReportExport = globalConstants.javaWebServiceBaseV4 + "reports/export-matter-report";
            reportFactory.RESTAPI.matterstats = globalConstants.javaWebServiceBaseV4 + "reports/event-report";
            reportFactory.RESTAPI.newMatterOpenbyDateReport = globalConstants.javaWebServiceBaseV4 + "reports/export-matterbydate-report?";
            reportFactory.RESTAPI.plaintiffReport = globalConstants.javaWebServiceBaseV4 + "reports/plaintiff-contact-export?";
            reportFactory.RESTAPI.downloadMatterContact_offDrupal = globalConstants.javaWebServiceBaseV4 + "reports/export-matter-contact-report?"
            reportFactory.RESTAPI.taskAgeData = globalConstants.webServiceBase + 'Matter-Manager/v1/reports/age?';
            reportFactory.RESTAPI.downloadTaskAge = globalConstants.webServiceBase + 'Matter-Manager/v1/reports/export-age-summary?';
            reportFactory.RESTAPI.taskSummaryData = globalConstants.webServiceBase + 'Matter-Manager/v1/reports/status-summary?'
            reportFactory.RESTAPI.exportTaskSummary = globalConstants.webServiceBase + 'Matter-Manager/v1/reports/export-status-summary?'
        } else {
            reportFactory.RESTAPI.downloadMatter = globalConstants.matterBase + 'reports/v1/export-event-report';
            reportFactory.RESTAPI.expenses = globalConstants.matterBase + 'reports/v1/expense-report';
            reportFactory.RESTAPI.insuranceExport = globalConstants.matterBase + 'reports/v1/export-insurance-report?'
            reportFactory.RESTAPI.exportMedicalRecordRequest = globalConstants.matterBase + 'reports/v1/export-medical-record-report';
            reportFactory.RESTAPI.getMedicalRecordRequest = globalConstants.matterBase + 'reports/v1/medical-record-report';
            reportFactory.RESTAPI.insurance = globalConstants.matterBase + 'reports/v1/insurance-report';
            reportFactory.RESTAPI.matterValuation = globalConstants.matterBase + 'reports/v1/matter-valuation-report?';
            reportFactory.RESTAPI.exportsettlementreport = globalConstants.matterBase + 'reports/v1/settlement-export';
            reportFactory.RESTAPI.settlement = globalConstants.matterBase + 'reports/v1/settlement-report';
            reportFactory.RESTAPI.exportexpensesreport = globalConstants.matterBase + 'reports/v1/export-expense-report';
            reportFactory.RESTAPI.plaintiffMailingList = globalConstants.matterBase + 'reports/v1/plaintiff-contact-report';
            reportFactory.RESTAPI.downloadMatterValuationReport = globalConstants.matterBase + "reports/v1/export-matter-valuation-report?";
            reportFactory.RESTAPI.allmyMatterReportExport = globalConstants.matterBase + "reports/v1/export-matter-report";
            reportFactory.RESTAPI.matterstats = globalConstants.matterBase + "reports/v1/event-report";
            reportFactory.RESTAPI.newMatterOpenbyDateReport = globalConstants.matterBase + "reports/v1/export-matterbydate-report?";
            reportFactory.RESTAPI.plaintiffReport = globalConstants.matterBase + "reports/v1/plaintiff-contact-export?";
            reportFactory.RESTAPI.downloadMatterContact_offDrupal = globalConstants.matterBase + "reports/v1/export-matter-contact-report?"
            reportFactory.RESTAPI.taskAgeData = globalConstants.matterBase + 'reports/v1/age?';
            reportFactory.RESTAPI.downloadTaskAge = globalConstants.matterBase + 'reports/v1/export-age-summary?';
            reportFactory.RESTAPI.taskSummaryData = globalConstants.matterBase + 'reports/v1/status-summary?'
            reportFactory.RESTAPI.exportTaskSummary = globalConstants.matterBase + 'reports/v1/export-status-summary?'
        }
        return reportFactory;

    }]);
