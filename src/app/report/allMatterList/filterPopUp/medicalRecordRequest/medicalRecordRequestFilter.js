(function (angular) {

    'use strict';
    angular.module('cloudlex.report').
        controller('medicalRecordRequestFillter', medicalRecordRequestFillter);
    medicalRecordRequestFillter.$inject = ['$modalInstance', 'masterData', 'filter', 'notification-service', '$scope', 'tags', 'userList', 'matterFactory', 'globalConstants', 'contactFactory', 'matterDetailsService'];


    function medicalRecordRequestFillter($modalInstance, masterData, filter, notificationService, $scope, tags, userList, matterFactory, globalConstants, contactFactory, matterDetailsService) {
        var self = this;
        self.cancel = cancel;
        self.setTypeMedicalBills = setTypeMedicalBills;
        self.getContacts = getContacts;
        self.apply = apply;
        self.resetFilters = resetFilters;
        self.states = [];
        var contacts = [];
        self.formatTypeaheadDisplayPartials = contactFactory.formatTypeaheadDisplay;
        self.formatTypeaheadDisplay = formatTypeaheadDisplay;
        var masterData = masterData.getMasterData();
        self.states = masterData.states;
        self.tags = tags;
        self.isDatesValid = isDatesValid;
        self.JavaFilterAPIForContactList = true;
        self.checkIfEnterKeyWasPressed = checkIfEnterKeyWasPressed;
        self.documentLinked = [{ id: "1", Name: "Yes" }, { id: "0", Name: "No" }]; //list of expense category 


        $scope.openCalendar = function ($event) {
            $event.stopPropagation();
        }


        function setTypeMedicalBills(model) {
            //self.medicalRecordRequestFillter.is_global = (model.contact_type == 'Local') ? 0 : 1;
        }

        function getContacts(contactName, searchItem) {
            var postObj = {};
            postObj.type = globalConstants.mattDetailsMedicalInfo;
            postObj.first_name = utils.isNotEmptyVal(contactName) ? contactName : '';
            //postObj = matterFactory.setContactType(postObj);


            return matterFactory.getContactsByName(postObj, self.JavaFilterAPIForContactList)
                .then(function (response) {
                    var data = response.data;
                    matterDetailsService.setNamePropForContactsOffDrupal(data);
                    contacts = data;
                    _.forEach(data, function (contact) {
                        contact.name = utils.removeunwantedHTML(contact.first_name) + ' ' + utils.removeunwantedHTML(contact.last_name);
                    });
                    return data;
                });
        }
        function cancel() {
            $modalInstance.dismiss('cancel');
        }

        function isDatesValid() {
            if ($('#DORstartDatedivError').css("display") == "block" ||
                $('#DOREndDatedivError').css("display") == "block") {
                return true;
            }
            else {
                return false;
            }
        }

        //in our display value and model value are different for the input box
        //therefore we are formatting our display value based on the model value of the input box
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

        function getFilterValueForUSer(dataList, filter) {
            return dataList[filter].map(function (item) {
                return {
                    id: item.uid,
                    name: item.name
                };
            });
        }

        function checkIfEnterKeyWasPressed(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
            return true;

        };

        function moveBlankToBottom(array) {
            //make sure array has {id,name} objects
            var values = _.pluck(array, 'name');
            var index = values.indexOf('');
            utils.moveArrayElement(array, index, array.length - 1);
            return array;
        }


        function init() {
            self.filter = angular.copy(filter);
            // if date incurred is set then convert into datepicker format
            self.filter.start = (self.filter.start) ? moment.unix(self.filter.start).utc().format('MM/DD/YYYY') : '';
            //getFormatteddate(self.filter.start) : '';
            self.filter.end = (self.filter.end) ? getFormatteddate(self.filter.end) : '';

            self.filter.paralegal = angular.copy(self.filter.paralegalCopy);
            self.filter.att = angular.copy(self.filter.attorneyCopy);
            self.filter.provider = angular.copy(self.filter.serviceProviderCopy);
            // self.filter.providerId = angular.copy(self.filter.serviceProviderCopy);
            self.filter.physician = angular.copy(self.filter.physicianCopy);

            self.viewModel = {};
            if (angular.isDefined(userList)) {
                _.forEach(userList, function (data) {

                    if (angular.isDefined(data.staffonly)) {
                        self.viewModel.staff = moveBlankToBottom(getFilterValueForUSer(data, 'staffonly'));
                    } else if (angular.isDefined(data.attorny)) {
                        self.viewModel.att = moveBlankToBottom(getFilterValueForUSer(data, 'attorny'));
                    } else if (angular.isDefined(data.paralegal)) {
                        self.viewModel.paralegal = moveBlankToBottom(getFilterValueForUSer(data, 'paralegal'));
                    }

                })
            }

        }
        init();

        // convert date timestamp to MM/DD/YYYY format...
        function getFormatteddate(epoch) {
            return moment.unix(epoch).format("MM/DD/YYYY");
        }

        //reset filters
        function resetFilters() {
            self.filter.start = ""; // set blank start date
            self.filter.end = ""; // set blank end date
            self.filter.linkedDocument = '';
            self.filter.provider = '';
            self.filter.physician = '';
            self.filter.att = '';
            self.filter.paralegal = '';
            self.filter.provider = '';
            self.filter.physician = '';
            self.filter.attorneyCopy = '';
            self.filter.paralegalCopy = '';
            self.filter.serviceProviderCopy = '';
            self.filter.physicianCopy = '';
            self.filter.attorneyId ='';
            self.filter.paralegalId ='';
            self.filter.providerId ='';
            self.filter.physicianId ='';
        }

        $scope.$watch(function () {
            if (
                (self.filter && utils.isNotEmptyVal(self.filter.start)) ||
                (self.filter && utils.isNotEmptyVal(self.filter.end)) ||
                utils.isNotEmptyVal(self.filter.linkedDocument) ||
                (self.filter && utils.isNotEmptyVal(self.filter.att)) ||
                (self.filter && utils.isNotEmptyVal(self.filter.physician)) ||
                (self.filter && utils.isNotEmptyVal(self.filter.provider)) ||
                (self.filter && utils.isNotEmptyVal(self.filter.paralegal)) ||
                (self.filter && utils.isNotEmptyVal(self.filter.lowlimit)) ||
                (self.filter && utils.isNotEmptyVal(self.filter.maxlimit)) || (self.tags && self.tags.length > 0)) {
                self.enableApply = false;
            } else {
                self.enableApply = true;
            }
        })

        //when we submit popup collect the scope object
        function apply(filter) {
            var filtercopy = angular.copy(filter);

            if (typeof filtercopy.physician != "undefined" && utils.isNotEmptyVal(filtercopy.physician)) {
                if (typeof filtercopy.physician.contact_id === "undefined") {
                    return notificationService.error("Invalid Contact Selected");
                }
            }
            if (typeof filtercopy.provider != "undefined" && utils.isNotEmptyVal(filtercopy.provider)) {
                if (typeof filtercopy.provider.contact_id === "undefined") {
                    return notificationService.error("Invalid Contact Selected");
                }
            }

            if (filtercopy) {
                // convert into timestamp format...
                var start = (filtercopy.start) ? moment(filtercopy.start).unix() : '';
                var end = (filtercopy.end) ? moment(filtercopy.end).unix() : '';
            }


            if ((utils.isEmptyString(start) && utils.isNotEmptyString(end)) || (utils.isNotEmptyString(start) && utils.isEmptyString(end))) {
                notificationService.error('Invalid date range.');
                return;
            } else if (start > end) {
                notificationService.error('End date cannot be less than start date.');
                return;
            }




            // convert into timestamp format...
            filtercopy.start = (filtercopy.start) ? utils.getUTCTimeStamp(filtercopy.start) : '';
            filtercopy.end = (filtercopy.end) ? utils.getUTCTimeStampEndDay(moment(filtercopy.end)) : '';


            filtercopy.linkedDocument = utils.isNotEmptyVal(filtercopy.linkedDocument) ? filtercopy.linkedDocument : '';

            if (_.isObject(filtercopy.att)) {
                filtercopy.attorneyCopy = angular.copy(filtercopy.att);
                filtercopy.attorneyId = filtercopy.att.id;
            }
            if (_.isObject(filtercopy.paralegal)) {
                filtercopy.paralegalCopy = angular.copy(filtercopy.paralegal);
                filtercopy.paralegalId = filtercopy.paralegal.id;
            }
            if (_.isObject(filtercopy.provider) || filtercopy.provider == "") {
                filtercopy.serviceProviderCopy = angular.copy(filtercopy.provider);
                filtercopy.providerId = filtercopy.provider.contact_id;
            }
            if (_.isObject(filtercopy.physician) || filtercopy.physician == "") {
                filtercopy.physicianCopy = angular.copy(filtercopy.physician);
                filtercopy.physicianId = filtercopy.physician.contact_id;
            }



            $modalInstance.close({ tags: [], filter: filtercopy });
        }


    }



})(angular);
