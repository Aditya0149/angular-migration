angular.module('cloudlex.matter')
    .factory('matterConstants', ['globalConstants', function (globalConstants) {

        var matterFactory = {};
        matterFactory.RESTAPI = {};
        matterFactory.RESTAPI.matterInfo = globalConstants.webServiceBase + "matter/matter_index_edit/";
        matterFactory.RESTAPI.master = globalConstants.javaWebServiceBaseV4 + 'master-data';;
        matterFactory.RESTAPI.allMatters = globalConstants.javaWebServiceBaseV4 + "matter/get-matters-data";
        matterFactory.RESTAPI.myMatters = globalConstants.javaWebServiceBaseV4 + "matter/get-matters-data";
        matterFactory.RESTAPI.addMatter = globalConstants.webServiceBase + "matter/matter";
        matterFactory.RESTAPI.statusWiseCounts = globalConstants.webServiceBase + "matter/matter_status_count/1.json";
        matterFactory.RESTAPI.deleteMatter = globalConstants.webServiceBase + "matter/matter/1";
        matterFactory.RESTAPI.downloadMatter = globalConstants.webServiceBase + 'reports/report.json';
        matterFactory.RESTAPI.getImportantDates = globalConstants.webServiceBase + 'lexviacalendar/lexviacalendar/';
        matterFactory.RESTAPI.getUserAssignment = globalConstants.webServiceBase + 'matter/getassignedusers_for_matter/';
        matterFactory.RESTAPI.getMatterById = globalConstants.webServiceBase + 'matter/matter_index_edit/';
        matterFactory.RESTAPI.searchMatter = globalConstants.webServiceBase + 'matter/getallmatters?name=';
        matterFactory.RESTAPI.markCompleteTaskEvent = globalConstants.webServiceBase + 'tasks/taskeventstatus/';

        // Off-Drupal for Matter Search
        matterFactory.RESTAPI.searchMatter_OffDrupal = globalConstants.javaWebServiceBaseV4 + 'matter/getallmatters';

        //Off drupal complete event and task on Close
        if (!globalConstants.useApim) {
            matterFactory.RESTAPI.markCompleteTaskEvent1 = globalConstants.javaWebServiceBaseV4 + 'task/{matterid}/task-event-status';
            matterFactory.RESTAPI.exportMyAllMatterList = globalConstants.javaWebServiceBaseV4 + 'reports/export-matter-report';
            matterFactory.RESTAPI.retrieveMatters = globalConstants.javaWebServiceBaseV4 + 'digital-archival/retrieve-matters';
            matterFactory.RESTAPI.archivematterData = globalConstants.javaWebServiceBaseV4 + 'digital-archival/archive-matters';
            matterFactory.RESTAPI.allArchiveMatters = globalConstants.javaWebServiceBaseV4 + "digital-archival/archived-matter-data"
        } else {
            matterFactory.RESTAPI.markCompleteTaskEvent1 = globalConstants.matterBase + 'task/v1/{matterid}/task-event-status';
            matterFactory.RESTAPI.exportMyAllMatterList = globalConstants.matterBase + 'reports/v1/export-matter-report';
            matterFactory.RESTAPI.retrieveMatters = globalConstants.matterBase + 'digital-archival/v1/retrieve-matters';
            matterFactory.RESTAPI.archivematterData = globalConstants.matterBase + 'digital-archival/v1/archive-matters';
            matterFactory.RESTAPI.allArchiveMatters = globalConstants.matterBase + "digital-archival/v1/archived-matter-data"
        }
        //added for Report
        //matterFactory.RESTAPI.matterstats = globalConstants.webServiceBase + 'reports/matterstats.json';
        matterFactory.RESTAPI.evidencePhotos = globalConstants.webServiceBase + 'lexviadocuments/evidencephotos/';
        matterFactory.RESTAPI.allUsers = globalConstants.webServiceBase + 'matter/allusers_for_matter/1';
        matterFactory.RESTAPI.getAllMatterCount = globalConstants.webServiceBase + 'matter/all_matter_index_limit_count';
        matterFactory.RESTAPI.getMyMatterCount = globalConstants.webServiceBase + 'matter/matter_index_limit_count';
        matterFactory.RESTAPI.getContactsUrl = globalConstants.webServiceBase + 'lexviacontacts/GetContactlimit';
        matterFactory.RESTAPI.getContactsUrl = globalConstants.webServiceBase + 'lexviacontacts/GetContactData';
        matterFactory.RESTAPI.getContactById = globalConstants.webServiceBase + 'lexviacontacts/lexviacontacts/';
        matterFactory.RESTAPI.valuationData = globalConstants.webServiceBase + 'matter/matter_valuation/'

        //US#5160-Added for archive matter grid 
        // matterFactory.RESTAPI.allArchiveMatters = globalConstants.webServiceBase + "matter/archived_matter_index_limit.json";
        //matterFactory.RESTAPI.getAllArchiveMatterCount = globalConstants.webServiceBase + 'matter/archived_matter_index_limit_count.json';
        matterFactory.RESTAPI.downloadArchiveMatter = globalConstants.webServiceBase + 'reports/report.json';
        //US#5613-Added for payment api calls on closed matter grid
        // matterFactory.RESTAPI.archivematterData = globalConstants.webServiceBase + 'matter/archive/1';
        // matterFactory.RESTAPI.retrieveMatters = globalConstants.webServiceBase + "matter/retrieve_archived_matter.json"; // US:5011->5245 Retrive archived matters
        matterFactory.RESTAPI.archivePayment = globalConstants.webServiceBase + 'matter/archive_payment/1';
        matterFactory.RESTAPI.getMatterCollaboratedEntityURL = globalConstants.webServiceBase + "Cloudlex-Lite/v1/lite/get-collaborated-entities?";
        return matterFactory;

    }]);
