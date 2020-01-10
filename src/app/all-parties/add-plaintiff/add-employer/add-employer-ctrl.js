
(function () {

    'use strict';

    angular
        .module('cloudlex.allParties')
        .controller('AddEmployerCtrl', AddEmployerCtrl);

    AddEmployerCtrl.$inject = ['notification-service', '$scope', '$modalInstance', "matterFactory", 'globalConstants', "contactFactory", "data"];

    function AddEmployerCtrl(notificationService, $scope, $modalInstance, matterFactory, globalConstants, contactFactory, data) {
        var self = this;
        self.JavaFilterAPIForContactList = true;

        (function () {
            self.employee = data.emp;
            self.plaintiff = data.plaintiff;
            self.isEdit = (data.op && data.op == "edit") ? true : false;
            self.formatTypeaheadDisplay = contactFactory.formatTypeaheadDisplay;
            self.getContacts = getContacts;
            self.setType = setType;
            self.addNewContact = addNewContact;
            self.openCalender = openCalender;
            self.setsalaryMode = setsalaryMode;
            //Salary button options
            self.salaryBtns = [{ label: "Hourly", value: "1" },
            { label: "Weekly", value: "4" }, //add new label(weekly) US#7507
            { label: "Monthly", value: "2" },
            { label: "Yearly", value: "3" },
            ];           

        })();

        self.clearDate = function(){
            if(self.employee.iscurrent == 1){
                self.employee.employmentenddate = "";
            }
        }

        $scope.close = function () {
            $modalInstance.close({ empData: null });
        }

        $scope.add = function () {
            AddOrUpdate();
        }

        $scope.update = function () {
            AddOrUpdate();
        }

        $scope.isDatesValid = function() {
            if ($('#DojDateError').css("display") == "block" || $('#DorDateError').css("display") == "block") {
                return true;
            } else {
                return false;
            }
        }

        function AddOrUpdate() {
            if (utils.isEmptyVal(self.employee.contactid) || (utils.isEmptyVal(self.employee.contactid.contactid))) {
                notificationService.error("Employer name should be present");
                return;
            }
            if (self.employee.iscurrent == 1) {
                self.employee.employmentenddate = "";
            }

            self.employee.iscurrent = self.employee.iscurrent.toString();
            
            //Bug#5639- Validation of DoB and Date of Joining
            var datesToValidate = angular.copy(self.employee);
            datesToValidate.DoJ = moment(datesToValidate.employmentstartdate).utc();
            datesToValidate.DoR = moment(datesToValidate.employmentenddate).utc();
            if (!utils.isEmptyVal(self.employee.employmentstartdate) && !utils.isEmptyVal(self.plaintiff.dateofbirth)) {
                datesToValidate.DoB = moment(self.plaintiff.dateofbirth).utc();
                if (!utils.isEmptyVal(self.employee.employmentstartdate) && (datesToValidate.DoJ.isBefore(datesToValidate.DoB))) {
                    notificationService.error("Start Date should be greater than Date of Birth.")
                    return;
                }
            }

            if (!utils.isEmptyVal(self.employee.employmentstartdate) && !utils.isEmptyVal(self.plaintiff.dateofdeath)) {
                datesToValidate.DoD = moment(self.plaintiff.dateofdeath).utc();
                if (!utils.isEmptyVal(self.employee.employmentstartdate) && !(datesToValidate.DoJ.isBefore(datesToValidate.DoD))) {
                    notificationService.error("Start Date should be less than Date of Death.")
                    return;
                }
            }

            if (self.employee.iscurrent == 0 && (!utils.isEmptyVal(self.employee.employmentstartdate)) && ((utils.isEmptyVal(self.employee.employmentenddate)))) {
                notificationService.error("End Date should be present");
                return;
            }

            if (!utils.isEmptyVal(self.employee.employmentstartdate) && !utils.isEmptyVal(self.employee.employmentenddate) && (datesToValidate.DoR.isBefore(datesToValidate.DoJ))) {
                notificationService.error("End Date should be greater than Start Date.")
                return;
            }

            if (!utils.isEmptyVal(self.employee.employmentenddate) && !utils.isEmptyVal(self.plaintiff.dateofdeath)) {
                datesToValidate.DoD = moment(self.plaintiff.dateofdeath).utc();
                if (!utils.isEmptyVal(self.employee.employmentenddate) && !(datesToValidate.DoR.isBefore(datesToValidate.DoD))) {
                    notificationService.error("End Date should be less than Date of Death.")
                    return;
                }
            }

            $modalInstance.close({ empData: self.employee });
        }

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        function getContacts(contactName, searchItem) {

            var postObj = {};
            postObj.type = globalConstants.employeeTypeList;

            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            //postObj = matterFactory.setContactType(postObj);
            postObj.page_Size = 250 

            return matterFactory.getContactsByName(postObj,self.JavaFilterAPIForContactList)
                .then(function (response) {
                    var data = response.data;
                    contactFactory.setDataPropForContactsFromOffDrupalToNormalContact(data);
                    contactFactory.setNamePropForContactsOffDrupal(data);
                    _.forEach(data, function (contact) {
                        contact.name = utils.removeunwantedHTML(contact.first_name) + ' ' + utils.removeunwantedHTML(contact.last_name);
                    });
                    return data;
                });
        }

        function setType(model) {
            self.employee.is_global = (model.contact_type == 'Local') ? 0 : 1;
        }

        function addNewContact(type) {
            var selectedType = {};
            selectedType.type = type;
            var modalInstance = contactFactory.openContactModal(selectedType);
            modalInstance.result.then(function (response) {
                if (utils.isNotEmptyVal(response)) {
                    response['firstname'] = response.first_name;
                    response['lastname'] = response.last_name;
                    response['contactid'] = (response.contact_id).toString();
                    self.employee.contactid = response;
                }
            }, function () {
            });
        }

        function openCalender($event, model) {
            $event.preventDefault();
            $event.stopPropagation();
            self[model] = true;
        }

        /*set label as per the selected salary mode*/
        function setsalaryMode() {
            var salaryBtn = _.find(self.salaryBtns, function (btn) {
                return btn.value == self.employee.salarymode;
            });
            self.selectedsalaryMode = utils.isNotEmptyVal(salaryBtn) ? salaryBtn.label : '';
        }
    }

})();    