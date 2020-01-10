angular.module('cloudlex.matter')
    .factory('contactConstants', ['globalConstants', function (globalConstants) {

        var contactFactory = {};

        contactFactory.RESTAPI = {};
        //contactFactory.RESTAPI.addContact = globalConstants.webServiceBase + "contacts/add";
        contactFactory.RESTAPI.addContact = globalConstants.webServiceBase + "lexviacontacts/lexviacontacts";
        contactFactory.RESTAPI.attorneyList = globalConstants.webServiceBase + "matter/allusers_for_matter/1.json";
        contactFactory.RESTAPI.staffList = globalConstants.webServiceBase + "matter/allusers_for_matter/1.json";
        contactFactory.RESTAPI.usersList = globalConstants.webServiceBase + "matter/allusers_for_matter/1.json";
        contactFactory.RESTAPI.refferedList = globalConstants.webServiceBase + "lexviacontacts/GetContactlimit.json";
        contactFactory.RESTAPI.courts = globalConstants.webServiceBase + "matter/court.json";
        contactFactory.RESTAPI.courtContacts = globalConstants.webServiceBase + "lexviacontacts/GetContactCourt/1.json";
        contactFactory.RESTAPI.getContactsUrl = globalConstants.webServiceBase + 'lexviacontacts/GetContactlimit';
        contactFactory.RESTAPI.getStaffInFirmUrl = globalConstants.webServiceBase + 'tasks/staffsinfirm';
    }]);
