angular.module('intake.report')
    .factory('intakeReportConstant', ['globalConstants', function (globalConstants) {

        var intakeReportFactory = {};
        //added for Report
        intakeReportFactory.RESTAPI = {};
        var javaURL = globalConstants.intakeServiceBaseV2;
        var javaRrportURL = globalConstants.intakeServiceBase;
        intakeReportFactory.RESTAPI.getMasterDataFromJAVA = globalConstants.intakeServiceBase + 'get-intake-metadata';
        intakeReportFactory.RESTAPI.master = globalConstants.javaWebServiceBaseV4 + 'master-data';
        if (!globalConstants.useApim) {
            //get intake Upcoming SOL 
            intakeReportFactory.RESTAPI.intakeSOL = javaURL + 'report/upcoming-event';
            //get intake Upcoming SOL 
            intakeReportFactory.RESTAPI.downloadIntake = javaURL + 'report/export-upcoming-event';
        } else {
            intakeReportFactory.RESTAPI.intakeSOL = globalConstants.intakeBase + 'reports/v1/upcoming-event';
            intakeReportFactory.RESTAPI.downloadIntake = globalConstants.intakeBase + 'reports/v1/export-upcoming-event';
        }
        //get all intake 
        intakeReportFactory.RESTAPI.allIntakeReport = javaRrportURL + 'get-intake-list';
        //export all intake list
        intakeReportFactory.RESTAPI.allIntakeList = javaRrportURL + 'export-intake-list';
        //get all intake 
        intakeReportFactory.RESTAPI.taskSummaryData = javaURL + 'report/intake-task-summary-report?';
        //export all intake list
        intakeReportFactory.RESTAPI.taskSummaryExport = javaURL + 'report/intake-task-summary-export?';
        // intake search
        intakeReportFactory.RESTAPI.getIntakeList = javaRrportURL + 'get-intake-list';
        return intakeReportFactory;

    }]);
