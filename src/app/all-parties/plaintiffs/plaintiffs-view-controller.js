;

(function () {

    'use strict';

    angular
        .module('cloudlex.allParties')
        .controller('PlaintiffsViewCtrl', PlaintiffsViewController);

    PlaintiffsViewController.$inject = ['$modal', 'allPartiesDataService', '$stateParams', '$state',
        '$scope', '$timeout', 'modalService', 'matterFactory', 'notification-service', 'contactFactory', 'masterData'];

    function PlaintiffsViewController($modal, allPartiesDataService, $stateParams, $state,
        $scope, $timeout, modalService, matterFactory, notificationService, contactFactory, masterData) {

        var self = this;
        self.matterId = $stateParams.matterId;
        self.plaintiffs = [];
        self.selectedPlaintiffs = [];
        self.allPartiesPrint = allPartiesPrint;
        var gracePeriodDetails = masterData.getUserRole();
        self.isGraceOver = gracePeriodDetails.plan_subscription_status;
        self.firmID = gracePeriodDetails.firm_id;
        self.clxUserId = localStorage.getItem('userId');
        //Salary button options
        self.salaryBtns = [{ label: "Hourly", value: "1" },
        { label: "Weekly", value: "4" }, //add new label(weekly) US#7507
        { label: "Monthly", value: "2" },
        { label: "Yearly", value: "3" },

        ];
        self.setSelectedTab = setSelectedTab;

        self.entityPermissionToggleForMattercollaboration = entityPermissionToggleForMattercollaboration;
        self.endUserCollaboration = endUserCollaboration;
        self.disableSingleEntityForMattercollaboration = disableSingleEntityForMattercollaboration;

        function init() {
            self.matterInfo = matterFactory.getMatterData(self.matterId);
            self.allfirmData = JSON.parse(localStorage.getItem('allFirmSetting'));
            _.forEach(self.allfirmData, function (item) {
                if (item.state == "entity_sharing") {
                    self.isCollaborationActive = (item.enabled == 1) ? true : false;
                    if (self.isCollaborationActive) {
                        getMatterCollaboratedEntity();
                    }
                }
            });
        }

        (function () {
            //getPlaintiffs();
            setPlaintiffs(false);//Bug#5479
            init();//B#14367
        })();

        /*set label as per the selected salary mode*/
        function setSalaryMode(val) {
            var salaryBtn = _.find(self.salaryBtns, function (btn) {
                return btn.value == val;
            });
            return utils.isNotEmptyVal(salaryBtn) ? salaryBtn.label : '';
        }


        function setPlaintiffs(isContactCardEdited) {
            self.plaintiffs = allPartiesDataService.getAllPartiesData().plaintiff.data;
            self.contactids = [];
            self.estateadminids = [];
            var plaintiffId = localStorage.getItem('plaintiffOpen')
            angular.forEach(self.plaintiffs, function (field, index) {
                if (plaintiffId == field.plaintiffid) {
                    field.open = true;
                    if (localStorage.getItem('collabDetailsActive') == 'collaborationdetail') {
                        setSelectedTab('collaborationdetail');
                    }
                }
                else {
                    field.open = false;
                }

                contactFactory.formatContactAddress(field.guardianid);
                contactFactory.formatContactAddress(field.contactid);
                contactFactory.formatContactAddress(field.studentinstitutionid);

                //contactFactory.formatContactAddress(field.employerid);
                contactFactory.formatContactAddress(field.estateadminid);

                angular.forEach(field.plaintiff_otherparty_id, function (fieldOperty, indexOparty) {
                    contactFactory.formatContactAddress(fieldOperty);
                });
                if (field.employerid == 1) {
                    field.employerid = [];
                }

                if (!isContactCardEdited && field.employerid && typeof (field.employerid) === 'object' && field.employerid.length > 0) {
                    field.employerid.sort(function (a, b) { return b.employmentstartdate - a.employmentstartdate; })
                    angular.forEach(field.employerid, function (fieldOperty, indexOparty) {
                        fieldOperty.employmentstartdate = (utils.isEmptyVal(fieldOperty.employmentstartdate) || fieldOperty.employmentstartdate == 0) ? "" : moment.unix(fieldOperty.employmentstartdate).utc().format('MM/DD/YYYY');
                        fieldOperty.employmentenddate = (utils.isEmptyVal(fieldOperty.employmentenddate) || fieldOperty.employmentenddate == 0) ? "" : moment.unix(fieldOperty.employmentenddate).utc().format('MM/DD/YYYY');
                        fieldOperty.salaryMode = setSalaryMode(fieldOperty.salarymode);
                        contactFactory.formatContactAddress(fieldOperty.contactid);
                    });
                }
                self.contactids.push(field.contactid);
                if (field.estateadminid) {
                    self.estateadminids.push(field.estateadminid);
                }
            });
            contactFactory.getPhonesInSeq(self.contactids);
            contactFactory.getPhonesInSeq(self.estateadminids);
            angular.forEach(self.plaintiffs, function (field, index) {
                field.hasMedicalSummary = isMedicalSummaryAdded(field);
            });
            $scope.$parent.plaintiffsCount = self.plaintiffs.length;
            //Bug#5479-contact email delete issue 
            if (!isContactCardEdited) {
                angular.forEach(self.plaintiffs, function (plaintiff) {
                    if (utils.isNotEmptyVal(plaintiff.contactid)) {
                        plaintiff.contactid.email = plaintiff.contactid.emailid;
                    }
                    //Bug#6433: Guardian,employer,student contact email update issue fixed
                    if (utils.isNotEmptyVal(plaintiff.guardianid)) {
                        (utils.isNotEmptyVal(plaintiff.guardianid.emailid)) ? plaintiff.guardianid.email = plaintiff.guardianid.emailid
                            : angular.noop();
                    }
                    if (utils.isNotEmptyVal(plaintiff.studentinstitutionid)) {
                        (utils.isNotEmptyVal(plaintiff.studentinstitutionid.emailid)) ? plaintiff.studentinstitutionid.email = plaintiff.studentinstitutionid.emailid : angular.noop();
                    }

                });
            }



        }

        function contactMatterCollaboaratedEntity() {
            _.forEach(self.plaintiffs, function (plaintiff, plaintiffIndex) {
                plaintiff['collaboratedEntityFileCount'] = 0;
                plaintiff['disableCollaborationFlag'] = true;
                _.forEach(self.matterCollaboratedEntity, function (entity, entityIndex) {
                    if (parseInt(entity.id) == parseInt(plaintiff.contactid.contactid)) {
                        plaintiff['collaboratedEntity'] = entity;
                        var doc = 0, note = 0, event = 0;
                        if (entity.documentEntity && entity.documentEntity.documents) {
                            doc = entity.documentEntity.documents.length;
                        }
                        if (entity.noteEntity && entity.noteEntity.notes) {
                            note = entity.noteEntity.notes.length;
                        }
                        if (entity.eventEntity && entity.eventEntity.events) {
                            event = entity.eventEntity.events.length;
                        }
                        plaintiff['collaboratedEntityFileCount'] = doc + note + event;
                        plaintiff['disableCollaborationFlag'] = false;
                    }

                });
            });
        }

        $scope.$on("contactCardEdited", function (event, editedContact) {
            var contactObj = editedContact;
            allPartiesDataService.updateAllPartiesDataOnContactEdit(contactObj);
            setPlaintiffs(true);//Bug#5436
        });

        /*** Service call Functions ***/
        function getPlaintiffs() {
            allPartiesDataService.getPlaintiffs(self.matterId)
                .then(function (response) {
                    if (response.data) {
                        self.plaintiffs = response.data;
                        angular.forEach(self.plaintiffs, function (field, index) {
                            field.hasMedicalSummary = isMedicalSummaryAdded(field);
                        });
                        $scope.$parent.plaintiffsCount = self.plaintiffs.length;
                        setPlaintiffs(false);
                        init();//B#14367
                    }
                });
        };

        function isMedicalSummaryAdded(plaintiff) {
            if (plaintiff.bodilyinjury || plaintiff.insurance_details ||
                (plaintiff.medical_bills && plaintiff.medical_bills.medical_bills_amount) ||
                (plaintiff.liens && plaintiff.liens.lien_amount) ||
                (plaintiff.expense && plaintiff.expense.expense_amount)) {

                return true;
            }
            return false;
        };

        /*** Event Handlers ***/


        self.getPlaintiffStatus = function (plaintiff) {
            var status = [];

            if (plaintiff.isinfant == 1 || plaintiff.isinfant == true) {
                status.push("Minor");
            }

            if (plaintiff.isstudent == 1 || plaintiff.isstudent == true) {
                status.push("Student");
            }

            if (plaintiff.employerid && plaintiff.employerid != 1 && plaintiff.employerid.length > 0) {
                status.push("Employed");
            }


            return status.toString().replace(/,/g, ", ");
        };

        self.setSelectedPlaintiff = function (plaintiff) {
            $timeout(function () {
                //self.plaintiffs[index].checked = self.plaintiffs[index].checked ? false : true;
                plaintiff.checked = plaintiff.checked ? false : true;

                if (plaintiff.checked) {
                    self.selectedPlaintiffs.push(plaintiff.plaintiffid);
                } else {
                    var removeIndex = self.selectedPlaintiffs.indexOf(plaintiff.plaintiffid);
                    self.selectedPlaintiffs.splice(removeIndex, 1);
                }
            });
        }

        // Dynamically set POA/estateadmin tab active depending on plaintiff status.
        function setSelectedTab(tabName) {
            self.selectedTab = tabName;
            if (self.selectedTab == 'collaborationdetail') {
                localStorage.setItem('collabDetailsActive', self.selectedTab)
            } else {
                localStorage.removeItem('collabDetailsActive');
            }
            switch (tabName) {
                case 'non-plaintiff': {
                    self.selectedNPTab = true;
                    self.selectedPTab = false;
                    self.selectCollab = false;
                    break;
                }
                case 'plaintiff': {
                    self.selectedPTab = true;
                    self.selectedNPTab = false;
                    self.selectCollab = false;
                    break;
                }
                case 'collaborationdetail': {
                    self.selectCollab = true;
                    self.selectedPTab = false;
                    self.selectedNPTab = false;
                }

            }
        }

        self.deleteSelectedPlaintiffs = function () {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                var promesa = allPartiesDataService.deletePlaintiffs(self.selectedPlaintiffs);
                promesa.then(function (data) {
                    getPlaintiffs();
                    self.selectedPlaintiffs = [];
                    notificationService.success('Plaintiffs deleted successfully.');
                }, function (error) {
                    notificationService.error('An error occurred. Please try later.');
                });
            });
        };

        self.editEmp = function (plaintiff, empRecord) {
            var plaintiffCopy = angular.copy(plaintiff);
            plaintiffCopy.dateofbirth = (utils.isEmptyVal(plaintiffCopy.dateofbirth)) ? "" : moment.unix(plaintiffCopy.dateofbirth).utc().format('MM/DD/YYYY');
            plaintiffCopy.dateofdeath = (utils.isEmptyVal(plaintiffCopy.dateofdeath)) ? "" : moment.unix(plaintiffCopy.dateofdeath).utc().format('MM/DD/YYYY');
            var modalInstance = $modal.open({
                templateUrl: 'app/all-parties/add-plaintiff/add-employer/addNewEmployer.html',
                controller: 'AddEmployerCtrl as addEmp',
                windowClass: 'modalXLargeDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    data: function () {
                        return {
                            emp: (empRecord) ? angular.copy(empRecord) : { iscurrent: 0, salarymode: "2" },
                            plaintiff: plaintiffCopy,
                            op: (empRecord) ? 'edit' : 'add'
                        };
                    }
                }
            });
            modalInstance.result.then(function (response) {
                if (response) {

                    if (response.empData) {
                        contactFactory.formatContactAddress(response.empData.contactid);
                        var eDataCopy = angular.copy(response.empData);
                        var empOriginal = angular.copy(response.empData);
                        var eData = angular.copy(response.empData);
                        eData.is_global = (!utils.isEmptyVal(eData.contactid) && eData.contactid.contact_type == "Local") ? 0 : 1;
                        eData.contactid = eData.contactid.contactid;
                        eData.employmentstartdate = utils.isEmptyVal(eData.employmentstartdate) ? "" : utils.getUTCTimeStamp(eData.employmentstartdate);
                        eData.employmentenddate = utils.isEmptyVal(eData.employmentenddate) ? "" : utils.getUTCTimeStamp(eData.employmentenddate);

                        if (empRecord) {
                            // edit op
                            allPartiesDataService.editPlaintiffEmployee(eData).then(function (response) {
                                var data = response.data;
                                // update record locally
                                var index = _.indexOf(plaintiff.employerid, _.findWhere(plaintiff.employerid, { employerid: empRecord.employerid }));
                                if (index > -1) {
                                    data.employmentstartdate = (utils.isEmptyVal(data.employmentstartdate)) ? "" : moment.unix(data.employmentstartdate).utc().format('MM/DD/YYYY');
                                    data.employmentenddate = (utils.isEmptyVal(data.employmentenddate)) ? "" : moment.unix(data.employmentenddate).utc().format('MM/DD/YYYY');
                                    data.salaryMode = setSalaryMode(data.salarymode);
                                    data.contactid = empOriginal.contactid;
                                    data.is_global = eData.is_global
                                    plaintiff.employerid[index] = data;
                                }
                                notificationService.success('Employer updated successfully.');
                            }, function (reason) {
                                notificationService.error('An error occurred. Please try later.');
                            });
                        } else {
                            // add op
                            eData.plaintiffid = plaintiff.plaintiffid;
                            allPartiesDataService.addPlaintiffEmployers([eData]).then(function (response) {
                                var data = response.data[0];
                                data.employmentstartdate = (utils.isEmptyVal(data.employmentstartdate)) ? "" : moment.unix(data.employmentstartdate).utc().format('MM/DD/YYYY');
                                data.employmentenddate = (utils.isEmptyVal(data.employmentenddate)) ? "" : moment.unix(data.employmentenddate).utc().format('MM/DD/YYYY');
                                data.salaryMode = setSalaryMode(data.salarymode);
                                data.contactid = empOriginal.contactid;
                                data.is_global = eData.is_global
                                data.iscurrent = eDataCopy.iscurrent;
                                // update record locally
                                if (!plaintiff.employerid) {
                                    plaintiff.employerid = [];
                                }
                                plaintiff.employerid.push(data);
                                plaintiff.isemployed = '1';
                                notificationService.success('Employer added successfully.');

                            }, function (reason) {
                                notificationService.error('An error occurred. Please try later.');
                            });
                        }


                    }

                    if (response.error) {
                        notificationService.error('An error occurred. Please try later.');
                    }

                }
            });
        }

        self.deleteSelectedEmp = function (plaintiff, eid) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                var promise = allPartiesDataService.deletePlaintiffsEmployee(eid);
                promise.then(function (data) {
                    var index = _.indexOf(plaintiff.employerid, _.findWhere(plaintiff.employerid, { employerid: eid }));
                    if (index > -1) {
                        plaintiff.employerid.splice(index, 1);
                    }
                    notificationService.success('Employer deleted successfully.');
                }, function (error) {
                    notificationService.error('An error occurred. Please try later.');
                });
            });
        };

        self.deleteSelectedPlaintiff = function (plaintiff, event) {
            //event.stopPropagation();
            if (typeof plaintiff.plaintiff_otherparty_id != "undefined" && plaintiff.plaintiff_otherparty_id.length > 0) {
                var warningMsg = 'Unable to delete plaintiff ' + plaintiff.contactid.firstname + ' ' + plaintiff.contactid.lastname + '. Reason : Plaintiff is associated with other party(s)';
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
                inputArr.push(plaintiff.plaintiffid);
                var promesa = allPartiesDataService.deletePlaintiffs(inputArr);
                promesa.then(function (data) {
                    getPlaintiffs();
                    notificationService.success('Plaintiff deleted successfully.');
                }, function (error) {
                    notificationService.error('An error occurred. Please try later.');
                });
            });


        };

        self.editPlaintiff = function (plaintiff, event) {
            var data = {
                plaintiff: plaintiff,
                matterId: self.matterId
            }
            sessionStorage.setItem("selectedPlaintiff", JSON.stringify(data));
            $state.go("editPlaintiff", { 'matterId': self.matterId, 'selectedPlaintiff': plaintiff });

        };

        self.print = function (plaintiff, event) {
            event.stopPropagation();
            //TODO: Need input on how to display tabs in print view
        };
        self.toggleAccordionGroup = function (plaintiff) {
            if (plaintiff && plaintiff.estateadminid) {
                setSelectedTab('non-plaintiff');
            } else {
                setSelectedTab('plaintiff');
            }

            /*set lable for salary mode for plaintiff view page*/
            var salarymode = plaintiff.salarymode;
            self.salaryMode = utils.isEmptyVal(salarymode) ? 'Monthly' : (salarymode[0] == "1") ? 'Hourly' : (salarymode[0] == "2") ? 'Monthly' : (salarymode[0] == "3") ? 'Yearly' : 'Weekly';
            localStorage.setItem('plaintiffOpen', plaintiff.plaintiffid);

            plaintiff.open = !plaintiff.open;
            if (!plaintiff.open) {
                localStorage.removeItem('plaintiffOpen');
            }
            // mark all records as closed except the selected plaintiff record.
            angular.forEach(self.plaintiffs, function (field, index) {
                if (field.plaintiffid != plaintiff.plaintiffid) {
                    field.open = false;
                }
            });
        };

        self.isPlaintiffDetails = function (plaintiffdetails) {
            return utils.isNotEmptyVal(plaintiffdetails);
        }

        function allPartiesPrint(plaintiffInfo) {
            matterFactory.fetchMatterData(self.matterId).then(function (resultData) {
                self.matterInfo = resultData;
                var matterInfo = angular.copy(self.matterInfo);
                var matterInformation = {
                    'Matter Name': matterInfo.matter_name,
                    'File #': matterInfo.file_number
                };

                var printPage = allPartiesDataService.printPlaintiff(plaintiffInfo, matterInformation);
                window.open().document.write(printPage);
            });
        }

        /*** Styling Functions ***/

        /*** Alert Functions ***/

        function entityPermissionToggleForMattercollaboration(flag, entity, status) {

            var obj = {
                firmId: parseInt(self.firmID),
                matterId: parseInt(self.matterId),
                contacts: [{ id: entity.id }],
            }

            if (flag == 'document') {
                obj['entityType'] = 1;
                obj["documentEntity"] = {
                    docPermission: (status ? 1 : 0)
                }
            } else if (flag == 'event') {
                obj['entityType'] = 2;
                obj["eventEntity"] = {
                    eventPermission: (status ? 1 : 0)
                }
            } if (flag == 'note') {
                obj['entityType'] = 3;
                obj["noteEntity"] = {
                    notePermission: (status ? 1 : 0)
                }
            }

            allPartiesDataService.modifyEntityPermissionForMattercollaboration(obj)
                .then(function (data) {
                    getMatterCollaboratedEntity()
                }, function (data) {
                });

        }

        function endUserCollaboration(entity) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Confirm',
                headerText: 'Stop Sharing?',
                bodyText: 'Are you sure you want to stop sharing with this contact?'
            };
            var obj = {
                firmId: parseInt(self.firmID),
                matterId: parseInt(self.matterId),
                contacts: [{ id: entity.id }],
                clxUserId: self.clxUserId,
            }
            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                var promise = allPartiesDataService.endUserCollaboration(obj);
                promise.then(function (data) {
                    notificationService.success('Access disabled successfully.');
                    $state.go('allParties', { 'matterId': self.matterId }, {
                        reload: true
                    });
                }, function (data) {
                })
            });
        }


        function disableSingleEntityForMattercollaboration(flag, entity, selectedObj, state) {
            var obj = {
                firmId: parseInt(self.firmID),
                matterId: parseInt(self.matterId),
                contacts: [{ id: entity.id, isEnable: 0 }]
            }

            if (flag == 'document') {
                obj['entityType'] = 1;
                obj["documentEntity"] = {
                    docIds: [selectedObj.doc_id]
                }
            } else if (flag == 'event') {
                obj['entityType'] = 2;
                obj["eventEntity"] = {
                    eventIds: [selectedObj.event_id]
                }
            } if (flag == 'note') {
                obj['entityType'] = 3;
                obj["noteEntity"] = {
                    noteIds: [selectedObj.note_id]
                }
            }

            ///////////////
            var modalInstance = $modal.open({
                templateUrl: 'app/all-parties/plaintiffs/disable-collaboration/disable-collaboration.html',
                controller: 'disableSingleEntityForMattercollaborationCtrl as disableEntityMC',
                size: 'lg',
                backdrop: 'static',
                keyboard: false,
                windowClass: 'modalLargeDialog',
                resolve: {
                    inputParams: function () {
                        return { 'matterId': self.matterId, 'matterName': self.matterIdForCM, 'flag': flag, 'entity': entity, 'selectedObj': selectedObj, 'state': state, 'configObj': obj };
                    }
                }
            });
            modalInstance.result.then(function () {

            });
            /////////////////

            //$state.go('disableEntity', { 'matterId': self.matterId, 'matterName': self.matterIdForCM, 'flag': flag, 'entity': entity, 'selectedObj': selectedObj, 'state': state, 'configObj': obj });
        }


        function getMatterCollaboratedEntity() {
            if (self.isCollaborationActive) {
                matterFactory.getMatterCollaboratedEntity(self.matterId, self.firmID)
                    .then(function (data) {
                        _.forEach(data, function (rec) {
                            _.forEach(rec.noteEntity.notes, function (note) {
                                var text = note.plaintext;
                                text = utils.replaceQuoteWithActual(text);
                                note.displayText = text;
                            });
                        });

                        localStorage.setItem('getMatterCollaboratedEntity', JSON.stringify(data));
                        self.matterCollaboratedEntity = JSON.parse(localStorage.getItem('getMatterCollaboratedEntity'));
                        contactMatterCollaboaratedEntity();
                    }, function (data) {
                        // notification.error('Error ');
                    });
            }

        }

    }

})();


(function () {
    'use strict';

    angular
        .module('cloudlex.allParties')
        .controller('disableSingleEntityForMattercollaborationCtrl', disableSingleEntityForMattercollaborationCtrl);

    disableSingleEntityForMattercollaborationCtrl.$inject = ['inputParams', '$state', 'allPartiesDataService', 'matterFactory', 'documentsDataService', 'eventsDataService', 'globalConstants', 'notification-service', '$modalInstance'];

    function disableSingleEntityForMattercollaborationCtrl($stateParams, $state, allPartiesDataService, matterFactory, documentsDataService, eventsDataService, globalConstants, notificationService, $modalInstance) {
        var self = this;
        self.disableAccess = disableAccess;
        self.cancel = cancel;
        self.param = $stateParams;
        if ($stateParams.matterId) {
            localStorage.setItem('disableSingleEntityForMattercollaborationCtrl', JSON.stringify(self.param));
        } else {
            self.param = JSON.parse(localStorage.getItem('disableSingleEntityForMattercollaborationCtrl'));
        }



        (function () {
            setBreadcrum();
            if (self.param.flag == 'document') {
                documentCode();
            } else if (self.param.flag == 'note') {
                noteCode();
            } else if (self.param.flag == 'event') {
                eventCode();
            }
        })();

        /**
         *  Start: documentCode(); 
         */
        function documentCode() {
            self.viewable = true;
            getDocumentDetail(self.param.matterId, self.param.selectedObj.doc_id);
        }

        /*Get a single document detial*/
        function getDocumentDetail(matterId, documentId) {
            documentsDataService.getDocumentDetails(matterId, documentId)
                .then(function (response) {
                    /*Checking if received the proper responce or not*/
                    if (response.doc_name) {
                        self.singleDoc = response;
                        self.singleDoc.doc_ext = response.doc_extension.toLowerCase();
                        // processMoreInfoByType(self.singleDoc.more_info_type);
                        //self.editable = (response.islocked == "1") ? false : true;
                        // getDocInfoForOffice(response);
                        setDocumentDetails();
                        response.more_info_type === "insurance" ? getPlaintiffsForDocument(response.matterid) : angular.noop();
                    } else {
                        /*show Error if responce is invalid*/
                        notificationService.error('document detail not loaded');
                        // gotodocList();
                    }
                }, function (error) {
                    notificationService.error('document detail not loaded');
                    // gotodocList();
                });
        }

        /* Assign the value to models from document details*/
        function setDocumentDetails() {
            //self.singleDoc.currentlyusedby = self.singleDoc.currentlyusedby.trim();
            //self.singleDoc.document_ext = angular.lowercase(self.singleDoc.document_ext);
            var doc_ext = getFileExtention(self.singleDoc);
            doc_ext = angular.lowercase(doc_ext);
            if (doc_ext == 'pdf' || doc_ext == 'txt' || doc_ext == 'png' || doc_ext == 'jpg' || doc_ext == 'jpeg' || doc_ext == 'gif') {
                /* Generate view link if document is pdf/image/txt */
                if (self.singleDoc.doc_uri !== null) {
                    var uriArr = self.singleDoc.doc_uri.split('/');
                    var filename = uriArr[uriArr.length - 2] + '/' + uriArr[uriArr.length - 1];
                    var filenameArr = filename.split('.');
                    var extension = filenameArr[filenameArr.length - 1].toLowerCase();

                    try {
                        var dfilename = decodeURIComponent(filename);
                        filename = dfilename;
                    } catch (err) { }
                    var filenameEncoded = encodeURIComponent(filename);
                    var documentNameEncoded = encodeURIComponent(self.singleDoc.documentname);
                    documentsDataService.viewdocument(self.singleDoc.doc_id).then(function (res) {
                        self.singleDoc.viewdocumenturi = res;
                    })
                } else {
                    self.singleDoc.viewdocumenturi = '';
                }
            } else {
                self.viewable = false;
            }
        }

        /*Generate download link for documents*/
        self.generateDocLink = generateDocLink;
        function generateDocLink() {
            documentsDataService.downloadDocument(self.param.selectedObj.doc_id)
                .then(function (response) {
                    if (response && response && response != '') {
                        utils.downloadFile(response, self.singleDoc.doc_name, "Content-Type");
                    } else {
                        notificationService.error('Unable to download document');
                    }

                }, function (error) {
                    notificationService.error('document categories not loaded');
                });
        }

        //office 365 start
        function getFileExtention(doc) {
            return (doc.doc_name).split('.').pop();
        }
        /**
        *  End: documentCode(); 
        */

        /**
        *  Start: noteCode(); 
        */
        function noteCode() {

        }
        /**
        *  End: noteCode(); 
        */

        /**
        *  Start: eventCode(); 
        */
        function eventCode() {
            self.selectedEvent = {};
            self.reminderDaysList = angular.copy(globalConstants.reminderDaysList);
            self.userSelectedType = [{ id: 1, name: 'Assigned to Matter' }, { id: 2, name: 'All Users' }, { id: 3, name: 'Select User' }];

            eventsDataService.getSingleEvent_OFF_DRUPAL(self.param.selectedObj.event_id, false)
                .then(function (data) {
                    self.selectedEvent = data;
                    /** */
                    self.selectedEvent = setEventForMatterCollaboration(self.selectedEvent);
                    /** */
                }, function (data) {
                });
        }


        function setEventForMatterCollaboration(event) {
            // (event.reminder_users == "all" || event.reminder_users == "matter") ? '' : event.reminder_users_id = 3 ;
            event.event_display_name = (event.label_id == '100' || event.label_id == '19' || event.label_id == '32') ? event.title : event.event_name;

            event.utcstart = angular.isDefined(event.start) ? event.start : event.start;
            event.utcend = angular.isDefined(event.end) ? event.end : event.end;

            if (event.custom_reminder) {
                event.custom_reminder = utils.isEmptyVal(event.custom_reminder) ? '' : moment.unix(event.custom_reminder).utc().format('MM-DD-YYYY');
            }


            if (utils.isNotEmptyVal(event.reminder_days)) {
                event.reminder_days = event.reminder_days.split(',');
            } else {
                event.reminder_days = [];
            }

            event.assigned_to_name = utils.isEmptyVal(event.assigned_to) ? '' : _.pluck(event.assigned_to, 'full_name').join(', ');

            //get event history data for selected event 
            //   getEventHistoryData(self.selectedEvent.event_id);
            // US#8328 for set reminderdays count
            //   setReminderDaysList(self.selectedEvent);
            getEventRemindUser(event);
            //Bug#9805 for  assigned_to_name
            //   self.assigned_to_name = utils.isEmptyVal(self.selectedEvent.assigned_to) ? '' : _.pluck(self.selectedEvent.assigned_to, 'full_name').join(', ');



            return event;
        }


        //US#8558 Event & Task reminder to matter users or all users
        function getEventRemindUser(event) {
            if (utils.isEmptyVal(event)) { return }
            if (event.reminder_users == "matter") {
                self.reminder_users_id = 1;
            } else if (event.reminder_users == "all") {
                self.reminder_users_id = 2;
            } else if (event.reminder_users && event.reminder_users.length > 0 && JSON.parse(event.reminder_users) instanceof Array) {
                self.users = [];
                self.reminder_users_id = 3;
                if (angular.isDefined(event.reminder_users) && event.reminder_users != "" && event.reminder_users != "all" && event.reminder_users != "matter") {
                    //event.remind_users_temp = event.reminder_users;
                    //self.selectedEvent.remind_users_temp = event.reminder_users;
                } else {
                    // event.remind_users_temp = [];
                    self.selectedEvent.remind_users_temp = event.reminder_users;
                }

                // contactFactory.getUsersInFirm()
                //     .then(function (response) {
                //         self.users = response.data;
                //         self.selectedEvent.remind_users_temp = [];
                //         _.forEach(JSON.parse(event.reminder_users), function (taskid, taskindex) {
                //             _.forEach(self.users, function (item) {
                //                 if (taskid == item.uid) {
                //                     self.selectedEvent.remind_users_temp.push(taskid);
                //                 }
                //             });
                //         });
                //     });

                eventsDataService.getStaffsInFirm()
                    .then(function (data) {
                        self.users = data;
                        self.selectedEvent.remind_users_temp = [];
                        if (event.reminder_users && event.reminder_users.length > 0) {

                            _.forEach(JSON.parse(event.reminder_users), function (taskid, taskindex) {
                                _.forEach(self.users, function (item) {
                                    if (taskid == item.user_id) {
                                        self.selectedEvent.remind_users_temp.push(parseInt(taskid));
                                    }
                                });
                            });
                        }

                    }, function (err) {
                        // console.log(err);
                    });

            }
        }

        /**
        *  End: eventCode(); 
        */

        function disableAccess() {
            allPartiesDataService.disableEntityAccess(self.param.configObj)
                .then(function (data) {
                    notificationService.success('Access disabled successfully');
                    if (self.param.state == 'otherRelated-view') {
                        $state.go("allParties", {
                            'matterId': $stateParams.matterId,
                            'openView': 'OTHER_PARTY_VIEW'
                        }, {
                                reload: true
                            });
                    } else {
                        $state.go("allParties", { 'matterId': self.param.matterId }, { reload: true });
                    }
                }, function (data) {
                    notificationService.error('Access disabled error');

                });
        }

        function cancel() {
            $modalInstance.close();
            // if (self.param.state == 'otherRelated-view') {
            //     $state.go("allParties", {
            //         'matterId': $stateParams.matterId,
            //         'openView': 'OTHER_PARTY_VIEW'
            //     }, {
            //             reload: true
            //         });
            // } else {
            //     $state.go('allParties', { 'matterId': self.param.matterId });
            // }
        }

        function setBreadcrum() {
            matterFactory.setBreadcrumWithPromise(self.param.matterId, 'All Parties').then(function (resultData) {
                self.matterInfo = resultData;
            });
            // routeManager.addToBreadcrum([{ name: 'Collaboration Settings' }]);
        }


    }
})();




