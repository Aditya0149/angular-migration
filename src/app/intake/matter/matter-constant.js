angular.module('intake.matter')
    .factory('intakeConstants', ['globalConstants', function (globalConstants) {




        var matterFactory = {};
        matterFactory.RESTAPI = {};
        matterFactory.RESTAPI.intakeMigrate = globalConstants.intakeServiceBase + "migrate-intake";
        matterFactory.RESTAPI.matterInfo = globalConstants.webServiceBase + "matter/matter_index_edit/";
        matterFactory.RESTAPI.master = globalConstants.javaWebServiceBaseV4 + 'master-data';
        matterFactory.RESTAPI.allMatters = globalConstants.webServiceBase + "matter/all_matter_index_limit.json";
        matterFactory.RESTAPI.myMatters = globalConstants.webServiceBase + "matter/matter_index_limit.json";
        matterFactory.RESTAPI.addMatter = globalConstants.webServiceBase + "matter/matter";
        matterFactory.RESTAPI.statusWiseCounts = globalConstants.intakeServiceBase + "get-status-count";
        matterFactory.RESTAPI.deleteMatter = globalConstants.webServiceBase + "matter/matter/1";
        matterFactory.RESTAPI.downloadMatter = globalConstants.intakeServiceBase + 'export-intake-list';
        matterFactory.RESTAPI.getImportantDates = globalConstants.intakeServiceBaseV2 + "events/[ID]";
        matterFactory.RESTAPI.getUserAssignment = globalConstants.webServiceBase + 'matter/getassignedusers_for_matter/';
        matterFactory.RESTAPI.getMatterById = globalConstants.webServiceBase + 'matter/matter_index_edit/';
        matterFactory.RESTAPI.searchMatter = globalConstants.webServiceBase + 'matter/getallmatters?name=';
        matterFactory.RESTAPI.markCompleteTaskEvent = globalConstants.webServiceBase + 'tasks/taskeventstatus/';

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
        // matterFactory.RESTAPI.allArchiveMatters = globalConstants.javaWebServiceBaseV4 + "digital-archival/archived-matter-data"
        //matterFactory.RESTAPI.getAllArchiveMatterCount = globalConstants.webServiceBase + 'matter/archived_matter_index_limit_count.json';
        matterFactory.RESTAPI.downloadArchiveMatter = globalConstants.webServiceBase + 'reports/report.json';
        // matterFactory.RESTAPI.retrieveMatters = globalConstants.webServiceBase + "matter/retrieve_archived_matter.json"; // US:5011->5245 Retrive archived matters
        //US#5613-Added for payment api calls on closed matter grid
        // matterFactory.RESTAPI.archivematterData = globalConstants.webServiceBase + 'matter/archive/1';
        // matterFactory.RESTAPI.retrieveMatters = globalConstants.javaWebServiceBaseV4 + 'digital-archival/retrieve-matters';
        // matterFactory.RESTAPI.archivematterData = globalConstants.javaWebServiceBaseV4 + 'digital-archival/archive-matters';
        matterFactory.RESTAPI.archivePayment = globalConstants.webServiceBase + 'matter/archive_payment/1';
        matterFactory.RESTAPI.getMasterDataFromJAVA = globalConstants.intakeServiceBase + 'get-intake-metadata';
        matterFactory.RESTAPI.getIntakeList = globalConstants.intakeServiceBase + "get-intake-list";
        matterFactory.RESTAPI.addIntake = globalConstants.intakeServiceBase + "create-intake";
        matterFactory.RESTAPI.addPlaintiff = globalConstants.intakeServiceBase + "plaintiff/create-plaintiff";
        matterFactory.RESTAPI.deleteIntake = globalConstants.intakeServiceBase + "delete-intake";
        matterFactory.RESTAPI.editIntake = globalConstants.intakeServiceBase + "update-intake";
        matterFactory.RESTAPI.editPlaintiff = globalConstants.intakeServiceBase + "plaintiff/update-plaintiff";
        matterFactory.RESTAPI.deletePlaintiff = globalConstants.intakeServiceBase + "plaintiff/delete-plaintiffs";
        matterFactory.RESTAPI.getPlaintiff = globalConstants.intakeServiceBase + "plaintiff/get-plaintiff-details/intake/";
        matterFactory.RESTAPI.getPlaintiffDetail = globalConstants.intakeServiceBase + "plaintiff/get-plaintiff-details/intake/";

        //Added api for insurance on matter grid
        matterFactory.RESTAPI.InsuranceType = globalConstants.intakeServiceBase + "get-insurance-type";
        matterFactory.RESTAPI.addInsurance = globalConstants.intakeServiceBase + "insurance/create-insurance-details";
        matterFactory.RESTAPI.editInsurance = globalConstants.intakeServiceBase + "insurance/update-insurance-details";
        matterFactory.RESTAPI.deleteInsurance = globalConstants.intakeServiceBase + "insurance/delete-insurance-details";

        //Added api for Medical Record on matter grid
        matterFactory.RESTAPI.addMedicalRecord = globalConstants.intakeServiceBase + "medRecord/create-medical-record";
        matterFactory.RESTAPI.editMedicalRecord = globalConstants.intakeServiceBase + "medRecord/update-medical-record";
        matterFactory.RESTAPI.deleteMedicalRecord = globalConstants.intakeServiceBase + "medRecord/delete-medical-record";

        //other details
        matterFactory.RESTAPI.addOtherDetails = globalConstants.intakeServiceBase + "details/create-other-details";
        matterFactory.RESTAPI.updateOtherDetails = globalConstants.intakeServiceBase + "details/update-other-details";
        matterFactory.RESTAPI.getOtherDetails = globalConstants.intakeServiceBase + "details/get-other-details/";

        //employer details
        matterFactory.RESTAPI.addEmployer = globalConstants.intakeServiceBase + "employer/create-plaintiff-employer";
        matterFactory.RESTAPI.addWitness = globalConstants.intakeServiceBase + "witness/create-witness";
        matterFactory.RESTAPI.editWitness = globalConstants.intakeServiceBase + "witness/update-witness";
        matterFactory.RESTAPI.deleteWitness = globalConstants.intakeServiceBase + "witness/delete-witness";
        //Intake print
        matterFactory.RESTAPI.printIntakeData = globalConstants.webServiceBase + "Intake-Manager/v1/intake/";
        //IntakeForm
        matterFactory.RESTAPI.getInTakeUrl = globalConstants.intakeServiceBaseV2 + "custom-form/get-template-url/";
        //Get Other details in matter manager
        matterFactory.RESTAPI.getIntakeOtherDetails = globalConstants.intakeServiceBaseV2 + "intake/migrated-intake/";
        matterFactory.RESTAPI.validateEmployer = globalConstants.intakeServiceBaseV2 + "intake?intakeIds=";

        if (!globalConstants.useApim) {
            matterFactory.RESTAPI.saveConsentForStatus = globalConstants.intakeServiceBaseV2 + "intake-Task/{intakeId}/task-event-status ";
            matterFactory.RESTAPI.retrieveMatters = globalConstants.javaWebServiceBaseV4 + 'digital-archival/retrieve-matters';
            matterFactory.RESTAPI.archivematterData = globalConstants.javaWebServiceBaseV4 + 'digital-archival/archive-matters';
            matterFactory.RESTAPI.allArchiveMatters = globalConstants.javaWebServiceBaseV4 + "digital-archival/archived-matter-data"
        } else {
            matterFactory.RESTAPI.saveConsentForStatus = globalConstants.intakeBase + "task/v1/{intakeId}/task-event-status ";
            matterFactory.RESTAPI.retrieveMatters = globalConstants.matterBase + 'digital-archival/v1/retrieve-matters';
            matterFactory.RESTAPI.archivematterData = globalConstants.matterBase + 'digital-archival/v1/archive-matters';
            matterFactory.RESTAPI.allArchiveMatters = globalConstants.matterBase + "digital-archival/v1/archived-matter-data"
        }
        return matterFactory;

    }]);
