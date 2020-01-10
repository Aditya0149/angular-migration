(function (angular) {
    angular.module('cloudlex.report').
        controller('insuranceFilterCtrl', insuranceFilterCtrl);

    insuranceFilterCtrl.$inject = ['$modalInstance', '$scope', 'masterData', 'notification-service', 'filter', 'tags', 'globalConstants','matterFactory','matterDetailsService'];

    function insuranceFilterCtrl($modalInstance, $scope, masterData, notificationService, filter, tags, globalConstants,matterFactory,matterDetailsService) {
        var self = this;
        var masterDataObj = masterData.getMasterData();
        self.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;
        self.apply = apply;
        self.cancel = cancel;
        self.resetFilters = resetFilters;
        var edited = false;
        self.tags = (tags) ? tags : [];
        self.excessconfirmed = [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Blank", value: "Blank" }];
        self.insuranceTypeList = angular.copy(globalConstants.insuranceTypeList);
        self.newInsauranceInfo = {};
        self.getContacts = getContacts;
        self.formatTypeaheadDisplay = formatTypeaheadDisplay;
        self.JavaFilterAPIForContactList = true;
        self.enableArchivedCheck = true;
        function init() {
            self.filter = angular.copy(filter);
            self.newInsauranceInfo = filter.newInsauranceInfo;
            //self.filter.policy_exhausted = '';
            //self.filter.excess_confirmed = '';
        }
        init();

        function cancel() {
            $modalInstance.dismiss('cancel');
        }
        function checkIfEnterKeyWasPressed(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
            return true;

        }

        $scope.$watch(function () {
            if (utils.isNotEmptyVal(self.filter.insurancetype) || (self.filter.policy_exhausted && self.filter.policy_exhausted.length > 0) ||
                (self.filter.excess_confirmed && self.filter.excess_confirmed.length > 0) ||
                utils.isNotEmptyVal(self.filter.policylimit) || (self.filter.includeArchived == 1) ||
                utils.isNotEmptyVal(self.filter.policylimit_max) || self.tags.length > 0 || utils.isNotEmptyVal(self.newInsauranceInfo.insurance_provider) || (typeof (self.filter.includeClosed) != 'undefined' && self.filter.includeClosed != 0)) {
                self.enableApply = false;
            } else {
                self.enableApply = true;
            }
            if (self.filter.includeClosed == '1') {
                self.enableArchivedCheck = false;
            }
            if (self.filter.includeClosed == '0') {
                self.enableArchivedCheck = true;
                self.filter.includeArchived = 0;
            }
        })

        function getContacts(contactName, searchItem) {
            var postObj = {};
            postObj.type = globalConstants.mattDetailsInsurance;
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            //postObj = matterFactory.setContactType(postObj);
            postObj.page_Size = 250

            return matterFactory.getContactsByName(postObj, self.JavaFilterAPIForContactList)
                .then(function (response) {
                    var data = response.data;
                    matterDetailsService.setDataPropForContactsFromOffDrupalToNormalContact(data);
                    matterDetailsService.setNamePropForContactsOffDrupal(data);

                    contacts = data;
                    _.forEach(data, function (contact) {
                        contact.name = utils.removeunwantedHTML(contact.first_name) + ' ' + utils.removeunwantedHTML(contact.last_name);
                    });
                    return data;
                });
        }
        function formatTypeaheadDisplay(contact) {
            if (angular.isUndefined(contact) || utils.isEmptyString(contact)) {
                return undefined;
            }
            //if name prop is not present concat firstname and lastname
            //return (contact.name || (contact.firstname + " " + contact.lastname));
            var firstname = angular.isUndefined(contact.first_name) ? '' : contact.first_name;
            var lastname = angular.isUndefined(contact.last_name) ? '' : contact.last_name;
            return (contact.name || (firstname + " " + lastname));
        }

        //when we submit popup collect the scope object
        function apply(filter) {
            var filtercopy = angular.copy(filter);
            filtercopy.newInsauranceInfo = self.newInsauranceInfo;
            if ((filtercopy.newInsauranceInfo.insurance_provider) != null && typeof (filtercopy.newInsauranceInfo.insurance_provider) == "string" && filtercopy.newInsauranceInfo.insurance_provider != "") {
                notificationService.error("Invalid Insurance Provider Selected.")
                filtercopy.newInsauranceInfo  = {};
                self.newInsauranceInfo = {};
                return;
            }
            if (parseInt(filtercopy.policylimit) > parseInt(filtercopy.policylimit_max)) {
                notificationService.error("Policy limit range is incorrect.");
                return;
            }
            $modalInstance.close({ tags: [], filter: filtercopy });
        }

        // Function For reset 
        function resetFilters() {
            self.filter.policylimit = '';
            self.filter.policylimit_max = '';
            self.filter.insurancetype = '';
            self.filter.policy_exhausted = '';
            self.filter.excess_confirmed = '';
            self.filter.includeArchived = 0;
            self.enableArchivedCheck = true;
            self.newInsauranceInfo = {};
            self.filter.includeClosed = 0;
            filter.newInsauranceInfo = {};
        }


    }
})(angular)