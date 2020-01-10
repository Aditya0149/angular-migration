;

(function () {

    'use strict';

    angular
        .module('cloudlex.allParties')
        .controller('DefendantsViewCtrl', DefendantsViewController);

    DefendantsViewController.$inject = ['allPartiesDataService', '$stateParams', '$scope', '$timeout', '$state', 'modalService', 'matterFactory', 'notification-service', 'contactFactory', 'masterData'];

    function DefendantsViewController(allPartiesDataService, $stateParams, $scope, $timeout, $state, modalService, matterFactory, notificationService, contactFactory, masterData) {

        var self = this;
        self.matterId = $stateParams.matterId;
        self.defendants = [];
        self.selectedDefendants = [];
        self.allPartiesPrint = allPartiesPrint;
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;



        (function () {
            getdefendants(false);
            $scope.$parent.defendantsCount = self.defendants.length;
            self.matterInfo = matterFactory.getMatterData(self.matterId);
        })();

        function getdefendants(isContactCardEdited) {
            self.defendants = allPartiesDataService.getAllPartiesData().defendant.data;
            angular.forEach(self.defendants, function (field, index) {
                field.dateofbirth = isContactCardEdited === true ? field.dateofbirth : (utils.isEmptyVal(field.dateofbirth)) ? "" : moment.unix(field.dateofbirth).utc().format('MM/DD/YYYY');
                contactFactory.formatContactAddress(field.contactid);
                angular.forEach(field.defendant_otherparty_id, function (fieldOperty, indexOparty) {
                    contactFactory.formatContactAddress(fieldOperty);
                });
            });
            //Bug#5479-contact email delete issue 
            if (!isContactCardEdited) {
                angular.forEach(self.defendants, function (defendant) {
                    if (utils.isNotEmptyVal(defendant.contactid)) {
                        defendant.contactid.email = defendant.contactid.emailid;
                    }
                });
            }
        }

        function allPartiesPrint(defendentInfo) {
            matterFactory.fetchMatterData(self.matterId).then(function (resultData) {
                self.matterInfo = resultData;
                var matterInfo = angular.copy(self.matterInfo);
                var matterInformation = {
                    'Matter Name': matterInfo.matter_name,
                    'File #': matterInfo.file_number
                };
                var printPage = allPartiesDataService.printDefendent(defendentInfo, matterInformation);
                window.open().document.write(printPage);
            });
        }

        //set the updated names of the edited contact
        $scope.$on("contactCardEdited", function (event, editedContact) {
            var contactObj = editedContact;
            allPartiesDataService.updateAllPartiesDataOnContactEdit(contactObj);
            getdefendants(true);//Bug#5436
        });

        /*** Service call Functions ***/
        function getDefendants() {
            allPartiesDataService.getDefendants(self.matterId)
                .then(function (response) {
                    if (response.data) {
                        self.defendants = response.data;
                        getdefendants(false); //getAllDefendents on view page
                        $scope.$parent.defendantsCount = self.defendants.length;
                    }
                });
        };


        /*** Event Handlers ***/
        self.setSelectedDefendant = function (defendant) {
            $timeout(function () {
                defendant.checked = defendant.checked ? false : true;

                if (defendant.checked) {
                    self.selectedDefendants.push(defendant.defendantid);
                } else {
                    var removeIndex = self.selectedDefendants.indexOf(defendant.defendantid);
                    self.selectedDefendants.splice(removeIndex, 1);
                }
            });
        };

        self.deleteSelectedDefendants = function () {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                var promesa = allPartiesDataService.deleteDefendants(self.selectedDefendants);
                promesa.then(function (data) {
                    getDefendants();
                    self.selectedDefendants = [];
                    notificationService.success('Defendants deleted successfully.');
                }, function (error) {
                    notificationService.error('An error occurred. Please try later.');
                });
            });
        };

        self.deleteSelectedDefendant = function (defendant, event) {
            //event.stopPropagation();
            if (typeof defendant.defendant_otherparty_id != "undefined" && defendant.defendant_otherparty_id.length > 0) {
                var warningMsg = 'Unable to delete defendant ' + defendant.contactid.firstname + ' ' + defendant.contactid.lastname + '. Reason : Defendant is associated with other party(s)';
                notificationService.warning(warningMsg);
                return;
            }

            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                var inputArr = [];
                inputArr.push(defendant.defendantid);
                var promesa = allPartiesDataService.deleteDefendants(inputArr);
                promesa.then(function (data) {
                    getDefendants();
                    notificationService.success('Defendant deleted successfully.');
                }, function (error) {
                    alert("Unable to delete.");
                });
            });
        };


        self.editDefendant = function (defendant, event) {
            var data = {
                defendant: defendant,
                matterId: self.matterId
            }
            sessionStorage.setItem("selectedDefendant", JSON.stringify(data));
            $state.go("editDefendant", { 'matterId': self.matterId, 'selectedDefendant': defendant });
        };

        self.print = function (defendant, event) {
            event.stopPropagation();
            //TODO: Print details
        };

        self.toggleAccordionGroup = function (defendant) {
            defendant.open = !defendant.open;
        };

        /*** Styling Functions ***/

        /*** Alert Functions ***/

    }

})();




//function setContactDetails(contact) {
//    _.forEach(self.defendants, function (defendants) {
//        if (utils.isNotEmptyVal(defendants.contactid)) {
//            if (defendants.contactid.contactid === contact.contactid) {
//                defendants.contactid = angular.extend({}, defendants.contactid, contact);
//                defendants.contactid.phone_number = utils.isNotEmptyVal(defendants.contactid.phone) ?
//                    defendants.contactid.phone.split(',')[0] : defendants.contactid.phone;
//                defendants.contactid.emailid = utils.isNotEmptyVal(defendants.contactid.email) ?
//                    defendants.contactid.email.split(',')[0] : defendants.contactid.email;
//                defendants.contactid.edited = true;
//            }
//        }
//    });
//}