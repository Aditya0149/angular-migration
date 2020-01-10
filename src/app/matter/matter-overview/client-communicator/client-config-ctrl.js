(function (angular) {
    'use strict';

    angular.module('cloudlex.matter')
        .controller('ClientConfigCtrl', ClientConfigCtrl);

    ClientConfigCtrl.$inject = ['$modalInstance', '$stateParams', 'notification-service', 'allPartiesDataService', 'plaintiffsCount', 'matterFactory'];

    function ClientConfigCtrl($modalInstance, $stateParams, notificationService, allPartiesDataService, plaintiffsCount, matterFactory) {
        var vm = this;
        vm.editMode = false;
        vm.close = close;
        vm.save = save;
        var matterId = $stateParams.matterId;
        getPlaintiffList(matterId);
        var clientPortalStatus = vm.clientPortalStatus;
        var plaintiffList = vm.plaintiffDataList;
        vm.plaintiffsCount = plaintiffsCount;
        vm.emailNotAdded = false;

        //init
        (function () {
            vm.matterInfo = matterFactory.getMatterData(matterId);
        })();


        function getPlaintiffList(matterId) {
            allPartiesDataService.getPlaintiffs(matterId).then(function (response) {
                vm.plaintiffDataList = response.data;
                vm.clientPortalStatus = response.client_portal_status;
                clientPortalStatus = vm.clientPortalStatus;
                angular.forEach(vm.plaintiffDataList, function (plaintiff) {
                    plaintiff.client_status = (utils.isEmptyVal(plaintiff.client_status)) ? false :
                        (plaintiff.client_status == '1') ? true : false;
                    if (utils.isEmptyVal(plaintiff.contactid.emailid)) {
                        vm.emailNotAdded = true;
                    }
                });
            });
        }
        function save(plaintiffs) {
            if (clientPortalStatus === 1) {
                var plaintiffArray = [];
                _.forEach(plaintiffs, function (plaintiff) {
                    var plaintiffObj = getPlaintiffObj(plaintiff);
                    plaintiffArray.push(plaintiffObj);

                });

                allPartiesDataService.editPlaintiffs(plaintiffArray, matterId).then(function (response) {
                    notificationService.success('Client(s) updated successfully!');
                    $modalInstance.close(response.data);
                    // $state.go("matter", { 'matterId': matterId });
                }, function (reason) {
                    notificationService.error('An error occurred. Please try later.');
                });
            }
            else if (utils.isEmptyVal(plaintiffList)) {
                notificationService.error('Please add Clients first.');
            }
            else if (clientPortalStatus === 0) {
                notificationService.error('Client Communicator is Disabled.');
            }
        }

        function getPlaintiffObj(plaintiffDetails) {
            var plaintiffObj = {};
            plaintiffObj.contactid = plaintiffDetails.contactid.contactid;
            plaintiffObj.guardianid = utils.isEmptyVal(plaintiffDetails.guardianid) ? null : (angular.isDefined(plaintiffDetails.guardianid.contactid)) ? plaintiffDetails.guardianid.contactid : null;
            plaintiffObj.studentinstitutionid = utils.isEmptyVal(plaintiffDetails.studentinstitutionid) ? null : (angular.isDefined(plaintiffDetails.studentinstitutionid.contactid)) ? plaintiffDetails.studentinstitutionid.contactid : null;
            plaintiffObj.dateofdeath = plaintiffDetails.dateofdeath;
            plaintiffObj.poa_type = plaintiffDetails.poa_type;
            plaintiffObj.gender = plaintiffDetails.gender;
            plaintiffObj.maritalstatus = plaintiffDetails.maritalstatus;
            plaintiffObj.matterid = plaintiffDetails.matterid;
            plaintiffObj.deleted = plaintiffDetails.deleted;
            plaintiffObj.dateofbirth = plaintiffDetails.dateofbirth;
            plaintiffObj.utcdateofbirth = plaintiffDetails.utcdateofbirth;
            plaintiffObj.ssn = plaintiffDetails.ssn;
            plaintiffObj.isprimary = plaintiffDetails.isprimary;
            plaintiffObj.isinfant = plaintiffDetails.isinfant;
            plaintiffObj.isemployed = plaintiffDetails.isemployed;
            plaintiffObj.isalive = plaintiffDetails.isalive;
            plaintiffObj.client_status = (plaintiffDetails.client_status) ? '1' : '0';
            plaintiffObj.salarymode = plaintiffDetails.salarymode;
            plaintiffObj.primarylanguage = plaintiffDetails.primarylanguage;
            plaintiffObj.employerid = utils.isEmptyVal(plaintiffDetails.employerid) ? null : (angular.isDefined(plaintiffDetails.employerid.contactid)) ? plaintiffDetails.employerid.contactid : null;
            plaintiffObj.plaintiffid = plaintiffDetails.plaintiffid;
            return plaintiffObj;
        }
        function close() {
            $modalInstance.dismiss();
        }
    }
})(angular);

