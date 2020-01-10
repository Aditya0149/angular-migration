angular.module('cloudlex.contact')
    .factory('globalContactConstants',
        ['globalConstants', function (globalConstants) {

            var contactServiceFactory = {};

            contactServiceFactory.RESTAPI = {};
            // for Java configured contacts Off-drupal

            contactServiceFactory.RESTAPI.attorneyList = globalConstants.webServiceBase + "matter/allusers_for_matter/1.json";
            contactServiceFactory.RESTAPI.staffList = globalConstants.webServiceBase + "matter/allusers_for_matter/1.json";
            contactServiceFactory.RESTAPI.usersList = globalConstants.webServiceBase + "matter/allusers_for_matter/1.json";
            contactServiceFactory.RESTAPI.refferedList = globalConstants.webServiceBase + "lexviacontacts/GetContactlimit.json";
            contactServiceFactory.RESTAPI.courts = globalConstants.webServiceBase + "matter/court.json";
            contactServiceFactory.RESTAPI.courtContacts = globalConstants.webServiceBase + "lexviacontacts/GetContactCourt/1.json";
            //  US#6337
            contactServiceFactory.RESTAPI.courtContactsMatt = globalConstants.webServiceBase + "lexviacontacts/GetContactData";
            // for Java configured contacts Off-Drupal
            contactServiceFactory.RESTAPI.getContactsUrl = globalConstants.webServiceBase + 'lexviacontacts/GetContactlimit';

            if (!globalConstants.useApim) {
                contactServiceFactory.RESTAPI.getStaffInFirmUrl = globalConstants.javaWebServiceBaseV4 + 'task/staffs-in-firm';
                contactServiceFactory.RESTAPI.exportContact1 = globalConstants.javaWebServiceBaseV4 + 'contact/export-contacts';
                contactServiceFactory.RESTAPI.getExportForRoleView1 = globalConstants.javaWebServiceBaseV4 + 'contact/export-role-based-contacts';
                contactServiceFactory.RESTAPI.getContactsUrl1 = globalConstants.javaWebServiceBaseV4 + 'contact/get-contact-limit';
                contactServiceFactory.RESTAPI.countForRoleView1 = globalConstants.javaWebServiceBaseV4 + 'contact/get-role-based-contacts';
                contactServiceFactory.RESTAPI.deleteContacts1 = globalConstants.javaWebServiceBaseV4 + "contact/delete";
                contactServiceFactory.RESTAPI.getContactById1 = globalConstants.javaWebServiceBaseV4 + 'contact/';
                contactServiceFactory.RESTAPI.editContact1 = globalConstants.javaWebServiceBaseV4 + "contact";
                contactServiceFactory.RESTAPI.javacourtContactsMatt1 = globalConstants.javaWebServiceBaseV4 + "contact/getContactData";
                contactServiceFactory.RESTAPI.addContact1 = globalConstants.javaWebServiceBaseV4 + "contact";
            } else {
                contactServiceFactory.RESTAPI.getStaffInFirmUrl = globalConstants.matterBase + 'task/v1/staffs-in-firm';
                contactServiceFactory.RESTAPI.exportContact1 = globalConstants.matterBase + 'contact/v1/export-contacts';
                contactServiceFactory.RESTAPI.getExportForRoleView1 = globalConstants.matterBase + 'contact/v1/export-role-based-contacts';
                contactServiceFactory.RESTAPI.getContactsUrl1 = globalConstants.matterBase + 'contact/v1/get-contact-limit';
                contactServiceFactory.RESTAPI.countForRoleView1 = globalConstants.matterBase + 'contact/v1/get-role-based-contacts';
                contactServiceFactory.RESTAPI.deleteContacts1 = globalConstants.matterBase + "contact/v1/delete";
                contactServiceFactory.RESTAPI.getContactById1 = globalConstants.matterBase + 'contact/v1/';
                contactServiceFactory.RESTAPI.editContact1 = globalConstants.matterBase + "contact/v1";
                contactServiceFactory.RESTAPI.javacourtContactsMatt1 = globalConstants.matterBase + "contact/v1/getContactData";
                contactServiceFactory.RESTAPI.addContact1 = globalConstants.matterBase + "contact/v1";
            }

            // for Java configured contacts Off-drupal
            // for Java configured contacts Off-drupal

            contactServiceFactory.RESTAPI.nodeGraph = globalConstants.webServiceBase + 'lexviacontacts/contactMatterMap.json';
            contactServiceFactory.RESTAPI.matterContactroles = globalConstants.webServiceBase + 'lexviacontacts/getContactRolesForMatter.json';
            //off-drupal
            //export role based contacts off drupal// 

            return contactServiceFactory;

        }]);
