(function () {
    'use strict';
    //TODO court details property not clear

    angular.module('cloudlex.matter')
        .controller('MatterOverviewCtrl', MatterOverviewCtrl);

    MatterOverviewCtrl.$inject = ['$scope', '$rootScope', '$stateParams', '$modal', 'matterFactory',
        'notification-service', "$state", 'modalService', 'eventsHelper', 'masterData', 'globalConstants', '$http', 'contactFactory', 'practiceAndBillingDataLayer', 'mailboxDataService', 'matterDetailsService'];

    function MatterOverviewCtrl($scope, $rootScope, $stateParams, $modal, matterFactory,
        notification, $state, modalService, eventsHelper, masterData, globalConstants, $http, contactFactory, practiceAndBillingDataLayer, mailboxDataService, matterDetailsService) {

        var vm = this;
        vm.matterId = $stateParams.matterId;
        var matterId = $stateParams.matterId,

            info = matterFactory.getMatterData();
        vm.matterOverviewData = {};
        vm.motionServedByUs = {};
        vm.motionServedOnUs = {};
        vm.valuationInfo = {};
        vm.deleteMatter = deleteMatter;
        vm.getNoteClass = getNoteClass
        vm.getNoteIcon = getNoteIcon;
        vm.openImgeGallery = openImgeGallery;
        vm.valuation = valuation;
        vm.clientCommunicator = clientCommunicator;
        vm.goToEvent = goToEvent;
        vm.viewAllOverdueTasks = viewAllOverdueTasks;
        vm.redirectToDocument = redirectToDocument;
        vm.getContactCard = getContactCard;
        vm.getContactCardforProvider = getContactCardforProvider; //US#7001 added seaperatly because of future purposefor court contact types  
        vm.printMatterOverview = printMatterOverview;
        vm.checkRefferaldata = checkRefferaldata;
        vm.openEditmatterview = openEditmatterview;
        vm.showArchivePopup = showArchivePopup;
        var gracePeriodDetails = masterData.getUserRole();
        vm.isGraceOver = gracePeriodDetails.plan_subscription_status;
        vm.firmIDForMatterCollaboration = gracePeriodDetails.firm_id;

        vm.isReferredlactive = localStorage.getItem('isReferalActive');


        (function () {
            displayWorkflowIcon();
            overviewinit();
            getUserEmailSignature();
            //getSubscriptionInfo();
            getMatterCollaboratedEntity();

        })();


        function displayWorkflowIcon() {
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                var resData = data.matter_apps;                                   //promise
                if (angular.isDefined(resData) && resData != '' && resData != ' ') {
                    vm.is_workflow = (resData.workflow == 1) ? true : false;
                }
            });
        }

        $rootScope.$on('updateWorkflowIcons', function (updateworkflowIconevent) {
            displayWorkflowIcon();
        });


        // //US#7592 Digital Archivar marketplace 
        // function getSubscriptionInfo() {
        //        var response = practiceAndBillingDataLayer.getConfigurableData();
        //         response.then(function (data) {
        //         vm.isDigiArchivalSub = data.DA.is_active;   
        //       });           
        //     }

        /*initialize matter overview*/
        function overviewinit() {
            vm.firmData = JSON.parse(localStorage.getItem('firmSetting'));
            vm.allfirmData = JSON.parse(localStorage.getItem('allFirmSetting'));
            _.forEach(vm.allfirmData, function (item) {
                if (item.state == "entity_sharing") {
                    vm.isCollaborationActive = (item.enabled == 1) ? true : false;
                }
            });

            var userRole = masterData.getUserRole();
            vm.isSubsriber = (userRole.is_subscriber == "1") ? true : false;

            /** Set  isPortalEnabled flag to show/hide client communicator icon **/
            if (!(angular.isDefined($rootScope.isPortalEnabled))) {
                $rootScope.isPortalEnabled = (userRole.client_portal == '1') ? true : false;
            }

            //set breadcrum
            //  var breadcrum = [{ name: '...' }];
            //  routeManager.setBreadcrum(breadcrum);

            // if (!utils.isEmptyObj(info) && (parseInt(info.matter_id) === parseInt(vm.matterId))) {
            //     var breadcrum = [{ name: info.matter_name }];
            //     routeManager.addToBreadcrum(breadcrum);
            // }

            vm.isMD = (userRole.role === 'Managing Partner/Attorney' || userRole.role === 'Attorney' || userRole.role === 'LexviasuperAdmin');
            vm.role = userRole;
            getMatterOverview();
            getValuation(matterId);
            getEvidencePhotos();
            getMotionDetilas();
            getSubscriptionInfo();

            getBodilyInjuryData();
            getMedicalBillsInfo();
            getLiensInfo();
            getExpensesInfo();
            getsettlementData();

            vm.overviewOptions = [
                { key: 'Staff', value: 'Staff' },
                { key: 'Events', value: 'Events' },
                { key: 'Tasks', value: 'Tasks' },
                { key: 'Notes', value: 'Notes' },
                { key: 'Photos', value: 'Photos' },
                { key: 'Details', value: 'Key Contacts' }
            ];
            vm.activeTab = 'Staff';
            vm.overdueLimit = 2;
            vm.todaysTaskLimit = 2;

        }


        function getBodilyInjuryData() {
            matterDetailsService.getBodilyInjuryData(matterId)
                .then(function (response) {
                    var bodilyInjuries = response.data;
                    vm.bodilyInjuries = bodilyInjuries;
                }, function () {
                    console.log("cannot get bodily injury data");
                });
        }

        function getMedicalBillsInfo() {
            var show = 'all';
            var selectedPartyType = undefined;
            matterDetailsService.getMedicalBillsInfo(vm.matterId, show, selectedPartyType)
                .then(function (response) {
                    vm.Adjustments = {};
                    var data = response;
                    vm.medicalBillsTotal = {};
                    var billamountCal = 0, paidamountCal = 0, outstandingamountCal = 0, adjustedamount = 0, Adjustment = 0;
                    _.forEach(data, function (item) {
                        utils.isNotEmptyVal(item.bill_amount) ? billamountCal += parseFloat(item.bill_amount) : '';
                        utils.isNotEmptyVal(item.paid_amount) ? paidamountCal += parseFloat(item.paid_amount) : '';
                        utils.isNotEmptyVal(item.outstanding_amount) ? outstandingamountCal += parseFloat(item.outstanding_amount) : '';
                        utils.isNotEmptyVal(item.adjusted_amount) ? adjustedamount += parseFloat(item.adjusted_amount) : '';

                        if (utils.isNotEmptyVal(item.bill_amount) && utils.isNotEmptyVal(item.adjusted_amount)) {
                            item.adjustment_amount = Adjustment += Math.round((parseFloat(item.bill_amount) - parseFloat(item.adjusted_amount)) * 100) / 100;// This fix works for two decimal places - If the decimal places is 3 then multiply and divide by 1000
                        } else {
                            if (utils.isNotEmptyVal(item.bill_amount)) {
                                // item.adjustment_amount = Adjustment += item.bill_amount;
                            } else {
                                item.adjustment_amount = (utils.isNotEmptyVal(item.adjusted_amount)) ? 0 : null;
                            }
                        }

                        vm.Adjustments = angular.copy(item.adjustment_amount);
                    })
                    vm.medicalBillsTotal.totalAdjustments = angular.copy(Adjustment);
                    vm.medicalBillsTotal.totalamountCal = billamountCal;
                    vm.medicalBillsTotal.paidamountCal = paidamountCal;
                    vm.medicalBillsTotal.outstandingamountCal = outstandingamountCal;
                    vm.medicalBillsTotal.adjustedamount = adjustedamount;
                }, function () {
                    console.log('unable to fetch medical bills');
                });
        }

        function getLiensInfo() {
            var show = "all";
            var selectedPartyType = undefined;
            matterDetailsService.getLiensInfo_BEFORE_OFF_DRUPAL(vm.matterId, show, selectedPartyType)
                .then(function (response) {
                    var data = response.data.liens;
                    vm.liensTotal = {};
                    var dueamountCal = 0, lienamountCal = 0;
                    _.forEach(data, function (item) {
                        utils.isNotEmptyVal(item.dueamount) ? dueamountCal += parseFloat(item.dueamount) : '';
                        utils.isNotEmptyVal(item.lienamount) ? lienamountCal += parseFloat(item.lienamount) : '';
                    })
                    vm.liensTotal.dueamountCal = dueamountCal;
                    vm.liensTotal.lienamountCal = lienamountCal;
                }, function () {
                    console.log('unable to fetch liens');
                });
        }


        function getExpensesInfo() {
            var show = 'all';
            var selectedPartyType = undefined;
            matterDetailsService.getExpensesInfo_BEFORE_OFF_DRUPAL(vm.matterId, show, selectedPartyType)
                .then(function (response) {
                    var data = response.data;
                    vm.expensesListTotal = {};
                    var expenseamountCal = 0, paidamountCal = 0, outstandingamountCal = 0;
                    _.forEach(data.expenses, function (item) {
                        utils.isNotEmptyVal(item.expense_amount) ? expenseamountCal += parseFloat(item.expense_amount) : '';
                        utils.isNotEmptyVal(item.paidamount) ? paidamountCal += parseFloat(item.paidamount) : '';
                    })
                    vm.expensesListTotal.expenseamountCal = expenseamountCal;
                    vm.expensesListTotal.paidamountCal = paidamountCal;
                    vm.expensesListTotal.outstandingamountCal = expenseamountCal - paidamountCal;
                });
        }

        function getsettlementData() {
            vm.matterPermissions = masterData.getPermissions();
            _.forEach(vm.matterPermissions, function (item) {
                if (item.permissions[8].V == 1) {
                    matterDetailsService.getsettlementData(vm.matterId)
                        .then(function (response) {
                            var data = response.data;
                            vm.settlementTotal = {};
                            vm.settlementTotal.demand = data.demand;
                            vm.settlementTotal.offer = data.offer;
                        }, function () {
                            console.log('Unable to load Payment Data');
                        });
                }
            });

        }

        function getSubscriptionInfo() {
            var response = practiceAndBillingDataLayer.getConfigurableData();
            response.then(function (data) {
                vm.isReferralExchange = data.RE.is_active;
                vm.isDigiArchivalSub = data.DA.is_active == 1 ? true : false;
            });
        }


        // US#5959 Role based access for matter
        var matterPermissions = masterData.getPermissions();
        vm.matterPermissions = _.filter(matterPermissions[0].permissions, function (per) {
            if (per.entity_id == '1') {
                return per;
            }
        });
        vm.matterValuatiion = _.filter(matterPermissions[0].permissions, function (per) {
            if (per.entity_id == '8') {
                return per;
            }
        });
        var permissions = masterData.getPermissions();
        vm.criticalDatesPermissions = _.filter(permissions[0].permissions, function (per) {
            if (per.entity_id == '1') {
                return per;
            }
        });

        /*pop up view for edit matter */
        function openEditmatterview(matterObj) {
            //var matterObj = {matterId: matter_id};       
            var modalInstance = $modal.open({
                templateUrl: 'app/matter/add-matter/add-matter.html',
                controller: 'AddMatterCtrl as addCtrl',
                windowClass: 'modalXLargeDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    modalParams: function () {
                        return matterObj;
                    }
                },
            });

            modalInstance.result.then(function (resp) {
                overviewinit();
                //	getMatterOverview();
                //routeManager.setBreadcrum(breadcrum);     
            }, function (error) {

            });
        }

        function getMatterOverview(contactEdited) {
            matterFactory.getMatterOverview(matterId)
                .then(function (response) {
                    $('html, body').animate({
                        scrollTop: $('#report-content').offset().top - 250
                    }, 10);

                    var matterOverviewData = response.data;
                    vm.matterOverviewData = matterFactory.setMatterOverviewVM(matterOverviewData);
                    //set referred to referred by name
                    vm.matterOverviewData.matterInfo.referred_to_data.searchlabel =
                        contactFactory.getNameForContact(vm.matterOverviewData.matterInfo.referred_to_data);
                    vm.matterOverviewData.matterInfo.referred_by_data.searchlabel =
                        contactFactory.getNameForContact(vm.matterOverviewData.matterInfo.referred_by_data);


                    //setPhoneNumbers(vm.matterOverviewData);
                    setcategory(vm.matterOverviewData);
                    // Accident Details Tab
                    vm.matter_status = vm.matterOverviewData.matterInfo.status_name;
                    vm.dateofIncidence = vm.matterOverviewData.matterInfo.dateofincidence;
                    vm.intakeDate = vm.matterOverviewData.matterInfo.intake_date_utc;
                    vm.loa = vm.matterOverviewData.matterInfo.loa;

                    vm.defendentContact = vm.matterOverviewData.defendentContact;
                    vm.plaintiffsContact = vm.matterOverviewData.plaintiffsContact;
                    vm.adjusterContact = vm.matterOverviewData.adjusterContact;
                    vm.plaintiffsContact = vm.matterOverviewData.plaintiffsContact;


                    var plaintiffsList = response.data.plaintiffs.data;
                    var enabledClientsList = _.filter(plaintiffsList, function (plaintiff) {
                        if (plaintiff.client_status == 1) {
                            return plaintiff;
                        }
                    });
                    vm.matterOverviewData.plaintiffsCount = plaintiffsList.length;
                    vm.matterOverviewData.enabledClientsCount = enabledClientsList.length;

                    //store matter information
                    // matterFactory.setMatterData(vm.matterOverviewData.matterInfo);
                    // if(utils.isEmptyVal(contactEdited)){
                    //     if (utils.isEmptyObj(info) || parseInt(info.matter_id) !== parseInt(vm.matterId)) {
                    //         var breadcrum = [{ name: vm.matterOverviewData.matterInfo.matter_name }];
                    //         routeManager.addToBreadcrum(breadcrum);
                    //     }
                    // }
                    matterFactory.setBreadcrumWithPromise(vm.matterId, '').then(function (resultData) {
                        vm.matterInfo = resultData;
                    });


                    vm.dataReceived = true;

                }, function (error) {
                    // notification.error('unable to fetch matter overview. Reason: ' + error.statusText);
                });
        }

        function checkRefferaldata(fname, lname) {
            return (utils.isNotEmptyVal(fname) || utils.isNotEmptyVal(lname));
        }
        function setcategory(matterOverviewData) {
            matterOverviewData.recentNotes.forEach(function (Notes) {
                if (Notes.catdes == null || Notes.catdes == 'null') {
                    Notes.catdes = "Note";
                }
            });
        }
        function setPhoneNumbers(matterOverviewData) {
            //key contacts
            // _.forEach(matterOverviewData.plaintiffsContact.data, function (plaintiff) {
            //     if (utils.isNotEmptyVal(plaintiff.contactid)) {
            //         plaintiff.contactid.phone_number = utils.isNotEmptyVal(plaintiff.contactid.phone_work) ?
            //             plaintiff.contactid.phone_work.split(',')[0] : '';

            //         plaintiff.contactid.phone_work = utils.isNotEmptyVal(plaintiff.contactid.phone_work) ?
            //             plaintiff.contactid.phone_work.split(',')[0] : '';
            //         plaintiff.contactid.phone_cell = utils.isNotEmptyVal(plaintiff.contactid.phone_cell) ?
            //             plaintiff.contactid.phone_cell.split(',')[0] : '';
            //         plaintiff.contactid.phone_home = utils.isNotEmptyVal(plaintiff.contactid.phone_home) ?
            //             plaintiff.contactid.phone_home.split(',')[0] : '';

            //     }
            // });
            _.forEach(matterOverviewData.defendentContact.data, function (defendants) {
                if (utils.isNotEmptyVal(defendants.defendant)) {
                    defendants.defendant.phone_number = utils.isNotEmptyVal(defendants.defendant.phone_number) ?
                        defendants.defendant.phone_number.split(',')[0] : '';

                    defendants.defendant.phone_work = utils.isNotEmptyVal(defendants.defendant.phone_work) ?
                        defendants.defendant.phone_work.split(',')[0] : '';
                    defendants.defendant.phone_cell = utils.isNotEmptyVal(defendants.defendant.phone_cell) ?
                        defendants.defendant.phone_cell.split(',')[0] : '';
                    defendants.defendant.phone_home = utils.isNotEmptyVal(defendants.defendant.phone_home) ?
                        defendants.defendant.phone_home.split(',')[0] : '';



                }
            });

            _.forEach(matterOverviewData.defendentContact.data, function (defendants) {
                if (utils.isNotEmptyVal(defendants.defendant_attorney)) {
                    defendants.defendant_attorney.phone_number = utils.isNotEmptyVal(defendants.defendant_attorney.phone_number) ?
                        defendants.defendant_attorney.phone_number.split(',')[0] : '';

                    defendants.defendant_attorney.phone_work = utils.isNotEmptyVal(defendants.defendant_attorney.phone_work) ?
                        defendants.defendant_attorney.phone_work.split(',')[0] : '';
                    defendants.defendant_attorney.phone_cell = utils.isNotEmptyVal(defendants.defendant_attorney.phone_cell) ?
                        defendants.defendant_attorney.phone_cell.split(',')[0] : '';
                    defendants.defendant_attorney.phone_home = utils.isNotEmptyVal(defendants.defendant_attorney.phone_home) ?
                        defendants.defendant_attorney.phone_home.split(',')[0] : '';



                }
            });



            _.forEach(matterOverviewData.adjusterContact, function (adjuster) {
                if (utils.isNotEmptyVal(adjuster)) {
                    adjuster.phone_number = utils.isNotEmptyVal(adjuster.phone_number) ?
                        adjuster.phone_number.split(',')[0] : adjuster.phone_number;

                    adjuster.phone_work = utils.isNotEmptyVal(adjuster.phone_work) ?
                        adjuster.phone_work.split(',')[0] : adjuster.phone_work;
                }
            });


            //set referred to referred by phone number
            vm.matterOverviewData.matterInfo.referred_by_data.phone_number =
                utils.isNotEmptyVal(vm.matterOverviewData.matterInfo.referred_by_data.phone_number) ?
                    vm.matterOverviewData.matterInfo.referred_by_data.phone_number.split(',')[0]
                    : '';

            vm.matterOverviewData.matterInfo.referred_by_data.phone_work =
                utils.isNotEmptyVal(vm.matterOverviewData.matterInfo.referred_by_data.phone_work) ?
                    vm.matterOverviewData.matterInfo.referred_by_data.phone_work.split(',')[0]
                    : '';

            vm.matterOverviewData.matterInfo.referred_to_data.phone_number =
                utils.isNotEmptyVal(vm.matterOverviewData.matterInfo.referred_to_data.phone_number) ?
                    vm.matterOverviewData.matterInfo.referred_to_data.phone_number.split(',')[0]
                    : '';

            vm.matterOverviewData.matterInfo.referred_to_data.phone_work =
                utils.isNotEmptyVal(vm.matterOverviewData.matterInfo.referred_to_data.phone_work) ?
                    vm.matterOverviewData.matterInfo.referred_to_data.phone_work.split(',')[0]
                    : '';
        }

        function updatePhoneNumbers(matterOverviewData, contactid) {
            _.forEach(matterOverviewData.plaintiffsContact.data, function (plaintiff) {
                if (utils.isNotEmptyVal(plaintiff.contactid) && plaintiff.contactid.contactid == contactid) {
                    plaintiff.contactid.phone_number = utils.isNotEmptyVal(plaintiff.contactid.phone_number) ?
                        plaintiff.contactid.phone_number.split(',')[0] : '';

                    plaintiff.contactid.phone_work = utils.isNotEmptyVal(plaintiff.contactid.phone_work) ?
                        plaintiff.contactid.phone_work.split(',')[0] : '';
                    plaintiff.contactid.phone_cell = utils.isNotEmptyVal(plaintiff.contactid.phone_cell) ?
                        plaintiff.contactid.phone_cell.split(',')[0] : '';
                    plaintiff.contactid.phone_home = utils.isNotEmptyVal(plaintiff.contactid.phone_home) ?
                        plaintiff.contactid.phone_home.split(',')[0] : '';
                }
            });

            _.forEach(matterOverviewData.defendentContact.data, function (defendants) {
                if (utils.isNotEmptyVal(defendants.defendant) && defendants.contactid == contactid) {
                    defendants.defendant.phone_number = utils.isNotEmptyVal(defendants.defendant.phone_number) ?
                        defendants.defendant.phone_number.split(',')[0] : '';

                    defendants.defendant.phone_work = utils.isNotEmptyVal(defendants.defendant.phone_work) ?
                        defendants.defendant.phone_work.split(',')[0] : '';
                    defendants.defendant.phone_cell = utils.isNotEmptyVal(defendants.defendant.phone_cell) ?
                        defendants.defendant.phone_cell.split(',')[0] : '';
                    defendants.defendant.phone_home = utils.isNotEmptyVal(defendants.defendant.phone_home) ?
                        defendants.defendant.phone_home.split(',')[0] : '';
                }
            });

            _.forEach(matterOverviewData.defendentContact.data, function (defendants) {
                if (utils.isNotEmptyVal(defendants.defendant_attorney)) {
                    if (defendants.defendant_attorney.contactid == contactid) {
                        defendants.defendant_attorney.phone_number = utils.isNotEmptyVal(defendants.defendant_attorney.phone_number) ?
                            defendants.defendant_attorney.phone_number.split(',')[0] : '';

                        defendants.defendant_attorney.phone_work = utils.isNotEmptyVal(defendants.defendant_attorney.phone_work) ?
                            defendants.defendant_attorney.phone_work.split(',')[0] : '';

                        defendants.defendant_attorney.phone_cell = utils.isNotEmptyVal(defendants.defendant_attorney.phone_cell) ?
                            defendants.defendant_attorney.phone_cell.split(',')[0] : '';
                    }
                }
            });


            _.forEach(matterOverviewData.adjusterContact.insurance_adjuster, function (adjuster) {
                if (utils.isNotEmptyVal(adjuster) && adjuster.contactid == contactid) {
                    adjuster.phone_number = utils.isNotEmptyVal(adjuster.phone_number) ?
                        adjuster.phone_number.split(',')[0] : '';

                    adjuster.phone_work = utils.isNotEmptyVal(adjuster.phone_work) ?
                        adjuster.phone_work.split(',')[0] : '';
                }
            });

            //set referred to referred by phone number
            vm.matterOverviewData.matterInfo.referred_by_data.phone_number =
                (utils.isNotEmptyVal(vm.matterOverviewData.matterInfo.referred_by_data.phone_number)
                    && vm.matterOverviewData.matterInfo.referred_by_data.contactid == contactid) ?
                    vm.matterOverviewData.matterInfo.referred_by_data.phone_number.split(',')[0]
                    : vm.matterOverviewData.matterInfo.referred_by_data.phone_number.split(',')[0];
            //work phone
            vm.matterOverviewData.matterInfo.referred_by_data.phone_work =
                (utils.isNotEmptyVal(vm.matterOverviewData.matterInfo.referred_by_data.phone_work)
                    && vm.matterOverviewData.matterInfo.referred_by_data.contactid == contactid) ?
                    vm.matterOverviewData.matterInfo.referred_by_data.phone_work.split(',')[0]
                    : vm.matterOverviewData.matterInfo.referred_by_data.phone_work.split(',')[0];

            vm.matterOverviewData.matterInfo.referred_to_data.phone_number =
                (utils.isNotEmptyVal(vm.matterOverviewData.matterInfo.referred_to_data.phone_number)
                    && vm.matterOverviewData.matterInfo.referred_to_data.contactid == contactid) ?
                    vm.matterOverviewData.matterInfo.referred_to_data.phone_number.split(',')[0]
                    : vm.matterOverviewData.matterInfo.referred_to_data.phone_number.split(',')[0];
            //work phone
            vm.matterOverviewData.matterInfo.referred_to_data.phone_work =
                (utils.isNotEmptyVal(vm.matterOverviewData.matterInfo.referred_to_data.phone_work)
                    && vm.matterOverviewData.matterInfo.referred_to_data.contactid == contactid) ?
                    vm.matterOverviewData.matterInfo.referred_to_data.phone_work.split(',')[0]
                    : vm.matterOverviewData.matterInfo.referred_to_data.phone_work.split(',')[0];
        }

        function getValuation(matterId) {
            var addvaluationURL = globalConstants.webServiceBase + 'matter/matter_valuation/' + matterId;
            var url = addvaluationURL + ".json";
            $http.get(url).then(function (response) {
                vm.valuationInfo = response.data;
                if (!vm.valuationInfo.matter_id) {
                    vm.valuationInfo.injury = 0;
                    vm.valuationInfo.expected_value = null;
                    vm.errorFlag = true;
                }
                vm.valuationInfo.expected_value = isNaN(vm.valuationInfo.expected_value) ? null : vm.valuationInfo.expected_value;
            }, function (error) {

            });
        }

        function getEvidencePhotos() {
            matterFactory.getEvidencePhotos(matterId)
                .then(function (response) {
                    vm.photos = response.data.photos;

                    /*update the isPDF property for each photo doc */
                    _.forEach(vm.photos, function (evd) {
                        evd.isPDF = ((evd.documentname).endsWith('.pdf')) || ((evd.documentname).endsWith('.PDF')) ? true : false;
                    });

                })
        }

        //motion accordion
        function getMotionDetilas() {
            matterFactory.getMotionDetails(matterId)
                .then(function (response) {
                    if (angular.isDefined(response) && angular.isDefined(response.data)) {
                        if (angular.isDefined(response.data.served_on_us)) {
                            _.forEach(response.data.served_on_us.data, function (item) {
                                item.motion_datereturnable = item.motion_datereturnable == 0 ? "-" : moment.unix(item.motion_datereturnable).utc().format('MM/DD/YYYY');
                                item.motion_title = item.motion_title == '' ? "-" : item.motion_title;
                            });
                            vm.motionServedOnUs = response.data.served_on_us;
                        }
                        if (angular.isDefined(response.data.served_by_us)) {
                            _.forEach(response.data.served_by_us.data, function (item) {
                                item.motion_datereturnable = item.motion_datereturnable == 0 ? "-" : moment.unix(item.motion_datereturnable).utc().format('MM/DD/YYYY');
                                item.motion_title = item.motion_title == '' ? "-" : item.motion_title;
                            });
                            vm.motionServedByUs = response.data.served_by_us;
                        }
                    }

                }, function (error) {
                    notification.error('unable to fetch motion detail. Reason: ' + error.statusText);
                });
        }

        //motion redirect to document page
        function redirectToDocument(matterId, documentId) {
            $state.go('document-view', { "matterId": matterId, "documentId": documentId });

        }

        /*us#7001.......need to implement global contact for future purpose..*/
        function getContactCardforProvider(contact) {
            if (!utils.isEmptyVal(contact)) {
                contactFactory.displayContactCard1(contact.insuranceproviderid, contact.edited, contact.contact_type);
                contact.edited = false;
            }
        }

        /* end */
        // vm.getContact = {};
        function getContactCard(contact) {
            if (contact.contactid == null) {
                return;
            }
            if (!utils.isEmptyVal(contact)) {
                // vm.getContact = contact;
                contactFactory.displayContactCard1(contact.contactid, contact.edited, contact.contact_type);
                contact.edited = false;
            }
        }

        //set email signature
        function getUserEmailSignature() {
            mailboxDataService.emailSignature()
                .then(function (data) {
                    if (utils.isNotEmptyVal(data.data)) {
                        vm.signature = data.data[0];
                        vm.signature = '<br/><br/>' + vm.signature;
                    }
                });
        }

        //US#8330
        $scope.$on('composeEmailFromContact', function (event, data) {
            if (!(window.isDrawerOpen)) {
                vm.compose = true;
                var html = "";
                html += (vm.signature == undefined) ? '' : vm.signature;
                vm.composeEmail = html;
                $rootScope.updateComposeMailMsgBody(vm.composeEmail, '', '', '', 'contactEmail', data);
            }
        });

        //US#8330
        $rootScope.$on("callCloseComposeMail", function () {
            closeComposeMail();
        });

        //US#8330
        function closeComposeMail() {
            vm.compose = false;
        }

        function printMatterOverview() {
            matterFactory.getValuationData(matterId)
                .then(function (res) {
                    var matterOverviewData = angular.copy(vm.matterOverviewData);
                    matterOverviewData.motionServedByUs = vm.motionServedByUs;
                    matterOverviewData.motionServedOnUs = vm.motionServedOnUs;
                    matterOverviewData.valuation = res.data;
                    matterOverviewData.plaintiffContact = vm.plaintiffsContact;
                    matterOverviewData.defendentContact = vm.defendentContact;
                    matterOverviewData.adjusterContact = vm.adjusterContact;

                    matterOverviewData.bodilyInjuries = vm.bodilyInjuries;
                    matterOverviewData.medicalBillsTotal = vm.medicalBillsTotal;
                    matterOverviewData.liensTotal = vm.liensTotal;
                    matterOverviewData.expensesListTotal = vm.expensesListTotal;
                    matterOverviewData.settlementTotal = vm.settlementTotal;

                    var printPage = matterFactory.printMatterOverview(matterOverviewData);
                    window.open().document.write(printPage);
                });

        }

        $scope.$on('contactCardEdited', function (e, editedContact) {
            var contactObj = editedContact;
            setEditedContact(contactObj);
            //updatePhoneNumbers(vm.matterOverviewData, contactObj.contactid);
            //setPhoneNumbers(vm.matterOverviewData);
            var contactEdited = true;
            getMatterOverview(contactEdited);
        });

        function setEditedContact(contactObj) {

            _.forEach(vm.plaintiffsContact.data, function (plaintiff) {
                if (utils.isNotEmptyVal(plaintiff)) {
                    setNameAndTelephone(plaintiff.contactid, contactObj);
                }
            });

            _.forEach(vm.defendentContact.data, function (defendants) {
                if (utils.isNotEmptyVal(defendants.defendant)) {
                    setNameAndTelephone(defendants.defendant, contactObj);
                }
            });


            _.forEach(vm.defendentContact.data, function (attorney) {
                if (utils.isNotEmptyVal(attorney.defendant_attorney)) {
                    setNameAndTelephone(attorney.defendant_attorney, contactObj);
                }
            });
            _.forEach(vm.defendentContact.data, function (defendant) {
                if (utils.isNotEmptyVal(defendant)) {
                    setNameAndTelephone(defendant, contactObj);
                }
            });

            _.forEach(vm.adjusterContact.insurance_adjuster, function (adjuster) {
                if (utils.isNotEmptyVal(adjuster.contactid)) {
                    setNameAndTelephone(adjuster, contactObj);
                }
            });

            setNameAndTelephone(vm.matterOverviewData.matterInfo.referred_by_data, contactObj);
            setNameAndTelephone(vm.matterOverviewData.matterInfo.referred_to_data, contactObj);
        }

        function setNameAndTelephone(contactToCheck, contactObj) {

            if (contactToCheck.contactid === contactObj.contactid) {
                contactToCheck.searchlabel = contactFactory.getNameForContact(contactObj);
                contactToCheck.phone_number = contactObj.phone;
                contactToCheck.phone_work = contactObj.phone_work;
                contactToCheck.phone_cell = contactObj.cell_work;
                contactToCheck.home = contactObj.home_work;
                contactToCheck.edited = true;
            }
        }

        function getNoteClass(noteCategoryID) {
            if (noteCategoryID == 1)
                return "attorney";
            else if (noteCategoryID == 2)
                return "client-communication";
            else if (noteCategoryID == 4)
                return "deposition";
            else if (noteCategoryID == 7)
                return "insurance";
            else
                return "uncategorized";
        };

        function getNoteIcon(noteCategoryID) {
            if (noteCategoryID == 1)
                return "default-attorney";
            else if (noteCategoryID == 2)
                return "default-client-communication";
            else if (noteCategoryID == 7)
                return "default-insurance";
            else
                return "";
        };

        // delete matter
        function deleteMatter(matterId) {

            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                headerText: 'Delete ?',
                bodyText: 'Are you sure you want to delete ?'
            };

            //confirm before delete
            modalService.showModal({}, modalOptions).then(function () {
                var promesa = matterFactory.deleteMatters(matterId);
                promesa.then(function (data) {
                    notification.success('Matter deleted successfully');
                    $state.go("matter-list", {});
                }, function (error) {
                    notification.error('Unable to delete');
                });
            });

        };

        function openImgeGallery(img, photos) {
            var modal = $modal.open({
                templateUrl: 'app/matter/matter-overview/evidence-gallery/evidence-gallery.html',
                controller: 'EvidenceGallery as evidenceGallery',
                windowClass: 'gallery',
                resolve: {
                    evidenceInfo: function () {
                        return {
                            selected: img,
                            evidences: photos
                        }
                    }
                }
            });
        }

        /*Valuation*/
        function valuation() {
            var modal = $modal.open({
                templateUrl: 'app/matter/matter-overview/matter-valuation/valuation.html',
                windowClass: 'valuation-window',
                controller: 'valuation as valuation',
                backdrop: 'static',
                keyboard: false
            });
            modal.result.then(function (updateVal) {
                vm.valuationInfo.expected_value = updateVal.expected_value;
            });

        }

        /** 
         * Function to open Modal Popup for Client Communicator
        */
        function clientCommunicator() {
            var modal = $modal.open({
                templateUrl: 'app/matter/matter-overview/client-communicator/client-config.html',
                windowClass: 'valuation-window',
                controller: 'ClientConfigCtrl as clientCtrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    plaintiffsCount: function () {
                        return vm.matterOverviewData.plaintiffsCount;
                    }
                }
            });
            modal.result.then(function (updateVal) {
                vm.matterOverviewData.enabledClientsCount = updateVal.enabled_count;
                vm.matterOverviewData.plaintiffsCount = updateVal.total_count;
            });
        }

        /**/
        function goToEvent(data) {
            var newData = modifyEventObj(data);
            eventsHelper.setSelectedEvent(newData);
            $state.go('events', { matterId: matterId });
        }

        function modifyEventObj(data) {
            var assigned_to = [];
            if (data && data.assigned_to) {
                _.forEach(data.assigned_to, function (item) {
                    var a = {};
                    a.full_name = item.fname;
                    a.user_name = item.name;
                    a.user_id = item.uid;
                    assigned_to.push(a);
                });
            }

            if (data && data.remind_users && (data.remind_users instanceof Array)) {
                var remind_users = [];
                _.forEach(data.remind_users, function (item) {
                    remind_users.push(item);
                });
                data.remind_users = JSON.stringify(remind_users);
            }

            if (data) {
                var newEventObj = {
                    DeadlineDatesClicked: data.DeadlineDatesClicked,
                    all_day: parseInt(data.allday),
                    assigned_to: assigned_to,
                    comments: data.comments,
                    criticalDatesClicked: data.criticalDatesClicked,
                    custom_reminder: data.custom_reminder,
                    // end: data.end,
                    is_critical: parseInt(data.is_critical),
                    is_deadline: parseInt(data.is_deadline),
                    is_comply: (data.isComply) ? data.isComply : "0",
                    is_task_created: parseInt(data.istaskcreated),
                    label_id: data.label_id,
                    labelid: data.label_id,
                    matter: {
                        matter_id: data.matterid
                    },
                    private: data.private,
                    remind_date: data.remind_date,
                    reminder_days: data.reminderdays,
                    reminder_users: data.remind_users,
                    // start: data.start,
                    title: data.title,
                    user_defined: data.user_defined,
                    end: data.utcend,
                    start: data.utcstart,
                    reason: data.reason,
                    share_with: data.share_with ? data.share_with : [],
                    event_id: data.id,
                    location: data.location,
                    description: data.description
                }

                return newEventObj;

            }
        }

        function viewAllOverdueTasks() {
            vm.overdueLimit = vm.matterOverviewData.overdueTasks.length;
        }

        /*Modal popup for Archival*/
        function showArchivePopup(selectedMatter) {
            var modalInstance = $modal.open({
                templateUrl: "app/matter/matter-list/partials/archived-popup.html",
                controller: 'ArchivePopupCtrl',
                windowClass: 'medicalIndoDialog',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    matterstoArchive: function () {
                        var matterArray = [];
                        matterArray.push(selectedMatter.matter_id);
                        return matterArray;
                    }
                }

            });

            modalInstance.result.then(function () {

            }, function () {
            });

        }


        function getMatterCollaboratedEntity() {

            matterFactory.getMatterCollaboratedEntity(vm.matterId, vm.firmIDForMatterCollaboration)
                .then(function (data) {
                    localStorage.setItem('getMatterCollaboratedEntity', JSON.stringify(data));
                }, function (data) {
                    notification.error('Error ');
                });
        }
    }

})();

